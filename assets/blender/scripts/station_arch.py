"""Architecture generators for the VØRAX station: walls, ceilings, floors, portals, signs.

Everything is placed from assets/blender/layout.json, so the visible shell sits exactly on
the game's collision. Decoration never extends more than ~0.27 m from a wall plane below
head height, because nothing here has collision of its own.
"""

import math

from mathutils import Matrix
from vorax_lib import P, T, plan_frame, rad

CEIL = 3.4
SGN = {"N": 1, "S": -1, "E": -1, "W": 1}
# prism profile (y, z) extruded along local X
YZX = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
# prism profile (x, z) extruded along local Y
XZY = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


def wall_frame(w, t):
    mid = (w["a0"] + w["a1"]) / 2
    if w["side"] == "N":
        return T(P(mid, w["z"] - t), (0, 0, math.pi))
    if w["side"] == "S":
        return T(P(mid, w["z"] + t), (0, 0, 0))
    if w["side"] == "E":
        return T(P(w["x"] - t, mid), (0, 0, math.pi / 2))
    return T(P(w["x"] + t, mid), (0, 0, -math.pi / 2))


def bay_cuts(w, rect):
    """Bay boundaries on a 2 m grid measured from the room corner, so ribs meet ceiling beams."""
    lo = rect["x0"] if w["side"] in "NS" else rect["z0"]
    cuts = [w["a0"]]
    k = 1
    while lo + 2 * k < w["a1"] - 0.55:
        if lo + 2 * k > w["a0"] + 0.55:
            cuts.append(lo + 2 * k)
        k += 1
    cuts.append(w["a1"])
    return list(zip(cuts, cuts[1:]))


def bolts(z, w, h, y, zc, inset=0.05, r=0.013):
    for sx in (-1, 1):
        for sz in (-1, 1):
            z.cyl(r, 0.012, (sx * (w / 2 - inset), y, zc + sz * (h / 2 - inset)), "steel", rot=(rad(90), 0, 0), segs=6)


def plate(z, w, h, zc, x=0.0, depth=0.04, mat="wall", rng=None, bolted=True):
    rot = (0, 0, 0)
    if rng is not None and rng.random() < 0.07:  # a loose plate hangs slightly askew
        rot = (rad(rng.uniform(-3, 3)), rad(rng.uniform(-2.5, 2.5)), 0)
        depth += 0.02
    z.push(T((x, -depth / 2, zc), rot))
    z.box((w, depth, h), (0, 0, 0), mat, bevel=0.006)
    if bolted:
        bolts(z, w, h, -depth / 2 - 0.004, 0)
    z.pop()


def rib(z, u):
    z.box((0.26, 0.2, 2.2), (u, -0.1, 1.44), "struct", bevel=0.02)
    z.box((0.34, 0.26, 0.34), (u, -0.13, 0.17), "struct", bevel=0.02)
    z.beam((u, -0.16, 2.5), (u, -0.6, CEIL - 0.04), 0.26, 0.14, "struct")
    z.box((0.12, 0.02, 0.2), (u, -0.205, 1.5), "steel")
    z.box((0.27, 0.21, 0.05), (u, -0.1, 0.62), "hazard")


# ---------------------------------------------------------------- bay variants
# Each draws one bay centred on local X=0, between z=0.36 and z=2.44, protruding towards -Y.


def bay_plates(z, cw, rng, ctx):
    for z0, z1 in ((0.37, 1.1), (1.13, 1.86), (1.89, 2.44)):
        cols = 2 if cw > 1.3 and rng.random() < 0.6 else 1
        for c in range(cols):
            if rng.random() < ctx.damage * 0.35:
                if rng.random() < 0.6:  # the cavity shows a stub of cabling
                    x = -cw / 2 + (c + 0.5) * cw / cols
                    z.cable((x - 0.2, -0.03, z1 - 0.1), (x + 0.22, -0.04, z0 + 0.25), 0.18, 0.014)
                continue
            w = cw / cols - 0.025
            plate(z, w, z1 - z0, (z0 + z1) / 2, -cw / 2 + (c + 0.5) * cw / cols, rng.choice((0.03, 0.045, 0.06)), "wall", rng)


