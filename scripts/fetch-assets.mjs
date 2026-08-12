// Poly Haven'dan CC0 foto-taranmış varlıkları indirir.
//
// Neden Poly Haven: tamamı CC0 (kamu malı) — ticari kullanım, değiştirme ve
// yeniden dağıtım serbest, atıf hukuken zorunlu değil. Yine de LICENSES.md'ye
// yazar adı yazılır; sanatçının hakkını teslim etmek bizim kuralımız.
//
// KULLANILMAYAN kaynaklar ve sebebi:
//   GrabCAD   — lisansı ticari kullanıma kapalı, projede yasak
//   Sketchfab — CC-BY varlıklar için giriş/OAuth gerekiyor, otomatikleştirilemez
//   Marka geometrisi (gerçek araç modelleri) — marka lisansı gerekir
//
// Çalıştırma:  NODE_OPTIONS=--use-system-ca node scripts/fetch-assets.mjs
// (Bu makinede TLS araya girme var; Node kendi CA deposuyla zinciri doğrulayamıyor.)

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const API = "https://api.polyhaven.com";
const HEDEF = "web/public/models/vendor";
const COZUNURLUK = "1k"; // 2k dosya boyutunu dört katına çıkarır; tarayıcıda gereksiz

/** Neyi neden indirdiğimiz. Ders içeriğiyle eşleşmeyen varlık listeye girmez. */
const VARLIKLAR = [
  ["adjustable_wrench", "Kurbağacık — tezgâh alet seti"],
  ["combination_wrench", "Açık ağız/yıldız anahtar — tezgâh alet seti"],
  ["ratchet_wrench", "Cırcır kolu — sökme takma derslerinin ana aleti"],
  ["screwdriver", "Tornavida — soket ve sigorta işleri"],
  ["metal_toolbox", "Alet çantası — atölye düzeni dersi"],
  ["tool_cart", "Alet arabası — atölye düzeni dersi"],
  ["covered_car", "Örtülü araç — marka içermez, atölyedeki araç yerine"],
  ["lightbulb_01", "Ampul — far değişimi ve aydınlatma arızası dersleri"],
  ["modular_electric_cables", "Kablo demeti — elektrik alanının her dersinde geçiyor"],
];

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function indir(url, hedef) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(dirname(hedef), { recursive: true });
  await writeFile(hedef, Buffer.from(await res.arrayBuffer()));
}

const satirlar = [
  "# Üçüncü Taraf Varlıklar",
  "",
  "Kaynak: Poly Haven — tamamı **CC0**.",
  "Atıf hukuken zorunlu değildir; sanatçının hakkını teslim etmek için yazılmıştır.",
  "",
  "| Varlık | Sanatçı | Lisans | Neden burada |",
  "|---|---|---|---|",
];

let toplam = 0;
for (const [id, gerekce] of VARLIKLAR) {
  const [dosyalar, bilgi] = await Promise.all([json(`${API}/files/${id}`), json(`${API}/info/${id}`)]);
  const gltf = dosyalar.gltf?.[COZUNURLUK]?.gltf;
  if (!gltf) throw new Error(`${id}: ${COZUNURLUK} gltf yok`);

  // include: { "textures/x.jpg": {url,...} } — göreli yollar gltf'in yanına açılır.
  const parcalar = [[`${id}.gltf`, gltf.url], ...Object.entries(gltf.include ?? {}).map(([p, v]) => [p, v.url])];
  for (const [rel, url] of parcalar) await indir(url, join(HEDEF, id, rel));

  const boyut = (gltf.size + Object.values(gltf.include ?? {}).reduce((t, v) => t + v.size, 0)) / 1024;
  toplam += boyut;
  const yazar = Object.keys(bilgi.authors ?? {}).join(", ") || "Poly Haven";
  satirlar.push(`| ${bilgi.name ?? id} | ${yazar} | CC0 | ${gerekce} |`);
  console.log(`  ${id.padEnd(26)} ${Math.round(boyut).toString().padStart(5)} KB  ${yazar}`);
}

satirlar.push(
  "",
  `Toplam: ${Math.round(toplam)} KB, ${VARLIKLAR.length} varlık, ${COZUNURLUK} doku.`,
  "",
  "Motor parçaları bu listede YOKTUR: CC0 lisanslı gerçekçi bir motor modeli bulunmuyor ve",
  "GrabCAD gibi CAD kaynakları ticari kullanıma kapalı. Motor geometrisi kod ile üretilmeye devam ediyor.",
  "",
);
await writeFile(join(HEDEF, "LICENSES.md"), satirlar.join("\n"));

console.log(`\n${VARLIKLAR.length} varlık indirildi, toplam ~${Math.round(toplam / 1024)} MB → ${HEDEF}`);
