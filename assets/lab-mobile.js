/* =====================================================================
   Device & Mobile — phones and tablets, inside and out.

   SCOPE WAS SET DELIBERATELY. Phones and tablets are the core. Laptops
   appear ONLY for faults that are mobile-specific and that the Field
   Service Center does not already cover: swollen cells, digitizers,
   sync and enrolment. General laptop repair is the FSC's job and must
   not be duplicated here.

   THE MECHANISM IS THE DISPLAY STACK. "Digitizer or LCD" is the single
   most common mobile call and students guess at it, because from the
   outside a dead touch layer and a dead panel look identical. So the
   mechanism view takes the stack apart layer by layer — cover glass,
   digitizer, panel, backlight — and shows which symptom each layer
   produces when it fails. After that the test is obvious: does the
   screen still SHOW anything, and does it still FEEL anything.

   SAFETY IS GRADED. A swollen cell is the one fault here that can hurt
   somebody, and mishandling it ends the scenario rather than costing a
   mark.
   ===================================================================== */
import { rng } from "./rng.js";
import { mobileBench, layerWords, LAYERS, layersFor } from "./bench-mobile.js";

/* ------------------------------------------------------------------
   The display stack, outside in. Each layer says what fails and what
   that looks like — the defect is generated FROM the layer, so a
   symptom can never name a layer this table does not blame.
   ------------------------------------------------------------------ */
export const STACK = [
  /* GLASS AND DIGITIZER ARE ONE ENTRY, because they are one part.

     This table used to list them separately and offer "cover glass" as a
     thing you could order. On the standard build today you cannot: the
     touch sensor is bonded to the underside of the cover glass and the
     two are sold together. A student who learns to quote for glass alone
     quotes for a part that does not exist.

     What still separates the two SYMPTOMS is which half has failed, and
     that is worth keeping \u2014 cracked-but-working and working-but-numb are
     different observations. They just have the same answer. */
  { key: "glass", at: 1, name: "Cover glass and digitizer",
    does: "Takes the knocks, and senses your finger. Two jobs, one bonded part \u2014 the glass " +
      "protects and the touch grid laminated under it reports where you pressed.",
    fails: "Cracked or spidered while the picture is perfect; or the picture is perfect and " +
      "part of the screen ignores touch. Either way it is this assembly.",
    tell: "Damage you can see, or touch that has died, with the IMAGE unaffected. The image " +
      "is the panel's job, and the panel is a separate part underneath.",
    part: "cover glass and digitizer assembly" },
  { key: "lcd", at: 3, name: "Display panel",
    does: "Makes the image. Nothing to do with touch.",
    fails: "Black patches, spreading ink blots, or lines across the picture — while touch still registers where you press.",
    tell: "Touch still works, so the sensing layer is alive. The image is what has gone.",
    part: "display panel" },
  { key: "backlight", at: 4, name: "Backlight",
    does: "Lights the panel from behind. Without it the image is still being drawn, just not lit.",
    fails: "The screen looks black — but under a bright torch at an angle you can see the picture faintly, and touch still works.",
    tell: "The torch test is the whole diagnosis. An image that is there but unlit is a backlight, not a panel.",
    part: "backlight or its driver" }
];

/* ------------------------------------------------------------------
   Faults. `where` says whether it is hardware, software or the user's
   configuration — the triage question every one of these starts with.
   ------------------------------------------------------------------ */
export const FAULTS = {
  digitizer: { name: "Touch does not respond in one area", where: "hardware", stack: "glass",
    said: "the top half of the screen has stopped responding but I can still see everything fine",
    fix: "Replace the glass-and-digitizer assembly. There is no digitizer to buy on its own \u2014 " +
      "it is bonded to the glass. On an LCD the panel underneath is reused; on an OLED the " +
      "panel is bonded in too and goes with it." },
  /* THE MOST COMMON PHONE REPAIR THERE IS, AND IT WAS NOT IN THE TABLE.

     The bench has been able to draw a smashed front since the fracture
     was built from the owner's photograph — an impact knot with radials
     and concentric rings, 237 primitives, with `checkCracksStayOnTheGlass`
     holding it onto the layer it belongs to. `mobileBench` takes
     `cracked`. Three places in this lab pass it. All three computed it as
     `faultKey === "glass"`, and there has never been a fault called
     "glass": the table's nine keys are backlight, battery, charge,
     digitizer, drain, lcd, mdm, signal and sync.

     So the condition was false on every seed that has ever run, and the
     whole cracked-screen model was unreachable. Nothing failed. The
     geometry check passed, because the geometry was fine. The variant
     counter passed, because it does not look at bench flags. WRITTEN AND
     REACHABLE ARE DIFFERENT CLAIMS, and this is the sharpest case of it
     in the build: a part that is drawn, verified and invisible.

     `digitizer` was NOT the missing case and must not be repurposed as
     it. That one is touch dead in an area with the picture perfect —
     a different fault, a different tell, and its own answer. A smashed
     front is its own scenario and it is the one a student will meet more
     than all the others put together. */
  cracked: { name: "Front glass smashed, display still working", where: "hardware", stack: "glass",
    said: "I dropped it on the drive and the front is in bits, but I can still see everything and it still rings",
    fix: "Replace the glass-and-digitizer assembly. On an LCD the panel underneath is reused, " +
      "which is the cheaper job; on a bonded OLED the panel goes with it and the price roughly " +
      "doubles. Quote the right one — that difference is the whole conversation with the " +
      "customer, and getting it wrong loses the job either way." },
  lcd: { name: "Black patch spreading across the picture", where: "hardware", stack: "lcd",
    said: "there is a black blotch that started small and is getting bigger, but it still knows where I am tapping",
    fix: "Replace the display panel. The blotch is physical damage to the panel and it will keep spreading." },
  backlight: { name: "Screen appears dead but the device is running", where: "hardware", stack: "backlight",
    said: "the screen is black but it still rings and I can answer it by swiping where the button usually is",
    fix: "Backlight or its driver. Confirm with a torch before ordering a whole screen." },
  battery: { name: "Swollen battery", where: "hardware", stack: null,
    said: "the screen is lifting away from the case at one corner and it rocks when I put it on the desk",
    fix: "Stop. Isolate it, do not charge it, and dispose of it as hazardous waste." },
  charge: { name: "Charges only at a certain angle", where: "hardware", stack: null,
    said: "it only charges if I hold the cable just so, and it has got worse over a few weeks",
    fix: "Test with a known-good cable and charger first, then the port. Worn ports and frayed cables look identical from the outside." },
  drain: { name: "Battery flat by lunchtime", where: "software", stack: null,
    said: "it used to last all day and now it is dead by one o'clock, and it gets warm in my pocket",
    fix: "Battery usage by app first. A single app holding a wake lock is far more common than a worn cell." },
  sync: { name: "Company mail will not sync", where: "config", stack: null,
    said: "my personal mail works fine but the work account just spins and never gets anything",
    fix: "Server, port, SSL and authentication. One account working proves the network and the device are fine." },
  mdm: { name: "Cannot enrol in the company system", where: "config", stack: null,
    said: "IT sent me a link to get set up and it fails at the last step every time",
    fix: "Enrolment usually fails on an unmet prerequisite: OS version, passcode policy, or encryption not enabled." },
  signal: { name: "No mobile signal in one building", where: "hardware", stack: null,
    said: "it is fine outside and useless the moment I walk into the warehouse",
    fix: "Coverage, not fault. Wi-Fi calling or a femtocell — nothing is broken." }
};

const PEOPLE = [
  { who: "a district nurse",        device: "tablet" },
  { who: "a site foreman",          device: "phone" },
  { who: "a delivery driver",       device: "phone" },
  { who: "a school office manager", device: "tablet" },
  { who: "a sales rep",             device: "phone" }
];

/* Laptops appear ONLY for these two, which are mobile faults the Field
   Service Center does not cover. */
const LAPTOP_OK = ["battery", "sync", "mdm"];

const NOISE = [
  "I dropped it about a month ago but it seemed fine.",
  "My daughter has the same one and hers is OK.",
  "It is out of warranty, I checked.",
  "I have already tried turning it off and on again.",
  "Somebody said I should just factory reset it."
];


/* =====================================================================
   diagnose — the battery half of the Core 1 Device Issue Diagnosis Lab.

   Source: `Core-1-Sims/Device Issue Diagnosis.html`, devices 1 and 5.
   Six of that sim's ten devices are screens and went to the display
   lab's `diagnose`; two are phone batteries and belong here. The shape
   is the same on both sides, deliberately: name the ISSUE, then name the
   SOLUTION, and both have to be right.

   Batteries are where this pairing earns its keep, because three of the
   scenarios below have the same symptom and three different fixes, and
   one of them has no fault at all. "Replace the battery" is the answer
   people reach for and it is wrong more often than it is right.

   Seven scenarios: the owner's two plus the standing five more.
   ===================================================================== */
const MDX_ISSUES = {
  worn:     { label: "The cell is worn out",
              is: "Charge that disappears far faster than it used to, with the device cool and the charger proved good. It is age and cycles, and the health figure says so." },
  swollen:  { label: "The cell has swollen",
              is: "The case no longer closes, the screen or back is lifted, and there may be a sweet chemical smell. It is a safety problem before it is a repair." },
  gauge:    { label: "The charge gauge has lost calibration",
              is: "The PERCENTAGE is wrong rather than the charge — it jumps, or reads full and then dies, and it disagrees with itself. The health figure is fine." },
  app:      { label: "Something running on the device is draining it",
              is: "Heat and drain even when nobody is using it, and one name at the top of the battery usage list that was not there last month." },
  port:     { label: "The charging port is damaged or full of lint",
              is: "Charging that depends on how the plug is held, and that behaves the same way with every cable and every adapter you try." },
  supply:   { label: "The supply cannot deliver the current the device asks for",
              is: "It charges, slowly or not at all, from one source and normally from another — and that other source charges different devices fine." },
  nofault:  { label: "Nothing is wrong with it",
              is: "The figures are healthy, the device is cool, and the usage explains the runtime completely. Not every complaint is a fault." },
  cable:    { label: "The cable or the adapter has failed",
              is: "It works with a different lead and fails with this one, every time, on any device." },
  board:    { label: "The charging circuit on the board has failed",
              is: "No charge at all from anything, with a port that is clean and undamaged and a cable proved on another device." }
};

const MDX_FIXES = {
  replacecell:  { label: "Replace the battery",
                  does: "Puts a new cell in. It is the right answer when the cell itself is the problem, and money wasted every other time." },
  isolate:      { label: "Stop using it, isolate it safely, then replace the cell",
                  does: "Treats it as the fire risk it is before treating it as a repair. Nothing else on this list starts by making the device safe." },
  recalibrate:  { label: "Run it flat, then charge it uninterrupted to full",
                  does: "Gives the gauge two known end points to measure between. It changes what the device REPORTS, not how much charge it holds." },
  removeapp:    { label: "Remove or restrict the application that is drawing the power",
                  does: "Stops the thing that is actually consuming the charge. Costs nothing and takes a minute." },
  replaceport:  { label: "Replace the charging port assembly",
                  does: "Renews the connector the cable plugs into. It is the answer when the fault follows the socket rather than the lead." },
  cleanport:    { label: "Clean the lint out of the charging port",
                  does: "Free, non-destructive, and the first thing to try on any port fault — a compacted plug of pocket lint stops a cable seating fully and looks exactly like a failed port." },
  bettersupply: { label: "Charge it from a supply that can deliver the current it asks for",
                  does: "Gives the device the current it is asking for instead of the trickle it is being offered." },
  showusage:    { label: "Show the user the screen-on time and talk about what they are using",
                  does: "Answers the complaint with the evidence. It is what to do when the device is behaving exactly as it should." },
  replacecable: { label: "Replace the cable and adapter",
                  does: "Renews the lead. Proved or cleared in under a minute by trying a different one." },
  replaceboard: { label: "Replace the main board",
                  does: "The most expensive answer available, and it has to be earned by ruling out the port, the cable and the supply first." },
  updateos:     { label: "Update the operating system",
                  does: "Worth doing, and it is a general remedy rather than an answer to a specific fault." }
};

const MDX_DEVICES = [
  /* --- the owner's two --- */
  { key: "m-worn", who: "Employee smartphone", swollen: false, health: 68, cycles: 940,
    said: ["“It goes from a full charge to under twenty percent in less than an hour, and I am " +
      "barely touching it.”",
      "“It is only ever slightly warm — never hot.”",
      "“We tried the charger and cable from a phone we know is fine and it made no difference.”"],
    issue: "worn", fix: "replacecell",
    wrongIssues: ["app", "gauge", "swollen", "port", "nofault"],
    wrongFixes: ["removeapp", "recalibrate", "replaceport", "updateos", "showusage"],
    tell: "Barely used, never hot, and a known-good charger changes nothing — so nothing is " +
      "consuming it and nothing is failing to fill it. At 940 cycles and 68% health the cell simply " +
      "cannot hold what it used to." },

  { key: "m-swollen", who: "Executive smartphone", swollen: true, health: 74, cycles: 610,
    said: ["“The back does not sit flush against the case any more.”",
      "“The screen looks slightly lifted along one side.”",
      "“There is a sweet sort of chemical smell when it is on charge.”"],
    issue: "swollen", fix: "isolate",
    wrongIssues: ["worn", "board", "port", "app", "gauge"],
    wrongFixes: ["replacecell", "replaceport", "replaceboard", "removeapp", "recalibrate"],
    tell: "A case that will not close, a lifted screen and a sweet smell are one fault and it is a " +
      "cell venting. It is a fire risk on the bench before it is a repair, so what you do FIRST is " +
      "make it safe.",
    note: "“Replace the battery” is not wrong about the part — it is wrong about the " +
      "order. A swollen cell is not to be pressed, punctured or charged, and the answer that does " +
      "not say so is the answer that gets somebody hurt." },

  /* --- the standing five more --- */
  { key: "m-gauge", who: "Field survey tablet", swollen: false, health: 96, cycles: 210,
    said: ["“It sits on a hundred percent for hours, then drops straight to nothing and " +
      "switches off.”",
      "“If I plug it in straight afterwards it comes back saying sixty percent.”",
      "“The battery health screen says ninety-six percent after two hundred and ten cycles.”"],
    issue: "gauge", fix: "recalibrate",
    wrongIssues: ["worn", "app", "port", "board", "swollen"],
    wrongFixes: ["replacecell", "removeapp", "replaceport", "replaceboard", "updateos"],
    tell: "A cell that really was empty does not come back at sixty percent a minute later. The " +
      "charge is there; the number is wrong — and 96% health at 210 cycles says the cell is " +
      "nearly new." },

  { key: "m-app", who: "Warehouse handset", swollen: false, health: 91, cycles: 300,
    said: ["“It is warm in my pocket and it is flat by lunchtime.”",
      "“Nobody is using it — it just sits there scanning now and then.”",
      "“The battery screen shows the new stock app at seventy percent, and that went on a " +
      "week ago.”"],
    issue: "app", fix: "removeapp",
    wrongIssues: ["worn", "gauge", "nofault", "supply", "board"],
    wrongFixes: ["replacecell", "recalibrate", "showusage", "bettersupply", "replaceboard"],
    tell: "Warm and draining while nobody touches it means something IS using it, and the battery " +
      "screen names it. The timing matches the week it was installed." },

  { key: "m-port", who: "Sales phone", swollen: false, health: 88, cycles: 400,
    said: ["“It only charges if I hold the plug at a particular angle.”",
      "“We tried three different cables and two different plugs — all the same.”",
      "“It lives in a jacket pocket and it has never been dropped.”"],
    issue: "port", fix: "cleanport",
    wrongIssues: ["cable", "board", "worn", "supply", "gauge"],
    wrongFixes: ["replacecable", "replaceboard", "replacecell", "bettersupply", "replaceport"],
    tell: "Three cables and two adapters behaving identically puts the fault on the device's side " +
      "of the connector. It lives in a pocket, which is where lint comes from — and a plug that " +
      "cannot seat fully behaves exactly like a broken port.",
    note: "Replacing the port is the right PART and the wrong first move. Clean it, then replace it " +
      "if cleaning does not fix it — free before soldered, every time." },

  { key: "m-supply", who: "Site engineer's phone", swollen: false, health: 93, cycles: 260,
    said: ["“It charges perfectly well from the mains plug at home.”",
      "“Plugged into the laptop it barely gains anything all afternoon, and sometimes it " +
      "goes DOWN while it is plugged in.”",
      "“A colleague charges their phone from that same laptop socket without any trouble.”"],
    issue: "supply", fix: "bettersupply",
    wrongIssues: ["port", "cable", "worn", "board", "app"],
    wrongFixes: ["replaceport", "replacecable", "replacecell", "replaceboard", "cleanport"],
    tell: "It charges properly from one source and not from another, and that other source charges " +
      "a different phone fine. Nothing is broken — this device asks for more current than that " +
      "socket will give, and while the screen is on it is spending it faster than it arrives." },

  { key: "m-nofault", who: "Loan phone", swollen: false, health: 97, cycles: 40,
    said: ["“It does not last the day and I think the battery is faulty.”",
      "“The battery screen says ninety-seven percent health after forty cycles.”",
      "“It also says nine hours of screen time yesterday, mostly video.”"],
    issue: "nofault", fix: "showusage",
    wrongIssues: ["worn", "gauge", "app", "supply", "board"],
    wrongFixes: ["replacecell", "recalibrate", "removeapp", "bettersupply", "updateos"],
    tell: "Ninety-seven percent health at forty cycles, and nine hours of video. There is no fault " +
      "here — the device did exactly what nine hours of screen costs. Replacing a healthy cell " +
      "would change nothing and the user would be back.",
    note: "This is the hardest one on the list and it is the most useful. The skill being tested is " +
      "knowing when to STOP, and a technician who cannot reach this answer replaces good parts." }
];


/* =====================================================================
   firststep — the Core 1 Mobile Device Troubleshooting Activity.

   Source: `Core-1-Sims/Mobile Device Troubleshooting Simulation.html`.
   Eight scenarios, each with a Most Likely Cause and a Best Next Step,
   and the owner's own note on it says exactly what it is teaching:

     "CompTIA-style troubleshooting rewards checking settings and
      configuration first, especially when Wi-Fi works and other phones
      have service."

   THAT IS A DIFFERENT SKILL FROM `diagnose` NEXT DOOR, and it is why
   both exist. `diagnose` asks what is wrong. This asks what you do
   FIRST — and on most of these, two or three of the wrong actions would
   also eventually fix it. Being right about the fault and wrong about
   the order still means an unnecessary part, an unnecessary visit, or
   in one case an unnecessary fire.

   So every wrong action here is answered with what it would actually
   achieve and why it is not first, rather than with "that is wrong".
   Several of them are things a technician SHOULD do — third.

   Thirteen scenarios: the owner's eight plus the standing five more.
   ===================================================================== */
