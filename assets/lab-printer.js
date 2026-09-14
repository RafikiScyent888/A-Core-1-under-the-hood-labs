/* =====================================================================
   Printer — all four types, because all four are on the exam.

   The Field Service Center diagnoses a broken printer. This does the
   job around it: work out which technology the customer actually needs,
   get it deployed, then read a bad page and work backwards to the part
   that made it.

   THE MECHANISM IS THE SEVEN-STEP LASER IMAGING PROCESS. Students learn
   it as a mnemonic and lose the marks anyway, because the exam asks
   which step failed given a defect on the page. So the mechanism view
   walks a sheet through all seven steps, and each defect in this lab is
   generated FROM a broken step rather than picked from a list — which
   means the defect and its cause can never drift apart.
   ===================================================================== */
import { rng } from "./rng.js";
import { showroomBench, SHOWROOM } from "./bench-showroom.js";
import { siteBench, rearBench, volumeBench, kitBench, mfpBench, floorBench, SITES } from "./bench-office.js";
import { thermalBench, partWords, PARTS as THERMAL_PARTS } from "./bench-thermal.js";
import { impactBench, partWords as impactWords, PARTS as IMPACT_PARTS } from "./bench-impact.js";
import { inkjetBench, partWords as inkjetWords, PARTS as INKJET_PARTS } from "./bench-inkjet.js";
import { wearBench } from "./bench-wear.js";
import { printerBench, stepWords, STEPS as BENCH_STEPS } from "./bench-printer.js";
import { labByKey } from "./labs.js";

/* ------------------------------------------------------------------
   The four technologies.
   ------------------------------------------------------------------ */
export const TYPES = {
  laser: {
    name: "Laser",
    good: "Fast, cheap per page at volume, and the output does not smudge or run.",
    bad: "Expensive to buy, and it does not do multi-part carbon forms at all.",
    duty: 50000, cpp: 0.02, colour: true, carbon: false, photo: false, receipt: false
  },
  inkjet: {
    name: "Inkjet",
    good: "Cheap to buy, and the only one here that does real photographic colour.",
    bad: "Costly per page, slow at volume, and the heads clog if it sits unused.",
    duty: 3000, cpp: 0.12, colour: true, carbon: false, photo: true, receipt: false
  },
  thermal: {
    name: "Thermal",
    good: "Almost no moving parts and no consumables but the paper. Silent and quick for short runs.",
    bad: "Special heat-sensitive paper only, and the print fades with heat and light.",
    duty: 20000, cpp: 0.01, colour: false, carbon: false, photo: false, receipt: true
  },
  impact: {
    name: "Impact (dot matrix)",
    good: "The only technology here that can print through multi-part carbon forms, because it strikes the paper.",
    bad: "Loud, slow, and the print quality is poor by any modern standard.",
    duty: 8000, cpp: 0.03, colour: false, carbon: true, photo: false, receipt: false
  }
};

/* ------------------------------------------------------------------
   The seven steps, in order, each with what breaks when it fails and
   what that looks like on the page. Every defect in this lab is
   generated from this table, so a defect can never name a part that
   this table does not blame.
   ------------------------------------------------------------------ */
export const STEPS = [
  { key: "processing", at: 1, name: "Processing",
    doing: "The formatter turns the incoming job into a bitmap of the whole page and holds it in memory.",
    part: "formatter board or memory",
    defect: "Half the page prints, then it stops, or the job comes out as pages of nonsense characters.",
    why: "There is nothing wrong with the imaging hardware — the page never got built correctly in the first place.",
    /* Electronics do not wear, and saying so is the lesson. */
    wear: [
      { level: "fresh", look: "Nothing to see. A board is a board.",
        page: "Clean pages, every time.",
        act: "Nothing. There is no service interval on a formatter." },
      { level: "early", look: "Still nothing to see. This is the one part in the imaging path " +
          "you cannot inspect your way to an answer on.",
        page: "The odd corrupted page, weeks apart, on big jobs only. Reprinting it works.",
        act: "Note the pattern. Intermittent and load-related points at memory rather than at " +
          "anything mechanical." },
      { level: "worn", look: "Sometimes discoloured or swollen capacitors near the power input, " +
          "if it has been running hot.",
          page: "Corruption on most large jobs, small ones still fine.",
        act: "Try a firmware update and reseat the memory before condemning the board." },
      { level: "failed", look: "No change you can see.",
        page: "Half a page then a stop, or pages of nonsense characters.",
        act: "Replace the formatter. Nothing about the cartridge or the rollers will help." }
    ],
    /* THIS PART DOES NOT WEAR, IT FAILS. Worth teaching next to six that
       do, because a student who has learned to look for wear will keep
       looking here and find nothing. */
    wears: false,
  },
  { key: "charging", at: 2, name: "Charging",
    doing: "The primary charge roller lays a uniform negative charge across the whole drum surface.",
    part: "primary charge roller",
    defect: "The whole page comes out uniformly grey or black, with no white anywhere.",
    why: "With no even charge on the drum, toner has nothing to be repelled by, so it sticks everywhere.",
    wear: [
      { level: "fresh", look: "An even, matt, dark grey coating along the whole roller. No shine " +
          "anywhere on it.",
        page: "White stays white.",
        act: "Nothing." },
      { level: "early", look: "Starting to show signs of wear: a faint polished band where it " +
          "rides on the drum, glossier than the rest.",
        page: "A very light grey haze in the background, easiest to see against a wide margin.",
        act: "Note it and check the page count. This is a part on the way out, not a part that " +
          "has gone." },
      { level: "worn", look: "You see signs of wear plainly \u2014 the coating is pitted, or there " +
          "is a shiny stripe worn right along it.",
        page: "A grey band that REPEATS down the page, once per turn of the roller.",
        act: "Replace it at the next service. Measure the gap between the repeats and match it " +
          "to the roller's circumference to be sure which roller it is." },
      { level: "failed", look: "The coating is broken through to the core, or thick with " +
          "contamination.",
        page: "The whole page comes out uniformly grey or black, with no white anywhere.",
        act: "Replace the charge roller \u2014 on most cartridges that means replacing the " +
          "cartridge, because it lives inside it." }
    ],
    wears: true,
  },
  { key: "exposing", at: 3, name: "Exposing",
    doing: "The laser writes the page onto the drum, discharging the spots where toner should end up.",
    part: "laser or scanner assembly",
    defect: "The page is blank, or has bands and streaks running the length of it in the direction of travel.",
    why: "The image is never written onto the drum, so there is nothing for toner to be attracted to.",
    wear: [
      { level: "fresh", look: "Clean mirror, clear laser window, no dust on either.",
        page: "Sharp edges everywhere.",
        act: "Nothing." },
      { level: "early", look: "A film of fine toner dust on the laser window. It looks like " +
          "nothing until you wipe a corner and see the difference.",
        page: "A faint pale streak running the LENGTH of the page, in the direction of travel.",
        act: "Wipe the window with a dry lint-free cloth. This is cleaning, not a repair." },
      { level: "worn", look: "Dust built into a band, or a mirror with a mark on it you cannot " +
          "wipe off.",
        page: "A defined light streak down every page \u2014 and here is the test: it stays in " +
          "exactly the same place when you fit a different cartridge.",
        act: "A defect that ignores a cartridge swap belongs to the printer, not the " +
          "consumable. Book the scanner assembly." },
      { level: "failed", look: "Nothing visibly moving in the scanner, or an error on the panel.",
        page: "Blank, or hard black bands.",
        act: "Replace the laser scanner assembly." }
    ],
    wears: true,
  },
  { key: "developing", at: 4, name: "Developing",
    doing: "The developer roller brings toner to the drum, and it sticks only to the discharged areas.",
    part: "developer roller or toner cartridge",
    defect: "Print is faint and washed out, or fades from one side of the page to the other.",
    why: "Toner is reaching the drum unevenly or barely at all — usually the cartridge, occasionally the roller.",
    wear: [
      { level: "fresh", look: "An even matt film of toner along the developer roll, levelled to " +
          "about fifteen microns by the doctor blade \u2014 a shade thicker than a strand of silk.",
        page: "Dense, even black.",
        act: "Nothing." },
      { level: "early", look: "The toner film looks thin at one end. The cartridge feels light " +
          "when you lift it.",
        page: "Print slightly paler down one side. Rocking the cartridge side to side brings it " +
          "back \u2014 for a few hundred pages.",
        act: "Rock it and order a cartridge. Rocking is a stay of execution, not a fix, and " +
          "telling the customer that is the job." },
      { level: "worn", look: "A nick or a flat worn into the doctor blade's edge, or a glazed " +
          "shiny band on the developer roll.",
        page: "A nicked blade lets a thicker stripe of toner through, so you get a fine DARK " +
          "line down the page in the same place every time. A glazed roll gives washed-out grey.",
        act: "Replace the cartridge. Both parts live inside it." },
      { level: "failed", look: "Toner exhausted, or the roll turning against a blade that is no " +
          "longer touching it.",
        page: "The page barely marks at all.",
        act: "Replace the cartridge." }
    ],
    wears: true,
  },
  { key: "transferring", at: 5, name: "Transferring",
    doing: "The transfer roller pulls the toner off the drum and onto the paper.",
    part: "transfer roller",
    defect: "Faint, patchy print, often with toner visibly left behind on the drum.",
    why: "The toner image was made correctly but never made it onto the sheet.",
    wear: [
      { level: "fresh", look: "Even, matt, slightly tacky rubber along the whole roller.",
        page: "Solid blacks, corner to corner.",
        act: "Nothing." },
      { level: "early", look: "Starting to show signs of wear: patches that have gone smooth and " +
          "shiny where the rubber has hardened.",
        page: "Blacks a little patchy at the edges of the sheet, still solid in the middle.",
        act: "Note it. Handle it only by the ends \u2014 finger oil on a transfer roller makes " +
          "this worse." },
      { level: "worn", look: "You see big chunks of missing rubber, or deep cracking along it.",
        page: "Blotchy, patchy print, and toner still visibly sitting on the drum after the " +
          "sheet has gone through.",
        act: "Replace the transfer roller. Nothing recovers rubber that has left the roller." },
      { level: "failed", look: "Bare core showing through, or the roller no longer turning.",
        page: "Almost nothing transfers. The drum comes out of the machine still carrying the " +
          "image.",
        act: "Replace the transfer roller." }
    ],
    wears: true,
  },
  { key: "fusing", at: 6, name: "Fusing",
    doing: "Heat and pressure melt the toner into the paper fibres.",
    part: "fuser assembly",
    defect: "The print smears when you rub it, or comes off on your fingers.",
    why: "This is the giveaway defect. The image is perfect until it is touched, because it was never melted in.",
    wear: [
      { level: "fresh", look: "A smooth unmarked sleeve on the hot roller and an even, springy " +
          "pressure roller under it.",
        page: "Rub it hard with a thumb and nothing moves.",
        act: "Nothing." },
      { level: "early", look: "Starting to show signs of wear: a faint gloss band, or the very " +
          "beginnings of scoring across the sleeve.",
        page: "Print holds up in normal handling but smears if you rub it hard, and heavy " +
          "coverage smears sooner than light.",
        act: "Check the page count. A fuser gives plenty of warning if anybody is reading it." },
      { level: "worn", look: "The film sleeve is wrinkled and creased, with scoring you can " +
          "feel with a fingernail \u2014 or big chunks of missing rubber out of the pressure " +
          "roller underneath it.",
        page: "A mark that REPEATS down the page at a fixed spacing, and fusing that is good in " +
          "some bands and poor in others.",
        act: "Replace the fuser. Measure the repeat spacing first \u2014 it tells you whether it " +
          "is the fuser or a roller further back." },
      { level: "failed", look: "The sleeve has SPLIT along its length and a strip of it has " +
          "peeled back, with the dark core showing through the gap. Usually the last act of a " +
          "jam that somebody pulled out towards themselves instead of the way the paper was " +
          "already going.",
        page: "Toner wipes straight off with a finger, or the sheet jams inside the fuser every " +
          "time.",
        act: "Replace the fuser. And let it COOL first \u2014 it runs at around two hundred " +
          "degrees and it does not announce that it is hot." }
    ],
    wears: true,
  },
  { key: "cleaning", at: 7, name: "Cleaning",
    doing: "The blade and lamp scrape and discharge whatever is left, so the drum starts the next page clean.",
    part: "cleaning blade or drum",
    defect: "The same mark repeats down the page at a regular interval.",
    why: "Leftover toner goes round with the drum and prints again every revolution — the spacing IS the drum's circumference.",
    /* The owner asked for this progression specifically, and it is the
       best wear ladder on the machine: a fault that does not appear and
       then get worse, but appears faintly and then gets DARKER, week by
       week, while the customer slowly stops noticing. */
    wear: [
      { level: "fresh", look: "A sharp, straight blade edge sitting evenly along the drum, and a " +
          "drum with an unmarked coating.",
        page: "Every page starts clean.",
        act: "Nothing." },
      { level: "early", look: "The blade edge is still straight but no longer sitting quite " +
          "evenly \u2014 a little toner is getting past it at one end.",
        page: "Ghost imaging starting to appear: a very faint second copy of something printed " +
          "further up the SAME page, showing again lower down.",
        act: "Look for it deliberately on a page with a big solid black on it. Early ghosting is " +
          "easy to dismiss as a bad photocopy." },
      { level: "worn", look: "The blade is visibly out of alignment, or its edge has gone soft " +
          "and rounded instead of sharp.",
        page: "The ghost gets darker and darker as the weeks go by. It repeats at exactly one " +
          "turn of the drum, which is what proves it is the drum and not the fuser.",
        act: "Replace the cartridge. Measure the repeat spacing to confirm the drum before you " +
          "order anything." },
      { level: "failed", look: "The blade is no longer scraping at all, and there is loose toner " +
          "collecting inside the cartridge and dropping into the machine.",
        page: "Heavy repeated ghosting, and loose toner smeared down the page.",
        act: "Replace the cartridge, and vacuum the machine out with a TONER vacuum \u2014 a " +
          "normal one blows the toner straight through its filter and into the room." }
    ],
    wears: true,
  }
];


/* ------------------------------------------------------------------
   What each diagnostic shows, per broken step. Three checks, and the
   pattern ACROSS them is the diagnosis — no single one gives it away.

   Derived from STEPS rather than written per scenario, so a reading can
   never point at a step this lab does not blame.
   ------------------------------------------------------------------ */
const DIAGNOSTICS = {
  processing: {
    page:  "The internal test page prints perfectly — clean, dense, correct.",
    drum:  "Drum surface normal. Even charge, clean after the blade.",
    fuser: "Fuser at 181 °C. Within range."
  },
  charging: {
    page:  "Test page comes out uniformly dark. No white anywhere on the sheet.",
    drum:  "Drum holds almost no charge — the meter reads near zero across the surface.",
    fuser: "Fuser at 179 °C. Within range."
  },
  exposing: {
    page:  "Test page is blank, with faint bands running the length of it.",
    drum:  "Drum is evenly charged, but there is no latent image written on it at all.",
    fuser: "Fuser at 182 °C. Within range."
  },
  developing: {
    page:  "Test page is faint and washed out, fading from one side to the other.",
    drum:  "Latent image is there, but toner is arriving on it unevenly and thinly.",
    fuser: "Fuser at 180 °C. Within range."
  },
  transferring: {
    page:  "Test page is patchy and pale in large areas.",
    drum:  "A full, correct toner image is still sitting on the drum AFTER the sheet has passed.",
    fuser: "Fuser at 178 °C. Within range."
  },
  fusing: {
    page:  "Test page image is perfect and dense — and it smears the moment you touch it.",
    drum:  "Drum surface normal. Even charge, clean after the blade.",
    fuser: "Fuser at 121 °C. Expected 175 to 190 °C."
  },
  cleaning: {
    page:  "Test page carries the same small mark repeating down it at a regular spacing.",
    drum:  "Residual toner is still on the drum where the blade should have scraped it.",
    fuser: "Fuser at 180 °C. Within range."
  }
};

const CUSTOMERS = [
  { who: "Kestrel Accountancy",        size: "Small Business" },
  { who: "Northgate Veterinary",       size: "Small Business" },
  { who: "Ellery Coach Tours",         size: "Mid-Market" },
  { who: "Ashworth Council — Housing", size: "Mid-Market" },
  { who: "Pinnacle Logistics",         size: "Major Corporation" },
  /* FIVE MORE CUSTOMERS, asked for by the named-scenario picker.

     Five customers cannot fill a list of six distinct ones, so the
     picker was offering the same firm twice with two different jobs —
     true, and it reads as a list with a repeat in it. The thinness was
     invisible while the customer arrived by dice roll.

     They are only names and sizes: the SIZE is what the generator reads
     to scale the job, so a new name at a size already present costs
     nothing in content and buys a list that scans. Spread across the
     three sizes rather than piled on one. */
  { who: "Bramhall Family Dental",     size: "Small Business" },
  { who: "Quayside Letting Agents",    size: "Small Business" },
  { who: "Thistlewood Garden Centre",  size: "Mid-Market" },
  { who: "Harlow Vale Academy Trust",  size: "Mid-Market" },
  { who: "Caldwell Regional Health",   size: "Major Corporation" }
];

/* Each job states, in customer language, what it needs. `best` is the
   ground truth everything else is graded against. */
const JOBS = [
  { key: "office", what: "the general office printer", best: "laser", volume: 9000,
    said: ["it is contracts and letters all day, forty or fifty pages at a time",
           "the last one could not keep up and everybody queued behind it",
           "we watch the running costs closely — it adds up over a year"] },
  { key: "photo", what: "the marketing proof printer", best: "inkjet", volume: 400,
    said: ["we need to see how the brochure photographs will actually look before they go to the printers",
           "it is a handful of pages a day, not a lot",
           "the colour has to be right — that is the entire point of it"] },
  { key: "till", what: "the counter receipt printer", best: "thermal", volume: 12000,
    said: ["it prints a receipt every time somebody pays, all day",
           "there is no room behind the counter and it cannot be noisy with customers standing there",
           "nobody keeps them — they are in the bin or in a pocket by the end of the day"] },
  { key: "forms", what: "the despatch note printer", best: "impact", volume: 6000,
    said: ["the driver keeps one copy, the customer signs and keeps one, and one comes back to us",
           "it is a three-part form on the roll, and all three have to be legible",
           "the warehouse is loud anyway, so noise is not a problem"] },
  { key: "records", what: "the patient records printer", best: "laser", volume: 15000,
    said: ["notes get printed for every appointment and there are a lot of appointments",
           "they go in a folder and get handled for years, so the print cannot smudge",
           "black and white is fine, nobody needs colour on a case note"] }
];

const NOISE = [
  "The old one is in the corridor if you want to look at it.",
  "Whatever you pick has to work with the trolley it sits on.",
  "Someone said we should lease rather than buy, but I do not know.",
  "The IT company we used before never returned our calls.",
  "It has to be in before the audit, whenever that is."
];

const BRANDS = ["Corvid", "Halden", "Meritas", "Orrick"];

/* =====================================================================
   THE THERMAL MACHINE — 3.8, the half of it that had nowhere to happen

   Objective 3.8 is "perform appropriate printer maintenance", and this
   lab served it with a seven-step laser imaging walk and a maintenance
   kit calculation. Both laser. Thermal maintenance — replace the paper,
   clean the heating element, remove the debris — had no home at all,
   even though thermal is the easiest technology on the exam and the one
   a technician meets most often behind a counter.

   Five scenarios, and they are deliberately not all hard. A direct
   thermal printer has four things that can be wrong — head, platen,
   sensor, paper — and the point of the set is that a student who knows
   those four can work through any of them quickly. One of the five is a
   plain maintenance job with no diagnosis in it at all, because "clean
   it properly and it works" is a real outcome and a student who has
   never seen it will look for a fault that is not there.

   Every entry names the part the bench should blame, the symptom the
   bench should draw on the label, and the fix. A scenario can therefore
   never describe a defect the bench cannot show.
   ===================================================================== */
export const THERMAL_FAULTS = [
  { key: "debris", part: "element", symptom: "void", debris: true, latchOpen: false,
    maintenance: true,
    name: "Residue baked onto the heating element",
    said: "there is a white stripe down every label in the same place",
    tell: "A clean vertical gap, identical on every label, including the printer's own test label",
    why: "Adhesive and paper dust bake onto the element and insulate a narrow group of heaters " +
      "from the paper. Those heaters still fire; the heat just never reaches the coating.",
    fix: "Clean the element with 99% isopropyl on a lint-free swab, let it dry fully, close and test.",
    proves: "It appears on the printer's OWN test label, so nothing outside the printer can be blamed." },

  { key: "backwards", part: "roll", symptom: "blank", debris: false, latchOpen: false,
    maintenance: false,
    name: "The paper is in the wrong way round",
    said: "it feeds the labels through perfectly and they come out completely empty",
    tell: "Paper advances normally, no error, and every label is blank",
    why: "Direct thermal paper is coated on one face only. Loaded with the coated face away " +
      "from the head, the head heats the uncoated back and nothing can develop.",
    fix: "Turn the roll over so the coated face runs against the head.",
    proves: "Scratch a corner briskly with a coin. The coated face goes dark; the back does not." },

  { key: "latch", part: "latch", symptom: "edge", debris: false, latchOpen: true,
    maintenance: false,
    name: "The head is only clamped at one end",
    said: "one side of the label prints and it fades away to nothing across the page",
    tell: "Dark at one edge, fading across — and it fades, it does not stop at a line",
    why: "There is a lever at each end and they have to be down together. With one up, the head " +
      "touches the paper hard at one end and barely at the other.",
    fix: "Close both levers until they click, then reprint.",
    proves: "Fading ACROSS the label is a pressure problem. A dead heater gives a hard-edged gap." },

  { key: "sensor", part: "sensor", symptom: "text", debris: false, latchOpen: false,
    maintenance: false,
    name: "The media sensor is blocked",
    said: "it spits out a pile of labels and then says it is out of paper, but it is not",
    tell: "It keeps feeding, hunting, and errors with a full roll loaded",
    why: "The sensor looks through the web for the gap between labels. Covered in dust or " +
      "adhesive it never sees one, so the printer feeds on looking for a gap it cannot find.",
    fix: "Clean the sensor window, then run the printer's media calibration.",
    proves: "A full roll plus an out-of-paper error is a sensing fault, not a supply fault." },

  { key: "platen", part: "platen", symptom: "smear", debris: false, latchOpen: false,
    maintenance: false,
    name: "The platen roller is glazed and slipping",
    said: "the printing comes out squashed and crooked, like it slipped while it was going through",
    tell: "The image is all there but dragged, skewed, and compressed down the label",
    why: "The platen is what actually pulls the paper. Glazed hard and shiny with age it stops " +
      "gripping, so the paper stalls and slides while the head is still firing.",
    fix: "Clean the platen with 99% isopropyl and turn it by hand to reach all the way round. " +
      "If it stays glassy and hard, it is worn out and wants replacing.",
    proves: "Content that is complete but distorted means the PAPER moved. The head did its job." }
];

/* =====================================================================
   THE DOT MATRIX — 3.8's impact share, which had nowhere to happen

   Impact sat in this lab exactly as thermal did: a row in the comparison
   table saying it is the only technology that can do carbon copies, one
   job where it is the right answer, and no mechanism, no fault and no
   maintenance behind either. Replace the ribbon, replace the print head,
   replace the paper — none of it existed.

   TWO OF THESE FIVE PRODUCE AN IDENTICAL PAGE, ON PURPOSE.

   A worn ribbon and a head gap lever set too wide both give uniformly
   faint print, and no amount of staring at the page separates them. That
   is the most useful thing on this bench: the student has to run a test
   rather than look harder. Fit a fresh ribbon — if it is still pale, it
   was never the ribbon. Or look at the carbon copies, because a gap set
   too wide gives a readable top sheet and blank copies underneath.

   The gap lever appears twice, set wrong in both directions, because one
   control set wrong two ways gives two opposite symptoms and that is
   worth meeting once.
   ===================================================================== */
export const IMPACT_FAULTS = [
  { key: "ribbon", part: "ribbon", symptom: "faint",
    ribbonWorn: true, gapWide: false, offPins: false, maintenance: true,
    name: "The ribbon is worn out",
    said: "everything it prints is grey and you can barely read it",
    tell: "Uniformly pale across the whole page, top to bottom",
    why: "The ribbon is a continuous inked loop and it only carries so much ink. Once it is " +
      "spent the pins still strike just as hard, they simply have nothing left to transfer.",
    fix: "Fit a new ribbon cassette, and check the advance cog turns when the carriage moves.",
    proves: "A fresh ribbon printing dense and black settles it in one page." },

  { key: "wire", part: "head", symptom: "pinline",
    ribbonWorn: false, gapWide: false, offPins: false, maintenance: false,
    name: "A print wire has stopped firing",
    said: "there is a white line running through the middle of all the letters",
    tell: "A horizontal gap at the same height in every character, on every line",
    why: "Nine wires fire in a vertical column and the head travels across. One that stops " +
      "firing takes its row out of everything on the page.",
    fix: "Replace the print head. A single dead wire is not something you repair in the field.",
    proves: "The line runs THROUGH the text rather than down the page, which no paper, ribbon " +
      "or feed fault can do." },

  { key: "offpins", part: "tractor", symptom: "skew",
    ribbonWorn: false, gapWide: false, offPins: true, maintenance: false,
    name: "The paper has come off the tractor pins",
    said: "it starts off fine and then the printing walks across the page",
    tell: "Each line begins further across than the one above it, worsening down the page",
    why: "The sprocket holes are what make this feed exact. With one edge off its pins the " +
      "paper is dragged by friction alone on that side, so it creeps.",
    fix: "Reseat the fanfold on both sets of sprocket pins, close both tractor covers, and " +
      "reset top of form.",
    proves: "Print that walks progressively is a feed fault. Nothing about the head or the " +
      "ribbon changes where a line starts." },

  { key: "gapwide", part: "gap", symptom: "faint",
    ribbonWorn: false, gapWide: true, offPins: false, maintenance: false,
    name: "The head gap lever is set too wide",
    said: "it has gone faint, and the second copy of the despatch note is completely blank",
    tell: "Uniformly pale — and the carbon copies underneath have nothing on them",
    why: "The lever sets how far the head sits off the platen, for paper thickness. Set wide, " +
      "the pins arrive with less force, so the top sheet is weak and there is nothing left to " +
      "drive through to the copies.",
    fix: "Set the gap lever to match the thickness of the form being used.",
    proves: "A new ribbon changes nothing, and the blank carbon copies point straight at " +
      "striking force rather than ink." },

  { key: "gapclose", part: "gap", symptom: "smudge",
    ribbonWorn: false, gapWide: false, offPins: false, maintenance: false,
    name: "The head gap lever is set too close",
    said: "the print is smeared and it keeps chewing the ribbon",
    tell: "Marked twice and smeared, with the ribbon snagging as the carriage moves",
    why: "Set too close the head drags on the paper and the ribbon instead of striking " +
      "cleanly, which smears what it has just printed and shreds the ribbon.",
    fix: "Back the gap lever off to suit the paper, and replace the ribbon if it has been " +
      "chewed.",
    proves: "Smearing that gets worse across the line is contact, not ink. A worn ribbon goes " +
      "pale; it does not smudge." }
];

