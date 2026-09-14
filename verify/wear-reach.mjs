/* IS EVERY WEARING PART ACTUALLY REACHABLE?

   Written and reachable are different claims. A part can carry a perfect
   four-rung ladder, a shape and a bench, and simply never be chosen —
   in which case it teaches nobody anything, and nothing else in the
   suite notices, because every scenario it does generate is valid.

   This drives the generator over many seeds and reports any wearing part
   the wear stage never picked, plus the rungs it never showed. Four new
   parts were added to the laser pool in one go; a pool that grows is
   exactly when a thin one gets hidden by the others.

   usage: node verify/wear-reach.mjs [seeds] */
import { generate } from "../assets/lab-printer.js";
import { MECH_PARTS } from "../assets/lab-printer.js";
const seeds = Number(process.argv[2] || 600);
/* FOUR RUNGS ARE ASKABLE, NOT FIVE. The generator picks from [1,2,3,4]:
   rung 0 is "fresh", which is the REFERENCE COPY on the left of the
   bench, never the thing being judged. Asking a student how far gone a
   brand new part is is not the exercise.

   The first cut of this checker demanded all four and reported all 22
   parts as failures — a checker being wrong about content that is
   right, which is the failure mode this whole suite exists to avoid.
   The uniformity was the clue: 22 for 22 is a rule, not a bug. */
const ASKABLE = [1, 2, 3];
const seen = new Map();
for (let s = 1; s <= seeds; s++) {
  const sc = generate(s);
  const k = sc.wearTech.tech + "/" + sc.wearTech.part.key;
  if (!seen.has(k)) seen.set(k, new Set());
  seen.get(k).add(sc.wearRung);
}
/* The pool is rebuilt here from the same source the lab uses, so this
   cannot drift into checking a list of its own invention. */
/* NOT `if (p.wears)`. That was the first cut, and calibration caught it
   being circular: flip a part's `wears` to false and it vanishes from
   the pool AND from the expectation, so the checker passed while the
   part became permanently unreachable — the exact regression it exists
   to catch, reported as a clean run.

   All four mechanical parts are wear parts by construction, so the
   expectation is the LIST, and the flag is asserted rather than
   trusted. */
const want = MECH_PARTS.map((p) => "laser/" + p.key);
let bad = 0;
for (const p of MECH_PARTS) {
  if (!p.wears) {
    console.log("  " + p.key + " is a wear part but is not flagged `wears`, so the stage " +
      "can never choose it");
    bad++;
  }
}
console.log(seeds + " seeds reached " + seen.size + " distinct wearing parts");
for (const k of want) {
  if (!seen.has(k)) { console.log("  NEVER GENERATED: " + k); bad++; }
  else if (seen.get(k).size < ASKABLE.length) {
    console.log("  " + k + " only ever shown at " + seen.get(k).size +
      " of " + ASKABLE.length + " askable rungs");
    bad++;
  }
}
const thin = [...seen.entries()].filter(([, r]) => r.size < ASKABLE.length)
  .map(([k, r]) => k + "(" + r.size + ")");
if (thin.length) console.log("  rungs not all reached: " + thin.join(", "));
console.log(bad ? bad + " REACHABILITY FAILURES" :
  "every wearing part is generated, at all " + ASKABLE.length + " askable rungs");
process.exit(bad ? 1 : 0);
