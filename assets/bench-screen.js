/* =====================================================================
   TWO THINGS THE DISPLAY LAB TALKED ABOUT AND NEVER SHOWED.

   "Choose the panel for the job" compares TN, IPS, VA and OLED in a
   table of numbers. "The meeting room projector" is a stage about a
   projector with no projector on it.

   PANEL TYPES ARE A HARD CASE FOR A 3D MODEL, AND THE HONEST ANSWER IS
   NOT TO PRETEND OTHERWISE. Four panels look identical from the front —
   that is the point of them. What differs is how they BEHAVE, and two of
   those behaviours can be drawn:

     VIEWING ANGLE   the same panel seen from straight on and from the
                     side. TN washes out and shifts colour off-axis; IPS
                     barely changes; VA sits between; OLED holds.
     BLACK LEVEL     a dark scene beside a lit one. An OLED's black is
                     the panel switched off; an LCD's black is its
                     backlight leaking through a shut shutter.

   So this bench draws four identical panels turned to different angles
   with their faces shaded accordingly. Response time and refresh rate
   are NOT drawn, because a still picture cannot show them and a fake
   motion blur would be a lie a student could memorise.

   SCALE: 1 UNIT = 20 mm, AND THE NUMBER IS FORCED BY THE ENGINE.

   This was 1 unit = 5 mm, which made a 24-inch panel 106 units and a
   2 x 2 grid of them 232 units across. Framing that needs the camera
   well past 300 units back on a narrow canvas — and `scene.js` builds
   its camera as PerspectiveCamera(38, aspect, 0.1, 300). THE FAR PLANE
   IS 300. Everything past it is clipped away silently: the panels came
   out as thin wedges where the far plane cut through them, two of the
   four vanished completely, and pushing the camera further back made
   MORE of the bench disappear rather than less.

   Nothing caught it. `frustumOK` reported eight parts and none out,
   because it projects bounding spheres and compares their x extent —
   it knows nothing about depth. The framing check passed. The suite
   passed. The render was almost empty.

   Every other bench in this build is small enough to sit inside 300, so
   this is the first one to meet the wall. The engine is ported from the
   FSC unchanged so that fixes flow one way, which makes the bench the
   right place to fix it: at 20 mm per unit a 24-inch panel is 26.5
   units, the whole 2 x 2 grid is 58 across, and the camera never needs
   to be more than about 90 units back even on a phone.
   ===================================================================== */

const P2 = Math.PI / 2;

export const SCREEN_SCALE = { mmPerUnit: 20 };

export const SCREEN_COLOUR = {
  bezel:  "#2b3137",
  stand:  "#3b434b",
  lit:    "#8fa6bd",
  washed: "#a9b4bd",
  deep:   "#161a1e",
  lamp:   "#e8e2d0",
  body:   "#d9dce0"
};

/* PANELS. Each is the same object; only the angle it is turned to and
   the shade of its face differ, because that is the only honest
   difference a still render can carry. */
const PANEL = { w: 26.5, h: 15.0, t: 0.85, bez: 0.65 };

/* WHERE THE FOUR PANELS STAND.

   A ROW OF FOUR WAS THE WRONG ARRANGEMENT and a render said so plainly.
   Four monitors 106 wide at ±168 is a bench 456 units across and 83 tall
   — a ratio of about 5.5 to 1 — and every canvas this build hands out is
   nearer 2.5 to 1. Fitting that width puts the camera close enough to the
   row that the outer two are seen at a savage angle: they came out as
   thin wedges with their stands foreshortened into slivers, which reads
   as broken geometry rather than as a monitor turned away from you. The
   builder was fine; the LAYOUT was wrong.

   Two by two instead. The bench becomes 232 across and 196 tall, which
   frames on a phone, and the pairs sit side by side where a student can
   compare them — TN against VA on the top row, IPS against OLED below,
   each pair differing in one property rather than four. */
