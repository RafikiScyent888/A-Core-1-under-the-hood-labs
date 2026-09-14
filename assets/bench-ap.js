/* =====================================================================
   THE ACCESS POINT ITSELF, AND WHAT YOU HANG IT ON.

   The WAP lab had nine stages and showed a machine on two of them. The
   floor plan covered `place`, the network run covered `terminate`, and
   the seven stages in between talked about mounting an AP, powering it,
   choosing an antenna and setting transmit power without ever showing
   one. `install` says "mount it and get power to it — PoE injector or
   switch" and drew neither.

   SCALE: 1 UNIT = 10 mm. Not the floor plan's scale, and deliberately
   so. bench-wap.js draws a survey at TILE 2.0 per cell, which is roughly
   a unit per metre — the right scale for a drawing and useless for a
   part you hold. A 220 mm AP at the plan scale is a fifth of one floor
   tile. So this is a separate bench at a separate, stated scale, the
   same split the net lab already makes between its schematic path and
   its close-ups.

   WHAT THE FOUR THINGS ON IT ARE FOR

     ceiling AP     internal antenna array, omnidirectional, the normal
                    answer for covering a floor from above
     dipole AP      external antennas you can aim, and the giveaway that
                    you are looking at SOHO kit rather than enterprise
     panel antenna  directional. The answer to "cover the floor and NOT
                    the car park", which is a security question as much
                    as a coverage one
     PoE injector   what you use when the switch does not do PoE, and the
                    thing that gets wired backwards

   THE INJECTOR IS DRAWN WITH ITS TWO PORTS DIFFERENT. Data in and
   data-plus-power out are not interchangeable, putting the AP on the
   wrong one is the commonest PoE install fault there is, and a model
   that drew two identical sockets would be teaching the mistake.
   ===================================================================== */

const P2 = Math.PI / 2;

/* 1 unit = 10 mm. Every dimension below is millimetres over ten. */
export const AP_SCALE = { mmPerUnit: 10 };

const AP = {
  disc: 22.0,      /* 220 mm across — a normal enterprise ceiling AP */
  thick: 4.2,      /* 42 mm deep */
  ledRing: 15.0,
  boxW: 16.0, boxH: 4.0, boxD: 11.0,
  dipole: 17.0
};

export const AP_COLOUR = {
  shell:   "#c9ced3",   /* silver — the off-white every ceiling AP is */
  dark:    "#3b434b",
  led:     "#2f8f4a",   /* green: up */
  ledWarn: "#c4952a",   /* yellow: no PoE, or booting */
  port:    "#8f979e",
  gold:    "#d6ad4a"
};

/* ---------------------------------------------------------------------
   THE CEILING AP. A disc, domed very slightly, with the status LED in a
   ring near the rim and the ports recessed into the underside.

   THE PORTS ARE UNDERNEATH AND THAT IS THE POINT. A ceiling AP hides its
   cabling inside the mount, which is why a student who has only seen a
   SOHO box looks for a socket on the edge, does not find one, and
   decides the unit is faulty. */
/* THE OWNER'S ACTUAL ACCESS POINT, WHICH REVERSED A DECISION I HAD
   ALREADY WRITTEN DOWN AS FACT.

   Two earlier photographs showed a generic unit with a ring of vent
   slots on its face and one small indicator lozenge. I built that, and
   in doing so I DELETED the glowing LED ring I had modelled first,
   leaving a comment saying the ring was invented — "it looked like an
   access point to me rather than being what an access point looks
   like." The owner's real unit has the ring. I had it right, then
   argued myself out of it against a photograph of different hardware.

   Worth keeping because the lesson is not "trust your instincts". It is
   that "a photograph" and "a photograph OF THE THING" are different
   evidence, and I treated the first as the second.

   WHAT THIS UNIT ACTUALLY IS

     - a CIRCLE, not the rounded square I switched to
     - a bright LED RING, roughly half the diameter, and it is the
       entire diagnostic interface: colour and blink rate is all you get
     - a SMOOTH face with no vent slots on it at all
     - a small logo disc inside the ring
     - regulatory text printed in an arc round the rim, which is too
       small to render legibly and is represented as a faint band

   rbox INFLATES, which is why the previous version buried everything:
   roundedBox() bevels OUTWARD and clamps its radius to a fifth of the
   smallest dimension — on a thin slab, the thickness. A body declared
   [22, 4.2, 22] rendered 25.4 x 7.6 with its top at 3.78 rather than the
   2.1 that t/2 promises. A cylinder has no such trap, so going back to
   a circle removes the problem as well as matching the hardware. */