/* =====================================================================
   THE INKJET — the last of the four, and the one students own

   bench-printer.js documented view.tech as taking "inkjet" and branched
   on laser and nothing else, so an inkjet job drew a laser cutaway with
   its seven stations greyed out. Laser, thermal and impact all had a
   bench; the technology most students have at home did not.

   THE CONFUSABLE PAIR HERE IS THE BEST ONE IN THE BUILD.

   Clogged nozzles and a service station that is not capping produce the
   same banded page. They are told apart by TIME, not by looking: a real
   clog is there on every page all day, while a capping failure is bad on
   the first page after the machine has stood overnight and fine for the
   rest of the day. A student who only ever prints one test page cannot
   distinguish them, and that is exactly the habit worth breaking.

   And the fix differs in a way that costs money: cleaning cycles will
   keep papering over a capping fault for months, burning ink every
   morning, while never addressing it.
   ===================================================================== */
export const INKJET_FAULTS = [
  { key: "clog", part: "nozzles", symptom: "bands",
    parked: false, stripDirty: false, colourEmpty: false, maintenance: true,
    name: "The nozzles are clogged",
    said: "there are white lines through the colour on everything it prints",
    tell: "Evenly spaced horizontal gaps in solid colour, on every page, all day",
    why: "Ink has dried in some of the jets. They are in evenly spaced rows, so the gaps they " +
      "leave are evenly spaced too.",
    fix: "Run the printer's cleaning cycle, then print a nozzle check. Two cycles at most \u2014 " +
      "each one fires every jet at full force into the spittoon and costs real ink.",
    proves: "It is there on the first page and the fiftieth. A drying fault would have cleared " +
      "itself after a page or two." },

  { key: "cap", part: "capping", symptom: "bands",
    parked: false, stripDirty: false, colourEmpty: false, maintenance: false,
    name: "The head is not capping when it parks",
    said: "the first thing I print each morning is streaky, then it is fine all day",
    tell: "Banded on the first page after standing, clean by the second or third",
    why: "When the carriage parks, rubber pads should rise and seal the nozzles so the ink " +
      "cannot dry. If it cannot park properly, or the pads are perished, the jets dry out " +
      "every night and clear themselves again on the first page or two.",
    fix: "Clear whatever is stopping the carriage reaching its park position, clean the " +
      "capping pads, and check the head seals when it parks.",
    proves: "The pattern is the diagnosis: bad after standing, fine once running. A real clog " +
      "does not care what time it is." },

  { key: "strip", part: "strip", symptom: "ghost",
    parked: false, stripDirty: true, colourEmpty: false, maintenance: false,
    name: "The encoder strip is dirty",
    said: "the text has gone blurry, like it has been printed twice slightly apart",
    tell: "Every OTHER line doubled and offset, with colours fringing",
    why: "The carriage has no stepper. It reads a strip of fine bars to know where it is. " +
      "Ink mist over those bars and it loses count, so lines laid down travelling one way no " +
      "longer register with lines laid down travelling the other.",
    fix: "Wipe the encoder strip clean with a dry lint-free cloth, end to end, then run the " +
      "printer's alignment.",
    proves: "Doubling on alternate lines only, rather than all of them, points at direction \u2014 " +
      "and direction is what the strip is for." },

  { key: "empty", part: "cartridge", symptom: "nocolour",
    parked: false, stripDirty: false, colourEmpty: true, maintenance: false,
    name: "The colour cartridge is spent",
    said: "it prints the words fine but the pictures come out with nothing in them",
    tell: "Black text perfect, the colour block completely absent",
    why: "One cartridge has nothing left. The other is unaffected, which is why half the page " +
      "looks perfect.",
    fix: "Replace the colour cartridge, then run the alignment \u2014 a new cartridge sits in " +
      "the carriage slightly differently and the registration has to be taught again.",
    proves: "Nothing at all rather than gaps. A clog leaves some of the colour; an empty " +
      "cartridge leaves none of it." },

  { key: "rollers", part: "rollers", symptom: "smear",
    parked: false, stripDirty: false, colourEmpty: false, maintenance: false,
    name: "The rollers and star wheels are inked up",
    said: "there are lines dragged down the page in the direction it comes out",
    tell: "Streaks running the length of the sheet, in the direction of travel",
    why: "The star wheels ride on the printed side while the ink is still wet, which is why " +
      "they are spiked and thin. Loaded with dried ink they draw lines down everything.",
    fix: "Clean the feed rollers and the star wheels, and check nothing is dragging in the " +
      "paper path.",
    proves: "Streaks that run WITH the paper, not across it, are made after the ink landed \u2014 " +
      "so it is contact, not printing." }
];

/* =====================================================================
   THE WEAR POOL — every part in the lab that can be part-way through
   its life, across all four technologies.

   The laser ladders live in STEPS because that table already described
   the laser's parts. The other three live in their bench files next to
   the geometry they describe, which is where a fact about a thermal
   platen belongs. This assembles the four into one pool so the wear
   stage can draw from any machine.

   `wears: false` marks parts whose fresh-to-failed progression is NOT
   wear: consumables that run out (the label roll, the ribbon, an ink
   cartridge), a setting somebody moved (the impact gap lever), and
   electronics that simply fail (the formatter). They keep their four
   rungs, because the descriptions are worth reading either way, but the
   stage never asks "how worn is it" about them — the honest answer
   would be "that is not what is wrong with it".
   ===================================================================== */
/* Which of the wear bench's eight forms each part takes. A platen, a
   transfer roller and a fuser roller are all a roller; what differs is
   what wearing out does to them, and that is what the student is here
   to see. */
const WEAR_SHAPE = {
  /* laser */
  charging: "roller", exposing: "bar", developing: "blade",
  transferring: "roller", fusing: "sleeve", cleaning: "blade",
  /* the mechanical parts, which are not steps in the imaging process but
     are what a laser printer actually gets called out for */
  seppad: "sepad", opc: "drum", drivegear: "gear", itb: "belt",
  /* thermal */
  platen: "roller", element: "bar", flex: "contact", latch: "lever", sensor: "bar",
  /* impact */
  head: "bar", tractor: "sprocket",
  /* inkjet */
  /* `rollers` is the inkjet's FEED SHAFT, not a pickup roller, and it now
     draws as one. The owner's bench photograph of three of them settles
     it: a full media-width bar carrying six short tyres, each taking its
     own strip of the sheet. Drawn as a single barrel it was the wrong part
     with the wrong failure — a feed shaft wears in a ROW, unevenly, and
     the tyres being at different stages is what makes it skew rather than
     simply stop feeding. That is the thing to recognise, and a one-barrel
     model could not show it.

     It also drops out of the rubber-band bodge below, which is correct:
     somebody winds bands round a pickup roller they can reach, not round a
     driven bar with six tyres on it. */
  nozzles: "bar", capping: "pad", strip: "strip", rollers: "feedshaft"
};

/* ==================================================================
   THE FIFTH RUNG, AND WHY ONLY FIVE PARTS HAVE ONE.

   The owner sent a photograph of six feeder rollers pulled out of
   service and this ladder stopped a stage short of them. What it called
   "failed" was rubber worn thin and split into bands — a roller you
   would condemn. What came out of their machines had CRACKED INTO PLATES
   AND LIFTED AWAY, bare shaft over long runs, ragged edges where it had
   delaminated, some with almost no rubber left.

   PERISHED IS A PROPERTY OF RUBBER, NOT OF PARTS IN GENERAL. A mirror
   does not perish, a drive gear does not perish, a formatter board does
   not perish. Giving every part a fifth rung to keep the table square
   would be inventing four fake states to avoid a ragged edge in a data
   structure — so only the five rubber-on-a-shaft parts have one, and the
   four-rung invariant below is left standing for everything else.

   It lives in its own table rather than as a fifth element of each
   part's `wear` array, so that invariant does not have to be weakened at
   all: parts still carry exactly four, and this is looked up beside
   them.
   ================================================================== */
export const PERISH_WEAR = {
  charging: { level: "perished",
    look: "The coating has cracked into plates and lifted off in patches, with bare metal "
      + "showing between them and crumbs of rubber in the bottom of the machine.",
    page: "Whole page grey or black, and it does not change between prints.",
    act: "Replace it. There is nothing here to clean — the coating is not coming back." },
  transferring: { level: "perished",
    look: "Long bare runs of shaft with clumps of rubber still clinging on, torn at the edges "
      + "rather than worn smooth, and worse at one end than the other.",
    page: "Toner missing in broad bands down the page, in the same places every time.",
    act: "Replace it. A roller this far gone often took the drum's surface with it, so look "
      + "at that before closing the job." },
  platen: { level: "perished",
    look: "The rubber has gone hard and split along its length, and pieces have come away "
      + "where the paper runs. The core is visible for most of the width.",
    page: "Faint, uneven print with gaps, because nothing is pressing the paper to the head.",
    act: "Replace it. A perished platen also chews the paper it is supposed to carry." },
  seppad: { level: "perished",
    look: "The friction pad has broken up and shed most of its surface, leaving the backing "
      + "plate showing through in more than one place.",
    page: "Multi-sheet feeds constantly, and sometimes nothing feeds at all.",
    act: "Replace the pad AND the pickup roller. They wear as a pair and one new part against "
      + "one perished one does not hold for long." },
  rollers: { level: "perished",
    look: "Several of the tyres on the shaft have split and come off their hubs; one or two "
      + "are missing entirely, so the bar carries rubber in some places and nothing in others.",
    page: "Sheets go in badly skewed, or jam before they reach the head.",
    act: "Replace the shaft. Fitting one new tyre beside four perished ones puts the skew back "
      + "within a week." }
};

/* Which parts can reach it, keyed to the bench shapes that are rubber on
   a shaft. Anything not here tops out at "failed" and that is correct. */
export const PERISHES = { charging: 1, transferring: 1, platen: 1, seppad: 1, rollers: 1 };

/* ------------------------------------------------------------------
   THE MECHANICAL PARTS.

   STEPS covers the seven stages of the imaging process, which is the
   right spine for how a page gets made and the wrong list for what a
   laser printer gets called out for. Nobody rings up about the
   developing stage; they ring up because it is grabbing two sheets at
   once, because there is a line down every page, because it is making
   a noise like a coffee grinder, or because the colours have gone
   soft-edged. Those are four parts that are nowhere in the seven steps.

   Each is built from the owner's own description of the states that
   condemn one, and each pairs a VISUAL TELL with a PRINT DEFECT — which
   is the pairing the exam actually tests, and the pairing a student
   cannot make from a parts list.
   ------------------------------------------------------------------ */
export const MECH_PARTS = [
  { key: "seppad", label: "Separation pad",
    says: "Holds the second sheet back by friction while the pickup roller takes the top one.",
    wear: [
      { level: "fresh", look: "A matt, evenly micro-textured rubber face. Run a fingertip across " +
          "it and it drags.",
        page: "One sheet at a time, every time.",
        act: "Nothing." },
      { level: "early", look: "Going a faded, chalky grey where it was black. The texture is " +
          "still there under it.",
        page: "Still one sheet at a time, but the odd misfeed on lighter stock.",
        act: "Wipe it with a slightly damp lint-free cloth. That chalk is packed paper fibre and " +
          "it works as a dry lubricant — cleaning it off restores most of the friction, and " +
          "this is the one rung where cleaning is the whole repair." },
      { level: "worn", look: "A smooth, shiny bald patch through the middle where the texture " +
          "has been abraded away, with a shallow trench starting in it.",
        page: "Two sheets at once, several times a ream, worst on a full tray.",
        act: "Order one. It will not see out the quarter, and cleaning a bald pad achieves " +
          "nothing — there is no texture left to uncover." },
      { level: "failed", look: "Worn through to the plastic carrier in the middle, with a deep " +
          "groove, and the rubber lifting off its bond line at one corner.",
        page: "Multi-feeds constantly, and jams where the sheet catches the groove and " +
          "concertinas inside the tray.",
        act: "Replace the pad, and replace the pickup roller at the same time — they wear " +
          "as a pair and a new pad against a glazed roller just moves the problem." }
    ], wears: true },

  { key: "opc", label: "OPC drum",
    says: "Holds the electrostatic image. The coated cylinder every other stage in the process acts on.",
    wear: [
      { level: "fresh", look: "An even, unmarked coating — teal, green or blue depending on " +
          "who made it — with no bright metal showing anywhere.",
        page: "Clean, with no repeating anything.",
        act: "Nothing, except never touch the surface and never leave it in daylight." },
      { level: "early", look: "A faint dulling where it runs against the cleaning blade, and " +
          "perhaps one thumbprint somebody left on it.",
        page: "A faint mark repeating down the page at even spacing, easiest to see on a solid " +
          "grey fill.",
        act: "Note it. A repeating mark is a rotating part, and the SPACING between repeats is " +
          "the circumference of whichever one — measure it and it names the part for you." },
      { level: "worn", look: "Fine circular score lines round the barrel, some cut through to " +
          "bright aluminium, and pinholes in the coating.",
        page: "A thin black line down every page in the same column, plus dots repeating at the " +
          "drum's circumference and a grey haze in the background.",
        act: "Order a drum. A score line will not polish out — the coating it needs is gone." },
      { level: "failed", look: "Bald at both edges with the silver tube showing through, and the " +
          "coating flaking at the score lines.",
        page: "Heavy background haze, several repeating lines, and toner where it should be white.",
        act: "Replace the drum — often available as a cylinder in a rebuild kit rather than a " +
          "whole cartridge assembly, which is a large saving on the same repair." }
    ], wears: true },

  { key: "drivegear", label: "Drive gear",
    says: "One of a train of plastic gears turning every roller in the machine at matched speeds.",
    wear: [
      { level: "fresh", look: "Sharp, square teeth with a matt moulded finish, and an unmarked " +
          "hub round the shaft.",
        page: "Nothing to see on the page. This part is quiet when it is well.",
        act: "Nothing." },
      { level: "early", look: "A slight shine on the driving flank of each tooth.",
        page: "Still clean.",
        act: "Nothing yet, but LISTEN. This part announces itself through the ear long before " +
          "the eye, and a new rhythmic tick is the earliest warning you get." },
      { level: "worn", look: "Teeth visibly rounded and polished where they were square, ground-" +
          "off plastic swarf packed into the roots, and the hub starting to craze round the shaft.",
        page: "Occasional smeared or compressed print where the timing slipped mid-page, and " +
          "jams that look like a feed fault.",
        act: "Order the gear. Swarf in the roots is the evidence it is THIS gear and not the one " +
          "next to it — check the mating gear for the same before you order only one." },
      { level: "failed", look: "Several teeth snapped clean off, and the hub split radially " +
          "around the shaft.",
        page: "Jam errors more or less constantly, and a loud grinding or clattering every time " +
          "it tries to feed.",
        act: "Replace the gear — individually, not as a whole motor or tray module, which is " +
          "what the parts diagram will push you towards. Find out what jammed hard enough to " +
          "break it, or the new one goes the same way." }
    ], wears: true },

  { key: "itb", label: "Transfer belt",
    says: "The film loop each colour is laid onto in turn, before the whole image goes to paper in one pass.",
    wear: [
      { level: "fresh", look: "A smooth, glossy, unmarked black film running true between its " +
          "side plates with even clearance either side.",
        page: "Colours land on top of each other. Black text has clean edges.",
        act: "Nothing." },
      { level: "early", look: "A light dusting of loose toner on the surface that wipes off.",
        page: "Clean, or the faintest background tint on a large white area.",
        act: "Wipe it down with a dry lint-free cloth, supporting the belt so you do not crease " +
          "it. Never use solvent and never put a fingernail near it." },
      { level: "worn", look: "Small permanent dimples and dings in the film, score lines running " +
          "the way it travels, thick caked bands of toner that will not wipe off, and the outer " +
          "margins starting to fray.",
        page: "A coloured spot repeating evenly down the page, a vertical streak through solid " +
          "colour, and haze or smudging along the margins.",
        act: "Order a belt, and check the waste hopper and the wiper blade at the same time — " +
          "caked toner that will not wipe off means the blade has stopped scraping, and a new " +
          "belt behind a failed wiper cakes up again." },
      { level: "failed", look: "Punctured through in places, visibly slack and rippling rather " +
          "than flat, and riding hard against one side plate instead of running centred.",
        page: "Severe colour misalignment — text looks doubled or blurred with a coloured " +
          "shadow behind it — plus spots and heavy background haze.",
        act: "Replace the belt assembly. And note the trap: misregistration looks like a driver " +
          "or colour-calibration problem, so this one gets diagnosed as software for weeks " +
          "before anybody opens the machine." }
    ], wears: true }
];

/* PARTS THAT ARE ONLY EVER DISTRACTORS.

   Six options need a pool of at least six, and impact and inkjet each
   have only five parts in the wear table. Rather than pad with something
   from a different machine — asking a student to rule a thermal platen
   out of a dot matrix is a reading test, not a diagnosis — these are
   REAL PARTS OF THE SAME MACHINE that this lab does not model faults on.

   They can never be the answer, so the one-correct rule holds. They are
   good distractors precisely because they are things a student has heard
   of and could reasonably suspect. */
const WEAR_EXTRAS = {
  thermal: [
    { key: "x-th-belt", label: "The carriage return spring",
      doing: "Holds the head assembly against its stop when the lid is closed" },
    { key: "x-th-cutter", label: "The tear bar",
      doing: "Gives the paper a straight edge to be torn against after the label feeds out" }
  ],
  impact: [
    { key: "x-im-belt", label: "The carriage drive belt",
      doing: "Pulls the print head across the platen at an even speed" },
    { key: "x-im-solenoid", label: "The paper-out switch",
      doing: "Tells the machine to stop when the last sheet has passed" }
  ],
  inkjet: [
    { key: "x-ij-waste", label: "The waste ink pad",
      doing: "Soaks up the ink flushed through the nozzles during a cleaning cycle" },
    { key: "x-ij-belt", label: "The carriage drive belt",
      doing: "Pulls the cartridge carriage back and forth along its shaft" }
  ],
  laser: [
    { key: "x-la-pickup", label: "The tray lift plate",
      doing: "Pushes the stack up against the pickup roller as the tray empties" }
  ]
};

/* SIX FROM A POOL OF ANY SIZE: the right one and five others.

   The wear stage listed every part of the machine, which was four or
   five when it was written and became ELEVEN for the laser the day the
   separation pad, drum, gear and belt went in. Eleven options is not a
   harder question, it is a longer one — and it breaks the narrowing rung
   of the hint ladder, which has to strike wrong options with a reason
   each and still leave two alive.

   Chosen from the scenario rather than at random, so the same seed
   always builds the same question — a bench that reshuffles itself on
   reload cannot be talked through with a student, and cannot be
   reproduced from a bug report either. */
/* =====================================================================
   THE SERVICE CALL — from the Core 1 MFD deployment simulation.

   Source: `Core-1-Sims/MFD Printer Deployment  Troubleshooting.html`, which
   is eight tickets, each asking two dropdowns — Most Likely Cause, and Best
   Next Step — with a mindset note that is the best thing in it:

     "Prefer verify/configure/inspect before replacing parts. Use the
      scenario's recent change and scope clues to eliminate distractors."

   That is a real technician's habit and it is worth a stage on its own. It
   is also the opposite skill to the `defect` stage next door: `defect` is a
   fault in the imaging process, found by running diagnostics on the
   machine. This is a fault in how the machine was DEPLOYED or configured,
   found by reading what changed and who it affects. Six of the thirteen
   right answers here are not a part at all.

   THREE THINGS ARE DIFFERENT FROM THE ORIGINAL.

   Six options, not four — the standing rule, and it matters more here than
   anywhere: the whole exercise is elimination, and a four-option field lets
   rung 3 strike only two. Each of the five wrong answers carries its own
   reason, and the reason names the CLUE that rules it out rather than just
   asserting it is wrong.

   Every scenario states what changed and who it affects, because those two
   lines are the discriminator. Several wrong answers are perfectly good
   diagnoses of the same symptom and are ruled out only by the timing or the
   scope — which is the "reading the scenario" gap, on purpose.

   Eighteen scenarios: the original eight, plus five added on top per the
   owner's standing rule, plus five more when the feed area was rebuilt from
   the owner's annotated photograph. The first five are a driver default
   overriding tray selection, scan-to-folder failing on a changed service
   password, a firmware update resetting tray configuration, a shortened
   DHCP lease sending one department's jobs to another floor, and a new
   toner cartridge fitted with its sealing strip still in.

   The second five are all FEED faults with five different answers, and
   they exist because the model can now answer them: tired lift-plate
   springs, worn separation pads, a chipped drive gear, one worn tyre on
   the shaft, and a tray not pushed home. "It has stopped taking paper" is
   one sentence covering five repairs at five prices, and until the feed
   area was drawn as a feed area a student sent to look at it was sent to
   look at a single grey cylinder.
   ===================================================================== */
