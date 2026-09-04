/* =====================================================================
   Wireless AP — survey the floor, site the AP, plan the channels.

   SIX INTERFERENCE SOURCES, AND THEY STACK. The owner asked for at least
   six and named the microwave specifically. More than one can be live at
   once, so the job is not "spot the interference" — it is working out
   which one is DOMINANT, and that is a different skill.

   THE MODEL IS REAL, and everything the student sees comes out of it.
   Signal at a desk is transmit power minus free-space path loss minus
   the attenuation of every wall the path crosses. Noise is the floor
   plus whatever interference reaches that desk on that band. SNR is the
   difference. Move the AP one square and every number moves, because
   there is one model and the plan cannot disagree with the readings.

   That is the whole reason this lab exists rather than a quiz about
   channel numbers: a student who watches the far corner die when the AP
   goes behind the lift shaft has learned something that survives
   rewording.
   ===================================================================== */
import { rng } from "./rng.js";

/* ------------------------------------------------------------------
   Materials, with the attenuation they add to a path crossing them.
   Figures are the usual working numbers for 2.4 GHz; 5 GHz is worse
   through solids, which the model applies as a multiplier.
   ------------------------------------------------------------------ */
export const MATERIALS = {
  open:   { label: "Open floor",     glyph: "",   loss: 0,  tone: "open" },
  wall:   { label: "Concrete wall",  glyph: "▓",  loss: 12, tone: "wall" },
  metal:  { label: "Metal / lift shaft", glyph: "█", loss: 26, tone: "metal" },
  water:  { label: "Water tank",     glyph: "≈",  loss: 8,  tone: "water" }
};

/* ------------------------------------------------------------------
   The six interference sources. Microwave is required by name.

   Each says which band it pollutes, how much noise it adds at source,
   how far that reaches, and — the part that makes it teachable — the
   TELL a student can use to recognise it from a spectrum trace.
   ------------------------------------------------------------------ */
export const INTERFERENCE = {
  microwave: {
    name: "Microwave oven", band: "2.4", noise: 22, reach: 3,
    tell: "Bursts hard for a minute or two and then stops completely, and it always lands around the top of the 2.4 GHz band.",
    pattern: "intermittent, wideband while it runs",
    fix: "It is a kitchen appliance and it is not moving. Use 5 GHz near it, or site the AP outside its reach."
  },
  cordless: {
    name: "Cordless phone base", band: "2.4", noise: 16, reach: 4,
    tell: "Continuous rather than bursty, and it sits on one narrow slice of the band all day.",
    pattern: "continuous, narrowband",
    fix: "Move it, replace it with a DECT handset on 1.9 GHz, or plan channels around the slice it occupies."
  },
  bluetooth: {
    name: "Bluetooth density", band: "2.4", noise: 11, reach: 5,
    tell: "Smeared across the whole band rather than parked anywhere, because it hops fast between many narrow channels.",
    pattern: "frequency hopping, whole band",
    fix: "You cannot plan around a hopper on 2.4. Move the clients that matter to 5 GHz."
  },
  neighbour: {
    name: "Neighbouring AP on an overlapping channel", band: "both", noise: 19, reach: 7,
    tell: "Looks exactly like a Wi-Fi signal because it is one. Shows as a strong SSID you do not own, on a channel that overlaps yours.",
    pattern: "co-channel and adjacent-channel",
    fix: "This is the one you fix with planning rather than hardware: move to a non-overlapping channel they are not using."
  },
  ballast: {
    name: "Failing fluorescent ballast", band: "2.4", noise: 9, reach: 2,
    tell: "Broadband hash that comes and goes with the lights, and it is worst when a tube is flickering on.",
    pattern: "broadband, follows the lighting circuit",
    fix: "Replace the ballast or the fitting. It is an electrical fault, not a wireless one."
  },
  /* Materials are not a noise source — they attenuate signal instead.
     Keeping them in this table would be tidy and wrong, so they are
     modelled as attenuation on the plan and named here only so the
     student can rule them in or out from the same list. */
  materials: {
    name: "Building materials in the path", band: "both", noise: 0, reach: 0,
    tell: "Noise is normal but signal is poor, and it gets worse in one direction only — the direction with concrete or metal in it.",
    pattern: "attenuation, not noise",
    fix: "Nothing to switch off. Move the AP so the path to the far clients does not cross the obstruction."
  }
};

