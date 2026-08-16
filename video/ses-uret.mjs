// Ders JSON'undan anlatim metnini cikarir, edge-tts ile seslendirir ve
// sahne surelerini props'a yazar. Video artik metni gostermiyor, anlatiyor.
//
//   node ses-uret.mjs                # hepsi
//   node ses-uret.mjs --ders=motor-buji
//
// Cikti: public/ses/<ad>/*.mp3  +  props/<ad>.json icinde "ses" alani.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const KAYNAK = "../web/public/procedures";
const SES = "public/ses";
const MUFREDAT = "../web/public/curriculum";
const SESI = "tr-TR-AhmetNeural";
const sadece = process.argv.find((a) => a.startsWith("--ders="))?.slice(7);
const yenile = process.argv.includes("--yenile");

// Ders.tsx'teki ozet() ile ayni kural olmali; ikisi birlikte degisir.
const ozet = (m) => {
  // Iki cumleyle kesmek ogretim notlarinin %38'ini atiyordu ve tam da en
  // dolgun notlari kirpiyordu. Karakter siniri %19'a dusuruyor; 600 karakter
  // yaklasik 40 saniye konusma, adimi sismeden birakiyor.
  const cumleler = m.split(/(?<=\.)\s+/);
  let cikan = "";
  for (const c of cumleler) {
    if (cikan && (cikan + " " + c).length > 600) break;
    cikan = cikan ? cikan + " " + c : c;
  }
  return cikan;
};
const birlestir = (...p) => p.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

// Alan adi mufredattan okunur: elle yazilan liste alan eklendikce kaymisti,
// alti alanin dordu "Motor ve mekanik" diye anons ediliyordu.
const alanAdi = (a) => JSON.parse(readFileSync(join(MUFREDAT, `${a}.json`), "utf8")).title;

function metinler(ders) {
  const l = [];
  l.push({
    ad: "kapak",
    metin: birlestir(alanAdi(ders.area) + ".", ders.title + ".", (ders.learningGoals ?? []).join(" ")),
  });
  ders.steps.forEach((adim, n) => {
    const dogru = adim.interaction.options?.find((o) => o.correct);
    l.push({
      ad: `a${n + 1}`,
      metin: birlestir(
        `Adım ${n + 1}.`,
        adim.instruction,
        dogru?.label ? dogru.label + "." : adim.hint,
        dogru ? ozet(dogru.explain) : "",
        // Ogretmen notu 1200 karakteri gecebiliyor; tamami okunursa tek adim
        // 100 saniyeyi asiyor. Aciklamada oldugu gibi ilk iki cumle yeter,
        // tamami zaten uygulamada yazili duruyor.
        adim.teachingNote ? ozet(adim.teachingNote) : ""
      ),
    });
  });
  (ders.assessment?.questions ?? []).forEach((soru, n) => {
    const dogru = soru.options.find((o) => o.verdict === soru.a);
    l.push({
      ad: `s${n + 1}`,
      metin: birlestir(`Bitiş sorusu ${n + 1}.`, soru.q, dogru ? "Doğru cevap: " + dogru.label + "." : "", ozet(dogru?.explain ?? "")),
    });
  });
  l.push({ ad: "kapanis", metin: "Anlatım bitti. Aynı adımları kendin yapacaksın." });
  return l;
}

const sure = (yol) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", yol], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
  );

/** Yarim kalmis mp3 sonraki calismada "var" sayilip zinciri kiriyordu. */
const saglam = (yol) => {
  try {
    return existsSync(yol) && sure(yol) > 0.3;
  } catch {
    return false;
  }
};

/** Gecici DNS/aglama hatasi 164 dersi durdurmasin: 4 deneme, artan bekleme. */
function seslendir(metin, mp3) {
  for (let deneme = 1; ; deneme++) {
    try {
      const gecici = mp3 + ".tmp";
      execFileSync(
        "python",
        // --rate=-4%: argparse "-4%" i ayri arguman sanip hata veriyor, esittiyle gecilir.
        ["-m", "edge_tts", "--voice", SESI, "--rate=-4%", "--text", metin, "--write-media", gecici],
        // timeout: edge_tts agdan yanit gelmezse suresiz asili kaliyor ve hic
        // hata firlatmadigi icin yeniden deneme de devreye girmiyordu.
        { stdio: ["ignore", "ignore", "pipe"], timeout: 90_000, killSignal: "SIGKILL" }
      );
      if (!saglam(gecici)) throw new Error("bos veya bozuk ses: " + gecici);
      renameSync(gecici, mp3);
      return;
    } catch (e) {
      rmSync(mp3 + ".tmp", { force: true });
      if (deneme >= 4) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, deneme * 4000);
    }
  }
}

const dosyalar = readdirSync(KAYNAK).filter((f) => f.endsWith(".json") && (!sadece || f.includes(sadece)));
console.log(`${dosyalar.length} ders seslendirilecek (${SESI})`);

for (const dosya of dosyalar) {
  const ders = JSON.parse(readFileSync(join(KAYNAK, dosya), "utf8"));
  const ad = basename(dosya, ".json");
  const klasor = join(SES, ad);
  mkdirSync(klasor, { recursive: true });

  // Onceki kosunun metinleri: yalnizca degisen parca yeniden seslendirilir.
  const propsYol = join("props", `${ad}.json`);
  const eski = existsSync(propsYol) ? JSON.parse(readFileSync(propsYol, "utf8")).ses : null;
  const ses = {};
  for (const { ad: parca, metin } of metinler(ders)) {
    const mp3 = join(klasor, `${parca}.mp3`);
    // Metin degistiyse eski kayit gecersizdir; yoksa kisaltma islemezdi.
    // Eski kosular metni kaydetmiyordu: o durumda yalnizca adim sesleri
    // yenilenir, cunku degisen tek sey ogretmen notunun kisaltilmasiydi.
    const bilinmiyor = eski?.[parca] && eski[parca].metin === undefined;
    const eskiyeGuven = bilinmiyor && !parca.startsWith("a");
    if (yenile || !saglam(mp3) || (!eskiyeGuven && eski?.[parca]?.metin !== metin)) seslendir(metin, mp3);
    ses[parca] = { dosya: `ses/${ad}/${parca}.mp3`, sure: sure(mp3), metin };
  }

  writeFileSync(propsYol, JSON.stringify({ ders, ses }));
  console.log(`  ${ad.padEnd(36)} ${Object.keys(ses).length} parça`);
}