/* Generated content, hand-written: see the note above CALLOUTS. */
const CALLOUTS = [
  {
    key: "garbled",
    reported: "Documents come out as pages of random symbols and unreadable characters.",
    changed: "A new driver was installed for this model yesterday.",
    scope: "It happens from every PC in the office. The printer is otherwise responsive and its own menus are fine.",
    teaches: "A garbled page is a LANGUAGE fault, and the printer's own menus printing correctly proves the machine is fine.",
    causes: [
    { key: "r", label: "The driver is the wrong page description language for this model \u2014 PCL against PostScript.", correct: true, why: "Yes. The printer is being sent instructions in a language it does not speak, so it renders them as characters. Its own menus are fine because those never leave the machine." },
    { key: "w0", label: "A faulty Ethernet cable at the printer.", correct: false, why: "A bad cable loses data, it does not translate it. You would get nothing, or a job that stops part way \u2014 not a full page of neat symbols." },
    { key: "w1", label: "Toner is low and corrupting the output.", correct: false, why: "Low toner makes a page PALE. It has no way to change which characters are printed." },
    { key: "w2", label: "The fuser is failing to bond the toner.", correct: false, why: "A failing fuser leaves the right characters smearing off the page. These are the wrong characters, firmly fused." },
    { key: "w3", label: "The print spooler on each PC is corrupted.", correct: false, why: "On every PC at once, the day after a driver change, is not a coincidence \u2014 and a corrupt spooler stops jobs rather than translating them." },
    { key: "w4", label: "The printer needs a firmware update.", correct: false, why: "Nothing changed on the printer. Something changed on the workstations, and that is where the fault arrived from." }
    ],
    actions: [
    { key: "r", label: "Install the correct driver for this exact model, in the language the printer expects.", correct: true, why: "Yes. The change that caused it is the change you undo. Match the driver to the model and the language to the machine." },
    { key: "w0", label: "Replace the Ethernet cable and retest.", correct: false, why: "Replacing hardware to fix something a driver install caused yesterday. The cable was fine the day before." },
    { key: "w1", label: "Replace the toner cartridge.", correct: false, why: "A part swap for a fault that cannot be caused by toner." },
    { key: "w2", label: "Replace the fuser or fit the maintenance kit.", correct: false, why: "The most expensive answer on the list, for a software fault." },
    { key: "w3", label: "Restart the print spooler on each affected PC.", correct: false, why: "Worth doing for a stuck queue. It will not change the language the driver speaks." },
    { key: "w4", label: "Power cycle the printer.", correct: false, why: "It is responsive and its menus are fine. There is nothing to reset." }
    ]
  },
  {
    key: "jam_a4",
    reported: "Paper jams every time, but only from the A4 tray. The other trays print normally.",
    changed: "The A4 tray was refilled this morning from a new ream.",
    scope: "Every user sees it, and only on that tray.",
    teaches: "One tray misbehaving while others are fine points at that tray's CONFIGURATION before its hardware.",
    causes: [
    { key: "r", label: "The tray's paper size or type is configured for something other than the A4 that is loaded.", correct: true, why: "Yes. The printer feeds and times the sheet for the size it has been told is in there. Tell it the wrong size and it jams the right paper." },
    { key: "w0", label: "The pickup roller for the A4 tray is worn or dirty.", correct: false, why: "Possible in general, and it is what most people reach for \u2014 but it started the morning the tray was refilled, not gradually." },
    { key: "w1", label: "The tray is overfilled or the stack is not seated.", correct: false, why: "Worth a look, and it is the second thing to check. It usually misfeeds or skews rather than jamming every single sheet." },
    { key: "w2", label: "The wrong printer driver is installed on the PCs.", correct: false, why: "A driver fault would not confine itself to one tray, and the other trays print correctly through the same driver." },
    { key: "w3", label: "The new ream is a heavier paper than the machine is set for.", correct: false, why: "A real cause of jams \u2014 but weight is a setting on the same screen as size, so this is the same answer said less precisely." },
    { key: "w4", label: "The separation pad has failed.", correct: false, why: "A failed separation pad pulls several sheets at once. This is one sheet jamming, not two being taken." }
    ],
    actions: [
    { key: "r", label: "Check the tray's size and type settings against the paper actually loaded, and reseat the stack.", correct: true, why: "Yes. It costs nothing, it takes a minute, and the timing points straight at it. Verify before you replace." },
    { key: "w0", label: "Inspect, clean or replace the pickup roller and separation pad.", correct: false, why: "This is a part swap. Do it if the settings are right and it still jams \u2014 not before." },
    { key: "w1", label: "Reinstall the driver on the affected PCs.", correct: false, why: "Nothing about this is per-PC. Every user sees it, on one tray only." },
    { key: "w2", label: "Replace the fuser or fit the maintenance kit.", correct: false, why: "The jam is at the feed end. The fuser is at the other end of the machine." },
    { key: "w3", label: "Swap the ream for a different brand of paper.", correct: false, why: "You may end up here, but you have not yet checked whether the machine simply has the wrong size set." },
    { key: "w4", label: "Disable the A4 tray and route jobs to another.", correct: false, why: "A workaround, not a fix, and it leaves the customer a tray down." }
    ]
  },
  {
    key: "misfeed_legal",
    reported: "The printer pulls two sheets at once from the Legal tray \u2014 a multi-page misfeed on most jobs.",
    changed: "The Legal tray is used rarely and was loaded from an older stack that has been in the cupboard a while.",
    scope: "It happens on every job that uses that tray.",
    teaches: "Two sheets at once is usually the PAPER. One sheet not picked up at all is usually the roller.",
    causes: [
    { key: "r", label: "The paper is curled, damp or stuck together with age and static, so sheets travel in pairs.", correct: true, why: "Yes. Paper that has sat in a damp cupboard clings to itself. The separation mechanism is designed to part two sheets, not two sheets glued by static." },
    { key: "w0", label: "The separation pad in the Legal tray is worn.", correct: false, why: "The classic answer, and the one to come back to \u2014 but this tray is rarely used, so it has done the fewest pages of any of them." },
    { key: "w1", label: "Duplex is enabled and is pulling extra sheets.", correct: false, why: "Duplex prints both sides of ONE sheet. It never takes two." },
    { key: "w2", label: "Network latency is making the printer pull several pages.", correct: false, why: "The network delivers data. It has no connection at all to how many sheets the rollers grip." },
    { key: "w3", label: "The tray guides are set wider than the paper.", correct: false, why: "A real cause of skew and misfeeds, and worth checking \u2014 but loose guides let a sheet wander, they do not make two stick together." },
    { key: "w4", label: "The pickup roller has gone hard and glazed.", correct: false, why: "A glazed roller SLIPS and takes nothing. This is taking too much, which is the opposite failure." }
    ],
    actions: [
    { key: "r", label: "Replace it with fresh paper, fan the stack, and load it against the guides.", correct: true, why: "Yes. The cheapest test there is, and the clue \u2014 an old stack, a tray nobody uses \u2014 points straight at the consumable rather than the machine." },
    { key: "w0", label: "Inspect, clean or replace the pickup roller and separation pad.", correct: false, why: "The right move if fresh paper does not fix it. It is a part swap on the least-used tray in the machine." },
    { key: "w1", label: "Disable duplex printing and retest.", correct: false, why: "Chasing a setting that cannot cause double feeds." },
    { key: "w2", label: "Replace the printer's network card.", correct: false, why: "A hardware replacement for a paper-handling fault." },
    { key: "w3", label: "Set the tray to a heavier paper weight.", correct: false, why: "Guessing at settings. Nothing suggests the weight is wrong \u2014 the age of the stack does." },
    { key: "w4", label: "Turn off the printer overnight and retest.", correct: false, why: "There is nothing here that a rest will fix." }
    ]
  },
  {
    key: "smudge_fuser",
    reported: "Printed text smears when you touch it, and the toner rubs off on your hand.",
    changed: "Nothing changed \u2014 no driver, no network. It started part way through the day.",
    scope: "It affects every job from every user.",
    teaches: "Sometimes it IS the part. 'Verify before replace' is a habit, not a rule that the answer is never hardware.",
    causes: [
    { key: "r", label: "The fuser is no longer bonding the toner to the paper.", correct: true, why: "Yes. Toner is a powder until heat and pressure melt it in. If it wipes off, it was never fused \u2014 and that is the one job the fuser has." },
    { key: "w0", label: "The paper type or weight is set wrong for the job.", correct: false, why: "A genuine cause of poor fusing, and the thing to check first \u2014 but nothing changed, and it began mid-day on a machine that was fusing correctly that morning." },
    { key: "w1", label: "Low toner is causing light output and smearing.", correct: false, why: "Low toner gives you a PALE page. What is on this page is dense; it simply is not stuck down." },
    { key: "w2", label: "A corrupted driver is producing smudges.", correct: false, why: "A driver decides what is placed on the page. It has no influence on whether heat is applied to it." },
    { key: "w3", label: "The transfer roller is not charging the paper.", correct: false, why: "A failed transfer roller gives a nearly BLANK page \u2014 the toner never reaches the paper at all." },
    { key: "w4", label: "The drum's cleaning blade has stopped wiping.", correct: false, why: "That leaves marks repeating down the page. It has nothing to do with whether the image is fused." }
    ],
    actions: [
    { key: "r", label: "Replace the fuser, or fit the maintenance kit if the machine is due one.", correct: true, why: "Yes. This is one of the times the answer really is a part. Unfused toner on every page, from a machine that has changed nothing else, is a fuser at the end of its life." },
    { key: "w0", label: "Verify the paper type and weight against the paper loaded.", correct: false, why: "The right FIRST check, and free \u2014 but with nothing changed and every job affected, the setting is not what moved." },
    { key: "w1", label: "Replace the toner cartridge and retest.", correct: false, why: "Swapping the consumable that is working for one that is not the problem." },
    { key: "w2", label: "Reinstall the printer driver.", correct: false, why: "Software for a heat fault." },
    { key: "w3", label: "Run the printer's cleaning cycle.", correct: false, why: "Cleaning removes loose toner from inside. It cannot restore heat to a failing fuser." },
    { key: "w4", label: "Advise the user to let pages dry before handling.", correct: false, why: "Not a fix, and not true \u2014 a fused page is dry the moment it lands." }
    ]
  },
  {
    key: "ghosting",
    reported: "Pages show a faint repeated image, an echo of something printed higher up the page.",
    changed: "The machine has been running high volume for several days.",
    scope: "It appears no matter which PC sends the job.",
    teaches: "A repeat down the page is a ROUND part, and the spacing between repeats tells you which one.",
    causes: [
    { key: "r", label: "The imaging drum is worn or contaminated and is carrying an image round to the next revolution.", correct: true, why: "Yes. A drum that no longer discharges cleanly holds a shadow of the last image and lays it down again one circumference later. That is what makes the echo repeat at a fixed spacing." },
    { key: "w0", label: "The cleaning blade has stopped wiping the drum.", correct: false, why: "A close and reasonable answer \u2014 it produces marks that repeat at the same interval. The difference is that a blade leaves toner DEBRIS, and this is a faint copy of the actual image." },
    { key: "w1", label: "The wrong driver is producing repeated images.", correct: false, why: "No driver draws a faint copy of the page below the original." },
    { key: "w2", label: "A loose cable is causing echoed output.", correct: false, why: "Cables lose data. They do not duplicate it faintly and offset it down the page." },
    { key: "w3", label: "The fuser is double-heating the page.", correct: false, why: "A fuser applies heat once as the sheet passes. It cannot re-print anything." },
    { key: "w4", label: "The transfer roller is applying too much charge.", correct: false, why: "Too much transfer charge gives you a dense or blotchy page, not a repeat of an earlier image." }
    ],
    actions: [
    { key: "r", label: "Replace the imaging drum or the cartridge that carries it, then retest.", correct: true, why: "Yes. The drum has done its pages. High volume for days is exactly how a drum reaches the end of its life." },
    { key: "w0", label: "Run the cleaning and calibration cycle, then retest.", correct: false, why: "Worth doing, and it may lift it briefly \u2014 which is exactly why it misleads people into thinking the drum has recovered." },
    { key: "w1", label: "Reinstall the printer driver and retest.", correct: false, why: "Software for a worn surface." },
    { key: "w2", label: "Replace the cable and retest.", correct: false, why: "Hardware, but the wrong hardware." },
    { key: "w3", label: "Replace the toner cartridge only.", correct: false, why: "On some machines the drum is inside the cartridge and this is the same answer; on others it is separate and this changes nothing. Say which you mean." },
    { key: "w4", label: "Lower the print density in the driver.", correct: false, why: "Hiding the symptom. The echo is still being laid down, just fainter." }
    ]
  },
  {
    key: "tray_not_recognized",
    reported: "The printer reports 'Tray not recognized' or 'Wrong paper size', though the tray is loaded correctly.",
    changed: "The tray was pulled out earlier in the day to clear a jam.",
    scope: "It affects all users.",
    teaches: "'What changed?' is usually the answer. Somebody opened the tray, so start with the tray.",
    causes: [
    { key: "r", label: "The tray is not fully seated, or its guides were left misaligned when it went back in.", correct: true, why: "Yes. The machine reads the tray's size from where the guides sit and from a switch the tray closes. Put it back half way, or with the guides moved, and it reports exactly this." },
    { key: "w0", label: "The tray sensor or actuator is stuck or damaged.", correct: false, why: "Possible, and it is where you go next \u2014 but it worked this morning, and something happened to the tray in between." },
    { key: "w1", label: "The driver's default paper size does not match the tray.", correct: false, why: "That produces a prompt on the PC or a wrong-size job. It does not stop the printer recognising its own tray." },
    { key: "w2", label: "A fuser failure is causing tray errors.", correct: false, why: "The fuser is at the far end of the paper path and reports its own faults." },
    { key: "w3", label: "The paper loaded is a size the printer does not support.", correct: false, why: "The tray was working with this paper before the jam was cleared." },
    { key: "w4", label: "The printer's firmware has lost its tray configuration.", correct: false, why: "A real fault, but it does not wait for somebody to open the tray before it happens." }
    ],
    actions: [
    { key: "r", label: "Reseat the tray fully, check the guides against the paper, and confirm the size on the printer's panel.", correct: true, why: "Yes. Undo what was just done. The tray came out; put it back properly before suspecting anything else." },
    { key: "w0", label: "Verify the driver and printer defaults match.", correct: false, why: "Useful housekeeping, and it fixes a different fault \u2014 the printer is complaining about its own tray, not about a job." },
    { key: "w1", label: "Escalate for hardware service on the tray sensor.", correct: false, why: "Calling out an engineer before pushing the tray in." },
    { key: "w2", label: "Replace the fuser or fit the maintenance kit.", correct: false, why: "The most expensive part in the machine, for a tray that was opened an hour ago." },
    { key: "w3", label: "Load a different size of paper and retest.", correct: false, why: "Changing the input rather than fixing the tray." },
    { key: "w4", label: "Update the printer's firmware.", correct: false, why: "A long job with real risk, to fix something a firm push may cure." }
    ]
  },
  {
    key: "queue_frozen",
    reported: "Print jobs pile up in the queue and never come out. The printer shows online and ready.",
    changed: "A large job was sent earlier and then cancelled part way through.",
    scope: "Several users are affected.",
    teaches: "'Printer shows ready' moves the fault OFF the printer. Ready means it is waiting for work it never received.",
    causes: [
    { key: "r", label: "A stuck job is blocking the queue behind it.", correct: true, why: "Yes. A cancelled job that never finished clearing sits at the head of the queue, and everything sent afterwards waits behind it. The printer is ready because it is not the printer that is stuck." },
    { key: "w0", label: "Low toner is preventing jobs from printing.", correct: false, why: "A machine low on toner still prints, and it would say so on its panel rather than reporting ready." },
    { key: "w1", label: "A pickup roller failure is freezing the queue.", correct: false, why: "A roller fault gives you a misfeed or a jam message. The jobs would reach the machine and fail there, not sit on the server." },
    { key: "w2", label: "The wrong paper type is set and jobs are held.", correct: false, why: "That produces a 'load paper' prompt on the panel, not a silent ready state." },
    { key: "w3", label: "The printer has dropped off the network.", correct: false, why: "Then it would not be showing online and ready. Something is talking to it." },
    { key: "w4", label: "The driver on each PC needs reinstalling.", correct: false, why: "On several users at once, immediately after one cancelled job, the common factor is the queue and not each workstation." }
    ],
    actions: [
    { key: "r", label: "Clear the stuck jobs, restart the print service, then test with one small job.", correct: true, why: "Yes. Free, quick, and it undoes exactly what the cancelled job left behind." },
    { key: "w0", label: "Replace the toner cartridge and retest.", correct: false, why: "Replacing a consumable to fix a queue." },
    { key: "w1", label: "Replace the pickup rollers and retest.", correct: false, why: "A part swap for a fault that has not reached the paper path." },
    { key: "w2", label: "Replace the entire printer.", correct: false, why: "The printer is reporting itself ready and healthy." },
    { key: "w3", label: "Power cycle the printer and retest.", correct: false, why: "It may flush what is in the machine, but the blocked job is on the queue and will simply go again." },
    { key: "w4", label: "Ask users to resend their jobs.", correct: false, why: "They will queue up behind the same blockage." }
    ]
  },
  {
    key: "wifi_intermittent",
    reported: "Wireless printing works for a while, then jobs fail until somebody reboots the printer.",
    changed: "The office Wi-Fi SSID was changed last week and the printer was reconnected to it.",
    scope: "Intermittent, for several users.",
    teaches: "Intermittent-but-fixed-by-reboot is the signature of something that gets renegotiated at startup \u2014 usually an address.",
    causes: [
    { key: "r", label: "The printer's IP address keeps changing, so the queues on the PCs are sending to an address it no longer has.", correct: true, why: "Yes. The workstations print to an address, not to a name. Let the lease expire and the printer moves; the queues keep talking to where it used to be until something makes them look again." },
    { key: "w0", label: "Wi-Fi power saving is dropping the connection when idle.", correct: false, why: "A genuinely good answer and the closest wrong one here \u2014 it also gives 'works, then stops'. The difference is that a sleeping printer wakes on traffic, and this one needs a full reboot." },
    { key: "w1", label: "The SSID or credentials on the printer are wrong.", correct: false, why: "Then it would never connect at all, rather than working for a while after each reboot." },
    { key: "w2", label: "A fuser fault is causing wireless disconnects.", correct: false, why: "Nothing in the fuser touches the network." },
    { key: "w3", label: "The wireless signal at the printer is too weak.", correct: false, why: "Weak signal is slow and lossy all the time. This is fine, then completely gone, then fine again after a reboot." },
    { key: "w4", label: "The printer's wireless card is failing.", correct: false, why: "Hardware that fails intermittently and recovers on a reboot is possible \u2014 but a lease expiring does the same thing and costs nothing to rule out first." }
    ],
    actions: [
    { key: "r", label: "Give it a static or reserved address, and point the print queues at it.", correct: true, why: "Yes. Fix the address and the symptom cannot recur, whatever the lease does." },
    { key: "w0", label: "Adjust the power saving and sleep settings, then retest.", correct: false, why: "The right test for the answer above, and worth doing \u2014 but it does not address an address that moves." },
    { key: "w1", label: "Forget and rejoin the Wi-Fi network with the correct credentials.", correct: false, why: "It is already joining successfully every time it reboots." },
    { key: "w2", label: "Replace the fuser or fit the maintenance kit.", correct: false, why: "A part at the opposite end of the machine from the fault." },
    { key: "w3", label: "Move the printer closer to the access point.", correct: false, why: "Treating it as a coverage problem when it connects perfectly well." },
    { key: "w4", label: "Tell users to reboot the printer when it stops.", correct: false, why: "Teaching the customer to live with it." }
    ]
  },
  {
    key: "tray_override",
    reported: "Everything prints from tray 1 no matter which tray the user selects.",
    changed: "A batch of new workstations was set up last week from a standard image.",
    scope: "Only the new machines do it. The older PCs still print to the tray they ask for.",
    teaches: "'Only the new machines' is the whole answer. Scope tells you where to look before the symptom does.",
    causes: [
    { key: "r", label: "The driver on the new image has a default tray set that overrides the job's own\u9078 selection.", correct: true, why: "Yes. A driver default is applied to every job that does not explicitly say otherwise, and most applications do not. The old PCs behave because their drivers were configured individually." },
    { key: "w0", label: "The printer's own default tray has been changed.", correct: false, why: "Then the old workstations would do it too, and they do not." },
    { key: "w1", label: "The other trays are empty or not seated.", correct: false, why: "The printer would report that, and the old PCs would fail as well." },
    { key: "w2", label: "The new PCs are on the wrong print queue.", correct: false, why: "They are reaching the right printer \u2014 the pages come out, just from the wrong tray." },
    { key: "w3", label: "The paper sizes in the other trays are set wrong.", correct: false, why: "That sends jobs to a tray that matches the size, which is a related fault \u2014 but it would affect every workstation, not only the new ones." },
    { key: "w4", label: "The image was built with an outdated driver version.", correct: false, why: "Possible, and worth checking \u2014 but a version difference does not by itself force a tray; a configured default does." }
    ],
    actions: [
    { key: "r", label: "Correct the tray setting in the driver's defaults on the image, and reapply it to the machines already built.", correct: true, why: "Yes. Fix it where it came from, or you will fix it one workstation at a time for the next year." },
    { key: "w0", label: "Change the printer's default tray on its panel.", correct: false, why: "That would break the workstations that are currently correct." },
    { key: "w1", label: "Reinstall the driver on each new PC.", correct: false, why: "It will reinstall with the same defaults out of the same image." },
    { key: "w2", label: "Tell users to pick the tray in the print dialog each time.", correct: false, why: "They already are. That is the setting being overridden." },
    { key: "w3", label: "Move the paper so the wanted stock is in tray 1.", correct: false, why: "Rearranging the customer's stationery around a software fault." },
    { key: "w4", label: "Replace the printer with one that has fewer trays.", correct: false, why: "Removing the capability rather than configuring it." }
    ]
  },
  {
    key: "scan_creds",
    reported: "Scan to folder has stopped working. Scan to email is fine, and printing is fine.",
    changed: "The service account's password was changed at the weekend as part of a security review.",
    scope: "Every user, every destination folder.",
    teaches: "When one function of an MFD fails and the others are fine, the fault is in what that function alone depends on.",
    causes: [
    { key: "r", label: "The stored credentials the MFD uses to write to the share are now out of date.", correct: true, why: "Yes. The machine holds its own copy of a username and password to reach the file share. Change the password anywhere else and the machine is still offering the old one." },
    { key: "w0", label: "The network share has been moved or renamed.", correct: false, why: "Nothing was moved. A password was changed, and the timing lines up exactly." },
    { key: "w1", label: "The MFD has lost its network connection.", correct: false, why: "Then printing and scan to email would have stopped too. They have not." },
    { key: "w2", label: "The share's permissions were changed in the review.", correct: false, why: "Plausible in the same breath as a security review \u2014 but permissions failing would usually deny some users and not others, and this is everybody." },
    { key: "w3", label: "SMB version 1 was disabled on the file server.", correct: false, why: "A real and common cause of exactly this symptom, and the right second guess \u2014 but that is a protocol change, and what actually changed here was a password." },
    { key: "w4", label: "The scan destination address book entries are corrupted.", correct: false, why: "Then scan to email would be affected as well; it shares the same address book." }
    ],
    actions: [
    { key: "r", label: "Update the stored credentials on the MFD to the new password, and test one scan to each destination.", correct: true, why: "Yes. Change the thing that changed. Everything else on the machine is working, which narrows it to what scan to folder alone needs." },
    { key: "w0", label: "Recreate the scan destinations from scratch.", correct: false, why: "Rebuilding entries that are correct apart from one password." },
    { key: "w1", label: "Re-enable SMB version 1 on the file server.", correct: false, why: "Reopening a protocol that was disabled for a reason, to fix something that is not the cause." },
    { key: "w2", label: "Reboot the MFD.", correct: false, why: "It will offer the same wrong password when it comes back." },
    { key: "w3", label: "Give the service account administrator rights.", correct: false, why: "Escalating privilege to fix an authentication failure, during a security review." },
    { key: "w4", label: "Switch the users to scan to email instead.", correct: false, why: "A workaround that loses the customer the feature they asked about." }
    ]
  },
  {
    key: "firmware_trays",
    reported: "Since the weekend, everything prints on the wrong size and users are getting size mismatch prompts.",
    changed: "Firmware was updated on Saturday as part of a security patch round.",
    scope: "All users, all trays.",
    teaches: "A firmware update is a CHANGE, and configuration is what changes tend to take with them.",
    causes: [
    { key: "r", label: "The firmware update reset the tray configuration to the manufacturer's defaults.", correct: true, why: "Yes. The trays are physically loaded as they always were, but the machine's record of what is in them has gone back to factory. It is now describing paper it does not have." },
    { key: "w0", label: "The paper guides in every tray were moved.", correct: false, why: "All of them, over one weekend, with nobody in the building." },
    { key: "w1", label: "The driver defaults changed on the workstations.", correct: false, why: "Nothing was done to the workstations. The change was on the printer." },
    { key: "w2", label: "The wrong paper was loaded into every tray.", correct: false, why: "The stationery cupboard did not change, and the same paper was correct on Friday." },
    { key: "w3", label: "The firmware update failed part way and left the machine unstable.", correct: false, why: "Worth confirming from the machine's log \u2014 but the machine is working; it just believes the wrong thing about its trays." },
    { key: "w4", label: "The printer has been factory reset by somebody on site.", correct: false, why: "Close, and the same end state \u2014 but a scheduled firmware update on Saturday is a change you already know about, and it is the simpler explanation." }
    ],
    actions: [
    { key: "r", label: "Set every tray's size and type back to what is loaded, and record the settings so the next update can be checked against them.", correct: true, why: "Yes. Restore the configuration the update discarded, and write it down so it takes minutes rather than an afternoon next time." },
    { key: "w0", label: "Roll the firmware back to the previous version.", correct: false, why: "A risky operation to undo a settings change you can correct in five minutes." },
    { key: "w1", label: "Reinstall the drivers on all workstations.", correct: false, why: "The workstations were never touched." },
    { key: "w2", label: "Reload every tray with the size the printer now expects.", correct: false, why: "Making the customer's stationery fit the machine's mistake." },
    { key: "w3", label: "Raise a warranty case with the manufacturer.", correct: false, why: "For behaviour that is documented and expected after a firmware update." },
    { key: "w4", label: "Disable automatic firmware updates and retest.", correct: false, why: "Sensible policy for later. It does not print anything correctly today." }
    ]
  },
  {
    key: "dhcp_port",
    reported: "One department's jobs come out on a different floor's printer. Everybody else is unaffected.",
    changed: "The DHCP lease time on the office network was shortened a fortnight ago.",
    scope: "Only that department's queue.",
    teaches: "Printing to an ADDRESS is fragile; printing to a NAME survives the address changing underneath it.",
    causes: [
    { key: "r", label: "Their print queue points at an IP address that now belongs to a different device.", correct: true, why: "Yes. The queue was set up with an address rather than a name. The original printer's lease expired, that address was handed to another machine, and the jobs are going obediently to the new occupant." },
    { key: "w0", label: "The two printers have been swapped over physically.", correct: false, why: "Nobody moved anything, and only one department is affected." },
    { key: "w1", label: "Their driver is configured for the wrong printer model.", correct: false, why: "Then the pages would come out wrong, or not at all. They are printing correctly \u2014 in the wrong place." },
    { key: "w2", label: "Someone changed the default printer on their PCs.", correct: false, why: "That would send jobs to a printer those users chose, and they would recognise the name in the dialog." },
    { key: "w3", label: "The two printers have been given the same IP address.", correct: false, why: "A genuine conflict, and it produces something close to this \u2014 but a conflict makes printing unreliable for BOTH, and the other floor is fine." },
    { key: "w4", label: "Their queue is pointing at the wrong DNS name.", correct: false, why: "The right shape of answer, and the right lesson \u2014 but a name would have followed the printer to its new address. Pointing at a name is the FIX, not the fault." }
    ],
    actions: [
    { key: "r", label: "Reserve the printer's address, then repoint the queue at the printer \u2014 by name, so this cannot recur.", correct: true, why: "Yes. Fix the address today and the lookup permanently, or the same fault comes back the next time a lease turns over." },
    { key: "w0", label: "Change the other floor's printer to a different address.", correct: false, why: "Moving the innocent device to accommodate a queue that is pointing at the wrong thing." },
    { key: "w1", label: "Extend the DHCP lease time back to what it was.", correct: false, why: "Making the fault rarer instead of fixing it, and undoing a change made for a reason." },
    { key: "w2", label: "Recreate the queue with the same IP address.", correct: false, why: "Rebuilding the queue around the very address that is now wrong." },
    { key: "w3", label: "Reboot both printers.", correct: false, why: "They will come back on whatever addresses DHCP gives them, which is the problem." },
    { key: "w4", label: "Tell the department to walk to the other floor.", correct: false, why: "Not a fix." }
    ]
  },
  {
    key: "toner_seal",
    reported: "Pages come out completely blank. The machine reports no error and the counter goes up.",
    changed: "A new toner cartridge was fitted an hour ago by somebody in the office.",
    scope: "Every job since.",
    teaches: "'What changed?' beats 'what usually breaks?'. An hour-old cartridge is a stronger clue than any component's failure rate.",
    causes: [
    { key: "r", label: "The sealing strip was left in the new cartridge, so no toner is reaching the drum.", correct: true, why: "Yes. The seal keeps toner in the hopper during shipping and has to be pulled before the cartridge goes in. Left in place, the machine runs a perfect cycle over a drum with nothing on it." },
    { key: "w0", label: "The new cartridge is faulty or empty.", correct: false, why: "Possible, and it is what the office will tell you \u2014 but a brand new cartridge fitted an hour before the symptom started deserves the simpler explanation first." },
    { key: "w1", label: "The transfer roller is not charging the paper.", correct: false, why: "That also gives a blank page, and it is the closest wrong answer here. The difference is what changed: a cartridge went in an hour ago and the transfer roller did not." },
    { key: "w2", label: "The laser or scanner assembly has failed.", correct: false, why: "Also blank pages \u2014 but again, nothing touched the laser, and something touched the cartridge." },
    { key: "w3", label: "The wrong paper type is set and toner is not fusing.", correct: false, why: "Unfused toner gives you a smeared page, not an empty one. There is nothing on this page at all." },
    { key: "w4", label: "The drum is at the end of its life.", correct: false, why: "A worn drum goes faint and patchy over weeks. It does not go from printing to nothing in one cartridge change." }
    ],
    actions: [
    { key: "r", label: "Take the cartridge out, remove the sealing strip, refit it and retest.", correct: true, why: "Yes. It takes a minute, it costs nothing, and it is what changed an hour ago." },
    { key: "w0", label: "Fit another new cartridge.", correct: false, why: "Consuming a second cartridge before checking the first one was fitted properly." },
    { key: "w1", label: "Replace the transfer roller.", correct: false, why: "A part swap, for a fault that arrived with a consumable." },
    { key: "w2", label: "Replace the laser scanner assembly.", correct: false, why: "One of the most expensive assemblies in the machine." },
    { key: "w3", label: "Run the cleaning cycle and retest.", correct: false, why: "Cleaning a drum that is not receiving any toner to begin with." },
    { key: "w4", label: "Return the printer to the supplier as faulty.", correct: false, why: "The printer is doing everything correctly except being given any toner." }
    ]
  },

  /* ------------------------------------------------------------------
     FIVE MORE, EARNED BY THE FEED AREA BEING DRAWN

     The standing rule is five new scenarios on top whenever something new
     is added, and these five are the ones the rebuilt feed area makes
     answerable. Until the owner's annotated photograph went in, this
     bench had one generic roller where a real machine has a sprung lift
     plate, a gear train, two separation pads and four tyres on a shaft —
     so a student sent to look at a feed fault was sent to look at a
     cylinder, and every one of these five would have been guesswork.

     They are deliberately all feed faults with DIFFERENT answers, because
     "it stopped taking paper" is one sentence covering five distinct
     repairs at five different prices, and telling them apart is the
     skill. The discriminator in each is the pattern, not the symptom:
     when in the stack it happens, how many sheets come, whether it is
     one tray or all of them, and what you hear.
     ------------------------------------------------------------------ */
  {
    key: "feeds_full_only",
    reported: "It prints fine after the tray is refilled, then stops taking paper once the tray is about a third down. Filling it up makes it work again.",
    changed: "Nothing was changed. It has been getting worse over about two months.",
    scope: "One tray, every user. The other tray is fine at any level.",
    teaches: "A fault that depends on how FULL the tray is, is a fault in what lifts the paper — not in what grips it.",
    causes: [
    { key: "r", label: "The tray lift plate's springs have weakened, so a low stack no longer reaches the pickup tyre.", correct: true, why: "Yes. The plate is sprung to hold the top sheet against the tyre whatever the level. A tired spring can carry a heavy full stack up but not the last third, which is exactly the pattern described." },
    { key: "w0", label: "The pickup tyre is glazed and slipping.", correct: false, why: "The answer everybody reaches for, and it is a real fault — but a glazed tyre slips on a full tray as readily as an empty one. This one works perfectly when the tray is full." },
    { key: "w1", label: "The separation pad is worn and holding every sheet back.", correct: false, why: "A worn pad lets too many sheets through, not too few. And it too would misbehave at any level." },
    { key: "w2", label: "The paper size is set wrongly for the tray.", correct: false, why: "A size mismatch jams or refuses from the first sheet. It has no way of knowing how deep the stack is." },
    { key: "w3", label: "The paper has absorbed damp and gone limp.", correct: false, why: "Damp paper misfeeds and curls, and the bottom of a ream is usually the damper end — but this recovers completely the moment fresh height is added, not fresh paper." },
    { key: "w4", label: "The tray is not being pushed fully home.", correct: false, why: "Worth checking first, and it costs nothing. But a tray that is out would fail when full as well, and this one does not." }
    ],
    actions: [
    { key: "r", label: "Replace the lift plate springs, or the tray assembly if the springs are not supplied separately.", correct: true, why: "Yes. The part that has lost its job is the part to replace, and this one has been losing it gradually for two months." },
    { key: "w0", label: "Clean the pickup tyre with a lint-free cloth, then replace it if that does not hold.", correct: false, why: "The right procedure for a glazed tyre, and the wrong fault. You will do the work and it will still fail at a third down." },
    { key: "w1", label: "Replace the separation pad.", correct: false, why: "A part swap on the component that is doing its job correctly." },
    { key: "w2", label: "Check the tray's size and type settings.", correct: false, why: "Always worth doing, costs nothing, and cannot explain a fault that depends on stack height." },
    { key: "w3", label: "Load a fresh ream from a dry store and retest.", correct: false, why: "You will be told it is fixed, because a fresh ream is also a FULL tray. It will fail again a third of the way down and you will have learned nothing." },
    { key: "w4", label: "Fit the maintenance kit.", correct: false, why: "The kit is rollers and a fuser on a page count. The springs are not in it and the machine is nowhere near its count." }
    ]
  },
  {
    key: "multifeed_full",
    reported: "It takes two or three sheets at once, several times a ream. Worst right after the tray is filled.",
    changed: "Nothing. The machine is a little over halfway through its rated life.",
    scope: "Both trays, every user, on stock that has always worked.",
    teaches: "Too FEW sheets is the thing that grips; too MANY is the thing that holds back. They are different parts and they fail in opposite directions.",
    causes: [
    { key: "r", label: "The separation pads are worn smooth, so nothing is holding the second sheet back.", correct: true, why: "Yes. The pad's job is friction against the sheet underneath. Polished bald, it lets whatever the tyre drags come through — and a full tray presses hardest, which is why it is worst then." },
    { key: "w0", label: "The pickup tyres are worn and gripping unevenly.", correct: false, why: "A worn tyre takes FEWER sheets, not more. This machine is taking too many, which is the opposite failure." },
    { key: "w1", label: "The lift plate is pushing the stack up too hard.", correct: false, why: "Plausible-sounding and it is the near miss worth thinking about — but the plate's spring pressure is fixed and does not increase with age. It weakens, it does not strengthen." },
    { key: "w2", label: "The paper is damp and the sheets are clinging together.", correct: false, why: "A genuine cause of multi-feeds, and the one to rule out first — but this is stock that has always worked, several times a ream, over a long period rather than one bad box." },
    { key: "w3", label: "The tray is overfilled past its maximum line.", correct: false, why: "Also a real cause, also worth a look. It would have started when somebody changed how they fill it, and nothing changed." },
    { key: "w4", label: "The drive gears have worn and the shaft is over-rotating.", correct: false, why: "Worn gears slip and lose timing; they do not turn further than they were told to. And they would make a noise long before they made a multi-feed." }
    ],
    actions: [
    { key: "r", label: "Replace the separation pads, and replace the pickup tyres at the same time.", correct: true, why: "Yes. They wear as a pair against each other, and a new pad against a glazed tyre just moves the problem along one part." },
    { key: "w0", label: "Replace the pickup tyres only.", correct: false, why: "Half the job, on the half that is not the cause. You will be back." },
    { key: "w1", label: "Wipe the separation pads with a damp lint-free cloth.", correct: false, why: "The whole repair on a pad that has gone chalky and is still textured underneath — which is why it is here. On one worn smooth there is no texture left to uncover and cleaning achieves nothing." },
    { key: "w2", label: "Swap to a fresh ream from a dry store.", correct: false, why: "Rule damp paper out first by all means. It will not survive 'several times a ream, on stock that has always worked'." },
    { key: "w3", label: "Fill the trays to half their capacity as a workaround.", correct: false, why: "A workaround that halves the customer's capacity and hides the fault instead of fixing it." },
    { key: "w4", label: "Replace the drive gear train.", correct: false, why: "The most invasive answer here, on a part with no symptom pointing at it." }
    ]
  },
  {
    key: "gear_tick",
    reported: "A rhythmic tick every couple of seconds while it prints, and roughly one page in ten comes out with a band of print squashed or smeared across the middle.",
    changed: "The tick started about three weeks ago and has got louder. The smearing started last week.",
    scope: "Every tray, every user, every job long enough to hear it.",
    teaches: "A repeating NOISE and a repeating DEFECT with the same rhythm are one rotating part. The interval names it.",
    causes: [
    { key: "r", label: "A tooth on the drive gear train is worn or chipped, so the paper stops and restarts mid-page.", correct: true, why: "Yes. A damaged tooth passes once per revolution: you hear it, and the sheet momentarily loses drive, which compresses the print across a band. The tick and the band share a rhythm because they share a cause." },
    { key: "w0", label: "The fuser is failing to bond the toner in a band.", correct: false, why: "A fuser fault smears toner that rubs off under a fingernail. This print is firmly fused — it is squashed, which is a paper-movement fault, not a heat one." },
    { key: "w1", label: "The imaging drum has a score line across it.", correct: false, why: "A damaged drum repeats at the drum's circumference, and it puts a mark ON the page rather than compressing what is already there. It is also silent." },
    { key: "w2", label: "The pickup tyre is glazed and slipping at the feed.", correct: false, why: "The closest wrong answer, because slip is the right idea. But a feed-end slip skews or fails to pick the sheet at all; it cannot squash print in the middle of a page already travelling." },
    { key: "w3", label: "The transfer roller is worn.", correct: false, why: "A tired transfer roller gives you pale or patchy transfer over the whole sheet. It has no way to produce a band and no way to tick." },
    { key: "w4", label: "The paper is too heavy for the machine's setting.", correct: false, why: "Heavy stock strains the feed and can cause jams — but it would have started when the paper changed, and it changes nothing about a noise that has been getting worse for three weeks." }
    ],
    actions: [
    { key: "r", label: "Open the drive side, find the gear with rounded or missing teeth and swarf packed in its roots, and replace it — checking the gear it meshes with for the same.", correct: true, why: "Yes. The swarf in the roots is the evidence that it is THIS gear and not its neighbour, and the mating gear takes the same damage, so look before you order only one." },
    { key: "w0", label: "Replace the fuser assembly.", correct: false, why: "One of the dearest parts in the machine, for a fault whose toner is fused perfectly well." },
    { key: "w1", label: "Replace the imaging drum or the whole cartridge.", correct: false, why: "A consumable swap for a mechanical fault, and it will not silence the tick." },
    { key: "w2", label: "Clean and then replace the pickup tyres and separation pads.", correct: false, why: "Feed-end maintenance for a fault happening mid-page. Reasonable housekeeping, no effect on this." },
    { key: "w3", label: "Run the machine's cleaning cycle and print a test page.", correct: false, why: "Free, quick, and it treats none of this. Do it if you like; the tick will still be there." },
    { key: "w4", label: "Ignore the noise and monitor — it is still printing.", correct: false, why: "It was a tick three weeks ago and it is a tick plus ruined pages now. A gear does not recover, and when it strips it takes the timing of everything downstream with it." }
    ]
  },
  {
    key: "skew",
    reported: "Pages come out with the print running noticeably crooked — about half a centimetre out of square by the bottom of the sheet.",
    changed: "Nothing. It has crept in over the last few weeks.",
    scope: "One tray only. The same job from the other tray is square.",
    teaches: "Crooked print with the image correctly placed on the drum is a PAPER fault, and one tray only says which end of the machine to look at.",
    causes: [
    { key: "r", label: "One of the outboard feed tyres on that tray's shaft is worn, so one side of the sheet is dragged less than the other.", correct: true, why: "Yes. The shaft carries several tyres and they have to grip equally. One worn tyre pulls its side of the sheet slower, and the sheet enters the path at an angle — which grows all the way down the page." },
    { key: "w0", label: "The paper guides in that tray are not set against the stack.", correct: false, why: "The FIRST thing to check and it costs nothing — but loose guides give you a skew that varies sheet to sheet, not one that has crept in steadily over weeks." },
    { key: "w1", label: "The image is being placed crooked on the drum by the scanner assembly.", correct: false, why: "The near miss worth thinking about. It would be crooked from every tray, and the other tray is square through the same scanner." },
    { key: "w2", label: "The separation pads are worn.", correct: false, why: "Worn pads let extra sheets through. They act across the middle of the sheet and have no way to twist it." },
    { key: "w3", label: "The tray lift plate is sitting unevenly.", correct: false, why: "A genuinely close answer — an uneven plate would also present the sheet at an angle. Worth inspecting; but a plate on two springs sits level or visibly does not, and this is a gradual creep rather than a sudden lean." },
    { key: "w4", label: "The duplexer is turning the sheet unevenly.", correct: false, why: "These are single-sided jobs. The sheet never reaches the duplexer." }
    ],
    actions: [
    { key: "r", label: "Check the guides first, then inspect each tyre on that shaft and replace the whole set if any one of them is worn.", correct: true, why: "Yes. Rule out the free thing first, then replace the tyres as a set — fitting one new tyre beside three old ones builds the same uneven grip back in from the other direction." },
    { key: "w0", label: "Replace the single worn tyre.", correct: false, why: "It fixes today and creates tomorrow: one fresh tyre gripping harder than its three worn neighbours skews the sheet the other way." },
    { key: "w1", label: "Recalibrate or replace the laser scanner assembly.", correct: false, why: "An expensive assembly, for a fault the other tray disproves." },
    { key: "w2", label: "Replace the separation pads.", correct: false, why: "A part swap on a component that cannot twist a sheet." },
    { key: "w3", label: "Set the driver to shift the image to compensate.", correct: false, why: "Hiding a mechanical fault behind a software offset. It will drift again next week and the offset will be wrong in a new way." },
    { key: "w4", label: "Route all jobs to the other tray.", correct: false, why: "A workaround, and it leaves the customer a tray down for a repair that is a set of tyres." }
    ]
  },
  {
    key: "no_pick_after_jam",
    reported: "After clearing a jam this morning it will not take paper from that tray at all. It reports the tray as empty and it is full.",
    changed: "A jam was cleared an hour ago by somebody in the office, who pulled the tray right out to reach the sheet.",
    scope: "That tray only, from every PC, starting immediately after the jam was cleared.",
    teaches: "When a fault starts the moment somebody put their hands in the machine, look at what they touched before you look at what wears out.",
    causes: [
    { key: "r", label: "The tray was not pushed fully home, so the lift plate has not been released and the stack is not reaching the tyre.", correct: true, why: "Yes. Pulling the tray lets the plate drop; seating it back releases the catch and lets the springs lift the stack. Left a few millimetres short, the plate stays down and the machine correctly reports that nothing is presented to it." },
    { key: "w0", label: "The paper-out sensor flag was bent while the jam was cleared.", correct: false, why: "The strongest wrong answer here and it deserves a look, because it also arrived with the jam clearance and it also gives a false empty. Check the tray is home first — it takes a second and costs nothing." },
    { key: "w1", label: "A torn scrap of paper is still in the feed path.", correct: false, why: "Always to be ruled out after a jam, and it usually gives you an immediate re-jam or a jam warning rather than a clean 'tray empty'." },
    { key: "w2", label: "The pickup tyre is glazed.", correct: false, why: "A tyre does not glaze in an hour. It was feeding perfectly before somebody opened the machine." },
    { key: "w3", label: "The lift plate springs have failed.", correct: false, why: "They would have been failing gradually and the tray would have got fussier as it emptied. This tray is full and it went from working to not working in one movement." },
    { key: "w4", label: "The tray's paper size setting was reset.", correct: false, why: "A size mismatch gives a size prompt or a jam, not an empty tray, and clearing a jam does not change a setting." }
    ],
    actions: [
    { key: "r", label: "Pull the tray out and push it firmly home until it seats, then retest.", correct: true, why: "Yes. Free, instant, and it is exactly what changed an hour ago. Verify before you inspect and inspect before you replace." },
    { key: "w0", label: "Open the machine and inspect the paper-out sensor flag for damage.", correct: false, why: "The right SECOND step, and a fair one — but it means opening a machine before trying the thing that takes a second at the front of it." },
    { key: "w1", label: "Strip the feed path looking for a torn scrap.", correct: false, why: "Worth doing after any jam, and a bigger job than seating a tray. Do the free check first." },
    { key: "w2", label: "Clean or replace the pickup tyre.", correct: false, why: "A part swap an hour after the part was working." },
    { key: "w3", label: "Replace the tray assembly.", correct: false, why: "Buying a tray to fix a tray that is not pushed in." },
    { key: "w4", label: "Power cycle the printer and retest.", correct: false, why: "The reflex answer. The machine is reporting exactly what it can see, and a restart will let it report the same thing again." }
    ]
  }
];

