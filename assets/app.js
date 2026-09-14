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
import * as SCENARIOS from "./scenarios.js";
import * as SHELF from "./storage.js";
import { mountToggle } from "./reading.js";
import { mountToggle as mountThemeToggle } from "./theme.js";
import * as INSTRUCTOR from "./instructor.js";

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
/* WHICH MACHINE THE STUDENT POINTED AT. Only the Printer lab uses it —
   it owns four technologies and they are four different machines — and
   it decides which one rests in the dock through that lab. Null means
   "the lab's default", which is what choosing by tab gives. */
let machineHint = null;
/* WHICH NAMED JOB THE STUDENT PICKED, per lab. Null means "the first one
   in the list", which is what the owner asked for: the first scenario
   loads, and the list is there for somebody who wants to choose or who
   has already done that one. */
let chosenSeed = {};

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
/* LAYERED IS THE DEFAULT, and the owner's reasoning is what puts it here
   rather than a preference of mine.

   Asked which of the four lengths sits closest to the `Core-1-Sims`
   build, the owner answered Layered. Both builds ship, side by side, and
   a student crosses between them — so the length a student meets FIRST,
   before they have any idea what the four words mean, should be the one
   shaped like the thing they already know: a short spine with the depth
   offered as they reach it, taken or skipped by them.

   It was `lab` for most of this build's life, which handed a student who
   pressed Start without reading the dropdown a 30-to-45 minute commitment
   they had not chosen. Layered is the honest default: it starts short,
   and it never hides a stage — it offers every deeper one inline.

   A student who picks something else keeps it; this is only the opening
   position. */
let length = LENGTHS[saved.length] ? saved.length : "layered";
if (saved.seeds && typeof saved.seeds === "object") chosenSeed = saved.seeds;

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
  b.addEventListener("click", function () {
    current = lab.key;
    /* Choosing by TAB clears the machine hint: the student named the lab
       rather than a machine, so the lab's own default rests in the dock.
       Leaving a stale hint here would show somebody who clicked "Printer"
       whichever printer they last pointed at in the room. */
    machineHint = null;
    draw();
    if (showroomBench) showroomBench.refresh();
  });
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

