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
import { wapBench, materialWords, sourceWords } from "./bench-wap.js";
import { netBench, HOPS } from "./bench-net.js";
import { apBench } from "./bench-ap.js";
import { INSTALL_CASES, INSTALL_OPTS,
         ANTENNA_CASES, ANTENNA_OPTS } from "./wap-cases.js";
import { sixOptions } from "./options.js";

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


/* =====================================================================
   terminate — the Core 1 WAP Installation Simulation.

   Source: `Core-1-Sims/WAP Installation/WAP Installation Simulation.html`.
   Two halves, and this lab had neither:

     Part 1  For each cable, the right CONNECTOR and the right TOOL.
     Part 2  The access point has been moved and is off the network.
             Rebuild the run: access point, patch panel, switch.

   Every stage in this lab so far is about the AIR — survey, placement,
   channels, interference, transmit power. Not one of them is about the
   wire, and an access point with no cable to it radiates nothing at all.
   This is the half of the job that happens before any of that matters.

   THE TOOL IS HALF THE ANSWER. A student who knows an RJ45 goes on a
   twisted pair and reaches for a punchdown tool has not finished
   learning it: the connector decides what you fit, the TERMINATION
   decides what you fit it with, and the difference between crimping a
   plug and punching down a jack is the difference between a patch cord
   and a permanent run.
   ===================================================================== */

/* The three cables the sim shows, and what each one takes. */
const WAP_CABLES = [
  { key: "utp", label: "Four-pair UTP, solid core",
    detail: "The permanent run, from the patch panel to the outlet in the ceiling",
    connector: "rj45", tool: "punchdown",
    why: "A solid-core run is terminated onto a JACK, not into a plug \\u2014 solid conductors " +
      "crack when they are flexed and a crimped plug on solid core is a fault waiting for " +
      "somebody to move it. It gets punched down at both ends." },
  { key: "patch", label: "Four-pair UTP, stranded",
    detail: "A patch cord, to go from the panel to the switch",
    connector: "rj45", tool: "crimper",
    why: "Stranded cable flexes, which is what a patch cord does all its life, and a plug is " +
      "crimped onto it. Same connector as the run above and a completely different tool, " +
      "which is the point of having both on the bench." },
  { key: "fibre", label: "Duplex single-mode fibre",
    detail: "The uplink from this switch to the core",
    connector: "lc", tool: "optical",
    why: "Glass, not copper. LC is the small form-factor duplex connector on modern optics, and " +
      "it is polished or cleaved with an optical kit \\u2014 a copper crimper does nothing to it " +
      "but break it." },
  { key: "phone", label: "Two-pair telephone cable",
    detail: "The analogue line to the alarm panel in the same riser",
    connector: "rj11", tool: "crimper",
    why: "Six-position, two conductors used. It lives in the same riser and is the one that gets " +
      "confused with an RJ45, which is why it is on the bench: an RJ11 plug fits INTO an RJ45 " +
      "jack and damages it." }
];

const WAP_CONNECTORS = {
  rj45: { label: "RJ45", is: "Eight positions, eight conductors. Everything Ethernet on copper." },
  rj11: { label: "RJ11", is: "Six positions, two conductors. Telephone and analogue lines \\u2014 and it will fit into an RJ45 jack and spread the contacts." },
  lc:   { label: "LC", is: "A small-form-factor duplex fibre connector. Glass, latching, and nothing to do with copper." },
  sc:   { label: "SC", is: "The older, larger square fibre connector. Also fibre, also wrong for a modern SFP cage." },
  bnc:  { label: "BNC", is: "A bayonet coaxial connector. Coax, video and legacy segments \\u2014 not structured cabling." },
  f:    { label: "F-type", is: "The screw-on coaxial connector on aerial and cable-modem drops." }
};
const WAP_TOOLS = {
  crimper:   { label: "Crimping tool", is: "Squeezes a plug's contacts down through the insulation onto stranded conductors. It makes patch cords." },
  punchdown: { label: "Punchdown tool", is: "Drives a conductor into an insulation-displacement contact and cuts the tail off. It terminates permanent runs onto jacks and panels." },
  optical:   { label: "Optical termination kit", is: "Cleaves, polishes and inspects glass. Nothing in it will terminate copper." },
  stripper:  { label: "Cable stripper", is: "Takes the jacket off without nicking the conductors. Needed before every one of the others, and it terminates nothing on its own." },
  tester:    { label: "Cable tester", is: "Proves a finished run end to end. It comes after termination and tells you nothing about how to do it." },
  toner:     { label: "Tone generator and probe", is: "Finds which cable in a bundle is which. A location tool, not a termination tool." }
};

