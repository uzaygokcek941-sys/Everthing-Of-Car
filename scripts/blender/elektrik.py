"""Arac elektrik ve elektronik tezgah sahnesi.

    blender.exe --background --python scripts/blender/elektrik.py -- web/public/models/elektrik.glb

Eksenler: tezgah yuzeyi y=0.90, parcalar yuzeyin ustunde. X = tezgah boyu,
Z = derinlik (+Z izleyiciye yakin).
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

CELIK = mat("celik", (0.580, 0.600, 0.630), metal=1.00, rough=0.36)
ALU = mat("alu", (0.500, 0.520, 0.550), metal=0.85, rough=0.45)
PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.55)
BEYAZ = mat("beyaz", (0.72, 0.73, 0.75), metal=0.00, rough=0.50)
KURSUN = mat("kursun", (0.300, 0.310, 0.330), metal=0.60, rough=0.65)
BAKIR = mat("bakir", (0.480, 0.260, 0.110), metal=0.90, rough=0.45)
KIRMIZI = mat("kirmizi", (0.62, 0.10, 0.08), metal=0.10, rough=0.55)
SIYAH = mat("siyah", (0.05, 0.05, 0.06), metal=0.05, rough=0.70)
AHSAP = mat("ahsap", (0.32, 0.22, 0.13), metal=0.00, rough=0.80)
CAM = mat("cam", (0.85, 0.88, 0.92), metal=0.00, rough=0.10, alpha=0.4)

T = 0.90

# ——— tezgah (yapisal, hedef degil) ————————————————————————————————
yuzey = cube(loc=(0, T - 0.020, 0), scale=(0.95, 0.020, 0.36))
bevel(yuzey, 0.008, 2)
bacaklar = [cube(loc=(dx * 0.88, (T - 0.04) / 2, dz * 0.30), scale=(0.026, (T - 0.04) / 2, 0.026))
            for dx in (-1, 1) for dz in (-1, 1)]
part([yuzey] + bacaklar, "tezgah_yuzeyi", AHSAP)

# ——— aku ——————————————————————————————————————————————————————————
AKU_X = -0.62
aku_govde = cube(loc=(AKU_X, T + 0.105, 0), scale=(0.115, 0.105, 0.085))
bevel(aku_govde, 0.008, 2)
aku_kapak = cube(loc=(AKU_X, T + 0.214, 0), scale=(0.115, 0.008, 0.085))
tapalar = [cyl(0.016, 0.008, loc=(AKU_X - 0.06 + i * 0.04, T + 0.224, 0), v=16) for i in range(4)]
part([aku_govde, aku_kapak] + tapalar, "aku_govdesi", SIYAH)

part(cone(0.017, 0.014, 0.026, loc=(AKU_X - 0.075, T + 0.226, 0.052), v=20), "aku_arti_kutup", KURSUN)
part(cone(0.015, 0.012, 0.024, loc=(AKU_X + 0.075, T + 0.225, 0.052), v=20), "aku_eksi_kutup", KURSUN)

for isaret, ad, mater, x in ((-1, "aku_arti_kelepce", KIRMIZI, AKU_X - 0.075),
                             (1, "aku_eksi_kelepce", SIYAH, AKU_X + 0.075)):
    halka = tube(0.026, 0.018, 0.014, loc=(x, T + 0.238, 0.052), v=24)
    kulak = cube(loc=(x + isaret * 0.030, T + 0.238, 0.052), scale=(0.014, 0.007, 0.010))
    civata = cyl(0.004, 0.024, loc=(x + isaret * 0.038, T + 0.238, 0.052), rot=(0, math.pi / 2, 0), v=12)
    kablo = curve_tube([(x + isaret * 0.030, T + 0.238, 0.052),
                        (x + isaret * 0.10, T + 0.20, 0.10),
                        (x + isaret * 0.16, T + 0.06, 0.14)], 0.009)
    part([halka, kulak, civata, kablo], ad, mater)

# ——— sigorta kutusu ———————————————————————————————————————————————
SK_X = -0.24
sk_govde = cube(loc=(SK_X, T + 0.045, 0.02), scale=(0.085, 0.045, 0.062))
bevel(sk_govde, 0.006, 2)
sk_kapak = cube(loc=(SK_X, T + 0.095, 0.02), scale=(0.088, 0.006, 0.065))
sk_yuvalar = []
for i in range(4):
    for j in range(2):
        sk_yuvalar.append(cube(loc=(SK_X - 0.05 + i * 0.033, T + 0.088, 0.02 - 0.022 + j * 0.044),
                               scale=(0.010, 0.004, 0.014)))
part([sk_govde, sk_kapak] + sk_yuvalar, "sigorta_kutusu", PLASTIK)


def _sigorta(x, z, ad, renk):
    g = cube(loc=(x, T + 0.108, z), scale=(0.009, 0.014, 0.013))
    bevel(g, 0.002, 2)
    bacak = [cube(loc=(x, T + 0.094, z + dz), scale=(0.003, 0.008, 0.002)) for dz in (-0.006, 0.006)]
    return part([g] + bacak, ad, renk)


_sigorta(SK_X - 0.017, -0.002, "sigorta_1", KIRMIZI)
_sigorta(SK_X + 0.016, -0.002, "sigorta_2", BEYAZ)

# ——— role ve soketi ———————————————————————————————————————————————
role_govde = cube(loc=(SK_X + 0.16, T + 0.062, 0.02), scale=(0.022, 0.026, 0.020))
bevel(role_govde, 0.004, 2)
role_tirnak = cube(loc=(SK_X + 0.16, T + 0.090, 0.02), scale=(0.008, 0.004, 0.006))
part([role_govde, role_tirnak], "role", SIYAH)

soket_govde = cube(loc=(SK_X + 0.16, T + 0.022, 0.02), scale=(0.026, 0.016, 0.024))
soket_uc = [cube(loc=(SK_X + 0.16 + dx, T + 0.006, 0.02 + dz), scale=(0.004, 0.010, 0.002))
            for dx in (-0.012, 0.012) for dz in (-0.010, 0.010)]
part([soket_govde] + soket_uc, "role_soketi", PLASTIK)

# ——— kablo demeti, sase, far ——————————————————————————————————————
ana = curve_tube([(-0.42, T + 0.020, 0.14), (-0.10, T + 0.030, 0.18), (0.24, T + 0.026, 0.16),
                  (0.52, T + 0.020, 0.12)], 0.016)
bant = [torus(0.019, 0.004, loc=(-0.30 + i * 0.22, T + 0.026, 0.16), rot=(math.pi / 2, 0, 0.2), seg=20, ring=6)
        for i in range(4)]
dallar = [curve_tube([(-0.10 + i * 0.20, T + 0.030, 0.17), (-0.06 + i * 0.20, T + 0.040, 0.09)], 0.007)
          for i in range(3)]
part([ana] + bant + dallar, "kablo_demeti", SIYAH)

sase_plaka = cube(loc=(0.30, T + 0.008, -0.16), scale=(0.055, 0.008, 0.040))
sase_civata = cyl(0.007, 0.026, loc=(0.30, T + 0.022, -0.16), v=14)
sase_pabuc = cube(loc=(0.30, T + 0.032, -0.16), scale=(0.016, 0.003, 0.010))
sase_somun = hex_head(0.011, 0.008, loc=(0.30, T + 0.040, -0.16))
part([sase_plaka, sase_civata, sase_pabuc, sase_somun], "sase_noktasi", CELIK)

far_govde = cone(0.055, 0.030, 0.070, loc=(0.62, T + 0.055, -0.10), rot=(math.pi / 2, 0, 0), v=32)
far_cam = cyl(0.056, 0.006, loc=(0.62, T + 0.055, -0.138), rot=(math.pi / 2, 0, 0), v=32)
far_ampul = cyl(0.010, 0.030, loc=(0.62, T + 0.055, -0.058), rot=(math.pi / 2, 0, 0), v=16)
part([far_govde, far_cam, far_ampul], "far_soketi", CAM)

# ——— alternator ———————————————————————————————————————————————————
ALT_X = 0.02
alt = cyl(0.058, 0.100, loc=(ALT_X, T + 0.062, -0.14), rot=(0, math.pi / 2, 0), v=32)
bevel(alt, 0.006, 2)
alt_kanat = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.048, 0.004, 0.006), rot=(rot[0], 0, 0)),
    18, 0.050, axis='X', center=(ALT_X, T + 0.062, -0.14),
)
part([alt] + alt_kanat, "alternator_govdesi", ALU)

alt_kasnak = cyl(0.036, 0.016, loc=(ALT_X - 0.058, T + 0.062, -0.14), rot=(0, math.pi / 2, 0), v=32)
for dx in (-0.004, 0.004):
    boolean(alt_kasnak, torus(0.036, 0.004, loc=(ALT_X - 0.058 + dx, T + 0.062, -0.14),
                              rot=(0, math.pi / 2, 0), seg=32, ring=8))
part(alt_kasnak, "alternator_kasnagi", CELIK)

b_ucu = cyl(0.006, 0.020, loc=(ALT_X + 0.056, T + 0.086, -0.14), rot=(0, math.pi / 2, 0), v=14)
b_somun = hex_head(0.010, 0.007, loc=(ALT_X + 0.068, T + 0.086, -0.14), rot=(0, math.pi / 2, 0))
part([b_ucu, b_somun], "alternator_b_ucu", BAKIR)

reg = cube(loc=(ALT_X + 0.050, T + 0.030, -0.14), scale=(0.014, 0.020, 0.026))
reg_firca = [cube(loc=(ALT_X + 0.050, T + 0.010, -0.14 + dz), scale=(0.004, 0.008, 0.004))
             for dz in (-0.010, 0.010)]
part([reg] + reg_firca, "alternator_regulator", PLASTIK)

# ——— mars motoru ——————————————————————————————————————————————————
MX = 0.40
mars = cyl(0.052, 0.130, loc=(MX, T + 0.055, -0.16), rot=(0, math.pi / 2, 0), v=32)
bevel(mars, 0.006, 2)
mars_burun = cyl(0.036, 0.050, loc=(MX - 0.086, T + 0.055, -0.16), rot=(0, math.pi / 2, 0), v=28)
pinyon = cyl(0.020, 0.028, loc=(MX - 0.122, T + 0.055, -0.16), rot=(0, math.pi / 2, 0), v=24)
pinyon_dis = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.013, 0.003, 0.003), rot=(rot[0], 0, 0)),
    11, 0.021, axis='X', center=(MX - 0.122, T + 0.055, -0.16),
)
part([mars, mars_burun, pinyon] + pinyon_dis, "mars_govdesi", CELIK)

sel = cyl(0.028, 0.075, loc=(MX - 0.010, T + 0.115, -0.16), rot=(0, math.pi / 2, 0), v=24)
bevel(sel, 0.004, 2)
part(sel, "mars_selenoidi", ALU)

mars_b = cyl(0.007, 0.022, loc=(MX + 0.036, T + 0.128, -0.16), v=14)
mars_b_somun = hex_head(0.011, 0.008, loc=(MX + 0.036, T + 0.142, -0.16))
part([mars_b, mars_b_somun], "mars_b_ucu", BAKIR)

tetik = cyl(0.005, 0.016, loc=(MX + 0.010, T + 0.140, -0.16), v=12)
tetik_soket = cube(loc=(MX + 0.010, T + 0.152, -0.16), scale=(0.008, 0.006, 0.006))
part([tetik, tetik_soket], "mars_tetik_ucu", PLASTIK)

# ——— sensor ———————————————————————————————————————————————————————
sen = cyl(0.016, 0.048, loc=(0.68, T + 0.026, 0.14), v=24)
sen_altigen = hex_head(0.020, 0.012, loc=(0.68, T + 0.008, 0.14))
part([sen, sen_altigen], "sensor_govdesi", CELIK)

sen_soket = cube(loc=(0.68, T + 0.058, 0.14), scale=(0.014, 0.012, 0.010))
sen_uc = [cube(loc=(0.68 + dx, T + 0.052, 0.14), scale=(0.002, 0.008, 0.002)) for dx in (-0.005, 0.005)]
part([sen_soket] + sen_uc, "sensor_soketi", PLASTIK)

# ——— multimetre ———————————————————————————————————————————————————
MM_X = -0.44
mm = cube(loc=(MM_X, T + 0.024, 0.20), scale=(0.062, 0.024, 0.090))
bevel(mm, 0.010, 3)
part(mm, "multimetre_govdesi", KIRMIZI)

ekran = cube(loc=(MM_X, T + 0.049, 0.246), scale=(0.046, 0.002, 0.030))
ekran_cerceve = cube(loc=(MM_X, T + 0.047, 0.246), scale=(0.052, 0.004, 0.036))
part([ekran_cerceve, ekran], "multimetre_ekran", PLASTIK)

secici = cyl(0.024, 0.010, loc=(MM_X, T + 0.050, 0.176), v=28)
ok = cube(loc=(MM_X, T + 0.056, 0.194), scale=(0.004, 0.002, 0.014))
kademe = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.002, 0.001, 0.005), rot=(0, 0, rot[2])),
    12, 0.030, axis='Y', center=(MM_X, T + 0.048, 0.176),
)
part([secici, ok] + kademe, "multimetre_secici", SIYAH)

for isaret, ad, mater in ((-1, "prob_siyah", SIYAH), (1, "prob_kirmizi", KIRMIZI)):
    sap = cyl(0.008, 0.075, loc=(MM_X + isaret * 0.16, T + 0.012, 0.26), rot=(0, 0, math.pi / 2), v=16)
    uc = cone(0.006, 0.001, 0.045, loc=(MM_X + isaret * 0.22, T + 0.012, 0.26),
              rot=(0, isaret * math.pi / 2, 0), v=14)
    kablo = curve_tube([(MM_X + isaret * 0.125, T + 0.012, 0.26),
                        (MM_X + isaret * 0.06, T + 0.010, 0.30),
                        (MM_X + isaret * 0.020, T + 0.014, 0.248)], 0.005)
    part([sap, uc, kablo], ad, mater)

export(sys.argv[-1])
