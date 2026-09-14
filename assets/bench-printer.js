/* =====================================================================
   A+ Core1 Under the Hood Labs — the printer bench

   A laser printer cut open down its length, so the paper path runs left to
   right across the frame and every one of the seven imaging steps is a
   thing you can point at.

   WHY A SIDE CUTAWAY

   The build bench cost three renders to a lesson about occlusion: draw
   hardware the way it really sits and the interesting parts hide behind
   each other. A printer is worse — everything happens inside a closed box
   around a drum, stacked front to back.

   So this is deliberately 2.5D. Depth exists, but nothing important is
   behind anything else: the camera looks along Z at a wall of components
   laid out in X and Y. Occlusion is designed out rather than fought.

   THE SEVEN STEPS ARE THE POINT

   The owner's objectives call the laser imaging process "asked directly
   and repeatedly", and it is asked IN ORDER. So the model lays the seven
   stations out in the order the paper and the drum actually meet them,
   left to right and around the drum, and each one carries a numbered pip.
   A student who has watched a sheet cross this frame has the sequence.

   Same two rules as every bench here: the canvas is scenery and each
   station is a real focusable button; and one colour per part, so the
   station bodies stay grey and the pips carry the verdict.

   SURFACES

   This bench declared none for most of its life, and nor did eleven of
   the thirteen. The reason turned out to be an engine fault rather than a
   choice: surface.js handed each painter's grey HEIGHT canvas to three.js
   as a tangent-space NORMAL map, and a normal map with blue at 128 has
   every normal lying flat in the surface at maximum strength. Faint
   moulding specks came back as television static, so nobody used skins
   and nobody wrote down why. With the blue channel raised the painters do
   what they were written to do, so the parts here now say what they are
   made of: moulded ABS on the case, rubber on the tyres and the pads,
   brushed steel on the lift plate.
   ===================================================================== */

const P2 = Math.PI / 2;

/* The drum, and everything is placed relative to it. */
const DX = 0, DY = 5.6, DR = 2.2;
const DEPTH = 4.4;                 /* how wide the rollers are, front to back */
const PATH_Y = DY - DR - 0.75;     /* where the paper runs under the drum */

/* =====================================================================
   THE FEED AREA, BUILT FROM THE OWNER'S ANNOTATED PHOTOGRAPH

   The owner supplied a shot of a LaserJet Pro with its feed door open and
   four things labelled on it in their own hand: SEPARATION PADS, PICKUP
   ROLLERS, GEAR DRIVE, TRAY LIFT PLATE.

   Three of those four were not in this model at all, and the fourth was
   wrong. What the photograph settles:

   - There are TWO separation pads, not one, and they are up on the deck
     the paper climbs over, FACING the roller rather than under it. The
     friction face is a pale cream, not black rubber, set into a moulded
     teal-green carrier — which is how you find one on a machine you have
     never opened before.
   - The pickup rollers sit on ONE steel shaft spanning the tray, carrying
     four tyres: two deeply treaded ones in the middle doing the picking,
     and a plain barrel outboard on each side.
   - The GEAR DRIVE is a white plastic gear on the near end of that shaft,
     with a smaller one at the far end. It is the part the owner labelled,
     and it is what a technician looks at when the machine grinds.
   - The TRAY LIFT PLATE is a wide flat plate under the paper, hinged at
     the far end and pushed up at the roller end by TWO coil springs. It
     is why a nearly empty tray still feeds, and a collapsed one is a
     no-feed the student will otherwise blame on the roller.

   Why this matters more than it looks: the tray's own note in this file
   has always said it is "the first thing to look at when one sheet picks
   up two", and the part that holds the second sheet back was not drawn.
   The words claimed something the model contradicted.
   ===================================================================== */
const FEED_X = -6.2;               /* the pickup shaft, in X */
const FEED_R = 0.72;               /* the treaded tyres' radius */
const FEED_Y = 2.86;               /* the shaft's centre height */
const STACK_TOP = FEED_Y - FEED_R; /* a full tray touches the tyre here */

/* The separation pads face the tyre across the nip, just downstream. */
const SEP_X = FEED_X + 0.80;
const SEP_TOP = STACK_TOP + 0.05;
const SEP_Z = 1.25;                /* one pad either side of the centre */

/* The lift plate, hinged at the far end of the tray and rising at the
   roller end. TRAY_X0/X1 are the tray's own span, so the plate cannot be
   longer than the thing it lives in. */
const TRAY_X0 = -8.1, TRAY_X1 = -1.9;
const LIFT_TILT = -0.075;          /* negative raises the -x (roller) end */
const LIFT_X = -5.1, LIFT_Y = 1.42;
const SPRING_X = -7.0, SPRING_Z = 1.5;

/* THE PAD HAS TO BE AT THE NIP, OR IT IS NOT A SEPARATION PAD.

   Everything above is a number, and a number that drifts turns the pad
   into a lump of plastic sitting near a roller. What makes it the part
   that holds the second sheet back is that it presses on the SAME line
   the tyre picks from. Same rule as the caddy face and the display
   stack: where the arrangement is regular, compute it rather than
   nudging until a render looks right. */
(function checkFeedNip() {
  const gap = Math.abs(SEP_TOP - (FEED_Y - FEED_R));
  if (gap > 0.35) {
    throw new Error("bench-printer: the separation pad's face is " + gap.toFixed(2) +
      " away from the pickup tyre's contact line. It has to meet the sheet at the " +
      "nip — anywhere else and nothing holds the second sheet back, while the " +
      "tray's note goes on telling the student this is what to check for multi-feeds.");
  }
  const along = SEP_X - FEED_X;
  if (along <= 0 || along > FEED_R * 2.2) {
    throw new Error("bench-printer: the separation pad is at x offset " + along.toFixed(2) +
      " from the pickup shaft. It belongs just DOWNSTREAM of the tyre (0 to " +
      (FEED_R * 2.2).toFixed(2) + "): the roller takes the top sheet and drags it " +
      "across the pad, which is what parts the two.");
  }
  if (LIFT_X - 2.8 < TRAY_X0 || LIFT_X + 2.8 > TRAY_X1) {
    throw new Error("bench-printer: the tray lift plate runs outside the tray it sits in.");
  }
})();

