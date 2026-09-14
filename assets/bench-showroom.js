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
const TALLEST = 9.9;   /* the inkjet with its paper support standing up */
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

/* ---- the pieces every office machine is made of -----------------

   REBUILT FROM THE OWNER'S FIVE PHOTOGRAPHS. What was here before was a
   single `shell()` — one rounded box plus a recessed well — used by all
   six machines, so the shelf was one shape at six sizes and the owner
   said so: "This is ugly and not professional." The measurement agreed:
   96 primitives for all six, against 125 for the laser cutaway and 571
   for the handset stack.

   These helpers are the things that are TRUE OF EVERY MACHINE IN THE
   PHOTOGRAPHS and were on none of them before: a case with a real panel
   seam round it, feet, a vent, a recessed control panel with a screen
   and buttons, a paper tray that folds down and out with a stack on it.
   A machine is then its own silhouette plus these. */

/* THE SEAM IS THE FIRST THING THAT MAKES A BOX READ AS EQUIPMENT.

   Every machine in the photographs is moulded in two or three pieces and
   the join shows as a fine dark line all the way round. Without it a
   rounded box is a bar of soap, which is exactly what the old shelf
   looked like. Drawn as four thin bars rather than one — material is
   absent only where nothing is drawn, and a seam is a GAP between
   panels. */
function seam(x, y, w, d, t) {
  t = t || 0.12;
  return [
    { shape: "box", size: [w + 0.04, t, 0.06], pos: [x, y, d / 2], r: 0.01, shade: 0.34 },
    { shape: "box", size: [w + 0.04, t, 0.06], pos: [x, y, -d / 2], r: 0.01, shade: 0.34 },
    { shape: "box", size: [0.06, t, d + 0.04], pos: [x - w / 2, y, 0], r: 0.01, shade: 0.34 },
    { shape: "box", size: [0.06, t, d + 0.04], pos: [x + w / 2, y, 0], r: 0.01, shade: 0.34 }
  ];
}

/* FOUR FEET. Nothing in the photographs sits flat on the desk — every
   machine stands on rubber feet with a shadow gap under it, and that gap
   is a surprising amount of why a render reads as an object on a surface
   rather than a decal printed on it. */
function feet(x, w, d, y) {
  const out = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    out.push({ shape: "cyl", size: [0.55, 0.42],
      pos: [x + c[0] * (w / 2 - 0.9), y + 0.21, c[1] * (d / 2 - 0.9)], seg: 10, shade: 0.42 });
  });
  return out;
}

/* A VENT: louvres, as the bars BETWEEN the slots.

   The laser has a column of them down its right side panel and the
   inkjet has them low on the back. Drawn as the material left behind,
   never as a dark rectangle painted on a wall — the painted-hole mistake
   this repo has now made three times and recorded each time. */
function vent(x, y, z, n, len, axis) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 0.38;
    if (axis === "x") {
      out.push({ shape: "box", size: [0.10, 0.20, len], pos: [x, y + o, z], r: 0.02, shade: 0.46 });
    } else {
      out.push({ shape: "box", size: [len, 0.20, 0.10], pos: [x + o, y, z], r: 0.02, shade: 0.46 });
    }
  }
  return out;
}

/* A CONTROL PANEL: a recessed bezel, a screen sunk into it, and real
   buttons standing proud.

   Every one of the five photographs has one and the old shelf had none.
   Where it sits is itself a tell — flat on the TOP of the laser, angled
   on the FRONT of the inkjet, small and vertical on the front of the
   label printers, front-right on the dot matrix — so the caller places
   it and this only builds it.

   `lay` is "flat" for a panel lying on a top face and "up" for one
   standing on a front face; it decides which way the screen and the
   buttons face, which is the thing that goes wrong if it is guessed. */
function panel(x, y, z, w, dep, lay, rows) {
  const flat = lay === "flat";
  const out = [];
  /* the recessed bezel the whole thing sits in */
  out.push({ shape: "rbox", size: [w, flat ? 0.22 : dep, flat ? dep : 0.22],
    pos: [x, y, z], r: 0.08, shade: 0.58 });
  /* the screen, sunk, and DARKER than the bezel — an LCD that is not lit
     is the darkest thing on the panel, and the one in the thermal
     photograph is a small dark window with pale text in it */
  const sw = w * 0.46, sd = dep * 0.5;
  out.push({ shape: "rbox", size: [sw, flat ? 0.16 : sd, flat ? sd : 0.16],
    pos: [x - w * 0.2, y + (flat ? 0.10 : 0.0), z + (flat ? 0.0 : 0.10)], r: 0.05, shade: 0.30 });
  /* the buttons, in a row or two */
  /* THE BUTTONS WERE ALL IN ONE PLACE. The offset was multiplied by 0.5
     on one axis and by ZERO on the other, so four buttons landed on top
     of each other and the panel rendered as a dark rectangle with one
     pip on it — which is exactly what the first render showed and what
     reading the source would never have said. They are spread along the
     panel now, clear of the screen. */
  const n = rows || 4, step = (w * 0.44) / Math.max(1, n - 1);
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * step;
    out.push({ shape: "cyl", size: [0.26, 0.20],
      pos: [x + w * 0.26 + o, y + (flat ? 0.16 : 0.0), z + (flat ? 0.0 : 0.16)],
      rot: flat ? [0, 0, 0] : [P2, 0, 0], seg: 10, shade: 1.55 });
  }
  return out;
}

/* THE PAPER TRAY, FOLDED DOWN AND OUT, WITH A STACK ON IT.

   In the laser photograph this is the single most prominent thing on the
   machine: a tray standing well proud of the front with white paper on
   it catching the light. The old model had a 1.6-unit lip. Paper is the
   brightest thing in every one of these photographs and it is what says
   "this machine is loaded and working". */
