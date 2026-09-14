/* DOES EVERY WEAR-BENCH SHAPE FIT ITS OWN FRAME, AT EVERY CANVAS WIDTH?

   The field of view is vertical, so a narrow panel shows LESS width at the
   same camera distance, and a bench framed against one canvas quietly
   loses its ends on another. That is invisible to inspection — a clipped
   edge reads as a deliberate crop — which is why it is measured with
   frustumOK() rather than looked at.

   It matters more now that shapes carry their own `span` and `pitch`:
   every one of them is a separate framing decision, and each new part is
   a fresh chance to get it wrong.

   usage: node verify/wear-frame.mjs [shape ...]     (default: all) */
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
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const p = join(ROOT, u === "/" ? "index.html" : u);
  if (!existsSync(p)) { res.writeHead(404); return res.end("no"); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] || "text/plain" });
  res.end(readFileSync(p));
});
/* Port 0 lets the OS hand out a free one. On a fixed port, one run that
   was interrupted left the socket held and every later run died with
   EADDRINUSE — which reads like a broken tool rather than a stale
   process, and cost a good ten minutes proving otherwise. */
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

const SHAPES = process.argv.length > 2 ? process.argv.slice(2)
  : ["roller", "sleeve", "blade", "bar", "pad", "sepad", "strip", "sprocket",
     "contact", "lever", "drum", "gear", "belt", "feedshaft"];
const RUNGS = ["fresh", "failed"];
const WIDTHS = [1400, 1100, 860, 720];
let bad = 0;
for (const shape of SHAPES) {
  for (const rung of RUNGS) {
    for (const vw of WIDTHS) {
      const p = await b.newPage({ viewport: { width: vw, height: 900 } });
      await p.goto("http://127.0.0.1:" + PORT + "/verify/preview-one.html#" + shape + "/" + rung);
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => {
        const e = document.getElementById("err").textContent;
        if (e) return { threw: e };
        const h = window.__SCENE;
        return h && h.frustumOK ? h.frustumOK() : null;
      });
      await p.close();
      if (!r) { console.log("  no scene: " + shape + "/" + rung + " @" + vw); bad++; continue; }
      if (r.threw) { console.log("  THREW " + shape + "/" + rung + ": " + r.threw.trim()); bad++; continue; }
      if (r.out.length) {
        bad++;
        console.log("  CLIP " + shape + "/" + rung + " @" + vw + ": " + r.out.slice(0, 5).join(", "));
      }
    }
  }
}
await b.close(); srv.close();
console.log(bad ? bad + " FRAMING FAILURES" :
  "every shape fits its frame at " + WIDTHS.join(", ") + "px, fresh and failed");
process.exit(bad ? 1 : 0);
