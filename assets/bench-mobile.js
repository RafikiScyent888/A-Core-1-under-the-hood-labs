/* =====================================================================
   A+ Core1 Under the Hood Labs — the device bench

   A handset with its stack pulled apart, layer by layer, standing in the
   air above the midframe the way it looks on a repair bench with the
   parts laid out in the order they came off.

   WHY EXPLODED

   Fifth bench, and the occlusion lesson is now a design rule rather than
   a discovery. A phone is the worst case of all: every layer is directly
   on top of the last one, and assembled it is a black rectangle. Drawn
   faithfully it teaches nothing at all.

   Exploded, with real gaps and a moderate camera angle, every layer is
   visible at once and — more usefully — the ORDER is visible, which is
   the thing a student has to know before they touch a screen assembly.
   Glass, digitizer, panel, backlight. Get that order wrong and you have
   bought the wrong part.

   THE SWOLLEN CELL IS A SAFETY GATE, NOT A DEFECT

   A swollen battery DOMES, and it lifts the layers above it, because that
   is exactly how it is found — the screen rises at one corner before
   anyone opens anything. It is never something to press back down, and
   the lab refuses to let the student carry on until they have said so.
   The model's job is to make it visible from across a room.

   It used to be drawn thicker and BROWN, and both of those were invented.
   The owner's photograph of two pouches side by side, one tagged, shows
   the same silver foil, the same printed label and the same footprint on
   both — the seal welds hold and only the middle lifts. A student taught
   to look for a discoloured battery walks past a dangerous one, so the
   colour tell is gone and the dome does the work. checkSwellingDomes
   below holds it to that.

   Same two rules as every bench here: the canvas is scenery and each
   layer is a real focusable button; and one colour per part, so the
   layers stay their own material and the pips carry the verdict.
   ===================================================================== */

import { TILES } from "./tiles.js";
import { PHONE_SCREEN_ASPECT } from "./surface.js";
import { rng } from "./rng.js";

const P2 = Math.PI / 2;

/* Handset footprint, roughly 75 x 160mm at 12mm to the unit. */
const PW = 6.2;
const PD = 12.8;

/* =====================================================================
   THE STACK, AND WHY THERE ARE TWO OF THEM

   The owner's labelled teardown diagram corrected this bench twice over,
   and both corrections are content rather than decoration.

   1. IT IS AN OLED PHONE, SO IT HAS NO BACKLIGHT.

      This bench modelled one stack — an LCD, with a backlight under the
      panel — and the whole torch test rests on that backlight existing:
      a dark screen that still shows a faint image under a torch is the
      BACKLIGHT, and the same screen with nothing under it is the PANEL.
      Different part, very different money.

      On an OLED there is no backlight to fail. Each pixel makes its own
      light, so a dark OLED is a dead panel and the torch tells you
      nothing. A student taught one stack applies the torch test to a
      phone that cannot answer it, and concludes the panel is fine.

      So the bench carries BOTH and a scenario says which. That is not
      extra work for its own sake: LCD against OLED is on the exam, and
      the difference between them is exactly this layer.

   2. THE MAIN LOGIC BOARD IS ITS OWN LAYER.

      It was drawn glued to the midframe, as though a bent frame and a
      dead board were one part. They are not, they fail differently, and
      they cost very different amounts — so the board is its own layer
      with its own pip, and it can be named as the thing that failed.

   The order is still the lesson, so it is still declared once, here, and
   everything else reads it rather than re-deciding.
   ===================================================================== */
const GAP = 1.45;

/* THE STACK IS FANNED, NOT SQUARELY STACKED. Straight up, a layer with a
   smaller footprint than the one above it is completely hidden — the main
   logic board went in and could not be seen at all. The owner's diagram
   does not stack squarely either: it fans them, each sheet offset from
   the one below, which is why every layer in it is legible at once.

   0.72 and -0.42 are the SMALLEST values that satisfy
   checkEveryLayerIsVisible below, found by walking them up until it
   stopped complaining rather than by picking a number that looked right. */
const FAN_X = 0.72, FAN_Z = -0.42;

/* =====================================================================
   THE STACK, AND WHY THERE ARE TWO OF THEM

   The OLED stack IS THE OWNER'S DIAGRAM, layer for layer and label for
   label. It was drawn out and handed over with everything named on it,
   and the model is built to match it rather than to approximate it:

     TOP GLASS (FRACTURED DIGITIZER)     one layer, not two
     OPTICAL ADHESIVE & POLARIZER        which was missing entirely
     OLED DISPLAY PANEL                  with the FLEX CABLE off its edge
     MIDFRAME (ALUMINUM ALLOY)           carrying the GOLD ANTENNA WIRE
     MAIN LOGIC BOARD (PCB)              with the MAIN BATTERY CONNECTOR
     BATTERY CELL (L-19 LI-ION, 12.6 Wh)

   Three of those were wrong here and one did not exist.

   TOP GLASS AND DIGITIZER ARE ONE PART ON AN OLED, and that is not a
   drawing convenience — it is the reason a cracked screen on a modern
   phone costs what it does. The touch layer is bonded into the glass and
   the panel is bonded to that, so "just replace the glass" is not a
   repair anybody can buy. The diagram says so in its own label and the
   model now says the same.

   THE LCD STACK KEEPS BOTH SPLIT, and gains a backlight, because that is
   what an LCD assembly is. The two differences carry the two lessons:

     - an OLED has NO BACKLIGHT, so the torch test cannot be run on one
       and a black screen is the panel;
     - an LCD often HAS a separately replaceable digitizer, so on one the
       question "is the glass or the panel broken" has two different
       answers at two very different prices.

   The order is the lesson, so it is declared once, here, and everything
   else reads it rather than re-deciding.
   ===================================================================== */
const LAYER_SPEC = {
  back:      { label: "Back cover",       says: "Off, and set aside" },
  battery:   { label: "Battery cell",     says: "L-19 Li-ion, 12.6 Wh, 3.8 V" },
  board:     { label: "Main logic board", says: "SoC, memory, radios, charge control" },
  midframe:  { label: "Midframe",         says: "Aluminium alloy casting — antennas, connectors, charge port" },
  backlight: { label: "Backlight",        says: "Lights the panel from behind" },
  lcd:       { label: "Display panel",    says: "Makes the picture" },
  polariser: { label: "Optical adhesive & polariser",
               says: "Bonds the glass to the panel and cuts the glare" },
  digitizer: { label: "Digitizer",        says: "Senses the touch" },
  glass:     { label: "Cover glass and digitizer", says: "One part. The bit that cracks, with the touch sensor bonded into it" }
};

/* Where the two stacks disagree, the label has to disagree too — the
   panel is a different technology and the glass is a different part. */
const LABEL_FOR = {
  oled: {
    lcd:   { label: "OLED display panel",
             says: "Each pixel makes its own light. There is nothing behind it." },
    glass: { label: "Top glass, digitizer and panel \u2014 one unit",
             says: "Cracks here, and on an OLED the panel is bonded in as well. Nothing on " +
               "this assembly is separable, which is why the bill is what it is." }
  },
  lcd: {
    lcd:   { label: "LCD display panel",
             says: "Makes the image. It is lit from behind, not by itself." },
    glass: { label: "Cover glass and digitizer \u2014 one part",
             says: "Cracks here. The touch sensor is bonded into it and cannot be bought " +
               "separately \u2014 but the panel underneath is its own part and is reused." }
  }
};

/* Bottom to top. */
/* THE LCD STACK HAS NO SEPARATE DIGITIZER LAYER, and that is a change to
   what this bench teaches rather than to how it looks.

   Three ways a screen is really sold, and the model used to teach the
   first and the third and skip the second:

     1. glass alone, digitizer separate \u2014 older and cheap handsets, rare
     2. GLASS AND DIGITIZER BONDED AS ONE PART, panel separate underneath
     3. glass, digitizer and panel all bonded \u2014 the modern OLED assembly

   Two is the standard today and it is the one a student will meet most,
   so it is what the LCD stack now models. The consequence is the lesson:
   a cracked LCD screen is a glass-and-digitizer assembly and the panel
   under it is REUSED, where the same crack on an OLED takes the panel
   with it. That is the difference between a moderate bill and a large
   one, and it is the single most useful thing this bench says about
   screens. */
const ORDER = {
  lcd:  ["back", "battery", "board", "midframe", "backlight", "lcd", "glass"],
  oled: ["back", "battery", "board", "midframe", "lcd", "polariser", "glass"]
};

export function layersFor(panel) {
  const kind = panel === "oled" ? "oled" : "lcd";
  const keys = ORDER[kind];
  /* CENTRED ON THE FAN, not on the bottom layer: fanning from zero walked
     the stack off one corner of the mat, and the two stacks being
     different heights walked different distances. */
  const mid = (keys.length - 1) / 2;
  return keys.map(function (k, i) {
    const over = (LABEL_FOR[kind] || {})[k] || {};
    return { key: k, y: i * GAP, x: (i - mid) * FAN_X, z: (i - mid) * FAN_Z,
             label: over.label || LAYER_SPEC[k].label,
             says: over.says || LAYER_SPEC[k].says };
  });
}

/* The LCD stack is the superset of the layer KEYS and stays the default
   export, so anything enumerating every layer that can exist still gets
   them. Anything drawing a PARTICULAR handset must use layersFor(). */
export const LAYERS = layersFor("lcd");

/* THE TWO STACKS CARRY TWO LESSONS, AND EACH NEEDS ITS OWN LAYER TO DO IT.

   This used to demand the stacks differ by the backlight and nothing
   else, which was true when the OLED one was just the LCD one with a
   layer taken out. It is not true any more, and it should not be: the
   owner's diagram has an OPTICAL ADHESIVE & POLARIZER that an LCD stack
   does not, and it fuses the digitizer into the top glass, which an LCD
   assembly does not.

   So the check states what actually has to hold:

     - an OLED must have NO backlight. There is nothing behind the pixels
       to fail, and the torch test this lab teaches cannot be run on one.
     - an OLED must have NO separate digitizer layer. It is bonded into
       the glass, which is why a cracked screen is a whole-assembly job.
     - an LCD must have BOTH, because both are what an LCD assembly is and
       both are what its two diagnoses turn on.
     - both must carry the six layers they share, in the same order — a
       stack that reordered the battery under the board would be teaching
       a different phone. */
(function checkTheTwoStacks() {
  const SHARED = ["back", "battery", "board", "midframe", "lcd", "glass"];
  ["lcd", "oled"].forEach(function (p) {
    const got = ORDER[p].filter(function (k) { return SHARED.indexOf(k) >= 0; });
    if (got.join(",") !== SHARED.join(",")) {
      throw new Error("bench-mobile: the " + p + " stack carries the shared layers as " +
        got.join(",") + " and they have to be " + SHARED.join(",") + ". Both stacks are the " +
        "same phone; only the display assembly differs.");
    }
    ORDER[p].forEach(function (k) {
      if (!LAYER_SPEC[k]) throw new Error("bench-mobile: the " + p + " stack names a layer, " +
        k + ", that has no description.");
    });
  });
  if (ORDER.oled.indexOf("backlight") >= 0) {
    throw new Error("bench-mobile: the OLED stack has a backlight in it. An OLED pixel makes " +
      "its own light — there is nothing behind it to fail, and the torch test that this bench " +
      "teaches cannot be run on one.");
  }
  ["lcd", "oled"].forEach(function (p) {
    if (ORDER[p].indexOf("digitizer") >= 0) {
      throw new Error("bench-mobile: the " + p + " stack has a separate digitizer layer. On " +
        "BOTH stacks the touch sensor is bonded into the cover glass and the two are sold as " +
        "one part \u2014 that is the standard today and it is what the owner set. Splitting them " +
        "here would tell a student they can buy the glass on its own, and then quote for a " +
        "part that does not exist. What differs between the stacks is whether the PANEL comes " +
        "with it: on an LCD it does not and is reused, on an OLED it does.");
    }
  });
  if (ORDER.oled.indexOf("polariser") < 0) {
    throw new Error("bench-mobile: the OLED stack has no optical adhesive and polariser. It is " +
      "on the owner's diagram, it is what bonds the glass to the panel, and it is why the two " +
      "cannot be separated on a bench.");
  }
  if (ORDER.lcd.indexOf("backlight") < 0) {
    throw new Error("bench-mobile: the LCD stack has no backlight. It is what the torch test " +
      "turns on, and it is the one thing an LCD has that an OLED has not.");
  }
})();

/* ONE COLOUR PER PART IS NOT ENOUGH WHEN THE PARTS ARE STACKED.

   Four of the seven layers — back cover, backlight, panel and digitizer —
   were all `#2b323a`. Every rule in this build was obeyed and the result
   was four identical dark rectangles floating one above the other, which
   is a pile of floor tiles and not a phone. The same adjacency failure as
   the impact bench's ribbon cassette against its platen, and the power
   bench's nine grey devices, both of which were already written down.

   So the stack now ALTERNATES in value, bottom to top, and each layer's
   value says something true about it:

     back cover  near-black   the outside of the phone, and it is
     logic board green        a PCB is green, and it is the one layer
                              nobody mistakes for anything else
     battery     silver foil  a pouch cell is bright, and it is the
                              biggest thing in there
     midframe    graphite     a metal casting
     backlight   warm white   it is the thing that MAKES LIGHT
     panel       near-black   an LCD with the light off is black; what it
                              is showing is a separate part
     digitizer   pale mesh    a touch sheet held to a window is nearly
                              clear, with the traces visible on it
     glass       pale blue    glass

   Any two neighbours differ by enough to read apart at a glance, which is
   the actual requirement — a student who cannot count the layers cannot
   learn the order, and the order is the whole point of this bench. */
const LCOLOR = {
  back:      "#242a31",   /* the outside of the phone, and it is near-black */
  battery:   "#a6abaf",   /* pouch foil, a shade below the frame so they part */
  board:     "#2f6b4e",   /* a PCB is green and nothing else on the bench is */
  midframe:  "#c6ccd2",   /* MIDFRAME (ALUMINUM ALLOY) — the diagram's word,
                             and the diagram's colour. It was dark graphite,
                             which is a machined casting before anodising and
                             not what was drawn. */
  backlight: "#e9e3d2",   /* the thing that MAKES LIGHT, on the LCD stack */
  lcd:       "#14181f",   /* an unlit panel is black; what it shows is separate */
  polariser: "#aab5b0",   /* nearly clear, faintly warm — but not so pale that the
                             picture bonded under it washes out against it */
  digitizer: "#9aa5ae",   /* a touch sheet held to a window is nearly clear */
  glass:     "#9fadb8"    /* Cover glass over a dark phone reads DARK, not white.
                             At #cfd8de the map showing through it was washed
                             out to nothing, which defeats the one thing the
                             top layer is there to show. */
};

/* What each layer is MADE of, which decides both its lighting model and
   the surface painted onto it. */
const LFINISH = {
  back: "plastic", battery: "metal", board: "matte", midframe: "metal",
  backlight: "plastic", lcd: "plastic", polariser: "glass",
  digitizer: "glass", glass: "glass"
};
const LSKIN = {
  /* A BACK COVER IS THE LARGEST FLAT SLAB ON THIS BENCH, so a painter's
     default tiling puts each speck under a pixel. One tile stretched
     across the part instead of two.

     And the painter is `shell`, not `moulded`. Moulded is pitched at a
     printer's case and on a phone it read as TARMAC \\u2014 a pebbled field of
     grit covering the whole back. A matte phone back is nearly smooth:
     fine bead, a broad soft sheen, and faint mould flow. */
  back: { kind: "shell", repeat: 0.10 },
  /* THE POUCH FOIL, AND THE REPEAT IS THE WHOLE OF IT.

     `brushed` alone takes the painter's default of 0.22 tiles per world
     unit, and this cell is 4.3 wide — so 0.95 tiles, UNDER one across the
     part. Every brush stroke stretched into a band and the pouch rendered
     as corrugated sheet roofing rather than as foil.

     THIS FILE'S OWN NOTE has said "two to four tiles across a part is the
     range that reads" since the same mistake was made twice on a keyboard
     moulding, and it has now been got wrong three times in the too-many
     direction and once — here — in the too-few. Read the note before
     setting the number. 0.9 is 3.9 tiles across the cell. */
  battery: { kind: "brushed", repeat: 0.9 },
  board: "pcb",         /* weave, ground pour, traces */
  midframe: "alloy",    /* MILLED, not extruded \u2014 see the alloy painter */
  backlight: null,      /* optical film has no texture worth drawing */
  lcd: null,
  polariser: null,      /* it is glue and film; it has no surface at all */
  digitizer: "ito",    /* the diamond touch grid, drawn not photographed */
  glass: null           /* glass is glass */
};

const LOOK = {
  ok:      { color: "#2fd45e", glow: 0.80, says: "No fault found here" },
  suspect: { color: "#ffd426", glow: 1.20, says: "Worth checking" },
  faulty:  { color: "#ff3b30", glow: 1.60, says: "This is the layer that has failed" },
  danger:  { color: "#ff3b30", glow: 1.95, says: "STOP — do not press, puncture or charge it" },
  na:      { color: "#39404a", glow: 0.00, says: "Nothing wrong with this one" }
};
export function layerWords(v) { return (LOOK[v] || LOOK.na).says; }

/* A flat slab, which most layers are. */
function slab(y, thick, inset, shade) {
  return { shape: "rbox", size: [PW - inset, thick, PD - inset], pos: [0, y, 0],
    r: 0.18, shade: shade === undefined ? 1.0 : shade };
}

const ANT_RUNS = [
  { seg: [[-2.3, -5.4], [-2.3, -2.6], [-0.6, -1.2], [-0.6, 1.9]], head: [-0.6, 2.4] },
  { seg: [[2.5, -4.8], [2.5, -3.1], [1.1, -2.2], [1.1, 0.4]],     head: [1.1, 0.9] }
];

/* THE OPENINGS IN THE MIDFRAME'S BOTTOM WALL, as [from, to] in x.
   They live out here rather than inside the builder because
   checkTheFrameHasRealHoles measures against them, and a check that
   carries its own copy of the numbers it is checking proves nothing.

   REBUILT FROM THE OWNER'S TWO PHOTOGRAPHS OF A REAL HANDSET EDGE.

   What they corrected, and both were wrong in a way that matters:

     THE EDGE IS SYMMETRIC. There is a run of grille holes on EACH side
     of the port, not one run on one side. On most handsets only one of
     those runs is a loudspeaker and the other is the primary microphone
     behind an identical grille — which is exactly why "the speaker is
     muffled" and "nobody can hear me" are two different faults that look
     the same from the outside, and why blowing dust out of the wrong one
     fixes nothing.

     THEY ARE ROUND HOLES, not slots. A drilled hole and a milled slot are
     different manufacturing and they look different; the photograph shows
     a row of small circles.

   And the port itself is a USB-C RECEPTACLE, which has a shape: a metal
   shell with fully rounded ends, a tongue standing in the middle of it,
   and mounting wings soldered down either side. A rectangle is not that. */
const MIDFRAME_GAPS = {
  /* SIZED TO THE REAL PARTS, not eyeballed. A USB-C receptacle shell is
     8.9mm wide and 2.6mm tall; this handset is 6.2 units across for a
     70mm phone, so one unit is about 11.3mm and the shell is 0.79 units.
     The first cut was 1.66 \u2014 more than twice life size, which is the same
     mistake the gold snap connectors made. Everything on this edge is
     derived from that scale now. */
  port:    [-0.48, 0.48],
  grilleL: [-2.20, -0.85],
  grilleR: [ 0.85,  2.20],
  holes: 6,            /* per run, counted off the owner's photograph */
  holeD: 0.10          /* about 1mm on a 70mm handset, which is what they are */
};

/* THE ANTENNA BREAKS, as [from, to] along z on each side wall.

   The single most important thing on a metal-framed handset and the model
   did not have it. The frame IS the antenna: the alloy rim is the radiating
   element, and it only works because it is CUT — those plastic bands you
   can see across the edge of every metal phone are not trim, they are the
   feed gaps. A student who does not know that will happily pack a
   replacement frame in without its inserts, or crush one refitting a
   screen, and hand back a phone with no signal and nothing else wrong
   with it.

   So the side walls are built in three pieces with two real gaps, exactly
   as the bottom wall is for the charge port, and a separate PLASTIC part
   fills them. Two materials meeting at a line is the whole lesson, and it
   cannot be told with one. */
const ANT_BREAKS = [[-4.30, -3.96], [3.96, 4.30]];

/* Where the wireless charging coil sits, and how big it is. Out here
   because the coil, the ferrite sheet under it and the rib lattice all
   have to agree about the space it occupies. */
const COIL = { z: 0.4, rOuter: 1.72, rInner: 0.78, turns: 7 };

/* THE BACK COVER'S FOUR CAMERA HOLES, and the island they sit in.

   HOLES, not lenses. The cameras are mounted on the board; the cover has
   openings that they look out through. That distinction is the reason
   this layer is worth building at all — a student who thinks the camera
   lives in the back cover will order the wrong part, and one who has seen
   the cover come off with four empty holes in it never will.

   Four of them, in the square cluster most current handsets use: wide,
   ultra-wide, telephoto and a depth or macro sensor. Sized off the real
   thing at this build's scale of about 11.3mm to the unit — an opening is
   10 to 12mm across, so a shade under 1.0.

   `checkTheCoverHasFourHoles` measures against this list, so the numbers
   live here rather than inside the builder. */
const CAM = {
  /* The island is sized so the four bores and the metal round them FIT
     INSIDE it. At 2.75 they did not: each ring reached 1.61 from the
     island's centre on a half-width of 1.375, so the rings overran the
     plateau's edge and the cluster rendered as a heap of loose arcs. A
     real four-camera island is about 35mm square with the openings 16mm
     apart, which at 11.3mm to the unit is 3.1 and 1.42. */
  island: { x: -1.45, z: -4.35, w: 3.25, d: 3.25, h: 0.30 },
  bore: 0.88,                       /* opening diameter \u2014 about 10mm */
  holes: [[-2.20, -5.10], [-0.70, -5.10], [-2.20, -3.60], [-0.70, -3.60]],
  flash: [0.55, -5.05],
  mic:   [0.55, -3.70]
};

/* The perimeter adhesive that holds the cover on, as an inset from the
   cover's own edge. Its own part, its own material, and a real service
   fact: this is why a back comes off with heat and a suction cup, and why
   the phone is no longer water resistant if it is not replaced. */
const COVER_ADHESIVE = { inset: 0.34, width: 0.26 };

/* THE LCD PANEL'S OWN NUMBERS, out here because SIX things have to agree
   about them: the TFT glass, the seal that holds the crystal gap open, the
   colour filter above it, the two polarisers, the gate driver that bonds
   to a ledge, and the check that measures the lot.

   The lesson that put them here was the light guide plate's, one layer
   down: a sheet placed 0.0025 above the thing under it is arithmetically
   in the open air and renders as nothing. So the spacing is declared once
   and it is GENEROUS — nothing here clears its neighbour by less than
   0.035, which is more than ten times the sliver that failed.

   Thicknesses are drawn, not scaled. At 11.3mm to the unit a real
   polariser (0.15mm) would be 0.013 and a real crystal gap (4 microns)
   would be 0.0000004. Both would be invisible, so both are drawn thick
   enough to see and the parts' own notes carry the true figures. Anything
   whose real size CAN be honoured here is — the panel's outline, the
   ledges, the driver — and this comment is the record of which is which. */
const PANEL_T = { rear: 0.05, tft: 0.07, gap: 0.09, cf: 0.06, front: 0.05 };
const PANEL_Y = { rear: 0.02, tft: 0.13, gap: 0.245, cf: 0.375, front: 0.485 };
/* The colour filter is SMALLER than the TFT glass, and the difference is
   the point: 0.30 of ledge down each side for the gate driver, and 0.75 at
   the bottom edge for the source driver's chip-on-film. Vertical bands
   have an address and horizontal bands have a different one. */
const CF = { inX: 0.60, inZ: 0.75, offZ: -0.275 };
/* THE TOUCH SENSOR'S OWN GEOMETRY, out here because the traces are drawn
   by digitizerGold and the pane they are bonded to is drawn by glass, and
   the two have to agree about where the sensor is. Both used to be in one
   builder, which is how a copper fan-out ended up being painted with a
   glass material. */
const SENSOR = (function () {
  const R = 0.42;                              /* the glass frame's rim */
  const W = PW - 0.55, D = PD - 0.55;
  return { bb: 0.20, iw: W - R * 2 + 0.5, id: D - R * 2 + 0.5, y: -0.055 };
})();

const SEAL = (function () {
  const W = PW - 0.7 - CF.inX, D = PD - 0.7 - CF.inZ;
  return { w: W, d: D, z: CF.offZ, rim: 0.22 };
})();

/* THE POUCH CELL'S OWN NUMBERS.

   Out here, and not inside the builder, because THREE things have to agree
   about where the swollen dome is: the cell that grows it, the printed
   LABEL that is stretched over it, and checkSwellingDomes that measures
   it. The label was a flat plate at a fixed height, which was fine while
   the dome was a stack of boxes it happened to clear and became a label
   buried inside the battery the moment the dome became a curve. */
const CELL = (function () {
  const BW = PW - 1.4, BD = PD - 4.6;
  const body = BW - 0.5, bodyD = BD - 0.5;
  return { BW: BW, BD: BD, BZ: 0.8, base: 0.62,
           body: body, bodyD: bodyD,
           rise: 0.62,          /* how far the crown of the dome stands above the lid */
           sunk: 0.34,          /* how far the ellipsoid's middle sits below it */
           cx: body * 0.47 };   /* the dome's half-width */
})();

/* THE SLOPE OF THAT DOME at the same u, as an angle about Z.

   Out here beside cellDome for the same reason cellDome is out here:
   THREE things now have to agree about the curve — the ellipsoid that is
   the dome, the creases that lie along it, and the printed LABEL that is
   glued over it. The label was laid as nine flat strips at nine heights
   with no tilt, and seen from the side that is not a curve, it is a
   venetian blind: the same too-few-steps failure the dome itself had when
   it was five stacked boxes, one level up.

   A flat box turned by phi about Z rises tan(phi) per unit of x, so the
   angle wanted is simply atan of the ellipse's own dh/dx. */
function cellSlope(u) {
  const cy = CELL.rise + CELL.sunk;
  const s = Math.sqrt(Math.max(1e-4, 1 - u * u));
  return Math.atan2(-cy * u, CELL.cx * s);
}

/* How far the swollen dome stands above the lid, u of the way out from
   its centre across the cell's width (u in -1 .. 1). */
function cellDome(u) {
  const cy = CELL.rise + CELL.sunk;
  return cy * Math.sqrt(Math.max(0, 1 - u * u)) - CELL.sunk;
}