/* Station positions, in the order the process happens. `n` is the step
   number, which is drawn on nothing and said in words everywhere. */
export const STEPS = [
  { key: "processing",   n: 1, label: "Processing",   at: [-7.4, 9.4] },
  { key: "charging",     n: 2, label: "Charging",     at: [DX - 0.2, DY + DR + 0.8] },
  { key: "exposing",     n: 3, label: "Exposing",     at: [-5.4, 9.0] },
  { key: "developing",   n: 4, label: "Developing",   at: [DX - DR - 1.0, DY] },
  { key: "transferring", n: 5, label: "Transferring", at: [DX, DY - DR - 0.75] },
  { key: "fusing",       n: 6, label: "Fusing",       at: [4.9, PATH_Y + 0.7] },
  { key: "cleaning",     n: 7, label: "Cleaning",     at: [DX + DR + 0.75, DY + 0.5] }
];

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "Working normally" },
  worn:    { color: "#ffd426", glow: 1.20, says: "Worn, still working" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is the step that is failing" },
  idle:    { color: "#39404a", glow: 0.00, says: "Not used by this technology" },
  /* UNLIT, BUT NOT THE SAME THING AS UNUSED. A laser station that has
     simply not been checked yet looks identical to one that belongs to
     another technology — both are dark — and for a while it borrowed the
     other one's WORDS, so the diagnostic bench on a laser job told the
     student that a laser does not use the laser imaging process. Same
     pip, opposite meaning; the words are the only thing separating them,
     which is exactly why the words are the interface here. */
  unchecked: { color: "#39404a", glow: 0.00, says: "Not checked yet" }
};
export function stepWords(v) { return (LOOK[v] || LOOK.idle).says; }

/* ---------- the shell ----------

   REBUILT AGAINST THE OWNER'S PHOTOGRAPH OF THE MACHINE ON THE DESK.

   The first version was five flat slabs at one mid grey, and it read as a
   grey crate with parts in it. Nothing about it said "printer" — which is
   the same complaint the workstation renders drew, and it is a fair one:
   a student who cannot recognise the machine cannot use the machine as a
   reference for the one in front of them.

   What the photograph actually shows, and what is built here:

     - the body is NEAR WHITE, not mid grey, with a DARK GREY TOP DECK.
       Two tone, and the tone break is the strongest single cue.
     - the top deck carries the OUTPUT TRAY as a long sunken trough with a
       raised GRAB BAR across it — that trough is the most recognisable
       thing on any desktop laser seen from above, and this bench's camera
       looks slightly down.
     - the CONTROL PANEL sits on the top deck at the LEFT: a small pale
       LCD in a bezel with buttons beside it.
     - everything is ROUNDED. The real machine has a soft radius on every
       edge and the slab version had none, which is most of why it read as
       cardboard.
     - it is TALLER AT THE BACK and steps down at the front over the tray.
     - vents down the end, and four feet.

   The near side stays open, because the cutaway is the pedagogy. So the
   machine has to be recognisable from its TOP, BACK and ENDS alone, which
   is why the deck does so much of the work here. */
const SHELL_W = 17.5, SHELL_H = 12.5, SHELL_Z = DEPTH / 2 + 0.5;
const DECK_Y = 12.3;