def bay_pipes(z, cw, rng, ctx):
    plate(z, cw, 2.05, 1.4, 0, 0.02, "struct", bolted=False)
    x = -cw / 2 + 0.16
    for r in (0.06, 0.04, 0.075, 0.03, 0.05):
        if x + r > cw / 2 - 0.08:
            break
        y = -r - 0.035
        z.rod((x, y, 0.34), (x, y, 2.46), r, rng.choice(("steel", "equip", "machine")), segs=10)
        for zf in (0.8, 1.75):
            z.cyl(r + 0.022, 0.04, (x, y, zf + rng.uniform(-0.1, 0.1)), "steel", segs=10)
        for zc in (0.5, 1.3, 2.2):
            z.box((2 * r + 0.07, 0.03, 0.05), (x, -0.03, zc), "struct")
        x += 2 * r + rng.uniform(0.14, 0.24)
    vx = -cw / 2 + 0.16 + 0.26
    z.rod((vx, -0.11, 1.32), (vx, -0.26, 1.32), 0.015, "steel", segs=6)
    z.tor(0.11, 0.014, (vx, -0.26, 1.32), "paint_red", rot=(rad(90), 0, 0), major=14, minor=5)
    for k in range(3):
        a = rad(k * 120)
        z.rod((vx, -0.26, 1.32), (vx + 0.11 * math.cos(a), -0.26, 1.32 + 0.11 * math.sin(a)), 0.009, "paint_red", segs=5)
    gx = min(cw / 2 - 0.2, 0.42)
    z.cyl(0.07, 0.05, (gx, -0.05, 1.55), "equip", rot=(rad(90), 0, 0), segs=12)
    z.cyl(0.055, 0.006, (gx, -0.078, 1.55), "emit_cyan", rot=(rad(90), 0, 0), segs=12)


def bay_vent(z, cw, rng, ctx):
    w = min(cw - 0.1, 1.5)
    for sx in (-1, 1):
        z.box((0.07, 0.09, 0.84), (sx * (w / 2 - 0.035), -0.045, 0.82), "struct", bevel=0.01)
    for zz in (0.4 + 0.035, 1.24 - 0.035):
        z.box((w, 0.09, 0.07), (0, -0.045, zz), "struct", bevel=0.01)
    for k in range(9):
        z.box((w - 0.14, 0.1, 0.012), (0, -0.05, 0.5 + k * 0.08), "struct", rot=(rad(38), 0, 0))
    z.box((0.2, 0.012, 0.06), (w / 2 - 0.2, -0.094, 1.205), "hazard")
    for z0, z1 in ((1.29, 1.86), (1.89, 2.44)):
        plate(z, cw, z1 - z0, (z0 + z1) / 2, 0, rng.choice((0.03, 0.05)), "wall", rng)


def bay_locker(z, cw, rng, ctx):
    w = min(1.25, cw - 0.12)
    z.box((w, 0.25, 1.98), (0, -0.125, 1.36), "equip", bevel=0.015)
    z.box((0.012, 0.012, 1.86), (0, -0.252, 1.36), "cavity")
    for sx in (-1, 1):
        z.box((0.028, 0.03, 0.24), (sx * 0.07, -0.262, 1.3), "steel", bevel=0.006)
        for k in range(5):
            z.box((w / 2 - 0.16, 0.012, 0.018), (sx * w / 4, -0.253, 2.12 - k * 0.045), "cavity")
        z.box((w / 2 - 0.18, 0.008, 0.07), (sx * w / 4, -0.253, 1.8), "hazard" if sx < 0 else "paint_white")
    if rng.random() < ctx.damage:  # one door hangs open
        z.box((w / 2 - 0.02, 0.02, 1.5), (w / 2 + 0.1, -0.2, 1.2), "equip", rot=(0, 0, rad(-48)), bevel=0.006)
    plate(z, cw, 0.2, 2.56 - 0.22, 0, 0.03, "wall", bolted=False)


