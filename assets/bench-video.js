/* =====================================================================
   THE FIVE WAYS A PICTURE GETS INTO A MONITOR.

   The display lab's "Get a picture into it" stage named HDMI,
   DisplayPort, DVI, VGA and USB-C and drew none of them. Every one of
   those is a shape you recognise in your hand, in a dark cupboard,
   behind a desk — and the whole skill being taught is telling them apart
   before you crawl under the desk with the wrong lead.

   SCALE: 1 UNIT = 1 mm. Smaller than the net lab's close-ups because
   these are smaller objects: an HDMI plug is 13.9 mm across and a USB-C
   is 8.3. Stated here and held to, except where a note says otherwise.

   THIS BENCH IS VIEWED NEARLY END-ON, AND THAT IS THE OPPOSITE OF THE
   FIBRE BENCH. There the connectors were told apart by how they hold on
   — a bayonet against a thread — so they had to show their LENGTH. Here
   they are told apart by the shape of the opening: a trapezoid, a
   rectangle with one corner cut, a D. That is a face, so the camera
   looks at the face and only enough off-axis to give the shells depth.

   WHAT ACTUALLY SEPARATES THEM

     HDMI      trapezoid, both bottom corners cut. Friction only, no
               latch, which is why it falls out of the back of a TV.
     DP        nearly the same size, but only ONE corner is cut and it
               has a LATCH you must squeeze. The commonest damage in a
               classroom is someone yanking a DP lead without it.
     DVI-D     big, white, two thumbscrews, and a flat blade to one side
               of the pins. Digital, and NO AUDIO.
     VGA       D-shaped shell, fifteen pins in THREE rows, two
               thumbscrews. Analogue: it degrades with cable length in a
               way none of the others do.
     USB-C     oval and reversible, and the only one on this bench that
               might carry no video at all — it needs DP Alt Mode, which
               is a property of the PORT and not of the cable.
   ===================================================================== */

const P2 = Math.PI / 2;

export const VIDEO_SCALE = { mmPerUnit: 1 };

export const VIDEO_COLOUR = {
  shellDark: "#3b434b",
  shellPale: "#d7dbdf",
  dvi:       "#e2e4e6",
  vga:       "#aab2b9",
  gold:      "#d6ad4a",
  metal:     "#aab2b9",
  boot:      "#2a3037"
};

/* A CONNECTOR SHELL IS A HOLLOW FRAME, so it is drawn as one: four walls
   round an opening rather than a solid block with a dark rectangle
   painted on the front. That is what makes a trapezoid possible at all
   in an engine with no boolean subtraction — the outline is built from
   the walls, and the hole is simply where no wall was put. */
function frame(x, w, h, d, botW, wall, shade) {
  const out = [];
  const hw = w / 2, hb = botW / 2, hh = h / 2;
  /* top and bottom bars */
  out.push({ shape: "box", size: [w, wall, d], pos: [x, hh - wall / 2, 0], r: 0.15, shade: shade });
  out.push({ shape: "box", size: [botW, wall, d], pos: [x, -hh + wall / 2, 0], r: 0.15, shade: shade });
  /* the two sides, leaned in by however much the bottom is narrower —
     this is what turns a rectangle into a trapezoid */
  const lean = Math.atan2(hw - hb, h);
  [-1, 1].forEach(function (sgn) {
    out.push({ shape: "box", size: [wall, h, d],
      pos: [x + sgn * ((hw + hb) / 2 - wall * 0.1), 0, 0],
      rot: [0, 0, sgn * lean], r: 0.15, shade: shade });
  });
  return out;
}

/* HDMI Type A. 13.9 x 4.45, both bottom corners cut. */
export function hdmiShell(x) {
  return frame(x, 13.9, 4.45, 11.0, 10.2, 1.15, 1.0).concat([
    /* the boot */
    { shape: "rbox", size: [15.0, 6.6, 9.0], pos: [x, 0, -10.0], r: 1.2, shade: 0.72 }
  ]);
}

/* The tongue inside, with its two rows of contacts. In an HDMI the pins
   are on a blade in the MIDDLE of the opening, which is the give-away if
   you ever get a torch on one. */
