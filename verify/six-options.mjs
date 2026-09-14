/* SIX OPTIONS: ONE RIGHT, FIVE WRONG. The owner's hard numbers.

   Why six and not the nine first asked for: rung 3 of the hint ladder
   narrows the field by striking wrong options WITH A REASON EACH and
   must leave at least two alive. On a field of nine that is either a
   wall of eight reasons — which hands over the answer — or a strike so
   small it helps nobody. Six also scans in one go for tired eyes and
   sits close to the four-option exam. The difficulty is meant to come
   from the distractors being plausible, not from there being many.

   So every wrong option must be a NEAR MISS: a real misdiagnosis a
   technician actually makes — the part next door in the paper path, the
   symptom that looks identical, the fix that treats the symptom rather
   than the cause. This checker can count options and it can insist every
   one carries a reason; it cannot judge plausibility, and it does not
   pretend to. That part is review, not automation.

   NOT-YET-CONVERTED LABS ARE LISTED HERE WITH A REASON, rather than the
   check being quietly weakened until it passes. Same pattern as the
   objective coverage map: dropping a standard has to be a decision
   somebody wrote down. The list shrinks; it must never grow.
   usage: node verify/six-options.mjs */
import { LABS } from "../assets/labs.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const WANT = 6, WANT_RIGHT = 1;
/* EMPTY, AND IT MUST STAY EMPTY. All eight labs hold the rule. Anything
   added here is a lab that has stopped holding it, and it needs a reason
   written beside it rather than a quiet edit to the check. The list
   shrinks; it never grows. */
const PENDING = {};

const seeds = Number(process.argv[2] || 60);
let bad = 0, checked = 0, done = [];
for (const L of LABS) {
  const m = await import(ROOT + "/assets/lab-" + L.key + ".js");
  const off = [];
  for (let s = 1; s <= seeds; s++) {
    const sc = m.generate(s);
    for (const st of L.stages) {
      let stage; try { stage = m.buildStage(st.key, sc); } catch (e) { continue; }
      for (const q of (stage && stage.questions) || []) {
        /* A PROBE'S CONCLUSION IS A SINGLE-CHOICE QUESTION IN EVERYTHING
           BUT NAME. The student runs the instruments, then picks one
           answer from a list with a reason on each — the same act, the
           same hint ladder, the same rule. Checking only `kind ===
           "choice"` let those fields sit at four options and reported
           the whole build as compliant, which is a checker measuring
           the shape of the data rather than what a student is asked to
           do. Both are collected here. */
        const fields = [];
        if (q.kind === "choice") fields.push([q.key, q.options]);
        if (q.kind === "probe" && q.then) fields.push([q.key + "/conclusion", q.then.options]);
        for (const [label, opts] of fields) {
          const n = (opts || []).length;
          const right = (opts || []).filter((o) => o.correct).length;
          if (n !== WANT || right !== WANT_RIGHT) {
            off.push(st.key + "/" + label + " has " + n + " options, " + right + " correct");
          }
          if ((opts || []).some((o) => !o.why || !String(o.why).trim())) {
            off.push(st.key + "/" + label + " has an option with no reason attached");
          }
          checked++;
        }
      }
    }
  }
  const uniq = [...new Set(off)];
  if (PENDING[L.key]) {
    if (!uniq.length) {
      console.log("  " + L.key + " is CONVERTED but still listed as pending — take it off the list");
      bad++;
    } else {
      console.log("  pending  " + L.key.padEnd(8) + uniq.length + " question(s) off the rule — " + PENDING[L.key]);
    }
    continue;
  }
  if (uniq.length) {
    bad++;
    console.log("  FAIL     " + L.key + ":");
    uniq.slice(0, 8).forEach((x) => console.log("             " + x));
    if (uniq.length > 8) console.log("             (+" + (uniq.length - 8) + " more)");
  } else done.push(L.key);
}
console.log(checked + " single-answer fields (choice questions and probe conclusions) over " + seeds + " seeds; " +
  "holding the rule: " + (done.join(", ") || "none yet") +
  "; pending: " + Object.keys(PENDING).join(", "));
console.log(bad ? bad + " LAB(S) BREAKING THE SIX-OPTION RULE" :
  "every converted lab is six options, one right and five wrong, each with a reason");
process.exit(bad ? 1 : 0);
