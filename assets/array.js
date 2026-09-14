/* =====================================================================
   A+ Core1 Under the Hood Labs — what an array actually is

   The rules of a RAID set, as pure functions. No DOM, no three.js, no
   rendering. It runs in Node, which is the whole point: the arithmetic a
   student is graded on has to be testable without a browser, and the
   consequences have to be provable before anybody is marked wrong by them.

   THE MODEL DRAWS. THIS DECIDES. Nothing in bench-raid.js knows what RAID 5
   is and nothing here knows what a caddy looks like.

   ---------------------------------------------------------------------
   WHY CONSEQUENCE RATHER THAN MARKING

   The FSC already asks "which RAID level tolerates two failures?" and marks
   it. Asking again here would pay twice for the same coverage. So this does
   not ask. It lets the student pull a caddy and then lives with it — and
   the single most valuable thing it can teach is the one that costs real
   companies real money:

     An array that is REBUILDING has already spent its redundancy. Pull a
     second member of a RAID 5 while it rebuilds and the data is gone. Not
     degraded. Gone.

   Technicians know that as a sentence and still do it, because on the front
   of the chassis the rebuilding disk has an amber lamp and so does the one
   that was warning about itself last week. So the lab puts a predictive-
   failure amber next to a rebuilding amber and lets the student choose.
   ===================================================================== */

/* ---------------------------------------------------------------------
   Capacity and fault tolerance.

   `n` is the number of drives IN THE SET — a hot spare is not in the set
   until it is pulled into it, which is a distinction students routinely get
   wrong and which changes the capacity answer.

   Every one of these returns null for a set that cannot exist at that size,
   rather than a number that looks plausible. A RAID 5 of two drives is not
   a small RAID 5; it is not a RAID 5.
   --------------------------------------------------------------------- */

export const LEVELS = {
  "RAID 0":  { min: 2, even: false, parity: 0, mirrored: false },
  "RAID 1":  { min: 2, even: true,  parity: 0, mirrored: true  },
  "RAID 5":  { min: 3, even: false, parity: 1, mirrored: false },
  "RAID 6":  { min: 4, even: false, parity: 2, mirrored: false },
  "RAID 10": { min: 4, even: true,  parity: 0, mirrored: true  },
  "JBOD":    { min: 1, even: false, parity: 0, mirrored: false }
};

export function levelValid(level, n) {
  const L = LEVELS[level];
  if (!L) return false;
  if (n < L.min) return false;
  if (L.even && n % 2 !== 0) return false;
  return true;
}

/* Usable capacity in TB, or null if the set is invalid at that size. */
export function capacityTB(level, n, sizeTB) {
  if (!levelValid(level, n)) return null;
  switch (level) {
    case "RAID 0":  return n * sizeTB;
    case "JBOD":    return n * sizeTB;
    case "RAID 1":  return sizeTB;              /* a mirror is one drive's worth */
    case "RAID 5":  return (n - 1) * sizeTB;
    case "RAID 6":  return (n - 2) * sizeTB;
    case "RAID 10": return (n / 2) * sizeTB;
    default:        return null;
  }
}

/* How many simultaneous failures the set is GUARANTEED to survive.

   RAID 10 is the interesting one and the one worth being careful about. It
   can survive up to n/2 failures if you are lucky — one from each mirror
   pair — and exactly 1 if you are not, because two from the same pair takes
   that pair out and the stripe with it. The guaranteed number is 1, and
   that is the number a student should answer with. The lucky number is
   real, though, so it is reported separately rather than hidden. */
export function toleranceGuaranteed(level, n) {
  if (!levelValid(level, n)) return null;
  switch (level) {
    case "RAID 0":  return 0;
    case "JBOD":    return 0;   /* one drive dies, that drive's data dies */
    case "RAID 1":  return n - 1;
    case "RAID 5":  return 1;
    case "RAID 6":  return 2;
    case "RAID 10": return 1;
    default:        return null;
  }
}

export function toleranceBestCase(level, n) {
  if (!levelValid(level, n)) return null;
  if (level === "RAID 10") return n / 2;
  return toleranceGuaranteed(level, n);
}

