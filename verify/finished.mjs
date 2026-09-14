/* THE FINISHED SHELF: a job that is done is written down, and it stops
   pretending to be waiting.

   The storage room held only work that had been PUT DOWN. A student who
   had finished four labs and parked none opened the front page to an
   empty shelf — the score was shown once, on the last screen, and then
   the tab was closed and it was gone.

   FOUR CLAIMS, AND THE THIRD IS A BUG THIS FOUND RATHER THAN A FEATURE
   IT ADDS:

     RECORDED   finishing a job puts it on the finished shelf, with the
                job's own NAME on it and its score, and it is still there
                after a reload. A record that lives in memory is not a
                record.

     DROPPED    finishing a job that was PARKED takes it off the parked
                shelf. Before this, a student could park a job, come
                back, pick it up, finish it — and the half-done copy sat
                on the shelf for ever, inviting them back into work they
                had already completed. The two shelves are one job in two
                states and only one of them can be true at a time.

     THE SAME JOB   "Do it again" reopens the SAME SEED, because a seed
                is what a job IS in this build and the record would be
                worthless if the button beside it opened something else.

     THE BETTER SCORE WINS   doing a job again with a worse score keeps
                the better one. The reason to repeat a lab is to do it
                better, and a record that overwrote 11/12 with 6/12 would
                punish exactly that.

   --calibrate breaks the wiring at TWO points, because the first two
   claims fail independently: the shell's `onDone` hook, and the drop of
   the parked copy inside `finish`. A single break would leave one arm
   untested and looking green. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAL = process.argv.includes("--calibrate");

/* The two lines the calibration cuts. Both are checked for before the run
   rather than replaced blindly: a calibration that silently plants
   nothing reports a clean pass and proves the opposite of what it claims. */
const CUT_RECORD = "      return SHELF.finish(Object.assign({}, snap, { length: length, name: name }));";
const CUT_DROP = "  drop(job.lab);";

const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  let body = readFileSync(p);
  if (CAL && rel === "/assets/app.js") {
    const src = String(body);
    if (src.indexOf(CUT_RECORD) === -1) {
      console.log("CALIBRATION CANNOT RUN: the onDone line is gone from app.js");
      process.exit(1);
    }
    body = Buffer.from(src.replace(CUT_RECORD, "      return false; /* calibration: nothing recorded */"));
  }
  if (CAL && rel === "/assets/storage.js") {
    const src = String(body);
    if (src.indexOf(CUT_DROP) === -1) {
      console.log("CALIBRATION CANNOT RUN: the parked-drop line is gone from storage.js");
      process.exit(1);
    }
    body = Buffer.from(src.replace(CUT_DROP, "  /* calibration: the parked copy is left behind */"));
  }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" });
  r.end(body);
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

const LABS = ["printer", "build", "raid", "power", "wap", "mobile", "net", "display"];
let bad = 0;

