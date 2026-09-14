/* =====================================================================
   THE STORAGE ROOM — jobs put down, and picked up where they were left.

   The owner's ask, verbatim: "I want to add a button that take them to
   the storage room and pauses the current selected project that they are
   on to come back later to finish it." And when asked how many: "Every
   paused job, one per lab."

   ---------------------------------------------------------------------
   WHY THIS EXISTS AND WHY IT IS NOT AUTOSAVE

   Project length is sixty minutes and up. Students do these alone, as
   homework, on whatever machine they have, and an hour is longer than a
   bus ride or a lunch break. A lab that can only be finished in one
   sitting is a lab a lot of them will never finish.

   It is a DELIBERATE act rather than an autosave, and that is the whole
   design. A job in the storage room is one the student decided to put
   down — they know it is there, they know where it is, and it is still
   there when they come back. An autosave that silently resurrects a
   half-finished job the next time somebody opens a lab takes the choice
   away and is confusing the first time it happens.

   ---------------------------------------------------------------------
   ONE SLOT PER LAB, AND THE SLOT IS THE LAB

   Parking a second Printer job replaces the first. That is the owner's
   answer and it is also the honest one: a student with four half-done
   Printer jobs has a mess rather than a shelf, and "the printer job I was
   doing" is how anybody actually refers to it.

   ---------------------------------------------------------------------
   WHAT IS SAVED, AND WHY NOTHING ELSE NEEDS TO BE

   The seed, the length, the stage they were on, which questions they have
   already got right, and how many times they had gone wrong on each.

   Nothing else, because nothing else is state. Every scenario in this
   build is REPRODUCIBLE FROM ITS SEED — that is the contract the whole
   thing rests on, and the crumb under every stage prints it. So the job
   does not need storing; it needs naming, and its name is its seed.

   The attempt counts matter more than they look: they are what the hint
   ladder reads. A student who had earned rung 3 on a hard question before
   they stopped should not come back to silence and have to get it wrong
   three more times to get their help back.
   ===================================================================== */

const KEY = "uthl.parked.v1";
const DONE = "uthl.finished.v1";

/* Storage throws outright in a private window, a browser set to block
   site data, or a thumbnailer. A parked job is worth having; losing it
   must never take the page down. */
function read(key) {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : {};
    return (v && typeof v === "object") ? v : {};
  } catch (e) { return {}; }
}

function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; }
  catch (e) { return false; }
}

function readAll() { return read(KEY); }
function writeAll(v) { return write(KEY, v); }

/* Every job on the shelf, newest first — which is the order somebody
   looks for the thing they were just doing. */
export function list() {
  const all = readAll();
  return Object.keys(all)
    .map(function (k) { return all[k]; })
    .filter(function (j) { return j && j.lab && typeof j.seed === "number"; })
    .sort(function (a, b) { return (b.parkedAt || 0) - (a.parkedAt || 0); });
}

export function get(labKey) {
  const j = readAll()[labKey];
  return (j && j.lab) ? j : null;
}

export function has(labKey) { return !!get(labKey); }

export function count() { return list().length; }

/* Put a job down. Returns false only if storage refused it, so the caller
   can say so rather than claim a save that did not happen. */
export function park(job) {
  if (!job || !job.lab) return false;
  const all = readAll();
  all[job.lab] = {
    lab: job.lab,
    seed: job.seed,
    length: job.length,
    at: job.at || 0,
    stages: job.stages || 0,
    stageTitle: job.stageTitle || "",
    machine: job.machine || null,      /* which machine rests in its dock */
    answered: job.answered || {},
    attempts: job.attempts || {},
    parkedAt: Date.now()
  };
  return writeAll(all);
}

export function drop(labKey) {
  const all = readAll();
  if (!all[labKey]) return false;
  delete all[labKey];
  return writeAll(all);
}

export function clear() { return writeAll({}); }

/* HOW FAR THROUGH, in words as well as as a number.

   Colour and a bar are not enough on their own anywhere in this build,
   and a shelf of parked jobs is exactly the place somebody scans quickly
   for the one they had nearly finished. */
export function progressOf(job) {
  const n = job.stages || 0;
  const done = Math.min(job.at || 0, n);
  return {
    done: done,
    total: n,
    words: n ? "stage " + (done + 1) + " of " + n : "not started",
    /* Answered correctly so far, which is the other thing a student wants
       to know before deciding which job to pick back up. */
    right: Object.keys(job.answered || {}).length
  };
}

