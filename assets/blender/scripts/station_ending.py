"""VØRAX: THE LAST SIGNAL — ending pass r2: observation window recomposition and Rescue One.

Non-destructive companion to build_station.py. It edits the open vorax_station.blend in place and
touches only ENV_/DET_OBSERVATION, the deck's bake lights and the rescue__hull mesh. Every step can
be run again: its own geometry is tagged and replaced, nothing else is rebuilt.

    import sys; sys.path.insert(0, "<project>/assets/blender/scripts")
    import station_ending as E
    E.deck(); E.deck_lights()      # window frame, rail, sill instruments, exterior light rig
    E.bake_deck(); E.probe_deck()  # OBSERVATION lightmaps (P/E), stats and reflection probe
    E.ship(); E.bake_ship()        # Rescue One mesh, then its baked colour / self-light atlas
    E.export_environment(); E.export_ship()

build_station.py still regenerates revision r1 from scratch: do not run it over this file.
Space conventions are those of vorax_lib (Blender X = -x, Y = -z, Z = y). Rescue One is authored
with its front on local -Y; in the game its local axes map to (x, y, z) = (X, Z, Y).
"""

import json
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import vorax_lib as L  # noqa: E402
from station_arch import XZY, YZX  # noqa: E402
from vorax_lib import Mesh, P, T, plan_frame, rad  # noqa: E402

BLEND_DIR = os.path.dirname(HERE)
PROJECT = os.path.dirname(os.path.dirname(BLEND_DIR))
TEX = os.path.join(BLEND_DIR, "textures")
MODELS = os.path.join(PROJECT, "public", "assets", "models")
_PIPE = None


def pipeline():
    """build_station.py without its unconditional main(), so its bake and export code is reused as is."""
    global _PIPE
    if _PIPE is None:
        path = os.path.join(HERE, "build_station.py")
        src = open(path).read().rstrip()
        assert src.endswith("RESULT = main()")
        ns = {"__name__": "build_station_lib", "__file__": path}
        exec(compile(src[: -len("RESULT = main()")], path, "exec"), ns)
        for name, tile in (("wall", 2.5), ("floor", 1.0), ("grate", 0.8), ("struct", 2.0), ("equip", 1.2), ("machine", 1.2), ("crate", 1.4)):
            L.TILE.setdefault(name, tile)
        L.register_palette("flat", list(ns["FLAT"]))
        L.register_palette("emit_e", list(ns["GLOW"]))
        _PIPE = ns
    lights = bpy.data.collections["LIGHTS"].objects
    for layer in "PE":
        _PIPE["BAKE_LIGHTS"][layer][:] = [o for o in lights if "_%s_" % layer in o.name]
    return _PIPE


def mats():
    return {m.name: m for m in bpy.data.materials}


# ---------------------------------------------------------------- observation deck


def _old_window(f):
    """r1 mullions, eye-level transom and sill pods (replaced by this pass)."""
    xs = [v.co.x for v in f.verts]
    ys = [v.co.y for v in f.verts]
    zs = [v.co.z for v in f.verts]
    mull = max(abs(x) for x in xs) <= 5.26 and min(ys) >= -30.01 and max(ys) <= -29.79 and min(zs) >= 0.37 and max(zs) <= 2.93
    pod = max(abs(abs(x) - 3.0) for x in xs) <= 0.55 and min(ys) >= -29.95 and max(ys) <= -29.5 and min(zs) >= 0.37 and max(zs) <= 0.8
    return mull or pod