function shell() {
  const T = 0.30;
  const out = [
    /* THE INSIDE IS BLACK AND THE OUTSIDE IS WHITE, which is both what the
       photograph shows and what this drawing needs. Painting the whole
       shell white washed every part inside it out — dark components on a
       near-white ground, at low contrast, in a lab whose students have
       damaged sight. The real machine is a white case around a black
       cavity, and the cavity is what makes the parts in it readable.

       back wall and floor: the interior, dark */
    { shape: "rbox", size: [SHELL_W, SHELL_H, T], pos: [0.4, 6.2, -SHELL_Z], r: 0.10, shade: 0.20 },
    { shape: "rbox", size: [SHELL_W, T, DEPTH + 1.0], pos: [0.4, 0.1, 0], r: 0.10, shade: 0.24 },
    /* the two ends, seen from inside, so also dark */
    { shape: "rbox", size: [T, SHELL_H, DEPTH + 1.0], pos: [-8.3, 6.2, 0], r: 0.16, shade: 0.26 },
    { shape: "rbox", size: [T, SHELL_H, DEPTH + 1.0], pos: [9.1, 6.2, 0], r: 0.16, shade: 0.26 },
    /* the OUTER case, white, standing a little proud of the dark inside so
       the machine reads as a body with a cavity in it */
    { shape: "rbox", size: [0.42, SHELL_H + 0.5, DEPTH + 1.7], pos: [-8.62, 6.2, 0], r: 0.18, shade: 1.0 },
    { shape: "rbox", size: [0.42, SHELL_H + 0.5, DEPTH + 1.7], pos: [9.42, 6.2, 0], r: 0.18, shade: 1.0 },
    { shape: "rbox", size: [SHELL_W + 1.3, SHELL_H + 0.5, 0.40], pos: [0.4, 6.2, -SHELL_Z - 0.35], r: 0.18, shade: 0.94 },
    /* THE FRONT IS PARTLY THERE, AND THAT IS WHAT MAKES IT A MACHINE.

       With the whole front face removed this read as a glass display case:
       you saw straight through it and there was nothing to say which way
       round it was. A real cutaway keeps enough of the skin to place you.

       So the front now has the parts of the case that are not in the way
       of the paper path — the tray front along the bottom, a header
       across the top, and a post at each end — with the middle open onto
       the imaging area, which is the whole reason for cutting it. The
       tray front carries the finger recess you pull it out by, and the
       header carries the badge panel. Those two details are most of what
       makes a white box read as a desktop laser. */
    /* The tray front stops at 1.35 rather than 2.05. At the taller size it
       covered the lift plate and both its springs — the parts built from
       the owner's photograph two commits ago — which would have been a
       faithful drawing of a closed machine and a useless one for the job.
       Same call as the impact bench's ribbon cassette drawn lifted clear:
       the picture matches what a technician is looking at. */
    { shape: "rbox", size: [SHELL_W, 1.35, 0.42], pos: [0.4, 0.80, SHELL_Z + 0.1], r: 0.16, shade: 1.0 },
    /* the finger recess in the tray front */
    { shape: "rbox", size: [3.2, 0.36, 0.22], pos: [1.4, 1.10, SHELL_Z + 0.26], r: 0.16, shade: 0.55 },
    /* the header across the top, and the badge panel on it */
    { shape: "rbox", size: [SHELL_W, 1.5, 0.42], pos: [0.4, 11.3, SHELL_Z + 0.1], r: 0.16, shade: 1.0 },
    { shape: "rbox", size: [2.1, 0.85, 0.18], pos: [1.2, 11.3, SHELL_Z + 0.28], r: 0.10, shade: 0.52 },
    /* a post at each end, and the door's parting line down the middle */
    { shape: "rbox", size: [1.1, SHELL_H, 0.42], pos: [-7.9, 6.2, SHELL_Z + 0.1], r: 0.16, shade: 1.0 },
    { shape: "rbox", size: [1.1, SHELL_H, 0.42], pos: [8.7, 6.2, SHELL_Z + 0.1], r: 0.16, shade: 1.0 }
  ];

  /* THE TOP DECK, dark against the white body. Built as a rim rather than
     one slab, so the output trough is a real recess in it and not a line
     painted on a flat lid. */
  const RIM = 0.55;
  out.push({ shape: "rbox", size: [SHELL_W, 0.34, RIM], pos: [0.4, DECK_Y, -SHELL_Z + RIM / 2], r: 0.10, shade: 0.40 });
  out.push({ shape: "rbox", size: [SHELL_W, 0.34, RIM], pos: [0.4, DECK_Y, SHELL_Z - RIM / 2], r: 0.10, shade: 0.40 });
  out.push({ shape: "rbox", size: [RIM, 0.34, DEPTH + 1.0], pos: [9.1 - RIM / 2, DECK_Y, 0], r: 0.10, shade: 0.40 });
  /* the left end of the deck is solid — that is where the panel sits */
  out.push({ shape: "rbox", size: [5.6, 0.34, DEPTH + 1.0], pos: [-5.5, DECK_Y, 0], r: 0.10, shade: 0.40 });

  /* THE OUTPUT TRAY: a trough sunk into the deck, sloping down toward the
     back where the sheet lands, with the exit slot at its far end. */
  out.push({ shape: "rbox", size: [10.4, 0.22, DEPTH - 0.2], pos: [3.6, DECK_Y - 0.62, 0.1],
    rot: [0, 0, 0.055], r: 0.08, shade: 0.62 });
  /* its side walls */
  out.push({ shape: "rbox", size: [10.4, 0.75, 0.26], pos: [3.6, DECK_Y - 0.32, -DEPTH / 2 + 0.35], r: 0.07, shade: 0.48 });
  out.push({ shape: "rbox", size: [10.4, 0.75, 0.26], pos: [3.6, DECK_Y - 0.32, DEPTH / 2 - 0.15], r: 0.07, shade: 0.48 });
  /* THE GRAB BAR across the trough — the moulded handle every desktop
     laser has across its output tray, and the thing that makes the trough
     read as a tray rather than as a hole in the lid. */
  out.push({ shape: "rbox", size: [1.5, 0.42, DEPTH - 0.5], pos: [4.6, DECK_Y - 0.10, 0.1], r: 0.16, shade: 0.34 });
  /* THE EXIT SLOT GOES WHERE THE SHEET ACTUALLY COMES OUT.

     It was at x -1.6, the LEFT end of the trough, and the paper path in
     this model leaves the machine at x 7.0 — so a sheet would have risen
     through the solid part of the deck and landed six units from the hole
     it supposedly came through. Nobody would have caught it by looking at
     a still: both are grey, both are on the deck, and the sheet is drawn
     mid-path on every stage that shows one. The trough already slopes
     down to the LEFT, which is only correct if the sheet enters it at the
     RIGHT, so the slope was right and the slot was wrong. */
  out.push({ shape: "rbox", size: [0.55, 0.34, DEPTH - 0.6], pos: [7.9, DECK_Y - 0.30, 0.1], r: 0.06, shade: 0.20 });

  /* THE DELIVERY ASSEMBLY, which is what fills the top of a real machine.

     The whole upper right of the cavity was empty dark space — the machine
     looked like a box with its contents in the bottom third. On the real
     one, that is where the sheet is carried up the back and turned over
     onto the tray, and it is full of curved guide plates and ribs. Drawn
     honestly it fills the void with the reason the void was wrong. */
  out.push({ shape: "rbox", size: [0.30, 4.6, DEPTH - 0.3], pos: [6.3, 9.1, 0], rot: [0, 0, 0.26], r: 0.08, shade: 0.44 });
  out.push({ shape: "rbox", size: [0.26, 3.4, DEPTH - 0.3], pos: [8.3, 9.6, 0], rot: [0, 0, -0.10], r: 0.08, shade: 0.40 });
  /* the ribs across the guide, which is what a paper guide looks like */
  out.push({ shape: "box", size: [0.10, 4.2, 0.12], pos: [6.42, 9.1, -1.5], rot: [0, 0, 0.26], r: 0.01, shade: 0.66,
    repeat: { count: 5, step: [0, 0, 0.75] } });
  /* the duct across the back, above the fuser, where the heat goes */
  out.push({ shape: "rbox", size: [4.2, 0.9, 0.9], pos: [2.6, 10.8, -DEPTH / 2 - 0.1], r: 0.14, shade: 0.36 });
  out.push({ shape: "box", size: [0.12, 0.55, 0.7], pos: [1.0, 10.8, -DEPTH / 2 - 0.1], r: 0.02, shade: 0.60,
    repeat: { count: 8, step: [0.44, 0, 0] } });

  /* Vents down the right-hand end, which is where the fan is. */
  out.push({ shape: "box", size: [0.10, 0.22, 2.4], pos: [9.22, 3.4, 0], r: 0.02, shade: 0.55,
    repeat: { count: 7, step: [0, 0.62, 0] } });

  /* Four feet. */
  [[-7.4, -1.9], [-7.4, 1.9], [8.2, -1.9], [8.2, 1.9]].forEach(function (p) {
    out.push({ shape: "cyl", size: [0.85, 0.30], pos: [p[0], -0.12, p[1]], seg: 12, shade: 0.30 });
  });
  return out;
}

