/* =====================================================================
   RAID — the first lab, and the pattern the other five inherit.

   The Field Service Center already diagnoses a failed array. This does
   the other half: pick the level the business actually needs, build it,
   watch the controller work, then lose a drive and nurse the rebuild.

   THE MECHANISM IS THE POINT. Parity is the thing students memorise
   without understanding — "RAID 5 survives one drive" is a fact that
   survives no rewording at all. So the parity stage shows a stripe
   being written block by block, then a drive going dark, then the
   missing block being reconstructed by XOR against the survivors. Once
   somebody has watched that, "why not two drives" answers itself.

   Everything is generated from a seed, so a student can report "seed
   481203 marked me wrong" and the exact array comes back.
   ===================================================================== */
import { rng } from "./rng.js";
import { sixOptions } from "./options.js";
import { makeArray, pull, insert, tick, capacityTB, toleranceGuaranteed } from "./array.js";
import { raidBench, bayWords } from "./bench-raid.js";

/* ------------------------------------------------------------------
   RAID levels, with the properties every question here derives from.
   Nothing in this file hard-codes an answer; each one is computed from
   this table and the generated array, so a table edit cannot leave a
   stale answer behind somewhere.
   ------------------------------------------------------------------ */
export const LEVELS = {
  raid0: {
    name: "RAID 0", label: "RAID 0 — striping", min: 2, evenOnly: false,
    usable: function (n) { return n; },
    tolerate: function () { return 0; },
    write: 5, read: 5, cost: 5,
    good: "Every drive adds capacity and speed, with nothing held back.",
    bad: "No redundancy at all. Lose one drive and the whole array is gone."
  },
  raid1: {
    name: "RAID 1", label: "RAID 1 — mirroring", min: 2, evenOnly: true,
    usable: function (n) { return n / 2; },
    tolerate: function (n) { return n / 2; },  /* one per mirrored pair */
    write: 3, read: 4, cost: 2,
    good: "A complete second copy. Rebuilds are a straight copy, so they are quick and low-risk.",
    bad: "Half the raw capacity is spent on the copy. That gets expensive fast."
  },
  raid5: {
    name: "RAID 5", label: "RAID 5 — striping with parity", min: 3, evenOnly: false,
    usable: function (n) { return n - 1; },
    tolerate: function () { return 1; },
    write: 2, read: 4, cost: 4,
    good: "Only one drive's worth of capacity goes to parity, however many drives there are.",
    bad: "Survives one drive, not two — and the rebuild is exactly when the second one tends to go."
  },
  raid6: {
    name: "RAID 6", label: "RAID 6 — double parity", min: 4, evenOnly: false,
    usable: function (n) { return n - 2; },
    tolerate: function () { return 2; },
    write: 1, read: 4, cost: 3,
    good: "Survives two drives at once, which covers the second failure during a rebuild.",
    bad: "Two drives' worth of capacity gone, and writes carry a second parity calculation."
  },
  raid10: {
    name: "RAID 10", label: "RAID 10 — mirrored, then striped", min: 4, evenOnly: true,
    usable: function (n) { return n / 2; },
    tolerate: function (n) { return n / 2; },
    write: 5, read: 5, cost: 2,
    good: "Fast at both reading and writing, with no parity to calculate, and rebuilds are a plain copy.",
    bad: "Half the raw capacity gone. The most expensive way to get this much speed."
  },
  jbod: {
    name: "JBOD", label: "JBOD — just a bunch of disks", min: 2, evenOnly: false,
    usable: function (n) { return n; },
    tolerate: function () { return 0; },
    write: 3, read: 3, cost: 5,
    good: "Every byte is usable and the drives do not have to match.",
    bad: "Not RAID at all. No redundancy and no speed gain — it just concatenates."
  }
};

const CUSTOMERS = [
  { key: "clinic",  who: "Ridgeway Family Clinic",     size: "Small Business" },
  { key: "studio",  who: "Halcyon Post Production",    size: "Small Business" },
  { key: "law",     who: "Brennan & Cole LLP",         size: "Mid-Market" },
  { key: "school",  who: "Fairmont District Schools",  size: "Mid-Market" },
  { key: "bank",    who: "Meridian Savings",           size: "Major Corporation" },
  { key: "logi",    who: "Continental Freightways",    size: "Major Corporation" }
];

/* Each workload states, in customer language, what it actually needs.
   `wants` is the ground truth the whole scenario is graded against. */
const WORKLOADS = [
  {
    key: "db",
    what: "the patient records database",
    wants: { redundancy: 1, writeHeavy: true, capacityHungry: false },
    best: "raid10",
    said: [
      "the records system writes constantly all day — every appointment, every note",
      "we cannot be down for a morning while something copies itself back",
      "we are not storing much, honestly. It is all text"
    ]
  },
  {
    key: "video",
    what: "the working video store",
    wants: { redundancy: 1, writeHeavy: true, capacityHungry: true },
    best: "raid10",
    said: [
      "editors are pulling 4K straight off it while others are writing renders back",
      "if it stutters, three people stop working",
      "we shoot a lot. It fills up faster than anyone expects"
    ]
  },
  {
    key: "docs",
    what: "the document archive",
    wants: { redundancy: 1, writeHeavy: false, capacityHungry: true },
    best: "raid5",
    said: [
      "it is scanned case files. Written once, read for years afterwards",
      "we want as much of the space as we can get without losing everything to one dead disk",
      "nobody is writing to it in bulk — a few files a day"
    ]
  },
  {
    key: "archive",
    what: "the long-term compliance archive",
    wants: { redundancy: 2, writeHeavy: false, capacityHungry: true },
    best: "raid6",
    said: [
      "regulator says seven years, and losing it is not survivable for us",
      "the drives are large and they are all the same age, bought together",
      "it is read maybe twice a year"
    ]
  },
  {
    key: "scratch",
    what: "the render scratch space",
    wants: { redundancy: 0, writeHeavy: true, capacityHungry: true },
    best: "raid0",
    said: [
      "everything on it is regenerated from source overnight if we lose it",
      "what we need is raw speed, as much as the drives can give",
      "do not spend money on protecting it. It is genuinely disposable"
    ]
  },
  {
    key: "vm",
    what: "the virtual machine datastore",
    wants: { redundancy: 2, writeHeavy: true, capacityHungry: true },
    best: "raid6",
    said: [
      "forty machines live on it and they all write at once",
      "we had a rebuild fail last year when a second disk went during it, and I will not go through that again",
      "the drives are big, and big drives take a long time to rebuild"
    ]
  }
];

/* Customer waffle. Reading the brief is one of the four gaps, so the
   requirement is buried in ordinary talk rather than bulleted. */
const NOISE = [
  "The last people who touched this left no documentation at all.",
  "Whatever you do, it has to be in before the end of the quarter.",
  "I am not technical, so tell me in plain terms what you are doing.",
  "The server room is the old stationery cupboard, if that matters.",
  "We had a consultant in last year who quoted us a fortune for something.",
  "My nephew said we should just use the cloud for all of this.",
  "Do not worry about the old tape drive, nobody has used it since 2019."
];

const DRIVE_SIZES = [2, 4, 6, 8, 12, 16];
const DRIVE_RPM = [7200, 10000, 15000];

export function generate(seed) {
  const r = rng(seed);
  const customer = r.pick(CUSTOMERS);
  const workload = r.pick(WORKLOADS);
  const best = LEVELS[workload.best];

  /* Pick a drive count the intended level actually accepts. Generating
     a scenario whose own answer is illegal is the kind of bug that only
     shows up on the seed a student happens to get, so the count is
     derived from the level rather than chosen and hoped over. */
  let counts = [4, 5, 6, 8].filter(function (n) {
    return n >= best.min && (!best.evenOnly || n % 2 === 0);
  });
  const n = r.pick(counts);
  /* PICKED FROM THE MIDDLE OF EACH RANGE, and that is correctness rather
     than taste. The build shelf needs a drive SMALLER than the array's, one
     LARGER, and one SLOWER — three distinct, nameable mistakes. Pick 16 TB,
     the top of the range, and there is no larger drive to offer: the decoy
     falls back to the same size as the matched set, and the student is
     handed a wrong answer they cannot tell from a right one. Nothing would
     report it — the stage builds, the shelf populates, the check runs. */
  const size = r.pick(DRIVE_SIZES.slice(1, -1));
  const rpm = r.pick(DRIVE_RPM.slice(1));

  const drives = [];
  for (let i = 0; i < n; i++) {
    drives.push({ bay: i + 1, size: size, rpm: rpm, type: r.pick(["SATA", "SAS"]), state: "ok" });
  }

  const said = r.shuffle(workload.said.concat(r.some(NOISE, 2)));

  return {
    seed: seed,
    customer: customer,
    workload: workload,
    said: said,
    drives: drives,
    n: n,
    size: size,
    rpm: rpm,
    best: workload.best,
    usableTB: best.usable(n) * size,
    tolerate: best.tolerate(n),
    /* Which bay dies later, fixed at generation so the whole run is
       reproducible from the seed rather than re-rolled per stage. */
    failBay: r.int(1, n),
    /* The spares on the shelf. Exactly one matches on both capacity and
       speed; the others each fail for one clear, teachable reason. */
    spares: buildSpares(r, size, rpm),
    /* The drives on the shelf for the BUILD, which is a different set from
       the spares kept back for a failure. */
    shelf: buildShelf(r, n, size, rpm)
  };
}