const GRID = { dx: 29, dy: 24.5 };

export function panelBody(x, y, turn) {
  const W = PANEL.w, H = PANEL.h, T = PANEL.t;
  return [
    /* the bezel */
    { shape: "rbox", size: [W - 0.5, H - 0.5, T], pos: [x, y, 0], rot: [0, turn, 0], r: 0.25, shade: 1.0 },
    /* the stand */
    { shape: "box", size: [1.75, 5.5, 1.5], pos: [x, y - H / 2 - 2.75, 0], rot: [0, turn, 0], r: 0.15, shade: 0.86 },
    { shape: "rbox", size: [10, 0.65, 6.5], pos: [x, y - H / 2 - 5.5, 0], rot: [0, turn, 0], r: 0.25, shade: 0.78 }
  ];
}

/* THE FACE, whose shade is the whole lesson. */
export function panelFace(x, y, turn) {
  const W = PANEL.w, H = PANEL.h, T = PANEL.t, B = PANEL.bez;
  return [{ shape: "rbox", size: [W - B * 2 - 0.5, H - B * 2 - 0.5, 0.2],
            pos: [x + Math.sin(turn) * (T / 2 + 0.12), y, Math.cos(turn) * (T / 2 + 0.12)],
            rot: [0, turn, 0], r: 0.12, shade: 1.0 }];
}

/* ---------------------------------------------------------------------
   THE PROJECTOR. A meeting-room box: lens at the front, a filter in the
   side, vents, and the two things that actually get called in about —
   the lamp behind a door underneath, and the filter nobody cleans.
   --------------------------------------------------------------------- */
/* THE PROJECTOR IS AUTHORED AT 1 UNIT = 5 mm AND DRAWN AT A QUARTER.

   Shrinking PROJ to match the panels' 20 mm units broke it, because the
   lens, filter, lamp door and exhaust each carry their own literals — a
   22-unit lens barrel, a 26-unit door, a 24-unit vent — and those stayed
   at the old scale. The result was a lens barrel bolted to two slabs,
   each part four times the size of the body it sits on.

   Rewriting forty literals to fix a scale is how a transcription error
   gets into geometry. `scale` on the part is what the engine provides
   for exactly this: the assembly is authored in the units that make its
   numbers natural — a projector really is about 310 mm wide, so 62 at
   5 mm — and drawn at 0.25, which puts it in the same world units as the
   panels and well inside the engine's 300-unit far plane. */
const PROJ = { w: 62, h: 22, d: 52 };
const PROJ_SCALE = 0.25;

export function projBody(x) {
  const W = PROJ.w, H = PROJ.h, D = PROJ.d;
  return [
    { shape: "rbox", size: [W - 3, H - 3, D - 3], pos: [x, 0, 0], r: 1.5, shade: 1.0 },
    /* the slight step round the top, which is what stops it reading as a
       plain brick */
    { shape: "rbox", size: [W - 12, 1.6, D - 12], pos: [x, H / 2 + 0.3, 0], r: 1.2, shade: 1.05 },
    /* the feet, one of them the adjustable front one */
    { shape: "cyl", size: [5, 2.4], pos: [x, -H / 2 - 1.2, D * 0.34], seg: 12, shade: 0.7 },
    { shape: "cyl", size: [4, 1.6], pos: [x - W * 0.34, -H / 2 - 0.8, -D * 0.3], seg: 10, shade: 0.7 },
    { shape: "cyl", size: [4, 1.6], pos: [x + W * 0.34, -H / 2 - 0.8, -D * 0.3], seg: 10, shade: 0.7 }
  ];
}

