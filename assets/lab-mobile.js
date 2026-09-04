/* =====================================================================
   Device & Mobile — phones and tablets, inside and out.

   SCOPE WAS SET DELIBERATELY. Phones and tablets are the core. Laptops
   appear ONLY for faults that are mobile-specific and that the Field
   Service Center does not already cover: swollen cells, digitizers,
   sync and enrolment. General laptop repair is the FSC's job and must
   not be duplicated here.

   THE MECHANISM IS THE DISPLAY STACK. "Digitizer or LCD" is the single
   most common mobile call and students guess at it, because from the
   outside a dead touch layer and a dead panel look identical. So the
   mechanism view takes the stack apart layer by layer — cover glass,
   digitizer, panel, backlight — and shows which symptom each layer
   produces when it fails. After that the test is obvious: does the
   screen still SHOW anything, and does it still FEEL anything.

   SAFETY IS GRADED. A swollen cell is the one fault here that can hurt
   somebody, and mishandling it ends the scenario rather than costing a
   mark.
   ===================================================================== */
import { rng } from "./rng.js";

/* ------------------------------------------------------------------
   The display stack, outside in. Each layer says what fails and what
   that looks like — the defect is generated FROM the layer, so a
   symptom can never name a layer this table does not blame.
   ------------------------------------------------------------------ */
export const STACK = [
  { key: "glass", at: 1, name: "Cover glass",
    does: "Takes the knocks. Purely protective — it carries no electronics at all.",
    fails: "Cracked or spidered, but the picture is perfect and touch works everywhere.",
    tell: "Damage you can see and feel, with nothing wrong underneath. On many devices this is a glass-only repair.",
    part: "cover glass" },
  { key: "digitizer", at: 2, name: "Digitizer",
    does: "The transparent touch grid. It senses your finger and reports where — it does not display anything.",
    fails: "The picture is perfect and bright, but part or all of the screen ignores touch.",
    tell: "Display fine, touch dead. That combination can only be the layer that senses, never the layer that shows.",
    part: "digitizer" },
  { key: "lcd", at: 3, name: "Display panel",
    does: "Makes the image. Nothing to do with touch.",
    fails: "Black patches, spreading ink blots, or lines across the picture — while touch still registers where you press.",
    tell: "Touch still works, so the sensing layer is alive. The image is what has gone.",
    part: "display panel" },
  { key: "backlight", at: 4, name: "Backlight",
    does: "Lights the panel from behind. Without it the image is still being drawn, just not lit.",
    fails: "The screen looks black — but under a bright torch at an angle you can see the picture faintly, and touch still works.",
    tell: "The torch test is the whole diagnosis. An image that is there but unlit is a backlight, not a panel.",
    part: "backlight or its driver" }
];

/* ------------------------------------------------------------------
   Faults. `where` says whether it is hardware, software or the user's
   configuration — the triage question every one of these starts with.
   ------------------------------------------------------------------ */
