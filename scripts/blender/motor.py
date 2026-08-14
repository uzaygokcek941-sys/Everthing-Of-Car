"""Sirali 4 silindirli motor bolmesi.

    blender.exe --background --python scripts/blender/motor.py -- web/public/models/motor-inline4.glb

Eksenler (parts.json ile ayni): X = krank ekseni, 1. silindir -X ucunda.
Y = yukari, Z = aracin onu. Olcek metre, motor merkezi ~y=0.5.
Triger -X ucunda, volan +X ucunda; emme +Z, egzoz -Z.
"""

import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *  # noqa

reset()

# ——— malzemeler ——————————————————————————————————————————————————
# Metallik yuzey kendi rengini degil ortami yansitir; her seye metal=0.9
# verildiginde parlak bir ortamda hepsi beyaza doner ve parcalar birbirinden
# ayirt edilemez. Gercekte blok oksitli/boyali, yani dielektrik gibi davranir.
# Yalnizca islenmis celik ve alu yuzeyler gercek metaldir.
DOKUM = mat("dokum", (0.115, 0.120, 0.130), metal=0.20, rough=0.80)
ALU = mat("alu", (0.500, 0.520, 0.545), metal=0.85, rough=0.44)
CELIK = mat("celik", (0.620, 0.640, 0.670), metal=1.00, rough=0.28)
KAUCUK = mat("kaucuk", (0.038, 0.038, 0.042), metal=0.00, rough=0.93)
BAKIR = mat("bakir", (0.480, 0.255, 0.110), metal=0.90, rough=0.46)
# Radyator petegi ve benzeri genis yuzeyler: metal birakilinca alan isigini
# ayna gibi yansitip beyaz bir levhaya donuyordu. Gercekte siyah boyali.
PETEK = mat("petek", (0.055, 0.058, 0.062), metal=0.35, rough=0.72)
PLASTIK = mat("plastik", (0.085, 0.090, 0.105), metal=0.00, rough=0.52)
CONTA = mat("conta", (0.560, 0.190, 0.095), metal=0.00, rough=0.78)
SEFFAF = mat("seffaf", (0.80, 0.84, 0.88), metal=0.00, rough=0.15, alpha=0.35)
BOYA = mat("boya", (0.075, 0.170, 0.330), metal=0.05, rough=0.28)
FILTRE = mat("filtre", (0.760, 0.700, 0.520), metal=0.00, rough=0.95)

# ——— olculer —————————————————————————————————————————————————————
ARALIK = 0.09
CX = [-0.135, -0.045, 0.045, 0.135]
CAP = 0.036
BLOK_Y0, BLOK_Y1 = 0.30, 0.56
KAFA_Y0, KAFA_Y1 = 0.565, 0.635
KRANK_Y = 0.335
KAM_Y = 0.665
TRIGER_X = -0.235
VOLAN_X = 0.245

# ——— blok ————————————————————————————————————————————————————————
blok_govde = cube(loc=(0, (BLOK_Y0 + BLOK_Y1) / 2, 0), scale=(0.21, (BLOK_Y1 - BLOK_Y0) / 2, 0.105))
bevel(blok_govde, 0.006, 2)
kaburgalar = []
for z in (-0.107, 0.107):
    for x in (-0.18, -0.09, 0.0, 0.09, 0.18):
        kaburgalar.append(cube(loc=(x, 0.44, z), scale=(0.012, 0.10, 0.006)))
kampana = cyl(0.15, 0.018, loc=(0.215, 0.43, 0), rot=(0, math.pi / 2, 0), v=24)
etek = cube(loc=(0, 0.315, 0), scale=(0.215, 0.012, 0.115))
blok = part([blok_govde] + kaburgalar + [kampana, etek], "blok_gecici", DOKUM)
for x in CX:
    boolean(blok, cyl(CAP, 0.30, loc=(x, 0.46, 0), v=40))
blok.name = blok.data.name = "blok"

