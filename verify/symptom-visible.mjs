/* =====================================================================
   Every device symptom must LOOK different from every other one.

   The `diagnose` stages ask a student to name what is wrong from a
   picture. If two symptoms render the same, the picture is decoration
   and the exercise is a reading comprehension test with a canvas next
   to it.

   This drives `preview-device.html`, where the symptom is the only
   input, renders all ten, and compares every pair. It also proves each
   one differs from the healthy device — a symptom that renders exactly
   like a working screen has not been drawn at all, which is what
   happened to the workstation bench's monitor panel twice and to its
   fan once, in both cases with the source looking perfectly correct.

   Run with --calibrate to plant a bench that ignores which symptom it
   was asked for.
   ===================================================================== */
import http from "node:http";
import { readFile, writeFile, mkdtemp, cp, rm } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CALIBRATE = process.argv.includes("--calibrate");

/* Every symptom the two `diagnose` stages can show, plus the healthy
   device each is measured against. */
const MONITOR = ["none", "burn", "nosignal", "wedge", "smear", "stuckcol", "tear", "banding", "stretch"];
const PROJECTOR = ["none", "keystone", "hotspot"];
/* Two renders differing by fewer than this many pixels are the same
   picture as far as a student is concerned. */
const FLOOR = 1500;

let serveRoot = ROOT, tmp = null;
if (CALIBRATE) {
  tmp = await mkdtemp(path.join(os.tmpdir(), "dxcal-"));
  await cp(ROOT, tmp, { recursive: true });
  const f = path.join(tmp, "assets/bench-display.js");
  let t = await readFile(f, "utf8");
  const from = "  const art = view.art || null;";
  if (!t.includes(from)) { console.error("calibration could not find the artefact input"); process.exit(2); }
  t = t.replace(from, "  const art = null;");
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

const dir = await mkdtemp(path.join(os.tmpdir(), "dxpx-"));
async function shoot(kind, art) {
  const p = await br.newPage({ viewport: { width: 1100, height: 760 } });
  await p.goto(`http://127.0.0.1:${PORT}/verify/preview-device.html?kind=${kind}&art=${art}`,
    { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const e = await p.$("#err");
  const t = e ? (await e.textContent()).trim() : "";
  if (t) { console.error(`preview threw for ${kind}/${art}: ${t}`); process.exit(2); }
  const buf = await (await p.$("canvas")).screenshot();
  await p.close();
  writeFileSync(path.join(dir, `${kind}-${art}.png`), buf);
}
for (const a of MONITOR) await shoot("monitor", a);
for (const a of PROJECTOR) await shoot("projector", a);
await br.close(); srv.close();

const py = `
import sys, json, itertools
from PIL import Image, ImageChops
def diff(a, b):
    ia = Image.open(f"${dir}/{a}.png").convert("RGB")
    ib = Image.open(f"${dir}/{b}.png").convert("RGB")
    if ia.size != ib.size: return -1
    d = ImageChops.difference(ia, ib).load()
    w, h = ia.size
    return sum(1 for y in range(h) for x in range(w) if sum(d[x, y]) > 24)
out = []
for kind, arts in json.loads(sys.argv[1]).items():
    names = [f"{kind}-{a}" for a in arts]
    for a, b in itertools.combinations(names, 2):
        out.append([a, b, diff(a, b)])
print(json.dumps(out))
`;
const pairs = JSON.parse(execFileSync("python3",
  ["-c", py, JSON.stringify({ monitor: MONITOR, projector: PROJECTOR })], { encoding: "utf8" }));
await rm(dir, { recursive: true, force: true });
if (tmp) await rm(tmp, { recursive: true, force: true });

const same = pairs.filter(([, , n]) => n < FLOOR);
const worst = pairs.slice().sort((a, b) => a[2] - b[2])[0];
if (CALIBRATE) {
  /* With the artefact input ignored, every monitor symptom collapses
     onto the healthy monitor and onto each other. */
  const ok = same.length >= MONITOR.length - 1;
  console.log(ok
    ? `calibration: a bench that ignores its symptom made ${same.length} pairs identical, and was caught`
    : `CALIBRATION FAILED: only ${same.length} pairs collapsed`);
  process.exit(ok ? 0 : 1);
}
if (same.length) {
  same.slice(0, 8).forEach(([a, b, n]) => console.log(`  SAME  ${a} and ${b} differ by only ${n} pixels`));
  console.log(`\n${same.length} symptom pairs render the same picture`);
  process.exit(1);
}
console.log(`all ${pairs.length} symptom pairs render differently; the closest is ` +
  `${worst[0]} vs ${worst[1]} at ${worst[2]} pixels`);