export function hdmiPins(x) {
  return [
    { shape: "box", size: [10.6, 0.9, 7.0], pos: [x, 0, 1.4], r: 0.1, shade: 0.55 },
    { shape: "box", size: [0.45, 0.3, 5.0], pos: [x - 4.6, 0.55, 1.4], r: 0.05, shade: 1.4,
      repeat: { count: 10, step: [1.02, 0, 0] } },
    { shape: "box", size: [0.45, 0.3, 5.0], pos: [x - 4.1, -0.55, 1.4], r: 0.05, shade: 1.4,
      repeat: { count: 9, step: [1.02, 0, 0] } }
  ];
}

/* DisplayPort. Nearly HDMI's size and NOT the same shape: one corner
   square, one cut. Plus the latch. */
export function dpShell(x) {
  const w = 16.1, h = 4.76, d = 11.0, wall = 1.15;
  const hw = w / 2, hh = h / 2;
  return [
    { shape: "box", size: [w, wall, d], pos: [x, hh - wall / 2, 0], r: 0.15, shade: 1.0 },
    { shape: "box", size: [w - 1.9, wall, d], pos: [x - 0.95, -hh + wall / 2, 0], r: 0.15, shade: 1.0 },
    /* square corner on the left */
    { shape: "box", size: [wall, h, d], pos: [x - hw + wall / 2, 0, 0], r: 0.15, shade: 1.0 },
    /* THE ONE CUT CORNER, on the right — the whole difference from HDMI */
    { shape: "box", size: [wall, h * 0.62, d], pos: [x + hw - wall / 2, hh * 0.38, 0], r: 0.15, shade: 1.0 },
    { shape: "box", size: [wall, h * 0.55, d], pos: [x + hw - wall * 1.1, -hh * 0.42, 0],
      rot: [0, 0, 0.62], r: 0.15, shade: 1.0 },
    { shape: "rbox", size: [17.0, 6.8, 9.0], pos: [x, 0, -10.0], r: 1.2, shade: 0.72 }
  ];
}

/* THE LATCH. Its own part because it is the thing students break. */
export function dpLatch(x) {
  return [
    { shape: "box", size: [3.6, 1.0, 6.0], pos: [x, 3.3, -5.0], r: 0.2, shade: 1.0 },
    { shape: "box", size: [1.2, 1.6, 2.0], pos: [x - 2.6, 3.0, -3.0], r: 0.2, shade: 0.9 },
    { shape: "box", size: [1.2, 1.6, 2.0], pos: [x + 2.6, 3.0, -3.0], r: 0.2, shade: 0.9 }
  ];
}

export function dpPins(x) {
  return [
    { shape: "box", size: [12.4, 0.9, 7.0], pos: [x - 0.3, -0.4, 1.4], r: 0.1, shade: 0.55 },
    { shape: "box", size: [0.45, 0.3, 5.0], pos: [x - 5.3, 0.15, 1.4], r: 0.05, shade: 1.4,
      repeat: { count: 10, step: [1.12, 0, 0] } },
    { shape: "box", size: [0.45, 0.3, 5.0], pos: [x - 4.8, -0.95, 1.4], r: 0.05, shade: 1.4,
      repeat: { count: 10, step: [1.12, 0, 0] } }
  ];
}

/* DVI-D. The big white one, with a blade and two thumbscrews. */
export function dviShell(x) {
  return frame(x, 25.0, 8.4, 10.0, 25.0, 1.3, 1.0).concat([
    { shape: "rbox", size: [26.0, 11.0, 9.0], pos: [x, 0, -10.0], r: 1.4, shade: 0.80 }
  ]);
}

export function dviPins(x) {
  const out = [];
  /* THE FLAT BLADE to one side — the fastest way to know a DVI from
     anything else, and on a DVI-D it is a plain blade with no pins
     round it. Four extra pins there would make it DVI-I and analogue. */
  out.push({ shape: "box", size: [1.0, 5.6, 6.0], pos: [x + 9.6, 0, 1.2], r: 0.1, shade: 0.55 });
  /* three rows of eight */
  [-2.0, 0, 2.0].forEach(function (dy) {
    out.push({ shape: "cyl", size: [0.6, 5.0], pos: [x - 8.2, dy, 1.2], rot: [P2, 0, 0],
      seg: 8, shade: 1.4, repeat: { count: 8, step: [1.9, 0, 0] } });
  });
  return out;
}

/* The thumbscrews DVI and VGA share. */
export function thumbScrews(x, halfSpan) {
  return [-1, 1].map(function (sgn) {
    return { shape: "cyl", size: [3.4, 4.0], pos: [x + sgn * halfSpan, 0, -3.0],
             rot: [P2, 0, 0], seg: 12, shade: 1.0 };
  });
}

