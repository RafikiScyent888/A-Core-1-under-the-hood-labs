/* =====================================================================
   A+ Core1 Under the Hood Labs — Display

   Three objectives that had nothing: 3.1 display components and
   attributes, 1.2 mobile accessories and connectivity, 5.3 video,
   projector and display issues.

   WHY THESE THREE TOGETHER

   From a student's side of the desk they are one job. "There is no
   picture" is answered by knowing what a display is made of AND what can
   carry a picture into it, and splitting them across two labs would
   teach them as two unrelated facts that happen to share a symptom.

   THE TORCH TEST IS THE SPINE

   The single most valuable thing a technician knows about a dark screen:
   shine a light at it. If a faint image is there, the panel is fine and
   the backlight is dead. Different part, different price, and identical
   from the front — which is why students order the wrong one.

   Everything in this lab is arranged so that test is the hinge. The
   stack is drawn with the backlight as its own layer so the distinction
   is seen once rather than read three times.
   ===================================================================== */

import { rng } from "./rng.js";
import { displayBench, deviceBench, layerWords, LAYERS, PORTS } from "./bench-display.js";
import { videoBench } from "./bench-video.js";
import { screenBench } from "./bench-screen.js";
import { VIDEO_CASES, VIDEO_OPTS } from "./conn-cases.js";
import { PANEL_CASES, PANEL_OPTS, PROJ_CASES, PROJ_OPTS } from "./screen-cases.js";
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


/* ---------------------------------------------------------------------
   3.1 — panel technologies, and the trade a buyer is actually making
   --------------------------------------------------------------------- */
export const PANELS = [
  { key: "tn",   name: "TN",       colour: "poor",      angles: "poor",
    response: 1,  contrast: "low",
    best: "twitch gaming on a budget",
    note: "Fastest and cheapest. The colour shifts if you move your head, which is fine for one " +
      "player and useless for two people looking at the same screen" },
  { key: "ips",  name: "IPS",      colour: "excellent", angles: "excellent",
    response: 4,  contrast: "medium",
    best: "anything where colour has to be right, or two people share the screen",
    note: "The default answer for design, medical and anywhere the picture is looked at from " +
      "the side" },
  { key: "va",   name: "VA",       colour: "good",      angles: "good",
    response: 5,  contrast: "high",
    best: "dark rooms and film, where black needs to be black",
    note: "The deepest blacks of the three, and the slowest to change a pixel" },
  { key: "oled", name: "OLED",     colour: "excellent", angles: "excellent",
    response: 0.1, contrast: "perfect",
    best: "anything, until you leave a static image on it",
    note: "Each pixel makes its own light, so black is genuinely off. It is also the only one " +
      "here that can burn in" }
];

/* 5.3 — the faults. Each names the layer it lives at, so the bench and
   the marking cannot drift apart. */
export const FAULTS = [
  { key: "backlight", layer: "backlight", name: "Backlight has failed",
    said: "the screen is black but I can hear it start up",
    tell: "Held at an angle under a bright torch, a faint image is there",
    why: "The panel is still forming the image; there is simply no light behind it. That torch " +
      "test is the whole diagnosis and it takes four seconds.",
    /* Black from the front, and the only fault on this bench where a torch
       finds a picture still being drawn. That ghost is the diagnosis, so it
       appears when the student runs the test, not before. */
    art: null, dark: true, ghost: true, part: "the backlight assembly" },
  { key: "psu", layer: "psu", name: "Power board has failed",
    said: "it does nothing at all, no light, no noise",
    tell: "No standby lamp, and nothing on any input",
    why: "Dead means dead. Before condemning the monitor, prove the socket and the lead — but a " +
      "board with bulged capacitors on it is the usual answer.",
    art: null, dark: true, ghost: false, part: "the power board" },
  { key: "driver", layer: "driver", name: "Driver board has failed",
    said: "there are stripes down the screen and they never move",
    tell: "Vertical bands in the same place on every input, including the menu",
    why: "If the monitor's OWN menu is corrupted, nothing outside the monitor can be blamed. " +
      "That single check rules out the cable, the port and the computer at once.",
    art: "lines", dark: false, ghost: false, part: "the driver board" },
  { key: "panel", layer: "panel", name: "The panel itself is damaged",
    said: "there is a little cluster of black dots that will not go away",
    tell: "Dead pixels, in the same place on every input and in the menu",
    why: "Pixels do not come back. The panel is most of the cost of the monitor, which is why " +
      "this is usually a replacement rather than a repair.",
    art: "dead", dark: false, ghost: false, part: "the panel" },
  { key: "burn", layer: "panel", name: "Burn-in",
    said: "I can see a ghost of the old till screen behind everything",
    tell: "A faint permanent image of something that was on screen for months",
    why: "Static content left on an emissive panel ages those pixels faster than the rest. It is " +
      "wear, not a fault, and it cannot be undone.",
    art: "burn", dark: false, ghost: false, part: "the panel" },
  { key: "cable", layer: null, name: "Nothing wrong with the monitor",
    said: "no signal, but it was fine on Friday",
    tell: "The monitor's own menu appears normally; only the input is dead",
    why: "A monitor that can draw its own menu is working. The fault is upstream — the lead, the " +
      "port, the input selection or the machine.",
    art: null, dark: true, ghost: false, part: "nothing — it is the cable, the port or the source" }
];

/* 1.2 — what a laptop actually has, and what the customer wants to plug
   into it. The gap between those two is the lesson. */
const LAPTOPS = [
  { name: "a thin ultrabook", has: ["usbc", "usbc"], altmode: true,
    said: "there are only two little oval ports on it" },
  { name: "a thin ultrabook with no alt mode", has: ["usbc", "usbc"], altmode: false,
    said: "I bought an adapter and it charges but there is still no picture" },
  { name: "a business laptop", has: ["hdmi", "usbc"], altmode: true,
    said: "there is a flat one and an oval one" },
  { name: "an older workhorse", has: ["vga", "hdmi"], altmode: false,
    said: "there is a blue one with screws and a flat one" }
];

const MONITORS = [
  { name: "a new 27-inch", has: ["hdmi", "dp", "usbc"] },
  { name: "a five-year-old 24-inch", has: ["vga", "dvi", "hdmi"] },
  { name: "a projector in the meeting room", has: ["vga", "hdmi"] }
];

const CUSTOMERS = [
  "the practice manager", "a partner", "the receptionist",
  "the site foreman", "a nurse", "the studio lead"
];


