/* IS THIS MARK ACTUALLY ON THE SCREEN?

   Rendering a mark, positioning it and colouring it are three claims that
   can all be true while the student sees nothing — it can sit inside
   another part, behind one, or 0.06 units under a lip. This build has
   shipped that bug on the cassette debris, the nozzle plate, the element
   scar and the roller cracks, so it gets an instrument.

   Matching an EXPECTED COLOUR is the wrong instrument: scene lighting
   moves a painted pixel a long way from its base colour, and a mark that
   is plainly visible can miss the tolerance. So this diffs two renders of
   the same page — one with the mark, one with its builder stubbed out —
   and counts pixels that CHANGED. That is exactly the question, and it
   needs no assumption about how the thing is lit.

   usage: node marksvisible.mjs <preview-page> <fn> [<fn> ...] */
/* Playwright is not a dependency of this repo, same as verify.mjs: resolve
   the bare specifier first for anyone who has it, then the global copy this
   container provides. Without this the tool dies at line one with
   ERR_MODULE_NOT_FOUND, which reads like a broken build. */
let chromium;
try { ({ chromium } = await import("playwright")); }
catch (e) {
  try { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
  catch (e2) { console.error("Playwright not found."); process.exit(2); }
}
const B = { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] };
const PAGE = process.argv[2];
/* The module to stub in. Defaults to the wear bench, which is what this
   started life checking; any bench module can be named as
   "module:fn,fn" so the same instrument serves every bench rather than
   being copied per file. */
let MODULE = "bench-wear.js";
let FNS = process.argv.slice(3);
if (FNS.length && FNS[0].indexOf(":") !== -1) {
  const bits = FNS[0].split(":");
  MODULE = bits[0];
  FNS = bits[1].split(",").concat(FNS.slice(1));
}
if (!PAGE || !FNS.length) {
  console.log("usage: node verify/marks-visible.mjs <preview-page> [<module.js>:]<builder>[,<builder>...]");
  console.log("  needs the repo served on 8137:  python3 -m http.server 8137");
  process.exit(2);
}
const browser = await chromium.launch(B);
async function shot(fn) {
  const p = await browser.newPage({ viewport: { width: 1140, height: 760 } });
  if (fn) {
    let hit = 0;
    await p.route("**/" + MODULE, async (r) => {
      const res = await r.fetch(); const t = await res.text();
      /* SIGNATURE-AGNOSTIC. The first version matched "function fn(x, sev) {"
         literally, which was every builder in the wear bench and none of
         them anywhere else — pointing the tool at a second module failed
         with "no such builder" on a function that was plainly there. */
      const re = new RegExp("function\\s+" + fn + "\\s*\\([^)]*\\)\\s*\\{");
      const m = re.exec(t);
      if (!m) throw new Error("no such builder: " + fn + " in " + MODULE);
      hit++;
      await r.fulfill({ response: res,
        body: t.slice(0, m.index + m[0].length) + " return [];" + t.slice(m.index + m[0].length) });
    });
    p.on("close", () => { if (!hit) console.log("  WARNING: the stub never applied"); });
  }
  await p.goto("http://127.0.0.1:8137/verify/" + PAGE + ".html", { waitUntil: "networkidle" });
  await p.waitForTimeout(1400);
  /* FULL PAGE, NOT THE VIEWPORT. A preview page with four benches on it
     puts the last one below the fold, and a viewport screenshot then
     reports its parts as painting nothing — the tool missing the thing
     rather than the thing being missing. */
  const b64 = (await p.screenshot({ fullPage: true })).toString("base64");
  await p.close();
  return b64;
}
async function diff(a, b) {
  const p = await browser.newPage();
  const n = await p.evaluate(async ([x, y]) => {
    async function px(b64) {
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = "data:image/png;base64," + b64; });
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, c.width, c.height).data;
    }
    const A = await px(x), C = await px(y);
    let n = 0;
    for (let i = 0; i < A.length; i += 4) {
      if (Math.abs(A[i] - C[i]) + Math.abs(A[i + 1] - C[i + 1]) + Math.abs(A[i + 2] - C[i + 2]) > 24) n++;
    }
    return n;
  }, [a, b]);
  await p.close();
  return n;
}
const base = await shot(null);
let bad = 0;
for (const fn of FNS) {
  const n = await diff(base, await shot(fn));
  const ok = n >= 250;
  if (!ok) bad++;
  console.log((ok ? "  visible  " : "  INVISIBLE") + "  " + fn.padEnd(16) + n + " px change when it is removed");
}
await browser.close();
console.log(bad ? bad + " mark(s) generated but not on the screen" : "all marks reach the screen");
process.exit(bad ? 1 : 0);
