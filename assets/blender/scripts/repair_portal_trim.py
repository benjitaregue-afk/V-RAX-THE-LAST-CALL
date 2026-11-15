"""Targeted r4 repair. Import does nothing. No environment regeneration or UV edits.

The r1 portal builder put the steel and structural inside faces on the same plane.
repair() moves only the identified trim/straps 15 mm toward the opening. Vertex
count, face count, both UV layers and all material assignments remain unchanged.
"""
import bpy
import json
import os
from mathutils import Vector
import station_ending as E
from vorax_lib import plan_frame


def repair():
    scene = bpy.context.scene
    if scene.get("portal_trim_r4"):
        return {"already_repaired": True}
    layout = json.load(open(os.path.join(E.BLEND_DIR, "layout.json")))
    frames = layout["doors"] + [f for f in layout["frames"] if not f["sealed"]]
    result = {"offset_m": .015, "portals": [], "objects": {}}
    for ob in (bpy.data.objects["ENV_HUB"], bpy.data.objects["DET_HUB"]):
        me = ob.data
        moved = {}
        original_uv = [[tuple(x.uv) for x in layer.data] for layer in me.uv_layers]
        for portal in frames:
            transform = plan_frame(portal["x"], portal["z"], portal["yaw"])
            inv = transform.inverted()
            for face in me.polygons:
                if me.materials[face.material_index].name != "flat":
                    continue
                vs = [inv @ me.vertices[i].co for i in face.vertices]
                def inside(x0,x1,y0,y1,z0,z1):
                    return all(x0-1e-5<=v.x<=x1+1e-5 and y0-1e-5<=v.y<=y1+1e-5 and z0-1e-5<=v.z<=z1+1e-5 for v in vs)
                delta = None
                for side in (-1,1):
                    xx=sorted([side*.995,side*1.075])
                    # Both the steel extrusion and its hazard collars; no other flat
                    # part is entirely inside this narrow 80 mm envelope.
                    if inside(*xx,-.32,.32,0,2.5):
                        delta=Vector((-side*.015,0,0))
                if inside(-1.035,1.035,-.31,.31,2.5,2.57):
                    delta=Vector((0,0,-.015))
                if delta is not None:
                    world_delta=transform.to_3x3()@delta
                    for i in face.vertices:
                        if i in moved:
                            assert (moved[i]-world_delta).length<1e-6
                        moved[i]=world_delta
            if ob.name=="ENV_HUB": result["portals"].append(portal["id"])
        for i,delta in moved.items():
            me.vertices[i].co += delta
        me.update()
        assert original_uv == [[tuple(x.uv) for x in layer.data] for layer in me.uv_layers]
        result["objects"][ob.name]={"moved_vertices":len(moved),"vertices":len(me.vertices),"faces":len(me.polygons),"uv_preserved":True}
    assert all(x["moved_vertices"]>0 for x in result["objects"].values())
    scene["portal_trim_r4"]=True
    with open(os.path.join(E.BLEND_DIR,"portal-repair-report.json"),"w") as f:
        json.dump(result,f,indent=2)
    return result