function tray(x, y, z, w, out_d, sheets) {
  const out = [
    /* the tray itself, tilted very slightly down and out */
    { shape: "rbox", size: [w, 0.30, out_d], pos: [x, y, z + out_d / 2], rot: [-0.05, 0, 0],
      r: 0.10, shade: 1.15 },
    /* the raised edge that stops the stack sliding off */
    { shape: "box", size: [w, 0.45, 0.22], pos: [x, y + 0.24, z + out_d], r: 0.05, shade: 1.30 }
  ];
  if (sheets !== false) {
    out.push({ shape: "box", size: [w * 0.86, 0.42, out_d * 0.82],
      pos: [x, y + 0.36, z + out_d * 0.52], rot: [-0.05, 0, 0], r: 0.02, shade: 2.0 });
  }
  return out;
}

/* Everything stands on the board at this height. One constant, because
   six machines and their feet, trays and paper all have to agree about
   where the desk is — three separate guesses is how a tray ends up
   floating. */
const BASE = -3.0;

/* A paper roll on its spindle: the roll, the core showing at the end,
   and the spindle through it. */
function roll(x, y, z, rad, len) {
  return [
    { shape: "cyl", size: [rad, len], pos: [x, y, z], rot: [0, 0, P2], seg: 26, shade: 1.9 },
    { shape: "cyl", size: [rad * 0.30, len + 0.30], pos: [x, y, z], rot: [0, 0, P2], seg: 14, shade: 0.55 },
    { shape: "cyl", size: [rad * 0.12, len + 1.6], pos: [x, y, z], rot: [0, 0, P2], seg: 10, shade: 0.72 }
  ];
}

/* Fanfold paper: a stack of sheets with the sprocket holes down each
   edge, which is the thing that names an impact printer at a glance.
   Now with the FOLDS showing — in the photograph the sheet coming out of
   the front lies on the desk in a shallow concertina, and a flat slab
   does not read as continuous stationery at all. */
function fanfold(x, z0) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    out.push({ shape: "box", size: [8.2, 0.14, 2.1],
      pos: [x, BASE + 0.10 + (i % 2) * 0.16, z0 + i * 1.9],
      rot: [(i % 2 ? -1 : 1) * 0.05, 0, 0], r: 0.02, shade: 2.0 });
  }
  /* the holes, as dark pips down both margins — a real continuous run,
     not a handful, because the pitch is what the eye recognises */
  for (let i = 0; i < 8; i++) {
    [-3.85, 3.85].forEach(function (dx) {
      out.push({ shape: "cyl", size: [0.15, 0.22], pos: [x + dx, BASE + 0.26, z0 + i * 0.95],
        seg: 8, shade: 0.30 });
    });
  }
  return out;
}

/* ---- the six machines --------------------------------------------

   Each one is its OWN silhouette. That is the whole correction: the old
   shelf ran every machine through one `shell()` helper, so a laser, an
   all-in-one and a label printer were the same rounded box at three
   sizes, and the stage asked students to tell apart objects that were
   deliberately identical.

   The proportions below are read off the owner's photographs — squat and
   wide for the laser, tall and boxy for the all-in-one, small and deep
   for the label printers, wide and low for the dot matrix.
   --------------------------------------------------------------------- */

/* ---- 1. THE DESKTOP LASER ----------------------------------------
   Two-tone in the photograph: a graphite upper shell over a silver-grey
   lower case, squat, wider than it is deep. The panel lies FLAT on the
   top face — which is itself a tell, because a machine you look down at
   is a machine that sits below eye level on a desk. */
function laserBody(x) {
  const w = 11.0, h = 7.2, d = 9.4;
  const y0 = BASE, top = y0 + h;
  const out = [
    /* the lower case */
    { shape: "rbox", size: [w, h * 0.52, d], pos: [x, y0 + h * 0.26, 0], r: 0.24, shade: 1.0 },
    /* the upper shell, GRAPHITE — the same part at a much lower shade,
       because it is the same moulding family and only the colour of the
       plastic changes */
    { shape: "rbox", size: [w - 0.25, h * 0.50, d - 0.25], pos: [x, y0 + h * 0.75, 0], r: 0.26, shade: 0.42 },
    /* the output well pressed into the top, and the paper stop that
       stands up at the back of it */
    { shape: "rbox", size: [w - 3.4, 0.9, d - 3.6], pos: [x, top - 0.25, 0.5], r: 0.22, shade: 0.30 },
    { shape: "box", size: [w - 4.6, 0.9, 0.22], pos: [x, top + 0.30, -d / 2 + 2.6], rot: [0.22, 0, 0], r: 0.05, shade: 0.55 },
    /* a sheet lying in the well, because every photograph has paper in it */
    { shape: "box", size: [w - 4.4, 0.18, d - 4.6], pos: [x, top + 0.02, 0.6], r: 0.02, shade: 2.0 },
    /* the front door line: the laser's front folds down, and the join is
       a real step rather than a painted line */
    { shape: "rbox", size: [w - 1.0, h * 0.30, 0.35], pos: [x, y0 + h * 0.22, d / 2 + 0.04], r: 0.10, shade: 0.86 },
    /* the badge on the front */
    { shape: "box", size: [2.1, 0.32, 0.10], pos: [x - w * 0.22, y0 + h * 0.34, d / 2 + 0.24], r: 0.03, shade: 1.6 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.52, w, d))
    .concat(vent(x + w / 2 + 0.02, y0 + h * 0.30, 0, 7, 2.6, "x"))
    .concat(panel(x + w * 0.20, top + 0.16, d / 2 - 1.7, 4.2, 1.9, "flat", 4))
    .concat(feet(x, w, d, y0 - 0.42));
}
/* THE TRAY IS THE FEATURE, and in the photograph it is the most
   prominent thing on the machine: folded down and standing well proud of
   the front with a stack of white paper on it. The old model gave it a
   1.6-unit lip. */
