/* =====================================================================
   A+ Core1 Under the Hood Labs — the showroom bench

   SIX MACHINES ON A SHELF, and the student picks the one the job needs.

   The choose stage was six sentences under a customer's brief. It is the
   stage where the answer IS a machine, and the owner asked for students
   to work off the model rather than off a list — so here are the
   machines, to the same scale, with the features that decide the answer
   built into them rather than described underneath.

   WHY ALL SIX AND NOT THE FOUR REAL TECHNOLOGIES

   The obvious build was the four in TYPES. It would also have handed the
   answer over: the question offers six options, and showing four of them
   on a shelf narrows the field to those four for free — the same class
   of leak as marking the failing station red on the defect bench, or
   painting banding onto the display panel's own face. So the two near
   misses are on the shelf too, and they are drawn as what they really
   are: a dye-sub with its ribbon cassette and roll, and a thermal
   transfer with a ribbon spool above the head that plain thermal has
   not got.

   WHAT EACH MACHINE HAS TO SHOW

   The point is not decoration, it is that the deciding feature is
   VISIBLE and different on each one:

     laser            a big cassette drawer, a toner hatch, a heavy body
     inkjet           a scanner lid, cartridges on a carriage, a paper
                      support standing up at the back
     thermal          a roll sitting in an open bay, a tear bar, no
                      ribbon anywhere
     thermal transfer the same, plus a ribbon spool over the head, which
                      is the entire difference and the whole question
     impact           tractor sprockets and fanfold paper with holes
     dye sublimation  a ribbon cassette and its own coated media

   ONE COLOUR PER PART, AND ADJACENT PARTS DIFFER. The impact bench once
   drew a cassette and a platen in near-identical blacks and they read as
   one object. Bodies here alternate in tone along the shelf so no two
   neighbours merge, and the deciding feature on each machine is always
   the lightest thing on it, because that is what the eye should find.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Machines stand in a row. Wide enough apart that no two touch, close
   enough that all six fit a frame the camera can hold at 720px — the
   width was measured against frustumOK, not guessed. */
/* THREE ACROSS AND TWO DEEP, not six in a line.

   Six in a row is 86 units of content in a frame that is nowhere near
   that shape: the machines came out as a distant strip with the whole
   lower half of the canvas empty, and the last one fell off the edge.
   A 3x2 grid halves the width and uses the height, so each machine is
   nearly twice the size on screen.

   THE ROW SPACING IS COMPUTED, NOT EYEBALLED. The display bench earned
   this rule: a front machine of height H hides the row behind it unless
   the camera looks down steeply enough to clear it, which needs
   tan(pitch) > H / gap. The tallest machine here is the laser at 8.4,
   and the rows are 17 apart, so the pitch has to beat atan(8.4/17) =
   0.46 rad. It is set to 0.62, and the two numbers are ONE decision —
   the assertion below fails the module if somebody changes one without
   the other. */
const SLOT = 13.6;
const ROW_GAP = 17.0;
const TALLEST = 8.4;
const CAM_PITCH = 0.62;
const COL = [-SLOT, 0, SLOT];
const BOARD_W = SLOT * 3 + 8;
const BOARD_D = ROW_GAP + 22;

if (Math.tan(CAM_PITCH) <= TALLEST / ROW_GAP) {
  throw new Error("showroom: at pitch " + CAM_PITCH + " the front row hides the back one. " +
    "tan(pitch) must exceed " + (TALLEST / ROW_GAP).toFixed(3) +
    " — change ROW_GAP and CAM_PITCH together.");
}

/* Shift a built machine to its slot in the grid. The builders all draw
   around z = 0, so the back row is moved wholesale rather than every
   shape being given a second coordinate to get wrong. */
function atRow(list, dz) {
  return list.map(function (o) {
    const p = o.pos || [0, 0, 0];
    return Object.assign({}, o, { pos: [p[0], p[1], p[2] + dz] });
  });
}