/* =====================================================================
   diagnose — the Core 1 Device Issue Diagnosis Lab, on the device.

   Source: `Core-1-Sims/Device Issue Diagnosis.html`. Ten devices, and
   for each one a pair of drop-downs: what the Issue is, and what the
   Solution is. Both have to be right to score.

   SIX OF THE TEN ARE SCREENS. The sim is filed with the workstation
   material, and it is not workstation material — four monitors, a
   projector, a display behind glass, and two phone batteries that go to
   the mobile lab. Putting it where its content lives is not tidying: a
   student meeting keystoning inside a motherboard lab has been told
   something untrue about where that knowledge belongs.

   THREE THINGS CHANGE ON THE WAY IN.

     - THE SYMPTOM IS DRAWN. The original describes a picture in a
       paragraph, which is the one job a picture does better. A ghost of
       a toolbar, a greyscale that has collapsed to black and white, a
       trapezoid on a wall — these are things to LOOK at, and the
       device on the bench shows them.
     - SIX OPTIONS ON BOTH HALVES. The original offers nine issues and
       eight solutions, shared across all ten devices, which makes most
       of them obviously irrelevant to any given one. Six here, chosen
       per scenario, every wrong one a real diagnosis of these symptoms.
     - TWO ANSWERS IN THE ORIGINAL ARE WRONG, AND ARE FIXED HERE.
       Device 8's contrast fault is answered "Adjust the refresh rate
       settings", and its own explanation admits the substitution
       ("represented here by adjusting refresh/display settings").
       Refresh rate has nothing to do with contrast, so the fix here is
       the picture controls — and refresh rate stays on the list as a
       distractor, which is honest because there is now a scenario where
       refresh rate IS the answer. Device 3's answer is "Disable
       overclocking in the CPU" for a laptop whose brief never mentions
       overclocking; that one is a workstation fault and it went to the
       build lab's `symptom` stage, where the brief states the tell.

   Ten scenarios: the owner's five screens plus the standing five more.
   ===================================================================== */

/* What is wrong. Every one is a real diagnosis somebody makes of these
   symptoms; `is` says what that fault actually looks like, which is what
   a wrong pick is answered with. */
const DX_ISSUES = {
  burn:      { label: "Burn-in — permanent image retention",
               is: "A ghost of whatever sat in one place for months, still faintly there with nothing drawing it. It does not move, it does not change, and no setting removes it." },
  input:     { label: "The display is listening to the wrong input",
               is: "The display works, says so, and is watching a socket with nothing plugged into it. The giveaway is that another source works once the input is changed." },
  keystone:  { label: "Keystoning — the projector is not square to the screen",
               is: "A rectangle thrown from off-centre arrives as a trapezoid. It is a geometry problem and it is fixed by moving the projector or correcting for it, never by focusing." },
  contrast:  { label: "The picture controls are set wrongly",
               is: "Shadows go flat black and highlights go flat white, and the steps in between disappear. The panel is fine; what it is being told to draw is not." },
  dirty:     { label: "The glass or lens surface is dirty",
               is: "A haze over everything that shifts as you move your head, because it is in front of the picture rather than in it." },
  lamp:      { label: "The projector lamp is at the end of its hours",
               is: "The middle stays usable and the edges fall away, with the colour shifting as they go. It happens over months, not overnight." },
  column:    { label: "A failed column in the panel itself",
               is: "One line, the full height, in the same place every time — and still there with no computer connected at all." },
  refresh:   { label: "The refresh rate does not match what the panel supports",
               is: "The picture tears across when things move, because a new frame arrives part way through the old one being drawn. Still images look perfect." },
  backlight: { label: "The backlight or its driver is failing",
               is: "The picture is being made correctly and lit unevenly — bands, flicker, or a dimming that follows the brightness control." },
  aspect:    { label: "The source is sending a resolution the panel does not have",
               is: "Everything is stretched or squashed by the same amount. Circles become ovals and the picture is otherwise perfect." },
  cable:     { label: "A damaged or loose video cable",
               is: "Sparkle, dropouts, or nothing at all — and it follows the cable when you swap it onto another machine." },
  source:    { label: "The computer is not putting out a picture",
               is: "The fault is upstream of the display entirely, and it shows because a different source on the same lead works." },
  filter:    { label: "A blocked air filter is overheating the projector",
               is: "It dims over months AND shuts itself down after twenty minutes or so. The shutdown is what separates this from an aged lamp." },
  focus:     { label: "The projector is out of focus",
               is: "Soft everywhere, and the shape of the image is unchanged. Focus moves sharpness; it cannot move geometry." }
};

/* What to do. `does` says what the action actually achieves, which is
   what makes every wrong one answerable rather than merely wrong. */
const DX_FIXES = {
  replacepanel: { label: "Replace the panel or the display",
                  does: "The only thing that helps when the damage is in the panel and is permanent. It is also the most expensive answer on any list, so it has to be earned." },
  switchinput:  { label: "Switch the display to the input the source is plugged into",
                  does: "Points the display at the socket the picture is actually arriving on. Ten seconds, no parts." },
  angle:        { label: "Square the projector to the screen, then correct any keystone left",
                  does: "Fixes the geometry at its cause — where the projector is sitting — rather than asking the electronics to distort the picture to compensate." },
  picture:      { label: "Reset the picture controls and set contrast to a sensible level",
                  does: "Puts back the steps between black and white that an extreme setting has crushed out." },
  clean:        { label: "Clean the glass or the lens surface",
                  does: "Removes what is sitting in front of the picture. It does nothing at all to anything happening behind the glass." },
  lampswap:     { label: "Replace the projector lamp",
                  does: "Restores brightness and colour across the whole image. It is a consumable with a rated life, not a repair." },
  setrefresh:   { label: "Set the refresh rate the panel actually supports",
                  does: "Makes the source hand over frames in step with the panel, which is what stops a frame arriving mid-draw." },
  driver:       { label: "Replace the backlight driver board",
                  does: "Replaces what feeds the lamps rather than what makes the picture. It is the cheaper half of a display that looks dead." },
  native:       { label: "Set the source to the panel's native resolution",
                  does: "Stops the panel being asked to stretch a picture that is the wrong shape for it." },
  reseat:       { label: "Reseat the video cable, then swap it for a known-good one",
                  does: "The right first move on anything intermittent, and it proves or clears the lead in a minute. It cannot explain a fault that is present with no cable connected." },
  filterclean:  { label: "Clean the air filter and let it cool",
                  does: "Restores airflow. It is the answer when heat is what is killing the picture, and heat announces itself with a shutdown." },
  focusring:    { label: "Adjust the focus ring",
                  does: "Changes how sharp the image is. It cannot change what shape the image is." },
  brightness:   { label: "Turn the brightness control up",
                  does: "Drives the backlight harder. It masks a dim picture for a while and fixes nothing that is actually failing." },
  updatedriver: { label: "Update the graphics driver on the source",
                  does: "Worth doing when the source is misbehaving. It has nothing to say about a fault that is visible with no source connected." }
};

/* The ten devices. `said` is the user's own words with the deciding
   detail buried inside it, which is the reading-the-scenario gap on
   purpose. `art` is what the bench draws. */