/* ---------- each layer ---------- */
const BUILD = {
  back: function (y) {
    /* THE BACK COVER, REBUILT AS A PANEL WITH FOUR REAL HOLES IN IT.

       It was one slab with a raised lump on it wearing a photograph, and
       flat on it rendered as an empty black rectangle. Two things changed.

       The finish is MATTE BLACK on a generated surface rather than the
       `moulded` pebble it had, which read as tarmac. And the camera island
       carries four OPENINGS built the way the speaker grille is — rings of
       blocks, right through the panel — because the cameras are on the
       board and the cover only lets them look out. A student who has seen
       this come off with four empty holes in it will never order a back
       cover when a camera has failed.

       The panel around the island is drawn as a frame of four pieces, so
       the island's square is a genuine gap in the sheet rather than a
       shape laid on top of it. */
    const T = 0.22;                          /* how thick the cover is */
    const I = CAM.island;
    const out = [];
    const ix0 = I.x - I.w / 2, ix1 = I.x + I.w / 2;
    const iz0 = I.z - I.d / 2, iz1 = I.z + I.d / 2;

    /* the panel, as a frame round the island's square */
    [[-PW / 2, PW / 2, -PD / 2, iz0], [-PW / 2, PW / 2, iz1, PD / 2],
     [-PW / 2, ix0, iz0, iz1], [ix1, PW / 2, iz0, iz1]].forEach(function (q) {
      out.push({ shape: "rbox", size: [q[1] - q[0], T, q[3] - q[2]],
        pos: [(q[0] + q[1]) / 2, y, (q[2] + q[3]) / 2], r: 0.18, shade: 1.0 });
    });

    /* THE CAMERA ISLAND: a raised plateau with four bores through it.

       Built the right way round. The first attempt made each bore a WIDE
       ring of blocks and let those rings be the plateau, and the outer
       end of every block is a straight chord \u2014 so the ring's outside came
       out serrated and the whole cluster rendered as four cog wheels.

       The plateau is SOLID RECTANGLES with square cells left out of it,
       one per camera, and each ring is then only thick enough to round
       its own square cell into a circle. Nothing serrated is ever
       exposed, because the rectangles cover it. */
    const bR = CAM.bore / 2;
    const off = 0.75;                        /* hole centres, from the island's middle */
    const hw = I.w / 2, hd = I.d / 2;
    const cin = off - bR, cout = off + bR;   /* where the square cells start and end */
    [[-cin, cin, -hd, hd],                   /* the strip between the two columns */
     [-hw, hw, -cin, cin],                   /* and between the two rows */
     [-hw, -cout, -hd, hd], [cout, hw, -hd, hd],
     [-hw, hw, -hd, -cout], [-hw, hw, cout, hd]].forEach(function (q) {
      if (q[1] - q[0] < 0.02 || q[3] - q[2] < 0.02) return;
      out.push({ shape: "rbox", size: [q[1] - q[0], T + I.h, q[3] - q[2]],
        pos: [I.x + (q[0] + q[1]) / 2, y + I.h / 2, I.z + (q[2] + q[3]) / 2], r: 0.06, shade: 0.82 });
    });
    /* EACH BORE IS ONE OPEN CYLINDER.

       Two versions of this were rings of blocks filling the cusp between
       the circle and its square cell, and both rendered as cog teeth: the
       blocks are radial spokes, so however finely they are divided their
       corners catch the light one at a time and the opening comes out
       serrated. Thinning them and multiplying them only made smaller
       teeth.

       The cusp they were filling is 0.18 at its widest and invisible at
       any distance a student looks from. So it is not filled. Each cell
       is left square-cornered \u2014 which is what a real camera island's
       bezel is anyway, a squircle \u2014 and the opening itself is a `tube`,
       an open-ended cylinder, which is precisely a bore and has one
       smooth wall instead of forty faces.

       The lesson, third time now: when a shape exists in the vocabulary,
       use it. `tube` for a bore, `torus` for a ring, `sphere` for a dome.
       Approximating any of them out of boxes looks approximated. */
    CAM.holes.forEach(function (h) {
      out.push({ shape: "tube", size: [CAM.bore, T + I.h], pos: [h[0], y + I.h / 2, h[1]],
        seg: 40, shade: 0.62, isBore: true });
      /* the polished lip round the mouth of each opening */
      out.push({ shape: "torus", size: [CAM.bore + 0.07, 0.07],
        pos: [h[0], y + I.h + T / 2 - 0.02, h[1]], rot: [P2, 0, 0], seg: 40, seg2: 10, shade: 1.30 });
    });

    /* the flash, a two-tone unit because a phone flash is two LEDs at
       different colour temperatures, and the microphone hole beside it */
    out.push({ shape: "cyl", size: [0.46, T + I.h], pos: [CAM.flash[0], y + I.h / 2, CAM.flash[1]],
      seg: 22, shade: 0.82 });
    out.push({ shape: "cyl", size: [0.30, 0.06], pos: [CAM.flash[0], y + I.h + T / 2 - 0.02, CAM.flash[1]],
      seg: 20, shade: 2.1 });
    out.push({ shape: "cyl", size: [0.16, T + 0.06], pos: [CAM.mic[0], y, CAM.mic[1]], seg: 14, shade: 0.22 });

    /* the mould-flow ridge that runs round the inside of a shell, and the
       four locating pips that key it to the frame */
    out.push({ shape: "rbox", size: [PW - 0.5, 0.05, PD - 0.5], pos: [0, y - T / 2 - 0.02, 0], r: 0.20, shade: 0.90 });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
      out.push({ shape: "cyl", size: [0.24, 0.14], pos: [q[0] * (PW / 2 - 0.75), y - T / 2 - 0.06, q[1] * (PD / 2 - 1.1)],
        seg: 14, shade: 0.72 });
    });
    return out;
  },
  /* THE ANTENNA BAND SEAMS across the back, lining up with the four breaks
     cut into the midframe's rim. Their own part and their own material,
     so a student can see the SAME feature from both sides: the frame is
     cut, and the cover is moulded round the cut. */
  backBands: function (y) {
    const out = [];
    ANT_BREAKS.forEach(function (b) {
      const z = (b[0] + b[1]) / 2;
      out.push({ shape: "rbox", size: [PW, 0.05, b[1] - b[0]], pos: [0, y + 0.10, z], r: 0.02, shade: 1.0 });
    });
    return out;
  },
  /* THE PERIMETER ADHESIVE. A real service fact drawn as a real part:
     this strip is why a back cover comes off with heat and a suction cup
     rather than a prise, and why a phone stops being water resistant the
     moment somebody refits one without replacing it. */
  backAdhesive: function (y) {
    const A = COVER_ADHESIVE;
    const W = PW - A.inset * 2, D = PD - A.inset * 2, T = 0.22;
    const out = [];
    [[0, -D / 2 + A.width / 2, W, A.width], [0, D / 2 - A.width / 2, W, A.width]].forEach(function (q) {
      out.push({ shape: "rbox", size: [q[2], 0.06, q[3]], pos: [q[0], y - T / 2 - 0.05, q[1]], r: 0.02, shade: 1.0 });
    });
    [-1, 1].forEach(function (sx) {
      out.push({ shape: "rbox", size: [A.width, 0.06, D - A.width * 2],
        pos: [sx * (W / 2 - A.width / 2), y - T / 2 - 0.05, 0], r: 0.02, shade: 1.0 });
    });
    return out;
  },
  /* THE REGULATORY PRINT. Its own part because it is INK on a shell, and
     the model IMEI printed here is what a technician reads to order the
     right part and what a customer is asked for on the phone. */
  backPrint: function (y) {
    const out = [];
    const rows = [[1.9, 0.10], [1.5, 0.08], [2.2, 0.08], [1.1, 0.08]];
    rows.forEach(function (r, i) {
      out.push({ shape: "box", size: [r[0], 0.02, r[1]], pos: [0, y + 0.12, PD / 2 - 2.6 + i * 0.30],
        r: 0.005, shade: 1.0 });
    });
    /* the row of certification marks under them */
    out.push({ shape: "box", size: [0.20, 0.02, 0.20], pos: [-0.9, y + 0.12, PD / 2 - 1.3], r: 0.005,
      shade: 1.0, repeat: { count: 5, step: [0.44, 0, 0] } });
    return out;
  },
  /* THE SWOLLEN CELL, REBUILT FROM THE OWNER'S PHOTOGRAPH OF TWO POUCHES

     A good cell and a swollen one, side by side on a bench, one tagged.
     The shot is worth more than everything else on the mobile list because
     it corrects the thing this model had wrong, and had wrong in a way no
     amount of reading would have found.

     What was here: the cell got THICKER (0.62 to 1.35) and it changed
     COLOUR (slate to brown). Both invented. In the photograph:

       - the two pouches are the SAME COLOUR. Silver foil, white printed
         label, identical. A student taught to look for a discoloured
         battery will pass over a dangerous one.
       - the swollen one has the SAME FOOTPRINT. Its edges sit exactly
         where the good one's do — the seal welds do not move.
       - it DOMES. The middle lifts, the foil creases round the rise, and
         it will not lie flat. That is the whole tell, and it is a shape.

     So the cell now swells the way the real one does: same colour, same
     edges, a crowned middle with creases in it. The verdict is carried by
     the pip and the words beside it, as it is on every other bench here —
     never by a colour the hardware does not have. */
  /* THE CELL, BUILT AS A POUCH RATHER THAN AS A SLAB.

     A pouch cell is not a brick. It is a laminate bag: two sheets of
     aluminium-polymer laminate, deep-drawn on one side to make a tray,
     the stack of electrodes dropped in, and the two sheets heat-sealed
     round the edge. That leaves a shape nothing else has —

       a rounded BODY that bulges slightly even when it is healthy,
       a flat SEAL FLANGE standing out beyond the body on all four sides,
       the flange FOLDED OVER at two corners so the cell fits its bay,
       two TABS through the seal at one end, one aluminium and one nickel,
       and creases where the laminate was drawn.

     It was seven primitives: a rounded box with four thin bars round it
     standing in for the seal. That reads as a slab with a picture frame.
     The flange is the thing you recognise a pouch by — it is why a cell
     never sits flat against the frame and why a swollen one lifts the
     screen before it lifts anything else.

     The FOOTPRINT of the body is identical swollen or not, and so is the
     flange. Only the body's crown moves. checkSwellingDomes holds that. */
  battery: function (y, swollen) {
    const BW = PW - 1.4, BD = PD - 4.6, BZ = 0.8;
    const base = 0.62;
    const FL = 0.34;               /* how far the seal flange stands out */
    const FT = 0.07;               /* how thick the flange is */
    const body = BW - 0.5, bodyD = BD - 0.5;
    const out = [];

    /* THE SEAL FLANGE, four sides, at the height the two laminate sheets
       are welded together — which is NOT the bottom of the cell. The weld
       line sits at about a third of the body's height, because one sheet
       is drawn down into a tray and the other is flat. That offset is
       what makes a pouch look like a pouch from the side. */
    const weld = y + base * 0.34;
    out.push({ shape: "rbox", size: [body + FL * 2, FT, FL], pos: [0, weld, BZ - bodyD / 2 - FL / 2], r: 0.03, shade: 0.80 });
    out.push({ shape: "rbox", size: [body + FL * 2, FT, FL], pos: [0, weld, BZ + bodyD / 2 + FL / 2], r: 0.03, shade: 0.80 });
    out.push({ shape: "rbox", size: [FL, FT, bodyD], pos: [-body / 2 - FL / 2, weld, BZ], r: 0.03, shade: 0.80 });
    out.push({ shape: "rbox", size: [FL, FT, bodyD], pos: [ body / 2 + FL / 2, weld, BZ], r: 0.03, shade: 0.80 });
    /* the two corners where the flange is folded back against the body,
       which is how a cell is made to fit a bay narrower than its flange */
    [-1, 1].forEach(function (sx) {
      /* 0.11 tall, not 0.26. At 0.26 these read as two clamps gripping
         the corners of the cell rather than as foil folded flat against
         it, which is what a fold IS — the flange is 0.07 thick, so a fold
         of it is about twice that and no more. */
      out.push({ shape: "rbox", size: [FL * 1.4, 0.11, FL * 1.4],
        pos: [sx * (body / 2 + FL * 0.35), weld + 0.03, BZ + bodyD / 2 + FL * 0.30],
        rot: [0, sx * 0.5, 0], r: 0.04, shade: 0.66 });
    });

    /* THE BODY: the drawn tray below the weld, and the domed lid above it.
       Two pieces rather than one box, because the tray is deep-drawn with
       a radius at its foot and the lid is nearly flat with a soft crown —
       and the step between them at the weld line is the profile. */
    out.push({ shape: "rbox", size: [body, base * 0.36, bodyD], pos: [0, y + base * 0.18, BZ], r: 0.22, shade: 0.94 });
    out.push({ shape: "rbox", size: [body, base * 0.70, bodyD], pos: [0, y + base * 0.63, BZ], r: 0.26, shade: 1.0 });
    /* the shallow crown a healthy cell already has — laminate over a stack
       is never dead flat */
    out.push({ shape: "rbox", size: [body - 0.55, 0.10, bodyD - 0.55], pos: [0, y + base + 0.02, BZ], r: 0.34, shade: 1.03 });

    /* THE TABS through the seal at the head of the cell. Two of them, one
       aluminium and one nickel-plated copper — different metals, which is
       why they are drawn at different values, and the reason you never
       bridge them. */
    [-0.72, 0.72].forEach(function (dx, i) {
      out.push({ shape: "rbox", size: [0.62, 0.10, 0.85],
        pos: [dx, weld + 0.02, BZ - bodyD / 2 - FL - 0.30], r: 0.02, shade: i ? 1.45 : 1.20 });
    });

    if (swollen) {
      /* THE DOME IS ONE ELLIPSOID, NOT A STACK OF COURSES.

         It was five rboxes, each smaller and higher. Five courses do not
         read as a curve — they read as a ziggurat, and a render said so
         plainly: a wedding cake sitting on a battery. The named failure
         mode in CLAUDE.md is "a worn profile with too few steps to read as
         a curve", and this was it. More courses is the wrong answer to it;
         the right answer is the shape, so the renderer's sphere takes
         three sizes now and this is an ellipsoid sunk into the lid.

         RISE is the one number the fault is carried by. It is measured
         from the lid, and checkSwellingDomes holds it against the good
         cell's own top rather than against a constant. */
      const RISE = CELL.rise, SUNK = CELL.sunk;
      out.push({ shape: "sphere", size: [CELL.cx * 2, (RISE + SUNK) * 2, bodyD * 0.96],
        pos: [0, y + base - SUNK, BZ], seg: 28, shade: 1.0 });
      /* THE CREASES SIT ON THE DOME, and where that is has to be computed
         rather than picked, because the dome is a curve now. Semi-axes a
         and b, the fold at u of the way out from the centre, so its height
         is b*sqrt(1 - u*u) above the ellipsoid's own centre and its lie is
         the slope there. Creases run LENGTHWISE: a pouch folds along its
         long edges because that is the way the laminate was drawn.
         checkSwellingDomes refuses any of this that widens the cell. */
      const cx = body * 0.47, cy = RISE + SUNK, yc = y + base - SUNK;
      [-0.74, -0.40, 0.40, 0.74].forEach(function (u) {
        const h = cy * Math.sqrt(1 - u * u);
        /* dy/dx on the ellipse, turned into a tilt so the fold lies along
           the surface instead of standing off it */
        const slope = Math.atan2(cy * cy * (u * cx), cx * cx * h) * (u < 0 ? -1 : 1);
        out.push({ shape: "box", size: [0.13, 0.07, bodyD * 0.62],
          pos: [u * cx, yc + h - 0.03, BZ], rot: [0, 0, u < 0 ? slope : -slope],
          r: 0.02, shade: 0.80 });
      });
    }

    /* THE FLEX TAIL, SHORTENED TO MAKE ROOM FOR THE PROTECTION BOARD.

       It used to run the whole way from the tabs to the connector as one
       box, which drew a cell wired straight to a plug. There is no such
       battery. The tabs weld to a BOARD and the flex leaves the board —
       see cellProtection, which now occupies the space this box had. */
    out.push({ shape: "box", size: [1.5, 0.08, 0.72], pos: [0, weld, -4.96], r: 0.03, shade: 0.7 });
    /* 0.62 across, not 1.0. At 11.3mm to the unit a 1.0 connector is 11mm
       wide, which is wider than the protection board is deep — it read as
       a brick bigger than the board it plugs into. A three-way battery
       connector is nearer 7mm. Same class as the u.FL at twice life size
       and the USB-C at more than twice. */
    out.push({ shape: "rbox", size: [0.62, 0.16, 0.34], pos: [0, weld + 0.09, -5.28], r: 0.03, shade: 0.5 });
    /* its three ways, which is the thermistor's pin and the two power
       pins — the reason it is a three-way and not a two */
    out.push({ shape: "box", size: [0.07, 0.05, 0.10], pos: [-0.16, weld + 0.14, -5.14],
      shade: 2.4, repeat: { count: 3, step: [0.16, 0, 0] } });
    return out;
  },
  /* THE PROTECTION BOARD, AND IT IS THE MISSING HALF OF THE PART.

     A phone battery is a CELL PLUS A BOARD, and this bench drew only the
     cell — a pouch wired straight to a plug, which is a thing that does
     not exist. The board is small and it is the whole reason a lithium
     pack can be handled at all:

       the FET PAIR       cuts the pack off at over-charge, over-discharge
                          and over-current. A pack reading zero volts is
                          very often this having tripped rather than a dead
                          cell, and that is a real diagnosis a student
                          cannot make if the board is not on the model.
       the FUSE           the one-shot backstop behind the FETs.
       the THERMISTOR     senses the cell's own temperature — and it is why
                          the connector has THREE pins and not two, which
                          is a question students actually ask.
       the WELDS          the tabs are ULTRASONICALLY WELDED to this board,
                          not soldered. Soldering a cell tab puts enough
                          heat into the cell to damage the separator, and
                          the weld nuggets are what a technician looks at
                          when a pack has been dropped.

     Its own part because it is FR4 and copper and the cell is laminate
     foil, and the adjacency rule in CLAUDE.md is about exactly this: one
     colour per part is not enough when two materials are drawn as one. */
  cellProtection: function (y) {
    const weld = y + CELL.base * 0.34;
    const BZ = -4.30;                    /* at the head, between tabs and flex */
    const out = [];
    /* the board. About 33mm by 7mm at 11.3mm to the unit, which is a real
       phone PCM rather than a guess. */
    out.push({ shape: "rbox", size: [2.90, 0.09, 0.62], pos: [0, weld + 0.02, BZ], r: 0.04, shade: 1.0 });
    /* the FET pair — one package, two devices, the largest thing on it */
    out.push({ shape: "rbox", size: [0.52, 0.13, 0.34], pos: [-0.30, weld + 0.11, BZ], r: 0.02, shade: 0.34 });
    /* the fuse */
    out.push({ shape: "rbox", size: [0.26, 0.10, 0.20], pos: [0.55, weld + 0.10, BZ - 0.10], r: 0.02, shade: 0.55 });
    /* a few passives */
    out.push({ shape: "box", size: [0.10, 0.06, 0.14], pos: [0.30, weld + 0.09, BZ + 0.16],
      r: 0.01, shade: 0.70, repeat: { count: 4, step: [0.17, 0, 0] } });
    /* THE THERMISTOR, and it is NOT on the board. It senses the CELL, so
       it sits against the pouch on two leads that run back from the board
       — which is the thing worth drawing, because a student who thinks it
       reads board temperature has the wrong model of what it protects. */
    out.push({ shape: "box", size: [0.05, 0.03, 0.55], pos: [1.05, weld + 0.06, BZ + 0.40],
      shade: 1.9, repeat: { count: 2, step: [0.12, 0, 0] } });
    out.push({ shape: "rbox", size: [0.22, 0.10, 0.16], pos: [1.11, weld + 0.07, BZ + 0.70], r: 0.03, shade: 0.42 });
    /* THE ULTRASONIC WELD NUGGETS where the two tabs land on the board.
       Flat, spread, and slightly rough — a weld, not a solder fillet. */
    [-0.72, 0.72].forEach(function (dx) {
      out.push({ shape: "rbox", size: [0.46, 0.05, 0.30], pos: [dx, weld + 0.09, BZ + 0.14], r: 0.02, shade: 1.35 });
      out.push({ shape: "cyl", size: [0.09, 0.05], pos: [dx - 0.13, weld + 0.11, BZ + 0.14],
        seg: 10, shade: 1.55, repeat: { count: 3, step: [0.13, 0, 0] } });
    });
    return out;
  },
  /* THE KAPTON OVER THE WELDS.

     Amber polyimide film, taped across the tab welds. It is not trim: it
     is the "do not short these" marker on every pack ever made, and it is
     what a technician lifts to inspect a weld. A cell shorted across its
     two tabs vents, and the two tabs are three millimetres apart.

     AMBER IS OUTSIDE THE ROYAL SIX and this is therefore a preview
     decision, not a free one — same class as the OPC drum's teal and the
     thermal printer's orange lever. The argument is the same too: the film
     IS that colour, a student finds it by that colour, and drawing it in
     one of the six would be teaching them to look for the wrong thing. */
  cellTape: function (y) {
    const weld = y + CELL.base * 0.34;
    const out = [];
    /* across both welds and the tab roots, at the head of the cell */
    /* r 0.012, NOT 0.05. A corner radius of 0.05 on a sheet 0.025 thick
       is bigger than the sheet, so the rounding swallows it and what
       renders is a bar. Film is drawn as film: thin, and barely rounded. */
    out.push({ shape: "rbox", size: [2.30, 0.025, 0.86], pos: [0, weld + 0.155, -3.98], r: 0.012, shade: 1.0 });
    /* and the short return down the face of the pouch, which is how it is
       actually stuck on — over the head and onto the front */
    out.push({ shape: "rbox", size: [2.30, 0.025, 0.62], pos: [0, weld + 0.125, -3.40], r: 0.012, shade: 0.90 });
    return out;
  },
  /* THE STRETCH-RELEASE PULL TABS under the cell.

     Two strips of adhesive with a folded grab end sticking out past the
     foot. They are the removal PROCEDURE: pull them slowly and straight
     and the cell lifts out clean; pull at an angle or fast and they snap,
     and a five-minute job becomes prising a lithium pouch out of a frame
     with a plastic card, which is how cells get punctured.

     Drawn with one tab already started, because that is what a bench
     looks like mid-job and it is the only way to see that the strip runs
     the whole length underneath. */
  cellPull: function (y) {
    const BD = CELL.BD, BZ = CELL.BZ, body = CELL.body;
    const foot = BZ + CELL.bodyD / 2;
    const out = [];
    [-1, 1].forEach(function (sx, i) {
      const x = sx * body * 0.26;
      /* UNDER the cell, not inside it. At y + 0.03 the strips were buried
         in the deep-drawn tray, which starts at y + 0 and is 0.22 deep —
         so only the grab ends showed and they read as two flaps hanging
         in mid-air with nothing attached. y - 0.045 puts them where they
         actually are: a layer the cell sits ON. */
      out.push({ shape: "box", size: [0.53, 0.05, CELL.bodyD - 0.6],
        pos: [x, y - 0.045, BZ], r: 0.01, shade: 1.0 });
      /* the grab end past the foot — one lying flat, one already lifted */
      if (i) {
        out.push({ shape: "box", size: [0.53, 0.05, 0.95], pos: [x, y - 0.045, foot + 0.42],
          r: 0.01, shade: 0.86 });
        out.push({ shape: "box", size: [0.53, 0.05, 0.70], pos: [x, y + 0.16, foot + 1.02],
          rot: [-0.85, 0, 0], r: 0.01, shade: 0.72 });
      } else {
        out.push({ shape: "box", size: [0.53, 0.05, 1.35], pos: [x, y - 0.045, foot + 0.62],
          r: 0.01, shade: 0.86 });
      }
    });
    return out;
  },
  /* THE MAIN LOGIC BOARD, from the owner's labelled diagram.

     It used to be a slab glued onto the midframe, which said a bent frame
     and a dead board were the same repair. They are not, and the price
     between them is the difference between an afternoon and a write-off.

     Drawn as an L round the top of the phone, which is where it goes on a
     handset with a full-height battery: the SoC under its shield, the
     memory stack beside it, the radio section with the antenna feed
     points, the connectors, and — labelled on the owner's diagram and
     worth its own object — the MAIN BATTERY CONNECTOR, which is the first
     thing you disconnect and the last thing you reconnect on any job
     inside a phone. */
  /* THE BATTERY'S PRINTED LABEL, its own part on the `label` painter.

     The owner's photograph of the two pouches has the label spelled out
     on both — MODEL, chemistry, capacity in watt-hours, voltage, and the
     row of warning marks. It is not decoration: it is what you read to
     order the right cell, it is where the watt-hours come from when a
     student is asked to work out runtime, and on the swollen one it is
     the thing that proves the two pouches are the same part.

     A part of its own because it is a different material from the foil
     under it, and because a shade multiplier on silver cannot make
     printed white paper. */
  batteryLabel: function (y, swollen) {
    const BW = CELL.BW, BD = CELL.BD, BZ = CELL.BZ, base = CELL.base;
    const LW = BW - 1.4;                    /* how wide the printed label is */
    const out = [];
    /* THE LABEL IS GLUED TO THE FOIL, so on a swollen cell it goes where
       the foil goes. It is laid as lengthwise strips across the width and
       each strip is lifted to the height of the dome under it, which is
       also why a swollen cell's label stops lying flat and starts catching
       the light in bands. On a good cell every strip is at the same height
       and the seams close up into one plate. */
    const N = 9;
    function liftAt(x) {
      return swollen ? Math.max(0, cellDome(x / CELL.cx)) : 0.0;
    }
    function tiltAt(x) {
      return swollen ? cellSlope(x / CELL.cx) : 0.0;
    }
    for (let i = 0; i < N; i++) {
      const x = -LW / 2 + LW * (i + 0.5) / N;
      /* base + 0.13, NOT base + 0.03. THE CELL HAS A CROWN OF ITS OWN —
         a soft rbox at base + 0.02, 0.10 thick, so it reaches base + 0.07
         — and the label was being laid at base + 0.03, which is INSIDE
         it. The label rendered as nothing at all and the cell came out a
         bare silver pouch.

         Third time in this build: the light guide plate's dots, the
         panel's polariser axis, and now this. All three were arithmetic
         that read as correct next to geometry the arithmetic did not
         know about. Measure against the thing you are sitting ON. */
      /* WIDER THAN THE PITCH, because a tilted strip covers less ground
         than a flat one: at the steepest station the projection loses
         nearly a fifth of the width, and strips sized to exactly meet
         open into gaps the moment they turn. */
      out.push({ shape: "rbox", size: [LW / N + 0.10, 0.05, BD - 2.8],
        pos: [x, y + base + 0.13 + liftAt(x), BZ],
        rot: [0, 0, tiltAt(x)], r: 0.03, shade: 1.0 });
    }
    /* THE PRINTED RULES ARE GONE FROM HERE AND INTO THE TEXTURE.

       They were five bars and a row of triangles: a stand-in for text, at
       a time when the label carried no text. The `cellFace` painter prints
       the real thing now — the part number, the chemistry, the capacity in
       both mAh and Wh, the nominal and charge voltages, the warnings and
       the marks — so bars laid over the top of it would be raised smears
       across words a student is meant to READ.

       What stays is the geometry that texture cannot do: the nine strips,
       lifted and tilted to the dome. A picture bends because the thing it
       is printed on bends. */
    return out;
  },
  /* THE PICTURE, SEEN THROUGH THE GLASS.

     On the owner's diagram every screen layer carries the map, because in
     an illustration the upper sheets are transparent. This renderer has
     no per-part transparency — established the hard way earlier, when a
     projector beam had to be drawn as four edges rather than as a
     translucent cone — so an opaque cover glass hides the panel it is
     over, and the one thing the drawing is for is lost.

     Drawing the map again on the glass, dimmed, is not painting a symptom
     on the wrong part: the picture genuinely IS visible through the
     glass, and a shattered screen with a live display under it is exactly
     what the cracked-handset photograph shows and exactly what this stage
     teaches. What is NOT drawn here is anything about the panel's health
     — if the panel is dead this is not drawn at all, so the glass never
     claims a display is working when it is not. */
  /* The sheet the cracked-screen photograph is mapped onto. Sized to sit
     inside the glass frame's opening, and a hair above the frame's own top
     face so the two do not fight. */
  /* The sheet a layer's photograph is mapped onto: flat, thin, and sitting
     just proud of the layer's own top face so the two do not fight. */
  /* THE LIFT IS MEASURED, NOT TYPED.

     A photo plate has to sit just above the layer's own top face, and for
     the battery that face MOVES: a healthy pouch tops out at 0.62 and a
     swollen one at nearly 1.5, so a fixed lift that cleared one was buried
     inside the other. The plate now asks the layer how tall it is.

     Same arithmetic mistake as three earlier parts in this file — a piece
     placed relative to one thing while the thing it sits on was decided
     somewhere else. Measuring costs four lines. */
  photoPlate: function (key, y, lift, alt) {
    const g = photoSheet(key, alt);
    if (key === "battery") {
      const list = BUILD.battery(0, alt);
      let top = -Infinity;
      list.forEach(function (q) { top = Math.max(top, q.pos[1] + q.size[1] / 2); });
      lift = top + 0.06;
    }
    return [{ shape: "box", size: [g.w, 0.02, g.d], pos: [0, y + lift, g.z],
      r: 0.01, shade: 1.0 }];
  },
  /* THE BOARD IS FOUR PARTS, BECAUSE IT IS FOUR MATERIALS.

     Drawn as one part it came out entirely green — every can, every
     connector, every pad the same colour as the laminate, differing only
     by a shade multiplier. That is one colour per part obeyed to the
     letter and the adjacency rule broken: on a real board the shield cans
     are BARE STEEL, the connectors are BLACK PLASTIC, and the pads are
     GOLD, and those three materials against green is most of what makes a
     photograph of a board look like a board.

     Splitting them does not break the colour rule — that rule exists to
     stop a part's colour encoding its STATE, and none of these change.
     Same reasoning as lifting the lamps off the RAID caddy.

     Only `layer-board` carries the layer's pip and its position in the
     stack; the other three ride along on the same offset. */
  board: function (y) {
    const BW = PW - 1.0, BD = PD - 2.4, T = 0.16;
    return [{ shape: "rbox", size: [BW, T, BD], pos: [0, y, -0.3], r: 0.14, shade: 1.0 }];
  },
  /* The shield cans: a lid, and the fence of clips it snaps onto. The
     fence is what you see once a lid is off, and it is how you know a can
     was ever there. */
  boardShields: function (y) {
    const T = 0.16, out = [];
    function can(cx, cz, w, d, h) {
      out.push({ shape: "rbox", size: [w, h, d], pos: [cx, y + T / 2 + h / 2, cz], r: 0.05, shade: 1.0 });
      /* the lid's stamped dimple pattern, which every can has */
      out.push({ shape: "box", size: [w * 0.22, 0.03, d * 0.22], pos: [cx - w * 0.22, y + T / 2 + h + 0.01, cz - d * 0.2],
        r: 0.01, shade: 0.82, repeat: { count: 3, step: [w * 0.22, 0, 0] } });
      out.push({ shape: "box", size: [w + 0.12, 0.08, 0.08], pos: [cx, y + T / 2 + 0.05, cz - d / 2 - 0.05], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [w + 0.12, 0.08, 0.08], pos: [cx, y + T / 2 + 0.05, cz + d / 2 + 0.05], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [0.08, 0.08, d], pos: [cx - w / 2 - 0.05, y + T / 2 + 0.05, cz], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [0.08, 0.08, d], pos: [cx + w / 2 + 0.05, y + T / 2 + 0.05, cz], r: 0.01, shade: 0.70 });
    }
    can(-0.85, -3.7, 1.75, 1.75, 0.34);   /* the SoC, tallest thing on any phone board */
    can( 1.15, -3.5, 1.20, 1.30, 0.28);   /* memory beside it */
    can(-0.70, -0.9, 1.90, 1.05, 0.24);   /* the radio section */
    can( 1.20,  1.5, 1.45, 0.95, 0.24);   /* power management */
    can(-1.60,  2.0, 1.05, 0.80, 0.20);   /* audio codec */
    /* six mounting screws, steel like the cans */
    [[-2.15, -5.0], [2.15, -5.0], [-2.15, -1.2], [2.15, -1.2],
     [-2.15, 4.3], [2.15, 4.3]].forEach(function (q) {
      out.push({ shape: "cyl", size: [0.34, 0.11], pos: [q[0], y + T / 2 + 0.05, q[1]], seg: 10, shade: 1.05 });
      out.push({ shape: "box", size: [0.22, 0.05, 0.05], pos: [q[0], y + T / 2 + 0.11, q[1]], r: 0.01, shade: 0.45 });
    });
    return out;
  },
  /* Connectors and the SIM reader — black plastic bodies with the latch
     bar a technician lifts, and the thing they break. */
  boardConnectors: function (y) {
    const T = 0.16, out = [];
    function conn(cx, cz, w, d) {
      out.push({ shape: "rbox", size: [w, 0.26, d], pos: [cx, y + T / 2 + 0.13, cz], r: 0.04, shade: 1.0 });
      out.push({ shape: "box", size: [w * 0.88, 0.07, d * 0.30], pos: [cx, y + T / 2 + 0.29, cz], r: 0.01, shade: 2.1 });
    }
    conn(-1.30,  3.3, 1.15, 0.55);        /* MAIN BATTERY CONNECTOR — first off, last on */
    conn( 0.30, -4.9, 1.65, 0.45);        /* display flex */
    conn( 1.55, -4.3, 0.85, 0.40);        /* front camera */
    conn(-1.85, -4.4, 0.75, 0.40);        /* rear camera */
    conn( 1.70,  3.4, 0.80, 0.42);        /* charge-port flex */
    /* the SIM tray reader on the edge the tray goes into */
    out.push({ shape: "rbox", size: [1.5, 0.22, 0.85], pos: [-1.9, y + T / 2 + 0.11, 0.6], r: 0.04, shade: 1.25 });
    /* passives, in the clusters they actually sit in rather than a tidy row */
    [[-2.20, -2.6, 5, [0, 0, 0.42]], [2.20, -4.5, 4, [0, 0, 0.42]],
     [0.20,  4.4, 6, [0.36, 0, 0]]].forEach(function (g) {
      out.push({ shape: "box", size: [0.22, 0.09, 0.30], pos: [g[0], y + T / 2 + 0.05, g[1]],
        r: 0.02, shade: 0.75, repeat: { count: g[2], step: g[3] } });
    });
    out.push({ shape: "rbox", size: [0.42, 0.16, 0.42], pos: [0.05, y + T / 2 + 0.08, 2.3], r: 0.04, shade: 1.5,
      repeat: { count: 3, step: [0.58, 0, 0] } });
    return out;
  },
  /* Gold: the two antenna feed pads the coax snaps onto, and the SIM
     reader's contacts. A coax knocked off one of these during a screen
     swap is a "no signal after repair" that costs somebody an afternoon,
     which is why they are drawn as their own findable thing. */
  boardGold: function (y) {
    const T = 0.16;
    return [
      { shape: "cyl", size: [0.46, 0.19], pos: [-2.05, y + T / 2 + 0.09, -2.1], seg: 12, shade: 1.0 },
      { shape: "cyl", size: [0.26, 0.22], pos: [-2.05, y + T / 2 + 0.13, -2.1], seg: 10, shade: 0.72 },
      { shape: "cyl", size: [0.46, 0.19], pos: [ 2.05, y + T / 2 + 0.09,  0.2], seg: 12, shade: 1.0 },
      { shape: "cyl", size: [0.26, 0.22], pos: [ 2.05, y + T / 2 + 0.13,  0.2], seg: 10, shade: 0.72 },
      { shape: "box", size: [0.10, 0.06, 0.60], pos: [-2.40, y + T / 2 + 0.23, 0.6], r: 0.01, shade: 1.0,
        repeat: { count: 4, step: [0.28, 0, 0] } }
    ];
  },
  boardShields: function (y) {
    const T = 0.16, out = [];
    function can(cx, cz, w, d, h) {
      out.push({ shape: "rbox", size: [w, h, d], pos: [cx, y + T / 2 + h / 2, cz], r: 0.05, shade: 1.0 });
      /* the lid's stamped dimple pattern, which every can has */
      out.push({ shape: "box", size: [w * 0.22, 0.03, d * 0.22], pos: [cx - w * 0.22, y + T / 2 + h + 0.01, cz - d * 0.2],
        r: 0.01, shade: 0.82, repeat: { count: 3, step: [w * 0.22, 0, 0] } });
      out.push({ shape: "box", size: [w + 0.12, 0.08, 0.08], pos: [cx, y + T / 2 + 0.05, cz - d / 2 - 0.05], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [w + 0.12, 0.08, 0.08], pos: [cx, y + T / 2 + 0.05, cz + d / 2 + 0.05], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [0.08, 0.08, d], pos: [cx - w / 2 - 0.05, y + T / 2 + 0.05, cz], r: 0.01, shade: 0.70 });
      out.push({ shape: "box", size: [0.08, 0.08, d], pos: [cx + w / 2 + 0.05, y + T / 2 + 0.05, cz], r: 0.01, shade: 0.70 });
    }
    can(-0.85, -3.7, 1.75, 1.75, 0.34);   /* the SoC, tallest thing on any phone board */
    can( 1.15, -3.5, 1.20, 1.30, 0.28);   /* memory beside it */
    can(-0.70, -0.9, 1.90, 1.05, 0.24);   /* the radio section */
    can( 1.20,  1.5, 1.45, 0.95, 0.24);   /* power management */
    can(-1.60,  2.0, 1.05, 0.80, 0.20);   /* audio codec */
    /* six mounting screws, steel like the cans */
    [[-2.15, -5.0], [2.15, -5.0], [-2.15, -1.2], [2.15, -1.2],
     [-2.15, 4.3], [2.15, 4.3]].forEach(function (q) {
      out.push({ shape: "cyl", size: [0.34, 0.11], pos: [q[0], y + T / 2 + 0.05, q[1]], seg: 10, shade: 1.05 });
      out.push({ shape: "box", size: [0.22, 0.05, 0.05], pos: [q[0], y + T / 2 + 0.11, q[1]], r: 0.01, shade: 0.45 });
    });
    return out;
  },
  /* Connectors and the SIM reader — black plastic bodies with the latch
     bar a technician lifts, and the thing they break. */
  boardConnectors: function (y) {
    const T = 0.16, out = [];
    function conn(cx, cz, w, d) {
      out.push({ shape: "rbox", size: [w, 0.26, d], pos: [cx, y + T / 2 + 0.13, cz], r: 0.04, shade: 1.0 });
      out.push({ shape: "box", size: [w * 0.88, 0.07, d * 0.30], pos: [cx, y + T / 2 + 0.29, cz], r: 0.01, shade: 2.1 });
    }
    conn(-1.30,  3.3, 1.15, 0.55);        /* MAIN BATTERY CONNECTOR — first off, last on */
    conn( 0.30, -4.9, 1.65, 0.45);        /* display flex */
    conn( 1.55, -4.3, 0.85, 0.40);        /* front camera */
    conn(-1.85, -4.4, 0.75, 0.40);        /* rear camera */
    conn( 1.70,  3.4, 0.80, 0.42);        /* charge-port flex */
    /* the SIM tray reader on the edge the tray goes into */
    out.push({ shape: "rbox", size: [1.5, 0.22, 0.85], pos: [-1.9, y + T / 2 + 0.11, 0.6], r: 0.04, shade: 1.25 });
    /* passives, in the clusters they actually sit in rather than a tidy row */
    [[-2.20, -2.6, 5, [0, 0, 0.42]], [2.20, -4.5, 4, [0, 0, 0.42]],
     [0.20,  4.4, 6, [0.36, 0, 0]]].forEach(function (g) {
      out.push({ shape: "box", size: [0.22, 0.09, 0.30], pos: [g[0], y + T / 2 + 0.05, g[1]],
        r: 0.02, shade: 0.75, repeat: { count: g[2], step: g[3] } });
    });
    out.push({ shape: "rbox", size: [0.42, 0.16, 0.42], pos: [0.05, y + T / 2 + 0.08, 2.3], r: 0.04, shade: 1.5,
      repeat: { count: 3, step: [0.58, 0, 0] } });
    return out;
  },
  /* Gold: the two antenna feed pads the coax snaps onto, and the SIM
     reader's contacts. A coax knocked off one of these during a screen
     swap is a "no signal after repair" that costs somebody an afternoon,
     which is why they are drawn as their own findable thing. */
  boardGold: function (y) {
    const T = 0.16;
    return [
      { shape: "cyl", size: [0.46, 0.19], pos: [-2.05, y + T / 2 + 0.09, -2.1], seg: 12, shade: 1.0 },
      { shape: "cyl", size: [0.26, 0.22], pos: [-2.05, y + T / 2 + 0.13, -2.1], seg: 10, shade: 0.72 },
      { shape: "cyl", size: [0.46, 0.19], pos: [ 2.05, y + T / 2 + 0.09,  0.2], seg: 12, shade: 1.0 },
      { shape: "cyl", size: [0.26, 0.22], pos: [ 2.05, y + T / 2 + 0.13,  0.2], seg: 10, shade: 0.72 },
      { shape: "box", size: [0.10, 0.06, 0.60], pos: [-2.40, y + T / 2 + 0.23, 0.6], r: 0.01, shade: 1.0,
        repeat: { count: 4, step: [0.28, 0, 0] } }
    ];
  },
  /* THE GOLD ANTENNA WIRE & CONNECTOR. A snap connector is a gold puck
     with a raised collar and a socket in the middle — drawn as a flat
     disc it reads as a sticker, and this is the one feature on the
     midframe the owner's diagram bothers to name. */
  /* THE PLASTIC ANTENNA BREAKS filling the four gaps cut in the side
     walls. Their own part because they are their own material, and
     because the whole point is that a student can see two materials
     meeting: metal, plastic, metal. */
  midframeBreaks: function (y) {
    const W = PW - 0.5, WALL = 0.34, RIM = 0.62;
    const out = [];
    [-1, 1].forEach(function (sx) {
      ANT_BREAKS.forEach(function (b) {
        out.push({ shape: "rbox", size: [WALL + 0.03, RIM, b[1] - b[0]],
          pos: [sx * (W / 2 - WALL / 2), y + RIM / 2, (b[0] + b[1]) / 2], r: 0.04, shade: 1.0 });
        /* the moulding seam down the middle of each insert */
        out.push({ shape: "box", size: [WALL + 0.05, RIM * 0.9, 0.035],
          pos: [sx * (W / 2 - WALL / 2), y + RIM / 2, (b[0] + b[1]) / 2], r: 0.01, shade: 0.72 });
      });
    });
    return out;
  },
  /* THE WIRELESS CHARGING COIL — a flat spiral of enamelled copper on a
     ferrite sheet, sitting over the battery. Drawn as a real spiral rather
     than as a disc, because the number of turns and the fact it is FLAT is
     the whole reason it only works through a non-metal back. */
  midframeCoil: function (y) {
    const out = [];
    /* the ferrite sheet it is wound onto, which is what stops the field
       going into the phone and cooking the board */
    out.push({ shape: "cyl", size: [COIL.rOuter * 2 + 0.34, 0.05],
      pos: [0, y + 0.20, COIL.z], seg: 40, shade: 0.42 });
    /* the winding: short chords stepping outward, so it is one continuous
       spiral rather than a stack of rings */
    const STEPS = COIL.turns * 26;
    const dr = (COIL.rOuter - COIL.rInner) / STEPS;
    for (let i = 0; i < STEPS; i++) {
      const a = (i / 26) * Math.PI * 2, rr = COIL.rInner + i * dr;
      const a2 = ((i + 1) / 26) * Math.PI * 2, r2 = rr + dr;
      const x0 = Math.cos(a) * rr, z0 = Math.sin(a) * rr;
      const x1 = Math.cos(a2) * r2, z1 = Math.sin(a2) * r2;
      const dx = x1 - x0, dz = z1 - z0;
      out.push({ shape: "cyl", size: [0.075, Math.sqrt(dx * dx + dz * dz) * 1.15],
        pos: [(x0 + x1) / 2, y + 0.26, COIL.z + (z0 + z1) / 2],
        rot: [0, Math.atan2(dz, -dx), P2], seg: 8, shade: 1.0 });
    }
    /* THE TWO TAILS, AND THE CONNECTOR THEY LAND ON. Their first cut ran
       off toward the bottom of the frame and simply stopped in mid-air,
       which is the same fault as a crack that leaves the glass: a wire
       that goes nowhere is not wiring. */
    const tailLen = 1.30, tailZ = COIL.z + COIL.rOuter + tailLen / 2 + 0.06;
    [-0.10, 0.10].forEach(function (dx) {
      out.push({ shape: "cyl", size: [0.075, tailLen], pos: [dx, y + 0.26, tailZ],
        rot: [P2, 0, 0], seg: 10, shade: 0.92 });
    });
    out.push({ shape: "rbox", size: [0.62, 0.16, 0.34], pos: [0, y + 0.28, tailZ + tailLen / 2 + 0.14],
      r: 0.04, shade: 0.34 });
    return out;
  },
  /* THE USB-C RECEPTACLE, built from the owner's two photographs.

     The top-down shot is the one that settled the shape, and the shape is
     the whole point of the part:

       a drawn STEEL SHELL with FULLY ROUNDED ENDS. Not a rectangle with
         rounded corners \\u2014 the ends are half-circles, which is what makes
         a C plug go in either way up and is the first thing a student
         should be able to say about it;
       the TONGUE standing in the middle of the bore, a thin blade with
         contacts down BOTH faces. That tongue is the part that snaps, and
         a snapped tongue is a board-level repair rather than a cable
         swap \\u2014 which is the diagnosis this model exists to support;
       two MOUNTING WINGS soldered down either side, because the shell
         takes every bit of the strain when somebody trips over the lead;
       and the little BOARD it is mounted on, which on most handsets is a
         separate flex-connected daughterboard \\u2014 so the port is often the
         cheapest thing in the phone to replace, and knowing that is worth
         real money to a customer.

     Its own part because it is steel and gold on a green board, and the
     frame it sits in is machined aluminium. */
  midframePort: function (y) {
    const PORT = MIDFRAME_GAPS.port;
    const D = PD - 0.5, WALL = 0.34;
    const gapZ = D / 2 - WALL / 2;
    const SW = PORT[1] - PORT[0] - 0.13;     /* shell width, inside the gap */
    const SH = 0.23;                         /* shell height \u2014 2.6mm at this scale */
    const SD = 1.15;                         /* how deep the receptacle runs */
    const cy = y + 0.31;                     /* on the wall's centre line */
    const out = [];

    /* the daughterboard it stands on, running back into the frame */
    out.push({ shape: "rbox", size: [SW + 1.5, 0.10, SD + 0.9], pos: [0, y + 0.10, gapZ - SD / 2 - 0.30],
      r: 0.06, shade: 0.30 });

    /* THE SHELL. Drawn as a rounded box whose corner radius is HALF ITS
       HEIGHT, which is what turns a rectangle into a stadium: the ends
       come out as true half-circles rather than as softened corners. */
    out.push({ shape: "rbox", size: [SW, SH, SD], pos: [0, cy, gapZ - SD / 2 + WALL / 2],
      r: SH / 2, shade: 1.0 });
    /* THE BORE. It must come PAST the shell's front face, not stop behind
       it. Its first cut ended 0.04 short and the receptacle rendered as a
       solid grey pebble \u2014 a closed box where the opening should be, which
       is the whole point of the part. */
    out.push({ shape: "rbox", size: [SW - 0.10, SH - 0.10, SD],
      pos: [0, cy, gapZ - SD / 2 + WALL / 2 + 0.08], r: (SH - 0.10) / 2, shade: 0.26 });
    /* THE TONGUE, standing in the middle of the bore */
    out.push({ shape: "rbox", size: [SW - 0.22, 0.055, SD - 0.26],
      pos: [0, cy, gapZ - SD / 2 + WALL / 2 + 0.05], r: 0.03, shade: 0.52 });
    /* the contacts down its upper face \\u2014 twelve a side on a real one, and
       they are why the plug works either way up */
    out.push({ shape: "box", size: [0.024, 0.015, SD - 0.50],
      pos: [-(SW - 0.30) / 2, cy + 0.04, gapZ - SD / 2 + WALL / 2 + 0.05], r: 0.005,
      shade: 2.4, repeat: { count: 12, step: [(SW - 0.30) / 11, 0, 0] } });

    /* the two mounting wings, and the solder fillet under each */
    [-1, 1].forEach(function (sx) {
      out.push({ shape: "rbox", size: [0.22, 0.09, 0.42],
        pos: [sx * (SW / 2 + 0.09), cy - SH / 2 + 0.04, gapZ - 0.42], r: 0.03, shade: 1.15 });
      out.push({ shape: "rbox", size: [0.30, 0.07, 0.30],
        pos: [sx * (SW / 2 + 0.10), y + 0.16, gapZ - 0.42], r: 0.05, shade: 1.5 });
    });
    /* the dimples pressed into the top of the shell, which is how a drawn
       shell is held together before it is soldered */
    out.push({ shape: "cyl", size: [0.07, 0.04], pos: [-0.20, cy + SH / 2 - 0.01, gapZ - 0.55],
      seg: 10, shade: 0.80, repeat: { count: 3, step: [0.20, 0, 0] } });
    return out;
  },
  /* THE COAX ITSELF, lifted out of the casting so it is black sheath
     rather than the alloy's own colour. A cable that is the same value as
     the thing it lies on is a cable nobody can trace. */
  midframeCoax: function (y) {
    const out = [];
    ANT_RUNS.forEach(function (R) {
      for (let i = 0; i < R.seg.length - 1; i++) {
        const A = R.seg[i], B = R.seg[i + 1];
        const dx = B[0] - A[0], dz = B[1] - A[1];
        const len = Math.sqrt(dx * dx + dz * dz);
        out.push({ shape: "cyl", size: [0.11, len + 0.10],
          pos: [(A[0] + B[0]) / 2, y + 0.34, (A[1] + B[1]) / 2],
          rot: [0, Math.atan2(dz, -dx), P2], seg: 14, shade: 1.0 });
        /* the retaining tab that holds the run down every so often */
        out.push({ shape: "rbox", size: [0.22, 0.07, 0.16],
          pos: [(A[0] + B[0]) / 2, y + 0.38, (A[1] + B[1]) / 2], r: 0.02, shade: 1.7 });
      }
    });
    return out;
  },
  midframeGold: function (y) {
    const out = [];
    ANT_RUNS.forEach(function (R) {
      /* SIZED TO THE REAL PART. These were 0.62 across on a frame 5.7 wide,
         which is a snap connector the size of a coat button \u2014 about four
         times life. A u.FL is 2mm on a 70mm phone. Loudness should track
         importance, and this one is important because it is easy to knock
         off, not because it is big. */
      out.push({ shape: "cyl", size: [0.30, 0.10], pos: [R.head[0], y + 0.28, R.head[1]],
        seg: 18, shade: 1.0 });
      out.push({ shape: "torus", size: [0.26, 0.05], pos: [R.head[0], y + 0.32, R.head[1]],
        rot: [P2, 0, 0], seg: 18, shade: 1.25 });
      out.push({ shape: "cyl", size: [0.15, 0.12], pos: [R.head[0], y + 0.34, R.head[1]],
        seg: 12, shade: 0.62 });
      /* the crimp where the jacket meets the head */
      const last = R.seg[R.seg.length - 1];
      out.push({ shape: "cyl", size: [0.13, 0.30], pos: [(last[0] + R.head[0]) / 2, y + 0.28,
        (last[1] + R.head[1]) / 2], rot: [P2, 0, 0], seg: 12, shade: 0.85 });
    });
    return out;
  },
  /* Where the two coaxial antenna leads run and where they terminate.
     Declared once so the jacket (drawn with the midframe) and the gold
     head (its own part) cannot drift apart — the head has to sit on the
     end of the run, and two copies of the same numbers is how that stops
     being true. */
  /* THE MIDFRAME, REBUILT FROM THE OWNER'S TEARDOWN PHOTOGRAPH

     The frame with the screen and battery off it: a dark graphite casting,
     a large bright heat-spreader sheet across the middle, screw bosses all
     round the rim, the charge-port board on the bottom edge — and, the
     thing that was wrong here, the ANTENNAS.

     They were two flat traces painted on the frame. In the photograph they
     are round coaxial cables, routed in bends across the frame, each
     ending in a tiny GOLD SNAP CONNECTOR. That gold dot is the whole
     reason to draw them: it is what a technician looks for, and a coax
     that has popped off its socket during a screen replacement is a
     "no signal after repair" that costs somebody an afternoon. A painted
     stripe cannot pop off anything. */
  /* THE MIDFRAME, BUILT AS A CASTING RATHER THAN AS A SHEET.

     It was a flat slab with bosses and a heat-spreader printed on it. A
     midframe is not a sheet: it is a machined aluminium tub. The rim
     stands UP round all four sides with real wall thickness, the floor is
     recessed inside it, and everything else hangs off that —

       the CHARGE PORT is a genuine gap in the bottom wall, not a dark
         rectangle painted on one, and beside it the speaker grille holes
         go right through;
       the SCREW BOSSES stand proud of the floor with a sunk hole in each;
       the HEAT SPREADER is recessed INTO the floor, sitting below the rim;
       the ANTENNA COAX runs on top of all of it and can be traced.

     The rim is why a bent frame is a write-off and a bent back cover is
     not: it is the structure, and once it is out of true the screen will
     not seat again. A student cannot learn that from a flat plate. */
  midframe: function (y) {
    const W = PW - 0.5, D = PD - 0.5;
    const WALL = 0.34, RIM = 0.62;      /* wall thickness, and how far it stands up */
    const out = [];

    /* the floor of the tub, thin, recessed inside the rim */
    out.push({ shape: "rbox", size: [W - WALL * 2, 0.16, D - WALL * 2], pos: [0, y, 0], r: 0.14, shade: 0.86 });

    /* THE RIM. The bottom wall is built in THREE pieces with two real gaps
       in it — the charge port and the speaker grille — because a hole you
       can see through is a hole, and a dark rectangle painted on a wall is
       a decal of one. */
    const gapZ = D / 2 - WALL / 2;
    out.push({ shape: "rbox", size: [W, RIM, WALL], pos: [0, y + RIM / 2, -D / 2 + WALL / 2], r: 0.10, shade: 1.0 });
    /* THE SIDE WALLS, each in three pieces with the two antenna breaks cut
       out of them. Same rule as the charge port: the gap is where nothing
       is drawn, and the plastic that fills it is a different part because
       it is a different material. */
    [-1, 1].forEach(function (sx) {
      const spans = [[-D / 2, ANT_BREAKS[0][0]], [ANT_BREAKS[0][1], ANT_BREAKS[1][0]], [ANT_BREAKS[1][1], D / 2]];
      spans.forEach(function (s) {
        out.push({ shape: "rbox", size: [WALL, RIM, s[1] - s[0]],
          pos: [sx * (W / 2 - WALL / 2), y + RIM / 2, (s[0] + s[1]) / 2], r: 0.10, shade: 1.0 });
      });
      /* the machined chamfer along the top outer edge of each wall — the
         bright line you see down the side of a metal phone, and the first
         thing a drop damages */
      /* Kept INSIDE the wall line. Its first cut sat proud by 0.017, which
         grew the whole layer's footprint and cost the board below it the
         clearance it needs to be visible — checkEveryLayerIsVisible caught
         it. A decorative edge must never be what decides a layer's size. */
      out.push({ shape: "rbox", size: [WALL * 0.42, WALL * 0.42, D],
        pos: [sx * (W / 2 - WALL * 0.34), y + RIM - WALL * 0.16, 0],
        rot: [0, 0, Math.PI / 4], r: 0.02, shade: 1.42 });
    });
    /* The two gaps are stated as EDGES, not as widths hung off a centre,
       because the wall pieces and the things that sit in the gaps are then
       derived from the same two numbers and cannot drift apart. */
    const PORT = MIDFRAME_GAPS.port;
    const GL = MIDFRAME_GAPS.grilleL, GR = MIDFRAME_GAPS.grilleR;
    [[-W / 2, GL[0]], [GL[1], PORT[0]], [PORT[1], GR[0]], [GR[1], W / 2]].forEach(function (s) {
      out.push({ shape: "rbox", size: [s[1] - s[0], RIM, WALL],
        pos: [(s[0] + s[1]) / 2, y + RIM / 2, gapZ], r: 0.10, shade: 1.0 });
    });
    /* The USB-C receptacle that stands in the port gap is its own part now
       \u2014 midframePort \u2014 because a steel shell on a little board is not
       the colour of the casting it sits in. */
    /* THE TWO GRILLE RUNS, ONE EACH SIDE OF THE PORT, and DRILLED ROUND
       rather than milled into slots \u2014 both corrections come straight off
       the owner's photograph of a real handset edge.

       A round hole in a wall, in a renderer with no boolean subtraction,
       is a TORUS: the ring is the material left around the bore, and the
       bore is where nothing is drawn. One primitive per hole, and the
       rings overlap their neighbours so the web between holes is solid.
       Above and below them a sill and a lintel close the wall off. That
       is the whole grille, and it is a hole you can see daylight through
       from any angle rather than a dark dot painted on metal. */
    const HD = MIDFRAME_GAPS.holeD, NH = MIDFRAME_GAPS.holes;
    const midY = y + RIM / 2;
    [GL, GR].forEach(function (g) {
      const span = g[1] - g[0], pitch = span / NH;
      /* A BORE THROUGH A WALL IS A RING OF BLOCKS, NOT A TORUS.

         A torus was tried and it is the wrong solid: its section is
         circular, so the same number controls how thick the ring is
         RADIALLY and how deep it runs THROUGH the wall. Sized to leave a
         proper web between neighbouring holes it came out 0.06 deep in a
         0.34 wall \u2014 a thin hoop floating in the middle of the metal with
         daylight in front of and behind it, which renders as a raised
         doughnut stuck on the surface. Exactly the wrong reading.

         A ring of blocks separates the two: each block is as thin as the
         web needs to be and as deep as the wall is. `ring` about Z puts
         the copies in the XY plane, which is the plane this wall faces,
         and its size order there is [radial, tangential, axial]. */
      /* The web is thicker than half the space between bores ON PURPOSE,
         so neighbouring rings OVERLAP. Sized to exactly touch, each ring
         covered only its own annulus and left an empty cusp where two
         circles and the bar above them meet \u2014 real metal, missing, and it
         read as a row of chain links rather than as holes drilled in a
         strip. Overlapping rings fill those cusps. */
      const WEB = (pitch - HD) * 0.85;       /* metal left around each bore */
      const rMid = HD / 2 + WEB / 2;
      const NSEG = 16;
      const bar = Math.max(0.10, RIM / 2 - (HD / 2 + WEB));  /* solid wall above and below */
      out.push({ shape: "rbox", size: [span, bar, WALL], pos: [(g[0] + g[1]) / 2, y + bar / 2, gapZ], r: 0.02, shade: 1.0 });
      out.push({ shape: "rbox", size: [span, bar, WALL], pos: [(g[0] + g[1]) / 2, y + RIM - bar / 2, gapZ], r: 0.02, shade: 1.0 });
      for (let i = 0; i < NH; i++) {
        out.push({ shape: "plate", size: [WEB, 2 * Math.PI * rMid / NSEG * 1.35, WALL],
          pos: [g[0] + pitch * (i + 0.5), midY, gapZ],
          ring: { count: NSEG, radius: rMid, axis: "z" }, shade: 1.02 });
      }
    });

    /* THE MILLED WEB. This is the midframe's equivalent of the board's
       traces: the fine, repeated, real detail that makes the part read as
       a machined object rather than a tray.

       A midframe floor is not flat. It is pocketed out to save weight,
       leaving a lattice of thin ribs between shallow milled recesses —
       and since nothing can be subtracted here, what gets drawn is the
       RIBS, with the pockets being the floor showing between them. Same
       inversion as the speaker grille. */
    const IW = W - WALL * 2, ID = D - WALL * 2;
    /* FINER AND SHALLOWER THAN THE FIRST CUT, which used ten fat ribs and
       read as a tiled floor rather than a machined one. A pocket in a
       midframe is a few millimetres across, so on this part the web is
       many thin ribs, standing only just proud, and BRIGHTER than the
       floor between them — the rib tops are the original billet face and
       the pocket floors are freshly cut, so they catch light differently.
       That value split is what stops it reading as a grid drawn on. */
    const RIBH = 0.10, RIBW = 0.085;
    const nz = 17, nx = 7;
    out.push({ shape: "rbox", size: [IW - 0.26, RIBH, RIBW], pos: [0, y + RIBH / 2 + 0.07, -ID / 2 + 0.55], r: 0.015,
      shade: 1.22, repeat: { count: nz, step: [0, 0, (ID - 1.1) / (nz - 1)] } });
    out.push({ shape: "rbox", size: [RIBW, RIBH, ID - 0.9], pos: [-IW / 2 + 0.42, y + RIBH / 2 + 0.07, 0], r: 0.015,
      shade: 1.22, repeat: { count: nx, step: [(IW - 0.84) / (nx - 1), 0, 0] } });
    /* No pocket-floor plate here. One was tried, sitting a hair under the
       rib tops to darken the cells, and it simply masked the ribs — at
       0.055 tall they had already gone invisible and the plate finished
       them off. The floor IS the pocket floor; the ribs stand on it. */

    /* THE BOARD CAVITY, a deeper pocket at the top of the frame with a
       raised lip round it. The lip is what the board's edge registers
       against, and it is why a board only goes in one way round. */
    const BC = { z0: -ID / 2 - 0.1, z1: -1.5 };
    [[0, BC.z0 + 0.1, IW - 0.5, 0.12], [0, BC.z1, IW - 0.5, 0.12]].forEach(function (q) {
      out.push({ shape: "rbox", size: [q[2], 0.20, q[3]], pos: [q[0], y + 0.14, q[1]], r: 0.03, shade: 0.88 });
    });
    [-1, 1].forEach(function (sx) {
      out.push({ shape: "rbox", size: [0.12, 0.20, BC.z1 - BC.z0],
        pos: [sx * (IW - 0.5) / 2, y + 0.14, (BC.z0 + BC.z1) / 2], r: 0.03, shade: 0.88 });
    });

    /* THE SIM TRAY SLOT in the left wall, with its eject pinhole beside
       it. Small, and the one opening on the frame a student is allowed to
       poke something into. */
    /* Both sit flush IN the wall, not proud of it. An opening drawn wider
       than the wall it is an opening in grows the whole layer's footprint,
       which is the same 0.04 that cost the board its clearance above. */
    out.push({ shape: "rbox", size: [WALL, 0.26, 1.35],
      pos: [-W / 2 + WALL / 2, y + RIM * 0.52, -2.2], r: 0.05, shade: 0.34 });
    out.push({ shape: "cyl", size: [0.13, WALL], pos: [-W / 2 + WALL / 2, y + RIM * 0.52, -1.30],
      rot: [0, 0, P2], seg: 12, shade: 0.30 });

    /* THE VIBRATION MOTOR POCKET, low down beside the speaker */
    out.push({ shape: "cyl", size: [1.15, 0.24], pos: [1.55, y + 0.13, 4.45], seg: 24, shade: 0.80 });
    out.push({ shape: "cyl", size: [0.86, 0.30], pos: [1.55, y + 0.17, 4.45], seg: 22, shade: 0.50 });

    /* THE HEAT SPREADER, recessed into the floor rather than laid on it */
    out.push({ shape: "rbox", size: [W - WALL * 2 - 0.9, 0.05, D - WALL * 2 - 4.2],
      pos: [0, y + 0.07, -1.3], r: 0.12, shade: 1.62 });
    /* the heat pipe running out of it toward the board end */
    out.push({ shape: "rbox", size: [0.55, 0.09, 3.4], pos: [1.1, y + 0.09, 1.9], r: 0.16, shade: 1.75 });

    /* SCREW BOSSES: a post standing off the floor with a sunk hole in it,
       which is what you actually see and what you count before lifting */
    [[-W / 2 + 0.62, -D / 2 + 0.75], [W / 2 - 0.62, -D / 2 + 0.75],
     [-W / 2 + 0.62, -1.6], [W / 2 - 0.62, -1.6],
     [-W / 2 + 0.62, 2.3], [W / 2 - 0.62, 2.3],
     [-W / 2 + 0.62, D / 2 - 0.85], [W / 2 - 0.62, D / 2 - 0.85]].forEach(function (q) {
      out.push({ shape: "cyl", size: [0.52, 0.30], pos: [q[0], y + 0.20, q[1]], seg: 12, shade: 0.92 });
      out.push({ shape: "cyl", size: [0.24, 0.34], pos: [q[0], y + 0.24, q[1]], seg: 10, shade: 0.48 });
    });

    /* internal ribs across the floor, which is what stops a frame flexing */
    out.push({ shape: "rbox", size: [W - WALL * 2 - 0.4, 0.10, 0.22], pos: [0, y + 0.11, -3.6], r: 0.04, shade: 0.94 });
    out.push({ shape: "rbox", size: [W - WALL * 2 - 0.4, 0.10, 0.22], pos: [0, y + 0.11, 3.4], r: 0.04, shade: 0.94 });

    /* the speaker box in one corner */
    out.push({ shape: "rbox", size: [1.5, 0.36, 1.1], pos: [-1.6, y + 0.26, D / 2 - 1.3], r: 0.10, shade: 0.70 });

    /* The coax runs and their gold heads are their own parts now —
       midframeCoax and midframeGold — because a black sheathed cable and a
       gold snap are not the colour of the casting they lie on. */
    return out;
  },
  /* THE BACKLIGHT IS THE THING THAT MAKES LIGHT, so it has to be the
     bright layer in the stack. It was the same near-black as the three
     layers around it — four dark rectangles one above the other, which is
     why the stack read as a pile of floor tiles rather than a phone.
     The film stack is real: reflector, light guide, two diffusers, and
     the LED bar firing along one edge into the side of the guide. */
  backlight: function (y) {
    /* THE BACKLIGHT, REBUILT FROM THE OWNER'S TWO PHOTOGRAPHS OF A LIGHT
       GUIDE PLATE AND ITS LED STRIP.

       This is the layer that makes an LCD an LCD, and the whole torch test
       rests on it. It was six primitives: two slabs, a repeat of films,
       and a bar with eight dots on it.

       What the photographs settle, and none of it was guessable:

         THE LED STRIP IS A WHITE PCB with the LEDs mounted along it in a
           row, and TWO WIRES leaving it at one corner. That power lead is
           the point \u2014 it is a separate circuit from the panel's data, so a
           display with a perfect picture and no light, or light and no
           picture, are two different faults on two different wires.
         THE LIGHT ENTERS THE EDGE. The strip fires sideways into the rim
           of a clear acrylic plate. Nothing is behind the screen; the
           light is turned through ninety degrees by the plate.
         AND THE PLATE IS THICK \u2014 far thicker than the films above it.
           It is the structural part of the stack, not a sheet.

       The EXTRACTION DOTS are what turn the edge light into a face of even
       light: printed on the back of the plate, sparse near the LEDs and
       crowded at the far end, because the far end has less light to work
       with. That gradient is the mechanism, and it is why a light guide
       with a crushed corner shows a dark patch that no amount of
       brightness fixes. */
    const W = PW - 1.1, D = PD - 1.1;
    const out = [];

    /* THE STACK IS DRAWN OPEN, the way the owner's photograph shows it and
       the way it has to be shown to teach anything. Closed up, the top
       diffuser covers the lot and the layer renders as a featureless cream
       slab \u2014 which is what it did. There is 1.45 between layers on this
       bench, so 0.8 of it goes on separating these six sheets and 0.65 is
       left as clearance. Each sheet also steps back a little so its edge
       shows past the one above, which is the same trick the whole stack
       uses on itself. */
    const LIFT = { refl: 0.00, led: 0.10, dots: 0.21, lgp: 0.30, f1: 0.52, f2: 0.63, f3: 0.74 };

    /* the reflector at the bottom, which sends escaping light back up */
    out.push(slab(y, 0.07, 0.9, 0.72));

    /* The guide plate and its extraction dots are their own part now \u2014
       backlightGuide \u2014 because acrylic is not the same material as a paper
       reflector or a polyester film, and drawn in one colour with only a
       shade between them the whole stack came out as one cream slab. */

    /* the diffusers and the prism film above the plate. Three sheets, not
       two: two diffusers with a brightness-enhancing film between them,
       which is the sandwich that stops the dots showing through. */
    /* THE THREE FILMS ARE FANNED BACK, not stacked square over the plate.

       Stacked, the top one covers everything below it and the layer
       renders as one cream slab \u2014 which it did, twice. They step back
       along the phone's length and shrink as they go, so every sheet's
       edge shows and the plate's face stays clear. Same device the whole
       bench uses on itself: an exploded stack is only exploded if you can
       see into it. */
    /* THE FILMS ARE CUT BACK ALONG ONE LONG EDGE, cascading to the right,
       so a margin down the LEFT of the plate stays open for its whole
       length. Fifth attempt, and the first four are worth writing down
       because each one looked right on paper.

       Stacked square, the top diffuser covered the lot. Fanned back along
       the phone's length, they still covered the plate's face. Shortened
       from one end, they opened a slice \u2014 but only three of the thirteen
       dot rows, all from the same end of the gradient, which is the one
       thing the dots exist to show.

       The obvious fix was to slide them sideways at full size, like a
       dealt hand. checkEveryLayerIsVisible refused it, and it was right
       to: this layer's footprint has 0.1 of lateral slack against the
       midframe below, so there is nowhere to slide TO. A film moved out
       far enough to uncover anything stops the frame reading as a layer
       at all. So the room has to come out of the sheets.

       Cut back, every one of the thirteen rows is open at the left, and
       the gradient reads the way it actually works: two dots far apart at
       the LED end, six close together at the far end, each one a little
       larger than the last. */
    [[LIFT.f1, 0.030, 3.20, 0.72, 0.00, 1.16],
     [LIFT.f2, 0.028, 3.00, 0.82, 0.22, 1.34],
     [LIFT.f3, 0.030, 2.80, 0.92, 0.44, 1.16]]
      .forEach(function (f) {
        out.push({ shape: "rbox", size: [f[2], f[1], D - 0.45 - f[4]],
          pos: [f[3], y + f[0], f[4] / 2], r: 0.13, shade: f[5] });
      });
    return out;
  },
  /* THE LIGHT GUIDE PLATE and the extraction dots printed on it. Its own
     part because clear acrylic is not a paper reflector and not a
     polyester film \u2014 three materials that were being drawn in one cream.

     THE DOTS ARE DRAWN ON THE PLATE'S TOP FACE, not its underside where
     they really are printed. Underneath, they are invisible from every
     angle a student can reach. Same call as the dot matrix's ribbon cassette, drawn lifted
     clear because that is where a technician holds it \u2014 the picture has
     to match the job rather than the closed machine.

     Their DENSITY is the mechanism and it is what makes them worth
     drawing: sparse at the LED edge, crowded at the far end, because the
     far end has less light left to work with. A guide plate with a
     crushed corner shows a dark patch no brightness setting will fix. */
  backlightGuide: function (y) {
    const W = PW - 1.1, D = PD - 1.1;
    const out = [{ shape: "rbox", size: [W, 0.17, D], pos: [0, y + 0.30, 0], r: 0.14, shade: 1.0 }];
    const ROWS = 13;
    for (let r = 0; r < ROWS; r++) {
      const t = r / (ROWS - 1);                    /* 0 at the LED edge */
      const z = D / 2 - 0.5 - t * (D - 1.4);
      const n = 5 + Math.round(t * 12);            /* sparse near the LEDs */
      const step = (W - 0.9) / (n - 1);
      /* 0.44, and the arithmetic says 0.405 would do. The plate's top face
         is at 0.385 and a dot centred at 0.405 stands 0.0375 clear of it,
         so on paper it is in the open air \u2014 and it rendered as nothing at
         all, four times running. Only pulling the plate out of the part
         proved the dots were being drawn perfectly well and swallowed.
         0.055 of clearance is what actually shows; the arithmetic was the
         thing being trusted, and the render is the thing that decides. */
      out.push({ shape: "cyl", size: [0.075 + t * 0.07, 0.035],
        pos: [-(W - 0.9) / 2, y + 0.44, z], seg: 12, shade: 0.30,
        repeat: { count: n, step: [step, 0, 0] } });
    }
    return out;
  },
  /* THE LED STRIP, its own part because it is a little white circuit board
     with light sources on it and the rest of this layer is optical film.
     A row of packages firing sideways into the edge of the plate, and the
     two-wire power lead leaving at one corner. */
  backlightLeds: function (y) {
    const W = PW - 1.1, D = PD - 1.1;
    const ez = D / 2 - 0.20, ly = y + 0.10;
    const N = 9, span = W - 1.1;
    const out = [];
    /* the strip itself */
    out.push({ shape: "rbox", size: [W - 0.6, 0.09, 0.30], pos: [0, ly, ez], r: 0.03, shade: 1.0 });
    /* the LED packages along it, facing into the plate */
    out.push({ shape: "rbox", size: [0.22, 0.13, 0.13], pos: [-span / 2, ly + 0.05, ez - 0.10], r: 0.02,
      shade: 2.4, repeat: { count: N, step: [span / (N - 1), 0, 0] } });
    /* the two-wire power lead, out of one corner and away */
    [[-0.06, 1.28], [0.06, 1.02]].forEach(function (q) {
      out.push({ shape: "cyl", size: [0.09, 1.5], pos: [span / 2 + 0.55 + q[0], ly + 0.01, ez + 0.62],
        rot: [P2, 0, 0], seg: 12, shade: q[1] });
    });
    out.push({ shape: "rbox", size: [0.42, 0.12, 0.30], pos: [span / 2 + 0.55, ly + 0.01, ez + 1.45],
      r: 0.03, shade: 0.42 });
    return out;
  },
  /* OPTICAL ADHESIVE & POLARIZER — labelled on the owner's diagram and
     absent here entirely.

     It is two films that behave as one: a layer of optically clear
     adhesive that bonds the glass down onto the panel, and the polariser
     that kills the reflection off the panel's own surface. Nearly
     transparent, which is why it is drawn thin, faintly warm and slightly
     smaller than the glass above it — you see it as an edge, which is
     exactly how you see it on a bench.

     It earns its place in a lab rather than just in a drawing: this film
     is WHY the glass and the panel cannot be separated. A student who
     knows there is adhesive between them understands why a cracked OLED
     is a whole-assembly job, and a student who does not thinks somebody
     is overcharging them. */
  polariser: function (y) {
    /* A FRAME, for the same reason the glass is one: it is optically clear
       and a solid sheet would hide the panel under it. What you actually
       see of this layer on a bench IS its edge — a thin bright rim where
       the adhesive squeezes out and the film is cut. */
    const W = PW - 0.62, D = PD - 0.62, R = 0.42;
    return [
      { shape: "rbox", size: [W, 0.05, R], pos: [0, y, -D / 2 + R / 2], r: 0.14, shade: 1.0 },
      { shape: "rbox", size: [W, 0.05, R], pos: [0, y, D / 2 - R / 2], r: 0.14, shade: 1.0 },
      { shape: "rbox", size: [R, 0.05, D - R * 2], pos: [-W / 2 + R / 2, y, 0], r: 0.14, shade: 1.0 },
      { shape: "rbox", size: [R, 0.05, D - R * 2], pos: [W / 2 - R / 2, y, 0], r: 0.14, shade: 1.0 },
      /* the polariser film sitting a hair inside the adhesive rim */
      { shape: "rbox", size: [W - 0.30, 0.035, R - 0.14], pos: [0, y + 0.05, -D / 2 + R / 2], r: 0.12, shade: 0.78 },
      { shape: "rbox", size: [W - 0.30, 0.035, R - 0.14], pos: [0, y + 0.05, D / 2 - R / 2], r: 0.12, shade: 0.78 },
      /* the release-liner tab at one corner, which is how it is handled */
      { shape: "rbox", size: [1.1, 0.03, 0.45], pos: [W / 2 - 1.1, y + 0.06, -D / 2 - 0.30], r: 0.04, shade: 1.5 }
    ];
  },
  /* THE PANEL, AND WHAT IT IS SHOWING.

     The cracked-screen photograph's whole lesson is that the glass is in
     pieces and the PICTURE IS STILL RUNNING UNDERNEATH. This layer was a
     blank dark slab, so the model said nothing of the kind and a student
     had no reason to believe the display was alive.

     `lit` draws what is on it: a status bar, two cards and a keyboard
     block, laid out like the phone in the photograph. It is a separate
     part in the bench below — the panel's colour is the panel, and what
     it is showing is state — which is the same split every gauge and lamp
     in this build needs. */
  /* THE BACKING TRAY, its own part because it is METAL and the panel is
     not. Drawn inside the panel's own builder it was one more near-black
     shape against a near-black slab and the module read as a single black
     card — the impact bench's ribbon-cassette failure exactly: one colour
     per part obeyed, and two adjacent parts still indistinguishable. */
  /* THE COLOUR FILTER GLASS — the top sheet, and the one that makes a
     picture out of a shutter.

     Its own part because it is a different job from the TFT glass under
     it: that sheet SWITCHES light, this one COLOURS it. Every pixel is
     three stripes of dyed filter — red, green, blue — with an opaque
     black matrix between them, and that is what the `subpixel` surface
     paints. It is the reason a switched-off LCD is dark grey rather than
     the colour of its own backlight, and the reason a dead pixel is one
     transistor rather than anything anybody can reach.

     Drawn smaller than the sheet below so both ledges show. */
  lcdFilter: function (y) {
    const W = PW - 0.7 - CF.inX, D = PD - 0.7 - CF.inZ;
    return [
      { shape: "rbox", size: [W, PANEL_T.cf, D], pos: [0, y + PANEL_Y.cf, CF.offZ], r: 0.08, shade: 1.0 }
    ];
  },
  /* THE TWO POLARISERS, AND THEY ARE CROSSED.

     One part, not two, because the pair only means anything together:
     their axes are at ninety degrees, so light that gets through the
     bottom one is blocked by the top one unless the crystal in between
     twists it on the way. That is the whole mechanism of an LCD in one
     sentence, and it is why the panel needs a backlight at all.

     Each carries its axis DRAWN ON IT as a set of fine lines, running one
     way on the rear film and across it on the front. A student who sees
     the two hatchings at right angles has the answer to "why does my
     phone go black in polarised sunglasses" without being told it.

     The front one is a FRAME rather than a sheet — for the same reason the
     backlight's films are cut back. Solid, it covers the colour filter
     under it and the one surface on this layer worth looking at close up
     goes back to being a grey card. Its rim doubles as the black border
     printed round the active area, which is a real feature of the part
     rather than a convenience: the picture stops short of the edge, and
     that is how you tell a bare panel from an assembly with its frame. */
  lcdPolarisers: function (y) {
    const W = PW - 0.7, D = PD - 0.7;
    const FW = W - CF.inX + 0.10, FD = D - CF.inZ + 0.10, RIM = 0.32;
    const out = [
      { shape: "rbox", size: [W - 0.05, PANEL_T.rear, D - 0.05],
        pos: [0, y + PANEL_Y.rear, 0], r: 0.10, shade: 1.0 }
    ];
    /* THE REAR FILM'S AXIS IS ON A PEELED CORNER, and it has to be.

       Drawn flat on the film's own face it was buried under the TFT
       glass — the light guide plate's mistake, made again, one layer up
       and within the hour. And there is no version of this where it is
       not: the rear polariser lies UNDER an opaque sheet the same size,
       so its face is not somewhere a student can ever look.

       Sliding it out from under was tried on paper and refused by the
       footprint budget, which is the same wall the backlight's films hit:
       this layer has about 0.25 of lateral room and 0.35 of length before
       it stops clearing the midframe. So the film is drawn LIFTED at one
       corner, the way it sits on a bench when somebody has started to peel
       one off a scrap panel. The flap is inside the layer's own footprint,
       it stands clear of everything above it, and its upper face is where
       the axis hatching goes — which is the only place the hatching can be
       seen at all. */
    const FLAP = { w: 1.9, d: 2.5, x: -(W - 0.05) / 2 + 0.95, z: -(D - 0.05) / 2 + 1.25, tilt: -0.62 };
    const lift = Math.sin(-FLAP.tilt) * FLAP.d / 2;
    out.push({ shape: "rbox", size: [FLAP.w, PANEL_T.rear, FLAP.d],
      pos: [FLAP.x, y + PANEL_Y.rear + lift / 2 + 0.02, FLAP.z + 0.10],
      rot: [FLAP.tilt, 0, 0], r: 0.04, shade: 1.25 });
    /* and the axis on it: fine lines running the length of the panel,
       which is the direction this film passes */
    out.push({ shape: "box", size: [0.055, 0.012, FLAP.d - 0.45],
      pos: [FLAP.x - (FLAP.w - 0.45) / 2, y + PANEL_Y.rear + lift / 2 + 0.02 + PANEL_T.rear / 2 + 0.05,
            FLAP.z + 0.10],
      rot: [FLAP.tilt, 0, 0], shade: 2.1,
      repeat: { count: 8, step: [(FLAP.w - 0.45) / 7, 0, 0] } });
    /* the front frame */
    [[0, -FD / 2 + RIM / 2, FW, RIM], [0, FD / 2 - RIM / 2, FW, RIM],
     [-FW / 2 + RIM / 2, 0, RIM, FD - RIM * 2], [FW / 2 - RIM / 2, 0, RIM, FD - RIM * 2]]
      .forEach(function (b) {
        out.push({ shape: "rbox", size: [b[2], PANEL_T.front, b[3]],
          pos: [b[0], y + PANEL_Y.front, CF.offZ + b[1]], r: 0.06, shade: 0.42 });
      });
    /* and the front film's axis, ACROSS the panel — ninety degrees to the
       rear one, which is the thing worth seeing */
    out.push({ shape: "box", size: [FW - 0.5, 0.012, 0.05],
      pos: [0, y + PANEL_Y.front + PANEL_T.front / 2 + 0.045, CF.offZ - FD / 2 + RIM / 2], shade: 1.9,
      repeat: { count: 4, step: [0, 0, 0.09] } });
    out.push({ shape: "box", size: [FW - 0.5, 0.012, 0.05],
      pos: [0, y + PANEL_Y.front + PANEL_T.front / 2 + 0.045, CF.offZ + FD / 2 - RIM / 2 - 0.135], shade: 1.9,
      repeat: { count: 4, step: [0, 0, 0.09] } });
    return out;
  },
  /* THE GATE DRIVER, down the SIDE ledge of the TFT glass.

     Its own part and its own edge, because that is what makes it a
     different answer from the driver at the bottom. The source driver
     feeds the COLUMNS and the gate driver switches the ROWS, so:

       vertical bands or a dead column  -> the source driver, bottom edge
       horizontal bands or a dead row   -> the gate driver, this one

     Both are on the panel, neither is the panel, and neither is the cable.
     A student who can name which edge to look at has a real diagnosis
     instead of "the screen is broken". On most phone panels this one is
     built straight onto the glass rather than bonded on as a chip, which
     is exactly why it cannot be replaced on its own. */
  lcdGate: function (y) {
    const W = PW - 0.7, D = PD - 0.7;
    const x = -(W - CF.inX) / 2 - 0.15;
    const top = y + PANEL_Y.tft + PANEL_T.tft / 2 + 0.035;
    const N = 14, span = D - 2.2;
    return [
      /* the run of circuitry itself, a narrow band on the ledge */
      { shape: "box", size: [0.22, 0.035, D - 1.4], pos: [x, top, CF.offZ], r: 0.01, shade: 0.50 },
      /* the switching stages along it, one block per row group */
      { shape: "box", size: [0.15, 0.05, 0.30], pos: [x, top + 0.03, CF.offZ - span / 2],
        r: 0.01, shade: 0.30, repeat: { count: N, step: [0, 0, span / (N - 1)] } },
      /* and the row lines leaving it, running out under the colour filter */
      { shape: "box", size: [0.42, 0.02, 0.05], pos: [x + 0.30, top, CF.offZ - span / 2],
        shade: 1.7, repeat: { count: N, step: [0, 0, span / (N - 1)] } }
    ];
  },
  lcdTray: function (y) {
    const W = PW - 0.7, D = PD - 0.7;
    return [
      { shape: "rbox", size: [W + 0.20, 0.09, D + 0.20], pos: [0, y - 0.11, 0], r: 0.20, shade: 1.0 },
      /* the lip standing up round three sides — the fourth is left open for
         the driver film to come out of, which is why a panel is prised from
         that end and never from this one */
      { shape: "rbox", size: [W + 0.20, 0.20, 0.12], pos: [0, y - 0.04, -(D + 0.08) / 2], r: 0.04, shade: 0.90 },
      { shape: "rbox", size: [0.12, 0.20, D + 0.20], pos: [-(W + 0.08) / 2, y - 0.04, 0], r: 0.04, shade: 0.90 },
      { shape: "rbox", size: [0.12, 0.20, D + 0.20], pos: [ (W + 0.08) / 2, y - 0.04, 0], r: 0.04, shade: 0.90 }
    ];
  },
  /* THE DRIVER IC on its chip-on-film, bonded along the bottom edge of the
     panel and folded back UNDER the tray. Its own part because it is the
     answer to a question: a display showing vertical bands or a dead column
     has a failed driver, not a failed panel and not a failed cable, and a
     student needs somewhere on the model to point at when they say so. */
  lcdDriver: function (y) {
    const W = PW - 0.7, D = PD - 0.7;
    return [
      { shape: "rbox", size: [W - 1.6, 0.05, 0.55], pos: [0, y - 0.02, D / 2 - 0.20], r: 0.02, shade: 1.15 },
      /* the chip itself, a hard black block on the film */
      { shape: "rbox", size: [1.9, 0.10, 0.30], pos: [0, y - 0.05, D / 2 - 0.06], r: 0.03, shade: 0.55 },
      /* and the fold back under the tray */
      { shape: "rbox", size: [W - 1.6, 0.05, 0.70], pos: [0, y - 0.20, D / 2 - 0.30], r: 0.02, shade: 1.0 }
    ];
  },
  lcd: function (y) {
    const PANEL_W = PW - 0.7, PANEL_D = PD - 0.7;
    return [
      /* THE PANEL IS A MODULE, NOT A SHEET.

         It was one slab with a picture on it, and a display module is
         three things stacked and one thing folded round the back:

           the BACKING PLATE — a steel or magnesium tray the glass is bonded
             onto, which is why a panel is stiff and why prising one off its
             frame at the wrong corner ruins it;
           the GLASS itself, sitting inside the tray's lip;
           the BLACK BORDER printed round the active area, which is why the
             picture stops short of the edge and how you tell an assembly
             with the frame still on it from a bare panel;
           and the DRIVER IC on its own film, bonded to the bottom edge and
             FOLDED UNDER the panel. That last one is the part: a display
             showing vertical bands has a failed driver, and a student who
             thinks the panel is a plain sheet has nowhere to put that. */
      /* THE TFT GLASS — the bottom sheet, and the one everything else on
         this layer is bonded to or bonded through.

         It is the LARGER of the two sheets, on purpose and in the real
         part: it runs past the colour filter at the bottom edge and down
         one side, and those two ledges are where the drivers bond. That is
         not a detail — it is the entire reason a fault has an address on
         this panel. Vertical bands are the SOURCE driver on the bottom
         ledge; horizontal bands are the GATE driver down the side one.
         Drawn as a single sheet there is nowhere to point. */
      { shape: "rbox", size: [PANEL_W, PANEL_T.tft, PANEL_D],
        pos: [0, y + PANEL_Y.tft, 0], r: 0.10, shade: 1.0 },
      /* THE PERIMETER SEAL, and the gap it holds open.

         The liquid crystal lives between the two sheets in a gap held by
         this bead of epoxy right round the edge. The REAL gap is about
         four microns — a twentieth of a hair — and drawn to scale it would
         be nothing at all, so it is drawn thick enough to see and the note
         on the part carries the true figure. Everything else about it is
         honest: it is continuous, it is what stops the crystal escaping,
         and it is why a cracked panel bleeds a dark stain that spreads. */
      { shape: "box", size: [SEAL.w, PANEL_T.gap, SEAL.d], pos: [0, y + PANEL_Y.gap, SEAL.z - SEAL.d / 2 + SEAL.rim / 2], r: 0.01, shade: 0.72 },
      { shape: "box", size: [SEAL.w, PANEL_T.gap, SEAL.rim], pos: [0, y + PANEL_Y.gap, SEAL.z + SEAL.d / 2 - SEAL.rim / 2], r: 0.01, shade: 0.72 },
      { shape: "box", size: [SEAL.rim, PANEL_T.gap, SEAL.d - SEAL.rim * 2], pos: [-SEAL.w / 2 + SEAL.rim / 2, y + PANEL_Y.gap, SEAL.z], r: 0.01, shade: 0.72 },
      { shape: "box", size: [SEAL.rim, PANEL_T.gap, SEAL.d - SEAL.rim * 2], pos: [ SEAL.w / 2 - SEAL.rim / 2, y + PANEL_Y.gap, SEAL.z], r: 0.01, shade: 0.72 },
      /* THE FILL PORT, plugged. The crystal goes in through one small
         opening in that seal after the two sheets are bonded, and the hole
         is then capped with resin. It is the one break in the ring, and a
         student who finds it has found the answer to "how did the liquid
         get in there" without being told. */
      { shape: "cyl", size: [0.26, PANEL_T.gap + 0.02],
        pos: [SEAL.w / 2 - SEAL.rim / 2, y + PANEL_Y.gap, SEAL.z - SEAL.d / 4], seg: 18, shade: 1.45 },
      { shape: "sphere", size: [0.20, 0.14, 0.20],
        pos: [SEAL.w / 2 - SEAL.rim / 2, y + PANEL_Y.gap + PANEL_T.gap / 2, SEAL.z - SEAL.d / 4],
        seg: 18, shade: 1.60 },
      /* THE FLEX CABLE TO DISPLAY, which the owner's diagram calls out with
         a leader line of its own.

         IT COMES OFF THE EDGE, NOT ACROSS THE FACE. Drawn inside the
         panel's own footprint it fought the picture on it — a black slab
         over the map, which is the one thing this layer exists to show.
         On the diagram it emerges from the bottom edge and runs down, and
         that is both clearer and what the part does.

         The fold in it is worth drawing: a display flex folds back on
         itself, which is why a screen is lifted from the TOP and never
         hinged open from the bottom. Anybody who opens it the wrong way
         tears this, and the phone leaves with a fault it did not arrive
         with. */
      { shape: "box", size: [1.6, 0.05, 1.3], pos: [0.1, y - 0.10, PD / 2 + 0.50], r: 0.02, shade: 0.62 },
      /* the black stiffener down its middle */
      { shape: "box", size: [0.50, 0.04, 1.1], pos: [0.1, y - 0.06, PD / 2 + 0.50], r: 0.01, shade: 0.34 },
      /* the fold, and the run back down toward the board */
      { shape: "box", size: [1.6, 0.05, 0.9], pos: [0.1, y - 0.40, PD / 2 + 1.10],
        rot: [0.85, 0, 0], r: 0.02, shade: 0.55 },
      { shape: "box", size: [1.5, 0.05, 2.0], pos: [0.1, y - 1.05, PD / 2 + 0.92],
        rot: [1.35, 0, 0], r: 0.02, shade: 0.50 },
      /* the socket end, and the gold contact fingers on it */
      { shape: "rbox", size: [1.4, 0.16, 0.42], pos: [0.1, y - 1.82, PD / 2 + 0.62], r: 0.05, shade: 0.40 },
      { shape: "box", size: [0.08, 0.05, 0.30], pos: [-0.52, y - 1.73, PD / 2 + 0.62], r: 0.01, shade: 2.6,
        repeat: { count: 7, step: [0.17, 0, 0] } }
    ];
  },
  /* What the panel is showing. Drawn just above its face so it reads as
     an image on the glass rather than as objects on a tray. */
  /* WHAT THE PANEL IS SHOWING: A MAP, as it is on the owner's diagram.

     Both screen layers in that drawing carry a navigation view — green
     land, blue water, a road network running across it — and it is the
     single most recognisable thing in the whole picture. This layer used
     to be a status bar over abstract blue bars, which reads as "a screen"
     and not as "a working screen", and the whole point of drawing it at
     all is that on a shattered handset the display underneath is STILL
     RUNNING. A picture you can identify says that; three grey rectangles
     do not.

     Drawn as the map is drawn: the land field, a river of water across
     it, a park block, the road grid over the top, and the status bar. */
  /* WHAT THE PANEL IS SHOWING: A MAP, as it is on the owner's diagram.

     Both screen layers in that drawing carry a navigation view — green
     land, blue water, a road network over it — and it is the single most
     recognisable thing in the whole picture. This used to be a status bar
     over abstract blue bars, which reads as "a screen" and not as "a
     working screen", and the whole point of drawing it is that on a
     shattered handset the display underneath is STILL RUNNING. A picture
     you can identify says that; three grey rectangles do not.

     FOUR BUILDERS, BECAUSE A MAP IS FOUR COLOURS. Drawn as one part it
     came out entirely blue — land, water, roads and all — which is the
     same failure the logic board had when its steel cans and its gold
     pads were the colour of the laminate. Green land, blue water, white
     roads and a dark status bar; each its own part below, each its own
     colour, none of them carrying state. */
  mapLand: function (y) {
    const W = PW - 1.15, D = PD - 1.15, top = y + 0.13;
    return [
      { shape: "rbox", size: [W, 0.03, D], pos: [0, top, 0], r: 0.14, shade: 1.0 },
      /* a park block and a built-up block, the two fills every map has */
      { shape: "rbox", size: [1.7, 0.035, 2.1], pos: [W * 0.24, top + 0.012, -D * 0.24], r: 0.12, shade: 0.72 },
      { shape: "rbox", size: [1.4, 0.035, 1.5], pos: [-W * 0.26, top + 0.012, -D * 0.30], r: 0.10, shade: 1.30 }
    ];
  },
  mapWater: function (y) {
    const W = PW - 1.15, D = PD - 1.15, top = y + 0.145;
    return [
      /* the river across the lower third, and the lake off it */
      { shape: "box", size: [W, 0.035, 1.5], pos: [0, top, D * 0.18], rot: [0, 0.14, 0], r: 0.02, shade: 1.0 },
      { shape: "rbox", size: [2.0, 0.035, 1.4], pos: [-W * 0.22, top, D * 0.30], r: 0.30, shade: 1.0 }
    ];
  },
  mapRoads: function (y) {
    const W = PW - 1.15, D = PD - 1.15, top = y + 0.165;
    const x0 = -W / 2, z0 = -D / 2;
    return [
      { shape: "box", size: [0.10, 0.04, D - 0.5], pos: [x0 + W * 0.16, top, 0], r: 0.01, shade: 1.0,
        repeat: { count: 4, step: [W * 0.23, 0, 0] } },
      { shape: "box", size: [W - 0.4, 0.04, 0.09], pos: [0, top, z0 + D * 0.13], r: 0.01, shade: 1.0,
        repeat: { count: 6, step: [0, 0, D * 0.155] } },
      /* one main road, wider, running at an angle across all of it */
      { shape: "box", size: [0.26, 0.045, D * 1.02], pos: [W * 0.05, top + 0.01, 0],
        rot: [0, 0.30, 0], r: 0.02, shade: 1.18 },
      /* the search card the map view floats over the bottom */
      { shape: "rbox", size: [W - 0.9, 0.05, 0.9], pos: [0, top + 0.01, D / 2 - 1.25], r: 0.14, shade: 1.10 }
    ];
  },
  mapUI: function (y) {
    const W = PW - 1.15, D = PD - 1.15, top = y + 0.175, z0 = -D / 2;
    return [
      /* the status bar, and the three indicators on it */
      { shape: "box", size: [W, 0.04, 0.42], pos: [0, top, z0 + 0.30], r: 0.01, shade: 1.0 },
      { shape: "box", size: [0.30, 0.05, 0.13], pos: [W * 0.22, top + 0.02, z0 + 0.30], r: 0.02, shade: 2.4,
        repeat: { count: 3, step: [0.42, 0, 0] } },
      /* the home indicator */
      { shape: "rbox", size: [1.9, 0.05, 0.13], pos: [0, top + 0.02, D / 2 - 0.32], r: 0.06, shade: 2.4 },
      /* THE LOCATION PIN, which is what makes it read as navigation
         rather than as a coloured grid */
      { shape: "cyl", size: [0.60, 0.09], pos: [W * 0.05, top + 0.03, D * 0.02], seg: 16, shade: 1.9 },
      { shape: "cyl", size: [0.34, 0.16], pos: [W * 0.05, top + 0.07, D * 0.02], seg: 12, shade: 0.55 }
    ];
  },
  /* The digitizer's grid was drawn at the same near-black as its own
     sheet, so it disappeared into it. The sheet is now a light mesh and
     the traces sit bright on it, which is what a touch layer looks like
     held up to a window — and it is the difference between this layer and
     the panel below it that a student is being asked to see. */
  digitizer: function (y) {
    /* THE TOUCH SENSOR, REBUILT FROM THE OWNER'S PHOTOGRAPH OF THE BACK
       OF AN LCD SCREEN ASSEMBLY.

       It was a plate with a crosshatch of bars laid across it \u2014 nineteen
       primitives and no surface at all, the flattest thing in the build.
       The photograph corrects three things and adds the part that was
       missing entirely.

         THE GRID IS DIAMONDS, not a crosshatch. Drive electrodes joined
           corner to corner in rows, sense electrodes in columns, and an
           insulated bridge at every crossing. It is drawn by the `ito`
           painter now, so it stays sharp however close the camera comes,
           and it is faint because a transparent conductor is faint.
         THE FAN-OUT is the signature of the part and it was not there.
           Every row and column has to reach the controller, so the traces
           neck down from the full width of the sheet into a bundle a
           fraction as wide. That taper is the thing you recognise a
           digitizer by across a bench.
         THE CONTROLLER IS ITS OWN LITTLE GREEN BOARD, bottom right in the
           photograph with its own gold contacts. Not part of the display
           flex \u2014 a separate board, and that is why touch can fail stone
           dead on a screen whose picture is perfect.

       And the flex runs UP THE BACK of the assembly with a narrow waist
       in the middle and a bonded, gold-fingered end at each end, rather
       than stopping in a stub off the edge. */
    const W = PW - 0.55, D = PD - 0.55;
    const out = [];

    /* the sensor sheet itself, thin, carrying the ITO grid */
    out.push({ shape: "rbox", size: [W, 0.07, D], pos: [0, y, 0], r: 0.16, shade: 1.0 });

    /* THE SILVER BUS BARS round the border. This is why the black frame
       on a screen is wider than the picture: the routing has to live
       somewhere, and it lives under the bezel. */
    const BB = 0.22;
    [[0, -D / 2 + BB / 2, W - BB * 2, BB], [0, D / 2 - BB / 2, W - BB * 2, BB]].forEach(function (q) {
      out.push({ shape: "box", size: [q[2], 0.03, q[3]], pos: [q[0], y + 0.05, q[1]], r: 0.01, shade: 1.9 });
    });
    [-1, 1].forEach(function (sx) {
      out.push({ shape: "box", size: [BB, 0.03, D - BB * 2], pos: [sx * (W / 2 - BB / 2), y + 0.05, 0],
        r: 0.01, shade: 1.9 });
    });

    /* THE FAN-OUT. Forty traces leaving the bottom bus bar across the
       whole width and converging on the controller bond. Each one is a
       thin bar aimed from where it starts to where it lands, which is the
       only honest way to draw a taper \u2014 and the reason it reads is that
       the traces at the edges are steeply angled and the middle ones are
       not. */
    /* The taper needs LENGTH or there is nothing to see. Its first cut ran
       from 5.81 to 5.58 \u2014 a fan-out 0.23 long, which is a bond pad, not a
       fan-out. The traces gather over the whole bottom margin. */
    const NT = 40, zFrom = D / 2 - 2.10, zTo = D / 2 - 0.60;
    for (let i = 0; i < NT; i++) {
      const t = (i + 0.5) / NT;
      const x0 = (t - 0.5) * (W - BB * 2 - 0.3);
      const x1 = (t - 0.5) * 1.30;
      const dx = x1 - x0, dz = zTo - zFrom;
      out.push({ shape: "box", size: [0.048, 0.025, Math.sqrt(dx * dx + dz * dz)],
        pos: [(x0 + x1) / 2, y + 0.055, (zFrom + zTo) / 2],
        rot: [0, Math.atan2(dx, dz), 0], r: 0.005, shade: 2.4 });
    }

    /* THE FLEX TAIL. It comes off the BOTTOM EDGE and runs clear of the
       sheet, with the waist in the middle and the two locating holes the
       photograph shows either side of it.

       On the real assembly this folds back and lies up the rear face,
       which is where the owner's photograph catches it. Drawn that way
       here it would sit under the sensor sheet in an exploded stack and
       be invisible \u2014 the same trap the dot matrix's ribbon cassette fell
       into, where a drawing faithful to the closed machine hid the part
       the whole exercise is about. So it is drawn where a technician
       holds it: unfolded, off the edge, controller and all. */
    const EZ = D / 2;
    out.push({ shape: "rbox", size: [1.45, 0.05, 0.90], pos: [0, y - 0.02, EZ + 0.35], r: 0.04, shade: 0.34 });
    out.push({ shape: "rbox", size: [0.85, 0.05, 1.15], pos: [0, y - 0.02, EZ + 1.35], r: 0.04, shade: 0.34 });
    out.push({ shape: "rbox", size: [1.90, 0.05, 1.25], pos: [0.15, y - 0.02, EZ + 2.50], r: 0.04, shade: 0.34 });
    [-1, 1].forEach(function (sx) {
      out.push({ shape: "tube", size: [0.22, 0.09], pos: [sx * 0.50, y - 0.02, EZ + 1.35],
        seg: 20, shade: 0.70 });
    });
    /* the white identification label on the flex, which is what you read
       to order the right assembly */
    out.push({ shape: "box", size: [0.40, 0.02, 0.34], pos: [-0.52, y + 0.02, EZ + 2.45], r: 0.01, shade: 1.9 });
    return out;
  },
  /* THE TOUCH CONTROLLER, its own small green board. Its own part because
     it is a board and the sensor is a film \u2014 and because it is the answer
     to a real question: a screen whose picture is perfect and whose touch
     is stone dead is this, or the bond to it, and not the panel. */
  digitizerController: function (y) {
    const D = PD - 0.55, z = D / 2 + 2.50;
    const out = [
      { shape: "rbox", size: [1.10, 0.08, 0.95], pos: [0.72, y + 0.03, z], r: 0.04, shade: 1.0 }
    ];
    /* the controller chip on it, and the passives beside it */
    out.push({ shape: "rbox", size: [0.52, 0.09, 0.38], pos: [0.72, y + 0.09, z - 0.06], r: 0.02, shade: 0.32 });
    out.push({ shape: "box", size: [0.09, 0.05, 0.06], pos: [0.40, y + 0.08, z + 0.30], r: 0.01, shade: 0.55,
      repeat: { count: 4, step: [0.15, 0, 0] } });
    return out;
  },
  /* THE GOLD ON THE DIGITIZER: the contact fingers where the sensor bonds
     to its flex, and the pads on the controller board. Drawn apart from
     both because gold against black polyimide and gold against green
     solder mask is the same metal in two places, and a student is being
     asked to follow it from one to the other. */
  digitizerGold: function (y) {
    const D = PD - 0.55, EZ = D / 2;
    const out = [];
    /* THE SENSOR'S BUS BARS AND ITS FAN-OUT, which were drawn on the glass
       part until they came out as a white starburst. They are copper, the
       pane is glass, and a part gets one material — so they live here,
       with the rest of the metal on this layer.

       The bus bars are the ring round the active area that every row and
       column ends at. The fan-out is the taper that necks all of them down
       into a bond about a centimetre wide, and it is the whole reason a
       crack across the BOTTOM MARGIN of a screen kills a stripe of touch
       while the picture stays perfect. */
    {
      const S = SENSOR, ty = y + S.y;
      [[0, -S.id / 2], [0, S.id / 2]].forEach(function (q) {
        out.push({ shape: "box", size: [S.iw - S.bb * 2, 0.025, S.bb],
          pos: [q[0], ty, q[1]], r: 0.01, shade: 0.92 });
      });
      [-1, 1].forEach(function (sx) {
        out.push({ shape: "box", size: [S.bb, 0.025, S.id - S.bb * 2],
          pos: [sx * S.iw / 2, ty, 0], r: 0.01, shade: 0.92 });
      });
      const NT = 34, zFrom = S.id / 2 - 1.9, zTo = S.id / 2 - 0.5;
      for (let i = 0; i < NT; i++) {
        const t = (i + 0.5) / NT;
        const x0 = (t - 0.5) * (S.iw - S.bb * 2 - 0.3), x1 = (t - 0.5) * 1.25;
        const dx = x1 - x0, dz = zTo - zFrom;
        out.push({ shape: "box", size: [0.045, 0.02, Math.sqrt(dx * dx + dz * dz)],
          pos: [(x0 + x1) / 2, ty, (zFrom + zTo) / 2],
          rot: [0, Math.atan2(dx, dz), 0], r: 0.005, shade: 1.10 });
      }
    }
    /* the bond fingers where the fan-out lands on the sheet's edge */
    out.push({ shape: "box", size: [0.045, 0.03, 0.34], pos: [-0.62, y + 0.06, EZ - 0.50], r: 0.005,
      shade: 1.0, repeat: { count: 22, step: [0.058, 0, 0] } });
    /* the same traces continuing down the flex, which is how you follow a
       dead band from where it shows to where it broke */
    out.push({ shape: "box", size: [0.030, 0.02, 0.85], pos: [-0.36, y + 0.02, EZ + 1.35], r: 0.005,
      shade: 1.0, repeat: { count: 13, step: [0.058, 0, 0] } });
    /* and the pads along the edge of the controller board */
    out.push({ shape: "box", size: [0.05, 0.03, 0.20], pos: [0.30, y + 0.08, EZ + 2.92], r: 0.005,
      shade: 1.0, repeat: { count: 14, step: [0.062, 0, 0] } });
    return out;
  },
  /* CRACKED GLASS, REBUILT FROM THE OWNER'S PHOTOGRAPH

     A handset with the digitizer shattered and the picture running
     perfectly underneath it. Three things it corrects:

       - the cracks come off ONE IMPACT POINT, and that point is a dense
         white knot of crushed glass. It is the first thing you look for,
         because it tells you where the phone was hit and therefore what
         else took the shock.
       - they radiate the WHOLE WAY ROUND, not in a fan off a corner.
       - there are CONCENTRIC rings between the radials as well. Radials
         plus rings is what an impact fracture looks like; parallel lines
         with no centre is a pressure crack, which is a different story
         about how the phone was treated.

     And the reason this layer is drawn separately from the panel below
     it: in the photograph the display is still working. Broken glass with
     a live picture is a digitizer or cover-glass job; a black screen with
     unbroken glass is not. Students buy the wrong part over this. */
  /* THE TRANSPARENT LAYERS ARE DRAWN AS OPEN FRAMES.

     On the owner's diagram every screen layer carries the map, because in
     an illustration the upper sheets are transparent and you see straight
     through them. This renderer has no per-part transparency — settled
     earlier when a projector beam had to be drawn as four edges rather
     than a translucent cone — so a solid cover glass hides the panel it
     is over, and the one thing the drawing exists to show is lost.

     Drawing the picture a SECOND time on the glass was tried first and it
     was wrong twice over: it washed out to grey against a pale sheet at
     the top of the stack, and it meant the model held two copies of the
     same picture that could drift apart.

     A frame is the honest answer and it is the convention every exploded
     diagram uses: the glass is its rim, its bezel and the features in it,
     and the middle is open. The panel's map — drawn ONCE, on the panel,
     where it is actually made — is then visible straight through, which
     is exactly what a technician sees looking down at a cracked handset
     that is still running.

     The cracks span the opening, so they read as damage in the glass with
     the live picture behind them. */
  glass: function (y, cracked, bonded) {
    /* THE TOUCH SENSOR IS PART OF THIS LAYER NOW, on both stacks, because
       on both stacks it is bonded in and sold with the glass. What used to
       be a separate `digitizer` layer \u2014 its ITO grid, its fan-out, its
       flex and its controller \u2014 rides here. The difference between the two
       is no longer whether the digitizer is separate; it is whether the
       PANEL comes with the assembly. */
    const W = PW - 0.35, D = PD - 0.35, R = 0.55;     /* how wide the rim is */
    /* A pane of cover glass and its four edges, in three courses.

       Real cover glass is not a flat card. The perimeter is ground and
       polished so it ROLLS OFF — the "2.5D" edge — and under it is the
       BLACK INK BORDER printed on the back face, which is what makes the
       bezel look black when the phone is off. Both are things a technician
       reads at a glance: a chip in the roll-off is a glass job, and ink
       lifting at a corner means somebody has had it apart. Drawn as three
       rings rather than one because the total relief is 0.14 and at that
       depth three courses read as a curve, not as steps. */
    function ring(hw, hd, thick, dy, rad, shade) {
      return [
        { shape: "rbox", size: [hw, thick, rad], pos: [0, y + dy, -hd / 2 + rad / 2], r: 0.16, shade: shade },
        { shape: "rbox", size: [hw, thick, rad], pos: [0, y + dy, hd / 2 - rad / 2], r: 0.16, shade: shade },
        { shape: "rbox", size: [rad, thick, hd - rad * 2], pos: [-hw / 2 + rad / 2, y + dy, 0], r: 0.16, shade: shade },
        { shape: "rbox", size: [rad, thick, hd - rad * 2], pos: [hw / 2 - rad / 2, y + dy, 0], r: 0.16, shade: shade }
      ];
    }
    const out = [];
    /* the ink border on the back face, inset so the glass overhangs it */
    ring(W - 0.16, D - 0.16, 0.04, -0.07, R - 0.08, 0.26).forEach(function (q) { out.push(q); });
    /* the body of the pane */
    ring(W, D, 0.10, 0, R, 1.0).forEach(function (q) { out.push(q); });
    /* the polished roll-off, narrower and brighter — a rolled edge catches
       the light along a line, which is exactly how you spot a chip in one */
    ring(W - 0.05, D - 0.05, 0.05, 0.07, R - 0.05, 1.35).forEach(function (q) { out.push(q); });
    /* the earpiece slot and the front camera in the top rim, which is
       most of what identifies the front of a phone. Both are openings, so
       each is a recess with a wall round it rather than a dark patch. */
    out.push({ shape: "rbox", size: [1.7, 0.11, 0.30], pos: [-0.35, y + 0.06, -D / 2 + 0.28], r: 0.09, shade: 1.15 });
    out.push({ shape: "rbox", size: [1.5, 0.08, 0.16], pos: [-0.35, y + 0.09, -D / 2 + 0.28], r: 0.06, shade: 0.42 });
    out.push({ shape: "cyl", size: [0.52, 0.11], pos: [1.05, y + 0.06, -D / 2 + 0.28], seg: 14, shade: 1.15 });
    out.push({ shape: "cyl", size: [0.36, 0.10], pos: [1.05, y + 0.09, -D / 2 + 0.28], seg: 12, shade: 0.30 });
    /* THE SENSOR'S FLEX. Its bus bars and its fan-out USED TO BE HERE and
       are not any more — SENSOR_TRACES holds them and digitizerGold
       draws them.

       They were on this part, which is GLASS, so the only way to make a
       copper trace differ from the pane it sits on was `shade`. At 2.2 on
       a near-white glass they came out as a WHITE STARBURST — the
       loudest thing on the layer, over a cracked screen that is the
       subject, and nothing about it said metal.

       That is the adjacency rule this build already carries, in its other
       form: one colour per part is not enough when a part is drawn out of
       two materials. Copper is not glass, so it goes on the gold part and
       is gold. */
    {
      const EZ = D / 2;
      /* the flex off the bottom edge, with its waist and its two
         locating holes, running out to where the controller sits */
      out.push({ shape: "rbox", size: [1.45, 0.05, 0.90], pos: [0, y - 0.07, EZ + 0.35], r: 0.04, shade: 0.34 });
      out.push({ shape: "rbox", size: [0.85, 0.05, 1.15], pos: [0, y - 0.07, EZ + 1.35], r: 0.04, shade: 0.34 });
      out.push({ shape: "rbox", size: [1.90, 0.05, 1.25], pos: [0.15, y - 0.07, EZ + 2.50], r: 0.04, shade: 0.34 });
      [-1, 1].forEach(function (sx) {
        out.push({ shape: "tube", size: [0.22, 0.09], pos: [sx * 0.50, y - 0.07, EZ + 1.35], seg: 20, shade: 0.70 });
      });
    }
    if (bonded) {
      /* ON AN OLED THE DIGITIZER IS INSIDE THIS PART — the owner's diagram
         says so in its own label, TOP GLASS (FRACTURED DIGITIZER). The
         touch grid is laminated into the glass, so it is drawn spanning
         the opening: fine, faint, and the reason a cracked screen on a
         modern handset is a whole-assembly job. There is no seam to
         separate. */
      /* Fine and faint. At shade 1.45 with 0.045 bars this grid was the
         loudest thing on the layer and it fought the map showing through
         behind it — loudness should track importance, and a touch grid is
         something you go looking for, not something that announces
         itself. */
      out.push({ shape: "box", size: [W - R * 2, 0.015, 0.03], pos: [0, y + 0.02, -D / 2 + R + 0.5],
        r: 0.01, shade: 1.12, repeat: { count: 10, step: [0, 0, (D - R * 2 - 1.0) / 9] } });
      out.push({ shape: "box", size: [0.03, 0.015, D - R * 2 - 0.4], pos: [-W / 2 + R + 0.5, y + 0.02, 0],
        r: 0.01, shade: 1.12, repeat: { count: 5, step: [(W - R * 2 - 1.0) / 4, 0, 0] } });
      /* the controller flex, which on a bonded assembly comes off the
         glass itself rather than off a separate sheet */
      out.push({ shape: "box", size: [1.4, 0.05, 0.9], pos: [-1.2, y - 0.06, D / 2 + 0.35], r: 0.02, shade: 0.55 });
    }
    if (cracked) {
      /* THE FRACTURE, GENERATED, from the owner's photograph of a broken
         screen beside its replacement.

         It was a decal \u2014 a photograph of a shattered handset mapped onto a
         sheet \u2014 on the argument that eleven radial bars and two rings is a
         diagram of a fracture and a fracture is thousands of shards. That
         argument was right about the eleven bars and wrong about the
         conclusion. The answer to too-coarse geometry is FINER geometry,
         which is the same lesson the milled web, the touch grid and the
         camera bores each taught in turn. A photograph blurs when the
         camera comes close; this does not.

         Three things the photograph settles, and the model had none of
         them right:

           THE KNOT IS OPAQUE WHITE. Crushed glass frosts \u2014 it is the one
             part of a break that is not transparent, and it is the first
             thing you look for because it says where the phone was hit
             and therefore what else took the shock.
           THE CRACKS KINK. A radial does not run straight; it changes
             direction a few times on its way out, because it follows the
             stress and the stress is not straight.
           AND GLASS COMES OFF. Loose shards end up on the bench, which is
             half of why this job is done on a mat with the phone taped
             and safety glasses on.

         Every piece is derived from where the glass edge actually is, and
         checkCracksStayOnTheGlass holds the whole lot inside the layer. */
      const KX = -0.55, KZ = -1.30;              /* where it was hit */
      const rnd = rng(20260908);
      const inner = { w: W - R * 2, d: D - R * 2 };
      /* how far the glass reaches from the impact point in a direction */
      function reach(a) {
        const cx = Math.cos(a), cz = Math.sin(a);
        const tx = cx > 0 ? (inner.w / 2 - KX) / cx : cx < 0 ? (-inner.w / 2 - KX) / cx : 1e9;
        const tz = cz > 0 ? (inner.d / 2 - KZ) / cz : cz < 0 ? (-inner.d / 2 - KZ) / cz : 1e9;
        return Math.max(0.4, Math.min(tx, tz) - 0.26);
      }
      /* THE KNOT: a cluster of crushed white shards, opaque */
      for (let i = 0; i < 20; i++) {
        const a = rnd.next() * 6.283, r = 0.05 + rnd.next() * 0.34;
        out.push({ shape: "box", size: [0.10 + rnd.next() * 0.16, 0.035, 0.09 + rnd.next() * 0.14],
          pos: [KX + Math.cos(a) * r, y + 0.075, KZ + Math.sin(a) * r],
          rot: [0, rnd.next() * 1.6, 0], r: 0.01, shade: 2.7 });
      }
      /* THE RADIALS, each in three segments that kink as they go out */
      const NR = 26, ends = [];
      for (let i = 0; i < NR; i++) {
        let a = (i / NR) * 6.283 + (rnd.next() - 0.5) * 0.10;
        const far = reach(a);
        let r0 = 0.30, x0 = KX + Math.cos(a) * r0, z0 = KZ + Math.sin(a) * r0;
        for (let k = 0; k < 3; k++) {
          const r1 = r0 + (far - 0.30) * (k === 2 ? 1 - (r0 - 0.30) / (far - 0.30) : 0.30 + rnd.next() * 0.16);
          a += (rnd.next() - 0.5) * 0.16;         /* the kink */
          const x1 = KX + Math.cos(a) * r1, z1 = KZ + Math.sin(a) * r1;
          const dx = x1 - x0, dz = z1 - z0;
          out.push({ shape: "box", size: [0.045, 0.03, Math.sqrt(dx * dx + dz * dz)],
            pos: [(x0 + x1) / 2, y + 0.065, (z0 + z1) / 2],
            rot: [0, Math.atan2(dx, dz), 0], r: 0.005, shade: 2.3 });
          r0 = r1; x0 = x1; z0 = z1;
          if (r0 >= far - 0.02) break;
        }
        ends.push(far);
      }
      /* THE CONCENTRIC RINGS between the radials, broken into arcs the way
         a real one is \u2014 a ring never closes all the way round */
      for (let g = 0; g < 5; g++) {
        const frac = 0.20 + g * 0.185;
        for (let i = 0; i < NR; i++) {
          if (rnd.next() < 0.28) continue;        /* the gaps */
          const a0 = (i / NR) * 6.283, a1 = ((i + 1) / NR) * 6.283;
          const rr = 0.30 + (reach((a0 + a1) / 2) - 0.30) * frac;
          const x0 = KX + Math.cos(a0) * rr, z0 = KZ + Math.sin(a0) * rr;
          const x1 = KX + Math.cos(a1) * rr, z1 = KZ + Math.sin(a1) * rr;
          const dx = x1 - x0, dz = z1 - z0;
          out.push({ shape: "box", size: [0.035, 0.028, Math.sqrt(dx * dx + dz * dz)],
            pos: [(x0 + x1) / 2, y + 0.062, (z0 + z1) / 2],
            rot: [0, Math.atan2(dx, dz), 0], r: 0.005, shade: 2.1 });
          void 0;
        }
      }
      /* the fine crazing close in, which is what makes a break look like a
         break rather than like a spider drawn on a window */
      /* THE CRAZING IS PLACED AS A FRACTION OF `reach`, not at a fixed
         radius. Its first cut wandered out to 1.5 from the impact point in
         any direction, and in the narrow directions that is past the edge
         of the glass \u2014 checkCracksStayOnTheGlass caught it at 0.03 over.
         Derive the distance from where the edge actually is and it cannot
         happen, which is the same fix the radials got the first time this
         check fired. */
      for (let i = 0; i < 44; i++) {
        const a = rnd.next() * 6.283;
        const len = 0.12 + rnd.next() * 0.26;
        const r = 0.35 + rnd.next() * Math.max(0.1, reach(a) - 0.35 - len);
        out.push({ shape: "box", size: [0.022, 0.025, len],
          pos: [KX + Math.cos(a) * r, y + 0.060, KZ + Math.sin(a) * r],
          rot: [0, rnd.next() * 3.14, 0], r: 0.004, shade: 1.9 });
      }
    }
    return out;
  },
};

