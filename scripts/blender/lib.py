"""Blender model yardimcilari.

Neden Blender: build-models.mjs gövdeleri elle üçgenliyordu, elde kutu ve silindir
kalıyordu. Blender'da bevel, boolean, array ve eğri var; parça gerçekten
modellenebiliyor. Çalıştırma headless, MCP veya eklenti gerekmiyor:

    blender.exe --background --python scripts/blender/motor.py -- <cikti.glb>

SÖZLEŞME: üretilen her nesnenin adı web/content/*.parts.json içindeki mesh
adıyla birebir aynı olmak zorunda. Adlarda NOKTA kullanilamaz - GLTFLoader
düğüm adındaki '.', ':', '/', '[', ']' karakterlerini siler.
"""

import bpy
import math

TAU = math.tau


# ——— sahne ———————————————————————————————————————————————————————

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metal=0.85, rough=0.45, alpha=1.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, alpha)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = 'BLEND'
    return m


# ——— ilkeller ————————————————————————————————————————————————————

def cube(loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0)):
    """scale = YARIM boyut (size=2 kullanildigi icin)."""
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    apply_scale(o)
    return o


def cyl(r=0.1, d=0.2, loc=(0, 0, 0), rot=(0, 0, 0), v=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=loc, rotation=rot)
    return bpy.context.active_object


def cone(r1=0.1, r2=0.0, d=0.2, loc=(0, 0, 0), rot=(0, 0, 0), v=32):
    bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r1, radius2=r2, depth=d, location=loc, rotation=rot)
    return bpy.context.active_object


def torus(major=0.1, minor=0.02, loc=(0, 0, 0), rot=(0, 0, 0), seg=32, ring=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, location=loc, rotation=rot,
        major_segments=seg, minor_segments=ring,
    )
    return bpy.context.active_object


def sphere(r=0.1, loc=(0, 0, 0), seg=24, ring=12):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring)
    return bpy.context.active_object