def bay_light(z, cw, rng, ctx):
    side = (cw - 0.4) / 2
    if side > 0.25:
        for sx in (-1, 1):
            for z0, z1 in ((0.37, 1.36), (1.39, 2.44)):
                plate(z, side - 0.02, z1 - z0, (z0 + z1) / 2, sx * (0.2 + side / 2), 0.04, "wall", rng)
    z.box((0.36, 0.11, 1.96), (0, -0.055, 1.38), "struct", bevel=0.02)
    z.panel(0.17, 1.64, at=(0, -0.112, 1.38), rot=(rad(90), 0, 0), mat="emit_strip", project=True)
    z.light(0.15, 1.5, at=(0, -0.17, 1.38), rot=(rad(-90), 0, 0), color=(1.0, 0.5, 0.17), watts=34.0, layer="P")
    for k in range(7):
        z.box((0.3, 0.035, 0.022), (0, -0.125, 0.62 + k * 0.255), "steel")
    for sx in (-1, 1):
        z.box((0.03, 0.045, 1.7), (sx * 0.135, -0.118, 1.38), "steel")


def bay_screen(z, cw, rng, ctx):
    for z0, z1 in ((0.37, 0.98), (1.98, 2.44)):
        plate(z, cw, z1 - z0, (z0 + z1) / 2, 0, 0.04, "wall", rng)
    w = min(1.0, cw - 0.2)
    z.box((w, 0.17, 0.74), (0, -0.085, 1.5), "equip", bevel=0.015)
    z.box((w - 0.1, 0.02, 0.5), (0, -0.172, 1.56), "cavity")
    screen = ctx.screen(rng)
    z.panel(w - 0.16, 0.44, at=(0, -0.184, 1.56), rot=(rad(90), 0, 0), mat=screen)
    z.light(w - 0.2, 0.4, at=(0, -0.2, 1.56), rot=(rad(-90), 0, 0), color=(0.2, 0.85, 0.4) if screen == "screen_crt" else (0.2, 0.75, 0.85), watts=2.2, layer="E")
    z.box((w - 0.1, 0.22, 0.04), (0, -0.17, 1.1), "struct", rot=(rad(18), 0, 0), bevel=0.008)
    for k in range(6):
        z.box((0.07, 0.05, 0.016), (-w / 2 + 0.16 + k * 0.11, -0.2, 1.13), "equip", rot=(rad(18), 0, 0))
    z.box((0.05, 0.03, 0.05), (w / 2 - 0.1, -0.175, 1.22), "emit_amber")
    z.cable((w / 2 - 0.08, -0.06, 1.14), (w / 2 + 0.04, -0.05, 0.36), 0.05, 0.016)
    z.cable((-w / 2 + 0.1, -0.06, 1.86), (-w / 2 - 0.02, -0.1, 2.46), -0.04, 0.016)


def bay_damaged(z, cw, rng, ctx):
    for sx in (-1, 1):
        plate(z, 0.3, 1.9, 1.4, sx * (cw / 2 - 0.15), 0.045, "wall", rng)
    plate(z, cw - 0.64, 0.5, 2.19, 0, 0.04, "wall", rng)
    z.box((0.34, 0.12, 0.3), (-0.1, -0.06, 1.6), "equip", bevel=0.01)  # junction box
    z.box((0.05, 0.02, 0.05), (-0.18, -0.125, 1.66), "emit_red")
    for k in range(6):
        x0 = rng.uniform(-cw / 2 + 0.35, cw / 2 - 0.35)
        z.cable((-0.1 + rng.uniform(-0.12, 0.12), -0.07, 1.5), (x0, -rng.uniform(0.04, 0.2), rng.uniform(0.2, 0.9)), rng.uniform(0.05, 0.3), rng.choice((0.012, 0.016, 0.02)), rng.choice(("rubber", "rubber", "hazard", "paint_red")))
    z.box((cw - 0.7, 0.03, 0.9), (0.12, -0.2, 0.62), "wall", rot=(rad(-16), rad(7), rad(-11)), bevel=0.006)  # fallen cover
    z.box((0.5, 0.02, 0.34), (-0.3, -0.24, 0.2), "struct", rot=(rad(62), 0, rad(24)))


BAYS = {"plates": bay_plates, "pipes": bay_pipes, "vent": bay_vent, "locker": bay_locker, "light": bay_light, "screen": bay_screen, "damaged": bay_damaged}


