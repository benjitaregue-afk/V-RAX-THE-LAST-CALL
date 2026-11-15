"""Props and set dressing for the VØRAX station.

Each function draws into the current local frame of a `Mesh`: origin at the floor centre
(or the ceiling mount), front facing local -Y. Footprints match the colliders in layout.json.
The two mission displays are illustrative models and are labelled as such in the game.
"""

import math
import random

from mathutils import Euler, Matrix, Vector, noise
from station_arch import CEIL, bolts, plate
from vorax_lib import T, rad


def rack(z, rng, ctx, comms=False):
    z.box((0.82, 0.5, 0.09), (0, 0, 0.045), "struct")
    z.box((0.82, 0.5, 0.06), (0, 0, 2.15), "struct")
    for sx in (-1, 1):
        z.box((0.05, 0.5, 2.05), (sx * 0.385, 0, 1.12), "equip", bevel=0.008)
    z.box((0.72, 0.03, 2.05), (0, 0.235, 1.12), "cavity")
    for s in range(6):
        zz = 0.19 + s * 0.33
        z.box((0.72, 0.46, 0.025), (0, 0, zz), "struct")
        x = -0.35
        while x < 0.27:
            w = rng.choice((0.07, 0.09, 0.12, 0.17))
            h, d = rng.uniform(0.2, 0.28), rng.uniform(0.3, 0.4)
            if rng.random() < (0.95 if comms else 0.8):
                z.box((w - 0.012, d, h), (x + w / 2, -0.215 + d / 2, zz + 0.013 + h / 2), rng.choice(("equip", "machine", "struct", "equip")), bevel=0.004 if w > 0.1 else 0)
                if rng.random() < (0.7 if comms else 0.3):
                    z.box((0.016, 0.006, 0.016), (x + w / 2, -0.219, zz + 0.07), rng.choice(("emit_cyan", "emit_amber", "emit_green", "emit_red")))
            x += w
    z.rod((0.22, 0.12, 2.18), (0.22, 0.12, CEIL - 0.28), 0.03, "steel", segs=8)
    z.cable((-0.2, 0.1, 2.18), (-0.32, 0.2, CEIL - 0.3), -0.05, 0.018)
    if comms:
        z.box((0.6, 0.02, 0.16), (0, -0.252, 2.05), "cavity")
        z.push(T((0, -0.264, 2.05), (rad(90), 0, 0)))
        z.text("COMMS 01", 0.07, mat="emit_green")
        z.pop()


