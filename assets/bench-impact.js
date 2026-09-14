/* =====================================================================
   A+ Core1 Under the Hood Labs — the impact (dot matrix) bench

   Built from photographs of an OKI Microline 192 Elite with the cover
   off, and from a teardown of the same machine: platen across the back,
   chrome carriage rail in front of it, the head carriage riding the
   rail with the ribbon cassette across it, tractor sprockets at both
   ends of the platen, the mainboard and its transformer below, and the
   Centronics parallel socket on the back edge.

   WHY THIS BENCH EXISTS

   Impact was in this lab the way thermal was: a row in the comparison
   table saying it is the only technology that can print carbon copies,
   one job where it is the right answer, and nothing else. No mechanism,
   no fault, no maintenance. Objective 3.8's impact share — replace the
   ribbon, replace the print head, replace the paper — had nowhere to
   happen, on the one technology a student is most likely to meet in a
   warehouse or a garage and least likely to have ever touched.

   THE MECHANISM IS A TYPEWRITER AND THAT IS THE POINT

   Pins fire, they strike a ribbon, the ribbon marks the paper. Nothing
   is heated, nothing is charged, nothing is sprayed. Everything that can
   go wrong is therefore mechanical and visible, which makes this the
   easiest of the four to reason about once a student has seen it move.

   ONE MOTOR DOES TWO JOBS. From the teardown: the feed motor also drives
   the transfer to the top that spools the ink ribbon, and a cog on the
   cassette engages as the head travels. So the ribbon advances because
   the carriage moves. A student who knows that can explain why a seized
   ribbon spool and a paper feed fault can look related, and why the
   ribbon wears out in the columns that get printed most.

   OCCLUSION, DESIGNED OUT

   A dot matrix lays its parts out in a PLANE — platen, rail, carriage,
   sprockets, board — rather than stacking them. So this is drawn close
   to a plan view, the same answer the wireless bench needed, and nothing
   sits behind anything.

   AND THE SYMPTOM IS NOT DRAWN ON THE MECHANISM

   A fanfold page stands at the front carrying what came out. The rule
   was learned on the display bench and applied on the thermal one, and
   it matters more here than anywhere: two of the five faults produce an
   IDENTICAL page, and the student is meant to have to test rather than
   look.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Carriage travel, and the width of everything that spans the machine. */
const MW = 25.0;

const PLATEN_Z = -4.2;
const RAIL_Z = 0.4;
const BOARD_Z = 7.6;

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "Checked, and right" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Worth a look" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is the one" },
  unknown: { color: "#5a6470", glow: 0.00, says: "Not checked yet" },
  na:      { color: "#39404a", glow: 0.00, says: "Nothing wrong here" }
};
export function partWords(v) { return (LOOK[v] || LOOK.unknown).says; }

/* ---------------------------------------------------------------------
   The parts a student checks, in the order a technician would.
   --------------------------------------------------------------------- */
