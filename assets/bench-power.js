/* =====================================================================
   A+ Core1 Under the Hood Labs — the power bench

   The supply on the left, its loom fanning out to the right, and every
   connector it has to land on drawn where it actually lives. Plus a load
   gauge, because the whole lab turns on one number.

   FLAT ON PURPOSE, AGAIN

   Third bench, same lesson: the printer taught it and the build bench
   paid for it. Cables are the worst case for occlusion — a real loom is
   a knot, and a knot photographs as a knot. So the leads fan out in one
   plane with nothing crossing behind anything, and the camera looks
   almost straight at it.

   THE GAUGE IS THE LAB

   An undersized supply is not a thing you can see by looking at a PSU.
   It is arithmetic, and the objectives say calculation under pressure is
   one of the four things students lose marks on. So the draw and the
   supply's capacity are drawn as one bar with a headroom mark on it: the
   fill is what the machine wants, the bar is what the supply gives, and
   when the fill runs past the mark that is the fault, visible before it
   is calculated.

   Same two rules as every bench here: the canvas is scenery and every
   connector is a real focusable button; and one colour per part, so the
   leads stay black and the pips carry the verdict.
   ===================================================================== */

const P2 = Math.PI / 2;

const DEPTH = 2.6;

/* Where each socket sits on the imagined board to the right of the PSU.
   Laid out so no lead has to cross another one. */
export const SITES = {
  mb:    { x:  3.6, y:  6.4, label: "Motherboard main" },
  cpu:   { x:  2.0, y:  9.6, label: "CPU power" },
  gpu:   { x:  7.4, y:  3.2, label: "Graphics card" },
  ssd:   { x:  8.2, y:  6.9, label: "SSD" },
  fan:   { x:  7.9, y:  9.4, label: "Fan hub" },
  panel: { x:  3.2, y:  1.4, label: "Front panel block" }
};

/* The supply's own corner. */
const PSU = { x: -6.4, y: 5.6, w: 5.6, h: 4.4 };

const LOOK = {
  open:    { color: "#39404a", glow: 0.00, says: "Nothing connected" },
  ok:      { color: "#2fd45e", glow: 0.85, says: "Connected" },
  wrong:   { color: "#ff3b30", glow: 1.60, says: "Wrong connector for this socket" },
  missing: { color: "#ffa524", glow: 1.45, says: "Needed, and still open" },
  na:      { color: "#39404a", glow: 0.00, says: "Not needed by this machine" }
};
export function socketWords(v) { return (LOOK[v] || LOOK.open).says; }

/* Rails, and what a meter reads on them. A rail is in spec at +/- 5%. */
export const RAILS = [
  { key: "12v",  label: "+12 V", nominal: 12.0,  tol: 0.60 },
  { key: "5v",   label: "+5 V",  nominal: 5.0,   tol: 0.25 },
  { key: "3v3",  label: "+3.3 V", nominal: 3.3,  tol: 0.17 }
];

export function railInSpec(key, volts) {
  const r = RAILS.filter(function (x) { return x.key === key; })[0];
  if (!r) return null;
  return Math.abs(volts - r.nominal) <= r.tol;
}

/* ---------- the supply ---------- */
function psuBuild() {
  const out = [
    { shape: "rbox", size: [PSU.w, PSU.h, DEPTH + 0.9], pos: [PSU.x, PSU.y, 0], r: 0.12, shade: 1.0 },
    /* the intake fan, on the face you can see */
    { shape: "tube", size: [3.0, 0.5], pos: [PSU.x, PSU.y, DEPTH / 2 + 0.5], rot: [0, 0, 0],
      seg: 22, shade: 0.55 },
    { shape: "box", size: [1.15, 0.09, 0.34], pos: [PSU.x, PSU.y, DEPTH / 2 + 0.5],
      ring: { count: 9, radius: 0.9, axis: "z" }, shade: 0.82 },
    /* the IEC inlet and switch on the back edge */
    { shape: "box", size: [0.9, 0.85, 0.5], pos: [PSU.x - PSU.w / 2 + 0.1, PSU.y - 1.4, 0],
      r: 0.04, shade: 0.42 },
    { shape: "box", size: [0.5, 0.3, 0.34], pos: [PSU.x - PSU.w / 2 + 0.1, PSU.y - 0.4, 0],
      r: 0.03, shade: 0.66 },
    /* the modular sockets down its right-hand edge, where the loom leaves */
    { shape: "box", size: [0.3, 0.5, 0.9], pos: [PSU.x + PSU.w / 2 - 0.05, PSU.y + 1.4, 0],
      r: 0.03, shade: 0.36, repeat: { count: 5, step: [0, -0.7, 0] } }
  ];
  return out;
}

