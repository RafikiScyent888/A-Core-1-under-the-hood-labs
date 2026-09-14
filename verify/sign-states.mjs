/* =====================================================================
   Every sign on the workstation bench must LOOK different in its two
   states, measured off the painted pixels.

   THIS EXISTS BECAUSE READING THE SOURCE SAID SOMETHING THE RENDER DID
   NOT. Three separate times:

     - the chassis fan carried a colour, a blur ring and a word, and
       rendered as a solid green slab in both states. The bore was a
       cylinder drawn inside a solid box, and this renderer has no
       boolean subtraction, so nothing was ever cut and every blade was
       buried inside the frame.
     - the monitor panel was placed 0.01 units in front of the bezel and
       then 0.16 units behind it. Both times it never appeared at all,
       because the bezel's near face is at z + 0.42 and not z + 0.18.
     - the first version of this check guessed at where each sign lands
       in the canvas and measured bands that were mostly empty mat. The
       beep rings sat above the window entirely and scored 1.

   So it does not guess. `preview-signs.html` draws the bench with the
   three signs as its only inputs, one sign is flipped at a time, and the
   whole canvas is diffed — which isolates that sign because nothing
   else about the scene has changed.

   Run with --calibrate to plant three signs that ignore their own state
   and confirm all three are caught.
   ===================================================================== */
import http from "node:http";
import { readFile, writeFile, mkdtemp, cp, rm } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CALIBRATE = process.argv.includes("--calibrate");
const SIGNS = ["fan", "beep", "video"];
/* A sign that changes fewer pixels than this is not telling a student
   anything they can see. 0.4% of a 1000x520 canvas is about 2,000
   pixels, which is a patch roughly 45 across. */
const FLOOR = 0.004;

let serveRoot = ROOT, tmp = null;
if (CALIBRATE) {
  tmp = await mkdtemp(path.join(os.tmpdir(), "signcal-"));
  await cp(ROOT, tmp, { recursive: true });
  const f = path.join(tmp, "assets/bench-build.js");
  let t = await readFile(f, "utf8");
  /* Plant at the point where the state actually enters the render: the
     part's own colour, and the presence of the part at all. An earlier
     plant patched a shade deep inside the monitor's geometry and changed
     nothing, because the part colour above it still tracked the state —
     the check came back clean, and the calibration is what said so. */
  /* Each sign must be stripped of EVERY signal it carries, not just its
     colour. The first version of this plant removed only the fan's
     colour and the fan still read, because its blur ring is a second,
     independent signal — which was the check telling the truth about a
     part that is more robust than the plant assumed, not a miss. */
  const plants = [
    /* fan: colour and the blur ring */
    ['color: sg.fan ? "#2fd45e" : "#3b424a", glow: sg.fan ? 0.7 : 0,', 'color: "#3b424a", glow: 0,'],
    ['  if (turning) {', '  if (false) {'],
    /* screen: colour and the content drawn on it */
    ['color: sg.video ? "#4d97ff" : "#191d22", glow: sg.video ? 0.55 : 0,', 'color: "#191d22", glow: 0,'],
    ['    if (sg.video) {', '    if (false) {'],
    /* speaker: the rings are its only signal */
    ['    if (sg.beep) {', '    if (false) {']
  ];
  for (const [from, to] of plants) {
    if (!t.includes(from)) { console.error("calibration could not find: " + from); process.exit(2); }
    t = t.replace(from, to);
  }
  await writeFile(f, t);
  serveRoot = tmp;
}

const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml" };
const srv = http.createServer(async (rq, rs) => {
  try {
    const f = path.join(serveRoot, decodeURIComponent(rq.url.split("?")[0]));
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

/* Read back through a PNG rather than through readPixels: the drawing
   buffer is not preserved after present, and readPixels on it comes back
   all zeros — which would have passed this check for the wrong reason on
   every sign at once. */
async function shoot(state) {
  const qs = SIGNS.map(k => k + "=" + (state[k] ? 1 : 0)).join("&");
  const p = await br.newPage({ viewport: { width: 1100, height: 700 } });
  await p.goto(`http://127.0.0.1:${PORT}/verify/preview-signs.html?${qs}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1100);
  const e = await p.$("#err");
  const errText = e ? (await e.textContent()).trim() : "";
  if (errText) { console.error("preview threw: " + errText); process.exit(2); }
  const buf = await (await p.$("canvas")).screenshot();
  await p.close();
  return buf;
}

const dir = await mkdtemp(path.join(os.tmpdir(), "signpx-"));
const base = { fan: false, beep: false, video: false };
const files = [];
for (const k of SIGNS) {
  for (const v of [false, true]) {
    writeFileSync(path.join(dir, `${k}-${v ? "on" : "off"}.png`),
      await shoot(Object.assign({}, base, { [k]: v })));
  }
  files.push(k);
}
await br.close(); srv.close();

const py = `
import sys, json
from PIL import Image, ImageChops
out = {}
for k in json.loads(sys.argv[1]):
    a = Image.open(f"${dir}/{k}-on.png").convert("RGB")
    b = Image.open(f"${dir}/{k}-off.png").convert("RGB")
    if a.size != b.size:
        out[k] = {"error": "different canvas sizes"}; continue
    d = ImageChops.difference(a, b)
    px = d.load(); w, h = d.size
    n = sum(1 for y in range(h) for x in range(w) if sum(px[x, y]) > 24)
    out[k] = {"changed": n, "total": w * h}
print(json.dumps(out))
`;
const got = JSON.parse(execFileSync("python3", ["-c", py, JSON.stringify(files)], { encoding: "utf8" }));
await rm(dir, { recursive: true, force: true });
if (tmp) await rm(tmp, { recursive: true, force: true });

let bad = 0;
for (const k of SIGNS) {
  const r = got[k];
  const frac = r.changed / r.total;
  if (frac < FLOOR) {
    bad++;
    console.log(`  SAME  ${k}: flipping it repaints ${r.changed} pixels (${(frac*100).toFixed(3)}%), below the ${(FLOOR*100).toFixed(1)}% floor`);
  } else {
    console.log(`  reads ${k}: flipping it repaints ${r.changed} pixels (${(frac*100).toFixed(2)}% of the canvas)`);
  }
}
if (CALIBRATE) {
  const all = bad === SIGNS.length;
  console.log(all ? "\ncalibration: all three planted defects were caught"
                  : `\nCALIBRATION FAILED: ${SIGNS.length - bad} sign(s) that ignore their state came back clean`);
  process.exit(all ? 0 : 1);
}
console.log(bad ? `\n${bad} sign(s) look the same in both states`
                : "\nevery sign on the workstation bench visibly changes when its state does");
process.exit(bad ? 1 : 0);
