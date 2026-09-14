/* =====================================================================
   A+ Core1 Under the Hood Labs — the workstation bench

   A motherboard flat on an anti-static mat, seen from above and slightly
   in front, which is how you actually work on one.

   Same two rules as the storage bench, and they are not negotiable:

     1. The canvas is scenery. Every socket here is a labelled, focusable
        HTML button first; turn WebGL off and the build still works.
     2. One colour per part, so anything that changes colour on its own
        has to BE its own part. On the storage bench that lesson cost two
        renders — a row of caddies painted like a child's abacus, and a
        power button that turned red when a disk died. The sockets here
        are steel whatever is in them; the FITTED COMPONENT carries the
        colour, and the little status pip beside each socket carries the
        verdict.

   ---------------------------------------------------------------------
   WHY A BOARD RATHER THAN A CASE

   The interesting decisions in a build are all on the board: does this
   CPU go in this socket, is the RAM in the right pair of slots, is there
   an EPS connector plugged in at all. A case hides every one of them.

   The two faults that are NOT on the board — a GPU too long for the
   case, a cooler too tall for the side panel — are tape-measure problems
   rather than electrical ones, so they get drawn as a clearance outline
   around the part rather than as a socket that refuses it. A student has
   to see the part fouling something, because "it does not fit" is a
   sentence and a bowed side panel is a memory.
   ===================================================================== */

const P2 = Math.PI / 2;

/* Board footprint. ATX is 305 x 244mm; this is that shape, scaled so one
   unit is roughly 25mm, which keeps every number below readable. */
const BW = 12.2;
const BD = 9.8;
const BT = 0.22;          /* substrate thickness */
const TOP = BT / 2;       /* the plane components stand on */

/* Where things live on the board, in board coordinates. */
export const SITES = {
  cpu:    { x: -1.4, z: -1.9, label: "CPU socket" },
  cooler: { x: -1.4, z: -1.9, label: "CPU cooler" },
  ram:    { x:  2.2, z: -1.9, label: "Memory slots" },
  gpu:    { x: -1.0, z:  1.5, label: "Primary PCIe x16 slot" },
  psu24:  { x:  5.1, z: -0.4, label: "24-pin power" },
  eps:    { x: -1.4, z: -4.1, label: "EPS 8-pin CPU power" },
  m2:     { x: -1.0, z:  0.2, label: "M.2 slot" }
};

/* ---------------------------------------------------------------------
   Verdicts. A socket is not "wrong" or "right" — it is one of these, and
   each one has a colour, a brightness and a WORD. The word is what the
   button beside the canvas says, and it is never optional.
   --------------------------------------------------------------------- */
const VERDICT = {
  empty:   { color: "#39404a", glow: 0.00, says: "Nothing fitted" },
  ok:      { color: "#2fd45e", glow: 0.85, says: "Fitted and correct" },
  seated:  { color: "#3d8bff", glow: 0.80, says: "Fitted" },
  warn:    { color: "#ffd426", glow: 1.20, says: "Fitted, but not the best it could be" },
  refused: { color: "#ff3b30", glow: 1.60, says: "Will not fit" },
  foul:    { color: "#ffa524", glow: 1.45, says: "Fits electrically, fouls the case" }
};

export function verdictWords(v) { return (VERDICT[v] || VERDICT.empty).says; }
export const VERDICTS = Object.keys(VERDICT);

/* ---------- the board itself ---------- */

function boardBuild() {
  const out = [
    /* substrate */
    { shape: "rbox", size: [BW, BT, BD], pos: [0, 0, 0], r: 0.04, shade: 1.0 },
    /* the I/O shield shroud along the back edge */
    { shape: "rbox", size: [3.4, 0.9, 0.5], pos: [-3.9, TOP + 0.45, -BD / 2 + 0.35], r: 0.06, shade: 0.62 },
    /* VRM heatsinks either side of the socket — the thing that gets hot */
    { shape: "box", size: [0.16, 0.55, 2.3], pos: [-3.35, TOP + 0.28, -2.0], r: 0.02, shade: 0.70,
      repeat: { count: 9, step: [0.19, 0, 0] } },
    /* chipset heatsink */
    { shape: "rbox", size: [1.5, 0.26, 1.5], pos: [1.5, TOP + 0.13, 2.4], r: 0.05, shade: 0.66 },
    /* nine mounting holes */
    { shape: "cyl", size: [0.24, BT + 0.06], pos: [-5.4, 0, -4.1], rot: [0, 0, 0], seg: 12, shade: 0.34,
      repeat: { count: 3, step: [5.4, 0, 0] } },
    { shape: "cyl", size: [0.24, BT + 0.06], pos: [-5.4, 0, 0], rot: [0, 0, 0], seg: 12, shade: 0.34,
      repeat: { count: 3, step: [5.4, 0, 0] } },
    { shape: "cyl", size: [0.24, BT + 0.06], pos: [-5.4, 0, 4.1], rot: [0, 0, 0], seg: 12, shade: 0.34,
      repeat: { count: 3, step: [5.4, 0, 0] } },
    /* SATA ports on the front edge, stacked */
    { shape: "box", size: [0.55, 0.3, 0.22], pos: [5.3, TOP + 0.15, 2.1], r: 0.02, shade: 0.5,
      repeat: { count: 4, step: [0, 0, 0.42] } },
    /* front-panel header pins */
    { shape: "box", size: [0.9, 0.22, 0.22], pos: [3.4, TOP + 0.11, 4.3], r: 0.01, shade: 0.42 },

    /* ---- density, from the owner's board photograph ----
       The photograph is an older board than this lab teaches — five PCI
       slots, three DIMMs, a socket 370 — so its LAYOUT is not copied:
       putting DDR5 and an M.2 on a board with PCI slots would contradict
       the content. What it corrects is how much is ON a motherboard.
       Mine had eleven features on it and looked like a floor plan. */

    /* THE COIN CELL. Every board has one, every student has to find one,
       and it is the answer to "the clock resets every time". */
    { shape: "cyl", size: [1.0, 0.16], pos: [3.0, TOP + 0.08, 3.2], seg: 24, shade: 0.9 },
    { shape: "box", size: [1.15, 0.1, 0.22], pos: [3.0, TOP + 0.05, 2.62], r: 0.02, shade: 0.55 },

    /* TWO x1 SLOTS below the x16, which is what a board's expansion row
       actually looks like — the photograph has six slots in a column and
       mine had one and a stub. */
    { shape: "box", size: [1.1, 0.24, 0.32], pos: [-2.0, TOP + 0.12, 3.0], r: 0.02, shade: 0.48 },
    { shape: "box", size: [1.1, 0.24, 0.32], pos: [-2.0, TOP + 0.12, 3.9], r: 0.02, shade: 0.48 },

    /* ELECTROLYTICS around the socket and along the bottom edge. A board
       with no capacitors on it is a diagram; a board covered in them is a
       board — and a bulged one is a fault a technician is taught to spot. */
    { shape: "cyl", size: [0.46, 0.6], pos: [0.4, TOP + 0.3, -3.4], seg: 14, shade: 0.62,
      repeat: { count: 4, step: [0.62, 0, 0] } },
    { shape: "cyl", size: [0.4, 0.5], pos: [4.2, TOP + 0.25, -2.6], seg: 14, shade: 0.62,
      repeat: { count: 3, step: [0, 0, 0.6] } },
    { shape: "cyl", size: [0.38, 0.45], pos: [-4.6, TOP + 0.22, 2.4], seg: 14, shade: 0.62,
      repeat: { count: 3, step: [0.55, 0, 0] } },

    /* THE VRM CHOKES between the socket and the back edge — the square
       blocks the photograph shows in a row, and where the CPU's power
       actually gets made. */
    { shape: "box", size: [0.42, 0.3, 0.42], pos: [-2.6, TOP + 0.15, -3.6], r: 0.03, shade: 0.7,
      repeat: { count: 6, step: [0.55, 0, 0] } },

    /* THE I/O CLUSTER at the back edge: stacked USB, network and audio,
       drawn as blocks of the right sizes rather than left as a shroud. */
    { shape: "box", size: [0.9, 0.5, 0.34], pos: [-5.0, TOP + 0.55, -4.62], r: 0.03, shade: 0.34 },
    { shape: "box", size: [0.9, 0.5, 0.34], pos: [-5.0, TOP + 1.05, -4.62], r: 0.03, shade: 0.34 },
    { shape: "box", size: [1.05, 0.62, 0.34], pos: [-3.8, TOP + 0.62, -4.62], r: 0.03, shade: 0.3 },
    { shape: "cyl", size: [0.3, 0.28], pos: [-2.9, TOP + 0.5, -4.62], rot: [P2, 0, 0], seg: 12, shade: 0.5,
      repeat: { count: 3, step: [0.38, 0, 0] } },

    /* THE CHIPSET, and a screw through its heatsink */
    { shape: "cyl", size: [0.22, 0.3], pos: [1.5, TOP + 0.3, 2.4], seg: 10, shade: 0.4 },

    /* FAN HEADERS — four-pin blocks scattered where they really are */
    { shape: "box", size: [0.42, 0.26, 0.2], pos: [-1.4, TOP + 0.13, -4.55], r: 0.02, shade: 0.55 },
    { shape: "box", size: [0.42, 0.26, 0.2], pos: [5.4, TOP + 0.13, -3.6], r: 0.02, shade: 0.55 },
    { shape: "box", size: [0.42, 0.26, 0.2], pos: [5.4, TOP + 0.13, 3.6], r: 0.02, shade: 0.55 }
  ];
  return out;
}