export const PARTS = [
  { key: "ribbon",  label: "Ribbon cassette",
    says: "A continuous inked loop. It advances because the carriage moves",
    wear: [
      { level: "fresh",
        look: "Dense black cloth, and both spools turn freely when you move the advance cog by hand.",
        page: "Solid, black, crisp.",
        act: "Nothing." },
      { level: "early",
        look: "Slightly paler in the middle of its width, where most printing happens.",
        page: "A shade grey, but nobody has complained.",
        act: "Nothing yet. Note the date; these are cheap and it is worth having one on the shelf." },
      { level: "worn",
        look: "Visibly pale, and you can see the weave of the cloth through the ink where it has been struck most.",
        page: "Grey and hard to read, uniformly across the page.",
        act: "Fit a new cassette. Check the advance cog turns while you are in there." },
      { level: "failed",
        look: "Shredded, or the spool has seized so the same strip is being struck over and over.",
        page: "Pale, then torn holes in the print where the ribbon has been punched through.",
        act: "Fit a new cassette, and inspect the head \u2014 a shredded ribbon can take the wires with it." }
    ],
    wears: false
  },
  { key: "head",    label: "Print head",
    says: "Nine solenoid-driven wires. They strike the ribbon, the ribbon marks the paper",
    wear: [
      { level: "fresh",
        look: "All nine wires stand proud and even, and none of them stick when pressed.",
        page: "Every character complete.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: one wire returns a fraction slower than the rest when you press it.",
        page: "One row very slightly lighter than the other eight, on a solid block only.",
        act: "Note it. This is a head with a year left, not a head to condemn today." },
      { level: "worn",
        look: "One wire visibly sticking, and the head is hot to the touch after a long job.",
        page: "A row that drops out INTERMITTENTLY \u2014 fine from cold, missing after twenty minutes of printing.",
        act: "Order a print head. Intermittent-when-hot is the classic warning and it always gets worse." },
      { level: "failed",
        look: "A wire seized solid, or its solenoid open circuit.",
        page: "A clean white line through every character, on every line, always.",
        act: "Replace the print head. A single dead wire is not a field repair." }
    ],
    wears: true
  },
  { key: "gap",     label: "Head gap lever",
    says: "Sets how far the head sits off the platen, for paper thickness",
    wear: [
      { level: "fresh",
        look: "The lever sits firmly in a detent and matches the paper in use.",
        page: "Crisp on the top sheet and legible on the copies.",
        act: "Nothing." },
      { level: "early",
        look: "The detent is a little soft, so the lever can be nudged out of position.",
        page: "No change while it is in the right notch.",
        act: "Note it. Almost everything wrong with a gap lever is somebody moving it, not the lever wearing out." },
      { level: "worn",
        look: "The detent no longer holds and the lever drifts as the machine vibrates.",
        page: "Print density changes through a long run for no reason anybody can explain.",
        act: "Replace the lever or its detent spring \u2014 and check nobody has been setting it by eye." },
      { level: "failed",
        look: "The lever flops freely between the stops.",
        page: "Faint or smeared depending on where it last fell.",
        act: "Replace it. Until then, set it and tape it rather than leaving it to wander." }
    ],
    wears: false
  },
  { key: "tractor", label: "Tractor sprockets",
    says: "Pins through the holes in the paper edges. This is what makes the feed exact",
    wear: [
      { level: "fresh",
        look: "Pins square and sharp, and both covers close firmly.",
        page: "Every line starts in the same place, a hundred pages down.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: the pins slightly rounded at the tips.",
        page: "Occasionally misses a hole and nudges a line sideways, then recovers.",
        act: "Note it. Check the paper is the right pitch before blaming the sprockets." },
      { level: "worn",
        look: "Pins bent, or one or two broken off.",
        page: "The paper tears at the sprocket holes, and print walks across the page.",
        act: "Replace the tractor unit. Torn holes make everything downstream worse." },
      { level: "failed",
        look: "Pins missing, or the sprocket no longer driven.",
        page: "No consistent feed at all \u2014 the page creeps or stops.",
        act: "Replace the tractor unit." }
    ],
    wears: true
  },
  { key: "platen",  label: "Platen",
    says: "The rubber roller the pins strike the paper against",
    wear: [
      { level: "fresh",
        look: "Even hard rubber, unmarked along its length.",
        page: "Crisp impressions right across.",
        act: "Nothing." },
      { level: "early",
        look: "Starting to show signs of wear: a shiny band along the lines that get printed most.",
        page: "Very slightly lighter in that band.",
        act: "Note it, and suggest rotating the form layout if that is possible." },
      { level: "worn",
        look: "You see signs of wear plainly \u2014 pitted, or grooved where the pins have struck the same lines for years.",
        page: "Print density varies down the page, dense in some bands and weak in others.",
        act: "Replace the platen. This is the one that gets blamed on the ribbon for months." },
      { level: "failed",
        look: "Deep grooves, hardened right through, or big chunks of missing rubber.",
        page: "Weak impressions everywhere and the paper slipping as well.",
        act: "Replace the platen." }
    ],
    wears: true
  }
];