const DX_DEVICES = [
  /* --- the owner's five screens --- */
  { key: "d-burn", who: "Help Desk laptop", kind: "monitor", art: "burn",
    said: ["“Even after I close everything or switch to another application, I can still see " +
      "faint outlines of the toolbars and the text.”",
      "“It is worst along the top and down the sides — the parts of the screen that never " +
      "change. It has been getting slowly worse for about a year.”"],
    issue: "burn", fix: "replacepanel",
    wrongIssues: ["dirty", "backlight", "contrast", "column", "cable"],
    wrongFixes: ["clean", "picture", "setrefresh", "driver", "reseat"],
    tell: "Faint outlines of things that are no longer being drawn, in exactly the places that " +
      "never changed, appearing over a year. That is the panel itself keeping the picture." },

  { key: "d-input", who: "Training room monitor", kind: "monitor", art: "nosignal", dark: true,
    said: ["“It comes on, shows its own logo, and then says No Signal.”",
      "“The desktop PC is switched on and the cable is one we know is good.”",
      "“When we plugged a laptop into that same socket it worked — but only after we " +
      "changed the monitor over to a different input.”"],
    issue: "input", fix: "switchinput",
    wrongIssues: ["cable", "source", "backlight", "column", "aspect"],
    wrongFixes: ["reseat", "updatedriver", "driver", "replacepanel", "native"],
    tell: "The last sentence is the whole answer. A laptop on the same socket works once the input " +
      "is changed, so the socket, the lead and the monitor are all fine — it is watching a " +
      "different one." },

  { key: "d-keystone", who: "Conference Room A projector", kind: "projector", art: "keystone",
    said: ["“The picture is a trapezoid — much wider along the top than along the bottom.”",
      "“The screen itself is flat and square to the room.”",
      "“It is sitting on a trolley, quite a bit below the middle of the screen.”"],
    issue: "keystone", fix: "angle",
    wrongIssues: ["focus", "lamp", "aspect", "filter", "dirty"],
    wrongFixes: ["focusring", "native", "lampswap", "clean", "filterclean"],
    tell: "The screen is square and the projector is below the middle of it. Throwing a rectangle " +
      "upwards at a flat screen puts the top of the image further away than the bottom, and " +
      "further away is bigger." },

  { key: "d-contrast", who: "Design team monitor", kind: "monitor", art: "wedge", collapsed: true,
    said: ["“Dark scenes in video look grey and washed out, and anything bright goes almost " +
      "completely white.”",
      "“We put a greyscale test pattern up and we can only make out the two ends of it.”",
      "“When I opened the picture menu the contrast was pushed right to the top of its range.”"],
    issue: "contrast", fix: "picture",
    wrongIssues: ["backlight", "burn", "refresh", "aspect", "dirty"],
    wrongFixes: ["setrefresh", "brightness", "driver", "replacepanel", "clean"],
    tell: "The middle steps of the wedge have gone and the control that decides where those steps " +
      "sit is at the end of its range. Nothing is broken — it has been told to draw it that way.",
    note: "The original sim answers this one “Adjust the refresh rate settings” and its own " +
      "explanation calls that a stand-in. Refresh rate decides how OFTEN the picture is redrawn; it " +
      "has nothing to do with how black the blacks are." },

  { key: "d-dirty", who: "Reception display, behind glass", kind: "monitor", art: "smear",
    said: ["“The picture is soft and a bit hazy — you cannot read the small text on it " +
      "any more.”",
      "“It is behind a glass panel in the wall, and there are fingerprints and dust all over " +
      "the front of it.”",
      "“The haze seems to move about when you look at it from a different angle.”"],
    issue: "dirty", fix: "clean",
    wrongIssues: ["focus", "aspect", "backlight", "burn", "column"],
    wrongFixes: ["native", "replacepanel", "driver", "picture", "updatedriver"],
    tell: "A haze that changes with your viewing angle is in front of the picture, not in it. " +
      "Nothing inside a panel behaves that way." },

  /* --- the standing five more --- */
  { key: "d-lamp", who: "Lecture theatre projector", kind: "projector", art: "hotspot", dark: true,
    said: ["“It is bright enough in the middle and the edges have gone quite dim.”",
      "“One corner has gone a bit magenta over the last few months.”",
      "“It runs about fourteen hours a day and it has been in that ceiling for three years. It " +
      "has never once shut itself down.”"],
    issue: "lamp", fix: "lampswap",
    wrongIssues: ["filter", "dirty", "focus", "backlight", "keystone"],
    wrongFixes: ["filterclean", "clean", "brightness", "focusring", "angle"],
    tell: "Bright middle, dim edges, colour shifting, over months, on a lamp with roughly fifteen " +
      "thousand hours on it. And it has never shut down — which is what rules out heat." },

  { key: "d-column", who: "Trading desk monitor", kind: "monitor", art: "stuckcol",
    said: ["“There is a bright white line straight down the picture, always in the same place.”",
      "“It is there when I open the monitor's own settings menu with nothing plugged into it " +
      "at all.”",
      "“We tried a different cable and a different computer and it made no difference.”"],
    issue: "column", fix: "replacepanel",
    wrongIssues: ["cable", "source", "burn", "backlight", "refresh"],
    wrongFixes: ["reseat", "updatedriver", "setrefresh", "driver", "clean"],
    tell: "It is on screen when the monitor is drawing its OWN menu with nothing connected. That " +
      "puts the fault past every input, past every cable and inside the panel." },

  { key: "d-refresh", who: "Meeting room display", kind: "monitor", art: "tear",
    said: ["“Whenever anything moves quickly the picture tears across in a line — the top " +
      "half and the bottom half do not line up.”",
      "“Still pictures and documents look perfect.”",
      "“It started right after somebody went into the display settings and changed something.”"],
    issue: "refresh", fix: "setrefresh",
    wrongIssues: ["cable", "backlight", "column", "aspect", "source"],
    wrongFixes: ["reseat", "replacepanel", "driver", "native", "clean"],
    tell: "Perfect when still, torn when moving, and it began when the display settings changed. " +
      "The panel is being handed frames out of step with the rate it draws at.",
    note: "This is the scenario that makes refresh rate an honest distractor everywhere else on " +
      "this list: here it really is the answer, and the tell is motion." },

  { key: "d-backlight", who: "Studio reference monitor", kind: "monitor", art: "banding",
    said: ["“It has gone bright and dim in bands across the screen, and the bands flicker.”",
      "“If I move the brightness slider the pattern changes with it.”",
      "“The picture itself is right — you can see everything that should be there, it is " +
      "just lit unevenly.”"],
    issue: "backlight", fix: "driver",
    wrongIssues: ["contrast", "burn", "refresh", "column", "cable"],
    wrongFixes: ["picture", "brightness", "replacepanel", "setrefresh", "reseat"],
    tell: "Everything that should be in the picture is in the picture. What is wrong is the light " +
      "behind it, and it tracks the brightness control — which is the control that feeds it." },

  { key: "d-aspect", who: "Boardroom display", kind: "monitor", art: "stretch",
    said: ["“Everybody on the video call looks too wide, and the round company logo is an oval.”",
      "“It is stretched by the same amount everywhere on the screen.”",
      "“The machine driving it is set to a resolution that is not on the monitor's list.”"],
    issue: "aspect", fix: "native",
    wrongIssues: ["contrast", "keystone", "burn", "backlight", "refresh"],
    wrongFixes: ["picture", "angle", "replacepanel", "setrefresh", "driver"],
    tell: "Stretched by the same amount everywhere, with nothing else wrong, and the source is set " +
      "to a size the panel does not have. The panel is filling itself with a picture the wrong " +
      "shape for it." }
];

export function generate(seed) {
  const r = rng(seed);
  const fault = r.pick(FAULTS);
  const laptop = r.pick(LAPTOPS);
  const monitor = r.pick(MONITORS);

  /* What the two ends have in common. If nothing, an adapter is needed —
     and if the laptop is USB-C without alt mode, no adapter helps. */
  const shared = laptop.has.filter(function (p) { return monitor.has.indexOf(p) !== -1; });
  const usbcOnly = laptop.has.every(function (p) { return p === "usbc"; });

  /* The panel choice. The job decides it; the cheapest is rarely right. */
  const jobs = [
    { key: "design", said: "we are matching print proofs on screen all day", wants: "ips",
      because: "Colour has to be right and two people look at the same screen" },
    { key: "film",   said: "it is for the waiting room, showing films in a dim corner", wants: "va",
      because: "A dark room rewards contrast more than anything else" },
    { key: "game",   said: "it is for my son and he plays a lot of shooters", wants: "tn",
      because: "Response time is the only thing he will notice, and the budget is small" },
    { key: "till",   said: "it runs the till screen, same layout, open all day every day", wants: "ips",
      because: "A static image all day is exactly what burns an OLED in" }
  ];
  const job = r.pick(jobs);

  return {
    seed: seed,
    customer: r.pick(CUSTOMERS),
    /* The Device Issue Diagnosis device for this seed. */
    device: rng(seed + 197).pick(DX_DEVICES),
    fault: fault,
    said: fault.said,
    laptop: laptop,
    monitor: monitor,
    shared: shared,
    usbcOnly: usbcOnly,
    job: job
  };
}

