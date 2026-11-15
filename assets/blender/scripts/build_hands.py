"""Original VORAX first-person industrial gloves. Blender 5.3; no work on import.

Root owns the live station. Call build(), audit(), export(), save_sources() explicitly.
Only tagged FP_HANDS data is replaced. No station builder, scene reset or master save.

Logical coordinates are camera coordinates: X right, Y up, Z forward. They are
converted with P(x,z,y)=(-x,-z,y), exactly like the environment pipeline. glTF/Babylon
perform the remaining handedness conversion. The authoring root is parked away from
the station; export() temporarily puts that root at the eye origin and restores it.

Design: fully covered anatomical work gloves, charcoal woven body, unequal tapered
fingers, opposed thumb, segmented dorsal guards, pale dirty textile sleeves. Geometry,
textures and animation are original procedural project work by Codex. The supplied
mano.webp informed broad silhouette/material cues only; no pixels/logos were copied.
"""

import contextlib
import json
import math
import os
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Quaternion, Vector


HERE = Path(__file__).resolve().parent
PROJECT = HERE.parents[2]
SOURCE = HERE.parent / "hands"
COLLECTION = "FP_HANDS"
TAG = "vorax_fp_hands_v1"
FPS = 30
PARK = Vector((42.0, 18.0, 2.0))
CONVERT = Matrix(((-1, 0, 0), (0, 0, -1), (0, 1, 0)))
CLIPS = {
    "Awaken": 3.2, "StandUp": 3.0, "Idle": 1.8, "Reach": .72,
    "PressTerminal": .9, "OperateSwitch": 1.1, "OperateDoor": .8,
    "Walk": 1.12, "Sprint": .72, "Inspect": 1.4,
}
CONTRACT = tuple(CLIPS)[:7]
FINGER_SPEC = (
    ("index", -.032, .097, .081, .0097),
    ("middle", -.0105, .102, .091, .0103),
    ("ring", .012, .098, .085, .0098),
    ("little", .032, .088, .068, .0084),
)
COLORS = {
    "glove": (.085, .092, .096, 1), "palm": (.045, .052, .054, 1),
    "sleeve": (.43, .405, .35, 1), "seam": (.15, .135, .105, 1),
    "guard": (.060, .068, .071, 1), "worn": (.18, .19, .18, 1),
    "amber": (.58, .225, .026, 1), "cyan": (.035, .24, .28, 1),
}
MATERIALS = ("MAT_FP_Woven", "MAT_FP_Grip", "MAT_FP_Guard", "MAT_FP_Accent")


def C(p):
    return CONVERT @ Vector(p)


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def mix(a, b, t):
    return a * (1.0 - t) + b * t


def _own(data):
    data[TAG] = True
    return data


def _collection():
    c = bpy.data.collections.get(COLLECTION)
    if c is not None and not c.get(TAG):
        raise RuntimeError("FP_HANDS exists without this generator's ownership tag")
    if c is None:
        c = _own(bpy.data.collections.new(COLLECTION))
        bpy.context.scene.collection.children.link(c)
    return c


@contextlib.contextmanager
def _context():
    """Preserve artist selection/mode and the station's timeline/render settings."""
    scene = bpy.context.scene
    active = bpy.context.view_layer.objects.active
    selected = list(bpy.context.selected_objects)
    mode = active.mode if active else "OBJECT"
    keep = (scene.frame_current, scene.frame_subframe, scene.frame_start, scene.frame_end,
            scene.render.fps, scene.render.fps_base)
    if active and mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    try:
        yield
    finally:
        scene.frame_start, scene.frame_end = keep[2:4]
        scene.render.fps, scene.render.fps_base = keep[4:6]
        scene.frame_set(keep[0], subframe=keep[1])
        for ob in bpy.context.selected_objects:
            ob.select_set(False)
        for ob in selected:
            if ob.name in bpy.context.view_layer.objects:
                ob.select_set(True)
        if active and active.name in bpy.context.view_layer.objects:
            bpy.context.view_layer.objects.active = active
            if mode != "OBJECT":
                bpy.ops.object.mode_set(mode=mode)


def _image(name, rgb, non_color=False):
    SOURCE.mkdir(parents=True, exist_ok=True)
    path = SOURCE / (name + ".png")
    old = bpy.data.images.get(name)
    if old is not None:
        if not old.get(TAG):
            raise RuntimeError("Refusing to replace unowned image " + name)
        bpy.data.images.remove(old)
    h, w, _ = rgb.shape
    image = _own(bpy.data.images.new(name, w, h, alpha=False))
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[:, :, :3] = np.clip(rgb, 0, 1)
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    return image