/* ---------- one lead ----------
   A cable from the supply's edge to a socket, drawn as two straight runs
   with a corner, because a bezier here reads as spaghetti and the point
   is which socket it lands on. */
function lead(site, thick) {
  const x0 = PSU.x + PSU.w / 2, y0 = PSU.y;
  const midX = x0 + (site.x - x0) * 0.42;
  const t = thick || 0.30;
  return [
    { shape: "cyl", size: [t, Math.abs(midX - x0)], pos: [(x0 + midX) / 2, y0, 0],
      rot: [0, 0, P2], seg: 8, shade: 1.0 },
    { shape: "cyl", size: [t, Math.abs(site.y - y0)], pos: [midX, (y0 + site.y) / 2, 0],
      seg: 8, shade: 1.0 },
    { shape: "cyl", size: [t, Math.abs(site.x - midX)], pos: [(midX + site.x) / 2, site.y, 0],
      rot: [0, 0, P2], seg: 8, shade: 1.0 },
    /* the plug on the end */
    { shape: "rbox", size: [0.95, 0.55, 0.6], pos: [site.x, site.y, 0], r: 0.06, shade: 1.25 }
  ];
}

/* The socket body a lead lands in — always drawn, connected or not, so
   the row does not jump about between states. */
function socketBody(site) {
  return [
    { shape: "rbox", size: [1.15, 0.75, 0.7], pos: [site.x, site.y, -0.35], r: 0.06, shade: 0.55 },
    { shape: "box", size: [0.9, 0.5, 0.3], pos: [site.x, site.y, -0.1], r: 0.02, shade: 0.28 }
  ];
}

/* ---------- the load gauge ----------
   Drawn as a bar the width of the supply's capacity, filled to the
   machine's draw, with a mark where sensible headroom ends. */
/* THE TROUGH AND THE FILL ARE SEPARATE PARTS.

   One colour per part, for the third time in this build. Drawn as a
   single part the whole gauge took the verdict colour, so an over-budget
   machine rendered as a solid red bar with no readable fill line — the
   one thing the gauge exists to show. The trough is dark and constant;
   the fill carries the colour and the length. */
const G = { W: 13.0, H: 0.9, X: 0.6, Y: -1.9 };

function gaugeTrough(headroomW, suppliedW) {
  const hfrac = Math.max(0, Math.min(1, headroomW / Math.max(1, suppliedW)));
  return [
    { shape: "rbox", size: [G.W, G.H, 0.5], pos: [G.X, G.Y, 0], r: 0.12, shade: 1.0 },
    /* the headroom mark, cut into the trough so it survives the fill
       covering it */
    { shape: "box", size: [0.18, G.H + 0.7, 0.34], pos: [G.X - G.W / 2 + G.W * hfrac, G.Y, -0.2],
      r: 0.02, shade: 2.2 }
  ];
}

function gaugeFill(drawW, suppliedW) {
  const frac = Math.max(0, Math.min(1.3, drawW / Math.max(1, suppliedW)));
  const w = G.W * Math.min(1, frac);
  const out = [
    { shape: "rbox", size: [Math.max(0.2, w), G.H - 0.24, 0.66],
      pos: [G.X - G.W / 2 + w / 2, G.Y, 0.12], r: 0.08, shade: 1.0 }
  ];
  /* Past the end of the supply, the fill spills out of the trough. */
  if (frac > 1) {
    out.push({ shape: "rbox", size: [G.W * (frac - 1), G.H - 0.42, 0.66],
      pos: [G.X + G.W / 2 + (G.W * (frac - 1)) / 2, G.Y, 0.12], r: 0.06, shade: 1.5 });
  }
  return out;
}

