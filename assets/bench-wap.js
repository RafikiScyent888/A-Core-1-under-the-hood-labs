/* =====================================================================
   A+ Core1 Under the Hood Labs — the wireless bench

   The floor, from above. A plan view, which is the one camera angle in
   this whole build with no occlusion problem at all: nothing on a floor
   plan is behind anything else.

   That is not laziness. It is also how the job is actually done — a site
   survey is a drawing, an AP goes on a drawing, and channel planning is
   done on a drawing. Drawing it any other way would be prettier and less
   like the work.

   MATERIALS ARE NAMED, NOT JUST COLOURED

   Every floor tile carries a material, and the material changes what the
   RF does. Colour alone would put the whole lesson out of reach of a
   colour-blind student and most of it out of reach of anyone on a washed
   out screen — so every material is named in the control list beside the
   canvas, every source says what it is in words, and the tile shading is
   a second channel rather than the only one.

   INTERFERENCE STACKS

   The owner asked for at least six sources and for them to stack, so the
   student has to work out which is dominant rather than finding "the"
   one. Each live source gets a halo sized by its reach and brightness by
   its noise floor, and where two halos overlap the student can see that
   the sum is worse than either. Microwave is required by name and the
   generator picks it more often than any other.
   ===================================================================== */

const P2 = Math.PI / 2;

const TILE = 2.0;          /* one floor cell */
const TH = 0.22;           /* tile thickness */

/* Materials, and what each one does to a signal. `shade` is a second
   channel; `says` is the one that counts. */
const MAT = {
  open:     { shade: 1.00, says: "Open floor" },
  /* `wall` is the generator's own word for a solid interior wall. It was
     missing here, so every one of them fell through to "Open floor" — a
     plan that told a student there was nothing in the way of a signal that
     is going through a wall. */
  wall:     { shade: 0.54, says: "Solid wall — a real loss through it" },
  drywall:  { shade: 0.86, says: "Stud wall — barely slows it" },
  brick:    { shade: 0.62, says: "Brick — a real loss" },
  concrete: { shade: 0.42, says: "Concrete — most of the signal stops here" },
  metal:    { shade: 1.35, says: "Metal — reflects, and shadows behind it" },
  glass:    { shade: 1.18, says: "Glass — reflects more than people expect" },
  water:    { shade: 0.70, says: "Water — soaks up 2.4 GHz" },
  mirror:   { shade: 1.42, says: "Mirror — metal backing, so it behaves like metal" }
};
export function materialWords(m) { return (MAT[m] || MAT.open).says; }

/* What each source looks like on the floor. */
const SRC = {
  microwave: { color: "#ff3b30", says: "Microwave oven — 2.4 GHz, and only while it runs" },
  cordless:  { color: "#ffa524", says: "Cordless phone base — 2.4 GHz, continuous" },
  bluetooth: { color: "#3d8bff", says: "Bluetooth density — hops across the whole band" },
  neighbour: { color: "#c47dff", says: "Neighbouring AP on an overlapping channel" },
  ballast:   { color: "#ffd426", says: "Fluorescent ballast — broadband noise" },
  materials: { color: "#8f99a3", says: "Building materials in the path" }
};
export function sourceWords(k) { return (SRC[k] || { says: k }).says; }
export const SOURCE_KEYS = Object.keys(SRC);

/* Floor coordinates to world. The plan is centred on the origin. */
function wx(x, cols) { return (x - (cols - 1) / 2) * TILE; }
function wz(y, rows) { return (y - (rows - 1) / 2) * TILE; }

/* ---------- the floor ---------- */
function floorTiles(cells, cols, rows) {
  return (cells || []).map(function (c) {
    const m = MAT[c.mat] || MAT.open;
    return { shape: "rbox", size: [TILE - 0.12, TH, TILE - 0.12],
      pos: [wx(c.x, cols), 0, wz(c.y, rows)], r: 0.04, shade: m.shade };
  });
}

function walls(cols, rows) {
  const W = cols * TILE, D = rows * TILE, t = 0.34, h = 1.1;
  return [
    { shape: "rbox", size: [W + t, h, t], pos: [0, h / 2, -D / 2], r: 0.05, shade: 1.0 },
    { shape: "rbox", size: [W + t, h, t], pos: [0, h / 2, D / 2], r: 0.05, shade: 1.0 },
    { shape: "rbox", size: [t, h, D + t], pos: [-W / 2, h / 2, 0], r: 0.05, shade: 1.0 },
    { shape: "rbox", size: [t, h, D + t], pos: [W / 2, h / 2, 0], r: 0.05, shade: 1.0 }
  ];
}

/* ---------- one interference source ----------
   A body you can recognise from above, and a halo the size of its reach. */
