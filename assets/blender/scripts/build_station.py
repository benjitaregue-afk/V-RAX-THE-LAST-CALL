"""VØRAX: THE LAST SIGNAL — station build.

Builds the whole station from assets/blender/layout.json (exported from the game's own
collision layout), saves the editable scene to assets/blender/vorax_station.blend and writes:

  public/assets/models/environment.glb   static shell + set dressing, one object per zone,
                                         UV0 = tiling PBR, UV1 = lightmap
  public/assets/models/{door,arm,fan,relay,empty}.glb   animated parts for the game's slots
  public/assets/lightmaps/<zone>_{p,e}.jpg              baked lighting (1K, averaged from the bake): powered / emergency
  assets/blender/bake/<zone>_{p,e}_<size>.jpg           full-resolution bake masters (not served)
  public/assets/env/<zone>.hdr                          reflection probes
  assets/blender/preview/*.png                          Cycles previews

    blender --background --python assets/blender/scripts/build_station.py -- --bake --probes --preview

Options: --bake --probes --preview --zones=AIRLOCK,HUB --lm=2048 --samples=64
This script regenerates the scene from code. It never touches other .blend files.
"""

import json
import math
import os
import random
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import station_arch as A  # noqa: E402
import station_props as S  # noqa: E402
import vorax_lib as L  # noqa: E402
from vorax_lib import Mesh, P, T, plan_frame, rad  # noqa: E402

BLEND_DIR = os.path.dirname(HERE)
PROJECT = os.path.dirname(os.path.dirname(BLEND_DIR))
TEX_SRC = os.path.join(PROJECT, "assets", "textures", "polyhaven")
TEX_OUT = os.path.join(BLEND_DIR, "textures")
OUT_MODELS = os.path.join(PROJECT, "public", "assets", "models")
OUT_LM = os.path.join(PROJECT, "public", "assets", "lightmaps")
OUT_ENV = os.path.join(PROJECT, "public", "assets", "env")
PREVIEW = os.path.join(BLEND_DIR, "preview")
BAKE_MASTERS = os.path.join(BLEND_DIR, "bake")
BLEND_PATH = os.path.join(BLEND_DIR, "vorax_station.blend")
LAY = json.load(open(os.path.join(BLEND_DIR, "layout.json")))
ZONES = ["AIRLOCK", "HUB", "INSIGHT", "OPPORTUNITY", "RELAY", "OBSERVATION"]
CEIL = LAY["ceilH"]

ARGV = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OPT = {a[2:].split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in ARGV if a.startswith("--")}
BAKE_ZONES = OPT["zones"].split(",") if isinstance(OPT.get("zones"), str) else ZONES
LM_SIZE = int(OPT.get("lm", 2048))
SAMPLES = int(OPT.get("samples", 64))
LM_SCALE = 2.0  # lightmaps store irradiance / LM_SCALE, gamma 2.2 encoded

# emissive materials: (colour, strength in Blender, layer). P = main power, E = emergency / electronics.
EMIT = {
    "emit_main": ((1.0, 0.72, 0.44), 12.0, "P"),
    "emit_strip": ((1.0, 0.5, 0.17), 8.0, "P"),
    "emit_e": (None, 5.0, "E"),  # palette of small always-on lights: red, amber, cyan, green
    "screen_crt": ((0.16, 0.85, 0.3), 0.8, "E"),
    "screen_wave": ((0.15, 0.7, 0.8), 0.8, "E"),
    "screen_board": ((1.0, 0.55, 0.15), 0.5, "E"),
    "screen_term": ((0.3, 0.85, 0.9), 1.0, "E"),
}
FLAT = {  # name: (linear rgb, metallic, roughness) -> one shared "flat" material
    "steel": ((0.36, 0.38, 0.39), 0.9, 0.52),
    "gold": ((0.55, 0.4, 0.12), 1.0, 0.36),
    "solar": ((0.02, 0.035, 0.09), 0.6, 0.25),
    "cavity": ((0.012, 0.014, 0.016), 0.0, 0.9),
    "rubber": ((0.02, 0.02, 0.022), 0.0, 0.75),
    "hazard": ((0.36, 0.2, 0.03), 0.1, 0.65),
    "paint_red": ((0.28, 0.035, 0.025), 0.1, 0.55),
    "paint_white": ((0.3, 0.3, 0.27), 0.0, 0.7),
    "rock": ((0.42, 0.24, 0.16), 0.0, 0.95),
    "rock_dark": ((0.17, 0.09, 0.065), 0.0, 0.95),
    "spherule": ((0.2, 0.24, 0.3), 0.1, 0.5),
}
GLOW = {"emit_red": (1.0, 0.06, 0.03), "emit_amber": (1.0, 0.58, 0.16), "emit_cyan": (0.22, 0.9, 0.95), "emit_green": (0.22, 1.0, 0.34)}
DETAIL_MATS = ("emit_main", "emit_strip", "emit_e", "screen_crt", "screen_wave", "screen_board", "screen_term", "glass")
DAMAGE = {"AIRLOCK": 0.5, "HUB": 0.32, "INSIGHT": 0.45, "OPPORTUNITY": 0.36, "RELAY": 0.3, "OBSERVATION": 0.15}
# hand-authored bays for hero walls; everything else is chosen procedurally
PLAN = {
    "wall-AIRLOCK-E0": ["damaged", "board", "light"],
    "wall-AIRLOCK-W0": ["pipes", "console", "plates"],
    "wall-AIRLOCK-N0": ["light"],
    "wall-AIRLOCK-N1": ["screen"],
    "wall-AIRLOCK-S0": ["vent", "plates", "vent"],
    # None = decide procedurally (for example behind a rack)
    "wall-INSIGHT-W0": ["seismo", "light", "seismo", None],
    "wall-INSIGHT-S0": ["pipes", "seismo", "light", "vent"],
    "wall-INSIGHT-N0": [None, "seismo", None, "light"],
    "wall-OPPORTUNITY-E0": ["archive", "light", "archive", None],
    "wall-OPPORTUNITY-S0": ["vent", "light", "archive", "pipes"],
    "wall-OPPORTUNITY-N0": ["light", None, "archive", None],
}
PORTAL_TEXT = {"D0": ("D0  ARCHIVE", "BULKHEAD 00"), "D1": ("D1  WITNESS IN STONE", "EAST WING"), "D2": ("D2  RELAY", "NORTH"), "ARCH_W": ("LISTENING STATION", "WEST WING")}