function laserFeature(x) {
  return tray(x, BASE + 1.05, 9.4 / 2 - 0.2, 8.4, 4.6, true);
}

/* ---- 2. THE INKJET ALL-IN-ONE ------------------------------------
   Tall and boxy where the laser is squat, black, with the hinged scanner
   lid that makes it an all-in-one and the paper support standing UP at
   the back. The tell in this photograph is the block of four external
   INK TANKS behind a window on the front right. */
function inkjetBody(x) {
  const w = 10.2, h = 8.4, d = 9.2;
  const y0 = BASE, top = y0 + h;
  const out = [
    { shape: "rbox", size: [w, h, d], pos: [x, y0 + h / 2, 0], r: 0.24, shade: 1.0 },
    /* the scanner lid, proud all round, with its grab recess at the front */
    { shape: "rbox", size: [w - 0.2, 1.0, d - 0.5], pos: [x, top + 0.45, -0.1], r: 0.20, shade: 1.28 },
    { shape: "box", size: [3.0, 0.30, 0.45], pos: [x, top + 0.30, d / 2 - 0.5], r: 0.08, shade: 0.70 },
    /* the hinge at the back */
    { shape: "cyl", size: [0.45, w - 2.4], pos: [x, top + 0.50, -d / 2 + 0.55], rot: [0, 0, P2], seg: 12, shade: 0.60 },
    /* THE PAPER SUPPORT, STANDING UP AT THE BACK. In the photograph it is
       open and tilted back, and it is a large part of the silhouette —
       this machine is unmistakably taller than everything else on the
       shelf because of it. */
    { shape: "rbox", size: [w - 3.4, 3.2, 0.20], pos: [x, top + 2.3, -d / 2 + 0.2], rot: [0.30, 0, 0], r: 0.06, shade: 1.12 },
    { shape: "box", size: [w - 3.4, 0.22, 0.30], pos: [x, top + 3.8, -d / 2 - 0.25], rot: [0.30, 0, 0], r: 0.04, shade: 0.62 },
    /* the two side guides that slide in and out on it — without them a
       paper support is a flat card and reads as a screen, which is what
       the first render showed */
    { shape: "box", size: [0.24, 2.6, 0.34], pos: [x - (w - 3.4) / 2 + 0.3, top + 2.3, -d / 2 + 0.30], rot: [0.30, 0, 0], r: 0.04, shade: 0.72 },
    { shape: "box", size: [0.24, 2.6, 0.34], pos: [x + (w - 3.4) / 2 - 0.3, top + 2.3, -d / 2 + 0.30], rot: [0.30, 0, 0], r: 0.04, shade: 0.72 },
    /* the silver trim band across the front under the lid */
    { shape: "box", size: [w - 0.6, 0.34, 0.14], pos: [x, top - 0.65, d / 2 + 0.03], r: 0.04, shade: 1.7 },
    /* the front door the tanks live behind, as a real step */
    { shape: "rbox", size: [w * 0.34, h * 0.40, 0.30], pos: [x + w * 0.30, y0 + h * 0.36, d / 2 + 0.05], r: 0.10, shade: 0.86 },
    /* the USB host port on the front left — a genuine recess */
    { shape: "box", size: [0.85, 0.40, 0.30], pos: [x - w * 0.36, y0 + h * 0.52, d / 2 + 0.06], r: 0.04, shade: 0.34 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.62, w, d))
    .concat(vent(x - w * 0.10, y0 + 0.9, -d / 2 - 0.02, 6, 3.0, "z"))
    /* the touchscreen, ANGLED, on the front right — bigger and brighter
       than any other panel on the shelf, which is what a modern
       all-in-one actually looks like */
    .concat([{ shape: "rbox", size: [4.0, 0.34, 2.6], pos: [x + w * 0.16, top - 1.15, d / 2 - 1.5],
               rot: [-0.62, 0, 0], r: 0.12, shade: 0.55 },
             { shape: "rbox", size: [3.4, 0.20, 2.0], pos: [x + w * 0.16, top - 0.98, d / 2 - 1.35],
               rot: [-0.62, 0, 0], r: 0.08, shade: 2.0 }])
    .concat(feet(x, w, d, y0 - 0.42));
}
function inkjetFeature(x) {
  const w = 10.2, d = 9.2;
  /* the output tray, out at the front with a printed sheet on it */
  return tray(x - 0.6, BASE + 1.25, d / 2 - 0.1, 7.0, 4.0, true);
}
/* ---- 3. THE DIRECT THERMAL LABEL PRINTER -------------------------
   Small, dark, and built round a clamshell that opens upward — the
   photograph shows the seam running all the way round it. A label is
   coming out of the front slot with a barcode on it, and there are three
   LABELLED buttons in a column on the front right with an indicator
   beside the bottom one.

   AND NOTHING IN THE MEDIA PATH BUT PAPER. That absence is the question
   this whole stage turns on, so it is drawn as an absence: the machine
   next to it has a spool where this one has nothing. */