/* AND THE COVER'S FOUR CAMERA OPENINGS ARE HOLES TOO.

   The owner asked for four, and asked for HOLES rather than lenses,
   because the cameras are mounted on the board and the cover only lets
   them look out. A student who has seen the back come off with four empty
   openings in it will never order a back cover when a camera has failed.

   The same three ways of getting a bore wrong apply as on the speaker
   grille, plus one this layer can fail on its own: a bore that does not
   run right through the panel AND the raised island on top of it, which
   would leave a blind recess rather than an opening. */
(function checkTheCoverHasFourHoles() {
  const parts = BUILD.back(0);
  const T = 0.22, thru = T + CAM.island.h;
  /* A bore is an OPEN CYLINDER now, so that is what gets counted. It was
     counted as `.ring` when the bores were rings of blocks, and the
     polished lips \u2014 rings too \u2014 doubled the tally to eight. Identify a
     thing by what it IS, not by a property it happens to carry. */
  const bores = parts.filter(function (p) { return p.shape === "tube" && p.isBore; });
  if (bores.length !== CAM.holes.length || bores.length !== 4) {
    throw new Error("bench-mobile: the back cover has " + bores.length + " camera openings " +
      "and CAM.holes lists " + CAM.holes.length + ". The owner asked for four, and they have " +
      "to be openings rather than lenses \u2014 the cameras are on the board, and a cover with " +
      "lenses drawn on it teaches a student to order the wrong part.");
  }
  bores.forEach(function (p) {
    if (p.size[0] <= 0.10) {
      throw new Error("bench-mobile: a camera opening at x " + p.pos[0].toFixed(2) +
        " is only " + p.size[0].toFixed(3) + " across. That is not an opening a camera can " +
        "see out of.");
    }
    if (p.size[1] < thru - 0.01) {
      throw new Error("bench-mobile: a camera opening at x " + p.pos[0].toFixed(2) +
        " is " + p.size[1].toFixed(2) + " deep where the panel and its island together are " +
        thru.toFixed(2) + ". It stops short, so it is a blind recess and not an opening.");
    }
    /* and the plateau has to actually be cut away around it, or the bore
       is a cylinder standing inside solid metal */
    const cell = parts.filter(function (q) {
      if (q.shape !== "rbox" || Math.abs(q.size[1] - thru) > 1e-9) return false;
      const ox = Math.min(q.pos[0] + q.size[0] / 2, p.pos[0] + p.size[0] / 2) -
                 Math.max(q.pos[0] - q.size[0] / 2, p.pos[0] - p.size[0] / 2);
      const oz = Math.min(q.pos[2] + q.size[2] / 2, p.pos[2] + p.size[0] / 2) -
                 Math.max(q.pos[2] - q.size[2] / 2, p.pos[2] - p.size[0] / 2);
      return ox > 0.06 && oz > 0.06;
    });
    if (cell.length) {
      throw new Error("bench-mobile: solid plateau covers the camera opening at x " +
        p.pos[0].toFixed(2) + ". The island has to be drawn as bars AROUND the four cells, " +
        "not as a slab with cylinders standing in it.");
    }
  });
  /* and the panel must be a frame round the island, not a sheet under it */
  const I = CAM.island;
  /* OVERLAP, not centre containment. The first version of this arm asked
     whether a panel piece's CENTRE fell inside the island, and a single
     full-size sheet has its centre in the middle of the phone \u2014 so the
     one defect it existed to catch walked straight past it. */
  const covering = parts.filter(function (p) {
    if (p.shape !== "rbox" || Math.abs(p.size[1] - T) > 1e-9) return false;
    const ox = Math.min(p.pos[0] + p.size[0] / 2, I.x + I.w / 2) -
               Math.max(p.pos[0] - p.size[0] / 2, I.x - I.w / 2);
    const oz = Math.min(p.pos[2] + p.size[2] / 2, I.z + I.d / 2) -
               Math.max(p.pos[2] - p.size[2] / 2, I.z - I.d / 2);
    return ox > 0.05 && oz > 0.05;
  });
  if (covering.length) {
    throw new Error("bench-mobile: a full-thickness panel piece sits under the camera island, " +
      "so the four openings have solid cover behind them. The panel has to be drawn as a FRAME " +
      "round the island's square \u2014 otherwise the holes are dimples in a sheet.");
  }
})();

