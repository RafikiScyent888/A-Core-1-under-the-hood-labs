/* =====================================================================
   TWENTY-FOUR SCENARIOS FOR THE FOUR CONNECTOR BENCHES.

   Six on video ends, six on the power loom, six on the voltage selector,
   six on the back of a UPS.
   Every wrong option in the pools is a real misdiagnosis, and in most
   cases it is the FIRST one a technician reaches for — "the monitor is
   broken", "the card is dead", "the supply has failed". The bench beside
   the question is what makes the right answer findable: these are all
   faults you identify by LOOKING at a connector rather than by reasoning
   about symptoms.

   The discriminating detail is always in the report and never in the
   option list: a picture that works but has no sound, a link that comes
   up at the wrong resolution, a card that runs until it is loaded, a
   machine that is dead on one continent and fine on another.
   ===================================================================== */

/* ---- video: which end, and what it can and cannot carry ------------- */
export const VIDEO_CASES = [
  { key: "dvi",
    said: "Swapped the lead for one from the store cupboard. The picture is perfect and the " +
      "speakers have gone completely silent. The monitor has its own speakers and they worked " +
      "this morning.",
    tell: "A DVI LEAD CARRIES NO AUDIO. The picture is perfect because the video path is fine; " +
      "the sound is gone because DVI never carried it. The ticket says “the monitor " +
      "broke” and the cause is the lead somebody swapped in." },
  { key: "vga",
    said: "A long run to a screen at the far end of the room. The picture is there but soft, " +
      "with text ghosting and smearing sideways. Short lead on the desk, same machine, and it " +
      "is crisp.",
    tell: "ANALOGUE, SO IT DEGRADES. VGA is the only end here that gets gradually WORSE over " +
      "distance rather than failing outright — ghosting and smear on a long run and clean " +
      "on a short one is the signature. A digital lead either carries the picture or does not." },
  { key: "usbc",
    said: "New laptop, one USB-C lead, nothing on the screen at all. The same lead charges the " +
      "laptop perfectly and the shop said any USB-C cable would do it.",
    tell: "USB-C CARRIES VIDEO ONLY WITH DP ALT MODE, and that is a property of the PORT, not " +
      "of the lead. Charging proves the cable and the socket work; it proves nothing about " +
      "whether that port was ever wired for display." },
  { key: "dp",
    said: "The lead was pulled out by someone moving the desk and now it will not seat. Looking " +
      "into the socket on the card, something inside looks bent.",
    tell: "A DISPLAYPORT LATCHES, and it was yanked without the tab being squeezed. The hooks " +
      "bend, the shell tears off the cable, or the socket comes away from the card. Squeeze " +
      "first, then pull — this is the commonest connector damage in a classroom." },
  { key: "hdmi",
    said: "Wall-mounted screen in reception. The picture drops out for a second or two every " +
      "few hours and comes back on its own. Nobody is touching it.",
    tell: "HDMI IS HELD IN BY FRICTION ALONE. There is no latch and no screw, so a wall-mounted " +
      "screen with the weight of a lead hanging off it works loose over hours. Intermittent " +
      "and self-recovering, with nobody near it, is a seating fault rather than a panel one." },
  { key: "vga",
    said: "Somebody has brought a lead from the drawer that fits the socket perfectly and gets " +
      "no picture. Counting the pins on the end there are nine of them in two rows.",
    tell: "NINE PINS IN TWO ROWS IS A SERIAL PORT, not video. The D-shaped shell is the same " +
      "shape and the same size, which is exactly why they get confused. Video is FIFTEEN pins " +
      "in THREE rows — count the rows before you count anything else." }
];

export const VIDEO_OPTS = [
  { key: "hdmi", label: "HDMI — trapezoid, friction only, carries audio and video" },
  { key: "dp",   label: "DisplayPort — one corner cut, and a latch you must squeeze" },
  { key: "dvi",  label: "DVI-D — big, white, thumbscrews, and NO audio" },
  { key: "vga",  label: "VGA — D-shell, 15 pins in 3 rows, analogue" },
  { key: "usbc", label: "USB-C — oval and reversible, video only with DP Alt Mode" },
  { key: "panel", label: "The monitor's panel has failed and needs replacing" },
  { key: "gpu",  label: "The graphics card has failed and needs replacing" },
  { key: "driver", label: "The display driver is out of date and needs reinstalling" }
];

