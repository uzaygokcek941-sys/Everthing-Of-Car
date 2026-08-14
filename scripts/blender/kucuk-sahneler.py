"""Uc kucuk sahne tek dosyada: kabin, tezgah, atolye.

    blender.exe --background --python scripts/blender/kucuk-sahneler.py -- web/public/models

Her sahne kendi GLB'sini yazar. Ayri dosyalara bolmedik: uculerinin toplami
bir alan modelinden kucuk ve ayni yardimcilari kullaniyorlar.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

DIZIN = sys.argv[-1]

def malzemeler():
    """reset() dosyayi bosaltip malzeme referanslarini gecersiz kildigi icin
    her sahne kendi malzemelerini yeniden kurar."""
    global CELIK, ALU, PLASTIK, AHSAP, KIRMIZI, TURUNCU, SARI, BETON, BOYALI
    CELIK = mat("celik", (0.580, 0.600, 0.630), metal=1.00, rough=0.36)
    ALU = mat("alu", (0.500, 0.520, 0.550), metal=0.85, rough=0.45)
    PLASTIK = mat("plastik", (0.13, 0.14, 0.16), metal=0.00, rough=0.55)
    AHSAP = mat("ahsap", (0.32, 0.22, 0.13), metal=0.00, rough=0.80)
    KIRMIZI = mat("kirmizi", (0.62, 0.10, 0.08), metal=0.10, rough=0.50)
    TURUNCU = mat("turuncu", (0.80, 0.42, 0.06), metal=0.20, rough=0.55)
    SARI = mat("sari", (0.80, 0.66, 0.10), metal=0.20, rough=0.55)
    BETON = mat("beton", (0.30, 0.31, 0.33), metal=0.00, rough=0.95)
    BOYALI = mat("boyali", (0.055, 0.115, 0.235), metal=0.00, rough=0.30)


# ═══ kabin ═══════════════════════════════════════════════════════════
reset()
malzemeler()

panel = cube(loc=(0, 1.00, 0), scale=(0.28, 0.11, 0.045), rot=(-0.18, 0, 0))
bevel(panel, 0.014, 3)
kadranlar = [tube(0.072, 0.062, 0.012, loc=(dx * 0.115, 1.005, 0.046), rot=(math.pi / 2 - 0.18, 0, 0), v=32)
             for dx in (-1, 1)]
kadran_ibre = [cube(loc=(dx * 0.115, 1.020, 0.050), scale=(0.002, 0.040, 0.002), rot=(-0.18, 0, dx * 0.5))
               for dx in (-1, 1)]
ekran = cube(loc=(0, 1.005, 0.047), scale=(0.048, 0.026, 0.004), rot=(-0.18, 0, 0))
part([panel] + kadranlar + kadran_ibre + [ekran], "gosterge_paneli", PLASTIK)

lamba_govde = cyl(0.014, 0.008, loc=(0.035, 0.962, 0.050), rot=(math.pi / 2 - 0.18, 0, 0), v=24)
damla = cone(0.009, 0.002, 0.014, loc=(0.035, 0.962, 0.055), rot=(math.pi / 2 - 0.18, 0, 0), v=16)
part([lamba_govde, damla], "yag_basinc_lambasi", KIRMIZI)

export(os.path.join(DIZIN, "kabin.glb"))


# ═══ tezgah ══════════════════════════════════════════════════════════
reset()
malzemeler()
T = 0.90

yuzey = cube(loc=(0, T - 0.022, 0), scale=(0.85, 0.022, 0.34))
bevel(yuzey, 0.008, 2)
kenar = cube(loc=(0, T - 0.048, 0.335), scale=(0.85, 0.026, 0.012))
part([yuzey, kenar], "tezgah_yuzeyi", AHSAP)

for isaret, ad in ((-1, "tezgah_ayak_sol"), (1, "tezgah_ayak_sag")):
    dikey = [cube(loc=(isaret * 0.74, (T - 0.05) / 2, dz * 0.26), scale=(0.024, (T - 0.05) / 2, 0.024))
             for dz in (-1, 1)]
    capraz = cube(loc=(isaret * 0.74, 0.30, 0), scale=(0.018, 0.014, 0.26))
    part(dikey + [capraz], ad, CELIK)

m_taban = cube(loc=(-0.52, T + 0.030, -0.10), scale=(0.070, 0.030, 0.050))
bevel(m_taban, 0.006, 2)
m_sabit = cube(loc=(-0.52, T + 0.085, -0.14), scale=(0.062, 0.045, 0.016))
m_hareketli = cube(loc=(-0.52, T + 0.085, -0.058), scale=(0.062, 0.045, 0.016))
m_vida = cyl(0.011, 0.170, loc=(-0.52, T + 0.070, -0.02), rot=(math.pi / 2, 0, 0), v=18)
m_sap = cyl(0.007, 0.130, loc=(-0.52, T + 0.070, 0.070), rot=(0, 0, math.pi / 2), v=14)
part([m_taban, m_sabit, m_hareketli, m_vida, m_sap], "mengene", CELIK)

tepsi_taban = cube(loc=(0.44, T + 0.010, 0.10), scale=(0.20, 0.008, 0.13))
tepsi_kenar = [cube(loc=(0.44 + dx * 0.20, T + 0.026, 0.10), scale=(0.008, 0.018, 0.13)) for dx in (-1, 1)]
tepsi_kenar += [cube(loc=(0.44, T + 0.026, 0.10 + dz * 0.13), scale=(0.20, 0.018, 0.008)) for dz in (-1, 1)]
bolme = cube(loc=(0.44, T + 0.020, 0.10), scale=(0.006, 0.012, 0.13))
part([tepsi_taban] + tepsi_kenar + [bolme], "olcu_aletleri_tepsisi", CELIK)

k_cetvel = cube(loc=(0.02, T + 0.008, 0.18), scale=(0.105, 0.004, 0.014))
k_taksimat = [cube(loc=(-0.075 + i * 0.012, T + 0.013, 0.18), scale=(0.0008, 0.001, 0.008)) for i in range(16)]
k_surgu = cube(loc=(0.045, T + 0.012, 0.18), scale=(0.026, 0.010, 0.020))
k_derinlik = cube(loc=(0.14, T + 0.008, 0.18), scale=(0.035, 0.002, 0.003))
part([k_cetvel] + k_taksimat + [k_surgu, k_derinlik], "kumpas", CELIK)

c_sabit = cube(loc=(-0.085, T + 0.020, 0.166), scale=(0.005, 0.018, 0.028))
c_hareketli = cube(loc=(0.020, T + 0.020, 0.166), scale=(0.005, 0.018, 0.028))
part([c_sabit, c_hareketli], "kumpas_cene", CELIK)

mik_kemer = torus(0.055, 0.008, loc=(0.02, T + 0.020, -0.16), rot=(math.pi / 2, 0, 0), seg=32, ring=10)
boolean(mik_kemer, cube(loc=(0.02, T + 0.075, -0.16), scale=(0.07, 0.045, 0.03)))
mik_tambur = cyl(0.014, 0.055, loc=(0.075, T + 0.020, -0.16), rot=(0, math.pi / 2, 0), v=24)
mik_mil = cyl(0.006, 0.040, loc=(0.005, T + 0.020, -0.16), rot=(0, math.pi / 2, 0), v=14)
part([mik_kemer, mik_tambur, mik_mil], "mikrometre", CELIK)

flans = cyl(0.085, 0.014, loc=(-0.22, T + 0.010, -0.12), v=36)
flans_delik = ring_of(
    lambda loc, rot, i: cyl(0.008, 0.030, loc=loc, v=12),
    5, 0.060, axis='Y', center=(-0.22, T + 0.010, -0.12),
)
for d in flans_delik:
    boolean(flans, d)
part(flans, "flans_civata_flansi", CELIK)

fc_govde = cyl(0.0075, 0.038, loc=(-0.28, T + 0.026, -0.12), v=16)
fc_bas = hex_head(0.013, 0.010, loc=(-0.28, T + 0.050, -0.12))
fc_pul = cyl(0.014, 0.003, loc=(-0.28, T + 0.020, -0.12), v=20)
part([fc_govde, fc_bas, fc_pul], "flans_civata", CELIK)

plaka = cube(loc=(0.22, T + 0.012, -0.14), scale=(0.13, 0.012, 0.085))
bevel(plaka, 0.004, 2)
part(plaka, "egzersiz_plakasi", CELIK)

delik = tube(0.014, 0.009, 0.028, loc=(0.29, T + 0.012, -0.14), v=20)
dis_izi = [torus(0.011, 0.0012, loc=(0.29, T + 0.002 + i * 0.004, -0.14), seg=20, ring=6) for i in range(5)]
part([delik] + dis_izi, "egzersiz_dis_deligi", CELIK)

ec_govde = cyl(0.008, 0.040, loc=(0.16, T + 0.030, -0.14), v=16)
ec_bas = hex_head(0.014, 0.010, loc=(0.16, T + 0.055, -0.14))
part([ec_govde, ec_bas], "egzersiz_civata_1", CELIK)

ecy_govde = cyl(0.008, 0.040, loc=(0.40, T + 0.032, 0.24), rot=(0, 0, math.pi / 2), v=16)
ecy_bas = hex_head(0.014, 0.010, loc=(0.425, T + 0.032, 0.24), rot=(0, math.pi / 2, 0))
part([ecy_govde, ecy_bas], "egzersiz_civata_yeni_1", ALU)

export(os.path.join(DIZIN, "tezgah.glb"))


# ═══ atolye ══════════════════════════════════════════════════════════
reset()
malzemeler()

zemin = cube(loc=(0, -0.010, 0), scale=(2.2, 0.010, 1.8))
part(zemin, "zemin", BETON)

sarilar = [cube(loc=(0, 0.001, dz * 0.95), scale=(1.30, 0.002, 0.030)) for dz in (-1, 1)]
sarilar += [cube(loc=(dx * 1.30, 0.001, 0), scale=(0.030, 0.002, 0.95)) for dx in (-1, 1)]
part(sarilar, "calisma_alani", SARI)

# Kaba kutu-arac KALDIRILDI: sahnede zaten dokulu brandali arac hazir varligi
# ayni noktada duruyordu (atolye.parts.json -> dekor.arac). Ikisi ust uste
# binince kutu-aracin tekerlekleri brandanin icinden disari cikiyordu.
# Hicbir ders arac_govdesi'ni hedef almiyor, yalnizca baglamdi.

kn = cube(loc=(-0.78, 0.355, 0.55), scale=(0.020, 0.020, 0.075))
kn_kertik = [cube(loc=(-0.78, 0.335, 0.55 + dz), scale=(0.024, 0.008, 0.010)) for dz in (-0.045, 0.045)]
part([kn] + kn_kertik, "kaldirma_noktasi", CELIK)

dolap = cube(loc=(-1.45, 0.70, -0.90), scale=(0.24, 0.70, 0.18))
bevel(dolap, 0.014, 3)
kapaklar = [cube(loc=(-1.45 + dx * 0.12, 0.78, -0.71), scale=(0.115, 0.58, 0.010)) for dx in (-1, 1)]
kollar = [cube(loc=(-1.45 + dx * 0.02, 0.78, -0.70), scale=(0.008, 0.070, 0.010)) for dx in (-1, 1)]
part([dolap] + kapaklar + kollar, "kkd_dolabi", PLASTIK)

tup_govde = cyl(0.070, 0.42, loc=(-1.05, 0.23, -0.95), v=32)
bevel(tup_govde, 0.020, 3)
tup_boyun = cyl(0.020, 0.070, loc=(-1.05, 0.47, -0.95), v=20)
tup_kol = cube(loc=(-1.05, 0.505, -0.925), scale=(0.012, 0.008, 0.045))
tup_hortum = curve_tube([(-1.05, 0.49, -0.985), (-1.10, 0.36, -1.02), (-1.13, 0.20, -0.98)], 0.010)
tup_koni = cone(0.030, 0.014, 0.070, loc=(-1.14, 0.14, -0.97), rot=(0.5, 0, 0), v=20)
part([tup_govde, tup_boyun, tup_kol, tup_hortum, tup_koni], "yangin_tupu", KIRMIZI)

k_taban = cube(loc=(-0.55, 0.030, 0.95), scale=(0.16, 0.030, 0.34))
k_kol = cube(loc=(-0.55, 0.14, 1.16), scale=(0.030, 0.024, 0.30), rot=(0.55, 0, 0))
k_eger = cyl(0.055, 0.030, loc=(-0.55, 0.185, 0.82), v=24)
k_tekerlek = [cyl(0.035, 0.024, loc=(-0.55 + dx * 0.15, 0.035, 0.95 + dz * 0.30),
                  rot=(0, math.pi / 2, 0), v=18)
              for dx in (-1, 1) for dz in (-1, 1)]
part([k_taban, k_kol, k_eger] + k_tekerlek, "kriko", TURUNCU)

s_taban = cube(loc=(-0.95, 0.012, 0.55), scale=(0.10, 0.012, 0.10))
s_bacak = [cube(loc=(-0.95 + dx * 0.075, 0.16, 0.55 + dz * 0.075), scale=(0.012, 0.165, 0.012),
                rot=(-dz * 0.40, 0, dx * 0.40))
           for dx in (-1, 1) for dz in (-1, 1)]
s_kolon = tube(0.032, 0.023, 0.20, loc=(-0.95, 0.24, 0.55), v=20)
s_eger = cube(loc=(-0.95, 0.345, 0.55), scale=(0.038, 0.020, 0.018))
s_pim = cyl(0.006, 0.075, loc=(-0.95, 0.29, 0.55), rot=(math.pi / 2, 0, 0), v=12)
part([s_taban] + s_bacak + [s_kolon, s_eger, s_pim], "sehpa", CELIK)

export(os.path.join(DIZIN, "atolye.glb"))
