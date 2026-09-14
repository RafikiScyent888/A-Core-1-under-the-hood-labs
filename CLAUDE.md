# A+ Core1 Under the Hood Labs

**Official name, set by the owner: "A+ Core1 Under the Hood labs".**
Use it verbatim in the page title, the heading, and anywhere the site is
linked from. Not "Core 1 Labs", not "Under the Hood" on its own.

Read this first in any session touching this repo.

Live URL: https://rafikiscyent888.github.io/A-Core-1-under-the-hood-labs/
Repo: `A-Core-1-under-the-hood-labs`

## How to deliver work

**Never push to GitHub. Deliver finished work as a zip file.** The owner
uploads everything themselves. Commit locally so the history and messages are
there, zip the repo excluding `.git`, and say which files actually changed —
separating what the site needs to run from documentation and tooling. One zip
per repo. Never run `git push`, and don't offer to or ask for credentials.

## What this is, and what it is NOT

Eight large generated labs for CompTIA A+ 220-1201, built from the ideas in the
`Core-1-Sims` repo but sharing no code with it.

**`Core-1-Sims` is not touched, not merged, not retired.** It stays live
exactly as it is. It runs ALONGSIDE this build and both are shipped.

**AND EVERY SIM GETS A 3D EQUIVALENT HERE, OVERLAP OR NOT.** The owner's
words: "Everyone learns differently. Some students may learn best by using the
sims and some students might need to use this 3D model." The sims are the
statement of what to cover; this is the same material with the machine in front
of the student.

That makes COVERAGE THE WRONG TEST for whether to build something. The RAID
Troubleshooting Challenge was skipped once on the grounds that the `fail` stage
already tested the same objective and a second stage would teach nothing new —
correct if the goal is exam coverage, wrong here. Two routes to one objective is
the deliverable, not a duplication to be pruned. `fail` hands the student an
INSTRUMENT; `logs` hands them the MACHINE. A student who bounces off one may
get it from the other.

Where two stages do overlap, make them disagree somewhere real. `populate` and
`logs` both deal in drive capacity and reach opposite conclusions about a larger
drive — waste when you are specifying, correct when you are recovering — and
that contradiction is the thing worth learning.

**This is not a second Field Service Center.** The FSC is diagnostic: a ticket
arrives, you find the fault, order the part, prove the repair. That already
covers RAID, power, printers, wireless and mobile, so a lab that just presents
a fault to diagnose would be paying twice for coverage that exists.

Under the Hood is **mechanism-led, consequence-graded, and project-scale**:

1. **Mechanism is the spine.** The lab shows the internals — what the RAID
   controller is doing during a rebuild, where the RF actually goes, what the
   fuser does to toner. The student sees *why*, not just *what*.
2. **Consequence is how it is graded.** Choices are lived with rather than
   marked. An undersized PSU browns out under load. A bad build fails to POST
   and the student diagnoses their own mistake. RAID 5 dies on the second
   failure during a rebuild.
3. **Project scale.** Each lab is a job — spec, build, configure, test, hand
   over — not a service call.

## The four things students are losing marks on

The owner named all four. Every lab must attack all four, and this is the
acceptance test for any new content:

| Gap | How a lab addresses it |
|---|---|
| **PBQs** — freeze on hands-on tasks | Everything is done, not chosen from a list |
| **Fundamentals** — memorised without the why | The mechanism view is the point of the build |
| **Calculation under pressure** | Capacity, wattage, VA and runtime are graded steps |
| **Reading the scenario** | Requirements are buried in customer waffle on purpose |

That last one is a **design target, not an accident**. Customer briefs contain
irrelevant detail with the real spec inside it, and the hint ladder teaches
students to find it rather than handing it over.

## Students use these ALONE, as homework

No instructor is present to unstick anybody. Every lab teaches itself:

- **Hints after three wrong attempts, escalating, never giving the answer.**
  Guide them to it. This is a standing rule across the whole program.
- **Wrong choices explain themselves** — a refused connector says why it is
  refused, not just "no".
- Progress is remembered in the browser so a long lab survives a closed tab.

## Every lab runs at FOUR lengths

The student picks from a dropdown before starting. This is architectural, not
a setting bolted on afterwards — **author every lab as a tiered stage list**:

| Choice | Stages included | Target |
|---|---|---|
| **Quick** | `core` only | 10-20 min, repeatable |
| **Lab** | `core` + `lab` | 30-45 min, a class period |
| **Project** | `core` + `lab` + `project` | 60+ min, resumable |
| **Layered** | `core`, with the rest offered inline as optional depth | Student-driven |

The rule that makes this work: **the `core` path must be a complete, coherent
experience on its own.** Longer choices add stages; they never unlock a
conclusion the short path was missing. If Quick feels like a truncated Project,
the tiering is wrong.

## The eight labs

Tabs across the top; the student picks which to do.

| Lab | Covers |
|---|---|
| **Printer** | Laser, inkjet, thermal AND impact — all four are on the exam and all four now have their own bench and maintenance stage, three of them built from the owner's photographs and teardowns of real machines. Laser gets the seven-step imaging process animated. Thermal, impact and inkjet each cover their own share of 3.8, none of which existed before. Twelve stages: this is the largest lab in the build. |
| **Workstation Build** | Gaming, CAD/CAM and virtualization host. NOT NAS or thin client — the owner chose these three. A bad build fails at POST and is diagnosed by the student. |
| **RAID** | 0, 1, 5, 6, 10, JBOD, hot spare. Capacity and fault tolerance as graded calculations. A live rebuild to nurse, including a second failure during it. |
| **Power** | All four of: budget the load then live with it, cable the build for real, UPS and protection sizing, measure and test. |
| **WAP** | At least six interferences. **Microwave is required** — the owner asked for it by name. |
| **Device & Mobile** | Phones and tablets as the core. Laptops appear ONLY for mobile-specific faults the FSC does not cover (swollen cells, digitizers, sync, MDM) — never general laptop repair, which is the FSC's job. |
| **Networking & Infrastructure** | 2.1, 2.3, 2.5, 2.7, 2.8, 4.1, 4.2 and 5.5 — the eight objectives that had nothing at all. Mostly recall, delivered as a job: you do not memorise 3389, you open it because remote desktop is blocked. |
| **Display** | 3.1, 1.2 and 5.3. The torch test is the spine — a dark panel and a dead backlight are identical from the front, different parts, and very different money. |

### Objective coverage is machine-checked, not remembered

`OBJECTIVES` in `assets/labs.js` holds all **27 sub-objectives of 220-1201**
verbatim, and every stage carries an `objs: [...]` tag. `verify/verify.mjs`
holds the line in both directions: no stage may name an objective that does
not exist, and no objective may go uncovered. Anything genuinely out of scope
goes in that check's `OUT_OF_SCOPE` map **with a reason**, so dropping
coverage is a decision somebody wrote down rather than something that
happened quietly. The map is currently empty — coverage is 27 of 27.

For most of this build's life nothing was tagged at all, and "is it covered?"
could only be answered by reading 54 stage titles and guessing. When the tags
went in, ten objectives turned out to have nothing whatsoever: 1.2, 2.1, 2.3,
2.7, 2.8, 3.1, 4.1, 4.2, 5.3 and 5.5. The Networking and Display labs exist
to fill exactly that hole. **Do not add a stage without tagging it** — an
untagged stage fails the check.

### The six WAP interferences

Microwave oven (2.4GHz, intermittent), cordless phone or baby monitor (2.4GHz,
continuous), Bluetooth density (frequency hopping), neighbouring APs on
overlapping channels, building materials (concrete, metal, mirrors, water),
fluorescent ballasts (broadband noise). They should **stack**, so the student
works out which is dominant.

## Every stage of the Printer lab shows the student something

Fifteen stages, fifteen models, and `selfCheck` in `lab-printer.js` fails the
lab if any one of them loses it. A stage qualifies by mounting a bench panel
**or** asking a `pick` or `fit` question — on `wear` and `fit` the model *is*
the question, so there is no panel to look for.

**That stage list is read from `labs.js`, not typed out in `selfCheck`.** It
used to be a hand-written array of thirteen keys, and it went stale the moment
`fit` was added: the stage was registered, built and ran, and every invariant
below silently skipped it — including the one written specifically to catch a
bug in that stage. Three planted defects all came back clean, which is worse
than a failure. Anything registered in `labs.js` is now checked whether
somebody remembered it here or not.

This was the owner's complaint about the Quick path, verbatim: it "doesn't show
a student a single one of the machines they now have". Five of the six core
stages were a quote list, a settings table, a note and two numbers.

What each of the added ones shows, and why it is that and not decoration:

| Stage | Model | The physical fact it was hiding |
|---|---|---|
| `brief` | the room, one per job | "no room behind the counter" is a measurement, not an opinion — and whether there is a data point on the wall is a constraint nobody mentions |
| `choose` | six machines on a shelf | the answer *is* a machine; thermal and thermal-transfer are neighbours differing by one ribbon spool |
| `deploy` | the back panel and the wall | the ordering question is about what plugs into what |
| `defect` | the customer's actual machine, **nothing marked** | naming the failing part is the question |
| `duty` | the two numbers as piles of reams | a duty cycle is a figure nobody has a feel for |
| `consum` | the kit open, toner and drum *outside* it | students think a maintenance kit is more toner |
| `scanflow` | the job lying in the output tray | that is the problem, drawn as it happens |
| `fleet` | the department in plan | distance and grouping decide placement |
| `fit` | the machine with the fittable parts **absent** | a part is placed on the printer, not on a photograph of one |
| `callout` | the machine as found on site, nothing marked | the fault is in how it was deployed, and the machine looks perfectly healthy |