function sourceBody(key, x, z) {
  switch (key) {
    case "microwave":
      return [
        { shape: "rbox", size: [1.5, 0.9, 1.1], pos: [x, 0.6, z], r: 0.06, shade: 1.0 },
        /* the door, and the handle down its right edge */
        { shape: "box", size: [1.0, 0.06, 0.9], pos: [x - 0.1, 1.06, z], r: 0.02, shade: 0.5 },
        { shape: "cyl", size: [0.14, 0.9], pos: [x + 0.6, 1.06, z], seg: 8, shade: 0.7 }
      ];
    case "cordless":
      return [
        { shape: "rbox", size: [0.8, 0.35, 0.7], pos: [x, 0.32, z], r: 0.08, shade: 1.0 },
        { shape: "cyl", size: [0.12, 1.3], pos: [x + 0.25, 1.0, z], seg: 8, shade: 0.8 }
      ];
    case "bluetooth":
      /* a scatter of small devices rather than one thing, because that is
         what Bluetooth density actually is */
      return [
        { shape: "rbox", size: [0.4, 0.16, 0.62], pos: [x - 0.5, 0.22, z - 0.4], r: 0.05, shade: 1.0 },
        { shape: "rbox", size: [0.4, 0.16, 0.62], pos: [x + 0.5, 0.22, z + 0.2], r: 0.05, shade: 1.0 },
        { shape: "rbox", size: [0.4, 0.16, 0.62], pos: [x + 0.1, 0.22, z + 0.7], r: 0.05, shade: 1.0 }
      ];
    case "neighbour":
      return [
        { shape: "cyl", size: [1.2, 0.28], pos: [x, 0.3, z], seg: 18, shade: 1.0 },
        { shape: "cyl", size: [0.16, 0.9], pos: [x, 0.75, z], seg: 8, shade: 0.7 }
      ];
    case "ballast":
      return [
        { shape: "rbox", size: [2.6, 0.24, 0.5], pos: [x, 1.5, z], r: 0.04, shade: 1.0 },
        { shape: "cyl", size: [0.3, 2.3], pos: [x, 1.38, z], rot: [0, 0, P2], seg: 12, shade: 1.5 }
      ];
    default:
      /* "materials" has no object — it is the floor itself */
      return [];
  }
}

/* THE HALO IS A RING, NOT A DISC.

   Drawn filled, the first cut buried the whole lesson: four opaque discs
   lying on the plan hid the floor materials, hid the source bodies, and
   hid each other — so "the sources stack" became "the biggest circle is
   on top", which is the opposite of what a student is meant to work out.

   Rings overlap legibly. Two crossing rings show two reaches meeting, and
   the floor stays readable underneath. Loudness is carried by how many
   rings and how bright, not by area. */
function halo(x, z, reach, dominant, noise) {
  const r = Math.max(0.8, reach * TILE);
  const rings = (noise || 0) >= 20 ? 3 : ((noise || 0) >= 10 ? 2 : 1);
  const out = [];
  for (let i = 0; i < rings; i++) {
    const rr = r * (1 - i * 0.16);
    out.push({ shape: "torus", size: [rr * 2, dominant ? 0.20 : 0.13],
      pos: [x, TH / 2 + 0.05 + i * 0.02, z], rot: [P2, 0, 0], seg: 40, seg2: 6,
      shade: dominant ? 1.7 : 1.0 });
  }
  /* A small filled pad at the centre, so a source with a tiny reach is
     still findable on the plan. */
  out.push({ shape: "cyl", size: [0.9, 0.06], pos: [x, TH / 2 + 0.03, z], seg: 18, shade: 1.3 });
  return out;
}

/* ---------- the access point ---------- */
function apBody(x, z) {
  return [
    { shape: "cyl", size: [1.7, 0.34], pos: [x, 0.42, z], seg: 22, shade: 1.0 },
    { shape: "cyl", size: [0.9, 0.14], pos: [x, 0.64, z], seg: 18, shade: 1.25 },
    /* the mounting bracket under it */
    { shape: "box", size: [0.36, 0.18, 1.9], pos: [x, 0.2, z], r: 0.02, shade: 0.7 }
  ];
}

function apCoverage(x, z, radius) {
  const r = Math.max(1.0, radius * TILE);
  return [
    { shape: "torus", size: [r * 2, 0.18], pos: [x, TH / 2 + 0.06, z],
      rot: [P2, 0, 0], seg: 40, seg2: 6, shade: 1.7 },
    /* a second, inner ring at the point where signal is still comfortable
       rather than merely present */
    { shape: "torus", size: [r * 1.3, 0.11], pos: [x, TH / 2 + 0.05, z],
      rot: [P2, 0, 0], seg: 36, seg2: 6, shade: 1.1 }
  ];
}