def wall(z, w, rect, ctx):
    L = w["a1"] - w["a0"]
    mid = (w["a0"] + w["a1"]) / 2
    s = SGN[w["side"]]
    z.push(wall_frame(w, ctx.t))
    z.quad(((-L / 2, 0, 0), (L / 2, 0, 0), (L / 2, 0, CEIL), (-L / 2, 0, CEIL)), "cavity", project=True)
    z.box((L, 0.07, 0.34), (0, -0.035, 0.17), "struct")
    z.box((L, 0.03, 0.05), (0, -0.085, 0.31), "steel")
    z.box((L, 0.17, 0.2), (0, -0.085, 2.56), "struct", bevel=0.015)
    z.box((L, 0.05, 0.035), (0, -0.19, 2.48), "steel")
    z.prism([(0, 2.84), (-0.56, CEIL), (0, CEIL)], -L / 2, L / 2, "struct", M=YZX)
    z.rod((-L / 2, -0.07, 2.72), (L / 2, -0.07, 2.72), 0.035, "steel", segs=8)
    z.rod((-L / 2, -0.15, 2.78), (L / 2, -0.15, 2.78), 0.05, "equip", segs=8)
    if rect["kind"] == "room":
        z.quad(((-L / 2, -0.44, 0.004), (L / 2, -0.44, 0.004), (L / 2, 0, 0.004), (-L / 2, 0, 0.004)), "grate", project=True)
        n = max(1, int(L / 1.1))
        for k in range(n):  # worn, broken edge line and low emergency markers
            u = -L / 2 + (k + 0.5) * L / n
            if (k + ctx.index[w["id"]]) % 4 != 3:
                z.quad(((u - 0.4, -0.475, 0.005), (u + 0.4, -0.475, 0.005), (u + 0.4, -0.445, 0.005), (u - 0.4, -0.445, 0.005)), "hazard", project=True)
            z.box((0.22, 0.014, 0.03), (u, -0.072, 0.2), "emit_red")
        z.light(L * 0.9, 0.05, at=(0, -0.12, 0.2), rot=(rad(-62), 0, 0), color=(1.0, 0.1, 0.04), watts=0.55 * L, layer="E")
    cuts = bay_cuts(w, rect)
    for i, (c0, c1) in enumerate(cuts):
        u0, u1 = sorted((s * (c0 - mid), s * (c1 - mid)))
        if i > 0:
            rib(z, s * (c0 - mid))
            for zz, y, r in ((2.72, -0.07, 0.035), (2.78, -0.15, 0.05)):
                z.box((0.06, 2 * r + 0.05, 2 * r + 0.04), (s * (c0 - mid) + 0.19, y, zz), "struct")
        cw = (u1 - u0) - 0.3
        if cw < 0.45:
            continue
        kind = ctx.pick(w, i, (c0 + c1) / 2, cw, rect)
        z.push(T(((u0 + u1) / 2, 0, 0)))
        (ctx.custom.get(kind) or BAYS[kind])(z, cw, ctx.rng(w["id"], i), ctx)
        z.pop()
    z.pop()


# ---------------------------------------------------------------- floors and ceilings


def floor(z, rect):
    W, D = rect["x1"] - rect["x0"], rect["z1"] - rect["z0"]
    z.push(T(P((rect["x0"] + rect["x1"]) / 2, (rect["z0"] + rect["z1"]) / 2)))
    z.quad(((-W / 2, -D / 2, 0), (W / 2, -D / 2, 0), (W / 2, D / 2, 0), (-W / 2, D / 2, 0)), "floor", project=True)
    if rect["kind"] == "connector":  # a grated walkway through every passage
        along_x = W < D
        gw, gl = (1.5, D) if along_x else (W, 1.5)
        z.quad(((-gw / 2, -gl / 2, 0.004), (gw / 2, -gl / 2, 0.004), (gw / 2, gl / 2, 0.004), (-gw / 2, gl / 2, 0.004)), "grate", project=True)
    z.pop()


