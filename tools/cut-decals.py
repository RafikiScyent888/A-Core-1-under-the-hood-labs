#!/usr/bin/env python3
"""Cut named regions out of a reference image and emit tiles.js decal entries.

WHY THIS EXISTS

Every photographed surface in this build until now was a MATERIAL: a square
of rubber grain or paper dust, made seamless, wrapped round a part any number
of times. That is the right treatment for what a thing is MADE OF and the
wrong one for what a thing IS. A screen showing a map, a printed battery
label, a board with its own components in their own places — those are
pictures of specific objects, and tiling one four times across a phone screen
says the phone is showing four maps.

surface.js grew a `decal: true` mode for exactly that: stretched once across
the part, clamped at the edges, carrying its own colour rather than
multiplying over the part's. This is the other half — it takes a reference
image the owner supplied, cuts the named rectangles out, and prints the
tiles.js entries ready to paste.

    python3 tools/cut-decals.py <image> name=x,y,w,h [...]           a rectangle
    python3 tools/cut-decals.py <image> name=x1,y1,x2,y2,x3,y3,x4,y4  a quad

Coordinates are FRACTIONS of the image, 0 to 1, from the top left, so they
survive the image being resized and can be read off any viewer without
knowing the pixel dimensions.

THE QUAD FORM IS THE ONE THAT MATTERS FOR SCREENS. Anything photographed at
a three-quarter angle — which is every reference of a phone anybody actually
takes — has its flat faces as parallelograms. Cropping a rectangle out of one
and stretching it onto a flat part leans the whole picture: the map's roads
run downhill and the status bar sits at an angle, and it looks wrong in a way
that is hard to name and impossible to ignore.

Four corners, clockwise from the TOP LEFT of the face as it appears in the
photograph, and the crop is un-projected onto a true rectangle first. That is
the difference between a screen cut out of a photo and a screen that looks
like it came off a phone.

It also writes a contact sheet beside the source. LOOK AT IT before pasting:
a decal is judged on the part, not on the rectangle. The tyre tile took four
attempts and every one of them looked fine as a crop.

WHAT IT DELIBERATELY DOES NOT DO

It does not make the crop seamless, and it must not. Seam-blending rolls the
image by half and blends across the middle — exactly right for grain, and it
destroys a picture: a map's roads would run off one edge and reappear
ghosted through the centre.

It does not correct perspective. A region cut from a three-quarter view is a
parallelogram, and stretched onto a rectangular face it leans. Cut from the
most face-on thing available, and if nothing in the reference is face-on, say
so rather than shipping a leaning screen.

It was written in Python rather than Node because this container has PIL and
does not have the `canvas` module — a tool that cannot run is not a tool.
"""
import sys, os, re, base64, io as _io
from PIL import Image

LONG = 640          # the long side of a decal, in pixels
MAX_KB = 700        # past this, say something: students download this file

def die(msg, code=2):
    print(msg, file=sys.stderr); sys.exit(code)

if len(sys.argv) < 3:
    die("usage: python3 tools/cut-decals.py <image> name=x,y,w,h ...\n"
        "       coordinates are fractions of the image, 0 to 1, from the top left")

src = sys.argv[1]
if not os.path.exists(src):
    die("cut-decals: no such image: " + src + "\n"
        "If a reference has been supplied and is not on disk, ask for it to be SAVED into\n"
        "the repo. An image that exists only inside a chat message cannot be cut — its\n"
        "bytes are not written to the session transcript, so nothing can read them.")

regions = []
for a in sys.argv[2:]:
    m = re.match(r'^([A-Za-z][A-Za-z0-9]*)=([-\d.,]+)$', a)
    if not m:
        die('cut-decals: could not read region "%s"\n'
            'Expected name=x,y,w,h (a rectangle) or name=x1,y1,..,x4,y4 (a quad).' % a)
    n = m.group(1)
    v = [float(t) for t in m.group(2).split(",")]
    if len(v) == 4:
        x, y, w, h = v
        if x < 0 or y < 0 or w <= 0 or h <= 0 or x+w > 1.0001 or y+h > 1.0001:
            die("cut-decals: region %s falls outside the image." % n)
        quad = [(x, y), (x+w, y), (x+w, y+h), (x, y+h)]
    elif len(v) == 8:
        quad = list(zip(v[0::2], v[1::2]))
        for (px, py) in quad:
            if px < -0.001 or py < -0.001 or px > 1.001 or py > 1.001:
                die("cut-decals: a corner of %s falls outside the image." % n)
    else:
        die("cut-decals: %s needs 4 numbers (a rectangle) or 8 (a quad), got %d." % (n, len(v)))
    regions.append((n, quad))

img = Image.open(src).convert("RGB")
W, H = img.size
print("source: %s  %d x %d" % (os.path.basename(src), W, H), file=sys.stderr)

