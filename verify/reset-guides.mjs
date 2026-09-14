/* THE RESET PUTS THEM BACK; IT NEVER TAKES THE HELP AWAY.

   Standing rule from the owner: never give the answer, hint instead, and
   reset the exercise back to the last part they got correct so a wrong
   answer cannot carry forward.

   Two things have to be true at once, and they pull against each other:

     1. the working state goes BACK when they are stuck;
     2. the hint level does NOT — every rung they have earned stays.

   Getting (2) wrong is the easy mistake, because tracker.reset() exists
   and looks like exactly the right call. It would take the guidance away
   at the moment it is needed, and the student would be walked round the
   same loop forever.

   Driven in a real browser, on the real page, because a reset is a DOM
   behaviour and no amount of reading the module proves it fires. */
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
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

let bad = 0;
const say = (ok, m) => { if (!ok) bad++; console.log((ok ? "  ok   " : "  FAIL ") + m); };

/* Find a lab/stage carrying an `order` question, then drive it. */
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto("http://127.0.0.1:" + PORT + "/");
await p.waitForTimeout(300);
const found = await p.evaluate(async () => {
  for (const lab of window.__UTHL.built()) {
    window.__UTHL.choose(lab, "project");
    await new Promise((r) => setTimeout(r, 120));
    window.__UTHL.start();
    await new Promise((r) => setTimeout(r, 200));
    const run = window.__UTHL.running();
    for (let i = 0; i < run.stageCount(); i++) {
      run.go(i);
      await new Promise((r) => setTimeout(r, 220));
      if (document.querySelector(".seq") && document.querySelector(".tray")) {
        return { lab, stage: i };
      }
    }
  }
  return null;
});
if (!found) { say(false, "no lab has an `order` question to test the reset on"); }
else {
  console.log("  driving " + found.lab + " stage " + found.stage + " (an `order` question)");
  /* Build a deliberately wrong sequence: take the chips in the order the
     tray happens to offer them, which is shuffled, and commit it. */
  const r = await p.evaluate(async () => {
    const out = {};
    const chips = () => [...document.querySelectorAll(".tray .chip")];
    const placed = () => [...document.querySelectorAll(".seq .chip")];
    const commit = () => [...document.querySelectorAll(".btn.primary")]
      .find((x) => /order/i.test(x.textContent));

    /* BUILD A SEQUENCE THAT IS WRONG NEAR THE END, ON PURPOSE.
       The first cut of this test just took the chips in the order the
       tray offered them — and for this seed that order is CORRECT, so
       the question answered itself and every assertion failed against a
       question that was already finished. Swapping the last two makes it
       wrong late, which is what exercises truncation rather than the
       clear-everything path.
       Clicked BY LABEL, because placing a chip re-renders the tray and
       every index after it shifts. */
    async function fillWrong() {
      const labels = chips().map((c) => c.textContent);
      if (labels.length >= 2) {
        const t = labels[labels.length - 1];
        labels[labels.length - 1] = labels[labels.length - 2];
        labels[labels.length - 2] = t;
      }
      for (const L of labels) {
        const c = chips().find((x) => x.textContent === L);
        if (c) c.click();
        await new Promise((s) => setTimeout(s, 8));
      }
    }

    await fillWrong();
    out.placedBefore = placed().length;
    out.commitFound = !!commit();
    if (!commit()) return out;
    commit().click();
    await new Promise((s) => setTimeout(s, 140));
    out.placedAfter = placed().length;
    out.msg = (document.querySelector(".fb") || {}).textContent || "";

    /* now drive it far enough to earn the hint ladder */
    for (let i = 0; i < 4; i++) {
      await fillWrong();
      if (commit()) commit().click();
      await new Promise((s) => setTimeout(s, 110));
    }
    const rungNow = () => {
      const r = document.querySelector(".hint .hint-rung");
      const m = r && /Hint (\d)/.exec(r.textContent);
      return m ? Number(m[1]) : 0;
    };
    out.rungBefore = rungNow();
    const rb = [...document.querySelectorAll(".btn.ghost")].find((x) => !x.hidden);
    out.restartShown = !!rb;
    if (rb) {
      rb.click();
      await new Promise((s) => setTimeout(s, 140));
      out.placedAfterRestart = placed().length;
      /* READING THE HINT BOX STRAIGHT AFTER THE CLICK PROVES NOTHING.
         showGuidance only removes it on the NEXT wrong answer, so a
         reset that had secretly wiped the attempt count still left the
         old hint sitting on screen and the check passed. Calibration
         caught that: the planted defect did not fire.
         So take one more wrong attempt and read the rung it comes back
         at. Wiped counter -> attempt 1 -> rung 0 -> the box is removed.
         Intact counter -> still rung 3. */
      await fillWrong();
      if (commit()) commit().click();
      await new Promise((s) => setTimeout(s, 140));
      out.rungAfter = rungNow();

      /* UNLIMITED TRIES, UNLIMITED HINTS. The owner's rule: a student
         never runs out of attempts and never stops being helped. The
         ladder tops out at rung 3 by design — there is no rung that
         names the answer — so "unlimited" means rung 3 keeps coming
         back, and the question never locks itself.
         Twenty more wrong attempts: the commit button must still work
         and the hint must still be there at the end of them. */
      for (let i = 0; i < 20; i++) {
        await fillWrong();
        if (commit()) commit().click();
        await new Promise((s) => setTimeout(s, 45));
      }
      out.rungAfter20 = rungNow();
      out.stillLive = !!commit() && !commit().disabled;
    }
    return out;
  });
  say(r.placedAfter < r.placedBefore,
      "a wrong sequence is rolled back (" + r.placedBefore + " placed -> " + r.placedAfter + ")");
  say(/right|Cleared/.test(r.msg), "and it says in words where it put them back to");
  say(r.restartShown, "the restart control appears once the hint ladder has started");
  say(r.placedAfterRestart === 0, "restart clears the working state");
  /* THE POINT OF THE WHOLE CHECK. */
  say(r.rungBefore >= 1, "the ladder had reached rung " + r.rungBefore + " before the reset");
  say(r.rungAfter20 === 3 && r.stillLive,
      "after 25 wrong guesses it is still accepting attempts and still hinting at rung " +
      r.rungAfter20 + " — unlimited tries, unlimited hints, and never the answer");
  say(r.rungAfter >= r.rungBefore,
      "and the NEXT attempt after the reset still comes back at rung " + r.rungAfter +
      " — the state went back, the earned help did not");
}
await p.close(); await b.close(); srv.close();
console.log(bad ? bad + " FAILURES" : "reset puts the state back and leaves the guidance alone");
process.exit(bad ? 1 : 0);