function thermalBodyS(x) {
  const w = 6.8, h = 6.4, d = 8.4;
  const y0 = BASE, top = y0 + h;
  const out = [
    /* the base */
    { shape: "rbox", size: [w, h * 0.46, d], pos: [x, y0 + h * 0.23, 0], r: 0.22, shade: 1.0 },
    /* the clamshell lid, closed, with its hinge ridge at the back */
    { shape: "rbox", size: [w - 0.1, h * 0.56, d - 0.3], pos: [x, y0 + h * 0.72, -0.1], r: 0.28, shade: 1.14 },
    { shape: "cyl", size: [0.40, w - 1.6], pos: [x, top - 0.55, -d / 2 + 0.55], rot: [0, 0, P2], seg: 12, shade: 0.58 },
    /* THE EXIT SLOT, as a real gap: a lip above and a lip below with air
       between them, never a dark rectangle painted on the front */
    { shape: "box", size: [w - 1.4, 0.30, 0.34], pos: [x, y0 + h * 0.50, d / 2 + 0.02], r: 0.05, shade: 0.72 },
    { shape: "box", size: [w - 1.4, 0.30, 0.34], pos: [x, y0 + h * 0.40, d / 2 + 0.02], r: 0.05, shade: 0.72 },
    /* the tear edge, serrated enough to read */
    { shape: "box", size: [0.22, 0.16, 0.30], pos: [x - w / 2 + 0.85, y0 + h * 0.455, d / 2 + 0.20],
      r: 0.02, shade: 1.6, repeat: { count: 13, step: [0.40, 0, 0] } },
    /* the badge band across the front */
    { shape: "box", size: [w - 2.2, 0.36, 0.10], pos: [x, y0 + h * 0.72, d / 2 + 0.20], r: 0.03, shade: 1.7 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.46, w, d))
    /* THE PANEL IS A COLUMN, NOT A ROW — that is what the photograph
       shows and it is the opposite of every other machine here. The
       screen sits above three labelled buttons with an indicator by the
       bottom one. */
    .concat([{ shape: "rbox", size: [1.9, 1.1, 0.24], pos: [x + w * 0.24, y0 + h * 0.76, d / 2 + 0.16], r: 0.06, shade: 0.34 }])
    .concat([{ shape: "cyl", size: [0.26, 0.18], pos: [x + w * 0.26, y0 + h * 0.60, d / 2 + 0.16],
               rot: [P2, 0, 0], seg: 10, shade: 1.5, repeat: { count: 3, step: [0, -0.62, 0] } }])
    .concat(feet(x, w, d, y0 - 0.42));
}
function thermalFeature(x) {
  const w = 6.8, h = 6.4, d = 8.4, y0 = BASE;
  /* THE LABEL, COMING OUT AND CURLING. In the photograph it stands out
     of the slot and falls forward, and it carries a barcode — which is
     what a direct thermal printer is FOR, and is drawn as real bars
     because a grey rectangle says nothing. */
  const out = [
    { shape: "box", size: [w - 1.8, 0.10, 3.4], pos: [x, y0 + h * 0.44, d / 2 + 1.7], rot: [0.30, 0, 0], r: 0.02, shade: 2.0 }
  ];
  for (let i = 0; i < 11; i++) {
    out.push({ shape: "box", size: [0.10 + (i % 3) * 0.06, 0.06, 1.5],
      pos: [x - 1.9 + i * 0.38, y0 + h * 0.44 + 0.10, d / 2 + 1.5], rot: [0.30, 0, 0], r: 0.01, shade: 0.22 });
  }
  return out;
}

/* ---- 4. THE THERMAL TRANSFER LABEL PRINTER -----------------------
   THE SAME MACHINE AS THE ONE BESIDE IT, WITH THE LID OPEN AND A RIBBON
   IN IT. The photograph is shot with the clamshell raised, and that is
   the honest way to draw it: the whole difference lives inside, and a
   closed machine hides the one thing the student is being asked to find.
   Same casing colour as its neighbour, by the rule below. */