def unproject(im, quad_px, out_w, out_h):
    """Map an arbitrary quadrilateral in `im` onto a true out_w x out_h
    rectangle. PIL's PERSPECTIVE transform wants the coefficients of the
    map from OUTPUT coordinates back to INPUT ones, so the system is set
    up in that direction and solved directly."""
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = quad_px
    dst = [(0, 0), (out_w, 0), (out_w, out_h), (0, out_h)]
    A, B = [], []
    for (dx, dy), (sx, sy) in zip(dst, quad_px):
        A.append([dx, dy, 1, 0, 0, 0, -sx*dx, -sx*dy]); B.append(sx)
        A.append([0, 0, 0, dx, dy, 1, -sy*dx, -sy*dy]); B.append(sy)
    # Gaussian elimination on the 8x8 — no numpy in this container.
    M = [row[:] + [b] for row, b in zip(A, B)]
    for c in range(8):
        piv = max(range(c, 8), key=lambda r: abs(M[r][c]))
        if abs(M[piv][c]) < 1e-12:
            die("cut-decals: those four corners are degenerate — they do not form a quad.")
        M[c], M[piv] = M[piv], M[c]
        for r in range(8):
            if r == c: continue
            f = M[r][c] / M[c][c]
            for k in range(c, 9): M[r][k] -= f * M[c][k]
    coeffs = [M[i][8] / M[i][i] for i in range(8)]
    return im.transform((out_w, out_h), Image.PERSPECTIVE, coeffs, Image.BICUBIC)

rows, total = [], 0
for n, quad in regions:
    qpx = [(px*W, py*H) for (px, py) in quad]
    # the output size follows the quad's own average edge lengths, so a tall
    # narrow face does not come back square
    def dist(a, b):
        return ((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5
    wpx = (dist(qpx[0], qpx[1]) + dist(qpx[3], qpx[2])) / 2
    hpx = (dist(qpx[0], qpx[3]) + dist(qpx[1], qpx[2])) / 2
    sc = LONG / max(wpx, hpx)
    ow, oh = max(1, round(wpx*sc)), max(1, round(hpx*sc))
    crop = unproject(img, qpx, ow, oh)
    frac = (quad[0][0], quad[0][1], wpx/W, hpx/H)
    buf = _io.BytesIO(); crop.save(buf, "JPEG", quality=86, optimize=True)
    uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    kb = round(len(uri)/1024); total += kb
    rows.append((n, crop, uri, kb, frac))

# the contact sheet
SHEET_W, ROW_H = 940, 220
sheet = Image.new("RGB", (SHEET_W, ROW_H*len(rows) + 20), (27, 32, 39))
for i, (n, crop, uri, kb, frac) in enumerate(rows):
    th = 200; tw = max(1, round(th * crop.width / crop.height))
    sheet.paste(crop.resize((min(tw, 520), th), Image.LANCZOS), (20, 10 + i*ROW_H))
try:
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for i, (n, crop, uri, kb, frac) in enumerate(rows):
        yy = 10 + i*ROW_H
        d.text((580, yy+28), n, fill=(232, 238, 244))
        d.text((580, yy+52), "%d x %d px" % crop.size, fill=(159, 176, 192))
        d.text((580, yy+72), "%d KB as a data URI" % kb, fill=(159, 176, 192))
        d.text((580, yy+92), "x %.3f  y %.3f  w %.3f  h %.3f" % frac, fill=(159, 176, 192))
except Exception:
    pass
sheet_path = os.path.join(os.path.dirname(src) or ".",
                          "CROPS-" + re.sub(r'\.\w+$', '', os.path.basename(src)) + ".png")
sheet.save(sheet_path)
print("contact sheet: " + sheet_path, file=sys.stderr)
print("LOOK AT IT before pasting. A decal is judged on the part, not the crop.\n", file=sys.stderr)
print("total added to tiles.js: about %d KB" % total, file=sys.stderr)
if total > MAX_KB:
    print("WARNING: that is a lot for a file students download offline.", file=sys.stderr)
print("", file=sys.stderr)

for n, crop, uri, kb, frac in rows:
    print("  %s: {" % n)
    print("    /* Cut from the owner's own reference image with")
    print("       tools/cut-decals.py. %d x %d." % crop.size)
    print("       A DECAL, not a tile: stretched once across the part and clamped,")
    print("       because it is a picture of a specific thing rather than a sample")
    print("       of what that thing is made of. */")
    print("    decal: true,")
    print("    /* Width over height, as cut. A decal must not be stretched: a part")
    print("       carrying one has to be built to THIS shape, and bench-mobile's")
    print("       checkDecalIsNotStretched holds it to that. */")
    print("    aspect: %.4f," % (crop.width / crop.height))
    print('    credit: "the owner\'s own reference image",')
    print('    look: "",')
    print('    src: "%s"' % uri)
    print("  },")
