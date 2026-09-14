/* =====================================================================
   A+ Core1 Under the Hood Labs — the display bench

   A monitor with its stack pulled apart, and a strip of every video
   connector laid out below it.

   TWO THINGS IN ONE FRAME, ON PURPOSE

   3.1 is what a display is made of. 1.2 is how you get a picture into
   one. Those are the same job from a student's point of view — "no
   image" is answered by knowing both — and splitting them across two
   benches would teach them as two unrelated facts.

   So the stack is exploded upward and the ports run along the bottom in
   one flat row. Seventh bench, and the occlusion rule is now applied
   before the first render: nothing on this bench sits behind anything.

   THE BACKLIGHT IS THE WHOLE POINT OF THE STACK

   The single most useful thing a technician knows about a dark screen is
   the torch test: shine a light at it, and if a faint image is there the
   PANEL is fine and the BACKLIGHT is dead. That is a completely
   different part, a completely different price, and students get it
   wrong constantly because both faults look identical from the front.

   So the backlight is drawn as its own layer, lit from one edge, and the
   panel above it is drawn as a separate sheet. Seeing them apart once is
   worth more than reading the distinction three times.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Panel footprint, roughly a 24-inch screen at 30mm to the unit. */
const PW = 17.6;
const PH = 10.0;

/* THE SEPARATION AND THE CAMERA PITCH ARE ONE DECISION, NOT TWO.

   An exploded stack of same-footprint sheets is the one arrangement where
   occlusion can be computed rather than discovered, so compute it. A sheet
   spanning the full depth PH projects to a band of screen height
   PH*sin(pitch); two layers LAYER_GAP apart have their centres
   LAYER_GAP*cos(pitch) apart. Neighbouring layers therefore stay clear of
   each other exactly when

       LAYER_GAP > PH * tan(pitch)

   The first cut had a gap of 1.4 against PH*tan(0.30) = 3.09, so every
   layer overlapped its neighbour by more than double and the driver board
   — the one carrying the video signal, the whole point of the connect
   stage — was completely buried. The numbers below hold with a margin of
   about a third of a band; CAM_PITCH and LAYER_GAP may not be changed
   independently, and the assertion under them fails the module on load if
   somebody tries. */
const CAM_PITCH = 0.17;
const LAYER_GAP = 2.3;

/* Bottom to top. Order is the lesson, declared once. */
export const LAYERS = [
  { key: "back",      label: "Rear housing",   says: "Cover off, boards exposed" },
  { key: "psu",       label: "Power board",    says: "Mains in, low voltage out" },
  { key: "driver",    label: "Driver board",   says: "Takes the video signal and drives the panel" },
  { key: "backlight", label: "Backlight",      says: "LEDs down one edge, spread by a diffuser" },
  { key: "panel",     label: "LCD panel",      says: "Makes the image. Makes no light of its own" },
  { key: "bezel",     label: "Bezel and glass", says: "The front, and what gets scratched" }
].map(function (L, i) { L.y = i * LAYER_GAP; return L; });

if (LAYER_GAP <= PH * Math.tan(CAM_PITCH)) {
  throw new Error("bench-display: a layer gap of " + LAYER_GAP + " is under PH*tan(pitch) = " +
    (PH * Math.tan(CAM_PITCH)).toFixed(2) + ", so the layers would bury each other.");
}

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "Tested, working" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Worth checking" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is what has failed" },
  unknown: { color: "#5a6470", glow: 0.00, says: "Not tested yet" },
  na:      { color: "#39404a", glow: 0.00, says: "Nothing wrong here" }
};
export function layerWords(v) { return (LOOK[v] || LOOK.unknown).says; }

/* ---------------------------------------------------------------------
   1.2 — the ports, in a row along the bottom.

   Each one drawn to its real shape, because "which of these is DisplayPort"
   is a question answered by looking, and a row of identical rectangles
   would answer it for them.
   --------------------------------------------------------------------- */
export const PORTS = [
  { key: "vga",   label: "VGA",           carries: "Analogue video only. No audio, and it softens as the cable gets longer" },
  { key: "dvi",   label: "DVI",           carries: "Digital video, no audio. The bridge between VGA and HDMI" },
  { key: "hdmi",  label: "HDMI",          carries: "Digital video and audio down one cable" },
  { key: "dp",    label: "DisplayPort",   carries: "Digital video and audio, and it can daisy-chain monitors" },
  { key: "usbc",  label: "USB-C",         carries: "Video only if the port supports DisplayPort Alternate Mode" },
  { key: "tb",    label: "Thunderbolt",   carries: "USB-C shape, with video, data and power all guaranteed" }
];

const PORT_Y = -4.6;
/* Forward of the stack, so the rear housing never sits over the row. */
const PORT_Z = 6.4;
const PORT_X0 = -7.6;
const PORT_STEP = 3.1;
export function portX(i) { return PORT_X0 + i * PORT_STEP; }

/* Each connector's own outline, seen face on. */
function portBuild(key, x) {
  const y = PORT_Y;
  switch (key) {
    case "vga":
      /* a trapezoid with two thumbscrews — unmistakable */
      return [
        { shape: "box", size: [2.1, 0.9, 0.5], pos: [x, y, PORT_Z], r: 0.1, shade: 1.0 },
        { shape: "cyl", size: [0.5, 0.5], pos: [x - 1.35, y, PORT_Z], rot: [P2, 0, 0], seg: 12, shade: 0.7 },
        { shape: "cyl", size: [0.5, 0.5], pos: [x + 1.35, y, PORT_Z], rot: [P2, 0, 0], seg: 12, shade: 0.7 },
        { shape: "box", size: [1.7, 0.45, 0.2], pos: [x, y, PORT_Z + 0.28], r: 0.03, shade: 0.35 }
      ];
    case "dvi":
      /* wider, with the flat blade off to one side */
      return [
        { shape: "box", size: [2.5, 0.95, 0.5], pos: [x, y, PORT_Z], r: 0.08, shade: 1.0 },
        { shape: "box", size: [1.5, 0.5, 0.2], pos: [x - 0.35, y, PORT_Z + 0.28], r: 0.02, shade: 0.35 },
        { shape: "box", size: [0.22, 0.55, 0.22], pos: [x + 0.95, y, PORT_Z + 0.28], r: 0.02, shade: 0.35 },
        { shape: "cyl", size: [0.5, 0.5], pos: [x - 1.55, y, PORT_Z], rot: [P2, 0, 0], seg: 12, shade: 0.7 },
        { shape: "cyl", size: [0.5, 0.5], pos: [x + 1.55, y, PORT_Z], rot: [P2, 0, 0], seg: 12, shade: 0.7 }
      ];
    case "hdmi":
      /* The tapered mouth, built from two stacked bars rather than a cone.
         A 4-segment cone is a pyramid, and it rendered as a diamond
         standing on its point — which looks like nothing on any computer
         ever made. */
      return [
        { shape: "box", size: [1.9, 0.85, 0.5], pos: [x, y, PORT_Z], r: 0.12, shade: 1.0 },
        { shape: "box", size: [1.5, 0.24, 0.2], pos: [x, y + 0.14, PORT_Z + 0.28], r: 0.02, shade: 0.35 },
        { shape: "box", size: [1.1, 0.22, 0.2], pos: [x, y - 0.1, PORT_Z + 0.28], r: 0.02, shade: 0.35 }
      ];
    case "dp":
      /* one square corner, one chamfered — the actual distinguishing mark */
      return [
        { shape: "box", size: [1.8, 0.85, 0.5], pos: [x, y, PORT_Z], r: 0.06, shade: 1.0 },
        { shape: "box", size: [1.45, 0.5, 0.2], pos: [x, y, PORT_Z + 0.28], r: 0.02, shade: 0.35 },
        { shape: "box", size: [0.34, 0.34, 0.24], pos: [x + 0.68, y + 0.24, PORT_Z + 0.3], rot: [0, 0, 0.78],
          r: 0.01, shade: 1.3 }
      ];
    case "usbc":
    case "tb":
      /* the same oval for both, because they ARE the same shape, and that
         is precisely the confusion this bench exists to surface */
      return [
        { shape: "box", size: [1.5, 0.8, 0.5], pos: [x, y, PORT_Z], r: 0.1, shade: 1.0 },
        { shape: "cyl", size: [0.42, 0.3], pos: [x - 0.32, y, PORT_Z + 0.3], rot: [P2, 0, 0], seg: 14, shade: 0.3 },
        { shape: "cyl", size: [0.42, 0.3], pos: [x + 0.32, y, PORT_Z + 0.3], rot: [P2, 0, 0], seg: 14, shade: 0.3 },
        { shape: "box", size: [0.64, 0.42, 0.3], pos: [x, y, PORT_Z + 0.3], r: 0.02, shade: 0.3 },
        /* Thunderbolt is marked, and the mark is the only way to tell */
        key === "tb"
          ? { shape: "box", size: [0.16, 0.5, 0.16], pos: [x, y + 0.72, PORT_Z + 0.2], rot: [0, 0, 0.35],
              r: 0.02, shade: 1.8 }
          : { shape: "box", size: [0.5, 0.09, 0.14], pos: [x, y + 0.72, PORT_Z + 0.2], r: 0.02, shade: 1.1 }
      ];
    default:
      return [];
  }
}