def ceiling(z, rect, rng, damage):
    W, D = rect["x1"] - rect["x0"], rect["z1"] - rect["z0"]
    z.push(T(P((rect["x0"] + rect["x1"]) / 2, (rect["z0"] + rect["z1"]) / 2)))
    z.quad(((-W / 2, -D / 2, CEIL), (-W / 2, D / 2, CEIL), (W / 2, D / 2, CEIL), (W / 2, -D / 2, CEIL)), "cavity", project=True)
    if rect["kind"] != "room":
        z.box((W - 1.0 if W < D else W, D if W < D else D - 1.0, 0.04), (0, 0, CEIL - 0.03), "struct")
        if W < D:
            z.rod((0.3, -D / 2, CEIL - 0.12), (0.3, D / 2, CEIL - 0.12), 0.045, "equip", segs=8)
            z.rod((0.44, -D / 2, CEIL - 0.1), (0.44, D / 2, CEIL - 0.1), 0.025, "steel", segs=6)
        else:
            z.rod((-W / 2, 0.3, CEIL - 0.12), (W / 2, 0.3, CEIL - 0.12), 0.045, "equip", segs=8)
            z.rod((-W / 2, 0.44, CEIL - 0.1), (W / 2, 0.44, CEIL - 0.1), 0.025, "steel", segs=6)
        z.pop()
        return
    xs = [W / 2 - 2 * k for k in range(1, 50) if 2 * k < W - 0.5]
    ys = [D / 2 - 2 * k for k in range(1, 50) if 2 * k < D - 0.5]
    for x in xs:
        z.box((0.2, D - 1.0, 0.26), (x, 0, CEIL - 0.13), "struct", bevel=0.012)
    for y in ys:
        z.box((W - 1.0, 0.2, 0.26), (0, y, CEIL - 0.13), "struct", bevel=0.012)
    ex = [W / 2 - 0.5] + xs + [-W / 2 + 0.5]
    ey = [D / 2 - 0.5] + ys + [-D / 2 + 0.5]
    for i in range(len(ex) - 1):
        for j in range(len(ey) - 1):
            cx, cy = (ex[i] + ex[i + 1]) / 2, (ey[j] + ey[j + 1]) / 2
            w, d = abs(ex[i] - ex[i + 1]) - 0.24, abs(ey[j] - ey[j + 1]) - 0.24
            r = rng.random()
            if r < damage * 0.5:  # open coffer: cables and a hanging tile
                z.cable((cx - w / 2, cy - d / 3, CEIL - 0.06), (cx + w / 2, cy + d / 4, CEIL - 0.06), rng.uniform(0.25, 0.5), 0.018)
                z.cable((cx - w / 3, cy + d / 2, CEIL - 0.06), (cx + w / 4, cy - d / 2, CEIL - 0.06), rng.uniform(0.15, 0.4), 0.014, "hazard")
                if rng.random() < 0.6:
                    z.box((w * 0.8, d * 0.8, 0.03), (cx + 0.1, cy, CEIL - 0.34), "struct", rot=(rad(rng.uniform(14, 28)), rad(rng.uniform(-9, 9)), rad(rng.uniform(-20, 20))))
                    z.rod((cx - w * 0.3, cy + d * 0.3, CEIL - 0.02), (cx - w * 0.3, cy + d * 0.3, CEIL - 0.24), 0.008, "steel", segs=5)
            else:
                z.box((w, d, 0.035), (cx, cy, CEIL - 0.055 - (0.02 if r > 0.8 else 0)), "struct", bevel=0.005)
    # a duct and a pipe bundle run the long way, under the beams
    if W >= D:
        z.box((W - 1.2, 0.5, 0.26), (0, D / 2 - 1.05, CEIL - 0.42), "equip", bevel=0.015)
        for k in range(int((W - 1.2) / 1.2) + 1):
            z.box((0.05, 0.56, 0.32), (-(W - 1.2) / 2 + k * 1.2, D / 2 - 1.05, CEIL - 0.42), "struct")
        for r, off in ((0.05, 0.0), (0.03, 0.13), (0.04, 0.24)):
            z.rod((-W / 2 + 0.6, -D / 2 + 0.95 + off, CEIL - 0.33), (W / 2 - 0.6, -D / 2 + 0.95 + off, CEIL - 0.33), r, rng.choice(("steel", "machine", "equip")), segs=8)
    else:
        z.box((0.5, D - 1.2, 0.26), (W / 2 - 1.05, 0, CEIL - 0.42), "equip", bevel=0.015)
        for k in range(int((D - 1.2) / 1.2) + 1):
            z.box((0.56, 0.05, 0.32), (W / 2 - 1.05, -(D - 1.2) / 2 + k * 1.2, CEIL - 0.42), "struct")
        for r, off in ((0.05, 0.0), (0.03, 0.13), (0.04, 0.24)):
            z.rod((-W / 2 + 0.95 + off, -D / 2 + 0.6, CEIL - 0.33), (-W / 2 + 0.95 + off, D / 2 - 0.6, CEIL - 0.33), r, rng.choice(("steel", "machine", "equip")), segs=8)
    z.pop()