/* ---------- sockets, empty ---------- */

function socketCPU() {
  const s = SITES.cpu;
  return [
    /* the retention frame */
    { shape: "box", size: [2.1, 0.10, 0.22], pos: [s.x, TOP + 0.05, s.z - 0.95], r: 0.01, shade: 0.55 },
    { shape: "box", size: [2.1, 0.10, 0.22], pos: [s.x, TOP + 0.05, s.z + 0.95], r: 0.01, shade: 0.55 },
    { shape: "box", size: [0.22, 0.10, 2.1], pos: [s.x - 0.95, TOP + 0.05, s.z], r: 0.01, shade: 0.55 },
    { shape: "box", size: [0.22, 0.10, 2.1], pos: [s.x + 0.95, TOP + 0.05, s.z], r: 0.01, shade: 0.55 },
    /* the land grid inside it */
    { shape: "box", size: [1.7, 0.05, 1.7], pos: [s.x, TOP + 0.03, s.z], r: 0.01, shade: 0.30 },
    /* the load lever */
    { shape: "cyl", size: [0.09, 1.5], pos: [s.x + 1.15, TOP + 0.09, s.z], rot: [0, 0, P2], seg: 8, shade: 0.62 }
  ];
}

function socketRAM(slots) {
  const s = SITES.ram;
  const n = Math.max(2, Math.min(4, slots || 4));
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = s.x + i * 0.52;
    out.push({ shape: "box", size: [0.3, 0.24, 5.0], pos: [x, TOP + 0.12, s.z + 0.6], r: 0.02,
      /* Channel A and channel B are different tones. The pairing is the
         lesson in this socket and it is invisible if every slot looks
         the same — which is precisely how students end up with both
         sticks in one channel. */
      shade: (i % 2 === 0) ? 0.52 : 0.80 });
    /* the retention clips at each end */
    out.push({ shape: "box", size: [0.34, 0.30, 0.24], pos: [x, TOP + 0.26, s.z - 1.85], r: 0.02, shade: 0.7 });
    out.push({ shape: "box", size: [0.34, 0.30, 0.24], pos: [x, TOP + 0.26, s.z + 3.05], r: 0.02, shade: 0.7 });
  }
  return out;
}

function socketPCIe() {
  const s = SITES.gpu;
  return [
    { shape: "box", size: [4.2, 0.26, 0.36], pos: [s.x, TOP + 0.13, s.z], r: 0.02, shade: 0.48 },
    /* the retention tab at the far end */
    { shape: "box", size: [0.3, 0.34, 0.4], pos: [s.x + 2.25, TOP + 0.17, s.z], r: 0.02, shade: 0.66 },
    /* a shorter x1 slot behind it, for scale and for realism */
    { shape: "box", size: [1.1, 0.24, 0.32], pos: [s.x - 1.0, TOP + 0.12, s.z + 1.5], r: 0.02, shade: 0.48 }
  ];
}

function socketM2() {
  const s = SITES.m2;
  return [
    { shape: "box", size: [2.6, 0.10, 0.3], pos: [s.x, TOP + 0.05, s.z], r: 0.01, shade: 0.44 },
    { shape: "cyl", size: [0.22, 0.14], pos: [s.x + 1.4, TOP + 0.07, s.z], seg: 10, shade: 0.6 }
  ];
}

function header(site, w, d) {
  return [
    { shape: "box", size: [w, 0.34, d], pos: [site.x, TOP + 0.17, site.z], r: 0.02, shade: 0.42 },
    /* the pins inside */
    { shape: "box", size: [w - 0.16, 0.16, d - 0.14], pos: [site.x, TOP + 0.10, site.z], r: 0.01, shade: 0.86 }
  ];
}

/* ---------- fitted components ---------- */

function cpuChip() {
  const s = SITES.cpu;
  return [
    { shape: "rbox", size: [1.62, 0.10, 1.62], pos: [s.x, TOP + 0.10, s.z], r: 0.02, shade: 0.92 },
    /* the IHS standing proud of the substrate */
    { shape: "rbox", size: [1.30, 0.09, 1.30], pos: [s.x, TOP + 0.19, s.z], r: 0.04, shade: 1.15 },
    /* the orientation notch — the thing you line up, and the thing
       students force when it will not go */
    { shape: "box", size: [0.16, 0.12, 0.16], pos: [s.x - 0.72, TOP + 0.12, s.z - 0.72], r: 0.01, shade: 0.4 }
  ];
}

