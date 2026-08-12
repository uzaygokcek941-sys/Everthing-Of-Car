// Şematik sahne modellerini üretir: web/public/models/*.glb
// Çalıştır: node scripts/build-models.mjs
//
// Neden elle üretiyoruz: indirilen bir model lisans (CC-BY atfı), marka hakkı ve
// Blender'da mesh yeniden adlandırma borcu getirir. Burada üretilen modeller kendi
// kodumuzdur; parça adları tanım gereği doğrudur ve tekrar üretilebilir.
//
// ponytail: gövdeler kutu ve silindir. Gerçekçi model gelirse bu dosyanın yerine
// geçer — sözleşme parts.json'daki isimlerdir, geometri değil.

import { writeFileSync, mkdirSync } from "node:fs";

const DIZIN = "web/public/models";

// ——— geometri ———————————————————————————————————————————————

function box(w, h, d) {
  const x = w / 2, y = h / 2, z = d / 2;
  const faces = [
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
    [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
    [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
    [[0, 1, 0], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],
    [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]],
  ];
  const pos = [], nrm = [], idx = [];
  faces.forEach(([n, corners], i) => {
    for (const p of corners) { pos.push(...p); nrm.push(...n); }
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return { pos, nrm, idx };
}

/** Ekseni +Y olan silindir. Başka eksen gerekiyorsa düğüme quaternion verilir. */
function cyl(r, h, seg = 24) {
  const pos = [], nrm = [], idx = [], y = h / 2;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    pos.push(r * cx, -y, r * sz, r * cx, y, r * sz);
    nrm.push(cx, 0, sz, cx, 0, sz);
  }
  for (let i = 0; i < seg; i++) {
    const b = i * 2;
    idx.push(b, b + 2, b + 3, b, b + 3, b + 1);
  }
  for (const s of [1, -1]) {
    const c = pos.length / 3;
    pos.push(0, s * y, 0); nrm.push(0, s, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(r * Math.cos(a), s * y, r * Math.sin(a)); nrm.push(0, s, 0);
    }
    for (let i = 0; i < seg; i++) {
      if (s > 0) idx.push(c, c + 1 + i, c + 2 + i);
      else idx.push(c, c + 2 + i, c + 1 + i);
    }
  }
  return { pos, nrm, idx };
}

const S = Math.SQRT1_2;
const EKSEN_X = [0, 0, S, S]; // +Y'yi X'e çevirir: kasnak, disk
const EKSEN_Z = [S, 0, 0, S]; // +Y'yi Z'ye çevirir: hortum, boru

// ——— malzemeler ——————————————————————————————————————————————

const MAT = {};
const MALZEMELER = [];
const mat = (ad, r, g, b, metallic = 0.2, rough = 0.7, isik) => {
  MAT[ad] = MALZEMELER.length;
  const m = {
    name: ad,
    doubleSided: true,
    pbrMetallicRoughness: { baseColorFactor: [r, g, b, 1], metallicFactor: metallic, roughnessFactor: rough },
  };
  if (isik) m.emissiveFactor = isik;
  MALZEMELER.push(m);
};

mat("dokum", 0.42, 0.44, 0.47, 0.35, 0.75);
mat("kapak", 0.28, 0.30, 0.33, 0.30, 0.60);
mat("celik", 0.72, 0.74, 0.78, 0.85, 0.35);
mat("kesit", 0.85, 0.45, 0.15, 0.10, 0.80);
mat("yag", 0.20, 0.32, 0.55, 0.25, 0.55);
mat("sogutma", 0.65, 0.18, 0.18, 0.20, 0.60);
mat("hortum", 0.12, 0.12, 0.13, 0.05, 0.90);
mat("plastik", 0.86, 0.87, 0.88, 0.05, 0.45);
mat("hava", 0.16, 0.17, 0.18, 0.05, 0.85);
mat("govde", 0.70, 0.72, 0.76, 0.45, 0.40);
mat("ahsap", 0.55, 0.40, 0.26, 0.05, 0.85);
mat("zemin", 0.32, 0.33, 0.35, 0.05, 0.95);
mat("cizgi", 0.90, 0.78, 0.15, 0.05, 0.80);
mat("ekipman", 0.88, 0.55, 0.10, 0.30, 0.55);
mat("uyari", 0.85, 0.15, 0.10, 0.05, 0.50, [0.7, 0.08, 0.04]);
mat("boya", 0.30, 0.45, 0.62, 0.40, 0.35);

// ——— sahneler ————————————————————————————————————————————————
// [mesh adı, geometri, konum, malzeme, dönüş?]

const MODELLER = {
  // Motor bölmesi. X = krank ekseni (1. silindir -X ucunda), Y = yukarı, Z = aracın önü.
  "motor-inline4": [
    ["blok", box(0.66, 0.42, 0.40), [0, 0.50, 0], "dokum"],

    // Blok üstünden yukarı: conta → silindir kapağı → supap kapağı.
    ["kapak_contasi", box(0.64, 0.008, 0.34), [0, 0.714, 0], "kesit"],
    ["silindir_kapagi", box(0.64, 0.11, 0.34), [0, 0.774, 0], "dokum"],
    ["kapak_civatasi", cyl(0.011, 0.050, 12), [-0.28, 0.855, 0.13], "celik"],
    ["supap_kapagi", box(0.62, 0.10, 0.30), [0, 0.879, 0], "kapak"],
    ["motor_kapagi_civata", cyl(0.012, 0.030, 12), [-0.26, 0.939, 0.11], "celik"],

    ["emme_manifoldu", box(0.44, 0.09, 0.14), [0.05, 0.80, 0.24], "hava"],
    ["egzoz_manifoldu", box(0.44, 0.09, 0.12), [0.05, 0.76, -0.23], "dokum"],
    ["manifolt_civata", cyl(0.009, 0.045, 10), [0.05, 0.80, 0.175], "celik", EKSEN_Z],

    ["silindir_1", cyl(0.045, 0.40, 20), [-0.21, 0.50, 0], "kesit"],
    ["buji_1", cyl(0.010, 0.090, 10), [-0.21, 0.939, 0], "celik"],
    ["bobin_1", box(0.05, 0.10, 0.05), [-0.21, 1.019, 0], "kapak"],
    ["bobin_soket_1", box(0.032, 0.022, 0.032), [-0.21, 1.081, -0.022], "hava"],
    ["buji_yeni_1", cyl(0.010, 0.090, 10), [0.46, 0.30, 0.34], "celik"],

    // Blok içi hareketli takım. Blok gövdesinin içinde kalır; kesit dersi
    // gelene kadar sahnede ancak hedef olduklarında öne çıkarlar.
    ["krank_mili", cyl(0.030, 0.58, 16), [0, 0.34, 0], "celik", EKSEN_X],
    ["ana_yatak", cyl(0.038, 0.050, 16), [-0.10, 0.34, 0], "celik", EKSEN_X],
    ["biyel", box(0.020, 0.20, 0.05), [-0.21, 0.46, 0], "celik"],
    ["piston", cyl(0.043, 0.060, 20), [-0.21, 0.58, 0], "celik"],
    ["volan", cyl(0.140, 0.030, 24), [0.36, 0.34, 0], "celik", EKSEN_X],
    ["arka_kece", cyl(0.050, 0.020, 16), [0.31, 0.34, 0], "hortum", EKSEN_X],

    ["karter", box(0.60, 0.16, 0.36), [0, 0.21, 0], "kapak"],
    ["karter_tapasi", cyl(0.014, 0.022, 10), [0.10, 0.122, 0], "celik"],
    ["yag_filtresi", cyl(0.045, 0.12, 16), [0.20, 0.36, 0.24], "yag", EKSEN_Z],
    ["yag_cubugu", cyl(0.006, 0.28, 8), [0.29, 0.60, 0.15], "celik"],
    ["yag_basinc_manometresi", cyl(0.050, 0.020, 20), [-0.42, 0.30, 0.34], "celik", EKSEN_Z],

    ["krank_kasnagi", cyl(0.090, 0.040, 24), [-0.36, 0.50, 0], "celik", EKSEN_X],
    ["kam_kasnagi", cyl(0.130, 0.035, 24), [-0.36, 0.76, 0], "celik", EKSEN_X],

    // Zaman ayarı: kayış iki kasnağın dışında tek şerit olarak temsil edilir.
    ["triger_kayisi", box(0.016, 0.36, 0.05), [-0.40, 0.63, 0], "hortum"],
    ["gergi_rulmani", cyl(0.045, 0.030, 20), [-0.40, 0.64, -0.15], "celik", EKSEN_X],
    ["triger_isareti", box(0.014, 0.032, 0.014), [-0.40, 0.885, 0], "cizgi"],
    ["kam_mili", cyl(0.022, 0.56, 16), [0, 0.80, -0.08], "celik", EKSEN_X],
    ["supap", cyl(0.008, 0.10, 10), [-0.21, 0.75, -0.08], "celik"],

    ["termostat_kapagi", box(0.10, 0.09, 0.08), [-0.05, 0.60, 0.22], "dokum"],
    ["termostat", cyl(0.026, 0.030, 16), [-0.05, 0.60, 0.265], "celik", EKSEN_Z],
    ["ust_hortum", cyl(0.022, 0.34, 12), [-0.05, 0.62, 0.43], "hortum", EKSEN_Z],
    ["radyator", box(0.62, 0.44, 0.05), [0, 0.52, 0.62], "hava"],
    ["radyator_kapagi", cyl(0.035, 0.040, 16), [-0.22, 0.762, 0.62], "sogutma"],
    ["radyator_tapasi", cyl(0.014, 0.022, 10), [0.22, 0.292, 0.62], "celik"],
    ["genlesme_deposu", box(0.16, 0.22, 0.14), [0.38, 0.66, 0.48], "plastik"],

    ["hava_filtre_kutusu", box(0.26, 0.16, 0.24), [0.34, 1.02, 0.06], "hava"],
    ["hava_filtresi", box(0.22, 0.040, 0.20), [0.34, 1.02, 0.06], "plastik"],

    ["kaput", box(1.20, 0.04, 1.00), [0, 1.20, 0.20], "govde"],
  ],

  // Tezgâh: ölçü aletleri ve cıvata egzersizleri. Tezgâh yüzeyi y=0.90.
  tezgah: [
    ["tezgah_yuzeyi", box(1.60, 0.06, 0.80), [0, 0.90, 0], "ahsap"],
    ["tezgah_ayak_sol", box(0.08, 0.87, 0.70), [-0.72, 0.435, 0], "celik"],
    ["tezgah_ayak_sag", box(0.08, 0.87, 0.70), [0.72, 0.435, 0], "celik"],
    ["mengene", box(0.22, 0.14, 0.16), [-0.58, 1.00, -0.22], "celik"],

    ["olcu_aletleri_tepsisi", box(0.52, 0.030, 0.26), [-0.30, 0.945, 0.18], "plastik"],
    ["kumpas", box(0.24, 0.016, 0.05), [-0.40, 0.968, 0.16], "celik"],
    ["kumpas_cene", box(0.03, 0.016, 0.09), [-0.50, 0.968, 0.19], "celik"],
    ["mikrometre", cyl(0.016, 0.13, 14), [-0.16, 0.968, 0.20], "celik", EKSEN_X],

    ["egzersiz_plakasi", box(0.34, 0.030, 0.22), [0.28, 0.945, 0], "celik"],
    ["egzersiz_civata_1", cyl(0.008, 0.060, 10), [0.18, 0.990, 0], "celik"],
    ["flans_civata", cyl(0.010, 0.050, 10), [0.30, 0.985, 0], "celik"],
    ["flans_civata_flansi", cyl(0.020, 0.006, 14), [0.30, 0.963, 0], "celik"],
    ["egzersiz_dis_deligi", cyl(0.011, 0.032, 12), [0.40, 0.945, 0], "kesit"],
    ["egzersiz_civata_yeni_1", cyl(0.008, 0.060, 10), [0.62, 0.955, 0.20], "celik", EKSEN_X],
  ],

  // Atölye: KKD, yangın ve aracı emniyete alma. Zemin y=0.
  atolye: [
    ["zemin", box(5.0, 0.04, 5.0), [0, -0.02, 0], "zemin"],
    ["calisma_alani", box(2.60, 0.012, 2.20), [0, 0.012, 0], "cizgi"],

    ["kkd_dolabi", box(0.80, 1.80, 0.40), [-1.80, 0.90, -1.40], "ekipman"],
    ["yangin_tupu", cyl(0.090, 0.50, 16), [-1.10, 0.25, -1.60], "sogutma"],

    // Araç gövdesi artık kutu değil: atolye.parts.json'daki dekor.arac, Poly Haven'ın
    // CC0 "covered_car" varlığını yükler. Örtülü olduğu için marka geometrisi taşımaz.
    ["kaldirma_noktasi", box(0.12, 0.06, 0.30), [0.86, 0.34, 0.90], "celik"],
    ["kriko", box(0.30, 0.16, 0.56), [1.10, 0.09, 0.90], "ekipman"],
    ["sehpa", cyl(0.14, 0.38, 12), [0.86, 0.19, -0.90], "ekipman"],
  ],

  // Elektrik tezgâhı: akü, ölçü aleti, sigorta kutusu ve tek bir tüketici devresi.
  // Bir devrenin dört parçası burada birden görünür: kaynak, koruma, iletken, tüketici.
  elektrik: [
    ["tezgah_yuzeyi", box(1.60, 0.06, 0.80), [0, 0.90, 0], "ahsap"],

    ["aku_govdesi", box(0.26, 0.20, 0.18), [-0.10, 1.03, 0], "kapak"],
    ["aku_arti_kutup", cyl(0.011, 0.030, 12), [-0.18, 1.14, 0.05], "sogutma"],
    ["aku_eksi_kutup", cyl(0.011, 0.030, 12), [-0.02, 1.14, 0.05], "celik"],
    ["aku_arti_kelepce", cyl(0.017, 0.014, 12), [-0.18, 1.155, 0.05], "celik"],
    ["aku_eksi_kelepce", cyl(0.017, 0.014, 12), [-0.02, 1.155, 0.05], "celik"],

    ["multimetre_govdesi", box(0.11, 0.18, 0.035), [0.42, 1.02, 0], "ekipman"],
    ["multimetre_ekran", box(0.075, 0.035, 0.006), [0.42, 1.075, 0.020], "plastik"],
    ["multimetre_secici", cyl(0.024, 0.008, 16), [0.42, 1.00, 0.020], "kapak"],
    ["prob_kirmizi", cyl(0.005, 0.20, 8), [0.34, 0.95, 0.16], "sogutma", EKSEN_Z],
    ["prob_siyah", cyl(0.005, 0.20, 8), [0.50, 0.95, 0.16], "hortum", EKSEN_Z],

    ["sigorta_kutusu", box(0.22, 0.10, 0.16), [-0.62, 0.98, 0], "kapak"],
    ["sigorta_1", box(0.012, 0.030, 0.008), [-0.68, 1.04, 0.05], "cizgi"],
    ["sigorta_2", box(0.012, 0.030, 0.008), [-0.64, 1.04, 0.05], "cizgi"],

    ["role", box(0.045, 0.045, 0.045), [-0.52, 1.005, 0], "hortum"],
    ["role_soketi", box(0.055, 0.020, 0.055), [-0.52, 0.973, 0], "kapak"],

    ["kablo_demeti", cyl(0.010, 0.60, 10), [0.05, 0.95, -0.20], "hortum", EKSEN_X],
    ["far_soketi", box(0.05, 0.04, 0.03), [0.30, 0.95, -0.28], "hortum"],
    // far_ampulu artık burada üretilmiyor: elektrik.parts.json'daki props bölümü
    // Poly Haven'ın CC0 "lightbulb_01" varlığını aynı noktaya oturtuyor.
    ["sase_noktasi", box(0.06, 0.012, 0.06), [0.05, 0.935, -0.32], "celik"],

    // Şarj: alternatör kasnaktan tahrik alır, B+ ucundan aküyü besler, regülatör çıkışı sınırlar.
    ["alternator_govdesi", cyl(0.070, 0.14, 20), [-0.38, 1.00, -0.28], "celik", EKSEN_X],
    ["alternator_kasnagi", cyl(0.032, 0.022, 16), [-0.46, 1.00, -0.28], "celik", EKSEN_X],
    ["alternator_b_ucu", cyl(0.007, 0.020, 10), [-0.34, 1.078, -0.28], "sogutma"],
    ["alternator_regulator", box(0.05, 0.05, 0.03), [-0.30, 1.00, -0.28], "kapak"],

    // Marş: selenoid hem yüksek akımı anahtarlar hem dişliyi ileri iter.
    ["mars_govdesi", cyl(0.055, 0.16, 20), [0.62, 0.99, -0.28], "celik", EKSEN_X],
    ["mars_selenoidi", cyl(0.032, 0.10, 16), [0.62, 1.055, -0.28], "kapak", EKSEN_X],
    ["mars_b_ucu", cyl(0.008, 0.018, 10), [0.67, 1.092, -0.28], "sogutma"],
    ["mars_tetik_ucu", cyl(0.004, 0.014, 8), [0.57, 1.090, -0.28], "cizgi"],

    // Sensör: iki uçlu, sinyalini gerilim ya da direnç olarak veren tipik bir örnek.
    ["sensor_govdesi", cyl(0.014, 0.060, 14), [0.05, 1.020, 0.28], "celik"],
    ["sensor_soketi", box(0.030, 0.022, 0.024), [0.05, 1.062, 0.28], "hortum"],
  ],

  // Lastik ve tekerlek. X = tekerlek (aks) ekseni, Y = yukarı, Z = derinlik.
  // Zemin y=0; tekerlek merkezi y=0.32 olduğu için lastik zemine değer.
  lastik: [
    ["gobek", cyl(0.070, 0.060, 20), [0, 0.32, 0], "dokum", EKSEN_X],
    ["bijon_1", cyl(0.011, 0.034, 10), [0.100, 0.378, 0], "celik", EKSEN_X],
    ["bijon_2", cyl(0.011, 0.034, 10), [0.100, 0.338, 0.055], "celik", EKSEN_X],
    ["bijon_3", cyl(0.011, 0.034, 10), [0.100, 0.284, 0.034], "celik", EKSEN_X],
    ["bijon_4", cyl(0.011, 0.034, 10), [0.100, 0.284, -0.034], "celik", EKSEN_X],
    ["bijon_5", cyl(0.011, 0.034, 10), [0.100, 0.338, -0.055], "celik", EKSEN_X],

    ["jant", cyl(0.200, 0.170, 28), [0, 0.32, 0], "celik", EKSEN_X],
    ["lastik", cyl(0.320, 0.205, 32), [0, 0.32, 0], "hortum", EKSEN_X],
    // Yanak yazısı ayrı bir mesh: dersin okuttuğu yüzey burasıdır.
    ["lastik_yanagi", box(0.006, 0.090, 0.150), [0.106, 0.560, 0], "plastik"],
    ["valf", cyl(0.008, 0.050, 10), [0.115, 0.480, 0], "celik", EKSEN_X],
    ["tpms_sensoru", box(0.045, 0.022, 0.026), [0.062, 0.470, 0], "kapak"],
    ["balans_agirligi", box(0.010, 0.014, 0.030), [0.095, 0.500, 0.075], "celik"],

    // Ölçü aletleri zeminde, tekerleğin yanında.
    ["dis_derinligi_mastari", box(0.100, 0.014, 0.032), [0.60, 0.007, 0.30], "plastik"],
    ["basinc_manometresi", cyl(0.038, 0.022, 20), [0.60, 0.011, 0.10], "ekipman"],
    ["salgi_komparatoru", cyl(0.030, 0.024, 18), [0.60, 0.012, -0.05], "govde"],

    // Ön takım: aşınma deseninin sebebi çoğu zaman burada.
    ["rot_basi", cyl(0.026, 0.050, 14), [0.62, 0.025, -0.24], "celik"],
    ["rot_kolu", cyl(0.014, 0.180, 12), [0.75, 0.025, -0.24], "celik", EKSEN_X],
    ["rotil", cyl(0.030, 0.046, 14), [0.62, 0.023, -0.40], "celik"],

    // Kaldırma ekipmanı: bu alanın ilk dersi güvenliktir.
    ["kriko", box(0.16, 0.14, 0.12), [-0.42, 0.07, 0.34], "ekipman"],
    ["sehpa", box(0.15, 0.30, 0.15), [-0.42, 0.15, 0.02], "uyari"],
    ["bijon_anahtari", box(0.44, 0.020, 0.020), [-0.42, 0.010, -0.30], "celik"],

    // Balans makinesi: mili tekerleği merkezden taşır.
    ["balans_makinesi", box(0.44, 0.88, 0.40), [-1.00, 0.44, -0.30], "govde"],
    ["balans_mili", cyl(0.030, 0.34, 14), [-0.72, 0.72, -0.30], "celik", EKSEN_X],
  ],

  // Direksiyon. X = araç eni (+X sağ), Y = yukarı, Z = ön-arka (+Z sürücüye doğru).
  // Zincir sırayla: simit -> mil -> kremayer -> rot çubuğu -> rot başı.
  direksiyon: [
    // Simit ve içindeki airbag modülü. Kırmızı gövde bilinçli: bu parça sökülmez.
    ["direksiyon_simidi", cyl(0.190, 0.030, 28), [0, 0.95, 0.55], "hortum", EKSEN_Z],
    ["airbag_modulu", cyl(0.075, 0.050, 20), [0, 0.95, 0.575], "uyari", EKSEN_Z],
    ["spiral_kablo", cyl(0.055, 0.030, 18), [0, 0.95, 0.505], "cizgi", EKSEN_Z],
    ["aci_sensoru", cyl(0.040, 0.022, 16), [0, 0.94, 0.455], "kapak", EKSEN_Z],

    ["direksiyon_mili", cyl(0.018, 0.300, 14), [0, 0.90, 0.30], "celik", EKSEN_Z],
    ["mil_mafsali", cyl(0.028, 0.050, 14), [0, 0.86, 0.13], "celik", EKSEN_Z],

    // Kremayer kutusu araç enine uzanır; pinyon milin ucundadır.
    ["kremayer_kutusu", cyl(0.045, 0.66, 20), [0, 0.74, 0], "dokum", EKSEN_X],
    ["kremayer_pinyonu", cyl(0.022, 0.060, 14), [0.03, 0.79, 0.02], "celik"],
    ["kremayer_baski_civatasi", cyl(0.014, 0.028, 10), [0.03, 0.825, 0.02], "celik"],

    ["koruk_sol", cyl(0.030, 0.100, 14), [-0.39, 0.74, 0], "hortum", EKSEN_X],
    ["koruk_sag", cyl(0.030, 0.100, 14), [0.39, 0.74, 0], "hortum", EKSEN_X],
    ["rot_cubugu_sol", cyl(0.014, 0.200, 12), [-0.55, 0.74, 0], "celik", EKSEN_X],
    ["rot_cubugu_sag", cyl(0.014, 0.200, 12), [0.55, 0.74, 0], "celik", EKSEN_X],
    ["rot_basi_sol", cyl(0.026, 0.050, 14), [-0.68, 0.74, 0], "celik"],
    ["rot_basi_sag", cyl(0.026, 0.050, 14), [0.68, 0.74, 0], "celik"],

    // Hidrolik yardım: pompa motordan tahrikli, depo ve iki hortum.
    ["hidrolik_pompa", cyl(0.055, 0.100, 18), [-0.45, 1.05, -0.30], "govde", EKSEN_X],
    ["pompa_kasnagi", cyl(0.045, 0.020, 16), [-0.52, 1.05, -0.30], "celik", EKSEN_X],
    ["hidrolik_deposu", cyl(0.055, 0.140, 16), [-0.24, 1.12, -0.28], "plastik"],
    ["basinc_hortumu", cyl(0.010, 0.400, 10), [-0.32, 0.92, -0.12], "yag", EKSEN_Z],
    ["donus_hortumu", cyl(0.013, 0.360, 10), [-0.18, 0.90, -0.12], "hortum", EKSEN_Z],

    // Elektrik yardım: motor kremayer üzerinde, tork sensörü milin dibinde.
    ["eps_motoru", cyl(0.048, 0.120, 18), [0.22, 0.80, 0.04], "kapak", EKSEN_X],
    ["tork_sensoru", box(0.052, 0.052, 0.040), [0.02, 0.845, 0.055], "plastik"],
    ["eps_kontrol_unitesi", box(0.100, 0.070, 0.040), [0.32, 0.87, -0.06], "kapak"],

    ["basinc_test_cihazi", box(0.100, 0.140, 0.050), [0.60, 0.80, -0.30], "ekipman"],
  ],

  // Aksesuar ve ses: sol ön kapı kesiti + kabin önü + bagajda ses donanımı.
  // X = araç eni (+X sağ/kabin içi), Y = yukarı, Z = ön-arka (+Z öne doğru).
  aksesuar: [
    // Kapı gövdesi ve içindeki konfor donanımı. Kapı düzlemi x=-0.55'te.
    ["kapi_saci", box(0.030, 0.90, 1.10), [-0.55, 0.85, 0], "boya"],
    ["kapi_ic_dosemesi", box(0.022, 0.86, 1.04), [-0.51, 0.85, 0], "plastik"],
    ["kapi_modulu", box(0.050, 0.090, 0.130), [-0.48, 0.72, -0.24], "kapak"],
    ["merkezi_kilit_motoru", cyl(0.030, 0.070, 16), [-0.49, 0.66, -0.42], "kapak", EKSEN_X],
    ["cam_motoru", cyl(0.038, 0.080, 18), [-0.48, 0.62, 0.10], "kapak", EKSEN_X],
    ["cam_krikosu", box(0.020, 0.34, 0.40), [-0.52, 0.86, 0.06], "celik"],
    ["kapi_cami", box(0.008, 0.42, 0.86), [-0.545, 1.24, 0.02], "hava"],
    ["kapi_korugu", cyl(0.022, 0.130, 12), [-0.53, 1.02, -0.50], "hortum", EKSEN_Z],
    ["kapi_kablo_demeti", cyl(0.011, 0.62, 10), [-0.50, 0.88, -0.14], "hortum", EKSEN_Z],
    ["dis_dikiz_aynasi", box(0.070, 0.110, 0.160), [-0.60, 1.34, 0.44], "boya"],
    ["ayna_motoru", cyl(0.024, 0.036, 14), [-0.58, 1.34, 0.44], "kapak", EKSEN_X],
    ["hoparlor_kapi", cyl(0.080, 0.055, 20), [-0.50, 0.60, 0.30], "hortum", EKSEN_X],

    // Kabin önü: cam, silecek, yağmur sensörü, koltuk, tavan.
    ["on_cam", box(1.30, 0.62, 0.030), [0, 1.42, 0.86], "hava"],
    ["yagmur_sensoru", box(0.060, 0.050, 0.018), [0.10, 1.56, 0.845], "plastik"],
    ["silecek_kolu", box(0.026, 0.020, 0.52), [-0.22, 1.10, 0.98], "hortum"],
    ["silecek_motoru", cyl(0.048, 0.100, 18), [-0.30, 1.04, 1.06], "kapak", EKSEN_X],
    ["koltuk_oturagi", box(0.48, 0.100, 0.48), [-0.28, 0.52, -0.30], "hortum"],
    ["koltuk_motoru", cyl(0.028, 0.090, 14), [-0.28, 0.42, -0.30], "kapak", EKSEN_X],
    ["sunroof_paneli", box(0.72, 0.020, 0.52), [0, 1.72, 0.10], "hava"],
    ["sunroof_motoru", cyl(0.040, 0.070, 16), [0, 1.70, -0.22], "kapak", EKSEN_X],
    ["sunroof_tahliye_hortumu", cyl(0.008, 0.44, 8), [-0.36, 1.50, 0.16], "hortum"],

    // Besleme ve haberleşme: bu alanın her dersi buraya dokunuyor.
    ["sigorta_kutusu", box(0.180, 0.130, 0.090), [0.40, 1.00, 0.60], "kapak"],
    ["sase_noktasi", cyl(0.026, 0.014, 14), [0.34, 0.66, 0.30], "celik"],
    ["ana_kablo_demeti", cyl(0.016, 1.30, 12), [0.10, 0.70, 0], "hortum", EKSEN_Z],
    ["haberlesme_hatti", cyl(0.006, 1.10, 8), [0.16, 0.76, 0], "cizgi", EKSEN_Z],

    // Araç kamerası: ön ve arka kayıt sistemi. Kullanıcı talebiyle eklendi —
    // sanayide bu montaj ayrı bir iş kalemi ve derslerin hedef bağlayacağı
    // parça gerekiyor. Kablo güzergâhı tavan kaplamasının altından geçtiği
    // için kaplama da ayrı mesh.
    ["arka_cam", box(1.20, 0.50, 0.030), [0, 1.36, -1.05], "hava"],
    ["tavan_kaplamasi", box(1.16, 0.014, 1.20), [0, 1.69, -0.62], "plastik"],
    ["on_kamera", box(0.070, 0.045, 0.032), [-0.06, 1.58, 0.840], "kapak"],
    ["arka_kamera", box(0.062, 0.040, 0.030), [0.10, 1.50, -1.030], "kapak"],
    ["kamera_kablosu", cyl(0.005, 2.00, 8), [0.34, 1.66, -0.10], "cizgi", EKSEN_Z],

    // Dış aksesuar.
    ["tampon", box(1.44, 0.30, 0.120), [0, 0.62, 1.22], "boya"],
    ["far_grubu", box(0.34, 0.16, 0.130), [-0.50, 0.86, 1.16], "hava"],
    ["stop_lambasi", box(0.30, 0.16, 0.110), [-0.50, 0.86, -1.16], "uyari"],
    ["anten", cyl(0.012, 0.130, 10), [0, 1.76, -0.60], "kapak"],

    // Ses donanımı: bagaj tarafı.
    ["bas_unite", box(0.180, 0.100, 0.160), [0.06, 1.06, 0.70], "kapak"],
    ["anfi", box(0.260, 0.060, 0.180), [0.30, 0.46, -0.80], "kapak"],
    ["hoparlor_arka", cyl(0.075, 0.050, 20), [0.36, 0.72, -0.96], "hortum"],
    ["subwoofer", cyl(0.140, 0.140, 24), [-0.10, 0.52, -0.96], "hortum"],
    ["ses_guc_kablosu", cyl(0.009, 1.50, 8), [0.24, 0.44, -0.10], "sogutma", EKSEN_Z],
    ["rca_kablosu", cyl(0.005, 1.40, 8), [-0.02, 0.44, -0.10], "yag", EKSEN_Z],

    // Ölçü aletleri.
    ["pens_ampermetre", box(0.070, 0.180, 0.036), [0.62, 0.50, 0.40], "ekipman"],
    ["multimetre_aksesuar", box(0.090, 0.150, 0.040), [0.62, 0.50, 0.10], "ekipman"],
  ],

  // Kaporta ve boya: gövdenin bir köşesi — ön çamurluk, kaput, kapı, eşik,
  // A ve B direği, tavan ve bagaj. Yapısal parçalar (direk, eşik, taşıyıcı
  // ayak) AYRI mesh: bu alanın kırmızı çizgisi "hangi parça taşıyıcı" sorusu
  // ve öğrencinin bunları ayrı seçebilmesi gerekiyor.
  // X = araç eni (+X sağ), Y = yukarı, Z = ön-arka (+Z öne doğru).
  kaporta: [
    // Dış paneller.
    ["kaput", box(1.40, 0.040, 1.00), [0, 1.02, 1.05], "boya"],
    ["on_camurluk", box(0.030, 0.60, 0.90), [-0.78, 0.90, 0.72], "boya"],
    ["on_kapi_paneli", box(0.030, 0.90, 1.05), [-0.80, 0.92, -0.10], "boya"],
    ["arka_kapi_paneli", box(0.030, 0.86, 0.92), [-0.80, 0.90, -1.05], "boya"],
    ["tavan_paneli", box(1.30, 0.030, 1.60), [0, 1.62, -0.30], "boya"],
    ["bagaj_kapagi", box(1.30, 0.045, 0.80), [0, 1.10, -1.72], "boya"],
    ["tampon_kaporta", box(1.52, 0.34, 0.130), [0, 0.60, 1.60], "plastik"],

    // Taşıyıcı yapı: bu alanın sınır dersleri bunlara bakıyor.
    ["direk_a", box(0.080, 0.72, 0.090), [-0.72, 1.28, 0.48], "celik"],
    ["direk_b", box(0.090, 0.86, 0.100), [-0.74, 1.20, -0.58], "celik"],
    ["esik_saci", box(0.120, 0.140, 1.90), [-0.80, 0.44, -0.30], "celik"],
    ["tasiyici_ayak", box(0.100, 0.120, 0.90), [-0.52, 0.36, 0.80], "celik"],
    ["punta_noktasi", cyl(0.008, 0.006, 10), [-0.80, 0.51, 0.30], "cizgi"],

    // Hasar ve onarım bölgesi.
    ["gocuk_bolgesi", box(0.026, 0.26, 0.30), [-0.795, 0.94, 0.72], "uyari"],
    ["zimpara_bolgesi", box(0.024, 0.34, 0.40), [-0.79, 0.92, -0.10], "hava"],

    // Ekipman.
    ["kaynak_makinesi", box(0.30, 0.40, 0.24), [0.70, 0.55, 0.60], "ekipman"],
    ["gocuk_cektirme", box(0.070, 0.070, 0.42), [0.70, 0.52, 0.10], "ekipman"],
    ["boya_tabancasi", cyl(0.040, 0.220, 12), [0.70, 0.55, -0.40], "ekipman"],
    ["kalinlik_olcer", box(0.060, 0.120, 0.030), [0.70, 0.52, -0.80], "ekipman"],
    ["olcum_mastari", box(0.024, 0.024, 1.10), [0.46, 0.30, -0.20], "celik", EKSEN_Z],
  ],

  // Kabin: yalnız gösterge paneli. Sürücünün gördüğü uyarı lambası burada.
  kabin: [
    ["gosterge_paneli", box(0.90, 0.28, 0.06), [0, 1.00, 0], "kapak"],
    ["yag_basinc_lambasi", box(0.050, 0.030, 0.010), [-0.16, 1.03, 0.035], "uyari"],
  ],
};

// ——— glTF montajı ————————————————————————————————————————————

function uret(model, parcalar) {
  const bin = [];
  let offset = 0;
  const bufferViews = [], accessors = [], meshes = [], nodes = [];

  const push = (buf, target) => {
    while (offset % 4) { bin.push(Buffer.from([0])); offset++; }
    bin.push(buf);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
    offset += buf.length;
    return bufferViews.length - 1;
  };
  const accessor = (bufferView, componentType, count, type, extra = {}) => {
    accessors.push({ bufferView, componentType, count, type, ...extra });
    return accessors.length - 1;
  };

  for (const [ad, geo, konum, malzeme, donus] of parcalar) {
    const n = geo.pos.length / 3;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 3; k++) {
        const v = geo.pos[i * 3 + k];
        if (v < min[k]) min[k] = v;
        if (v > max[k]) max[k] = v;
      }
    }

    const aPos = accessor(push(Buffer.from(new Float32Array(geo.pos).buffer), 34962), 5126, n, "VEC3", { min, max });
    const aNrm = accessor(push(Buffer.from(new Float32Array(geo.nrm).buffer), 34962), 5126, n, "VEC3");
    const aIdx = accessor(push(Buffer.from(new Uint16Array(geo.idx).buffer), 34963), 5123, geo.idx.length, "SCALAR");

    meshes.push({ name: ad, primitives: [{ attributes: { POSITION: aPos, NORMAL: aNrm }, indices: aIdx, material: MAT[malzeme] }] });
    const node = { name: ad, mesh: meshes.length - 1, translation: konum };
    if (donus) node.rotation = donus;
    nodes.push(node);
  }

  const binary = Buffer.concat(bin);
  const gltf = {
    asset: { version: "2.0", generator: "build-models.mjs — Everything For My Car" },
    scene: 0,
    scenes: [{ name: model, nodes: nodes.map((_, i) => i) }],
    nodes, meshes, materials: MALZEMELER, accessors, bufferViews,
    buffers: [{ byteLength: binary.length }],
  };

  const pad = (buf, filler) => {
    const rem = buf.length % 4;
    return rem ? Buffer.concat([buf, Buffer.alloc(4 - rem, filler)]) : buf;
  };
  const jsonChunk = pad(Buffer.from(JSON.stringify(gltf), "utf8"), 0x20);
  const binChunk = pad(binary, 0);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);

  const chunkHeader = (len, type) => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(len, 0);
    b.writeUInt32LE(type, 4);
    return b;
  };

  const yol = `${DIZIN}/${model}.glb`;
  writeFileSync(yol, Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f534a), jsonChunk,
    chunkHeader(binChunk.length, 0x004e4942), binChunk,
  ]));
  console.log(`${yol}  ${nodes.length} düğüm, ${Math.round(total / 1024)} KB`);
  console.log(`  ${nodes.map((n) => n.name).join(", ")}`);
}

mkdirSync(DIZIN, { recursive: true });
for (const [model, parcalar] of Object.entries(MODELLER)) uret(model, parcalar);
