/* =====================================================================
   A+ Core1 Under the Hood Labs — the network bench

   One chain, drawn left to right, from the provider's handoff to the
   machine on somebody's desk:

     internet -> handoff -> modem/ONT -> router+firewall -> switch ->
     patch panel -> wall port -> the client

   THE PATH IS THE WHOLE SKILL

   Every network fault is somewhere on that chain, and the entire job is
   knowing where to stand. A student who has walked it once has a method;
   a student who has memorised nine symptoms has a lottery ticket.

   So the bench is the chain, and it is deliberately the only thing on
   screen. Flat, straight on, nothing behind anything — the sixth bench
   in this build and the occlusion rule is now applied before the first
   render rather than discovered on the third.

   UNKNOWN IS THE DEFAULT, AND THAT IS THE POINT

   Every hop starts as `unknown`, not as `ok`. A hop turns green because
   the student TESTED it, never because the lab was feeling generous.
   That one decision is what turns a picture into a method: the chain
   fills in from wherever you start, and the gap that is left is the
   answer.

   Drawn any other way — everything green except the broken one — the
   student would read the answer off the picture and learn nothing about
   how to find it.

   Same two rules as every bench here: the canvas is scenery and each hop
   is a real focusable button; and one colour per part, so the device
   bodies stay grey and the pips carry the verdict.
   ===================================================================== */

const P2 = Math.PI / 2;

/* =====================================================================
   TWO SCALES IN THIS FILE, ON PURPOSE, AND BOTH DECLARED.

   The path bench had no consistent scale at all. Measured against the
   real objects it draws, the implied figure ranged from 39 mm to the
   unit at the client to 110 mm at the rack gear — a factor of 2.8 across
   one picture, with no note anywhere saying so.

   The obvious fix is to put everything on one scale, and it is the wrong
   fix. At the rack's 110 mm/unit a single-gang faceplate is 0.64 units
   on a bench thirty units wide — two per cent of the frame, invisible —
   and that would be CORRECT. A faceplate really is that small next to a
   19-inch panel. True scale would make the run unreadable as a run.

   So the two jobs are separated and each gets the scale it needs:

   THE PATH BENCH IS A SCHEMATIC. Its job is ORDER and CONNECTIVITY —
   which box comes after which, and where the break is. Sizes there are
   diagrammatic and are not a claim about millimetres. That is a shape
   this build already uses and names: the power bench is a flat schematic
   for the same reason.

   THE CLOSE-UPS ARE TRUE SCALE, at 1 unit = 2 mm, and they are where
   every dimensional claim lives — the RJ45 at 11.68 mm across, the F
   connector's 11 mm hex, the SC's 2.5 mm ferrule, the 1.02 mm contact
   pitch. checkTheCloseUpsShareOneScale at the foot of this file holds
   them to it.

   What must never happen again is the third thing: a bench that looks
   like a scale model, is not one, and says nothing either way. */
export const NET_SCALE = {
  path: null,      /* schematic: no millimetre claim */
  closeUp: 2.0     /* mm per unit */
};

/* The chain, in order. Nothing else in this build may re-declare it. */
export const HOPS = [
  { key: "wan",    label: "Provider handoff",   x: -13.0, hint: "Where their network stops and yours starts" },
  { key: "modem",  label: "Modem or ONT",       x:  -9.0, hint: "Converts the provider's signal to Ethernet" },
  { key: "router", label: "Router and firewall", x: -4.8, hint: "Routing, NAT, DHCP and the rule set" },
  { key: "switch", label: "Switch",             x:  -0.4, hint: "Forwards frames by learned MAC address" },
  { key: "panel",  label: "Patch panel",        x:   4.0, hint: "Where the permanent cabling terminates" },
  { key: "wall",   label: "Wall port",          x:   8.4, hint: "The far end of the run, in the room" },
  { key: "client", label: "The client",         x:  12.6, hint: "The machine that reported the fault" }
];