def _deck_parts(z):
    """Three wide bays instead of a tight grid: the eye-level band stays clear for Rescue One.
    Everything at eye height stays within 0.25 m of the wall plane; the camera stops at 0.30 m."""
    z.push(plan_frame(0, 30.0, math.pi))  # local +X east, -Y into the room, glass plane at y = -0.02
    top, sill = 2.925, 0.43
    mid = (top + sill) / 2
    for x in (-1.75, 1.75):
        z.box((0.26, 0.22, top - sill + 0.04), (x, -0.11, mid), "struct", bevel=0.02)
        z.box((0.32, 0.03, top - sill), (x, -0.232, mid), "equip", bevel=0.006)
        z.box((0.27, 0.23, 0.05), (x, -0.11, 0.66), "hazard")
        z.box((0.06, 0.012, 0.03), (x, -0.25, 2.7), "emit_red")
        for s in (-1, 1):  # chamfered bay corners
            z.prism([(x + s * 0.13, top), (x + s * 0.55, top), (x + s * 0.13, top - 0.42)], -0.2, -0.02, "struct", M=XZY)
            z.prism([(x + s * 0.13, sill), (x + s * 0.13, sill + 0.24), (x + s * 0.37, sill)], -0.2, -0.02, "struct", M=XZY)
    for s in (-1, 1):
        z.prism([(s * 5.25, top), (s * 4.83, top), (s * 5.25, top - 0.42)], -0.2, -0.02, "struct", M=XZY)
        z.prism([(s * 5.25, sill), (s * 5.25, sill + 0.24), (s * 5.01, sill)], -0.2, -0.02, "struct", M=XZY)
        z.box((0.06, 0.012, 0.03), (s * 5.4, -0.406, 2.7), "emit_red")
    # retracted pressure-shutter cassette above the opening (above head height)
    z.box((10.5, 0.1, 0.2), (0, -0.45, 3.06), "struct", bevel=0.015)
    for x in (-3.5, 0.0, 3.5):
        z.box((0.5, 0.14, 0.26), (x, -0.47, 3.08), "equip", bevel=0.02)
        z.box((0.06, 0.012, 0.04), (x + 0.16, -0.542, 3.02), "emit_amber")
        for s in (-1, 1):
            z.box((0.3, 0.012, 0.07), (x + s * 0.46, -0.504, 3.06), "hazard")
    # guard rail just inside the glass: the low horizontal line that replaces the eye-level transom
    ry, rz = -0.24, 1.02
    z.rod((-5.25, ry, rz), (5.25, ry, rz), 0.028, "gunmetal", segs=8)
    for x in (-4.5, -2.6, -0.875, 0.875, 2.6, 4.5):
        z.rod((x, ry, sill), (x, ry, rz), 0.02, "gunmetal", segs=6)
        z.box((0.09, 0.09, 0.02), (x, ry, sill + 0.01), "struct")
    # left bay: optical tracker aimed out through the glass
    with z.at((-3.5, -0.23, sill)):
        tilt = rad(-78)
        z.box((0.3, 0.3, 0.06), (0, 0, 0.03), "struct", bevel=0.01)
        z.cyl(0.07, 0.22, (0, 0, 0.17), "equip", segs=12)
        z.box((0.26, 0.12, 0.2), (0, 0, 0.34), "machine", bevel=0.02)
        z.cyl(0.085, 0.4, (0, 0.0, 0.44), "equip", rot=(tilt, 0, 0), segs=14)
        z.cyl(0.1, 0.05, (0, 0.17, 0.476), "struct", rot=(tilt, 0, 0), segs=14)
        z.cyl(0.035, 0.1, (0, -0.22, 0.393), "rubber", rot=(tilt, 0, 0), segs=10)
        z.box((0.1, 0.03, 0.07), (0.2, -0.05, 0.34), "struct")
        z.box((0.03, 0.012, 0.03), (0.2, -0.07, 0.34), "emit_amber")
    # right bay: approach console; its screen is drawn by the game and labelled as fiction
    with z.at((3.5, -0.23, sill)):
        z.box((1.3, 0.34, 0.2), (0, 0, 0.1), "equip", bevel=0.015)
        z.box((1.24, 0.3, 0.03), (0, -0.03, 0.27), "struct", rot=(rad(28), 0, 0))
        z.panel(0.62, 0.2, at=(-0.24, -0.04, 0.293), rot=(rad(28), 0, 0), mat="screen_wave")
        for k in range(5):
            z.box((0.05, 0.05, 0.02), (0.22 + k * 0.09, -0.038, 0.286), "equip", rot=(rad(28), 0, 0))
        z.box((0.04, 0.03, 0.03), (0.56, -0.1, 0.24), "emit_amber")
        z.rod((-0.5, 0.1, 0.2), (-0.5, 0.12, 0.34), 0.012, "steel", segs=5)
    z.pop()


EXTRA_FLAT = {"gunmetal": ((0.085, 0.09, 0.1), 0.85, 0.45)}  # appended to the shared flat palette (free cells)


