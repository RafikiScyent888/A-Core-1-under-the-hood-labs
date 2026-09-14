# Photographs still wanted

`surface.js` has pointed at this file for a long time and it did not exist.
It does now, and it covers the models as well as the surfaces.

## How this is ranked

**A bench is either the ANSWER SURFACE or it is scenery**, and that decides
how much a wrong model costs.

- On `defect`, `fit`, `wear` and `pick` questions the student names or places
  a part **on the model**. Get the model wrong and the exercise teaches the
  wrong thing.
- On a `brief` or a `note` panel the model is there so the stage is not a
  wall of text. Get it wrong and it looks odd.

Everything in group 1 is an answer surface.

## What photographs are for, and what they are not

Settled earlier on the feed rollers and unchanged since: a phone photograph of
a part carries **silhouette, proportion, colour and hierarchy**. It does not
carry micro-texture, and no amount of sharpening makes it.

The eight photographs that came in for the workstation parts fixed none of
those things and all of the other ones — a projector has a trolley, a monitor
has a splayed stand, a graphics card is worth drawing with its cooler off.
Those are facts you either know or invent, and inventing them is what made the
first renders unrecognisable.

**Anything already photographed is not on this list**: the feed rollers, the
OPC drum, the separation pad, the fuser sleeve, the RAID caddy and drives, the
LSI controller, the thermal label printer, the OKI Microline, the HP Deskjet,
the workstation motherboard, cooler, graphics card and power supply, the
projector, the pull-down screen and the desk monitor — and, since the second
round, the **laser feed area**, the **fuser assembly**, the **handset midframe**,
a **cracked digitizer** and a **swollen cell beside a good one**.

**Two entries are struck through below rather than deleted**, with what each
photograph settled, because the point of this file is what is still wanted AND
what a photograph turned out to be worth. Group 1a and 1c are done. What is
left is 1b and group 2.

---

## GROUP 1 — the model is the answer

### 1a. The laser printer, opened up  ·  `bench-printer.js`  —  **DONE**

Five photographs came in and they closed this. What each one settled:

| shot | what it fixed |
|---|---|
| the **pickup area, annotated** by the owner | **two** separation pads, on the deck *facing* the tyres rather than under them, with a cream friction face on a moulded carrier; four tyres on ONE shaft; the **gear drive** on its near end; the **tray lift plate** on two coil springs |
| the **side cutaway** | the paper path, which confirmed the existing layout rather than correcting it — scanner on top, rollers stacked, fuser at the rear, exit out the top |
| the **fuser and toner out on the desk** | the fuser is a framed ASSEMBLY with a cable loom and a white connector, not two bare rollers. That is what "replace the fuser" actually buys |
| the **front opened**, twice | the OPC coating is a saturated green, and it runs along the lower face of the cartridge |

Three of the four things the owner labelled were **not in the model at all**,
and the fourth was one generic cylinder. What that cost, and the two rules it
re-taught, are written up in `CLAUDE.md`.

Nothing further wanted here.

### 1b. The six printer types side by side  ·  `bench-showroom.js`

The `choose` stage's entire question is telling six technologies apart on
sight, and **thermal against thermal-transfer differ by one ribbon spool**.
Seventeen builders, no photographs. If these silhouettes are wrong the stage
trains the wrong recognition.

Front three-quarter of each, whatever you have to hand:

- a desktop **laser**
- an **inkjet** all-in-one
- a **thermal** label printer (no ribbon)
- a **thermal transfer** label printer (ribbon fitted — the difference is the point)
- a **dot matrix**
- a **dye sublimation** photo printer

### 1c. The handset, layer by layer  ·  `bench-mobile.js`  —  **DONE**

Four photographs came in and they closed this too.