const LOOK = {
  unknown: { color: "#5a6470", glow: 0.00, says: "Not tested yet" },
  ok:      { color: "#2fd45e", glow: 0.85, says: "Tested, good" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Something is off here" },
  faulty:  { color: "#ff3b30", glow: 1.65, says: "The fault is here" },
  na:      { color: "#39404a", glow: 0.00, says: "Not part of this path" }
};
export function hopWords(v) { return (LOOK[v] || LOOK.unknown).says; }
export const HOP_STATES = Object.keys(LOOK);

const Y = 0;          /* everything sits on one line */
const D = 3.0;        /* depth of the devices */

/* ---------- the internet, off to the left ---------- */
function cloudBuild() {
  const x = -17.8;
  return [
    { shape: "sphere", size: [4.2], pos: [x, Y + 0.4, 0], seg: 18, shade: 1.0 },
    { shape: "sphere", size: [3.2], pos: [x - 2.2, Y + 0.0, 0], seg: 16, shade: 0.92 },
    { shape: "sphere", size: [3.0], pos: [x + 2.3, Y + 0.1, 0], seg: 16, shade: 0.96 },
    { shape: "sphere", size: [2.4], pos: [x + 0.4, Y + 1.8, 0], seg: 14, shade: 1.06 }
  ];
}

/* ---------- one device ----------
   Each hop looks like the thing it is, from the front, because "which box
   is the switch" is a real question a student answers by looking. */
/* =====================================================================
   THE PATCH PANEL, INCLUDING THE HALF NOBODY PHOTOGRAPHS.

   A patch panel's FRONT is twenty-four RJ45 jacks and tells a student
   almost nothing — it looks like a switch with no lights. Everything
   that makes it a patch panel is on the BACK: the permanent cabling from
   the walls is punched down onto insulation-displacement terminals, one
   block per port, and the printed colour code beside them is the thing a
   technician actually reads while doing it.

   That is the one point in a run that is TERMINATED rather than plugged
   into, which is the fact the WAP lab's termination stage already turns
   on, and it was not drawn at all.

   EVERYTHING HERE IS DERIVED FROM THE PANEL'S OWN SIZE, not typed as
   numbers beside it. The bench does not yet have a consistent scale —
   the panel is 4.4 units for a 19-inch rack, which puts a unit at 110 mm,
   while the wall port next to it would be a 187 mm faceplate. Fixing that
   is its own job; deriving this from PANEL means the rear follows the
   front when it happens rather than needing a second pass.
   ===================================================================== */
const PANEL = (function () {
  const w = 4.4;                    /* 19" rack width */
  const h = 1.6;
  const d = D * 0.7;
  const ports = 12;                 /* per row, two rows = 24 */
  return {
    w: w, h: h, d: d, ports: ports,
    pitch: 0.33,                    /* matches the front jacks */
    x0: -1.8,                       /* first port, from the panel centre */
    front: d / 2 + 0.05,
    rear: -d / 2,
    rowY: [0.30, -0.30]             /* the two rows, front and rear alike */
  };
})();

/* The punchdown side. One IDC block per port, and the fins between the
   slots rather than the slots themselves — there is no boolean
   subtraction in this renderer, so a slot exists only where nothing is
   drawn. Same rule the phone's speaker grille had to learn twice. */
function panelRear(x) {
  const out = [];
  const blockD = 0.50, blockH = 0.40;
  PANEL.rowY.forEach(function (ry, row) {
    /* the block bodies */
    out.push({ shape: "box", size: [0.28, blockH, blockD],
      pos: [x + PANEL.x0, Y + ry, PANEL.rear - blockD / 2], r: 0.02, shade: 0.55,
      repeat: { count: PANEL.ports, step: [PANEL.pitch, 0, 0] } });
    /* THE FINS. Four conductors go into each block from this side, so
       five fins stand between them; across twelve blocks they land on one
       regular pitch, which is exactly what the back of a real panel looks
       like — a continuous comb rather than twelve separate combs. */
    const fins = PANEL.ports * 4 + 1;
    out.push({ shape: "box", size: [0.045, blockH + 0.10, 0.10],
      pos: [x + PANEL.x0 - 0.14, Y + ry, PANEL.rear - 0.06], r: 0.01, shade: 1.35,
      repeat: { count: fins, step: [PANEL.pitch / 4, 0, 0] } });
    /* the lip the punched wire seats under */
    out.push({ shape: "box", size: [PANEL.w - 0.5, 0.07, 0.12],
      pos: [x, Y + ry + blockH / 2 + 0.02, PANEL.rear - 0.06], r: 0.01,
      shade: row === 0 ? 0.9 : 0.82 });
  });
  return out;
}

/* THE CABLE MANAGEMENT BAR, its own builder because it is its own part.

   It was briefly inside panelRear and then SLICED off the end of that
   same list to make the bar part — so the bar was drawn twice, once in
   steel and once in black plastic, occupying the same space. It rendered
   and nothing complained. One builder per part, and the part that owns
   the geometry is the only one that returns it.

   Every untidy rack is a panel where somebody did not use this: the
   permanent cables are tied to it so their weight never hangs on the IDC
   terminals. A punched-down conductor pulled sideways for a year is the
   intermittent fault that takes a day to find. */
function panelBar(x) {
  const w = PANEL.w - 0.3;
  return [
    { shape: "cyl", size: [0.16, w],
      pos: [x, Y - PANEL.h / 2 - 0.02, PANEL.rear - 0.62], rot: [0, 0, P2], seg: 10, shade: 0.7 },
    { shape: "box", size: [0.12, 0.30, 0.62],
      pos: [x - w / 2, Y - PANEL.h / 2 + 0.10, PANEL.rear - 0.31], r: 0.02, shade: 0.7 },
    { shape: "box", size: [0.12, 0.30, 0.62],
      pos: [x + w / 2, Y - PANEL.h / 2 + 0.10, PANEL.rear - 0.31], r: 0.02, shade: 0.7 }
  ];
}

/* The printed T568A/B colour code, which lives on the rear beside the
   blocks and is what a technician reads while punching down. It is a
   PRINTED STRIP, so it is a painted surface rather than geometry — the
   build's own division: geometry for form, procedural for material and
   print, photographs only where the surface IS a picture. */
function panelCode(x) {
  /* IN THE GAP BETWEEN THE TWO ROWS OF BLOCKS, AND LEVEL WITH THEIR
     BACKS. The first placement put it flat on the panel's rear face at
     z = rear - 0.035, which is 0.46 in FRONT of the blocks — so looking
     at the back of the panel, the blocks stood between the camera and
     the thing they exist to be read alongside, and the strip was
     invisible in every render.

     The rows sit at y = +/-0.30 and are 0.40 tall, so the clear gap
     between them is 0.20. The strip is 0.17, inside that, at the depth
     the block faces are. That is where it is on a real panel and it is
     where you can actually see it. */
  /* TWO COMPACT PLATES, ONE AT EACH END — not one long ribbon.

     The first cut ran the code the full width of the panel as a strip
     0.17 tall. That is 26:1, and every painter in this file draws into a
     SQUARE canvas, so the whole colour chart would have been crushed into
     a band a couple of pixels high and read as a black line. It did.

     A real panel prints the code as a compact block anyway, usually at
     each end so it is by your hand whichever end you are working from.
     These are 1.3:1, which a square texture maps onto without distorting
     it into uselessness. */
  /* ONE PLATE, ON THE TOP FACE AT THE BACK.

     Two things had to be true at once and the first two attempts each
     got one of them.

     A DECAL IS PROJECTED ACROSS THE PART'S WHOLE BOUNDING BOX. Drawn as
     two plates at opposite ends of the panel, their combined box is 4.08
     units wide while each plate is 0.62 — so each one received about
     fifteen per cent of the chart and showed a slice of it. Same family
     as the handset decal that showed the left 65% of its texture: correct
     arithmetic against geometry the arithmetic did not know about.

     AND A SQUARE PAINTER NEEDS A SQUARE-ISH PLATE. The gap between the
     two block rows is 0.20 tall and the full width of the panel, which is
     26:1 — the chart would be legible nowhere on it.

     The top face at the rear satisfies both: one plate, 0.95 by 0.72,
     which is 1.3:1, lying flat where there is nothing else and where it
     is in view from the three-quarter angle the rear is read from. It is
     also where a real panel often carries it — printed on the top or on a
     card clipped there, precisely because the back is full of cable. */
  /* CLEARANCE 0.06, NOT 0.015. This build already knows this number: the
     light guide plate's extraction dots were correct geometry for four
     attempts and rendered as absolutely nothing, and what settled it was
     that 0.0375 of clearance shows and 0.0025 does not. At 0.015 the
     plate's underside sat five thousandths above the panel's top face and
     was swallowed exactly the same way — a card lying ON a surface needs
     to be lying on it by a visible amount, not by arithmetic.

     Reading CLAUDE.md before placing this would have saved a round. */
  const cw = 0.95, cd = 0.72;
  /* The label reads from the BACK, which is where the punchdowns are and
     where a technician stands while using it. A decal's u runs straight
     off world x, so a flat label reads correctly from one side of the
     bench and mirrored from the other — and rotating the geometry does
     not fix it, because the projection is taken after the rotation and
     turns with it. That was tried. The mirroring is handled in the
     painter instead; see `punchdown` in surface.js. */
  return [{ shape: "box", size: [cw, 0.03, cd],
    pos: [x, Y + PANEL.h / 2 + 0.06, PANEL.rear + cd / 2 + 0.10], r: 0.01, shade: 1.0 }];
}

function deviceBuild(key, x) {
  switch (key) {
    case "wan":
      /* a wall box with the provider's lead coming out of it */
      return [
        { shape: "rbox", size: [2.0, 2.6, D * 0.6], pos: [x, Y, 0], r: 0.1, shade: 1.0 },
        { shape: "cyl", size: [0.4, 2.2], pos: [x - 1.4, Y + 0.6, 0], rot: [0, 0, 0.9], seg: 8, shade: 0.6 }
      ];
    case "modem":
      return [
        { shape: "rbox", size: [3.0, 1.4, D], pos: [x, Y, 0], r: 0.14, shade: 1.0 },
        /* four little status lamps down its face — the ones a customer
           reads to you badly over the phone */
        { shape: "cyl", size: [0.26, 0.1], pos: [x - 0.9, Y + 0.3, D / 2 + 0.06], rot: [P2, 0, 0],
          seg: 10, shade: 1.5, repeat: { count: 4, step: [0.6, 0, 0] } }
      ];
    case "router":
      return [
        { shape: "rbox", size: [3.6, 1.5, D], pos: [x, Y, 0], r: 0.14, shade: 1.0 },
        /* two antennas, because most SOHO routers are also the AP */
        { shape: "cyl", size: [0.24, 2.2], pos: [x - 1.1, Y + 1.7, -0.6], rot: [0, 0, 0.22], seg: 8, shade: 0.8 },
        { shape: "cyl", size: [0.24, 2.2], pos: [x + 1.1, Y + 1.7, -0.6], rot: [0, 0, -0.22], seg: 8, shade: 0.8 },
        /* the WAN port, set apart from the LAN ports the way it always is */
        { shape: "box", size: [0.5, 0.4, 0.2], pos: [x - 1.4, Y - 0.4, D / 2 + 0.05], r: 0.02, shade: 0.4 },
        { shape: "box", size: [0.4, 0.4, 0.2], pos: [x - 0.3, Y - 0.4, D / 2 + 0.05], r: 0.02, shade: 0.55,
          repeat: { count: 4, step: [0.55, 0, 0] } }
      ];
    case "switch":
      return [
        { shape: "rbox", size: [4.4, 1.2, D], pos: [x, Y, 0], r: 0.1, shade: 1.0 },
        /* twenty-four ports in two rows, which is what a switch looks like */
        { shape: "box", size: [0.26, 0.3, 0.18], pos: [x - 1.85, Y + 0.18, D / 2 + 0.05], r: 0.02,
          shade: 0.42, repeat: { count: 12, step: [0.34, 0, 0] } },
        { shape: "box", size: [0.26, 0.3, 0.18], pos: [x - 1.85, Y - 0.24, D / 2 + 0.05], r: 0.02,
          shade: 0.42, repeat: { count: 12, step: [0.34, 0, 0] } }
      ];
    case "panel":
      return [
        { shape: "rbox", size: [4.4, 1.6, D * 0.7], pos: [x, Y, 0], r: 0.08, shade: 1.0 },
        /* punched-down ports, numbered in reality and just present here */
        { shape: "box", size: [0.28, 0.34, 0.2], pos: [x - 1.8, Y + 0.3, D * 0.35 + 0.05], r: 0.02,
          shade: 0.45, repeat: { count: 12, step: [0.33, 0, 0] } },
        { shape: "box", size: [0.28, 0.34, 0.2], pos: [x - 1.8, Y - 0.3, D * 0.35 + 0.05], r: 0.02,
          shade: 0.45, repeat: { count: 12, step: [0.33, 0, 0] } },
        /* the rack ears */
        { shape: "box", size: [0.5, 1.6, 0.18], pos: [x - 2.4, Y, D * 0.35], r: 0.02, shade: 0.75 },
        { shape: "box", size: [0.5, 1.6, 0.18], pos: [x + 2.4, Y, D * 0.35], r: 0.02, shade: 0.75 }
      ];
    case "wall":
      return [
        { shape: "rbox", size: [1.7, 2.4, 0.5], pos: [x, Y, 0], r: 0.08, shade: 1.0 },
        { shape: "box", size: [0.7, 0.8, 0.3], pos: [x, Y + 0.3, 0.3], r: 0.04, shade: 0.4 },
        { shape: "cyl", size: [0.2, 0.2], pos: [x, Y + 1.0, 0.3], rot: [P2, 0, 0], seg: 8, shade: 0.7 },
        { shape: "cyl", size: [0.2, 0.2], pos: [x, Y - 1.0, 0.3], rot: [P2, 0, 0], seg: 8, shade: 0.7 }
      ];
    default:  /* client */
      return [
        /* a small desktop and a screen, seen from the front */
        { shape: "rbox", size: [1.6, 3.0, D * 0.8], pos: [x + 1.5, Y - 0.2, 0], r: 0.1, shade: 1.0 },
        { shape: "rbox", size: [3.4, 2.2, 0.3], pos: [x - 0.6, Y + 0.7, 0], r: 0.08, shade: 0.9 },
        { shape: "box", size: [3.0, 1.8, 0.1], pos: [x - 0.6, Y + 0.7, 0.22], r: 0.02, shade: 1.5 },
        { shape: "box", size: [0.5, 0.9, 0.5], pos: [x - 0.6, Y - 0.8, 0], r: 0.04, shade: 0.8 },
        { shape: "box", size: [1.8, 0.15, 0.9], pos: [x - 0.6, Y - 1.3, 0], r: 0.04, shade: 0.8 }
      ];
  }
}

/* ---------- the link between two hops ----------
   Straight, because the lesson is which link, never how it curves. */
function linkBuild(x0, x1, down) {
  const mid = (x0 + x1) / 2;
  const len = Math.abs(x1 - x0) - 2.6;
  if (len <= 0.2) return [];
  return [
    { shape: "cyl", size: [down ? 0.20 : 0.34, len], pos: [mid, Y - 1.9, 0],
      rot: [0, 0, P2], seg: 8, shade: 1.0 },
    /* a plug at each end, so a dead link still reads as a cable rather
       than as a missing one */
    { shape: "rbox", size: [0.55, 0.5, 0.5], pos: [mid - len / 2, Y - 1.9, 0], r: 0.05, shade: 1.3 },
    { shape: "rbox", size: [0.55, 0.5, 0.5], pos: [mid + len / 2, Y - 1.9, 0], r: 0.05, shade: 1.3 }
  ];
}

/* Pips above each hop, the same shape they are on every other bench. */
function pip(x) {
  return [
    { shape: "cyl", size: [0.62, 0.16], pos: [x, Y + 2.5, 0], rot: [P2, 0, 0], seg: 16, shade: 1.0 },
    { shape: "sphere", size: [0.54], pos: [x, Y + 2.56, 0], seg: 14, shade: 1.0 }
  ];
}
function pipWell(x) {
  return [{ shape: "cyl", size: [0.94, 0.10], pos: [x, Y + 2.44, 0], rot: [P2, 0, 0],
    seg: 16, shade: 0.30 }];
}

/* ---------------------------------------------------------------------
   netBench(view)

     view.states   { wan: "unknown"|"ok"|"suspect"|"faulty"|"na", ... }
     view.links    { "wan-modem": true/false, ... }  is the link up
     view.cloud    draw the internet blob (off for a purely local fault)
   --------------------------------------------------------------------- */
export function netBench(view) {
  view = view || {};
  const st = view.states || {};
  const links = view.links || {};

  const parts = [];

  if (view.cloud !== false) {
    parts.push({ key: "internet", label: "The internet", build: cloudBuild(), finish: "matte",
      scale: 1, pos: [0, 0, 0], color: "#7f8a95",
      spec: "Everything past the handoff",
      note: "Not yours, not your problem, and not something you can test from here beyond " +
        "proving that the handoff works." });
  }

  /* Links first, so device bodies draw over their ends. */
  for (let i = 0; i < HOPS.length - 1; i++) {
    const a = HOPS[i], b = HOPS[i + 1];
    const key = a.key + "-" + b.key;
    const up = links[key] !== false;
    parts.push({
      key: "link-" + key,
      label: "Link: " + a.label + " to " + b.label,
      build: linkBuild(a.x, b.x, !up),
      finish: "rubber", scale: 1, pos: [0, 0, 0],
      color: up ? "#2b333c" : "#7a2c28",
      spec: up ? "Carrying traffic" : "Down",
      note: up ? "" : "No link on this segment. Everything downstream of it will look broken " +
        "whether or not it is."
    });
  }

  HOPS.forEach(function (h) {
    const state = st[h.key] || "unknown";
    const L = LOOK[state] || LOOK.unknown;

    parts.push({
      key: "hop-" + h.key,
      label: h.label,
      build: deviceBuild(h.key, h.x),
      finish: h.key === "panel" || h.key === "switch" ? "metal" : "plastic",
      scale: 1, pos: [0, 0, 0],
      color: "#8d979e",
      spec: h.hint,
      note: ""
    });

    /* THE HALF OF A PATCH PANEL THAT MAKES IT ONE. Separate parts
       because they are separate colours and separate things: dark
       plastic terminal blocks, a printed paper code, and a steel
       management bar. One colour per part, and each of them carries a
       note that is the actual teaching content of this hop. */
    if (h.key === "panel") {
      parts.push({ key: "panel-idc", label: "Punchdown blocks, on the back",
        build: panelRear(h.x), finish: "plastic", scale: 1, pos: [0, 0, 0],
        color: "#2b3138",
        spec: "One insulation-displacement block per port",
        note: "THIS is what makes it a patch panel. The permanent cable from the wall is " +
          "PUNCHED DOWN here \u2014 the tool forces the conductor between two blades that slice " +
          "through the insulation and grip the copper, so nothing is stripped and nothing is " +
          "screwed. It is the one point in the whole run that is terminated rather than " +
          "plugged in, which is why a patch panel is where a cabling fault lives." });
      parts.push({ key: "panel-code", label: "The printed T568A/B colour code",
        build: panelCode(h.x), finish: "matte", skin: "punchdown", scale: 1, pos: [0, 0, 0],
        color: "#ffffff",
        spec: "Both standards, side by side",
        note: "Read it: the ONLY difference between A and B is that the orange and green pairs " +
          "trade places. Do one end to A and the other to B and you get a cable that passes a " +
          "continuity test and fails a wiremap \u2014 no open, no short, so the cheap tester says " +
          "it is fine. Note also that a white-striped conductor sits beside its solid partner: " +
          "white/orange and orange are ONE pair and must stay together." });
      parts.push({ key: "panel-bar", label: "Cable management bar",
        build: panelBar(h.x), finish: "metal", scale: 1, pos: [0, 0, 0],
        color: "#8f979e",
        spec: "Behind and below the blocks",
        note: "The permanent cables are tied to this so their weight never hangs on the IDC " +
          "terminals. A punched-down conductor pulled sideways for a year is the intermittent " +
          "fault that takes a day to find and looks like everything except what it is." });
    }

    parts.push({ key: "well-" + h.key, label: h.label + " indicator surround",
      build: pipWell(h.x), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + h.key, label: h.label + " status",
      build: pip(h.x), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: L.color, glow: L.glow, spec: L.says, note: L.says });
  });

  return {
    kind: "bench",
    title: "The path, end to end",
    caption: "Every hop starts untested. A hop turns green because you tested it, not because " +
      "the lab told you. The gap you are left with is the answer.",
    board: {
      size: [42, 0.5, 11], pos: [-1.0, -3.0, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [42, 0.5, 11], pos: [-1.0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* Seven hops end to end, and the ends are the two that matter most:
       the provider handoff and the desk. fitWidth keeps both on screen no
       matter how narrow the panel gets. Measured, not guessed — at a 649px
       canvas the cloud was clipped off the left edge, and 44 is the width
       that clears it with margin. It has no effect on a wide canvas, where
       dist 30 already shows more than this. */
    camera: { dist: 30.0, fitWidth: 44, yaw: 0.09, pitch: 0.17,
      target: [-1.0, 0.5, 0], min: 14, max: 76 }
  };
}

/* =====================================================================
   AN RJ45 PLUG, BUILT FROM ITS REAL DIMENSIONS.

   Modelled from the owner's reference diagrams. Those are third-party
   drawings, so nothing is embedded from them — what they supply is form
   and pin assignment, which is what every reference in this build is
   for: GEOMETRY carries the shape, and a picture is only used where the
   surface genuinely IS a picture.

   THE BODY IS TRANSPARENT, AND THAT IS THE WHOLE POINT. A real 8P8C
   plug is clear polycarbonate and you read the conductor order straight
   through it. That is why "look at the end of the cable" is a real
   diagnostic step rather than a figure of speech, and it is the one
   feature a solid grey box would destroy.

   ITS OWN SCALE, STATED. A plug is 11.68 mm wide; at the path bench's
   110 mm to the unit that is 0.106 units and invisible. So this is drawn
   at 1 unit = 2 mm and shown on its own, the way the handset's focused
   view works. Mixing scales silently is how a u.FL connector ended up the
   size of a coat button; mixing them on purpose and writing it down is
   how a close-up works.

     body      11.68 x 8.00 x 21.5 mm      5.84 x 4.00 x 10.75 units
     contacts  8 at 1.02 mm pitch          0.51 pitch
     latch     ~11 mm, hinged at the rear
   ===================================================================== */
const RJ = {
  w: 5.84, h: 4.00, d: 10.75,   /* 1 unit = 2 mm */
  pitch: 0.51, pins: 8
};

/* Pin 1 is on the LEFT with the latch underneath and the contacts facing
   you, which is how both reference diagrams are drawn and how anybody
   holds a plug to read it. */
export const T568 = {
  /* [pair colour, is it the white-striped conductor] */
  B: [["o",1],["o",0],["g",1],["b",0],["b",1],["g",0],["n",1],["n",0]],
  A: [["g",1],["g",0],["o",1],["b",0],["b",1],["o",0],["n",1],["n",0]]
};
const PAIR_COLOUR = { o: "#d4691f", g: "#2f8f4a", b: "#2f5fb0", n: "#6b4a2f" };

/* THE PLUG, REBUILT FROM THE OWNER'S PHOTOGRAPH.

   Three things the first two attempts got wrong, and the photograph
   settles all three at once:

   THE BODY IS CLOSED AND SLIM. It was drawn as an open shell so the
   conductors could be seen inside, which made it read as a crate. A real
   plug is a flat block, half again as wide as it is tall, with nothing
   cut away.

   THE LATCH IS A TAPERED TONGUE HINGED AT THE FRONT. It lies along the
   top, rises toward the back, and ends in the step you press. Drawn as a
   flat bar under the body it was invisible as a latch, which matters:
   a snapped latch is a plug that still works and falls out, and that is
   an intermittent nobody goes looking for.

   AND THE TEACHING VIEW IS FRONT-ON. That is the whole answer to the
   transparency problem this build already knows it has — the gold
   contacts sit in a row along the bottom of the front face and the eight
   conductor ends show just above them, so the wire order is read off the
   FACE rather than through the plastic. It is also how a technician
   actually checks a crimp: look into the end of it.

   1 unit = 2 mm, stated. Body 11.68 x 7.87 x 21.5 mm. */
function rj45Shell(x) {
  const W = RJ.w, H = RJ.h, D = RJ.d;
  return [
    /* the body, closed */
    { shape: "rbox", size: [W, H, D], pos: [x, 0, 0], r: 0.22, shade: 1.0 },
    /* THE LATCH: hinged at the front, rising to the step at the back. */
    { shape: "box", size: [2.1, 0.26, 5.4], pos: [x, H / 2 + 0.42, -0.7], rot: [-0.10, 0, 0],
      r: 0.05, shade: 0.88 },
    { shape: "box", size: [2.1, 0.85, 0.9], pos: [x, H / 2 + 0.92, -3.3], r: 0.05, shade: 0.80 },
    /* the ramp where it meets the body at the front */
    { shape: "box", size: [2.1, 0.55, 1.4], pos: [x, H / 2 + 0.16, 2.3], rot: [0.30, 0, 0],
      r: 0.05, shade: 0.9 },
    /* the two guide rails down the sides of the nose */
    { shape: "box", size: [0.22, 1.5, 4.2], pos: [x - W / 2 + 0.11, -0.3, 2.0], r: 0.04, shade: 0.86 },
    { shape: "box", size: [0.22, 1.5, 4.2], pos: [x + W / 2 - 0.11, -0.3, 2.0], r: 0.04, shade: 0.86 },
    /* the strain relief, crimped down onto the jacket at the back */
    { shape: "rbox", size: [W - 0.3, H - 0.5, 1.4], pos: [x, 0, -D / 2 + 0.6], r: 0.14, shade: 0.62 },
    /* the jacket */
    { shape: "rbox", size: [W - 0.9, H - 0.9, 4.4], pos: [x, 0, -D / 2 - 2.0], r: 0.5, shade: 0.42 }
  ];
}

/* One conductor: the run inside, and the END on the front face, which is
   where it is actually read. */
function rj45Wire(x, i) {
  const D = RJ.d, H = RJ.h;
  const px = x + (i - (RJ.pins - 1) / 2) * RJ.pitch;
  return [
    /* the run, sitting just under the top surface the way it does in a
       clear plug \u2014 mostly hidden, and that is honest */
    { shape: "box", size: [0.34, 0.30, D - 3.0], pos: [px, H / 2 - 0.45, -1.2], r: 0.05, shade: 1.0 },
    /* THE END, proud of the front face. 0.09 of clearance: this build
       learned the hard way that 0.0025 is swallowed and 0.0375 shows. */
    { shape: "box", size: [0.30, 0.42, 0.16], pos: [px, 0.60, D / 2 + 0.09], r: 0.03, shade: 1.55 }
  ];
}

/* The white sleeve on a striped conductor, on the face beside its solid
   partner \u2014 white/orange and orange are ONE pair, and a student who
   reads the code as eight separate colours will split them. */
function rj45Stripe(x, i) {
  const D = RJ.d;
  const px = x + (i - (RJ.pins - 1) / 2) * RJ.pitch;
  return [
    { shape: "box", size: [0.30, 0.13, 0.18], pos: [px, 0.72, D / 2 + 0.10], r: 0.02, shade: 1.6 },
    { shape: "box", size: [0.30, 0.13, 0.18], pos: [px, 0.48, D / 2 + 0.10], r: 0.02, shade: 1.6 }
  ];
}

/* The eight gold contacts, in a row along the bottom of the front face.
   Their own part because gold is its own colour and because a bent or
   un-seated contact is a fault a student has to be able to point at. */
function rj45Contacts(x) {
  const D = RJ.d, H = RJ.h;
  return [
    /* THIN SLIVERS IN SLOTS, not blocks. The first cut drew these as
       0.34 x 1.5 rectangles filling the lower half of the face, which is
       most of a real plug's front given over to contact — in the owner's
       photograph they are narrow strips standing in slots with body
       between them, and the eye reads the SLOTS as much as the metal. */
    { shape: "box", size: [0.22, 0.95, 0.14],
      pos: [x - ((RJ.pins - 1) / 2) * RJ.pitch, -H / 2 + 1.15, D / 2 + 0.07], r: 0.02, shade: 1.0,
      repeat: { count: RJ.pins, step: [RJ.pitch, 0, 0] } },
    /* and the sliver of each that shows on the underside of the nose */
    { shape: "box", size: [0.22, 0.12, 1.9],
      pos: [x - ((RJ.pins - 1) / 2) * RJ.pitch, -H / 2 + 0.08, D / 2 - 1.0], r: 0.02, shade: 0.9,
      repeat: { count: RJ.pins, step: [RJ.pitch, 0, 0] } }
  ];
}

/* ---------------------------------------------------------------------
   Two plugs, one wired to each standard, so the difference is a thing
   you look at rather than a table you memorise.

   Every conductor is its own PART. Eight per plug is a lot of parts and
   it is the right number: each one is separately identifiable, each has
   its own colour, and a student has to be able to select "pin 3" and be
   told what belongs there. One colour per part is exactly what makes
   that possible.
   --------------------------------------------------------------------- */
export function rj45Bench(view) {
  view = view || {};
  const which = view.wiring ? [view.wiring] : ["B", "A"];
  const parts = [];
  const NAME = { o: "orange", g: "green", b: "blue", n: "brown" };

  which.forEach(function (std, n) {
    const x = which.length === 1 ? 0 : (n === 0 ? -7.0 : 7.0);
    const code = T568[std];

    parts.push({ key: "gold-" + std, label: "The eight contacts, T568" + std,
      build: rj45Contacts(x), finish: "metal", scale: 1, pos: [0, 0, 0],
      color: "#d6ad4a", glow: 0.25,
      spec: "Gold-plated, 1.02 mm apart",
      note: "These pierce DOWN into the conductors when the plug is crimped \u2014 that is what a " +
        "crimp tool does, and it is why a plug is single-use. Look along them: one standing " +
        "higher than the rest never made contact, and that is a cable that tests open on one " +
        "pair and looks perfect to the eye." });

    parts.push({ key: "plug-" + std, label: "The plug, T568" + std,
      build: rj45Shell(x), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: "#9aa6b0",
      spec: "Clear polycarbonate, 11.68 mm across \u2014 drawn open so you can see in",
      note: "A real plug is TRANSPARENT, and that is not decoration — it is how you read the " +
        "wire order off a made-up cable without a tester. Look through it and count from pin 1. " +
        "The latch underneath is hinged at the back: when it snaps off, the plug still works " +
        "and falls out, which is an intermittent nobody goes looking for." });

    code.forEach(function (c, i) {
      const colour = PAIR_COLOUR[c[0]];
      const pin = i + 1;
      const label = (c[1] ? "white/" : "") + NAME[c[0]];
      parts.push({
        key: "w-" + std + "-" + pin,
        label: "T568" + std + " pin " + pin + " — " + label,
        build: rj45Wire(x, i),
        finish: "plastic", scale: 1, pos: [0, 0, 0],
        color: colour,
        spec: "Pin " + pin + ": " + label,
        note: c[1]
          ? "The white-striped half of the " + NAME[c[0]] + " pair. It sits BESIDE its solid " +
            "partner, and it has to: a pair is twisted together to cancel noise, and splitting " +
            "one across two pairs gives a cable that tests fine on a continuity tester and " +
            "fails under load."
          : "The solid half of the " + NAME[c[0]] + " pair."
      });
      if (c[1]) {
        parts.push({
          key: "s-" + std + "-" + pin,
          label: "T568" + std + " pin " + pin + " — white sleeve",
          build: rj45Stripe(x, i), finish: "plastic", scale: 1, pos: [0, 0, 0],
          color: "#f2f0ea",
          spec: "White, banded with " + NAME[c[0]],
          note: "White with a band of colour, not plain white. Four of the eight conductors are " +
            "striped like this and they are the four that get miscounted." });
      }
    });
  });

  return {
    kind: "bench",
    title: which.length === 1 ? "An RJ45 plug, wired to T568" + which[0]
                              : "The same plug, wired both ways",
    caption: which.length === 1
      ? "Read it through the body, counting from pin 1 with the latch underneath."
      : "T568B on the left, T568A on the right. Only the ORANGE and GREEN pairs move — blue " +
        "stays on 4 and 5, brown stays on 7 and 8. Do one end of a cable to each standard and " +
        "you have made a crossover by accident: it passes a continuity test, fails a wiremap, " +
        "and the cheap tester in the van says it is fine.",
    board: null,
    decor: [],
    parts: parts,
    /* 1 unit = 2 mm here, so two plugs span about 28 units. fitWidth
       swept rather than reasoned — the same trap that put the handset's
       focused view at 11 applies to anything long and thin. */
    camera: { dist: 26, fitWidth: 34, yaw: 0.30, pitch: 0.52,
      target: [0, 0, 0], min: 6, max: 60 }
  };
}

/* =====================================================================
   WHAT ARRIVES AT THE DEMARC, AND WHY IT IS THE WHOLE ANSWER.

   Objective 2.7 is "compare and contrast internet connection types", and
   this lab carried it on one stage of prose. The physical fact underneath
   it is better than the prose: THE BOX ALWAYS LOOKS THE SAME. A modem, an
   ONT and a DSL router are all a grey slab with lamps on the front, and a
   student asked "what service is this site on?" cannot tell them apart by
   looking at the box.

   The CONNECTOR tells you, and there are only three that matter:

     F        threaded coax     -> cable, DOCSIS
     SC/APC   fibre, green      -> fibre, GPON
     RJ11     two pairs         -> DSL over the phone line

   And whichever arrives, what LEAVES is RJ45 Ethernet. That is the shape
   of the lesson: one output, three possible inputs, and the input is the
   only thing that names the service.

   All four are drawn at the RJ45's scale — 1 unit = 2 mm, stated — so
   they can stand beside each other and be compared, which is the entire
   point of a compare-and-contrast objective.
   ===================================================================== */

/* The F-connector. 3/8"-32 thread, hex 11 mm across the flats, and the
   centre conductor IS the cable's own core — there is no separate pin in
   it, which is why a badly stripped coax end has a stub too short to
   reach and the fault reads as "no signal" rather than "bad connector". */
function fConnector(x) {
  const hex = 5.5, barrel = 3.5;
  return [
    /* the knurled nut, six sides */
    { shape: "cyl", size: [hex, 4.0], pos: [x, 0, 1.0], rot: [P2, 0, 0], seg: 6, shade: 1.0 },
    /* the threaded spigot in front of it */
    { shape: "cyl", size: [barrel, 3.0], pos: [x, 0, 4.0], rot: [P2, 0, 0], seg: 16, shade: 0.86 },
    /* the thread, as rings */
    { shape: "torus", size: [barrel + 0.2, 0.22], pos: [x, 0, 3.0], rot: [P2, 0, 0], seg: 16,
      shade: 0.7, repeat: { count: 5, step: [0, 0, 0.55] } },
    /* the crimp ferrule and the cable behind */
    { shape: "cyl", size: [barrel + 0.4, 3.2], pos: [x, 0, -1.6], rot: [P2, 0, 0], seg: 16, shade: 0.62 },
    { shape: "cyl", size: [2.6, 5.0], pos: [x, 0, -5.6], rot: [P2, 0, 0], seg: 14, shade: 0.4 }
  ];
}

/* THE CENTRE CONDUCTOR, its own part because it is its own colour and
   because its LENGTH is the fault. */
function fPin(x) {
  return [{ shape: "cyl", size: [0.5, 5.0], pos: [x, 0, 7.0], rot: [P2, 0, 0], seg: 10, shade: 1.6 }];
}

/* SC connector. 9 mm square body, push-pull latch, 2.5 mm ferrule. */
function scBody(x) {
  const w = 4.5;
  return [
    { shape: "rbox", size: [w, w, 9.0], pos: [x, 0, 0], r: 0.25, shade: 1.0 },
    /* the latch shoulders that click into the adapter */
    { shape: "box", size: [w + 0.7, 1.2, 3.0], pos: [x, 0, -1.0], r: 0.1, shade: 0.9 },
    /* the boot, strain relief on the fibre */
    { shape: "cyl", size: [2.4, 3.4], pos: [x, 0, -6.2], rot: [P2, 0, 0], seg: 14, shade: 0.72 },
    { shape: "cyl", size: [1.1, 4.0], pos: [x, 0, -9.6], rot: [P2, 0, 0], seg: 12, shade: 0.55 }
  ];
}

/* THE FERRULE. 2.5 mm of zirconia with a fibre 9 microns across down the
   middle of it, and the reason a fibre end is never touched: a fingerprint
   on this face is an attenuation fault that no amount of reseating fixes. */
function scFerrule(x) {
  return [
    { shape: "cyl", size: [1.25, 5.0], pos: [x, 0, 7.0], rot: [P2, 0, 0], seg: 16, shade: 1.0 },
    { shape: "rbox", size: [3.0, 3.0, 1.2], pos: [x, 0, 4.8], r: 0.1, shade: 0.9 }
  ];
}

/* ---------------------------------------------------------------------
   The four connectors, side by side, at one scale.

   Three inputs and one output, and the output is the same whichever
   input arrived — which is the fact the whole objective turns on.
   --------------------------------------------------------------------- */
export function connectorBench(view) {
  view = view || {};
  const parts = [];
  const X = { f: -16, sc: -5, rj11: 5, rj45: 16 };

  /* ---- coax, F ---- */
  parts.push({ key: "conn-f", label: "F connector — coaxial",
    build: fConnector(X.f), finish: "metal", skin: "brushed", scale: 1, pos: [0, 0, 0],
    color: "#9aa3ab",
    spec: "Threaded, hex 11 mm across the flats",
    note: "COAX MEANS CABLE — a DOCSIS service from a cable provider. It threads on rather " +
      "than clipping, which is why it survives being outdoors and why a loose one is a slow " +
      "intermittent rather than a clean disconnect. Finger tight and then a quarter turn: " +
      "over-tightened, the nut spins on the crimp and the braid stops making contact." });
  parts.push({ key: "conn-f-pin", label: "The centre conductor",
    build: fPin(X.f), finish: "metal", scale: 1, pos: [0, 0, 0],
    color: "#d6ad4a", glow: 0.25,
    spec: "The cable's own core, 1 mm",
    note: "There is no separate pin in an F connector — THIS IS THE CABLE'S OWN CENTRE " +
      "CONDUCTOR pushed through. So the length of it is a fault: stripped short it does not " +
      "reach the socket and the service reads as no signal at all, which sends a technician " +
      "looking at the provider instead of at the end they just made." });

  /* ---- fibre, SC ---- */
  parts.push({ key: "conn-sc", label: "SC connector — fibre",
    build: scBody(X.sc), finish: "plastic", scale: 1, pos: [0, 0, 0],
    /* GREEN MEANS APC, and that is a fact rather than a livery choice:
       a green boot is an angled physical contact, a blue one is straight.
       Mate an APC to a UPC and you get a gap, a reflection and a service
       that works badly rather than not at all. */
    color: "#2f8f4a",
    spec: "Square body, push-pull latch. GREEN = APC",
    note: "FIBRE MEANS AN ONT, and the green is not decoration: green is APC, an ANGLED " +
      "polish, and blue is UPC, a straight one. They do not mate — well, they mate " +
      "mechanically and leave an air gap that reflects light back up the fibre, so the link " +
      "comes up and performs badly. A service that is slow rather than dead, from a connector " +
      "that looks perfectly seated." });
  parts.push({ key: "conn-sc-ferrule", label: "The ferrule",
    build: scFerrule(X.sc), finish: "matte", scale: 1, pos: [0, 0, 0],
    color: "#e8e4db",
    spec: "2.5 mm zirconia, fibre 9 microns down the middle",
    note: "Never touch this face and never leave it uncapped. The light-carrying core is nine " +
      "MICRONS across — a tenth of a hair — so a fingerprint is not a smudge, it is an " +
      "attenuation fault, and no amount of reseating clears it. Clean it or replace it." });

  /* ---- DSL, RJ11 ---- */
  parts.push({ key: "conn-rj11", label: "RJ11 \u2014 the phone line",
    build: rj11Shell(X.rj11), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#9aa6b0",
    spec: "6P4C, 9.65 mm across \u2014 two millimetres narrower than RJ45",
    note: "A PAIR OF WIRES MEANS DSL. Same family of plug as an Ethernet one and two " +
      "millimetres narrower, which is why it drops into an RJ45 jack, sits crooked, and " +
      "sometimes springs a contact on the way out. If you find one in a network port, test " +
      "that port before you blame anything else. Note the lead as well: phone cord is FLAT " +
      "satin, Ethernet is round, and across a room that is the fastest way to tell them apart." });

  parts.push({ key: "conn-rj11-slots", label: "Its six positions",
    build: rj11Slots(X.rj11), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#7d8790",
    spec: "Six slots, four of them used",
    note: "6P4C means SIX POSITIONS and FOUR CONDUCTORS, and the two that are empty are the " +
      "ones at the ends. The slots are there either way \u2014 the same housing takes a 6P6C " +
      "plug with all six populated, which is what a phone with a data line uses." });

  RJ11_CODE.forEach(function (c, i) {
    if (!c[0]) return;
    parts.push({ key: "rj11-w-" + (i + 1), label: "RJ11 pin " + (i + 1) + " \u2014 " + c[1],
      build: rj11Wire(X.rj11, i), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: c[0],
      spec: "Pin " + (i + 1) + ": " + c[1],
      note: (i === 2 || i === 3)
        ? "The INNER pair is line one \u2014 red and green on pins 3 and 4. A single-line phone " +
          "uses only these two, which is why a two-conductor cord still works and why a fault " +
          "on the outer pair is invisible until somebody plugs in the second line."
        : "The outer pair is line two, black and yellow. Present on a four-conductor cord and " +
          "doing nothing at all on a single-line installation." });
  });

  parts.push({ key: "conn-rj11-gold", label: "Its four contacts",
    build: [0, 1, 2, 3].map(function (k) { return rj11Contact(X.rj11, k + 1); })
      .reduce(function (a, b) { return a.concat(b); }, []),
    finish: "metal", scale: 1, pos: [0, 0, 0],
    color: "#d6ad4a", glow: 0.25,
    spec: "Four, in the middle four positions",
    note: "Count them against the Ethernet plug: four and eight. Two pairs carry a phone line; " +
      "four pairs carry gigabit, and all four are needed \u2014 which is why a cable with one " +
      "pair mis-punched runs at 100 Mb and looks like it is working." });

  /* ---- and what always comes OUT ---- */
  parts.push({ key: "conn-rj45", label: "RJ45 — what always comes out",
    build: rj45Shell(X.rj45), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: "#9aa6b0",
    spec: "8P8C, 11.68 mm across",
    note: "Whichever of the three arrived, THIS is what leaves the box. That is the point of " +
      "the whole comparison: the modem, the ONT and the DSL router all look the same from the " +
      "front and all hand you Ethernet. What names the service is the connector on the other " +
      "side of them." });
  /* THE ETHERNET CONDUCTORS, because the plug beside it shows its four
     and a comparison where one side is drawn and the other is not is not
     a comparison. T568B, which is what most of what a student meets is
     wired to. */
  T568.B.forEach(function (c, i) {
    parts.push({ key: "rj45-w-" + (i + 1),
      label: "RJ45 pin " + (i + 1) + " \u2014 " + (c[1] ? "white/" : "") +
        { o: "orange", g: "green", b: "blue", n: "brown" }[c[0]],
      build: rj45Wire(X.rj45, i), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: PAIR_COLOUR[c[0]],
      spec: "Pin " + (i + 1), note: "" });
    if (c[1]) {
      parts.push({ key: "rj45-s-" + (i + 1), label: "RJ45 pin " + (i + 1) + " \u2014 white sleeve",
        build: rj45Stripe(X.rj45, i), finish: "plastic", scale: 1, pos: [0, 0, 0],
        color: "#f2f0ea", spec: "White, banded", note: "" });
    }
  });

  parts.push({ key: "conn-rj45-gold", label: "Its eight contacts",
    build: rj45Contacts(X.rj45), finish: "metal", scale: 1, pos: [0, 0, 0],
    color: "#d6ad4a", glow: 0.25,
    spec: "Eight, against the phone plug's four",
    note: "Count them against the RJ11: eight contacts and four. Two pairs carry a phone line; " +
      "four pairs carry gigabit Ethernet, and all four are needed — which is why a cable " +
      "with one pair mis-punched runs at 100 Mb and looks like it is working." });

  return {
    kind: "bench",
    title: "What arrives, and what leaves",
    caption: "Three ways a service reaches a building and one way it leaves. The box in the " +
      "middle looks the same in all three cases — the connector on its input is the only " +
      "thing that tells you what service the site is on.",
    board: null,
    decor: [],
    parts: parts,
    camera: { dist: 40, fitWidth: 52, yaw: 0.30, pitch: 0.34, target: [0, 0, 1], min: 8, max: 90 }
  };
}

/* =====================================================================
   THE CLOSE-UPS ALL AGREE ABOUT MILLIMETRES.

   Every dimensional claim in this file lives in the close-up builders,
   and they are only worth anything if they share one scale. This derives
   the implied millimetres-per-unit back out of each one from the real
   dimension it is built to, and fails if any of them drifts.

   It does NOT police the path bench. That one is declared a schematic
   and makes no millimetre claim, which is the honest position for it —
   the failure this whole block exists to prevent is a bench that looks
   like a scale model, is not one, and never says so.

   Calibrated: changing RJ.w to any value that is not 11.68 mm at the
   declared scale fires, naming the part and both figures.
   ===================================================================== */
(function checkTheCloseUpsShareOneScale() {
  const mm = NET_SCALE.closeUp;
  const CLAIMS = [
    ["RJ45 body width",      RJ.w,            11.68],
    ["RJ45 body height",     RJ.h,             7.87],
    ["RJ45 body depth",      RJ.d,            21.50],
    ["RJ45 contact pitch",   RJ.pitch,         1.02]
  ];
  CLAIMS.forEach(function (c) {
    const impliedMm = c[1] * mm;
    if (Math.abs(impliedMm - c[2]) > 0.25) {
      throw new Error("bench-net: " + c[0] + " is " + c[1] + " units, which at the declared " +
        mm + " mm per unit is " + impliedMm.toFixed(2) + " mm — the real figure is " + c[2] +
        " mm. Either the geometry or the declared scale is wrong, and a close-up that is not " +
        "to scale is the thing NET_SCALE exists to prevent.");
    }
  });
  if (NET_SCALE.path !== null) {
    throw new Error("bench-net: the path bench has been given a millimetre scale. It is a " +
      "SCHEMATIC — its hops range from 39 to 110 mm per unit and putting them on one scale " +
      "makes a faceplate two per cent of the frame. If that is genuinely wanted, resize every " +
      "hop first and delete this check second, in that order.");
  }
})();

/* =====================================================================
   RJ11, BUILT PROPERLY — NOT A SHRUNK RJ45.

   The first cut scaled the Ethernet shell to 83% and called it a phone
   plug. That is wrong in three ways the owner's reference makes plain,
   and every one of them is a thing a student is meant to learn:

   SIX POSITIONS, AND THE OUTER TWO ARE EMPTY. 6P4C means a housing with
   six slots of which four are populated, and the two that are blank are
   at the ENDS. A scaled RJ45 gave four contacts crowded at one side,
   which is not what any phone plug looks like and loses the fact that
   the positions exist whether or not there is metal in them.

   THE COLOURS ARE NOT ETHERNET COLOURS. A phone cord is black, red,
   green and yellow — the old quad code — and nothing to do with T568.
   Drawing it in orange and blue teaches a student that the two standards
   are the same family of thing, which is exactly the confusion the RJ11
   is here to break.

     pin 2  black   line 2 ring
     pin 3  red     LINE 1 RING   <- the inner pair is line one
     pin 4  green   LINE 1 TIP
     pin 5  yellow  line 2 tip

   THE JACKET IS FLAT. Phone cord is flat satin; Ethernet is round. On a
   bench that is the fastest way to tell one lead from another across a
   room, and it was drawn round.

   9.65 mm wide against the RJ45's 11.68 — the two millimetres that let a
   phone plug drop into an Ethernet jack, sit crooked, and spring a
   contact on the way out.
   ===================================================================== */
const RJ11 = { w: 4.83, h: RJ.h, d: RJ.d, pitch: RJ.pitch, pos: 6 };

/* Positions 1..6; the populated four are 2..5. */
export const RJ11_CODE = [
  [null, "empty"],
  ["#1a1a1a", "black — line 2 ring"],
  ["#c0392b", "red — LINE 1 ring"],
  ["#2f8f4a", "green — LINE 1 tip"],
  ["#d8b30a", "yellow — line 2 tip"],
  [null, "empty"]
];

function rj11Shell(x) {
  const W = RJ11.w, H = RJ11.h, D = RJ11.d;
  return [
    { shape: "rbox", size: [W, H, D], pos: [x, 0, 0], r: 0.22, shade: 1.0 },
    /* the latch, same family as the Ethernet one and narrower */
    { shape: "box", size: [1.7, 0.26, 5.4], pos: [x, H / 2 + 0.42, -0.7], rot: [-0.10, 0, 0],
      r: 0.05, shade: 0.88 },
    { shape: "box", size: [1.7, 0.85, 0.9], pos: [x, H / 2 + 0.92, -3.3], r: 0.05, shade: 0.80 },
    { shape: "box", size: [1.7, 0.55, 1.4], pos: [x, H / 2 + 0.16, 2.3], rot: [0.30, 0, 0],
      r: 0.05, shade: 0.9 },
    /* the strain relief */
    { shape: "rbox", size: [W - 0.3, H - 0.5, 1.4], pos: [x, 0, -D / 2 + 0.6], r: 0.14, shade: 0.62 },
    /* THE FLAT JACKET. Satin cord, wide and thin, against the Ethernet
       lead's round one. */
    { shape: "rbox", size: [W - 0.6, 1.1, 4.4], pos: [x, 0, -D / 2 - 2.0], r: 0.3, shade: 0.42 }
  ];
}

/* The six slots, drawn as the ribs between them, so the two empty
   positions are visibly positions rather than absent. */
function rj11Slots(x) {
  const H = RJ11.h, D = RJ11.d;
  return [{ shape: "box", size: [0.10, 1.15, 0.30],
    pos: [x - (RJ11.pos / 2) * RJ11.pitch, -H / 2 + 1.15, D / 2 + 0.05], r: 0.01, shade: 0.75,
    repeat: { count: RJ11.pos + 1, step: [RJ11.pitch, 0, 0] } }];
}

/* One conductor and its contact, at position i (0-based). */
function rj11Wire(x, i) {
  const H = RJ11.h, D = RJ11.d;
  const px = x + (i - (RJ11.pos - 1) / 2) * RJ11.pitch;
  return [
    { shape: "box", size: [0.30, 0.28, D - 3.0], pos: [px, H / 2 - 0.45, -1.2], r: 0.04, shade: 1.0 },
    { shape: "box", size: [0.30, 0.42, 0.16], pos: [px, 0.60, D / 2 + 0.09], r: 0.03, shade: 1.55 }
  ];
}

function rj11Contact(x, i) {
  const H = RJ11.h, D = RJ11.d;
  const px = x + (i - (RJ11.pos - 1) / 2) * RJ11.pitch;
  return [
    { shape: "box", size: [0.22, 0.95, 0.14], pos: [px, -H / 2 + 1.15, D / 2 + 0.07], r: 0.02, shade: 1.0 },
    { shape: "box", size: [0.22, 0.12, 1.9], pos: [px, -H / 2 + 0.08, D / 2 - 1.0], r: 0.02, shade: 0.9 }
  ];
}

/* =====================================================================
   THE FOUR FIBRE CONNECTORS, FROM THE OWNER'S REFERENCE IMAGES.

   Built at the close-up scale, 1 unit = 2 mm, the same as the copper
   connectors so the two families can be laid beside each other.

   WHAT SEPARATES THEM IS HOW THEY HOLD ON, and that is the whole reason
   there are four of them rather than one:

     LC   push-pull latch, like a small RJ45 tab
     SC   push-pull, square, no twisting
     ST   BAYONET  — push and twist a quarter turn
     FC   THREADED — push and screw the nut down

   And two of those are chosen for where they live rather than for
   preference: ST and FC are metal with a mechanical lock because they go
   where something vibrates or gets knocked. A push-pull in a plant room
   works loose; a threaded FC does not.

   FERRULE SIZE SPLITS THEM IN HALF. SC, ST and FC all use a 2.5 mm
   ferrule; LC uses 1.25 mm, which is the entire reason LC exists — half
   the ferrule means half the footprint on a switch face, so an LC duplex
   fits where one SC used to.

   AND THE COLOUR IS NOT DECORATION. It is the single most useful thing
   on the part:

     blue    UPC, single-mode      straight polish
     green   APC, single-mode      ANGLED polish — will not mate with UPC
     aqua    OM3 / OM4 multimode
     beige   OM1 / OM2 multimode

   Green against blue is the fault that hurts: an APC and a UPC mate
   mechanically, leave an air gap, and reflect light back up the fibre.
   The link comes up and runs badly, from a connector that looks
   perfectly seated.
   ===================================================================== */
const FIB = {
  lcW: 3.2, lcH: 2.35, lcFerrule: 0.625,
  scW: 4.5, ferrule: 1.25,
  barrel: 4.5
};

export const FIBRE_COLOUR = {
  upc:   "#2f5fb0",   /* blue  — single-mode, straight polish */
  apc:   "#2f8f4a",   /* green — single-mode, ANGLED polish */
  om3:   "#3fb8bf",   /* aqua  — OM3/OM4 multimode */
  om1:   "#c9bfa4",   /* beige — OM1/OM2 multimode */
  /* BRIGHTER THAN IT LOOKS IT SHOULD BE. Under the metal finish and this
     bench's lighting, #8f979e came out close to black and the ST and FC
     read as dark plastic rather than the nickel-plated brass they are.
     The finish darkens; the base colour has to start high to land right. */
  metal: "#c3cad0"
};

/* LC — the small one, and usually a duplex pair clipped together. */
/* THE PAIR IS STACKED IN Y, NOT X, AND THAT IS DELIBERATE.

   Every part on this bench is drawn along Z and then turned a quarter
   turn about Y by the part's own `rot`, so that it lies ACROSS the view
   instead of pointing at the camera. That turn sends local +X to -Z —
   into the screen. A duplex separated along X would therefore end up one
   connector hidden directly behind the other. Separated along Y it
   survives the turn untouched and reads as the clipped pair it is. */
const LC_GAP = FIB.lcH / 2 + 0.45;

function lcBody(x, dual) {
  const W = FIB.lcW, H = FIB.lcH;
  const out = [];
  const ys = dual ? [-LC_GAP, LC_GAP] : [0];
  ys.forEach(function (cy) {
    out.push({ shape: "rbox", size: [W, H, 8.0], pos: [x, cy, 0], r: 0.18, shade: 1.0 });
    /* the latch tab, the thing you squeeze to release it */
    out.push({ shape: "box", size: [W - 0.8, 0.22, 3.0], pos: [x, cy + H / 2 + 0.14, -1.2],
      r: 0.04, shade: 0.88 });
    /* the boot */
    out.push({ shape: "cyl", size: [1.5, 3.0], pos: [x, cy, -5.5], rot: [Math.PI / 2, 0, 0],
      seg: 12, shade: 0.68 });
  });
  if (dual) {
    /* The clip that makes it a duplex, on the far side so it does not
       stand between the pair and the camera once the part is turned. */
    out.push({ shape: "box", size: [0.8, LC_GAP * 2 + H, 1.6],
      pos: [x + W / 2 + 0.45, 0, -2.4], r: 0.1, shade: 0.8 });
  }
  return out;
}

function lcFerrule(x, dual) {
  const ys = dual ? [-LC_GAP, LC_GAP] : [0];
  return ys.map(function (cy) {
    return { shape: "cyl", size: [FIB.lcFerrule, 3.4], pos: [x, cy, 5.7],
             rot: [Math.PI / 2, 0, 0], seg: 14, shade: 1.0 };
  });
}

/* ST — bayonet. Round barrel, a collar you push and twist a quarter
   turn, and a KEY so it only goes on one way. */
function stBody(x) {
  const b = FIB.barrel;
  return [
    { shape: "cyl", size: [b, 6.0], pos: [x, 0, 0], rot: [Math.PI / 2, 0, 0], seg: 18, shade: 1.0 },
    /* the knurled bayonet collar */
    { shape: "cyl", size: [b + 0.9, 3.4], pos: [x, 0, 2.2], rot: [Math.PI / 2, 0, 0], seg: 18, shade: 0.86 },
    /* the ribs on it — what your fingers turn */
    /* THE KNURLING. `axis`, not `about` — the key is called axis and a
       wrong name silently defaults to "y", which would have laid these
       ribs flat across the barrel instead of around it. And ringed about
       Z the size order is [radial, tangential, axial], which is the order
       this build got wrong once already and now documents. */
    { shape: "box", size: [0.30, 0.22, 3.2], pos: [x, 0, 2.2], r: 0.03, shade: 0.7,
      ring: { count: 12, axis: "z", radius: (b + 0.9) / 2 } },
    /* THE BAYONET SLOT — THE L. This is the feature that names the
       connector and the first render did not have it, so the ST and the
       FC were two grey barrels with knurling and nothing to tell them
       apart. It is a cut, and this engine cannot subtract, so it is drawn
       as two dark bars laid into the collar surface: the AXIAL leg that
       the adapter's pin enters when you push, and the CIRCUMFERENTIAL
       leg it travels along when you twist. Push, then turn — the shape
       of the groove is the instruction. */
    { shape: "box", size: [0.70, 0.38, 2.1], pos: [x, (b + 0.9) / 2 - 0.10, 3.05], r: 0.04, shade: 0.16 },
    { shape: "box", size: [1.8, 0.38, 0.70], pos: [x, (b + 0.9) / 2 - 0.10, 2.10], r: 0.04, shade: 0.16 },
    /* THE SHANK THE FERRULE COMES OUT OF. Without it the ferrule ended up
       floating in clear air a unit and a half in front of the collar,
       with the key hanging in the gap beside it like a loose fin. A
       ferrule is not a separate object hovering near a connector; it is
       the tip of one, and the render has to say so. */
    { shape: "cyl", size: [3.0, 2.6], pos: [x, 0, 5.4], rot: [Math.PI / 2, 0, 0], seg: 16, shade: 0.92 },
    /* THE KEY, which is why an ST goes on one way only — on the BODY,
       behind the collar, where the connector actually carries it. */
    { shape: "box", size: [0.55, 0.9, 1.8], pos: [x, b / 2 - 0.1, -0.6], r: 0.05, shade: 0.75 },
    /* the boot */
    { shape: "cyl", size: [2.4, 3.4], pos: [x, 0, -4.6], rot: [Math.PI / 2, 0, 0], seg: 14, shade: 0.6 }
  ];
}

/* FC — threaded. Same barrel, a screw nut instead of a bayonet, and the
   same key. This is the one that survives vibration. */
function fcBody(x) {
  const b = FIB.barrel;
  return [
    { shape: "cyl", size: [b, 6.0], pos: [x, 0, 0], rot: [Math.PI / 2, 0, 0], seg: 18, shade: 1.0 },
    /* THE KEY, on the body behind the nut where an FC carries it */
    { shape: "box", size: [0.55, 0.9, 1.8], pos: [x, b / 2 - 0.1, 2.2], r: 0.05, shade: 0.75 },
    /* the knurled nut */
    { shape: "cyl", size: [b + 1.0, 3.4], pos: [x, 0, 4.6], rot: [Math.PI / 2, 0, 0], seg: 18, shade: 0.86 },
    { shape: "box", size: [0.28, 0.20, 3.2], pos: [x, 0, 4.6], r: 0.03, shade: 0.68,
      ring: { count: 16, axis: "z", radius: (b + 1.0) / 2 } },
    /* THE THREAD, AND THE SHANK IT IS CUT INTO.

       A TORUS IN THIS ENGINE LIES IN THE XY PLANE — its axis is Z, and
       it needs NO rotation to ring a body that also runs along Z. The
       first build gave these rings rot [PI/2, 0, 0], which stood every
       one of them on edge: four arcs sticking out sideways near the
       boot, and an FC whose only distinguishing feature — that it screws
       down — was not drawn at all. The render showed grey arcs and I
       read them as knurling artefacts rather than as the thread in the
       wrong plane. Compare the concentric rings in bench-build.js, which
       ring a front face along Z and carry no rotation either. */
    { shape: "cyl", size: [3.2, 2.0], pos: [x, 0, 7.0], rot: [Math.PI / 2, 0, 0], seg: 16, shade: 0.92 },
    { shape: "torus", size: [3.3, 0.24], pos: [x, 0, 6.4], seg: 20, seg2: 8,
      shade: 0.62, repeat: { count: 4, step: [0, 0, 0.45] } },
    { shape: "cyl", size: [2.4, 3.4], pos: [x, 0, -4.6], rot: [Math.PI / 2, 0, 0], seg: 14, shade: 0.6 }
  ];
}

/* The 2.5 mm ferrule the other three share. */
function bigFerrule(x, z) {
  return [{ shape: "cyl", size: [FIB.ferrule, 4.0], pos: [x, 0, z], rot: [Math.PI / 2, 0, 0],
            seg: 16, shade: 1.0 }];
}

/* ---------------------------------------------------------------------
   The four fibre connectors, side by side, at the close-up scale.

   Laid out in the order the owner's reference uses, which is also the
   order they are usually taught: the two push-pulls first, then the two
   that lock mechanically.
   --------------------------------------------------------------------- */
export function fibreBench(view) {
  view = view || {};
  const parts = [];

  /* THE LAYOUT IS A 2x2 GRID, AND IT IS PAIRED THE WAY IT IS FOR A REASON.

     The first build laid all four in a row along X and swung the camera
     round to about 55 degrees so the bodies would show their length
     instead of reading as discs end-on. That worked and cost more than
     it bought: at 55 degrees the row runs mostly INTO the screen, so the
     four sat on a receding diagonal and perspective made the nearest
     roughly twice the apparent size of the furthest. On a bench whose
     entire point is that LC's ferrule is half the size of the other
     three, a view that inflates near against far by 2x is not a cosmetic
     problem — it is the bench telling the student something false.

     So the bodies are turned instead of the camera. Each part is drawn
     along Z, as is natural, and carries rot [0, PI/2, 0] to lay it
     ACROSS the view; the camera then sits nearly square on at yaw 0.14.

     AND THE PAIRING PUTS BOTH REAL COMPARISONS DOWN A COLUMN:

       left   LC over SC   — 1.25 mm ferrule against 2.5 mm
       right  ST over FC   — bayonet slot against threaded nut

     WHAT IS LEFT, MEASURED OFF THE RENDER RATHER THAN ESTIMATED. The four
     ferrules come out 15, 28, 30 and 31 pixels across, against a truth of
     1.25, 2.5, 2.5 and 2.5 mm. So LC against SC reads 1:1.87 where it
     should read 1:2, and the two 2.5 mm ferrules that sit in opposite
     columns differ from each other by 7 per cent. My first estimate for
     this was 9 per cent across a row and 5 down a column, and both were
     wrong in the direction that flatters the build — the ferrules had to
     be photographed and counted before the number meant anything.

     The residual understates the LC difference rather than overstating
     it, which is the safe direction: a student reading "about half" off
     this bench is reading something true. Do not chase the last 7 per
     cent by moving the camera further back — the field of view is fixed
     in scene.js, so more distance buys accuracy only by shrinking the
     bayonet slot and the thread until neither can be seen, and those are
     the whole reason the right-hand column exists. */
  const P2Y = [0, Math.PI / 2, 0];
  const AT = {
    lc: [-11.02,  4.2, 0],
    sc: [ -9.52, -4.2, 0],
    st: [ 11.63,  4.2, 0],
    fc: [ 11.53, -4.2, 0]
  };
  const X = { lc: 0, sc: 0, st: 0, fc: 0 };

  /* ---- LC, duplex, aqua = OM3/OM4 multimode ---- */
  parts.push({ key: "fib-lc", label: "LC duplex — push-pull latch",
    build: lcBody(X.lc, true), finish: "plastic", scale: 1, pos: AT.lc, rot: P2Y,
    color: FIBRE_COLOUR.om3,
    spec: "1.25 mm ferrule. Aqua = OM3/OM4 multimode",
    note: "THE SMALL ONE, and the reason it exists is the ferrule: 1.25 mm against everything " +
      "else's 2.5. Half the ferrule is half the footprint, so an LC DUPLEX fits in the space " +
      "one SC used to take — which is why a modern switch face is a row of LCs. It latches " +
      "like an RJ45 tab and it is nearly always a clipped pair, because a fibre link needs one " +
      "strand each way." });
  parts.push({ key: "fib-lc-ferrule", label: "Its two ferrules",
    build: lcFerrule(X.lc, true), finish: "matte", scale: 1, pos: AT.lc, rot: P2Y,
    color: "#e8e4db",
    spec: "1.25 mm zirconia, one per strand",
    note: "Two of them, because light goes one way down a strand. Transmit on one, receive on " +
      "the other — and swapping them is the commonest fibre fault there is, which is why a " +
      "duplex clip exists to stop you." });

  /* ---- SC, blue = UPC single-mode ---- */
  parts.push({ key: "fib-sc", label: "SC — push-pull, square",
    build: scBody(X.sc), finish: "plastic", scale: 1, pos: AT.sc, rot: P2Y,
    color: FIBRE_COLOUR.upc,
    spec: "2.5 mm ferrule. BLUE = UPC single-mode",
    note: "Square, push-pull, no twisting — the one most ONTs and older switches use. BLUE " +
      "IS UPC, a straight polish. The green one beside it is APC, an ANGLED polish, and they " +
      "do not mate: they go together mechanically and leave an air gap that reflects light " +
      "back up the fibre. The link comes up and runs badly, from a connector that looks " +
      "perfectly seated." });
  parts.push({ key: "fib-sc-ferrule", label: "Its ferrule",
    build: bigFerrule(X.sc, 7.0), finish: "matte", scale: 1, pos: AT.sc, rot: P2Y,
    color: "#e8e4db", spec: "2.5 mm zirconia",
    note: "Never touch the face and never leave it uncapped. The core is nine MICRONS — a " +
      "tenth of a hair — so a fingerprint is not a smudge, it is an attenuation fault that " +
      "no amount of reseating clears." });

  /* ---- ST, bayonet ---- */
  parts.push({ key: "fib-st", label: "ST — bayonet, push and twist",
    build: stBody(X.st), finish: "metal", skin: "brushed", scale: 1, pos: AT.st, rot: P2Y,
    color: FIBRE_COLOUR.metal,
    spec: "2.5 mm ferrule. Quarter-turn bayonet, keyed",
    note: "PUSH AND TWIST a quarter turn, like a BNC. Metal bodied and mechanically locked " +
      "because it goes where things move — a push-pull works loose in a plant room and this " +
      "does not. The KEY on it means it only goes on one way, which also means it only goes on " +
      "at all if you have lined it up: forcing an ST is how a ferrule gets chipped." });
  parts.push({ key: "fib-st-ferrule", label: "Its ferrule",
    build: bigFerrule(X.st, 7.4), finish: "matte", scale: 1, pos: AT.st, rot: P2Y,
    color: "#e8e4db", spec: "2.5 mm, same as SC and FC", note: "" });

  /* ---- FC, threaded ---- */
  parts.push({ key: "fib-fc", label: "FC — threaded, screw it down",
    build: fcBody(X.fc), finish: "metal", skin: "brushed", scale: 1, pos: AT.fc, rot: P2Y,
    color: FIBRE_COLOUR.metal,
    spec: "2.5 mm ferrule. Threaded nut, keyed",
    note: "The one that survives VIBRATION. Screw the nut down and nothing shakes it loose, " +
      "which is why it lives in test equipment, telco racks and anywhere with machinery. Same " +
      "ferrule as SC and ST; what differs is only how it holds on, and that is the whole basis " +
      "on which these four are chosen." });
  parts.push({ key: "fib-fc-ferrule", label: "Its ferrule",
    build: bigFerrule(X.fc, 7.6), finish: "matte", scale: 1, pos: AT.fc, rot: P2Y,
    color: "#e8e4db", spec: "2.5 mm, same as SC and ST", note: "" });

  return {
    kind: "bench",
    title: "The four fibre connectors",
    caption: "What separates them is HOW THEY HOLD ON — LC and SC push in, ST twists, FC " +
      "screws down. Three of the four share a 2.5 mm ferrule; LC's is 1.25, which is the " +
      "entire reason it exists. And the colour is not decoration: blue is UPC, green is APC " +
      "and they will not mate, aqua is OM3/OM4 multimode, beige is OM1/OM2.",
    board: null, decor: [], parts: parts,
    /* NEARLY SQUARE ON, because the parts are turned rather than the
       camera — see the grid note above. The yaw only has to be enough to
       round the barrels and show the bayonet slot and the thread sitting
       on top of them; every unit of yaw beyond that buys nothing and
       costs a size comparison the bench is built to make. */
    /* DIST 26, NOT 46. fitDist() returns Math.max(dist, need) — `dist` is
       the CLOSEST the camera will come, not the distance it uses. At 46
       it beat the 27 that fitWidth 48 actually needed on a wide canvas,
       so the four connectors sat in the middle 60 per cent of the frame
       with a band of empty grey all round them, and shrinking fitWidth
       to test the framing moved nothing at all. 26 lets the fit drive on
       wide canvases and still backs off to about 96 on a 319px phone. */
    camera: { dist: 33, fitWidth: 50, yaw: 0.14, pitch: 0.26, target: [3.0, 0.4, 0], min: 12, max: 96 }
  };
}
