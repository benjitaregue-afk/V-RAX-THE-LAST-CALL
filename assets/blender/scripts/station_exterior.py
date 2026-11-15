"""r3: exterior depth only, authored in the live r2 station through Blender MCP.

No entry point runs on import. build() replaces only its own EXTERIOR collection;
export() appends that collection to the existing environment GLB. Interior meshes,
lightmaps, probes and Rescue One are reused unchanged. Game positions use L.P().
"""
import hashlib
import json
import math
import os

import bmesh
import bpy
from mathutils import Vector

import station_ending as E
import vorax_lib as L

COLLECTION = "EXTERIOR"
PAINT = {
    "hull": (0.38, 0.44, 0.48, 1),
    "steel": (0.62, 0.67, 0.69, 1),
    "dark": (0.12, 0.15, 0.18, 1),
    "panel": (0.52, 0.55, 0.52, 1),
    "caution": (0.70, 0.31, 0.065, 1),
    "marker": (1, 1, 1, 1),
}


def materials():
    body = bpy.data.materials.get("MAT_Exterior_Hull")
    if body is None:
        body = bpy.data.materials["struct"].copy()
        body.name = "MAT_Exterior_Hull"
        nt = body.node_tree
        bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        texture = next(l.from_socket for l in nt.links if l.to_socket == bs.inputs["Base Color"])
        vc = nt.nodes.new("ShaderNodeVertexColor")
        vc.layer_name = "Color"
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 1
        nt.links.new(texture, mix.inputs[1])
        nt.links.new(vc.outputs["Color"], mix.inputs[2])
        nt.links.new(mix.outputs[0], bs.inputs["Base Color"])
        for key in ("Metallic", "Roughness"):
            for link in list(bs.inputs[key].links):
                nt.links.remove(link)
        bs.inputs["Metallic"].default_value = 0.25
        bs.inputs["Roughness"].default_value = 0.72
    marker = bpy.data.materials.get("MAT_Exterior_Marker")
    if marker is None:
        marker = L.flat_material("MAT_Exterior_Marker", (0.2, 0.055, 0.007), rough=0.65,
                                 emit=(1, 0.19, 0.025), strength=2.0)
    body.use_backface_culling = marker.use_backface_culling = True
    for key in PAINT:
        L.TILE[key] = 2.0
    return {k: marker if k == "marker" else body for k in PAINT}


def finish(mesh, mats, coll):
    """One shared surface + lamp material. Vertex colour varies paint, not draw calls."""
    names = list(mesh.mats)
    ob = mesh.finish(mats, coll)
    data = ob.data
    col = data.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
    data.color_attributes.active_color = col
    indices = [p.material_index for p in data.polygons]
    for face, mi in zip(data.polygons, indices):
        for li in face.loop_indices:
            col.data[li].color = PAINT[names[mi]]
    data.materials.clear()
    data.materials.append(mats["hull"])
    if "marker" in names:
        data.materials.append(mats["marker"])
    for face, mi in zip(data.polygons, indices):
        face.material_index = int(names[mi] == "marker")
    # Flat panel normals; cylinders keep smooth normals. Bevels are authored geometry.
    ob["art_revision"] = "r3_exterior"
    ob["non_colliding"] = True
    return ob