def apply_scale(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


# ——— islemler ————————————————————————————————————————————————————

def boolean(target, tool, op='DIFFERENCE'):
    """tool tuketilir: islemden sonra silinir."""
    bpy.context.view_layer.objects.active = target
    m = target.modifiers.new("bool", 'BOOLEAN')
    m.object = tool
    m.operation = op
    m.solver = 'EXACT'
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(tool, do_unlink=True)
    return target


def bevel(o, w=0.004, seg=2, angle=40):
    bpy.context.view_layer.objects.active = o
    m = o.modifiers.new("bev", 'BEVEL')
    m.width = w
    m.segments = seg
    m.limit_method = 'ANGLE'
    m.angle_limit = math.radians(angle)
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def solidify(o, t=0.006):
    bpy.context.view_layer.objects.active = o
    m = o.modifiers.new("sol", 'SOLIDIFY')
    m.thickness = t
    bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def tube(r_out, r_in, d, loc=(0, 0, 0), rot=(0, 0, 0), v=32):
    o = cyl(r_out, d, loc, rot, v)
    i = cyl(r_in, d * 1.4, loc, rot, v)
    return boolean(o, i)


def hex_head(r=0.012, d=0.010, loc=(0, 0, 0), rot=(0, 0, 0)):
    return cyl(r, d, loc, rot, v=6)


def curve_tube(points, radius, res=10, ring=8):
    """Bezier eğriden boru: hortum, manifold kanalı, kablo."""
    cu = bpy.data.curves.new("c", 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(points) - 1)
    for i, p in enumerate(points):
        bp = sp.bezier_points[i]
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    cu.bevel_depth = radius
    cu.bevel_resolution = ring // 2
    cu.resolution_u = res
    ob = bpy.data.objects.new("c", cu)
    bpy.context.collection.objects.link(ob)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    return bpy.context.active_object


def ring_of(fn, count, radius, axis='X', center=(0, 0, 0), phase=0.0):
    """Bir eksen etrafina count adet parca dizer; dis disli, kanat, kayis disi."""
    out = []
    for i in range(count):
        a = phase + TAU * i / count
        if axis == 'X':
            loc = (center[0], center[1] + radius * math.cos(a), center[2] + radius * math.sin(a))
            rot = (a, 0, 0)
        elif axis == 'Y':
            loc = (center[0] + radius * math.cos(a), center[1], center[2] + radius * math.sin(a))
            rot = (0, a, 0)
        else:
            loc = (center[0] + radius * math.cos(a), center[1] + radius * math.sin(a), center[2])
            rot = (0, 0, a)
        out.append(fn(loc, rot, i))
    return out


def convex_hull_2d(pts):
    """Monotone chain. Kayis yolu = kasnak cemberlerinin dis zarfi."""
    pts = sorted(set(pts))
    if len(pts) <= 2:
        return pts

    def yarim(seq):
        y = []
        for p in seq:
            while len(y) >= 2 and ((y[-1][0] - y[-2][0]) * (p[1] - y[-2][1])
                                   - (y[-1][1] - y[-2][1]) * (p[0] - y[-2][0])) <= 0:
                y.pop()
            y.append(p)
        return y

    return yarim(pts)[:-1] + yarim(reversed(pts))[:-1]


def kayis(kasnaklar, x, kalinlik=0.006, genislik=2.2, ornek=64):
    """kasnaklar: [((y, z), yaricap), ...] - hepsi x=sabit duzleminde.

    Kayis, kasnak cemberlerinin ortak dis tegetidir; her cemberi orneklerip
    disbukey zarfini almak bu yolu doogru verir ve tek parca kayis uretir.
    """
    noktalar = []
    for (cy, cz), r in kasnaklar:
        rr = r + kalinlik
        for i in range(ornek):
            a = TAU * i / ornek
            noktalar.append((round(cz + rr * math.cos(a), 6), round(cy + rr * math.sin(a), 6)))
    zarf = convex_hull_2d(noktalar)

    cu = bpy.data.curves.new("kayis", 'CURVE')
    cu.dimensions = '3D'
    sp = cu.splines.new('POLY')
    sp.points.add(len(zarf) - 1)
    for i, (z, y) in enumerate(zarf):
        sp.points[i].co = (x, y, z, 1.0)
    sp.use_cyclic_u = True
    cu.bevel_depth = kalinlik
    cu.bevel_resolution = 4
    ob = bpy.data.objects.new("kayis", cu)
    bpy.context.collection.objects.link(ob)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    o.scale = (genislik, 1, 1)
    apply_scale(o)
    return o


# ——— cikti ———————————————————————————————————————————————————————

def part(objs, name, material=None):
    """Parcalari tek nesnede birlestirir ve SÖZLESME adini verir."""
    if not isinstance(objs, (list, tuple)):
        objs = [objs]
    objs = [o for o in objs if o is not None]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.active_object
    assert "." not in name, f"mesh adinda nokta olamaz: {name}"
    o.name = name
    o.data.name = name
    if material:
        o.data.materials.clear()
        o.data.materials.append(material)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    return o


def export(path):
    # EKSEN: modeller sozlesmedeki gibi Y-yukari kurulur (parts.json: X = krank
    # ekseni, Y = yukari, Z = aracin onu). Blender Z-yukari calisir ve ihracatta
    # varsayilan olarak kendi Z'sini glTF'in Y'sine cevirir - bu cevrim burada
    # ISTENMIYOR, yoksa model GLB'de yan yatar. export_yup=False koordinatlari
    # oldugu gibi yazar.
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=False)
    adlar = sorted(o.name for o in bpy.data.objects if o.type == 'MESH')
    print(f"MESH SAYISI: {len(adlar)}")
    for a in adlar:
        print("  mesh:", a)
    return adlar


def mentese_ekseni(obj, aci, y, z):
    """Nesneyi x ekseni yonundeki bir mentese etrafinda dondurur.

    Blender'in rotation_euler'i nesne merkezini kullanir; kaput gibi kenarindan
    acilan parcalarda pivot menteseye tasinmali. Kose noktalari dogrudan
    donduruluyor, boylece uygulanmis donusum GLB'ye de aynen giriyor.
    """
    import math
    from mathutils import Matrix, Vector

    pivot = Vector((0.0, y, z))
    donus = Matrix.Rotation(aci, 4, 'X')
    obj_pivot = obj.matrix_world.inverted() @ pivot
    for v in obj.data.vertices:
        v.co = donus @ (v.co - obj_pivot) + obj_pivot
    obj.data.update()
    return obj
