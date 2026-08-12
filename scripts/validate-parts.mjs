// Prosedürdeki her part.* için model eşlemesi var mı? Faz 1 kapısı.
// Çalıştır: node scripts/validate-parts.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const listJson = (dir) => readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => join(dir, f));

const targets = new Map(); // part.* -> hangi prosedürün hangi adımı
for (const path of listJson("web/public/procedures")) {
  const proc = read(path);
  for (const step of proc.steps) {
    const t = step.interaction?.target;
    if (t) targets.set(t, `${proc.id} adım ${step.id}`);
  }
}

// Bir parçayı hangi model sahiplenirse o eşler; tek modelin bütün sahneleri
// taşıması gerekmez. Hiçbir modelin sahiplenmediği parça eksiktir.
const mapped = new Map(); // part.* -> "model:mesh"
const cakisan = []; // iki manifestoda birden tanımlanmış part.* anahtarları
for (const path of listJson("web/content")) {
  const map = read(path);
  if (!map.parts) continue;

  const sahiplenen = Object.entries(map.parts).filter(([, mesh]) => mesh);
  // props: sahne GLB'sinde değil, yanına yüklenen hazır (CC0) glTF varlığı.
  // dekor.* anahtarları bir adımın hedefi değildir; yalnız part.* sahiplenme sayılır.
  const hazir = Object.entries(map.props ?? {}).filter(([part]) => part.startsWith("part."));
  const toplam = sahiplenen.length + hazir.length;
  console.log(`\n${map.model}  (GLB: ${map.file || "yok — yer tutucu"}, ${toplam} parça)`);
  // Aynı part.* iki manifestoda tanımlıysa Scene.tsx'te SON manifest kazanır ve
  // önceki alanın dersleri sessizce yanlış sahneye kayar. Sessiz olduğu için kapı.
  for (const [part] of [...sahiplenen, ...hazir]) {
    const onceki = mapped.get(part);
    if (onceki) cakisan.push(`${part}: ${onceki} ile ${map.model} çakışıyor`);
  }
  for (const [part, mesh] of sahiplenen) mapped.set(part, `${map.model}:${mesh}`);
  for (const [part, prop] of hazir) mapped.set(part, `${map.model}:hazır varlık ${prop.file}`);

  if (map.license && map.file && !map.license.author) {
    console.log("  UYARI   GLB var ama lisans atfı boş — CC-BY ihlali riski");
  }
}

let missing = 0;
console.log("\nParça eşlemesi");
for (const [part, where] of targets) {
  const mesh = mapped.get(part);
  if (mesh) {
    console.log(`  OK      ${part} -> ${mesh}`);
  } else {
    console.log(`  EKSİK   ${part}   (${where})`);
    missing++;
  }
}

// Yayın kapısı: sourceRequired olan her sayısal değer künyesini taşımalı.
// Kaynaksız tork/boşluk değeri öğrencinin motoruna zarar verir.
let uncited = 0;
console.log("\nKaynak denetimi");
for (const path of listJson("web/public/procedures")) {
  const proc = read(path);
  for (const step of proc.steps) {
    const i = step.interaction;
    if (!i?.sourceRequired) continue;
    const s = i.source;
    if (s?.publisher && s?.url) {
      console.log(`  OK        ${proc.id} adım ${step.id} -> ${s.publisher}`);
    } else {
      console.log(`  KAYNAKSIZ ${proc.id} adım ${step.id} (${i.type})`);
      uncited++;
    }
  }
}

// Müfredat kapısı: "yazildi" diyen her prosedürün dosyası gerçekten olmalı.
// Olmayan içeriği yazılmış göstermek, kilitli göstermekten kötüdür.
const written = new Set(listJson("web/public/procedures").map((p) => read(p).id));
let lying = 0;
console.log("\nMüfredat denetimi");
for (const path of listJson("web/public/curriculum")) {
  const area = read(path);
  const all = area.stages.flatMap((s) => s.procedures);
  const done = all.filter((p) => p.status === "yazildi");
  for (const p of done) {
    if (!written.has(p.id)) {
      console.log(`  YALAN     ${p.id} yazildi diyor ama prosedür dosyası yok`);
      lying++;
    }
  }
  console.log(`  ${area.area}: ${area.stages.length} aşama, ${done.length}/${all.length} prosedür yazıldı`);
}

if (missing || uncited || lying || cakisan.length) {
  if (cakisan.length) {
    console.log(`\n${cakisan.length} parça anahtarı iki manifestoda birden tanımlı:`);
    for (const c of cakisan) console.log(`  ÇAKIŞMA   ${c}`);
  }
  if (missing) console.log(`\n${missing} parça eşlenmemiş. Faz 1 kapısı kapalı.`);
  if (uncited) console.log(`${uncited} değer kaynaksız. Yayın kapısı kapalı.`);
  if (lying) console.log(`${lying} prosedür yazıldı görünüyor ama dosyası yok.`);
  process.exit(1);
}
console.log("\nTüm parçalar eşlendi, tüm değerler kaynaklı.");