def palette():
    """Adds this pass's swatches to pal_flat_*.png. Existing cells keep their exact values and UVs."""
    B = pipeline()
    flat = {**B["FLAT"], **EXTRA_FLAT}
    L.register_palette("flat", list(flat))
    for file, colors, non_color in (
        ("pal_flat_base.png", [L.srgb(v[0]) for v in flat.values()], False),
        ("pal_flat_orm.png", [(1.0, v[2], v[1]) for v in flat.values()], True),
    ):
        w, h = L.PAL_COLS * L.PAL_CELL, L.PAL_ROWS * L.PAL_CELL
        px = []
        for y in range(h):
            for x in range(w):
                i = (L.PAL_ROWS - 1 - y // L.PAL_CELL) * L.PAL_COLS + x // L.PAL_CELL
                px += [*(colors[i] if i < len(colors) else (0.0, 0.0, 0.0)), 1.0]
        tmp = bpy.data.images.new("_pal", w, h, alpha=False)
        if non_color:
            tmp.colorspace_settings.name = "Non-Color"
        tmp.pixels.foreach_set(px)
        tmp.filepath_raw = os.path.join(TEX, file)
        tmp.file_format = "PNG"
        tmp.save()
        bpy.data.images.remove(tmp)
        bpy.data.images[file].reload()


def _retone(ob):
    """The bright steel sill cap and the ceiling pipes beside the window glared under the searchlight."""
    steel, dark = L.PALETTE["steel"][1], L.PALETTE["gunmetal"][1]
    flat = [m.name for m in ob.data.materials].index("flat")
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    uv = bm.loops.layers.uv["UVMap"]
    n = 0
    for f in bm.faces:
        if f.material_index != flat or (f.loops[0][uv].uv - Vector(steel)).length > 1e-4:
            continue
        ys = [v.co.y for v in f.verts]
        zs = [v.co.z for v in f.verts]
        cap = min(ys) >= -30.01 and max(ys) <= -29.5 and min(zs) >= 0.36 and max(zs) <= 0.44
        pipes = min(ys) >= -29.13 and max(ys) <= -28.74 and min(zs) >= 2.98 and max(zs) <= 3.14
        if cap or pipes:
            for loop in f.loops:
                loop[uv].uv = dark
            n += 1
    bm.to_mesh(ob.data)
    bm.free()
    return n


def deck():
    """Replaces the r1 window grid in ENV_/DET_OBSERVATION and unwraps the zone's lightmap again."""
    B = pipeline()
    palette()
    env, det = bpy.data.objects["ENV_OBSERVATION"], bpy.data.objects["DET_OBSERVATION"]
    z = Mesh("_r2")
    z.mats = [m.name for m in env.data.materials]  # same slot order as the zone objects
    known = len(z.mats)
    _deck_parts(z)
    for name in z.mats[known:]:
        for ob in (env, det):
            ob.data.materials.append(bpy.data.materials[name])
    forced = {i for i, m in enumerate(z.mats) if m in B["DETAIL_MATS"]}
    z.bm.faces.ensure_lookup_table()
    z.bm.faces.index_update()
    small = {f.index for f in z.bm.faces if f.material_index in forced or f.calc_area() < 0.012}
    counts = {}
    for ob, keep_small in ((env, False), (det, True)):
        part = z.bm.copy()
        part.faces.ensure_lookup_table()
        part.faces.index_update()
        bmesh.ops.delete(part, geom=[f for f in part.faces if (f.index in small) != keep_small], context="FACES")
        tmp = bpy.data.meshes.new("_r2part")
        part.normal_update()
        part.to_mesh(tmp)
        part.free()
        tmp.uv_layers[0].name = "UVMap"
        tmp.set_sharp_from_angle(angle=rad(42))
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        tag = bm.faces.layers.int.get("r2") or bm.faces.layers.int.new("r2")
        gone = [f for f in bm.faces if f[tag] == 1 or _old_window(f)]
        bmesh.ops.delete(bm, geom=gone, context="FACES")
        n = len(bm.faces)
        bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        bm.faces.ensure_lookup_table()
        for f in bm.faces[n:]:
            f[tag] = 1
        counts[ob.name] = {"removed": len(gone), "added": len(bm.faces) - n}
        bm.to_mesh(ob.data)
        bm.free()
        ob.data.update()
    z.bm.free()
    for ob in (env, det):
        counts[ob.name]["retoned"] = _retone(ob)
    L.unwrap_lightmap(env)
    for ob in (env, det):
        ob.data.calc_loop_triangles()
        counts[ob.name]["triangles"] = len(ob.data.loop_triangles)
    return counts


def deck_lights(fill=60.0, moon=0.7, planet=0.22):
    """Emergency (always-on) layer of the deck: light that comes from outside, not from ship power.
    A cold key rakes in through the window, the planet below glows on the ceiling, a soft fill stays."""
    coll = L.collection("LIGHTS")
    # r1 left the default 5 % grey world background on; it lit the deck through the window in both layers.
    for node in bpy.context.scene.world.node_tree.nodes:
        if node.type == "BACKGROUND":
            node.inputs["Strength"].default_value = 0.0
    win = min((o for o in coll.objects if o.data.type == "AREA"), key=lambda o: (o.location - P(0, 29.55, 1.65)).length)
    assert (win.location - P(0, 29.55, 1.65)).length < 0.05
    win.data.energy = fill
    win.data.color = (0.42, 0.6, 1.0)

    def sun(name, d_game, color, strength, angle):
        ob = bpy.data.objects.get(name)
        if ob is None:
            ob = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
            coll.objects.link(ob)
        d = Vector((-d_game[0], -d_game[2], d_game[1])).normalized()
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        ob.location = P(0, 36, 7)
        ob.data.color, ob.data.energy, ob.data.angle = color, strength, rad(angle)
        ob.visible_camera = False
        return ob

    sun("sun_E_moon", (0.35, -0.42, -0.84), (0.62, 0.76, 1.0), moon, 2.5)
    sun("sun_E_planet", (0.30, 0.42, -0.86), (1.0, 0.36, 0.18), planet, 25.0)
    return {"fill": win.name}


def bake_deck(samples=96):
    B = pipeline()
    m = mats()
    B["setup_cycles"](samples)
    out = B["bake_zone"](bpy.data.objects["ENV_OBSERVATION"], "OBSERVATION", m)
    path = os.path.join(PROJECT, "src", "content", "lightmap-stats.json")
    stats = json.load(open(path))
    stats["OBSERVATION"] = {"p": out["P"]["lit_mean"], "e": out["E"]["lit_mean"]}
    with open(path, "w") as fh:
        json.dump(stats, fh, indent=1)
        fh.write("\n")
    return out


def probe_deck():
    B = pipeline()
    B["set_layer"](mats(), "ALL")
    scene = bpy.context.scene
    scene.camera = bpy.data.objects["probe_OBSERVATION"]
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = 512, 256, 100
    r.image_settings.file_format = "HDR"
    r.filepath = os.path.join(PROJECT, "public", "assets", "env", "observation.hdr")
    bpy.ops.render.render(write_still=True)
    return os.path.getsize(r.filepath)


def preview(path, x, z, yaw=0.0, pitch=0.0, layer="ALL", fov=75.0, exposure=1.2, samples=48, size=(960, 540)):
    """Cycles look at the level from a game position (art review only; the engine is the reference)."""
    B = pipeline()
    B["set_layer"](mats(), layer)
    scene = bpy.context.scene
    cam = bpy.data.objects.get("preview_r2")
    if cam is None:
        cam = bpy.data.objects.new("preview_r2", bpy.data.cameras.new("preview_r2"))
        L.collection("PREVIEW").objects.link(cam)
    cam.data.sensor_fit, cam.data.angle_y, cam.data.clip_start = "VERTICAL", rad(fov), 0.05
    cam.location = P(x, z, 1.65)
    cam.rotation_euler = (rad(90) - pitch, 0, rad(180) - yaw)
    keep = (scene.camera, scene.cycles.samples, scene.render.filepath, scene.render.image_settings.file_format)
    scene.camera, scene.cycles.samples = cam, samples
    r = scene.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = size[0], size[1], 100
    r.image_settings.file_format = "PNG"
    r.filepath = path
    scene.view_settings.view_transform, scene.view_settings.exposure = "AgX", exposure
    bpy.ops.render.render(write_still=True)
    scene.view_settings.view_transform, scene.view_settings.exposure = "Standard", 0.0
    scene.camera, scene.cycles.samples, r.filepath, r.image_settings.file_format = keep
    B["set_layer"](mats(), "ALL")
    return path


def export_environment():
    B = pipeline()
    B["set_layer"](mats(), "ALL")
    objs = [bpy.data.objects[p + zone] for p in ("ENV_", "DET_") for zone in B["ZONES"]]
    return B["export_glb"](os.path.join(MODELS, "environment.glb"), objs)


# ---------------------------------------------------------------- Rescue One

# bake sources: (texture set or None, target linear colour, tile in metres). Texture detail is kept as
# relative variation around the target colour, so plates and scratches survive any livery.
SHIP_SRC = {
    "hull": ("wall", (0.62, 0.6, 0.55), 1.8),
    "orange": ("wall", (0.62, 0.17, 0.03), 1.8),
    "hull_dark": ("struct", (0.09, 0.095, 0.11), 1.6),
    "nacelle": ("equip", (0.26, 0.265, 0.27), 1.4),
    "metal": (None, (0.3, 0.3, 0.31), 1.0),
    "void": (None, (0.004, 0.004, 0.005), 1.0),
}
SHIP_EMIT = {  # flat emitters kept as their own materials so the game's bloom can pick them up
    "ship_lens": ((1.0, 0.95, 0.8), 8.0),
    "ship_flood": ((1.0, 0.9, 0.72), 3.0),
    "ship_cabin": ((1.0, 0.6, 0.28), 1.2),
    "ship_nav_red": ((1.0, 0.08, 0.05), 6.0),
    "ship_nav_green": ((0.1, 1.0, 0.3), 6.0),
    "ship_glow": ((0.45, 0.78, 1.0), 6.0),
}
# The game's searchlight sits at ship-local (0, -2.5, 0.8): the main lens is modelled exactly there.
LAMP = (0.0, -2.5, 0.8)
SHIP_LIGHTS = [  # ship-local position, colour, watts: the craft's own light on its hull (baked)
    ((0.0, 0.1, -0.35), (1.0, 0.88, 0.7), 7.0),
    ((0.0, -2.95, 0.8), (1.0, 0.9, 0.72), 3.0),
    ((1.55, 0.3, 0.5), (1.0, 0.92, 0.8), 2.5),
    ((-1.55, 0.3, 0.5), (1.0, 0.92, 0.8), 2.5),
    ((1.82, 2.8, 1.12), (0.45, 0.75, 1.0), 5.0),
    ((-1.82, 2.8, 1.12), (0.45, 0.75, 1.0), 5.0),
    ((4.45, -0.15, 0.55), (1.0, 0.08, 0.05), 0.8),
    ((-4.45, -0.15, 0.55), (0.1, 1.0, 0.3), 0.8),
]


def _linear_mean(img):
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    c = a.reshape(-1, 4)[:, :3]
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).mean(axis=0)