def corner_posts(z, rect):
    for x in (rect["x0"], rect["x1"]):
        for zz in (rect["z0"], rect["z1"]):
            ix = 0.11 if x == rect["x0"] else -0.11
            iz = 0.11 if zz == rect["z0"] else -0.11
            z.push(T(P(x + ix, zz + iz)))
            z.box((0.22, 0.22, CEIL), (0, 0, CEIL / 2), "struct", bevel=0.025)
            z.box((0.3, 0.3, 0.36), (0, 0, 0.18), "struct", bevel=0.02)
            z.pop()


# ---------------------------------------------------------------- portals


def portal(z, x, zz, yaw, label, sub, rng):
    """Bulkhead frame filling a 3 m connector, with a 2.0 x 2.5 m opening. Jambs match the colliders."""
    z.push(plan_frame(x, zz, yaw))
    for sx in (-1, 1):
        z.box((0.5, 0.56, CEIL), (sx * 1.25, 0, CEIL / 2), "struct", bevel=0.03)
        z.box((0.07, 0.62, 2.5), (sx * 1.035, 0, 1.25), "steel", bevel=0.008)
        for k in range(5):
            z.box((0.08, 0.64, 0.16), (sx * 1.035, 0, 0.22 + k * 0.5), "hazard")
        z.prism([(sx * 1.0, 2.5), (sx * 0.64, 2.5), (sx * 1.0, 2.14)], -0.3, 0.3, "struct", M=XZY)  # corner gusset
        for sy in (-1, 1):
            z.rod((sx * 1.3, sy * 0.33, 0.25), (sx * 1.3, sy * 0.33, 2.3), 0.035, "steel", segs=8)
            z.cyl(0.05, 0.5, (sx * 1.3, sy * 0.33, 0.55), "equip", segs=8)
            z.box((0.2, 0.05, 0.32), (sx * 1.25, sy * 0.3, 1.32), "equip", bevel=0.01)
            z.box((0.12, 0.012, 0.08), (sx * 1.25, sy * 0.328, 1.4), "emit_cyan")
            z.box((0.12, 0.012, 0.05), (sx * 1.25, sy * 0.328, 1.26), "cavity")
    z.box((2.0, 0.56, 0.9), (0, 0, 2.95), "struct", bevel=0.03)
    z.box((2.07, 0.62, 0.07), (0, 0, 2.535), "steel", bevel=0.008)
    z.box((2.0, 0.6, 0.02), (0, 0, 0.01), "steel")
    for sy in (-1, 1):
        z.box((1.7, 0.05, 0.4), (0, sy * 0.3, 3.0), "cavity", bevel=0.01)
        z.push(T((0, sy * 0.33, 3.0), (rad(90), 0, 0 if sy < 0 else rad(180))))
        z.text(label, 0.15, at=(0, 0.06, 0), mat="emit_amber")
        z.text(sub, 0.07, at=(0, -0.11, 0), mat="emit_amber")
        z.pop()
        z.cable((-1.0, sy * 0.32, 2.75), (1.0, sy * 0.32, 2.72), 0.1, 0.018)
    z.pop()


