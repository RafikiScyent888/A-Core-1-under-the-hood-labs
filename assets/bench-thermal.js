/* =====================================================================
   A+ Core1 Under the Hood Labs — the direct thermal bench

   Built from photographs of a real desktop label printer with the lid
   open: platen roller above, print head below, the heating line across
   the head with residue sitting on it, gold flex connectors at both ends
   of the head, an orange head-lift lever, and the roll feeding up from
   the well behind.

   WHY THIS BENCH EXISTS AT ALL

   The Printer lab had thermal as a row in a comparison table — duty
   cycle, cost per page, "good for receipts" — and nothing else. No
   mechanism, no fault, no maintenance. printerBench even documented
   view.tech as accepting "thermal" and then only ever branched on laser,
   so asking for a thermal machine drew the laser cutaway with its seven
   stations greyed out. Objective 3.8 is "perform appropriate printer
   maintenance", and half of it — replace the paper, clean the heating
   element, remove the debris — had nowhere to happen.

   THERE IS ALMOST NOTHING HERE, AND THAT IS THE LESSON

   A direct thermal printer has no toner, no ink, no ribbon and no
   fuser. The only consumable is the paper, and the paper is the ink:
   it is coated with a dye that goes black where it is heated. So every
   fault on this bench is one of four things — the head, the platen, the
   sensor, or the paper — and a student who understands that can fix any
   of them in about a minute. That is worth teaching precisely because
   it is easy: it is the one printer technology where a technician can
   be completely confident.

   OCCLUSION, DESIGNED OUT

   The head-open view is the one arrangement where nothing hides: the
   platen sits in the lid above, the head sits in the body below, and
   the gap between them is the paper path. That is also exactly how a
   technician meets the machine, so the drawing and the job agree.

   AND THE SYMPTOM IS NOT DRAWN ON THE MECHANISM

   A printed label stands at the front carrying what came out — the white
   line, the blank, the skew. The mechanism behind it is the evidence the
   student reasons FROM. Drawing the defect on the part that caused it
   hands over the answer, which is the mistake the display bench made and
   which is not repeated here.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Mechanism width. A 4-inch label head, roughly, at this scale. */
const MW = 17.0;

/* The platen rides above the head; the paper passes between them. The
   gap is deliberately generous — a real one is a millimetre, and a
   millimetre drawn to scale is an invisible seam rather than a paper
   path anybody can see. */
const HEAD_Y = 0.0;
const PLATEN_Y = 4.6;

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "Checked, and right" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Worth a look" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is the one" },
  unknown: { color: "#5a6470", glow: 0.00, says: "Not checked yet" },
  na:      { color: "#39404a", glow: 0.00, says: "Nothing wrong here" }
};
export function partWords(v) { return (LOOK[v] || LOOK.unknown).says; }

/* ---------------------------------------------------------------------
   The parts, declared once. Order is front-to-back through the machine,
   which is also the order a technician checks them.
   --------------------------------------------------------------------- */