def crate(z, rng, ctx):
    z.box((0.72, 0.52, 0.04), (0, 0, 0.02), "struct")
    z.box((0.7, 0.5, 0.39), (0, 0, 0.225), "crate", bevel=0.012)
    z.box((0.72, 0.52, 0.055), (0, 0, 0.445), "struct", bevel=0.008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            z.box((0.06, 0.06, 0.42), (sx * 0.33, sy * 0.23, 0.23), "rubber")
        z.box((0.07, 0.022, 0.1), (sx * 0.17, -0.262, 0.41), "steel", bevel=0.006)
    z.box((0.4, 0.012, 0.07), (0, -0.253, 0.2), "hazard")
    if rng.random() < 0.55:
        z.push(T((rng.uniform(-0.08, 0.08), rng.uniform(-0.04, 0.04), 0.475), (0, 0, rad(rng.uniform(-28, 28)))))
        z.box((0.46, 0.36, 0.28), (0, 0, 0.14), rng.choice(("equip", "machine")), bevel=0.012)
        z.box((0.48, 0.38, 0.04), (0, 0, 0.3), "struct", bevel=0.006)
        z.box((0.14, 0.02, 0.04), (0, -0.185, 0.2), "steel")
        z.pop()


def supply_stack(z, rng, ctx):
    """Airlock corner: stacked cases and a medical kit."""
    crate(z, random.Random(1), ctx)
    z.push(T((0.06, 0.02, 0.475), (0, 0, rad(14))))
    z.box((0.5, 0.36, 0.3), (0, 0, 0.15), "paint_white", bevel=0.015)
    z.box((0.52, 0.38, 0.03), (0, 0, 0.3), "steel")
    z.box((0.16, 0.012, 0.05), (0, -0.185, 0.17), "machine")
    z.box((0.05, 0.012, 0.16), (0, -0.185, 0.17), "machine")
    z.pop()
    z.cyl(0.07, 0.34, (-0.22, -0.34, 0.17), "paint_red", segs=12)
    z.cyl(0.03, 0.06, (-0.22, -0.34, 0.37), "steel", segs=8)


def chair(z, rng, ctx):
    """Operator's chair, toppled on its side in front of the console bank."""
    z.push(T((0, 0, 0.27), (0, rad(88), rad(20))))
    z.box((0.46, 0.46, 0.08), (0, 0, 0.45), "rubber", bevel=0.02)
    z.box((0.44, 0.07, 0.55), (0, 0.2, 0.76), "rubber", bevel=0.02)
    z.box((0.3, 0.05, 0.2), (0, 0.22, 1.1), "rubber", bevel=0.02)
    z.cyl(0.03, 0.4, (0, 0, 0.22), "steel", segs=8)
    for k in range(5):
        a = rad(k * 72)
        z.beam((0, 0, 0.05), (0.3 * math.cos(a), 0.3 * math.sin(a), 0.03), 0.04, 0.03, "steel")
        z.sph(0.03, (0.3 * math.cos(a), 0.3 * math.sin(a), 0.02), "rubber", segs=6, rings=4)
    for sx in (-1, 1):
        z.box((0.05, 0.3, 0.03), (sx * 0.26, 0.02, 0.62), "struct", bevel=0.008)
        z.box((0.03, 0.03, 0.16), (sx * 0.26, 0.1, 0.54), "steel")
    z.pop()


def switch(z, rng, ctx):
    """Backup power cabinet (PZ-00). Fictional ship hardware."""
    z.box((0.66, 0.42, 0.08), (0, 0, 0.04), "struct")
    z.box((0.58, 0.34, 1.3), (0, 0, 0.73), "machine", bevel=0.02)
    z.box((0.62, 0.38, 0.06), (0, 0, 1.41), "struct")
    z.box((0.46, 0.03, 0.66), (0, -0.172, 0.98), "equip", bevel=0.01)
    for i in range(6):
        z.box((0.085, 0.014, 0.12), (-0.2125 + i * 0.085, -0.173, 0.5), "hazard" if i % 2 == 0 else "cavity")
    for k in range(4):
        for sx in (-1, 1):
            z.box((0.012, 0.2, 0.03), (sx * 0.293, 0, 0.3 + k * 0.07), "cavity")
    z.rod((0.19, 0.08, 1.42), (0.19, 0.08, CEIL - 0.3), 0.04, "steel", segs=10)
    z.rod((0.07, 0.1, 1.42), (0.07, 0.1, CEIL - 0.3), 0.022, "rubber", segs=6)
    z.box((0.16, 0.04, 0.12), (0, -0.19, 0.92), "struct", bevel=0.01)
    z.cyl(0.05, 0.11, (0, -0.22, 0.92), "steel", rot=(0, rad(90), 0), segs=12)
    z.push(T((0, -0.22, 0.92), (rad(118), 0, 0)))  # lever resting in the OFF position
    z.box((0.045, 0.045, 0.3), (0, -0.02, 0.15), "equip", bevel=0.01)
    z.cyl(0.032, 0.22, (0, -0.02, 0.3), "hazard", rot=(0, rad(90), 0), segs=10)
    z.pop()
    z.cyl(0.035, 0.03, (0.17, -0.2, 1.22), "emit_amber", rot=(rad(90), 0, 0), segs=12)
    z.light(0.07, 0.07, at=(0.17, -0.24, 1.22), rot=(rad(-90), 0, 0), color=(1.0, 0.58, 0.16), watts=1.6, layer="E")
    z.box((0.34, 0.012, 0.1), (-0.05, -0.189, 1.22), "cavity")
    z.push(T((-0.05, -0.197, 1.22), (rad(90), 0, 0)))
    z.text("BACKUP POWER", 0.036, at=(0, 0.012, 0), mat="emit_amber")
    z.text("EMERGENCY BUS", 0.02, at=(0, -0.03, 0), mat="emit_amber")
    z.pop()
    z.cable((-0.25, 0.1, 0.1), (-0.9, 0.25, 0.02), 0.0, 0.025)


def terminal(z, rng, ctx):
    """Evidence terminal. The screen is redrawn by the game; its frame stays readable in the dark."""
    z.box((0.8, 0.52, 0.08), (0, 0, 0.04), "struct")
    z.box((0.46, 0.3, 0.82), (0, 0.05, 0.49), "machine", bevel=0.02)
    z.box((0.38, 0.02, 0.5), (0, -0.105, 0.47), "struct", bevel=0.006)
    z.box((0.3, 0.012, 0.025), (0, -0.118, 0.66), "emit_cyan")
    for k in range(4):
        z.box((0.3, 0.012, 0.018), (0, -0.118, 0.3 + k * 0.05), "cavity")
    tilt = rad(58)
    z.box((0.9, 0.58, 0.09), (0, -0.02, 1.17), "struct", rot=(tilt, 0, 0), bevel=0.018)
    z.box((0.94, 0.05, 0.12), (0, 0.16, 1.44), "equip", rot=(tilt, 0, 0), bevel=0.01)
    for sx in (-1, 1):
        z.box((0.03, 0.6, 0.11), (sx * 0.465, -0.02, 1.17), "equip", rot=(tilt, 0, 0), bevel=0.008)
    n = Vector((0, -math.sin(tilt), math.cos(tilt)))
    z.panel(0.8, 0.48, at=Vector((0, -0.02, 1.17)) + n * 0.048, rot=(tilt, 0, 0), mat="screen_term")
    z.light(0.7, 0.4, at=Vector((0, -0.02, 1.17)) + n * 0.09, rot=(tilt - rad(180), 0, 0), color=(0.3, 0.85, 0.9), watts=5.0, layer="E")
    z.box((0.72, 0.24, 0.045), (0, -0.25, 0.9), "struct", rot=(rad(14), 0, 0), bevel=0.012)
    K = T((0, -0.25, 0.9), (rad(14), 0, 0))
    for row in range(3):
        for col in range(8):
            z.box((0.062, 0.05, 0.018), mat="equip", M=K @ T((-0.28 + col * 0.08, -0.07 + row * 0.068, 0.03)))
    z.box((0.05, 0.05, 0.03), (0.39, 0.12, 1.47), "emit_amber")
    z.rod((0.12, 0.2, 0.2), (0.12, 0.22, 1.2), 0.022, "rubber", segs=6)
    z.cable((-0.2, 0.22, 0.1), (-0.75, 0.3, 0.02), 0.0, 0.022)


def lamp(z, rng, ctx):
    """Ceiling fixture. Origin at the ceiling, long axis on local X. Louvres throw striped light."""
    z.box((1.36, 0.46, 0.1), (0, 0, -0.05), "struct", bevel=0.012)
    z.panel(1.2, 0.32, at=(0, 0, -0.102), rot=(rad(180), 0, 0), mat="emit_main", project=True)
    z.light(1.1, 0.28, at=(0, 0, -0.17), color=(1.0, 0.72, 0.44), watts=210.0, layer="P")
    for k in range(7):
        z.box((0.018, 0.44, 0.05), (-0.54 + k * 0.18, 0, -0.128), "steel")
    for sy in (-1, 1):
        z.box((1.4, 0.03, 0.08), (0, sy * 0.235, -0.112), "struct")
    z.rod((0.5, 0.1, 0), (0.5, 0.1, 0.02), 0.02, "rubber", segs=6)


def tray(z, rng, ctx):
    z.box((2.0, 0.36, 0.025), (0, 0, -0.33), "struct")
    for sy in (-1, 1):
        z.box((2.0, 0.02, 0.07), (0, sy * 0.18, -0.305), "struct")
        for sx in (-1, 1):
            z.box((0.03, 0.03, 0.34), (sx * 0.8, sy * 0.18, -0.17), "steel")
    z.cyl(0.045, 2.0, (0, -0.09, -0.27), "steel", rot=(0, rad(90), 0), segs=10)
    z.cyl(0.03, 2.0, (0, 0.03, -0.285), "rubber", rot=(0, rad(90), 0), segs=8)
    z.cyl(0.022, 2.0, (0, 0.11, -0.293), "hazard", rot=(0, rad(90), 0), segs=6)
    if rng.random() < 0.5:
        z.cable((-0.4, 0.14, -0.32), (0.5, 0.2, -0.32), rng.uniform(0.2, 0.45), 0.014)


def pedestal(z, rng, ctx):
    z.cyl(1.3, 0.12, (0, 0, 0.06), "struct", segs=36)
    z.cyl(1.16, 0.22, (0, 0, 0.23), "machine", segs=36)
    z.cyl(1.06, 0.012, (0, 0, 0.346), "floor", segs=36)
    z.cyl(1.172, 0.03, (0, 0, 0.2), "emit_strip", segs=36)
    for a in (45, 135, 225, 315):
        x, y = 1.22 * math.cos(rad(a)), 1.22 * math.sin(rad(a))
        z.cyl(0.022, 0.78, (x, y, 0.51), "steel", segs=8)
        z.sph(0.036, (x, y, 0.91), "steel", segs=8, rings=5)
    tilt = rad(55)
    z.box((0.05, 0.05, 0.74), (0, -1.21, 0.49), "struct")
    z.box((0.7, 0.26, 0.024), (0, -1.23, 0.88), "cavity", rot=(tilt, 0, 0), bevel=0.008)
    n = Vector((0, -math.sin(tilt), math.cos(tilt)))
    z.push(T(Vector((0, -1.23, 0.88)) + n * 0.014, (tilt, 0, 0)))
    z.text("ILLUSTRATIVE DISPLAY", 0.042, at=(0, 0.045, 0), mat="emit_amber")
    z.text("NOT RECOVERED HARDWARE", 0.03, at=(0, -0.03, 0), mat="emit_amber")
    z.pop()


def insight(z, rng, ctx):
    """Illustrative InSight display: stylized dome-covered seismometer, tether, deck and panel fragment."""
    dx, dy = -0.45, -0.35
    z.cyl(0.42, 0.13, (dx, dy, 0.065), "steel", segs=28, r2=0.34)
    z.cyl(0.345, 0.03, (dx, dy, 0.145), "equip", segs=28)
    z.sph(0.335, (dx, dy, 0.16), "equip", segs=28, rings=14, scale=(1, 1, 0.62), cut=0)
    z.cyl(0.018, 0.05, (dx, dy, 0.39), "steel", segs=8)
    z.sph(0.028, (dx, dy, 0.425), "steel", segs=8, rings=5)
    for a in (30, 150, 270):
        z.box((0.09, 0.06, 0.03), (dx + 0.43 * math.cos(rad(a)), dy + 0.43 * math.sin(rad(a)), 0.015), "equip", rot=(0, 0, rad(a)))
    path = [(dx + 0.36, dy + 0.14), (-0.02, -0.02), (0.12, 0.16), (0.3, 0.26)]
    for p0, p1 in zip(path, path[1:]):
        z.beam((p0[0], p0[1], 0.012), (p1[0], p1[1], 0.012), 0.075, 0.012, "paint_white")
    z.box((0.12, 0.09, 0.035), (-0.02, -0.02, 0.02), "equip", rot=(0, 0, rad(40)))
    cx, cy, cz = 0.35, 0.38, 0.66
    z.cyl(0.46, 0.07, (cx, cy, cz), "equip", segs=6)
    z.cyl(0.4, 0.03, (cx, cy, cz - 0.05), "gold", segs=6)
    z.rod((cx - 0.2, cy - 0.15, 0.0), (cx - 0.1, cy - 0.08, cz - 0.06), 0.03, "steel")
    z.rod((cx + 0.2, cy + 0.2, 0.0), (cx + 0.1, cy + 0.1, cz - 0.06), 0.03, "steel")
    z.box((0.2, 0.16, 0.1), (cx - 0.12, cy + 0.05, cz + 0.085), "gold", bevel=0.01)
    z.cyl(0.06, 0.14, (cx + 0.14, cy - 0.12, cz + 0.105), "equip", segs=12)
    z.rod((cx + 0.1, cy + 0.18, cz + 0.03), (cx + 0.1, cy + 0.18, cz + 0.5), 0.012, "steel", segs=6)
    z.box((0.07, 0.05, 0.05), (cx + 0.1, cy + 0.18, cz + 0.52), "equip")
    A = Matrix.Translation(Vector((cx + 0.3, cy + 0.2, cz + 0.02))) @ Euler((rad(-8), rad(-6), rad(-18)), "XYZ").to_matrix().to_4x4()
    R = 0.74
    for k in range(4):
        a0, a1 = rad(k * 36 + 1.5), rad((k + 1) * 36 - 1.5)
        mid = (a0 + a1) / 2
        z.prism([(0.05 * math.cos(mid), 0.05 * math.sin(mid)), (R * math.cos(a0), R * math.sin(a0)), (R * math.cos(a1), R * math.sin(a1))], 0.0, 0.018, "solar", M=A)
    z.push(A)
    for k in range(5):
        a = rad(k * 36)
        z.beam((0, 0, -0.006), (R * math.cos(a), R * math.sin(a), -0.006), 0.03, 0.02, "gold")
    for k in range(4):
        a0, a1 = rad(k * 36), rad((k + 1) * 36)
        z.beam((R * math.cos(a0), R * math.sin(a0), 0.004), (R * math.cos(a1), R * math.sin(a1), 0.004), 0.03, 0.03, "gold")
    z.pop()


def _relief(z, size, loc, height, seed):
    """Low layered outcrop split by dark cracks. Returns its height function."""
    import bmesh

    sx, sy = size

    def h(x, y):
        edge = min(1.0, (1 - abs(2 * x / sx)) * 5) * min(1.0, (1 - abs(2 * y / sy)) * 5)
        if edge <= 0:
            return 0.0
        d = noise.voronoi(Vector((x * 2.6 + seed, y * 2.6, 0.0)))[0]
        crack = min(1.0, max(0.0, (d[1] - d[0]) / 0.16))
        layers = math.floor((0.55 + 0.45 * noise.noise(Vector((x * 2.2 + seed, y * 2.2, 0.0)))) * height / 0.022) * 0.022
        return max(0.012, (0.02 + layers) * crack) * edge

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=28, y_segments=20, size=1.0)
    xs = [v.co.x for v in bm.verts]
    ys = [v.co.y for v in bm.verts]
    for v in bm.verts:
        v.co.x = (v.co.x - min(xs)) / (max(xs) - min(xs)) * sx - sx / 2
        v.co.y = (v.co.y - min(ys)) / (max(ys) - min(ys)) * sy - sy / 2
        v.co.z = h(v.co.x, v.co.y)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if sum(f.normal.z for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    nf = len(z.bm.faces)
    z._add(bm, T(loc), "rock")
    from vorax_lib import PALETTE

    dark = PALETTE["rock_dark"][1]  # steep faces and cracks take the darker swatch of the same material
    for f in z.bm.faces[nf:]:
        if f.normal.z < 0.8 or min(v.co.z for v in f.verts) - z.M.translation.z < 0.03:
            for loop in f.loops:
                loop[z.uv].uv = dark
    return lambda x, y: h(x - loc[0], y - loc[1]) + loc[2]


def opportunity(z, rng, ctx):
    """Illustrative Opportunity display: wheel, panel fragment and a rock relief with spherules."""
    slab = (-0.28, -0.3, 0.0)
    height_at = _relief(z, (1.25, 0.95), slab, 0.16, 5)
    r2 = random.Random(11)
    placed = 0
    while placed < 46:
        x, y = slab[0] + r2.uniform(-0.56, 0.56), slab[1] + r2.uniform(-0.42, 0.42)
        hz = height_at(x, y)
        if hz < 0.011 or (hz > 0.05 and r2.random() < 0.55):
            continue
        r = r2.uniform(0.013, 0.02)
        z.sph(r, (x, y, hz + r * 0.55), "spherule", segs=6, rings=4)
        placed += 1
    wx, wy = 0.62, -0.42
    W = T((wx, wy, 0.265), (0, 0, rad(28)))
    z.box((0.34, 0.2, 0.05), (wx, wy, 0.025), "struct", rot=(0, 0, rad(28)))
    z.cyl(0.205, 0.25, mat="equip", segs=32, M=W @ T(rot=(0, rad(90), 0)))
    z.push(W)
    for sx in (-1, 1):
        z.cyl(0.165, 0.012, (sx * 0.123, 0, 0), "cavity", rot=(0, rad(90), 0), segs=24)
        z.cyl(0.06, 0.03, (sx * 0.135, 0, 0), "steel", rot=(0, rad(90), 0), segs=10)
        for k in range(5):
            a = rad(k * 72)
            z.beam((sx * 0.133, 0.055 * math.cos(a), 0.055 * math.sin(a)), (sx * 0.133, 0.155 * math.cos(a + 0.7), 0.155 * math.sin(a + 0.7)), 0.02, 0.012, "steel")
    for k in range(24):
        z.box((0.25, 0.016, 0.028), mat="struct", M=Matrix.Rotation(rad(k * 15), 4, "X") @ T((0, 0, 0.208)))
    z.pop()
    Pm = T((0.3, 0.52, 0.62), (rad(18), rad(-6), rad(-14)))
    outline = [(-0.52, -0.26), (0.5, -0.3), (0.56, 0.12), (-0.3, 0.3)]
    z.prism(outline, -0.022, 0.0, "gold", M=Pm)
    z.prism([(x * 0.94, y * 0.92) for x, y in outline], 0.0, 0.012, "solar", M=Pm)
    for k in range(5):
        z.box((0.012, 0.52, 0.006), mat="equip", M=Pm @ T((-0.36 + k * 0.19, -0.02, 0.014)))
    z.rod((0.1, 0.4, 0.0), (0.12, 0.46, 0.58), 0.022, "steel")
    z.rod((0.56, 0.62, 0.0), (0.52, 0.58, 0.6), 0.022, "steel")


def relay(z, rng, ctx):
    """Static base of the fictional relay. Rings and core are separate animated objects."""
    z.cyl(0.95, 0.22, (0, 0, 0.11), "struct", segs=32)
    z.cyl(0.72, 0.14, (0, 0, 0.29), "machine", segs=32)
    for k in range(8):
        z.box((0.44, 0.07, 0.2), mat="equip", bevel=0.01, M=Matrix.Rotation(rad(k * 45 + 22.5), 4, "Z") @ T((0.6, 0, 0.32)))
    z.cyl(0.2, 0.8, (0, 0, 0.76), "equip", segs=18)
    z.cyl(0.26, 0.06, (0, 0, 1.14), "struct", segs=18)
    z.cyl(0.26, 0.06, (0, 0, 1.76), "struct", segs=18)
    z.cyl(0.17, 0.36, (0, 0, 1.96), "equip", segs=18)
    for zz in (0.55, 0.95):
        z.tor(0.225, 0.028, (0, 0, zz), "steel", major=20, minor=6)
    for a in (45, 135, 225, 315):
        z.box((0.035, 0.035, 0.62), (0.31 * math.cos(rad(a)), 0.31 * math.sin(rad(a)), 1.45), "steel")
    z.tor(0.34, 0.022, (0, 0, 1.16), "steel", major=20, minor=6)
    z.tor(0.34, 0.022, (0, 0, 1.74), "steel", major=20, minor=6)
    z.cyl(0.1, 0.24, (0, 0, 2.26), "equip", segs=24, r2=0.44)
    z.cyl(0.44, 0.02, (0, 0, 2.385), "struct", segs=24)
    z.rod((0, 0, 2.3), (0, 0, 2.82), 0.014, "steel", segs=6)
    z.sph(0.045, (0, 0, 2.85), "emit_amber", segs=8, rings=5)
    for a in (205, 250, 290, 335):
        z.rod((0.5 * math.cos(rad(a)), 0.5 * math.sin(rad(a)), 0.25), (0.98 * math.cos(rad(a)), 0.98 * math.sin(rad(a)), 0.03), 0.03, "rubber", segs=6)
    z.box((0.7, 0.04, 0.12), (0, -0.705, 0.3), "struct", bevel=0.01)
    for x in (-0.2, 0.0, 0.2):
        z.cyl(0.05, 0.03, (x, -0.735, 0.3), "emit_amber", rot=(rad(90), 0, 0), segs=12)


def fan(z, rng, ctx):
    """Wall ventilation housing. Origin at the wall surface, centred on the opening. Blades are separate."""
    y = -0.07
    z.box((1.8, 0.14, 0.3), (0, y, 0.75), "struct", bevel=0.015)
    z.box((1.8, 0.14, 0.3), (0, y, -0.75), "struct", bevel=0.015)
    z.box((0.3, 0.14, 1.2), (-0.75, y, 0), "struct", bevel=0.015)
    z.box((0.3, 0.14, 1.2), (0.75, y, 0), "struct", bevel=0.015)
    for sx in (-1, 1):
        for sz in (-1, 1):
            z.box((0.46, 0.13, 0.2), (sx * 0.5, y, sz * 0.5), "machine", rot=(0, rad(45) * sx * sz, 0))
            z.cyl(0.03, 0.02, (sx * 0.8, -0.145, sz * 0.8), "steel", rot=(rad(90), 0, 0), segs=6)
    z.tor(0.585, 0.045, (0, -0.14, 0), "steel", rot=(rad(90), 0, 0), major=28, minor=6)
    z.rod((-0.58, -0.175, 0), (0.58, -0.175, 0), 0.012, "steel", segs=5)
    z.rod((0, -0.175, -0.58), (0, -0.175, 0.58), 0.012, "steel", segs=5)
    z.box((0.5, 0.012, 0.07), (0, -0.142, -0.76), "hazard")


def arm_mount(z, rng, ctx):
    z.box((1.5, 0.14, 0.06), (0, 0, -0.03), "machine", bevel=0.01)
    z.box((0.46, 0.46, 0.08), (0, 0, -0.07), "struct", bevel=0.015)
    z.cyl(0.13, 0.2, (0, 0, -0.2), "equip", segs=14)


# ---------------------------------------------------------------- hero wall bays (airlock)


def bay_console(z, cw, rng, ctx):
    """Wall-mounted mission-control bank: three monitors, shelf, lower cabinets. At most 0.27 m deep."""
    z.box((cw, 0.2, 0.52), (0, -0.1, 0.62), "equip", bevel=0.012)
    for k in range(3):
        x = -cw / 2 + (k + 0.5) * cw / 3
        z.box((cw / 3 - 0.06, 0.012, 0.4), (x, -0.203, 0.62), "struct")
        z.box((0.1, 0.02, 0.025), (x, -0.213, 0.76), "steel")
        for j in range(3):
            z.box((cw / 3 - 0.16, 0.014, 0.014), (x, -0.21, 0.48 + j * 0.04), "cavity")
    z.box((cw + 0.04, 0.27, 0.05), (0, -0.135, 0.92), "struct", bevel=0.01)
    plate(z, cw, 0.5, 2.19, 0, 0.04, "wall", rng)
    xs = (-cw / 2 + 0.34, 0.0, cw / 2 - 0.34)
    for i, x in enumerate(xs):
        dead = i == 2
        z.push(T((x, -0.12, 1.27), (rad(-6 if dead else 0), 0, rad(4 if dead else 0))))
        z.box((0.56, 0.22, 0.46), (0, 0, 0), "equip", bevel=0.025)
        z.box((0.46, 0.012, 0.36), (0, -0.112, 0.01), "cavity")
        z.panel(0.42, 0.32, at=(0, -0.12, 0.01), rot=(rad(90), 0, 0), mat="cavity" if dead else ("screen_crt" if i == 0 else "screen_wave"))
        z.box((0.04, 0.012, 0.02), (0.2, -0.114, -0.2), "emit_red" if dead else "emit_green")
        if not dead:
            z.light(0.4, 0.3, at=(0, -0.15, 0.01), rot=(rad(-90), 0, 0), color=(0.2, 0.9, 0.4) if i == 0 else (0.2, 0.75, 0.85), watts=2.4, layer="E")
        z.pop()
        z.box((0.3, 0.2, 0.04), (x, -0.12, 0.965), "struct")
    for i, x in enumerate((-cw / 2 + 0.42, cw / 2 - 0.5)):
        K = T((x, -0.16, 0.955), (rad(10), 0, rad(-3 + 6 * i)))
        z.box((0.44, 0.16, 0.022), mat="rubber", M=K)
        for row in range(3):
            for col in range(9):
                z.box((0.036, 0.034, 0.012), mat="equip", M=K @ T((-0.18 + col * 0.045, -0.045 + row * 0.045, 0.016)))
    z.box((cw - 0.1, 0.16, 0.14), (0, -0.08, 1.66), "struct", bevel=0.01)
    for k in range(9):
        z.box((0.03, 0.012, 0.03), (-cw / 2 + 0.2 + k * (cw - 0.4) / 8, -0.164, 1.66), ("emit_amber", "emit_green", "cavity", "emit_red")[k % 4])
    z.push(T((0, -0.165, 1.9), (rad(90), 0, 0)))
    z.text("MISSION CONTROL - LOCAL", 0.06, mat="emit_green")
    z.pop()
    for k in range(5):
        x = -cw / 2 + 0.2 + k * (cw - 0.4) / 4
        z.cable((x, -0.05, 1.73), (x + rng.uniform(-0.2, 0.2), -0.06, 2.46), -0.03, 0.014, rng.choice(("rubber", "rubber", "hazard")))
    z.cable((-cw / 2 + 0.3, -0.24, 0.9), (-cw / 2 + 0.1, -0.2, 0.05), 0.1, 0.014)
    z.cable((cw / 2 - 0.2, -0.24, 0.9), (cw / 2 + 0.05, -0.25, 0.03), 0.16, 0.012, "hazard")
    z.box((0.24, 0.16, 0.02), (0.2, -0.3, 0.012), "paint_white", rot=(0, 0, rad(25)))  # dropped sheets
    z.box((0.21, 0.3, 0.004), (-0.3, -0.34, 0.008), "paint_white", rot=(0, 0, rad(-40)))


def bay_board(z, cw, rng, ctx):
    """Large status board. Its content is drawn by the game and is labelled as fiction."""
    for z0, z1 in ((0.37, 0.98),):
        plate(z, cw, z1 - z0, (z0 + z1) / 2, 0, 0.04, "wall", rng)
    w = min(1.72, cw)
    z.box((w, 0.09, 1.12), (0, -0.045, 1.66), "struct", bevel=0.015)
    z.panel(w - 0.14, 0.96, at=(0, -0.092, 1.66), rot=(rad(90), 0, 0), mat="screen_board")
    z.light(w - 0.3, 0.8, at=(0, -0.13, 1.66), rot=(rad(-90), 0, 0), color=(1.0, 0.55, 0.15), watts=6.0, layer="E")
    bolts(z, w, 1.12, -0.094, 1.66, inset=0.035)
    z.box((w, 0.12, 0.05), (0, -0.06, 1.06), "steel")
    z.cable((-w / 2 + 0.1, -0.05, 1.1), (-w / 2 - 0.05, -0.05, 0.36), 0.06, 0.018)
    z.cable((w / 2 - 0.2, -0.05, 2.22), (w / 2 - 0.1, -0.08, 2.46), -0.02, 0.018)


def hub_centre(z, ctx):
    """Hub landmark: an illuminated station plan set into the floor and a gantry of hanging monitors.
    Nothing here has collision: the plan is flat and the gantry hangs above head height."""
    from vorax_lib import P

    lay, s, mid = ctx.lay, 0.1, 11.0
    z.push(T(P(0.0, 3.3, 0.0)))
    for sx in (-1, 1):
        z.box((0.05, 4.8, 0.012), (sx * 1.975, 0, 0.006), "steel")
        z.box((4.0, 0.05, 0.012), (0, sx * 2.375, 0.006), "steel")
    for r in lay["rects"]:
        x0, x1 = -r["x1"] * s, -r["x0"] * s
        y0, y1 = -(r["z1"] - mid) * s, -(r["z0"] - mid) * s
        glow = "emit_cyan" if r["kind"] == "room" else "emit_amber"
        for y in (y0, y1):
            z.box((x1 - x0, 0.022, 0.004), ((x0 + x1) / 2, y, 0.009), glow)
        for x in (x0, x1):
            z.box((0.022, y1 - y0, 0.004), (x, (y0 + y1) / 2, 0.009), glow)
        if r["kind"] == "room":
            label = {"OPPORTUNITY": "EAST", "INSIGHT": "WEST", "OBSERVATION": "DECK"}.get(r["id"], r["id"])
            z.text(label, 0.075, at=((x0 + x1) / 2, (y0 + y1) / 2, 0.011), rot=(0, 0, math.pi), mat="emit_cyan")
    z.text("STATION PLAN - FICTIONAL ARCHIVE", 0.07, at=(0, 2.18, 0.011), rot=(0, 0, math.pi), mat="emit_amber")
    z.light(3.6, 4.4, at=(0, 0, 0.06), rot=(rad(180), 0, 0), color=(0.22, 0.85, 0.95), watts=5.0, layer="E")
    z.pop()

    z.push(T(P(0.0, 5.2, 0.0)))
    R, top = 1.6, 2.68
    for k in range(4):
        z.push(T(rot=(0, 0, rad(90 * k))))
        z.box((2 * R + 0.14, 0.14, 0.14), (0, -R, top), "struct", bevel=0.02)
        z.rod((R, -R, top), (R, -R, CEIL - 0.2), 0.03, "steel", segs=6)
        z.beam((R, -R, top + 0.07), (R - 0.5, -R + 0.5, CEIL - 0.26), 0.05, 0.05, "struct")
        z.box((1.04, 0.14, 0.64), (0, -R - 0.08, 2.36), "equip", rot=(rad(12), 0, 0), bevel=0.02)
        z.panel(0.9, 0.52, at=(0, -R - 0.153, 2.345), rot=(rad(102), 0, 0), mat="screen_board" if k % 2 == 0 else "screen_crt")
        z.light(0.8, 0.45, at=(0, -R - 0.22, 2.33), rot=(rad(-78), 0, 0), color=(1.0, 0.55, 0.15) if k % 2 == 0 else (0.2, 0.85, 0.4), watts=3.0, layer="E")
        z.rod((-0.3, -R, top - 0.05), (-0.3, -R - 0.05, 2.68), 0.012, "rubber", segs=5)
        z.cable((-R + 0.2, -R + 0.05, top - 0.06), (R - 0.2, -R + 0.05, top - 0.06), 0.16, 0.016, "rubber" if k % 2 else "hazard")
        z.pop()
    z.pop()


def deck_dressing(z, ctx):
    from vorax_lib import P

    z.push(T(P(0.0, 24.3, 0.006), (0, 0, math.pi)))
    z.text("OBSERVATION DECK", 0.3, mat="paint_white")
    z.text("RESCUE VISUAL CONTACT", 0.1, at=(0, -0.34, 0), mat="hazard")
    z.pop()
    for x in (-3.0, 3.0):  # two instrument pods standing on the window sill
        z.push(T(P(x, 29.72, 0.375), (0, 0, 0)))
        z.box((0.9, 0.3, 0.2), (0, 0, 0.1), "equip", bevel=0.015)
        z.box((0.7, 0.24, 0.03), (0, 0.05, 0.25), "struct", rot=(rad(-28), 0, 0))
        z.panel(0.6, 0.2, at=(0, 0.045, 0.27), rot=(rad(-28), 0, 0), mat="screen_wave")
        z.box((0.04, 0.03, 0.03), (0.38, 0.1, 0.2), "emit_amber")
        z.pop()


def bay_archive(z, cw, rng, ctx):
    """Research-archive wall: flat-file drawer banks with label holders; some pulled, some missing."""
    z.box((cw, 0.22, 2.02), (0, -0.11, 1.4), "equip", bevel=0.012)
    z.box((cw, 0.24, 0.05), (0, -0.12, 0.41), "struct")
    rows, cols = 7, max(2, int(cw / 0.55))
    dw, dh = (cw - 0.08) / cols, 1.84 / rows
    for r in range(rows):
        for c in range(cols):
            x = -cw / 2 + 0.04 + (c + 0.5) * dw
            zz = 0.47 + (r + 0.5) * dh
            roll = rng.random()
            if roll > 0.97 - 0.04 * ctx.damage:
                z.box((dw - 0.03, 0.01, dh - 0.03), (x, -0.215, zz), "cavity")  # an empty slot
                continue
            out = rng.uniform(0.03, 0.05) if roll < 0.1 * (1 + ctx.damage) else 0.0
            z.box((dw - 0.02, 0.02 + out, dh - 0.02), (x, -0.23 - out / 2, zz), "machine" if (r + c) % 5 else "struct", bevel=0.004)
            z.box((dw * 0.42, 0.008, 0.034), (x, -0.244 - out, zz + 0.02), "paint_white")
            z.box((dw * 0.3, 0.014, 0.012), (x, -0.247 - out, zz - dh * 0.25), "steel")
    z.box((cw * 0.5, 0.012, 0.03), (0, -0.226, 2.37), "emit_amber")
    z.push(T((0, -0.118, 2.47), (rad(90), 0, 0)))
    z.text("ARCHIVE BANK %02d" % rng.randint(1, 9), 0.055, mat="emit_amber")
    z.pop()
    z.cable((cw / 2 - 0.2, -0.06, 2.42), (cw / 2 - 0.05, -0.09, 2.47), -0.02, 0.014)


def bay_seismo(z, cw, rng, ctx):
    """Listening-station instrument wall: waveform display, drum recorder on isolation mounts, dials.
    Fictional station equipment; its screen states that it shows no mission data."""
    plate(z, cw, 0.46, 0.6, 0, 0.04, "wall", rng)
    w = min(cw, 1.5)
    z.box((w, 0.1, 0.82), (0, -0.05, 1.86), "struct", bevel=0.015)
    z.panel(w - 0.12, 0.68, at=(0, -0.102, 1.86), rot=(rad(90), 0, 0), mat="screen_wave")
    z.light(w - 0.2, 0.6, at=(0, -0.14, 1.86), rot=(rad(-90), 0, 0), color=(0.2, 0.75, 0.85), watts=4.0, layer="E")
    bolts(z, w, 0.82, -0.104, 1.86, inset=0.03)
    z.box((w, 0.25, 0.2), (0, -0.125, 0.98), "machine", bevel=0.012)
    for x in (-w / 2 + 0.16, 0, w / 2 - 0.16):
        z.cyl(0.07, 0.12, (x, -0.13, 0.82), "rubber", segs=10)
        z.tor(0.06, 0.012, (x, -0.13, 0.86), "steel", major=10, minor=5)
    z.cyl(0.115, w * 0.5, (-w * 0.16, -0.14, 1.22), "paint_white", rot=(0, rad(90), 0), segs=16)
    for sx in (-1, 1):
        z.cyl(0.13, 0.03, (-w * 0.16 + sx * w * 0.26, -0.14, 1.22), "steel", rot=(0, rad(90), 0), segs=16)
        z.box((0.04, 0.2, 0.3), (-w * 0.16 + sx * w * 0.29, -0.13, 1.2), "struct")
    z.rod((-w * 0.3, -0.26, 1.34), (w * 0.06, -0.255, 1.3), 0.008, "steel", segs=5)
    for k in range(3):
        x = w / 2 - 0.34 + k * 0.14
        z.cyl(0.055, 0.04, (x, -0.26, 1.02), "equip", rot=(rad(90), 0, 0), segs=12)
        z.cyl(0.042, 0.006, (x, -0.282, 1.02), "emit_cyan" if k != 1 else "emit_amber", rot=(rad(90), 0, 0), segs=12)
    z.box((0.3, 0.2, 0.22), (w / 2 - 0.2, -0.1, 1.36), "equip", bevel=0.01)
    z.cable((w / 2 - 0.2, -0.06, 1.47), (w / 2 - 0.08, -0.07, 2.46), -0.04, 0.016)
    z.cable((-w / 2 + 0.1, -0.2, 0.9), (-w / 2 - 0.02, -0.2, 0.36), 0.05, 0.014, "hazard")


HERO_BAYS = {"console": bay_console, "board": bay_board, "archive": bay_archive, "seismo": bay_seismo}

PROPS = {
    "rack": rack,
    "crate": crate,
    "switch": switch,
    "terminal": terminal,
    "lamp": lamp,
    "tray": tray,
    "pedestal": pedestal,
    "insight": insight,
    "opportunity": opportunity,
    "relay": relay,
    "fan": fan,
    "arm": arm_mount,
}
# per-placement overrides: the same collider, a different story
OVERRIDES = {
    "airlock-rack": lambda z, rng, ctx: rack(z, rng, ctx, comms=True),
    "airlock-crate-1": supply_stack,
    "airlock-crate-2": chair,
}