/* THE CONTROL PANEL, its own part because its LCD is its own colour.

   On the photographed machine it is at the LEFT end of the top deck: a
   small pale display in a dark bezel with buttons beside it. It earns a
   part rather than a shade because it is a thing a technician uses — the
   configuration page that settles half the callout scenarios in this lab
   is printed from these buttons. */
function controlPanel() {
  const X = -6.2, Y = DECK_Y + 0.30, Z = 0.6;
  return [
    { shape: "rbox", size: [4.4, 0.26, 2.6], pos: [X + 0.6, Y, Z], r: 0.14, shade: 0.30 },
    /* the display. The panel used to be coloured for its LCD, which made
       the whole bezel green and turned a small detail into the loudest
       thing on the deck — loudness should track importance. The body is
       the dark grey it is on the machine and only the screen is pale. */
    { shape: "rbox", size: [2.2, 0.14, 1.35], pos: [X - 0.1, Y + 0.20, Z], r: 0.05, shade: 2.55 },
    /* four buttons in a row beside it */
    { shape: "cyl", size: [0.44, 0.20], pos: [X + 1.6, Y + 0.20, Z + 0.75], seg: 10, shade: 0.85,
      repeat: { count: 3, step: [0.62, 0, 0] } },
    { shape: "rbox", size: [0.75, 0.20, 0.60], pos: [X + 2.2, Y + 0.20, Z - 0.75], r: 0.10, shade: 0.85 }
  ];
}

/* ---------- paper handling ---------- */
function tray(sheets) {
  const n = Math.max(0, Math.min(14, sheets === undefined ? 12 : sheets));
  /* The stack sits ON the lift plate, and the plate is tilted, so the
     stack is tilted with it. A full tray reaches the tyre; an empty one
     does not, and that is the whole job of the springs underneath. */
  const top = LIFT_Y + 0.12 + n * 0.055;
  /* THE TRAY IS A PAN, NOT A BLOCK.

     It was one solid rbox, which is fine while the only thing in a tray
     is paper — and the moment the lift plate and its two springs went in,
     they were sealed inside it and could not be seen at all. Exactly the
     mistake the power supply cost a rebuild for: parts drawn correctly,
     inside a closed crate.

     So it is a floor, a back wall, two ends, and a NEAR wall cut to about
     a third — the cutaway convention this bench already uses everywhere
     else. A student looking into the tray sees what actually lifts the
     paper up to the roller. */
  const NEAR_H = 0.55;
  const out = [
    { shape: "rbox", size: [6.2, 0.14, DEPTH], pos: [-5.0, 0.47, 0], r: 0.04, shade: 0.72 },
    { shape: "rbox", size: [6.2, 1.5, 0.14], pos: [-5.0, 1.15, -DEPTH / 2], r: 0.04, shade: 0.66 },
    { shape: "rbox", size: [6.2, NEAR_H, 0.14], pos: [-5.0, 0.40 + NEAR_H / 2, DEPTH / 2], r: 0.04, shade: 0.80 },
    { shape: "rbox", size: [0.14, 1.5, DEPTH], pos: [TRAY_X0, 1.15, 0], r: 0.04, shade: 0.60 },
    { shape: "rbox", size: [0.14, 1.5, DEPTH], pos: [TRAY_X1, 1.15, 0], r: 0.04, shade: 0.60 }
  ];
  if (n) {
    out.push({ shape: "box", size: [5.4, 0.05, DEPTH - 0.5], pos: [LIFT_X, LIFT_Y + 0.14, 0],
      rot: [0, 0, LIFT_TILT], r: 0.005, shade: 1.6, repeat: { count: n, step: [0, 0.055, 0] } });
  }
  return { build: out, top: top };
}

/* The tray lift plate and its two springs. Its own part, because a
   collapsed lift plate is a no-feed that looks exactly like a glazed
   roller and is a completely different repair. */
function liftPlate() {
  const out = [
    { shape: "box", size: [5.6, 0.10, DEPTH - 0.55], pos: [LIFT_X, LIFT_Y, 0],
      rot: [0, 0, LIFT_TILT], r: 0.02, shade: 1.35 },
    /* the hinge at the far end */
    { shape: "cyl", size: [0.20, DEPTH - 0.6], pos: [LIFT_X + 2.8, LIFT_Y - 0.18, 0],
      rot: [P2, 0, 0], seg: 10, shade: 0.7 }
  ];
  /* Two coil springs. There is no helix here, so a spring is a stack of
     rings lying flat — the same trick the PSU's captive screws use. */
  [-SPRING_Z, SPRING_Z].forEach(function (z) {
    out.push({ shape: "torus", size: [0.62, 0.09], pos: [SPRING_X, 0.62, z],
      rot: [P2, 0, 0], seg: 12, shade: 0.85, repeat: { count: 6, step: [0, 0.145, 0] } });
  });
  return out;
}

function roller(x, y, r, shade, seg) {
  return { shape: "cyl", size: [r * 2, DEPTH], pos: [x, y, 0], rot: [P2, 0, 0],
    seg: seg || 18, shade: shade === undefined ? 1.0 : shade };
}

/* A short tyre on the pickup shaft: `z` is where along the shaft it sits,
   `w` how wide, `r` its radius. */
function tyre(z, w, r, shade, seg) {
  return { shape: "cyl", size: [r * 2, w], pos: [FEED_X, FEED_Y, z], rot: [P2, 0, 0],
    seg: seg || 20, shade: shade === undefined ? 1.0 : shade };
}

/* The pickup shaft: one steel bar, four tyres, a gear at each end. The
   near gear is the larger — it is the one the owner labelled GEAR DRIVE,
   and it is the one a technician can actually see and reach. */
