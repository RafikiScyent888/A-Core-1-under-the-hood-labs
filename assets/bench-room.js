/* =====================================================================
   THE SHOWROOM — every lab as a machine on a shelf.

   The front door was eight text tabs. It is now a lit room with the
   hardware in it, and a student picks a lab by pointing at the thing they
   want to learn, which is how anybody actually chooses.

   ONE SCALE FOR THE ROOM: 1 UNIT = 40 mm. A four-metre wall is 100 units,
   which sits comfortably inside the engine's 300-unit far plane — the
   wall the screen bench hit when it was authored at 5 mm and needed the
   camera past 300 to frame four panels. A room is the largest thing in
   this build and it is the one that has to respect that limit first.

   THE MACHINES ARE NOT AT TRUE SCALE AGAINST EACH OTHER, AND THAT IS A
   DECISION. At 40 mm a phone is 1.75 units and an RJ45 plug is 0.3 — next
   to a server rack at 30 they are specks, and a shelf of specks is a shelf
   nobody can click. So each machine is drawn at the size that makes it
   READ on its shelf, the same deliberate exaggeration the exploded phone
   already uses on its midframe and panel so the layers separate. True
   scale lives on the benches, where it is the lesson: the RJ45 bench says
   1 unit = 2 mm and means it.

   WHAT LIVES WHERE, and why it is not one long row:

     the floor    the server rack and the PC tower, because that is where
                  a rack and a tower actually stand
     top shelf    the four printers, because the Printer lab covers four
                  technologies and the shelf is where that becomes a fact
                  rather than a sentence
     middle       the power supply, the router, the projector
     bottom       the phone and the RJ45 plug, the two smallest things,
                  nearest the eye

   COLOUR IS INSIDE THE ROYAL SIX. Pale neutral walls, silver shelving,
   and the machines in their own colours. A warmer room — wood shelving,
   a warm key light — is outside the palette and would need previewing
   before it is used, so it is offered rather than assumed.
   ===================================================================== */

const P2 = Math.PI / 2;

export const ROOM_SCALE = { mmPerUnit: 40 };

/* AUTHORED AT 40 mm, DRAWN AT TWO THIRDS — and the number is forced by the
   engine, not chosen for looks.

   The room is 103 units across as authored. Framing that on a PHONE needs
   the camera about 314 units back: visible width is (fitWidth/2) divided
   by aspect times tan(19 degrees), and a 390px phone gives an aspect near
   0.69. The engine's far plane is 300. So the room would have been cut
   away by the far plane on exactly the device most homework is done on —
   the same wall the screen bench hit, found the same way.

   Two thirds puts the room at 68 units, which needs about 151 at phone
   aspect and 48 on a laptop. Authoring stays in millimetres over forty,
   where the numbers mean something; only the drawing shrinks. */
export const ROOM_DRAW = 0.66;

/* BUILT FROM THE OWNER'S PHOTOGRAPH OF THE REAL ROOM.

   The first cut was invented: cold grey walls, cold grey shelving, three
   decks on square columns. The photograph corrects four things at once,
   and each of them is the kind of fact you either have or you guess:

   | what the photograph shows        | what the model had                |
   |----------------------------------|-----------------------------------|
   | FIVE decks, not three            | three                             |
   | boltless shelving — a FRONT BEAM | a floating slab with no edge      |
   |   standing proud of every deck   |                                   |
   | slim ANGLE-IRON uprights at the  | four square columns 1.6 across,   |
   |   ends, feet on the floor        |   one of them through the middle  |
   | a CREAM wall and a suspended     | grey wall, grey shelving, grey    |
   |   ceiling grid with two flush    |   floor — one field of grey with  |
   |   LED panels and a round sensor  |   lumps standing in it            |

   So the room is warm and the steel is cold, which is the combination
   neither preview palette had: ROOM_COLOUR was cold everywhere and
   ROOM_WARM put the shelving in timber. The shelving is STEEL — silver,
   which is in the royal six — and the wall is the warm neutral a painted
   block wall actually is. */
export const ROOM_COLOUR = {
  wall:    "#cfc9bd",     /* the cream of the photograph, not a cold grey */
  wallLow: "#b9b3a6",
  floor:   "#9a958c",
  steel:   "#9aa4ad",
  steelHi: "#b4bdc5",
  dark:    "#2f353b",
  mid:     "#4a5560",
  pale:    "#d9dce0",
  green:   "#2f8f4a",
  blue:    "#3a6ea8",
  purple:  "#7a4f9e",
  red:     "#a8433a",
  yellow:  "#d8b23a",
  /* ADJACENT PARTS MUST DIFFER, not just carry one colour each. The first
     render put pale machines on silver shelving against pale walls and the
     shelf read as one grey field with lumps in it. These two give the
     printers something to sit against. */
  paper:   "#e8eaec",
  beige:   "#bfc3c0",
  /* THE FOUR PRINTER BODIES, AND THE RULE IS ARITHMETIC NOW.

     "Adjacent parts must differ" was being obeyed as a colour rule and
     failed as a VALUE rule, twice on the same shelf. The impact printer
     sat at luminance 0.74 against a wall at 0.78 — four hundredths apart,
     which is no separation at all — and the laser was a pale grey box
     among pale grey boxes. Both were looked at in renders and both read
     as more paper stock.

     Value is the channel that survives a student with damaged sight, a
     small screen and a shelf seen at an angle, so the four bodies are
     spaced ACROSS the range with the wall's own value treated as a fifth
     thing to stay away from:

     These are RELATIVE luminance, linearised — the same arithmetic the
     contrast sweeps use, not the eyeballed sRGB number. The measured
     ladder, darkest first, with the gap to the one below:

        thermal  0.035          near-black, which is what a label printer is
        laser    0.178   0.143  graphite, which is what an office laser is
        impact   0.353   0.176  deep putty — dot matrix is putty, just darker
        wall     0.587   0.234
        inkjet   0.818   0.231  white, LIGHTER than the wall rather than equal

     The tightest pair is thermal against laser at 0.143, and the floor is
     0.14. `checkPrinterBodiesSeparate` holds it at load, on both palettes,
     so nobody restores a "nicer" beige by eye. */
  laserBody:   "#6e767d",
  inkjetBody:  "#e6eaed",
  thermalBody: "#2f353b",
  impactBody:  "#ab9f8b",
  /* TWO METALS THAT BELONG TO THE MACHINES, NOT TO THE ROOM.

     `steel` and `steelHi` are the SHELVING, and in the warm preview
     palette they become timber. A machine part that borrowed them came
     out brown the moment the room was previewed warm — the laser's paper
     tray landed 0.016 in luminance from its own body and the load check
     caught it, which is exactly the adjacency failure the check exists
     for, arriving from a direction nobody had thought about.

     A printer's tray is pressed steel whatever colour the shelving is,
     so it gets a key of its own with the SAME value in both palettes.
     The rule the comment on ROOM_WARM already states: the machines keep
     their colours in both, only the room changes. */
  alu:     "#9aa4ad",
  aluPale: "#b4bdc5",
  /* THE THERMAL PRINTER'S LATCH IS ORANGE, and orange is outside the
     royal six. It is the recorded exception already carried by
     `bench-thermal.js` and approved by the owner there: the lever is
     orange on the real machine precisely so a technician's eye finds it,
     and this is the same lever on the same machine seen from outside.
     Do not "correct" it to red. */
  lever:   "#d0712c"
};

