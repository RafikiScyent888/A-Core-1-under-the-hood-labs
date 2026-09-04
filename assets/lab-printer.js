/* =====================================================================
   Printer — all four types, because all four are on the exam.

   The Field Service Center diagnoses a broken printer. This does the
   job around it: work out which technology the customer actually needs,
   get it deployed, then read a bad page and work backwards to the part
   that made it.

   THE MECHANISM IS THE SEVEN-STEP LASER IMAGING PROCESS. Students learn
   it as a mnemonic and lose the marks anyway, because the exam asks
   which step failed given a defect on the page. So the mechanism view
   walks a sheet through all seven steps, and each defect in this lab is
   generated FROM a broken step rather than picked from a list — which
   means the defect and its cause can never drift apart.
   ===================================================================== */
import { rng } from "./rng.js";

/* ------------------------------------------------------------------
   The four technologies.
   ------------------------------------------------------------------ */
export const TYPES = {
  laser: {
    name: "Laser",
    good: "Fast, cheap per page at volume, and the output does not smudge or run.",
    bad: "Expensive to buy, and it does not do multi-part carbon forms at all.",
    duty: 50000, cpp: 0.02, colour: true, carbon: false, photo: false, receipt: false
  },
  inkjet: {
    name: "Inkjet",
    good: "Cheap to buy, and the only one here that does real photographic colour.",
    bad: "Costly per page, slow at volume, and the heads clog if it sits unused.",
    duty: 3000, cpp: 0.12, colour: true, carbon: false, photo: true, receipt: false
  },
  thermal: {
    name: "Thermal",
    good: "Almost no moving parts and no consumables but the paper. Silent and quick for short runs.",
    bad: "Special heat-sensitive paper only, and the print fades with heat and light.",
    duty: 20000, cpp: 0.01, colour: false, carbon: false, photo: false, receipt: true
  },
  impact: {
    name: "Impact (dot matrix)",
    good: "The only technology here that can print through multi-part carbon forms, because it strikes the paper.",
    bad: "Loud, slow, and the print quality is poor by any modern standard.",
    duty: 8000, cpp: 0.03, colour: false, carbon: true, photo: false, receipt: false
  }
};

/* ------------------------------------------------------------------
   The seven steps, in order, each with what breaks when it fails and
   what that looks like on the page. Every defect in this lab is
   generated from this table, so a defect can never name a part that
   this table does not blame.
   ------------------------------------------------------------------ */
export const STEPS = [
  { key: "processing", at: 1, name: "Processing",
    doing: "The formatter turns the incoming job into a bitmap of the whole page and holds it in memory.",
    part: "formatter board or memory",
    defect: "Half the page prints, then it stops, or the job comes out as pages of nonsense characters.",
    why: "There is nothing wrong with the imaging hardware — the page never got built correctly in the first place." },
  { key: "charging", at: 2, name: "Charging",
    doing: "The primary charge roller lays a uniform negative charge across the whole drum surface.",
    part: "primary charge roller",
    defect: "The whole page comes out uniformly grey or black, with no white anywhere.",
    why: "With no even charge on the drum, toner has nothing to be repelled by, so it sticks everywhere." },
  { key: "exposing", at: 3, name: "Exposing",
    doing: "The laser writes the page onto the drum, discharging the spots where toner should end up.",
    part: "laser or scanner assembly",
    defect: "The page is blank, or has bands and streaks running the length of it in the direction of travel.",
    why: "The image is never written onto the drum, so there is nothing for toner to be attracted to." },
  { key: "developing", at: 4, name: "Developing",
    doing: "The developer roller brings toner to the drum, and it sticks only to the discharged areas.",
    part: "developer roller or toner cartridge",
    defect: "Print is faint and washed out, or fades from one side of the page to the other.",
    why: "Toner is reaching the drum unevenly or barely at all — usually the cartridge, occasionally the roller." },
  { key: "transferring", at: 5, name: "Transferring",
    doing: "The transfer roller pulls the toner off the drum and onto the paper.",
    part: "transfer roller",
    defect: "Faint, patchy print, often with toner visibly left behind on the drum.",
    why: "The toner image was made correctly but never made it onto the sheet." },
  { key: "fusing", at: 6, name: "Fusing",
    doing: "Heat and pressure melt the toner into the paper fibres.",
    part: "fuser assembly",
    defect: "The print smears when you rub it, or comes off on your fingers.",
    why: "This is the giveaway defect. The image is perfect until it is touched, because it was never melted in." },
  { key: "cleaning", at: 7, name: "Cleaning",
    doing: "The blade and lamp scrape and discharge whatever is left, so the drum starts the next page clean.",
    part: "cleaning blade or drum",
    defect: "The same mark repeats down the page at a regular interval.",
    why: "Leftover toner goes round with the drum and prints again every revolution — the spacing IS the drum's circumference." }
];


