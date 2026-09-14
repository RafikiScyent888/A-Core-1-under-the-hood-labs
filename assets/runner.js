/* =====================================================================
   The stage runner.

   Every lab in this build plugs into this. A lab module exports:

     generate(seed)            -> a scenario object, reproducible from seed
     buildStage(key, scenario) -> a stage descriptor, or null

   A stage descriptor is DECLARATIVE — panels to show, questions to ask.
   The lab never touches the DOM. That is not tidiness for its own sake:
   it means the verifier can drive any lab's question to hint rung 3
   without knowing anything about the lab, and it means the AAA and
   keyboard work is done once here rather than six times badly.

     panels    [{ kind: "brief"|"table"|"mech"|"note", ... }]
     questions [{ key, kind, prompt, hints, ...kind-specific }]

   Question kinds:
     choice   one of several; options carry `why` for the narrowing rung
     multi    several correct; graded as a set
     number   a typed figure, with tolerance and a unit
     assign   put items into slots (a drive into a bay)
     order    put steps into sequence
     wire     connect many things to many sockets, each refused with a
              reason if it does not belong there
     probe    put an instrument on a test point and read what it says
     place    put a thing somewhere on a plan and watch the readings move

   `wire` and `probe` exist because the first three labs came out at four
   hands-on tasks against twenty-one pick-an-option ones, which is a quiz
   wearing a lab's clothes. Cabling a machine and metering a rail are
   things you DO, and the exam tests them as things you do.

   THE MECHANISM PANEL is the point of this whole site. `kind: "mech"`
   is a steppable diagram — frames the student walks through, watching
   what the hardware is actually doing. It is never graded. It is what
   makes the question above it answerable from understanding rather than
   recall, which is the "why" gap the owner named.
   ===================================================================== */
import { makeTracker, guidanceFor } from "./hints.js";
import * as INSTRUCTOR from "./instructor.js";

