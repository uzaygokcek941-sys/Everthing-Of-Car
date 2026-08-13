"""Lastik ve tekerlek sahnesi: araca takili tekerlek + olcu aletleri + on takim.

    blender.exe --background --python scripts/blender/lastik.py -- web/public/models/lastik.glb

Eksenler: zemin y=0, tekerlek merkezi y=0.32 (lastik zemine deger).
X = aks ekseni (+X izleyiciye dogru dis yuz), Z = derinlik.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

CELIK = mat("celik", (0.55, 0.57, 0.60), metal=0.95, rough=0.28)
ALU = mat("alu", (0.72, 0.74, 0.77), metal=0.92, rough=0.24)
KAUCUK = mat("kaucuk", (0.075, 0.075, 0.082), metal=0.00, rough=0.92)
PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.55)
KURSUN = mat("kursun", (0.42, 0.43, 0.46), metal=0.80, rough=0.55)
BAKIR = mat("bakir", (0.72, 0.45, 0.20), metal=0.85, rough=0.38)

MY = 0.32
R_DIS = 0.32
R_JANT = 0.205
BIJON_R = 0.058
DIS_X = 0.075

# ——— lastik ——————————————————————————————————————————————————————
karkas = tube(R_DIS, R_JANT, 0.195, loc=(0, MY, 0), rot=(0, math.pi / 2, 0), v=64)
bevel(karkas, 0.012, 2)
sirt = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.085, 0.010, 0.026), rot=(rot[0], 0, 0)),
    46, R_DIS - 0.004, axis='X', center=(0, MY, 0),
)
part([karkas] + sirt, "lastik", KAUCUK)

yanak = tube(R_DIS - 0.004, R_JANT + 0.004, 0.010, loc=(DIS_X + 0.010, MY, 0),
             rot=(0, math.pi / 2, 0), v=64)
yazi = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.003, 0.008, 0.003), rot=(rot[0], 0, 0)),
    26, 0.268, axis='X', center=(DIS_X + 0.016, MY, 0),
)
part([yanak] + yazi, "lastik_yanagi", KAUCUK)

# ——— jant ————————————————————————————————————————————————————————
bilezik = tube(R_JANT, R_JANT - 0.022, 0.180, loc=(0, MY, 0), rot=(0, math.pi / 2, 0), v=56)
kenar = [tube(R_JANT + 0.008, R_JANT - 0.006, 0.014, loc=(x, MY, 0), rot=(0, math.pi / 2, 0), v=56)
         for x in (-0.086, 0.086)]
tabla = cyl(0.085, 0.016, loc=(0.030, MY, 0), rot=(0, math.pi / 2, 0), v=40)
kollar = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.008, 0.062, 0.020), rot=(rot[0], 0, 0)),
    5, 0.135, axis='X', center=(0.030, MY, 0),
)
part([bilezik] + kenar + [tabla] + kollar, "jant", ALU)

# ——— gobek ve bijonlar ———————————————————————————————————————————
gobek_tabla = cyl(0.072, 0.018, loc=(-0.020, MY, 0), rot=(0, math.pi / 2, 0), v=36)
gobek_boyun = cyl(0.038, 0.050, loc=(-0.045, MY, 0), rot=(0, math.pi / 2, 0), v=28)
saplamalar = ring_of(
    lambda loc, rot, i: cyl(0.007, 0.044, loc=loc, rot=(0, math.pi / 2, 0), v=14),
    5, BIJON_R, axis='X', center=(0.005, MY, 0),
)
part([gobek_tabla, gobek_boyun] + saplamalar, "gobek", CELIK)

for i in range(5):
    a = math.tau * i / 5
    y = MY + BIJON_R * math.cos(a)
    z = BIJON_R * math.sin(a)
    somun = hex_head(0.0115, 0.016, loc=(0.040, y, z), rot=(0, math.pi / 2, 0))
    konik = cone(0.0115, 0.008, 0.008, loc=(0.030, y, z), rot=(0, -math.pi / 2, 0), v=18)
    part([somun, konik], f"bijon_{i + 1}", CELIK)

# ——— valf, TPMS, balans agirligi ——————————————————————————————————
valf_govde = cyl(0.0055, 0.032, loc=(0.052, MY + 0.150, 0.02), rot=(0.35, 0, 0.30), v=14)
valf_kapak = cyl(0.0075, 0.010, loc=(0.052, MY + 0.168, 0.026), rot=(0.35, 0, 0.30), v=14)
part([valf_govde, valf_kapak], "valf", KURSUN)

tpms = cube(loc=(0.030, MY + 0.140, 0.018), scale=(0.014, 0.010, 0.022), rot=(0.35, 0, 0))
bevel(tpms, 0.004, 2)
tpms_kelepce = cyl(0.006, 0.020, loc=(0.045, MY + 0.148, 0.020), rot=(0.35, 0, 0.30), v=12)
part([tpms, tpms_kelepce], "tpms_sensoru", PLASTIK)

agirlik = cube(loc=(-0.082, MY - 0.196, 0.02), scale=(0.008, 0.006, 0.016))
bevel(agirlik, 0.002, 2)
klips = cube(loc=(-0.082, MY - 0.186, 0.02), scale=(0.006, 0.005, 0.014))
part([agirlik, klips], "balans_agirligi", KURSUN)

# ——— el aletleri ——————————————————————————————————————————————————
kol_uzun = cyl(0.011, 0.290, loc=(0.30, 0.012, 0.30), rot=(0, 0, math.pi / 2), v=16)
kol_kisa = cyl(0.011, 0.130, loc=(0.30, 0.012, 0.30), rot=(math.pi / 2, 0, 0), v=16)
lokma = tube(0.019, 0.012, 0.040, loc=(0.30, 0.012, 0.360), rot=(math.pi / 2, 0, 0), v=18)
part([kol_uzun, kol_kisa, lokma], "bijon_anahtari", CELIK)

mastar_govde = cube(loc=(0.46, 0.010, 0.16), scale=(0.016, 0.008, 0.052))
mastar_pim = cyl(0.0035, 0.050, loc=(0.46, 0.030, 0.16), v=12)
mastar_kadran = cyl(0.020, 0.008, loc=(0.46, 0.050, 0.16), rot=(math.pi / 2, 0, 0), v=24)
part([mastar_govde, mastar_pim, mastar_kadran], "dis_derinligi_mastari", CELIK)

mano_kadran = cyl(0.036, 0.016, loc=(0.46, 0.036, 0.30), rot=(math.pi / 2, 0, 0), v=28)
mano_cam = cyl(0.031, 0.004, loc=(0.46, 0.036, 0.309), rot=(math.pi / 2, 0, 0), v=28)
mano_ibre = cube(loc=(0.46, 0.046, 0.312), scale=(0.002, 0.018, 0.001))
mano_sap = cyl(0.012, 0.055, loc=(0.46, 0.008, 0.285), v=14)
mano_hortum = curve_tube([(0.46, 0.006, 0.285), (0.40, 0.006, 0.34), (0.30, 0.008, 0.36)], 0.006)
part([mano_kadran, mano_cam, mano_ibre, mano_sap, mano_hortum], "basinc_manometresi", BAKIR)

komp_kadran = cyl(0.032, 0.016, loc=(0.24, 0.30, -0.30), rot=(0, math.pi / 2, 0), v=28)
komp_cam = cyl(0.028, 0.004, loc=(0.249, 0.30, -0.30), rot=(0, math.pi / 2, 0), v=28)
komp_ibre = cube(loc=(0.252, 0.312, -0.30), scale=(0.001, 0.016, 0.002))
komp_uc = cyl(0.004, 0.090, loc=(0.24, 0.262, -0.276), rot=(0.4, 0, 0), v=12)
komp_kol = cube(loc=(0.24, 0.16, -0.34), scale=(0.010, 0.150, 0.010))
komp_taban = cube(loc=(0.24, 0.014, -0.34), scale=(0.048, 0.014, 0.048))
part([komp_kadran, komp_cam, komp_ibre, komp_uc, komp_kol, komp_taban], "salgi_komparatoru", CELIK)

# ——— kaldirma ekipmani ————————————————————————————————————————————
kriko_taban = cube(loc=(-0.34, 0.012, 0.24), scale=(0.075, 0.012, 0.050))
kriko_ust = cube(loc=(-0.34, 0.160, 0.24), scale=(0.050, 0.012, 0.036))
makas = []
for isaret in (-1, 1):
    for aci in (0.6, -0.6):
        makas.append(cube(loc=(-0.34 + isaret * 0.030, 0.086, 0.24), scale=(0.006, 0.088, 0.008),
                          rot=(aci, 0, 0)))
kriko_vida = cyl(0.007, 0.150, loc=(-0.34, 0.086, 0.24), rot=(math.pi / 2, 0, 0), v=14)
kriko_kol = cyl(0.006, 0.120, loc=(-0.34, 0.086, 0.335), rot=(math.pi / 2, 0, 0), v=12)
part([kriko_taban, kriko_ust] + makas + [kriko_vida, kriko_kol], "kriko", CELIK)

sehpa_taban = cube(loc=(-0.34, 0.010, -0.10), scale=(0.080, 0.010, 0.080))
sehpa_bacak = [cube(loc=(-0.34 + dx * 0.058, 0.115, -0.10 + dz * 0.058), scale=(0.010, 0.120, 0.010),
                    rot=(-dz * 0.42, 0, dx * 0.42))
               for dx, dz in ((-1, -1), (-1, 1), (1, -1), (1, 1))]
sehpa_kolon = tube(0.026, 0.018, 0.150, loc=(-0.34, 0.170, -0.10), v=20)
sehpa_eger = cube(loc=(-0.34, 0.250, -0.10), scale=(0.030, 0.016, 0.014))
sehpa_pim = cyl(0.005, 0.060, loc=(-0.34, 0.210, -0.10), rot=(math.pi / 2, 0, 0), v=12)
part([sehpa_taban] + sehpa_bacak + [sehpa_kolon, sehpa_eger, sehpa_pim], "sehpa", CELIK)

# ——— on takim parcalari ———————————————————————————————————————————
rotil_govde = cyl(0.028, 0.032, loc=(-0.16, 0.10, -0.34), v=24)
bevel(rotil_govde, 0.004, 2)
rotil_konik = cone(0.014, 0.009, 0.038, loc=(-0.16, 0.135, -0.34), v=20)
rotil_toz = cyl(0.023, 0.014, loc=(-0.16, 0.122, -0.34), v=20)
rotil_somun = hex_head(0.013, 0.010, loc=(-0.16, 0.158, -0.34))
part([rotil_govde, rotil_konik, rotil_toz, rotil_somun], "rotil", CELIK)

rot_govde = cyl(0.024, 0.028, loc=(0.02, 0.10, -0.34), v=24)
bevel(rot_govde, 0.004, 2)
rot_konik = cone(0.012, 0.008, 0.032, loc=(0.02, 0.130, -0.34), v=20)
rot_toz = cyl(0.020, 0.012, loc=(0.02, 0.118, -0.34), v=20)
rot_sap = cyl(0.011, 0.070, loc=(0.055, 0.10, -0.34), rot=(0, math.pi / 2, 0), v=16)
part([rot_govde, rot_konik, rot_toz, rot_sap], "rot_basi", CELIK)

rot_kol_cubuk = cyl(0.013, 0.185, loc=(-0.07, 0.10, -0.34), rot=(0, math.pi / 2, 0), v=18)
rot_kol_somun = hex_head(0.017, 0.014, loc=(-0.02, 0.10, -0.34), rot=(0, math.pi / 2, 0))
part([rot_kol_cubuk, rot_kol_somun], "rot_kolu", CELIK)

# ——— balans makinesi —————————————————————————————————————————————
bm_govde = cube(loc=(-0.05, 0.34, -0.72), scale=(0.24, 0.34, 0.16))
bevel(bm_govde, 0.016, 3)
bm_konsol = cube(loc=(-0.05, 0.76, -0.76), scale=(0.20, 0.09, 0.10), rot=(-0.35, 0, 0))
bm_ekran = cube(loc=(-0.05, 0.79, -0.68), scale=(0.13, 0.055, 0.006), rot=(-0.35, 0, 0))
bm_kapak = cyl(0.30, 0.020, loc=(-0.05, 0.72, -0.60), rot=(math.pi / 2, 0, 0), v=32)
bm_tabla = cube(loc=(-0.05, 0.030, -0.72), scale=(0.26, 0.030, 0.20))
part([bm_govde, bm_konsol, bm_ekran, bm_kapak, bm_tabla], "balans_makinesi", PLASTIK)

mil_govde = cyl(0.022, 0.300, loc=(-0.05, 0.46, -0.44), rot=(math.pi / 2, 0, 0), v=24)
mil_flans = cyl(0.070, 0.018, loc=(-0.05, 0.46, -0.50), rot=(math.pi / 2, 0, 0), v=32)
mil_konik = cone(0.062, 0.030, 0.060, loc=(-0.05, 0.46, -0.36), rot=(math.pi / 2, 0, 0), v=28)
mil_somun = hex_head(0.030, 0.024, loc=(-0.05, 0.46, -0.30), rot=(math.pi / 2, 0, 0))
part([mil_govde, mil_flans, mil_konik, mil_somun], "balans_mili", CELIK)

export(sys.argv[-1])