/* Draw the six named jobs as a real radio group. */
function drawJobs(host, mod, lab) {
  const list = SCENARIOS.listFor(mod, lab);
  host.textContent = "";
  if (list.length < 2) return;          /* one job is not a choice */

  const fs = document.createElement("fieldset");
  fs.className = "jobs-set";
  const lg = document.createElement("legend");
  lg.textContent = "Which job?";
  fs.appendChild(lg);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "The first one loads if you do not choose. Each is a different "
    + "customer with a different problem, and they stay the same every time — so you can "
    + "come back to one, or be set one.";
  fs.appendChild(note);

  const picked = chosenSeed[lab.key] || list[0].seed;
  list.forEach(function (job, i) {
    const row = document.createElement("label");
    row.className = "job" + (job.seed === picked ? " is-on" : "");

    const r = document.createElement("input");
    r.type = "radio";
    r.name = "job-" + lab.key;
    r.value = String(job.seed);
    r.checked = job.seed === picked;
    r.addEventListener("change", function () {
      chosenSeed[lab.key] = job.seed;
      remember({ lab: current, length: length, seeds: chosenSeed });
      Array.from(host.querySelectorAll(".job")).forEach(function (n) {
        n.classList.toggle("is-on", n.contains(r));
      });
    });

    const txt = document.createElement("span");
    txt.className = "job-text";
    const t = document.createElement("span");
    t.className = "job-title";
    t.textContent = job.title;
    txt.appendChild(t);
    if (job.detail) {
      const d = document.createElement("span");
      d.className = "job-detail";
      d.textContent = job.detail;
      txt.appendChild(d);
    }
    /* The seed, quietly, because it is how an instructor names a job to a
       class and how a student writes one down. */
    const sd = document.createElement("span");
    sd.className = "job-seed";
    sd.textContent = "seed " + job.seed;
    txt.appendChild(sd);

    row.appendChild(r);
    row.appendChild(txt);
    fs.appendChild(row);
  });
  host.appendChild(fs);
}

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

  /* =====================================================================
     THE NAMED JOBS.

     Six of them, the same number as every question in this build offers,
     and for the same reason: a list that scans in one go for tired eyes.
     The first is selected unless the student has chosen otherwise, so
     somebody who just wants to start presses Start.

     It is drawn AFTER the lab heading and BEFORE the stage plan, because
     that is the order of the decision: which lab, which job, how long,
     then here is what you will do.

     REAL RADIO BUTTONS IN A FIELDSET, not a row of styled divs. A student
     on a screen reader hears "Which job? Ridgeway Family Clinic, 1 of 6"
     and can move through them with the arrow keys, which is what a group
     of mutually exclusive choices is for. The label carries the customer
     AND what they want, because the customer alone is a name and the two
     together are a job.

     Naming the jobs means GENERATING them, so the list is fetched lazily
     and cached: the module is already loaded by the time a student is
     looking at a plan, and nothing here runs for a lab they never open. */
  const jobsBox = document.createElement("div");
  jobsBox.className = "jobs";
  elPlan.appendChild(jobsBox);
  const loader = MODULES[current];
  if (loader) {
    const forLab = current;
    loader().then(function (m) {
      /* The student may have moved on while the module loaded. */
      if (current !== forLab) return;
      drawJobs(jobsBox, m, lab);
    }).catch(function () { jobsBox.remove(); });
  }

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

    /* IF THIS LAB HAS A JOB ON THE SHELF, offer to pick it up — here,
       beside Start, rather than only in the storage room below. A student
       who came back and clicked straight to the Printer tab should not
       have to know the shelf exists to find the hour of work they left on
       it. The two buttons say plainly which is which: one carries on, the
       other starts something new and replaces it. */
    const parked = SHELF.get(lab.key);
    if (parked) {
      const p2 = SHELF.progressOf(parked);
      const resume = document.createElement("button");
      resume.type = "button";
      resume.className = "btn primary start resume";
      resume.textContent = "Pick up where you left off \u2014 " + p2.words;
      resume.addEventListener("click", function () { start(lab, mod, parked); });
      elPlan.appendChild(resume);
      go.className = "btn start";
      go.textContent = "Start a new job instead";
    }
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

  drawStorage();
  remember({ lab: current, length: length, seeds: chosenSeed });
}

async function start(lab, loader, resume) {
  const m = await loader();
  /* THE JOB THE STUDENT CHOSE, or the first in the named list.

     `newSeed()` still exists and is still what "Another one, new
     scenario" uses at the end of a run — a student who has finished and
     wants a fresh one should get a fresh one, not the next row down. What
     changed is the way IN: a lab opens on a named job rather than on a
     dice roll, so a student can come back to the one they were doing and
     an instructor can set the class the same one. */
  const list = SCENARIOS.listFor(m, lab);
  /* A RESUMED JOB BRINGS ITS OWN SEED, and that is the whole reason the
     shelf stores a seed rather than a scenario: the job is rebuilt, not
     restored, so it cannot drift from what the generator would produce
     today. */
  const seed = (resume && resume.seed) || chosenSeed[lab.key] ||
               (list[0] && list[0].seed) || newSeed();
  const scenario = m.generate(seed);
  const build = function (st) {
    const d = m.buildStage(st.key, scenario);
    return Object.assign({}, d, { key: st.key, tier: st.tier });
  };
  document.body.classList.add("running");
  closeShowroom();
  if (resume && resume.length && LENGTHS[resume.length]) length = resume.length;
  if (resume && resume.machine) machineHint = resume.machine;

  running = createRunner(elPlan, {
    lab: lab,
    machineHint: machineHint,
    resume: resume || null,
    /* Putting a job down takes the student back to the front page, where
       the shelf is — otherwise "it has been put away" is a claim with
       nothing to look at. */
    onPark: function (snap) {
      const ok = SHELF.park(Object.assign({}, snap, { length: length }));
      if (ok) {
        setTimeout(function () {
          document.body.classList.remove("running");
          running = null;
          openShowroom();
          draw();
          const room = document.getElementById("storage");
          if (room) room.scrollIntoView({ block: "center" });
        }, 900);
      }
      return ok;
    },
    /* A FINISHED JOB GOES ON THE SHELF WITH ITS NAME ON IT.

       The name is read here rather than in the runner because THIS is
       where the lab module and the named list already are. Asking the
       front page to name a finished job later would mean loading all
       eight lab modules to render the shelf, on a site that is lazy
       about those modules precisely so a student on a phone tether does
       not pay for seven labs they did not open. */
    onDone: function (snap) {
      let name = "";
      try { name = SCENARIOS.nameOf(m, lab, seed).title; } catch (e) { /* unnamed is fine */ }
      return SHELF.finish(Object.assign({}, snap, { length: length, name: name }));
    },
    scenario: scenario,
    stages: stagesFor(lab, length).map(build),
    optional: optionalFor(lab, length).map(build),
    onLeave: function () {
      document.body.classList.remove("running");
      running = null;
      openShowroom();
      draw();
      const room = document.getElementById("storage");
      if (room) room.scrollIntoView({ block: "center" });
    },
    onRestart: function () {
      document.body.classList.remove("running");
      running = null;
      openShowroom();
      draw();
    }
  });
}

