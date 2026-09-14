/* =====================================================================
   IS THERE ACTUALLY A MACHINE ON THE CANVAS?

   `bench-frame.mjs` asks whether any part crosses the LEFT OR RIGHT edge
   of the frame. That is all `frustumOK` can answer: it projects each
   part's bounding sphere and compares the x extent. It knows nothing
   about the vertical, and nothing whatsoever about DEPTH.

   The screen bench proved how wide that gap is. `scene.js` builds its
   camera as PerspectiveCamera(38, aspect, 0.1, 300) — THE FAR PLANE IS
   300 UNITS. That bench was authored at 1 unit = 5 mm, so framing four
   24-inch panels needed the camera more than 300 back, and everything
   past the plane was silently cut away. Two of the four panels vanished
   completely and the other two were sliced into wedges where the plane
   passed through them. Pushing the camera further back removed MORE of
   the bench rather than less.

   Every check passed. frustumOK reported eight parts and none out. The
   framing sweep was clean at all four widths. The suite went green on a
   render that was almost empty.

   The same blind spot hides the opposite fault. When the projector was
   rescaled its camera ended up inside the vent slots: the bench filled
   98.7% of the canvas and its ink touched all four edges, and frustumOK
   still reported nought out.

   IT MEASURES THE PARTS, NOT THE MAT. The first run of this check
   reported seven benches running off the frame, and every one of them
   was fine: a bench mat is a table top, it is meant to fill the canvas
   and run off the edges, and fourteen of the thirty-three had ink at
   exactly the last pixel row. The only three that came back clean were
   the three built with no mat. A metric that scores the tablecloth is
   the same failure as the dark-pixel count that returned 827 for three
   different geometries because it was counting a port notch. The bench
   is therefore rendered with `board` and `decor` stripped.

   So this check measures the PIXELS. It renders each bench, reads back
   how much of the canvas carries ink and the box that ink occupies, and
   fails a bench that is nearly empty (lost behind the far plane, or so
   far away it is unreadable) or one whose ink runs off the edges (too
   close, or genuinely clipped).

   READ BACK THROUGH A SCREENSHOT, NEVER off the canvas. A WebGL drawing
   buffer is not preserved after present, so getImageData on it returns
   zeros — which would score every bench identically and pass the lot.
   The screenshot is handed to a second page as a data URL and decoded
   there, which is the one route that works in this container.

   usage: node verify/bench-ink.mjs [--list] [--calibrate]
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

/* The same roster preview-frame.html carries, which is every bench
   function that exists rather than every bench module. */
const BENCHES = ["mobile-lcd", "mobile-oled", "raid", "net", "display", "device", "build",
  "power", "outlet", "wap", "printer", "showroom", "site", "rear", "volume", "kit", "mfp",
  "floor", "thermal", "impact", "inkjet", "wear", "rj45", "connector", "fibre", "ap-mount",
  "ap-antenna", "video", "psu-loom", "psu-rear", "psu-ups", "screen", "projector"];

/* A bench drawing less than this fraction of the canvas is not a bench a
   student can read — it is a speck, or it is behind the far plane. The
   screen bench scored 1.0% while broken and 20.7% once fixed; a healthy
   bench in this build sits between about 4% and 45%. */
const MIN_FILL = 1.2;
/* Ink hard against an edge means the bench is cut off there. Two pixels
   of margin, because the canvas border itself antialiases. */
const EDGE = 2;

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
/* One page, kept open, whose only job is to decode PNGs into pixels. */
const reader = await b.newPage();
await reader.goto("about:blank");

const W = 900;
const rows = [], empty = [], clipped = [], unresolved = [];