/* WHAT IS ON THE SHELF WHEN YOU GO TO BUILD IT.

   `n` matched drives — exactly enough, so a student cannot succeed by
   filling every bay and hoping — and three that fit physically and are
   each wrong in a different, nameable way:

     - one SMALLER. An array uses only as much of each member as its
       smallest, so this silently shrinks every other drive to its size.
     - one SLOWER. An array runs at the speed of its slowest member.
     - one LARGER. Legal, works perfectly, and the customer has paid for
       capacity the array will never address. The hardest of the three to
       argue against and the one people fit without thinking.

   Interface is mixed across the matched set and is NOT a fault: the `fail`
   stage already teaches that SATA and SAS rebuild the same, and two stages
   of one lab must not contradict each other. */
function buildShelf(r, n, size, rpm) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ key: "d" + i, size: size, rpm: rpm,
      type: r.pick(["SATA", "SAS"]), match: true });
  }
  const smaller = DRIVE_SIZES.filter(function (x) { return x < size; });
  const larger = DRIVE_SIZES.filter(function (x) { return x > size; });
  const slower = DRIVE_RPM.filter(function (x) { return x < rpm; });
  /* No fallbacks. Failing loudly at generation beats a shelf where one
     wrong answer is identical to a right one. `size` and `rpm` are chosen
     away from the ends of their ranges precisely so this cannot fire. */
  if (!smaller.length || !larger.length || !slower.length) {
    throw new Error("raid: a build shelf needs a smaller, a larger and a slower drive than " +
      size + "TB/" + rpm + "rpm, and the range does not hold all three.");
  }
  out.push({ key: "small", size: smaller[smaller.length - 1], rpm: rpm,
    type: "SATA", match: false, fault: "small" });
  out.push({ key: "slow", size: size, rpm: slower[slower.length - 1],
    type: "SAS", match: false, fault: "slow" });
  out.push({ key: "big", size: larger[0], rpm: rpm,
    type: "SATA", match: false, fault: "large" });
  return r.shuffle(out);
}

function buildSpares(r, size, rpm) {
  const smaller = DRIVE_SIZES.filter(function (s) { return s < size; });
  const bigger = DRIVE_SIZES.filter(function (s) { return s > size; });
  const slower = DRIVE_RPM.filter(function (v) { return v < rpm; });
  const out = [
    { key: "match", size: size, rpm: rpm, type: "SATA", ok: true,
      why: "Same capacity, same speed. The array rebuilds onto it at full width." },
    { key: "small", size: smaller.length ? r.pick(smaller) : size, rpm: rpm, type: "SAS", ok: false,
      why: "Smaller than the others. The array can only use as much of each drive as its smallest member, so this shrinks the whole thing — and it will not fit the existing stripe at all." },
    { key: "slow", size: size, rpm: slower.length ? r.pick(slower) : rpm, type: "SATA", ok: false,
      why: "Right capacity, but slower than the rest. Every read that touches this drive waits for it, so the whole array runs at this drive's speed." }
  ];
  if (bigger.length) {
    out.push({ key: "big", size: r.pick(bigger), rpm: rpm, type: "SAS", ok: false,
      why: "Bigger than the others, and the extra is wasted — the array uses only as much as its smallest member. Not wrong so much as money thrown away." });
  }
  /* Deliberately NOT a wrong reason: drive type. SATA against SAS does
     not stop a rebuild, and teaching that it does would be teaching a
     falsehood. The matching spare is SATA and one wrong one is SAS on
     purpose, so type cannot be used as a shortcut. */
  return r.shuffle(out);
}

/* ------------------------------------------------------------------
   Stages
   ------------------------------------------------------------------ */

function briefPanel(s) {
  return {
    kind: "brief",
    from: s.customer.who + " — " + s.customer.size,
    paragraphs: ["We need you to sort out storage for " + s.workload.what + "."]
      .concat(s.said.map(function (t) { return "“" + t + "”"; }))
  };
}

function arrayPanel(s, title, note) {
  return {
    kind: "table",
    title: title || "What is in the chassis",
    columns: ["Bay", "Capacity", "Speed", "Interface", "State"],
    rows: s.drives.map(function (d) {
      return { cells: [d.bay, d.size + " TB", d.rpm + " rpm", d.type, d.state === "ok" ? "Healthy" : d.state],
               flag: d.state === "ok" ? null : "bad" };
    }),
    note: note
  };
}

/* The XOR frames. This is the mechanism the whole lab is built around. */
function parityFrames(s) {
  const n = Math.min(s.n, 5);
  const cols = [];
  for (let i = 0; i < n; i++) cols.push({ name: "Bay " + (i + 1), sub: s.size + " TB" });
  const data = [1, 0, 1, 1, 0, 1].slice(0, n - 1);
  const parity = data.reduce(function (a, b) { return a ^ b; }, 0);

  function row(vals, tones, subs) {
    return vals.map(function (v, i) {
      return { label: v, tone: tones ? tones[i] : null, sub: subs ? subs[i] : null };
    });
  }
  const dataTones = data.map(function () { return "data"; });

  return [
    { columns: cols,
      caption: "One stripe across the array. The first " + (n - 1) + " drives hold data blocks; the last holds parity for this stripe.",
      rows: [row(data.concat(["?"]), dataTones.concat(["parity"]),
                 data.map(function () { return "data"; }).concat(["parity"]))] },
    { columns: cols,
      caption: "Parity is the XOR of the data blocks: " + data.join(" ⊕ ") + " = " + parity +
               ". That is all it is — one bit per position saying whether the data bits summed to odd or even.",
      rows: [row(data.concat([parity]), dataTones.concat(["parity"]))] },
    { columns: cols.map(function (c, i) { return i === 1 ? { name: c.name, sub: "FAILED", state: "dead" } : c; }),
      caption: "Bay 2 dies. Its block is gone — but every other block in the stripe, including parity, is still here.",
      rows: [row(data.map(function (v, i) { return i === 1 ? "✕" : v; }).concat([parity]),
                 dataTones.map(function (t, i) { return i === 1 ? "dead" : t; }).concat(["parity"]))] },
    { columns: cols.map(function (c, i) { return i === 1 ? { name: c.name, sub: "rebuilding", state: "rebuild" } : c; }),
      caption: "XOR the survivors and the missing block falls out: " +
               data.filter(function (_, i) { return i !== 1; }).concat([parity]).join(" ⊕ ") +
               " = " + data[1] + ". The controller does this for every stripe on the drive.",
      rows: [row(data.map(function (v, i) { return i === 1 ? v : v; }).concat([parity]),
                 dataTones.map(function (t, i) { return i === 1 ? "rebuild" : t; }).concat(["parity"]))] },
    { columns: cols.map(function (c, i) { return (i === 1 || i === 3) ? { name: c.name, sub: "FAILED", state: "dead" } : c; }),
      caption: "Now lose a SECOND drive before that finishes. Two unknowns, one equation. Nothing can recover this stripe — " +
               "and that is the whole reason RAID 6 carries a second parity block.",
      rows: [row(data.map(function (v, i) { return (i === 1 || i === 3) ? "✕" : v; }).concat([parity]),
                 dataTones.map(function (t, i) { return (i === 1 || i === 3) ? "dead" : t; }).concat(["parity"]))] }
  ];
}

function levelOptions(s) {
  const best = s.best;
  const w = s.workload.wants;
  return Object.keys(LEVELS).map(function (k) {
    const L = LEVELS[k];
    const legal = s.n >= L.min && (!L.evenOnly || s.n % 2 === 0);
    let why;
    if (k === best) {
      why = L.good + " That is what this job asked for.";
    } else if (!legal) {
      why = L.name + " needs at least " + L.min + " drives" +
        (L.evenOnly ? " and an even number of them" : "") + ". You have " + s.n + ".";
    } else if (L.tolerate(s.n) < w.redundancy) {
      why = "Survives " + L.tolerate(s.n) + " drive" + (L.tolerate(s.n) === 1 ? "" : "s") +
        ". They told you they need to survive " + w.redundancy + ".";
    } else if (w.writeHeavy && L.write <= 2) {
      why = "Write performance is this level's weak point, and this array is written to constantly.";
    } else if (w.capacityHungry && L.usable(s.n) <= s.n / 2) {
      why = "Gives up " + Math.round((1 - L.usable(s.n) / s.n) * 100) + "% of the raw capacity, " +
        "and they told you space is tight.";
    } else if (L.tolerate(s.n) > w.redundancy && L.usable(s.n) < LEVELS[best].usable(s.n)) {
      why = "More protection than they asked for, paid for in capacity they said they needed.";
    } else {
      why = L.bad;
    }
    return { key: k, label: L.label, correct: k === best, why: why };
  });
}

/* ---------------------------------------------------------------------
   The live bench for the rebuild stage.

   The array lives on the scenario rather than in here, so redrawing the
   stage does not silently reset a rebuild the student is halfway through.
   Same reason the bench host holds no state: one source of truth.

   array.js decides everything; this only translates between the lab's
   scenario and the bench's controls. It does not know what RAID 5 is
   either — it asks. --------------------------------------------------- */
/* The lab keys its levels `raid5`; array.js keys them "RAID 5", because
   that is what it prints and what a student answers with. Handing one to
   the other unmapped made array.js reject the level outright and report
   every scenario as LOST before the student had touched anything — the
   stage opened on a dead array. Its own `name` is the bridge. */
function levelName(s) {
  const L = LEVELS[s.best];
  return (L && L.name) || s.best;
}

