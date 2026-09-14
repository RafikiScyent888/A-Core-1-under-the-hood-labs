/* =====================================================================
   A+ Core1 Under the Hood Labs — the wear bench

   ONE PART, DRAWN TWICE. A good one on the left, the one on the bench on
   the right, side by side and to the same scale.

   WHY THIS EXISTS, AND WHY THE WEAR LADDER ON ITS OWN WAS NOT ENOUGH

   The ladder was written first and it was words: "starting to show signs
   of wear", "big chunks of missing rubber". Good words, and useless to a
   student who has never held a good one. You cannot judge how worn
   something is without a reference, and a description is not a
   reference — it is a thing you have to already understand in order to
   picture. The owner said so plainly: there needs to be visible damage
   so a student can see what right looks like and what needs repairing.

   So the comparison is the bench. Not a picture of a broken part; a
   picture of a broken part NEXT TO a good one, which is the only way the
   difference is legible to somebody meeting it for the first time.

   WEAR IS GEOMETRY HERE, NOT TEXTURE, AND THAT IS DELIBERATE

   `surface.js` carries three painters — moulded, rubber and steel —
   that are applied to nothing. Its own note says why: their detail is
   point noise, a pebble finish and a rubber tooth, and point noise does
   not minify. At the distance a bench is viewed from every speck falls
   below a pixel and the filter turns it into crawling static. It was
   tuned five times and left waiting for photographic tiles.

   Wear is not grain. A polished band, a groove worn into a roller, a
   nick in a blade, a chunk out of the rubber — all of that is
   STRUCTURE, and structure minifies cleanly because it stays larger
   than a pixel. So none of it needs a photograph. Damage is cut into
   the geometry, which the engine draws at any distance, and the three
   painters stay unused for the material-grain job they were written for.

   EIGHT SHAPES COVER EVERY WEARING PART IN THE BUILD

   Rather than model eighteen parts, model the eight forms they take.
   A platen, a transfer roller, a fuser roller and a pickup roller are
   all a roller; what differs is what wearing out does to them, and that
   is what the student is here to learn.
   ===================================================================== */

const P2 = Math.PI / 2;

/* The two halves of the bench. Left is always the good one, and this is
   how far each stands from the centre line.

   Widened from +/-9 when the roller gained its drive collar and end
   bushes: the parts grew about seven units longer and the two of them
   started running into each other in the middle, which made one object
   out of the two the whole bench exists to keep apart.

   THE BENCH IS SIZED FOR THE PART, NOT THE OTHER WAY ROUND.
   These are the roller's numbers, and for a long time they were every
   part's numbers, so the separation pad — a 7-unit block — was drawn on a
   46-unit board and came out a chip of grit in the middle distance, with
   its trench and its bald zone far too small to read. A shape declares a
   `span` (how far each copy sits from the centre line) and the board,
   the plates and the camera all scale off it. Width scales with the span
   directly; depth scales with its square root, because the board still
   has to carry the two colour plates in front of a part of ordinary
   depth however narrow it gets. */
const SPAN0 = 13.5;

const RUNGS = ["fresh", "early", "worn", "failed", "perished"];
/* How far through its life, for the rung being shown. Used to scale how
   much damage gets cut in.

   PERISHED SITS ABOVE 1.0 ON PURPOSE, AND THAT IS NOT A ROUNDING SLIP.

   The owner sent a photograph of six real feeder rollers pulled out of
   service, and this ladder stopped one stage short of them. What it
   called "failed" was rubber worn thin and split into bands — a roller
   you would condemn. What came out of their machines had CRACKED INTO
   PLATES AND LIFTED AWAY IN CHUNKS, bare shaft over long stretches,
   ragged edges where it had delaminated, several with almost no rubber
   left at all. That is a state a student will meet and the bench could
   not show.

   The obvious fix — renumber the four rungs to make room — would have
   changed every one of them. Eight shapes share these severities and
   several branch on thresholds at 0.85, 0.9 and 0.95: dropping "failed"
   below 0.95 would quietly put the tread back on a failed tyre. So the
   four keep their numbers exactly, and the new rung goes ABOVE the
   scale. Every `sev >=` threshold still fires, everything that scales
   continuously simply scales further, and nothing that already worked
   moves. */
const SEVERITY = { fresh: 0, early: 0.34, worn: 0.68, failed: 1.0, perished: 1.25 };

/* =====================================================================
   THE EIGHT SHAPES

   Each builder takes (x, sev) — where to draw it, and how far gone it
   is — and returns primitives. sev 0 is a good one; everything above
   that cuts damage in.
   ===================================================================== */

/* ---- ROLLER: platens, transfer, fuser, pickup, feed ---------------

   MATERIAL THAT IS GONE HAS TO BE BUILT AS ABSENT, NOT AS A NOTCH.

   The first cut drew a whole cylinder and then laid dark blocks on it
   where the rubber was supposed to be missing. The engine has no
   boolean subtraction, so those blocks rendered as lumps STUCK ON the
   roller — the exact opposite of the fault, and a student would have
   learned the wrong picture from it.

   So the roller is built from a row of short segments. Wear thins them;
   failure omits some of them entirely. Absent geometry is the only
   honest way to draw absent rubber. */
const ROLL_SEGS = 15;
const ROLL_LEN = 13.0;
/* Segments that have gone, once it is far enough through its life. */
function chunkGone(i, sev) {
  if (sev < 0.85) return false;
  /* PERISHED: MOST OF IT IS GONE, AND IT IS GONE RAGGEDLY.

     The failed rung loses four segments in a tidy, evenly spaced way,
     which reads as wear. The photograph does not look like wear — it
     looks like the rubber gave up: long bare runs with clumps still
     clinging on, uneven along the length, worse at one end than the
     other. So this takes eight of the fifteen and takes them in
     clusters rather than singly, leaving the shaft exposed over real
     distances instead of between neat bands. */
  if (sev >= 1.1) return i === 1 || i === 3 || i === 4 || i === 5 ||
                          i === 9 || i === 10 || i === 12 || i === 13;
  return i === 3 || i === 4 || i === 9 || i === 12;
}
function rollerBody(x, sev) {
  const w = ROLL_LEN / ROLL_SEGS;
  const half = ROLL_LEN / 2;
  /* THE METAL IS METAL, AND IT IS THE BRIGHT PART.

     Re-measured against the owner's photograph of a handful of real feeder
     rollers. Three things there are nothing like what was modelled here,
     and all three were making the part read as a single moulded toy:

       - the shaft is GROUND AND POLISHED, and it is the brightest thing in
         the picture. It was drawn in the tyre's own colour at shade 0.55,
         which made it darker than the rubber. Rubber on a bright bar is
         instantly a roller; dark grey on dark grey is a lump.
       - the drive collar is a FINE STRAIGHT SPLINE, twenty-odd shallow
         teeth, not the deep knurl of eighteen fat blocks that was here.
       - the far end carries a knurled BEARING CAGE, bigger than the shaft
         and clearly a separate machined piece.

     They name their materials rather than carrying a brightness multiplier,
     so the metal is lit as metal instead of being the rubber turned up. */
  const out = [
    /* the shaft, which is the one thing still there when the rubber is not */
    { shape: "cyl", size: [0.95, ROLL_LEN + 6.2], pos: [x, 0, 0], rot: [0, 0, P2], seg: 18,
      mat: "polished" },
    /* the splined drive collar */
    { shape: "cyl", size: [1.75, 1.9], pos: [x + half + 1.3, 0, 0], rot: [0, 0, P2], seg: 22,
      mat: "steel" },
    { shape: "box", size: [0.13, 0.15, 0.15], pos: [x + half + 1.3, 0, 0], r: 0.015,
      mat: "steel", ring: { count: 22, radius: 0.9, axis: "x" } },
    /* the bearing cage at the drive end, and the plain bush at the other */
    { shape: "cyl", size: [1.55, 1.15], pos: [x + half + 2.7, 0, 0], rot: [0, 0, P2], seg: 20,
      mat: "steel" },
    { shape: "box", size: [0.10, 0.20, 0.20], pos: [x + half + 2.7, 0, 0], r: 0.01,
      mat: "steel", ring: { count: 16, radius: 0.80, axis: "x" } },
    { shape: "cyl", size: [1.35, 0.9], pos: [x - half - 1.4, 0, 0], rot: [0, 0, P2], seg: 20,
      mat: "polished" }
  ];
  /* A JOINT THAT NO WEAR HAS MADE MUST NOT BE DRAWN.

     Segmenting is how material can be ABSENT — the engine has no boolean
     subtraction, so a chunk torn out has to be a segment that was never
     drawn, and that is not negotiable. The cost of it was that a FRESH
     roller still arrived as fifteen cylinders butted end to end, all at
     the same 4.2 diameter, and every one of those joints put two cap faces
     in the same plane. That is a z-fight, and fifteen of them down a
     barrel is the corduroy that made this part look moulded out of stacked
     washers.

     Two wrong fixes were tried first and both are worth recording, because
     both LOOKED like reasonable theories. Shrinking the segments to 0.97
     of the pitch replaced the fight with a real groove — same rings, now
     genuinely modelled. Overlapping them to 1.02 made it worse, because
     two coincident cylinder WALLS fight over a band rather than two caps
     fighting on a line. And the third theory — that the accessibility edge
     overlay was drawing a rim circle per segment — was tested by turning
     the overlay off, which changed nothing at all. Measuring beat all
     three guesses.

     So: coalesce. Consecutive segments that are present AND at the same
     diameter become one cylinder, and no joint is drawn between them. A
     fresh roller is a single smooth barrel. As soon as wear makes the
     diameters differ, or tears a chunk out, the runs break apart on their
     own and the steps that appear are steps wear actually made. */
  const runs = [];
  for (let i = 0; i < ROLL_SEGS; i++) {
    if (chunkGone(i, sev)) { runs.push(null); continue; }
    /* The middle of the roller is where the media runs, so that is where
       a groove wears in. Diameter falls with severity, most in the middle. */
    const mid = 1 - Math.abs(i - (ROLL_SEGS - 1) / 2) / ((ROLL_SEGS - 1) / 2);
    /* Rounded before it is compared. Two segments whose diameters differ in
       the fourth decimal are the same cylinder to any eye, and comparing
       raw floats would coalesce nothing at all on a worn roller — which is
       exactly where a stray hairline joint is most likely to be mistaken
       for a crack. */
    runs.push(Math.round((4.2 - sev * mid * 1.1) * 1000) / 1000);
  }
  let i = 0;
  while (i < ROLL_SEGS) {
    if (runs[i] === null) { i++; continue; }
    let j = i;
    while (j + 1 < ROLL_SEGS && runs[j + 1] === runs[i]) j++;
    const n = j - i + 1;
    const cx = x - ROLL_LEN / 2 + (i + n / 2) * w;
    out.push({ shape: "cyl", size: [runs[i], w * n], pos: [cx, 0, 0], rot: [0, 0, P2],
      seg: 72, shade: 1.0 });
    i = j + 1;
  }
  return out;
}
/* The polished band: its own part, because glaze is a different colour
   and a different roughness from the rubber around it. Drawn only on the
   segments that are still there. */
function rollerGlaze(x, sev) {
  if (sev < 0.25) return [];
  const w = ROLL_LEN / ROLL_SEGS;
  const out = [];
  /* The glazed band is the PAPER PATH, not the whole roller, so it stays
     narrow however bad the roller gets. It was widening with severity, and
     since the tread stops being drawn at all once sev >= 0.95, the failed
     roller ended up a bare polished cylinder end to end — a chrome bar,
     louder than the missing chunks that are the actual failure. Loudness
     tracks importance: the band is the width of the media, and no wider. */
  /* And it RETREATS once the rubber starts tearing out, because a polish
     is a surface and the surface is what leaves. Drawn at full width on a
     failed roller it survived the chunks and read as a chrome section in
     the middle of a part whose label says "shaft showing through". */
  const half = sev < 0.85 ? Math.round(1.0 + sev * 1.6) : 1;
  const mid = (ROLL_SEGS - 1) / 2;
  for (let i = 0; i < ROLL_SEGS; i++) {
    if (chunkGone(i, sev)) continue;
    if (Math.abs(i - mid) > half) continue;
    const cx = x - ROLL_LEN / 2 + w / 2 + i * w;
    const m = 1 - Math.abs(i - mid) / mid;
    out.push({ shape: "cyl", size: [4.24 - sev * m * 1.1, w * 0.99], pos: [cx, 0, 0],
      rot: [0, 0, P2], seg: 24, shade: 1.0 });
  }
  return out;
}
/* THE TREAD.

   A pickup roller is not a smooth cylinder — it is ribbed, and the
   ribbing is what grips paper. The owner's photograph of two fresh tyres
   shows it clearly, and it is the single most useful thing to look at,
   because what a worn pickup roller LOOKS like is smooth and shiny where
   the tread used to be. The first roller here had no tread at all, so
   the most recognisable wear signature on the most commonly replaced
   part in a printer was not on the model.

   The ribs shrink towards nothing as severity rises. At the end there is
   no tread left to draw. */
/* How far the tread ribs stand off the tyre at a given severity. ONE
   decision, not two: rollerCracks has to clear this to be visible at all,
   and the two drifted apart the moment they were written separately. */
