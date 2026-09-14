/* =====================================================================
   A+ Core1 Under the Hood Labs — the RAID bench

   A 2U storage server seen from the front, the way you meet one in a rack:
   eight hot-swap caddies in a row, a controller behind them, and a cache
   module on the controller with a battery on it.

   This model draws state. It decides nothing. Every bay in it exists first
   as a real, labelled, focusable button in ordinary HTML — the canvas is a
   second view of the same state that happens to be nicer to look at. Turn
   WebGL off and the lab still works; you lose the picture and nothing else.
   That rule comes from the scene engine and it is not negotiable here,
   because the students this is for have damaged sight and a WebGL canvas is
   an opaque rectangle to a screen reader.

   WHY THE FRONT, AND WHY CADDIES

   Everything a technician does to an array in anger happens at the front
   panel. You read which lamp is amber, you pull that caddy and no other,
   and you watch the rest of the row while it rebuilds. Drawing the inside
   of the chassis would be prettier and would teach the wrong lesson: the
   evidence is on the front, and a student who learns to read the front is
   learning the actual job.

   The caddy is therefore the unit. Each one is its own part with its own
   key, so the lab can highlight bay 5 and only bay 5 — which is what makes
   "pull the failed disk" a thing you DO rather than a thing you pick off a
   list. Pull the wrong one during a rebuild and the array is gone, and the
   model shows you that rather than telling you.

   STATE IS NEVER COLOUR ALONE

   A bay's condition reads three ways at once: the lamp colour, the lamp
   BRIGHTNESS, and the caddy face tone. Colour-blind students and students
   on a washed-out laptop screen both still see it. The text label beside
   the canvas says it in words regardless, because that is the control.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Chassis geometry. A 2U box, eight bays across the front. */
const BAYS = 8;
const CH_W = 12.0;          /* chassis width  */
const CH_H = 2.4;           /* 2U             */
const CH_D = 3.0;           /* depth we bother drawing */
const FZ = CH_D / 2;        /* the front face plane */

const BAY_W = 1.24;
/* WHERE THE HANDLE IS, AND WHY THE LAMPS ARE CLEAR OF IT.

   The bail handle and the fault lamp were placed independently, and the
   handle crossed the lamp: the amber on a failed bay came out half behind
   a grey bar, on the one bench whose entire job is "which bay do I touch".
   That is the occlusion trap this build keeps hitting, and the answer is
   the same as it was on the display bench — where the arrangement is
   regular, COMPUTE it rather than nudging numbers until a render looks
   right.

   Both lamps sit on the latch rail at the left. The handle spans the face
   to the right of that rail and at a height between them and the vents.
   The assertion below fails the module if anyone moves one without the
   other. */
const LAMP_Y   = -0.72, LAMP_R  = 0.15;   /* activity, low on the latch rail */
const HANDLE_Y = -0.33, HANDLE_H = 0.22;  /* the bail across the face */
const FAULT_Y  = -0.02, FAULT_R  = 0.095; /* fault, above the bail */
const VENT_Y   =  0.38, VENT_H   = 0.42;  /* the four openings */
const PLATE_Y  =  0.78, PLATE_H  = 0.26;  /* the capacity plate */             /* the larger of the two lens radii */
const BAY_H = 1.86;
const BAY_STEP = 1.38;
const BAY_X0 = -((BAYS - 1) * BAY_STEP) / 2;

/* Where bay `i` sits, 0-indexed from the left as you face the rack. */
export function bayX(i) { return BAY_X0 + i * BAY_STEP; }

/* ---------------------------------------------------------------------
   How each state looks.

   `face` and `rail` are vertex shades on the caddy body — a pulled caddy
   is drawn dark and set back, an empty bay is a hole. `lamp` is the LED
   shade, and `lampColor` overrides the part colour for the lamp alone so
   amber genuinely reads amber rather than "a slightly different grey".

   Brightness carries the same information as hue, on purpose. Failed is
   the brightest thing on the chassis because it is the thing you are meant
   to find from the doorway.
   --------------------------------------------------------------------- */