/* =====================================================================
   Geometry
   ===================================================================== */

function platenBuild() {
  return [
    { shape: "cyl", size: [3.0, MW - 4.0], pos: [0, 1.2, PLATEN_Z], rot: [0, 0, P2],
      seg: 26, shade: 1.0 },
    { shape: "cyl", size: [0.9, MW - 0.6], pos: [0, 1.2, PLATEN_Z], rot: [0, 0, P2],
      seg: 14, shade: 0.6 }
  ];
}

/* The toothed sprocket wheels at each end of the platen. Their own part
   because they are their own colour and their own fault. */
function tractorBuild() {
  const x = MW / 2 - 1.8;
  const one = function (sx) {
    return [
      { shape: "cyl", size: [3.4, 1.3], pos: [sx * x, 1.2, PLATEN_Z], rot: [0, 0, P2],
        seg: 20, shade: 1.0 },
      /* the pins that go through the holes in the paper */
      { shape: "box", size: [0.18, 0.34, 0.34], pos: [sx * x + sx * 0.72, 1.2, PLATEN_Z],
        r: 0.02, shade: 1.6,
        ring: { count: 12, radius: 1.6, axis: "x" } }
    ];
  };
  return one(-1).concat(one(1));
}

function railBuild() {
  return [
    { shape: "cyl", size: [0.9, MW + 1.0], pos: [0, 0.9, RAIL_Z], rot: [0, 0, P2],
      seg: 18, shade: 1.0 },
    /* the second, squarer guide behind it */
    { shape: "box", size: [MW + 1.0, 0.5, 0.6], pos: [0, 0.3, RAIL_Z - 1.3], r: 0.05, shade: 0.7 }
  ];
}

/* The carriage that rides the rail. `at` is where along the machine it
   has stopped, in world units. */
function carriageBuild(at) {
  return [
    { shape: "rbox", size: [4.4, 1.9, 2.6], pos: [at, 1.3, RAIL_Z], r: 0.12, shade: 1.0 },
    /* the flexible ribbon cable that feeds it, trailing back to the board */
    { shape: "box", size: [Math.max(1.0, Math.abs(at) + 2.0), 0.1, 0.9],
      pos: [at / 2, 0.4, RAIL_Z + 1.9], r: 0.02, shade: 0.5 }
  ];
}

/* THE PRINT HEAD — its own part, because a dead wire is a fault that
   belongs to it alone and it has to be able to go red on its own. */
function headBuild(at) {
  return [
    { shape: "rbox", size: [2.6, 1.9, 1.7], pos: [at, 1.6, RAIL_Z - 1.4], r: 0.08, shade: 1.0 },
    /* the nine wires, in a column, facing the platen */
    { shape: "box", size: [0.2, 0.2, 0.36], pos: [at, 2.35, RAIL_Z - 2.35], r: 0.01,
      shade: 1.8, repeat: { count: 9, step: [0, -0.17, 0] } }
  ];
}

/* The ribbon cassette across the carriage, with the advance cog that the
   carriage's travel turns. */