/* RE-MEASURED AGAINST THE PHOTOGRAPH, and cut to a third of what it was.

   At 0.34 off a 4.2 tyre the ribs stood a sixth of the radius proud, and
   thirty of them down the barrel made the roller look like a radiator —
   the single loudest reason the model read as a toy. On the owner's real
   rollers the moulding stands off by almost nothing; you see it as rings
   catching the light, not as fins with gaps between them.

   It still has to GO, because tread disappearing is the wear cue. That
   works on a shallow rib as well as a deep one: what a student is looking
   for is a band that has gone smooth and shiny next to rubber that has
   not, and the shine is carried by the glaze part and the grain by the
   tyre skin. Height was never doing that job — it was just shouting. */
function treadH(sev) { return sev >= 0.95 ? 0 : 0.055 * (1 - sev); }

function rollerTread(x, sev) {
  if (sev >= 0.95) return [];
  const w = ROLL_LEN / ROLL_SEGS;
  const out = [];
  const h = treadH(sev);
  /* FIVE GROOVES, NOT THIRTY.

     Counted off the owner's photographs: a real pickup tyre carries a
     handful of circumferential grooves across its face, not one per
     centimetre. Two ribs on every one of fifteen segments gave thirty, and
     thirty rings on a barrel is a spring — it was the loudest single thing
     making this part look like a toy, and no amount of texture on top of
     it was ever going to help.

     Every third segment, so the ribs still ride the same per-segment
     diameter the wear model computes and still vanish segment by segment
     as chunks tear out. Fewer, wider, shallower: the cue survives, the
     radiator does not. */
  for (let i = 1; i < ROLL_SEGS; i += 3) {
    if (chunkGone(i, sev)) continue;
    const cx = x - ROLL_LEN / 2 + w / 2 + i * w;
    const mid = 1 - Math.abs(i - (ROLL_SEGS - 1) / 2) / ((ROLL_SEGS - 1) / 2);
    const dia = 4.2 - sev * mid * 1.1;
    out.push({ shape: "cyl", size: [dia + h, w * 0.60], pos: [cx, 0, 0],
      rot: [0, 0, P2], seg: 72, shade: 1.0 });
  }
  return out;
}

/* THE RUBBER PERISHES AND CRACKS BEFORE ANY OF IT COMES OFF.

   The owner's photograph of a handful of real feeder rollers shows this
   clearly, and my ladder had skipped it: glazed, then a groove, then
   chunks gone. Real rubber does something in between — it hardens, and
   then it SPLITS, with cracks opening around the tyre and running in
   from the ends where it meets the collar.

   That is the stage worth teaching, because it is the last one where a
   technician can say "this will not see the year out" before anybody
   is complaining. Drawn as dark splits opening between the segments,
   widening as it goes. */
function rollerCracks(x, sev) {
  if (sev < 0.5) return [];
  const w = ROLL_LEN / ROLL_SEGS;
  const out = [];
  const at = [1, 4, 6, 10, 13];
  /* A CRACK HAS TO SIT PROUD OF THE RUBBER IT IS SPLITTING.
     First cut drew the split at dia + 0.06 while the tread ribs stand at
     dia + TREAD_H(sev) — 0.109 at "worn" — so the crack was BURIED under
     the rubber it was supposed to be opening, and all a student saw was a
     sliver in the gap between rib pairs. Same bug class as the debris
     inside the cassette and the scar inside the element: the engine has no
     boolean subtraction, so anything meant to READ has to clear whatever
     surrounds it. Kept thin, so it reads as a line and not a band. */
  const clear = treadH(sev) + 0.05;
  at.forEach(function (i) {
    if (chunkGone(i, sev)) return;
    const cx = x - ROLL_LEN / 2 + w / 2 + i * w;
    const mid = 1 - Math.abs(i - (ROLL_SEGS - 1) / 2) / ((ROLL_SEGS - 1) / 2);
    const dia = 4.2 - sev * mid * 1.1;
    out.push({ shape: "cyl", size: [dia + clear, 0.09 + sev * 0.13], pos: [cx + w * 0.5, 0, 0],
      rot: [0, 0, P2], seg: 22, shade: 1.0 });
  });
  return out;
}

/* RUBBER BANDS ROUND A SLIPPING ROLLER.

   The owner's photograph, and their note: office staff wind rubber bands
   round a roller that has stopped picking, to get through the afternoon
   until IT arrives. It works, briefly, and a technician who has never
   seen it will not know what they are looking at.

   It is drawn because finding it IS the diagnosis. Bands on a roller
   mean somebody has already decided this roller does not grip, and they
   were right. They come off, the roller gets replaced, and the bands go
   in the bin rather than into the paper path. */
function rollerBands(x, sev, bodged) {
  if (!bodged) return [];
  const out = [];
  const at = [-3.6, -1.2, 0.4, 2.8, 4.4];
  at.forEach(function (o, i) {
    out.push({ shape: "torus", size: [4.9, 0.42], pos: [x + o, 0, 0], rot: [0, P2, 0],
      seg: 20, seg2: 8, shade: 1.0 });
  });
  return out;
}

/* Nothing is drawn for missing rubber. The gaps in the body ARE the
   missing rubber, and adding anything here would put it back. */
function rollerChunks() { return []; }

/* ---- FEED SHAFT: the inkjet one ----------------------------------

   A DIFFERENT PART FROM THE ROLLER ABOVE, not a variant of it.

   `roller` is a pickup roller: one rubber barrel on a short spindle, the
   thing that reaches down and drags the top sheet off the stack. What sits
   further along an inkjet's paper path is a FEED SHAFT — one long ground
   bar carrying half a dozen short tyres spaced across the width of the
   media, driving the sheet on once it is already moving.

   They fail differently, and that is why both are here. A pickup roller
   glazes in one band, in the middle, because one narrow strip of every
   sheet crosses it. A feed shaft's tyres each take their own strip, so it
   wears in a ROW, and the tell is that some tyres are further gone than
   others — which is what makes it skew and misfeed rather than simply stop
   picking. A student who has only seen the single barrel will not
   recognise the row.

   MEASURED OFF THE OWNER'S BENCH PHOTOGRAPH, the one he confirmed is
   fresh, of three inkjet shafts laid out on a white bench. Reading the
   clearest of the three:

     - seven tyres on that one, four and five on the others; six here
     - each tyre is about three quarters as wide as it is across
     - the shaft is about a quarter of the tyre diameter, and it is long,
       running well past the outermost tyre at both ends
     - a toothed drive gear on one end, a plain bush at the other
     - square shoulders on every tyre. Not crowned, not chamfered. */
const FEED_TYRES = 6;
const FEED_SLICES = 5;         /* per tyre, so rubber can be ABSENT */
const FEED_LEN = 27.5;         /* the bar */
const FEED_SPREAD = 21.5;      /* across which the tyres sit: 1.29 diameters
                                  centre to centre, measured off the photo */
const FEED_DIA = 3.4;
const FEED_W = 2.55;           /* 0.75 x diameter, off the photograph */

function feedTyreX(t) {
  return -FEED_SPREAD / 2 + (FEED_SPREAD / (FEED_TYRES - 1)) * t;
}
/* Each tyre takes its own strip of the sheet, so they do NOT wear
   together. The two in the middle see the most paper; the pattern is
   uneven on purpose, because "some are worse than others" is the whole
   diagnosis on this part. */
function feedTyreDia(t, sev) {
  const mid = 1 - Math.abs(t - (FEED_TYRES - 1) / 2) / ((FEED_TYRES - 1) / 2);
  const uneven = [0.82, 1.0, 0.61, 0.94, 0.72, 0.88][t % 6];
  return FEED_DIA - sev * (0.18 + mid * 0.42) * uneven;
}
function feedSliceGone(t, s, sev) {
  if (sev < 0.85) return false;
  return (t === 1 && s === 2) || (t === 3 && (s === 0 || s === 4)) ||
         (t === 4 && s === 1);
}

function feedBody(x, sev) {
  const out = [
    /* the bar, and it is the bright thing */
    { shape: "cyl", size: [0.82, FEED_LEN], pos: [x, 0, 0], rot: [0, 0, P2],
      seg: 40, mat: "polished" },
    /* the toothed drive gear on one end */
    { shape: "cyl", size: [2.2, 1.5], pos: [x + FEED_LEN / 2 - 1.6, 0, 0],
      rot: [0, 0, P2], seg: 30, mat: "dark" },
    { shape: "box", size: [0.34, 0.30, 0.30], pos: [x + FEED_LEN / 2 - 1.6, 0, 0],
      r: 0.03, mat: "dark", ring: { count: 20, radius: 1.15, axis: "x" } },
    /* a plain bush at the other, and one behind the gear */
    { shape: "cyl", size: [1.25, 1.0], pos: [x - FEED_LEN / 2 + 1.1, 0, 0],
      rot: [0, 0, P2], seg: 26, mat: "polished" },
    { shape: "cyl", size: [1.25, 0.8], pos: [x + FEED_LEN / 2 - 3.0, 0, 0],
      rot: [0, 0, P2], seg: 26, mat: "polished" }
  ];
  /* The tyres, each one coalesced across its surviving slices for the same
     reason the roller is: a joint that no wear has made must not be drawn,
     or every tyre arrives pre-grooved and the part reads as stacked
     washers before anything is even wrong with it. */
  const sw = FEED_W / FEED_SLICES;
  for (let t = 0; t < FEED_TYRES; t++) {
    const d = Math.round(feedTyreDia(t, sev) * 1000) / 1000;
    const x0 = x + feedTyreX(t) - FEED_W / 2;
    let s = 0;
    while (s < FEED_SLICES) {
      if (feedSliceGone(t, s, sev)) { s++; continue; }
      let e = s;
      while (e + 1 < FEED_SLICES && !feedSliceGone(t, e + 1, sev)) e++;
      const n = e - s + 1;
      out.push({ shape: "cyl", size: [d, sw * n],
        pos: [x0 + (s + n / 2) * sw, 0, 0], rot: [0, 0, P2], seg: 72, shade: 1.0 });
      s = e + 1;
    }
  }
  return out;
}

/* Two shallow grooves per tyre, and they go the way the roller's do. */
function feedTread(x, sev) {
  if (sev >= 0.95) return [];
  const h = treadH(sev);
  const out = [];
  for (let t = 0; t < FEED_TYRES; t++) {
    const d = feedTyreDia(t, sev);
    [-0.62, 0.62].forEach(function (o) {
      out.push({ shape: "cyl", size: [d + h, FEED_W * 0.22],
        pos: [x + feedTyreX(t) + o, 0, 0], rot: [0, 0, P2], seg: 72, shade: 1.0 });
    });
  }
  return out;
}

/* THE GLAZE IS THE WHOLE CROWN OF A TYRE, not a band across it.

   On the pickup roller the polished band is narrow because one strip of
   paper crosses one long barrel. Here each tyre IS a strip, so a tyre that
   has started to go is shiny right across its face — and the tyres that
   have not are still matte beside it. That contrast down the row is the
   thing to look at, so the glaze is drawn per tyre and only on the ones
   far enough gone to have it. */
function feedGlaze(x, sev) {
  if (sev < 0.25) return [];
  const out = [];
  for (let t = 0; t < FEED_TYRES; t++) {
    const uneven = [0.82, 1.0, 0.61, 0.94, 0.72, 0.88][t % 6];
    if (sev * uneven < 0.30) continue;
    const d = feedTyreDia(t, sev);
    /* Narrow, and DARK. Drawn at 0.86 of the tyre width in a pale grey it
       covered the whole crown and — against rubber that has just gone
       chalky — came back as a polished metal sleeve, so a worn shaft read
       as six chrome collars on a bar. Glazed rubber is shiny DARK: the
       finish carries the shine, and the colour has to sit BELOW the faded
       rubber around it, not above it. Same trap the pickup roller's glaze
       fell into and the same fix. */
    out.push({ shape: "cyl", size: [d + 0.02, FEED_W * 0.55],
      pos: [x + feedTyreX(t), 0, 0], rot: [0, 0, P2], seg: 72, shade: 1.0 });
  }
  return out;
}

/* Splits open at the shoulders first, where the tyre is bonded to the
   bar and cannot move with the rest of the rubber. */
function feedCracks(x, sev) {
  if (sev < 0.5) return [];
  const clear = treadH(sev) + 0.05;
  const out = [];
  [0, 2, 3, 5].forEach(function (t) {
    const d = feedTyreDia(t, sev);
    [-1, 1].forEach(function (sgn) {
      out.push({ shape: "cyl", size: [d + clear, 0.08 + sev * 0.10],
        pos: [x + feedTyreX(t) + sgn * FEED_W * 0.46, 0, 0],
        rot: [0, 0, P2], seg: 72, shade: 1.0 });
    });
  });
  return out;
}

/* ---- SLEEVE: the fuser film -------------------------------------

   A fuser does not wear like a platen and drawing it as one was wrong.
   The owner sent photographs of three melted fusers and they all show
   the same thing: the thin orange film sleeve over the roller wrinkles,
   creases, then SPLITS along its length, and a strip of it peels away
   leaving the darker core underneath on show.

   That is a different failure from a rubber roller glazing and losing
   chunks, and it looks nothing like it. It is also the one that most
   often follows a jam somebody pulled out the wrong way, which is worth
   a student knowing before they yank paper towards themselves.

   Same principle as everywhere else on this bench: the sleeve that has
   gone is drawn by leaving segments out, and what shows through the gap
   is the core. */