/* ---- the loom: which connector, and what it will not mate with ------ */
export const LOOM_CASES = [
  { key: "pcie",
    said: "New graphics card. It powers up and the machine is stable on the desktop, then it " +
      "resets under any real load. There is a six-plus-two on the loom and the two is hanging " +
      "loose beside the socket.",
    tell: "THE 2 OF A 6+2 WAS LEFT OFF. Six pins is enough to bring a card up and idle it; the " +
      "extra two are the headroom it needs under load. A card that is fine until it is busy " +
      "and then resets is a power delivery problem, not a faulty card." },
  { key: "eps",
    said: "Board assembled on the bench. Fans twitch, no post, no display. The eight-pin near " +
      "the processor is empty and there is a spare eight-pin on the loom that will not go in.",
    tell: "IT IS A PCIe 8-PIN AND THAT SOCKET WANTS AN EPS. They are the same size and keyed so " +
      "they will not mate — which is the keying doing its job. The tell is how they split: " +
      "PCIe comes apart 6 + 2, EPS comes apart 4 + 4." },
  { key: "atx",
    said: "Everything is connected and the machine is completely dead — no fans, no lights. " +
      "The big connector on the board looks seated but one end of it stands slightly proud.",
    tell: "THE 24-PIN IS NOT FULLY HOME. It is stiff and it is long, so it seats at one end and " +
      "leaves the other short, and the latch has not clicked. Nothing at all happens, which is " +
      "what sends people looking for a dead supply." },
  { key: "sata",
    said: "Three drives on one lead. All three vanished at once. Another drive on a different " +
      "lead is fine.",
    tell: "ONE SATA LEAD CARRIES SEVERAL CONNECTORS down its length, so one failed lead takes " +
      "out every drive on it. Three drives dying together is not three failures — it is one, " +
      "upstream of all of them." },
  { key: "molex",
    said: "An older case fan has stopped. The four-pin feeding it is stiff and somebody has " +
      "been at the socket with a screwdriver; there is a crack in the plastic.",
    tell: "A MOLEX HAS NO LATCH — friction only, and it is stiff enough that people lever it " +
      "out and crack the socket. Rock it gently along its length instead of prying it." },
  { key: "eps",
    said: "The machine ran for a year and now will not start. The loom has been re-routed " +
      "behind the tray and the plug by the processor has been forced in at an angle; two of " +
      "its holes look square and two look rounded.",
    tell: "THE MIX OF SQUARE AND CHAMFERED HOLES IS THE KEYING on an EPS, and forcing a plug " +
      "past it is how a socket gets damaged. If it needs force, it is the wrong connector." }
];

export const LOOM_OPTS = [
  { key: "atx",   label: "The 24-pin ATX to the board" },
  { key: "eps",   label: "The EPS 8-pin to the processor — splits 4 + 4" },
  { key: "pcie",  label: "The PCIe 6+2 to the graphics card — splits 6 + 2" },
  { key: "sata",  label: "SATA power to the drives — several down one lead" },
  { key: "molex", label: "A Molex 4-pin — no latch, friction only" },
  { key: "psu",   label: "The power supply has failed and needs replacing" },
  { key: "board", label: "The motherboard has failed and needs replacing" },
  { key: "front", label: "The front panel header is wired to the wrong pins" }
];

/* ---- the selector: the one mistake that is instantly destructive ---- */
export const MAINS_CASES = [
  { key: "bang",
    said: "A machine shipped in from a US office. Plugged into a UK socket and there was a bang " +
      "and a smell. The red switch on the back reads 115.",
    tell: "115 SET, 230 SUPPLIED. The supply is wired for a voltage doubler on the low range, " +
      "so at 230 it receives about twice what it expects. This is the destructive direction " +
      "and it is immediate — there is no warning and no recovery." },
  { key: "dead",
    said: "A machine taken to a US site. Completely dead on the bench there, no fans, no " +
      "lights, and perfectly fine when it came back. The switch reads 230.",
    tell: "230 SET, 115 SUPPLIED. It simply will not start. This is the HARMLESS direction, " +
      "which is why people remember it and are relaxed about the switch — and being relaxed " +
      "about the switch is what causes the other one." },
  { key: "auto",
    said: "A recent supply with no red switch anywhere on the back. The plate reads INPUT " +
      "100-240V~ 50/60Hz.",
    tell: "IT IS AUTO-RANGING. A single wide input range and NO switch means there is nothing " +
      "to set and nothing to get wrong. The absence of the switch is the information." },
  { key: "check",
    said: "A second-hand supply out of a box of spares, about to go into a build. Nobody knows " +
      "where it came from.",
    tell: "CHECK IT BEFORE IT IS EVER PLUGGED IN. That is exactly what SELECT VOLTAGE BEFORE " +
      "USE on the plate means: the check costs two seconds and the mistake costs the supply " +
      "and sometimes the board behind it." },
  { key: "watts",
    said: "Sizing a replacement for a machine with a graphics card going in. The old plate " +
      "reads MAX OUTPUT 350W.",
    tell: "MAX OUTPUT IS THE NUMBER THAT SIZES THE REPLACEMENT, and 350 W was chosen for a " +
      "machine with no card in it. Read the plate before ordering — it is the only place " +
      "the figure is written down." },
  { key: "isolate",
    said: "About to work inside a machine. The lead is still in the wall and the black rocker " +
      "on the back is pressed at the O end.",
    tell: "O MEANS THE CIRCUIT IS OPEN, so the supply is isolated — but the LEAD is still " +
      "live to the switch. The rocker is the right first step and it is not the last one: for " +
      "anything beyond a quick look, the lead comes out." }
];