/* ACTIVITY AND FAULT ARE TWO LAMPS, NOT ONE LAMP THAT CHANGES COLOUR.

   From the owner's close-up of a real caddy face: a large cyan activity
   square on the left, and a small amber fault LED beside it. They are
   separate indicators and they are read separately — that is the whole
   skill. A failed drive shows fault ON and activity DARK; a rebuilding one
   shows BOTH lit, which is exactly why a rebuild and a failure look so
   similar from the aisle and why people pull the wrong drive.

   Collapsing them into a single lamp that turns from green to amber to red
   taught the opposite: that a bay has one state with one colour. It does
   not, and the lab's own text already says so — "on the front panel a
   rebuilding disk and a failing disk are both amber". Now the model
   agrees with the words.

   `faultColor` is null where nothing is wrong, and the lamp is drawn dark
   rather than removed: geometry that comes and goes makes the row jump
   about while a student is comparing eight of them. */
const LOOK = {
  ok:        { face: 0.86, rail: 0.62, lamp: 1.00, glow: 0.85, lampColor: "#2fd45e", out: 0.00,
               faultColor: null,      faultGlow: 0.00 },
  active:    { face: 0.90, rail: 0.64, lamp: 1.10, glow: 1.15, lampColor: "#45e874", out: 0.00,
               faultColor: null,      faultGlow: 0.00 },
  rebuilding:{ face: 0.92, rail: 0.66, lamp: 1.15, glow: 1.45, lampColor: "#45e874", out: 0.00,
               faultColor: "#ffa524", faultGlow: 1.45 },
  failed:    { face: 0.58, rail: 0.44, lamp: 0.28, glow: 0.00, lampColor: "#39404a", out: 0.00,
               faultColor: "#ff3b30", faultGlow: 1.60 },
  predictive:{ face: 0.74, rail: 0.55, lamp: 1.00, glow: 0.85, lampColor: "#2fd45e", out: 0.00,
               faultColor: "#ffd426", faultGlow: 1.20 },
  spare:     { face: 0.80, rail: 0.60, lamp: 0.95, glow: 0.80, lampColor: "#3d8bff", out: 0.00,
               faultColor: null,      faultGlow: 0.00 },
  pulled:    { face: 1.05, rail: 0.80, lamp: 0.30, glow: 0.00, lampColor: "#4a5158", out: 1.15,
               faultColor: null,      faultGlow: 0.00 },
  /* Fitted, spinning, and part of a set that no longer exists. The lamp is
     dark rather than coloured, because there is nothing left for it to
     report. */
  offline:   { face: 0.50, rail: 0.40, lamp: 0.22, glow: 0.00, lampColor: "#39404a", out: 0.00,
               faultColor: null,      faultGlow: 0.00 },
  empty:     { face: 0.20, rail: 0.20, lamp: 0.00, glow: 0.00, lampColor: "#2a2f33", out: 0.00,
               faultColor: null,      faultGlow: 0.00 }
};

/* Plain words for the same thing. The canvas is scenery; this is what the
   button beside it says, and what a screen reader reads out. */
const SAYS = {
  ok:         "Online",
  active:     "Online, busy",
  rebuilding: "Rebuilding",
  failed:     "Failed",
  predictive: "Predictive failure warning",
  spare:      "Hot spare, idle",
  pulled:     "Caddy withdrawn",
  offline:    "Offline — the array failed",
  empty:      "Empty bay"
};

export function bayWords(state) { return SAYS[state] || "Unknown"; }

/* ---------------------------------------------------------------------
   One caddy.

   Built as a list of primitives rather than one box, because a caddy that
   is a box teaches nothing. What a technician actually looks at is the
   handle (is it latched?), the lamp, and the vent slots that tell you a
   drive is in there at all.
   --------------------------------------------------------------------- */
/* NOTHING ON THE CADDY FACE MAY SIT ON TOP OF ANYTHING ELSE.

   The face carries five things stacked up its height, and they were placed
   one at a time by eye. The first assertion here was written to catch the
   fault lamp disappearing behind the bail handle — and on its very first
   run it caught the ACTIVITY lamp doing the same thing, which I had looked
   straight at in a render and not seen.

   So it checks every pair rather than the one pair I happened to suspect.
   Same lesson as the display bench: where the arrangement is regular,
   compute it instead of nudging numbers until a picture looks right. */
