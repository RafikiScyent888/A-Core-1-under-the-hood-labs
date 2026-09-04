/* =====================================================================
   The lab registry.

   Six labs, each authored as a TIERED STAGE LIST. The student picks a
   length before starting and that choice selects tiers, not a truncation:

     quick    core
     lab      core + lab
     project  core + lab + project
     layered  core, with the rest offered inline as optional depth

   THE RULE THAT MAKES THIS WORK, and the one to check any new stage
   against: the `core` path must be a complete, coherent job on its own.
   A longer choice ADDS work; it never unlocks the conclusion the short
   path was missing. If Quick reads as a Project with the end cut off,
   the stage was filed in the wrong tier.

   Practically that means core carries the whole arc — brief, build,
   test, result — and lab/project deepen the middle. It is the middle
   that stretches, never the ending.
   ===================================================================== */

export const TIERS = ["core", "lab", "project"];

export const LENGTHS = {
  quick: {
    label: "Quick — 10 to 20 minutes",
    note: "One sitting. The whole job, at its shortest. Good for repeating a lab you got wrong.",
    tiers: ["core"]
  },
  lab: {
    label: "Lab — 30 to 45 minutes",
    note: "A class period. The same job with the middle opened up.",
    tiers: ["core", "lab"]
  },
  project: {
    label: "Project — an hour or more",
    note: "The full job, every stage. Your progress is saved, so you can close this and come back.",
    tiers: ["core", "lab", "project"]
  },
  layered: {
    label: "Layered — short, with optional depth",
    note: "The Quick path, but every deeper stage is offered as you reach it. Take the ones you want.",
    tiers: ["core"],
    offersRest: true
  }
};

/* Each stage: what the student DOES, which of the four exam gaps it
   attacks, and the tier it belongs to. `gaps` is not decoration — every
   lab has to cover all four across its core path, and the verifier
   checks exactly that. See "The four things students are losing marks
   on" in CLAUDE.md.

     pbq    a hands-on task, done rather than chosen from a list
     why    the mechanism view; the thing that survives rewording
     calc   a graded calculation under time
     read   the spec is buried in customer waffle and must be found */
export const GAPS = {
  pbq: "Hands-on task",
  why: "Mechanism — the why",
  calc: "Calculation",
  read: "Reading the brief"
};