/* Relative luminance, the same arithmetic the contrast sweeps use. */
function lum(hex) {
  const v = [1, 3, 5].map(function (i) {
    const c = parseInt(hex.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

/* THE FOUR MACHINES ON ONE DECK MUST BE TELLABLE APART BY VALUE ALONE,
   and so must each of them from the wall behind it. Held at load, in this
   module, because it is a fact about THIS shelf and not something a
   generic contrast sweep can know: a sweep measures text against its
   background, and this is four objects against each other. */
export const BODY_GAP = 0.14;
export function checkPrinterBodiesSeparate(C) {
  C = C || ROOM_COLOUR;
  const names = ["thermalBody", "laserBody", "impactBody", "inkjetBody"];
  const set = names.map(function (k) { return { k: k, l: lum(C[k]) }; });
  set.push({ k: "wall", l: lum(C.wall) });
  set.sort(function (a, b) { return a.l - b.l; });
  for (let i = 1; i < set.length; i++) {
    const gap = set[i].l - set[i - 1].l;
    if (gap < BODY_GAP) {
      throw new Error("bench-room: " + set[i - 1].k + " (" + set[i - 1].l.toFixed(2) +
        ") and " + set[i].k + " (" + set[i].l.toFixed(2) + ") are only " + gap.toFixed(2) +
        " apart in luminance. Four printers on one deck have to be tellable apart " +
        "by value, not only by hue — minimum " + BODY_GAP + ".");
    }
  }
  return set;
}
checkPrinterBodiesSeparate(ROOM_COLOUR);

/* THE WARM ROOM, OFFERED RATHER THAN USED.

   Timber and a warm light look more like a workshop somebody actually
   works in, and neither is in the royal six — so this palette exists to
   be PREVIEWED. Nothing switches to it without the owner saying so. The
   machines keep their own colours in both; only the room changes, because
   a printer is the colour a printer is whatever room it stands in. */
export const ROOM_WARM = {
  wall:    "#cfc6b6",
  wallLow: "#b3a893",
  floor:   "#8c8175",
  steel:   "#8a6a45",     /* shelving in timber rather than steel */
  steelHi: "#a5825a",
  dark:    "#2f353b",
  mid:     "#4a5560",
  pale:    "#d9dce0",
  paper:   "#e8eaec",
  beige:   "#bfc3c0",
  laserBody:   "#6e767d",
  inkjetBody:  "#e6eaed",
  thermalBody: "#2f353b",
  impactBody:  "#ab9f8b",
  green:   "#2f8f4a",
  blue:    "#3a6ea8",
  purple:  "#7a4f9e",
  red:     "#a8433a",
  yellow:  "#d8b23a",
  alu:     "#9aa4ad",
  aluPale: "#b4bdc5",
  lever:   "#d0712c"
};

/* The room. 4 m across, 2.6 m high, 3.2 m deep, at 40 mm to the unit. */
const ROOM = { w: 100, h: 65, d: 80 };

/* Shelf heights, measured from the floor. ONE TABLE, because the shelf
   boards, the uprights and every machine standing on them have to agree
   about where a shelf is — three separate guesses is how a part ends up
   floating a unit above the board it is meant to be sitting on. */
/* FIVE DECKS, evenly spaced, off the photograph. 10 units is 400 mm of
   clear height between decks, which is what boltless shelving is sold at
   and what the photograph shows — enough for a desktop laser and not so
   much that the unit reads as a bookcase.

   `top`, `mid` and `low` are kept as NAMES for the three decks the
   machines stand on, because the SHOWROOM table and the layout check both
   read them, and a bare index into `levels` says nothing about which
   shelf a student is looking at. */
const SHELF = {
  levels: [6, 16, 26, 36, 46],
  depth: 13, thick: 0.9,
  beam: 1.7,          /* the front beam standing proud of the deck */
  post: 0.85          /* angle-iron upright: slim, not a column */
};
SHELF.bulk = SHELF.levels[0];    /* boxes of paper, low down where bulk goes */
SHELF.low  = SHELF.levels[1];
SHELF.mid  = SHELF.levels[2];
SHELF.top  = SHELF.levels[3];
SHELF.stock = SHELF.levels[4];   /* spare stock, high up where stock goes */

const BAY = { x0: -48, x1: 20 };          /* the shelving run */

/* ---------------------------------------------------------------------
   THE ROOM ITSELF
   --------------------------------------------------------------------- */
export function roomShell() {
  const W = ROOM.w, H = ROOM.h, D = ROOM.d;
  const out = [
    /* floor */
    { shape: "box", size: [W, 1.0, D], pos: [0, -0.5, 0], r: 0.1, shade: 1.0 },
    /* back wall */
    { shape: "box", size: [W, H, 1.0], pos: [0, H / 2, -D / 2], r: 0.1, shade: 1.30 },
    /* THE SKIRTING, which the first model drew as a ten-unit band of
       slightly darker wall. In the photograph it is a SKIRTING — about
       100 mm, standing proud of the wall, with a hard top edge. A soft
       ten-unit gradient is a painter's idea of a horizon; a skirting is a
       thing you can see the top of. */
    { shape: "box", size: [W, 2.6, 1.4], pos: [0, 1.3, -D / 2 + 0.6], r: 0.05, shade: 1.05 },
    /* side walls */
    { shape: "box", size: [1.0, H, D], pos: [-W / 2, H / 2, 0], r: 0.1, shade: 1.16 },
    { shape: "box", size: [1.0, H, D], pos: [W / 2, H / 2, 0], r: 0.1, shade: 1.16 },
    { shape: "box", size: [1.4, 2.6, D], pos: [-W / 2 + 0.6, 1.3, 0], r: 0.05, shade: 0.95 },
    { shape: "box", size: [1.4, 2.6, D], pos: [W / 2 - 0.6, 1.3, 0], r: 0.05, shade: 0.95 }
  ];

  /* THE SUSPENDED CEILING. The photograph's ceiling is a grid of tiles in
     a visible T-bar, and it is worth drawing because it is what says
     "commercial room" rather than "grey void" — and because the two light
     panels are TILES IN THAT GRID, which is why they sit flush. Drawn as
     the tile field plus the bars, since the bars are what you actually
     see. 24 inches to a tile is 15 units at 40 mm. */
  out.push({ shape: "box", size: [W, 0.8, D], pos: [0, H - 0.4, 0], r: 0.05, shade: 1.34 });
  const TILE = 15;
  for (let x = -W / 2 + TILE; x < W / 2 - 0.5; x += TILE) {
    out.push({ shape: "box", size: [0.45, 0.35, D], pos: [x, H - 0.95, 0], r: 0.02, shade: 1.12 });
  }
  for (let z = -D / 2 + TILE; z < D / 2 - 0.5; z += TILE) {
    out.push({ shape: "box", size: [W, 0.35, 0.45], pos: [0, H - 0.95, z], r: 0.02, shade: 1.12 });
  }
  return out;
}

/* THE LIGHT. The engine's lamps are fixed and shared, so a "well lit
   room" is made here, in the surfaces: two ceiling panels that are
   genuinely bright geometry, and the pools they throw on the floor. A
   lamp that is drawn but casts nothing reads as a sticker on the
   ceiling. */
export function roomLights() {
  const W = ROOM.w, H = ROOM.h, D = ROOM.d;
  const out = [];
  /* TWO FLUSH PANELS, SIZED AS CEILING TILES. In the photograph they are
     not fittings hanging below the ceiling — they are panels dropped into
     the grid, the same size as the tiles around them, with the T-bar
     running right up to their edges. A 600 x 600 panel is 15 x 15 units,
     and squaring them off is most of what makes the ceiling read as the
     real thing rather than as two strip lights. */
  [-1, 1].forEach(function (s) {
    const x = s * 15;
    out.push({ shape: "box", size: [14.4, 0.5, 14.4], pos: [x, H - 1.0, -8], r: 0.06, shade: 0.86 });
    out.push({ shape: "box", size: [13.4, 0.35, 13.4], pos: [x, H - 1.25, -8], r: 0.04, shade: 2.10 });
    /* THE POOL IT THROWS. Two of these at shade 1.16 with a hard edge read
       as a pale RUG laid on the floor, not as light — a pool of light has
       no border. Softer, wider, and overlapping so there is no seam down
       the middle of the room where the two would otherwise meet. */
    /* AND IT HAS TO STAND CLEAR OF THE FLOOR. At pos 0.05 with a
       thickness of 0.05 the pool's underside is 0.025 above the floor
       face, which is 0.017 once ROOM_DRAW has shrunk it — inside the
       range where this renderer z-fights, and it showed as two white
       flecks on the floor under the middle frame. The light guide plate's
       extraction dots taught this exact number: 0.0375 of clearance
       shows, 0.0025 does not. */
    out.push({ shape: "rbox", size: [48, 0.05, 34], pos: [x, 0.22, 0], r: 13.0, shade: 1.07 });
  });
  /* THE ROUND DETECTOR beside them. It is in the photograph, it is in
     every commercial ceiling, and it is the one thing on a flat white
     field that gives the ceiling a sense of scale. */
  out.push({ shape: "cyl", size: [5.0, 0.5], pos: [0, H - 1.05, -14], rot: [P2, 0, 0], shade: 0.92 });
  out.push({ shape: "cyl", size: [3.2, 0.7], pos: [0, H - 1.35, -14], rot: [P2, 0, 0], shade: 0.80 });
  return out;
}

/* THE SHELVING, REBUILT FROM THE PHOTOGRAPH.

   This is BOLTLESS (rivet) shelving, and the thing that makes it read as
   that rather than as a bookcase is the FRONT BEAM: a channel standing
   proud below the front edge of every deck, carrying the load and casting
   the shadow line you can see on each shelf in the photograph. The first
   model had none, so five floating slabs is exactly what it looked like.

   The uprights are ANGLE IRON — two flanges at right angles, not a solid
   post. That is why they are almost invisible from the front and read as a
   thin dark line down each end of the run, and it is why the old model's
   four square columns 1.6 units across looked like a pergola. There is no
   boolean subtraction in this renderer, so an L-section is drawn as what
   it is: two thin plates meeting at the corner.

   Uprights stand at the ENDS and at one mid frame, because a run this long
   needs a middle frame and the photograph has one. Not four. */
export function shelving() {
  const out = [];
  const x0 = BAY.x0, x1 = BAY.x1, D = SHELF.depth;
  const H = SHELF.levels[SHELF.levels.length - 1] + 2.0;   /* uprights run past the top deck */
  const t = SHELF.post;

  [x0, (x0 + x1) / 2, x1].forEach(function (x) {
    /* Each frame is two angle-iron uprights, front and back. An L-section
       is two plates: one facing the room, one facing along the run. */
    [-1, 1].forEach(function (s) {
      const z = -22 + s * (D / 2 - t / 2);
      out.push({ shape: "box", size: [t, H, t * 2.6], pos: [x, H / 2, z], r: 0.05, shade: 0.94 });
      out.push({ shape: "box", size: [t * 2.6, H, t], pos: [x, H / 2, z], r: 0.05, shade: 1.06 });
      /* the foot it stands on */
      out.push({ shape: "box", size: [t * 3.2, 0.45, t * 3.2], pos: [x, 0.22, z], r: 0.06, shade: 0.78 });
    });
    /* THE DIAGONAL BRACE, IN THE PLANE OF THE FRAME.

       A frame brace ties the FRONT upright to the BACK one — it lives in
       the depth plane, which means a rotation about X. The first cut used
       `rot: [0, 0, 0.30]`, which is a rotation about Z: that leans the bar
       sideways ACROSS the run, so it crossed the front of the shelves and
       came out through the floor past the end upright. It rendered, and it
       was obviously wrong the moment it was looked at.

       Length and angle both come from the frame it is bracing, so neither
       can drift when the shelf heights change: the bar spans the diagonal
       of a D by H rectangle and leans by atan(D / H). */
    const len = Math.sqrt(D * D + H * H);
    out.push({ shape: "box", size: [0.45, len * 0.97, 0.45], pos: [x, H / 2, -22],
      rot: [Math.atan2(D, H), 0, 0], r: 0.05, shade: 0.86 });
  });

  SHELF.levels.forEach(function (y) {
    /* the deck */
    out.push({ shape: "box", size: [x1 - x0 + 2.2, SHELF.thick, D],
      pos: [(x0 + x1) / 2, y - SHELF.thick / 2, -22], r: 0.06, shade: 1.16 });
    /* THE FRONT BEAM — the signature of this shelving, and the part that
       gives every deck an edge and a shadow instead of a floating line. */
    out.push({ shape: "box", size: [x1 - x0 + 2.2, SHELF.beam, 0.75],
      pos: [(x0 + x1) / 2, y - SHELF.thick - SHELF.beam / 2 + 0.1, -22 + D / 2 - 0.3],
      r: 0.08, shade: 1.02 });
    /* and the matching beam at the back, which is what the deck sits in */
    out.push({ shape: "box", size: [x1 - x0 + 2.2, SHELF.beam, 0.75],
      pos: [(x0 + x1) / 2, y - SHELF.thick - SHELF.beam / 2 + 0.1, -22 - D / 2 + 0.3],
      r: 0.08, shade: 0.82 });
  });
  return out;
}

/* WHAT IS ON THE TOP AND BOTTOM DECKS, and why it is not decoration.

   Five decks and eleven machines leaves two decks empty, and an empty
   deck in a store room is the one thing that never happens. The honest
   filler is the thing the room is actually full of: paper. Bulk boxes low
   down where bulk goes, opened reams high up where stock goes — which is
   how a real store is loaded, and is a small piece of the same fact the
   printer lab's `duty` stage teaches with two piles of reams.

   It is drawn in the ROOM'S colour, not a machine colour, and it carries
   no `key` of its own in SHOWROOM, so nothing about it invites a click. */
export function shelfStock() {
  const out = [];
  /* LOUDNESS TRACKS IMPORTANCE, and the first cut got this backwards.
     Drawn in the paper colour at full shade, twelve boxes of copier paper
     were the brightest objects in the room — a white wall of stock with
     the eleven machines the page is ABOUT sitting quietly behind it. The
     inkjet printer next to them is white too, so the shelf read as stock
     all the way across.

     Stock is drawn in the room's own neutral, below shade 1, and the
     machines keep the bright end of the range to themselves. */
  const BOX = 0.80, REAM = 0.90;

  /* boxes of paper on the bottom deck */
  [-42, -33, -24, -8, 2, 11].forEach(function (x, i) {
    const h = 5.4, w = 7.6;
    out.push({ shape: "box", size: [w, h, 9.5], pos: [x, SHELF.bulk + h / 2, -22],
      r: 0.12, shade: i % 2 ? BOX : BOX * 0.93 });
    /* the printed band across the end of a box of copier paper */
    out.push({ shape: "box", size: [w * 0.62, 1.5, 0.14], pos: [x, SHELF.bulk + h * 0.62, -22 + 4.85],
      r: 0.04, shade: 0.58 });
  });
  /* opened reams laid flat on the top deck, in two stacks */
  [-40, -28, -4, 8].forEach(function (x, i) {
    const n = 3 + (i % 2);
    out.push({ shape: "box", size: [8.4, 1.15, 10.8], pos: [x, SHELF.stock + 0.6, -22],
      r: 0.06, shade: REAM, repeat: { count: n, step: [0, 1.2, 0] } });
  });
  return out;
}

/* =====================================================================
   THE MACHINES, IN SHOWROOM FORM.

   Every one of these is the CLOSED product. The benches draw them opened,
   exploded and cut away, because that is where the teaching is; a shelf
   wants the silhouette a student would recognise in a corridor.

   ---------------------------------------------------------------------
   EVERY PRIMITIVE CARRIES A `part` TAG, AND THAT IS NOT BOOKKEEPING.

   These eleven machines follow a student through their whole lab: the
   dock shows the lab's own machine on every step that has no bench of
   its own, which is thirteen stages across the eight labs and every
   brief, table and calculation in the build. For most of that time it
   was ONE part — "Power supply / on the bench" — so a student could turn
   it and nothing else. The picture was present and the machine was not
   interrogable, which is a different thing and the smaller one.

   A tag makes each feature a named, focusable control beside the canvas
   with a sentence a technician would actually say about it. That is the
   same contract every bench in this build already keeps: **the canvas is
   scenery, the buttons are the interface**, and a part that has no button
   is a part that does not exist with WebGL off.

   The tags are read by `machineBench` only. `roomBench` still draws each
   machine as ONE part, deliberately — in the room a machine is a door
   into a lab and a click on it opens that lab, so splitting it there
   would give a student six ways to open the Printer lab and one of them
   would be called "the tear bar".
   ===================================================================== */

/* ---- the four printers, top shelf ---- */

/* A laser office printer: a squat box with a tray lip at the front, an
   output well pressed into the top, and a control panel on the right. */
export function laserPrinter(x, y) {
  const w = 12, h = 8.4, d = 10;
  return [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2, -22], r: 0.7, shade: 1.0 },
    /* the output well — a real dish in the top, not a painted rectangle */
    { part: "well", shape: "rbox", size: [w - 3.2, 1.1, d - 3.4], pos: [x, y + h - 0.3, -21.4], r: 0.5, shade: 0.62 },
    /* the paper tray, standing proud of the front */
    { part: "tray", shape: "rbox", size: [w - 1.4, 2.2, 1.6], pos: [x, y + 1.5, -22 + d / 2 + 0.5], r: 0.3, shade: 0.88 },
    /* the control panel, angled */
    { part: "panel", shape: "rbox", size: [3.4, 0.5, 2.0], pos: [x + w / 2 - 2.6, y + h + 0.1, -22 + d / 2 - 2.6],
      rot: [-0.42, 0, 0], r: 0.2, shade: 1.25 },
    /* a sheet in the output well, because a printer with paper in it
       reads as a printer that works */
    { part: "sheet", shape: "box", size: [7.0, 0.12, 5.2], pos: [x, y + h + 0.12, -21.6], r: 0.02, shade: 2.0 }
  ];
}

/* An inkjet all-in-one: the same footprint with a SCANNER LID on top,
   which is the whole difference at a glance. */
export function inkjetPrinter(x, y) {
  const w = 12, h = 7.0, d = 10;
  return [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2, -22], r: 0.7, shade: 1.0 },
    /* the scanner lid, slightly proud all round and lifted at the hinge */
    { part: "scanner", shape: "rbox", size: [w - 0.4, 1.4, d - 0.6], pos: [x, y + h + 0.5, -22], r: 0.4, shade: 1.16 },
    /* the hinge itself */
    { part: "scanner", shape: "box", size: [w - 2.0, 0.8, 0.8], pos: [x, y + h + 0.4, -22 - d / 2 + 0.6], r: 0.15, shade: 0.7 },
    /* output tray pulled out at the front */
    { part: "tray", shape: "rbox", size: [w - 3.0, 0.5, 3.4], pos: [x, y + 1.8, -22 + d / 2 + 1.2], r: 0.2, shade: 0.9 },
    { part: "panel", shape: "rbox", size: [3.0, 0.45, 1.6], pos: [x - w / 2 + 2.4, y + h + 1.3, -22 + d / 2 - 2.0],
      rot: [-0.40, 0, 0], r: 0.18, shade: 1.30 }
  ];
}