/* Part 2. The run, in the order it physically goes, and what each end
   of it is. `takes` is what belongs at that point. */
const WAP_RUN = [
  { key: "ap-tail", label: "The access point's own port",
    takes: "rj45-plug",
    why: "The AP has an eight-position jack on it and takes a patch cord with a plug crimped on." },
  { key: "panel-back", label: "The back of the patch panel",
    takes: "punched",
    why: "The permanent run from the ceiling arrives here as bare pairs and is PUNCHED DOWN onto " +
      "the panel's contacts. Nothing is plugged in at the back of a patch panel \\u2014 that is what " +
      "makes it a patch panel." },
  { key: "panel-front", label: "The front of the patch panel",
    takes: "rj45-plug",
    why: "The front is a row of jacks. A patch cord with a crimped plug goes from here to the switch." },
  { key: "switch-port", label: "The switch port",
    takes: "rj45-plug",
    why: "The other end of that same patch cord." }
];
const WAP_ENDS = {
  "rj45-plug": { label: "An RJ45 patch cord (crimped plug)",
                 is: "A stranded cord with a plug on each end. It goes between two JACKS." },
  "punched":   { label: "Bare pairs, punched down",
                 is: "Solid conductors driven into insulation-displacement contacts. It is how a permanent run ENDS, and it is not something you plug in." },
  "rj11-plug": { label: "An RJ11 telephone cord",
                 is: "Two conductors in a narrower plug. It fits an RJ45 jack, does not work, and spreads the outer contacts on the way out." },
  "lc-fibre":  { label: "An LC fibre patch lead",
                 is: "Glass. It belongs in an optical port, and there is not one at any of these four points." },
  "coax":      { label: "A coaxial drop",
                 is: "Belongs on an aerial or a cable modem, not anywhere in a structured copper run." },
  /* Two more near misses, because five wrong options have to exist
     before five can be drawn — and both of these are things that turn
     up in a real riser and are genuinely mistaken for the right answer. */
  "crossover": { label: "An RJ45 crossover cord",
                 is: "Swaps transmit and receive so two like devices can talk. Anything made this " +
                     "century negotiates that for itself, and using one here works by accident or " +
                     "not at all." },
  "rj11-jack": { label: "A telephone jack, punched down",
                 is: "Punched down, which is the right ACTION on the wrong service. Two pairs into " +
                     "a voice jack terminates the alarm line, not the access point." }
};

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

/* ---------------------------------------------------------------------
   The floor plan for the survey and placement stages.

   A plan view, because that is how a survey is actually done and because
   it is the one camera angle with no occlusion at all.

   Every material and every source is named in the control list, not only
   drawn — a colour on a plan is not something every student can read, and
   this one is built for people whose sight is damaged.
   --------------------------------------------------------------------- */
/* A bench panel built from one of the AP bench's two views, with its
   controls mapped straight off the parts so a part added to the model
   cannot go missing from the list beside it. */
