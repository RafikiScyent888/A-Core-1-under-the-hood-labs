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
  const size = r.pick(DRIVE_SIZES);
  const rpm = r.pick(DRIVE_RPM);

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
    spares: buildSpares(r, size, rpm)
  };
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
        s.n + " drives, all " + s.size + " TB at " + s.rpm + " rpm.")],
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
          options: s.drives.map(function (d) {
            return { key: "bay" + d.bay, label: "Bay " + d.bay, correct: d.bay === s.failBay,
              why: d.bay === s.failBay
                ? "Right — no readable sectors at all. That is a dead drive, not a marginal one."
                : "Bay " + d.bay + " reported healthy: zero reallocated sectors and a readable surface." };
          }),
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
      panels: [{ kind: "mech", title: "One stripe, start to finish", frames: parityFrames(s) }],
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
        ],
        explain: "One parity block, one recoverable drive. That is the whole of it — and it is why RAID 6 exists."
      }]
    };
  }

  if (key === "rebuild") {
    const hours = Math.round((s.size * 1000) / 90 / 60 * 10) / 10;
    return {
      title: "Nurse the rebuild",
      intro: "The spare is in and the array is rebuilding. This is the most dangerous window the array will ever be in.",
      panels: [{
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
          ],
          explain: "Degraded means working without a net. The question is how long you are willing to stay there." }
      ]
    };
  }

  if (key === "spare") {
    return {
      title: "Set up a hot spare",
      intro: "A hot spare is a drive that sits in the chassis doing nothing until the moment it is needed.",
      panels: [arrayPanel(s), {
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
        ],
        explain: "A hot spare shortens the unprotected window at its front end, which is usually where most of it is."
      }]
    };
  }

  if (key === "ctrl") {
    return {
      title: "Hardware, software, and the battery on the card",
      intro: "The last piece: where the parity arithmetic happens, and why a RAID card has a battery on it.",
      panels: [{
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
