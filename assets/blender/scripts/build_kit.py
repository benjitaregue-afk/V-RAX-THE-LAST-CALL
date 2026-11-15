"""VØRAX: THE LAST SIGNAL — 3D asset kit.

Builds every prop procedurally, saves the editable scene to assets/blender/vorax_kit.blend
and exports one optimized GLB per prop to public/assets/models/.

    blender --background assets/blender/vorax_kit.blend --python assets/blender/scripts/build_kit.py

Conventions
  * Metres, Z up, the front of a prop faces -Y. glTF export converts to +Y up.
  * One shared material ("kit") that samples three tiny palette textures, so each prop
    costs one draw call. Faces pick a colour by pointing their UVs at a palette swatch.
  * Parts the game animates or recolours are separate objects: <prop>__screen, __label,
    __status, __glow, __lever, __leaf_L, __leaf_R, __ring, __ring2, __core, __pulse_N,
    __arm, __blades. Their materials ("dyn_*") are replaced by the game at load time.
  * All geometry is original and illustrative. No NASA logo, flag, patch or branding.

Re-running this script rebuilds everything and overwrites manual edits to the .blend.
To export after editing by hand, run export_kit.py instead.
"""

import math
import os
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector, noise

HERE = os.path.dirname(os.path.abspath(__file__))
BLEND_DIR = os.path.dirname(HERE)
PROJECT = os.path.dirname(os.path.dirname(BLEND_DIR))
OUT_DIR = os.path.join(PROJECT, "public", "assets", "models")
TEX_DIR = os.path.join(BLEND_DIR, "textures")
BLEND_PATH = os.path.join(BLEND_DIR, "vorax_kit.blend")
rad = math.radians

# name, base colour (sRGB hex), metallic, roughness, emission (sRGB hex or None)
PALETTE = [
    ("panel_dark", "26323B", 0.25, 0.80, None),
    ("panel_mid", "3B4A55", 0.25, 0.72, None),
    ("equip_grey", "8B979C", 0.30, 0.60, None),
    ("equip_light", "C3CACC", 0.15, 0.55, None),
    ("metal_bare", "9AA3A6", 0.85, 0.45, None),
    ("rubber", "14181C", 0.00, 0.90, None),
    ("black", "080D12", 0.00, 0.85, None),
    ("cyan_paint", "71D4D6", 0.10, 0.60, None),
    ("rust_paint", "BA7652", 0.10, 0.78, None),
    ("amber_paint", "E0A35A", 0.10, 0.60, None),
    ("warm_white", "D8C6A5", 0.05, 0.70, None),
    ("solar_blue", "17254A", 0.55, 0.35, None),
    ("gold_foil", "B08D3C", 0.80, 0.42, None),
    ("rock_light", "A9795E", 0.00, 0.95, None),
    ("rock_dark", "5E3D30", 0.00, 0.95, None),
    ("spherule", "5F6F86", 0.10, 0.55, None),
    ("emit_cyan", "0E2A2B", 0.00, 0.60, "71D4D6"),
    ("emit_amber", "2C2012", 0.00, 0.60, "E0A35A"),
    ("emit_warm", "2B2721", 0.00, 0.60, "D8C6A5"),
    ("emit_red", "2A1410", 0.00, 0.60, "B8452F"),
]
GRID_W, GRID_H, CELL = 8, 4, 8
SWATCH = {entry[0]: i for i, entry in enumerate(PALETTE)}