(function () {
  var bands = [
    ["activity lamp", LAMP_Y - LAMP_R, LAMP_Y + LAMP_R],
    ["bail handle", HANDLE_Y - HANDLE_H / 2, HANDLE_Y + HANDLE_H / 2],
    ["fault lamp", FAULT_Y - FAULT_R, FAULT_Y + FAULT_R],
    ["vent windows", VENT_Y - VENT_H / 2, VENT_Y + VENT_H / 2],
    ["capacity plate", PLATE_Y - PLATE_H / 2, PLATE_Y + PLATE_H / 2]
  ];
  for (var i = 0; i < bands.length; i++) {
    var half = BAY_H / 2;
    if (bands[i][1] < -half || bands[i][2] > half) {
      throw new Error("raid: the " + bands[i][0] + " runs off the caddy face, which is " +
        (-half).toFixed(2) + " to " + half.toFixed(2) + ".");
    }
    for (var j = i + 1; j < bands.length; j++) {
      if (bands[i][2] > bands[j][1] && bands[i][1] < bands[j][2]) {
        throw new Error("raid: the " + bands[i][0] + " (" + bands[i][1].toFixed(2) + " to " +
          bands[i][2].toFixed(2) + ") overlaps the " + bands[j][0] + " (" +
          bands[j][1].toFixed(2) + " to " + bands[j][2].toFixed(2) + "). Anything hidden on " +
          "this face is a reading a student cannot take.");
      }
    }
  }
})();

function caddy(state) {
  const L = LOOK[state] || LOOK.empty;
  const z = FZ + L.out;              /* pulled caddies stand PROUD of the face */

  if (state === "empty") {
    /* A hole with the backplane visible at the bottom of it. */
    return [
      { shape: "box", size: [BAY_W, BAY_H, 0.10], pos: [0, 0, FZ - 0.34], r: 0.01, shade: L.face },
      { shape: "box", size: [BAY_W - 0.10, 0.08, 0.06], pos: [0, -BAY_H / 2 + 0.16, FZ - 0.30],
        r: 0.01, shade: 0.5 }
    ];
  }

  /* MEASURED AGAINST THE OWNER'S PHOTOGRAPHS of a caddy half out of a Dell
     chassis and a close-up of one lit. Four things were missing, and each
     is something a technician actually uses:

       - THE BAIL HANDLE. The single most recognisable feature of a
         hot-swap caddy and the thing you physically grab, and it was a
         thin vertical sliver down the edge. It runs across the face.
       - THE VENT WINDOWS. Four openings in the latch face with dark mesh
         behind them, not five stamped slots.
       - THE CAPACITY PLATE. Every caddy in the photograph carries its
         size on a printed plate. On a bench whose questions are about
         matching capacity, the number belongs on the part.
       - Two lamps rather than one. See the note on LOOK.

     Shades do the material separation, because a caddy is ONE part and the
     engine gives one colour per part: the body sits dark, the handle and
     latch are lifted to read as brushed metal against it, and the vents
     are dropped so they read as holes. */
  const parts = [
    /* the caddy face */
    { shape: "rbox", size: [BAY_W, BAY_H, 0.30], pos: [0, 0, z - 0.15], r: 0.035, shade: L.face },
    /* THE DRIVE ITSELF, sitting in the carrier behind the face.

       Built from the owner's photograph of two bare drives on a bench. It
       used to be a featureless box, which was defensible while it was only
       ever glimpsed — but a student PULLS a caddy on this bench, and what
       comes out has to be a drive rather than a brick. Three things make
       it one:

         - a bright aluminium TOP COVER over a darker body, which is the
           first thing you see on a real drive;
         - the green PCB along the underside;
         - and the CONNECTOR at the back: two blocks of gold pins of
           different widths, separated by a gap, set in a black housing.
           That gap is the SATA key, and it is the detail that tells a
           student which way round the thing goes.

       Only the last of those is visible while the caddy is home. All three
       are visible the moment it is pulled, which is when they matter. */
    { shape: "box", size: [BAY_W - 0.16, BAY_H - 0.30, 1.5], pos: [0, -0.03, z - 1.05],
      r: 0.01, shade: L.rail * 0.72 },
    /* the machined top cover */
    { shape: "box", size: [BAY_W - 0.20, 0.08, 1.42], pos: [0, BAY_H / 2 - 0.19, z - 1.05],
      r: 0.01, shade: L.rail * 1.9 },
    /* the board along the underside */
    { shape: "box", size: [BAY_W - 0.26, 0.05, 1.28], pos: [0, -BAY_H / 2 + 0.17, z - 1.02],
      r: 0.005, shade: L.rail * 0.5 },
    /* the connector housing at the back of the drive */
    { shape: "box", size: [BAY_W - 0.34, 0.30, 0.14], pos: [0.02, -BAY_H / 2 + 0.40, z - 1.78],
      r: 0.02, shade: L.rail * 0.42 },
    /* the two gold pin blocks, and the key gap between them */
    { shape: "box", size: [0.22, 0.16, 0.06], pos: [-0.22, -BAY_H / 2 + 0.40, z - 1.84],
      r: 0.005, shade: L.rail * 3.4 },
    { shape: "box", size: [0.40, 0.16, 0.06], pos: [0.22, -BAY_H / 2 + 0.40, z - 1.84],
      r: 0.005, shade: L.rail * 3.4 },
    /* the latch rail down the left edge, where the lamps sit */
    { shape: "rbox", size: [0.17, BAY_H - 0.12, 0.34], pos: [-BAY_W / 2 + 0.11, 0, z - 0.14],
      r: 0.03, shade: L.rail * 1.5 },
    /* THE BAIL HANDLE, across the face and standing proud of it */
    { shape: "rbox", size: [BAY_W - 0.34, HANDLE_H, 0.26], pos: [0.06, HANDLE_Y, z + 0.12],
      r: 0.08, shade: L.rail * 2.15 },
    /* its two stand-offs, so it reads as a handle with a gap behind it
       rather than a bar lying on the face */
    { shape: "box", size: [0.10, 0.20, 0.20], pos: [-BAY_W / 2 + 0.30, HANDLE_Y, z + 0.01],
      r: 0.02, shade: L.rail * 1.7 },
    { shape: "box", size: [0.10, 0.20, 0.20], pos: [BAY_W / 2 - 0.16, HANDLE_Y, z + 0.01],
      r: 0.02, shade: L.rail * 1.7 },
    /* the four vent windows, dropped so they read as openings */
    { shape: "box", size: [0.17, VENT_H, 0.06], pos: [-0.19, VENT_Y, z + 0.005],
      r: 0.02, shade: L.face * 0.30,
      repeat: { count: 4, step: [0.24, 0, 0] } },
    /* the capacity plate */
    { shape: "rbox", size: [BAY_W - 0.42, PLATE_H, 0.10], pos: [0.08, PLATE_Y, z + 0.02],
      r: 0.03, shade: L.face * 1.45 }
  ];

  return parts;
}