/* ---------- the display layers ---------- */
function sheet(y, thick, inset, shade) {
  return { shape: "rbox", size: [PW - inset, thick, PH - inset], pos: [0, y, 0],
    r: 0.2, shade: shade === undefined ? 1.0 : shade };
}

const BUILD = {
  back: function (y) {
    return [
      sheet(y, 0.5, 0, 1.0),
      /* the stand mount, and the vents */
      { shape: "rbox", size: [3.2, 0.4, 3.2], pos: [0, y - 0.4, 0], r: 0.1, shade: 0.72 },
      { shape: "box", size: [PW - 4.0, 0.08, 0.22], pos: [0, y + 0.28, -3.2], r: 0.02, shade: 0.5,
        repeat: { count: 6, step: [0, 0, 1.05] } }
    ];
  },
  psu: function (y) {
    return [
      { shape: "box", size: [7.0, 0.22, 3.0], pos: [-3.6, y, 1.4], r: 0.04, shade: 1.0 },
      /* the big smoothing capacitors, which are what fails */
      { shape: "cyl", size: [1.0, 1.1], pos: [-5.4, y + 0.6, 1.4], seg: 14, shade: 1.25 },
      { shape: "cyl", size: [1.0, 1.1], pos: [-3.9, y + 0.6, 1.4], seg: 14, shade: 1.25 },
      { shape: "box", size: [1.6, 0.5, 1.1], pos: [-1.4, y + 0.3, 1.4], r: 0.05, shade: 0.7 },
      /* the mains inlet */
      { shape: "box", size: [1.2, 0.6, 0.7], pos: [-6.8, y + 0.3, -2.8], r: 0.06, shade: 0.45 }
    ];
  },
  driver: function (y) {
    return [
      { shape: "box", size: [8.0, 0.2, 2.4], pos: [2.4, y, -1.4], r: 0.04, shade: 1.0 },
      /* the scaler chip under its little heatsink */
      { shape: "rbox", size: [1.6, 0.3, 1.6], pos: [1.6, y + 0.24, -1.4], r: 0.05, shade: 0.6 },
      /* the ribbon that runs up to the panel */
      { shape: "box", size: [4.2, 0.06, 0.9], pos: [3.2, y + 0.16, 0.2], r: 0.02, shade: 1.4 },
      /* the video sockets on its edge, which is where the ports below land */
      { shape: "box", size: [0.9, 0.4, 0.6], pos: [5.2, y + 0.3, -2.4], r: 0.04, shade: 0.42,
        repeat: { count: 3, step: [1.2, 0, 0] } }
    ];
  },
  backlight: function (y, dead) {
    return [
      sheet(y, 0.16, 1.4, dead ? 0.5 : 1.0),
      /* the LED strip down the bottom edge, and the diffuser above it */
      { shape: "box", size: [PW - 3.0, 0.2, 0.34], pos: [0, y + 0.2, PH / 2 - 1.4], r: 0.03,
        shade: dead ? 0.35 : 2.0 },
      { shape: "box", size: [PW - 2.4, 0.06, PH - 2.6], pos: [0, y + 0.14, 0], r: 0.02,
        shade: dead ? 0.5 : 1.35 }
    ];
  },
  /* The panel is just a sheet. It does NOT carry the artefact.

     It used to, and that was a mistake in two directions at once. Drawn on
     a horizontal face under a shallow camera it was invisible, and drawn
     on the PANEL it quietly told the student the panel was the fault —
     which it is for dead pixels and burn-in, and is not for banding (the
     driver board) or a dark screen (the backlight). The symptom belongs on
     the customer's screen at the front; which part failed is what the
     student has to work out. */
  panel: function (y) {
    return [sheet(y, 0.22, 1.0, 1.0)];
  },
  bezel: function (y, cracked) {
    const t = 0.9;
    const out = [
      { shape: "rbox", size: [PW, 0.3, t], pos: [0, y, -PH / 2 + t / 2], r: 0.06, shade: 1.0 },
      { shape: "rbox", size: [PW, 0.3, t], pos: [0, y, PH / 2 - t / 2], r: 0.06, shade: 1.0 },
      { shape: "rbox", size: [t, 0.3, PH], pos: [-PW / 2 + t / 2, y, 0], r: 0.06, shade: 1.0 },
      { shape: "rbox", size: [t, 0.3, PH], pos: [PW / 2 - t / 2, y, 0], r: 0.06, shade: 1.0 }
    ];
    if (cracked) {
      for (let i = 0; i < 6; i++) {
        const a = -0.7 + i * 0.26;
        const len = 3.4 + (i % 3) * 1.4;
        out.push({ shape: "box", size: [0.08, 0.06, len], pos: [-4.4 + Math.sin(a) * len * 0.4,
          y + 0.18, -2.4 + Math.cos(a) * len * 0.4], rot: [0, a, 0], r: 0.01, shade: 2.0 });
      }
    }
    return out;
  }
};

/* ---------------------------------------------------------------------
   THE CUSTOMER'S VIEW — an upright screen standing on the mat.

   The artefacts used to be drawn on the LCD panel's own top face. Two
   things were wrong with that, and only one of them was the geometry.

   The geometry: the layer separation above needs a shallow camera pitch,
   and a shallow pitch turns every horizontal face edge-on. Banding drawn
   on the panel's face rendered as a row of faint notches on one edge —
   invisible, so the fault stage was asking about a symptom that was not
   on screen.

   The teaching, which matters more: drawing the symptom on the panel says
   the panel is at fault. It is not, in two of the four cases. Banding is a
   failed column driver on the DRIVER board, and a dark screen with a
   ghost still in it is the BACKLIGHT. Putting the symptom where the fault
   is answers the question the stage is asking.

   So the symptom stands up front on its own screen, the way the customer
   saw it, and the stack behind is the evidence the student reasons from.
   --------------------------------------------------------------------- */
const SCR_X = -14.4;
/* Forward, on the same line as the connector row, so the rear housing
   behind it never clips its top corner. */
const SCR_Z = 6.2;
const SCR_Y = -3.2;          /* centre of the picture area */
const SCR_W = 7.4;
const SCR_H = 4.8;

function screenBody() {
  return [
    /* surround */
    { shape: "rbox", size: [SCR_W + 0.8, SCR_H + 0.8, 0.55], pos: [SCR_X, SCR_Y, SCR_Z], r: 0.16, shade: 1.0 },
    /* neck and foot, so it reads as a monitor rather than a floating tile */
    { shape: "box", size: [0.9, 1.5, 0.6], pos: [SCR_X, SCR_Y - SCR_H / 2 - 1.0, SCR_Z], r: 0.08, shade: 0.7 },
    { shape: "rbox", size: [3.6, 0.35, 2.2], pos: [SCR_X, SCR_Y - SCR_H / 2 - 1.7, SCR_Z], r: 0.1, shade: 0.55 }
  ];
}

/* The lit picture area is its own part because it is its own colour: a
   working screen is pale, a dark one is nearly black, and one part cannot
   be both. */
function screenFace() {
  return [{ shape: "rbox", size: [SCR_W, SCR_H, 0.16], pos: [SCR_X, SCR_Y, SCR_Z + 0.32], r: 0.06, shade: 1.0 }];
}