const SLV_SEGS = 22;
const SLV_LEN = 13.0;
/* Where the sleeve has split away entirely. A tear runs along the
   roller rather than appearing in scattered spots, so the missing
   segments are contiguous. */
function sleeveGone(i, sev) {
  if (sev < 0.85) return false;
  return i >= 8 && i <= 13;
}
/* The core, always there, and the thing you see when the sleeve is not. */
function sleeveCore(x, sev) {
  return [
    { shape: "cyl", size: [3.3, SLV_LEN + 0.6], pos: [x, 0, 0], rot: [0, 0, P2], seg: 26, shade: 1.0 },
    { shape: "cyl", size: [1.0, SLV_LEN + 2.6], pos: [x, 0, 0], rot: [0, 0, P2], seg: 14, shade: 0.6 }
  ];
}
/* The film itself. Wrinkles ride up as it goes; at the end it is torn
   open and a run of it is simply missing. */
function sleeveFilm(x, sev) {
  const w = SLV_LEN / SLV_SEGS;
  const out = [];
  for (let i = 0; i < SLV_SEGS; i++) {
    if (sleeveGone(i, sev)) continue;
    const cx = x - SLV_LEN / 2 + w / 2 + i * w;
    /* Creasing: alternate segments lift slightly once it starts to go,
       which is what reads as a wrinkled sleeve rather than a smooth one. */
    const crease = sev >= 0.5 ? (i % 3 === 0 ? 0.24 * sev : (i % 3 === 1 ? -0.1 * sev : 0)) : 0;
    out.push({ shape: "cyl", size: [3.9 + crease, w * 0.96], pos: [cx, 0, 0],
      rot: [0, 0, P2], seg: 26, shade: 1.0 });
  }
  return out;
}
/* The strip that has lifted and peeled back, still attached at one end.
   It is the single most recognisable thing in the photographs. */
function sleevePeel(x, sev) {
  if (sev < 0.85) return [];
  const out = [];
  for (let i = 0; i < 6; i++) {
    out.push({ shape: "box", size: [0.9, 0.14, 2.2 + i * 0.5],
      pos: [x - 0.4 + i * 0.55, 2.6 + i * 0.5, 1.4 + i * 0.35],
      rot: [0.5 - i * 0.12, 0, 0.1 * i], r: 0.03, shade: 1.0 });
  }
  return out;
}

/* ---- BLADE: doctor blade, cleaning blade ------------------------- */
function bladeBody(x, sev) {
  /* A blade out of alignment is drawn out of alignment. That tilt IS
     the fault for the cleaning blade, and the owner named it. */
  const tilt = sev >= 0.6 ? 0.13 * sev : 0;
  return [
    { shape: "box", size: [13.0, 3.0, 0.55], pos: [x, 0.4, 0], rot: [0, 0, tilt], r: 0.03, shade: 1.0 },
    /* the stiffener it is bonded to */
    { shape: "box", size: [13.0, 1.2, 1.4], pos: [x, 1.9, -0.5], rot: [0, 0, tilt], r: 0.05, shade: 0.6 }
  ];
}
/* The working edge, its own part because sharp and rounded are the
   whole difference and they want different colours. */
/* Segmented for the same reason the roller is: a nick is a piece of edge
   that is NOT THERE, so it is drawn by leaving a segment out. */
function bladeEdge(x, sev) {
  const tilt = sev >= 0.6 ? 0.22 * sev : 0;
  const n = 26, w = 13.0 / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    if (sev >= 0.55 && (i === 17 || (sev >= 0.9 && (i === 5 || i === 18)))) continue;
    const cx = x - 6.5 + w / 2 + i * w;
    out.push({ shape: "box", size: [w * 0.96, 0.34 + sev * 0.55, 0.62],
      pos: [cx, -1.2 + cx * Math.tan(tilt) * 0.0, 0.05], rot: [0, 0, tilt],
      r: sev > 0.5 ? 0.16 : 0.015, shade: 1.0 });
  }
  return out;
}

/* ---- BAR: thermal heating element, impact print head ------------- */
function barBody(x, sev) {
  return [
    { shape: "rbox", size: [13.0, 2.6, 3.0], pos: [x, 0, 0], r: 0.14, shade: 1.0 },
    { shape: "box", size: [0.25, 1.5, 0.22], pos: [x - 5.8, 0, 1.6], r: 0.02, shade: 0.6,
      repeat: { count: 13, step: [0.95, 0, 0] } }
  ];
}
/* The working face — the line of heaters, or the row of wires.

   Segmented like the roller and the blade, for the same reason: a
   scratch through the wear coat is coating that is NOT THERE, and the
   first cut drew it as a tiny pale speck laid on top, which was
   invisible at bench distance and wrong in principle. Missing coat is
   drawn by leaving segments out. */
const FACE_SEGS = 30;
function faceGone(i, sev) {
  if (sev >= 0.9) return i === 14 || (i >= 5 && i <= 9);
  if (sev >= 0.55) return i === 14;
  return false;
}
function barFace(x, sev) {
  const w = 11.4 / FACE_SEGS;
  const out = [];
  for (let i = 0; i < FACE_SEGS; i++) {
    if (faceGone(i, sev)) continue;
    out.push({ shape: "box", size: [w * 0.94, 0.62, 1.0],
      pos: [x - 5.7 + w / 2 + i * w, 1.5, 1.0], r: 0.03, shade: 1.0 });
  }
  return out;
}
/* What shows THROUGH where the coat has gone — the bare substrate
   underneath, which is a different colour and is the visible tell. */
function barScar(x, sev) {
  if (sev < 0.55) return [];
  const w = 11.4 / FACE_SEGS;
  const out = [];
  for (let i = 0; i < FACE_SEGS; i++) {
    if (!faceGone(i, sev)) continue;
    out.push({ shape: "box", size: [w * 0.94, 0.5, 1.06],
      pos: [x - 5.7 + w / 2 + i * w, 1.46, 1.0], r: 0.02, shade: 1.0 });
  }
  return out;
}

/* ---- PAD: inkjet capping pads ------------------------------------ */
function padBody(x, sev) {
  const squash = 1 - sev * 0.35;
  return [
    { shape: "rbox", size: [4.4, 1.6, 5.0], pos: [x, -1.4, 0], r: 0.12, shade: 1.0 },
    { shape: "rbox", size: [3.0, 1.7 * squash, 2.2], pos: [x - 0.9, 0.2, 0], r: 0.5, shade: 1.0 },
    { shape: "rbox", size: [3.0, 1.7 * squash, 2.2], pos: [x + 0.9, 0.2, 0], r: 0.5, shade: 1.0 }
  ];
}
/* Perishing: cracks across the sealing face. */
function padCracks(x, sev) {
  if (sev < 0.5) return [];
  const out = [];
  for (let i = 0; i < 4; i++) {
    out.push({ shape: "box", size: [0.16, 0.2, 1.9], pos: [x - 1.6 + i * 1.1, 1.0, 0],
      rot: [0, 0.3 * (i % 2 ? 1 : -1), 0], r: 0.01, shade: 1.0 });
  }
  return out;
}

/* ---- BELT: the intermediate transfer belt -------------------------
   From the owner's description of the four states that condemn one. It
   is a polymer film loop that every colour is laid onto in turn before
   the lot is transferred to paper in one pass, which is why its faults
   show up as COLOUR faults:

     1. DINGS, PUNCTURES AND DENTS, from a stapled sheet or a crumpled
        one going through. Permanent indentations in the glossy film.
        Because the loop turns, each one prints a coloured spot at the
        same place every revolution — evenly spaced down the page.
     2. SCRATCHES AND WORN EDGES, scored in as it tracks over its
        tension rollers, worst at the outer margins where it frays and
        thins. A scratch cannot hold its charge evenly, so it prints as
        a persistent vertical streak through solid colour.
     3. STRETCHED FILM. The polymer loses tension, sags, ripples, and
        drifts to one side of its tracks. The machine can then no longer
        land the four colours on the same spot: text goes blurry or
        doubled, with a colour shadow behind it. This is the one that
        gets misdiagnosed as a software or driver problem.
     4. A CLOGGED WASTE HOPPER AND A FAILED WIPER BLADE. The blade that
        scrapes the belt between cycles goes wavy, or the hopper fills
        and backs up. Thick caked bands of loose toner ride round on the
        belt and come off on clean paper as haze and smudging.

   THE DENTS ARE LOWERED TILES, NOT ADDED BUMPS. Same rule as everywhere
   else on this bench: the film is a grid whose height falls where it is
   dented and whose tiles are absent where it is punctured. A dimple
   drawn on top of a flat belt is a pimple.

   AND THE SAG IS REAL GEOMETRY. The ripple is a wave through the tile
   heights rather than a texture, so at "failed" the belt visibly is not
   flat any more — which is the whole reason the colours stop landing on
   top of each other. */
const BELT_NX = 21, BELT_NZ = 11;
const BELT_W = 10.4, BELT_D = 6.2;
const BELT_T = 0.34;              /* film thickness */
const BELT_Y = 0.55;              /* height of the top run */
const SKIN_H = 0.10;              /* the glossy surface layer */
const TONER_H = 0.13;             /* caked toner, which must clear the skin */
function beltRipple(j, sev) {
  /* slack film waves along the direction of travel */
  return Math.sin(j * 0.85) * sev * sev * 0.80;
}
/* Once it has stretched it stops running true and rides against one side
   plate. That drift is the visible cause of the colour misregistration. */
function beltDrift(sev) { return sev >= 0.85 ? 0.6 : 0; }
function beltDent(i, j, sev) {
  if (sev < 0.30) return 0;
  const n = ((i * i * 23 + j * j * 41 + i * j * 7) % 97) / 97;
  return n < (sev - 0.30) * 0.42 ? 0.62 : 0;
}
function beltPunctured(i, j, sev) {
  return sev >= 0.85 && ((i === 6 && j === 4) || (i === 14 && j === 7));
}
/* The outer columns are where it tracks and where it frays. */
function beltFrayed(i, sev) {
  if (sev < 0.50) return 0;
  const edge = i === 0 || i === BELT_NX - 1;
  const near = i === 1 || i === BELT_NX - 2;
  return edge ? (sev - 0.50) * 1.6 : near ? (sev - 0.50) * 0.7 : 0;
}
function beltEach(x, sev, fn) {
  const out = [];
  const tw = BELT_W / BELT_NX, td = BELT_D / BELT_NZ;
  for (let i = 0; i < BELT_NX; i++) {
    for (let j = 0; j < BELT_NZ; j++) {
      if (beltPunctured(i, j, sev)) continue;
      const fray = beltFrayed(i, sev);
      if (fray >= 1) continue;                    /* frayed clean away */
      const h = BELT_T * (1 - beltDent(i, j, sev)) * (1 - fray * 0.75);
      const y = BELT_Y + beltRipple(j, sev);
      const at = [x + beltDrift(sev) - BELT_W / 2 + tw * (i + 0.5), y,
                  -BELT_D / 2 + td * (j + 0.5)];
      const got = fn(i, j, { h: h, fray: fray, dent: beltDent(i, j, sev) }, at, tw, td);
      if (got) out.push(got);
    }
  }
  return out;
}
function beltBody(x, sev) {
  const out = [
    /* the two tension rollers the loop runs round */
    { shape: "cyl", size: [1.05, BELT_W + 0.4], pos: [x, BELT_Y - 0.75, -BELT_D / 2 - 0.7],
      rot: [0, 0, P2], seg: 22, shade: 0.55 },
    { shape: "cyl", size: [1.05, BELT_W + 0.4], pos: [x, BELT_Y - 0.75, BELT_D / 2 + 0.7],
      rot: [0, 0, P2], seg: 22, shade: 0.55 },
    /* the side plates it tracks between — and the reason a belt that has
       drifted is obvious: the gap closes up on one side */
    { shape: "rbox", size: [0.5, 2.6, BELT_D + 3.4], pos: [x - BELT_W / 2 - 0.6, BELT_Y - 0.9, 0],
      r: 0.08, shade: 0.36 },
    { shape: "rbox", size: [0.5, 2.6, BELT_D + 3.4], pos: [x + BELT_W / 2 + 0.6, BELT_Y - 0.9, 0],
      r: 0.08, shade: 0.36 },
    /* the waste hopper underneath, which is what fills up */
    { shape: "rbox", size: [BELT_W + 1.0, 1.5, 2.4], pos: [x, BELT_Y - 2.6, BELT_D / 2 + 0.4],
      r: 0.1, shade: 0.44 },
    /* the return run, hinted below so the loop reads as a loop */
    { shape: "box", size: [BELT_W, 0.16, BELT_D], pos: [x, BELT_Y - 1.5, 0], r: 0.02, shade: 0.5 }
  ];
  beltEach(x, sev, function (i, j, p, at, tw, td) {
    return { shape: "box", size: [tw, p.h, td],
      pos: [at[0], at[1] + p.h / 2, at[2]], r: 0.004, shade: 1.0 };
  }).forEach(function (s) { out.push(s); });
  return out;
}
/* THE GLOSSY SKIN — what right looks like. Gone wherever the film is
   dented, scratched through or frayed, which is what makes those read as
   damage rather than as decoration. */