/* ---------------------------------------------------------------------
   An array in a chassis.

   `bays` is one entry per physical bay, in bay order, so bay index maps
   straight onto what the model draws and onto what the button says. A bay
   holds one of:

     member  — in the set, carrying data or parity
     spare   — fitted, powered, NOT in the set until it is needed
     empty   — nothing fitted

   `pair` is only meaningful for mirrored levels: members sharing a pair
   number are mirrors of each other.
   --------------------------------------------------------------------- */

export function makeArray(opts) {
  const level = opts.level;
  const count = opts.memberCount;
  const sizeTB = opts.sizeTB || 4;
  const spares = opts.spares || 0;

  const bays = [];
  for (let i = 0; i < count; i++) {
    bays.push({
      role: "member",
      state: "ok",
      sizeTB: sizeTB,
      pair: pairOf(level, i)
    });
  }
  for (let i = 0; i < spares; i++) {
    bays.push({ role: "spare", state: "spare", sizeTB: sizeTB, pair: null });
  }
  while (bays.length < (opts.bayCount || bays.length)) {
    bays.push({ role: "empty", state: "empty", sizeTB: 0, pair: null });
  }

  return {
    level: level,
    sizeTB: sizeTB,
    bays: bays,
    /* "healthy" | "degraded" | "rebuilding" | "critical" | "lost" */
    status: "healthy",
    rebuildPct: 0,
    rebuildInto: null,      /* bay index being rebuilt onto */
    log: []
  };
}

/* Which mirror a member belongs to.

   RAID 1 is an n-way mirror: every member is a copy of the same data, so
   they are all one group and the set survives until the last one goes.
   RAID 10 stripes ACROSS mirrored pairs, so members pair up two at a time
   and the set needs at least one survivor from every pair.

   Getting this wrong by treating RAID 1 as pairs of two made a four-drive
   RAID 1 die when two specific drives went, which is not what a mirror
   does. */
function pairOf(level, i) {
  const L = LEVELS[level];
  if (!L || !L.mirrored) return null;
  if (level === "RAID 1") return 0;
  return Math.floor(i / 2);
}

function memberCount(a) {
  return a.bays.filter(b => b.role === "member").length;
}

/* A member is CONTRIBUTING if it currently holds usable data.

   A disk being rebuilt onto does not. That is the subtlety the whole lesson
   rests on: half an hour into a rebuild the bay has a healthy disk in it,
   the lamp is lit, and it still holds nothing the array can be reconstructed
   from. Counting it as present is what made the first version of this file
   report a RAID 5 as merely "rebuilding" after a second member was pulled —
   the exact scenario the lab exists to teach, marked survivable. */
function contributing(b) {
  return b.role === "member" &&
    (b.state === "ok" || b.state === "active" || b.state === "predictive");
}

/* Members that are out: failed, pulled, or not yet rebuilt. */
function missingMembers(a) {
  return a.bays.filter(b => b.role === "member" && !contributing(b)).length;
}

/* For mirrored levels: has any mirror group lost every one of its copies? */
function pairWiped(a) {
  if (!LEVELS[a.level] || !LEVELS[a.level].mirrored) return false;
  const total = {}, gone = {};
  a.bays.forEach(b => {
    if (b.role !== "member") return;
    total[b.pair] = (total[b.pair] || 0) + 1;
    if (!contributing(b)) gone[b.pair] = (gone[b.pair] || 0) + 1;
  });
  return Object.keys(total).some(k => (gone[k] || 0) >= total[k]);
}

/* Recompute status from the bays. Called after every change, so status is
   never set by hand anywhere and cannot drift out of step with the disks.

   Note the split between what SURVIVES and what a student should ANSWER.
   `toleranceGuaranteed` is the exam answer — RAID 10 guarantees one. But a
   RAID 10 that loses one drive from each of three pairs is still running,
   and simulating it as dead because a global counter hit 1 would be a lie
   the student can see through. Mirrored levels survive by group; parity
   levels survive by count. */
/* When a set dies, everything in it stops.

   Without this, an array could report LOST while one of its bays still said
   "Rebuilding" with an amber lamp — which is worse than useless, because a
   student reads that as work still in progress on a set that no longer
   exists. Real controllers take the whole array offline and every member
   lamp goes with it. */