const BODY_R = 0.9;

export function apCeiling(x) {
  const d = AP.disc, t = AP.thick, TOP = t / 2;
  return [
    /* THE DISC. A cyl takes [diameter, height] and does not inflate. */
    { shape: "cyl", size: [d, t], pos: [x, 0, 0], seg: 44, shade: 1.0 },
    /* the soft shoulder round the rim */
    { shape: "cyl", size: [d - 1.4, t * 0.30], pos: [x, TOP * 0.72, 0], seg: 44, shade: 1.04 },
    /* the faint band of regulatory print round the edge */
    { shape: "torus", size: [d - 3.4, 0.30], pos: [x, TOP + 0.02, 0], rot: [P2, 0, 0],
      seg: 44, seg2: 6, shade: 0.88 },
    /* the logo disc in the middle of the ring */
    { shape: "cyl", size: [4.6, 0.34], pos: [x, TOP + 0.08, 0], seg: 24, shade: 0.90 }
  ];
}

export function apCeilingPorts(x) {
  const d = AP.disc, t = AP.thick, TOP = t / 2;
  /* THE NOTCH IS ON THE NEAR RIM, and that is a choice about which edge
     the camera is looking at rather than a liberty with the hardware. A
     disc has no inherent front; the photograph shows the LED on the face
     near one edge and the RJ45 cut into the rim opposite, which is
     exactly what this builds. Putting the notch on the far rim would
     have hidden it behind the body — the same fault as the port bay it
     replaced, solved by turning the model rather than the camera. */
  return [
    { shape: "rbox", size: [6.0, t * 0.70, 1.6], pos: [x, 0, d / 2 - 0.8], r: 0.3, shade: 0.32 },
    /* the RJ45 in it — PoE, data and power on one lead */
    { shape: "box", size: [2.4, 1.5, 1.8], pos: [x - 1.0, 0.05, d / 2 - 0.7], r: 0.12, shade: 1.35 },
    /* the reset pinhole beside it */
    { shape: "cyl", size: [0.55, 1.0], pos: [x + 1.9, 0.05, d / 2 - 0.7], rot: [P2, 0, 0],
      seg: 10, shade: 0.28 }
  ];
}

/* The bracket. A plate, three keyhole slots, and two clips that grip the
   T-rail of a suspended ceiling.

   THE FIRST VERSION READ AS A FLYING SAUCER. A thin disc with four little
   bars poking out sideways is not recognisable as anything, and a model
   nobody recognises teaches nothing. The plate is thicker, the slots are
   long and dark enough to read as cut-outs rather than bumps, and the
   rail clips are upstands with a lip — the shape your hand recognises
   when you are holding one above your head. */
export function apBracket(x) {
  const d = AP.disc;
  const out = [
    /* the plate */
    { shape: "cyl", size: [d * 0.64, 1.1], pos: [x, 0, 0], seg: 32, shade: 1.0 },
    /* the raised centre boss the cable passes through */
    { shape: "tube", size: [d * 0.30, 1.8], pos: [x, 0.9, 0], seg: 24, shade: 0.88 }
  ];
  /* THE KEYHOLE SLOTS. Ring about Y takes size as [radial, axial,
     tangential] — the convention shape.js documents and ring-radial.mjs
     enforces — so the long dimension of a slot that runs AROUND the
     plate is the third one, not the first. */
  out.push({ shape: "box", size: [1.3, 0.5, 4.2], pos: [x, 0.62, 0], r: 0.12, shade: 0.22,
    ring: { count: 3, axis: "y", radius: d * 0.22 } });
  /* A KEYHOLE IS A CIRCLE WITH A SLOT OFF IT, and that shape is the whole
     reason the AP can be hung and then twisted rather than held up while
     three screws are started. Drawn as a slot plus a round eye at one end
     so the shape says what it does; three dark bars said nothing. */
  out.push({ shape: "cyl", size: [2.1, 0.52], pos: [x, 0.62, 0], seg: 14, shade: 0.22,
    ring: { count: 3, axis: "y", radius: d * 0.22 + 1.9 } });
  /* THE T-RAIL CLIPS. Folded metal, not blocks: an upstand and a lip with
     the gap between them that the ceiling rail slides into. The first
     pass drew them as two solid lumps the size of the boss, which read as
     handles. */
  [-1, 1].forEach(function (sgn) {
    const cx = x + sgn * d * 0.30;
    out.push({ shape: "box", size: [0.55, 3.0, 5.2], pos: [cx, 1.5, 0], r: 0.12, shade: 0.86 });
    out.push({ shape: "box", size: [2.4, 0.55, 5.2], pos: [cx - sgn * 0.95, 2.7, 0], r: 0.12, shade: 0.74 });
  });
  return out;
}