function beltSkin(x, sev) {
  return beltEach(x, sev, function (i, j, p, at, tw, td) {
    if (p.dent || p.fray > 0.15) return null;
    /* BUTTED, NOT INSET. At 0.94 of a tile the skin left a gap round
       every one of 231 tiles and the glossiest part on the bench read as
       a waffle iron. A continuous surface has to be drawn continuous. */
    return { shape: "box", size: [tw, SKIN_H, td],
      pos: [at[0], at[1] + p.h + SKIN_H / 2 - 0.03, at[2]], r: 0.004, shade: 1.0 };
  });
}
/* THE DENT FLOORS. The tile is already lower; this is the dull, unglazed
   material at the bottom of each dimple, which is what you actually see
   when you tilt a belt to the light looking for them. */
function beltDings(x, sev) {
  return beltEach(x, sev, function (i, j, p, at, tw, td) {
    if (!p.dent) return null;
    return { shape: "box", size: [tw * 0.78, 0.07, td * 0.78],
      pos: [at[0], at[1] + p.h + 0.02, at[2]], r: 0.02, shade: 1.0 };
  });
}
/* SCORE LINES down the direction of travel. Continuous, because that is
   what makes them print as an unbroken vertical streak. */
function beltScore(x, sev) {
  if (sev < 0.35) return [];
  const tw = BELT_W / BELT_NX, td = BELT_D / BELT_NZ;
  const at = [4, 9, 16];
  const out = [];
  at.forEach(function (i, k) {
    if (beltFrayed(i, sev) >= 1) return;
    for (let j = 0; j < BELT_NZ; j++) {
      if (beltPunctured(i, j, sev)) continue;
      const p = { h: BELT_T * (1 - beltDent(i, j, sev)) };
      out.push({ shape: "box", size: [0.11 + k * 0.02, 0.07, td * 1.0],
        pos: [x + beltDrift(sev) - BELT_W / 2 + tw * (i + 0.5),
              BELT_Y + beltRipple(j, sev) + p.h + SKIN_H + 0.02,
              -BELT_D / 2 + td * (j + 0.5)], r: 0.005, shade: 1.0 });
    }
  });
  return out;
}
/* THE FRAYED OUTER MARGINS — thinned and torn where it tracks. */
function beltFray(x, sev) {
  return beltEach(x, sev, function (i, j, p, at, tw, td) {
    if (p.fray <= 0.15) return null;
    return { shape: "box", size: [tw * 0.9, 0.08, td * (0.55 + ((i + j) % 3) * 0.14)],
      pos: [at[0], at[1] + p.h + 0.03, at[2]], r: 0.02, shade: 1.0 };
  });
}
/* CAKED TONER, in bands across the belt, from a hopper that has filled
   up and a blade that is no longer scraping. */
function beltToner(x, sev) {
  if (sev < 0.45) return [];
  const tw = BELT_W / BELT_NX, td = BELT_D / BELT_NZ;
  const out = [];
  const rows = sev >= 0.85 ? [1, 2, 6, 9] : [2, 6];
  rows.forEach(function (j) {
    for (let i = 0; i < BELT_NX; i++) {
      if (beltPunctured(i, j, sev) || beltFrayed(i, sev) >= 1) continue;
      const h = BELT_T * (1 - beltDent(i, j, sev)) * (1 - beltFrayed(i, sev) * 0.75);
      out.push({ shape: "box", size: [tw * 0.96, TONER_H, td * 0.8],
        pos: [x + beltDrift(sev) - BELT_W / 2 + tw * (i + 0.5),
              BELT_Y + beltRipple(j, sev) + h + SKIN_H + TONER_H / 2 - 0.02,
              -BELT_D / 2 + td * (j + 0.5)], r: 0.02, shade: 1.0 });
    }
  });
  return out;
}
/* THE WIPER BLADE. Straight and even when it is doing its job; wavy when
   it is not, and the waves are why the toner gets past it. */
function beltWiper(x, sev) {
  const out = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wave = sev >= 0.55 ? Math.sin(t * 11) * (sev - 0.5) * 0.5 : 0;
    out.push({ shape: "box", size: [BELT_W / n * 0.98, 0.30, 0.22],
      pos: [x + beltDrift(sev) - BELT_W / 2 + (BELT_W / n) * (i + 0.5),
            BELT_Y + 0.05 + wave, BELT_D / 2 + 0.62],
      r: 0.02, shade: 1.0 });
  }
  return out;
}

/* ---- GEAR: a plastic drive gear ----------------------------------
   From the owner's description. A laser printer's rollers, cartridges
   and fuser are all driven through a train of interlocking plastic
   gears at matched speeds, and when one stops meshing the whole timing
   goes with it:

     - TEETH ROUNDED AND FLATTENED by years of friction and heat, so
       they no longer bite;
     - TEETH SNAPPED CLEAN OFF under a violent jam;
     - HAIRLINE CRACKS splitting the hub around the metal shaft.

   The symptom is not a mark on the page — it is a NOISE, and that is
   worth teaching on its own, because it is how this fault announces
   itself: grinding, a rhythmic click once per revolution, and jams that
   look like a feed problem but are a timing problem.

   IT IS DRAWN LYING FLAT, AXIS VERTICAL. On its shaft, edge-on to the
   bench camera, a gear is a disc and every tooth is hidden behind the
   rim. Same lesson as the pad: pick the view the damage is legible
   from. Flat on the bench is also where a technician puts one.

   Teeth are their own MARK rather than part of the body, so the gear
   can be asked about by name — and so a snapped tooth is ABSENT
   geometry rather than a dark patch painted over a tooth that is
   still there. */
const GEAR_TEETH = 24;
const GEAR_ROOT = 3.55;    /* radius at the root of the teeth */
const GEAR_FACE = 1.55;    /* how thick the gear is */
const GEAR_HUB = -0.35;    /* the mid-height it sits at on the bench */
function toothGone(t, sev) {
  if (sev < 0.85) return false;
  return t === 3 || t === 11 || t === 12 || t === 19;
}
/* Radial length of a tooth at this severity: friction takes the tip. */
function toothLen(sev) { return 1.05 - sev * 0.42; }
function gearBody(x, sev) {
  const out = [
    /* the blank the teeth are cut into */
    { shape: "cyl", size: [GEAR_ROOT, GEAR_FACE], pos: [x, GEAR_HUB, 0], seg: 34, shade: 1.0 },
    /* the raised boss round the bore */
    { shape: "cyl", size: [1.45, GEAR_FACE + 0.9], pos: [x, GEAR_HUB + 0.2, 0], seg: 22, shade: 1.18 },
    /* the moulded web ribs between boss and rim — this is what a plastic
       gear actually looks like from above, and it is where the hub
       cracks start */
    /* `ring` takes pos as the CENTRE of the ring and adds the radius
       itself. Passing a pos already offset by the radius put the centre
       2.35 off-axis, and the five ribs orbited a point out in space —
       one of them stuck out past the rim like a propeller blade. */
    { shape: "box", size: [2.0, 0.45, 0.55], pos: [x, GEAR_HUB + 0.85, 0], r: 0.05, shade: 1.3,
      ring: { count: 5, radius: 2.30, axis: "y" } },
    /* the second, smaller stage: these are compound gears, and the small
       stage is usually what drives the next shaft along */
    { shape: "cyl", size: [1.95, 1.0], pos: [x, GEAR_HUB - 1.25, 0], seg: 26, shade: 0.82 },
    { shape: "box", size: [0.55, 0.85, 0.34], pos: [x, GEAR_HUB - 1.25, 0], r: 0.04, shade: 0.9,
      ring: { count: 16, radius: 2.05, axis: "y" } },
    /* the steel shaft through the bore */
    { shape: "cyl", size: [0.62, 7.4], pos: [x, GEAR_HUB, 0], seg: 14, shade: 1.9 },
    /* and the E-clip that holds it on, because that is the bit people
       ping across the room and then cannot find */
    { shape: "cyl", size: [1.0, 0.16], pos: [x, GEAR_HUB + 2.5, 0], seg: 18, shade: 2.1 }
  ];
  return out;
}
/* THE TEETH. Shorten and round off with wear; some are simply gone. */
function gearTeeth(x, sev) {
  const out = [];
  const len = toothLen(sev);
  for (let t = 0; t < GEAR_TEETH; t++) {
    if (toothGone(t, sev)) continue;
    const a = (t / GEAR_TEETH) * Math.PI * 2;
    const rr = GEAR_ROOT + len / 2 - 0.25;
    out.push({ shape: "box", size: [len, GEAR_FACE, 0.62],
      pos: [x + Math.cos(a) * rr, GEAR_HUB, Math.sin(a) * rr],
      /* rotating a box about +y by -a carries its +x face to the
         outward direction (cos a, 0, sin a), so every tooth points out
         of the rim instead of all of them facing the same way */
      rot: [0, -a, 0], r: 0.04 + sev * 0.20, shade: 1.0 });
  }
  return out;
}
/* THE POLISHED FLANK. A tooth that has stopped biting is shiny where it
   used to be sharp, and that shine is the tell you can see before the
   noise starts. Sits proud of the tooth tip so it is not buried in it. */
function gearShine(x, sev) {
  if (sev < 0.28) return [];
  const out = [];
  const len = toothLen(sev);
  for (let t = 0; t < GEAR_TEETH; t++) {
    if (toothGone(t, sev)) continue;
    const a = (t / GEAR_TEETH) * Math.PI * 2;
    /* ON TOP OF THE TOOTH, NOT ON ITS END FACE. Drawn as a sliver at the
       tip it was edge-on to a camera looking down at the gear lying flat
       and painted 401 pixels across the whole bench — technically
       visible, and no use to anybody. The gear is viewed from above, so
       the polish has to be on the surface that faces up. */
    const rr = GEAR_ROOT + len * 0.70 - 0.25;
    out.push({ shape: "box", size: [len * 0.62, 0.12, 0.62 * 0.86],
      pos: [x + Math.cos(a) * rr, GEAR_HUB + GEAR_FACE / 2 + 0.03, Math.sin(a) * rr],
      rot: [0, -a, 0], r: 0.04, shade: 1.0 });
  }
  return out;
}
/* HAIRLINE CRACKS IN THE HUB, radiating out of the bore. They stand
   proud of the web they split, for the same reason the roller's cracks
   had to: buried in the part, a crack renders as nothing at all. */
function gearCrack(x, sev) {
  if (sev < 0.55) return [];
  const out = [];
  const at = [0.4, 1.9, 3.3, 4.9];
  at.forEach(function (a, k) {
    /* HAIRLINE means hairline. At 0.20 wide and sitting on top of the web
       ribs these read as four thick black spokes — a structural feature
       of the gear rather than a crack in it. Thin, and lying on the
       blank's own face, clearing it by just enough to be drawn. */
    const L = 0.9 + sev * 1.0 + k * 0.1;
    const rr = 1.45 + L / 2;
    out.push({ shape: "box", size: [L, 0.10, 0.055 + sev * 0.045],
      pos: [x + Math.cos(a) * rr, GEAR_HUB + GEAR_FACE / 2 + 0.02, Math.sin(a) * rr],
      rot: [0, -a, 0], r: 0.005, shade: 1.0 });
  });
  return out;
}
/* PLASTIC SWARF in the tooth roots — the material the mesh has ground
   off, which is the physical evidence that the noise is this gear and
   not the one next to it. */
function gearSwarf(x, sev) {
  if (sev < 0.45) return [];
  const out = [];
  for (let t = 0; t < GEAR_TEETH; t++) {
    if (((t * t * 29 + t * 11) % 97) / 97 > (sev - 0.45) * 1.6) continue;
    const a = ((t + 0.5) / GEAR_TEETH) * Math.PI * 2;
    out.push({ shape: "box", size: [0.30, 0.22, 0.34],
      pos: [x + Math.cos(a) * (GEAR_ROOT - 0.1), GEAR_HUB + GEAR_FACE / 2 + 0.06,
            Math.sin(a) * (GEAR_ROOT - 0.1)],
      rot: [0, -a, 0], r: 0.06, shade: 1.0 });
  }
  return out;
}

/* ---- SEPAD: the paper separation pad ------------------------------
   NOT the `pad` above. That one is the inkjet capping station, where two
   soft pads seal against the nozzle plate. This is the stationary rubber
   pad in the tray that holds the second sheet back while the pickup
   roller takes the first, and it fails in its own way — from the owner's
   description of the three states that condemn one:

     1. A GLAZED, BALD FRICTION ZONE. The face is micro-textured so a
        sheet cannot slide on it. Thousands of pages over the same path
        abrade that texture away like fine sandpaper, leaving the middle
        flat, smooth and reflective. With no grip it stops holding the
        second sheet back, so pages go through two at a time.
     2. A TRENCH, AND RUBBER LIFTING OFF ITS CARRIER. The roller drives
        every leading edge against the same fixed line, so a groove gets
        carved into the middle, and eventually the compression peels the
        rubber away from the plastic it is bonded to. A new sheet catches
        in the groove and concertinas inside the tray.
     3. CHALKY PAPER DUST. Fibre packs into the pores and the black
        rubber goes a faded, chalky grey. The powder is a dry lubricant:
        the profile can still be fine and the friction is gone anyway.

   Those are three different tells with three different repair urgencies,
   so they are three separate marks the student can be asked to name,
   rather than one lump of "worn".

   THE TRENCH IS ABSENT MATERIAL, NOT ADDED MATERIAL. The pad face is a
   grid of tiles whose height falls where the wear zone is; a groove
   drawn on top of a solid pad renders as a RIDGE, which is the exact
   inverse of the defect, and this build has made that mistake on the
   rollers, the element and the blade already. */