def build():
    assert os.path.basename(bpy.data.filepath) == "vorax_station.blend"
    old = bpy.data.collections.get(COLLECTION)
    if old:
        assert all(o.get("art_revision") == "r3_exterior" for o in old.objects)
        for ob in list(old.objects):
            bpy.data.objects.remove(ob, do_unlink=True)
    coll = L.collection(COLLECTION)
    mats = materials()
    h = L.Mesh("SM_EXT_ServiceBoom")
    # Root saddle below the left window; no member crosses the clear centre bay.
    h.box((2.0, 1.1, 1.05), L.P(-5.8, 30.75, -0.65), mat="hull", bevel=0.05)
    h.box((2.12, 0.22, 0.12), L.P(-5.8, 30.38, -0.08), mat="steel", bevel=0.02)
    # A triangular, lightly braced service boom: 12 m long, subtly outboard.
    def point(t, side=0, height=0):
        return L.P(-5.8 - 1.6*t + side, 31 + 12*t, height)
    for side in (-0.68, 0.68):
        h.beam(point(0, side, 0.25), point(1, side, 0.25), 0.15, 0.15, "steel", bevel=0.015)
    h.beam(point(0, 0, -1.05), point(1, 0, -1.05), 0.18, 0.16, "hull", bevel=0.015)
    for i in range(6):
        a, b = i/6, (i+1)/6
        h.beam(point(a, -0.68, 0.25), point(a, 0.68, 0.25), 0.12, 0.12, "hull")
        for side in (-0.68, 0.68):
            h.beam(point(a, side, 0.25), point(b, 0, -1.05), 0.07, 0.07, "hull")
        h.rod(point(a, 0.42, 0.36), point(b, 0.42, 0.36), 0.045, "dark", segs=8)
    h.beam(point(1, -0.68, 0.25), point(1, 0.68, 0.25), 0.15, 0.15, "steel")
    # Outboard radiator spine and tension struts, all confined to the left side.
    for y in (0.15, 1.75):
        h.beam(L.P(-8.2, 35.6, y), L.P(-9.0, 42, y), 0.12, 0.12, "steel", bevel=0.01)
    for z, x in ((35.6, -8.2), (42, -9.0)):
        h.beam(L.P(x, z, 0.15), L.P(x, z, 1.75), 0.14, 0.14, "hull")
        h.beam(L.P(x, z, 0.15), L.P(x+1.6, z-0.2, -0.7), 0.09, 0.09, "steel")
    # A small receiver terminates the boom; it suggests machinery without a hero prop.
    h.box((0.72, 0.95, 0.42), point(1, 0, 0.48), mat="panel", bevel=0.04)
    h.cyl(0.19, 0.12, point(1, 0, 0.76), mat="dark", segs=12)
    h.rod(point(1, 0, 0.8), point(1, 0, 1.45), 0.025, "steel", segs=8)
    h.cyl(0.065, 0.09, point(1, 0, 1.48), mat="marker", segs=8)
    # A low right hull shoulder is visible only close to the glass, reinforcing parallax.
    h.box((2.7, 2.3, 0.65), L.P(6.1, 31.5, -0.65), mat="hull", bevel=0.08)
    h.box((2.82, 0.18, 0.11), L.P(6.1, 30.42, -0.24), mat="steel", bevel=0.02)
    for x in (5.2, 6.1, 7.0):
        h.box((0.07, 1.65, 0.055), L.P(x, 31.5, -0.30), mat="dark")
    main = finish(h, mats, coll)

    # Linked meshes for repeated service covers and radiator blades.
    p = L.Mesh("SM_EXT_ServiceCover_01")
    p.box((1.14, 1.78, 0.09), mat="panel", bevel=0.025)
    p.box((0.13, 1.7, 0.012), (0.42, 0, 0.052), mat="caution")
    for x in (-0.47, 0.47):
        for y in (-0.7, 0.7):
            p.cyl(0.032, 0.02, (x, y, 0.06), mat="steel", segs=6)
    panel = finish(p, mats, coll)
    for i in range(6):
        ob = panel if i == 0 else bpy.data.objects.new("SM_EXT_ServiceCover_%02d" % (i+1), panel.data)
        if i:
            coll.objects.link(ob)
        ob.location = point((i+0.5)/6, 0, 0.3)
        ob.rotation_euler.z = -math.atan2(1.6, 12)
        ob["art_revision"] = "r3_exterior"
        ob["non_colliding"] = True

    r = L.Mesh("SM_EXT_RadiatorBlade_01")
    r.box((0.1, 0.74, 1.38), mat="dark", bevel=0.015)
    for y in (-0.34, 0.34):
        r.box((0.15, 0.04, 1.4), (0, y, 0), mat="steel")
    r.box((0.13, 0.75, 0.08), (0, 0, 0.64), mat="panel")
    blade = finish(r, mats, coll)
    for i in range(7):
        ob = blade if i == 0 else bpy.data.objects.new("SM_EXT_RadiatorBlade_%02d" % (i+1), blade.data)
        if i:
            coll.objects.link(ob)
        t = (i+0.5)/7
        ob.location = L.P(-8.2-0.8*t, 35.6+6.4*t, 0.95)
        ob.rotation_euler.z = -0.124
        ob["art_revision"] = "r3_exterior"
        ob["non_colliding"] = True
    return audit()


def audit():
    coll = bpy.data.collections[COLLECTION]
    report = {"revision": "r3_exterior", "budget_triangles": 4000, "objects": [], "issues": []}
    total = 0
    for ob in coll.objects:
        me = ob.data
        bm = bmesh.new()
        bm.from_mesh(me)
        tris = sum(len(f.verts)-2 for f in bm.faces)
        bad = sum(not e.is_manifold for e in bm.edges)
        loose = sum(not v.link_faces for v in bm.verts)
        degenerate = sum(f.calc_area() < 1e-9 for f in bm.faces)
        doubles = len(bmesh.ops.find_doubles(bm, verts=list(bm.verts), dist=0.00001)["targetmap"])
        bm.free()
        total += tris
        report["objects"].append({"name": ob.name, "triangles": tris, "materials": len(me.materials),
                                  "non_manifold_edges": bad, "loose_vertices": loose,
                                  "degenerate_faces": degenerate, "duplicate_vertices": doubles,
                                  "uv_layers": [u.name for u in me.uv_layers], "scale": list(ob.scale)})
        if bad or loose or degenerate:
            report["issues"].append(ob.name)
    report.update(triangles=total, materials=sorted({m.name for o in coll.objects for m in o.data.materials}),
                  unique_meshes=len({o.data.name for o in coll.objects}),
                  contact_vertices="40 coincident vertices at contacts between separate closed truss members; intentionally not welded into non-manifold junctions.",
                  uv_policy="2 m tiled projected UVs; intentional repeats. No lightmap atlas, no packing target.",
                  lod_policy="Sparse secondary scenery, not a hero asset; under 4k total tris, linked repeats, no extra LOD.",
                  naming_policy="SM_EXT_ objects, MAT_Exterior_ materials; dedicated EXTERIOR collection.")
    report["pass"] = total <= report["budget_triangles"] and not report["issues"]
    path = os.path.join(E.BLEND_DIR, "exterior-report.json")
    with open(path, "w") as fh:
        json.dump(report, fh, indent=2)
        fh.write("\n")
    return report


def export():
    assert audit()["pass"]
    # All original objects/UV/materials are reused, not regenerated or rebaked.
    objs = [bpy.data.objects[p+z] for p in ("ENV_", "DET_") for z in E.pipeline()["ZONES"]]
    objs += list(bpy.data.collections[COLLECTION].objects)
    selected = list(bpy.context.selected_objects)
    active = bpy.context.view_layer.objects.active
    L.select_only(objs)
    path = os.path.join(E.MODELS, "environment.glb")
    try:
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
            export_apply=False, export_yup=True, export_cameras=False, export_lights=False,
            export_animations=False, export_extras=False, export_tangents=False,
            export_image_format="WEBP", export_image_quality=84,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    finally:
        L.select_only(selected) if selected else bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = active
    return {"path": path, "bytes": os.path.getsize(path), "sha256": hashlib.sha256(open(path,"rb").read()).hexdigest()}
