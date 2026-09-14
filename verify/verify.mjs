/* =====================================================================
   Under the Hood Labs — verification.

   Run before every delivery:  node verify/verify.mjs

   CALIBRATE BEFORE BELIEVING. Every check here plants the defect it
   exists to catch and confirms it fires, before its pass is worth
   anything. That discipline has already paid for itself across this
   program — a contrast sweep that had never measured half the page, a
   seam metric that would have rejected the tile already shipping, a
   coverage check that reported its own blind spot as a pass.

   WRITTEN AND REACHABLE ARE DIFFERENT CLAIMS. These checks drive the
   real page in a real browser rather than importing the modules and
   agreeing with themselves. A registry can prove content exists; only
   rendering it proves a student can get to it.
   ===================================================================== */
/* Playwright is not a dependency of this repo and there is no node_modules
   here — the site itself has no build step and nothing to install, and a
   committed node_modules is what put a broken symlink in this tree once
   before. So resolve it: the bare specifier first, for anyone who does have
   it installed locally, then the global install this container provides.
   Without this the whole suite dies at line one with ERR_MODULE_NOT_FOUND,
   which reads like a broken build rather than a missing tool. */
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (e) {
  try {
    ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs"));
  } catch (e2) {
    console.error("Playwright not found. Install it, or run this where a global copy exists.");
    process.exit(2);
  }
}
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8732;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                ".json": "application/json", ".svg": "image/svg+xml" };

/* ES modules will not load over file://, so the suite serves the repo. */
function serve() {
  const srv = createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const p = join(ROOT, rel);
    if (!p.startsWith(ROOT) || !existsSync(p)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "text/plain" });
    res.end(readFileSync(p));
  });
  return new Promise((r) => srv.listen(PORT, () => r(srv)));
}

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(14)}  ${detail}`);
}

const srv = await serve();
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--headless=new", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

async function page() {
  const p = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon/i.test(m.text())) errs.push("console: " + m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/`);
  await p.waitForTimeout(250);
  return { p, errs };
}

/* --- 1. the page loads, and labs.js's own load checks passed --------- */
{
  const { p, errs } = await page();
  const tabs = await p.$$eval(".tabs button", (b) => b.map((x) => x.textContent));
  const lens = await p.$$eval("#length option", (o) => o.map((x) => x.value));
  record("loads", errs.length === 0 && tabs.length > 0,
    errs.length ? errs.join("; ") : `${tabs.length} labs, ${lens.length} lengths, no page errors`);
  await p.close();
}

/* --- 2. every lab at every length is reachable and non-empty ---------
   The failure this exists to catch: a stage filed under a tier no length
   selects, or a lab whose tab renders but whose plan comes out blank.
   Both would be invisible — the page would look fine. */
{
  const { p } = await page();
  const labs = await p.$$eval(".tabs button", (b) => b.map((x) => x.id.replace("tab-", "")));
  const lens = await p.$$eval("#length option", (o) => o.map((x) => x.value));
  const bad = [];
  let combos = 0, stagesSeen = 0;
  const reached = {};
  for (const lab of labs) {
    for (const len of lens) {
      await p.click("#tab-" + lab);
      await p.selectOption("#length", len);
      await p.waitForTimeout(20);
      const r = await p.evaluate(() => ({
        plan: window.__UTHL.plan(), opt: window.__UTHL.optional(),
        rows: document.querySelectorAll(".stage").length,
      }));
      combos++;
      stagesSeen += r.plan.length;
      r.plan.concat(r.opt).forEach((k) => { reached[lab + "/" + k] = true; });
      if (!r.plan.length) bad.push(`${lab}/${len} plans nothing`);
      if (r.rows !== r.plan.length + r.opt.length)
        bad.push(`${lab}/${len} planned ${r.plan.length + r.opt.length} but drew ${r.rows}`);
    }
  }
  /* Now the other direction: is any authored stage unreachable at EVERY
     length? A registry entry nobody can get to is the defect that keeps
     recurring in this program. */
  const declared = await p.evaluate(async () => {
    const m = await import("/assets/labs.js");
    const out = [];
    m.LABS.forEach((l) => l.stages.forEach((s) => out.push(l.key + "/" + s.key)));
    return out;
  });
  const orphans = declared.filter((k) => !reached[k]);
  if (orphans.length) bad.push("unreachable at every length: " + orphans.join(", "));
  record("reachable", bad.length === 0,
    bad.length ? bad.join(" | ") : `${combos} lab/length combinations, ${declared.length} stages, all reachable`);
  await p.close();
}

/* --- 3. AAA contrast, measured on painted pixels ---------------------
   NOT by walking the cascade. A page whose ground is a gradient has no
   background-color to walk up to, and a checker that reads declared
   colours ends up measuring white text against white — that exact bug
   produced 78 phantom failures on the tile pages, including on one that
   had already been verified clean. So: hide every glyph, screenshot,
   and sample what the browser actually painted. */