function liveArray(s) {
  if (!s.live) {
    const members = Math.max(3, s.drives.length);
    s.live = makeArray({ level: levelName(s), memberCount: members,
                         sizeTB: s.size, spares: 0, bayCount: 8 });
    /* The failed drive is already out and a replacement is already in and
       rebuilding — the stage is called "nurse the rebuild", so the student
       arrives partway through rather than starting it. */
    /* A level with no redundancy has no rebuild to nurse, and staging a
       failure into one just hands the student a dead array on arrival.
       They get the same bench, intact, and the lesson is that there is
       nothing to nurse — which is the honest thing RAID 0 teaches. */
    const bay = Math.min(members, Math.max(1, s.failBay)) - 1;
    const rebuildable = toleranceGuaranteed(levelName(s), members) > 0;
    if (rebuildable) {
      pull(s.live, bay);
      insert(s.live, bay, { sizeTB: s.size });
      tick(s.live, 25);
    }
    /* One older drive is warning about itself, and its lamp is amber —
       the same amber as the disk being rebuilt onto. That collision is
       the whole trap and it is deliberate. */
    const warn = s.live.bays.findIndex(function (b, i) {
      return b.role === "member" && i !== bay && b.state === "ok";
    });

    if (warn >= 0) s.live.bays[warn].state = "predictive";
  }
  return s.live;
}

/* A RACK THAT IS NOT THE STUDENT'S ARRAY.

   `benchPanel` below draws the live array with every bay's real state on
   it, which is right on the stages where the student is working that
   array and wrong on the ones that teach a mechanism — a row of lamps
   saying "degraded" beside a question about what parity STORES is the
   picture answering a question it was not asked.

   This draws a stated arrangement instead: a fixed set of bay states
   passed in, identical on every seed, so the model carries the mechanism
   and no information about this scenario. Nothing here is clickable for
   the same reason — a control that reports a state is a control carrying
   a verdict.

   THE CONTROLS STILL EXIST AND STILL SPEAK. Turn the canvas off and the
   bays are still a list with their states in words, which is the rule
   the whole bench layer is built on. */
function statedRackPanel(o) {
  const view = { level: o.level, arrayState: o.arrayState || "healthy",
                 focus: null, bays: o.bays };
  return {
    kind: "bench", title: o.title, intro: o.intro, height: o.height || 380,
    bench: {
      spec: function () { return raidBench(view); },
      status: function () { return { tone: o.tone || "calm", words: o.words, detail: o.detail }; },
      controls: function () {
        return raidBench(view).parts.filter(function (p) {
          /* One control per bay, not three. The lamp and its surround are
             drawn as separate parts so each can carry one colour; read
             out as separate buttons they are "Bay 3, Bay 3 activity lamp,
             Bay 3 fault lamp" down a column of twenty-four. */
          return !/well$|lamp$|fault$/.test(p.key);
        }).map(function (p) {
          return { key: p.key, label: p.label, state: "na",
                   stateWords: p.spec || "In the chassis", detail: p.note };
        });
      },
      onAction: function () { return {}; }
    }
  };
}

function benchPanel(s) {
  const A = liveArray(s);
  const TONE = { healthy: "calm", degraded: "warn", rebuilding: "warn",
                 critical: "urgent", lost: "dead" };
  const WORD = { healthy: "Healthy", degraded: "Degraded", rebuilding: "Rebuilding",
                 critical: "Critical", lost: "Array lost" };

  function members() {
    return A.bays.filter(function (b) { return b.role === "member"; }).length;
  }

  return {
    kind: "bench",
    title: "The array, in front of you",
    intro: "Every bay here is a real control. You can do anything to it that you could do " +
      "standing at the rack \u2014 including the thing that loses the lot.",
    height: 380,
    bench: {
      spec: function () {
        return raidBench({
          level: A.level,
          arrayState: A.status === "lost" ? "critical" : A.status,
          focus: null,
          bays: A.bays.map(function (b) {
            return { state: b.state, sizeTB: b.sizeTB || undefined };
          })
        });
      },
      status: function () {
        const n = members();
        let detail = A.level + ", " + n + " members \u2014 " +
          capacityTB(A.level, n, A.sizeTB) + " TB usable, survives " +
          toleranceGuaranteed(A.level, n) + ".";
        if (A.status === "rebuilding") detail += " Rebuild " + A.rebuildPct + "% complete.";
        if (A.status === "lost") detail = "The data is gone. A new disk will not bring it back.";
        return { words: WORD[A.status] || A.status, tone: TONE[A.status] || "calm", detail: detail };
      },
      controls: function () {
        return A.bays.map(function (b, i) {
          const acts = [];
          if (A.status !== "lost") {
            if (b.state === "ok" || b.state === "active" || b.state === "predictive" ||
                b.state === "rebuilding" || b.state === "spare") {
              acts.push({ id: "pull", label: "Pull",
                hint: "Withdraw this caddy from the chassis" });
            }
            if (b.state === "failed" || b.state === "pulled" || b.state === "empty") {
              acts.push({ id: "fit", label: "Fit a " + s.size + " TB drive" });
            }
            if (i === A.rebuildInto) acts.push({ id: "wait", label: "Let it run" });
          }
          return {
            key: "bay" + (i + 1),
            label: "Bay " + (i + 1),
            state: b.state,
            stateWords: bayWords(b.state),
            detail: b.role === "member" ? b.sizeTB + " TB member" : "No drive fitted",
            actions: acts
          };
        });
      },
      onAction: function (key, id) {
        const i = parseInt(key.replace("bay", ""), 10) - 1;
        if (id === "pull") return { say: pull(A, i).why, flash: key };
        if (id === "fit") return { say: insert(A, i, { sizeTB: s.size }).why, flash: key };
        if (id === "wait") {
          const done = tick(A, 25);
          return { flash: key, say: done
            ? "Rebuild complete. Every block has been reconstructed from parity and the set is " +
              "whole again \u2014 this is the first moment since the failure that it could " +
              "survive another one."
            : "Rebuild at " + A.rebuildPct + "%. While this runs there is no redundancy left, " +
              "and every surviving member is being read end to end \u2014 which is exactly " +
              "when an older disk tends to give up." };
        }
        return {};
      }
    }
  };
}