function pickupShaft() {
  return [
    { shape: "cyl", size: [0.30, DEPTH + 2.6], pos: [FEED_X, FEED_Y, 0], rot: [P2, 0, 0],
      seg: 12, shade: 1.5 },
    /* the two treaded tyres that do the picking, in the middle */
    tyre(-0.62, 1.05, FEED_R, 0.95), tyre(0.62, 1.05, FEED_R, 0.95),
    /* their tread, as ribs round each one */
    { shape: "box", size: [0.16, FEED_R * 0.34, 0.95], pos: [FEED_X, FEED_Y, -0.62],
      r: 0.02, shade: 0.72, ring: { count: 12, radius: FEED_R * 0.86, axis: "z" } },
    { shape: "box", size: [0.16, FEED_R * 0.34, 0.95], pos: [FEED_X, FEED_Y, 0.62],
      r: 0.02, shade: 0.72, ring: { count: 12, radius: FEED_R * 0.86, axis: "z" } },
    /* a plain barrel outboard each side */
    tyre(-1.72, 0.85, FEED_R * 0.92, 0.80), tyre(1.72, 0.85, FEED_R * 0.92, 0.80)
  ];
}

/* The gear drive, its own part so it can be its own colour: the gears on
   this machine are white nylon against everything else being dark, and
   that contrast is how you spot a stripped one. */
function gearDrive() {
  const zNear = DEPTH / 2 + 0.55, zFar = -DEPTH / 2 - 0.45;
  return [
    { shape: "cyl", size: [1.30, 0.42], pos: [FEED_X, FEED_Y, zNear], rot: [P2, 0, 0],
      seg: 22, shade: 1.0 },
    { shape: "box", size: [0.26, 0.24, 0.42], pos: [FEED_X, FEED_Y, zNear], r: 0.02,
      shade: 0.88, ring: { count: 18, radius: 0.72, axis: "z" } },
    { shape: "cyl", size: [0.86, 0.34], pos: [FEED_X, FEED_Y, zFar], rot: [P2, 0, 0],
      seg: 18, shade: 1.0 },
    { shape: "box", size: [0.22, 0.20, 0.34], pos: [FEED_X, FEED_Y, zFar], r: 0.02,
      shade: 0.88, ring: { count: 13, radius: 0.50, axis: "z" } }
  ];
}

/* The separation pads. Two of them, each a cream friction face set into a
   moulded carrier, angled up to meet the sheet, on a spring. */
function sepPads() {
  /* THE PADS STAND ON THE DECK, NOT ON THE LIFT PLATE.

     They were drawn hovering between the two, which a render caught
     straight away: two biscuits in mid-air. It is not a cosmetic point.
     The lift plate MOVES — it rises as the stack empties — and a pad
     mounted on it would travel with the paper it is supposed to hold
     back, which is the one thing it must not do. The pads are fixed to
     the deck the sheet climbs over, so each one gets a pillar down to
     the tray floor and the picture says which part moves and which does
     not. */
  const FLOOR = 0.54;
  const out = [];
  [-SEP_Z, SEP_Z].forEach(function (z) {
    /* the pillar down to the fixed deck */
    out.push({ shape: "rbox", size: [0.68, SEP_TOP - 0.68 - FLOOR, 0.86],
      pos: [SEP_X, (FLOOR + SEP_TOP - 0.68) / 2, z], r: 0.05, shade: 0.48 });
    /* the moulded carrier, with the seating ribs under it */
    out.push({ shape: "rbox", size: [0.95, 0.52, 1.15], pos: [SEP_X, SEP_TOP - 0.42, z],
      r: 0.07, shade: 0.62 });
    out.push({ shape: "box", size: [0.10, 0.30, 1.05], pos: [SEP_X - 0.30, SEP_TOP - 0.80, z],
      r: 0.01, shade: 0.50, repeat: { count: 3, step: [0.30, 0, 0] } });
    /* the friction face itself, tilted into the sheet's path */
    out.push({ shape: "rbox", size: [0.78, 0.14, 0.92], pos: [SEP_X, SEP_TOP - 0.10, z],
      rot: [0, 0, 0.30], r: 0.03, shade: 1.55 });
    /* the pressure spring, between the carrier and the pillar it rocks on */
    out.push({ shape: "torus", size: [0.40, 0.06], pos: [SEP_X + 0.26, SEP_TOP - 0.96, z],
      rot: [P2, 0, 0], seg: 10, shade: 0.95, repeat: { count: 3, step: [0, 0.12, 0] } });
  });
  return out;
}

/* The sheet, drawn wherever it has got to. `t` runs 0 to 1 along the path. */
function sheet(t) {
  const P = [
    [-5.0, 2.1], [-3.4, PATH_Y], [-1.2, PATH_Y], [1.4, PATH_Y],
    [3.6, PATH_Y + 0.3], [4.9, PATH_Y + 0.7], [6.6, 3.6], [7.8, 7.0], [7.0, 11.9]
  ];
  const i = Math.max(0, Math.min(P.length - 2, Math.floor(t * (P.length - 1))));
  const f = t * (P.length - 1) - i;
  const x = P[i][0] + (P[i + 1][0] - P[i][0]) * f;
  const y = P[i][1] + (P[i + 1][1] - P[i][1]) * f;
  const ang = Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]);
  return [{ shape: "box", size: [2.6, 0.06, DEPTH - 0.6], pos: [x, y, 0], rot: [0, 0, ang],
    r: 0.005, shade: 1.7 }];
}

/* ---------- the seven stations ---------- */

