/* =====================================================================
   A+ Core1 Under the Hood Labs — the inkjet bench

   Built from photographs of an HP Deskjet F4280 all-in-one stripped to
   the chassis, and from a teardown of the same machine: the carriage on
   its polished 8mm shaft, the toothed belt and its small DC motor, the
   encoder strip behind, two integrated-head cartridges in the carriage,
   the service station at the end of travel, the feed rollers and the
   star wheels beyond them, and the scanner bar lifted out.

   WHY THIS BENCH EXISTS

   `bench-printer.js` documents view.tech as taking "inkjet" and then
   branches on laser and nothing else, so an inkjet job drew a laser
   cutaway with its seven stations greyed out. Laser, thermal and impact
   all had a bench. Inkjet — the technology most students actually own —
   did not.

   THE THREE THINGS THIS MACHINE DOES THAT NOTHING ELSE HERE DOES

   1. IT PARKS AND CAPS ITSELF. At one end of the carriage's travel a pin
      lifts rubber pads over the nozzles to stop the ink drying in them.
      A printer that cannot park properly kills its own head overnight,
      and the symptom — bad first page, fine afterwards — looks nothing
      like a fault and everything like a mystery.

   2. IT SPITS. Periodically the head is driven over a felt-lined well
      and fires every jet at full force to clear them. That is the
      cleaning cycle, and it is why a cleaning cycle costs ink.

   3. IT KNOWS WHERE IT IS BY LOOKING. Not a stepper — a plain DC motor
      and a strip of very fine black and white bars read by an
      opto-sensor on the carriage. The teardown is explicit about why:
      the cartridges are OFFSET from each other, so colour registration
      has to line up going left, going right, and from one line to the
      next. Get that wrong and text doubles and colours fringe. A dirty
      strip is therefore a print-quality fault, which is not where
      anybody looks first.

   ONE MOTOR, SEVERAL JOBS. Driving the head to the end of its travel
   rotates a gear assembly that engages the wiper AND the sheet feeder,
   so the paper motor runs both without a motor of its own.

   OCCLUSION, DESIGNED OUT

   Like the dot matrix, this machine is a plane rather than a stack, so
   it is drawn close to plan. Two things learned on the impact bench are
   applied here from the start: adjacent parts are given clearly
   different colours, and nothing that hides a fault site is drawn in
   place merely because that is where it sits on the real machine.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Carriage travel. */
const MW = 24.0;

const SHAFT_Z = 0.0;
const STRIP_Z = -3.0;
const FEED_Z = 4.6;
const BOARD_Z = -8.4;

/* The service station lives at the right-hand end of the travel, which
   is where the head parks. */
const STATION_X = MW / 2 - 2.2;

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "Checked, and right" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Worth a look" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is the one" },
  unknown: { color: "#5a6470", glow: 0.00, says: "Not checked yet" },
  na:      { color: "#39404a", glow: 0.00, says: "Nothing wrong here" }
};
export function partWords(v) { return (LOOK[v] || LOOK.unknown).says; }