function transferBody(x) {
  const w = 7.2, h = 6.6, d = 8.6;
  const y0 = BASE, top = y0 + h;
  const out = [
    { shape: "rbox", size: [w, h * 0.50, d], pos: [x, y0 + h * 0.25, 0], r: 0.22, shade: 1.0 },
    /* THE LID, HINGED UP AND BACK. The first render had it at -0.95 rad
       and a third of the way forward, which put a slab across the bay at
       eye level and hid the very thing the lid is open FOR. Swung
       further back and up, so the media path is genuinely open to the
       camera — this is the same correction the impact bench's ribbon
       cassette needed: draw it where a technician puts it to reach in. */
    { shape: "rbox", size: [w - 0.1, h * 0.30, d - 1.2], pos: [x, y0 + h * 1.02, -d * 0.86],
      rot: [-1.42, 0, 0], r: 0.24, shade: 1.14 },
    { shape: "cyl", size: [0.40, w - 1.6], pos: [x, y0 + h * 0.52, -d / 2 + 0.55], rot: [0, 0, P2], seg: 12, shade: 0.58 },
    /* the open bay walls, so the inside is a cavity and not a lid
       floating over a solid block */
    { shape: "box", size: [0.45, h * 0.34, d - 1.2], pos: [x - w / 2 + 0.25, y0 + h * 0.66, 0], r: 0.08, shade: 0.88 },
    { shape: "box", size: [0.45, h * 0.34, d - 1.2], pos: [x + w / 2 - 0.25, y0 + h * 0.66, 0], r: 0.08, shade: 0.88 },
    { shape: "box", size: [w - 1.0, h * 0.34, 0.45], pos: [x, y0 + h * 0.66, -d / 2 + 0.55], r: 0.08, shade: 0.80 },
    /* the exit slot at the front */
    { shape: "box", size: [w - 1.6, 0.30, 0.34], pos: [x, y0 + h * 0.46, d / 2 + 0.02], r: 0.05, shade: 0.72 },
    /* THE MEDIA ROLL, at the back of the bay, in the body's own part so
       it reads as paper rather than as part of the ribbon. */
    { shape: "cyl", size: [1.9, 4.8], pos: [x, y0 + h * 0.72, -d * 0.26], rot: [0, 0, P2], seg: 24, shade: 1.95 },
    { shape: "cyl", size: [0.60, 5.1], pos: [x, y0 + h * 0.72, -d * 0.26], rot: [0, 0, P2], seg: 14, shade: 0.55 },
    /* the media web running forward out of the machine */
    { shape: "box", size: [w - 2.4, 0.10, 3.0], pos: [x, y0 + h * 0.44, d / 2 + 1.5], rot: [0.26, 0, 0], r: 0.02, shade: 2.0 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.50, w, d))
    /* the panel is on the LEFT on this one, standing vertically —
       another thing the photograph settles and the old model guessed */
    .concat([{ shape: "rbox", size: [1.5, 1.9, 0.24], pos: [x - w * 0.28, y0 + h * 0.26, d / 2 + 0.16], r: 0.06, shade: 0.34 },
             { shape: "cyl", size: [0.22, 0.16], pos: [x - w * 0.28, y0 + h * 0.08, d / 2 + 0.16],
               rot: [P2, 0, 0], seg: 10, shade: 1.5, repeat: { count: 2, step: [0.60, 0, 0] } }])
    .concat(feet(x, w, d, y0 - 0.42));
}
function transferFeature(x) {
  const w = 7.2, h = 6.6, d = 8.6, y0 = BASE;
  /* THE WHOLE DIFFERENCE FROM PLAIN THERMAL, and it is what the
     photograph is of: a large media roll on a spindle at the back of the
     bay, a ribbon supply spool and a take-up spool over the head, and
     the ribbon stretched between them. A student who finds this spool
     has answered the question — so it is drawn big, drawn in its own
     colour, and drawn where the open lid actually lets you see it. */
  /* THE MEDIA ROLL MOVED TO THE BODY, and that is not tidying — it is the
     question. Both label printers take a roll; only ONE of them takes a
     RIBBON. Drawing the roll in the feature colour made the roll part of
     "the difference", which it is not, and a student hunting the
     difference would have been pointed at the wrong object.
 
     So the feature is now the ribbon and nothing else: two spools, the
     film between them, the head it passes under and the platen below.
     Lowered INTO the bay as well — at 0.86 of the body height they sat
     above the bay walls entirely, a mechanism hovering over an open box. */
  return ([].concat([
      { shape: "cyl", size: [1.05, 4.6], pos: [x - 1.4, y0 + h * 0.70, -d * 0.04], rot: [0, 0, P2], seg: 20, shade: 1.0 },
      { shape: "cyl", size: [0.58, 4.6], pos: [x + 1.7, y0 + h * 0.70, -d * 0.04], rot: [0, 0, P2], seg: 20, shade: 1.0 },
      /* the film between them, and down over the head */
      { shape: "box", size: [3.1, 0.05, 4.3], pos: [x + 0.15, y0 + h * 0.76, -d * 0.04], r: 0.01, shade: 1.35 },
      { shape: "box", size: [0.05, 1.6, 4.3], pos: [x + 1.1, y0 + h * 0.58, d * 0.10], rot: [-0.30, 0, 0], r: 0.01, shade: 1.35 }
    ])
    .concat([
      /* the print head bracket the ribbon runs under */
      { shape: "rbox", size: [4.8, 0.45, 0.9], pos: [x, y0 + h * 0.50, d * 0.18], r: 0.08, shade: 0.72 },
      /* the platen roller below it */
      { shape: "cyl", size: [0.85, 4.4], pos: [x, y0 + h * 0.40, d * 0.18], rot: [0, 0, P2], seg: 18, shade: 0.55 }
    ]));
}

/* ---- 5. THE DOT MATRIX -------------------------------------------
   Cream, wide and low, with a SMOKED CLEAR LID over the carriage so the
   mechanism shows through it — which is the thing the photograph makes
   obvious and no description ever did. Tractor sprockets at both ends of
   the shaft, a paper bail across the back, and fanfold with sprocket
   holes coming out of the front and lying on the desk. */
