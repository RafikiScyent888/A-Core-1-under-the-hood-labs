/* IS THE MACHINE ON EVERY STEP, AND IS IT ONE CONTEXT?

   Two claims, and they are separate:

     PRESENT  every stage of every lab at project length shows a live
              canvas in the dock. Thirteen stages used to be text and
              nothing else — verify/stage-machines.mjs carried them as a
              NO_MACHINE exemption list.

     PERSISTENT  walking all of them creates ONE WebGL context, not one
              per stage, and loses none. "Written and reachable are
              different claims" applies here twice over: a dock that
              remounts per stage would pass the first check and fail the
              point of the exercise.

   --calibrate breaks the dock (by making chooseDock return nothing) and
   requires the PRESENT arm to go red on the stages that have no bench.
   A check that cannot fail is not protecting anything. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join } from "path";

import { dirname, join as pjoin } from "path";
import { fileURLToPath } from "url";
const ROOT = pjoin(dirname(fileURLToPath(import.meta.url)), "..");
const CAL = process.argv.includes("--calibrate");
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  let body = readFileSync(p);
  /* the calibration arm: cut the resting machine out at the wire, so the
     stages that have no bench of their own go back to having nothing */
  if (CAL && rel === "/assets/runner.js") {
    body = Buffer.from(String(body).replace(
      "      dockShow(restingPanel(R, key));", "      /* CALIBRATION: removed */"));
  }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" });
  r.end(body);
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;

const LABS = ["printer", "build", "raid", "power", "wap", "mobile", "net", "display"];
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

let bare = [], ctxBad = [];
for (const labKey of LABS) {
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const lost = [];
  await p.exposeFunction("__lost", () => lost.push(1));
  await p.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    window.__ctxMade = 0;
    HTMLCanvasElement.prototype.getContext = function (t, o) {
      if (/webgl/i.test(t)) {
        window.__ctxMade++;
        /* A CONTEXT HANDED BACK ON PURPOSE IS NOT A CONTEXT THE BROWSER
           KILLED, and this check only cares about the second.

           `sceneSupported()` creates a probe context to answer whether
           WebGL works and immediately releases it with
           WEBGL_lose_context — which fires `webglcontextlost` exactly
           like a browser eviction does. It showed up as "display lost 1"
           and read as the dock dropping a context.

           The probe's canvas is never appended to the document. That is
           the difference, and it is a reliable one: a canvas a student
           can see is in the DOM. */
        this.addEventListener("webglcontextlost", () => {
          if (this.isConnected) window.__lost();
        });
      }
      return orig.call(this, t, o);
    };
  });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 140)));
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.click("#tab-" + labKey);
  await p.selectOption("#length", "project");
  await p.click(".btn.start");
  await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });

  const n = await p.evaluate(() => window.__UTHL.running().stageCount());
  /* COUNT THE CONTEXTS THE STAGE WALK COSTS, not the ones the page has
     ever made. The first cut compared a running total against a fixed
     ceiling, and broke the moment the SHOWROOM landed on the front page:
     that room is a real model a student uses to choose a lab, so its
     context is earned, and every lab jumped from two to three and the
     check called it a regression.

     The claim worth holding was never "the page makes at most N
     contexts" — it is "the dock does not build a new one per stage". So
     the baseline is taken AFTER the lab has started and the dock has
     mounted, and the walk may add nothing. */
  const base = await p.evaluate(() => window.__ctxMade);
  const missing = [];
  for (let i = 0; i < n; i++) {
    await p.evaluate((k) => window.__UTHL.running().go(k), i);
    /* wait for the CONDITION, never a fixed sleep — a flat wait failed a
       healthy mobile lab once and cost a wrong conclusion */
    const ok = await p.waitForFunction(
      () => !!document.querySelector(".model-dock canvas"), { timeout: 9000 })
      .then(() => true).catch(() => false);
    if (!ok) missing.push(i);
  }
  const made = await p.evaluate(() => window.__ctxMade);
  const grew = made - base;
  const label = labKey.padEnd(8) + String(n).padStart(2) + " stages   " +
    "contexts " + String(made).padStart(2) + " total, +" + grew + " across the walk" +
    "   lost " + lost.length +
    (missing.length ? "   NO MACHINE ON: " + missing.join(",") : "   machine on every stage");
  console.log("  " + label + (errs.length ? "   ERR " + errs[0] : ""));
  if (missing.length) bare.push(labKey + ":" + missing.join(","));
  /* THE WALK MAY COST NOTHING. The dock is already mounted by the time
     the baseline is taken, so every stage after it is a re-spec. One is
     allowed for a lab whose first stage mounts the dock late; more than
     one means it is rebuilding. */
  if (grew > 1 || lost.length) {
    ctxBad.push(labKey + " grew by " + grew + " across " + n + " stages, lost " + lost.length);
  }
  await p.close();
}
await b.close(); srv.close();

console.log("");
if (CAL) {
  if (bare.length >= 4) console.log("calibration OK — " + bare.length +
    " labs lose their machine when the resting bench is removed: " + bare.join("  "));
  else { console.log("CALIBRATION FAILED — only " + bare.length +
    " labs went bare; the PRESENT arm cannot fail"); process.exit(1); }
} else {
  if (bare.length) { console.log("STAGES WITH NO MACHINE: " + bare.join("  ")); process.exit(1); }
  if (ctxBad.length) { console.log("NOT PERSISTENT: " + ctxBad.join("  ")); process.exit(1); }
  console.log("every stage of all 8 labs shows the machine, one context each, none lost");
}