const FS_CAUSES = {
  bgapps:    { label: "Background activity from apps running continuously",
               is: "Drain with the device idle, and a name at the top of the battery usage list that was not there last month." },
  powercfg:  { label: "Power-hungry settings left on — brightness, GPS, Bluetooth, 5G",
               is: "Steady drain proportional to how much is switched on, and it has always been like that rather than starting one day." },
  weaksig:   { label: "Poor signal, so the radio transmits at full power",
               is: "Drain that tracks WHERE the device is: bad in one building, fine outside it." },
  agedcell:  { label: "The cell is worn out with age and cycles",
               is: "Confirmed by the health figure, not guessed at. A cell reporting normal health is not this." },
  celloff:   { label: "Cellular data switched off, or the APN misconfigured",
               is: "Wi-Fi works, mobile data does not, and the fault travels with the device rather than with the place." },
  airplane:  { label: "Airplane mode on, or the cellular radio disabled",
               is: "Everything wireless is off at once, which is easy to see and easy to rule out." },
  simfault:  { label: "The SIM is unseated, disabled or not provisioned",
               is: "Usually announced — no service indicator, or a message about the SIM — rather than silent." },
  carrier:   { label: "A carrier outage",
               is: "Everyone on that carrier in that area loses service together. One device failing alone is not an outage." },
  rotlock:   { label: "Rotation lock is on",
               is: "The screen refuses to turn and everything else about the display is perfect. It is a switch, and somebody flicked it." },
  approt:    { label: "An app or accessibility setting is overriding auto-rotate",
               is: "It rotates in some apps and not others, which is the tell that separates this from a lock or a sensor." },
  sensor:    { label: "The accelerometer or gyroscope has failed",
               is: "Nothing that depends on orientation works — not rotation, not the level, not the step counter." },
  osglitch:  { label: "A display service glitch after an update",
               is: "It worked before the update and not after, and it comes back after a restart." },
  swollen:   { label: "A swollen lithium cell is pushing the case apart",
               is: "A case that will not sit flat, a trackpad that has gone stiff, a back that is bowed. It is a safety problem before it is a repair." },
  hinge:     { label: "Hinge damage flexing the case",
               is: "The lid is the part that is wrong, and it shows when the lid is moved rather than when the machine sits still." },
  warped:    { label: "The chassis has warped from heat",
               is: "Rare, gradual, and it does not make a trackpad harder to press — which is what a cell pushing up from underneath does." },
  lcdcable:  { label: "The internal display cable is unseated",
               is: "External video is perfect and the built-in panel is dark. The picture is being made; it is not getting to the panel." },
  backlight: { label: "The backlight or its inverter has failed",
               is: "A panel that is dark but still drawing — a torch held at an angle finds the image." },
  gpufail:   { label: "The graphics processor has failed",
               is: "No video anywhere, internal or external. An external monitor that works rules this out completely." },
  brightzero:{ label: "Brightness is at zero, or the output is toggled to external only",
               is: "The cheapest possible explanation for a dark laptop panel, and it costs ten seconds to eliminate." },
  burnin:    { label: "Permanent burn-in from a static image",
               is: "A ghost that survives a restart AND an extended period switched off. Time and power cycling are what separate it from retention." },
  retention: { label: "Temporary image retention",
               is: "A ghost that fades on its own within minutes to hours. If it has already survived a night off, it is not this." },
  filmart:   { label: "A screen protector or film is causing the artefact",
               is: "It moves when you press the surface, and it comes off with the film." },
  wronginput:{ label: "The display is on the wrong input",
               is: "It powers up, says so, and is listening to a socket with nothing on it." },
  resmismatch:{ label: "The resolution or refresh rate is one the display cannot take",
               is: "The display reports out of range rather than no signal — a different message, and a different fault." },
  cableloose:{ label: "The video cable or adapter is loose or damaged",
               is: "Intermittent, and it follows the cable when you move it onto another machine." },
  antenna:   { label: "The Wi-Fi antenna leads were not reconnected",
               is: "Wireless that worked before a repair and not after, on a machine whose antennas run through the part that was replaced." },
  nicloose:  { label: "The wireless card is not seated",
               is: "The adapter disappears from the device list entirely, rather than being present and finding nothing." },
  wifioff:   { label: "Wireless is switched off, or airplane mode is on",
               is: "Free to check and the first thing to eliminate on anything wireless." },
  routerdown:{ label: "The access point or router has failed",
               is: "Everything on that network loses it at once. One machine failing alone is not this." },
  storagefull:{ label: "Storage is full",
               is: "Applications refuse to install or save, photographs will not take, and updates stall. It is a number you can look at." },
  overheat:  { label: "The device is thermally throttling",
               is: "It slows down when it is hot and recovers when it cools, and it is warm to the touch while it is happening." },
  mdmpolicy: { label: "A management policy is blocking it",
               is: "It fails the same way on every managed device and works on an unmanaged one." },
  digitizer: { label: "The digitizer has failed",
               is: "The picture is perfect and the touch is not — which is why a stylus or a mouse tells you in seconds." },
  chargeport:{ label: "The charging port is damaged or full of lint",
               is: "Charging that depends on the angle of the plug, and behaves the same with every cable you try." },
  /* FIVE CAUSES THE REBUILT PANEL EARNED. Until the LCD layer became a
     real five-sheet module with two driver ledges, none of these had
     anywhere on the bench to be pointed at, and a student who said any
     of them was pointing at a flat slab. New content earned by a model
     is the good kind of five-more. */
  sourcedrv: { label: "The source driver on the panel's bottom edge has failed",
               is: "A band or a dead line running DOWN the picture \u2014 a column with nothing driving it \u2014 in the same place every time, with the rest of the picture perfect." },
  gatedrv:   { label: "The gate driver down the panel's side edge has failed",
               is: "A band or a dead line running ACROSS the picture \u2014 a row with nothing switching it. The DIRECTION is the whole difference from the driver at the bottom." },
  crystal:   { label: "Liquid crystal displaced by pressure inside the panel",
               is: "A dark blot with a soft edge that started at a pressure point and is spreading. Only an LCD can do this; an OLED has no liquid in it to move." },
  deadsub:   { label: "A few dead transistors \u2014 dead subpixels",
               is: "A handful of permanent dots that do not move, do not spread, and are invisible on anything but a plain field. Each one is a transistor on the glass, and there is nothing there to reach." },
  polfilm:   { label: "The front polariser has been lifted or damaged",
               is: "A cloudy or rainbow patch that changes as the device is tilted, because it is ON the surface rather than IN the picture." },
  /* FIVE THE PROTECTION BOARD EARNED. A battery was a pouch on this bench
     until the board went on it, and every one of these is a fault of the
     BOARD rather than of the cell — which is the distinction that stops a
     technician condemning a perfectly good cell. */
  protripped:{ label: "The protection board has tripped and latched off",
               is: "The pack reads zero volts at its connector and is stone dead, after being left flat for weeks. The CELL may be fine; the board has cut it off to stop it being drained below the point where it is dangerous to recharge." },
  ntcopen:   { label: "The thermistor line is open, so charging is refused",
               is: "It will not charge at all, on any charger, while the pack itself measures healthy \u2014 because the phone cannot read the cell's temperature and refuses rather than guess." },
  weakweld:  { label: "A tab weld has gone high-resistance",
               is: "Full charge on the gauge and the device cuts out the moment something DRAWS \u2014 the flash, the radio, a game. The pack is fine at rest and collapses under load." },
  noprotect: { label: "An aftermarket pack with no protection board",
               is: "A cheap replacement that charges, gets hot doing it, and starts to swell within weeks. What is missing is not capacity, it is the board." },
  dented:    { label: "The cell was dented getting it out",
               is: "A crease or a dimple in the foil that was not there before the job, on a pack that came out hard. It is scrap from that moment on, whatever it measures." }
};

const FS_ACTIONS = {
  reviewusage: { label: "Open battery usage and restrict the top-draining app",
                 does: "Free, reversible, and it names the culprit rather than guessing at it." },
  lowerradios: { label: "Lower the brightness and switch off the radios that are not in use",
                 does: "Free and instant, and it is the right answer when the settings are the cause rather than when something is misbehaving." },
  powersave:   { label: "Turn on power saving mode and restart",
                 does: "Masks a drain rather than finding it. Useful to get a user through the day; useless as a diagnosis." },
  replcell:    { label: "Replace the battery",
                 does: "The right answer when the cell is worn, and money spent for nothing when the health figure says it is not." },
  verifycell:  { label: "Check airplane mode is off and cellular data is on, then the APN",
                 does: "Free, takes a minute, and settles the most common cause before anything is opened or replaced." },
  reseatsim:   { label: "Power off, reseat the SIM, and retest",
                 does: "Cheap and quick, and it is second rather than first — it needs the device switched off, and a setting does not." },
  resetnet:    { label: "Reset the network settings",
                 does: "Clears saved networks, pairings and APNs along with the fault. It fixes things, and it costs the user everything they had configured." },
  callcarrier: { label: "Contact the carrier about provisioning and outages",
                 does: "The right move once the device is cleared, and a waste of everyone's time before it." },
  disablelock: { label: "Switch rotation lock off and retest",
                 does: "One tap. If it is the answer the job is over; if it is not, you have ruled it out for nothing." },
  safemode:    { label: "Restart and test without third-party apps",
                 does: "Separates the device from what is installed on it. Free, and slower than checking a switch." },
  sensordiag:  { label: "Run the sensor diagnostics and recalibrate",
                 does: "Tests the hardware. It is where you go once the settings are ruled out, not before." },
  updateos:    { label: "Install the pending updates and retest",
                 does: "Sometimes fixes it, always changes several things at once, and makes the next test harder to interpret." },
  powerdown:   { label: "Power it down, disconnect it, and take it out of service",
                 does: "The only correct FIRST action on a cell that is venting. Everything else on the list assumes it is safe to keep working on it." },
  keepusing:   { label: "Keep using it until the next maintenance window",
                 does: "Leaves a swelling lithium cell in a bag with a charger in it. This is the answer that gets somebody hurt." },
  reseatlive:  { label: "Open it up and reseat the internals with the machine running",
                 does: "Works on a live board and near a compromised cell. Two separate ways to be badly wrong at once." },
  rundiag:     { label: "Run the hardware diagnostics to confirm it",
                 does: "Sensible on almost anything, and it means leaving the machine powered while you do it." },
  checkbright: { label: "Turn the brightness up and toggle the display output key",
                 does: "Ten seconds, costs nothing, and eliminates the single most common cause of a dark laptop panel." },
  inspectcable:{ label: "Open it and reseat the internal display cable",
                 does: "The right answer once the free checks are done — it is the most common cause after brightness, and it is where a repair actually starts." },
  replpanel:   { label: "Replace the display assembly",
                 does: "Fixes a dead panel and is the most expensive thing on the list. It has to be earned by ruling out the cable." },
  replboard:   { label: "Replace the system board",
                 does: "The end of the line, and an external monitor that works already rules the graphics out." },
  pixelrefresh:{ label: "Run the pixel refresh or display conditioning routine",
                 does: "Clears image RETENTION. It does nothing for burn-in, and running it is how you prove which one you have." },
  shortertimeout:{ label: "Drop the brightness and shorten the screen timeout",
                 does: "Prevents the next one. It does not remove the one already there." },
  repldisplay: { label: "Replace the display",
                 does: "The only thing that removes permanent damage, and worth being sure it is permanent first." },
  selectinput: { label: "Select the right input on the display and retest",
                 does: "Free, immediate, and the first thing to do on any No Signal." },
  lowerres:    { label: "Mirror the displays and drop the resolution, then retest",
                 does: "The fix for a resolution the display cannot take, which reports out of range rather than no signal." },
  reseatcable: { label: "Reseat or swap the video cable and adapter",
                 does: "A minute's work, and it comes after the input because the input costs no work at all." },
  knowngood:   { label: "Test with a known-good device to isolate the display",
                 does: "Proper isolation, and it means fetching another machine. Do it when the quick checks have not settled it." },
  inspectant:  { label: "Reconnect the Wi-Fi antenna leads in the hinge",
                 does: "The right answer when wireless stopped at a repair, because the antennas run through the part that came off." },
  reseatnic:   { label: "Reseat the wireless card",
                 does: "Worth doing, and the card is not what was disturbed — the display assembly was." },
  enablewifi:  { label: "Check wireless is on and airplane mode is off",
                 does: "Free, and it stays first even when a repair has obviously caused the fault, because it costs nothing to be sure." },
  freespace:   { label: "Clear space and retest",
                 does: "Free, and it is the answer when a number on a settings screen is the whole story." },
  coolretest:  { label: "Let it cool, then retest",
                 does: "Costs nothing but time, and it proves or clears heat without touching anything." },
  checkmdm:    { label: "Check the management policy for the device",
                 does: "Free to look at, and it explains faults that no amount of hardware work will." },
  stylustest:  { label: "Test with a stylus or a connected mouse",
                 does: "Separates the picture from the touch in seconds, without opening anything." },
  cleanport:   { label: "Clean the charging port out",
                 does: "Free, non-destructive, and it fixes a surprising share of ports that look broken." },
  testpattern: { label: "Put a full white and a full black test pattern on the screen",
                 does: "Free, and it is the only thing that settles the two questions a display fault turns on: which WAY the fault runs, and whether it is there every single time. Naming a part before this is guessing." },
  angleinspect:{ label: "Look across the screen at a shallow angle under a light",
                 does: "Free, and it separates a mark ON the surface from a fault IN the picture \u2014 surface damage moves as your eye moves and picture damage does not." },
  removefilm:  { label: "Take the screen protector off and look again",
                 does: "A minute, and it eliminates the cheapest explanation for almost any mark on a screen. A damaged film mimics panel damage exactly and costs nothing to rule out." },
  torch:       { label: "Shine a torch across the screen at an angle",
                 does: "Ten seconds, and it splits a dead backlight from a dead panel \u2014 the difference between a cheap part and an expensive one. It says nothing at all about a picture that is already visible." },
  quotescreen: { label: "Quote for a complete screen assembly",
                 does: "The honest end point when the fault is bonded into the panel and nothing on the bench can reach it. It is right only after the free tests have ruled out everything that is not." },
  measurepack: { label: "Measure the pack at its connector before condemning it",
                 does: "Two minutes with a meter, and it separates a dead CELL from a protection board that has latched off \u2014 which look identical from the outside and cost very different money." },
  wakepack:    { label: "Leave it on the charger and watch for it to wake",
                 does: "Costs nothing but time. A latched pack often comes back when the charger presents a voltage the board will accept; one that never does is a cell." },
  loadtest:    { label: "Put a load on the pack and watch the voltage under it",
                 does: "The only test that finds a joint that is fine at rest and collapses under current. A resting voltage says nothing about a bad weld." },
  checkntc:    { label: "Check the thermistor pin against the cell's own temperature",
                 does: "Proves or clears the third pin. It is why the connector is a three-way, and an open one stops charging on a pack that is otherwise perfect." },
  genuinepack: { label: "Fit a pack with a protection board and quote for it",
                 does: "The right answer when what was fitted has no board. It is more expensive than the thing that was fitted, and that is the point of it." },
  scrapcell:   { label: "Scrap the damaged cell and fit a new one",
                 does: "The only answer to a dented pouch. A crease is a compromised separator, and it does not matter what it measures today." }
};

/* `said` is the report with the deciding detail inside it. `first` is the
   action that comes first; `wrongActions` are five that a technician
   might really do, most of which would work eventually. */