/* ---------------------------------------------------------------------
   THE SOHO AP, with antennas you can see and aim. Three dipoles, because
   three is what the pictures in the books have and because the count is
   a clue: more radio chains means more spatial streams. */
export function apDipole(x) {
  const W = AP.boxW, H = AP.boxH, D = AP.boxD;
  return [
    /* A WEDGE, higher at the back than the front. */
    { shape: "rbox", size: [W, H, D], pos: [x, H / 2, 0], r: 0.5, shade: 1.0 },
    { shape: "rbox", size: [W - 0.6, H * 0.62, D - 0.8], pos: [x, H * 1.02, -0.5],
      rot: [-0.10, 0, 0], r: 0.5, shade: 1.06 },
    /* the vented band across the front */
    { shape: "box", size: [0.42, 1.1, 0.3], pos: [x - W * 0.34, H * 0.78, D / 2 + 0.05],
      r: 0.05, shade: 0.55, repeat: { count: 14, step: [0.82, 0, 0] } },
    /* the feet */
    { shape: "cyl", size: [1.3, 0.5], pos: [x - W * 0.38, 0, D * 0.32], seg: 10, shade: 0.5 },
    { shape: "cyl", size: [1.3, 0.5], pos: [x + W * 0.38, 0, D * 0.32], seg: 10, shade: 0.5 }
  ];
}

/* THE STATUS LEDS. A row across the front, and the reason this part is
   separate: it is the diagnostic surface. "Which lights are on?" is the
   first question anybody asks down a phone line, and a model that cannot
   show the answer cannot be used to practise the conversation. */
export function apRouterLeds(x) {
  const W = AP.boxW, H = AP.boxH, D = AP.boxD;
  return [{ shape: "rbox", size: [0.85, 0.3, 0.5], pos: [x - W * 0.30, H * 0.34, D / 2 + 0.02],
    r: 0.1, shade: 1.0, repeat: { count: 5, step: [1.5, 0, 0] } }];
}

/* THE REAR PORTS, AND THE ONE THAT IS A DIFFERENT COLOUR. Four LAN and
   one WAN. The colour is not decoration: it is the only thing stopping
   the incoming line going into a LAN socket, which is a fault that
   presents as "no internet but the network works". */
export function apRouterLan(x) {
  const W = AP.boxW, H = AP.boxH, D = AP.boxD;
  return [{ shape: "box", size: [1.7, 1.3, 1.4], pos: [x - W * 0.10, H * 0.42, -D / 2 - 0.05],
    r: 0.1, shade: 1.0, repeat: { count: 4, step: [2.0, 0, 0] } }];
}

export function apRouterWan(x) {
  const W = AP.boxW, H = AP.boxH, D = AP.boxD;
  return [
    { shape: "box", size: [1.7, 1.3, 1.4], pos: [x - W * 0.34, H * 0.42, -D / 2 - 0.05],
      r: 0.1, shade: 1.0 },
    /* the power inlet at the far end */
    { shape: "cyl", size: [1.3, 1.1], pos: [x + W * 0.40, H * 0.42, -D / 2 - 0.05],
      rot: [P2, 0, 0], seg: 12, shade: 0.5 }
  ];
}

/* FOUR ANTENNAS, AND THEY ARE FLAT PADDLES. I built three round whips
   with ball tips and wrote a note claiming three was what the books
   show. The photograph shows four, and shows them as flat blades. The
   count is a specification — each one is a radio chain, and the chains
   cap how many spatial streams the unit can carry — so getting it wrong
   was not a stylistic slip, it was the wrong number on a spec. */