/* THE LENS, in its recessed barrel, with the focus and zoom rings. */
export function projLens(x) {
  const D = PROJ.d;
  return [
    { shape: "cyl", size: [22, 5.0], pos: [x - 8, 0, D / 2 - 1], rot: [P2, 0, 0], seg: 26, shade: 0.66 },
    { shape: "cyl", size: [17, 4.0], pos: [x - 8, 0, D / 2 + 2.4], rot: [P2, 0, 0], seg: 26, shade: 1.0 },
    /* the glass itself, set back inside */
    { shape: "cyl", size: [13, 1.2], pos: [x - 8, 0, D / 2 + 1.2], rot: [P2, 0, 0], seg: 26, shade: 1.5 },
    /* the two rings you turn */
    { shape: "box", size: [0.9, 0.7, 3.2], pos: [x - 8, 0, D / 2 + 3.0], r: 0.1, shade: 0.72,
      ring: { count: 18, axis: "z", radius: 8.8 } }
  ];
}

/* THE FILTER, in the side, behind a grille. This is the part that gets
   the call: a blocked filter cooks the lamp and the projector starts
   shutting itself down mid-meeting. */
export function projFilter(x) {
  const W = PROJ.w;
  return [
    { shape: "rbox", size: [3.0, 15, 26], pos: [x - W / 2 + 0.6, -1, -2], r: 0.8, shade: 0.62 },
    { shape: "box", size: [1.4, 1.0, 22], pos: [x - W / 2 + 2.0, -6.5, -2], r: 0.15, shade: 0.34,
      repeat: { count: 7, step: [0, 1.9, 0] } }
  ];
}

/* THE LAMP DOOR, underneath. A consumable with an hours counter, and the
   reason "the projector is dim" is usually not a fault at all. */
export function projLampDoor(x) {
  const H = PROJ.h;
  return [
    { shape: "rbox", size: [26, 2.0, 22], pos: [x + 10, -H / 2 - 0.4, -4], r: 0.8, shade: 0.80 },
    { shape: "cyl", size: [2.4, 1.4], pos: [x + 20, -H / 2 - 1.2, -12], rot: [P2, 0, 0], seg: 10, shade: 0.5 },
    { shape: "cyl", size: [2.4, 1.4], pos: [x, -H / 2 - 1.2, -12], rot: [P2, 0, 0], seg: 10, shade: 0.5 }
  ];
}

/* The exhaust, which is where the heat a blocked filter cannot shed
   would have gone. */
export function projVent(x) {
  const W = PROJ.w;
  return [
    { shape: "rbox", size: [3.0, 14, 24], pos: [x + W / 2 - 0.6, 0, -4], r: 0.8, shade: 0.58 },
    { shape: "box", size: [1.4, 9, 1.2], pos: [x + W / 2 - 2.0, 0, -13], r: 0.15, shade: 0.30,
      repeat: { count: 9, step: [0, 0, 2.2] } }
  ];
}

/* ---------------------------------------------------------------------
   THE BENCHES.
   --------------------------------------------------------------------- */
