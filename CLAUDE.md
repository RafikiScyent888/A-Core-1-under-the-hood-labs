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

Six large generated labs for CompTIA A+ 220-1201, built from the ideas in the
`Core-1-Sims` repo but sharing no code with it.

**`Core-1-Sims` is not touched, not merged, not retired.** It stays live
exactly as it is. It was the inspiration; this is a separate build. Do not
"finish the migration" — there is no migration.

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

## The six labs

Tabs across the top; the student picks which to do.

| Lab | Covers |
|---|---|
| **Printer** | Laser, inkjet, thermal AND impact — all four, because all four are on the exam. Laser gets the seven-step imaging process animated so a wrong drum or fuser shows the real defect. |
| **Workstation Build** | Gaming, CAD/CAM and virtualization host. NOT NAS or thin client — the owner chose these three. A bad build fails at POST and is diagnosed by the student. |
| **RAID** | 0, 1, 5, 6, 10, JBOD, hot spare. Capacity and fault tolerance as graded calculations. A live rebuild to nurse, including a second failure during it. |
| **Power** | All four of: budget the load then live with it, cable the build for real, UPS and protection sizing, measure and test. |
| **WAP** | At least six interferences. **Microwave is required** — the owner asked for it by name. |
| **Device & Mobile** | Phones and tablets as the core. Laptops appear ONLY for mobile-specific faults the FSC does not cover (swollen cells, digitizers, sync, MDM) — never general laptop repair, which is the FSC's job. |

### The six WAP interferences

Microwave oven (2.4GHz, intermittent), cordless phone or baby monitor (2.4GHz,
continuous), Bluetooth density (frequency hopping), neighbouring APs on
overlapping channels, building materials (concrete, metal, mirrors, water),
fluorescent ballasts (broadband noise). They should **stack**, so the student
works out which is dominant.

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

## Architecture

```
index.html              Shell: lab tabs, length dropdown, lab host
assets/style.css        AAA theme
assets/labs.js          Lab registry — metadata and tiered stage lists
assets/rng.js           Seeded RNG, so a scenario is reproducible from its seed
assets/app.js           Shell logic: tabs, length, progress memory
assets/lab-*.js         One module per lab: generator, stages, grading, hints
assets/scene.js         3D scene engine (ported from the FSC)
verify/                 Verification suite — run before every delivery
```