/* ------------------------------------------------------------------
   What each diagnostic shows, per broken step. Three checks, and the
   pattern ACROSS them is the diagnosis — no single one gives it away.

   Derived from STEPS rather than written per scenario, so a reading can
   never point at a step this lab does not blame.
   ------------------------------------------------------------------ */
const DIAGNOSTICS = {
  processing: {
    page:  "The internal test page prints perfectly — clean, dense, correct.",
    drum:  "Drum surface normal. Even charge, clean after the blade.",
    fuser: "Fuser at 181 °C. Within range."
  },
  charging: {
    page:  "Test page comes out uniformly dark. No white anywhere on the sheet.",
    drum:  "Drum holds almost no charge — the meter reads near zero across the surface.",
    fuser: "Fuser at 179 °C. Within range."
  },
  exposing: {
    page:  "Test page is blank, with faint bands running the length of it.",
    drum:  "Drum is evenly charged, but there is no latent image written on it at all.",
    fuser: "Fuser at 182 °C. Within range."
  },
  developing: {
    page:  "Test page is faint and washed out, fading from one side to the other.",
    drum:  "Latent image is there, but toner is arriving on it unevenly and thinly.",
    fuser: "Fuser at 180 °C. Within range."
  },
  transferring: {
    page:  "Test page is patchy and pale in large areas.",
    drum:  "A full, correct toner image is still sitting on the drum AFTER the sheet has passed.",
    fuser: "Fuser at 178 °C. Within range."
  },
  fusing: {
    page:  "Test page image is perfect and dense — and it smears the moment you touch it.",
    drum:  "Drum surface normal. Even charge, clean after the blade.",
    fuser: "Fuser at 121 °C. Expected 175 to 190 °C."
  },
  cleaning: {
    page:  "Test page carries the same small mark repeating down it at a regular spacing.",
    drum:  "Residual toner is still on the drum where the blade should have scraped it.",
    fuser: "Fuser at 180 °C. Within range."
  }
};

const CUSTOMERS = [
  { who: "Kestrel Accountancy",        size: "Small Business" },
  { who: "Northgate Veterinary",       size: "Small Business" },
  { who: "Ellery Coach Tours",         size: "Mid-Market" },
  { who: "Ashworth Council — Housing", size: "Mid-Market" },
  { who: "Pinnacle Logistics",         size: "Major Corporation" }
];

/* Each job states, in customer language, what it needs. `best` is the
   ground truth everything else is graded against. */
const JOBS = [
  { key: "office", what: "the general office printer", best: "laser", volume: 9000,
    said: ["it is contracts and letters all day, forty or fifty pages at a time",
           "the last one could not keep up and everybody queued behind it",
           "we watch the running costs closely — it adds up over a year"] },
  { key: "photo", what: "the marketing proof printer", best: "inkjet", volume: 400,
    said: ["we need to see how the brochure photographs will actually look before they go to the printers",
           "it is a handful of pages a day, not a lot",
           "the colour has to be right — that is the entire point of it"] },
  { key: "till", what: "the counter receipt printer", best: "thermal", volume: 12000,
    said: ["it prints a receipt every time somebody pays, all day",
           "there is no room behind the counter and it cannot be noisy with customers standing there",
           "nobody keeps them — they are in the bin or in a pocket by the end of the day"] },
  { key: "forms", what: "the despatch note printer", best: "impact", volume: 6000,
    said: ["the driver keeps one copy, the customer signs and keeps one, and one comes back to us",
           "it is a three-part form on the roll, and all three have to be legible",
           "the warehouse is loud anyway, so noise is not a problem"] },
  { key: "records", what: "the patient records printer", best: "laser", volume: 15000,
    said: ["notes get printed for every appointment and there are a lot of appointments",
           "they go in a folder and get handled for years, so the print cannot smudge",
           "black and white is fine, nobody needs colour on a case note"] }
];