function sixOf(pool, correctKey, salt) {
  const correct = pool.filter(function (x) { return x.key === correctKey; });
  const rest = pool.filter(function (x) { return x.key !== correctKey; });
  /* A stable per-item score from the key's own characters plus the
     scenario's salt: no RNG to thread through, and no dependence on the
     order the pool happens to be declared in. */
  function score(x) {
    let h = (salt || 0) % 9973;
    for (let i = 0; i < x.key.length; i++) h = (h * 31 + x.key.charCodeAt(i)) % 9973;
    return h;
  }
  /* THE RIGHT ANSWER MUST NOT SIT IN THE SAME PLACE.

     First cut took the five lowest-scoring others and re-sorted the six.
     Since those five were the smallest scores, the correct one usually
     sorted above all of them and landed LAST in 41% of 300 seeds — a
     pattern a student would learn instead of the content, and exactly
     the kind of tell that makes a drill measure the wrong thing.

     So: sort the whole pool, then take a window of six that contains
     the correct item, positioned inside that window by its own score.
     Every slot comes up about equally. */
  const all = pool.slice().sort(function (a, b) { return score(a) - score(b); });
  if (all.length <= 6) return all;
  const idx = all.findIndex(function (x) { return x.key === correctKey; });
  const want = correct.length ? score(correct[0]) % 6 : 0;
  const start = Math.max(0, Math.min(all.length - 6, idx - want));
  return all.slice(start, start + 6);
}

const WEAR_TECH = [
  { tech: "laser", name: "the laser",
    parts: STEPS.map(function (x) {
      return { key: x.key, label: x.part.charAt(0).toUpperCase() + x.part.slice(1),
               doing: x.doing, wear: x.wear, wears: x.wears };
    }).concat(MECH_PARTS.map(function (x) {
      return { key: x.key, label: x.label, doing: x.says, wear: x.wear, wears: x.wears };
    })) },
  { tech: "thermal", name: "the thermal label printer",
    parts: THERMAL_PARTS.map(function (x) {
      return { key: x.key, label: x.label, doing: x.says, wear: x.wear, wears: x.wears };
    }) },
  { tech: "impact", name: "the dot matrix",
    parts: IMPACT_PARTS.map(function (x) {
      return { key: x.key, label: x.label, doing: x.says, wear: x.wear, wears: x.wears };
    }) },
  { tech: "inkjet", name: "the inkjet",
    parts: INKJET_PARTS.map(function (x) {
      return { key: x.key, label: x.label, doing: x.says, wear: x.wear, wears: x.wears };
    }) }
];

/* Load-time check: every part in every technology must carry four rungs,
   or the stage can generate a scenario it cannot describe. A missing
   ladder is the kind of thing that survives review and then throws in
   front of a student. */
WEAR_TECH.forEach(function (T) {
  T.parts.forEach(function (P) {
    if (!P.wear || P.wear.length !== 4) {
      throw new Error("wear: " + T.tech + "/" + P.key + " has " +
        ((P.wear || []).length) + " rungs, not four.");
    }
    /* AND IF THE STAGE CAN CHOOSE IT, IT MUST HAVE A SHAPE THE BENCH CAN
       DRAW. The wear stage puts the 3D model up as the answer surface,
       and an unmapped part falls back silently to a roller — a student
       asked to point at the damage on a drive gear would be shown a
       rubber roller. Adding a part and forgetting its shape is a
       one-line mistake with no symptom until somebody opens that stage.

       ONLY the parts that wear, because only those can be chosen (see
       the r.pick filter in the wear stage). The five that do not wear —
       the formatter, the label roll, the ribbon, the gap lever and the
       ink cartridge — deliberately have no shape and are deliberately
       never put on the bench. Written unconditionally, this check failed
       on all five the moment it was added, which is the check being
       wrong rather than the content. */
    /* AND THE FIFTH RUNG MUST DESCRIBE A PART THAT EXISTS AND WEARS.
       PERISH_WEAR is a parallel table, which is exactly the shape of
       thing that drifts: rename a part and the entry is orphaned, with
       no symptom until a student lands on that one seed. */
    if (PERISHES[P.key] && !PERISH_WEAR[P.key]) {
      throw new Error("wear: " + P.key + " is marked as perishing but has no PERISH_WEAR entry.");
    }
    if (PERISHES[P.key] && !P.wears) {
      throw new Error("wear: " + P.key + " is marked as perishing but does not wear at all.");
    }
    if (P.wears && !WEAR_SHAPE[P.key]) {
      throw new Error("wear: " + T.tech + "/" + P.key + " wears but has no WEAR_SHAPE, so the " +
        "bench would draw the wrong part for it.");
    }
  });
  Object.keys(PERISH_WEAR).forEach(function (k) {
    if (!PERISHES[k]) {
      throw new Error("wear: PERISH_WEAR has an entry for " + k + " which is not marked as " +
        "perishing, so nothing would ever show it.");
    }
  });
  if (!T.parts.some(function (P) { return P.wears; })) {
    throw new Error("wear: " + T.tech + " has no part that wears, so the stage could never " +
      "pick it.");
  }
});

export function generate(seed) {
  const r = rng(seed);
  const customer = r.pick(CUSTOMERS);
  const job = r.pick(JOBS);
  const type = TYPES[job.best];

  /* The defect is generated FROM a broken step. Laser jobs can break at
     any of the seven; the other technologies do not have a drum, so
     they get the steps that still apply. This is why a defect can never
     name a part the process table does not blame. */
  const laserish = job.best === "laser";
  const brokenStep = laserish ? r.pick(STEPS)
    : r.pick(STEPS.filter(function (s) { return s.key === "processing"; }));

  const model = r.pick(BRANDS) + " " + r.int(200, 899) + (r.next() > 0.5 ? "dn" : "n");

  /* Duty cycle is a MONTHLY maximum. The scenario is generated so the
     honest answer is sometimes "this model is not big enough", because
     a lab where the first option always fits teaches nothing. */
  const tooSmall = r.next() < 0.4;
  const dutyRated = tooSmall
    ? Math.round(job.volume * (0.4 + r.next() * 0.4) / 500) * 500
    : Math.round(job.volume * (1.6 + r.next() * 2.5) / 500) * 500;

  const said = r.shuffle(job.said.concat(r.some(NOISE, 2)));

  /* Deployment: one of these is wrong, and it is the one that would
     actually stop the job. */
  const ip = "192.168." + r.int(2, 40) + "." + r.int(20, 240);

  return {
    seed: seed, customer: customer, job: job, best: job.best, type: type,
    said: said, model: model, volume: job.volume, dutyRated: dutyRated,
    tooSmall: dutyRated < job.volume,
    brokenStep: brokenStep, laserish: laserish, ip: ip,
    /* Consumable maths for the lab tier. */
    tonerYield: r.pick([1500, 2500, 3000, 6000]),
    tonerCost: r.pick([48, 62, 79, 94]),

    /* THE THERMAL MACHINE, generated independently of the main job.

       Sites do not run one printer. A shop with a laser in the office
       has a thermal at the counter, and the label printer is the one
       that gets touched fifty times a day and cleaned never. Generating
       it separately means the thermal stage is a real second job rather
       than a stage that only appears when the dice chose thermal — which
       would leave three quarters of students never seeing 3.8's thermal
       half at all. */
    thermal: r.pick(THERMAL_FAULTS),
    thermalWhere: r.pick(["at the counter", "in the dispatch bay", "on the trade desk",
                          "in the stockroom", "behind reception"]),
    /* Where along the head the residue sits, in bench world units. Fed to
       both the debris and the void on the label so the two line up. */
    thermalAt: Math.round((r.next() * 9 - 4.5) * 10) / 10,
    thermalRoll: Math.round((0.25 + r.next() * 0.6) * 100) / 100,

    /* THE DOT MATRIX, generated independently for the same reason the
       thermal machine is: tie it to the main job and three quarters of
       students never meet impact maintenance at all. */
    impact: r.pick(IMPACT_FAULTS),
    impactWhere: r.pick(["in the despatch office", "on the goods-in desk", "in the workshop",
                         "at the parts counter", "in the loading bay"]),
    impactHeadAt: Math.round((r.next() * 12 - 6) * 10) / 10,

    /* THE INKJET, generated independently, same reasoning again. */
    inkjet: r.pick(INKJET_FAULTS),
    inkjetWhere: r.pick(["in the back office", "on the reception desk", "in the studio",
                         "in the site hut", "at the practice manager's desk"]),
    inkjetHeadAt: Math.round((r.next() * 12 - 7) * 10) / 10,
    inkjetGrimeAt: Math.round((r.next() * 12 - 6) * 10) / 10,

    /* A PART PART-WAY THROUGH ITS LIFE.

       Every other stage in this lab presents a part that has already
       failed. Real work is mostly the other thing: a part that still
       prints, but not for much longer. The rung matters more than the
       part here, because the rung is what decides whether you write it
       down, order one, or stop the machine today. */
    wearTech: (function () {
      const T = r.pick(WEAR_TECH);
      return { tech: T.tech, name: T.name,
               part: r.pick(T.parts.filter(function (P) { return P.wears; })) };
    })(),
    wearRung: r.pick([1, 2, 3]),
    wearPages: r.int(24, 186) * 1000,
    /* SOMEBODY GOT THERE BEFORE YOU.

       The owner's photograph and their note: office staff wind rubber
       bands round a roller that has stopped picking, to get through the
       afternoon until IT arrives. A technician who has never seen it does
       not know what they are looking at, and the bands are themselves the
       diagnosis — somebody already decided this roller does not grip, and
       they were right. Only on rollers, and only once they are worn
       enough for anybody to have bothered. */
    wearBodged: r.next() < 0.45
  };
}

/* ------------------------------------------------------------------
   Panels
   ------------------------------------------------------------------ */

