/* =====================================================================
   WHAT COMES OUT OF A POWER SUPPLY, AND WHY IT ONLY GOES IN ONE HOLE.

   The power lab's "Cable it" stage is about connecting a supply to a
   board, a processor, a graphics card and a drive, and it drew none of
   the connectors. Every one of them is told apart by its KEYING — the
   shape of the sockets — and keying is the one property that cannot be
   taught in words, because the whole point of it is that your eye and
   your hand recognise it before you force anything.

   SCALE: 1 UNIT = 1 mm, the same as the video bench so the two can be
   compared. Pin pitch on the big connectors is 4.2 mm, which is why a
   24-pin is over 50 mm across and a student always underestimates it.

   THE ONE THAT MATTERS MOST IS EPS AGAINST PCIe.

   The 8-pin that feeds a processor and the 8-pin that feeds a graphics
   card are the SAME SIZE. They are keyed differently so they will not
   mate, and the honest way to tell them apart on a bench is how they
   COME APART: a PCIe 8-pin splits 6 + 2, and an EPS 8-pin splits 4 + 4.
   That is visible, it is memorable, and it is the difference between a
   machine that boots and a board with a burnt trace.

   Modern supplies label them, and the labels are the first thing to go
   unreadable in a dark case behind a cable loom. The split is not.
   ===================================================================== */

const P2 = Math.PI / 2;

export const PSU_SCALE = { mmPerUnit: 1 };

export const PSU_COLOUR = {
  black:  "#2f353b",
  hole:   "#12161a",
  yellow: "#c4952a",
  red:    "#a8342c",
  metal:  "#aab2b9",
  pale:   "#d7dbdf"
};

const PITCH = 4.2;          /* the standard pin pitch on ATX/EPS/PCIe */

/* THE HOUSING. Drawn pre-shrunk by its own corner radius, because rbox
   inflates: roundedBox() bevels OUTWARD, so a part declared [w, h, d]
   with radius r renders (w + 2r) x (h + 2r) x d. That cost a whole
   render cycle on the access point bench before it was understood. */
function housing(x, w, h, d, r, shade) {
  return { shape: "rbox", size: [w - 2 * r, h - 2 * r, d], pos: [x, 0, 0], r: r, shade: shade };
}

/* A ROW OF SOCKETS. Square ones and chamfered ones look different at a
   glance and that difference IS the keying, so they are drawn as two
   different shapes rather than two shades of the same one. */
function sockets(x, n, y, sq, z) {
  const span = (n - 1) * PITCH;
  if (sq) {
    return [{ shape: "box", size: [3.0, 3.0, 1.2], pos: [x - span / 2, y, z], r: 0.2, shade: 0.14,
              repeat: { count: n, step: [PITCH, 0, 0] } }];
  }
  return [{ shape: "rbox", size: [2.0, 2.0, 1.2], pos: [x - span / 2, y, z], r: 0.9, shade: 0.14,
            repeat: { count: n, step: [PITCH, 0, 0] } }];
}

/* ---------------------------------------------------------------------
   24-PIN ATX. Two rows of twelve, a latch down one long side, and the
   thing every student underestimates: it is over fifty millimetres wide.
   --------------------------------------------------------------------- */
export function atx24(x) {
  const w = 12 * PITCH + 2.4, h = 2 * PITCH + 2.2;
  return [housing(x, w, h, 12.0, 1.0, 1.0),
    /* the latch arm down one side */
    { shape: "box", size: [w * 0.34, 1.4, 8.0], pos: [x - w * 0.12, h / 2 + 0.5, -1.0],
      r: 0.25, shade: 0.82 },
    { shape: "box", size: [2.2, 2.4, 1.6], pos: [x - w * 0.28, h / 2 + 1.0, 2.0],
      r: 0.25, shade: 0.82 },
    /* the boot */
    { shape: "rbox", size: [w - 2, h + 2, 8.0], pos: [x, 0, -11.0], r: 1.2, shade: 0.66 }
  ];
}

export function atx24Sockets(x) {
  /* THE 20 + 4 SPLIT. Older boards took twenty; the extra four clip on
     beside them, which is why a 24-pin on a 20-pin board is not a
     problem and a 20-pin on a 24-pin board sometimes is. */
  return sockets(x - 4.2, 10, PITCH / 2, true, 5.6)
    .concat(sockets(x - 4.2, 10, -PITCH / 2, false, 5.6))
    .concat(sockets(x + 19.0, 2, PITCH / 2, true, 5.6))
    .concat(sockets(x + 19.0, 2, -PITCH / 2, false, 5.6));
}