/* What is wrong with the picture, drawn ON the picture. Third part, third
   colour. Returns [] when the screen looks right, and the caller then
   leaves the part out rather than adding an empty one. */
function screenArtefact(art, ghost) {
  const z = SCR_Z + 0.44;
  if (art === "lines") {
    /* vertical bands, full height, evenly spaced across the picture */
    return [{ shape: "box", size: [0.34, SCR_H - 0.5, 0.1], pos: [SCR_X - 2.6, SCR_Y, z], r: 0.02,
      shade: 1.0, repeat: { count: 5, step: [1.3, 0, 0] } }];
  }
  if (art === "dead") {
    /* a tight cluster, off centre, the size a cluster really is */
    return [{ shape: "box", size: [0.2, 0.2, 0.1], pos: [SCR_X + 1.5, SCR_Y + 0.7, z], r: 0.01,
      shade: 1.0, repeat: { count: 4, step: [0.26, -0.24, 0] } },
      { shape: "box", size: [0.2, 0.2, 0.1], pos: [SCR_X + 1.62, SCR_Y + 0.44, z], r: 0.01,
        shade: 1.0, repeat: { count: 3, step: [0.26, -0.24, 0] } }];
  }
  if (art === "burn") {
    /* the ghost of a toolbar and a sidebar, burnt in where they always sat */
    return [
      { shape: "box", size: [SCR_W - 1.0, 0.42, 0.1], pos: [SCR_X, SCR_Y + SCR_H / 2 - 0.7, z], r: 0.02, shade: 1.0 },
      { shape: "box", size: [0.42, SCR_H - 1.6, 0.1], pos: [SCR_X - SCR_W / 2 + 0.7, SCR_Y - 0.4, z], r: 0.02, shade: 1.0 }
    ];
  }
  if (ghost) {
    /* Backlight gone: the image is still being made, and a torch at the
       right angle finds it. That faint ghost IS the diagnosis, so it has
       to be on screen or the torch test has nothing to reveal. A power
       board failure is black too and has no ghost under any torch, which
       is why this is passed in rather than inferred from `dark`. */
    return [
      { shape: "box", size: [SCR_W - 2.6, 0.3, 0.1], pos: [SCR_X, SCR_Y + 0.9, z], r: 0.02, shade: 1.0 },
      { shape: "box", size: [SCR_W - 3.8, 0.3, 0.1], pos: [SCR_X - 0.4, SCR_Y, z], r: 0.02, shade: 1.0 },
      { shape: "box", size: [SCR_W - 4.6, 0.3, 0.1], pos: [SCR_X - 0.8, SCR_Y - 0.9, z], r: 0.02, shade: 1.0 }
    ];
  }
  return [];
}

/* Pips off the right edge of the stack. */
function pip(y) {
  return [
    { shape: "cyl", size: [0.72, 0.18], pos: [PW / 2 + 1.9, y + 0.1, 0], rot: [0, 0, P2],
      seg: 16, shade: 1.0 },
    { shape: "sphere", size: [0.62], pos: [PW / 2 + 2.0, y + 0.1, 0], seg: 14, shade: 1.0 }
  ];
}
function pipWell(y) {
  return [{ shape: "cyl", size: [1.08, 0.11], pos: [PW / 2 + 1.8, y + 0.1, 0],
    rot: [0, 0, P2], seg: 16, shade: 0.30 }];
}

function portPip(x) {
  return [
    { shape: "cyl", size: [0.5, 0.14], pos: [x, PORT_Y + 1.5, PORT_Z], rot: [P2, 0, 0], seg: 14, shade: 1.0 },
    { shape: "sphere", size: [0.44], pos: [x, PORT_Y + 1.56, PORT_Z], seg: 12, shade: 1.0 }
  ];
}

/* ---------------------------------------------------------------------
   displayBench(view)

     view.states     { back, psu, driver, backlight, panel, bezel }
     view.ports      { vga: "ok"|"na"|"faulty"|"suspect", ... }
     view.artefact   null | "lines" | "dead" | "burn"
     view.cracked    is the bezel glass cracked
     view.showPorts  draw the connector row
   --------------------------------------------------------------------- */
