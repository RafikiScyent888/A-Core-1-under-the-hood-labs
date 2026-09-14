/* =====================================================================
   TWELVE SCENARIOS FOR THE TWO DISPLAY BENCHES.

   Six on panel choice, six on the meeting room projector.

   THE PANEL SIX ARE ALL THE SAME QUESTION AND ALL DIFFERENT ANSWERS.
   "Which panel?" turns on exactly three properties — how the colour
   holds OFF-AXIS, how black the black is, and whether anything stays on
   screen long enough to burn in — and a brief names one of them in
   passing while talking about something else. Who is sitting where, how
   dark the room is, and what is on the screen at four in the afternoon
   are the three sentences that decide it, and none of them sounds like
   a specification when the customer says it.

   THE PROJECTOR SIX ARE ALL HEAT, EXCEPT THE TWO THAT ARE NOT, and the
   ones that are heat are told apart by WHEN and by SOUND. A blocked
   filter roars and takes twenty minutes; a dead fan is silent and takes
   three. The discriminator is never the symptom — every one of them is
   reported as "the projector keeps turning itself off" or "it has gone
   dim" — it is the timing, the noise, and what changed.
   ===================================================================== */

/* ---- which panel, and the sentence that decides it ------------------ */
export const PANEL_CASES = [
  { key: "ips",
    said: "It is the reception desk. There are two of them on that desk and they sit either " +
      "side of it, and they both need to see the booking screen without getting up.",
    tell: "TWO PEOPLE, ONE SCREEN, NEITHER OF THEM SQUARE IN FRONT OF IT. That is a viewing " +
      "angle requirement and nothing else in the brief competes with it. IPS holds colour and " +
      "brightness across the cone; TN is the panel that washes out the moment you are off " +
      "centre, which does not matter for one person and matters completely for two." },
  { key: "oled",
    said: "It is the edit suite and they keep the lights off in there. The complaint about the " +
      "old one was that dark scenes came out grey and lifted. Nothing sits still on it for " +
      "more than a few seconds.",
    tell: "A DARK ROOM MAKES BLACK THE SPECIFICATION. Every LCD here makes black by shutting a " +
      "shutter in front of a lamp that is still lit, so black is dark grey and it shows in a " +
      "dark room. An OLED switches the pixel off. The line about nothing sitting still is the " +
      "permission slip: burn-in is what would otherwise rule it out." },
  { key: "tn",
    said: "Six machines for the esports practice room. One player square in front of each, and " +
      "they talk about nothing but frames. The budget is what it is.",
    tell: "ONE PLAYER, SQUARELY IN FRONT, AND RESPONSE TIME IS THE ONLY PROPERTY NAMED. That is " +
      "the narrow case where TN's weakness costs nothing: there is nobody off-axis to see it " +
      "wash out. Six of them makes the price a real requirement rather than a preference." },
  { key: "va",
    said: "The waiting room, in the dim corner by the window. It plays films all day and the " +
      "seats are in a row facing it.",
    tell: "DIM ROOM, MOVING PICTURE, AUDIENCE IN FRONT OF IT. Blacks matter, so TN and IPS are " +
      "out; the content moves, so nothing will burn in — but it is a waiting room rather than " +
      "a grading suite, and VA delivers most of the black for a fraction of the money. Angles " +
      "are middling and the seats are facing it." },
  { key: "ips",
    said: "A schedule board for the corridor outside the theatres. Same layout on it from seven " +
      "in the morning until eight at night, and people read it walking past.",
    tell: "READ WHILE WALKING PAST MEANS OFF-AXIS, AND THE SAME LAYOUT ALL DAY RULES OUT OLED. " +
      "Two constraints in two sentences, pulling in opposite directions: the angle requirement " +
      "kills TN and the static image kills the OLED that would otherwise have won on it. IPS " +
      "is what is left, and it is what is left for a reason." },
  { key: "va",
    said: "The control room wall. Sixteen camera feeds in a fixed grid, twenty-four hours a " +
      "day, and the room is kept dark so the operators can see the feeds.",
    tell: "A FIXED GRID THAT NEVER MOVES IS THE BURN-IN CASE, so however good it looks on paper " +
      "the OLED is the one panel you must not fit. Dark room still wants the deepest black of " +
      "what is left, and the operators sit in front of it, so VA takes it from IPS. Night " +
      "footage on a lifted black is a camera you cannot see out of." }
];