const FS_CASES = [
  /* --- the owner's eight --- */
  { key: "f-battery", who: "Phone — rapid battery drain",
    said: ["“The battery goes down very fast during a normal day.”",
      "“There is no damage to it and the battery health screen says it is fine.”"],
    cause: "bgapps", first: "reviewusage",
    wrongCauses: ["agedcell", "powercfg", "weaksig", "overheat", "storagefull"],
    wrongActions: ["replcell", "powersave", "lowerradios", "resetnet", "updateos"],
    tell: "Health normal rules out the cell, and normal daily use rules out the settings having " +
      "changed. What is left is something running that should not be, and the battery usage " +
      "screen names it for free.",
    order: "Identify the drain before replacing anything. The usage screen is free and specific; " +
      "a battery is neither." },

  { key: "f-data", who: "Phone — no cellular data",
    said: ["“It is fine on the office Wi-Fi.”",
      "“The moment I leave the building there is no data at all.”",
      "“Everybody else here is on the same network and theirs works.”"],
    cause: "celloff", first: "verifycell",
    wrongCauses: ["airplane", "simfault", "carrier", "routerdown", "mdmpolicy"],
    wrongActions: ["reseatsim", "resetnet", "callcarrier", "updateos", "enablewifi"],
    tell: "Other phones on the same carrier in the same place have service, so it is not the " +
      "network. Wi-Fi works, so the device is not dead. That leaves a setting on this handset.",
    order: "Settings before hardware, and hardware before the carrier. Checking a toggle costs " +
      "nothing and is the most common answer." },

  { key: "f-rotate", who: "Tablet — the screen will not rotate",
    said: ["“It does not turn round when I lie it on its side.”",
      "“The touch works perfectly.”",
      "“It started right after I was in the display settings.”"],
    cause: "rotlock", first: "disablelock",
    wrongCauses: ["approt", "sensor", "osglitch", "digitizer", "mdmpolicy"],
    wrongActions: ["safemode", "sensordiag", "updateos", "resetnet", "rundiag"],
    tell: "It began in the display settings, and there is a switch in the display settings that " +
      "does exactly this. Touch working rules out the panel and the digitizer entirely.",
    order: "A switch somebody flicked comes before a sensor that might have failed. One is a tap; " +
      "the other is a diagnostic run." },

  { key: "f-swollen", who: "Laptop — will not sit flat",
    said: ["“It rocks on the desk and the bottom looks bowed.”",
      "“It gets warm even when I am only reading email.”",
      "“The trackpad has gone stiff and hard to click.”"],
    cause: "swollen", first: "powerdown",
    wrongCauses: ["hinge", "warped", "overheat", "agedcell", "sensor"],
    wrongActions: ["rundiag", "keepusing", "reseatlive", "replcell", "coolretest"],
    tell: "A bowed base and a trackpad that has gone stiff are one fault seen from two sides: " +
      "something underneath is pushing up. On a laptop that is the cell, and a cell that is " +
      "changing shape is venting.",
    order: "This is the one on the list where the order matters more than the diagnosis. Make it " +
      "safe first. Everything else — including confirming it — assumes it is safe to keep " +
      "working on, and it is not.",
    note: "“Replace the battery” is right about the part and wrong about the order, and " +
      "so is “run diagnostics to confirm”. Both leave a swelling cell powered on a bench." },

  { key: "f-black", who: "Laptop — black built-in screen",
    said: ["“It starts up — I can hear the sounds.”",
      "“The built-in screen stays black.”",
      "“Plug an external monitor in and the desktop is there, perfectly normal.”"],
    cause: "lcdcable", first: "checkbright",
    wrongCauses: ["gpufail", "backlight", "brightzero", "osglitch", "digitizer"],
    wrongActions: ["replpanel", "replboard", "inspectcable", "rundiag", "updateos"],
    tell: "The external monitor working proves the graphics and the operating system are fine, so " +
      "the fault is on the internal display path. The cable is the most common thing on that path " +
      "to be disturbed.",
    order: "Even when you are fairly sure it is the cable, the brightness and the output toggle " +
      "cost ten seconds and are checked first. Opening a laptop is not a ten-second job.",
    note: "This is the one scenario on the list where the most likely CAUSE and the best next " +
      "STEP are not the same component. Naming the cable and then opening the machine without " +
      "pressing the brightness key is how technicians end up embarrassed." },

  { key: "f-burnin", who: "Tablet — a ghost image",
    said: ["“There are faint pictures still on it.”",
      "“They are still there after a restart.”",
      "“They are still there after it sat switched off all weekend.”"],
    cause: "burnin", first: "repldisplay",
    wrongCauses: ["retention", "filmart", "gpufail", "backlight", "osglitch"],
    wrongActions: ["pixelrefresh", "shortertimeout", "updateos", "coolretest", "replboard"],
    tell: "A restart and a weekend switched off are exactly the two things that clear image " +
      "retention. Surviving both makes it permanent, and permanent damage is not a setting.",
    order: "Replacement is normally last, and here it is first, because everything cheaper has " +
      "already been done by the user without knowing it.",
    /* THE EXCEPTION THAT PROVES THE RULE. Cheaper actions are offered
       and the answer is the dearest one, so each cheaper option has to
       say why it CANNOT work — "cheapest first" is really "cheapest that
       could settle it", and none of these could. */
    cheaperButCannot: {
      pixelrefresh: "It clears image RETENTION, and retention is what a weekend switched off " +
        "would already have cleared. Running it here proves which one you have and fixes nothing.",
      shortertimeout: "It prevents the NEXT one. The damage already in the panel does not care " +
        "what the timeout is set to.",
      updateos: "Software does not repair a panel. Nothing in an update reaches the thing that " +
        "is physically worn.",
      coolretest: "Heat is not what did this and time off is what has already been tried \u2014 the " +
        "user left it off all weekend, which is the same test."
    } },

  { key: "f-projector", who: "Projector — No Signal",
    said: ["“It powers up and puts No Signal on the screen.”",
      "“The laptop is awake and working.”",
      "“It is the same cable we used in the other room last week and that was fine.”"],
    cause: "wronginput", first: "selectinput",
    wrongCauses: ["cableloose", "resmismatch", "routerdown", "gpufail", "backlight"],
    wrongActions: ["reseatcable", "lowerres", "knowngood", "replpanel", "updateos"],
    tell: "It is working well enough to put its own message on the screen, and that message is " +
      "about the input it is listening to. The cable was proved in another room last week.",
    order: "Pressing the source button costs nothing. Fetching a cable, a laptop or a ladder " +
      "does." },

  { key: "f-wifiafter", who: "Laptop — no Wi-Fi after a screen replacement",
    said: ["“The screen was replaced on Tuesday.”",
      "“Since then it will not join the wireless at all.”",
      "“Everything else in the office is on that network without any trouble.”"],
    cause: "antenna", first: "enablewifi",
    wrongCauses: ["nicloose", "wifioff", "routerdown", "mdmpolicy", "celloff"],
    wrongActions: ["inspectant", "reseatnic", "resetnet", "updateos", "rundiag"],
    tell: "The antennas on a laptop run up through the display assembly and its hinge, which is " +
      "precisely what came apart on Tuesday. Everything else on the network being fine rules out " +
      "the access point.",
    order: "Even here — where the cause is obvious and it is almost certainly the antenna " +
      "leads — the free check comes first. A function key gets knocked during a repair more " +
      "often than anyone admits, and it costs one press to be sure before you open the lid again." },

  /* --- the standing five more --- */
  { key: "f-storage", who: "Phone — nothing will install",
    said: ["“It will not install anything and the camera says it cannot save.”",
      "“It has been getting slower for weeks.”",
      "“The settings screen says there is 0.2 GB free.”"],
    cause: "storagefull", first: "freespace",
    wrongCauses: ["agedcell", "osglitch", "mdmpolicy", "overheat", "bgapps"],
    wrongActions: ["updateos", "resetnet", "powersave", "replcell", "rundiag"],
    tell: "The number is on the screen. Nothing else on this list explains a camera that cannot " +
      "save and an installer that will not run at the same time.",
    order: "Read the figures the device is already showing you before you change anything. This " +
      "one is answered without touching a setting." },

  { key: "f-hot", who: "Phone — slow and hot",
    said: ["“It goes slow and sluggish, then comes back to normal later.”",
      "“It is hot when it is being slow.”",
      "“It happens in the van on the dashboard, in the sun.”"],
    cause: "overheat", first: "coolretest",
    wrongCauses: ["bgapps", "agedcell", "storagefull", "osglitch", "swollen"],
    wrongActions: ["updateos", "replcell", "powersave", "resetnet", "freespace"],
    tell: "Slow while hot, normal once cool, in direct sun on a dashboard. That is a device " +
      "protecting itself, and it is working exactly as designed.",
    order: "Let it cool and retest before changing anything. It costs nothing, and if it comes " +
      "back to normal the job is a conversation rather than a repair.",
    cheaperButCannot: {
      freespace: "Free to do and worth doing on any slow device \u2014 and a full disk does not make " +
        "a phone hot, and clearing it does not make a phone on a sunlit dashboard cool."
    } },

  { key: "f-touch", who: "Tablet — the touch has stopped",
    said: ["“The picture is perfect — video plays, everything looks right.”",
      "“Nothing happens when I touch it.”",
      "“It was dropped face down on the workshop floor.”"],
    cause: "digitizer", first: "stylustest",
    wrongCauses: ["osglitch", "approt", "sensor", "filmart", "mdmpolicy"],
    wrongActions: ["updateos", "safemode", "repldisplay", "resetnet", "rundiag"],
    tell: "A perfect picture with no touch splits the display into its two halves: the panel is " +
      "making the image and the digitizer is not sensing the finger. The drop says which one took " +
      "the impact.",
    order: "Prove the split before quoting for the assembly. A stylus or a mouse settles it in " +
      "seconds and decides whether the quote is for a digitizer or for the lot." },

  { key: "f-mdm", who: "Phone — the camera will not open",
    said: ["“The camera app will not start on this phone.”",
      "“It is the same on the other two company phones we tried.”",
      "“My own phone works fine on the same desk.”"],
    cause: "mdmpolicy", first: "checkmdm",
    wrongCauses: ["osglitch", "storagefull", "digitizer", "overheat", "bgapps"],
    wrongActions: ["updateos", "resetnet", "freespace", "rundiag", "safemode"],
    tell: "Three company phones fail and a personal phone on the same desk does not. Nothing " +
      "about the hardware is shared by those three and not by the fourth — the management " +
      "policy is.",
    order: "Look at what the managed devices have in common before treating any of them as " +
      "broken. There is nothing to repair here." },

  { key: "f-port", who: "Phone — charges only at an angle",
    said: ["“It only charges if I hold the lead just so.”",
      "“We tried two other leads and a different plug and it is the same.”",
      "“It lives in a jacket pocket.”"],
    cause: "chargeport", first: "cleanport",
    wrongCauses: ["agedcell", "cableloose", "powercfg", "storagefull", "overheat"],
    wrongActions: ["replcell", "resetnet", "updateos", "rundiag", "powersave"],
    tell: "Two other leads and a different adapter behaving identically puts the fault on the " +
      "device's side of the connector. A jacket pocket is where lint comes from, and a plug that " +
      "cannot seat fully behaves exactly like a broken port.",
    order: "Free and non-destructive before soldered. Clean it first; replace the port only if " +
      "cleaning does not fix it." },

  /* --- FIVE MORE, EARNED BY THE PANEL ------------------------------
     The LCD layer used to be one slab with a photograph on it, so
     "which part of the panel" was not a question this lab could ask —
     there was one part. It is a five-sheet module now with a driver on
     each of two ledges, and these five are the faults that become
     answerable because of it.

     They are deliberately close together. Three of them are a mark on a
     screen that the customer describes almost identically, and the
     discriminator is buried in the report every time: which WAY it runs,
     whether it is spreading, and whether it moves when you tilt the
     device. That is the reading-the-scenario gap, on purpose.

     Note that three of the five answer the same first step. That is not
     laziness, it is the lesson: one free test pattern separates a column
     from a row from a scatter of dots, and a technician who reaches for
     it every time is right every time. */

  { key: "f-vband", who: "Phone — a coloured stripe down the screen",
    said: ["\u201cThere is a stripe straight down the screen and it is always in exactly the same place.\u201d",
      "\u201cIt is there the moment it comes on, and everything either side of it is perfect.\u201d",
      "\u201cTouch works fine, even on the stripe itself.\u201d"],
    cause: "sourcedrv", first: "testpattern",
    wrongCauses: ["gatedrv", "crystal", "deadsub", "lcdcable", "digitizer"],
    wrongActions: ["replpanel", "quotescreen", "inspectcable", "rundiag", "torch"],
    tell: "The same stripe, in the same place, every time, running the full HEIGHT of the picture. " +
      "That is a column with nothing driving it, and the columns are driven from the chip bonded " +
      "along the bottom edge of the panel.",
    order: "Prove the direction and prove it is constant before you name a part. A test pattern " +
      "costs nothing and answers both; every other option on this list assumes you already know " +
      "which way the fault runs." },

  { key: "f-hband", who: "Tablet — a dark line across the screen",
    said: ["\u201cA dark line runs straight across the screen, side to side.\u201d",
      "\u201cIt has been in the same place for a week and it has not got any wider.\u201d",
      "\u201cEverything still responds normally, including under the line.\u201d"],
    cause: "gatedrv", first: "testpattern",
    wrongCauses: ["sourcedrv", "crystal", "backlight", "lcdcable", "deadsub"],
    wrongActions: ["quotescreen", "replpanel", "inspectcable", "updateos", "torch"],
    tell: "The direction is the answer. A band ACROSS the picture is a row with nothing switching " +
      "it, and the rows are switched from the ledge down the SIDE of the panel — not by the chip " +
      "at the bottom, which drives columns.",
    order: "The same free test as any banding fault, for the same reason: the two drivers sit on " +
      "two different edges of the same panel, and the only thing that tells them apart is which " +
      "way the band runs." },

  { key: "f-blot", who: "Phone — a dark blot that is spreading",
    said: ["\u201cThere is a dark blot with a fuzzy edge and it is bigger than it was last month.\u201d",
      "\u201cIt started where the phone sits against my keys in my bag.\u201d",
      "\u201cI can still tap things underneath it and they work.\u201d"],
    cause: "crystal", first: "removefilm",
    wrongCauses: ["deadsub", "sourcedrv", "filmart", "burnin", "gatedrv"],
    wrongActions: ["testpattern", "quotescreen", "replpanel", "rundiag", "pixelrefresh"],
    cheaperButCannot: {
      testpattern: "A test pattern shows you the blot, which the customer can already see. It " +
        "cannot tell you whether the mark is IN the picture or ON the surface above it, and that " +
        "is the only question this fault turns on."
    },
    tell: "A soft edge, growing, and it started where the device was pressed against something " +
      "hard. That is liquid crystal displaced inside the panel — and only an LCD can do it, " +
      "because an OLED has no liquid in it to move.",
    order: "Take off anything sitting on top of the screen before you condemn what is under it. " +
      "A damaged protector makes a mark that looks exactly like this and costs a minute to rule " +
      "out. Once the surface is clear the mark is in the panel, and then it is a screen." },

  { key: "f-dots", who: "Phone — a few dots that are always dark",
    said: ["\u201cThere are three tiny dots that stay dark even on a white page.\u201d",
      "\u201cThey have been there since I got it and they have not changed at all.\u201d",
      "\u201cYou cannot see them on anything except a plain background.\u201d"],
    cause: "deadsub", first: "testpattern",
    wrongCauses: ["crystal", "burnin", "retention", "filmart", "sourcedrv"],
    wrongActions: ["pixelrefresh", "quotescreen", "replpanel", "updateos", "shortertimeout"],
    tell: "They do not move, they do not spread, and they have never changed. Each one is a dead " +
      "transistor on the glass driving a single stripe of colour filter — there is nothing there " +
      "to reach, and nothing that will bring it back.",
    order: "Count them on a plain field first. It is free, and the count is the whole decision: " +
      "manufacturers replace a panel above a threshold and refuse below it, and neither you nor " +
      "the customer can argue that without the number." },

  { key: "f-milky", who: "Tablet — a cloudy patch in one corner",
    said: ["\u201cThere is a cloudy patch in the corner, like a smear that will not wipe off.\u201d",
      "\u201cIt changes as I tilt it, and there is a faint rainbow in it.\u201d",
      "\u201cIt turned up after I peeled an old screen protector off.\u201d"],
    cause: "polfilm", first: "angleinspect",
    wrongCauses: ["crystal", "deadsub", "filmart", "burnin", "backlight"],
    wrongActions: ["testpattern", "quotescreen", "replpanel", "pixelrefresh", "rundiag"],
    tell: "It changes as the device tilts and it carries a rainbow. Both of those put it ON the " +
      "surface rather than in the picture — the front polariser has lifted, which is exactly what " +
      "peeling a well-stuck protector does to the film bonded underneath it.",
    order: "Look across it under a light before you look through it. A mark that moves as your eye " +
      "moves is on the surface; one that stays put is in the panel. That takes seconds and it " +
      "decides whether this is a film or a screen." }
,

  /* --- FIVE MORE, EARNED BY THE PROTECTION BOARD ------------------
     A battery on this bench was a pouch until the board went on it, and
     a pouch cannot have any of these faults. Every one is a fault of the
     BOARD rather than of the cell, which is the distinction that stops a
     technician condemning a cell that is perfectly good — and the first
     two are the cases where the expensive answer is also the wrong one.

     They are close together on purpose: four of the five are "it will not
     charge" or "it is dead" in the customer's words, and what separates
     them is what a meter says, what happens under LOAD, and whether the
     pack was healthy before somebody worked on it. */

  { key: "f-latched", who: "Phone — completely dead after months in a drawer",
    said: ["\u201cIt was working when I put it away. Now nothing at all, on any charger.\u201d",
      "\u201cNo light, no buzz, nothing on the screen even after an hour plugged in.\u201d",
      "\u201cIt must have been in there since about March.\u201d"],
    cause: "protripped", first: "wakepack",
    wrongCauses: ["agedcell", "chargeport", "cableloose", "noprotect", "ntcopen"],
    wrongActions: ["replcell", "cleanport", "replboard", "rundiag", "measurepack"],
    cheaperButCannot: {},
    tell: "Months flat is the whole clue. A lithium pack left to self-discharge goes below the " +
      "voltage its protection board will allow, and the board LATCHES OFF to stop anybody " +
      "recharging a cell that far down. The pack reads zero at the connector and the cell " +
      "underneath may be perfectly sound.",
    order: "Leave it on the charger and watch, because it costs nothing but time and a latched " +
      "pack often comes back on its own. Measuring it is the next move, not the first \u2014 and " +
      "replacing it is the move that sells somebody a battery they did not need." },

  { key: "f-ntc", who: "Tablet — will not charge, and the battery is fine",
    said: ["\u201cIt will not take a charge from anything \u2014 three different chargers, two cables.\u201d",
      "\u201cThe battery health screen says it is at ninety-four per cent.\u201d",
      "\u201cIt was fine until the screen was replaced last month.\u201d"],
    cause: "ntcopen", first: "checkntc",
    wrongCauses: ["chargeport", "cableloose", "agedcell", "protripped", "powercfg"],
    wrongActions: ["replcell", "cleanport", "genuinepack", "updateos", "resetnet"],
    tell: "Healthy on the health screen, refused by every charger, and it started at a repair. " +
      "The charger will not run without a temperature reading from the cell, so an open " +
      "thermistor line stops charging on a pack that is otherwise perfect \u2014 and that line " +
      "runs through the connector somebody unplugged.",
    order: "Prove the third pin before you buy anything. It is why the connector is a three-way " +
      "and not a two, and it is the one thing on this list that explains BOTH the refusal and " +
      "the healthy reading at the same time." },

  { key: "f-underload", who: "Phone — dies the moment it does anything",
    said: ["\u201cIt shuts off as soon as I use the camera flash, every time.\u201d",
      "\u201cThe battery says sixty per cent when it happens.\u201d",
      "\u201cIt sits on the desk all day quite happily if I do not touch it.\u201d"],
    cause: "weakweld", first: "loadtest",
    wrongCauses: ["agedcell", "powercfg", "bgapps", "overheat", "protripped"],
    wrongActions: ["replcell", "reviewusage", "updateos", "rundiag", "coolretest"],
    cheaperButCannot: {
      reviewusage: "The battery usage screen finds something DRAWING power over hours. This " +
        "device dies in the instant a load is applied and is perfectly happy at rest, which " +
        "is not a consumption problem \u2014 it is a connection problem."
    },
    tell: "Fine at rest and gone under load is the signature of RESISTANCE, not of capacity. A " +
      "resting voltage tells you nothing about a tab weld that has gone high \u2014 only current " +
      "does, and the flash is the biggest current in the phone.",
    order: "Put a load on it and watch the voltage under the load. Every other option on this " +
      "list reads the pack sitting still, which is exactly the condition in which this fault " +
      "does not exist." },

  { key: "f-cheappack", who: "Phone — a new battery, and it is getting hot",
    said: ["\u201cI had a battery put in online three weeks ago and it was half the price.\u201d",
      "\u201cIt gets really warm on charge and the back has started to sit proud at one corner.\u201d",
      "\u201cThe old one just did not last, there was nothing wrong with it like this.\u201d"],
    cause: "noprotect", first: "powerdown",
    wrongCauses: ["agedcell", "overheat", "bgapps", "chargeport", "weakweld"],
    wrongActions: ["genuinepack", "keepusing", "coolretest", "rundiag", "measurepack"],
    tell: "Three weeks old, hot on charge, and lifting the back. What a cheap pack leaves out " +
      "is not capacity, it is the BOARD \u2014 and without it nothing stops the charge when the " +
      "cell has had enough. It is already swelling, which makes it a safety job before it is " +
      "a parts job.",
    order: "Isolate it FIRST. It is swelling, so everything else on the list \u2014 including " +
      "fitting the right pack, which is the correct repair \u2014 assumes it is safe to keep " +
      "working on the device, and that assumption is the one that gets somebody hurt." },

  { key: "f-dented", who: "Phone — back from another shop, battery creased",
    said: ["\u201cThe last place said they could not get the battery out and gave it back to me.\u201d",
      "\u201cThere is a dent in the silver bit that I am fairly sure was not there before.\u201d",
      "\u201cIt still turns on and it seems to work.\u201d"],
    cause: "dented", first: "scrapcell",
    wrongCauses: ["agedcell", "protripped", "weakweld", "noprotect", "overheat"],
    wrongActions: ["measurepack", "loadtest", "rundiag", "keepusing", "coolretest"],
    cheaperButCannot: {
      measurepack: "It will measure fine. That is the trap: a creased pouch has a compromised " +
        "separator inside it and no meter reading tells you so, because the failure is " +
        "mechanical and it is in the future.",
      loadtest: "Also fine, for the same reason. Neither test can see a separator, and both " +
        "of them end with somebody putting a damaged cell back into a phone.",
      rundiag: "Diagnostics read the gauge and the board. Nothing in them looks at the foil.",
      keepusing: "This is the one that ends badly. A creased cell in service is a cell waiting " +
        "to short internally, and it will not warn anybody first.",
      coolretest: "There is nothing thermal to wait for. The damage is already done."
    },
    tell: "The pull tabs snapped, somebody prised, and the pouch is creased. That crease is a " +
      "compromised separator, and a compromised separator is an internal short waiting to " +
      "happen \u2014 it does not matter what the pack measures today.",
    order: "It is scrap, and it is scrap NOW. Every cheaper option here is a test that will come " +
      "back clean, and a clean test on a damaged cell is worse than no test at all: it is the " +
      "reason somebody puts it back in." }
];