/* ---------------------------------------------------------------------
   EPS 8-PIN — the processor. Splits 4 + 4.
   --------------------------------------------------------------------- */
export function eps8(x) {
  const w = 4 * PITCH + 2.4, h = 2 * PITCH + 2.2;
  return [housing(x, w, h, 12.0, 1.0, 1.0),
    /* THE SPLIT, drawn as a real gap down the middle: this one comes
       apart into two fours. */
    { shape: "box", size: [0.7, h + 0.6, 12.4], pos: [x, 0, 0], r: 0.1, shade: 0.40 },
    { shape: "box", size: [w * 0.5, 1.4, 8.0], pos: [x - w * 0.2, h / 2 + 0.5, -1.0],
      r: 0.25, shade: 0.82 },
    { shape: "rbox", size: [w - 2, h + 2, 8.0], pos: [x, 0, -11.0], r: 1.2, shade: 0.66 }
  ];
}

export function eps8Sockets(x) {
  /* All eight square on the row that carries 12 V. The pattern differs
     from PCIe, which is the keying that stops them mating. */
  return sockets(x, 4, PITCH / 2, true, 5.6)
    .concat(sockets(x, 4, -PITCH / 2, true, 5.6));
}

/* ---------------------------------------------------------------------
   PCIe 6+2 — the graphics card. Same size as EPS, splits 6 + 2.
   --------------------------------------------------------------------- */
export function pcie8(x) {
  const w = 4 * PITCH + 2.4, h = 2 * PITCH + 2.2;
  return [housing(x, w, h, 12.0, 1.0, 1.0),
    /* THE 6 + 2 SPLIT — two pins off one END, not down the middle. Hold
       a PCIe and an EPS side by side and this is the whole difference. */
    { shape: "box", size: [0.7, h + 0.6, 12.4], pos: [x + PITCH, 0, 0], r: 0.1, shade: 0.40 },
    { shape: "box", size: [w * 0.5, 1.4, 8.0], pos: [x - w * 0.14, h / 2 + 0.5, -1.0],
      r: 0.25, shade: 0.82 },
    { shape: "rbox", size: [w - 2, h + 2, 8.0], pos: [x, 0, -11.0], r: 1.2, shade: 0.66 }
  ];
}

export function pcie8Sockets(x) {
  /* A different mix of square and chamfered from the EPS beside it. */
  return sockets(x, 4, PITCH / 2, false, 5.6)
    .concat(sockets(x, 4, -PITCH / 2, true, 5.6));
}

/* ---------------------------------------------------------------------
   SATA POWER. Flat, wide, thin, and L-shaped so it cannot go on
   backwards. Fifteen contacts, and the flat blade is nothing like the
   round pins on everything else here.
   --------------------------------------------------------------------- */
export function sataPower(x) {
  const w = 24.0, h = 4.0;
  return [housing(x, w, h, 10.0, 0.6, 1.0),
    /* THE L. The short leg is what stops it being reversed, and it is
       the only keying on this bench that works by outline rather than by
       the shape of the holes. */
    { shape: "box", size: [5.0, 2.4, 10.0], pos: [x + w / 2 - 2.5, -h / 2 - 1.0, 0],
      r: 0.4, shade: 1.0 },
    { shape: "rbox", size: [w - 3, h + 3, 8.0], pos: [x, 0, -10.0], r: 1.0, shade: 0.66 }
  ];
}

export function sataContacts(x) {
  return [{ shape: "box", size: [0.9, 2.2, 1.0], pos: [x - 9.8, 0, 4.6], r: 0.1, shade: 0.14,
            repeat: { count: 15, step: [1.4, 0, 0] } }];
}

/* ---------------------------------------------------------------------
   MOLEX 4-PIN. The old one: four big round pins, two chamfered corners
   along one edge, and no latch at all — it is held in by friction and it
   is stiff enough that people lever it out with a screwdriver and crack
   the socket.
   --------------------------------------------------------------------- */
export function molex4(x) {
  const w = 20.0, h = 5.0;
  return [
    { shape: "rbox", size: [w - 1.6, h - 1.6, 11.0], pos: [x, 0, 0], r: 0.8, shade: 1.0 },
    /* the two chamfers along the TOP edge only — the whole keying */
    { shape: "box", size: [2.6, 2.6, 11.2], pos: [x - w / 2 + 1.0, h / 2 - 0.2, 0],
      rot: [0, 0, 0.78], r: 0.2, shade: 0.86 },
    { shape: "box", size: [2.6, 2.6, 11.2], pos: [x + w / 2 - 1.0, h / 2 - 0.2, 0],
      rot: [0, 0, 0.78], r: 0.2, shade: 0.86 },
    { shape: "rbox", size: [w - 3, h + 2, 8.0], pos: [x, 0, -10.5], r: 1.0, shade: 0.66 }
  ];
}