/* A thermal label printer: small, tall for its width, with a roll hump on
   the back and a label peeling out of a slot at the front. */
export function thermalPrinter(x, y) {
  const w = 6.4, h = 6.0, d = 7.0;
  return [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2, -22], r: 0.6, shade: 1.0 },
    /* the media hump */
    { part: "roll", shape: "cyl", size: [5.0, w - 1.0], pos: [x, y + h - 0.6, -23.0], rot: [0, 0, P2],
      seg: 22, shade: 1.10 },
    /* the tear bar and the label coming off it */
    { part: "tear", shape: "box", size: [w - 1.0, 0.4, 0.5], pos: [x, y + h * 0.62, -22 + d / 2], r: 0.1, shade: 0.62 },
    { part: "label", shape: "box", size: [w - 1.6, 0.10, 3.2], pos: [x, y + h * 0.60, -22 + d / 2 + 1.7],
      rot: [0.26, 0, 0], r: 0.02, shade: 2.0 },
    /* the one orange control, which is how you find it on the real
       machine — a recorded palette exception on the thermal bench */
    { part: "lever", shape: "rbox", size: [1.2, 0.4, 0.9], pos: [x + w / 2 - 1.2, y + h + 0.1, -22 + d / 2 - 1.6],
      r: 0.15, shade: 1.5 }
  ];
}

/* A dot matrix: wide, boxy, with a fanfold stack behind it and the paper
   standing up out of the back — the silhouette nothing else has. */
export function impactPrinter(x, y) {
  const w = 12.5, h = 5.6, d = 8.5;
  return [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2, -22], r: 0.5, shade: 1.0 },
    /* the lid, a shallow dome across the middle */
    { part: "lid", shape: "rbox", size: [w - 3.0, 1.6, d - 3.0], pos: [x, y + h - 0.2, -22], r: 0.7, shade: 1.12 },
    /* the tractor slot at the back and the fanfold rising out of it */
    { part: "tractor", shape: "box", size: [w - 3.4, 0.5, 0.8], pos: [x, y + h - 0.4, -22 - d / 2 + 0.9], r: 0.1, shade: 0.6 },
    { part: "fanfold", shape: "box", size: [w - 4.0, 4.6, 0.12], pos: [x, y + h + 2.2, -22 - d / 2 - 0.3],
      rot: [0.16, 0, 0], r: 0.02, shade: 2.0 },
    /* the fanfold stack on the floor of the shelf behind it */
    { part: "fanfold", shape: "rbox", size: [w - 4.0, 1.6, 4.0], pos: [x, y + 0.8, -22 - d / 2 - 3.2], r: 0.1, shade: 1.9 }
  ];
}

/* ---- middle shelf ---- */

/* The power supply: a plain steel box, the fan grille on the face, the
   IEC inlet and the rocker beside it. */
export function psuBox(x, y) {
  const w = 7.0, h = 4.2, d = 5.6;
  const out = [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2, -22], r: 0.35, shade: 1.0 },
    /* the fan, on the face */
    { part: "fan", shape: "cyl", size: [3.4, 0.4], pos: [x - 0.6, y + h / 2, -22 + d / 2 + 0.1], rot: [P2, 0, 0],
      seg: 22, shade: 0.66 }
  ];
  /* grille bars across the fan, because a dark disc is a hole and a fan
     is a thing with a guard over it */
  for (let i = -2; i <= 2; i++) {
    out.push({ part: "grille", shape: "box", size: [3.2, 0.16, 0.16],
      pos: [x - 0.6, y + h / 2 + i * 0.62, -22 + d / 2 + 0.3], r: 0.05, shade: 1.2 });
  }
  /* the inlet and the rocker */
  out.push({ part: "inlet", shape: "rbox", size: [1.5, 1.2, 0.5], pos: [x + w / 2 - 1.3, y + 1.2, -22 + d / 2 + 0.2],
    r: 0.15, shade: 0.5 });
  out.push({ part: "rocker", shape: "rbox", size: [0.9, 0.7, 0.4], pos: [x + w / 2 - 1.3, y + 2.8, -22 + d / 2 + 0.2],
    r: 0.1, shade: 1.4 });
  return out;
}

/* The router: a wedge body with four flat paddle antennas, which is what
   the owner's photograph shows and what a student has at home. */
export function routerBox(x, y) {
  const w = 8.4, h = 1.9, d = 6.0;
  const out = [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2 + 0.35, -22], r: 0.35, shade: 1.0 },
    /* the wedge: a second slab tipped up at the back */
    { part: "body", shape: "rbox", size: [w - 0.5, h * 0.7, d - 0.8], pos: [x, y + h + 0.5, -22.4],
      rot: [-0.10, 0, 0], r: 0.3, shade: 1.08 },
    /* feet */
    { part: "body", shape: "cyl", size: [0.7, 0.5], pos: [x - w * 0.36, y + 0.25, -22 + d * 0.3], seg: 10, shade: 0.6 },
    { part: "body", shape: "cyl", size: [0.7, 0.5], pos: [x + w * 0.36, y + 0.25, -22 + d * 0.3], seg: 10, shade: 0.6 }
  ];
  /* four paddles, fanned — the count is a specification, not a style:
     each is a radio chain and the chains cap the spatial streams */
  [-1.5, -0.5, 0.5, 1.5].forEach(function (i) {
    const cx = x + i * w * 0.26, tilt = i * 0.28;
    out.push({ part: "antennas", shape: "rbox", size: [1.1, 5.2, 0.34],
      pos: [cx + Math.sin(tilt) * 2.6, y + h + 2.9 + Math.cos(tilt) * 0.4, -22 - d / 2 - 0.2],
      rot: [0, 0, -tilt], r: 0.16, shade: 0.92 });
  });
  /* the status LED row across the front */
  out.push({ part: "lamps", shape: "rbox", size: [0.4, 0.16, 0.25], pos: [x - w * 0.26, y + 0.9, -22 + d / 2 + 0.05],
    r: 0.06, shade: 1.6, repeat: { count: 5, step: [0.75, 0, 0] } });
  return out;
}