export const PARTS = [
  { key: "cartridge", label: "Ink cartridges",
    says: "Head and ink in one part. Replace the cartridge and you replace the nozzles",
    wear: [
      { level: "fresh",
        look: "Full, and seated with a positive click.",
        page: "Dense and even.",
        act: "Nothing." },
      { level: "early",
        look: "The estimated level is showing part-used.",
        page: "No change at all.",
        act: "Nothing. An estimated level is an estimate, and changing a cartridge on the strength of one wastes the customer's money." },
      { level: "worn",
        look: "Low warning showing, and the body feels light.",
        page: "Still acceptable, occasionally a shade pale on heavy coverage.",
        act: "Order one. Do not fit it yet \u2014 an inkjet cartridge starts drying the moment it is opened." },
      { level: "failed",
        look: "Empty.",
        page: "One colour missing entirely while the other prints perfectly.",
        act: "Fit a new cartridge, then run the alignment." }
    ],
    wears: false
  },
  { key: "nozzles",   label: "Nozzle plate",
    says: "Hundreds of jets on the underside. Ink dries in them if they are left open",
    wear: [
      { level: "fresh",
        look: "A nozzle check pattern comes out complete, every line present.",
        page: "Sharp and dense.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: one or two lines missing from the nozzle check, and ONE cleaning cycle restores them.",
        page: "A faint band in solid colour that nobody has mentioned.",
        act: "One cleaning cycle. Then leave it \u2014 the machine cleans itself when it parks." },
      { level: "worn",
        look: "Lines missing that need repeated cleaning, and they come back within a day or two.",
        page: "Banding that returns however often it is cleaned.",
        act: "This is a cartridge on its way out, or a capping fault upstream. Check the capping before you spend money on cartridges." },
      { level: "failed",
        look: "A whole colour blocked, and cleaning changes nothing at all.",
        page: "That colour absent from the page.",
        act: "Replace the cartridge \u2014 on this machine the nozzles are part of it, which is why a new cartridge cures a clog here and would not on a fixed-head printer." }
    ],
    wears: true
  },
  { key: "capping",   label: "Service station",
    says: "Caps the nozzles when parked, wipes them, and catches the cleaning spit",
    wear: [
      { level: "fresh",
        look: "Pads soft and springy, sitting square, and the head seals when it parks.",
        page: "First page of the day is as good as the last page of yesterday.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: the pads slightly hardened at the edges.",
        page: "The first page after a weekend is faintly streaky, then fine.",
        act: "Clean the pads. Note the date \u2014 rubber only goes one way." },
      { level: "worn",
        look: "Pads perished or cracked, or something stopping the carriage reaching its park position.",
        page: "Banded every single morning, cleared by two or three pages, every day without fail.",
        act: "Clear the park position and replace the pads. Left alone, the customer runs a cleaning cycle every morning and buys ink to pay for it." },
      { level: "failed",
        look: "Pads not contacting the head at all.",
        page: "Nozzles dry out within hours, not overnight. Heavy banding on almost every job.",
        act: "Replace the service station. Cleaning cycles are treating a symptom that will recur by lunchtime." }
    ],
    wears: true
  },
  { key: "strip",     label: "Encoder strip",
    says: "Fine bars the carriage reads to know exactly where it is",
    wear: [
      { level: "fresh",
        look: "Clear film, bars crisp, no film of anything on it.",
        page: "Text sharp, colours registered.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: a light haze of ink mist you only notice by wiping a corner and comparing.",
        page: "Nothing visible yet.",
        act: "Wipe it end to end with a dry lint-free cloth. This is five minutes of prevention." },
      { level: "worn",
        look: "Heavy mist, or a scratch across the bars where something has caught it.",
        page: "Every other line doubled and offset, colours fringing.",
        act: "Clean it and run the alignment. If a scratch is the cause, cleaning will not help and the strip needs replacing." },
      { level: "failed",
        look: "Torn, or so badly marked the sensor cannot read it.",
        page: "The carriage crashes into the end stops, or the machine reports a carriage error.",
        act: "Replace the encoder strip." }
    ],
    wears: true
  },
  { key: "rollers",   label: "Feed and exit rollers",
    says: "Pull the sheet through, then hand it to the star wheels to push it out",
    wear: [
      { level: "fresh",
        look: "Matt and slightly tacky, and the star wheels turn freely and clean.",
        page: "Clean sheets, one at a time.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: the pickup roller going shiny, and a little dried ink on one star wheel.",
        page: "The odd misfeed, and a faint mark down one edge now and then.",
        act: "Clean the rollers and the star wheels. Most of what looks like roller wear is a roller that needs a wipe." },
      { level: "worn",
        look: "Glazed hard and shiny, or star wheels loaded with dried ink.",
        page: "Multiple sheets pulled at once, or lines dragged down the length of every page.",
        act: "Clean thoroughly; if a glazed roller stays glassy after cleaning, it is worn out and wants replacing." },
      { level: "failed",
        look: "Big chunks of missing rubber, or a roller that no longer grips at all.",
        page: "It will not pick paper, or it jams on every sheet.",
        act: "Replace the roller." }
    ],
    wears: true
  }
];

/* =====================================================================
   Geometry
   ===================================================================== */

function shaftBuild() {
  return [
    { shape: "cyl", size: [1.0, MW + 2.0], pos: [0, 2.0, SHAFT_Z], rot: [0, 0, P2],
      seg: 20, shade: 1.0 },
    /* the tension spring the teardown points out, which stops it wandering */
    { shape: "cyl", size: [0.5, 1.6], pos: [-MW / 2 - 1.4, 2.0, SHAFT_Z], rot: [0, 0, P2],
      seg: 10, shade: 0.6 }
  ];
}