export function molexPins(x) {
  return [{ shape: "cyl", size: [2.4, 1.4], pos: [x - 7.5, 0, 5.4], rot: [P2, 0, 0],
            seg: 12, shade: 0.14, repeat: { count: 4, step: [5.0, 0, 0] } }];
}

/* =====================================================================
   THE LITTLE RED SWITCH.

   115 / 230 on the back of an older supply, and the power lab named it
   in a stage title and drew nothing. It deserves a model more than most
   things on this bench, because it is the one part here where getting it
   wrong is not a non-boot — it is a bang, or a machine that runs on a
   supply quietly cooking itself.

   Set to 115 on a 230 V mains, a supply is fed twice what its voltage
   doubler expects. Set to 230 on 115 V mains, it simply will not start,
   which is the harmless direction and the one people remember.

   Modern supplies are AUTO-RANGING and have no switch at all. The
   absence of the switch is therefore information: no switch means
   nothing to get wrong, and a red switch means check it before it is
   ever plugged in.
   ===================================================================== */
/* THE PANEL, LAID OUT SO THE PARTS DO NOT SIT ON TOP OF EACH OTHER.

   The first attempt placed the fan, both switches and the label from
   separate guesses and they collided: the rocker landed inside the fan
   and the label across the inlet. Positions are now taken from one set
   of coordinates with the extents written beside them, so a clash is
   arithmetic rather than something the render has to reveal.

     inlet     x -28, y +13   20 x 15
     fan       x +20, y   0   dia 34, so +3 .. +37
     selector  x -28, y  -2   11 x 15, so -33.5 .. -22.5
     rocker    x -14, y  -2   12 x 17, so -20 .. -8
     label     x -20, y -16   34 x 12, so -37 .. -3
*/
export function voltageSwitch(x, set230) {
  return [
    { shape: "rbox", size: [100, 46, 3.0], pos: [x, 0, -2.0], r: 1.5, shade: 1.0 },
  ];
}

/* ---------------------------------------------------------------------
   THE IEC C14 INLET, PROPERLY.

   The first version was a grey slab with three dark dots on it, which is
   not a socket, it is a domino. A C14 has a shape you recognise across a
   room and the shape is what does the work: a rectangle with BOTH TOP
   CORNERS CUT AWAY, so the lead goes in one way up and one way only.
   Drawn as a shroud \u2014 walls round an opening, the same trick the video
   connectors use \u2014 because that is what it is, and because an engine
   with no boolean subtraction cannot cut a hole any other way.

   Inside it, three FLAT BLADES: live and neutral at the bottom corners,
   EARTH on its own at top centre and LONGER than the other two, so it
   mates first and breaks last.
   --------------------------------------------------------------------- */
export function iecInlet(x) {
  const cx = x - 38, cy = 13;
  const w = 21, h = 16, wall = 1.6, chamf = 4.6;
  const hw = w / 2, hh = h / 2;
  return [
    { shape: "rbox", size: [w + 3, h + 3, 2.2], pos: [cx, cy, 0.4], r: 0.8, shade: 0.62 },
    { shape: "box", size: [w, wall, 6.0], pos: [cx, cy - hh + wall / 2, 2.4], r: 0.2, shade: 1.0 },
    { shape: "box", size: [wall, h - chamf, 6.0], pos: [cx - hw + wall / 2, cy - chamf / 2, 2.4],
      r: 0.2, shade: 1.0 },
    { shape: "box", size: [wall, h - chamf, 6.0], pos: [cx + hw - wall / 2, cy - chamf / 2, 2.4],
      r: 0.2, shade: 1.0 },
    /* THE TWO CUT CORNERS \u2014 the keying, and the thing that was missing */
    { shape: "box", size: [wall, chamf * 1.5, 6.0],
      pos: [cx - hw + chamf * 0.42, cy + hh - chamf * 0.54, 2.4], rot: [0, 0, -0.79], r: 0.2, shade: 1.0 },
    { shape: "box", size: [wall, chamf * 1.5, 6.0],
      pos: [cx + hw - chamf * 0.42, cy + hh - chamf * 0.54, 2.4], rot: [0, 0, 0.79], r: 0.2, shade: 1.0 },
    { shape: "box", size: [w - chamf * 2, wall, 6.0], pos: [cx, cy + hh - wall / 2, 2.4], r: 0.2, shade: 1.0 },
    /* the recessed floor the blades stand on */
    { shape: "box", size: [w - wall * 2, h - wall * 2, 1.0], pos: [cx, cy, 0.9], r: 0.2, shade: 0.30 }
  ];
}