def textures(size=1024):
    """Deterministic original twill, fine scuff and packed rough/metal textures."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / size
    rng = np.random.default_rng(617204)
    # Seamless periodic weave: alternating warp/weft plus fine spun-thread variation.
    warp = np.sin(2 * math.pi * 64 * x)
    weft = np.sin(2 * math.pi * 64 * y)
    twill = np.sin(2 * math.pi * 32 * (x + y))
    fine = rng.random((size, size), dtype=np.float32) - .5
    broad = np.sin(2 * math.pi * (3 * x + 2 * y)) * np.sin(2 * math.pi * (x - 3 * y))
    h = .30 * warp * weft + .17 * twill + .035 * fine
    grime = np.zeros_like(x)
    scratches = np.zeros_like(x)
    for _ in range(11):
        cx, cy = rng.random(2)
        dx, dy = (x - cx + .5) % 1 - .5, (y - cy + .5) % 1 - .5
        rx, ry = rng.uniform(.018, .065), rng.uniform(.025, .085)
        grime += rng.uniform(.045, .13) * np.exp(-((dx / rx) ** 2 + (dy / ry) ** 2) * 1.7)
    for _ in range(32):
        cx, cy = rng.random(2)
        a = rng.uniform(-math.pi, math.pi)
        dx, dy = (x - cx + .5) % 1 - .5, (y - cy + .5) % 1 - .5
        along = dx * math.cos(a) + dy * math.sin(a)
        across = -dx * math.sin(a) + dy * math.cos(a)
        width, length = rng.uniform(.00035, .0008), rng.uniform(.018, .075)
        fade = np.clip(1 - np.abs(along) / (length * .5), 0, 1)
        scratches += np.exp(-(across / width) ** 2) * fade * rng.uniform(.35, 1)
    scratches = np.clip(scratches, 0, 1)
    h -= scratches * .012
    value = np.clip(.81 + .075 * broad + .045 * twill + .035 * fine - grime + scratches * .045, .52, .96)
    base = np.stack((value, value * .992 - grime * .06, value * .975 - grime * .12), axis=-1)
    dy, dx = np.gradient(h)
    n = np.stack((-dx * 4.0, -dy * 4.0, np.ones_like(x)), axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    normal = n * .5 + .5
    orm = np.stack((np.ones_like(x), np.clip(.90 + .065 * broad + .025 * fine + grime * .25 - scratches * .08, .70, 1), np.zeros_like(x)), axis=-1)
    return {
        "base": _image("FP_weave_base", base),
        "normal": _image("FP_weave_normal", normal, True),
        "orm": _image("FP_weave_orm", orm, True),
    }


def materials(images):
    result = []
    for index, name in enumerate(MATERIALS):
        old = bpy.data.materials.get(name)
        if old is not None:
            if not old.get(TAG):
                raise RuntimeError("Refusing to replace unowned material " + name)
            bpy.data.materials.remove(old)
        mat = _own(bpy.data.materials.new(name))
        mat.use_nodes = True
        mat.use_backface_culling = True
        nt = mat.node_tree
        bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = images["base"]
        vertex = nt.nodes.new("ShaderNodeVertexColor")
        vertex.layer_name = "Color"
        multiply = nt.nodes.new("ShaderNodeMixRGB")
        multiply.blend_type = "MULTIPLY"
        multiply.inputs[0].default_value = 1
        nt.links.new(tex.outputs["Color"], multiply.inputs[1])
        nt.links.new(vertex.outputs["Color"], multiply.inputs[2])
        nt.links.new(multiply.outputs["Color"], bsdf.inputs["Base Color"])
        rough = nt.nodes.new("ShaderNodeTexImage")
        rough.image = images["orm"]
        separate = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(rough.outputs["Color"], separate.inputs["Color"])
        scale = nt.nodes.new("ShaderNodeMath")
        scale.operation = "MULTIPLY"
        scale.inputs[1].default_value = (.96, .91, .70, .64)[index]
        nt.links.new(separate.outputs["Green"], scale.inputs[0])
        nt.links.new(scale.outputs[0], bsdf.inputs["Roughness"])
        bsdf.inputs["Metallic"].default_value = .20 if index == 2 else 0
        normal_tex = nt.nodes.new("ShaderNodeTexImage")
        normal_tex.image = images["normal"]
        normal = nt.nodes.new("ShaderNodeNormalMap")
        normal.inputs["Strength"].default_value = (.75, .24, .10, .08)[index]
        nt.links.new(normal_tex.outputs["Color"], normal.inputs["Color"])
        nt.links.new(normal.outputs["Normal"], bsdf.inputs["Normal"])
        # Blender 5.3's glTF sheen exporter treats nonzero Weight as an on/off
        # switch and exports the white Tint at full strength. That coat washes
        # charcoal textile into pale grey. Weave/normal/roughness carry the fabric.
        bsdf.inputs["Sheen Weight"].default_value = 0
        bsdf.inputs["Specular IOR Level"].default_value = .28
        result.append(mat)
    return result


class Surface:
    """Closed smooth loft components accumulated into one skinned, four-material mesh."""
    def __init__(self):
        self.vertices, self.faces, self.weights = [], [], []
        self.colors, self.uv, self.indices = [], [], []

    def vertex(self, co, weights, color, uv):
        self.vertices.append(C(co))
        self.weights.append(weights)
        self.colors.append(color)
        self.uv.append(uv)
        return len(self.vertices) - 1

    def face(self, indices, material):
        self.faces.append(tuple(indices))
        self.indices.append(material)

    def loft(self, rings, material, color, sides=20, caps=True, uv_scale=18):
        """rings: (center, transverse, dorsal, rx, ry, weights); axes in logical space."""
        rows = []
        along = 0.0
        prev = None
        for ri, (center, transverse, dorsal, rx, ry, weights) in enumerate(rings):
            center, transverse, dorsal = Vector(center), Vector(transverse), Vector(dorsal)
            if prev is not None:
                along += (center - prev).length
            prev = center
            row = []
            for k in range(sides):
                a = 2 * math.pi * k / sides
                # Subtle stitched/worked asymmetry, not a perfect cylindrical cartoon.
                ripple = 1.0 + .018 * math.sin(3 * a + ri * .8)
                point = center + transverse * (rx * math.cos(a) * ripple) + dorsal * (ry * math.sin(a) * ripple)
                dirt = .91 + .09 * math.sin(a * 2 + ri * .45) ** 2
                col = tuple(v * dirt if i < 3 else v for i, v in enumerate(color))
                if material == 2:
                    edge = ri in (0, len(rings) - 1) or abs(math.cos(a)) > .88
                    scatter = math.sin(ri * 17.3 + k * 31.7) * .5 + .5
                    wear = (.16 + scatter * .22) if edge and scatter > .57 else 0
                    col = tuple(mix(col[i], COLORS["worn"][i], wear) if i < 3 else 1 for i in range(4))
                row.append(self.vertex(point, weights, col, (k / sides * 2 * math.pi * max(rx, ry) * uv_scale, along * uv_scale)))
            rows.append(row)
        for a, b in zip(rows, rows[1:]):
            for k in range(sides):
                self.face((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k]), material)
        if caps:
            for row, ring, reverse in ((rows[0], rings[0], True), (rows[-1], rings[-1], False)):
                center, _, _, _, _, weights = ring
                mid = self.vertex(center, weights, color, (.5, .5))
                for k in range(sides):
                    tri = (mid, row[k], row[(k + 1) % sides])
                    self.face(tri[::-1] if reverse else tri, material)

    def tube(self, points, radius, weights, material, color, sides=7):
        rings = []
        for i, p in enumerate(points):
            tangent = Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(0, i - 1)])
            tangent.normalize()
            dorsal = Vector((0, 1, 0))
            if abs(tangent.dot(dorsal)) > .95:
                dorsal = Vector((1, 0, 0))
            cross = tangent.cross(dorsal).normalized()
            dorsal = cross.cross(tangent).normalized()
            rings.append((p, cross, dorsal, radius, radius, weights))
        self.loft(rings, material, color, sides)

    def finish(self, name, collection, rig, mats):
        mesh = _own(bpy.data.meshes.new(name))
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        # Recalculate on closed components, preserving all authored UV and skin values.
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        uv = mesh.uv_layers.new(name="UVMap")
        attr = mesh.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
        mesh.color_attributes.active_color = attr
        for i, col in enumerate(self.colors):
            attr.data[i].color = col
        for poly, mat in zip(mesh.polygons, self.indices):
            poly.material_index = mat
            poly.use_smooth = True
            for li in poly.loop_indices:
                uv.data[li].uv = self.uv[mesh.loops[li].vertex_index]
        for mat in mats:
            mesh.materials.append(mat)
        ob = _own(bpy.data.objects.new(name, mesh))
        collection.objects.link(ob)
        ob.parent = rig
        groups = {}
        for i, weights in enumerate(self.weights):
            total = sum(weights.values())
            for bone, weight in weights.items():
                if weight > 1e-6:
                    group = groups.setdefault(bone, ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone))
                    group.add([i], weight / total, "REPLACE")
        modifier = ob.modifiers.new("FP anatomical skin", "ARMATURE")
        modifier.object = rig
        modifier.use_deform_preserve_volume = False  # glTF uses linear skinning as well
        return ob


def _digit(side, name, x, z, length, radius):
    # Fanning starts at the metacarpals, rather than four parallel identical pipes.
    spread = {"index": -.055, "middle": -.015, "ring": .028, "little": .095}[name] * side
    direction = Vector((math.sin(spread), 0, math.cos(spread)))
    return {"name": name, "base": Vector((x * side, -.001, z)), "direction": direction,
            "lengths": [length * .45, length * .30, length * .25], "radius": radius}


def _digits(side):
    result = [_digit(side, *spec) for spec in FINGER_SPEC]
    result.append({"name": "thumb", "base": Vector((-.037 * side, -.006, .027)),
                   "direction": Vector((-.67 * side, -.055, .74)).normalized(),
                   "lengths": [.028, .024, .023], "radius": .0118})
    return result


def _bone_names(side, digit):
    return ["FP_%s_%s_%d" % (side, digit, i + 1) for i in range(3)]


def _weights(distance, lengths, names, wrist):
    if distance < .009:
        v = smooth(max(0, distance) / .009)
        return {wrist: 1 - v, names[0]: v}
    boundary = 0
    for i in range(2):
        boundary += lengths[i]
        if distance < boundary - .005:
            return {names[i]: 1}
        if distance <= boundary + .005:
            v = smooth((distance - boundary + .005) / .010)
            return {names[i]: 1 - v, names[i + 1]: v}
    return {names[2]: 1}


def _elbow(side):
    """Proximal sleeve anchor remains below/behind the camera's visible frustum."""
    return Vector((.34 * side, -.48, .11))