export function displayBench(view) {
  view = view || {};
  const st = view.states || {};
  const backlightDead = st.backlight === "faulty";

  const parts = [];

  /* The customer's view goes first so it reads as the starting point:
     this is what they saw, everything behind it is why. */
  const art = view.artefact || null;
  /* Two different facts, and conflating them was the bug. The screen is
     black because the CUSTOMER says it is black — known before anything is
     tested. The backlight layer's lamp goes red only once the student has
     tested it. Defaulting `dark` to the backlight verdict keeps any older
     caller working, but the lab passes it explicitly. */
  const dark = view.dark === undefined ? backlightDead : !!view.dark;
  const ghost = !!view.ghost;
  parts.push({ key: "screen-body", label: "The screen, as the customer sees it",
    build: screenBody(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#2b323a",
    spec: "The symptom, standing on its own. What is wrong with the picture is not " +
      "always wrong with the panel.", note: "" });
  parts.push({ key: "screen-face", label: "Picture",
    build: screenFace(), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: dark ? "#0d1114" : "#c9d3da", glow: dark ? 0 : 0.22,
    spec: dark ? "Backlit? No. Hold a torch to it at an angle and look again."
               : "Lit, and bright enough to read", note: "" });
  const marks = screenArtefact(art, ghost);
  if (marks.length) {
    parts.push({ key: "screen-artefact",
      label: ghost && !art ? "Faint image under torchlight" :
        art === "lines" ? "Vertical banding" :
        art === "dead" ? "Cluster of dead pixels" : "Burnt-in ghost image",
      build: marks, finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: dark ? "#3f4a54" : "#1a2026", glow: 0,
      spec: ghost && !art ? "The panel is still drawing the picture. Nothing is lighting it."
        : art === "lines" ? "Whole columns, top to bottom, in the same place every time"
        : art === "dead" ? "A few pixels, always the same ones, never moving"
        : "A ghost of whatever sat there for months", note: "" });
  }

  LAYERS.forEach(function (L) {
    const state = st[L.key] || "unknown";
    const K = LOOK[state] || LOOK.unknown;
    parts.push({
      key: "layer-" + L.key,
      label: L.label,
      build: L.key === "backlight" ? BUILD.backlight(L.y, backlightDead)
           : L.key === "panel"     ? BUILD.panel(L.y)
           : L.key === "bezel"     ? BUILD.bezel(L.y, !!view.cracked)
           : BUILD[L.key](L.y),
      finish: L.key === "psu" || L.key === "driver" ? "board"
            : (L.key === "backlight" ? "plastic" : "plastic"),
      scale: 1, pos: [0, 0, 0],
      color: L.key === "psu" || L.key === "driver" ? "#1f3a2a"
           : L.key === "backlight" ? "#e8eef2"
           : L.key === "panel" ? "#cfd8de" : "#2b323a",
      spec: L.says,
      note: ""
    });
    parts.push({ key: "well-" + L.key, label: L.label + " indicator surround",
      build: pipWell(L.y), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + L.key, label: L.label + " status",
      build: pip(L.y), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: K.color, glow: K.glow, spec: K.says, note: K.says });
  });

  if (view.showPorts !== false) {
    const ps = view.ports || {};
    PORTS.forEach(function (p, i) {
      const x = portX(i);
      const state = ps[p.key] || "na";
      const K = LOOK[state] || LOOK.na;
      parts.push({
        key: "port-" + p.key, label: p.label, build: portBuild(p.key, x),
        finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#8d979e",
        spec: p.carries, note: ""
      });
      parts.push({ key: "portpip-" + p.key, label: p.label + " status",
        build: portPip(x), finish: "plastic", scale: 1, pos: [0, 0, 0],
        color: K.color, glow: K.glow, spec: K.says, note: K.says });
    });
  }

  return {
    kind: "bench",
    title: "The monitor, and everything you could plug into it",
    caption: "On the left, what the customer sees. Behind it, bottom to top: housing, power " +
      "board, driver board, backlight, panel, bezel. The row along the front is every video " +
      "connector, drawn to its own shape.",
    board: {
      size: [38, 0.5, 20], pos: [0, -6.2, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [38, 0.5, 20], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth SWEPT against frustumOK at 319, 480, 697 and 889px — the
       canvas widths the running lab actually hands out, 319 being what
       fits inside a 390px phone. The suite renders at 1100 and had never
       asked. This bench lost EIGHTEEN parts at 319px, the worst in the build.

       The value is one sweep step above the measured minimum, because
       the sweep drives the default view and a bench is at its widest in
       some other state. It costs nothing on a wide canvas: fitDist takes
       the LARGER of dist and the fit, so a roomy canvas never notices. */
    camera: { dist: 40.0, fitWidth: 50, yaw: 0.30, pitch: CAM_PITCH,
      target: [0, 3.2, 1.5], min: 13, max: 70 }
  };
}

/* =====================================================================
   THE DEVICE BENCH — one device, one symptom, nothing else.

   The Core 1 Device Issue Diagnosis Lab hands a technician ten devices
   and asks, for each, what the issue IS and what the fix IS. Six of the
   ten are monitors and projectors, and the exercise is entirely about
   what the picture looks like — a ghost of a toolbar, a trapezoid, a
   greyscale that has collapsed to black and white.

   The original draws all of that in a paragraph. A paragraph describing
   a picture is the one thing a picture does better, so here the device
   is drawn and the symptom is ON it. There is no layer stack and no
   port strip: this stage is not about what is inside, it is about
   looking at what the user is looking at and naming it.

   `displayBench` above is the teardown. This is the customer's desk.

   TWO RULES CARRIED OVER, both learned the hard way elsewhere in this
   build:

     - ONE COLOUR PER PART. The picture is its own part, the artefact on
       it is its own part, and the chassis never changes colour — a
       monitor's bezel does not go dark when the picture does.
     - AN ARTEFACT MUST BE PROUD OF WHAT IT SITS ON. The workstation
       bench's monitor panel was placed inside its own bezel twice and
       simply never appeared. Every offset below is measured from the
       face it has to clear, not guessed.
   ===================================================================== */

/* The device sits centred, facing the bench. Its own coordinates, so
   nothing here has to agree with the teardown's layout. */
const DEV_W = 9.0;             /* picture width */
const DEV_H = 5.6;             /* picture height */
/* The centre of the picture, chosen so the STAND lands on the bench mat
   rather than through it. The first version put the picture at 3.4 and
   the stand \u2014 which is 2.5 units of arm plus a hub below the chin \u2014
   ended up entirely below the mat's top surface, so the monitor appeared
   to be lying on the bench with no stand at all. This number is derived
   from the parts under it, not chosen: chin + arm + hub, plus clearance. */
const DEV_Y = 6.4;
const DEV_Z = 0.0;
const DEV_FACE = DEV_Z + 0.34; /* the picture plane */
const DEV_ART  = DEV_Z + 0.50; /* anything drawn ON the picture */

/* The projected image, on a wall behind a projector on a table. */
const PRJ_W = 12.4;
const PRJ_H = 9.3;
const PRJ_Y = 6.3;
const PRJ_Z = -5.0;            /* the wall */
const PRJ_ART = PRJ_Z + 0.30;

function devChassis() {
  /* Built from the owner's photograph rather than from memory, and three
     things in it were wrong before:

       - THE BEZEL IS THIN, and thicker along the bottom than anywhere
         else. A uniform fat frame is what a monitor looked like fifteen
         years ago.
       - THE STAND IS THE RECOGNISABLE PART. It is not a neck on a slab:
         it is a splayed V-arm rising out of a round hub, on four flat
         legs that radiate across the desk. That silhouette is most of
         what makes the object read as a monitor at a glance, and it was
         the piece I had invented.
       - THERE IS A CABLE, coiled on the floor. It is scenery and it is
         also the thing that says "this is a real desk", so it stays. */
  const BEZ_SIDE = 0.34, BEZ_TOP = 0.34, BEZ_CHIN = 0.95;
  const bezW = DEV_W + BEZ_SIDE * 2;
  const bezH = DEV_H + BEZ_TOP + BEZ_CHIN;
  const bezY = DEV_Y - (BEZ_CHIN - BEZ_TOP) / 2;
  const chinY = DEV_Y - DEV_H / 2 - BEZ_CHIN / 2;
  const hubY = DEV_Y - DEV_H / 2 - BEZ_CHIN - 2.5;
  const out = [
    /* the bezel, thin at the top and sides and deeper along the chin */
    { shape: "rbox", size: [bezW, bezH, 0.42], pos: [0, bezY, DEV_Z], r: 0.10, shade: 1.0 },
    /* the badge on the chin */
    { shape: "box", size: [1.5, 0.24, 0.05], pos: [0, chinY, DEV_FACE + 0.02], r: 0.02, shade: 0.72 },
    /* the power lamp, bottom right of the chin \u2014 lit whatever the
       picture is doing, which is the trap in "the monitor is on, so the
       monitor is fine" */
    { shape: "cyl", size: [0.16, 0.06], pos: [bezW / 2 - 0.9, chinY, DEV_FACE + 0.03],
      rot: [P2, 0, 0], seg: 14, shade: 1.6 },
    /* the back of the panel, thicker in the middle where the electronics are */
    { shape: "rbox", size: [bezW - 1.4, bezH - 1.4, 0.7], pos: [0, bezY, DEV_Z - 0.5], r: 0.12, shade: 0.78 }
  ];
  /* THE STAND. A V-arm out of a hub, then the hub, then four flat legs. */
  const armTop = DEV_Y - DEV_H / 2 - BEZ_CHIN + 0.1;
  const armLen = armTop - hubY - 0.4;
  [-1, 1].forEach(function (sgn) {
    out.push({ shape: "box", size: [0.5, armLen, 0.7],
      pos: [sgn * 1.15, hubY + 0.4 + armLen / 2, DEV_Z - 0.25],
      rot: [0, 0, sgn * -0.36], r: 0.08, shade: 0.62 });
  });
  /* the column between the arms */
  out.push({ shape: "rbox", size: [0.95, armLen * 0.8, 0.85],
    pos: [0, hubY + 0.4 + armLen * 0.42, DEV_Z - 0.25], r: 0.1, shade: 0.5 });
  /* the hub */
  out.push({ shape: "cyl", size: [3.0, 0.5], pos: [0, hubY + 0.25, DEV_Z + 0.1], seg: 30, shade: 0.66 });
  out.push({ shape: "cyl", size: [1.7, 0.72], pos: [0, hubY + 0.36, DEV_Z + 0.1], seg: 26, shade: 0.55 });
  /* four flat legs radiating out from under it */
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    out.push({ shape: "box", size: [4.4, 0.26, 0.62],
      pos: [Math.cos(a) * 1.9, hubY + 0.13, DEV_Z + 0.1 + Math.sin(a) * 1.9],
      rot: [0, -a, 0], r: 0.06, shade: 0.44 });
  }
  /* the cable, coiled on the desk */
  out.push({ shape: "torus", size: [4.0, 0.22], pos: [0.3, hubY + 0.11, DEV_Z + 1.5],
    rot: [P2, 0, 0], seg: 34, seg2: 8, shade: 0.3 });
  out.push({ shape: "torus", size: [3.0, 0.22], pos: [0.5, hubY + 0.11, DEV_Z + 1.7],
    rot: [P2, 0, 0], seg: 34, seg2: 8, shade: 0.3 });
  return out;
}

function devPicture() {
  return [{ shape: "rbox", size: [DEV_W, DEV_H, 0.18], pos: [0, DEV_Y, DEV_FACE], r: 0.05, shade: 1.0 }];
}

/* -------------------------------------------------------------------
   THE ARTEFACTS.

   One entry per symptom. Each returns primitives drawn on the picture
   plane, and each is ONE part with one colour — so an artefact that
   needs two brightnesses uses `shade`, which multiplies within the part,
   rather than a second part it would have to be a different colour to.
   ------------------------------------------------------------------- */
const DEV_ART_BUILD = {
  /* A toolbar and a sidebar burnt in where they always sat. */
  burn: function () {
    return [
      { shape: "box", size: [DEV_W - 1.2, 0.5, 0.09], pos: [0, DEV_Y + DEV_H / 2 - 0.85, DEV_ART], r: 0.02, shade: 1.0 },
      { shape: "box", size: [0.5, DEV_H - 1.9, 0.09], pos: [-DEV_W / 2 + 0.85, DEV_Y - 0.45, DEV_ART], r: 0.02, shade: 1.0 }
    ];
  },
  /* The message the monitor puts up when it is listening to a socket
     with nothing plugged into it. A plate, floating, exactly as the OSD
     does — and the picture behind it is dark. */
  nosignal: function () {
    return [
      { shape: "rbox", size: [4.6, 1.5, 0.1], pos: [0, DEV_Y, DEV_ART], r: 0.16, shade: 1.0 },
      { shape: "box", size: [3.2, 0.26, 0.06], pos: [0, DEV_Y + 0.26, DEV_ART + 0.08], r: 0.02, shade: 0.28 },
      { shape: "box", size: [2.1, 0.22, 0.06], pos: [-0.55, DEV_Y - 0.22, DEV_ART + 0.08], r: 0.02, shade: 0.28 }
    ];
  },
  /* A greyscale step wedge — the test pattern a picture is judged on.
     `collapsed` is what a contrast control pushed to its limit does to
     it: the middle steps disappear into black and white, and the two
     ends are all that is left. That IS the customer's complaint drawn. */
  wedge: function (collapsed) {
    /* The steps BUTT UP against each other. Spaced apart they read as a
       row of bars, which is not a thing anybody recognises; touching,
       they read as one ramp from black to white, which is what a
       greyscale wedge is and what makes a collapsed one obvious. */
    const n = 8, w = (DEV_W - 1.2) / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const shade = collapsed ? (t < 0.5 ? 0.08 : 1.6) : (0.10 + t * 1.5);
      out.push({ shape: "box", size: [w, DEV_H - 2.6, 0.08],
        pos: [-DEV_W / 2 + 0.6 + w * (i + 0.5), DEV_Y + 0.35, DEV_ART], r: 0.0, shade: shade });
    }
    /* A reference strip under it that is ALWAYS a correct ramp, so there
       is something to compare against. Without it a student has to know
       what a good wedge looks like before the bad one means anything. */
    for (let i = 0; i < n; i++) {
      out.push({ shape: "box", size: [w, 0.55, 0.08],
        pos: [-DEV_W / 2 + 0.6 + w * (i + 0.5), DEV_Y - DEV_H / 2 + 0.75, DEV_ART], r: 0.0,
        shade: 0.10 + (i / (n - 1)) * 1.5 });
    }
    return out;
  },
  /* Fingerprints and dust on the glass in front of the picture. Soft
     shapes at low contrast, because that is what they are — and they sit
     further forward than everything else, which is the point: they are
     not in the picture, they are on top of it. */
  smear: function () {
    return [
      { shape: "cyl", size: [1.5, 0.06], pos: [-1.9, DEV_Y + 0.7, DEV_ART + 0.16], rot: [P2, 0, 0], seg: 22, shade: 1.0 },
      { shape: "cyl", size: [1.1, 0.06], pos: [1.4, DEV_Y - 0.5, DEV_ART + 0.16], rot: [P2, 0, 0], seg: 22, shade: 0.86 },
      { shape: "cyl", size: [0.8, 0.06], pos: [2.6, DEV_Y + 1.2, DEV_ART + 0.16], rot: [P2, 0, 0], seg: 20, shade: 0.94 },
      { shape: "cyl", size: [0.55, 0.06], pos: [-3.2, DEV_Y - 1.3, DEV_ART + 0.16], rot: [P2, 0, 0], seg: 18, shade: 0.9 }
    ];
  },
  /* One column, FULL height, always in the same place.

     It was drawn 0.3 short at each end, which contradicted the note beside
     it — "one column, the full height" — and a stuck column really does run
     edge to edge, including through the parts of the picture that are
     black. That is the tell: a dark band from a cable or a driver stops
     where the image stops, and this does not.

     It was also the faintest symptom in the set, and symptom-visible only
     ever cleared its floor on the aliasing noise around it. Smoothing the
     renderer's curves took that noise away and the check failed — correctly.
     A bright hairline on a dark panel is exactly what a student with damaged
     sight cannot find, so this is a legibility fix as much as an accuracy
     one: full height, and wide enough to be seen rather than hunted. */
  stuckcol: function () {
    return [{ shape: "box", size: [0.26, DEV_H, 0.09], pos: [1.7, DEV_Y, DEV_ART], r: 0.01, shade: 1.0 }];
  },
  /* The picture torn across: the top half displaced sideways from the
     bottom half, which is exactly what a frame delivered mid-refresh
     looks like. */
  tear: function () {
    return [
      { shape: "box", size: [DEV_W - 2.4, DEV_H / 2 - 0.5, 0.08], pos: [-0.55, DEV_Y + DEV_H / 4, DEV_ART], r: 0.02, shade: 1.0 },
      { shape: "box", size: [DEV_W - 2.4, DEV_H / 2 - 0.5, 0.08], pos: [0.75, DEV_Y - DEV_H / 4, DEV_ART], r: 0.02, shade: 1.0 }
    ];
  },
  /* Horizontal bands of uneven brightness — a backlight that is not
     driving evenly. */
  banding: function () {
    const out = [], n = 5, h = (DEV_H - 0.6) / n;
    for (let i = 0; i < n; i++) {
      out.push({ shape: "box", size: [DEV_W - 0.6, h - 0.1, 0.07],
        pos: [0, DEV_Y - DEV_H / 2 + 0.3 + h * (i + 0.5), DEV_ART], r: 0.01,
        shade: i % 2 === 0 ? 1.35 : 0.35 });
    }
    return out;
  },
  /* A test pattern of squares. On a panel being fed the wrong aspect
     they are not squares any more, and that is the whole diagnosis. */
  stretch: function (wrong) {
    const s = 1.5, w = wrong ? s * 1.75 : s;
    const out = [];
    for (let i = -1; i <= 1; i++) {
      out.push({ shape: "box", size: [w, s, 0.08], pos: [i * (w + 0.6), DEV_Y, DEV_ART], r: 0.02, shade: 1.0 });
    }
    return out;
  }
};

/* -------------------------------------------------------------------
   The projector, and the wall it throws at.
   ------------------------------------------------------------------- */
/* The projector, built from the owner's photograph of an Epson on an AV
   trolley. Everything below is a correction to what I had invented:

     - THE BODY IS WIDE AND FLAT, better than three to one. I had a cube.
     - THE LENS IS OFFSET, about a third in from one end, and it sits in
       a LARGE round recess much wider than the barrel itself. A small
       disc centred on the front of a box is not a projector lens; the
       big dark recess around it is most of what makes it read.
     - THE TROLLEY IS THE OTHER HALF OF THE OBJECT. Two shelves, four
       corner posts, four castors and a push handle. A flat slab under a
       box says nothing; a cart on wheels says "this gets pushed into a
       room and set down wherever there is space", which is exactly why
       the thing is never square to the screen.
   ------------------------------------------------------------------- */
const PRJ_BODY_Y = 2.35;       /* the body sits on the trolley's top shelf */
const PRJ_LENS_X = -1.45;      /* offset, not centred */
const PRJ_LENS_Y = 2.25;
/* WHERE THE TROLLEY STANDS, and it is the number that decides whether
   the room has any depth in it. The first build had the projector about
   ten units from a twelve-unit-wide image \u2014 a throw ratio under one,
   which is an ultra-short-throw unit sitting almost against the wall,
   and it made the scene read flat. A hall projector on a trolley is
   nearer 1.8 : 1, so it stands well back down the room and the beam has
   somewhere to go. Everything on the trolley is placed relative to
   this, so moving it moves the whole thing. */
const PRJ_THROW = PRJ_W * 1.8;
const PRJ_STAND_Z = PRJ_Z + PRJ_THROW;
const PRJ_LENS_Z = PRJ_STAND_Z - 2.35;  /* the front face of the lens recess */

function prjBody() {
  const bx = 0, bz = PRJ_STAND_Z;
  const W = 6.2, H = 1.75, D = 4.3;
  return [
    /* ---- the trolley ---- */
    /* top shelf */
    { shape: "rbox", size: [8.6, 0.3, 6.0], pos: [0, 1.4, bz], r: 0.08, shade: 0.62 },
    /* lower shelf */
    { shape: "rbox", size: [8.2, 0.28, 5.6], pos: [0, -1.9, bz], r: 0.08, shade: 0.58 },
    /* four corner posts */
    { shape: "box", size: [0.34, 3.4, 0.34], pos: [-3.9, -0.25, bz - 2.6], r: 0.05, shade: 0.5 },
    { shape: "box", size: [0.34, 3.4, 0.34], pos: [3.9, -0.25, bz - 2.6], r: 0.05, shade: 0.5 },
    { shape: "box", size: [0.34, 3.4, 0.34], pos: [-3.9, -0.25, bz + 2.6], r: 0.05, shade: 0.5 },
    { shape: "box", size: [0.34, 3.4, 0.34], pos: [3.9, -0.25, bz + 2.6], r: 0.05, shade: 0.5 },
    /* the push handle at the near end */
    { shape: "cyl", size: [0.3, 1.9], pos: [-4.6, 1.55, bz], rot: [0, 0, P2], seg: 12, shade: 0.55 },
    { shape: "box", size: [0.9, 0.28, 0.3], pos: [-4.25, 1.55, bz - 0.95], r: 0.06, shade: 0.55 },
    { shape: "box", size: [0.9, 0.28, 0.3], pos: [-4.25, 1.55, bz + 0.95], r: 0.06, shade: 0.55 },
    /* ---- four castors: a chrome fork and a black wheel each ---- */
    /* ---- the projector body ---- */
    { shape: "rbox", size: [W, H, D], pos: [bx, PRJ_BODY_Y, bz], r: 0.16, shade: 1.0 },
    /* the lighter strip along the top rear edge \u2014 these are two-tone */
    { shape: "rbox", size: [W - 0.5, 0.22, D * 0.55], pos: [bx, PRJ_BODY_Y + H / 2 - 0.02, bz + 0.9],
      r: 0.06, shade: 1.15 },
    /* the lens recess: a wide, deep, dark bore in the front face */
    { shape: "cyl", size: [2.5, 0.9], pos: [PRJ_LENS_X, PRJ_LENS_Y, bz - D / 2 + 0.35],
      rot: [P2, 0, 0], seg: 30, shade: 0.30 },
    /* the barrel standing in it */
    { shape: "cyl", size: [1.5, 1.1], pos: [PRJ_LENS_X, PRJ_LENS_Y, bz - D / 2 + 0.15],
      rot: [P2, 0, 0], seg: 28, shade: 0.90 },
    /* the focus ring around the barrel */
    { shape: "torus", size: [1.78, 0.24], pos: [PRJ_LENS_X, PRJ_LENS_Y, bz - D / 2 + 0.05],
      rot: [P2, 0, 0], seg: 28, seg2: 8, shade: 0.55 },
    /* the glass, dark, set back inside the barrel */
    { shape: "cyl", size: [1.05, 0.2], pos: [PRJ_LENS_X, PRJ_LENS_Y, bz - D / 2 + 0.32],
      rot: [P2, 0, 0], seg: 26, shade: 0.16 },
    /* the intake grille on the near end */
    { shape: "box", size: [0.14, 1.0, 0.16], pos: [-W / 2 + 0.05, PRJ_BODY_Y, bz - 1.4], r: 0.02, shade: 0.36,
      repeat: { count: 7, step: [0, 0, 0.3] } },
    /* the exhaust grille under the lens end of the front face */
    { shape: "box", size: [0.16, 0.7, 0.12], pos: [1.6, PRJ_BODY_Y - 0.3, bz - D / 2 + 0.06], r: 0.02, shade: 0.36,
      repeat: { count: 6, step: [0.3, 0, 0] } },
    /* the control panel and indicator lamps on the top, toward the rear */
    { shape: "box", size: [1.7, 0.06, 0.5], pos: [1.2, PRJ_BODY_Y + H / 2 + 0.02, bz + 0.2], r: 0.02, shade: 0.5 },
    { shape: "cyl", size: [0.14, 0.06], pos: [-0.2, PRJ_BODY_Y + H / 2 + 0.03, bz + 0.9], seg: 10, shade: 1.6,
      repeat: { count: 4, step: [0.3, 0, 0] } },
    /* the connector panel across the back, with the power inlet at one end */
    { shape: "box", size: [W - 1.2, 0.85, 0.14], pos: [bx + 0.2, PRJ_BODY_Y, bz + D / 2 - 0.03], r: 0.02, shade: 0.28 },
    { shape: "box", size: [0.85, 0.5, 0.2], pos: [2.1, PRJ_BODY_Y, bz + D / 2 + 0.02], r: 0.03, shade: 0.4 },
    /* two rear feet and one adjustable front foot */
    { shape: "cyl", size: [0.45, 0.35], pos: [-2.2, 1.72, bz + 1.5], seg: 12, shade: 0.42 },
    { shape: "cyl", size: [0.45, 0.35], pos: [2.2, 1.72, bz + 1.5], seg: 12, shade: 0.42 },
    { shape: "cyl", size: [0.36, 0.4], pos: [0, 1.7, bz - 1.7], seg: 12, shade: 0.42 }
  ].concat(prjCastors(bz));
}

/* Four castors. A chrome fork and a black wheel each, because a cart
   with wheels drawn as four grey stubs is a table. */
function prjCastors(bz) {
  const out = [];
  [[-3.9, bz - 2.6], [3.9, bz - 2.6], [-3.9, bz + 2.6], [3.9, bz + 2.6]].forEach(function (c) {
    out.push({ shape: "rbox", size: [0.7, 0.8, 0.5], pos: [c[0], -2.4, c[1]], r: 0.1, shade: 0.9 });
    out.push({ shape: "cyl", size: [1.15, 0.55], pos: [c[0], -3.05, c[1] + 0.15],
      rot: [0, 0, P2], seg: 20, shade: 0.22 });
    out.push({ shape: "cyl", size: [0.42, 0.62], pos: [c[0], -3.05, c[1] + 0.15],
      rot: [0, 0, P2], seg: 14, shade: 0.85 });
  });
  return out;
}

/* The screen, in THREE parts, because it is three colours and this
   bench's oldest rule is one colour per part. The first version had them
   in one, and the "matt white" field rendered mid-grey — the same colour
   as its own black border, differing only by a shade multiplier. A
   projector screen that is not white is not a projector screen. */
const SCR_BORDER = 0.55;
const SCR_FW = 16.0, SCR_FH = 12.0, SCR_FY = 6.3;

function prjScreenBorder() {
  return [
    { shape: "rbox", size: [SCR_FW + SCR_BORDER * 2, SCR_FH + SCR_BORDER * 2, 0.30],
      pos: [0, SCR_FY, PRJ_Z - 0.42], r: 0.03, shade: 1.0 },
    /* the weighted bar along the bottom edge, and the pull cord */
    { shape: "rbox", size: [SCR_FW + 0.6, 0.5, 0.4], pos: [0, SCR_FY - SCR_FH / 2 - 0.55, PRJ_Z - 0.42],
      r: 0.08, shade: 1.0 },
    { shape: "cyl", size: [0.09, 1.5], pos: [0, SCR_FY - SCR_FH / 2 - 1.5, PRJ_Z - 0.42], seg: 8, shade: 1.2 },
    { shape: "rbox", size: [0.34, 0.7, 0.34], pos: [0, SCR_FY - SCR_FH / 2 - 2.4, PRJ_Z - 0.42],
      r: 0.1, shade: 1.6 }
  ];
}
function prjScreenField() {
  return [{ shape: "rbox", size: [SCR_FW, SCR_FH, 0.26], pos: [0, SCR_FY, PRJ_Z - 0.28], r: 0.02, shade: 1.0 }];
}
function prjCasing() {
  return [
    { shape: "rbox", size: [SCR_FW + 1.6, 1.05, 1.0], pos: [0, SCR_FY + SCR_FH / 2 + 1.1, PRJ_Z - 0.55],
      r: 0.16, shade: 1.0 },
    { shape: "rbox", size: [0.55, 1.15, 1.1], pos: [-(SCR_FW / 2 + 0.85), SCR_FY + SCR_FH / 2 + 1.1, PRJ_Z - 0.55],
      r: 0.14, shade: 0.62 },
    { shape: "rbox", size: [0.55, 1.15, 1.1], pos: [SCR_FW / 2 + 0.85, SCR_FY + SCR_FH / 2 + 1.1, PRJ_Z - 0.55],
      r: 0.14, shade: 0.62 },
    /* the two wall brackets it hangs on */
    { shape: "box", size: [0.5, 0.85, 1.3], pos: [-7.2, SCR_FY + SCR_FH / 2 + 1.75, PRJ_Z - 0.9], r: 0.05, shade: 0.5 },
    { shape: "box", size: [0.5, 0.85, 1.3], pos: [7.2, SCR_FY + SCR_FH / 2 + 1.75, PRJ_Z - 0.9], r: 0.05, shade: 0.5 }
  ];
}

function prjRoom() {
  /* A back wall, a floor and a skirting board. NO SIDE WALLS: they were
     there for two renders and both times one of them stood between the
     camera and the screen, because a three-quarter view of a room is
     taken from OUTSIDE the room. A wall you are looking through is not
     scenery, it is an obstruction. */
  return [
    /* Wider than the floor. At this camera angle a wall the same width
       as the floor leaves a wedge of nothing showing past its edge. */
    { shape: "box", size: [50.0, 26.0, 0.5], pos: [0, 9.0, PRJ_Z - 1.3], r: 0.0, shade: 1.0 },
    /* the skirting, which says "room" more cheaply than a whole wall does */
    { shape: "box", size: [50.0, 0.75, 0.3], pos: [0, -3.2, PRJ_Z - 1.0], r: 0.02, shade: 0.55 },
  ];
}

/* The light leaving the lens, drawn as the four EDGES of the cone rather
   than as a solid one. A solid beam would be opaque in this renderer —
   there is no per-part transparency — and would hide the very image it
   is throwing. Four edges is also how every projector diagram ever
   drawn shows it, which is the point: it has to be recognisable. */
function prjBeam(keystone) {
  const lensZ = PRJ_LENS_Z, lensY = PRJ_LENS_Y, lensX = PRJ_LENS_X;
  const halfW = PRJ_W / 2, halfH = PRJ_H / 2;
  const topW = keystone ? halfW : halfW * 0.86;
  const botW = keystone ? halfW * 0.78 : halfW * 0.86;
  const corners = [
    [-topW, PRJ_Y + halfH], [topW, PRJ_Y + halfH],
    [-botW, PRJ_Y - halfH], [botW, PRJ_Y - halfH]
  ];
  /* Aiming a cylinder along an arbitrary ray, derived rather than
     guessed. The engine builds the rotation with THREE.Euler in XYZ
     order, so a vector is turned by Z first, then Y, then X. Starting
     from the cylinder's own axis (0,1,0) and leaving X at zero:

         RZ(z) . (0,1,0)  =  (-sin z,  cos z,  0)
         RY(y) . that     =  (-sin z cos y,  cos z,  sin z sin y)

     Matching that to a unit ray (dx, dy, dz) gives z = acos(dy) and
     y = atan2(dz, -dx). The first version of this used a yaw-then-tilt
     pair invented on the spot, and the four beam edges came out pointing
     nowhere near the corners they were supposed to reach. */
  return corners.map(function (c) {
    const dx = c[0] - lensX, dy = c[1] - lensY, dz = PRJ_ART - lensZ;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const z = Math.acos(dy / len);
    const y = Math.atan2(dz / len, -dx / len);
    return {
      shape: "cyl", size: [0.13, len], seg: 8,
      pos: [lensX + dx / 2, lensY + dy / 2, lensZ + dz / 2],
      rot: [0, y, z],
      shade: 1.0
    };
  });
}

/* The projected image. A trapezoid when the projector is not square to
   the wall, and a rectangle when it is.

   `cone` here is CylinderGeometry(topDiameter/2, bottomDiameter/2, ...),
   so with four radial segments it is a truncated square pyramid — one
   primitive whose front face is a real trapezoid. That matters: the
   accessibility edge overlay outlines EVERY primitive, so a trapezoid
   faked out of a stack of twelve widening bars would be drawn as twelve
   outlined bars rather than as one shape. Turned 45 degrees about its
   axis so a flat face squares up to the room. */
function prjImage(keystone) {
  if (!keystone) {
    return [{ shape: "rbox", size: [PRJ_W, PRJ_H, 0.16], pos: [0, PRJ_Y, PRJ_ART], r: 0.03, shade: 1.0 }];
  }
  /* Two corrections the first render made necessary, both arithmetic
     rather than taste:

       - Turning a four-sided prism 45 degrees puts a flat face square to
         the room, and that face is only 1/root-2 of the diameter across.
         So the diameters here are the wanted widths TIMES root two, or
         the trapezoid arrives a third smaller than the screen it is
         thrown at.
       - The prism is as deep as it is wide, so most of it has to sit
         INSIDE the wall or the room contains a large white wedge. Its
         half-depth after the turn is diameter x 0.354, and the centre is
         placed so the front face lands just proud of the screen. */
  const R2 = Math.SQRT2;
  const topD = PRJ_W * R2, botD = PRJ_W * 0.78 * R2;
  const halfDepth = topD * 0.354;
  return [{ shape: "cone", size: [topD, PRJ_H, botD],
    pos: [0, PRJ_Y, PRJ_ART + 0.35 - halfDepth],
    rot: [0, Math.PI / 4, 0], seg: 4, shade: 1.0 }];
}
/* A lamp at the end of its life does not go dark evenly: the middle of
   the image stays usable and the edges fall away, so what the room sees
   is a bright patch in a dim frame. Drawn as the patch, because the dim
   frame is the image part underneath it. */
function prjHotspot() {
  return [{ shape: "rbox", size: [PRJ_W * 0.5, PRJ_H * 0.5, 0.1], pos: [0, PRJ_Y, PRJ_ART + 0.14], r: 0.4, shade: 1.0 }];
}

/* Every artefact must be drawn PROUD of the picture it sits on, or it is
   inside it and invisible. The picture's front face is the number to
   clear, and this asserts it rather than trusting the arithmetic —
   exactly the mistake that hid the workstation bench's monitor panel
   behind its own bezel, twice, with nothing to say so. */
/* The monitor has to STAND on the bench mat. Its stand hangs 3.4 units
   below the bottom of the bezel, and the first version of it was buried
   entirely beneath the mat's surface — the render showed a screen lying
   flat on the bench with no stand at all, and nothing in the source
   said so. This is the arithmetic, asserted. */
(function checkMonitorStands() {
  const BEZ_CHIN = 0.95;
  const hubY = DEV_Y - DEV_H / 2 - BEZ_CHIN - 2.5;
  const legBottom = hubY;                 /* the flat legs sit at the hub's base */
  const matTop = -0.3 + 0.25;             /* the bench board, 0.5 thick, centred at -0.3 */
  if (legBottom < matTop - 0.05) {
    throw new Error("bench-display: the monitor's stand is below the bench mat by " +
      (matTop - legBottom).toFixed(2) + " — it would appear to have no stand at all");
  }
  if (legBottom > matTop + 1.5) {
    throw new Error("bench-display: the monitor is floating " +
      (legBottom - matTop).toFixed(2) + " above the bench mat");
  }
})();

(function checkArtefactDepth() {
  const pictureFront = DEV_FACE + 0.09;      /* picture is 0.18 deep */
  if (DEV_ART <= pictureFront) {
    throw new Error("bench-display: device artefacts are drawn inside the picture, not on it");
  }
  const wallFront = PRJ_Z - 0.3 + 0.2;       /* the screen is 0.4 deep */
  if (PRJ_ART <= wallFront) {
    throw new Error("bench-display: the projected image is drawn inside the wall");
  }
})();

/* `kind` is "monitor" or "projector"; `art` names an entry in
   DEV_ART_BUILD or, for a projector, "keystone" / "hotspot" / null.
   `dark` says the picture is not lit. */
export function deviceBench(view) {
  view = view || {};
  const projector = view.kind === "projector";
  const art = view.art || null;
  const dark = !!view.dark;
  const parts = [];

  if (projector) {
    parts.push({ key: "room", label: "The room", build: prjRoom(),
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#8d949b",
      spec: "A meeting room", note: "Scenery. It is here so the rest of it looks like somewhere." });
    parts.push({ key: "casing", label: "The roller casing", build: prjCasing(),
      finish: "metal", scale: 1, pos: [0, 0, 0], color: "#cfc9b8",
      spec: "Wall mounted, above the screen",
      note: "The screen rolls up into this. It is fixed to the wall, which means the screen below " +
        "it hangs flat and square whatever the projector is doing." });
    parts.push({ key: "wall", label: "The screen border", build: prjScreenBorder(),
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#1b1f24",
      spec: "A black border and a weighted bar",
      note: "The border is what a projected image is framed against, and it is the reference for " +
        "whether the picture is landing square. The screen is flat and it is square to the room \u2014 " +
        "anything the picture does that the border does not is the projector's doing." });
    parts.push({ key: "field", label: "The screen itself", build: prjScreenField(),
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#d6d6cf",
      spec: "Matt white, 4:3",
      note: "Matt white so it throws light back evenly rather than reflecting a hot spot at " +
        "whoever is sitting square to it." });
    parts.push({ key: "projector", label: "The projector", build: prjBody(),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#3c434b",
      spec: view.prjSpec || "Ceiling or table mounted",
      note: view.prjNote || "Where it sits relative to the middle of the screen decides the shape " +
        "of what it throws. Nothing inside it can correct being in the wrong place." });
    parts.push({ key: "image", label: art === "keystone" ? "The projected image — not a rectangle"
                                                          : "The projected image",
      build: prjImage(art === "keystone"), finish: "plastic", scale: 1, pos: [0, 0, 0],
      /* The image has to be brighter than the SCREEN, not just bright.
         The first pass had a near-white image on a near-white screen and
         the trapezoid all but disappeared \u2014 which on the one scenario
         whose entire question is "what shape is that" is fatal. */
      color: dark ? "#7d848b" : "#ffffff", glow: dark ? 0 : 0.75,
      spec: art === "keystone" ? "Wider at one edge than the other" : (dark ? "Dim" : "Bright and square"),
      note: art === "keystone"
        ? "Wider at the top than at the bottom. A rectangle thrown from below the middle of a screen " +
          "arrives as a trapezoid, and no amount of focusing changes that."
        : "What the room actually sees." });
    parts.push({ key: "beam", label: "The light leaving the lens",
      build: prjBeam(art === "keystone"), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: "#f2f6fa", glow: 0.45,
      spec: art === "keystone" ? "Thrown upwards at the screen" : "Thrown square at the screen",
      note: art === "keystone"
        ? "Follow the four edges. The pair going to the top of the screen travel further than the " +
          "pair going to the bottom, and light that travels further covers more. That is the whole " +
          "of keystoning, and it is geometry rather than a fault."
        : "Square to the screen, so the four edges travel the same distance and the image arrives " +
          "as the rectangle it left as." });
    if (art === "hotspot") {
      parts.push({ key: "hotspot", label: "The bright middle", build: prjHotspot(),
        finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#f4f7fa", glow: 0.5,
        spec: "Usable in the centre, falling away to the edges",
        note: "A lamp near the end of its hours loses the edges first and shifts colour with them. " +
          "A dirty lens dims the whole image evenly instead — which is how you tell them apart." });
    }
  } else {
    parts.push({ key: "chassis", label: "The monitor", build: devChassis(),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39414a",
      spec: "Powered — the lamp under the bezel is lit",
      note: "The case and its power lamp. Neither changes with the picture, which is why neither " +
        "tells you anything about one." });
    parts.push({ key: "picture", label: dark ? "The picture — nothing on it" : "The picture",
      build: devPicture(), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: dark ? "#171b1f" : "#b9c4cd", glow: dark ? 0 : 0.18,
      spec: dark ? "Dark" : "Lit",
      note: dark ? "No image. The monitor is powered and is being given nothing it can draw."
                 : "The panel is lit and drawing." });
    if (art && DEV_ART_BUILD[art]) {
      const LABEL = {
        burn: "The ghost image", nosignal: "The monitor's own message",
        wedge: "The greyscale test pattern", smear: "What is on the glass",
        stuckcol: "The stuck column", tear: "The tear across the picture",
        banding: "Uneven bands across the picture", stretch: "The test pattern, stretched"
      };
      const NOTE = {
        burn: "A toolbar and a sidebar, still faintly there with nothing drawing them. That is the " +
          "panel itself remembering what sat in one place for months, and no setting undoes it.",
        nosignal: "The monitor is working well enough to tell you it has nothing to draw. That " +
          "sentence is about the INPUT it is listening to, not about the monitor.",
        wedge: "Six steps from black to white. Count how many you can actually tell apart — the " +
          "ones that have disappeared are the ones the picture controls have crushed.",
        smear: "These sit in front of the picture rather than in it, and they move when you look " +
          "from a different angle. Nothing inside the monitor makes marks that do that.",
        stuckcol: "One column, the full height, in the same place every time — and it is there in " +
          "the monitor's own menu, with no computer connected.",
        tear: "The top of the frame and the bottom of the frame are from different moments. That is " +
          "the panel being handed a new frame part way through drawing the old one.",
        banding: "Bright and dim in horizontal bands, and the pattern moves as the brightness " +
          "control moves. The picture being made is fine; what is lighting it is not.",
        stretch: "The pattern is squares. What is on the screen is not squares, and everything in " +
          "the picture is stretched the same way."
      };
      parts.push({ key: "artefact", label: LABEL[art] || "What is wrong with the picture",
        build: art === "wedge" ? DEV_ART_BUILD.wedge(!!view.collapsed)
             : art === "stretch" ? DEV_ART_BUILD.stretch(true)
             : DEV_ART_BUILD[art](),
        finish: "plastic", scale: 1, pos: [0, 0, 0],
        color: art === "smear" ? "#cdd6dd" : art === "burn" ? "#8e9aa4" : "#f0f4f8",
        glow: art === "smear" || art === "burn" ? 0 : 0.3,
        spec: LABEL[art] || "", note: NOTE[art] || "" });
    }
  }

  return {
    kind: "bench",
    title: projector ? "The room, and what is on the wall" : "The device, on the desk",
    caption: "What the user is looking at. Every part of it is a control below, and each one says " +
      "in words what it is doing.",
    /* For a room, the board IS the floor: a dark anti-static mat under a
       meeting room is a slab that dominates the frame and belongs to a
       different scene entirely. For a desk it stays a bench mat. */
    board: projector
      ? { size: [36, 0.5, PRJ_THROW + 22], pos: [0, -3.9, PRJ_Z + (PRJ_THROW + 22) / 2 - 1], color: "#6d747e",
          build: [{ shape: "rbox", size: [36, 0.5, PRJ_THROW + 22], pos: [0, 0, 0], r: 0.0, shade: 1.0 }], scale: 1 }
      : /* A wooden desk, at the owner's request, rather than the dark
           anti-static mat every other bench in this build stands on. The
           teardown benches are workshop surfaces because that is where a
           panel gets taken apart; THIS one is the customer's own desk,
           and a monitor on a desk is the picture a student recognises. */
        { size: [26, 0.5, 18], pos: [0, -0.3, 1.5], color: "#a4763f", finish: "matte",
          skin: "woodgrain",
          build: [{ shape: "rbox", size: [26, 0.5, 18], pos: [0, 0, 1.5], r: 0.14, shade: 1.0 }], scale: 1 },
    decor: [],
    parts: parts,
    camera: projector
      ? /* The room is now roughly 30 wide, 22 tall and 26 deep, and the
           trolley's castors reach y = -3. A camera framed for the old
           bare screen cut the casing off the top and filled half the
           frame with the projector. Pulled back to hold floor to casing,
           and swung round so the view is three-quarter rather than
           straight up the beam \u2014 dead astern you see the back of a box
           and nothing that says projector. */
        { dist: 46.0, yaw: 0.46, pitch: 0.19, target: [0, 4.4, PRJ_THROW * 0.42], min: 14, max: 90 }
      /* fitWidth swept at four canvas widths — see displayBench above. The
         projector view is already wide enough at 46 and needs none. */
      : { dist: 23.0, fitWidth: 22, yaw: 0.24, pitch: 0.26, target: [0, 4.4, 0.4], min: 8, max: 50 }
  };
}