function ribbonBuild(at, worn) {
  return [
    /* THE CASSETTE IS DRAWN LIFTED CLEAR OF THE CARRIAGE.

       On the real machine it clips down over the carriage, and drawn that
       way it hid the print head completely — the site of the most
       distinctive fault on this bench. Narrowing it and shuffling it
       forward was not enough; the honest fix is to draw it where a
       technician puts it, which is UP AND OUT. It is the one part here
       that is removed by hand, both to change it and to reach the head
       behind it, so lifting it is what the job looks like as well as what
       the drawing needs. */
    { shape: "rbox", size: [MW - 7.0, 1.0, 1.6], pos: [0, 5.4, RAIL_Z + 1.2], r: 0.14,
      shade: worn ? 0.7 : 1.0 },
    /* the two spool humps */
    { shape: "cyl", size: [2.2, 1.4], pos: [-(MW - 7.0) / 2 + 1.6, 5.4, RAIL_Z + 1.2],
      seg: 18, shade: 0.85 },
    { shape: "cyl", size: [2.2, 1.4], pos: [(MW - 7.0) / 2 - 1.6, 5.4, RAIL_Z + 1.2],
      seg: 18, shade: 0.85 },
    /* the advance cog on the bottom, which the carriage turns as it goes */
    /* the advance cog on the underside, which the carriage turns */
    { shape: "cyl", size: [1.3, 0.6], pos: [(MW - 7.0) / 2 - 1.6, 4.6, RAIL_Z + 1.2],
      seg: 12, shade: 1.5 },
    /* the exposed run of ribbon in front of the head */
    /* the inked run still threads down in front of the head, which is
       where it does its work whether or not the cassette is seated */
    { shape: "box", size: [MW - 8.0, 0.6, 0.12], pos: [0, 2.2, RAIL_Z - 2.5], r: 0.01,
      shade: worn ? 0.55 : 1.2 }
  ];
}

/* The head gap lever, at the left end of the rail. Its angle IS its
   setting, so the drawing carries the state rather than only the lamp. */
function gapBuild(wide) {
  const x = -MW / 2 - 1.2;
  return [
    { shape: "rbox", size: [0.8, 2.6, 0.8], pos: [x, 1.9, RAIL_Z], rot: [wide ? -0.75 : 0.15, 0, 0],
      r: 0.14, shade: 1.0 },
    { shape: "cyl", size: [1.2, 1.0], pos: [x, 0.9, RAIL_Z], rot: [0, 0, P2], seg: 14, shade: 0.6 },
    /* the notched quadrant it sets against, so "wide" has something to be wide OF */
    { shape: "box", size: [0.3, 0.16, 0.5], pos: [x + 0.9, 1.5, RAIL_Z - 1.4], r: 0.02,
      shade: 0.5, repeat: { count: 5, step: [0, 0.34, 0.42] } }
  ];
}

/* The feed motor at the right, which drives the paper AND spools the
   ribbon — one motor, two jobs, exactly as the teardown shows. */
function motorBuild() {
  const x = MW / 2 + 1.4;
  return [
    { shape: "cyl", size: [3.0, 2.6], pos: [x, 1.2, PLATEN_Z], rot: [0, 0, P2], seg: 18, shade: 1.0 },
    { shape: "cyl", size: [1.6, 0.6], pos: [x + 1.5, 1.2, PLATEN_Z], rot: [0, 0, P2], seg: 20, shade: 0.6 }
  ];
}

/* Rotary encoder and light gate at the left of the rail: how the machine
   knows where the carriage is. */
function encoderBuild() {
  const x = -MW / 2 - 0.4;
  return [
    { shape: "cyl", size: [2.2, 0.2], pos: [x, 0.9, RAIL_Z - 2.6], rot: [0, 0, P2], seg: 22, shade: 1.0 },
    { shape: "box", size: [0.12, 0.5, 0.12], pos: [x, 0.9, RAIL_Z - 2.6], r: 0.01,
      shade: 1.6, ring: { count: 16, radius: 0.85, axis: "x" } },
    { shape: "rbox", size: [0.7, 1.4, 1.0], pos: [x, 0.9, RAIL_Z - 3.9], r: 0.08, shade: 0.5 }
  ];
}

/* The logic board along the front, with its transformer and the
   Centronics socket. Context rather than a fault site, but a student
   should see that the electronics are a small part of this machine. */
