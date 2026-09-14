/* =====================================================================
   Power — budget the load, cable it for real, size the UPS, meter it.

   All four of the things the owner asked for, and this is the lab where
   "more hands-on" was the whole brief. So it is deliberately the least
   multiple-choice lab in the build: you cable the machine connector by
   connector with wrong ones refused as you make them, you put a meter on
   four rails and read what it says, and you find out under load whether
   the supply you chose was big enough.

   The arithmetic is real throughout. Draw is summed from actual parts,
   the recommended supply comes out of that sum, and the UPS runtime is
   computed rather than looked up — so a student who changes a part sees
   every downstream number change with it.
   ===================================================================== */
import { rng } from "./rng.js";
import { powerBench, outletBench, socketWords, RAILS, railInSpec } from "./bench-power.js";
import { psuBench } from "./bench-psu.js";
import { LOOM_CASES, LOOM_OPTS, MAINS_CASES, MAINS_OPTS, UPS_CASES, UPS_OPTS } from "./conn-cases.js";
import { sixOptions } from "./options.js";

/* A bench panel with its controls mapped straight off the parts, so a
   part added to a model cannot go missing from the list beside it. */
function connPanel(spec, o) {
  return {
    kind: "bench", title: o.title, intro: o.intro, height: o.height || 420,
    bench: {
      spec: spec,
      status: function () { return { tone: o.tone || "calm", words: o.words, detail: o.detail }; },
      controls: function () {
        return spec().parts.map(function (p) {
          return { key: p.key, label: p.label, state: "na",
                   stateWords: p.spec || "On the bench", detail: p.note };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* Six options from an eight-option pool, the scenario naming the right
   one. Every wrong option explains itself in its own terms. */
function connPool(pool, rightKey, why, salt) {
  return sixOptions(pool.map(function (o) {
    return { key: o.key, label: o.label, correct: o.key === rightKey,
             why: o.key === rightKey ? "Yes. " + why
                : "No. Nothing in the report points there: " + o.label.toLowerCase() + "." };
  }), salt);
}


/* ------------------------------------------------------------------
   Connectors and the sockets they belong in. `fits` is the ONLY place
   that says what goes where, so the wiring task, its refusals and its
   final check all read from one table.
   ------------------------------------------------------------------ */
export const CONNECTORS = {
  atx24:  { label: "24-pin ATX",       sub: "the big one",             fits: "mb",
            wrong: "The 24-pin is the board's main power. It is the widest connector on the loom and only one socket takes it." },
  eps8:   { label: "EPS 4+4 (CPU)",    sub: "8-pin, square pins",      fits: "cpu",
            wrong: "EPS feeds the CPU. It is square-pinned and lives at the TOP of the board — not the same as the PCIe connector it resembles." },
  pcie8:  { label: "PCIe 6+2",         sub: "8-pin, mixed pins",       fits: "gpu",
            wrong: "PCIe power goes to the graphics card. It looks like EPS but the pin shapes differ, which is exactly why people force it into the wrong one." },
  sata:   { label: "SATA power",       sub: "flat L-shaped",           fits: "ssd",
            wrong: "SATA power is the flat L-shaped connector, and it goes to drives — not to anything on the board." },
  molex:  { label: "Molex 4-pin",      sub: "old, round pins",         fits: "fan",
            wrong: "Molex is the old four-pin. Nothing modern on the board wants it; here it is only good for the fan hub." },
  front:  { label: "Front panel header", sub: "loose single pins",     fits: "panel",
            wrong: "The front panel header is the fiddly cluster of single wires for the power switch and LEDs. It has its own block of pins." }
};

export const SOCKETS = [
  { key: "mb",    label: "Motherboard main",  sub: "24 pins, side of the board" },
  { key: "cpu",   label: "CPU power",         sub: "8 pins, top edge" },
  { key: "gpu",   label: "Graphics card",     sub: "8 pins, end of the card" },
  { key: "ssd",   label: "SSD",               sub: "flat connector on the drive" },
  { key: "fan",   label: "Fan hub",           sub: "four round pins" },
  { key: "panel", label: "Front panel block", sub: "single pins, bottom corner" }
];

/* Loads, summed to a real figure. */
const CPUS = [
  { label: "6-core, 65 W",  watts: 65 },
  { label: "8-core, 105 W", watts: 105 },
  { label: "12-core, 125 W", watts: 125 },
  { label: "16-core, 170 W", watts: 170 }
];
const GPUS = [
  { label: "integrated graphics", watts: 0 },
  { label: "mid-range card",      watts: 200 },
  { label: "high-end card",       watts: 320 },
  { label: "workstation card",    watts: 285 }
];
const BASE = { board: 40, ram: 12, ssd: 6, fans: 12 };

const CUSTOMERS = [
  { who: "Tollgate Dental",       size: "Small Business" },
  { who: "Marlow Print Room",     size: "Small Business" },
  { who: "Brightside Academy",    size: "Mid-Market" },
  { who: "Kellow Manufacturing",  size: "Mid-Market" },
  { who: "Sentinel Data Services",size: "Major Corporation" }
];

const JOBS = [
  { key: "reception", what: "the reception machine",
    said: ["it is on from eight until six and nothing more demanding than the booking system",
           "when the power flickers it reboots, and we lose whatever was being typed",
           "there is no room under that desk for anything big"] },
  { key: "render", what: "the render box",
    said: ["it pins everything for hours at a time when a job is running",
           "the last one started shutting itself off mid-render and we never found out why",
           "it is in the back room so noise does not matter"] },
  { key: "server", what: "the little server in the cupboard",
    said: ["it has to come down cleanly if the power goes, not just stop",
           "there is a cabinet with a spare socket next to it",
           "it runs all night doing backups and nobody is here to watch it"] }
];

const NOISE = [
  "The electrician is coming next month about the sockets anyway.",
  "We bought a four-way extension from the supermarket for it.",
  "I think the old one was quite a well-known make.",
  "It has to be in before the insurance inspection.",
  "The cleaner unplugs things sometimes, which cannot help."
];


/* =====================================================================
   chain — the Core 1 Power Source Drag & Drop.

   Source: `Core-1-Sims/Power Management.html`. Two drop-downs deciding
   what each protector plugs INTO, then nine named devices dragged onto
   three sources: wall outlet, surge protector, UPS.

   The `protect` stage further down this lab already asks what goes on
   battery, and carries the laser-printer lesson. What it does NOT ask is
   the half this sim leads with: WHAT PLUGS INTO WHAT. That is a
   different question, it is the one people get wrong in their own homes,
   and one of its answers is a safety matter rather than a preference.

   ---------------------------------------------------------------------
   THE SOURCE SIM'S ANSWER IS WRONG, AND IT IS THE DANGEROUS KIND

   It marks "the UPS plugs into the surge protector" correct. Every UPS
   manufacturer says the opposite, in the manual, in bold: a UPS goes
   STRAIGHT INTO THE WALL. Three reasons, and a student should be able to
   give at least the first two:

     - A UPS already contains surge suppression. A strip in front of it
       is not extra protection, it is a second set of components doing
       the same job worse.
     - A UPS draws a large inrush when it charges and when it transfers.
       A strip's own breaker is sized for a load, not for that, and it
       trips \\u2014 which drops the very thing the UPS exists to hold up.
     - The strip's clamping sits between the UPS and the mains it is
       trying to measure, and a line-interactive unit reads that
       waveform to decide when to transfer.

   So the answer here is the wall, "a surge protector" stays on the list
   as the near miss it is, and the stage says on screen that the original
   marks it the other way. Getting this one backwards is not a lost mark,
   it is a customer whose server drops every time the UPS self-tests.
   ===================================================================== */

const PC_SOURCES = {
  wall:  { label: "Straight into a wall outlet" },
  surge: { label: "Into a surge protector" },
  ups:   { label: "Into the UPS's battery outlets" },
  upsx:  { label: "Into the UPS's surge-only outlets" },
  strip2:{ label: "Into a second surge protector" },
  reel:  { label: "Into an extension reel, which is in the wall" }
};

const PC_CHAIN = [
  { key: "surge-into", what: "the surge protector",
    right: "wall",
    wrong: ["ups", "upsx", "strip2", "reel", "surge"],
    tell: "A surge protector is the first thing after the mains and it goes straight into the " +
      "wall. It has one job \\u2014 to clamp a spike to earth \\u2014 and it needs a short, direct path " +
      "to that earth to do it.",
    why: {
      ups: "Behind a UPS is backwards: the UPS is the thing you are trying to protect, and it " +
        "already has suppression of its own. You have also just put a strip's load on the battery.",
      upsx: "Closer, and still backwards. The surge-only outlets are downstream of the UPS's own " +
        "protection, so a strip there is a third layer doing the same job as the second.",
      strip2: "Daisy-chaining strips is specifically prohibited by every one of them, in the " +
        "instructions, because the second one's rating means nothing behind the first and the " +
        "joint is an unfused extension.",
      reel: "A reel is an extension lead, and a coiled one carrying load is also a heater. It " +
        "adds resistance in exactly the path the protector needs to be short.",
      surge: "Itself. That is the daisy chain again, said a different way."
    } },
  { key: "ups-into", what: "the UPS",
    right: "wall",
    wrong: ["surge", "strip2", "upsx", "reel", "ups"],
    tell: "Straight into the wall, and this is the one people get wrong. A UPS already contains " +
      "surge suppression, it draws a heavy inrush when it charges and when it transfers, and a " +
      "line-interactive unit is reading the mains waveform to decide when to switch \\u2014 all three " +
      "reasons say nothing goes between it and the outlet.",
    why: {
      surge: "This is the answer the original exercise marks correct, and every UPS manual says " +
        "not to do it. The strip's breaker is sized for a load rather than for a UPS's inrush, so " +
        "it trips on a self-test and drops everything the UPS was holding up.",
      strip2: "Two strips in front of it rather than one. Worse, for the same reasons, twice.",
      upsx: "Its own surge outlets are on its output. Plugging its input into its output is not a " +
        "chain, it is a loop.",
      reel: "An extension reel between the mains and a UPS adds resistance and, coiled under load, " +
        "heat. It is the sort of thing that works for a year and then does not.",
      ups: "Into another UPS. Two units in series fight each other \\u2014 each reads the other's " +
        "output as dirty mains and transfers, over and over."
    } }
];

/* The nine devices, exactly the owner's list, with the source each
   belongs on and the reason. */
const PC_DEVICES = [
  { key: "modem",   label: "Cable modem",   on: "ups",
    why: "No network, no remote shutdown and no way to tell anyone. Network gear belongs on the battery for the same reason the machine does." },
  { key: "pc",      label: "Computer",      on: "ups",
    why: "The whole reason a UPS is there: long enough to save what is open and shut down cleanly." },
  { key: "monitor", label: "Monitor",       on: "ups",
    why: "Somebody has to SEE the shutdown to do it by hand. On an unattended server the argument goes the other way, and this desk is attended." },
  { key: "router",  label: "Wi-Fi router",  on: "ups",
    why: "Same as the modem. A machine that survives while its network does not is usually no use." },
  { key: "printer", label: "Printer",       on: "surge",
    why: "NEVER on the battery. A laser's fuser draws a huge surge as it heats and can flatten the battery in seconds or trip the unit outright. It is expensive, so it gets surge protection \\u2014 and nothing more." },
  { key: "scanner", label: "Scanner",       on: "surge",
    why: "Expensive, and nothing is lost if it stops mid-page. Surge protection without spending any runtime on it." },
  { key: "fan",     label: "Fan",           on: "wall",
    why: "Nothing to protect and nothing to lose. Every watt on a protected outlet is a watt not available to something that matters." },
  { key: "lamp",    label: "Lamp",          on: "wall",
    why: "A bulb does not care about a spike and does not need to survive one." },
  { key: "clock",   label: "Clock / radio", on: "wall",
    why: "It loses the time. Somebody sets it again. That is the whole cost." }
];
const PC_SLOTS = [
  { key: "wall",  label: "Wall outlet" },
  { key: "surge", label: "Surge protector" },
  { key: "ups",   label: "UPS battery outlets" }
];

export function generate(seed) {
  const r = rng(seed);
  const customer = r.pick(CUSTOMERS);
  const job = r.pick(JOBS);
  const cpu = r.pick(CPUS);
  const gpu = job.key === "render" ? r.pick(GPUS.filter(function (g) { return g.watts >= 200; }))
                                   : r.pick(GPUS);
  const draw = cpu.watts + gpu.watts + BASE.board + BASE.ram + BASE.ssd + BASE.fans;
  const recommended = Math.ceil((draw * 1.4) / 50) * 50;

  /* The supply on the shelf. Sometimes genuinely too small — a lab where
     the first option always fits teaches nothing about headroom.

     But an undersized supply needs a machine big enough to undersize
     FOR. Supplies are not sold below about 250 W, and a 135 W machine
     with integrated graphics cannot be starved by one: the floor of the
     market is already ample for it. Four seeds in 240 were generated as
     "undersized" with a 250 W supply feeding a 135 W machine, which
     would have graded the honest answer — that it is fine — as wrong. */
  const canUndersize = draw > 350;
  const undersized = canUndersize && r.next() < 0.45;
  const fitted = undersized
    ? Math.max(250, Math.floor((draw * 0.85) / 50) * 50)
    : Math.max(550, Math.ceil((draw * 1.5) / 50) * 50);

  /* One rail is out of tolerance, and which one is generated so the
     symptom and the reading always agree. */
  const railFault = r.pick(["12v", "5v", "none"]);

  /* UPS sizing. VA against watts is the thing students get wrong. */
  const upsVA = r.pick([650, 900, 1200, 1500]);
  const pf = 0.6;                       /* typical consumer UPS power factor */
  const upsWatts = Math.round(upsVA * pf);
  const upsBatteryWh = Math.round(upsVA * 0.42);

  return {
    seed: seed, customer: customer, job: job, cpu: cpu, gpu: gpu,
    base: BASE, draw: draw, recommended: recommended,
    fitted: fitted, undersized: fitted < draw * 1.15,
    railFault: railFault,
    upsVA: upsVA, upsWatts: upsWatts, upsBatteryWh: upsBatteryWh,
    /* Runtime at the machine's real draw, in minutes. */
    upsMinutes: Math.round((upsBatteryWh / Math.max(1, draw)) * 60),
    said: r.shuffle(job.said.concat(r.some(NOISE, 2))),
    hasGpu: gpu.watts > 0
  };
}

function briefPanel(s) {
  return {
    kind: "brief",
    from: s.customer.who + " — " + s.customer.size,
    paragraphs: ["We need you to sort out the power for " + s.job.what + "."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

function loadPanel(s) {
  return {
    kind: "table", title: "What is in the machine",
    columns: ["Part", "Peak draw"],
    rows: [
      { cells: ["CPU — " + s.cpu.label, s.cpu.watts + " W"] },
      { cells: ["Graphics — " + s.gpu.label, s.gpu.watts + " W"] },
      { cells: ["Motherboard", s.base.board + " W"] },
      { cells: ["Memory", s.base.ram + " W"] },
      { cells: ["SSD", s.base.ssd + " W"] },
      { cells: ["Fans", s.base.fans + " W"] }
    ],
    note: "Peak, not average. A supply has to cope with everything drawing at once, which is exactly when a game or a render starts."
  };
}

/* The rails, and what the meter says on each. One may be out. */
function railPoints(s) {
  const bad = s.railFault;
  return [
    { key: "12v", label: "+12 V rail", sub: "yellow wire",
      reading: bad === "12v" ? "10.6 V" : "12.1 V",
      expected: "11.4 to 12.6 V", bad: bad === "12v" },
    { key: "5v", label: "+5 V rail", sub: "red wire",
      reading: bad === "5v" ? "4.4 V" : "5.02 V",
      expected: "4.75 to 5.25 V", bad: bad === "5v" },
    { key: "33v", label: "+3.3 V rail", sub: "orange wire",
      reading: "3.31 V", expected: "3.14 to 3.47 V", bad: false },
    { key: "pg", label: "Power Good", sub: "grey wire",
      reading: bad === "none" ? "5.0 V, asserted" : "5.0 V, asserted",
      expected: "asserted within 500 ms of power-on", bad: false }
  ];
}

/* ---------------------------------------------------------------------
   The live supply for the cable, load and meter stages.

   All three look at the same machine, so they share one view builder and
   differ only in what is plugged in and whether a probe is on a rail.
   The numbers come from the scenario, never recomputed here — there is
   one copy of the arithmetic and it is the generator's.
   --------------------------------------------------------------------- */
function powerView(s, opts) {
  opts = opts || {};
  const sockets = {};
  SOCKETS.forEach(function (k) {
    if (k.key === "gpu" && !s.hasGpu) { sockets[k.key] = "na"; return; }
    sockets[k.key] = opts.wired ? "ok" : "open";
  });
  /* On the load stage the machine is fully cabled; on the meter stage the
     EPS is deliberately left showing as connected, because the fault being
     hunted there is electrical rather than a missing plug. */
  if (opts.leaveOpen) sockets[opts.leaveOpen] = "missing";

  return {
    sockets: sockets,
    drawW: s.draw,
    suppliedW: s.fitted,
    /* Sensible headroom: the generator's own recommendation, which is what
       the budget stage grades against. Using a different rule here would
       let the picture and the marking disagree. */
    headroomW: s.recommended,
    probe: opts.probe || null
  };
}

function powerPanel(s, opts) {
  const v = powerView(s, opts);
  /* THE FAULT IS THE SUPPLY, NOT THE DRAW.

     This compared draw against `recommended` and so never fired once in
     240 seeds — the generator derives `recommended` FROM the draw, so it
     is always the larger of the two by construction. The real fault is a
     supply fitted below what the build wants, which is exactly what the
     scenario already records. */
  const over = s.fitted < s.recommended;
  const railFault = s.railFault;

  return {
    kind: "bench",
    title: opts && opts.probe ? "The supply, with a meter on it" : "The supply and its loom",
    intro: opts && opts.probe
      ? "The probes are on the 24-pin. A rail is in spec within five per cent of nominal \u2014 " +
        "outside that, the number is the fault."
      : "Every socket below is a control. The bar along the bottom is the supply's capacity, " +
        "filled to what this machine actually draws.",
    height: 420,
    bench: {
      spec: function () { return powerBench(v); },
      status: function () {
        if (opts && opts.probe) {
          const r = RAILS.filter(function (x) { return x.key === opts.probe; })[0];
          const bad = railFault === opts.probe;
          return bad
            ? { words: "Out of spec", tone: "urgent",
                detail: "The " + (r ? r.label : opts.probe) + " rail is outside five per cent. " +
                  "That is not a measurement error and it is not a setting." }
            : { words: "In spec", tone: "calm",
                detail: (r ? r.label : opts.probe) + " is within five per cent of nominal." };
        }
        return over
          ? { words: "Supply undersized", tone: "urgent",
              detail: s.draw + " W drawn on a " + s.fitted + " W supply, and this build wants " +
                s.recommended + " W. It will boot. It will not stay up under load." }
          : { words: "Within budget", tone: "calm",
              detail: s.draw + " W drawn, " + s.fitted + " W fitted, " + s.recommended +
                " W recommended." };
      },
      controls: function () {
        return SOCKETS.filter(function (k) { return s.hasGpu || k.key !== "gpu"; })
          .map(function (k) {
            return {
              key: k.key,
              label: k.label,
              state: v.sockets[k.key],
              stateWords: socketWords(v.sockets[k.key]),
              detail: k.sub
            };
          });
      },
      onAction: function () { return {}; }
    }
  };
}

export function buildStage(key, s) {

  if (key === "brief") {
    return {
      title: "What does this machine have to survive?",
      intro: "Power is three separate questions — enough of it, delivered properly, and what happens when it stops.",
      panels: [briefPanel(s)],
      questions: [{
        key: "pw-brief", kind: "multi",
        prompt: "Which of these did they actually tell you?",
        detail: "Two of these are the job. The rest is conversation.",
        hints: [
          "Read the quotes for things that describe how the machine BEHAVES or what it has to keep doing. Ignore anything about deadlines or the electrician.",
          "A power requirement is one of: how much it draws, how clean the supply is, or what has to happen when the mains goes away."
        ],
        options: [
          { key: "brown", label: "It loses work when the mains flickers", correct: s.job.key === "reception",
            why: s.job.key === "reception"
              ? "Yes — rebooting on a flicker is a power quality problem, and it points straight at what they need."
              : "Nobody mentioned flickering here." },
          { key: "load", label: "It shuts itself off part-way through heavy work", correct: s.job.key === "render",
            why: s.job.key === "render"
              ? "Yes — and that symptom is nearly diagnostic on its own. Note it now."
              : "Nothing in the brief describes it dying under load." },
          { key: "clean", label: "It has to shut down cleanly rather than just stopping", correct: s.job.key === "server",
            why: s.job.key === "server"
              ? "Yes — that needs more than a battery. Something has to tell the machine to shut down."
              : "They did not ask for a managed shutdown here." },
          { key: "draw", label: "Its peak draw is about " + s.draw + " W", correct: true,
            why: "Yes — this comes from the parts list rather than the conversation, and everything else depends on it." },
          { key: "insure", label: "It must be done before the insurance inspection", correct: false,
            why: "A deadline. It changes nothing about what you specify." }
        ],
        explain: "Draw, quality, and what happens when it stops. Those are the three, and they need different answers."
      }]
    };
  }

  if (key === "budget") {
    return {
      title: "Add it up and choose a supply",
      intro: "Every number you need is on the table. The mistake to avoid is sizing to the total rather than above it.",
      panels: [loadPanel(s)],
      questions: [
        { key: "pw-draw", kind: "number",
          prompt: "Total peak draw of these parts?",
          unit: "W", answer: s.draw, tolerance: 0,
          hints: ["Add the six figures in the table. Nothing is hidden.",
                  "Include everything, including the small ones — the board, memory, drive and fans together are not nothing."],
          explain: s.cpu.watts + " + " + s.gpu.watts + " + " + s.base.board + " + " + s.base.ram + " + " +
            s.base.ssd + " + " + s.base.fans + " = " + s.draw + " W." },
        { key: "pw-psu", kind: "number",
          prompt: "Supply size, allowing 40% headroom over that peak?",
          unit: "W", answer: s.recommended, tolerance: 50,
          hints: [
            "Headroom means the supply is that much BIGGER than the peak, not that the peak includes it.",
            "Multiply the peak by 1.4, then round up to a size supplies are actually sold in — they come in 50 W steps."
          ],
          explain: s.draw + " W × 1.4 = " + Math.round(s.draw * 1.4) + " W → " + s.recommended + " W. " +
            "Headroom is not waste. A supply is least efficient and least reliable at its ceiling, and capacitors age." }
      ]
    };
  }

  if (key === "cable") {
    const loom = rng(s.seed + 709).pick(LOOM_CASES);
    const sockets = SOCKETS.filter(function (k) { return s.hasGpu || k.key !== "gpu"; });
    return {
      title: "Cable it",
      intro: "Pick a connector, then click where it goes. Anything that does not belong will stop you, the way the physical key would.",
      panels: [{
        kind: "note", title: "On the bench",
        paragraphs: ["The " + s.fitted + " W supply is mounted and its loom is hanging loose. " +
          (s.hasGpu ? "There is a graphics card in the top slot." : "Graphics are on the CPU, so there is no card to feed.")]
      }, connPanel(function () { return psuBench({}); }, {
        title: "What is on the end of that loom",
        intro: "Drawn at 1 unit = 1 mm, so the sizes are real. What separates them is KEYING "
          + "\u2014 the shape of the sockets and the outline \u2014 and the pair that matters is "
          + "EPS against PCIe: the same size, keyed so they will not mate, and they come apart "
          + "differently.",
        height: 420,
        words: "Five connectors, nothing plugged",
        detail: "If a connector needs force, it is the wrong connector. The keying is doing "
          + "its job."
      })],
      questions: [{
        key: "pw-loom", kind: "choice",
        prompt: "Before wiring this one \u2014 another bench reports: \u201c" + loom.said
          + "\u201d What is it?",
        hints: [
          "Read what still WORKS. A machine that runs until it is loaded, or drives that all "
            + "died together, is telling you where to look.",
          "Two connectors on that loom are the same size as each other and keyed so they will "
            + "not mate. How they COME APART is the reliable tell: one splits 6 + 2, the other "
            + "splits 4 + 4.",
          "Three options here blame a whole component \u2014 the supply, the board, the front "
            + "panel header. Before any of those, ask whether a connector is fully home, on the "
            + "right socket, and carrying every pin it should."
        ],
        options: connPool(LOOM_OPTS, loom.key, loom.tell, s.seed + 709),
        explain: loom.tell
      }, {
        key: "pw-wire", kind: "wire",
        prompt: "Connect every socket the machine needs.",
        detail: "Wrong pairings are refused with the reason. Click a filled socket to unplug it.",
        commitLabel: "Power it on",
        hints: [
          "Work from the biggest connector down. Each one has a distinctive shape, and the sub-label under each socket tells you how many pins it wants and roughly where it is.",
          "Two of these look almost identical and are the classic mix-up: both are eight pins, but one feeds the CPU at the top of the board and the other feeds the card. The pin shapes differ."
        ],
        items: Object.keys(CONNECTORS)
          .filter(function (k) { return s.hasGpu || CONNECTORS[k].fits !== "gpu"; })
          .map(function (k) {
            return { key: k, label: CONNECTORS[k].label, sub: CONNECTORS[k].sub };
          }),
        slots: sockets,
        /* Called at the moment of connection. Refusing here, with the
           reason, is where the learning happens. */
        accepts: function (connKey, sockKey) {
          const c = CONNECTORS[connKey];
          if (c.fits === sockKey) return { ok: true, why: "Seated, and it only goes in one way round." };
          return { ok: false, why: c.wrong };
        },
        check: function (wired) {
          const need = sockets.map(function (x) { return x.key; });
          const missing = need.filter(function (k) { return !wired[k]; });
          if (missing.length) {
            return { ok: false, why: "It will not start — " + missing.length + " socket" +
              (missing.length === 1 ? " is" : "s are") + " still empty. Nothing on this list is optional." };
          }
          return { ok: true, why: "It powers up. Every rail has somewhere to go and the board sees a complete machine." };
        },
        explain: "The 24-pin and the CPU's EPS are both mandatory — a board with only the 24-pin usually does nothing at all. " +
          "EPS and PCIe are the pair that get forced into each other."
      }]
    };
  }

  if (key === "load") {
    return {
      title: "Run it hard",
      intro: "It booted. That proves almost nothing — the interesting question is what happens when everything draws at once.",
      panels: [powerPanel(s, { wired: true }), {
        kind: "table", title: "What happened",
        columns: ["", ""],
        rows: [
          { cells: ["Supply fitted", s.fitted + " W"] },
          { cells: ["Peak draw of the machine", s.draw + " W"] },
          { cells: ["At the desktop, idle", "Stable"] },
          { cells: ["Thirty seconds into a full load",
                    s.undersized ? "Shuts off instantly, no warning, no error" : "Stable"],
            flag: s.undersized ? "bad" : null }
        ]
      }],
      questions: [{
        key: "pw-load", kind: "choice",
        prompt: "What do those two lines tell you?",
        hints: [
          "Compare the supply's rating with the peak draw, and note WHEN the machine failed rather than that it failed.",
          "A fault that appears only under load has already survived every test that happens at boot. Very few things behave that way."
        ],
        options: [
          { key: "under", label: "The supply cannot deliver peak current, so it shuts down to protect itself",
            correct: s.undersized,
            why: s.undersized
              ? "Right. " + s.fitted + " W against a " + s.draw + " W peak. It is fine until everything draws at once, and then the protection trips."
              : "It is not undersized — " + s.fitted + " W against a " + s.draw + " W peak is comfortable, and it stayed up." },
          { key: "fine", label: "The supply is adequately sized and the machine is stable", correct: !s.undersized,
            why: !s.undersized
              ? "Right. " + s.fitted + " W against " + s.draw + " W peak, and it held through full load."
              : "It is not. " + s.fitted + " W cannot serve a " + s.draw + " W peak, which is why it dropped." },
          { key: "heat", label: "The CPU is overheating and shutting down", correct: false,
            why: "Thermal shutdown is not instant — the chip throttles first, for a long time, and it usually logs the event. This machine simply stops." },
          { key: "ram", label: "The memory is faulty", correct: false,
            why: "Bad memory gives crashes, corruption and blue screens. It does not switch the machine off cleanly at the wall." }
        ,
            /* Two near misses that both describe a HEALTHY supply in
               other words, so they are only wrong if you read what the
               two lines actually did. */
            { key: "eff", label: "The supply is highly efficient \u2014 that is why the rails barely move",
              correct: false,
              why: "Regulation and efficiency are two different specifications. Regulation is how " +
                "little the rail moves under load, which is what these lines show; efficiency is " +
                "how much of the wall power reaches the board rather than becoming heat. A supply " +
                "can be superb at one and poor at the other." },
            { key: "cable", label: "One of the power cables has a poor connection",
              correct: false,
              why: "That would show as a rail that sags under load and recovers when it eases \u2014 " +
                "and it would sag on ONE rail, not evenly. Look at whether these lines move at all " +
                "before blaming a connection." }
          ],
        explain: s.undersized
          ? "Undersized. Fine at idle, dead under load — the signature. This is what the 40% headroom was for."
          : "Correctly sized, with real headroom. That headroom is why it stayed up."
      }]
    };
  }

  if (key === "meter") {
    const pts = railPoints(s);
    const bad = pts.filter(function (p) { return p.bad; })[0];
    return {
      title: "Put a meter on it",
      intro: "Guessing at a supply is expensive. Measuring takes two minutes.",
      panels: [powerPanel(s, { wired: true, probe: s.railFault || "12v" }), {
        kind: "note", title: "How to do this safely",
        paragraphs: [
          "The supply is connected and the machine is running. You are backprobing the connector with the machine on — black lead on any bare chassis metal, red lead into the back of the pin you want.",
          "Never open a power supply. The capacitors inside hold a lethal charge long after it is unplugged, and there is nothing user-serviceable in there."
        ]
      }],
      questions: [{
        key: "pw-meter", kind: "probe",
        instrument: "Multimeter — DC volts",
        prompt: "Read all four test points.",
        detail: "Click a test point to put the probe on it.",
        hints: [
          "Compare each reading against the expected range shown under it. Three of the four are inside their range.",
          "Tolerances are wider than people expect — roughly ±5% on each rail. A reading is only a fault when it falls outside that, not when it is merely not exact."
        ],
        points: pts,
        then: {
          kind: "choice",
          prompt: "What have you got?",
          hints: [
            "One reading fell outside its expected range, or none did. Go back over the four.",
            "A rail that sags below tolerance cannot hold up whatever hangs off it — and the +12 V rail is the one that feeds the CPU and the graphics card."
          ],
          options: [
            { key: "12v", label: "The +12 V rail is low and out of tolerance", correct: s.railFault === "12v",
              why: s.railFault === "12v"
                ? "Right — 10.6 V against a 11.4 V floor. That rail feeds the CPU and the card, which is why it fails under load."
                : "The +12 V read 12.1 V, comfortably inside 11.4 to 12.6." },
            { key: "5v", label: "The +5 V rail is low and out of tolerance", correct: s.railFault === "5v",
              why: s.railFault === "5v"
                ? "Right — 4.4 V against a 4.75 V floor. Low enough to make drives and USB behave strangely."
                : "The +5 V read 5.02 V, which is almost exactly nominal." },
            { key: "none", label: "Every rail is within tolerance — the supply is not the problem", correct: s.railFault === "none",
              why: s.railFault === "none"
                ? "Right. All four inside their ranges, so whatever is wrong is somewhere else. Ruling the supply out is a real result."
                : "One of them is not. Check each reading against the range printed under it." },
            { key: "pg", label: "Power Good is not being asserted", correct: false,
              why: "It read 5.0 V and asserted. If Power Good were missing the machine would not start at all." }
          ,
            /* Two more conclusions a technician genuinely draws from four
               rail readings, and both are wrong in an instructive way. */
            { key: "ripple", label: "The rails are in range but the ripple is out of spec",
              correct: false,
              why: "A real failure mode and a real reason to condemn a supply \u2014 and a " +
                "multimeter cannot see it. Ripple is AC riding on the DC and it takes a scope. " +
                "Do not conclude something your instrument cannot measure." },
            { key: "meter", label: "The readings are unreliable \u2014 the meter needs zeroing",
              correct: false,
              why: "Doubting the instrument is a good habit when ONE reading looks impossible. " +
                "When the others come back exactly where they should, the meter is fine and the " +
                "odd reading is the finding." }
          ],
          explain: s.railFault === "none"
            ? "Nothing wrong here. Ruling a component OUT with evidence is as useful as finding the fault."
            : "A rail outside tolerance is a failing supply. Replace it — never open it."
        }
      }]
    };
  }

  if (key === "ups") {
    return {
      title: "Size the UPS",
      intro: "The number on the box is VA. The number that matters is watts, and they are not the same.",
      panels: [{
        kind: "table", title: "The unit they were quoted",
        columns: ["", ""],
        rows: [
          { cells: ["Rating on the box", s.upsVA + " VA"] },
          { cells: ["Power factor", s.pf || "0.6"] },
          { cells: ["Usable battery energy", s.upsBatteryWh + " Wh"] },
          { cells: ["Machine's peak draw", s.draw + " W"] }
        ],
        note: "VA is volts × amps. Watts is the real work done. The gap between them is the power factor, and consumer units run about 0.6."
      }, connPanel(function () { return psuBench({ show: "ups" }); }, {
        title: "The back of the unit they were quoted",
        intro: "Two banks of sockets, inches apart, identical to look at. One holds up when "
          + "the mains fails and one is only protected against spikes — and every plug you "
          + "own fits both of them.",
        height: 420,
        words: "Nothing plugged in yet",
        detail: "The number you are about to calculate is the BATTERY row's budget. Nothing "
          + "on the surge-only row spends any of it, and nothing on it survives a cut either."
      })],
      questions: [
        { key: "ups-w", kind: "number",
          prompt: "What can this UPS actually deliver, in watts?",
          unit: "W", answer: s.upsWatts, tolerance: 5,
          hints: [
            "The two numbers you need are the rating and the power factor, both in the table.",
            "Watts is VA multiplied by the power factor. This is the single most common mistake in sizing a UPS — people read VA as if it were watts and buy something 40% too small."
          ],
          explain: s.upsVA + " VA × 0.6 = " + s.upsWatts + " W. Buying on the VA number alone gets you a unit that cannot carry the load." },
        { key: "ups-min", kind: "number",
          prompt: "Roughly how many minutes would it run this machine?",
          unit: "minutes", answer: s.upsMinutes, tolerance: Math.max(1, Math.round(s.upsMinutes * 0.25)),
          hints: [
            "You have the stored energy in watt-hours and the draw in watts.",
            "Watt-hours divided by watts gives you hours. The question asks for minutes."
          ],
          explain: s.upsBatteryWh + " Wh ÷ " + s.draw + " W = " + (s.upsBatteryWh / s.draw).toFixed(2) +
            " hours ≈ " + s.upsMinutes + " minutes. A UPS buys you a clean shutdown, not a working afternoon." }
      ]
    };
  }


  if (key === "chain") {
    const link = rng(s.seed + 601).pick(PC_CHAIN);
    const chainQ = {
      key: "pc-chain", kind: "choice",
      prompt: "What does " + link.what + " plug into?",
      hints: [
        "Work out what each box in the chain is FOR, then ask what has to be between it and the " +
          "mains for it to do that job. On both of these the answer is nothing.",
        "One of these devices contains surge suppression already and draws a heavy inrush when it " +
          "charges. Putting a strip in front of that is not more protection, it is a breaker " +
          "waiting to trip."
      ],
      options: rng(s.seed + 607).shuffle([link.right].concat(link.wrong).map(function (k) {
        return { key: k, label: PC_SOURCES[k].label, correct: k === link.right,
          why: k === link.right ? link.tell : link.why[k] };
      })),
      explain: link.tell
    };

    const items = PC_DEVICES.map(function (d) { return { key: d.key, label: d.label }; });
    const sortQ = {
      key: "pc-sort", kind: "assign",
      prompt: "Put each device on the source it belongs on.",
      detail: "Nine devices, three sources. Click a device, then click a source.",
      hints: [
        "Sort them by what actually happens when the power goes off. Some things must finish, " +
          "some things merely cost money to replace, and some things nobody would notice.",
        "One item on this list must NEVER go on the battery whatever else is true \\u2014 it draws a " +
          "surge as it heats that a UPS cannot supply."
      ],
      items: items,
      slots: PC_SLOTS,
      /* An assign slot holds one item, and this needs nine items across
         three slots — so the check reads the placement map directly
         rather than expecting one item per slot. */
      multi: true,
      check: function (filled) {
        const placed = Object.keys(filled).length;
        if (placed < PC_DEVICES.length) {
          return { ok: false, why: (PC_DEVICES.length - placed) + " device" +
            (PC_DEVICES.length - placed === 1 ? " is" : "s are") + " still on the bench." };
        }
        const bad = PC_DEVICES.filter(function (d) { return filled[d.key] !== d.on; })[0];
        if (bad) {
          const slot = PC_SLOTS.filter(function (x) { return x.key === filled[bad.key]; })[0];
          return { ok: false, why: bad.label + " is on the " +
            (slot ? slot.label.toLowerCase() : "wrong source") + ". " + bad.why };
        }
        return { ok: true, why: "Battery for what has to finish or shut down cleanly, surge for " +
          "what is only expensive, and the wall for what does not care. And the printer nowhere " +
          "near the battery." };
      },
      explain: PC_SLOTS.map(function (sl) {
        return sl.label + ": " + PC_DEVICES.filter(function (d) { return d.on === sl.key; })
          .map(function (d) { return d.label; }).join(", ") + ".";
      }).join("  ")
    };

    return {
      title: "What plugs into what, and what goes where",
      intro: "Two questions that look like housekeeping and are not. One of them is the difference " +
        "between a UPS that works and a UPS that drops its load every time it tests itself.",
      panels: [{
        kind: "note", title: "On this desk",
        paragraphs: [
          "A wall outlet, a surge protector and a UPS, and nine things that need power: a cable " +
            "modem, a computer, a monitor, a printer, a scanner, a Wi-Fi router, a fan, a lamp " +
            "and a clock radio.",
          "The UPS is a line-interactive unit with battery outlets on one side and surge-only " +
            "outlets on the other."
        ]
      }, {
        kind: "bench", height: 400,
        bench: {
          spec: function () {
            return outletBench({
              devices: PC_DEVICES.map(function (d) { return { key: d.key, label: d.label }; }),
              /* Read live from the sorting question, so the room fills up
                 as the student works. It shows WHERE things have been put
                 and never whether that was right. */
              placed: (sortQ.fitState && sortQ.fitState.placed) || {}
            });
          },
          status: function () {
            const n = Object.keys((sortQ.fitState && sortQ.fitState.placed) || {}).length;
            return { tone: n ? "calm" : "idle",
              words: n === PC_DEVICES.length ? "All nine placed" : n + " of nine placed",
              detail: "The two protectors have their leads coiled beside them. Where those leads " +
                "go is the first question, and nothing on the bench answers it." };
          },
          controls: function () { return []; },
          onAction: function () { return {}; }
        }
      }, {
        kind: "note", title: "Worth knowing",
        paragraphs: [
          "The original exercise this came from marks “the UPS plugs into the surge protector” " +
            "as correct. Every UPS manual says the opposite, and so does this stage. A UPS goes " +
            "straight into the wall: it has suppression of its own, it draws an inrush a strip's " +
            "breaker is not sized for, and a line-interactive unit needs to read the mains " +
            "waveform without a clamping circuit in the way."
        ]
      }],
      questions: [chainQ, sortQ]
    };
  }

  if (key === "protect") {
    const up = rng(s.seed + 829).pick(UPS_CASES);
    return {
      title: "What goes on battery, and what does not",
      intro: "A UPS has limited battery. Putting the wrong things on it wastes the runtime you just calculated.",
      panels: [{
        kind: "note", title: "In this room",
        paragraphs: ["The machine, its monitor, a network switch, a laser printer, a desk lamp, and an external drive used for backups."]
      }, connPanel(function () { return psuBench({ show: "ups" }); }, {
        title: "Where those things are going to be plugged in",
        intro: "The decision you are about to make is a decision about WHICH ROW, and the "
          + "hardware gives you almost nothing to go on: a moulded ridge between the banks "
          + "and small print above them. That is the whole signal, and it is why this is the "
          + "commonest silent fault in the room.",
        height: 420,
        words: "Two banks, four sockets each",
        detail: "A UPS wired wrong passes every test it can run on itself. Its self-test "
          + "checks the battery, not what is plugged into it — so the lights stay green and "
          + "nothing at all is held up in a cut."
      })],
      questions: [{
        key: "pt-what", kind: "multi",
        prompt: "Which of these belong on the battery outlets?",
        detail: "Everything else can go on surge-only.",
        hints: [
          "Ask what must keep running long enough to shut down cleanly, and what would simply be inconvenient to lose for a moment.",
          "One item on this list must NEVER go on a UPS — it draws a huge surge and would flatten the battery or trip the unit outright."
        ],
        options: [
          { key: "pc", label: "The machine itself", correct: true,
            why: "Yes — this is the whole point. It needs long enough to close files and shut down." },
          { key: "drive", label: "The external backup drive", correct: true,
            why: "Yes — a drive that loses power mid-write can corrupt the backup, which is the one copy you were relying on." },
          { key: "switch", label: "The network switch", correct: true,
            why: "Yes, if the shutdown signal or the backup travels over the network. A machine that survives while its network does not is often no use." },
          { key: "printer", label: "The laser printer", correct: false,
            why: "Never. A laser's fuser draws a huge surge as it heats — it can flatten the battery in seconds or trip the UPS. This is the classic wrong answer." },
          { key: "lamp", label: "The desk lamp", correct: false,
            why: "Nothing is lost if the lamp goes off. Every watt on the battery shortens the runtime for the things that matter." },
          { key: "mon", label: "The monitor", correct: false,
            why: "Arguable, but usually not — an unattended shutdown does not need a picture, and a monitor is a large share of the load." }
        ],
        explain: "Battery for what must finish or shut down cleanly. Surge-only for the rest. Never a laser printer."
      }, {
        /* SIX UPS CALLS, AND FOUR OF THEM ARE WIRING RATHER THAN
           HARDWARE. "The UPS did not work" is one sentence covering a
           lead moved one row down, a printer on the battery bank, a
           tripped breaker, a unit bought on the wrong number, a strip
           in front of it, and — only sometimes — a battery that has
           genuinely aged out. Replacing the unit fixes one of the six. */
        key: "pt-ups", kind: "choice",
        prompt: "A call from another site: “" + up.said + "” What has happened?",
        hints: [
          "Ask whether BOTH rows are affected or only one. A unit with nothing at all coming "
            + "out of it has lost its input; a unit that works until the mains fails has its "
            + "load in the wrong bank.",
          "Then ask whether the shortfall is CONSTANT or tied to an event. Something that has "
            + "always been too small, and something that was fine until a particular device "
            + "woke up, are different faults with the same complaint.",
          "Two of the six are not the UPS at all — the machine's own supply and the wall "
            + "outlet. Neither survives the report: a dead outlet takes the UPS with it, and a "
            + "failed supply in the machine would behave exactly the same on any socket in "
            + "the building, including the one it is in now."
        ],
        options: connPool(UPS_OPTS, up.key, up.tell, s.seed + 829),
        explain: up.tell
      }]
    };
  }

  if (key === "mains") {
    const mn = rng(s.seed + 787).pick(MAINS_CASES);
    return {
      title: "115, 230, and the little red switch",
      intro: "Older supplies have a voltage selector. Getting it wrong is one of the few mistakes in this trade that is instantly destructive.",
      panels: [connPanel(function () {
        return psuBench({ show: "rear", set230: false, on: false });
      }, {
        title: "The back of the supply, and everything printed on it",
        intro: "The red switch changes what the supply expects from the wall; the black rocker "
          + "turns it on. They sit inches apart. Read the two numbers beside the selector, the "
          + "range on the plate, and the warning underneath it.",
        height: 440,
        tone: "warn",
        words: "Selector at 115, rocker at O",
        detail: "A box marks which voltage it is SET to, because a switch thrown the wrong way "
          + "is still a red switch. The rocker is pressed at O, so the supply is isolated "
          + "\u2014 though the lead is still live up to the switch."
      }), {
        kind: "note", title: "What the switch does",
        paragraphs: [
          "A supply with a manual selector is wired internally for one input range or the other. It does not detect anything — it does what the switch says.",
          "Most modern supplies are auto-ranging and have no switch at all. If there is a switch, somebody has to set it, and that somebody is you."
        ]
      }],
      questions: [{
        key: "mn-read", kind: "choice",
        prompt: "\u201c" + mn.said + "\u201d What does the back of that supply tell you?",
        hints: [
          "Everything you need is PRINTED on the panel. Read the two numbers beside the switch, "
            + "then the input range on the plate, then the warning.",
          "One direction of this mistake is destructive and immediate; the other simply will "
            + "not start and harms nothing. Work out which way round the case describes before "
            + "deciding how bad it is.",
          "A supply with no selector is not one somebody forgot to set \u2014 a single wide input "
            + "range on the plate means it ranges automatically. And two options here treat a "
            + "fuse or a surge protector as if either changed what the supply expects from the "
            + "wall. Neither does."
        ],
        options: connPool(MAINS_OPTS, mn.key, mn.tell, s.seed + 787),
        explain: mn.tell
      }, {
        key: "mn-switch", kind: "choice",
        prompt: "A supply set to 115 V is plugged into a 230 V outlet. What happens?",
        hints: [
          "The supply is expecting a certain input and is built for it. Ask what happens when it receives twice that.",
          "Consider which direction is destructive and which is merely useless. The two failures are not symmetrical."
        ],
        options: [
          { key: "bang", label: "It fails immediately, usually with a bang, and often takes components with it", correct: true,
            why: "Right. Twice the expected input into circuitry built for half of it. This is the destructive direction, and it is instant." },
          { key: "nothing", label: "Nothing — it runs slightly warmer", correct: false,
            why: "It is not a small overload. Double the design input destroys it." },
          { key: "wont", label: "It simply will not start", correct: false,
            why: "That is the OTHER direction: a supply set to 230 V on a 115 V outlet is starved and may not start, which is harmless by comparison." },
          { key: "auto", label: "It switches itself over automatically", correct: false,
            why: "If it had a switch, it does not auto-range. That is exactly what the switch is for." }
        ,
            /* Two near misses built on protection circuits that a
               student reasonably assumes are there. Both are wrong for
               the same reason, and it is the reason worth learning: the
               voltage selector is a physical link, not a sensor. */
            { key: "fuse", label: "The fuse blows and protects everything downstream",
              correct: false,
              why: "The fuse is there to stop a fire, not to save the electronics. It blows on " +
                "sustained overcurrent, thousands of times slower than the primary switching " +
                "components fail. It will very likely go \u2014 afterwards." },
            { key: "ovp", label: "Its over-voltage protection shuts it down safely",
              correct: false,
              why: "The strongest wrong answer here, because supplies do have over-voltage " +
                "protection \u2014 on their OUTPUT rails, guarding the board. The 115/230 selector " +
                "is a mechanical link that reconfigures the input as a voltage doubler. There is " +
                "nothing sensing the input to object." }
          ],
        explain: "115 set into 230 destroys it. 230 set into 115 just will not run. Check the switch before the plug goes in — every time."
      }]
    };
  }

  throw new Error("lab-power: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js. */
export function selfCheck(sc) {
  const bad = [];

  /* ---- chain --------------------------------------------------------
     Both halves are tables rather than generated, so what can go wrong
     is a key that does not resolve and a reason that was never written —
     and a wrong option with no reason is the narrowing rung with nothing
     to narrow with. */
  PC_CHAIN.forEach(function (link) {
    if (!PC_SOURCES[link.right]) bad.push("chain link " + link.key + " answers \"" + link.right + "\", which is not a source");
    if (link.wrong.length !== 5) bad.push("chain link " + link.key + " offers " + link.wrong.length + " wrong sources, not five");
    if (link.wrong.indexOf(link.right) >= 0) bad.push("chain link " + link.key + " lists its own answer among the wrong ones");
    link.wrong.forEach(function (k) {
      if (!PC_SOURCES[k]) bad.push("chain link " + link.key + " names \"" + k + "\", which is not a source");
      if (!link.why[k]) bad.push("chain link " + link.key + " has no reason for rejecting \"" + k + "\"");
    });
  });
  /* THE ONE THAT MATTERS. Both protectors go straight into the wall, and
     the whole reason this stage exists is that the source sim says the
     UPS goes behind a strip. If somebody ever "corrects" this back, the
     stage would be teaching the thing it was written to fix. */
  const upsLink = PC_CHAIN.filter(function (l) { return l.key === "ups-into"; })[0];
  if (!upsLink) bad.push("the UPS link is missing from the chain");
  else if (upsLink.right !== "wall") {
    bad.push("the UPS is answered \"" + upsLink.right + "\" rather than the wall \u2014 this stage " +
      "exists because the source sim gets that wrong, and every UPS manual says straight to the outlet");
  }
  /* Every device must land on a source that exists, and the printer must
     never be on the battery. */
  PC_DEVICES.forEach(function (d) {
    if (!PC_SLOTS.some(function (sl) { return sl.key === d.on; })) {
      bad.push("device " + d.key + " belongs on \"" + d.on + "\", which is not one of the three sources");
    }
    if (!d.why) bad.push("device " + d.key + " has no reason");
  });
  const printer = PC_DEVICES.filter(function (d) { return d.key === "printer"; })[0];
  if (printer && printer.on === "ups") {
    bad.push("the printer is answered onto the battery \u2014 a laser's fuser is the classic thing " +
      "that must never be on a UPS, and this build says so in two other places");
  }
  PC_SLOTS.forEach(function (sl) {
    if (!PC_DEVICES.some(function (d) { return d.on === sl.key; })) {
      bad.push("nothing at all belongs on the " + sl.label + ", so it is a slot that is always wrong");
    }
  });
  if (sc.draw <= 0) bad.push("draw is not positive");
  if (sc.recommended < sc.draw) bad.push("recommended supply is below the draw it must serve");
  /* The undersized flag has to agree with the numbers, or the load
     stage grades the right answer wrong. */
  if (sc.undersized !== (sc.fitted < sc.draw * 1.15)) bad.push("undersized flag disagrees with the numbers");
  if (sc.undersized && sc.fitted >= sc.draw) bad.push("marked undersized but the supply covers the peak");
  if (sc.undersized && sc.draw <= 350) bad.push("marked undersized on a machine too small to undersize for");
  if (!sc.undersized && sc.fitted < sc.draw) bad.push("marked adequate but the supply is below the peak");
  if (["12v", "5v", "none"].indexOf(sc.railFault) < 0) bad.push("rail fault \"" + sc.railFault + "\" is not one of the three");
  if (sc.upsWatts >= sc.upsVA) bad.push("UPS watts is not below its VA rating — the power factor has been lost");
  if (sc.upsMinutes <= 0) bad.push("UPS runtime is not positive");
  /* A render box must have a card to be undersized FOR. */
  if (sc.job.key === "render" && !sc.hasGpu) bad.push("render job generated with no graphics card");
  return bad;
}

export function variantKey(sc) { return sc.job.key + "/" + (sc.undersized ? "under" : "ok") + "/" + sc.railFault; }