export function apDipoles(x) {
  const W = AP.boxW, H = AP.boxH, D = AP.boxD, L = AP.dipole;
  const out = [];
  [-1.5, -0.5, 0.5, 1.5].forEach(function (i) {
    const cx = x + i * W * 0.30;
    const tilt = i * 0.22;
    /* the hinge */
    out.push({ shape: "cyl", size: [1.3, 1.0], pos: [cx, H * 0.92, -D / 2 - 0.3],
      rot: [0, 0, P2], seg: 12, shade: 0.6 });
    /* the blade */
    out.push({ shape: "rbox", size: [1.7, L, 0.5],
      pos: [cx + Math.sin(tilt) * L * 0.5, H * 0.92 + Math.cos(tilt) * L * 0.5, -D / 2 - 0.3],
      rot: [0, 0, -tilt], r: 0.28, shade: 1.0 });
  });
  return out;
}

/* ---------------------------------------------------------------------
   THE DIRECTIONAL PANEL. Flat radome on an adjustable arm. This is the
   answer to covering a long floor, a corridor or a yard without lighting
   up the car park — and the reason a site survey ever cares which way an
   antenna faces. */
export function antennaPanel(x) {
  return [
    { shape: "rbox", size: [17.0, 13.0, 2.2], pos: [x, 7.5, 0], r: 0.6, shade: 1.0 },
    /* the shallow step round the face, which is what a radome looks like */
    { shape: "rbox", size: [15.2, 11.2, 2.6], pos: [x, 7.5, 0.1], r: 0.5, shade: 1.06 },
    /* the arm */
    { shape: "box", size: [1.6, 1.6, 3.2], pos: [x, 7.5, -2.4], r: 0.2, shade: 0.72 },
    { shape: "cyl", size: [2.4, 1.4], pos: [x, 7.5, -3.8], rot: [P2, 0, 0], seg: 14, shade: 0.66 },
    /* the mast it clamps to */
    { shape: "cyl", size: [2.2, 15.0], pos: [x, 7.5, -5.4], seg: 16, shade: 0.6 },
    /* the N-type connector on the back, which is not an RJ45 and does not
       carry power — worth seeing, because "why will this not power up"
       is answered by looking at it */
    { shape: "cyl", size: [1.5, 1.8], pos: [x, 2.6, -1.6], rot: [P2, 0, 0], seg: 14, shade: 0.8 }
  ];
}

/* ---------------------------------------------------------------------
   THE PoE INJECTOR. Two RJ45s that are NOT interchangeable, a mains
   inlet, and one LED. */
export function poeInjector(x) {
  return [
    { shape: "rbox", size: [10.0, 3.0, 6.0], pos: [x, 1.5, 0], r: 0.4, shade: 1.0 }
  ];
}

/* DATA IN — from the switch. No power on this one. */
export function poeDataIn(x) {
  return [
    { shape: "box", size: [1.55, 1.3, 1.2], pos: [x - 2.6, 1.5, 3.1], r: 0.08, shade: 1.0 }
  ];
}

/* DATA AND POWER OUT — to the AP. Swap these two and the AP never comes
   up, while the link light on the switch looks perfectly healthy. */
export function poePowerOut(x) {
  return [
    { shape: "box", size: [1.55, 1.3, 1.2], pos: [x + 2.6, 1.5, 3.1], r: 0.08, shade: 1.0 },
    /* the mains inlet on the back */
    { shape: "box", size: [2.4, 1.9, 1.0], pos: [x, 1.5, -3.1], r: 0.1, shade: 0.66 },
    /* the one LED */
    { shape: "cyl", size: [0.7, 0.3], pos: [x + 3.6, 3.0, 0], seg: 10, shade: 1.0 }
  ];
}

/* ---------------------------------------------------------------------
   THE BENCH. Two views, because eighty units of kit in one row would
   either overflow a phone or shrink every part past reading.

     mount    ceiling AP, its bracket, and the injector — the `install`
              stage: hang it, then get power to it
     antenna  internal omni against external omni against directional —
              the `power` stage: cover the floor and not the car park
   --------------------------------------------------------------------- */