function coolerTower(heightMm) {
  const s = SITES.cooler;
  const h = Math.max(2.4, (heightMm || 120) / 25);
  const out = [
    /* THE BASE PLATE. The owner's photograph is a passive server
       heatsink rather than a tower, and the single most useful thing in
       it is what happens at the BOTTOM: a machined plate wider than the
       fin stack, with the mounting hardware on it. Every cooler has one
       and mine did not. */
    { shape: "rbox", size: [5.0, 0.28, 4.8], pos: [s.x, TOP + 0.14, s.z], r: 0.05, shade: 0.95 }
  ];
  /* THE FINS. Thin, many, and close together \u2014 in the photograph they
     are packed tight enough to read as a comb rather than as a set of
     plates, and a fin stack drawn with six plates is a radiator off a
     model kit. Twenty-two at 0.09 apart is what a real one looks like at
     this scale, and the count is derived from the width so the spacing
     stays right if the cooler is ever resized. */
  /* A 150 mm tower is about 130 mm wide and 130 mm deep — roughly as
     broad as it is tall. The first version was 2.5 units across a stack
     six units high and rendered as a chimney: the height was right and
     the footprint was a third of what it should be, which is the sort of
     error that only shows once the part is next to something. */
  const FIN_W = 4.4, FIN_D = 4.2, FIN_GAP = 0.125;
  const nFins = Math.max(8, Math.round(FIN_W / FIN_GAP));
  out.push({ shape: "box", size: [0.05, h - 0.7, FIN_D],
    pos: [s.x - FIN_W / 2, TOP + 0.28 + (h - 0.7) / 2, s.z], r: 0.0, shade: 1.15,
    repeat: { count: nFins, step: [FIN_GAP, 0, 0] } });
  /* the channel across the top of the stack, which is in the photograph
     and is where the fins are broken for the retention bar */
  out.push({ shape: "box", size: [FIN_W + 0.3, 0.24, 0.5],
    pos: [s.x, TOP + h - 0.5, s.z], r: 0.02, shade: 0.8 });
  /* TWO HEATPIPES leaving the base and rising through the stack. A tower
     is a tower because of these; without them it is a block of metal. */
  [-1.25, 1.25].forEach(function (dx) {
    out.push({ shape: "cyl", size: [0.38, h - 1.0], pos: [s.x + dx, TOP + 0.28 + (h - 1.0) / 2, s.z - 1.35],
      seg: 16, shade: 0.72 });
    out.push({ shape: "cyl", size: [0.38, h - 1.0], pos: [s.x + dx, TOP + 0.28 + (h - 1.0) / 2, s.z + 1.35],
      seg: 16, shade: 0.72 });
  });
  /* FOUR SPRING-LOADED CAPTIVE SCREWS, one at each corner of the base
     plate, each with its coil showing. These are the detail that makes
     the photographed part instantly recognisable as a heatsink rather
     than a block, and they are also the thing a student's hands actually
     touch when they fit one. */
  [[-2.2, -2.1], [2.2, -2.1], [-2.2, 2.1], [2.2, 2.1]].forEach(function (c) {
    /* the coil: a short stack of small torus rings up the screw */
    for (let i = 0; i < 5; i++) {
      out.push({ shape: "torus", size: [0.52, 0.11], pos: [s.x + c[0], TOP + 0.32 + i * 0.13, s.z + c[1]],
        rot: [P2, 0, 0], seg: 14, seg2: 6, shade: 1.25 });
    }
    /* the screw head above it */
    out.push({ shape: "cyl", size: [0.42, 0.2], pos: [s.x + c[0], TOP + 1.0, s.z + c[1]], seg: 12, shade: 0.85 });
    /* the shank down through the plate to the board */
    out.push({ shape: "cyl", size: [0.16, 0.55], pos: [s.x + c[0], TOP - 0.05, s.z + c[1]], seg: 10, shade: 0.7 });
  });
  return out;
}

function ramSticks(fitted, slots) {
  /* `fitted` is an array of slot indices that have a module in them. */
  const s = SITES.ram;
  const out = [];
  (fitted || []).forEach(function (i) {
    const x = s.x + i * 0.52;
    out.push({ shape: "box", size: [0.26, 1.35, 4.6], pos: [x, TOP + 0.85, s.z + 0.6], r: 0.02, shade: 1.0 });
    /* the heat spreader ridge */
    out.push({ shape: "box", size: [0.30, 0.22, 4.2], pos: [x, TOP + 1.45, s.z + 0.6], r: 0.03, shade: 1.2 });
    /* eight chips down one side */
    out.push({ shape: "box", size: [0.06, 0.4, 0.42], pos: [x + 0.16, TOP + 0.8, s.z - 1.3], r: 0.01,
      shade: 0.55, repeat: { count: 8, step: [0, 0, 0.53] } });
  });
  return out;
}

/* THE CARD SITS ON THE MAT, NOT IN THE SLOT.

   A 300mm card is a third of the board's width again. Seated, it lies
   flat across the middle and covers the CPU socket, the memory slots,
   the M.2 and four of the six status pips \u2014 which is exactly what it
   does in a real tower, and exactly why nobody troubleshoots a build
   with the card in. So it lies on the mat in front of the board, where
   it actually is until the moment you fit it. Its length is still to
   scale and still measurable against the case, which is the only thing
   the card's geometry has to teach. */
const GPU_MAT_Z = 6.6;

function gpuCard(lengthMm) {
  /* THE CARD WITH ITS COOLER OFF, which is what the owner's photograph
     shows and which is far better for teaching than the shrouded brick I
     had. A shroud is a plastic lid: it hides the GPU, the memory, the
     regulators and the auxiliary power, which are the six things on a
     graphics card a Core 1 student is ever asked about.

     Everything below is a labelled feature in that photograph, laid out
     the way the photograph lays them out. */
  const s = { x: SITES.gpu.x, z: GPU_MAT_Z };
  const L = Math.max(3.5, (lengthMm || 280) / 25);
  const x0 = s.x - 2.0;                 /* the bracket end */
  const out = [
    /* the PCB */
    { shape: "box", size: [L, 0.14, 2.6], pos: [x0 + L / 2, TOP + 0.37, s.z], r: 0.01, shade: 1.0 },
    /* THE x16 EDGE CONNECTOR along the bottom, in two groups with the
       key notch between them \u2014 the notch is how a student tells x16 from
       x8 at a glance, so it has to be there rather than implied */
    { shape: "box", size: [0.55, 0.12, 0.34], pos: [x0 + 1.5, TOP + 0.29, s.z - 1.42], r: 0.0, shade: 1.7 },
    { shape: "box", size: [3.1, 0.12, 0.34], pos: [x0 + 3.7, TOP + 0.29, s.z - 1.42], r: 0.0, shade: 1.7 },
    /* THE SLI / CROSSFIRE FINGERS on the top edge, near the bracket */
    { shape: "box", size: [0.9, 0.1, 0.3], pos: [x0 + 1.6, TOP + 0.49, s.z + 1.15], r: 0.0, shade: 1.7 },
    /* THE GPU: a substrate with the die on it, centred on the board */
    { shape: "box", size: [1.9, 0.1, 1.9], pos: [x0 + L * 0.42, TOP + 0.49, s.z], r: 0.02, shade: 0.72 },
    { shape: "box", size: [1.25, 0.16, 1.05], pos: [x0 + L * 0.42, TOP + 0.56, s.z], r: 0.01, shade: 1.35 },
    /* FOUR VRAM PACKAGES around it \u2014 the memory, and the reason a card
       says "8 GB" on the box */
    { shape: "box", size: [0.62, 0.12, 0.62], pos: [x0 + L * 0.42 - 1.5, TOP + 0.50, s.z + 0.9], r: 0.01, shade: 0.55 },
    { shape: "box", size: [0.62, 0.12, 0.62], pos: [x0 + L * 0.42 + 1.5, TOP + 0.50, s.z + 0.9], r: 0.01, shade: 0.55 },
    { shape: "box", size: [0.62, 0.12, 0.62], pos: [x0 + L * 0.42 - 1.5, TOP + 0.50, s.z - 0.9], r: 0.01, shade: 0.55 },
    { shape: "box", size: [0.62, 0.12, 0.62], pos: [x0 + L * 0.42 + 1.5, TOP + 0.50, s.z - 0.9], r: 0.01, shade: 0.55 },
    /* THE VRM: a row of chokes and their regulators, between the GPU and
       the power connectors. This is where the two hundred watts actually
       gets turned into something the die can use. */
    { shape: "box", size: [0.44, 0.34, 0.44], pos: [x0 + L * 0.68, TOP + 0.60, s.z + 0.7], r: 0.03, shade: 0.85,
      repeat: { count: 5, step: [0.62, 0, 0] } },
    { shape: "box", size: [0.3, 0.16, 0.3], pos: [x0 + L * 0.68, TOP + 0.51, s.z + 0.05], r: 0.01, shade: 0.45,
      repeat: { count: 5, step: [0.62, 0, 0] } },
    /* electrolytics along the back edge */
    { shape: "cyl", size: [0.44, 0.55], pos: [x0 + L * 0.72, TOP + 0.71, s.z - 0.95], seg: 14, shade: 0.62,
      repeat: { count: 4, step: [0.6, 0, 0] } },
    /* THE AUXILIARY POWER SOCKETS on the top edge at the far end \u2014 a
       6-pin and an 8-pin, side by side, which is the pair the photograph
       labels and the pair people forget to plug in */
    { shape: "box", size: [1.05, 0.42, 0.5], pos: [x0 + L - 1.7, TOP + 0.65, s.z + 1.0], r: 0.04, shade: 0.35 },
    { shape: "box", size: [1.35, 0.42, 0.5], pos: [x0 + L - 0.4, TOP + 0.65, s.z + 1.0], r: 0.04, shade: 0.35 },
    /* THE BRACKET, and the display outputs through it */
    { shape: "box", size: [0.12, 1.6, 2.7], pos: [x0 - 0.06, TOP + 0.85, s.z], r: 0.01, shade: 0.9 },
    { shape: "box", size: [0.3, 0.42, 0.72], pos: [x0 + 0.2, TOP + 0.66, s.z - 0.75], r: 0.03, shade: 0.5 },
    { shape: "box", size: [0.3, 0.34, 0.62], pos: [x0 + 0.2, TOP + 0.66, s.z + 0.1], r: 0.03, shade: 0.5 },
    { shape: "box", size: [0.3, 0.34, 0.62], pos: [x0 + 0.2, TOP + 0.66, s.z + 0.85], r: 0.03, shade: 0.5 },
    /* the cooler's mounting holes around the GPU, which is what says
       "the cooler comes off this" */
    { shape: "cyl", size: [0.22, 0.2], pos: [x0 + L * 0.42 - 1.35, TOP + 0.42, s.z - 1.15], seg: 10, shade: 0.4 },
    { shape: "cyl", size: [0.22, 0.2], pos: [x0 + L * 0.42 + 1.35, TOP + 0.42, s.z - 1.15], seg: 10, shade: 0.4 },
    { shape: "cyl", size: [0.22, 0.2], pos: [x0 + L * 0.42 - 1.35, TOP + 0.42, s.z + 1.15], seg: 10, shade: 0.4 },
    { shape: "cyl", size: [0.22, 0.2], pos: [x0 + L * 0.42 + 1.35, TOP + 0.42, s.z + 1.15], seg: 10, shade: 0.4 }
  ];
  return out;
}