/* The lamp is a SEPARATE part from the caddy it sits on, and that split is
   the whole reason this model reads as hardware rather than as a toy.

   The engine gives one colour per part. Colour the caddy by its state and
   you get a row of green, red and orange plastic bricks — which was the
   first cut, and it looked like a child's abacus. A caddy is grey metal
   whatever is wrong with it; the only thing on a storage server that
   changes colour is the lamp, and it is about 4mm across.

   So: caddy parts are all the same steel, and these little discs carry the
   state. The lamp geometry never disappears between states — a part that
   comes and goes makes the row jump about while you are trying to compare
   eight of them — only its shade and colour move. */
function lamp(state) {
  const L = LOOK[state] || LOOK.empty;
  const z = FZ + L.out;
  const x = -BAY_W / 2 + 0.11, y = LAMP_Y;
  return [
    /* The lens. Larger than the 4mm a real one is, because this is a
       teaching model read at a distance by people whose sight is damaged,
       and an accurate lamp nobody can see teaches nothing. */
    /* SQUARE, not round. Every activity indicator in the owner's close-up
       is a square lens with a bright ring; the round dot was a guess and
       the square is what is actually on the machine. It also separates the
       two lamps by SHAPE as well as colour and position, which matters for
       students who cannot rely on colour alone. */
    { shape: "rbox", size: [0.30, 0.30, 0.09], pos: [x, y, z + 0.12],
      r: 0.05, shade: L.lamp },
    /* A cap over it, so the glow has thickness and does not read as a flat
       coloured sticker. */
    { shape: "rbox", size: [0.22, 0.22, 0.10], pos: [x, y, z + 0.17],
      r: 0.04, shade: L.lamp }
  ];
}

/* The dark recess a lamp sits in. Separate part, unlit, because a bright
   emissive disc floating on bare steel washes into it — the bezel is what
   gives the lamp an edge to read against. */
/* THE FAULT LAMP — the second one, and the one that matters most.

   Sits beside the activity lamp on the same latch rail, exactly as it does
   on the owner's photograph. Smaller, because the real one is: the big
   square is activity and the little amber one beside it is the fault. Drawn
   dark rather than removed when nothing is wrong, so eight bays stay eight
   identical shapes and the only thing that varies down the row is which
   ones are lit. */