# ——— silindir 1 (gomlek) —————————————————————————————————————————
gomlek = tube(CAP, CAP - 0.005, 0.24, loc=(CX[0], 0.44, 0), v=40)
part(gomlek, "silindir_1", CELIK)

# ——— silindir kapagi —————————————————————————————————————————————
kafa = cube(loc=(0, (KAFA_Y0 + KAFA_Y1) / 2, 0), scale=(0.21, (KAFA_Y1 - KAFA_Y0) / 2, 0.105))
bevel(kafa, 0.005, 2)
portlar = []
for x in CX:
    portlar.append(cyl(0.026, 0.05, loc=(x, 0.60, 0.11), rot=(math.pi / 2, 0, 0), v=20))
    portlar.append(cyl(0.024, 0.05, loc=(x, 0.60, -0.11), rot=(math.pi / 2, 0, 0), v=20))
kafa = part([kafa] + portlar, "silindir_kapagi_gecici", ALU)
for x in CX:
    boolean(kafa, cyl(0.013, 0.06, loc=(x, 0.625, 0), v=20))
kafa.name = kafa.data.name = "silindir_kapagi"

conta = cube(loc=(0, 0.5615, 0), scale=(0.208, 0.0015, 0.103))
for x in CX:
    boolean(conta, cyl(CAP, 0.02, loc=(x, 0.5615, 0), v=32))
part(conta, "kapak_contasi", CONTA)

civata_g = cyl(0.006, 0.075, loc=(-0.175, 0.60, 0.075))
civata_b = hex_head(0.011, 0.010, loc=(-0.175, 0.642, 0.075))
part([civata_g, civata_b], "kapak_civatasi", CELIK)

# ——— supap kapagi ————————————————————————————————————————————————
kap = cube(loc=(0, 0.678, 0), scale=(0.205, 0.036, 0.10))
bevel(kap, 0.008, 3)
dolum_boyun = cyl(0.030, 0.030, loc=(-0.15, 0.716, 0.05), v=24)
dolum_kapak = cyl(0.034, 0.014, loc=(-0.15, 0.735, 0.05), v=24)
part([kap, dolum_boyun, dolum_kapak], "supap_kapagi", ALU)

# ——— kam mili ve supap ———————————————————————————————————————————
mil = cyl(0.014, 0.40, loc=(0, KAM_Y, 0.035), rot=(0, math.pi / 2, 0), v=24)
loblar = []
for x in CX:
    for dz in (-0.018, 0.018):
        lob = cyl(0.024, 0.014, loc=(x + dz, KAM_Y, 0.035), rot=(0, math.pi / 2, 0), v=24)
        lob.scale = (1, 1.35, 1)
        apply_scale(lob)
        loblar.append(lob)
yataklar = [
    cyl(0.019, 0.012, loc=(x, KAM_Y, 0.035), rot=(0, math.pi / 2, 0), v=20)
    for x in (-0.19, -0.09, 0.09, 0.19)
]
part([mil] + loblar + yataklar, "kam_mili", CELIK)

sap = cyl(0.0035, 0.085, loc=(CX[0], 0.615, 0.035))
tabla = cone(0.017, 0.012, 0.010, loc=(CX[0], 0.572, 0.035))
yay = torus(0.013, 0.0025, loc=(CX[0], 0.640, 0.035), rot=(math.pi / 2, 0, 0), seg=24, ring=8)
part([sap, tabla, yay], "supap", CELIK)

# ——— krank grubu —————————————————————————————————————————————————
ana_muylular, kollar, pimler = [], [], []
for i in range(5):
    ana_muylular.append(cyl(0.026, 0.030, loc=(-0.18 + i * ARALIK, KRANK_Y, 0), rot=(0, math.pi / 2, 0), v=28))
for i, x in enumerate(CX):
    aci = math.pi if i in (1, 2) else 0.0
    oy = 0.021 * math.cos(aci)
    oz = 0.021 * math.sin(aci)
    pimler.append(cyl(0.020, 0.028, loc=(x, KRANK_Y + oy, oz), rot=(0, math.pi / 2, 0), v=24))
    for dx in (-0.028, 0.028):
        k = cube(loc=(x + dx, KRANK_Y + oy / 2, oz / 2), scale=(0.007, 0.036, 0.020))
        bevel(k, 0.004, 2)
        kollar.append(k)
