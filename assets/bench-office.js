/* =====================================================================
   A+ Core1 Under the Hood Labs — the three benches the core path was
   missing: the site, the back panel, and the volume.

   Between them these finish the job the owner set: every stage of the
   Printer lab shows the student something they can look at, and the
   short path stops being an arithmetic worksheet.

   Each one exists because its STAGE has a physical fact underneath it
   that was only ever described in words:

     SITE     brief  — "no room behind the counter", "it cannot be noisy
                       with customers standing there", "it has to work
                       with the trolley it sits on". Those are not
                       opinions, they are measurements of a room. So the
                       room is drawn, with its gap, its sockets and
                       whether there is a data point on the wall at all.

     REAR     deploy — the ordering question is about what you plug in
                       and in what order. A back panel with three
                       sockets on it and a wall plate six feet away is
                       the thing the order is ABOUT.

     VOLUME   duty   — a duty cycle is a number nobody has a feel for.
                       Fifty thousand pages a month is a physical pile,
                       and a student who has seen the pile will never
                       again size a machine by reading the ceiling off a
                       spec sheet.

   WHAT THESE MUST NOT DO

   The site bench must not tell the student which of the customer's
   quotes are real constraints — that is the question. It shows the room
   accurately and says nothing about the brief: a narrow counter is
   evidence, and evidence is what a technician is supposed to work from.
   The quotes that are chat ("someone said we should lease") have no
   physical trace in the room, which is exactly why they are chat.

   The volume bench shows only the two figures the table already gives —
   their stated monthly volume and the machine's rating. It does not do
   the arithmetic the number question asks for.
   ===================================================================== */

const P2 = Math.PI / 2;

/* ---------------------------------------------------------------------
   Shared: the room shell every site is drawn inside.
   --------------------------------------------------------------------- */
function room(w, d) {
  return [
    /* floor */
    { shape: "rbox", size: [w, 0.6, d], pos: [0, -4.0, 0], r: 0.1, shade: 1.0 },
    /* back wall */
    { shape: "rbox", size: [w, 13.0, 0.6], pos: [0, 2.6, -d / 2], r: 0.1, shade: 1.18 }
  ];
}

/* A twin power socket on the back wall — every site has one, and where
   it is decides where the machine can stand. */
function socket(x, y) {
  return [
    /* MOUNTED ON THE FRONT OF THE WALL, not inside it. Placed at the
       wall's centre line these were behind its front face and painted
       nothing \u2014 the same burial that hid three features on the
       showroom shelf. The caller puts the wall's front face at z = 0
       for this helper, so everything here is positive. */
    { shape: "rbox", size: [2.4, 1.6, 0.35], pos: [x, y, 0.2], r: 0.12, shade: 1.0 },
    { shape: "box", size: [0.28, 0.5, 0.2], pos: [x - 0.55, y, 0.42], r: 0.02, shade: 0.4 },
    { shape: "box", size: [0.28, 0.5, 0.2], pos: [x + 0.55, y, 0.42], r: 0.02, shade: 0.4 }
  ];
}

/* The network outlet, when the site has one. Its ABSENCE is a fact
   worth as much as its presence, so a site without one simply has no
   plate on the wall and the caption says so. */
function dataPoint(x, y) {
  return [
    { shape: "rbox", size: [1.7, 1.7, 0.3], pos: [x, y, 0.2], r: 0.1, shade: 1.0 },
    { shape: "rbox", size: [0.8, 0.95, 0.22], pos: [x, y - 0.1, 0.4], r: 0.05, shade: 0.45 }
  ];
}

/* ---------------------------------------------------------------------
   SITE — the room the machine has to live in.
   --------------------------------------------------------------------- */