/* The face is a fine grid, not a coarse one. At 9 x 7 the micro-texture
   came out a row of studs — a toy brick, not the fine tooth in the
   photographs — and the trench had too few steps in it to read as a
   curve. The count is what makes this look like a part instead of a
   diagram of a part. */
const PAD_NX = 19, PAD_NZ = 13;
const PAD_W = 5.4, PAD_D = 4.2;   /* the rubber footprint */
const PAD_T = 0.9;                /* fresh thickness */
const PAD_Y = -0.4;               /* the bond plane: top of the plastic carrier */
const PIP_H = 0.10;               /* how far the micro-texture stands off */
const GLZ_H = 0.045;              /* the polished cap over a bald tile */
const DUST_H = 0.035;             /* chalk, which has to clear whichever of those it lands on */
const SEAT_H = 0.10;              /* the adhesive residue left where rubber peeled off */
const SEAT_CLEAR = 0.09;          /* how far it must stand off the carrier to survive the depth test */

/* The pickup roller is a cylinder ACROSS the pad, so the dish it wears is
   wide in x and short in z — a trench, not a crater. Returns the surviving
   thickness and how far gone the surface is, and both marks read the SAME
   function, so the texture can never be drawn on a tile the trench has
   already taken. */
function padProfile(i, j, sev) {
  const cx = (PAD_NX - 1) / 2, cz = (PAD_NZ - 1) / 2;
  const rx = Math.abs(i - cx) / cx;
  const rz = Math.abs(j - cz) / cz;
  const r = Math.min(1, Math.sqrt(rx * rx * 0.55 + rz * rz));
  const loss = Math.min(1, sev * 1.05 * (1 - r));
  return { h: PAD_T * (1 - loss), worn: loss };
}
/* Gone entirely: worn through to the plastic underneath. */
function padThrough(p) { return p.h <= 0.07; }
/* The front rows do not wear away, they PEEL UP, so they leave the body
   and are redrawn curled by the padLift mark. Both sides read this.
   Three rows, not one: at 13 rows deep a single row is a third of a unit
   and a flap that thin cannot be seen to be lifting at all. */
const PAD_PEEL = 3;
function padLifted(j, sev) { return sev >= 0.85 && j >= PAD_NZ - PAD_PEEL; }
function padAt(x, i, j) {
  return [x - PAD_W / 2 + (PAD_W / PAD_NX) * (i + 0.5), 0,
          -PAD_D / 2 + (PAD_D / PAD_NZ) * (j + 0.5)];
}
function padEach(x, sev, fn) {
  const out = [];
  for (let i = 0; i < PAD_NX; i++) {
    for (let j = 0; j < PAD_NZ; j++) {
      if (padLifted(j, sev)) continue;
      const p = padProfile(i, j, sev);
      if (padThrough(p)) continue;
      const at = padAt(x, i, j);
      const got = fn(i, j, p, at);
      if (got) out.push(got);
    }
  }
  return out;
}
function sepadBody(x, sev) {
  const tw = PAD_W / PAD_NX, td = PAD_D / PAD_NZ;
  const out = [
    /* the plastic carrier the rubber is bonded to. Its top IS the bond
       plane, so a tile worn through shows the carrier and not a hole
       into nothing. */
    { shape: "rbox", size: [7.0, 1.1, 5.6], pos: [x, PAD_Y - 0.55, 0], r: 0.14, shade: 0.5 },
    /* the moulded rim the rubber is seated inside, which is what makes a
       lifting edge obvious — it stands proud of a pad that is still down */
    { shape: "box", size: [7.0, 0.34, 0.5], pos: [x, PAD_Y + 0.05, -2.55], r: 0.04, shade: 0.72 },
    { shape: "box", size: [0.5, 0.34, 5.6], pos: [x - 3.25, PAD_Y + 0.05, 0], r: 0.04, shade: 0.72 },
    { shape: "box", size: [0.5, 0.34, 5.6], pos: [x + 3.25, PAD_Y + 0.05, 0], r: 0.04, shade: 0.72 },
    /* the chamfered lip the sheet rides up over on its way in */
    { shape: "box", size: [6.0, 0.22, 0.7], pos: [x, PAD_Y - 0.02, 2.66], rot: [-0.5, 0, 0],
      r: 0.03, shade: 0.66 },
    /* the pivot the pad hinges on, and the spring pocket behind it */
    { shape: "cyl", size: [0.5, 1.3], pos: [x - 3.2, PAD_Y - 0.55, 2.3], rot: [0, 0, P2],
      seg: 14, shade: 0.8 },
    { shape: "cyl", size: [0.5, 1.3], pos: [x + 3.2, PAD_Y - 0.55, 2.3], rot: [0, 0, P2],
      seg: 14, shade: 0.8 },
    { shape: "cyl", size: [1.0, 0.5], pos: [x, PAD_Y - 1.05, -1.4], seg: 16, shade: 0.35 },
    /* moulding ribs underneath, which is what plastic carriers look like */
    { shape: "box", size: [0.22, 0.5, 4.6], pos: [x - 2.0, PAD_Y - 1.1, 0], r: 0.02, shade: 0.4,
      repeat: { count: 5, step: [1.0, 0, 0] } }
  ];
  padEach(x, sev, function (i, j, p, at) {
    return { shape: "box", size: [tw * 0.97, p.h, td * 0.97],
      pos: [at[0], PAD_Y + p.h / 2, at[2]], r: 0.012, shade: 1.0 };
  }).forEach(function (s) { out.push(s); });
  return out;
}
/* THE MICRO-TEXTURE — what right looks like. Present until the surface
   has been polished away, which is what makes the bald zone read as an
   absence rather than as a stain. */
function sepadTexture(x, sev) {
  const tw = PAD_W / PAD_NX, td = PAD_D / PAD_NZ;
  return padEach(x, sev, function (i, j, p, at) {
    if (p.worn >= 0.30) return null;
    /* RIBS, NOT STUDS. Drawn as a stud per tile it came out a waffle —
       a moulded grid, which is a diagram of texture rather than texture.
       The tooth on a real pad runs in fine lines along the direction of
       travel, so each tile carries a full-depth slice of a rib and the
       slices join up into continuous lines down the pad. They still
       follow the trench, because each slice sits on its own tile. */
    return { shape: "box", size: [tw * 0.42, PIP_H, td * 1.0],
      pos: [at[0], PAD_Y + p.h + PIP_H / 2 - 0.02, at[2]], r: 0.015, shade: 1.0 };
  });
}
/* THE BALD, POLISHED ZONE. Sits proud of the tile it caps but stays under
   the height of the texture around it, so the bald patch reads as lower
   and smoother than the grip that survives — which is what it is. */
function sepadGlaze(x, sev) {
  const tw = PAD_W / PAD_NX, td = PAD_D / PAD_NZ;
  if (sev < 0.15) return [];
  return padEach(x, sev, function (i, j, p, at) {
    if (p.worn < 0.30) return null;
    return { shape: "box", size: [tw * 0.95, GLZ_H, td * 0.95],
      pos: [at[0], PAD_Y + p.h + GLZ_H / 2 - 0.02, at[2]], r: 0.01, shade: 1.0 };
  });
}
/* CHALKY PAPER DUST. Lands on whatever is actually on top of each tile —
   texture where it survived, glaze where it did not — so it never sinks
   into a pip or floats above a bald one. Scatter is derived from the tile
   index, not from a random number: a bench builder must draw the same
   part every time it is handed the same severity. */
function sepadDust(x, sev) {
  const tw = PAD_W / PAD_NX, td = PAD_D / PAD_NZ;
  if (sev < 0.22) return [];
  /* Dust is a BLOOM, not a checkerboard. Covering four tiles in ten at
     "early" and at nearly tile width, it came out a bright tiled grid and
     became the loudest thing on a bench whose subject at that rung is
     still an intact textured face. Loudness tracks importance: it starts
     as flecks and only takes the pad over at the end. */
  const cover = (sev - 0.22) * 0.85;
  return padEach(x, sev, function (i, j, p, at) {
    /* A LINEAR HASH LAYS DOWN A LATTICE. (i*7 + j*13) % 10 is regular
       enough that the flecks came out on clean diagonals — a printed
       pattern, not contamination. Squaring the terms breaks the stride. */
    const n = ((i * i * 31 + j * j * 17 + i * j * 13) % 97) / 97;
    /* And it packs in around the wear zone, where the sheets actually
       rub, rather than falling evenly like snow. */
    if (n > cover * (0.45 + 0.75 * p.worn)) return null;
    const bald = p.worn >= 0.30;
    /* Flat and wide, not tall and cubic. At 0.07 deep the flecks stood up
       off the face as little sugar cubes; dust lies IN the surface, so it
       is a film with a footprint, and the footprint is what shows. On the
       ribbed part of the face it can only sit ON a rib, so it takes the
       rib's width; on the bald zone there is nothing to sit on and it
       spreads across the tile. */
    return { shape: "box", size: [tw * (bald ? 0.9 : 0.44), DUST_H, td * (bald ? 0.9 : 1.0)],
      pos: [at[0], PAD_Y + p.h + (bald ? GLZ_H : PIP_H) + DUST_H / 2 - 0.03, at[2]],
      r: 0.01, shade: 1.0 };
  });
}
/* THE RUBBER LIFTING OFF ITS CARRIER.

   Drawn as a CURL, in two segments hinged end to end, because a flat slab
   tipped a little reads as a plank lying on the pad rather than as rubber
   coming away. The first segment rises off the bond line; the second
   leans back over the pad, which is what a peeled edge actually does and
   what makes it unmistakable at a glance.

   The segments are placed by trig from the hinge rather than by eye, so
   they meet exactly however the angles are retuned. */
function padPeelHinge() { return -PAD_D / 2 + (PAD_D / PAD_NZ) * (PAD_NZ - PAD_PEEL); }
function sepadLift(x, sev) {
  if (!padLifted(PAD_NZ - 1, sev)) return [];
  const zh = padPeelHinge();
  const a1 = 1.02, L1 = 1.00;   /* off the bond line */
  const a2 = 2.05, L2 = 0.70;   /* and curling back over itself */
  /* IT PEELS FROM A CORNER, NOT RIGHT ACROSS. That is what rubber
     actually does, and it also keeps the bare seat beside it in view —
     at full width the flap covered the seat completely, which left one
     of this part's five marks a control a student can click and never
     see. An invisible mark is not a mark. */
  const w = PAD_W * 0.56, t = 0.40;
  const xo = x - PAD_W * 0.20;
  const y1 = PAD_Y + Math.sin(a1) * L1, z1 = zh + Math.cos(a1) * L1;
  return [
    { shape: "rbox", size: [w, t, L1],
      pos: [xo, PAD_Y + Math.sin(a1) * L1 / 2, zh + Math.cos(a1) * L1 / 2],
      rot: [-a1, 0, 0], r: 0.05, shade: 1.0 },
    { shape: "rbox", size: [w, t, L2],
      pos: [xo, y1 + Math.sin(a2) * L2 / 2, z1 + Math.cos(a2) * L2 / 2],
      rot: [-a2, 0, 0], r: 0.05, shade: 1.0 }
  ];
}
/* WHAT THE RUBBER LEFT BEHIND: the bare bond line on the carrier. This is
   its own mark rather than a colour on the flap, because the brown is the
   ADHESIVE SEAT, and painting the flap with it said the peeled rubber had
   turned brown — which is not what happens and not what a technician is
   looking for. The flap stays rubber; the seat under it is the tell. */
function sepadSeat(x, sev) {
  if (!padLifted(PAD_NZ - 1, sev)) return [];
  const td = PAD_D / PAD_NZ;
  const zh = padPeelHinge();
  const d = td * PAD_PEEL;
  /* CLEARANCE, NOT A NUDGE. Laid 0.03 above the carrier with a 0.06
     thickness this was drawn, positioned, coloured — and contributed TWO
     pixels, because it was close enough to the surface it sits on to lose
     the depth test to it. Measured back up with the visibility instrument
     (verify/marks-visible.mjs): invisible at 0.03, solid from 0.12. */
  return [{ shape: "box", size: [PAD_W * 0.96, SEAT_H, d * 0.95],
    pos: [x, PAD_Y + SEAT_CLEAR + SEAT_H / 2, zh + d / 2], r: 0.01, shade: 1.0 }];
}

