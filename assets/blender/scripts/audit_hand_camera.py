"""Check the actual skinned glove against the prologue camera/floor. Explicit call only."""
import json
import math
import bpy
from mathutils import Matrix
import build_hands as H


def check():
    rig = bpy.data.objects["SK_FP_Hands"]
    keep = rig.animation_data.action, {p.name:p.matrix_basis.copy() for p in rig.pose.bones}
    result = {"camera": "Awaken: h=.24,pitch=.9; StandUp: h=.24+1.41*t/3,pitch=.9*(1-t/3)", "clips": []}
    root = bpy.data.objects["FP_HANDS_ROOT"]
    camera_from_park = H.CONVERT.inverted().to_4x4() @ Matrix.Translation(-root.matrix_world.translation)
    try:
        for name in ("Awaken", "StandUp"):
            samples = []
            frames = round(H.CLIPS[name]*H.FPS)
            for k in range(frames+1):
                t = k/frames*H.CLIPS[name]
                H.sample(name,t)
                height = .24 if name=="Awaken" else .24+1.41*t/3
                pitch = .9 if name=="Awaken" else .9*(1-t/3)
                cy, sy = math.cos(pitch), math.sin(pitch)
                minimum = 100
                dg = bpy.context.evaluated_depsgraph_get()
                for ob in bpy.data.collections[H.COLLECTION].objects:
                    if ob.type!="MESH": continue
                    ev = ob.evaluated_get(dg)
                    me = ev.to_mesh()
                    m = camera_from_park @ ev.matrix_world
                    a,b,c = (m[1][i]*cy-m[2][i]*sy for i in range(3))
                    d = height + m[1][3]*cy-m[2][3]*sy
                    minimum = min(minimum, min(a*v.co.x+b*v.co.y+c*v.co.z+d for v in me.vertices))
                    ev.to_mesh_clear()
                samples.append({"seconds":round(t,5),"minimum_world_y":round(minimum,6)})
            result["clips"].append({"name":name,"minimum_world_y":min(x["minimum_world_y"] for x in samples),"samples":samples})
    finally:
        rig.animation_data.action = keep[0]
        for p in rig.pose.bones: p.matrix_basis = keep[1][p.name]
        bpy.context.view_layer.update()
    result["pass"] = all(c["minimum_world_y"]>=-.001 for c in result["clips"])
    (H.SOURCE/"camera-audit.json").write_text(json.dumps(result,indent=2)+"\n")
    return result
