// Bütün dersleri toplu render eder. Tek tek de alınabilir:
//   npx remotion render src/index.ts Ders out/<ad>.mp4 --props=props/<ad>.json
//
// Uyarı: 52 ders yaklaşık bir saat sürer ve ~600 MB çıktı üretir. Argüman
// verilmezse yalnız listeler; gerçekten render almak için --yaz gerekir.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const KAYNAK = "../web/public/procedures";
const HEDEF_MP4 = "out";
// C: surekli doluyor ve Remotion ders basina birkac GB gecici alan istiyor.
// VIDEO_CIKTI verilirse cikti baska surucuye yazilir (D: gibi).
const HEDEF_WEB = process.env.VIDEO_CIKTI || "../web/public/videos";
const yaz = process.argv.includes("--yaz");
const basarisiz = [];
let cikti = "";
let propsYol = "";
const sadece = process.argv.find((a) => a.startsWith("--ders="))?.slice(7);

mkdirSync("props", { recursive: true });
mkdirSync(HEDEF_MP4, { recursive: true });
if (yaz) mkdirSync(HEDEF_WEB, { recursive: true });

const dosyalar = readdirSync(KAYNAK)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !sadece || f.includes(sadece));

console.log(`${dosyalar.length} ders${yaz ? "" : " (kuru çalışma — render alınmıyor)"}`);

// Onceki surum her ders icin "remotion render src/index.ts" cagiriyordu; bu
// her seferinde webpack paketini (359 MB) ve public klasorunu (324 MB) bastan
// uretiyordu. Olculdu: ders basi 18 dk. Bir kez paketleyip 164 kez kullaniyoruz.
const PAKET = "build";
if (yaz) {
  console.log("paketleniyor (bir kez)...");
  execFileSync("npx", ["remotion", "bundle", "src/index.ts", PAKET], { stdio: "inherit", shell: true });
}

for (const dosya of dosyalar) {
  const ders = JSON.parse(readFileSync(join(KAYNAK, dosya), "utf8"));
  // Dosya adı prosedür id'sinin tireli hâlidir; uygulama da videoyu
  // /videos/<id noktasız>.mp4 adresinden arar (Curriculum.tsx ile aynı kural).
  const ad = basename(dosya, ".json");

  // props'u ses-uret.mjs yazar (icinde anlatim dosyalari ve sureleri var).
  // Yoksa ses olmadan, eski metin-uzunlugu hesabiyla render alinir.
  propsYol = join("props", `${ad}.json`);
  if (!existsSync(propsYol)) writeFileSync(propsYol, JSON.stringify({ ders }));
  const sessiz = !JSON.parse(readFileSync(propsYol, "utf8")).ses;

  if (!yaz) {
    console.log(`  ${ders.id.padEnd(34)} ${ders.steps.length} adım`);
    continue;
  }

  cikti = join(HEDEF_WEB, `${ad}.mp4`);

  // Kaldigi yerden devam: cikti kendi ses dosyalarindan yeniyse yeniden
  // render alma. 164 videoluk kosu kesilirse bastan baslamasin diye.
  const ses = JSON.parse(readFileSync(propsYol, "utf8")).ses;
  const sesZamani = ses
    ? Math.max(...Object.values(ses).map((x) => statSync(join("public", x.dosya)).mtimeMs))
    : 0;
  if (!process.argv.includes("--zorla") && existsSync(cikti) && statSync(cikti).mtimeMs > sesZamani) {
    console.log(`  atla (guncel): ${ad}`);
    continue;
  }

  console.log(`  render: ${ders.id}${sessiz ? "  [SESSIZ]" : ""}`);
  // Tek bir video coktugunde 164'luk kosu olmesin: bir kez yeniden dene,
  // olmuyorsa kaydet ve devam et. (Ilk kosu Remotion'un gecici ses klasoru
  // kaybolunca cokmustu; sebep disk doluydu.)
  try {
    derle();
  } catch (ilk) {
    console.log(`  YENIDEN DENIYOR: ${ad} (${String(ilk.message).slice(0, 90)})`);
    try {
      derle();
    } catch (ikinci) {
      basarisiz.push([ad, String(ikinci.message).slice(0, 160)]);
      console.log(`  BASARISIZ: ${ad}`);
      continue;
    }
  }
}

if (basarisiz.length) {
  console.log("");
  console.log(`BASARISIZ ${basarisiz.length}: ${basarisiz.map(([a]) => a).join(", ")}`);
} else if (yaz) {
  console.log("");
  console.log("Hepsi basarili.");
}

function derle() {
  execFileSync(
    "npx",
    // veryfast + crf 20: ayni ders 19 dk yerine 7 dk 51 sn'de bitiyor, metin
    // videosunda gozle fark yok.
    [
      "remotion", "render", PAKET, "Ders", cikti,
      // crf 23: metin agirlikli goruntude gozle fark yok, dosya ~%30 kucuk.
      // Disk 7.8 GB'a dusmustu; ilk kosu zaten disk dolulugundan cokmustu.
      "--codec", "h264", "--crf", "23", "--x264-preset=veryfast", "--concurrency=8",
      // Olculdu (900 kare, ayni ders): donanim rasterlestirmesi 83 sn, yazilim
      // 176 sn. Remotion varsayilanda yazilimi seciyordu.
      "--gl=angle",
      `--props=${propsYol}`,
    ],
    { stdio: "inherit", shell: true },
  );
}

console.log(yaz ? "\nBitti." : "\nGerçekten render almak için: node render-all.mjs --yaz");
