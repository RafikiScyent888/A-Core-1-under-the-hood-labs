/* THE SITE ON REAL DEVICES.

   Students do this as homework, alone, on whatever they have. Playwright
   ships descriptors for real handsets — viewport, device pixel ratio,
   touch, and the user agent — so this drives the actual profiles rather
   than a desktop browser squeezed narrow, which is not the same thing:
   a narrow desktop window has a mouse, no touch, and a DPR of 1.

   WHAT IT HOLDS, and each of these has bitten this build before:

     the page must not scroll SIDEWAYS. A horizontal scrollbar on a phone
     is the failure mode that makes a page feel broken rather than tight.

     the showroom must MOUNT and draw. The front door is a WebGL canvas
     and a phone is where a context is most likely to be refused.

     every lab must be REACHABLE by touch, at a target big enough to hit.
     WCAG asks for 24x24 CSS pixels as an absolute floor; this build's
     students have damaged sight as well, so anything under 40 is worth
     seeing in the report.

     the model dock must draw INSIDE a running lab, because that is the
     screen they spend the hour on.

     nothing may be WIDER than the viewport — measured per element, so the
     report names the thing that overflows rather than just saying the
     page does. */
let chromium, devices;
try { ({ chromium, devices } = await import("playwright")); }
catch (e) { ({ chromium, devices } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = createServer((q, r) => {
  let rel = decodeURIComponent(q.url.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const p = join(ROOT, rel);
  if (!existsSync(p)) { r.writeHead(404); return r.end("no"); }
  r.writeHead(200, { "content-type": T[extname(p)] || "text/plain" }); r.end(readFileSync(p));
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;

/* A spread rather than a list of favourites: the smallest phone still in
   use, a current tall phone, an Android, a small tablet, and one phone
   turned sideways — landscape is where a sticky or tall element does its
   worst, and it is how a lot of people hold a phone to read. */
const WANT = [
  ["iPhone SE", "iPhone SE"],
  ["iPhone 12 Mini", "iPhone 12 Mini"],
  ["Pixel 7", "Pixel 7"],
  ["Galaxy S9+", "Galaxy S9+"],
  ["iPad Mini", "iPad Mini"],
  ["iPhone 14 Pro Max landscape", "iPhone 14 Pro Max landscape"]
];
const PROFILES = WANT.map(([label, key]) => [label, devices[key]]).filter(([, d]) => d);
if (PROFILES.length < 4) {
  console.log("only " + PROFILES.length + " device profiles resolved — playwright's list changed");
  process.exit(1);
}

const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

const TAP_FLOOR = 40;            /* CSS px; WCAG's floor is 24, these students need more */
let bad = 0;
for (const [label, dev] of PROFILES) {
  const ctx = await b.newContext({ ...dev });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
  await p.goto(`http://127.0.0.1:${PORT}/`);

  const room = await p.waitForFunction(() => !!document.querySelector("#showroom canvas"), { timeout: 25000 })
    .then(() => true).catch(() => false);

  const front = await p.evaluate((floor) => {
    const vw = document.documentElement.clientWidth;
    const over = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1.5 || r.right > vw + 1.5) {
        const n = (el.className && String(el.className).split(" ")[0]) || el.tagName;
        if (!over.includes(n)) over.push(n);
      }
    }
    const small = [];
    for (const el of document.querySelectorAll(".tabs button, #showroom .bench-part-name, .btn, select")) {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < floor) {
        const n = (el.className && String(el.className).split(" ")[0]) || el.tagName;
        if (!small.includes(n + " " + Math.round(r.height))) small.push(n + " " + Math.round(r.height));
      }
    }
    return { vw, scrollW: document.documentElement.scrollWidth,
             tabs: document.querySelectorAll(".tabs button").length,
             machines: document.querySelectorAll("#showroom .bench-part-name").length,
             over: over.slice(0, 4), small: small.slice(0, 4) };
  }, TAP_FLOOR);

  /* and into a lab, by TOUCH, the way a student gets there */
  let dock = false, runErr = "";
  try {
    await p.tap("#tab-raid").catch(async () => { await p.click("#tab-raid"); });
    await p.waitForTimeout(120);
    await p.selectOption("#length", "lab");
    await p.tap(".btn.start").catch(async () => { await p.click(".btn.start"); });
    await p.waitForFunction(() => window.__UTHL && window.__UTHL.running(), { timeout: 20000 });
    dock = await p.waitForFunction(() => !!document.querySelector(".model-dock canvas"), { timeout: 20000 })
      .then(() => true).catch(() => false);
  } catch (e) { runErr = String(e.message || e).slice(0, 60); }

  const inLab = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const over = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1.5 || r.right > vw + 1.5) {
        const n = (el.className && String(el.className).split(" ")[0]) || el.tagName;
        if (!over.includes(n)) over.push(n);
      }
    }
    return { scrollW: document.documentElement.scrollWidth, vw, over: over.slice(0, 4) };
  });

  const sideways = front.scrollW > front.vw + 1 || inLab.scrollW > inLab.vw + 1;
  const trouble = [];
  if (!room) trouble.push("no showroom canvas");
  if (front.tabs !== 8) trouble.push("only " + front.tabs + " tabs");
  if (front.machines !== 11) trouble.push("only " + front.machines + " machines");
  if (sideways) trouble.push("scrolls sideways (front " + front.scrollW + "/" + front.vw +
                             ", lab " + inLab.scrollW + "/" + inLab.vw + ")");
  if (front.over.length) trouble.push("wider than the screen: " + front.over.join(","));
  if (inLab.over.length) trouble.push("wide in the lab: " + inLab.over.join(","));
  if (front.small.length) trouble.push("tap target under " + TAP_FLOOR + "px: " + front.small.join(", "));
  if (!dock) trouble.push("no model in the lab" + (runErr ? " (" + runErr + ")" : ""));
  if (errs.length) trouble.push("page error: " + errs[0]);

  if (trouble.length) bad++;
  console.log("  " + label.padEnd(30) + String(dev.viewport.width) + "x" + dev.viewport.height +
              " @" + dev.deviceScaleFactor + "  " +
              (trouble.length ? "FAIL — " + trouble.join("; ") : "ok"));
  await ctx.close();
}
await b.close(); srv.close();
console.log("");
if (bad) { console.log(bad + " of " + PROFILES.length + " device profiles have trouble"); process.exit(1); }
console.log("all " + PROFILES.length + " device profiles: room mounts, every lab reachable, " +
            "model draws in the lab, nothing scrolls sideways");