def _sleeve_weights(t, wrist, forearm):
    amount = smooth((t - .70) / .30)
    return {forearm: 1 - amount, wrist: amount}


def _hand_geometry(side, base):
    s, label = Surface(), "R" if side > 0 else "L"
    wrist, forearm = "FP_wrist_" + label, "FP_forearm_" + label
    base = Vector(base)
    transverse, dorsal = Vector((1, 0, 0)), Vector((0, 1, 0))
    def ring(center, rx, ry, weights):
        return (base + Vector(center), transverse, dorsal, rx, ry, weights)
    # A broad metacarpal fan and low wrist tunnel give the palm its human silhouette.
    profile = [(-.025, .031, .018), (-.012, .034, .020), (.004, .037, .022),
               (.023, .041, .024), (.045, .045, .0245), (.066, .046, .024),
               (.085, .0455, .022), (.099, .043, .0185), (.105, .040, .012)]
    s.loft([ring((0, .001 if z > .02 else 0, z), rx, ry, {wrist: 1}) for z, rx, ry in profile], 0, COLORS["glove"], 32)
    # Thenar pad sits inside the thumb/palm overlap; a visible rounded thumb root.
    names = _bone_names(label, "thumb")
    thenar = []
    for k in range(9):
        t = k / 8
        rz = .004 + .014 * math.sin(math.pi * t)
        thenar.append(ring((-.026 * side, -.010, .012 + .059 * t), .009 + .013 * math.sin(math.pi * t), rz, {wrist: .85, names[0]: .15}))
    s.loft(thenar, 1, COLORS["palm"], 20)
    # Sleeve runs from an anchored proximal end to the wrist. Its forearm bone
    # has an independent root parent; gestures cannot drag a capped tube forward.
    elbow = _elbow(side)
    arm_direction = (base - elbow).normalized()
    arm_across = Vector((arm_direction.z, 0, -arm_direction.x)).normalized()
    arm_up = arm_direction.cross(arm_across).normalized()
    sleeve = []
    for k in range(21):
        t = k / 20
        fold = .0025 * math.sin(t * math.pi * 12) * math.sin(math.pi * t) ** .5
        rx = mix(.058, .035, smooth(t)) + fold
        ry = mix(.045, .024, smooth(t)) + fold * .7
        center = elbow.lerp(base, t * .94)
        sleeve.append((center, arm_across, arm_up, rx, ry, _sleeve_weights(t, wrist, forearm)))
    s.loft(sleeve, 0, COLORS["sleeve"], 28)
    # Soft compression cuff plus a scalloped graphite wrist guard.
    s.loft([ring((0, 0, z), rx, ry, {wrist: 1}) for z, rx, ry in
            [(-.052, .038, .027), (-.046, .040, .029), (-.023, .0375, .0275), (-.017, .0345, .023)]], 1, COLORS["palm"], 28)
    s.loft([ring((0, .005, z), rx, ry, {wrist: 1}) for z, rx, ry in
            [(-.046, .0385, .026), (-.040, .041, .029), (-.025, .038, .028), (-.021, .035, .024)]], 2, COLORS["guard"], 28)
    # Accent cuff welt is a dimensional seam, not a coplanar decal.
    s.loft([ring((0, 0, z), .0405, .0298, {wrist: 1}) for z in (-.043, -.040)], 3, COLORS["amber"], 28)
    # Dorsal palm guard, low domed lens profile above the woven shell.
    palm_pad = [ring((.003 * side, .0235, z), rx, ry, {wrist: 1}) for z, rx, ry in
                [(.023, .018, .0015), (.030, .027, .004), (.054, .031, .005), (.077, .030, .0045), (.086, .021, .0015)]]
    s.loft(palm_pad, 2, COLORS["guard"], 20)
    for j, digit in enumerate(_digits(side)):
        names = _bone_names(label, digit["name"])
        d, p0 = digit["direction"], digit["base"]
        across = Vector((d.z, 0, -d.x)).normalized()
        up = d.cross(across).normalized()
        total, radius = sum(digit["lengths"]), digit["radius"]
        # Dense rings at the joints make the flex crease deform smoothly, without boxes.
        distances = sorted(set([-.006, 0, .006, .012] + [total * k / 15 for k in range(1, 16)] +
                               [sum(digit["lengths"][:i]) + v for i in (1, 2) for v in (-.005, 0, .005)]))
        rings = []
        for distance in distances:
            t = max(0, distance) / total
            taper = (1 - .29 * t) * (1 - .73 * smooth((t - .91) / .09))
            crease = 1.0
            for joint in (digit["lengths"][0], sum(digit["lengths"][:2])):
                crease -= .07 * math.exp(-((distance - joint) / .003) ** 2)
            center = base + p0 + d * distance
            center.y += .001 * math.sin(math.pi * t)
            rings.append((center, across, up, radius * taper * crease, radius * .91 * taper * crease,
                          _weights(distance, digit["lengths"], names, wrist)))
        s.loft(rings, 0, COLORS["glove"], 18)
        # Three separate rounded dorsal impact pads follow the phalanges, not the gaps.
        start = .011
        for segment, length in enumerate(digit["lengths"]):
            end = sum(digit["lengths"][:segment + 1]) - .005
            begin = max(start, sum(digit["lengths"][:segment]) + .005)
            pad = []
            for k in range(7):
                t = k / 6
                distance = mix(begin, end, t)
                pr = radius * (1 - .27 * distance / total)
                center = base + p0 + d * distance + up * (pr * .92 + .0017)
                pad.append((center, across, up, pr * (.28 + .52 * math.sin(math.pi * t)),
                            .0012 + .0021 * math.sin(math.pi * t), {names[segment]: 1}))
            s.loft(pad, 2, COLORS["guard"], 12)
            start = end + .009
        # Soft grip strips on the palmar phalanges; gaps coincide with true joints.
        for segment, length in enumerate(digit["lengths"]):
            a = sum(digit["lengths"][:segment]) + .007
            b = sum(digit["lengths"][:segment + 1]) - .006
            if b <= a:
                continue
            grip = []
            for k in range(5):
                t = k / 4
                distance = mix(a, b, t)
                rr = radius * (1 - .3 * distance / total)
                center = base + p0 + d * distance - up * (rr * .92 + .0012)
                grip.append((center, across, up, rr * (.4 + .25 * math.sin(math.pi * t)),
                             .0008 + .0012 * math.sin(math.pi * t), {names[segment]: 1}))
            s.loft(grip, 1, COLORS["palm"], 10)
    # Raised wrist/forearm seams make construction legible from first-person distance.
    for sign in (-1, 1):
        points = []
        for k in range(10):
            t = k / 9
            center = elbow.lerp(base, .10 + .55 * t)
            points.append(center + arm_across * (sign * mix(.045, .034, smooth(t))) + arm_up * .022)
        s.tube(points, .0010, {forearm: 1}, 0, COLORS["seam"], 6)
    # A small asymmetric textile identification tab: abstract blocks, no copied insignia.
    for j in range(3):
        center = elbow.lerp(base, .62 - j * .026) + arm_up * .036
        rr = [(center + arm_direction * d, arm_across, arm_up, .014 if j == 0 else .009,
               .0015, {forearm: 1}) for d in (-.002, .002)]
        s.loft(rr, 3, COLORS["amber"] if j < 2 else COLORS["cyan"], 10)
    return s


