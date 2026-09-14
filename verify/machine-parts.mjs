/* THE ELEVEN MACHINES HAVE NAMED PARTS, AND A STUDENT CAN REACH THEM.

   The model dock puts the lab's own machine in front of the student on
   every step that has no bench of its own — which is thirteen stages
   across the eight labs, and every brief, table and calculation in the
   build. For most of this build's life that machine was ONE part:
   "Power supply / on the bench". The picture was present and the machine
   was not interrogable, and those are different things.

   TWO ARMS, AND THE SECOND IS THE ONE THAT MATTERS.

     DECLARED   every machine's geometry is fully claimed by its
                MACHINE_PARTS table — no primitive drawn without a
                control, no control pointing at nothing, no two parts
                sharing a colour without saying why.

     REACHED    a real student, in a real lab, in a browser, gets those
                controls. "Written and reachable are different claims" is
                this repo's own rule and it has been paid for twice: a
                whole showroom that nothing imported, and a cracked
                screen that was drawn, verified, documented and set by a
                flag no scenario ever set.

   --calibrate plants six defects, one per arm of the load-time check,
   and requires every one of them to fire. The checks live in
   bench-room.js next to the geometry they describe — a shared verifier
   that reaches into one module's constants breaks the moment there is a
   second module — so the calibration edits a COPY of that source and
   imports it, which is the only way to plant a defect in a load-time
   assertion without touching the shipped file. */
import { createServer } from "http";
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "assets", "bench-room.js");
const CAL = process.argv.includes("--calibrate");

/* ---------------------------------------------------------------------
   ARM 1 — DECLARED
   --------------------------------------------------------------------- */
const R = await import(pathToFileURL(SRC).href);
let bad = 0, total = 0;
for (const m of R.SHOWROOM) {
  let line;
  try {
    const spec = R.machineBench(m.key);
    const rows = R.MACHINE_PARTS[m.key];
    const tags = spec.parts.map((p) => p.key.split("/")[1]);
    total += spec.parts.length;
    const trouble = [];
    /* the table's order is the control order a student reads */
    if (tags.join(",") !== rows.map((r) => r.tag).join(",")) {
      trouble.push("control order is " + tags.join(",") + ", table says " +
        rows.map((r) => r.tag).join(","));
    }
    /* ONE PART IS NOT A MACHINE A STUDENT CAN ASK ANYTHING OF. Two is
       the floor this check exists to hold; every machine here carries
       at least three. */
    if (spec.parts.length < 2) trouble.push("only " + spec.parts.length + " part");
    /* every control has to SAY something worth reading. A control whose
       detail is its own label back again is a button with no content,
       and that is what the single-part dock was. */
    spec.parts.forEach(function (p) {
      if (!p.spec || p.spec.length < 40) trouble.push(p.key + " has no real detail");
      if (p.spec === p.label) trouble.push(p.key + " just repeats its label");
    });
    if (trouble.length) { bad++; line = "FAIL — " + trouble.join("; "); }
    else line = String(spec.parts.length).padStart(2) + " named parts: " + tags.join(", ");
  } catch (e) { bad++; line = "THREW — " + e.message.slice(0, 110); }
  console.log("  " + m.key.padEnd(16) + line);
}

/* ---------------------------------------------------------------------
   The calibration: six defects, one per arm of the load-time check.

   Each is a STRING EDIT to a copy of bench-room.js, because the checks
   run at module load and inside machineBench — there is nowhere to reach
   in from outside and break them. The edit has to be something a person
   could plausibly do, not a nonsense token: a tag renamed, a row
   deleted, a colour "tidied" to one that is already used.
   --------------------------------------------------------------------- */
const DEFECTS = [
  ["an untagged primitive",
   '{ part: "tray", shape: "rbox", size: [w - 1.4, 2.2, 1.6]',
   '{ shape: "rbox", size: [w - 1.4, 2.2, 1.6]'],
  ["a tag with no row in the table",
   '{ part: "well", shape: "rbox", size: [w - 3.2, 1.1, d - 3.4]',
   '{ part: "outputwell", shape: "rbox", size: [w - 3.2, 1.1, d - 3.4]'],
  /* A ROW ADDED, not renamed. Renaming one plants TWO defects at once —
     the row loses its geometry AND the geometry loses its row — and the
     orphaned-tag arm fires first, so the arm this defect is named after
     is never reached. A calibration that is caught by the wrong check is
     a calibration that proves nothing about the right one. */
  ["a row with no geometry",
   '{ tag: "lamps", label: "The status lamps", on: "body", colour: "green", finish: "plastic",',
   '{ tag: "brick", label: "The power brick", on: "body", colour: "red", finish: "plastic",\n' +
   '      spec: "A row for a part that is not on this machine at all, planted by the calibration." },\n' +
   '    { tag: "lamps", label: "The status lamps", on: "body", colour: "green", finish: "plastic",'],
  ["a part the same value as the thing it sits on",
   '{ tag: "tray", label: "The paper tray", on: "body", colour: "alu"',
   '{ tag: "tray", label: "The paper tray", on: "body", colour: "laserBody"'],
  ["two parts on one machine sharing a colour",
   '{ tag: "lamps", label: "The bay lamps", on: "caddies", colour: "green"',
   '{ tag: "lamps", label: "The bay lamps", on: "caddies", colour: "alu"'],
  ["a row that does not say what it is seen against",
   '{ tag: "antennas", label: "The four antennas", on: "body", colour: "alu"',
   '{ tag: "antennas", label: "The four antennas", colour: "alu"']
];