const PLACES = {
  till: {
    name: "The shop counter",
    room: "A till, a card reader and a spike of dockets, all already on it",
    gap: "About 30 cm of clear counter, and customers on the other side of it",
    lan: false,
    furniture: function () {
      return [
        /* the counter, seen end-on so the depth of it reads */
        { shape: "rbox", size: [22.0, 1.0, 7.0], pos: [0, -0.4, 1.0], r: 0.15, shade: 1.0 },
        { shape: "rbox", size: [21.0, 3.2, 0.8], pos: [0, -2.1, 4.2], r: 0.1, shade: 0.8 },
        /* the till, which is most of what the counter already holds */
        { shape: "rbox", size: [7.0, 3.2, 5.0], pos: [-6.0, 1.7, 0.6], r: 0.3, shade: 1.22 },
        { shape: "box", size: [5.6, 0.25, 3.0], pos: [-6.0, 3.4, 1.4], rot: [-0.5, 0, 0],
          r: 0.05, shade: 1.5 },
        /* the card reader */
        { shape: "rbox", size: [2.2, 0.9, 3.2], pos: [1.4, 0.55, 2.6], rot: [-0.35, 0, 0],
          r: 0.2, shade: 1.35 },
        /* and the clear space left over, which is the constraint */
        { shape: "box", size: [6.6, 0.12, 5.4], pos: [6.4, 0.16, 0.8], r: 0.02, shade: 1.7 }
      ];
    }
  },
  office: {
    name: "The general office",
    room: "Desks, a shared meeting table and a stationery cupboard",
    gap: "A side table with room to spare, and a data point on the wall",
    lan: true,
    furniture: function () {
      return [
        { shape: "rbox", size: [24.0, 0.9, 9.0], pos: [0, -0.6, 0.5], r: 0.15, shade: 1.0 },
        { shape: "cyl", size: [0.5, 3.4], pos: [-10.0, -2.4, 3.0], seg: 10, shade: 0.7 },
        { shape: "cyl", size: [0.5, 3.4], pos: [10.0, -2.4, 3.0], seg: 10, shade: 0.7 },
        /* a monitor and keyboard at one end, so the scale is legible */
        { shape: "rbox", size: [7.6, 4.6, 0.4], pos: [-7.0, 2.3, -2.4], rot: [0.12, 0, 0],
          r: 0.15, shade: 1.25 },
        { shape: "box", size: [1.2, 1.6, 1.2], pos: [-7.0, -0.2, -2.0], r: 0.1, shade: 0.85 },
        { shape: "box", size: [6.4, 0.35, 2.2], pos: [-7.0, 0.0, 1.4], r: 0.05, shade: 1.4 },
        { shape: "box", size: [8.0, 0.12, 6.0], pos: [7.0, 0.0, 0.6], r: 0.02, shade: 1.7 }
      ];
    }
  },
  photo: {
    name: "The design desk",
    room: "Two large monitors, a proofing lamp and a graphics tablet",
    gap: "A big desk, colour-critical work, and the window behind it",
    lan: true,
    furniture: function () {
      return [
        { shape: "rbox", size: [24.0, 0.9, 10.0], pos: [0, -0.6, 0.5], r: 0.15, shade: 1.0 },
        /* a wide monitor, because this desk is about looking at colour */
        { shape: "rbox", size: [13.0, 5.4, 0.4], pos: [-3.0, 2.7, -3.0], rot: [0.1, 0, 0],
          r: 0.15, shade: 1.25 },
        { shape: "box", size: [2.0, 2.0, 1.6], pos: [-3.0, -0.1, -2.6], r: 0.1, shade: 0.85 },
        /* proof prints pinned up, and swatches on the desk */
        { shape: "box", size: [3.0, 4.0, 0.12], pos: [7.5, 4.6, -9.4], r: 0.02, shade: 1.8 },
        { shape: "box", size: [3.0, 4.0, 0.12], pos: [11.2, 4.6, -9.4], r: 0.02, shade: 1.65 },
        { shape: "box", size: [5.0, 0.2, 3.4], pos: [7.0, 0.0, 1.2], rot: [0, 0.2, 0],
          r: 0.03, shade: 1.7 }
      ];
    }
  },
  forms: {
    name: "The despatch bay",
    room: "A packing bench, a scanner cradle and a pallet of flat boxes",
    gap: "A steel bench, no carpet, and nobody standing near it",
    lan: false,
    furniture: function () {
      return [
        { shape: "rbox", size: [24.0, 0.8, 10.0], pos: [0, -0.7, 0.5], r: 0.08, shade: 1.0 },
        { shape: "box", size: [0.7, 3.2, 0.7], pos: [-10.5, -2.5, 4.0], r: 0.05, shade: 0.75 },
        { shape: "box", size: [0.7, 3.2, 0.7], pos: [10.5, -2.5, 4.0], r: 0.05, shade: 0.75 },
        /* a box of fanfold under the bench, which is what despatch runs on */
        { shape: "rbox", size: [8.0, 4.0, 6.0], pos: [-7.0, -1.9, -1.0], r: 0.1, shade: 1.3 },
        { shape: "box", size: [7.2, 0.16, 5.2], pos: [-7.0, 0.2, -1.0], r: 0.02,
          shade: 1.75, repeat: { count: 5, step: [0, 0.18, 0] } },
        /* and a pallet, because this room is not an office */
        { shape: "box", size: [9.0, 0.5, 7.0], pos: [8.0, -3.4, 2.0], r: 0.03, shade: 1.15 }
      ];
    }
  },
  records: {
    name: "The records office",
    room: "A run of filing units, a locked door, and patient data on every page",
    gap: "About a metre of clear worktop beside the filing units",
    lan: true,
    furniture: function () {
      return [
        { shape: "rbox", size: [24.0, 0.9, 9.0], pos: [0, -0.6, 0.5], r: 0.15, shade: 1.0 },
        /* filing drawers along the back, which is what makes this room
           the one where secure release matters */
        { shape: "rbox", size: [5.4, 7.0, 5.0], pos: [-8.5, -0.5, -5.0], r: 0.12, shade: 1.2 },
        { shape: "box", size: [4.6, 0.3, 0.3], pos: [-8.5, 1.4, -2.4], r: 0.05, shade: 1.6,
          repeat: { count: 3, step: [0, -1.7, 0] } },
        { shape: "rbox", size: [5.4, 7.0, 5.0], pos: [-2.4, -0.5, -5.0], r: 0.12, shade: 1.2 },
        { shape: "box", size: [4.6, 0.3, 0.3], pos: [-2.4, 1.4, -2.4], r: 0.05, shade: 1.6,
          repeat: { count: 3, step: [0, -1.7, 0] } },
        { shape: "box", size: [8.0, 0.12, 6.0], pos: [7.0, 0.0, 0.6], r: 0.02, shade: 1.7 }
      ];
    }
  }
};