/* A HOLE HAS TO BE A HOLE.

   The midframe's charge port and speaker grille were a dark rectangle and
   five dark dots painted on a continuous wall. That is a picture of a
   hole, and it fails the moment a student turns the frame to look along
   the bottom edge — which is exactly the angle the port question is asked
   from. The wall is now three pieces with two gaps between them, and this
   measures the gaps: nothing that is part of the WALL may stand inside
   one. The port moulding and the grille holes are allowed in, because
   they are the things the gaps exist for. */
(function checkTheFrameHasRealHoles() {
  const parts = BUILD.midframe(0);
  const WALL_H = 0.62;                    /* only full-height wall pieces count */
  const walls = parts.filter(function (p) {
    return p.shape === "rbox" && Math.abs(p.size[1] - WALL_H) < 1e-9;
  });
  /* The gaps are in the BOTTOM wall only. The top and side walls are at the
     same x as the gaps and would otherwise read as covering them, so pick
     out the run of wall furthest along +z and measure only that. */
  const bottomZ = walls.reduce(function (m, p) { return Math.max(m, p.pos[2]); }, -Infinity);
  /* A GAP DECLARED OUTSIDE THE WALL IS NOT A GAP. The grille was first
     stated at x 2.0 to 3.5 on a wall that ends at 2.85, which made the
     third wall piece a box of NEGATIVE width and pushed the grille itself
     off the end of the frame. It rendered — a thin plate hanging in the
     air past the corner — and the only thing that caught it was another
     check three layers away complaining the board had stopped clearing
     the midframe. Anything derived from these numbers is only as sound as
     the numbers, so measure them first. */
  parts.forEach(function (p) {
    if (p.shape === "rbox" && p.size[0] <= 0) {
      throw new Error("bench-mobile: the midframe has a piece of width " + p.size[0].toFixed(2) +
        " at x " + p.pos[0].toFixed(2) + ". A negative-width box is a gap declared outside " +
        "the wall it is meant to be a gap in — check MIDFRAME_GAPS against the rim's own " +
        "half-width before anything else.");
    }
  });
  ["port", "grilleL", "grilleR"].forEach(function (name) {
    const g = MIDFRAME_GAPS[name];
    walls.forEach(function (p) {
      if (Math.abs(p.pos[2] - bottomZ) > 0.01) return;
      const lo = p.pos[0] - p.size[0] / 2, hi = p.pos[0] + p.size[0] / 2;
      const over = Math.min(hi, g[1]) - Math.max(lo, g[0]);
      if (over > 0.01) {
        throw new Error("bench-mobile: a rim wall piece spanning x " + lo.toFixed(2) +
          " to " + hi.toFixed(2) + " covers " + over.toFixed(2) + " of the " + name +
          " gap (" + g[0] + " to " + g[1] + "). The gap has to be open all the way " +
          "through, because the whole point of building the frame as a casting is " +
          "that a student can look along the bottom edge and see daylight where the " +
          "port is. A wall with a dark rectangle drawn on it is a decal of a hole.");
      }
    });
  });
  /* AND EACH GRILLE RUN HAS TO BE REAL HOLES.

     Both runs are checked, because the edge is symmetric and losing one of
     them silently is exactly what happens when a constant gets renamed.

     Three things can go wrong with a bore built as a ring of blocks, and
     all three have: too few holes, a ring whose blocks have closed over
     the middle, and a ring whose blocks are too narrow to touch each
     other \u2014 which leaves a gappy crown of studs rather than a hole.

     A NOTE ON THIS CHECK ITSELF. Its first version had an arm that could
     never fire: the bore is derived as radius minus half the block, and
     the radius was in turn derived from the block, so the bore came out
     the same whatever was done to it. It was calibrated, the planted
     defect came back clean, and that is the only reason anybody noticed.
     A second version lost its count arm entirely to a careless edit and
     went quiet on a whole missing grille run. Written down is not the
     same as working. */
  ["grilleL", "grilleR"].forEach(function (name) {
    const g = MIDFRAME_GAPS[name];
    const bores = parts.filter(function (p) {
      return p.ring && Math.abs(p.pos[2] - bottomZ) < 0.01 &&
             p.pos[0] > g[0] && p.pos[0] < g[1];
    });
    if (bores.length < 4) {
      throw new Error("bench-mobile: the " + name + " speaker grille has " + bores.length +
        " drilled holes. The owner's photograph of the handset edge shows a run of round " +
        "holes on EACH side of the port \u2014 one of them a loudspeaker and the other a " +
        "microphone behind an identical grille, which is why \u201cmuffled\u201d and " +
        "\u201cnobody can hear me\u201d look the same from outside and are not the same fault.");
    }
    bores.forEach(function (p) {
      const bore = (p.ring.radius - p.size[0] / 2) * 2;
      if (bore <= 0.02) {
        throw new Error("bench-mobile: a grille ring at x " + p.pos[0].toFixed(2) +
          " has a bore of " + bore.toFixed(3) + " \u2014 its blocks have closed over the middle, " +
          "so it is a stud rather than a hole.");
      }
      /* the blocks have to reach each other, or the ring is a crown of
         separate teeth with wall missing between them */
      const arc = 2 * Math.PI * p.ring.radius / p.ring.count;
      if (p.size[1] < arc) {
        throw new Error("bench-mobile: a grille ring at x " + p.pos[0].toFixed(2) +
          " has blocks " + p.size[1].toFixed(3) + " wide on an arc of " + arc.toFixed(3) +
          ". They do not touch, so the bore is ringed by separate teeth with gaps between " +
          "them rather than by solid metal \u2014 a hole has an edge all the way round.");
      }
      /* and it has to run right through the wall rather than float in it,
         which is what the torus version did: 0.06 deep in 0.34 of metal */
      if (p.size[2] < 0.30) {
        throw new Error("bench-mobile: a grille ring at x " + p.pos[0].toFixed(2) +
          " is only " + p.size[2].toFixed(2) + " deep in a wall 0.34 thick. You can see past " +
          "it, so it reads as a raised doughnut stuck on the metal instead of a hole through " +
          "it \u2014 which is the painted-hole mistake wearing a different hat.");
      }
    });
  });
})();