export function buildStage(key, s) {
  const L = LEVELS[s.best];

  if (key === "brief") {
    const w = s.workload.wants;
    return {
      title: "Work out what they actually need",
      intro: "They will not tell you in the right words. Read what they said and turn it into requirements.",
      panels: [briefPanel(s)],
      questions: [{
        key: "brief-needs", kind: "multi",
        prompt: "Which of these did they actually tell you? Pick every one.",
        detail: "Two of these are things they said. The rest are assumptions.",
        hints: [
          "Go back through the quotes one at a time. Two of them are about what the storage has to DO; the rest is chat.",
          "A requirement is something you could test the finished array against. “We want it fast” is not one; “three editors read 4K off it at once” is."
        ],
        options: [
          { key: "red", label: "It has to survive " + w.redundancy + " drive failure" + (w.redundancy === 1 ? "" : "s"),
            correct: w.redundancy > 0, why: w.redundancy > 0
              ? "Yes — that is what they were describing when they talked about not being able to lose it."
              : "No. They told you the opposite: everything on it is regenerated overnight." },
          { key: "write", label: "It is written to heavily, not just read",
            correct: !!w.writeHeavy, why: w.writeHeavy
              ? "Yes — constant writing was the first thing they mentioned."
              : "No. They described it as written once and read for years afterwards." },
          { key: "cap", label: "Capacity is tight and they want as much usable space as possible",
            correct: !!w.capacityHungry, why: w.capacityHungry
              ? "Yes — they told you it fills up faster than expected."
              : "No. They said they are not storing much." },
          { key: "cloud", label: "They want it moved to the cloud", correct: false,
            why: "Somebody's nephew said that. It is not a requirement." },
          { key: "quarter", label: "It must be finished this quarter", correct: false,
            why: "A deadline, not a storage requirement. It does not change which level you pick." }
        ],
        explain: "Requirements first, level second. Pick the level before you know what it has to do and you are guessing."
      }]
    };
  }

  if (key === "level") {
    return {
      title: "Choose the level — and be able to say why not the others",
      intro: "Every one of these is a legitimate choice for SOME job. The skill is saying which job.",
      panels: [briefPanel(s), arrayPanel(s, "What you have to work with",
        s.n + " drives, all " + s.size + " TB at " + s.rpm + " rpm."),
        statedRackPanel({
          title: "The drives, before anybody has decided anything",
          intro: "Eight identical bays, and the level is not one of the things in front of "
            + "you. RAID 0, 1, 5, 6 and 10 all look EXACTLY like this from the aisle — same "
            + "chassis, same caddies, same green lamps — because the level is a decision the "
            + "controller makes about how to use them, not a property of the hardware. That "
            + "is why you cannot walk up to a rack and tell whether the data on it is "
            + "protected, and why the one thing worth writing on the label is the level.",
          level: "Not configured yet",
          bays: [{ state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
                 { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
                 { state: "empty" }, { state: "empty" }],
          words: "Six drives fitted, no array built",
          detail: "Identical on every run of this stage. What changes between the levels is "
            + "how much of this you get to use and how many of these bays can die — and "
            + "neither of those is visible here."
        })],
      questions: [{
        key: "level-pick", kind: "choice",
        prompt: "Which level does this job call for?",
        hints: [
          "Start by crossing off anything that cannot survive as many drive failures as they need. That usually removes half the list.",
          "Of the ones left, the deciding factor is whichever of speed or capacity they made a point of. A level that protects more than they asked for is not free — it is paid for in space."
        ],
        options: levelOptions(s),
        explain: L.good
      }]
    };
  }

  if (key === "capacity") {
    return {
      title: "How much of it can they actually use?",
      intro: "This is the number customers argue about, because raw capacity and usable capacity are not the same and nobody tells them.",
      panels: [arrayPanel(s), {
        kind: "note", title: "Where the capacity goes",
        paragraphs: [
          "Raw capacity is simply every drive added up: " + s.n + " × " + s.size + " TB = " + (s.n * s.size) + " TB.",
          "Usable capacity is what is left after the level takes its share. " + L.name +
            " gives you " + L.usable(s.n) + " drives' worth out of " + s.n + "."
        ]
      }],
      questions: [
        { key: "cap-usable", kind: "number",
          prompt: "Usable capacity of a " + L.name + " array of " + s.n + " × " + s.size + " TB drives?",
          unit: "TB", answer: s.usableTB, tolerance: 0.01,
          hints: [
            "The note above tells you how many drives' worth you get. Multiply that by the size of one drive.",
            "Parity levels cost you a fixed number of drives no matter how many you have; mirrored levels cost you half of whatever you have. Work out which kind this is first."
          ],
          explain: L.usable(s.n) + " drives' worth × " + s.size + " TB = " + s.usableTB + " TB usable out of " +
            (s.n * s.size) + " TB raw." },
        { key: "cap-tol", kind: "number",
          prompt: "How many drives can fail at once without losing data?",
          unit: "drives", answer: s.tolerate, tolerance: 0,
          hints: [
            "Count the redundancy the level carries, not the number of drives in the chassis.",
            "Single parity covers one loss however wide the array is. Double parity covers two. A mirror covers one per pair."
          ],
          explain: L.name + " on " + s.n + " drives tolerates " + s.tolerate + "." }
      ]
    };
  }

  /* =====================================================================
     POPULATE — the Core 1 RAID Configuration Challenge, on the chassis.

     Source: `Core-1-Sims/RS's Raid config1.2.html` — "drag drives into the
     server bays to meet the customer's requirements", with a table of
     minimum disks, redundancy and usable capacity beside it.

     Its companion, RAID Troubleshooting Challenge, is deliberately NOT
     brought across. The `fail` stage below already does everything it does
     and more: it makes the student probe every bay to find which one died
     rather than being told, then match a spare on capacity and speed while
     learning that interface does not matter. Duplicating it would cost a
     stage and teach nothing new.

     What the configuration sim has that this lab did not is the ACT. The
     lab could choose a level and calculate usable capacity; it could not
     put drives in a machine. So this is that — and the three drives left on
     the shelf are where the teaching is, because each one fits, each one
     works, and each costs something different.
     ===================================================================== */
  if (key === "populate") {
    const L = LEVELS[s.best];

    /* Declared before the panels, because the chassis reads this question's
       live placement state to draw itself. */
    const POPQ = {
      key: "pop-fill", kind: "assign",
      prompt: "Fit the drives.",
      detail: "Pick a drive, then click the bay it goes in. Click a filled bay to take it out again.",
      hints: [
        "Count first. " + L.name + " needs at least " + L.min + " drives, and this job was " +
          "sized at " + s.n + ". Filling every bay you have is not the same as building what " +
          "was specified.",
        "An array is only as big as its smallest member and only as quick as its slowest. Look " +
          "at what every drive has in common before you look at any one of them.",
        "Three of those drives differ from the rest. One would shrink the array, one would slow " +
          "it, and one would work perfectly while wasting the customer's money."
      ],
      items: s.shelf.map(function (d) {
        return { key: d.key, label: d.size + " TB",
          sub: d.rpm.toLocaleString() + " rpm · " + d.type };
      }),
      slots: (function () {
        const out = [];
        for (let i = 1; i <= 8; i++) out.push({ key: "bay" + i, label: "Bay " + i });
        return out;
      })(),
      check: function (filled) {
        const keys = Object.keys(filled).filter(function (k) { return filled[k]; });
        const fitted = keys.map(function (k) {
          return s.shelf.filter(function (d) { return d.key === filled[k]; })[0];
        });
        if (!fitted.length) return { ok: false, why: "Nothing fitted yet." };
        if (fitted.length < L.min) {
          return { ok: false, why: fitted.length + (fitted.length === 1 ? " drive" : " drives") +
            " cannot make " + L.name + " at all — it needs at least " + L.min +
            ". The controller will refuse to build it." };
        }
        if (L.evenOnly && fitted.length % 2 !== 0) {
          return { ok: false, why: L.name + " pairs its drives, so it needs an even number. " +
            "An odd drive has nothing to mirror with." };
        }
        const sizes = fitted.map(function (d) { return d.size; });
        const rpms = fitted.map(function (d) { return d.rpm; });
        const minSize = Math.min.apply(null, sizes), maxSize = Math.max.apply(null, sizes);
        const minRpm = Math.min.apply(null, rpms), maxRpm = Math.max.apply(null, rpms);
        if (minRpm !== maxRpm) {
          return { ok: false, why: "You have mixed " + maxRpm.toLocaleString() + " rpm with " +
            minRpm.toLocaleString() + " rpm. An array runs at the speed of its slowest member, " +
            "so every fast drive in there is now working at " + minRpm.toLocaleString() +
            " — and the customer paid for the fast ones." };
        }
        if (minSize !== maxSize) {
          return { ok: false, why: "You have mixed " + maxSize + " TB with " + minSize +
            " TB. An array uses only as much of each member as its smallest, so every " +
            maxSize + " TB drive in there is behaving like a " + minSize + " TB one. " +
            (minSize < s.size ? "That is capacity the customer bought and cannot reach."
                              : "That is capacity they bought and will never address.") };
        }
        if (fitted.length !== s.n) {
          return { ok: false, why: "All matched, which is the hard part — but this job was " +
            "sized at " + s.n + " drives and you have fitted " + fitted.length + ". " +
            (fitted.length > s.n
              ? "The extra one is not protecting anything. If you meant it as a hot spare, that " +
                "is a separate decision and a spare is configured, not just left in a bay."
              : "Short of the design, the usable capacity and the fault tolerance are both " +
                "below what was quoted.") };
        }
        if (fitted.some(function (d) { return !d.match; })) {
          return { ok: false, why: "The right number, and they agree with each other — but " +
            "one of these is not from the matched set the job was quoted on. Check the figures " +
            "against the drives still on the shelf." };
        }
        return { ok: true, why: "That is the array that was specified: " + s.n + " matched " +
          s.size + " TB at " + s.rpm.toLocaleString() + " rpm." };
      },
      explain: "Matched drives, the number the design called for, and three left on the shelf " +
        "you can account for: one too small, which would have shrunk every other drive to its " +
        "size; one too slow, which would have held the whole array back; and one too large, " +
        "which would have worked perfectly while wasting the customer's money. Interface was " +
        "the one difference that did not matter — SATA and SAS sit in the same array quite " +
        "happily."
    };

    return {
      title: "Build the array",
      intro: "The chassis is empty and the drives are on the shelf. Put in what this job needs " +
        "— no more and no fewer — and be ready to say why you left the rest.",
      panels: [{
        /* THE CHASSIS, WITH ITS BAYS EMPTY, filling as the student works.

           A stage about physically filling a machine that does not show the
           machine is a table with a story attached. It reads POPQ.fitState,
           the live placement the runner hangs on the question, so a bay
           lights up as it is filled. */
        kind: "bench", height: 320,
        bench: {
          spec: function () {
            const P = (POPQ.fitState && POPQ.fitState.placed) || {};
            const bays = [];
            for (let i = 1; i <= 8; i++) {
              const d = s.shelf.filter(function (x) { return x.key === P["bay" + i]; })[0];
              bays.push(d ? { state: "ok", sizeTB: d.size } : { state: "empty" });
            }
            return raidBench({ level: s.best, arrayState: "building", focus: null, bays: bays });
          },
          status: function () {
            const P = (POPQ.fitState && POPQ.fitState.placed) || {};
            const n = Object.keys(P).filter(function (k) { return P[k]; }).length;
            return { tone: n === s.n ? "calm" : "warn",
              words: n + " of " + s.n + " fitted",
              detail: n === s.n ? "The design is full. Now check what you put in it."
                                : "An empty bay is not a fault. A short array is." };
          },
          controls: function () {
            const P = (POPQ.fitState && POPQ.fitState.placed) || {};
            const out = [];
            for (let i = 1; i <= 8; i++) {
              const d = s.shelf.filter(function (x) { return x.key === P["bay" + i]; })[0];
              out.push({ key: "bay" + i, label: "Bay " + i, state: d ? "ok" : "idle",
                stateWords: d ? (d.size + " TB · " + d.rpm.toLocaleString() + " rpm · " + d.type)
                              : "empty" });
            }
            return out;
          },
          onAction: function () { return {}; }
        }
      }, {
        kind: "table", title: "What each level needs",
        columns: ["Level", "Minimum drives", "Survives", "Usable of the raw"],
        rows: Object.keys(LEVELS).map(function (k2) {
          const x = LEVELS[k2];
          return { cells: [x.name, String(x.min),
            x.tolerate(s.n) + (x.tolerate(s.n) === 1 ? " drive" : " drives"),
            Math.round(x.usable(s.n) / s.n * 100) + "%"] };
        })
      }, {
        kind: "note", title: "The job",
        paragraphs: [
          "You settled on " + L.name + " for " + s.customer.who + ", across " + s.n + " drives.",
          "Everything on that shelf will physically fit and spin up. That is not the test."
        ]
      }],
      questions: [POPQ]
    };
  }

  /* =====================================================================
     LOGS — the Core 1 RAID Troubleshooting Challenge, on the chassis.

     Source: `Core-1-Sims/RS's RAID replace.html` — "click each drive to
     review logs, remove failed drives and replace with a spare that matches
     or exceeds its capacity and speed".

     THIS DELIBERATELY OVERLAPS `fail`, AND THAT IS THE POINT. Both find a
     dead drive and replace it; they are two different ways in to the same
     objective, because students do not all learn the same way. `fail` hands
     you an INSTRUMENT — run a health check across the bays and read the
     numbers it returns. This hands you the MACHINE: click a caddy, read
     what that drive has logged about itself, and decide. One is a
     technician with a diagnostic tool; the other is a technician with a
     rack in front of them. A student who bounces off one may well get it
     from the other.

     It also teaches something `fail` cannot, because the two stages
     disagree on purpose:

       - `populate`, building new: a LARGER drive is wrong. It works, and
         the customer has paid for capacity the array will never address.
       - here, replacing a failure: a larger drive is RIGHT, or at least
         acceptable. The array is degraded, the part on the shelf is what
         you have, and "matches or exceeds" is the actual rule.

     Same fact — an array uses only as much of each member as its smallest
     — and two different right answers depending on whether you are
     specifying or recovering. That distinction is worth a stage on its own.
     ===================================================================== */
  if (key === "logs") {
    const r = rng(s.seed + 907);
    /* What each drive has logged about itself. The failed one is obvious
       ONCE READ, and invisible until then — which is the whole exercise. */
    const hours = 8000 + r.int(0, 22000);
    const logs = s.drives.map(function (d) {
      const dead = d.bay === s.failBay;
      /* One healthy drive carries a few reallocated sectors, because a
         non-zero count is not by itself a failure and a student who
         condemns the first drive with any number on it has learned the
         wrong lesson. */
      const noisy = !dead && d.bay === ((s.failBay % s.n) + 1);
      return {
        bay: d.bay, dead: dead, noisy: noisy,
        size: d.size, rpm: d.rpm, type: d.type,
        text: dead
          ? "SMART: FAILED. Reallocated sectors 2,048 (threshold 36). Pending sectors 190. " +
            "Uncorrectable errors 41. Read test: no readable surface. Powered on " +
            hours.toLocaleString() + " hours."
          : noisy
            ? "SMART: OK. Reallocated sectors 6 (threshold 36). Pending sectors 0. " +
              "Uncorrectable errors 0. Read test: complete, no errors. Powered on " +
              (hours - r.int(100, 900)).toLocaleString() + " hours."
            : "SMART: OK. Reallocated sectors 0 (threshold 36). Pending sectors 0. " +
              "Uncorrectable errors 0. Read test: complete, no errors. Powered on " +
              (hours - r.int(100, 900)).toLocaleString() + " hours."
      };
    });
    const read = {};
    const dead = logs.filter(function (l) { return l.dead; })[0];
    const noisy = logs.filter(function (l) { return l.noisy; })[0];

    /* The spares for a REPLACEMENT, which is a different shelf from the
       build one: matching, larger, faster, smaller, slower. */
    const repl = [
      { key: "exact", label: "Exact match", sub: s.size + " TB · " + s.rpm.toLocaleString() + " rpm",
        ok: true,
        why: "The right answer, and the one to reach for. Same capacity, same speed, nothing wasted and nothing held back." },
      { key: "bigger", label: "Larger capacity", sub: (s.size * 2) + " TB · " + s.rpm.toLocaleString() + " rpm",
        ok: true,
        why: "Acceptable, and worth understanding why. The array will only use " + s.size + " TB of it, so you are paying for capacity you cannot reach — but the array rebuilds and the customer is protected tonight. \"Matches or exceeds\" is the rule when you are recovering. It is NOT the rule when you are specifying a new array." },
      { key: "faster", label: "Faster", sub: s.size + " TB · " + (s.rpm === 10000 ? "15,000" : "15,000") + " rpm",
        ok: true,
        why: "Also acceptable. It will run at the speed of the rest of the set, so the extra is wasted — but it exceeds rather than falls short, and nothing is held back." },
      { key: "smaller", label: "Smaller capacity", sub: (s.size / 2) + " TB · " + s.rpm.toLocaleString() + " rpm",
        ok: false,
        why: "No. The array needs " + s.size + " TB from every member and this cannot give it. The controller will refuse it, and if it did accept it every other drive would be capped at " + (s.size / 2) + " TB." },
      { key: "slower", label: "Slower", sub: s.size + " TB · 7,200 rpm",
        ok: false,
        why: "It will fit and it will rebuild — and then every drive in the set runs at 7,200 rpm for as long as it is in there. \"Matches or exceeds\" covers speed as well as size." },
      { key: "ssd", label: "An SSD off the shelf", sub: s.size + " TB · solid state",
        ok: false,
        why: "Tempting, and it is the one people try. Mixing a solid-state drive into a set of spinning ones gives you an array with wildly uneven latency and, on most controllers, a refusal. Replace like with like." }
    ];

    return {
      title: "Read the drives, then replace the one that has gone",
      intro: "The controller says the array is degraded and has not said which drive. Every bay " +
        "has been logging what it thinks of itself — go and read them.",
      panels: [{
        kind: "bench", height: 360,
        bench: {
          spec: function () {
            return raidBench({
              level: s.best, arrayState: "degraded", focus: null,
              /* NOTHING IS MARKED. The failed bay is drawn exactly like the
                 rest until the student has read its log; a bench that shows
                 the answer is a catalogue. */
              bays: s.drives.map(function () { return { state: "ok" }; })
            });
          },
          status: function () {
            const n = Object.keys(read).length;
            return { tone: "warn", words: "Array degraded",
              detail: n + " of " + s.n + " drive logs read." };
          },
          controls: function () {
            return logs.map(function (l) {
              return { key: "bay" + l.bay, label: "Bay " + l.bay,
                state: read[l.bay] ? (l.dead ? "bad" : "ok") : "idle",
                stateWords: read[l.bay] ? (l.dead ? "SMART FAILED" : "SMART OK") : "not read yet",
                detail: read[l.bay] ? l.text : (l.size + " TB · " + l.rpm.toLocaleString() + " rpm · " + l.type),
                actions: [{ id: "read", label: "Read log",
                  hint: "Pull this drive's own SMART report" }] };
            });
          },
          onAction: function (bayKey) {
            const b = parseInt(bayKey.replace("bay", ""), 10);
            read[b] = true;
            const l = logs.filter(function (x) { return x.bay === b; })[0];
            return { say: "Bay " + b + " — " + l.text };
          }
        }
      }, {
        kind: "note", title: "Before you condemn anything",
        paragraphs: [
          "A reallocated sector count above zero is not a failure. Every drive develops a few and " +
            "maps them out; that is what the spare sectors are for. What matters is whether the " +
            "count is anywhere near the threshold, whether it is still climbing, and whether the " +
            "surface can still be read.",
          "Read all of them before you decide. One reading on its own tells you about one drive."
        ]
      }],
      questions: [{
        key: "log-which", kind: "choice",
        prompt: "Which drive has failed?",
        detail: "Go on what the logs say, not on which bay looks likeliest.",
        hints: [
          "Read every bay before you answer. If you have not opened them all, you are guessing between the ones you have.",
          "A non-zero reallocated count is normal. Compare each number against the THRESHOLD beside it, and look at whether the surface still reads.",
          "One drive reports no readable surface at all. That is not a drive that is degrading — it is a drive that has gone."
        ],
        options: sixOptions(logs.map(function (l) {
          return { key: "bay" + l.bay, label: "Bay " + l.bay, correct: l.dead,
            why: l.dead
              ? "Yes — 2,048 reallocated against a threshold of 36, and no readable surface. That is gone, not going."
              : l.noisy
                ? "The one that catches people out. Six reallocated sectors against a threshold of 36 is a healthy drive doing what drives do. Note it and move on."
                : "Bay " + l.bay + " reports zero reallocated, zero pending and a clean read test." };
        }).concat([
          { key: "none", label: "None of them — the readings are all within tolerance", correct: false,
            why: "Always worth considering, and it is the right answer more often than people expect. It is not this one: a drive with no readable surface is not within anybody's tolerance." },
          { key: "backplane", label: "The backplane, not a drive", correct: false,
            why: "The conclusion when several adjacent bays report together, or when a known-good drive fails in the same slot. One bay reporting differently from the rest points at the drive in it." }
        ]), s.seed + 311),
        explain: "Bay " + s.failBay + ". The array is running on its redundancy until that is replaced, " +
          "and every hour it stays degraded is an hour with no protection."
      }, {
        key: "log-spare", kind: "choice",
        prompt: "Which spare do you fit?",
        detail: "The array is degraded now. You are recovering, not specifying.",
        hints: [
          "The rule when you are REPLACING is not the rule when you are building. Ask what the array actually needs from this member, and what it does with anything more.",
          "Three of these six will rebuild the array successfully. Two of the three waste something; one of them does not.",
          "Anything that falls SHORT on capacity or speed is out. Anything that exceeds will work — the array simply ignores the excess."
        ],
        options: sixOptions(repl.map(function (x) {
          return { key: x.key, label: x.label + " — " + x.sub, correct: x.key === "exact", why: x.why };
        }), "exact", s.seed + 313),
        explain: "An exact match is what you fit if you have one. Larger or faster will rebuild the " +
          "array and protect the customer tonight, which is why the rule is \"matches or exceeds\" " +
          "— but note that the same larger drive would have been the WRONG answer when you " +
          "were specifying the array new, because then you were buying capacity nobody could use. " +
          "Smaller or slower is refused or drags the whole set, and an SSD among spinning disks is " +
          "a different animal altogether."
      }]
    };
  }

  if (key === "fail") {
    /* WAS: "Bay 3 has failed — pick a spare." That hands over the
       diagnosis and leaves only the shopping. Now the student runs a
       health check across every bay, works out which one has gone from
       the readings, and puts the right spare in the RIGHT bay — two
       decisions in one action, which is what the job actually is. */
    const dead = s.drives.filter(function (d) { return d.bay === s.failBay; })[0];
    const points = s.drives.map(function (d) {
      const bad = d.bay === s.failBay;
      return {
        key: "bay" + d.bay,
        label: "Bay " + d.bay,
        sub: d.size + " TB · " + d.rpm + " rpm",
        reading: bad ? "FAILED — 0 sectors readable" : "OK — 0 reallocated",
        expected: "healthy is 0 reallocated sectors and a readable surface",
        bad: bad
      };
    });
    return {
      title: "Something has gone wrong with the array",
      intro: "The controller is reporting the array as degraded. It has not told you which drive, so find out.",
      panels: [arrayPanel(s, "The array as the controller sees it",
        "Degraded — still serving, but with no protection left."), {
        kind: "table", title: "Spares on the shelf",
        columns: ["Spare", "Capacity", "Speed", "Interface"],
        rows: s.spares.map(function (sp, i) {
          return { cells: ["Spare " + (i + 1), sp.size + " TB", sp.rpm + " rpm", sp.type] };
        })
      }],
      questions: [{
        key: "fail-find", kind: "probe",
        instrument: "Drive health — SMART",
        prompt: "Check every bay.",
        detail: "Click a bay to read its health.",
        hints: [
          "Read all of them before deciding. A single reading tells you about one drive, not about the array.",
          "You are looking for the one that disagrees with the others. Healthy drives report zero reallocated sectors and a readable surface."
        ],
        points: points,
        then: {
          kind: "choice",
          prompt: "Which bay has failed?",
          hints: [
            "One of the readings you just took is not like the others. Go back over them.",
            "A degraded array means exactly one drive is gone on a single-parity level. Find the reading that says the surface cannot be read."
          ],
          options: sixOptions(s.drives.map(function (d) {
            return { key: "bay" + d.bay, label: "Bay " + d.bay, correct: d.bay === s.failBay,
              why: d.bay === s.failBay
                ? "Right — no readable sectors at all. That is a dead drive, not a marginal one."
                : "Bay " + d.bay + " reported healthy: zero reallocated sectors and a readable surface." };
          }).concat([
            /* TWO CONCLUSIONS THAT ARE NOT A BAY AT ALL, so a small array
               still offers six and \u2014 more to the point \u2014 so
               "which bay" is not the only shape an answer can take. Both
               are real findings from a real set of readings. */
            { key: "none", label: "No bay has failed \u2014 every reading is within tolerance",
              correct: false,
              why: "A genuine outcome of a probe, and always worth considering before you condemn " +
                "a drive. It is not this one: one of the readings you took is plainly unlike the " +
                "others. An all-clear is a finding, but only when it is true." },
            { key: "backplane", label: "The backplane, not a drive \u2014 the fault follows the slot",
              correct: false,
              why: "The right conclusion when several adjacent bays report together, or when a " +
                "known-good drive fails in the same slot. One bay behaving differently from the " +
                "rest points at the drive in it." }
          ]), s.seed + 71),
          explain: "Bay " + s.failBay + ". The array is running on its redundancy until that is replaced."
        }
      }, {
        key: "fail-spare", kind: "assign",
        prompt: "Put the right spare into the right bay.",
        detail: "Pick a spare, then click the bay it goes in. Click a filled bay to take it back out.",
        hints: [
          "Two things have to be right here: which bay you fill, and which spare you put in it. Getting one right is not enough.",
          "Compare each spare against the drives still in the chassis. Two properties have to match and one genuinely does not matter — an array runs at the speed of its slowest member and uses only as much of each drive as its smallest."
        ],
        items: s.spares.map(function (sp, i) {
          return { key: sp.key, label: "Spare " + (i + 1), sub: sp.size + " TB · " + sp.rpm + " rpm · " + sp.type };
        }),
        /* Every bay is a slot, so choosing the bay is part of the task
           rather than something the prompt gives away. */
        slots: s.drives.map(function (d) { return { key: "bay" + d.bay, label: "Bay " + d.bay }; }),
        check: function (filled) {
          const used = Object.keys(filled).filter(function (k) { return filled[k]; });
          if (!used.length) return { ok: false, why: "Nothing fitted yet." };
          if (used.length > 1) {
            return { ok: false, why: "Only one drive has failed. Pulling a healthy one out of a degraded array is how a one-drive problem becomes a total loss." };
          }
          const bay = used[0];
          if (bay !== "bay" + s.failBay) {
            return { ok: false, why: "That bay reported healthy. Replacing a good drive in a degraded array takes out your last copy of the data." };
          }
          const sp = s.spares.filter(function (x) { return x.key === filled[bay]; })[0];
          return { ok: !!sp.ok, why: sp.why };
        },
        explain: "Right bay, right spare. Capacity and speed have to match; interface does not — SATA and SAS rebuild the same."
      }]
    };
  }

  if (key === "parity") {
    const dataN = Math.min(s.n, 5) - 1;
    return {
      title: "Watch parity being written",
      intro: "This is the part that gets memorised instead of understood. Step through it once and it stops being a fact to remember.",
      panels: [statedRackPanel({
        title: "The drives one stripe is spread across",
        intro: "A stripe is not a thing on a disk — it is a ROW running across all of them at "
          + "the same offset. Five bays here, so five blocks in the row: four carrying data "
          + "and one carrying the arithmetic worked out from those four. Every stripe puts "
          + "that fifth block on a different drive, which is why there is no such thing as "
          + "“the parity disk” on RAID 5.",
        level: "RAID 5",
        bays: [{ state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "empty" }, { state: "empty" }, { state: "empty" }],
        words: "Five drives, all online",
        detail: "This rack is the same on every run of this stage — it is here to show what a "
          + "stripe spans, not to tell you anything about your own array."
      }), { kind: "mech", title: "One stripe, start to finish", frames: parityFrames(s) }],
      questions: [{
        key: "parity-what", kind: "choice",
        prompt: "What is actually stored in the parity block?",
        hints: [
          "Look at frame 2 again. The caption spells out the arithmetic.",
          "It is not a copy of anything. It is one value computed FROM the others, such that any one missing value can be worked back out."
        ],
        options: [
          { key: "xor", label: "The XOR of the data blocks in that stripe", correct: true,
            why: "Right. One bit per position, saying whether the data bits summed odd or even — which is enough to reconstruct any single missing block." },
          { key: "copy", label: "A second copy of the data blocks", correct: false,
            why: "That is mirroring, not parity. A copy would cost a whole drive's worth per drive; parity costs one drive total." },
          { key: "index", label: "An index of which blocks live on which drive", correct: false,
            why: "The controller knows the layout from the array geometry. It does not need to store a map in the stripe." },
          { key: "check", label: "A checksum used to detect corruption", correct: false,
            why: "Parity can detect a problem, but its job here is RECONSTRUCTION — working a lost block back out, not flagging a bad one." }
        ,
            { key: "hash", label: "A hash of the stripe, so the controller can tell if it changed",
              correct: false,
              why: "A hash would let it DETECT damage and leave it unable to repair anything. " +
                "Parity has to be reversible \u2014 you must be able to work a missing block back " +
                "out of it, and you cannot run a hash backwards." },
            { key: "map", label: "The order the blocks were written in, so the stripe can be reassembled",
              correct: false,
              why: "The layout is fixed by the array's geometry and the controller already knows " +
                "it. Spending a whole drive's worth of space on something it can calculate would " +
                "be a poor trade." }
          ],
        explain: "Parity is arithmetic, not a copy. That is why it costs one drive instead of half of them."
      }, {
        key: "parity-two", kind: "choice",
        prompt: "Frame 5 — why can a single-parity array not recover from two dead drives?",
        hints: [
          "Frame 4 recovers one missing block. Look at what it needed in order to do it.",
          "You are solving for the unknowns in a stripe. Count how many unknowns there are and how many equations you have."
        ],
        options: [
          { key: "unknowns", label: "Two unknowns, and only one equation to solve them with", correct: true,
            why: "Exactly. One parity block gives you one equation. Two missing blocks give you two unknowns, and there is no unique solution." },
          { key: "slow", label: "It could, but it would take too long", correct: false,
            why: "It is not a time problem. The information required to reconstruct those blocks is not present anywhere in the array." },
          { key: "ctrl", label: "The controller refuses to try", correct: false,
            why: "The controller is not being cautious. There is genuinely nothing left to compute from." },
          { key: "corrupt", label: "The parity block gets corrupted when a drive fails", correct: false,
            why: "Parity is fine — it sits on a healthy drive. The problem is that one equation cannot resolve two unknowns." }
        ,
            { key: "space", label: "There is not enough spare capacity to rebuild two drives at once",
              correct: false,
              why: "Capacity is not what is missing. Fit six blank drives and it still cannot be " +
                "done \u2014 the information needed to reconstruct the second drive was never " +
                "written down anywhere." },
            { key: "order", label: "It can, but only if the two drives failed in a known order",
              correct: false,
              why: "The order changes nothing. Two unknowns and one equation is two unknowns and " +
                "one equation whichever of them went first." }
          ],
        explain: "One parity block, one recoverable drive. That is the whole of it — and it is why RAID 6 exists."
      }]
    };
  }

  if (key === "rebuild") {
    const hours = Math.round((s.size * 1000) / 90 / 60 * 10) / 10;
    const members = Math.max(3, s.drives.length);

    /* A LEVEL WITH NO REDUNDANCY HAS NO REBUILD.

       This stage used to run its rebuild script over every scenario,
       including the 42 in 240 where the generator picks RAID 0 — telling a
       student "the spare is in and the array is rebuilding" about a set
       that cannot rebuild, and then asking how many hours it would take.
       A student who understood RAID 0 properly would have been marked
       wrong for saying so.

       So the stage splits. Same bench, same length, and the lesson is the
       one RAID 0 actually has to teach: there is no window, because there
       is no net. */
    if (toleranceGuaranteed(levelName(s), members) === 0) {
      return {
        title: "There is nothing to nurse",
        intro: "The array is intact and running. That is the whole problem with this stage — " +
          levelName(s) + " has no redundancy, so there is no rebuild to watch and no window to " +
          "get through. Pull a caddy and see what happens instead.",
        panels: [benchPanel(s), {
          kind: "note", title: "What no redundancy actually means",
          paragraphs: [
            levelName(s) + " spreads data across every member with nothing held back to " +
              "reconstruct from. Lose one drive and you have not lost a fraction of the data " +
              "proportional to that drive \u2014 you have lost the set, because a file is " +
              "striped across all of them.",
            "Recovery is not a rebuild. It is recreating the array and restoring from backup, " +
              "which is the moment everybody finds out whether the backup was working. That is " +
              "the trade this workload accepted in exchange for the speed and the full capacity."
          ]
        }],
        questions: [
          { key: "rb0-cost", kind: "choice",
            prompt: "A drive dies in this array on a Tuesday afternoon. What happens next?",
            hints: [
              "Start from what is physically on the surviving drives. Is any complete file among them?",
              "There is no parity anywhere in this set, so ask what the controller would reconstruct FROM."
            ],
            options: [
              { key: "restore", label: "The array is gone; recreate it and restore from backup", correct: true,
                why: "Yes. With nothing held back to reconstruct from, the set is unrecoverable and " +
                  "the backup is the only route home." },
              { key: "part", label: "You lose only the files that lived on that drive", correct: false,
                why: "Files are striped across every member, so almost every file has a piece on the " +
                  "drive that died. There is no clean subset that survives." },
              { key: "rebuild", label: "Fit a replacement and let it rebuild", correct: false,
                why: "There is nothing to rebuild from. A rebuild reconstructs a missing member out " +
                  "of parity or a mirror, and this set has neither." },
              { key: "degraded", label: "It runs degraded until you can replace the drive", correct: false,
                why: "Degraded is a state a redundant array can be in. This one has no redundancy to " +
                  "spend, so it does not degrade \u2014 it stops." }
            ,
            { key: "controller", label: "The controller rebuilds it from the remaining drives overnight",
              correct: false,
              why: "There is nothing to rebuild FROM. Redundancy is not something the controller " +
                "provides on top; it is something an array either stores or does not, and this one " +
                "stores none of it." },
            { key: "recover", label: "A recovery service can pull most of it back from the surviving drives",
              correct: false,
              why: "They will pull back fragments \u2014 pieces of files striped across the drives " +
                "that survived, mostly unusable, at considerable cost. Never plan on this: it is " +
                "what you do when the plan already failed." }
          ],
            explain: "No parity, no mirror, no rebuild. Speed and full capacity were bought with " +
              "exactly this risk, which is why this level belongs on data you can regenerate." },
          { key: "rb0-why", kind: "choice",
            prompt: "So why would anybody accept that for this workload?",
            hints: [
              "Look back at what the customer said they were storing, and where the real copy of it lives.",
              "The question is never \"is this risky\" \u2014 it is \"what does losing it actually cost this business\"."
            ],
            options: [
              { key: "regen", label: "The data on it can be regenerated, so an outage costs time rather than work", correct: true,
                why: "That is the whole case for it. Scratch space, render caches and working copies of " +
                  "something held elsewhere are cheap to lose and expensive to slow down." },
              { key: "cheap", label: "It is the cheapest option per usable terabyte", correct: false,
                why: "It gives you every terabyte you paid for, which is true \u2014 but JBOD does that " +
                  "too without striping the risk across every file, so cost alone does not choose it." },
              { key: "backup", label: "Because the nightly backup makes redundancy unnecessary", correct: false,
                why: "A backup limits how much you lose, not whether you go down. Restoring a large " +
                  "array takes hours the business still has to absorb." },
              { key: "never", label: "Nobody should ever accept it", correct: false,
                why: "Too strong, and it is the answer that costs marks. It is the right choice for " +
                  "data that is fast to reproduce and painful to wait for." }
            ,
            { key: "fast", label: "It is the fastest arrangement for this kind of work", correct: false,
              why: "It is fast, and speed alone never justifies accepting total loss \u2014 " +
                "otherwise you would build everything this way. The justification has to be about " +
                "what happens WHEN it goes, not how it performs while it is fine." },
            { key: "raid5", label: "It should not be \u2014 this ought to be a parity array", correct: false,
              why: "A defensible instinct, and worth arguing. But parity costs a drive and costs " +
                "write speed, and for data that can simply be regenerated you would be buying " +
                "protection against an outage you have already decided you can absorb." }
          ],
            explain: "Redundancy is not free, and the right amount of it depends on what losing the " +
              "data actually costs." }
        ]
      };
    }

    return {
      title: "Nurse the rebuild",
      intro: "The spare is in and the array is rebuilding. This is the most dangerous window the array will ever be in.",
      panels: [benchPanel(s), {
        kind: "note", title: "Why the rebuild window is the risky one",
        paragraphs: [
          "A rebuild reads EVERY block on EVERY surviving drive in order to reconstruct the missing one. " +
            "The drives are all the same age and have done the same work — so the rebuild is the heaviest load " +
            "they have seen, applied to the drives most likely to be near the end of their lives.",
          "At roughly 90 MB/s of sustained rebuild throughput, a " + s.size + " TB drive takes about " +
            hours + " hours. The array is unprotected for all of it."
        ]
      }],
      questions: [
        { key: "rb-time", kind: "number",
          prompt: "Roughly how many hours to rebuild one " + s.size + " TB drive at 90 MB/s?",
          unit: "hours", answer: hours, tolerance: 0.6,
          hints: [
            "The note gives you the throughput and the capacity. One is in TB, the other in MB per second — get them into the same units first.",
            "1 TB is about 1,000,000 MB. Divide by the rate to get seconds, then turn seconds into hours."
          ],
          explain: s.size + " TB ≈ " + (s.size * 1000000) + " MB ÷ 90 MB/s ≈ " +
            Math.round(s.size * 1000000 / 90) + " s ≈ " + hours + " hours." },
        { key: "rb-risk", kind: "choice",
          prompt: "The customer asks whether they should keep using the array during the rebuild. What do you tell them?",
          hints: [
            "Think about what the rebuild is competing with for the drives' time, and what happens to the rebuild window if you slow it down.",
            "There are two real costs here and they pull against each other: how long the array stays unprotected, and whether the business can stop for that long."
          ],
          options: [
            { key: "balance", label: "They can, but it lengthens the rebuild — and the array is unprotected for all of it", correct: true,
              why: "That is the honest answer. Use competes with the rebuild for drive time, so heavy use stretches the window in which a second failure is fatal." },
            { key: "no", label: "No — using it during a rebuild will corrupt the array", correct: false,
              why: "It will not. A degraded array serves reads and writes normally; that is the entire point of the redundancy." },
            { key: "yes", label: "Yes, no downside — the rebuild happens in the background", correct: false,
              why: "It is background work, but not free. It shares the drives with real traffic, and both get slower." },
            { key: "faster", label: "Using it heavily will make the rebuild finish sooner", correct: false,
              why: "The opposite. Every read the array serves is a read the rebuild does not get." }
          ,
            { key: "readonly", label: "Mount it read-only for the duration and they can carry on reading",
              correct: false,
              why: "Sensible-sounding, and it misses what the danger actually is. Reads during a " +
                "rebuild are not the risk \u2014 the risk is that the array has NO redundancy " +
                "until it finishes, and read-only does not restore any. It also stops them working." },
            { key: "pause", label: "Pause the rebuild during business hours and let it run overnight",
              correct: false,
              why: "The worst of both: it stretches the window in which one more failure loses " +
                "everything across several days instead of one afternoon. When the array is " +
                "unprotected, finishing sooner is the priority." }
          ],
          explain: "Degraded means working without a net. The question is how long you are willing to stay there." }
      ]
    };
  }

  if (key === "spare") {
    return {
      title: "Set up a hot spare",
      intro: "A hot spare is a drive that sits in the chassis doing nothing until the moment it is needed.",
      panels: [arrayPanel(s), statedRackPanel({
        title: "A hot spare, in the chassis, doing nothing",
        intro: "Bay 6 is the spare. It is powered, it is spinning, the controller knows about "
          + "it — and it is holding no data at all. From the aisle it looks like every other "
          + "drive except for the colour of its lamp, which is the whole problem with it: "
          + "nobody can tell you have one by looking, and nobody notices when it has already "
          + "been consumed by a failure last month.",
        level: "RAID 5 with a hot spare",
        bays: [{ state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "spare", sizeTB: 4 }, { state: "empty" }, { state: "empty" }],
        words: "Five members online, one spare idle",
        detail: "A spare has to be AT LEAST as big as the members it might replace. A smaller "
          + "one is not a spare — it is a drive the controller will refuse at the worst "
          + "possible moment."
      }), {
        kind: "note", title: "What it changes",
        paragraphs: [
          "Without a hot spare, the rebuild starts when somebody notices the alert, finds a matching drive and walks to the rack. " +
            "That could be Monday morning.",
          "With one, the controller starts rebuilding onto it within seconds of the failure — unattended, at three in the morning, " +
            "without anyone knowing yet."
        ]
      }],
      questions: [{
        key: "spare-why", kind: "choice",
        prompt: "What does a hot spare actually buy you?",
        hints: [
          "It does not change how long the rebuild takes. Look at what it changes about WHEN the rebuild starts.",
          "The dangerous window is the time spent unprotected. That window has two parts — waiting, and rebuilding."
        ],
        options: [
          { key: "start", label: "The rebuild starts immediately instead of whenever someone notices", correct: true,
            why: "Right. It removes the human delay, which is usually far longer than the rebuild itself." },
          { key: "faster", label: "The rebuild runs faster", correct: false,
            why: "Same drive, same data, same speed. What changes is when it begins." },
          { key: "extra", label: "It adds another drive's worth of fault tolerance", correct: false,
            why: "Not until it is in use. Sitting idle it protects nothing — it is a replacement waiting to happen, not redundancy." },
          { key: "cap", label: "It adds capacity to the array", correct: false,
            why: "The opposite: it is a whole drive contributing no capacity at all, which is what it costs you." }
        ,
            { key: "warn", label: "It warns you the moment a drive starts to fail", correct: false,
              why: "Monitoring does that, and you should have it. A hot spare is not a sensor \u2014 " +
                "it is a drive sitting there doing nothing until it is needed." },
            { key: "wear", label: "It spreads the wear, so all the drives age at the same rate",
              correct: false,
              why: "That describes a distributed spare, which is a different arrangement. A plain " +
                "hot spare is idle: it takes no writes at all until it is called on." }
          ],
        explain: "A hot spare shortens the unprotected window at its front end, which is usually where most of it is."
      }]
    };
  }

  if (key === "ctrl") {
    return {
      title: "Hardware, software, and the battery on the card",
      intro: "The last piece: where the parity arithmetic happens, and why a RAID card has a battery on it.",
      panels: [statedRackPanel({
        title: "The card the arithmetic happens on",
        intro: "Behind the drive bays, in a slot on the board: its own processor, its own "
          + "memory, and a battery or supercapacitor bolted to it. Software RAID has none of "
          + "those — the machine's own CPU does the parity and the machine's own memory holds "
          + "the writes, which is why a software array's cache is only as safe as the machine "
          + "it is in.",
        level: "RAID 5, hardware controller",
        bays: [{ state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "ok", sizeTB: 4 }, { state: "ok", sizeTB: 4 },
               { state: "empty" }, { state: "empty" }, { state: "empty" }],
        words: "Healthy, with write-back caching on",
        detail: "The lamps say everything is fine, and at this moment there are writes the "
          + "operating system believes are safely on disk that exist only in a chip on that "
          + "card. That is not a fault — it is the deal you made for the speed."
      }), {
        kind: "note", title: "Write-back caching",
        paragraphs: [
          "A hardware controller tells the operating system a write is done the moment it lands in the card's own memory, " +
            "before it reaches the drives. That is what makes hardware RAID feel fast on write-heavy work.",
          "It also means that, at any moment, there are writes the OS believes are safely stored which exist only in a chip on the card."
        ]
      }],
      questions: [{
        key: "ctrl-bbu", kind: "choice",
        prompt: "Why does a hardware RAID card carry a battery or supercapacitor?",
        hints: [
          "Read the second paragraph again and ask what happens to those writes if the power goes.",
          "The battery is not powering the drives, and it is not powering the card for long. It is protecting one specific thing."
        ],
        options: [
          { key: "cache", label: "To hold the write cache long enough to flush it after a power cut", correct: true,
            why: "Exactly. Without it, everything acknowledged but not yet written is lost — and the array does not know it is missing." },
          { key: "run", label: "To keep the array running through a power cut", correct: false,
            why: "That is a UPS's job, and a battery on a card could not spin the drives anyway." },
          { key: "clock", label: "To keep the controller's clock and settings", correct: false,
            why: "That is a coin cell on the board, and losing it is an annoyance rather than a data loss." },
          { key: "rebuild", label: "To finish an in-progress rebuild after a power cut", correct: false,
            why: "A rebuild survives a power cut by resuming — it is checkpointed. The write cache is not." }
        ,
            { key: "raidinfo", label: "To preserve the array configuration so the disks are still recognised",
              correct: false,
              why: "The array's configuration is written on the DISKS themselves, in metadata, " +
                "precisely so it survives losing the card. That is why a dead controller does not " +
                "cost you the array." },
            { key: "shutdown", label: "To give the controller time for an orderly shutdown", correct: false,
              why: "Very close, and the difference matters: it is not about shutting the card down " +
                "tidily, it is about the WRITES already acknowledged to the operating system and " +
                "not yet on a disk. Lose those and the filesystem believes something that is not " +
                "there." }
          ],
        explain: "The battery protects acknowledged-but-unwritten data. It is the price of pretending a write finished early."
      }, {
        key: "ctrl-which", kind: "choice",
        prompt: "When is software RAID the better choice?",
        hints: [
          "Think about what you lose when a hardware controller dies, and what you would need in order to read the array again.",
          "One of these approaches ties your data to a specific piece of hardware. Consider what happens when that model is discontinued."
        ],
        options: [
          { key: "portable", label: "When you want the array readable on any machine, without matching the controller", correct: true,
            why: "Right. Software RAID travels with the disks. A hardware array can need the same controller family to read it back." },
          { key: "fast", label: "When you need the highest possible write performance", correct: false,
            why: "That is hardware's advantage — the cache and the dedicated parity engine." },
          { key: "big", label: "When the array is very large", correct: false,
            why: "Size is not the deciding factor. Both scale." },
          { key: "always", label: "Always — hardware RAID is obsolete", correct: false,
            why: "Overstated. Write-heavy work with a battery-backed cache is still a real advantage." }
        ,
            { key: "cheap", label: "When the budget will not stretch to a controller card", correct: false,
              why: "True, and it is a reason it gets CHOSEN rather than a reason it is better. The " +
                "question asked when it is the right answer, not when it is the affordable one." },
            { key: "boot", label: "When the array has to be bootable", correct: false,
              why: "Backwards. Booting from an array is the case that most often needs the " +
                "firmware to understand it before an operating system has loaded \u2014 which is " +
                "an argument for hardware, not against it." }
          ],
        explain: "Hardware buys write speed and costs you portability. Software is the other way round."
      }]
    };
  }

  throw new Error("lab-raid: no stage \"" + key + "\"");
}

/* ------------------------------------------------------------------
   Lab-specific invariants, checked by the verifier across many seeds.

   These live HERE rather than in verify.mjs because they are claims
   about RAID, not about labs in general. The generic checker knows
   nothing about parity or drive counts, and teaching it would make it
   wrong for the next lab — which is exactly what happened when it tried
   to read this lab's LEVELS table out of the printer lab.

   Returns a list of problems; empty means sound.
   ------------------------------------------------------------------ */
export function selfCheck(sc) {
  const bad = [];
  const L = LEVELS[sc.best];
  if (!L) return ["best level \"" + sc.best + "\" is not in the table"];
  /* The intended answer must be LEGAL for the array generated. A
     scenario whose own correct answer needs more drives than the
     chassis holds is unanswerable, and would only surface on the seeds
     that produced it. */
  if (sc.n < L.min) bad.push(L.name + " needs " + L.min + " drives, array has " + sc.n);
  if (L.evenOnly && sc.n % 2) bad.push(L.name + " needs an even count, array has " + sc.n);
  if (sc.usableTB !== L.usable(sc.n) * sc.size) bad.push("usable capacity disagrees with the level table");
  if (sc.tolerate !== L.tolerate(sc.n)) bad.push("tolerance disagrees with the level table");
  if (sc.failBay < 1 || sc.failBay > sc.n) bad.push("failBay " + sc.failBay + " is not a bay");
  const ok = sc.spares.filter(function (x) { return x.ok; }).length;
  if (ok !== 1) bad.push(ok + " correct spares, want exactly 1");
  sc.spares.forEach(function (sp) { if (!sp.why) bad.push("spare " + sp.key + " has no reason"); });
  return bad;
}

/* What makes this scenario different from another, for the variety
   check. A generator that only ever produces one answer is not
   generating. */
export function variantKey(sc) { return sc.best + "/" + sc.workload.key; }