function impactBody(x) {
  const w = 12.0, h = 5.0, d = 8.6;
  const y0 = BASE, top = y0 + h;
  const out = [
    { shape: "rbox", size: [w, h, d], pos: [x, y0 + h / 2, 0], r: 0.20, shade: 1.0 },
    /* the smoked lid, standing proud over the carriage well */
    { shape: "rbox", size: [w - 2.2, 0.9, d - 2.6], pos: [x, top + 0.30, -0.3], r: 0.30, shade: 0.45 },
    /* the well it covers, so there is somewhere for the mechanism to be */
    { shape: "rbox", size: [w - 2.8, 0.8, d - 3.2], pos: [x, top - 0.55, -0.3], r: 0.20, shade: 0.52 },
    /* the paper bail across the back */
    { shape: "cyl", size: [0.30, w - 3.6], pos: [x, top + 0.05, -d / 2 + 1.2], rot: [0, 0, P2], seg: 12, shade: 0.55 },
    /* the front exit lip the fanfold comes over */
    { shape: "box", size: [w - 2.0, 0.35, 0.50], pos: [x, y0 + 1.15, d / 2 + 0.10], r: 0.06, shade: 0.80 },
    /* the moulded rib block on the front left, which is what the
       photograph has where a modern machine would have nothing */
    { shape: "box", size: [0.18, 1.5, 0.16], pos: [x - w * 0.34, y0 + h * 0.52, d / 2 + 0.08],
      r: 0.03, shade: 0.72, repeat: { count: 7, step: [0.34, 0, 0] } },
    /* the badge */
    { shape: "box", size: [3.0, 0.34, 0.10], pos: [x - w * 0.24, y0 + h * 0.80, d / 2 + 0.16], r: 0.03, shade: 0.60 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.58, w, d))
    .concat(panel(x + w * 0.28, y0 + h * 0.56, d / 2 + 0.14, 3.4, 1.5, "up", 4))
    .concat(feet(x, w, d, y0 - 0.42));
}
function impactFeature(x) {
  const y0 = BASE, h = 5.0, d = 8.6;
  const out = [];
  /* THE TRACTOR SPROCKETS, which is what a dot matrix has and nothing
     else on this shelf does. Both ends of a shaft at the back, standing
     above the lid line so they are visible from the front three-quarter
     the camera actually uses. */
  /* THE SPROCKETS HAVE TO READ AS WHEELS, and in the first render they
     did not: 1.3 across and tucked down behind the lid line, they came
     out as two small grey clips on the back edge. They are the ONE thing
     a dot matrix has that nothing else on this shelf does, so they are
     drawn at the size they really are relative to the machine and moved
     UP and FORWARD of the lid so the camera can see them at all. */
  [-4.4, 4.4].forEach(function (dx) {
    out.push({ shape: "cyl", size: [1.95, 1.7], pos: [x + dx, y0 + h + 1.05, -d / 2 + 2.6],
      rot: [0, 0, P2], seg: 20, shade: 1.0 });
    /* the pins round the rim. About X, so the size order is
       [axial, radial, tangential] — the convention shape.js records. */
    out.push({ shape: "box", size: [1.9, 0.40, 0.30],
      pos: [x + dx, y0 + h + 1.05, -d / 2 + 2.6], r: 0.04, shade: 1.5,
      ring: { count: 14, radius: 2.02, axis: "x" } });
  });
  /* the shaft between them */
  out.push({ shape: "cyl", size: [0.34, 8.8], pos: [x, y0 + h + 1.05, -d / 2 + 2.6], rot: [0, 0, P2], seg: 12, shade: 0.70 });
  /* the head on its rail, under the smoked lid */
  out.push({ shape: "cyl", size: [0.26, 9.4], pos: [x, y0 + h - 0.55, 0.4], rot: [0, 0, P2], seg: 12, shade: 0.62 });
  out.push({ shape: "rbox", size: [2.2, 1.0, 1.5], pos: [x - 2.4, y0 + h - 0.45, 0.4], r: 0.15, shade: 0.75 });
  return out.concat(fanfold(x, d / 2 + 0.9));
}

/* ---- 6. THE DYE SUBLIMATION PHOTO PRINTER ------------------------
   Silver two-tone and compact, with a colour preview screen angled on
   the front, a cassette drawer low down, the ribbon-cassette door on the
   front right — and, lying on the pulled-out tray, A FINISHED
   PHOTOGRAPH. That print is the machine's whole purpose and it is the
   thing that separates it from everything else on the shelf. */
function dyesubBody(x) {
  const w = 8.8, h = 6.0, d = 8.6;
  const y0 = BASE, top = y0 + h;
  const out = [
    /* the darker lower body */
    { shape: "rbox", size: [w, h * 0.44, d], pos: [x, y0 + h * 0.22, 0], r: 0.20, shade: 0.72 },
    /* the silver upper */
    { shape: "rbox", size: [w - 0.15, h * 0.58, d - 0.2], pos: [x, y0 + h * 0.71, 0], r: 0.24, shade: 1.0 },
    /* the ribbon cassette door on the front right, as a real step with a
       finger recess — this is where the panelled dye ribbon goes in */
    { shape: "rbox", size: [w * 0.30, h * 0.44, 0.32], pos: [x + w * 0.31, y0 + h * 0.70, d / 2 + 0.06], r: 0.10, shade: 0.88 },
    { shape: "box", size: [1.1, 0.26, 0.22], pos: [x + w * 0.31, y0 + h * 0.70, d / 2 + 0.28], r: 0.05, shade: 0.60 },
    /* the cassette drawer low on the front */
    { shape: "rbox", size: [w - 2.0, 0.85, 0.40], pos: [x - 0.3, y0 + h * 0.20, d / 2 + 0.10], r: 0.08, shade: 0.55 },
    /* the badge band */
    { shape: "box", size: [3.2, 0.32, 0.10], pos: [x - w * 0.22, y0 + h * 0.86, d / 2 + 0.16], r: 0.03, shade: 1.7 }
  ];
  return out
    .concat(seam(x, y0 + h * 0.44, w, d))
    .concat(feet(x, w, d, y0 - 0.42))
    /* THE COLOUR PREVIEW SCREEN, angled on the front left. A photo
       printer is the only machine on this shelf that has to SHOW you the
       picture before it commits a sheet to it, and that screen is how
       you know what it is for. */
    .concat([{ shape: "rbox", size: [3.2, 0.30, 2.2], pos: [x - w * 0.16, top - 0.85, d / 2 - 1.4],
               rot: [-0.58, 0, 0], r: 0.10, shade: 0.45 }]);
}
function dyesubFeature(x) {
  const w = 8.8, d = 8.6;
  /* the output tray, out at the front — but WITHOUT the plain white
     stack, because what lies on this one is a finished print and the
     print is drawn as its own part */
  return tray(x - 0.3, BASE + 0.95, d / 2 - 0.1, 6.2, 4.2, false)
    .concat([
      /* the dye ribbon cassette, half out of its door, so the panelled
         ribbon inside it can be seen */
      /* HALF OUT OF ITS DOOR, NOT HOVERING BESIDE THE MACHINE. The first
         render had it a unit clear of the front face with daylight behind
         it, which reads as a separate object somebody left on the desk. */
      { shape: "rbox", size: [2.4, 1.4, 2.6], pos: [x + w * 0.31, BASE + 4.2, d / 2 - 0.5], r: 0.10, shade: 1.0 },
      { shape: "cyl", size: [0.55, 1.9], pos: [x + w * 0.31 - 0.6, BASE + 4.2, d / 2 + 0.2], rot: [0, 0, P2], seg: 12, shade: 1.3 },
      { shape: "cyl", size: [0.55, 1.9], pos: [x + w * 0.31 + 0.6, BASE + 4.2, d / 2 + 0.2], rot: [0, 0, P2], seg: 12, shade: 1.3 }
    ]);
}
/* =====================================================================
   THE PARTS THAT CARRY A COLOUR OF THEIR OWN

   A part is drawn with ONE material in this engine — `p.color` — and a
   primitive cannot override it. So anything whose colour IS the
   information has to be its own part. That is the same rule that made
   the RAID caddy's lamps separate from its face and the outlet's
   keystone separate from its plate, arriving here for the first time.

   CYAN, MAGENTA, YELLOW AND A FULL-COLOUR PHOTOGRAPH ARE OUTSIDE THE
   ROYAL SIX. Recorded exception, argued the same way as the OPC drum's
   teal and the kapton's amber and PREVIEWED FOR THE OWNER rather than
   assumed: an ink tank IS cyan and magenta, a dye ribbon IS yellow,
   magenta and cyan in repeating panels, and a dye-sub print IS a
   photograph. Drawn in royal blue and royal red they are four coloured
   boxes and three stripes, and the student learns nothing from them.

   None of these is offered as an option on the stage — the question is
   built from SHOWROOM, which is the six machines — so they add detail to
   look at without adding anything to choose between. */