/* ---------------------------------------------------------------------
   The bench panel.
   --------------------------------------------------------------------- */
function stackPanel(s, opts) {
  opts = opts || {};
  const reveal = !!opts.reveal;
  const states = {};
  LAYERS.forEach(function (L) {
    states[L.key] = reveal
      ? (L.key === s.fault.layer ? "faulty" : "ok")
      : "unknown";
  });
  /* The cable fault lives at no layer at all, and the stack has to say so
     rather than quietly marking everything green as if it had been
     tested. */
  if (reveal && s.fault.layer === null) {
    LAYERS.forEach(function (L) { states[L.key] = "ok"; });
  }

  const ports = {};
  PORTS.forEach(function (p) {
    const onLaptop = s.laptop.has.indexOf(p.key) !== -1;
    const onMonitor = s.monitor.has.indexOf(p.key) !== -1;
    ports[p.key] = (onLaptop && onMonitor) ? "ok"
                 : (onLaptop || onMonitor) ? "suspect" : "na";
  });

  return {
    kind: "bench",
    title: "The monitor, and what can carry a picture into it",
    intro: reveal
      ? "With the fault found: " + s.fault.tell.toLowerCase() + "."
      : "Six layers, none tested. Underneath, every video connector — green where both ends " +
        "have it, amber where only one does.",
    height: 430,
    bench: {
      spec: function () {
        /* The symptom is what the CUSTOMER reported, so it is on screen from
           the first stage — the student is looking at it while they decide
           what to test. Only the torch-lit ghost waits for the reveal,
           because finding it is the test. */
        return displayBench({ states: states, ports: ports,
          artefact: s.fault.art, dark: s.fault.dark, ghost: reveal && !!s.fault.ghost,
          cracked: false });
      },
      status: function () {
        return reveal
          ? { words: s.fault.name, tone: "urgent", detail: s.fault.why }
          : { words: "Nothing tested yet", tone: "calm",
              detail: "What " + s.customer + " said: " + s.said };
      },
      controls: function () {
        const out = LAYERS.map(function (L) {
          return { key: L.key, label: L.label, state: states[L.key],
                   stateWords: layerWords(states[L.key]), detail: L.says };
        });
        PORTS.forEach(function (p) {
          out.push({ key: "port-" + p.key, label: p.label, state: ports[p.key],
            stateWords: ports[p.key] === "ok" ? "Both ends have it"
              : ports[p.key] === "suspect" ? "Only one end has it"
              : "Neither end has it",
            detail: p.carries });
        });
        return out;
      },
      onAction: function () { return {}; }
    }
  };
}

/* --------------------------------------------------------------------- */