### `fit` — the Core 1 printer PBQ, brought onto the machine

Built from `Core-1-Sims/Printer Troubleshooting/PrinterPBQ.html`, which drags
five labels onto four dropzones over `printer.png` and marks them with Submit.
`Core-1-Sims` is untouched; this is the exercise rebuilt here, the way the rest
of this repo was built from that repo's ideas.

Three things change, each of them one of this build's own rules:

- **The machine is the answer surface.** A dropzone at `top: 67px` means
  something only from the angle the photograph was taken at. The student holds
  a part and clicks the station on a model they can turn round.
- **It never marks the answer.** The original's Submit red-borders the wrong
  zones, which hands the answer over by elimination in one click. This refuses
  a placement, says why, and keeps going.
- **Refusals stay visible, in words, on the chip that earned them** — the board
  is the student's working memory, and it is never colour alone.

The original has one wrong item (an ink cartridge on a laser). This has two,
both real parts off machines the student meets on the `choose` stage, which
turns "spot the odd one out" into "know which technology each part belongs
to". Six items for four stations, so two are left in the tray at the end — a
tray that empties would say "finished" before the student had thought about it.

**The bench draws only what has been fitted.** A student asked to fit a toner
cartridge must not be looking at one already in the bay, so `printerBench`
takes `view.fitted`; absent — every other stage — the machine is whole and
nothing that used to be drawn stops being drawn.

**A generated exercise can have the wrong answer, and nothing else catches it.**
The first cut of this stage pointed the fuser at the imaging drum. It rendered,
the bench mounted, all six chips appeared, and the whole suite passed — and a
student who put the fuser where a fuser goes would have been told they were
wrong. `selfCheck` now holds that every item's station is offered, every
station is a part on the *complete* machine, no two items claim one station,
and at least one item belongs nowhere. All four were calibrated by planting the
defect.

### `callout` — the Core 1 MFD simulation, brought in

Source: `Core-1-Sims/MFD Printer Deployment  Troubleshooting.html` — eight
tickets, each asking Most Likely Cause and Best Next Step, with a mindset note
that is the best thing in it: *"Prefer verify/configure/inspect before
replacing parts. Use the scenario's recent change and scope clues to eliminate
distractors."*

It is the OPPOSITE skill to `defect` next door, which is why both exist.
`defect` is a fault in the imaging process, found by running diagnostics on the
machine. `callout` is a fault in how the machine was deployed or configured,
found by reading what changed and who it affects. Six of the thirteen right
answers are not a part at all — and two of them are, because "never replace" is
as wrong as "always replace".

Six options rather than the original's four, which matters more here than
anywhere: the whole exercise is elimination, and four options let rung 3 strike
only two. Every wrong answer names the CLUE that rules it out rather than
asserting it is wrong, and several are perfectly good diagnoses of the same
symptom defeated only by the timing or the scope — the "reading the scenario"
gap, on purpose.

Thirteen scenarios: the original eight plus five added per the standing rule —
a driver default overriding tray selection, scan-to-folder failing on a changed
service password, a firmware update resetting tray configuration, a shortened
DHCP lease sending one department's jobs to another floor, and a new toner
cartridge fitted with its sealing strip still in.

**Eighteen now**, with five more added when the feed area was rebuilt from the
owner's annotated photograph. They are all feed faults and they all have
DIFFERENT answers: tired lift-plate springs, worn separation pads, a chipped
drive gear, one worn tyre on the shaft, and a tray not pushed home.
*"It has stopped taking paper"* is one sentence covering five repairs at five
prices, and telling them apart is the skill — the discriminator in each is the
pattern rather than the symptom. When in the stack it happens, how many sheets
come, one tray or all of them, and what you can hear.

They exist because the model can now answer them. **New content earned by a
model is the good kind of five-more**: before the photograph, a student sent to
look at a feed fault was sent to look at a single grey cylinder, and all five
of these would have been guesswork.

**A bench must never show the answer.** `defect` marks nothing; the shelf marks
nothing and carries all six options including the two near misses, because
showing only the four real technologies narrows a six-option question to four
for free; `fleet` does not draw the machines it is asking you to count.

## The four Core 1 workstation sims, brought onto the board

Source files, all in `Core-1-Sims/`: `PC Builder/PC Builder.html`,
`Workstation Hardware Troubleshooting Simulation.html`,
`PC Diagnostic/PC Diagnostic.html`, and
`Workstation Build  Compatibility Check Simulation.html`.

They land in the `build` lab as `twobuilds`, `symptom`, `specs` and `swap`, and
**they overlap the stages that were already there.** That overlap is the point.
The owner's words: *"Everyone learns differently. Some students may learn best
by using the sims and some students might need to use this 3D model to learn
about the material… My goal is to give the students as close to real world
looking 3D modeling to help them with their exam prep and the real world at the
same time."* Coverage is not the test for whether a stage should exist. **Two
routes to one objective is the deliverable.**

| stage | what it contributes that nothing here had |
|---|---|
| `twobuilds` | one shelf, two opposed briefs, so the right answer FLIPS between them |
| `symptom` | observations rather than a build history — the student did not build this machine |
| `specs` | a printed rating against a live reading, and the one that disagrees |
| `swap` | a baseline that is already wrong, and a budget of exactly two changes |

