/* =====================================================================
   The lab registry.

   Eight labs, each authored as a TIERED STAGE LIST. The student picks a
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


/* =====================================================================
   THE OBJECTIVES, VERBATIM FROM THE EXAM BLUEPRINT

   CompTIA A+ Core 1, 220-1201. 27 sub-objectives across five domains.

   This list is the single source of truth for what this build claims to
   cover, and it exists because for a long time nothing here was tagged at
   all — coverage was a question nobody could answer without reading 54
   stage titles and guessing. That is not a thing to leave in a teaching
   build, because a gap you cannot see is a gap a student walks into.

   Every stage now carries `objs`, and the verify suite fails if a stage
   names an objective that does not exist here, or if an objective is
   neither covered nor explicitly and reasonedly out of scope.
   ===================================================================== */
export const OBJECTIVES = [
  { id: "1.1", domain: "Mobile Devices", title: "Given a scenario, monitor mobile device hardware and use appropriate replacement" },
  { id: "1.2", domain: "Mobile Devices", title: "Compare and contrast accessories and connectivity options for mobile devices" },
  { id: "1.3", domain: "Mobile Devices", title: "Given a scenario, configure basic mobile device network connectivity and provide support" },

  { id: "2.1", domain: "Networking", title: "Compare and contrast TCP and UDP ports, protocols and their purposes" },
  { id: "2.2", domain: "Networking", title: "Explain wireless networking technologies" },
  { id: "2.3", domain: "Networking", title: "Summarize services provided by networked hosts" },
  { id: "2.4", domain: "Networking", title: "Explain common network configuration concepts" },
  { id: "2.5", domain: "Networking", title: "Compare and contrast common networking hardware devices" },
  { id: "2.6", domain: "Networking", title: "Given a scenario, configure basic wired and wireless SOHO networks" },
  { id: "2.7", domain: "Networking", title: "Compare and contrast internet connection types, network types and their features" },
  { id: "2.8", domain: "Networking", title: "Explain networking tools and their purposes" },

  { id: "3.1", domain: "Hardware", title: "Compare and contrast display components and attributes" },
  { id: "3.2", domain: "Hardware", title: "Summarize basic cable types, connectors, features and purposes" },
  { id: "3.3", domain: "Hardware", title: "Compare and contrast RAM characteristics" },
  { id: "3.4", domain: "Hardware", title: "Compare and contrast storage devices" },
  { id: "3.5", domain: "Hardware", title: "Given a scenario, install and configure motherboards, CPUs and add-on cards" },
  { id: "3.6", domain: "Hardware", title: "Given a scenario, install the appropriate power supply" },
  { id: "3.7", domain: "Hardware", title: "Given a scenario, deploy and configure multifunction devices and printers" },
  { id: "3.8", domain: "Hardware", title: "Given a scenario, perform appropriate printer maintenance" },

  { id: "4.1", domain: "Virtualization and Cloud Computing", title: "Explain virtualization concepts" },
  { id: "4.2", domain: "Virtualization and Cloud Computing", title: "Summarize cloud computing concepts" },

  { id: "5.1", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot motherboards, RAM, CPUs and power" },
  { id: "5.2", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot drive and RAID issues" },
  { id: "5.3", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot video, projector and display issues" },
  { id: "5.4", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot common mobile device issues" },
  { id: "5.5", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot network issues" },
  { id: "5.6", domain: "Hardware and Network Troubleshooting", title: "Given a scenario, troubleshoot printer issues" }
];

export function objectiveById(id) {
  return OBJECTIVES.filter(function (o) { return o.id === id; })[0] || null;
}

export const LABS = [
  {
    key: "printer",
    name: "Printer",
    blurb: "Laser, inkjet, thermal and impact. Deploy one, then read a bad page and work backwards to the part that made it.",
    /* All four types, because all four are on the exam — the owner was
       explicit about that when the scope was set. */
    stages: [
      { key: "brief", objs: ["3.7"],    tier: "core",    gaps: ["read"],        title: "Read the customer's brief and pull out the real requirement" },
      { key: "choose", objs: ["3.7"],   tier: "core",    gaps: ["pbq", "why"],  title: "Choose the printer type the job actually needs" },
      { key: "deploy", objs: ["3.7", "2.4"],   tier: "core",    gaps: ["pbq"],         title: "Get it on the network and printing" },
      { key: "fit", objs: ["3.7", "3.8"], tier: "core",  gaps: ["pbq", "why"],  title: "Put the parts where they belong \u2014 and leave out the ones that do not" },
      { key: "callout", objs: ["3.7", "5.6"], tier: "core", gaps: ["read", "why"], title: "A service call \u2014 read what changed before you replace anything" },
      { key: "defect", objs: ["5.6"],   tier: "core",    gaps: ["why"],         title: "Read the defect on the page and name the part" },
      { key: "duty", objs: ["3.7"],     tier: "core",    gaps: ["calc"],        title: "Work out their monthly volume and check it against the duty cycle" },
      { key: "imaging", objs: ["3.8"],  tier: "lab",     gaps: ["why"],         title: "Walk a page through the seven-step laser imaging process" },
      /* 3.8's other half. The two stages above it are both laser, so a
         student could finish this lab having done no thermal maintenance
         at all — on the technology they will meet most often behind a
         counter and the one that is quickest to get right. */
      { key: "thermal", objs: ["3.8", "5.6"], tier: "lab", gaps: ["pbq", "why"],  title: "Service the thermal label printer and prove it prints" },
      /* 3.8's last third. Impact is the technology students are least
         likely to have touched and most likely to meet in a warehouse,
         and two of its five faults produce an identical page — which is
         the point of putting it in front of them. */
      { key: "impact", objs: ["3.8", "5.6"], tier: "lab", gaps: ["why", "pbq"],   title: "Service the dot matrix, where two faults look identical on the page" },
      /* The fourth technology, and the one students own. Its confusable
         pair is separated by WHEN the fault appears rather than by what
         it looks like, which is a habit worth building. */
      { key: "inkjet", objs: ["3.8", "5.6"], tier: "lab", gaps: ["read", "why"],  title: "Service the inkjet, where the answer is when it happens, not what it looks like" },
      /* Every other stage presents a part that has already failed. This
         one presents a part on the way out, because that is most of the
         actual job and none of the rest of the lab covered it.

         CORE, NOT LAB, AND THAT IS THE POINT OF PUTTING IT HERE.

         The Quick path is core only, and core was five stages of reading
         and arithmetic: a coherent lab that showed a student not one of
         the four machines it had just built for them. The owner said so
         plainly. This stage is the fix, because it is the one place in
         the whole build where THE 3D MODEL IS THE ANSWER SURFACE \u2014 a
         good part and the worn one side by side, and the student answers
         by clicking the damage on the part rather than picking a
         sentence underneath it.

         It also brings 3.8 into the short path, which until now was
         reachable only by choosing Lab or longer. */
      { key: "wear", objs: ["3.8", "5.6"], tier: "core", gaps: ["read", "why"],  title: "Read how worn a part is, and decide what that means today" },
      { key: "consum", objs: ["3.8"],   tier: "lab",     gaps: ["calc"],        title: "Work out consumable life and what the maintenance kit costs per page" },
      { key: "scanflow", objs: ["3.7"], tier: "project", gaps: ["pbq"],         title: "Scan to folder and email, with secure print release" },
      { key: "fleet", objs: ["3.7"],    tier: "project", gaps: ["calc", "read"],title: "Size a fleet against a department's monthly volume" }
    ]
  },
  {
    key: "build",
    name: "Workstation Build",
    blurb: "Gaming, CAD/CAM or virtualization host. Spec it, build it, power it on — and if it does not POST, that is yours to fix.",
    /* Three configurations, chosen by the owner. Deliberately NOT NAS or
       thin client. */
    stages: [
      { key: "brief", objs: ["3.5"],    tier: "core",    gaps: ["read"],        title: "Find the real spec inside the customer's description" },
      { key: "parts", objs: ["3.3", "3.4", "3.5"],    tier: "core",    gaps: ["pbq", "why"],  title: "Choose parts that suit the workload, not just the budget" },
      { key: "compat", objs: ["3.3", "3.5"],   tier: "core",    gaps: ["why"],         title: "Check they actually fit together" },
      { key: "budget", objs: ["3.5"],   tier: "core",    gaps: ["calc"],        title: "Fit it inside their money, and work out where that money is worth spending" },
      { key: "post", objs: ["5.1"],     tier: "core",    gaps: ["pbq"],         title: "Assemble, power on, and deal with whatever POST says" },
      { key: "assemble", objs: ["3.5"], tier: "lab",     gaps: ["pbq"],         title: "Build in the right order — standoffs, CPU, cooler, cables" },
      { key: "thermal", objs: ["5.1"],  tier: "lab",     gaps: ["calc", "why"], title: "Check it holds up under load without throttling" },
      { key: "lanes", objs: ["3.4", "3.5"],    tier: "project", gaps: ["why"],         title: "Sort out M.2 and SATA sharing the same lanes" },
      /* The four Core 1 workstation sims. They overlap the stages above
         and that is the point rather than a reason to prune \u2014 a student
         who cannot specify a build from a brief may still get there by
         being handed one that is already wrong. Two routes to one
         objective is the deliverable. */
      { key: "twobuilds", objs: ["3.3", "3.4", "3.5"], tier: "core", gaps: ["pbq", "read"], title: "Two machines from one shelf, where almost every slot answers differently" },
      { key: "symptom", objs: ["5.1"],  tier: "core",    gaps: ["pbq", "read"], title: "Watch what a machine does at power-on and name the subsystem" },
      { key: "specs", objs: ["5.1", "3.3"], tier: "lab", gaps: ["read", "why"], title: "Read every plate against the firmware, and find the one that disagrees" },
      { key: "swap", objs: ["3.5", "3.6"], tier: "lab",  gaps: ["read", "why"], title: "A baseline that is already wrong, and two changes to fix it" },
      { key: "handover", objs: ["3.5"], tier: "project", gaps: ["read"],        title: "Prove to the customer it does what they asked for" }
    ]
  },
  {
    key: "raid",
    name: "RAID",
    blurb: "Pick the level the business actually needs, build it, then lose a drive and nurse the rebuild — with everything the controller is doing on show.",
    stages: [
      { key: "brief", objs: ["3.4"],    tier: "core",    gaps: ["read"],        title: "Work out what the business needs from the way they described it" },
      { key: "level", objs: ["3.4"],    tier: "core",    gaps: ["why"],         title: "Choose the RAID level, and be able to say why not the others" },
      { key: "capacity", objs: ["3.4"], tier: "core",    gaps: ["calc"],        title: "Work out usable capacity and how many drives you can lose" },
      { key: "populate", objs: ["3.4"], tier: "core",    gaps: ["pbq", "why"],  title: "Build the array \u2014 fit the right drives and account for the ones you left" },
      { key: "fail", objs: ["5.2"],     tier: "core",    gaps: ["pbq"],         title: "A drive fails — replace it and bring the array back" },
      { key: "logs", objs: ["5.2"],     tier: "lab",     gaps: ["pbq", "read"], title: "Read every drive\u2019s own log, then replace the one that has gone" },
      { key: "parity", objs: ["3.4"],   tier: "lab",     gaps: ["why"],         title: "Watch parity being written, and see what it buys you" },
      { key: "rebuild", objs: ["5.2"],  tier: "lab",     gaps: ["why", "calc", "pbq"], title: "Nurse a rebuild, and find out what a second failure costs" },
      { key: "spare", objs: ["5.2"],    tier: "project", gaps: ["pbq"],         title: "Set up a hot spare and prove it takes over" },
      { key: "ctrl", objs: ["3.4"],     tier: "project", gaps: ["why"],         title: "Hardware against software RAID, and why the cache has a battery" }
    ]
  },
  {
    key: "net",
    name: "Networking & Infrastructure",
    blurb: "One path from the provider's handoff to the desk, and every fault somewhere on it. Pick the link, pick the kit, open the right ports, then walk the path and find the break.",
    /* Eight objectives that had nothing at all before this lab. Recall is
       delivered as a job rather than as a list: you do not memorise 3389,
       you open it because remote desktop is blocked. */
    stages: [
      { key: "brief",  objs: ["2.7"],        tier: "core",    gaps: ["read", "calc"], title: "Work out which internet link this site can actually have" },
      { key: "kit",    objs: ["2.5"],        tier: "core",    gaps: ["why"],         title: "Pick the right box for each job on the walk-round" },
      { key: "ports",  objs: ["2.1"],        tier: "core",    gaps: ["pbq"],         title: "Open the ports their services need, and nothing else" },
      { key: "fault",  objs: ["5.5", "2.8"], tier: "core",    gaps: ["pbq"],         title: "Walk the path and find where the fault is" },
      { key: "hosts",  objs: ["2.3"],        tier: "lab",     gaps: ["why"],         title: "Work out which server stopped doing its job" },
      { key: "tools",  objs: ["2.8"],        tier: "lab",     gaps: ["pbq"],         title: "Choose the tool for a fault you cannot see" },
      { key: "virt",   objs: ["4.1"],        tier: "project", gaps: ["calc", "why"], title: "Consolidate the cupboard onto one host" },
      { key: "cloud",  objs: ["4.2"],        tier: "project", gaps: ["read", "why"], title: "Decide what belongs on somebody else's hardware, and on what terms" },
      { key: "prove",  objs: ["5.5"],        tier: "project", gaps: ["read"],        title: "Prove the fix and explain it without an acronym" }
    ]
  },
  {
    key: "display",
    name: "Display",
    blurb: "What a screen is made of, what can carry a picture into it, and why a dark panel and a dead backlight look identical from the front.",
    /* 3.1, 1.2 and 5.3 together, because from a student's side of the desk
       they are one job: "there is no picture" needs all three to answer. */
    stages: [
      { key: "panel",     objs: ["3.1"],        tier: "core",    gaps: ["read", "why"],  title: "Choose the panel technology the job actually needs" },
      { key: "connect",   objs: ["1.2", "3.1"], tier: "core",    gaps: ["pbq"],          title: "Get a picture from the laptop into the display" },
      { key: "fault",     objs: ["5.3"],        tier: "core",    gaps: ["pbq"],          title: "Find what has failed behind a dark screen" },
      { key: "specs",     objs: ["3.1"],        tier: "core",    gaps: ["calc", "why"],  title: "Read the numbers on the box and say who benefits" },
      { key: "dock",      objs: ["1.2"],        tier: "lab",     gaps: ["read", "pbq"],  title: "Two monitors and one thing to plug in" },
      { key: "projector", objs: ["5.3"],        tier: "lab",     gaps: ["why"],          title: "A projector dimming and shutting itself off" },
      /* The Core 1 Device Issue Diagnosis Lab. Six of its ten devices are
         screens and projectors, so it lives here rather than with the
         workstation material it was filed under. */
      { key: "diagnose",  objs: ["5.3"],        tier: "core",    gaps: ["read", "why"],  title: "Name the issue AND the fix, from a symptom you can see" },
      { key: "prove",     objs: ["5.3"],        tier: "project", gaps: ["read"],         title: "Name the part and quote for it" }
    ]
  },
  {
    key: "power",
    name: "Power",
    blurb: "Budget the load, cable it for real, size the UPS, then put a meter on it. Undersize the supply and you will find out under load.",
    /* All four of the owner's choices are represented: budget, cable,
       UPS sizing, measure. */
    stages: [
      { key: "brief", objs: ["3.6"],    tier: "core",    gaps: ["read"],        title: "Work out what this machine actually has to run" },
      { key: "budget", objs: ["3.6"],   tier: "core",    gaps: ["calc"],        title: "Add up the draw and pick a supply with headroom" },
      { key: "cable", objs: ["3.6", "3.2"],    tier: "core",    gaps: ["pbq"],         title: "Cable it — 24-pin, EPS, PCIe, SATA, front panel" },
      { key: "load", objs: ["5.1"],     tier: "core",    gaps: ["why"],         title: "Run it under load and live with what you chose" },
      { key: "meter", objs: ["5.1"],    tier: "lab",     gaps: ["pbq", "why"],  title: "Put a meter on the rails and read what it tells you" },
      { key: "ups", objs: ["3.6"],      tier: "lab",     gaps: ["calc"],        title: "Size a UPS — VA against watts, and how long it holds" },
      /* The Core 1 Power Source Drag & Drop. `protect` below asks what
         goes on the battery; this asks the half it does not — what plugs
         into what — and corrects the source sim on the UPS. */
      { key: "chain", objs: ["3.6"],    tier: "core",    gaps: ["why", "pbq"],  title: "What plugs into what, and which nine things go where" },
      { key: "protect", objs: ["3.6"],  tier: "project", gaps: ["why", "read"], title: "Decide what goes on battery, what gets surge only, and what a surge strip will not save" },
      { key: "mains", objs: ["3.6"],    tier: "project", gaps: ["why"],         title: "115 against 230, and what the selector switch does if you get it wrong" }
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
      { key: "brief", objs: ["2.6"],    tier: "core",    gaps: ["read"],        title: "Work out the coverage the site actually needs" },
      { key: "survey", objs: ["2.2", "2.6"],   tier: "core",    gaps: ["pbq"],         title: "Walk the floor and take signal and noise readings" },
      { key: "place", objs: ["2.6"],    tier: "core",    gaps: ["why"],         title: "Place the AP where the readings say it should go" },
      { key: "channel", objs: ["2.2", "2.6"],  tier: "core",    gaps: ["calc", "why"], title: "Plan channels around whatever else is on the air" },
      { key: "identify", objs: ["2.2"], tier: "lab",     gaps: ["why"],         title: "Work out which interference is the dominant one" },
      { key: "band", objs: ["2.2"],     tier: "lab",     gaps: ["why"],         title: "2.4, 5 and 6 GHz — range against throughput against congestion" },
      /* The Core 1 WAP Installation Simulation. Every other stage in
         this lab is about the air; an access point with no cable to it
         radiates nothing at all. */
      { key: "terminate", objs: ["3.2", "2.5"], tier: "core", gaps: ["pbq", "why"], title: "Terminate the cable and get the access point back on the network" },
      { key: "install", objs: ["2.5", "2.6"],  tier: "project", gaps: ["pbq"],         title: "Mount it and get power to it — PoE injector or switch" },
      { key: "power", objs: ["2.6"],    tier: "project", gaps: ["calc"],        title: "Set transmit power and antenna so you cover the floor and not the car park" }
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
      { key: "brief", objs: ["5.4"],    tier: "core",    gaps: ["read"],        title: "Get the real fault out of what the user told you" },
      { key: "triage", objs: ["5.4"],   tier: "core",    gaps: ["why"],         title: "Decide whether it is hardware, software or the user's setup" },
      { key: "digitizer", objs: ["1.1", "5.4"],tier: "core",    gaps: ["pbq", "why"],  title: "Tell a dead digitizer from a dead display, without guessing" },
      /* 3.1 TAUGHT AS CONSTRUCTION, which nothing else in this build
         does. The display lab's three 3.1 stages are all about CHOOSING
         and connecting a monitor; none of them takes a panel apart, so a
         student can pass all three without knowing what is between the
         glass and the light. This one is the panel on the bench with the
         other six layers lifted off.

         `lab` tier, not `core`, and that is a deliberate call: the core
         path already carries `digitizer`, which asks which LAYER has
         failed. A second display question in Quick would make two thirds
         of the short path about screens on a lab that also has to cover
         batteries, charging and radios. */
      { key: "panelpart", objs: ["3.1", "5.4"], tier: "lab", gaps: ["read", "why"], title: "Name the part inside the panel — a screen quote and a backlight quote are different money" },
      { key: "safety", objs: ["1.1"],   tier: "core",    gaps: ["pbq"],         title: "Handle a swollen battery without making it worse" },
      { key: "health", objs: ["1.1", "5.4"],   tier: "core",    gaps: ["calc"],        title: "Read the battery health figures — worn out, or is something draining it?" },
      /* The battery half of the Core 1 Device Issue Diagnosis Lab. Its
         six screens went to the display lab; these two belong here. */
      { key: "diagnose", objs: ["1.1", "5.4"], tier: "core",    gaps: ["read", "why"], title: "Name the issue AND the fix — and know when nothing is wrong" },
      { key: "power", objs: ["5.4"],    tier: "lab",     gaps: ["calc"],        title: "Chase battery drain and work out what is eating it" },
      { key: "charge", objs: ["1.1", "5.4"],   tier: "lab",     gaps: ["pbq"],         title: "Charging port, cable and adapter — find which one is at fault" },
      /* The Core 1 Mobile Device Troubleshooting Activity. `diagnose`
         above asks what is wrong; this asks what you do FIRST, which on
         these is a different skill and occasionally a safety matter. */
      { key: "firststep", objs: ["5.4", "1.1"], tier: "core", gaps: ["why", "read"], title: "Name the cause, then do the cheapest thing that could settle it" },
      { key: "sync", objs: ["1.3"],     tier: "project", gaps: ["read"],        title: "Set up mail, sync and MDM enrolment from the company's instructions" },
      { key: "radio", objs: ["1.3", "5.4"],    tier: "project", gaps: ["why"],         title: "Poor signal, no GPS, Bluetooth pairing — work out which radio" }
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