export const PARTS = [
  { key: "platen",  label: "Platen roller",
    says: "Presses the paper against the head and pulls it through",
    wear: [
      { level: "fresh",
        look: "Even, matt, slightly tacky rubber the whole way along.",
        page: "Labels come through straight and print evenly.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: a shiny band where the label edge has been tracking.",
        page: "Still straight, but the very edge of the print is a shade lighter.",
        act: "Note it. Clean it while you are in there, and see whether the shine is dirt or glaze." },
      { level: "worn",
        look: "You see signs of wear plainly \u2014 glazed hard and shiny, or a groove worn where the same label width has run for years.",
        page: "Labels skew, or the print comes out squashed where the paper stalls and slips.",
        act: "Replace the platen. Cleaning a glazed roller buys you weeks, not months." },
      { level: "failed",
        look: "Flat spots, or big chunks of missing rubber.",
        page: "The paper barely moves at all, or feeds and jams alternately.",
        act: "Replace the platen before anything else. Nothing downstream can be judged while the paper is slipping." }
    ],
    wears: true
  },
  { key: "element", label: "Heating element",
    says: "A line of tiny heaters. This is what makes the image",
    wear: [
      { level: "fresh",
        look: "An even glaze along the heating line, no scoring, no dull patches.",
        page: "Dense, even black on every label.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: a faint dull patch where adhesive keeps building up.",
        page: "Very slightly lighter in one narrow column, easiest to see on a solid black block.",
        act: "Clean it with 99% isopropyl on a lint-free swab. At this stage it is dirt, not damage." },
      { level: "worn",
        look: "A scratch you can SEE in the ceramic coat, usually from somebody having scraped it.",
        page: "A white line down every label in the same place \u2014 and cleaning does not shift it.",
        act: "Replace the head. A scratch through the wear coat is permanent, and it looks exactly like the debris fault that caused somebody to scrape at it." },
      { level: "failed",
        look: "Whole groups of heaters no longer firing, or visible burn damage.",
        page: "Wide blank columns, or nothing prints at all.",
        act: "Replace the head." }
    ],
    wears: true
  },
  { key: "flex",    label: "Head ribbon connectors",
    says: "Gold contacts at both ends of the head. Static kills them",
    wear: [
      { level: "fresh",
        look: "Bright clean gold on every finger.",
        page: "Nothing to see.",
        act: "Nothing. Handle by the edges, and ground yourself first." },
      { level: "early",
        look: "Starting to show signs of wear: the gold dulling slightly at the outer fingers.",
        page: "Nothing yet.",
        act: "Leave it alone. Reseating a connector for no reason is how fretting starts." },
      { level: "worn",
        look: "Dark tarnish or green corrosion on some fingers, or bright scuffing from being reseated many times.",
        page: "Columns that come and go \u2014 fine on one label, missing on the next.",
        act: "Clean the contacts, reseat once, and if it recurs replace the head. Intermittent is the signature." },
      { level: "failed",
        look: "A finger lifted, cracked or burnt through.",
        page: "The head does nothing at all.",
        act: "Replace the head assembly." }
    ],
    wears: true
  },
  { key: "latch",   label: "Head-lift lever",
    says: "Clamps the head down onto the platen. Both sides, or neither",
    wear: [
      { level: "fresh",
        look: "Both levers click home crisply and hold.",
        page: "Even pressure right across the label.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: one side clicks softer than the other.",
        page: "Nothing on the page yet.",
        act: "Note it. This is the sort of thing that only shows up when the machine is busy." },
      { level: "worn",
        look: "The spring has gone soft and the head lifts slightly under load.",
        page: "Print fades away part-way across, and comes back on the next label.",
        act: "Replace the latch or the head assembly, depending on how it is built." },
      { level: "failed",
        look: "It will not hold the head down at all.",
        page: "Print light at one edge and gone at the other, every time.",
        act: "Replace it. Do not tape it down \u2014 an unclamped head wears its own element." }
    ],
    wears: true
  },
  { key: "sensor",  label: "Media sensor",
    says: "Finds the gap between labels so the printer knows where to stop",
    wear: [
      { level: "fresh",
        look: "A clear window with nothing on it.",
        page: "Every label stops in the right place.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: a light film of paper dust, and calibration still passes first time.",
        page: "Occasionally starts a label a millimetre out.",
        act: "Wipe the window. Run a calibration." },
      { level: "worn",
        look: "An adhesive haze you have to work at to remove.",
        page: "Needs recalibrating often, and drifts again within a week.",
        act: "Clean it properly with isopropyl. Adhesive builds back, so this becomes a routine rather than a repair." },
      { level: "failed",
        look: "The window is obscured or the sensor is dead.",
        page: "It feeds continuously hunting for a gap it cannot see, then reports out of paper with a full roll fitted.",
        act: "Replace the sensor." }
    ],
    wears: true
  },
  { key: "roll",    label: "Paper roll",
    says: "Heat-sensitive on ONE face. The paper is the ink",
    wear: [
      { level: "fresh",
        look: "A full roll, and the coated face is against the head.",
        page: "Dense and even.",
        act: "Nothing." },
      { level: "early",
        look: "Roughly half used. Nothing wrong with it.",
        page: "No change at all.",
        act: "Nothing. A part-used consumable is not a fault, and swapping it early is the customer's money." },
      { level: "worn",
        look: "The coloured warning stripe printed near the core is starting to show through.",
        page: "Still perfect, right up until it stops.",
        act: "Order a roll now. That stripe exists precisely so somebody orders before the queue does." },
      { level: "failed",
        look: "Out, or down to the core.",
        page: "Nothing at all, or the last few labels come through with the stripe printed across them.",
        act: "Fit a new roll, coated face to the head." }
    ],
    wears: false
  }
];