def log(*a):
    print("[station]", *a, flush=True)


# ---------------------------------------------------------------- materials


def build_materials():
    os.makedirs(TEX_OUT, exist_ok=True)
    src = lambda i, m: os.path.join(TEX_SRC, i, "%s_%s_1k.jpg" % (i, m))
    graded = lambda i, name, **kw: L.grade_image(src(i, "diff"), os.path.join(TEX_OUT, name + "_base.jpg"), **kw)
    M = {}
    M["wall"] = L.pbr_material("wall", graded("blue_metal_plate", "wall", sat=0.3, val=0.72, tint=(0.94, 1.0, 1.02)), src("blue_metal_plate", "nor_gl"), src("blue_metal_plate", "arm"), 2.5)
    M["floor"] = L.pbr_material("floor", graded("metal_plate", "floor", sat=0.5, val=0.7), src("metal_plate", "nor_gl"), src("metal_plate", "arm"), 1.0, rough_scale=0.85)
    M["grate"] = L.pbr_material("grate", graded("metal_grate_rusty", "grate", sat=0.4, val=0.42), src("metal_grate_rusty", "nor_gl"), src("metal_grate_rusty", "arm"), 0.8)
    M["struct"] = L.pbr_material("struct", graded("metal_plate_02", "struct", sat=0.6, val=0.5), src("metal_plate_02", "nor_gl"), src("metal_plate_02", "arm"), 2.0)
    M["equip"] = L.pbr_material("equip", graded("rusty_metal_02", "equip", sat=0.5, val=0.34), src("rusty_metal_02", "nor_gl"), src("rusty_metal_02", "arm"), 1.2)
    M["machine"] = L.pbr_material("machine", graded("green_metal_rust", "machine", sat=0.5, val=0.5), src("green_metal_rust", "nor_gl"), src("green_metal_rust", "arm"), 1.2)
    M["crate"] = L.pbr_material("crate", graded("container_side", "crate", mono_tint=(0.27, 0.15, 0.06)), src("container_side", "nor_gl"), src("container_side", "arm"), 1.4)
    L.register_palette("flat", list(FLAT))
    L.register_palette("emit_e", list(GLOW))
    pal = lambda n: os.path.join(TEX_OUT, n)
    M["flat"] = bpy.data.materials.new("flat")
    nt, bsdf = L._principled(M["flat"])
    tb, to = nt.nodes.new("ShaderNodeTexImage"), nt.nodes.new("ShaderNodeTexImage")
    tb.image = L.write_palette(pal("pal_flat_base.png"), [L.srgb(v[0]) for v in FLAT.values()])
    to.image = L.write_palette(pal("pal_flat_orm.png"), [(1.0, v[2], v[1]) for v in FLAT.values()], non_color=True)
    tb.interpolation = to.interpolation = "Closest"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tb.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(to.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
    M["emit_e"] = bpy.data.materials.new("emit_e")
    nt, bsdf = L._principled(M["emit_e"])
    te = nt.nodes.new("ShaderNodeTexImage")
    te.image = L.write_palette(pal("pal_emit.png"), [L.srgb(v) for v in GLOW.values()])
    te.interpolation = "Closest"
    bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)
    nt.links.new(te.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = EMIT["emit_e"][1]
    M["glass"] = L.flat_material("glass", (0.02, 0.03, 0.035), rough=0.08, alpha=0.3)
    for name, (color, strength, _group) in EMIT.items():
        if color is not None:
            M[name] = L.flat_material(name, (0.02, 0.02, 0.02), rough=0.5, emit=color, strength=strength)
    # flat stand-ins for animated parts: the game swaps "ref_x" for the textured "x"
    for name, rgb, metal in (("struct", (0.1, 0.09, 0.08), 0.5), ("equip", (0.45, 0.42, 0.36), 0.3), ("wall", (0.16, 0.2, 0.22), 0.4), ("machine", (0.17, 0.24, 0.14), 0.3)):
        M["ref_" + name] = L.flat_material("ref_" + name, rgb, metallic=metal, rough=0.6)
    M["ship_hull"] = L.flat_material("ship_hull", (0.5, 0.52, 0.55), metallic=0.35, rough=0.45)
    M["ship_dark"] = L.flat_material("ship_dark", (0.05, 0.055, 0.065), metallic=0.5, rough=0.5)
    M["ship_glass"] = L.flat_material("ship_glass", (0.02, 0.04, 0.09), metallic=0.9, rough=0.12)
    M["ship_glow"] = L.flat_material("ship_glow", (0.02, 0.02, 0.02), emit=(0.45, 0.78, 1.0), strength=6.0)
    M["ship_lens"] = L.flat_material("ship_lens", (0.02, 0.02, 0.02), emit=(1.0, 0.95, 0.8), strength=8.0)
    M["ship_nav_red"] = L.flat_material("ship_nav_red", (0.02, 0.02, 0.02), emit=(1.0, 0.08, 0.05), strength=6.0)
    M["ship_nav_green"] = L.flat_material("ship_nav_green", (0.02, 0.02, 0.02), emit=(0.1, 1.0, 0.3), strength=6.0)
    M["dyn_status"] = L.flat_material("dyn_status", (0.03, 0.02, 0.01), emit=(1.0, 0.25, 0.05), strength=4.0)
    M["dyn_core"] = L.flat_material("dyn_core", (0.03, 0.02, 0.01), emit=(1.0, 0.6, 0.18), strength=6.0)
    return M


# ---------------------------------------------------------------- assembly


class Ctx:
    t = LAY["wallT"] / 2
    damage = 0.3
    custom = S.HERO_BAYS
    lay = LAY

    def __init__(self):
        self.blockers = [(p["x"], p["z"]) for p in LAY["placements"] if p["colliders"]]
        self.index = {w["id"]: i for i, w in enumerate(LAY["walls"])}

    def rng(self, *key):
        return random.Random("|".join(map(str, key)))

    def screen(self, rng):
        return rng.choice(("screen_crt", "screen_wave", "screen_crt"))

    def pick(self, w, i, cmid, cw, rect):
        plan = PLAN.get(w["id"])
        if plan and i < len(plan) and plan[i]:
            return plan[i]
        if rect["kind"] != "room" or cw < 0.9:
            return "plates"
        t = self.t + 0.6
        gx, gz = {"N": (cmid, w["z"] - t), "S": (cmid, w["z"] + t), "E": (w["x"] - t, cmid), "W": (w["x"] + t, cmid)}[w["side"]]
        if any(math.hypot(px - gx, pz - gz) < 1.05 for px, pz in self.blockers):
            return "plates"
        if (i + self.index[w["id"]]) % 3 == 1:
            return "light"
        r = self.rng(w["id"], i, "kind").random()
        for kind, weight in (("pipes", 0.22), ("vent", 0.15), ("locker", 0.16), ("screen", 0.1), ("damaged", 0.3 * self.damage)):
            if r < weight:
                return kind
            r -= weight
        return "plates"


def connector_headers(z, rect):
    """A deep header across each connector mouth, above head height, closing the wall line."""
    W, D = rect["x1"] - rect["x0"], rect["z1"] - rect["z0"]
    cx, cz = (rect["x0"] + rect["x1"]) / 2, (rect["z0"] + rect["z1"]) / 2
    ends = [(cx, rect["z0"] + 0.15, 0.0), (cx, rect["z1"] - 0.15, 0.0)] if rect["id"] in ("CONN_S", "CONN_N", "CONN_DECK") else [(rect["x0"] + 0.15, cz, math.pi / 2), (rect["x1"] - 0.15, cz, math.pi / 2)]
    span = W if ends[0][2] == 0.0 else D
    for x, zz, yaw in ends:
        z.push(plan_frame(x, zz, yaw))
        z.box((span, 0.3, 0.76), (0, 0, CEIL - 0.38), "struct", bevel=0.02)
        z.box((span, 0.34, 0.06), (0, 0, CEIL - 0.79), "steel")
        for sx in (-1, 1):
            z.box((0.2, 0.32, CEIL - 0.8), (sx * (span / 2 - 0.1), 0, (CEIL - 0.8) / 2), "struct", bevel=0.02)
        z.pop()


def observation_window(z):
    """Frame, sill and mullions for the observation window (north plane z=29.98, 10.5 x 2.55 m)."""
    z.push(plan_frame(0, 30.0, math.pi))
    z.box((12.0, 0.4, 0.375), (0, -0.2, 0.1875), "struct", bevel=0.02)
    z.box((12.0, 0.46, 0.06), (0, -0.23, 0.4), "steel")
    z.box((12.0, 0.4, CEIL - 2.925), (0, -0.2, (CEIL + 2.925) / 2), "struct", bevel=0.02)
    for sx in (-1, 1):
        z.box((0.75, 0.4, 2.55), (sx * 5.625, -0.2, 1.65), "struct", bevel=0.02)
    for k in range(-3, 4):
        z.box((0.09, 0.2, 2.55), (k * 1.5, -0.1, 1.65), "steel", bevel=0.01)
    z.box((10.5, 0.12, 0.07), (0, -0.06, 1.65), "steel")
    z.pop()


def dress_airlock(z, ctx):
    rng = ctx.rng("airlock-dressing")
    z.push(T(P(0, -3.15, 0.006), (0, 0, math.pi)))
    z.text("AIRLOCK 01", 0.3, mat="paint_white")
    z.text("EMERGENCY BUS  >", 0.11, at=(0.35, -0.34, 0), mat="hazard")
    z.pop()
    for k in range(9):  # debris near the walls, never on the walking line
        x = rng.choice((-1, 1)) * rng.uniform(1.7, 2.45)
        zz = rng.uniform(-7.4, -2.6)
        z.push(T(P(x, zz, 0.012), (rad(rng.uniform(-6, 6)), rad(rng.uniform(-6, 6)), rad(rng.uniform(0, 360)))))
        if k % 3 == 0:
            z.box((0.42, 0.3, 0.02), mat="wall")
        elif k % 3 == 1:
            z.box((0.21, 0.3, 0.003), mat="paint_white")
        else:
            z.box((0.16, 0.1, 0.05), mat="equip")
        z.pop()
    z.push(T(P(1.9, -7.0, 0)))  # ceiling bundle hanging low in the south-east corner, above head height
    for k in range(5):
        z.cable((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), CEIL - 0.05), (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), CEIL - rng.uniform(0.6, 1.05)), 0.0, 0.014, rng.choice(("rubber", "hazard", "rubber")))
    z.box((0.9, 0.7, 0.03), (0.1, 0.1, CEIL - 0.52), "struct", rot=(rad(24), rad(-12), rad(15)))
    z.pop()