draw();

/* =====================================================================
   THE SHOWROOM — the front door, and it was built before it was reachable.

   The room, the shelving and all eleven machines existed for a while
   before anything on the page imported them: `bench-room.js` was pulled
   in only by the runner, for the resting machine in the dock, and by a
   verification script. The room was rendered, measured, framed at four
   canvas widths and previewed — and a student could not walk into it.
   That is this repo's own "written and reachable are different claims"
   written one more time, and only driving the page catches it.

   WHAT CLICKING A MACHINE DOES, and what it deliberately does not do: it
   SELECTS that lab, exactly as clicking its tab would. It does not start
   the lab, because the length dropdown is a real choice and skipping past
   it would decide it for them.

   THE PRINTERS CARRY A STAGE HINT. The Printer lab owns four
   technologies, and a student who pointed at the dot matrix meant the dot
   matrix — so the machine they picked becomes the resting machine that
   follows them through the lab. It is a hint, not a jump: the stage list
   is whatever the length they chose says it is.

   THE TABS ARE NOT A FALLBACK. Every lab is a real focusable button with
   its name in words, and this canvas is a second way in for people who
   want it. Turn WebGL off and nothing is lost but the picture. */
let showroomBench = null;
const showroomHost = document.getElementById("showroom");

/* THE SHOWROOM HANDS ITS CONTEXT BACK WHEN A LAB STARTS.

   Starting a lab hides the shell with `body.running`, and a hidden
   element keeps its WebGL context: the suite caught this straight away —
   every lab went from two live contexts to THREE, one of them belonging
   to a room nobody can see. Browsers cap contexts around sixteen and
   drop the oldest, so a held one is not free, it is one fewer bench.

   Dispose on the way in, rebuild on the way out. The room is cheap to
   rebuild and the student is looking at a lab for the next hour. */
function closeShowroom() {
  if (showroomBench) { try { showroomBench.dispose(); } catch (e) {} showroomBench = null; }
  if (showroomHost) showroomHost.textContent = "";
}