export function createRunner(host, opts) {
  /* THE LAB REGISTRY ENTRY, not the lab module — the comment here said
     "the lab module" for the life of this file and it is the entry from
     labs.js, which is what carries `key`. The module is what app.js calls
     `m`, and it never reaches the runner at all. */
  const lab = opts.lab;
  const labKey = (lab && lab.key) || null;
  /* The machine the student pointed at in the showroom, if they did. The
     Printer lab owns four technologies, so "printer" is not enough to
     know which machine belongs on the bench beside the brief. */
  const machineHint = opts.machineHint || null;
  const scenario = opts.scenario;
  const stages = opts.stages;           /* already tier-filtered */
  const optional = opts.optional || []; /* layered mode's offers */
  const onProgress = opts.onProgress || function () {};

  const tracker = makeTracker();
  const answered = {};                  /* key -> true once correct */
  const taken = {};                     /* optional stages accepted */
  let at = 0;

  /* PICKED BACK UP OFF THE STORAGE ROOM SHELF.

     A parked job carries the stage they were on, the questions they had
     already got right, and how many times they had gone wrong on each.

     The attempt counts are the part that is easy to leave out and the
     part that matters most: they are what the hint ladder reads. A
     student who had earned rung 3 on a hard question before they put the
     job down should not come back to silence and have to get it wrong
     three more times to get their help back. */
  if (opts.resume) {
    const r = opts.resume;
    Object.keys(r.answered || {}).forEach(function (k) { answered[k] = true; });
    Object.keys(r.attempts || {}).forEach(function (k) {
      for (let i = 0; i < r.attempts[k]; i++) tracker.wrong(k);
    });
    if (typeof r.at === "number") at = Math.max(0, Math.min(stages.length - 1, r.at));
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------- panels ---------------- */

  function drawBrief(p) {
    const box = el("div", "panel brief");
    box.appendChild(el("h4", null, p.from || "The job"));
    (p.paragraphs || []).forEach(function (t) { box.appendChild(el("p", null, t)); });
    /* The requirement is deliberately buried in here. Reading the brief
       is one of the four gaps, so the useful detail sits inside
       ordinary customer talk rather than in a bullet list. */
    return box;
  }

  function drawTable(p) {
    const box = el("div", "panel");
    if (p.title) box.appendChild(el("h4", null, p.title));
    const wrap = el("div", "tablewrap");
    const t = el("table");
    if (p.columns) {
      const thead = el("thead"), tr = el("tr");
      p.columns.forEach(function (c) { tr.appendChild(el("th", null, c)); });
      thead.appendChild(tr); t.appendChild(thead);
    }
    const tb = el("tbody");
    (p.rows || []).forEach(function (r) {
      const tr = el("tr");
      if (r.flag) tr.className = "row-" + r.flag;
      (r.cells || r).forEach(function (c) { tr.appendChild(el("td", null, String(c))); });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    wrap.appendChild(t);
    box.appendChild(wrap);
    if (p.note) box.appendChild(el("p", "small", p.note));
    return box;
  }

  function drawNote(p) {
    const box = el("div", "panel note");
    if (p.title) box.appendChild(el("h4", null, p.title));
    (p.paragraphs || [p.text]).forEach(function (t) { if (t) box.appendChild(el("p", null, t)); });
    return box;
  }

  /* The mechanism view. Frames the student steps through, each with a
     caption saying what the hardware is doing at that moment. */
  function drawMech(p) {
    const box = el("div", "panel mech");
    box.appendChild(el("h4", null, p.title || "What is actually happening"));
    const stageEl = el("div", "mech-stage");
    const cap = el("p", "mech-cap");
    const bar = el("div", "mech-bar");
    const prev = el("button", "btn", "‹ Back");
    const nextB = el("button", "btn", "Step ›");
    const count = el("span", "mech-count");
    prev.type = nextB.type = "button";
    let i = 0;

    function show() {
      stageEl.textContent = "";
      const frame = p.frames[i];
      stageEl.appendChild(renderFrame(frame));
      cap.textContent = frame.caption || "";
      count.textContent = (i + 1) + " of " + p.frames.length;
      prev.disabled = i === 0;
      nextB.disabled = i === p.frames.length - 1;
    }
    prev.addEventListener("click", function () { if (i > 0) { i--; show(); } });
    nextB.addEventListener("click", function () { if (i < p.frames.length - 1) { i++; show(); } });

    bar.appendChild(prev); bar.appendChild(count); bar.appendChild(nextB);
    box.appendChild(stageEl); box.appendChild(cap); box.appendChild(bar);
    show();
    return box;
  }

  /* A frame is a grid of labelled cells — drives across, blocks down.
     Enough to show striping, mirroring, parity and a rebuild without a
     3D scene, and it stays legible at any zoom, which matters here. */
  function renderFrame(frame) {
    const g = el("div", "grid");
    g.style.setProperty("--cols", String(frame.columns.length));
    frame.columns.forEach(function (c) {
      const h = el("div", "gcol-head" + (c.state ? " is-" + c.state : ""));
      h.appendChild(el("span", "gcol-name", c.name));
      if (c.sub) h.appendChild(el("span", "gcol-sub", c.sub));
      g.appendChild(h);
    });
    (frame.rows || []).forEach(function (row) {
      row.forEach(function (cell) {
        const c = el("div", "gcell" + (cell.tone ? " t-" + cell.tone : ""));
        c.appendChild(el("span", "gcell-t", cell.label == null ? "" : String(cell.label)));
        if (cell.sub) c.appendChild(el("span", "gcell-s", cell.sub));
        g.appendChild(c);
      });
    });
    return g;
  }

  /* ---------------------------------------------------------------------
     A BENCH PANEL: the 3D hardware, with its real controls beside it.

     three.js is 655 KB and this shell already loads lab modules on demand,
     because handing six labs' worth of code to a student who wanted one of
     them over a phone tether is rude. A static import here would undo that
     for every lab, bench or no bench — so the engine is pulled in only when
     a bench panel is actually drawn.

     That means this returns its box before the bench exists and fills it in
     afterwards. The placeholder is real text rather than a spinner, because
     if the import never lands, "loading" forever tells a student nothing
     and a sentence tells them what happened. */
  function drawBench(p) {
    const box = el("div", "panel panel-bench");
    if (p.title) box.appendChild(el("h3", "panel-title", p.title));
    if (p.intro) box.appendChild(el("p", "panel-intro", p.intro));
    const slot = el("div");
    const wait = el("p", "panel-intro", "Fetching the bench\u2026");
    slot.appendChild(wait);
    box.appendChild(slot);

    import("./bench.js").then(function (m) {
      slot.textContent = "";
      p.bench.height = p.height || 380;
      const b = m.mountBench(slot, p.bench);
      /* A PANEL BENCH HAS TO BE ABLE TO HEAR FROM THE QUESTIONS.

         A bench panel and the questions under it were entirely separate:
         the panel drew itself once and never again. That is right for a
         bench that only illustrates, and wrong the moment a stage asks the
         student to CHANGE the hardware — the RAID build stage fills eight
         bays, and the chassis above sat empty through all of it, reporting
         "0 of 8 fitted" while the student filled it.

         Handles are collected per stage and dropped when the stage
         changes, so a question can say "redraw what is above me" without
         knowing anything about which panel it is or how many there are. */
      inlineBenches.push(b);
      stageBenches = inlineBenches.concat(dock && dock.bench ? [dock.bench] : []);
      if (p.bench.onReady) p.bench.onReady(b);
    }).catch(function (e) {
      /* Never a dead grey box. Say what is missing and let the stage carry
         on — the questions below do not depend on the picture. */
      slot.textContent = "";
      slot.appendChild(el("p", "panel-intro",
        "The 3D bench could not be loaded, so this stage is running without it. " +
        "Everything the stage asks you is answerable from the text above."));
    });
    return box;
  }

  const PANELS = { brief: drawBrief, table: drawTable, mech: drawMech,
                   note: drawNote, bench: drawBench };

  /* ---------------- questions ---------------- */

  /* Redraw every bench panel on this stage. Called by the askers that let
     a student change the hardware rather than only describe it. */
  function refreshBenches() {
    stageBenches.forEach(function (b) { try { b.refresh(); } catch (e) {} });
  }

  function feedback(q, host2, ok, why) {
    let fb = host2.querySelector(".fb");
    if (!fb) { fb = el("div", "fb"); host2.appendChild(fb); }
    fb.textContent = "";
    fb.className = "fb " + (ok ? "fb-ok" : "fb-no");
    fb.appendChild(el("strong", null, ok ? "Right. " : "Not yet. "));
    if (why) fb.appendChild(document.createTextNode(why));
    if (!ok) showGuidance(q, host2);
  }

  function showGuidance(q, host2) {
    const g = guidanceFor(q, tracker.count(q.key));
    let box = host2.querySelector(".hint");
    if (!g) { if (box) box.remove(); return; }
    if (!box) { box = el("div", "hint"); host2.appendChild(box); }
    box.textContent = "";
    box.appendChild(el("span", "hint-rung", "Hint " + g.rung + " of 3"));
    box.appendChild(el("p", null, g.text));
    if (g.strike && g.strike.length) {
      const ul = el("ul", "strikes");
      g.strike.forEach(function (s) {
        const li = el("li");
        li.appendChild(el("span", "struck", labelOf(q, s.key)));
        li.appendChild(document.createTextNode(" — " + s.why));
        ul.appendChild(li);
        const btn = host2.querySelector('[data-opt="' + s.key + '"]');
        if (btn) { btn.classList.add("ruled-out"); btn.setAttribute("aria-disabled", "true"); }
      });
      box.appendChild(ul);
    }
  }

  /* ---------------------------------------------------------------------
     RESET BACK TO THE LAST PART THEY GOT RIGHT

     Standing rule from the owner, and it is the other half of "never give
     the answer": when a student is stuck, do not leave them stranded
     part-way through a broken attempt, and never let a wrong answer carry
     forward and poison the steps after it. Put them back on solid ground
     and keep hinting from there until they choose the right answer
     themselves.

     THE RESET MUST NOT LEAK THE ANSWER, WHICH DECIDES ITS SHAPE.
     Clearing only the WRONG pieces of a part-finished attempt would say
     precisely which pieces were wrong — that is rung 3 of the hint
     ladder, handed over free at the first mistake. So there are exactly
     two safe forms:

       - ORDER truncates to the last correct position, and only order,
         because its feedback already says in words how many are right
         ("the first three are right, step four is not"). Nothing new is
         revealed, and the student carries on from solid ground instead
         of hunting through a sequence they have already been told is
         good. This is the literal case the rule describes.

       - EVERYTHING ELSE clears the whole working state, which tells them
         nothing at all, and is offered as a BUTTON rather than done to
         them mid-attempt.

     THE HINT LEVEL IS NOT RESET. They keep every rung they have earned —
     tracker.reset() is deliberately not called here. The state goes back;
     the help only ever accumulates. Resetting the attempt count would
     take away the guidance at the exact moment it is needed.

     The button only appears once the ladder has started, because before
     that a student has a wrong answer, not a problem. */
  function restartControl(q, box, clear) {
    const b = el("button", "btn ghost", "Start this step again");
    b.type = "button";
    b.hidden = true;
    b.addEventListener("click", function () {
      if (answered[q.key]) return;
      clear();
      const fb = box.querySelector(".fb");
      if (fb) {
        fb.textContent = "";
        fb.className = "fb fb-no";
        fb.appendChild(el("strong", null, "Cleared. "));
        fb.appendChild(document.createTextNode(
          "Back to an empty start, with every hint you have earned still below."));
      }
    });
    box.appendChild(b);
    return function () { b.hidden = !!answered[q.key] || tracker.rung(q.key) < 1; };
  }

  function labelOf(q, key) {
    const o = (q.options || []).filter(function (x) { return x.key === key; })[0];
    return o ? o.label : key;
  }

  function askChoice(q, box) {
    const list = el("div", "opts");
    (q.options || []).forEach(function (o) {
      const b = el("button", "opt", o.label);
      b.type = "button";
      b.dataset.opt = o.key;
      if (o.sub) b.appendChild(el("span", "opt-sub", o.sub));
      b.addEventListener("click", function () {
        if (answered[q.key]) return;
        if (o.correct) {
          answered[q.key] = true;
          list.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; });
          b.classList.add("chosen");
          feedback(q, box, true, o.why || q.explain);
          /* A QUESTION MAY CHANGE THE HARDWARE, and when it does the
             picture above has to follow. Deciding to open a phone and
             then still looking at a closed one is the bench contradicting
             the answer the student just got right — the same class of
             fault as the RAID chassis that reported "0 of 8 fitted" while
             the student filled it.

             `onCorrect` is the lab's hook; refreshing the benches is
             unconditional because it costs nothing when nothing moved. */
          if (typeof q.onCorrect === "function") q.onCorrect();
          refreshBenches();
          onProgress();
        } else {
          tracker.wrong(q.key);
          /* RED, AND IT STAYS RED until they get it right or reset the
             step. Nothing removes this class. The board becomes the
             student's own record of what they have eliminated, which is
             the point of working by elimination — they should not have
             to hold six attempts in their head at eleven at night.

             MARKED THREE WAYS, NEVER COLOUR ALONE. These students have
             damaged sight and some cannot rely on the red at all, so
             there is the colour, a rule down the leading edge, and the
             words. The words are a REAL ELEMENT rather than a ::after,
             because the contrast sweep walks text nodes — pseudo-element
             text would sail past it unmeasured, which is exactly how an
             accessibility rule turns into an accessibility claim. */
          b.classList.add("wrong");
          if (!b.querySelector(".opt-flag")) {
            b.appendChild(el("span", "opt-flag", "Tried — not this one"));
          }
          feedback(q, box, false, o.why);
        }
      });
      list.appendChild(b);
    });
    box.appendChild(list);
  }

  /* ---------------------------------------------------------------------
     PICK — the model IS the question.

     Every other asker puts sentences under the picture and marks the
     sentence. This one marks the PART: the student answers by choosing
     the roller, the blade, the strip, on the bench itself. The owner
     asked for this directly — students should work off the model rather
     than read about it.

     The accessibility contract is unchanged and load-bearing. The canvas
     stays aria-hidden with tabIndex -1; the bench's control list is a row
     of real focusable buttons carrying each part's name and state in
     words, and those buttons are what actually answers the question.
     Clicking the 3D part is a second way in for people who want it, not
     the only way in. Turn WebGL off and this question is still fully
     answerable.
     --------------------------------------------------------------------- */
  function askPick(q, box) {
    const slot = el("div");
    box.appendChild(slot);
    const opts = {};
    (q.options || []).forEach(function (o) { opts[o.key] = o; });

    let b = null;
    dockClaim(Object.assign({}, q.bench, {
        onPick: function (key) {
          if (answered[q.key]) return;
          const o = opts[key];
          /* A part with no entry in the option list is scenery — the mat,
             a cable, a name plate. Selecting it is not a wrong answer, it
             is just looking, and punishing it would teach a student not
             to explore the model. */
          if (!o) return;
          if (o.correct) {
            answered[q.key] = true;
            b.lock();
            feedback(q, box, true, o.why || q.explain);
            onProgress();
          } else {
            tracker.wrong(q.key);
            b.markWrong(key);
            feedback(q, box, false, o.why);
          }
        }
      }), "q/" + q.key, q.height || 380)
      .then(function (bench) { b = bench; })
      .catch(function () {
      /* No WebGL, no bench module — fall back to the ordinary list so the
         question is still answerable. Never a dead grey box. */
      slot.textContent = "";
      slot.appendChild(el("p", "panel-intro",
        "The 3D bench could not be loaded, so this question is running as a list."));
      askChoice(q, slot);
    });
  }

  /* ---------------------------------------------------------------------
     FIT — hold a part, then put it where it goes ON THE MACHINE.

     This is the Core 1 printer PBQ brought across. The original drags a
     label onto a fixed photograph: four dropzones at hard-coded pixel
     positions over printer.png, five labels, Submit, and a tick or a cross
     against each zone. It is a good exercise and the thing it teaches —
     that an ink cartridge is not a laser part — is exactly right.

     Three things change on the way in, and each is one of this build's own
     rules rather than a preference:

       - THE MACHINE IS THE ANSWER SURFACE. A dropzone at "top: 67px" only
         means anything from the one angle the photograph was taken at.
         Here the student holds a part and clicks the station on a model
         they can turn round, so the answer is "where on the printer",
         not "where on this picture of a printer".
       - IT NEVER MARKS THE ANSWER. The original Submit puts a red border
         on the wrong zones, which hands over the answer by elimination in
         one click. This refuses a wrong placement, says WHY, and keeps
         going. Unlimited tries, unlimited hints, no rung that tells.
       - REFUSALS STAY VISIBLE. A part that has been refused at a station
         carries that refusal, in words, on its own chip. The board is the
         student's working memory rather than something they have to hold
         in their head, and it is words and not only colour.

     `q.items` are the parts in the tray; an item whose `station` is null
     belongs nowhere on this machine at all, which is the ink-cartridge
     case and is the point of the whole exercise. `q.stations` name bench
     part keys, so a station that does not exist on the bench is a load
     error rather than a dead click.
     --------------------------------------------------------------------- */
  function askFit(q, box) {
    let held = null;
    const placed = {};                 /* station key -> item key */
    const refused = {};                /* item key -> [station key, ...] */
    const tray = el("div", "tray");
    const slot = el("div");
    let bench = null;

    const stationLabel = function (k) {
      const st = (q.stations || []).filter(function (s) { return s.key === k; })[0];
      return st ? st.label : k;
    };

    function redrawTray() {
      tray.textContent = "";
      (q.items || []).forEach(function (it) {
        const done = Object.keys(placed).some(function (s) { return placed[s] === it.key; });
        if (done) return;
        const b = el("button", "chip" + (held === it.key ? " held" : ""), it.label);
        b.type = "button";
        b.dataset.opt = it.key;
        if (it.sub) b.appendChild(el("span", "chip-sub", it.sub));
        /* The refusals, in words, on the chip that earned them. */
        const no = refused[it.key];
        if (no && no.length) {
          b.classList.add("chip-refused");
          b.appendChild(el("span", "chip-no",
            "Refused: " + no.map(stationLabel).join(", ")));
        }
        b.setAttribute("aria-pressed", String(held === it.key));
        b.addEventListener("click", function () {
          if (answered[q.key]) return;
          held = (held === it.key) ? null : it.key;
          redrawTray();
        });
        tray.appendChild(b);
      });
      if (!tray.children.length) {
        tray.appendChild(el("span", "small", "Everything that belongs on this machine is on it."));
      }
    }

    function fitted() {
      /* Done when every station that HAS a right answer has it. Parts that
         belong nowhere stay in the tray, which is the correct end state
         and not an unfinished one. */
      return (q.stations || []).every(function (st) {
        const wants = (q.items || []).filter(function (i) { return i.station === st.key; })[0];
        return !wants || placed[st.key] === wants.key;
      });
    }

    function onStation(key) {
      if (answered[q.key]) return;
      if (!held) {
        if (bench) bench.announce("Choose a part from the tray first, then click where it goes.");
        return;
      }
      const it = (q.items || []).filter(function (x) { return x.key === held; })[0];
      if (!it) return;
      if (placed[key]) {
        if (bench) bench.announce(stationLabel(key) + " already has a part in it.");
        return;
      }
      if (it.station === key) {
        placed[key] = it.key;
        held = null;
        redrawTray();
        if (bench) bench.refresh();
        if (bench) bench.announce(it.label + " fitted at the " + stationLabel(key) + ".");
        if (fitted()) {
          answered[q.key] = true;
          if (bench) bench.lock();
          feedback(q, box, true, q.explain);
          onProgress();
        } else {
          /* Progress without the answer: it says THIS one is in, not which
             of the rest goes where. */
          let fb = box.querySelector(".fb");
          if (!fb) { fb = el("div", "fb"); box.appendChild(fb); }
          fb.textContent = "";
          fb.className = "fb fb-ok";
          fb.appendChild(el("strong", null, "In. "));
          fb.appendChild(document.createTextNode(it.why || (it.label + " belongs there.")));
        }
      } else {
        tracker.wrong(q.key);
        if (!refused[it.key]) refused[it.key] = [];
        if (refused[it.key].indexOf(key) === -1) refused[it.key].push(key);
        redrawTray();
        feedback(q, box, false, it.no || (it.label + " does not go at the " +
          stationLabel(key) + "."));
      }
      sync();
    }

    /* THE BENCH HAS TO SHOW WHAT HAS BEEN FITTED.

       The stage's own `bench.spec` and `bench.controls` are written in the
       lab, which has no way to see this asker's local state — so the state
       is hung on the question object and both read it from there. Without
       it the model kept drawing a toner cartridge the student had just
       been asked to fit, and every station in the list still said "empty"
       after something had gone into it. The board is meant to be the
       student's working memory; a board that does not record what they did
       is worse than no board. */
    q.fitState = { placed: placed };

    box.appendChild(slot);
    box.appendChild(tray);
    redrawTray();

    dockClaim(Object.assign({}, q.bench, {
        onPick: function (key) {
          /* Anything that is not a station is scenery. Clicking it is
             looking, not answering — the same contract askPick makes. */
          if (!(q.stations || []).some(function (s) { return s.key === key; })) return;
          onStation(key);
        }
      }), "q/" + q.key, q.height || 380)
      .then(function (bch) { bench = bch; })
      .catch(function () {
      slot.textContent = "";
      slot.appendChild(el("p", "panel-intro",
        "The 3D bench could not be loaded, so the stations are listed as buttons."));
      const ul = el("div", "opts");
      (q.stations || []).forEach(function (st) {
        const b = el("button", "opt", st.label);
        b.type = "button";
        b.addEventListener("click", function () { onStation(st.key); });
        ul.appendChild(b);
      });
      slot.appendChild(ul);
    });

    const sync = restartControl(q, box, function () {
      Object.keys(placed).forEach(function (k) { delete placed[k]; });
      Object.keys(refused).forEach(function (k) { delete refused[k]; });
      held = null;
      redrawTray();
      if (bench) bench.refresh();
    });
  }

  function askMulti(q, box) {
    const chosen = {};
    const list = el("div", "opts");
    (q.options || []).forEach(function (o) {
      const b = el("button", "opt", o.label);
      b.type = "button";
      b.dataset.opt = o.key;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (answered[q.key]) return;
        chosen[o.key] = !chosen[o.key];
        b.setAttribute("aria-pressed", String(!!chosen[o.key]));
        b.classList.toggle("picked", !!chosen[o.key]);
      });
      list.appendChild(b);
    });
    box.appendChild(list);
    const go = el("button", "btn primary", "Check these");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      const want = (q.options || []).filter(function (o) { return o.correct; }).map(function (o) { return o.key; }).sort();
      const got = Object.keys(chosen).filter(function (k) { return chosen[k]; }).sort();
      if (want.join("|") === got.join("|")) {
        answered[q.key] = true;
        list.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; });
        go.disabled = true;
        feedback(q, box, true, q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        const missing = want.filter(function (k) { return got.indexOf(k) < 0; }).length;
        const extra = got.filter(function (k) { return want.indexOf(k) < 0; }).length;
        feedback(q, box, false,
          (extra ? extra + " of those does not belong. " : "") +
          (missing ? "You are still missing " + missing + "." : ""));
      }
      sync();
    });
    box.appendChild(go);
    /* All the ticks, not the wrong ticks. Clearing only the wrong ones
       would name them, and which ones are wrong is exactly what rung 3
       of the ladder is for. */
    const sync = restartControl(q, box, function () {
      list.querySelectorAll(".opt").forEach(function (x) {
        x.classList.remove("picked");
        x.setAttribute("aria-pressed", "false");
      });
      Object.keys(chosen).forEach(function (k) { delete chosen[k]; });
    });
    sync();
  }

  function askNumber(q, box) {
    const row = el("div", "numrow");
    const inp = document.createElement("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.className = "num";
    inp.id = "q-" + q.key;
    inp.setAttribute("aria-label", q.prompt);
    const unit = el("span", "unit", q.unit || "");
    const go = el("button", "btn primary", "Check");
    go.type = "button";
    function submit() {
      if (answered[q.key]) return;
      const v = parseFloat(String(inp.value).replace(/[, ]/g, ""));
      if (isNaN(v)) { feedback(q, box, false, "Put a number in first."); return; }
      const tol = q.tolerance == null ? 0.001 : q.tolerance;
      if (Math.abs(v - q.answer) <= tol) {
        answered[q.key] = true;
        inp.disabled = true; go.disabled = true;
        feedback(q, box, true, q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        /* Say WHICH WAY they are out. "Too high" turns a guess into a
           correction; "wrong" just makes them type another number. */
        feedback(q, box, false, v > q.answer ? "That is too high." : "That is too low.");
      }
    }
    go.addEventListener("click", submit);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    row.appendChild(inp); if (q.unit) row.appendChild(unit); row.appendChild(go);
    box.appendChild(row);
  }

  /* Put items into slots. Click an item, click a slot — not drag, because
     drag is miserable on a phone and half these students are on one. */
  function askAssign(q, box) {
    /* TWO SHAPES, ONE ASKER.

       The ordinary one is one item per slot: a drive into a bay, a part
       into a station. `filled` is slot -> item.

       `q.multi` is the other: MANY items into each slot, which is what
       "put these nine devices on one of these three outlets" needs and
       what this could not do. There the state is item -> slot, because
       that is the question being asked — not "what is in this outlet"
       but "where does this device go" — and `check` is handed that map. */
    const multi = !!q.multi;
    let held = null;
    const filled = {};       /* single: slot -> item.  multi: item -> slot. */
    /* Published on the question for the same reason `fit` publishes its
       own: a bench panel above has no other way to see what the student
       has put where. */
    q.fitState = { placed: filled };
    const tray = el("div", "tray");
    const slots = el("div", "slots");

    function itemsIn(slotKey) {
      return (q.items || []).filter(function (it) { return filled[it.key] === slotKey; });
    }
    function isPlaced(itemKey) {
      return multi ? filled[itemKey] !== undefined
                   : Object.keys(filled).some(function (s) { return filled[s] === itemKey; });
    }

    function redrawTray() {
      tray.textContent = "";
      (q.items || []).forEach(function (it) {
        if (isPlaced(it.key)) return;
        const b = el("button", "chip" + (held === it.key ? " held" : ""), it.label);
        b.type = "button";
        if (it.sub) b.appendChild(el("span", "chip-sub", it.sub));
        b.addEventListener("click", function () { held = held === it.key ? null : it.key; redraw(); });
        tray.appendChild(b);
      });
      if (!tray.children.length) tray.appendChild(el("span", "small", "Nothing left in the tray."));
    }
    function redrawSlots() {
      slots.textContent = "";
      (q.slots || []).forEach(function (s) {
        if (multi) {
          /* A slot that holds several needs each of them to be its own
             control, or there is no way to take one back out. */
          const box2 = el("div", "slot slot-multi" + (itemsIn(s.key).length ? " full" : ""));
          const head = el("button", "slot-head", null);
          head.type = "button";
          head.appendChild(el("span", "slot-name", s.label));
          head.appendChild(el("span", "slot-val",
            held ? "put it here" : (itemsIn(s.key).length ? "" : "empty")));
          head.addEventListener("click", function () {
            if (answered[q.key]) return;
            if (!held) return;
            filled[held] = s.key; held = null; redraw(); refreshBenches();
          });
          box2.appendChild(head);
          const list = el("div", "slot-items");
          itemsIn(s.key).forEach(function (it) {
            const b = el("button", "chip small-chip", it.label);
            b.type = "button";
            b.title = "Take it back off";
            b.addEventListener("click", function () {
              if (answered[q.key]) return;
              delete filled[it.key]; redraw(); refreshBenches();
            });
            list.appendChild(b);
          });
          box2.appendChild(list);
          slots.appendChild(box2);
          return;
        }
        const b = el("button", "slot" + (filled[s.key] ? " full" : ""), null);
        b.type = "button";
        b.appendChild(el("span", "slot-name", s.label));
        const cur = filled[s.key];
        const it = (q.items || []).filter(function (x) { return x.key === cur; })[0];
        b.appendChild(el("span", "slot-val", it ? it.label : "empty"));
        b.addEventListener("click", function () {
          if (answered[q.key]) return;
          if (filled[s.key]) { delete filled[s.key]; redraw(); refreshBenches(); return; }
          if (!held) return;
          filled[s.key] = held; held = null; redraw(); refreshBenches();
        });
        slots.appendChild(b);
      });
    }
    function redraw() { redrawTray(); redrawSlots(); }

    box.appendChild(slots); box.appendChild(tray);
    const go = el("button", "btn primary", "Commit");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      const r = q.check(filled);
      if (r.ok) {
        answered[q.key] = true; go.disabled = true;
        feedback(q, box, true, r.why || q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        feedback(q, box, false, r.why);
      }
      sync();
    });
    box.appendChild(go);
    /* Clears every slot, not the wrong ones. `q.check` reports only
       whether the whole arrangement is right, so there is no per-slot
       truth to reset back to — and inventing one by clearing the slots
       that "look" wrong would be guessing at the answer on the student's
       behalf. An empty tray leaks nothing. */
    const sync = restartControl(q, box, function () {
      Object.keys(filled).forEach(function (k) { delete filled[k]; });
      held = null; redraw(); refreshBenches();
    });
    redraw();
    sync();
  }

  /* ---------------------------------------------------------------------
     SWAP — a baseline that is already wrong, and a budget of changes.

     This is the Core 1 Workstation Build & Compatibility Check sim, and
     the thing that makes it worth bringing across is the CONSTRAINT. The
     original hands you eight drop-downs and a counter that says "0 / 2
     changes used"; every other build exercise in this lab lets you
     specify from nothing. Being allowed to change only two things is a
     different skill entirely — it stops a student shotgunning every
     control and forces them to work out which two components are load
     bearing before touching anything.

     What changes on the way in:

       - THE COUNTER IS A REFUSAL, NOT A SCOLD. The original still grades
         a third change; it just prints a line saying you made one. Here
         a third swap is refused at the moment you try it, with the two
         you have already spent named, so the budget is a thing you feel
         rather than a thing you are told about afterwards.
       - EVERY ALTERNATIVE EXPLAINS ITSELF. The original's drop-downs are
         bare strings. Each option here carries why it is or is not the
         change this brief needs, and reverting is always free.
       - IT NEVER MARKS THE ANSWER. Commit says which requirement is
         still unmet, in the brief's own words. It does not say which
         control to move.

     Unlimited tries: the budget is a constraint inside one attempt, and
     resetting hands the whole two back.
     --------------------------------------------------------------------- */
  function askSwap(q, box) {
    const chosen = {};                       /* slot -> option key */
    (q.slots || []).forEach(function (s) { chosen[s.key] = s.baseline; });
    /* Published for the same reason `assign` and `fit` publish theirs —
       a bench panel above this question has no other way to see the
       configuration the student is holding. */
    q.fitState = { placed: chosen };

    const budget = q.budget || 2;
    const rows = el("div", "swap-rows");
    const tally = el("p", "panel-intro");

    function changes() {
      return (q.slots || []).filter(function (s) { return chosen[s.key] !== s.baseline; });
    }

    function redraw() {
      const spent = changes();
      rows.textContent = "";
      (q.slots || []).forEach(function (s) {
        const row = el("div", "swap-row");
        const head = el("p", "swap-name", s.label);
        if (chosen[s.key] !== s.baseline) head.appendChild(el("span", "swap-flag", "changed"));
        row.appendChild(head);
        const opts = el("div", "opts");
        (s.options || []).forEach(function (o) {
          const isOn = chosen[s.key] === o.key;
          const isBase = s.baseline === o.key;
          const b = el("button", "opt" + (isOn ? " on" : ""), o.label);
          b.type = "button";
          b.dataset.opt = o.key;
          b.setAttribute("aria-pressed", isOn ? "true" : "false");
          if (o.sub) b.appendChild(el("span", "opt-sub", o.sub));
          /* Three signals, never colour alone: the pressed state, the
             word in the tag, and the aria-pressed the screen reader
             reads out. */
          if (isBase) b.appendChild(el("span", "opt-tag", isOn ? "as it came" : "the original"));
          else if (isOn) b.appendChild(el("span", "opt-tag", "your change"));
          b.addEventListener("click", function () {
            if (answered[q.key]) return;
            if (chosen[s.key] === o.key) return;
            /* Going back to the baseline always costs nothing and is
               always allowed — otherwise a student who spends the budget
               badly is stuck, and nothing in this build ever strands
               anyone. */
            if (o.key !== s.baseline && chosen[s.key] === s.baseline && spentNow() >= budget) {
              feedback(q, box, false,
                "That would be change " + (budget + 1) + " and you are allowed " + budget + ". " +
                "You have already changed " + spent.map(function (x) { return x.label.toLowerCase(); }).join(" and ") +
                ". Put one of those back to its original first, then decide which two matter most.");
              return;
            }
            chosen[s.key] = o.key;
            redraw();
            refreshBenches();
          });
          opts.appendChild(b);
        });
        row.appendChild(opts);
        rows.appendChild(row);
      });
      const n = spentNow();
      tally.textContent = n + " of " + budget + " change" + (budget === 1 ? "" : "s") + " used" +
        (n ? " — " + spent.map(function (x) { return x.label.toLowerCase(); }).join(", ") + "." : ".");
    }
    function spentNow() { return changes().length; }

    box.appendChild(tally);
    box.appendChild(rows);

    const go = el("button", "btn primary", "Evaluate the configuration");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      const r = q.check(chosen, spentNow());
      if (r.ok) {
        answered[q.key] = true; go.disabled = true;
        feedback(q, box, true, r.why || q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        feedback(q, box, false, r.why);
      }
      sync();
    });
    box.appendChild(go);

    const sync = restartControl(q, box, function () {
      (q.slots || []).forEach(function (s) { chosen[s.key] = s.baseline; });
      redraw(); refreshBenches();
    });
    redraw();
    sync();
  }

  function askOrder(q, box) {
    let seq = [];
    const pool = el("div", "tray");
    const line = el("ol", "seq");
    function redraw() {
      pool.textContent = "";
      (q.steps || []).forEach(function (s) {
        if (seq.indexOf(s.key) >= 0) return;
        const b = el("button", "chip", s.label);
        b.type = "button";
        b.addEventListener("click", function () { if (!answered[q.key]) { seq.push(s.key); redraw(); } });
        pool.appendChild(b);
      });
      line.textContent = "";
      seq.forEach(function (k, i) {
        const s = (q.steps || []).filter(function (x) { return x.key === k; })[0];
        const li = el("li");
        const b = el("button", "chip placed", s ? s.label : k);
        b.type = "button";
        b.addEventListener("click", function () { if (!answered[q.key]) { seq.splice(i, 1); redraw(); } });
        li.appendChild(b);
        line.appendChild(li);
      });
    }
    box.appendChild(line); box.appendChild(pool);
    const go = el("button", "btn primary", "Check the order");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      const want = (q.steps || []).slice().sort(function (a, b) { return a.at - b.at; }).map(function (s) { return s.key; });
      if (seq.length !== want.length) {
        tracker.wrong(q.key);
        feedback(q, box, false, "All " + want.length + " steps have to be in the list.");
        return;
      }
      const firstBad = seq.findIndex(function (k, i) { return k !== want[i]; });
      if (firstBad < 0) {
        answered[q.key] = true; go.disabled = true;
        feedback(q, box, true, q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        /* Name the position, not the step. Enough to make progress,
           not enough to rebuild the sequence from the feedback. */
        feedback(q, box, false, "The first " + firstBad + " " +
          (firstBad === 1 ? "is" : "are") + " right. Step " + (firstBad + 1) + " is not." +
          (firstBad ? " Everything from there back into the tray, so you carry on from " +
                      "the last one you had right."
                    : " Cleared, so you can start the sequence again."));
        /* AND PUT THEM BACK TO THE LAST STEP THEY GOT RIGHT. Everything
           from the first wrong step onward returns to the tray. This
           reveals nothing the feedback above has not just said in words,
           and it stops a student either re-reading a sequence they have
           been told is good or dismantling the right half while hunting
           for the wrong half. */
        seq = seq.slice(0, firstBad);
        redraw();
      }
      sync();
    });
    box.appendChild(go);
    const sync = restartControl(q, box, function () { seq = []; redraw(); });
    redraw();
    sync();
  }

  /* WIRE — many connectors, many sockets. Click a connector, click the
     socket it goes in. A wrong pairing is REFUSED AT THE MOMENT OF
     CONNECTION with the reason, rather than accepted and marked wrong
     at the end: plugging an EPS connector into a PCIe socket should
     stop you the way the physical key stops you, and the reason is the
     teaching. */
  function askWire(q, box) {
    let held = null;
    const wired = {};                 /* socket key -> connector key */
    const sockets = el("div", "sockets");
    const tray = el("div", "tray");
    const log = el("div", "wirelog");

    function say(text, ok) {
      log.textContent = "";
      const p = el("p", ok ? "wl-ok" : "wl-no", text);
      log.appendChild(p);
    }

    function connect(sock) {
      if (answered[q.key]) return;
      if (wired[sock.key]) {
        const was = wired[sock.key];
        delete wired[sock.key];
        say("Unplugged " + labelFor(was) + " from " + sock.label + ".", true);
        redraw();
        return;
      }
      if (!held) { say("Pick a connector from the tray first.", false); return; }
      const verdict = q.accepts(held, sock.key);
      if (verdict === true || (verdict && verdict.ok)) {
        wired[sock.key] = held;
        say(labelFor(held) + " into " + sock.label + ". " +
            ((verdict && verdict.why) || "Seated."), true);
        held = null;
      } else {
        /* Refused. This is the moment the student learns something, so
           the reason is mandatory — a bare "no" teaches nothing. */
        tracker.wrong(q.key);
        say((verdict && verdict.why) || "That does not go there.", false);
        showGuidance(q, box);
      }
      redraw();
    }

    function labelFor(k) {
      const it = (q.items || []).filter(function (x) { return x.key === k; })[0];
      return it ? it.label : k;
    }

    function redraw() {
      sockets.textContent = "";
      (q.slots || []).forEach(function (sock) {
        const b = el("button", "socket" + (wired[sock.key] ? " full" : "") +
          (sock.optional ? " opt" : ""), null);
        b.type = "button";
        b.appendChild(el("span", "slot-name", sock.label));
        b.appendChild(el("span", "slot-val", wired[sock.key] ? labelFor(wired[sock.key])
          : (sock.optional ? "not needed for this build" : "empty")));
        if (sock.sub) b.appendChild(el("span", "slot-sub", sock.sub));
        b.addEventListener("click", function () { connect(sock); });
        sockets.appendChild(b);
      });
      tray.textContent = "";
      (q.items || []).forEach(function (it) {
        const used = Object.keys(wired).some(function (k) { return wired[k] === it.key; });
        if (used) return;
        const b = el("button", "chip" + (held === it.key ? " held" : ""), it.label);
        b.type = "button";
        if (it.sub) b.appendChild(el("span", "chip-sub", it.sub));
        b.addEventListener("click", function () {
          held = held === it.key ? null : it.key;
          say(held ? "Holding " + it.label + ". Now click where it goes." : "Put it back.", true);
          redraw();
        });
        tray.appendChild(b);
      });
      if (!tray.children.length) tray.appendChild(el("span", "small", "Every connector is in."));
    }

    box.appendChild(sockets);
    box.appendChild(tray);
    box.appendChild(log);
    const go = el("button", "btn primary", q.commitLabel || "Power it on");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      const r = q.check(wired);
      if (r.ok) {
        answered[q.key] = true; go.disabled = true;
        feedback(q, box, true, r.why || q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        feedback(q, box, false, r.why);
      }
    });
    box.appendChild(go);
    redraw();
  }

  /* PROBE — put an instrument on a test point and read it. The reading
     is the evidence; the question underneath is what it means. Students
     are asked to interpret a meter on the exam, and they cannot practise
     that by choosing from a list of interpretations. */
  function askProbe(q, box) {
    const readings = {};
    const pts = el("div", "probes");
    const panel = el("div", "meter");
    const face = el("div", "meter-face");
    const note = el("p", "small");
    panel.appendChild(el("h4", null, q.instrument || "Multimeter"));
    panel.appendChild(face);
    panel.appendChild(note);
    face.textContent = "— — —";

    (q.points || []).forEach(function (pt) {
      const b = el("button", "chip", pt.label);
      b.type = "button";
      if (pt.sub) b.appendChild(el("span", "chip-sub", pt.sub));
      b.addEventListener("click", function () {
        readings[pt.key] = true;
        face.textContent = pt.reading;
        note.textContent = pt.expected ? "Expected: " + pt.expected : "";
        face.className = "meter-face" + (pt.bad ? " bad" : " good");
        pts.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("held"); });
        b.classList.add("held");
        redrawGate();
      });
      pts.appendChild(b);
    });

    box.appendChild(panel);
    box.appendChild(pts);

    /* The question is gated behind actually taking the readings. A
       student who can answer without measuring has not practised
       measuring. */
    const gate = el("p", "small gate");
    box.appendChild(gate);
    const qbox = el("div");
    qbox.hidden = true;
    box.appendChild(qbox);

    function redrawGate() {
      const need = (q.points || []).length;
      const got = Object.keys(readings).length;
      if (got < need) {
        gate.textContent = "Take all " + need + " readings before you call it. " + got + " of " + need + " so far.";
        qbox.hidden = true;
      } else {
        gate.textContent = "";
        qbox.hidden = false;
      }
    }
    redrawGate();

    /* The follow-up is an ordinary choice, rendered into the gated box. */
    const sub = Object.assign({}, q.then, { key: q.key });
    qbox.appendChild(el("h3", null, sub.prompt));
    askChoice(sub, qbox);
  }

  /* PLACE — put something on a floor plan and watch the numbers move.

     The readings are RECOMPUTED from the position on every click, by a
     function the lab supplies. That is the whole point: a student drags
     an access point behind a concrete wall and watches the far corner
     fall off a cliff, rather than being told that concrete attenuates.
     Nothing here is authored per position; there is one model, so the
     plan and the readings cannot disagree. */
  function askPlace(q, box) {
    let pos = null;
    const gridEl = el("div", "plan");
    const readout = el("div", "readout");
    const legend = el("div", "legend");

    (q.legend || []).forEach(function (l) {
      const item = el("span", "legend-item");
      item.appendChild(el("span", "swatch t-" + (l.tone || "open"), l.glyph || ""));
      /* The label goes in its OWN element rather than as a bare text
         node. As a text node its box was the whole legend item — swatch
         included — so the contrast sweep sampled the swatch's colour
         behind it and read 5.88:1 for text that is nowhere near it. */
      item.appendChild(el("span", "legend-label", l.label));
      legend.appendChild(item);
    });

    function drawReadout() {
      readout.textContent = "";
      if (!pos) {
        readout.appendChild(el("p", "small", "Click a square to put the access point there."));
        return;
      }
      const rows = q.readout(pos);
      const t = el("table");
      const tb = el("tbody");
      rows.forEach(function (r) {
        const tr = el("tr");
        if (r.ok === false) tr.className = "row-bad";
        tr.appendChild(el("td", null, r.label));
        tr.appendChild(el("td", null, r.value));
        tr.appendChild(el("td", "verdict", r.ok === false ? "too weak" : r.ok === true ? "usable" : ""));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      const wrap = el("div", "tablewrap");
      wrap.appendChild(t);
      readout.appendChild(wrap);
    }

    function draw() {
      gridEl.textContent = "";
      gridEl.style.setProperty("--cols", String(q.grid.cols));
      q.grid.cells.forEach(function (c, i) {
        const x = i % q.grid.cols, y = Math.floor(i / q.grid.cols);
        const here = pos && pos.x === x && pos.y === y;
        const b = el("button", "cell t-" + (c.tone || "open") + (here ? " sited" : ""), null);
        b.type = "button";
        /* Every cell says what it is in TEXT as well as colour. A plan
           legible only by colour is not legible to these students. */
        b.setAttribute("aria-label", (c.label || "open floor") + " at column " + (x + 1) + ", row " + (y + 1) +
          (here ? ", access point sited here" : ""));
        b.appendChild(el("span", "cell-g", here ? "AP" : (c.glyph || "")));
        if (c.blocked) b.disabled = true;
        b.addEventListener("click", function () {
          if (answered[q.key] || c.blocked) return;
          pos = { x: x, y: y };
          draw(); drawReadout();
        });
        gridEl.appendChild(b);
      });
    }

    box.appendChild(legend);
    box.appendChild(gridEl);
    box.appendChild(readout);
    const go = el("button", "btn primary", q.commitLabel || "Mount it here");
    go.type = "button";
    go.addEventListener("click", function () {
      if (answered[q.key]) return;
      if (!pos) { feedback(q, box, false, "Put it somewhere first."); return; }
      const r = q.check(pos);
      if (r.ok) {
        answered[q.key] = true; go.disabled = true;
        feedback(q, box, true, r.why || q.explain);
        onProgress();
      } else {
        tracker.wrong(q.key);
        feedback(q, box, false, r.why);
      }
      sync();
    });
    box.appendChild(go);
    const sync = restartControl(q, box, function () { pos = null; draw(); drawReadout(); });
    draw(); drawReadout();
    sync();
  }

  const ASKERS = { choice: askChoice, multi: askMulti, number: askNumber,
                   assign: askAssign, order: askOrder, wire: askWire,
                   probe: askProbe, place: askPlace, pick: askPick,
                   fit: askFit, swap: askSwap };

  /* ---------------- the stage ---------------- */

  /* Benches mounted as PANELS on the stage currently on screen. Cleared on
     every redraw, because a handle to a bench that is no longer in the
     document is a leak and a redraw of it is a silent no-op. */
  let stageBenches = [];
  /* Benches drawn INLINE on the stage, as opposed to the docked one.
     These are disposed when the stage changes; the dock is not. */
  let inlineBenches = [];

  /* =====================================================================
     THE MODEL DOCK — one machine, centred, on every step.

     The owner's requirement, in their words: "I want the 3D model to be
     in the middle… The 3D model always loads in the center of the page…
     have the 3D model stay in front of them. I want the 3D model to be
     present for all the steps."

     Three things follow from that, and none of them was true before:

     1. ONE BENCH FOR THE WHOLE RUN. A bench mounted per stage is a new
        WebGL context per stage, and the browser kills the oldest once it
        has sixteen. The dock mounts once and is RE-TARGETED as the
        student moves, which is what `setSpec` was added for.

     2. EVERY STEP HAS A MACHINE. Thirteen stages across the eight labs
        carry no bench of their own — a brief to read, a table to check, a
        calculation to do — and they used to be text and nothing else.
        They now show the lab's own machine, the same object the student
        clicked in the showroom to get here. That is not decoration: it is
        the thing the job is about, sitting on the bench while they read
        the brief for it.

     3. IT STAYS IN FRONT OF THEM. The dock is sticky, so scrolling down
        through the questions does not scroll the hardware off the top.

     WHAT IT IS NOT: it is not a second interface. The controls beside the
     canvas are still real buttons, the canvas is still scenery, and
     turning WebGL off still costs the picture and nothing else. */
  let dock = null;

  function dockBox() {
    if (dock) return dock.box;
    const box = el("div", "panel panel-bench model-dock");
    box.dataset.dock = "1";
    const slot = el("div");
    slot.appendChild(el("p", "panel-intro", "Fetching the bench…"));
    box.appendChild(slot);
    dock = { box: box, slot: slot, bench: null, pending: null, key: null };
    return box;
  }

  /* Point the dock at a bench spec. `p` is a bench PANEL — the same shape
     a stage has always declared — or null for "show the resting machine".

     The lab module is loaded; bench.js is not, and pulling three.js in for
     a student who only wanted to read is the reason it was ever lazy. So
     this returns immediately and fills in when the import lands, and a
     second call before that happens simply replaces what is pending
     rather than racing it. */
  function dockShow(p) {
    const box = dockBox();
    dock.pending = p;
    if (p && p.title) {
      let h = box.querySelector(".panel-title");
      if (!h) { h = el("h3", "panel-title"); box.insertBefore(h, box.firstChild); }
      h.textContent = p.title;
    } else {
      const h = box.querySelector(".panel-title");
      if (h) h.remove();
    }
    if (dock.bench) { applyDock(); return; }
    if (dock.loading) return;
    dock.loading = true;
    import("./bench.js").then(function (m) {
      dock.slot.textContent = "";
      dock.mod = m;
      applyDock();
    }).catch(function () {
      dock.slot.textContent = "";
      dock.slot.appendChild(el("p", "panel-intro",
        "The 3D bench could not be loaded, so this lab is running without it. " +
        "Everything the stages ask you is answerable from the text."));
      dock.failed = true;
    });
  }

  function applyDock() {
    const p = dock.pending;
    if (!p || !dock.mod || dock.failed) return;
    p.bench.height = p.height || 380;
    if (!dock.bench) {
      dock.bench = dock.mod.mountBench(dock.slot, p.bench);
    } else {
      /* SAME MACHINE OR A DIFFERENT ONE? A student who turned the phone
         round to look at its edge should not have it snapped back when
         they answer a question — but moving to a different machine
         SHOULD take that machine's own framing, or a rack arrives at a
         phone's camera distance. The bench key is what tells them apart. */
      dock.bench.retarget(p.bench, dock.key === p.dockKey);
    }
    dock.key = p.dockKey;
    /* SAY IN THE DOM WHETHER THIS IS A REAL BENCH OR A RESTING MACHINE.

       They are both `.panel-bench`, and the suite's "benches mount" check
       walks a lab until it finds the first one — so the moment the dock
       started putting a resting machine on stage 0, three labs were being
       measured on the resting machine rather than on their own bench and
       reported "only 1 controls". The check was right to complain and it
       was looking at the wrong thing.

       A stage that names itself cannot be mistaken for another kind, which
       is the same reason every question box carries `data-kind`. */
    if (p.resting) dock.box.dataset.resting = "1";
    else delete dock.box.dataset.resting;
    /* `refreshBenches` redraws whatever is on this stage, and the docked
       bench is on every stage. A question that changes the hardware has
       to reach it, or the RAID chassis sits empty while the student
       fills it — which is the exact bug the refresh mechanism was
       written for in the first place. */
    stageBenches = inlineBenches.concat([dock.bench]);
    if (p.bench.onReady) p.bench.onReady(dock.bench);
  }

  /* A QUESTION CAN CLAIM THE DOCK.

     On `pick` and `fit` the MODEL IS THE QUESTION — the student answers by
     choosing a part or placing one on the machine. Those two askers used
     to mount a bench of their own inside the question box, which was
     right when a stage had no persistent model and is wrong now: it put
     the lab's resting machine in the dock AND the interactive machine
     below it, two models on one page, on exactly the stages where there
     should be one and the student should be working on it.

     So the asker takes the dock instead. It also fixes a leak those two
     stages had all along: their benches were removed from the document
     on every stage change and never disposed, so each visit abandoned a
     context. */
  function dockClaim(benchOpts, dockKey, height) {
    return new Promise(function (resolve, reject) {
      dockShow({ kind: "bench", height: height || 380, dockKey: dockKey,
                 bench: benchOpts, onClaim: resolve });
      /* dockShow resolves through applyDock; if the module never lands,
         `dock.failed` is set and the caller needs its list fallback. */
      const t = setInterval(function () {
        if (dock && dock.failed) { clearInterval(t); reject(new Error("no bench module")); }
        if (dock && dock.bench && dock.key === dockKey) { clearInterval(t); resolve(dock.bench); }
      }, 60);
      setTimeout(function () { clearInterval(t); }, 20000);
    });
  }

  /* WHAT THE DOCK SHOWS ON THIS STAGE.

     A stage that declares a bench gets that bench. A stage that does not
     gets the lab's own machine — the same object the student clicked in
     the showroom to get here. Thirteen stages across the eight labs are
     in the second group, and they were text and nothing else.

     `dockKey` is how the bench decides whether to keep the student's
     orbit or take the new machine's framing. It is the STAGE key for a
     real bench, because two stages of one lab are usually two different
     views of the machine and each has its own camera. */
  function chooseDock(s) {
    /* A `pick` or `fit` question owns the machine on its stage, so the
       dock is left for it rather than being filled with a resting one
       that the asker would then have to replace — which would show the
       student the wrong machine for a frame and cost a context. */
    if ((s.questions || []).some(function (q) { return q.bench && (q.kind === "pick" || q.kind === "fit"); })) {
      return null;
    }
    const benches = (s.panels || []).filter(function (p) { return p.kind === "bench"; });
    if (benches.length) {
      benches[0].dockKey = "stage/" + s.key;
      dockShow(benches[0]);
      return benches[0];
    }
    /* THE RESTING MACHINE. bench-room.js is imported here rather than at
       the top because a student who never reaches a bench should not pay
       for it — same reason bench.js is lazy.

       The `at` guard is not theoretical: a student clicking Next twice
       quickly has two of these in flight, and without it the SECOND
       stage can be overwritten by the FIRST one's import landing late,
       leaving the wrong machine on screen with no way to tell. */
    const want = at;
    import("./bench-room.js").then(function (R) {
      if (at !== want) return;
      const key = R.restingKeyFor(labKey, s.key || machineHint) ||
                  R.restingKeyFor(labKey, machineHint);
      if (!key) return;
      dockShow(restingPanel(R, key));
    }).catch(function () {});
    return null;
  }

  /* The lab's machine as a bench: read-only, no actions, every part
     nameable. It is not a stand-in for a bench that should exist — it is
     the hardware the job is about, sitting there while the brief is read,
     which is what the real desk looks like. */
  function restingPanel(R, key) {
    const spec = R.machineBench(key);
    return {
      kind: "bench", height: 380, dockKey: "rest/" + key, resting: true,
      bench: {
        spec: function () { return spec; },
        status: function () {
          return { words: spec.title, tone: "calm",
                   detail: "The machine this job is about." };
        },
        controls: function () {
          return spec.parts.map(function (pt) {
            return { key: pt.key, label: pt.label, state: "idle",
                     stateWords: "on the bench", detail: pt.spec };
          });
        },
        onAction: function () { return {}; }
      }
    };
  }

  /* WHAT GOES ON THE SHELF. Read off the live run rather than tracked
     alongside it, so a parked job cannot disagree with the lab it came
     from. */
  function snapshot() {
    return {
      lab: labKey,
      seed: scenario.seed,
      at: at,
      stages: stages.length,
      stageTitle: (stages[at] && stages[at].title) || "",
      machine: machineHint,
      answered: Object.assign({}, answered),
      attempts: tracker.all()
    };
  }

  function drawStage() {
    /* HAND THE CONTEXTS BACK BEFORE THROWING THE DOM AWAY.

       `host.textContent = ""` removes the canvases from the document and
       `stageBenches = []` drops the handles — and neither releases a
       WebGL context. Dropping the last JavaScript reference to a renderer
       does not free the GPU resources it holds; the browser keeps it
       alive until its own cap forces it to kill the oldest. So walking
       eight stages of a lab used to leave eight contexts behind. */
    inlineBenches.forEach(function (b) { try { b.dispose(); } catch (e) {} });
    inlineBenches = [];
    /* THE DOCK SURVIVES THE STAGE. Take it out of the document before the
       document is emptied, so its canvas and its WebGL context come with
       it rather than being thrown away and rebuilt on the next step —
       which is the whole point of a persistent model. */
    if (dock && dock.box.parentNode) dock.box.parentNode.removeChild(dock.box);
    host.textContent = "";
    const s = stages[at];

    const head = el("header", "stage-head");
    head.appendChild(el("p", "crumb", "Stage " + (at + 1) + " of " + stages.length +
      "  ·  seed " + scenario.seed));
    head.appendChild(el("h2", null, s.title));
    if (s.intro) head.appendChild(el("p", "intro", s.intro));
    host.appendChild(head);

    /* THE MACHINE GOES IN THE DOCK, ABOVE EVERYTHING, ON EVERY STEP.

       A stage's own bench panel is routed here instead of being drawn
       inline. A stage with no bench gets the lab's resting machine, so
       "the 3D model is present for all the steps" is true rather than
       true-on-most-of-them. */
    host.appendChild(dockBox());
    const docked = chooseDock(s);

    (s.panels || []).forEach(function (p) {
      if (p === docked) return;
      const fn = PANELS[p.kind];
      if (!fn) throw new Error("runner: no panel kind \"" + p.kind + "\"");
      host.appendChild(fn(p));
    });

    (s.questions || []).forEach(function (q) {
      const box = el("section", "q");
      /* SAY WHAT KIND OF QUESTION THIS IS, IN THE DOM.

         Six of the question kinds render their answers into a `.opts`
         div — choice, multi, tool, connector, probe and assign among
         them — so anything looking at the page could only guess a
         question's type from its shape, and guessed wrong. The hint
         ladder check hunted for "a .opts with four or more options",
         found one belonging to a CHOICE question on a WAP stage, and
         then drove the FIRST .opts on that stage, which belonged to a
         different widget entirely. It reported green while the rung-3
         rule went untested on that lab.

         A question that names itself cannot be mistaken for another
         kind. This is two attributes and no behaviour. */
      box.dataset.kind = q.kind;
      if (q.key) box.dataset.qkey = q.key;
      box.appendChild(el("h3", null, q.prompt));
      if (q.detail) box.appendChild(el("p", "small", q.detail));
      const ask = ASKERS[q.kind];
      if (!ask) throw new Error("runner: no question kind \"" + q.kind + "\"");
      ask(q, box);
      host.appendChild(box);
    });

    /* THE ANSWERS, WHEN AN INSTRUCTOR HAS ASKED FOR THEM.

       Below the questions rather than above them, because it is a
       reference for somebody standing at the front of a room and not a
       thing to read first. It is rebuilt on every stage draw and torn
       out again the moment the mode goes off — a panel left behind after
       a PIN is turned off is the answers still on the projector. */
    if (INSTRUCTOR.isOn()) host.appendChild(INSTRUCTOR.answerPanel(s, el));

    const nav = el("div", "nav");
    const back = el("button", "btn", "‹ Previous stage");
    back.type = "button";
    back.disabled = at === 0;
    back.addEventListener("click", function () { at--; drawStage(); });
    const fwd = el("button", "btn primary", at === stages.length - 1 ? "Finish" : "Next stage ›");
    fwd.type = "button";
    fwd.addEventListener("click", function () {
      const unanswered = (stages[at].questions || []).filter(function (q) { return !answered[q.key]; });
      if (unanswered.length) {
        let warn = nav.querySelector(".warn");
        if (!warn) { warn = el("p", "warn"); nav.appendChild(warn); }
        /* Not a lock. Nudging is right; trapping a stuck student on a
           page with no instructor to ask is not. */
        warn.textContent = unanswered.length + " question" + (unanswered.length === 1 ? "" : "s") +
          " still open on this stage. You can move on, but the hints are here if you want them.";
        warn.dataset.nudged = "1";
        if (warn.dataset.seen === "1") advance();
        warn.dataset.seen = "1";
        return;
      }
      advance();
    });
    function advance() {
      if (at < stages.length - 1) { at++; drawStage(); }
      else finish();
    }
    /* PUT IT DOWN AND COME BACK TO IT.

       Beside Previous and Next, because that is where a student's hand
       already is when they decide they have had enough — not in a menu,
       and not as an icon. The words say what happens to the job AND where
       it goes, since "Pause" alone does not tell anybody there is a shelf
       with their job on it. */
    if (opts.onPark) {
      const park = el("button", "btn park", "Put this job in the storage room");
      park.type = "button";
      park.addEventListener("click", function () {
        const saved = opts.onPark(snapshot());
        let say = nav.querySelector(".parked-say");
        if (!say) { say = el("p", "parked-say"); say.setAttribute("role", "status"); nav.appendChild(say); }
        /* Storage can refuse — a private window, blocked site data. Say
           so rather than claim a save that did not happen and lose an
           hour of somebody's work without telling them. */
        say.textContent = saved
          ? "Put away. It is on the shelf at stage " + (at + 1) + " of " + stages.length +
            ", and it will be there when you come back."
          : "This browser would not let the job be saved, so it has been left where it is. "
            + "Private windows and blocked site data both do this.";
      });
      nav.appendChild(park);
    }

    nav.appendChild(back); nav.appendChild(fwd);
    host.appendChild(nav);

    onProgress();
  }

  function finish() {
    host.textContent = "";
    const done = Object.keys(answered).length;
    const total = stages.reduce(function (n, s) { return n + (s.questions || []).length; }, 0);
    const box = el("div", "done");
    box.appendChild(el("h2", null, "Job finished"));
    box.appendChild(el("p", null, done + " of " + total + " questions answered correctly. Seed " + scenario.seed + "."));

    /* WRITE IT DOWN, ON THE WAY OUT.

       This screen used to be the only place a finished job was ever
       acknowledged, and it lives exactly as long as the tab does. These
       labs are an hour each and students do them alone over weeks — what
       they have already done is the thing the page most needs to
       remember, and it was the thing it forgot fastest.

       It is recorded HERE rather than by the shell watching for the last
       stage, because this function is the one place that knows the run
       actually ended. The shell decides what to do with it. */
    let kept = null;
    if (opts.onDone) {
      try {
        kept = opts.onDone(Object.assign({}, snapshot(), { right: done, total: total }));
      } catch (e) { kept = false; }
    }
    if (kept) {
      box.appendChild(el("p", "done-kept",
        "It is on the finished shelf in the storage room, with this score against it. " +
        "Doing it again keeps the better of the two."));
    } else if (kept === false) {
      /* SAY SO RATHER THAN CLAIM A SAVE THAT DID NOT HAPPEN. Private
         windows and blocked site data both refuse storage outright, and
         a student who is told their work was recorded and comes back to
         an empty shelf has been lied to by the page. */
      box.appendChild(el("p", "done-kept",
        "This browser would not let the result be saved, so it is not on the finished shelf. " +
        "Private windows and blocked site data both do this — the seed above is how to find " +
        "this exact job again."));
    }

    const again = el("button", "btn primary", "Another one, new scenario");
    again.type = "button";
    again.addEventListener("click", function () { if (opts.onRestart) opts.onRestart(); });
    box.appendChild(again);
    /* A WAY BACK TO THE ROOM, not only a way round again. A student who
       has finished is at least as likely to want to choose the next lab
       as to repeat this one, and "Another one" was the only door. */
    const out = el("button", "btn", "Back to the workshop");
    out.type = "button";
    out.addEventListener("click", function () { if (opts.onLeave) opts.onLeave(); });
    box.appendChild(out);
    host.appendChild(box);
  }

  drawStage();

  return {
    /* Seams for the verifier — it reads what the page decided rather
       than re-deriving it from the modules and agreeing with itself.

       `answers` exists so a test can pick a DELIBERATELY WRONG option.
       Without it the hint-ladder test clicked blind and sometimes hit
       the correct answer on the first go, which ended the run before
       any rung appeared — a flaky test that looked like a missing
       feature. Nothing in the UI reads this. */
    answers: function () {
      const out = {};
      stages.forEach(function (st) {
        (st.questions || []).forEach(function (q) {
          /* A probe question holds its real options under `then`, so
             reading only q.options missed them entirely — the hint test
             then could not tell right from wrong, clicked the correct
             answer first go, and reported the whole ladder missing. */
          const opts = q.options || (q.then && q.then.options);
          if (opts) out[q.key] = opts.filter(function (o) { return o.correct; })
            .map(function (o) { return o.key; });
        });
      });
      return out;
    },
    stageIndex: function () { return at; },
    /* REDRAW THE STAGE THAT IS OPEN. The shell calls this when instructor
       mode is switched, because the answer panel is built during
       drawStage and there is no other way to get it on or off the screen
       without moving the student. Everything a stage holds — what they
       have answered, how many times they have missed, what is in the
       dock — lives outside drawStage, so this costs them nothing. */
    redraw: function () { drawStage(); },
    /* Everything a parked job needs, and nothing more — the scenario
       itself is reproducible from its seed. */
    snapshot: snapshot,
    stageCount: function () { return stages.length; },
    answered: function () { return Object.assign({}, answered); },
    attempts: function () { return tracker.all(); },
    go: function (i) { at = i; drawStage(); }
  };
}