/* =====================================================================
   INSIDE THE PANEL — objective 3.1, taught as construction.

   3.1 is "compare and contrast display components and attributes", and
   everywhere else in this build it is carried by stages about CHOOSING a
   monitor: which panel technology, which cable, which refresh rate. None
   of them takes a display apart. A student can pass all three and still
   not know what is between the glass and the light.

   That gap matters on the bench, because the components of a display are
   the only thing that explains the symptoms. A vertical band and a
   horizontal band are the same fault to somebody who does not know there
   are two drivers at right angles to each other. A single dead dot and a
   dark patch are the same "broken screen" to somebody who has never seen
   the transistor sheet or the light guide.

   So this stage is the panel bench with six of the seven layers taken
   away, and the question is which PART. The discriminator is always in
   the brief and it is never the loudest thing in it — a customer leads
   with "the screen is broken", and the sentence that decides the answer
   is the one they thought was irrelevant.

   THE DISCRIMINATORS, which are what the table below is really for:

     direction   a band down is the COLUMN driver, a band across is the
                 ROW driver. Two chips, two axes, one rule.
     torch       image under a torch is light, no image under a torch is
                 the panel. The oldest test in the trade.
     one dot     one sub-pixel is one transistor, and there is nothing
                 there to repair.
     pressure    the crystal is a liquid. It moves, it spreads, and it
                 responds to a thumb — nothing else in the stack does.
     angle       the polariser is an optical film, so its faults change
                 with how you hold it. Everything else looks the same
                 from every angle.
     hue         the colour filter is dye. A patch of wrong colour with
                 the right SHAPE is dye, not a driver.
   ===================================================================== */
const PANEL_PARTS = {
  source: {
    label: "The display driver chip on the bottom edge",
    short: "source (column) driver",
    at: "lcd-driver",
    does: "Drives the COLUMNS — one output per column of sub-pixels, along the bottom edge.",
    fails: "a band or a dead stripe running DOWN the screen, in the same place every time, " +
      "with the rest of the picture perfect",
    job: "Whole display assembly. It is bonded to the glass on a film — there is nothing to " +
      "reseat and nothing to replace on its own." },
  gate: {
    label: "The gate driver down the side ledge",
    short: "gate (row) driver",
    at: "lcd-gate",
    does: "Switches the ROWS on and off, built onto the glass down one long edge.",
    fails: "a band or a dead stripe running ACROSS the screen, in the same place every time, " +
      "with the rest of the picture perfect",
    job: "Whole display assembly. On a phone panel it is built onto the glass itself, so it " +
      "cannot come off separately even in principle." },
  crystal: {
    label: "The liquid crystal between the two sheets",
    short: "the liquid crystal layer",
    at: "layer-lcd",
    does: "Twists the light by a controlled amount so the crossed polarisers let it through.",
    fails: "a dark blotch with soft edges that SPREADS over days, and colours that change " +
      "under thumb pressure near it",
    job: "Whole display assembly, and the sooner the better — it grows." },
  tft: {
    label: "A transistor on the sheet under one sub-pixel",
    short: "a dead transistor",
    at: "lcd-filter",
    does: "One switch per sub-pixel, on the glass sheet under the colour filter.",
    fails: "one permanently dark or permanently coloured DOT, the same size as a sub-pixel, " +
      "which never moves and never grows",
    job: "Usually nothing. Under the manufacturer's dead-pixel threshold it is not a warranty " +
      "fault, and it is never worth a panel of the customer's own money." },
  polfront: {
    label: "The front polariser film",
    short: "the front polariser",
    at: "lcd-pol",
    does: "The top of the two crossed filters — the one you touch through the glass.",
    fails: "a milky or rainbow patch that CHANGES as the phone is tilted, and a picture that " +
      "washes out at an angle it used to be fine at",
    job: "Whole display assembly. It is laminated into the stack; peeling it is how a repairable " +
      "screen becomes scrap." },
  filter: {
    label: "The colour filter glass",
    short: "the colour filter",
    at: "lcd-filter",
    does: "Red, green and blue dye stripes in a black matrix — what makes an LCD colour.",
    fails: "a patch of the picture in the WRONG COLOUR but the right shape, identical at every " +
      "angle and unchanged by pressure",
    job: "Whole display assembly. The dye is inside the laminate." },
  guide: {
    label: "The light guide plate behind the panel",
    short: "the light guide",
    at: "light-guide",
    does: "Takes light in at its edge and turns it ninety degrees to face the panel.",
    fails: "a dark patch or a dark corner with the picture still IN it under a torch, and a " +
      "brightness slider that changes nothing about the patch",
    job: "Backlight assembly on a repairable panel; whole display on a bonded one. Either way " +
      "it is not the panel and it is not the board." },
  leds: {
    label: "The LED strip along the edge of the guide",
    short: "the backlight LEDs",
    at: "led-strip",
    does: "A row of white LEDs firing sideways into the guide, on their own two wires.",
    fails: "a screen that is black but still WORKING — a torch held close shows the picture, " +
      "and the phone answers calls and makes its noises",
    job: "Backlight or display assembly — but check the panel's own flex first, because a " +
      "knocked backlight lead costs nothing and a screen costs a day's wages." }
};

/* WHAT THE PANEL BENCH CAN POINT AT.

   Every part above names a part key on the focused panel bench. A part
   that names one the bench does not draw would be a question about
   something the student cannot see — checked at load, below, against the
   bench itself rather than against a list. */

/* The cases. Eight to give every part in the table its turn as the right
   answer, then five more per the standing rule — a set that only ever
   asks about the driver chips would teach the direction rule and nothing
   else.

   Each one buries its discriminator. `said` is what the customer or the
   front desk wrote down, in the order they wrote it, and the useful
   clause is never the first one. */
const PP_CASES = [
  { key: "pp-band-down", part: "source",
    said: ["The screen's got a line down it.",
           "It started after I dropped it but it's been the same line ever since.",
           "It's in the same place whatever I've got open — even on the lock screen."],
    tell: "A stripe that runs DOWN and sits in the same place on every image is the column " +
      "driver. “Whatever I've got open” rules out software and “the same line ever since” " +
      "rules out the flex, which comes and goes." },
  { key: "pp-band-across", part: "gate",
    said: ["There's a bar across the top third of it.",
           "Nothing I do changes it. I've restarted it about ten times.",
           "You can still see the icons through the bar, they're just wrong colours."],
    tell: "ACROSS, not down — so it is the row driver on the side ledge, not the chip along " +
      "the bottom. The icons showing through say the picture is still being generated; it is " +
      "the switching of those rows that has gone." },
  { key: "pp-blotch", part: "crystal",
    said: ["There's a dark mark near the corner.",
           "It was the size of a five pence piece last week and now it's bigger.",
           "If I press next to it the colours go funny for a second and then come back."],
    tell: "It SPREADS and it answers to pressure. Nothing else in the stack does either — a " +
      "driver fault is the same size forever and a dead transistor is one dot. This is the " +
      "liquid crystal, and it is liquid, which is why it grows." },
  { key: "pp-dot", part: "tft",
    said: ["There's a tiny black speck on the screen and I can't wipe it off.",
           "My friend said the whole screen needs replacing.",
           "It's been exactly the same since I noticed it about four months ago."],
    tell: "One dot, the size of a sub-pixel, unchanged in four months. That is one transistor " +
      "on the sheet under the filter and there is nothing there to repair. The answer to the " +
      "friend is that a screen is not worth it for this." },
  { key: "pp-milky", part: "polfront",
    said: ["It's gone cloudy in one corner.",
           "It's fine if I hold it straight on, but tilted on the desk it looks oily.",
           "I had a screen protector taken off at a market stall last month."],
    tell: "It CHANGES WITH ANGLE, which nothing behind the glass does. A film that only misbehaves " +
      "when tilted is an optical film, and the stall peeling a protector off is how the front " +
      "polariser got lifted with it." },
  { key: "pp-cast", part: "filter",
    said: ["Half the screen has gone pink.",
           "It's exactly the same pink from every angle and pressing it does nothing.",
           "Everything is still the right shape and the right size, it's just the wrong colour."],
    tell: "The right SHAPE in the wrong colour, identical at every angle and deaf to pressure. " +
      "Shape intact means the drivers are switching correctly; wrong colour means the dye. " +
      "Angle and pressure are what separate it from the polariser and the crystal." },
  { key: "pp-darkpatch", part: "guide",
    said: ["There's a shadow at the bottom of the screen.",
           "Turning the brightness up makes the rest brighter and that bit stays dark.",
           "I can read what's in the dark bit if I take it over to the window."],
    tell: "The picture is IN the dark patch — reading it by the window is a torch test by " +
      "another name. So the panel is generating that area correctly and the light is not " +
      "arriving: a crushed light guide, not a dead panel." },
  { key: "pp-black", part: "leds",
    said: ["It's completely black but it's definitely still on.",
           "It rings when people call me and I can hear the keyboard clicking when I type.",
           "My son shone his torch at it and said he could see the screen faintly."],
    tell: "The oldest test in the trade and the son already ran it. A faint picture under a " +
      "torch means the panel is working and the light is not, which is the backlight — " +
      "different circuit, different part, very different money." },

  /* --- the five added on top, per the standing rule ------------------
     Chosen for the cases the first eight do not cover: the fault that
     LOOKS like a driver and is a cable, the one that looks like a dead
     panel and is a setting, the stuck dot rather than the dead one, the
     band that moves, and the edge that is dark because of the LEDs
     rather than the guide. Every one of them is a real misdiagnosis. */
  { key: "pp-edge-dark", part: "leds",
    said: ["The left-hand edge is dimmer than the rest.",
           "It's worse on a white page and you can hardly see it on a photo.",
           "It's a strip about a centimetre wide all the way down that side, and the picture's " +
             "all there in it."],
    tell: "The picture is there, so it is light and not panel. A dim STRIP along one edge is a " +
      "run of LEDs out at that end of the strip — the guide would give a patch or a corner, " +
      "not an even band the full length of the side." },
  { key: "pp-stuck-dot", part: "tft",
    said: ["There's a bright green pinprick in the middle of the screen.",
           "It's there on a black background and you can't see it on anything light.",
           "It's not got any bigger and it doesn't move when I scroll."],
    tell: "A sub-pixel stuck ON rather than off — one green transistor latched, which is the " +
      "same part and the same verdict as a dead one. Not moving when the picture scrolls is " +
      "what says it is the screen and not the image." },
  { key: "pp-thumb", part: "crystal",
    said: ["It's got a mark like a thumbprint on it.",
           "It came up after it was in a back pocket and somebody sat on it.",
           "The glass isn't cracked at all, and the mark has got a rainbow round the edge now."],
    tell: "Sat on, unbroken glass, and a mark with a spreading rainbow edge. The crystal has " +
      "been squeezed out of the area under the pressure — a mura mark. The intact glass is " +
      "the clue people miss: the damage is inside the laminate." },
  { key: "pp-bottom-band", part: "source",
    said: ["There's a band of static across the bottom two centimetres.",
           "It flickers but it never moves off the bottom.",
           "It's been there since it came back from a screen repair somewhere else."],
    tell: "Pinned to the BOTTOM EDGE, which is where the column driver's film is bonded. A " +
      "previous repair is how it got stressed. Flickering is not a reason to call it a cable: " +
      "a cable fault moves when the phone is flexed, and this one does not move at all." },
  { key: "pp-tilt-wash", part: "polfront",
    said: ["The colours look washed out now.",
           "It's fine flat on the table and horrible when it's in the car mount.",
           "It happened over about a fortnight, it wasn't dropped or anything."],
    tell: "Good flat and bad in the mount is a VIEWING ANGLE symptom, and viewing angle is " +
      "the polariser's department. No impact and a gradual onset also rule out the mechanical " +
      "answers everybody reaches for first." }
];