function openShowroom() {
  if (!showroomHost || showroomBench) return;
  Promise.all([import("./bench.js"), import("./bench-room.js")]).then(function (mods) {
    const [B, R] = mods;
    /* ONLY THE MACHINES ARE CONTROLS. The spec also carries the room, the
       lights, the shelving and the paper stock, and a list of fifteen
       things with "The room" at the top is a worse way to choose a lab
       than the eight tabs it is meant to improve on. */
    const opts = {
      height: 420,
      spec: function () { return R.roomBench({}); },
      status: function () {
        return { words: "The workshop", tone: "calm",
                 detail: "Every lab is a machine in here. Pick one." };
      },
      controls: function () {
        /* ALL FOUR PRINTERS SAID "CHOSEN" AT ONCE, because they share a
           lab key and the first cut compared on that alone. Four machines
           claiming to be the selected one is worse than none doing it —
           the list is the student's record of what they picked.

           So a lab with ONE machine says chosen on that machine; a lab
           with several says it only on the one they actually pointed at,
           and says nothing when they arrived by tab and named the lab
           rather than a machine. */
        const family = {};
        R.SHOWROOM.forEach(function (m) { family[m.lab] = (family[m.lab] || 0) + 1; });
        return R.SHOWROOM.map(function (m) {
          const lab = labByKey(m.lab);
          const mine = m.lab === current;
          const only = family[m.lab] === 1;
          const picked = mine && (only || (machineHint && m.stage === machineHint));
          return {
            key: m.key, label: m.label,
            state: picked ? "ok" : "idle",
            stateWords: picked ? "chosen"
              : mine ? "in this lab"
              : "opens " + (lab ? lab.name : m.lab),
            detail: m.stage ? "Its own bench in the Printer lab" : ""
          };
        });
      },
      onPick: function (key) {
        const m = R.SHOWROOM.filter(function (e) { return e.key === key; })[0];
        if (!m) return;                 /* the room, the shelving, the stock */
        current = m.lab;
        machineHint = m.stage || null;
        draw();
        if (showroomBench) showroomBench.refresh();
        const tab = document.getElementById("tab-" + current);
        if (tab) tab.focus();
      },
      onAction: function () { return {}; }
    };
    showroomBench = B.mountBench(showroomHost, opts);
  }).catch(function () {
    /* No WebGL, no module, no network for the engine — the tabs below are
       the interface and they are already on the page. Say nothing rather
       than leave a dead grey box. */
    showroomHost.textContent = "";
  });
}
openShowroom();

/* =====================================================================
   THE STORAGE ROOM, on the front page under the showroom.

   Every parked job, one per lab, each shown as the MACHINE it belongs to
   and the stage it stopped on — so it reads as a shelf of jobs somebody
   put down rather than a list of save files.

   IT IS NOT DRAWN WHEN IT IS EMPTY. A student who has never parked
   anything does not need a heading explaining a feature they have not
   used; the button that creates the first one lives inside a running lab,
   where the decision is actually made.

   The machine name comes from the same SHOWROOM table the room and the
   dock read, so a job on the shelf, the machine in the room and the model
   in the lab are all the same object by construction. */