for (const lab of LABS) {
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.click("#tab-" + lab);
  /* QUICK, because this check is about what happens at the END and the
     shortest path there is the honest one to take. The stages walked are
     not what is being tested; the finish is. */
  await p.selectOption("#length", "quick");
  await p.waitForTimeout(120);
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
  const seed = await p.evaluate(() => window.__UTHL.running().snapshot().seed);

  /* PARK IT FIRST, so the DROPPED arm has something to drop. This is the
     exact sequence a real student follows — start, put down, pick up,
     finish — and it is the one that was broken. */
  const park = await p.$(".btn.park");
  if (park) {
    await park.click();
    await p.waitForFunction(() => !document.body.classList.contains("running"), { timeout: 8000 })
      .catch(() => {});
    const pick = await p.$(".shelf-job .btn.primary");
    if (pick) {
      await pick.click();
      await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
    }
  }
  const parkedBefore = await p.evaluate(() => {
    try { return Object.keys(JSON.parse(localStorage.getItem("uthl.parked.v1") || "{}")).length; }
    catch (e) { return -1; }
  });

  /* To the last stage, then Finish. The button nudges once when questions
     are open and advances on the second press — that is the authored
     behaviour ("nudging is right; trapping a stuck student is not"), so
     this presses twice rather than answering everything. */
  const n = await p.evaluate(() => window.__UTHL.running().stageCount());
  await p.evaluate((k) => window.__UTHL.running().go(k), n - 1);
  await p.waitForTimeout(200);
  await p.click(".nav .btn.primary");
  await p.waitForTimeout(150);
  const still = await p.$(".nav .btn.primary");
  if (still) { await still.click(); await p.waitForTimeout(150); }

  const doneScreen = await p.$(".done");
  const kept = await p.$eval(".done-kept", (n2) => n2.textContent).catch(() => "");

  /* back to the workshop through the button the finish screen offers */
  const out = await p.$(".done .btn:not(.primary)");
  if (out) await out.click();
  await p.waitForTimeout(300);
  /* AND RELOAD. A shelf that only survives in memory is not a shelf. */
  await p.reload();
  await p.waitForTimeout(500);

  const state = await p.evaluate(() => {
    let parked = -1, fin = [];
    try { parked = Object.keys(JSON.parse(localStorage.getItem("uthl.parked.v1") || "{}")).length; } catch (e) {}
    try { fin = Object.values(JSON.parse(localStorage.getItem("uthl.finished.v1") || "{}")); } catch (e) {}
    return {
      parked: parked,
      rows: document.querySelectorAll(".shelf-done").length,
      names: [...document.querySelectorAll(".shelf-done h4")].map((x) => x.textContent),
      stored: fin.map((f) => ({ lab: f.lab, seed: f.seed, name: f.name, right: f.right,
                                total: f.total, runs: f.runs }))
    };
  });

  /* THE BETTER SCORE WINS — tested against the module directly, because
     producing a genuinely worse run through the UI means deliberately
     answering wrongly on every question of every lab, which is a much
     bigger and much more brittle thing to drive for a claim that is one
     line of arithmetic. The UI arms above prove the path; this proves the
     rule on the path's own storage. */
  const better = await p.evaluate(async (s) => {
    const S = await import("/assets/storage.js");
    S.finish({ lab: "__probe", seed: s, right: 9, total: 10, name: "A probe job" });
    S.finish({ lab: "__probe", seed: s, right: 2, total: 10, name: "A probe job" });
    const row = S.done().filter((j) => j.lab === "__probe")[0] || {};
    const got = { right: row.right, runs: row.runs };
    /* leave nothing behind for the next arm to trip over */
    const all = JSON.parse(localStorage.getItem("uthl.finished.v1") || "{}");
    delete all["__probe/" + s];
    localStorage.setItem("uthl.finished.v1", JSON.stringify(all));
    return got;
  }, seed);

  const trouble = [];
  if (!doneScreen) trouble.push("never reached the finish screen");
  if (parkedBefore !== 1) trouble.push("the job was not parked to begin with (" + parkedBefore + ")");
  if (!state.stored.length) trouble.push("nothing was recorded");
  else {
    const rec = state.stored[0];
    if (rec.seed !== seed) trouble.push("recorded seed " + rec.seed + ", ran " + seed);
    if (!rec.name) trouble.push("recorded with no job name");
    if (typeof rec.total !== "number" || rec.total < 1) trouble.push("recorded no question total");
  }
  if (state.parked !== 0) trouble.push("the parked copy is still on the shelf");
  if (!state.rows) trouble.push("no finished row on the page after a reload");
  if (!/finished shelf/.test(kept)) trouble.push("the finish screen did not say it was kept");
  if (better.right !== 9 || better.runs !== 2) {
    trouble.push("best score not kept: " + JSON.stringify(better));
  }
  if (errs.length) trouble.push("page error: " + errs[0]);

  if (trouble.length) bad++;
  console.log("  " + lab.padEnd(8) +
    (trouble.length ? "FAIL — " + trouble.join("; ")
      : "recorded as \"" + (state.names[0] || "?") + "\", parked copy gone, survives a reload"));
  await p.close();
}

/* THE SAME JOB COMES BACK. Done once rather than per lab: it is a claim
   about the button, not about any lab's content, and starting eight more
   labs to prove one wiring costs a minute for nothing. */
let againSaid = "";
{
  const p = await b.newPage({ viewport: { width: 1200, height: 1000 } });
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.click("#tab-power");
  await p.selectOption("#length", "quick");
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
  const seed = await p.evaluate(() => window.__UTHL.running().snapshot().seed);
  const n = await p.evaluate(() => window.__UTHL.running().stageCount());
  await p.evaluate((k) => window.__UTHL.running().go(k), n - 1);
  await p.waitForTimeout(150);
  await p.click(".nav .btn.primary"); await p.waitForTimeout(120);
  const s2 = await p.$(".nav .btn.primary"); if (s2) { await s2.click(); await p.waitForTimeout(150); }
  const out = await p.$(".done .btn:not(.primary)"); if (out) await out.click();
  await p.waitForTimeout(400);
  const again = await p.$(".shelf-done .btn");
  if (!again) { againSaid = "there is no \"Do it again\" button"; }
  else {
    await again.click();
    await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
    const seed2 = await p.evaluate(() => window.__UTHL.running().snapshot().seed);
    againSaid = seed2 === seed ? "" : "reopened seed " + seed2 + ", recorded " + seed;
  }
  console.log("  " + "again".padEnd(8) +
    (againSaid ? "FAIL — " + againSaid : "\"Do it again\" reopens the same seed (" + seed + ")"));
  if (againSaid) bad++;
  await p.close();
}

await b.close(); srv.close();
console.log("");
if (CAL) {
  if (bad >= LABS.length) {
    console.log("calibration OK — " + bad + " runs notice when the record and the drop are cut");
  } else {
    console.log("CALIBRATION FAILED — only " + bad + " noticed; the check cannot fail");
    process.exit(1);
  }
} else if (bad) {
  console.log(bad + " run(s) do not record a finished job properly");
  process.exit(1);
} else {
  console.log("all " + LABS.length + " labs: finished, named, scored, taken off the parked shelf, " +
    "and still there after a reload");
}