part(ana_muylular + pimler + kollar, "krank_mili", CELIK)

yatak = tube(0.030, 0.026, 0.026, loc=(-0.09, KRANK_Y, 0), rot=(0, math.pi / 2, 0), v=28)
boolean(yatak, cube(loc=(-0.09, KRANK_Y - 0.035, 0), scale=(0.02, 0.035, 0.04)))
part(yatak, "ana_yatak", BAKIR)

buyuk_uc = tube(0.028, 0.020, 0.026, loc=(CX[0], KRANK_Y + 0.021, 0), rot=(0, math.pi / 2, 0), v=28)
biyel_govde = cube(loc=(CX[0], 0.405, 0), scale=(0.010, 0.055, 0.014))
bevel(biyel_govde, 0.004, 2)
kucuk_uc = tube(0.014, 0.009, 0.024, loc=(CX[0], 0.462, 0), rot=(0, math.pi / 2, 0), v=24)
part([buyuk_uc, biyel_govde, kucuk_uc], "biyel", CELIK)

pist = cyl(CAP - 0.001, 0.052, loc=(CX[0], 0.488, 0), v=40)
for dy in (0.006, 0.014, 0.022):
    boolean(pist, tube(CAP + 0.01, CAP - 0.004, 0.004, loc=(CX[0], 0.508 - dy, 0), v=40))
pim_yuvasi = cyl(0.009, 0.05, loc=(CX[0], 0.470, 0), rot=(0, math.pi / 2, 0), v=20)
part([pist, pim_yuvasi], "piston", ALU)

vol = cyl(0.115, 0.024, loc=(VOLAN_X, KRANK_Y, 0), rot=(0, math.pi / 2, 0), v=48)
disler = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.012, 0.006, 0.004), rot=(rot[0], 0, 0)),
    56, 0.118, axis='X', center=(VOLAN_X, KRANK_Y, 0),
)
part([vol] + disler, "volan", CELIK)

kece = tube(0.036, 0.027, 0.010, loc=(0.212, KRANK_Y, 0), rot=(0, math.pi / 2, 0), v=32)
part(kece, "arka_kece", KAUCUK)

# ——— yaglama —————————————————————————————————————————————————————
kar = cube(loc=(0, 0.225, 0), scale=(0.20, 0.075, 0.098))
bevel(kar, 0.010, 3)
boolean(kar, cube(loc=(0, 0.245, 0), scale=(0.185, 0.075, 0.085)))
kar_flans = cube(loc=(0, 0.298, 0), scale=(0.212, 0.006, 0.112))
part([kar, kar_flans], "karter", CELIK)

tapa_g = cyl(0.008, 0.014, loc=(0.10, 0.153, 0.04))
tapa_b = hex_head(0.013, 0.010, loc=(0.10, 0.143, 0.04))
part([tapa_g, tapa_b], "karter_tapasi", CELIK)

filt = cyl(0.038, 0.095, loc=(0.14, 0.37, 0.13), rot=(math.pi / 2, 0, 0), v=32)
bevel(filt, 0.006, 2)
tirtil = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.002, 0.040, 0.002), rot=(math.pi / 2, rot[1], 0)),
    28, 0.039, axis='Z', center=(0.14, 0.37, 0.13),
)
part([filt] + tirtil, "yag_filtresi", BOYA)

cubuk_sap = curve_tube([(0.17, 0.42, 0.06), (0.19, 0.52, 0.05), (0.185, 0.60, 0.03)], 0.004)
halka = torus(0.016, 0.004, loc=(0.185, 0.625, 0.03), rot=(0, math.pi / 2, 0), seg=20, ring=8)
part([cubuk_sap, halka], "yag_cubugu", CELIK)