/* ---------- the meter ----------
   Two probes on a rail, and a body. What it READS is text beside the
   canvas; the model only shows where the probes are. */
function meter(railKey) {
  /* You back-probe a rail at the 24-pin, not in mid-air. The first cut put
     the tips at fixed coordinates with nothing there, so the meter pointed
     at empty space — a picture of a measurement nobody is taking. Each rail
     gets its own pin position on the motherboard connector. */
  const mb = SITES.mb;
  const at = { "12v": [mb.x - 0.3, mb.y + 0.15],
               "5v":  [mb.x + 0.0, mb.y + 0.15],
               "3v3": [mb.x + 0.3, mb.y + 0.15] }[railKey] || [mb.x, mb.y + 0.15];
  const bodyX = 13.2, bodyY = 2.2;
  const out = [
    { shape: "rbox", size: [2.4, 3.2, 1.0], pos: [bodyX, bodyY, 0], r: 0.14, shade: 1.0 },
    { shape: "box", size: [1.8, 1.0, 0.2], pos: [bodyX, bodyY + 0.9, 0.55], r: 0.03, shade: 1.9 },
    { shape: "cyl", size: [1.0, 0.24], pos: [bodyX, bodyY - 0.7, 0.55], rot: [0, 0, 0], seg: 18, shade: 0.5 }
  ];
  /* THE LEADS HAVE TO REACH THE PROBES.

     The first cut drew both at fixed angles from the body and put the tips
     wherever the rail was, so the tips floated in mid-air with two sticks
     pointing off somewhere else entirely. A meter whose leads do not
     arrive is a picture of a broken meter. Both are now drawn from the
     body TO the tip, so they follow the rail wherever it is. */
  [[at[0], at[1]], [at[0] + 0.45, at[1] - 0.5]].forEach(function (tip, i) {
    const x0 = bodyX - 0.6 + i * 1.2, y0 = bodyY + 1.7;
    const dx = tip[0] - x0, dy = tip[1] - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    out.push({ shape: "cyl", size: [0.17, len], pos: [(x0 + tip[0]) / 2, (y0 + tip[1]) / 2, 0.25],
      rot: [0, 0, Math.atan2(dy, dx) - P2], seg: 7, shade: 0.6 });
    out.push({ shape: "cone", size: [0.36, 0.9, 0.02], pos: [tip[0], tip[1] - 0.35, 0.3],
      rot: [Math.PI, 0, 0], seg: 10, shade: 1.5 });
  });
  return out;
}

/* Pips, same shape as every other bench so a student learns one thing. */
function pip(at) {
  return [
    { shape: "cyl", size: [0.56, 0.14], pos: [at[0], at[1] + 0.95, 0.5], rot: [P2, 0, 0],
      seg: 16, shade: 1.0 },
    { shape: "sphere", size: [0.48], pos: [at[0], at[1] + 0.95, 0.56], seg: 14, shade: 1.0 }
  ];
}
function pipWell(at) {
  return [{ shape: "cyl", size: [0.86, 0.09], pos: [at[0], at[1] + 0.95, 0.44],
    rot: [P2, 0, 0], seg: 16, shade: 0.30 }];
}

/* ---------------------------------------------------------------------
   powerBench(view)

     view.sockets   { mb: "ok"|"open"|"wrong"|"missing"|"na", ... }
     view.drawW     what the machine wants
     view.suppliedW what the supply gives
     view.headroomW where sensible headroom ends
     view.probe     which rail the meter is on, or null
   --------------------------------------------------------------------- */