def _ship_materials():
    M = {}
    for key, (tex, rgb, tile) in SHIP_SRC.items():
        name = "shipsrc_" + key
        if bpy.data.materials.get(name):
            bpy.data.materials.remove(bpy.data.materials[name])
        if tex is None:
            mat = L.flat_material(name, rgb, rough=0.6)
        else:
            mat = bpy.data.materials.new(name)
            nt, bsdf = L._principled(mat)
            ti = nt.nodes.new("ShaderNodeTexImage")
            ti.image = bpy.data.images[tex + "_base.jpg"]
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type, mix.blend_type = "RGBA", "MULTIPLY"
            sock = {s.identifier: s for s in mix.inputs}
            sock["Factor_Float"].default_value = 1.0
            sock["B_Color"].default_value = (*[c / m for c, m in zip(rgb, _linear_mean(ti.image))], 1.0)
            nt.links.new(ti.outputs["Color"], sock["A_Color"])
            nt.links.new(next(s for s in mix.outputs if s.identifier == "Result_Color"), bsdf.inputs["Base Color"])
            bsdf.inputs["Roughness"].default_value = 0.6
        L.TILE[key] = tile
        M[key] = mat
    for name, (color, strength) in SHIP_EMIT.items():
        mat = bpy.data.materials.get(name) or L.flat_material(name, (0.02, 0.02, 0.02), emit=color, strength=strength)
        L.set_emission(mat, strength)
        next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Emission Color"].default_value = (*color, 1.0)
        M[name] = mat
    return M