/* ---- DRUM: the OPC photoconductor --------------------------------
   From the owner's description of what a worn drum looks like and what
   it does to the page:

     THE COATING IS A LAYER ON AN ALUMINIUM TUBE. It is the coloured
     photosensitive skin — teal, green or blue depending on the maker —
     and everything that goes wrong with a drum is that skin failing.
     Circumferential score lines, bald edges where it has thinned right
     through to the silver core, pinholes and pockmarks, and dark
     thumbprints where somebody handled it bare-handed.

     SO THE COATING IS BUILT AS A SEPARATE LAYER OVER A FULL-LENGTH
     SILVER TUBE, and wear REMOVES it. Painting silver patches onto a
     teal cylinder would be the same inverse-of-the-defect mistake as
     drawing missing rubber as blocks: what a student needs to see is
     the core showing THROUGH, which only reads if the core is really
     under there and the coating really goes.

   WHY THE DEFECT REPEATS DOWN THE PAGE, which is the exam skill:
   the drum turns once per drum-circumference of paper, so anything at
   one place on it prints at that same place every revolution. A score
   line at one position along the drum's LENGTH marks that same column
   of every page — a vertical line. A single pinhole marks one dot,
   repeating down the page at exactly the drum's circumference. Measure
   the spacing between repeats and it names the roller. */
const DRUM_SEGS = 17;
const DRUM_LEN = 14.0;
const DRUM_CORE = 3.05;   /* the aluminium tube */
const DRUM_COAT = 3.40;   /* the photosensitive skin over it */
/* Where the skin has gone entirely. The EDGES go first, because that is
   where the belt and the cleaning blade track hardest, and one band in
   from the middle where a score line has cut right through. */
function coatGone(i, sev) {
  if (sev < 0.85) return false;
  return i <= 1 || i >= DRUM_SEGS - 2 || i === 6;
}
function drumBody(x, sev) {
  const half = DRUM_LEN / 2;
  /* TESSELLATION. A drum is the roundest thing on this bench and it was
     drawn with thirty facets, which at bench zoom is a visible polygon —
     the coating picked out every flat as a vertical band and the whole
     part read as machined out of a nut. The pickup roller had the same
     fault and it was the single largest thing making it look like a toy:
     three separate theories were tested and disproved before the facet
     count turned out to be the answer, so it is worth carrying straight
     across rather than rediscovering. Round things get 72. */
  return [
    /* the aluminium tube, full length, always there */
    { shape: "cyl", size: [DRUM_CORE, DRUM_LEN], pos: [x, 0, 0], rot: [0, 0, P2],
      seg: 72, mat: "alu" },
    /* the end flanges the drum runs on */
    { shape: "cyl", size: [3.75, 1.1], pos: [x - half - 0.5, 0, 0], rot: [0, 0, P2],
      seg: 56, mat: "dark" },
    { shape: "cyl", size: [3.75, 1.1], pos: [x + half + 0.5, 0, 0], rot: [0, 0, P2],
      seg: 56, mat: "dark" },
    /* the drive gear on one end — this is how you tell which way a drum
       goes back in, and it is the first thing a technician looks for.
       The teeth were 0.44 deep on a 2.6 radius and came out as a ring of
       spikes with daylight between them; a drum gear is fine-pitched and
       its teeth are shallow, so they now read as a milled rim. */
    { shape: "cyl", size: [2.9, 1.3], pos: [x + half + 1.7, 0, 0], rot: [0, 0, P2],
      seg: 56, mat: "dark" },
    /* Sized [axial, radial, tangential] — see the note in shape.js. This
       was [0.30, 0.20, 1.15], which reads as a tooth 1.15 wide TANGENTIALLY
       on a rim whose 34 teeth are 0.28 apart: they would have overlapped
       four deep. The 1.15 was meant to be the width across the wheel, and
       the wheel is 1.3 thick, so that is where it goes. */
    { shape: "box", size: [1.15, 0.20, 0.30], pos: [x + half + 1.7, 0, 0], r: 0.02,
      mat: "dark", ring: { count: 34, radius: 1.52, axis: "x" } },
    /* the axle it turns on */
    { shape: "cyl", size: [0.55, DRUM_LEN + 3.2], pos: [x, 0, 0], rot: [0, 0, P2],
      seg: 40, mat: "polished" }
  ];
}
/* THE PHOTOSENSITIVE COATING. Thins with wear, and goes entirely at the
   edges and through the deepest score first. */
function drumCoat(x, sev) {
  const w = DRUM_LEN / DRUM_SEGS;
  const out = [];
  /* COALESCED, exactly as the pickup roller's rubber is. Seventeen rings
     butted at 0.99 of the pitch left a groove at every joint, so a BRAND
     NEW drum arrived with seventeen score marks already on it — on the
     one part in this build whose entire teaching point is that a score
     line puts a stripe down every page. The reference copy was showing
     the defect the student is being asked to find on the other one.

     Runs of equal radius become one cylinder and no joint is drawn. As
     the edges thin, the radii genuinely differ and the steps appear on
     their own; where the coating has gone the run simply breaks. */
  const rad = [];
  for (let i = 0; i < DRUM_SEGS; i++) {
    if (coatGone(i, sev)) { rad.push(null); continue; }
    /* it thins fastest at the ends, which is what "bald edges" means */
    const edge = Math.abs(i - (DRUM_SEGS - 1) / 2) / ((DRUM_SEGS - 1) / 2);
    const r = DRUM_COAT - sev * (0.10 + edge * 0.22);
    /* QUANTISED COARSELY, and that is the whole point rather than
       sloppiness. The edge-thinning formula gives every one of the
       seventeen segments its own radius to four decimal places, so
       nothing ever coalesced and a worn drum came back with seventeen
       hairline joints round it — on the part whose entire lesson is that
       ONE ring puts ONE stripe down the page. Rounded to 0.06, the middle
       of the drum is genuinely one radius and merges into a smooth tube,
       and only the real bald steps at the ends survive as edges. */
    rad.push(Math.round(Math.max(DRUM_CORE + 0.03, r) / 0.06) * 0.06);
  }
  let i = 0;
  while (i < DRUM_SEGS) {
    if (rad[i] === null) { i++; continue; }
    let j = i;
    while (j + 1 < DRUM_SEGS && rad[j + 1] === rad[i]) j++;
    const n = j - i + 1;
    out.push({ shape: "cyl", size: [rad[i], w * n],
      pos: [x - DRUM_LEN / 2 + (i + n / 2) * w, 0, 0], rot: [0, 0, P2],
      seg: 72, shade: 1.0 });
    i = j + 1;
  }
  return out;
}
/* SCORE LINES, cut through to the bare core. Rings, because a scratch on
   a turning drum runs round it — and a ring at one place along the drum
   is exactly what puts a vertical line down every page. */
function drumScore(x, sev) {
  if (sev < 0.30) return [];
  const w = DRUM_LEN / DRUM_SEGS;
  const at = [3, 6, 11, 14];
  const out = [];
  at.forEach(function (i) {
    if (coatGone(i, sev)) return;
    const edge = Math.abs(i - (DRUM_SEGS - 1) / 2) / ((DRUM_SEGS - 1) / 2);
    const r = DRUM_COAT - sev * (0.10 + edge * 0.22);
    /* stands just proud of the coating so it is not buried in it */
    out.push({ shape: "cyl", size: [r + 0.035, 0.07 + sev * 0.09],
      pos: [x - DRUM_LEN / 2 + w / 2 + i * w, 0, 0], rot: [0, 0, P2], seg: 72, shade: 1.0 });
  });
  return out;
}
/* PINHOLES AND POCKMARKS. Each one prints a dot, repeating down the page
   once per drum revolution. Scattered with a squared hash so they do not
   fall on a lattice. */
function drumPits(x, sev) {
  if (sev < 0.45) return [];
  const out = [];
  const n = Math.round(6 + sev * 16);
  for (let p = 0; p < n; p++) {
    const i = (p * 5 + 2) % DRUM_SEGS;
    if (coatGone(i, sev)) continue;
    const edge = Math.abs(i - (DRUM_SEGS - 1) / 2) / ((DRUM_SEGS - 1) / 2);
    const r = DRUM_COAT - sev * (0.10 + edge * 0.22);
    /* ONLY ON THE FACE THAT IS TOWARDS THE STUDENT. Scattered right round
       the barrel, the pits on the far side sat at coating radius while the
       bare core behind them is thinner — so they peeked out past the
       drum's outline and read as specks floating in the air beside it.
       A defect nobody can see is not teaching anything anyway, so the
       scatter is confined to the visible face. */
    /* Narrowed from (-0.30 .. 1.05). At the bottom of that range a pit
       sat on the underside of the barrel, where the drum's own silhouette
       no longer covers it from this camera — so it projected clear of the
       outline and read as a speck floating beside the part. Confined to
       the face that is actually turned towards the student. */
    const a = 0.08 + ((p * p * 37 + p * 19) % 97) / 97 * 0.86;
    const w = DRUM_LEN / DRUM_SEGS;
    const cx = x - DRUM_LEN / 2 + w / 2 + i * w + (((p * p * 13) % 7) / 7 - 0.5) * w * 0.7;
    /* A pit points OUT of the drum, so its axis is radial. rot [0,0,P2]
       lays a cylinder along x, which is the drum's own axis — every pit
       was lying flat along the barrel instead of standing out of it.
       Default axis is +y, and rotating about x by (P2 - a) carries it to
       (0, sin a, cos a), which is the outward normal at angle a. */
    /* A PINHOLE IS A HOLE. It cannot be subtracted from the coating, so
       it is drawn as a dark disc lying FLUSH on it — 0.05 thick, sitting
       just proud. At 0.24 long it stood a tenth of the drum's radius out
       of the surface and twenty of them read as a row of black posts
       screwed into the barrel, which is the opposite of a pit. */
    out.push({ shape: "cyl", size: [0.22, 0.05],
      pos: [cx, Math.sin(a) * (r + 0.02), Math.cos(a) * (r + 0.02)],
      rot: [P2 - a, 0, 0], seg: 16, shade: 1.0 });
  }
  return out;
}
/* CAKED TONER, which is what the owner's photograph of a heavily failed
   drum actually shows: not a worn coating at all but the surface buried
   under wet-looking black deposit, streaked along the drum.

   It belongs here because it is a DIFFERENT FAULT WITH THE SAME SYMPTOM,
   and telling the two apart is the job. A scored drum and a drum caked in
   toner both put marks down every page at one drum circumference. But a
   score is permanent and the drum is scrap, while caked toner means the
   CLEANING BLADE has stopped scraping — you replace the blade, or the
   drum unit that carries it, and the drum underneath may be fine. A
   student who reads "repeating marks" and orders a drum has bought the
   wrong part.

   Drawn as irregular streaks banded round the barrel rather than as one
   even coat, because that is how it lands: heaviest where the blade has
   lifted, thinning away from it. */
function drumToner(x, sev) {
  if (sev < 0.55) return [];
  const out = [];
  const w = DRUM_LEN / DRUM_SEGS;
  /* RINGS, NOT PLATES.

     First cut laid six flat boxes round the barrel at each of five
     positions, on the theory that a row of tangent plates would close up
     into a smear. It does not: on a curve of radius 3.3 an angular step of
     0.115 puts the plates 0.38 apart along the arc while each is only 0.34
     deep, so they never touch, and every one of them is a flat chord
     standing off a round surface. Thirty of them read as black keys screwed
     to the drum — louder than the coating damage they sit on, and nothing
     like toner.

     A thin cylinder at a slightly larger radius is the only shape in this
     engine that actually follows the barrel. It gives a band right round,
     which is also what the owner's photograph shows: the blade spans the
     full width, so when it lifts, the deposit it fails to scrape builds in
     bands around the drum rather than in patches on one side of it. */
  [[4, 1.35], [5, 0.85], [6, 1.6], [10, 0.7], [11, 1.15]].forEach(function (b) {
    const i = b[0];
    if (coatGone(i, sev)) return;
    const edge = Math.abs(i - (DRUM_SEGS - 1) / 2) / ((DRUM_SEGS - 1) / 2);
    const r = DRUM_COAT - sev * (0.10 + edge * 0.22);
    out.push({ shape: "cyl", size: [r + 0.05, w * b[1] * (0.5 + sev * 0.5)],
      pos: [x - DRUM_LEN / 2 + w / 2 + i * w, 0, 0], rot: [0, 0, P2],
      seg: 72, shade: 1.0 });
  });
  return out;
}

/* THUMBPRINTS. The one kind of damage on this bench that is nobody's
   wear and everybody's fault: skin oil on a photoconductor, put there by
   whoever took it out and held it by the drum instead of the flanges. */