/* A BATTERY IS A CELL AND A BOARD, AND THE LABEL HAS TO BE ON THE CELL.

   Three of this check's arms are the three clearance bugs found building
   this layer, in one sitting, all of the same shape:

     the LABEL was laid at base + 0.03 and the cell has a crown of its own
       reaching base + 0.07, so the label rendered as nothing and the cell
       came out a bare silver pouch;
     the PRINT was left at base + 0.07 when the strips moved up to base +
       0.13, so every rule was inside the paper it is printed on;
     the PULL TABS were at y + 0.03 inside a tray that starts at y + 0 and
       is 0.22 deep, so they were buried and only their ends showed,
       hanging in mid-air with nothing attached.

   That is the light guide plate's lesson for the fourth, fifth and sixth
   time: arithmetic that reads as correct beside geometry the arithmetic
   does not know about. So this check does not trust any of it — it asks
   the builders for the numbers and compares them.

   The other arms are about what the model CLAIMS. A pouch wired straight
   to a plug is not a battery and does not exist; the protection board is
   why a lithium pack can be handled, the thermistor is why the connector
   is three-way, and a student who is told "check whether protection has
   tripped before you condemn the cell" needs somewhere to point.

   Calibrated six for six. */
(function checkTheCellIsAPack() {
  const CLEAR = 0.03;
  function span(q) {
    return { lo: q.pos[1] - q.size[1] / 2, hi: q.pos[1] + q.size[1] / 2 };
  }
  const cell = BUILD.battery(0, false);
  /* the tallest thing the cell itself draws, which is what the label has
     to clear — taken from the part rather than assumed */
  let crown = -Infinity, floor = Infinity;
  cell.forEach(function (q) {
    const s = span(q);
    if (Math.abs(q.pos[2] - CELL.BZ) < CELL.bodyD) { crown = Math.max(crown, s.hi); floor = Math.min(floor, s.lo); }
  });

  ["good", "swollen"].forEach(function (which) {
    const swollen = which === "swollen";
    const lab = BUILD.batteryLabel(0, swollen);
    const strips = lab.filter(function (q) { return q.shape === "rbox"; });
    const print = lab.filter(function (q) { return q.shape !== "rbox"; });
    if (strips.length < 6) {
      throw new Error("bench-mobile: the " + which + " cell's label is " + strips.length +
        " strips. It is laid in strips so it can bend over a swollen dome; too few and it is " +
        "a flat plate again, which is the one thing this label exists not to be.");
    }
    /* ONE: the label clears the cell's own crown */
    const lowest = Math.min.apply(null, strips.map(function (q) { return span(q).lo; }));
    if (lowest - crown < CLEAR) {
      throw new Error("bench-mobile: the " + which + " cell's label sits " +
        (lowest - crown).toFixed(3) + " above the top of the cell, under the " + CLEAR +
        " it needs. The cell has a crown of its own and the label was laid inside it — it " +
        "rendered as nothing at all and the cell came out a bare silver pouch.");
    }
    /* TWO: THE PRINT IS IN THE TEXTURE, SO THERE IS NO PRINT GEOMETRY.

       This arm used to compare each printed bar against the strip it sat
       on, and it caught a real bug: the strips were raised to clear the
       cell's crown and the bars were left behind inside them. The bars
       are gone now. The label carries REAL TEXT, painted by `cellFace` —
       part number, chemistry, both capacities, both voltages, the
       warnings and the marks — and raised geometry over the top of that
       would be smears across words a student is meant to read.

       An arm whose subject no longer exists is a check that can never
       fire, and this file has been bitten by one of those before. So it
       asserts the new arrangement instead. */
    if (print.length) {
      throw new Error("bench-mobile: the " + which + " cell's label draws " + print.length +
        " piece(s) of print as GEOMETRY. The wording is painted into the texture now, and " +
        "bars laid over it are raised smears across words a student is meant to read.");
    }
  });

  /* THREE: the swollen label bends, and it bends as a CURVE */
  const dome = BUILD.batteryLabel(0, true).filter(function (q) { return q.shape === "rbox"; });
  const hs = dome.map(function (q) { return q.pos[1]; });
  const rise = Math.max.apply(null, hs) - Math.min.apply(null, hs);
  if (rise < 0.25) {
    throw new Error("bench-mobile: the swollen cell's label rises only " + rise.toFixed(2) +
      " across its width. The label is glued to the foil, so it goes where the foil goes — a " +
      "label lying flat on a domed cell is the model saying the swelling does not show.");
  }
  const tilted = dome.filter(function (q) { return Math.abs((q.rot && q.rot[2]) || 0) > 0.02; });
  if (tilted.length < dome.length - 2) {
    throw new Error("bench-mobile: only " + tilted.length + " of the swollen label's " +
      dome.length + " strips are tilted to the dome. Flat strips at different heights are not " +
      "a curve, they are a venetian blind — the same too-few-steps failure the dome itself " +
      "had when it was five stacked boxes.");
  }

  /* FOUR: the pull tabs are UNDER the cell.

     AND IT IS THE PIECES INSIDE THE CELL'S FOOTPRINT THAT ARE ASKED.
     The first cut asked whether ANY part of the tabs was below the floor,
     and the grab ends past the foot are always below it — so the arm
     passed with the strip itself buried in the tray, which is the exact
     defect it was written for. Planting it is the only reason that was
     found. A check that is satisfied by the easy half of a part is not
     checking the part. */
  const pull = BUILD.cellPull(0);
  const under = pull.filter(function (q) {
    return Math.abs(q.pos[2] - CELL.BZ) < CELL.bodyD / 2;
  });
  if (!under.length) {
    throw new Error("bench-mobile: the pull tabs draw nothing inside the cell's own footprint. " +
      "The strip runs the WHOLE LENGTH underneath — that is what makes it a stretch-release " +
      "strip rather than a tag stuck on the end.");
  }
  under.forEach(function (q) {
    if (span(q).hi > floor + 0.001) {
      throw new Error("bench-mobile: a pull tab reaches " + (span(q).hi - floor).toFixed(3) +
        " above the cell's floor at " + floor.toFixed(2) + ", so it is INSIDE the cell rather " +
        "than under it. Buried in the tray it is invisible except for its ends, which then " +
        "read as two flaps hanging in mid-air with nothing attached.");
    }
  });

  /* FIVE: the pack has a board, a thermistor and a three-way connector */
  const pcm = BUILD.cellProtection(0);
  if (pcm.length < 8) {
    throw new Error("bench-mobile: the protection board is " + pcm.length + " primitives. A " +
      "phone battery is a cell PLUS a board — the FET pair, the fuse, the thermistor and the " +
      "tab welds are the reason a lithium pack can be handled at all, and a pouch wired " +
      "straight to a plug is a thing that does not exist.");
  }
  const ways = cell.filter(function (q) {
    return q.repeat && q.repeat.count === 3 && q.pos[2] < -4.5;
  });
  if (!ways.length) {
    throw new Error("bench-mobile: the battery connector is not drawn with three ways. The " +
      "third pin is the THERMISTOR, and \"why is it a three-way and not a two\" is the " +
      "question this part is on the bench to answer.");
  }
})();

