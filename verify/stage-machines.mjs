/* =====================================================================
   WHICH STAGES PUT A MACHINE IN FRONT OF THE STUDENT, AND WHICH DO NOT.

   The suite's "benches mount" check walks each lab until it finds ONE
   bench and then stops. That proves a lab has 3D in it somewhere. It
   does not — and cannot — say whether the stage a student is on right
   now has anything to look at, which is the question the owner has
   actually been asking: "is everything built?"

   This drives EVERY stage of EVERY lab at project length, waits for the
   dynamic three.js import to land, and reports per stage whether a bench
   canvas is really on the page with controls beside it. Written and
   reachable are different claims; this one drives the page.

   NOT EVERY STAGE SHOULD HAVE A MACHINE, and pretending otherwise would
   push decoration into stages that are arithmetic or paperwork. Those
   are listed in NO_MACHINE with a reason each, the same discipline as the
   objective coverage map — dropping a machine has to be a decision
   somebody wrote down rather than something that happened quietly.

   usage: node verify/stage-machines.mjs [--list]
     --list prints the full per-stage table instead of only the failures.
   ===================================================================== */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) {
  try { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
  catch (e2) { console.error("Playwright not found."); process.exit(2); }
}
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIST = process.argv.includes("--list");
const CAL = process.argv.includes("--calibrate");

/* STAGES THAT ARE DELIBERATELY WITHOUT A MACHINE, and why. Every one of
   these is a stage where the work is arithmetic, a written decision, or
   a console a student would never meet as hardware — and where drawing
   something would be decoration standing in for a mechanism. */
const NO_MACHINE = {
  /* READING THE CUSTOMER. Every lab opens with one, and the whole skill
     is finding the requirement buried in the waffle. A model beside it
     would be scenery — there is no part in the room yet. */
  "build/brief":    "what are they building — the parts have not been chosen, let alone bought",
  "raid/brief":     "what do they need — read the customer, before any drive is specified",
  "power/brief":    "what must this machine survive — three sentences of conversation to sort",
  "wap/brief":      "the site brief, before anybody has walked the floor",

  /* ARITHMETIC. The work is a calculation and the numbers are all in a
     table. A machine here would decorate a sum. */
  "build/budget":   "does it fit the money — a quote against a budget, not a machine",
  "power/budget":   "adding up watts and picking a supply; the work is arithmetic",
  "raid/capacity":  "usable capacity and tolerance as sums, from figures already on the table",
  "display/specs":  "reading the numbers off a box and saying who benefits from each",

  /* NOTHING TO POINT AT. The answer is a configuration, a policy or a
     role — and the hardware carrying it is deliberately anonymous. */
  "net/hosts":      "which server fell over — a DNS box and a DHCP box are the same box, and "
                    + "that is exactly why this is answered from the symptom and not by looking",
  "net/virt":       "hypervisors and guests — a console, and drawing a host would teach nothing",
  "net/cloud":      "service and deployment models; there is no object that is 'a public cloud'",
  "mobile/sync":    "accounts and sync settings, which live in a settings screen",

  /* ALREADY DRAWN, EARLIER IN THE SAME JOB. Mounting it again would be
     repetition rather than teaching. */
  "build/handover": "the written hand-over; the machine is drawn on eight stages before it"
};

/* `build/parts` AND `raid/fail` WERE IN HERE AND SHOULD NEVER HAVE BEEN.

   Both carry an ON-MODEL question — the student picks parts off the
   shelf, pulls bays out of the rack — and this check counts that as a
   machine, correctly, because it is one. So the map claimed fifteen
   stages without a machine while only thirteen had none, and the
   calibration arm failed: it requires that dropping the map produce at
   least as many failures as there are exemptions, and two of the
   exemptions could never fail.

   The stale-exemption line above the summary is what named them. That
   line exists because an exemption map is a list of decisions, and a
   decision that has quietly stopped being true is worse than no decision
   at all — it reads as considered when it is just out of date. */

/* BENCHES THAT DELIBERATELY LIST NOTHING. `controls()` returns [] and the
   model is marked nowhere, because on these stages NAMING THE PART is the
   question — a list of every part in words beside it would answer it by
   elimination in one read. Same decision as the printer lab's `defect`.
   The words a student needs are on a note panel instead, so switching the
   canvas off still leaves a complete stage. */
const UNMARKED = {
  "display/diagnose":  "the customer's own screen, with the symptom on it and nothing marked",
  "mobile/panelpart":  "the display module with every candidate on it and none of them pointed at",
  "mobile/firststep":  "the handset as it arrived; the question is what you DO first",
  "build/swap":        "the baseline machine, already wrong, with nothing flagged",
  "mobile/digitizer":  "the seven layers, and which one failed is the question being asked",
  "mobile/power":      "the cell that is NOT the fault, so it can be ruled out by looking",
  /* A different reason, and worth keeping distinct: these two have no
     controls because the MODEL ITSELF is the answer surface. The stage
     carries a `pick` or `assign` question whose targets are the parts, so
     a second list of the same parts beside it would be two interfaces
     onto one choice. */
  "build/twobuilds":   "the shelf is the answer surface — the question's own controls are the parts",
  "power/chain":       "the outlets are the answer surface — nine devices are assigned onto them"
};

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(p)) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "text/plain" });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;

