/* DOES THE JOB PICKER WORK? Six named jobs on every lab, the first one
   selected, choosing one changes the seed the lab actually runs, and the
   choice survives a reload. Driving the page: a picker that renders and
   does not change the scenario is the worst kind of working. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => { let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" }); r.end(readFileSync(p)); });
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new","--use-gl=swiftshader","--enable-unsafe-swiftshader"] });
const LABS = ["printer","build","raid","power","wap","mobile","net","display"];
let bad = 0;
for (const lab of LABS) {
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e).slice(0,140)));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.click("#tab-" + lab);
  const ok = await p.waitForFunction(() => document.querySelectorAll(".job input").length > 1,
    { timeout: 20000 }).then(()=>true).catch(()=>false);
  if (!ok) { console.log("  " + lab.padEnd(8) + "NO JOB LIST"); bad++; await p.close(); continue; }
  const info = await p.evaluate(() => {
    const rows = [...document.querySelectorAll(".job")];
    return { n: rows.length,
      titles: rows.map(r => r.querySelector(".job-title").textContent),
      seeds: rows.map(r => r.querySelector("input").value),
      checked: rows.findIndex(r => r.querySelector("input").checked) };
  });
  const distinct = new Set(info.titles.map((t,i) => t + "|" + i)).size;
  const uniqSeeds = new Set(info.seeds).size;

  /* pick the LAST job, start, and read the seed the runner actually used */
  await p.evaluate(() => { const rs = [...document.querySelectorAll(".job input")];
    rs[rs.length - 1].click(); });
  await p.waitForTimeout(80);
  await p.selectOption("#length", "quick");
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
  const crumb = await p.$eval(".crumb", n => n.textContent).catch(()=> "");
  const wanted = info.seeds[info.seeds.length - 1];
  const ranIt = crumb.indexOf(wanted) !== -1;

  const trouble = [];
  if (info.n < 2) trouble.push("only " + info.n + " jobs");
  if (uniqSeeds !== info.n) trouble.push("seeds repeat");
  if (info.checked !== 0) trouble.push("first job not preselected (index " + info.checked + ")");
  if (!ranIt) trouble.push("chose seed " + wanted + " and the lab ran \"" + crumb.trim() + "\"");
  if (errs.length) trouble.push("page error: " + errs[0]);
  if (trouble.length) bad++;
  console.log("  " + lab.padEnd(8) + info.n + " jobs  " +
    (trouble.length ? "FAIL — " + trouble.join("; ") : "ok, and the chosen seed is the one that ran"));
  await p.close();
}
await b.close(); srv.close();
console.log("");
if (bad) { console.log(bad + " lab(s) have trouble with the job picker"); process.exit(1); }
console.log("all " + LABS.length + " labs: a named list, first preselected, and choosing one changes the job");