def _rig(collection, parent):
    arm = _own(bpy.data.armatures.new("SK_FP_Hands"))
    rig = _own(bpy.data.objects.new("SK_FP_Hands", arm))
    collection.objects.link(rig)
    rig.parent = parent
    rig.show_in_front = True
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    root = arm.edit_bones.new("FP_root")
    root.head, root.tail = (0, 0, 0), (0, 0, .05)
    root.use_deform = False
    for side in (-1, 1):
        label = "R" if side > 0 else "L"
        base = Vector((.23 * side, -.32, .48))
        wrist = arm.edit_bones.new("FP_wrist_" + label)
        wrist.head, wrist.tail = C(base), C(base + Vector((0, 0, .095)))
        wrist.parent = root
        wrist.align_roll(C((0, 1, 0)))
        forearm = arm.edit_bones.new("FP_forearm_" + label)
        forearm.head, forearm.tail = C(_elbow(side)), C(base)
        forearm.parent = root
        forearm.align_roll(C((0, 1, 0)))
        for digit in _digits(side):
            p = base + digit["base"]
            prev = wrist
            for name, length in zip(_bone_names(label, digit["name"]), digit["lengths"]):
                bone = arm.edit_bones.new(name)
                bone.head, bone.tail = C(p), C(p + digit["direction"] * length)
                bone.parent = prev
                bone.use_connect = prev != wrist
                bone.align_roll(C((0, 1, 0)))
                p += digit["direction"] * length
                prev = bone
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    return rig