const INK = [
  { key: "ink-c", label: "Cyan tank",    color: "#22b2c8", i: 0 },
  { key: "ink-m", label: "Magenta tank", color: "#c9358f", i: 1 },
  { key: "ink-y", label: "Yellow tank",  color: "#e0be2a", i: 2 },
  { key: "ink-k", label: "Black tank",   color: "#23272c", i: 3 }
];
function inkTank(x, i) {
  const w = 10.2, d = 9.2, h = 8.4, y0 = BASE;
  return [{ shape: "rbox", size: [0.70, 1.9, 0.5],
    pos: [x + w * 0.30 + (i - 1.5) * 0.84, y0 + h * 0.36, d / 2 + 0.24], r: 0.08, shade: 1.0 }];
}

/* The three dye-ribbon panels, in the cassette standing half out of its
   door, and the finished print lying on the tray. */
const DYE = [
  { key: "dye-y", label: "Yellow panel",  color: "#e0be2a", i: 0 },
  { key: "dye-m", label: "Magenta panel", color: "#c9358f", i: 1 },
  { key: "dye-c", label: "Cyan panel",    color: "#22b2c8", i: 2 }
];
function dyePanel(x, i) {
  const w = 8.8, d = 8.6;
  return [{ shape: "box", size: [0.58, 0.30, 1.7],
    pos: [x + w * 0.31 - 0.7 + i * 0.7, BASE + 4.95, d / 2 - 0.4], r: 0.02, shade: 1.0 }];
}
/* The print. One part, and it is given the engine's GLOSS finish rather
   than a second colour, because what makes a dye-sub print recognisable
   at this size is that it SHINES — the process lays a clear overcoat as
   its fourth pass, and that overcoat is the reason these prints are
   handled without gloves and last. */
function dyePrint(x) {
  const d = 8.6;
  return [
    { shape: "box", size: [5.4, 0.12, 3.4], pos: [x - 0.3, BASE + 1.38, d / 2 + 2.0], rot: [-0.05, 0, 0], r: 0.02, shade: 1.0 },
    /* a darker band across the lower third, so it reads as a picture
       with something in it rather than a coloured card */
    /* A PHOTOGRAPH HAS SOMETHING IN IT. One flat colour is a coloured
       card, which is what the first render showed — so the print carries
       a horizon, a darker foreground and a white border, all in shades of
       its own part colour. It is not a picture of anything in particular
       and it does not need to be; it needs to read as a PRINT at the size
       a student actually sees it. */
    { shape: "box", size: [5.2, 0.06, 1.3], pos: [x - 0.3, BASE + 1.46, d / 2 + 3.0], rot: [-0.05, 0, 0], r: 0.01, shade: 0.42 },
    { shape: "box", size: [5.2, 0.06, 0.55], pos: [x - 0.3, BASE + 1.46, d / 2 + 1.5], rot: [-0.05, 0, 0], r: 0.01, shade: 1.55 },
    { shape: "box", size: [5.6, 0.05, 0.22], pos: [x - 0.3, BASE + 1.40, d / 2 + 0.45], rot: [-0.05, 0, 0], r: 0.01, shade: 2.2 },
    { shape: "box", size: [5.6, 0.05, 0.22], pos: [x - 0.3, BASE + 1.40, d / 2 + 3.6], rot: [-0.05, 0, 0], r: 0.01, shade: 2.2 }
  ];
}

