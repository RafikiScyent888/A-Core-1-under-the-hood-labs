/* EVERY RESTING MACHINE, FRAMED, AT EVERY CANVAS WIDTH A STUDENT GETS.

   The dock's camera is derived from the machine's own extents, and every
   fitWidth reasoned from a dimension in this build has been wrong at
   least once — twice badly enough to lose parts off the frame. So it is
   swept against frustumOK rather than trusted, on BOTH axes, using the
   vertical arm added for the workshop room.

   --calibrate DRIVES THE CAMERA IN, and it has to break two numbers to do
   it. The first attempt set fitWidth to 1 alone and only one machine of
   eleven clipped — because `fitDist()` returns `Math.max(dist, need)`, so
   removing the fit does not move the camera closer, it only stops it
   backing off. `dist` is derived from the machine here and was still
   framing everything. A calibration that nudges one of two numbers
   controlling the same thing proves nothing. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join } from "path";
import { dirname as _d, join as _j } from "path";
import { fileURLToPath as _f } from "url";
const ROOT = _j(_d(_f(import.meta.url)), "..");
const CAL = process.argv.includes("--calibrate");
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => { const p = join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" }); r.end(readFileSync(p)); });
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const { SHOWROOM } = await import(ROOT + "/assets/bench-room.js");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new","--use-gl=swiftshader","--enable-unsafe-swiftshader"] });
/* the dock caps its canvas at 760, so these are the widths it really gets */
const WIDTHS = [319, 480, 697, 760];
let bad = 0, rows = 0;
for (const m of SHOWROOM) {
  const hits = [];
  for (const W of WIDTHS) {
    const p = await b.newPage({ viewport: { width: W + 30, height: 760 } });
    await p.goto(`http://127.0.0.1:${PORT}/verify/preview-room.html` +
      `?mod=bench-room&fn=machineBench&arg=${m.key}&h=380` + (CAL ? "&fw=1&dist=2" : ""));
    await p.waitForFunction(() => window.__READY, { timeout: 30000 }).catch(()=>{});
    await p.waitForTimeout(500);
    const err = await p.$eval("#e", n => n.textContent).catch(()=>"" );
    if (err.trim()) { hits.push(W + "px THREW"); bad++; await p.close(); continue; }
    const r = await p.evaluate(() => window.__SCENE ? window.__SCENE.frustumOK() : null);
    rows++;
    if (!r) { hits.push(W + "px no handle"); bad++; }
    else if (r.out.length || (r.outY||[]).length) {
      hits.push(W + "px " + [...r.out, ...(r.outY||[])].join("/")); bad++;
    }
    await p.close();
  }
  console.log("  " + m.key.padEnd(16) + (hits.length ? "CLIPS: " + hits.join("  ") : "clean at all 4 widths"));
}
await b.close(); srv.close();
console.log("");
if (CAL) {
  if (bad >= 20) console.log("calibration OK — " + bad + " of " + rows + " combinations clip with the fit removed");
  else { console.log("CALIBRATION FAILED — only " + bad + " clipped; the check cannot fail"); process.exit(1); }
} else if (bad) { console.log(bad + " of " + rows + " combinations clip"); process.exit(1); }
else console.log("all " + rows + " machine/width combinations clean on both axes");