def _pulse(t, a=.08, peak=.42, hold=.55, end=.96):
    if t < peak:
        return smooth((t - a) / (peak - a))
    if t < hold:
        return 1.0
    return 1 - smooth((t - hold) / (end - hold))


def _rest(side):
    return {"p": Vector((.23 * side, -.32, .48)),
            "r": Vector((.10, -.18 * side, -.08 * side)),
            "curl": [.20, .25, .29, .33, .22], "forearm": 0.0,
            "elbow": _elbow(side)}


def _pose(name, t, side):
    """Spline-eased camera-space wrist path, plus independent anatomical flex."""
    h = _rest(side)
    seconds = t * CLIPS[name]
    phase = t * math.tau
    if name in ("Idle", "Walk", "Sprint"):
        if name == "Idle":
            h["p"].y += math.sin(phase + (0 if side > 0 else .35)) * .0022
            h["r"].x += math.sin(phase) * .006
        else:
            a = .007 if name == "Walk" else .016
            h["p"].y += math.cos(phase * 2) * a
            h["p"].z += math.sin(phase) * a * side
            h["p"].x += math.cos(phase) * a * .3
            h["r"].x += math.sin(phase) * a * 2
            if name == "Sprint":
                h["p"] += Vector((-.035 * side, .025, -.045))
                h["r"].x += .12
                h["curl"] = [.38, .43, .47, .49, .30]
    elif name == "Awaken":
        # Camera remains .24m high with .9rad downward pitch throughout this clip.
        u = smooth(t / .42)
        v = smooth((t - .64) / .36)
        h["elbow"] = Vector((.34 * side, (.20 - .24) * math.cos(.9) - .10 * math.sin(.9),
                             -(.20 - .24) * math.sin(.9) - .10 * math.cos(.9)))
        if side > 0:
            start = Vector((.23, -.04, .24))
            raised = Vector((.14, .06, .26))
            planted = Vector((.27, .10, .35))
            h["p"] = start.lerp(raised, u).lerp(planted, v)
            # Supination turns the palmar -Y normal toward camera -Z while fingers
            # point up in the image, then the complete hand turns onto the floor.
            h["r"] = Vector((-.9, 0, 0)).lerp(Vector((1.10, -.12, 3.0)), u).lerp(Vector((-.9, 0, 0)), v)
            h["forearm"] = mix(.24 * (1 - u), .24, v)
            h["curl"] = [mix(.03, .0, v)] * 5
        else:
            planted = Vector((-.27, .10, .35))
            h["p"] = Vector((-.25, -.04, .24)).lerp(planted, smooth((t - .18) / .48))
            h["r"] = Vector((-.9, 0, 0))
            h["forearm"] = .24
            h["curl"] = [.04, .02, .03, .08, .04]
        # Measured on the deformed padded glove, not just the wrist control:
        # lift the complete trajectory 18 mm in world Y to clear the floor.
        # Lift before supinating, then lower after the turn; fingertips sweep an
        # arc during both turns and must not pass through the floor between keys.
        lift = .018 + (.135 * (math.sin(math.pi*u)**2 + math.sin(math.pi*v)**2) if side > 0 else 0)
        h["p"] += Vector((0, lift * math.cos(.9), -lift * math.sin(.9)))
    elif name == "StandUp":
        release = smooth((seconds - .48) / .90)
        rise = min(1, max(0, seconds / 3.0))
        height, pitch = .24 + 1.41 * rise, .9 * (1 - rise)
        # Fixed support point in world-relative X/Z, inverse camera transform.
        floor_z = .35 * math.cos(.9) + .10 * math.sin(.9)
        floor_y = .046  # includes measured padded-mesh thickness during support
        local_y = (floor_y - height) * math.cos(pitch) + floor_z * math.sin(pitch)
        local_z = -(floor_y - height) * math.sin(pitch) + floor_z * math.cos(pitch)
        support = Vector((.27 * side, local_y, local_z))
        h["p"] = support.lerp(h["p"], release)
        release_lift = .018 * math.sin(math.pi*release)**2
        h["p"] += Vector((0, release_lift*math.cos(pitch), -release_lift*math.sin(pitch)))
        h["r"] = Vector((-pitch, 0, 0)).lerp(h["r"], release)
        h["forearm"] = .24 * (1 - release)
        planted_elbow = Vector((.34 * side, (.20 - height) * math.cos(pitch) - .10 * math.sin(pitch),
                                -(.20 - height) * math.sin(pitch) - .10 * math.cos(pitch)))
        h["elbow"] = planted_elbow.lerp(_elbow(side), release)
        h["curl"] = [c * release for c in h["curl"]]
    elif name == "Inspect":
        amount = _pulse(t, .03, .23, .72, .98)
        h["p"] += Vector((-.095 * side, .13, .02)) * amount
        h["r"] += Vector((-.65, -.20 * side, .28 * side)) * amount
        h["curl"] = [mix(c, .08 + .035 * i, amount) for i, c in enumerate(h["curl"])]
    elif side > 0:
        amount = _pulse(t)
        destinations = {"Reach": (.12, -.22, .55), "PressTerminal": (.11, -.19, .565),
                        "OperateSwitch": (.12, -.20, .55), "OperateDoor": (.14, -.19, .56)}
        h["p"] = h["p"].lerp(Vector(destinations[name]), amount)
        h["r"] += Vector((-.05, -.12, .03)) * amount
        if name == "PressTerminal":
            h["curl"] = [mix(h["curl"][i], c, amount) for i, c in enumerate((.02, .76, .84, .88, .60))]
            h["p"].z += .015 * _pulse(t, .34, .50, .55, .67)
        elif name == "OperateSwitch":
            grip = _pulse(t, .15, .38, .58, .84)
            h["curl"] = [mix(c, .78, grip) for c in h["curl"]]
            h["p"].y -= .095 * _pulse(t, .39, .54, .59, .76)
            h["r"].x -= .14 * grip
        elif name == "OperateDoor":
            h["curl"] = [mix(c, .10, amount) for c in h["curl"]]
            h["p"].z += .014 * _pulse(t, .35, .50, .55, .67)
        else:
            h["curl"] = [mix(c, .09, amount) for c in h["curl"]]
    return h