function briefPanel(s) {
  return {
    kind: "brief",
    from: s.customer.who + " — " + s.customer.size,
    paragraphs: ["We need you to sort out " + s.job.what + "."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

/* The seven-step imaging view. Each frame is the drum surface and the
   sheet at that moment, so the student watches charge go on, the laser
   write, toner arrive, and the fuser melt it in. */
function imagingFrames(s) {
  const cols = [
    { name: "Drum", sub: "surface" },
    { name: "Toner", sub: "developer" },
    { name: "Paper", sub: "the sheet" }
  ];
  function f(caption, drum, toner, paper, tones, heads) {
    return {
      columns: heads || cols,
      caption: caption,
      rows: [[
        { label: drum, tone: tones[0] },
        { label: toner, tone: tones[1] },
        { label: paper, tone: tones[2] }
      ]]
    };
  }
  return [
    f("1 — PROCESSING. Nothing has moved yet. The formatter is building a bitmap of the whole page in memory. " +
      "If this step fails you get half a page or nonsense, and no amount of replacing rollers will help.",
      "idle", "—", "blank", [null, null, null]),
    f("2 — CHARGING. The primary charge roller lays an even negative charge across the entire drum. " +
      "Even is the important word: any bare patch will take toner it should not.",
      "−−−−−", "—", "blank", ["parity", null, null]),
    f("3 — EXPOSING. The laser discharges the spots where toner should go. The drum now holds an invisible " +
      "electrostatic image of the page.",
      "−−□□−", "—", "blank", ["parity", null, null]),
    f("4 — DEVELOPING. The developer roller offers toner to the drum. It sticks only to the discharged spots, " +
      "because the charged areas repel it.",
      "−−██−", "▓▓▓", "blank", ["parity", "data", null]),
    f("5 — TRANSFERRING. The transfer roller charges the paper from below and pulls the toner off the drum onto it. " +
      "At this moment the toner is only SITTING on the sheet — it is loose powder.",
      "−−░░−", "▓▓", "██", ["parity", "data", "data"]),
    f("6 — FUSING. Heat and pressure melt the toner into the paper fibres. This is the step that makes print permanent, " +
      "and the reason a failed fuser gives you print that rubs off on your fingers.",
      "−−░░−", "▓▓", "██", ["parity", "data", "rebuild"]),
    f("7 — CLEANING. The blade scrapes leftover toner and the lamp discharges the drum, so the next page starts clean. " +
      "Leftovers here come round again and print as a mark repeating at exactly the drum's circumference.",
      "clean", "▓▓", "██", [null, "data", "rebuild"])
  ];
}

function typeOptions(s) {
  const job = s.job;
  return Object.keys(TYPES).map(function (k) {
    const T = TYPES[k];
    let why;
    if (k === s.best) {
      why = T.good + " That is what this job asked for.";
    } else if (job.key === "forms" && !T.carbon) {
      why = T.name + " does not strike the paper, so it cannot print through a multi-part carbon form. " +
        "Only the top copy would come out.";
    } else if (job.key === "photo" && !T.photo) {
      why = T.name + " cannot do photographic colour well enough to judge a brochure by. " + T.bad;
    } else if (job.key === "till" && !T.receipt) {
      why = T.name + " needs consumables and space this counter does not have, and it is noisy in front of customers.";
    } else if (job.volume > T.duty) {
      why = T.name + " tops out around " + T.duty.toLocaleString() + " pages a month. They need " +
        job.volume.toLocaleString() + ".";
    } else if (T.cpp > TYPES[s.best].cpp * 2) {
      why = "At roughly " + T.cpp.toFixed(2) + " a page against " + TYPES[s.best].cpp.toFixed(2) +
        ", this costs them several times more per year for the same work. " + T.bad;
    } else {
      why = T.bad;
    }
    return { key: k, label: T.name, correct: k === s.best, why: why };
  }).concat(nearMissTypes(s));
}

/* TWO NEAR MISSES, TO MAKE SIX.

   The field is one right and five wrong, and every wrong one has to be a
   mistake somebody actually makes — filler options are answered by
   elimination without any thinking, which defeats the whole point of
   working by elimination.

   There are only four technologies in TYPES, so the extra two are real
   machines a buyer genuinely gets offered and genuinely gets wrong:

     DYE SUBLIMATION is the trap on the photo brief. It produces better
     photographic colour than anything else here, so it looks like the
     obvious answer the moment a brief says "quality matters" — and it
     is still wrong, because it prints onto its own coated stock at
     enormous cost per page and cannot do a plain-paper brochure run.

     THERMAL TRANSFER is the trap on the till brief, and the one worth
     teaching hardest: it is not a different family from thermal, it is
     the OTHER KIND of thermal. Direct thermal burns heat-sensitive
     paper and fades; thermal transfer melts a ribbon onto ordinary
     stock and lasts for years. Which one is right turns on whether the
     print has to survive — and that is a keyword hunt in the brief, not
     a fact to recall.

   Neither can ever be the correct answer, so the one-right rule holds
   however the scenario is generated. */
function nearMissTypes(s) {
  const job = s.job;
  return [
    { key: "dyesub", label: "Dye sublimation", correct: false,
      why: job.key === "photo"
        ? "Tempting, and the closest wrong answer on this brief: dye sublimation does beat " +
          "every option here on photographic colour. But it prints onto its own coated stock " +
          "at a cost per page in the pounds, not the pence, and it cannot run a brochure on " +
          "ordinary paper at all. Right quality, wrong machine for the work."
        : "Dye sublimation is a photo-print technology — its own coated media, very high cost " +
          "per page, and no use for " + job.what + ". Nothing in this brief asks " +
          "for photographic output."
    },
    { key: "thermaltx", label: "Thermal transfer (ribbon)", correct: false,
      why: job.key === "till"
        ? "The right family, the wrong half of it. Thermal transfer melts a ribbon onto " +
          "ordinary stock so the print lasts for years — which a till receipt does not need, " +
          "and it adds a consumable and a reload to a counter that wants neither. Direct " +
          "thermal is the receipt technology precisely because the paper is the only supply."
        : "Thermal transfer is for labels that have to survive — a ribbon melted onto ordinary " +
          "stock rather than heat-sensitive paper. It carries a consumable and a narrow media " +
          "path, and nothing in " + job.what + " calls for either."
    }
  ];
}

/* ------------------------------------------------------------------
   Stages
   ------------------------------------------------------------------ */
/* ---------------------------------------------------------------------
   The cutaway for the imaging stage.

   The step the generator broke is the one that lights red. Everything
   else is green, EXCEPT on a non-laser scenario, where the seven stations
   go idle and say so — a thermal printer has no drum and pretending it
   does would be teaching a fiction to make a model reusable.
   --------------------------------------------------------------------- */
/* BLIND MODE: the same machine, with nothing marked.

   The panel above lights the failing station red, which is right for the
   imaging stage \u2014 that stage walks the process and the fault is the
   worked example. It is exactly wrong for the DEFECT stage, where naming
   the failing part is the question: a red pip answers it before the
   student has run a single check.

   Same rule the display bench had to learn. A symptom drawn on a part is
   an answer given away, and the fix is not to hide the machine, it is to
   show the machine with the evidence still to be gathered. Every station
   reads "not checked" until the student checks it, which is the network
   bench's pattern and the honest one. */
/* What each station is FOR, keyed off the lab's own STEPS table so the
   blind bench cannot drift from the descriptions the rest of the lab
   teaches. Every station on it is unmarked, so its caption is the only
   thing a student has to reason from — it had better say something. */
const STEP_DOING = {};
STEPS.forEach(function (x) { STEP_DOING[x.key] = x.doing; });

function printerPanel(s, sheetAt, blind) {
  const laser = !!s.laserish;
  const broken = s.brokenStep && s.brokenStep.key;
  const states = {};
  BENCH_STEPS.forEach(function (st) {
    states[st.key] = !laser ? "idle"
      : (blind ? "unchecked" : (st.key === broken ? "faulty" : "ok"));
  });

  const view = {
    tech: laser ? "laser" : (s.best || "inkjet"),
    sheets: 11,
    sheetAt: sheetAt === undefined ? null : sheetAt,
    states: states
  };

  const DOING = {};
  BENCH_STEPS.forEach(function (st) { DOING[st.key] = ""; });
  if (s.brokenStep) DOING[s.brokenStep.key] = s.brokenStep.doing || "";

  return {
    kind: "bench",
    title: "The printer, cut open",
    intro: laser
      ? (blind
          ? "Paper in at the bottom left, out on the top. The seven pips are the seven steps in " +
            "the order they happen. Nothing is marked \u2014 the machine cannot tell you which " +
            "one is failing, and neither can looking at it. That is what the checks below are for."
          : "Paper in at the bottom left, out on the top. The seven pips are the seven steps, in " +
            "the order they happen \u2014 and one of them is not doing its job.")
      : "This is a laser mechanism, shown for comparison. The machine this customer needs is a " +
        (s.best || "different technology") + ", which has none of these stations \u2014 which " +
        "is exactly why its faults look nothing like a laser's.",
    height: 440,
    bench: {
      spec: function () { return printerBench(view); },
      status: function () {
        if (!laser) {
          return { words: "Not a laser", tone: "calm",
            detail: "The seven-step process belongs to laser printing. Nothing below applies to " +
              "this job's machine." };
        }
        if (blind) {
          return { words: "Nothing checked yet", tone: "calm",
            detail: "Seven stations, all of them still to be ruled in or out. Work from what the " +
              "page did, not from what usually goes wrong." };
        }
        return { words: "One step is failing", tone: "urgent",
          detail: s.brokenStep
            ? "The defect on the page is: " + (s.brokenStep.defect || "").toLowerCase()
            : "Find it from what the page looks like." };
      },
      controls: function () {
        return BENCH_STEPS.map(function (st) {
          return {
            key: st.key,
            label: st.n + ". " + st.label,
            state: states[st.key],
            stateWords: stepWords(states[st.key]),
            detail: blind
              ? (STEP_DOING[st.key] || "Part of the imaging process")
              : (DOING[st.key] || (laser ? "Part of the imaging process" : "Not used here"))
          };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* ---------------------------------------------------------------------
   THE MACHINE THEY ACTUALLY HAVE, for the defect stage.

   The defect panel always drew a laser cutaway, captioned "shown for
   comparison" on the four scenarios in ten whose job is not a laser.
   Honest, and the wrong picture: a student diagnosing a formatter fault
   on an inkjet was being shown a drum and a fuser the customer does not
   own, on the one stage in the core path that is supposed to put the
   machine in front of them.

   THE GENERATOR WAS ALREADY AHEAD OF IT. On every non-laser job the
   broken step is PROCESSING \u2014 the formatter \u2014 because that is the
   one station of the seven that every printer has, whatever technology
   it uses. So the right bench is the one for the machine in front of
   them, drawn HEALTHY: the whole lesson of a formatter fault is that
   every piece of mechanical evidence reads normal, and that cannot be
   taught on a machine they have not got.
   --------------------------------------------------------------------- */
function machinePanel(s) {
  if (s.laserish) return printerPanel(s, null, true);
  const tech = s.best === "thermal" || s.best === "impact" ? s.best : "inkjet";
  const parts = tech === "thermal" ? THERMAL_PARTS : tech === "impact" ? IMPACT_PARTS : INKJET_PARTS;
  const name = tech === "thermal" ? "thermal label printer"
             : tech === "impact" ? "dot matrix" : "inkjet";
  const build = tech === "thermal" ? thermalBench : tech === "impact" ? impactBench : inkjetBench;
  return {
    kind: "bench",
    title: "The " + name + ", opened up",
    intro: "This is their machine, not a laser. Nothing on it is marked, because nothing on it " +
      "looks wrong \u2014 which is itself worth noticing before you start taking things apart.",
    height: 440,
    bench: {
      spec: function () { return build({ states: {}, symptom: "none" }); },
      status: function () {
        return { words: "Nothing checked yet", tone: "calm",
          detail: "Every part reads normal to the eye. Run the checks and let them tell you " +
            "whether the fault is in the mechanism at all." };
      },
      controls: function () {
        return parts.map(function (P) {
          return { key: P.key, label: P.label, state: "idle",
                   stateWords: "not checked", detail: P.says };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* ---------------------------------------------------------------------
   THE SHELF, for the choose stage.

   That stage was six sentences under a customer's brief, on the one
   question in the lab whose answer IS a machine. The owner asked for
   students to work off the model, so the machines are here, to the same
   scale, each carrying the feature that decides it.

   NOTHING IS MARKED. The bench takes a `marked` argument and it is not
   passed: a shelf that points at the answer is a catalogue. All six
   options are on it, including the two near misses, because showing
   only the four real technologies would narrow a six-option question to
   four for free \u2014 the same leak as lighting the failing station on
   the defect bench.
   --------------------------------------------------------------------- */
function showroomPanel() {
  const b = showroomBench({});
  return {
    kind: "bench",
    title: b.title,
    intro: b.caption,
    height: 480,
    bench: {
      spec: function () { return b; },
      status: function () {
        return { words: "Six on the shelf", tone: "calm",
          detail: "Each one carries the feature that decides it. Read the brief, then find the " +
            "machine that has what the brief asked for." };
      },
      controls: function () {
        return SHOWROOM.map(function (m) {
          return { key: m.key, label: m.name, state: "idle",
                   stateWords: "on the shelf", detail: m.says };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

/* ---------------------------------------------------------------------
   THE LAST THREE STAGES OF THE CORE PATH THAT HAD NOTHING TO LOOK AT.

   brief, deploy and duty were a quote list, a settings table and two
   numbers. Each of them has a physical thing underneath it, and now
   shows it.
   --------------------------------------------------------------------- */
function sitePanel(s) {
  const site = SITES.filter(function (x) { return x.key === s.job.key; })[0] || SITES[0];
  return {
    kind: "bench",
    title: site.name,
    intro: "Before anybody has chosen a machine: the room it has to live in. What is already " +
      "on the surface, how much is left, and whether there is a data point on the wall.",
    height: 400,
    bench: {
      spec: function () { return siteBench({ place: s.job.key }); },
      status: function () {
        return { words: site.lan ? "Wired network available" : "No data point here",
          tone: "calm", detail: site.gap };
      },
      controls: function () {
        const out = [
          /* THE ROOM AND THE SPACE ARE TWO DIFFERENT FACTS, and this
             control used to repeat the other one's sentence word for
             word. What is already on the surface is what you are working
             around; what is LEFT is the number that decides the machine. */
          { key: "furniture", label: site.name, state: "idle", stateWords: "as found",
            detail: site.room },
          { key: "power", label: "Twin power socket", state: "ok", stateWords: "present",
            detail: "Everything has to reach this." },
          { key: "space", label: "The space left for the machine", state: "idle",
            stateWords: "measured", detail: site.gap }
        ];
        out.push({ key: "lan", label: "Network outlet on the wall",
          state: site.lan ? "ok" : "faulty",
          stateWords: site.lan ? "present" : "none on this wall",
          detail: site.lan
            ? "A wired network printer is possible here."
            : "Nothing to plug a network printer into. That is a constraint whether or not " +
              "anybody mentioned it." });
        return out;
      },
      onAction: function () { return {}; }
    }
  };
}

function rearPanel() {
  return {
    kind: "bench",
    title: "The back of it, and the wall behind",
    intro: "Three sockets on the machine and one plate on the wall. What you do first follows " +
      "from what is physically connected to what.",
    height: 400,
    bench: {
      spec: function () { return rearBench({}); },
      status: function () {
        return { words: "Cabled, not configured", tone: "calm",
          detail: "It has power and a link. Everything still wrong with it is a setting." };
      },
      controls: function () {
        return [
          { key: "usb", label: "USB-B socket", state: "idle", stateWords: "unused",
            detail: "One machine, one desk. No queue and nobody else can print to it." },
          { key: "rj45", label: "Ethernet socket", state: "ok", stateWords: "link up",
            detail: "What the whole site prints through. The lamps beside it say whether there " +
              "is a link before you go near an address." },
          { key: "iec", label: "Mains inlet", state: "ok", stateWords: "powered",
            detail: "The one people check last." },
          { key: "wall", label: "The wall data point", state: "ok", stateWords: "terminated",
            detail: "The other end of this is in a patch panel you cannot see from here." },
          { key: "patch", label: "The patch lead", state: "ok", stateWords: "connected",
            detail: "Printer to wall. Everything in the deployment happens after this exists." }
        ];
      },
      onAction: function () { return {}; }
    }
  };
}

function volumePanel(s) {
  return {
    kind: "bench",
    title: "The same two numbers, as paper",
    intro: "A duty cycle is a figure nobody has a feel for. Left is what they told you they " +
      "print in a month; right is what this machine is rated to survive.",
    height: 400,
    bench: {
      spec: function () { return volumeBench({ monthly: s.volume, rated: s.dutyRated }); },
      status: function () {
        return { words: "Two piles, one unit", tone: "calm",
          detail: "Both counted in reams of 500. Nothing here does the arithmetic for you." };
      },
      controls: function () {
        return [
          { key: "one", label: "One ream \u2014 500 sheets", state: "idle", stateWords: "the unit",
            detail: "Every block in both piles is one of these." },
          { key: "theirs", label: "What they print in a month", state: "idle",
            stateWords: s.volume.toLocaleString() + " pages",
            detail: Math.round(s.volume / 500) + " reams, every month." },
          { key: "rated", label: "What the machine is rated for", state: "idle",
            stateWords: s.dutyRated.toLocaleString() + " pages",
            detail: "The CEILING, not the target \u2014 the most it can do without damage." }
        ];
      },
      onAction: function () { return {}; }
    }
  };
}

function kitPanel() {
  return {
    kind: "bench",
    title: "What is in the box, and what is not",
    intro: "The maintenance kit is the WEARING parts, fitted on a page count. The toner and the " +
      "drum sit outside it because they are not in it \u2014 three parts, three schedules.",
    height: 400,
    bench: {
      spec: function () { return kitBench({}); },
      status: function () {
        return { words: "Three different schedules", tone: "calm",
          detail: "Toner runs out, the drum wears, the kit is fitted on a counter. Confusing the " +
            "three is the commonest mistake on this stage \u2014 and the most expensive." };
      },
      controls: function () {
        return [
          { key: "fuser", label: "Fuser assembly", state: "idle", stateWords: "in the kit",
            detail: "The biggest thing in the box, and the reason the kit exists." },
          { key: "transfer", label: "Transfer roller", state: "idle", stateWords: "in the kit",
            detail: "Ages at the same rate as the fuser, so it goes in with it." },
          { key: "rollers", label: "Feed and pickup rollers", state: "idle", stateWords: "in the kit",
            detail: "What the kit is really for \u2014 and what people replace one at a time instead." },
          { key: "pad", label: "Separation pad", state: "idle", stateWords: "in the kit",
            detail: "Wears at the same page count as the rollers it works against." },
          { key: "toner", label: "Toner cartridge", state: "faulty", stateWords: "NOT in the kit",
            detail: "A consumable. It runs out and gets changed when the print goes pale." },
          { key: "drum", label: "Drum unit", state: "faulty", stateWords: "NOT in the kit either",
            detail: "Its own life: several times a toner, and shorter than the machine." }
        ];
      },
      onAction: function () { return {}; }
    }
  };
}

function mfpPanel() {
  return {
    kind: "bench",
    title: "The machine, and what is lying in its tray",
    intro: "A shared multifunction on an open floor, with a finished job in the output tray and " +
      "nobody standing at it. That is the problem, drawn as it actually happens.",
    height: 400,
    bench: {
      spec: function () { return mfpBench({}); },
      status: function () {
        return { words: "A job nobody collected", tone: "urgent",
          detail: "It printed the moment it was sent. Everything after that is a matter of who " +
            "walks past." };
      },
      controls: function () {
        return [
          { key: "adf", label: "The document feeder", state: "ok", stateWords: "working",
            detail: "Scan to folder and scan to email both start here. Neither puts paper in " +
              "the tray." },
          { key: "panel", label: "The control panel", state: "idle", stateWords: "nobody at it",
            detail: "Where somebody would identify themselves, if anything required them to." },
          { key: "job", label: "Somebody's job, printed, in the tray", state: "faulty",
            stateWords: "sitting there", detail: "Face up, finished, and unattended." },
          { key: "net", label: "The network connection", state: "ok", stateWords: "in use",
            detail: "The job arrives whether or not the sender does." }
        ];
      },
      onAction: function () { return {}; }
    }
  };
}

function floorPanel() {
  return {
    kind: "bench",
    title: "The department, from above",
    intro: "Plan view, because what matters here is distance and grouping: four teams, their " +
      "desks, and the one machine at the end of the corridor.",
    height: 400,
    bench: {
      spec: function () { return floorBench({}); },
      status: function () {
        return { words: "One machine, four teams", tone: "calm",
          detail: "How many it needs is the arithmetic. Where they go is the other half, and the " +
            "walk is why nobody uses that one for a single page." };
      },
      controls: function () {
        return [
          { key: "g1", label: "Claims \u2014 8 desks", state: "idle", stateWords: "8 desks",
            detail: "The biggest group, and furthest from the machine." },
          { key: "g2", label: "Underwriting \u2014 6 desks", state: "idle", stateWords: "6 desks",
            detail: "Across the corridor from Claims." },
          { key: "g3", label: "Accounts \u2014 5 desks", state: "idle", stateWords: "5 desks",
            detail: "Prints less, but what it prints is confidential." },
          { key: "g4", label: "Reception and post \u2014 3 desks", state: "idle",
            stateWords: "3 desks", detail: "Small, and by the door." },
          { key: "current", label: "The one machine they have now", state: "faulty",
            stateWords: "serving all of it",
            detail: "At the end of the corridor, serving four teams on its own." }
        ];
      },
      onAction: function () { return {}; }
    }
  };
}

export function buildStage(key, s) {
  const T = s.type;

  if (key === "brief") {
    const job = s.job;
    return {
      title: "What are they actually asking for?",
      intro: "Customers describe the job, not the technology. Turn what they said into something you can choose against.",
      panels: [briefPanel(s), sitePanel(s)],
      questions: [{
        key: "pr-brief", kind: "multi",
        prompt: "Which of these are real constraints they gave you?",
        detail: "Some of this is the job. Some of it is conversation.",
        hints: [
          "Take the quotes one at a time and ask: could I test a finished printer against this? If not, it is chat.",
          "A constraint rules something OUT. Look for the sentences that would make one of the four technologies impossible."
        ],
        options: [
          { key: "carbon", label: "It has to print multi-part carbon forms", correct: job.key === "forms",
            why: job.key === "forms"
              ? "Yes — three copies, all legible, from one pass. That rules out everything that does not strike the paper."
              : "Nobody mentioned carbon forms. Do not invent a constraint that removes three of your four options." },
          { key: "photo", label: "Photographic colour quality matters", correct: job.key === "photo",
            why: job.key === "photo"
              ? "Yes — they said the colour has to be right, and that judging the brochure is the whole point."
              : "They did not ask for photographic colour. Adding it would push you toward the wrong technology." },
          { key: "quiet", label: "It has to be quiet and take almost no space", correct: job.key === "till",
            why: job.key === "till"
              ? "Yes — no room behind the counter, and customers are standing there."
              : "Nothing in the brief mentions noise or space as a problem." },
          { key: "vol", label: "It runs roughly " + job.volume.toLocaleString() + " pages a month", correct: true,
            why: "Yes. Volume is the constraint most often skipped, and it is the one that decides whether a machine survives the year." },
          { key: "audit", label: "It must be installed before the audit", correct: false,
            why: "A deadline. It does not change which technology fits." }
        ],
        explain: "Constraints rule options out. Preferences do not. Sort them before you look at a single model."
      }]
    };
  }

  if (key === "wear") {
    const TECH = WEAR_TECH.filter(function (t) { return t.tech === s.wearTech.tech; })[0];
    const W = s.wearTech.part;
    /* THE FIFTH RUNG, CHOSEN WITHOUT SPENDING ANY RANDOMNESS.

       wearRung is picked from [1,2,3] further up, and adding an r.next()
       here to decide "perished as well?" would shift every draw after it
       — changing the scenario every existing seed generates. So it is
       derived from a number the seed has already produced: a quarter of
       the page counts land on a multiple of four, and only the five
       rubber parts can reach it at all. Deterministic, reproducible, and
       it disturbs nothing that already works. */
    const perished = !!PERISHES[W.key] && (s.wearPages / 1000) % 4 === 0;
    const rung = perished ? PERISH_WEAR[W.key] : W.wear[s.wearRung];
    /* Bands only go on rollers, and only on one that is worn enough that
       somebody in the office had a reason to try. */
    const bodged = s.wearBodged && WEAR_SHAPE[W.key] === "roller" && s.wearRung >= 2 && !perished;

    return {
      title: "A part that has not failed yet",
      intro: "Every other stage here hands you something that has already stopped working. Most " +
        "of the job is the other thing: a machine that still prints, and a part that will not " +
        "last the quarter. Reading how far gone something is decides whether you write it down, " +
        "order one, or stop the machine today \u2014 and getting that wrong costs either an " +
        "emergency call-out or a part nobody needed.",
      panels: [{
        kind: "brief",
        from: "On site \u2014 " + s.customer.who + ", " + s.wearTech.name + ", " +
          s.wearPages.toLocaleString() + " pages on the counter",
        paragraphs: [
          "You have " + s.wearTech.name + " open on the bench.",
          "WHAT YOU CAN SEE ON THE PART: " + rung.look,
          "WHAT THE PAGES ARE DOING: " + rung.page
        ]
      }],
      questions: [
        {
          key: "wr-part", kind: "choice",
          prompt: "Which part are you looking at?",
          detail: "Go on the description, not on a guess about what usually breaks.",
          hints: [
            "Two clues, and they have to agree. What the part looks like narrows it; what the " +
              "page is doing confirms it.",
            "Ask what each part actually DOES, then ask which of those jobs would produce this " +
              "mark. A part that lays down charge cannot leave a mark that only appears after " +
              "heat.",
            "Rule out the ones whose failure looks nothing like this. If the page shows a mark " +
              "that repeats, you are looking for something round; if it shows a streak the " +
              "length of the sheet, you are looking for something fixed."
          ],
          /* Options are the parts of THIS machine, not of all four. Asking
             a student to pick a laser fuser out of a list containing a
             thermal platen is a reading test, not a diagnosis. */
          options: sixOf(TECH.parts.concat(WEAR_EXTRAS[TECH.tech] || []),
                         W.key, s.wearPages).map(function (x) {
            return {
              key: x.key, label: x.label,
              correct: x.key === W.key,
              why: x.key === W.key
                ? "Yes. " + x.doing + "."
                : x.doing + ". Nothing in that job produces what is described here."
            };
          }),
          explain: W.label + ": " + W.doing + "."
        },
        {
          key: "wr-rung", kind: "choice",
          prompt: "How far gone is it?",
          detail: "This is the question the customer is actually paying you to answer.",
          hints: [
            "Three states, and they are separated by what still WORKS, not by how bad it looks.",
            "If the pages are still acceptable to the person using them, it has not failed \u2014 " +
              "however unpleasant the part looks.",
            "The middle rung is the awkward one: the machine is still printing, but the defect " +
              "is now on every page rather than only when you go looking for it."
          ],
          options: [
            { key: "early", label: "Starting to show signs of wear", correct: s.wearRung === 1,
              why: s.wearRung === 1
                ? "Yes. It still prints acceptably. You have found this by looking, not because " +
                  "anybody complained."
                : "Past that. Somebody has already noticed, or would if they looked at a page " +
                  "properly." },
            { key: "worn", label: "Clearly worn, and the defect is on every page", correct: s.wearRung === 2,
              why: s.wearRung === 2
                ? "Yes. The machine still works and the output is no longer acceptable. That is " +
                  "the definition of this rung and it is the one people argue about."
                : (s.wearRung === 1
                    ? "Not yet. The pages are still usable and this has not reached the user."
                    : "Further than that. This one is not producing usable pages at all.") },
            { key: "failed", label: "Failed \u2014 it is not doing its job at all", correct: s.wearRung === 3,
              why: s.wearRung === 3
                ? "Yes. Whatever this part was for, it is no longer doing it."
                : "Not yet. It is still doing its job, just not well." }
          ,
            /* THREE MORE, AND ALL THREE ARE REAL ANSWERS A TECHNICIAN
               GIVES. The first is the reference part on the left of the
               bench; the second is deferring to a number instead of the
               evidence in your hand; the third is the right diagnosis for
               a different kind of part. */
            { key: "fresh", label: "It is essentially new \u2014 nothing here needs doing",
              correct: false,
              why: "There is a good one lying on the bench beside it for exactly this comparison. " +
                "Put the two side by side and this is not that. Judging wear without the " +
                "reference is the mistake the bench exists to stop." },
            { key: "unknowable", label: "Cannot be judged without the maker's page-count figure",
              correct: false,
              why: "A page count tells you what to EXPECT, not what is true. Two machines on the " +
                "same count wear completely differently on different paper in different rooms " +
                "\u2014 and you are holding the part, which beats any figure in a manual." },
            { key: "notwear", label: "This is not wear \u2014 it will turn out to be electronic",
              correct: false,
              why: "A real and useful distinction: some parts fail rather than wear, and calling " +
                "that right saves a wasted order. This is not one of them. What you are looking " +
                "at is material that has changed shape, which no board fault does." }
          ],
          explain: "Wear is a ladder, not a switch. Naming the rung is what turns a look into a " +
            "recommendation."
        },
        {
          key: "wr-see", kind: "pick",
          prompt: "Point at the damage. Which of these is the one out of the machine?",
          detail: "A good one is on the left, the one off the bench is on the right. Click " +
            "either the part in the picture or its button underneath.",
          height: 340,
          bench: {
            spec: function () {
              return wearBench({
                shape: WEAR_SHAPE[W.key] || "roller",
                rung: rung.level, label: W.label, look: rung.look,
                bodged: bodged
              });
            },
            status: function () {
              return { words: "One of these is worn", tone: "calm",
                detail: "Same part, same scale. The difference between them is the answer." };
            },
            controls: function () {
              return [
                { key: "good-body", label: "The one on the left", state: "unknown",
                  stateWords: "Not chosen", detail: "Green plate underneath it" },
                { key: "bad-body", label: "The one on the right", state: "unknown",
                  stateWords: "Not chosen", detail: "Coloured plate underneath it" }
              ];
            },
            onAction: function () { return {}; }
          },
          hints: [
            "Compare them rather than judging either on its own. That is the entire reason " +
              "there are two of them on the bench.",
            "Look for what is MISSING from one of them, not for what has been added to it. " +
              "Wear takes material away.",
            "The plate under each one is coloured. Green means the reference \u2014 the one " +
              "that is not the answer."
          ],
          options: [
            { key: "good-body", label: "The one on the left", correct: false,
              why: "That is the reference \u2014 a good one, kept on the bench so you have " +
                "something to judge the other against." },
            { key: "bad-body", label: "The one on the right", correct: true,
              why: "Yes. " + rung.look }
          ],
          explain: "Judging wear needs a reference. Keeping a good one on the bench is not " +
            "tidiness \u2014 it is the only way the difference is legible."
        },
        (bodged ? {
          key: "wr-bodge", kind: "choice",
          prompt: "Somebody has wound rubber bands round this roller. What does that tell you?",
          detail: "You have not tested anything yet. This is what you found.",
          hints: [
            "Ask why anybody would do it. Nobody winds bands round a roller that is working.",
            "It is a bodge, and bodges are evidence. Somebody on site already reached a " +
              "conclusion about this part before you arrived.",
            "Two of these treat the bands as the problem. They are not the problem \u2014 they " +
              "are somebody's answer to the problem."
          ],
          options: [
            { key: "grip", label: "Somebody found it had stopped picking paper, and they were right",
              correct: true,
              why: "Yes. Bands are what office staff wind round a roller that has gone smooth, " +
                "to get through the afternoon until IT arrives. It works, briefly. It also " +
                "means the diagnosis is already made for you: this roller does not grip." },
            { key: "harmless", label: "Nothing much \u2014 it is a harmless bit of improvisation",
              correct: false,
              why: "It is evidence, and it is not harmless. A band that works loose goes into " +
                "the paper path, and then you have a jam somewhere that makes no sense." },
            { key: "cause", label: "The bands are what is causing the fault",
              correct: false,
              why: "Backwards. The bands went on AFTER the fault, by somebody trying to fix it. " +
                "Treat them as a symptom of a worn roller, not the cause of one." },
            { key: "leave", label: "Leave them on \u2014 if it works, it works",
              correct: false,
              why: "No. They come off, the roller gets replaced, and the bands go in the bin " +
                "rather than into the machine. Leaving somebody's temporary bodge in place " +
                "makes it yours." }
          ,
            /* Two more, both of which a technician has actually said out
               loud on a customer site. */
            { key: "blame", label: "Whoever fitted them has damaged the roller",
              correct: false,
              why: "Rubber bands do not damage a roller \u2014 they are a symptom, not a cause. " +
                "Blaming the office for the bodge also loses you the one useful thing they have " +
                "told you: that it stopped picking paper some time ago." },
            { key: "more", label: "Wind a fresh band on and see how long it lasts",
              correct: false,
              why: "It will work, briefly, and that is the trap. You would be adopting somebody " +
                "else's temporary fix as your professional answer, and the next failure happens " +
                "when nobody is on site." }
          ],
          explain: "Bands on a roller are somebody's diagnosis, made before you got there. Take " +
            "them off, replace the roller properly, and make sure none of them have already " +
            "dropped into the paper path."
        } : null),
        {
          key: "wr-act", kind: "choice",
          prompt: "What do you do about it today?",
          detail: "The customer is standing there and the machine is still printing.",
          hints: [
            "Match the action to the rung, not to how alarming the part looked when you took it " +
              "out.",
            "One of these options is always defensible and always useless on its own: doing " +
              "nothing and saying nothing.",
            "Ask what happens tomorrow under each choice. If the answer is 'the same thing, and " +
              "they call again', it is the wrong choice."
          ],
          options: [
            { key: "note", label: "Write it down, tell them what to watch for, and leave it in service",
              correct: s.wearRung === 1,
              why: s.wearRung === 1
                ? "Yes. It still prints. You have bought them a planned replacement instead of " +
                  "an emergency one, which is the whole value of having spotted it."
                : "Not enough. The output is already unacceptable, and leaving it means they " +
                  "will ring back and pay twice." },
            { key: "order", label: "Order the part now and fit it at the next planned visit",
              correct: s.wearRung === 2,
              why: s.wearRung === 2
                ? "Yes. It is printing badly but it is printing. Order it, tell them what they " +
                  "will see in the meantime, and fit it without an emergency call-out."
                : (s.wearRung === 1
                    ? "Premature. Nothing is wrong with the pages yet, and you would be " +
                      "spending their money on a part with life left in it."
                    : "Too slow. Nothing usable is coming out of this machine now.") },
            { key: "now", label: "Replace it before you leave", correct: s.wearRung === 3,
              why: s.wearRung === 3
                ? "Yes. " + rung.act
                : "It is still working. Replacing a part that has life left in it is how a " +
                  "service contract loses money and a customer loses trust." },
            { key: "nothing", label: "Say nothing \u2014 it is still printing",
              correct: false,
              why: "Never. You looked, you saw something, and the customer is entitled to know. " +
                "A fault you noticed and did not mention becomes your fault the day it stops." }
          ,
            /* Two more, both of which sound responsible and neither of
               which is the judgement they are paying for. */
            { key: "strip", label: "Strip and clean the whole assembly before deciding",
              correct: false,
              why: "Cleaning is a good habit and a bad decision procedure. It changes what the " +
                "part LOOKS like without changing how much life is left in it \u2014 and now " +
                "you have destroyed the evidence you were about to judge it on." },
            { key: "quote", label: "Quote for a full service and let them decide",
              correct: false,
              why: "That hands your judgement back to somebody who has no way of making it. " +
                "They are paying you precisely to say whether this part sees the quarter out." }
          ],
          explain: rung.act
        }
      ].filter(Boolean)
    };
  }

  if (key === "inkjet") {
    const F = s.inkjet;
    const states = {};
    INKJET_PARTS.forEach(function (P) { states[P.key] = "unknown"; });

    return {
      title: "The inkjet " + s.inkjetWhere,
      intro: "An all-in-one, and the only one of the four that looks after its own print head: " +
        "it parks and caps the nozzles to stop them drying, wipes them, and fires them into a " +
        "felt-lined well to clear them. Most of what goes wrong here is about that upkeep " +
        "rather than about anything being broken.",
      panels: [{
        kind: "bench",
        title: "The inkjet, opened up",
        intro: "They said: \u201c" + F.said + "\u201d",
        height: 470,
        bench: {
          spec: function () {
            return inkjetBench({
              states: states, symptom: F.symptom, headAt: s.inkjetHeadAt,
              parked: F.parked, stripDirty: F.stripDirty,
              stripGrimeAt: s.inkjetGrimeAt, colourEmpty: F.colourEmpty
            });
          },
          status: function () {
            return { words: "Ask when, not just what", tone: "calm",
              detail: "Two of the things that can be wrong here make the same page. What " +
                "separates them is WHEN it happens, not what it looks like." };
          },
          controls: function () {
            return INKJET_PARTS.map(function (P) {
              return { key: P.key, label: P.label, state: states[P.key],
                       stateWords: inkjetWords(states[P.key]), detail: P.says };
            });
          },
          onAction: function () { return {}; }
        }
      }],
      questions: [
        {
          key: "ij-ask", kind: "choice",
          prompt: "What is the one question to ask the customer before touching anything?",
          detail: "The page in front of you does not settle this on its own.",
          hints: [
            "You are trying to separate two causes that look the same. So ask about something " +
              "that is NOT visible on the page.",
            "Ink dries when it is left open to the air. What would that make different about " +
              "the first page of the day compared with the fiftieth?",
            "Two of these questions are about the job and the machine's settings, which " +
              "cannot change whether ink has dried in a nozzle overnight. Put those aside."
          ],
          options: [
            { key: "when", label: "Is it bad on the first page after it has stood, or on every page?",
              correct: true,
              why: "Yes. Ink drying in open nozzles is a fault that heals itself after a page " +
                "or two and comes back every time the machine is left. A genuine clog does not " +
                "care how long it has been sitting. Nothing else you can ask separates those " +
                "two as cleanly." },
            { key: "driver", label: "Which driver version is installed?",
              correct: false,
              why: "A driver cannot leave evenly spaced gaps in solid colour, or streaks in " +
                "the direction the paper travelled. Software faults do not have a geometry." },
            { key: "paper", label: "What weight of paper are they using?",
              correct: false,
              why: "Worth knowing for feed problems and for smearing, but it does not decide " +
                "between anything on this bench today." },
            { key: "genuine", label: "Are they using genuine cartridges?",
              correct: false,
              why: "A fair question in general, and a favourite way to avoid diagnosing. It " +
                "does not separate the two causes actually in front of you." }
          ,
            /* Two more questions worth asking about something else. Both
               are sensible; neither can separate the causes in front of
               you, which is the whole test. */
            { key: "app", label: "Which application are they printing from?",
              correct: false,
              why: "Worth knowing for a layout or a colour-profile complaint. Ink that has dried " +
                "in a jet does it from every application on the machine, so the answer cannot " +
                "rule anything in or out here." },
            { key: "cable", label: "Have they tried a different USB cable?",
              correct: false,
              why: "A cable fault gives you no page at all, or a page of nonsense. It cannot give " +
                "you a clean, repeatable band missing from one colour \u2014 the symptom has " +
                "already cleared the part you would be testing." }
          ],
          explain: "The page tells you what. The customer tells you when. On this machine, " +
            "when is what narrows it."
        },
        {
          key: "ij-part", kind: "choice",
          prompt: "Which part is responsible?",
          detail: "Take the answer to the last question with you.",
          hints: [
            "Match the geometry first. Gaps ACROSS a colour block, doubling on alternate " +
              "lines, streaks ALONG the page and a colour missing entirely are four different " +
              "shapes of fault.",
            "The nozzles are part of the cartridge on this machine, so 'no colour at all' and " +
              "'gaps in the colour' come from the same assembly but not the same cause.",
            "If the page is banded, you are choosing between the nozzles themselves and the " +
              "thing whose job is to stop them drying. The customer already told you which."
          ],
          options: [
            { key: "nozzles", label: "The nozzle plate", correct: F.part === "nozzles",
              why: F.part === "nozzles"
                ? "Yes. Ink has dried in some of the jets, and it is there on every page " +
                  "regardless of how long the machine has stood."
                : F.symptom === "bands"
                  ? "This is exactly what a clog looks like, and it is the right first thought. " +
                    "But a clog is there all day, and this one is not."
                  : "Blocked jets leave evenly spaced gaps in solid colour. That is not the " +
                    "shape of this fault." },
            { key: "capping", label: "The service station", correct: F.part === "capping",
              why: F.part === "capping"
                ? "Yes. The pads are not sealing the nozzles when it parks, so the ink dries " +
                  "overnight and clears itself again once it starts running."
                : "The station caps, wipes and catches spit. When it fails, the giveaway is " +
                  "that the fault appears after the machine has been left standing." },
            { key: "strip", label: "The encoder strip", correct: F.part === "strip",
              why: F.part === "strip"
                ? "Yes. Ink mist over the bars and the carriage loses its place, so lines laid " +
                  "down in one direction no longer line up with lines laid down in the other."
                : "The strip decides WHERE ink lands, not whether it comes out. Nothing here " +
                  "is in the wrong place." },
            { key: "cartridge", label: "An ink cartridge", correct: F.part === "cartridge",
              why: F.part === "cartridge"
                ? "Yes. One of them is spent, which is why half the page is perfect and the " +
                  "other half has nothing on it at all."
                : "Both cartridges are delivering ink \u2014 there is colour on this page, even " +
                  "if it is wrong." },
            { key: "rollers", label: "The rollers and star wheels", correct: F.part === "rollers",
              why: F.part === "rollers"
                ? "Yes. They ride on the wet side of the page, and loaded with dried ink they " +
                  "drag lines down everything."
                : "The rollers touch the page after the ink has landed. They can smear it; " +
                  "they cannot change what was printed." }
                      ,
            { key: "belt", label: "The carriage drive belt", correct: false,
              why: "A slipping belt lands the ink in the wrong PLACE, so text comes out wavy, " +
                "doubled or misaligned. It cannot remove a colour from the page and it cannot " +
                "dry out a row of nozzles." }
          ],
          explain: F.why
        },
        {
          key: "ij-fix", kind: "choice",
          prompt: "What do you do?",
          detail: "One right answer. One of the others would keep this customer buying ink for " +
            "months without ever fixing anything.",
          hints: [
            "Match the fix to the part you named.",
            "One option treats a symptom that will come back tomorrow morning, every morning, " +
              "and costs a measurable amount of ink each time it runs.",
            "Of what is left, ask which are free and which cost the customer money. Prefer the " +
              "free one when it is the one that matches."
          ],
          options: [
            { key: "clean", label: "Run the cleaning cycle and print a nozzle check",
              correct: F.part === "nozzles",
              why: F.part === "nozzles"
                ? "Yes \u2014 and stop at two. Each cycle fires every jet at full force into the " +
                  "spittoon, so a fifth cycle has cost real ink and told you nothing new."
                : "This will appear to work, which is the trap. It clears the dried ink that " +
                  "has already formed and does nothing about why it formed, so the customer " +
                  "runs a cleaning cycle every morning and buys ink to pay for it." },
            { key: "station", label: "Clear the park position and clean the capping pads",
              correct: F.part === "capping",
              why: F.part === "capping"
                ? "Yes. Fix the sealing and the nightly drying stops, which is the only thing " +
                  "that ends the cycle of morning cleanings."
                : "The head is capping correctly on this machine." },
            { key: "wipestrip", label: "Wipe the encoder strip clean, then run alignment",
              correct: F.part === "strip",
              why: F.part === "strip"
                ? "Yes, and align afterwards \u2014 the carriage has been working from bad " +
                  "readings and needs to be retaught where things are."
                : "The strip is clean and the carriage knows where it is." },
            { key: "newcart", label: "Replace the spent cartridge and run alignment",
              correct: F.part === "cartridge",
              why: F.part === "cartridge"
                ? "Yes. And align afterwards, because a new cartridge sits slightly differently " +
                  "in the carriage and the registration has to be taught again."
                : "Both cartridges have ink in them. A new one is the customer's money spent " +
                  "on the wrong thing." },
            { key: "cleanroll", label: "Clean the feed rollers and the star wheels",
              correct: F.part === "rollers",
              why: F.part === "rollers"
                ? "Yes. They ride on wet ink by design, so they need cleaning as routine rather " +
                  "than as a repair."
                : "The paper path is clean and nothing is touching the page that should not be." }
                      ,
            /* The expensive answer that buys a diagnosis you already had
               for nothing. */
            { key: "newhead", label: "Replace the printhead", correct: false,
              why: "On this machine the nozzles are part of the cartridge, so fitting a new " +
                "cartridge already tests everything a new head would \u2014 at a fraction of " +
                "the price. Replacing the head here is paying for an answer you had for free." }
          ],
          explain: F.fix
        }
      ]
    };
  }

  if (key === "impact") {
    const F = s.impact;
    const states = {};
    IMPACT_PARTS.forEach(function (P) { states[P.key] = "unknown"; });

    return {
      title: "The dot matrix " + s.impactWhere,
      intro: "Still running because it is the only thing on site that can print a three-part " +
        "despatch note in one pass. Pins strike a ribbon, the ribbon marks the paper \u2014 " +
        "nothing here is heated, charged or sprayed, so everything that can be wrong is " +
        "mechanical and in front of you.",
      panels: [{
        kind: "bench",
        title: "The dot matrix, cover off",
        intro: "They said: \u201c" + F.said + "\u201d",
        height: 460,
        bench: {
          spec: function () {
            return impactBench({
              states: states, symptom: F.symptom, ribbonWorn: F.ribbonWorn,
              gapWide: F.gapWide, offPins: F.offPins, headAt: s.impactHeadAt
            });
          },
          status: function () {
            return { words: "Read the page first", tone: "calm",
              detail: "Two of the things that can be wrong here produce exactly the same page. " +
                "Looking harder will not separate them." };
          },
          controls: function () {
            return IMPACT_PARTS.map(function (P) {
              return { key: P.key, label: P.label, state: states[P.key],
                       stateWords: impactWords(states[P.key]), detail: P.says };
            });
          },
          onAction: function () { return {}; }
        }
      }],
      questions: [
        {
          key: "im-read", kind: "choice",
          prompt: "What does the page itself tell you, before you touch the machine?",
          detail: "Not the cause yet. Just what kind of fault this is.",
          hints: [
            "There are only three things a page can be wrong in: how DARK it is, what is " +
              "MISSING from it, and WHERE the marks landed.",
            "Uniform paleness is about striking force or ink. A gap in the letters is about a " +
              "wire. Marks in the wrong place is about feed.",
            "Rule out the two that plainly do not match. If every character is complete and " +
              "the lines are straight, nothing is missing and nothing has moved."
          ],
          options: [
            { key: "weak", label: "Everything is there, and all of it is too pale",
              correct: F.symptom === "faint",
              why: F.symptom === "faint"
                ? "Yes. Every wire is firing and every one of them is under-inking, which is " +
                  "either the ink or the force behind it."
                : "The density is not the problem on this page." },
            { key: "missing", label: "Something is missing from inside the characters",
              correct: F.symptom === "pinline",
              why: F.symptom === "pinline"
                ? "Yes. A horizontal gap at the same height in every character \u2014 one row " +
                  "of the dot matrix is simply never printed."
                : "The characters are complete. Nothing has been left out of them." },
            { key: "placed", label: "The marks are landing in the wrong place",
              correct: F.symptom === "skew",
              why: F.symptom === "skew"
                ? "Yes. Each line starts further across than the one above it, so the paper is " +
                  "moving when it should not be."
                : "The lines start where they should. The problem is with the marks, not their " +
                  "position." },
            { key: "twice", label: "It has been marked more than once, and smeared",
              correct: F.symptom === "smudge",
              why: F.symptom === "smudge"
                ? "Yes. Something is touching the paper that should only be striking it."
                : "There is no doubling or smearing on this page." },
            /* TWO NEAR MISSES BUILT ON THE HINT'S OWN THREE CATEGORIES —
               darkness, missing, position. Each of these is a real page
               fault that belongs to one of those three, so a student who
               has not looked carefully will find them entirely plausible;
               the discriminator is a detail on the page, not a category
               they can reason to from the outside. */
            { key: "fadeacross", label: "It starts dark at one edge and fades across the line",
              correct: false,
              why: "That is a real fault and it is about darkness, so it feels close. But it " +
                "describes a head that is closer to the platen at one end than the other, and " +
                "the page in front of you does not shade off across the line \\u2014 look at " +
                "where it is wrong, not just how." },
            { key: "spacing", label: "The characters are all correct but squashed together",
              correct: false,
              why: "Compressed spacing with perfect characters is a timing or a mode fault, not " +
                "a printing one \\u2014 and either way the letters here are not evenly formed " +
                "and correctly spaced, so that is not what this page is showing you." }
          ],
          explain: F.tell
        },
        {
          key: "im-part", kind: "choice",
          prompt: "Which part is responsible?",
          detail: "One of these is right. Be careful \u2014 more than one of them can produce " +
            "what you are looking at.",
          hints: [
            "If two parts can both produce this page, you cannot choose between them by " +
              "looking. Ask which one you could rule out with a single swap.",
            "The ribbon is a consumable and the gap lever is a setting. One of them costs " +
              "nothing to eliminate: fit a fresh ribbon and print again.",
            "Look at what came with the complaint. Blank carbon copies underneath a readable " +
              "top sheet is about striking force, not about ink \u2014 ink cannot be strong " +
              "on one sheet and absent on the next."
          ],
          options: [
            { key: "ribbon", label: "The ribbon cassette", correct: F.part === "ribbon",
              why: F.part === "ribbon"
                ? "Yes. It is spent \u2014 the loop has been round more times than it has ink for."
                : F.symptom === "faint"
                  ? "Reasonable, and wrong here. This page looks exactly like a worn ribbon, " +
                    "which is why a fresh one is the first thing to try \u2014 but it does not " +
                    "explain blank carbon copies underneath a readable top sheet."
                  : "A worn ribbon goes uniformly pale. It cannot do this." },
            { key: "head", label: "The print head", correct: F.part === "head",
              why: F.part === "head"
                ? "Yes. One of the nine wires has stopped firing, and it takes its row out of " +
                  "every character."
                : "A head fault removes part of every character or stops printing altogether. " +
                  "The characters here are complete." },
            { key: "gap", label: "The head gap lever", correct: F.part === "gap",
              why: F.part === "gap"
                ? (F.key === "gapwide"
                    ? "Yes. Set too wide, the pins arrive with less force \u2014 weak on the top " +
                      "sheet and nothing at all on the copies."
                    : "Yes. Set too close, the head drags instead of striking, which smears the " +
                      "print and chews the ribbon.")
                : "The gap changes how hard the pins land. It cannot move where a line starts, " +
                  "and it cannot take one row out of every character." },
            { key: "tractor", label: "The tractor sprockets", correct: F.part === "tractor",
              why: F.part === "tractor"
                ? "Yes. One edge of the paper is off its pins, so that side is being dragged by " +
                  "friction and creeps."
                : "The sprockets decide where the paper is, not what gets marked on it." },
            { key: "platen", label: "The platen", correct: F.part === "platen",
              why: "The platen is the surface being struck against. It is worth a look when " +
                "print quality is poor everywhere and nothing else explains it, but it is not " +
                "what is wrong here." }
                      ,
            /* The sixth: a real part of this machine whose failure looks
               nothing like this, and which a student who is matching
               words rather than mechanisms will happily choose. */
            { key: "belt", label: "The carriage drive belt", correct: false,
              why: "A stretched or slipping carriage belt varies the spacing along the line, so " +
                "characters bunch up or spread out. It has no bearing at all on how HARD the " +
                "wires strike \u2014 which is what decides whether the copies underneath get " +
                "marked." }
          ],
          explain: F.why
        },
        {
          key: "im-fix", kind: "choice",
          prompt: "What do you do about it?",
          detail: "One right answer. One of the others is the single most expensive wrong move " +
            "on this machine.",
          hints: [
            "Match the fix to the part. If you are not sure of the part yet, go back \u2014 " +
              "this is not the question to guess on.",
            "Two of these replace something. One of them replaces a part that is working " +
              "perfectly, and it is the most expensive part in the machine.",
            "Of what is left, one is a setting and one is reseating the media. Both are free. " +
              "Ask which one matches what the page is doing."
          ],
          options: [
            { key: "newribbon", label: "Fit a new ribbon cassette", correct: F.part === "ribbon",
              why: F.part === "ribbon"
                ? "Yes. It is a consumable and it is spent. Check the advance cog turns with " +
                  "the carriage while you are in there."
                : "Cheap and quick, and worth doing as a test \u2014 but it will not fix this, " +
                  "and the machine will come straight back." },
            { key: "newhead", label: "Replace the print head", correct: F.part === "head",
              why: F.part === "head"
                ? "Yes. A dead wire is not a field repair, and the head is designed to come " +
                  "off the carriage as a unit."
                : "This is the expensive one, and the head here is firing all nine wires " +
                  "correctly. Replacing it changes nothing and costs the customer real money." },
            { key: "setgap", label: "Set the head gap lever for the paper being used",
              correct: F.part === "gap",
              why: F.part === "gap"
                ? "Yes. It is a setting, not a fault \u2014 free to correct, and it wants " +
                  "setting again whenever the form thickness changes."
                : "The gap is already right for this paper." },
            { key: "reseat", label: "Reseat the fanfold on both sprockets and reset top of form",
              correct: F.part === "tractor",
              why: F.part === "tractor"
                ? "Yes. Both sides on their pins, both covers closed, then set top of form so " +
                  "the first line lands where it should."
                : "The paper is seated correctly on both sides." },
            { key: "oil", label: "Oil the platen and the carriage rail to free things up",
              correct: false,
              why: "No. Oil on the platen destroys its grip on the paper, and oil on the rail " +
                "collects paper dust into a paste that stiffens the carriage. Neither is a " +
                "maintenance step on this machine." }
                      ,
            /* The free fix everybody tries first, and why it does nothing
               on this technology. */
            { key: "darker", label: "Turn the print darkness up in the driver", correct: false,
              why: "Free, instant, and the first thing everyone reaches for. On an impact machine " +
                "that setting makes it print the line more than once rather than strike harder " +
                "\u2014 so it is slower, noisier, and the carbon copies underneath come out " +
                "exactly as blank as before." }
          ],
          explain: F.fix
        }
      ]
    };
  }

  if (key === "thermal") {
    const F = s.thermal;
    /* Everything starts unknown. A lamp goes green because the student
       tested that part, never because the scenario knows the answer. */
    const states = {};
    THERMAL_PARTS.forEach(function (P) { states[P.key] = "unknown"; });

    return {
      title: "The label printer " + s.thermalWhere,
      intro: "While you are on site, the thermal printer " + s.thermalWhere + " needs looking at. " +
        "There is no toner in this machine, no ink and no ribbon \u2014 the paper is the ink. " +
        "So whatever is wrong is one of four things: the head, the platen, the sensor, or the paper.",
      panels: [{
        kind: "bench",
        title: "The thermal mechanism, lid open",
        intro: "They said: \u201c" + F.said + "\u201d",
        height: 440,
        bench: {
          spec: function () {
            return thermalBench({
              states: states, symptom: F.symptom, debris: F.debris,
              debrisAt: s.thermalAt, latchOpen: F.latchOpen, rollLeft: s.thermalRoll
            });
          },
          status: function () {
            return { words: "Four things it could be", tone: "calm",
              detail: "Head, platen, sensor, paper. The label at the front is what came out." };
          },
          controls: function () {
            return THERMAL_PARTS.map(function (P) {
              return { key: P.key, label: P.label, state: states[P.key],
                       stateWords: partWords(states[P.key]), detail: P.says };
            });
          },
          onAction: function () { return {}; }
        }
      }],
      questions: [
        {
          key: "th-part", kind: "choice",
          prompt: "Which part is causing what came out of this machine?",
          detail: "Read the label first, then look at the mechanism behind it.",
          hints: [
            "Look at the label, not the machine. Is the print MISSING somewhere, or is it all " +
              "there but wrong?",
            "Missing print means something stopped heat reaching the paper. Distorted print " +
              "means the paper moved. Nothing at all means the paper never could develop.",
            "Rule out the two that cannot produce this symptom: a blocked sensor still prints " +
              "correctly on the labels it does feed, and a glazed platen leaves the image " +
              "complete but dragged. That leaves the head, its clamp, and the paper itself."
          ],
          options: [
            { key: "element", label: "The heating element", correct: F.part === "element",
              why: F.part === "element"
                ? "Yes. A gap this clean, in the same place on every label, is a narrow group of " +
                  "heaters that cannot reach the paper."
                : "A blocked or dead element gives a hard-edged gap with nothing in it. That is " +
                  "not what this label shows." },
            { key: "roll", label: "The paper roll", correct: F.part === "roll",
              why: F.part === "roll"
                ? "Yes. It feeds perfectly because mechanically nothing is wrong \u2014 the coated " +
                  "face is simply pointing the wrong way."
                : "The paper is loaded and feeding, and something did print. If the paper were the " +
                  "problem the label would be completely blank." },
            { key: "latch", label: "The head-lift lever", correct: F.part === "latch",
              why: F.part === "latch"
                ? "Yes. One lever up means the head touches hard at one end and barely at the " +
                  "other, so the print fades across rather than stopping."
                : "An unclamped head fades gradually across the label. This symptom does not fade." },
            { key: "sensor", label: "The media sensor", correct: F.part === "sensor",
              why: F.part === "sensor"
                ? "Yes. It prints fine \u2014 it just cannot find the gap between labels, so it feeds " +
                  "on looking for one and then reports no paper with a full roll fitted."
                : "The sensor decides WHERE to stop, not what gets printed. It cannot mark the " +
                  "label itself." },
            { key: "platen", label: "The platen roller", correct: F.part === "platen",
              why: F.part === "platen"
                ? "Yes. The platen is what pulls the paper. Glazed and slipping, the paper stalls " +
                  "and slides while the head is still firing."
                : "A slipping platen leaves the whole image present but dragged and skewed. " +
                  "Nothing here is distorted." },
            /* THE SIXTH IS THE ONE EVERYBODY REACHES FOR FIRST, and it is
               never the answer on this bench: the thing that is not the
               printer. Blaming the driver or the cable is the commonest
               real-world misdiagnosis on a thermal machine, precisely
               because the fix is easy and costs nothing to try — and a
               label that came out WITH MARKS ON IT has already proved
               the data arrived. That is the reasoning worth drilling. */
            { key: "driver", label: "The driver or the interface cable", correct: false,
              why: "The commonest first guess, and the label in front of you rules it out. " +
                "Something printed — so the job reached the machine, the head fired and the " +
                "paper moved. A driver or cable fault gives you nothing at all, or garbage " +
                "characters, not a clean symptom in the same place on every label." }
          ],
          explain: F.tell + ". " + F.why
        },
        {
          key: "th-prove", kind: "choice",
          prompt: "What single check proves it before you touch anything?",
          detail: "One test, and it has to rule out the alternatives rather than confirm your hunch.",
          hints: [
            "A good check makes two different answers give two different results. What would " +
              "look different if you were wrong?",
            "Most of these can be settled without a computer in the loop at all \u2014 which is " +
              "itself the point, because it rules out the driver, the cable and the till software " +
              "in one move."
          ],
          options: [
            { key: "self", label: "Print the printer's own test label from its feed button",
              correct: F.key === "debris",
              why: F.key === "debris"
                ? "Yes. If the fault is on the machine's OWN output, nothing outside the printer " +
                  "\u2014 driver, cable, till software \u2014 can be responsible."
                : "Worth doing, but it does not separate this fault from its neighbours. It will " +
                  "come out the same either way." },
            { key: "coin", label: "Scratch a corner of the paper briskly with a coin",
              correct: F.key === "backwards",
              why: F.key === "backwards"
                ? "Yes. Friction heat develops the coated face and only the coated face. If the " +
                  "side facing the head does not darken, the roll is in upside down."
                : "That tells you the paper is genuinely thermal and which face is coated. Here " +
                  "the paper is already printing, so that is not in doubt." },
            { key: "levers", label: "Look at both ends of the head and check each lever is down",
              correct: F.key === "latch",
              why: F.key === "latch"
                ? "Yes. Two levers, and one of them is standing up. It takes two seconds and it " +
                  "is the first thing to look at when one side prints and the other does not."
                : "Quick and harmless, but the clamp is not what produced this symptom." },
            { key: "calib", label: "Run the printer's media calibration with the roll fitted",
              correct: F.key === "sensor",
              why: F.key === "sensor"
                ? "Yes. Calibration is the printer telling you what it can and cannot see through " +
                  "the web, which is exactly what is in question."
                : "Calibration teaches the printer where the gaps are. It will not change what " +
                  "gets marked on the label." },
            { key: "turn", label: "Turn the platen by hand and watch whether the paper moves with it",
              correct: F.key === "platen",
              why: F.key === "platen"
                ? "Yes. If the roller turns and the paper does not go with it, the grip is gone, " +
                  "and that is exactly what distorted print means."
                : "A reasonable habit, but the paper is being pulled through correctly here." },
            /* The sixth: the check people actually run first, and the one
               that settles nothing. Swapping the computer changes the
               source of the data on a machine whose own test label has
               already shown the fault. Knowing WHY a check is worthless
               is worth as much as knowing which check is right. */
            { key: "othermachine", label: "Send the same label from a different computer",
              correct: false,
              why: "The instinct is right \u2014 rule out the source \u2014 but the machine has " +
                "already ruled it out for you. Its own test label, printed with no computer " +
                "involved at all, comes out with the same fault on it. Sending from somewhere " +
                "else tests a part of the chain you have proved innocent." }
          ],
          explain: F.proves
        },
        {
          key: "th-fix", kind: "choice",
          prompt: "What do you actually do to it?",
          detail: "One answer is right. Two of the others would make the machine worse.",
          hints: [
            "Match the fix to the part. If you have not decided which part yet, go back \u2014 " +
              "the fix is not where you work that out.",
            "Two of these are things a technician must NEVER do to a thermal head. Find those " +
              "first and put them aside.",
            "Of what is left, one is a repair to the right part and one is a repair to a part " +
              "that is working. The working part costs money and fixes nothing."
          ],
          options: [
            { key: "clean-el", label: "Clean the element with 99% isopropyl on a lint-free swab, and let it dry",
              correct: F.part === "element",
              why: F.part === "element"
                ? "Yes. Power off, let it cool, 99% isopropyl on a lint-free swab, dry fully, " +
                  "close and test. That is the whole job — and note the two words doing the " +
                  "work: SWAB, never a blade. The element carries a thin ceramic wear coat over " +
                  "the heaters, and a scratch through it is a white line for the rest of the " +
                  "machine's life, which looks exactly like the fault you were clearing."
                : "Cleaning the head is never wrong, but it will not fix this and the machine will " +
                  "come back." },
            { key: "flip", label: "Turn the roll over so the coated face runs against the head",
              correct: F.part === "roll",
              why: F.part === "roll"
                ? "Yes. Nothing is broken. The paper was in the wrong way round."
                : "The paper is already the right way up \u2014 print is appearing." },
            { key: "latch-both", label: "Close both head levers until they click, then reprint",
              correct: F.part === "latch",
              why: F.part === "latch"
                ? "Yes. Both, together. A head clamped at one end only is the whole fault."
                : "The head is already clamped down at both ends." },
            { key: "clean-sensor", label: "Clean the sensor window, then run media calibration",
              correct: F.part === "sensor",
              why: F.part === "sensor"
                ? "Yes \u2014 and calibrate afterwards, because a sensor that has just started " +
                  "seeing again still needs telling what it is looking at."
                : "The sensor is finding the gaps correctly. Cleaning it changes nothing here." },
            { key: "clean-platen", label: "Clean the platen with isopropyl, turning it by hand to reach all round",
              correct: F.part === "platen",
              why: F.part === "platen"
                ? "Yes. And if it stays glassy and hard after cleaning, it is worn out and wants " +
                  "replacing rather than cleaning again."
                : "The platen is gripping and feeding correctly." },
            { key: "wet", label: "Wipe it down with a 70% alcohol prep pad from the first aid kit",
              correct: false,
              why: "The other 30% of a prep pad is water, and water is the last thing you want " +
                "near exposed flex contacts. Head cleaning wants 99% isopropyl, which flashes " +
                "off dry." }
          ],
          explain: F.fix
        }
      ]
    };
  }

  if (key === "choose") {
    return {
      title: "Choose the technology",
      intro: "Six machines on the shelf, and every one of them is right for some job. Say which " +
        "job this is \u2014 and pick the machine, not the word.",
      panels: [briefPanel(s), showroomPanel()],
      questions: [{
        key: "pr-type", kind: "choice",
        prompt: "Which technology does this job call for?",
        hints: [
          "Start with whatever the brief makes IMPOSSIBLE. One sentence in there usually eliminates two or three outright.",
          "If more than one survives, the decider is volume against cost per page. A machine that fits the work but bankrupts them over a year is still the wrong machine."
        ],
        options: typeOptions(s),
        explain: T.good
      }]
    };
  }

  if (key === "deploy") {
    return {
      title: "Get it on the network",
      intro: "The " + s.model + " is out of its box and powered up. It has an address but nothing can print to it.",
      panels: [rearPanel(), {
        kind: "table", title: "What the printer's own configuration page says",
        columns: ["Setting", "Value"],
        rows: [
          { cells: ["IP address", s.ip] },
          { cells: ["Subnet mask", "255.255.255.0"] },
          { cells: ["Default gateway", "not set"], flag: "bad" },
          { cells: ["DHCP", "off — address set by hand"] },
          { cells: ["Raw port 9100", "listening"] },
          { cells: ["Driver on the workstations", "installed"] }
        ]
      }],
      questions: [{
        key: "pr-deploy", kind: "order",
        prompt: "Put the deployment steps in the order you would actually do them.",
        detail: "Click a step to add it, click it again in the list to take it back out.",
        hints: [
          "Think about what each step DEPENDS on. You cannot test a queue you have not created, and you cannot create a working queue to an address that is not reachable.",
          "Work from the network upwards: is it reachable, is it reserved so it stays reachable, then the queue, then the proof."
        ],
        steps: [
          { key: "gw", at: 1, label: "Set the default gateway so it is reachable from other subnets" },
          { key: "res", at: 2, label: "Reserve the address so DHCP never hands it to something else" },
          { key: "queue", at: 3, label: "Create the print queue pointing at that address on port 9100" },
          { key: "test", at: 4, label: "Print a test page from a workstation and check it arrives" },
          { key: "doc", at: 5, label: "Record the address and queue name where the next person will find them" }
        ],
        explain: "Reachable, then reserved, then the queue, then proof, then written down. " +
          "The gateway is first because everything after it depends on the printer being reachable at all."
      }]
    };
  }

  /* =====================================================================
     FIT — the Core 1 printer PBQ, brought onto the machine.

     The original is `Core-1-Sims/Printer Troubleshooting/PrinterPBQ.html`:
     five labels, four dropzones over a photograph, Submit, tick or cross.
     Its idea is sound and survives intact — the discriminating item is the
     ink cartridge, which is not a laser part at all, and a student who
     drops it anywhere has told you they are matching words to boxes rather
     than thinking about the technology.

     What is added is the rest of the printer types. The original has ONE
     wrong item; this has four, and every one of them is a real part off a
     real machine the student has already met on the choose stage — a
     thermal head, an impact ribbon, an inkjet cartridge, a dye ribbon
     cassette. That turns "spot the odd one out" into "know which
     technology each part belongs to", which is the actual objective, and
     it is why the choose stage has to come first.

     Six items for four stations, so two are left in the tray at the end.
     A tray that empties tells the student they have finished before they
     have thought about it. ===================================================================== */
  if (key === "callout") {
    const C = CALLOUTS[Math.floor(rng(s.seed + 41).next() * CALLOUTS.length)];
    return {
      title: "A service call, and it is probably not a part",
      intro: "The ticket is on your screen and the machine is in front of you. Read what they " +
        "said, read what changed, and read who it affects \u2014 then say what is wrong before " +
        "you say what you will do about it.",
      panels: [{
        kind: "bench", height: 340,
        bench: {
          spec: function () { return printerBench({ tech: "laser", sheets: 12, sheetAt: null }); },
          controls: function () {
            return [
              { key: "shell",   label: "The machine on site", state: "idle", stateWords: "powered, responsive" },
              { key: "tray",    label: "Paper tray",          state: "idle", stateWords: "loaded" },
              { key: "toner",   label: "Toner cartridge",     state: "idle", stateWords: "fitted" },
              { key: "drum",    label: "The imaging drum",    state: "idle", stateWords: "fitted" },
              { key: "rollers", label: "Feed and registration", state: "idle", stateWords: "fitted" },
              { key: "duplex",  label: "Rear duplex path",    state: "idle", stateWords: "fitted" }
            ];
          },
          onAction: function () { return {}; }
        }
      }, {
        kind: "note", title: "The ticket",
        paragraphs: [
          "REPORTED: " + C.reported,
          "WHAT CHANGED: " + C.changed,
          "SCOPE: " + C.scope
        ]
      }, {
        kind: "note", title: "How this job is judged",
        paragraphs: [
          "Verify, configure and inspect before you replace. A part swap that turns out to be " +
            "unnecessary costs the customer money and costs you the callout.",
          "But not never: sometimes the answer really is a part, and refusing to say so is its " +
            "own kind of wrong. What decides it is the evidence, not a rule of thumb."
        ]
      }],
      questions: [{
        key: "co-cause", kind: "choice",
        prompt: "What is most likely wrong?",
        detail: "Two of these are good diagnoses of this symptom in general. Only one survives " +
          "what changed and who it affects.",
        hints: [
          "Read the two lines under the report again. What changed, and how many people does it " +
            "affect? Between them they rule out most of this list without you knowing anything " +
            "about printers.",
          "Scope tells you WHERE the fault is. Something affecting every user is not on one " +
            "workstation; something affecting one tray is not the whole machine; something the " +
            "printer itself reports is not on the network.",
          "Of the ones still standing, ask which would produce exactly this symptom and not a " +
            "similar one. Pale is not blank; smeared is not garbled; two sheets is not none."
        ],
        options: sixOf(C.causes.map(function (o, i) {
          return { key: "c" + i, label: o.label, correct: o.correct, why: o.why };
        }), "c" + C.causes.map(function (o) { return o.correct; }).indexOf(true), s.seed + 3),
        explain: C.teaches
      }, {
        key: "co-action", kind: "choice",
        prompt: "What do you do about it?",
        detail: "The cheapest thing that would actually settle it, not the most thorough thing " +
          "you could justify.",
        hints: [
          "Undo what changed before you replace what did not. If something was installed, " +
            "opened, updated or refilled just before this started, that is where to go first.",
          "Ask what each of these costs \u2014 in money, in the machine being down, and in the " +
            "customer's confidence if it turns out not to have been the problem.",
          "A fix that stops the symptom without addressing the cause is a workaround. It will " +
            "be back, and you will have taught the customer to live with it."
        ],
        options: sixOf(C.actions.map(function (o, i) {
          return { key: "a" + i, label: o.label, correct: o.correct, why: o.why };
        }), "a" + C.actions.map(function (o) { return o.correct; }).indexOf(true), s.seed + 5),
        explain: C.teaches
      }]
    };
  }

  if (key === "fit") {
    /* Named, because the bench's spec and controls close over it to read
       the live placement state the runner hangs on it. */
    const FITQ = {
        key: "pr-fit", kind: "fit",
        prompt: "Hold a part, then click where it goes on the machine.",
        detail: "Two of these six do not belong on a laser printer at all. Leave those in the tray.",
        /* Both of these read `q.fitState`, which the runner hangs on the
           question so the bench can see what has been placed. The machine
           is drawn WITHOUT the parts still in the tray — a student asked
           to fit a toner cartridge should not be looking at one already
           sitting in the bay — and each station says what is in it. */
        bench: {
          spec: function () {
            const P = (FITQ.fitState && FITQ.fitState.placed) || {};
            return printerBench({ tech: "laser", sheets: 12, sheetAt: null,
              fitted: Object.keys(P).map(function (k) { return P[k]; }) });
          },
          controls: function () {
            const P = (FITQ.fitState && FITQ.fitState.placed) || {};
            const nameOf = function (stKey) {
              const it = FITQ.items.filter(function (x) { return x.key === P[stKey]; })[0];
              return it ? it.label + " fitted" : "empty";
            };
            const done = function (stKey) { return P[stKey] ? "ok" : "idle"; };
            return [
              { key: "toner",       label: "Toner cartridge bay",   state: done("toner"),   stateWords: nameOf("toner") },
              { key: "rollers",     label: "Feed and registration", state: done("rollers"), stateWords: nameOf("rollers") },
              { key: "step-fusing", label: "Fuser position",        state: done("step-fusing"), stateWords: nameOf("step-fusing") },
              { key: "duplex",      label: "Rear duplex path",      state: done("duplex"),  stateWords: nameOf("duplex") },
              { key: "drum",        label: "The imaging drum",      state: "idle", stateWords: "already fitted" },
              { key: "tray",        label: "Paper tray",            state: "idle", stateWords: "12 sheets" },
              { key: "shell",       label: "The printer",           state: "idle", stateWords: "cut away" }
            ];
          },
          onAction: function () { return {}; }
        },
        /* THE FUSER GOES AT THE FUSER POSITION, NOT AT THE DRUM.

           First cut pointed the fuser at "drum", because the drum was a
           station on the bench and a fuser position was not. That is the
           exact bug class this build keeps catching: a generated exercise
           whose own correct answer is wrong. A student who put the fuser
           where a fuser goes would have been told they were mistaken, and
           the lab would have taught them that the fusing station and the
           imaging drum are the same place. They are opposite ends of the
           process — the drum is where the image is made, the fuser is
           where it is made permanent, and everything between them is the
           transfer that only works because they are apart.

           The drum stays on the bench and stays clickable, listed as
           ALREADY FITTED. It is not a station with a gap in it, and a
           student who tries to put something there gets told so. */
        stations: [
          { key: "toner",       label: "toner bay" },
          { key: "rollers",     label: "feed rollers" },
          { key: "step-fusing", label: "fuser position" },
          { key: "duplex",      label: "rear duplex path" }
        ],
        hints: [
          "Two of the six are not laser parts. Work out which technology each one came off before you try to place any of them \u2014 you met all of those machines on the shelf.",
          "Every part that touches paper sits somewhere on the path in the order the paper meets it. A part that turns a sheet over cannot be upstream of the thing that printed on it."
        ],
        items: [
          { key: "toner", label: "Toner cartridge", sub: "dry powder, hopper and developer roller",
            station: "toner",
            why: "It hands toner to the drum at the developing station, so it has to sit against the drum.",
            no: "The toner cartridge feeds the drum. It goes where it can reach the drum surface." },
          { key: "fuser", label: "Fuser assembly", sub: "heated roller and pressure roller",
            station: "step-fusing",
            why: "Melts the toner into the paper after the image has transferred.",
            no: "The fuser is the LAST thing the paper meets. Nothing it does makes sense before the image is on the sheet." },
          { key: "rollers", label: "Pickup and registration rollers", sub: "rubber, and they glaze",
            station: "rollers",
            why: "They pull the sheet off the stack and square it up before it reaches the drum.",
            no: "These move paper before anything is printed on it. That is the very start of the path." },
          { key: "duplex", label: "Duplexer", sub: "rear path, turns the sheet over",
            station: "duplex",
            why: "Takes a printed sheet, turns it over and feeds it back for the second side.",
            no: "A duplexer turns a sheet that has ALREADY been printed on. It has to sit after the fuser, not before it." },
          { key: "ink", label: "Ink cartridge", sub: "liquid ink, printhead nozzles",
            station: null,
            no: "This is an INKJET part. A laser printer has no liquid ink anywhere in it \u2014 it fuses dry powder. Leave it in the tray." },
          { key: "ribbon", label: "Ribbon cartridge", sub: "inked fabric on two spools",
            station: null,
            no: "This is an IMPACT part. A ribbon gets struck by pins to mark the page; a laser never touches the paper with anything but heat and pressure. Leave it in the tray." }
        ],
        explain: "Four fitted, two left in the tray \u2014 and the two you left are the answer as " +
          "much as the four you fitted. Ink belongs to an inkjet and a ribbon to an impact " +
          "printer. A laser has no liquid ink and strikes nothing: it charges a drum, writes on " +
          "it with light, develops it with dry powder, transfers that to the sheet and fuses it " +
          "with heat. Knowing which parts CANNOT be on a machine is how you avoid ordering one."
    };
    return {
      title: "Put the parts where they belong",
      intro: "A laser printer, cut away down its length, and a tray of parts. Some of them " +
        "came off this machine. Some of them did not come off anything like it. Fit the ones " +
        "that belong \u2014 and leave the ones that do not.",
      panels: [{
        kind: "note", title: "Before you start",
        paragraphs: [
          "Every part in the tray is a real part off a real printer. That is not the question. " +
            "The question is which printer.",
          "Turn the machine round if you need to. Paper enters bottom left and leaves top right, " +
            "and every part that touches it has to be somewhere on that path \u2014 in the order " +
            "the paper meets it."
        ]
      }],
      questions: [FITQ]
    };
  }

  if (key === "defect") {
    /* WAS: the defect described in a panel, then pick the step. That
       tested recall of a table. Now the student RUNS THE DIAGNOSTICS —
       print a test page, look at the drum, check the fuser — and the
       pattern across the three is the diagnosis. No single reading
       gives it away, which is the point. */
    const st = s.brokenStep;
    const d = DIAGNOSTICS[st.key];
    const others = STEPS.filter(function (x) { return x.key !== st.key; });
    /* FIVE OTHER STEPS, NOT THREE. The conclusion of a probe is a
       single-answer question in everything but name \u2014 same act, same
       hint ladder, same six-option rule \u2014 and it sat at four for as
       long as the checker only looked at questions whose `kind` said
       "choice". */
    const wrong = rng(s.seed + 7).some(others, 5);
    return {
      title: "Work out what is wrong with it",
      intro: "It is deployed and printing badly. You have the machine in front of you — find out why.",
      panels: [machinePanel(s), {
        kind: "note", title: "What the user reported",
        paragraphs: [st.defect]
      }, {
        kind: "note", title: "Already ruled out",
        paragraphs: ["The driver is current, it does the same from three different workstations, " +
          "and another machine on the same queue prints the job correctly."]
      }],
      questions: [{
        key: "pr-defect", kind: "probe",
        instrument: "Bench diagnostics",
        prompt: "Run all three checks.",
        detail: "Click a check to run it.",
        hints: [
          "Run all three before concluding anything. Any one of them on its own is consistent with more than one fault.",
          "Ask how FAR the page got before it went wrong. A page that images correctly and then fails has a late-stage problem; a blank one failed early."
        ],
        points: [
          { key: "page", label: "Print the internal test page", sub: "bypasses the driver entirely",
            reading: d.page, expected: "clean, dense, permanent",
            bad: st.key !== "processing" },
          { key: "drum", label: "Open it and inspect the drum", sub: "charge, latent image, residue",
            reading: d.drum, expected: "evenly charged, image written, clean after the blade",
            bad: ["charging", "exposing", "developing", "transferring", "cleaning"].indexOf(st.key) >= 0 },
          { key: "fuser", label: "Check the fuser temperature", sub: "with the machine warmed up",
            reading: d.fuser, expected: "175 to 190 °C",
            bad: st.key === "fusing" }
        ],
        then: {
          kind: "choice",
          prompt: "Which step of the imaging process is failing?",
          hints: [
            "Look at which of the three checks came back abnormal, and which came back clean. The clean ones eliminate as much as the abnormal one confirms.",
            "The internal test page bypasses the driver and the formatter's job handling. If that page is also wrong, the fault is in the imaging hardware; if it is perfect, it is not."
          ],
          options: rng(s.seed + 11).shuffle([{ key: st.key, label: st.name, correct: true, why: st.why }]
            .concat(wrong.map(function (w) {
              return { key: w.key, label: w.name, correct: false,
                why: w.name + " is where " + w.doing.charAt(0).toLowerCase() + w.doing.slice(1).replace(/\.$/, "") +
                  ". Your checks would then have shown: " +
                  DIAGNOSTICS[w.key].page.charAt(0).toLowerCase() + DIAGNOSTICS[w.key].page.slice(1) };
            }))),
          explain: st.name + " — " + st.why + " The part to order is the " + st.part + "."
        }
      }]
    };
  }

  if (key === "duty") {
    return {
      title: "Will it survive the year?",
      intro: "Duty cycle is a monthly maximum, not a target. Running a machine near it is how you buy the same printer twice.",
      panels: [volumePanel(s), {
        kind: "table", title: "The model on the quote",
        columns: ["", ""],
        rows: [
          { cells: ["Model", s.model] },
          { cells: ["Rated monthly duty cycle", s.dutyRated.toLocaleString() + " pages"] },
          { cells: ["What they told you they print", s.volume.toLocaleString() + " pages a month"] }
        ]
      }],
      questions: [
        { key: "pr-annual", kind: "number",
          prompt: "How many pages a year is that, at the volume they described?",
          unit: "pages", answer: s.volume * 12, tolerance: 0,
          hints: [
            "The monthly figure is in the table above.",
            "A year is twelve months. This one is deliberately simple — the point is having the annual number in front of you before you judge the machine."
          ],
          explain: s.volume.toLocaleString() + " × 12 = " + (s.volume * 12).toLocaleString() + " pages a year." },
        { key: "pr-fit", kind: "choice",
          prompt: "Is the " + s.model + " the right size for this?",
          hints: [
            "Compare the two numbers in the table. Then think about what a rated maximum actually means for a machine running every day.",
            "A duty cycle is the most a machine can do without damage, not the amount it should do. Sizing to the ceiling leaves nothing for a busy month."
          ],
          options: [
            { key: "under", label: "No — their volume is above what it is rated for", correct: s.tooSmall,
              why: s.tooSmall
                ? "Right. " + s.volume.toLocaleString() + " a month against a " + s.dutyRated.toLocaleString() +
                  " rating. It will be worn out long before it is paid for."
                : "It is rated for " + s.dutyRated.toLocaleString() + " and they print " + s.volume.toLocaleString() +
                  ". It is comfortably inside." },
            { key: "ok", label: "Yes — their volume sits comfortably inside the rating", correct: !s.tooSmall,
              why: !s.tooSmall
                ? "Right. " + s.volume.toLocaleString() + " against " + s.dutyRated.toLocaleString() +
                  " leaves real headroom for a busy month."
                : "It is not. They need " + s.volume.toLocaleString() + " and it is rated for " +
                  s.dutyRated.toLocaleString() + " — they are over the ceiling before a busy month even starts." },
            { key: "exact", label: "It does not matter — duty cycle is marketing", correct: false,
              why: "It is a real engineering limit. Sustained running above it is how a machine that should last five years lasts eighteen months." },
            { key: "dpi", label: "Cannot say without knowing the print resolution", correct: false,
              why: "Resolution does not enter into duty cycle. Pages are pages." },
            /* TWO NEAR MISSES. Both are things technicians genuinely say,
               and both are wrong in a way worth naming: one confuses the
               RECOMMENDED monthly volume with the duty CEILING, and the
               other treats a rating as a warranty term rather than an
               engineering limit. */
            { key: "recommended", label: "Only if they stay under the recommended monthly volume, " +
                "which is lower than the duty cycle", correct: false,
              why: "This is the closest wrong answer, because the distinction is real: makers do " +
                "quote a recommended volume well below the duty ceiling. But the question asked " +
                "about the rating in the table, and the answer to THAT is a straight comparison " +
                "of " + s.volume.toLocaleString() + " against " + s.dutyRated.toLocaleString() +
                ". Do not answer a harder question than the one in front of you." },
            { key: "warranty", label: "Yes, as long as it is under warranty", correct: false,
              why: "A warranty replaces a machine that breaks; it does not stop one wearing out, " +
                "and running above the duty cycle is wear, not a fault. The claim would be " +
                "refused and they would still be without a printer." }
          ],
          explain: s.tooSmall
            ? "Undersized. Size to comfortably above the real volume, not to the rated ceiling."
            : "Correctly sized, with headroom. That headroom is the point." }
      ]
    };
  }

  if (key === "imaging") {
    return {
      title: "Walk a page through all seven steps",
      intro: "This is the process everybody memorises as a mnemonic and then cannot use. Watch it once and the defects start explaining themselves.",
      panels: [printerPanel(s, 0.45),
        { kind: "mech", title: "One sheet, seven steps", frames: imagingFrames(s) }],
      questions: [
        { key: "im-order", kind: "order",
          prompt: "Put the seven steps back in order.",
          hints: [
            "Step through the frames above again — the caption on each one is numbered.",
            "Follow the physics rather than the mnemonic. The drum has to be charged before anything can be written on it, and toner has to be on the paper before it can be melted into it."
          ],
          steps: STEPS.map(function (st) { return { key: st.key, at: st.at, label: st.name }; }),
          explain: "Processing, charging, exposing, developing, transferring, fusing, cleaning." },
        { key: "im-fuse", kind: "choice",
          prompt: "Print that rubs off on your fingers. Which step failed, and how do you know?",
          hints: [
            "Look at frame 6 again and ask what it is the only step that does.",
            "The image is perfect until it is touched. That tells you every step that BUILDS the image worked — so the failure is after all of them."
          ],
          options: [
            { key: "fusing", label: "Fusing — it is the only step that makes the toner permanent", correct: true,
              why: "Right. The image is correct, so everything up to transferring worked. Only the melting failed." },
            { key: "transferring", label: "Transferring — the toner never reached the paper properly", correct: false,
              why: "If transferring had failed the print would be faint or patchy. It is not — it is a good image that will not stay put." },
            { key: "developing", label: "Developing — not enough toner reached the drum", correct: false,
              why: "That gives faint, washed-out print. This print is dense and correct until you touch it." },
            { key: "cleaning", label: "Cleaning — leftover toner is coming off on your hands", correct: false,
              why: "A cleaning failure prints a repeating mark down the page. It does not stop the rest of the page fusing." },
            /* Two more of the seven steps, so the field is six. Both are
               steps that BUILD the image, and the whole discriminator is
               that the image is perfect — so naming either of them means
               not having read that word in the prompt. */
            { key: "charging", label: "Charging — the drum never took an even charge", correct: false,
              why: "That prints a uniformly grey or black page with no white anywhere. The page " +
                "here is correct in every way until a finger touches it." },
            { key: "exposing", label: "Exposing — the laser did not write the image cleanly", correct: false,
              why: "An exposing fault puts the wrong image on the page — lines, gaps, a blank " +
                "sheet. The image on this page is right. Only its permanence is wrong." }
          ],
          explain: "Smearing is the one defect that names its step outright. Fusing is the only step whose job is permanence." }
      ]
    };
  }

  if (key === "consum") {
    const perPage = s.tonerCost / s.tonerYield;
    const yearly = Math.round(perPage * s.volume * 12);
    return {
      title: "What it costs to run",
      intro: "The purchase price is the small number. This is the one that decides whether you chose well.",
      panels: [kitPanel(), {
        kind: "table", title: "Consumables for the " + s.model,
        columns: ["", ""],
        rows: [
          { cells: ["Toner cartridge yield", s.tonerYield.toLocaleString() + " pages"] },
          { cells: ["Cartridge price", "£" + s.tonerCost] },
          { cells: ["Their monthly volume", s.volume.toLocaleString() + " pages"] }
        ],
        note: "Yield figures are quoted at 5% page coverage — about a page of ordinary text."
      }],
      questions: [
        { key: "cn-cpp", kind: "number",
          prompt: "Toner cost per page, in pence?",
          unit: "pence", answer: Math.round(perPage * 100 * 100) / 100, tolerance: 0.15,
          hints: [
            "Price of a cartridge, divided by how many pages it lasts. Both figures are in the table.",
            "That gives you pounds per page. The question asks for pence, so there is one more step."
          ],
          explain: "£" + s.tonerCost + " ÷ " + s.tonerYield.toLocaleString() + " = £" + perPage.toFixed(4) +
            " ≈ " + (Math.round(perPage * 10000) / 100) + "p a page." },
        { key: "cn-year", kind: "number",
          prompt: "Toner cost for a year at their volume?",
          unit: "£", answer: yearly, tolerance: Math.max(2, yearly * 0.04),
          hints: [
            "You have the cost per page from the previous question. You need the number of pages in a year.",
            "Monthly volume × 12 gives the pages. Multiply that by what one page costs."
          ],
          explain: (s.volume * 12).toLocaleString() + " pages × £" + perPage.toFixed(4) + " ≈ £" + yearly.toLocaleString() +
            " a year in toner alone — often more than the machine cost." }
      ]
    };
  }

  if (key === "scanflow") {
    return {
      title: "Scan to folder, and secure release",
      intro: "The half of an MFD nobody configures properly, and the half that generates the support calls.",
      panels: [mfpPanel(), {
        kind: "note", title: "What they asked for",
        paragraphs: [
          "Scans should land in a shared folder on the file server, named by the person who scanned them.",
          "Printing must not come out until the person who sent it is standing at the machine — case notes were left in the tray twice last month."
        ]
      }],
      questions: [{
        key: "sf-secure", kind: "choice",
        prompt: "Which of these actually solves the paper-left-in-the-tray problem?",
        hints: [
          "Three of these make the problem less likely. Only one makes it impossible.",
          "Ask what happens if somebody sends a job and then gets distracted for an hour. Which option still keeps the paper out of the tray?"
        ],
        options: [
          { key: "hold", label: "Hold the job at the printer until the sender authenticates at the panel", correct: true,
            why: "Right — the paper is not printed at all until somebody is standing there. Nothing can be left because nothing comes out early." },
          { key: "banner", label: "Print a banner page with the sender's name on top of each job", correct: false,
            why: "That tells you whose confidential notes are lying in the tray. It does not stop them lying there." },
          { key: "tray", label: "Give each department its own output tray", correct: false,
            why: "Narrows who can pick it up by accident, but the paper is still sitting out unattended." },
          { key: "log", label: "Enable job logging so you can see who printed what", correct: false,
            why: "That is an audit trail after the fact. It does not prevent anything." },
          /* Two more near misses, and the first is the strongest wrong
             answer on the page: encryption is a real control that sounds
             like the security answer and addresses a completely different
             threat. The discriminator in the prompt is the word ACTUALLY
             — everything here helps, one thing solves. */
          { key: "encrypt", label: "Encrypt the print traffic between the workstations and the printer",
            correct: false,
            why: "Worth doing, and it protects the job in transit from anyone watching the " +
              "network. It does nothing whatsoever once the page is printed and sitting face " +
              "up in the tray, which is the problem in front of you. Right control, wrong " +
              "threat." },
          { key: "move", label: "Move the printer into a locked room only staff can enter",
            correct: false,
            why: "It shrinks who can wander past, which is why it feels like an answer. But the " +
              "people leaving the paper there and the people who should not read it are mostly " +
              "the same staff, so the confidential note is still lying in an open tray among " +
              "colleagues." }
        ],
        explain: "Secure print release holds the job in memory until the sender authenticates. It is the only option here that changes when the paper appears."
      }]
    };
  }

  if (key === "fleet") {
    const dept = Math.round(s.volume * 3.4);
    const perUnit = Math.max(s.dutyRated, 5000);
    const need = Math.ceil(dept / (perUnit * 0.6));
    return {
      title: "Size it for the whole department",
      intro: "One machine became three floors. The arithmetic is the same; the consequences of getting it wrong are bigger.",
      panels: [floorPanel(), {
        kind: "table", title: "The department",
        columns: ["", ""],
        rows: [
          { cells: ["Combined monthly volume", dept.toLocaleString() + " pages"] },
          { cells: ["Duty cycle per machine", perUnit.toLocaleString() + " pages a month"] },
          { cells: ["House rule", "run each machine at no more than 60% of its rated duty"] }
        ],
        note: "The 60% rule exists because a machine at its rated ceiling has nothing left for the month everybody prints the annual report."
      }],
      questions: [{
        key: "fl-count", kind: "number",
        prompt: "How many machines does the department need?",
        unit: "machines", answer: need, tolerance: 0,
        hints: [
          "Work out what one machine is allowed to do under the house rule before you divide anything.",
          "60% of the rated duty is the real per-machine figure. Divide the department's volume by that — and you cannot buy part of a printer, so round the way that keeps everybody printing."
        ],
        explain: "60% of " + perUnit.toLocaleString() + " = " + Math.round(perUnit * 0.6).toLocaleString() +
          " a machine. " + dept.toLocaleString() + " ÷ " + Math.round(perUnit * 0.6).toLocaleString() +
          " = " + (dept / (perUnit * 0.6)).toFixed(2) + ", rounded up to " + need + "."
      }]
    };
  }

  throw new Error("lab-printer: no stage \"" + key + "\"");
}

/* Lab-specific invariants — see the note in lab-raid.js for why these
   live with the lab rather than in the verifier. */
const PRINTER_STAGE_KEYS = (function () {
  const lab = labByKey("printer");
  if (!lab || !lab.stages || !lab.stages.length) {
    throw new Error("lab-printer: the printer lab is not in the labs.js registry, so its " +
      "stages cannot be checked. A stage that is not registered is not reachable.");
  }
  return lab.stages.map(function (s) { return s.key; });
})();

export function selfCheck(sc) {
  const bad = [];

  /* ---- EVERY STAGE SHOWS THE STUDENT SOMETHING -----------------------
     The owner's complaint about Quick, in their words: it "doesn't show
     a student a single one of the machines they now have". Five of the
     six core stages were a quote list, a settings table, a note and two
     numbers, and four more beyond them had nothing either.

     All thirteen do now, and it is a rule rather than a state of affairs
     somebody has to keep noticing. A stage counts if it mounts a bench
     panel OR asks a `pick` question \u2014 on the wear stage the model IS
     the question, so there is no panel to find. */
  /* DERIVED FROM THE REGISTRY, NOT TYPED OUT HERE.

     This was a hand-written list of thirteen stage keys, and it went stale
     the first time a stage was added: `fit` was registered in labs.js,
     built fine, ran fine — and every invariant below silently skipped it,
     including the one written specifically to catch a bug in it. Three
     planted defects all came back clean, which is the worst possible
     outcome for a check: not a failure, a false pass.

     The registry is the one place a stage has to be listed to exist at
     all, so read it. A stage that is in labs.js is now checked whether
     anybody remembered to add it here or not. */
  PRINTER_STAGE_KEYS.forEach(function (k) {
    const st = buildStage(k, sc);
    if (!st) { bad.push("core stage " + k + " built nothing"); return; }
    const hasPanel = (st.panels || []).some(function (p) { return p.kind === "bench"; });
    /* EVERY FIT ITEM'S CORRECT ANSWER MUST BE A STATION THAT EXISTS, AND
       EVERY STATION MUST BE A PART THAT IS ON THE BENCH.

       Written after shipping a fit stage that pointed the fuser at the
       imaging drum. The stage rendered, the bench mounted, all six chips
       appeared, every station was clickable and the whole suite passed —
       and a student who put the fuser where a fuser actually goes would
       have been told they were wrong. Nothing in this build catches a
       generated exercise whose own answer is incorrect except a check that
       goes and looks at both sides of it.

       It cannot know that "fusing" is the right home for a fuser — that is
       content, and content is read. What it CAN hold is that the two
       halves refer to the same things: no item may name a station that is
       not offered, no station may name a bench part that does not exist,
       and no two items may claim the same station. */
    (st.questions || []).filter(function (q) { return q.kind === "fit"; }).forEach(function (q) {
      var stKeys = {}, seen = {};
      (q.stations || []).forEach(function (x) { stKeys[x.key] = true; });
      /* ASKED OF THE FINISHED MACHINE, NOT THE EMPTY ONE.

         The fit bench draws only what has been fitted so far, which at the
         start is nothing — so asking it "is the toner bay a part on this
         bench?" while the bay is empty answers no, correctly, and fails a
         stage that is perfectly sound. The question this check is actually
         asking is whether a station is a real place on a COMPLETE printer,
         so it fills every station first and asks then.

         Found by the check failing on its own author's change, which is
         the only reason it is written this way rather than the obvious
         way. */
      var benchKeys = {};
      var save = q.fitState;
      var full = {};
      (q.items || []).forEach(function (it) { if (it.station) full[it.station] = it.key; });
      q.fitState = { placed: full };
      try {
        (q.bench.spec().parts || []).forEach(function (p) { benchKeys[p.key] = true; });
      } catch (e) {
        q.fitState = save;
        bad.push("stage " + k + ": the fit bench spec threw — " + e.message); return;
      }
      q.fitState = save;
      (q.stations || []).forEach(function (x) {
        if (!benchKeys[x.key]) {
          bad.push("stage " + k + ': station "' + x.key + '" is not a part on the bench, so ' +
            "clicking it can never register.");
        }
      });
      (q.items || []).forEach(function (it) {
        if (it.station === null || it.station === undefined) return;
        if (!stKeys[it.station]) {
          bad.push("stage " + k + ': item "' + it.key + '" belongs at station "' + it.station +
            '", which is not one of the stations offered — it can never be placed correctly.');
        }
        if (seen[it.station]) {
          bad.push("stage " + k + ': items "' + seen[it.station] + '" and "' + it.key +
            '" both claim station "' + it.station + '".');
        }
        seen[it.station] = it.key;
      });
      /* And at least one item that belongs nowhere, because "which parts
         are NOT on this machine" is the thing this exercise exists for. */
      if (!(q.items || []).some(function (it) { return it.station === null; })) {
        bad.push("stage " + k + ": a fit question with no item that belongs nowhere is a " +
          "matching drill. The parts that do not fit are the lesson.");
      }
    });

    /* `fit` counts for the same reason `pick` does: the model IS the
       question. The student answers by clicking a station on the machine,
       so there is no bench PANEL to find — looking for one would fail a
       stage that shows more of the printer than most panels do. */
    const hasPick = (st.questions || []).some(function (q) {
      return (q.kind === "pick" || q.kind === "fit") && q.bench;
    });
    if (!hasPanel && !hasPick) {
      bad.push("stage " + k + " has nothing to look at \u2014 every stage of this lab shows " +
        "the student something, and it is not allowed to go back to being a worksheet");
    }
  });

  /* ---- THE SHELF AND THE OPTIONS MUST BE THE SAME SIX ----------------
     The choose stage puts six machines on a shelf and offers six
     answers. If those two lists ever drift apart the stage breaks in one
     of two silent ways: a machine on the shelf that cannot be chosen, or
     an option with no machine behind it \u2014 and the second is worse,
     because the whole point of the shelf is that the answer is a thing
     you can look at.

     It also guards the leak the shelf was built to avoid. Drop the two
     near misses from the shelf and a six-option question quietly becomes
     a four-option one. */
  const chstage = buildStage("choose", sc);
  const shelf = (chstage.panels || []).filter(function (p) { return p.kind === "bench"; })[0];
  if (!shelf) {
    bad.push("the choose stage has no shelf \u2014 its answer is a machine, so it needs one");
  } else {
    const onShelf = shelf.bench.controls().map(function (c) { return c.key; }).sort();
    const offered = (chstage.questions[0].options || []).map(function (o) { return o.key; }).sort();
    if (onShelf.join("|") !== offered.join("|")) {
      bad.push("the shelf shows [" + onShelf.join(", ") + "] but the question offers [" +
        offered.join(", ") + "] \u2014 they have to be the same six");
    }
  }

  /* ---- THE DEFECT BENCH MUST NOT NAME THE FAULT ----------------------
     The defect stage asks the student to work out which of seven steps
     has failed, and it now shows the machine while they do it. The whole
     value of that depends on the bench staying SILENT: the same panel in
     its normal mode lights the failing station red, and one wrong
     argument would turn the hardest question in the core path into a
     matching exercise.

     This build has given an answer away through a picture before \u2014
     the display lab painted banding and dead pixels onto the panel's own
     face, which both hid them and blamed the wrong part. So it is
     asserted rather than remembered: nothing marked, and the broken
     step's name nowhere in the words. */
  const dstage = buildStage("defect", sc);
  const dbench = (dstage.panels || []).filter(function (p) { return p.kind === "bench"; })[0];
  if (!dbench) {
    bad.push("the defect stage has no bench \u2014 the core path is meant to show the machine");
  } else {
    const ctrls = dbench.bench.controls();
    const lit = ctrls.filter(function (c) { return c.state === "faulty"; });
    if (lit.length) {
      bad.push("the defect bench marks " + lit.length + " station(s) faulty, which answers the " +
        "question before the student runs a check");
    }
    const words = JSON.stringify(dbench.bench.status()) + " " + (dbench.intro || "");
    const name = sc.brokenStep && sc.brokenStep.name;
    if (name && words.toLowerCase().indexOf(name.toLowerCase()) !== -1) {
      bad.push("the defect bench names the failing step (" + name + ") in its own caption");
    }
    /* AND IT MUST BE THE MACHINE THEY ACTUALLY HAVE. Four scenarios in
       ten are not lasers, and those used to get a laser cutaway labelled
       "shown for comparison" \u2014 a drum and a fuser the customer does
       not own, on the one core stage whose job is to put the real
       machine in front of them. */
    const laserish = !!sc.laserish;
    const isLaser = /cut open/.test(dbench.title || "");
    if (laserish !== isLaser) {
      bad.push("the defect bench shows " + (isLaser ? "a laser" : "a non-laser machine") +
        " for a " + (laserish ? "laser" : sc.best) + " job");
    }
    /* AND IT MUST NOT TELL A LASER IT IS NOT A LASER.
       The blind mode set every station to "idle" so nothing would be
       marked, and inherited that state's WORDS along with its colour —
       so on a laser job all seven stations read "Not used by this
       technology". The data was well-formed and the sweep passed; only
       driving the page showed it. An unlit pip and an unused pip look
       identical, so the words are the entire difference. */
    if (laserish) {
      const wrong = ctrls.filter(function (c) { return /not used/i.test(c.stateWords || ""); });
      if (wrong.length) {
        bad.push("the defect bench tells a LASER job that " + wrong.length +
          " of its stations are \u201cnot used by this technology\u201d");
      }
      const mute = ctrls.filter(function (c) { return !c.detail || c.detail.length < 25; });
      if (mute.length) {
        if (!wrong.length) bad.push("the blind bench leaves " + mute.length + " station(s) with " +
          "no description \u2014 unmarked pips are all a student has to reason from");
      }
    }
  }

  /* ---- WEAR ---------------------------------------------------------
     A ladder is only teachable if every rung is distinguishable and the
     action changes between them. */
  const W = sc.wearTech && sc.wearTech.part;
  if (!W) bad.push("no wear part generated");
  else {
    if (!W.wears) bad.push("wear stage chose \"" + sc.wearTech.tech + "/" + W.key +
      "\", which does not wear");
    if (!W.wear || W.wear.length !== 4) {
      bad.push("part \"" + W.key + "\" has " + ((W.wear || []).length) + " wear rungs, not four");
    } else {
      W.wear.forEach(function (r, i) {
        if (!r.look || !r.page || !r.act) {
          bad.push("part \"" + W.key + "\" rung " + i + " is missing a look, a page or an action");
        }
      });
      /* No two rungs may read the same, or the stage asks a student to
         tell apart two identical descriptions. */
      const looks = W.wear.map(function (r) { return r.look; });
      if (new Set(looks).size !== looks.length) {
        bad.push("part \"" + W.key + "\" has two wear rungs that look identical");
      }
    }
    if (sc.wearRung < 1 || sc.wearRung > 3) {
      bad.push("wear stage is showing rung " + sc.wearRung + " — 'fresh' is not a fault");
    }
    const wst = buildStage("wear", sc);
    [["wr-part", W.key], ["wr-rung", null], ["wr-act", null]].forEach(function (pair) {
      const q = wst.questions.filter(function (x) { return x.key === pair[0]; })[0];
      if (!q) { bad.push("the wear stage has no " + pair[0] + " question"); return; }
      const right = (q.options || []).filter(function (o) { return o.correct; });
      if (right.length !== 1) {
        bad.push(pair[0] + " has " + right.length + " correct answers on " +
          sc.wearTech.tech + "/" + W.key + " rung " + sc.wearRung);
      }
      if (pair[1] && right.length === 1 && right[0].key !== pair[1]) {
        bad.push(pair[0] + " marks \"" + right[0].key + "\" but the part is \"" + pair[1] + "\"");
      }
    });
  }

  /* ---- THE INKJET -------------------------------------------------- */
  const J = sc.inkjet;
  if (!J) bad.push("no inkjet scenario generated");
  else {
    if (!INKJET_PARTS.some(function (P) { return P.key === J.part; })) {
      bad.push("inkjet fault \"" + J.key + "\" blames \"" + J.part +
        "\", which the bench does not draw");
    }
    const drawable = ["bands", "ghost", "nocolour", "smear"];
    if (drawable.indexOf(J.symptom) === -1) {
      bad.push("inkjet fault \"" + J.key + "\" draws symptom \"" + J.symptom +
        "\", which the bench cannot render or which leaves a clean page");
    }
    if (!!J.stripDirty !== (J.key === "strip")) {
      bad.push("inkjet fault \"" + J.key + "\" and its encoder strip disagree");
    }
    if (!!J.colourEmpty !== (J.key === "empty")) {
      bad.push("inkjet fault \"" + J.key + "\" and its cartridge level disagree");
    }

    /* THE CONFUSABLE PAIR, AGAIN LOAD-BEARING. A clog and a capping
       failure must keep making the same page, because the whole stage
       turns on separating them by WHEN rather than by looking. */
    const banded = INKJET_FAULTS.filter(function (f) { return f.symptom === "bands"; });
    if (banded.length < 2) {
      bad.push("only " + banded.length + " inkjet fault bands the page \u2014 the clog and the " +
        "capping failure are supposed to be indistinguishable on paper");
    }
    if (banded.length && !banded.some(function (f) { return f.part === "nozzles"; })) {
      bad.push("no banded fault blames the nozzles");
    }
    if (banded.length && !banded.some(function (f) { return f.part === "capping"; })) {
      bad.push("no banded fault blames the service station");
    }

    const jst = buildStage("inkjet", sc);
    [["ij-ask", null], ["ij-part", J.part], ["ij-fix", null]].forEach(function (pair) {
      const q = jst.questions.filter(function (x) { return x.key === pair[0]; })[0];
      if (!q) { bad.push("the inkjet stage has no " + pair[0] + " question"); return; }
      const right = (q.options || []).filter(function (o) { return o.correct; });
      if (right.length !== 1) {
        bad.push(pair[0] + " has " + right.length + " correct answers on inkjet fault \"" +
          J.key + "\"");
      }
      if (pair[1] && right.length === 1 && right[0].key !== pair[1]) {
        bad.push(pair[0] + " marks \"" + right[0].key + "\" but the fault blames \"" +
          pair[1] + "\"");
      }
    });
  }

  /* ---- THE DOT MATRIX ---------------------------------------------
     Facts about THIS fault table, so they live here. */
  const I = sc.impact;
  if (!I) bad.push("no impact scenario generated");
  else {
    if (!IMPACT_PARTS.some(function (P) { return P.key === I.part; })) {
      bad.push("impact fault \"" + I.key + "\" blames \"" + I.part +
        "\", which the bench does not draw");
    }
    const drawable = ["faint", "pinline", "skew", "smudge", "ok", "blank"];
    if (drawable.indexOf(I.symptom) === -1) {
      bad.push("impact fault \"" + I.key + "\" draws symptom \"" + I.symptom +
        "\", which the bench cannot render");
    }
    if (I.symptom === "ok" || I.symptom === "blank") {
      bad.push("impact fault \"" + I.key + "\" leaves a page with nothing wrong with it");
    }

    /* The bench flags and the fault have to agree, or the drawing shows a
       machine in a different state from the one being described. */
    if (!!I.ribbonWorn !== (I.key === "ribbon")) {
      bad.push("impact fault \"" + I.key + "\" and its ribbon condition disagree");
    }
    if (!!I.gapWide !== (I.key === "gapwide")) {
      bad.push("impact fault \"" + I.key + "\" and its gap lever disagree");
    }
    if (!!I.offPins !== (I.key === "offpins")) {
      bad.push("impact fault \"" + I.key + "\" and its paper seating disagree");
    }

    /* THE CONFUSABLE PAIR IS LOAD-BEARING.

       A worn ribbon and a gap set too wide must keep producing the SAME
       page, because the whole lesson is that the student cannot settle it
       by looking. If somebody "helpfully" gives one of them its own
       symptom, the stage still marks correctly and quietly stops teaching
       the thing it was built for. */
    const faints = IMPACT_FAULTS.filter(function (f) { return f.symptom === "faint"; });
    if (faints.length < 2) {
      bad.push("only " + faints.length + " impact fault produces a faint page — the worn " +
        "ribbon and the wide gap are supposed to be indistinguishable on paper");
    }
    if (faints.length && !faints.some(function (f) { return f.part === "ribbon"; })) {
      bad.push("no faint-page fault blames the ribbon");
    }
    if (faints.length && !faints.some(function (f) { return f.part === "gap"; })) {
      bad.push("no faint-page fault blames the gap lever");
    }

    /* All three questions markable, and each marking what the table says. */
    const ist = buildStage("impact", sc);
    [["im-read", null], ["im-part", I.part], ["im-fix", null]].forEach(function (pair) {
      const q = ist.questions.filter(function (x) { return x.key === pair[0]; })[0];
      if (!q) { bad.push("the impact stage has no " + pair[0] + " question"); return; }
      const right = (q.options || []).filter(function (o) { return o.correct; });
      if (right.length !== 1) {
        bad.push(pair[0] + " has " + right.length + " correct answers on impact fault \"" +
          I.key + "\"");
      }
      if (pair[1] && right.length === 1 && right[0].key !== pair[1]) {
        bad.push(pair[0] + " marks \"" + right[0].key + "\" but the fault blames \"" +
          pair[1] + "\"");
      }
    });
  }

  /* ---- THE THERMAL MACHINE ----------------------------------------
     These live here rather than in the shared verifier because they are
     facts about THIS fault table. A shared checker that reached in here
     would break the moment a second thermal table existed. */
  const F = sc.thermal;
  if (!F) bad.push("no thermal scenario generated");
  else {
    /* The part it blames has to be a part the bench actually draws, or
       the lamp the student is looking for does not exist. */
    if (!THERMAL_PARTS.some(function (P) { return P.key === F.part; })) {
      bad.push("thermal fault \"" + F.key + "\" blames \"" + F.part +
        "\", which the bench does not draw");
    }

    /* THE SYMPTOM HAS TO BE ON THE BENCH.
       Same rule the display bench had to learn the hard way: a fault
       whose label comes out looking perfect asks the student to diagnose
       something they cannot see. "text" is allowed only for the sensor,
       whose whole point is that the printing IS correct and the fault is
       in where it stops. */
    const seen = ["void", "blank", "edge", "smear", "text"];
    if (seen.indexOf(F.symptom) === -1) {
      bad.push("thermal fault \"" + F.key + "\" draws symptom \"" + F.symptom +
        "\", which the bench cannot render");
    }
    if (F.symptom === "text" && F.part !== "sensor") {
      bad.push("thermal fault \"" + F.key + "\" prints a perfect label but blames " +
        F.part + ", so the student is asked to diagnose a symptom that is not there");
    }

    /* A void on the label with no residue on the head is an unanswerable
       question: the gap is visible and its cause is not. The two are
       drawn from the same figure, so they must be declared together. */
    if (F.symptom === "void" && !F.debris) {
      bad.push("thermal fault \"" + F.key + "\" shows a white line on the label with " +
        "nothing on the element to explain it");
    }
    if (F.debris && F.part !== "element") {
      bad.push("thermal fault \"" + F.key + "\" puts residue on the element but blames " +
        F.part + ", which points the student at the wrong part");
    }
    /* The lever only stands up on the fault that is about the lever. */
    if (F.latchOpen !== (F.part === "latch")) {
      bad.push("thermal fault \"" + F.key + "\" and its head lever disagree");
    }

    /* All three questions must be markable, and each must mark the part
       the fault actually names. */
    const st = buildStage("thermal", sc);
    ["th-part", "th-prove", "th-fix"].forEach(function (qk) {
      const q = st.questions.filter(function (x) { return x.key === qk; })[0];
      if (!q) { bad.push("the thermal stage has no " + qk + " question"); return; }
      const right = (q.options || []).filter(function (o) { return o.correct; });
      if (right.length !== 1) {
        bad.push(qk + " has " + right.length + " correct answers on thermal fault \"" +
          F.key + "\"");
      }
    });
    /* And the part question must mark the part the table blames — not
       merely SOME part. This is the one that catches a fault added to the
       table without a matching option. */
    const qp = buildStage("thermal", sc).questions.filter(function (x) {
      return x.key === "th-part";
    })[0];
    const marked = qp && (qp.options || []).filter(function (o) { return o.correct; })[0];
    if (marked && marked.key !== F.part) {
      bad.push("th-part marks \"" + marked.key + "\" but the fault blames \"" + F.part + "\"");
    }
  }

  const T = TYPES[sc.best];
  if (!T) return ["best type \"" + sc.best + "\" is not in the table"];
  /* The technology the brief points at must actually be able to do the
     job. A scenario that asks for carbon forms and answers "laser" is
     unanswerable, and would only appear on the seeds that made it. */
  if (sc.job.key === "forms" && !T.carbon) bad.push("carbon-form job answered with a technology that cannot strike paper");
  if (sc.job.key === "photo" && !T.photo) bad.push("photo job answered with a technology that cannot do photographic colour");
  if (sc.job.key === "till" && !T.receipt) bad.push("receipt job answered with a technology unsuited to a counter");
  if (sc.volume > T.duty) bad.push("volume " + sc.volume + " exceeds the chosen technology's duty of " + T.duty);
  /* The defect must come from a step that exists, and non-laser jobs
     must not be handed a drum-specific defect. */
  if (!STEPS.some(function (x) { return x.key === sc.brokenStep.key; })) bad.push("broken step is not in the process table");
  if (!sc.laserish && sc.brokenStep.key !== "processing")
    bad.push("non-laser job given the drum-specific defect \"" + sc.brokenStep.key + "\"");
  if (sc.tooSmall !== (sc.dutyRated < sc.volume)) bad.push("tooSmall flag disagrees with the numbers");
  if (sc.tonerYield <= 0 || sc.tonerCost <= 0) bad.push("consumable figures are not positive");
  return bad;
}

export function variantKey(sc) { return sc.best + "/" + sc.job.key; }