/* Belt and its small DC motor. Not a stepper — the machine finds its
   position by reading the strip, not by counting steps. */
function beltBuild() {
  return [
    { shape: "box", size: [MW, 0.5, 0.22], pos: [0, 1.2, SHAFT_Z - 1.5], r: 0.02, shade: 1.0 },
    { shape: "box", size: [MW, 0.5, 0.22], pos: [0, 1.2, SHAFT_Z - 2.1], r: 0.02, shade: 1.0 },
    { shape: "cyl", size: [1.5, 0.7], pos: [-MW / 2, 1.2, SHAFT_Z - 1.8], seg: 16, shade: 0.7 },
    { shape: "cyl", size: [1.5, 0.7], pos: [MW / 2, 1.2, SHAFT_Z - 1.8], seg: 16, shade: 0.7 },
    { shape: "cyl", size: [2.4, 2.2], pos: [-MW / 2 - 1.6, 1.2, SHAFT_Z - 1.8], rot: [0, 0, P2],
      seg: 16, shade: 0.45 }
  ];
}

/* THE ENCODER STRIP — a tall thin ribbon of fine bars standing behind
   the shaft. Its own part, and the fault site nobody looks at. */
function stripBuild(dirty) {
  return [
    /* Fine and thin. The first cut made it 1.5 tall with high-contrast
       bars and it became the loudest object on the bench — a barcode
       banner across the back, when the real thing is a strip of film you
       have to look for. Loudness should track importance, and this is a
       detail the student has to go and find. */
    { shape: "box", size: [MW + 1.0, 0.85, 0.1], pos: [0, 2.7, STRIP_Z], r: 0.01, shade: 1.0 },
    { shape: "box", size: [0.11, 0.6, 0.06], pos: [-MW / 2, 2.7, STRIP_Z + 0.1], r: 0.005,
      shade: dirty ? 0.55 : 0.34, repeat: { count: 70, step: [0.35, 0, 0] } }
  ];
}
/* Ink mist and dust ON the strip, drawn proud of it so it is not buried
   inside the strip's own volume — the mistake the thermal bench made. */
function stripGrimeBuild(at) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    out.push({ shape: "box", size: [0.5 + (i % 3) * 0.5, 0.72, 0.22],
      pos: [at + (i - 4) * 0.75, 2.7, STRIP_Z + 0.3], r: 0.03, shade: 1.0 });
  }
  return out;
}

function carriageBuild(at) {
  return [
    { shape: "rbox", size: [7.0, 2.4, 3.6], pos: [at, 2.4, SHAFT_Z + 0.6], r: 0.16, shade: 1.0 },
    /* the flex cable trailing back, and the spring that keeps it flat */
    { shape: "box", size: [Math.max(1.2, Math.abs(at - 4) + 3.0), 0.12, 1.2],
      pos: [(at - 8) / 2, 1.0, SHAFT_Z + 3.2], r: 0.02, shade: 0.45 }
  ];
}

/* The two cartridges. TWO PARTS, because they are two colours and a
   part is one colour — and because "which one is empty" is a question
   the bench has to be able to answer by itself. */
function cartBuild(at, sx, tall) {
  const x = at + sx * 1.7;
  return [
    { shape: "rbox", size: [2.7, tall ? 3.2 : 2.7, 2.9], pos: [x, tall ? 3.6 : 3.4, SHAFT_Z + 0.6],
      r: 0.12, shade: 1.0 },
    /* the label patch on the front */
    { shape: "box", size: [2.1, 1.0, 0.14], pos: [x, tall ? 3.2 : 3.0, SHAFT_Z + 2.1],
      r: 0.02, shade: 1.7 }
  ];
}

/* THE NOZZLE PLATE — the underside of the cartridges, facing the paper.
   Its own part because a clog belongs to it and it has to go red alone. */