def _rotation(pb, logical):
    rest = pb.bone.matrix_local.to_3x3()
    return (rest.inverted() @ CONVERT @ logical @ CONVERT.inverted() @ rest).to_quaternion()


def _aim_forearm(pb, elbow, wrist, wrist_rotation):
    """Aim a root-parented deform bone from anchored sleeve end to the wrist.

    Axial stretch is intentional so the visible cloth remains continuous while
    the elbow stays out of frame. The distal skin blends into the wrist bone.
    """
    head, tail = C(elbow), C(wrist)
    direction = tail - head
    length = direction.length
    y = direction.normalized()
    # Supination belongs to the whole forearm. A fixed world-up roll leaves
    # cloth and glove frames 180 degrees apart when the palm turns upward;
    # linear skinning then collapses the weighted transition into a wrapper.
    # Track wrist transverse X around the longitudinal axis instead.
    hand_rotation = CONVERT @ Euler(wrist_rotation, "XYZ").to_matrix() @ CONVERT.inverted()
    transverse = hand_rotation @ C((1, 0, 0))
    x = transverse - y * y.dot(transverse)
    if x.length < .01:
        dorsal = hand_rotation @ C((0, 1, 0))
        z = (dorsal - y * y.dot(dorsal)).normalized()
        x = y.cross(z).normalized()
    else:
        x.normalize()
    z = x.cross(y).normalized()
    rotation = Matrix((x, y, z)).transposed().to_4x4()
    rotation.translation = head
    desired = rotation @ Matrix.Diagonal((1, length / pb.bone.length, 1, 1))
    pb.matrix_basis = pb.bone.matrix_local.inverted() @ desired


def _apply(rig, name, t):
    for side in (-1, 1):
        label = "R" if side > 0 else "L"
        pose = _pose(name, t, side)
        wrist = rig.pose.bones["FP_wrist_" + label]
        delta = C(pose["p"] - Vector((.23 * side, -.32, .48)))
        wrist.location = wrist.bone.matrix_local.to_3x3().inverted() @ delta
        wrist.rotation_quaternion = _rotation(wrist, Euler(pose["r"], "XYZ").to_matrix())
        forearm = rig.pose.bones["FP_forearm_" + label]
        _aim_forearm(forearm, pose["elbow"], pose["p"], pose["r"])
        for digit_index, digit in enumerate(_digits(side)):
            flex = pose["curl"][digit_index]
            axis = Vector((digit["direction"].z, 0, -digit["direction"].x)).normalized()
            for segment, bone_name in enumerate(_bone_names(label, digit["name"])):
                pb = rig.pose.bones[bone_name]
                angle = flex * (1.05, 1.35, .85)[segment]
                rotation = Quaternion(axis, angle).to_matrix()
                if digit["name"] == "thumb" and segment == 0:
                    rotation = Quaternion(Vector((0, 1, 0)), .35 * flex * side).to_matrix() @ rotation
                pb.rotation_quaternion = _rotation(pb, rotation)


def _fcurves(action):
    if hasattr(action, "fcurves"):
        return action.fcurves
    return [f for layer in action.layers for strip in layer.strips
            for bag in getattr(strip, "channelbags", ()) for f in bag.fcurves]


def animate(rig):
    rig.animation_data_create()
    for name, duration in CLIPS.items():
        action = _own(bpy.data.actions.new(name))
        action.use_fake_user = True
        action["duration_seconds"] = duration
        action["fps"] = FPS
        rig.animation_data.action = action
        end = max(1, round(duration * FPS))
        for frame in range(end + 1):
            _apply(rig, name, frame / end)
            for pb in rig.pose.bones:
                if pb.name == "FP_root":
                    continue
                pb.keyframe_insert(data_path="rotation_quaternion", frame=frame, group=pb.name)
                if pb.name.startswith(("FP_wrist_", "FP_forearm_")):
                    pb.keyframe_insert(data_path="location", frame=frame, group=pb.name)
                    pb.keyframe_insert(data_path="scale", frame=frame, group=pb.name)
        # Dense 30fps sampling preserves spline paths and gives glTF safe quaternion interpolation.
        for curve in _fcurves(action):
            for key in curve.keyframe_points:
                key.interpolation = "LINEAR"
        track = rig.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 0, action)
        track.mute = True
    rig.animation_data.action = bpy.data.actions["Idle"]
    _apply(rig, "Idle", 0)