/* VGA / DE-15. The D-shell: wider at the top than the bottom, which is
   what stops it going on upside down. */
export function vgaShell(x) {
  return frame(x, 19.0, 9.6, 9.0, 16.4, 1.3, 1.0).concat([
    { shape: "rbox", size: [20.0, 12.0, 9.0], pos: [x, 0, -9.5], r: 1.4, shade: 0.80 }
  ]);
}

/* FIFTEEN PINS IN THREE ROWS, and the row count is the tell: a serial
   port is the same D-shell with nine pins in TWO rows, and they have
   been confused by every technician at least once. */
export function vgaPins(x) {
  const out = [];
  [[2.6, 5, -6.2], [0, 5, -5.0], [-2.6, 5, -6.2]].forEach(function (row) {
    out.push({ shape: "cyl", size: [0.75, 4.6], pos: [x + row[2], row[0], 1.0],
      rot: [P2, 0, 0], seg: 8, shade: 1.4, repeat: { count: row[1], step: [2.6, 0, 0] } });
  });
  return out;
}

/* USB-C. Oval, reversible, and the one that might not carry video at
   all. rbox INFLATES by its corner radius, so the declared size is
   shrunk by 2r to land on the real 8.34 x 2.56. */
export function usbcShell(x) {
  const w = 8.34, h = 2.56, r = h / 2;
  return [
    { shape: "rbox", size: [w - 2 * r, h - 2 * r, 8.0], pos: [x, 0, 0], r: r, shade: 1.0 },
    { shape: "rbox", size: [11.0, 5.4, 9.0], pos: [x, 0, -9.0], r: 1.2, shade: 0.72 }
  ];
}

export function usbcTongue(x) {
  return [{ shape: "rbox", size: [6.0, 0.55, 5.0], pos: [x, 0, 1.2], r: 0.25, shade: 1.35 }];
}

/* ---------------------------------------------------------------------
   THE BENCH. Five plugs in a row, all at 1 unit = 1 mm, so the size
   differences are real: a DVI is three times the width of a USB-C and
   that is the first thing you notice reaching behind a desk.
   --------------------------------------------------------------------- */