export const SITES = Object.keys(PLACES).map(function (k) {
  /* `room` HAS TO BE COPIED HERE OR IT NEVER ARRIVES. This projection
     names the fields it carries one at a time, so a field added to
     PLACES and not added here is simply absent at the far end — the
     printer lab read site.room as undefined and printed nothing, which
     is the quiet version of the bug it was added to fix. */
  return { key: k, name: PLACES[k].name, room: PLACES[k].room,
           gap: PLACES[k].gap, lan: PLACES[k].lan };
});

/* THE ROOM AND THE SPACE ARE TWO DIFFERENT FACTS, and for a while they
   were one sentence printed twice — the site bench gave `gap` to both the
   furniture control and the space control, so "The records office" and
   "The space left for the machine" read identically side by side.

   It matters on this stage more than most: `brief` is where "no room
   behind the counter" is supposed to be a MEASUREMENT rather than an
   opinion, and the control carrying the measurement was describing the
   filing cabinets instead. Held at load, because a duplicated string is
   invisible in the source and obvious only once two controls sit next to
   each other on screen. */
SITES.forEach(function (t) {
  if (!t.room) throw new Error("bench-office: " + t.key + " has no `room` — what is already " +
    "on the surface is half of what this stage asks the student to weigh up.");
  if (!t.gap) throw new Error("bench-office: " + t.key + " has no `gap`.");
  if (t.room === t.gap) throw new Error("bench-office: " + t.key + " gives the same sentence " +
    "for the room and for the space left in it. They are different facts and the stage " +
    "prints them on different controls.");
});