def swatch_uv(name):
    i = SWATCH[name]
    return ((i % GRID_W + 0.5) / GRID_W, 1.0 - (i // GRID_W + 0.5) / GRID_H)


def hex_rgb(h):
    return tuple(int(h[k : k + 2], 16) / 255.0 for k in (0, 2, 4))


def T(loc=(0, 0, 0), rot=(0, 0, 0)):
    return Matrix.Translation(Vector(loc)) @ Euler(rot, "XYZ").to_matrix().to_4x4()


# ---------------------------------------------------------------- scene reset


def purge():
    for coll in (
        bpy.data.objects,
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.collections,
    ):
        for block in list(coll):
            coll.remove(block)


def write_palette():
    os.makedirs(TEX_DIR, exist_ok=True)
    w, h = GRID_W * CELL, GRID_H * CELL
    layers = {"pal_base": [], "pal_orm": [], "pal_emit": []}
    for y in range(h):
        for x in range(w):
            i = (GRID_H - 1 - y // CELL) * GRID_W + x // CELL  # image rows start at the bottom
            if i < len(PALETTE):
                _, base, metal, rough, emit = PALETTE[i]
                layers["pal_base"] += [*hex_rgb(base), 1.0]
                layers["pal_orm"] += [1.0, rough, metal, 1.0]
                layers["pal_emit"] += [*(hex_rgb(emit) if emit else (0.0, 0.0, 0.0)), 1.0]
            else:
                layers["pal_base"] += [0.0, 0.0, 0.0, 1.0]
                layers["pal_orm"] += [1.0, 1.0, 0.0, 1.0]
                layers["pal_emit"] += [0.0, 0.0, 0.0, 1.0]
    images = {}
    for name, pixels in layers.items():
        path = os.path.join(TEX_DIR, name + ".png")
        tmp = bpy.data.images.new("_tmp_" + name, w, h, alpha=True)
        if name == "pal_orm":
            tmp.colorspace_settings.name = "Non-Color"
        tmp.pixels.foreach_set(pixels)
        tmp.filepath_raw = path
        tmp.file_format = "PNG"
        tmp.save()
        bpy.data.images.remove(tmp)
        img = bpy.data.images.load(path)
        img.name = name
        if name == "pal_orm":
            img.colorspace_settings.name = "Non-Color"
        images[name] = img
    return images


def principled(mat):
    try:
        mat.use_nodes = True
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None) or nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return nt, bsdf


def make_kit_material(images):
    mat = bpy.data.materials.new("kit")
    nt, bsdf = principled(mat)

    def tex(key, x):
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = images[key]
        node.interpolation = "Closest"
        node.location = (x, 0)
        return node

    base, orm, emit = tex("pal_base", -900), tex("pal_orm", -600), tex("pal_emit", -300)
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(base.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(orm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
    nt.links.new(emit.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.0
    return mat


def make_dyn_material(name, base, emit, strength=1.0):
    mat = bpy.data.materials.new(name)
    _, bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = (*hex_rgb(base), 1.0)
    bsdf.inputs["Roughness"].default_value = 0.6
    bsdf.inputs["Emission Color"].default_value = (*hex_rgb(emit), 1.0)
    bsdf.inputs["Emission Strength"].default_value = strength
    return mat


# ---------------------------------------------------------------- mesh builder


class Builder:
    """Accumulates primitives into one mesh. Every face points its UVs at one palette swatch."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.verify()

    def _add(self, part, M, sw, smooth, face_sw=None):
        tmp = bpy.data.meshes.new("_part")
        part.to_mesh(tmp)
        part.free()
        nv, nf = len(self.bm.verts), len(self.bm.faces)
        self.bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        self.bm.verts.ensure_lookup_table()
        self.bm.faces.ensure_lookup_table()
        bmesh.ops.transform(self.bm, matrix=M, verts=self.bm.verts[nv:])
        for f in self.bm.faces[nf:]:
            f.smooth = smooth
            if face_sw is not None:
                f.normal_update()
            u, v = swatch_uv(face_sw(f) if face_sw else sw)
            for loop in f.loops:
                loop[self.uv].uv = (u, v)

    def box(self, size, loc=(0, 0, 0), sw="panel_dark", rot=(0, 0, 0), bevel=0.012, M=None):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
        if bevel > 0:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * 0.3), segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
        self._add(bm, M if M is not None else T(loc, rot), sw, False)

    def cyl(self, r, h, loc=(0, 0, 0), sw="equip_grey", rot=(0, 0, 0), segs=20, r2=None, M=None):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        self._add(bm, M if M is not None else T(loc, rot), sw, True)

    def sphere(self, r, loc=(0, 0, 0), sw="equip_grey", segs=16, rings=10, scale=(1, 1, 1), cut_below=None):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
        if cut_below is not None:
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut_below - 1e-5], context="VERTS")
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        self._add(bm, T(loc), sw, True)

    def ico(self, r, loc, sw, sub=1):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
        self._add(bm, T(loc), sw, True)

    def torus(self, R, r, loc=(0, 0, 0), sw="metal_bare", rot=(0, 0, 0), major=28, minor=8):
        bm = bmesh.new()
        rings = []
        for i in range(major):
            a = 2 * math.pi * i / major
            rings.append([bm.verts.new(((R + r * math.cos(2 * math.pi * j / minor)) * math.cos(a), (R + r * math.cos(2 * math.pi * j / minor)) * math.sin(a), r * math.sin(2 * math.pi * j / minor))) for j in range(minor)])
        for i in range(major):
            for j in range(minor):
                bm.faces.new((rings[i][j], rings[(i + 1) % major][j], rings[(i + 1) % major][(j + 1) % minor], rings[i][(j + 1) % minor]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._add(bm, T(loc, rot), sw, True)

    def _between(self, p0, p1):
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        return Matrix.Translation((p0 + p1) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4(), d.length

    def beam(self, p0, p1, t, sw="equip_grey", bevel=0.008):
        M, length = self._between(p0, p1)
        self.box((t, t, length), sw=sw, bevel=bevel, M=M)

    def rod(self, p0, p1, r, sw="metal_bare", segs=10):
        M, length = self._between(p0, p1)
        self.cyl(r, length, sw=sw, segs=segs, M=M)

    def prism(self, pts, z0, z1, sw, M=None):
        """Extrudes a convex polygon given as (x, y) points."""
        bm = bmesh.new()
        lo = [bm.verts.new((x, y, z0)) for x, y in pts]
        hi = [bm.verts.new((x, y, z1)) for x, y in pts]
        bm.faces.new(lo)
        bm.faces.new(hi)
        n = len(pts)
        for i in range(n):
            bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._add(bm, M if M is not None else Matrix.Identity(4), sw, False)

    def relief(self, size, loc, height, seg=(28, 20), seed=3):
        """Low layered outcrop with dark cracks. Returns its height function for scattering."""
        sx, sy = size

        def h(x, y):
            p = Vector((x * 2.2 + seed, y * 2.2, 0.0))
            edge = min(1.0, (1 - abs(2 * x / sx)) * 5) * min(1.0, (1 - abs(2 * y / sy)) * 5)
            if edge <= 0:
                return 0.0
            d = noise.voronoi(Vector((x * 2.6 + seed, y * 2.6, 0.0)))[0]
            crack = min(1.0, max(0.0, (d[1] - d[0]) / 0.16))
            layers = math.floor((0.55 + 0.45 * noise.noise(p)) * height / 0.022) * 0.022
            return max(0.012, (0.02 + layers) * crack) * edge

        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=seg[0], y_segments=seg[1], size=1.0)
        xs = [v.co.x for v in bm.verts]
        ys = [v.co.y for v in bm.verts]
        for v in bm.verts:
            v.co.x = (v.co.x - min(xs)) / (max(xs) - min(xs)) * sx - sx / 2
            v.co.y = (v.co.y - min(ys)) / (max(ys) - min(ys)) * sy - sy / 2
            v.co.z = h(v.co.x, v.co.y)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        if sum(f.normal.z for f in bm.faces) < 0:
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
        self._add(bm, T(loc), "rock_light", False, face_sw=lambda f: "rock_light" if f.normal.z > 0.8 and f.calc_center_median().z > 0.03 else "rock_dark")
        return lambda x, y: h(x - loc[0], y - loc[1]) + loc[2]

    def finish(self, root, material, loc=(0, 0, 0), rot=(0, 0, 0)):
        me = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        me.set_sharp_from_angle(angle=rad(40))
        me.materials.append(material)
        return link(bpy.data.objects.new(self.name, me), root, loc, rot)


def link(obj, root, loc=(0, 0, 0), rot=(0, 0, 0)):
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = root
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def dyn_quad(name, w, h, root, material, loc, rot):
    """Flat quad with 0..1 UVs, facing +Z before rotation; rot=(90°,0,0) makes it face -Y."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.verify()
    verts = [bm.verts.new(p) for p in ((-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0))]
    face = bm.faces.new(verts)
    for loop, st in zip(face.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop[uv].uv = st
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    return link(bpy.data.objects.new(name, me), root, loc, rot)


# ---------------------------------------------------------------- props


def build_terminal(root, m):
    b = Builder("terminal__body")
    b.box((0.80, 0.52, 0.08), (0, 0, 0.04))
    b.box((0.46, 0.30, 0.82), (0, 0.05, 0.49), "panel_mid", bevel=0.02)
    b.box((0.38, 0.02, 0.5), (0, -0.105, 0.47), "panel_dark", bevel=0.006)
    b.box((0.30, 0.012, 0.025), (0, -0.118, 0.66), "emit_cyan", bevel=0)
    for k in range(4):
        b.box((0.30, 0.012, 0.018), (0, -0.118, 0.30 + k * 0.05), "black", bevel=0)
    tilt = rad(58)
    b.box((0.90, 0.58, 0.09), (0, -0.02, 1.17), "panel_dark", rot=(tilt, 0, 0), bevel=0.018)
    b.box((0.94, 0.05, 0.12), (0, 0.16, 1.44), "equip_grey", rot=(tilt, 0, 0), bevel=0.01)
    for sx in (-1, 1):
        b.box((0.03, 0.60, 0.11), (sx * 0.465, -0.02, 1.17), "equip_grey", rot=(tilt, 0, 0), bevel=0.008)
    b.box((0.72, 0.24, 0.045), (0, -0.25, 0.90), "panel_mid", rot=(rad(14), 0, 0), bevel=0.012)
    for row in range(3):
        for col in range(8):
            b.box((0.062, 0.05, 0.018), M=T((0, -0.25, 0.90), (rad(14), 0, 0)) @ T((-0.28 + col * 0.08, -0.07 + row * 0.068, 0.03)), sw="equip_grey", bevel=0.004)
    b.box((0.05, 0.05, 0.03), (0.39, 0.12, 1.47), "emit_amber", bevel=0.004)
    b.rod((0.12, 0.2, 0.2), (0.12, 0.22, 1.2), 0.022, "rubber")
    b.rod((-0.1, 0.2, 0.2), (-0.1, 0.22, 1.1), 0.016, "rubber")
    b.finish(root, m["kit"])
    n = Vector((0, -math.sin(tilt), math.cos(tilt)))
    c = Vector((0, -0.02, 1.17)) + n * 0.048
    dyn_quad("terminal__screen", 0.78, 0.46, root, m["dyn_screen"], c, (tilt, 0, 0))


def build_switch(root, m):
    b = Builder("switch__body")
    b.box((0.66, 0.42, 0.08), (0, 0, 0.04))
    b.box((0.58, 0.34, 1.30), (0, 0, 0.73), "panel_mid", bevel=0.02)
    b.box((0.62, 0.38, 0.06), (0, 0, 1.41), "panel_dark")
    b.box((0.46, 0.03, 0.66), (0, -0.172, 0.98), "panel_dark", bevel=0.01)
    for i in range(6):
        b.box((0.085, 0.014, 0.12), (-0.2125 + i * 0.085, -0.173, 0.5), "amber_paint" if i % 2 == 0 else "black", bevel=0)
    for k in range(4):
        b.box((0.012, 0.2, 0.03), (0.293, 0, 0.3 + k * 0.07), "black", bevel=0)
        b.box((0.012, 0.2, 0.03), (-0.293, 0, 0.3 + k * 0.07), "black", bevel=0)
    b.cyl(0.04, 1.98, (0.19, 0.08, 2.41), "metal_bare", segs=10)
    b.torus(0.05, 0.014, (0.19, 0.08, 1.46), "equip_grey", major=12, minor=6)
    b.box((0.16, 0.04, 0.12), (0, -0.19, 0.92), "equip_grey", bevel=0.01)
    b.finish(root, m["kit"])
    lever = Builder("switch__lever")
    lever.cyl(0.05, 0.11, (0, 0, 0), "metal_bare", rot=(0, rad(90), 0), segs=14)
    lever.box((0.045, 0.045, 0.30), (0, -0.02, 0.15), "equip_light", bevel=0.01)
    lever.cyl(0.032, 0.22, (0, -0.02, 0.30), "amber_paint", rot=(0, rad(90), 0), segs=12)
    lever.finish(root, m["kit"], loc=(0, -0.22, 0.92))
    status = Builder("switch__status")
    status.cyl(0.035, 0.03, (0, 0, 0), "emit_amber", rot=(rad(90), 0, 0), segs=14)
    status.finish(root, m["dyn_status"], loc=(0.17, -0.2, 1.22))
    dyn_quad("switch__label", 0.30, 0.09, root, m["dyn_label"], (-0.06, -0.189, 1.22), (rad(90), 0, 0))


def build_door(root, m):
    b = Builder("door__frame")
    for sx in (-1, 1):
        b.box((0.5, 0.5, 3.4), (sx * 1.25, 0, 1.7), "panel_dark", bevel=0.02)
        b.box((0.06, 0.56, 2.5), (sx * 1.03, 0, 1.25), "equip_grey", bevel=0.01)
        for k in range(4):
            b.box((0.07, 0.58, 0.12), (sx * 1.03, 0, 0.3 + k * 0.62), "amber_paint", bevel=0.005)
        b.box((0.34, 0.56, 0.1), (sx * 1.27, 0, 0.05), "rubber", bevel=0.01)
        b.box((0.18, 0.54, 0.5), (sx * 1.3, 0, 1.4), "panel_mid", bevel=0.012)
    b.box((2.0, 0.5, 0.9), (0, 0, 2.95), "panel_dark", bevel=0.02)
    b.box((2.06, 0.56, 0.08), (0, 0, 2.52), "equip_grey", bevel=0.01)
    b.box((2.0, 0.5, 0.03), (0, 0, 0.012), "metal_bare", bevel=0.004)
    for sy in (-1, 1):
        b.box((1.5, 0.03, 0.3), (0, sy * 0.258, 3.0), "panel_mid", bevel=0.008)
    b.finish(root, m["kit"])
    status = Builder("door__status")
    for sy in (-1, 1):
        status.box((1.0, 0.03, 0.06), (0, sy * 0.285, 2.66), "emit_amber", bevel=0.004)
    status.finish(root, m["dyn_status"])
    for name, sx in (("door__leaf_L", -1), ("door__leaf_R", 1)):
        leaf = Builder(name)
        leaf.box((0.995, 0.12, 2.48), (sx * 0.5, 0, 1.25), "panel_mid", bevel=0.012)
        leaf.box((0.72, 0.15, 0.82), (sx * 0.52, 0, 1.86), "panel_dark", bevel=0.015)
        leaf.box((0.72, 0.15, 0.82), (sx * 0.52, 0, 0.64), "panel_dark", bevel=0.015)
        leaf.box((0.995, 0.17, 0.10), (sx * 0.5, 0, 1.25), "equip_grey", bevel=0.01)
        leaf.box((0.05, 0.16, 2.40), (sx * 0.035, 0, 1.25), "amber_paint", bevel=0.006)
        for k in range(3):
            leaf.box((0.5, 0.165, 0.03), (sx * 0.52, 0, 1.62 + k * 0.2), "black", bevel=0)
        leaf.finish(root, m["kit"])


def build_rack(root, m):
    b = Builder("rack__body")
    b.box((0.80, 0.50, 0.10), (0, 0, 0.05))
    b.box((0.80, 0.50, 0.06), (0, 0, 2.17))
    for sx in (-1, 1):
        b.box((0.05, 0.50, 2.06), (sx * 0.375, 0, 1.13), "panel_mid", bevel=0.008)
    b.box((0.70, 0.03, 2.06), (0, 0.235, 1.13), "panel_dark", bevel=0)
    rng = random.Random(7)
    for s in range(6):
        z = 0.20 + s * 0.33
        b.box((0.70, 0.46, 0.03), (0, 0, z), "equip_grey", bevel=0.004)
        x = -0.34
        while x < 0.27:
            w = rng.choice((0.06, 0.08, 0.11))
            h, d = rng.uniform(0.18, 0.27), rng.uniform(0.30, 0.40)
            if rng.random() < 0.86:
                front = -0.215
                b.box((w - 0.012, d, h), (x + w / 2, front + d / 2, z + 0.015 + h / 2), rng.choice(("panel_mid", "equip_grey", "panel_dark", "equip_light")), bevel=0.004)
                if rng.random() < 0.32:
                    b.box((0.016, 0.008, 0.016), (x + w / 2, front - 0.002, z + 0.06), rng.choice(("emit_cyan", "emit_amber", "emit_cyan")), bevel=0)
            x += w
    b.finish(root, m["kit"])


def build_pedestal(root, m):
    b = Builder("pedestal__body")
    b.cyl(1.30, 0.12, (0, 0, 0.06), "panel_dark", segs=40)
    b.cyl(1.16, 0.22, (0, 0, 0.23), "panel_mid", segs=40)
    b.cyl(1.06, 0.012, (0, 0, 0.346), "equip_grey", segs=40)
    for a in (45, 135, 225, 315):
        x, y = 1.22 * math.cos(rad(a)), 1.22 * math.sin(rad(a))
        b.cyl(0.022, 0.78, (x, y, 0.51), "metal_bare", segs=10)
        b.sphere(0.036, (x, y, 0.91), "metal_bare", segs=10, rings=6)
        b.cyl(0.05, 0.03, (x, y, 0.135), "panel_mid", segs=12)
    tilt = rad(55)
    b.box((0.05, 0.05, 0.74), (0, -1.21, 0.49), "panel_mid", bevel=0.008)
    b.box((0.66, 0.24, 0.024), (0, -1.23, 0.88), "panel_dark", rot=(tilt, 0, 0), bevel=0.008)
    b.finish(root, m["kit"])
    glow = Builder("pedestal__glow")
    glow.cyl(1.168, 0.03, (0, 0, 0.2), "emit_warm", segs=40)
    glow.finish(root, m["dyn_glow"])
    n = Vector((0, -math.sin(tilt), math.cos(tilt)))
    dyn_quad("pedestal__label", 0.62, 0.20, root, m["dyn_label"], Vector((0, -1.23, 0.88)) + n * 0.014, (tilt, 0, 0))


def build_insight(root, m):
    """Illustrative display: stylized SEIS dome with tether, and a fragment of deck and solar panel."""
    b = Builder("insight__body")
    dx, dy = -0.45, -0.35
    b.cyl(0.42, 0.13, (dx, dy, 0.065), "metal_bare", segs=32, r2=0.34)
    b.cyl(0.345, 0.03, (dx, dy, 0.145), "equip_grey", segs=32)
    b.sphere(0.335, (dx, dy, 0.16), "equip_light", segs=32, rings=16, scale=(1, 1, 0.62), cut_below=0)
    b.cyl(0.018, 0.05, (dx, dy, 0.39), "metal_bare", segs=8)
    b.sphere(0.028, (dx, dy, 0.425), "metal_bare", segs=10, rings=6)
    for a in (30, 150, 270):
        b.box((0.09, 0.06, 0.03), (dx + 0.43 * math.cos(rad(a)), dy + 0.43 * math.sin(rad(a)), 0.015), "equip_grey", rot=(0, 0, rad(a)), bevel=0.006)
    path = [(dx + 0.36, dy + 0.14), (-0.02, -0.02), (0.12, 0.16), (0.30, 0.26)]
    for p0, p1 in zip(path, path[1:]):
        b.beam((p0[0], p0[1], 0.012), (p1[0], p1[1], 0.012), 0.012, "warm_white", bevel=0)
        M, length = b._between((p0[0], p0[1], 0.012), (p1[0], p1[1], 0.012))
        b.box((0.075, 0.012, length), sw="warm_white", bevel=0, M=M)
    b.box((0.12, 0.09, 0.035), (-0.02, -0.02, 0.02), "equip_grey", rot=(0, 0, rad(40)), bevel=0.006)
    # deck fragment on two struts, with a few stand-in boxes
    cx, cy, cz = 0.35, 0.38, 0.66
    b.cyl(0.46, 0.07, (cx, cy, cz), "equip_grey", segs=6)
    b.cyl(0.40, 0.03, (cx, cy, cz - 0.05), "gold_foil", segs=6)
    b.rod((cx - 0.2, cy - 0.15, 0.0), (cx - 0.1, cy - 0.08, cz - 0.06), 0.03, "metal_bare")
    b.rod((cx + 0.2, cy + 0.2, 0.0), (cx + 0.1, cy + 0.1, cz - 0.06), 0.03, "metal_bare")
    b.box((0.2, 0.16, 0.1), (cx - 0.12, cy + 0.05, cz + 0.085), "gold_foil", bevel=0.01)
    b.cyl(0.06, 0.14, (cx + 0.14, cy - 0.12, cz + 0.105), "equip_light", segs=14)
    b.rod((cx + 0.1, cy + 0.18, cz + 0.03), (cx + 0.1, cy + 0.18, cz + 0.5), 0.012, "metal_bare", segs=8)
    b.box((0.07, 0.05, 0.05), (cx + 0.1, cy + 0.18, cz + 0.52), "equip_grey", bevel=0.006)
    # part of a round solar array: four wedges of a ten-sided disc
    hinge = Vector((cx + 0.30, cy + 0.20, cz + 0.02))
    A = Matrix.Translation(hinge) @ Euler((rad(-8), rad(-6), rad(-18)), "XYZ").to_matrix().to_4x4()
    R = 0.74
    for k in range(4):
        a0, a1 = rad(k * 36 + 1.5), rad((k + 1) * 36 - 1.5)
        b.prism([(0.05 * math.cos((a0 + a1) / 2), 0.05 * math.sin((a0 + a1) / 2)), (R * math.cos(a0), R * math.sin(a0)), (R * math.cos(a1), R * math.sin(a1))], 0.0, 0.018, "solar_blue", M=A)
    for k in range(5):
        a = rad(k * 36)
        M, length = b._between((0, 0, -0.006), (R * math.cos(a), R * math.sin(a), -0.006))
        b.box((0.03, 0.02, length), sw="gold_foil", bevel=0.004, M=A @ M)
    for k in range(4):
        a0, a1 = rad(k * 36), rad((k + 1) * 36)
        M, length = b._between((R * math.cos(a0), R * math.sin(a0), 0.004), (R * math.cos(a1), R * math.sin(a1), 0.004))
        b.box((0.03, 0.03, length), sw="gold_foil", bevel=0.004, M=A @ M)
    b.finish(root, m["kit"])


def build_opportunity(root, m):
    """Illustrative display: wheel, panel fragment and a layered rock relief with spherules."""
    b = Builder("opportunity__body")
    slab = (-0.28, -0.30, 0.0)
    height_at = b.relief((1.25, 0.95), slab, 0.16, seed=5)
    rng = random.Random(11)
    placed = 0
    while placed < 46:
        x, y = slab[0] + rng.uniform(-0.56, 0.56), slab[1] + rng.uniform(-0.42, 0.42)
        z = height_at(x, y)
        if z < 0.011 or (z > 0.05 and rng.random() < 0.55):
            continue  # more spherules gather in the low cracks, as in the photograph
        r = rng.uniform(0.013, 0.02)
        b.ico(r, (x, y, z + r * 0.55), "spherule")
        placed += 1
    # wheel on a cradle
    wx, wy = 0.62, -0.42
    W = T((wx, wy, 0.265), (0, 0, rad(28)))
    b.box((0.34, 0.2, 0.05), (wx, wy, 0.025), "panel_dark", rot=(0, 0, rad(28)), bevel=0.01)
    b.cyl(0.205, 0.25, sw="equip_light", segs=36, M=W @ T(rot=(0, rad(90), 0)))
    for sx in (-1, 1):
        b.cyl(0.165, 0.012, sw="panel_dark", segs=28, M=W @ T((sx * 0.123, 0, 0), (0, rad(90), 0)))
        b.cyl(0.06, 0.03, sw="metal_bare", segs=14, M=W @ T((sx * 0.135, 0, 0), (0, rad(90), 0)))
        for k in range(5):
            a = rad(k * 72)
            p0 = Vector((sx * 0.133, 0.055 * math.cos(a), 0.055 * math.sin(a)))
            p1 = Vector((sx * 0.133, 0.155 * math.cos(a + 0.7), 0.155 * math.sin(a + 0.7)))
            M, length = b._between(p0, p1)
            b.box((0.02, 0.012, length), sw="metal_bare", bevel=0.003, M=W @ M)
    for k in range(24):
        a = rad(k * 15)
        b.box((0.25, 0.016, 0.028), sw="panel_mid", bevel=0.003, M=W @ Matrix.Rotation(a, 4, "X") @ T((0, 0, 0.208)))
    # solar panel fragment on two struts
    P = T((0.30, 0.52, 0.62), (rad(18), rad(-6), rad(-14)))
    outline = [(-0.52, -0.26), (0.50, -0.30), (0.56, 0.12), (-0.30, 0.30)]
    b.prism(outline, -0.022, 0.0, "gold_foil", M=P)
    b.prism([(x * 0.94, y * 0.92) for x, y in outline], 0.0, 0.012, "solar_blue", M=P)
    for k in range(5):
        x = -0.36 + k * 0.19
        b.box((0.012, 0.52, 0.006), (x, 0, 0.014), "equip_grey", bevel=0, M=P @ T((x, -0.02, 0.014)))
    b.rod((0.10, 0.40, 0.0), (0.12, 0.46, 0.58), 0.022, "metal_bare")
    b.rod((0.56, 0.62, 0.0), (0.52, 0.58, 0.60), 0.022, "metal_bare")
    b.finish(root, m["kit"])


def build_relay(root, m):
    b = Builder("relay__body")
    b.cyl(0.95, 0.22, (0, 0, 0.11), "panel_dark", segs=36)
    b.cyl(0.72, 0.14, (0, 0, 0.29), "panel_mid", segs=36)
    for k in range(8):
        a = rad(k * 45 + 22.5)
        b.box((0.44, 0.07, 0.2), M=Matrix.Rotation(a, 4, "Z") @ T((0.6, 0, 0.32)), sw="equip_grey", bevel=0.01)
    b.cyl(0.20, 0.80, (0, 0, 0.76), "equip_grey", segs=20)
    b.cyl(0.26, 0.06, (0, 0, 1.14), "panel_dark", segs=20)
    b.cyl(0.26, 0.06, (0, 0, 1.76), "panel_dark", segs=20)
    b.cyl(0.17, 0.36, (0, 0, 1.96), "equip_grey", segs=20)
    for z in (0.55, 0.95):
        b.torus(0.225, 0.028, (0, 0, z), "metal_bare", major=24, minor=6)
    for a in (45, 135, 225, 315):
        b.box((0.035, 0.035, 0.62), (0.31 * math.cos(rad(a)), 0.31 * math.sin(rad(a)), 1.45), "metal_bare", bevel=0.006)
    b.torus(0.34, 0.022, (0, 0, 1.16), "metal_bare", major=24, minor=6)
    b.torus(0.34, 0.022, (0, 0, 1.74), "metal_bare", major=24, minor=6)
    b.cyl(0.10, 0.24, (0, 0, 2.26), "equip_light", segs=28, r2=0.44)
    b.cyl(0.44, 0.02, (0, 0, 2.385), "panel_dark", segs=28)
    b.rod((0, 0, 2.3), (0, 0, 2.82), 0.014, "metal_bare", segs=8)
    b.sphere(0.045, (0, 0, 2.85), "amber_paint", segs=10, rings=6)
    for a in (205, 250, 290, 335):
        b.rod((0.5 * math.cos(rad(a)), 0.5 * math.sin(rad(a)), 0.25), (0.98 * math.cos(rad(a)), 0.98 * math.sin(rad(a)), 0.03), 0.03, "rubber", segs=8)
    b.box((0.7, 0.04, 0.12), (0, -0.705, 0.3), "panel_dark", bevel=0.01)
    b.finish(root, m["kit"])
    core = Builder("relay__core")
    core.sphere(0.25, (0, 0, 0), "emit_amber", segs=24, rings=14)
    core.finish(root, m["dyn_core"], loc=(0, 0, 1.45))
    ring = Builder("relay__ring")
    ring.torus(0.78, 0.032, sw="metal_bare", major=40, minor=8)
    for a in (0, 90, 180, 270):
        ring.box((0.09, 0.09, 0.09), (0.78 * math.cos(rad(a)), 0.78 * math.sin(rad(a)), 0), "equip_grey", bevel=0.012)
    ring.finish(root, m["kit"], loc=(0, 0, 1.45), rot=(rad(24), 0, 0))
    ring2 = Builder("relay__ring2")
    ring2.torus(0.60, 0.026, sw="metal_bare", major=36, minor=8)
    for a in (60, 180, 300):
        ring2.box((0.07, 0.07, 0.07), (0.60 * math.cos(rad(a)), 0.60 * math.sin(rad(a)), 0), "amber_paint", bevel=0.01)
    ring2.finish(root, m["kit"], loc=(0, 0, 1.45), rot=(rad(-34), rad(18), 0))
    for i, x in enumerate((-0.2, 0.0, 0.2)):
        lamp = Builder("relay__pulse_%d" % (i + 1))
        lamp.cyl(0.05, 0.03, (0, 0, 0), "emit_amber", rot=(rad(90), 0, 0), segs=16)
        lamp.finish(root, m["dyn_pulse"], loc=(x, -0.735, 0.3))


def build_arm(root, m):
    """Ceiling maintenance arm. Origin at the ceiling; the arm object pivots about its own origin."""
    mount = Builder("arm__mount")
    mount.box((1.5, 0.14, 0.06), (0, 0, -0.03), "panel_mid", bevel=0.01)
    mount.box((0.46, 0.46, 0.08), (0, 0, -0.07), "panel_dark", bevel=0.015)
    mount.cyl(0.13, 0.2, (0, 0, -0.2), "equip_grey", segs=18)
    mount.finish(root, m["kit"])
    a = Builder("arm__arm")
    shoulder = Vector((0, 0, 0))
    elbow = Vector((0.52, 0, -0.68))
    wrist = Vector((0.18, 0, -1.34))
    a.cyl(0.1, 0.18, shoulder, "metal_bare", rot=(rad(90), 0, 0), segs=16)
    a.beam(shoulder, elbow, 0.11, "equip_grey", bevel=0.015)
    a.cyl(0.085, 0.16, elbow, "metal_bare", rot=(rad(90), 0, 0), segs=16)
    a.beam(elbow, wrist, 0.085, "equip_light", bevel=0.012)
    a.sphere(0.07, wrist, "metal_bare", segs=14, rings=8)
    for sy in (-1, 1):
        a.beam(wrist + Vector((0, sy * 0.035, -0.02)), wrist + Vector((-0.05, sy * 0.075, -0.24)), 0.028, "panel_mid", bevel=0.005)
    a.rod(shoulder + Vector((0.02, 0.075, -0.05)), elbow + Vector((-0.02, 0.07, 0.04)), 0.018, "rubber", segs=8)
    a.rod(elbow + Vector((0.0, 0.06, -0.04)), wrist + Vector((0.02, 0.055, 0.06)), 0.015, "rubber", segs=8)
    a.box((0.03, 0.02, 0.03), wrist + Vector((0.03, 0, 0.09)), "emit_red", bevel=0)
    a.finish(root, m["kit"], loc=(0, 0, -0.3))


def build_fan(root, m):
    """Wall ventilation unit. Origin at the wall surface, centred on the opening; faces -Y."""
    h = Builder("fan__housing")
    y = -0.07
    h.box((1.8, 0.14, 0.3), (0, y, 0.75), "panel_dark", bevel=0.015)
    h.box((1.8, 0.14, 0.3), (0, y, -0.75), "panel_dark", bevel=0.015)
    h.box((0.3, 0.14, 1.2), (-0.75, y, 0), "panel_dark", bevel=0.015)
    h.box((0.3, 0.14, 1.2), (0.75, y, 0), "panel_dark", bevel=0.015)
    for sx in (-1, 1):
        for sz in (-1, 1):
            h.box((0.46, 0.13, 0.2), (sx * 0.5, y, sz * 0.5), "panel_mid", rot=(0, rad(45) * sx * sz, 0), bevel=0.01)
            h.cyl(0.03, 0.02, (sx * 0.8, -0.145, sz * 0.8), "metal_bare", rot=(rad(90), 0, 0), segs=8)
    h.torus(0.585, 0.045, (0, -0.14, 0), "metal_bare", rot=(rad(90), 0, 0), major=36, minor=8)
    h.rod((-0.58, -0.175, 0), (0.58, -0.175, 0), 0.012, "metal_bare", segs=6)
    h.rod((0, -0.175, -0.58), (0, -0.175, 0.58), 0.012, "metal_bare", segs=6)
    h.box((0.5, 0.012, 0.07), (0, -0.142, -0.76), "amber_paint", bevel=0)
    h.finish(root, m["kit"])
    blades = Builder("fan__blades")
    blades.cyl(0.11, 0.12, (0, 0, 0), "panel_mid", rot=(rad(90), 0, 0), segs=16)
    for k in range(5):
        M = Matrix.Rotation(rad(k * 72), 4, "Y") @ T((0.33, 0, 0)) @ Matrix.Rotation(rad(28), 4, "X")
        blades.box((0.44, 0.012, 0.17), sw="equip_grey", bevel=0.004, M=M)
    blades.finish(root, m["kit"], loc=(0, -0.07, 0))


def build_lamp(root, m):
    b = Builder("lamp__body")
    b.box((1.24, 0.30, 0.07), (0, 0, -0.035), "panel_dark", bevel=0.012)
    for sx in (-1, 1):
        b.box((0.05, 0.34, 0.1), (sx * 0.62, 0, -0.05), "equip_grey", bevel=0.01)
    b.finish(root, m["kit"])
    glow = Builder("lamp__glow")
    glow.box((1.12, 0.2, 0.02), (0, 0, -0.08), "emit_warm", bevel=0.004)
    glow.finish(root, m["dyn_glow"])


def build_rib(root, m):
    b = Builder("rib__body")
    b.box((0.30, 0.14, 3.4), (0, -0.07, 1.7), "panel_mid", bevel=0.02)
    b.box((0.42, 0.2, 0.28), (0, -0.10, 0.14), "panel_dark", bevel=0.02)
    b.box((0.42, 0.2, 0.24), (0, -0.10, 3.28), "panel_dark", bevel=0.02)
    b.box((0.31, 0.15, 0.06), (0, -0.073, 1.55), "amber_paint", bevel=0.004)
    b.cyl(0.024, 2.84, (0.1, -0.16, 1.7), "rubber", segs=8)
    for z in (0.6, 1.7, 2.8):
        b.box((0.08, 0.06, 0.04), (0.1, -0.155, z), "metal_bare", bevel=0.006)
    b.finish(root, m["kit"])


def build_crate(root, m):
    b = Builder("crate__body")
    b.box((0.72, 0.52, 0.04), (0, 0, 0.02), "panel_dark", bevel=0.008)
    b.box((0.70, 0.50, 0.38), (0, 0, 0.23), "equip_grey", bevel=0.02)
    b.box((0.72, 0.52, 0.07), (0, 0, 0.455), "panel_mid", bevel=0.015)
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.box((0.07, 0.07, 0.42), (sx * 0.33, sy * 0.23, 0.23), "rubber", bevel=0.012)
        b.box((0.07, 0.022, 0.1), (sx * 0.17, -0.262, 0.41), "metal_bare", bevel=0.006)
        b.box((0.02, 0.2, 0.05), (sx * 0.362, 0, 0.3), "metal_bare", bevel=0.006)
    b.box((0.46, 0.012, 0.07), (0, -0.253, 0.2), "rust_paint", bevel=0)
    b.finish(root, m["kit"])


def build_tray(root, m):
    b = Builder("tray__body")
    b.box((2.0, 0.36, 0.025), (0, 0, -0.27), "panel_mid", bevel=0.004)
    for sy in (-1, 1):
        b.box((2.0, 0.02, 0.07), (0, sy * 0.18, -0.245), "panel_mid", bevel=0.004)
        for sx in (-1, 1):
            b.box((0.03, 0.03, 0.28), (sx * 0.8, sy * 0.18, -0.14), "metal_bare", bevel=0.005)
    b.cyl(0.045, 2.0, (0, -0.09, -0.21), "metal_bare", rot=(0, rad(90), 0), segs=12)
    b.cyl(0.03, 2.0, (0, 0.03, -0.225), "rubber", rot=(0, rad(90), 0), segs=10)
    b.cyl(0.022, 2.0, (0, 0.11, -0.233), "amber_paint", rot=(0, rad(90), 0), segs=8)
    b.finish(root, m["kit"])


# prop -> (builder, preview position)
PROPS = {
    "terminal": (build_terminal, (0.0, 0.0, 0.0)),
    "switch": (build_switch, (2.0, 0.0, 0.0)),
    "rack": (build_rack, (3.8, 0.0, 0.0)),
    "crate": (build_crate, (5.4, 0.0, 0.0)),
    "pedestal": (build_pedestal, (8.0, 0.0, 0.0)),
    "insight": (build_insight, (8.0, 0.0, 0.34)),
    "opportunity": (build_opportunity, (11.6, 0.0, 0.0)),
    "relay": (build_relay, (15.0, 0.0, 0.0)),
    "door": (build_door, (1.6, 5.0, 0.0)),
    "fan": (build_fan, (5.6, 5.0, 1.3)),
    "arm": (build_arm, (8.2, 5.0, 2.4)),
    "lamp": (build_lamp, (10.4, 5.0, 1.6)),
    "tray": (build_tray, (12.8, 5.0, 1.6)),
    "rib": (build_rib, (15.0, 5.0, 0.0)),
}


def tri_count(root):
    total = 0
    for obj in root.children_recursive:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            total += len(obj.data.loop_triangles)
    return total


def export_prop(name, root):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name + ".glb")
    saved = root.location.copy()
    root.location = (0, 0, 0)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [root, *root.children_recursive]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_extras=False,
    )
    root.location = saved
    return os.path.getsize(path)


def build_preview_stage():
    """Floor, lights and camera for assets/blender/preview renders. Never exported."""
    scene = bpy.context.scene
    stage = bpy.data.objects.new("_preview_stage", None)
    scene.collection.objects.link(stage)
    floor = Builder("_preview_floor")
    floor.box((24, 14, 0.1), (7.5, 2.5, -0.05), "panel_dark", bevel=0)
    floor.finish(stage, bpy.data.materials["kit"])
    for name, kind, loc, energy, color in (
        ("_key", "AREA", (4, -7, 9), 2600, (1.0, 0.93, 0.85)),
        ("_fill", "AREA", (14, -6, 7), 1500, (0.72, 0.86, 1.0)),
        ("_back", "AREA", (8, 11, 8), 1400, (0.85, 0.9, 1.0)),
    ):
        data = bpy.data.lights.new(name, kind)
        data.energy = energy
        data.color = color
        data.size = 7
        light = link(bpy.data.objects.new(name, data), stage, loc)
        light.rotation_euler = (Vector((7.5, 2.0, 0.5)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam_data = bpy.data.cameras.new("_preview_camera")
    cam_data.lens = 32
    cam = link(bpy.data.objects.new("_preview_camera", cam_data), stage, (7.6, -13.5, 8.6))
    cam.rotation_euler = (Vector((7.6, 2.0, 0.9)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1600, 900
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.color = (0.012, 0.016, 0.022)


def main():
    purge()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    images = write_palette()
    mats = {
        "kit": make_kit_material(images),
        "dyn_screen": make_dyn_material("dyn_screen", "0A1418", "71D4D6", 0.8),
        "dyn_label": make_dyn_material("dyn_label", "101820", "C3CACC", 0.3),
        "dyn_status": make_dyn_material("dyn_status", "2C2012", "E0A35A", 2.0),
        "dyn_glow": make_dyn_material("dyn_glow", "2B2721", "D8C6A5", 2.0),
        "dyn_core": make_dyn_material("dyn_core", "2C2012", "E0A35A", 3.0),
        "dyn_pulse": make_dyn_material("dyn_pulse", "2C2012", "E0A35A", 2.0),
    }
    report = {}
    roots = {}
    for name, (builder, where) in PROPS.items():
        root = bpy.data.objects.new(name, None)
        root.empty_display_size = 0.3
        scene.collection.objects.link(root)
        builder(root, mats)
        root.location = where
        roots[name] = root
    bpy.context.view_layer.update()
    for name, root in roots.items():
        report[name] = {"triangles": tri_count(root), "bytes": export_prop(name, root)}
    build_preview_stage()
    for img in bpy.data.images:
        if img.filepath:
            img.filepath = bpy.path.relpath(img.filepath, start=BLEND_DIR)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH, check_existing=False)
    report["_total"] = {"triangles": sum(v["triangles"] for v in report.values()), "bytes": sum(v["bytes"] for v in report.values())}
    return report


RESULT = main()
print("VORAX_KIT_REPORT", RESULT)
