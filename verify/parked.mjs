/* THE STORAGE ROOM: put a job down, leave, come back, pick it up.

   THE CLAIM WORTH CHECKING IS NOT "a button exists". It is that the job
   which comes back is THE SAME JOB — same seed, same stage, and the
   questions already answered still answered. A shelf that loses the
   student's place is worse than no shelf, because they will have trusted
   it with an hour.

   Driven end to end through the real UI, because every part of this
   crosses a boundary: localStorage, a module reload, and a runner built
   from scratch with a resume block. --calibrate breaks the restore and
   requires the check to notice. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAL = process.argv.includes("--calibrate");
const BREAK = "    if (typeof r.at === \"number\") at = Math.max(0, Math.min(stages.length - 1, r.at));";
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  let body = readFileSync(p);
  if (CAL && rel === "/assets/runner.js") {
    const src = String(body);
    if (src.indexOf(BREAK) === -1) {
      console.log("CALIBRATION CANNOT RUN: the line it breaks is gone from runner.js");
      process.exit(1);
    }
    body = Buffer.from(src.replace(BREAK, "    /* calibration: the stage is not restored */"));
  }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" });
  r.end(body);
});
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
  await p.selectOption("#length", "project");
  await p.waitForTimeout(120);
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });

  /* walk a few stages in, answer one thing, then put it down */
  const total = await p.evaluate(() => window.__UTHL.running().stageCount());
  const stopAt = Math.min(3, total - 1);
  await p.evaluate((n) => window.__UTHL.running().go(n), stopAt);
  await p.waitForTimeout(150);
  /* a wrong answer, so the attempt count has something in it to carry */
  await p.evaluate(() => {
    const w = [...document.querySelectorAll(".opts .opt")].filter(x => !x.disabled);
    if (w.length) w[w.length - 1].click();
  });
  await p.waitForTimeout(80);
  const before = await p.evaluate(() => {
    const r = window.__UTHL.running();
    return { seed: r.snapshot().seed, at: r.stageIndex(),
             answered: Object.keys(r.answered()).length,
             attempts: JSON.stringify(r.attempts()) };
  });

  const parkBtn = await p.$(".btn.park");
  if (!parkBtn) { console.log("  " + lab.padEnd(8) + "NO PARK BUTTON"); bad++; await p.close(); continue; }
  await parkBtn.click();
  /* it returns to the front page and scrolls to the shelf */
  const back = await p.waitForFunction(() => !document.body.classList.contains("running"),
    { timeout: 8000 }).then(()=>true).catch(()=>false);
  const onShelf = await p.evaluate(() => document.querySelectorAll(".shelf-job").length);

  /* RELOAD, because a shelf that only survives in memory is not a shelf */
  await p.reload();
  await p.waitForTimeout(400);
  const afterReload = await p.evaluate(() => document.querySelectorAll(".shelf-job").length);
  const pick = await p.$(".shelf-job .btn.primary");
  if (!pick) { console.log("  " + lab.padEnd(8) + "NOT ON THE SHELF AFTER A RELOAD"); bad++; await p.close(); continue; }
  await pick.click();
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
  await p.waitForTimeout(150);
  const after = await p.evaluate(() => {
    const r = window.__UTHL.running();
    return { seed: r.snapshot().seed, at: r.stageIndex(),
             answered: Object.keys(r.answered()).length,
             attempts: JSON.stringify(r.attempts()) };
  });

  const trouble = [];
  if (!back) trouble.push("parking did not return to the front page");
  if (onShelf < 1 || afterReload < 1) trouble.push("not on the shelf (" + onShelf + " before reload, " + afterReload + " after)");
  if (after.seed !== before.seed) trouble.push("came back as a different job: seed " + before.seed + " -> " + after.seed);
  if (after.at !== before.at) trouble.push("came back at stage " + after.at + ", left at " + before.at);
  if (after.answered !== before.answered) trouble.push("answered " + before.answered + " -> " + after.answered);
  if (after.attempts !== before.attempts) trouble.push("the hint ladder lost its place: " + before.attempts + " -> " + after.attempts);
  if (errs.length) trouble.push("page error: " + errs[0]);
  if (trouble.length) bad++;
  console.log("  " + lab.padEnd(8) + "left at stage " + before.at + " of " + total + "  " +
    (trouble.length ? "FAIL — " + trouble.join("; ") : "came back identical, seed and hint ladder intact"));
  await p.close();
}
await b.close(); srv.close();
console.log("");
if (CAL) {
  if (bad >= 6) console.log("calibration OK — " + bad + " of " + LABS.length +
    " labs lose their place when the stage is not restored");
  else { console.log("CALIBRATION FAILED — only " + bad + " noticed; the check cannot fail"); process.exit(1); }
} else if (bad) { console.log(bad + " lab(s) do not survive the storage room"); process.exit(1); }
else console.log("all " + LABS.length + " labs: put down, reloaded, picked up identical");