/* The projector: a pale box with the lens barrel proud of the front and
   the intake grille in the side. */
export function projectorBox(x, y) {
  const w = 8.0, h = 3.0, d = 6.6;
  const out = [
    { part: "body", shape: "rbox", size: [w, h, d], pos: [x, y + h / 2 + 0.3, -22], r: 0.5, shade: 1.0 },
    /* the stepped top */
    { part: "body", shape: "rbox", size: [w - 2.2, 0.5, d - 2.2], pos: [x, y + h + 0.5, -22], r: 0.4, shade: 1.10 },
    /* THE LENS, REBUILT. It was a pale disc on a pale box and read as a
       sticker. A projector lens sits in a RECESS, the barrel stands proud
       of it, and the glass is the darkest thing on the machine — that
       contrast is the whole silhouette at shelf distance. */
    { part: "recess", shape: "rbox", size: [4.4, 2.4, 0.5], pos: [x - 1.4, y + h / 2 + 0.3, -22 + d / 2 + 0.05],
      r: 0.5, shade: 0.72 },
    { part: "barrel", shape: "cyl", size: [3.0, 1.3], pos: [x - 1.4, y + h / 2 + 0.3, -22 + d / 2 + 0.55],
      rot: [P2, 0, 0], seg: 24, shade: 0.58 },
    { part: "glass", shape: "cyl", size: [2.3, 0.45], pos: [x - 1.4, y + h / 2 + 0.3, -22 + d / 2 + 1.1],
      rot: [P2, 0, 0], seg: 24, shade: 0.22 },
    /* the intake, in the side */
    { part: "intake", shape: "rbox", size: [0.4, 1.8, 3.0], pos: [x - w / 2 - 0.05, y + h / 2 + 0.2, -22.4],
      r: 0.12, shade: 0.6 },
    /* the front foot */
    { part: "foot", shape: "cyl", size: [0.8, 0.6], pos: [x, y + 0.3, -22 + d / 2 - 1.0], seg: 10, shade: 0.7 }
  ];
  return out;
}

/* ---- bottom shelf: the two small things ---- */

/* The phone, standing on a small stand so it faces the room. Drawn at
   about four units against a true 1.75 — see the scale note at the top. */
export function phoneOnStand(x, y) {
  const w = 3.4, h = 7.0, t = 0.55;
  return [
    /* the stand */
    { part: "stand", shape: "rbox", size: [4.2, 0.5, 2.6], pos: [x, y + 0.25, -22], r: 0.2, shade: 0.82 },
    { part: "stand", shape: "rbox", size: [1.6, 2.2, 0.8], pos: [x, y + 1.2, -22.6], rot: [0.22, 0, 0], r: 0.2, shade: 0.86 },
    /* the handset, tipped back the way a stand holds it */
    { part: "body", shape: "rbox", size: [w, h, t], pos: [x, y + 4.2, -22.2], rot: [0.22, 0, 0], r: 0.35, shade: 1.0 },
    /* the lit screen, proud of the body so it is not coplanar */
    { part: "screen", shape: "rbox", size: [w - 0.5, h - 0.6, 0.12], pos: [x, y + 4.24, -21.85],
      rot: [0.22, 0, 0], r: 0.28, shade: 1.0 }
  ];
}

/* =====================================================================
   THE NETWORK OUTLET — a faceplate on a piece of wall, not a plug.

   IT WAS A PLUG AND THE PLUG DID NOT READ. Blown up to shelf scale a
   loose RJ45 loses the only thing that identifies it: a plug is
   recognised by the shape of its NOSE and the latch that clips over it,
   and both of those are small features on a body that is otherwise a
   rounded box. At sixty pixels across, a rounded box with a stalk behind
   it is a jerry can. The owner called it exactly that.

   A WALL OUTLET is the better emblem for this lab anyway, and not only
   because it survives being small:

     - the lab is Networking AND INFRASTRUCTURE, and the outlet is where
       the infrastructure meets the user — the last thing in a structured
       cabling run and the first thing a student actually touches;
     - it is the END OF THE RUN the `terminate` stage builds. A student
       punches down a jack onto solid core and this is the thing the jack
       goes into;
     - a plate carries a PORT LABEL, and the label is what makes it part
       of a system rather than a hole in a wall. Every outlet in a real
       building is labelled and that label is how anybody ever finds the
       other end of the cable;
     - and the second port is BLANKED, which is the fact nobody teaches:
       a two-gang plate with one blank means somebody ran one cable, and
       finding a blank where you needed a live port is a real site visit.

   THREE PARTS, ONE DECISION. The plate is white, the keystone is blue and
   the contacts are gold — three colours, which under the one-colour-per-
   part rule means three parts. They are positioned from ONE table so they
   cannot drift apart, the same arrangement `bench-raid.js` uses for the
   caddy face and for exactly the same reason.
   ===================================================================== */
/* THE OUTLET MUST FIT THE BAY IT STANDS IN, and the first cut did not.

   Drawn 15 units tall on a deck with 7.4 units of clear height above it,
   it went straight up through the shelf above — the same class of mistake
   as the grille declared past the wall's half-width, and it renders
   perfectly happily. The clear height is arithmetic off the shelf table
   and nothing here may exceed it, so it is asserted at load.

   The ports therefore sit SIDE BY SIDE rather than stacked. That is also
   what a double-gang data plate looks like: wide and shallow, because the
   backbox is wide and shallow. */
export const OUTLET = {
  wallW: 11.6, wallH: 6.1, wallT: 1.4,   /* the piece of wall it is mounted on */
  w: 8.6, h: 4.9,                        /* the faceplate */
  plate: 0.5, box: 2.4,
  portW: 2.5, portH: 2.9,                /* each keystone aperture */
  portDX: 1.85,                          /* each port this far off centre */
  jaw: 0.52,                             /* the bars framing the throat */
  foot: 0.55
};
OUTLET.faceZ = -22 + OUTLET.wallT / 2 + OUTLET.box + OUTLET.plate;
OUTLET.total = OUTLET.foot + OUTLET.wallH;

/* THE CLEAR HEIGHT IN A BAY, from the shelf table, so the two cannot
   drift. A deck's top face to the underside of the beam above it. */
export const BAY_CLEAR = (SHELF.levels[1] - SHELF.levels[0]) - SHELF.thick - SHELF.beam;
if (OUTLET.total > BAY_CLEAR) {
  throw new Error("bench-room: the network outlet is " + OUTLET.total.toFixed(1) +
    " units tall and the bay has " + BAY_CLEAR.toFixed(1) +
    " — it would be drawn through the shelf above it.");
}

/* The plate, its backbox, the wall behind it, the screws, the labels AND
   THE BLANK. All one value of white, so it is one part.

   The blank started out in the keystone part and came out BLUE, which
   made two live ports where the whole point is that one is dead. A blank
   insert is the colour of the plate, always — that is how you can see at
   a glance, from across a room, that nobody ran a second cable. */
export function rj45Outlet(x, y) {
  const O = OUTLET;
  const cy = y + O.foot + O.wallH / 2;
  const wz = -22;
  const bz = wz + O.wallT / 2 + O.box / 2;
  const pz = O.faceZ - O.plate / 2;
  const out = [
    /* THE PIECE OF WALL. A faceplate that is not on a wall is a white
       rectangle floating on a shelf, and it is also what makes the plate
       stand out — a bright plate needs something dark immediately behind
       it, and the room's own wall is four metres away. */
    { part: "wall", shape: "rbox", size: [O.wallW, O.wallH, O.wallT], pos: [x, cy, wz], r: 0.22, shade: 0.50 },
    { part: "wall", shape: "rbox", size: [O.wallW + 1.3, O.foot, 5.0], pos: [x, y + O.foot / 2, wz], r: 0.18, shade: 0.40 },
    /* the backbox */
    { part: "backbox", shape: "rbox", size: [O.w - 0.9, O.h - 0.9, O.box], pos: [x, cy, bz], r: 0.12, shade: 0.68 }
  ];

  /* THE FACEPLATE AS A FRAME. Both apertures are real gaps, so the plate
     is the material AROUND them: a bar at each end, one between the two
     ports, and one across the top and bottom spanning both. Material is
     absent only where nothing is drawn. */
  const endW = O.w / 2 - O.portDX - O.portW / 2;
  const midW = 2 * O.portDX - O.portW;
  const barH = (O.h - O.portH) / 2;
  [-1, 1].forEach(function (s) {
    out.push({ part: "plate", shape: "rbox", size: [endW, O.h, O.plate],
      pos: [x + s * (O.w - endW) / 2, cy, pz], r: 0.10, shade: 1.34 });
    out.push({ part: "plate", shape: "rbox", size: [2 * O.portDX + O.portW, barH, O.plate],
      pos: [x, cy + s * (O.h - barH) / 2, pz], r: 0.10, shade: 1.34 });
  });
  out.push({ part: "plate", shape: "rbox", size: [midW, O.h, O.plate], pos: [x, cy, pz], r: 0.08, shade: 1.34 });

  /* the two fixing screws, on the centre line top and bottom */
  [-1, 1].forEach(function (s) {
    out.push({ part: "plate", shape: "cyl", size: [0.72, O.plate * 0.8],
      pos: [x, cy + s * (O.h - barH) / 2, O.faceZ + 0.04], rot: [P2, 0, 0], seg: 14, shade: 1.10 });
    out.push({ part: "plate", shape: "box", size: [0.52, 0.13, 0.18],
      pos: [x, cy + s * (O.h - barH) / 2, O.faceZ + 0.18], r: 0.02, shade: 0.52 });
  });

  /* THE PORT LABELS, one under each port. A label is the whole difference
     between an outlet and a hole in a wall: it is how anybody ever finds
     the other end of the cable, and every outlet in a real building has
     one. */
  [-1, 1].forEach(function (s) {
    out.push({ part: "labels", shape: "box", size: [O.portW - 0.5, 0.62, 0.14],
      pos: [x + s * O.portDX, cy - (O.h - barH) / 2 + 0.1, O.faceZ + 0.08], r: 0.03, shade: 0.46 });
  });

  /* THE BLANK IN THE RIGHT-HAND PORT — the same moulding with no throat,
     in the plate's own white. */
  out.push({ part: "blank", shape: "rbox", size: [O.portW, O.portH, O.plate + 0.35],
    pos: [x + O.portDX, cy, pz + 0.18], r: 0.11, shade: 1.22 });
  out.push({ part: "blank", shape: "box", size: [O.portW - 1.0, 0.28, 0.24],
    pos: [x + O.portDX, cy, pz + 0.58], r: 0.05, shade: 0.90 });
  return out;
}

/* THE KEYSTONE IN THE LEFT-HAND PORT, in blue, plus the patch lead
   plugged into it.

   The throat is drawn as the BARS AROUND THE OPENING, with the latch
   keyway notched up through the top bar — that stepped keyhole is the
   silhouette that says RJ45 and says nothing else, and it is the reason
   this reads at shelf size where a loose plug did not.

   The patch lead is not decoration. A bare plate is a socket; a plate
   with a lead hanging out of it is a LIVE DATA POINT, which is what the
   Networking lab is about, and it is the second thing after the keyhole
   that makes the object unmistakable from across the room. */