/* =====================================================================
   Geometry
   ===================================================================== */

/* The platen: a roller with the moulded bearing caps on each end. The
   caps are their own part because they are their own colour, and a
   roller drawn in one colour with its caps merged in reads as a plain
   bar rather than something that turns in bearings. */
function platenBuild() {
  return [
    { shape: "cyl", size: [2.5, MW - 2.2], pos: [0, PLATEN_Y, 0], rot: [0, 0, P2],
      seg: 28, shade: 1.0 },
    /* the shaft stubs the caps sit on */
    { shape: "cyl", size: [0.8, MW + 0.6], pos: [0, PLATEN_Y, 0], rot: [0, 0, P2],
      seg: 14, shade: 0.7 }
  ];
}
function platenCapBuild() {
  const x = MW / 2 - 0.6;
  return [
    { shape: "rbox", size: [1.5, 2.0, 2.0], pos: [-x - 0.5, PLATEN_Y, 0], r: 0.3, shade: 1.0 },
    { shape: "rbox", size: [1.5, 2.0, 2.0], pos: [x + 0.5, PLATEN_Y, 0], r: 0.3, shade: 1.0 }
  ];
}

/* The head carrier: an extruded aluminium bar, because that is what it
   is — the bar is the heatsink. */
function headBodyBuild() {
  return [
    { shape: "rbox", size: [MW, 2.2, 3.4], pos: [0, HEAD_Y - 0.6, 0], r: 0.12, shade: 1.0 },
    /* the fin ridges along the front face of the heatsink */
    { shape: "box", size: [0.22, 1.4, 0.2], pos: [-MW / 2 + 1.0, HEAD_Y - 0.6, 1.75], r: 0.02,
      shade: 0.6, repeat: { count: 16, step: [1.0, 0, 0] } }
  ];
}

/* THE HEATING LINE. Its own part, because it is the only thing on this
   bench whose colour carries meaning, and one part is one colour. */
function elementBuild() {
  return [
    /* The line itself, proud of the carrier's top front edge where it
       really sits and where the eye can actually find it. The first cut
       drew it 0.34 tall and tucked back, and the one thing on this bench
       that the whole lab is about was a hairline nobody could see. */
    { shape: "box", size: [MW - 2.4, 0.55, 0.9], pos: [0, HEAD_Y + 0.78, 0.95],
      r: 0.05, shade: 1.0 },
    /* the glaze strip running along it, so it reads as glass over
       something rather than a painted stripe */
    { shape: "box", size: [MW - 3.0, 0.16, 0.3], pos: [0, HEAD_Y + 1.04, 1.25],
      r: 0.02, shade: 1.8 }
  ];
}

/* Residue ON the element — the fault, drawn where it actually sits.
   Irregular on purpose: real debris is a smear of adhesive and paper
   dust, not a neat band. Only added when the fault is live. */
function debrisBuild(at) {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const w = 0.34 + (i % 3) * 0.46;
    const h = 0.30 + (i % 2) * 0.16;
    /* ON the element, not inside it. The element's top face is at
       HEAD_Y + 1.055 and its front at z 1.4, so debris drawn at y 1.06
       / z 1.0 sat entirely within the element's own volume and rendered
       as nothing at all. Sit it proud of both faces. */
    out.push({ shape: "box", size: [w, h, 0.5],
      pos: [at + (i - 4) * 0.42, HEAD_Y + 1.22, 1.34], r: 0.03, shade: 1.0 });
  }
  return out;
}

