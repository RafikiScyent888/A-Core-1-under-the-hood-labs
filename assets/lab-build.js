/* =====================================================================
   Workstation Build — gaming, CAD/CAM, or virtualization host.

   THE THING THAT MAKES THIS LAB WORTH BUILDING: a bad build is not
   marked wrong. It is assembled, powered on, and it fails to POST — and
   the student diagnoses their own mistake from the symptom. Being told
   "that RAM is the wrong type" teaches nothing; watching the machine
   give three beeps and no display, and working back to the RAM, is the
   thing the exam is actually testing.

   So every incompatibility here carries a POST SYMPTOM, and the symptom
   is derived from the fault rather than stored beside it. There is one
   table, so there is nothing to drift.
   ===================================================================== */
import { rng } from "./rng.js";

/* ------------------------------------------------------------------
   The three configurations the owner chose. NOT NAS, NOT thin client.
   `weights` say what this workload actually cares about, and every
   part choice is graded against them.
   ------------------------------------------------------------------ */
export const PROFILES = {
  gaming: {
    name: "Gaming PC",
    needs: { gpu: 3, cores: 2, ram: 1, storage: 2, cooling: 3 },
    says: "high-end graphics, a fast CPU, serious cooling and a supply with headroom",
    ramMin: 16, coreMin: 6, gpuMin: 3
  },
  cad: {
    name: "CAD / CAM workstation",
    needs: { gpu: 2, cores: 3, ram: 3, storage: 2, cooling: 2 },
    says: "as much memory as it will take, a workstation graphics card and a lot of cores",
    ramMin: 64, coreMin: 12, gpuMin: 2
  },
  vm: {
    name: "Virtualization host",
    needs: { gpu: 0, cores: 3, ram: 3, storage: 3, cooling: 2 },
    says: "maximum memory and cores above everything else, with fast storage behind it",
    ramMin: 128, coreMin: 16, gpuMin: 0
  }
};

/* ------------------------------------------------------------------
   The incompatibilities. Each one is a real trap from the objectives,
   and each carries the SYMPTOM it produces at power-on. That symptom is
   what the student sees; the fault is what they have to work back to.
   ------------------------------------------------------------------ */
export const FAULTS = {
  socket: {
    name: "CPU does not match the board's socket",
    symptom: "Nothing at all. No fans, no beep, no display — the board never gets far enough to complain.",
    tell: "A machine that is completely silent has usually failed before POST even begins. The CPU is the first thing the board needs.",
    fix: "Match the CPU socket to the board's socket. They are physically different; it should not have gone in."
  },
  ramtype: {
    name: "RAM is the wrong generation for the board",
    symptom: "Fans spin, no display, and the board beeps three times in a repeating pattern.",
    tell: "Fans spinning means power is fine and the CPU is alive. Beeping means the board is far enough along to report a fault — and the memory beep code is the most common one there is.",
    fix: "DDR generations are keyed differently and are not interchangeable. Match the RAM generation to the board."
  },
  psuwatt: {
    name: "Power supply is undersized for the load",
    symptom: "It boots and runs fine on the desktop, then shuts off abruptly the moment a game or render starts.",
    tell: "Working at idle and dying under load is the signature of a supply that cannot deliver peak current. Nothing else fails this way.",
    fix: "Add up the real peak draw and choose a supply with headroom above it, not one that matches it."
  },
  gpulen: {
    name: "Graphics card is longer than the case allows",
    symptom: "Never gets as far as being switched on — the side panel will not close and the card fouls the drive cage.",
    tell: "This one is caught with a tape measure, not a screwdriver. It is a specification you check before ordering.",
    fix: "Check the case's maximum GPU length against the card, and the cooler height against the panel."
  },
  coolerht: {
    name: "CPU cooler is too tall for the case",
    symptom: "Everything fits electrically, but the side panel bows and will not screw down.",
    tell: "Another tape-measure fault. It has no electrical symptom at all, which is why it gets missed until assembly.",
    fix: "Check the case's maximum cooler height. Air coolers for high-core-count chips are frequently over 160mm."
  },
  m2lanes: {
    name: "The M.2 drive has disabled the SATA ports it shares lanes with",
    symptom: "It boots perfectly, but two of the SATA drives that were there yesterday have vanished from the BIOS.",
    tell: "Drives disappearing after adding an M.2 is almost always lane sharing, not a fault. The board's manual says which ports it costs you.",
    fix: "Read the board manual's lane-sharing table. Move the affected drives to ports that are not shared, or accept the loss."
  }
};