for (const name of BENCHES) {
  /* ONE BENCH PER PAGE LOAD — the WebGL context cap again. */
  const p = await b.newPage({ viewport: { width: W + 40, height: 560 } });
  /* --calibrate drives every bench to a fitWidth of 4000, which forces
     the camera far past the engine's 300-unit far plane. Every bench must
     then come back empty. A check that cannot be made to fail is not
     protecting anything, and this one exists precisely because the
     failure it catches is invisible to every other check in the suite. */
  const q = `?bench=${name}&w=${W}&noboard=1` + (CAL ? "&fw=4000&maxd=9000" : "");
  await p.goto(`http://127.0.0.1:${PORT}/verify/preview-frame.html${q}`);
  await p.waitForFunction(() => window.__READY, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(700);
  let png = null;
  try { png = await p.locator("#host").screenshot({ timeout: 15000 }); } catch (e) { /* below */ }
  await p.close();
  if (!png) { unresolved.push(name + ": nothing rendered to screenshot"); continue; }

  const m = await reader.evaluate(async (d) => {
    const img = new Image();
    await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = "data:image/png;base64," + d; });
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < px.length; i += 4) {
      /* the preview page's ground is #eef1f2; anything meaningfully
         darker than it is a part */
      if (px[i] < 225 || px[i + 1] < 228 || px[i + 2] < 229) {
        n++;
        const q = (i / 4) | 0, cx = q % c.width, cy = (q / c.width) | 0;
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
        if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
      }
    }
    return { w: c.width, h: c.height, ink: n, x0: x0, y0: y0, x1: x1, y1: y1,
             fill: +(n / (c.width * c.height) * 100).toFixed(1) };
  }, png.toString("base64"));

  const thin = m.fill < MIN_FILL;
  const edges = [];
  if (m.ink) {
    if (m.x0 <= EDGE) edges.push("left");
    if (m.y0 <= EDGE) edges.push("top");
    if (m.x1 >= m.w - 1 - EDGE) edges.push("right");
    if (m.y1 >= m.h - 1 - EDGE) edges.push("bottom");
  }
  if (thin) empty.push(`${name}: ${m.fill}% of the canvas has anything on it`);
  else if (edges.length >= 2) clipped.push(`${name}: ink runs off the ${edges.join(" and ")}`);
  rows.push(`${(thin || edges.length >= 2 ? "* " : "  ")}${name.padEnd(13)}` +
    `${String(m.fill).padStart(5)}%  box ${m.x0},${m.y0}..${m.x1},${m.y1}` +
    (edges.length ? "  touches " + edges.join("+") : ""));
}
await b.close(); srv.close();

if (LIST) console.log(rows.join("\n"));

if (unresolved.length) {
  console.log(unresolved.slice(0, 5).join(" | "));
  console.log(`${unresolved.length} benches could not be measured at all`);
  process.exit(1);
}

if (CAL) {
  /* Driven past the far plane, the benches must go dark. Not every one
     will — a bench whose own `dist` is large enough may still have
     geometry in front of the plane — so the bar is that MOST of them do,
     which is what proves the measurement is looking at real pixels. */
  const gone = rows.filter((r) => r.startsWith("* ")).length;
  const ok = gone >= Math.ceil(BENCHES.length * 0.6);
  console.log(ok
    ? `calibration: driven past the engine's 300-unit far plane, ${gone} of ${BENCHES.length} ` +
      `benches go empty or clip, so this check can fail`
    : `calibration FAILED: only ${gone} of ${BENCHES.length} benches changed when driven past ` +
      `the far plane. This check is not measuring what it claims to.`);
  process.exit(ok ? 0 : 1);
}

if (empty.length || clipped.length) {
  if (empty.length) console.log(empty.slice(0, 6).join(" | "));
  if (clipped.length) console.log(clipped.slice(0, 6).join(" | "));
  console.log(`${empty.length} benches render almost nothing and ${clipped.length} run off ` +
    `the frame — read the box, not the part count`);
  process.exit(1);
}
console.log(`all ${BENCHES.length} benches put real ink on the canvas, none under ${MIN_FILL}% ` +
  `and none running off two edges`);
process.exit(0);
