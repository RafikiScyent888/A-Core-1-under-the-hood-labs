/* =====================================================================
   EVERY BENCH FITS ITS FRAME AT EVERY WIDTH A STUDENT ACTUALLY GETS

   The suite renders at 1100px and nothing else, and `wear framing` drives
   four widths for the wear shapes only. So "does a student on a phone see
   the whole bench" had never been asked of anything else — and the answer
   was no, on ten of them.

   The field of view is VERTICAL, so a narrow canvas shows LESS world width
   at the same camera distance. A clipped edge reads as a deliberate crop,
   which is why eyes are a poor detector for this and why it went unnoticed
   for the whole life of the build.

   WIDTHS are canvas widths, not viewport widths, measured off the running
   lab: 319 inside a 390px phone, 697 inside a 768px tablet, 889 inside a
   1280px laptop. 480 is in between.

   HEIGHT IS 460, WHICH IS THE DEMANDING CASE. The labs mount benches
   between 320 and 420 tall, and a TALLER canvas at the same width has a
   SMALLER aspect and shows less width. Fit at 460 and every shorter mount
   is covered.

   A BENCH CAN CLIP IN THE MIDDLE. The office site bench was clean at 319,
   480 and 889 and lost a part at 697 — at the narrow end the fit backs the
   camera off, at the wide end the aspect alone is enough, and in between
   neither is. Sweeping only the narrowest width would have missed it, so
   all four run every time.

   --calibrate deletes every fitWidth by handing the page a value of 1,
   which must put the benches back to clipping. A framing check that cannot
   be made to fail is not protecting anything.
   ===================================================================== */
/* Bare specifier first for anyone who has playwright locally, then the
   global copy this container provides. Without the fallback the tool dies
   at line one with ERR_MODULE_NOT_FOUND, which reads like a broken build.
   NODE_PATH does not apply to ES modules, so this is not optional. */
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
const CAL = process.argv.includes("--calibrate");
const WIDTHS = [319, 480, 697, 889];
const BENCHES = ["mobile-lcd", "mobile-oled", "raid", "net", "display", "device", "build",
  "power", "outlet", "wap", "printer", "showroom", "site", "rear", "volume", "kit", "mfp",
  "floor", "thermal", "impact", "inkjet", "wear",
  /* The nine benches built after this check was written, plus the two
     alternate views of the PSU and the two of the screen bench. A check
     that does not list new work is not checking it. */
  "rj45", "connector", "fibre", "ap-mount", "ap-antenna", "video",
  "psu-loom", "psu-rear", "psu-ups", "screen", "projector"];

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(p)) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "text/plain" });
  res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
});

const clipped = [];
let measured = 0, unresolved = [];
for (const name of BENCHES) {
  for (const w of WIDTHS) {
    /* ONE BENCH AND ONE WIDTH PER PAGE LOAD. All of them on one page is
       eighty-odd WebGL contexts against a browser cap around sixteen: the
       later ones lose their context and the page never finishes, and a
       harness that quietly stops is worse than one that fails. */
    const p = await b.newPage({ viewport: { width: 1240, height: 900 } });
    let q = `?bench=${name}&w=${w}`;
    if (CAL) q += "&fw=1";
    await p.goto(`http://127.0.0.1:${PORT}/verify/preview-frame.html${q}`);
    await p.waitForFunction(() => window.__READY, { timeout: 40000 }).catch(() => {});
    const t = (await p.$eval("#out", (e) => e.textContent).catch(() => "")).trim();
    await p.close();
    const m = t.match(/(-?\d+)\s*$/);
    /* A ROW THAT CANNOT RESOLVE IS NOT A ROW THAT PASSES. The first audit
       listed an "officeBench" that does not exist and reported "?" for it
       for ever without failing anything. */
    if (!m) { unresolved.push(`${name}@${w}: ${t.split("\n").pop() || "no output"}`); continue; }
    measured++;
    if (Number(m[1]) > 0) clipped.push(`${name}@${w}px loses ${m[1]}`);
  }
}
await b.close(); srv.close();

if (unresolved.length) {
  console.log(unresolved.slice(0, 6).join(" | "));
  console.log(`${unresolved.length} bench/width combinations could not be measured`);
  process.exit(1);
}

if (CAL) {
  /* Every bench with a fitWidth should now clip. Benches that never needed
     one are allowed to stay clean — the point is that the check MOVES. */
  const ok = clipped.length >= 8;
  console.log(ok
    ? `calibration: fitWidth removed and ${clipped.length} of ${measured} bench/width ` +
      `combinations went back to clipping, so the check can fail`
    : `calibration FAILED: fitWidth removed and only ${clipped.length} combinations clipped. ` +
      `This check cannot be made to fail, which means it is not protecting anything.`);
  process.exit(ok ? 0 : 1);
}

if (clipped.length) {
  console.log(clipped.slice(0, 8).join(" | "));
  console.log(`${clipped.length} bench/width combinations lose parts off the frame`);
  process.exit(1);
}
console.log(`every bench fits its frame at ${WIDTHS.join(", ")}px — ` +
  `${BENCHES.length} benches, ${measured} combinations`);
process.exit(0);