/* The gold flex tails, one at each end, folding down off the head. */
function flexBuild() {
  const x = MW / 2 - 1.9;
  const one = function (sx) {
    return [
      { shape: "box", size: [3.0, 0.14, 1.8], pos: [sx * x, HEAD_Y - 1.75, -0.4], r: 0.02, shade: 1.0 },
      /* the contact fingers, which is what makes it read as a connector */
      { shape: "box", size: [0.12, 0.06, 1.5], pos: [sx * x - 1.3, HEAD_Y - 1.68, -0.4], r: 0.01,
        shade: 1.5, repeat: { count: 18, step: [0.15, 0, 0] } }
    ];
  };
  return one(-1).concat(one(1));
}

/* The head-lift lever. Orange in the photographs, and orange is outside
   the royal palette, so it is drawn in the build and coloured by the
   caller — see the note on the part below. */
function latchBuild(open) {
  const x = -MW / 2 - 1.4;
  const lean = open ? 0.9 : 0.0;
  return [
    { shape: "rbox", size: [1.1, 3.6, 1.0], pos: [x, HEAD_Y + 1.2, 0], rot: [0, 0, lean],
      r: 0.18, shade: 1.0 },
    { shape: "cyl", size: [1.3, 1.2], pos: [x, HEAD_Y - 0.4, 0], rot: [0, 0, P2],
      seg: 14, shade: 0.7 }
  ];
}

/* The media sensor, looking up through the paper path from below. */
function sensorBuild() {
  return [
    { shape: "rbox", size: [1.6, 0.7, 1.6], pos: [-2.6, HEAD_Y - 2.2, -1.2], r: 0.1, shade: 1.0 },
    { shape: "cyl", size: [0.6, 0.4], pos: [-2.6, HEAD_Y - 1.8, -1.2], seg: 12, shade: 1.6 }
  ];
}

/* The roll in its well, behind and below. */
/* The roll sits BELOW the mechanism bar, not behind it.

   Behind is where it really lives, and behind is where it was drawn
   first — completely invisible, because a head carrier 3.4 deep at eye
   level hides everything in the well behind it. Dropping it below the
   bar keeps the paper path readable (up out of the well, through the
   nip, out to the tear bar) while leaving the roll itself in clear
   sight, which is what the "is there paper, and is it the right way
   round" question needs. */
const ROLL_Y = -5.2;
const ROLL_Z = -3.4;
function rollBuild(left) {
  const d = 5.6 - (1 - left) * 2.8;
  return [
    { shape: "cyl", size: [d, MW - 4.6], pos: [0, ROLL_Y, ROLL_Z], rot: [0, 0, P2],
      seg: 26, shade: 1.0 },
    { shape: "cyl", size: [1.5, MW - 4.0], pos: [0, ROLL_Y, ROLL_Z], rot: [0, 0, P2],
      seg: 14, shade: 0.55 }
  ];
}

/* The web: up out of the well, through the nip, and out to the front. */
function paperBuild() {
  return [
    /* up the back of the well from the roll to the nip */
    { shape: "box", size: [MW - 4.6, 0.12, 6.4], pos: [0, HEAD_Y - 1.4, -2.2], rot: [-0.95, 0, 0],
      r: 0.01, shade: 1.0 },
    /* through the nip and forward to the tear bar */
    { shape: "box", size: [MW - 4.6, 0.12, 3.6], pos: [0, HEAD_Y + 1.5, 1.0], rot: [0.1, 0, 0],
      r: 0.01, shade: 1.0 }
  ];
}

function tearBuild() {
  return [{ shape: "box", size: [MW, 0.3, 0.7], pos: [0, HEAD_Y + 2.1, 2.6], rot: [0.5, 0, 0],
    r: 0.04, shade: 1.0 }];
}