function boardBuild() {
  return [
    { shape: "rbox", size: [MW - 1.0, 0.3, 5.4], pos: [0, -0.9, BOARD_Z], r: 0.06, shade: 1.0 },
    /* DIP chips */
    { shape: "box", size: [2.6, 0.35, 0.9], pos: [-3.0, -0.6, BOARD_Z + 0.6], r: 0.03,
      shade: 0.35, repeat: { count: 4, step: [3.0, 0, 0] } },
    /* electrolytics */
    { shape: "cyl", size: [1.2, 1.5], pos: [-8.0, -0.1, BOARD_Z - 1.4], seg: 14, shade: 0.5 },
    { shape: "cyl", size: [1.0, 1.3], pos: [-6.4, -0.2, BOARD_Z - 1.4], seg: 14, shade: 0.5 }
  ];
}
function transformerBuild() {
  return [
    { shape: "rbox", size: [4.0, 2.6, 3.2], pos: [-MW / 2 + 3.0, 0.3, BOARD_Z - 0.6], r: 0.1, shade: 1.0 },
    { shape: "box", size: [4.4, 0.3, 3.4], pos: [-MW / 2 + 3.0, 1.5, BOARD_Z - 0.6], r: 0.02, shade: 0.6 }
  ];
}
/* The Centronics parallel socket — 36 pins, and the reason a modern
   machine needs an adapter to talk to this one at all. */
function ifaceBuild() {
  const x = MW / 2 - 4.4;
  return [
    { shape: "rbox", size: [5.2, 1.4, 1.2], pos: [x, -0.1, BOARD_Z + 1.9], r: 0.14, shade: 1.0 },
    { shape: "box", size: [4.2, 0.7, 0.5], pos: [x, -0.1, BOARD_Z + 2.4], r: 0.04, shade: 0.4 },
    { shape: "box", size: [0.1, 0.4, 0.2], pos: [x - 1.9, -0.1, BOARD_Z + 2.5], r: 0.01,
      shade: 1.6, repeat: { count: 18, step: [0.22, 0, 0] } }
  ];
}

/* ---------------------------------------------------------------------
   FANFOLD PAPER — over the platen and forward.

   The sprocket holes down both edges are not decoration. They are the
   whole reason this feed is exact, and the reason paper lifted off the
   pins walks down the page instead of jamming honestly.
   --------------------------------------------------------------------- */
/* THE PAPER GOES UP THE BACK, NEVER OVER THE FRONT.

   The first cut ran a sheet forward across the top of the platen, which
   is roughly where it sits on the real machine and which hid the rail,
   the carriage, the head and the ribbon — three of the five fault sites
   on this bench, invisible. On this machine the fanfold comes up from
   below, wraps the platen and exits upward at the BACK, so drawing it
   that way is both more honest and the arrangement that leaves the
   mechanism in clear sight. */
function paperBuild(offPins) {
  const w = MW - 7.0;
  const skew = offPins ? 0.055 : 0;
  return [
    /* the run rising up behind the platen and out over the top */
    { shape: "box", size: [w, 0.12, 8.2], pos: [0, 4.6, PLATEN_Z - 3.4], rot: [-1.28, skew, 0],
      r: 0.01, shade: 1.0 },
    /* the short wrap around the back of the platen itself */
    { shape: "box", size: [w, 0.12, 2.6], pos: [0, 1.9, PLATEN_Z - 2.0], rot: [-0.55, skew, 0],
      r: 0.01, shade: 1.0 }
  ];
}
/* The holes, as their own darker part so the edge reads as perforated
   rather than merely striped. */
function holesBuild(offPins) {
  const w = MW - 7.0;
  const skew = offPins ? 0.055 : 0;
  /* On the rising run, where they can actually be seen against the
     mechanism rather than edge-on. */
  const one = function (sx) {
    return [{ shape: "cyl", size: [0.44, 0.22], pos: [sx * (w / 2 - 0.7), 5.4, PLATEN_Z - 3.9],
      rot: [-1.28, skew, 0], seg: 10, shade: 1.0,
      repeat: { count: 8, step: [0, 0.66, 0.22] } }];
  };
  return one(-1).concat(one(1));
}