/* THE PANEL IS A STACK OF FIVE SHEETS, AND IT HAS TO STAY ONE.

   Written straight after the light guide plate's dots vanished under a
   0.0025 gap, because this layer has FOUR gaps of exactly that kind and
   there is no reason to find each one by rendering it. Every sheet must
   clear the one below it by 0.03, and the photograph of the lit screen
   must clear the lot — it used to sit at 0.13, which was above the face
   of a single slab and is now somewhere inside the liquid crystal.

   The other two arms are about what the model CLAIMS.

   THE LEDGES ARE ADDRESSES. The colour filter is smaller than the TFT
   glass on purpose: the strip left uncovered down the side is where the
   gate driver lives and the wider strip at the bottom is where the source
   driver bonds. That is what turns "the screen is broken" into "vertical
   bands are the bottom edge, horizontal bands are the side one". Make the
   two sheets the same size and the parts have nowhere to be.

   AND THE POLARISER AXES ARE CROSSED. The two hatchings run at ninety
   degrees to each other and that IS the mechanism — light through the
   first film is stopped by the second unless the crystal twists it. Drawn
   parallel they would still look like a tidy pair of films, and the model
   would be quietly teaching that an LCD does not need to do anything to
   its light. A falsehood that renders beautifully is the dangerous kind.

   Calibrated five for five. */
(function checkThePanelIsAStack() {
  const SEQ = ["rear", "tft", "gap", "cf", "front"];
  const CLEAR = 0.03;
  for (let i = 1; i < SEQ.length; i++) {
    const lo = SEQ[i - 1], hi = SEQ[i];
    const gap = (PANEL_Y[hi] - PANEL_T[hi] / 2) - (PANEL_Y[lo] + PANEL_T[lo] / 2);
    if (gap < CLEAR) {
      throw new Error("bench-mobile: the panel's " + hi + " sheet clears the " + lo +
        " under it by " + gap.toFixed(4) + ", under the " + CLEAR + " it needs. The light " +
        "guide plate's dots were 0.0025 clear and rendered as nothing at all — a sheet that " +
        "is arithmetically above another one is not necessarily a sheet anybody can see.");
    }
  }
  /* the photograph of the lit screen, above the whole stack */
  const top = PANEL_Y.front + PANEL_T.front / 2;
  const lift = 0.58;                 /* what the PH table hands photoPlate */
  if (lift - 0.01 - top < CLEAR) {
    throw new Error("bench-mobile: the lit-screen photograph sits " + (lift - 0.01 - top).toFixed(3) +
      " above the top of the panel stack. It used to be a plate over a single slab; it is now " +
      "the top of a five-sheet module, and at this lift it is inside the liquid crystal.");
  }
  /* the two ledges the drivers bond to */
  if (CF.inX / 2 < 0.25) {
    throw new Error("bench-mobile: the colour filter leaves only " + (CF.inX / 2).toFixed(2) +
      " of side ledge on the TFT glass. That strip is where the GATE driver lives, and " +
      "without it a horizontal-band fault has nowhere on this model to be pointed at.");
  }
  if (CF.inZ < 0.5) {
    throw new Error("bench-mobile: the colour filter leaves only " + CF.inZ.toFixed(2) +
      " of bottom ledge. That is where the SOURCE driver's chip-on-film bonds, and it is " +
      "half of what makes vertical bands a different answer from horizontal ones.");
  }
  /* AND THE AXES ARE CROSSED */
  const pol = BUILD.lcdPolarisers(0).filter(function (q) { return (q.shade || 0) >= 1.8; });
  if (pol.length < 2) {
    throw new Error("bench-mobile: the polarisers carry " + pol.length + " axis marking(s). " +
      "Two films at ninety degrees is the whole mechanism of an LCD, and one hatching says " +
      "nothing at all — a student cannot see a right angle in a single set of lines.");
  }
  function runsAlong(q) { return q.size[0] >= q.size[2] ? "x" : "z"; }
  const dirs = {};
  pol.forEach(function (q) { dirs[runsAlong(q)] = true; });
  if (!(dirs.x && dirs.z)) {
    throw new Error("bench-mobile: both polariser hatchings run along " +
      (dirs.x ? "x" : "z") + ". They are supposed to be at ninety degrees to each other — " +
      "that IS what an LCD does to light, and drawn parallel this model teaches that a " +
      "display needs no liquid crystal to work. It renders perfectly and it is a lie.");
  }
})();


/* THE DOT GRADIENT HAS TO BE VISIBLE, and "drawn" is not "visible".
   The extraction dots were correct geometry for four attempts running and
   rendered as absolutely nothing, because two separate things have to be
   true and only one of them is arithmetic a builder does on its own.

   ONE: a dot has to stand CLEAR of the plate, by more than the arithmetic
   says is enough. Centred at 0.405 on a plate whose top face is 0.385, a
   0.035 dot clears it by 0.0025 — positive, in the open air, and swallowed
   whole by the renderer. The only way that was found was to delete the
   plate from the part and watch the dots appear on their own. 0.0375 is
   what proved to show on screen; the floor here is 0.03, which is more
   than ten times the sliver that failed and under the value that works.

   TWO: the films above have to leave the dots UNCOVERED, and not just at
   one end. Shortening the films opened three of the thirteen rows, all
   from the same end of the gradient — and a gradient you can see one end
   of is not a gradient, it is a patch of dots. So this counts uncovered
   dots ROW BY ROW and insists the far end shows meaningfully more of them
   than the LED end. That difference IS the mechanism: the far end has
   less light left, so it needs more dots to get the same brightness out.

   Calibrated six for six: the dots dropped back to 0.405, the films
   widened over the whole plate, the films cut back just enough to show one
   dot a row, every row given the same dot count so there is no gradient
   left to read, the films deleted, and the dot rows deleted. Every one
   fired, and each named the thing that was actually wrong. */
(function checkTheDotsCanBeSeen() {
  const guide = BUILD.backlightGuide(0);
  const plate = guide.filter(function (p) { return p.shape === "rbox"; })[0];
  const rows = guide.filter(function (p) { return p.shape === "cyl"; });
  if (!plate || rows.length < 8) {
    throw new Error("bench-mobile: the light guide plate has " + rows.length + " dot rows " +
      "and " + (plate ? "a plate" : "no plate") + ". The dots and the plate are the part; " +
      "if either has gone the check below is measuring nothing.");
  }
  const CLEAR = 0.03;
  const plateTop = plate.pos[1] + plate.size[1] / 2;
  rows.forEach(function (d) {
    const gap = (d.pos[1] - d.size[1] / 2) - plateTop;
    if (gap < CLEAR) {
      throw new Error("bench-mobile: a row of extraction dots stands " + gap.toFixed(4) +
        " clear of the plate's top face, under the " + CLEAR + " it needs. Positive is not " +
        "the same as visible: 0.0025 of clearance rendered as nothing at all, four times " +
        "running, and was read as a bug in the dots rather than in the gap under them.");
    }
  });

  /* what the films above actually cover */
  const films = BUILD.backlight(0).filter(function (p) {
    return p.shape === "rbox" && p.pos[1] > plateTop;
  });
  if (!films.length) {
    throw new Error("bench-mobile: the backlight has no film above the guide plate. Two " +
      "diffusers and the prism film between them are what stop the dots showing through " +
      "on a real panel; without them this check passes for the wrong reason.");
  }
  function covered(x, z) {
    return films.some(function (f) {
      return Math.abs(x - f.pos[0]) <= f.size[0] / 2 &&
             Math.abs(z - f.pos[2]) <= f.size[2] / 2;
    });
  }
  const open = rows.map(function (d) {
    const n = (d.repeat && d.repeat.count) || 1;
    const st = (d.repeat && d.repeat.step) || [0, 0, 0];
    let seen = 0;
    for (let i = 0; i < n; i++) {
      if (!covered(d.pos[0] + st[0] * i, d.pos[2] + st[2] * i)) seen++;
    }
    return seen;
  });
  open.forEach(function (seen, i) {
    if (seen < 2) {
      throw new Error("bench-mobile: row " + i + " of the extraction dots has " + seen +
        " dot(s) showing past the films. Every row needs at least two, or the spacing " +
        "inside that row — which is the whole gradient — cannot be read off it.");
    }
  });
  const led = open[0], far = open[open.length - 1];
  if (far - led < 2) {
    throw new Error("bench-mobile: the open margin shows " + led + " dots at the LED end and " +
      far + " at the far end. That is not a gradient anybody can see. The far end has less " +
      "light left to work with and carries more dots because of it; if the visible strip " +
      "does not show that, the dots are decoration.");
  }
})();

/* EVERY LAYER HAS TO BE VISIBLE, AND THAT IS ARITHMETIC.

   The main logic board went in and could not be seen. The cause is worth
   stating precisely, because the first version of this check got it
   wrong: it is NOT that a squarely stacked layer is hidden — from a
   raised camera you see the near part of every layer under the one above
   it. It is that the board is SMALLER in footprint than the midframe
   directly above it, so its whole outline falls inside that one's.

   So the requirement is about footprints, not about a made-up fraction of
   the phone. The first cut demanded "at least a fifth of the width" and
   promptly failed on the real values — and the number was invented, which
   is the thing this codebase keeps having to relearn: a threshold nobody
   can derive is a threshold that will be tuned until it passes.

   The derivation, worst case, ignoring the camera angle entirely (a
   straight-down view, where nothing is revealed by perspective):

     a lower layer is visible iff some part of its outline falls OUTSIDE
     the outline of the layer above it. With the stack fanned by FAN_X and
     FAN_Z, the lower layer's leading edge sits at
        (its own half-extent) + FAN
     beyond the upper layer's, minus whatever the upper layer is wider by.

   MARGIN is 0.45, which is not arbitrary either: the layers carry a 0.16
   to 0.18 corner radius, and a visible strip narrower than its own corner
   radius reads as a shadow rather than as a part. 0.45 is that with room
   to spare.

   It also refuses a fan so wide the layers stop overlapping. There is a
   version of this that fixes visibility by scattering the parts across
   the bench, and it teaches nothing about ORDER — which is the one thing
   this bench exists to teach. */
(function checkEveryLayerIsVisible() {
  const MARGIN = 0.45;
  function footprint(list) {
    let hx = 0, hz = 0;
    list.forEach(function (q) {
      const sz = q.size, a = (q.rot && q.rot[1]) || 0;
      const qx = sz[0] / 2, qz = (sz[2] === undefined ? sz[0] : sz[2]) / 2;
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      hx = Math.max(hx, Math.abs(q.pos[0]) + qx * ca + qz * sa);
      hz = Math.max(hz, Math.abs(q.pos[2]) + qx * sa + qz * ca);
    });
    return { hx: hx, hz: hz };
  }
  ["lcd", "oled"].forEach(function (panel) {
    const st = layersFor(panel);
    st.forEach(function (L, i) {
      if (i === st.length - 1) return;          /* the top layer covers nothing */
      const U = st[i + 1];
      const lo = footprint(L.key === "battery" ? BUILD.battery(0, false)
                         : L.key === "glass" ? BUILD.glass(0, false, true) : BUILD[L.key](0));
      const up = footprint(U.key === "battery" ? BUILD.battery(0, false)
                         : U.key === "glass" ? BUILD.glass(0, false, true) : BUILD[U.key](0));
      /* how far the lower layer's leading edge clears the upper one's */
      const outX = (L.x - lo.hx) < (U.x - up.hx) ? (U.x - up.hx) - (L.x - lo.hx) : 0;
      const outZ = (L.z - lo.hz) < (U.z - up.hz) ? (U.z - up.hz) - (L.z - lo.hz) : 0;
      if (Math.max(outX, outZ) < MARGIN) {
        throw new Error("bench-mobile: on the " + panel + " stack, " + L.label + " shows only " +
          Math.max(outX, outZ).toFixed(2) + " past " + U.label + " directly above it — under " +
          "the " + MARGIN + " it needs to read as a part rather than a shadow. This is exactly " +
          "how the main logic board was invisible: a smaller footprint squarely under a larger " +
          "one is not a layer anybody can see.");
      }
    });
    /* and the fan must not have thrown the stack apart */
    const spanX = Math.abs(st[st.length - 1].x - st[0].x);
    if (spanX > PW * 1.6) {
      throw new Error("bench-mobile: the fan spreads the stack " + spanX.toFixed(1) +
        " across, more than one and a half phone widths. A student is meant to read this as " +
        "one phone taken apart in order, not as parts scattered over a bench.");
    }
  });
})();

/* THE FANNED STACK HAS TO LAND ON THE MAT.

   Fanning walked the top layers clear off the bench board and left them
   hanging over the edge — the model showed a phone half in mid-air. It is
   the same class of mistake as the workstation monitor whose stand was
   buried under the mat: a part placed relative to one thing while the
   thing it has to stand on was decided somewhere else. So the mat's size
   is checked against the stack that is actually drawn, both stacks. */
(function checkTheStackLandsOnTheMat() {
  const MAT_X = 20 / 2, MAT_Z = 20 / 2;
  ["lcd", "oled"].forEach(function (panel) {
    const st = layersFor(panel);
    st.forEach(function (L) {
      const x = Math.abs(L.x) + PW / 2, z = Math.abs(L.z) + PD / 2;
      if (x > MAT_X - 0.4 || z > MAT_Z - 0.4) {
        throw new Error("bench-mobile: on the " + panel + " stack, " + L.label + " reaches " +
          x.toFixed(1) + "/" + z.toFixed(1) + " from the centre and the mat is only " +
          MAT_X + "/" + MAT_Z + ". A layer hanging over the edge of the bench is a phone " +
          "half in mid-air.");
      }
    });
  });
})();

/* THE OWNER'S OWN REFERENCE, MAPPED ONTO THE LAYERS.

   Four of these layers now carry a decal cut from the owner's own images
   rather than a drawing of one. That is a different thing from anything
   else in this build and it is worth being precise about why it took so
   long to get to: the engine could already load photographs, but only as
   MATERIALS — seamless squares of grain, repeated. A picture of a specific
   object needs the opposite treatment, and `decal` mode in surface.js is
   that, with the UV normalising in scene.js to go with it.

   WHICH REFERENCE FOR WHICH LAYER, and why not all from one:

     glass      phoneScreen   from the cracked-handset reference, which is
                              nearly face-on and resolves well
     board      logicBoard    from the exploded-layer reference
     battery    batteryRef    from the exploded-layer reference
     midframe   midframeRef   from the exploded-layer reference

   The exploded-layer reference shows its SCREEN layers almost edge-on —
   they came out 71 and 73 pixels tall — so the screens take their picture
   from the other reference, which shows the same handset, the same map and
   the same cards from a usable angle. Using the better source for each
   part is not a compromise; using one source for everything would be.

   A SHEET IS BUILT TO ITS PICTURE, NOT TO ITS PART. A decal stretched to a
   shape it was not cut for smears, and the first mount proved it: a nearly
   square screen pulled across a 5 by 11.5 sheet came out as an unreadable
   landscape band. So each sheet takes the tile's own aspect, is fitted
   inside the layer's footprint, and checkDecalsAreNotStretched below holds
   every one of them to it. */
const DECAL_ON = {
  /* THE BACK COVER'S PHOTOGRAPH IS GONE, for the same reason the
     midframe's went: an upscaled crop stretched over a phone-sized part,
     which made the flat-on view an empty black rectangle with a blurred
     picture floating above it. The finish is generated now, and the
     things that were hiding under the photograph \u2014 four camera openings,
     the antenna seams, the adhesive, the printed marks \u2014 are geometry. */
  glass:     { tile: "topGlassBlack",  inset: 0.97, align: "centre" },
  polariser: { tile: "polariserFlat",  inset: 0.97, align: "centre" },
  /* THE PANEL HAS TWO PHOTOGRAPHS AND THE SCENARIO PICKS. A working panel
     is the owner's shot of the handset powered and showing a home screen;
     a failed one is their shot of it disconnected and black. That pair is
     the whole diagnosis on this bench — a display can be perfectly alive
     under a shattered cover glass, and telling those apart is the
     difference between a screen assembly and a piece of glass. Neither is
     drawn; both are photographs of the two states. */
  /* INSET 0.66, NOT 0.97, NOW THE PANEL IS A MODULE UNDER IT.

     At 0.97 the lit picture covered the whole layer, which was fine when
     everything below it was one slab and is exactly the light guide
     plate's mistake now that it is not. The TFT ledges, the seal, the
     colour filter's stripes and the crossed polariser axes are all things
     a student is meant to look at, and a photograph laid over the lot
     hides every one of them.

     0.66 is the ACTIVE AREA — which is what a picture on a panel actually
     is. It stops short of the edge on the real part too, and the frame of
     construction showing round it is the rest of the panel, not a margin
     left for convenience. */
  lcd:       { tile: "phoneHome", dead: "oledPanelFlat", inset: 0.66, align: "centre" },
  /* THE MIDFRAME'S PHOTOGRAPH IS GONE, and this is why.

     It was a 470-pixel crop stretched the length of a phone-sized part,
     and close up it was an unrecognisable grey smear — worse than
     nothing, because a student looking into the frame saw mush where the
     board cavity, the ribbing and the antenna runs should be. No
     regeneration fixes that: it is the wrong tool. Detail finer than the
     geometry has to be GENERATED, the way the board's traces are, so it
     stays sharp at whatever distance the camera asks for. */
  /* THE BOARD IS NOT IN HERE ANY MORE, and that is the point of this pass.

     It was modelled at 63 primitives — five shield cans each with the
     fence of clips its lid snaps onto, five connectors each with the latch
     bar that gets broken, the SIM reader, gold pads, six screws with
     driver slots, passives in the clusters they actually sit in — and then
     all of it was deleted and replaced with ONE FLAT PLATE wearing a
     photograph. That is a billboard, not a model: turn the camera and it
     is a picture on a card.

     The division of labour that should have been there from the start:

       GEOMETRY      for FORM. Anything with height, an edge, or a shadow.
                     A can stands off the board. A connector has a lip.
       PROCEDURAL    for MATERIAL. Laminate, weave, ground pour, traces,
                     brushed foil, anodised alloy — things that are the
                     same everywhere and read wrong when repeated from a
                     photograph.
       PHOTOGRAPH    only where the surface IS a printed picture that
                     cannot be generated: a lit screen, a printed label, a
                     fracture pattern. Those stay, and they are the right
                     use of the owner's references.

     A photograph is a reference for where things go and what colour they
     are. It is not a substitute for building them. */
  /* THE CELL HAS TWO PHOTOGRAPHS TOO, and this pair is a safety gate
     rather than a diagnosis. Both are taken from directly above, which is
     the angle this layer is drawn at — an earlier edge-on shot of the same
     swollen cell could not be used, because a side view mapped onto a face
     read as a smear.

     One honest caveat, recorded rather than hidden: the two cells in the
     references are NOT the same part. The good one is the handset's own
     L-19 at 12.6 Wh and 3.8 V; the swollen one is a larger 41.4 Wh, 11.4 V
     laptop cell. So the model must NOT claim the labels match, and the
     words below do not — they point at the pillowing, which is what
     actually differs and what actually condemns a cell. */
  /* THE CELL'S PHOTOGRAPH IS GONE, and this one is worth writing down
     because the photograph was DEFENSIBLE and the drawing is still better.

     A printed label really is a printed picture, which is the one case
     this build allows a decal. But `batteryLabel` was already written, and
     it lays the label as nine lengthwise strips each LIFTED TO THE HEIGHT
     OF THE DOME UNDER IT — so on a swollen cell the label stops lying
     flat and starts catching the light in bands, which is exactly the tell
     the owner's own photograph shows. It had been dead code the whole
     time, because this entry put a flat plate over it.

     And a flat plate over a domed cell is the billboard-over-a-model
     problem in miniature: photoPlate lifts the sheet clear of the tallest
     thing in the part, so on the swollen cell it hovered above the dome
     as a rigid card — drawing the one state where the label's behaviour
     IS the diagnosis, and drawing it wrong. */
};

/* The footprint each layer's sheet has to fit inside. Taken from the
   layer's own build rather than from PW/PD, because the layers are not all
   the same size and a sheet sized off the phone would hang over the ones
   that are inset. */
function layerFootprint(key) {
  const list = key === "battery" ? BUILD.battery(0, false)
             : key === "glass" ? BUILD.glass(0, false, true)
             : BUILD[key](0);
  let hx = 0, hz = 0;
  list.forEach(function (q) {
    const sz = q.size, a = (q.rot && q.rot[1]) || 0;
    const qx = sz[0] / 2, qz = (sz[2] === undefined ? sz[0] : sz[2]) / 2;
    const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
    hx = Math.max(hx, Math.abs(q.pos[0]) + qx * ca + qz * sa);
    hz = Math.max(hz, Math.abs(q.pos[2]) + qx * sa + qz * ca);
  });
  return { w: hx * 2, d: hz * 2 };
}

/* THE ASPECT OF A DECAL, PHOTOGRAPHED OR GENERATED.

   A photographed decal keeps its aspect in TILES, beside the image it
   was measured from. A GENERATED one has no tile at all and must not
   have: tiles.js refuses any entry without an embedded data: URI, and it
   is right to, because a tile IS a picture. So a generated surface
   declares its aspect in the painter that draws it and it is imported
   here.

   ONE RESOLVER, because THREE places size a screen from this number —
   the exploded sheet, the load-time check that refuses a stretched
   decal, and the closed handset's face. Three copies of the same lookup
   is three chances to drift, and a decal pulled to a shape it was not
   drawn for comes out smeared with nothing to say why. */
const GENERATED_ASPECT = { phoneHome: PHONE_SCREEN_ASPECT };

function decalAspect(name) {
  if (GENERATED_ASPECT[name] !== undefined) return GENERATED_ASPECT[name];
  const t = TILES[name];
  return t && t.aspect;
}

/* Size and place one layer's photo sheet. The picture keeps its own
   proportions and is scaled to whichever of the two directions runs out
   first, so it always fits and never stretches. */
function photoSheet(key, dead) {
  const cfg = DECAL_ON[key];
  if (!cfg) return null;
  const name = (dead && cfg.dead) ? cfg.dead : cfg.tile;
  const asp = decalAspect(name);
  if (!asp) {
    throw new Error("bench-mobile: the " + name + " decal has no aspect recorded. " +
      "A photographed one gets it from tools/cut-decals.py into TILES; a generated one " +
      "declares it in the painter and lists it in GENERATED_ASPECT above. Without it a " +
      "decal is stretched to whatever part it lands on and stops being readable.");
  }
  const fp = layerFootprint(key);
  const availW = fp.w * cfg.inset, availD = fp.d * cfg.inset;
  let w = availW, d = w / asp;
  if (d > availD) { d = availD; w = d * asp; }
  /* `bottom` pushes the sheet to the near end of the layer, which is where
     the cracked-screen reference's own view of the screen ends. */
  const z = cfg.align === "bottom" ? (fp.d * cfg.inset) / 2 - d / 2 : 0;
  return { w: w, d: d, z: z, tile: name, aspect: asp };
}

/* A DECAL MUST NOT BE STRETCHED, on any layer that carries one. The
   sheet's proportions and the tile's have to agree, or the picture smears
   and nothing says why. Calibrated by planting a sheet built to the part
   instead of to the picture. */
(function checkDecalsAreNotStretched() {
  Object.keys(DECAL_ON).forEach(function (key) {
    /* both states, where a layer has two */
    [false, true].forEach(function (dead) {
      if (dead && !DECAL_ON[key].dead) return;
      checkOne(key, dead);
    });
  });
  function checkOne(key, dead) {
    const g = photoSheet(key, dead);
    const got = g.w / g.d;
    if (Math.abs(got - g.aspect) / g.aspect > 0.02) {
      throw new Error("bench-mobile: the " + key + " sheet is " + got.toFixed(3) +
        " wide over deep and its picture is " + g.aspect.toFixed(3) + ". A decal pulled " +
        "to a shape it was not cut for comes out smeared, and the picture on it stops being " +
        "readable — which is the only reason the photograph is there.");
    }
    const fp = layerFootprint(key);
    if (g.w > fp.w + 0.01 || Math.abs(g.z) + g.d / 2 > fp.d / 2 + 0.01) {
      throw new Error("bench-mobile: the " + key + " sheet hangs off the layer it is on.");
    }
  }
})();


/* =====================================================================
   THE SWOLLEN-CELL REFERENCE CARD

   A flat photograph cannot lie on a domed surface — the one place the
   decal technique runs out, and the swollen cell is the only layer whose
   geometry is deliberately not flat. Laid over the crown, the owner's
   photograph read as a card resting on a pillow.

   So it becomes a card, standing on the bench beside the stack, the way
   the battery-health gauge already does. That keeps both halves of the
   thing: the DOME stays geometry, measured and checked, because that is
   what a student has to recognise on a device in front of them; and the
   PHOTOGRAPH stands beside it as the reference they are matching against.
   Recognise the shape on the model, confirm it against the real one.

   It appears ONLY when the cell is swollen. A reference of a failed part
   standing beside a healthy one would be a question the bench is not
   asking, and this bench's rule is that it never shows the answer.

   Sized from the tile's own aspect, like every other decal here, so the
   picture cannot be stretched.
   ===================================================================== */
/* THE RAKE IS ALMOST UPRIGHT, and that is not a style choice. The plate
   is authored flat in XZ and tilted about X, so a shallow rake leaves it
   nearly parallel to a camera that is already looking DOWN at 0.34 — the
   first cut at -0.38 showed the student the card's edge. It has to stand
   close to vertical for the photograph on it to face the room, which is
   what a reference card on a bench does. */
const CARD = { x: -6.9, z: -3.4, w: 5.0, tilt: -1.16 };

function swollenCard() {
  const t = TILES.cellSwollenFace;
  const h = CARD.w / (t && t.aspect ? t.aspect : 1);
  const out = [];
  /* the easel: a foot on the mat and a leg raking back */
  /* a foot on the mat, and a strut raking back to hold the board up */
  out.push({ shape: "rbox", size: [CARD.w * 0.75, 0.16, 1.6], pos: [CARD.x, 0.08, CARD.z - 0.55],
    r: 0.06, shade: 0.55 });
  out.push({ shape: "rbox", size: [0.30, h * 0.80, 0.24], pos: [CARD.x, h * 0.36, CARD.z - 0.62],
    rot: [-0.42, 0, 0], r: 0.05, shade: 0.45 });
  /* a lip along the bottom of the board, which is what a card rests on */
  out.push({ shape: "rbox", size: [CARD.w, 0.20, 0.26], pos: [CARD.x, 0.20, CARD.z + 0.18],
    r: 0.05, shade: 0.62 });
  return out;
}

/* The face the photograph is mapped onto. Its own part, because the card
   is a dark board and the picture on it is not. */
function swollenCardFace() {
  const t = TILES.cellSwollenFace;
  const h = CARD.w / (t && t.aspect ? t.aspect : 1);
  /* Sat on the lip and raked back on the strut. The 0.02 forward offset
     keeps it clear of the strut behind it rather than fighting it. */
  return [{ shape: "box", size: [CARD.w, 0.06, h], pos: [CARD.x, h * 0.47 + 0.18, CARD.z + 0.02],
    rot: [CARD.tilt, 0, 0], r: 0.02, shade: 1.0 }];
}

/* THE CARD HAS TO STAND ON THE MAT AND FACE THE CAMERA.

   Same failure the fanned stack had: a thing placed relative to one
   number while the surface it stands on was decided by another. The foot
   is on the mat, the board rakes back from it, and the whole card has to
   sit inside the bench rather than hanging off the edge of it. */
(function checkTheCardStands() {
  const t = TILES.cellSwollenFace;
  if (!t || !t.aspect) {
    throw new Error("bench-mobile: the swollen-cell card has no photograph with an aspect. " +
      "It exists to show the real thing beside the model; without the picture it is a blank " +
      "board and the dome has nothing to be checked against.");
  }
  const h = CARD.w / t.aspect;
  const MAT = 20 / 2;
  if (Math.abs(CARD.x) + CARD.w / 2 > MAT - 0.4 ||
      Math.abs(CARD.z) + h / 2 > MAT - 0.4) {
    throw new Error("bench-mobile: the swollen-cell card hangs off the bench mat.");
  }
  if (CARD.tilt >= -0.7 || CARD.tilt < -1.45) {
    throw new Error("bench-mobile: the card's rake is " + CARD.tilt + ". It has to lean BACK " +
      "from its foot and stand close to upright. A shallow rake leaves the board nearly " +
      "parallel to a camera that is already looking down at it, and the student sees the " +
      "card's EDGE rather than the photograph on it \u2014 which is what -0.38 did.");
  }
})();

/* A SWOLLEN CELL DOMES. IT DOES NOT GROW.

   This invariant lives here, beside the geometry it describes, because it
   is a fact about this pouch and not about benches in general. Two halves,
   and the second is the one that was wrong before the photograph arrived:

     1. the crown has to be clearly TALLER than the good cell, or the fault
        the lab treats as a safety gate is invisible from across a room;
     2. the pouch's FOOTPRINT has to be unchanged, because the seal welds
        round a lithium pouch do not move — the gas lifts the middle. A
        model that scales the whole cell up teaches a student to look for a
        bigger battery, and the dangerous ones are not bigger.

   The footprint half is measured with the crease boxes' Y-rotation taken
   into account, because that is where it would actually go wrong: a crease
   swung out past the seal line widens the cell without anybody choosing to
   widen it. It caught exactly that on its first run. */
(function checkSwellingDomes() {
  function extent(list, axis) {
    let lo = Infinity, hi = -Infinity;
    list.forEach(function (p) {
      const s = p.size, a = (p.rot && p.rot[1]) || 0;
      const hx = s[0] / 2, hy = s[1] / 2, hz = (s[2] === undefined ? s[0] : s[2]) / 2;
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const h = axis === 0 ? hx * ca + hz * sa : axis === 1 ? hy : hx * sa + hz * ca;
      const c = p.pos[axis];
      if (c - h < lo) lo = c - h;
      if (c + h > hi) hi = c + h;
    });
    return { lo: lo, hi: hi, span: hi - lo };
  }
  const good = BUILD.battery(0, false), bad = BUILD.battery(0, true);
  const rise = extent(bad, 1).hi - extent(good, 1).hi;
  if (rise < 0.45) {
    throw new Error("bench-mobile: a swollen cell rises only " + rise.toFixed(2) +
      " above a good one. It has to be obvious across a room — being spottable before " +
      "anything is opened is the entire reason this fault is a safety gate and not a " +
      "diagnosis.");
  }
  [[0, "x"], [2, "z"]].forEach(function (A) {
    const g = extent(good, A[0]), b = extent(bad, A[0]);
    if (b.span > g.span + 0.05) {
      throw new Error("bench-mobile: the swollen cell is " + (b.span - g.span).toFixed(2) +
        " wider in " + A[1] + " than the good one. It must not be. The owner's photograph of " +
        "the two pouches side by side shows the edges in exactly the same place — the seal " +
        "welds hold and the middle lifts. A cell drawn bigger all over teaches the student " +
        "to look for a bigger battery, and swollen ones are not bigger.");
    }
  });
})();

/* DAMAGE HAS TO STAY ON THE PART IT DAMAGED.

   The crack star's first cut ran fixed-length radials off a point near a
   corner and threw half of them clear off the layer — a spider hanging in
   the air above the phone. It rendered, it looked busy, and it was not
   damage to anything. This measures every piece of the cracked layer
   against the plain layer's own footprint, so a crack that leaves the
   glass fails the module instead of a render nobody happens to take. */
(function checkCracksStayOnTheGlass() {
  function box(list) {
    let x = 0, z = 0;
    list.forEach(function (p) {
      const s = p.size, a = (p.rot && p.rot[1]) || 0;
      const hx = s[0] / 2, hz = (s[2] === undefined ? s[0] : s[2]) / 2;
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      x = Math.max(x, Math.abs(p.pos[0]) + hx * ca + hz * sa);
      z = Math.max(z, Math.abs(p.pos[2]) + hx * sa + hz * ca);
    });
    return { x: x, z: z };
  }
  const whole = box(BUILD.glass(0, false, true)), broken = box(BUILD.glass(0, true, true));
  ["x", "z"].forEach(function (k) {
    if (broken[k] > whole[k] + 0.01) {
      throw new Error("bench-mobile: the cracks reach " + (broken[k] - whole[k]).toFixed(2) +
        " beyond the edge of the glass in " + k + ". A crack that leaves the part is not " +
        "damage to it — it is a decoration standing over the phone. Clip every radial and " +
        "ring to the layer's own footprint.");
    }
  });
})();

