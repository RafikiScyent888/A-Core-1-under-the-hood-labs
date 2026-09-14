/* =====================================================================
   TWELVE SCENARIOS FOR THE TWO NEW WAP BENCHES.

   Six on mounting and power, six on antennas and transmit power. Every
   wrong option in the pools below is a real misdiagnosis rather than
   filler, and in almost every case it is the diagnosis a technician
   reaches for FIRST — "the access point is faulty" is the wrong answer
   to most of these and it is the one everybody tries.

   THE DISCRIMINATING DETAIL IS BURIED IN THE REPORT. What settles each
   one is a single clause: a link light that IS healthy, an LED that is
   amber rather than dark, a failure that only happens under load, a
   distance, or a time of day.
   ===================================================================== */

/* ---- install: mounting it and getting power to it -------------------- */
export const INSTALL_CASES = [
  { key: "swapped",
    said: "Newly installed. The access point shows nothing at all — no LED, no boot. The " +
      "switch port it runs back to shows a healthy link light and the port counters are " +
      "climbing.",
    tell: "THE INJECTOR IS IN BACKWARDS. Data passes through an injector either way round, so " +
      "the link comes up and the counters move — but power is only injected on one port. " +
      "The AP is sitting on DATA IN, getting a working network connection and no volts." },
  { key: "console",
    said: "No LED on the unit. The installer says he put the cable in the only socket it would " +
      "go in, and the switch end shows link.",
    tell: "THE UPLINK IS IN THE CONSOLE PORT. It is an RJ45 and it accepts the plug, which is " +
      "exactly why this happens. No power comes down it and no network goes through it — " +
      "and the link light you can see belongs to the switch talking to nothing." },
  { key: "budget",
    said: "Twelve access points on one switch. They were all fine for a fortnight; now three " +
      "of them drop and restart at random, and never the same three.",
    tell: "THE SWITCH'S PoE BUDGET IS SPENT. The per-port rating is not the limit that bites " +
      "— the whole switch has a total wattage, and when it is exceeded the switch starts " +
      "shedding ports by priority. Random victims that recover on their own is the signature." },
  { key: "class",
    said: "Amber LED. It boots, runs for a minute, then reboots — and it does it sooner " +
      "when the office fills up. The injector is an older 15 watt one.",
    tell: "AN 802.3at AP ON AN 802.3af SUPPLY. 15 W is enough to boot and idle; it is not " +
      "enough once both radios are carrying clients. A device that works until it is busy and " +
      "then resets is a power budget, not a fault." },
  { key: "length",
    said: "Mounted at the far end of the warehouse. The run measures 118 metres back to the " +
      "cupboard. It powers up green, then the link flaps.",
    tell: "THE RUN IS OVER 100 METRES. PoE will often still deliver enough to light the unit " +
      "up, which is what makes this one confusing — power arrives and DATA does not hold. " +
      "No injector or AP swap fixes a channel that is out of spec." },
  { key: "socket",
    said: "Works all day. Every evening it goes off and it is back by the time the first " +
      "person arrives. The injector is in the ceiling void above reception.",
    tell: "THE INJECTOR IS ON A SWITCHED SOCKET — one that goes off with the lights. The AP " +
      "is blameless, and so is the network. This is why an injector hidden in a void is a " +
      "liability: nobody looks for it, and nobody knows what its socket is wired to." }
];

export const INSTALL_OPTS = [
  { key: "swapped", label: "The injector's two ports are swapped — the AP is on DATA IN" },
  { key: "console", label: "The uplink is in the CONSOLE port, not the network port" },
  { key: "budget",  label: "The switch's total PoE budget is exceeded and it is shedding ports" },
  { key: "class",   label: "An 802.3at access point on an 802.3af 15 W supply" },
  { key: "length",  label: "The run is over 100 m, so the channel is out of spec" },
  { key: "socket",  label: "The injector is on a switched socket that goes off at night" },
  { key: "faulty",  label: "The access point is faulty and needs replacing" },
  { key: "vlan",    label: "The switch port is on the wrong VLAN, so it never gets an address" }
];

/* ---- power: antennas, pattern and transmit power --------------------- */
export const ANTENNA_CASES = [
  { key: "panel",
    said: "A single long corridor, ninety metres of it, with rooms off one side. One AP in the " +
      "middle leaves both ends weak, and the neighbours upstairs are now complaining about " +
      "our signal.",
    tell: "A DIRECTIONAL PANEL, or a pair of them facing down the corridor. An omni in a " +
      "corridor spends most of its power on the walls and the floors above and below. Gain " +
      "in the direction that matters is bought from the directions that do not." },
  { key: "reduce",
    said: "Coverage is fine everywhere inside. A laptop in the car park associates from " +
      "seventy metres away, and the security review has flagged it.",
    tell: "TURN THE TRANSMIT POWER DOWN. Coverage is already sufficient, so the extra power is " +
      "buying nothing inside and giving away everything outside. Signal that leaves the " +
      "building is an attack surface you are broadcasting on purpose." },
  { key: "null",
    said: "The AP is on the ceiling directly over the desk that complains. Sitting across the " +
      "room from it is measurably better than sitting under it.",
    tell: "THEY ARE IN THE PATTERN'S NULL. An omni radiates in a flattened doughnut, and a " +
      "doughnut has a hole through the middle — straight above and straight below the " +
      "antenna are the two weakest places in the room." },
  { key: "aimed",
    said: "SOHO unit with three whips, all folded flat and pointed straight at the far wall " +
      "“to push the signal down there”. The far end got worse, not better.",
    tell: "A DIPOLE IS DEAF OFF ITS TIP. It radiates sideways off its length, so pointing one " +
      "at a target aims the single direction it cannot serve. Stand them up, or fan them." },
  { key: "asym",
    said: "Transmit power on the AP is set to maximum. Phones show four bars everywhere and " +
      "still drop connections at the edge of the floor.",
    tell: "THE LINK IS ASYMMETRIC. The bars show what the PHONE hears from the AP; the AP still " +
      "has to hear the phone, and a handset transmits at a fraction of the AP's power. Turning " +
      "the AP up widens the area where clients can hear and cannot be heard." },
  { key: "downtilt",
    said: "Warehouse, twelve metre ceiling, APs mounted at the apex. Forklift terminals at " +
      "floor level are weak in the aisles directly beneath them.",
    tell: "THE PATTERN IS GOING SIDEWAYS, NOT DOWN. At that height an omni's doughnut spreads " +
      "across the roof space. A downtilted or patch antenna aimed at the floor puts the energy " +
      "where the terminals are." }
];

export const ANTENNA_OPTS = [
  { key: "panel",    label: "Fit a directional panel and aim it along the space" },
  { key: "reduce",   label: "Reduce transmit power — the coverage is already sufficient" },
  { key: "null",     label: "They are sitting in the null directly under an omni's pattern" },
  { key: "aimed",    label: "The dipoles are aimed off their tips, which is where they are deaf" },
  { key: "asym",     label: "The link is asymmetric — the client cannot be heard back" },
  { key: "downtilt", label: "The pattern needs tilting down towards the floor" },
  { key: "morepow",  label: "Raise transmit power to maximum on every access point" },
  { key: "addap",    label: "Add more access points on the same channel to fill the gaps" }
];