/* ---------------------------------------------------------------------
   THE THREE SIGNS OF A POWER-ON.

   The Core 1 workstation troubleshooting PBQ hands a student four bullet
   points and asks which subsystem is at fault. The bullets ARE the
   exercise, and a bullet list is a thing you read rather than a thing
   you observe. So the machine shows them instead: a chassis fan that is
   turning or is not, a board speaker that is sounding or is silent, and
   a monitor that is lit or is dark.

   No animation. A still render says "turning" some other way, so each
   sign carries its state in the COLOUR, in a piece of geometry that is
   there or is not, and in the WORDS on the control beside it. Colour is
   never the only signal.
   --------------------------------------------------------------------- */

/* One row, in front of the board, in the band the loose graphics card
   would otherwise occupy. The first render of this row put it at z = 8.9
   and half of it fell outside the camera's view: the check written here
   asked whether each sign stood ON the mat, and a part can be on the mat
   and still off the SCREEN. Both are asked now. */
const SIGN_Z  = 6.8;
const SIGN_XS = { fan: -4.6, beep: -0.2, video: 4.4 };
/* What each sign STANDS ON \u2014 its footprint, for the mat and frame checks. */
const SIGN_W  = { fan: 3.0,  beep: 1.4,  video: 2.0 };
const SIGN_D  = { fan: 0.9,  beep: 1.2,  video: 1.4 };
/* How far each REACHES sideways once everything above the foot counts: a
   monitor bezel is much wider than its stand and the beep rings are much
   wider than the speaker. Separate numbers, because the overlap test asks
   a separate question \u2014 a bezel hanging over a neighbour's foot is still
   drawn through it. */
const SIGN_REACH = { fan: 3.0, beep: 3.7, video: 4.4 };
const SIGN_H  = { fan: 3.2,  beep: 3.6,  video: 4.0 };
const MAT_HALF  = 8.5;
const MAT_FRONT = 10.3;
const MAT_BACK  = -6.7;
/* What the camera actually holds, measured off the render rather than
   assumed: the board's front edge at z = 4.9 and the card at z = 6.6 are
   both comfortably in frame; z = 8.9 was not. */
const FRAME_X = 7.4;
const FRAME_Z_FRONT = 8.0;

(function checkSignRow() {
  const keys = Object.keys(SIGN_XS);
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i];
    const aL = SIGN_XS[a] - SIGN_W[a] / 2, aR = SIGN_XS[a] + SIGN_W[a] / 2;
    const aB = SIGN_Z - SIGN_D[a] / 2,     aF = SIGN_Z + SIGN_D[a] / 2;
    if (aL < -MAT_HALF || aR > MAT_HALF || aB < MAT_BACK || aF > MAT_FRONT) {
      throw new Error("bench-build: the " + a + " sign hangs off the mat");
    }
    if (aL < -FRAME_X || aR > FRAME_X || aF > FRAME_Z_FRONT) {
      throw new Error("bench-build: the " + a + " sign is outside the camera's frame");
    }
    const arL = SIGN_XS[a] - SIGN_REACH[a] / 2, arR = SIGN_XS[a] + SIGN_REACH[a] / 2;
    if (arL < -FRAME_X || arR > FRAME_X) {
      throw new Error("bench-build: the " + a + " sign reaches outside the camera's frame");
    }
    for (let j = i + 1; j < keys.length; j++) {
      const b = keys[j];
      const brL = SIGN_XS[b] - SIGN_REACH[b] / 2, brR = SIGN_XS[b] + SIGN_REACH[b] / 2;
      if (arL < brR && brL < arR) {
        throw new Error("bench-build: the " + a + " and " + b + " signs overlap");
      }
    }
  }
})();

function signFanFrame() {
  const x = SIGN_XS.fan, z = SIGN_Z, y = 1.7;
  const R = 1.32, T = 0.34;
  /* FOUR BARS, not a box with a hole in it. There is no boolean
     subtraction in this renderer, so a solid square with a bore cylinder
     inside it draws a solid square \u2014 the first render of this fan was a
     green slab with a dimple and every blade was buried inside it.
     Material can only be absent here by not being drawn. */
  return [
    { shape: "rbox", size: [3.0, 0.18, 0.9], pos: [x, 0.09, z], r: 0.05, shade: 0.60 },
    { shape: "box", size: [R * 2 + T, T, 0.44], pos: [x, y + R + T / 2, z], r: 0.06, shade: 0.80 },
    { shape: "box", size: [R * 2 + T, T, 0.44], pos: [x, y - R - T / 2, z], r: 0.06, shade: 0.80 },
    { shape: "box", size: [T, R * 2 + T, 0.44], pos: [x - R - T / 2, y, z], r: 0.06, shade: 0.80 },
    { shape: "box", size: [T, R * 2 + T, 0.44], pos: [x + R + T / 2, y, z], r: 0.06, shade: 0.80 },
    { shape: "cyl", size: [0.44, 0.46], pos: [x, y, z], rot: [P2, 0, 0], seg: 24, shade: 1.0 }
  ];
}
/* The blades, which are the part that is or is not moving. Their own
   part, because a fan FRAME does not change colour when the fan spins
   and one colour per part is this bench's oldest rule. */
function signFanBlades(turning) {
  const x = SIGN_XS.fan, z = SIGN_Z, y = 1.7;
  const out = [];
  /* Seven blades. Seven rather than an even count because an even one
     draws a straight line through the hub at some angles and reads as two
     bars rather than as a fan. */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    out.push({ shape: "box", size: [0.96, 0.38, 0.07],
      pos: [x + Math.cos(a) * 0.82, y + Math.sin(a) * 0.82, z],
      rot: [0, 0, a + 0.5], r: 0.03, shade: turning ? 1.0 : 0.85 });
  }
  if (turning) {
    /* The blur. ONE ring, one primitive \u2014 the accessibility edge overlay
       outlines every piece on this bench, so softness cannot be made by
       adding more of them. A TORUS: `tube` in this renderer is an
       open-ended cylinder whose second size is a length, not a section. */
    out.push({ shape: "torus", size: [2.3, 0.46], pos: [x, y, z + 0.10], seg: 48, seg2: 10, shade: 1.5 });
  }
  return out;
}