mano_govde = cyl(0.030, 0.020, loc=(0.19, 0.47, -0.09), rot=(math.pi / 2, 0, 0), v=28)
mano_cam = cyl(0.026, 0.004, loc=(0.19, 0.47, -0.101), rot=(math.pi / 2, 0, 0), v=28)
mano_ibre = cube(loc=(0.19, 0.478, -0.104), scale=(0.002, 0.014, 0.001))
part([mano_govde, mano_cam, mano_ibre], "yag_basinc_manometresi", CELIK)

# ——— triger ——————————————————————————————————————————————————————
krank_k = cyl(0.052, 0.020, loc=(TRIGER_X, KRANK_Y, 0), rot=(0, math.pi / 2, 0), v=40)
for dx in (-0.006, 0.006):
    boolean(krank_k, torus(0.052, 0.005, loc=(TRIGER_X + dx, KRANK_Y, 0), rot=(0, math.pi / 2, 0), seg=40, ring=8))
part(krank_k, "krank_kasnagi", CELIK)

kam_k = cyl(0.088, 0.018, loc=(TRIGER_X, KAM_Y, 0.035), rot=(0, math.pi / 2, 0), v=48)
boolean(kam_k, tube(0.072, 0.030, 0.030, loc=(TRIGER_X, KAM_Y, 0.035), rot=(0, math.pi / 2, 0), v=40))
kam_disler = ring_of(
    lambda loc, rot, i: cube(loc=loc, scale=(0.009, 0.005, 0.004), rot=(rot[0], 0, 0)),
    44, 0.090, axis='X', center=(TRIGER_X, KAM_Y, 0.035),
)
part([kam_k] + kam_disler, "kam_kasnagi", CELIK)

gergi_makara = cyl(0.034, 0.020, loc=(TRIGER_X, 0.50, -0.075), rot=(0, math.pi / 2, 0), v=32)
gergi_kol = cube(loc=(TRIGER_X, 0.47, -0.055), scale=(0.008, 0.030, 0.012), rot=(0, 0, 0.5))
part([gergi_makara, gergi_kol], "gergi_rulmani", CELIK)


part(
    kayis(
        [((KRANK_Y, 0.0), 0.052), ((KAM_Y, 0.035), 0.088), ((0.50, -0.075), 0.034)],
        TRIGER_X,
    ),
    "triger_kayisi",
    KAUCUK,
)

isaret = cube(loc=(TRIGER_X - 0.012, KAM_Y + 0.092, 0.035), scale=(0.003, 0.008, 0.010))
isaret_alt = cube(loc=(TRIGER_X - 0.012, KRANK_Y - 0.060, 0), scale=(0.003, 0.008, 0.008))
part([isaret, isaret_alt], "triger_isareti", BAKIR)

# ——— atesleme ————————————————————————————————————————————————————
bob_govde = cube(loc=(CX[0], 0.735, 0), scale=(0.020, 0.026, 0.018))
bevel(bob_govde, 0.004, 2)
bob_boyun = cyl(0.011, 0.055, loc=(CX[0], 0.690, 0))
part([bob_govde, bob_boyun], "bobin_1", PLASTIK)

soket_g = cube(loc=(CX[0], 0.742, 0.026), scale=(0.012, 0.010, 0.010))
soket_tirnak = cube(loc=(CX[0], 0.754, 0.026), scale=(0.005, 0.004, 0.008))
part([soket_g, soket_tirnak], "bobin_soket_1", PLASTIK)


def _buji(x, y, z, ad, govde_mat):
    dis = cyl(0.0080, 0.020, loc=(x, y, z), v=20)
    altigen = hex_head(0.0105, 0.008, loc=(x, y + 0.014, z))
    ser = cone(0.0075, 0.0055, 0.030, loc=(x, y + 0.033, z), v=20)
    ucu = cyl(0.0035, 0.010, loc=(x, y + 0.052, z), v=16)
    elektrot = cube(loc=(x, y - 0.012, z), scale=(0.0012, 0.0012, 0.006))
    tirnak = cube(loc=(x + 0.004, y - 0.014, z), scale=(0.004, 0.0012, 0.0012))
    return part([dis, altigen, ser, ucu, elektrot, tirnak], ad, govde_mat)