export function buildStage(key, s) {

  /* ---- 3.1 : which panel ---------------------------------------------- */
  if (key === "panel") {
    const pc = rng(s.seed + 907).pick(PANEL_CASES);
    return {
      title: "Choose the panel for the job",
      intro: "They will tell you what it is for. The panel technology follows from that, and the " +
        "cheapest is only sometimes the answer.",
      panels: [
        { kind: "brief", title: "What it is for", who: s.customer,
          quotes: [s.job.said, "and it needs to last"] },
        connPanel(function () { return screenBench({}); }, {
          title: "The four panels, turned to show what actually differs",
          intro: "Straight on they are indistinguishable, which is the point of them and the "
            + "reason a student cannot be shown this as a photograph. Each is turned a "
            + "different amount and its face shaded for what you would actually see from "
            + "where you are standing.",
          height: 440,
          words: "Four panels on the bench",
          detail: "Response time and refresh rate are NOT drawn here, deliberately: a still "
            + "picture cannot show motion, and a painted-on blur would be a lie a student "
            + "could memorise. Those two live in the numbers, in the table below."
        }),
        { kind: "table", title: "What the supplier stocks",
          columns: ["Panel", "Colour", "Viewing angles", "Response", "Contrast"],
          rows: PANELS.map(function (p) {
            return { cells: [p.name, p.colour, p.angles, p.response + " ms", p.contrast] };
          }) }
      ],
      questions: [{
        key: "dp-panel", kind: "choice",
        prompt: "Which panel?",
        hints: [
          "Read what it is FOR again and find the single column that matters most to that job. " +
            "The others are noise for this decision.",
          "One of these four ages badly under a static image, which rules it out for anything " +
            "left showing the same thing all day."
        ],
        options: PANELS.map(function (p) {
          const right = p.key === s.job.wants;
          return { key: p.key, label: p.name + " — " + p.note.split(".")[0],
            correct: right,
            why: right ? "Yes. " + s.job.because + ". " + p.note + "."
              : (p.key === "oled" && s.job.key === "till"
                  ? "No. Each pixel makes its own light and ages with use, so a till layout left " +
                    "on screen all day will burn a permanent ghost into it."
                  : "Not the best fit here. " + p.note + ".") };
        }).concat([
          /* TWO MORE PANEL TECHNOLOGIES, to make six. Both are real,
             both are on the shelf, and both are named in a way that
             invites the wrong conclusion \u2014 which is exactly what
             makes them worth putting in front of a student. */
          { key: "qled", label: "QLED \u2014 an LCD with a quantum-dot film for a wider colour range",
            correct: false,
            why: "The name is the trap: for all that it sounds like OLED, it is still a backlit LCD, so its blacks are whatever the backlight leaks through. What it genuinely widens is the colour range, which is a different property from the one this brief turns on." },
          { key: "eink", label: "E-ink \u2014 no backlight at all, and it holds the image with no power",
            correct: false,
            why: "Superb for reading and hopeless for a desk: it redraws in a visible sweep and does colour barely or not at all. Worth being able to recognise; never worth specifying here." }
        ]),
        explain: s.job.because + "."
      }, {
        /* A SECOND BRIEF, FROM THE SAME SHELF. The stage's own job is
           one panel for one customer; this one asks the same question
           from a different room, because the skill is not "know the
           four panels" — it is hearing which SENTENCE in a brief is the
           specification. Six cases, and two of them pull in opposite
           directions on purpose. */
        key: "dp-panelcase", kind: "choice",
        prompt: "Another quote request came in: “" + pc.said + "” Which panel?",
        hints: [
          "Find the sentence about WHERE THE PEOPLE ARE. One viewer square in front of it and "
            + "several viewers spread around it are different specifications, and only one "
            + "panel here is actively bad at the second.",
          "Then find the sentence about WHAT IS ON THE SCREEN. Anything that sits unchanged for "
            + "hours rules out the one panel that ages pixel by pixel, however well it scores "
            + "on everything else.",
          "Two of the six are not choices at all — a refresh rate and a calibration are things "
            + "you do AFTER picking a panel, and neither changes how a panel behaves off-axis "
            + "or how black its black is. Two more are named to mislead: one is a backlit LCD "
            + "wearing a name that sounds like the panel that is not, and one has no backlight "
            + "at all and redraws in a visible sweep."
        ],
        options: connPool(PANEL_OPTS, pc.key, pc.tell, s.seed + 907),
        explain: pc.tell
      }]
    };
  }

  /* ---- 1.2 : getting a picture in -------------------------------------- */
  if (key === "connect") {
    const vid = rng(s.seed + 661).pick(VIDEO_CASES);
    const noAlt = s.usbcOnly && !s.laptop.altmode;
    return {
      title: "Get a picture into it",
      intro: "Two boxes on a desk and no lead between them yet. What the ends have decides " +
        "everything.",
      panels: [
        { kind: "brief", title: "On the desk", who: s.customer,
          quotes: [s.laptop.said,
                   "the monitor is " + s.monitor.name,
                   noAlt ? "the shop said any USB-C cable would do it" : "I just need it working"] },
        connPanel(function () { return videoBench({}); }, {
          title: "The five ends, at one scale",
          intro: "What tells them apart is the shape of the OPENING — a symmetrical trapezoid, "
            + "a rectangle with one corner cut, a D — which is why this is a thing to look at "
            + "rather than read about. Sizes are real: a DVI is three times a USB-C.",
          height: 420,
          words: "Nothing connected yet",
          detail: "Two of these carry no sound at all, one degrades over distance, and one "
            + "may carry no picture whatever the cable."
        }),
        { kind: "table", title: "What each end has",
          columns: ["Port", "On the laptop", "On the display", "What it carries"],
          rows: PORTS.map(function (p) {
            return { cells: [p.label,
              s.laptop.has.indexOf(p.key) !== -1 ? "yes" : "no",
              s.monitor.has.indexOf(p.key) !== -1 ? "yes" : "no",
              p.carries] };
          }) }
      ],
      questions: [{
        key: "dp-ident", kind: "choice",
        prompt: "From another call: \u201c" + vid.said + "\u201d Which end is involved?",
        hints: [
          "Start from what still WORKS. A perfect picture rules out most of this list, and so "
            + "does a picture that is present but poor.",
          "Sort them by what each can physically carry. Two were never wired for audio; one is "
            + "analogue, so it degrades rather than failing; one carries video only if the PORT "
            + "allows it, whatever the lead does.",
          "Three of the options are not connectors at all \u2014 a failed panel, a failed card, a "
            + "driver. Every one of those would behave the same way on a different lead, and "
            + "none of these reports does."
        ],
        options: connPool(VIDEO_OPTS, vid.key, vid.tell, s.seed + 661),
        explain: vid.tell
      }, {
        key: "dp-connect", kind: "choice",
        prompt: noAlt
          ? "They have bought a USB-C to HDMI adapter and there is still no picture. Why?"
          : "What do you use?",
        hints: [
          noAlt
            ? "The adapter is not the problem. Read the USB-C row in the table again — the wording " +
              "is doing real work."
            : "Find the rows where both columns say yes. That is a straight cable and no adapter.",
          noAlt
            ? "A USB-C socket is a shape, not a promise. Video only comes out of it if that " +
              "particular port was wired for it."
            : "If no row has yes in both columns, you need an adapter — and the direction of the " +
              "adapter matters."
        ],
        options: noAlt
          ? [
              { key: "altmode", correct: true,
                label: "That laptop's USB-C ports do not support DisplayPort Alternate Mode, so no " +
                  "adapter can get video out of them",
                why: "Yes. USB-C is a connector shape. Video only leaves it if the port behind it " +
                  "was wired for DisplayPort Alt Mode, and no adapter can add that." },
              { key: "badcable", correct: false, label: "The cable is faulty — try another one",
                why: "It charges, so the cable and the port are electrically fine. The capability " +
                  "is what is missing." },
              { key: "driver", correct: false, label: "The graphics driver needs updating",
                why: "A driver cannot create a signal path the hardware does not have." },
              { key: "input", correct: false, label: "The monitor is on the wrong input",
                why: "Worth checking on any no-signal call, and it would not explain a port that " +
                  "never carries video." },
              /* Two more real explanations for a dead USB-C video link.
                 Both are true of SOME laptops, and neither is true here —
                 which is the point: the table already told you. */
              { key: "power", correct: false,
                label: "The adapter needs its own power supply to drive a display",
                why: "Some docks genuinely do, especially when they are charging the laptop as " +
                  "well. But an adapter that is only carrying video draws almost nothing, and no " +
                  "amount of power creates a video path the port has not got." },
              { key: "wrongway", correct: false,
                label: "The adapter is the wrong way round \u2014 it only converts HDMI to USB-C",
                why: "A real trap, and worth carrying with you: most video adapters convert in one " +
                  "direction only, and a capture-style HDMI-to-USB-C device will not drive a " +
                  "monitor. It is not what is wrong here \u2014 the port itself has no video to " +
                  "give in either direction." }
            ]
          : (function () {
              const direct = s.shared[0];
              const opts = PORTS.map(function (p) {
                const right = direct && p.key === direct;
                return { key: p.key, label: "A straight " + p.label + " cable",
                  correct: !!right,
                  why: right ? "Yes. Both ends have it, so no adapter and nothing to go wrong."
                    : (s.laptop.has.indexOf(p.key) === -1
                        ? "The laptop has no " + p.label + " port."
                        : "The display has no " + p.label + " port.") };
              });
              /* EXACTLY FIVE STRAIGHT CABLES, PLUS THE ADAPTER, MAKING SIX.
                 This used to keep only the ports one side or the other
                 actually has, which varies from four to five and — worse —
                 did the student's table-reading for them. The whole skill
                 here is checking both columns before reaching for a cable,
                 so the ports that are on NEITHER machine belong on the
                 list: ruling them out is the exercise. Padded in PORTS
                 order so the same scenario always offers the same six. */
              const present = opts.filter(function (o) {
                return s.laptop.has.indexOf(o.key) !== -1 || s.monitor.has.indexOf(o.key) !== -1;
              });
              opts.forEach(function (o) {
                if (present.length < 5 && present.indexOf(o) === -1) present.push(o);
              });
              opts.length = 0;
              PORTS.forEach(function (pt) {
                const hit = present.filter(function (o) { return o.key === pt.key; })[0];
                if (hit) opts.push(hit);
              });
              opts.push({ key: "adapter", correct: !direct,
                label: "An adapter, because no single connector is on both ends",
                why: direct
                  ? "Not needed. There is a connector both ends already have, and every adapter is " +
                    "one more thing to fail."
                  : "Yes. Nothing is common to both ends, so something has to convert." });
              return opts;
            })(),
        explain: noAlt
          ? "USB-C is a shape. DisplayPort Alt Mode is the capability, and it is per-port."
          : "Straight cable if both ends share a connector; adapter only when they do not."
      }]
    };
  }

  /* ---- 5.3 : the fault ------------------------------------------------- */
  if (key === "fault") {
    return {
      title: "No picture",
      intro: "One monitor, one complaint, six layers and nothing tested yet.",
      panels: [stackPanel(s, { reveal: false }), {
        kind: "note", title: "What you find when you get there",
        paragraphs: [s.fault.tell]
      }],
      questions: [{
        key: "dp-fault", kind: "choice",
        prompt: "What has failed?",
        hints: [
          "Start with the one test that splits this in half: can the monitor draw its OWN menu? " +
            "If it can, the monitor is working and the fault is upstream.",
          "If the menu is fine and the screen is dark, shine a torch at it at an angle. A faint " +
            "image means the panel is forming the picture and only the light behind it is missing."
        ],
        options: FAULTS.map(function (f) {
          const right = f.key === s.fault.key;
          return { key: f.key, label: f.name, correct: right,
            why: right ? f.why : "That would show as: " + f.tell.toLowerCase() + "." };
        }),
        explain: s.fault.name + ". " + s.fault.why
      }]
    };
  }

  /* ---- 3.1 : the numbers ---------------------------------------------- */
  if (key === "specs") {
    return {
      title: "The numbers on the box",
      intro: "Four figures, and only some of them will be noticed by the person using it.",
      panels: [{
        kind: "note", title: "The one on the shelf",
        paragraphs: [
          "2560 by 1440, 27 inch, 144 Hz, 1 ms response, and it says HDR on the box.",
          "The machine driving it has integrated graphics and one HDMI 1.4 output."
        ]
      }],
      questions: [
        { key: "dp-refresh", kind: "choice",
          prompt: "Will they get 144 Hz at 1440p out of that machine?",
          hints: [
            "Look at what is driving it, not at the monitor. The monitor can only show what it " +
              "is sent.",
            "The output version is the constraint. Ask what bandwidth that particular version has, " +
              "and what 1440p at 144 Hz needs."
          ],
          options: [
            { key: "no", correct: true,
              label: "No — HDMI 1.4 has not got the bandwidth for 1440p at 144 Hz",
              why: "The monitor is capable; the output is not. It will fall back to a lower refresh, " +
                "and the customer will say the monitor is faulty." },
            { key: "yes", correct: false, label: "Yes — the monitor supports it, so it will run",
              why: "The monitor supporting it is only half of it. Both ends and the cable have to." },
            { key: "driver", correct: false, label: "Only after a driver update",
              why: "A driver cannot exceed the physical bandwidth of the output." },
            { key: "cable", correct: false, label: "Only with a better cable",
              why: "A better cable helps a marginal link. It cannot lift HDMI 1.4 past what the " +
                "version allows." }
          ,
            { key: "dsc", label: "Yes \u2014 with Display Stream Compression it fits", correct: false,
              why: "The best wrong answer here, because DSC is real and does let a link carry more " +
                "than its raw bandwidth. It arrived with DisplayPort 1.4 and HDMI 2.1 \u2014 an " +
                "HDMI 1.4 port has never heard of it." },
            { key: "depth", label: "Yes, but only by dropping the colour depth", correct: false,
              why: "Reducing colour depth does save bandwidth and it is a real technique. It is " +
                "nowhere near enough here: the shortfall is far bigger than the saving, so you " +
                "would get worse colour and still no 144 Hz." }
          ],
          explain: "Capability is the whole chain: source, cable and display." },
        { key: "dp-resp", kind: "choice",
          prompt: "Who actually notices a 1 ms response time rather than 5 ms?",
          hints: [
            "Think about what response time measures: how fast one pixel changes from one colour " +
              "to another.",
            "Ask which kind of content changes most of the screen many times a second, and which " +
              "barely changes at all."
          ],
          options: [
            { key: "fast", correct: true,
              label: "Someone playing fast games, where the whole screen changes many times a second",
              why: "Yes. Smearing on fast motion is the only place the difference is visible." },
            { key: "office", correct: false, label: "Anyone doing spreadsheets and email",
              why: "The screen is almost static. They will never see it." },
            { key: "design", correct: false, label: "A designer matching colour",
              why: "They care about colour accuracy and viewing angle, which are different figures " +
                "entirely — and the fastest panels are usually the worst at both." },
            { key: "all", correct: false, label: "Everyone, all the time",
              why: "It is the specification most often sold to people who will never benefit from it." }
          ,
            { key: "video", label: "Anyone watching video", correct: false,
              why: "Film runs at 24 to 60 frames a second and every panel here changes a pixel far " +
                "faster than that. What spoils video is judder from a mismatched refresh rate, " +
                "which is a different figure on the sheet." },
            { key: "pan", label: "Anyone panning around a large drawing or model", correct: false,
              why: "The most tempting wrong answer, because panning genuinely does smear on a slow " +
                "panel \u2014 but what you are seeing there is refresh rate and frame rate. The " +
                "gap between 1 ms and 5 ms is well below what a hand-driven pan can reveal." }
          ],
          explain: "Sell the figure that matches the job, not the biggest one on the box." }
      ]
    };
  }

  /* ---- 1.2 : the dock -------------------------------------------------- */
  if (key === "dock") {
    return {
      title: "Two monitors from one laptop",
      intro: "They want two screens and a keyboard and a network cable, from a laptop with two " +
        "USB-C ports and nothing else.",
      panels: [{
        kind: "note", title: "What is on the desk",
        paragraphs: [
          "Two identical displays, each with HDMI and DisplayPort.",
          "The laptop has two USB-C ports. Both support DisplayPort Alternate Mode, and one " +
            "also carries power in."
        ]
      }, connPanel(function () { return videoBench({}); }, {
        title: "Everything on that desk has one of these on the end of it",
        intro: "Three sockets on the displays, one on the laptop, and the answer is a box that "
          + "turns the small one into several of the big ones. Seeing them at one scale is "
          + "what makes the size difference land: a USB-C is a third of a DVI, and it is "
          + "expected to carry two pictures, a keyboard, a network and the laptop's power "
          + "back up the same lead.",
        height: 400,
        words: "Nothing plugged in yet",
        detail: "The one on the far right is the only end here that may carry no picture at "
          + "all — that depends on the PORT rather than on the cable, which is exactly the "
          + "thing this desk turns on."
      })],
      questions: [{
        key: "dp-dock", kind: "choice",
        prompt: "How do you set this up so they plug in one thing in the morning?",
        hints: [
          "The requirement is not two monitors. It is ONE connection in the morning, which is a " +
            "different problem.",
          "Something has to turn one port into video, video, USB and network at once — and keep " +
            "charging the laptop while it does."
        ],
        options: [
          { key: "dock", correct: true,
            label: "A dock on one USB-C port, with both displays, the keyboard and the network on it",
            why: "Yes. One lead in the morning, and the dock passes power back to the laptop while " +
              "carrying everything else out." },
          { key: "two", correct: false,
            label: "One USB-C to HDMI adapter on each port",
            why: "It gets two pictures and leaves them plugging in three things every morning, with " +
              "no network and no power." },
          { key: "chain", correct: false,
            label: "One adapter, then daisy-chain the second monitor from the first",
            why: "Daisy-chaining is a real DisplayPort feature and both monitors would need to " +
              "support it. It also still leaves the keyboard and network unsolved." },
          { key: "hub", correct: false,
            label: "A basic USB hub with the monitors plugged into it",
            why: "A hub without video support carries data only. The monitors will not light up." }
        ,
            { key: "kvm", label: "A KVM switch, so the desk works with the laptop or the desktop",
              correct: false,
              why: "That solves a different problem \u2014 sharing one desk between two machines. " +
                "They asked to plug ONE thing in when they arrive, and a KVM carries no power to " +
                "the laptop." },
            { key: "wireless", label: "Wireless display adapters on both monitors", correct: false,
              why: "It does remove cables, along with bringing compression, lag and a pairing step " +
                "every morning \u2014 and the laptop still needs its charger. Fewer cables is not " +
                "the same as one cable." }
          ],
        explain: "Read the requirement as they said it: one thing to plug in."
      }]
    };
  }

  /* ---- 5.3 : the projector --------------------------------------------- */
  if (key === "projector") {
    const pj = rng(s.seed + 733).pick(PROJ_CASES);
    return {
      title: "The meeting room projector",
      intro: "Same domain, different physics. What fails on a projector is not what fails on a " +
        "monitor.",
      panels: [{
        kind: "note", title: "What they report",
        paragraphs: [
          "“It has got very dim over the last few months, and now it shuts itself off after about " +
            "twenty minutes.”",
          "The filter has not been cleaned since it was installed."
        ]
      }, connPanel(function () { return screenBench({ show: "projector" }); }, {
        title: "The unit off the ceiling bracket",
        intro: "Four things on it decide almost every projector call: the lens, the intake "
          + "filter, the lamp door underneath, and the exhaust on the far side. Two of them "
          + "are consumables, one of them is the reason a projector shuts down mid-meeting, "
          + "and none of them is what the user will tell you is wrong.",
        height: 420,
        words: "On the bench, filter side towards you",
        detail: "Intake one side, exhaust the other. Anything that blocks either — a clogged "
          + "filter, a cupboard door, a wall — produces the same thermal shutdown from a "
          + "completely different cause and at a completely different price."
      })],
      questions: [{
        key: "dp-proj", kind: "choice",
        prompt: "What is happening?",
        hints: [
          "Two symptoms, and they are related. Ask what both a dimming image and a thermal " +
            "shutdown have in common.",
          "The second line of the report is not scene-setting. It is the cause."
        ],
        options: [
          { key: "heat", correct: true,
            label: "A blocked filter is cooking it — the lamp dims as it ages and the unit shuts " +
              "down on temperature",
            why: "Yes. Restricted airflow raises the internal temperature, which ages the lamp " +
              "faster and eventually trips the thermal cut-out. Cleaning the filter is maintenance, " +
              "not a repair." },
          { key: "lamp", correct: false, label: "The lamp has simply reached the end of its life",
            why: "Lamps do dim with hours, and that alone does not cause a shutdown after twenty " +
              "minutes. The shutdown is thermal." },
          { key: "source", correct: false, label: "The laptop is sending a weak signal",
            why: "A signal problem changes the image, not the brightness, and it would not power " +
              "the unit off." },
          { key: "bulb", correct: false, label: "Somebody fitted the wrong bulb",
            why: "That would show from the first minute rather than gradually over months." }
        ,
            { key: "eco", label: "It is in eco mode, so the lamp runs at reduced brightness",
              correct: false,
              why: "Eco mode does dim the lamp, and it does it CONSISTENTLY \u2014 dim from the " +
                "moment it starts, and it does not shut the projector down. Something that gets " +
                "worse the longer it runs is a heat story." },
            { key: "fan", label: "The cooling fan has failed", correct: false,
              why: "Very close, and the same family: this ends in a thermal shutdown too. The " +
                "difference is audible \u2014 a dead fan is silent and shuts down quickly, while " +
                "a blocked filter roars away and takes far longer to cook. Listen before you " +
                "quote." }
          ],
        explain: "Projectors are thermal devices. Airflow first, lamp second."
      }, {
        /* SIX CALLS THAT ALL SOUND THE SAME. Every one of these arrives
           as "it keeps turning itself off" or "it has gone dim", and
           four of the six really are heat. What separates them is WHEN
           it happens, what it SOUNDS like, and what changed — never the
           symptom, which is identical across the whole table. */
        key: "dp-projcase", kind: "choice",
        prompt: "Another projector call: “" + pj.said + "” What is happening?",
        hints: [
          "Time it. A shutdown three minutes from cold and a shutdown twenty minutes in are "
            + "not the same fault, and neither is a unit that has never shut down at all.",
          "Then listen to it, and ask what CHANGED. A projector working hard to cool itself is "
            + "loud; one with no cooling at all is silent; and one that was fine for years "
            + "until somebody moved it has a room problem rather than a hardware one.",
          "Two of the six are not heat: a picture that is bright and sharp but the wrong SHAPE "
            + "is geometry from the mount, and damage confined to ONE PART of the image is on "
            + "the glass in front of the lamp rather than in the light path. Rule those out "
            + "first — they are settled by looking, not by waiting."
        ],
        options: connPool(PROJ_OPTS, pj.key, pj.tell, s.seed + 733),
        explain: pj.tell
      }]
    };
  }

  /* ---- the walk-back ---------------------------------------------------- */
  if (key === "prove") {
    return {
      title: "Say what it needs and why",
      intro: "You know what failed. Now quote for it.",
      panels: [stackPanel(s, { reveal: true })],
      questions: [{
        key: "dp-quote", kind: "choice",
        prompt: "What do you tell them they need?",
        hints: [
          "Name the part rather than the symptom. A quote for “a screen problem” cannot be " +
            "compared against anything.",
          "One of these replaces far more than has actually failed, and one replaces less. Only " +
            "one names the thing you found."
        ],
        options: [
          { key: "right", correct: true,
            label: "Replace " + s.fault.part,
            why: "Yes. That is what failed, and naming it is what lets them compare your quote " +
              "against anybody else's." },
          { key: "whole", correct: false, label: "Replace the whole monitor",
            why: "Sometimes the right commercial answer, and it is not a diagnosis. Say what failed " +
              "first, then let them decide whether repairing it is worth it." },
          { key: "cable2", correct: false, label: "Try a different cable and see",
            why: "You have already found the fault. Sending them away to experiment is how a " +
              "one-visit job becomes three." },
          { key: "psu2", correct: false, label: "Replace the power board — it is usually that",
            why: "“Usually” is not a diagnosis, and on this unit it is not what you found." }
        ,
            { key: "board", label: "Replace the driver board", correct: false,
              why: "The right answer for banding or a dead column, which is why it belongs here " +
                "\u2014 and it is not what the torch showed you. Match the part to the evidence, " +
                "not to the commonest fault." },
            { key: "backlight2", label: "Replace the backlight assembly", correct: false,
              why: "The other half of the pair this entire lab turns on: a dark panel and a dead " +
                "backlight are identical from the front, are different parts, and cost very " +
                "different money. The torch test is what separates them \u2014 go back to what " +
                "it showed." }
          ],
        explain: "Name the part. It is the difference between a quote and a guess."
      }]
    };
  }

  if (key === "diagnose") {
    const d = s.device;
    const issueQ = {
      key: "dx-issue", kind: "choice",
      prompt: "What is the issue?",
      hints: [
        "Look at the device before you read anything else, then go back to what they said. One " +
          "sentence in the report is doing more work than the other two.",
        "For each option, ask what that fault would ACTUALLY look like, and check it against what " +
          "is on the screen. Two of these produce very similar pictures and are separated by one " +
          "detail in the report."
      ],
      options: rng(s.seed + 211).shuffle([d.issue].concat(d.wrongIssues).map(function (k) {
        return { key: k, label: DX_ISSUES[k].label, correct: k === d.issue,
          why: k === d.issue ? d.tell : DX_ISSUES[k].is + " That is not what this device is doing." };
      })),
      explain: DX_ISSUES[d.issue].label + ". " + d.tell
    };
    const fixQ = {
      key: "dx-fix", kind: "choice",
      prompt: "What is the right solution?",
      hints: [
        "The fix has to act on the thing that is actually wrong. Ask, of each one, what it changes " +
          "— and whether that is the thing you just named.",
        "Two of these are the right SORT of action aimed at the wrong part, and one of them is the " +
          "most expensive answer on the list. A replacement has to be earned by ruling out " +
          "everything cheaper."
      ],
      options: rng(s.seed + 223).shuffle([d.fix].concat(d.wrongFixes).map(function (k) {
        return { key: k, label: DX_FIXES[k].label, correct: k === d.fix,
          why: k === d.fix ? DX_FIXES[k].does
             : DX_FIXES[k].does + " That is not what has gone wrong here." };
      })),
      explain: DX_FIXES[d.fix].label + ". " + DX_FIXES[d.fix].does
    };

    const panels = [{
      kind: "brief", from: d.who,
      paragraphs: d.said
    }, {
      kind: "bench", height: 400,
      bench: {
        spec: function () {
          return deviceBench({ kind: d.kind, art: d.art, dark: !!d.dark, collapsed: !!d.collapsed });
        },
        status: function () {
          return { tone: "warn", words: "As the user sees it",
            detail: "Nothing here is marked. What is wrong is in the picture, and naming it is the " +
              "question below." };
        },
        controls: function () { return []; },
        onAction: function () { return {}; }
      }
    }];
    if (d.note) {
      panels.push({ kind: "note", title: "Worth knowing", paragraphs: [d.note] });
    }

    return {
      title: "Name the issue, then name the fix",
      intro: "A device on the bench with a symptom you can see, and a report from the person who " +
        "uses it. Both halves have to be right — the correct diagnosis with the wrong action " +
        "is still a wasted visit.",
      panels: panels,
      questions: [issueQ, fixQ]
    };
  }

  return null;
}

