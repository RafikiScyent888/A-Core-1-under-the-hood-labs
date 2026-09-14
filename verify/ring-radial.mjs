/* A RINGED COPY MUST FACE OUTWARD, ON ALL THREE AXES.

   `ring` in assets/shape.js places n copies of a primitive round an axis
   and turns each one so it faces out from the centre. That turn had the
   wrong SIGN on the X and Z axes for the whole life of this build: copies
   were rotated by -a where they sit at +a, which leaves every copy 2a
   away from radial. A quarter of the way round, that is ninety degrees —
   the copy lies flat.

   It went unseen because most ringed things here are SQUARE in the plane
   of the ring: sprocket pins, collar splines, gear teeth cut from cubes.
   A square is unchanged by the error, so seven of the ten ringed features
   in this repo looked perfect while the engine under them was wrong. The
   three that were not square were wrong in plain sight and had been
   looked at: the nine-blade PSU fan on the power bench with four blades
   edge-on, the spoked wheel on the impact bench with half its spokes
   tangential, and the sprocket rim on the wear bench.

   That is the lesson worth keeping and it is why this check tests the
   ENGINE rather than a render: a defect that only shows on non-square
   inputs is invisible in the common case, and "it looks right" was true
   of most of the evidence.

   The contract, and the size order that follows from it:

     ring about X — copies live in YZ, so size is [axial, radial, tangential]
     ring about Y — copies live in XZ, so size is [radial, axial, tangential]
     ring about Z — copies live in XY, so size is [radial, tangential, axial]

   usage: node verify/ring-radial.mjs [--calibrate]

   --calibrate re-applies the original sign to a private copy of the same
   arithmetic and requires this check to FAIL, so a pass here is worth
   something. */
import { expand } from "../assets/shape.js";

const CAL = process.argv.includes("--calibrate");
const TOL = 0.5;                       /* degrees off radial we will accept */

/* Rotate a vector by an XYZ Euler triple the way three.js Object3D does:
   R = Rx * Ry * Rz, so the vector is turned by Z first. */
function rot(v, r) {
  let [x, y, z] = v, c, s;
  c = Math.cos(r[2]); s = Math.sin(r[2]); [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(r[1]); s = Math.sin(r[1]); [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(r[0]); s = Math.sin(r[0]); [y, z] = [y * c - z * s, y * s + z * c];
  return [x, y, z];
}

/* The local direction that should end up pointing radially outward, per
   axis — the first entry of the size triple's radial slot. */
const OUTWARD = { x: [0, 1, 0], y: [1, 0, 0], z: [1, 0, 0] };

/* The broken arithmetic, kept here and nowhere else, so --calibrate can
   plant exactly the defect this check exists to catch. */
function brokenExpand(p) {
  const out = [];
  const n = p.ring.count, rad = p.ring.radius, ax = p.ring.axis;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (p.ring.phase || 0);
    const r0 = p.rot ? p.rot.slice() : [0, 0, 0];
    if (ax === "y") out.push({ pos: [Math.cos(a) * rad, 0, Math.sin(a) * rad], rot: [r0[0], r0[1] - a, r0[2]] });
    else if (ax === "x") out.push({ pos: [0, Math.cos(a) * rad, Math.sin(a) * rad], rot: [r0[0] - a, r0[1], r0[2]] });
    else out.push({ pos: [Math.cos(a) * rad, Math.sin(a) * rad, 0], rot: [r0[0], r0[1], r0[2] - a] });
  }
  return out;
}

let bad = 0, checked = 0;
for (const axis of ["x", "y", "z"]) {
  /* Counts chosen so some copies land at the angles where the sign error
     is worst (a quarter turn) and some where it hides (a half turn). A
     count of 2 or 4 alone would have reported the old engine as clean. */
  for (const count of [3, 5, 8, 9, 12, 34]) {
    const spec = { shape: "box", size: [0.3, 1.0, 0.2], pos: [0, 0, 0],
      ring: { count: count, radius: 1.0, axis: axis } };
    const copies = CAL ? brokenExpand(spec) : expand([spec]);
    let worst = 0, worstAt = 0;
    copies.forEach(function (c, i) {
      const dir = rot(OUTWARD[axis], c.rot);
      const n = Math.hypot(c.pos[0], c.pos[1], c.pos[2]);
      const u = c.pos.map(function (v) { return v / n; });
      const dot = Math.min(1, Math.abs(dir[0] * u[0] + dir[1] * u[1] + dir[2] * u[2]));
      const deg = Math.acos(dot) * 180 / Math.PI;
      if (deg > worst) { worst = deg; worstAt = i; }
    });
    checked++;
    if (worst > TOL) {
      bad++;
      console.log("  axis " + axis + ", " + count + " copies: copy " + worstAt +
        " is " + worst.toFixed(1) + " degrees off radial");
    }
  }
}

if (CAL) {
  if (bad === 0) {
    console.log("ring-radial --calibrate: THE PLANT WAS NOT CAUGHT. " +
      "The original sign was re-applied on all three axes and every copy still came " +
      "back radial, so this check is measuring something other than what it claims. " +
      "Its passes mean nothing until that is understood.");
    process.exit(1);
  }
  console.log("ring-radial --calibrate: clean — the planted sign flip was caught in " +
    bad + " of " + checked + " cases (the ones it hides in are the square-count cases, " +
    "which is the point).");
  process.exit(0);
}

if (bad) {
  console.log("ring-radial: " + bad + " of " + checked + " ring cases are not radial.");
  process.exit(1);
}
console.log("ring-radial: clean — " + checked + " ring cases across all three axes, " +
  "every copy radial within " + TOL + " degrees.");