export function iecPins(x) {
  const cx = x - 38, cy = 13;
  return [
    { shape: "box", size: [1.5, 5.2, 3.4], pos: [cx - 6.0, cy - 3.4, 2.6], r: 0.15, shade: 1.0 },
    { shape: "box", size: [1.5, 5.2, 3.4], pos: [cx + 6.0, cy - 3.4, 2.6], r: 0.15, shade: 1.0 },
    /* EARTH, top centre and longer */
    { shape: "box", size: [1.5, 6.2, 4.6], pos: [cx, cy + 3.2, 3.2], r: 0.15, shade: 1.0 }
  ];
}

/* THE FAN AND ITS WIRE GRILLE. It dominates the back of a supply, and it
   is the reason the two switches are crowded into one corner — which is
   itself why they get confused. */
export function psuFan(x) {
  const out = [
    { shape: "cyl", size: [34, 2.0], pos: [x + 26, 0, 1.0], rot: [P2, 0, 0], seg: 28, shade: 0.42 },
    { shape: "cyl", size: [9, 3.0], pos: [x + 26, 0, 2.0], rot: [P2, 0, 0], seg: 16, shade: 0.70 }
  ];
  /* seven blades */
  out.push({ shape: "box", size: [12, 0.5, 4.0], pos: [x + 26, 0, 1.4], r: 0.2, shade: 0.56,
    ring: { count: 7, axis: "z", radius: 8.5 } });
  /* THE WIRE GRILLE — concentric rings and spokes, not a moulded guard.
     Three rings of wire is what an older supply has, and it is the part
     that fills with dust and is cleaned from the OUTSIDE with the fan
     held still. */
  [12, 20, 28].forEach(function (dia) {
    out.push({ shape: "torus", size: [dia, 0.9], pos: [x + 26, 0, 3.4], seg: 30, seg2: 6, shade: 1.3 });
  });
  out.push({ shape: "box", size: [0.9, 34, 0.9], pos: [x + 26, 0, 3.4], r: 0.3, shade: 1.3,
    ring: { count: 4, axis: "z", radius: 0 } });
  return out;
}

/* ---------------------------------------------------------------------
   THE TWO SWITCHES, SIDE BY SIDE, AND THAT IS THE WHOLE LESSON.

   The photograph settles something a diagram never would: the red
   voltage selector and the black on/off rocker sit within a couple of
   centimetres of each other in the same corner of the panel. They are
   different colours and different shapes and they are still confused,
   because both are small black-and-red switches on a grey panel and one
   of them is the one you reach for every day.

   RED CHANGES WHAT THE SUPPLY EXPECTS FROM THE WALL. Black turns it on.
   Flicking red by accident on a 230 V mains feeds a doubler twice what
   it expects, which is a bang rather than a non-boot. The panel says
   SELECT VOLTAGE BEFORE USE for that reason, and the label is the only
   warning a student gets.
   --------------------------------------------------------------------- */
export function voltageSelector(x, set230) {
  return [
    /* the red slider in its well */
    { shape: "rbox", size: [11, 15, 2.0], pos: [x - 30, -2, 0.6], r: 0.6, shade: 0.40 },
    { shape: "rbox", size: [9.0, 6.4, 3.2], pos: [x - 30, -2 + (set230 ? -3.4 : 3.4), 2.0],
      r: 0.5, shade: 1.0 }
  ];
}

export function rockerWell(x) {
  return [{ shape: "rbox", size: [12, 17, 2.0], pos: [x - 16, -2, 0.6], r: 0.6, shade: 0.40 }];
}

/* THE ROCKER TIPS THE WAY ITS STATE SAYS. A switch that looks identical
   on and off teaches nothing, and this is the switch a student is told to
   check first. Pressed at I the circuit is closed and the supply is live;
   pressed at O it is isolated \u2014 the state you want before your hands
   are inside the case. */
export function powerRocker(x, on) {
  return [{ shape: "rbox", size: [10, 15, 3.4], pos: [x - 16, -2, 1.8],
            rot: [on ? -0.24 : 0.24, 0, 0], r: 0.5, shade: 1.0 }];
}

