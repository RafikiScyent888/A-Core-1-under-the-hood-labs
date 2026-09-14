/* =====================================================================
   NAMED SCENARIOS — a list to choose from, instead of a dice roll.

   The owner's ask: "that first scenario to load with options for them to
   choose different scenarios", and when asked how, "Pick from a named
   list".

   WHY THE NAMES ARE NOT WRITTEN DOWN ANYWHERE.

   Every lab already introduces its job with a customer and a sentence —
   "Continental Freightways — Major Corporation", "We need you to sort out
   storage for the working video store." That IS the name of the
   scenario. Typing a second set of names into a table here would create
   two sources of truth for what a job is called, and the one nobody
   looks at would go stale the first time a generator changed a customer
   list. So a name is READ OFF the scenario the generator produced.

   The cost of that decision, stated plainly: naming a scenario means
   generating it and building its first stage. Eight of those per lab is
   real work on a school laptop, so the list is built once when a lab is
   opened and cached for the session.

   WHY SEEDS RATHER THAN AN INDEX. A scenario is reproducible from its
   seed and nothing else — that is the contract the whole build rests on,
   and the crumb under every stage prints it. A named list is therefore a
   list of SEEDS with their names read back, which means a student who
   writes down "seed 4021" and a student who picks "Continental
   Freightways" are talking about the same job, and an instructor can set
   one by number.

   THE FIRST ONE LOADS. The owner asked for that specifically: a student
   who wants to get on with it presses Start and gets a job, and the list
   is there for the one who wants to choose or who has already done this
   one.
   ===================================================================== */

/* HOW MANY. Six, which is the number this build uses everywhere a
   student is asked to choose — six options on every question, and the
   same reason applies: a list that scans in one go for tired eyes. */
export const COUNT = 6;

/* THE SEEDS ARE FIXED AND THE SAME FOR EVERY STUDENT.

   Derived from the lab key rather than random, so "the Continental
   Freightways job" means the same thing on the instructor's screen and
   on the student's, and so a class can be set the same one. Spread far
   apart because adjacent seeds in a linear generator can land in the
   same bucket on a small table. */
function seedStream(labKey) {
  let h = 2166136261;
  for (let i = 0; i < labKey.length; i++) {
    h ^= labKey.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return function () {
    h = (Math.imul(h, 48271) + 11) >>> 0;
    return h % 900000 + 1000;
  };
}

/* Trim a customer's sentence to something that fits on a chip without
   ending mid-word. Never adds an ellipsis to a sentence that already
   fits — a truncation mark that is not a truncation is a small lie. */
function clip(text, n) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:—-]+$/, "") + "…";
}

/* THE NAME, READ OFF THE SCENARIO.

   Every lab's first stage carries a `brief` panel with `from` — the
   customer — and a first paragraph that is the job in one line. Two labs
   open differently, so there is a fallback that uses the stage's own
   title rather than inventing anything: a scenario that cannot name
   itself gets called by its seed, which is honest and still unique. */
export function nameOf(mod, lab, seed) {
  const scenario = mod.generate(seed);
  let from = "", job = "";
  try {
    const first = lab.stages[0].key;
    const built = mod.buildStage(first, scenario);
    const brief = (built.panels || []).filter(function (p) { return p.kind === "brief"; })[0];
    if (brief) {
      /* TWO SHAPES OF BRIEF, AND ONLY ONE WAS READ AT FIRST.

         Six labs write `from` and `paragraphs` — a named company and the
         job in a sentence. Networking and Display write `who` and
         `quotes` — an unnamed customer described by what they are ("a
         dental practice", "the studio lead") and their own words.

         Reading only the first shape gave those two labs SIX SCENARIOS
         WITH THE SAME NAME, because the fallback used the stage title,
         which does not vary. A picker where every row says "Choose the
         panel for the job" is worse than no picker: it looks like a
         choice and is not one. Caught by printing the list rather than
         by trusting that a fallback existed. */
      from = brief.from || brief.who || "";
      job = (brief.paragraphs || brief.quotes || [])[0] || "";
    }
    if (!from) from = built.title || "";
    if (!job) job = built.intro || "";
  } catch (e) { /* a lab that cannot build its first stage has bigger problems */ }

  return {
    seed: seed,
    /* The customer, or the seed if this lab does not have one. */
    title: clip(from, 46) || ("Job " + seed),
    /* What they want, in the customer's own words where there are any. */
    detail: clip(job, 92)
  };
}

/* The six named jobs for a lab, built once and kept. */
const cache = {};
export function listFor(mod, lab) {
  if (cache[lab.key]) return cache[lab.key];

  /* SEARCH FOR SIX THAT ARE ACTUALLY DIFFERENT, rather than taking the
     first six the stream offers.

     The customer lists are finite — a dozen or so names a lab — so six
     draws land on the same company twice more often than not. The first
     cut took six and disambiguated the repeats by appending the seed,
     which is honest and reads as a bug: "Kellow Manufacturing" and
     "Kellow Manufacturing (job 556910)" look like the same job listed
     twice rather than two jobs at the same firm.

     So the stream is walked until six DISTINCT customers turn up. The
     cap matters: a lab whose brief genuinely cannot vary would otherwise
     spin for ever, and generating a scenario is not free. When the cap
     is hit, whatever was found is what is offered — a short list of real
     choices beats a padded one. */
  const next = seedStream(lab.key);

  /* TWO PASSES, and the first one is what makes the list readable.

     Uniqueness on title AND job is correct and reads badly: "Ridgeway
     Family Clinic / document archive" and "Ridgeway Family Clinic /
     virtual machine datastore" are genuinely two jobs, and in a list of
     six they look like the same customer entered twice. A student
     scanning for "the one I have not done" reads the bold line.

     So the first pass insists on six DIFFERENT CUSTOMERS. Only if a lab
     has fewer customers than that does the second pass allow the same
     customer with a different job, which is still a real choice and is
     better than a short list. Nothing is invented either way. */
  const out = [], byTitle = {}, byBoth = {};
  const CAP = COUNT * 20;
  const pool = [];
  for (let i = 0; i < CAP; i++) pool.push(next());

  pool.forEach(function (seed) {
    if (out.length >= COUNT) return;
    const e = nameOf(mod, lab, seed);
    if (byTitle[e.title]) return;
    byTitle[e.title] = true;
    byBoth[e.title + "\u0000" + e.detail] = true;
    out.push(e);
  });

  /* Not enough customers in this lab to fill the list — take distinct
     JOBS at a customer already listed rather than offer three rows. */
  pool.forEach(function (seed) {
    if (out.length >= COUNT) return;
    const e = nameOf(mod, lab, seed);
    const k = e.title + "\u0000" + e.detail;
    if (byBoth[k]) return;
    byBoth[k] = true;
    out.push(e);
  });

  cache[lab.key] = out;
  return out;
}

/* Only for the verifier, which needs a clean slate between labs. */
export function forget() { Object.keys(cache).forEach(function (k) { delete cache[k]; }); }