/* ---- the pieces each machine is built from ---------------------- */

/* A body shell: the box, with a recessed output shelf on top so it reads
   as a printer rather than a crate. */
function shell(x, w, h, d, tone) {
  return [
    { shape: "rbox", size: [w, h, d], pos: [x, h / 2 - 3.0, 0], r: 0.5, shade: tone },
    /* the output recess */
    { shape: "rbox", size: [w * 0.74, 0.7, d * 0.6], pos: [x, h - 3.15, 0.6], r: 0.2,
      shade: tone * 0.72 }
  ];
}

/* The paper cassette that slides out of the bottom of a laser. */
function cassette(x, w, d) {
  return [
    { shape: "rbox", size: [w * 0.9, 1.9, d * 0.9], pos: [x, -1.9, 1.5], r: 0.25, shade: 1.0 },
    /* the grab handle, which is how you know it pulls out */
    { shape: "box", size: [w * 0.42, 0.42, 0.5], pos: [x, -1.7, 1.5 + d * 0.45], r: 0.12,
      shade: 1.35 }
  ];
}

/* A paper roll sitting in an open bay: two flanges and the roll itself. */
function roll(x, r, len) {
  return [
    { shape: "cyl", size: [r, len], pos: [x, 0.6, -0.2], rot: [0, 0, P2], seg: 24, shade: 1.0 },
    { shape: "cyl", size: [r * 0.28, len + 0.5], pos: [x, 0.6, -0.2], rot: [0, 0, P2],
      seg: 12, shade: 0.62 }
  ];
}

/* Fanfold paper: a stack of sheets with the sprocket holes down each
   edge, which is the thing that names an impact printer at a glance. */
function fanfold(x) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    out.push({ shape: "box", size: [7.4, 0.16, 4.2], pos: [x, -2.5 + i * 0.2, -8.4 - i * 0.14],
      r: 0.02, shade: 1.0 });
  }
  /* the holes, as dark pips down both margins */
  for (let i = 0; i < 9; i++) {
    out.push({ shape: "cyl", size: [0.16, 0.2], pos: [x - 3.5, -1.05, -6.5 - i * 0.42],
      seg: 8, shade: 0.35 });
    out.push({ shape: "cyl", size: [0.16, 0.2], pos: [x + 3.5, -1.05, -6.5 - i * 0.42],
      seg: 8, shade: 0.35 });
  }
  return out;
}

/* ---- the six machines -------------------------------------------- */

function laserBody(x) {
  return shell(x, 10.5, 8.4, 9.0, 1.0).concat([
    /* the toner hatch on the front, hinged at the bottom */
    { shape: "rbox", size: [8.4, 3.4, 0.5], pos: [x, 1.4, 4.6], r: 0.15, shade: 1.25 },
    /* a stack of paper waiting on the top shelf */
    { shape: "box", size: [7.0, 0.5, 5.0], pos: [x, 5.5, 0.6], r: 0.03, shade: 1.9 }
  ]);
}
function laserFeature(x) { return cassette(x, 10.5, 9.0); }

function inkjetBody(x) {
  return shell(x, 9.2, 5.6, 8.4, 0.86).concat([
    /* the scanner lid, lifted, which is what makes it an all-in-one */
    { shape: "rbox", size: [9.0, 0.6, 7.6], pos: [x, 3.6, -1.2], rot: [-0.42, 0, 0], r: 0.2,
      shade: 1.1 },
    /* the paper support standing up at the back */
    { shape: "box", size: [7.4, 4.0, 0.3], pos: [x, 3.6, -3.9], rot: [0.35, 0, 0], r: 0.1,
      shade: 1.0 },
    /* the output tray pulled out at the front */
    { shape: "box", size: [7.6, 0.35, 3.4], pos: [x, -0.9, 5.2], r: 0.1, shade: 1.15 }
  ]);
}
function inkjetFeature(x) {
  /* the carriage and its cartridges, on the rail */
  return [
    { shape: "cyl", size: [0.32, 8.0], pos: [x, 1.9, 0.4], rot: [0, 0, P2], seg: 12, shade: 0.8 },
    { shape: "rbox", size: [3.0, 1.6, 1.8], pos: [x - 1.0, 2.1, 0.4], r: 0.2, shade: 1.0 },
    { shape: "rbox", size: [1.3, 1.9, 1.5], pos: [x - 1.9, 2.6, 0.4], r: 0.15, shade: 1.3 },
    { shape: "rbox", size: [1.3, 1.9, 1.5], pos: [x - 0.2, 2.6, 0.4], r: 0.15, shade: 1.3 }
  ];
}

