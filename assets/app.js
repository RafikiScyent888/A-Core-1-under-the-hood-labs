/* =====================================================================
   Shell: lab tabs, length choice, and the stage plan for that pairing.

   No lab content runs yet. This exists so the ARCHITECTURE can be looked
   at and argued with before six labs' worth of content is poured into
   it — the tiering and the gap coverage are the expensive things to get
   wrong, and they are cheap to change today.
   ===================================================================== */
import { LABS, LENGTHS, GAPS, stagesFor, optionalFor, labByKey } from "./labs.js";
import { createRunner } from "./runner.js";
import { newSeed } from "./rng.js";
import { mountToggle } from "./reading.js";

/* Lab modules are loaded on demand. Eight labs of generator and content
   is a lot to hand a student who wanted one of them, and this site has
   to work over a phone tether. */
const MODULES = {
  raid:    () => import("./lab-raid.js"),
  printer: () => import("./lab-printer.js"),
  build:   () => import("./lab-build.js"),
  power:   () => import("./lab-power.js"),
  wap:     () => import("./lab-wap.js"),
  mobile:  () => import("./lab-mobile.js"),
  net:     () => import("./lab-net.js"),
  display: () => import("./lab-display.js")
};
let running = null;

const STORE = "uthl.v1";

function remembered() {
  /* Storage throws outright in some contexts — a private window, a
     browser set to block site data, a thumbnailer. A remembered tab is a
     convenience; losing it must never take the page down with it. */
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function remember(state) {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* fine */ }
}

const saved = remembered();
let current = labByKey(saved.lab) ? saved.lab : LABS[0].key;
let length = LENGTHS[saved.length] ? saved.length : "lab";

const elTabs = document.getElementById("tabs");
const elSel = document.getElementById("length");
const elNote = document.getElementById("lengthnote");
const elPlan = document.getElementById("plan");

/* ---- build the tabs once ---- */
LABS.forEach(function (lab) {
  const b = document.createElement("button");
  b.type = "button";
  b.id = "tab-" + lab.key;
  b.setAttribute("role", "tab");
  b.textContent = lab.name;
  b.addEventListener("click", function () { current = lab.key; draw(); });
  const li = document.createElement("li");
  li.appendChild(b);
  elTabs.appendChild(li);
});

/* Arrow-key movement between tabs. A tablist that can only be reached by
   Tab-ing through every button is a tablist in name only. */
elTabs.addEventListener("keydown", function (e) {
  const keys = { ArrowLeft: -1, ArrowRight: 1, Home: "first", End: "last" };
  if (!(e.key in keys)) return;
  e.preventDefault();
  const i = LABS.map(function (l) { return l.key; }).indexOf(current);
  let next;
  if (keys[e.key] === "first") next = 0;
  else if (keys[e.key] === "last") next = LABS.length - 1;
  else next = (i + keys[e.key] + LABS.length) % LABS.length;
  current = LABS[next].key;
  draw();
  document.getElementById("tab-" + current).focus();
});

/* ---- the length dropdown ---- */
Object.keys(LENGTHS).forEach(function (k) {
  const o = document.createElement("option");
  o.value = k;
  o.textContent = LENGTHS[k].label;
  elSel.appendChild(o);
});
elSel.addEventListener("change", function () { length = elSel.value; draw(); });

function badge(g) {
  const s = document.createElement("span");
  s.className = "gap " + g;
  s.textContent = GAPS[g];
  return s;
}

function stageRow(s, n, optional) {
  const li = document.createElement("li");
  li.className = "stage" + (optional ? " optional" : "");

  const tier = document.createElement("span");
  tier.className = "tier";
  tier.textContent = optional ? "optional · " + s.tier : s.tier;
  li.appendChild(tier);

  const num = document.createElement("span");
  num.className = "n";
  num.textContent = optional ? "+" : n + ".";
  li.appendChild(num);

  const t = document.createElement("span");
  t.className = "t";
  t.textContent = s.title;
  li.appendChild(t);

  const gaps = document.createElement("div");
  gaps.className = "gaps";
  (s.gaps || []).forEach(function (g) { gaps.appendChild(badge(g)); });
  li.appendChild(gaps);
  return li;
}

