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
import { buildBench, verdictWords } from "./bench-build.js";

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

/* WHAT EACH FAULT LOOKS LIKE AT THE MOMENT SOMEBODY PRESSES THE BUTTON.

   It lives here, beside the symptom it is derived from, rather than in a
   bench or a stage — three things have to agree about what this machine
   did and they must not drift apart.

   TWO OF THE SIX HAVE NO POWER-ON SIGNS AT ALL, and that is content
   rather than a gap. A card too long and a cooler too tall are caught
   with a tape measure at assembly; the machine is never switched on, so
   there is nothing to observe. `onAt: false` says so, and the bench
   draws the assembled machine with its status saying the button was
   never pressed.

   TWO MORE SHARE A SIGN PATTERN. An undersized supply and a lane-sharing
   M.2 both start perfectly — fans turning, no beep, picture on screen —
   which is the point: the signs narrow the field and they do not settle
   it. What separates those two is what happens NEXT, and that is in the
   report rather than on the bench. */
export const POST_SIGNS = {
  socket:   { onAt: true,  fan: false, beep: false, video: false },
  ramtype:  { onAt: true,  fan: true,  beep: true,  video: false },
  psuwatt:  { onAt: true,  fan: true,  beep: false, video: true },
  m2lanes:  { onAt: true,  fan: true,  beep: false, video: true },
  gpulen:   { onAt: false },
  coolerht: { onAt: false }
};

/* Every fault has a sign pattern, and every pattern is one a machine can
   actually produce. A beep with no fans is a board reporting through a
   speaker it has no power to drive. Checked at load rather than trusted,
   because a generated observation that contradicts itself would mark a
   correct student answer wrong. */
Object.keys(FAULTS).forEach(function (k) {
  const g = POST_SIGNS[k];
  if (!g) throw new Error("lab-build: fault " + k + " has no power-on signs");
  if (g.onAt && g.beep && !g.fan)
    throw new Error("lab-build: " + k + " beeps with nothing turning, which no machine does");
});