/* ---- the table ---------------------------------------------------

   THE COLOURS ARE THE PHOTOGRAPHS' COLOURS NOW, and that turned out to
   cost nothing. The old shelf carried a blue inkjet, two green label
   printers, a purple dot matrix and a red dye-sub — invented, because
   six machines a student cannot tell apart reduces the stage to
   elimination. The photographs are graphite, black, dark slate, cream
   and silver, and checked pair by pair those six clear the channel
   distance the assertion below demands with room to spare. Realistic and
   tellable apart were not in tension; nobody had measured.

   Each is still separated by VALUE as well as hue, which is the channel
   that survives damaged sight, a small screen and a shelf seen at an
   angle. */
const MACHINES = [
  { key: "laser", name: "Laser", col: 0, row: 0,
    body: laserBody, bodyColor: "#6e767d",
    feature: laserFeature, featureColor: "#d8dde1", featureName: "its output tray, loaded",
    says: "Squat and wide, graphite over silver-grey, with the control panel lying FLAT on the " +
      "top face and a tray folded down at the front with a stack of paper on it." },
  { key: "inkjet", name: "Inkjet", col: 1, row: 0,
    body: inkjetBody, bodyColor: "#2f353b",
    feature: inkjetFeature, featureColor: "#b9c2cc", featureName: "its output tray",
    extra: INK.map(function (t) {
      return { key: t.key, label: "Inkjet — " + t.label.toLowerCase(), color: t.color,
               finish: "plastic", build: function (x) { return inkTank(x, t.i); } }; }),
    says: "The tallest thing here, black, with a hinged scanner lid and a paper support standing " +
      "UP at the back. A colour touchscreen angled on the front, and four ink tanks behind a " +
      "window where you can see how much is left." },
  { key: "thermal", name: "Thermal", col: 0, row: 1,
    body: thermalBodyS, bodyColor: "#4a5560",
    feature: thermalFeature, featureColor: "#e8eaec", featureName: "the label it just printed",
    says: "Small and deep, a clamshell that opens upward, a tear bar at the exit slot and three " +
      "labelled buttons in a COLUMN on the front. Nothing in the media path but paper." },
  { key: "thermaltx", name: "Thermal transfer", col: 1, row: 1,
    body: transferBody, bodyColor: "#4a5560",
    feature: transferFeature, featureColor: "#b1a07c", featureName: "its ribbon, over the head",
    says: "The same machine as the one beside it, shown with the lid up. Inside: a media roll at " +
      "the back AND a ribbon threaded over the print head. That ribbon is the whole difference, " +
      "and it decides whether the print survives heat, light and handling." },
  { key: "impact", name: "Impact (dot matrix)", col: 2, row: 0,
    body: impactBody, bodyColor: "#c9bfa6",
    feature: impactFeature, featureColor: "#8f9aa6", featureName: "its tractor sprockets",
    says: "Cream, wide and low, with a smoked clear lid you can see the carriage through. " +
      "Tractor sprockets at both ends of a shaft, and fanfold paper with sprocket holes down " +
      "both margins coming out of the front." },
  { key: "dyesub", name: "Dye sublimation", col: 2, row: 1,
    body: dyesubBody, bodyColor: "#9aa4ad",
    feature: dyesubFeature, featureColor: "#7f8b97", featureName: "its dye ribbon cassette",
    extra: DYE.map(function (t) {
      return { key: t.key, label: "Dye-sub — " + t.label.toLowerCase(), color: t.color,
               finish: "plastic", build: function (x) { return dyePanel(x, t.i); } }; })
      .concat([{ key: "print", label: "Dye-sub — the finished print", color: "#4a8fc4",
                 finish: "glass", build: dyePrint }]),
    says: "Silver and compact, with a colour screen on the front to preview the picture and a " +
      "cassette door for the ribbon. On the tray is the thing that names it: a finished " +
      "photograph, glossy, on paper it has to be sold with." }
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
    /* THE PARTS THAT CARRY A COLOUR OF THEIR OWN — the inkjet's four ink
       tanks, the dye ribbon's three panels, the finished print. A part is
       drawn with one material in this engine, so anything whose COLOUR is
       the information has to be its own part. None of them is an option
       on this stage: the question is built from SHOWROOM, which is the
       six machines, so these add something to look at and nothing to
       choose between. */
    (m.extra || []).forEach(function (e) {
      parts.push({
        key: m.key + "-" + e.key, label: e.label,
        build: atRow(e.build(x), dz), finish: e.finish || "plastic", scale: 1, pos: [0, 0, 0],
        color: e.color, spec: e.label + ".", note: ""
      });
    });
    /* A name plate under each, so the shelf is readable with WebGL off
       and so nobody has to guess which box is which. */
    parts.push({
      key: m.key + "-plate", label: m.name + " — name plate",
      build: atRow([{ shape: "rbox", size: [10.0, 0.45, 2.0], pos: [x, -3.12, 6.6], r: 0.1, shade: 1.0 }], dz),
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
    /* THE FRAME HAS TO HOLD THE DEPTH, NOT JUST THE WIDTH.
 
       1.30 was measured when the machines were boxes eight units tall. It
       clipped six parts the moment they grew: at pitch 0.62 the board's
       39 units of DEPTH project to 39 x sin(0.62) = 22.6 of screen height
       all by themselves, and the machines add another eight on top of
       that — about 31 against the 26.6 the old number gave. Swept against
       frustumOK on both axes afterwards rather than reasoned, because
       every fitWidth reasoned from a dimension in this build has been
       wrong at least once. */
    camera: { dist: 52, fitWidth: BOARD_W * 2.06, yaw: 0.10, pitch: CAM_PITCH,
      target: [0, 1.0, 0.6], min: 16, max: 160 }
  };
}