/* Pips, same shape as every other bench, floated off the long edge so a
   layer never covers its own indicator. */
function pip(y) {
  return [
    { shape: "cyl", size: [0.62, 0.16], pos: [PW / 2 + 1.5, y + 0.1, 0], rot: [0, 0, P2],
      seg: 16, shade: 1.0 },
    { shape: "sphere", size: [0.54], pos: [PW / 2 + 1.6, y + 0.1, 0], seg: 14, shade: 1.0 }
  ];
}
function pipWell(y) {
  return [{ shape: "cyl", size: [0.94, 0.10], pos: [PW / 2 + 1.42, y + 0.1, 0],
    rot: [0, 0, P2], seg: 16, shade: 0.30 }];
}

/* The battery health bar, standing beside the stack. */
/* IN FRONT OF THE STACK, NOT BESIDE IT.

   Stood at the side, the bar sat directly behind seven exploded layers at
   this camera yaw and was a thin sliver nobody could read — a gauge you
   cannot see is not a gauge. It goes in front, on the empty half of the
   bench. */
function healthBar(pct) {
  const H = 7.0, X = -(PW / 2) - 3.4, Y = 1.0, Z = PD / 2 + 1.6;
  const f = Math.max(0.04, Math.min(1, (pct || 0) / 100));
  return {
    trough: [{ shape: "rbox", size: [1.2, H, 0.9], pos: [X, Y + H / 2, Z], r: 0.16, shade: 1.0 },
      /* the 80% line, which is where a cell is considered worn out */
      { shape: "box", size: [2.0, 0.2, 1.1], pos: [X, Y + H * 0.8, Z], r: 0.02, shade: 2.2 }],
    fill: [{ shape: "rbox", size: [0.9, H * f, 1.02], pos: [X, Y + (H * f) / 2, Z], r: 0.12, shade: 1.0 }]
  };
}

/* ---------------------------------------------------------------------
   mobileBench(view)

     view.states    { glass: "ok"|"suspect"|"faulty"|"danger"|"na", ... }
     view.swollen   is the cell swollen
     view.cracked   is the glass cracked
     view.healthPct battery health, 0-100
   --------------------------------------------------------------------- */
/* HOW TALL A PRIMITIVE ACTUALLY IS ONCE IT IS TIPPED.

   The focused view centres a layer on its own bounding box, and getting
   this wrong is how the first attempt put the panel two thirds of a unit
   under the camera. Half the panel's parts are tipped — the driver film
   folds under the glass, the polariser's corner is peeled back — and
   neither "use size[1]" nor "use the longest side" is the height of a
   tipped sheet. The first is too small and puts an edge off the frame;
   the second was too big by 0.46 on the panel, which is what the height
   arm of checkTheFocusedViewIsWorthLookingAt reported.

   So it is the real thing: the middle row of the XYZ Euler matrix that
   scene.js builds from `rot`, dotted with the half-sizes. Part-level
   rotation is not folded in because no part on this bench carries one;
   if one ever does, this is where it goes. */
function yHalfExtent(q) {
  const s = q.size;
  const hx = s[0] / 2;
  const hy = (s[1] === undefined ? s[0] : s[1]) / 2;
  const hz = (s[2] === undefined ? s[0] : s[2]) / 2;
  const rx = (q.rot && q.rot[0]) || 0, ry = (q.rot && q.rot[1]) || 0,
        rz = (q.rot && q.rot[2]) || 0;
  if (!rx && !ry && !rz) return hy;
  const c1 = Math.cos(rx), s1 = Math.sin(rx),
        c2 = Math.cos(ry), s2 = Math.sin(ry),
        c3 = Math.cos(rz), s3 = Math.sin(rz);
  return Math.abs(c1 * s3 + s1 * s2 * c3) * hx +
         Math.abs(c1 * c3 - s1 * s2 * s3) * hy +
         Math.abs(s1 * c2) * hz;
}