const SITES = [
  { who: "Halloway Dental Practice", size: "Small Business",
    said: ["the surgery at the far end drops off constantly and the front desk is fine",
           "we heat lunch in the staff kitchen and somebody swears that is when it goes",
           "the building is 1960s, so the walls are solid"] },
  { who: "Ferrier Solicitors", size: "Mid-Market",
    said: ["there are four other firms in this building and all of them have their own wireless",
           "it is worst in the middle of the day when everyone is in",
           "the meeting room at the back is the one that matters and it is the worst of the lot"] },
  { who: "Ashcombe Community Centre", size: "Small Business",
    said: ["the hall at the far end has nothing at all and that is where the classes run",
           "the strip lights in the corridor have been flickering for months",
           "there is a big water tank in the roof space above the corridor"] },
  { who: "Redgate Logistics", size: "Mid-Market",
    said: ["the scanners drop their connection somewhere between the office and the loading bay",
           "there is a goods lift in the middle of the building",
           "the handsets everyone carries are all paired to headsets"] }
];

const NOISE_TALK = [
  "The last engineer said we needed a better router and sold us one.",
  "It has to be sorted before the inspection next month.",
  "Somebody mentioned a mesh, whatever that is.",
  "We have been living with it for two years.",
  "The broadband itself is fine — we checked that."
];

/* 2.4 GHz channels. Only 1, 6 and 11 do not overlap. */
export const CH24 = [1, 6, 11];

const COLS = 7, ROWS = 5;

export function generate(seed) {
  const r = rng(seed);
  const site = r.pick(SITES);

  /* Lay out the floor. A spine of concrete across the middle with one
     doorway, plus a heavy obstruction somewhere — this is what makes
     placement a real decision rather than "put it in the middle". */
  const cells = [];
  const doorway = r.int(1, COLS - 2);
  const heavyCol = r.pick([1, 2, COLS - 3, COLS - 2]);
  const heavy = r.pick(["metal", "water"]);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let mat = "open";
      if (y === 2 && x !== doorway) mat = "wall";
      if (y === 1 && x === heavyCol) mat = heavy;
      cells.push({ x: x, y: y, mat: mat });
    }
  }

  /* Where people actually are. One is deliberately on the far side of
     the spine wall, because that is the client that decides the siting. */
  const clients = [
    { key: "desk",  label: "Front desk",  x: r.int(0, 1), y: 0 },
    { key: "far",   label: r.pick(["Back surgery", "Meeting room", "The hall", "Loading bay"]),
      x: r.int(COLS - 2, COLS - 1), y: ROWS - 1 },
    { key: "mid",   label: "Corridor",    x: doorway, y: 3 }
  ];

  /* Two or three sources, always including one dominant. Microwave is
     weighted in because the owner asked for it by name, but it is not
     forced on every seed — a student who learns "it is always the
     microwave" has learned the wrong thing. */
  const pool = ["microwave", "cordless", "bluetooth", "neighbour", "ballast", "materials"];
  const count = r.int(2, 3);
  let live = r.some(pool, count);
  if (r.next() < 0.5 && live.indexOf("microwave") < 0) {
    live[live.length - 1] = "microwave";
  }
  /* Site each noise source on the plan, away from the walls. */
  const sources = live.map(function (k) {
    const I = INTERFERENCE[k];
    return { key: k, name: I.name, band: I.band, noise: I.noise, reach: I.reach,
             x: r.int(0, COLS - 1), y: r.pick([0, 1, 3, 4]) };
  });

  /* The dominant one is computed, not declared — whichever contributes
     most noise at the client that matters. Declaring it would let the
     plan and the answer drift apart. */
  const farClient = clients[1];
  let dominant = null, worst = -1;
  sources.forEach(function (src) {
    const n = noiseFrom(src, farClient, "2.4");
    if (n > worst) { worst = n; dominant = src.key; }
  });
  /* Materials contribute no noise, so if they are the only "source"
     reaching the far client, the honest answer is that it is
     attenuation rather than interference. */
  if (worst <= 0) dominant = "materials";

  /* Neighbouring APs occupy channels; the student must find the clear one. */
  const taken = r.some(CH24, r.int(1, 2));
  const clear = CH24.filter(function (c) { return taken.indexOf(c) < 0; });

  return {
    seed: seed, site: site, cols: COLS, rows: ROWS, cells: cells,
    clients: clients, sources: sources, dominant: dominant,
    doorway: doorway, heavy: heavy,
    takenChannels: taken, clearChannels: clear,
    txPower: 20,                       /* dBm, a typical AP at full power */
    said: r.shuffle(site.said.concat(r.some(NOISE_TALK, 2)))
  };
}