export const LABS = [
  {
    key: "printer",
    name: "Printer",
    blurb: "Laser, inkjet, thermal and impact. Deploy one, then read a bad page and work backwards to the part that made it.",
    /* All four types, because all four are on the exam — the owner was
       explicit about that when the scope was set. */
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Read the customer's brief and pull out the real requirement" },
      { key: "choose",   tier: "core",    gaps: ["pbq", "why"],  title: "Choose the printer type the job actually needs" },
      { key: "deploy",   tier: "core",    gaps: ["pbq"],         title: "Get it on the network and printing" },
      { key: "defect",   tier: "core",    gaps: ["why"],         title: "Read the defect on the page and name the part" },
      { key: "duty",     tier: "core",    gaps: ["calc"],        title: "Work out their monthly volume and check it against the duty cycle" },
      { key: "imaging",  tier: "lab",     gaps: ["why"],         title: "Walk a page through the seven-step laser imaging process" },
      { key: "consum",   tier: "lab",     gaps: ["calc"],        title: "Work out consumable life and what the maintenance kit costs per page" },
      { key: "scanflow", tier: "project", gaps: ["pbq"],         title: "Scan to folder and email, with secure print release" },
      { key: "fleet",    tier: "project", gaps: ["calc", "read"],title: "Size a fleet against a department's monthly volume" }
    ]
  },
  {
    key: "build",
    name: "Workstation Build",
    blurb: "Gaming, CAD/CAM or virtualization host. Spec it, build it, power it on — and if it does not POST, that is yours to fix.",
    /* Three configurations, chosen by the owner. Deliberately NOT NAS or
       thin client. */
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Find the real spec inside the customer's description" },
      { key: "parts",    tier: "core",    gaps: ["pbq", "why"],  title: "Choose parts that suit the workload, not just the budget" },
      { key: "compat",   tier: "core",    gaps: ["why"],         title: "Check they actually fit together" },
      { key: "budget",   tier: "core",    gaps: ["calc"],        title: "Fit it inside their money, and work out where that money is worth spending" },
      { key: "post",     tier: "core",    gaps: ["pbq"],         title: "Assemble, power on, and deal with whatever POST says" },
      { key: "assemble", tier: "lab",     gaps: ["pbq"],         title: "Build in the right order — standoffs, CPU, cooler, cables" },
      { key: "thermal",  tier: "lab",     gaps: ["calc", "why"], title: "Check it holds up under load without throttling" },
      { key: "lanes",    tier: "project", gaps: ["why"],         title: "Sort out M.2 and SATA sharing the same lanes" },
      { key: "handover", tier: "project", gaps: ["read"],        title: "Prove to the customer it does what they asked for" }
    ]
  },
  {
    key: "raid",
    name: "RAID",
    blurb: "Pick the level the business actually needs, build it, then lose a drive and nurse the rebuild — with everything the controller is doing on show.",
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Work out what the business needs from the way they described it" },
      { key: "level",    tier: "core",    gaps: ["why"],         title: "Choose the RAID level, and be able to say why not the others" },
      { key: "capacity", tier: "core",    gaps: ["calc"],        title: "Work out usable capacity and how many drives you can lose" },
      { key: "fail",     tier: "core",    gaps: ["pbq"],         title: "A drive fails — replace it and bring the array back" },
      { key: "parity",   tier: "lab",     gaps: ["why"],         title: "Watch parity being written, and see what it buys you" },
      { key: "rebuild",  tier: "lab",     gaps: ["why", "calc"], title: "Nurse a rebuild, and find out what a second failure costs" },
      { key: "spare",    tier: "project", gaps: ["pbq"],         title: "Set up a hot spare and prove it takes over" },
      { key: "ctrl",     tier: "project", gaps: ["why"],         title: "Hardware against software RAID, and why the cache has a battery" }
    ]
  },
  {
    key: "power",
    name: "Power",
    blurb: "Budget the load, cable it for real, size the UPS, then put a meter on it. Undersize the supply and you will find out under load.",
    /* All four of the owner's choices are represented: budget, cable,
       UPS sizing, measure. */
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Work out what this machine actually has to run" },
      { key: "budget",   tier: "core",    gaps: ["calc"],        title: "Add up the draw and pick a supply with headroom" },
      { key: "cable",    tier: "core",    gaps: ["pbq"],         title: "Cable it — 24-pin, EPS, PCIe, SATA, front panel" },
      { key: "load",     tier: "core",    gaps: ["why"],         title: "Run it under load and live with what you chose" },
      { key: "meter",    tier: "lab",     gaps: ["pbq", "why"],  title: "Put a meter on the rails and read what it tells you" },
      { key: "ups",      tier: "lab",     gaps: ["calc"],        title: "Size a UPS — VA against watts, and how long it holds" },
      { key: "protect",  tier: "project", gaps: ["why", "read"], title: "Decide what goes on battery, what gets surge only, and what a surge strip will not save" },
      { key: "mains",    tier: "project", gaps: ["why"],         title: "115 against 230, and what the selector switch does if you get it wrong" }
    ]
  },
  {
    key: "wap",
    name: "Wireless AP",
    blurb: "Survey the floor, place the AP, plan the channels — with six sources of interference fighting you, and more than one running at once.",
    /* Six interferences, microwave required by name. They STACK: more
       than one can be live, and the student has to find the dominant
       one rather than the first one they spot. */
    interference: [
      { key: "microwave",  name: "Microwave oven",            band: "2.4", pattern: "intermittent" },
      { key: "cordless",   name: "Cordless phone / baby monitor", band: "2.4", pattern: "continuous" },
      { key: "bluetooth",  name: "Bluetooth density",         band: "2.4", pattern: "hopping" },
      { key: "neighbour",  name: "Neighbouring APs, overlapping channels", band: "both", pattern: "co-channel" },
      { key: "materials",  name: "Concrete, metal, mirrors, water", band: "both", pattern: "attenuation" },
      { key: "ballast",    name: "Fluorescent ballasts",      band: "2.4", pattern: "broadband" }
    ],
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Work out the coverage the site actually needs" },
      { key: "survey",   tier: "core",    gaps: ["pbq"],         title: "Walk the floor and take signal and noise readings" },
      { key: "place",    tier: "core",    gaps: ["why"],         title: "Place the AP where the readings say it should go" },
      { key: "channel",  tier: "core",    gaps: ["calc", "why"], title: "Plan channels around whatever else is on the air" },
      { key: "identify", tier: "lab",     gaps: ["why"],         title: "Work out which interference is the dominant one" },
      { key: "band",     tier: "lab",     gaps: ["why"],         title: "2.4, 5 and 6 GHz — range against throughput against congestion" },
      { key: "install",  tier: "project", gaps: ["pbq"],         title: "Mount it and get power to it — PoE injector or switch" },
      { key: "power",    tier: "project", gaps: ["calc"],        title: "Set transmit power and antenna so you cover the floor and not the car park" }
    ]
  },
  {
    key: "mobile",
    name: "Device & Mobile",
    blurb: "Phones and tablets, inside and out. Laptops only where the fault is a mobile one the service centre does not cover.",
    /* Scope was set deliberately: phones and tablets are the core, and
       laptops appear ONLY for mobile-specific faults — swollen cells,
       digitizers, sync, MDM. General laptop repair belongs to the Field
       Service Center and must not be duplicated here. */
    stages: [
      { key: "brief",    tier: "core",    gaps: ["read"],        title: "Get the real fault out of what the user told you" },
      { key: "triage",   tier: "core",    gaps: ["why"],         title: "Decide whether it is hardware, software or the user's setup" },
      { key: "digitizer",tier: "core",    gaps: ["pbq", "why"],  title: "Tell a dead digitizer from a dead display, without guessing" },
      { key: "safety",   tier: "core",    gaps: ["pbq"],         title: "Handle a swollen battery without making it worse" },
      { key: "health",   tier: "core",    gaps: ["calc"],        title: "Read the battery health figures — worn out, or is something draining it?" },
      { key: "power",    tier: "lab",     gaps: ["calc"],        title: "Chase battery drain and work out what is eating it" },
      { key: "charge",   tier: "lab",     gaps: ["pbq"],         title: "Charging port, cable and adapter — find which one is at fault" },
      { key: "sync",     tier: "project", gaps: ["read"],        title: "Set up mail, sync and MDM enrolment from the company's instructions" },
      { key: "radio",    tier: "project", gaps: ["why"],         title: "Poor signal, no GPS, Bluetooth pairing — work out which radio" }
    ]
  }
];

