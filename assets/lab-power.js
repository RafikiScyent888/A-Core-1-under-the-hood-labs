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
    const sockets = SOCKETS.filter(function (k) { return s.hasGpu || k.key !== "gpu"; });
    return {
      title: "Cable it",
      intro: "Pick a connector, then click where it goes. Anything that does not belong will stop you, the way the physical key would.",
      panels: [{
        kind: "note", title: "On the bench",
        paragraphs: ["The " + s.fitted + " W supply is mounted and its loom is hanging loose. " +
          (s.hasGpu ? "There is a graphics card in the top slot." : "Graphics are on the CPU, so there is no card to feed.")]
      }],
      questions: [{
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
      panels: [{
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
      panels: [{
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
      }],
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

  if (key === "protect") {
    return {
      title: "What goes on battery, and what does not",
      intro: "A UPS has limited battery. Putting the wrong things on it wastes the runtime you just calculated.",
      panels: [{
        kind: "note", title: "In this room",
        paragraphs: ["The machine, its monitor, a network switch, a laser printer, a desk lamp, and an external drive used for backups."]
      }],
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
      }]
    };
  }

  if (key === "mains") {
    return {
      title: "115, 230, and the little red switch",
      intro: "Older supplies have a voltage selector. Getting it wrong is one of the few mistakes in this trade that is instantly destructive.",
      panels: [{
        kind: "note", title: "What the switch does",
        paragraphs: [
          "A supply with a manual selector is wired internally for one input range or the other. It does not detect anything — it does what the switch says.",
          "Most modern supplies are auto-ranging and have no switch at all. If there is a switch, somebody has to set it, and that somebody is you."
        ]
      }],
      questions: [{
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
