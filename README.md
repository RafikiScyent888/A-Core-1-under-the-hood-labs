# A+ Core1 Under the Hood Labs

Eight large, generated labs for CompTIA A+ 220-1201 — part of the **Cyber
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

## The eight labs

Tabs across the top — pick one.

| Lab | What you do |
| --- | --- |
| **RAID** | Pick the level the business needs, work out usable capacity and fault tolerance, watch parity being written, then lose a drive and nurse the rebuild |
| **Printer** | Laser, inkjet, thermal and impact. Choose the technology, deploy it, run three bench diagnostics and work a defect back to the step that caused it — then service the thermal label printer at the counter, where the paper is the ink, and the dot matrix in the despatch office, where two different faults produce exactly the same page and you have to test rather than look, and the inkjet on reception, where the two that look alike are separated by *when* the fault appears rather than what it looks like |
| **Workstation Build** | Gaming, CAD/CAM or virtualization host. Pull parts off a shelf, check they fit, power it on — and if it does not POST, that is yours to sort out |
| **Power** | Budget the load, cable the machine connector by connector, put a meter on the rails, size a UPS |
| **Wireless AP** | Survey the floor, site the AP on a plan with the readings updating live, plan channels around six sources of interference that stack |
| **Device & Mobile** | Phones and tablets. Digitizer or panel, swollen-cell safety, battery health, charging faults, sync and enrolment |
| **Networking & Infrastructure** | One path from the provider's handoff to the desk. Pick the link, pick the kit, open the ports the services need, then walk the path and find the break — plus consolidating a cupboard of servers onto one host and deciding what belongs in the cloud |
| **Display** | What a screen is made of, what can carry a picture into it, and why a dead backlight and a dead panel look identical from the front until you hold a torch to the glass |

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

## The 3D benches

Every lab has one: a real Three.js model of the hardware, with the controls
beside it.

| Lab | The bench |
| --- | --- |
| **RAID** | Eight hot-swap caddies seen the way you meet them, in the front of a rack. Pull one and live with it |
| **Workstation Build** | A motherboard on an anti-static mat. Sockets, memory channels, and a limit plane showing where the case panel actually sits |
| **Printer** | A laser cut open down its length, with all seven imaging stations laid out in the order they happen |
| **Power** | The supply, its loom fanning out to six connectors, a meter on the rails, and a bar showing the draw against the capacity |
| **Wireless AP** | The floor from above, materials named, and every interference source drawn as rings that overlap where they stack |
| **Device & Mobile** | The handset exploded layer by layer — glass, digitizer, panel, backlight — with a swollen cell lifting the whole stack |
| **Inkjet all-in-one** | Carriage on its polished shaft with both cartridges, the encoder strip it reads to know where it is, the service station that caps the nozzles when it parks, the feed rollers and star wheels, and the scanner bar lifted out onto the mat |
| **Dot matrix** | From above: platen and tractor sprockets across the back, the head riding its rail in front, the ribbon cassette lifted clear the way you lift it to reach the head, and the fanfold page it produced standing at the left with its sprocket holes down both edges |
| **Thermal label printer** | The lid open: platen roller above, print head below with the heating line across it, the gold flex tails at both ends, the roll feeding up through the nip — and the label that came out standing at the front, so the symptom is never drawn on the part that caused it |
| **Networking & Infrastructure** | The path drawn end to end as a line of hops — provider cloud, modem, router, switch, patch panel, wall port, desk — each one unknown until the student tests it |
| **Display** | The monitor exploded upward into its six layers, the customer's screen standing at the front showing the symptom, and every video connector along the bottom drawn to its own outline |

Every bench is checked at four canvas widths, because a model framed for a
wide panel quietly loses its ends on a narrow one — and a cropped edge looks
deliberate, so eyes never catch it. Three benches were doing exactly that:
the network path lost the provider handoff, the RAID chassis lost bay 8 and
the front panel, and the wireless plan lost the Bluetooth halo.

**The canvas is scenery. The buttons are the interface.** A WebGL canvas is
an opaque rectangle to a screen reader and does not reflow at 400% zoom, so
every part exists first as a labelled, focusable HTML control that says its
state in words. Turn WebGL off and the labs still work; you lose the picture
and nothing else. There is a test for that on all six.

Three.js loads only when a bench is actually drawn, so a student who wanted
one lab does not download the engine for six.

## Reading

A **dyslexia-friendly toggle** sits at the top of the page. It is applied
before the page paints and remembered across sessions, so nobody who needs it
has to watch the page reflow. Wider letter and word spacing, taller lines, a
shorter measure, no italics, nothing justified, no uppercase labels.

Nothing is downloaded for it. The font stack names OpenDyslexic, Atkinson
Hyperlegible and Lexend Deca first, so a machine that has one uses it, then
falls back through Verdana and Tahoma to faces every system ships.

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
assets/bench-*.js       One 3D model per lab: state in, geometry out
assets/array.js         What a RAID set actually is, as pure functions
assets/bench.js         The bench host: canvas plus real controls
assets/reading.js       The dyslexia-friendly toggle
assets/scene.js         The 3D engine, ported from the Field Service Center
assets/three.module.min.js
assets/style.css        AAA theme
verify/verify.mjs       Verification suite — 30 checks
CLAUDE.md               Full project context for anyone picking this up
```

No build step, no framework, and nothing is fetched at runtime — it works from a
memory stick in a room with no network.

## Verification

```
node verify/verify.mjs
```

39 checks across the eight labs: content generation over 240 seeds each, every
stage walked in a real browser, the hint ladder driven to its third rung, and
AAA contrast measured inside the running labs with the feedback and hint boxes
open — the loud state, not the calm one. One check holds the objective map: all
**27 sub-objectives of 220-1201 are covered**, no stage names an objective that
does not exist, and anything ever ruled out of scope has to be written down with
a reason rather than quietly dropped.

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