/* The board speaker. The can does not change colour when it beeps, so
   the can is one part and the sound is another \u2014 and when it is silent
   the sound part is simply not drawn, which is the clearest signal a
   still render has: the thing that would be there is not. */
function signBeepBody() {
  const x = SIGN_XS.beep, z = SIGN_Z;
  return [
    { shape: "rbox", size: [1.3, 0.14, 1.1], pos: [x, 0.07, z], r: 0.05, shade: 0.55 },
    { shape: "cyl", size: [0.72, 1.25], pos: [x, 0.78, z], seg: 32, shade: 0.95 },
    { shape: "cyl", size: [0.20, 0.14], pos: [x, 1.42, z], seg: 18, shade: 0.30 },
    { shape: "box", size: [0.09, 0.30, 0.09], pos: [x - 0.34, 0.16, z + 0.34], r: 0.01, shade: 0.6 },
    { shape: "box", size: [0.09, 0.30, 0.09], pos: [x + 0.34, 0.16, z + 0.34], r: 0.01, shade: 0.6 }
  ];
}
function signBeepRings() {
  const x = SIGN_XS.beep, z = SIGN_Z;
  const out = [];
  /* TORUSES, not tubes. Three "rings" built from `tube` were three thin
     barrels seen end-on, and flipping the beep repainted a tenth of one
     percent of the canvas; fattening the second number three times over
     moved it to a quarter of one percent, which is what finally said the
     number did not mean what I thought it meant. */
  for (let i = 0; i < 3; i++) {
    out.push({ shape: "torus", size: [1.6 + i * 0.8, 0.34], rot: [P2, 0, 0],
      pos: [x, 1.85 + i * 0.55, z], seg: 40, seg2: 10, shade: 1.5 - i * 0.16 });
  }
  return out;
}

/* The monitor, in TWO parts plus what is on it. A real monitor's bezel
   and stand do not change colour when a picture arrives; only the panel
   does. The power lamp belongs to the CHASSIS because it is lit either
   way \u2014 that is the trap in "the screen is on, so it must be the PC". */
function signMonitorBody() {
  const x = SIGN_XS.video, z = SIGN_Z;
  return [
    { shape: "rbox", size: [2.0, 0.16, 1.3], pos: [x, 0.08, z + 0.35], r: 0.05, shade: 0.62 },
    { shape: "box", size: [0.40, 1.0, 0.32], pos: [x, 0.62, z + 0.35], r: 0.03, shade: 0.70 },
    { shape: "rbox", size: [4.4, 2.7, 0.24], pos: [x, 2.55, z + 0.30], rot: [-0.12, 0, 0], r: 0.08, shade: 0.85 },
    { shape: "cyl", size: [0.10, 0.06], pos: [x + 1.9, 1.28, z + 0.17], rot: [P2, 0, 0], seg: 12, shade: 1.55 }
  ];
}
function signMonitorPanel() {
  const x = SIGN_XS.video, z = SIGN_Z;
  /* The bezel is 0.24 deep centred on z + 0.30, so its NEAR face \u2014 the
     one the camera sees \u2014 is at z + 0.42, not z + 0.18. Two earlier
     attempts put the panel at z + 0.155 and z + 0.26, both INSIDE the
     bezel, and it never appeared at all: lit and dark rendered identical
     pixels. Nothing in the source said so; the pixel check did, twice. */
  return [{ shape: "box", size: [4.04, 2.34, 0.06], pos: [x, 2.57, z + 0.50], rot: [-0.12, 0, 0], r: 0.01,
    shade: 1.0 }];
}
/* Something ON the screen, drawn only when there is a picture. The panel
   was carrying the lit state in COLOUR alone, and these students have
   damaged sight \u2014 a blue rectangle against a black one is one channel.
   A screen with content against a screen with none is a second, and it is
   the one a technician actually looks for. */
function signMonitorImage() {
  const x = SIGN_XS.video, z = SIGN_Z;
  return [
    { shape: "box", size: [3.5, 0.30, 0.05], pos: [x, 3.30, z + 0.60], rot: [-0.12, 0, 0], r: 0.01, shade: 1.0 },
    { shape: "box", size: [2.4, 0.22, 0.05], pos: [x - 0.5, 2.76, z + 0.60], rot: [-0.12, 0, 0], r: 0.01, shade: 0.86 },
    { shape: "box", size: [2.9, 0.22, 0.05], pos: [x - 0.25, 2.36, z + 0.60], rot: [-0.12, 0, 0], r: 0.01, shade: 0.86 },
    { shape: "box", size: [1.7, 0.22, 0.05], pos: [x - 0.9, 1.96, z + 0.60], rot: [-0.12, 0, 0], r: 0.01, shade: 0.86 }
  ];
}

/* ---------------------------------------------------------------------
   THE POWER SUPPLY, WITH ITS LID OFF.

   The workstation bench has talked about the supply for the whole build
   and never drawn one: it has been a number on a plate and a verdict pip
   on the 24-pin header. The owner's photograph is of an ATX supply with
   the case open, and that is the version worth having, because a closed
   grey box teaches nothing that the words "450 W" do not already say.

   Everything in it is a labelled part of the exam's power story: the
   fan that has to keep it cool, the two heatsinks the switching devices
   are bolted to, the transformer that does the actual converting, the
   filter capacitors, the choke, and the loom that leaves it. And on the
   outside face, the three things a technician looks at first \u2014 the
   inlet, the switch, and whether the fan turns.

   This one sits on the mat rather than on the board, in the same band
   the loose graphics card and the power-on signs use, and `buildBench`
   refuses to draw more than one of the three at once.
   --------------------------------------------------------------------- */
const PSU_MAT = { x: 0.0, z: 6.6 };
const PSU_W = 5.8, PSU_H = 3.4, PSU_D = 5.4;

