"""Shared helpers for the VØRAX station build (Blender 5.x, headless-safe).

Space conventions
  * Blender scene: metres, Z up. Game space (x east, z north, y up) maps to
    Blender (X = -x, Y = -z, Z = y); the glTF exporter and Babylon's loader undo that.
  * Wall-mounted and floor props are authored with their front facing local -Y.
  * `Mesh` accumulates many primitives into one object with several material slots.
    UV0 is box-projected in world space at a per-material tile size; UV1 ("Lightmap")
    is unwrapped later, once per zone.
"""

import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

rad = math.radians
TILE = {}  # material name -> tile size in metres for projected UVs
PALETTE = {}  # colour name -> (material name, swatch uv): many flat colours share one material
PAL_COLS, PAL_ROWS, PAL_CELL = 4, 4, 8


def register_palette(material, names):
    for i, name in enumerate(names):
        PALETTE[name] = (material, ((i % PAL_COLS + 0.5) / PAL_COLS, 1.0 - (i // PAL_COLS + 0.5) / PAL_ROWS))


def write_palette(path, colors, non_color=False):
    """Writes a tiny swatch image. `colors` are RGB triples in the image's own encoding."""
    w, h = PAL_COLS * PAL_CELL, PAL_ROWS * PAL_CELL
    px = []
    for y in range(h):
        for x in range(w):
            i = (PAL_ROWS - 1 - y // PAL_CELL) * PAL_COLS + x // PAL_CELL  # image rows start at the bottom
            px += [*(colors[i] if i < len(colors) else (0.0, 0.0, 0.0)), 1.0]
    img = bpy.data.images.new("_pal", w, h, alpha=False)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(px)
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)
    return load_image(path, non_color)


def srgb(c):
    return tuple(12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055 for v in c)


def T(loc=(0, 0, 0), rot=(0, 0, 0)):
    return Matrix.Translation(Vector(loc)) @ Euler(rot, "XYZ").to_matrix().to_4x4()


def P(x, z, h=0.0):
    """Game plan position (x east, z north) and height -> Blender location."""
    return Vector((-x, -z, h))


def plan_frame(x, z, yaw=0.0, h=0.0):
    """Frame for a prop at a game position whose local -Y front faces game yaw."""
    return T(P(x, z, h), (0, 0, -yaw))


# ---------------------------------------------------------------- images and materials


def load_image(path, non_color=False):
    img = bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


def grade_image(src, dst, sat=1.0, val=1.0, tint=(1, 1, 1), mono_tint=None, quality=90):
    """Writes a colour-graded copy of a texture (display-referred maths, good enough for albedo)."""
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return dst
    img = bpy.data.images.load(src)
    w, h = img.size
    a = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    a = a.reshape(-1, 4)
    rgb = a[:, :3]
    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[:, None]
    if mono_tint is not None:
        rgb = lum * np.array(mono_tint, dtype=np.float32) * 1.6
    else:
        rgb = lum + (rgb - lum) * sat
    rgb = np.clip(rgb * val * np.array(tint, dtype=np.float32), 0, 1)
    a[:, :3] = rgb
    out = bpy.data.images.new("_grade", w, h, alpha=False)
    out.pixels.foreach_set(a.ravel())
    out.filepath_raw = dst
    out.file_format = "JPEG"
    out.save(quality=quality)
    bpy.data.images.remove(out)
    bpy.data.images.remove(img)
    return dst


def _principled(mat):
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
    bake = nt.nodes.new("ShaderNodeTexImage")
    bake.name = bake.label = "BAKE"
    bake.location = (400, 300)
    return nt, bsdf


def pbr_material(name, base, normal, arm, tile, rough_scale=1.0, normal_strength=1.0):
    """Textured metal: base colour, OpenGL normal map and a packed AO/rough/metal map."""
    TILE[name] = tile
    mat = bpy.data.materials.new(name)
    nt, bsdf = _principled(mat)
    tb = nt.nodes.new("ShaderNodeTexImage")
    tb.image = load_image(base)
    tn = nt.nodes.new("ShaderNodeTexImage")
    tn.image = load_image(normal, True)
    ta = nt.nodes.new("ShaderNodeTexImage")
    ta.image = load_image(arm, True)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = normal_strength
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tb.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(ta.outputs["Color"], sep.inputs["Color"])
    if rough_scale != 1.0:
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = rough_scale
        mul.use_clamp = True
        nt.links.new(sep.outputs["Green"], mul.inputs[0])
        nt.links.new(mul.outputs["Value"], bsdf.inputs["Roughness"])
    else:
        nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
    for i, n in enumerate((tb, tn, ta, nm, sep)):
        n.location = (-900 + i * 180, -200 * (i % 3))
    return mat


def flat_material(name, rgb, metallic=0.0, rough=0.7, emit=None, strength=0.0, alpha=1.0):
    TILE[name] = 1.0
    mat = bpy.data.materials.new(name)
    _, bsdf = _principled(mat)
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        try:
            mat.surface_render_method = "BLENDED"
        except Exception:
            pass
    return mat


def set_emission(mat, strength):
    bsdf = next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is not None:
        bsdf.inputs["Emission Strength"].default_value = strength


# ---------------------------------------------------------------- mesh builder


class Mesh:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.verify()
        self.mats = []
        self.stack = [Matrix.Identity(4)]
        self.lights = []  # (world matrix, width, height, colour, watts, layer) for the bake

    def light(self, w, h, at=(0, 0, 0), rot=(0, 0, 0), color=(1, 1, 1), watts=10.0, layer="P"):
        """Notes a rectangular practical light. It shines along local -Z; rot=(-90°,0,0) aims it at -Y."""
        self.lights.append((self.M @ T(at, rot), w, h, color, watts, layer))

    # local frames -------------------------------------------------
    def push(self, M):
        self.stack.append(self.stack[-1] @ M)
        return self

    def pop(self):
        self.stack.pop()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.pop()

    def at(self, loc=(0, 0, 0), rot=(0, 0, 0)):
        return self.push(T(loc, rot))

    @property
    def M(self):
        return self.stack[-1]

    def _mi(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _project(self, faces, mat):
        s = TILE.get(mat, 1.0)
        for f in faces:
            f.normal_update()
            n = f.normal
            ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
            for loop in f.loops:
                c = loop.vert.co
                if az >= ax and az >= ay:
                    loop[self.uv].uv = (c.x / s, c.y / s)
                elif ax >= ay:
                    loop[self.uv].uv = (c.y / s, c.z / s)
                else:
                    loop[self.uv].uv = (c.x / s, c.z / s)

    def _add(self, part, M, mat, smooth=False):
        tmp = bpy.data.meshes.new("_part")
        part.to_mesh(tmp)
        part.free()
        nv, nf = len(self.bm.verts), len(self.bm.faces)
        self.bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        self.bm.verts.ensure_lookup_table()
        self.bm.faces.ensure_lookup_table()
        W = self.M @ M
        bmesh.ops.transform(self.bm, matrix=W, verts=self.bm.verts[nv:])
        faces = self.bm.faces[nf:]
        if W.determinant() < 0:
            bmesh.ops.reverse_faces(self.bm, faces=faces)
        real, swatch = PALETTE.get(mat, (mat, None))
        idx = self._mi(real)
        for f in faces:
            f.material_index = idx
            f.smooth = smooth
            if swatch is not None:
                for loop in f.loops:
                    loop[self.uv].uv = swatch
        if swatch is None:
            self._project(faces, mat)

    # primitives ---------------------------------------------------
    def box(self, size, at=(0, 0, 0), mat="wall", rot=(0, 0, 0), bevel=0.0, M=None):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
        if bevel > 0:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * 0.3), segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
        self._add(bm, M if M is not None else T(at, rot), mat)

    def cyl(self, r, h, at=(0, 0, 0), mat="steel", rot=(0, 0, 0), segs=10, r2=None, M=None, caps=True):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        self._add(bm, M if M is not None else T(at, rot), mat, True)

    def sph(self, r, at=(0, 0, 0), mat="steel", segs=10, rings=6, scale=(1, 1, 1), cut=None):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
        if cut is not None:
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut - 1e-5], context="VERTS")
        bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
        self._add(bm, T(at), mat, True)

    def tor(self, R, r, at=(0, 0, 0), mat="steel", rot=(0, 0, 0), major=16, minor=6):
        bm = bmesh.new()
        rings = []
        for i in range(major):
            a = 2 * math.pi * i / major
            rings.append([bm.verts.new(((R + r * math.cos(2 * math.pi * j / minor)) * math.cos(a), (R + r * math.cos(2 * math.pi * j / minor)) * math.sin(a), r * math.sin(2 * math.pi * j / minor))) for j in range(minor)])
        for i in range(major):
            for j in range(minor):
                bm.faces.new((rings[i][j], rings[(i + 1) % major][j], rings[(i + 1) % major][(j + 1) % minor], rings[i][(j + 1) % minor]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._add(bm, T(at, rot), mat, True)

    @staticmethod
    def _between(p0, p1):
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        return Matrix.Translation((p0 + p1) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4(), d.length

    def rod(self, p0, p1, r, mat="steel", segs=8, caps=True):
        M, length = self._between(p0, p1)
        if length > 1e-5:
            self.cyl(r, length, mat=mat, segs=segs, M=M, caps=caps)

    def beam(self, p0, p1, w, d, mat="struct", bevel=0.0):
        M, length = self._between(p0, p1)
        if length > 1e-5:
            self.box((w, d, length), mat=mat, bevel=bevel, M=M)

    def tube(self, pts, r, mat="steel", segs=8, joints=True):
        for a, b in zip(pts, pts[1:]):
            self.rod(a, b, r, mat, segs)
        if joints:
            for p in pts[1:-1]:
                self.sph(r * 1.02, p, mat, segs=segs, rings=4)

    def cable(self, p0, p1, sag, r=0.012, mat="rubber", n=7, segs=5):
        p0, p1 = Vector(p0), Vector(p1)
        pts = []
        for i in range(n + 1):
            t = i / n
            p = p0.lerp(p1, t)
            p.z -= sag * 4 * t * (1 - t)
            pts.append(p)
        for a, b in zip(pts, pts[1:]):
            M, length = self._between(a, b)
            self.cyl(r, length * 1.04, mat=mat, segs=segs, M=M, caps=False)

    def prism(self, pts, z0, z1, mat, M=None):
        """Extrudes a convex polygon (x, y points) along local Z."""
        bm = bmesh.new()
        lo = [bm.verts.new((x, y, z0)) for x, y in pts]
        hi = [bm.verts.new((x, y, z1)) for x, y in pts]
        bm.faces.new(lo)
        bm.faces.new(hi)
        n = len(pts)
        for i in range(n):
            bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._add(bm, M if M is not None else Matrix.Identity(4), mat)

    def quad(self, pts, mat, uvs=((0, 0), (1, 0), (1, 1), (0, 1)), project=False):
        """One quad from four local points, counter-clockwise seen from its front."""
        W = self.M
        verts = [self.bm.verts.new(W @ Vector(p)) for p in pts]
        if W.determinant() < 0:
            verts.reverse()
            uvs = tuple(reversed(uvs))
        face = self.bm.faces.new(verts)
        real, swatch = PALETTE.get(mat, (mat, None))
        face.material_index = self._mi(real)
        if swatch is not None:
            for loop in face.loops:
                loop[self.uv].uv = swatch
        elif project:
            self._project([face], mat)
        else:
            for loop, st in zip(face.loops, uvs):
                loop[self.uv].uv = st
        return face

    def panel(self, w, h, at=(0, 0, 0), rot=(0, 0, 0), mat="screen", project=False):
        """Quad in the local XY plane facing +Z; rot=(90°,0,0) makes it face -Y with +Z up."""
        self.push(T(at, rot))
        self.quad(((-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)), mat, project=project)
        self.pop()

    def text(self, body, size, at=(0, 0, 0), rot=(0, 0, 0), mat="emit_amber", extrude=0.002, align="CENTER"):
        """Font geometry lying in local XY, readable from +Z. rot=(90°,0,0) stands it on a wall facing -Y."""
        cu = bpy.data.curves.new("_txt", "FONT")
        cu.body = body
        cu.size = size
        cu.extrude = extrude
        cu.align_x = align
        cu.align_y = "CENTER"
        cu.resolution_u = 2
        ob = bpy.data.objects.new("_txt", cu)
        bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        bm = bmesh.new()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(cu)
        self._add(bm, T(at, rot), mat)

    def tris(self):
        return sum(len(f.verts) - 2 for f in self.bm.faces)

    def _emit(self, bm, name, materials, collection):
        me = bpy.data.meshes.new(name)
        bm.normal_update()
        bm.to_mesh(me)
        bm.free()
        me.set_sharp_from_angle(angle=rad(42))
        for m in self.mats:
            me.materials.append(materials[m])
        me.uv_layers[0].name = "UVMap"
        ob = bpy.data.objects.new(name, me)
        collection.objects.link(ob)
        return ob

    def finish(self, materials, collection):
        return self._emit(self.bm, self.name, materials, collection)

    def finish_split(self, materials, collection, detail_name, min_area=0.012, detail_mats=()):
        """Large faces keep the name and get baked lighting; small or emissive faces form a detail object."""
        forced = {i for i, m in enumerate(self.mats) if m in detail_mats}
        self.bm.faces.ensure_lookup_table()
        small = [f.index for f in self.bm.faces if f.material_index in forced or f.calc_area() < min_area]
        flag = set(small)
        big = self.bm.copy()
        big.faces.ensure_lookup_table()
        bmesh.ops.delete(big, geom=[f for f in big.faces if f.index in flag], context="FACES")
        det = self.bm
        det.faces.ensure_lookup_table()
        bmesh.ops.delete(det, geom=[f for f in det.faces if f.index not in flag], context="FACES")
        return self._emit(big, self.name, materials, collection), self._emit(det, detail_name, materials, collection)


def collection(name, parent=None):
    coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    target = parent or bpy.context.scene.collection
    if coll.name not in target.children:
        target.children.link(coll)
    return coll


def purge_all():
    for group in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights, bpy.data.collections):
        for block in list(group):
            group.remove(block)


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def unwrap_lightmap(obj, margin=0.003):
    """Adds the second UV set used by baked lighting."""
    me = obj.data
    if me.uv_layers.get("Lightmap") is None:
        me.uv_layers.new(name="Lightmap")
    # Index-based: assigning `uv_layers.active = layer` is silently ignored after a layer is added.
    me.uv_layers.active_index = me.uv_layers.find("Lightmap")
    me.uv_layers[0].active_render = True
    assert me.uv_layers.active.name == "Lightmap"
    select_only([obj])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=rad(66), island_margin=margin, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def use_gpu():
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        bpy.context.scene.cycles.device = "GPU"
        return [d.name for d in prefs.devices if d.use]
    except Exception as exc:  # CPU fallback keeps the build usable anywhere
        return ["CPU (%s)" % exc]