function goOffline(a) {
  a.rebuildInto = null;
  a.rebuildPct = 0;
  a.bays.forEach(function (b) {
    if (b.role === "member" &&
        (b.state === "ok" || b.state === "active" ||
         b.state === "predictive" || b.state === "rebuilding")) {
      b.state = "offline";
    }
  });
}

export function recompute(a) {
  if (a.status === "lost") return a;           /* lost is terminal */

  const L = LEVELS[a.level];
  const missing = missingMembers(a);
  const budget = toleranceGuaranteed(a.level, memberCount(a));

  if (!L || budget === null) { a.status = "lost"; goOffline(a); return a; }

  if (L.mirrored) {
    if (pairWiped(a)) { a.status = "lost"; goOffline(a); return a; }
  } else if (missing > budget) {
    a.status = "lost";
    goOffline(a);
    return a;
  }

  if (a.rebuildInto !== null) { a.status = "rebuilding"; return a; }
  if (missing === 0) { a.status = "healthy"; return a; }
  /* Still serving, but how much is left in hand? "critical" means the next
     failure ends it. */
  const spent = L.mirrored ? 1 : missing;
  const cap = L.mirrored ? 1 : budget;
  a.status = (spent >= cap) ? "critical" : "degraded";
  return a;
}

/* ---------------------------------------------------------------------
   pull(a, i)

   The consequence engine. Returns what happened and WHY, in words a
   student can act on — a refusal that says "no" teaches nothing.

   This never refuses. A technician standing at a rack can physically pull
   any caddy they like, and the entire lesson is that the chassis will let
   you do the thing that destroys the array. Refusing to simulate it would
   be teaching that the hardware protects you. It does not.
   --------------------------------------------------------------------- */
export function pull(a, i) {
  const b = a.bays[i];
  if (!b) return { ok: false, why: "There is no bay " + (i + 1) + "." };

  if (b.role === "empty") {
    return { ok: false, outcome: "nothing",
      why: "Bay " + (i + 1) + " is empty. Nothing to pull." };
  }

  if (a.status === "lost") {
    b.state = "pulled";
    return { ok: true, outcome: "already-lost",
      why: "The array is already lost, so this changes nothing. Pulling disks from a dead " +
        "array is how evidence gets destroyed before anyone can attempt recovery." };
  }

  if (b.role === "spare") {
    b.state = "pulled";
    recompute(a);
    return { ok: true, outcome: "spare-removed",
      why: "That was the hot spare, not a member of the set. No data moved and nothing " +
        "degraded — but the array now has nothing standing by to rebuild onto, so the next " +
        "failure will sit there degraded until somebody walks to the rack." };
  }

  /* It is a member. What that costs depends entirely on what the set had
     left in hand BEFORE this pull. */
  const before = a.status;
  const budget = toleranceGuaranteed(a.level, memberCount(a));
  const alreadyLost = missingMembers(a);
  const wasRebuildTarget = (a.rebuildInto === i);

  b.state = "pulled";
  if (wasRebuildTarget) { a.rebuildInto = null; a.rebuildPct = 0; }
  recompute(a);

  if (a.status === "lost") {
    let why;
    if (before === "rebuilding") {
      why = "The array was REBUILDING. A rebuilding array has already spent its redundancy — " +
        "every remaining member was being read to reconstruct the missing one, and you have " +
        "just removed one of them. The data is gone. Not degraded: gone. This is the single " +
        "most expensive mistake made in front of a rack, and it is made by people who know " +
        "the rule, because on the front panel a rebuilding disk and a failing disk are both " +
        "amber.";
    } else if (pairWiped(a)) {
      why = "Both halves of the same mirror have now gone. " + a.level + " survives losing one " +
        "drive from each pair, not two from one — and the stripe needs every pair present, so " +
        "losing one pair loses the set.";
    } else if (budget === 0) {
      why = a.level + " carries no redundancy at all. Every drive in the set holds part of the " +
        "data and there is no parity to reconstruct anything from, so the first drive out is " +
        "the last.";
    } else {
      why = "That was one failure too many. " + a.level + " with " + memberCount(a) +
        " members survives " + budget + ", and " + (alreadyLost + 1) + " are now out.";
    }
    return { ok: true, outcome: "lost", why: why };
  }

  if (wasRebuildTarget) {
    return { ok: true, outcome: "rebuild-aborted",
      why: "That was the disk being rebuilt onto, so the rebuild has stopped. Nothing extra " +
        "was lost — it held no data yet — but the array is back to running without redundancy " +
        "and it will stay there until a replacement goes in." };
  }

  return { ok: true, outcome: "degraded",
    why: "The array is running without full redundancy now. It is still serving data, and it " +
      "is doing so by reconstructing the missing member's share from parity on every read, " +
      "which is why a degraded array is slower as well as fragile." };
}