function psuUnit() {
  /* THE LID IS OFF, NOT A WALL.

     The first version took a side wall away and put the rear face on the
     far side, so the render was an empty grey crate with grey pipes
     coming out of it: the camera looks DOWN at this bench, so what it
     needed removed was the top. And the face a technician actually
     identifies a supply by \u2014 fan, inlet, switch \u2014 has to be the one
     turned toward the room, not the one turned away from it.

     150 x 86 x 140 mm is the ATX standard, which at this bench's 25 mm
     to the unit is 6.0 x 3.4 x 5.6. The numbers below are that, so a
     student comparing it against the case in the same scene is comparing
     something true. */
  const c = PSU_MAT, y0 = TOP;
  const cy = y0 + PSU_H / 2;
  const face = c.z + PSU_D / 2;      /* the rear face, turned toward the room */
  const back = c.z - PSU_D / 2;      /* where the loom leaves */
  const out = [
    /* the pan and all four walls. No lid \u2014 that is the one that is off. */
    { shape: "box", size: [PSU_W, 0.16, PSU_D], pos: [c.x, y0 + 0.08, c.z], r: 0.02, shade: 1.0 },
    /* THE THREE OTHER WALLS ARE CUT DOWN to about a third of their
       height. Full height, they hide the very thing the lid was taken
       off to show: at this bench's camera angle you look over the near
       wall and into an empty box. This is the cutaway convention, and it
       is honest because the face that identifies the part \u2014 the one
       below, with the fan and the inlet \u2014 is left whole. */
    { shape: "box", size: [0.16, PSU_H * 0.34, PSU_D], pos: [c.x - PSU_W / 2, y0 + PSU_H * 0.17, c.z], r: 0.02, shade: 0.90 },
    { shape: "box", size: [0.16, PSU_H * 0.34, PSU_D], pos: [c.x + PSU_W / 2, y0 + PSU_H * 0.17, c.z], r: 0.02, shade: 0.90 },
    { shape: "box", size: [PSU_W, PSU_H * 0.34, 0.16], pos: [c.x, y0 + PSU_H * 0.17, back], r: 0.02, shade: 0.86 },
    /* THE REAR FACE, and the three things on it */
    { shape: "box", size: [PSU_W, PSU_H, 0.20], pos: [c.x, cy, face], r: 0.02, shade: 1.08 },
    /* the fan opening, its guard, and the fan behind it */
    { shape: "cyl", size: [2.4, 0.24], pos: [c.x - 1.4, cy, face + 0.06], rot: [P2, 0, 0], seg: 30, shade: 0.28 },
    /* The guard is on a VERTICAL face, so its rings stay in the XY plane.
       Turned flat by a P2 about X they became a swoosh lying across the
       fan opening rather than three rings over it. */
    { shape: "torus", size: [0.9, 0.10], pos: [c.x - 1.4, cy, face + 0.16], seg: 26, seg2: 6, shade: 1.4 },
    { shape: "torus", size: [1.6, 0.10], pos: [c.x - 1.4, cy, face + 0.16], seg: 26, seg2: 6, shade: 1.4 },
    { shape: "torus", size: [2.3, 0.10], pos: [c.x - 1.4, cy, face + 0.16], seg: 26, seg2: 6, shade: 1.4 },
    /* four spokes, so it reads as a stamped guard rather than as rings */
    /* 2.4 is the fan opening's DIAMETER, and torus size[0] is a
       diameter too. The first pass doubled one that was already doubled
       and drew a cross half again as wide as the supply. */
    { shape: "box", size: [2.4, 0.11, 0.11], pos: [c.x - 1.4, cy, face + 0.16], r: 0.0, shade: 1.4 },
    { shape: "box", size: [0.11, 2.4, 0.11], pos: [c.x - 1.4, cy, face + 0.16], r: 0.0, shade: 1.4 },
    { shape: "cyl", size: [0.55, 0.5], pos: [c.x - 1.4, cy, face - 0.35], rot: [P2, 0, 0], seg: 16, shade: 0.6 },
    /* THE IEC INLET \u2014 the three-pin kettle socket, with its chamfered top */
    { shape: "box", size: [1.5, 1.15, 0.4], pos: [c.x + 1.5, cy + 0.45, face + 0.1], r: 0.06, shade: 0.24 },
    { shape: "box", size: [0.22, 0.36, 0.24], pos: [c.x + 1.13, cy + 0.62, face + 0.26], r: 0.02, shade: 1.45 },
    { shape: "box", size: [0.22, 0.36, 0.24], pos: [c.x + 1.87, cy + 0.62, face + 0.26], r: 0.02, shade: 1.45 },
    { shape: "box", size: [0.22, 0.36, 0.24], pos: [c.x + 1.5, cy + 0.16, face + 0.26], r: 0.02, shade: 1.45 },
    /* THE ROCKER SWITCH under it */
    { shape: "box", size: [1.15, 0.62, 0.32], pos: [c.x + 1.5, cy - 0.75, face + 0.08], r: 0.04, shade: 0.3 },
    { shape: "box", size: [0.9, 0.42, 0.2], pos: [c.x + 1.5, cy - 0.75, face + 0.22], rot: [0.2, 0, 0], r: 0.03, shade: 0.95 },
    /* the label, which is where the wattage a student is asked for lives */
    { shape: "box", size: [1.7, 0.9, 0.05], pos: [c.x + 1.5, cy - 1.35, face + 0.13], r: 0.02, shade: 1.5 },

    /* ---- WHAT IS INSIDE, seen from above ----
       Everything here stands on the pan and stops well below the wall
       tops, so looking down into the box shows all of it. */
    /* two finned heatsinks, running front to back */
    { shape: "box", size: [0.09, 1.7, 3.4], pos: [c.x - 1.9, y0 + 1.0, c.z - 0.1], r: 0.0, shade: 1.25,
      repeat: { count: 10, step: [0.17, 0, 0] } },
    { shape: "box", size: [0.09, 1.7, 3.4], pos: [c.x + 0.5, y0 + 1.0, c.z - 0.1], r: 0.0, shade: 1.25,
      repeat: { count: 10, step: [0.17, 0, 0] } },
    /* THE TRANSFORMER between them, wrapped in tape */
    { shape: "rbox", size: [1.35, 1.6, 1.6], pos: [c.x - 0.55, y0 + 0.95, c.z - 1.3], r: 0.06, shade: 0.66 },
    { shape: "box", size: [1.42, 0.36, 1.66], pos: [c.x - 0.55, y0 + 1.35, c.z - 1.3], r: 0.02, shade: 1.55 },
    /* THE PRIMARY FILTER CAPACITORS \u2014 the two big cans, and the reason a
       supply is dangerous with the lid off long after it is unplugged */
    { shape: "cyl", size: [1.0, 2.0], pos: [c.x + 2.0, y0 + 1.08, c.z - 1.5], seg: 20, shade: 0.52 },
    { shape: "cyl", size: [1.0, 2.0], pos: [c.x + 2.0, y0 + 1.08, c.z - 0.2], seg: 20, shade: 0.52 },
    { shape: "cyl", size: [0.9, 0.12], pos: [c.x + 2.0, y0 + 2.1, c.z - 1.5], seg: 20, shade: 1.3 },
    { shape: "cyl", size: [0.9, 0.12], pos: [c.x + 2.0, y0 + 2.1, c.z - 0.2], seg: 20, shade: 1.3 },
    /* smaller secondary-side electrolytics along the front */
    { shape: "cyl", size: [0.5, 1.0], pos: [c.x - 2.3, y0 + 0.6, c.z + 1.7], seg: 14, shade: 0.48,
      repeat: { count: 4, step: [0.66, 0, 0] } },
    /* THE TOROIDAL CHOKE \u2014 the black donut with wire wound round it */
    { shape: "torus", size: [1.6, 0.66], pos: [c.x + 1.4, y0 + 0.5, c.z + 1.6], rot: [P2, 0, 0],
      seg: 22, seg2: 10, shade: 0.26 },
    /* the grommet the loom leaves through, in the back wall */
    { shape: "cyl", size: [0.9, 0.4], pos: [c.x - 1.6, y0 + 0.7, back - 0.1], rot: [P2, 0, 0], seg: 16, shade: 0.3 }
  ];
  /* THE LOOM. Thin, many, in different colours, drooping over the back
     edge onto the mat. The first version was six rods thicker than the
     transformer, sticking out at forty-five degrees, all the same grey —
     it read as a bundle of scaffolding poles. A loom is a lot of skinny
     cables and its colours are how a technician tells the rails apart. */
  const SHADES = [0.30, 1.5, 0.30, 0.95, 0.62, 1.15, 0.30, 0.78];
  for (let i = 0; i < SHADES.length; i++) {
    const dx = -2.3 + i * 0.2;
    out.push({ shape: "cyl", size: [0.17, 2.6],
      pos: [c.x + dx, y0 + 0.6 - i * 0.02, back - 1.2],
      rot: [P2 - 0.5, 0, 0], seg: 8, shade: SHADES[i] });
    out.push({ shape: "cyl", size: [0.17, 2.4],
      pos: [c.x + dx - 0.5, y0 + 0.1, back - 3.1],
      rot: [P2, 0.25 + i * 0.05, 0], seg: 8, shade: SHADES[i] });
  }
  return out;
}

function plugIn(site, w, d) {
  return [
    { shape: "rbox", size: [w + 0.1, 0.75, d + 0.08], pos: [site.x, TOP + 0.55, site.z], r: 0.05, shade: 1.0 },
    /* the loom leaving it */
    { shape: "cyl", size: [0.34, 2.2], pos: [site.x, TOP + 1.4, site.z], rot: [0.35, 0, 0], seg: 10, shade: 0.8 }
  ];
}