/* ---------- clients ---------- */
function clientPin(x, z, ok) {
  return [
    { shape: "cyl", size: [0.7, 0.12], pos: [x, TH / 2 + 0.1, z], seg: 14, shade: 0.5 },
    { shape: "cone", size: [0.55, 1.1, 0.02], pos: [x, 0.75, z], rot: [Math.PI, 0, 0],
      seg: 12, shade: ok ? 1.0 : 1.6 }
  ];
}

/* ---------------------------------------------------------------------
   wapBench(view)

     view.cols, view.rows, view.cells    the floor plan
     view.sources   [{ key, x, y, reach, noise, live }]
     view.ap        { x, y, radius } or null
     view.clients   [{ key, label, x, y, ok }]
     view.dominant  which source key is loudest, or null
   --------------------------------------------------------------------- */
export function wapBench(view) {
  view = view || {};
  const cols = view.cols || 7, rows = view.rows || 5;

  const parts = [
    { key: "floor", label: "The floor", build: floorTiles(view.cells, cols, rows),
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#8d959c",
      spec: cols + " by " + rows + " cells",
      note: "Each cell has a material, and the material is what decides how much signal gets " +
        "through it. The names are in the list below, because a colour on a plan is not " +
        "something everyone can read." },
    { key: "walls", label: "The perimeter", build: walls(cols, rows), finish: "matte",
      scale: 1, pos: [0, 0, 0], color: "#6f7a84",
      spec: "Outer walls", note: "" }
  ];

  /* Sources, halo first so bodies draw over their own glow. */
  (view.sources || []).forEach(function (src) {
    const S = SRC[src.key] || SRC.materials;
    const x = wx(src.x, cols), z = wz(src.y, rows);
    const dominant = view.dominant === src.key;

    if (src.reach > 0) {
      parts.push({ key: "halo-" + src.key, label: S.says + " — its reach",
        build: halo(x, z, src.reach, dominant, src.noise), finish: "plastic", scale: 1,
        pos: [0, 0, 0], color: S.color,
        glow: dominant ? 1.35 : 0.55 + Math.min(0.6, (src.noise || 0) / 40),
        spec: "Reaches about " + src.reach + " cells",
        note: dominant
          ? "This is the loudest thing on the floor. Where its ring overlaps another, both are " +
            "adding to the same noise floor."
          : "" });
    }

    const body = sourceBody(src.key, x, z);
    if (body.length) {
      parts.push({ key: "src-" + src.key, label: S.says, build: body, finish: "plastic",
        scale: 1, pos: [0, 0, 0], color: "#7b858e",
        spec: (src.noise || 0) + " dB of noise, " + (src.band || "2.4") + " GHz",
        note: "" });
    }
  });

  /* The AP and its coverage. */
  if (view.ap) {
    const ax = wx(view.ap.x, cols), az = wz(view.ap.y, rows);
    parts.push({ key: "coverage", label: "Coverage from where it is now",
      build: apCoverage(ax, az, view.ap.radius || 2.5), finish: "plastic", scale: 1,
      pos: [0, 0, 0], color: "#2fd45e", glow: 0.9,
      spec: "About " + (view.ap.radius || 2.5) + " cells",
      note: "The ring is where usable signal ends, not where the radio stops — a client can see " +
        "an AP long after it can hold a session with it." });
    parts.push({ key: "ap", label: "The access point", build: apBody(ax, az), finish: "plastic",
      scale: 1, pos: [0, 0, 0], color: "#e8edf1",
      spec: "Ceiling mounted",
      note: "Height and centring matter more than power. Turning an AP up makes it shout further " +
        "than the clients can answer, which reads to a user as a strong signal that will not work." });
  }

  /* Clients. */
  (view.clients || []).forEach(function (c) {
    parts.push({ key: "client-" + c.key, label: c.label,
      build: clientPin(wx(c.x, cols), wz(c.y, rows), c.ok !== false),
      finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: c.ok === false ? "#ff3b30" : "#2fd45e", glow: c.ok === false ? 1.4 : 0.7,
      spec: c.ok === false ? "Not getting a usable signal" : "Covered",
      note: "" });
  });

  return {
    kind: "bench",
    title: "The floor, from above",
    caption: "A plan, the way a survey is actually done. Every material and every source is named " +
      "in the list below as well as drawn here.",
    board: {
      size: [cols * TILE + 5, 0.5, rows * TILE + 5], pos: [0, -0.4, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [cols * TILE + 5, 0.5, rows * TILE + 5], pos: [0, 0, 0],
        r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* Nearly straight down. A plan view has no occlusion, which is the
       whole reason this bench is drawn this way. */
    /* The Bluetooth halo reaches furthest across the plan and was cut off
       at 720px, on the one stage that asks which source dominates. A halo
       you cannot see is a source the student cannot weigh. */
    camera: { dist: 26.0, fitWidth: 42, yaw: 0.06, pitch: 1.16,
      target: [0, 0.4, 0], min: 10, max: 54 }
  };
}