function nozzleBuild(at) {
  return [
    /* IN FRONT OF THE CARRIAGE, NOT INSIDE IT. Drawn at the cartridges'
       true underside it sat entirely within the carriage's own volume and
       rendered as nothing — and the nozzle plate is a fault site. It is
       brought forward to the face of the carriage, which is also roughly
       where you see it when you tip a cartridge out to look. */
    { shape: "box", size: [5.6, 0.7, 0.5], pos: [at, 1.5, SHAFT_Z + 2.7], r: 0.04, shade: 1.0 },
    { shape: "box", size: [0.12, 0.34, 0.16], pos: [at - 2.4, 1.5, SHAFT_Z + 2.98], r: 0.005,
      shade: 1.8, repeat: { count: 26, step: [0.19, 0, 0] } }
  ];
}

/* THE SERVICE STATION: capping pads, wiper blades, and the spittoon.
   Three jobs in one assembly, and the reason an inkjet left unused for
   a month is a different machine from one used every day. */
function stationBuild(capsUp) {
  const x = STATION_X;
  const lift = capsUp ? 0.5 : 0.0;
  return [
    /* the well itself */
    { shape: "rbox", size: [5.0, 2.2, 4.6], pos: [x, 0.8, SHAFT_Z + 0.6], r: 0.1, shade: 1.0 },
    /* the two capping pads that rise onto the nozzles */
    { shape: "rbox", size: [1.7, 0.7, 1.4], pos: [x - 1.0, 1.4 + lift, SHAFT_Z + 0.6], r: 0.14, shade: 0.55 },
    { shape: "rbox", size: [1.7, 0.7, 1.4], pos: [x + 1.0, 1.4 + lift, SHAFT_Z + 0.6], r: 0.14, shade: 0.55 },
    /* the wiper blades */
    { shape: "box", size: [0.22, 0.9, 1.6], pos: [x - 2.0, 1.5, SHAFT_Z + 0.6], r: 0.02, shade: 0.3,
      repeat: { count: 2, step: [0.5, 0, 0] } }
  ];
}
/* The spittoon's felt, which goes black. Its own part and its own
   colour, because how black it is IS the machine's service history. */
function spittoonBuild(used) {
  const x = STATION_X;
  return [{ shape: "box", size: [3.8, 0.3, 2.4], pos: [x, 1.1, SHAFT_Z + 3.4], r: 0.04,
    shade: used ? 1.0 : 0.55 }];
}

/* Feed rollers on their shaft, and the star wheels above them that take
   the page once it runs off the main rollers. */
function rollerBuild() {
  return [
    { shape: "cyl", size: [0.8, MW - 2.0], pos: [0, 1.1, FEED_Z], rot: [0, 0, P2], seg: 16, shade: 0.7 },
    { shape: "cyl", size: [2.0, 2.2], pos: [-MW / 2 + 3.0, 1.1, FEED_Z], rot: [0, 0, P2],
      seg: 18, shade: 1.0, repeat: { count: 5, step: [4.6, 0, 0] } }
  ];
}
function starWheelBuild() {
  return [
    { shape: "cyl", size: [0.5, MW - 4.0], pos: [0, 2.6, FEED_Z + 1.9], rot: [0, 0, P2],
      seg: 12, shade: 0.7 },
    { shape: "cyl", size: [1.3, 0.16], pos: [-MW / 2 + 3.4, 2.6, FEED_Z + 1.9], rot: [0, 0, P2],
      seg: 12, shade: 1.0, repeat: { count: 7, step: [3.2, 0, 0] } }
  ];
}

function boardBuild() {
  return [
    { shape: "rbox", size: [13.0, 0.3, 4.6], pos: [-4.0, 0.4, BOARD_Z], r: 0.06, shade: 1.0 },
    { shape: "box", size: [2.2, 0.35, 0.8], pos: [-7.0, 0.7, BOARD_Z + 0.5], r: 0.03,
      shade: 0.35, repeat: { count: 3, step: [2.8, 0, 0] } },
    { shape: "cyl", size: [1.1, 1.4], pos: [-9.6, 1.1, BOARD_Z - 1.2], seg: 14, shade: 0.5 },
    { shape: "cyl", size: [0.9, 1.2], pos: [-8.2, 1.0, BOARD_Z - 1.2], seg: 14, shade: 0.5 }
  ];
}

/* The scanner bar, lifted out and lying on the mat — which is how the
   teardown meets it, and which keeps it from covering the mechanism.
   It is here because this is an all-in-one, and 3.7 is about
   multifunction devices, not printers on their own. */
