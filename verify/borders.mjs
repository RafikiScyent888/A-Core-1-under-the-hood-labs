/* BORDERS, WHICH THE CONTRAST SWEEP CANNOT SEE.

   A blind spot this repo already wrote down, in the stylesheet itself:

     "The contrast sweep measures TEXT. Several of these tokens are used
      as BORDER colours as often as ink — and a border is invisible to
      the sweep. Calibrating this pass by planting the dark tint into
      `--st-bad` came back CLEAN, and for a moment that read as a vacuous
      check; it was a colour the sweep can never see."

   That note ends "borders are held by eye and by these definitions, not
   by the sweep", and held by eye is not held. This is the check that
   closes it.

   ---------------------------------------------------------------------
   WHAT IT HOLDS, AND WHY NOT SIMPLY 3:1 ON EVERYTHING

   WCAG 1.4.11 asks 3:1 for the boundaries needed to identify a component
   and for graphics needed to understand content. It does NOT ask it of
   every decorative hairline, and this build is full of deliberately
   quiet ones — `--line` between two rows of a shelf is a separator, not
   a signal, and pushing it to 3:1 would turn every panel into a cage.

   So the borders held here are the ones that CARRY MEANING: a refusal, a
   state, a rule down the side of a panel that says what kind of panel it
   is. Those are exactly the ones the note above names, and exactly the
   ones a student with damaged sight has to be able to see.

   TWO CLAIMS PER TOKEN, and the second is the one that catches the real
   failure mode:

     VISIBLE      3:1 against every surface it could be painted on —
                  ground, panel, raised panel and sunk — in BOTH themes.
                  The worst surface is used rather than the actual one,
                  which is conservative on purpose: resolving which
                  background each rule lands on means re-implementing the
                  cascade, and a checker that re-implements the cascade
                  is a checker that can be wrong in the same way the
                  stylesheet is.

     DIFFERENT    at least 1.5:1 apart from `--line`, the neutral border
                  it replaces. A state border that measures the same as
                  the ordinary one carries NO INFORMATION — the element
                  is marked and looks unmarked — and that failure is
                  invisible to a contrast check that only asks whether it
                  can be seen at all.

   THE LIST IS READ OFF THE STYLESHEET, not typed here. Every token that
   appears in a `border` or `box-shadow` declaration is collected, and the
   meaning-bearing ones are separated from the structural ones by a table
   that has to name a reason for each exemption. A token used as a border
   for the first time tomorrow comes under this check tomorrow, with no
   test to remember to write.
   --------------------------------------------------------------------- */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "assets", "style.css"), "utf8");
const CAL = process.argv.includes("--calibrate");

/* STRUCTURE, NOT SIGNAL — and each one says why it is here, so the list
   is a set of decisions somebody wrote down rather than a place failures
   go to be quiet. */
const STRUCTURAL = {
  "--line": "the neutral hairline between rows and round panels. It is a separator, " +
    "not a state; it is what the meaning tokens are measured AGAINST.",
  "--line-bright": "the same separator, one step up, for an edge that has to be found " +
    "by a finger rather than read. Still no meaning attached to it.",
  "--steel": "the fill and edge of a chosen tab or a primary button. What it means is " +
    "carried by the FILL, which the text sweep measures through --on-steel.",
  "--steel-deep": "the same fill's darker edge, and the same argument."
};

/* The surfaces anything can be painted on. Read from the stylesheet so a
   palette change moves the check with it. */
const SURFACES = ["--ground", "--panel", "--panel-2", "--sunk"];
const THEMES = [
  ["dark", /:root\s*\{([\s\S]*?)\n\}/],
  ["light", /:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/]
];

function palette(re) {
  const m = CSS.match(re);
  if (!m) throw new Error("borders: cannot find that theme's token block in style.css");
  const out = {};
  m[1].replace(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi, function (_, k, v) {
    out[k] = v.trim(); return "";
  });
  return out;
}