/* The warning label. Its words are the teaching, so it is its own part
   and the words live in the note beside it rather than as pixels on a
   texture nobody can read at this size. */
export function psuLabel(x) {
  return [{ shape: "rbox", size: [34, 12, 0.8], pos: [x - 20, -16, 0.9], r: 0.4, shade: 1.0 }];
}

/* ---------------------------------------------------------------------
   THE BENCH. Two views.

     loom  the five connectors that come out of a supply, side by side
           at one scale, so the 24-pin's size against the 8-pins is real
     rear  the back panel: inlet, fan, and the two switches that sit
           inches apart and get confused
   --------------------------------------------------------------------- */
export function psuBench(view) {
  view = view || {};
  const parts = [];

  if (view.show === "rear") {
    parts.push({ key: "psu-panel", label: "The back of the supply",
      build: voltageSwitch(0, !!view.set230), finish: "metal",
      skin: { kind: "psuPlate", set230: !!view.set230 }, scale: 1,
      pos: [0, 0, 0], color: PSU_COLOUR.metal,
      spec: "Steel. 115 and 230 beside the switch; the rating plate below",
      note: "EVERYTHING THAT DECIDES WHETHER THIS SUPPLY IS SAFE IS PRINTED ON THIS ONE FACE, " +
        "and it is the face nobody looks at because it points at a wall.\n\nREAD IT IN THIS " +
        "ORDER. The two numbers beside the switch say what it can be set to and a box marks " +
        "which it IS set to. The plate below says MAX OUTPUT 350W, which is how you size a " +
        "replacement, and INPUT 115/230V~ 50-60Hz 8A/4A, which is the range it accepts at " +
        "all. Then the warning: SELECT VOLTAGE BEFORE USE. A supply printed with a single " +
        "input range and no switch is auto-ranging, and there is nothing to get wrong." });
    parts.push({ key: "psu-inlet", label: "IEC C14 inlet — where the lead goes",
      build: iecInlet(0), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
      spec: "Both top corners cut away",
      note: "THE SHAPE IS THE KEYING. Two cut corners along the top mean the lead goes in one " +
        "way up and one way only — you cannot reverse live and neutral by fumbling it in " +
        "behind a desk in the dark, which is exactly when it gets fitted. The same socket is " +
        "on monitors, printers and half the kit in a comms cupboard, which is why one spare " +
        "lead fixes so many dead machines." });
    parts.push({ key: "psu-pins", label: "Its three blades — and earth is longer",
      build: iecPins(0), finish: "metal", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.metal,
      spec: "Live and neutral low, EARTH top centre",
      note: "FLAT BLADES, NOT ROUND PINS, and the earth blade is LONGER than the other two. " +
        "That is not a moulding accident: it mates FIRST and breaks LAST, so the chassis is " +
        "earthed before anything goes live and stays earthed until after everything is dead. " +
        "It is the whole safety argument for the connector, and you can see it if you look." });
    parts.push({ key: "psu-fan", label: "The fan and its wire grille",
      build: psuFan(0), finish: "metal", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.metal,
      spec: "Wire guard, not a moulded grille",
      note: "A WIRE GRILLE FILLS WITH DUST and a dusty supply runs hot, which shortens it long " +
        "before it fails outright. Clean it from the OUTSIDE, blowing inward is how you drive " +
        "the dust onto the board — and hold the blades still, because spinning a fan with " +
        "compressed air turns it into a little generator feeding the supply backwards." });
    parts.push({ key: "psu-volt", label: "THE RED ONE — voltage selector",
      build: voltageSelector(0, !!view.set230), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: PSU_COLOUR.red, glow: 0.15,
      spec: view.set230 ? "Set to 230" : "Set to 115",
      note: "RED CHANGES WHAT THE SUPPLY EXPECTS FROM THE WALL, and it is the only switch on " +
        "this panel that can destroy anything. Set to 115 on a 230 V mains it feeds a voltage " +
        "doubler twice what it expects — that is a bang, not a non-boot. Set to 230 on a " +
        "115 V mains it simply will not start, which is the harmless direction and the one " +
        "everybody remembers, which is exactly why the dangerous one catches people.\\n\\n" +
        "ITS POSITION IS THE STATE, NOT ITS COLOUR. A switch set wrong is still red." });
    parts.push({ key: "psu-well", label: "The rocker housing", build: rockerWell(0),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
      spec: "Sunk into the panel", note: "" });
    parts.push({ key: "psu-rocker",
      label: view.on ? "The black one — pressed at I, so ON"
                     : "The black one — pressed at O, so OFF",
      build: powerRocker(0, !!view.on), finish: "plastic",
      skin: { kind: "rockerFace" }, scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
      spec: view.on ? "I pressed in — live" : "O pressed in — isolated",
      note: "THE TWO SIT INCHES APART ON THE SAME PANEL. That is why this bench draws both: " +
        "one is the switch you reach for without looking, and the other must never be moved " +
        "with the machine plugged in. On a supply with no red switch at all there is nothing " +
        "to get wrong — modern ones are auto-ranging, so the ABSENCE of the switch is " +
        "itself information.\n\nIT IS MARKED I AND O, NOT ON AND OFF. A bare line means the " +
        "circuit is CLOSED and the supply is live; a circle means it is OPEN and isolated. " +
        "The same two symbols are on extension leads, wall isolators and the back of every " +
        "appliance, and plenty are moulded black on black where the SHAPE is the only thing " +
        "you can read. Whichever end is pressed IN is the state." });
    /* NO SEPARATE LABEL PART. There was a blank white slab here standing
       in for the rating label, and once the panel carried real printed
       text the slab sat on top of it and hid the words. The label is not
       an object on the panel — it is PRINT on the panel, and print
       belongs in the painter. */
    return finish(parts, "The back of the supply",
      "Inlet, fan, and the two switches. The red one changes what the supply expects from the " +
      "wall; the black one turns it on. They are inches apart.",
      /* THE VERTICAL IS THE BINDING CONSTRAINT HERE, NOT THE WIDTH. This
       panel is 84 x 44 and the frame is nearly two and a half times wider
       than it is tall, so the height runs out long before the width does:
       fitWidth has to be at least the panel's HEIGHT times the aspect.
       And the panel is an rbox, which inflates — 44 declared renders
       46.4 — so the number to plan against is the rendered one. */
      { dist: 88, fitWidth: 150, yaw: 0.26, pitch: 0.24, target: [0, 0, 0], min: 24, max: 260 });
  }

  if (view.show === "ups") {
    parts.push({ key: "ups-body", label: "The UPS", build: upsBody(0), finish: "plastic",
      scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
      spec: "1 unit = 2 mm. Two banks of sockets",
      note: "THE TWO ROWS ARE NOT THE SAME, and nothing about the shape says so. A moulded "
        + "ridge divides them and small print names them, and that is the entire signal. "
        + "Everything you are tempted to plug in fits either one." });
    parts.push({ key: "ups-batt", label: "BATTERY + SURGE \u2014 holds up in a cut",
      build: upsBattery(0), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: PSU_COLOUR.pale, spec: "The top row. Four sockets",
      note: "THE MACHINE AND THE MONITOR GO HERE, and not much else. What you are buying is "
        + "the minutes needed to save work and shut down properly \u2014 not the ability to "
        + "keep working through a cut, which is a different and far more expensive product." });
    parts.push({ key: "ups-surge", label: "SURGE ONLY \u2014 dead the moment the power is",
      build: upsSurge(0), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: PSU_COLOUR.pale, spec: "The bottom row. Identical to look at",
      note: "THE FAULT THIS BENCH EXISTS FOR. Put the machine on this row and you have a UPS "
        + "that appears to work, tests clean on its self-test, shows every light green \u2014 "
        + "and does absolutely nothing in a power cut. It is protected against a spike and "
        + "not against a loss, and the two are not the same thing.\n\nTHE PRINTER GOES HERE, "
        + "deliberately. A laser's fuser pulls more on warm-up than the whole rest of the "
        + "desk together and will flatten a battery that would otherwise have held the "
        + "machine up for fifteen minutes." });
    parts.push({ key: "ups-inlet", label: "Inlet and reset breaker", build: upsInlet(0),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
      spec: "Mains in, and the button people forget",
      note: "WHEN A UPS \u201cDIES\u201d AFTER SOMEBODY PLUGGED A HEATER INTO IT, this is usually "
        + "all that has happened: the breaker has tripped. Press it back in before condemning "
        + "the unit." });
    return finish(parts, "The back of a UPS, and the row that does nothing in a cut",
      "Two banks of sockets, inches apart, identical to look at. One holds up when the mains "
      + "fails and one is only protected against spikes \u2014 and every device you want to "
      + "plug in fits both.",
      { dist: 150, fitWidth: 132, yaw: 0.26, pitch: 0.26, target: [0, 0, 0], min: 40, max: 300 });
  }

  const X = { atx: -60, eps: -16, pcie: 8, sata: 42, molex: 74 };
  parts.push({ key: "psu-atx", label: "24-pin ATX — the board",
    build: atx24(X.atx), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
    spec: "52.8 mm across. Latched",
    note: "BIGGER THAN ANYONE EXPECTS — over fifty millimetres, because the pitch is 4.2 mm " +
      "and there are twelve pins in a row. It splits 20 + 4, which is why a 24-pin plug serves " +
      "an older 20-pin board. It has a latch, and it is stiff: the damage here is people " +
      "rocking it out sideways and cracking the socket off the board." });
  parts.push({ key: "psu-atx-pins", label: "Its sockets", build: atx24Sockets(X.atx),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.hole,
    spec: "Two rows of twelve, mixed square and chamfered",
    note: "The mix of square and chamfered holes IS the keying. It is not decoration and it is " +
      "not random — it is what stops the plug going in rotated." });

  parts.push({ key: "psu-eps", label: "EPS 8-pin — the PROCESSOR. Splits 4 + 4",
    build: eps8(X.eps), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
    spec: "Same size as the PCIe beside it",
    note: "THE PAIR THAT DAMAGES BOARDS. This and the PCIe next to it are the same size and " +
      "are keyed so they will not mate — and in a dark case, behind a loom, with the " +
      "printed labels unreadable, people force them. The reliable tell is how they COME " +
      "APART: this one splits down the middle into two fours." });
  parts.push({ key: "psu-eps-pins", label: "Its sockets", build: eps8Sockets(X.eps),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.hole,
    spec: "A different pattern from PCIe", note: "" });

  parts.push({ key: "psu-pcie", label: "PCIe 6+2 — the GRAPHICS CARD. Splits 6 + 2",
    build: pcie8(X.pcie), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
    spec: "Same size as the EPS beside it",
    note: "TWO PINS COME OFF ONE END, not down the middle — which is what lets one plug feed " +
      "either a 6-pin or an 8-pin card. Hold it against the EPS and that is the difference. A " +
      "card that will not power up, or powers up and crashes under load, is very often a 6+2 " +
      "with the 2 left hanging off." });
  parts.push({ key: "psu-pcie-pins", label: "Its sockets", build: pcie8Sockets(X.pcie),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.hole,
    spec: "A different pattern from EPS", note: "" });

  parts.push({ key: "psu-sata", label: "SATA power — flat, L-shaped, daisy-chained",
    build: sataPower(X.sata), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
    spec: "15 contacts. Thin and wide",
    note: "THE L IN ITS OUTLINE is the only keying here that works by SHAPE rather than by the " +
      "holes, and it is what stops it going on backwards. One lead usually carries three or " +
      "four of these down its length — so you do not need a lead per drive, and one failed " +
      "lead takes out several drives at once, which sends people hunting for a dead drive when " +
      "the fault is upstream of all of them." });
  parts.push({ key: "psu-sata-pins", label: "Its fifteen contacts", build: sataContacts(X.sata),
    finish: "metal", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.metal,
    spec: "Flat blades, not round pins", note: "" });

  parts.push({ key: "psu-molex", label: "Molex 4-pin — the old one",
    build: molex4(X.molex), finish: "plastic", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.black,
    spec: "Two chamfered corners along one edge. No latch",
    note: "NO LATCH AT ALL — friction only, and stiff enough that people lever it out with a " +
      "screwdriver and crack the socket. The two chamfers along one edge are its keying. Also " +
      "daisy-chained, and still the way case fans and older drives get power." });
  parts.push({ key: "psu-molex-pins", label: "Its four pins", build: molexPins(X.molex),
    finish: "matte", scale: 1, pos: [0, 0, 0], color: PSU_COLOUR.hole,
    spec: "Big round pins, 5 mm apart", note: "" });

  return finish(parts, "What comes out of a power supply",
    "Drawn at 1 unit = 1 mm, so the sizes are real. What separates them is KEYING — the " +
    "shape of the sockets and the outline — and the pair that matters is EPS against PCIe: " +
    "same size, different keying, and they come apart differently.",
    { dist: 118, fitWidth: 210, yaw: 0.30, pitch: 0.28, target: [10, 0, 0], min: 40, max: 380 });
}