function faultLamp(state) {
  const L = LOOK[state] || LOOK.empty;
  const z = FZ + L.out;
  const x = -BAY_W / 2 + 0.11, y = FAULT_Y;
  return [
    { shape: "cyl", size: [0.19, 0.08], pos: [x, y, z + 0.12], rot: [P2, 0, 0],
      seg: 14, shade: L.faultColor ? 1.15 : 0.30 },
    { shape: "sphere", size: [0.16], pos: [x, y, z + 0.15], seg: 12,
      shade: L.faultColor ? 1.15 : 0.30 }
  ];
}

function lampWell(state) {
  const L = LOOK[state] || LOOK.empty;
  const z = FZ + L.out;
  const x = -BAY_W / 2 + 0.11, y = LAMP_Y;
  return [
    { shape: "cyl", size: [0.44, 0.07], pos: [x, y, z + 0.07], rot: [P2, 0, 0],
      seg: 18, shade: 0.30 }
  ];
}

/* The chassis the bays are cut into: ears, vents, a bezel. */
function chassisBuild() {
  return [
    { shape: "rbox", size: [CH_W, CH_H, CH_D], pos: [0, 0, 0], r: 0.05, shade: 1.0 },
    /* rack ears */
    { shape: "rbox", size: [0.55, CH_H, 0.22], pos: [-CH_W / 2 - 0.26, 0, FZ - 0.1], r: 0.03, shade: 0.82 },
    { shape: "rbox", size: [0.55, CH_H, 0.22], pos: [CH_W / 2 + 0.26, 0, FZ - 0.1], r: 0.03, shade: 0.82 },
    /* cage-nut holes in the ears */
    { shape: "cyl", size: [0.13, 0.26], pos: [-CH_W / 2 - 0.26, 0.72, FZ - 0.1], rot: [P2, 0, 0],
      seg: 10, shade: 0.3, repeat: { count: 3, step: [0, -0.72, 0] } },
    { shape: "cyl", size: [0.13, 0.26], pos: [CH_W / 2 + 0.26, 0.72, FZ - 0.1], rot: [P2, 0, 0],
      seg: 10, shade: 0.3, repeat: { count: 3, step: [0, -0.72, 0] } },
    /* the bezel strip to the right of the bays, where the front panel lives */
    { shape: "box", size: [0.10, CH_H - 0.2, 0.06], pos: [CH_W / 2 - 0.42, 0, FZ + 0.01],
      r: 0.01, shade: 0.55 }
  ];
}

/* The front-panel cluster: power button, unit ID, and the two lamps that
   describe the MACHINE rather than any one disk. Students conflate the
   chassis health lamp with a drive lamp constantly, so it is drawn well
   away from the row and at a different size. */
/* The power button and the unit-ID lamp. Deliberately NOT the health lamp:
   one colour applies to a whole part, so leaving all three in here painted
   the power button red the moment the array degraded — the same mistake the
   caddies made, one panel to the right. A power button is grey on every
   server ever built and it must not move when a disk dies. */
function panelBuild() {
  return [
    /* the power button, with a ring around it */
    { shape: "cyl", size: [0.34, 0.10], pos: [CH_W / 2 - 0.72, 0.44, FZ + 0.02], rot: [P2, 0, 0],
      seg: 16, shade: 0.72 },
    { shape: "torus", size: [0.46, 0.06], pos: [CH_W / 2 - 0.72, 0.44, FZ + 0.01], rot: [0, 0, 0],
      seg: 18, seg2: 6, shade: 0.45 },
    /* the unit-ID lamp — the one you press so somebody in the aisle can find
       the box. It never carries health information and never changes here. */
    { shape: "cyl", size: [0.19, 0.07], pos: [CH_W / 2 - 0.72, -0.56, FZ + 0.02], rot: [P2, 0, 0],
      seg: 12, shade: 0.58 }
  ];
}

/* The chassis health lamp, on its own so it can carry a colour without
   dragging the power button along with it. */
function healthBuild() {
  return [
    { shape: "cyl", size: [0.21, 0.07], pos: [CH_W / 2 - 0.72, -0.12, FZ + 0.02], rot: [P2, 0, 0],
      seg: 12, shade: 1.0 }
  ];
}