export function siteBench(view) {
  view = view || {};
  const P = PLACES[view.place] || PLACES.office;
  const parts = [];

  parts.push({ key: "room", label: "The room itself",
    build: room(30, 22), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#39424c",
    spec: "Floor and wall, to scale with everything on them.", note: "" });

  parts.push({ key: "furniture", label: P.name,
    build: P.furniture(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#4a5560",
    spec: P.gap, note: "" });

  parts.push({ key: "power", label: "Twin power socket",
    build: socket(-4.0, 1.2).map(function (o) {
      return Object.assign({}, o, { pos: [o.pos[0], o.pos[1], o.pos[2] - 10.7] });
    }),
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#cdd3d8",
    spec: "Where the machine can be plugged in. Everything has to reach it.", note: "" });

  if (P.lan) {
    parts.push({ key: "lan", label: "Network outlet on the wall",
      build: dataPoint(1.0, 1.2).map(function (o) {
        return Object.assign({}, o, { pos: [o.pos[0], o.pos[1], o.pos[2] - 10.7] });
      }),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#7fb5c8",
      spec: "There is a data point here, so a wired network printer is possible.", note: "" });
  }

  /* The clear space, called out as its own part in its own colour,
     because on three of these five sites it is the constraint that
     decides the whole job. */
  parts.push({ key: "space", label: "The space left for the machine",
    build: [{ shape: "box", size: [7.4, 0.1, 6.0], pos: [6.4, 0.35, 0.8], r: 0.03, shade: 1.0 }],
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: P.gap, note: "" });

  return {
    kind: "bench",
    title: P.name,
    caption: "The room the machine has to live in, before anybody has chosen one. Look at what " +
      "is already on the surface, how much is left, whether there is a data point on the wall, " +
      "and who is standing on the other side of it.",
    board: null,
    decor: [],
    parts: parts,
    /* fitWidth 50, WAS 42, AND IT FAILED IN THE MIDDLE RATHER THAN AT THE
       NARROW END — which is why sweeping only the narrowest width missed
       it. At 319 and 480 the fit backs the camera off far enough; at 889
       the canvas is wide enough that plain `dist` already shows the room.
       At 697 neither saves it: the fit works out at 40.25 against a dist
       of 40, so the camera barely moves, and the aspect is still too
       narrow. A bench can clip at a width with clean widths on BOTH sides
       of it, so sweep the whole set. */
    camera: { dist: 40, fitWidth: 50, yaw: 0.28, pitch: 0.42, target: [0, -0.6, -1.0],
      min: 16, max: 110 }
  };
}

/* ---------------------------------------------------------------------
   REAR — what the deployment order is actually about.
   --------------------------------------------------------------------- */
export function rearBench(view) {
  view = view || {};
  const parts = [];

  parts.push({ key: "body", label: "The back of the printer",
    build: [
      { shape: "rbox", size: [16.0, 11.0, 3.0], pos: [-5.0, 1.0, 0], r: 0.5, shade: 1.0 },
      /* the recessed panel the sockets sit in */
      { shape: "rbox", size: [9.0, 4.6, 0.6], pos: [-5.0, -0.6, 1.7], r: 0.2, shade: 0.78 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39424c",
    spec: "Three sockets on it, and only one of them carries the job.", note: "" });

  parts.push({ key: "usb", label: "USB-B socket",
    build: [
      { shape: "rbox", size: [2.2, 1.9, 0.9], pos: [-8.4, -0.6, 2.1], r: 0.15, shade: 1.0 },
      { shape: "box", size: [1.5, 1.0, 0.5], pos: [-8.4, -0.6, 2.4], r: 0.04, shade: 0.42 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#b6b1a4",
    spec: "One machine, one desk, one cable. No queue, no sharing, nobody else can print to it.",
    note: "" });

  parts.push({ key: "rj45", label: "Ethernet socket",
    build: [
      { shape: "rbox", size: [2.2, 2.0, 1.0], pos: [-5.0, -0.6, 2.1], r: 0.12, shade: 1.0 },
      { shape: "box", size: [1.3, 1.1, 0.55], pos: [-5.0, -0.7, 2.4], r: 0.04, shade: 0.42 },
      /* the two link lamps, which are the first thing to look at */
      { shape: "cyl", size: [0.22, 0.2], pos: [-5.9, 0.5, 2.5], rot: [P2, 0, 0], seg: 10,
        shade: 1.9 },
      { shape: "cyl", size: [0.22, 0.2], pos: [-4.1, 0.5, 2.5], rot: [P2, 0, 0], seg: 10,
        shade: 1.9 }
    ],
    finish: "metal", scale: 1, pos: [0, 0, 0], color: "#7fb5c8",
    spec: "This is the one everybody on the site prints through. The two lamps beside it say " +
      "whether it has a link before you go looking at addresses.", note: "" });

  parts.push({ key: "iec", label: "Mains inlet",
    build: [
      { shape: "rbox", size: [2.6, 2.2, 1.0], pos: [-1.4, -0.6, 2.1], r: 0.1, shade: 1.0 },
      { shape: "box", size: [1.8, 1.3, 0.5], pos: [-1.4, -0.6, 2.4], r: 0.06, shade: 0.4 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#2b3138",
    spec: "Power. Worth naming because it is the one that does not go to the network, and it is " +
      "the one people check last.", note: "" });

  parts.push({ key: "wall", label: "The wall data point",
    build: [
      { shape: "rbox", size: [3.0, 3.0, 0.5], pos: [12.0, -1.4, -1.6], r: 0.12, shade: 1.0 },
      { shape: "rbox", size: [1.4, 1.6, 0.35], pos: [12.0, -1.6, -1.3], r: 0.06, shade: 0.45 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#cdd3d8",
    spec: "Where the run to the switch comes out. The other end of it is in a patch panel " +
      "somewhere you cannot see from here.", note: "" });

  parts.push({ key: "patch", label: "The patch lead",
    build: (function () {
      /* ROUTED IN RIGHT ANGLES, so every segment needs ONE rotation.

         Two goes at this failed the same way. A cylinder's default axis
         is +y, and aiming it along an arbitrary direction takes two
         Euler angles composed in the order the engine happens to apply
         them — which I guessed at twice, and got a handful of green
         sticks lying at random angles both times.

         An axis-aligned route needs no guessing, and both rotations are
         checkable on paper:
           rot [0, 0, P2] turns +y to -x   (a run across the bench)
           rot [P2, 0, 0] turns +y to +z   (a run towards the front)
         A lead dressed in right angles along the back of a bench is
         also what a tidy installation looks like. */
      const Y = -4.05;
      return [
        /* out of the socket and across the bench */
        { shape: "cyl", size: [0.26, 13.4], pos: [5.6, Y, 2.2], rot: [0, 0, P2], seg: 10,
          shade: 1.0 },
        /* the corner, so the two runs meet in something rather than a gap */
        { shape: "cyl", size: [0.3, 0.5], pos: [12.0, Y, 2.2], seg: 10, shade: 1.0 },
        /* back towards the wall */
        { shape: "cyl", size: [0.26, 4.0], pos: [12.0, Y, 0.3], rot: [P2, 0, 0], seg: 10,
          shade: 1.0 },
        /* and up to the plate */
        { shape: "cyl", size: [0.26, 3.4], pos: [12.0, Y + 1.6, -1.5], seg: 10, shade: 1.0 }
      ];
    })(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: "Printer to wall. Everything else in the deployment happens after this exists.",
    note: "" });

  return {
    kind: "bench",
    title: "The back of it, and the wall behind",
    caption: "Three sockets on the machine and one plate on the wall. The order you do things " +
      "in follows from what is physically connected to what \\u2014 so look at it before you " +
      "decide what comes first.",
    board: {
      size: [40, 0.5, 20], pos: [0, -4.6, 0], color: "#2a323b",
      build: [{ shape: "rbox", size: [40, 0.5, 20], pos: [0, 0, 0], r: 0.15, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    camera: { dist: 30, fitWidth: 46, yaw: 0.30, pitch: 0.36, target: [1.0, -0.4, 0.4],
      min: 12, max: 90 }
  };
}

/* ---------------------------------------------------------------------
   VOLUME — what a duty cycle looks like as paper.
   --------------------------------------------------------------------- */
const REAM = 500;               /* sheets in a ream */
const REAM_H = 1.15;            /* how tall one is on this bench */
const PER_STACK = 10;           /* reams before a new column is started */

/* A pile of reams at (x, z), as many as the count needs. Capped so a
   very large rating does not walk off the board — and when it is capped
   the caption says so rather than quietly lying about the scale. */
function reams(x, z, n, cap) {
  const out = [];
  const shown = Math.min(n, cap);
  for (let i = 0; i < shown; i++) {
    const col = Math.floor(i / PER_STACK);
    const row = i % PER_STACK;
    out.push({ shape: "rbox", size: [5.2, REAM_H * 0.86, 3.6],
      pos: [x + col * 6.0, -3.2 + row * REAM_H, z + (i % 2) * 0.12],
      r: 0.06, shade: 1.0 });
  }
  return out;
}

export function volumeBench(view) {
  view = view || {};
  const monthly = Math.max(0, view.monthly || 0);
  const rated = Math.max(0, view.rated || 0);
  const CAP = 30;
  const mReams = Math.round(monthly / REAM);
  const rReams = Math.round(rated / REAM);

  const parts = [];

  parts.push({ key: "theirs", label: "What they print in a month",
    build: reams(-13.0, 0, mReams, CAP),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#8a6a1f",
    spec: monthly.toLocaleString() + " pages \\u2014 " + mReams + " reams of paper, every month.",
    note: "" });

  parts.push({ key: "rated", label: "What the machine is rated for",
    build: reams(6.0, 0, rReams, CAP),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: rated.toLocaleString() + " pages a month is the CEILING, not the target \\u2014 the " +
      "most it can do without damage.",
    note: "" });

  /* A single ream, on its own, as the unit everything else is counted
     in. Without it the two piles are just two piles. */
  parts.push({ key: "one", label: "One ream — 500 sheets",
    build: [{ shape: "rbox", size: [5.2, REAM_H * 0.86, 3.6], pos: [-21.0, -3.2, 7.0],
      r: 0.06, shade: 1.0 }],
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#c9c5b8",
    spec: "The unit. Every block in both piles is one of these.", note: "" });

  return {
    kind: "bench",
    title: "The same two numbers, as paper",
    caption: "A duty cycle is a figure nobody has a feel for. Left is what they told you they " +
      "print in a month; right is what this machine is rated to survive. Both piles are counted " +
      "in reams of 500 sheets" +
      (mReams > CAP || rReams > CAP
        ? ", and at least one of them is taller than the board \\u2014 the numbers under it are " +
          "the real ones."
        : ".") +
      " Nothing here does the arithmetic for you.",
    board: {
      size: [56, 0.5, 22], pos: [0, -3.9, 0], color: "#2a323b",
      build: [{ shape: "rbox", size: [56, 0.5, 22], pos: [0, 0, 0], r: 0.15, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    camera: { dist: 42, fitWidth: 64, yaw: 0.16, pitch: 0.30, target: [-3.0, 0.6, 1.0],
      min: 16, max: 130 }
  };
}

/* =====================================================================
   THE LAST THREE. consum, scanflow and fleet were the only stages left
   with nothing to look at.
   ===================================================================== */

/* ---------------------------------------------------------------------
   KIT — what is actually in a maintenance kit, and what is not.

   The consumables stage is two sums about toner. The thing students get
   wrong here is not the arithmetic, it is the CATEGORY: they think a
   maintenance kit is more toner. It is not. It is the wearing parts —
   a fuser, a transfer roller, feed rollers, a separation pad — and it
   is fitted on a page count, not when the print goes pale.

   So the box is drawn open with its contents laid out, and the toner
   and drum sit OUTSIDE it, because that is the distinction. Nothing
   here does either sum.
   --------------------------------------------------------------------- */
export function kitBench(view) {
  view = view || {};
  const parts = [];

  parts.push({ key: "box", label: "The maintenance kit, opened",
    build: [
      { shape: "rbox", size: [26.0, 0.6, 15.0], pos: [-4.0, -3.0, 0], r: 0.2, shade: 1.0 },
      /* four walls, low enough to see in */
      { shape: "box", size: [26.0, 3.2, 0.5], pos: [-4.0, -1.4, -7.4], r: 0.05, shade: 1.18 },
      { shape: "box", size: [26.0, 1.4, 0.5], pos: [-4.0, -2.3, 7.4], r: 0.05, shade: 1.18 },
      { shape: "box", size: [0.5, 3.2, 15.0], pos: [-17.0, -1.4, 0], r: 0.05, shade: 1.18 },
      { shape: "box", size: [0.5, 3.2, 15.0], pos: [9.0, -1.4, 0], r: 0.05, shade: 1.18 }
    ],
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#6b6152",
    spec: "One box, fitted on a page count rather than when something goes wrong.", note: "" });

  parts.push({ key: "fuser", label: "Fuser assembly",
    build: [
      { shape: "rbox", size: [11.0, 3.4, 4.4], pos: [-11.0, -1.0, -2.4], r: 0.3, shade: 1.0 },
      { shape: "cyl", size: [1.5, 9.6], pos: [-11.0, -0.2, -2.4], rot: [0, 0, P2], seg: 20,
        shade: 1.3 },
      { shape: "cyl", size: [1.1, 9.6], pos: [-11.0, -2.0, -2.4], rot: [0, 0, P2], seg: 18,
        shade: 0.72 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#4a5560",
    spec: "The biggest thing in the box, and the reason the kit exists. It runs hot and it wears " +
      "out on a schedule.", note: "" });

  parts.push({ key: "transfer", label: "Transfer roller",
    build: [
      { shape: "cyl", size: [1.5, 11.0], pos: [-11.0, -2.0, 3.4], rot: [0, 0, P2], seg: 20,
        shade: 1.0 },
      { shape: "cyl", size: [0.5, 13.0], pos: [-11.0, -2.0, 3.4], rot: [0, 0, P2], seg: 12,
        shade: 0.6 }
    ],
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: "Pulls the toner off the drum and onto the paper. Fitted with the kit because it ages " +
      "at the same rate as the fuser.", note: "" });

  parts.push({ key: "rollers", label: "Feed and pickup rollers",
    build: (function () {
      const out = [];
      [0, 1, 2].forEach(function (i) {
        out.push({ shape: "cyl", size: [1.5, 3.4], pos: [2.0 + i * 4.0, -1.8, -3.0],
          rot: [0, 0, P2], seg: 18, shade: 1.0 });
        out.push({ shape: "cyl", size: [0.45, 4.6], pos: [2.0 + i * 4.0, -1.8, -3.0],
          rot: [0, 0, P2], seg: 10, shade: 0.62 });
      });
      return out;
    })(),
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#3a4046",
    spec: "The parts that stop it picking paper. These are what the kit is really for, and the " +
      "ones people replace one at a time instead.", note: "" });

  parts.push({ key: "pad", label: "Separation pad",
    build: [
      { shape: "rbox", size: [5.0, 0.9, 4.0], pos: [4.0, -2.2, 3.6], r: 0.15, shade: 1.0 },
      { shape: "box", size: [3.6, 0.34, 2.8], pos: [4.0, -1.6, 3.6], r: 0.05, shade: 1.4 }
    ],
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#414a53",
    spec: "Holds the second sheet back. In the kit because it wears at the same page count as " +
      "the rollers it works against.", note: "" });

  /* OUTSIDE THE BOX, and that is the whole point of the picture. */
  parts.push({ key: "toner", label: "Toner cartridge \\u2014 NOT in the kit",
    build: [
      { shape: "rbox", size: [12.0, 4.6, 5.0], pos: [22.0, -0.9, -3.0], r: 0.5, shade: 1.0 },
      { shape: "cyl", size: [1.0, 10.0], pos: [22.0, -2.6, -1.2], rot: [0, 0, P2], seg: 16,
        shade: 1.35 },
      { shape: "box", size: [3.4, 1.0, 1.0], pos: [27.0, 1.0, -3.0], r: 0.2, shade: 1.25 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#8a6a1f",
    spec: "A CONSUMABLE, not a wearing part. It runs out on a page count of its own and gets " +
      "changed when the print goes pale \\u2014 nothing to do with the kit.", note: "" });

  parts.push({ key: "drum", label: "Drum unit \\u2014 NOT in the kit either",
    build: [
      { shape: "rbox", size: [12.0, 4.0, 5.0], pos: [22.0, -1.2, 4.4], r: 0.4, shade: 1.0 },
      { shape: "cyl", size: [1.8, 10.4], pos: [22.0, -2.4, 5.6], rot: [0, 0, P2], seg: 22,
        shade: 1.0 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#1f8f7a",
    spec: "Its own part with its own life, several times longer than a toner and shorter than " +
      "the machine. Three different schedules, three different parts.", note: "" });

  return {
    kind: "bench",
    title: "What is in the box, and what is not",
    caption: "The maintenance kit is the WEARING parts \\u2014 fuser, transfer roller, feed " +
      "rollers, separation pad \\u2014 fitted on a page count. The toner and the drum sit " +
      "outside it because they are not in it: three different parts on three different " +
      "schedules, and the commonest mistake on this stage is treating them as one.",
    board: {
      size: [66, 0.5, 24], pos: [0, -3.6, 0], color: "#2a323b",
      build: [{ shape: "rbox", size: [66, 0.5, 24], pos: [0, 0, 0], r: 0.15, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    camera: { dist: 44, fitWidth: 78, yaw: 0.18, pitch: 0.44, target: [2.0, -0.6, 0.4],
      min: 16, max: 130 }
  };
}

/* ---------------------------------------------------------------------
   MFP — the machine the scan-to-folder and secure-release stage is about.

   It shows the PROBLEM, not the answer: a finished job lying face up in
   the output tray with nobody standing at the machine. That is the whole
   scenario, and it is the thing the question asks you to stop. What the
   student must not be shown is the fix.
   --------------------------------------------------------------------- */
/* The finished job, lying in the output tray. Drawn at z 1.4 it was
   inside the document feeder's own volume above it \u2014 the feeder
   spans y 4.3 to 6.5 and z -7 to 5, and the job sat at y 4.5, z 1.4,
   which is squarely inside that box. It sits forward now, in the open
   front of the recess, where a finished job actually lands. */
function mfpJob() {
  return [
    { shape: "box", size: [10.0, 0.16, 6.4], pos: [-0.4, 4.6, 3.8], r: 0.02, shade: 1.0,
      repeat: { count: 5, step: [0.05, 0.18, 0.05] } }
  ];
}

export function mfpBench(view) {
  view = view || {};
  const parts = [];

  parts.push({ key: "body", label: "The multifunction printer",
    build: [
      { shape: "rbox", size: [18.0, 9.0, 15.0], pos: [0, -0.5, 0], r: 0.6, shade: 1.0 },
      /* the output recess, where finished work lands */
      { shape: "rbox", size: [13.0, 1.4, 9.0], pos: [0, 3.6, 1.6], r: 0.3, shade: 0.72 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#39424c",
    spec: "One machine, shared by the floor.", note: "" });

  parts.push({ key: "adf", label: "The document feeder",
    build: [
      { shape: "rbox", size: [17.0, 2.2, 11.0], pos: [0, 6.4, -3.6], r: 0.35, shade: 1.0 },
      /* the input tray, with an original still in it */
      { shape: "box", size: [11.0, 0.4, 6.0], pos: [0, 8.0, -6.4], rot: [-0.18, 0, 0],
        r: 0.05, shade: 1.35 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#4a5560",
    spec: "Scan to folder and scan to email both start here. Neither of them is what puts paper " +
      "in the tray.", note: "" });

  parts.push({ key: "panel", label: "The control panel",
    build: [
      { shape: "rbox", size: [7.6, 0.6, 5.0], pos: [7.0, 6.2, 3.6], rot: [-0.6, 0, 0], r: 0.2,
        shade: 1.0 },
      { shape: "box", size: [5.6, 0.2, 3.0], pos: [7.0, 6.6, 3.9], rot: [-0.6, 0, 0], r: 0.05,
        shade: 1.6 }
    ],
    finish: "glass", scale: 1, pos: [0, 0, 0], color: "#2b3138",
    spec: "Where somebody would have to stand and identify themselves, if anything required " +
      "them to.", note: "" });

  /* THE PROBLEM ITSELF. Not the fix.
     Its own builder so the visibility instrument can stub it and measure
     it \u2014 a part buried inside another part is this build's most
     repeated bug, and "the bench renders" says nothing about whether one
     part in it does. */
  parts.push({ key: "job", label: "Somebody's job, printed, in the tray",
    build: mfpJob(),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#c9c5b8",
    spec: "Face up, finished, and nobody standing here. It was printed the moment it was sent.",
    note: "" });

  parts.push({ key: "net", label: "The network connection",
    build: [
      { shape: "cyl", size: [0.26, 12.0], pos: [-6.0, -4.6, 9.0], rot: [0, 0, P2], seg: 10,
        shade: 1.0 },
      { shape: "cyl", size: [0.26, 5.0], pos: [-12.0, -4.6, 6.4], rot: [P2, 0, 0], seg: 10,
        shade: 1.0 }
    ],
    finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: "Everybody on the floor sends work down this. The job arrives whether or not the " +
      "sender does.", note: "" });

  return {
    kind: "bench",
    title: "The machine, and what is lying in its tray",
    caption: "A shared multifunction on an open floor. There is a finished job in the output " +
      "tray and nobody standing at the machine \\u2014 it printed the moment it was sent. That " +
      "is the problem in front of you, drawn as it actually happens.",
    board: {
      size: [42, 0.5, 30], pos: [0, -5.4, 0], color: "#2a323b",
      build: [{ shape: "rbox", size: [42, 0.5, 30], pos: [0, 0, 0], r: 0.15, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    camera: { dist: 36, fitWidth: 48, yaw: 0.34, pitch: 0.42, target: [0, 1.0, 0.5],
      min: 14, max: 110 }
  };
}

/* ---------------------------------------------------------------------
   FLOOR — the department the fleet has to serve, in plan.

   A plan view, for the reason the WAP bench is one: from the side a
   floor is a wall. From above it is a map, and what matters here is
   distance and grouping — who walks how far, and which desks cluster.

   IT DOES NOT SHOW THE ANSWER. The question is how many machines the
   department needs, so the machines are NOT drawn. What is drawn is the
   demand: the desks, in their groups, and the one machine they have
   now. Counting desks is not the sum, and the sum is not on the board.
   --------------------------------------------------------------------- */
export function floorBench(view) {
  view = view || {};
  const groups = [
    { key: "g1", name: "Claims", at: [-15, -7], n: 8 },
    { key: "g2", name: "Underwriting", at: [3, -7], n: 6 },
    { key: "g3", name: "Accounts", at: [-15, 7], n: 5 },
    { key: "g4", name: "Reception and post", at: [3, 7], n: 3 }
  ];
  const parts = [];

  parts.push({ key: "floor", label: "The floor",
    build: [
      { shape: "rbox", size: [46, 0.4, 30], pos: [0, -3.6, 0], r: 0.2, shade: 1.0 },
      /* the corridor, which is what everybody walks down */
      { shape: "box", size: [46, 0.12, 3.2], pos: [0, -3.34, 0], r: 0.02, shade: 1.22 }
    ],
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#39424c",
    spec: "One floor, one corridor down the middle of it.", note: "" });

  groups.forEach(function (g) {
    parts.push({ key: g.key, label: g.name + " \\u2014 " + g.n + " desks",
      build: (function () {
        const out = [];
        for (let i = 0; i < g.n; i++) {
          const cx = g.at[0] + (i % 4) * 3.4;
          const cz = g.at[1] + Math.floor(i / 4) * 3.0;
          out.push({ shape: "rbox", size: [2.6, 0.5, 2.0], pos: [cx, -3.1, cz], r: 0.1,
            shade: 1.0 });
          /* a monitor on each, so a desk reads as a desk from above */
          out.push({ shape: "box", size: [1.6, 0.9, 0.2], pos: [cx, -2.5, cz - 0.8], r: 0.05,
            shade: 1.35 });
        }
        return out;
      })(),
      finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: g.key === "g1" ? "#4a5560" : g.key === "g2" ? "#3f4a56"
           : g.key === "g3" ? "#454f5a" : "#3a444f",
      spec: g.n + " desks. Their work has to reach a machine somebody is willing to walk to.",
      note: "" });
  });

  parts.push({ key: "current", label: "The one machine they have now",
    build: [
      { shape: "rbox", size: [4.6, 3.4, 4.0], pos: [17.0, -1.9, 0], r: 0.3, shade: 1.0 },
      { shape: "box", size: [3.4, 0.2, 2.4], pos: [17.0, -0.1, 0.4], r: 0.03, shade: 1.6 }
    ],
    finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#8a6a1f",
    spec: "One machine, at the end of the corridor, serving all of it. Whether that is enough " +
      "is the arithmetic \\u2014 and the walk is why nobody uses it for one page.", note: "" });

  return {
    kind: "bench",
    title: "The department, from above",
    caption: "Plan view, because what matters here is distance and grouping. Four teams, their " +
      "desks, and the single machine they have at the end of the corridor. How many machines " +
      "the department needs is the question \\u2014 so the rest of them are not drawn.",
    board: null,
    decor: [],
    parts: parts,
    camera: { dist: 46, fitWidth: 56, yaw: 0.04, pitch: 1.02, target: [0, -2.4, 0],
      min: 18, max: 130 }
  };
}