/* ---------- the limit plane ----------
   For the two faults that are not electrical.

   A cage drawn AROUND the part was the first attempt and it read as
   packaging: the cooler sat inside a box and nothing about it said
   "wrong". What a technician actually meets is a flat side panel at a
   fixed height that the cooler will not go under, so that is what this
   draws — a bright grille at exactly the clearance the case allows.
   Anything sticking through it is the fault, and it is the fault at a
   glance rather than after reading a number. */
function limitPlane(site, w, limit, d) {
  const t = 0.09;
  const out = [
    /* the panel edge, all the way round */
    { shape: "box", size: [w, t, t], pos: [site.x, TOP + limit, site.z - d / 2], r: 0.02, shade: 1.5 },
    { shape: "box", size: [w, t, t], pos: [site.x, TOP + limit, site.z + d / 2], r: 0.02, shade: 1.5 },
    { shape: "box", size: [t, t, d], pos: [site.x - w / 2, TOP + limit, site.z], r: 0.02, shade: 1.5 },
    { shape: "box", size: [t, t, d], pos: [site.x + w / 2, TOP + limit, site.z], r: 0.02, shade: 1.5 },
    /* the grille across it, so the plane reads as a surface rather than
       as four floating sticks */
    { shape: "box", size: [w, 0.05, 0.05], pos: [site.x, TOP + limit, site.z - d / 2 + 0.35],
      r: 0.01, shade: 1.25, repeat: { count: 7, step: [0, 0, d / 7] } },
    /* two posts dropping to the board, so the height is legible */
    { shape: "cyl", size: [0.07, limit], pos: [site.x - w / 2, TOP + limit / 2, site.z - d / 2],
      seg: 8, shade: 1.1 },
    { shape: "cyl", size: [0.07, limit], pos: [site.x + w / 2, TOP + limit / 2, site.z + d / 2],
      seg: 8, shade: 1.1 }
  ];
  return out;
}

/* A small pip beside a socket carrying its verdict. Its own part, so it
   can be red without turning the socket red. */
function pip(site, dz) {
  return [
    { shape: "cyl", size: [0.52, 0.12], pos: [site.x, TOP + 0.07, site.z + (dz || 0)],
      rot: [0, 0, 0], seg: 14, shade: 1.0 },
    { shape: "sphere", size: [0.46], pos: [site.x, TOP + 0.15, site.z + (dz || 0)], seg: 14, shade: 1.0 }
  ];
}

function pipWell(site, dz) {
  return [{ shape: "cyl", size: [0.78, 0.07], pos: [site.x, TOP + 0.04, site.z + (dz || 0)],
    rot: [0, 0, 0], seg: 14, shade: 0.30 }];
}

/* ---------------------------------------------------------------------
   buildBench(view)

     view.slots      how many RAM slots the board has
     view.fitted     { cpu, cooler, ram, gpu, psu24, eps, m2 } -> verdict key
     view.ramIn      array of slot indices holding a module
     view.coolerMm   cooler height, for drawing the tower
     view.gpuMm      card length
     view.foul       optional { part, w, h, d } clearance cage to draw
     view.powered    true once it has been switched on
   --------------------------------------------------------------------- */
