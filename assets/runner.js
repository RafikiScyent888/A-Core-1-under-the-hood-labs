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

export function createRunner(host, opts) {
  const lab = opts.lab;                 /* the lab module */
  const scenario = opts.scenario;
  const stages = opts.stages;           /* already tier-filtered */
  const optional = opts.optional || []; /* layered mode's offers */
  const onProgress = opts.onProgress || function () {};

  const tracker = makeTracker();
  const answered = {};                  /* key -> true once correct */
  const taken = {};                     /* optional stages accepted */
  let at = 0;

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

  const PANELS = { brief: drawBrief, table: drawTable, mech: drawMech, note: drawNote };

  /* ---------------- questions ---------------- */

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
          onProgress();
        } else {
          tracker.wrong(q.key);
          b.classList.add("wrong");
          feedback(q, box, false, o.why);
        }
      });
      list.appendChild(b);
    });
    box.appendChild(list);
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
    });
    box.appendChild(go);
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
    let held = null;
    const filled = {};
    const tray = el("div", "tray");
    const slots = el("div", "slots");

    function redrawTray() {
      tray.textContent = "";
      (q.items || []).forEach(function (it) {
        if (Object.keys(filled).some(function (s) { return filled[s] === it.key; })) return;
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
        const b = el("button", "slot" + (filled[s.key] ? " full" : ""), null);
        b.type = "button";
        b.appendChild(el("span", "slot-name", s.label));
        const cur = filled[s.key];
        const it = (q.items || []).filter(function (x) { return x.key === cur; })[0];
        b.appendChild(el("span", "slot-val", it ? it.label : "empty"));
        b.addEventListener("click", function () {
          if (answered[q.key]) return;
          if (filled[s.key]) { delete filled[s.key]; redraw(); return; }
          if (!held) return;
          filled[s.key] = held; held = null; redraw();
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
    });
    box.appendChild(go);
    redraw();
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
          (firstBad === 1 ? "is" : "are") + " right. Step " + (firstBad + 1) + " is not.");
      }
    });
    box.appendChild(go);
    redraw();
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
    });
    box.appendChild(go);
    draw(); drawReadout();
  }

  const ASKERS = { choice: askChoice, multi: askMulti, number: askNumber,
                   assign: askAssign, order: askOrder, wire: askWire,
                   probe: askProbe, place: askPlace };

  /* ---------------- the stage ---------------- */

  function drawStage() {
    host.textContent = "";
    const s = stages[at];

    const head = el("header", "stage-head");
    head.appendChild(el("p", "crumb", "Stage " + (at + 1) + " of " + stages.length +
      "  ·  seed " + scenario.seed));
    head.appendChild(el("h2", null, s.title));
    if (s.intro) head.appendChild(el("p", "intro", s.intro));
    host.appendChild(head);

    (s.panels || []).forEach(function (p) {
      const fn = PANELS[p.kind];
      if (!fn) throw new Error("runner: no panel kind \"" + p.kind + "\"");
      host.appendChild(fn(p));
    });

    (s.questions || []).forEach(function (q) {
      const box = el("section", "q");
      box.appendChild(el("h3", null, q.prompt));
      if (q.detail) box.appendChild(el("p", "small", q.detail));
      const ask = ASKERS[q.kind];
      if (!ask) throw new Error("runner: no question kind \"" + q.kind + "\"");
      ask(q, box);
      host.appendChild(box);
    });

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
    const again = el("button", "btn primary", "Another one, new scenario");
    again.type = "button";
    again.addEventListener("click", function () { if (opts.onRestart) opts.onRestart(); });
    box.appendChild(again);
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
    stageCount: function () { return stages.length; },
    answered: function () { return Object.assign({}, answered); },
    attempts: function () { return tracker.all(); },
    go: function (i) { at = i; drawStage(); }
  };
}