def build():
    """Create/replace only owned FP_HANDS; park it outside the station. Explicit mutation."""
    for name in CLIPS:
        old = bpy.data.actions.get(name)
        if old is not None and not old.get(TAG):
            raise RuntimeError("Reserved animation name already belongs to other artwork: " + name)
    with _context():
        coll = _collection()
        for ob in list(coll.objects):
            if not ob.get(TAG):
                raise RuntimeError("FP_HANDS contains unowned artwork; refusing replacement")
        for ob in list(coll.objects):
            data = ob.data
            bpy.data.objects.remove(ob, do_unlink=True)
            if data and data.users == 0:
                if isinstance(data, bpy.types.Mesh):
                    bpy.data.meshes.remove(data)
                elif isinstance(data, bpy.types.Armature):
                    bpy.data.armatures.remove(data)
        for action in list(bpy.data.actions):
            if action.get(TAG):
                bpy.data.actions.remove(action)
        for ob in bpy.context.selected_objects:
            ob.select_set(False)
        root = _own(bpy.data.objects.new("FP_HANDS_ROOT", None))
        coll.objects.link(root)
        root.location = PARK
        rig = _rig(coll, root)
        mats = materials(textures())
        for side in (-1, 1):
            label = "R" if side > 0 else "L"
            surface = _hand_geometry(side, (.23 * side, -.32, .48))
            surface.finish("SM_FP_Glove_" + label, coll, rig, mats)
        animate(rig)
        # Prevent this parked authoring asset from affecting station renders/bakes.
        coll.hide_render = True
        root["description"] = "Original fully covered industrial work gloves and sleeves"
        root["logical_coordinates"] = "camera X right,Y up,Z forward -> Blender(-x,-z,y)"
        root["clips"] = json.dumps(CLIPS)
        bpy.context.view_layer.update()
        return audit()


def audit():
    """Read-only geometry/skin/material/clip budget report, raising no implicit repairs."""
    coll = bpy.data.collections[COLLECTION]
    report = {"triangles": 0, "materials": [], "objects": [], "issues": [], "clips": {}}
    mats = set()
    rig = bpy.data.objects["SK_FP_Hands"]
    for ob in coll.objects:
        if ob.type != "MESH":
            continue
        me = ob.data
        me.calc_loop_triangles()
        triangles = len(me.loop_triangles)
        report["triangles"] += triangles
        mats.update(m.name for m in me.materials if m)
        bm = bmesh.new()
        bm.from_mesh(me)
        boundaries = sum(e.is_boundary for e in bm.edges)
        nonmanifold = sum(not e.is_manifold for e in bm.edges)
        degenerate = sum(f.calc_area() < 1e-12 for f in bm.faces)
        loose = sum(not v.link_edges for v in bm.verts)
        bm.free()
        unweighted = sum(not v.groups or abs(sum(g.weight for g in v.groups) - 1) > .002 for v in me.vertices)
        max_influences = max((len(v.groups) for v in me.vertices), default=0)
        result = {"name": ob.name, "triangles": triangles, "vertices": len(me.vertices),
                  "boundary_edges": boundaries, "nonmanifold_edges": nonmanifold,
                  "degenerate_faces": degenerate, "loose_vertices": loose,
                  "unweighted_vertices": unweighted, "max_influences": max_influences,
                  "uv_layers": [u.name for u in me.uv_layers]}
        report["objects"].append(result)
        if boundaries or nonmanifold or degenerate or loose or unweighted or max_influences > 4:
            report["issues"].append(ob.name + ": invalid topology/skin; inspect object report")
    report["materials"] = sorted(mats)
    report["bones"] = len(rig.data.bones)
    report["anatomy_metres"] = {
        "palm_width": .092,
        "finger_lengths": {d[0]: d[3] for d in FINGER_SPEC},
        "thumb_length": .075,
        "thumb_has_three_joints": all(n in rig.data.bones for n in _bone_names("R", "thumb")),
        "little_shorter_than_middle": FINGER_SPEC[3][3] < FINGER_SPEC[1][3],
    }
    for name, seconds in CLIPS.items():
        action = bpy.data.actions.get(name)
        report["clips"][name] = {"present": bool(action and action.get(TAG)), "reference_seconds": seconds,
                                "frame_range": list(action.frame_range) if action else None}
        if not action or not action.get(TAG):
            report["issues"].append("Missing clip " + name)
    if report["triangles"] > 30000:
        report["issues"].append("Pair exceeds 30000 triangle budget")
    if len(mats) > 4:
        report["issues"].append("Pair exceeds four material budget")
    report["uv_note"] = "Intentional periodic textile UV overlap; unique atlas packing is inapplicable to tiling materials"
    report["lod_note"] = "Fixed-distance first-person viewmodel; no world-distance LOD is delivered"
    report["status"] = "PASS" if not report["issues"] else "FAIL"
    return report


def export(path=None):
    """Audit then export only hand geometry/skeleton/actions; restore authoring location/state."""
    report = audit()
    if report["issues"]:
        raise RuntimeError(json.dumps(report["issues"]))
    path = Path(path) if path else PROJECT / "public/assets/models/player-hands.glb"
    path.parent.mkdir(parents=True, exist_ok=True)
    root = bpy.data.objects["FP_HANDS_ROOT"]
    coll = bpy.data.collections[COLLECTION]
    rig = bpy.data.objects["SK_FP_Hands"]
    keep = (root.matrix_world.copy(), coll.hide_render, rig.animation_data.action)
    with _context():
        try:
            root.location = (0, 0, 0)
            coll.hide_render = False
            bpy.context.scene.render.fps = FPS
            bpy.context.scene.render.fps_base = 1
            bpy.context.scene.frame_start = 0
            bpy.context.scene.frame_end = 96
            for ob in bpy.context.selected_objects:
                ob.select_set(False)
            for ob in coll.objects:
                ob.select_set(True)
            bpy.context.view_layer.objects.active = rig
            bpy.context.view_layer.update()
            props = bpy.ops.export_scene.gltf.get_rna_type().properties
            kw = dict(filepath=str(path), export_format="GLB", use_selection=True,
                      export_yup=True, export_apply=False, export_cameras=False,
                      export_lights=False, export_animations=True, export_extras=False,
                      export_force_sampling=True, export_frame_step=1,
                      export_def_bones=False, export_anim_slide_to_zero=True,
                      export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                      export_image_format="WEBP", export_image_quality=90)
            if "export_animation_mode" in props:
                kw["export_animation_mode"] = "ACTIONS"
            if "export_anim_single_armature" in props:
                kw["export_anim_single_armature"] = False
            if "export_all_influences" in props:
                kw["export_all_influences"] = False
            bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})
        finally:
            root.matrix_world, coll.hide_render, rig.animation_data.action = keep
            bpy.context.view_layer.update()
    return {"path": str(path), "bytes": path.stat().st_size, "audit": report}