function scannerBuild() {
  /* Out on clear mat at the front, not tucked behind the board where
     the strip covered it. */
  const x = 3.0, z = 10.4;
  return [
    { shape: "rbox", size: [15.0, 1.1, 2.2], pos: [x, 0.6, z], r: 0.1, shade: 1.0 },
    { shape: "box", size: [13.0, 0.2, 1.0], pos: [x, 1.2, z], r: 0.02, shade: 1.6 },
    { shape: "cyl", size: [1.2, 1.0], pos: [x + 7.0, 0.6, z], rot: [0, 0, P2],
      seg: 14, shade: 0.5 }
  ];
}

/* =====================================================================
   THE PAGE — standing at the front left, nothing behind it.
   ===================================================================== */
const PG_X = -17.0;
const PG_Y = 3.0;
const PG_Z = 7.0;
const PG_W = 9.4;
const PG_H = 7.0;

function pageBody() {
  return [
    { shape: "rbox", size: [PG_W + 0.34, PG_H + 0.34, 0.4], pos: [PG_X, PG_Y, PG_Z], r: 0.08, shade: 1.0 },
    { shape: "rbox", size: [3.2, 0.35, 2.0], pos: [PG_X, PG_Y - PG_H / 2 - 0.6, PG_Z], r: 0.1, shade: 0.6 }
  ];
}
function pageFace() {
  return [{ shape: "rbox", size: [PG_W, PG_H, 0.18], pos: [PG_X, PG_Y, PG_Z + 0.3], r: 0.05, shade: 1.0 }];
}

/* Black text at the top. Doubled and offset when the carriage does not
   know where it is. */
function pageText(sym) {
  const z = PG_Z + 0.42;
  const out = [];
  for (let r = 0; r < 3; r++) {
    const y = PG_Y + 2.6 - r * 0.8;
    const w = PG_W - 2.2 - (r % 2) * 1.4;
    out.push({ shape: "box", size: [w, 0.34, 0.1], pos: [PG_X - 0.4, y, z], r: 0.02, shade: 1.0 });
    if (sym === "ghost") {
      /* Every other line is laid down travelling the other way, so a
         carriage that has lost its place doubles alternate lines. */
      if (r % 2 === 1) {
        out.push({ shape: "box", size: [w, 0.3, 0.1], pos: [PG_X - 0.4 + 0.42, y - 0.1, z + 0.03],
          r: 0.02, shade: 1.0 });
      }
    }
  }
  return out;
}

/* The colour block underneath, which is what a colour fault shows in. */
function pageColour(sym) {
  if (sym === "nocolour") return [];
  const z = PG_Z + 0.42;
  return [{ shape: "box", size: [PG_W - 2.6, 2.6, 0.1], pos: [PG_X - 0.4, PG_Y - 1.6, z],
    r: 0.04, shade: 1.0 }];
}

/* Paper-coloured bands ACROSS the colour block: rows of nozzles that
   are not firing. Drawn by taking colour away, the same way the thermal
   bench draws a void — a defect that removes ink has to be drawn as
   removed ink, or it reads as its own opposite. */
function pageBands(sym) {
  if (sym !== "bands") return [];
  const z = PG_Z + 0.52;
  const out = [];
  for (let i = 0; i < 4; i++) {
    out.push({ shape: "box", size: [PG_W - 2.6, 0.22, 0.12],
      pos: [PG_X - 0.4, PG_Y - 0.7 - i * 0.62, z], r: 0.02, shade: 1.0 });
  }
  return out;
}

/* Streaks dragged down the page by a dirty roller or a star wheel. */
function pageSmear(sym) {
  if (sym !== "smear") return [];
  const z = PG_Z + 0.52;
  return [{ shape: "box", size: [0.3, PG_H - 1.4, 0.12], pos: [PG_X - 2.6, PG_Y - 0.3, z],
    r: 0.02, shade: 1.0, repeat: { count: 4, step: [1.7, 0, 0] } }];
}

/* =====================================================================
   inkjetBench(view)

     view.states     { cartridge, nozzles, capping, strip, rollers }
     view.symptom    "bands" | "ghost" | "nocolour" | "smear" | "ok"
     view.headAt     where the carriage has stopped, in world units
     view.parked     is the head over the station with the caps up
     view.stripDirty
     view.stripGrimeAt
     view.colourEmpty  is the colour cartridge the empty one
   ===================================================================== */