export const MAINS_OPTS = [
  { key: "bang",    label: "Set to 115 and given 230 — immediate, destructive damage" },
  { key: "dead",    label: "Set to 230 and given 115 — it will not start, and is unharmed" },
  { key: "auto",    label: "No switch and a wide input range — auto-ranging, nothing to set" },
  { key: "check",   label: "Check the selector before it is ever plugged in" },
  { key: "watts",   label: "Read MAX OUTPUT on the plate to size a replacement" },
  { key: "isolate", label: "O isolates the supply, but the lead is still live to the switch" },
  { key: "fuse",    label: "Change the fuse in the plug and try it again" },
  { key: "surge",   label: "Fit a surge protector and the voltage will be handled for you" }
];

/* ---- the UPS: two rows of sockets, and only one of them holds up ---- */
export const UPS_CASES = [
  { key: "wrongrow",
    said: "Every light on the front is green and the self-test passes. There was a cut on " +
      "Tuesday and the machine went off like everything else. The cables behind the desk were " +
      "tidied up last month.",
    tell: "THE MACHINE IS ON THE SURGE-ONLY ROW. The two banks are inches apart, identical to " +
      "look at, and every plug fits both — so a tidy-up moves a lead one row down and nothing " +
      "says anything. A self-test only tests the battery, not what is plugged into it, which " +
      "is why this passes every check and fails the only thing it was bought for." },
  { key: "printer",
    said: "It used to give them a quarter of an hour and now it gives them under a minute. It " +
      "does it when the printer is waking up — you can hear the printer click and the UPS " +
      "starts beeping.",
    tell: "THE LASER PRINTER IS ON THE BATTERY ROW. A fuser pulls more on warm-up than the " +
      "whole rest of the desk put together, so the runtime collapses exactly when the printer " +
      "warms up. The clue is that it is tied to an EVENT rather than to time — an aged battery " +
      "is short all the time, this one is short on cue." },
  { key: "breaker",
    said: "Completely dead. Nothing on either row has power, no lights, and it is not even " +
      "beeping. Somebody had plugged a fan heater into the back of it to save a socket.",
    tell: "THE INPUT BREAKER HAS TRIPPED, and the button is on the back beside the inlet. " +
      "Dead on BOTH rows is the tell: a flat battery still passes mains through to the sockets, " +
      "so nothing at all means the input has been cut. Press it back in before condemning the " +
      "unit — this is the commonest reason a perfectly good UPS goes in a skip." },
  { key: "va",
    said: "A 650 VA unit, bought last week. It alarms and reads overload the moment the machine " +
      "starts doing anything, and the machine draws about 400 watts.",
    tell: "IT WAS BOUGHT ON ITS VA NUMBER. 650 VA at a power factor of 0.6 is about 390 watts " +
      "of real output, so a 400 watt machine is over it before anything else is plugged in. " +
      "Nothing has failed: it was 40% too small on the day it arrived, and the box did not " +
      "lie — it just did not answer the question the buyer was asking." },
  { key: "wall",
    said: "It transfers to battery several times a day for a second or two, and the lead runs " +
      "to a four-way surge strip under the desk because there is only one socket on that wall.",
    tell: "A UPS GOES STRAIGHT INTO THE WALL. It already contains surge suppression, so the " +
      "strip is a second set of clamping components in the way of the waveform the UPS is " +
      "reading to decide when to transfer — and the strip's breaker is sized for a load rather " +
      "than for a UPS's charging inrush. Nuisance transfers are what that looks like." },
  { key: "battery",
    said: "Four years old, in a cupboard that gets warm. The self-test now fails and it gives " +
      "them about two minutes where it used to give twenty. Everything is plugged in exactly " +
      "as it always was.",
    tell: "THE BATTERY HAS AGED OUT. Three to five years is the working life of a sealed lead " +
      "cell and heat shortens it — a warm cupboard is not scene-setting, it is the reason it " +
      "is at the short end. Nothing has been moved and the failure is proportional rather than " +
      "sudden, which is what separates aging from every wiring fault on this list." }
];

export const UPS_OPTS = [
  { key: "wrongrow", label: "The machine is on the surge-only row, not the battery row" },
  { key: "printer",  label: "A laser printer is on the battery row, flattening it on warm-up" },
  { key: "breaker",  label: "The input breaker has tripped — press it back in" },
  { key: "va",       label: "It was bought on its VA number, so it is undersized in watts" },
  { key: "wall",     label: "The UPS is on a surge strip instead of straight into the wall" },
  { key: "battery",  label: "The battery has aged out and needs replacing" },
  { key: "psu",      label: "The computer's own power supply has failed" },
  { key: "outlet",   label: "The wall outlet itself is dead" }
];