const CUSTOMERS = [
  { who: "Larkfield Design",       size: "Small Business" },
  { who: "Wren & Sons Engineering",size: "Small Business" },
  { who: "Vantage Studios",        size: "Mid-Market" },
  { who: "Colworth University — Media", size: "Mid-Market" },
  { who: "Ardent Simulation",      size: "Major Corporation" }
];

const JOBS = {
  gaming: {
    what: "a machine for the esports suite",
    said: ["the students play at high refresh and it has to hold the frame rate",
           "the graphics are the whole point — that is where the money should go",
           "it runs for hours at a time and the last one got uncomfortably hot"]
  },
  cad: {
    what: "a seat for the design office",
    said: ["they open assemblies with thousands of parts and the machine runs out of memory",
           "the renders are single files that take all afternoon",
           "the display has to be colour accurate, but that is a monitor question"]
  },
  vm: {
    what: "a host to consolidate the old servers",
    said: ["there are about twenty machines to move onto it and they all run at once",
           "memory is what we always run out of first, every single time",
           "nobody sits at it — it lives in the rack and we connect remotely"]
  }
};

const NOISE = [
  "The old one is going to the charity shop if you want it.",
  "Finance want it on this year's budget, so before April.",
  "The last supplier talked us into things we did not need.",
  "It has to go under the desk, not on it.",
  "We have spare monitors already, so leave those out of it."
];

/* Parts. Each carries the specs that matter for compatibility, so the
   compatibility check is computed rather than authored. */
const BOARDS = [
  { key: "b1", label: "Halden B760-Pro", socket: "LGA1700", ram: "DDR5", slots: 4, maxRam: 128, m2Shared: true },
  { key: "b2", label: "Corvid X670E",    socket: "AM5",     ram: "DDR5", slots: 4, maxRam: 192, m2Shared: true },
  { key: "b3", label: "Meritas Z590",    socket: "LGA1200", ram: "DDR4", slots: 4, maxRam: 128, m2Shared: false }
];

export function generate(seed) {
  const r = rng(seed);
  const profKey = r.pick(Object.keys(PROFILES));
  const profile = PROFILES[profKey];
  const customer = r.pick(CUSTOMERS);
  const job = JOBS[profKey];
  const board = r.pick(BOARDS);

  /* The fault the student's build will hit. Chosen from the ones that
     can actually occur for this profile — an undersized supply needs
     something power-hungry to be undersized FOR, and lane sharing needs
     a board that shares lanes. */
  const possible = Object.keys(FAULTS).filter(function (f) {
    if (f === "psuwatt") return profile.needs.gpu > 0;
    if (f === "gpulen") return profile.needs.gpu > 0;
    if (f === "m2lanes") return board.m2Shared;
    return true;
  });
  const fault = r.pick(possible);

  const budget = r.pick([1200, 1600, 2200, 2800, 3500]);
  const said = r.shuffle(job.said.concat(r.some(NOISE, 2)));

  /* The parts on the quote. One of them carries the fault. */
  const cpu = { label: r.pick(["Corvid R7-7700X", "Halden i7-14700K", "Meritas W5-2455"]),
                socket: fault === "socket" ? wrongSocket(r, board.socket) : board.socket,
                cores: Math.max(profile.coreMin, r.int(profile.coreMin, profile.coreMin + 8)), tdp: r.pick([105, 125, 170]) };
  const ram = { label: r.int(2, 4) * 16 + " GB kit",
                gen: fault === "ramtype" ? (board.ram === "DDR5" ? "DDR4" : "DDR5") : board.ram,
                gb: Math.max(profile.ramMin, r.pick([32, 64, 128])) };
  const gpu = profile.needs.gpu
    ? { label: r.pick(["Orrick RTX-4070", "Orrick RTX-4080", "Halden Pro W6800"]),
        watts: r.pick([200, 285, 320]), lengthMm: fault === "gpulen" ? r.int(340, 360) : r.int(240, 300) }
    : { label: "integrated graphics", watts: 0, lengthMm: 0 };
  /* The supply is sized FROM the real draw, not picked from a list.
     Fixed wattages looked undersized and were not: a 105 W CPU with a
     200 W card draws 385 W, and a "small" 500 W supply is comfortable
     for that. Two seeds in 240 generated a psuwatt fault the parts did
     not actually exhibit, so the compat question's own reasoning said
     "that is comfortable, not this one" about the answer it wanted. */
  const drawNow = cpu.tdp + gpu.watts + 80;
  const psu = { watts: fault === "psuwatt"
    ? Math.max(300, Math.floor((drawNow * 0.85) / 50) * 50)   /* genuinely short */
    : Math.max(650, Math.ceil((drawNow * 1.5) / 50) * 50) };  /* genuinely ample */
  psu.label = psu.watts + " W";
  const cooler = { label: r.pick(["Corvid NH-D15", "Halden AK620", "240mm AIO"]),
                   heightMm: fault === "coolerht" ? r.int(165, 175) : r.int(120, 155) };
  const kase = { label: r.pick(["Vantage Meshify", "Orrick Define 7", "Halden 4000D"]),
                 maxGpuMm: 330, maxCoolerMm: 160 };

  /* Real peak draw, used by the budget/POST arithmetic. */
  const draw = drawNow;

  return {
    seed: seed, customer: customer, profileKey: profKey, profile: profile, job: job,
    said: said, board: board, cpu: cpu, ram: ram, gpu: gpu, psu: psu, cooler: cooler,
    case: kase, budget: budget, fault: fault, faultInfo: FAULTS[fault], draw: draw,
    recommendedPsu: Math.ceil((draw * 1.4) / 50) * 50
  };
}