function finish(parts, title, caption, camera) {
  return { kind: "bench", title: title, caption: caption,
           board: null, decor: [], parts: parts, camera: camera };
}

/* =====================================================================
   THE UPS, AND THE TWO ROWS OF SOCKETS ON THE BACK OF IT.

   "Size the UPS" and "What goes on battery, and what does not" are two
   stages about one object, and neither drew it. The second is the one
   that needs a model most, because the answer is not a calculation — it
   is a FACT ABOUT THE BACK PANEL that most people never notice.

   A consumer UPS has two banks of sockets and they are not the same:

     BATTERY + SURGE    holds up when the mains fails
     SURGE ONLY         protected, and dead the moment the power is

   They are the same shape, inches apart, usually distinguished by a
   moulded line and small print. Everything a student is tempted to plug
   in — the printer, the monitor, the desk lamp — fits either. Putting
   the machine on the surge-only bank gives you a UPS that appears to
   work, tests clean, and does nothing whatever in a cut.

   And the printer is the one thing that must NOT go on battery at all:
   a laser's fuser pulls more on warm-up than the whole rest of the desk,
   and it will flatten a UPS that would otherwise have held the machine
   up for fifteen minutes.

   Scale here is 1 unit = 2 mm — half the connector benches, because a
   UPS is a box you carry rather than a part you hold.
   ===================================================================== */