/* ---------------------------------------------------------------------
   THE LABEL THAT CAME OUT — the customer's evidence, standing at the
   front where nothing occludes it.

   Same rule the display bench had to learn: the symptom belongs on the
   output, not on the part that caused it. A white line drawn across the
   heating element says "the element is the fault", which is true for
   debris and false for a lifted latch — and either way it is the answer
   to the question being asked.
   --------------------------------------------------------------------- */
const LAB_X = -12.6;
const LAB_Y = -4.4;
const LAB_Z = 5.4;
const LAB_W = 9.0;
const LAB_H = 6.0;

function labelBody() {
  return [
    { shape: "rbox", size: [LAB_W + 0.34, LAB_H + 0.34, 0.4], pos: [LAB_X, LAB_Y, LAB_Z],
      r: 0.08, shade: 1.0 },
    /* a little easel foot, so it stands rather than floats */
    { shape: "rbox", size: [3.0, 0.35, 2.0], pos: [LAB_X, LAB_Y - LAB_H / 2 - 0.6, LAB_Z],
      r: 0.1, shade: 0.6 }
  ];
}
function labelFace() {
  return [{ shape: "rbox", size: [LAB_W, LAB_H, 0.18], pos: [LAB_X, LAB_Y, LAB_Z + 0.3],
    r: 0.06, shade: 1.0 }];
}

/* WHAT IS PRINTED ON IT — a shipping label's worth of dark content:
   two text lines and a barcode. Its own part, its own colour.

   This exists because of a mistake worth keeping written down. The void
   fault was first drawn as a DARK line on a white label, which is the
   exact inverse of the defect: a void is where the print is MISSING.
   Drawn that way it reads as a stripe of extra ink, and a student
   matching symptom to cause would learn the wrong pairing. So the label
   carries real printed content, and the fault is drawn by taking content
   AWAY — which is also what the machine really does. */
function labelPrint(sym) {
  if (sym === "blank" || sym === null || sym === undefined) return [];
  const z = LAB_Z + 0.42;
  const out = [
    { shape: "box", size: [LAB_W - 2.0, 0.42, 0.1], pos: [LAB_X, LAB_Y + 2.1, z], r: 0.02, shade: 1.0 },
    { shape: "box", size: [LAB_W - 3.6, 0.3, 0.1], pos: [LAB_X - 0.8, LAB_Y + 1.2, z], r: 0.02, shade: 1.0 },
    { shape: "box", size: [0.17, 2.2, 0.1], pos: [LAB_X - 3.1, LAB_Y - 0.8, z], r: 0.01,
      shade: 1.0, repeat: { count: 17, step: [0.37, 0, 0] } },
    { shape: "box", size: [LAB_W - 4.8, 0.26, 0.1], pos: [LAB_X - 1.4, LAB_Y - 2.4, z], r: 0.02, shade: 1.0 }
  ];
  if (sym === "smear") {
    /* Dragged: the same content, but sheared and doubled where the paper
       slipped under a firing head. */
    out.forEach(function (q) { q.rot = [0, 0, 0.075]; });
    out.push({ shape: "box", size: [LAB_W - 2.4, 0.3, 0.1], pos: [LAB_X + 0.4, LAB_Y + 1.75, z],
      rot: [0, 0, 0.075], r: 0.02, shade: 1.0 });
  }
  return out;
}

/* THE FAULT, drawn by REMOVING print. Paper-coloured bars laid over the
   content — which is physically what a cold heater leaves behind. */