| shot | what it fixed |
|---|---|
| **two battery pouches, one tagged SWOLLEN** | the best shot on the whole list. The swollen one is the SAME colour and the SAME footprint as the good one; it domes and the foil creases. The model had it thicker and brown, both invented, and a colour tell here would teach a student to walk past a dangerous cell |
| the **midframe** | the antennas are round coax with **gold snap connectors**, not painted traces. A coax popped off during a screen swap is a real "no signal after repair"; a painted stripe cannot pop off anything. Also the screw bosses, the heat spreader and the charge-port board |
| a **cracked digitizer, picture still live** | one impact knot with radials AND concentric rings, and the display working underneath — which is the difference between a glass job and a panel job |
| a **laptop opened up** | context for the swollen-cell case in `firststep`. Not built as a model: laptops appear in this lab only for mobile-specific faults, and general laptop repair is the Field Service Center's job |

**Reopened, narrowly.** The four shots above closed the *shapes*. The stack
has since been rebuilt as modelled objects rather than photographs on flat
plates, and doing that turned up two things a photograph would settle in a
minute and geometry cannot settle at all:

- **A SWOLLEN L-19, shot the same way as the good one.** From directly
  above, same surface, same light, label text unchanged
  (`MODEL: L-19 · GOOD CELL | LI-ION · CAPACITY: 12.6Wh | VOLTAGE: 3.8V`).
  The reference card standing beside the bench currently shows a 41.4 Wh /
  11.4 V laptop cell, so the lesson it exists to teach — *the labels are
  identical, only the shape changed* — cannot be made yet. It is a one-line
  swap when the photograph arrives.
- **HIGHER-RESOLUTION REGENERATIONS, 1500–2000 px wide.** Every crop in
  `tiles.js` is upscaled about four times from a source around 470 px. That
  is why the lit screen and the back cover soften when the camera comes in
  close, and no amount of sharpening puts detail back that was never
  captured.

Neither is urgent. Both are cheap.

---

## GROUP 2 — the model carries the diagnosis

### 2a. The rack end of a network run  ·  `bench-net.js`

Five builders, no photographs, and now used twice: the networking lab walks
this path hop by hop, and the WAP lab's `terminate` stage reuses it.

- A small **comms cabinet**, door open.
- A **patch panel from the front**, with cords in some ports.
- **The back of the same panel** — the punched-down pairs. This is the trap the
  `terminate` question turns on and I have never seen the real thing at the
  angle I drew it.
- A **switch** with patch cords in it.
- A **wall outlet faceplate**, and the back of one if it is ever off the wall.
- A **modem or ONT** and a **router**, however domestic.

### 2b. A ceiling-mounted access point  ·  `bench-wap.js`

The floor plan is abstract and that is deliberate. The `install` stage is not —
it is about mounting the thing and getting power to it.

- An **AP on a ceiling or wall mount**, with the bracket visible.
- A **PoE injector**, and a switch port with PoE if the labelling shows.

---

## GROUP 3 — scenery, worth having, low stakes

- **`bench-office.js`** — the room, the back panel, the paper volume. Mostly
  abstract by design. A shot of a printer **in the place it actually lives**
  (behind a counter, on a trolley, in a corridor) would improve the `brief`
  stage's room.
- **`bench-power.js`** — its own PSU and loom predate the good one built for
  the workstation bench. That geometry can be reused rather than photographed.

---

## STILL OPEN, AND PROBABLY NOT ACHIEVABLE

Task #58: photographs for the **moulded**, **rubber** and **steel** painters in
`surface.js`. These are not shape shots — they are macro texture, filling the
frame with a few centimetres of surface.

**Say so honestly rather than keep asking.** Four rounds of tile-making on the
feed roller photographs established that a phone at normal distance does not
resolve rubber grain, and that high-passing an upscale manufactures a lattice
that was never in the material. Unless there is a macro lens or a very close
shot with good raking light, these three stay painted — and painted is a
perfectly good answer for a surface nobody is being asked to diagnose.

The one photographed surface in the build, `tyre`, works because it was cut at
native resolution from a barrel that filled the frame.