Seven machines in `twobuilds` (two of the owner's plus five), eleven symptom
sets (six plus five), six spec faults (one plus five) and seven swap briefs
(two plus five) — the standing five-more rule, four times over.

### `swap` — a budget of changes is its own skill

The original's counter says "0 / 2 changes used" and then grades a third change
anyway, mentioning afterwards that you made one. Here a third swap is **refused
at the moment you try it**, naming the two you have already spent, and putting
something back to its original is always free. That is what stops a student
shotgunning every control, and it is a different skill from specifying a build
from nothing.

Each brief carries `needs` as **one entry per requirement** holding the
requirement in the customer's own words, the component that satisfies it, and
why. The stage displays `req`, the check tests `to`, the explanation uses
`says`. The first version kept those in three parallel arrays and matched them
by index, which is a drift waiting to happen.

`selfCheck` proves every brief is **solvable inside its own budget**: applying
every change it asks for must leave a configuration that passes `swapFaults`.
Without that, a brief could quietly need three fixes and allow two, and no seed
would ever tell the student which one they were not allowed to reach.

### `symptom` — the bench must not answer the question

Three of the eleven symptom sets produce the SAME three signs as another set
with a DIFFERENT answer. A student cannot read the machine off at a glance;
the discriminating detail is in the report. `selfCheck` holds this at TABLE
level rather than per symptom, deliberately — a completely dead machine really
is diagnosable from the bench alone, and that is sound content. What would be
a leak is a table where every sign pattern names its own answer.

### The three signs, and what they cost to get right

`bench-build.js` grew a chassis fan, a board speaker and a monitor. Each is
drawn in two states, and getting them to actually LOOK different took four
corrections that reading the source would never have found:

1. **The fan was a solid green slab.** Its frame was a box with a bore cylinder
   drawn inside it — and this renderer has no boolean subtraction, so nothing
   was cut and every blade was buried. It is now four bars with a genuinely
   open middle. *Material can only be absent here by not being drawn.*
2. **The monitor panel was invisible, twice.** Placed 0.01 units in front of the
   bezel, then 0.16 units behind it. The bezel is 0.24 deep centred on z + 0.30,
   so its near face is at **z + 0.42**, not z + 0.18.
3. **The "sound rings" were barrels.** `tube` in this renderer is an
   open-ended CYLINDER: `size[1]` is its length along the axis, not a section.
   The ring shape is `torus`, whose size is `[diameter, section diameter]` and
   which lies in the XY plane. Tripling the wrong number three times over is
   what finally said the number did not mean what I thought it meant.
4. **The screen carried its state in colour alone.** These students have damaged
   sight; a blue rectangle against a black one is one channel. It now also has
   content drawn on it, which is the thing a technician actually looks for.

`verify/sign-states.mjs` measures all of this off the painted pixels and runs
in the suite in **both directions** — plain, and `--calibrate`, which plants
three signs that ignore their own state.

Two things it taught about instruments, both worth keeping:

- **`readPixels` on the canvas comes back all zeros.** The drawing buffer is not
  preserved after present. That would have passed the check for the wrong
  reason on every sign at once. Read back through a screenshot.
- **Guessed measurement windows measure the wrong thing.** The first version
  eyeballed three bands of the canvas; the beep rings sat above the window
  entirely and scored 1. It now drives `verify/preview-signs.html`, where the
  three signs are the ONLY inputs, flips one, and diffs the whole canvas.

### A sign row is on the mat and on the SCREEN, and those are different

`frustumOK` asks whether the camera can see a part. It cannot ask whether the
part is standing on anything, and it cannot ask whether the part is inside what
the camera is actually framing. The first sign row sat at z = 8.9, comfortably
on the mat, and half of it was outside the frame. `bench-build.js` now checks
both, plus a `SIGN_REACH` separate from each sign's mat footprint — a monitor
bezel that hangs over a neighbour's foot is still drawn through it.

**The signs and the loose graphics card are mutually exclusive**, and
`buildBench` throws if both are asked for. They share a band on the mat, and
they contradict each other in meaning: a stage showing the signs of a power-on
is showing an ASSEMBLED machine, which has no card lying beside it.

### Device Issue Diagnosis is not a workstation sim

`Core-1-Sims/Device Issue Diagnosis.html` is the fifth of the owner's five and
it does not belong in `build`. Six of its ten devices are monitors and
projectors (burn-in, keystoning, contrast, a dirty lens, the wrong input) and
two are phone batteries. It goes to the labs that own that content.

## Building from the owner's photographs

Eight photographs came in after the owner said the first renders "don't look
like anything that I recognize", which was a fair reading. What they corrected,
and what each correction cost:

| part | what the photograph changed |
|---|---|
| projector | wide and flat, not a cube; lens **offset** and sitting in a large recess; the **trolley is half the object** |
| screen | a **black border** round the white; a light roller casing; 4:3 |
| monitor | thin bezel with a deeper chin; a **splayed V-arm on a hubbed base with four legs** |
| cooler | a machined **base plate**, fins packed as a comb, **spring-loaded captive screws** |
| graphics card | a **bare PCB** — every feature a shroud hides is a feature the exam asks about |
| power supply | there wasn't one; drawn **lid off**, rear face to the room |
| motherboard | not the layout (it is an older board than this lab teaches) but **how much is on one** |

### The second nine photographs: the laser feed area and the handset

Nine more came in when asked what else was needed. They fixed two benches
and, indirectly, the renderer.

| part | what the photograph changed |
|---|---|
| laser feed | **three of four parts were not drawn at all** — see below |
| toner and drum | the OPC coating is a **saturated green**, not the pale sage it was |
| fuser | it comes out as a **framed assembly with a cable loom and a white connector**, not two bare rollers |
| swollen cell | it **domes**; it is the **same colour and the same footprint** as a good one |
| midframe | the antennas are **round coax with gold snap connectors**, not painted traces |
| cracked glass | one **impact knot** with radials AND concentric rings, and the picture still live underneath |

**The owner labelled four things on the feed shot and this model had one of
them.** SEPARATION PADS, PICKUP ROLLERS, GEAR DRIVE, TRAY LIFT PLATE — and
`printerBench` drew a single generic cylinder. The tray's own note had said
for months that it is "the first thing to look at when one sheet picks up
two", while the part that holds the second sheet back was not in the
machine. **The words claimed something the model contradicted**, which is
worse than the model being thin: a student who went to look found nothing
and had no way to know why.

Two rules re-earned building it:

- **A tray is a pan, not a block.** It was one solid rbox, and the lift
  plate and its two springs went straight inside it, invisible. Identical
  to the power supply's empty crate. Anything with parts in it gets its
  near wall cut.
- **A pad that stands on a moving plate travels with the paper.** The pads
  were drawn hovering between the lift plate and the roller; a render
  caught it. It is not cosmetic — the lift plate RISES as the stack
  empties, so a separation pad mounted on it would move with the sheet it
  exists to hold back. They stand on the fixed deck, on pillars, and the
  picture now says which part moves and which does not.

### `ring` turned its copies the wrong way, on two of three axes

`expand()` in `shape.js` places n copies round an axis and turns each to
face outward. The turn is `-a` on Y, which is right, and it was `-a` on X
and Z as well, which is wrong by `2a`: **a copy a quarter of the way round
lies flat.**

It survived the entire life of this build because **seven of the ten ringed
features here are square in the plane of the ring** — sprocket pins, collar
splines, gear teeth cut from cubes — and a square is unchanged by the
error. Most of the evidence said the engine was fine. The three that were
not square were wrong in plain sight and had been looked at: the PSU fan on
the power bench with four of nine blades edge-on, the spoked wheel on the
impact bench, and the sprocket rim on the wear bench.

The size order that follows, now that it holds:

| ring about | size means |
|---|---|
| X | `[axial, radial, tangential]` |
| Y | `[radial, axial, tangential]` |
| Z | `[radial, tangential, axial]` |

The wear bench's sprocket rim was ALSO mis-sized against that order,
independently: `[0.30, 0.20, 1.15]` is a tooth 1.15 wide *tangentially* on
a rim whose 34 teeth are 0.28 apart, so they would have overlapped four
deep. The 1.15 was meant to be the width across the wheel.

`verify/ring-radial.mjs` runs both directions and tests the ENGINE rather
than a render, because **a defect that only shows on non-square inputs is
invisible in the common case**. Its counts are chosen so some copies land
at the angles where the error is worst; a ring of 2 or 4 would have
reported the old engine as clean.

### Damage has to stay on the part it damaged

The crack star's first cut ran fixed-length radials off a point near a
corner of the glass, and half of them shot clear off the layer and hung in
the air — a spider standing over the phone rather than damage in it. Same
family as painting a driver-board symptom on the LCD panel.
`checkCracksStayOnTheGlass` measures the cracked layer against the plain
layer's own footprint, and every radial's length is now DERIVED from where
the edge actually is rather than picked.

### A swollen cell domes; it does not grow

The model made a swollen battery thicker **and brown**. Both invented. In
the owner's photograph of two pouches side by side, one tagged, they are
the same silver foil with the same white label and **the same footprint** —
the seal welds do not move. Only the middle lifts, and the foil creases
round the rise.

Teaching a colour tell here is actively dangerous: a student who learns to
look for a discoloured battery walks past a swollen one. The dome carries
it, and the pip and the words beside it carry the verdict, which is the
same division of labour as every other bench here.

`checkSwellingDomes` holds both halves — a rise of at least 0.45, and a
footprint that does not grow — and it **fired on real content on its first
run**: the crease boxes, swung to ±0.8 radians at 0.62 of the pouch's
length, reached 0.96 past the weld. The check was right and the geometry
was wrong, which is the outcome to want from a new invariant.

### The handset stack, rebuilt as objects instead of sheets

The owner asked, more than once and finally directly — *"We are still NOT
building the 3D models that I want to build. Why is this?"* — and the honest
answer was that **modelled geometry had been traded for photographs on flat
plates.** The logic board had been built at 63 primitives and then deleted in
favour of one slab wearing a picture of a board. That is a billboard, not a
model.

Three causes, all of them mine:

- a decal was substituted for modelling whenever a photograph existed;
- each complaint was answered with a new *technique* — better crops, UV
  normalising, aspect checks — rather than with more geometry;
- the bench's founding rule, *"occlusion is designed out — draw everything as
  sheets"*, predates every photograph the owner sent and was never revisited.
  Real parts have depth, depth causes occlusion, and the fan already solves
  occlusion. The flat-sheet premise is gone.

**The division that replaces it:**

| use | for |
|---|---|
| **GEOMETRY** | FORM — anything with a height, an edge or a shadow |
| **PROCEDURAL** | MATERIAL — laminate, weave, brushed foil, anodised alloy |
| **PHOTOGRAPH** | only where the surface IS a printed picture that cannot be generated — a lit screen, a printed label, a fracture |

What each layer became, and the fact each one now carries:

| layer | rebuilt as |
|---|---|
| **battery** | a laminate POUCH — seal flange standing out on four sides at the weld line (a third of the way up, because one sheet is deep-drawn and the other is flat), the flange folded back at two corners, a tray below the weld and a domed lid above it, and two tabs at different values because they are aluminium and nickel and you never bridge them |
| **midframe** | a machined TUB — rim standing up with real wall thickness, floor recessed inside it, heat spreader sunk INTO the floor, screw bosses as posts with holes in them, and the charge port and speaker grille as genuine gaps in the bottom wall |
| **display panel** | a MODULE — a metal backing tray with its lip round three sides, the panel inside it, the printed black border, and the driver IC on its film folded under. The open fourth side is why a screen comes out from that end |
| **cover glass** | a PANE with edges — the polished 2.5D roll-off that catches light in a line, and the black ink border printed on the back face |

### Two builders, one set of numbers

A duplicated block of `BUILD` keys sat in `bench-mobile.js` for a whole
session: `back`, `battery`, `board` and `midframe` each defined **twice**. In
a JavaScript object literal the later key wins, so the rebuilt midframe was
dead code and the old flat slab was what rendered — while a primitive count
taken off the live object reported 20 either way and looked like a pass.

**A count is not an identity.** When a rebuild is verified by counting, count
something the two versions cannot share.

### A hole is a hole, and a grille is what is left

There is no boolean subtraction in this renderer, so material is absent only
where nothing is drawn. Three versions of the same mistake, in order:

1. The charge port was a **dark rectangle painted on a continuous wall** —
   a picture of a hole, and it fails the moment a student looks along the
   bottom edge, which is the angle that question is asked from.
2. The fix made a real gap and then **stood five dark cylinders in it** —
   which is a gap with plugs in it, the painted-hole mistake turned inside
   out. A grille is built as the POSTS between the slots.
3. The gaps were declared at x 2.0 to 3.5 on a wall whose half-width is
   **2.85**, so the third wall piece came out with NEGATIVE width and the
   grille hung in the air past the corner. It rendered. The only thing that
   caught it was another check three layers away complaining that the board
   had stopped clearing the midframe.

Then two more, once the owner's photographs of a real handset edge arrived:

4. A **torus is the wrong solid for a bore**. Its section is circular, so one
   number controls both how thick the ring is RADIALLY and how deep it runs
   THROUGH the wall. Sized to leave a proper web between neighbouring holes
   it came out 0.06 deep in a wall 0.34 thick — a hoop floating in the middle
   of the metal with daylight in front of and behind it, which renders as a
   **raised doughnut stuck on the surface**. A bore is a RING OF BLOCKS: each
   as thin as the web needs and as deep as the wall is.
5. Rings sized to **exactly touch** left an empty cusp where two circles and
   the bar above them meet — real metal, missing, reading as a row of chain
   links. They have to OVERLAP.

`checkTheFrameHasRealHoles` holds all five, was calibrated six for six, and
was **moved above `checkEveryLayerIsVisible`** so it names the cause rather
than letting a downstream check report a symptom.

### A CHECK THAT IS WRITTEN DOWN IS NOT A CHECK THAT WORKS

The invariant guarding those holes failed twice, in two different ways, and
both were found only by planting a defect:

- **An arm that could never fire.** The bore was derived as ring radius minus
  half the block, and the radius was itself derived from the block — so the
  bore came out the same whatever was done to it. The check read as sound and
  was structurally vacuous.
- **An arm deleted by a careless edit.** A Python replacement swallowed the
  `bores.length < 4` throw, and the check went silent on a whole missing
  grille run while still passing.

Worse than either: **the check and the geometry shared a misreading.** Both
had `torus` size as [outer diameter, section] when it is
**[centre-line diameter, section diameter]** — so bore = `size[0] - size[1]`,
not `size[0] - size[1] * 2`. A check that inherits the builder's mistake
confirms the mistake. Derive the check from the SHAPE'S CONTRACT, not from
the code that happens to be next to it.

### Sizes come from the real part, not from the eye

Three things in this build have been shipped at two to four times life size,
and every one of them looked fine until it was measured against the object:

| part | was | should be |
|---|---|---|
| gold antenna snap connector | 0.62 across | 0.30 — a u.FL is 2mm on a 70mm phone |
| USB-C receptacle shell | 1.66 wide | 0.79 — the shell is 8.9mm |
| grille holes | 0.20 | 0.10 — about 1mm |

**The scale is fixed and it is arithmetic**: this handset is `PW = 6.2` units
for a phone about 70mm wide, so **one unit is roughly 11.3mm**. Anything whose
real dimension is known should be derived from that and a comment left saying
so. "It looks about right" is how a coat-button connector got onto a phone.

### A dome is a shape, not a stack of steps

The swollen cell's crown was five rounded boxes, each smaller and higher. Five
courses do not read as a curve — they read as a **ziggurat**, and the render
said so plainly: a wedding cake sitting on a battery. This is the named
failure mode already in this file, *"a worn profile with too few steps to read
as a curve"*, and more courses is the wrong answer to it.

`sphere` in `scene.js` now takes `[dx, dy, dz]` as well as `[d]`, so the dome
is one ellipsoid. Every sphere already in the build passes one element and is
untouched.

The knock-on is the point: **the printed label is glued to the foil, so it
goes where the foil goes.** It was a flat plate at a fixed height, fine while
the dome was boxes it happened to clear, and buried inside the battery the
moment the dome became a curve. `CELL` and `cellDome(u)` are module constants
now because three things have to agree about where that dome is — the cell
that grows it, the label stretched over it, and the check that measures it.

### A decal was projected from three coordinate systems at once

`primGeometry` lays UVs out PER FACE, projecting each one from whichever
axis it points along: an up-facing face from world x and z, an x-facing
face from z and y. The decal rescale then took a single min/max **across
all of them** and divided by that.

The battery label is what proved it wrong. Its nine strips have real side
area, so the x-facing faces contributed a U range taken from world Z — 5.4
units against the part's actual 3.5 of width — the span came out half as
big again as it should be, and the part rendered the **left 65% of the
texture** stretched across the whole label. Every long line of print ran
off the right-hand edge of a border that was comfortably inside the image.

**It read as a layout bug for three rounds.** Shrinking the type did not
fix it, measuring the text did not fix it, and the arithmetic said it
should already fit. What settled it was painting a RULER into the texture —
ticks labelled u0 to u10 — and reading off which slice the part was
actually showing. *When the source and the render disagree, make the render
say what it is doing.*

A decal is a picture laid flat on a part, so it is projected from the
part's THINNEST axis and mapped straight from world position. One
projection, no mixing; side faces get the edge of the picture, which is
what clamping is for.

**And fixing it broke the screens, which had been relying on it.**
`screenLit` is a photograph of a whole handset on a wooden bench. The
accidental crop happened to show mostly screen; with the mapping correct
the panel showed the entire photograph — a phone on a desk, inside a phone.
A tile may now declare `crop: [u0, v0, u1, v1]`, so the framing is stated
rather than arrived at by accident, and `aspect` is corrected to the
cropped picture because that is what the sheet is sized to.

### A painted surface can be a one-off, not just a photographed one

`decal: true` had meant "lay it once and clamp" only for PHOTOGRAPHED
tiles. Everything painted was assumed to be a material — grain that tiles —
which is right for brushing and silkscreen and wrong for a printed label.
A painter may now declare `once: true`.

That is what let the cell's label carry REAL WORDS. It prints the part
number, the chemistry, the capacity in both mAh and Wh, the nominal and
charge voltages, the warnings, the WEEE bin, CE, the Li-ion triangle, a
barcode and a lot code — and **every figure comes from the scenario**, not
from the bench. The lab generates a design capacity and then asks the
student to divide the current capacity into it; a label printing its own
number would put the evidence and the answer on opposite sides of one
screen. `checkTheLabelAgrees` holds Wh against V × Ah, holds the printed
capacity against the health table, and refuses a charge limit below
nominal — because the whole point of printing both voltages is that a
student reading 4.35 V on a full cell can see it is full rather than
overcharged.

The layout MEASURES ITSELF with `measureText` and shrinks to fit, because
the first cut picked sizes by eye and "17.4 Wh" came out "17.4 W" — on a
label whose entire job is to be read, a clipped line is worse than no line.

### The benches did not fit on a phone, and nothing was watching

The suite renders at **1100px and nothing else**. The `wear framing` check
drives four widths, but only for the wear shapes. So the question "does a
student on a phone see the whole bench" had never been asked, and the
answer was no on ten of twenty-two.

Driven at the canvas widths the running lab actually hands out — 319px
inside a 390px phone, 480, 697 inside a tablet, 889 inside a laptop — the
worst was the handset bench at **seventeen parts**, and the first thing to
go was the **battery health gauge**, on the lab whose safety stage turns on
that gauge. The printer bench lost seventeen too, on the largest lab in the
build.

**`max` is an orbit limit, not a framing limit, and conflating them made
`fitWidth` inert.** `place()` read

```js
dist = Math.max(cam.min, Math.min(cam.max, dist));   // already clamped
var d = Math.min(cam.max, fitDist());                // clamped AGAIN
```

`dist` is already inside `[min, max]` on the line above, so the only thing
that second clamp could ever do was throw the fit away — and it did,
silently, on every bench whose `max` was smaller than the distance its own
`fitWidth` needed. The network bench proves it: `fitWidth: 44`, `max: 76`,
a comment saying the value was measured, and it still lost a part at 319px
because 44 needs about 93 to reach at that aspect.

The two numbers mean different things. `max` is how far a **student** may
orbit out. `fitWidth` is a **promise** about what must be on screen, and a
promise clamped by an interaction limit is not a promise. The fit wins now.
It can only ever move the camera further back, which shows MORE — a small
bench is legible and a cropped one is not. **That one line fixed every
bench that already declared a `fitWidth`**: thermal, impact, inkjet, wear,
net and the six office benches, all at once.

Six benches had never declared one, and their values were swept against
`frustumOK` at all four widths: display 50, printer 30, outlet 38 (was 30),
power 34, build 22, device 22, mobile 30, site 50 (was 42). Each is one
sweep step above the measured minimum, because the sweep drives the default
view and a bench is at its widest in some other state. It costs nothing on
a wide canvas — `fitDist` takes the larger of `dist` and the fit.

**A bench can clip in the MIDDLE.** The office site bench was clean at 319,
480 and 889 and lost a part at 697: at the narrow end the fit backs the
camera off, at the wide end the aspect alone is enough, and in between
neither is. Sweeping only the narrowest width would have missed it.

**Every `fitWidth` in this build predated anyone driving a phone.** Two of
them carry comments saying they were measured — and they were, at the
narrowest width anybody was testing at the time, which was not narrow.

`verify/bench-frame.mjs` runs in the suite in both directions, 22 benches ×
4 widths = 88 combinations. `--calibrate` hands every bench a `fitWidth` of
1 and requires the benches to go back to clipping; 58 of the 88 do.

Two traps written into it, both paid for:

- **Read `.out`, never `.length`.** `frustumOK` returns `{ out, parts }`,
  and reading `.length` off that wrapper gives `undefined`, which is falsy,
  which is a harness reporting a clean pass on every bench at every width
  for ever. That happened for an hour and produced a confident, completely
  wrong conclusion that the engine was blind. It is not — `wear-frame.mjs`
  has always read `.out.length`.
- **One bench and one width per page load.** The first cut mounted them all
  on one page: eighty-odd WebGL contexts against a browser cap around
  sixteen, so the later ones lose their context and the page never
  finishes. A harness that quietly stops is worse than one that fails.

And **a row that cannot resolve is not a row that passes**: the first audit
listed an `officeBench` that does not exist, printed `?` for it, and failed
nothing. `bench-office.js` carries SIX benches; power and display carry two
each. The check now fails on any combination it cannot measure.

### A variant counter that does not count the content

`verify.mjs` counts distinct `variantKey` values across 240 seeds and
fails a lab producing fewer than four. On the mobile lab it reports 41.

**It reports 41 with seventeen of the eighteen first-step cases deleted.**
`variantKey` is `faultKey/device/worn` and has never looked at either side
table, so `FS_CASES` and `MDX_DEVICES` — which between them carry most of
this lab's actual scenarios — could be collapsed to one entry each, or made
unreachable by a picker bug, and all 51 checks would stay green. Proved by
planting exactly that.

The key is not wrong; the fault, the device and the wear state really are
the axis the generic checker asks about. What was missing was anything
watching the other two axes at all. `checkEveryCaseIsReachable` in
`lab-mobile.js` DRIVES the generator rather than reading the tables, which
is the same rule the printer lab's stage list had to learn.

**300 seeds, and the number is arithmetic rather than a guess.** It runs at
module load, so a student on a school laptop pays for it every time they
open the lab. Eighteen cases picked uniformly: the chance of missing one in
n draws is about 18 × (17/18)^n — one in forty thousand at 240, one in a
million at 300. 600 was twice the cost for no more certainty. Calibrated
three for three: both pickers collapsed, and a picker that can only reach
half its table.

### The cracked screen was drawn, verified, documented and UNREACHABLE

The sharpest case of *written and reachable are different claims* in this
build, and it survived every check for the life of it.

`mobileBench` takes `cracked`. The fracture is real geometry built from the
owner's photograph — an impact knot with radials and concentric rings, 237
primitives, with `checkCracksStayOnTheGlass` holding it onto the layer it
belongs to. Three places in `lab-mobile.js` computed the flag:

```js
cracked: s.faultKey === "glass"
```

**There is no fault called `glass`.** The nine are backlight, battery, charge,
digitizer, drain, lcd, mdm, signal and sync. `glass` is a LAYER name — the two
namespaces meet in `FAULT_LAYER` and look identical at a glance. The condition
was false on every seed that has ever run.

Nothing failed. The geometry checks passed, because the geometry was fine. The
contrast sweep passed, because it never saw the part. The variant counter
passed, because it has never looked at bench flags. **A flag that is never set
is a check nothing performs.**

And underneath it, a content gap nobody had noticed: there was no
cracked-screen scenario at all. The most common phone repair there is, missing
from the table. `digitizer` is NOT that case and must not be repurposed as it —
that one is touch dead in an area with the picture perfect, a different fault
with a different tell and its own answer.

`checkEveryBenchFlagIsReachable` drives 300 seeds, collects the flags the
scenarios actually produce, and fails if any is never set. It also holds
`FAULT_LAYER` to real fault keys, because that table is where the confusion
started. Calibrated both ways.

**The general rule: every boolean a lab can pass to a bench is a branch of the
model, and a branch no scenario takes is a branch nobody has ever seen.**

### `frustumOK` ONLY CHECKS HORIZONTAL CLIPPING

Worth knowing before trusting it, and it cost a wrong conclusion today.

It projects each part's bounding sphere and compares the **x** extent against
the frame. Nothing in it looks at the vertical, and `fitWidth` fits width by
definition — so a bench can pass the framing check at every canvas width and
still be cut off top and bottom.

Every other bench in this build is wider than it is deep and framed
three-quarter, so it runs out of width long before height and the gap never
showed. The closed handset is the exception: 6.2 across, **12.8 long**, seen
from nearly overhead, so its length lands on the screen's SHORT axis. Visible
height is `fitWidth / aspect`, so 17 at aspect 1.86 shows 9.2 world units
against a phone 12.8 long. The sweep came back clean at all four widths while
the phone was visibly cut in half.

Set that camera's `fitWidth` from the HEIGHT instead — 12.8 × 1.86 ≈ 23.8,
rounded up to 26 — and confirm by looking. For any bench whose long axis ends
up vertical on screen, the framing checker cannot help you.

### The phone arrives closed, and the student opens it

The mobile lab's first stage was text and nothing else: a wall of customer
quotes, with the handset appearing at stage two already in seven pieces. A job
starts with a device in your hand.

`mobileBench({ exploded: false })` draws the closed handset — back cover, frame
band, screen, cover glass, and the printed ink border — at **11 mm** against a
real phone's 8.6. Answering the teardown question below it sets `opened` and
the bench redraws as the exploded stack, through `q.onCorrect` plus the
runner's `refreshBenches()`. **A question may change the hardware, and when it
does the picture has to follow** — a bench still showing a closed phone after
the student decided to open it is the model contradicting the answer they just
got right.

Three things learned building it, all by measuring rather than looking:

- **Collapsing the exploded layers does not give you a closed phone.** All
  seven stacked to 41 mm, because the midframe is 36 mm in this model and the
  panel module 28 mm — both drawn far thicker than life SO THEY READ when
  exploded. Filtering to the four outside layers did not help either: the two
  exaggerated ones are exactly the two you keep. The closed view draws the
  three parts that are genuinely its outside, and **reuses `BUILD.glass`, so
  the crack is the same geometry in both views.**
- **Nothing sticks out of a closed phone**, and that is a rule rather than a
  list of primitives to delete. The glass builder ends with the digitizer's
  flex tail running off the bottom edge — right when exploded, and a grey T
  hanging in mid-air when closed. Anything centred outside the footprint goes.
- **The ink border is drawn in FRONT of the glass**, which is a concession to
  the renderer and is labelled as one. On the real part it is printed on the
  glass's back face and seen through it; this engine's glass finish is not
  transparent enough for that, and without the ink the pale cover glass
  sampled `#b6bfc5` at luminance 0.74 and read as a thick white bezel.
  Darkening the glass instead would have dimmed the picture underneath and
  lost the one thing the view exists to show.

**E acts on the selected part, on every bench.** Bound once in `bench.js`
rather than per lab, it fires the first action of whatever is selected — the
primary one by construction, since controls list actions in the order the lab
offers them. It ignores keypresses inside text fields, and does nothing at all
for a part with no actions: a bench that answers a key with silence beats one
that does something unasked.

### `panelpart` — 3.1 taught as construction, and the bench that gave it away

3.1 is *"compare and contrast display components and attributes"*, and every
stage carrying it — Display's `panel`, `connect` and `specs` — is about
CHOOSING and connecting a monitor. None takes a display apart. A student could
pass all three without knowing what sits between the glass and the light.

This stage is the display module out of the stack with the other layers lifted
off, and the question is which PART. Eight candidates in `PANEL_PARTS`, six
options a seed, thirteen cases. Every discriminator is buried in what the front
desk wrote down, and they are all real:

| discriminator | what it separates |
|---|---|
| **direction** | a band DOWN is the column driver at the bottom edge, a band ACROSS is the row driver down the side |
| **torch** | a picture still visible in the dark area is LIGHT; nothing under a torch is PANEL |
| **one dot** | a sub-pixel is one transistor, and there is nothing there to repair |
| **pressure** | the crystal is a liquid — it moves, spreads, and answers to a thumb |
| **angle** | an optical film misbehaves as you tilt it; nothing behind the glass does |
| **hue** | a patch of wrong colour in the RIGHT SHAPE is dye, not a driver |

It is `lab` tier, not `core`, and that was a decision rather than an oversight:
`digitizer` already sits in core asking which LAYER failed, and a second
display question in Quick would make two thirds of the short path about screens
on a lab that also owns batteries, charging and radios.

**THE BENCH ANSWERED THE QUESTION, AND EVERY STRUCTURAL CHECK PASSED.**

Six of the eight candidates live on the LCD layer and two — the light guide and
the LED strip — live on the backlight beneath it. The first cut focused
whichever layer held the CORRECT part. So the picture announced which half the
answer was in before the student read a word: backlight on screen meant the
field was two, panel meant six.

Everything green. The options were six, the right one was among them, every
part named was on the bench that was mounted, and the bench mounted was the one
the stage asked for. All true. All useless — because **not one check compared
one seed against another.** This is the general form worth keeping:

> **A bench that varies with the answer is a bench that states it.**

`checkThePanelBenchNeverVaries` drives the real stage until it has seen every
case and holds that the part list, the camera and the title are byte-identical
across all of them. Anything that differs between two scenarios is information
the picture is carrying, and this stage's picture is supposed to carry none.
Calibrated by restoring the exact bug, which it names.

The fix is also the truer model: `focus` takes a LIST of layers, the stage
always asks for backlight plus panel, and a display module genuinely is the
panel and the light behind it. `PANEL_BENCH` is one exported constant that both
the stage and the check read, so they cannot drift.

**The fan is re-centred on the group, never zeroed.** Zeroing it would stack
the backlight squarely under a panel of the same footprint — the occlusion this
whole bench is arranged to design out. `checkFocusingTwoLayersGivesBoth` holds
that the list form is the exact union of the single-layer views AND that the
two stay laterally apart.

**A `fitWidth` REASONED FROM A DIMENSION IS A `fitWidth` GUESSED.** This one
went in at 11, from "the panel is 6.2 units wide". It lost five parts at 319px
and two at 1100px. Two things the arithmetic did not know: the part is 6.2
across and **12.8 deep**, and at yaw 0.42 most of that depth projects into
screen WIDTH; and `frustumOK` works on bounding SPHERES, so a sheet 6.2 by 12.8
is tested at a radius near 7, not 3.1. Swept instead — clean from 23, set to 26,
one step above as everywhere else. **And `max` was raised to 40**: leaving it
at 26, below the distance the fit needs, is the clamp bug that made `fitWidth`
inert on eleven benches.

**A harness bug reads exactly like a content bug.** The driver reported NO
BRIEF on every seed while the brief was plainly on the page — CSS uppercases
the panel heading and the match was case-sensitive. It also read `.parts.length`
off `frustumOK`, whose `parts` is a COUNT, and looked for `data-key` where the
runner writes `data-opt`. Three harness faults and one real defect in the same
run: **dump what the page actually contains before believing what the harness
says about it.**

### Five more first-step cases, earned by the panel

The standing five-more rule, and this is the good kind of it: until the LCD
layer became a real module, "which part of the panel" was not a question
this lab could ask, because there was one part. Five faults become
answerable the moment there are two driver ledges and a colour filter:

| case | the answer | what makes it that and not its neighbour |
|---|---|---|
| a stripe DOWN the picture | the source driver, bottom edge | a column with nothing driving it |
| a line ACROSS the picture | the gate driver, side edge | a row with nothing switching it |
| a spreading blot, soft edge | liquid crystal displaced by pressure | only an LCD has liquid in it to move |
| three dots that never change | dead transistors | they do not move and do not spread |
| a cloudy patch that shifts as you tilt | the front polariser lifted | it is ON the surface, not in the picture |

Three of them are "a mark on my screen" in the customer's words, and the
discriminator is buried in the report every time — which WAY it runs,
whether it is spreading, whether it moves when you tilt the device.

**Three of the five answer the same first step, and that is the lesson
rather than laziness.** One free test pattern separates a column from a row
from a scatter of dots, and a technician who reaches for it every time is
right every time. The two that differ are the two where a test pattern
cannot help: a mark that might be ON the glass needs the protector off and
a raking light, not a brighter picture. The blot case carries a
`cheaperButCannot` saying exactly that, because an unexplained cheaper
option is the stage arguing against itself.

Driven at **4000 seeds** rather than sampled, so every one of the eighteen
cases is actually reached and self-checked — a green line from a short
sweep says nothing. Calibrated six for six.

### The LCD panel is five sheets, and four of them were missing

The panel was one slab with a photograph of a lit screen laid over it —
the thinnest layer on the bench and the last one still hiding behind a
picture. A display module is a sandwich, and every sheet in it answers a
question a student is actually asked:

| sheet | what it is for | what it makes diagnosable |
|---|---|---|
| rear polariser | passes light one way only | why an LCD needs a backlight at all |
| **TFT glass** | one transistor per subpixel | it is the LARGER sheet, and its two ledges are where the drivers bond |
| the sealed gap | liquid crystal, ~4 microns | why a pressed panel bleeds a stain that spreads |
| **colour filter glass** | RGB stripes in a black matrix | why a dead pixel is a dead transistor, not a repair |
| front polariser | axis at **ninety degrees** to the rear one | the whole mechanism, and polarised sunglasses |

**The two ledges are addresses.** The colour filter is deliberately smaller
than the TFT glass: 0.30 of ledge down each side and 0.75 at the bottom.
The source driver bonds to the bottom one and the gate driver runs down the
side one, so the DIRECTION of a fault names the part — vertical bands or a
dead column is the bottom edge, horizontal bands or a dead row is the side.
Drawn as one sheet there is nowhere to point, and "the screen is broken" is
all a student can say.

**The subpixel surface is generated, not photographed** — twelve pixel
triads to a tile, each pixel three dyed stripes with a black matrix and a
transistor block between them, plus the gate and source lines over the
grid. Two things had to be corrected by looking:

- **It was far too loud.** Full-strength primaries turned the panel into
  RGB confetti — the noisiest object on the layer, over a lit screen that
  is the subject. Real subpixels ADD at any distance you cannot resolve
  them, so the inks are now dark and barely apart, and the panel reads
  neutral from the bench and resolves into stripes close up.
- **The "two to four tiles across a part" rule did not apply.** That range
  is for material grain, where more tiles stops the grain reading as grain.
  A pixel grid is a structure with a real count, and at three tiles across
  each stripe was two canvas pixels and aliased. It is 1.60 now — about a
  hundred triads across a phone screen.

**And the rear polariser's axis had to go on a peeled corner.** Drawn flat
on its own face it was buried under the TFT glass — the light guide plate's
mistake, made again, one layer up and within the hour. There is no version
where it is not: the film lies under an opaque sheet the same size. Sliding
it out was refused by the footprint budget, the same wall the backlight's
films hit. So the film is drawn lifted at one corner, the way it sits when
somebody has started peeling one off a scrap panel, and the hatching goes
on the flap.

`checkThePanelIsAStack` holds the four sheet clearances, the photograph's
lift above the stack, both ledge widths, and — the one worth having — that
the two polariser hatchings are still at right angles. Drawn parallel they
would look like a tidy pair of films and the model would be quietly
teaching that an LCD does nothing to its light. **A falsehood that renders
beautifully is the dangerous kind.** Calibrated five for five.

### The glass and the digitizer are ONE part to buy, and that changed the answer key

The owner settled this off a photograph of a broken screen beside its
replacement: **on an LCD handset the standard today is glass and digitizer
bonded as one assembly, with the LCD panel separate.** Nobody sells a bare
digitizer for these, and a shop that quotes for one is quoting for a part that
does not exist.

So the LCD stack is **seven layers, not eight**, and `ORDER.lcd` says so. In
`lab-mobile.js` the two `STACK` entries merged into
*"Cover glass and digitizer"*, the digitizer fault now resolves to the glass
layer on **both** stacks rather than only on OLED, the glass/digitizer pair
came out of `NEIGHBOUR` because there is no longer a neighbour to confuse it
with, and the fix text says in words that there is nothing to buy on its own.

Two things the merge broke that nothing would have caught:

- **The six-option rule.** `mb-layer` dropped to five, because one of its
  options had been the digitizer. It gained a real near miss instead — the
  display driver chip on the panel's edge, which is where a technician who
  has ruled out both glass and panel looks next.
- **A fallback pointing at the wrong layer.** The stack-teaching stage used
  `STACK[1]` as its worked example, and merging moved the digitizer entry to
  index 0 — so a stage about telling the TOUCH layer from the IMAGE layer
  would have used the image layer as its example of the touch one. No check
  saw it; reading the diff did.

### Drawn is not visible, and arithmetic will tell you otherwise

The light guide plate's extraction dots were correct geometry for four
attempts and rendered as **absolutely nothing** each time. They were tried
under the plate, on the reflector, coplanar with the plate's top face, and
finally 0.0025 units proud of it — positive, in the open air by the
arithmetic, and swallowed whole. Every render was read as "the dots must be
wrong". The dots were never wrong.

**Pulling the plate out of the part is what found it.** Rendered on their own
the dots were perfect, gradient and all. So the fault was in the gap under
them, not in them, and no amount of re-reading the builder was going to say
so. 0.0375 of clearance shows; 0.0025 does not.

The second half of the same lesson: **a mechanism you can see one end of is
not a mechanism.** The dots' whole point is DENSITY — sparse at the LED edge,
crowded at the far end, because the far end has less light left to work with.
Shortening the three films to uncover the plate opened three rows out of
thirteen, all from the same end. That is a patch of dots, not a gradient.

The obvious fix — slide the films sideways at full size, like a dealt hand —
was refused by `checkEveryLayerIsVisible`, and it was right to. This layer has
**0.1 of lateral slack** against the midframe below it, so there is nowhere to
slide to; a film moved far enough to uncover anything stops the frame reading
as a layer at all. The room had to come out of the sheets, so the films are
cut back along one long edge and cascade to the right, leaving a margin down
the left of the plate open for its whole length.

`checkTheDotsCanBeSeen` holds both halves and was calibrated **six for six**:
the sliver clearance, the films widened back over the plate, the films opening
only one dot a row, a flat dot count with no gradient in it, the films
deleted, and the dot rows deleted.

### The photographs are for shape, not grain

Established earlier on the rollers and unchanged: a phone photograph of a small
part carries silhouette, proportion, colour and hierarchy. It does not carry
micro-texture, and no amount of sharpening makes it. What these eight fixed was
never texture — it was that a projector has a trolley and a monitor has a
stand, and those are things you either know or invent.

### Depth arithmetic, three times

Larger z is NEARER the camera on these benches. A slab centred at z with depth
d has its **near** face at z + d/2, not z − d/2. Three parts were placed inside
the thing they were meant to sit on before that sank in — the workstation
monitor's panel twice, and the projector screen's white field once. Every one
of them rendered as if it did not exist, and the source looked correct in all
three cases. The pixel checks are what said otherwise.

### `tube` is not a ring

`tube` in `scene.js` is an **open-ended cylinder**: `size[1]` is its length
along the axis, not a section. `torus` is the ring, and its size is
`[diameter, section diameter]`. Three "sound rings" built from `tube` were
three thin barrels seen end-on; tripling the second number three times over is
what finally said the number did not mean what it looked like it meant.

### A texture's `repeat` is tiles per WORLD UNIT

Third time in this repo. `surface.js` already carried the note — "two to four
tiles across a part is the range that reads" — written after the same mistake
was made twice on a keyboard moulding. The desk went in at 0.9 on a 26-unit
board, which is twenty-three tiles, and rendered as woven fabric. **Read the
note in the file before setting the number.** 0.11 now. Strokes also have to be
drawn twice, offset by a whole tile, or their clipped ends line the seam.

Boards can carry a skin now; they could not before. The surface a thing stands
on is part of what the thing is, and a monitor on a wooden desk is the picture
a student actually has at home. Wood is outside the royal six, so it went to
the owner as a preview.

### Throw ratio is a number, not a feel

The first projector stood ten units from a twelve-unit image — a ratio under
one, which is an ultra-short-throw unit almost touching the wall. The room read
flat because it was flat. A hall projector is nearer **1.8 : 1**, and
`PRJ_THROW` derives the stand position from the image width so the whole
trolley moves as one.

### Do not replace a RANGE of a file across function boundaries

Rebuilding `gpuCard` with a slice from `function gpuCard` to `function plugIn`
deleted **eight functions that lived in between**: all seven power-on sign
builders and `ramSticks`. They had never been committed, so there was nothing
to restore from and they were rewritten from the session transcript.

Two rules out of it, and the second matters more:

- **Anchor an edit on the thing being edited**, not on the next thing along.
- **Commit when a suite goes green.** The workstation five passed 48 checks and
  sat uncommitted while four more parts were built on top of it. Nothing in
  this build is delivered by being correct in a working tree.

## The last three Core 1 sims: power, WAP and mobile

| sim | lands as | what it contributes |
|---|---|---|
| Power Source Drag & Drop | `power/chain` | what plugs into WHAT, and nine named devices across three sources |
| WAP Installation Simulation | `wap/terminate` | the connector AND the tool, then the run from the point to the switch |
| Mobile Device Troubleshooting | `mobile/firststep` | not what is wrong but what you do FIRST |

### A source sim can be wrong about safety, and this one is

The Power Source exercise marks **"the UPS plugs into the surge protector"**
correct. Every UPS manufacturer says the opposite, in the manual, in bold. A
UPS goes **straight into the wall**:

- it already contains surge suppression, so a strip in front is a second set of
  components doing the same job worse;
- it draws a large inrush when it charges and when it transfers, and a strip's
  breaker is sized for a load rather than for that — so it trips, dropping the
  very thing the UPS exists to hold up;
- a line-interactive unit reads the mains waveform to decide when to transfer,
  and a clamping circuit sits in the way of that.

The stage answers **wall**, keeps "a surge protector" as the near miss, and
says on screen that the original marks it the other way. `selfCheck` fails the
lab if anybody ever "corrects" it back — that assertion exists because the
whole stage was written to fix this, and a silent revert would leave it
teaching the thing it was built to correct. Same shape as the display lab's
contrast fix and the two answer keys in `Device Issue Diagnosis`.

**That is now four wrong answers found in the source sims.** Read every answer
key before porting it, and when one is wrong, fix it AND say so on screen —
the student who did the original deserves to know which one changed.

### `firststep` — "cheapest first" really means "cheapest that could work"

The mobile sim's own note says it: *"CompTIA-style troubleshooting rewards
checking settings and configuration first."* So the stage grades ORDER, and
`selfCheck` enforces the claim — every action carries a cost rank and the
answer must not be beaten by a cheaper one on the same list.

It fired immediately on real content, and it was **the rule that was wrong,
not the data**. Burn-in is answered "replace the display", which is the
dearest thing on its list, and the cheaper options are all things the user has
already done without knowing it — a restart and a weekend switched off are
exactly what clears image retention. So a case may now carry
`cheaperButCannot`, one sentence per cheaper option saying why it cannot work,
and that sentence is what the student is shown. An unexplained cheaper option
is the stage arguing against itself; an explained one is the lesson.

Thirteen cases, eight of the owner's plus five. One of them — the swollen
laptop battery — is the case where being right about the part and wrong about
the order gets somebody hurt, and both "replace the battery" and "run
diagnostics to confirm it" are on the list as near misses.

### `terminate` — the tool is half the answer

Every other stage in the WAP lab is about the air, and an access point with no
cable to it radiates nothing. Four cables, and **two of them take the same
connector and different tools** — solid core is punched down onto a jack,
stranded is crimped into a plug. `selfCheck` fails the lab if no two cables
demonstrate that, because the stage asserts the connector and the tool are
separate choices and the bench has to show it.

Part two's trap is the **back of the patch panel**: the one point in the run
that is terminated rather than plugged into. That is what makes a patch panel a
patch panel, and it is asserted so nobody softens it.

### Many items into one slot

`assign` held one item per slot — a drive into a bay, a part into a station.
Nine devices into three outlets could not be expressed at all. `q.multi` is the
other shape, and it inverts the state: **item -> slot**, because that is the
question being asked. Not "what is in this outlet" but "where does this device
go". Each item inside a slot is its own control, or it is a group you cannot
take anything back out of. Driven in `verify/assign-multi.mjs` rather than read.

### Nine grey boxes is not nine devices

`outletBench` obeyed one-colour-per-part and still rendered nine devices as a
single grey mass — the same adjacency failure as the impact bench's ribbon
cassette against its platen. Silhouette does much of the work (a tower, a panel
on a stand, a wide printer, a shade on a stem), and **value has to do the
rest**: a student who cannot pick the printer out of the row cannot check their
own answer against the picture. `OB_COLOUR` gives each one its own value, and
that colour is a property of the device — it does not change when the device is
assigned, because the bench never shows whether a choice was right.

## Six options: one right, five wrong

**Hard numbers from the owner.** Every single-choice question in every lab
offers exactly six options, one correct. `verify/six-options.mjs` enforces it
and runs inside `node verify/verify.mjs`.

Six rather than the nine first asked for, because **rung 3 of the hint ladder
strikes wrong options with a reason each and must leave two alive** — on a
field of nine that is either a wall of eight reasons, which hands over the
answer, or a strike too small to help. The change paid for itself immediately:
rung 3 now strikes **four and leaves two** in seven of the eight labs, where a
four-option field only ever let it strike two.

**Every wrong option is a near miss** — a mistake a technician actually makes.
Filler is eliminated without thinking, and elimination without thinking is not
what was asked for. The distractors that work best name a real thing that is
right for a *different* fault: the driver and cable on a thermal printer whose
label already proves the data arrived; encrypting print traffic against a page
already lying in the tray; DSC on an HDMI 1.4 port; a band mismatch when the
symptom moves with location.

**A wrong pick goes red and stays red** until the question is solved or the
step is reset, so the board carries the student's own eliminations. It is
marked three ways — colour, an inset rule, and the words — because red alone
is not a signal these students can rely on.

`assets/options.js` holds `sixOptions(list, salt)` for questions built by
mapping over a list whose length is whatever the subject happens to be. It is
deterministic from the scenario, and it **places the right answer at a slot
derived from its own score**: an earlier cut let the correct option land last
in 41% of seeds, which is a pattern a student learns instead of the content.

## Standing rules across the program

- **Students have eye damage from military service.** WCAG **AAA** is a
  first-class requirement: 7:1 body text, 4.5:1 large text (>=24px, or
  >=18.66px bold). Verify by sampling **painted pixels** on the rendered page,
  not by reading declared colours — a gradient background has no
  `background-color` to walk up to, and a checker that reads the cascade
  measures white text against white.
- **Instructor PIN: 3693.**
- **"Each time I add something new, add 5 additional scenarios on top of what
  is already built."**
- No build step, no framework, no runtime fetches. It must work from a memory
  stick in a room with no network.

## Calibrate before believing

Every check in this build must be shown to fail before its pass is trusted.
Plant the defect the check exists to catch and confirm it fires. This has paid
for itself repeatedly across this program — checks that reported their own
blind spot as a pass, a contrast sweep that never measured half the page, a
seam metric that would have rejected the tile already shipping.

**Written and reachable are different claims.** A registry can prove content
exists; only driving the page proves it renders.

**A calibration run has to be long enough to REACH the planted defect.** Two
new invariants on the display lab were planted against and came back clean at
8 seeds — not because the checks were wrong, but because 8 seeds of a six-fault
table never generated the fault the defect was planted in. A green line from a
short sweep says nothing at all. Calibrate at 60 seeds or more, and read the
distinct-variant count before believing the word "clean".

## Architecture

```
index.html              Shell: lab tabs, length dropdown, lab host
assets/style.css        AAA theme
assets/labs.js          Lab registry — metadata and tiered stage lists
assets/rng.js           Seeded RNG, so a scenario is reproducible from its seed
assets/app.js           Shell logic: tabs, length, progress memory
assets/lab-*.js         One module per lab: generator, stages, grading, hints
verify/                 Verification suite — run before every delivery
```

### The 3D layer

Ported from the FSC, unchanged, so fixes flow one way and there is one copy
of the engine's judgement rather than two:

```
assets/three.module.min.js   Three.js
assets/scene.js              mountScene(host, spec, opts) — draws, decides nothing
assets/shape.js              `repeat` and `ring` expanded into primitives
assets/surface.js            procedural materials
assets/tiles.js              texture tiles surface.js paints onto
assets/bench-*.js            One model per bench: state in, geometry out
```

**This section previously listed `assets/scene.js` as already present. It was
not — the file did not exist and the labs had no 3D in them at all.** The line
described an intention. It is true now; do not let it drift back.

**All eight benches are built.** RAID (caddies in a rack front), Build (board
on a mat), Printer (laser cutaway, seven stations in order), Power (supply,
loom, meter, load gauge), WAP (floor plan from above), Mobile (handset
exploded by layer), Networking (the path as a line of hops, each one unknown
until tested), Display (the monitor exploded upward, connectors along the
front), Thermal (a label printer with the lid open — platen above, head below,
the label that came out standing at the front), Impact (a dot matrix from
above — platen and tractor sprockets at the back, head on the rail in front,
ribbon cassette lifted clear, fanfold page standing at the left), Inkjet (an
all-in-one opened up — carriage on its 8mm shaft, encoder strip behind, both
cartridges, service station at the parking end, star wheels in front, scanner
bar lifted out onto the mat).

**`bench-printer.js` IS THE LASER BENCH, NOT A PRINTER BENCH.** It documents
`view.tech` as accepting all four technologies and then branches on laser and
nothing else, so passing it "inkjet" draws a laser cutaway with its seven
stations greyed out. That stub is why three separate benches had to be built.
Do not read that parameter as evidence the others were ever covered there.

**The OPC drum's coating is teal, and teal is outside the royal palette.**
Previewed and approved by the owner. It is not a decorative choice: a
photoconductor coating IS that colour — teal, green or blue depending on who
made it — and it is how a student recognises the part on sight and knows at a
glance where the coating has worn through to the aluminium underneath. A
recorded exception, like the thermal lever; do not "correct" it to green.

**The kapton over the cell's tab welds is AMBER, and amber is outside the
royal palette.** Previewed and approved by the owner. Polyimide film IS
amber — that is how a technician finds it, and it is the "do not short
these" marker on every lithium pack ever made, over two tabs about three
millimetres apart. A recorded exception, like the drum's teal and the
thermal lever's orange; do not "correct" it to yellow.

**The thermal lever is orange, and orange is outside the royal palette.** It
was previewed and the owner approved it on the grounds that the lever is orange
on the real machine precisely so a technician's eye finds it. That is a
recorded exception, not an oversight — do not "correct" it to red.

**MODELS ARE BUILT TO MIMIC THE REAL PART, IN DETAIL. THE OWNER HAS ASKED
FOR THIS MORE THAN ONCE, SO IT IS A REQUIREMENT AND NOT A PREFERENCE.**
A part is not finished when it is recognisable — it is finished when it
carries the features a technician would actually use to identify it and
judge it. The feed roller needed its knurled drive collar and its end
bushes; the separation pad needed its moulded seating rim, its chamfered
entry lip, its pivot posts and the ribs under the carrier. Resolution is
part of this: the pad's face at 9x7 tiles was a waffle of studs, and only
at 19x13 with the texture drawn as continuous ribs did it stop reading as
a diagram of a pad and start reading as a pad.

Two failure modes to watch, both of which have happened here:
- **Too coarse.** A grid so low that moulded texture reads as toy studs,
  or a worn profile with too few steps to read as a curve.
- **Too loud.** Chalky paper dust drawn near-white at nearly tile width
  became the loudest thing on the bench, over the bald zone that was the
  actual subject. Detail must not outshout the fault. And use a hash with
  a squared term for any scatter — a linear one lays flecks on visible
  diagonals, which reads as a printed pattern rather than contamination.

**OCCLUSION IS THE RECURRING ENEMY, AND IT IS DESIGNED OUT, NOT FOUGHT.**
Every bench cost renders to this before the rule was learned. Draw hardware
the way it really sits and the interesting parts hide behind each other: a
300mm graphics card covers the whole motherboard, a printer is a closed box
around a drum, a cable loom is a knot, a phone is a black rectangle. The
answers, in order of preference — a plan view (WAP), a side cutaway
(Printer), a flat schematic (Power), an exploded stack (Mobile), or move the
offending part off the board entirely (Build's GPU, which lies on the mat).

**On an exploded stack, occlusion can be COMPUTED, so compute it.** Display
was the first bench where the arrangement is regular enough to do the
arithmetic instead of taking renders and squinting. A sheet spanning depth
`PH` projects to a screen band of `PH * sin(pitch)`; two layers `gap` apart
have their centres `gap * cos(pitch)` apart; so neighbours stay clear exactly
when **`gap > PH * tan(pitch)`**. The first cut had a gap of 1.4 against a
required 3.09 and buried every layer including the driver board, which is the
whole point of the connect stage. `CAM_PITCH` and `LAYER_GAP` in
`bench-display.js` are therefore ONE decision, and a load-time assertion
fails the module if somebody changes one without the other.

**A symptom drawn on a part is an answer given away.** Display's artefacts —
banding, dead pixels, burn-in, the faint image under a torch — were painted
on the LCD panel's own face. Invisible at a shallow pitch, and worse than
invisible pedagogically: banding is a failed column driver on the DRIVER
board and a dark screen is the BACKLIGHT, so drawing either on the panel
told the student the wrong part. The symptom now stands at the front of the
mat on the customer's own screen; the stack behind it is the evidence.

**A BENCH FRAMED FOR ONE CANVAS WIDTH LOSES ITS ENDS ON A NARROWER ONE.**
The field of view is vertical, so a narrow panel shows *less* width at the
same camera distance. Three benches were silently cropping parts and nobody
could have caught it by looking, because a clipped edge reads as a deliberate
crop: the network bench lost the provider cloud below ~860px, the RAID bench
lost **bay 8, the front panel and the controller** at 860 and below — on the
lab whose entire interaction is "pull bay 6" — and the WAP bench lost the
Bluetooth halo at 720, on the stage that asks which source dominates.

The fix is `camera.fitWidth` in `scene.js`: the world-space width a bench must
always show. The camera backs off far enough to fit it at whatever aspect the
canvas currently has, so `dist` becomes the *closest* it will ever come rather
than the only distance it knows, and wide canvases are unaffected. It is
recomputed on resize, not just at mount.

`mountScene` returns **`frustumOK()`**, which projects every part's bounding
sphere and names anything crossing the left or right edge, and exposes the
live handle as `window.__SCENE`. Check framing with that, at several widths —
never by eye. Values for `fitWidth` are measured against it, not guessed.

**A CADDY FACE IS A STACK OF THINGS, AND THEY MUST NOT SIT ON EACH OTHER.**
Built against the owner's photographs of a Dell caddy half out of a chassis and
a close-up of one lit. Four features were missing and each is one a technician
actually uses: the BAIL HANDLE across the face (the thing you grab, and it was
a sliver down the edge), the four VENT WINDOWS, the CAPACITY PLATE, and — the
one that matters most — a separate FAULT lamp beside the activity lamp.

Activity and fault are TWO LAMPS on real hardware, not one lamp that changes
colour. A failed drive shows fault lit and activity dark; a rebuilding one
shows both. That is precisely why a rebuild and a failure look alike from the
aisle, which the lab's own text already said while the model contradicted it.

`LAMP_Y`, `HANDLE_Y`, `FAULT_Y`, `VENT_Y` and `PLATE_Y` in `bench-raid.js` are
ONE decision, and a load-time assertion checks every pair for overlap and for
running off the face. It was written to catch the fault lamp hiding behind the
bail, and on its first run it caught the ACTIVITY lamp doing the same — which
had been looked at in a render and not seen. Same rule as the display bench:
where the arrangement is regular, compute it rather than nudging numbers until
a picture looks right.

The chassis is near-black (`#2b3136`), not the light grey it was. Every rack in
the owner's photograph is matte near-black with the lamps as the only bright
points, and that hierarchy is the skill — finding the lit bay from the aisle.
The activity lens is SQUARE, as it is on the real machine, which also separates
the two lamps by shape and not only by colour.

**ONE COLOUR PER PART IS NOT ENOUGH — ADJACENT PARTS MUST DIFFER TOO.**
The impact bench drew the ribbon cassette at `#25292e` next to a platen at
`#2c3238`. Both rules were obeyed: one colour each, and each part its own. The
two simply read as a single black cylinder, and the cassette — a fault site —
was invisible. Check large neighbouring parts against each other, not only
against the rule.

**A DRAWING FAITHFUL TO THE HARDWARE CAN STILL BE THE WRONG DRAWING.** On a
real dot matrix the ribbon cassette clips down over the carriage and hides the
print head, which is the site of its most distinctive fault. Narrowing the
cassette was not enough. It is drawn **lifted clear**, which is where a
technician puts it to reach the head — so the picture matches the job even
though it does not match the closed machine.

**LOUDNESS SHOULD TRACK IMPORTANCE.** The inkjet encoder strip was first
drawn 1.5 units tall with high-contrast bars and became the single loudest
object on the bench — a barcode banner across the back — when the real thing
is a strip of film a student has to go and look for. Weight in the drawing is
a claim about what matters.

**Two rules the bench models must not break:**

1. **The canvas is scenery; the buttons are the interface.** Every part a
   student acts on exists first as a labelled, focusable HTML control. Turn
   WebGL off and the lab still works.
2. **One colour per part, so split anything that changes colour on its own.**
   A caddy coloured by drive state turns the row into a child's abacus; a
   panel coloured by array health turns the power button red when a disk
   dies. Both happened on the first cut. Lamps are their own parts.