export function rj45Jack(x, y) {
  const O = OUTLET;
  const cy = y + O.foot + O.wallH / 2;
  const px = x - O.portDX;
  const jz = O.faceZ - O.plate / 2;
  const w = O.portW, h = O.portH, j = O.jaw;
  const out = [];

  /* the insert's bezel, standing proud of the plate */
  out.push({ part: "keystone", shape: "rbox", size: [w, h, O.plate + 0.45], pos: [px, cy, jz + 0.22], r: 0.11, shade: 1.0 });

  /* the throat: two side bars, a bottom bar, and a top bar in TWO PIECES
     so the latch keyway is a genuine gap */
  const keyW = 0.95, dz = jz + 0.80, dd = 1.25;
  [-1, 1].forEach(function (s) {
    out.push({ part: "keystone", shape: "box", size: [j, h, dd], pos: [px + s * (w - j) / 2, cy, dz], r: 0.04, shade: 0.74 });
    const seg = (w - keyW) / 2;
    out.push({ part: "keystone", shape: "box", size: [seg, j, dd],
      pos: [px + s * (w - seg) / 2, cy + (h - j) / 2, dz], r: 0.04, shade: 0.74 });
  });
  out.push({ part: "keystone", shape: "box", size: [w, j, dd], pos: [px, cy - (h - j) / 2, dz], r: 0.04, shade: 0.74 });
  /* the back of the throat, dark, so the opening reads as a hole with
     something behind it rather than a window onto the shelf */
  out.push({ part: "keystone", shape: "box", size: [w - 2 * j + 0.15, h - 2 * j + 0.15, 0.35],
    pos: [px, cy, jz - 0.55], r: 0.03, shade: 0.26 });

  /* THE PATCH LEAD, LYING ON THE DECK RATHER THAN PLUGGED IN.

     Plugged in, its plug fills the throat — and the throat is the only
     place the eight contacts can be seen. A lead in the socket would have
     hidden the one fact this object exists to carry, which is the same
     mistake as the ribbon cassette on the impact bench sitting over the
     print head. It lies beside the plate instead, nose toward the room,
     which is where a technician's lead actually is thirty seconds before
     they plug it in — and it puts the PLUG and the JACK side by side,
     which is a pair worth seeing together. */
  const lz = -22 + 4.4, ly = y + 0.7;
  out.push({ part: "lead", shape: "rbox", size: [1.5, 1.1, 2.4], pos: [px + 1.1, ly, lz], r: 0.22, shade: 0.90 });
  out.push({ part: "lead", shape: "rbox", size: [1.0, 0.75, 0.8], pos: [px + 1.1, ly + 0.1, lz + 1.5],
    r: 0.14, shade: 1.05 });
  out.push({ part: "lead", shape: "rbox", size: [1.7, 1.3, 1.6], pos: [px + 1.1, ly, lz - 1.9], r: 0.5, shade: 0.78 });
  /* the cable running off along the deck and out of the bay */
  out.push({ part: "lead", shape: "cyl", size: [0.78, 5.0], pos: [px - 1.6, ly, lz - 2.7],
    rot: [0, P2 * 0.72, P2], seg: 12, shade: 0.66 });
  out.push({ part: "lead", shape: "cyl", size: [0.78, 7.5], pos: [px - 7.6, ly, lz - 5.6],
    rot: [0, 0, P2], seg: 12, shade: 0.66 });
  return out;
}

/* EIGHT CONTACTS, HANGING DOWN FROM THE TOP OF THE THROAT, which is where
   they are in a real jack and is why a plug only goes in one way up.

   They were invisible in the first cut for two reasons at once, and both
   are recorded elsewhere in this repo: they were 0.16 units wide, which
   is under a pixel at room scale, and they sat a unit BEHIND the bars
   that frame the opening, so the bars occluded them. Sized off the
   opening now, and drawn at the mouth. */
export function rj45Contacts(x, y) {
  const O = OUTLET;
  const cy = y + O.foot + O.wallH / 2;
  const px = x - O.portDX;
  const jz = O.faceZ - O.plate / 2;
  const open = O.portW - 2 * O.jaw;            /* the clear width of the throat */
  const step = (open - 0.35) / 7;
  return [{ part: "contacts", shape: "box", size: [step * 0.62, 1.15, 0.22],
    pos: [px - (open - 0.35) / 2, cy + 0.42, jz + 1.05],
    rot: [-0.34, 0, 0], r: 0.03, shade: 1.25,
    repeat: { count: 8, step: [step, 0, 0] } }];
}

/* ---- the floor: the two things that stand on it ---- */

/* A PC tower: front bezel with a mesh intake, a power button, and the
   side panel's edge showing so it reads as a box with a side that comes
   off rather than a solid block. */
export function pcTower(x) {
  const w = 6.0, h = 14.0, d = 12.0;
  const out = [
    { part: "case", shape: "rbox", size: [w, h, d], pos: [x, h / 2, -14], r: 0.4, shade: 1.0 },
    /* the front bezel, standing proud */
    { part: "bezel", shape: "rbox", size: [w - 0.3, h - 0.6, 0.7], pos: [x, h / 2, -14 + d / 2 + 0.2], r: 0.3, shade: 1.14 },
    /* the side panel seam */
    { part: "sidepanel", shape: "box", size: [0.12, h - 1.2, d - 1.0], pos: [x + w / 2 + 0.02, h / 2, -14], r: 0.02, shade: 0.7 },
    /* the power button and a drive slot */
    { part: "power", shape: "cyl", size: [0.8, 0.3], pos: [x, h - 1.6, -14 + d / 2 + 0.6], rot: [P2, 0, 0],
      seg: 14, shade: 1.6 },
    { part: "bay", shape: "rbox", size: [w - 2.0, 0.5, 0.4], pos: [x, h - 3.2, -14 + d / 2 + 0.55], r: 0.12, shade: 0.66 },
    /* feet */
    { part: "case", shape: "rbox", size: [w - 1.0, 0.6, 1.6], pos: [x, 0.3, -14 + d * 0.3], r: 0.15, shade: 0.7 },
    { part: "case", shape: "rbox", size: [w - 1.0, 0.6, 1.6], pos: [x, 0.3, -14 - d * 0.3], r: 0.15, shade: 0.7 }
  ];
  /* the mesh intake: bars, because a hole is only a hole where nothing
     is drawn and this renderer has no boolean subtraction */
  for (let i = 0; i < 7; i++) {
    out.push({ part: "intake", shape: "box", size: [w - 2.2, 0.30, 0.30],
      pos: [x, 2.4 + i * 1.0, -14 + d / 2 + 0.6], r: 0.06, shade: 0.62 });
  }
  return out;
}

/* A half-height server rack: posts, a vented door frame, and four 2U
   chassis in it with their bay lamps lit. A rack with nothing in it is a
   wardrobe. */
export function serverRack(x) {
  const w = 15.0, h = 30.0, d = 14.0;
  const out = [
    /* the frame: four posts and a top and bottom */
    { part: "frame", shape: "rbox", size: [w, 1.0, d], pos: [x, 0.5, -16], r: 0.2, shade: 0.86 },
    { part: "frame", shape: "rbox", size: [w, 1.0, d], pos: [x, h - 0.5, -16], r: 0.2, shade: 0.94 }
  ];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
    out.push({ part: "frame", shape: "rbox", size: [1.2, h, 1.2],
      pos: [x + c[0] * (w / 2 - 0.6), h / 2, -16 + c[1] * (d / 2 - 0.6)], r: 0.2, shade: 1.0 });
  });
  /* the side panels, so it is an enclosure */
  [-1, 1].forEach(function (s) {
    out.push({ part: "frame", shape: "box", size: [0.3, h - 2.0, d - 1.6],
      pos: [x + s * (w / 2 - 0.15), h / 2, -16], r: 0.05, shade: 0.78 });
  });
  return out;
}

/* The chassis in the rack, as their own part so the lamps can be their
   own colour — the standing rule that anything changing colour on its own
   is a separate part. */
export function rackChassis(x) {
  const w = 15.0, out = [];
  for (let i = 0; i < 4; i++) {
    const y = 4.5 + i * 5.6;
    out.push({ part: "chassis", shape: "rbox", size: [w - 3.0, 4.4, 12.0], pos: [x, y, -16], r: 0.2, shade: 1.0 });
    /* eight bay faces across the front */
    out.push({ part: "caddies", shape: "rbox", size: [1.15, 3.4, 0.5], pos: [x - 4.55, y, -16 + 6.2], r: 0.1,
      shade: 1.25, repeat: { count: 8, step: [1.3, 0, 0] } });
  }
  return out;
}

export function rackLamps(x) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const y = 4.5 + i * 5.6;
    out.push({ part: "lamps", shape: "box", size: [0.3, 0.3, 0.18], pos: [x - 4.55, y - 1.3, -16 + 6.5],
      r: 0.05, shade: 1.0, repeat: { count: 8, step: [1.3, 0, 0] } });
  }
  return out;
}

/* =====================================================================
   THE SHELF PLAN — one table, because the room, the labels and whatever
   decides what a click opens all have to agree about where a machine is.
   ===================================================================== */
export const SHOWROOM = [
  { key: "printer-laser",   lab: "printer", stage: "imaging",  label: "Laser printer",
    build: function () { return laserPrinter(-38, SHELF.top); },  colour: "laserBody" },
  { key: "printer-inkjet",  lab: "printer", stage: "inkjet",   label: "Inkjet all-in-one",
    build: function () { return inkjetPrinter(-21, SHELF.top); }, colour: "inkjetBody" },
  { key: "printer-thermal", lab: "printer", stage: "thermal",  label: "Thermal label printer",
    build: function () { return thermalPrinter(-5, SHELF.top); }, colour: "thermalBody" },
  { key: "printer-impact",  lab: "printer", stage: "impact",   label: "Dot matrix",
    build: function () { return impactPrinter(10, SHELF.top); },  colour: "impactBody" },

  { key: "power",   lab: "power",   stage: null, label: "Power supply",
    build: function () { return psuBox(-38, SHELF.mid); },    colour: "steel" },
  { key: "wap",     lab: "wap",     stage: null, label: "Wireless router",
    build: function () { return routerBox(-16, SHELF.mid); }, colour: "dark" },
  { key: "display", lab: "display", stage: null, label: "Projector",
    build: function () { return projectorBox(8, SHELF.mid); },  colour: "paper" },

  { key: "mobile",  lab: "mobile",  stage: null, label: "Phone",
    build: function () { return phoneOnStand(-30, SHELF.low); }, colour: "dark" },
  { key: "net",     lab: "net",     stage: null, label: "Network outlet",
    build: function () { return rj45Outlet(2, SHELF.low); },     colour: "paper" },

  { key: "build",   lab: "build",   stage: null, label: "PC tower",
    build: function () { return pcTower(34); },     colour: "dark" },
  { key: "raid",    lab: "raid",    stage: null, label: "Server rack",
    build: function () { return serverRack(46); },  colour: "dark" }
];