export function videoBench(view) {
  view = view || {};
  const X = { hdmi: -46, dp: -25, dvi: 4, vga: 34, usbc: 55 };
  const parts = [];

  parts.push({ key: "vid-hdmi", label: "HDMI — trapezoid, no latch",
    build: hdmiShell(X.hdmi), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.shellDark, spec: "13.9 mm wide. Video AND audio on one lead",
    note: "BOTH BOTTOM CORNERS ARE CUT, which is the shape to hold in your head — it is the " +
      "only one on this bench that is a symmetrical trapezoid. It is held in by FRICTION and " +
      "nothing else, which is why it works its way out of the back of a wall-mounted screen " +
      "and why 'the picture keeps dropping' is so often just a loose HDMI." });
  parts.push({ key: "vid-hdmi-pins", label: "Its nineteen contacts",
    build: hdmiPins(X.hdmi), finish: "metal", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.gold, glow: 0.2, spec: "Two rows on a central tongue",
    note: "The contacts sit on a blade in the MIDDLE of the opening, not on the walls. Get a " +
      "torch on a socket and that blade tells you it is HDMI even when the shape does not." });

  parts.push({ key: "vid-dp", label: "DisplayPort — ONE corner cut, and a latch",
    build: dpShell(X.dp), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.shellDark, spec: "16.1 mm wide. Latched",
    note: "NEARLY THE SAME SIZE AS HDMI AND NOT THE SAME SHAPE: one corner is square and one " +
      "is cut, so it is asymmetric and only goes in one way. That asymmetry is the whole " +
      "identification — hold it against the HDMI beside it and the difference is obvious; " +
      "described in words it is almost invisible, which is why this stage had to show them." });
  parts.push({ key: "vid-dp-latch", label: "THE LATCH — squeeze before pulling",
    build: dpLatch(X.dp), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.shellPale, spec: "Two sprung hooks in the shell",
    note: "THE COMMONEST DAMAGE IN A CLASSROOM. A DisplayPort lead does not pull out like an " +
      "HDMI — it latches, and yanking it bends the hooks, tears the shell off the cable, or " +
      "pulls the socket off the graphics card. Squeeze the tab, then pull." });
  parts.push({ key: "vid-dp-pins", label: "Its twenty contacts", build: dpPins(X.dp),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: VIDEO_COLOUR.gold, glow: 0.2,
    spec: "Two rows, offset", note: "" });

  parts.push({ key: "vid-dvi", label: "DVI-D — big, white, screwed on",
    build: dviShell(X.dvi), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.dvi, spec: "25 mm wide. Digital, and NO AUDIO",
    note: "THE ONE THAT CARRIES NO SOUND. Swap a working HDMI for a DVI and the picture is " +
      "perfect and the speakers go silent, and the ticket comes in as 'the monitor broke'. " +
      "It screws down, so it does not fall out — and it is big, which is why it has " +
      "disappeared from thin laptops and lives on in projectors and older desktops." });
  parts.push({ key: "vid-dvi-pins", label: "Its blade and three rows of pins",
    build: dviPins(X.dvi), finish: "metal", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.metal, spec: "Flat blade to one side",
    note: "THE BLADE IS THE FAST IDENTIFICATION, and what is AROUND it decides the variant: a " +
      "bare blade is DVI-D, digital only. Four extra pins round that blade make it DVI-I, " +
      "which also carries analogue — which is the only reason a DVI-to-VGA adapter can " +
      "work, and why the same adapter does nothing on a DVI-D port." });

  parts.push({ key: "vid-vga", label: "VGA — D-shell, three rows, ANALOGUE",
    build: vgaShell(X.vga), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.vga, spec: "15 pins in 3 rows. No audio",
    note: "ANALOGUE, AND THAT IS THE WHOLE STORY. It is the only one here that gets gradually " +
      "WORSE rather than failing outright: a long or cheap VGA run gives a soft, ghosted, " +
      "smeared picture, and the fault is the cable rather than the screen. A digital lead " +
      "either carries the picture or it does not." });
  parts.push({ key: "vid-vga-pins", label: "Fifteen pins in THREE rows",
    build: vgaPins(X.vga), finish: "metal", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.metal, spec: "5 + 5 + 5",
    note: "COUNT THE ROWS. A serial port is the same D-shaped shell with NINE pins in TWO " +
      "rows, and the two have been confused by every technician at least once. Three rows " +
      "means video." });
  parts.push({ key: "vid-screws", label: "The thumbscrews",
    build: thumbScrews(X.dvi, 14.5).concat(thumbScrews(X.vga, 11.6)),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: VIDEO_COLOUR.metal,
    spec: "On DVI and VGA only",
    note: "The two oldest connectors here are the two that bolt on, and the two newest just " +
      "push in. That is not nostalgia: a screwed connector cannot be knocked out by a knee " +
      "under a desk, which is still the commonest cause of 'no signal' on a fixed install." });

  parts.push({ key: "vid-usbc", label: "USB-C — oval, reversible",
    build: usbcShell(X.usbc), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: VIDEO_COLOUR.shellDark, spec: "8.34 mm wide. Video only with DP Alt Mode",
    note: "THE ONLY ONE HERE THAT MIGHT CARRY NO PICTURE AT ALL. The shape guarantees " +
      "nothing: a USB-C socket carries video only if the PORT supports DP Alt Mode, and that " +
      "is a property of the machine, not of the lead. A student who has learned 'the right " +
      "cable fits, so it should work' meets the exception here." });
  parts.push({ key: "vid-usbc-tongue", label: "Its tongue", build: usbcTongue(X.usbc),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: VIDEO_COLOUR.gold, glow: 0.2,
    spec: "Contacts on both faces", note: "Contacts on BOTH sides is what makes it reversible." });

  return {
    kind: "bench",
    title: "Five ways a picture gets into a monitor",
    caption: "Drawn at 1 unit = 1 mm, so the sizes are real: a DVI is three times the width of " +
      "a USB-C. What tells them apart is the shape of the opening — a symmetrical trapezoid, " +
      "a rectangle with ONE corner cut, a D — and that is a thing you look at rather than " +
      "read about.",
    board: null, decor: [], parts: parts,
    /* NEARLY END-ON, WHICH IS THE OPPOSITE OF THE FIBRE BENCH. There the
       lesson was how a connector holds on, so the bodies had to show
       their length. Here the lesson is the shape of the FACE, so the
       camera looks at the face and takes only enough yaw and pitch to
       stop the shells reading as flat cut-outs. */
    camera: { dist: 86, fitWidth: 148, yaw: 0.30, pitch: 0.30, target: [7, 0, 0], min: 32, max: 300 }
  };
}