function apPanel(view, o) {
  return {
    kind: "bench", title: o.title, intro: o.intro, height: o.height || 430,
    bench: {
      spec: function () { return apBench(view); },
      status: function () { return { tone: o.tone || "calm", words: o.words, detail: o.detail }; },
      controls: function () {
        return apBench(view).parts.map(function (x) {
          return { key: x.key, label: x.label, state: "na",
                   stateWords: x.spec || "On the bench", detail: x.note };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* Six options from an eight-option pool, the correct one marked by the
   scenario. Every wrong option explains itself in its own terms. */
function wapPool(pool, rightKey, why, salt) {
  return sixOptions(pool.map(function (o) {
    return { key: o.key, label: o.label, correct: o.key === rightKey,
             why: o.key === rightKey ? "Yes. " + why
                : "Not this one. Nothing in the report points at it: " + o.label.toLowerCase() + "." };
  }), salt);
}

function floorPanel(s, opts) {
  opts = opts || {};
  const live = s.sources || [];

  /* One entry per DISTINCT material actually on this floor, so the list
     explains the plan in front of the student rather than a general
     legend that may not apply. */
  const mats = [];
  (s.cells || []).forEach(function (c) {
    if (mats.indexOf(c.mat) === -1) mats.push(c.mat);
  });

  const view = {
    cols: s.cols, rows: s.rows, cells: s.cells,
    dominant: s.dominant || null,
    sources: live.map(function (x) {
      return { key: x.key, x: x.x, y: x.y, reach: x.reach || 0,
               noise: x.noise || 0, band: x.band };
    }),
    ap: opts.ap || null,
    clients: (s.clients || []).map(function (c) {
      return { key: c.key, label: c.label, x: c.x, y: c.y, ok: opts.ap ? undefined : true };
    })
  };

  return {
    kind: "bench",
    title: "The floor, from above",
    intro: opts.ap
      ? "The access point is where you put it, with its usable range drawn round it. Every " +
        "interference source has its own rings \u2014 where two cross, both are adding to the " +
        "same noise floor."
      : "Before anything gets mounted: what is on this floor, what it is made of, and what is " +
        "already shouting on 2.4 GHz.",
    height: 460,
    bench: {
      spec: function () { return wapBench(view); },
      status: function () {
        const dom = s.dominant ? sourceWords(s.dominant) : null;
        return dom
          ? { words: "Interference present", tone: "warn",
              detail: "Loudest on this floor: " + dom + ". It is not the only one." }
          : { words: "Clear floor", tone: "calm", detail: "Nothing significant on 2.4 GHz here." };
      },
      controls: function () {
        const out = live.map(function (x) {
          return {
            key: "src-" + x.key,
            label: sourceWords(x.key),
            /* `materials` can appear in the sources list AND be the
               dominant cause. It is the building either way, so the FLOOR
               carries that verdict and this entry never does — otherwise
               two things claim to be dominant on the same plan. */
            state: (x.key === s.dominant && x.key !== "materials")
              ? "faulty" : (x.reach > 0 ? "worn" : "empty"),
            stateWords: (x.key === s.dominant && x.key !== "materials")
              ? "Dominant \u2014 the loudest thing here"
              : (x.reach > 0 ? (x.noise || 0) + " dB, reaching about " + x.reach + " cells"
                             : "In the path, not a transmitter"),
            detail: (x.band === "both" ? "Affects both bands" : x.band + " GHz")
          };
        });
        /* SOMETIMES NOTHING IS TRANSMITTING.

           In 18 of 240 generated floors the dominant cause of poor signal
           is the BUILDING, and `materials` is deliberately not in the
           sources list because it does not transmit anything. Looking only
           at sources left those floors with no dominant cause marked at
           all, which teaches the wrong lesson twice over: that there is
           always a device to find, and that a survey is a hunt for one.

           So the floor itself can be the dominant cause, and says so. */
        const buildingIsWorst = s.dominant === "materials";
        mats.forEach(function (m, i) {
          out.push({
            key: "mat-" + m,
            label: "Floor: " + m,
            state: buildingIsWorst && i === 0 ? "faulty" : "empty",
            stateWords: buildingIsWorst && i === 0
              ? "Dominant \u2014 nothing is transmitting; the building is the problem"
              : materialWords(m),
            detail: buildingIsWorst && i === 0 ? materialWords(m) : ""
          });
        });
        return out;
      },
      onAction: function () { return {}; }
    }
  };
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
      }, Object.assign(floorPanel(s, {}), {
        title: "The floor you are standing on",
        intro: "The readings come off this. Every cell names its material, because what a signal loses going through a wall is decided by what the wall is made of."
      })],
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
          ,
            /* Two more readings of the same three numbers. Both describe
               a real pattern; neither is the pattern in front of you. */
            { key: "even", label: "The noise is even everywhere, so it is coming from outside the building",
              correct: false,
              why: "That is exactly what a distant or building-wide source looks like, and it is " +
                "worth recognising. These three readings are not even \u2014 compare them again " +
                "and note how much they differ, because noise falls off with distance from " +
                "whatever makes it." },
            { key: "ap", label: "The AP's own radio is faulty \u2014 it is hearing noise that is not there",
              correct: false,
              why: "Possible, and testable: a second meter, or the same AP moved, would show it. " +
                "But a faulty radio reports the same noise wherever you stand it, and these " +
                "figures change with position." }
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
      panels: [floorPanel(s, { ap: { x: Math.floor(s.cols / 2), y: Math.floor(s.rows / 2), radius: 2.3 } }), {
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
      }, Object.assign(floorPanel(s, {}), {
        title: "What else is on the air, and where it is",
        intro: "Channel planning is done on a drawing, because what matters is not only which channels are busy but WHERE the things using them are standing."
      })],
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
          }).concat([
            { key: "ch3", label: "Channel 3", correct: false,
              why: "Channel 3 overlaps both 1 and 6. Sitting between two networks means colliding with both — it is the worst of the available choices, not a compromise." },
            /* Two more, to make six. One is the other overlapping trap at
               the far end of the band; the other is the answer most
               people actually give, and it is worth having on the page
               precisely because it is so reasonable. */
            { key: "ch9", label: "Channel 9", correct: false,
              why: "Channel 9 overlaps both 6 and 11, for the same reason channel 3 overlaps 1 and 6. Between is never a compromise in this band — it is two collisions instead of one." },
            { key: "auto", label: "Leave it on automatic and let the AP choose", correct: false,
              why: "The commonest real answer, and it fails on exactly this kind of site. Automatic selection samples the air when the AP boots and then leaves it alone. The interference here comes and goes, so it settles on whatever was quiet at eight in the morning and is unusable by eleven." }
          ]),
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
    /* ALL FIVE OTHERS, not three of them. Six options is the standing
       rule, and it suits this question better anyway: the owner's point
       about interference is that the sources STACK, so a student should
       be choosing the dominant one out of everything on the air rather
       than out of a shortlist somebody already pruned for them. */
    const wrong = rng(s.seed + 13).some(others, 5);
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
      }, Object.assign(floorPanel(s, {}), {
        title: "Every source that is live, with its reach",
        intro: "Each source draws its own rings. Where two overlap, BOTH are adding to the same noise floor — which is why the loudest thing on the analyser is not always the one that is hurting you."
      })],
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
      }, Object.assign(floorPanel(s, { ap: { x: 3, y: 0, radius: 2.3 } }), {
        title: "The same floor, and what stands between the AP and that client",
        intro: "The two rows in the table were both measured from the point marked here, to " +
          "the client at the far end. Everything the signal has to cross on the way is drawn: " +
          "a partition costs a 2.4 GHz signal a little and a 5 GHz signal a lot, and the " +
          "difference between the two rows is almost entirely what is in that line. Count the " +
          "walls, then read the table again."
      })],
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
        ,
            { key: "dfs", label: "5 GHz can only be used indoors, because of the radar channels",
              correct: false,
              why: "DFS is real \u2014 some 5 GHz channels have to vacate if radar is detected \u2014 " +
                "but it restricts WHICH channels, not whether the band is usable. There is plenty " +
                "of 5 GHz available without ever touching a DFS channel." },
            { key: "oldest", label: "Pick the band by what the oldest client supports, not by the environment",
              correct: false,
              why: "A fair instinct that builds the wrong estate: it drags the whole site down to " +
                "the worst device on it. Run both bands and let the capable clients use the quiet " +
                "one. The rows asked you to weigh a trade, and this answer refuses to make it." }
          ],
        explain: "Trade, not a ranking. 6 GHz extends the same logic further: cleanest of all, and the shortest reach of the three."
      }]
    };
  }

  if (key === "install") {
    const inst = rng(s.seed + 941).pick(INSTALL_CASES);
    return {
      title: "Mount it and get power to it",
      intro: "It works on the bench. Now it has to work on a ceiling with one cable.",
      panels: [{
        kind: "note", title: "What is available",
        paragraphs: [
          "The AP supports PoE. The nearest switch is a standard unmanaged one with no PoE, forty metres away in the comms cupboard.",
          "There is no mains socket anywhere near the mounting point, and running one would mean an electrician."
        ]
      }, apPanel({ show: "mount", noPower: true }, {
        title: "What goes up, and what feeds it",
        intro: "The bracket first, then the AP twists onto it, and the cable arrives underneath "
          + "rather than at the edge. The injector's two sockets are not interchangeable.",
        height: 430,
        words: "Amber \u2014 powered, not yet adopted",
        detail: "Amber is not dead. A unit with no PoE at all shows nothing at all, so the "
          + "colour already tells you power is arriving."
      })],
      questions: [{
        key: "wp-poe", kind: "choice",
        prompt: "Before the order of work \u2014 a different site reports this: \u201c"
          + inst.said + "\u201d What is wrong?",
        hints: [
          "Start with what is WORKING. A healthy link light is a fact, and it rules out most "
            + "of this list on its own.",
          "Data and power do not travel the same way through an injector. One of them passes "
            + "whichever way round you wire it and the other does not, so a working network "
            + "connection tells you nothing about whether volts are arriving.",
          "Two of these are not about the injector or the AP at all: one is about how FAR the "
            + "run is, and one is about what the injector's socket is wired to. If the fault "
            + "keeps time with the building rather than with the network, look there."
        ],
        options: wapPool(INSTALL_OPTS, inst.key, inst.tell, s.seed + 941),
        explain: inst.tell
      }, {
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
    const ant = rng(s.seed + 977).pick(ANTENNA_CASES);
    return {
      title: "Transmit power and antenna",
      intro: "Turning it up is the instinct, and it is usually wrong.",
      panels: [apPanel({ show: "antenna" }, {
        title: "Three ways to shape the same signal",
        intro: "Same transmitter, three patterns. Which one you want is decided as much by "
          + "where the signal must NOT go as by where it must.",
        height: 450,
        words: "Internal omni, external omni, directional",
        detail: "Gain is not extra power. It is the same power pushed into a narrower beam, "
          + "taken from the directions you gave up."
      }), {
        kind: "note", title: "Why more power is not more coverage",
        paragraphs: [
          "The AP can shout at 20 dBm. A phone answers at about 15 dBm, and a laptop not much more.",
          "If the AP is louder than the clients, the client hears it fine from a distance at which the AP cannot hear the client. It shows full bars and moves nothing — and the same power spills into next door's building, where it becomes their interference."
        ]
      }],
      questions: [{
        key: "wp-antenna", kind: "choice",
        prompt: "From another site: \u201c" + ant.said + "\u201d What do you do about it?",
        hints: [
          "Ask what the signal has to REACH and, just as important, what it must not reach. "
            + "Coverage is shaped, not just sized.",
          "An omnidirectional antenna radiates in a flattened doughnut, and a doughnut has a "
            + "hole through the middle. A dipole radiates off its LENGTH, not off its tip. One "
            + "of those two facts settles most of these.",
          "Two of these make every one of the six situations worse rather than better: turning "
            + "everything up to maximum, and adding more access points on the SAME channel. "
            + "Strike those and read the rest again."
        ],
        options: wapPool(ANTENNA_OPTS, ant.key, ant.tell, s.seed + 977),
        explain: ant.tell
      }, {
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
        ,
            /* Two more that sound like tuning, and neither addresses the
               asymmetry the right answer turns on. */
            { key: "client", label: "Yes \u2014 and turn the client adapters up to match", correct: false,
              why: "The right instinct, and the reason the answer is no. The link is only as good as " +
                "its quieter end \u2014 but a phone or a laptop has no power control you can reach, " +
                "so matching the AP is precisely what you cannot do. Raising the AP alone just makes " +
                "it shout at something that cannot shout back." },
            { key: "beacon", label: "No \u2014 shorten the beacon interval so clients find it sooner",
              correct: false,
              why: "Beacon interval changes how quickly a client discovers and roams to an AP, not " +
                "how well it can be heard once it is on. Patchy coverage at the far end is a signal " +
                "problem; this is a timing setting." }
          ],
        explain: "Match the AP to the clients, and add an access point rather than volume. Directional antennas focus coverage where it is wanted and keep it out of the neighbours'."
      }]
    };
  }

  if (key === "terminate") {
    const r2 = rng(s.seed + 503);
    /* PART 1 — the four cables, each needing a connector and a tool. */
    const items = [];
    Object.keys(WAP_CONNECTORS).forEach(function (k) {
      items.push({ key: "c:" + k, label: WAP_CONNECTORS[k].label, sub: "connector", kind: "connector", id: k });
    });
    Object.keys(WAP_TOOLS).forEach(function (k) {
      items.push({ key: "t:" + k, label: WAP_TOOLS[k].label, sub: "tool", kind: "tool", id: k });
    });
    const slots = [];
    WAP_CABLES.forEach(function (c) {
      slots.push({ key: c.key + "-conn", label: c.label + " — connector" });
      slots.push({ key: c.key + "-tool", label: c.label + " — tool" });
    });
    const byKey = {};
    items.forEach(function (it) { byKey[it.key] = it; });

    const partOne = {
      key: "wt-parts", kind: "assign",
      prompt: "Fit each cable with its connector and the tool that terminates it.",
      detail: "Click a connector or a tool, then click the slot it belongs in. A connector or " +
        "tool can be needed more than once — put one back and use it again.",
      hints: [
        "Two of these four cables take the SAME connector and different tools. Work out what is " +
          "different about the cable itself rather than about the socket it ends up in.",
        "Solid conductors are for runs that never move and are driven into contacts. Stranded " +
          "conductors are for cords that flex and have plugs squeezed onto them. That distinction " +
          "decides the tool every time."
      ],
      items: items,
      slots: slots,
      check: function (filled) {
        const empty = slots.filter(function (sl) { return !filled[sl.key]; });
        if (empty.length) {
          return { ok: false, why: "Still empty: " + empty.length + " of " + slots.length +
            " — every cable needs both a connector and a tool." };
        }
        /* A tool in a connector slot is a different mistake from a wrong
           tool, and it deserves a different sentence. */
        const misfiled = slots.filter(function (sl) {
          const it = byKey[filled[sl.key]];
          return it && ((sl.key.slice(-5) === "-conn" && it.kind !== "connector") ||
                        (sl.key.slice(-5) === "-tool" && it.kind !== "tool"));
        })[0];
        if (misfiled) {
          const it = byKey[filled[misfiled.key]];
          return { ok: false, why: "A " + it.kind + " is sitting in a " +
            (misfiled.key.slice(-5) === "-conn" ? "connector" : "tool") + " slot — " +
            it.label + ". " + (it.kind === "tool" ? WAP_TOOLS[it.id].is : WAP_CONNECTORS[it.id].is) };
        }
        const bad = WAP_CABLES.map(function (c) {
          const gotC = byKey[filled[c.key + "-conn"]], gotT = byKey[filled[c.key + "-tool"]];
          if (gotC.id !== c.connector) {
            return c.label + " — " + gotC.label + ". " + WAP_CONNECTORS[gotC.id].is;
          }
          if (gotT.id !== c.tool) {
            return c.label + " — " + gotT.label + ". " + WAP_TOOLS[gotT.id].is;
          }
          return null;
        }).filter(Boolean)[0];
        if (bad) return { ok: false, why: bad };
        return { ok: true, why: "All four terminated correctly, and the two that share a " +
          "connector do not share a tool." };
      },
      explain: WAP_CABLES.map(function (c) {
        return c.label + ": " + WAP_CONNECTORS[c.connector].label + ", " +
          WAP_TOOLS[c.tool].label.toLowerCase() + ". " + c.why;
      }).join("  ")
    };

    /* PART 2 — the run, one point at a time, with the trap at the back
       of the patch panel. */
    const point = r2.pick(WAP_RUN);
    const wrongEnds = Object.keys(WAP_ENDS).filter(function (k) { return k !== point.takes; });
    const partTwo = {
      key: "wt-run", kind: "choice",
      prompt: "The access point has been moved and is off the network. At " +
        point.label.replace(/^The /, "the ") + ", what belongs?",
      hints: [
        "Follow the cable from the access point back towards the switch and say, at each point, " +
          "whether it is a thing you PLUG IN or a thing you TERMINATE.",
        "A patch panel exists so that the permanent cabling never moves. That tells you what " +
          "happens at its back, and it is not the same as what happens at its front."
      ],
      options: rng(s.seed + 509).shuffle([point.takes].concat(rng(s.seed + 511).some(wrongEnds, 5))
        .map(function (k) {
          return { key: k, label: WAP_ENDS[k].label, correct: k === point.takes,
            why: k === point.takes ? point.why : WAP_ENDS[k].is + " Not at this point." };
        })),
      explain: point.why
    };

    return {
      title: "Run the cable, then get the access point back on the network",
      intro: "Every other stage in this lab is about the air. None of it means anything until " +
        "there is a wire to the access point, and this is the half of the job that decides " +
        "whether there is one.",
      panels: [{
        kind: "note", title: "The job",
        paragraphs: [
          "A new access point is going into the ceiling of the second floor. You are running the " +
            "cable to it, making up the patch cords, and getting it onto the switch.",
          "The riser already carries an analogue line to the alarm panel and a fibre uplink to " +
            "the core, and both of them are on the same bench as your Ethernet."
        ]
      }, {
        kind: "bench", height: 380,
        bench: {
          spec: function () {
            /* The rack end of the run, drawn from the networking bench so
               there is one patch panel in this build rather than two that
               can disagree. Nothing is marked — the fault is that the AP
               is not connected, and which link is missing is the answer. */
            return netBench({
              cloud: false,
              links: { "panel-wall": false },
              states: {}
            });
          },
          status: function () {
            return { tone: "warn", words: "Access point offline",
              detail: "The permanent run is in and the access point is mounted. What is missing " +
                "is between the panel and the point, and it is a termination rather than a fault." };
          },
          controls: function () {
            return WAP_RUN.map(function (pt) {
              return { key: pt.key, label: pt.label, state: "idle",
                stateWords: pt.key === point.key ? "the point in question" : "already made off",
                detail: pt.key === point.key
                  ? "This is the one you are being asked about."
                  : "Made off correctly. Use it to work out what the odd one takes." };
            });
          },
          onAction: function () { return {}; }
        }
      }],
      questions: [partOne, partTwo]
    };
  }

  throw new Error("lab-wap: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js. */
export function selfCheck(sc) {
  const bad = [];

  /* ---- terminate ----------------------------------------------------
     The teaching claim is that connector and tool are SEPARATE choices,
     so the table has to actually demonstrate it: at least two cables
     sharing a connector and differing in tool, or the stage is asserting
     something its own content does not show. */
  WAP_CABLES.forEach(function (c) {
    if (!WAP_CONNECTORS[c.connector]) bad.push("cable " + c.key + " takes \"" + c.connector + "\", which is not a connector");
    if (!WAP_TOOLS[c.tool]) bad.push("cable " + c.key + " takes \"" + c.tool + "\", which is not a tool");
    if (!c.why) bad.push("cable " + c.key + " has no reason");
  });
  const shared = WAP_CABLES.filter(function (a) {
    return WAP_CABLES.some(function (b) { return b !== a && b.connector === a.connector && b.tool !== a.tool; });
  });
  if (shared.length < 2) {
    bad.push("no two cables share a connector and differ in tool \u2014 the stage says the tool is " +
      "a separate choice from the connector, and nothing on the bench demonstrates it");
  }
  /* Five wrong options have to EXIST before five can be drawn. */
  if (Object.keys(WAP_CONNECTORS).length < 6) bad.push("fewer than six connectors on the bench");
  if (Object.keys(WAP_TOOLS).length < 6) bad.push("fewer than six tools on the bench");
  if (Object.keys(WAP_ENDS).length < 6) {
    bad.push("only " + Object.keys(WAP_ENDS).length + " cable ends exist, so a six-option " +
      "question about one of them cannot be built");
  }
  WAP_RUN.forEach(function (pt) {
    if (!WAP_ENDS[pt.takes]) bad.push("run point " + pt.key + " takes \"" + pt.takes + "\", which is not an end");
    if (!pt.why) bad.push("run point " + pt.key + " has no reason");
  });
  /* The back of the patch panel is the trap the whole of part two turns
     on: it is the one point in the run that is terminated rather than
     plugged in. */
  const back = WAP_RUN.filter(function (pt) { return pt.key === "panel-back"; })[0];
  if (!back) bad.push("the back of the patch panel is missing from the run");
  else if (back.takes !== "punched") {
    bad.push("the back of the patch panel is answered \"" + back.takes + "\" rather than punched " +
      "down \u2014 that distinction is the point of having a patch panel at all");
  }
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