/* =====================================================================
   THE NAMED PARTS OF EACH MACHINE.

   One row per feature, in the order a student meets it. Each row becomes
   a real focusable control beside the dock canvas with its own sentence,
   so a machine that follows somebody through an hour of brief and
   calculation is a machine they can ask questions of rather than a
   picture they can spin.

   WHAT A ROW SAYS:

     tag     the `part` value on the primitives that make it up
     label   what the control is called, in words a technician uses
     on      the part this one is SEEN AGAINST — what it is mounted on,
             lies in, or stands in front of. The colour check below reads
             it, and the FIRST row of a machine is its anchor and has no
             `on` because it is the thing everything else sits on.
     colour  a key into ROOM_COLOUR / ROOM_WARM, never a literal, so the
             warm preview palette gets the same treatment
     finish  as scene.js understands it
     spec    the sentence the control carries. It has to be worth reading
             — a fact a technician would use, not a restatement of the
             label. "The fan" is the label; "it pulls air IN, and a supply
             that has stopped moving air is a supply about to fail" is the
             part that is worth a student's attention.

   ADJACENT PARTS MUST DIFFER, AND THAT IS WHY `on` EXISTS.

   This build's own record: the impact bench drew a ribbon cassette at
   #25292e against a platen at #2c3238 — one colour each, every part its
   own colour, both rules obeyed, and the two read as a single black
   cylinder with a fault site invisible inside it. The thing that was
   missing was a statement of WHICH parts are seen against which.

   Blanket "every part must differ from the body" would be the easy check
   and it would be false here: a server rack is genuinely near-black
   frame, near-black chassis and bright lamps, and that hierarchy is the
   skill — finding the lit bay from the aisle. So each row names what it
   is seen against and the gap is held there. */
export const SUB_GAP = 0.06;

export const MACHINE_PARTS = {
  "printer-laser": [
    { tag: "body", label: "The printer body", colour: "laserBody", finish: "plastic",
      spec: "Graphite, heavy, and about the size of a microwave. Weight is the tell: a laser "
        + "carries a fuser, and a fuser is a heated roller assembly." },
    { tag: "tray", label: "The paper tray", on: "body", colour: "alu", finish: "plastic",
      spec: "It pulls all the way out. Most feed faults are found in here — the lift plate, "
        + "the separation pad and the pickup roller are all inside it or just above it." },
    { tag: "well", label: "The output well", on: "body", colour: "dark", finish: "matte",
      spec: "Pages land face DOWN, so a job comes out in the right order. A machine that "
        + "delivers face up is one you have to collate by hand." },
    { tag: "panel", label: "The control panel", on: "body", colour: "yellow", finish: "plastic",
      spec: "Where the page count and the error code live. Ask for the count before quoting: "
        + "it decides whether this machine is worth a maintenance kit." },
    { tag: "sheet", label: "The page in the well", on: "well", colour: "paper", finish: "matte",
      spec: "A printed page is evidence. Toner that rubs off with a thumb is a fuser fault, "
        + "not a toner fault — the powder reached the paper and nothing melted it on." }
  ],
  "printer-inkjet": [
    { tag: "body", label: "The all-in-one body", colour: "inkjetBody", finish: "plastic",
      spec: "Light, white and half the height of the laser. Cheap to buy and dear to run — "
        + "the cost is in the cartridges, which is the whole argument on a fleet." },
    { tag: "scanner", label: "The scanner lid", on: "body", colour: "aluPale", finish: "plastic",
      spec: "What makes it an all-in-one: print, scan, copy and usually fax. The hinge lifts "
        + "so a book can lie on the glass." },
    { tag: "tray", label: "The output tray", on: "body", colour: "mid", finish: "plastic",
      spec: "Pulled out at the front. Pages come out face UP on most inkjets, so a long job "
        + "arrives in reverse order." },
    { tag: "panel", label: "The control panel", on: "body", colour: "blue", finish: "plastic",
      spec: "Ink levels live here, and they are an estimate rather than a measurement. A "
        + "nozzle check printed from this panel is worth more than the bar graph." }
  ],
  "printer-thermal": [
    { tag: "body", label: "The label printer body", colour: "thermalBody", finish: "plastic",
      spec: "Small, near-black and built round a roll. Nothing in it is a consumable except "
        + "the paper — there is no toner and no ink to buy." },
    { tag: "roll", label: "The media roll", on: "body", colour: "paper", finish: "matte",
      spec: "Heat-sensitive stock. The coating is on ONE side, so a roll loaded the wrong way "
        + "round runs through perfectly and comes out blank." },
    { tag: "tear", label: "The tear bar", on: "body", colour: "alu", finish: "steel",
      spec: "A serrated edge to snap the label off against. It is also the first thing to "
        + "check when labels come out with a torn leading edge." },
    { tag: "label", label: "The label just printed", on: "tear", colour: "pale", finish: "matte",
      spec: "Direct thermal print FADES — heat, sunlight and friction all take it off. That "
        + "is why a shipping label is fine and an asset tag is not." },
    { tag: "lever", label: "The latch", on: "body", colour: "lever", finish: "plastic",
      spec: "Orange on purpose, so a hand finds it without looking. It opens the head away "
        + "from the platen, which is how the roll is changed and the head cleaned." }
  ],
  "printer-impact": [
    { tag: "body", label: "The dot matrix body", colour: "impactBody", finish: "plastic",
      spec: "Wide, low and loud. It is still bought for one reason: it strikes the page, so "
        + "it is the only technology here that can fill in a multi-part form." },
    { tag: "lid", label: "The carriage lid", on: "body", colour: "aluPale", finish: "plastic",
      spec: "Lifts to reach the head and the ribbon. The head runs HOT — it is a bank of pins "
        + "being fired thousands of times a second — so it is left to cool before it is touched." },
    { tag: "tractor", label: "The tractor slot", on: "body", colour: "dark", finish: "matte",
      spec: "Where the fanfold comes in. The sprockets grip the holes down the margins, which "
        + "is what keeps a continuous form in register over a hundred pages." },
    { tag: "fanfold", label: "The fanfold paper", on: "body", colour: "paper", finish: "matte",
      spec: "One continuous sheet, folded. It feeds from the box on the floor, up through the "
        + "tractors and out of the top — so the box has to sit BELOW the printer, not beside it." }
  ],
  power: [
    { tag: "body", label: "The supply case", colour: "alu", finish: "steel",
      spec: "A sealed steel box, and it stays sealed. The primary capacitors hold a lethal "
        + "charge after the mains is pulled — this is the one part in the build nobody opens." },
    { tag: "fan", label: "The fan", on: "body", colour: "dark", finish: "matte",
      spec: "It pulls air in through the case and pushes it out of the back. A supply that has "
        + "gone quiet has not got better; it has stopped moving air." },
    { tag: "grille", label: "The fan guard", on: "fan", colour: "aluPale", finish: "steel",
      spec: "Bars over the blades. Dust packs into this grille first, and a blocked one is "
        + "worth checking before anything is replaced." },
    { tag: "inlet", label: "The IEC inlet", on: "body", colour: "mid", finish: "plastic",
      spec: "C14, the kettle lead. The same connector is on the monitor and the UPS, which is "
        + "how a lead gets borrowed and a machine gets blamed." },
    { tag: "rocker", label: "The rocker switch", on: "body", colour: "red", finish: "plastic",
      spec: "The real switch. The button on the front of the case only ASKS the board to shut "
        + "down; this one cuts the mains, and on some supplies it is the only way to clear a latch." }
  ],
  wap: [
    { tag: "body", label: "The router body", colour: "dark", finish: "plastic",
      spec: "One box doing four jobs: router, switch, firewall and access point. Most faults "
        + "blamed on \"the wifi\" are in one of the other three." },
    { tag: "antennas", label: "The four antennas", on: "body", colour: "alu", finish: "plastic",
      spec: "Four is a specification, not a style. Each one is a radio chain, and the chains "
        + "cap how many spatial streams the unit can run at once." },
    { tag: "lamps", label: "The status lamps", on: "body", colour: "green", finish: "plastic",
      spec: "Read them before touching anything. A dark internet lamp with a lit wifi lamp "
        + "says the radio is fine and the line is not — which is a different call entirely." }
  ],
  display: [
    { tag: "body", label: "The projector body", colour: "paper", finish: "plastic",
      spec: "Pale, wide and flat, and it lives on a trolley. Throw ratio is what decides where "
        + "it stands: about 1.8 to 1 on a hall unit, so a twelve-foot image needs twenty feet." },
    { tag: "recess", label: "The lens recess", on: "body", colour: "mid", finish: "matte",
      spec: "The lens is set INTO the case and offset to one side, which is why a projector "
        + "sitting square to the wall still throws an image that is off centre." },
    { tag: "barrel", label: "The lens barrel", on: "recess", colour: "alu", finish: "plastic",
      spec: "It turns for focus and, on most units, zooms. A soft image at one edge is usually "
        + "keystone or a tilted unit, not focus." },
    { tag: "glass", label: "The lens glass", on: "barrel", colour: "dark", finish: "glass",
      spec: "The darkest thing on the machine. A dirty lens throws a soft dark patch that moves "
        + "with the image — a dead pixel on the panel does not move at all." },
    { tag: "intake", label: "The intake grille", on: "body", colour: "blue", finish: "matte",
      spec: "A lamp runs at a few hundred degrees. Block this grille with a curtain or a "
        + "stacked chair and the unit shuts down mid-lesson and blames itself." },
    { tag: "foot", label: "The levelling foot", on: "body", colour: "yellow", finish: "plastic",
      spec: "Screwing it out tilts the unit up — and tilting is exactly what puts a trapezium "
        + "on the wall. Keystone correction fixes the SHAPE and costs resolution doing it." }
  ],
  mobile: [
    { tag: "body", label: "The handset", colour: "dark", finish: "plastic",
      spec: "About 70 mm across. Everything in it is stacked in layers, and the order of those "
        + "layers is what decides how far in a repair has to go." },
    { tag: "screen", label: "The screen", on: "body", colour: "pale", finish: "glass",
      spec: "Glass, digitizer and panel. Glass and digitizer are ONE part to buy on a handset "
        + "like this; the panel behind them is a separate part and a separate price." },
    { tag: "stand", label: "The stand", on: "body", colour: "alu", finish: "plastic",
      spec: "It holds the phone at an angle, which is how a screen fault gets found: an "
        + "artefact that changes as you tilt is on the surface, not in the picture." }
  ],
  net: [
    { tag: "plate", label: "The faceplate", colour: "paper", finish: "plastic",
      spec: "Two gangs, and it screws to the backbox rather than to the wall. This is the end "
        + "of a structured cabling run, not a socket somebody added." },
    { tag: "wall", label: "The wall", on: "plate", colour: "mid", finish: "matte",
      spec: "The cable runs inside it, up to a containment route and back to the patch panel. "
        + "What is behind the plate is what decides whether a second port is an hour or a day." },
    { tag: "backbox", label: "The backbox", on: "wall", colour: "alu", finish: "metal",
      spec: "The box sunk into the wall. Its depth is what limits how tight the cable can be "
        + "bent behind the jack — and a kinked bend is a real cause of failed certification." },
    { tag: "labels", label: "The port labels", on: "plate", colour: "dark", finish: "matte",
      spec: "The label is the whole difference between an outlet and a hole in a wall. It is "
        + "how anybody ever finds the other end, and it should match the patch panel exactly." },
    { tag: "blank", label: "The blanked port", on: "plate", colour: "paper", finish: "plastic",
      sameColourAs: "plate",
      spec: "A moulding with no throat in it. A blank means somebody ran ONE cable and fitted a "
        + "two-gang plate — so the second port is not dead, it does not exist." },
    { tag: "keystone", label: "The keystone jack", on: "plate", colour: "blue", finish: "plastic",
      spec: "It clips into the plate from behind and it is punched down onto SOLID core. The "
        + "stepped keyhole at the top is the latch way, and it is why a plug only goes in one way up." },
    { tag: "contacts", label: "The eight contacts", on: "keystone", colour: "yellow", finish: "metal",
      spec: "Four pairs, hanging down from the top of the throat. They are gold-plated because "
        + "a corroded contact is an intermittent link, which is the worst fault to be sent to." },
    { tag: "lead", label: "The patch lead", on: "plate", colour: "green", finish: "plastic",
      spec: "STRANDED, not solid — it is made to be flexed and plugged in, and it is crimped "
        + "into a plug rather than punched down. Using solid core as a patch lead breaks it." }
  ],
  build: [
    { tag: "case", label: "The case", colour: "dark", finish: "plastic",
      spec: "A mid tower. Its size decides what fits: board form factor, graphics card length, "
        + "cooler height and radiator width are all case measurements before they are part ones." },
    { tag: "bezel", label: "The front bezel", on: "case", colour: "alu", finish: "plastic",
      spec: "It clips off. The front panel connectors, the intake filter and the front fans "
        + "are all behind it, and it comes off before any of them can be reached." },
    { tag: "intake", label: "The mesh intake", on: "bezel", colour: "mid", finish: "matte",
      spec: "Air comes IN here and leaves at the back and the top. A machine standing on carpet "
        + "against a wall has neither, and it will throttle long before it fails." },
    { tag: "power", label: "The power button", on: "bezel", colour: "green", finish: "plastic",
      spec: "It is a momentary switch wired to the board, not a mains switch. Holding it for "
        + "four seconds is a hardware shutdown and is the last resort, not the first." },
    { tag: "bay", label: "The drive bay", on: "bezel", colour: "aluPale", finish: "plastic",
      spec: "A 5.25 inch bay. On a modern build it is usually empty, and on this one it is "
        + "what an optical drive would go in if the job still needs one." },
    { tag: "sidepanel", label: "The side panel", on: "case", colour: "beige", finish: "metal",
      spec: "The LEFT panel comes off to reach the board. Take the right one off as well on a "
        + "build and the cable routing behind the tray stops being a fight." }
  ],
  raid: [
    { tag: "frame", label: "The rack frame", colour: "dark", finish: "metal",
      spec: "Nineteen inches between the rails, and height is counted in U. Everything in here "
        + "is sized in those two numbers and nothing else." },
    { tag: "chassis", label: "The four servers", on: "frame", colour: "alu", finish: "metal",
      spec: "Four 2U units. Each carries its own controller and its own array — a failed drive "
        + "in one of them is nothing to do with the other three." },
    { tag: "caddies", label: "The drive caddies", on: "chassis", colour: "aluPale", finish: "plastic",
      spec: "Eight bays a unit, hot swap. The caddy is what makes a drive replaceable without "
        + "downing the machine, and it is also what makes pulling the WRONG one so easy." },
    { tag: "lamps", label: "The bay lamps", on: "caddies", colour: "green", finish: "plastic",
      glow: 0.85,
      spec: "Activity and fault are TWO lamps, not one lamp that changes colour. Fault lit with "
        + "activity dark is a dead drive; both lit is a rebuild, and they look alike from the aisle." }
  ]
};