export function inkjetBench(view) {
  view = view || {};
  const st = view.states || {};
  const sym = view.symptom || "ok";
  const parked = !!view.parked;
  const at = parked ? STATION_X : (view.headAt === undefined ? -3.0 : view.headAt);

  const parts = [];

  /* The page first. */
  parts.push({ key: "page-body", label: "The page that came out",
    build: pageBody(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39414a",
    spec: "Black text at the top, a colour block underneath.", note: "" });
  parts.push({ key: "page-face", label: "Printed side",
    build: pageFace(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3",
    spec: "What the machine produced", note: "" });
  parts.push({ key: "page-text", label: "The black text",
    build: pageText(sym), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#1b2128", glow: 0,
    spec: sym === "ghost" ? "Every other line is doubled and offset" : "Clean and sharp",
    note: sym === "ghost"
      ? "Alternate lines are laid down travelling the other way. Doubling on every OTHER line " +
        "means the carriage does not know where it is in one direction."
      : "" });
  const col = pageColour(sym);
  if (col.length) {
    parts.push({ key: "page-colour", label: "The colour block",
      build: col, finish: "matte", scale: 1, pos: [0, 0, 0], color: "#c0397a", glow: 0,
      spec: sym === "bands" ? "Banded — rows of it missing" : "Solid and even", note: "" });
  }
  const bands = pageBands(sym);
  if (bands.length) {
    parts.push({ key: "page-bands", label: "White bands through the colour",
      build: bands, finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3", glow: 0,
      spec: "Horizontal gaps in the colour block, evenly spaced",
      note: "Rows of nozzles that are not firing. Evenly spaced, because the nozzles are in " +
        "evenly spaced rows." });
  }
  const smear = pageSmear(sym);
  if (smear.length) {
    parts.push({ key: "page-smear", label: "Streaks down the page",
      build: smear, finish: "matte", scale: 1, pos: [0, 0, 0], color: "#3a3f46", glow: 0,
      spec: "Dragged in the direction the paper moved",
      note: "Something touching the wet side of the page after the ink landed on it." });
  }
  if (sym === "nocolour") {
    parts.push({ key: "page-missing", label: "Where the colour should be",
      build: [{ shape: "box", size: [PG_W - 2.6, 2.6, 0.06],
        pos: [PG_X - 0.4, PG_Y - 1.6, PG_Z + 0.4], r: 0.04, shade: 1.0 }],
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#e2e6e9", glow: 0,
      spec: "Nothing here at all, while the black text above it is perfect",
      note: "One whole cartridge contributing nothing, with the other working normally." });
  }

  /* The mechanism. */
  parts.push({ key: "shaft", label: "Carriage shaft", build: shaftBuild(),
    finish: "steel", scale: 1, pos: [0, 0, 0], color: "#c2cad1",
    spec: "Polished 8mm. The carriage glides on it", note: "" });

  parts.push({ key: "belt", label: "Belt and carriage motor", build: beltBuild(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#2b3036",
    spec: "A plain DC motor, not a stepper",
    note: "It does not count steps. It moves, and the carriage reads the strip to find out " +
      "where it got to." });

  parts.push({ key: "strip", label: "Encoder strip",
    build: stripBuild(!!view.stripDirty), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#dfe4e8",
    spec: PARTS[3].says,
    note: "The cartridges sit offset from each other, so colour has to register going left, " +
      "going right, and line to line. That accuracy comes from reading these bars \\u2014 which " +
      "is why ink mist on the strip shows up as a print quality fault." });
  if (view.stripDirty) {
    parts.push({ key: "strip-grime", label: "Ink mist on the strip",
      build: stripGrimeBuild(view.stripGrimeAt === undefined ? 0 : view.stripGrimeAt),
      finish: "corroded", scale: 1, pos: [0, 0, 0], color: "#4a3f52",
      spec: "A film of atomised ink and paper dust",
      note: "Over the bars it covers, the sensor cannot count. The carriage guesses, and what " +
        "it guesses wrong lands on the page." });
  }

  parts.push({ key: "carriage", label: "Carriage", build: carriageBuild(at),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#3f464e",
    spec: parked ? "Parked over the service station" : "Out over the page",
    note: "" });

  parts.push({ key: "cart-colour", label: "Tri-colour cartridge",
    build: cartBuild(at, -1, false), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: view.colourEmpty ? "#8d8f93" : "#b8447e",
    spec: view.colourEmpty ? "Reading empty" : "Cyan, magenta and yellow in one body",
    note: "" });
  parts.push({ key: "cart-black", label: "Black cartridge",
    build: cartBuild(at, 1, true), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#23272c",
    spec: "The XL body — same head, more ink", note: "" });

  parts.push({ key: "nozzles", label: "Nozzle plate", build: nozzleBuild(at),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: "#9aa3ab",
    spec: PARTS[1].says,
    note: "On this machine the nozzles are part of the CARTRIDGE, not the printer. That is why " +
      "a new cartridge cures a clog here and would not on a machine with a fixed head." });

  parts.push({ key: "capping", label: "Service station",
    build: stationBuild(parked), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#4d5761",
    spec: parked ? "Caps raised onto the nozzles" : "Caps down, nozzles open to the air",
    note: "Park, cap, wipe, spit. All of it happens here, and all of it is driven by the head " +
      "arriving at the end of its travel rather than by a motor of its own." });
  parts.push({ key: "spittoon", label: "Spittoon felt",
    build: spittoonBuild(true), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#171a1e",
    spec: "Black from years of being fired into",
    note: "Every cleaning cycle fires every jet at full force into this. That is why cleaning " +
      "costs ink, and why running it four times in a row is not four times better." });

  parts.push({ key: "rollers", label: "Feed rollers", build: rollerBuild(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#33383e",
    spec: PARTS[4].says, note: "" });
  parts.push({ key: "starwheels", label: "Star wheels", build: starWheelBuild(),
    finish: "steel", scale: 1, pos: [0, 0, 0], color: "#aab2b9",
    spec: "Spiked wheels that ride on the wet side",
    note: "They are spiked and thin on purpose: they have to push the page out while touching " +
      "ink that has only just landed. Dirty, they draw lines down everything." });

  parts.push({ key: "board", label: "Logic board", build: boardBuild(),
    finish: "board", scale: 1, pos: [0, 0, 0], color: "#1f3a2a",
    spec: "Very little of this machine is electronics", note: "" });
  parts.push({ key: "scanner", label: "Scanner bar, lifted out",
    build: scannerBuild(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#575f68",
    spec: "The other half of an all-in-one",
    note: "One small DC motor, a gear, and a shaft encoder to know where it is. No belt, no " +
      "stepper. Drawn lying on the mat because that is where it ends up the moment you open " +
      "one of these." });

  /* One lamp per checkable part. */
  PARTS.forEach(function (P, i) {
    const state = st[P.key] || "unknown";
    const K = LOOK[state] || LOOK.unknown;
    const y = 7.4 - i * 1.5;
    const lx = MW / 2 + 5.0;
    parts.push({ key: "well-" + P.key, label: P.label + " indicator surround",
      build: [{ shape: "cyl", size: [1.05, 0.11], pos: [lx, y, 0], rot: [0, 0, P2],
        seg: 16, shade: 0.30 }],
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + P.key, label: P.label + " status",
      build: [
        { shape: "cyl", size: [0.7, 0.18], pos: [lx + 0.1, y, 0], rot: [0, 0, P2], seg: 16, shade: 1.0 },
        { shape: "sphere", size: [0.6], pos: [lx + 0.2, y, 0], seg: 14, shade: 1.0 }
      ],
      finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: K.color, glow: K.glow, spec: K.says, note: K.says });
  });

  return {
    kind: "bench",
    title: "The inkjet, opened up",
    caption: "Carriage on its shaft with both cartridges, the encoder strip behind it, the " +
      "service station at the parking end, feed rollers and star wheels in front, and the page " +
      "it produced standing at the left. The nozzles are part of the cartridge on this machine.",
    board: {
      size: [46, 0.5, 30], pos: [-2, -0.6, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [46, 0.5, 30], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth measured against frustumOK at four canvas widths. */
    camera: { dist: 30.0, fitWidth: 52, yaw: 0.16, pitch: 0.58,
      target: [-1.5, 2.2, 0.5], min: 14, max: 90 }
  };
}