export function buildBench(view) {
  view = view || {};
  const F = view.fitted || {};
  const parts = [
    { key: "board", label: "The motherboard", build: boardBuild(), finish: "board", scale: 1,
      pos: [0, 0.35, 0], color: "#1f3a2a",
      spec: "ATX, " + (view.slots || 4) + " memory slots",
      note: "Everything that has to agree with everything else meets here. The socket decides " +
        "the CPU, the CPU decides the cooler mount, the slots decide the memory, and the " +
        "24-pin and the EPS decide whether any of it starts." }
  ];

  /* Sockets first, so fitted parts draw over them. */
  const SOCKETS = [
    { key: "cpu",    label: "CPU socket",              build: socketCPU(),
      spec: "Land grid array", pipAt: [SITES.cpu, -1.55],
      note: "The socket is the first constraint in the whole build. A CPU either matches it or " +
        "it does not, and there is no adapter." },
    { key: "ram",    label: "Memory slots",            build: socketRAM(view.slots),
      spec: (view.slots || 4) + " slots, two channels", pipAt: [SITES.ram, -2.6],
      note: "The light and dark slots are the two channels. Two modules in the same channel " +
        "work and run at half the bandwidth, which is the most common quiet mistake in a " +
        "build and never shows up as an error." },
    { key: "gpu",    label: "Primary PCIe x16 slot",   build: socketPCIe(),
      spec: "x16 electrical", pipAt: [SITES.gpu, -1.15],
      note: "The long slot nearest the CPU is the one with all sixteen lanes wired to it." },
    { key: "m2",     label: "M.2 slot",                build: socketM2(),
      spec: "M.2, PCIe", pipAt: [SITES.m2, 0.85],
      note: view.m2Shared
        ? "This slot SHARES its lanes with the SATA ports. Populate it and some of them stop " +
          "working — which a student meets as \\u201cthe drive I did not touch has vanished\\u201d."
        : "This slot has its own lanes and takes nothing away from the SATA ports." },
    { key: "psu24",  label: "24-pin power",            build: header(SITES.psu24, 0.7, 2.6),
      spec: "Main board power", pipAt: [SITES.psu24, -1.65],
      note: "Board power. Necessary, and on its own not sufficient." },
    { key: "eps",    label: "EPS 8-pin CPU power",     build: header(SITES.eps, 1.1, 0.55),
      spec: "CPU power", pipAt: [SITES.eps, 0.75],
      note: "The connector everybody forgets, tucked behind the cooler where you cannot see it " +
        "once the tower is on. Without it the fans spin, the lights come on, and nothing posts." }
  ];

  SOCKETS.forEach(function (s) {
    parts.push({ key: "socket-" + s.key, label: s.label, build: s.build, finish: "plastic",
      scale: 1, pos: [0, 0.35, 0], color: "#8a939c", spec: s.spec, note: s.note });
    /* the unlit well, then the pip that carries the verdict */
    parts.push({ key: "well-" + s.key, label: s.label + " indicator surround",
      build: pipWell(s.pipAt[0], s.pipAt[1]), finish: "matte", scale: 1,
      pos: [0, 0.35, 0], color: "#14181c", spec: "", note: "" });
    const v = VERDICT[F[s.key]] || VERDICT.empty;
    parts.push({ key: "pip-" + s.key, label: s.label + " status",
      build: pip(s.pipAt[0], s.pipAt[1]), finish: "plastic", scale: 1,
      pos: [0, 0.35, 0], color: v.color, glow: v.glow,
      spec: v.says, note: v.says });
  });

  /* Fitted components. */
  if (F.cpu && F.cpu !== "empty") {
    parts.push({ key: "cpu", label: "The processor", build: cpuChip(), finish: "metal", scale: 1,
      pos: [0, 0.35, 0], color: "#c9cfd6",
      spec: view.cpuLabel || "CPU", note: "Seated in the socket, notch to notch." });
  }
  if (F.cooler && F.cooler !== "empty") {
    parts.push({ key: "cooler", label: "The CPU cooler", build: coolerTower(view.coolerMm),
      finish: "metal", scale: 1, pos: [0, 0.35, 0], color: "#aeb6bf",
      spec: (view.coolerMm || 120) + " mm tall",
      note: "A tower cooler's height is measured from the board, and it is the number that " +
        "decides whether the side panel closes." });
  }
  if ((view.ramIn || []).length) {
    parts.push({ key: "ram", label: "The memory", build: ramSticks(view.ramIn, view.slots),
      finish: "board", scale: 1, pos: [0, 0.35, 0], color: "#2b3350",
      spec: (view.ramIn.length) + " module" + (view.ramIn.length === 1 ? "" : "s") +
        " in slot" + (view.ramIn.length === 1 ? " " : "s ") + view.ramIn.map(i => i + 1).join(" and "),
      note: "Which slots, not just how many." });
  }
  /* THREE THINGS WANT THE SAME BAND on the mat in front of the board: a
     loose graphics card, the three power-on signs, and the opened power
     supply. They are mutually exclusive by geometry AND by meaning \u2014 a
     stage showing the signs of a power-on is showing an ASSEMBLED
     machine, which has no card lying beside it waiting to be fitted and
     no supply with its lid off. Drawing two of them puts a card through
     a fan, which is exactly the sort of thing no render gets checked for
     until somebody looks at it. */
  const loose = [(view.gpuMm || 0) > 0 ? "the graphics card" : null,
                 view.signs ? "the power-on signs" : null,
                 view.psu ? "the power supply" : null].filter(Boolean);
  if (loose.length > 1) {
    throw new Error("bench-build: " + loose.join(" and ") + " all want the same band on the mat \u2014 " +
      "only one of them can be drawn at a time");
  }

  /* The power supply, opened, when a stage is asking about power. */
  if (view.psu) {
    parts.push({ key: "psu", label: "The power supply, with its lid off",
      build: psuUnit(), finish: "metal", scale: 1, pos: [0, 0.35, 0], color: "#98a1a9",
      spec: view.psuSpec || "ATX supply",
      note: "The fan, the two heatsinks the switching devices bolt to, the transformer, the filter " +
        "capacitors, the choke and the loom. The two large cans hold their charge long after the " +
        "lead is out, which is why this is the one component in a PC nobody opens \u2014 it is drawn " +
        "open here so a student can see what they are being told not to touch." });
  }
  if (F.gpu && F.gpu !== "empty" && (view.gpuMm || 0) > 0) {
    parts.push({ key: "gpu", label: "The graphics card", build: gpuCard(view.gpuMm),
      /* A bare PCB, and light enough to READ. At #1e2b24 every feature
         on it \u2014 the die, the memory, the regulators, the two power
         sockets \u2014 rendered as black on black: the shades were right and
         the base they multiply was almost zero. */
      finish: "board", scale: 1, pos: [0, 0.35, 0], color: "#39604c",
      spec: view.gpuMm + " mm long",
      note: "On the mat, where a card is until you fit it \u2014 seated, one this long covers the socket, the memory and half the indicators. Length is measured from the bracket, and it is what fouls a drive cage." });
  }
  if (F.psu24 && F.psu24 !== "empty") {
    parts.push({ key: "plug24", label: "The 24-pin plug", build: plugIn(SITES.psu24, 0.7, 2.6),
      finish: "plastic", scale: 1, pos: [0, 0.35, 0], color: "#232a33",
      spec: "Seated", note: "Board power is in." });
  }
  if (F.eps && F.eps !== "empty") {
    parts.push({ key: "plugeps", label: "The EPS plug", build: plugIn(SITES.eps, 1.1, 0.55),
      finish: "plastic", scale: 1, pos: [0, 0.35, 0], color: "#232a33",
      spec: "Seated", note: "CPU power is in." });
  }

  /* The three signs of a power-on, when the stage is asking the student
     to observe rather than to inspect. `view.signs` is
     { fan, beep, video } with true meaning turning / sounding / lit. */
  if (view.signs) {
    const sg = view.signs;
    parts.push({ key: "sign-fan", label: "The chassis fan",
      build: signFanFrame(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
      color: "#5b636c", glow: 0,
      spec: "Chassis fan", note: "The frame and the hub. Neither of them changes whether or not " +
        "the fan is turning, which is why the frame tells you nothing." });
    parts.push({ key: "sign-fan-blades", label: sg.fan ? "The fan blades, turning" : "The fan blades, still",
      build: signFanBlades(!!sg.fan), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
      color: sg.fan ? "#2fd45e" : "#3b424a", glow: sg.fan ? 0.7 : 0,
      spec: sg.fan ? "Turning" : "Not turning",
      note: sg.fan
        ? "The blades are turning, so the supply is delivering and the board has released reset. " +
          "That rules out the whole class of faults where nothing happens at all \u2014 and it says " +
          "nothing whatever about whether the machine is POSTing."
        : "Nothing is turning. Before POST there is no firmware to report anything, so a machine " +
          "with no signs of life has failed at power delivery or at the board itself." });
    parts.push({ key: "sign-beep", label: "The board speaker",
      build: signBeepBody(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
      color: "#4a525c", glow: 0,
      spec: "Board speaker", note: "The can. It looks the same beeping or silent, which is why " +
        "this is a thing you listen for rather than a thing you look at." });
    if (sg.beep) {
      parts.push({ key: "sign-beep-rings", label: "The beep",
        build: signBeepRings(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
        color: "#ffd426", glow: 1.0,
        spec: "Sounding",
        note: "It is beeping, which means firmware is running and has got far enough to have an " +
          "opinion. A machine that can complain has already passed everything before the thing it " +
          "is complaining about." });
    }
    parts.push({ key: "sign-video-body", label: "The monitor",
      build: signMonitorBody(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
      color: "#454c55", glow: 0,
      spec: "Powered", note: "The chassis and the lamp under the bezel. Neither of them changes " +
        "when a picture arrives, which is exactly why neither of them tells you anything about one." });
    parts.push({ key: "sign-video", label: "The screen",
      build: signMonitorPanel(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
      color: sg.video ? "#4d97ff" : "#191d22", glow: sg.video ? 0.55 : 0,
      spec: sg.video ? "Picture" : "No picture",
      note: sg.video
        ? "There is a picture, so video initialised. Everything after this point is diagnosed " +
          "with your eyes rather than with beeps."
        : "No picture. The lamp under the bezel is still lit, which is the trap — a monitor " +
          "that is powered and receiving nothing looks exactly like a monitor that is broken." });
    if (sg.video) {
      parts.push({ key: "sign-video-image", label: "What is on the screen",
        build: signMonitorImage(), finish: "plastic", scale: 1, pos: [0, 0.35, 0],
        color: "#eef4ff", glow: 0.4,
        spec: "Firmware screen",
        note: "There is something drawn on it, and that is the signal rather than the colour. A " +
          "screen with content and a screen with none are two different pictures whether or not " +
          "you can tell blue from black." });
    }
  }

  /* The clearance cage, when something fouls. */
  if (view.foul && (SITES[view.foul.part] || view.foul.part === "gpu")) {
    const at = view.foul.part === "gpu"
      ? { x: SITES.gpu.x, z: GPU_MAT_Z }
      : SITES[view.foul.part];
    parts.push({ key: "clearance", label: "Case clearance",
      build: limitPlane(at, view.foul.w, view.foul.limit, view.foul.d),
      finish: "plastic", scale: 1, pos: [0, 0.35, 0], color: "#ff3b30", glow: 1.3,
      spec: "Where the case panel sits",
      note: "That grille is the side panel. Anything standing through it is what stops the case " +
        "closing, and no amount of pushing changes it." });
  }

  return {
    kind: "bench",
    title: "The board, on the mat",
    caption: "Every socket is a control. The pip beside each one is its verdict, and it says the " +
      "same thing in words in the list below.",
    board: {
      size: [17, 0.4, 17], pos: [0, -0.05, 1.8], color: "#2f3944",
      build: [{ shape: "rbox", size: [17, 0.4, 17], pos: [0, 0, 1.8], r: 0.12, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* fitWidth SWEPT against frustumOK at 319, 480, 697 and 889px — the
       canvas widths the running lab actually hands out, 319 being what
       fits inside a 390px phone. The suite renders at 1100 and had never
       asked. This bench lost three parts at 319px.

       The value is one sweep step above the measured minimum, because
       the sweep drives the default view and a bench is at its widest in
       some other state. It costs nothing on a wide canvas: fitDist takes
       the LARGER of dist and the fit, so a roomy canvas never notices. */
    camera: { dist: 23.5, fitWidth: 22, yaw: 0.20, pitch: 0.72,
      target: [0, 1.4, 1.6], min: 9, max: 50 }
  };
}