export function powerBench(view) {
  view = view || {};
  const S = view.sockets || {};
  /* Over means the SUPPLY is below what the build wants, not that the
     draw exceeds the recommendation — a recommendation is derived from the
     draw and can never be exceeded by it. */
  const over = (view.suppliedW || 0) < (view.headroomW || 0);

  const parts = [
    { key: "psu", label: "The power supply", build: psuBuild(), finish: "metal", scale: 1,
      pos: [0, 0, 0], color: "#8d979e",
      spec: (view.suppliedW || 0) + " W",
      note: "The number on the label is what it can deliver, not what the machine draws. Those " +
        "are different questions and only one of them is printed on anything." }
  ];

  /* Every socket, connected or not. */
  Object.keys(SITES).forEach(function (k) {
    const site = SITES[k];
    const state = S[k] || "open";
    const L = LOOK[state] || LOOK.open;

    parts.push({ key: "socket-" + k, label: site.label, build: socketBody(site),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#79838a",
      spec: L.says, note: "" });

    if (state === "ok" || state === "wrong") {
      parts.push({ key: "lead-" + k, label: site.label + " lead",
        build: lead(site, k === "mb" ? 0.42 : 0.30), finish: "rubber", scale: 1,
        pos: [0, 0, 0], color: state === "wrong" ? "#7a2c28" : "#20262b",
        spec: state === "wrong" ? "Landed on the wrong socket" : "Run from the supply",
        note: "" });
    }

    parts.push({ key: "well-" + k, label: site.label + " indicator surround",
      build: pipWell([site.x, site.y]), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + k, label: site.label + " status",
      build: pip([site.x, site.y]), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: L.color, glow: L.glow, spec: L.says, note: L.says });
  });

  /* The gauge, in two parts. */
  parts.push({ key: "gauge-trough", label: "The supply's capacity",
    build: gaugeTrough(view.headroomW || 0, view.suppliedW || 1),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#2a323b",
    spec: (view.suppliedW || 0) + " W available",
    note: "The whole bar is what the supply can give. The bright mark is where sensible headroom " +
      "runs out \u2014 not where the supply stops, which is a different and more expensive line." });

  parts.push({ key: "gauge", label: "What the machine draws",
    build: gaugeFill(view.drawW || 0, view.suppliedW || 1),
    finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: over ? "#ff3b30" : "#2fd45e", glow: over ? 1.5 : 0.8,
    spec: (view.drawW || 0) + " W of " + (view.suppliedW || 0) + " W",
    note: over
      ? "The fill is past the headroom mark. This supply will hold at the desktop and drop the " +
        "machine under load, which is the fault that gets diagnosed as \u201crandom reboots\u201d."
      : "Inside the mark, with room for the machine to spike without the supply arguing." });

  if (view.probe) {
    parts.push({ key: "meter", label: "The meter", build: meter(view.probe),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#c8842a",
      spec: "Probing " + view.probe,
      note: "A rail is in spec within five per cent. Outside that, the number is the fault." });
  }

  return {
    kind: "bench",
    title: "The supply, its loom, and what the machine wants",
    caption: "Every socket is a control. The bar along the bottom is the supply's capacity with " +
      "the machine's draw filled into it.",
    board: {
      size: [26, 0.5, 15], pos: [3.0, -3.4, -1.2], color: "#333c46",
      build: [{ shape: "rbox", size: [26, 0.5, 15], pos: [3.0, 0, 0], r: 0.12, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth SWEPT against frustumOK at 319, 480, 697 and 889px — the
       canvas widths the running lab actually hands out, 319 being what
       fits inside a 390px phone. The suite renders at 1100 and had never
       asked. This bench lost three parts at 319px and one at 480px.

       The value is one sweep step above the measured minimum, because
       the sweep drives the default view and a bench is at its widest in
       some other state. It costs nothing on a wide canvas: fitDist takes
       the LARGER of dist and the fit, so a roomy canvas never notices. */
    camera: { dist: 27.0, fitWidth: 34, yaw: 0.14, pitch: 0.20,
      target: [3.0, 4.4, 0], min: 11, max: 56 }
  };
}

/* =====================================================================
   THE OUTLET BENCH — a wall, a surge strip, a UPS, and nine things that
   need power.

   `powerBench` above is the supply on a bench with its loom out. This is
   the ROOM, and it exists because the Core 1 Power Source Drag & Drop is
   not about a supply at all: it is about what plugs into what, and where
   nine named devices belong. A student sorting "cable modem" and "clock
   radio" into three buckets needs to see three sources that look like
   the three things they are, not three labelled rectangles.

   TWO RULES IT HAS TO OBEY, and the second one decides the whole layout:

     - EVERY DEVICE IS RECOGNISABLE BY SILHOUETTE. Nine identical blocks
       with words beside them is a list with a canvas over it. A tower, a
       panel on a stand, a wide printer, a flat scanner, two small boxes
       one of which has aerials, a disc on a stem, a shade on a stem, and
       a little clock — each is a shape a student already knows.
     - IT MUST NOT SHOW THE ANSWER. The chain question asks what each
       protector plugs INTO, so no cord is drawn between the sources.
       They sit there with their leads coiled, and the student says where
       they go. Devices move as they are assigned, because that is the
       student's own working state rather than the answer.
   ===================================================================== */

/* The three sources, left to right, and the shelf everything starts on. */
const OB = {
  wall:  { x: -9.0, label: "Wall outlet" },
  surge: { x: -0.5, label: "Surge protector" },
  ups:   { x:  8.5, label: "UPS" },
  shelfZ: 6.2,          /* where unassigned devices wait */
  zoneZ: -1.0           /* where assigned devices stand */
};

function obWall() {
  const x = OB.wall.x;
  return [
    /* the wall, and the skirting along the bottom of it */
    { shape: "box", size: [30.0, 12.0, 0.5], pos: [0, 5.6, -5.4], r: 0.0, shade: 1.0 },
    { shape: "box", size: [30.0, 0.8, 0.32], pos: [0, 0.0, -5.05], r: 0.02, shade: 0.62 },
    /* a double faceplate at socket height */
    { shape: "rbox", size: [3.4, 2.0, 0.22], pos: [x, 1.9, -5.06], r: 0.1, shade: 1.35 },
    /* two outlets in it, each with its three slots */
    { shape: "box", size: [1.25, 1.3, 0.1], pos: [x - 0.8, 1.9, -4.94], r: 0.06, shade: 0.5 },
    { shape: "box", size: [1.25, 1.3, 0.1], pos: [x + 0.8, 1.9, -4.94], r: 0.06, shade: 0.5 },
    { shape: "box", size: [0.16, 0.42, 0.1], pos: [x - 1.05, 2.15, -4.87], r: 0.0, shade: 0.2 },
    { shape: "box", size: [0.16, 0.42, 0.1], pos: [x - 0.55, 2.15, -4.87], r: 0.0, shade: 0.2 },
    { shape: "box", size: [0.16, 0.3, 0.1], pos: [x - 0.8, 1.62, -4.87], r: 0.0, shade: 0.2 },
    { shape: "box", size: [0.16, 0.42, 0.1], pos: [x + 0.55, 2.15, -4.87], r: 0.0, shade: 0.2 },
    { shape: "box", size: [0.16, 0.42, 0.1], pos: [x + 1.05, 2.15, -4.87], r: 0.0, shade: 0.2 },
    { shape: "box", size: [0.16, 0.3, 0.1], pos: [x + 0.8, 1.62, -4.87], r: 0.0, shade: 0.2 }
  ];
}

function obSurge() {
  const x = OB.surge.x;
  return [
    /* the strip: a long low body with six outlets down the top face */
    { shape: "rbox", size: [7.2, 0.9, 1.9], pos: [x, 0.45, -3.4], r: 0.14, shade: 1.0 },
    { shape: "box", size: [0.85, 0.1, 0.85], pos: [x - 2.6, 0.91, -3.4], r: 0.04, shade: 0.42,
      repeat: { count: 6, step: [1.04, 0, 0] } },
    /* the master switch, and the lamp that says the clamp is still alive */
    { shape: "rbox", size: [0.9, 0.5, 0.6], pos: [x + 3.1, 0.68, -3.4], r: 0.08, shade: 0.6 },
    { shape: "cyl", size: [0.3, 0.12], pos: [x + 3.1, 0.94, -3.4], seg: 14, shade: 1.6 },
    /* its own lead, coiled beside it and NOT plugged into anything —
       where it goes is the question */
    { shape: "torus", size: [2.1, 0.22], pos: [x - 3.4, 0.12, -1.5], rot: [P2, 0, 0], seg: 26, seg2: 8, shade: 0.4 },
    { shape: "torus", size: [1.4, 0.22], pos: [x - 3.3, 0.12, -1.4], rot: [P2, 0, 0], seg: 26, seg2: 8, shade: 0.4 }
  ];
}

function obUps() {
  const x = OB.ups.x;
  return [
    /* the body — a UPS is a heavy box because most of it is battery */
    { shape: "rbox", size: [4.6, 3.6, 3.0], pos: [x, 1.8, -3.2], r: 0.12, shade: 1.0 },
    /* the front bezel, its display window and the status lamp */
    { shape: "rbox", size: [4.0, 2.4, 0.24], pos: [x, 2.0, -1.62], r: 0.08, shade: 0.86 },
    { shape: "box", size: [1.7, 0.85, 0.1], pos: [x - 0.6, 2.35, -1.48], r: 0.04, shade: 0.32 },
    { shape: "cyl", size: [0.42, 0.14], pos: [x + 1.35, 2.35, -1.48], rot: [P2, 0, 0], seg: 16, shade: 1.7 },
    { shape: "rbox", size: [1.1, 0.5, 0.16], pos: [x - 0.6, 1.3, -1.5], r: 0.06, shade: 0.55 },
    /* TWO BANKS of outlets on the top, which is the thing that matters:
       a UPS has battery outlets and surge-only outlets and they are not
       the same sockets */
    { shape: "box", size: [0.8, 0.1, 0.8], pos: [x - 1.4, 3.61, -3.9], r: 0.04, shade: 0.42,
      repeat: { count: 3, step: [1.0, 0, 0] } },
    { shape: "box", size: [0.8, 0.1, 0.8], pos: [x - 1.4, 3.61, -2.7], r: 0.04, shade: 0.3,
      repeat: { count: 3, step: [1.0, 0, 0] } },
    /* a raised rib between the banks, so they are two groups by shape as
       well as by shade */
    { shape: "box", size: [3.6, 0.16, 0.14], pos: [x, 3.66, -3.3], r: 0.02, shade: 0.7 },
    /* its lead, also coiled and also not plugged in */
    { shape: "torus", size: [2.0, 0.24], pos: [x + 2.6, 0.12, -1.2], rot: [P2, 0, 0], seg: 26, seg2: 8, shade: 0.4 }
  ];
}

/* One value per device, spread far enough apart to be told from its
   neighbour at a glance. Neutrals for the boxes, and the three that are
   genuinely coloured objects in a room \u2014 a lamp shade, a clock face, a
   router's plastic \u2014 carry a tint. */
const OB_COLOUR = {
  pc:      "#3e454d",
  monitor: "#23282e",
  printer: "#9aa3ab",
  scanner: "#6d7680",
  modem:   "#2f3d52",
  router:  "#4a5f7a",
  fan:     "#b6bdc4",
  lamp:    "#c9b688",
  clock:   "#57484f"
};

/* The nine devices, each recognisable by its silhouette. Every one is
   drawn at a given spot so it can move when the student assigns it. */
const OB_SHAPES = {
  pc:      function (x, z) { return [
    { shape: "rbox", size: [1.3, 3.0, 2.6], pos: [x, 1.5, z], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.1, 0.5, 1.4], pos: [x - 0.66, 2.4, z], r: 0.02, shade: 0.5 },
    { shape: "cyl", size: [0.24, 0.1], pos: [x - 0.66, 1.0, z], rot: [0, 0, P2], seg: 12, shade: 1.6 }]; },
  monitor: function (x, z) { return [
    { shape: "rbox", size: [3.2, 2.0, 0.28], pos: [x, 2.1, z], r: 0.08, shade: 1.0 },
    { shape: "box", size: [2.86, 1.66, 0.1], pos: [x, 2.16, z + 0.16], r: 0.02, shade: 0.4 },
    { shape: "box", size: [0.4, 0.9, 0.3], pos: [x, 0.65, z], r: 0.04, shade: 0.7 },
    { shape: "rbox", size: [1.7, 0.2, 1.1], pos: [x, 0.16, z + 0.1], r: 0.05, shade: 0.6 }]; },
  printer: function (x, z) { return [
    { shape: "rbox", size: [3.4, 1.9, 2.8], pos: [x, 0.95, z], r: 0.12, shade: 1.0 },
    { shape: "box", size: [2.6, 0.12, 1.4], pos: [x, 1.92, z + 0.3], r: 0.03, shade: 0.72 },
    { shape: "box", size: [2.8, 0.5, 0.16], pos: [x, 0.6, z - 1.45], rot: [-0.4, 0, 0], r: 0.03, shade: 1.3 }]; },
  scanner: function (x, z) { return [
    { shape: "rbox", size: [3.0, 0.7, 2.2], pos: [x, 0.35, z], r: 0.1, shade: 1.0 },
    { shape: "rbox", size: [2.7, 0.16, 1.9], pos: [x, 0.76, z], r: 0.06, shade: 0.55 },
    { shape: "box", size: [0.5, 0.14, 0.2], pos: [x + 1.1, 0.86, z - 0.8], r: 0.02, shade: 1.4 }]; },
  modem:   function (x, z) { return [
    { shape: "rbox", size: [1.6, 1.0, 1.6], pos: [x, 0.5, z], r: 0.12, shade: 1.0 },
    { shape: "cyl", size: [0.2, 0.1], pos: [x - 0.4, 0.55, z + 0.82], rot: [P2, 0, 0], seg: 10, shade: 1.7,
      repeat: { count: 3, step: [0.4, 0, 0] } }]; },
  router:  function (x, z) { return [
    { shape: "rbox", size: [2.0, 0.7, 1.6], pos: [x, 0.35, z], r: 0.12, shade: 1.0 },
    { shape: "cyl", size: [0.22, 1.8], pos: [x - 0.75, 1.5, z - 0.6], rot: [0.35, 0, 0.25], seg: 10, shade: 0.6 },
    { shape: "cyl", size: [0.22, 1.8], pos: [x + 0.75, 1.5, z - 0.6], rot: [0.35, 0, -0.25], seg: 10, shade: 0.6 },
    { shape: "cyl", size: [0.18, 0.1], pos: [x, 0.42, z + 0.82], rot: [P2, 0, 0], seg: 10, shade: 1.7 }]; },
  fan:     function (x, z) { return [
    { shape: "rbox", size: [1.4, 0.2, 1.4], pos: [x, 0.1, z], r: 0.06, shade: 0.6 },
    { shape: "cyl", size: [0.24, 1.7], pos: [x, 0.95, z], seg: 12, shade: 0.7 },
    { shape: "torus", size: [2.2, 0.14], pos: [x, 2.1, z], seg: 30, seg2: 6, shade: 1.0 },
    { shape: "cyl", size: [0.5, 0.3], pos: [x, 2.1, z], rot: [P2, 0, 0], seg: 14, shade: 0.8 },
    { shape: "box", size: [0.9, 0.34, 0.06], pos: [x + 0.5, 2.4, z], rot: [0, 0, 0.9], r: 0.02, shade: 1.2,
      repeat: { count: 1, step: [0, 0, 0] } },
    { shape: "box", size: [0.9, 0.34, 0.06], pos: [x - 0.5, 1.8, z], rot: [0, 0, 0.9], r: 0.02, shade: 1.2 },
    { shape: "box", size: [0.34, 0.9, 0.06], pos: [x + 0.3, 1.7, z], rot: [0, 0, 0.9], r: 0.02, shade: 1.2 }]; },
  lamp:    function (x, z) { return [
    { shape: "cyl", size: [1.5, 0.18], pos: [x, 0.09, z], seg: 20, shade: 0.6 },
    { shape: "cyl", size: [0.16, 2.6], pos: [x, 1.4, z], seg: 10, shade: 0.7 },
    { shape: "cone", size: [1.0, 1.3, 2.1], pos: [x, 3.2, z], seg: 22, shade: 1.25 }]; },
  clock:   function (x, z) { return [
    { shape: "rbox", size: [1.9, 0.9, 1.1], pos: [x, 0.45, z], r: 0.1, shade: 1.0 },
    { shape: "box", size: [1.0, 0.42, 0.08], pos: [x - 0.35, 0.5, z + 0.58], r: 0.03, shade: 1.7 },
    { shape: "cyl", size: [0.3, 0.12], pos: [x + 0.6, 0.5, z + 0.58], rot: [P2, 0, 0], seg: 12, shade: 0.45 }]; }
};

/* Where a device stands: on its source's zone once assigned, on the
   shelf at the front until then. Spread within a zone so nine of them
   never stack on one another. */
function obSpot(i, n, sourceKey) {
  const src = OB[sourceKey];
  const z = src ? OB.zoneZ : OB.shelfZ;
  const cx = src ? src.x : 0;
  const spread = src ? 6.2 : 22.0;
  const step = n > 1 ? spread / (n - 1) : 0;
  return [cx - spread / 2 + step * i, z + (src ? (i % 2) * 2.6 : 0)];
}

/* `placed` is device -> source, exactly what the assign question hands
   its check. `devices` is the ordered list of { key, label }. */
export function outletBench(view) {
  view = view || {};
  const placed = view.placed || {};
  const devices = view.devices || [];

  const parts = [
    { key: "room", label: "The wall and its outlet", build: obWall(), finish: "matte", scale: 1,
      pos: [0, 0, 0], color: "#9aa2aa",
      spec: "A double outlet on a ring main",
      note: "Where everything ultimately comes from. What sits between it and a device is the " +
        "whole question." },
    { key: "surge", label: "The surge protector", build: obSurge(), finish: "plastic", scale: 1,
      pos: [0, 0, 0], color: "#3f464e",
      spec: "Six outlets, clamped to earth",
      note: "It shunts a spike to earth and does nothing whatever about an outage. Its lead is " +
        "coiled beside it because where that lead goes is what you are being asked." },
    { key: "ups", label: "The UPS", build: obUps(), finish: "plastic", scale: 1,
      pos: [0, 0, 0], color: "#2f353c",
      spec: "Line-interactive, two banks of outlets",
      note: "The near bank is on battery and the far bank is surge-only \\u2014 two different " +
        "sockets on one box, and putting a device on the wrong bank is a mistake nothing warns " +
        "you about until the power goes." }
  ];

  /* Devices, grouped by where the student has put them. */
  const groups = { wall: [], surge: [], ups: [], "": [] };
  devices.forEach(function (d) { (groups[placed[d.key] || ""] || groups[""]).push(d); });
  Object.keys(groups).forEach(function (g) {
    groups[g].forEach(function (d, i) {
      const spot = obSpot(i, groups[g].length, g || null);
      const build = (OB_SHAPES[d.key] || OB_SHAPES.modem)(spot[0], spot[1]);
      parts.push({ key: "dev-" + d.key, label: d.label, build: build,
        finish: "plastic", scale: 1, pos: [0, 0, 0],
        /* EACH DEVICE ITS OWN COLOUR, and not because it is prettier.
           One colour per part was already obeyed here and nine devices
           still came out as one grey mass \u2014 which is the adjacency
           failure this build has hit before, on a ribbon cassette against
           a platen. Silhouette does a lot of the work; value has to do
           the rest, because a student who cannot pick the printer out of
           the row cannot check their own answer against the picture.

           NOT coloured by whether it is in the right place. The bench
           shows what the student has done, never whether it was right,
           so the colour is a property of the DEVICE and does not change
           when it is assigned. */
        color: OB_COLOUR[d.key] || "#7d8790",
        spec: g ? "On the " + OB[g].label.toLowerCase() : "Not plugged in yet",
        note: g ? "" : "Still on the bench." });
    });
  });

  return {
    kind: "bench",
    title: "The room, and nine things that need power",
    caption: "Three sources and nine devices. Nothing here says whether a choice was right — " +
      "it shows where you have put things.",
    board: {
      size: [30, 0.5, 16], pos: [0, -0.26, 1.0], color: "#6f7681",
      build: [{ shape: "rbox", size: [30, 0.5, 16], pos: [0, 0, 1.0], r: 0.0, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth 38, WAS 30, AND 30 WAS ALSO "MEASURED".

       That is the point worth keeping: the old value was measured at the
       narrowest width anybody was testing at the time, and the narrowest
       width anybody was testing was not narrow. Re-swept against
       frustumOK at 319px — what fits inside a 390px phone — this bench
       still lost a part at 30. Every fitWidth in this build predates
       anyone driving a phone. */
    camera: { dist: 34.0, yaw: 0.16, pitch: 0.34, target: [0, 2.4, 0.5], min: 13, max: 68,
              fitWidth: 38 }
  };
}