_buji(CX[0], 0.618, 0, "buji_1", CELIK)
_buji(0.10, 0.86, 0.16, "buji_yeni_1", ALU)

# ——— emme / egzoz ————————————————————————————————————————————————
plenum = cube(loc=(0, 0.60, 0.175), scale=(0.17, 0.042, 0.045))
bevel(plenum, 0.010, 3)
gaz_kelebegi = cyl(0.032, 0.030, loc=(0.16, 0.60, 0.19), rot=(0, math.pi / 2, 0), v=28)
kanallar = [curve_tube([(x, 0.600, 0.115), (x, 0.625, 0.145), (x, 0.610, 0.175)], 0.018) for x in CX]
part([plenum, gaz_kelebegi] + kanallar, "emme_manifoldu", ALU)

egz_kanallar = [
    curve_tube([(x, 0.600, -0.115), (x, 0.570, -0.160), (x * 0.35, 0.520, -0.185)], 0.016)
    for x in CX
]
toplayici = curve_tube([(0.05, 0.520, -0.185), (0.02, 0.470, -0.195), (0.0, 0.410, -0.200)], 0.026)
egz_flans = cube(loc=(0, 0.60, -0.112), scale=(0.20, 0.030, 0.006))
part(egz_kanallar + [toplayici, egz_flans], "egzoz_manifoldu", DOKUM)

saplama = cyl(0.005, 0.030, loc=(-0.175, 0.60, -0.120), rot=(math.pi / 2, 0, 0))
somun = hex_head(0.009, 0.008, loc=(-0.175, 0.60, -0.136), rot=(math.pi / 2, 0, 0))
part([saplama, somun], "manifolt_civata", CELIK)

# ——— hava ————————————————————————————————————————————————————————
kutu_alt = cube(loc=(-0.10, 0.80, 0.20), scale=(0.085, 0.030, 0.065))
bevel(kutu_alt, 0.010, 3)
kutu_ust = cube(loc=(-0.10, 0.855, 0.20), scale=(0.085, 0.026, 0.065))
bevel(kutu_ust, 0.010, 3)
hava_hortum = curve_tube([(-0.02, 0.82, 0.20), (0.08, 0.75, 0.20), (0.155, 0.64, 0.19)], 0.030)
snorkel = curve_tube([(-0.185, 0.83, 0.20), (-0.24, 0.86, 0.16), (-0.26, 0.88, 0.08)], 0.026)
part([kutu_alt, kutu_ust, hava_hortum, snorkel], "hava_filtre_kutusu", PLASTIK)

cerceve = cube(loc=(-0.10, 0.828, 0.20), scale=(0.078, 0.008, 0.058))
pileler = [cube(loc=(-0.170 + i * 0.010, 0.828, 0.20), scale=(0.002, 0.010, 0.055)) for i in range(15)]
part([cerceve] + pileler, "hava_filtresi", FILTRE)

# ——— sogutma —————————————————————————————————————————————————————
petek = cube(loc=(0, 0.55, 0.42), scale=(0.24, 0.16, 0.022))
kanatlar = [cube(loc=(-0.225 + i * 0.030, 0.55, 0.42), scale=(0.003, 0.150, 0.024)) for i in range(16)]
ust_tank = cube(loc=(0, 0.725, 0.42), scale=(0.245, 0.022, 0.030))
alt_tank = cube(loc=(0, 0.375, 0.42), scale=(0.245, 0.022, 0.030))
bevel(ust_tank, 0.006, 2)
bevel(alt_tank, 0.006, 2)
part([petek] + kanatlar + [ust_tank, alt_tank], "radyator", PETEK)