const BUILD = {
  /* 1. Processing happens on a board, not in the paper path — which is
     exactly why students forget it is a step at all. */
  processing: function () {
    return [
      { shape: "box", size: [2.6, 0.12, 2.2], pos: [-7.4, 9.4, 0], r: 0.02, shade: 1.0 },
      { shape: "rbox", size: [0.8, 0.3, 0.8], pos: [-7.4, 9.6, 0], r: 0.04, shade: 0.6 },
      { shape: "box", size: [0.12, 0.5, 0.12], pos: [-8.0, 9.7, -0.7], r: 0.01, shade: 0.75,
        repeat: { count: 6, step: [0.24, 0, 0] } }
    ];
  },
  /* 2. A charge roller laid along the top of the drum. */
  charging: function () {
    return [roller(DX - 0.2, DY + DR + 0.8, 0.62, 1.0),
      { shape: "cyl", size: [0.22, DEPTH + 1.1], pos: [DX - 0.2, DY + DR + 0.8, 0],
        rot: [P2, 0, 0], seg: 10, shade: 0.55 }];
  },
  /* 3. The scanner assembly, and the beam it throws at the drum. */
  exposing: function () {
    const from = [-5.4, 9.0], to = [DX - 1.25, DY + 1.75];
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    return [
      { shape: "rbox", size: [3.4, 1.5, DEPTH - 0.4], pos: [-5.4, 9.0, 0], r: 0.08, shade: 0.72 },
      /* the polygon mirror inside it */
      { shape: "cyl", size: [1.0, 0.5], pos: [-5.4, 9.0, 0], seg: 6, shade: 1.4 },
      /* the beam */
      { shape: "cyl", size: [0.16, len], pos: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0],
        rot: [0, 0, Math.atan2(dy, dx) - P2], seg: 8, shade: 1.9 }
    ];
  },
  /* 4. Developer roller, with the toner hopper behind it. */
  developing: function () {
    return [
      roller(DX - DR - 1.0, DY, 0.95, 1.0),
      { shape: "rbox", size: [2.6, 2.4, DEPTH - 0.2], pos: [DX - DR - 3.0, DY + 0.1, 0], r: 0.1, shade: 0.8 },
      /* the auger inside the hopper */
      { shape: "cyl", size: [0.5, DEPTH - 0.6], pos: [DX - DR - 3.0, DY - 0.3, 0],
        rot: [P2, 0, 0], seg: 10, shade: 0.5 }
    ];
  },
  /* 5. Transfer roller under the drum, with the sheet passing between. */
  transferring: function () {
    return [roller(DX, DY - DR - 0.75, 0.62, 1.0)];
  },
  /* 6. The fuser. TWO ROLLERS IS NOT WHAT COMES OUT OF THE MACHINE.

     The owner's photograph has the fuser out on the desk beside the
     printer, and it is a framed ASSEMBLY — a black cage carrying both
     rollers, with a cable loom and a white connector hanging off one end.
     That matters commercially: "replace the fuser" is that whole unit at
     that whole price, not a roller, and the connector is what tells you
     it is an electrical part with a thermistor and a lamp in it rather
     than something you can clean and refit. */
  fusing: function () {
    const y = PATH_Y + 0.7;
    return [
      roller(4.9, PATH_Y + 1.35, 0.78, 1.0),
      roller(4.9, PATH_Y + 0.05, 0.62, 0.8),
      /* the lamp inside the hot roller */
      { shape: "cyl", size: [0.42, DEPTH - 0.4], pos: [4.9, PATH_Y + 1.35, 0],
        rot: [P2, 0, 0], seg: 12, shade: 1.9 },
      /* the frame the pair lifts out in: two end plates and a top rail */
      { shape: "rbox", size: [2.5, 2.9, 0.28], pos: [4.9, y, DEPTH / 2 + 0.12], r: 0.06, shade: 0.55 },
      { shape: "rbox", size: [2.5, 2.9, 0.28], pos: [4.9, y, -DEPTH / 2 - 0.12], r: 0.06, shade: 0.55 },
      { shape: "rbox", size: [2.5, 0.30, DEPTH + 0.5], pos: [4.9, y + 1.45, 0], r: 0.06, shade: 0.62 },
      /* THE LOOM. In the photograph it is a ribbon of individually
         coloured wires ending in a white plug, and that colour is the
         point: it is what tells you at a glance that the fuser is an
         ELECTRICAL assembly with a lamp and a thermistor in it, not a
         roller you can wipe and refit. Six strands, spread. */
      { shape: "cyl", size: [0.11, 1.9], pos: [5.6, y - 0.75, DEPTH / 2 + 0.5],
        rot: [0.55, 0, 0.9], seg: 6, shade: 1.25,
        repeat: { count: 6, step: [0.055, -0.02, 0.16] } },
      /* the white connector on the end of it */
      { shape: "rbox", size: [0.95, 0.42, 0.66], pos: [6.35, y - 1.55, DEPTH / 2 + 1.35],
        r: 0.06, shade: 2.4 }
    ];
  },
  /* 7. The cleaning blade, scraping the drum on its way round. */
  cleaning: function () {
    return [
      { shape: "box", size: [1.5, 0.16, DEPTH], pos: [DX + DR + 0.9, DY + 0.7, 0],
        rot: [0, 0, -0.5], r: 0.02, shade: 1.1 },
      /* the waste bin under it */
      { shape: "rbox", size: [1.9, 1.5, DEPTH - 0.2], pos: [DX + DR + 1.5, DY - 0.9, 0], r: 0.08, shade: 0.7 }
    ];
  }
};

/* A numbered pip beside each station. Its own part so it can be red
   without turning the roller red. */
function pip(at) {
  return [
    { shape: "cyl", size: [0.62, 0.16], pos: [at[0], at[1], DEPTH / 2 + 0.55], rot: [P2, 0, 0],
      seg: 16, shade: 1.0 },
    { shape: "sphere", size: [0.54], pos: [at[0], at[1], DEPTH / 2 + 0.62], seg: 14, shade: 1.0 }
  ];
}
function pipWell(at) {
  return [{ shape: "cyl", size: [0.92, 0.10], pos: [at[0], at[1], DEPTH / 2 + 0.48],
    rot: [P2, 0, 0], seg: 16, shade: 0.30 }];
}

/* ---------------------------------------------------------------------
   printerBench(view)

     view.tech      "laser" | "inkjet" | "thermal" | "impact"
     view.states    { processing: "ok"|"worn"|"faulty"|"idle", ... }
     view.sheetAt   0..1 along the paper path, or null for no sheet
     view.sheets    how many sheets are in the tray
   --------------------------------------------------------------------- */