function thermalBodyS(x) {
  return shell(x, 6.6, 5.0, 6.4, 1.12).concat([
    /* the lid, open, so the roll bay is visible — which is the point */
    { shape: "rbox", size: [6.4, 0.5, 4.6], pos: [x, 3.4, -1.6], rot: [-0.55, 0, 0], r: 0.15,
      shade: 1.3 },
    /* the label that has just come out */
    { shape: "box", size: [4.2, 0.12, 2.6], pos: [x, 0.6, 4.4], rot: [-0.18, 0, 0], r: 0.02,
      shade: 1.95 }
  ]);
}
function thermalFeature(x) {
  /* THE ROLL SITS UP IN THE OPEN BAY, not down inside the shell. Drawn
     at the body's centre height it was completely enclosed — the
     visibility instrument measured ONE pixel of it across the whole
     bench. The lid is open on this machine precisely so the roll can be
     seen and changed, so that is where it goes. */
  return roll(x, 2.0, 5.2).map(function (o) {
    return Object.assign({}, o, { pos: [o.pos[0], o.pos[1] + 2.1, o.pos[2] - 0.9] });
  }).concat([
    { shape: "box", size: [5.4, 0.3, 0.45], pos: [x, 2.2, 3.3], r: 0.05, shade: 1.5 }
  ]);
}

function transferBody(x) {
  return shell(x, 7.0, 5.4, 6.4, 0.94).concat([
    { shape: "rbox", size: [6.8, 0.5, 4.6], pos: [x, 3.7, -1.6], rot: [-0.55, 0, 0], r: 0.15,
      shade: 1.3 },
    { shape: "box", size: [4.4, 0.12, 2.6], pos: [x, 0.7, 4.4], rot: [-0.18, 0, 0], r: 0.02,
      shade: 1.95 }
  ]);
}
function transferFeature(x) {
  /* THE WHOLE DIFFERENCE FROM PLAIN THERMAL, and it is one part: a
     ribbon spool above the head, feeding onto a take-up spool. Without
     it the machine burns heat-sensitive paper and the print fades;
     with it, it melts a ribbon onto ordinary stock and the print lasts.
     A student who spots this spool has answered the question. */
  return roll(x, 1.5, 4.6).concat([
    { shape: "cyl", size: [0.85, 5.0], pos: [x - 1.5, 3.3, -0.4], rot: [0, 0, P2], seg: 18,
      shade: 1.0 },
    { shape: "cyl", size: [1.25, 5.0], pos: [x + 1.6, 3.3, -0.4], rot: [0, 0, P2], seg: 18,
      shade: 1.0 },
    /* the ribbon itself, stretched between them */
    { shape: "box", size: [3.1, 0.08, 4.6], pos: [x + 0.05, 3.95, -0.4], rot: [0.06, 0, 0],
      r: 0.01, shade: 1.4 }
  ]);
}