const HEALTH_LOOK = {
  healthy:    { color: "#2fd45e", says: "Healthy" },
  degraded:   { color: "#ffa524", says: "Degraded — running without redundancy" },
  rebuilding: { color: "#ffa524", says: "Rebuilding" },
  critical:   { color: "#ff3b30", says: "Critical" }
};

/* The controller, drawn below the chassis on the bench rather than inside
   it. Putting it in the chassis would hide it, and the cache module and its
   battery are half of why a write-back array behaves the way it does. */
/* THE RAID CONTROLLER, rebuilt against the owner's photograph of an LSI
   9361-8i with its CacheVault module fitted.

   What was there was a flat board with a lump on it. What the photograph
   shows, and what a student has to be able to point at in a real machine:

     - TWO INTERNAL SAS CONNECTORS side by side, metal-shielded, on the
       card's left half. These are what the backplane cables land on, and
       "eight ports" means two of these at four lanes each — which is why
       the part number ends in -8i.
     - A DEEP FINNED HEATSINK over the RAID-on-chip, not a low block. It is
       the largest thing on the card and it is there because computing
       parity is real work.
     - CACHE DRAM chips flanking it.
     - The CACHE POWER MODULE standing off the card on its own bracket,
       joined by a RIBBON LEAD. The lead matters: the module is not on the
       card, it is tethered to it, and that is what a technician looks for
       when the array has "gone slow" — a disconnected or dead pack turns
       write-back off.
     - GOLD PCIe EDGE FINGERS along the bottom, in two groups split by the
       keying notch.
     - A single blue LED near the edge.

   Shades separate the materials within one part: the board sits at its own
   colour, the heatsink and connectors drop, the gold fingers and the
   module's label lift. */
function controllerBuild() {
  return [
    /* the card */
    { shape: "box", size: [4.6, 0.10, 1.9], pos: [0, 0, 0], r: 0.01, shade: 1.0 },
    /* the low-profile bracket */
    { shape: "box", size: [0.12, 0.9, 1.9], pos: [-2.36, 0.42, 0], r: 0.02, shade: 0.7 },
    /* PCIe edge fingers, in two groups either side of the keying notch */
    { shape: "box", size: [0.055, 0.10, 0.34], pos: [-1.05, -0.06, 0.72], r: 0.005, shade: 2.6,
      repeat: { count: 6, step: [0.10, 0, 0] } },
    { shape: "box", size: [0.055, 0.10, 0.34], pos: [-0.10, -0.06, 0.72], r: 0.005, shade: 2.6,
      repeat: { count: 14, step: [0.10, 0, 0] } },
    /* TWO INTERNAL SAS CONNECTORS — metal shrouds with a dark mouth */
    { shape: "rbox", size: [0.62, 0.30, 0.46], pos: [-1.42, 0.20, 0.30], r: 0.03, shade: 1.9,
      repeat: { count: 2, step: [0.80, 0, 0] } },
    { shape: "box", size: [0.46, 0.20, 0.10], pos: [-1.42, 0.20, 0.53], r: 0.01, shade: 0.30,
      repeat: { count: 2, step: [0.80, 0, 0] } },
    /* the RAID-on-chip under a deep finned heatsink */
    { shape: "box", size: [1.15, 0.10, 1.10], pos: [0.25, 0.08, 0], r: 0.01, shade: 0.42 },
    { shape: "box", size: [0.06, 0.52, 1.02], pos: [-0.28, 0.38, 0], r: 0.005, shade: 0.34,
      repeat: { count: 13, step: [0.085, 0, 0] } },
    /* cache DRAM, two above the heatsink and one below */
    { shape: "box", size: [0.34, 0.09, 0.26], pos: [-0.42, 0.09, -0.52], r: 0.01, shade: 0.38,
      repeat: { count: 2, step: [0, 0, 0.30] } },
    { shape: "box", size: [0.34, 0.09, 0.26], pos: [-0.42, 0.09, 0.42], r: 0.01, shade: 0.38 },
    /* THE CACHE POWER MODULE, standing off the card on its bracket */
    { shape: "rbox", size: [1.05, 0.62, 1.30], pos: [1.62, 0.36, 0], r: 0.07, shade: 0.30 },
    /* its white label, which is how you recognise it at a glance */
    { shape: "box", size: [0.80, 0.02, 1.00], pos: [1.62, 0.68, 0], r: 0.01, shade: 2.4 },
    /* THE RIBBON LEAD from the card up to the module. Four short segments
       stepping up and across, because it is not a straight wire and the
       fact that it is a separate tethered part is the teaching point. */
    { shape: "box", size: [0.09, 0.09, 0.34], pos: [0.98, 0.20, 0.30], r: 0.02, shade: 1.5 },
    { shape: "box", size: [0.09, 0.30, 0.09], pos: [0.98, 0.34, 0.45], r: 0.02, shade: 1.5 },
    { shape: "box", size: [0.52, 0.09, 0.09], pos: [1.24, 0.48, 0.45], r: 0.02, shade: 1.5 },
    { shape: "box", size: [0.09, 0.09, 0.30], pos: [1.48, 0.48, 0.31], r: 0.02, shade: 1.5 },
    /* the activity LED near the edge */
    { shape: "cyl", size: [0.10, 0.06], pos: [-0.05, 0.09, 0.62], rot: [P2, 0, 0],
      seg: 12, shade: 2.8 }
  ];
}