/* Fit a replacement into a bay. */
export function insert(a, i, opts) {
  opts = opts || {};
  const b = a.bays[i];
  if (!b) return { ok: false, why: "There is no bay " + (i + 1) + "." };
  if (b.state === "ok" || b.state === "active") {
    return { ok: false, why: "Bay " + (i + 1) + " already has a working drive in it." };
  }
  if (a.status === "lost") {
    return { ok: false, outcome: "already-lost",
      why: "The array is lost. A new disk does not bring it back — the set has to be recreated " +
        "and restored from backup, which is the moment everyone finds out whether the backup " +
        "was working." };
  }

  const size = opts.sizeTB || a.sizeTB;
  if (size < a.sizeTB) {
    return { ok: false, outcome: "too-small",
      why: "That drive is " + size + " TB and the set is built from " + a.sizeTB + " TB members. " +
        "A replacement can be larger — the extra is simply wasted — but it can never be smaller, " +
        "because the stripe expects a member of at least the original size." };
  }

  b.role = "member";
  b.sizeTB = size;
  b.state = "rebuilding";
  a.rebuildInto = i;
  a.rebuildPct = 0;
  recompute(a);

  const extra = size > a.sizeTB
    ? " It is larger than the set's members, so " + (size - a.sizeTB) + " TB of it will sit unused."
    : "";
  return { ok: true, outcome: "rebuilding",
    why: "Rebuild started. Every remaining member is now being read end to end to reconstruct " +
      "this one, which is both the slowest and the most dangerous the array will ever be." + extra };
}

/* Advance a rebuild. Returns true when it completes. */
export function tick(a, pct) {
  if (a.rebuildInto === null) return false;
  a.rebuildPct = Math.min(100, a.rebuildPct + (pct === undefined ? 10 : pct));
  if (a.rebuildPct >= 100) {
    a.bays[a.rebuildInto].state = "ok";
    a.rebuildInto = null;
    a.rebuildPct = 0;
    recompute(a);
    return true;
  }
  recompute(a);
  return false;
}

/* ---------------------------------------------------------------------
   selfCheck — the invariants of THIS module, living with THIS module.

   A shared verifier that reached in here for RAID's constants is exactly
   what broke the moment a second lab existed, so these stay put.
   --------------------------------------------------------------------- */