def save_sources(path=None):
    """Save an editable hands-only .blend library and original procedural asset record.

    Does not replace/save the open station .blend or change its filepath. The collection
    can be appended to a fresh scene from this source library.
    """
    SOURCE.mkdir(parents=True, exist_ok=True)
    path = Path(path) if path else SOURCE / "vorax_hands_source.blend"
    bpy.data.libraries.write(str(path), {bpy.data.collections[COLLECTION]}, path_remap="RELATIVE", fake_user=True)
    record = {"creator": "Codex with Blender Python", "source_script": str(Path(__file__)),
              "source_blend": str(path), "date": "2026-11-15", "external_assets_copied": [],
              "reference": "User-provided mano.webp; broad material/silhouette reference only, not reproduced",
              "rights": "Original project artwork. Project licence remains a human decision.",
              "transforms": ["Original anatomical loft geometry", "Original periodic twill and scuff maps",
                             "Localized original grime, low-density scratches and selected guard-edge wear",
                             "Deform armature with blended joint weights and independently anchored forearms",
                             "30 fps sampled eased animation"],
              "audit": audit()}
    (SOURCE / "sources.json").write_text(json.dumps(record, indent=2) + "\n")
    return {"blend": str(path), "record": str(SOURCE / "sources.json")}


def sample(name="Idle", seconds=0.0):
    """Explicitly pose only the hand rig without changing the scene's frame or station."""
    if name not in CLIPS:
        raise ValueError(name)
    rig = bpy.data.objects["SK_FP_Hands"]
    rig.animation_data.action = None
    _apply(rig, name, min(1, max(0, seconds / CLIPS[name])))
    bpy.context.view_layer.update()


def preview(path, name="Idle", seconds=0.0, size=(1280, 720), samples=32):
    """Isolated eye-camera Cycles preview. Restores rig/root and removes temporary scene/rig."""
    coll = bpy.data.collections[COLLECTION]
    root = bpy.data.objects["FP_HANDS_ROOT"]
    rig = bpy.data.objects["SK_FP_Hands"]
    saved = (root.matrix_world.copy(), coll.hide_render, rig.animation_data.action,
             {pb.name: pb.matrix_basis.copy() for pb in rig.pose.bones})
    tmp = bpy.data.scenes.new("_FP_PREVIEW_TEMP")
    world = bpy.data.worlds.new("_FP_PREVIEW_WORLD")
    created = []
    try:
        root.location = (0, 0, 0)
        coll.hide_render = False
        tmp.collection.children.link(coll)
        tmp.world = world
        world.use_nodes = True
        background = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
        background.inputs["Color"].default_value = (.025, .032, .038, 1)
        background.inputs["Strength"].default_value = .4
        data = bpy.data.cameras.new("_FP_PREVIEW_CAMERA")
        camera = bpy.data.objects.new("_FP_PREVIEW_CAMERA", data)
        tmp.collection.objects.link(camera)
        created.append(camera)
        camera.rotation_euler = Vector((0, -1, 0)).to_track_quat("-Z", "Y").to_euler()
        camera.data.sensor_fit = "VERTICAL"
        camera.data.angle = math.radians(75)
        camera.data.clip_start = .02
        tmp.camera = camera
        for loc, watts, color, width in [((-.35, .4, .18), 36, (1, .82, .64), .65),
                                          ((.45, .12, .5), 12, (.48, .69, 1), .55)]:
            data = bpy.data.lights.new("_FP_PREVIEW_LIGHT", "AREA")
            lamp = bpy.data.objects.new("_FP_PREVIEW_LIGHT", data)
            tmp.collection.objects.link(lamp)
            created.append(lamp)
            lamp.location = C(loc)
            lamp.rotation_euler = (C((0, -.25, .5)) - lamp.location).to_track_quat("-Z", "Y").to_euler()
            data.energy, data.color, data.shape, data.size = watts, color, "DISK", width
        rig.animation_data.action = None
        _apply(rig, name, min(1, max(0, seconds / CLIPS[name])))
        tmp.render.engine = "CYCLES"
        tmp.cycles.samples = samples
        tmp.cycles.use_denoising = True
        tmp.render.resolution_x, tmp.render.resolution_y, tmp.render.resolution_percentage = *size, 100
        tmp.render.image_settings.file_format = "PNG"
        tmp.render.filepath = str(path)
        tmp.view_settings.view_transform = "AgX"
        tmp.view_settings.exposure = .3
        bpy.ops.render.render(write_still=True, scene=tmp.name)
    finally:
        root.matrix_world, coll.hide_render, rig.animation_data.action = saved[:3]
        for pb in rig.pose.bones:
            pb.matrix_basis = saved[3][pb.name]
        for ob in created:
            data = ob.data
            bpy.data.objects.remove(ob, do_unlink=True)
            if isinstance(data, bpy.types.Camera):
                bpy.data.cameras.remove(data)
            else:
                bpy.data.lights.remove(data)
        bpy.data.scenes.remove(tmp)
        bpy.data.worlds.remove(world)
        bpy.context.view_layer.update()
    return str(path)