function draw() {
  const lab = labByKey(current);
  elSel.value = length;
  elNote.textContent = LENGTHS[length].note;

  LABS.forEach(function (l) {
    const b = document.getElementById("tab-" + l.key);
    b.setAttribute("aria-selected", String(l.key === current));
  });

  const run = stagesFor(lab, length);
  const extra = optionalFor(lab, length);

  elPlan.textContent = "";

  const head = document.createElement("div");
  head.className = "lab-head";
  const h2 = document.createElement("h2");
  h2.textContent = lab.name;
  const p = document.createElement("p");
  p.textContent = lab.blurb;
  head.appendChild(h2);
  head.appendChild(p);
  elPlan.appendChild(head);

  const ul = document.createElement("ul");
  ul.className = "stages";
  run.forEach(function (s, i) { ul.appendChild(stageRow(s, i + 1, false)); });
  extra.forEach(function (s) { ul.appendChild(stageRow(s, 0, true)); });
  elPlan.appendChild(ul);

  const mod = MODULES[lab.key];
  if (mod) {
    /* Built. Offer to start it rather than starting on a tab click —
       a student flicking through tabs should not be dropped into a
       scenario they have not chosen a length for. */
    const go = document.createElement("button");
    go.type = "button";
    go.className = "btn primary start";
    go.textContent = "Start this lab";
    go.addEventListener("click", function () { start(lab, mod); });
    elPlan.appendChild(go);
  } else {
    const note = document.createElement("div");
    note.className = "notyet";
    const b = document.createElement("strong");
    b.textContent = "Not built yet. ";
    note.appendChild(b);
    note.appendChild(document.createTextNode(
      "This shows the plan for the lab and length you picked. " +
      run.length + " stage" + (run.length === 1 ? "" : "s") +
      (extra.length ? ", plus " + extra.length + " offered as optional depth." : ".")
    ));
    elPlan.appendChild(note);
  }

  remember({ lab: current, length: length });
}

async function start(lab, loader) {
  const m = await loader();
  const seed = newSeed();
  const scenario = m.generate(seed);
  const build = function (st) {
    const d = m.buildStage(st.key, scenario);
    return Object.assign({}, d, { key: st.key, tier: st.tier });
  };
  document.body.classList.add("running");
  running = createRunner(elPlan, {
    lab: lab,
    scenario: scenario,
    stages: stagesFor(lab, length).map(build),
    optional: optionalFor(lab, length).map(build),
    onRestart: function () { document.body.classList.remove("running"); running = null; draw(); }
  });
}

draw();

/* The reading toggle. Mounted here rather than written into the HTML so it
   cannot get out of step with what reading.js actually remembers — the
   checkbox reads its own state from storage on the way in. */
const readingHost = document.getElementById("reading");
if (readingHost) mountToggle(readingHost);

/* Seams for the verifier, so it can read what the page actually decided
   rather than re-deriving it from the modules and agreeing with itself. */
window.__UTHL = {
  get lab() { return current; },
  get length() { return length; },
  plan: function () { return stagesFor(labByKey(current), length).map(function (s) { return s.key; }); },
  optional: function () { return optionalFor(labByKey(current), length).map(function (s) { return s.key; }); },
  running: function () { return running; },
  /* Which labs have content behind them. The verifier reads this rather
     than carrying its own list, so a lab added here is tested from the
     moment it is registered — no test to remember to write. */
  built: function () { return Object.keys(MODULES); },
  choose: function (labKey, lengthKey) { current = labKey; length = lengthKey; draw(); },
  start: function () {
    const lab = labByKey(current);
    return MODULES[lab.key] ? start(lab, MODULES[lab.key]) : null;
  }
};