function wrongSocket(r, right) {
  const all = ["LGA1700", "AM5", "LGA1200", "AM4"].filter(function (s) { return s !== right; });
  return r.pick(all);
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */
function briefPanel(s) {
  return {
    kind: "brief",
    from: s.customer.who + " — " + s.customer.size,
    paragraphs: ["We need you to build " + s.job.what + ". Budget is about £" + s.budget.toLocaleString() + "."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

function partsPanel(s) {
  const rows = [
    { cells: ["Motherboard", s.board.label, s.board.socket + " · " + s.board.ram + " · " + s.board.slots + " slots"] },
    { cells: ["CPU", s.cpu.label, s.cpu.socket + " · " + s.cpu.cores + " cores · " + s.cpu.tdp + " W"] },
    { cells: ["Memory", s.ram.gb + " GB", s.ram.gen] },
    { cells: ["Graphics", s.gpu.label, s.gpu.watts ? s.gpu.watts + " W · " + s.gpu.lengthMm + " mm long" : "on the CPU"] },
    { cells: ["Power supply", s.psu.label, ""] },
    { cells: ["Cooler", s.cooler.label, s.cooler.heightMm + " mm tall"] },
    { cells: ["Case", s.case.label, "GPU up to " + s.case.maxGpuMm + " mm · cooler up to " + s.case.maxCoolerMm + " mm"] }
  ];
  return { kind: "table", title: "The parts on the quote", columns: ["", "Part", "Specification"], rows: rows };
}

/* The POST sequence as a mechanism view: what the board is doing, in
   order, and where this build stops. */
function postFrames(s) {
  const cols = [{ name: "Power", sub: "rails" }, { name: "CPU", sub: "and socket" },
                { name: "Memory", sub: "training" }, { name: "Video", sub: "output" }];
  const stopAt = { socket: 1, ramtype: 2, psuwatt: 4, gpulen: 0, coolerht: 0, m2lanes: 4 }[s.fault];
  function f(cap, states) {
    return { columns: cols, caption: cap,
      rows: [states.map(function (st) {
        return { label: st === "ok" ? "✓" : st === "stop" ? "✕" : "…",
                 tone: st === "ok" ? "data" : st === "stop" ? "dead" : null,
                 sub: st === "ok" ? "passed" : st === "stop" ? "STOPPED" : "waiting" };
      })] };
  }
  const frames = [
    f("Power good. The supply asserts POWER_GOOD and the board releases reset. Nothing has been tested yet — " +
      "this only says the rails came up.", ["ok", "wait", "wait", "wait"]),
    f("The board looks for a CPU in the socket and tries to start it. If there is nothing it can talk to, " +
      "everything stops here, silently — there is no code running yet to beep at you.",
      [ "ok", stopAt === 1 ? "stop" : "ok", "wait", "wait"]),
    f("Memory training. The board reads the modules, works out timings, and initialises them. " +
      "This is the first point at which the board can BEEP, because now there is firmware running.",
      ["ok", "ok", stopAt === 2 ? "stop" : "ok", "wait"]),
    f("Video initialises and the first image appears. Everything from here on is visible on screen rather than " +
      "guessed at from beeps.", ["ok", "ok", "ok", stopAt === 4 ? "ok" : "ok"])
  ];
  if (stopAt === 4) {
    frames.push(f("It POSTs, boots and idles happily — and then falls over the moment real load arrives. " +
      "A fault that only appears under load has already passed every test POST performs.",
      ["stop", "ok", "ok", "ok"]));
  }
  if (stopAt === 0) {
    frames.push(f("This build never gets switched on. The fault is mechanical, and it is found with a tape measure " +
      "at the ordering stage or with a side panel that will not close at the assembly stage.",
      ["wait", "wait", "wait", "wait"]));
  }
  return frames;
}

function partOptions(s) {
  /* Which single part is wrong. Every option names a real part from the
     quote, so this cannot be answered by spotting the odd one out. */
  const map = { socket: "cpu", ramtype: "ram", psuwatt: "psu", gpulen: "gpu", coolerht: "cooler", m2lanes: "board" };
  const right = map[s.fault];
  const all = [
    { key: "cpu",    label: "The CPU — " + s.cpu.label,
      why: "The CPU is " + s.cpu.socket + " and the board is " + s.board.socket +
        (s.cpu.socket === s.board.socket ? ". Those match, so it is not this." : ". Those do not match.") },
    { key: "ram",    label: "The memory — " + s.ram.gb + " GB " + s.ram.gen,
      why: "The memory is " + s.ram.gen + " and the board takes " + s.board.ram +
        (s.ram.gen === s.board.ram ? ". Those match, so it is not this." : ". Those are keyed differently and will not fit.") },
    { key: "psu",    label: "The power supply — " + s.psu.label,
      why: "Peak draw is about " + s.draw + " W and the supply is " + s.psu.watts + " W" +
        (s.psu.watts >= s.draw * 1.2 ? ", which is comfortable. Not this one." : " — no headroom at all.") },
    { key: "gpu",    label: "The graphics card — " + s.gpu.label,
      why: s.gpu.watts
        ? "The card is " + s.gpu.lengthMm + " mm and the case takes " + s.case.maxGpuMm + " mm" +
          (s.gpu.lengthMm <= s.case.maxGpuMm ? ". It fits. Not this one." : ". It does not fit.")
        : "There is no separate graphics card in this build." },
    { key: "cooler", label: "The cooler — " + s.cooler.label,
      why: "The cooler is " + s.cooler.heightMm + " mm and the case takes " + s.case.maxCoolerMm + " mm" +
        (s.cooler.heightMm <= s.case.maxCoolerMm ? ". It fits. Not this one." : ". The panel will not close.") },
    { key: "board",  label: "The motherboard — " + s.board.label,
      why: s.board.m2Shared
        ? "This board shares lanes between its M.2 slot and some SATA ports, which is why drives disappeared."
        : "This board does not share M.2 and SATA lanes, so that is not what happened here." }
  ];
  return all.map(function (o) { return Object.assign({}, o, { correct: o.key === right }); });
}

/* ------------------------------------------------------------------
   Stages
   ------------------------------------------------------------------ */
export function buildStage(key, s) {
  const P = s.profile;

  if (key === "brief") {
    return {
      title: "What are they actually building?",
      intro: "Three workloads, and they want very different machines. The brief describes the work, not the parts.",
      panels: [briefPanel(s)],
      questions: [{
        key: "bd-profile", kind: "choice",
        prompt: "Which kind of machine is this?",
        hints: [
          "Ignore everything about budget and deadlines. Two of the quotes describe what the machine has to DO all day — find those.",
          "The three workloads want different things first: one wants graphics, one wants memory and cores for one big job, one wants memory and cores for many small ones at once."
        ],
        options: Object.keys(PROFILES).map(function (k) {
          const pr = PROFILES[k];
          return { key: k, label: pr.name, correct: k === s.profileKey,
            why: k === s.profileKey
              ? "Right — they described " + pr.says + "."
              : "A " + pr.name.toLowerCase() + " is built for " + pr.says +
                ". That is not what this brief describes." };
        }).concat([{ key: "office", label: "A general office PC", correct: false,
          why: "Nothing in the brief describes ordinary office work. Specifying down to that would leave them unable to do the job they described." }]),
        explain: P.name + " — " + P.says + "."
      }]
    };
  }

  if (key === "parts") {
    /* WAS a pick-two-from-a-list question about where the money goes.
       That tested whether a student could recognise the right answer;
       it did not test whether they could BUILD anything. Now they pull
       parts off a shelf into a spec, and every wrong choice explains
       what it would cost this particular workload. */
    const P2 = s.profile;
    const shelf = {
      cpu: [
        { key: "cpu-lo", label: "6-core, 4.9 GHz", sub: "£210 · fast clock, few cores",
          good: P2.needs.cores < 3,
          why: P2.needs.cores < 3 ? "Right for this. The work is not spread across many cores, so clock speed is what it feels."
             : "Only six cores. This workload spreads across everything you give it and will sit waiting." },
        { key: "cpu-hi", label: "16-core, 4.1 GHz", sub: "£640 · many cores, lower clock",
          good: P2.needs.cores >= 3,
          why: P2.needs.cores >= 3 ? "Right. This work scales across cores and every one of them will be busy."
             : "Sixteen cores at a lower clock. Most of them idle here, and you have paid for them." },
        { key: "cpu-mid", label: "4-core, 3.6 GHz", sub: "£95 · office grade",
          good: false, why: "Office-grade. It will run, slowly, and the customer will be back." }
      ],
      ram: [
        { key: "ram-16", label: "16 GB", sub: "£55 · two sticks",
          good: P2.ramMin <= 16, why: P2.ramMin <= 16 ? "Enough for this workload." :
            "Below the " + P2.ramMin + " GB this work needs. It will swap to disk and crawl." },
        { key: "ram-64", label: "64 GB", sub: "£190 · four sticks",
          good: P2.ramMin > 16 && P2.ramMin <= 64,
          why: P2.ramMin > 16 && P2.ramMin <= 64 ? "Right — this is the amount they described running out of."
             : (P2.ramMin > 64 ? "Still short. They told you memory is the thing they run out of first."
                : "More than this work can use. The money would do more elsewhere.") },
        { key: "ram-128", label: "128 GB", sub: "£420 · four sticks",
          good: P2.ramMin > 64,
          why: P2.ramMin > 64 ? "Right. Twenty machines sharing one host is exactly what this is for."
             : "More memory than this workload will ever touch, and it is not cheap." }
      ],
      gpu: [
        { key: "gpu-none", label: "No card — integrated graphics", sub: "£0",
          good: P2.needs.gpu === 0,
          why: P2.needs.gpu === 0 ? "Right. Nobody sits at this machine; a card would draw power and do nothing."
             : "This workload needs a real card. Integrated graphics cannot do the job they described." },
        { key: "gpu-game", label: "High-end gaming card", sub: "£720 · 320 W",
          good: P2.needs.gpu >= 3,
          why: P2.needs.gpu >= 3 ? "Right — the graphics are the point of this machine."
             : "A lot of money and 320 W of heat for something this workload barely uses." },
        { key: "gpu-pro", label: "Workstation card", sub: "£890 · certified drivers",
          good: P2.needs.gpu === 2,
          why: P2.needs.gpu === 2 ? "Right. Certified drivers are what CAD software is tested against."
             : "Certified drivers cost real money and buy this workload nothing." }
      ],
      storage: [
        { key: "st-hdd", label: "2 TB spinning disk", sub: "£45",
          good: false, why: "Cheap per gigabyte and slow at everything. Nothing here is served by it." },
        { key: "st-nvme", label: "1 TB NVMe SSD", sub: "£85",
          good: P2.needs.storage < 3,
          why: P2.needs.storage < 3 ? "Right — fast enough for one user, and the money is better spent elsewhere."
             : "Fine for one machine. Twenty virtual machines hitting it at once will queue behind each other." },
        { key: "st-fast", label: "2 TB NVMe, high endurance", sub: "£240",
          good: P2.needs.storage >= 3,
          why: P2.needs.storage >= 3 ? "Right. Many machines writing at once is exactly what endurance ratings are about."
             : "Endurance rated for constant writing. This workload does not do that." }
      ]
    };
    const items = [];
    Object.keys(shelf).forEach(function (slot) {
      shelf[slot].forEach(function (it) { items.push({ key: it.key, label: it.label, sub: it.sub, slot: slot }); });
    });
    const SLOT_NAMES = { cpu: "Processor", ram: "Memory", gpu: "Graphics", storage: "Storage" };
    return {
      title: "Pull the parts",
      intro: "Everything on the shelf is a real part somebody buys. Build the spec this job needs, not the most expensive one.",
      panels: [briefPanel(s)],
      questions: [{
        key: "bd-spend", kind: "assign",
        prompt: "Fill each slot from the shelf.",
        detail: "Click a part, then click the slot. Click a filled slot to put it back.",
        hints: [
          "Go back to what they said the machine has to do all day, and fill the slot that serves that first. The rest follows from what is left.",
          "Money spent on something the workload never touches is money the workload cannot use. Ask, for each slot, what would actually happen if you went one step cheaper."
        ],
        items: items,
        slots: Object.keys(shelf).map(function (k) { return { key: k, label: SLOT_NAMES[k] }; }),
        check: function (filled) {
          const missing = Object.keys(shelf).filter(function (k) { return !filled[k]; });
          if (missing.length) {
            return { ok: false, why: "Still empty: " + missing.map(function (k) { return SLOT_NAMES[k]; }).join(", ") + "." };
          }
          /* A part in the wrong slot is a different mistake from a bad
             part, and it deserves a different sentence. */
          const misplaced = Object.keys(filled).filter(function (slot) {
            const it = items.filter(function (x) { return x.key === filled[slot]; })[0];
            return it && it.slot !== slot;
          });
          if (misplaced.length) {
            return { ok: false, why: "Something is in the wrong slot — a " +
              SLOT_NAMES[items.filter(function (x) { return x.key === filled[misplaced[0]]; })[0].slot].toLowerCase() +
              " part is sitting in the " + SLOT_NAMES[misplaced[0]].toLowerCase() + " slot." };
          }
          const bad = [];
          Object.keys(shelf).forEach(function (slot) {
            const chosen = shelf[slot].filter(function (x) { return x.key === filled[slot]; })[0];
            if (chosen && !chosen.good) bad.push(SLOT_NAMES[slot] + ": " + chosen.why);
          });
          if (bad.length) return { ok: false, why: bad[0] };
          return { ok: true, why: "That is a spec that does the job they described, without money in places this workload cannot feel." };
        },
        explain: "Spend where the workload is sensitive. For a " + P2.name + " that is " + P2.says + "."
      }]
    };
  }

  if (key === "compat") {
    return {
      title: "Do these parts actually go together?",
      intro: "Every part on this quote is a good part. That is not the same as being a good build.",
      panels: [partsPanel(s)],
      questions: [{
        key: "bd-compat", kind: "choice",
        prompt: "Check the quote against itself. Which part is wrong for this build?",
        hints: [
          "Go along the table comparing each part against the ONE it has to agree with: CPU against socket, memory against board generation, card against case, cooler against case, supply against total draw.",
          "Five of these six agree with their partner. Work out which pairing does not — the specification column has every number you need."
        ],
        options: partOptions(s),
        explain: s.faultInfo.name + ". " + s.faultInfo.fix
      }]
    };
  }

  if (key === "budget") {
    const spent = Math.round(s.budget * 0.86);
    return {
      title: "Does it fit the money?",
      intro: "The budget is a constraint like any other. Going over is a conversation; not knowing you have is a problem.",
      panels: [{
        kind: "table", title: "The quote",
        columns: ["", ""],
        rows: [
          { cells: ["Their budget", "£" + s.budget.toLocaleString()] },
          { cells: ["Parts as quoted", "£" + spent.toLocaleString()] },
          { cells: ["Peak power draw of these parts", s.draw + " W"] },
          { cells: ["Supply on the quote", s.psu.watts + " W"] }
        ]
      }],
      questions: [
        { key: "bd-left", kind: "number",
          prompt: "How much of the budget is left?",
          unit: "£", answer: s.budget - spent, tolerance: 1,
          hints: ["Both figures are in the table.",
                  "Budget minus what has been spent. The point of the question is having the number before you decide what to do with it."],
          explain: "£" + s.budget.toLocaleString() + " − £" + spent.toLocaleString() + " = £" + (s.budget - spent).toLocaleString() + "." },
        { key: "bd-psu", kind: "number",
          prompt: "What supply would you specify, allowing 40% headroom over peak draw?",
          unit: "W", answer: s.recommendedPsu, tolerance: 50,
          hints: [
            "Peak draw is in the table. Headroom means the supply should be that much bigger, not that much in total.",
            "Add 40% to the peak figure, then round up to a size supplies are actually sold in — they come in 50 W steps."
          ],
          explain: s.draw + " W × 1.4 = " + Math.round(s.draw * 1.4) + " W, rounded up to " + s.recommendedPsu +
            " W. Headroom is not waste: supplies are least efficient and least reliable at their ceiling." }
      ]
    };
  }

  if (key === "post") {
    const f = s.faultInfo;
    const others = Object.keys(FAULTS).filter(function (k) { return k !== s.fault; });
    const wrong = rng(s.seed + 3).some(others, 3);
    return {
      title: "Build it and hit the button",
      intro: "It is assembled. This is what happened.",
      panels: [{ kind: "note", title: "What the machine did", paragraphs: [f.symptom] },
               { kind: "mech", title: "What POST does, and where this build stops", frames: postFrames(s) }],
      questions: [{
        key: "bd-post", kind: "choice",
        prompt: "From that symptom alone, what is wrong?",
        hints: [
          "Step through the POST view above. Work out how FAR the machine got before it stopped — that alone rules out most of the list.",
          "A silent machine failed before any firmware ran. A beeping machine got far enough to report. A machine that runs and then dies under load passed every test POST does."
        ],
        options: rng(s.seed + 5).shuffle(
          [{ key: s.fault, label: f.name, correct: true, why: f.tell }].concat(
            wrong.map(function (k) {
              return { key: k, label: FAULTS[k].name, correct: false,
                why: "That would show as: " + FAULTS[k].symptom.charAt(0).toLowerCase() + FAULTS[k].symptom.slice(1) };
            }))),
        explain: f.tell + " " + f.fix
      }]
    };
  }

  if (key === "assemble") {
    return {
      title: "Build it in the right order",
      intro: "Some of this order is convenience. Some of it will cost you a motherboard.",
      panels: [{
        kind: "note", title: "Before you start",
        paragraphs: ["Anti-static strap on, connected to bare chassis metal. The board is out of its box and on the antistatic bag it came in."]
      }],
      questions: [{
        key: "as-order", kind: "order",
        prompt: "Put the assembly steps in order.",
        hints: [
          "Two of these are much easier outside the case than inside it, and one of them is nearly impossible once the board is mounted.",
          "Think about what physically blocks what. A cooler over the socket blocks the CPU; a mounted board blocks the back of itself; standoffs go under the board so they must come first."
        ],
        steps: [
          { key: "stand", at: 1, label: "Fit the case standoffs to match the board's mounting holes" },
          { key: "cpu",   at: 2, label: "Seat the CPU in the socket, outside the case" },
          { key: "ram2",  at: 3, label: "Fit the memory, outside the case" },
          { key: "cool",  at: 4, label: "Mount the CPU cooler" },
          { key: "mount", at: 5, label: "Mount the board on the standoffs" },
          { key: "psu2",  at: 6, label: "Fit the power supply and route its cables" },
          { key: "gpu2",  at: 7, label: "Fit the graphics card in the top slot" },
          { key: "power", at: 8, label: "Connect 24-pin, EPS and PCIe power" }
        ],
        explain: "Standoffs first — a board mounted on a missing or extra standoff can short. " +
          "CPU, memory and cooler go on outside the case, where you can see and reach. Board, supply, card, then power last."
      }]
    };
  }

  if (key === "thermal") {
    const idle = 38, load = Math.min(98, 55 + Math.round(s.cpu.tdp / 4));
    const throttleAt = 95;
    return {
      title: "Does it hold up under load?",
      intro: "A machine that is fast for ninety seconds is not fast. Thermals are what turn a spec sheet into performance.",
      panels: [{
        kind: "table", title: "Half an hour of sustained load",
        columns: ["", ""],
        rows: [
          { cells: ["CPU idle", idle + " °C"] },
          { cells: ["CPU under sustained load", load + " °C"], flag: load >= throttleAt ? "bad" : null },
          { cells: ["Throttle point for this chip", throttleAt + " °C"] },
          { cells: ["Cooler on the quote", s.cooler.label + ", " + s.cooler.heightMm + " mm"] }
        ]
      }],
      questions: [{
        key: "th-read", kind: "choice",
        prompt: "What do these numbers tell you?",
        hints: [
          "Compare the load temperature with the throttle point. The gap between them is the whole answer.",
          "Throttling is the chip protecting itself by slowing down. Ask whether this machine reaches that point, and what that means for the work it was bought for."
        ],
        options: [
          { key: "throt", label: "It reaches the throttle point, so it will slow itself down under sustained load",
            correct: load >= throttleAt,
            why: load >= throttleAt
              ? "Right — " + load + " °C against a " + throttleAt + " °C limit. It will clock down exactly when the work is heaviest."
              : "It gets to " + load + " °C and throttles at " + throttleAt + " °C. There is room." },
          { key: "fine", label: "It has headroom and will hold its clocks", correct: load < throttleAt,
            why: load < throttleAt
              ? "Right — " + load + " °C with the limit at " + throttleAt + " °C. That is a working margin."
              : "It does not. " + load + " °C is at or past the " + throttleAt + " °C throttle point." },
          { key: "idle", label: "The idle temperature is the problem", correct: false,
            why: idle + " °C at idle is unremarkable. Idle temperatures rarely tell you anything." },
          { key: "psu3", label: "It shows the power supply is undersized", correct: false,
            why: "An undersized supply shuts the machine off. It does not raise CPU temperature." }
        ],
        explain: load >= throttleAt
          ? "Throttling. More cooler, better case airflow, or a chip with a lower TDP."
          : "Comfortable. The margin is what lets it hold clocks through a long render."
      }]
    };
  }

  if (key === "lanes") {
    return {
      title: "Where did those drives go?",
      intro: "Nothing has broken. The board is doing exactly what its manual says it does.",
      panels: [{
        kind: "note", title: "What happened",
        paragraphs: [
          "An M.2 NVMe drive went into the second M.2 slot. The machine boots normally and the M.2 is there.",
          "Two SATA drives that were working yesterday no longer appear in the BIOS at all. Their cables and power are fine, and they work in another machine."
        ]
      }],
      questions: [{
        key: "ln-why", kind: "choice",
        prompt: "What has happened?",
        hints: [
          "Nothing is faulty — the drives work elsewhere. So ask what CHANGED, and what that change could have cost.",
          "A chipset has a fixed number of PCIe lanes to hand out. Fitting something that wants lanes means something else stops getting them."
        ],
        options: [
          { key: "share", label: "The M.2 slot shares its lanes with those SATA ports, and it took them", correct: true,
            why: "Right. The board's manual has a table showing exactly which ports each M.2 slot disables. It is a design decision, not a fault." },
          { key: "dead", label: "The SATA controller has failed", correct: false,
            why: "Then the other SATA ports would be gone too, and they are not. A failure does not pick two ports and stop." },
            { key: "power", label: "The power supply cannot support the extra drive", correct: false,
            why: "An NVMe drive draws a few watts. And a power shortfall does not make drives vanish from the BIOS — it makes the machine shut off." },
          { key: "bios", label: "The BIOS needs updating", correct: false,
            why: "The board is behaving exactly as documented. There is nothing to fix." }
        ],
        explain: "Lane sharing. Read the board manual's table before choosing which M.2 slot to use, or move the drives to unshared ports."
      }]
    };
  }

  if (key === "handover") {
    return {
      title: "Prove it does what they asked",
      intro: "The build is finished when the customer can see it does the job, not when it boots.",
      panels: [briefPanel(s)],
      questions: [{
        key: "hv-proof", kind: "choice",
        prompt: "What is the right way to show this machine meets the brief?",
        hints: [
          "Go back to what they actually said. What would convince the person who wrote that brief?",
          "A number in isolation proves nothing to a customer. The proof has to be the thing they described, done in front of them."
        ],
        options: [
          { key: "real", label: "Run their own workload on it while they watch, and show it holds up",
            correct: true,
            why: "Right. They described a job. Doing that job in front of them is the only proof that answers the brief they wrote." },
          { key: "bench", label: "Run a benchmark and give them the score", correct: false,
            why: "A score is a number they cannot interpret. It also does not test their software with their files." },
          { key: "spec", label: "Give them the spec sheet and confirm every part arrived", correct: false,
            why: "That proves you bought what you said. It does not prove the machine does the work." },
          { key: "burn", label: "Leave it running a stress test overnight and report that it passed", correct: false,
            why: "Worth doing for stability, but a stress test is not their workload and does not answer the brief." }
        ],
        explain: "Prove it against the brief, in the customer's own terms. Everything else is proof for you, not for them."
      }]
    };
  }

  throw new Error("lab-build: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js for why these
   live with the lab rather than in the verifier. */
export function selfCheck(sc) {
  const bad = [];
  if (!PROFILES[sc.profileKey]) return ["profile \"" + sc.profileKey + "\" is not in the table"];
  if (!FAULTS[sc.fault]) bad.push("fault \"" + sc.fault + "\" is not in the table");
  /* The generated fault must be POSSIBLE for the build generated. A
     lane-sharing fault on a board that does not share lanes, or an
     undersized supply on a machine with no graphics card, would be
     unanswerable — and only on the seeds that produced it. */
  if (sc.fault === "m2lanes" && !sc.board.m2Shared) bad.push("lane-sharing fault on a board that does not share lanes");
  if (sc.fault === "gpulen" && !sc.gpu.watts) bad.push("GPU-length fault on a build with no graphics card");
  if (sc.fault === "psuwatt" && !sc.gpu.watts) bad.push("undersized-supply fault on a build with no graphics card");
  /* Exactly one thing is wrong. If a second incompatibility slipped in,
     the compat question has two right answers and grades one of them
     wrong. */
  const wrongs = [];
  if (sc.cpu.socket !== sc.board.socket) wrongs.push("socket");
  if (sc.ram.gen !== sc.board.ram) wrongs.push("ramtype");
  if (sc.gpu.watts && sc.gpu.lengthMm > sc.case.maxGpuMm) wrongs.push("gpulen");
  if (sc.cooler.heightMm > sc.case.maxCoolerMm) wrongs.push("coolerht");
  if (sc.psu.watts < sc.draw * 1.2) wrongs.push("psuwatt");
  if (wrongs.length > 1) bad.push("more than one incompatibility present: " + wrongs.join(", "));
  const physical = ["socket", "ramtype", "gpulen", "coolerht", "psuwatt"];
  if (physical.indexOf(sc.fault) >= 0 && wrongs.indexOf(sc.fault) < 0)
    bad.push("fault \"" + sc.fault + "\" was chosen but the parts do not actually exhibit it");
  if (sc.recommendedPsu <= 0) bad.push("recommended supply is not positive");
  return bad;
}

export function variantKey(sc) { return sc.profileKey + "/" + sc.fault; }