export function mobileBench(view) {
  view = view || {};
  const st = view.states || {};
  const swollen = !!view.swollen;

  /* A swollen cell lifts everything above it. This is the whole reason
     the fault is findable without opening anything. */
  const lift = swollen ? 0.85 : 0;

  const parts = [];

  /* Which layers are showing their SECOND photograph. The panel switches
     on whether it has failed; the cell switches on whether it is swollen,
     which is a different question from whether it is the fault — a swollen
     cell is a safety gate and it is true whatever else is wrong. */
  function altFor(key) {
    if (key === "lcd") return (st.lcd || "na") === "faulty";
    if (key === "battery") return swollen;
    return false;
  }

  /* ------------------------------------------------------------------
     THE PHONE AS IT CAME IN, BEFORE ANYBODY OPENED IT.

     The bench has only ever drawn the stack EXPLODED, and the first
     stage of the mobile lab is the customer handing the device over. A
     student meeting that stage was shown a phone already in seven
     pieces, or — until now — no phone at all.

     `exploded: false` collapses the same layers into the assembled
     handset: no fan, and the gap between layers drops from the 1.45 the
     exploded view needs to the layer's own thickness. It is the SAME
     geometry. Nothing is redrawn and nothing is hidden; the parts inside
     are simply inside, the way they are in a phone on a desk.

     Two things this is deliberately NOT:

       it is not a photograph of a phone — that was the billboard the
         whole rebuild exists to get away from;
       and it is not a second model — a second model is a second thing
         to keep in step, and this build has been bitten by that
         (`BUILD` had four layers defined twice and the later one won).

     ASSEMBLED IS THE DEFAULT NOWHERE. Every existing caller gets the
     exploded view unchanged, because `exploded` defaults true. Only the
     brief stage asks for the closed phone, and it asks explicitly. */
  const exploded = view.exploded !== false;

  /* WHAT YOU CAN ACTUALLY SEE ON A CLOSED PHONE, and why the rest is not
     drawn rather than drawn and hidden.

     The first cut collapsed all seven layers and the handset came out
     41 mm thick — five times life. Measuring each layer said why: the
     midframe is 36 mm in this model and the panel module 28 mm, both
     drawn far thicker than life SO THAT THEY READ when the stack is
     exploded. That exaggeration is correct for the view it was made for
     and wrong for this one, and squashing it would distort every part.

     So the closed phone draws its OUTSIDE: the back cover, the frame the
     student sees as the band round the edge, the cover glass, and what
     the screen is showing through it. The battery, board and backlight
     are not hidden inside — they are simply not drawn, because a phone
     on a desk does not show them and drawing them would only push the
     shell apart.

     FILTERING LAYERS WAS NOT ENOUGH, and measuring said so: keeping only
     back, midframe, panel and glass still gave 41 mm, because the two
     that are exaggerated are exactly the two you would keep. So the
     closed phone is built from the THREE parts that are genuinely its
     outside — the back cover, a frame band, and the cover glass — and
     the frame band is the only new geometry in it.

     THE GLASS IS THE SAME BUILDER, and that is the part that matters.
     `BUILD.glass(y, cracked, bonded)` carries the fracture, so the crack
     a student sees on the closed phone at stage one is the same geometry
     they see on the exploded stack at stage two. A second crack drawn a
     second way is the duplication this build has been bitten by before,
     and it would be the duplication that mattered most: the fracture is
     the thing being taught. */
  const CLOSED = { back: 0, frame: 0.30, glass: 0.62 };

  const stack = exploded ? layersFor(view.panel) : [];
  /* A swollen cell lifts everything ABOVE the battery. Which layers those
     are depends on the stack, so it is asked of the stack rather than
     compared against a hard-coded height that stopped being right the
     moment the logic board went in between them. */
  /* The closed phone does not draw the cell at all, so there is no
     battery height to lift things above. Infinity means "nothing is above
     it", which is right: on a closed handset a swollen cell shows by
     bowing the back cover, and that is the back cover's own business. */
  const batteryRow = stack.filter(function (L) { return L.key === "battery"; })[0];
  const batteryAt = batteryRow ? batteryRow.y : Infinity;

  /* WHICH LAYER EACH PART BELONGS TO, recorded as the parts are made
     rather than guessed from the key afterwards. `focus` below shows one
     layer on its own, and working that out from key prefixes would have
     meant a second list of naming conventions kept in step with this one
     by hand — the failure mode this build has hit before. Here the loop
     that creates a part is the thing that says whose it is. */
  const OWNER = {};

  stack.forEach(function (L) {
    const from = parts.length;
    const y = L.y + (L.y > batteryAt ? lift : 0);
    /* The fan offset, applied through the part's own pos so every
       primitive in the layer moves together and nothing has to know. */
    const at = [L.x, 0, L.z];
    const state = st[L.key] || "na";
    const K = LOOK[state] || LOOK.na;

    parts.push({
      key: "layer-" + L.key,
      label: L.label,
      build: L.key === "battery" ? BUILD.battery(y, swollen)
           : L.key === "glass"   ? BUILD.glass(y, !!view.cracked, view.panel === "oled")
           : BUILD[L.key](y),
      finish: LFINISH[L.key] || "plastic",
      /* THE SURFACE SYSTEM THIS BENCH NEVER USED.

         `surface.js` carries procedural painters — pcb, brushed,
         anodised, moulded, label — and this bench declared none of them.
         Nor did eleven of the thirteen benches in the build: only the
         wear bench, the one written to the density the owner asked for,
         ever passed a `skin`. Every other model has been flat paint on
         primitives while a whole layer of the engine sat unused, and that
         gap is most of the distance between these renders and a
         photograph.

         So each layer now declares the surface it actually has: a board
         gets glass weave, ground pour and traces; a midframe gets the
         machining marks of an anodised casting; a pouch cell gets rolled
         foil; a back cover gets the moulding texture. Glass and the
         optical films get none, because they have none. */
      skin: LSKIN[L.key] || null,
      scale: 1, pos: at,
      /* THE SWOLLEN CELL IS THE SAME COLOUR AS THE GOOD ONE.

         It used to go brown when it swelled, which is a signal the
         hardware does not carry: the owner's photograph has the two
         pouches side by side and they are indistinguishable but for the
         shape. Teaching a colour tell here would send a student past a
         dangerous cell that looked normal. The dome does the work, and
         the pip and the words beside it carry the verdict — the same
         division of labour as every other bench in this build.

         The midframe went the other way, to the dark graphite it is in
         the teardown shot, which also keeps it clear of the foil beside
         it: one colour per part is not enough when two large neighbours
         land on the same value. */
      color: LCOLOR[L.key],
      spec: L.key === "battery" && swollen ? "Domed — gas inside the pouch" : L.says,
      note: ""
    });

    /* WHAT THE PANEL IS SHOWING, as its own part.

       The cracked-glass photograph's entire lesson is that the glass is in
       pieces and the picture is still running. Drawn on the panel itself
       it could not say that — a panel is one colour, and "lit" and "dead"
       would have been the same rectangle. Split out, a dead panel simply
       has no image, which is exactly the observation the torch test in the
       display lab turns on: a dark screen with a faint image under a torch
       is the BACKLIGHT; a dark screen with nothing under it is the PANEL.

       Off by default only when the panel itself is the failure. A cracked
       cover glass leaves it running, and that is the point. */
    if (L.key === "battery" && !DECAL_ON.battery) {
      /* WHAT THE LABEL SAYS, AND WHERE THE WORDS COME FROM.

         The lines are the SCENARIO's, not the bench's. The lab generates a
         design capacity and then asks the student to divide the current
         capacity by it; a label printing its own invented figure would put
         the evidence and the answer on opposite sides of one screen — the
         failure this build has had before, with a drive label and a ticket
         that disagreed. checkTheLabelAgrees holds Wh against V times Ah so
         the two can never drift apart.

         The fallback is for previews and for any caller mounting this
         bench without a ticket behind it. It is a complete, correct label
         rather than placeholder text: a bench that renders "TBC" at a
         student is worse than one that renders a real part. */
      const C = view.cell || { model: "L-19-AB42", chem: "Li-ion Polymer", mah: 4500,
                               volts: 3.87, chargeV: 4.40, wh: 17.4, lot: "LOT 2408 / B3" };
      parts.push({ key: "battery-label", label: "Cell label",
        build: BUILD.batteryLabel(y, swollen), finish: "matte",
        skin: { kind: "cellFace", lines: [
          C.model,
          C.chem,
          C.mah + " mAh    " + C.wh.toFixed(1) + " Wh",
          "Nominal " + C.volts.toFixed(2) + " V",
          "Charge limit " + C.chargeV.toFixed(2) + " V",
          C.lot
        ] },
        scale: 1, pos: at, color: "#ffffff",
        spec: swollen
          ? "Same part number, same capacity, same everything \u2014 read it"
          : C.model + "  \u00b7  " + C.mah + " mAh / " + C.wh.toFixed(1) + " Wh at " +
            C.volts.toFixed(2) + " V",
        note: "Read it \u2014 every line is there for a reason a technician uses. The PART NUMBER " +
          "is the only thing that identifies this cell and it is what you order by. " +
          "\u201cPolymer\u201d is why it is a pouch, and why it domes instead of splitting. The " +
          "capacity is printed BOTH ways because watt-hours are what you calculate with: " +
          "Wh = volts \u00d7 amp-hours, so " + C.mah + " mAh at " + C.volts.toFixed(2) + " V is " +
          C.wh.toFixed(1) + " Wh \u2014 the sum is sitting on the part. NOMINAL " +
          C.volts.toFixed(2) + " V is an average across the discharge, not a maximum, which is " +
          "why a full cell reading " + (C.chargeV - 0.05).toFixed(2) + " V is FULL and not " +
          "overcharged; the limit is the line below it. The crossed-out wheelie bin means it " +
          "does not go in a bin. And a spare in a bag on a flight is fine at " +
          C.wh.toFixed(1) + " Wh \u2014 the airline limit is 100 Wh, which is why laptop packs " +
          "stop at 99. On a swollen cell every one of these lines reads exactly the same as on " +
          "a good one: nothing printed on a battery tells you it has failed. The shape does." });
      parts.push({ key: "cell-pcm", label: "Protection board and thermistor",
        build: BUILD.cellProtection(y), finish: "plastic", skin: "pcb", scale: 1, pos: at,
        color: "#2f6b4e",
        spec: "The cell's tabs are WELDED to this — it is not optional",
        note: "A phone battery is a cell plus this board, and the board is why a lithium pack " +
          "can be handled at all. The FET pair cuts the pack off at over-charge, " +
          "over-discharge and over-current, and the fuse is the one-shot backstop behind it. " +
          "So a pack reading zero volts is very often protection that has TRIPPED rather than " +
          "a dead cell \u2014 check before you condemn. The bead on two leads is the thermistor, " +
          "and it sits against the CELL rather than on the board because it is the cell's " +
          "temperature that matters. That is your third pin: the connector is three-way, not " +
          "two. And those tabs are ULTRASONICALLY WELDED. Soldering a cell tab puts enough " +
          "heat into the cell to damage the separator inside it." });
      parts.push({ key: "cell-tape", label: "Kapton over the tab welds",
        build: BUILD.cellTape(y), finish: "plastic", scale: 1, pos: at,
        color: "#b5791f",
        spec: "Amber polyimide film, taped across both welds",
        note: "The \u201cdo not short these\u201d marker on every pack ever made, and the thing you " +
          "lift to inspect a weld. The two tabs are about three millimetres apart and a cell " +
          "shorted across them vents \u2014 which is why this film goes back on before the cell " +
          "does. It is amber because polyimide is amber; that is how you find it." });
      parts.push({ key: "cell-pull", label: "Stretch-release pull tabs",
        build: BUILD.cellPull(y), finish: "rubber", scale: 1, pos: at,
        color: "#33393f",
        spec: "Two strips under the cell, grab ends past the foot",
        note: "This is the removal procedure, and it is the step people get wrong. Pull them " +
          "SLOWLY and STRAIGHT and the cell lifts out clean. Pull at an angle, or fast, and " +
          "they snap \u2014 and then you are prising a lithium pouch out of a frame with a " +
          "plastic card, which is how cells get punctured. One is drawn already started so " +
          "you can see the strip runs the whole length underneath." });
    }
    /* THE GOLD ANTENNA WIRE & CONNECTOR, its own part.

       The owner's diagram gives it its own label and its own leader line
       — the only feature on the midframe it names. Drawn inside the
       midframe part it took the midframe's aluminium colour and there was
       nothing gold about it, which is the one thing that identifies it.
       Its own part, so it can be the colour it actually is. */
    /* A PHOTOGRAPHED LAYER DOES NOT ALSO GET ITS DRAWN DETAIL.

       The first mount left both: the board's steel cans, its connectors
       and its gold pads were still being drawn ON TOP of a photograph of a
       board that already has all three in it. The picture was buried under
       a worse copy of itself, and nothing errored.

       So where a decal covers a layer, the primitives it replaces come
       off. What stays is anything the photograph cannot carry — the flex
       cable running off the panel's edge, the pips, the frame of the glass
       — because those are geometry rather than surface. */
    if (L.key === "midframe" && !DECAL_ON.midframe) {
      parts.push({ key: "charge-port", label: "USB-C charge port",
        build: BUILD.midframePort(y), finish: "metal", skin: "steel", scale: 1, pos: at,
        color: "#6f777e",
        spec: "Drawn steel shell on its own daughterboard, tongue in the bore",
        note: "The ends are half-circles, which is why a C plug goes in either way up \u2014 " +
          "there are contacts down both faces of the tongue. That tongue is what snaps when " +
          "somebody trips over the lead, and a snapped tongue is a port replacement, not a " +
          "cable. It is usually on its own small board, so on most handsets this is one of " +
          "the cheapest repairs in the phone. Check for lint packed in the bore before you " +
          "condemn it: a port that will not seat is far more often dirty than broken." });
      parts.push({ key: "antenna-breaks", label: "Antenna break inserts",
        build: BUILD.midframeBreaks(y), finish: "plastic", skin: "moulded", scale: 1, pos: at,
        color: "#2c3238",
        spec: "Moulded plastic, set into gaps cut right through the alloy rim",
        note: "The metal frame IS the antenna, and it only radiates because it is cut. These " +
          "four inserts are the feed gaps, not trim. Crush one refitting a screen, or fit a " +
          "replacement frame without them, and the phone comes back with no signal and nothing " +
          "else wrong with it \u2014 which is one of the hardest faults on this bench to find." });
      parts.push({ key: "charge-coil", label: "Wireless charging coil",
        build: BUILD.midframeCoil(y), finish: "metal", skin: "brushed", scale: 1, pos: at,
        color: "#b07a3c", glow: 0.10,
        spec: "Flat spiral of enamelled copper on a ferrite sheet",
        note: "Seven turns wound flat, on a ferrite sheet that keeps the field out of the board " +
          "behind it. It charges through glass and plastic and not through metal, which is why a " +
          "handset with a metal back has no wireless charging and why a thick case can stop it " +
          "working on one that does." });
      parts.push({ key: "antenna-coax", label: "Coaxial antenna leads",
        build: BUILD.midframeCoax(y), finish: "plastic", scale: 1, pos: at,
        color: "#1b2026",
        spec: "Shielded cable, clipped down along the frame",
        note: "Round shielded cable, not a painted stripe \u2014 it can be traced from the board " +
          "out to the frame, and it can be pinched, which is the other half of a no-signal " +
          "repair. The tabs hold it clear of the screen when the phone is closed up." });
      parts.push({ key: "antenna-gold", label: "Gold antenna wire and connector",
        build: BUILD.midframeGold(y), finish: "metal", scale: 1, pos: at,
        color: "#d6ad4a", glow: 0.30,
        spec: "Coaxial leads, snapped onto gold pads",
        note: "These carry the radio signal from the board out to the antenna in the frame. " +
          "The connectors snap on with a click and come off just as easily \u2014 one knocked " +
          "loose during a screen replacement is a \u201cno signal since the repair\u201d, and " +
          "everything else about the phone will test perfect while you look for it." });
    }
    /* The board's other three materials, riding on the same fan offset. */
    /* THE OWNER'S OWN REFERENCE, ON THE LAYER.

       Every layer named in DECAL_ON carries a sheet of the owner's picture
       of that part, mapped once. It rides on the same fan offset as the
       layer, sits just proud of its top face, and is built to the
       picture's own proportions rather than the part's.

       The glass only gets its one when the glass is actually broken: on a
       whole handset the frame stays open and the panel below is seen
       through it, which is the thing that arrangement exists to show. */
    /* A FLAT PHOTOGRAPH CANNOT LIE ON A DOMED SURFACE.

       The swollen cell is the one layer where the geometry is not flat:
       it crowns, deliberately and checkably, because that dome is the
       whole tell. A flat photo plate laid on top of it reads as a card
       resting on a pillow — worse than no photograph at all.

       So the healthy cell carries its picture and the swollen one does
       not; its state is carried by the geometry, which is measured, and
       by the pip and the words, which say what to do about it. The
       swollen photograph is still in tiles.js and still the better image
       — it needs somewhere flat to live, and that is a decision for the
       owner rather than something to invent here. */
    const domed = L.key === "battery" && swollen;
    if (DECAL_ON[L.key] && !domed && (L.key !== "glass" || view.cracked)) {
      const PH = {
        back:      ["The back cover, photographed", 0.14,
                    "Camera island, flash, fingerprint reader",
                    "The outside of the phone. Three lenses in a raised island, the flash beside " +
                    "them and the fingerprint reader below \u2014 which is how you tell one model " +
                    "from another before you have opened anything."],
        glass:     ["The top glass, photographed", 0.09,
                    "Fractured, off the phone",
                    "The fracture radiates from one impact point, with the concentric rings an " +
                    "impact leaves and the crushed knot at the centre. The touch layer is bonded " +
                    "inside this same piece, which is why it is a whole screen assembly and not " +
                    "a pane of glass."],
        polariser: ["The adhesive and polariser, photographed", 0.06,
                    "Nearly clear film",
                    "Almost nothing to look at, which is the point: it is what bonds the glass to " +
                    "the panel, and the reason they cannot be separated on a bench."],
        /* 0.58, NOT 0.13. The panel used to be one slab and 0.13 sat just
           above its face; it is a five-sheet module now and 0.13 is
           somewhere inside the liquid crystal. The lift is measured off
           PANEL_Y.front, which is the top of the stack, plus clearance. */
        lcd:       state === "faulty"
                   ? ["The panel, photographed \u2014 dead", 0.58,
                      "Disconnected, and black",
                      "An OLED with no power is black. There is no backlight behind it to leak " +
                      "light round the edges, which is the whole difference from an LCD and the " +
                      "reason the torch test does not work on one."]
                   : ["The panel, photographed \u2014 working", 0.58,
                      "Powered, and drawing a picture",
                      "This is the state that decides the repair. A display running perfectly " +
                      "under a shattered cover glass is a glass job; the same phone with this " +
                      "black is a panel, and the two are very different money. Both states here " +
                      "are photographs of the real thing rather than a drawing of one."],
        midframe:  ["The midframe, photographed", 0.24,
                    "Aluminium alloy casting",
                    "Everything bolts to this: the heat spreader across the middle, the antenna " +
                    "runs down the edge, the charge port at the bottom."],
        board:     ["The board, photographed", 0.16,
                    "Teal laminate, shield cans, edge connectors",
                    "The crowding is what makes a board recognisable as one. Every dark block is " +
                    "a can over a section of it, and taking those off is the first thing anybody " +
                    "does to work on one."],
        battery:   swollen
                   ? ["The cell, photographed \u2014 swollen", 0.70,
                      "Pillowed. Do not press, puncture or charge it.",
                      "The laminate has lifted in the middle and the label is bending over the " +
                      "rise instead of lying flat. That is the tell, and it is a SHAPE: a " +
                      "swollen cell is not a different colour and not a bigger rectangle. " +
                      "Nothing printed on a battery ever tells you it has failed."]
                   : ["The cell, photographed", 0.70,
                    "L-19 Li-ion, 12.6 Wh, 3.8 V",
                    "Read the label: that is what you order the replacement by, and the watt-hours " +
                    "on it are where a runtime calculation starts. A pouch cell is laminate over a " +
                    "stack of layers with a seal weld round the edge - nothing about it is rigid, " +
                    "which is why it domes rather than splits when it fails."]
      }[L.key];
      parts.push({ key: L.key + "-photo", label: PH[0],
        build: BUILD.photoPlate(L.key, y, PH[1], altFor(L.key)),
        finish: L.key === "glass" ? "glass" : "matte",
        skin: (altFor(L.key) && DECAL_ON[L.key].dead)
              ? DECAL_ON[L.key].dead : DECAL_ON[L.key].tile,
        scale: 1, pos: at, color: "#ffffff",
        spec: PH[2], note: PH[3] });
    }
    if (L.key === "back" && !DECAL_ON.back) {
      parts.push({ key: "cover-bands", label: "Antenna band seams",
        build: BUILD.backBands(y), finish: "plastic", skin: "moulded", scale: 1, pos: at,
        color: "#cfc7ba",
        spec: "Moulded across the shell, in line with the breaks in the frame",
        note: "These line up with the four plastic inserts cut into the midframe rim, so you " +
          "can see the same feature from both sides: the frame is cut, and the cover is " +
          "moulded round the cut. On a phone with a metal back these seams are the antenna " +
          "gaps themselves; on a plastic or glass one they are cosmetic, and knowing which " +
          "you are holding tells you whether a dropped phone's signal problem is structural." });
      parts.push({ key: "cover-adhesive", label: "Perimeter adhesive gasket",
        build: BUILD.backAdhesive(y), finish: "rubber", skin: "rubber", scale: 1, pos: at,
        color: "#2f3a45",
        spec: "A continuous strip round the whole edge, under the cover",
        note: "This is why a back comes off with HEAT and a suction cup and not with a prise: " +
          "the strip softens, it does not shear. It is also the water seal. Refit a cover " +
          "without replacing it and the phone looks perfect, works perfectly, and is no " +
          "longer water resistant \u2014 which the customer finds out the expensive way. Always " +
          "quote a new gasket with a back-off job." });
      parts.push({ key: "cover-print", label: "Regulatory print and model number",
        build: BUILD.backPrint(y), finish: "plastic", skin: "label", scale: 1, pos: at,
        color: "#e8ecef",
        spec: "Printed on the shell, not a label",
        note: "Model number, IMEI and the certification marks. This is what you read to order " +
          "the right part, and what a customer is asked for over the phone. It is PRINTED on " +
          "\u2014 a stick-on label here means somebody has been inside already." });
    }
    if (L.key === "backlight") {
      parts.push({ key: "light-guide", label: "Light guide plate",
        build: BUILD.backlightGuide(y), finish: "glass", scale: 1, pos: at,
        color: "#cfd8dd",
        spec: "Clear acrylic, thicker than everything above it",
        note: "The LEDs fire into its EDGE and this turns the light through ninety degrees to " +
          "face the panel \u2014 there is nothing behind the screen. The dots printed on it get " +
          "denser the further they are from the LEDs, because the far end has less light left " +
          "to work with. Crush a corner of this and you get a dark patch that no brightness " +
          "setting will fix, and no amount of replacing the panel either." });
      parts.push({ key: "led-strip", label: "LED strip and its power lead",
        build: BUILD.backlightLeds(y), finish: "plastic", skin: "pcb", scale: 1, pos: at,
        color: "#e6e9ea", glow: 0.55,
        spec: "A white board of LEDs firing sideways into the edge of the guide",
        note: "The light comes in at the EDGE and the guide plate turns it through ninety " +
          "degrees \u2014 there is nothing behind the screen. And this runs on its own two wires, " +
          "separate from the panel's data: a perfect picture with no light, and light with no " +
          "picture, are two different faults on two different circuits. That is the whole " +
          "reason the torch test works, and an OLED has none of this at all." });
    }
    if (L.key === "glass") {
      parts.push({ key: "touch-controller", label: "Touch controller board",
        build: BUILD.digitizerController(y), finish: "plastic", skin: "pcb", scale: 1, pos: at,
        color: "#2f6b4e",
        spec: "A separate green board on the end of the sensor's own flex",
        note: "Touch has its own controller, and it is not on the display flex. That is why a " +
          "screen can show a perfect picture and not respond to a finger at all \u2014 the panel " +
          "is fine and this, or the bond to it, is not. On an LCD it comes with the digitizer; " +
          "on a bonded OLED assembly you cannot buy it separately at all." });
      parts.push({ key: "touch-gold", label: "Sensor bond and controller pads",
        build: BUILD.digitizerGold(y), finish: "metal", scale: 1, pos: at,
        color: "#d6ad4a", glow: 0.25,
        spec: "Gold, at both ends of the sensor's flex",
        note: "Every row and column of the grid ends up here. The fan-out necks four hundred " +
          "traces down into a bond a centimetre wide, and a crack across it takes out a stripe " +
          "of the touch area rather than the whole screen \u2014 which is the tell: dead in a BAND " +
          "is the bond, dead ALL OVER is the controller." });
    }
    if (L.key === "lcd") {
      parts.push({ key: "lcd-tray", label: "Panel backing tray",
        build: BUILD.lcdTray(y), finish: "metal", skin: "brushed", scale: 1, pos: at,
        color: "#8f979e",
        spec: "Pressed metal, bonded to the back of the glass",
        note: "The panel is bonded onto this, which is what makes a display assembly stiff " +
          "enough to handle. Its lip runs round three sides only — the fourth is open for " +
          "the driver film — so a screen comes out from that end. Prise at a lipped corner " +
          "and the glass goes before the adhesive does." });
      parts.push({ key: "lcd-driver", label: "Display driver IC on its film",
        build: BUILD.lcdDriver(y), finish: "plastic", scale: 1, pos: at,
        color: "#4a5158",
        spec: "Chip-on-film, bonded to the panel edge and folded under",
        note: "This drives the columns. Vertical bands, a dead stripe or a colour cast across " +
          "part of the picture is this chip or its bond — not the cable and not the panel, " +
          "and it is not separately replaceable, which is why that symptom is a whole-assembly " +
          "job. It is bonded on: there is no connector here to reseat." });
      parts.push({ key: "lcd-gate", label: "Gate driver on the side ledge",
        build: BUILD.lcdGate(y), finish: "plastic", scale: 1, pos: at,
        color: "#3b444d",
        spec: "Built onto the glass itself, down one long edge",
        note: "This one switches the ROWS, and the chip at the bottom edge drives the COLUMNS. " +
          "So the direction of the fault names the part: vertical bands or a dead column is " +
          "the bottom driver, horizontal bands or a dead row is this one. On most phone " +
          "panels it is built straight onto the glass rather than bonded on as a separate " +
          "chip, which is exactly why neither can be replaced on its own." });
      parts.push({ key: "lcd-filter", label: "Colour filter glass",
        build: BUILD.lcdFilter(y), finish: "glass", skin: "subpixel", scale: 1, pos: at,
        color: "#ffffff",
        spec: "The upper sheet — red, green and blue stripes in a black matrix",
        note: "Go in close on this one. Every pixel is THREE stripes of dyed filter with an " +
          "opaque grid between them, and each stripe has its own transistor on the sheet " +
          "underneath — which is what the T, F and T in TFT stand for. That grid is why a " +
          "switched-off LCD is dark grey and not the colour of its own backlight, and it is " +
          "why a single dead pixel is a dead transistor: there is nothing there to reach." });
      parts.push({ key: "lcd-pol", label: "The two polarisers, crossed",
        build: BUILD.lcdPolarisers(y), finish: "matte", scale: 1, pos: at,
        color: "#3d4348",
        spec: "One under the panel, one over it, axes at ninety degrees",
        note: "Look at the two hatchings: they run at right angles to each other, and that is " +
          "the whole mechanism of an LCD. Light through the bottom film would be stopped dead " +
          "by the top one — unless the liquid crystal between them twists it on the way, which " +
          "is what a voltage on a pixel changes. It is also why a phone screen goes black " +
          "through polarised sunglasses at one angle: you are holding up a third filter." });
    }
    if (L.key === "board") {
      parts.push({ key: "board-shields", label: "Shield cans and mounting screws",
        build: BUILD.boardShields(y), finish: "metal", skin: "steel", scale: 1, pos: at,
        color: "#aab1b7",
        spec: "Bare steel, snapped onto their fences",
        note: "Each can covers a section of the board and is the first thing off when anybody " +
          "works on it. The fence of clips round the outside stays behind — which is how you " +
          "know a can was there and where it went back." });
      parts.push({ key: "board-conn", label: "Connectors and the SIM reader",
        build: BUILD.boardConnectors(y), finish: "plastic", scale: 1, pos: at,
        color: "#22272d",
        spec: "Black plastic bodies with lift latches",
        note: "The battery connector is the first thing you disconnect on any job inside a " +
          "phone and the last thing you reconnect. Every one of these has a fragile latch and " +
          "every one of them gets broken by somebody in a hurry." });
      parts.push({ key: "board-gold", label: "Antenna feed pads and contacts",
        build: BUILD.boardGold(y), finish: "metal", scale: 1, pos: at,
        color: "#d6ad4a", glow: 0.25,
        spec: "Gold-plated, and small",
        note: "The coaxial antenna leads snap onto these. One knocked off during a screen " +
          "replacement is a \u201cno signal since the repair\u201d that costs an afternoon to " +
          "find, because everything else about the phone is perfect." });
    }
    if (L.key === "lcd") {
      const dead = state === "faulty";
      /* THE DRAWN MAP IS GONE. The panel carries a photograph of the real
         one now — `oledPanelFlat`, cut face-on from the owner's own flat
         layout — and two pictures of the same screen on the same part
         would have fought each other. What is kept is the DEAD state
         below, because the reference shows a disconnected panel and there
         is no photograph of a failed one. */
      if (!dead) {
        /* nothing: the decal is the picture */
      } else {
        parts.push({ key: "lcd-image", label: "What the panel is showing",
          build: [{ shape: "rbox", size: [PW - 1.15, 0.03, PD - 1.15], pos: [0, y + 0.13, 0],
                    r: 0.16, shade: 1.0 }],
          finish: "matte", scale: 1, pos: at, color: "#0f1319",
          spec: "Nothing on it",
          note: "Dead black, with the backlight behind it working. Shine a torch at it and no " +
            "faint image appears — which is what separates a failed panel from a failed " +
            "backlight, and they are very different money." });
      }
    }
    parts.push({ key: "well-" + L.key, label: L.label + " indicator surround",
      build: pipWell(y), finish: "matte", scale: 1, pos: at,
      color: "#14181c", spec: "", note: "" });
    parts.push({ key: "pip-" + L.key, label: L.label + " status",
      build: pip(y), finish: "plastic", scale: 1, pos: at,
      color: K.color, glow: K.glow, spec: K.says, note: K.says });
    for (let i = from; i < parts.length; i++) OWNER[parts[i].key] = { layer: L.key, y: y, at: at };
  });

  /* ------------------------------------------------------------------
     A FEW LAYERS, ON THEIR OWN, CLOSE ENOUGH TO READ.

     The exploded stack is the right picture for "which layer", and it is
     the wrong picture for "which PART of that layer" — at the distance
     that fits seven layers on a phone screen, the gate driver on the side
     ledge is four pixels of dark grey. The parts stage needs the same
     geometry with the other layers taken away and the camera brought in.

     `focus` takes a layer key OR A LIST OF THEM, and the list is not a
     convenience — IT IS WHAT STOPS THE BENCH ANSWERING THE QUESTION.

     The panel-parts stage offers eight candidates: six live on the LCD
     layer and two — the light guide and the LED strip — live on the
     backlight under it. The first cut picked whichever layer held the
     right answer and focused that. Which means the picture told the
     student which HALF the answer was in before they read a word: pick
     the backlight and the field is two, pick the panel and it is six.
     That is this build's oldest rule broken by the newest code — "a
     bench must never show the answer" — and it was written by the same
     person who wrote the rule down.

     So the stage asks for both, and both is also the truer picture: a
     display module IS the panel and the light behind it, and telling
     those two apart with a torch is the spine of the Display lab.

     WHAT IS UNDONE, AND WHAT IS DELIBERATELY NOT. The layers' heights
     collapse onto the group's own bounding box, so the assembly sits
     where the camera is aimed. The fan offset is only re-CENTRED, never
     zeroed: zeroing it would stack the backlight squarely beneath a
     panel of the same size, which is the occlusion this whole bench is
     arranged to design out. Their spread relative to each other is the
     thing that lets you see there are two.

     THE HEIGHT COMES OFF THE BOUNDING BOX, NOT OFF THE LAYER'S y. That
     was the first attempt and the invariant below caught it: a layer's
     nominal y is where its BOARD sits, and its parts are hung off that in
     both directions — the panel's backing tray hangs below the glass, so
     subtracting y left the whole assembly centred two thirds of a unit
     under a camera aimed at the origin. Same class of mistake as the six
     others this build has had: arithmetic that reads as correct beside
     geometry the arithmetic does not know about. Measure the parts.

     There is no board under it either. A 20-unit ground plane behind a
     part 6 units wide is most of the frame, and fitWidth would then be
     framing the bench furniture rather than the thing being taught.
     ------------------------------------------------------------------ */
  if (view.focus) {
    const want = [].concat(view.focus);
    const F = want.map(function (k) {
      const L = stack.filter(function (M) { return M.key === k; })[0];
      if (!L) throw new Error('bench-mobile: focus "' + k + '" is not a layer of this ' +
        (view.panel === "oled" ? "OLED" : "LCD") + " stack.");
      return L;
    });
    const mine = parts.filter(function (p) {
      const o = OWNER[p.key];
      return o && want.indexOf(o.layer) >= 0 &&
        p.key.indexOf("pip-") !== 0 && p.key.indexOf("well-") !== 0;
    });
    if (!mine.length) throw new Error('bench-mobile: focus "' + want.join("+") + '" has no parts.');
    let lo = Infinity, hi = -Infinity;
    mine.forEach(function (p) {
      p.build.forEach(function (q) {
        const h = yHalfExtent(q);
        lo = Math.min(lo, p.pos[1] + q.pos[1] - h);
        hi = Math.max(hi, p.pos[1] + q.pos[1] + h);
      });
    });
    const drop = -(lo + hi) / 2;
    /* Re-centre the fan on the group rather than throwing it away. */
    const midX = F.reduce(function (a, L) { return a + L.x; }, 0) / F.length;
    const midZ = F.reduce(function (a, L) { return a + L.z; }, 0) / F.length;
    const keep = mine.map(function (p) {
      return Object.assign({}, p, {
        pos: [p.pos[0] - midX, p.pos[1] + drop, p.pos[2] - midZ] });
    });
    const names = F.map(function (L) { return L.label; });
    return {
      kind: "bench",
      title: names.join(" and ") + ", out of the stack",
      caption: names.join(" and ") + " lifted out and turned up to the light. Every part is in " +
        "the same place it sits in the assembled phone — this is the same model with the other " +
        "layers taken away, not a diagram of it. Nothing here is marked: the light behind the " +
        "panel is shown because it is part of the display, not because the fault is in it.",
      board: null,
      decor: [],
      parts: keep,
      /* fitWidth 26, SWEPT against frustumOK at 319, 480, 697, 889 and
         1100px, not picked — and the first value here was picked, which
         is why this comment is long.

         It was 11, reasoned from the panel being 6.2 units wide, and it
         lost FIVE parts at 319px and two at 1100px. Two things that
         reasoning did not know: the part is 6.2 across and 12.8 DEEP, and
         at yaw 0.42 most of that depth projects into screen width; and
         frustumOK works on bounding SPHERES, so a sheet 6.2 by 12.8 is
         tested at a radius of about 7, not 3.1. Neither is visible in the
         arithmetic. Both are visible the moment you drive it.

         The sweep: a single layer goes clean at 23, the panel and
         backlight together at 23, and this sits one step above at 26 for
         the same reason every other bench in this build does — the sweep
         drives the default view and a bench is at its widest in some
         other state. It costs nothing on a wide canvas, because fitDist
         takes the larger of dist and the fit.

         max is 40, not 26. `max` is how far a STUDENT may orbit out and
         `fitWidth` is a promise about what must be on screen; leaving max
         below the distance the fit needs is the clamp bug that made
         fitWidth inert on eleven benches. It must never be the smaller of
         the two again. */
      camera: { dist: 9.5, fitWidth: 26, yaw: 0.42, pitch: 0.62,
        target: [0, 0.15, 0], min: 3.4, max: 40 }
    };
  }

  /* THE REFERENCE CARD, only when the cell is swollen. */
  if (swollen) {
    parts.push({ key: "card-easel", label: "Reference card stand",
      build: swollenCard(), finish: "matte", scale: 1, pos: [0, 0, 0],
      color: "#2a323b", spec: "", note: "" });
    parts.push({ key: "card-swollen", label: "A swollen cell, photographed",
      build: swollenCardFace(), finish: "matte", skin: "cellSwollenFace",
      scale: 1, pos: [0, 0, 0], color: "#ffffff",
      spec: "The real thing, for comparison",
      note: "This is what the shape on the bench is. The laminate has pillowed \u2014 the middle " +
        "lifts, the surface creases round the rise, and the printed label bends over it instead " +
        "of lying flat. Match the model against this: it is not a colour and it is not a bigger " +
        "rectangle, and nothing printed on a battery ever tells you it has failed. Do not press " +
        "it, do not puncture it, do not charge it." });
  }

  /* Battery health, in two parts so the trough does not take the fill's
     colour — the same split every gauge in this build needs.

     NOT ON THE CLOSED PHONE. The gauge is an INSTRUMENT — a reading taken
     off the device — and the assembled view is the device as the customer
     handed it over, before anybody has read anything off it. Drawing it
     there would put the battery's answer on screen during the stage that
     asks the student what the customer actually said. */
  if (exploded) {
  const hb = healthBar(view.healthPct);
  const worn = (view.healthPct || 100) < 80;
  parts.push({ key: "health-trough", label: "Battery health scale", build: hb.trough,
    finish: "matte", scale: 1, pos: [0, 0, 0], color: "#2a323b",
    spec: "0 to 100 per cent",
    note: "The bright line is 80 per cent. Below it a cell is considered worn out, whatever the " +
      "phone still says about it." });
  parts.push({ key: "health", label: "Battery health", build: hb.fill,
    finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: worn ? "#ffa524" : "#2fd45e", glow: worn ? 1.3 : 0.8,
    spec: (view.healthPct || 0) + " per cent of design capacity",
    note: worn
      ? "Under 80 per cent. The battery is the fault rather than a symptom of one, and no amount " +
        "of settings will bring it back."
      : "Healthy. If this device will not last a day, the battery is not the reason." });
  }

  /* ------------------------------------------------------------------
     THE CLOSED PHONE, framed the way it sits on a desk.

     Face-on and slightly over, which is how the owner's own reference
     photograph is taken and how anybody looks at a handset they have
     just been handed. Not the exploded view's three-quarter angle: that
     one exists to show seven layers apart, and there is one thing here.
     ------------------------------------------------------------------ */
  if (!exploded) {
    const oled = view.panel === "oled";
    /* NOTHING STICKS OUT OF A CLOSED PHONE. That is the whole rule, and
       it is a rule rather than a list of primitives to delete by hand.

       The glass builder ends with the digitizer's flex tail and its
       connector running off the bottom edge — right on the exploded
       stack, where it shows the touch sensor has its own cable, and
       wrong here, where that flex is folded up inside the assembled
       device. Drawn anyway it came out as a grey T hanging under the
       phone, which is what the first render showed.

       Picking those five primitives out by index would work today and
       break the next time somebody edits the glass. The silhouette of a
       closed handset IS its footprint, so anything centred outside the
       footprint is by definition internal, and it goes. */
    const inBody = function (build) {
      return build.filter(function (q) {
        return Math.abs(q.pos[0]) <= PW / 2 && Math.abs(q.pos[2]) <= PD / 2;
      });
    };
    /* The frame band — the only geometry this view adds. It is the side
       wall of the phone between the back cover and the glass, and it is
       what a student is actually looking at edge-on when they are told
       "the frame is cut for the antennas". Four walls, not a slab, so
       the phone has a real edge rather than a painted one. */
    const FW = PW - 0.06, FD = PD - 0.06, FT = CLOSED.glass - CLOSED.frame;
    const band = [
      { shape: "rbox", size: [FW, FT, 0.22], pos: [0, CLOSED.frame + FT / 2, (FD - 0.22) / 2], r: 0.07, shade: 1.0 },
      { shape: "rbox", size: [FW, FT, 0.22], pos: [0, CLOSED.frame + FT / 2, -(FD - 0.22) / 2], r: 0.07, shade: 1.0 },
      { shape: "rbox", size: [0.22, FT, FD - 0.4], pos: [(FW - 0.22) / 2, CLOSED.frame + FT / 2, 0], r: 0.07, shade: 0.92 },
      { shape: "rbox", size: [0.22, FT, FD - 0.4], pos: [-(FW - 0.22) / 2, CLOSED.frame + FT / 2, 0], r: 0.07, shade: 0.92 }
    ];
    parts.push({ key: "shell-back", label: "Back cover",
      build: inBody(BUILD.back(CLOSED.back)), finish: "plastic", skin: LSKIN.back || null,
      scale: 1, pos: [0, 0, 0], color: LCOLOR.back,
      spec: "The shell, still on",
      note: "Nothing has been opened. This comes off with heat and a suction cup, never a prise " +
        "— the adhesive round the edge softens, it does not shear." });
    parts.push({ key: "shell-frame", label: "The frame, edge on",
      build: band, finish: "metal", skin: LSKIN.midframe || null,
      /* NOT LCOLOR.midframe. That colour is the MACHINED INSIDE of the
         tub — bare alloy, which is what the owner's teardown diagram
         shows and what the exploded stack is right to draw. The band a
         student sees on a closed phone is the ANODISED OUTSIDE, and on
         every handset ever made it matches the back rather than shining
         out against it. Drawn in the tub's colour it came out as a thick
         pale bezel and became the loudest thing in the frame, over a
         cracked screen that was the actual subject. */
      scale: 1, pos: [0, 0, 0], color: "#39414a",
      spec: "The band round the edge of the phone",
      note: "The side you hold. The plastic breaks in this band are the antenna gaps, and a " +
        "phone dropped hard enough to bend here will not take a new screen flat." });
    /* WHAT THE SCREEN IS SHOWING, under the glass and before it.
       Drawn BEFORE the glass so the fracture lies over the picture rather
       than under it — which is the entire point of the cracked case, and
       the wrong order would quietly teach the opposite.

       The inset is 0.92 here, not the exploded view's 0.66. That 0.66
       exists to leave the panel module's ledges and stripes showing
       around the picture; on a closed phone there is nothing to leave
       room for and the screen is very nearly the whole face, which is
       what it looks like on a desk. */
    const lcdDead = (st.lcd || "na") === "faulty";
    const screenName = lcdDead && DECAL_ON.lcd.dead ? DECAL_ON.lcd.dead : DECAL_ON.lcd.tile;
    const screenAspect = decalAspect(screenName);
    if (screenAspect) {
      /* MEASURED OFF THE PHONE, not off the layer. The exploded view
         sizes this against the panel's own footprint because there it
         sits on the panel; here it sits behind the COVER GLASS, and what
         a student sees is a modern handset with a 2 mm border. Sized to
         the layer instead it left 5.6 mm of pale glass showing all round
         the picture, which read as a thick white bezel from another
         decade and was the loudest thing in the frame. */
      const availW = PW * 0.94, availD = PD * 0.94;
      let sw = availW, sd = sw / screenAspect;
      if (sd > availD) { sd = availD; sw = sd * screenAspect; }
      parts.push({ key: "shell-screen", label: "What the screen is showing",
        build: [{ shape: "box", size: [sw, 0.03, sd],
                  pos: [0, CLOSED.glass - 0.08, 0], r: 0.02, shade: 1.0 }],
        finish: "matte",
        skin: lcdDead && DECAL_ON.lcd.dead ? DECAL_ON.lcd.dead : DECAL_ON.lcd.tile,
        scale: 1, pos: [0, 0, 0], color: "#ffffff",
        spec: lcdDead ? "Dark — nothing on it" : "Lit, and working",
        note: lcdDead
          ? "Black, and a torch held close shows nothing under it. That is the panel, not the " +
            "backlight and not the glass."
          : "The display is running. Whatever else is wrong with this handset, the panel is " +
            "generating a picture — which rules out a great deal before you open anything." });
    }
    /* THE BLACK INK BORDER, printed on the BACK FACE of the cover glass.

       This is why the picture stops short of the edge on every phone
       ever made, and it is its own part because it is its own colour:
       the glass is a pale near-clear tint and the ink is black, and one
       colour per part means they cannot be the same object. Left out,
       the glass showed pale all round the screen and the handset came
       out with a thick white bezel — the single ugliest thing in the
       first render of this view.

       It sits just under the glass and just over the screen, which is
       where it is printed, so a crack in the glass runs across the ink
       as well as across the picture. */
    /* DRAWN IN FRONT OF THE GLASS, not behind it, and that is a
       concession to the renderer rather than a claim about the part.

       On the real thing this ink is on the glass's BACK face and you see
       it THROUGH the glass. Drawn there it was invisible: this engine's
       "glass" finish is not transparent enough to show what is under it,
       so the pale cover glass went on reading as a thick white bezel.
       Measured off the painted pixels rather than argued about — the
       border sampled #b6bfc5 at luminance 0.74 against a screen it is
       supposed to frame.

       So it sits just proud of the glass, where it LOOKS right, and the
       part's own note says where it really is. The alternative was to
       darken the cover glass, which would have darkened the picture
       under it as well and lost the one thing this view exists to show:
       that the display is still running behind the damage. */
    const inkW = PW * 0.94, inkD = PD * 0.94, inkY = CLOSED.glass + 0.14;
    const exW = (PW - inkW) / 2, exD = (PD - inkD) / 2;
    parts.push({ key: "shell-ink", label: "Printed border on the glass",
      build: [
        { shape: "box", size: [PW, 0.02, exD], pos: [0, inkY, (PD - exD) / 2], r: 0.01, shade: 1.0 },
        { shape: "box", size: [PW, 0.02, exD], pos: [0, inkY, -(PD - exD) / 2], r: 0.01, shade: 1.0 },
        { shape: "box", size: [exW, 0.02, inkD], pos: [(PW - exW) / 2, inkY, 0], r: 0.01, shade: 0.94 },
        { shape: "box", size: [exW, 0.02, inkD], pos: [-(PW - exW) / 2, inkY, 0], r: 0.01, shade: 0.94 }
      ],
      finish: "matte", scale: 1, pos: [0, 0, 0], color: "#0d1116",
      spec: "Printed on the underside of the glass, not on the panel",
      note: "The picture stops short of the edge because this is printed over it. It is on the " +
        "GLASS, so it goes with the glass \u2014 which is why a screen replacement changes the " +
        "border and a panel replacement does not." });
    parts.push({ key: "shell-glass", label: "Cover glass" + (view.cracked ? " — broken" : ""),
      build: inBody(BUILD.glass(CLOSED.glass, !!view.cracked, oled)), finish: "glass",
      scale: 1, pos: [0, 0, 0], color: LCOLOR.glass,
      spec: view.cracked ? "Cracked, and the display under it is still running"
                         : "Intact",
      note: view.cracked
        ? "The glass is in pieces and the picture underneath is perfect. That is the whole " +
          "lesson: a cracked front and a dead display are different parts, and quoting for the " +
          "wrong one is the difference between a job they accept and one they take elsewhere."
        : "Clean. Whatever is wrong with this one, it is not the front." });
    return {
      kind: "bench",
      title: "The handset, as it came in",
      caption: (view.cracked
        ? "The cover glass is broken. Look at what the screen is still DOING underneath it — a " +
          "cracked front and a dead display are different parts and very different money."
        : "Nothing has been opened yet. This is the device as the customer handed it over.") +
        " Open it up when you are ready to look inside.",
      board: {
        size: [20, 0.5, 20], pos: [0, -0.6, 0], color: "#2f3944",
        build: [{ shape: "rbox", size: [20, 0.5, 20], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
        scale: 1
      },
      decor: [],
      parts: parts,
      /* fitWidth 26, AND THE REASON IS THE ONE frustumOK CANNOT TELL YOU.

         Swept first: 17 came back clean at 319, 480, 697 and 889 px, and
         the phone was still visibly cut off top and bottom in the running
         stage. Both were true, because FRUSTUMOK ONLY CHECKS HORIZONTAL
         CLIPPING — it projects each part's bounding sphere and compares
         the x extent against the frame. Nothing in this suite looks at
         the vertical, and until now nothing needed to: every other bench
         is wider than it is deep, framed three-quarter, and runs out of
         width long before height.

         This one is the exception. It is 6.2 across and 12.8 long, seen
         from nearly overhead, so its LENGTH lands on the screen's short
         axis. On a wide canvas the visible height is fitWidth / aspect —
         17 / 1.86 is 9.2 world units against a phone 12.8 long, so the
         ends went off the top and bottom while every check said clean.

         So the number is set from the height instead: 12.8 needs about
         23.8 at the widest aspect this is drawn at, and 26 is the step
         above, consistent with every other bench here. Confirmed by
         looking at the rendered stage, not by the checker that cannot
         see this axis. */
      camera: { dist: 12.0, fitWidth: 26, yaw: 0.16, pitch: 0.92,
        target: [0, 0.3, 0], min: 4.0, max: 40 }
    };
  }

  return {
    kind: "bench",
    title: "The handset, laid out in order" + (view.panel === "oled" ? " (OLED)" : " (LCD)"),
    /* THE CAPTION IS GENERATED, NOT TYPED. It used to spell out the LCD
       order in prose, which becomes a lie the moment an OLED handset is
       drawn — the model would show six layers while the words underneath
       named seven and put a backlight among them. */
    caption: "Bottom to top: " +
      layersFor(view.panel).map(function (L) { return L.label.toLowerCase(); }).join(", ") +
      ". That order is the thing to know before you buy a part." +
      (view.panel === "oled"
        ? " This one is OLED: there is no backlight, because each pixel makes its own light — " +
          "so a screen that stays black is the panel, and the torch test has nothing to tell you."
        : " This one is an LCD, so it has a backlight behind the panel — which is what the " +
          "torch test separates."),
    board: {
      size: [20, 0.5, 20], pos: [0, -0.6, 0], color: "#2f3944",
      build: [{ shape: "rbox", size: [20, 0.5, 20], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
      scale: 1
    },
    decor: [],
    parts: parts,
    /* Targeted at the middle of THIS stack rather than at a fixed height:
       the OLED stack is one layer shorter than the LCD one, and a camera
       aimed at a constant 4.4 framed one of them low and the other high. */
    /* fitWidth 30, AND max RAISED TO 74 BECAUSE ONE WITHOUT THE OTHER DOES
       NOTHING. Measured against frustumOK at the canvas widths the running
       lab actually hands out — 319px on a phone, 480, 697 on a tablet,
       889 on a laptop — not picked.

       The bench is 14.7 units wide in world space and needs 28 of
       fitWidth to clear a 319px canvas, because the field of view is
       VERTICAL: a narrow canvas shows less width at the same distance.
       Without it, seventeen parts crossed the frame edge at 319px and
       five at 480px, and the first thing to go was the battery health
       gauge — on the lab whose safety stage turns on it.

       max is back at 58 and stays there. It had to be raised to 74 by hand
       when this fix went in, because place() clamped the fit by max and
       the distance needed at phone aspect is about 59 — so the clamp ate
       the fix and the bench rendered exactly as broken with fitWidth set
       as without it. That clamp is gone from scene.js now: `max` is how
       far a STUDENT may orbit out, `fitWidth` is a promise about what must
       be on screen, and a promise clamped by an interaction limit is not a
       promise. Every other bench in the build had the same trap. */
    camera: { dist: 29.0, fitWidth: 30, yaw: 0.38, pitch: 0.30,
      target: [-0.6, (stack.length - 1) * GAP / 2, 1.2], min: 11, max: 58 }
  };
}

/* =====================================================================
   THE FOCUSED VIEW HAS TO BE THE WHOLE LAYER, AND IT HAS TO SIT AT ZERO.

   `focus` is the mode the panel-parts stage runs on, and it is built by
   SUBTRACTION — take the whole bench, throw six layers away, undo two
   offsets. Every step of that is a chance to lose something silently. An
   empty scene, a layer still at its stack height four units above a
   camera aimed at the origin, or — the one that would actually have got
   past me — a part that the filter quietly failed to claim. None of
   those throw. All of them render a grey rectangle at a student who is
   being asked to name what is in it.

   Four arms, and they are not doing the same job:

   1. MIN_PARTS. A "parts" view with one part in it is the stack view
      with a longer title, and a stage built on it has nothing to point
      at.

   2. THE PREFIX MAP IS COMPLETE. Arm 3 is only worth as much as the list
      it checks against, so the list is made to account for every part on
      the bench. A new part with a new key prefix fails HERE, loudly, the
      day it is added — instead of silently reducing arm 3 to a check on
      whatever it still happened to know about. This is the arm the first
      version did not have, and without it the map was already wrong:
      it claimed `frame-` for the midframe, which draws `charge-` and
      `antenna-`, and `battery-` for the cell, which draws `cell-`. Two
      of the seven layers were being checked on their layer plate alone.

   3. NOTHING WAS LOST. The full bench is built alongside, its parts for
      this layer are identified from the key prefixes, and the focused
      view must carry every one of them with the same number of
      primitives. It is deliberately a SECOND opinion — the OWNER map is
      how focus decides, and prefixes are how this decides, so a part the
      map never claimed shows up as missing here instead of vanishing.

   4. CENTRED AT ZERO. A guard on the centring step above rather than a
      discovery: it caught the first version, which subtracted the
      layer's nominal y, and it is kept so nobody reintroduces that.

   Calibrated — each arm was made to fail before any of it was trusted:
   MIN_PARTS at 99 fires on all thirteen layers; deleting "cell-" from
   the map fires arm 2 naming cell-pcm; dropping `lcd-gate` from the
   filter fires arm 3 naming that part; and arm 4 fired for real, twice,
   on the way to the code above — at y=-0.66 when the height came off the
   layer's nominal y, and again at y=-0.46 when a tipped sheet was
   measured as tall as its longest side.
   ===================================================================== */
(function checkTheFocusedViewIsWorthLookingAt() {
  const MIN_PARTS = 2, HIGH = 0.25;

  /* Which key prefixes belong to which layer. Not scenery: `pip-`,
     `well-`, `card-` and `health-` are bench furniture and belong to no
     layer, so they are listed here as deliberately unclaimed rather than
     left to fall through the gap. */
  const PREFIX = { back: ["cover-"], battery: ["battery-", "cell-"], board: ["board-"],
                   midframe: ["frame-", "charge-", "antenna-"],
                   backlight: ["light-", "led-"], lcd: ["lcd-"],
                   polariser: ["polariser-"], glass: ["touch-", "glass-"] };
  /* "health" carries no dash on purpose: the gauge is two parts, keyed
     `health-trough` and `health` flat, and the check found that the first
     time it ran. */
  const FURNITURE = ["pip-", "well-", "card-", "health"];

  ["lcd", "oled"].forEach(function (panel) {
    const whole = mobileBench({ panel: panel, states: {}, healthPct: 88 });
    const keys = layersFor(panel).map(function (L) { return L.key; });

    /* Arm 2 — every part on the bench is somebody's, or is furniture. */
    whole.parts.forEach(function (p) {
      if (keys.some(function (k) { return p.key === "layer-" + k; })) return;
      if (FURNITURE.some(function (x) { return p.key.indexOf(x) === 0; })) return;
      const owners = keys.filter(function (k) {
        return (PREFIX[k] || []).some(function (x) { return p.key.indexOf(x) === 0; });
      });
      if (owners.length !== 1) {
        throw new Error("bench-mobile: on the " + panel + ' stack, part "' + p.key + '" is ' +
          (owners.length ? "claimed by " + owners.join(" and ") : "claimed by no layer") +
          " in the prefix map this check compares against. A part nothing claims is a part " +
          "nothing checks, which is how the focused view could quietly stop drawing it.");
      }
    });

    layersFor(panel).forEach(function (L) {
      const b = mobileBench({ panel: panel, focus: L.key, states: {}, healthPct: 88 });
      if (b.parts.length < MIN_PARTS) {
        throw new Error("bench-mobile: focusing " + L.label + " on the " + panel + " stack " +
          "gives " + b.parts.length + " part(s). A parts view needs parts to take apart — " +
          "under " + MIN_PARTS + " this is the stack view with a different title on it.");
      }

      /* Arm 3, counted independently of the OWNER map. */
      const want = whole.parts.filter(function (p) {
        if (p.key === "layer-" + L.key) return true;
        return (PREFIX[L.key] || []).some(function (x) { return p.key.indexOf(x) === 0; });
      });
      const got = {};
      b.parts.forEach(function (p) { got[p.key] = p.build.length; });
      want.forEach(function (p) {
        if (got[p.key] === undefined) {
          throw new Error("bench-mobile: focusing " + L.label + " on the " + panel + " stack " +
            'drops "' + p.key + '", which the full bench draws as part of that layer. The ' +
            "focused view is meant to be the SAME model with its neighbours taken away, not a " +
            "reduced one — a student told to find a part that is not in the frame is stuck " +
            "with no way out.");
        }
        if (got[p.key] !== p.build.length) {
          throw new Error("bench-mobile: focusing " + L.label + " gives \"" + p.key + "\" " +
            got[p.key] + " primitives where the full bench gives it " + p.build.length + ".");
        }
      });

      /* Arm 3. */
      let lo = Infinity, hi = -Infinity;
      b.parts.forEach(function (p) {
        p.build.forEach(function (q) {
          const h = yHalfExtent(q);
          lo = Math.min(lo, p.pos[1] + q.pos[1] - h);
          hi = Math.max(hi, p.pos[1] + q.pos[1] + h);
        });
      });
      const mid = (lo + hi) / 2;
      if (Math.abs(mid) > HIGH) {
        throw new Error("bench-mobile: focusing " + L.label + " on the " + panel + " stack " +
          "leaves it centred at y=" + mid.toFixed(2) + ", not at the origin the focused " +
          "camera is aimed at. The layer kept its height in the stack and the student would " +
          "be shown the empty air under it.");
      }
    });
  });
})();

/* =====================================================================
   FOCUSING TWO LAYERS GIVES BOTH, AND NOTHING ELSE.

   `focus` takes a list as well as a key, because the parts stage has to
   be able to draw a display module — the panel AND the light behind it —
   rather than whichever single layer holds the answer. That list form is
   the mechanism a lab-side rule now depends on, so it is checked here,
   where it lives, rather than there.

   The property is exact and it is the one that can quietly fail: the
   union of two focused benches must equal the bench focused on both. A
   list form that silently kept only the first entry would draw a picture
   that looks entirely reasonable and is missing half the candidates, and
   nothing downstream would notice — it would just be a bench with fewer
   parts on it than the stage believes.

   Every adjacent pair in both stacks, not one favourite pair: the fan
   offsets and the heights differ down the stack, and a re-centring that
   happens to work for the two in the middle is not a re-centring.

   Calibrated: making the list form take only want[0] fires on the first
   pair; dropping the fan re-centring so both layers land at x=0 fires
   the separation arm.
   ===================================================================== */
(function checkFocusingTwoLayersGivesBoth() {
  ["lcd", "oled"].forEach(function (panel) {
    const st = layersFor(panel);
    for (let i = 0; i < st.length - 1; i++) {
      const A = st[i], B = st[i + 1];
      const a = mobileBench({ panel: panel, focus: A.key, states: {}, healthPct: 88 });
      const b = mobileBench({ panel: panel, focus: B.key, states: {}, healthPct: 88 });
      const both = mobileBench({ panel: panel, focus: [A.key, B.key], states: {}, healthPct: 88 });

      const want = a.parts.concat(b.parts).map(function (p) { return p.key; }).sort();
      const got = both.parts.map(function (p) { return p.key; }).sort();
      if (want.join(",") !== got.join(",")) {
        throw new Error("bench-mobile: focusing [" + A.key + ", " + B.key + "] on the " + panel +
          " stack gives " + got.length + " parts, but focusing them one at a time gives " +
          want.length + " between them. The list form has to be the union — a picture missing " +
          "half its candidates looks perfectly reasonable and is unanswerable.");
      }

      /* The two must still be TOLD APART. Zeroing the fan would stack a
         layer squarely under one the same size, which is the occlusion
         this whole bench is arranged to design out. */
      const at = {};
      both.parts.forEach(function (p) {
        const k = p.key.indexOf("layer-") === 0 ? p.key.slice(6) : null;
        if (k) at[k] = p.pos;
      });
      if (at[A.key] && at[B.key]) {
        const dx = Math.abs(at[A.key][0] - at[B.key][0]);
        const dz = Math.abs(at[A.key][2] - at[B.key][2]);
        if (Math.max(dx, dz) < 0.3) {
          throw new Error("bench-mobile: focusing [" + A.key + ", " + B.key + "] puts them " +
            dx.toFixed(2) + "/" + dz.toFixed(2) + " apart laterally. Two layers of the same " +
            "footprint stacked squarely is the upper one and a shadow — the fan has to be " +
            "re-centred on the group, not thrown away.");
        }
      }
    }
  });
})();
