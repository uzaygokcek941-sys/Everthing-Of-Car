"""Aksesuar ve ses sahnesi: sol on kapi kesiti + kabin onu + bagaj/arka + tavan.

    blender.exe --background --python scripts/blender/aksesuar.py -- web/public/models/aksesuar.glb

Eksenler: X = arac eni (+X sag ve kabin icine dogru), Y = yukari,
Z = on-arka (+Z one dogru). Kapi duzlemi x=-0.55; bagaj tarafi negatif Z.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

SAC = mat("sac", (0.62, 0.64, 0.67), metal=0.88, rough=0.32)
BOYALI = mat("boyali", (0.16, 0.32, 0.55), metal=0.35, rough=0.26)
PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.58)
DOSEME = mat("doseme", (0.22, 0.21, 0.20), metal=0.00, rough=0.85)
CAM = mat("cam", (0.72, 0.80, 0.85), metal=0.00, rough=0.06, alpha=0.28)
KAUCUK = mat("kaucuk", (0.07, 0.07, 0.08), metal=0.00, rough=0.90)
CELIK = mat("celik", (0.55, 0.57, 0.60), metal=0.95, rough=0.28)
BAKIR = mat("bakir", (0.74, 0.46, 0.20), metal=0.92, rough=0.30)
KIRMIZI = mat("kirmizi", (0.62, 0.10, 0.08), metal=0.10, rough=0.50)
KAGIT = mat("kagit", (0.80, 0.78, 0.72), metal=0.00, rough=0.88)
SIYAH = mat("siyah", (0.05, 0.05, 0.06), metal=0.05, rough=0.70)

KAPI = -0.55
ON = 1.30
ARKA = -1.25

# ═══ 1. sol on kapi kesiti ═══════════════════════════════════════════
kapi_dis = cube(loc=(KAPI - 0.035, 0.72, 0.20), scale=(0.014, 0.30, 0.44))
bevel(kapi_dis, 0.014, 3)
kapi_kivrim = cube(loc=(KAPI - 0.030, 0.86, 0.20), scale=(0.020, 0.012, 0.42))
cerceve = [cube(loc=(KAPI - 0.028, 1.12, 0.20 + dz), scale=(0.014, 0.16, 0.014)) for dz in (-0.42, 0.42)]
cerceve.append(cube(loc=(KAPI - 0.028, 1.27, 0.20), scale=(0.014, 0.012, 0.42)))
part([kapi_dis, kapi_kivrim] + cerceve, "kapi_saci", BOYALI)

modul = cube(loc=(KAPI + 0.010, 0.74, 0.20), scale=(0.010, 0.26, 0.38))
for dy, dz in ((0.14, -0.22), (-0.16, 0.10)):
    boolean(modul, cyl(0.030, 0.040, loc=(KAPI + 0.010, 0.74 + dy, 0.20 + dz), rot=(0, math.pi / 2, 0), v=20))
modul_klips = [cyl(0.008, 0.020, loc=(KAPI + 0.010, 0.74 + dy, 0.20 + dz), rot=(0, math.pi / 2, 0), v=12)
               for dy, dz in ((0.24, -0.30), (0.24, 0.30), (-0.24, -0.30), (-0.24, 0.30))]
part([modul] + modul_klips, "kapi_modulu", PLASTIK)

doseme = cube(loc=(KAPI + 0.055, 0.74, 0.20), scale=(0.012, 0.30, 0.42))
bevel(doseme, 0.016, 3)
kolcak = cube(loc=(KAPI + 0.085, 0.80, 0.14), scale=(0.030, 0.030, 0.14))
bevel(kolcak, 0.012, 3)
kol_cukuru = cube(loc=(KAPI + 0.075, 0.60, 0.10), scale=(0.024, 0.070, 0.16))
dugmeler = [cube(loc=(KAPI + 0.100, 0.845, 0.08 + i * 0.035), scale=(0.012, 0.006, 0.012)) for i in range(3)]
part([doseme, kolcak, kol_cukuru] + dugmeler, "kapi_ic_dosemesi", DOSEME)

part(cube(loc=(KAPI - 0.012, 1.10, 0.20), scale=(0.004, 0.17, 0.40), rot=(0, 0, 0.03)), "kapi_cami", CAM)

kizak = [cube(loc=(KAPI - 0.012, 0.86, 0.20 + dz), scale=(0.010, 0.16, 0.008)) for dz in (-0.34, 0.34)]
makas_1 = cube(loc=(KAPI - 0.005, 0.78, 0.18), scale=(0.006, 0.008, 0.20), rot=(0, 0.5, 0))
makas_2 = cube(loc=(KAPI - 0.005, 0.78, 0.18), scale=(0.006, 0.008, 0.20), rot=(0, -0.5, 0))
tasiyici = cube(loc=(KAPI - 0.010, 0.90, 0.20), scale=(0.008, 0.010, 0.16))
part(kizak + [makas_1, makas_2, tasiyici], "cam_krikosu", CELIK)

cm_govde = cyl(0.026, 0.055, loc=(KAPI + 0.010, 0.66, 0.06), rot=(0, math.pi / 2, 0), v=24)
cm_disli = cyl(0.034, 0.016, loc=(KAPI + 0.042, 0.66, 0.06), rot=(0, math.pi / 2, 0), v=28)
cm_soket = cube(loc=(KAPI + 0.010, 0.635, 0.02), scale=(0.012, 0.010, 0.014))
part([cm_govde, cm_disli, cm_soket], "cam_motoru", PLASTIK)

mk_govde = cube(loc=(KAPI + 0.010, 0.70, 0.52), scale=(0.014, 0.030, 0.026))
mk_kol = cyl(0.005, 0.048, loc=(KAPI + 0.010, 0.74, 0.545), v=12)
mk_soket = cube(loc=(KAPI + 0.010, 0.665, 0.50), scale=(0.010, 0.008, 0.012))
part([mk_govde, mk_kol, mk_soket], "merkezi_kilit_motoru", PLASTIK)

hp_kon = cone(0.062, 0.024, 0.038, loc=(KAPI + 0.020, 0.55, -0.10), rot=(0, -math.pi / 2, 0), v=32)
hp_cerceve = tube(0.070, 0.058, 0.010, loc=(KAPI + 0.040, 0.55, -0.10), rot=(0, math.pi / 2, 0), v=32)
hp_kulak = ring_of(
    lambda loc, rot, i: cyl(0.006, 0.008, loc=loc, rot=(0, math.pi / 2, 0), v=10),
    4, 0.076, axis='X', center=(KAPI + 0.040, 0.55, -0.10),
)
part([hp_kon, hp_cerceve] + hp_kulak, "hoparlor_kapi", SIYAH)

koruk = []
for i in range(7):
    r = 0.020 if i % 2 == 0 else 0.014
    koruk.append(cyl(r, 0.014, loc=(KAPI - 0.010, 0.98, 0.63 + i * 0.014), rot=(math.pi / 2, 0, 0), v=18))
part(koruk, "kapi_korugu", KAUCUK)

kkd = curve_tube([(KAPI - 0.010, 0.98, 0.70), (KAPI + 0.010, 0.90, 0.56),
                  (KAPI + 0.010, 0.72, 0.30), (KAPI + 0.010, 0.62, 0.02)], 0.010)
kkd_dal = [curve_tube([(KAPI + 0.010, 0.72 + i * 0.06, 0.30 - i * 0.10),
                       (KAPI + 0.020, 0.68 + i * 0.06, 0.24 - i * 0.10)], 0.005) for i in range(3)]
part([kkd] + kkd_dal, "kapi_kablo_demeti", SIYAH)

ayna_govde = cube(loc=(KAPI - 0.075, 1.12, 0.62), scale=(0.038, 0.042, 0.055))
bevel(ayna_govde, 0.020, 3)
ayna_cam = cube(loc=(KAPI - 0.108, 1.12, 0.62), scale=(0.004, 0.032, 0.042))
ayna_ayak = cube(loc=(KAPI - 0.040, 1.10, 0.64), scale=(0.026, 0.026, 0.020))
part([ayna_govde, ayna_cam, ayna_ayak], "dis_dikiz_aynasi", BOYALI)

am_govde = cyl(0.016, 0.028, loc=(KAPI - 0.078, 1.12, 0.62), rot=(0, math.pi / 2, 0), v=20)
am_disli = cyl(0.020, 0.008, loc=(KAPI - 0.096, 1.12, 0.62), rot=(0, math.pi / 2, 0), v=20)
part([am_govde, am_disli], "ayna_motoru", PLASTIK)

# ═══ 2. kabin onu ════════════════════════════════════════════════════
part(cube(loc=(0, 1.28, ON - 0.10), scale=(0.62, 0.26, 0.010), rot=(-0.62, 0, 0)), "on_cam", CAM)

ys_govde = cube(loc=(0.06, 1.34, ON - 0.02), scale=(0.026, 0.020, 0.014), rot=(-0.62, 0, 0))
ys_lens = cyl(0.014, 0.006, loc=(0.06, 1.325, ON - 0.033), rot=(-0.62 + math.pi / 2, 0, 0), v=20)
part([ys_govde, ys_lens], "yagmur_sensoru", PLASTIK)

ok_govde = cube(loc=(-0.03, 1.34, ON - 0.02), scale=(0.020, 0.018, 0.026), rot=(-0.62, 0, 0))
ok_lens = cyl(0.010, 0.010, loc=(-0.03, 1.322, ON - 0.038), rot=(-0.62 + math.pi / 2, 0, 0), v=20)
part([ok_govde, ok_lens], "on_kamera", SIYAH)

sk_mil = cyl(0.008, 0.030, loc=(-0.34, 1.04, ON + 0.16), v=14)
sk_kol = cube(loc=(-0.24, 1.06, ON + 0.16), scale=(0.10, 0.008, 0.010), rot=(0, 0, 0.16))
sk_lastik = cube(loc=(-0.10, 1.08, ON + 0.16), scale=(0.20, 0.004, 0.014), rot=(0, 0, 0.16))
part([sk_mil, sk_kol, sk_lastik], "silecek_kolu", SIYAH)

sm_govde = cyl(0.036, 0.070, loc=(-0.34, 1.00, ON + 0.05), rot=(math.pi / 2, 0, 0), v=28)
sm_disli = cyl(0.048, 0.020, loc=(-0.34, 1.00, ON + 0.095), rot=(math.pi / 2, 0, 0), v=32)
sm_kol = cube(loc=(-0.28, 1.02, ON + 0.11), scale=(0.055, 0.008, 0.008))
sm_soket = cube(loc=(-0.34, 1.03, ON + 0.01), scale=(0.014, 0.012, 0.010))
part([sm_govde, sm_disli, sm_kol, sm_soket], "silecek_motoru", PLASTIK)

bu_govde = cube(loc=(0, 0.98, ON - 0.42), scale=(0.098, 0.055, 0.075))
bevel(bu_govde, 0.008, 2)
bu_ekran = cube(loc=(0, 0.99, ON - 0.345), scale=(0.088, 0.046, 0.004))
bu_dugme = [cyl(0.008, 0.006, loc=(dx * 0.082, 0.955, ON - 0.345), rot=(math.pi / 2, 0, 0), v=16)
            for dx in (-1, 1)]
bu_soket = [cube(loc=(dx * 0.060, 0.955, ON - 0.50), scale=(0.024, 0.016, 0.012)) for dx in (-1, 1)]
part([bu_govde, bu_ekran] + bu_dugme + bu_soket, "bas_unite", PLASTIK)

far_govde = cube(loc=(-0.42, 0.86, ON + 0.34), scale=(0.15, 0.070, 0.075), rot=(0, 0.18, 0))
bevel(far_govde, 0.022, 3)
far_cam = cube(loc=(-0.42, 0.86, ON + 0.415), scale=(0.145, 0.062, 0.006), rot=(0, 0.18, 0))
far_reflektor = [cyl(0.036, 0.030, loc=(-0.42 + dx, 0.86, ON + 0.39), rot=(math.pi / 2, 0, 0), v=24)
                 for dx in (-0.06, 0.06)]
part([far_govde, far_cam] + far_reflektor, "far_grubu", CAM)

tampon = cube(loc=(0, 0.70, ON + 0.52), scale=(0.66, 0.16, 0.045))
bevel(tampon, 0.030, 4)
tampon_alt = cube(loc=(0, 0.56, ON + 0.49), scale=(0.60, 0.055, 0.035), rot=(-0.28, 0, 0))
part([tampon, tampon_alt], "tampon", PLASTIK)

sk2_govde = cube(loc=(0.44, 0.94, ON - 0.30), scale=(0.075, 0.042, 0.055))
bevel(sk2_govde, 0.006, 2)
sk2_kapak = cube(loc=(0.44, 0.99, ON - 0.30), scale=(0.078, 0.006, 0.058))
sk2_sigorta = [cube(loc=(0.40 + i * 0.026, 0.985, ON - 0.30), scale=(0.008, 0.012, 0.012)) for i in range(4)]
part([sk2_govde, sk2_kapak] + sk2_sigorta, "sigorta_kutusu", PLASTIK)

ana = curve_tube([(0.46, 0.90, ON - 0.36), (0.20, 0.86, ON - 0.60), (-0.10, 0.84, ARKA + 0.60),
                  (-0.20, 0.82, ARKA + 0.20)], 0.018)
ana_bant = [torus(0.021, 0.004, loc=(0.20 - i * 0.14, 0.855 - i * 0.006, ON - 0.60 - i * 0.42),
                  rot=(math.pi / 2, 0.2, 0), seg=20, ring=6) for i in range(4)]
part([ana] + ana_bant, "ana_kablo_demeti", SIYAH)

can = curve_tube([(0.44, 0.92, ON - 0.34), (0.12, 0.88, ON - 0.70), (-0.05, 0.86, 0.10)], 0.006)
can_2 = curve_tube([(0.44, 0.912, ON - 0.34), (0.12, 0.872, ON - 0.70), (-0.05, 0.852, 0.10)], 0.006)
part([can, can_2], "haberlesme_hatti", BAKIR)

sn_plaka = cube(loc=(0.50, 0.80, ON - 0.60), scale=(0.045, 0.008, 0.035))
sn_civata = cyl(0.007, 0.024, loc=(0.50, 0.812, ON - 0.60), v=14)
sn_pabuc = cube(loc=(0.50, 0.822, ON - 0.60), scale=(0.016, 0.003, 0.010))
sn_somun = hex_head(0.011, 0.008, loc=(0.50, 0.830, ON - 0.60))
part([sn_plaka, sn_civata, sn_pabuc, sn_somun], "sase_noktasi", CELIK)

# ═══ 3. koltuk ═══════════════════════════════════════════════════════
oturak = cube(loc=(-0.28, 0.46, 0.10), scale=(0.24, 0.055, 0.24))
bevel(oturak, 0.045, 4)
sirt = cube(loc=(-0.28, 0.76, -0.14), scale=(0.23, 0.28, 0.055), rot=(0.16, 0, 0))
bevel(sirt, 0.045, 4)
baslik = cube(loc=(-0.28, 1.05, -0.19), scale=(0.10, 0.055, 0.045))
bevel(baslik, 0.030, 3)
part([oturak, sirt, baslik], "koltuk_oturagi", DOSEME)

km_govde = cyl(0.022, 0.070, loc=(-0.28, 0.36, 0.10), rot=(0, math.pi / 2, 0), v=24)
km_vida = cyl(0.008, 0.28, loc=(-0.28, 0.34, 0.10), rot=(math.pi / 2, 0, 0), v=14)
km_ray = [cube(loc=(-0.28 + dx * 0.16, 0.33, 0.10), scale=(0.014, 0.014, 0.24)) for dx in (-1, 1)]
part([km_govde, km_vida] + km_ray, "koltuk_motoru", CELIK)

# ═══ 4. tavan ════════════════════════════════════════════════════════
tavan = cube(loc=(0, 1.42, -0.10), scale=(0.60, 0.010, 0.80))
bevel(tavan, 0.020, 3)
part(tavan, "tavan_kaplamasi", DOSEME)

sr_panel = cube(loc=(0, 1.445, 0.10), scale=(0.32, 0.008, 0.26))
bevel(sr_panel, 0.014, 3)
sr_cerceve = tube(0.34, 0.32, 0.014, loc=(0, 1.445, 0.10), rot=(math.pi / 2, 0, 0), v=4)
part([sr_panel, sr_cerceve], "sunroof_paneli", CAM)

srm_govde = cyl(0.026, 0.055, loc=(0, 1.40, -0.20), rot=(0, math.pi / 2, 0), v=24)
srm_disli = cyl(0.032, 0.014, loc=(0.032, 1.40, -0.20), rot=(0, math.pi / 2, 0), v=24)
srm_soket = cube(loc=(0, 1.375, -0.24), scale=(0.012, 0.010, 0.012))
part([srm_govde, srm_disli, srm_soket], "sunroof_motoru", PLASTIK)

tahliye = curve_tube([(-0.33, 1.44, 0.34), (-0.44, 1.28, 0.50), (-0.52, 0.90, 0.62),
                      (-0.54, 0.42, 0.66)], 0.007)
tahliye_2 = curve_tube([(0.33, 1.44, 0.34), (0.44, 1.28, 0.50), (0.52, 0.90, 0.62),
                        (0.54, 0.42, 0.66)], 0.007)
part([tahliye, tahliye_2], "sunroof_tahliye_hortumu", KAUCUK)

anten_taban = cube(loc=(0, 1.44, -0.62), scale=(0.032, 0.014, 0.070))
bevel(anten_taban, 0.010, 3)
anten_yuzge = cube(loc=(0, 1.485, -0.64), scale=(0.014, 0.035, 0.055), rot=(0.32, 0, 0))
bevel(anten_yuzge, 0.014, 3)
part([anten_taban, anten_yuzge], "anten", BOYALI)

# ═══ 5. arka / bagaj ═════════════════════════════════════════════════
arka_cam = cube(loc=(0, 1.20, ARKA + 0.16), scale=(0.55, 0.22, 0.010), rot=(0.52, 0, 0))
rezistans = [cube(loc=(0, 1.20 + (i - 3) * 0.045, ARKA + 0.16 + (i - 3) * 0.026), scale=(0.52, 0.002, 0.002),
                  rot=(0.52, 0, 0)) for i in range(7)]
part([arka_cam] + rezistans, "arka_cam", CAM)

ak_govde = cyl(0.016, 0.026, loc=(0, 1.02, ARKA + 0.02), rot=(math.pi / 2 - 0.5, 0, 0), v=20)
ak_lens = cyl(0.010, 0.006, loc=(0, 1.008, ARKA - 0.005), rot=(math.pi / 2 - 0.5, 0, 0), v=16)
part([ak_govde, ak_lens], "arka_kamera", SIYAH)

kk = curve_tube([(0, 1.03, ARKA + 0.03), (0.10, 1.00, ARKA + 0.20), (0.24, 0.92, ARKA + 0.55)], 0.005)
kk_soket = cube(loc=(0.245, 0.915, ARKA + 0.57), scale=(0.010, 0.008, 0.012))
part([kk, kk_soket], "kamera_kablosu", SIYAH)

stop_govde = cube(loc=(-0.50, 0.94, ARKA - 0.06), scale=(0.075, 0.13, 0.045))
bevel(stop_govde, 0.016, 3)
stop_lens = cube(loc=(-0.50, 0.94, ARKA - 0.098), scale=(0.070, 0.125, 0.006))
stop_ampul = [cyl(0.012, 0.026, loc=(-0.50, 0.94 + dy, ARKA - 0.02), rot=(math.pi / 2, 0, 0), v=16)
              for dy in (-0.06, 0.0, 0.06)]
part([stop_govde, stop_lens] + stop_ampul, "stop_lambasi", KIRMIZI)

ha_kon = cone(0.052, 0.020, 0.032, loc=(0.36, 1.06, ARKA + 0.36), rot=(math.pi / 2, 0, 0), v=28)
ha_cerceve = tube(0.058, 0.048, 0.008, loc=(0.36, 1.068, ARKA + 0.36), rot=(math.pi / 2, 0, 0), v=28)
part([ha_kon, ha_cerceve], "hoparlor_arka", SIYAH)

sw_kutu = cube(loc=(0.24, 0.60, ARKA + 0.30), scale=(0.16, 0.16, 0.16))
bevel(sw_kutu, 0.014, 3)
sw_kon = cone(0.115, 0.040, 0.060, loc=(0.24, 0.60, ARKA + 0.47), rot=(math.pi / 2, 0, 0), v=36)
sw_cerceve = tube(0.125, 0.105, 0.012, loc=(0.24, 0.60, ARKA + 0.475), rot=(math.pi / 2, 0, 0), v=36)
part([sw_kutu, sw_kon, sw_cerceve], "subwoofer", SIYAH)

anfi_govde = cube(loc=(-0.18, 0.52, ARKA + 0.28), scale=(0.14, 0.030, 0.10))
bevel(anfi_govde, 0.008, 2)
anfi_kanat = [cube(loc=(-0.18, 0.548, ARKA + 0.19 + i * 0.020), scale=(0.14, 0.008, 0.004)) for i in range(9)]
anfi_terminal = [cube(loc=(-0.18 + dx * 0.10, 0.52, ARKA + 0.385), scale=(0.020, 0.014, 0.010))
                 for dx in (-1, 1)]
part([anfi_govde] + anfi_kanat + anfi_terminal, "anfi", CELIK)

rca_1 = curve_tube([(-0.08, 0.52, ARKA + 0.38), (0.04, 0.50, ARKA + 0.30), (0.10, 0.56, ARKA + 0.44)], 0.004)
rca_2 = curve_tube([(-0.08, 0.505, ARKA + 0.38), (0.04, 0.485, ARKA + 0.30), (0.10, 0.545, ARKA + 0.44)], 0.004)
rca_fis = [cyl(0.007, 0.020, loc=(0.10, 0.56 - i * 0.015, ARKA + 0.45), rot=(math.pi / 2, 0, 0), v=12)
           for i in range(2)]
part([rca_1, rca_2] + rca_fis, "rca_kablosu", BAKIR)

guc = curve_tube([(-0.28, 0.52, ARKA + 0.38), (-0.40, 0.60, ARKA + 0.80), (-0.46, 0.78, 0.20),
                  (-0.30, 0.84, ON - 0.70)], 0.011)
guc_sigorta = cyl(0.016, 0.055, loc=(-0.42, 0.66, ARKA + 0.95), rot=(0.9, 0, 0), v=20)
part([guc, guc_sigorta], "ses_guc_kablosu", KIRMIZI)

# ═══ 6. olcu aletleri ════════════════════════════════════════════════
mm = cube(loc=(0.62, 0.50, 0.30), scale=(0.058, 0.022, 0.085))
bevel(mm, 0.010, 3)
mm_ekran = cube(loc=(0.62, 0.523, 0.345), scale=(0.042, 0.002, 0.028))
mm_secici = cyl(0.022, 0.008, loc=(0.62, 0.523, 0.276), v=24)
mm_prob = [curve_tube([(0.62 + dx * 0.03, 0.50, 0.385), (0.62 + dx * 0.10, 0.49, 0.44),
                       (0.62 + dx * 0.16, 0.50, 0.40)], 0.004) for dx in (-1, 1)]
part([mm, mm_ekran, mm_secici] + mm_prob, "multimetre_aksesuar", KIRMIZI)

pa_govde = cube(loc=(0.62, 0.50, -0.10), scale=(0.036, 0.055, 0.016))
bevel(pa_govde, 0.010, 3)
pa_cene_1 = torus(0.038, 0.007, loc=(0.62, 0.585, -0.10), rot=(0, math.pi / 2, 0), seg=28, ring=8)
boolean(pa_cene_1, cube(loc=(0.62, 0.585, -0.148), scale=(0.05, 0.05, 0.014)))
pa_cene_2 = cube(loc=(0.62, 0.585, -0.142), scale=(0.008, 0.030, 0.012), rot=(0.3, 0, 0))
pa_ekran = cube(loc=(0.62, 0.512, -0.118), scale=(0.026, 0.018, 0.003))
part([pa_govde, pa_cene_1, pa_cene_2, pa_ekran], "pens_ampermetre", KAGIT)

export(sys.argv[-1])