function lum(hex) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map(function (c) { return c + c; }).join("") : h;
  const v = [0, 2, 4].map(function (i) {
    const c = parseInt(f.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/* Every token that is actually painted as an edge. `box-shadow` counts:
   the inset rule down the side of a wrong answer is a border in
   everything but the property name, and it is one of the three ways a
   refusal is marked. */
function edgeTokens(css) {
  const found = {};
  const re = /(border[a-z-]*|box-shadow)\s*:\s*([^;{}]+);/gi;
  let m;
  while ((m = re.exec(css))) {
    const vars = m[2].match(/var\((--[a-z0-9-]+)\)/gi) || [];
    vars.forEach(function (v) {
      const k = v.replace(/var\(|\)/g, "");
      found[k] = true;
    });
  }
  return Object.keys(found).sort();
}

const VISIBLE = 3.0;      /* WCAG 1.4.11, non-text contrast */
const APART = 1.5;        /* enough that "marked" does not read as "not marked" */

let css = CSS;
if (CAL) {
  /* THE DEFECT IS PLANTED IN THE EXACT PLACE THE OLD CALIBRATION WENT
     BLIND. The text sweep was calibrated by putting a dark tint into
     `--st-bad` and came back clean, because --st-bad is a border colour
     and the sweep reads ink. So this calibration does the same thing,
     to the same token, and this check has to catch what that one could
     not.

     A second defect, in the other direction: `--ok-line` set to the
     neutral hairline's own value, which is perfectly visible and carries
     nothing. That arm is the one a contrast-only check would miss. */
  css = css.replace(/(--st-bad:\s*)#[0-9a-f]{3,6}/i, "$1#2b3340")
           .replace(/(:root\[data-theme="light"\][\s\S]*?)(--ok-line:\s*)#[0-9a-f]{3,6}/i,
                    "$1$2#c3ccd9");
}

const tokens = edgeTokens(css);
const meaning = tokens.filter(function (t) { return !STRUCTURAL[t]; });
const rows = [];
let bad = 0;

console.log("  edges declared with a token: " + tokens.length +
  "  (" + meaning.length + " carry meaning, " +
  (tokens.length - meaning.length) + " are structure)");
console.log("");

THEMES.forEach(function (th) {
  const [name, re] = th;
  const P = (function () {
    const m = css.match(re);
    if (!m) throw new Error("borders: cannot find the " + name + " token block");
    const out = {};
    m[1].replace(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi, function (_, k, v) { out[k] = v.trim(); return ""; });
    return out;
  })();
  /* The light block only redefines what changes, so anything missing
     falls back to the dark block — which is how the stylesheet itself
     works and the only way the numbers can be right. */
  const base = palette(THEMES[0][1]);
  const at = function (k) { return P[k] || base[k]; };

  meaning.forEach(function (tok) {
    const c = at(tok);
    if (!c || !/^#[0-9a-f]{3,8}$/i.test(c)) {
      rows.push([name, tok, "not a literal colour (" + c + ")"]); bad++; return;
    }
    /* VISIBLE: the worst surface decides. */
    let worst = Infinity, worstOn = "";
    SURFACES.forEach(function (s) {
      const r = ratio(c, at(s));
      if (r < worst) { worst = r; worstOn = s; }
    });
    const apart = ratio(c, at("--line"));
    const trouble = [];
    if (worst < VISIBLE) {
      trouble.push("only " + worst.toFixed(2) + ":1 on " + worstOn + " (needs " + VISIBLE + ")");
    }
    if (apart < APART) {
      trouble.push("only " + apart.toFixed(2) + ":1 from --line, so a marked edge reads unmarked");
    }
    if (trouble.length) bad++;
    rows.push([name, tok + " " + c,
      trouble.length ? "FAIL — " + trouble.join("; ")
        : "visible at " + worst.toFixed(2) + ":1 (" + worstOn.replace("--", "") +
          "), " + apart.toFixed(2) + ":1 clear of the hairline"]);
  });
}); 

rows.forEach(function (r) {
  console.log("  " + r[0].padEnd(6) + r[1].padEnd(22) + r[2]);
});
console.log("");

/* The exemptions, printed every run. A list nobody reads is a list that
   grows. */
Object.keys(STRUCTURAL).forEach(function (k) {
  console.log("  structure: " + k.padEnd(16) + STRUCTURAL[k]);
});
console.log("");

if (CAL) {
  if (bad >= 2) {
    console.log("calibration OK — " + bad + " rows fail with the two defects planted " +
      "(a border the sweep could never see, and one that is visible and says nothing)");
  } else {
    console.log("CALIBRATION FAILED — only " + bad + " rows failed; the check cannot fail");
    process.exit(1);
  }
} else if (bad) {
  console.log(bad + " meaning-bearing border(s) cannot be seen or cannot be told from a plain one");
  process.exit(1);
} else {
  console.log("every meaning-bearing border clears 3:1 on the worst surface in both themes, " +
    "and every one is tellable from the neutral hairline");
}