/* =====================================================================
   THE PAGE THAT CAME OUT — standing at the front, nothing behind it.
   ===================================================================== */
const PG_X = -17.6;
const PG_Y = 1.4;
const PG_Z = 7.4;
const PG_W = 9.6;
const PG_H = 7.2;

function pageBody() {
  return [
    { shape: "rbox", size: [PG_W + 0.34, PG_H + 0.34, 0.4], pos: [PG_X, PG_Y, PG_Z], r: 0.08, shade: 1.0 },
    { shape: "rbox", size: [3.2, 0.35, 2.0], pos: [PG_X, PG_Y - PG_H / 2 - 0.6, PG_Z], r: 0.1, shade: 0.6 }
  ];
}
function pageFace() {
  return [{ shape: "rbox", size: [PG_W, PG_H, 0.18], pos: [PG_X, PG_Y, PG_Z + 0.3], r: 0.05, shade: 1.0 }];
}
/* The sprocket edges on the printed page too — it is fanfold, and a
   student should see the same holes on the output as on the roll. */
function pageHoles() {
  const one = function (sx) {
    return [{ shape: "cyl", size: [0.34, 0.14], pos: [PG_X + sx * (PG_W / 2 - 0.5), PG_Y + 2.9, PG_Z + 0.4],
      seg: 10, shade: 1.0, repeat: { count: 9, step: [0, -0.72, 0] } }];
  };
  return one(-1).concat(one(1));
}

/* Rows of dot-matrix characters. Drawn as short blocks rather than glyph
   shapes, which is honest: at this scale a real one is a smear of dots. */
function pageRows(sym) {
  if (sym === "blank") return [];
  const out = [];
  const rows = 7;
  for (let r = 0; r < rows; r++) {
    const y = PG_Y + 2.5 - r * 0.82;
    /* Paper off the sprockets walks: each row starts further across
       than the last, which is what a slipping feed really looks like. */
    const drift = sym === "skew" ? (r - rows / 2) * 0.30 : 0;
    const wide = PG_W - 3.0 - (r % 3) * 0.9;
    out.push({ shape: "box", size: [wide, 0.30, 0.1],
      pos: [PG_X - 0.5 + drift, y, PG_Z + 0.42],
      rot: sym === "skew" ? [0, 0, 0.03] : [0, 0, 0], r: 0.02, shade: 1.0 });
    if (sym === "smudge") {
      /* A head dragging on the paper marks it twice, slightly apart. */
      out.push({ shape: "box", size: [wide, 0.24, 0.1],
        pos: [PG_X - 0.34, y - 0.16, PG_Z + 0.44], r: 0.02, shade: 1.0 });
    }
  }
  return out;
}

/* THE DEAD WIRE — a paper-coloured band straight through every row, at
   the same height in every character.

   This is the single most distinctive impact symptom and it is worth
   contrasting with the thermal bench deliberately: there a blocked
   heater leaves a VERTICAL gap down the page, because the head is a
   fixed line and the paper moves past it. Here a dead wire leaves a
   HORIZONTAL gap through the text, because the head travels across and
   one wire in the column never fires. Same words from a customer, "there
   is a white line", and opposite causes. */
function pageDeadWire() {
  const out = [];
  for (let r = 0; r < 7; r++) {
    const y = PG_Y + 2.5 - r * 0.82;
    out.push({ shape: "box", size: [PG_W - 2.6, 0.09, 0.12],
      pos: [PG_X - 0.5, y + 0.03, PG_Z + 0.5], r: 0.01, shade: 1.0 });
  }
  return out;
}

/* =====================================================================
   impactBench(view)

     view.states    { ribbon, head, gap, tractor, platen }
     view.symptom   "faint" | "pinline" | "skew" | "smudge" | "ok" | "blank"
     view.ribbonWorn
     view.gapWide
     view.offPins
     view.headAt    where the carriage has stopped, in world units
   ===================================================================== */
