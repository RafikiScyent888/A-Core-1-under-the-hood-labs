/* =====================================================================
   INSTRUCTOR MODE — PIN 3693.

   The standing rule across the whole Cyber Warrior Program names this
   PIN, and every other site in the family has a mode behind it. This
   repo had the number written down in a comment and no implementation
   at all: `grep -rn "3693" assets/` returned prose and nothing else.

   ---------------------------------------------------------------------
   WHAT IT IS FOR HERE, AND IT IS NOT THE SAME AS THE FIELD SERVICE
   CENTER'S

   The FSC's instructor mode reveals answers on a ticket, because a
   ticket is a diagnosis with one right answer and an instructor stood
   next to a student needs to see it. That is half of what this needs.

   The other half is new, and it only became possible when the named
   scenario picker went in: EVERY JOB IN THIS BUILD NOW HAS A STABLE
   NAME AND A STABLE SEED, identical on the instructor's screen and on
   every student's, because the seeds are derived from the lab key rather
   than drawn at random. So "everyone do the Continental Freightways
   printer job" is a thing that can be said out loud to a room, and this
   panel is where the list of what to say comes from.

   Three things, then:

     THE JOB SHEET   every lab's six named jobs, with their seeds, so a
                     class can be set the same one. It can also SET one
                     on this machine, which is what a demonstration on a
                     projector actually needs.
     THE COVERAGE    which of the 27 sub-objectives each lab's stages
                     carry, read off the registry rather than typed here,
                     so a lesson can be planned against the blueprint.
     THE ANSWERS     on the stage that is open, while a lab is running.

   ---------------------------------------------------------------------
   THE PIN IS NOT SECURITY AND THIS FILE SAYS SO OUT LOUD

   It is four digits in a static JavaScript file served from GitHub
   Pages. Anybody who opens the developer tools has it, and a student who
   wants the answer key badly enough will find it in ninety seconds.

   That is FINE, and the reason it is fine decides what may go behind it.
   The PIN keeps the answers out of a student's WAY, not out of their
   reach — it stops a stage being accidentally spoiled by a panel they
   did not ask for. So nothing goes behind it that would hurt anybody who
   looked: no personal data, no marks, nothing about any other student.
   An answer key to an exercise with unlimited tries and unlimited hints
   is not a secret worth pretending to protect.

   It also DOES NOT PERSIST. A `let`, not localStorage, so it is gone on
   reload — because these are shared classroom machines, and a mode that
   survived the instructor walking away would hand the next student the
   answers with no PIN at all. The one place persistence would be
   convenient is the one place it would do harm.
   ===================================================================== */

const PIN = "3693";

let on = false;
const listeners = [];

export function isOn() { return on; }
export function onChange(fn) { listeners.push(fn); }
function fire() { listeners.forEach(function (fn) { try { fn(on); } catch (e) {} }); }

export function set(v) {
  const next = !!v;
  if (next === on) return on;
  on = next;
  document.documentElement.toggleAttribute("data-instructor", on);
  fire();
  return on;
}

/* ---------------------------------------------------------------------
   THE CONTROL. A real button beside the reading and theme toggles, in
   the tab order, saying what it is in words — the same contract those
   two keep. The overlay is a plain dialog built here rather than written
   into index.html, so the markup and the behaviour cannot drift apart.
   --------------------------------------------------------------------- */
export function mountToggle(host) {
  const wrap = document.createElement("div");
  wrap.className = "reading-toggle";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn ins-btn";
  btn.id = "instructorBtn";

  const note = document.createElement("span");
  note.className = "reading-note";

  function say() {
    btn.textContent = on ? "Instructor mode: on" : "Instructor mode";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    note.textContent = on
      ? "Answers are shown on every stage, and the job sheet is below. Off when this page reloads."
      : "For instructors. Shows the answers and the job sheet. Students do not need it.";
  }

  btn.addEventListener("click", function () {
    if (on) { set(false); say(); return; }
    ask(function () { set(true); say(); });
  });

  wrap.appendChild(btn);
  wrap.appendChild(note);
  host.appendChild(wrap);
  say();
  onChange(say);
  return wrap;
}

/* The PIN prompt. Built and destroyed per use; focus goes into the field
   and comes back to the button, because a dialog that strands the
   keyboard is a dialog nobody can close. */