function drawStorage() {
  const host = document.getElementById("storage");
  if (!host) return;
  host.textContent = "";
  const jobs = SHELF.list();
  const finished = SHELF.done();
  /* An empty room is not drawn at all. A heading over nothing is a
     promise the page has not kept yet, and the buttons that fill this
     shelf both live inside a running lab. */
  if (!jobs.length && !finished.length) return;

  const box = document.createElement("section");
  box.className = "shelf";
  const h = document.createElement("h2");
  h.textContent = "The storage room";
  box.appendChild(h);
  const note = document.createElement("p");
  note.className = "note";
  /* WHAT IS IN HERE, IN ONE LINE, and it has to cover the three cases:
     work waiting, work done, and both. A student who has finished four
     labs and parked none should not be told about parked jobs. */
  const bits = [];
  if (jobs.length) bits.push(jobs.length === 1 ? "One job put down, waiting where you left it"
    : jobs.length + " jobs put down, each waiting where you left it");
  if (finished.length) bits.push(finished.length === 1 ? "one finished"
    : finished.length + " finished");
  note.textContent = bits.join(". ") + ".";
  box.appendChild(note);

  import("./bench-room.js").then(function (R) {
    jobs.forEach(function (job) {
      const lab = labByKey(job.lab);
      if (!lab) return;
      const p = SHELF.progressOf(job);
      const row = document.createElement("div");
      row.className = "shelf-job";

      const txt = document.createElement("div");
      txt.className = "shelf-text";
      const t = document.createElement("h3");
      const key = R.restingKeyFor(job.lab, job.machine);
      const machine = R.SHOWROOM.filter(function (m) { return m.key === key; })[0];
      t.textContent = lab.name + (machine ? " \u2014 " + machine.label : "");
      txt.appendChild(t);

      const where = document.createElement("p");
      where.className = "shelf-where";
      /* The stage in WORDS as well as a number, and what they had already
         got right, because that is what somebody actually wants to know
         before deciding which job to pick back up. */
      where.textContent = p.words + (job.stageTitle ? " \u2014 " + job.stageTitle : "") +
        "  \u00b7  " + p.right + " answered so far  \u00b7  put down " + SHELF.whenOf(job) +
        "  \u00b7  seed " + job.seed;
      txt.appendChild(where);
      row.appendChild(txt);

      const acts = document.createElement("div");
      acts.className = "shelf-acts";
      const go2 = document.createElement("button");
      go2.type = "button";
      go2.className = "btn primary";
      go2.textContent = "Pick it up";
      go2.addEventListener("click", function () {
        current = job.lab;
        const loader = MODULES[job.lab];
        if (loader) start(labByKey(job.lab), loader, job);
      });
      const bin = document.createElement("button");
      bin.type = "button";
      bin.className = "btn";
      bin.textContent = "Throw it away";
      /* TWO PRESSES TO DESTROY AN HOUR OF WORK. The first turns the
         button into the question, so a misfired tap on a phone cannot
         take the job with it. */
      bin.addEventListener("click", function () {
        if (bin.dataset.sure !== "1") {
          bin.dataset.sure = "1";
          bin.textContent = "Throw it away? Press again";
          bin.classList.add("danger");
          return;
        }
        SHELF.drop(job.lab);
        drawStorage();
        draw();
      });
      acts.appendChild(go2);
      acts.appendChild(bin);
      row.appendChild(acts);
      box.appendChild(row);
    });

    /* ---------------------------------------------------------------
       THE FINISHED SHELF.

       Deliberately BELOW the parked one and visibly quieter. Work that
       is waiting is work with a decision attached to it; work that is
       finished is a record, and a record that shouts drowns the thing
       the student actually has to act on. Loudness tracks importance —
       the same rule that pulled the inkjet's encoder strip down to a
       strip of film.
       --------------------------------------------------------------- */
    if (finished.length) {
      const fh = document.createElement("h3");
      fh.className = "shelf-head";
      fh.textContent = "Finished";
      box.appendChild(fh);

      const by = SHELF.doneByLab();
      const fnote = document.createElement("p");
      fnote.className = "note";
      const labs = Object.keys(by).length;
      fnote.textContent = finished.length + (finished.length === 1 ? " job" : " jobs")
        + " finished, across " + labs + (labs === 1 ? " lab" : " labs")
        + ". Every one can be done again — the seed rebuilds the same job, "
        + "and the better score is the one kept.";
      box.appendChild(fnote);

      finished.forEach(function (job) {
        const lab = labByKey(job.lab);
        if (!lab) return;
        const s = SHELF.scoreOf(job);
        const row = document.createElement("div");
        row.className = "shelf-job shelf-done";

        const txt = document.createElement("div");
        txt.className = "shelf-text";
        const t = document.createElement("h4");
        /* THE JOB'S OWN NAME, recorded when it was finished. "Continental
           Freightways" is how a student refers to a job; "printer seed
           412903" is how a database does. The seed is still printed,
           because it is what an instructor sets a class by. */
        t.textContent = lab.name + (job.name ? " — " + job.name : "");
        txt.appendChild(t);

        const where = document.createElement("p");
        where.className = "shelf-where";
        /* THE SCORE IN WORDS AND AS A FRACTION, never as a colour or a
           bar alone — the standing rule everywhere in this build, and a
           list of finished work is exactly where somebody scans fast for
           the one that went badly. */
        where.textContent = s.words + " (" + s.fraction + ")"
          + (s.runs > 1 ? "  ·  done " + s.runs + " times, best kept" : "")
          + "  ·  finished " + SHELF.whenOf(job)
          + (job.length && LENGTHS[job.length] ? "  ·  " + job.length + " length" : "")
          + "  ·  seed " + job.seed;
        txt.appendChild(where);
        row.appendChild(txt);

        const acts = document.createElement("div");
        acts.className = "shelf-acts";
        const again = document.createElement("button");
        again.type = "button";
        again.className = "btn";
        again.textContent = "Do it again";
        again.addEventListener("click", function () {
          current = job.lab;
          /* The same job, not a new one — the seed IS the job, which is
             the contract the whole build rests on. */
          chosenSeed[job.lab] = job.seed;
          if (job.length && LENGTHS[job.length]) length = job.length;
          machineHint = job.machine || null;
          const loader = MODULES[job.lab];
          if (loader) start(labByKey(job.lab), loader);
        });
        acts.appendChild(again);
        row.appendChild(acts);
        box.appendChild(row);
      });
    }

    host.appendChild(box);
  }).catch(function () { /* no room module, no shelf */ });
}

