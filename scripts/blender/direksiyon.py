"""Direksiyon sistemi: simitten rot basina kadar zincir + hidrolik ve EPS yardim.

    blender.exe --background --python scripts/blender/direksiyon.py -- web/public/models/direksiyon.glb

Eksenler: X = arac eni (+X sag), Y = yukari, Z = on-arka (+Z surucuye dogru).
Simit y=0.95 ve surucuye bakar; kremayer y=0.74'te arac enine uzanir.
Surucu solda: simit x=-0.35.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

CELIK = mat("celik", (0.55, 0.57, 0.60), metal=0.95, rough=0.28)
ALU = mat("alu", (0.68, 0.70, 0.73), metal=0.90, rough=0.34)
KAUCUK = mat("kaucuk", (0.09, 0.09, 0.10), metal=0.00, rough=0.88)
PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.55)
DERI = mat("deri", (0.10, 0.10, 0.11), metal=0.00, rough=0.72)
BAKIR = mat("bakir", (0.72, 0.45, 0.20), metal=0.85, rough=0.38)
SEFFAF = mat("seffaf", (0.80, 0.84, 0.88), metal=0.00, rough=0.15, alpha=0.35)
SARI = mat("sari", (0.78, 0.62, 0.12), metal=0.30, rough=0.45)

SX = -0.35
SIMIT_Y, SIMIT_Z = 0.95, 0.30
KREM_Y, KREM_Z = 0.74, 0.02
EGIM = math.radians(24)

# ——— simit ———————————————————————————————————————————————————————
jant = torus(0.185, 0.017, loc=(SX, SIMIT_Y, SIMIT_Z), rot=(EGIM, 0, 0), seg=48, ring=14)
gobek = cyl(0.052, 0.042, loc=(SX, SIMIT_Y, SIMIT_Z - 0.012), rot=(math.pi / 2 + EGIM, 0, 0), v=28)
kollar = []
for a in (math.radians(200), math.radians(340), math.radians(90)):
    ux, uy = math.cos(a), math.sin(a)
    kollar.append(cube(
        loc=(SX + ux * 0.10, SIMIT_Y + uy * 0.10, SIMIT_Z - 0.010 - uy * 0.10 * math.tan(EGIM)),
        scale=(0.075, 0.014, 0.010),
        rot=(EGIM, 0, a),
    ))
part([jant] + kollar + [gobek], "direksiyon_simidi", DERI)

airbag = cube(loc=(SX, SIMIT_Y, SIMIT_Z + 0.020), scale=(0.055, 0.048, 0.016), rot=(EGIM, 0, 0))
bevel(airbag, 0.010, 3)
part(airbag, "airbag_modulu", PLASTIK)

# ——— spiral kablo ve sensorler ————————————————————————————————————
sarim = []
for i in range(7):
    sarim.append(torus(0.030 + i * 0.0055, 0.0022,
                       loc=(SX, SIMIT_Y, SIMIT_Z - 0.048),
                       rot=(math.pi / 2 + EGIM, 0, 0), seg=32, ring=6))
sarim_kutu = tube(0.072, 0.028, 0.026, loc=(SX, SIMIT_Y, SIMIT_Z - 0.050),
                  rot=(math.pi / 2 + EGIM, 0, 0), v=32)
part(sarim + [sarim_kutu], "spiral_kablo", SARI)

aci = tube(0.036, 0.024, 0.016, loc=(SX + 0.010, SIMIT_Y - 0.052, SIMIT_Z - 0.095),
           rot=(math.pi / 2 + EGIM, 0, 0), v=28)
aci_soket = cube(loc=(SX + 0.048, SIMIT_Y - 0.052, SIMIT_Z - 0.095), scale=(0.012, 0.010, 0.008))
part([aci, aci_soket], "aci_sensoru", PLASTIK)

tork = tube(0.034, 0.023, 0.030, loc=(SX + 0.032, SIMIT_Y - 0.185, SIMIT_Z - 0.290),
            rot=(math.pi / 2 + EGIM, 0, 0), v=28)
tork_soket = cube(loc=(SX + 0.070, SIMIT_Y - 0.185, SIMIT_Z - 0.290), scale=(0.012, 0.010, 0.008))
part([tork, tork_soket], "tork_sensoru", PLASTIK)

# ——— mil ve mafsal ———————————————————————————————————————————————
ust_mil = cyl(0.016, 0.230, loc=(SX + 0.014, SIMIT_Y - 0.075, SIMIT_Z - 0.135),
              rot=(math.pi / 2 + EGIM, 0, 0), v=20)
alt_mil = cyl(0.014, 0.150, loc=(SX + 0.052, SIMIT_Y - 0.235, SIMIT_Z - 0.360),
              rot=(math.pi / 2 + EGIM, 0, 0), v=20)
kanal = [cyl(0.017, 0.004, loc=(SX + 0.014, SIMIT_Y - 0.075 + i * 0.010, SIMIT_Z - 0.135),
             rot=(math.pi / 2 + EGIM, 0, 0), v=20) for i in (-4, -2, 0, 2, 4)]
part([ust_mil, alt_mil] + kanal, "direksiyon_mili", CELIK)

catal_1 = [cube(loc=(SX + 0.030, SIMIT_Y - 0.168, SIMIT_Z - 0.262 + d), scale=(0.010, 0.026, 0.012),
                rot=(EGIM, 0, 0)) for d in (-0.016, 0.016)]
catal_2 = [cube(loc=(SX + 0.044, SIMIT_Y - 0.205, SIMIT_Z - 0.310), scale=(0.024, 0.010, 0.012),
                rot=(EGIM, 0, 0))]
istavroz = [
    cyl(0.007, 0.044, loc=(SX + 0.037, SIMIT_Y - 0.186, SIMIT_Z - 0.286), rot=(0, math.pi / 2, 0), v=16),
    cyl(0.007, 0.044, loc=(SX + 0.037, SIMIT_Y - 0.186, SIMIT_Z - 0.286), rot=(math.pi / 2 + EGIM, 0, 0), v=16),
]
part(catal_1 + catal_2 + istavroz, "mil_mafsali", CELIK)

# ——— kremayer kutusu, pinyon, baski civatasi ——————————————————————
kutu_govde = cyl(0.038, 0.86, loc=(0, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0), v=32)
bevel(kutu_govde, 0.004, 2)
ayak = [cube(loc=(x, KREM_Y - 0.030, KREM_Z), scale=(0.026, 0.024, 0.030)) for x in (-0.26, 0.26)]
pinyon_kulesi = cyl(0.034, 0.090, loc=(SX + 0.062, KREM_Y + 0.058, KREM_Z - 0.030),
                    rot=(math.pi / 2 + EGIM, 0, 0), v=28)
part([kutu_govde] + ayak + [pinyon_kulesi], "kremayer_kutusu", ALU)

pinyon = cyl(0.026, 0.026, loc=(SX + 0.062, KREM_Y + 0.012, KREM_Z - 0.030),
             rot=(math.pi / 2 + EGIM, 0, 0), v=32)
pinyon_dis = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.0035, 0.005, 0.012), rot=(0, 0, rot[2])),
    18, 0.028, axis='Z', center=(SX + 0.062, KREM_Y + 0.012, KREM_Z - 0.030),
)
part([pinyon] + pinyon_dis, "kremayer_pinyonu", CELIK)

baski = cyl(0.030, 0.020, loc=(SX + 0.062, KREM_Y - 0.044, KREM_Z - 0.030),
            rot=(math.pi / 2 + EGIM, 0, 0), v=24)
baski_altigen = hex_head(0.020, 0.012, loc=(SX + 0.062, KREM_Y - 0.062, KREM_Z - 0.030),
                         rot=(math.pi / 2 + EGIM, 0, 0))
part([baski, baski_altigen], "kremayer_baski_civatasi", CELIK)


# ——— koruk, rot cubugu, rot basi ——————————————————————————————————
def _koruk(x0, isaret, ad):
    halkalar = []
    for i in range(9):
        r = 0.030 if i % 2 == 0 else 0.020
        halkalar.append(cyl(r, 0.011, loc=(x0 + isaret * i * 0.012, KREM_Y, KREM_Z),
                            rot=(0, math.pi / 2, 0), v=24))
    kelepceler = [
        torus(0.022, 0.003, loc=(x0 - isaret * 0.008, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0), seg=20, ring=6),
        torus(0.022, 0.003, loc=(x0 + isaret * 0.104, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0), seg=20, ring=6),
    ]
    return part(halkalar + kelepceler, ad, KAUCUK)


_koruk(-0.44, -1, "koruk_sol")
_koruk(0.44, 1, "koruk_sag")


def _rot_cubugu(isaret, ad):
    cubuk = cyl(0.012, 0.180, loc=(isaret * 0.63, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0), v=20)
    ic_mafsal = sphere(0.021, loc=(isaret * 0.545, KREM_Y, KREM_Z), seg=20, ring=10)
    ayar_somunu = hex_head(0.017, 0.014, loc=(isaret * 0.700, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0))
    return part([cubuk, ic_mafsal, ayar_somunu], ad, CELIK)


_rot_cubugu(-1, "rot_cubugu_sol")
_rot_cubugu(1, "rot_cubugu_sag")


def _rot_basi(isaret, ad):
    govde = cyl(0.026, 0.030, loc=(isaret * 0.760, KREM_Y, KREM_Z), v=24)
    bevel(govde, 0.004, 2)
    kol = cyl(0.013, 0.048, loc=(isaret * 0.735, KREM_Y, KREM_Z), rot=(0, math.pi / 2, 0), v=20)
    konik = cone(0.013, 0.009, 0.034, loc=(isaret * 0.760, KREM_Y + 0.031, KREM_Z), v=20)
    somun = hex_head(0.012, 0.009, loc=(isaret * 0.760, KREM_Y + 0.052, KREM_Z))
    toz = cyl(0.022, 0.012, loc=(isaret * 0.760, KREM_Y + 0.018, KREM_Z), v=20)
    return part([govde, kol, konik, somun, toz], ad, CELIK)


_rot_basi(-1, "rot_basi_sol")
_rot_basi(1, "rot_basi_sag")

# ——— hidrolik yardim —————————————————————————————————————————————
pompa = cyl(0.052, 0.090, loc=(0.34, 0.60, -0.16), rot=(0, math.pi / 2, 0), v=32)
bevel(pompa, 0.006, 2)
pompa_arka = cyl(0.040, 0.030, loc=(0.395, 0.60, -0.16), rot=(0, math.pi / 2, 0), v=24)
pompa_agiz = cyl(0.014, 0.030, loc=(0.34, 0.648, -0.16), v=16)
part([pompa, pompa_arka, pompa_agiz], "hidrolik_pompa", ALU)

kasnak = cyl(0.058, 0.018, loc=(0.290, 0.60, -0.16), rot=(0, math.pi / 2, 0), v=40)
for dx in (-0.005, 0.005):
    boolean(kasnak, torus(0.058, 0.005, loc=(0.290 + dx, 0.60, -0.16), rot=(0, math.pi / 2, 0), seg=40, ring=8))
part(kasnak, "pompa_kasnagi", CELIK)

depo = cube(loc=(0.42, 0.83, -0.10), scale=(0.048, 0.058, 0.040))
bevel(depo, 0.016, 3)
depo_kapak = cyl(0.024, 0.016, loc=(0.42, 0.896, -0.10), v=24)
part([depo, depo_kapak], "hidrolik_deposu", SEFFAF)

basinc_h = curve_tube([(0.34, 0.652, -0.16), (0.30, 0.72, -0.10), (0.10, 0.76, 0.00),
                       (SX + 0.10, KREM_Y + 0.055, KREM_Z - 0.02)], 0.011)
basinc_kelepce = torus(0.014, 0.003, loc=(0.33, 0.665, -0.155), rot=(0.6, 0, 0), seg=18, ring=6)
part([basinc_h, basinc_kelepce], "basinc_hortumu", KAUCUK)

donus_h = curve_tube([(0.42, 0.885, -0.10), (0.40, 0.80, -0.02), (0.20, 0.70, 0.02),
                      (SX + 0.14, KREM_Y + 0.035, KREM_Z + 0.03)], 0.013)
part(donus_h, "donus_hortumu", KAUCUK)

# ——— elektrikli yardim ———————————————————————————————————————————
eps = cyl(0.044, 0.100, loc=(-0.06, KREM_Y + 0.030, KREM_Z - 0.075), rot=(math.pi / 2, 0, 0), v=32)
bevel(eps, 0.005, 2)
eps_disli = cyl(0.034, 0.026, loc=(-0.06, KREM_Y + 0.030, KREM_Z - 0.015), rot=(math.pi / 2, 0, 0), v=28)
eps_soket = cube(loc=(-0.06, KREM_Y + 0.070, KREM_Z - 0.110), scale=(0.014, 0.012, 0.010))
part([eps, eps_disli, eps_soket], "eps_motoru", ALU)

ecu = cube(loc=(0.14, 0.86, -0.18), scale=(0.070, 0.020, 0.055))
bevel(ecu, 0.006, 2)
ecu_kanat = [cube(loc=(0.14, 0.876, -0.210 + i * 0.012), scale=(0.070, 0.006, 0.002)) for i in range(6)]
ecu_soket = cube(loc=(0.14, 0.852, -0.122), scale=(0.030, 0.012, 0.008))
part([ecu] + ecu_kanat + [ecu_soket], "eps_kontrol_unitesi", PLASTIK)

# ——— basinc test cihazi ——————————————————————————————————————————
kadran = cyl(0.048, 0.020, loc=(0.62, 0.92, 0.22), rot=(math.pi / 2, 0, 0), v=32)
kadran_cam = cyl(0.042, 0.005, loc=(0.62, 0.92, 0.233), rot=(math.pi / 2, 0, 0), v=32)
kadran_ibre = cube(loc=(0.62, 0.932, 0.237), scale=(0.002, 0.024, 0.001))
test_sap = cyl(0.012, 0.070, loc=(0.62, 0.878, 0.20), v=16)
test_vana = hex_head(0.014, 0.014, loc=(0.62, 0.842, 0.20))
test_h = curve_tube([(0.62, 0.836, 0.20), (0.56, 0.80, 0.10), (0.40, 0.76, 0.00)], 0.009)
part([kadran, kadran_cam, kadran_ibre, test_sap, test_vana, test_h], "basinc_test_cihazi", BAKIR)

export(sys.argv[-1])