/* ------------------------------------------------------------------
   The RF model. Small, honest, and the single source of every number
   the student sees.
   ------------------------------------------------------------------ */
const NOISE_FLOOR = -95;               /* dBm, a quiet band */
const SNR_USABLE = 20;                 /* dB, enough for reliable throughput */

function dist(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/* Free-space path loss, simplified to something a student can follow:
   a fixed loss at one square, plus 20log10 of the distance in squares. */
function pathLoss(d, band) {
  const base = band === "5" ? 46 : 40;
  return base + 20 * Math.log10(Math.max(0.6, d));
}

/* Attenuation of everything between two points. Walks the straight line
   in small steps and adds the loss of each material it passes through,
   counting each cell once. */
function wallLoss(from, to, cells, cols, band) {
  const steps = Math.ceil(dist(from, to) * 6) || 1;
  const seen = {};
  let total = 0;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = Math.round(from.x + (to.x - from.x) * t);
    const y = Math.round(from.y + (to.y - from.y) * t);
    const key = x + "," + y;
    if (seen[key]) continue;
    seen[key] = true;
    const cell = cells[y * cols + x];
    if (!cell) continue;
    const m = MATERIALS[cell.mat];
    /* 5 GHz is attenuated harder by solids — the trade the student has
       to understand before choosing a band. */
    total += m.loss * (band === "5" ? 1.35 : 1);
  }
  return total;
}

export function signalAt(s, ap, client, band) {
  const d = dist(ap, client);
  return Math.round(s.txPower - pathLoss(d, band) - wallLoss(ap, client, s.cells, s.cols, band));
}

function noiseFrom(src, at, band) {
  if (src.noise <= 0) return 0;
  if (src.band !== "both" && src.band !== band) return 0;
  const d = dist(src, at);
  if (d > src.reach) return 0;
  return Math.max(0, Math.round(src.noise * (1 - d / (src.reach + 1))));
}

export function noiseAt(s, client, band) {
  let extra = 0;
  s.sources.forEach(function (src) { extra += noiseFrom(src, client, band); });
  return NOISE_FLOOR + extra;
}

export function snrAt(s, ap, client, band) {
  return signalAt(s, ap, client, band) - noiseAt(s, client, band);
}