export function screenBench(view) {
  view = view || {};
  const parts = [];

  if (view.show === "projector") {
    parts.push({ key: "pj-body", label: "The projector", build: projBody(0), finish: "plastic",
      scale: PROJ_SCALE, pos: [0, 0, 0], color: SCREEN_COLOUR.body,
      spec: "1 unit = 5 mm. A meeting-room box",
      note: "MOST PROJECTOR CALLS ARE ABOUT TWO CONSUMABLES AND A SETTING, not a fault. The "
        + "lamp is a consumable with an hours counter, the filter is a consumable nobody "
        + "cleans, and the input is a setting somebody changed. Work through those before "
        + "anything else." });
    parts.push({ key: "pj-lens", label: "The lens, focus and zoom rings", build: projLens(0),
      finish: "plastic", scale: PROJ_SCALE, pos: [0, 0, 0], color: SCREEN_COLOUR.stand,
      spec: "Recessed, with two rings",
      note: "A BLURRY IMAGE IN ONE CORNER ONLY IS NOT A FOCUS PROBLEM — focus is even across "
        + "the picture. A corner that will not sharpen is keystone correction fighting the "
        + "angle the unit is mounted at, or a lens that has been knocked." });
    parts.push({ key: "pj-filter", label: "THE FILTER — the one nobody cleans",
      build: projFilter(0), finish: "plastic", scale: PROJ_SCALE, pos: [0, 0, 0],
      color: SCREEN_COLOUR.stand, spec: "Side intake, behind a grille",
      note: "A BLOCKED FILTER COOKS THE LAMP. The unit runs hot, protects itself, and shuts "
        + "down part-way through a meeting — and the report that comes in is “it keeps "
        + "turning itself off”, which sounds like a power fault and is not. It gets worse "
        + "the longer the machine has been running, which is the tell: a cold start works." });
    parts.push({ key: "pj-lamp", label: "The lamp door, underneath", build: projLampDoor(0),
      finish: "plastic", scale: PROJ_SCALE, pos: [0, 0, 0], color: SCREEN_COLOUR.body,
      spec: "A consumable with an hours counter",
      note: "“THE PROJECTOR HAS GONE DIM” IS USUALLY NOT A FAULT. Lamps lose brightness "
        + "gradually over hundreds of hours, so nobody notices until it is half gone. Check "
        + "the hours counter before diagnosing anything — and never touch the new glass, "
        + "because a fingerprint on a lamp envelope becomes a hot spot and shortens it." });
    parts.push({ key: "pj-vent", label: "The exhaust", build: projVent(0), finish: "plastic",
      scale: PROJ_SCALE, pos: [0, 0, 0], color: SCREEN_COLOUR.stand, spec: "Opposite the intake",
      note: "Intake one side, exhaust the other. Stand it against a wall or in a cupboard and "
        + "it breathes its own hot air, which produces exactly the same symptom as a blocked "
        + "filter." });
    return { kind: "bench", title: "The meeting room projector",
      caption: "Lens, filter, lamp and exhaust. Two of these are consumables and one of them "
        + "is the reason a projector shuts down mid-meeting.",
      board: null, decor: [], parts: parts,
      /* SWEPT AND MEASURED, not scaled off the old numbers. Dividing the
         previous camera by four along with the geometry put the viewer
         inside the vent slots: the bench filled 98.7% of the canvas and
         its ink touched all four edges, while frustumOK still reported
         nought parts out — it tests the horizontal extent of bounding
         spheres and cannot see a bench that is simply too close. */
      /* fitWidth SWEPT AT ALL FOUR WIDTHS, which is the only way it is
         worth anything. 22 was set from an INK measurement taken at a
         900px canvas — it fitted there and lost a part at 319 and at 480,
         because the field of view is vertical and a narrow canvas shows
         LESS world width at the same distance. Clean from 30; set one
         step above. `max` is well clear of the ~80 units the fit needs at
         319px, or the orbit clamp would throw the fit away and the
         promise would be inert. */
      camera: { dist: 28, fitWidth: 38, yaw: 0.62, pitch: 0.34, target: [0, -0.5, 0],
                min: 10, max: 160 } };
  }

  /* ---- the four panel types, turned to show what differs ---- */
  const P = [
    { key: "tn",   x: -GRID.dx / 2, y: GRID.dy / 2, turn: 0.90, face: SCREEN_COLOUR.washed,
      label: "TN — fastest, and the worst off-axis",
      spec: "Turned 52°. The face has washed out",
      note: "THE CHEAP FAST ONE. Colour shifts and washes out as soon as you are off-centre, "
        + "which does not matter for one person square in front of it and matters enormously "
        + "for two people sharing a screen. Bought for response time, and response time is "
        + "the one thing a still picture cannot show you — so it is in the numbers, not "
        + "here." },
    { key: "va",   x: GRID.dx / 2, y: GRID.dy / 2, turn: 0.52,
      /* DARKER, NOT JUST BLUER. At #7e93a8 this face and the IPS face
         below it sampled within a few points of each other and the pair
         read as one colour — which quietly taught that VA and IPS behave
         the same off-axis, the opposite of the lesson. A VA panel's
         off-axis failure is a GAMMA SHIFT: mid tones crush toward black
         as you move off centre, where TN washes them toward white. Those
         are opposite directions, so the two wrong answers on this bench
         now look wrong in opposite ways. */
      face: "#4e6070",
      label: "VA — deep blacks, middling angles",
      spec: "Turned 30°. Holding better",
      note: "THE COMPROMISE. Much better blacks than TN or IPS because the crystals block "
        + "light more completely when shut, and viewing angles between the two. Its weakness "
        + "is smearing on fast dark-to-light transitions, which again is motion and again "
        + "cannot be drawn." },
    { key: "ips",  x: -GRID.dx / 2, y: -GRID.dy / 2, turn: 0.18, face: SCREEN_COLOUR.lit,
      label: "IPS — colour holds from anywhere",
      spec: "Turned 10°. Barely changed",
      note: "THE ONE YOU SPECIFY FOR ANYONE WHO CARES ABOUT COLOUR, or for a screen more than "
        + "one person looks at. Colour and brightness hold almost flat across the viewing "
        + "cone. Costs more, and its blacks are greyer than VA because the backlight is "
        + "always on behind it." },
    { key: "oled", x: GRID.dx / 2, y: -GRID.dy / 2, turn: 0.18, face: SCREEN_COLOUR.deep,
      label: "OLED — black is the pixel switched OFF",
      spec: "Turned 10°. Black is truly black",
      note: "NO BACKLIGHT AT ALL, which is the whole difference. Every other panel here makes "
        + "black by shutting a shutter in front of a lamp that is still lit, so black is dark "
        + "grey. An OLED makes black by turning the pixel off. That is also why it can suffer "
        + "BURN-IN, which none of the others can: a pixel that has been lit for a thousand "
        + "hours has aged more than its neighbours." }
  ];
  P.forEach(function (p) {
    parts.push({ key: "pan-" + p.key, label: p.label, build: panelBody(p.x, p.y, p.turn),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: SCREEN_COLOUR.bezel,
      spec: p.spec, note: p.note });
    parts.push({ key: "face-" + p.key, label: p.label.split(" — ")[0] + " face",
      build: panelFace(p.x, p.y, p.turn), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: p.face, spec: "What it looks like from where you are standing", note: "" });
  });

  return { kind: "bench", title: "Four panels, turned to show what actually differs",
    caption: "They look identical from straight on — that is the point of them. What "
      + "separates them is how they behave OFF-AXIS and how they make black, so each is "
      + "turned a different amount and its face shaded for what you would see. Response time "
      + "and refresh rate are deliberately NOT drawn: a still picture cannot show motion, and "
      + "a fake blur would be a lie a student could memorise.",
    board: null, decor: [], parts: parts,
    /* fitWidth SWEPT, NOT REASONED. 440 was arrived at from "four panels
       106 wide at ±168, so 442 across" — and it lost THREE parts at every
       canvas width, because frustumOK works on bounding SPHERES and a
       panel turned 52 degrees presents a radius near 61 rather than its
       half-width of 53. Clean from 500; set one sweep step above, as
       everywhere else in this build. `max` has to stay above the distance
       the fit needs or the fit is clamped away and becomes inert. */
    /* fitWidth is set from the bench's HEIGHT, not its width. The grid is
       58 across and 49 tall, and on a phone the canvas is TALLER than it
       is wide relative to a desktop — visible height is fitWidth / aspect,
       so a value that fits the width cuts the rows off top and bottom.
       Same trap as the closed handset, which is documented in CLAUDE.md.
       Swept and measured rather than reasoned; see verify/bench-depth.mjs,
       which also holds it inside the engine's 300-unit far plane. */
    camera: { dist: 88, fitWidth: 118, yaw: 0.10, pitch: 0.16, target: [0, -6.5, 0],
              min: 30, max: 220 } };
}