/* THE CHECK, AT LOAD, ON BOTH PALETTES.

   Three claims, and each one has a failure behind it somewhere in this
   repo:

   1. EVERY PRIMITIVE IS CLAIMED. A machine with an untagged primitive
      draws a feature the student has no control for — which is this
      build's own rule broken silently, since the canvas is scenery and
      the buttons are the interface. Held in `machineBench` where the
      primitives actually are.

   2. EVERY ROW IS SEEN AGAINST SOMETHING IT DIFFERS FROM. The `on` gap,
      above.

   3. NO TWO ROWS ON ONE MACHINE SHARE A COLOUR, unless the row says so
      and says why. The outlet's blank IS the plate's white, deliberately
      — that is how you can tell from across a room that nobody ran a
      second cable — so it declares `sameColourAs` and is exempt. An
      undeclared clash is two parts reading as one. */
export function checkMachinePartsReadApart(C) {
  C = C || ROOM_COLOUR;
  Object.keys(MACHINE_PARTS).forEach(function (key) {
    const rows = MACHINE_PARTS[key];
    const byTag = {};
    rows.forEach(function (r) { byTag[r.tag] = r; });

    rows.forEach(function (r, i) {
      if (!C[r.colour]) {
        throw new Error("bench-room: " + key + "/" + r.tag + " asks for colour \"" +
          r.colour + "\", which is not in the palette.");
      }
      if (i === 0) {
        if (r.on) {
          throw new Error("bench-room: " + key + "'s first row (" + r.tag + ") is its anchor " +
            "and must not declare `on` — it is the thing the others are seen against.");
        }
        return;
      }
      if (!r.on || !byTag[r.on]) {
        throw new Error("bench-room: " + key + "/" + r.tag + " does not say what it is seen " +
          "against. Every row after the anchor needs `on`, naming another tag on this machine.");
      }
      const gap = Math.abs(lum(C[r.colour]) - lum(C[byTag[r.on].colour]));
      if (r.sameColourAs) return;             /* declared, and checked below */
      if (gap < SUB_GAP) {
        throw new Error("bench-room: " + key + "/" + r.tag + " (" + C[r.colour] + ") sits on " +
          r.on + " (" + C[byTag[r.on].colour] + ") and they are only " + gap.toFixed(3) +
          " apart in luminance. Two parts that close read as one — minimum " + SUB_GAP + ".");
      }
    });

    const seen = {};
    rows.forEach(function (r) {
      const c = C[r.colour];
      if (seen[c] && r.sameColourAs !== seen[c]) {
        throw new Error("bench-room: " + key + " gives " + r.tag + " and " + seen[c] +
          " the same colour (" + c + "). Say why with `sameColourAs` or give one of them " +
          "its own, because two parts in one colour read as one part.");
      }
      if (!seen[c]) seen[c] = r.tag;
    });
    rows.forEach(function (r) {
      if (r.sameColourAs && C[r.colour] !== C[(byTag[r.sameColourAs] || {}).colour]) {
        throw new Error("bench-room: " + key + "/" + r.tag + " says it shares a colour with " +
          r.sameColourAs + " and does not.");
      }
    });
  });
  return true;
}
checkMachinePartsReadApart(ROOM_COLOUR);
checkMachinePartsReadApart(ROOM_WARM);

/* ---------------------------------------------------------------------
   THE BENCH
   --------------------------------------------------------------------- */
export function roomBench(view) {
  view = view || {};
  /* `warm` swaps the ROOM's palette only — timber and a warm wall. It is
     a preview switch, not a default: both are outside and inside the
     royal six respectively, and the owner chooses. */
  const C = view.warm ? ROOM_WARM : ROOM_COLOUR;
  const parts = [];

  parts.push({ key: "room", label: "The room", build: roomShell(), finish: "matte",
    scale: ROOM_DRAW, pos: [0, 0, 0], color: C.wall,
    spec: "1 unit = 40 mm", note: "Four metres across. Everything in it is a lab." });
  parts.push({ key: "lights", label: "The lights", build: roomLights(), finish: "matte",
    scale: ROOM_DRAW, pos: [0, 0, 0], color: C.pale, glow: 0.30,
    spec: "Two ceiling panels", note: "" });
  parts.push({ key: "shelving", label: "The shelving", build: shelving(), finish: "metal",
    scale: ROOM_DRAW, pos: [0, 0, 0], color: C.steel,
    spec: "Five decks, boltless", note: "" });
  parts.push({ key: "stock", label: "Paper stock", build: shelfStock(), finish: "matte",
    scale: ROOM_DRAW, pos: [0, 0, 0], color: C.paper,
    spec: "Bulk low, reams high", note: "" });

  SHOWROOM.forEach(function (m) {
    parts.push({ key: m.key, label: m.label, build: m.build(), finish: "plastic",
      scale: ROOM_DRAW, pos: [0, 0, 0], color: C[m.colour] || C.pale,
      spec: m.stage ? "Opens the " + m.lab + " lab at its own bench" : "Opens the " + m.lab + " lab",
      note: "" });
  });

  /* THE OUTLET'S KEYSTONE AND ITS CONTACTS, separately, for the same
     reason the rack's lamps are separate: one colour per part. A white
     plate, a blue jack and gold contacts is three colours, so it is three
     parts, all three positioned from the one OUTLET table so they cannot
     drift apart. Neither carries a SHOWROOM entry, so neither invites a
     click of its own — the plate is what opens the lab. */
  parts.push({ key: "net-jack", label: "The keystone jack", build: rj45Jack(2, SHELF.low),
    finish: "plastic", scale: ROOM_DRAW, pos: [0, 0, 0], color: C.blue,
    spec: "One port live, one blanked", note: "" });
  parts.push({ key: "net-contacts", label: "Eight contacts", build: rj45Contacts(2, SHELF.low),
    finish: "metal", scale: ROOM_DRAW, pos: [0, 0, 0], color: C.yellow,
    spec: "Four pairs", note: "" });

  /* the rack's innards, separately, so the lamps carry their own colour */
  parts.push({ key: "raid-chassis", label: "The chassis in the rack", build: rackChassis(46),
    finish: "metal", scale: ROOM_DRAW, pos: [0, 0, 0], color: C.mid, spec: "Four 2U units", note: "" });
  parts.push({ key: "raid-lamps", label: "Bay lamps", build: rackLamps(46),
    finish: "plastic", scale: ROOM_DRAW, pos: [0, 0, 0], color: C.green, glow: 0.85,
    spec: "Eight bays a unit", note: "" });

  return {
    kind: "bench",
    title: "The workshop",
    caption: "Every lab is a machine in here. The four printers are four technologies, not four "
      + "pictures of one — and the rack and the tower stand on the floor because that is where "
      + "a rack and a tower stand.",
    board: null, decor: [], parts: parts,
    /* FRAMED FLOOR TO CEILING, and the number came off a measurement
       rather than off the width.

       `fitWidth` fits WIDTH, and until today `frustumOK` only ever looked
       at width too — so the first value here was swept clean at all four
       canvas widths while the four printers on the top deck were sliced
       off by the top edge of the frame in every render. The engine now
       reports `outY` alongside `out`, and this camera is set from it.

       Visible height is fitWidth / aspect, so the WIDEST canvas is the
       worst case, not the narrowest: a laptop at aspect 2.1 shows about
       50 units of height against the room's 43 drawn. The target sits at
       21 rather than 17 because the subject is the whole room now — the
       ceiling panels the owner photographed are half of what makes it a
       lit room rather than a grey void. */
    camera: { dist: 78, fitWidth: 106, yaw: 0.16, pitch: 0.13, target: [-4, 21, -12],
              min: 30, max: 260 }
  };
}