function labelVoid(sym, at) {
  const z = LAB_Z + 0.5;
  if (sym === "void") {
    /* One clean vertical gap, full height, in the same place on every
       label. `at` maps the debris's position along the head onto the
       label, so the two line up when the student looks from one to the
       other — which is the whole deduction. */
    return [{ shape: "box", size: [0.5, LAB_H - 0.8, 0.12],
      pos: [LAB_X + at * (LAB_W / MW), LAB_Y, z], r: 0.02, shade: 1.0 }];
  }
  if (sym === "edge") {
    /* One end never touched the paper, so print fades out across the
       label rather than stopping at a line. */
    const out = [];
    for (let i = 0; i < 6; i++) {
      out.push({ shape: "box", size: [LAB_W / 6.4, LAB_H - 0.8 - i * 0.85, 0.12],
        pos: [LAB_X + LAB_W / 2 - 0.7 - i * (LAB_W / 6.4), LAB_Y, z], r: 0.02, shade: 1.0 });
    }
    return out;
  }
  return [];
}

/* =====================================================================
   thermalBench(view)

     view.states   { platen, element, flex, latch, sensor, roll }
     view.symptom  "void" | "blank" | "edge" | "smear" | "text" | null
     view.debris   is there residue on the element
     view.debrisAt where along the head, in world units
     view.latchOpen is the lever standing up
     view.rollLeft  0..1, how much paper is left
   ===================================================================== */