export const FAULTS = {
  digitizer: { name: "Touch does not respond in one area", where: "hardware", stack: "digitizer",
    said: "the top half of the screen has stopped responding but I can still see everything fine",
    fix: "Replace the digitizer. On a bonded assembly that means the whole screen unit." },
  lcd: { name: "Black patch spreading across the picture", where: "hardware", stack: "lcd",
    said: "there is a black blotch that started small and is getting bigger, but it still knows where I am tapping",
    fix: "Replace the display panel. The blotch is physical damage to the panel and it will keep spreading." },
  backlight: { name: "Screen appears dead but the device is running", where: "hardware", stack: "backlight",
    said: "the screen is black but it still rings and I can answer it by swiping where the button usually is",
    fix: "Backlight or its driver. Confirm with a torch before ordering a whole screen." },
  battery: { name: "Swollen battery", where: "hardware", stack: null,
    said: "the screen is lifting away from the case at one corner and it rocks when I put it on the desk",
    fix: "Stop. Isolate it, do not charge it, and dispose of it as hazardous waste." },
  charge: { name: "Charges only at a certain angle", where: "hardware", stack: null,
    said: "it only charges if I hold the cable just so, and it has got worse over a few weeks",
    fix: "Test with a known-good cable and charger first, then the port. Worn ports and frayed cables look identical from the outside." },
  drain: { name: "Battery flat by lunchtime", where: "software", stack: null,
    said: "it used to last all day and now it is dead by one o'clock, and it gets warm in my pocket",
    fix: "Battery usage by app first. A single app holding a wake lock is far more common than a worn cell." },
  sync: { name: "Company mail will not sync", where: "config", stack: null,
    said: "my personal mail works fine but the work account just spins and never gets anything",
    fix: "Server, port, SSL and authentication. One account working proves the network and the device are fine." },
  mdm: { name: "Cannot enrol in the company system", where: "config", stack: null,
    said: "IT sent me a link to get set up and it fails at the last step every time",
    fix: "Enrolment usually fails on an unmet prerequisite: OS version, passcode policy, or encryption not enabled." },
  signal: { name: "No mobile signal in one building", where: "hardware", stack: null,
    said: "it is fine outside and useless the moment I walk into the warehouse",
    fix: "Coverage, not fault. Wi-Fi calling or a femtocell — nothing is broken." }
};

const PEOPLE = [
  { who: "a district nurse",        device: "tablet" },
  { who: "a site foreman",          device: "phone" },
  { who: "a delivery driver",       device: "phone" },
  { who: "a school office manager", device: "tablet" },
  { who: "a sales rep",             device: "phone" }
];

/* Laptops appear ONLY for these two, which are mobile faults the Field
   Service Center does not cover. */
const LAPTOP_OK = ["battery", "sync", "mdm"];

const NOISE = [
  "I dropped it about a month ago but it seemed fine.",
  "My daughter has the same one and hers is OK.",
  "It is out of warranty, I checked.",
  "I have already tried turning it off and on again.",
  "Somebody said I should just factory reset it."
];