/* --------------------------------------------------------------------- */
export function selfCheck(sc) {
  const fail = [];
  const ok = function (c, m) { if (!c) fail.push(m); };

  /* ---- diagnose ----------------------------------------------------
     The pair of questions is the whole exercise, so both halves have to
     be answerable and neither may contain its own answer among the
     wrong options. The bench also has to be able to DRAW the symptom:
     a device naming an artefact the bench does not know renders a blank
     screen and the student is asked to name something invisible. */
  const d = sc.device;
  const DRAWN_MONITOR = ["burn", "nosignal", "wedge", "smear", "stuckcol", "tear", "banding", "stretch"];
  const DRAWN_PROJECTOR = ["keystone", "hotspot"];
  ok(!!d, "no device generated");
  if (d) {
    ok(!!DX_ISSUES[d.issue], "device " + d.key + " has issue \"" + d.issue + "\", which is not in the table");
    ok(!!DX_FIXES[d.fix], "device " + d.key + " has fix \"" + d.fix + "\", which is not in the table");
    ok((d.wrongIssues || []).length === 5,
       "device " + d.key + " offers " + (d.wrongIssues || []).length + " wrong issues, not five");
    ok((d.wrongFixes || []).length === 5,
       "device " + d.key + " offers " + (d.wrongFixes || []).length + " wrong fixes, not five");
    ok((d.wrongIssues || []).indexOf(d.issue) < 0, "device " + d.key + " lists its own issue among the wrong ones");
    ok((d.wrongFixes || []).indexOf(d.fix) < 0, "device " + d.key + " lists its own fix among the wrong ones");
    (d.wrongIssues || []).forEach(function (k) {
      ok(!!DX_ISSUES[k], "device " + d.key + " names issue \"" + k + "\", which is not in the table");
    });
    (d.wrongFixes || []).forEach(function (k) {
      ok(!!DX_FIXES[k], "device " + d.key + " names fix \"" + k + "\", which is not in the table");
    });
    ok((d.said || []).length >= 2,
       "device " + d.key + " has fewer than two lines of report \u2014 nowhere to bury the detail that decides it");
    const drawable = d.kind === "projector" ? DRAWN_PROJECTOR : DRAWN_MONITOR;
    ok(drawable.indexOf(d.art) >= 0,
       "device " + d.key + " shows \"" + d.art + "\" on a " + d.kind + ", which the bench cannot draw");
  }
  /* Table level: no two devices may share BOTH an issue and a fix, or
     one of them is teaching nothing the other did not. */
  DX_DEVICES.forEach(function (a, i) {
    DX_DEVICES.slice(i + 1).forEach(function (b) {
      ok(!(a.issue === b.issue && a.fix === b.fix),
         "devices " + a.key + " and " + b.key + " have the same issue and the same fix");
    });
  });

  ok(!!sc.fault, "no fault generated");
  /* A fault either lives at a real layer or is explicitly upstream. A
     fault naming a layer that is not in the stack would light nothing. */
  ok(sc.fault.layer === null || LAYERS.some(function (L) { return L.key === sc.fault.layer; }),
     "fault " + sc.fault.key + " names layer \"" + sc.fault.layer + "\", which is not in the stack");
  ok(!!sc.job && !!sc.job.wants, "no panel job generated");
  ok(PANELS.some(function (p) { return p.key === sc.job.wants; }),
     "job wants panel \"" + sc.job.wants + "\", which is not stocked");

  /* Every port either end has must be a port the bench can draw. */
  sc.laptop.has.concat(sc.monitor.has).forEach(function (k) {
    ok(PORTS.some(function (p) { return p.key === k; }),
       "port \"" + k + "\" is on a device but not on the bench");
  });

  /* THE CONNECT STAGE MUST BE ANSWERABLE.

     Its options are built from what the two ends have, and if a scenario
     produced no shared connector AND no adapter option the question would
     have no correct answer at all. */
  const st = buildStage("connect", sc);
  const rights = st.questions[0].options.filter(function (o) { return o.correct; });
  ok(rights.length === 1,
     "the connect question has " + rights.length + " correct answers, not one");

  /* THE CUSTOMER'S COMPLAINT MUST BE ON SCREEN.

     Every fault here is reported by somebody looking at a picture that is
     wrong, so the bench has to show a picture that is wrong: either the
     screen is dark or it carries an artefact. A fault with neither draws a
     normal, well-lit screen while the brief says something is broken, and
     the student is asked to diagnose a symptom they cannot see. This lives
     here rather than in the shared verifier because it is a fact about
     THIS fault table. */
  ok(sc.fault.dark === true || sc.fault.art !== null,
     "fault " + sc.fault.key + " leaves the screen looking perfectly normal, " +
     "so the complaint the brief describes is not on the bench");

  /* And the torch only finds a picture where a picture is still being
     drawn. A ghost on a dead power board would teach the test wrong. */
  ok(!sc.fault.ghost || sc.fault.dark === true,
     "fault " + sc.fault.key + " promises a torch-lit image on a screen that is not dark");
  ok(!sc.fault.ghost || sc.fault.layer === "backlight",
     "fault " + sc.fault.key + " shows a faint image under a torch but does not blame the " +
     "backlight, which is the only fault that leaves the panel still driving");

  return fail;
}

export function variantKey(sc) { return sc.fault.key + "/" + sc.job.key; }
