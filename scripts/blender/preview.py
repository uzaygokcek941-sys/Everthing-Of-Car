"""GLB'yi uc acidan render eder - gozle denetim icin.

    blender.exe --background --python scripts/blender/preview.py -- <model.glb> <cikti_onek>

glTF ice alirken Blender Y-yukari'yi Z-yukari'ya cevirir: modeldeki y ekseni
burada z olur, modelin onu (-+Z) burada -Y olur.
"""

import bpy, sys, math

argv = sys.argv[sys.argv.index("--") + 1:]
glb, onek = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)

# Modelin gercek sinir kutusundan hedef ve mesafe: sabit sayi tahmini
# kadraji kacirir, olcek modele gore degisir.
from mathutils import Vector
_kose = [o.matrix_world @ Vector(k) for o in bpy.data.objects if o.type == 'MESH' for k in o.bound_box]
_min = Vector((min(v.x for v in _kose), min(v.y for v in _kose), min(v.z for v in _kose)))
_max = Vector((max(v.x for v in _kose), max(v.y for v in _kose), max(v.z for v in _kose)))
hedef = tuple((_min + _max) / 2)
CAP = max((_max - _min).x, (_max - _min).y, (_max - _min).z)
print("SINIR KUTUSU:", tuple(round(v, 3) for v in _min), tuple(round(v, 3) for v in _max), "cap", round(CAP, 3))

dunya = bpy.data.worlds.new("w")
bpy.context.scene.world = dunya
dunya.use_nodes = True
dunya.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.06, 0.08, 1)
dunya.node_tree.nodes["Background"].inputs[1].default_value = 1.0

for loc, enerji in (((2.0, -2.2, 2.6), 900), ((-2.4, 1.6, 1.8), 420), ((0.4, 2.6, 1.2), 260)):
    bpy.ops.object.light_add(type='AREA', location=loc)
    l = bpy.context.active_object
    l.data.energy = enerji
    l.data.size = 2.0
    yon = bpy.data.objects.new("t", None)
    bpy.context.collection.objects.link(yon)
    yon.location = hedef
    c = l.constraints.new('TRACK_TO')
    c.target = yon

sc = bpy.context.scene
try:
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
except TypeError:
    sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1100, 760
sc.render.film_transparent = False
try:
    sc.eevee.taa_render_samples = 48
except Exception:
    pass

bpy.ops.object.camera_add(location=(0, 0, 0))
cam = bpy.context.active_object
cam.data.lens = 55
sc.camera = cam
odak = bpy.data.objects.new("odak", None)
bpy.context.collection.objects.link(odak)
odak.location = hedef
kc = cam.constraints.new('TRACK_TO')
kc.target = odak

import math as _m
D = CAP * 1.65                                  # 55 mm lens icin guvenli mesafe
# Yayvan modellerde izometrik aci genisligi kisaltir; 1. kare bilerek cepheye
# yakin duruyor.
ACILAR = [
    ("1-uc-ceyrek", (0.34, -1.00, 0.30)),
    ("2-yan-triger", (-1.00, -0.42, 0.26)),
    ("3-ust", (0.25, -0.55, 0.95)),
]
for ad, yon in ACILAR:
    n = _m.sqrt(sum(v * v for v in yon))
    cam.location = tuple(hedef[i] + yon[i] / n * D for i in range(3))
    sc.render.filepath = f"{onek}-{ad}.png"
    bpy.ops.render.render(write_still=True)
    print("RENDER:", sc.render.filepath)