def add_view_cameras():
    """Eye-level cameras at every checkpoint, so the scene can be inspected with Numpad 0 in Blender."""
    coll = L.collection("VIEWS")
    for zone, sp in LAY["safePoints"].items():
        data = bpy.data.cameras.new("VIEW_" + zone)
        data.sensor_fit = "VERTICAL"
        data.angle_y = rad(75)
        data.clip_start = 0.05
        cam = bpy.data.objects.new("VIEW_" + zone, data)
        coll.objects.link(cam)
        cam.location = P(sp["x"], sp["z"], LAY["eyeH"])
        cam.rotation_euler = (rad(90), 0, rad(180) - sp["yaw"])
    bpy.context.scene.camera = bpy.data.objects["VIEW_AIRLOCK"]


def build_environment(mats):
    zm = {zone: Mesh("ENV_" + zone) for zone in ZONES}
    rects = {r["id"]: r for r in LAY["rects"]}
    ctx = Ctx()
    for r in LAY["rects"]:
        z = zm[r["zone"]]
        ctx.damage = DAMAGE[r["zone"]]
        A.floor(z, r)
        A.ceiling(z, r, ctx.rng("ceiling", r["id"]), ctx.damage)
        if r["kind"] == "room":
            A.corner_posts(z, r)
        else:
            connector_headers(z, r)
    for w in LAY["walls"]:
        if w["id"].startswith("wall-OBSERVATION-N"):
            continue
        ctx.damage = DAMAGE[w["zone"]]
        A.wall(zm[w["zone"]], w, rects[w["rect"]], ctx)
    for d in LAY["doors"]:
        A.portal(zm["HUB"], d["x"], d["z"], d["yaw"], *PORTAL_TEXT[d["id"]], ctx.rng(d["id"]))
    for f in LAY["frames"]:
        if f["sealed"]:
            A.exterior_lock(zm["AIRLOCK"], f["x"], f["z"], f["yaw"])
        else:
            A.portal(zm["HUB"], f["x"], f["z"], f["yaw"], *PORTAL_TEXT[f["id"]], ctx.rng(f["id"]))
    for s in LAY["signs"]:
        if s["id"] != "sign-controls":  # the controls reminder lives on a console screen instead
            A.sign(zm[s["zone"]], s)
    for p in LAY["placements"]:
        fn = S.OVERRIDES.get(p["id"]) or S.PROPS.get(p["model"])
        if fn is None:
            continue
        z = zm[p["zone"]]
        ctx.damage = DAMAGE[p["zone"]]
        z.push(plan_frame(p["x"], p["z"], p["yaw"], p["y"]))
        fn(z, ctx.rng(p["id"]), ctx)
        z.pop()
    observation_window(zm["OBSERVATION"])
    dress_airlock(zm["AIRLOCK"], ctx)
    S.hub_centre(zm["HUB"], ctx)
    S.deck_dressing(zm["OBSERVATION"], ctx)
    # cold light from outside the observation window: always on, it is not ship power
    zm["OBSERVATION"].lights.append((T(P(0, 29.55, 1.65), (rad(90), 0, 0)), 10.0, 2.4, (0.5, 0.68, 1.0), 300.0, "E"))
    coll = L.collection("ENV")
    objs, details = {}, {}
    for z in zm.values():
        for entry in z.lights:
            add_area(entry)
    for zone, z in zm.items():
        tris = z.tris()
        objs[zone], details[zone] = z.finish_split(mats, coll, "DET_" + zone, detail_mats=DETAIL_MATS)
        log("zone %-12s %7d tris: %d lightmapped faces, %d detail faces, %d materials" % (zone, tris, len(objs[zone].data.polygons), len(details[zone].data.polygons), len(z.mats)))
    return objs, details