def _oct(y, w, zb, zt, cb, ct):
    return [(-w + cb, y, zb), (w - cb, y, zb), (w, y, zb + cb), (w, y, zt - ct), (w - ct, y, zt), (-w + ct, y, zt), (-w, y, zt - ct), (-w, y, zb + cb)]


def _loft(z, rings, mat, caps=(True, True)):
    """Skin over closed rings of points; faces end up pointing away from the rings' centre."""
    bm = bmesh.new()
    vs = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(vs[0])
    for a, b in zip(vs, vs[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if caps[0]:
        bm.faces.new(vs[0])
    if caps[1]:
        bm.faces.new(vs[-1][::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    centre = sum((v.co for v in bm.verts), Vector()) / len(bm.verts)
    bm.faces.ensure_lookup_table()
    f = bm.faces[0]
    if f.normal.dot(f.calc_center_median() - centre) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    z._add(bm, Matrix.Identity(4), mat)


def _ship_parts(h):
    """Fictional orbital rescue tug. Front on -Y, origin at the base centre, about 9.5 x 5 x 2.4 m."""
    R90 = (rad(90), 0, 0)
    rings = [_oct(*s) for s in (
        (-2.42, 0.62, 0.42, 1.18, 0.14, 0.2), (-1.95, 0.9, 0.3, 1.36, 0.2, 0.26), (-1.55, 1.04, 0.24, 1.5, 0.24, 0.3),
        (-0.6, 1.15, 0.2, 1.72, 0.28, 0.36), (1.2, 1.15, 0.2, 1.72, 0.28, 0.36), (2.0, 1.0, 0.3, 1.62, 0.26, 0.32), (2.5, 0.74, 0.5, 1.4, 0.2, 0.26))]
    _loft(h, rings[0:2], "hull", (True, False))
    _loft(h, rings[1:3], "orange", (False, False))  # high-visibility rescue band
    _loft(h, rings[2:5], "hull", (False, False))
    _loft(h, rings[4:7], "hull_dark", (False, True))
    # cockpit: dark frame with lit panes, so the craft reads as crewed
    _loft(h, [_oct(*s) for s in ((-1.98, 0.46, 1.3, 1.36, 0.02, 0.04), (-1.5, 0.6, 1.4, 1.9, 0.05, 0.16), (-0.55, 0.62, 1.6, 1.95, 0.05, 0.16), (0.3, 0.4, 1.66, 1.8, 0.04, 0.08))], "hull_dark")
    a = math.atan2(1.9 - 1.36, 1.98 - 1.5)
    n = Vector((0, -math.sin(a), math.cos(a)))
    for x in (-0.27, 0.0, 0.27):
        h.panel(0.24, 0.5, at=Vector((x, -1.74, 1.63)) + n * 0.02, rot=(a, 0, 0), mat="ship_cabin")
    for s in (-1, 1):
        h.panel(0.14, 0.5, at=(s * 0.645, -1.2, 1.66), rot=(0, rad(90 * s), 0), mat="ship_cabin")
    # searchlight cluster on the nose face; nothing may sit in front of LAMP inside the beam
    yf = -2.42
    h.cyl(0.34, 0.04, (0, yf - 0.01, LAMP[2]), "hull_dark", rot=R90, segs=20)
    h.tor(0.25, 0.028, (0, yf - 0.045, LAMP[2]), "metal", rot=R90, major=24, minor=6)
    h.cyl(0.225, 0.03, (0, yf - 0.048, LAMP[2]), "ship_lens", rot=R90, segs=20)
    for s in (-1, 1):
        h.cyl(0.1, 0.05, (s * 0.42, yf - 0.02, 0.6), "hull_dark", rot=R90, segs=12)
        h.cyl(0.075, 0.02, (s * 0.42, yf - 0.05, 0.6), "ship_flood", rot=R90, segs=12)
    # underside: sensor ball, rescue bay, skids (the deck looks up at this side)
    h.sph(0.17, (0, -1.72, 0.27), "hull_dark", segs=12, rings=8)
    h.cyl(0.19, 0.04, (0, -1.72, 0.32), "metal", segs=12)
    h.box((1.3, 2.6, 0.22), (0, 0.2, 0.2), "hull_dark", bevel=0.05)
    h.sph(0.05, (0, 1.3, 0.07), "ship_nav_red", segs=8, rings=5)
    for s in (-1, 1):
        h.box((0.05, 2.2, 0.07), (s * 0.67, 0.2, 0.2), "orange")
        h.cyl(0.09, 0.03, (s * 0.35, -0.7, 0.08), "ship_flood", segs=12)
        h.box((0.1, 2.5, 0.07), (s * 0.8, 0.1, 0.035), "metal", bevel=0.02)
        h.beam((s * 0.8, -1.15, 0.035), (s * 0.8, -1.5, 0.17), 0.1, 0.07, "metal")
        for y in (-0.7, 0.9):
            h.beam((s * 0.8, y, 0.06), (s * 0.62, y, 0.3), 0.07, 0.07, "metal")
    for s in (-1, 1):
        x, zc = s * 1.82, 1.12
        # engine nacelle: pale intake lip, dark throat, spinner and stators instead of a flat disc
        h.cyl(0.5, 3.3, (x, 0.55, zc), "nacelle", rot=R90, segs=20)
        h.cyl(0.52, 0.24, (x, -0.55, zc), "orange", rot=R90, segs=20, caps=False)
        h.tor(0.47, 0.07, (x, -1.1, zc), "hull", rot=R90, major=24, minor=8)
        h.cyl(0.42, 0.03, (x, -1.115, zc), "void", rot=R90, segs=20)
        h.cyl(0.15, 0.3, (x, -1.25, zc), "metal", rot=R90, segs=14, r2=0.03)
        for k in range(6):
            h.box((0.28, 0.02, 0.035), mat="metal", M=T((x, -1.14, zc)) @ Matrix.Rotation(rad(k * 60), 4, "Y") @ T((0.28, 0, 0)))
        h.cyl(0.36, 0.3, (x, 2.35, zc), "hull_dark", rot=R90, segs=20, r2=0.49)
        h.cyl(0.32, 0.02, (x, 2.505, zc), "ship_glow", rot=R90, segs=20)
        h.box((0.5, 1.5, 0.3), (s * 1.3, 0.45, 1.18), "hull", bevel=0.04)
        # drooped radiator wing with a high-visibility leading edge and a tip pod carrying the nav light
        with h.at((s * 2.25, 0.0, zc), (0, rad(18.2 * s), 0)):
            h.prism([(0, -0.75), (s * 2.37, 0.35), (s * 2.37, 1.25), (0, 1.75)], -0.06, 0.06, "hull")
            h.beam((0, -0.75, 0), (s * 2.37, 0.35, 0), 0.12, 0.15, "orange")
            h.box((1.5, 0.9, 0.16), (s * 1.2, 0.72, 0), "hull_dark", bevel=0.02)
            h.cyl(0.16, 1.5, (s * 2.45, 0.8, 0), "hull_dark", rot=R90, segs=12)
            h.sph(0.16, (s * 2.45, 0.05, 0), "hull_dark", segs=12, rings=6)
            h.sph(0.075, (s * 2.45, -0.12, 0), "ship_nav_red" if s > 0 else "ship_nav_green", segs=8, rings=5)  # port is +X
        with h.at((s * 0.72, 0.0, 1.64), (0, rad(35 * s), 0)):  # canted tail fin
            h.prism([(1.1, 0.0), (2.35, 0.0), (2.5, 0.95), (2.05, 0.95)], -0.04, 0.04, "hull", M=YZX)
            h.prism([(1.82, 0.72), (2.464, 0.72), (2.5, 0.95), (2.05, 0.95)], -0.06, 0.06, "orange", M=YZX)
        h.box((0.42, 0.9, 0.05), (s * 0.984, 0.35, 1.554), "hull_dark", rot=(0, rad(45 * s), 0))
        h.box((0.14, 0.2, 0.14), (s * 1.0, -1.72, 0.9), "hull_dark", bevel=0.02)
        h.push(T((s * 1.175, 0.3, 0.66), (rad(90), 0, rad(90 * s))))
        h.text("RESCUE ONE", 0.3, mat="hull_dark")
        h.pop()
    # spine, dish, whip antenna and beacon
    h.box((0.5, 2.2, 0.16), (0, 1.0, 1.78), "hull_dark", bevel=0.03)
    h.rod((0.45, 1.5, 1.7), (0.45, 1.5, 2.0), 0.03, "metal", segs=6)
    h.cyl(0.08, 0.1, (0.45, 1.5, 2.04), "hull", rot=(rad(25), 0, 0), segs=16, r2=0.3)
    h.rod((-0.4, 0.9, 1.72), (-0.4, 1.3, 2.4), 0.012, "metal", segs=5)
    h.sph(0.05, (0, 0.2, 1.9), "ship_nav_red", segs=8, rings=5)


def ship():
    """Rebuilds the rescue__hull mesh (bake sources on UVMap, an empty Atlas layer for the bakes)."""
    pipeline()
    M = _ship_materials()
    h = Mesh("rescue__hull_new")
    _ship_parts(h)
    new = h.finish(M, bpy.data.collections["DYNAMIC"])
    hull = bpy.data.objects["rescue__hull"]
    old, hull.data = hull.data, new.data
    bpy.data.objects.remove(new)
    bpy.data.meshes.remove(old)
    me = hull.data
    me.name = "rescue__hull"
    me.uv_layers.new(name="Atlas")
    me.uv_layers.active_index = me.uv_layers.find("Atlas")
    me.uv_layers[0].active_render = True
    L.select_only([hull])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=rad(66), island_margin=0.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    me.calc_loop_triangles()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    return {"triangles": len(me.loop_triangles), "min": co.min(axis=0).round(2).tolist(), "max": co.max(axis=0).round(2).tolist(), "materials": [m.name for m in me.materials]}


def _bake(obj, size, samples, **kw):
    img = bpy.data.images.new("_ship_bake", size, size, alpha=False, float_buffer=True)
    for m in obj.data.materials:
        node = m.node_tree.nodes["BAKE"]
        node.image = img
        m.node_tree.nodes.active = node
    L.select_only([obj])
    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(margin=8, use_clear=True, **kw)
    a = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(size, size, 4)[:, :, :3].copy()


def _save_srgb(rgb, path, quality=92):
    h, w, _ = rgb.shape
    px = np.ones((h, w, 4), dtype=np.float32)
    px[:, :, :3] = np.where(rgb <= 0.0031308, rgb * 12.92, 1.055 * np.maximum(rgb, 1e-8) ** (1 / 2.4) - 0.055)
    img = bpy.data.images.new("_ship_out", w, h, alpha=False)
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.file_format = "JPEG"
    img.save(quality=quality)
    bpy.data.images.remove(img)
    old = bpy.data.images.get(os.path.basename(path))
    if old is not None:
        old.reload()
        return old
    return L.load_image(path)


def bake_ship(size=1024, gain=1.0):
    """Bakes Rescue One's atlas: colour x ambient occlusion, and its own lamps and planet glow as emission.
    The game lights the craft with one directional light and no environment, so form has to be painted in."""
    B = pipeline()
    scene = bpy.context.scene
    root, hull = bpy.data.objects["rescue-one"], bpy.data.objects["rescue__hull"]
    me = hull.data
    assert me.uv_layers.get("UVMap") and me.uv_layers.get("Atlas"), "run ship() first"
    level = list(bpy.data.collections["LIGHTS"].objects)
    hidden = {o: o.hide_render for o in level}
    for o in level:
        o.hide_render = True
    root.hide_render = hull.hide_render = False
    B["setup_cycles"](64)
    scene.world.light_settings.distance = 1.6
    tmp = L.collection("_SHIPBAKE")
    sky = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")  # faint cool fill, shadow sides only just read
    rig = []
    for loc, color, watts in SHIP_LIGHTS:
        data = bpy.data.lights.new("_ship_light", "POINT")
        data.color, data.energy, data.shadow_soft_size = color, watts, 0.06
        rig.append(bpy.data.objects.new("_ship_light", data))
        rig[-1].location = root.location + Vector(loc)
    data = bpy.data.lights.new("_ship_planet", "SUN")  # glow of the rust world below, mostly from underneath
    data.color, data.energy, data.angle = (1.0, 0.36, 0.18), 0.6, rad(30)
    rig.append(bpy.data.objects.new("_ship_planet", data))
    rig[-1].rotation_euler = Vector((0.25, -0.25, 0.93)).to_track_quat("-Z", "Y").to_euler()
    for ob in rig:
        tmp.objects.link(ob)
    try:
        A = _bake(hull, size, 8, type="DIFFUSE", pass_filter={"COLOR"})
        O = _bake(hull, size, 96, type="AO")
        sky.inputs["Color"].default_value, sky.inputs["Strength"].default_value = (0.6, 0.75, 1.0, 1.0), 0.035
        S = _bake(hull, size, 256, type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"})
    finally:
        sky.inputs["Color"].default_value, sky.inputs["Strength"].default_value = (0.0, 0.0, 0.0, 1.0), 0.0
        for ob in rig:
            data = ob.data
            bpy.data.objects.remove(ob)
            bpy.data.lights.remove(data)
        bpy.data.collections.remove(tmp)
        for o, v in hidden.items():
            o.hide_render = v
        root.hide_render = hull.hide_render = True
        scene.cycles.samples = 96
    occ = np.clip(B["smooth"](O).mean(axis=2, keepdims=True), 0, 1)
    base = np.clip(A * (0.45 + 0.55 * occ ** 1.1), 0, 1)
    emit = np.clip(A * B["smooth"](S) * gain, 0, 1)
    images = {name: _save_srgb(rgb, os.path.join(TEX, name + ".jpg")) for name, rgb in (("rescue_base", base), ("rescue_emit", emit))}
    if bpy.data.materials.get("ship_body"):
        bpy.data.materials.remove(bpy.data.materials["ship_body"])
    body = bpy.data.materials.new("ship_body")
    nt, bsdf = L._principled(body)
    for name, sock in (("rescue_base", "Base Color"), ("rescue_emit", "Emission Color")):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = images[name]
        nt.links.new(t.outputs["Color"], bsdf.inputs[sock])
    bsdf.inputs["Emission Strength"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.62
    bsdf.inputs["Metallic"].default_value = 0.0
    old = list(me.materials)
    new = [body] + [m for m in old if not m.name.startswith("shipsrc_")]
    remap = np.array([0 if m.name.startswith("shipsrc_") else new.index(m) for m in old], dtype=np.int32)
    idx = np.empty(len(me.polygons), dtype=np.int32)
    me.polygons.foreach_get("material_index", idx)
    me.materials.clear()  # this also resets every face to slot 0, so indices are written afterwards
    for m in new:
        me.materials.append(m)
    me.polygons.foreach_set("material_index", remap[idx])
    me.uv_layers.remove(me.uv_layers["UVMap"])
    me.uv_layers[0].active_render = True
    me.update()
    lit = S[S.max(axis=2) > 0]
    return {"materials": [m.name for m in me.materials], "occlusion_mean": float(occ[occ > 0].mean()), "self_light_mean": [round(float(v), 4) for v in lit.mean(axis=0)], "self_light_p99": float(np.percentile(lit, 99)), "coverage": float((A.max(axis=2) > 0).mean())}


def export_ship():
    B = pipeline()
    root = bpy.data.objects["rescue-one"]
    saved = root.location.copy()
    root.location = (0, 0, 0)
    bpy.context.view_layer.update()
    try:
        return B["export_glb"](os.path.join(MODELS, "rescue-one.glb"), [root, *root.children_recursive], textures=True)
    finally:
        root.location = saved


def save(tag="r2"):
    """Saves the master scene and a versioned copy beside the other local backups."""
    for img in bpy.data.images:
        if img.filepath and not img.filepath.startswith("//"):
            try:
                img.filepath = bpy.path.relpath(img.filepath, start=BLEND_DIR)
            except ValueError:
                pass
    master = os.path.join(BLEND_DIR, "vorax_station.blend")
    bpy.ops.wm.save_as_mainfile(filepath=master, check_existing=False)
    copy = os.path.join(BLEND_DIR, "backups", "vorax_station_%s.blend" % tag)
    bpy.ops.wm.save_as_mainfile(filepath=copy, copy=True, check_existing=False)
    return {"master": os.path.getsize(master), "copy": copy}