export function printerBench(view) {
  view = view || {};
  const st = view.states || {};
  const laser = (view.tech || "laser") === "laser";
  /* WHICH PARTS ARE ACTUALLY IN THE MACHINE.

     `view.fitted` is a set of part keys, and it exists for the fit stage:
     a student being asked to put the toner cartridge in should not be
     looking at a toner cartridge that is already there. When it is absent
     — which is every other stage — the machine is whole, so nothing that
     used to be drawn stops being drawn. */
  const fitting = !!view.fitted;
  const has = function (k) { return !fitting || view.fitted.indexOf(k) >= 0; };
  const sheetCount = view.sheets === undefined ? 12 : view.sheets;
  const T = tray(view.sheets);

  const parts = [
    { key: "shell", label: "The printer", build: shell(), finish: "plastic", skin: { kind: "moulded", repeat: 0.09 }, scale: 1,
      pos: [0, 0, 0], color: "#dcdedd",
      spec: "Cut away down its length",
      note: "Paper goes in at the bottom left and comes out on top. Everything between those " +
        "two points happens in the order you can see." },
    { key: "panel", label: "Control panel", build: controlPanel(), finish: "plastic", skin: "moulded", scale: 1,
      pos: [0, 0, 0], color: "#59626b",
      spec: "Display and buttons, on the top deck",
      note: "Where the configuration page comes from — the page that tells you the firmware " +
        "level, the tray settings and the address the machine thinks it has. Half the callouts " +
        "in this lab are settled by printing it before touching anything." },
    { key: "tray", label: "Paper tray", build: T.build, finish: "plastic", skin: { kind: "moulded", repeat: 0.16 }, scale: 1,
      pos: [0, 0, 0], color: "#6f7a84",
      spec: sheetCount + " sheets loaded",
      note: "Where a jam most often starts. How high the stack reaches is not decoration — " +
        "the lift plate under it is what carries the top sheet up to the tyre, and a tray " +
        "that feeds when full and not when low is that plate, not the roller." },
    /* THE TRAY LIFT PLATE, from the owner's photograph. It is the reason a
       tray with four sheets in it feeds at all, and when it collapses the
       machine stops taking paper — which every student blames on the
       pickup roller, because until now that was the only part drawn. */
    { key: "lift", label: "Tray lift plate",
      build: liftPlate(), finish: "metal", skin: "brushed", scale: 1, pos: [0, 0, 0], color: "#b8c0c6",
      spec: "Sprung, hinged at the far end",
      note: "Two coil springs push this plate up so the top sheet always meets the tyre, " +
        "whether there are four hundred sheets on it or four. Tired springs or a cracked " +
        "plate give you a machine that feeds from a full tray and refuses a low one — " +
        "and a new pickup roller will not fix it." },
    has("rollers") ? { key: "rollers", label: "Pickup and registration rollers",
      build: pickupShaft().concat([
              roller(-3.4, PATH_Y - 0.55, 0.5, 0.9), roller(-3.4, PATH_Y + 0.55, 0.5, 0.9),
              roller(7.4, 8.6, 0.6, 0.9), roller(7.9, 10.4, 0.6, 0.9)]),
      finish: "rubber", skin: "rubber", scale: 1, pos: [0, 0, 0], color: "#4a5158",
      spec: "One shaft, four tyres, then registration and exit",
      note: "The two treaded tyres in the middle do the picking; the plain barrels either side " +
        "keep the sheet square. Rubber, and it glazes with age — a glazed tyre slips, " +
        "which a user reports as “it has stopped taking paper”." } : null,
    /* THE SEPARATION PADS. Two, facing the tyre across the nip, exactly as
       the owner's annotated photograph shows them. The friction face is a
       pale cream on a moulded carrier, which is how you recognise one. */
    { key: "seppad", label: "Separation pads",
      build: sepPads(), finish: "rubber", skin: "rubber", scale: 1, pos: [0, 0, 0], color: "#cbbfa4",
      spec: "Two, sprung, facing the pickup tyres",
      note: "The tyre drags the top sheet across these. Friction holds the second one back, so " +
        "one sheet goes and the rest stay. Worn smooth and you get two sheets at a time — " +
        "the classic multi-feed, and the reason a jam that only happens on a full tray is " +
        "almost never the roller." },
    /* The gear train, its own part: white nylon against a black machine,
       which is what makes a stripped tooth findable by eye. */
    { key: "gear", label: "Gear drive",
      build: gearDrive(), finish: "plastic", skin: "moulded", scale: 1, pos: [0, 0, 0], color: "#dfe3e6",
      spec: "Nylon gears on the pickup shaft",
      note: "Everything in the paper path turns off this train, at speeds matched to each " +
        "other. A rounded or stripped tooth announces itself through the ear long before the " +
        "eye — a new rhythmic tick, then smeared print where the timing slipped mid-page." },
    { key: "drum", label: "The imaging drum",
      build: [roller(DX, DY, DR, 1.0, 30),
              { shape: "cyl", size: [0.5, DEPTH + 1.4], pos: [DX, DY, 0], rot: [P2, 0, 0],
                seg: 12, shade: 0.5 }],
      /* THE COATING IS GREEN, AND THAT IS THE POINT OF THE COLOUR.
         It was a pale sage that read as painted metal. The owner's two
         shots of the cartridge in and out of the machine show a
         saturated green along the whole barrel — which is exactly how a
         student picks the drum out of a black machine, and how they see
         at a glance where it has worn through to bright aluminium. */
      finish: "metal", scale: 1, pos: [0, 0, 0], color: "#2f9e63",
      spec: "Photosensitive, light-sensitive",
      note: "The whole process happens on this surface. It is charged, written on, developed, " +
        "unloaded onto the paper and wiped, once per revolution, and it is ruined by daylight." },
    /* THE TONER CARTRIDGE, as a thing you can point at.

       The imaging drum was on this bench and the toner supply feeding it
       was not, which made "where does the toner go" unanswerable on the
       model even though it is one of the four placements the Core 1
       printer PBQ asks for. It sits against the drum on the developing
       side, because that is where it has to be: toner is handed to the
       drum at the developing station and nowhere else. */
    /* THE CARTRIDGE, from the photograph of one lying on the desk: a black
       wedge — deeper at the back, stepping down at the front — with a
       WHITE LABEL across its face and an ORANGE PULL TAB at one end. It
       was a plain black brick, and a plain black brick beside a plain
       black hopper is two things a student cannot tell apart. The label
       and the tab are what you actually look at: the label is the part
       number you order by, and the tab is the seal that gets left in. */
    has("toner") ? { key: "toner", label: "Toner cartridge",
      build: [{ shape: "rbox", size: [3.4, 1.75, DEPTH + 0.6], pos: [DX - DR - 2.1, DY + 0.28, 0],
                r: 0.22, shade: 1.0 },
              { shape: "rbox", size: [2.5, 0.95, DEPTH + 0.5], pos: [DX - DR - 2.5, DY - 0.72, 0],
                r: 0.20, shade: 0.88 },
              /* the white label across the face */
              { shape: "rbox", size: [2.0, 0.75, 0.10], pos: [DX - DR - 2.3, DY + 0.30, DEPTH / 2 + 0.32],
                r: 0.04, shade: 2.6 },
              /* the orange pull tab at the near end */
              { shape: "rbox", size: [0.55, 0.30, 0.85], pos: [DX - DR - 3.5, DY - 1.05, DEPTH / 2 - 0.2],
                r: 0.06, shade: 1.9 },
              roller(DX - DR - 0.75, DY, 0.62, 0.75)],
      finish: "plastic", skin: "moulded", scale: 1, pos: [0, 0, 0], color: "#2b3138",
      spec: "Toner hopper and developer roller",
      note: "A consumable. It hands toner to the drum at the developing station, and when it " +
        "runs low the print goes pale on one side before it goes pale everywhere." } : null,
    /* THE DUPLEXER.

       Also missing, and also one of the four the PBQ asks for. It is the
       rear path that takes a sheet that has been printed on one side,
       turns it round and feeds it back in — so it sits BEHIND and BELOW
       the fuser, not in the imaging area at all. Where it is is the whole
       reason a student can place it: a part that flips paper has to be
       downstream of the print and upstream of the feed. */
    has("duplex") ? { key: "duplex", label: "Duplexer",
      build: [{ shape: "rbox", size: [1.4, 7.6, DEPTH + 0.4], pos: [9.5, 3.4, 0],
                r: 0.2, shade: 1.0 },
              roller(9.5, 6.2, 0.55, 0.8), roller(9.5, 1.4, 0.55, 0.8),
              { shape: "rbox", size: [5.0, 1.0, DEPTH + 0.4], pos: [6.6, 0.5, 0],
                r: 0.15, shade: 0.85 }],
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#5a4a63",
      spec: "Rear duplex path",
      note: "Takes a sheet that has been printed on one side, turns it over and feeds it back " +
        "in for the second. Downstream of the fuser and upstream of the feed \u2014 it cannot " +
        "be anywhere else and still do its job." } : null
  ].filter(Boolean);

  /* The seven stations, each with its own pip. */
  STEPS.forEach(function (s) {
    const state = st[s.key] || (laser ? "ok" : "idle");
    const L = LOOK[state] || LOOK.idle;
    parts.push({
      key: "step-" + s.key,
      label: s.n + ". " + s.label,
      build: BUILD[s.key](),
      finish: s.key === "exposing" || s.key === "fusing" ? "metal" : "plastic",
      scale: 1, pos: [0, 0, 0],
      color: "#8f99a3",
      spec: L.says,
      note: ""
    });
    parts.push({ key: "well-" + s.key, label: s.label + " indicator surround",
      build: pipWell(s.at), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + s.key, label: s.n + ". " + s.label + " status",
      build: pip(s.at), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: L.color, glow: L.glow, spec: L.says, note: L.says });
  });

  if (view.sheetAt !== null && view.sheetAt !== undefined) {
    parts.push({ key: "sheet", label: "The sheet", build: sheet(view.sheetAt),
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#f2f4f6",
      spec: "In the paper path",
      note: "Follow it. Where it is when the defect appears tells you which station put the " +
        "defect there." });
  }

  return {
    kind: "bench",
    title: "A laser printer, opened up",
    caption: "Paper in at the bottom left, out on the top. The seven numbered pips are the seven " +
      "steps of the imaging process, in the order they happen.",
    board: {
      size: [22, 0.5, 9], pos: [0.4, -0.3, 0], color: "#333c46",
      build: [{ shape: "rbox", size: [22, 0.5, 9], pos: [0.4, 0, 0], r: 0.12, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* Almost straight on. This is a cutaway and it is meant to be read
       like a diagram, not admired from an angle. */
    /* THE PITCH WAS RAISED FROM 0.16 TO 0.46.

       At 0.16 this bench looked at the machine almost dead on, and the
       whole top deck — the output trough, its grab bar, the control panel
       — was edge-on and invisible. Detail nobody can see is decoration,
       and the deck is the half of a desktop laser that makes it
       recognisable as one. Four pitches were rendered side by side and
       compared rather than guessed at: 0.18 and 0.32 hide the deck
       entirely, 0.60 foreshortens the drum, and 0.46 gives both. */
    /* fitWidth SWEPT against frustumOK at 319, 480, 697 and 889px — the
       canvas widths the running lab actually hands out, 319 being what
       fits inside a 390px phone. The suite renders at 1100 and had never
       asked. This bench lost SEVENTEEN parts at 319px, on the largest lab
       in the build — twelve stages of machine, cropped.

       The value is one sweep step above the measured minimum, because
       the sweep drives the default view and a bench is at its widest in
       some other state. It costs nothing on a wide canvas: fitDist takes
       the LARGER of dist and the fit, so a roomy canvas never notices. */
    camera: { dist: 26.5, fitWidth: 30, yaw: 0.20, pitch: 0.46,
      target: [0.4, 6.4, 0], min: 10, max: 52 }
  };
}