/* =====================================================================
   THE RESTING MACHINE — what the dock shows on a step that has no bench.

   The owner's requirement is that the 3D model is present for ALL the
   steps, centred, and stays in front of the student. Thirteen stages
   across the eight labs carry no bench of their own: they are a brief to
   read, a table to check, a calculation to do. Those steps used to be
   text and nothing else, and `verify/stage-machines.mjs` carried a
   thirteen-entry NO_MACHINE exemption list saying so.

   The honest thing to put there is the LAB'S OWN MACHINE — the same
   object the student clicked in the showroom to get in. Not a decoration
   and not a stand-in for a bench: it is the thing the job is about,
   sitting on the bench while they read the brief for it, which is what
   the real desk looks like. It also means the exemption list can go.

   ONE TABLE, and it is derived from SHOWROOM rather than typed again, so
   a machine cannot be renamed in one place and go missing in the other.
   The printer lab is the only one that needs a choice, because it owns
   four technologies; `restingBench` takes a hint for it.
   ===================================================================== */
export const RESTING = (function () {
  const byLab = {};
  SHOWROOM.forEach(function (m) { if (!byLab[m.lab]) byLab[m.lab] = m.key; });
  return byLab;
})();

/* Every lab in the registry must have a machine to rest on. Held here
   rather than in the runner, because this is the table that knows. */
export function restingKeyFor(lab, hint) {
  if (hint) {
    const exact = SHOWROOM.filter(function (m) { return m.lab === lab && m.stage === hint; })[0];
    if (exact) return exact.key;
  }
  return RESTING[lab] || null;
}

/* The machine alone, on a plain ground, framed close. Built from the same
   SHOWROOM entry the showroom draws, so the object a student clicked and
   the object that follows them into the lab are the same geometry. */
export function machineBench(key, view) {
  view = view || {};
  const C = view.warm ? ROOM_WARM : ROOM_COLOUR;
  const m = SHOWROOM.filter(function (e) { return e.key === key; })[0];
  if (!m) throw new Error("bench-room: no showroom machine called \"" + key + "\"");

  /* THE MACHINE IS BUILT AT ITS SHELF POSITION, so it has to be brought
     back to the origin rather than drawn wherever the shelf put it. Its
     own builder takes (x, y) and there is no second entry point, so the
     offset is undone with the part's `pos` — which is what `pos` is for
     and costs nothing. The y offset is the deck it stands on. */
  const onDeck = /^printer-/.test(m.key) ? SHELF.top
    : (m.key === "power" || m.key === "wap" || m.key === "display") ? SHELF.mid
    : (m.key === "mobile" || m.key === "net") ? SHELF.low : 0;
  const X = { "printer-laser": -38, "printer-inkjet": -21, "printer-thermal": -5,
              "printer-impact": 10, power: -38, wap: -16, display: 8,
              mobile: -30, net: 2, build: 34, raid: 46 }[m.key];

  /* EVERY PRIMITIVE THIS MACHINE IS MADE OF, from every builder that
     contributes to it. The outlet and the rack are each built by three
     functions rather than one, and in the room those three are separate
     parts so the jack can be blue and the lamps green. Here they are all
     just primitives with tags on them, and the tags decide the parts —
     which means the outlet's plate, wall, backbox, labels, blank,
     keystone, contacts and patch lead are eight named things a student
     can ask about instead of three. */
  const build = m.build()
    .concat(m.key === "net" ? rj45Jack(2, SHELF.low).concat(rj45Contacts(2, SHELF.low)) : [])
    .concat(m.key === "raid" ? rackChassis(46).concat(rackLamps(46)) : []);

  /* GROUPED BY TAG, IN THE TABLE'S ORDER — not in the order the
     primitives happen to come out of the builders, because that order is
     an implementation detail and the control list is something a student
     reads top to bottom. */
  const rows = MACHINE_PARTS[m.key];
  if (!rows) {
    throw new Error("bench-room: \"" + m.key + "\" has no entry in MACHINE_PARTS, so every " +
      "feature on it would be one unnamed lump. Every machine names its parts.");
  }
  const bag = {};
  rows.forEach(function (r) { bag[r.tag] = []; });

  /* NOTHING MAY BE DRAWN THAT THE STUDENT CANNOT ASK ABOUT.

     The canvas is scenery and the buttons are the interface — that is
     this build's founding rule for benches, and an untagged primitive
     breaks it quietly: it renders, it looks right, and it has no control.
     Held here rather than in a verifier because this is where the
     primitives are, and because a machine that grows a feature should
     fail at load rather than ship a nameless one. */
  build.forEach(function (b, i) {
    if (!b.part) {
      throw new Error("bench-room: primitive " + i + " of \"" + m.key + "\" (a " + b.shape +
        ") carries no `part` tag, so it would be drawn with no control beside it.");
    }
    if (!bag[b.part]) {
      throw new Error("bench-room: \"" + m.key + "\" draws a primitive tagged \"" + b.part +
        "\" and MACHINE_PARTS has no row for it.");
    }
    bag[b.part].push(b);
  });

  const parts = rows.map(function (r) {
    if (!bag[r.tag].length) {
      throw new Error("bench-room: MACHINE_PARTS names \"" + r.tag + "\" on " + m.key +
        " and nothing on the machine carries that tag. A control with no geometry is a " +
        "button that points at nothing.");
    }
    const p = {
      key: m.key + "/" + r.tag, label: r.label, build: bag[r.tag],
      finish: r.finish, scale: 1, pos: [-X, -onDeck, 22],
      color: C[r.colour], spec: r.spec, note: ""
    };
    if (r.glow) p.glow = r.glow;
    return p;
  });

  /* FRAMED FROM THE MACHINE'S OWN SIZE, not from a number picked by eye.
     Every fitWidth guessed from a dimension in this build has been wrong,
     twice badly enough to lose parts off the frame — so the extent is
     measured off the primitives that were just built and the frame is
     taken from the LARGER of width and height, because the checker only
     ever looked at width and that is exactly how the top shelf got cut. */
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity,
      z0 = Infinity, z1 = -Infinity;
  parts.forEach(function (p) {
    p.build.forEach(function (b) {
      const sz = b.size || [1, 1, 1];
      /* HALF-extents. The first cut used the full size as a half-extent
         and came out at twice the machine, which reads as a correct-
         looking number that frames a phone as if it were a wardrobe. A
         `repeat` steps copies along an axis, so its span counts too. */
      let hx = Math.max(sz[0] || 0, sz[2] || 0) / 2, hy = (sz[1] || 1) / 2;
      let cx = b.pos[0], cy = b.pos[1];
      if (b.repeat && b.repeat.count > 1) {
        const st = b.repeat.step || [0, 0, 0], n = b.repeat.count - 1;
        hx += Math.abs(st[0] * n) / 2; hy += Math.abs(st[1] * n) / 2;
        cx += st[0] * n / 2; cy += st[1] * n / 2;
      }
      const hz = Math.max(sz[2] || 0, sz[0] || 0) / 2, cz = b.pos[2] + p.pos[2];
      x0 = Math.min(x0, cx + p.pos[0] - hx); x1 = Math.max(x1, cx + p.pos[0] + hx);
      y0 = Math.min(y0, cy + p.pos[1] - hy); y1 = Math.max(y1, cy + p.pos[1] + hy);
      z0 = Math.min(z0, cz - hz); z1 = Math.max(z1, cz + hz);
    });
  });

  /* FRAME FROM BOTH AXES. Visible height is fitWidth / aspect, so the
     WIDEST canvas is the worst case for a tall machine — the server rack
     is 44 units tall and 20 wide, and framing it on width alone is
     exactly how the four printers on the top shelf got sliced off. 2.2 is
     the widest aspect a dock canvas reaches on a desktop. Swept against
     frustumOK afterwards rather than trusted: every fitWidth reasoned
     from a dimension in this build has been wrong at least once. */
  /* THE FRAME IS DERIVED FROM WHAT THE CHECKER DEMANDS, not from a guess.

     Two goes at this were wrong, both because the formula was reasoned
     about instead of measured. The first took the x extent only, and the
     power supply — a deep box seen at yaw 0.55 — came out cropped down
     its right-hand side, because turning a machine projects its DEPTH
     into screen width. The second added the depth and still lost nine
     machines of eleven at the wider canvas widths.

     What settled it was asking what `frustumOK` actually tests: the
     BOUNDING SPHERE of each part. A sphere of radius R needs 2R of frame
     on both axes whatever the machine is turned to, and visible height is
     fitWidth / aspect — so the binding constraint is

         fitWidth  >=  2R x aspect_max

     The dock caps its canvas at 760 by 380, so the widest aspect a
     student ever gets is 2.0, and 2.15 leaves a margin. Swept across all
     eleven machines at four canvas widths rather than trusted: see
     verify/machine-frame.mjs. */
  const R = 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0);
  const wide = 2 * R * 2.15;

  return {
    kind: "bench",
    title: m.label,
    caption: "The machine this job is about. It is here on every step — turn it, "
      + "and pick a part to read what it is.",
    board: null, decor: [], parts: parts,
    /* THE TARGET IS THE ORIGIN IN Z, AND THAT WAS WRONG AT FIRST.

       Each machine is built at its shelf position and brought back to the
       middle with the part's `pos`, which cancels x AND z — the builders
       put everything at z = -22 and `pos` adds +22, so the machine ends
       up at z = 0. The camera was still aimed at z = 22, forty-four units
       past it, so the power supply rendered as a small object in the
       top-right corner of an empty canvas. It looked like a framing
       number that needed tuning and it was a coordinate that was wrong. */
    camera: { dist: wide * 0.95, fitWidth: wide, yaw: 0.55, pitch: 0.20,
              target: [0, (y0 + y1) / 2, 0], min: wide * 0.35, max: wide * 3.2 }
  };
}