boyun = cyl(0.030, 0.022, loc=(-0.16, 0.752, 0.42), v=28)
rad_kapak = cyl(0.036, 0.018, loc=(-0.16, 0.768, 0.42), v=28)
rad_kol = cube(loc=(-0.16, 0.780, 0.42), scale=(0.036, 0.004, 0.010))
part([boyun, rad_kapak, rad_kol], "radyator_kapagi", CELIK)

musluk = cyl(0.010, 0.020, loc=(0.18, 0.362, 0.445), rot=(math.pi / 2, 0, 0), v=20)
musluk_kanat = cube(loc=(0.18, 0.362, 0.462), scale=(0.014, 0.003, 0.006))
part([musluk, musluk_kanat], "radyator_tapasi", PLASTIK)

depo = cube(loc=(0.22, 0.72, 0.30), scale=(0.055, 0.060, 0.045))
bevel(depo, 0.014, 3)
depo_boyun = cyl(0.020, 0.024, loc=(0.22, 0.792, 0.30), v=24)
part([depo, depo_boyun], "genlesme_deposu", SEFFAF)

ust_h = curve_tube([(-0.14, 0.700, 0.42), (-0.12, 0.690, 0.32), (-0.06, 0.655, 0.145)], 0.022)
kelepce = torus(0.026, 0.004, loc=(-0.135, 0.698, 0.40), rot=(0.3, 0, 0), seg=24, ring=8)
part([ust_h, kelepce], "ust_hortum", KAUCUK)

term_govde = cyl(0.026, 0.026, loc=(-0.05, 0.645, 0.128), rot=(math.pi / 2 - 0.25, 0, 0), v=28)
term_tabla = cyl(0.020, 0.006, loc=(-0.05, 0.652, 0.140), rot=(math.pi / 2 - 0.25, 0, 0), v=24)
term_yay = torus(0.012, 0.003, loc=(-0.05, 0.638, 0.116), rot=(math.pi / 2 - 0.25, 0, 0), seg=20, ring=6)
part([term_govde, term_tabla, term_yay], "termostat", BAKIR)

term_kapak = cyl(0.032, 0.020, loc=(-0.05, 0.660, 0.150), rot=(math.pi / 2 - 0.25, 0, 0), v=28)
bevel(term_kapak, 0.004, 2)
term_civata = cyl(0.005, 0.026, loc=(-0.082, 0.660, 0.150), rot=(math.pi / 2 - 0.25, 0, 0))
part([term_kapak, term_civata], "termostat_kapagi", ALU)

# ——— kaput ve motor kapagi civatasi ——————————————————————————————
# Kaput acik: kapali duz levha motoru gizliyor, atolyede kaput hep kalkiktir.
# Panel kapali konumda kurulur, sonra mentese ekseni (x ekseni, y=1.00,
# z=-0.19) etrafinda dondurulur - parca dondurmek yerine tek tek konum
# hesaplamak kaburgalari ust uste yigiyordu.
kap_panel = cube(loc=(0, 1.02, 0.16), scale=(0.42, 0.012, 0.36))
bevel(kap_panel, 0.014, 3)
kap_kaburga = [cube(loc=(0, 0.998, -0.10 + i * 0.13), scale=(0.40, 0.012, 0.014)) for i in range(4)]
mentese = [cube(loc=(x, 1.00, -0.19), scale=(0.030, 0.020, 0.012)) for x in (-0.32, 0.32)]
# Kaput KAPALI kalir: kaporta derslerinin ilk adimi "Kaputu ac ve destek
# cubuguna oturt" ve etkilesim onu y ekseninde 0.4 kaldiriyor. Modeli acik
# kurmak o dersi anlamsiz birakirdi.
part([kap_panel] + kap_kaburga + mentese, "kaput", BOYA)

mk_civata = cyl(0.005, 0.024, loc=(0.15, 0.700, -0.05))
mk_bas = hex_head(0.010, 0.008, loc=(0.15, 0.716, -0.05))
part([mk_civata, mk_bas], "motor_kapagi_civata", CELIK)

# ——— cikti ———————————————————————————————————————————————————————
export(sys.argv[-1])