/* Is this siting good enough for everybody? */
export function coverageAt(s, ap, band) {
  return s.clients.map(function (c) {
    const snr = snrAt(s, ap, c, band);
    return { key: c.key, label: c.label, signal: signalAt(s, ap, c, band),
             noise: noiseAt(s, c, band), snr: snr, ok: snr >= SNR_USABLE };
  });
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */
function briefPanel(s) {
  return {
    kind: "brief",
    from: s.site.who + " — " + s.site.size,
    paragraphs: ["The wireless is not good enough and they want it sorted."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

function planCells(s, showSources) {
  return s.cells.map(function (c) {
    const client = s.clients.filter(function (cl) { return cl.x === c.x && cl.y === c.y; })[0];
    const src = showSources && s.sources.filter(function (sr) { return sr.x === c.x && sr.y === c.y; })[0];
    if (src) return { tone: "noise", glyph: "!", label: src.name, blocked: true };
    if (client) return { tone: "client", glyph: "◍", label: client.label + " (a client sits here)", blocked: true };
    const m = MATERIALS[c.mat];
    return { tone: m.tone, glyph: m.glyph, label: m.label, blocked: c.mat !== "open" };
  });
}

function legendFor(showSources) {
  const out = [
    { tone: "open", glyph: "", label: "Open floor — you can mount here" },
    { tone: "wall", glyph: "▓", label: "Concrete wall" },
    { tone: "metal", glyph: "█", label: "Metal / lift shaft" },
    { tone: "water", glyph: "≈", label: "Water tank" },
    { tone: "client", glyph: "◍", label: "Where people work" }
  ];
  if (showSources) out.push({ tone: "noise", glyph: "!", label: "Interference source" });
  return out;
}

export function buildStage(key, s) {

  if (key === "brief") {
    return {
      title: "What is the coverage problem?",
      intro: "Every wireless complaint sounds the same. The detail that matters is where it is bad and when.",
      panels: [briefPanel(s)],
      questions: [{
        key: "wp-brief", kind: "multi",
        prompt: "Which of these are useful facts rather than conversation?",
        detail: "Two of the quotes narrow the problem. The rest do not.",
        hints: [
          "A useful fact tells you WHERE it is bad, WHEN it is bad, or what is physically in the way. Anything about budget or previous engineers is not.",
          "Wireless faults are located in space and in time. Look for a quote that pins down one or the other."
        ],
        options: [
          { key: "where", label: "It is bad in one specific part of the building", correct: true,
            why: "Yes — a fault with a location is a fault you can survey. That is the single most useful thing they said." },
          { key: "when", label: "It is worse at particular times", correct: true,
            why: "Yes — something that comes and goes is either load or an intermittent interferer, and both are findable." },
          { key: "router", label: "They need a better router", correct: false,
            why: "That is what the last engineer sold them, and the problem is still here. It is a conclusion, not a fact." },
          { key: "deadline", label: "It must be done before the inspection", correct: false,
            why: "A deadline. It does not change where you mount anything." },
          { key: "mesh", label: "They should have a mesh", correct: false,
            why: "Somebody's suggestion. Deciding the answer before the survey is how the previous engineer got it wrong." }
        ],
        explain: "Where and when. Those two turn a complaint into a survey plan."
      }]
    };
  }

  if (key === "survey") {
    const pts = s.clients.map(function (c) {
      const n = noiseAt(s, c, "2.4");
      return { key: c.key, label: c.label, sub: "column " + (c.x + 1) + ", row " + (c.y + 1),
               reading: n + " dBm noise floor",
               expected: "quiet floor is about " + NOISE_FLOOR + " dBm",
               bad: n > NOISE_FLOOR + 8 };
    });
    return {
      title: "Walk the floor and take readings",
      intro: "Before you site anything, find out what is already on the air. This is the step everybody skips.",
      panels: [{
        kind: "note", title: "What you are measuring",
        paragraphs: [
          "This is the NOISE FLOOR at each position with your own AP switched off — everything else that is transmitting near that spot.",
          "A quiet band sits around " + NOISE_FLOOR + " dBm. Anything much above that is somebody else's energy, and every dB of it is a dB your signal has to beat."
        ]
      }],
      questions: [{
        key: "wp-survey", kind: "probe",
        instrument: "Spectrum analyser — 2.4 GHz noise floor",
        prompt: "Take a reading at each of the three positions.",
        detail: "Click a position to measure there.",
        hints: [
          "Take all three before drawing any conclusion. One reading on its own tells you nothing about where the problem is.",
          "Compare each against the quiet-floor figure in the note. The gap is how much noise something else is putting into that spot."
        ],
        points: pts,
        then: {
          kind: "choice",
          prompt: "What do the three readings tell you?",
          hints: [
            "Look at which position is noisiest, and by how much. Noise is local — it falls off with distance from whatever is making it.",
            "There are two different failures possible here. One is that something is making noise; the other is that signal cannot reach. The noise floor only shows you the first."
          ],
          options: [
            { key: "local", label: "The noise is worse in some places than others, so a source is near one of them",
              correct: pts.some(function (p) { return p.bad; }),
              why: pts.some(function (p) { return p.bad; })
                ? "Right. Noise falls off with distance, so an elevated floor in one place puts the source near that place."
                : "All three came back near the quiet floor. Nothing is making significant noise here." },
            { key: "clean", label: "The band is quiet everywhere, so the problem is signal rather than noise",
              correct: !pts.some(function (p) { return p.bad; }),
              why: !pts.some(function (p) { return p.bad; })
                ? "Right. Nothing is polluting the band, so poor coverage here is attenuation — something in the path, not something on the air."
                : "At least one position is well above the quiet floor. Something is transmitting near it." },
            { key: "ap", label: "The readings prove the access point is faulty", correct: false,
              why: "Your AP is switched off for this measurement. Nothing here says anything about it." },
            { key: "band", label: "The readings mean 2.4 GHz is unusable anywhere in this building", correct: false,
              why: "Too broad. Noise is local; a bad reading in one corner says nothing about the far end." }
          ],
          explain: "Survey first. A noise floor tells you whether you are fighting interference or fighting distance, and those need opposite fixes."
        }
      }]
    };
  }

  if (key === "place") {
    return {
      title: "Site the access point",
      intro: "Click a square to mount it there. The readings update as you move it — that is the survey doing its job.",
      panels: [{
        kind: "note", title: "What has to be true",
        paragraphs: [
          "Every position where people work needs a signal-to-noise ratio of at least " + SNR_USABLE + " dB. " +
            "Below that you get a connection that shows full bars and moves nothing.",
          "You cannot mount inside a wall, a lift shaft or a water tank, and you cannot mount on top of a desk."
        ]
      }],
      questions: [{
        key: "wp-place", kind: "place",
        prompt: "Put the AP where all three positions work.",
        detail: "The table under the plan recalculates every time you move it.",
        hints: [
          "Watch what happens to the far position as you move across the concrete spine. Every wall in the path costs you signal, and the doorway is the one gap in it.",
          "You are not looking for the middle of the building. You are looking for the spot with the fewest obstructions between it and the position that is hardest to reach."
        ],
        grid: { cols: s.cols, rows: s.rows, cells: planCells(s, false) },
        legend: legendFor(false),
        commitLabel: "Mount it here",
        readout: function (pos) {
          return coverageAt(s, pos, "2.4").map(function (c) {
            return { label: c.label, value: c.signal + " dBm signal · " + c.noise + " dBm noise · " +
                     c.snr + " dB SNR", ok: c.ok };
          });
        },
        check: function (pos) {
          const cov = coverageAt(s, pos, "2.4");
          const bad = cov.filter(function (c) { return !c.ok; });
          if (!bad.length) {
            return { ok: true, why: "All three positions above " + SNR_USABLE + " dB. That is a working install." };
          }
          return { ok: false, why: bad.map(function (b) { return b.label; }).join(" and ") +
            " still below " + SNR_USABLE + " dB SNR. Look at what is between the AP and there." };
        },
        explain: "Site for the hardest client, not the centre of the plan. Walls in the path cost more than distance does."
      }]
    };
  }

  if (key === "channel") {
    return {
      title: "Pick a channel",
      intro: "There are fourteen channel numbers on 2.4 GHz and only three of them are worth having.",
      panels: [{
        kind: "table", title: "What the survey found on the air",
        columns: ["Channel", "Who is on it"],
        rows: CH24.map(function (c) {
          return { cells: ["Channel " + c, s.takenChannels.indexOf(c) >= 0 ? "A neighbouring network, strong" : "Clear"],
                   flag: s.takenChannels.indexOf(c) >= 0 ? "bad" : null };
        }),
        note: "Channels 1, 6 and 11 are the only three that do not overlap each other on 2.4 GHz. Everything between them overlaps two of these."
      }],
      questions: [
        { key: "wp-chan", kind: "choice",
          prompt: "Which channel do you set?",
          hints: [
            "Two things decide this: which of the three non-overlapping channels is free, and why the numbers in between are not an option.",
            "Picking a channel between two used ones does not split the difference — it overlaps BOTH of them, so you collide with two networks instead of one."
          ],
          options: CH24.map(function (c) {
            return { key: "ch" + c, label: "Channel " + c,
              correct: s.clearChannels.indexOf(c) >= 0 && c === s.clearChannels[0],
              why: s.takenChannels.indexOf(c) >= 0
                ? "A neighbouring network is already here, strongly. You would be sharing airtime with them."
                : (c === s.clearChannels[0] ? "Clear, and non-overlapping. This is the one."
                   : "Also clear — this is a defensible answer, but the survey shows " + s.clearChannels[0] +
                     " is the cleanest of what is available.") };
          }).concat([{ key: "ch3", label: "Channel 3", correct: false,
            why: "Channel 3 overlaps both 1 and 6. Sitting between two networks means colliding with both — it is the worst of the available choices, not a compromise." }]),
          explain: "1, 6 and 11. Pick whichever of those is clear; never pick a number in between." },
        { key: "wp-count", kind: "number",
          prompt: "How many non-overlapping channels does 2.4 GHz give you?",
          unit: "channels", answer: 3, tolerance: 0,
          hints: ["The table above lists them.",
                  "Each 2.4 GHz channel is wider than the spacing between channel numbers, so only every fifth one clears the last."],
          explain: "Three. That is the whole reason 2.4 GHz congests so badly in a building with several tenants." }
      ]
    };
  }

  if (key === "identify") {
    const dom = INTERFERENCE[s.dominant];
    const others = Object.keys(INTERFERENCE).filter(function (k) { return k !== s.dominant; });
    const wrong = rng(s.seed + 13).some(others, 3);
    return {
      title: "Which interference is actually dominant?",
      intro: "More than one thing is on the air here. They are not equally to blame, and only one is worth acting on first.",
      panels: [{
        kind: "table", title: "What the analyser is showing",
        columns: ["Source detected", "Band", "Pattern"],
        rows: s.sources.map(function (src) {
          return { cells: [INTERFERENCE[src.key].name, src.band === "both" ? "2.4 and 5" : src.band + " GHz",
                           INTERFERENCE[src.key].pattern] };
        }),
        note: "Detected does not mean dominant. What matters is how much noise each one puts into the position that is failing."
      }, {
        kind: "note", title: "The position that matters",
        paragraphs: [s.clients[1].label + " is the one they complained about. " +
          "Noise falls off with distance, so the source that is worst THERE is the one to deal with first."]
      }],
      questions: [{
        key: "wp-dom", kind: "choice",
        prompt: "Which one is doing the most damage at " + s.clients[1].label + "?",
        hints: [
          "Two things decide it: how much noise a source makes, and how close it is to the position that is failing. A loud source far away can matter less than a quiet one next to the desk.",
          "Check the band as well. A source that only pollutes 2.4 GHz is doing nothing at all to a client on 5 GHz — and one of the entries here is not a noise source in the first place."
        ],
        options: rng(s.seed + 17).shuffle(
          [{ key: s.dominant, label: dom.name, correct: true, why: dom.tell + " " + dom.fix }].concat(
            wrong.map(function (k) {
              const I = INTERFERENCE[k];
              return { key: k, label: I.name, correct: false,
                why: s.sources.some(function (src) { return src.key === k; })
                  ? I.name + " is on the air here, but it is not the worst at that position — " +
                    (I.noise === 0 ? "it adds no noise at all, it attenuates signal." : "either it is further away or it makes less noise.")
                  : I.name + " was not detected in this survey at all." };
            }))),
        explain: dom.tell
      }]
    };
  }

  if (key === "band") {
    const far = s.clients[1];
    const snr24 = snrAt(s, { x: 3, y: 0 }, far, "2.4");
    const snr5 = snrAt(s, { x: 3, y: 0 }, far, "5");
    return {
      title: "2.4, 5 or 6 GHz?",
      intro: "The bands are a trade, not a ranking. Higher is faster and quieter and does not travel as well.",
      panels: [{
        kind: "table", title: "The same AP position, measured on both bands",
        columns: ["Band", "Signal at " + far.label, "Noise", "SNR"],
        rows: [
          { cells: ["2.4 GHz", signalAt(s, { x: 3, y: 0 }, far, "2.4") + " dBm",
                    noiseAt(s, far, "2.4") + " dBm", snr24 + " dB"] },
          { cells: ["5 GHz", signalAt(s, { x: 3, y: 0 }, far, "5") + " dBm",
                    noiseAt(s, far, "5") + " dBm", snr5 + " dB"] }
        ],
        note: "5 GHz is quieter because most of the interference in this building only exists on 2.4 — but it is attenuated harder by every wall in the path."
      }],
      questions: [{
        key: "wp-band", kind: "choice",
        prompt: "What do these two rows tell you about choosing a band?",
        hints: [
          "Compare the two rows column by column. One band wins on noise; check whether it also wins on signal, and then on the difference between them.",
          "SNR is what actually decides whether a link works. A quieter band with a much weaker signal can still come out worse."
        ],
        options: [
          { key: "trade", label: "5 GHz is quieter but does not reach as far, so the right band depends on the distance and what is in the way",
            correct: true,
            why: "Right. That is the whole trade. Near the AP, 5 GHz wins easily; through two concrete walls it can lose to 2.4 despite the cleaner band." },
          { key: "always5", label: "5 GHz is better, so always use it", correct: false,
            why: "Not through walls. The higher the frequency, the harder solids attenuate it — which is why the far corner of a building is often 2.4 only." },
          { key: "always24", label: "2.4 GHz reaches further, so always use it", correct: false,
            why: "Range is not the only thing. 2.4 has three usable channels and every microwave and Bluetooth device in the building sitting on it." },
          { key: "same", label: "There is no real difference in practice", correct: false,
            why: "The table shows a real difference in both signal and noise. They just do not point the same way." }
        ],
        explain: "Trade, not a ranking. 6 GHz extends the same logic further: cleanest of all, and the shortest reach of the three."
      }]
    };
  }

  if (key === "install") {
    return {
      title: "Mount it and get power to it",
      intro: "It works on the bench. Now it has to work on a ceiling with one cable.",
      panels: [{
        kind: "note", title: "What is available",
        paragraphs: [
          "The AP supports PoE. The nearest switch is a standard unmanaged one with no PoE, forty metres away in the comms cupboard.",
          "There is no mains socket anywhere near the mounting point, and running one would mean an electrician."
        ]
      }],
      questions: [{
        key: "wp-install", kind: "order",
        prompt: "Put the install steps in the order you would do them.",
        hints: [
          "Think about what you would rather find out BEFORE you are up a ladder with the ceiling tile out.",
          "Two of these are proofs rather than work — testing the run and testing the coverage. Each belongs immediately after the thing it proves."
        ],
        steps: [
          { key: "run",   at: 1, label: "Run the cable from the cupboard to the mounting point" },
          { key: "test1", at: 2, label: "Test the run end to end before anything is mounted" },
          { key: "inject", at: 3, label: "Fit the PoE injector at the switch end" },
          { key: "mount", at: 4, label: "Mount the AP and connect it" },
          { key: "config", at: 5, label: "Set the channel and transmit power you decided on" },
          { key: "test2", at: 6, label: "Walk the floor again and confirm the coverage" }
        ],
        explain: "Run it, prove it, power it, mount it, configure it, prove it again. Testing the cable before the AP goes up is the step that saves the second trip up the ladder."
      }]
    };
  }

  if (key === "power") {
    return {
      title: "Transmit power and antenna",
      intro: "Turning it up is the instinct, and it is usually wrong.",
      panels: [{
        kind: "note", title: "Why more power is not more coverage",
        paragraphs: [
          "The AP can shout at 20 dBm. A phone answers at about 15 dBm, and a laptop not much more.",
          "If the AP is louder than the clients, the client hears it fine from a distance at which the AP cannot hear the client. It shows full bars and moves nothing — and the same power spills into next door's building, where it becomes their interference."
        ]
      }],
      questions: [{
        key: "wp-power", kind: "choice",
        prompt: "Coverage is patchy at the far end. Do you turn the AP up?",
        hints: [
          "The link has to work in BOTH directions. Read the second paragraph again and think about what the client can manage.",
          "Consider what happens to the neighbours you found on the survey if everyone answers weak coverage by transmitting harder."
        ],
        options: [
          { key: "no", label: "No — the link is only as good as the quieter end, and extra power leaks into the neighbours",
            correct: true,
            why: "Right. Raising AP power alone creates coverage the client cannot answer from, and adds to the co-channel problem you just measured." },
          { key: "yes", label: "Yes — maximum power gives maximum coverage", correct: false,
            why: "It gives maximum DOWNLINK. The client still cannot be heard, so the connection shows bars and does nothing." },
          { key: "ant", label: "Only if you also fit a directional antenna", correct: false,
            why: "A directional antenna is often the right answer — but it works by focusing what you have, which is a reason NOT to also raise power." },
          { key: "chan", label: "Yes, and move to a busier channel to compensate", correct: false,
            why: "Nothing about a busier channel compensates for anything. That makes both problems worse." }
        ],
        explain: "Match the AP to the clients, and add an access point rather than volume. Directional antennas focus coverage where it is wanted and keep it out of the neighbours'."
      }]
    };
  }

  throw new Error("lab-wap: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js. */
export function selfCheck(sc) {
  const bad = [];
  if (sc.cells.length !== sc.cols * sc.rows) bad.push("plan is not " + sc.cols + " by " + sc.rows);
  if (sc.sources.length < 2) bad.push("fewer than two interference sources — they are supposed to stack");
  sc.sources.forEach(function (src) {
    if (!INTERFERENCE[src.key]) bad.push("source \"" + src.key + "\" is not in the table");
  });
  if (!INTERFERENCE[sc.dominant]) bad.push("dominant \"" + sc.dominant + "\" is not in the table");
  /* THE SCENARIO MUST BE SOLVABLE. If no legal mounting position gives
     every client a usable link, the placement stage cannot be passed —
     and it would only fail on the seeds that generated it. */
  let solvable = false;
  for (let y = 0; y < sc.rows && !solvable; y++) {
    for (let x = 0; x < sc.cols && !solvable; x++) {
      const cell = sc.cells[y * sc.cols + x];
      if (cell.mat !== "open") continue;
      if (sc.clients.some(function (c) { return c.x === x && c.y === y; })) continue;
      if (sc.sources.some(function (sr) { return sr.x === x && sr.y === y; })) continue;
      if (coverageAt(sc, { x: x, y: y }, "2.4").every(function (c) { return c.ok; })) solvable = true;
    }
  }
  if (!solvable) bad.push("no legal mounting position covers all three clients — the placement stage is unpassable");
  /* At least one non-overlapping channel has to be free, or the channel
     question has no correct answer. */
  if (!sc.clearChannels.length) bad.push("every non-overlapping channel is taken — the channel question is unanswerable");
  if (sc.takenChannels.length >= CH24.length) bad.push("all three channels marked taken");
  return bad;
}

export function variantKey(sc) { return sc.dominant + "/" + sc.sources.length + "/" + sc.heavy; }