export function impactBench(view) {
  view = view || {};
  const st = view.states || {};
  const sym = view.symptom || "ok";
  const at = view.headAt === undefined ? -2.0 : view.headAt;

  const parts = [];

  /* The output first: this is what the customer brought in. */
  parts.push({ key: "page-body", label: "The page that came out",
    build: pageBody(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39414a",
    spec: "Continuous fanfold, sprocket holes down both edges.", note: "" });
  parts.push({ key: "page-face", label: "Printed side",
    build: pageFace(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3",
    spec: sym === "blank" ? "Nothing on it at all" : "What the machine produced", note: "" });
  parts.push({ key: "page-holes", label: "Sprocket holes",
    build: pageHoles(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#39414a",
    spec: "The holes the tractor pins drive through", note: "" });

  const rows = pageRows(sym);
  if (rows.length) {
    /* FAINT IS A COLOUR, NOT A SHAPE. Two different faults produce this
       identical page, which is the point — the student has to test. */
    const faint = sym === "faint";
    parts.push({ key: "page-print", label: "The printing",
      build: rows, finish: "matte", scale: 1, pos: [0, 0, 0],
      color: faint ? "#9aa3ab" : (sym === "smudge" ? "#4a525a" : "#1b2128"), glow: 0,
      spec: faint ? "Everything is there, and all of it is too pale to read comfortably"
          : sym === "skew" ? "Each line starts further across than the one above it"
          : sym === "smudge" ? "Marked, but smeared and doubled"
          : "Clean, even, and dense",
      note: faint ? "Uniformly faint means every wire is firing and every one of them is " +
        "under-inking. That is the ribbon or the gap, and this page cannot tell you which."
        : "" });
  }
  if (sym === "pinline") {
    parts.push({ key: "page-deadwire", label: "A white line through every character",
      build: pageDeadWire(), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#eef1f3", glow: 0,
      spec: "Horizontal, at the same height in every character, on every line",
      note: "One wire in the head is not firing. It runs THROUGH the text rather than down " +
        "the page, because the head travels across and the paper does not." });
  }

  /* The mechanism. */
  parts.push({ key: "platen", label: "Platen", build: platenBuild(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#1d2126",
    spec: PARTS[4].says,
    note: "Hard rubber. The pins strike the paper against it, so it takes the wear and " +
      "eventually goes shiny and pitted." });

  parts.push({ key: "tractor", label: "Tractor sprockets", build: tractorBuild(),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#8d5a3c",
    spec: PARTS[3].says,
    note: "Pins through the holes at each edge. This is why an impact printer can hold its " +
      "place down a hundred continuous pages when friction feed cannot." });

  parts.push({ key: "rail", label: "Carriage rail", build: railBuild(),
    finish: "steel", scale: 1, pos: [0, 0, 0], color: "#aeb6bd",
    spec: "The head slides along this", note: "" });

  parts.push({ key: "carriage", label: "Carriage", build: carriageBuild(at),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#6b757f",
    spec: "Carries the head across the page",
    note: "Its travel is also what turns the ribbon's advance cog, so the ribbon only moves " +
      "when the carriage does." });

  parts.push({ key: "head", label: "Print head", build: headBuild(at),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: "#c3cbd2",
    spec: PARTS[1].says,
    note: "Nine wires in a vertical column, each driven by its own solenoid. One that stops " +
      "firing takes its row out of every character on the page." });

  parts.push({ key: "ribbon", label: "Ribbon cassette",
    build: ribbonBuild(at, !!view.ribbonWorn), finish: "plastic", scale: 1, pos: [0, 0, 0],
    /* Clearly lighter than the platen. The first cut had the cassette at
       #25292e against a platen at #2c3238 — two large adjacent parts in
       almost the same colour, which read as one black cylinder and hid
       the cassette completely. One colour per part is not enough on its
       own; adjacent parts also have to be told apart. */
    color: view.ribbonWorn ? "#7d6f58" : "#525c67",
    spec: view.ribbonWorn ? "Pale and dry where it has been struck most" : PARTS[0].says,
    note: "A continuous inked loop that keeps circulating. It wears out fastest in the columns " +
      "that get printed most, so a report always printed in the same layout wears a band." });

  parts.push({ key: "gap", label: "Head gap lever", build: gapBuild(!!view.gapWide),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#d1571f",
    spec: view.gapWide ? "Set wide — for thick multi-part forms" : "Set close — for single sheets",
    note: "Too wide and the pins arrive with less force, so everything prints pale and the " +
      "carbon copies come out blank. Too close and the head drags and snags the ribbon." });

  parts.push({ key: "motor", label: "Feed motor", build: motorBuild(),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: "#5a6169",
    spec: "Drives the platen AND spools the ribbon",
    note: "One motor, two jobs. Worth knowing before you conclude that a feed fault and a " +
      "ribbon fault must be two separate problems." });

  parts.push({ key: "encoder", label: "Position encoder and light gate",
    build: encoderBuild(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#3c434a",
    spec: "How the machine knows where the carriage is", note: "" });

  parts.push({ key: "paper", label: "Fanfold paper",
    build: paperBuild(!!view.offPins), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#f2f4f5",
    spec: view.offPins ? "Lifted off the sprocket pins on one side" : "Seated on both sets of pins",
    note: "" });
  parts.push({ key: "paper-holes", label: "Sprocket holes in the paper",
    build: holesBuild(!!view.offPins), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#3a4148",
    spec: "The holes the pins drive through", note: "" });

  parts.push({ key: "board", label: "Logic board", build: boardBuild(),
    finish: "board", scale: 1, pos: [0, 0, 0], color: "#1f3a2a",
    spec: "Smaller than you expect, on a machine this size", note: "" });
  parts.push({ key: "transformer", label: "Transformer and power supply",
    build: transformerBuild(), finish: "metal", scale: 1, pos: [0, 0, 0], color: "#6e6252",
    spec: "Mains in, low-voltage AC to the board",
    note: "Rectification happens on the mainboard, not here. The fuses on this section are " +
      "the one part of the power supply the user manual expects an owner to change." });
  parts.push({ key: "iface", label: "Centronics parallel socket",
    build: ifaceBuild(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#2f4f8f",
    spec: "36-pin parallel — the interface this machine was built for",
    note: "No modern computer has one. Getting this machine onto a current network means a " +
      "USB-to-parallel adapter or a print server, which is a deployment problem rather than " +
      "a printer problem." });

  /* One lamp per checkable part, off to the right. */
  PARTS.forEach(function (P, i) {
    const state = st[P.key] || "unknown";
    const K = LOOK[state] || LOOK.unknown;
    const y = 6.0 - i * 1.5;
    const lx = MW / 2 + 5.4;
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
    title: "The dot matrix, cover off",
    caption: "Platen across the back with a tractor sprocket at each end, the head riding the " +
      "rail in front of it, and the page it produced standing at the left. The ribbon cassette " +
      "is drawn lifted clear, which is how you reach the head. Pins strike a ribbon, the ribbon " +
      "marks the paper. Nothing here is heated or charged.",
    board: {
      size: [46, 0.5, 30], pos: [-2, -2.6, 1], color: "#2f3944",
      build: [{ shape: "rbox", size: [46, 0.5, 30], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth measured against frustumOK at four canvas widths, not
       guessed. The page at x -22.4 and the lamp column at +18 are the
       two ends that decide it. */
    camera: { dist: 30.0, fitWidth: 52, yaw: 0.16, pitch: 0.62,
      target: [-1.5, 1.6, 1.0], min: 14, max: 90 }
  };
}