export function apBench(view) {
  view = view || {};
  const show = view.show === "antenna" ? "antenna" : "mount";
  const parts = [];

  if (show === "mount") {
    const X = { ap: -17, br: 3, inj: 19 };
    /* NO TILT. An earlier version turned this unit through 1.15 radians
       so a port bay sunk into its back face could be seen at all, and
       then spent a second pass walking that back from 2.2 because at
       that angle the disc read as a dinner plate rather than a device.

       The photograph dissolved the problem instead of solving it: the
       RJ45 is in a NOTCH IN THE EDGE, so it is visible with the unit
       sitting flat, face up, the way it looks on a ceiling. Two render
       passes went into posing around a feature this hardware does not
       have. Modelling from memory and then tuning the camera to hide the
       consequences is not the same as looking at the thing. */
    parts.push({ key: "ap-body", label: "The access point", build: apCeiling(X.ap),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.shell,
      spec: "220 mm across, 42 mm deep",
      note: "INTERNAL ANTENNAS, so there is nothing to aim and nothing to snap off. The " +
        "pattern is omnidirectional and pointed DOWN, which is why this belongs on a ceiling " +
        "and does nothing useful sitting on a desk. The LED ring is the whole diagnostic " +
        "interface: a colour and a blink rate is all you get." });
    parts.push({ key: "ap-led", label: "The status ring",
      /* ONE SMALL INDICATOR, NOT A GLOWING RING. The ring was invented —
         it looked like an access point to me rather than being what an
         access point looks like. The photograph shows a single lozenge
         near the front edge, and a student reading it over the phone is
         looking for one light, not a halo. */
      /* THE RING, PUT BACK. Roughly half the disc's diameter, standing
         just proud of the face, and it is the whole diagnostic surface:
         a colour and a blink rate is everything the unit can tell you
         without a laptop. */
      build: [{ shape: "torus", size: [AP.disc * 0.52, 0.52],
                pos: [X.ap, AP.thick / 2 + 0.10, 0], rot: [P2, 0, 0],
                seg: 44, seg2: 8, shade: 1.0 }],
      finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: view.noPower ? AP_COLOUR.ledWarn : AP_COLOUR.led, glow: 0.45,
      spec: view.noPower ? "Amber — powered, not adopted or no uplink" : "Green — up",
      note: "AMBER IS NOT DEAD. A unit with no PoE at all shows nothing; amber means it has " +
        "power and is unhappy about something else. That distinction is the fastest split " +
        "there is between a power fault and a network fault, and it is free." });
    parts.push({ key: "ap-ports", label: "The ports, underneath", build: apCeilingPorts(X.ap),
      finish: "metal", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.port,
      spec: "One PoE RJ45, one console, one reset",
      note: "UNDERNEATH, not on the edge, and that catches people out. The cable comes up " +
        "through the mount and disappears. The small port beside it is CONSOLE, not a second " +
        "network port — plugging the uplink into it gives you a dead AP and a healthy " +
        "link light at the switch." });
    parts.push({ key: "ap-bracket", label: "The ceiling bracket", build: apBracket(X.br),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.shell,
      spec: "Keyhole plate with T-rail clips",
      note: "The bracket goes up first and the AP twists onto it, which is why you can drop a " +
        "unit without touching the ceiling again. The clips grip the T-rail of a suspended " +
        "grid; on solid plasterboard you are drilling instead, and you need the right anchor " +
        "because the whole weight hangs off it." });
    parts.push({ key: "poe-body", label: "PoE injector", build: poeInjector(X.inj),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.dark,
      spec: "Mains in, one port out",
      note: "WHAT YOU USE WHEN THE SWITCH DOES NOT DO PoE. One injector, one AP. It is a " +
        "single point of failure sitting in a ceiling void where nobody will look for it, " +
        "which is the honest argument for a PoE switch instead." });
    parts.push({ key: "poe-in", label: "DATA IN — from the switch", build: poeDataIn(X.inj),
      finish: "metal", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.port,
      spec: "Data only, no power on this one",
      note: "This one goes to the SWITCH. Nothing is injected here." });
    parts.push({ key: "poe-out", label: "DATA AND POWER OUT — to the AP",
      build: poePowerOut(X.inj), finish: "metal", scale: 1, pos: [0, 0, 0],
      color: AP_COLOUR.gold, glow: 0.2,
      spec: "Data plus 48 V — this is the one the AP goes on",
      note: "SWAP THESE TWO AND THE AP NEVER COMES UP while the switch shows a perfectly " +
        "healthy link light, because data still passes either way round — it is only the " +
        "power that does not. It is the commonest PoE install fault there is and it looks " +
        "exactly like a faulty access point." });
  } else {
    /* THE ROUTER AND THE PANEL. The owner's call: the ceiling AP carries
       the install stage and the router carries this one. The comparison
       that survives is the one this stage is actually about — an
       omnidirectional pattern you can aim against a directional one that
       gives up every direction but the chosen one — and the internal
       array stays a sentence in the router's note rather than a third
       object competing for the frame. */
    const X = { rt: -11, pan: 17 };
    parts.push({ key: "ant-router", label: "Wi-Fi 6 router \u2014 four external antennas",
      build: apDipole(X.rt), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: AP_COLOUR.dark, spec: "Four radio chains, four aimable antennas",
      note: "THE ANTENNA COUNT IS A SPECIFICATION, NOT A STYLE. Each one is a radio chain, and "
        + "the chains cap how many spatial streams the unit can run \u2014 which is most of what "
        + "separates one of these from a cheaper one on the same shelf. A ceiling AP does the "
        + "same job with the array hidden inside, so you cannot count them and have to read "
        + "the datasheet instead.\n\nROUND THE BACK, four LAN sockets and one WAN, and the WAN "
        + "is a different colour on purpose. Put the incoming line into a LAN hole and the "
        + "local network works perfectly \u2014 machines see each other, the printer prints \u2014 "
        + "and nothing reaches the internet. The symptom points outward at the provider; the "
        + "cause is one socket to the left." });
    parts.push({ key: "ant-leds", label: "The status lights", build: apRouterLeds(X.rt),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.led, glow: 0.45,
      spec: "Power, internet, 2.4, 5, WPS",
      note: "THE FIRST QUESTION ANYBODY ASKS DOWN A PHONE LINE. Power on but internet dark "
        + "puts the fault upstream of this box, and both dark puts it at the socket \u2014 two "
        + "lights, and the problem is already halved before anyone has driven anywhere." });
    parts.push({ key: "ant-whips", label: "The four antennas \u2014 omnidirectional, aimable",
      build: apDipoles(X.rt), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: AP_COLOUR.dark, spec: "Hinged flat blades",
      note: "A DIPOLE RADIATES OFF ITS LENGTH, NOT ITS TIP. Point one straight at the far end "
        + "of a room and you have aimed the single direction it is deaf in. Standing them all "
        + "vertical is the safe setting; fanning them covers a stairwell better than any of "
        + "them covers it alone." });
    /* THE PORT BANK IS NOT ON THIS BENCH, AND THAT IS THE HONEST CALL.

       I built `ant-lan` and `ant-wan` as parts with real teaching in
       them — four LAN sockets and a WAN socket in a different colour,
       because putting the incoming line in a LAN hole gives you a local
       network that works perfectly and no internet at all, a symptom
       that points at the provider when the cause is one hole to the
       left. Then I mounted them on the BACK face, which is where they
       are, and the camera that shows the status LEDs on the front cannot
       see the back. There is no angle that shows both: they are opposite
       faces of the same box.

       Shipping them anyway would have put two invisible parts in the
       control list — exactly the fault I have spent this build removing
       from other people's stages and then committed twice myself, once
       with the ceiling AP's port bay and once here. So they come off,
       and the WAN lesson lives in the router's own note where a student
       can actually reach it. A part nobody can see is not a model, it is
       a line in a registry. */
    parts.push({ key: "ant-panel", label: "Panel \u2014 DIRECTIONAL", build: antennaPanel(X.pan),
      finish: "plastic", scale: 1, pos: [0, 0, 0], color: AP_COLOUR.shell,
      spec: "Gain in one direction, bought from every other",
      note: "THE ANSWER TO COVERING THE FLOOR AND NOT THE CAR PARK. Gain is not free power \u2014 "
        + "it is the same power pushed into a narrower beam, taken from behind and beside. That "
        + "makes it a SECURITY control as much as a coverage one: signal that never leaves the "
        + "building cannot be sat on from outside it." });
  }

  return {
    kind: "bench",
    title: show === "mount" ? "The access point, its bracket and the injector"
                            : "Three ways to shape the same signal",
    caption: "Drawn at 1 unit = 10 mm. " + (show === "mount"
      ? "The bracket goes up first; the AP twists onto it; the cable arrives underneath."
      : "Same transmitter, three patterns — and the pattern is chosen by where the signal " +
        "must NOT go as much as by where it must."),
    board: null, decor: [], parts: parts,
    /* Tuned by measuring the render, not by deriving it — see the fibre
       bench, where a camera that looked right on paper was inflating near
       against far by a factor of two. */
    camera: show === "mount"
      ? { dist: 44, fitWidth: 62, yaw: 0.40, pitch: 0.52, target: [0, 2.0, 0], min: 14, max: 120 }
      : { dist: 40, fitWidth: 60, yaw: 0.30, pitch: 0.34, target: [1.0, 9.5, 0], min: 14, max: 120 }
  };
}