export function thermalBench(view) {
  view = view || {};
  const st = view.states || {};
  const sym = view.symptom || null;
  const at = view.debrisAt === undefined ? 2.4 : view.debrisAt;

  const parts = [];

  /* The output first: this is what the customer saw. */
  parts.push({ key: "label-body", label: "The label that came out",
    build: labelBody(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39414a",
    spec: "What the machine actually produced. The fault is behind it, not on it.", note: "" });
  parts.push({ key: "label-face", label: "Printed face",
    build: labelFace(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3",
    spec: sym === "blank" ? "Completely blank. It fed through and nothing appeared."
        : sym === null ? "Nothing printed yet" : "Something is wrong with this print",
    note: "" });
  const printed = labelPrint(sym);
  if (printed.length) {
    parts.push({ key: "label-print", label: "What printed",
      build: printed, finish: "matte", scale: 1, pos: [0, 0, 0], color: "#1b2128", glow: 0,
      spec: sym === "smear" ? "The image is there, but the paper moved while it was printing"
                            : "Address lines and a barcode",
      note: "" });
  }
  const voids = labelVoid(sym, at);
  if (voids.length) {
    parts.push({ key: "label-void",
      label: sym === "void" ? "A white line down every label" : "One edge light and fading",
      build: voids, finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3", glow: 0,
      spec: sym === "void"
        ? "Same width, same place, on every single label. Nothing printed there at all."
        : "Dark at one end, fading to nothing at the other",
      note: sym === "void"
        ? "A gap this clean is not a paper problem and not a driver problem. Something is " +
          "stopping one narrow group of heaters reaching the paper."
        : "Print that fades ACROSS the label means uneven pressure, not a dead heater." });
  }

  /* The mechanism. */
  parts.push({ key: "platen", label: "Platen roller", build: platenBuild(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#6d757d",
    spec: PARTS[0].says,
    note: "Rubber, and it glazes. A glazed platen slips, and paper that slips while the " +
      "head is firing prints smeared and crooked.", });
  parts.push({ key: "platen-caps", label: "Platen bearing caps", build: platenCapBuild(),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#2f6fd0",
    spec: "Lift out with the roller for cleaning", note: "" });

  parts.push({ key: "head-body", label: "Print head carrier", build: headBodyBuild(),
    finish: "steel", scale: 1, pos: [0, 0, 0], color: "#aab3ba",
    spec: "Aluminium, and it is the heatsink",
    note: "It runs hot in use. Power off and let it cool before you touch it." });

  parts.push({ key: "element", label: "Heating element", build: elementBuild(),
    finish: "glass", scale: 1, pos: [0, 0, 0], color: "#26303a",
    spec: PARTS[1].says,
    note: "A row of individually fired heaters under a thin ceramic wear coat. Clean it with " +
      "99% isopropyl on a lint-free swab — never scrape it, because a scratch in that " +
      "coat is a white line that no amount of cleaning will remove." });

  if (view.debris) {
    parts.push({ key: "debris", label: "Residue on the element",
      build: debrisBuild(at), finish: "corroded", scale: 1, pos: [0, 0, 0], color: "#7d6a44",
      spec: "Adhesive and paper dust, baked on",
      note: "Wherever this sits, those heaters cannot reach the paper — so that column " +
        "comes out white on every label until it is cleaned off." });
  }

  parts.push({ key: "flex", label: "Head ribbon connectors", build: flexBuild(),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: "#c8a94e",
    spec: PARTS[2].says,
    note: "Gold-plated so they do not corrode. Touch them with an ungrounded hand and you can " +
      "put the head out permanently." });

  parts.push({ key: "latch", label: "Head-lift lever",
    build: latchBuild(!!view.latchOpen), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#d1571f",
    spec: view.latchOpen ? "Standing up — the head is not clamped" : "Down and clamped",
    note: "There is one at each end and they have to be down together. One up and the head " +
      "only touches the paper at one end." });

  parts.push({ key: "sensor", label: "Media sensor", build: sensorBuild(),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#4b535b",
    spec: PARTS[4].says,
    note: "It looks through the paper for the gap between labels. Cover it in dust or adhesive " +
      "and the printer never finds a gap, so it keeps feeding looking for one." });

  parts.push({ key: "roll", label: "Paper roll",
    build: rollBuild(view.rollLeft === undefined ? 0.7 : view.rollLeft),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#e7eaec",
    spec: PARTS[5].says,
    note: "Coated on ONE face. That face has to go against the head, or it feeds perfectly and " +
      "comes out blank. Scratch a corner with a coin — real thermal paper goes dark." });

  parts.push({ key: "paper", label: "The web through the nip",
    build: paperBuild(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#f2f4f5",
    spec: "Up out of the well, between head and platen, out to the tear bar", note: "" });

  parts.push({ key: "tearbar", label: "Tear bar", build: tearBuild(),
    finish: "steel", scale: 1, pos: [0, 0, 0], color: "#8f979e",
    spec: "Serrated edge to tear the label off", note: "" });

  /* One lamp per checkable part, off to the right of the mechanism. */
  PARTS.forEach(function (P, i) {
    const state = st[P.key] || "unknown";
    const K = LOOK[state] || LOOK.unknown;
    const y = PLATEN_Y + 1.6 - i * 1.5;
    parts.push({ key: "well-" + P.key, label: P.label + " indicator surround",
      build: [{ shape: "cyl", size: [1.05, 0.11], pos: [MW / 2 + 2.5, y, 0], rot: [0, 0, P2],
        seg: 16, shade: 0.30 }],
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + P.key, label: P.label + " status",
      build: [
        { shape: "cyl", size: [0.7, 0.18], pos: [MW / 2 + 2.6, y, 0], rot: [0, 0, P2],
          seg: 16, shade: 1.0 },
        { shape: "sphere", size: [0.6], pos: [MW / 2 + 2.7, y, 0], seg: 14, shade: 1.0 }
      ],
      finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: K.color, glow: K.glow, spec: K.says, note: K.says });
  });

  return {
    kind: "bench",
    title: "The thermal mechanism, lid open",
    caption: "Platen above, head below, paper between them. The label at the front is what came " +
      "out. There is no toner, no ink and no ribbon here — the paper is the ink.",
    board: {
      size: [36, 0.5, 20], pos: [-1.6, -8.4, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [36, 0.5, 20], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* The label's left edge is at x -17.3 and the lamp column ends at
       x +11.6, so the bench is 29 wide before margins. fitWidth keeps
       both ends on a narrow panel — measured against frustumOK, not
       guessed, and deliberately no larger than it needs to be, because
       every unit of slack here shrinks the heating element, which is the
       one thing on this bench a student has to be able to find. */
    camera: { dist: 20.0, fitWidth: 38, yaw: 0.20, pitch: 0.22,
      target: [-2.9, -1.2, 0], min: 12, max: 70 }
  };
}
