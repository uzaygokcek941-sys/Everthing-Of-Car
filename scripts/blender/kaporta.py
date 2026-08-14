"""Kaporta ve boya sahnesi: aracin sol on kosesi + onarim ekipmani.

    blender.exe --background --python scripts/blender/kaporta.py -- web/public/models/kaporta.glb

Eksenler: X = arac eni (+X sag), Y = yukari, Z = on-arka (+Z one dogru).
Sol yan panel duzlemi x=-0.80; ekipman +X tarafinda tezgah hizasinda.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

SAC = mat("sac", (0.420, 0.440, 0.470), metal=0.70, rough=0.55)
BOYALI = mat("boyali", (0.055, 0.115, 0.235), metal=0.00, rough=0.30)
ASTAR = mat("astar", (0.58, 0.55, 0.50), metal=0.10, rough=0.85)
CELIK = mat("celik", (0.580, 0.600, 0.630), metal=1.00, rough=0.36)
PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.55)
BAKIR = mat("bakir", (0.480, 0.260, 0.110), metal=0.90, rough=0.45)
TURUNCU = mat("turuncu", (0.78, 0.34, 0.10), metal=0.20, rough=0.50)

YAN = -0.80
TEZGAH = 0.90
EK = 0.75


def _panel(loc, scale, mater, ad, kaburga=0):
    govde = cube(loc=loc, scale=scale)
    bevel(govde, 0.012, 3)
    parcalar = [govde]
    for i in range(kaburga):
        parcalar.append(cube(
            loc=(loc[0] + 0.012, loc[1] - scale[1] * 0.6 + i * (scale[1] * 1.2 / max(kaburga, 1)), loc[2]),
            scale=(0.006, 0.010, scale[2] * 0.85),
        ))
    return part(parcalar, ad, mater)


# ——— dis paneller —————————————————————————————————————————————————
_panel((YAN, 0.72, 0.30), (0.014, 0.28, 0.42), BOYALI, "on_kapi_paneli", 2)
_panel((YAN, 0.72, -0.44), (0.014, 0.28, 0.36), BOYALI, "arka_kapi_paneli", 2)
_panel((YAN, 0.74, 1.00), (0.016, 0.30, 0.30), BOYALI, "on_camurluk")

kaput_panel = cube(loc=(-0.42, 1.02, 1.32), scale=(0.42, 0.012, 0.34))
bevel(kaput_panel, 0.016, 3)
kaput_kaburga = [cube(loc=(-0.42, 0.998, 1.04 + i * 0.19), scale=(0.40, 0.014, 0.014)) for i in range(4)]
part([kaput_panel] + kaput_kaburga, "kaput", BOYALI)

tavan = cube(loc=(-0.42, 1.42, 0.10), scale=(0.42, 0.012, 0.62))
bevel(tavan, 0.020, 3)
tavan_kanal = [cube(loc=(-0.80 + i * 0.76, 1.412, 0.10), scale=(0.010, 0.014, 0.60)) for i in range(2)]
part([tavan] + tavan_kanal, "tavan_paneli", BOYALI)

bagaj = cube(loc=(-0.42, 1.02, -0.92), scale=(0.42, 0.014, 0.26), rot=(0.22, 0, 0))
bevel(bagaj, 0.016, 3)
bagaj_kilit = cube(loc=(-0.42, 0.92, -1.10), scale=(0.030, 0.020, 0.016))
part([bagaj, bagaj_kilit], "bagaj_kapagi", BOYALI)

tampon = cube(loc=(-0.42, 0.66, 1.62), scale=(0.44, 0.16, 0.045))
bevel(tampon, 0.030, 4)
tampon_alt = cube(loc=(-0.42, 0.52, 1.60), scale=(0.40, 0.05, 0.035), rot=(-0.25, 0, 0))
part([tampon, tampon_alt], "tampon_kaporta", PLASTIK)

# ——— tasiyici yapi ————————————————————————————————————————————————
a_direk = cube(loc=(YAN + 0.02, 1.10, 0.70), scale=(0.030, 0.24, 0.055), rot=(-0.55, 0, 0))
bevel(a_direk, 0.008, 2)
a_ic = cube(loc=(YAN + 0.05, 1.10, 0.70), scale=(0.018, 0.22, 0.040), rot=(-0.55, 0, 0))
part([a_direk, a_ic], "direk_a", SAC)

b_direk = cube(loc=(YAN + 0.02, 1.02, 0.02), scale=(0.030, 0.34, 0.050))
bevel(b_direk, 0.008, 2)
b_ic = cube(loc=(YAN + 0.05, 1.02, 0.02), scale=(0.018, 0.32, 0.036))
b_kilit = cube(loc=(YAN + 0.005, 0.86, 0.02), scale=(0.014, 0.026, 0.030))
part([b_direk, b_ic, b_kilit], "direk_b", SAC)

esik = cube(loc=(YAN + 0.02, 0.40, 0.06), scale=(0.040, 0.070, 0.68))
bevel(esik, 0.010, 3)
esik_kivrim = cube(loc=(YAN + 0.02, 0.335, 0.06), scale=(0.048, 0.010, 0.68))
part([esik, esik_kivrim], "esik_saci", SAC)

ayak = cube(loc=(YAN + 0.10, 0.30, 0.06), scale=(0.055, 0.045, 0.30))
bevel(ayak, 0.008, 2)
ayak_kanat = [cube(loc=(YAN + 0.10, 0.30, 0.06 + dz), scale=(0.075, 0.008, 0.040)) for dz in (-0.22, 0.22)]
part([ayak] + ayak_kanat, "tasiyici_ayak", SAC)

puntalar = [cyl(0.007, 0.004, loc=(YAN + 0.058, 0.335, -0.24 + i * 0.09), rot=(0, math.pi / 2, 0), v=14)
            for i in range(7)]
part(puntalar, "punta_noktasi", CELIK)

# ——— hasar ve onarim bolgeleri ————————————————————————————————————
gocuk = cyl(0.085, 0.012, loc=(YAN - 0.004, 0.70, 0.34), rot=(0, math.pi / 2, 0), v=40)
boolean(gocuk, sphere(0.16, loc=(YAN + 0.155, 0.70, 0.34), seg=32, ring=16))
part(gocuk, "gocuk_bolgesi", SAC)

zimpara = cyl(0.105, 0.006, loc=(YAN - 0.010, 0.70, -0.40), rot=(0, math.pi / 2, 0), v=40)
zimpara_kademe = tube(0.135, 0.105, 0.004, loc=(YAN - 0.008, 0.70, -0.40), rot=(0, math.pi / 2, 0), v=40)
part([zimpara, zimpara_kademe], "zimpara_bolgesi", ASTAR)

# ——— ekipman ——————————————————————————————————————————————————————
tabanca_govde = cyl(0.020, 0.110, loc=(EK, TEZGAH + 0.06, 0.30), rot=(0, 0, math.pi / 2), v=24)
tabanca_kap = cyl(0.042, 0.090, loc=(EK - 0.02, TEZGAH + 0.13, 0.30), v=28)
tabanca_meme = cone(0.016, 0.007, 0.030, loc=(EK + 0.070, TEZGAH + 0.06, 0.30), rot=(0, math.pi / 2, 0), v=20)
tabanca_sap = cube(loc=(EK - 0.020, TEZGAH - 0.01, 0.30), scale=(0.014, 0.055, 0.020), rot=(0, 0, 0.18))
tabanca_tetik = cube(loc=(EK + 0.008, TEZGAH + 0.028, 0.30), scale=(0.005, 0.022, 0.008), rot=(0, 0, -0.3))
tabanca_hortum = curve_tube([(EK - 0.030, TEZGAH - 0.06, 0.30), (EK + 0.10, TEZGAH - 0.30, 0.42),
                             (EK + 0.16, TEZGAH - 0.60, 0.60)], 0.012)
part([tabanca_govde, tabanca_kap, tabanca_meme, tabanca_sap, tabanca_tetik, tabanca_hortum],
     "boya_tabancasi", CELIK)

kaynak_govde = cube(loc=(EK + 0.10, 0.34, -0.30), scale=(0.16, 0.26, 0.12))
bevel(kaynak_govde, 0.014, 3)
kaynak_panel = cube(loc=(EK + 0.10, 0.54, -0.19), scale=(0.10, 0.05, 0.008))
kaynak_tekerlek = [cyl(0.035, 0.020, loc=(EK + 0.10 + dx, 0.045, -0.30 + dz), rot=(0, math.pi / 2, 0), v=18)
                   for dx, dz in ((-0.14, -0.09), (-0.14, 0.09), (0.14, -0.09), (0.14, 0.09))]
kaynak_kablo = curve_tube([(EK + 0.10, 0.58, -0.19), (EK + 0.02, 0.72, 0.00), (EK - 0.10, 0.62, 0.16)], 0.012)
kaynak_pense = cube(loc=(EK - 0.14, 0.60, 0.20), scale=(0.020, 0.060, 0.014), rot=(0, 0, 0.4))
part([kaynak_govde, kaynak_panel] + kaynak_tekerlek + [kaynak_kablo, kaynak_pense],
     "kaynak_makinesi", TURUNCU)

cek_kop = cyl(0.030, 0.026, loc=(EK, TEZGAH + 0.05, 0.68), rot=(0, math.pi / 2, 0), v=24)
cek_mil = cyl(0.010, 0.230, loc=(EK + 0.14, TEZGAH + 0.05, 0.68), rot=(0, math.pi / 2, 0), v=16)
cek_agirlik = cyl(0.028, 0.070, loc=(EK + 0.16, TEZGAH + 0.05, 0.68), rot=(0, math.pi / 2, 0), v=20)
cek_sap = cyl(0.018, 0.060, loc=(EK + 0.27, TEZGAH + 0.05, 0.68), rot=(0, math.pi / 2, 0), v=18)
cek_uc = cone(0.014, 0.004, 0.026, loc=(EK - 0.028, TEZGAH + 0.05, 0.68), rot=(0, -math.pi / 2, 0), v=18)
part([cek_kop, cek_mil, cek_agirlik, cek_sap, cek_uc], "gocuk_cektirme", CELIK)

olcer_govde = cube(loc=(EK, TEZGAH + 0.03, 0.94), scale=(0.028, 0.055, 0.016))
bevel(olcer_govde, 0.006, 2)
olcer_ekran = cube(loc=(EK, TEZGAH + 0.06, 0.958), scale=(0.020, 0.016, 0.003))
olcer_prob = cyl(0.006, 0.030, loc=(EK, TEZGAH - 0.035, 0.94), v=14)
part([olcer_govde, olcer_ekran, olcer_prob], "kalinlik_olcer", PLASTIK)

mastar_cubuk = cube(loc=(EK, TEZGAH + 0.005, 1.20), scale=(0.010, 0.006, 0.170))
mastar_ayak = [cube(loc=(EK, TEZGAH - 0.030, 1.20 + dz), scale=(0.008, 0.030, 0.006)) for dz in (-0.15, 0.15)]
mastar_ibre = cube(loc=(EK, TEZGAH - 0.020, 1.20), scale=(0.006, 0.026, 0.004))
part([mastar_cubuk] + mastar_ayak + [mastar_ibre], "olcum_mastari", BAKIR)

export(sys.argv[-1])