const UPS = { w: 92, h: 42, d: 58 };

export function upsBody(x) {
  const W = UPS.w, H = UPS.h;
  return [
    { shape: "rbox", size: [W - 3, H - 3, 26], pos: [x, 0, 0], r: 1.5, shade: 1.0 },
    /* the moulded ridge that divides the two banks — the only thing on a
       real one that separates them apart from the printing */
    { shape: "box", size: [W - 8, 1.2, 1.6], pos: [x, 0, 13.2], r: 0.3, shade: 0.62 },
    /* feet */
    { shape: "box", size: [6, 2.0, 5], pos: [x - W * 0.4, -H / 2 - 1, 0], r: 0.4, shade: 0.6 },
    { shape: "box", size: [6, 2.0, 5], pos: [x + W * 0.4, -H / 2 - 1, 0], r: 0.4, shade: 0.6 }
  ];
}

/* One bank of sockets. Drawn as shrouds with three slots each, so they
   read as outlets rather than as squares. */
function outletRow(x, y, n, span) {
  const out = [];
  const step = span / (n - 1);
  for (let i = 0; i < n; i++) {
    const cx = x - span / 2 + i * step;
    out.push({ shape: "rbox", size: [13, 13, 2.0], pos: [cx, y, 13.6], r: 1.2, shade: 0.92 });
    out.push({ shape: "box", size: [2.2, 5.0, 2.6], pos: [cx - 3.2, y - 1.6, 14.4], r: 0.2, shade: 0.18 });
    out.push({ shape: "box", size: [2.2, 5.0, 2.6], pos: [cx + 3.2, y - 1.6, 14.4], r: 0.2, shade: 0.18 });
    out.push({ shape: "box", size: [2.2, 4.4, 2.6], pos: [cx, y + 3.4, 14.4], r: 0.2, shade: 0.18 });
  }
  return out;
}

