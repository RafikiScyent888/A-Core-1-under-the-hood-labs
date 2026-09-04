# A+ Core1 Under the Hood Labs

Six large, generated labs for CompTIA A+ 220-1201 — part of the **Cyber
Warrior Program**. You build the thing, run it, see what it is actually
doing, and then live with whatever you chose.

**Live site:** https://rafikiscyent888.github.io/A-Core-1-under-the-hood-labs/

## What this is, and what it is not

This is **not** a second Field Service Center. The FSC is diagnostic — a ticket
arrives, you find the fault, order the part, prove the repair — and it already
covers RAID, power, printers, wireless and mobile. A lab that just presented a
fault to diagnose would be paying twice for coverage that already exists.

Under the Hood is the other half of the job:

1. **Mechanism is the spine.** Each lab shows the internals. What the RAID
   controller is doing during a rebuild. Where the RF actually goes. What the
   fuser does to toner. The point is *why*, not *what*.
2. **Consequence is how it is graded.** Choices are lived with rather than
   marked. An undersized supply browns out under load. A bad build fails to
   POST and you diagnose your own mistake. RAID 5 dies on the second failure
   during a rebuild.
3. **Project scale.** Each lab is a job — spec, build, configure, test, hand
   over — rather than a service call.

It is also **not** a replacement for [Core-1-Sims](https://rafikiscyent888.github.io/Core-1-Sims/),
which stays live exactly as it is. Those sims were the inspiration; this build
shares no code with them.

## The six labs

Tabs across the top — pick one.

| Lab | What you do |
| --- | --- |
| **RAID** | Pick the level the business needs, work out usable capacity and fault tolerance, watch parity being written, then lose a drive and nurse the rebuild |
| **Printer** | Laser, inkjet, thermal and impact. Choose the technology, deploy it, run three bench diagnostics and work a defect back to the step that caused it |
| **Workstation Build** | Gaming, CAD/CAM or virtualization host. Pull parts off a shelf, check they fit, power it on — and if it does not POST, that is yours to sort out |
| **Power** | Budget the load, cable the machine connector by connector, put a meter on the rails, size a UPS |
| **Wireless AP** | Survey the floor, site the AP on a plan with the readings updating live, plan channels around six sources of interference that stack |
| **Device & Mobile** | Phones and tablets. Digitizer or panel, swollen-cell safety, battery health, charging faults, sync and enrolment |

## Pick how long you have

A dropdown before you start, and it is not a truncation — each lab is authored
as a tiered stage list:

| Choice | Target |
| --- | --- |
| **Quick** | 10–20 minutes. The whole job at its shortest — good for repeating one you got wrong |
| **Lab** | 30–45 minutes. A class period, same job with the middle opened up |
| **Project** | An hour or more. Every stage, progress saved so you can come back |
| **Layered** | The Quick path, with each deeper stage offered as you reach it |

**The rule that makes this work:** the Quick path is a complete, coherent job on
its own. Longer choices *add* stages; they never unlock an ending the short path
was missing. It is the middle that stretches.

## For instructors

**Every lab attacks all four of the things students lose marks on**, and it does
so on the *short* path, because a student who only ever picks Quick is the one
who most needs all four:

| Gap | How it is addressed |
| --- | --- |
| **PBQs** — freezing on hands-on tasks | Things are done, not chosen from a list |
| **Fundamentals** — memorised without the why | The mechanism view is the point of each lab |
| **Calculation under pressure** | Capacity, wattage, VA, runtime and duty cycle are graded steps |
| **Reading the scenario** | Requirements are buried in customer waffle **on purpose** |

That last one is a design target rather than an accident. Customer briefs
contain irrelevant detail with the real specification inside it, and the hints
teach students to find it rather than handing it over.

**Students work these alone, as homework.** Nobody is standing behind them, so
every lab teaches itself:

- **Hints arrive after three wrong attempts and never give the answer.** Three
  rungs — where to look, then the principle, then the field narrowed with a
  reason attached to each option removed. At least two options always stay
  live, so the last step is the student's.
- **Wrong choices explain themselves.** A refused connector says why it is
  refused; a spare that does not fit says what it would cost the array.
- Progress is remembered in the browser, so a long lab survives a closed tab.

**Every scenario is generated from a seed**, shown on screen. A student can
report "seed 481203 marked me wrong" and the exact scenario comes back.

## Accessibility

Text meets **WCAG AAA** — 7:1 for body text, 4.5:1 for large text — verified by
screenshotting the rendered page with the glyphs hidden and sampling the pixels
the browser actually painted, rather than by reading declared colours.

The floor plan in the wireless lab names every material in text and in its
`aria-label`, not only in colour. Struck-out options at the last hint rung stay
readable rather than being dimmed into uselessness — the reason attached to each
one is the whole value of that rung.

## What is here

```
index.html              Shell: lab tabs, length dropdown, lab host
assets/labs.js          Lab registry — metadata and tiered stage lists
assets/runner.js        The stage engine every lab plugs into
assets/hints.js         The three-rung hint ladder
assets/rng.js           Seeded generation
assets/lab-*.js         One module per lab: generator, stages, grading
assets/style.css        AAA theme
verify/verify.mjs       Verification suite — 28 checks
CLAUDE.md               Full project context for anyone picking this up
```

No build step, no framework, and nothing is fetched at runtime — it works from a
memory stick in a room with no network.

## Verification

```
node verify/verify.mjs
```

28 checks across the six labs: content generation over 240 seeds each, every
stage walked in a real browser, the hint ladder driven to its third rung, and
AAA contrast measured inside the running labs with the feedback and hint boxes
open — the loud state, not the calm one.

Each check is **calibrated**: the defect it exists to catch is planted and the
check confirmed to fire before its pass is trusted. That discipline has earned
its place repeatedly here — the registry has rejected labs whose short path had
no calculation in it, and the generators have been caught producing scenarios
whose own correct answer was invalid.

## Hosting

GitHub Pages, deployed from `main` / root — Settings → Pages → Source: Deploy
from a branch → `main` → `/ (root)`.

## Disclaimer

For educational purposes only. Not affiliated with, endorsed by, or sponsored by
CompTIA®. All trademarks belong to their respective owners.