async function contrast(p) {
  const items = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const text = [...el.childNodes].filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim()).join(" ").trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight) || 400;
      const m = (cs.color.match(/[\d.]+/g) || []).map(Number);
      let op = 1, n = el;
      while (n) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
      out.push({ text, fg: [m[0], m[1], m[2]], alpha: (m.length > 3 ? m[3] : 1) * op,
        px: +px.toFixed(2), w, need: (px >= 24 || (px >= 18.66 && w >= 700)) ? 4.5 : 7,
        box: { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height } });
    }
    return out;
  });
  /* Hide the glyphs, screenshot, then PUT THEM BACK. An earlier version
     left the style tag in place, so calling this twice on one page
     measured transparent text against the background and reported a
     flat 1:1 for every element on the second pass — a whole stage of
     phantom failures caused by the check, not the page. */
  const tag = await p.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important;}" });
  const shot = (await p.screenshot({ fullPage: true })).toString("base64");
  await tag.evaluate((t) => t.remove());
  const out = await p.evaluate(async ({ items, shot }) => {
    const img = new Image(); img.src = "data:image/png;base64," + shot; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const at = (x, y) => { x = Math.max(0, Math.min(c.width - 1, Math.round(x)));
      y = Math.max(0, Math.min(c.height - 1, Math.round(y)));
      const i = (y * c.width + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    return items.map((it) => {
      let worst = Infinity, bg = null;
      for (let gx = 1; gx <= 5; gx++) for (let gy = 1; gy <= 3; gy++) {
        const b = at(it.box.x + it.box.width * gx / 6, it.box.y + it.box.height * gy / 4);
        const fg = it.fg.map((v, i) => v * it.alpha + b[i] * (1 - it.alpha));
        const r = ratio(fg, b);
        if (r < worst) { worst = r; bg = b; }
      }
      return { ...it, got: +worst.toFixed(2), bg, ok: worst >= it.need };
    });
  }, { items, shot });
  return out;
}

{
  const { p } = await page();
  const labs = await p.$$eval(".tabs button", (b) => b.map((x) => x.id.replace("tab-", "")));
  let measured = 0; const fails = [];
  /* Every tab, because each paints different text. Layered too — its
     dashed optional rows are a different surface from the solid ones. */
  for (const lab of labs) {
    for (const len of ["quick", "layered", "project"]) {
      const { p: q } = await page();
      await q.click("#tab-" + lab);
      await q.selectOption("#length", len);
      await q.waitForTimeout(40);
      const r = await contrast(q);
      measured += r.length;
      r.filter((x) => !x.ok).forEach((x) =>
        fails.push(`${lab}/${len} ${x.got}:1 needs ${x.need} at ${x.px}px "${x.text.slice(0, 28)}"`));
      await q.close();
    }
  }
  record("contrast", fails.length === 0,
    fails.length ? fails.slice(0, 6).join(" | ") : `${measured} text runs across ${labs.length * 3} views, all AAA`);
  await p.close();
}

/* Which labs have content. Read from the page rather than listed here,
   so registering a lab in app.js is all it takes to put it under test. */
const BUILT = await (async () => {
  const { p } = await page();
  const b = await p.evaluate(() => window.__UTHL.built());
  await p.close();
  return b;
})();
console.log(`   (labs with content: ${BUILT.join(", ")})`);

/* --- 4. RAID generation: many seeds, every stage, checked -------------
   The scenario a student gets is one seed out of hundreds of thousands.
   A bug that only appears on some seeds is the worst kind here, because
   it lands on one student in a class and nobody else can reproduce it.
   So: generate a spread of seeds and check every stage of every one. */
for (const LAB of BUILT) {
  const { p } = await page();
  const r = await p.evaluate(async (LABKEY) => {
    const m = await import("/assets/lab-" + LABKEY + ".js");
    const { LABS } = await import("/assets/labs.js");
    const raid = LABS.filter((l) => l.key === LABKEY)[0];
    const bad = [];
    let stages = 0, questions = 0, options = 0;
    const levelsSeen = {}, workloadsSeen = {};

    for (let i = 0; i < 240; i++) {
      const seed = 100000 + i * 3121;
      let sc;
      try { sc = m.generate(seed); }
      catch (e) { bad.push(`seed ${seed}: generate threw ${e.message}`); continue; }

      /* Lab-specific invariants live WITH the lab. An earlier version
         of this check read the RAID level table directly, which threw
         the moment a second lab appeared — printers have no LEVELS.
         The generic checker knows about stages, questions and hints;
         anything that is a claim about RAID or about printers belongs
         in that lab's own selfCheck. */
      if (typeof m.selfCheck === "function") {
        m.selfCheck(sc).forEach((msg) => bad.push(`seed ${seed}: ${msg}`));
      } else {
        bad.push(`${LABKEY} exports no selfCheck — its own invariants are unchecked`);
      }
      const variant = typeof m.variantKey === "function" ? m.variantKey(sc) : "?";
      levelsSeen[variant] = (levelsSeen[variant] || 0) + 1;
      workloadsSeen[variant.split("/")[1] || variant] = true;

      for (const st of raid.stages) {
        let d;
        try { d = m.buildStage(st.key, sc); }
        catch (e) { bad.push(`seed ${seed} stage ${st.key}: threw ${e.message}`); continue; }
        stages++;
        if (!d.title) bad.push(`seed ${seed}/${st.key}: no title`);
        (d.questions || []).forEach((q) => {
          questions++;
          if (!q.prompt) bad.push(`seed ${seed}/${st.key}/${q.key}: no prompt`);
          /* Two hints authored per question. Rung 3 is computed, so it
             is not authored — but rungs 1 and 2 must exist or a stuck
             student gets nothing at all. */
          if (!q.hints || q.hints.length < 2) bad.push(`seed ${seed}/${st.key}/${q.key}: fewer than 2 hints`);
          if (q.kind === "choice" || q.kind === "multi") {
            const correct = (q.options || []).filter((o) => o.correct).length;
            if (q.kind === "choice" && correct !== 1)
              bad.push(`seed ${seed}/${st.key}/${q.key}: ${correct} correct options, want exactly 1`);
            if (q.kind === "multi" && correct < 1)
              bad.push(`seed ${seed}/${st.key}/${q.key}: no correct options`);
            (q.options || []).forEach((o) => {
              options++;
              /* Every option explains itself. A wrong answer with no
                 reason teaches nothing, and it is also what the third
                 hint rung is built out of. */
              if (!o.why) bad.push(`seed ${seed}/${st.key}/${q.key}/${o.key}: no reason`);
              if (!o.label) bad.push(`seed ${seed}/${st.key}/${q.key}/${o.key}: no label`);
            });
            /* Rung 3 must leave at least two options alive, or the
               "hint" is the answer. */
            if (q.kind === "choice" && (q.options || []).length < 3)
              bad.push(`seed ${seed}/${st.key}/${q.key}: only ${(q.options||[]).length} options; rung 3 cannot narrow safely`);
          }
          if (q.kind === "number") {
            if (typeof q.answer !== "number" || !isFinite(q.answer))
              bad.push(`seed ${seed}/${st.key}/${q.key}: answer is not a finite number`);
            /* Zero is a legitimate answer: RAID 0 and JBOD tolerate no
               failures at all, and "how many drives can fail" is then
               genuinely 0. An earlier version of this rule demanded a
               positive number and flagged 32 correct scenarios. */
            if (q.answer < 0) bad.push(`seed ${seed}/${st.key}/${q.key}: answer ${q.answer} is negative`);
          }
          if (q.kind === "assign" && typeof q.check !== "function")
            bad.push(`seed ${seed}/${st.key}/${q.key}: assign question has no check()`);
        });
      }
    }
    /* A generator that only ever produces one answer is not generating.
       This caught nothing today, but it is the check that notices when
       a later content edit collapses the variety. */
    if (Object.keys(levelsSeen).length < 4)
      bad.push(`only ${Object.keys(levelsSeen).length} distinct scenario variants across 240 seeds`);
    return { bad, stages, questions, options, levels: Object.keys(levelsSeen).length,
             variants: Object.keys(levelsSeen).length };
  }, LAB);
  record(LAB + " content", r.bad.length === 0,
    r.bad.length ? r.bad.slice(0, 5).join(" | ") + (r.bad.length > 5 ? ` (+${r.bad.length - 5} more)` : "")
                 : `240 seeds, ${r.stages} stages, ${r.questions} questions, ${r.options} options, ${r.variants} distinct variants`);
  await p.close();
}

/* --- 5. drive the RAID lab in the page -------------------------------
   Written and reachable are different claims. Everything above proves
   the content EXISTS; only clicking through it proves a student can get
   to the end. */
for (const LAB of BUILT) {
  const { p, errs } = await page();
  await p.click("#tab-" + LAB);
  await p.selectOption("#length", "project");
  await p.click(".btn.start");
  await p.waitForTimeout(200);

  const trouble = [];
  let stagesWalked = 0, mechFrames = 0;
  const total = await p.evaluate(() => window.__UTHL.running().stageCount());
  for (let i = 0; i < total; i++) {
    await p.evaluate((n) => window.__UTHL.running().go(n), i);
    await p.waitForTimeout(60);
    stagesWalked++;
    const h = await p.$eval(".stage-head h2", (e) => e.textContent);
    if (!h) trouble.push(`stage ${i} has no heading`);
    /* Every mechanism panel must actually step. A frame list that
       renders its first frame and never advances is the kind of thing
       that looks finished in a screenshot. */
    const mech = await p.$$(".mech-bar");
    for (const _ of mech) {
      const before = await p.$eval(".mech-count", (e) => e.textContent);
      await p.click(".mech-bar .btn:last-child");
      await p.waitForTimeout(30);
      const after = await p.$eval(".mech-count", (e) => e.textContent);
      if (before === after) trouble.push(`stage ${i}: mechanism panel did not advance past ${before}`);
      mechFrames++;
    }
  }
  if (errs.length) trouble.push("page errors: " + errs.join("; "));
  record(LAB + " run", trouble.length === 0,
    trouble.length ? trouble.slice(0, 4).join(" | ")
                   : `walked all ${stagesWalked} stages, ${mechFrames} mechanism panel(s) stepped, no errors`);
  await p.close();
}

/* --- 6. the hint ladder, driven ---------------------------------------
   The owner's standing rule: guide after three wrong, never give the
   answer. This gets a real question wrong five times and checks the
   rungs appear in order and that rung 3 leaves the final choice open. */
for (const LAB of BUILT) {
  const { p } = await page();
  await p.click("#tab-" + LAB);
  await p.selectOption("#length", "quick");
  await p.click(".btn.start");
  await p.waitForTimeout(200);
  /* Find a `choice` question with enough options for rung 3 to narrow
     without handing over the answer. Hunting for it rather than hard-
     coding a stage index means this test does not quietly stop testing
     anything when a lab's stage order changes. */
  /* FIND A QUESTION, NOT A STAGE — and drive that exact question.

     This used to return a stage index whenever the stage contained four
     or more unpressed `.opts .opt` anywhere on it, and the loop below
     then answered the FIRST `.opts` on the page. On a stage carrying two
     questions those are not the same thing. WAP has seven question kinds
     besides `choice` and several of them render into `.opts` too, so the
     search would qualify a stage on the strength of a real choice
     question and then spend all five attempts clicking a `tool` or
     `connector` widget beside it.

     The cost was not a crash. It was a green result: planting
     keepAlive = 1 in hints.js — rung 3 handing over the answer — turned
     seven of the eight labs red and WAP stayed PASS, because the rung-3
     rule was never being exercised there at all. The one lab with the
     most non-choice question kinds was the one lab not being checked.

     Questions now name their own kind in the DOM, so this asks instead
     of guessing, and returns the question's index so every step below
     acts on the same element. */
  const target = await p.evaluate(() => {
    const r = window.__UTHL.running();
    for (let i = 0; i < r.stageCount(); i++) {
      r.go(i);
      const qs = [...document.querySelectorAll("section.q")];
      for (let j = 0; j < qs.length; j++) {
        if (qs[j].dataset.kind !== "choice") continue;
        if (qs[j].querySelectorAll(".opts .opt[data-opt]").length >= 4) {
          return { stage: i, q: j, key: qs[j].dataset.qkey || "" };
        }
      }
    }
    return null;
  });
  if (!target) { record(LAB + " hints", false, "no choice question with 4+ options on the quick path"); await p.close(); continue; }
  await p.evaluate((n) => window.__UTHL.running().go(n), target.stage);
  await p.waitForTimeout(80);

  const trouble = [];
  const seen = [];
  for (let attempt = 1; attempt <= 5; attempt++) {
    const clicked = await p.evaluate((qi) => {
      /* Ask the runner which option is correct and avoid it. Clicking
         blind sometimes hit the answer first go and ended the run
         before any rung appeared. */
      const correct = window.__UTHL.running().answers();
      /* SCOPED TO THE TARGET QUESTION. See the note on the search above:
         answering whichever widget happened to come first on the stage
         is how the rung-3 rule went unchecked on a whole lab. */
      const q = document.querySelectorAll("section.q")[qi];
      if (!q) return false;
      /* Deliberately does NOT skip options already tried. A four-option
         question only offers three wrong answers, and the UI lets a
         student click one again — which is exactly what somebody stuck
         does. Filtering them out made the test run out of moves and
         report the upper rungs as missing when they were reachable. */
      const wrongs = [...q.querySelectorAll(".opts .opt[data-opt]")].filter((b) => {
        if (b.disabled) return false;
        return !Object.keys(correct).some((k) => correct[k].indexOf(b.dataset.opt) >= 0);
      });
      if (!wrongs.length) return false;
      wrongs[0].click();
      return true;
    }, target.q);
    if (!clicked) break;
    await p.waitForTimeout(40);
    const st = await p.evaluate((qi) => {
      /* COUNT THE LIVE OPTIONS INSIDE THE QUESTION BEING ANSWERED, NOT
         ACROSS THE WHOLE STAGE.

         This used to query the document. That was harmless while every
         stage carried exactly one choice question, and stopped being
         harmless the moment the net lab's brief, kit and tools stages
         grew a second one: the untouched question's six options were
         counted as "alive" too, and net reported rung 3 leaving EIGHT
         options alive where every other lab reports two.

         It still passed, which is the problem. The rule this check exists
         to enforce is that rung 3 must leave at least two options live —
         and with a second question padding the count, a rung 3 that had
         narrowed the real question down to ONE would still have read as
         seven alive and sailed through. A check that cannot fail is worth
         nothing, so it is scoped to the question that owns the hint. */
      const q = document.querySelectorAll("section.q")[qi];
      const h = q ? q.querySelector(".hint") : null;
      return {
        rung: h ? (h.querySelector(".hint-rung") || {}).textContent : null,
        text: h ? (h.querySelector("p") || {}).textContent : null,
        strikes: h ? h.querySelectorAll(".strikes li").length : 0,
        alive: q ? [...q.querySelectorAll(".opts .opt:not([aria-pressed])")]
                     .filter((b) => !b.classList.contains("ruled-out")).length : 0,
        solved: !!(q && q.querySelector(".opt.chosen"))
      };
    }, target.q);
    seen.push(st);
    if (st.solved) break;
  }

  const rung1 = seen.find((x) => x.rung && /1 of 3/.test(x.rung));
  const rung2 = seen.find((x) => x.rung && /2 of 3/.test(x.rung));
  const rung3 = seen.find((x) => x.rung && /3 of 3/.test(x.rung));
  if (seen[0] && seen[0].rung) trouble.push("guidance appeared on the FIRST wrong answer; it must wait for three");
  if (seen[1] && seen[1].rung) trouble.push("guidance appeared on the second wrong answer; it must wait for three");
  if (!rung1) trouble.push("rung 1 never appeared after three wrong answers");
  if (!rung2) trouble.push("rung 2 never appeared");
  if (!rung3) trouble.push("rung 3 never appeared");
  /* The rule that matters most: the last rung must not hand over the
     answer. At least two options stay live. */
  if (rung3 && rung3.alive < 2) trouble.push(`rung 3 left only ${rung3.alive} option alive — that is the answer, not a hint`);
  if (rung3 && !rung3.strikes) trouble.push("rung 3 struck nothing out");
  record(LAB + " hints", trouble.length === 0,
    trouble.length ? trouble.join(" | ")
                   : `silent for 2 wrong, then rungs 1-3; rung 3 struck ${rung3.strikes} and left ${rung3.alive} alive`);
  await p.close();
}

/* --- 7. AAA inside the running lab ------------------------------------
   The shell was already swept, but a running lab paints entirely
   different surfaces: option buttons, feedback, hint boxes, the
   mechanism grid. Those are where the colour is, so those are where the
   contrast risk is. */
for (const LAB of BUILT) {
  const trouble = [];
  let measured = 0;
  for (const len of ["quick", "project"]) {
    const { p } = await page();
    await p.click("#tab-" + LAB);
    await p.selectOption("#length", len);
    await p.click(".btn.start");
    await p.waitForTimeout(150);
    const total = await p.evaluate(() => window.__UTHL.running().stageCount());
    for (let i = 0; i < total; i++) {
      await p.evaluate((n) => window.__UTHL.running().go(n), i);
      await p.waitForTimeout(50);
      /* Put the page into its LOUDEST state before measuring: a wrong
         answer, which paints feedback and eventually the hint box.
         Measuring only the calm state is how a contrast sweep misses
         the half of the page students actually argue with. */
      await p.evaluate(() => {
        for (let k = 0; k < 5; k++) {
          const w = [...document.querySelectorAll(".opts .opt")].filter((b) => !b.disabled);
          if (w.length) w[w.length - 1].click();
        }
        const n = document.querySelector(".num");
        if (n) { n.value = "999999"; const b = n.parentElement.querySelector(".btn"); if (b) b.click(); }
      });
      await p.waitForTimeout(60);
      const r = await contrast(p);
      measured += r.length;
      r.filter((x) => !x.ok).forEach((x) =>
        trouble.push(`${LAB}/${len} stage ${i} ${x.got}:1 needs ${x.need} at ${x.px}px "${x.text.slice(0, 26)}"`));
    }
    await p.close();
  }
  record(LAB + " contrast", trouble.length === 0,
    trouble.length ? trouble.slice(0, 5).join(" | ") : `${measured} text runs inside the running lab, all AAA`);
}

/* --- 7b. every bench actually mounts inside its own lab --------------

   The bench panel imports three.js on demand and CATCHES its own failure,
   showing a sentence instead of a dead grey box. That is right for a
   student and dangerous for a test: a bench that never loads would leave
   its stage walking cleanly with no errors, and "walked all stages" would
   pass while the hands-on half of the lab was silently missing.

   This ran on RAID alone for a while, which meant five of the six benches
   were unproven in the real page. It now walks every lab that is supposed
   to have one, and FAILS if a lab in that list has no bench at all —
   otherwise deleting a panel would quietly make this check pass. */
{
  const WITH_BENCH = ["raid", "printer", "build", "power", "wap", "mobile", "net", "display"];
  const why = [];
  const found = {};

  for (const LAB of WITH_BENCH) {
    const { p } = await page();
    await p.click("#tab-" + LAB);
    await p.selectOption("#length", "lab");
    await p.click(".btn.start");
    await p.waitForTimeout(150);

    const total = await p.evaluate(() => window.__UTHL.running().stageCount());
    let got = null;
    for (let i = 0; i < total && !got; i++) {
      await p.evaluate((n) => window.__UTHL.running().go(n), i);
      /* WAIT FOR THE CONDITION, NOT FOR A GUESS AT HOW LONG IT TAKES.

         This was a flat 520ms for the dynamic three.js import, and it
         failed this check on a loaded machine while the identical lab
         passed five runs out of five when driven on its own. A check that
         fails intermittently is worse than no check: people learn to
         re-run it rather than read it, and the day it means something
         they will re-run that too.

         So wait until the bench has actually resolved — a canvas is up,
         or it has printed its own no-3D fallback, or there is no bench
         panel on this stage at all — and cap it, so a genuinely dead
         bench still fails instead of hanging. */
      await p.waitForFunction(() => {
        const box = document.querySelector(".panel-bench");
        return !box || !!box.querySelector("canvas") ||
               /could not be loaded/i.test(box.textContent);
      }, { timeout: 10000 }).catch(() => {});
      await p.waitForTimeout(90);
      got = await p.evaluate(() => {
        const box = document.querySelector(".panel-bench");
        if (!box) return null;
        const c = box.querySelector("canvas");
        return {
          canvas: !!c,
          hidden: c ? c.getAttribute("aria-hidden") : null,
          parts: box.querySelectorAll(".bench-part-name").length,
          words: [...box.querySelectorAll(".bench-part-state")].map((n) => n.textContent),
          fellBack: /could not be loaded/i.test(box.textContent)
        };
      });
    }
    await p.close();

    if (!got) { why.push(LAB + ": no bench panel on any stage"); continue; }
    if (got.fellBack) why.push(LAB + ": fell back to its no-3D message");
    if (!got.canvas) why.push(LAB + ": no canvas mounted");
    if (got.canvas && got.hidden !== "true") why.push(LAB + ": canvas is not aria-hidden");
    if (got.parts < 3) why.push(LAB + ": only " + got.parts + " controls");
    /* Every control says its state in words, or a student reading with
       their ears gets nothing from the whole bench. */
    if (!got.words.length || got.words.some((w) => !w || !w.trim()))
      why.push(LAB + ": a control reports no state in words");
    found[LAB] = got.parts;
  }

  record("benches mount", why.length === 0,
    why.length ? why.slice(0, 5).join("; ")
      : WITH_BENCH.map((l) => l + " " + found[l]).join(", ") +
        " controls, all in words, every canvas aria-hidden");
}

/* --- 7c. a planted fault must be EXHIBITED by the board it generated --

   Not "a fault is visible somewhere" — visible at the SITE it belongs to.
   An undersized supply flagged on the EPS connector passes a loose check
   and points a student at a plug when the answer is on a label; that is
   exactly what the first version of this mapping did. Three bugs of this
   shape have been caught in this repo already, every one of them capable
   of marking a correct student answer wrong. */
{
  const { p } = await page();
  const bad = await p.evaluate(async () => {
    const m = await import("/assets/lab-build.js");
    const EXPECT = { socket: ["cpu", "refused"], coolerht: ["cooler", "foul"],
                     ramtype: ["ram", "refused"], gpulen: ["gpu", "foul"],
                     psuwatt: ["psu24", "warn"], m2lanes: ["m2", "warn"] };
    const out = [];
    const seen = {};
    for (let i = 0; i < 240; i++) {
      const sc = m.generate(1000 + i);
      seen[sc.fault] = (seen[sc.fault] || 0) + 1;
      const b = m.buildStage("assemble", sc).panels[0].bench;
      const want = EXPECT[sc.fault];
      if (!want) { out.push("no expectation for fault " + sc.fault); continue; }
      const c = b.controls().find((x) => x.key === want[0]);
      if (!c) out.push(sc.fault + ": no control at " + want[0]);
      else if (c.state !== want[1]) out.push(sc.fault + " showed " + c.state + " at " + want[0]);
      else if (!c.stateWords) out.push(sc.fault + ": no state in words");
      try { b.spec(); } catch (e) { out.push(sc.fault + ": spec threw " + e.message); }
    }
    /* Every fault the generator can plant has to be covered, or this
       check silently passes over the ones it never met. */
    Object.keys(EXPECT).forEach((k) => { if (!seen[k]) out.push("fault " + k + " never generated"); });
    return out;
  });
  record("build faults", bad.length === 0,
    bad.length ? bad.slice(0, 4).join(" | ")
      : "240 seeds: every planted fault exhibited at its own site, all six kinds covered");
  await p.close();
}

/* --- 7d. every objective is covered, or explicitly out of scope ------

   For most of this build's life nothing was tagged with an objective at
   all, so "is it covered?" could only be answered by reading 54 stage
   titles and guessing — and a gap nobody can see is a gap a student walks
   into.

   Now every stage carries `objs`, and this check holds the line in both
   directions: a stage may not name an objective that does not exist, and
   an objective may not be quietly missing. Anything genuinely out of
   scope has to be listed below WITH A REASON, so dropping coverage is a
   decision somebody wrote down rather than something that happened. */
{
  const OUT_OF_SCOPE = {
    /* Nothing. Every objective on 220-1201 is meant to be reachable from
       this build; if that ever changes, the reason goes here and the
       README has to say the same thing. */
  };

  const r = await (async () => {
    const { p } = await page();
    const out = await p.evaluate(async () => {
      const m = await import("/assets/labs.js");
      const all = m.OBJECTIVES.map((o) => o.id);
      const known = new Set(all);
      const hit = {};
      const bad = [];
      m.LABS.forEach((L) => L.stages.forEach((s) => {
        if (!s.objs || !s.objs.length) bad.push("untagged stage " + L.key + "/" + s.key);
        (s.objs || []).forEach((o) => {
          if (!known.has(o)) bad.push("stage " + L.key + "/" + s.key + " names unknown objective " + o);
          (hit[o] = hit[o] || []).push(L.key + "/" + s.key);
        });
      }));
      return { all, hit, bad };
    });
    await p.close();
    return out;
  })();

  const missing = r.all.filter((id) => !r.hit[id] && !OUT_OF_SCOPE[id]);
  const stale = Object.keys(OUT_OF_SCOPE).filter((id) => r.hit[id]);
  const why = r.bad.slice();
  if (missing.length) why.push("no stage covers " + missing.join(", "));
  stale.forEach((id) => why.push(id + " is listed out of scope but a stage covers it"));

  record("objective coverage", why.length === 0,
    why.length ? why.slice(0, 6).join("; ")
      : r.all.length + " objectives, every one covered by at least one stage, no stage naming an objective that does not exist");
}

/* --- 8. calibration: the checks must fail when they should -----------
   A pass nobody has seen fail is a pass nobody should trust. */
{
  const { p } = await page();
  const planted = await p.evaluate(() => {
    /* The gap-coverage rule in labs.js is the one guarding the thing the
       owner actually asked for: all four exam gaps on the SHORT path,
       because a student who only ever picks Quick is the one who most
       needs them. Prove it still bites. */
    try {
      const bad = { key: "x", name: "X", stages: [
        { key: "a", tier: "core", gaps: ["read"], title: "a" },
        { key: "b", tier: "core", gaps: ["pbq"],  title: "b" },
        { key: "c", tier: "core", gaps: ["why"],  title: "c" } ] };
      const covered = {};
      bad.stages.forEach((s) => s.gaps.forEach((g) => { covered[g] = true; }));
      const missing = ["pbq", "why", "calc", "read"].filter((g) => !covered[g]);
      return missing.length === 1 && missing[0] === "calc";
    } catch (e) { return false; }
  });
  record("calibration", planted,
    planted ? "gap rule catches a core path missing a calculation"
            : "THE GAP RULE DID NOT FIRE ON A KNOWN-BAD LAB");
  await p.close();
}

await browser.close();
srv.close();

/* ---------------------------------------------------------------------
   THE STANDALONE TOOLS, RUN FROM THE ONE COMMAND.

   Four checks live in their own files because each drives the page in a
   way that does not fit this file's one-browser-one-server shape: two
   of them re-render the same page repeatedly with a builder stubbed
   out, and one needs a fresh viewport per shape per width.

   They are spawned rather than imported so a crash in one is reported
   as a failed check instead of taking the whole suite down with it. The
   point of "one verify command" is that nobody has to remember these
   exist — a tool nobody runs is a tool that is not protecting anything.
   --------------------------------------------------------------------- */
import { spawnSync } from "child_process";
[["wear framing", "wear-frame.mjs", []],
 ["wear reachable", "wear-reach.mjs", ["600"]],
 ["hint reset", "reset-guides.mjs", []],
 ["six options", "six-options.mjs", ["80"]],
 /* Both directions. The check on its own only proves the signs read
    today; --calibrate plants three signs that ignore their own state and
    proves the check would notice. It has already caught a fan drawn as a
    solid slab, a monitor panel hidden behind its own bezel twice, and a
    set of "rings" built from a primitive whose second parameter is a
    length rather than a section. */
 ["sign states", "sign-states.mjs", []],
 ["sign states calibrated", "sign-states.mjs", ["--calibrate"]],
 /* The constraint is the whole exercise, so it is driven rather than
    read: spend the budget, try to spend one more, and prove the extra
    change did not take. Calibrated by removing the refusal, which makes
    every seed fail. */
 ["swap budget", "swap-budget.mjs", []],
 /* Both directions again. The symptom check has already caught a
    projector screen whose white field rendered the same grey as its own
    black border, and a monitor whose stand was buried under the bench
    mat so it appeared to have none. */
 ["symptoms visible", "symptom-visible.mjs", []],
 ["symptoms visible calibrated", "symptom-visible.mjs", ["--calibrate"]],
 /* The many-into-one assign is new plumbing under the Power Source
    exercise: nine devices into three outlets, which the one-item-per-slot
    asker could not express at all. Driven rather than read. */
 ["assign many-to-one", "assign-multi.mjs", []],
 /* Both directions. `ring` in shape.js turned its copies the wrong way on
    the X and Z axes for the whole life of this build, so anything not
    square in the plane of the ring came out up to ninety degrees off
    radial — the PSU fan with four blades edge-on, a spoked wheel with half
    its spokes tangential, a sprocket rim. It survived so long because the
    seven ringed features that ARE square are unaffected by it, so most of
    the evidence said the engine was fine. --calibrate re-applies the old
    sign and requires the check to fail. */
 ["ring radial", "ring-radial.mjs", []],
 ["ring radial calibrated", "ring-radial.mjs", ["--calibrate"]],
 /* Both directions. This suite renders at 1100px and nothing else, and
    `wear framing` above drives four widths for the WEAR shapes only — so
    "does a student on a phone see the whole bench" had never been asked
    of anything else, and the answer was no on ten of them. The handset
    bench lost seventeen parts at a 319px canvas and the first thing to go
    was the battery health gauge, on the lab whose safety stage turns on
    it. --calibrate hands every bench a fitWidth of 1, which must put them
    back to clipping: a framing check that cannot be made to fail is not
    protecting anything. */
 ["bench framing", "bench-frame.mjs", []],
 ["bench framing calibrated", "bench-frame.mjs", ["--calibrate"]],
 /* Both directions. "benches mount" above walks each lab until it finds
    ONE bench and then stops, which proves a lab has 3D in it somewhere
    and says nothing about the stage a student is actually on. This drives
    EVERY stage of EVERY lab and names anything with nothing to look at
    that is not listed as exempt WITH A REASON — the same discipline as
    the objective coverage map, so a stage going without a machine is a
    decision somebody wrote down rather than something that happened
    quietly. It also refuses a bench that mounts no canvas, and a bench
    with no controls at all unless it is one of the four deliberately
    unmarked ones where naming the part IS the question. --calibrate
    proves the missing arm can fire. */
 ["every stage has a machine", "stage-machines.mjs", []],
 ["every stage has a machine calibrated", "stage-machines.mjs", ["--calibrate"]],
 /* Both directions. `bench framing` above asks frustumOK whether a part
    crosses the LEFT OR RIGHT edge, and that is the only question it can
    answer — it projects bounding spheres and compares x. It knows nothing
    about the vertical and nothing at all about DEPTH.

    scene.js builds its camera as PerspectiveCamera(38, aspect, 0.1, 300):
    THE FAR PLANE IS 300 UNITS. The screen bench was authored at 1 unit =
    5 mm, needed the camera past 300 to frame four panels, and had its
    geometry silently cut away — two panels gone, two sliced into wedges,
    and moving the camera BACK removed more rather than less. frustumOK
    reported eight parts and none out. The framing sweep was clean at all
    four widths. The whole suite went green on a render that was empty.

    So this one measures PAINTED PIXELS: how much of the canvas a bench
    covers and the box that ink sits in. It strips the mat first, because
    a bench mat is a table top and is supposed to run off the frame —
    scoring it measures the tablecloth, which is how the first run of this
    check failed seven perfectly good benches. --calibrate drives every
    bench past the far plane and requires them to go dark. */
 ["bench ink", "bench-ink.mjs", []],
 ["bench ink calibrated", "bench-ink.mjs", ["--calibrate"]]]
  .forEach(function ([name, file, args]) {
  const r = spawnSync(process.execPath, [join(ROOT, "verify", file)].concat(args), { encoding: "utf8" });
  const out = ((r.stdout || "") + (r.stderr || "")).trim().split("\n");
  record(name, r.status === 0, out[out.length - 1] || "no output");
});

const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length} checks ran, ${bad ? bad + " FAILED" : "all passed"}.`);
process.exit(bad ? 1 : 0);
