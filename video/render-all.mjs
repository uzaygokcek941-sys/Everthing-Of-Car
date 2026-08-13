// Bütün dersleri toplu render eder. Tek tek de alınabilir:
//   npx remotion render src/index.ts Ders out/<ad>.mp4 --props=props/<ad>.json
//
// Uyarı: 52 ders yaklaşık bir saat sürer ve ~600 MB çıktı üretir. Argüman
// verilmezse yalnız listeler; gerçekten render almak için --yaz gerekir.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const KAYNAK = "../web/public/procedures";
const HEDEF_MP4 = "out";
const HEDEF_WEB = "../web/public/videos";
const yaz = process.argv.includes("--yaz");
const sadece = process.argv.find((a) => a.startsWith("--ders="))?.slice(7);

mkdirSync("props", { recursive: true });
mkdirSync(HEDEF_MP4, { recursive: true });
if (yaz) mkdirSync(HEDEF_WEB, { recursive: true });

const dosyalar = readdirSync(KAYNAK)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !sadece || f.includes(sadece));

console.log(`${dosyalar.length} ders${yaz ? "" : " (kuru çalışma — render alınmıyor)"}`);

for (const dosya of dosyalar) {
  const ders = JSON.parse(readFileSync(join(KAYNAK, dosya), "utf8"));
  // Dosya adı prosedür id'sinin tireli hâlidir; uygulama da videoyu
  // /videos/<id noktasız>.mp4 adresinden arar (Curriculum.tsx ile aynı kural).
  const ad = basename(dosya, ".json");

  // props'u ses-uret.mjs yazar (icinde anlatim dosyalari ve sureleri var).
  // Yoksa ses olmadan, eski metin-uzunlugu hesabiyla render alinir.
  const propsYol = join("props", `${ad}.json`);
  if (!existsSync(propsYol)) writeFileSync(propsYol, JSON.stringify({ ders }));
  const sessiz = !JSON.parse(readFileSync(propsYol, "utf8")).ses;

  if (!yaz) {
    console.log(`  ${ders.id.padEnd(34)} ${ders.steps.length} adım`);
    continue;
  }

  const cikti = join(HEDEF_MP4, `${ad}.mp4`);
  console.log(`  render: ${ders.id}${sessiz ? "  [SESSIZ]" : ""}`);
  execFileSync(
    "npx",
    // veryfast + crf 20: ayni ders 19 dk yerine 7 dk 51 sn'de bitiyor, metin
    // videosunda gozle fark yok.
    [
      "remotion", "render", "src/index.ts", "Ders", cikti,
      "--codec", "h264", "--crf", "20", "--x264-preset=veryfast", "--concurrency=8",
      `--props=${propsYol}`,
    ],
    { stdio: "inherit", shell: true },
  );
  writeFileSync(join(HEDEF_WEB, `${ad}.mp4`), readFileSync(cikti));
}

console.log(yaz ? "\nBitti." : "\nGerçekten render almak için: node render-all.mjs --yaz");