/* =====================================================================
   THE INSTRUCTOR'S JOB SHEET.

   Drawn only when the PIN has been entered, and it is the half of
   instructor mode that could not exist before the named scenario picker
   went in: every job in this build now has a stable name and a stable
   seed, the SAME on every student's screen, because the seeds are
   derived from the lab key rather than drawn at random.

   That turns "do the printer lab" — eight students, eight different
   jobs, nothing to talk about together — into "everyone do the
   Continental Freightways job", which is a class that can be taught. The
   list of what to say is what this panel is.

   IT LOADS EIGHT LAB MODULES TO BUILD, which is exactly why it is behind
   a button. Naming a scenario means generating it and building its first
   stage, and this site is lazy about lab modules precisely so a student
   on a phone tether does not pay for seven labs they did not open. An
   instructor on a projector can afford it; a student must not be charged
   for it. */
function drawSheet() {
  const host = document.getElementById("insSheet");
  if (!host) return;
  host.textContent = "";
  if (!INSTRUCTOR.isOn()) return;

  const box = document.createElement("section");
  box.className = "shelf ins-sheet";
  box.appendChild(Object.assign(document.createElement("h2"), { textContent: "Job sheet" }));
  const note = document.createElement("p");
  note.className = "note";
  note.textContent = "Every job in the build, with the seed that rebuilds it. The seeds are the "
    + "same on every student's machine, so a class can be set the same job by name or by number. "
    + "Setting one here sets it for THIS browser only — for a demonstration, not for the room.";
  box.appendChild(note);

  const wait = document.createElement("p");
  wait.className = "note";
  wait.textContent = "Building the list… it generates every job to read its name off, so it "
    + "takes a moment.";
  box.appendChild(wait);
  host.appendChild(box);

  /* Every lab, in registry order, each one loaded on demand. */
  Promise.all(LABS.map(function (lab) {
    const loader = MODULES[lab.key];
    if (!loader) return Promise.resolve({ lab: lab, jobs: [] });
    return loader().then(function (m) {
      return { lab: lab, jobs: SCENARIOS.listFor(m, lab) };
    }).catch(function () { return { lab: lab, jobs: [] }; });
  })).then(function (all) {
    if (!INSTRUCTOR.isOn()) { host.textContent = ""; return; }
    wait.remove();
    const doneBy = SHELF.doneByLab();

    all.forEach(function (row) {
      const h = document.createElement("h3");
      h.className = "shelf-head";
      /* WHAT THIS LAB COVERS, off the registry rather than typed here.
         The objective tags are the single source of truth for coverage
         and they are machine-checked in both directions; a second list
         in this panel would be the stale one. */
      const objs = [];
      row.lab.stages.forEach(function (s) {
        (s.objs || []).forEach(function (o) { if (objs.indexOf(o) < 0) objs.push(o); });
      });
      objs.sort();
      h.textContent = row.lab.name;
      box.appendChild(h);

      const cover = document.createElement("p");
      cover.className = "note";
      cover.textContent = row.lab.stages.length + " stages  ·  objectives "
        + (objs.join(", ") || "none tagged")
        + (doneBy[row.lab.key] ? "  ·  " + doneBy[row.lab.key] +
            " finished on this machine" : "");
      box.appendChild(cover);

      if (!row.jobs.length) {
        const none = document.createElement("p");
        none.className = "note";
        none.textContent = "This lab's module would not load, so its jobs cannot be listed.";
        box.appendChild(none);
        return;
      }

      const list = document.createElement("ol");
      list.className = "ins-jobs";
      row.jobs.forEach(function (j) {
        const li = document.createElement("li");
        const t = document.createElement("p");
        t.className = "ins-job-name";
        t.textContent = j.title;
        li.appendChild(t);
        const d = document.createElement("p");
        d.className = "shelf-where";
        d.textContent = (j.detail ? j.detail + "  ·  " : "") + "seed " + j.seed;
        li.appendChild(d);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = "Set this job on this machine";
        b.addEventListener("click", function () {
          chosenSeed[row.lab.key] = j.seed;
          current = row.lab.key;
          remember({ lab: current, length: length, seeds: chosenSeed });
          draw();
          b.textContent = "Set — it is what " + row.lab.name + " will open on";
        });
        li.appendChild(b);
        list.appendChild(li);
      });
      box.appendChild(list);
    });

    /* THE MACHINE'S OWN RECORD, AND A WAY TO CLEAR IT.

       These are shared classroom machines. An instructor starting a
       session on a lab PC needs to be able to wipe the last student's
       finished list, and a student must never be shown a button that
       throws away work they cannot get back. So it lives here, behind
       the PIN, and it asks twice. */
    const fin = SHELF.doneCount(), parked = SHELF.count();
    const tail = document.createElement("h3");
    tail.className = "shelf-head";
    tail.textContent = "This machine";
    box.appendChild(tail);
    const st = document.createElement("p");
    st.className = "note";
    st.textContent = fin + (fin === 1 ? " job" : " jobs") + " finished and "
      + parked + (parked === 1 ? " job" : " jobs") + " parked in this browser. "
      + "Nothing here leaves the machine and nothing identifies anybody.";
    box.appendChild(st);
    if (fin || parked) {
      const wipe = document.createElement("button");
      wipe.type = "button";
      wipe.className = "btn";
      wipe.textContent = "Clear this machine's record";
      wipe.addEventListener("click", function () {
        if (wipe.dataset.sure !== "1") {
          wipe.dataset.sure = "1";
          wipe.classList.add("danger");
          wipe.textContent = "Clear it? This cannot be undone. Press again";
          return;
        }
        SHELF.clear();
        SHELF.clearDone();
        drawStorage();
        drawSheet();
      });
      box.appendChild(wipe);
    }
  });
}

/* The reading toggle. Mounted here rather than written into the HTML so it
   cannot get out of step with what reading.js actually remembers — the
   checkbox reads its own state from storage on the way in. */
const readingHost = document.getElementById("reading");
if (readingHost) mountToggle(readingHost);

/* The theme toggle, beside it and for the same reason: a student who
   needs it should meet it before they meet anything else, rather than
   hunting for it in a menu. Both settings persist and both are applied
   in the document head before the page paints. */
const themeHost = document.getElementById("theme");
if (themeHost) mountThemeToggle(themeHost);

/* Instructor mode, PIN 3693. The toggle sits with the other two settings;
   what it unlocks is the job sheet below and the answers inside a running
   lab. Turning it on or off redraws both, so nothing is left on screen
   after the PIN is turned off — a panel that outlived the mode would be
   the answers still up on the projector. */
const insHost = document.getElementById("instructor");
if (insHost) INSTRUCTOR.mountToggle(insHost);
INSTRUCTOR.onChange(function () {
  drawSheet();
  if (running) running.redraw();
});

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