export function generate(seed) {
  const r = rng(seed);
  const faultKey = r.pick(Object.keys(FAULTS));
  const fault = FAULTS[faultKey];
  let person = r.pick(PEOPLE);
  /* A laptop only turns up when the fault is one of the three that
     genuinely belong here. Otherwise it is a phone or a tablet. */
  if (r.next() < 0.25 && LAPTOP_OK.indexOf(faultKey) >= 0) {
    person = { who: person.who, device: "laptop" };
  }

  const said = r.shuffle([fault.said].concat(r.some(NOISE, 2)));

  /* Battery health figures for the drain calculation. */
  const designMah = r.pick([3000, 4000, 4500, 5000]);
  const cycles = r.int(180, 950);
  /* Real cells lose roughly 20% over 500 cycles. */
  const healthPct = Math.max(55, Math.round(100 - (cycles / 500) * 20));
  const currentMah = Math.round(designMah * healthPct / 100);
  const worn = healthPct < 80;

  return {
    seed: seed, person: person, faultKey: faultKey, fault: fault,
    said: said, designMah: designMah, cycles: cycles,
    healthPct: healthPct, currentMah: currentMah, worn: worn,
    /* WHAT IS PRINTED ON THE CELL, and it is generated HERE rather than in
       the bench because the bench must not invent figures the lab then
       grades against. `mb-health` asks the student to divide current
       capacity by design capacity; a label printing its own design figure
       would put the evidence and the answer on opposite sides of the same
       screen, which is the failure this build has had before with a drive
       label and a ticket that disagreed.

       Wh = V x Ah, and both are printed because both are printed on the
       real thing — the label is a worked example of the sum sitting on
       the part. */
    cell: (function () {
      const q = rng(seed + 419);
      const v = q.pick([3.85, 3.87]);
      return {
        model: "L-19-" + q.pick(["AB", "AC", "BD", "CF", "DG"]) + q.int(10, 99),
        chem: "Li-ion Polymer",
        mah: designMah,
        volts: v,
        chargeV: 4.40,
        wh: Math.round(designMah / 1000 * v * 10) / 10,
        lot: "LOT " + q.int(2308, 2452) + " / " + q.pick(["A", "B", "C", "D"]) + q.int(1, 9)
      };
    })(),
    isSwollen: faultKey === "battery",
    /* The Device Issue Diagnosis device for this seed. */
    mdevice: rng(seed + 293).pick(MDX_DEVICES),
    /* The Mobile Device Troubleshooting case for this seed. */
    fcase: rng(seed + 311).pick(FS_CASES),
    /* The inside-the-panel case for this seed. Its own stream off the
       seed, like the two above, so adding a case to one table does not
       reshuffle the others and change every scenario a class has
       already worked through. */
    ppcase: rng(seed + 523).pick(PP_CASES),
    stackLayer: fault.stack
  };
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */
/* ---------------------------------------------------------------------
   A BENCH PANEL SHOWING ONE PART OF THE HANDSET, CLOSE ENOUGH TO WORK ON.

   Four stages in this lab talked about hardware and showed none of it —
   `safety` about a swollen cell, `health` about the cell's figures,
   `charge` about the port, `radio` about the antennas. Every one of
   those parts was already modelled and already verified; none of them
   was ever mounted, so a student on the Quick path met a note, a table
   and two more notes.

   That is the owner's own complaint about the printer lab's Quick path,
   generalised: it "doesn't show a student a single one of the machines
   they now have". It was fixed for the printer lab and never carried
   across, and the mobile lab is where it costs most — the midframe is
   285 primitives and has only ever been seen as one slice of a
   seven-layer stack, a few pixels tall.

   Written once rather than four times because all four want the same
   thing: the focused view, no fault marked, and a caption saying which
   part of it to look at.
   --------------------------------------------------------------------- */
function focusPanel(s, layers, o) {
  o = o || {};
  return {
    kind: "bench", height: 400,
    title: o.title,
    intro: o.intro,
    bench: {
      spec: function () {
        return mobileBench({
          panel: panelKind(s), focus: layers,
          swollen: o.swollen === undefined ? !!s.isSwollen : o.swollen,
          states: {}, healthPct: s.healthPct, cell: s.cell
        });
      },
      status: function () {
        return { tone: o.tone || "warn", words: o.words || "Nothing is marked",
          detail: o.detail || "The model does not say which part has failed. What decides it " +
            "is in the figures and the report." };
      },
      /* ONE CONTROL PER PART, FROM THE PARTS THEMSELVES. Same rule as the
         closed phone: the suite requires at least three, and more to the
         point every part carries a note that is teaching content a
         student cannot otherwise reach. Mapped from the spec so a part
         added to a layer cannot go missing from the list. */
      controls: function () {
        return mobileBench({
          panel: panelKind(s), focus: layers,
          swollen: o.swollen === undefined ? !!s.isSwollen : o.swollen,
          states: {}, healthPct: s.healthPct, cell: s.cell
        }).parts.map(function (p) {
          return { key: p.key, label: p.label, state: "na",
                   stateWords: p.spec || "On the bench", detail: p.note };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

function briefPanel(s) {
  return {
    kind: "brief",
    from: s.person.who + " — " + s.person.device,
    paragraphs: ["They have brought it in and this is what they told you."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

/* The display stack, layer by layer. */
function stackFrames() {
  const cols = [{ name: "Layer", sub: "outside in" }, { name: "Shows?", sub: "image" },
                { name: "Feels?", sub: "touch" }, { name: "When it fails", sub: "symptom" }];
  return STACK.map(function (L, i) {
    return {
      columns: cols,
      caption: L.name + " — " + L.does + "  ·  " + L.fails,
      rows: [[
        { label: L.name, tone: "parity" },
        { label: L.key === "lcd" || L.key === "backlight" ? "yes" : "no",
          tone: L.key === "lcd" || L.key === "backlight" ? "data" : null },
        /* The glass entry now senses touch, because the digitizer is
           bonded into it. It is the only row where "shows" is no and
           "feels" is yes, and that pairing is the whole diagnosis. */
        { label: L.key === "glass" ? "yes" : "no",
          tone: L.key === "glass" ? "data" : null },
        { label: L.key === "glass" ? "cracked, or numb — image fine" :
                 L.key === "lcd" ? "touch, no image" : "dark, image is there",
          tone: "dead" }
      ]]
    };
  });
}

/* ---------------------------------------------------------------------
   The handset, laid out in order.

   Which layer lights depends on the fault the generator planted. The
   display faults map onto their own layer; everything else is not a
   display problem at all, and the stack says so rather than pretending
   one of the layers is guilty.

   A swollen cell overrides all of it. That is a safety gate, not a
   diagnosis, and it is the loudest thing on the bench for that reason.
   --------------------------------------------------------------------- */
/* `glass` is kept as a key and is NOT a fault in the table — it is the
   LAYER name, and the two namespaces meet here. That collision is what
   made the cracked-screen model unreachable for the life of this build:
   three conditions asked `faultKey === "glass"`, which reads perfectly
   and is a layer key being compared against a fault key. The check at
   the foot of this file now refuses any entry here that is not a real
   fault, so the two cannot be confused again. */
const FAULT_LAYER = {
  cracked: "glass", digitizer: "glass", lcd: "lcd", backlight: "backlight",
  battery: "battery", drain: "battery", charge: "midframe", signal: "midframe"
};

/* WHICH KIND OF SCREEN THIS HANDSET HAS.

   The owner's teardown diagram is an OLED phone, and an OLED has no
   backlight — so the torch test that separates a dead panel from a dead
   backlight cannot be run on one. The bench draws both stacks and this
   picks which, per scenario.

   A BACKLIGHT FAULT FORCES AN LCD. It has to: a backlight cannot fail on
   a phone that does not have one, and generating that pairing would put a
   fault on a layer the model does not draw — the student would be asked
   to name a part that is not in front of them. Everything else is a
   stable coin flip off the seed, so a class working through this meets
   both kinds and neither becomes "the" phone. */
function panelKind(s) {
  if (s.faultKey === "backlight") return "lcd";
  return (rng(s.seed + 137).next() < 0.5) ? "oled" : "lcd";
}

function handsetPanel(s) {
  const panel = panelKind(s);
  const states = {};
  layersFor(panel).forEach(function (L) { states[L.key] = "na"; });

  let guilty = FAULT_LAYER[s.faultKey] || null;
  /* ON AN OLED THERE IS NO SEPARATE DIGITIZER LAYER — it is bonded into
     the top glass, which is what the owner's diagram labels it. So a
     digitizer fault lands on the glass, and that is not a fudge: it is
     the diagnosis. "The touch has stopped working" on a bonded assembly
     means the whole screen unit, and a student who expects to point at a
     separate sheet has to learn that there is not one. */
  /* Both stacks now, not just OLED: the digitizer is bonded into the
     glass on either, so a touch fault is a glass-assembly fault. What
     differs is whether the PANEL comes with it. */
  if (guilty === "digitizer") guilty = "glass";
  if (guilty) states[guilty] = "faulty";

  /* The display stack is the one place where the neighbouring layer is
     genuinely worth checking, because the symptoms overlap: a dark screen
     that still shows an image under a torch is the backlight, and the same
     screen with no image at all is the panel. */
  /* On an OLED the glass has no digitizer next to it to be suspicious of,
     and the panel has no backlight — both are the same lesson from
     different ends, and both are handled by states[] simply not having
     the key. */
  const NEIGHBOUR = panel === "oled"
    ? { lcd: "polariser", polariser: "lcd" }
    : { lcd: "backlight", backlight: "lcd" };
  /* On an OLED the panel has no backlight neighbour to be suspicious of,
     and marking one would be the model arguing for a test that cannot be
     run here. `states` has no backlight key on an OLED, so the guard is
     the `!== undefined` rather than the `=== "na"` it reads like. */
  const nb = guilty ? NEIGHBOUR[guilty] : null;
  if (nb && states[nb] === "na") states[nb] = "suspect";

  /* Safety outranks everything. */
  if (s.isSwollen) states.battery = "danger";

  const view = {
    panel: panel,
    states: states,
    swollen: !!s.isSwollen,
    cracked: s.faultKey === "cracked",
    healthPct: s.healthPct,
    /* the printed cell figures, so the label on the bench and the sum the
       student is asked to do are the same numbers */
    cell: s.cell
  };

  return {
    kind: "bench",
    title: "The handset, laid out in order",
    intro: s.isSwollen
      ? "Before anything else: that cell is swollen. It has lifted the whole stack off the " +
        "midframe, which is how this is found without opening anything."
      : "Bottom to top: " +
        layersFor(panel).map(function (L) { return L.label.toLowerCase(); }).join(", ") +
        ". Knowing that order is what stops you buying the wrong part." +
        (panel === "oled"
          ? " This handset is OLED, so there is no backlight in it at all — the pixels make " +
            "their own light. Shining a torch at a black OLED screen tells you nothing, and " +
            "a black one is the panel."
          : " This handset is an LCD, so the panel is lit from behind. That is the one place " +
            "the torch test earns its keep."),
    height: 460,
    bench: {
      spec: function () { return mobileBench(view); },
      status: function () {
        if (s.isSwollen) {
          return { words: "Swollen cell — stop", tone: "dead",
            detail: "Do not press it flat, do not puncture it, do not charge it. Isolate the " +
              "device and follow the disposal procedure." };
        }
        if (!guilty) {
          return { words: "Nothing wrong with the stack", tone: "calm",
            detail: "This is not a display or a battery fault. Taking the screen off would cost " +
              "an hour and find nothing." };
        }
        return { words: "One layer has failed", tone: "urgent",
          detail: (s.fault && s.fault.said) ? "What the customer said: " + s.fault.said : "" };
      },
      controls: function () {
        return LAYERS.map(function (L) {
          return {
            key: L.key,
            label: L.label,
            state: states[L.key],
            stateWords: layerWords(states[L.key]),
            detail: L.key === "battery" && s.healthPct !== undefined
              ? s.healthPct + " per cent of design capacity, " + s.cycles + " cycles"
              : L.says
          };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

export function buildStage(key, s) {
  const f = s.fault;

  if (key === "brief") {
    /* THE PHONE IS ON THE BENCH FROM THE FIRST SCREEN, AND IT IS CLOSED.

       This stage used to be text and nothing else — the first thing a
       student met on the mobile lab was a wall of quotes, and the handset
       did not appear until stage two, already in seven pieces. That is
       backwards. A job starts with a device in your hand.

       A CRACKED SCREEN IS CRACKED FROM THE BEGINNING. The customer says
       "the screen is broken"; the phone in front of them shows the
       fracture, with the picture running underneath it. Those two facts
       together are the whole opening lesson, and neither of them lands
       if the damage only turns up three stages later.

       `opened` is the stage's own state and the bench reads it. Get the
       teardown question below right and the phone comes apart — the
       model follows the decision rather than sitting there contradicting
       it. */
    let opened = false;
    const cracked = s.faultKey === "cracked";
    return {
      title: "What did they actually tell you?",
      intro: "Users describe what they noticed, not what is wrong. The useful detail is usually one clause inside a sentence about something else. The device is on the bench — look at it before you read too much into the words.",
      panels: [
        {
          kind: "bench", height: 420,
          title: "The device, as it came in",
          intro: "Select the handset and open it up — click it, or press E with it selected. " +
            "Nothing is marked and nothing is stripped: this is what was handed across the counter.",
          bench: {
            spec: function () {
              return mobileBench({ panel: panelKind(s), exploded: opened, cracked: cracked,
                swollen: !!s.isSwollen, states: {}, healthPct: s.healthPct, cell: s.cell });
            },
            status: function () {
              if (opened) {
                return { tone: "calm", words: "Open, and in order",
                  detail: "Bottom to top, the way it came apart. Nothing here is marked as the " +
                    "fault — that is still yours to find." };
              }
              return { tone: cracked ? "warn" : "calm",
                words: cracked ? "Front glass is broken" : "Closed, nothing opened yet",
                detail: cracked
                  ? "Look at what the display is still doing under the damage. A broken front " +
                    "and a dead display are different parts and very different money."
                  : "Whatever they have brought it in for, it is not visible from the outside." };
            },
            /* ONE CONTROL PER PART, DERIVED FROM THE PARTS THEMSELVES.

               The first cut listed a single entry called "The handset"
               and the suite refused it — `benches mount` requires at
               least three controls, on the grounds that a bench with
               fewer is a picture with a button rather than an interface.
               It was right, and for a better reason than the count: the
               closed phone has five real parts and every one of them
               carries a note a student cannot otherwise reach. The one
               on the cracked glass says why a broken front and a dead
               display are different parts, which is the whole opening
               lesson of the stage.

               Built by mapping the bench's own parts rather than typed
               out beside them, so a part added to the closed view cannot
               go missing from the list — the drift that the printer
               lab's hand-written stage list already taught this build
               once.

               EVERY part carries the open action, not just the glass. A
               student pressing E should not first have to work out which
               row the keyboard shortcut lives on. */
            controls: function () {
              if (opened) return [];
              return mobileBench({ panel: panelKind(s), exploded: false, cracked: cracked,
                  swollen: !!s.isSwollen, states: {}, healthPct: s.healthPct, cell: s.cell })
                .parts.map(function (p) {
                  const isGlass = p.key === "shell-glass";
                  return {
                    key: p.key,
                    label: p.label,
                    state: (isGlass && cracked) ? "warn" : "na",
                    stateWords: (isGlass && cracked) ? "Broken — display still live behind it"
                                                     : (p.spec || "As it came in"),
                    detail: p.note,
                    actions: [{ id: "open", label: "Open it up",
                      hint: "Take the back off and get inside" }]
                  };
                });
            },
            /* The bench does not decide whether opening it was RIGHT. It
               reports that the student asked, and the question below is
               what grades it — same division of labour as every other
               bench in this build: the canvas is scenery, the question
               marks the answer. */
            onAction: function (k, id) {
              if (id !== "open") return {};
              return { say: "Before you take anything apart, answer the question underneath — " +
                "there is an order to this and getting it wrong on a phone is expensive." };
            }
          }
        },
        briefPanel(s)
      ],
      questions: [{
        key: "mb-open", kind: "choice",
        prompt: "You have agreed the repair and the device is in front of you. What do you do FIRST?",
        detail: "Answer this and the handset comes apart on the bench above.",
        hints: [
          "Think about what is still connected inside a phone that is switched off, and what " +
            "happens to it when a metal tool goes past the back cover.",
          "On any device with a lithium cell, one connection has to come off before any other " +
            "work begins and go back on last. It is the same rule on a laptop, and it is the " +
            "rule that stops a slipped tool becoming a fire."
        ],
        options: rng(s.seed + 733).shuffle([
          { key: "battfirst", correct: true,
            label: "Power it right down, open the back, and disconnect the battery before anything else",
            why: "The battery connector comes off first on every job inside a phone and goes back " +
              "on last. Until it does, every track on that board is live and a slipped tool is a " +
              "short across a lithium cell." },
          { key: "screenfirst", correct: false,
            label: "Take the screen off first — it is the part being replaced",
            why: "The strongest wrong answer, because it is the part you came for. But the screen " +
              "flex plugs into a board that is still powered, and prising a screen with the cell " +
              "connected is how a repair becomes a board replacement." },
          { key: "charge", correct: false,
            label: "Put it on charge so it is full for testing afterwards",
            why: "A charged cell is a more dangerous cell to work beside, not a more convenient " +
              "one — and you are about to disconnect it anyway. Charge it at the END, when you " +
              "are testing." },
          { key: "order", correct: false,
            label: "Order the replacement part now so it arrives sooner",
            why: "Reasonable instinct and the wrong order. You have not been inside it yet, so " +
              "you do not know which part it needs — and on a screen job that choice is an " +
              "assembly or a panel, which are different prices." },
          { key: "reset", correct: false,
            label: "Factory reset it so the customer's data is safe",
            why: "This DESTROYS their data rather than protecting it, and it is not yours to do. " +
              "Back up with their permission if the device still runs; never wipe a device you " +
              "were handed to repair." },
          { key: "prise", correct: false,
            label: "Heat the back and prise it up at the nearest corner",
            why: "Half right and dangerous. Heat is correct — the perimeter adhesive softens " +
              "rather than shears — but going in at a corner is how the back glass cracks, and " +
              "you still have not isolated the cell." }
        ]),
        explain: "Battery first, every time. Power down, back off, cell disconnected — then the job starts.",
        onCorrect: function () { opened = true; }
      }, {
        key: "mb-brief", kind: "multi",
        prompt: "Which parts of that are diagnostic?",
        detail: "One or two of these narrow the fault. The rest is history and hearsay.",
        hints: [
          "A diagnostic detail is one that RULES SOMETHING OUT. Read each quote and ask what it makes impossible.",
          "Look for anything that says one part of the device still works. Something that still works is the strongest evidence there is."
        ],
        options: [
          { key: "sym", label: "The specific thing it does or does not do", correct: true,
            why: "Yes — this is the fault. Everything else is context around it." },
          { key: "still", label: "What still works despite the fault", correct: true,
            why: "Yes, and it is the most useful sentence they said. A working layer eliminates every fault that would have killed it." },
          { key: "drop", label: "That it was dropped a month ago", correct: false,
            why: "Tempting, but a month of normal use since then makes it weak evidence — and it can send you looking for impact damage that is not the cause." },
          { key: "warranty", label: "That it is out of warranty", correct: false,
            why: "That decides who pays, not what is wrong." },
          { key: "reset", label: "That somebody suggested a factory reset", correct: false,
            why: "Advice from a friend. Acting on it would destroy their data before you know whether it is even a software fault." }
        ],
        explain: "The symptom, and what still works. Those two together eliminate more than any test you can run."
      }]
    };
  }

  if (key === "triage") {
    return {
      title: "Hardware, software, or how it is set up?",
      intro: "Getting this wrong costs hours. Ordering a screen for a settings problem is the classic version.",
      panels: [handsetPanel(s), briefPanel(s), {
        kind: "note", title: "Two things you already know",
        paragraphs: [
          s.faultKey === "sync" ? "Their personal mail account on the same device works perfectly."
            : s.faultKey === "mdm" ? "Other people enrolled on the same system this morning without trouble."
            : s.faultKey === "drain" ? "It happens on Wi-Fi and on mobile data, and a restart makes no difference."
            : "The device otherwise behaves completely normally.",
          "Nothing has been opened yet."
        ]
      }],
      questions: [{
        key: "mb-where", kind: "choice",
        prompt: "Where does this fault live?",
        hints: [
          "Ask what would have to be true for each answer. If one account works and another does not, what does that prove about the hardware and the network?",
          "Hardware faults do not care about settings and do not come and go with apps. Configuration faults affect one account, one app or one service and leave everything else alone."
        ],
        options: [
          { key: "hardware", label: "Hardware — something physical has failed", correct: f.where === "hardware",
            why: f.where === "hardware"
              ? "Right. The symptom is physical and no amount of settings work will touch it."
              : "No — the device's hardware is demonstrably fine, because other things using the same hardware work." },
          { key: "software", label: "Software — an app or the OS is misbehaving", correct: f.where === "software",
            why: f.where === "software"
              ? "Right. It is behavioural rather than physical, and it follows what the device is running."
              : "A software fault would not produce this. It is either physical or a setting." },
          { key: "config", label: "Configuration — a setting or account is wrong", correct: f.where === "config",
            why: f.where === "config"
              ? "Right. One account or service fails while everything around it works, which is the signature of a setting."
              : "Nothing here points at a setting — the fault does not care how the device is configured." },
          { key: "network", label: "The network is at fault", correct: false,
            why: "The network serves this device fine for other things. Blaming it does not survive the first check." }
        ,
            /* Two more categories a technician genuinely files faults
               under. One is the shrug that ends every difficult call;
               the other is a real category with a real test. */
            { key: "user", label: "User error \u2014 they are doing something wrong with it",
              correct: false,
              why: "Occasionally true and almost never the first answer. It cannot be disproved, " +
                "it stops the diagnosis dead, and it puts the customer on the defensive. Reach " +
                "for it after the evidence has cleared the machine, never instead of reading it." },
            { key: "carrier", label: "The carrier or service provider", correct: false,
              why: "A real category with a simple test: a provider fault shows on more than one " +
                "handset, in the same place, at the same time. One device behaving differently " +
                "from the ones beside it is not this." }
          ],
        explain: "Triage before tools. " + f.fix
      }]
    };
  }

  if (key === "digitizer") {
    const layer = s.stackLayer ? STACK.filter(function (L) { return L.key === s.stackLayer; })[0] : null;
    /* When the generated fault is not a display fault, the stage still
       teaches the stack — using a worked example rather than pretending
       this device has a screen fault it does not have. */
    /* STACK[0] now, not STACK[1]. The worked example for this stage was
       the digitizer entry, which was index 1; merging it into the glass
       moved that entry to index 0 and left the fallback pointing at the
       PANEL \u2014 a stage about telling the touch layer from the image layer
       would have used the image layer as its example of the touch one. */
    const useCase = layer || STACK[0];
    const others = STACK.filter(function (L) { return L.key !== useCase.key; });
    return {
      title: "Digitizer or panel?",
      intro: layer
        ? "This one is a display fault. Take the stack apart before you order anything."
        : "This device does not have a screen fault — but this is the call you will get most often, so work it through on a worked example.",
      panels: [{ kind: "mech", title: "The display stack, outside in", frames: stackFrames() },
        {
          /* THE STACK AS OBJECTS, WITH NOTHING MARKED. The frames above
             teach the order; this is the same seven layers as parts you
             can turn round, so "the layer that FEELS" and "the layer
             that SHOWS" stop being two words on a diagram and become two
             pieces of hardware with different thicknesses and different
             prices. It marks nothing, because naming the layer is the
             question — the same decision as `panelpart` next door. */
          kind: "bench", height: 400,
          bench: {
            spec: function () {
              return mobileBench({ panel: s.panel || "lcd", states: {},
                                   healthPct: s.healthPct, cell: s.cell });
            },
            status: function () {
              return { tone: "warn", words: "Nothing is marked",
                detail: "Seven layers, and the cover glass and digitizer are ONE of them — "
                  + "bonded together, sold together, and there is no such thing as buying "
                  + "the touch layer on its own for a handset like this." };
            },
            controls: function () { return []; },
            onAction: function () { return {}; }
          }
        },
        { kind: "note", title: layer ? "What this device is doing" : "The example",
          paragraphs: [useCase.fails] }],
      questions: [{
        key: "mb-layer", kind: "choice",
        prompt: "Which layer has failed?",
        hints: [
          "Step through the stack view. Ask two questions of the device, not one: does it still SHOW, and does it still FEEL? Each layer in the stack answers those two differently, and no two of them answer both the same way.",
          "The question to ask is never \"is the screen broken\". It is: does it still SHOW, and does it still FEEL? Each answer eliminates half the stack."
        ],
        options: rng(s.seed + 21).shuffle(
          [{ key: useCase.key, label: useCase.name, correct: true, why: useCase.tell }].concat(
            others.map(function (L) {
              return { key: L.key, label: L.name, correct: false,
                why: "A failed " + L.name.toLowerCase() + " gives you: " +
                  L.fails.charAt(0).toLowerCase() + L.fails.slice(1) };
            })).concat([
            /* THREE MORE PARTS OF THE SAME SANDWICH, so the field is the
               whole assembly and not just the layers that carry image and
               touch. All three are real, all three get blamed, and all
               three fail in ways that are distinguishable if you look
               properly — which is the entire skill this stage teaches.

               It was two, and six options came out of four stack layers
               plus these. Merging the digitizer into the glass took the
               stack to three and the field to five, and six-options caught
               it. The right answer is not to un-merge: it is that there
               was always a sixth real candidate here and it was missing. */
            { key: "flexcable", label: "The flex cable between the stack and the board",
              correct: false,
              why: "The strongest wrong answer here, because a partly seated flex genuinely mimics " +
                "a dead layer. The difference is CONSISTENCY: a flex fault comes and goes, or " +
                "changes when the device is flexed or pressed. A fault that is identical every " +
                "single time you look is in the layer itself." },
            { key: "driverchip", label: "The display driver chip on the panel's edge",
              correct: false,
              why: "A real part with a real signature, and it is bonded to the panel so it " +
                "cannot be replaced on its own. But a failed driver takes out a COLUMN or a " +
                "band \u2014 the same stripe, in the same place, every single time \u2014 and leaves the " +
                "rest of the picture perfect. A whole layer that has stopped doing its job is " +
                "not this." },
            { key: "frame", label: "The adhesive and frame the stack is bonded into",
              correct: false,
              why: "A lifting or badly re-bonded frame gives light leaks around the edge and a " +
                "screen that flexes under a fingertip \u2014 not a clean loss of image or of " +
                "touch. It is what you get wrong when you REFIT the part, not what has failed." }
          ])),
        explain: useCase.tell + " Order the " + useCase.part + "."
      }]
    };
  }

  if (key === "safety") {
    return {
      title: "The one that can hurt somebody",
      intro: s.isSwollen
        ? "This device has a swollen cell. What you do in the next minute matters more than anything else in this lab."
        : "This device's battery is fine — but you will meet a swollen one, and there is no room to work it out on the day.",
      panels: [focusPanel(s, ["battery"], {
        /* SWOLLEN ON THIS STAGE WHATEVER THE SCENARIO IS. The stage
           teaches swollen-cell handling, and a student reading the order
           of operations beside a flat healthy pouch is being taught the
           procedure for a thing they have never seen. The intro already
           says whether THIS device has one; the bench shows the shape
           they have to recognise on the day. */
        swollen: true,
        title: "A swollen cell, on the bench",
        intro: "The dome is the whole tell. Same foil, same label, same footprint as a good " +
          "one — the seal welds do not move, so nothing about it grows. Only the middle lifts, " +
          "and the printed label bends over the rise instead of lying flat. Nothing printed on " +
          "a battery ever tells you it has failed.",
        tone: "urgent", words: "Do not press, puncture or charge it",
        detail: "Gas inside the pouch, and the process does not reverse. Handle it flat."
      }), {
        kind: "note", title: "What a swelling cell is doing",
        paragraphs: [
          "A lithium cell swells because it is generating gas internally. That gas is the cell breaking down, and the process does not reverse.",
          "A punctured or crushed swollen cell can go into thermal runaway — a fire that supplies its own oxygen, cannot be smothered, and will not go out until the cell is spent."
        ]
      }],
      questions: [{
        key: "mb-safety", kind: "order",
        prompt: "Put the handling steps in order.",
        detail: "Getting this order wrong is the difference between a safe job and a fire.",
        hints: [
          "Two of these make the situation WORSE if they happen early, and one of them is what most people reach for first.",
          "Think about what adds energy to a cell that is already breaking down, and what puts pressure on it. Both of those come after it is isolated, or not at all."
        ],
        steps: [
          { key: "stop",   at: 1, label: "Stop using it and take it off charge" },
          { key: "power",  at: 2, label: "Power it down if it is still on" },
          { key: "isolate",at: 3, label: "Move it somewhere non-flammable, away from other stock" },
          { key: "nopress",at: 4, label: "Handle it flat, without pressing, bending or prising" },
          { key: "waste",  at: 5, label: "Dispose of it as hazardous waste, not in the bin" }
        ],
        explain: "Off charge first — charging a swelling cell adds energy to a failing one. Never press it flat to close the case, " +
          "never puncture it, and never put it in general waste."
      }]
    };
  }

  if (key === "health") {
    return {
      title: "Is the battery worn, or is something eating it?",
      intro: "Users say the battery is dead. Half the time it is, and half the time an app is holding the device awake.",
      panels: [focusPanel(s, ["battery"], {
        title: "The cell the report is about",
        intro: "Read the label. The part number, the chemistry, the capacity in mAh AND in " +
          "watt-hours, the nominal voltage and the charge limit are all printed on it — and " +
          "Wh = V \u00d7 Ah, so the two capacity figures are a worked example of that sum " +
          "sitting on the part.",
        tone: "calm", words: "Nothing visibly wrong with it",
        detail: "A worn cell looks exactly like a healthy one. The figures are the only thing " +
          "that separates them, which is why this stage is arithmetic rather than inspection."
      }), {
        kind: "table", title: "What the battery report says",
        columns: ["", ""],
        rows: [
          { cells: ["Design capacity", s.designMah + " mAh"] },
          { cells: ["Current full-charge capacity", s.currentMah + " mAh"] },
          { cells: ["Charge cycles", String(s.cycles)] }
        ],
        note: "A cell is generally considered worn out below 80% of its design capacity. Cells lose roughly 20% over their first 500 cycles."
      }],
      questions: [
        { key: "mb-health", kind: "number",
          prompt: "What percentage of its design capacity is left?",
          unit: "%", answer: s.healthPct, tolerance: 1.5,
          hints: ["Both capacities are in the table. One divided by the other.",
                  "Current divided by design, times a hundred. The cycle count is context, not part of this sum."],
          explain: s.currentMah + " ÷ " + s.designMah + " × 100 = " + s.healthPct + "%." },
        { key: "mb-verdict", kind: "choice",
          prompt: "So what do you tell them?",
          hints: [
            "Compare the figure you just worked out against the threshold in the note under the table.",
            "If the cell is healthy, the battery is not the fault — and telling somebody to replace a good battery costs them money and does not fix anything."
          ],
          options: [
            { key: "worn", label: "The cell is worn out and should be replaced", correct: s.worn,
              why: s.worn ? "Right — " + s.healthPct + "% against an 80% threshold, over " + s.cycles + " cycles. That is a cell at the end of its life."
                : "It is at " + s.healthPct + "%, which is above the 80% threshold. Replacing it would cost them money and change nothing." },
            { key: "app", label: "The cell is healthy, so look for what is draining it", correct: !s.worn,
              why: !s.worn ? "Right — " + s.healthPct + "% is a healthy cell. Go to battery usage by app and find what is holding it awake."
                : "It is at " + s.healthPct + "%, below the 80% threshold. This cell genuinely is worn." },
            { key: "reset", label: "Factory reset it and see", correct: false,
              why: "Destroying their data to test a theory you have not formed yet. The report in front of you answers the question." },
            { key: "charger", label: "It needs a more powerful charger", correct: false,
              why: "A bigger charger fills it faster. It does nothing about how long it lasts." }
          ,
            { key: "cycles", label: "It is still within its rated cycle count, so it is fine",
              correct: false,
              why: "The rated count is what the maker expects on average. The health figure in " +
                "front of you is what actually happened to THIS cell, in this pocket, on this " +
                "charger. Where the two disagree, believe the measurement." },
            { key: "calibrate", label: "Recalibrate it by running it flat and charging to full",
              correct: false,
              why: "Real advice, for nickel cells, decades ago. On lithium it does nothing for " +
                "capacity, and a deep discharge is one of the few things that actively harms the " +
                "cell. It also sends them away still believing it." }
          ],
          explain: s.worn ? "Worn cell. Replace it." : "Healthy cell — the drain is behavioural, so find the app." }
      ]
    };
  }

  if (key === "power") {
    /* Distinct from the `health` stage on purpose. `health` answers "is
       the cell worn"; this one answers "then what is eating it". Both
       are real calls and the second is the one people get wrong,
       because the report names the app and they blame the battery. */
    const r2 = rng(s.seed + 31);
    const hog = r2.pick([
      { app: "a fitness tracker app", pct: r2.int(38, 61),
        why: "It is holding a wake lock to log steps, so the device never actually sleeps." },
      { app: "a social app", pct: r2.int(34, 55),
        why: "Background refresh plus location every few minutes. Both are settings, not faults." },
      { app: "the company mail client", pct: r2.int(30, 48),
        why: "Push set to poll every five minutes rather than using real push, which wakes the radio constantly." },
      { app: "a weather widget", pct: r2.int(28, 44),
        why: "Continuous location rather than significant-change. It is a one-switch fix." }
    ]);
    const screenPct = r2.int(12, 22);
    const rest = 100 - hog.pct - screenPct;
    return {
      title: "So what is eating it?",
      intro: "The cell is fine. Something is keeping the device awake, and the report will name it if you read it properly.",
      panels: [{
        kind: "table", title: "Battery usage since last full charge",
        columns: ["What", "Share of the battery"],
        rows: [
          { cells: [hog.app, hog.pct + "%"], flag: "bad" },
          { cells: ["Screen", screenPct + "%"] },
          { cells: ["Everything else combined", rest + "%"] }
        ],
        note: "Screen time is usually the largest single item on a healthy device. Anything beating it is worth a look."
      }, {
        /* THE CELL THAT IS NOT THE PROBLEM. This stage's whole point is
           that the battery is fine and something is keeping the device
           awake — so the cell is drawn, with its real health on the
           gauge, precisely so the student can rule it out by looking
           rather than by being told. The `health` stage next door asks
           whether it is worn; this one has already answered that and is
           asking what is draining a good one. */
        kind: "bench", height: 380,
        bench: {
          spec: function () {
            return mobileBench({ panel: s.panel || "lcd", states: {},
                                 healthPct: s.healthPct, cell: s.cell });
          },
          status: function () {
            return { tone: "calm", words: "The cell is not the fault",
              detail: "Nothing here is swollen, nothing is marked, and the health figure is "
                + "within normal wear. A device that runs down in an afternoon on a healthy "
                + "cell is being kept AWAKE, and that is a settings problem rather than a "
                + "hardware one." };
          },
          controls: function () { return []; },
          onAction: function () { return {}; }
        }
      }],
      questions: [
        { key: "mb-share", kind: "number",
          prompt: "How many times more battery is the top item using than the screen?",
          unit: "×", answer: Math.round((hog.pct / screenPct) * 10) / 10, tolerance: 0.3,
          hints: ["Both percentages are in the table. One divided by the other.",
                  "You are comparing the top item against the screen row, not against everything else added together."],
          explain: hog.pct + "% ÷ " + screenPct + "% = " + (hog.pct / screenPct).toFixed(1) +
            "×. On a device being used normally, nothing should beat the screen by that margin." },
        { key: "mb-act", kind: "choice",
          prompt: "What do you do about it?",
          hints: [
            "The report has already told you which app. The question is what to change about it, and whether that is your decision to make.",
            "Consider what the user actually wants from that app. Removing it and disabling everything are both fixes; only one of them leaves them with a working phone."
          ],
          options: [
            { key: "settings", label: "Turn off its background refresh and location, and check whether the drain stops",
              correct: true,
              why: "Right. " + hog.why + " Change the setting, then confirm the drain actually stopped — otherwise you have guessed rather than fixed." },
            { key: "delete", label: "Delete the app", correct: false,
              why: "It probably fixes the drain and it is not your call. The user installed it because they want it; change the behaviour first." },
            { key: "battery", label: "Replace the battery", correct: false,
              why: "You have just established the cell is healthy. Replacing it would cost money and change nothing." },
            { key: "reset", label: "Factory reset the device", correct: false,
              why: "You know which app it is. Destroying everything to remove one setting is not a repair." }
          ,
            { key: "reinstall", label: "Uninstall and reinstall the app", correct: false,
              why: "Reasonable when an app misbehaves, and here it destroys your evidence \u2014 " +
                "it clears the usage history you were about to read. Change one thing you can " +
                "measure; this changes several you cannot." },
            { key: "update", label: "Update the OS and see whether it settles", correct: false,
              why: "Worth doing eventually and useless as a diagnosis: it changes a hundred things " +
                "at once and takes an hour, and if the drain does stop you still do not know why." }
          ],
          explain: hog.why + " Confirm the fix held before handing it back — a drain that is 'probably fixed' comes straight back." }
      ]
    };
  }

  if (key === "charge") {
    return {
      title: "Charging port, cable, or charger?",
      intro: "Three things in a chain and any of them can be the fault. Swapping parts blindly is how you replace a port that was fine.",
      panels: [focusPanel(s, ["midframe"], {
        title: "The port, in the frame it is part of",
        intro: "The receptacle is a REAL GAP in the bottom wall with the posts of the speaker " +
          "grille beside it, not a dark rectangle painted on. That matters here: the fault you " +
          "are hunting is lint packed into the back of the shell or a bent pin, and both of " +
          "those are things you look INTO along the bottom edge with a light.",
        tone: "warn", words: "Nothing is marked",
        detail: "A port that has failed and a port full of pocket lint look identical from the " +
          "outside. The order of the tests is what separates them."
      }), {
        kind: "note", title: "What you have on the bench",
        paragraphs: ["A known-good cable, a known-good charger, and another device of the same type that charges normally."]
      }],
      questions: [{
        key: "mb-charge", kind: "order",
        prompt: "Put the tests in the order that isolates the fault fastest.",
        hints: [
          "Each test should rule out exactly one thing. Start with whichever is quickest to swap and most likely to be at fault.",
          "Cables fail most often, then chargers, then ports — and a port is the only one of the three that needs the device opening. Test in that order and you often never get there."
        ],
        steps: [
          { key: "cable",  at: 1, label: "Try the known-good cable with their charger" },
          { key: "psu",    at: 2, label: "Try the known-good charger with the known-good cable" },
          { key: "other",  at: 3, label: "Charge the known-good device from their cable and charger" },
          { key: "look",   at: 4, label: "Look into the port with a light for lint or damage" },
          { key: "port",   at: 5, label: "Only then conclude the port needs replacing" }
        ],
        explain: "Cheapest and most likely first. A pocketful of lint packed into a port looks exactly like a failed port and costs nothing to fix — " +
          "which is why looking comes before concluding."
      }]
    };
  }

  if (key === "sync") {
    return {
      title: "Set up the company account",
      intro: "They have the instructions IT sent. Somewhere in them is everything you need and a lot you do not.",
      panels: [{
        kind: "brief", from: "The email from IT",
        paragraphs: [
          "“Please set up your device using the details below. If you have any trouble the helpdesk is on extension 2200, they are open until five.”",
          "“Server is mail.example-corp.co.uk and you will need SSL turned on. The username is your full email address, not just your name — this catches people out.”",
          "“Incoming is on 993 and outgoing on 587. Do not use the old settings from the intranet page, that page is out of date and we cannot get it taken down.”",
          "“Your device needs a passcode set before enrolment will complete. Company policy, nothing we can do about it.”"
        ]
      }],
      questions: [{
        key: "mb-sync", kind: "multi",
        prompt: "Which of these do you actually need to complete the setup?",
        detail: "Four of these are settings. The rest is around them.",
        hints: [
          "Go through the email and pull out anything you would TYPE INTO A BOX or switch on. Everything else is context.",
          "One of the sentences is not a setting at all but will stop the setup dead if you ignore it — read the last paragraph again."
        ],
        options: [
          { key: "server", label: "The server name", correct: true, why: "Yes. Without it there is nothing to connect to." },
          { key: "ssl", label: "SSL turned on", correct: true, why: "Yes — and on port 993 it is not optional; the server will refuse a plain connection." },
          { key: "user", label: "Full email address as the username", correct: true,
            why: "Yes, and they flagged it because it is the single most common reason this fails." },
          { key: "pass", label: "A passcode set on the device", correct: true,
            why: "Yes. Not a mail setting, but enrolment will not complete without it — this is the one people skip." },
          { key: "ext", label: "The helpdesk extension", correct: false,
            why: "Useful if you get stuck. Not something you type into the setup." },
          { key: "intranet", label: "The settings from the intranet page", correct: false,
            why: "They explicitly told you that page is out of date. Using it is how you end up debugging the wrong values." }
        ],
        explain: "Server, SSL, username format, and the passcode prerequisite. The rest of that email is noise — which is exactly how real instructions arrive."
      }]
    };
  }

  if (key === "radio") {
    return {
      title: "Which radio is it?",
      intro: "A phone has four or five radios in it and users call all of them 'the signal'.",
      panels: [focusPanel(s, ["midframe"], {
        title: "The antennas, which nobody ever sees",
        intro: "This is why \u201cthe signal\u201d is not one thing. The coaxial leads are round cable " +
          "with gold snap connectors on the ends, and the breaks in the frame are the antenna " +
          "gaps themselves — plastic inserts cut into the metal, because a continuous metal " +
          "band would short the antenna out. Different radios use different sections, which is " +
          "exactly why one can fail while the others are perfect.",
        tone: "warn", words: "Nothing is marked",
        detail: "One coax knocked off during a screen replacement is a \u201cno signal since " +
          "the repair\u201d that costs an afternoon to find, because everything else about the " +
          "phone is perfect."
      }), {
        kind: "table", title: "What works and what does not",
        columns: ["Function", "State"],
        rows: [
          { cells: ["Wi-Fi", "Connects and works normally"] },
          { cells: ["Mobile data and calls", "Nothing at all inside the building"], flag: "bad" },
          { cells: ["Bluetooth headset", "Pairs and works"] },
          { cells: ["Maps / location", "Accurate outdoors, poor indoors"] }
        ],
        note: "All of these are separate radios in separate bands, sharing very little beyond the antenna assembly."
      }],
      questions: [{
        key: "mb-radio", kind: "choice",
        prompt: "What does this pattern actually tell you?",
        hints: [
          "Three of the four functions work. Ask what the failing one has that the working ones do not.",
          "A hardware fault in a shared component would take more than one of these down. Consider whether anything here is broken at all."
        ],
        options: [
          { key: "coverage", label: "Nothing is faulty — it is a mobile coverage problem inside that building",
            correct: true,
            why: "Right. Three radios work, so the device is fine. Cellular is the only one that depends on a signal from outside the building, and location indoors is weak for the same reason." },
          { key: "antenna", label: "The antenna assembly has failed", correct: false,
            why: "Then Wi-Fi and Bluetooth would suffer too. They are fine, so the shared parts are fine." },
          { key: "sim", label: "The SIM has failed", correct: false,
            why: "Possible in general — but a dead SIM does not work outside the building either, and this one does." },
          { key: "os", label: "The OS needs updating", correct: false,
            why: "Nothing here points at software. The behaviour changes with where the person is standing, not with what the device is running." }
        ,
            { key: "band", label: "The handset does not support the bands that carrier uses there",
              correct: false,
              why: "The best wrong answer on the page, and separating it is the skill: a band " +
                "mismatch behaves the same everywhere on that network. This pattern changes with " +
                "LOCATION, which points outward at the coverage rather than inward at the radio." },
            { key: "case", label: "The case is blocking the antenna", correct: false,
              why: "Cases do cost a little signal and it is a fair thing to test by taking it off. " +
                "But it would cost the same signal everywhere \u2014 it cannot be fine in the car " +
                "park and hopeless at the back of the same building." }
          ],
        explain: "Not every call is a fault. Wi-Fi calling or a femtocell fixes this; a replacement handset does not."
      }]
    };
  }

  if (key === "diagnose") {
    const d = s.mdevice;
    const issueQ = {
      key: "mdx-issue", kind: "choice",
      prompt: "What is the issue?",
      hints: [
        "Two of the three things they told you are ordinary complaint; one is a measurement or a " +
          "comparison. Find the one that is evidence and work from it.",
        "Ask, for each option, what that fault would DO. Several of these produce a device that " +
          "runs flat early, and what separates them is heat, the health figure, or what happens " +
          "when you change the charger."
      ],
      options: rng(s.seed + 331).shuffle([d.issue].concat(d.wrongIssues).map(function (k) {
        return { key: k, label: MDX_ISSUES[k].label, correct: k === d.issue,
          why: k === d.issue ? d.tell : MDX_ISSUES[k].is + " That is not what this device is doing." };
      })),
      explain: MDX_ISSUES[d.issue].label + ". " + d.tell
    };
    const fixQ = {
      key: "mdx-fix", kind: "choice",
      prompt: "What is the right solution?",
      hints: [
        "The fix has to act on what is actually wrong, and it has to come in the right order. Ask " +
          "of each one what it changes, and what it costs to try.",
        "Free and reversible comes before paid and permanent. And where a cell has swollen, the " +
          "first action is not a repair at all."
      ],
      options: rng(s.seed + 337).shuffle([d.fix].concat(d.wrongFixes).map(function (k) {
        return { key: k, label: MDX_FIXES[k].label, correct: k === d.fix,
          why: k === d.fix ? MDX_FIXES[k].does
             : MDX_FIXES[k].does + " That is not what has gone wrong here." };
      })),
      explain: MDX_FIXES[d.fix].label + ". " + MDX_FIXES[d.fix].does
    };

    const panels = [{
      kind: "brief", from: d.who,
      paragraphs: d.said
    }, {
      kind: "bench", height: 380,
      bench: {
        spec: function () {
          /* Nothing is marked. A swollen cell lifts the stack, which is
             visible and is meant to be — that fault is findable without
             opening anything, and that IS the lesson. Everything else
             shows a handset with no verdict on any layer. */
          return mobileBench({ swollen: !!d.swollen, states: {} });
        },
        status: function () {
          return { tone: d.swollen ? "urgent" : "warn",
            words: d.swollen ? "Do not charge it" : "On the bench",
            detail: d.swollen
              ? "The stack is lifted. Before anything else, this is a cell that is venting."
              : "Nothing is marked. What is wrong is in what they told you and in the figures below." };
        },
        controls: function () {
          return [
            { key: "health", label: "Battery health", state: d.health < 80 ? "bad" : "ok",
              stateWords: d.health + "% of design capacity",
              detail: d.health < 80
                ? "Below eighty percent is the line at which a cell is considered worn out."
                : "Healthy. A cell at this figure holds very nearly what it was built to hold." },
            { key: "cycles", label: "Charge cycles", state: d.cycles > 700 ? "warn" : "ok",
              stateWords: d.cycles.toLocaleString() + " full cycles",
              detail: "Cells are rated for roughly five hundred to a thousand full cycles. Read " +
                "this together with the health figure — either on its own can mislead." }
          ];
        },
        onAction: function () { return {}; }
      }
    }];
    if (d.note) panels.push({ kind: "note", title: "Worth knowing", paragraphs: [d.note] });

    return {
      title: "Name the issue, then name the fix",
      intro: "A device and what its owner said about it, with its own figures beside it. Both " +
        "halves have to be right — the correct diagnosis with the wrong action is still a " +
        "wasted visit, and on one of these the wrong action is dangerous.",
      panels: panels,
      questions: [issueQ, fixQ]
    };
  }

  if (key === "firststep") {
    const f = s.fcase;
    const causeQ = {
      key: "fs-cause", kind: "choice",
      prompt: "What is the most likely cause?",
      hints: [
        "One line in the report is a COMPARISON — another device, another room, another day. " +
          "That line is doing the work; find it and ask what it rules out.",
        "Several of these would produce the symptom. Ask which one also explains the comparison, " +
          "because the others cannot."
      ],
      options: rng(s.seed + 401).shuffle([f.cause].concat(f.wrongCauses).map(function (k) {
        return { key: k, label: FS_CAUSES[k].label, correct: k === f.cause,
          why: k === f.cause ? f.tell : FS_CAUSES[k].is + " That is not what this one is doing." };
      })),
      explain: FS_CAUSES[f.cause].label + ". " + f.tell
    };
    const firstQ = {
      key: "fs-first", kind: "choice",
      prompt: "What do you do FIRST?",
      detail: "More than one of these would eventually work. The question is which one comes first.",
      hints: [
        "Rank them by what they cost: a setting is free, a restart is a minute, opening the case " +
          "is a job, and a part is money. Then take the cheapest one that could settle it.",
        "One of these is right about the part and wrong about the order, and on this list that is " +
          "the most common way to be wrong. Ask what each action costs before asking whether it works."
      ],
      options: rng(s.seed + 409).shuffle([f.first].concat(f.wrongActions).map(function (k) {
        return { key: k, label: FS_ACTIONS[k].label, correct: k === f.first,
          why: k === f.first ? FS_ACTIONS[k].does + " " + f.order
             /* A cheaper option that cannot work gets the reason the case
                had to write for it, rather than a bare "not first" that
                would look like the stage contradicting itself. */
             : (f.cheaperButCannot || {})[k]
               ? FS_ACTIONS[k].does + " " + f.cheaperButCannot[k]
               : FS_ACTIONS[k].does + " Not first." };
      })),
      explain: FS_ACTIONS[f.first].label + ". " + f.order
    };

    const panels = [{ kind: "brief", from: f.who, paragraphs: f.said }, {
      kind: "bench", height: 360,
      bench: {
        spec: function () {
          /* Nothing is marked. A swollen cell lifts the stack, and that
             is a thing you can SEE without opening anything, which is
             the lesson on that one scenario. */
          return mobileBench({ swollen: f.cause === "swollen", cracked: f.cause === "glass",
                               states: {} });
        },
        status: function () {
          return { tone: f.cause === "swollen" ? "urgent" : "warn",
            words: f.cause === "swollen" ? "Do not keep working on it" : "On the bench",
            detail: f.cause === "swollen"
              ? "The stack is lifted. Whatever else is true, this one is not safe to leave powered."
              : "Nothing is marked. What decides it is in what they told you." };
        },
        controls: function () { return []; },
        onAction: function () { return {}; }
      }
    }];
    if (f.note) panels.push({ kind: "note", title: "Worth knowing", paragraphs: [f.note] });

    return {
      title: "What do you do first?",
      intro: "Naming the fault is half the job. The other half is doing the cheapest thing that " +
        "could settle it before the expensive thing that definitely would — and on one of " +
        "these, before the thing that is dangerous.",
      panels: panels,
      questions: [causeQ, firstQ]
    };
  }

  /* ---- 3.1 + 5.4 : which PART of the panel ----------------------------
     The stage after `digitizer`, and deliberately the harder one. That
     stage asks which LAYER of the sandwich; this one takes the layer it
     lands on and asks which part inside it — which is where the money
     is, because the answer decides whether the customer is quoted a
     screen, a backlight, or nothing at all. */
  if (key === "panelpart") {
    const c = s.ppcase;
    const P = PANEL_PARTS[c.part];
    const oled = panelKind(s) === "oled";
    /* THE FIELD IS SIX, AND THE FIVE WRONG ONES ARE DRAWN FROM THE SAME
       TABLE. Every distractor is therefore a real part of a real panel
       with a real failure signature — no filler is possible here,
       because there is nothing in the table that is not a part. */
    const others = Object.keys(PANEL_PARTS)
      .filter(function (k) { return k !== c.part; });
    const wrong = rng(s.seed + 601).some(others, 5);

    return {
      title: "Which part of the panel is that?",
      intro: oled
        ? "This customer's handset is an OLED, and the panel on the bench is an LCD — so work " +
          "it on the LCD, because that is what most of what comes through the door is and " +
          "because the LCD is the one with parts you can tell apart. Three of these exist in " +
          "an OLED too: the drivers at right angles, the transistor sheet, and a polariser."
        : "The display module out of the stack, close enough to read — the panel and the light " +
          "behind it. The customer has told you the screen is broken. Nobody ever tells you " +
          "which PART, and the difference between them is the difference between a quote they " +
          "accept and one they walk away from.",
      panels: [
        { kind: "brief", from: "Front desk", paragraphs:
            ["What was written down when it came in."]
              .concat(c.said.map(function (t) { return "“" + t + "”"; })) },
        {
          kind: "bench", height: 420,
          title: "The display module, out of the stack",
          intro: "The panel and the light behind it, which is what a display assembly actually " +
            "is. Turn it over: the chip along the bottom edge and the strip down the side are " +
            "two different drivers, and which way a band runs tells you which of them it is. " +
            "The light guide and its LEDs are underneath, on their own circuit — a perfect " +
            "picture with no light and light with no picture are two different faults.",
          bench: {
            /* The LCD stack whatever the handset is: the parts being
               named are LCD parts, and an OLED bench would draw six of
               the eight options nowhere at all. The intro says so
               rather than letting the model and the words disagree.

               BOTH LAYERS, ALWAYS, AND NEVER THE ONE THE ANSWER IS ON.
               The first cut focused whichever layer held the correct
               part — so a student could read the answer's half off the
               picture without looking at the brief: backlight on screen
               meant the field was two, panel meant six. `P` is
               deliberately not consulted here. Every seed gets the same
               two layers, and the only thing that varies between them is
               what the front desk wrote down. */
            spec: function () {
              return mobileBench({ panel: "lcd", focus: PANEL_BENCH,
                                   states: {}, healthPct: s.healthPct, cell: s.cell });
            },
            status: function () {
              return { tone: "warn", words: "Nothing is marked",
                detail: "The model does not know which part has failed and neither does the " +
                  "front desk. What decides it is in what they wrote down." };
            },
            controls: function () { return []; },
            onAction: function () { return {}; }
          }
        },
        { kind: "note", title: "The two drivers, and why the direction matters", paragraphs: [
          "A panel is switched by two chips working at right angles to each other. The one " +
            "bonded along the BOTTOM edge drives the columns; the one built onto the glass " +
            "down the SIDE switches the rows.",
          "So a band running down the screen and a band running across it are two different " +
            "parts, and they are the most commonly confused pair on this list. Neither is " +
            "replaceable on its own — but naming the right one is what tells the customer " +
            "the fault is in the panel and not in their phone."
        ] }
      ],
      questions: [{
        key: "mb-panelpart", kind: "choice",
        prompt: "Which part of the panel is at fault?",
        hints: [
          "Read what the front desk wrote down, and read past the first line — the first line " +
            "is always “the screen is broken”. The clause that decides this is one they " +
            "thought was small talk: what direction it runs, whether it changes when the phone " +
            "is tilted, whether it grew, or what they saw with a torch.",
          "Four questions separate every part on this list, and each one eliminates a group. " +
            "Does the picture still appear in the bad area under a torch — light, or panel? " +
            "Does the fault run down or across — column driver, or row driver? Does it change " +
            "with angle or with pressure — an optical film, or the liquid crystal? And is it " +
            "the size of a sub-pixel, in which case it is one transistor and there is nothing " +
            "to repair."
        ],
        options: rng(s.seed + 613).shuffle(
          [{ key: c.part, label: P.label, correct: true, why: c.tell }].concat(
            wrong.map(function (k) {
              const W = PANEL_PARTS[k];
              return { key: k, label: W.label, correct: false,
                why: W.does + " When it fails you get " + W.fails + " — which is not what the " +
                  "front desk wrote down." };
            }))),
        explain: c.tell + " " + P.job
      }]
    };
  }

  throw new Error("lab-mobile: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js. */
export function selfCheck(sc) {
  const bad = [];
  if (!FAULTS[sc.faultKey]) return ["fault \"" + sc.faultKey + "\" is not in the table"];

  /* ---- diagnose ----------------------------------------------------
     Both halves answerable, neither containing its own answer, and the
     figures on the bench must AGREE with the issue: a worn cell that
     reports 96% health, or a healthy one that reports 60%, would put the
     evidence and the answer on opposite sides. */
  const d = sc.mdevice;
  if (!d) { bad.push("no device generated"); }
  else {
    if (!MDX_ISSUES[d.issue]) bad.push("device " + d.key + " has issue \"" + d.issue + "\", which is not in the table");
    if (!MDX_FIXES[d.fix]) bad.push("device " + d.key + " has fix \"" + d.fix + "\", which is not in the table");
    if ((d.wrongIssues || []).length !== 5) bad.push("device " + d.key + " offers " + (d.wrongIssues || []).length + " wrong issues, not five");
    if ((d.wrongFixes || []).length !== 5) bad.push("device " + d.key + " offers " + (d.wrongFixes || []).length + " wrong fixes, not five");
    if ((d.wrongIssues || []).indexOf(d.issue) >= 0) bad.push("device " + d.key + " lists its own issue among the wrong ones");
    if ((d.wrongFixes || []).indexOf(d.fix) >= 0) bad.push("device " + d.key + " lists its own fix among the wrong ones");
    (d.wrongIssues || []).forEach(function (k) {
      if (!MDX_ISSUES[k]) bad.push("device " + d.key + " names issue \"" + k + "\", which is not in the table");
    });
    (d.wrongFixes || []).forEach(function (k) {
      if (!MDX_FIXES[k]) bad.push("device " + d.key + " names fix \"" + k + "\", which is not in the table");
    });
    if ((d.said || []).length < 2)
      bad.push("device " + d.key + " has fewer than two lines of report");
    /* The evidence has to point the same way as the answer. */
    if (d.issue === "worn" && d.health >= 80)
      bad.push("device " + d.key + " is answered \"worn cell\" and reports " + d.health + "% health, which is not worn");
    if (d.issue === "nofault" && d.health < 85)
      bad.push("device " + d.key + " is answered \"nothing is wrong\" and reports " + d.health + "% health, which is a fault");
    if (d.issue === "gauge" && d.health < 85)
      bad.push("device " + d.key + " blames the gauge on a cell that is genuinely worn");
    if (d.swollen && d.issue !== "swollen")
      bad.push("device " + d.key + " draws a swollen cell on the bench and is answered \"" + d.issue + "\"");
    if (!d.swollen && d.issue === "swollen")
      bad.push("device " + d.key + " is answered \"swollen\" and the bench draws a flat stack");
  }
  /* ---- firststep -------------------------------------------------
     The distinctive claim of this stage is that the right answer is the
     CHEAPEST action that could settle it, so that is what gets checked:
     every action carries a cost rank, and the one named `first` must not
     be beaten by any of the five wrong ones. Without this an author can
     quietly build a scenario whose "first" step is the expensive one and
     whose own explanation then argues against itself. */
  const COST = {
    /* free — a setting, a figure already on screen, or looking at something */
    reviewusage: 1, lowerradios: 1, verifycell: 1, disablelock: 1, checkbright: 1,
    selectinput: 1, enablewifi: 1, freespace: 1, checkmdm: 1, wifioffcheck: 1,
    testpattern: 1, angleinspect: 1, torch: 1,
    /* a meter and a wait: cheap, non-destructive, and both of them stand
       between a technician and a battery they did not need to buy */
    wakepack: 1,
    /* free and safety-first: this outranks everything, cost is not the point */
    powerdown: 0,
    /* a minute or two, or a restart */
    powersave: 2, safemode: 2, coolretest: 2, stylustest: 2, cleanport: 2,
    reseatsim: 2, reseatcable: 2, lowerres: 2, removefilm: 2,
    measurepack: 2, loadtest: 2, checkntc: 2,
    /* destructive to configuration, or slow, or it changes several things */
    resetnet: 3, updateos: 3, rundiag: 3, sensordiag: 3, knowngood: 3,
    shortertimeout: 3, pixelrefresh: 3, callcarrier: 3,
    /* opening the machine */
    inspectcable: 4, inspectant: 4, reseatnic: 4, reseatlive: 5,
    /* money */
    replcell: 5, replpanel: 5, repldisplay: 5, quotescreen: 5,
    genuinepack: 5, scrapcell: 5, replboard: 6,
    /* actively unsafe */
    keepusing: 9
  };
  const f = sc.fcase;
  if (!f) { bad.push("no first-step case generated"); }
  else {
    if (!FS_CAUSES[f.cause]) bad.push("case " + f.key + " has cause \"" + f.cause + "\", which is not in the table");
    if (!FS_ACTIONS[f.first]) bad.push("case " + f.key + " has action \"" + f.first + "\", which is not in the table");
    if ((f.wrongCauses || []).length !== 5) bad.push("case " + f.key + " offers " + (f.wrongCauses || []).length + " wrong causes, not five");
    if ((f.wrongActions || []).length !== 5) bad.push("case " + f.key + " offers " + (f.wrongActions || []).length + " wrong actions, not five");
    if ((f.wrongCauses || []).indexOf(f.cause) >= 0) bad.push("case " + f.key + " lists its own cause among the wrong ones");
    if ((f.wrongActions || []).indexOf(f.first) >= 0) bad.push("case " + f.key + " lists its own action among the wrong ones");
    (f.wrongCauses || []).forEach(function (k) {
      if (!FS_CAUSES[k]) bad.push("case " + f.key + " names cause \"" + k + "\", which is not in the table");
    });
    (f.wrongActions || []).forEach(function (k) {
      if (!FS_ACTIONS[k]) bad.push("case " + f.key + " names action \"" + k + "\", which is not in the table");
    });
    if (!f.tell) bad.push("case " + f.key + " has no reason for its cause");
    if (!f.order) bad.push("case " + f.key + " has no reason for its ORDER, which is the whole stage");
    if ((f.said || []).length < 2) bad.push("case " + f.key + " has fewer than two lines of report");
    /* THE ONE THAT MATTERS. */
    const mine = COST[f.first];
    if (mine === undefined) {
      bad.push("case " + f.key + " names action \"" + f.first + "\", which has no cost rank");
    } else {
      (f.wrongActions || []).forEach(function (k) {
        const c = COST[k];
        if (c === undefined) { bad.push("action \"" + k + "\" has no cost rank"); return; }
        /* CHEAPEST FIRST really means CHEAPEST THAT COULD SETTLE IT.
           A cheaper action is allowed to be on the list when it simply
           cannot fix this fault \u2014 burn-in is the case that proves it,
           where every cheaper option treats a condition the user has
           already ruled out by leaving the device off all weekend. But
           the author has to SAY SO, per option, and that sentence is
           what the student is shown. An unexplained cheaper option is
           the stage arguing against itself. */
        if (c < mine && !(f.cheaperButCannot || {})[k]) {
          bad.push("case " + f.key + " answers \"" + f.first + "\" (cost " + mine +
            ") while offering the cheaper \"" + k + "\" (cost " + c +
            ") with no reason why the cheaper one cannot work \u2014 either it should be the " +
            "answer, or `cheaperButCannot` has to say why it is not");
        }
      });
    }
  }
  if (f) {
    Object.keys(f.cheaperButCannot || {}).forEach(function (k) {
      if ((f.wrongActions || []).indexOf(k) < 0) {
        bad.push("case " + f.key + " explains away \"" + k + "\", which it does not offer");
      }
    });
  }
  FS_CASES.forEach(function (a, i) {
    FS_CASES.slice(i + 1).forEach(function (b) {
      if (a.cause === b.cause && a.first === b.first)
        bad.push("cases " + a.key + " and " + b.key + " have the same cause and the same first step");
    });
  });

  MDX_DEVICES.forEach(function (a, i) {
    MDX_DEVICES.slice(i + 1).forEach(function (b) {
      if (a.issue === b.issue && a.fix === b.fix)
        bad.push("devices " + a.key + " and " + b.key + " have the same issue and the same fix");
    });
  });
  if (["hardware", "software", "config"].indexOf(sc.fault.where) < 0)
    bad.push("fault is filed under an unknown category \"" + sc.fault.where + "\"");
  /* SCOPE. Laptops are allowed ONLY for the mobile-specific faults the
     Field Service Center does not cover. A laptop with a cracked
     digitizer here would be duplicating the FSC's laptop track, which
     is the one thing this lab was told not to do. */
  if (sc.person.device === "laptop" && LAPTOP_OK.indexOf(sc.faultKey) < 0)
    bad.push("laptop generated for \"" + sc.faultKey + "\", which belongs to the Field Service Center");
  if (sc.stackLayer && !STACK.some(function (L) { return L.key === sc.stackLayer; }))
    bad.push("stack layer \"" + sc.stackLayer + "\" is not in the stack");
  /* Battery arithmetic has to agree with itself, or the health stage
     grades a correct answer wrong. */
  /* WHAT IS PRINTED ON THE CELL HAS TO AGREE WITH ITSELF, AND WITH THE SUM
     THE STUDENT IS ASKED TO DO.

     The label prints mAh and Wh both, because a real one does, and Wh is
     the figure a runtime calculation starts from. Wh = V x Ah, so the two
     numbers on the label are a worked example of that sum sitting on the
     part — and a label whose own arithmetic does not close teaches a
     student to distrust the one place they are being told to look.

     The design capacity is the same one `mb-health` divides into. A cell
     printing a different figure from the table beside it would put the
     evidence and the answer on opposite sides of one screen, which is the
     failure this build has already had once with a drive label. */
  const C = sc.cell;
  if (!C) { bad.push("no printed cell figures generated"); }
  else {
    const wh = C.mah / 1000 * C.volts;
    if (Math.abs(wh - C.wh) > 0.06) {
      bad.push("the cell label prints " + C.wh + " Wh, but " + C.mah + " mAh at " +
        C.volts + " V is " + wh.toFixed(2) + " Wh. Wh = V x Ah, and the two figures on the " +
        "label are supposed to be a worked example of that sum");
    }
    if (C.mah !== sc.designMah) {
      bad.push("the cell label prints " + C.mah + " mAh while the health table uses " +
        sc.designMah + " as design capacity. The student is asked to divide one by the other; " +
        "the label and the table cannot be two different numbers");
    }
    if (!(C.volts > 3.0 && C.volts < 4.0)) {
      bad.push("nominal cell voltage of " + C.volts + " V is not a lithium cell. Nominal is " +
        "3.7 to 3.9 on anything in a phone");
    }
    if (!(C.chargeV > C.volts)) {
      bad.push("the charge limit " + C.chargeV + " V is not above the nominal " + C.volts +
        " V. The whole point of printing both is that nominal is an average and the limit is " +
        "a maximum — a student reading a full cell at 4.35 V has to be able to see that it is " +
        "full rather than overcharged");
    }
  }
  /* ---- panelpart ---------------------------------------------------
     The distinctive claim of this stage is that the answer is decided by
     a detail BURIED in the brief, and that every wrong option is a real
     part with a real signature. So both are checked: the case has to
     name a part that exists, carry enough lines for the discriminator to
     be buried in one of them rather than announced, and have a reason
     attached. The field has to be able to reach six from the table — a
     table that ever drops to five parts would silently give the student
     a short field and nothing would say so. */
  const pc = sc.ppcase;
  if (!pc) { bad.push("no panel-part case generated"); }
  else {
    const P = PANEL_PARTS[pc.part];
    if (!P) {
      bad.push("panel case " + pc.key + " names part \"" + pc.part + "\", which is not in the table");
    }
    if (Object.keys(PANEL_PARTS).length < 6) {
      bad.push("the panel-part table holds " + Object.keys(PANEL_PARTS).length + " parts. Six " +
        "options means one right and five wrong, and five wrong have to come from somewhere");
    }
    if ((pc.said || []).length < 3) {
      bad.push("panel case " + pc.key + " has " + (pc.said || []).length + " lines of report. " +
        "The whole stage is that the discriminator is buried — it cannot be buried in one line");
    }
    if (!pc.tell) bad.push("panel case " + pc.key + " has no reason for its answer");
  }
  if (sc.healthPct !== Math.round(sc.currentMah / sc.designMah * 100))
    bad.push("health percentage disagrees with the capacities");
  if (sc.worn !== (sc.healthPct < 80)) bad.push("worn flag disagrees with the health percentage");
  if (sc.currentMah > sc.designMah) bad.push("current capacity exceeds design capacity");
  return bad;
}

/* THE FAULT AXIS ONLY, and that is worth writing down because it looks
   like it covers more than it does.

   verify.mjs counts distinct variantKeys across 240 seeds and fails a lab
   that produces fewer than four. On this lab it reports 41 — and it
   reports 41 with SEVENTEEN OF THE EIGHTEEN first-step cases deleted,
   because they are not in this key and never were. The same goes for the
   diagnose devices. A number that does not move when content disappears
   is not measuring that content.

   The key is not wrong: the fault, the device and the wear state really
   are the axis the generic checker is asking about. What was missing is
   anything at all watching the two side tables, and that is
   checkEveryCaseIsReachable below. */
export function variantKey(sc) { return sc.faultKey + "/" + sc.person.device + "/" + (sc.worn ? "worn" : "ok"); }

/* EVERY CASE IN BOTH SIDE TABLES HAS TO BE REACHABLE, and only driving the
   generator proves it.

   Written after collapsing FS_CASES to a single entry and watching
   "mobile content" report exactly the same 41 distinct variants it
   reports with all eighteen present. Seventeen scenarios could be
   deleted, or made unreachable by a picker bug, and the whole 51-check
   suite would stay green.

   Same family as the printer lab's stage list, which went stale the
   moment `fit` was added and silently skipped every invariant written for
   it. Written and reachable are different claims, so this one drives the
   thing rather than reading it.

   300 SEEDS, AND THE NUMBER IS ARITHMETIC RATHER THAN A GUESS. This runs
   at module load, which means a student on a school laptop pays for it
   every time they open the lab, so it has to be no longer than it needs
   to be. Eighteen cases picked uniformly: the chance of missing any one
   of them in n draws is about 18 * (17/18)^n, which at 240 is one in
   forty thousand and at 300 is one in a million. 600 was twice the cost
   for no more certainty. It measures about 18ms here and it is the only
   thing standing between a broken picker and seventeen scenarios nobody
   can reach. */
(function checkEveryCaseIsReachable() {
  const fs = {}, mdx = {}, pp = {};
  for (let s = 1; s <= 300; s++) {
    const sc = generate(s);
    fs[sc.fcase.key] = (fs[sc.fcase.key] || 0) + 1;
    mdx[sc.mdevice.key] = (mdx[sc.mdevice.key] || 0) + 1;
    pp[sc.ppcase.key] = (pp[sc.ppcase.key] || 0) + 1;
  }
  [["first-step case", FS_CASES, fs], ["diagnose device", MDX_DEVICES, mdx],
   ["panel-part case", PP_CASES, pp]]
    .forEach(function (t) {
      const missing = t[1].filter(function (c) { return !t[2][c.key]; })
        .map(function (c) { return c.key; });
      if (missing.length) {
        throw new Error("lab-mobile: " + missing.length + " " + t[0] + "(s) never generated in " +
          "300 seeds — " + missing.join(", ") + ". They are written down and a student can " +
          "never reach them, and nothing in the suite would say so: the variant counter does " +
          "not look at this table at all.");
      }
    });
})();

/* =====================================================================
   EVERY PART THE PANEL STAGE NAMES IS ON THE ONE BENCH IT MOUNTS.

   WRITTEN AND REACHABLE ARE DIFFERENT CLAIMS, and this is the version of
   that which would bite hardest: the stage shows a student a display
   module and asks them to name a part in it. Six options, one right. If
   the option they are meant to pick is not drawn in the frame in front
   of them, the exercise is unanswerable by looking — and it would still
   grade, still hint, still congratulate the ones who guessed.

   ONE BENCH, NOT ONE PER PART. That distinction is the whole point now.
   An earlier version of this check asked each part for its own layer and
   built a bench per part, which is exactly the shape of the bug it
   should have caught: the stage was focusing whichever layer held the
   right answer, so the picture gave away which half the answer was in.
   Checking it part-by-part would have agreed with that happily for ever.
   `PANEL_BENCH` is the single focus list the stage passes, every part
   must be on it, and the stage reads the same constant — so the two
   cannot drift.

   Calibrated three ways: pointing an entry's `at` at a part on another
   layer (`board-gold`) fires naming that entry; dropping "backlight"
   from PANEL_BENCH fires on light-guide and led-strip, which is the
   giveaway bug itself; and answering a case with a part not in the table
   fires on the case.
   ===================================================================== */
export const PANEL_BENCH = ["backlight", "lcd"];

(function checkEveryPanelPartIsOnTheBench() {
  const b = mobileBench({ panel: "lcd", focus: PANEL_BENCH, states: {}, healthPct: 88 });
  Object.keys(PANEL_PARTS).forEach(function (k) {
    const P = PANEL_PARTS[k];
    const layer = PANEL_BENCH.join("+");
    const keys = b.parts.map(function (p) { return p.key; });
    if (keys.indexOf(P.at) < 0) {
      throw new Error('lab-mobile: panel part "' + k + '" points at bench part "' + P.at +
        '", which the focused ' + layer + " bench does not draw. It draws " + keys.join(", ") +
        ". A student would be asked to pick a part that is not in the picture in front of " +
        "them, and every check in this suite would still pass.");
    }
  });

  /* And every case has to name a part that can be pointed at. */
  PP_CASES.forEach(function (c) {
    if (!PANEL_PARTS[c.part]) {
      throw new Error('lab-mobile: panel case "' + c.key + '" is answered "' + c.part +
        '", which is not in the parts table.');
    }
  });

  /* THE DISCRIMINATOR HAS TO BE IN THE BRIEF, not only in the answer.

     The stage's whole claim is that the way through is to hunt the key
     words. A case whose `tell` explains a distinction the student was
     never told about is a case with no way in — they would be reading a
     brief that does not contain the answer and being marked wrong for
     it. Each case is required to put at least one of its part's own
     discriminating words into what the front desk wrote down.

     WHAT THIS PROVES AND WHAT IT DOES NOT. It proves the brief contains
     evidence FOR the answer. It does not prove the answer is the only one
     the brief allows — the torch separates light from panel but not the
     guide from the LEDs, and that second cut is the `tell`'s job. Claiming
     more than this would be claiming the check does the authoring.

     THE WORDS HAVE TO DISCRIMINATE, NOT MERELY BE ON TOPIC. The first
     version of this list was topical and it was blind: `leds` accepted
     "black" and "still on", so deleting the torch line from pp-black —
     the one clause that actually decides it — left the case passing on
     two phrases that are equally true of a dead panel. A cue list that
     matches the symptom instead of the discriminator passes every case
     for the same reason a student would fail it.

     Calibrated after narrowing: deleting the third line of pp-black fires
     on that case, and deleting "picture's all there" from pp-edge-dark
     fires on that one. */
  const CUE = {
    source:   ["down", "bottom"],                         /* direction and edge */
    gate:     ["across"],                                 /* the other direction */
    crystal:  ["bigger", "spread", "press", "sat on", "squeez"],  /* it moves */
    tft:      ["speck", "pinprick", "tiny"],              /* sub-pixel sized */
    polfront: ["tilt", "straight on", "mount"],           /* changes with angle */
    filter:   ["every angle", "right shape"],             /* and does NOT */
    guide:    ["window", "torch"],                        /* picture still in it */
    leds:     ["torch", "picture's all there"]            /* picture still there */
  };
  PP_CASES.forEach(function (c) {
    const hay = c.said.join(" ").toLowerCase();
    const cues = CUE[c.part] || [];
    const hit = cues.filter(function (w) { return hay.indexOf(w) >= 0; });
    if (!hit.length) {
      throw new Error('lab-mobile: panel case "' + c.key + '" is answered ' + c.part +
        ", and nothing in what the front desk wrote down points at it — none of " +
        cues.join(", ") + " appears in the brief. The student is being asked to hunt for a " +
        "key word that is not there.");
    }
  });
})();

/* =====================================================================
   THE PANEL BENCH MUST NOT CHANGE WITH THE ANSWER.

   This is the check for the bug that got past me, written so the bug
   cannot come back by a different route.

   The stage draws a display module and asks which part of it has failed.
   Eight candidates: six on the panel, two on the backlight beneath it.
   The first cut focused whichever LAYER held the correct part — so
   before reading a word of the brief a student could see which half the
   answer was in, and a field of six collapsed to two or to six. Every
   structural check in this suite passed: the options were six, the right
   one was among them, every part was on the bench that was mounted, and
   the bench mounted was the one the stage asked for. All true, all
   useless, because none of them compared one seed against another.

   That is the general shape worth naming: A BENCH THAT VARIES WITH THE
   ANSWER IS A BENCH THAT STATES IT. So this drives the real stage across
   seeds until it has seen every case, and holds that the part list, the
   camera and the title are identical every time. Whatever varies between
   two scenarios is information the picture is carrying, and on this
   stage the picture is supposed to carry none.

   Calibrated: restoring the old per-answer focus fires immediately,
   naming the two cases whose benches differ.
   ===================================================================== */
(function checkThePanelBenchNeverVaries() {
  let ref = null, refSeed = 0;
  const seen = {};
  for (let s = 1; s <= 400 && Object.keys(seen).length < PP_CASES.length; s++) {
    const sc = generate(s);
    if (seen[sc.ppcase.key]) continue;
    seen[sc.ppcase.key] = true;
    const stage = buildStage("panelpart", sc);
    const bp = stage.panels.filter(function (p) { return p.kind === "bench"; })[0];
    if (!bp) throw new Error("lab-mobile: the panelpart stage has no bench panel. The whole " +
      "exercise is naming a part you are looking at.");
    const spec = bp.bench.spec();
    const sig = {
      parts: spec.parts.map(function (p) { return p.key; }).join(","),
      cam: JSON.stringify(spec.camera),
      title: spec.title
    };
    if (!ref) { ref = sig; refSeed = s; continue; }
    ["parts", "cam", "title"].forEach(function (f) {
      if (sig[f] !== ref[f]) {
        throw new Error('lab-mobile: the panelpart bench\'s ' + f + ' changes with the ' +
          'scenario — seed ' + refSeed + ' (case ' + Object.keys(seen)[0] + ') gives "' +
          String(ref[f]).slice(0, 90) + '" and seed ' + s + ' (case ' + sc.ppcase.key +
          ', answer ' + sc.ppcase.part + ') gives "' + String(sig[f]).slice(0, 90) + '". ' +
          "A bench that varies with the answer is a bench that states it: the student can " +
          "narrow the field from the picture without reading the brief.");
      }
    });
  }
  if (Object.keys(seen).length < PP_CASES.length) {
    throw new Error("lab-mobile: only " + Object.keys(seen).length + " of " + PP_CASES.length +
      " panel cases were reached in 400 seeds, so this check compared fewer benches than " +
      "there are scenarios. A short sweep that comes back clean says nothing.");
  }
})();

/* =====================================================================
   EVERY BENCH FLAG THIS LAB CAN SET HAS TO BE SET BY SOME SCENARIO.

   This is the check for the one that got away for the life of the build.

   `mobileBench` takes boolean flags that switch whole pieces of geometry
   on: `cracked` draws a 237-primitive fracture, `swollen` domes the cell.
   The lab computes each of them from the generated scenario. If that
   computation can never be true, the geometry is written, verified,
   documented — and invisible. Nothing else in this suite would say so:
   the geometry checks pass because the geometry is fine, and the variant
   counter has never looked at bench flags.

   `cracked` was computed as `faultKey === "glass"` in three places and
   there is no fault called "glass" — that is a LAYER name. It was false
   on every seed ever generated.

   So: drive the generator, collect the flags each scenario actually
   produces, and require every one of them to come up. And hold
   FAULT_LAYER to real fault keys, because that table is where the two
   namespaces meet and where the confusion started.

   Calibrated: putting `faultKey === "glass"` back fires on `cracked`;
   renaming the fault without updating FAULT_LAYER fires on the map.
   ===================================================================== */
(function checkEveryBenchFlagIsReachable() {
  /* The map may only name faults that exist. */
  Object.keys(FAULT_LAYER).forEach(function (k) {
    if (!FAULTS[k]) {
      throw new Error('lab-mobile: FAULT_LAYER maps "' + k + '", which is not a fault in the ' +
        "table. Fault keys and LAYER keys look alike and that is exactly how the cracked-screen " +
        "model spent this whole build unreachable — a layer name compared against a fault key " +
        "reads perfectly and is always false.");
    }
  });

  const seen = { cracked: 0, swollen: 0 };
  for (let s = 1; s <= 300; s++) {
    const sc = generate(s);
    if (sc.faultKey === "cracked") seen.cracked++;
    if (sc.isSwollen) seen.swollen++;
  }
  Object.keys(seen).forEach(function (f) {
    if (!seen[f]) {
      throw new Error('lab-mobile: no scenario in 300 seeds sets the bench flag "' + f + '", so ' +
        "the geometry it switches on is drawn by nothing and seen by nobody. Written and " +
        "reachable are different claims.");
    }
  });
})();