function drumThumb(x, sev) {
  if (sev < 0.60) return [];
  /* ONE PLATE PER PRINT, and the reason is the wire cage.

     Every part on this bench is drawn with an edge overlay on top of it —
     an accessibility feature, and the right one, because an outline
     survives being small and being looked at by someone whose colour
     discrimination is not what it was. But it outlines EVERY PRIMITIVE in
     the part. So a "soft patch" assembled from a cluster of overlapping
     discs is not soft: each disc contributes its own rim to the cage and
     the patch comes back as a heap of petals. Twenty-six discs failed
     that way, and nine larger ones failed the same way with fewer petals.

     A soft-edged thing therefore has to be ONE primitive. A rounded box
     laid tangentially gives one outline, and its corner radius does the
     softening that overlapping discs were supposed to do. It is a flat
     chord on a curved surface, which is exactly what was wrong with the
     first attempt — but that attempt used four of them stepped along the
     drum. One, kept small against a radius of 3.3, sits within about
     0.09 of the surface across its whole width, which the eye reads as
     lying on it.

     The lesson generalises past this part: on this bench, "blurry" is not
     available by adding pieces. It has to come from the shape of a single
     piece, or from its colour sitting close to what is behind it. */
  const out = [];
  const spots = [[-3.4, 0.46], [2.2, 0.78]];
  spots.forEach(function (s0) {
    const rr = DRUM_COAT - sev * 0.12 + 0.02;
    const a = s0[1];
    /* A DISC, because rbox could not deliver the rounded corner. Its
       radius is capped by the smallest dimension of the box, and this
       plate is 0.05 thick — so r: 0.45 quietly became 0.025 and two
       hard-edged rectangles came back looking like stickers pressed onto
       the drum. Worse than the petals they replaced.

       A flat cylinder is the only primitive here that is round AND has a
       single outline. So the print is a disc: one clean curved edge from
       the wire cage, no corners to give it away as a pasted-on shape, and
       the softness carried by a colour that sits close to the coating. */
    out.push({ shape: "cyl", size: [1.55, 0.045],
      pos: [x + s0[0], Math.sin(a) * rr, Math.cos(a) * rr],
      rot: [P2 - a, 0, 0], seg: 28, shade: 1.0 });
    /* A second, smaller and offset, so a print is not a perfect circle. */
    const a2 = a - 0.20;
    out.push({ shape: "cyl", size: [0.95, 0.045],
      pos: [x + s0[0] + 0.72, Math.sin(a2) * rr, Math.cos(a2) * rr],
      rot: [P2 - a2, 0, 0], seg: 24, shade: 1.0 });
  });
  return out;
}

/* ---- STRIP: inkjet encoder strip --------------------------------- */
function stripBody(x, sev) {
  return [
    { shape: "box", size: [14.0, 2.2, 0.14], pos: [x, 0, 0], r: 0.02, shade: 1.0 },
    { shape: "box", size: [0.14, 1.5, 0.08], pos: [x - 6.6, 0, 0.1], r: 0.005,
      shade: 0.3, repeat: { count: 44, step: [0.31, 0, 0] } }
  ];
}
/* Ink mist across the bars, and at the end a tear. */
function stripGrime(x, sev) {
  if (sev < 0.25) return [];
  const out = [];
  const n = Math.round(3 + sev * 6);
  for (let i = 0; i < n; i++) {
    out.push({ shape: "box", size: [0.7 + (i % 3) * 0.6, 1.7, 0.2],
      pos: [x - 5.0 + i * 1.3, 0, 0.18], r: 0.03, shade: 1.0 });
  }
  if (sev >= 0.9) {
    out.push({ shape: "box", size: [0.5, 2.6, 0.3], pos: [x + 4.6, 0, 0.2], rot: [0, 0, 0.5],
      r: 0.02, shade: 1.0 });
  }
  return out;
}

/* ---- SPROCKET: impact tractor pins ------------------------------- */
function sprocketBody(x, sev) {
  return [
    { shape: "cyl", size: [5.0, 2.6], pos: [x, 0, 0], rot: [0, 0, P2], seg: 22, shade: 1.0 },
    { shape: "cyl", size: [1.2, 8.0], pos: [x, 0, 0], rot: [0, 0, P2], seg: 12, shade: 0.55 }
  ];
}
/* The pins. Sharp and square when new; rounded, then bent, then gone. */
function sprocketPins(x, sev) {
  const out = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    /* Two pins are missing altogether once it has failed. */
    if (sev >= 0.85 && (i === 3 || i === 8)) continue;
    const a = (i / n) * Math.PI * 2;
    const bent = sev >= 0.6 && (i % 3 === 0) ? 0.5 : 0;
    out.push({ shape: "box", size: [0.5, 0.7 - sev * 0.22, 0.7 - sev * 0.22],
      pos: [x + 1.1, Math.sin(a) * 2.6, Math.cos(a) * 2.6],
      rot: [a + bent, 0, 0], r: sev > 0.4 ? 0.22 : 0.03, shade: 1.4 });
  }
  return out;
}

/* ---- CONTACT: thermal head flex fingers -------------------------- */
function contactBody(x, sev) {
  return [{ shape: "box", size: [11.0, 0.3, 4.0], pos: [x, 0, 0], r: 0.03, shade: 1.0 }];
}
function contactFingers(x, sev) {
  const out = [];
  for (let i = 0; i < 20; i++) {
    out.push({ shape: "box", size: [0.22, 0.16, 3.0], pos: [x - 4.8 + i * 0.5, 0.22, 0],
      r: 0.01, shade: 1.0 });
  }
  return out;
}
/* Tarnish and corrosion creeping in from the outer fingers, which is
   where it really starts. */
function contactTarnish(x, sev) {
  if (sev < 0.25) return [];
  const out = [];
  const n = Math.round(2 + sev * 7);
  for (let i = 0; i < n; i++) {
    out.push({ shape: "box", size: [0.3, 0.2, 2.0], pos: [x - 4.9 + i * 0.5, 0.26, 0.3],
      r: 0.02, shade: 1.0 });
    out.push({ shape: "box", size: [0.3, 0.2, 2.0], pos: [x + 4.9 - i * 0.5, 0.26, 0.3],
      r: 0.02, shade: 1.0 });
  }
  return out;
}

/* ---- LEVER: thermal latch, impact gap lever ---------------------- */
function leverBody(x, sev) {
  /* A lever whose detent has gone drifts, and drawing it drifted is the
     honest picture of that fault. */
  const drift = sev >= 0.6 ? 0.5 * sev : 0;
  return [
    { shape: "rbox", size: [1.8, 6.0, 1.8], pos: [x, 1.4, 0], rot: [drift, 0, 0], r: 0.3, shade: 1.0 },
    { shape: "cyl", size: [2.6, 2.2], pos: [x, -1.6, 0], rot: [0, 0, P2], seg: 16, shade: 0.6 }
  ];
}
/* The detent notches it is supposed to sit in. They round off. */
function leverDetent(x, sev) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    out.push({ shape: "box", size: [0.5, 0.4 - sev * 0.18, 0.9],
      pos: [x + 1.6, -1.6 + i * 0.9, -1.4], r: sev > 0.4 ? 0.18 : 0.03, shade: 1.0 });
  }
  return out;
}

/* =====================================================================
   The shape table. Each entry says how to draw the part, and what the
   damage on it is CALLED, so the label beside it is in words too.
   ===================================================================== */
const SHAPES = {
  roller: {
    /* THE RUBBER IS PHOTOGRAPHED, the metal inside it is not.

       `tyre` is cut from the owner's own feeder rollers — see the note in
       tiles.js. It goes on the BODY, which means it lands on the rubber
       segments and not on the shaft, the collar or the bearing: those name
       their own materials and are drawn as their own meshes, so the skin
       never reaches them. Grain on a polished shaft would undo the whole
       point of making it polished.

       WHICH PHOTOGRAPH IS OF WHAT.

       This part was first coloured off the owner's photograph of a handful
       of rollers held in one hand — and that photograph is of WORN OUT
       rollers, which he had to point out. So the reference was right and
       the rung was wrong: the chalky grey-green sampled from it had been
       painted onto the GOOD one, and the good one and the failed one were
       being drawn the same colour as each other.

       Reading his three photographs together settles it, because they
       agree. The bench shot of fresh tyres is near-black with a soft sheen
       down the crown. The handful of worn ones has gone pale, flat and
       chalky. The pair of tan rollers with brass journals is the same
       story in a different rubber — the more worn of the two is the paler,
       duller one. Rubber does not wear darker. It loses its colour and its
       shine together.

       So colour is no longer a constant here, it is a RUNG: dark and
       sheened when fresh, pale and dead when finished, mixed across the
       severity between them. That makes the colour shift itself a cue a
       student can read across the bench, which is exactly what the owner's
       "faded, chalky paper dust" description of a worn pad was asking for
       and what a single fixed colour could never show. */
    body: rollerBody, bodyColor: "#2f353a", bodyColorWorn: "#79807a",
    bodyFinish: "rubber", bodySkin: "tyre",
    marks: [
      /* Close to the body colour on purpose. At #22262b the ribs were far
         darker than the tyre and read as separate black fins standing on
         it; the tread is the SAME RUBBER, just standing a little proud —
         so it fades with the tyre rather than staying black on a grey
         barrel, which would read as tread that survived the wear. */
      { build: rollerTread, color: "#333940", colorWorn: "#727a74",
        finish: "rubber", skin: "tyre",
        label: "The tread that grips the paper" },
      /* Glazed rubber is shiny DARK, not silver. The finish carries the
         shine; the colour only has to step clear of the tyre around it. */
      { build: rollerGlaze, color: "#68717a", finish: "plastic", label: "Polished, glazed band" },
      { build: rollerCracks, color: "#0e1012", finish: "matte", label: "The rubber perished and split" },
      { build: rollerChunks, color: "#20242a", finish: "matte", label: "Chunks of rubber missing" },
      { build: rollerBands, color: "#b8a37a", finish: "rubber", bodgeOnly: true,
        label: "Rubber bands somebody has wound round it" }
    ],
    extras: []
  },
  /* The inkjet feed shaft. Wider than anything else on this bench, because
     it is a full media-width bar rather than a spindle, so it declares its
     own span and lets the board and camera size themselves to it. */
  feedshaft: {
    span: 17.0,
    body: feedBody, bodyColor: "#2f353a", bodyColorWorn: "#79807a",
    bodyFinish: "rubber", bodySkin: "tyre",
    marks: [
      { build: feedTread, color: "#333940", colorWorn: "#727a74",
        finish: "rubber", skin: "tyre",
        label: "The grooves that grip the sheet" },
      { build: feedGlaze, color: "#31373d", finish: "plastic",
        label: "Tyres polished smooth \\u2014 and not all of them" },
      { build: feedCracks, color: "#0e1012", finish: "matte",
        label: "Split where the rubber meets the shaft" },
      { build: rollerChunks, color: "#20242a", finish: "matte",
        label: "Rubber missing off a tyre" }
    ],
    extras: []
  },
  sleeve: {
    body: sleeveCore, bodyColor: "#2a2d31", bodyFinish: "steel",
    marks: [
      { build: sleeveFilm, color: "#c8541f", finish: "plastic", label: "The fuser film sleeve" },
      { build: sleevePeel, color: "#8f3a14", finish: "plastic", label: "Sleeve split and peeled back" }
    ],
    extras: []
  },
  blade: {
    body: bladeBody, bodyColor: "#4a525b", bodyFinish: "steel",
    marks: [{ build: bladeEdge, color: "#c8ced4", finish: "metal", label: "The working edge" }],
    extras: []
  },
  bar: {
    body: barBody, bodyColor: "#aab3ba", bodyFinish: "steel",
    marks: [
      { build: barFace, color: "#26303a", finish: "glass", label: "The working face" },
      { build: barScar, color: "#b8442e", finish: "corroded", label: "Scored through to the bare substrate" }
    ],
    extras: []
  },
  pad: {
    body: padBody, bodyColor: "#4d5761", bodyFinish: "rubber",
    marks: [{ build: padCracks, color: "#161a1e", finish: "matte", label: "Perished, cracked across the seal" }],
    extras: []
  },
  /* Three tells, three marks, because they carry three different repair
     urgencies: chalk you can clean, a bald zone you replace at the next
     visit, a trench and a lifting edge you replace today. Colours are
     checked against each OTHER and not only against the rule — the brown
     bond line is the odd one out on purpose, so the peeled edge cannot be
     mistaken for more rubber. */
  /* THE COATING COLOUR IS THE OWNER'S OWN: "typically a bright teal,
     green or blue". Teal sits off the royal six, and the standing rule
     is that anything off the palette gets previewed rather than chosen
     unilaterally — so it is in verify/preview-drum.html to be looked at.
     It is not a decorative choice: a photoconductor coating IS that
     colour, and it is how a student recognises the part. */
  drum: {
    /* Longer than a feed roller once the flanges, drive gear and axle are
       on it — at the roller's span the two copies almost touched and the
       bad one's gear hung off the board. */
    span: 15.5,
    body: drumBody, bodyColor: "#b9bfc4", bodyFinish: "metal",
    marks: [
      /* IT HAZES BEFORE IT GOES. The owner's brief lists haze on the
         page as one of the three tells, alongside the repeating line and
         the repeating dot, and haze on the page IS the coating losing its
         depth of colour. Fresh it is a deep teal you can almost see into;
         finished it is milky and flat. Same rule as the rubber: a part
         whose only colour is its worn colour cannot show wear. */
      { build: drumCoat, color: "#189a8c", colorWorn: "#7fada6", finish: "coating",
        label: "The photosensitive coating" },
      /* A SCORE IS A GROOVE, AND A GROOVE IS DARKER THAN THE METAL
         AROUND IT. At #d3d9dd it was brighter than the aluminium core
         itself, so four scratches read as four polished chrome bands
         clamped round the drum — louder than the coating loss they are
         supposed to be a symptom of. Bare metal in a cut, lit from
         inside a narrow groove, sits below the surface it cuts into. */
      { build: drumScore, color: "#8f979d", finish: "metal",
        label: "Score lines cut through to the bare aluminium" },
      { build: drumPits, color: "#12181c", finish: "matte",
        label: "Pinholes and pockmarks in the coating" },
      /* SKIN OIL DARKENS THE COATING; IT IS NOT RUST SITTING ON TOP
         OF IT. At #5c4a2e the prints came back as two brown scabs — the
         loudest thing on the drum, and reading as corrosion or dried mud
         rather than as the one kind of damage here that a person did with
         their hands. A print is the teal gone dull and dark in the shape
         of a thumb, so the colour is the coating's own, pulled down. */
      { build: drumToner, color: "#141518", finish: "weeping",
        label: "Caked toner the cleaning blade has stopped scraping off" },
      { build: drumThumb, color: "#12857a", finish: "matte",
        label: "Thumbprints from bare-handed handling" }
    ],
    extras: []
  },
  belt: {
    /* Wide and shallow, and all of its damage is on the top run, so the
       camera goes up rather than staying at the roller's eye level. */
    span: 10.6, pitch: 0.74,
    body: beltBody, bodyColor: "#2a2e34", bodyFinish: "plastic",
    marks: [
      { build: beltSkin, color: "#3d434b", finish: "glass",
        label: "The glossy transfer surface" },
      { build: beltDings, color: "#15181c", finish: "matte",
        label: "Dents and punctures from something hard going through" },
      { build: beltScore, color: "#8e96a0", finish: "metal",
        label: "Score lines down the direction of travel" },
      { build: beltFray, color: "#7d7f74", finish: "matte",
        label: "Frayed and thinned outer margins" },
      { build: beltToner, color: "#5e4468", finish: "matte",
        label: "Caked toner the wiper blade is no longer scraping off" },
      { build: beltWiper, color: "#8f7d3e", finish: "rubber",
        label: "The wiper blade edge" }
    ],
    extras: []
  },
  gear: {
    /* Small, and viewed from high up: a gear lying flat shows its teeth,
       and a gear on its shaft shows a disc. */
    span: 7.0, pitch: 0.92,
    body: gearBody, bodyColor: "#454c55", bodyFinish: "plastic",
    marks: [
      { build: gearTeeth, color: "#2c333b", finish: "plastic",
        label: "The drive teeth" },
      { build: gearShine, color: "#9aa4ad", finish: "plastic",
        label: "Rounded, polished tooth flanks that have stopped biting" },
      { build: gearCrack, color: "#0f1216", finish: "matte",
        label: "Hairline cracks splitting the hub around the shaft" },
      { build: gearSwarf, color: "#b9b19c", finish: "matte",
        label: "Ground-off plastic swarf packed into the roots" }
    ],
    extras: []
  },
  sepad: {
    /* A 7-unit part, so the bench closes right in on it rather than
       leaving it a speck on the roller's 46-unit board. */
    span: 6.2, pitch: 0.86,
    body: sepadBody, bodyColor: "#414a53", bodyFinish: "rubber",
    marks: [
      { build: sepadTexture, color: "#252b31", finish: "rubber",
        label: "The micro-texture that holds the second sheet back" },
      { build: sepadGlaze, color: "#8b949c", finish: "plastic",
        label: "Polished bald: the texture is abraded away" },
      /* Chalk, not chalk-white. Paper fibre makes black rubber look
         FADED — a washed-out grey — and at near-white it was the loudest
         thing on a bench whose subject is the bald zone underneath it. */
      { build: sepadDust, color: "#9a9689", finish: "matte",
        label: "Chalky paper dust packed into the pores" },
      /* The flap is rubber, but it is drawn LIGHTER than the pad face,
         because it lands on the carrier — and at a true rubber colour it
         sat on a near-identical dark plastic and the two read as one
         object, so a peeled edge that was fully modelled was invisible.
         Same rule the impact bench broke with its ribbon cassette: one
         colour per part is not enough, adjacent parts must differ. A
         curled edge does catch the light on its cut face, so this is a
         legible drawing rather than a false one. */
      { build: sepadLift, color: "#5b666e", finish: "rubber",
        label: "Rubber lifting and curling off its carrier" },
      { build: sepadSeat, color: "#8a6741", finish: "matte",
        label: "The bare adhesive seat the rubber came off" }
    ],
    extras: []
  },
  strip: {
    body: stripBody, bodyColor: "#dfe4e8", bodyFinish: "plastic",
    marks: [{ build: stripGrime, color: "#4a3f52", finish: "corroded", label: "Ink mist over the bars" }],
    extras: []
  },
  sprocket: {
    body: sprocketBody, bodyColor: "#8d5a3c", bodyFinish: "plastic",
    marks: [{ build: sprocketPins, color: "#d8dde2", finish: "plastic", label: "The drive pins" }],
    extras: []
  },
  contact: {
    body: contactBody, bodyColor: "#2b3036", bodyFinish: "plastic",
    marks: [
      { build: contactFingers, color: "#c8a94e", finish: "metal", label: "Gold contact fingers" },
      { build: contactTarnish, color: "#4a5a3a", finish: "corroded", label: "Tarnish and corrosion" }
    ],
    extras: []
  },
  lever: {
    body: leverBody, bodyColor: "#d1571f", bodyFinish: "plastic",
    marks: [{ build: leverDetent, color: "#6a737c", finish: "plastic", label: "The detent notches" }],
    extras: []
  }
};
export const SHAPE_KEYS = Object.keys(SHAPES);