# ---------------------------------------------------------------- animated parts (game slots)


def empty(name, parent, coll, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    coll.objects.link(ob)
    ob.parent = parent
    ob.location = loc
    return ob


def build_dynamic(mats):
    coll = L.collection("DYNAMIC")
    roots = {}

    def root(name, x):
        ob = bpy.data.objects.new(name, None)
        coll.objects.link(ob)
        ob.location = (x, 14.0, 0)  # parked beside the level, out of every bake
        roots[name] = ob
        return ob

    def part(mesh, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
        ob = mesh.finish(mats, coll)
        ob.parent = parent
        ob.location = loc
        ob.rotation_euler = rot
        return ob

    # door: marker empties carry the game's open/closed state; panels slide in the engine
    door = root("door", 0)
    for name, sx in (("L", -1), ("R", 1)):
        empty("door__leaf_" + name, door, coll)
        m = Mesh("door__panel_" + name)
        m.box((0.995, 0.14, 2.48), (sx * 0.5, 0, 1.25), "ref_wall", bevel=0.012)
        m.box((0.7, 0.18, 0.86), (sx * 0.52, 0, 1.86), "ref_struct", bevel=0.02)
        m.box((0.7, 0.18, 0.86), (sx * 0.52, 0, 0.62), "ref_struct", bevel=0.02)
        m.box((0.995, 0.2, 0.12), (sx * 0.5, 0, 1.25), "steel", bevel=0.012)
        m.box((0.06, 0.19, 2.42), (sx * 0.035, 0, 1.25), "hazard", bevel=0.006)
        for k in range(4):
            m.box((0.5, 0.19, 0.035), (sx * 0.52, 0, 1.6 + k * 0.17), "cavity")
            m.box((0.34, 0.2, 0.05), (sx * 0.52, 0, 0.32 + k * 0.2), "steel", rot=(0, rad(sx * 30), 0))
        for sy in (-1, 1):
            m.cyl(0.05, 0.03, (sx * 0.86, sy * 0.085, 1.25), "steel", rot=(rad(90), 0, 0), segs=10)
        part(m, door)
    st = Mesh("door__status")
    for sy in (-1, 1):
        st.box((0.9, 0.03, 0.05), (0, sy * 0.292, 2.6), "dyn_status")
    part(st, door)

    arm = root("arm", 4)
    a = Mesh("arm__arm")
    from mathutils import Vector

    shoulder, elbow, wrist = Vector((0, 0, 0)), Vector((0.52, 0, -0.68)), Vector((0.18, 0, -1.34))
    a.cyl(0.1, 0.18, shoulder, "steel", rot=(rad(90), 0, 0), segs=14)
    a.beam(shoulder, elbow, 0.11, 0.11, "ref_equip", bevel=0.015)
    a.cyl(0.085, 0.16, elbow, "steel", rot=(rad(90), 0, 0), segs=14)
    a.beam(elbow, wrist, 0.085, 0.085, "ref_machine", bevel=0.012)
    a.sph(0.07, wrist, "steel", segs=12, rings=7)
    for sy in (-1, 1):
        a.beam(wrist + Vector((0, sy * 0.035, -0.02)), wrist + Vector((-0.05, sy * 0.075, -0.24)), 0.028, 0.028, "ref_struct")
    a.rod(shoulder + Vector((0.02, 0.075, -0.05)), elbow + Vector((-0.02, 0.07, 0.04)), 0.018, "rubber", segs=6)
    a.rod(elbow + Vector((0.0, 0.06, -0.04)), wrist + Vector((0.02, 0.055, 0.06)), 0.015, "rubber", segs=6)
    a.box((0.03, 0.02, 0.03), wrist + Vector((0.03, 0, 0.09)), "emit_red")
    part(a, arm, loc=(0, 0, -0.3))

    fan = root("fan", 8)
    b = Mesh("fan__blades")
    b.cyl(0.11, 0.12, (0, 0, 0), "ref_machine", rot=(rad(90), 0, 0), segs=14)
    from mathutils import Matrix

    for k in range(5):
        b.box((0.44, 0.012, 0.17), mat="ref_equip", bevel=0.004, M=Matrix.Rotation(rad(k * 72), 4, "Y") @ T((0.33, 0, 0)) @ Matrix.Rotation(rad(28), 4, "X"))
    part(b, fan, loc=(0, -0.07, 0))

    relay = root("relay", 12)
    core = Mesh("relay__core")
    core.sph(0.25, (0, 0, 0), "dyn_core", segs=20, rings=12)
    part(core, relay, loc=(0, 0, 1.45))
    ring = Mesh("relay__ring")
    ring.tor(0.78, 0.032, mat="steel", major=36, minor=8)
    for ang in (0, 90, 180, 270):
        ring.box((0.09, 0.09, 0.09), (0.78 * math.cos(rad(ang)), 0.78 * math.sin(rad(ang)), 0), "ref_equip", bevel=0.012)
    part(ring, relay, loc=(0, 0, 1.45), rot=(rad(24), 0, 0))
    ring2 = Mesh("relay__ring2")
    ring2.tor(0.6, 0.026, mat="steel", major=32, minor=8)
    for ang in (60, 180, 300):
        ring2.box((0.07, 0.07, 0.07), (0.6 * math.cos(rad(ang)), 0.6 * math.sin(rad(ang)), 0), "hazard", bevel=0.01)
    part(ring2, relay, loc=(0, 0, 1.45), rot=(rad(-34), rad(18), 0))

    # Rescue One: fictional rescue craft seen through the observation window. Front faces -Y.
    ship = root("rescue-one", 22)
    h = Mesh("rescue__hull")
    h.box((2.3, 5.2, 1.5), (0, 0, 1.0), "ship_hull", bevel=0.28)
    h.prism([(-1.0, -2.6), (1.0, -2.6), (0.45, -4.3), (-0.45, -4.3)], 0.45, 1.35, "ship_hull")
    h.sph(0.72, (0, -2.35, 1.55), "ship_glass", segs=16, rings=8, scale=(1.05, 1.5, 0.62))
    h.box((1.5, 2.6, 0.25), (0, 0.2, 0.2), "ship_dark", bevel=0.05)
    for sx in (-1, 1):
        h.cyl(0.52, 3.6, (sx * 1.75, 0.5, 0.95), "ship_dark", rot=(rad(90), 0, 0), segs=16)
        h.cyl(0.4, 0.3, (sx * 1.75, 2.36, 0.95), "ship_glow", rot=(rad(90), 0, 0), segs=16)
        h.cyl(0.56, 0.12, (sx * 1.75, -1.32, 0.95), "ship_hull", rot=(rad(90), 0, 0), segs=16)
        h.box((0.9, 1.2, 0.2), (sx * 1.2, 0.3, 1.0), "ship_hull")
        h.prism([(sx * 2.2, -0.6), (sx * 4.6, 0.5), (sx * 4.6, 1.3), (sx * 2.2, 1.6)], 0.92, 1.04, "ship_hull")
        h.box((0.12, 1.0, 0.7), (sx * 4.6, 0.9, 1.3), "ship_dark", bevel=0.03)
        h.box((0.14, 0.14, 0.08), (sx * 4.6, 0.4, 1.7), "ship_nav_red" if sx < 0 else "ship_nav_green")
        h.box((0.5, 0.9, 0.04), (sx * 0.7, 0.9, 1.76), "ship_dark")
        h.box((0.2, 0.4, 0.14), (sx * 0.95, -1.6, 0.5), "ship_dark", bevel=0.02)
        h.push(T((sx * 1.16, 0.3, 1.1), (rad(90), 0, rad(90 * sx))))
        h.text("RESCUE ONE", 0.3, mat="ship_dark")
        h.pop()
    h.cyl(0.24, 0.3, (0, -2.5, 0.72), "ship_dark", rot=(rad(90), 0, 0), segs=14)
    h.cyl(0.19, 0.06, (0, -2.68, 0.72), "ship_lens", rot=(rad(90), 0, 0), segs=14)
    h.rod((0.4, 1.2, 1.75), (0.4, 1.9, 2.5), 0.02, "ship_dark", segs=5)
    h.box((0.6, 0.04, 0.5), (0, 2.2, 1.9), "ship_hull", rot=(rad(-25), 0, 0))
    part(h, ship)

    nothing = root("empty", 16)
    empty("empty__marker", nothing, coll)
    return roots


def export_glb(path, objs, textures=True):
    L.select_only(objs)
    kw = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=False, export_yup=True, export_cameras=False, export_lights=False, export_animations=False, export_extras=False, export_tangents=False)
    try:
        bpy.ops.export_scene.gltf(**kw, export_image_format="WEBP" if textures else "AUTO", export_image_quality=84)
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    return os.path.getsize(path)


def export_dynamic(name, root):
    saved = root.location.copy()
    root.location = (0, 0, 0)
    bpy.context.view_layer.update()
    size = export_glb(os.path.join(OUT_MODELS, name + ".glb"), [root, *root.children_recursive], textures=False)
    root.location = saved
    return size


# ---------------------------------------------------------------- baked lighting


BAKE_LIGHTS = {"P": [], "E": []}


def add_light(layer, x, z, h, color, watts, radius=0.08):
    data = bpy.data.lights.new("light_%s_%d" % (layer, len(BAKE_LIGHTS[layer])), "POINT")
    data.color = color
    data.energy = watts
    data.shadow_soft_size = radius
    ob = bpy.data.objects.new(data.name, data)
    L.collection("LIGHTS").objects.link(ob)
    ob.location = P(x, z, h)
    BAKE_LIGHTS[layer].append(ob)
    return ob


def add_area(entry):
    M, w, h, color, watts, layer = entry
    data = bpy.data.lights.new("area_%s_%d" % (layer, len(BAKE_LIGHTS[layer])), "AREA")
    data.shape = "RECTANGLE"
    data.size, data.size_y = w, h
    data.color = color
    data.energy = watts
    ob = bpy.data.objects.new(data.name, data)
    L.collection("LIGHTS").objects.link(ob)
    ob.matrix_world = M
    ob.visible_camera = False
    BAKE_LIGHTS[layer].append(ob)


def set_layer(mats, layer, bake=False):
    """layer: 'P' main power, 'E' emergency, or 'ALL'. While baking, the explicit lights carry the
    energy and glowing surfaces are dimmed: small emitters behind louvres only add noise."""
    for name, (_c, strength, group) in EMIT.items():
        L.set_emission(mats[name], (strength * (0.06 if bake else 1.0)) if layer in ("ALL", group) else 0.0)
    for group, lights in BAKE_LIGHTS.items():
        for ob in lights:
            ob.hide_render = layer not in ("ALL", group)


def setup_cycles(samples):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    devices = L.use_gpu()
    c = scene.cycles
    c.samples = samples
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02
    c.use_denoising = True
    c.max_bounces = 6
    c.diffuse_bounces = 3
    c.glossy_bounces = 2
    c.sample_clamp_indirect = 6.0
    c.caustics_reflective = False
    c.caustics_refractive = False
    scene.view_settings.view_transform = "Standard"
    scene.world = scene.world or bpy.data.worlds.new("World")
    scene.world.color = (0.0, 0.0, 0.0)
    return devices


def smooth(rgb, passes=2):
    """Coverage-aware 3x3 blur: evens out texel noise without pulling black from unbaked texels."""
    mask = (rgb.max(axis=2, keepdims=True) > 0).astype(np.float32)
    acc = rgb * mask
    for _ in range(passes):
        a = np.pad(acc, ((1, 1), (1, 1), (0, 0)), mode="edge")
        m = np.pad(mask, ((1, 1), (1, 1), (0, 0)), mode="edge")
        h, w = rgb.shape[:2]
        sa = sum(a[i : i + h, j : j + w] for i in range(3) for j in range(3))
        sm = sum(m[i : i + h, j : j + w] for i in range(3) for j in range(3))
        acc = np.where(sm > 0, sa / np.maximum(sm, 1e-6), 0.0) * (sm > 0)
        mask = (sm > 0).astype(np.float32)
    return acc


def save_encoded(rgb, path, quality=88):
    h, w, _ = rgb.shape
    enc = np.clip(rgb / LM_SCALE, 0.0, 1.0) ** (1 / 2.2)
    px = np.ones((h, w, 4), dtype=np.float32)
    px[:, :, :3] = enc
    img = bpy.data.images.new("_lm_out", w, h, alpha=False)
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.file_format = "JPEG"
    img.save(quality=quality)
    bpy.data.images.remove(img)
    return os.path.getsize(path)


def bake_zone(obj, zone, mats):
    os.makedirs(OUT_LM, exist_ok=True)
    obj.data.uv_layers.active_index = obj.data.uv_layers.find("Lightmap")
    assert obj.data.uv_layers.active.name == "Lightmap" and obj.data.uv_layers[0].active_render
    out = {}
    for layer in ("P", "E"):
        set_layer(mats, layer, bake=True)
        img = bpy.data.images.new("LM_%s_%s" % (zone, layer), LM_SIZE, LM_SIZE, alpha=False, float_buffer=True)
        for m in obj.data.materials:
            node = m.node_tree.nodes["BAKE"]
            node.image = img
            m.node_tree.nodes.active = node
        L.select_only([obj])
        t0 = time.time()
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)
        a = np.empty(LM_SIZE * LM_SIZE * 4, dtype=np.float32)
        img.pixels.foreach_get(a)
        rgb = smooth(a.reshape(LM_SIZE, LM_SIZE, 4)[:, :, :3])
        # The game ships the 2x2-averaged map (1K from a 2K bake); the full master stays with the sources.
        os.makedirs(BAKE_MASTERS, exist_ok=True)
        save_encoded(rgb, os.path.join(BAKE_MASTERS, "%s_%s_%d.jpg" % (zone.lower(), layer.lower(), LM_SIZE)), quality=92)
        half = rgb.reshape(LM_SIZE // 2, 2, LM_SIZE // 2, 2, 3).mean(axis=(1, 3))
        size = save_encoded(half, os.path.join(OUT_LM, "%s_%s.jpg" % (zone.lower(), layer.lower())), quality=90)
        lit = rgb[rgb.max(axis=2) > 0]
        out[layer] = {"seconds": round(time.time() - t0, 1), "bytes": size, "mean": float(rgb.mean()), "p99": float(np.percentile(rgb, 99)), "lit_mean": [round(float(v), 5) for v in lit.mean(axis=0)]}
        bpy.data.images.remove(img)
        log("baked %s %s" % (zone, layer), out[layer])
    set_layer(mats, "ALL")
    return out


def render_probe(zone, x, z, mats):
    os.makedirs(OUT_ENV, exist_ok=True)
    scene = bpy.context.scene
    set_layer(mats, "ALL")
    data = bpy.data.cameras.new("probe_" + zone)
    data.type = "PANO"
    data.panorama_type = "EQUIRECTANGULAR"
    data.clip_start = 0.05
    cam = bpy.data.objects.new("probe_" + zone, data)
    L.collection("PROBES").objects.link(cam)
    cam.location = P(x, z, 1.5)
    cam.rotation_euler = (rad(90), 0, rad(180))  # looks along game +Z (north)
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 512, 256, 100
    scene.render.image_settings.file_format = "HDR"
    scene.render.filepath = os.path.join(OUT_ENV, zone.lower() + ".hdr")
    bpy.ops.render.render(write_still=True)
    return os.path.getsize(scene.render.filepath)


def render_preview(name, x, z, yaw, mats, layer="ALL", pitch=0.0, fov=75.0):
    os.makedirs(PREVIEW, exist_ok=True)
    scene = bpy.context.scene
    set_layer(mats, layer)
    data = bpy.data.cameras.new("preview_" + name)
    data.sensor_fit = "VERTICAL"
    data.angle_y = rad(fov)
    data.clip_start = 0.05
    cam = bpy.data.objects.new("preview_" + name, data)
    L.collection("PREVIEW").objects.link(cam)
    cam.location = P(x, z, LAY["eyeH"])
    cam.rotation_euler = (rad(90) - pitch, 0, rad(180) - yaw)
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 960, 540, 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = 1.2
    scene.render.filepath = os.path.join(PREVIEW, name + ".png")
    bpy.ops.render.render(write_still=True)
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = 0.0
    set_layer(mats, "ALL")


# ---------------------------------------------------------------- main


def main():
    t0 = time.time()
    report = {"options": OPT}
    L.purge_all()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    mats = build_materials()
    env, details = build_environment(mats)
    dyn = build_dynamic(mats)
    add_view_cameras()
    for f in LAY["frames"]:  # red beacons beside the sealed exterior lock
        if f["sealed"]:
            for sx in (-1.28, 1.28):
                add_light("E", f["x"] + sx, f["z"] + 0.42, 2.46, (1.0, 0.07, 0.03), 14.0)
    bpy.context.view_layer.update()
    report["triangles"] = {}
    for zone, obj in env.items():
        for ob in (obj, details[zone]):
            ob.data.calc_loop_triangles()
        report["triangles"][zone] = [len(obj.data.loop_triangles), len(details[zone].data.loop_triangles)]
        L.unwrap_lightmap(obj)
    log("built + unwrapped in %.1fs" % (time.time() - t0))
    for img in bpy.data.images:
        if img.filepath and not img.filepath.startswith("//"):
            try:
                img.filepath = bpy.path.relpath(img.filepath, start=BLEND_DIR)
            except ValueError:
                pass
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH, check_existing=False)
    os.makedirs(OUT_MODELS, exist_ok=True)
    set_layer(mats, "ALL")
    report["glb"] = {"environment": export_glb(os.path.join(OUT_MODELS, "environment.glb"), [*env.values(), *details.values()])}
    for name, root in dyn.items():
        report["glb"][name] = export_dynamic(name, root)
    log("exported", report["glb"])
    if OPT.get("bake") or OPT.get("probes") or OPT.get("preview"):
        report["devices"] = setup_cycles(SAMPLES)
        for root in dyn.values():  # animated parts never take part in baking
            for ob in [root, *root.children_recursive]:
                ob.hide_render = True
    if OPT.get("preview"):
        sp = LAY["safePoints"]["AIRLOCK"]
        render_preview("airlock_spawn_power", sp["x"], sp["z"], sp["yaw"], mats, "ALL")
        render_preview("airlock_spawn_emergency", sp["x"], sp["z"], sp["yaw"], mats, "E")
        render_preview("airlock_console", 0.6, -4.6, -math.pi / 2, mats, "ALL")
        render_preview("airlock_lock", 0.0, -3.4, math.pi, mats, "E")
        render_preview("hub_from_door", 0.0, 0.6, 0.0, mats, "ALL")
    if OPT.get("bake"):
        report["bake"] = {}
        for zone in BAKE_ZONES:
            report["bake"][zone] = bake_zone(env[zone], zone, mats)
        stats_path = os.path.join(PROJECT, "src", "content", "lightmap-stats.json")
        stats = json.load(open(stats_path)) if os.path.exists(stats_path) else {}
        for zone, layers in report["bake"].items():
            stats[zone] = {"p": layers["P"]["lit_mean"], "e": layers["E"]["lit_mean"]}
        with open(stats_path, "w") as fh:
            json.dump(stats, fh, indent=1)
            fh.write("\n")
    if OPT.get("probes"):
        report["probes"] = {}
        for zone in BAKE_ZONES:
            sp = LAY["safePoints"][zone]
            report["probes"][zone] = render_probe(zone, sp["x"], sp["z"], mats)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH, check_existing=False)
    report["seconds"] = round(time.time() - t0, 1)
    with open(os.path.join(BLEND_DIR, "build_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
    log("done", json.dumps(report))
    return report


RESULT = main()