/* ------------------------------------------------------------------
   Load-time checks. Same spirit as every other keyed table in this
   program: a lab that quietly has no core path, or a stage filed under
   a tier nothing selects, would simply never be seen — and nobody would
   find out. That is the failure mode worth spending code on.
   ------------------------------------------------------------------ */
const seen = {};
LABS.forEach(function (lab) {
  if (seen[lab.key]) throw new Error('labs: duplicate lab key "' + lab.key + '"');
  seen[lab.key] = true;
  if (!lab.stages || !lab.stages.length) {
    throw new Error('labs: "' + lab.key + '" has no stages.');
  }
  const core = lab.stages.filter(function (s) { return s.tier === "core"; });
  if (core.length < 3) {
    throw new Error('labs: "' + lab.key + '" has ' + core.length + ' core stages. The ' +
      "Quick path has to be a complete job on its own, not an introduction.");
  }
  /* Every lab must attack all four gaps on its CORE path, not merely
     somewhere in the full stage list. A student who only ever picks
     Quick is the student most in need of all four. */
  const covered = {};
  core.forEach(function (s) { (s.gaps || []).forEach(function (g) { covered[g] = true; }); });
  const missing = Object.keys(GAPS).filter(function (g) { return !covered[g]; });
  if (missing.length) {
    throw new Error('labs: "' + lab.key + '" core path does not attack ' +
      missing.join(", ") + '. All four gaps have to be covered by the short path.');
  }
  lab.stages.forEach(function (s) {
    if (TIERS.indexOf(s.tier) < 0) {
      throw new Error('labs: "' + lab.key + '/' + s.key + '" has tier "' + s.tier +
        '", which no length selects. It would never be reachable.');
    }
    (s.gaps || []).forEach(function (g) {
      if (!GAPS[g]) throw new Error('labs: "' + lab.key + '/' + s.key + '" claims unknown gap "' + g + '"');
    });
  });
});

/* The stages a length actually runs, in order. */
export function stagesFor(lab, lengthKey) {
  const len = LENGTHS[lengthKey];
  if (!len) throw new Error('labs: no length "' + lengthKey + '"');
  return lab.stages.filter(function (s) { return len.tiers.indexOf(s.tier) >= 0; });
}

/* The stages a layered run offers as optional depth. Empty for the
   fixed lengths — asking for them there is a mistake worth surfacing. */
export function optionalFor(lab, lengthKey) {
  const len = LENGTHS[lengthKey];
  if (!len) throw new Error('labs: no length "' + lengthKey + '"');
  if (!len.offersRest) return [];
  return lab.stages.filter(function (s) { return len.tiers.indexOf(s.tier) < 0; });
}

export function labByKey(key) {
  return LABS.filter(function (l) { return l.key === key; })[0] || null;
}