const { LABS } = await import(ROOT + "/assets/labs.js");

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
});

const rows = [], missing = [], broken = [];
let withMachine = 0, total = 0;

for (const L of LABS) {
  const p = await b.newPage({ viewport: { width: 1240, height: 900 } });
  await p.goto(`http://127.0.0.1:${PORT}/index.html`);
  await p.click("#tab-" + L.key);
  await p.selectOption("#length", "project");
  await p.click(".btn.start");
  await p.waitForTimeout(200);

  const n = await p.evaluate(() => window.__UTHL.running().stageCount());
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => window.__UTHL.running().go(k), i);
    /* The bench panel imports three.js on demand and swallows its own
       failure behind a sentence, so a short wait reads as "no bench" on a
       bench that was simply still loading. Wait for the CONDITION rather
       than a guessed duration — the suite's own benches-mount check was
       doing the latter and reported a healthy mobile lab as broken under
       load. Capped, so a dead bench still fails rather than hanging. */
    await p.waitForFunction(() => {
      const box = document.querySelector(".panel-bench");
      return !box || !!box.querySelector("canvas") ||
             /could not be loaded/i.test(box.textContent);
    }, { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(90);
    const got = await p.evaluate(() => {
      const boxes = [...document.querySelectorAll(".panel-bench")];
      /* A `pick` or `fit` question IS the model — the student acts on
         the geometry rather than reading a panel beside it — so those
         count as a machine even with no bench panel on the stage. */
      const inline = document.querySelectorAll("section.q[data-kind='pick'], " +
        "section.q[data-kind='fit'], section.q[data-kind='assign']").length;
      return {
        /* The runner writes the stage title as a bare h2 in the stage
           head. There is no .stage-title class — reading one returns
           empty on every stage, which is a harness printing nothing and
           looking like content with no title. */
        title: (document.querySelector("#stage h2, .stage h2, h2") || {}).textContent || "",
        benches: boxes.length,
        canvases: boxes.filter((x) => x.querySelector("canvas")).length,
        parts: boxes.reduce((a, x) => a + x.querySelectorAll(".bench-part-name").length, 0),
        fellBack: boxes.some((x) => /could not be loaded/i.test(x.textContent)),
        inline: inline
      };
    });
    const key = L.key + "/" + (L.stages[i] ? L.stages[i].key : "?" + i);
    total++;
    /* A MOUNTED CANVAS IS A MACHINE, WITH OR WITHOUT CONTROLS BESIDE IT.
       The first cut required at least one control and reported four
       stages as having nothing to look at while a model was plainly on
       the screen. Those four return `controls: []` ON PURPOSE — they are
       the "nothing is marked" benches, where naming the part IS the
       question and a list of every part in words underneath would hand
       the answer over. That is the printer lab's `defect` pattern, and a
       check that calls it a defect is a check punishing the right
       decision. Control count is reported, and judged separately below. */
    const has = got.canvases > 0 || got.inline > 0;
    if (got.canvases > 0 && got.parts === 0 && !UNMARKED[key])
      broken.push(key + ": a bench with no controls at all, and it is not listed as unmarked");
    if (has) withMachine++;
    if (got.fellBack) broken.push(key + ": bench fell back to its no-3D message");
    if (got.benches > got.canvases) broken.push(key + ": a bench panel mounted no canvas");
    if (!has && !NO_MACHINE[key]) missing.push(key + ": " + got.title.trim().slice(0, 52));
    rows.push((has ? "  " : "* ") + key.padEnd(22) +
      (got.canvases ? got.canvases + " bench " + got.parts + " parts" : "") +
      (got.inline ? (got.canvases ? " + " : "") + got.inline + " on-model question" : "") +
      (has ? "" : (NO_MACHINE[key] ? "— by decision: " + NO_MACHINE[key] : "NOTHING TO LOOK AT")));
  }
  await p.close();
}
await b.close(); srv.close();