export const PANEL_OPTS = [
  { key: "tn",   label: "TN — fastest response, cheapest, and it washes out off-axis" },
  { key: "va",   label: "VA — the deepest black of the LCDs, angles in between" },
  { key: "ips",  label: "IPS — colour and brightness hold from anywhere in the room" },
  { key: "oled", label: "OLED — black is the pixel switched off, and it can burn in" },
  { key: "qled", label: "QLED — a backlit LCD with a quantum-dot film for wider colour" },
  { key: "eink", label: "E-ink — no backlight, holds its image with no power at all" },
  { key: "hz",   label: "Any panel will do — specify a higher refresh rate instead" },
  { key: "cal",  label: "Any panel will do — calibrate it properly once it arrives" }
];

/* ---- the projector: when it happens, and what it sounds like -------- */
export const PROJ_CASES = [
  { key: "filter",
    said: "It has got gradually dimmer over the last few months and now it shuts itself off " +
      "about twenty minutes into a meeting. It is noisy — you can hear it over the talking. " +
      "Nobody has ever cleaned anything on it.",
    tell: "A BLOCKED FILTER, AND THE TWO SYMPTOMS ARE ONE STORY. Restricted airflow runs the " +
      "lamp hot, which ages it faster — that is the dimming — until the thermal cut-out trips, " +
      "which is the shutdown. Twenty minutes and LOUD is the signature: the fan is working " +
      "hard and still losing. This is maintenance, not a repair." },
  { key: "fan",
    said: "It goes off about three minutes after switching on, from cold, every time. Somebody " +
      "said it used to whirr and now it does not make a sound.",
    tell: "THE FAN HAS FAILED, AND THE TELL IS SILENCE. Same thermal cut-out, same complaint " +
      "from the user, completely different part and completely different price. Three minutes " +
      "from cold means there is no cooling at all rather than not enough of it — and a " +
      "projector that has gone QUIET has lost the only moving part it has." },
  { key: "lamp",
    said: "They say it has faded over the last two years and the picture looks yellow now. It " +
      "runs happily all day and has never shut down. The counter on the menu reads 2,840 hours.",
    tell: "THE LAMP HAS AGED OUT, AND THE COUNTER IS THE EVIDENCE. No shutdown at all is what " +
      "separates this from every heat story on the list: dimming WITHOUT a thermal trip is a " +
      "consumable reaching the end of its life. Lamps lose brightness and shift yellow " +
      "gradually, so nobody notices until half of it is gone. Read the hours before quoting." },
  { key: "vent",
    said: "It was fine for three years. Last month it was moved into the AV cupboard to tidy " +
      "the room up. Now it shuts down in the afternoon, and it is worse on a warm day.",
    tell: "IT IS BREATHING ITS OWN EXHAUST. Intake one side, exhaust the other, and in a closed " +
      "cupboard the hot air goes straight back in. The filter is clean and the fan is fine — " +
      "what changed is the room. “It was fine until we moved it” is the whole diagnosis, and " +
      "worse on a warm day confirms it." },
  { key: "keystone",
    said: "Newly mounted on the bracket above the whiteboard. The picture is bright and sharp " +
      "and it is not a rectangle — it is wider along the top than along the bottom.",
    tell: "THAT IS KEYSTONE, AND IT IS NOT A FAULT. A projector throwing upward or downward at " +
      "an angle puts the far edge of the image further away, so that edge lands bigger. Bright " +
      "and sharp rules out every lamp and heat answer on the list. Fix it at the mount if you " +
      "can, and with the keystone correction if you cannot — correcting it in software throws " +
      "pixels away, which is why the bracket is the better answer." },
  { key: "lens",
    said: "One corner of the picture is soft and there is a grey smudge in the middle of it. " +
      "The rest of the screen is fine. It happened after the room was redecorated.",
    tell: "THE LENS — DIRTY, AND KNOCKED OUT OF FOCUS. A fault in the image PATH is uniform: a " +
      "dying lamp dims the whole picture and a failing panel marks the whole picture. Damage " +
      "that is in ONE PART of the image and nowhere else is on the glass in front of it. " +
      "Decorators, dust sheets and a ladder is how a lens gets knocked." }
];

export const PROJ_OPTS = [
  { key: "filter",   label: "A blocked intake filter — it is cooking itself" },
  { key: "fan",      label: "The cooling fan has failed" },
  { key: "lamp",     label: "The lamp has aged out — check the hours counter" },
  { key: "vent",     label: "It is boxed in and re-breathing its own exhaust" },
  { key: "keystone", label: "It is mounted off-axis — that is keystone, not a fault" },
  { key: "lens",     label: "The lens is dirty, or has been knocked out of focus" },
  { key: "source",   label: "The laptop is sending a weak signal" },
  { key: "bulb",     label: "Somebody has fitted the wrong lamp assembly" }
];