function impactBody(x) {
  return shell(x, 11.0, 4.6, 7.6, 1.0).concat([
    /* the clear lid over the carriage */
    { shape: "rbox", size: [9.4, 0.4, 4.6], pos: [x, 2.1, 0.4], r: 0.15, shade: 1.28 },
    /* the head on its rail */
    { shape: "cyl", size: [0.3, 9.0], pos: [x, 1.2, 1.6], rot: [0, 0, P2], seg: 12, shade: 0.72 },
    { shape: "rbox", size: [2.0, 1.3, 1.6], pos: [x - 2.2, 1.4, 1.6], r: 0.2, shade: 0.85 }
  ]).concat(fanfold(x));
}
function impactFeature(x) {
  /* the tractor sprockets, which is what a dot matrix has and nothing
     else on this shelf does */
  const out = [];
  /* BEHIND THE SHELL, WHERE THE PAPER COMES IN. At z -2.4 they were
     inside a body 7.6 deep and painted two pixels. The tractors on a
     real dot matrix stand at the back, gripping the fanfold before it
     reaches the platen — which is both the honest place and the visible
     one. */
  [-4.2, 4.2].forEach(function (dx) {
    out.push({ shape: "cyl", size: [1.15, 1.6], pos: [x + dx, 1.0, -4.9], rot: [0, 0, P2],
      seg: 16, shade: 1.0 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      out.push({ shape: "box", size: [1.7, 0.3, 0.3],
        pos: [x + dx, 1.0 + Math.sin(a) * 1.2, -4.9 + Math.cos(a) * 1.2],
        rot: [P2 - a, 0, 0], r: 0.04, shade: 1.4 });
    }
  });
  return out;
}

function dyesubBody(x) {
  return shell(x, 6.2, 4.6, 6.0, 0.9).concat([
    /* a photo on the output shelf, because that is what it is for */
    { shape: "box", size: [3.4, 0.14, 2.4], pos: [x, 0.5, 4.2], rot: [-0.2, 0, 0], r: 0.02,
      shade: 1.85 }
  ]);
}
function dyesubFeature(x) {
  /* the ribbon cassette — the panelled dye ribbon it lays down one
     colour at a time — and its own coated media */
  return [
    /* PULLED OUT AT THE FRONT. Inside the shell it painted two pixels,
       and a dye-sub cassette is a front-loading drawer anyway — so this
       is both the visible place and the true one. */
    { shape: "rbox", size: [5.0, 1.5, 2.4], pos: [x, 0.4, 4.3], r: 0.2, shade: 1.0 },
    { shape: "cyl", size: [0.6, 4.6], pos: [x - 1.2, 0.4, 4.3], rot: [0, 0, P2], seg: 14,
      shade: 1.35 },
    { shape: "cyl", size: [0.6, 4.6], pos: [x + 1.2, 0.4, 4.3], rot: [0, 0, P2], seg: 14,
      shade: 1.35 },
    /* its own coated stock, stacked behind the machine */
    { shape: "box", size: [4.2, 0.6, 3.0], pos: [x, -2.4, -4.6], r: 0.05, shade: 1.6 }
  ];
}

/* ---- the table --------------------------------------------------- */

const MACHINES = [
  { key: "laser", name: "Laser", col: 0, row: 0,
    body: laserBody, bodyColor: "#a8b0b8",
    feature: laserFeature, featureColor: "#9aa4ae", featureName: "its paper cassette",
    says: "A heavy body, a big cassette drawer underneath and a toner hatch on the front." },
  { key: "inkjet", name: "Inkjet", col: 1, row: 0,
    body: inkjetBody, bodyColor: "#31527e",
    feature: inkjetFeature, featureColor: "#7f8b97", featureName: "its cartridge carriage",
    says: "A scanner lid on top, a paper support standing up at the back, and cartridges " +
      "riding on a carriage." },
  { key: "thermal", name: "Thermal", col: 0, row: 1,
    body: thermalBodyS, bodyColor: "#2c5b4b",
    feature: thermalFeature, featureColor: "#a79bb0", featureName: "its paper roll and tear bar",
    says: "Small, a roll sitting in an open bay, a tear bar at the front — and no ribbon " +
      "anywhere on it." },
  { key: "thermaltx", name: "Thermal transfer", col: 1, row: 1,
    body: transferBody, bodyColor: "#2c5b4b",
    feature: transferFeature, featureColor: "#b1a07c", featureName: "its ribbon spools",
    says: "The same machine as the one beside it, with one thing added: a ribbon spool over " +
      "the head. That is the whole difference, and it decides whether the print lasts." },
  { key: "impact", name: "Impact (dot matrix)", col: 2, row: 0,
    body: impactBody, bodyColor: "#4e3557",
    feature: impactFeature, featureColor: "#93a0ac", featureName: "its tractor sprockets",
    says: "Wide and low, fanfold paper with sprocket holes behind it, and a head that strikes " +
      "the page through a ribbon." },
  { key: "dyesub", name: "Dye sublimation", col: 2, row: 1,
    body: dyesubBody, bodyColor: "#6b3230",
    feature: dyesubFeature, featureColor: "#a3969f", featureName: "its dye ribbon cassette",
    says: "Small, with a panelled dye ribbon in a cassette and its own coated stock. It lays " +
      "one colour at a time onto paper it has to be sold with." }
];

/* =====================================================================
   TWO THINGS THIS STAGE CANNOT BE ALLOWED TO LOSE

   Both were broken, both silently, and neither would have shown up in any
   check that existed — the bench mounted, every part was generated, every
   label was in words, and the whole thing passed. A stage can be entirely
   correct and still not teach the thing it exists to teach.
   ===================================================================== */

/* 1. DIRECT THERMAL AND THERMAL TRANSFER MUST BE NEXT TO EACH OTHER.

   Thermal transfer's own description reads "the same machine as the one
   beside it, with one thing added: a ribbon spool over the head. That is
   the whole difference." It was written for a side-by-side comparison and
   the layout had them in diagonally opposite corners of the grid, so the
   words promised a comparison the shelf did not offer. This is the most
   examinable distinction on the stage and it was the one the student could
   not actually make by looking.

   Adjacent means the same row and one column apart. Same column in
   different rows is NOT adjacent here: the rows are 17 units apart in
   depth and one is behind the other, so they are never seen side by side.

   2. THE SIX MACHINES MUST NOT ALL BE THE SAME COLOUR.

   They were: six dark blue-greys inside 16 levels of red, 9 of green and 5
   of blue of one another. On a stage whose entire job is "tell these
   apart", and for students whose sight is damaged, identification had been
   quietly reduced to process of elimination.

   The exception is deliberate and is checked for separately: direct
   thermal and thermal transfer SHARE a casing colour, because they are the
   same machine and the ribbon is the only difference. Giving them
   different colours would hand over the answer without the student ever
   looking at the head. */
(function () {
  var t = null, tx = null;
  MACHINES.forEach(function (m) {
    if (m.key === "thermal") t = m;
    if (m.key === "thermaltx") tx = m;
  });
  if (!t || !tx) {
    throw new Error("showroom: the thermal pair is the point of this stage and one of " +
      "them is missing from MACHINES.");
  }
  if (t.row !== tx.row || Math.abs(t.col - tx.col) !== 1) {
    throw new Error("showroom: direct thermal is at col " + t.col + " row " + t.row +
      " and thermal transfer at col " + tx.col + " row " + tx.row + ". They must be in " +
      "the same row and one column apart, because thermal transfer's own text says " +
      '"the same machine as the one beside it".');
  }
  if (t.bodyColor !== tx.bodyColor) {
    throw new Error("showroom: the thermal pair must SHARE a casing colour (" +
      t.bodyColor + " vs " + tx.bodyColor + "). Different colours tell the student " +
      "which is which without them ever looking for the ribbon.");
  }
  /* Every other pair has to be tellable apart. Compared in plain channel
     distance rather than by eye, because "these look different to me" on a
     large bright monitor is exactly the judgement this build cannot rely
     on. 60 is roughly the point at which two casings stop reading as the
     same box under this bench's soft lighting. */
  var hex = function (h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)];
  };
  for (var i = 0; i < MACHINES.length; i++) {
    for (var j = i + 1; j < MACHINES.length; j++) {
      var a = MACHINES[i], b = MACHINES[j];
      if (a.bodyColor === b.bodyColor) continue;      /* the thermal pair */
      var A = hex(a.bodyColor), B = hex(b.bodyColor);
      var d = Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2]);
      if (d < 60) {
        throw new Error("showroom: " + a.name + " (" + a.bodyColor + ") and " + b.name +
          " (" + b.bodyColor + ") are only " + d + " apart. Six machines a student has " +
          "to tell apart cannot all be the same dark grey.");
      }
    }
  }
})();

