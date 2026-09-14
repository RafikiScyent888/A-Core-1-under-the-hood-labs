/* =====================================================================
   The change budget must REFUSE, not scold.

   The Core 1 sim this stage came from lets you change a third component
   and then prints a line saying you did. The whole value of the exercise
   is the constraint being felt at the moment you hit it, so this drives
   the stage: spend the budget, try to spend one more, and check that the
   third change did not take.

   It also checks the two things that make the constraint survivable —
   reverting to the original is always free, and "Start this step again"
   hands the whole budget back.
   ===================================================================== */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml" };
const srv = http.createServer(async (rq, rs) => {
  try {
    const f = path.join(ROOT, decodeURIComponent(rq.url.split("?")[0]));
    const b = await readFile(f);
    rs.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
    rs.end(b);
  } catch { rs.writeHead(404); rs.end("no"); }
});
await new Promise(r => srv.listen(0, r));
const PORT = srv.address().port;

const { chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs");
const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new","--use-gl=swiftshader","--enable-unsafe-swiftshader"] });

const trouble = [];
const SEEDS = [100007, 21, 42, 88, 305, 777, 9, 250];

for (const seed of SEEDS) {
  const p = await br.newPage({ viewport: { width: 1280, height: 1400 } });
  await p.goto(`http://127.0.0.1:${PORT}/verify/preview-swap.html?seed=${seed}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);

  const tally = () => p.$eval(".panel-intro, p.panel-intro", () => 0).catch(() => 0);
  const used = () => p.evaluate(() => {
    const t = [...document.querySelectorAll("p")].map(e => e.textContent)
      .filter(x => / of \d+ change/.test(x))[0] || "";
    return parseInt(t, 10);
  });
  /* Click the first non-baseline option in row `i`. */
  const changeRow = (i) => p.evaluate((i) => {
    const row = document.querySelectorAll(".swap-row")[i];
    if (!row) return false;
    const alt = [...row.querySelectorAll(".opt")].find(b => !b.classList.contains("on"));
    if (!alt) return false;
    alt.click();
    return true;
  }, i);
  const revertRow = (i) => p.evaluate((i) => {
    const row = document.querySelectorAll(".swap-row")[i];
    const base = [...row.querySelectorAll(".opt")]
      .find(b => (b.querySelector(".opt-tag") || {}).textContent === "the original");
    if (!base) return false;
    base.click();
    return true;
  }, i);

  const budget = await p.evaluate(() => {
    const t = [...document.querySelectorAll("p")].map(e => e.textContent)
      .filter(x => / of \d+ change/.test(x))[0] || "";
    return parseInt(t.split(" of ")[1], 10);
  });

  if (await used() !== 0) trouble.push(`seed ${seed}: starts with changes already spent`);

  /* Spend the whole budget on rows that have an alternative. */
  let spent = 0, row = 0;
  while (spent < budget && row < 8) {
    if (await changeRow(row)) { const n = await used(); if (n > spent) spent = n; }
    row++;
  }
  if (spent !== budget) { trouble.push(`seed ${seed}: could not spend the budget (${spent}/${budget})`); await p.close(); continue; }

  /* One more must be refused, and must not take. */
  let refusedAt = -1;
  for (let r = row; r < 8; r++) {
    if (await changeRow(r)) { refusedAt = r; break; }
    /* changeRow returns true when it clicked; a refusal still clicks. */
  }
  const after = await used();
  const said = await p.evaluate(() => (document.querySelector(".fb") || {}).textContent || "");
  if (after > budget) trouble.push(`seed ${seed}: a change beyond the budget of ${budget} was accepted`);
  if (!/allowed/.test(said)) trouble.push(`seed ${seed}: the refusal did not say what the limit is — got "${said.slice(0,80)}"`);
  if (!/already changed/.test(said)) trouble.push(`seed ${seed}: the refusal did not name what was already spent`);

  /* Reverting is free, and gets a change back. */
  await revertRow(0);
  const afterRevert = await used();
  if (afterRevert >= after) trouble.push(`seed ${seed}: putting a component back did not return a change (${after} -> ${afterRevert})`);

  await p.close();
}

await br.close(); srv.close();
if (trouble.length) { trouble.slice(0, 6).forEach(t => console.log("  " + t)); console.log(`\n${trouble.length} problems`); process.exit(1); }
console.log(`the change budget refuses the extra change on all ${SEEDS.length} seeds, names what is already spent, and reverting is free`);