export function selfCheck() {
  const fail = [];
  const ok = (cond, msg) => { if (!cond) fail.push(msg); };

  /* Capacity arithmetic, against hand-worked answers. */
  ok(capacityTB("RAID 5", 4, 2) === 6, "RAID 5 x4 x2TB should be 6TB");
  ok(capacityTB("RAID 6", 4, 2) === 4, "RAID 6 x4 x2TB should be 4TB");
  ok(capacityTB("RAID 10", 4, 2) === 4, "RAID 10 x4 x2TB should be 4TB");
  ok(capacityTB("RAID 0", 4, 2) === 8, "RAID 0 x4 x2TB should be 8TB");
  ok(capacityTB("RAID 1", 2, 2) === 2, "RAID 1 x2 x2TB should be 2TB");

  /* Sets that cannot exist must say so rather than return a plausible number. */
  ok(capacityTB("RAID 5", 2, 2) === null, "RAID 5 needs 3 drives");
  ok(capacityTB("RAID 6", 3, 2) === null, "RAID 6 needs 4 drives");
  ok(capacityTB("RAID 10", 5, 2) === null, "RAID 10 needs an even count");

  /* Tolerance, guaranteed vs lucky. */
  ok(toleranceGuaranteed("RAID 10", 6) === 1, "RAID 10 guarantees 1");
  ok(toleranceBestCase("RAID 10", 6) === 3, "RAID 10 can survive 3 of 6 if lucky");
  ok(toleranceGuaranteed("RAID 0", 4) === 0, "RAID 0 tolerates nothing");

  /* THE lesson: pulling a second member mid-rebuild kills a RAID 5. */
  let a = makeArray({ level: "RAID 5", memberCount: 4, sizeTB: 4 });
  pull(a, 0);
  ok(a.status !== "lost", "RAID 5 should survive one pull");
  insert(a, 0, {});
  ok(a.status === "rebuilding", "RAID 5 should be rebuilding after a replacement goes in");
  const r = pull(a, 2);
  ok(a.status === "lost", "pulling a second member mid-rebuild must lose a RAID 5");
  ok(r.outcome === "lost", "and it must report that it lost it");
  ok(/rebuild/i.test(r.why), "and the reason must mention the rebuild, not just count failures");

  /* Pulling the disk being rebuilt ONTO is survivable — it held nothing. */
  let c = makeArray({ level: "RAID 5", memberCount: 4, sizeTB: 4 });
  pull(c, 0); insert(c, 0, {});
  const rr = pull(c, 0);
  ok(c.status !== "lost", "pulling the rebuild TARGET must not lose the array");
  ok(rr.outcome === "rebuild-aborted", "and it must be reported as an aborted rebuild");

  /* RAID 10: two from one pair is fatal, one from each is not. */
  let d = makeArray({ level: "RAID 10", memberCount: 4, sizeTB: 4 });
  pull(d, 0); pull(d, 2);
  ok(d.status !== "lost", "RAID 10 survives one drive from each pair");
  let e = makeArray({ level: "RAID 10", memberCount: 4, sizeTB: 4 });
  pull(e, 0); pull(e, 1);
  ok(e.status === "lost", "RAID 10 must die when both halves of one pair go");

  /* A hot spare is not a member and must not change the capacity answer. */
  let f = makeArray({ level: "RAID 5", memberCount: 4, spares: 1, sizeTB: 4 });
  ok(capacityTB(f.level, 4, 4) === 12, "a hot spare must not be counted into capacity");
  const sp = pull(f, 4);
  ok(sp.outcome === "spare-removed", "pulling the spare is not a member loss");
  ok(f.status === "healthy", "and it must leave the array healthy");

  /* A smaller replacement must be refused, with the reason. */
  let g = makeArray({ level: "RAID 5", memberCount: 4, sizeTB: 4 });
  pull(g, 1);
  const small = insert(g, 1, { sizeTB: 2 });
  ok(small.ok === false && small.outcome === "too-small", "a smaller replacement must be refused");
  const big = insert(g, 1, { sizeTB: 8 });
  ok(big.ok === true, "a larger replacement must be accepted");
  ok(/unused|wasted/i.test(big.why), "and it must say the extra capacity is wasted");

  /* A dead array must not leave a bay claiming to be rebuilding. */
  let k = makeArray({ level: "RAID 5", memberCount: 4, sizeTB: 4 });
  pull(k, 0); insert(k, 0, {}); tick(k, 40); pull(k, 2);
  ok(k.status === "lost", "setup: that sequence should lose the array");
  ok(k.rebuildInto === null, "a lost array must have no rebuild in progress");
  ok(!k.bays.some(x => x.state === "rebuilding"),
     "no bay may still report Rebuilding once the array is lost");
  ok(k.bays.filter(x => x.role === "member" && x.state === "offline").length >= 2,
     "surviving members of a lost array go offline rather than staying Online");

  /* RAID 0 dies on the first pull, and says why rather than counting. */
  let h = makeArray({ level: "RAID 0", memberCount: 4, sizeTB: 4 });
  const z = pull(h, 2);
  ok(h.status === "lost", "RAID 0 must die on the first pull");
  ok(/no redundancy|no parity/i.test(z.why), "and must explain that it never had redundancy");

  return fail;
}