def exterior_lock(z, x, zz, yaw):
    """Sealed exterior hatch (decor). Fits the 3.0 x 0.5 m collider on the airlock's south wall."""
    z.push(plan_frame(x, zz, yaw))
    for sx in (-1, 1):
        z.box((0.45, 0.5, CEIL), (sx * 1.275, 0, CEIL / 2), "struct", bevel=0.03)
        for k in range(6):
            z.box((0.46, 0.012, 0.14), (sx * 1.275, -0.252, 0.25 + k * 0.44), "hazard" if k % 2 == 0 else "cavity")
        z.cyl(0.075, 0.13, (sx * 1.28, -0.3, 2.46), "emit_red", segs=12)
        z.cyl(0.095, 0.03, (sx * 1.28, -0.3, 2.54), "struct", segs=12)
        z.cyl(0.095, 0.03, (sx * 1.28, -0.3, 2.38), "struct", segs=12)
        z.box((0.18, 0.1, 0.24), (sx * 1.28, -0.2, 2.46), "struct")
    z.box((2.1, 0.5, 0.76), (0, 0, 3.02), "struct", bevel=0.03)
    z.box((2.1, 0.5, 0.26), (0, 0, 0.13), "struct", bevel=0.02)
    z.box((2.1, 0.3, 2.4), (0, 0.1, 1.46), "wall")
    z.tor(1.02, 0.09, (0, -0.17, 1.46), "steel", rot=(rad(90), 0, 0), major=32, minor=8)
    z.cyl(0.97, 0.16, (0, -0.12, 1.46), "equip", rot=(rad(90), 0, 0), segs=32)
    z.cyl(0.62, 0.2, (0, -0.14, 1.46), "machine", rot=(rad(90), 0, 0), segs=28)
    z.tor(0.3, 0.024, (0, -0.33, 1.46), "paint_red", rot=(rad(90), 0, 0), major=20, minor=6)
    z.cyl(0.06, 0.12, (0, -0.28, 1.46), "steel", rot=(rad(90), 0, 0), segs=10)
    for k in range(4):
        a = rad(k * 90 + 45)
        z.rod((0, -0.33, 1.46), (0.3 * math.cos(a), -0.33, 1.46 + 0.3 * math.sin(a)), 0.014, "paint_red", segs=6)
    for k in range(10):
        a = rad(k * 36)
        z.box((0.12, 0.08, 0.16), (0.82 * math.cos(a), -0.22, 1.46 + 0.82 * math.sin(a)), "steel", rot=(0, -a, 0), bevel=0.01)
    z.cyl(0.13, 0.03, (0, -0.245, 1.9), "cavity", rot=(rad(90), 0, 0), segs=14)
    z.tor(0.14, 0.02, (0, -0.25, 1.9), "steel", rot=(rad(90), 0, 0), major=14, minor=5)
    z.box((1.5, 0.05, 0.36), (0, -0.25, 3.0), "cavity", bevel=0.01)
    z.push(T((0, -0.28, 3.0), (rad(90), 0, 0)))
    z.text("EXTERIOR LOCK", 0.13, at=(0, 0.06, 0), mat="emit_red")
    z.text("SEALED - NO PRESSURE BEYOND", 0.055, at=(0, -0.1, 0), mat="emit_red")
    z.pop()
    z.pop()


def sign(z, s):
    """Lit wall sign at a position from layout.json; replaces the provisional text plane."""
    color = {"#71D4D6": "emit_cyan", "#C9D6DE": "emit_cyan"}.get(s["color"].upper(), "emit_amber")
    clean = lambda t: t.replace("◂", "<").replace("▸", ">").replace("▴", "^").replace("▾", "v").replace("·", "-").replace("—", "-").strip()
    z.push(plan_frame(s["x"], s["z"], s["yaw"], s["y"]))
    z.box((s["w"] + 0.12, 0.05, s["h"] + 0.1), (0, -0.025, 0), "cavity", bevel=0.01)
    z.box((s["w"] + 0.16, 0.03, 0.03), (0, -0.03, s["h"] / 2 + 0.06), "steel")
    z.box((s["w"] + 0.16, 0.03, 0.03), (0, -0.03, -s["h"] / 2 - 0.06), "steel")
    z.push(T((0, -0.055, 0), (rad(90), 0, 0)))
    main = clean(s["text"])
    size = min(s["h"] * 0.42, (s["w"] - 0.1) / max(4, len(main)) * 1.55)
    z.text(main, size, at=(0, s["h"] * 0.16, 0), mat=color)
    if s.get("sub"):
        sub = clean(s["sub"])
        z.text(sub, min(s["h"] * 0.19, (s["w"] - 0.1) / max(4, len(sub)) * 1.5), at=(0, -s["h"] * 0.27, 0), mat=color)
    z.pop()
    z.pop()