/* THE BANK THAT HOLDS UP. Four sockets, upper row. */
export function upsBattery(x) { return outletRow(x, 9.5, 4, 62); }

/* THE BANK THAT DOES NOT. Four more, lower row, identical to look at. */
export function upsSurge(x) { return outletRow(x, -9.5, 4, 62); }

/* The inlet and the breaker, at one end. */
export function upsInlet(x) {
  const W = UPS.w;
  return [
    { shape: "rbox", size: [15, 12, 4.0], pos: [x + W * 0.42, 9.5, 13.4], r: 1.0, shade: 0.66 },
    { shape: "box", size: [2.6, 3.6, 2.4], pos: [x + W * 0.42 - 3, 8.0, 15.2], r: 0.2, shade: 0.18 },
    { shape: "box", size: [2.6, 3.6, 2.4], pos: [x + W * 0.42 + 3, 8.0, 15.2], r: 0.2, shade: 0.18 },
    { shape: "box", size: [2.6, 3.6, 2.4], pos: [x + W * 0.42, 12.6, 15.2], r: 0.2, shade: 0.18 },
    /* the reset breaker, which is the thing people press when a UPS
       "dies" after somebody overloaded it */
    { shape: "cyl", size: [6.0, 3.0], pos: [x + W * 0.42, -9.5, 13.8], rot: [P2, 0, 0],
      seg: 14, shade: 1.0 }
  ];
}