if (LIST) console.log(rows.join("\n"));

/* CALIBRATION. A stage listed in NO_MACHINE that HAS grown a machine is
   not a failure — it is the list going stale, and the check says so
   rather than staying quiet. Run with --calibrate to prove the missing
   arm can fire at all: it drops every entry from the exemption map, and
   the exempt stages must come back as missing. */
if (CAL) {
  /* BOTH ARMS, because a check with one live arm and one vacuous one
     reads exactly like a check that works. The first arm fails a stage
     with nothing to look at; the second fails a bench that mounted no
     canvas, or one with no controls that is not deliberately unmarked.

     There is nothing to plant here — the defect this check exists to
     catch is an ABSENCE, so the calibration removes the two exemption
     maps instead and requires the stages they cover to come back as
     failures. If either number is zero the corresponding arm could never
     fire whatever the build did, which is the vacuous-arm trap this repo
     has already been caught by twice. */
  const exempt = Object.keys(NO_MACHINE).length;
  const unmarked = Object.keys(UNMARKED).length;
  const noMachine = rows.filter((r) => r.startsWith("* ")).length;
  const noControls = rows.filter((r) => / 0 parts/.test(r)).length;
  const armA = noMachine >= exempt && exempt > 0;
  const armB = noControls >= unmarked && unmarked > 0;
  console.log(armA && armB
    ? `calibration: drop the exemption map and ${noMachine} stages report nothing to look at; ` +
      `drop the unmarked map and ${noControls} benches report no controls. Both arms fire.`
    : `calibration FAILED: missing-machine arm ${noMachine}/${exempt}, ` +
      `no-controls arm ${noControls}/${unmarked}. An arm that cannot reach a failure is ` +
      `not protecting anything.`);
  process.exit(armA && armB ? 0 : 1);
}

const stale = Object.keys(NO_MACHINE).filter((k) =>
  rows.some((r) => r.startsWith("  ") && r.slice(2).startsWith(k.padEnd(22).slice(0, k.length + 1))));

if (broken.length || missing.length) {
  if (broken.length) console.log(broken.slice(0, 6).join(" | "));
  if (missing.length) console.log(missing.slice(0, 8).join(" | "));
  console.log(`${missing.length} stages have nothing to look at and are not listed as exempt; ` +
    `${broken.length} benches failed to mount`);
  process.exit(1);
}

console.log(`${withMachine} of ${total} stages put a machine in front of the student; ` +
  `the other ${total - withMachine} are exempt by name with a reason each` +
  (stale.length ? ` (${stale.length} exemptions now stale: ${stale.join(", ")})` : ""));
process.exit(0);