/* The bench the whole thing stands on. */
function boardSpec() {
  return {
    size: [17, 0.4, 7.5], pos: [0, -0.2, 0], color: "#39424a",
    build: [{ shape: "rbox", size: [17, 0.4, 7.5], pos: [0, 0, 0], r: 0.12, shade: 1.0 }],
    scale: 1
  };
}

/* ---------------------------------------------------------------------
   raidBench(view)

   `view` is what the lab knows about the array right now:

     bays        array of { state, label, sizeTB } — one per bay, 8 of them
     level       "RAID 5" etc, for the caption only; the model never grades
     arrayState  "healthy" | "degraded" | "critical" | "rebuilding"
     focus       optional bay index to call out, or null

   Returns a spec for mountScene. It reads `view` and returns geometry.
   It does not know what RAID 5 is and must not learn.
   --------------------------------------------------------------------- */
export function raidBench(view) {
  view = view || {};
  const bays = view.bays || [];
  const arrayState = view.arrayState || "healthy";

  /* The chassis stands ON the bench, not in it. The board's top surface is
     y = 0, so a 2U box has to be lifted by half its own height plus a hair,
     or it renders half-sunk into the worktop — which is precisely what the
     first render did. */
  const SIT = CH_H / 2 + 0.04;

  const parts = [
    { key: "chassis", label: "The chassis", build: chassisBuild(), finish: "matte", scale: 1,
      /* NEAR-BLACK, off the owner's rack photograph.

         This was #8d979e, a light grey, and the whole row read as pale
         plastic with the status lamps competing against the metal around
         them. Every rack in that photograph is matte near-black, and the
         only bright points on it are the lamps — which is exactly the
         hierarchy this bench needs, because finding the lit bay from the
         aisle IS the skill. The caddies are lifted a step above the
         chassis so the two still separate, and the handle and latch are
         lifted again inside the caddy's own shades. */
      pos: [0, SIT, -0.5], color: "#2b3136",
      spec: "2U, eight hot-swap bays",
      note: "Two rack units, eight bays across the front. The ears bolt it into the rack; the " +
        "cage-nut holes are what it hangs on." },
    { key: "panel", label: "Front panel", build: panelBuild(), finish: "plastic", scale: 1,
      pos: [0, SIT, -0.5], color: "#353c42",
      spec: "Power button and unit ID",
      note: "Neither of these says anything about the disks. The button powers the chassis; the " +
        "lamp under it is the one you press so somebody standing in the aisle can find this box " +
        "among forty identical ones." },
    { key: "health", label: "Chassis health lamp", build: healthBuild(), finish: "plastic", scale: 1,
      pos: [0, SIT, -0.5], color: (HEALTH_LOOK[arrayState] || HEALTH_LOOK.healthy).color,
      glow: 1.35,
      spec: (HEALTH_LOOK[arrayState] || HEALTH_LOOK.healthy).says,
      note: "This describes the MACHINE, not any one disk. A student who reads it as a drive lamp " +
        "will pull the wrong caddy, which is exactly how a degraded array becomes a lost one." }
  ];

  /* Two parts per bay: the caddy, and the lamp on it.

     The caddy is the CONTROL — it is what gets a focusable button beside
     the canvas and what a student pulls. The lamp is scenery bolted to it,
     and the bench host filters it out of the control list by its key, so
     nobody tabs through sixteen items to reach eight. */
  bays.forEach(function (b, i) {
    const st = b.state || "empty";
    const L = LOOK[st] || LOOK.empty;
    const shift = function (p) {
      const q = Object.assign({}, p);
      q.pos = [p.pos[0] + bayX(i), p.pos[1], p.pos[2]];
      return q;
    };
    parts.push({
      key: "bay" + (i + 1),
      label: "Bay " + (i + 1),
      build: caddy(st).map(shift),
      finish: st === "empty" ? "matte" : "metal",
      scale: 1,
      pos: [0, SIT, -0.5],
      /* Steel, every one of them, whatever is wrong with it. */
      /* DARKENED TOWARD THE REAL THING. The owner's rack photograph is
         near-black matte with the only bright points being the lamps; this
         row was a pale grey that made the lamps compete with the metal
         around them. The shades inside caddy() lift the handle, latch and
         plate back up, so the part still separates into its pieces without
         the whole row glowing. */
      color: st === "empty" ? "#23282d" : "#525a62",
      spec: st === "empty" ? "No drive fitted" : (b.sizeTB ? b.sizeTB + " TB" : "Drive fitted"),
      note: SAYS[st]
    });
    if (st !== "empty") {
      parts.push({
        key: "bay" + (i + 1) + "well",
        label: "Bay " + (i + 1) + " lamp surround",
        build: lampWell(st).map(shift),
        finish: "matte", scale: 1, pos: [0, SIT, -0.5], color: "#20262b",
        spec: "", note: ""
      });
      parts.push({
        key: "bay" + (i + 1) + "lamp",
        label: "Bay " + (i + 1) + " activity lamp",
        build: lamp(st).map(shift),
        finish: "plastic",
        scale: 1,
        pos: [0, SIT, -0.5],
        color: L.lampColor,
        glow: L.glow,
        spec: SAYS[st],
        note: SAYS[st]
      });
      /* Its own part, because it is its own lamp and it is the one that
         decides whether this is a maintenance job or an outage. */
      parts.push({
        key: "bay" + (i + 1) + "fault",
        label: "Bay " + (i + 1) + " fault lamp",
        build: faultLamp(st).map(shift),
        finish: "plastic",
        scale: 1,
        pos: [0, SIT, -0.5],
        color: L.faultColor || "#2a2f33",
        glow: L.faultGlow,
        spec: L.faultColor ? "Lit" : "Dark",
        note: L.faultColor
          ? "The fault lamp is lit on this bay. Amber is not the same as red \u2014 read the " +
            "activity lamp beside it before you touch anything."
          : "Nothing wrong reported on this bay."
      });
    }
  });

  parts.push({
    key: "controller", label: "The RAID controller", build: controllerBuild(), finish: "board",
    /* Teal, off the photograph, not the olive green it was. Server
       controllers are a dark blue-green and it is one of the ways you tell
       one from a consumer card at a glance. */
    scale: 1, pos: [-3.0, 0.10, 2.75], color: "#1d4a54",
    spec: "Cache module and battery fitted",
    note: "The controller is what actually computes parity, and the cache is why a write returns " +
      "before the platter has it. The battery on the cache is the reason that is safe — lose it " +
      "and write-back turns itself off, which students meet as \"the array got slow\"."
  });

  const focusName = (view.focus === 0 || view.focus > 0) ? ("Bay " + (view.focus + 1)) : null;

  return {
    kind: "bench",
    title: "Eight bays, seen the way you meet them",
    caption: "The front of a 2U storage server. Each caddy is its own control — the lamp tells " +
      "you its condition, the handle is what you pull, and the panel on the right belongs to the " +
      "chassis rather than to any disk in it." +
      (focusName ? " " + focusName + " is the one in question." : ""),
    board: boardSpec(),
    decor: [],
    parts: parts,
    /* Bay 8, the front panel and the controller all fell off the right
       edge at an 860px panel and narrower — on a lab whose whole interaction
       is "pull bay 6, now pull bay 3". fitWidth holds the full chassis on
       screen at any width; it does nothing on a wide one. */
    camera: { dist: 9.6, fitWidth: 16, yaw: 0.34, pitch: 0.13,
      target: [0, 1.2, 0.5], min: 5, max: 30 }
  };
}

/* The states this model can draw, exported so a verifier can assert it
   handles every state the lab is capable of producing rather than trusting
   that it does. That check has earned its place in this program. */
export const BAY_STATES = Object.keys(LOOK);
export const BAY_COUNT = BAYS;