export const SHOWROOM = MACHINES.map(function (m) {
  return { key: m.key, name: m.name, says: m.says, featureName: m.featureName };
});

/* =====================================================================
   The bench.

   `view.marked` may name one machine to light up — used only AFTER the
   student has answered, never while the question is live. Nothing here
   marks the correct one on its own: a showroom that points at the answer
   is a catalogue, not a question.
   ===================================================================== */
export function showroomBench(view) {
  view = view || {};
  const parts = [];

  MACHINES.forEach(function (m) {
    const x = COL[m.col];
    /* row 0 is the BACK row, row 1 the front, so the front row is the
       one nearest the camera and nothing has to be reasoned about
       twice. */
    const dz = m.row === 0 ? -ROW_GAP / 2 : ROW_GAP / 2;
    const lit = view.marked === m.key;
    parts.push({
      key: m.key, label: m.name,
      build: atRow(m.body(x), dz), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: m.bodyColor,
      spec: m.says,
      note: lit ? "This is the one this job needs." : ""
    });
    /* The deciding feature is its own part, in its own colour, because
       it is the thing the student is being asked to notice — and because
       one colour per part means a feature that shares the body's colour
       cannot be seen at all. */
    parts.push({
      key: m.key + "-feature", label: m.name + " — " + m.featureName,
      build: atRow(m.feature(x), dz), finish: "metal", scale: 1, pos: [0, 0, 0],
      color: lit ? "#d7c98a" : m.featureColor,
      spec: m.featureName.charAt(0).toUpperCase() + m.featureName.slice(1) + ".",
      note: ""
    });
    /* A name plate under each, so the shelf is readable with WebGL off
       and so nobody has to guess which box is which. */
    parts.push({
      key: m.key + "-plate", label: m.name + " — name plate",
      build: atRow([{ shape: "rbox", size: [11.0, 0.4, 2.2], pos: [x, -3.4, 7.2], r: 0.1, shade: 1.0 }], dz),
      finish: "matte", scale: 1, pos: [0, 0, 0],
      color: lit ? "#2f6f4a" : "#2b333d",
      spec: m.name + ".", note: ""
    });
  });

  return {
    kind: "bench",
    title: "Six machines on the shelf",
    caption: "Same scale, side by side. Each one carries the feature that decides whether it " +
      "suits the job — a cassette, a carriage, a roll, a ribbon spool, a sprocket, a dye " +
      "cassette. Read the brief, then look for the machine that has what the brief asked for.",
    board: {
      size: [BOARD_W, 0.5, BOARD_D], pos: [0, -3.7, 0], color: "#2a323b",
      build: [{ shape: "rbox", size: [BOARD_W, 0.5, BOARD_D], pos: [0, 0, 0], r: 0.15, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth is the world width the shelf must always show, measured
       against frustumOK rather than guessed, with the margin every other
       bench needed: a part's bounding sphere is wider than the part, and
       anything in front of the board's centre projects wider still. */
    camera: { dist: 46, fitWidth: BOARD_W * 1.30, yaw: 0.10, pitch: CAM_PITCH,
      target: [0, 0.6, -1.0], min: 16, max: 140 }
  };
}