/* =====================================================================
   THE OTHER HALF OF THE SHELF: JOBS THAT ARE FINISHED.

   The storage room held only work that had been PUT DOWN. A student who
   had finished four labs and parked none opened the front page to an
   empty shelf and no evidence that any of it had happened — the score
   was shown once, on the last screen, and then the page was thrown away.

   These labs are an hour each and students do them alone, as homework,
   over weeks. What they have already done is the thing they most need
   the page to remember, and it is the only way to answer "which one have
   I not done yet" without opening all eight.

   ---------------------------------------------------------------------
   ONE ROW PER JOB, NOT PER ATTEMPT, AND THE BEST SCORE WINS.

   A job is a lab and a seed, and redoing the Continental Freightways
   printer job is redoing THAT job rather than starting a new one — so it
   updates its own row. The score kept is the BEST, because the reason to
   do a lab twice is to do it better and a record that replaced 11/12
   with 6/12 would punish exactly that. The date kept is the LATEST,
   because "when did I last look at this" is the useful one.

   ---------------------------------------------------------------------
   FINISHING A JOB TAKES IT OFF THE PARKED SHELF.

   A real bug and not a tidy-up: park a job, come back, pick it up,
   finish it, and the parked copy stayed on the shelf for ever, inviting
   the student back into work they had already completed. `finish` drops
   it. The two shelves are the same job in two states and only one of
   them can be true at a time. */
const DONE_CAP = 60;

export function finish(job) {
  if (!job || !job.lab || typeof job.seed !== "number") return false;
  const all = read(DONE);
  const id = job.lab + "/" + job.seed;
  const was = all[id];
  all[id] = {
    lab: job.lab,
    seed: job.seed,
    name: job.name || (was && was.name) || "",
    length: job.length,
    machine: job.machine || (was && was.machine) || null,
    right: Math.max(job.right || 0, (was && was.right) || 0),
    total: job.total || (was && was.total) || 0,
    runs: ((was && was.runs) || 0) + 1,
    firstAt: (was && was.firstAt) || Date.now(),
    /* `finishedAt`, NOT `at`. A parked job's `at` is the STAGE INDEX it
       was put down on — a small integer — and a finished job's is a
       millisecond timestamp. Two shapes sharing one field name is how a
       sort by date ends up ordering by stage number, silently, and it
       was one keystroke away here. */
    finishedAt: Date.now()
  };
  /* OLDEST OUT FIRST once the shelf is full. Sixty finished jobs is more
     than the whole build can offer (eight labs, six named jobs each), so
     the cap is only ever reached by somebody working through seeds of
     their own — and dropping the oldest is what they would expect. */
  const ids = Object.keys(all).sort(function (a, b) { return (all[b].finishedAt || 0) - (all[a].finishedAt || 0); });
  ids.slice(DONE_CAP).forEach(function (k) { delete all[k]; });
  const ok = write(DONE, all);
  /* the same job cannot be both finished and waiting */
  drop(job.lab);
  return ok;
}

/* Everything finished, newest first. */
export function done() {
  const all = read(DONE);
  return Object.keys(all)
    .map(function (k) { return all[k]; })
    .filter(function (j) { return j && j.lab && typeof j.seed === "number"; })
    .sort(function (a, b) { return (b.finishedAt || 0) - (a.finishedAt || 0); });
}

export function doneCount() { return done().length; }
export function clearDone() { return write(DONE, {}); }

/* HOW MANY OF A LAB'S JOBS ARE BEHIND THEM. Read by the front page so a
   lab can say "3 of its jobs finished" beside its own name, which is the
   question a student is actually asking when they look at eight tabs. */
export function doneByLab() {
  const out = {};
  done().forEach(function (j) { out[j.lab] = (out[j.lab] || 0) + 1; });
  return out;
}

/* THE SCORE IN WORDS AS WELL AS A FRACTION.

   A bar and a number is two ways of saying one thing to somebody who can
   read both. Nothing in this build carries a verdict in colour alone,
   and a finished job is exactly where a student scans quickly for the
   one that went badly. */
export function scoreOf(job) {
  const t = job.total || 0, r = Math.min(job.right || 0, t);
  const pc = t ? Math.round((r / t) * 100) : 0;
  return {
    right: r, total: t, percent: pc,
    fraction: t ? r + " of " + t : "no questions",
    /* Deliberately not a pass mark. This build does not grade, and
       inventing a threshold here would quietly tell a student that 69%
       is a failure on an exam whose real cut score is not this. */
    words: !t ? "finished"
      : r === t ? "every question right"
      : r >= t - 2 ? "all but " + (t - r) + " right"
      : r + " of " + t + " right",
    runs: job.runs || 1
  };
}

/* When it was put down, in the words somebody would actually use. */
export function whenOf(job) {
  const ms = Date.now() - (job.parkedAt || job.finishedAt || 0);
  const min = Math.round(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return min + (min === 1 ? " minute ago" : " minutes ago");
  const hr = Math.round(min / 60);
  if (hr < 24) return hr + (hr === 1 ? " hour ago" : " hours ago");
  const day = Math.round(hr / 24);
  return day + (day === 1 ? " day ago" : " days ago");
}