const NOISE = [
  "The old one is in the corridor if you want to look at it.",
  "Whatever you pick has to work with the trolley it sits on.",
  "Someone said we should lease rather than buy, but I do not know.",
  "The IT company we used before never returned our calls.",
  "It has to be in before the audit, whenever that is."
];

const BRANDS = ["Corvid", "Halden", "Meritas", "Orrick"];

export function generate(seed) {
  const r = rng(seed);
  const customer = r.pick(CUSTOMERS);
  const job = r.pick(JOBS);
  const type = TYPES[job.best];

  /* The defect is generated FROM a broken step. Laser jobs can break at
     any of the seven; the other technologies do not have a drum, so
     they get the steps that still apply. This is why a defect can never
     name a part the process table does not blame. */
  const laserish = job.best === "laser";
  const brokenStep = laserish ? r.pick(STEPS)
    : r.pick(STEPS.filter(function (s) { return s.key === "processing"; }));

  const model = r.pick(BRANDS) + " " + r.int(200, 899) + (r.next() > 0.5 ? "dn" : "n");

  /* Duty cycle is a MONTHLY maximum. The scenario is generated so the
     honest answer is sometimes "this model is not big enough", because
     a lab where the first option always fits teaches nothing. */
  const tooSmall = r.next() < 0.4;
  const dutyRated = tooSmall
    ? Math.round(job.volume * (0.4 + r.next() * 0.4) / 500) * 500
    : Math.round(job.volume * (1.6 + r.next() * 2.5) / 500) * 500;

  const said = r.shuffle(job.said.concat(r.some(NOISE, 2)));

  /* Deployment: one of these is wrong, and it is the one that would
     actually stop the job. */
  const ip = "192.168." + r.int(2, 40) + "." + r.int(20, 240);

  return {
    seed: seed, customer: customer, job: job, best: job.best, type: type,
    said: said, model: model, volume: job.volume, dutyRated: dutyRated,
    tooSmall: dutyRated < job.volume,
    brokenStep: brokenStep, laserish: laserish, ip: ip,
    /* Consumable maths for the lab tier. */
    tonerYield: r.pick([1500, 2500, 3000, 6000]),
    tonerCost: r.pick([48, 62, 79, 94])
  };
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */

function briefPanel(s) {
  return {
    kind: "brief",
    from: s.customer.who + " — " + s.customer.size,
    paragraphs: ["We need you to sort out " + s.job.what + "."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

/* The seven-step imaging view. Each frame is the drum surface and the
   sheet at that moment, so the student watches charge go on, the laser
   write, toner arrive, and the fuser melt it in. */
function imagingFrames(s) {
  const cols = [
    { name: "Drum", sub: "surface" },
    { name: "Toner", sub: "developer" },
    { name: "Paper", sub: "the sheet" }
  ];
  function f(caption, drum, toner, paper, tones, heads) {
    return {
      columns: heads || cols,
      caption: caption,
      rows: [[
        { label: drum, tone: tones[0] },
        { label: toner, tone: tones[1] },
        { label: paper, tone: tones[2] }
      ]]
    };
  }
  return [
    f("1 — PROCESSING. Nothing has moved yet. The formatter is building a bitmap of the whole page in memory. " +
      "If this step fails you get half a page or nonsense, and no amount of replacing rollers will help.",
      "idle", "—", "blank", [null, null, null]),
    f("2 — CHARGING. The primary charge roller lays an even negative charge across the entire drum. " +
      "Even is the important word: any bare patch will take toner it should not.",
      "−−−−−", "—", "blank", ["parity", null, null]),
    f("3 — EXPOSING. The laser discharges the spots where toner should go. The drum now holds an invisible " +
      "electrostatic image of the page.",
      "−−□□−", "—", "blank", ["parity", null, null]),
    f("4 — DEVELOPING. The developer roller offers toner to the drum. It sticks only to the discharged spots, " +
      "because the charged areas repel it.",
      "−−██−", "▓▓▓", "blank", ["parity", "data", null]),
    f("5 — TRANSFERRING. The transfer roller charges the paper from below and pulls the toner off the drum onto it. " +
      "At this moment the toner is only SITTING on the sheet — it is loose powder.",
      "−−░░−", "▓▓", "██", ["parity", "data", "data"]),
    f("6 — FUSING. Heat and pressure melt the toner into the paper fibres. This is the step that makes print permanent, " +
      "and the reason a failed fuser gives you print that rubs off on your fingers.",
      "−−░░−", "▓▓", "██", ["parity", "data", "rebuild"]),
    f("7 — CLEANING. The blade scrapes leftover toner and the lamp discharges the drum, so the next page starts clean. " +
      "Leftovers here come round again and print as a mark repeating at exactly the drum's circumference.",
      "clean", "▓▓", "██", [null, "data", "rebuild"])
  ];
}

function typeOptions(s) {
  const job = s.job;
  return Object.keys(TYPES).map(function (k) {
    const T = TYPES[k];
    let why;
    if (k === s.best) {
      why = T.good + " That is what this job asked for.";
    } else if (job.key === "forms" && !T.carbon) {
      why = T.name + " does not strike the paper, so it cannot print through a multi-part carbon form. " +
        "Only the top copy would come out.";
    } else if (job.key === "photo" && !T.photo) {
      why = T.name + " cannot do photographic colour well enough to judge a brochure by. " + T.bad;
    } else if (job.key === "till" && !T.receipt) {
      why = T.name + " needs consumables and space this counter does not have, and it is noisy in front of customers.";
    } else if (job.volume > T.duty) {
      why = T.name + " tops out around " + T.duty.toLocaleString() + " pages a month. They need " +
        job.volume.toLocaleString() + ".";
    } else if (T.cpp > TYPES[s.best].cpp * 2) {
      why = "At roughly " + T.cpp.toFixed(2) + " a page against " + TYPES[s.best].cpp.toFixed(2) +
        ", this costs them several times more per year for the same work. " + T.bad;
    } else {
      why = T.bad;
    }
    return { key: k, label: T.name, correct: k === s.best, why: why };
  });
}

/* ------------------------------------------------------------------
   Stages
   ------------------------------------------------------------------ */
export function buildStage(key, s) {
  const T = s.type;

  if (key === "brief") {
    const job = s.job;
    return {
      title: "What are they actually asking for?",
      intro: "Customers describe the job, not the technology. Turn what they said into something you can choose against.",
      panels: [briefPanel(s)],
      questions: [{
        key: "pr-brief", kind: "multi",
        prompt: "Which of these are real constraints they gave you?",
        detail: "Some of this is the job. Some of it is conversation.",
        hints: [
          "Take the quotes one at a time and ask: could I test a finished printer against this? If not, it is chat.",
          "A constraint rules something OUT. Look for the sentences that would make one of the four technologies impossible."
        ],
        options: [
          { key: "carbon", label: "It has to print multi-part carbon forms", correct: job.key === "forms",
            why: job.key === "forms"
              ? "Yes — three copies, all legible, from one pass. That rules out everything that does not strike the paper."
              : "Nobody mentioned carbon forms. Do not invent a constraint that removes three of your four options." },
          { key: "photo", label: "Photographic colour quality matters", correct: job.key === "photo",
            why: job.key === "photo"
              ? "Yes — they said the colour has to be right, and that judging the brochure is the whole point."
              : "They did not ask for photographic colour. Adding it would push you toward the wrong technology." },
          { key: "quiet", label: "It has to be quiet and take almost no space", correct: job.key === "till",
            why: job.key === "till"
              ? "Yes — no room behind the counter, and customers are standing there."
              : "Nothing in the brief mentions noise or space as a problem." },
          { key: "vol", label: "It runs roughly " + job.volume.toLocaleString() + " pages a month", correct: true,
            why: "Yes. Volume is the constraint most often skipped, and it is the one that decides whether a machine survives the year." },
          { key: "audit", label: "It must be installed before the audit", correct: false,
            why: "A deadline. It does not change which technology fits." }
        ],
        explain: "Constraints rule options out. Preferences do not. Sort them before you look at a single model."
      }]
    };
  }

  if (key === "choose") {
    return {
      title: "Choose the technology",
      intro: "Four technologies, and every one of them is right for some job. Say which job this is.",
      panels: [briefPanel(s)],
      questions: [{
        key: "pr-type", kind: "choice",
        prompt: "Which technology does this job call for?",
        hints: [
          "Start with whatever the brief makes IMPOSSIBLE. One sentence in there usually eliminates two or three outright.",
          "If more than one survives, the decider is volume against cost per page. A machine that fits the work but bankrupts them over a year is still the wrong machine."
        ],
        options: typeOptions(s),
        explain: T.good
      }]
    };
  }

  if (key === "deploy") {
    return {
      title: "Get it on the network",
      intro: "The " + s.model + " is out of its box and powered up. It has an address but nothing can print to it.",
      panels: [{
        kind: "table", title: "What the printer's own configuration page says",
        columns: ["Setting", "Value"],
        rows: [
          { cells: ["IP address", s.ip] },
          { cells: ["Subnet mask", "255.255.255.0"] },
          { cells: ["Default gateway", "not set"], flag: "bad" },
          { cells: ["DHCP", "off — address set by hand"] },
          { cells: ["Raw port 9100", "listening"] },
          { cells: ["Driver on the workstations", "installed"] }
        ]
      }],
      questions: [{
        key: "pr-deploy", kind: "order",
        prompt: "Put the deployment steps in the order you would actually do them.",
        detail: "Click a step to add it, click it again in the list to take it back out.",
        hints: [
          "Think about what each step DEPENDS on. You cannot test a queue you have not created, and you cannot create a working queue to an address that is not reachable.",
          "Work from the network upwards: is it reachable, is it reserved so it stays reachable, then the queue, then the proof."
        ],
        steps: [
          { key: "gw", at: 1, label: "Set the default gateway so it is reachable from other subnets" },
          { key: "res", at: 2, label: "Reserve the address so DHCP never hands it to something else" },
          { key: "queue", at: 3, label: "Create the print queue pointing at that address on port 9100" },
          { key: "test", at: 4, label: "Print a test page from a workstation and check it arrives" },
          { key: "doc", at: 5, label: "Record the address and queue name where the next person will find them" }
        ],
        explain: "Reachable, then reserved, then the queue, then proof, then written down. " +
          "The gateway is first because everything after it depends on the printer being reachable at all."
      }]
    };
  }

  if (key === "defect") {
    /* WAS: the defect described in a panel, then pick the step. That
       tested recall of a table. Now the student RUNS THE DIAGNOSTICS —
       print a test page, look at the drum, check the fuser — and the
       pattern across the three is the diagnosis. No single reading
       gives it away, which is the point. */
    const st = s.brokenStep;
    const d = DIAGNOSTICS[st.key];
    const others = STEPS.filter(function (x) { return x.key !== st.key; });
    const wrong = rng(s.seed + 7).some(others, 3);
    return {
      title: "Work out what is wrong with it",
      intro: "It is deployed and printing badly. You have the machine in front of you — find out why.",
      panels: [{
        kind: "note", title: "What the user reported",
        paragraphs: [st.defect]
      }, {
        kind: "note", title: "Already ruled out",
        paragraphs: ["The driver is current, it does the same from three different workstations, " +
          "and another machine on the same queue prints the job correctly."]
      }],
      questions: [{
        key: "pr-defect", kind: "probe",
        instrument: "Bench diagnostics",
        prompt: "Run all three checks.",
        detail: "Click a check to run it.",
        hints: [
          "Run all three before concluding anything. Any one of them on its own is consistent with more than one fault.",
          "Ask how FAR the page got before it went wrong. A page that images correctly and then fails has a late-stage problem; a blank one failed early."
        ],
        points: [
          { key: "page", label: "Print the internal test page", sub: "bypasses the driver entirely",
            reading: d.page, expected: "clean, dense, permanent",
            bad: st.key !== "processing" },
          { key: "drum", label: "Open it and inspect the drum", sub: "charge, latent image, residue",
            reading: d.drum, expected: "evenly charged, image written, clean after the blade",
            bad: ["charging", "exposing", "developing", "transferring", "cleaning"].indexOf(st.key) >= 0 },
          { key: "fuser", label: "Check the fuser temperature", sub: "with the machine warmed up",
            reading: d.fuser, expected: "175 to 190 °C",
            bad: st.key === "fusing" }
        ],
        then: {
          kind: "choice",
          prompt: "Which step of the imaging process is failing?",
          hints: [
            "Look at which of the three checks came back abnormal, and which came back clean. The clean ones eliminate as much as the abnormal one confirms.",
            "The internal test page bypasses the driver and the formatter's job handling. If that page is also wrong, the fault is in the imaging hardware; if it is perfect, it is not."
          ],
          options: rng(s.seed + 11).shuffle([{ key: st.key, label: st.name, correct: true, why: st.why }]
            .concat(wrong.map(function (w) {
              return { key: w.key, label: w.name, correct: false,
                why: w.name + " is where " + w.doing.charAt(0).toLowerCase() + w.doing.slice(1).replace(/\.$/, "") +
                  ". Your checks would then have shown: " +
                  DIAGNOSTICS[w.key].page.charAt(0).toLowerCase() + DIAGNOSTICS[w.key].page.slice(1) };
            }))),
          explain: st.name + " — " + st.why + " The part to order is the " + st.part + "."
        }
      }]
    };
  }

  if (key === "duty") {
    return {
      title: "Will it survive the year?",
      intro: "Duty cycle is a monthly maximum, not a target. Running a machine near it is how you buy the same printer twice.",
      panels: [{
        kind: "table", title: "The model on the quote",
        columns: ["", ""],
        rows: [
          { cells: ["Model", s.model] },
          { cells: ["Rated monthly duty cycle", s.dutyRated.toLocaleString() + " pages"] },
          { cells: ["What they told you they print", s.volume.toLocaleString() + " pages a month"] }
        ]
      }],
      questions: [
        { key: "pr-annual", kind: "number",
          prompt: "How many pages a year is that, at the volume they described?",
          unit: "pages", answer: s.volume * 12, tolerance: 0,
          hints: [
            "The monthly figure is in the table above.",
            "A year is twelve months. This one is deliberately simple — the point is having the annual number in front of you before you judge the machine."
          ],
          explain: s.volume.toLocaleString() + " × 12 = " + (s.volume * 12).toLocaleString() + " pages a year." },
        { key: "pr-fit", kind: "choice",
          prompt: "Is the " + s.model + " the right size for this?",
          hints: [
            "Compare the two numbers in the table. Then think about what a rated maximum actually means for a machine running every day.",
            "A duty cycle is the most a machine can do without damage, not the amount it should do. Sizing to the ceiling leaves nothing for a busy month."
          ],
          options: [
            { key: "under", label: "No — their volume is above what it is rated for", correct: s.tooSmall,
              why: s.tooSmall
                ? "Right. " + s.volume.toLocaleString() + " a month against a " + s.dutyRated.toLocaleString() +
                  " rating. It will be worn out long before it is paid for."
                : "It is rated for " + s.dutyRated.toLocaleString() + " and they print " + s.volume.toLocaleString() +
                  ". It is comfortably inside." },
            { key: "ok", label: "Yes — their volume sits comfortably inside the rating", correct: !s.tooSmall,
              why: !s.tooSmall
                ? "Right. " + s.volume.toLocaleString() + " against " + s.dutyRated.toLocaleString() +
                  " leaves real headroom for a busy month."
                : "It is not. They need " + s.volume.toLocaleString() + " and it is rated for " +
                  s.dutyRated.toLocaleString() + " — they are over the ceiling before a busy month even starts." },
            { key: "exact", label: "It does not matter — duty cycle is marketing", correct: false,
              why: "It is a real engineering limit. Sustained running above it is how a machine that should last five years lasts eighteen months." },
            { key: "dpi", label: "Cannot say without knowing the print resolution", correct: false,
              why: "Resolution does not enter into duty cycle. Pages are pages." }
          ],
          explain: s.tooSmall
            ? "Undersized. Size to comfortably above the real volume, not to the rated ceiling."
            : "Correctly sized, with headroom. That headroom is the point." }
      ]
    };
  }

  if (key === "imaging") {
    return {
      title: "Walk a page through all seven steps",
      intro: "This is the process everybody memorises as a mnemonic and then cannot use. Watch it once and the defects start explaining themselves.",
      panels: [{ kind: "mech", title: "One sheet, seven steps", frames: imagingFrames(s) }],
      questions: [
        { key: "im-order", kind: "order",
          prompt: "Put the seven steps back in order.",
          hints: [
            "Step through the frames above again — the caption on each one is numbered.",
            "Follow the physics rather than the mnemonic. The drum has to be charged before anything can be written on it, and toner has to be on the paper before it can be melted into it."
          ],
          steps: STEPS.map(function (st) { return { key: st.key, at: st.at, label: st.name }; }),
          explain: "Processing, charging, exposing, developing, transferring, fusing, cleaning." },
        { key: "im-fuse", kind: "choice",
          prompt: "Print that rubs off on your fingers. Which step failed, and how do you know?",
          hints: [
            "Look at frame 6 again and ask what it is the only step that does.",
            "The image is perfect until it is touched. That tells you every step that BUILDS the image worked — so the failure is after all of them."
          ],
          options: [
            { key: "fusing", label: "Fusing — it is the only step that makes the toner permanent", correct: true,
              why: "Right. The image is correct, so everything up to transferring worked. Only the melting failed." },
            { key: "transferring", label: "Transferring — the toner never reached the paper properly", correct: false,
              why: "If transferring had failed the print would be faint or patchy. It is not — it is a good image that will not stay put." },
            { key: "developing", label: "Developing — not enough toner reached the drum", correct: false,
              why: "That gives faint, washed-out print. This print is dense and correct until you touch it." },
            { key: "cleaning", label: "Cleaning — leftover toner is coming off on your hands", correct: false,
              why: "A cleaning failure prints a repeating mark down the page. It does not stop the rest of the page fusing." }
          ],
          explain: "Smearing is the one defect that names its step outright. Fusing is the only step whose job is permanence." }
      ]
    };
  }

  if (key === "consum") {
    const perPage = s.tonerCost / s.tonerYield;
    const yearly = Math.round(perPage * s.volume * 12);
    return {
      title: "What it costs to run",
      intro: "The purchase price is the small number. This is the one that decides whether you chose well.",
      panels: [{
        kind: "table", title: "Consumables for the " + s.model,
        columns: ["", ""],
        rows: [
          { cells: ["Toner cartridge yield", s.tonerYield.toLocaleString() + " pages"] },
          { cells: ["Cartridge price", "£" + s.tonerCost] },
          { cells: ["Their monthly volume", s.volume.toLocaleString() + " pages"] }
        ],
        note: "Yield figures are quoted at 5% page coverage — about a page of ordinary text."
      }],
      questions: [
        { key: "cn-cpp", kind: "number",
          prompt: "Toner cost per page, in pence?",
          unit: "pence", answer: Math.round(perPage * 100 * 100) / 100, tolerance: 0.15,
          hints: [
            "Price of a cartridge, divided by how many pages it lasts. Both figures are in the table.",
            "That gives you pounds per page. The question asks for pence, so there is one more step."
          ],
          explain: "£" + s.tonerCost + " ÷ " + s.tonerYield.toLocaleString() + " = £" + perPage.toFixed(4) +
            " ≈ " + (Math.round(perPage * 10000) / 100) + "p a page." },
        { key: "cn-year", kind: "number",
          prompt: "Toner cost for a year at their volume?",
          unit: "£", answer: yearly, tolerance: Math.max(2, yearly * 0.04),
          hints: [
            "You have the cost per page from the previous question. You need the number of pages in a year.",
            "Monthly volume × 12 gives the pages. Multiply that by what one page costs."
          ],
          explain: (s.volume * 12).toLocaleString() + " pages × £" + perPage.toFixed(4) + " ≈ £" + yearly.toLocaleString() +
            " a year in toner alone — often more than the machine cost." }
      ]
    };
  }

  if (key === "scanflow") {
    return {
      title: "Scan to folder, and secure release",
      intro: "The half of an MFD nobody configures properly, and the half that generates the support calls.",
      panels: [{
        kind: "note", title: "What they asked for",
        paragraphs: [
          "Scans should land in a shared folder on the file server, named by the person who scanned them.",
          "Printing must not come out until the person who sent it is standing at the machine — case notes were left in the tray twice last month."
        ]
      }],
      questions: [{
        key: "sf-secure", kind: "choice",
        prompt: "Which of these actually solves the paper-left-in-the-tray problem?",
        hints: [
          "Three of these make the problem less likely. Only one makes it impossible.",
          "Ask what happens if somebody sends a job and then gets distracted for an hour. Which option still keeps the paper out of the tray?"
        ],
        options: [
          { key: "hold", label: "Hold the job at the printer until the sender authenticates at the panel", correct: true,
            why: "Right — the paper is not printed at all until somebody is standing there. Nothing can be left because nothing comes out early." },
          { key: "banner", label: "Print a banner page with the sender's name on top of each job", correct: false,
            why: "That tells you whose confidential notes are lying in the tray. It does not stop them lying there." },
          { key: "tray", label: "Give each department its own output tray", correct: false,
            why: "Narrows who can pick it up by accident, but the paper is still sitting out unattended." },
          { key: "log", label: "Enable job logging so you can see who printed what", correct: false,
            why: "That is an audit trail after the fact. It does not prevent anything." }
        ],
        explain: "Secure print release holds the job in memory until the sender authenticates. It is the only option here that changes when the paper appears."
      }]
    };
  }

  if (key === "fleet") {
    const dept = Math.round(s.volume * 3.4);
    const perUnit = Math.max(s.dutyRated, 5000);
    const need = Math.ceil(dept / (perUnit * 0.6));
    return {
      title: "Size it for the whole department",
      intro: "One machine became three floors. The arithmetic is the same; the consequences of getting it wrong are bigger.",
      panels: [{
        kind: "table", title: "The department",
        columns: ["", ""],
        rows: [
          { cells: ["Combined monthly volume", dept.toLocaleString() + " pages"] },
          { cells: ["Duty cycle per machine", perUnit.toLocaleString() + " pages a month"] },
          { cells: ["House rule", "run each machine at no more than 60% of its rated duty"] }
        ],
        note: "The 60% rule exists because a machine at its rated ceiling has nothing left for the month everybody prints the annual report."
      }],
      questions: [{
        key: "fl-count", kind: "number",
        prompt: "How many machines does the department need?",
        unit: "machines", answer: need, tolerance: 0,
        hints: [
          "Work out what one machine is allowed to do under the house rule before you divide anything.",
          "60% of the rated duty is the real per-machine figure. Divide the department's volume by that — and you cannot buy part of a printer, so round the way that keeps everybody printing."
        ],
        explain: "60% of " + perUnit.toLocaleString() + " = " + Math.round(perUnit * 0.6).toLocaleString() +
          " a machine. " + dept.toLocaleString() + " ÷ " + Math.round(perUnit * 0.6).toLocaleString() +
          " = " + (dept / (perUnit * 0.6)).toFixed(2) + ", rounded up to " + need + "."
      }]
    };
  }

  throw new Error("lab-printer: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js for why these
   live with the lab rather than in the verifier. */
export function selfCheck(sc) {
  const bad = [];
  const T = TYPES[sc.best];
  if (!T) return ["best type \"" + sc.best + "\" is not in the table"];
  /* The technology the brief points at must actually be able to do the
     job. A scenario that asks for carbon forms and answers "laser" is
     unanswerable, and would only appear on the seeds that made it. */
  if (sc.job.key === "forms" && !T.carbon) bad.push("carbon-form job answered with a technology that cannot strike paper");
  if (sc.job.key === "photo" && !T.photo) bad.push("photo job answered with a technology that cannot do photographic colour");
  if (sc.job.key === "till" && !T.receipt) bad.push("receipt job answered with a technology unsuited to a counter");
  if (sc.volume > T.duty) bad.push("volume " + sc.volume + " exceeds the chosen technology's duty of " + T.duty);
  /* The defect must come from a step that exists, and non-laser jobs
     must not be handed a drum-specific defect. */
  if (!STEPS.some(function (x) { return x.key === sc.brokenStep.key; })) bad.push("broken step is not in the process table");
  if (!sc.laserish && sc.brokenStep.key !== "processing")
    bad.push("non-laser job given the drum-specific defect \"" + sc.brokenStep.key + "\"");
  if (sc.tooSmall !== (sc.dutyRated < sc.volume)) bad.push("tooSmall flag disagrees with the numbers");
  if (sc.tonerYield <= 0 || sc.tonerCost <= 0) bad.push("consumable figures are not positive");
  return bad;
}

export function variantKey(sc) { return sc.best + "/" + sc.job.key; }