/* =====================================================================
   wearBench(view)

     view.shape   one of SHAPE_KEYS
     view.rung    "fresh" | "early" | "worn" | "failed"  — the RIGHT one
     view.label   what the part is called
     view.look    the words for what is wrong with it
   ===================================================================== */
/* RUBBER LOSES ITS COLOUR AS IT LOSES ITS GRIP.

   Mixes two hex colours, so a part can name what it looks like fresh and
   what it looks like finished and get every rung in between for nothing.

   It exists because the owner had to point out that the photograph this
   part was coloured from is of WORN OUT rollers — the chalky grey off a
   dead tyre had been painted onto the good one, and the reference copy and
   the failed copy stood side by side in the same colour. A part whose only
   colour is its worn colour cannot show wear at all.

   Deliberately linear and deliberately in sRGB. A physically correct blend
   through linear light goes darker in the middle, and the middle is the
   "worn" rung — the one where a student most needs to see that it has
   started to go pale. */
function mix(a, b, t) {
  if (!b || b === a) return a;
  t = Math.max(0, Math.min(1, t));
  const p = function (h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)];
  };
  const A = p(a), B = p(b);
  return "#" + [0, 1, 2].map(function (i) {
    return Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0");
  }).join("");
}

export function wearBench(view) {
  view = view || {};
  const S = SHAPES[view.shape] || SHAPES.roller;
  const rung = RUNGS.indexOf(view.rung) === -1 ? "worn" : view.rung;
  const sev = SEVERITY[rung];

  /* How far apart the two copies stand, and therefore how big everything
     else on the bench is. A shape that does not say gets the roller's. */
  const span = S.span || SPAN0;
  const k = span / SPAN0;
  const kd = Math.sqrt(k);
  /* A small part needs proportionally MORE board than a big one, because
     the margin either side of it does not shrink with the part — the pad
     was overhanging the front-right corner at a straight k. */
  const kb = k * (1 + 0.20 * (1 - k));
  const gx = -span, bx = span;

  const parts = [];

  /* Filled in once the parts exist: the board and the camera both need the
     same number, and computing it twice is how they drift apart. */
  let boardW = 46 * kb;

  /* ---- the good one, on the left ---- */
  parts.push({ key: "good-body", label: "A good one \\u2014 " + (view.label || "the part"),
    build: S.body(gx, 0), finish: S.bodyFinish, scale: 1, pos: [0, 0, 0],
    color: S.bodyColor, skin: S.bodySkin || null,
    spec: "This is what right looks like.",
    note: "Kept on the bench beside the other one on purpose. Nobody can judge how worn " +
      "something is without something to judge it against." });
  S.marks.forEach(function (M, i) {
    /* The bodge is never on the reference. A good one has no bands on it,
       and that contrast is most of the point. */
    const b = M.bodgeOnly ? [] : M.build(gx, 0, false);
    if (b.length) {
      parts.push({ key: "good-mark-" + i, label: M.label + ", as it should be",
        build: b, finish: M.finish, scale: 1, pos: [0, 0, 0], color: M.color,
        skin: M.skin || null,
        spec: "Undamaged.", note: "" });
    }
  });

  /* ---- the one off the machine, on the right ---- */
  parts.push({ key: "bad-body", label: "The one out of the machine",
    build: S.body(bx, sev), finish: S.bodyFinish, scale: 1, pos: [0, 0, 0],
    color: mix(S.bodyColor, S.bodyColorWorn, sev), skin: S.bodySkin || null,
    spec: view.look || "",
    note: "" });
  S.marks.forEach(function (M, i) {
    const b = M.build(bx, sev, !!view.bodged);
    if (b.length) {
      parts.push({ key: "bad-mark-" + i, label: M.label,
        build: b, finish: M.finish, scale: 1, pos: [0, 0, 0],
        color: mix(M.color, M.colorWorn, sev),
        skin: M.skin || null,
        spec: sev === 0 ? "Undamaged." : M.label + ".", note: "" });
    }
  });

  /* ---- the two name plates under them ---- */
  function plate(x, tone) {
    return [{ shape: "rbox", size: [13.0 * k, 0.4, 2.6 * kd], pos: [x, -3.2, 6.4 * kd],
      r: 0.1, shade: tone }];
  }
  parts.push({ key: "plate-good", label: "Left: a good one",
    build: plate(gx, 1.0), finish: "matte", scale: 1, pos: [0, 0, 0], color: "#2f6f4a",
    spec: "The reference.", note: "" });
  parts.push({ key: "plate-bad", label: "Right: the one you have",
    build: plate(bx, 1.0), finish: "matte", scale: 1, pos: [0, 0, 0],
    color: sev >= 0.85 ? "#8f2f2f" : sev >= 0.5 ? "#8a6a1f" : "#3f5670",
    spec: rung === "fresh" ? "Nothing wrong with this one."
        : rung === "early" ? "Starting to show signs of wear."
        : rung === "worn" ? "Clearly worn." : "Failed.",
    note: "" });

  return {
    kind: "bench",
    title: (view.label || "The part") + " \\u2014 a good one, and the one out of the machine",
    caption: "Left is what right looks like. Right is what came out. Same part, same scale, " +
      "side by side \\u2014 because how worn something is only means anything against something " +
      "that is not.",
    /* THE BOARD IS MEASURED OFF THE PARTS, NOT OFF THE SPAN.

       46 * kb assumes a part's length grows with how far apart the two
       copies stand, which held while every shape on this bench was a
       spindle about as long as its own span. The inkjet feed shaft broke
       it: it is a full media-width bar, long relative to its span, and it
       hung a tyre and its drive gear over the front-left corner into empty
       space. A part floating off the end of the bench reads as a rendering
       fault, and it is the kind that no framing check catches — frustumOK
       asks whether the CAMERA can see the part, and the camera could see
       it perfectly well hanging off the edge.

       So take the widest thing actually built and make the board cover it.
       `maxHalf` is deliberately a loose bound — half the largest dimension
       of a piece, whichever axis that turns out to be — because a board a
       little too wide costs nothing and a board a little too narrow costs
       the illusion. The old formula stays as the floor, so nothing that
       fitted before gets smaller. */
    board: (function () {
      var reach = 0;
      parts.forEach(function (p) {
        (p.build || []).forEach(function (q) {
          var s = q.size || [1, 1, 1];
          var maxHalf = Math.max(s[0] || 0, s[1] || 0, s[2] || 0) / 2;
          reach = Math.max(reach, Math.abs((q.pos && q.pos[0]) || 0) + maxHalf);
        });
      });
      boardW = Math.max(46 * kb, (reach + 1.6) * 2);
      return {
        size: [boardW, 0.5, 20 * kd], pos: [0, -3.6, 0], color: "#2f3944",
        build: [{ shape: "rbox", size: [boardW, 0.5, 20 * kd], pos: [0, 0, 0], r: 0.14, shade: 1.0 }],
        scale: 1
      };
    })(),
    decor: [],
    parts: parts,
    /* fitWidth is measured against frustumOK(), never guessed. It is the
       world width the bench must show at ANY canvas aspect; dist is only
       the closest the camera will come. */
    /* Pitch is per shape. A roller carries its damage on a curved flank
       and reads from the side; a pad carries ALL of it — trench, bald
       zone, dust — on one flat top face, which at the roller's shallow
       pitch is foreshortened to nothing. Same failure as an occluded
       part, different cause, and the same answer: pick the view the
       damage is legible from rather than one view for everything. */
    /* FITWIDTH IS NOT THE BOARD WIDTH. It was, and verify/wear-frame.mjs
       found 54 clipped views because of it — including on sprocket,
       contact and lever, which nobody had touched. Two reasons it has to
       be wider than the board:
         - frustumOK works on each part's bounding SPHERE, and a part as
           wide as the board has a sphere wider than the board;
         - the parts and the name plates sit in FRONT of the board's
           centre, and anything nearer the camera projects further out,
           so a plate whose corner is inside the board's width can still
           leave the frame.
       The margin is measured against that check, not guessed. */
    /* The camera follows the board. When the board grew to cover a part
       longer than its span, a fitWidth still pinned to 46 * kb framed the
       OLD board and cropped the new one — so the two are tied together
       rather than tuned twice and left to drift apart. */
    camera: { dist: 26.0 * kd, fitWidth: boardW * 1.20, yaw: 0.20, pitch: S.pitch || 0.40,
      target: [0, -0.8, 1.4 * kd], min: 8, max: 70 }
  };
}