function ask(ok) {
  const back = document.activeElement;
  const ov = document.createElement("div");
  ov.className = "pin-ov";
  const box = document.createElement("div");
  box.className = "pin-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "pin-h");

  const h = document.createElement("h2");
  h.id = "pin-h";
  h.textContent = "Instructor PIN";
  const p = document.createElement("p");
  p.className = "note";
  /* SAY WHAT IT IS, ON THE SCREEN, not only in the source. An instructor
     deciding what to show on a projector deserves to know that this gate
     is a convenience rather than a lock. */
  p.textContent = "This keeps the answers out of a student's way rather than out of their "
    + "reach — it is four digits in a file anybody can read. Nothing private is behind it.";

  const lab = document.createElement("label");
  lab.setAttribute("for", "pin-in");
  lab.textContent = "PIN";
  const inp = document.createElement("input");
  inp.type = "password";
  inp.id = "pin-in";
  inp.inputMode = "numeric";
  inp.autocomplete = "off";

  const err = document.createElement("p");
  err.className = "pin-err";
  err.hidden = true;

  const acts = document.createElement("div");
  acts.className = "pin-acts";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "btn primary";
  go.textContent = "Unlock";
  const no = document.createElement("button");
  no.type = "button";
  no.className = "btn";
  no.textContent = "Cancel";

  function close() {
    ov.remove();
    document.removeEventListener("keydown", esc, true);
    if (back && back.focus) back.focus();
  }
  function esc(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
  }
  function tryIt() {
    if (inp.value.trim() === PIN) { close(); ok(); return; }
    err.hidden = false;
    /* The words change as well as anything else. Nothing in this build
       says "wrong" with colour alone. */
    err.textContent = "That is not the PIN. Nothing has changed.";
    inp.select();
  }
  go.addEventListener("click", tryIt);
  no.addEventListener("click", close);
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); tryIt(); }
  });
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  document.addEventListener("keydown", esc, true);

  acts.appendChild(go);
  acts.appendChild(no);
  box.appendChild(h);
  box.appendChild(p);
  box.appendChild(lab);
  box.appendChild(inp);
  box.appendChild(err);
  box.appendChild(acts);
  ov.appendChild(box);
  document.body.appendChild(ov);
  inp.focus();
}

/* =====================================================================
   THE ANSWER PANEL, for the stage that is on screen.

   WHAT IT MAY CLAIM, AND WHAT IT MUST NOT.

   This build has ELEVEN question shapes and they are graded in eleven
   different ways — a number against a tolerance, a sequence against an
   order, nine devices into three outlets, a part placed on a model. A
   panel that guessed at the key for a shape it does not really
   understand would be a WRONG ANSWER KEY, and this repo has already
   found four of those in the source sims it was built from. A wrong key
   in an instructor's hands is worse than no key: it gets said out loud
   to a room.

   So the derivation is deliberately conservative. Where the answer is
   DECLARED in the question — an option flagged `correct`, a number with
   its tolerance — it is printed. Where the answer lives in a grading
   function inside the lab module, the panel says so and prints the
   question's own `explain`, which is the authored sentence about why the
   right answer is right and is always present.

   Never invented. Never inferred. If it is not declared, it is named as
   not declared. */
export function answerPanel(stage, el) {
  const box = el("div", "truth");
  box.appendChild(el("h3", null, "Answers — instructor mode"));
  box.appendChild(el("p", "note",
    "Read off what each question declares. Where a question is graded by the lab's own check "
    + "rather than by a flag on an option, that is said instead of guessed at."));

  const qs = stage.questions || [];
  if (!qs.length) {
    box.appendChild(el("p", null, "No questions on this stage — it is something to read or look at."));
    return box;
  }

  const list = el("ol", "truth-list");
  qs.forEach(function (q) {
    const li = document.createElement("li");
    li.appendChild(el("p", "truth-q", q.prompt || q.key));

    const found = keyFor(q);
    const a = el("p", "truth-a", found.text);
    if (!found.declared) a.classList.add("truth-a-soft");
    li.appendChild(a);

    const why = q.explain || (q.then && q.then.explain);
    if (why) li.appendChild(el("p", "truth-why", why));
    list.appendChild(li);
  });
  box.appendChild(list);
  return box;
}

/* The derivation, one shape at a time, and it refuses rather than
   guesses. Exported so the verifier can drive it without a browser. */
export function keyFor(q) {
  const opts = q.options || (q.then && q.then.options);
  if (opts && opts.length) {
    const right = opts.filter(function (o) { return o.correct; });
    if (right.length) {
      return {
        declared: true,
        text: (right.length === 1 ? "Answer: " : "Answers (all of them): ") +
          right.map(function (o) { return o.label || o.key; }).join("  ·  ")
      };
    }
    /* Options with nothing flagged is a question this panel cannot read,
       and saying so is the whole point of this function. */
    return { declared: false,
      text: "Graded by the lab, not by a flag on an option — see the explanation below." };
  }
  if (q.kind === "number" && typeof q.answer === "number") {
    const tol = q.tolerance == null ? 0.001 : q.tolerance;
    return { declared: true,
      text: "Answer: " + q.answer + (q.unit ? " " + q.unit : "") +
        (tol ? "  (anything within " + tol + " is accepted)" : "") };
  }
  if (q.kind === "order" && (q.steps || []).length) {
    /* THE DECLARED ORDER IS NOT NECESSARILY THE GRADED ORDER, and this
       panel will not pretend otherwise. `askOrder` hands the sequence to
       the lab's own check; a stage is free to accept more than one. The
       steps are printed as REFERENCE, labelled as such. */
    return { declared: false,
      text: "The steps, as the question declares them: " +
        q.steps.map(function (s) { return s.label; }).join(" → ") +
        ".  The lab's own check decides what it accepts." };
  }
  return { declared: false,
    text: "Graded by the lab's own check — the explanation below is the authored answer." };
}