if (CAL) {
  const raw = readFileSync(SRC, "utf8");
  const dir = mkdtempSync(join(tmpdir(), "uthl-cal-"));
  let fired = 0;
  for (let i = 0; i < DEFECTS.length; i++) {
    const [name, from, to] = DEFECTS[i];
    if (!raw.includes(from)) {
      console.log("  PLANT FAILED — cannot find the text for \"" + name + "\"");
      continue;
    }
    const f = join(dir, "d" + i + ".js");
    writeFileSync(f, raw.replace(from, to));
    let what = "";
    try {
      const M = await import(pathToFileURL(f).href);
      /* the tag checks live inside machineBench, so drive it */
      for (const m of M.SHOWROOM) M.machineBench(m.key);
    } catch (e) { what = e.message; }
    if (what) { fired++; console.log("  caught: " + name.padEnd(46) + what.slice(0, 90)); }
    else console.log("  MISSED: " + name + " — planted and nothing complained");
  }
  console.log("");
  if (fired === DEFECTS.length) {
    console.log("calibration OK — all " + fired + " planted defects fire");
  } else {
    console.log("CALIBRATION FAILED — " + fired + " of " + DEFECTS.length + " fired");
    process.exit(1);
  }
  process.exit(0);
}

if (bad) { console.log("\n" + bad + " machines have trouble"); process.exit(1); }
console.log("\n  " + total + " named parts across " + R.SHOWROOM.length + " machines, all declared");

/* ---------------------------------------------------------------------
   ARM 2 — REACHED. Drive a real lab and read the dock's controls.
   --------------------------------------------------------------------- */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }

const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" });
  r.end(readFileSync(p));
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

const LABS = ["printer", "build", "raid", "power", "wap", "mobile", "net", "display"];
const thin = [];
for (const labKey of LABS) {
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.click("#tab-" + labKey);
  await p.selectOption("#length", "project");
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
  const n = await p.evaluate(() => window.__UTHL.running().stageCount());

  /* FIND A RESTING STAGE. The dock marks itself `data-resting` when it
     is showing the lab's own machine rather than a stage's bench, and
     that flag exists because the suite's "benches mount" check was
     measuring the resting machine and calling it the lab's bench. Here
     it is what says which stages this check is about. */
  let best = null, bare = [];
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => window.__UTHL.running().go(k), i);
    await p.waitForFunction(() => !!document.querySelector(".model-dock canvas"), { timeout: 9000 })
      .catch(() => {});
    const seen = await p.evaluate(() => {
      const any = document.querySelector(".model-dock canvas");
      const box = document.querySelector(".model-dock[data-resting]");
      if (!box) return { resting: false, any: !!any };
      const rows = [...box.querySelectorAll(".bench-part-name, .bench-part")];
      const names = rows.map((r) => (r.textContent || "").trim()).filter(Boolean);
      const h = document.querySelector(".model-dock .panel-title");
      return { resting: true, any: !!any, stage: h ? h.textContent : "",
               count: names.length, names: names.slice(0, 3) };
    });
    if (!seen.any) bare.push(i);
    if (seen.resting && (!best || seen.count > best.count)) best = Object.assign({ at: i }, seen);
  }
  if (!best) {
    /* A LAB THAT NEVER RESTS IS NOT AN EXEMPTION, IT IS A DIFFERENT
       CLAIM, AND IT GETS CHECKED TOO.

       The Printer lab has a bench of its own on every one of its
       fifteen stages — "Every stage of the Printer lab shows the student
       something" is a rule that module's own selfCheck enforces — so the
       dock is never showing a resting machine there and there is nothing
       for this check to look at.

       The lazy answer would be a NO_REST exemption list keyed on the lab
       name, which is a thing somebody adds a lab to when it fails. So
       the alternative is VERIFIED instead of assumed: every stage must
       still have had a live canvas in the dock. A lab that neither rests
       nor benches is a lab showing the student nothing, which is the
       thing all of this was built to end. */
    const ok = bare.length === 0;
    console.log("  " + labKey.padEnd(9) + (ok
      ? "never rests — a bench of its own on all " + n + " stages"
      : "NEITHER rests NOR benches on stages " + bare.join(",")));
    if (!ok) thin.push(labKey + ": nothing on " + bare.length + " stages");
  } else {
    const ok = best.count >= 2;
    console.log("  " + labKey.padEnd(9) + "stage " + String(best.at).padStart(2) + "  " +
      best.stage.slice(0, 22).padEnd(24) + String(best.count).padStart(2) + " controls  " +
      (ok ? best.names.join(" / ").slice(0, 60) : "TOO FEW"));
    if (!ok) thin.push(labKey + ": " + best.count + " control");
  }
  await p.close();
}
await b.close(); srv.close();
console.log("");
if (thin.length) {
  console.log("THE MACHINE IS NOT INTERROGABLE ON: " + thin.join("  "));
  process.exit(1);
}
console.log("every lab's resting machine offers its named parts as real controls");