const CUSTOMERS = [
  { who: "Larkfield Design",       size: "Small Business" },
  { who: "Wren & Sons Engineering",size: "Small Business" },
  { who: "Vantage Studios",        size: "Mid-Market" },
  { who: "Colworth University — Media", size: "Mid-Market" },
  { who: "Ardent Simulation",      size: "Major Corporation" },
  /* FIVE MORE CUSTOMERS, asked for by the named-scenario picker.

     Five customers cannot fill a list of six distinct ones, so the
     picker was offering the same firm twice with two different jobs —
     true, and it reads as a list with a repeat in it. The thinness was
     invisible while the customer arrived by dice roll.

     They are only names and sizes: the SIZE is what the generator reads
     to scale the job, so a new name at a size already present costs
     nothing in content and buys a list that scans. Spread across the
     three sizes rather than piled on one. */
  { who: "Pike Lane Architects",   size: "Small Business" },
  { who: "Ottershaw Animation",    size: "Small Business" },
  { who: "Brackley Survey Group",  size: "Mid-Market" },
  { who: "Crane & Whitby Legal",   size: "Mid-Market" },
  { who: "Halvard Aerospace",      size: "Major Corporation" }
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

/* =====================================================================
   THE FIVE CORE 1 WORKSTATION SIMS, BROUGHT ONTO THE MACHINE.

   Four of the owner's five workstation sims land here. They overlap the
   stages that were already in this lab, and that overlap is the point
   rather than a reason to prune: a student who cannot get there by
   specifying a build from a brief may get there by being handed a
   machine that is already wrong and allowed to change two things. Two
   routes to one objective is the deliverable.

   What each one contributes that nothing here had:

     twobuilds  PC Builder                  — one shelf, two opposed
                                              briefs, so the right answer
                                              flips between them.
     symptom    Workstation Hardware TS     — observations rather than a
                                              build history. Cold.
     specs      PC Diagnostic               — a spec plate against a live
                                              reading, and the one that
                                              disagrees.
     swap       Build & Compatibility Check — a baseline already wrong,
                                              and a budget of two changes.

   The fifth, Device Issue Diagnosis, is a display and mobile-device sim
   wearing a workstation label — six of its ten devices are monitors and
   projectors and two are phone batteries. It goes to the labs that own
   that content rather than being forced in here.
   ===================================================================== */

/* ---------------------------------------------------------------------
   twobuilds — the PC Builder shelf.

   The parts are the owner's own list, kept as it is. Every one of them
   is a real thing somebody sells, and three of them are traps that only
   a student who has read the brief avoids: ECC memory belongs to a
   workstation chip and nothing else, a SODIMM is a laptop module in a
   desktop shelf, and a 4 TB spinning disk is the right answer for hours
   of footage and the wrong one for anything that has to feel quick.
   --------------------------------------------------------------------- */
const PB_SHELF = {
  cpu: [
    { key: "i3",   label: "Intel Core i3",  is: "A budget desktop chip. Enough for a browser, a document and a video call, and out of its depth the moment real work starts." },
    { key: "i7",   label: "Intel Core i7",  is: "A fast mainstream chip with the clock speed games and editing want. It is also money spent for nothing on a machine that browses." },
    { key: "xeon", label: "Intel Xeon",     is: "A workstation chip. It is the only part on this shelf that takes error-correcting memory, which is what makes it the right answer when ECC is." },
    { key: "arm",  label: "ARM Cortex",     is: "Not a desktop processor at all — it goes in phones, tablets and single-board computers. It does not fit any board on this shelf." }
  ],
  video: [
    { key: "dgpu", label: "Discrete graphics card", is: "Its own processor and its own memory. Needed for games, for real-time 3D and for anything that renders; wasted on a machine that draws a spreadsheet." },
    { key: "igpu", label: "On-board video",         is: "Graphics on the processor itself. It drives a screen perfectly well and costs nothing, which is exactly right until something asks it to render." }
  ],
  ram: [
    { key: "16ecc", label: "16 GB DDR5 ECC", is: "Error-correcting memory: it catches and repairs single-bit errors instead of crashing. It needs a workstation chip and board, and it is wasted anywhere a crash is merely annoying." },
    { key: "4ecc",  label: "4 GB DDR5 ECC",  is: "Error-correcting, and four gigabytes. It has the expensive property and not the useful one — too little memory to run anything the ECC would be protecting." },
    { key: "8",     label: "8 GB DDR5",      is: "Enough for a browser, an office suite and a video call at the same time. It is the honest answer for light work and the wrong one for anything that loads a scene." },
    { key: "sodimm",label: "8 GB SODIMM",    is: "A laptop module. Physically shorter than a desktop stick and it will not go into a desktop board's slots at all." },
    { key: "16",    label: "16 GB DDR5",     is: "The working figure for a machine that games or edits. No error correction, which nothing here needs unless the chip is a workstation part." }
  ],
  sound: [
    { key: "onboard", label: "On-board sound",     is: "Audio on the motherboard. Fine for calls, video and music, and it is what almost every machine should have." },
    { key: "surround",label: "7.1 surround card",  is: "Eight discrete channels. It earns its place where positional or multi-channel audio is the job, and nowhere else." }
  ],
  periph: [
    { key: "headset", label: "Headset",            is: "Ears and a microphone in one, on the head, hands free. It is the right tool where somebody is in calls all day." },
    { key: "mic",     label: "External microphone",is: "A standalone microphone on the desk. It is what you specify when the voice going out matters more than the audio coming in." },
    { key: "webcam",  label: "Web cam",            is: "A camera. It is what a video conferencing requirement actually asks for, and nothing else on this shelf provides a picture." }
  ],
  storage: [
    { key: "hdd500", label: "500 GB HDD",  is: "A small spinning disk. It is the cheapest way to hold documents, and everything on it feels slow to open." },
    { key: "hdd4t",  label: "4 TB HDD",    is: "A lot of spinning capacity. Right where hours of large files have to live somewhere; wrong where anything has to load quickly." },
    { key: "ssd256", label: "256 GB SSD",  is: "Fast, and small. Right where the machine boots, runs a couple of applications and keeps nothing of its own." },
    { key: "ssd1t",  label: "1 TB SSD",    is: "Fast and roomy. The default answer whenever both load times and space matter, and the most expensive thing on this row." }
  ]
};
const PB_SLOTS = [
  { key: "cpu",     label: "Processor" },
  { key: "video",   label: "Graphics" },
  { key: "ram",     label: "Memory" },
  { key: "sound",   label: "Sound" },
  { key: "periph",  label: "Peripheral" },
  { key: "storage", label: "Storage" }
];

/* Seven machines. The first two are the owner's own gaming and family
   builds; the other five are the standing five-more. Each `why` is the
   reason THIS machine wants THAT part, which is the only sentence a
   correct pick needs — a wrong pick is answered by what the part it
   chose actually is, which is the near-miss lesson. */
const MACHINES = {
  gaming: {
    name: "Gaming PC",
    brief: "A high-performance gaming workstation. They want exceptional frame rates, rapid load " +
      "times, ample storage and superior audio, and they have said cost is not the issue.",
    pick: { cpu: "i7", video: "dgpu", ram: "16", sound: "surround", periph: "mic", storage: "ssd1t" },
    why: {
      cpu: "the frame rate is decided by the processor as much as the card, and this is the fast one",
      video: "“exceptional frame rates” is a graphics requirement before it is anything else",
      ram: "modern titles want sixteen gigabytes and have no use whatever for error correction",
      sound: "they asked for superior audio, and multi-channel is the only thing on the shelf that is",
      periph: "they talk to a team while they play, so what goes OUT is what matters",
      storage: "“rapid load times” and “ample storage” together, which only the large solid-state drive does"
    }
  },
  family: {
    name: "Family PC",
    brief: "A budget family workstation for browsing, word processing and video conferencing. " +
      "Low cost is a stated requirement.",
    pick: { cpu: "i3", video: "igpu", ram: "8", sound: "onboard", periph: "webcam", storage: "hdd500" },
    why: {
      cpu: "nothing they described needs more, and the money saved is the requirement",
      video: "no games, no rendering — on-board graphics draws all of this perfectly and costs nothing",
      ram: "enough to browse, write and hold a call at once, which is the whole brief",
      sound: "calls and video need audio, not eight channels of it",
      periph: "video conferencing needs a camera, and this is the only part on the shelf with a lens",
      storage: "documents and photographs, on the cheapest thing that holds them"
    }
  },
  cad: {
    name: "CAD seat",
    brief: "A drafting seat for the design office. The assemblies are large, a corrupted model half " +
      "way through a day's work has cost them before, and the designer takes client calls at the desk.",
    pick: { cpu: "xeon", video: "dgpu", ram: "16ecc", sound: "onboard", periph: "headset", storage: "ssd1t" },
    why: {
      cpu: "it is the only chip here that accepts error-correcting memory, and that is what this brief is really asking for",
      video: "real-time 3D on a large assembly is exactly what a dedicated card is for",
      ram: "“a corrupted model half way through the day” is the sentence that means ECC",
      sound: "audio is not part of this job at all, so it costs nothing",
      periph: "calls at the desk while both hands stay on the model",
      storage: "large files opened and saved all day, so speed and room together"
    }
  },
  media: {
    name: "Video editing desk",
    brief: "An editing desk for the media team. They shoot hours of raw footage a week and all of it " +
      "has to live on the machine, they mix for multi-channel playback, and they record voice-over at the desk.",
    pick: { cpu: "i7", video: "dgpu", ram: "16", sound: "surround", periph: "mic", storage: "hdd4t" },
    why: {
      cpu: "encoding is clock work, and this is the fast chip",
      video: "the timeline is rendered on the card, which is what makes a scrub smooth",
      ram: "sixteen gigabytes for a timeline, and nothing here corrupts quietly enough to want ECC",
      sound: "they mix multi-channel, so they have to be able to hear multi-channel",
      periph: "voice-over is a recording job, and a recording job wants a microphone on the desk",
      storage: "hours of raw footage a week has to LIVE somewhere — capacity beats speed the moment the figure is that big"
    }
  },
  helpdesk: {
    name: "Support desk",
    brief: "A support desk machine. The technician is on the telephone the whole shift with both " +
      "hands on the keyboard, every system they touch is somewhere else, and nothing is stored locally.",
    pick: { cpu: "i3", video: "igpu", ram: "8", sound: "onboard", periph: "headset", storage: "ssd256" },
    why: {
      cpu: "a browser and a ticket system, all day. Anything more is money the desk cannot feel",
      video: "nothing here renders",
      ram: "a browser, a ticket queue and a chat client, comfortably",
      sound: "a telephone call is one channel",
      periph: "on the telephone all shift with both hands on the keyboard — that sentence is a headset",
      storage: "nothing is stored locally, so what matters is that it boots and opens fast"
    }
  },
  reception: {
    name: "Reception desk",
    brief: "A reception machine. It signs visitors in against a photograph, it runs the door entry " +
      "page, it is on from eight until six, and there is no room in the desk for anything large.",
    pick: { cpu: "i3", video: "igpu", ram: "8", sound: "onboard", periph: "webcam", storage: "ssd256" },
    why: {
      cpu: "a sign-in page and a door entry page",
      video: "two web pages",
      ram: "enough for both of those at once",
      sound: "a door chime",
      periph: "“signs visitors in against a photograph” needs something that takes photographs",
      storage: "on all day every day, holding nothing — small, fast, and no moving parts to wear out"
    }
  },
  vlab: {
    name: "Virtualization teaching bench",
    brief: "A bench machine for the virtualization class. It runs several student machines at once, " +
      "an instructor watches it over a remote session rather than sitting at it, and a corrupted " +
      "lab image halfway through a session wastes the whole class's afternoon.",
    pick: { cpu: "xeon", video: "igpu", ram: "16ecc", sound: "onboard", periph: "headset", storage: "ssd1t" },
    why: {
      cpu: "the workstation chip, because error-correcting memory needs one",
      video: "nobody sits at it and nothing renders — the display output is there to be plugged into once",
      ram: "“a corrupted lab image wastes the afternoon” is what error correction is for",
      sound: "there is no audio in this job",
      periph: "the instructor is talking to a class while driving it remotely",
      storage: "several machine images opened at once, so speed and room together"
    }
  }
};

/* ---------------------------------------------------------------------
   symptom — the workstation troubleshooting PBQ.

   The owner's sim gives six symptom sets; these are those six plus the
   standing five more. Three pairs deliberately produce the SAME three
   signs and different answers, so the machine on the bench cannot be
   read off at a glance and the discriminating detail has to be hunted
   out of the brief. That is the reading-the-scenario gap, on purpose.
   --------------------------------------------------------------------- */
const SUBSYS = {
  psu:   { label: "Power supply",
           looks: "a machine with no signs of life at all, or one that switches off instantly under load with no heat and no warning" },
  ram:   { label: "Memory (RAM)",
           looks: "a repeating beep pattern with no picture, or a machine that is stable at idle and falls over under load after its memory settings were changed" },
  cpu:   { label: "CPU / cooling",
           looks: "a machine that runs, gets hot, and shuts itself down to protect the chip — with the fans loud before it goes" },
  board: { label: "Motherboard",
           looks: "fans at full speed from the instant of power-on that never settle, or parts of the board dead while the rest works" },
  gpu:   { label: "Graphics card",
           looks: "a machine that powers up quietly and correctly and puts nothing on a screen that is known to work" },
  disk:  { label: "Storage / boot device",
           looks: "a machine that posts perfectly and then cannot find anything to start" }
};
const SUBSYS_KEYS = Object.keys(SUBSYS);

const SYMPTOMS = [
  { key: "s1", answer: "ram", signs: { fan: true, beep: true, video: false },
    bullets: ["System powers on", "Fans spin", "No display", "Repeating beep codes during startup"],
    tell: "It is beeping, so firmware is running — which means the supply, the board and the processor " +
      "are all far enough along to have got there. Memory training is the first thing after that, and it " +
      "is the fault the board has a beep code for.",
    fix: "Reseat the modules, then try one module at a time in the first slot of the first channel.",
    rules: { gpu: "A card that is not working leaves a machine SILENT with no picture. This one is complaining, and a board complains about what it found, not about what it has not reached yet." } },

  { key: "s2", answer: "psu", signs: { fan: false, beep: false, video: false },
    bullets: ["Power button pressed", "No lights", "No fans", "No sound"],
    tell: "Nothing at all happened. Before POST there is no firmware running to report anything, so a " +
      "machine with no signs of life has failed at the point where power is delivered.",
    fix: "Check the wall, the switch on the supply, the 24-pin and the EPS. Then test the supply itself.",
    rules: { board: "A dead board is the other thing that does this, and it is the SECOND thing you check — supplies fail far more often, and you can test one in a minute." } },

  { key: "s3", answer: "gpu", signs: { fan: true, beep: false, video: false },
    bullets: ["System powers on", "Fans spin", "No beep codes", "Black screen"],
    tell: "It powered up and it has nothing to complain about — no beeps means firmware ran and found " +
      "everything it checks. What it has not done is put a picture on the screen.",
    fix: "Reseat the card and its auxiliary power, then try the board's own display output to prove the rest of the machine.",
    rules: { ram: "A memory fault is the one thing here that the board WOULD beep about. Silence is what rules it out." } },

  { key: "s4", answer: "cpu", signs: { fan: true, beep: false, video: true },
    bullets: ["System boots normally", "Shuts down unexpectedly under load",
              "Excessive heat observed", "Loud fan noise", "Issue began after performance settings were changed"],
    tell: "It boots, it works, and it gets hot and switches itself off. That is a chip protecting itself, " +
      "and the fans going loud first is the cooling trying and failing to keep up.",
    fix: "Put the performance settings back to stock, then check the cooler is properly mounted and the paste is intact.",
    rules: { psu: "A supply that cannot deliver drops the machine instantly, cold, with no warning and no heat. Heat is what separates these two, and there is plenty of it here." } },

  { key: "s5", answer: "ram", signs: { fan: true, beep: false, video: true },
    bullets: ["System powers on normally", "Random restarts or blue screens",
              "Stable at idle, crashes during heavy use", "Issue began after BIOS/UEFI settings were changed"],
    tell: "It posts and runs, so nothing is missing. It falls over only when it is being worked, and it " +
      "started when the firmware settings changed — memory pushed past what it is rated for behaves " +
      "exactly like this.",
    fix: "Set the memory back to its rated speed and voltage, then test it before doing anything else.",
    rules: { cpu: "Thermal shutdown is the other thing a firmware change causes, and it comes with heat and a machine that switches OFF. Blue screens with no heat are not that." } },

  { key: "s6", answer: "gpu", signs: { fan: true, beep: false, video: false },
    bullets: ["System powers on", "Fans spin", "No display output",
              "Monitor and cable confirmed working", "Issue began after hardware or BIOS changes"],
    tell: "The screen and the lead have been proved on something else, so the missing picture is this " +
      "machine's. It powers up silently and correctly, which puts the fault at the last thing in the chain.",
    fix: "Check which output the firmware is set to use, then reseat the card and prove it in another slot.",
    rules: { board: "A board that has died holds the fans at full speed from the instant of power-on and never settles. This one starts normally." } },

  /* --- the five added on top of the owner's six --- */
  { key: "s7", answer: "board", signs: { fan: true, beep: false, video: false },
    bullets: ["Fans go to full speed the instant power is applied", "Fans never settle back down",
              "No beep codes", "No display", "Power button does nothing — it has to be switched off at the supply"],
    tell: "Fans at full from the first instant and never settling is a board that has not released reset. " +
      "Nothing is controlling them, because nothing is running. The power button doing nothing is the same story.",
    fix: "Clear CMOS, then strip to board, processor and one memory module outside the case and try again.",
    rules: { gpu: "A missing picture with a card at fault still gives you a machine that starts NORMALLY — fans spinning up and settling. Read what the fans do in the first two seconds.",
             psu: "The supply is delivering — the fans prove that. It is what happens after the rails come up that has gone wrong." } },

  { key: "s8", answer: "disk", signs: { fan: true, beep: false, video: true },
    bullets: ["System powers on and posts", "“No bootable device” on screen",
              "The drive is listed in the firmware", "Its self-test reports failed", "It was slow to open files for a week beforehand"],
    tell: "It got all the way through POST and put the message on the screen itself, so the machine is " +
      "working. It cannot find anything to start from, and the drive is telling you why.",
    fix: "Replace the drive and restore. A drive that fails its own self-test does not get another chance.",
    rules: { board: "The firmware can see the drive and run its self-test, so the port, the controller and the board are all doing their jobs." } },

  { key: "s9", answer: "board", signs: { fan: true, beep: false, video: true },
    bullets: ["System boots and runs normally", "The front USB ports are dead",
              "One bank of memory slots is not detected", "Everything else works",
              "Started after the board was taken out and remounted"],
    tell: "Two unrelated things on opposite parts of the board stopped at once, and they stopped when the " +
      "board was moved. That is not two coincidental failures — it is one board, shorted or flexed on a " +
      "standoff in the wrong hole.",
    fix: "Take it out and count the standoffs against the board's mounting holes. One extra underneath is all it takes.",
    rules: { ram: "A bad module kills one slot, not a whole bank AND the front USB. Look for what the two dead things have in common, which is the board they are both on." } },

  { key: "s10", answer: "gpu", signs: { fan: true, beep: true, video: false },
    bullets: ["System powers on", "Fans spin", "One long beep then two short, repeating", "No display",
              "A graphics card was fitted the day before"],
    tell: "It is beeping, so firmware is running and has an opinion — and the pattern is not the memory " +
      "one. One long and two short is the video code on most boards, and something was fitted yesterday.",
    fix: "Reseat the card fully, then connect the auxiliary power leads it needs before blaming the card.",
    rules: { ram: "Memory has its own beep pattern, and it is a repeating single tone rather than one long and two short. The pattern is the whole message — that is why boards use different ones." } },

  { key: "s11", answer: "psu", signs: { fan: true, beep: false, video: true },
    bullets: ["Runs on the desktop for hours without trouble", "Switches off the instant a game or render starts",
              "No warning and no error", "The case and the heatsink are cold to the touch",
              "Comes straight back on afterwards"],
    tell: "Off instantly, cold, and it comes straight back — that is a supply that cannot deliver the peak " +
      "current, protecting itself. Nothing else fails cold.",
    fix: "Add up the real peak draw and fit a supply with headroom over it, not one that matches it.",
    rules: { cpu: "Thermal shutdown is the other thing that happens under load, and it is HOT and it is gradual. Cold and instant is the opposite tell." } }
];

/* ---------------------------------------------------------------------
   specs — the gaming PC diagnostic.

   The owner's sim has one fault and it is a good one: the CPU's plate
   says 3.2 GHz and the firmware says 4.5 GHz, and the machine freezes.
   The ACT that teaches is comparing a printed rating against a live
   reading and finding the one that disagrees, so these five more are all
   built the same way — two numbers that ought to match and do not.
   --------------------------------------------------------------------- */
const RESOLUTIONS = {
  lowerclock: { label: "Lower the CPU clock speed to its rated base",
    does: "Returns the chip to the figure on its own plate. It is the fix when a chip is running above what it was sold as." },
  raisemult:  { label: "Increase the CPU multiplier",
    does: "Makes the chip run FASTER still. Whatever is wrong, more clock is not going to help it." },
  lowervolt:  { label: "Decrease the CPU core voltage",
    does: "Cuts heat, and cuts stability with it. Under-volting a chip that is already unstable makes it worse, not better." },
  ratedram:   { label: "Set the memory back to its rated frequency",
    does: "Puts the modules at the speed printed on them. It is the fix when firmware is driving them past it." },
  raiseram:   { label: "Raise the memory frequency",
    does: "Pushes the modules further past their rating. It is the direction the problem came from." },
  biggerpsu:  { label: "Fit a power supply with headroom over the real peak draw",
    does: "Gives the rails room above what the parts actually pull. It is the fix when the arithmetic on the labels does not come out." },
  radiator:   { label: "Install a larger radiator",
    does: "More cooling capacity, which does nothing at all if the pump moving heat to it is not turning." },
  pump:       { label: "Replace the failed cooling pump",
    does: "Restores the thing that carries heat away from the chip. Nothing downstream of a dead pump matters." },
  paste:      { label: "Replace the thermal paste",
    does: "Worth doing on any old cooler, and it fixes a gradual climb rather than a reading that is wrong from the first second." },
  chkdsk:     { label: "Run CHKDSK on the boot drive",
    does: "Checks a filesystem. It has nothing to say about clocks, voltages, wattages or lanes." },
  firmware:   { label: "Update the motherboard firmware",
    does: "The answer to a compatibility list, and not to a number that is being set wrongly right now." },
  matchram:   { label: "Run matched memory modules, or set the bank to the slower module's rating",
    does: "Stops the firmware applying one module's settings to a module that is not rated for them." },
  moveslot:   { label: "Move the graphics card to the slot with all sixteen lanes",
    does: "Puts the card where the board actually wired the lanes it is asking for." },
  smallgpu:   { label: "Fit a graphics card with lower performance",
    does: "Reduces the demand instead of correcting the mistake. It is what you do when nothing else worked, not first." }
};

const CAUSES = {
  oc:      { label: "Overclocking" },
  heat:    { label: "Overheating" },
  power:   { label: "Insufficient power" },
  compat:  { label: "Component incompatibility" },
  diskbad: { label: "A failing storage device" },
  misconf: { label: "A misconfigured firmware setting" }
};

/* Each fault names the part whose PLATE matters, the live reading that
   contradicts it, and what to do. `plates` overrides the standing plate
   text for that one part; everything else on the bench reads normally,
   so the contradiction has to be found rather than pointed at. */
const SPEC_FAULTS = [
  { key: "oc", cause: "oc", fix: "lowerclock",
    wrong: ["raisemult", "lowervolt", "chkdsk", "radiator", "firmware"],
    part: "cpu",
    plate: "x64 10-core · base clock 3.2 GHz · TDP 165 W · junction temperature 94 °C",
    live: ["CPU speed: 4.5 GHz", "CPU temperature: 92 °C"],
    tell: "The plate says 3.2 GHz and the firmware says 4.5. A chip running a third above what it was " +
      "sold as, at 92 °C against a 94 °C limit, is a chip two degrees from shutting itself down.",
    wrongCause: { heat: "It IS hot, and the heat is a consequence rather than the cause — the cooler is doing what it was specified to do for a 3.2 GHz chip. Ask why the chip is producing more heat than that.",
                  power: "Nothing here is short of power. The supply's plate covers the parts' own figures with room to spare." } },

  { key: "ramoc", cause: "misconf", fix: "ratedram",
    wrong: ["raiseram", "lowerclock", "chkdsk", "biggerpsu", "smallgpu"],
    part: "ram",
    plate: "32 GB · DDR4-2666 · PC4-21300 · 1.2 V",
    live: ["Memory frequency: DDR4 3200 MHz", "Memory voltage: 1.35 V", "Total memory: 32768 MB"],
    tell: "The modules are rated DDR4-2666 at 1.2 volts and the firmware is running them at 3200 on 1.35. " +
      "A profile was switched on that these particular modules are not rated for.",
    wrongCause: { oc: "Close, and worth being precise about: overclocking usually means the PROCESSOR, and the processor here is exactly on its plate. It is a firmware setting applied to the memory.",
                  diskbad: "The drive's own figures are unremarkable and it is not what the machine is failing on." } },

  { key: "psuload", cause: "power", fix: "biggerpsu",
    wrong: ["lowerclock", "chkdsk", "firmware", "radiator", "raisemult"],
    part: "psu",
    plate: "450 W · single +12 V rail · 90% efficiency · 110 V input",
    live: ["Measured draw at peak: 505 W", "Rail voltage under load: +11.2 V", "Shutdowns logged: 6 in 24 hours"],
    tell: "Add the plates up. A 225 W card and a 165 W processor with the board, drives and cooling behind " +
      "them come to more than the supply is rated to give, and the rail is sagging under it.",
    wrongCause: { heat: "The rail voltage is the giveaway. A hot machine throttles; a starved one drops out with the twelve-volt rail already down to eleven-two.",
                  misconf: "Every setting on this machine is at its default. The arithmetic on the labels is what does not work." } },

  { key: "pumpdead", cause: "heat", fix: "pump",
    wrong: ["radiator", "paste", "lowervolt", "chkdsk", "smallgpu"],
    part: "cooler",
    plate: "Closed-loop liquid cooler · pump 40 W · 240 mm radiator",
    live: ["CPU temperature at idle: 96 °C", "CPU fan: 2,100 rpm", "Pump: 0 rpm"],
    tell: "Ninety-six degrees at IDLE, with a pump reporting zero. The radiator and its fans are working " +
      "perfectly and there is nothing arriving at them to cool.",
    wrongCause: { oc: "The clock is exactly on the plate. This chip is not being asked to do anything unusual — it is being asked to do the ordinary thing with no cooling.",
                  power: "The pump is not turning because the pump has failed, not because there is no power for it: everything else on the same rail is running." } },

  { key: "mixedram", cause: "compat", fix: "matchram",
    wrong: ["raiseram", "ratedram", "chkdsk", "biggerpsu", "firmware"],
    part: "ram",
    plate: "Slot 1: 16 GB DDR4-3200 · 1.35 V  |  Slot 3: 16 GB DDR4-2666 · 1.2 V",
    live: ["Memory frequency: DDR4 3200 MHz", "Memory voltage: 1.35 V applied to all slots",
           "Errors during memory test: 41"],
    tell: "Two different modules, and the firmware applies one set of settings to the whole bank. The 2666 " +
      "module is being run at 3200 on a voltage it was never rated for, and it is the one throwing errors.",
    wrongCause: { misconf: "Nearly. Nothing has been set wrongly — the firmware is doing the only thing it can do with one voltage rail and two different modules on it. The mistake was buying two different modules.",
                  oc: "The processor is exactly on its plate." } },

  { key: "lanes", cause: "compat", fix: "moveslot",
    wrong: ["smallgpu", "firmware", "biggerpsu", "chkdsk", "raisemult"],
    part: "gpu",
    plate: "5,500 compute cores · x16 PCIe interface · 8 GB GDDR6 · 225 W",
    live: ["Graphics link width: x4", "Slot occupied: PCIe slot 2 (x4 electrical)",
           "Frame times: erratic under load, normal at idle"],
    tell: "The card wants sixteen lanes and the slot it is in has four wired to it. It works, and it works " +
      "at a quarter of the connection it was built for — which is exactly what erratic frame times under " +
      "load look like.",
    wrongCause: { power: "Two hundred and twenty-five watts against the supply's plate is comfortable, and a starved card drops out rather than stuttering.",
                  misconf: "There is no setting to change. The slot has four lanes wired to it in copper." } }
];

/* ---------------------------------------------------------------------
   swap — the build and compatibility check.

   Two of the owner's briefs plus the standing five more. Every brief
   carries a baseline that is already wrong in EXACTLY `budget` places
   and right everywhere else, and the check is computed from `needs` so
   there is no second copy of the answer to drift. `selfCheck` proves
   both of those on every seed.
   --------------------------------------------------------------------- */
const SWAP_SLOTS = [
  { key: "cpu", label: "CPU", options: [
    { key: "novirt", label: "Intel x64 CPU", sub: "does not support hardware virtualization" },
    { key: "virt",   label: "Intel x64 CPU", sub: "supports hardware virtualization" },
    { key: "amdvirt",label: "AMD x64 CPU",   sub: "supports hardware virtualization — needs the AMD board" }
  ] },
  { key: "mobo", label: "Motherboard", options: [
    { key: "atx",   label: "ATX motherboard",      sub: "Intel socket, DDR4" },
    { key: "matx",  label: "microATX motherboard", sub: "AMD socket, DDR4" },
    { key: "wrong", label: "Motherboard",          sub: "socket does not match the CPU" }
  ] },
  { key: "ram", label: "Memory", options: [
    { key: "16", label: "16 GB DDR4", sub: "two modules" },
    { key: "32", label: "32 GB DDR4", sub: "four modules" }
  ] },
  { key: "storage", label: "Primary storage", options: [
    { key: "hdd",  label: "1 TB hard disk drive", sub: "spinning, cheapest per gigabyte" },
    { key: "ssd",  label: "1 TB solid-state drive", sub: "SATA, no moving parts" },
    { key: "nvme", label: "1 TB NVMe solid-state drive", sub: "on the PCIe bus, several times a SATA drive" }
  ] },
  { key: "gpu", label: "Graphics", options: [
    { key: "igpu", label: "Integrated graphics", sub: "on the processor" },
    { key: "dgpu", label: "Dedicated graphics card", sub: "full length, 8-pin auxiliary power" }
  ] },
  { key: "psu", label: "Power supply", options: [
    { key: "450", label: "450 W power supply", sub: "" },
    { key: "650", label: "650 W power supply", sub: "" }
  ] },
  { key: "case", label: "Case", options: [
    { key: "compact", label: "Compact desktop case", sub: "no room for a full-length card" },
    { key: "tower",   label: "Standard mid-tower case", sub: "takes a full-length card" }
  ] },
  { key: "net", label: "Network adapter", options: [
    { key: "eth",  label: "1 Gb Ethernet adapter", sub: "needs a cable to the desk" },
    { key: "wifi", label: "Wireless network adapter", sub: "no cable" }
  ] }
];

const SWAP_BRIEFS = [
  { key: "virt",
    goal: "A training department needs a workstation that can run several virtual machines at once.",
    limits: "Graphics performance beyond driving a screen is not required.",
    base: { cpu: "novirt", mobo: "atx", ram: "16", storage: "hdd", gpu: "igpu", psu: "450", case: "compact", net: "eth" },
    /* One entry per requirement, carrying the requirement AS THE CUSTOMER
       STATED IT, the component that satisfies it, and why. The stage
       displays `req`, the check tests `to`, and the explanation uses
       `says` — one table, so the brief on screen and the thing being
       marked cannot drift apart. */
    needs: {
      cpu: { to: "virt", req: "The processor must support hardware virtualization.",
             says: "Virtual machines run on a processor extension. Without it the host either refuses outright or falls back to something unusably slow." },
      ram: { to: "32", req: "There must be enough memory to hold several machines at the same time.",
             says: "Every guest wants its own memory and none of them share. Sixteen gigabytes is one machine and the host." }
    } },

  { key: "gaming",
    goal: "A home user wants a computer that runs modern games at a consistent frame rate.",
    limits: "Hardware virtualization support is not a requirement here.",
    base: { cpu: "novirt", mobo: "atx", ram: "16", storage: "hdd", gpu: "igpu", psu: "450", case: "tower", net: "eth" },
    needs: {
      gpu: { to: "dgpu", req: "The system must include a dedicated graphics card.",
             says: "Consistent frame rates in a modern title is a graphics requirement first, and integrated graphics is not a card." },
      psu: { to: "650", req: "The supply must deliver enough power for that card under load.",
             says: "A full-size card with an 8-pin auxiliary lead adds two hundred watts and more. Fitting one behind a 450 W supply gives you a machine that runs the desktop and switches off when the game starts." }
    } },

  /* --- the five added on top of the owner's two --- */
  { key: "db",
    goal: "A practice needs a machine to hold their appointment and records database. Twenty people query it at once all day.",
    limits: "Nobody sits at this machine and nothing is rendered on it.",
    base: { cpu: "virt", mobo: "atx", ram: "16", storage: "hdd", gpu: "igpu", psu: "450", case: "tower", net: "eth" },
    needs: {
      storage: { to: "nvme", req: "Storage has to serve many small reads at once without queueing.",
                 says: "Twenty people querying at once is thousands of small scattered reads. A spinning disk serves them one head-movement at a time; that is the whole reason this machine feels slow." },
      ram: { to: "32", req: "There must be enough memory to keep the working set in RAM.",
             says: "A database that fits in memory is answered from memory. Sixteen gigabytes for twenty concurrent users puts it back on the disk for everything." }
    } },

  { key: "field",
    goal: "A surveyor needs a machine for a listed building where no cable may be run, and it is carried between three rooms during the day.",
    limits: "The work is spreadsheets and photographs \u2014 nothing renders.",
    base: { cpu: "novirt", mobo: "atx", ram: "16", storage: "hdd", gpu: "igpu", psu: "450", case: "compact", net: "eth" },
    needs: {
      net: { to: "wifi", req: "It must reach the network without a cable to the desk.",
             says: "\u201cNo cable may be run\u201d is a sentence about the building, and it rules out the wired adapter no matter how much better wired would otherwise be." },
      storage: { to: "ssd", req: "It must survive being picked up and moved while it is running.",
                 says: "A spinning disk has a head floating over a platter. Carrying one while it runs is how a drive becomes a recovery job." }
    } },

  { key: "cad",
    goal: "A drafting seat for the design office. The models are large and rotated in real time all day.",
    limits: "The supply on this baseline already has the headroom the card needs.",
    base: { cpu: "novirt", mobo: "atx", ram: "32", storage: "nvme", gpu: "igpu", psu: "650", case: "compact", net: "eth" },
    needs: {
      gpu: { to: "dgpu", req: "Real-time 3D needs its own graphics processor.",
             says: "Rotating a large assembly in real time is exactly the work a dedicated card exists for." },
      case: { to: "tower", req: "The card is full length and has to physically fit.",
              says: "This is the tape-measure half of the same decision, and the half people forget. A full-length card and a compact case is a build that never gets switched on \u2014 the panel will not close." }
    } },

  { key: "till",
    goal: "A shop wants a till machine. It goes in a cupboard under the counter with a network socket already on the wall beside it.",
    limits: "It runs one point-of-sale application and nothing else.",
    base: { cpu: "novirt", mobo: "atx", ram: "16", storage: "ssd", gpu: "igpu", psu: "450", case: "tower", net: "wifi" },
    needs: {
      case: { to: "compact", req: "It has to fit the space it is going in.",
              says: "Both changes here are DOWNWARD, which is the lesson. A mid-tower does not go in the cupboard, and specifying up is as wrong as specifying down when the brief says where it lives." },
      net: { to: "eth", req: "It must use the wired socket that is already there.",
             says: "There is a socket on the wall. Wireless in a shop full of card terminals and phones is a worse connection that also costs more." }
    } },

  { key: "bench",
    goal: "A workshop bench machine for imaging drives. It has been assembled from parts on the shelf and has never posted.",
    limits: "It drives one screen and does nothing graphical.",
    base: { cpu: "novirt", mobo: "wrong", ram: "32", storage: "hdd", gpu: "igpu", psu: "650", case: "tower", net: "eth" },
    needs: {
      mobo: { to: "atx", req: "The processor and the board have to be the same socket.",
              says: "A socket mismatch is not a performance problem, it is a machine that never starts. It comes first because nothing else can be tested until it is fixed." },
      storage: { to: "ssd", req: "It writes whole disk images all day, so its own drive must not be the bottleneck.",
                 says: "Imaging is sustained sequential writing, all day. The drive it writes from and to is the whole job." }
    } }
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

  /* --- the four sims brought across --- */

  /* Two machines for the twobuilds stage, chosen so they DISAGREE. The
     whole lesson is that one shelf serves two briefs and the right answer
     flips, which a pair differing in two categories does not teach. Four
     of six is the floor, and selfCheck holds it. */
  const rb = rng(seed + 41);
  const mKeys = Object.keys(MACHINES);
  const first = rb.pick(mKeys);
  const apart = mKeys.filter(function (k) {
    if (k === first) return false;
    return PB_SLOTS.filter(function (sl) {
      return MACHINES[k].pick[sl.key] !== MACHINES[first].pick[sl.key];
    }).length >= 4;
  });
  const second = apart.length ? rb.pick(apart) : mKeys.filter(function (k) { return k !== first; })[0];

  const symptom = rng(seed + 53).pick(SYMPTOMS);
  const specFault = rng(seed + 67).pick(SPEC_FAULTS);
  const swapBrief = rng(seed + 79).pick(SWAP_BRIEFS);

  return {
    seed: seed, customer: customer, profileKey: profKey, profile: profile, job: job,
    said: said, board: board, cpu: cpu, ram: ram, gpu: gpu, psu: psu, cooler: cooler,
    case: kase, budget: budget, fault: fault, faultInfo: FAULTS[fault], draw: draw,
    recommendedPsu: Math.ceil((draw * 1.4) / 50) * 50,
    machines: [first, second], symptom: symptom, specFault: specFault, swapBrief: swapBrief
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
/* ---------------------------------------------------------------------
   The live board for the assemble stage.

   Everything here is derived from the SCENARIO the generator produced, so
   the verdict on each socket is whatever the parts actually are — no
   second copy of the compatibility rules, which is how the two would
   drift apart and start disagreeing in front of a student.

   The fault the generator planted is the one that shows. If it planted a
   socket mismatch, the CPU socket is refused; if it planted a cooler too
   tall, the cooler fits and the case does not close. --------------------- */
function boardView(s) {
  const f = s.fault;
  const V = {
    cpu:    f === "socket"   ? "refused" : "ok",
    cooler: f === "coolerht" ? "foul"    : "ok",
    ram:    f === "ramtype"  ? "refused" : "ok",
    gpu:    f === "gpulen"   ? "foul"    : (s.gpu && s.gpu.watts > 0 ? "seated" : "empty"),
    /* An undersized supply belongs on the SUPPLY, not on the EPS lead.
       Hanging it on the EPS was wrong twice over: the connector has
       nothing to do with wattage, and it pointed a student at a plug when
       the answer was on a label. */
    psu24:  f === "psuwatt"  ? "warn"    : "ok",
    eps:    "ok",
    m2:     (f === "m2lanes" || (s.board && s.board.m2Shared)) ? "warn" : "ok"
  };

  /* Which site the planted fault is SUPPOSED to appear on. Exported
     through the view so the check below can assert the fault is actually
     exhibited by the board it generated, rather than trusting that it is.
     Three bugs of exactly this shape have been caught in this repo. */
  const SHOWS_AT = { socket: "cpu", coolerht: "cooler", ramtype: "ram",
                     gpulen: "gpu", psuwatt: "psu24", m2lanes: "m2" };

  /* Which slots the memory went into. Two modules belong in the matched
     pair — slots 1 and 3 on a four-slot board — and putting them side by
     side is the quiet mistake that halves the bandwidth without ever
     showing an error. */
  const slots = (s.board && s.board.slots) || 4;
  const ramIn = slots >= 4 ? [0, 2] : [0, 1];

  const view = {
    showsAt: SHOWS_AT[f] || null,
    slots: slots,
    m2Shared: !!(s.board && s.board.m2Shared),
    cpuLabel: s.cpu && s.cpu.label,
    coolerMm: (s.cooler && s.cooler.heightMm) || 120,
    gpuMm: (s.gpu && s.gpu.lengthMm) || 0,
    ramIn: ramIn,
    fitted: V
  };

  /* The two tape-measure faults get a limit plane at the case's own
     figure, so the overshoot is visible rather than arithmetic. */
  if (f === "coolerht" && s.case) {
    view.foul = { part: "cooler", w: 3.4, limit: (s.case.maxCoolerMm || 160) / 25, d: 3.4 };
  } else if (f === "gpulen" && s.case) {
    view.foul = { part: "gpu", w: (s.case.maxGpuMm || 330) / 25, limit: 2.0, d: 2.4 };
  }
  return view;
}

function boardPanel(s) {
  const v = boardView(s);
  const SITE_LABEL = {
    cpu: "CPU socket", ram: "Memory slots", gpu: "Graphics card",
    psu24: "24-pin power", eps: "EPS 8-pin CPU power", m2: "M.2 slot", cooler: "CPU cooler"
  };
  const DETAIL = {
    cpu: (s.cpu && s.cpu.label) + " \u2014 " + (s.cpu && s.cpu.socket),
    ram: (s.ram && s.ram.label) + " \u2014 " + (s.ram && s.ram.gen),
    gpu: (s.gpu && s.gpu.label) + ((s.gpu && s.gpu.lengthMm) ? " \u2014 " + s.gpu.lengthMm + " mm" : ""),
    psu24: (s.psu && s.psu.label) + " supply",
    eps: "8-pin, from the " + (s.psu && s.psu.label) + " supply",
    m2: (s.board && s.board.m2Shared) ? "Shares lanes with SATA" : "Dedicated lanes",
    cooler: (s.cooler && s.cooler.label) + " \u2014 " + ((s.cooler && s.cooler.heightMm) || 120) + " mm"
  };
  return {
    kind: "bench",
    title: "The board, on the mat",
    intro: "Every socket below is a control, and the pip beside it on the board says the same " +
      "thing the button does. One of these is the reason this build does not work.",
    height: 420,
    bench: {
      spec: function () { return buildBench(v); },
      status: function () {
        const bad = Object.keys(v.fitted).filter(function (k) {
          return v.fitted[k] === "refused" || v.fitted[k] === "foul";
        });
        return bad.length
          ? { words: "Will not build", tone: "urgent",
              detail: "Something here does not go together. Work out which, and why." }
          : { words: "Everything agrees", tone: "calm",
              detail: "Socket, memory, power and clearance all check out." };
      },
      controls: function () {
        return Object.keys(SITE_LABEL).map(function (k) {
          return {
            key: k,
            label: SITE_LABEL[k],
            state: v.fitted[k],
            stateWords: verdictWords(v.fitted[k]),
            detail: DETAIL[k]
          };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* A BOARD THAT MARKS NOTHING.

   `boardPanel` above colours a pip at every site from `boardView`, which
   is right on the stages where the fault is already known and wrong on
   every stage that asks the student to FIND it — a red pip beside the
   memory slots answers "which part is wrong for this build?" before the
   question has been read.

   So these two draw the same model with the verdicts flattened: every
   site the same, carrying no opinion. `empty` for a board nothing has
   been fitted to yet, `seated` for a machine that is assembled. The
   controls name the sockets and say what each one has to AGREE with,
   which is the mechanism, and never what this particular build did. */
function flatBoardPanel(s, o) {
  const slots = (s.board && s.board.slots) || 4;
  const fitted = {};
  ["cpu", "cooler", "ram", "gpu", "psu24", "eps", "m2"].forEach(function (k) {
    fitted[k] = o.state;
  });
  const view = { fitted: fitted, slots: slots, coolerMm: (s.cooler && s.cooler.heightMm) || 120,
                 ramIn: o.state === "empty" ? [] : (slots >= 4 ? [0, 2] : [0, 1]),
                 cpuLabel: s.cpu && s.cpu.label,
                 /* m2Shared changes the M.2 socket's own note to say in
                    words that it steals the SATA ports — which is the
                    answer to the `lanes` stage. Never passed from here. */
                 m2Shared: false,
                 gpuMm: 0, signs: o.signs || null };
  return {
    kind: "bench", title: o.title, intro: o.intro, height: o.height || 420,
    bench: {
      spec: function () { return buildBench(view); },
      status: function () { return { tone: o.tone || "calm", words: o.words, detail: o.detail }; },
      controls: function () {
        return buildBench(view).parts.filter(function (p) {
          /* The pips and their wells carry the verdict and nothing else.
             Flattened they say the same thing seven times over, which is
             a column of noise for somebody reading with their ears. */
          return p.key.indexOf("pip-") !== 0 && p.key.indexOf("well-") !== 0;
        }).map(function (p) {
          return { key: p.key, label: p.label, state: "na",
                   stateWords: p.spec || "On the board", detail: p.note };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

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
        }).concat([
          { key: "office", label: "A general office PC", correct: false,
            why: "Nothing in the brief describes ordinary office work. Specifying down to that would leave them unable to do the job they described." },
          /* Two more real machine profiles. The owner ruled NAS and thin
             client out as builds in their own right, which makes them
             ideal DISTRACTORS: a student matching a single keyword in the
             brief lands on them, and the reason names the word they
             skipped over. */
          { key: "nas", label: "A network storage box", correct: false,
            why: "Storage capacity appears in nearly every brief, so this is an easy reach. A storage box is built around drives and network throughput and wants almost no graphics or single-thread speed \u2014 read what the machine has to DO with the data, not merely how much of it there is." },
          { key: "thin", label: "A thin client", correct: false,
            why: "A thin client does its work somewhere else and only draws the screen, so it is specified down rather than up. Anything in the brief about work happening on this desk rules it out at once." }
        ]),
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
      panels: [partsPanel(s), flatBoardPanel(s, {
        title: "The board the quote has to agree with",
        intro: "Nothing is fitted and nothing is marked. Every socket here is a CONSTRAINT — "
          + "the thing on the quote that has to match it is named beside each one, and five "
          + "of those six pairings are fine.",
        state: "empty", tone: "calm", words: "Bare board, nothing fitted",
        detail: "Compatibility is always a pair: a part against the one thing it has to agree "
          + "with. Work along the sockets rather than down the quote."
      })],
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
    /* ALL FIVE OTHER FAULTS, not three of them: six options is the
       standing rule, and the whole point of this stage is that the
       student rules faults out by how far the machine GOT before it
       stopped. Pruning the list to four does that reasoning for them. */
    const wrong = rng(s.seed + 3).some(others, 5);
    const g = POST_SIGNS[s.fault];
    return {
      title: "Build it and hit the button",
      intro: "It is assembled. This is what happened.",
      panels: [{ kind: "note", title: "What the machine did", paragraphs: [f.symptom] },
               flatBoardPanel(s, {
                 title: "The machine, and what it did when the button went in",
                 intro: g.onAt
                   ? "Three things tell you how far it got: whether anything is TURNING, "
                     + "whether the board SPEAKS, and whether there is a PICTURE. They narrow "
                     + "the field; they do not settle it. Two of the six faults here start "
                     + "perfectly and fail later."
                   : "Nothing happened, because nobody ever pressed the button. Two of the six "
                     + "faults on this lab are caught with a tape measure at assembly — there "
                     + "is no electrical symptom to observe, and that absence is itself the "
                     + "strongest clue on the stage.",
                 state: "seated",
                 signs: g.onAt ? { fan: g.fan, beep: g.beep, video: g.video } : null,
                 tone: g.onAt ? "warn" : "urgent",
                 words: g.onAt
                   ? (g.fan ? "Something is turning" : "Nothing is turning")
                     + (g.beep ? ", the board is beeping" : ", no beep")
                     + (g.video ? ", picture on screen" : ", no picture")
                   : "It was never switched on",
                 detail: g.onAt
                   ? "Before POST there is no firmware to report anything, so a silent machine "
                     + "failed at power delivery or at the board. A machine that can COMPLAIN "
                     + "has already passed everything before the thing it is complaining about."
                   : "It would not go together. The side panel will not close, so it never got "
                     + "as far as a power lead."
               }),
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
      panels: [boardPanel(s), {
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
      }, flatBoardPanel(s, {
        title: "The cooler that produced those numbers",
        intro: "A tower cooler is a stack of thin fins with heat pipes running up through them "
          + "and a machined base pressed onto the lid of the chip. Every one of those is a "
          + "stage the heat has to cross, and the number in the table is what comes out the "
          + "far end of all of them. The height is measured from the BOARD, not from the "
          + "socket, and it is the figure that decides whether the side panel closes.",
        state: "seated", tone: "calm",
        words: s.cooler.label + ", " + s.cooler.heightMm + " mm tall",
        detail: "Nothing here is marked. The verdict is in the two temperatures and the "
          + "throttle point, not in the metal."
      })],
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
        ,
            { key: "paste", label: "The thermal paste has been applied badly", correct: false,
              why: "The tell for bad paste is a big gap between idle and load, or one core much " +
                "hotter than its neighbours \u2014 not the numbers in front of you. Read what the " +
                "figures DO before deciding what caused them." },
            { key: "airflow", label: "The case airflow is inadequate", correct: false,
              why: "Poor airflow shows as a temperature that keeps climbing the longer the load " +
                "runs, because the heat has nowhere to go. A figure that rises and then settles " +
                "is a cooler doing its job." }
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
      }, flatBoardPanel(s, {
        title: "The board it all happened on",
        intro: "The M.2 slot is the short one lying flat against the board, and the SATA ports "
          + "are the block at the edge. They look completely unrelated, and on this board they "
          + "are wired to the same small pool of lanes leaving the chipset. Nothing on the "
          + "board says so — the only place it is written down is a table in the manual.",
        state: "seated", tone: "calm", words: "Everything is fitted and nothing has failed",
        detail: "Nothing is marked here, because nothing is broken. Every part in this machine "
          + "is working exactly as designed, including the one that took the drives away."
      })],
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
        ,
            { key: "cable", label: "The SATA cables have worked loose", correct: false,
              why: "The first thing to check on any missing drive, and it does not fit this " +
                "pattern \u2014 loose cables lose whichever drives you disturbed, in no " +
                "particular order. Losing exactly the ports that share lanes with the slot you " +
                "just populated is not a coincidence." },
            { key: "init", label: "The drives need initialising before they will appear", correct: false,
              why: "An uninitialised drive still appears \u2014 in the firmware and in disk " +
                "management, waiting to be set up. These ports have gone entirely, which is a " +
                "level below anything initialising would explain." }
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
        ,
            /* Two more handover rituals that feel thorough. Both prove
               something. Neither proves what the customer asked. */
            { key: "report", label: "Give them a printed report of the temperatures and clock speeds",
              correct: false,
              why: "Genuinely useful, and it is evidence about the MACHINE rather than about their " +
                "work. They did not ask whether it runs cool. They asked whether it does their job." },
            { key: "warranty", label: "Walk them through the warranty and the support process",
              correct: false,
              why: "That belongs in a handover, and it proves nothing. It tells them what happens " +
                "when the machine fails, which is a different conversation from showing them it " +
                "works." }
          ],
        explain: "Prove it against the brief, in the customer's own terms. Everything else is proof for you, not for them."
      }]
    };
  }

  /* -------------------------------------------------------------------
     twobuilds — PC Builder.

     One shelf, two briefs, and the parts the student places show up on
     the board as they go on. The bench says FITTED and never says
     CORRECT: a model that goes green when you get it right is a
     catalogue, and the check is the Commit button's job.
     ------------------------------------------------------------------- */
  if (key === "twobuilds") {
    const items = [];
    PB_SLOTS.forEach(function (sl) {
      PB_SHELF[sl.key].forEach(function (it) {
        items.push({ key: sl.key + ":" + it.key, label: it.label, slot: sl.key });
      });
    });

    function machineQuestion(mKey, nth) {
      const M = MACHINES[mKey];
      /* Each machine gets its own copy of the shelf, because both
         machines are specified in the same sitting and a part used on
         one is still available for the other. */
      const qItems = items.map(function (it) {
        return { key: nth + "|" + it.key, label: it.label, slot: it.slot };
      });
      return {
        key: "tb-" + nth, kind: "assign",
        prompt: "Specify the " + M.name + ".",
        detail: "Click a part, then click the slot it belongs in. Click a filled slot to put it back.",
        hints: [
          "Go through the brief a sentence at a time. Almost every sentence in it is about one of these six slots, and it names what that slot has to do rather than what to buy.",
          "For each slot, ask what would actually go wrong if you chose the cheaper part. Where the honest answer is “nothing”, the cheaper part is the right one — this brief is as much about not overspending as about not underspending."
        ],
        items: qItems,
        slots: PB_SLOTS.slice(),
        check: function (filled) {
          const empty = PB_SLOTS.filter(function (sl) { return !filled[sl.key]; });
          if (empty.length) {
            return { ok: false, why: "Still empty: " + empty.map(function (sl) { return sl.label; }).join(", ") + "." };
          }
          const misplaced = PB_SLOTS.filter(function (sl) {
            const it = qItems.filter(function (x) { return x.key === filled[sl.key]; })[0];
            return it && it.slot !== sl.key;
          })[0];
          if (misplaced) {
            const it = qItems.filter(function (x) { return x.key === filled[misplaced.key]; })[0];
            const home = PB_SLOTS.filter(function (sl) { return sl.key === it.slot; })[0];
            return { ok: false, why: "A " + home.label.toLowerCase() + " part is sitting in the " +
              misplaced.label.toLowerCase() + " slot." };
          }
          /* One wrong slot at a time, and always the reason rather than
             the answer: what the chosen part actually IS, which is what
             makes every one of these a near miss rather than filler. */
          const bad = PB_SLOTS.filter(function (sl) {
            return filled[sl.key].split(":")[1] !== M.pick[sl.key];
          })[0];
          if (bad) {
            const chosenKey = filled[bad.key].split(":")[1];
            const part = PB_SHELF[bad.key].filter(function (x) { return x.key === chosenKey; })[0];
            return { ok: false, why: bad.label + " — " + part.label + ". " + part.is };
          }
          return { ok: true, why: "That is the " + M.name.toLowerCase() + " the brief describes, with " +
            "nothing in it the brief cannot use." };
        },
        explain: PB_SLOTS.map(function (sl) {
          const part = PB_SHELF[sl.key].filter(function (x) { return x.key === M.pick[sl.key]; })[0];
          return sl.label + ": " + part.label + " — " + M.why[sl.key] + ".";
        }).join(" ")
      };
    }

    const qs = s.machines.map(function (m, i) { return machineQuestion(m, i + 1); });

    return {
      title: "Two machines, one shelf",
      intro: "The same parts are on the bench for both of these, and almost every slot has a different " +
        "right answer between them. Nothing here is a bad part — they are all somebody's correct choice.",
      panels: [{
        kind: "note", title: s.machines.map(function (m) { return MACHINES[m].name; }).join("  ·  "),
        paragraphs: s.machines.map(function (m) { return MACHINES[m].name + " — " + MACHINES[m].brief; })
      }, {
        kind: "bench", height: 380,
        bench: {
          spec: function () {
            /* Read from whichever question is being worked. A part that
               has been placed is FITTED and nothing more. */
            const placed = Object.assign({}, (qs[0].fitState || {}).placed, (qs[1] && qs[1].fitState || {}).placed);
            const any = function (slotKey) {
              return Object.keys(placed).some(function (k) { return k === slotKey; });
            };
            return buildBench({
              slots: 4,
              cpuLabel: "as specified",
              coolerMm: 140,
              gpuMm: any("video") ? 260 : 0,
              ramIn: any("ram") ? [0, 2] : [],
              fitted: {
                cpu: any("cpu") ? "seated" : "empty",
                cooler: any("cpu") ? "seated" : "empty",
                ram: any("ram") ? "seated" : "empty",
                gpu: any("video") ? "seated" : "empty",
                psu24: "ok", eps: "ok",
                m2: any("storage") ? "seated" : "empty"
              }
            });
          },
          status: function () {
            const placed = Object.assign({}, (qs[0].fitState || {}).placed, (qs[1] && qs[1].fitState || {}).placed);
            const n = Object.keys(placed).length;
            return { tone: n ? "calm" : "idle", words: n ? "Taking shape" : "Bare board",
              detail: n + " slot" + (n === 1 ? "" : "s") + " filled. The board shows WHAT you have " +
                "fitted, not whether it was the right choice — that is the Commit button's job." };
          },
          controls: function () { return []; },
          onAction: function () { return {}; }
        }
      }],
      questions: qs
    };
  }

  /* -------------------------------------------------------------------
     symptom — the workstation troubleshooting PBQ.
     ------------------------------------------------------------------- */
  if (key === "symptom") {
    const sy = s.symptom;
    const answer = SUBSYS[sy.answer];
    return {
      title: "Watch what it does, then name the subsystem",
      intro: "A machine on the bench with a fault somebody else built. Nothing has been taken apart yet — " +
        "this is what it does when you press the button.",
      panels: [{
        kind: "bench", height: 400,
        bench: {
          spec: function () {
            return buildBench({
              slots: 4, coolerMm: 145, cpuLabel: "fitted",
              /* No loose card: the signs mean this machine is together. */
              gpuMm: 0,
              /* Everything is fitted and NOTHING carries a verdict. The
                 fault is in the machine's behaviour, and a board with a
                 red pip on it would answer the question. */
              fitted: { cpu: "seated", cooler: "seated", ram: "seated", gpu: "seated",
                        psu24: "seated", eps: "seated", m2: "seated" },
              ramIn: [0, 2],
              signs: sy.signs
            });
          },
          status: function () {
            return { tone: "warn", words: "Powered on",
              detail: "Three things to look at: the fan, the speaker and the screen. " +
                "Each of them is a control below and each says what it is doing in words." };
          },
          controls: function () {
            return [
              { key: "sign-fan", label: "The chassis fan", state: sy.signs.fan ? "ok" : "bad",
                stateWords: sy.signs.fan ? "Turning" : "Not turning",
                detail: sy.signs.fan
                  ? "Spinning. Power is being delivered and the board has come out of reset."
                  : "Still. Nothing is being delivered, or nothing is asking for it." },
              { key: "sign-beep", label: "The board speaker", state: sy.signs.beep ? "warn" : "idle",
                stateWords: sy.signs.beep ? "Sounding" : "Silent",
                detail: sy.signs.beep
                  ? "Beeping. Firmware is running and has found something it has a code for."
                  : "Silent — which is two different stories: it never got as far as firmware, or it got all the way and had nothing to say." },
              { key: "sign-video", label: "The monitor", state: sy.signs.video ? "ok" : "bad",
                stateWords: sy.signs.video ? "Picture" : "No picture",
                detail: sy.signs.video
                  ? "There is an image, so video initialised."
                  : "Nothing on the screen. The lamp under the bezel is lit either way, which is why a dark monitor proves nothing on its own." }
            ];
          },
          onAction: function () { return {}; }
        }
      }, {
        kind: "note", title: "What was reported",
        paragraphs: sy.bullets.map(function (b) { return "• " + b; })
      }],
      questions: [{
        key: "sy-part", kind: "choice",
        prompt: "Which subsystem is most likely involved?",
        hints: [
          "Work out how FAR it got before it stopped. Power delivered, firmware running, memory found, " +
            "picture on the screen — each one it reached rules out everything that would have stopped it earlier.",
          "Two of these six fail in ways that look almost the same on the bench, and the sentence that separates " +
            "them is in the report rather than on the machine. Find the detail that only one of them explains."
        ],
        options: rng(s.seed + 131).shuffle(SUBSYS_KEYS.map(function (k) {
          return {
            key: k, label: SUBSYS[k].label, correct: k === sy.answer,
            why: k === sy.answer ? sy.tell
              : (sy.rules && sy.rules[k]) ||
                ("A " + SUBSYS[k].label.toLowerCase() + " fault shows as " + SUBSYS[k].looks +
                 ". That is not what this machine is doing.")
          };
        })),
        explain: answer.label + ". " + sy.tell + " " + sy.fix
      }]
    };
  }

  /* -------------------------------------------------------------------
     specs — the gaming PC diagnostic.

     Every part carries a plate. One of them disagrees with what the
     firmware is reporting, and finding that disagreement is the exercise.
     Nothing is marked until it has been read.
     ------------------------------------------------------------------- */
  if (key === "specs") {
    const sf = s.specFault;
    /* The standing plates. Only the faulted part's is overridden, so the
       contradiction cannot be found by spotting the odd formatting. */
    const PLATES = {
      cpu:    "x64 10-core · base clock 3.2 GHz · TDP 165 W · junction temperature 94 °C",
      ram:    "32 GB · DDR4-2666 · PC4-21300 · 1.2 V",
      gpu:    "5,500 compute cores · x16 PCIe interface · 8 GB GDDR6 · 225 W",
      psu:    "750 W · single +12 V rail · 90% efficiency · 110 V input",
      cooler: "Closed-loop liquid cooler · pump 40 W · 240 mm radiator",
      disk:   "500 GB NVMe SSD · PCIe 3.0 · 3,500 MB/s · 4.3 W · MTBF 1,500,000 hours",
      board:  "ATX · slot 1 x16 electrical · slot 2 x4 electrical · 75 W board draw"
    };
    PLATES[sf.part] = sf.plate;
    const LIVE_BASE = ["Version 2.14.1219 · BIOS date 04/18/2025", "USB devices: 1 keyboard, 1 mouse"];
    const read = {};
    const PART_LABEL = { cpu: "The processor", ram: "The memory", gpu: "The graphics card",
                         psu: "The power supply", cooler: "The cooler", disk: "The drive",
                         board: "The motherboard" };
    const PART_KEYS = Object.keys(PLATES);

    const causeQ = {
      key: "sp-cause", kind: "choice",
      prompt: "What is causing the machine to freeze?",
      hints: [
        "Read every plate, then read the firmware page. One number on a plate and one number in the firmware are about the same thing and do not agree.",
        "A plate is what the part was SOLD as. A live reading is what it is doing right now. Where those two disagree, the part is being asked for something it was never rated for."
      ],
      options: rng(s.seed + 149).shuffle(Object.keys(CAUSES).map(function (k) {
        return {
          key: k, label: CAUSES[k].label, correct: k === sf.cause,
          why: k === sf.cause ? sf.tell
            : (sf.wrongCause && sf.wrongCause[k]) ||
              ("Nothing on the plates or in the firmware points at that. Find the two figures that " +
               "should agree and do not, then say what would make them disagree.")
        };
      })),
      explain: CAUSES[sf.cause].label + ". " + sf.tell
    };

    const fixQ = {
      key: "sp-fix", kind: "choice",
      prompt: "What is the right resolution?",
      hints: [
        "The resolution has to move the reading that is wrong back to the figure on the plate. Ask, for each of these, which number it changes.",
        "Two of these make the disagreement bigger rather than smaller. Reading them as directions rather than as fixes rules them out at once."
      ],
      options: rng(s.seed + 151).shuffle([sf.fix].concat(sf.wrong).map(function (k) {
        return {
          key: k, label: RESOLUTIONS[k].label, correct: k === sf.fix,
          why: k === sf.fix
            ? RESOLUTIONS[k].does
            : RESOLUTIONS[k].does + " That is not what has gone wrong here."
        };
      })),
      explain: RESOLUTIONS[sf.fix].label + ". " + RESOLUTIONS[sf.fix].does
    };

    return {
      title: "Read the plates, then read the firmware",
      intro: "A custom gaming machine. It boots, and it freezes within a few minutes, every time. Every " +
        "part on the bench has its specification on it — go and read them, then read what the machine " +
        "says it is actually doing.",
      panels: [{
        kind: "bench", height: 400,
        bench: {
          spec: function () {
            return buildBench({
              slots: 4, coolerMm: 150, cpuLabel: "fitted",
              /* The machine boots and freezes, so it is together: no card
                 lying on the mat waiting to be fitted. */
              gpuMm: 0,
              fitted: { cpu: "seated", cooler: "seated", ram: "seated", gpu: "seated",
                        psu24: "seated", eps: "seated", m2: "seated" },
              ramIn: [0, 2]
            });
          },
          status: function () {
            const n = Object.keys(read).length;
            return { tone: "warn", words: "Boots, then freezes",
              detail: n + " of " + (PART_KEYS.length + 1) + " readings taken. Nothing on this machine " +
                "is marked — a plate only tells you anything once you have another number to hold it against." };
          },
          controls: function () {
            return PART_KEYS.map(function (k) {
              return { key: "plate-" + k, label: PART_LABEL[k],
                state: read[k] ? "ok" : "idle",
                stateWords: read[k] ? "Plate read" : "not read yet",
                detail: read[k] ? PLATES[k] : "Turn it over and read what it was sold as.",
                actions: [{ id: "read", label: "Read the plate", hint: "The printed specification on this part" }] };
            }).concat([{
              key: "plate-post", label: "The firmware page",
              state: read.post ? "ok" : "idle",
              stateWords: read.post ? "Read" : "not read yet",
              detail: read.post ? LIVE_BASE.concat(sf.live).join(" · ") : "What the machine reports about itself, right now.",
              actions: [{ id: "read", label: "Open the firmware page", hint: "Live readings rather than printed ratings" }]
            }]);
          },
          onAction: function (ctrlKey) {
            const k = ctrlKey.replace("plate-", "");
            read[k] = true;
            return { say: k === "post"
              ? "Firmware — " + LIVE_BASE.concat(sf.live).join(" · ")
              : PART_LABEL[k] + " — " + PLATES[k] };
          }
        }
      }],
      questions: [causeQ, fixQ]
    };
  }

  /* -------------------------------------------------------------------
     swap — the build and compatibility check.
     ------------------------------------------------------------------- */
  if (key === "swap") {
    const br = s.swapBrief;
    const NEED_KEYS = Object.keys(br.needs);
    const BUDGET = NEED_KEYS.length;
    const slotByKey = {};
    SWAP_SLOTS.forEach(function (sl) { slotByKey[sl.key] = sl; });

    const q = {
      key: "sw-config", kind: "swap",
      prompt: "Change what has to change, and nothing else.",
      detail: "You may change up to " + BUDGET + " component" + (BUDGET === 1 ? "" : "s") +
        " from the configuration as it came. Putting something back to its original is always free.",
      budget: BUDGET,
      hints: [
        "Read the requirements, not the components. Each one names a thing the machine has to DO, and " +
          "exactly one component on the list decides whether it can.",
        "Go the other way for the rest: for every component you are tempted to change, ask which " +
          "requirement it serves. If the answer is none of them, the change costs you one of your " +
          "allowance and buys nothing."
      ],
      slots: SWAP_SLOTS.map(function (sl) {
        return { key: sl.key, label: sl.label, baseline: br.base[sl.key], options: sl.options };
      }),
      check: function (chosen, spent) {
        if (spent > BUDGET) {
          return { ok: false, why: "That is " + spent + " changes and you are allowed " + BUDGET + "." };
        }
        /* Computed from `needs`, so there is no second copy of the answer.
           An unmet requirement is named in the CUSTOMER'S words, out of
           the same entry the check is testing \u2014 never as "change the
           graphics", which would be the answer rather than the brief. */
        const unmet = NEED_KEYS.filter(function (k) { return chosen[k] !== br.needs[k].to; });
        if (unmet.length) {
          return { ok: false, why: "Not there yet. Still unmet: \u201c" + br.needs[unmet[0]].req + "\u201d" };
        }
        /* Every needed change is made. A change the brief never asked for
           is worth saying and is not a failure \u2014 the requirements are
           met, and the customer is paying for something they did not ask
           for, which is a different conversation. */
        const extra = SWAP_SLOTS.filter(function (sl) {
          return chosen[sl.key] !== br.base[sl.key] && !br.needs[sl.key];
        });
        if (extra.length) {
          return { ok: true, why: "The requirements are met. Worth noticing that you also changed the " +
            extra.map(function (x) { return x.label.toLowerCase(); }).join(" and ") +
            ", which no requirement asked for \u2014 on a real quote that is money the customer did not agree to." };
        }
        return { ok: true, why: "Exactly the " + BUDGET + " that mattered, and nothing else touched. " +
          NEED_KEYS.map(function (k) { return br.needs[k].says; }).join(" ") };
      },
      explain: NEED_KEYS.map(function (k) {
        const opt = slotByKey[k].options.filter(function (o) { return o.key === br.needs[k].to; })[0];
        return slotByKey[k].label + " \u2192 " + opt.label + ". " + br.needs[k].says;
      }).join("  ")
    };

    return {
      title: "Two changes, and no more",
      intro: "The machine is already specified and it is already wrong. You are allowed to change " +
        BUDGET + " component" + (BUDGET === 1 ? "" : "s") + " \u2014 which means working out which " +
        BUDGET + " before you touch anything.",
      panels: [{
        kind: "brief", from: "The customer",
        paragraphs: [br.goal]
          .concat(NEED_KEYS.map(function (k) { return "\u201c" + br.needs[k].req + "\u201d"; }))
          .concat([br.limits])
      }, {
        kind: "bench", height: 360,
        bench: {
          spec: function () {
            const c = (q.fitState && q.fitState.placed) || br.base;
            return buildBench({
              slots: 4, cpuLabel: "as configured",
              coolerMm: 140,
              gpuMm: c.gpu === "dgpu" ? 300 : 0,
              ramIn: c.ram === "32" ? [0, 1, 2, 3] : [0, 2],
              fitted: { cpu: "seated", cooler: "seated", ram: "seated",
                        gpu: c.gpu === "dgpu" ? "seated" : "empty",
                        psu24: "seated", eps: "seated",
                        m2: c.storage === "nvme" ? "seated" : "empty" },
              /* The tape-measure half of the CAD brief, drawn rather than
                 stated: a full-length card in the compact case fouls, and
                 the clearance plane is where the side panel sits. */
              foul: (c.gpu === "dgpu" && c.case === "compact")
                ? { part: "gpu", w: 9.5, limit: 2.0, d: 2.4 } : null
            });
          },
          status: function () {
            const c = (q.fitState && q.fitState.placed) || br.base;
            const n = SWAP_SLOTS.filter(function (sl) { return c[sl.key] !== br.base[sl.key]; }).length;
            return { tone: n ? "calm" : "idle",
              words: n ? n + " change" + (n === 1 ? "" : "s") + " made" : "As it came",
              detail: "The board shows the configuration you are holding. It does not say whether it " +
                "meets the brief \u2014 read the requirements for that." };
          },
          controls: function () { return []; },
          onAction: function () { return {}; }
        }
      }],
      questions: [q]
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

  /* ------------------------------------------------------------------
     THE FOUR SIMS BROUGHT ACROSS.

     Every one of these was written after a bug of its own shape had
     already been shipped somewhere in this repo: a generated exercise
     whose own correct answer was invalid, a scenario that could not be
     solved at all, a bench that answered the question it was asked to
     illustrate. A check nobody has seen fail is not evidence, so each of
     these was calibrated by planting the defect it exists to catch.
     ------------------------------------------------------------------ */

  /* twobuilds. Two machines that agree everywhere teach nothing \u2014 the
     whole lesson is that one shelf answers two briefs differently. */
  (sc.machines || []).forEach(function (mk) {
    if (!MACHINES[mk]) { bad.push("machine \"" + mk + "\" is not in the table"); return; }
    PB_SLOTS.forEach(function (sl) {
      const want = MACHINES[mk].pick[sl.key];
      if (!PB_SHELF[sl.key].some(function (x) { return x.key === want; })) {
        bad.push(mk + " wants a " + sl.label.toLowerCase() + " part (\"" + want + "\") that is not on the shelf");
      }
      if (!MACHINES[mk].why[sl.key]) bad.push(mk + " has no reason for its " + sl.label.toLowerCase() + " choice");
    });
  });
  if ((sc.machines || []).length === 2) {
    const differ = PB_SLOTS.filter(function (sl) {
      return MACHINES[sc.machines[0]].pick[sl.key] !== MACHINES[sc.machines[1]].pick[sl.key];
    }).length;
    if (differ < 4) {
      bad.push("the two machines agree in " + (PB_SLOTS.length - differ) + " of " + PB_SLOTS.length +
        " slots \u2014 too alike to show that the shelf answers differently");
    }
  }

  /* symptom. A wrong-option reason attached to the CORRECT option would
     replace the tell with a sentence explaining why it is not the
     answer, which is how a student gets marked right and taught wrong. */
  const sy = sc.symptom;
  if (!sy || !SUBSYS[sy.answer]) {
    bad.push("symptom answer \"" + (sy && sy.answer) + "\" is not a subsystem");
  } else {
    if ((sy.bullets || []).length < 4) {
      bad.push("symptom " + sy.key + " has fewer than four observations \u2014 nowhere to bury the detail that decides it");
    }
    Object.keys(sy.rules || {}).forEach(function (k) {
      if (!SUBSYS[k]) bad.push("symptom " + sy.key + " has a near-miss note for \"" + k + "\", which is not a subsystem");
      if (k === sy.answer) bad.push("symptom " + sy.key + " has a near-miss note on its own correct answer");
    });
  }
  /* Table-level, and deliberately not per-symptom: a machine that is
     completely dead really is diagnosable from the bench alone, and that
     is sound content rather than a leak. What would be a leak is a table
     where EVERY sign pattern names its own answer, because then the
     brief is decoration and nobody ever has to read one. */
  const byPattern = {};
  SYMPTOMS.forEach(function (x) {
    const p = (x.signs.fan ? "F" : "-") + (x.signs.beep ? "B" : "-") + (x.signs.video ? "V" : "-");
    (byPattern[p] = byPattern[p] || []).push(x.answer);
  });
  const contested = Object.keys(byPattern).filter(function (p) {
    return byPattern[p].some(function (a) { return a !== byPattern[p][0]; });
  }).length;
  if (contested < 3) {
    bad.push("only " + contested + " sign patterns are shared by symptoms with different answers \u2014 " +
      "the bench is answering the question instead of illustrating it");
  }

  /* specs. Six options on each of the two questions, the correct one
     never among the wrong ones, and the part it turns on actually drawn. */
  const sf = sc.specFault;
  const SPEC_PARTS = ["cpu", "ram", "gpu", "psu", "cooler", "disk", "board"];
  if (!sf) { bad.push("no spec fault generated"); }
  else {
    if (SPEC_PARTS.indexOf(sf.part) < 0) bad.push("spec fault " + sf.key + " turns on \"" + sf.part + "\", which the bench does not draw a plate for");
    if (!CAUSES[sf.cause]) bad.push("spec fault " + sf.key + " has cause \"" + sf.cause + "\", which is not in the table");
    if (!RESOLUTIONS[sf.fix]) bad.push("spec fault " + sf.key + " has resolution \"" + sf.fix + "\", which is not in the table");
    if ((sf.wrong || []).length !== 5) bad.push("spec fault " + sf.key + " offers " + (sf.wrong || []).length + " wrong resolutions, not five");
    if ((sf.wrong || []).indexOf(sf.fix) >= 0) bad.push("spec fault " + sf.key + " lists its own resolution among the wrong ones");
    (sf.wrong || []).forEach(function (k) {
      if (!RESOLUTIONS[k]) bad.push("spec fault " + sf.key + " names resolution \"" + k + "\", which is not in the table");
    });
    if (!(sf.live || []).length) bad.push("spec fault " + sf.key + " has no live reading to hold the plate against");
    Object.keys(sf.wrongCause || {}).forEach(function (k) {
      if (!CAUSES[k]) bad.push("spec fault " + sf.key + " has a near-miss note for cause \"" + k + "\", which is not in the table");
      if (k === sf.cause) bad.push("spec fault " + sf.key + " has a near-miss note on its own correct cause");
    });
    if (Object.keys(CAUSES).length !== 6) bad.push("there are " + Object.keys(CAUSES).length + " causes, and the rule is six");
  }

  /* swap. The one that matters: a brief has to be SOLVABLE inside its own
     budget. Applying every stated need must produce a configuration that
     is internally consistent \u2014 otherwise the student is asked to fix
     three things with two changes and no seed will ever tell them which
     one they were not allowed to reach. */
  const br = sc.swapBrief;
  if (!br) { bad.push("no swap brief generated"); }
  else {
    const slotByKey = {};
    SWAP_SLOTS.forEach(function (sl) { slotByKey[sl.key] = sl; });
    SWAP_SLOTS.forEach(function (sl) {
      if (!sl.options.some(function (o) { return o.key === br.base[sl.key]; })) {
        bad.push("swap brief " + br.key + " has a baseline " + sl.label.toLowerCase() + " that is not one of its options");
      }
    });
    const solved = Object.assign({}, br.base);
    Object.keys(br.needs).forEach(function (k) {
      const n = br.needs[k];
      if (!slotByKey[k]) { bad.push("swap brief " + br.key + " needs \"" + k + "\", which is not a component"); return; }
      if (!slotByKey[k].options.some(function (o) { return o.key === n.to; })) {
        bad.push("swap brief " + br.key + " needs a " + k + " option (\"" + n.to + "\") that is not on the list");
      }
      if (br.base[k] === n.to) {
        bad.push("swap brief " + br.key + " \"needs\" a " + k + " it already has \u2014 that requirement costs no change and teaches nothing");
      }
      if (!n.req) bad.push("swap brief " + br.key + " has a need with no requirement to state it in the customer's words");
      solved[k] = n.to;
    });
    swapFaults(solved).forEach(function (f) {
      bad.push("swap brief " + br.key + " cannot be solved inside its budget: making every change it asks for still leaves " + f);
    });
    /* ...and the baseline must actually be wrong, or the stage opens
       already answered. */
    if (!Object.keys(br.needs).some(function (k) { return br.base[k] !== br.needs[k].to; })) {
      bad.push("swap brief " + br.key + " starts from a baseline that already meets every requirement");
    }
  }

  return bad;
}

/* What is physically or electrically wrong with a swap configuration,
   independent of any brief. The `swap` stage never shows this list \u2014 it
   exists so `selfCheck` can prove that every brief's own stated changes
   leave a machine that works. */
function swapFaults(c) {
  const out = [];
  if (c.mobo === "wrong") out.push("a board whose socket does not match the processor");
  if (c.gpu === "dgpu" && c.psu !== "650") out.push("a full-size card behind a supply that cannot feed it");
  if (c.gpu === "dgpu" && c.case !== "tower") out.push("a full-length card in a case that will not close on it");
  if (c.cpu === "amdvirt" && c.mobo !== "matx") out.push("an AMD processor on a board with an Intel socket");
  if ((c.cpu === "virt" || c.cpu === "novirt") && c.mobo === "matx") out.push("an Intel processor on a board with an AMD socket");
  return out;
}

export function variantKey(sc) { return sc.profileKey + "/" + sc.fault; }