export function generate(seed) {
  const r = rng(seed);
  const faultKey = r.pick(Object.keys(FAULTS));
  const fault = FAULTS[faultKey];
  let person = r.pick(PEOPLE);
  /* A laptop only turns up when the fault is one of the three that
     genuinely belong here. Otherwise it is a phone or a tablet. */
  if (r.next() < 0.25 && LAPTOP_OK.indexOf(faultKey) >= 0) {
    person = { who: person.who, device: "laptop" };
  }

  const said = r.shuffle([fault.said].concat(r.some(NOISE, 2)));

  /* Battery health figures for the drain calculation. */
  const designMah = r.pick([3000, 4000, 4500, 5000]);
  const cycles = r.int(180, 950);
  /* Real cells lose roughly 20% over 500 cycles. */
  const healthPct = Math.max(55, Math.round(100 - (cycles / 500) * 20));
  const currentMah = Math.round(designMah * healthPct / 100);
  const worn = healthPct < 80;

  return {
    seed: seed, person: person, faultKey: faultKey, fault: fault,
    said: said, designMah: designMah, cycles: cycles,
    healthPct: healthPct, currentMah: currentMah, worn: worn,
    isSwollen: faultKey === "battery",
    stackLayer: fault.stack
  };
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */
function briefPanel(s) {
  return {
    kind: "brief",
    from: s.person.who + " — " + s.person.device,
    paragraphs: ["They have brought it in and this is what they told you."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

/* The display stack, layer by layer. */
function stackFrames() {
  const cols = [{ name: "Layer", sub: "outside in" }, { name: "Shows?", sub: "image" },
                { name: "Feels?", sub: "touch" }, { name: "When it fails", sub: "symptom" }];
  return STACK.map(function (L, i) {
    return {
      columns: cols,
      caption: L.name + " — " + L.does + "  ·  " + L.fails,
      rows: [[
        { label: L.name, tone: "parity" },
        { label: L.key === "lcd" || L.key === "backlight" ? "yes" : "no",
          tone: L.key === "lcd" || L.key === "backlight" ? "data" : null },
        { label: L.key === "digitizer" ? "yes" : "no",
          tone: L.key === "digitizer" ? "data" : null },
        { label: L.key === "glass" ? "cracked, all works" :
                 L.key === "digitizer" ? "shows, no touch" :
                 L.key === "lcd" ? "touch, no image" : "dark, image is there",
          tone: "dead" }
      ]]
    };
  });
}

export function buildStage(key, s) {
  const f = s.fault;

  if (key === "brief") {
    return {
      title: "What did they actually tell you?",
      intro: "Users describe what they noticed, not what is wrong. The useful detail is usually one clause inside a sentence about something else.",
      panels: [briefPanel(s)],
      questions: [{
        key: "mb-brief", kind: "multi",
        prompt: "Which parts of that are diagnostic?",
        detail: "One or two of these narrow the fault. The rest is history and hearsay.",
        hints: [
          "A diagnostic detail is one that RULES SOMETHING OUT. Read each quote and ask what it makes impossible.",
          "Look for anything that says one part of the device still works. Something that still works is the strongest evidence there is."
        ],
        options: [
          { key: "sym", label: "The specific thing it does or does not do", correct: true,
            why: "Yes — this is the fault. Everything else is context around it." },
          { key: "still", label: "What still works despite the fault", correct: true,
            why: "Yes, and it is the most useful sentence they said. A working layer eliminates every fault that would have killed it." },
          { key: "drop", label: "That it was dropped a month ago", correct: false,
            why: "Tempting, but a month of normal use since then makes it weak evidence — and it can send you looking for impact damage that is not the cause." },
          { key: "warranty", label: "That it is out of warranty", correct: false,
            why: "That decides who pays, not what is wrong." },
          { key: "reset", label: "That somebody suggested a factory reset", correct: false,
            why: "Advice from a friend. Acting on it would destroy their data before you know whether it is even a software fault." }
        ],
        explain: "The symptom, and what still works. Those two together eliminate more than any test you can run."
      }]
    };
  }

  if (key === "triage") {
    return {
      title: "Hardware, software, or how it is set up?",
      intro: "Getting this wrong costs hours. Ordering a screen for a settings problem is the classic version.",
      panels: [briefPanel(s), {
        kind: "note", title: "Two things you already know",
        paragraphs: [
          s.faultKey === "sync" ? "Their personal mail account on the same device works perfectly."
            : s.faultKey === "mdm" ? "Other people enrolled on the same system this morning without trouble."
            : s.faultKey === "drain" ? "It happens on Wi-Fi and on mobile data, and a restart makes no difference."
            : "The device otherwise behaves completely normally.",
          "Nothing has been opened yet."
        ]
      }],
      questions: [{
        key: "mb-where", kind: "choice",
        prompt: "Where does this fault live?",
        hints: [
          "Ask what would have to be true for each answer. If one account works and another does not, what does that prove about the hardware and the network?",
          "Hardware faults do not care about settings and do not come and go with apps. Configuration faults affect one account, one app or one service and leave everything else alone."
        ],
        options: [
          { key: "hardware", label: "Hardware — something physical has failed", correct: f.where === "hardware",
            why: f.where === "hardware"
              ? "Right. The symptom is physical and no amount of settings work will touch it."
              : "No — the device's hardware is demonstrably fine, because other things using the same hardware work." },
          { key: "software", label: "Software — an app or the OS is misbehaving", correct: f.where === "software",
            why: f.where === "software"
              ? "Right. It is behavioural rather than physical, and it follows what the device is running."
              : "A software fault would not produce this. It is either physical or a setting." },
          { key: "config", label: "Configuration — a setting or account is wrong", correct: f.where === "config",
            why: f.where === "config"
              ? "Right. One account or service fails while everything around it works, which is the signature of a setting."
              : "Nothing here points at a setting — the fault does not care how the device is configured." },
          { key: "network", label: "The network is at fault", correct: false,
            why: "The network serves this device fine for other things. Blaming it does not survive the first check." }
        ],
        explain: "Triage before tools. " + f.fix
      }]
    };
  }

  if (key === "digitizer") {
    const layer = s.stackLayer ? STACK.filter(function (L) { return L.key === s.stackLayer; })[0] : null;
    /* When the generated fault is not a display fault, the stage still
       teaches the stack — using a worked example rather than pretending
       this device has a screen fault it does not have. */
    const useCase = layer || STACK[1];
    const others = STACK.filter(function (L) { return L.key !== useCase.key; });
    return {
      title: "Digitizer or panel?",
      intro: layer
        ? "This one is a display fault. Take the stack apart before you order anything."
        : "This device does not have a screen fault — but this is the call you will get most often, so work it through on a worked example.",
      panels: [{ kind: "mech", title: "The display stack, outside in", frames: stackFrames() },
               { kind: "note", title: layer ? "What this device is doing" : "The example",
                 paragraphs: [useCase.fails] }],
      questions: [{
        key: "mb-layer", kind: "choice",
        prompt: "Which layer has failed?",
        hints: [
          "Step through the stack view. Two of the four layers show an image and one of them senses touch — work out which of those two abilities this device has lost.",
          "The question to ask is never \"is the screen broken\". It is: does it still SHOW, and does it still FEEL? Each answer eliminates half the stack."
        ],
        options: rng(s.seed + 21).shuffle(
          [{ key: useCase.key, label: useCase.name, correct: true, why: useCase.tell }].concat(
            others.map(function (L) {
              return { key: L.key, label: L.name, correct: false,
                why: "A failed " + L.name.toLowerCase() + " gives you: " +
                  L.fails.charAt(0).toLowerCase() + L.fails.slice(1) };
            }))),
        explain: useCase.tell + " Order the " + useCase.part + "."
      }]
    };
  }

  if (key === "safety") {
    return {
      title: "The one that can hurt somebody",
      intro: s.isSwollen
        ? "This device has a swollen cell. What you do in the next minute matters more than anything else in this lab."
        : "This device's battery is fine — but you will meet a swollen one, and there is no room to work it out on the day.",
      panels: [{
        kind: "note", title: "What a swelling cell is doing",
        paragraphs: [
          "A lithium cell swells because it is generating gas internally. That gas is the cell breaking down, and the process does not reverse.",
          "A punctured or crushed swollen cell can go into thermal runaway — a fire that supplies its own oxygen, cannot be smothered, and will not go out until the cell is spent."
        ]
      }],
      questions: [{
        key: "mb-safety", kind: "order",
        prompt: "Put the handling steps in order.",
        detail: "Getting this order wrong is the difference between a safe job and a fire.",
        hints: [
          "Two of these make the situation WORSE if they happen early, and one of them is what most people reach for first.",
          "Think about what adds energy to a cell that is already breaking down, and what puts pressure on it. Both of those come after it is isolated, or not at all."
        ],
        steps: [
          { key: "stop",   at: 1, label: "Stop using it and take it off charge" },
          { key: "power",  at: 2, label: "Power it down if it is still on" },
          { key: "isolate",at: 3, label: "Move it somewhere non-flammable, away from other stock" },
          { key: "nopress",at: 4, label: "Handle it flat, without pressing, bending or prising" },
          { key: "waste",  at: 5, label: "Dispose of it as hazardous waste, not in the bin" }
        ],
        explain: "Off charge first — charging a swelling cell adds energy to a failing one. Never press it flat to close the case, " +
          "never puncture it, and never put it in general waste."
      }]
    };
  }

  if (key === "health") {
    return {
      title: "Is the battery worn, or is something eating it?",
      intro: "Users say the battery is dead. Half the time it is, and half the time an app is holding the device awake.",
      panels: [{
        kind: "table", title: "What the battery report says",
        columns: ["", ""],
        rows: [
          { cells: ["Design capacity", s.designMah + " mAh"] },
          { cells: ["Current full-charge capacity", s.currentMah + " mAh"] },
          { cells: ["Charge cycles", String(s.cycles)] }
        ],
        note: "A cell is generally considered worn out below 80% of its design capacity. Cells lose roughly 20% over their first 500 cycles."
      }],
      questions: [
        { key: "mb-health", kind: "number",
          prompt: "What percentage of its design capacity is left?",
          unit: "%", answer: s.healthPct, tolerance: 1.5,
          hints: ["Both capacities are in the table. One divided by the other.",
                  "Current divided by design, times a hundred. The cycle count is context, not part of this sum."],
          explain: s.currentMah + " ÷ " + s.designMah + " × 100 = " + s.healthPct + "%." },
        { key: "mb-verdict", kind: "choice",
          prompt: "So what do you tell them?",
          hints: [
            "Compare the figure you just worked out against the threshold in the note under the table.",
            "If the cell is healthy, the battery is not the fault — and telling somebody to replace a good battery costs them money and does not fix anything."
          ],
          options: [
            { key: "worn", label: "The cell is worn out and should be replaced", correct: s.worn,
              why: s.worn ? "Right — " + s.healthPct + "% against an 80% threshold, over " + s.cycles + " cycles. That is a cell at the end of its life."
                : "It is at " + s.healthPct + "%, which is above the 80% threshold. Replacing it would cost them money and change nothing." },
            { key: "app", label: "The cell is healthy, so look for what is draining it", correct: !s.worn,
              why: !s.worn ? "Right — " + s.healthPct + "% is a healthy cell. Go to battery usage by app and find what is holding it awake."
                : "It is at " + s.healthPct + "%, below the 80% threshold. This cell genuinely is worn." },
            { key: "reset", label: "Factory reset it and see", correct: false,
              why: "Destroying their data to test a theory you have not formed yet. The report in front of you answers the question." },
            { key: "charger", label: "It needs a more powerful charger", correct: false,
              why: "A bigger charger fills it faster. It does nothing about how long it lasts." }
          ],
          explain: s.worn ? "Worn cell. Replace it." : "Healthy cell — the drain is behavioural, so find the app." }
      ]
    };
  }

  if (key === "power") {
    /* Distinct from the `health` stage on purpose. `health` answers "is
       the cell worn"; this one answers "then what is eating it". Both
       are real calls and the second is the one people get wrong,
       because the report names the app and they blame the battery. */
    const r2 = rng(s.seed + 31);
    const hog = r2.pick([
      { app: "a fitness tracker app", pct: r2.int(38, 61),
        why: "It is holding a wake lock to log steps, so the device never actually sleeps." },
      { app: "a social app", pct: r2.int(34, 55),
        why: "Background refresh plus location every few minutes. Both are settings, not faults." },
      { app: "the company mail client", pct: r2.int(30, 48),
        why: "Push set to poll every five minutes rather than using real push, which wakes the radio constantly." },
      { app: "a weather widget", pct: r2.int(28, 44),
        why: "Continuous location rather than significant-change. It is a one-switch fix." }
    ]);
    const screenPct = r2.int(12, 22);
    const rest = 100 - hog.pct - screenPct;
    return {
      title: "So what is eating it?",
      intro: "The cell is fine. Something is keeping the device awake, and the report will name it if you read it properly.",
      panels: [{
        kind: "table", title: "Battery usage since last full charge",
        columns: ["What", "Share of the battery"],
        rows: [
          { cells: [hog.app, hog.pct + "%"], flag: "bad" },
          { cells: ["Screen", screenPct + "%"] },
          { cells: ["Everything else combined", rest + "%"] }
        ],
        note: "Screen time is usually the largest single item on a healthy device. Anything beating it is worth a look."
      }],
      questions: [
        { key: "mb-share", kind: "number",
          prompt: "How many times more battery is the top item using than the screen?",
          unit: "×", answer: Math.round((hog.pct / screenPct) * 10) / 10, tolerance: 0.3,
          hints: ["Both percentages are in the table. One divided by the other.",
                  "You are comparing the top item against the screen row, not against everything else added together."],
          explain: hog.pct + "% ÷ " + screenPct + "% = " + (hog.pct / screenPct).toFixed(1) +
            "×. On a device being used normally, nothing should beat the screen by that margin." },
        { key: "mb-act", kind: "choice",
          prompt: "What do you do about it?",
          hints: [
            "The report has already told you which app. The question is what to change about it, and whether that is your decision to make.",
            "Consider what the user actually wants from that app. Removing it and disabling everything are both fixes; only one of them leaves them with a working phone."
          ],
          options: [
            { key: "settings", label: "Turn off its background refresh and location, and check whether the drain stops",
              correct: true,
              why: "Right. " + hog.why + " Change the setting, then confirm the drain actually stopped — otherwise you have guessed rather than fixed." },
            { key: "delete", label: "Delete the app", correct: false,
              why: "It probably fixes the drain and it is not your call. The user installed it because they want it; change the behaviour first." },
            { key: "battery", label: "Replace the battery", correct: false,
              why: "You have just established the cell is healthy. Replacing it would cost money and change nothing." },
            { key: "reset", label: "Factory reset the device", correct: false,
              why: "You know which app it is. Destroying everything to remove one setting is not a repair." }
          ],
          explain: hog.why + " Confirm the fix held before handing it back — a drain that is 'probably fixed' comes straight back." }
      ]
    };
  }

  if (key === "charge") {
    return {
      title: "Charging port, cable, or charger?",
      intro: "Three things in a chain and any of them can be the fault. Swapping parts blindly is how you replace a port that was fine.",
      panels: [{
        kind: "note", title: "What you have on the bench",
        paragraphs: ["A known-good cable, a known-good charger, and another device of the same type that charges normally."]
      }],
      questions: [{
        key: "mb-charge", kind: "order",
        prompt: "Put the tests in the order that isolates the fault fastest.",
        hints: [
          "Each test should rule out exactly one thing. Start with whichever is quickest to swap and most likely to be at fault.",
          "Cables fail most often, then chargers, then ports — and a port is the only one of the three that needs the device opening. Test in that order and you often never get there."
        ],
        steps: [
          { key: "cable",  at: 1, label: "Try the known-good cable with their charger" },
          { key: "psu",    at: 2, label: "Try the known-good charger with the known-good cable" },
          { key: "other",  at: 3, label: "Charge the known-good device from their cable and charger" },
          { key: "look",   at: 4, label: "Look into the port with a light for lint or damage" },
          { key: "port",   at: 5, label: "Only then conclude the port needs replacing" }
        ],
        explain: "Cheapest and most likely first. A pocketful of lint packed into a port looks exactly like a failed port and costs nothing to fix — " +
          "which is why looking comes before concluding."
      }]
    };
  }

  if (key === "sync") {
    return {
      title: "Set up the company account",
      intro: "They have the instructions IT sent. Somewhere in them is everything you need and a lot you do not.",
      panels: [{
        kind: "brief", from: "The email from IT",
        paragraphs: [
          "“Please set up your device using the details below. If you have any trouble the helpdesk is on extension 2200, they are open until five.”",
          "“Server is mail.example-corp.co.uk and you will need SSL turned on. The username is your full email address, not just your name — this catches people out.”",
          "“Incoming is on 993 and outgoing on 587. Do not use the old settings from the intranet page, that page is out of date and we cannot get it taken down.”",
          "“Your device needs a passcode set before enrolment will complete. Company policy, nothing we can do about it.”"
        ]
      }],
      questions: [{
        key: "mb-sync", kind: "multi",
        prompt: "Which of these do you actually need to complete the setup?",
        detail: "Four of these are settings. The rest is around them.",
        hints: [
          "Go through the email and pull out anything you would TYPE INTO A BOX or switch on. Everything else is context.",
          "One of the sentences is not a setting at all but will stop the setup dead if you ignore it — read the last paragraph again."
        ],
        options: [
          { key: "server", label: "The server name", correct: true, why: "Yes. Without it there is nothing to connect to." },
          { key: "ssl", label: "SSL turned on", correct: true, why: "Yes — and on port 993 it is not optional; the server will refuse a plain connection." },
          { key: "user", label: "Full email address as the username", correct: true,
            why: "Yes, and they flagged it because it is the single most common reason this fails." },
          { key: "pass", label: "A passcode set on the device", correct: true,
            why: "Yes. Not a mail setting, but enrolment will not complete without it — this is the one people skip." },
          { key: "ext", label: "The helpdesk extension", correct: false,
            why: "Useful if you get stuck. Not something you type into the setup." },
          { key: "intranet", label: "The settings from the intranet page", correct: false,
            why: "They explicitly told you that page is out of date. Using it is how you end up debugging the wrong values." }
        ],
        explain: "Server, SSL, username format, and the passcode prerequisite. The rest of that email is noise — which is exactly how real instructions arrive."
      }]
    };
  }

  if (key === "radio") {
    return {
      title: "Which radio is it?",
      intro: "A phone has four or five radios in it and users call all of them 'the signal'.",
      panels: [{
        kind: "table", title: "What works and what does not",
        columns: ["Function", "State"],
        rows: [
          { cells: ["Wi-Fi", "Connects and works normally"] },
          { cells: ["Mobile data and calls", "Nothing at all inside the building"], flag: "bad" },
          { cells: ["Bluetooth headset", "Pairs and works"] },
          { cells: ["Maps / location", "Accurate outdoors, poor indoors"] }
        ],
        note: "All of these are separate radios in separate bands, sharing very little beyond the antenna assembly."
      }],
      questions: [{
        key: "mb-radio", kind: "choice",
        prompt: "What does this pattern actually tell you?",
        hints: [
          "Three of the four functions work. Ask what the failing one has that the working ones do not.",
          "A hardware fault in a shared component would take more than one of these down. Consider whether anything here is broken at all."
        ],
        options: [
          { key: "coverage", label: "Nothing is faulty — it is a mobile coverage problem inside that building",
            correct: true,
            why: "Right. Three radios work, so the device is fine. Cellular is the only one that depends on a signal from outside the building, and location indoors is weak for the same reason." },
          { key: "antenna", label: "The antenna assembly has failed", correct: false,
            why: "Then Wi-Fi and Bluetooth would suffer too. They are fine, so the shared parts are fine." },
          { key: "sim", label: "The SIM has failed", correct: false,
            why: "Possible in general — but a dead SIM does not work outside the building either, and this one does." },
          { key: "os", label: "The OS needs updating", correct: false,
            why: "Nothing here points at software. The behaviour changes with where the person is standing, not with what the device is running." }
        ],
        explain: "Not every call is a fault. Wi-Fi calling or a femtocell fixes this; a replacement handset does not."
      }]
    };
  }

  throw new Error("lab-mobile: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js. */
export function selfCheck(sc) {
  const bad = [];
  if (!FAULTS[sc.faultKey]) return ["fault \"" + sc.faultKey + "\" is not in the table"];
  if (["hardware", "software", "config"].indexOf(sc.fault.where) < 0)
    bad.push("fault is filed under an unknown category \"" + sc.fault.where + "\"");
  /* SCOPE. Laptops are allowed ONLY for the mobile-specific faults the
     Field Service Center does not cover. A laptop with a cracked
     digitizer here would be duplicating the FSC's laptop track, which
     is the one thing this lab was told not to do. */
  if (sc.person.device === "laptop" && LAPTOP_OK.indexOf(sc.faultKey) < 0)
    bad.push("laptop generated for \"" + sc.faultKey + "\", which belongs to the Field Service Center");
  if (sc.stackLayer && !STACK.some(function (L) { return L.key === sc.stackLayer; }))
    bad.push("stack layer \"" + sc.stackLayer + "\" is not in the stack");
  /* Battery arithmetic has to agree with itself, or the health stage
     grades a correct answer wrong. */
  if (sc.healthPct !== Math.round(sc.currentMah / sc.designMah * 100))
    bad.push("health percentage disagrees with the capacities");
  if (sc.worn !== (sc.healthPct < 80)) bad.push("worn flag disagrees with the health percentage");
  if (sc.currentMah > sc.designMah) bad.push("current capacity exceeds design capacity");
  return bad;
}

export function variantKey(sc) { return sc.faultKey + "/" + sc.person.device + "/" + (sc.worn ? "worn" : "ok"); }
