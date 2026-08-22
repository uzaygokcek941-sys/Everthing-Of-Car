// web/public/videos -> Cloudflare R2. Kurulum ve dogrulama: docs/VIDEO-YAYIN.md
// Isi rclone yapar; bu script yalnizca .env.local'i okuyup dogru komutu kurar.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envYolu = path.join(kok, "web", ".env.local");
// render-all.mjs ile ayni degisken: cikti baska surucudeyse oradan yuklenir.
const kaynak = process.env.VIDEO_CIKTI || path.join(kok, "web", "public", "videos");

if (!existsSync(envYolu)) {
  console.error(`${envYolu} yok. docs/VIDEO-YAYIN.md 3. adima bak.`);
  process.exit(1);
}
if (!existsSync(kaynak)) {
  console.error(`${kaynak} yok. Once: cd video && node render-all.mjs`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envYolu, "utf8")
    .split(/\r?\n/)
    .filter((s) => s.trim() && !s.trim().startsWith("#") && s.includes("="))
    .map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i).trim(), s.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const gerekli = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
const eksik = gerekli.filter((k) => !env[k]);
if (eksik.length) {
  console.error(`web/.env.local icinde eksik: ${eksik.join(", ")}`);
  process.exit(1);
}

// winget PATH'i ancak kabuk yeniden baslayinca gorunur oluyor; o yuzden paket
// klasorune de bakiyoruz.
function rcloneYolu() {
  if (spawnSync("rclone", ["version"], { shell: true }).status === 0) return "rclone";
  const kutu = path.join(
    process.env.LOCALAPPDATA ?? "",
    "Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe"
  );
  if (!existsSync(kutu)) return "rclone";
  const alt = readdirSync(kutu).find((d) => existsSync(path.join(kutu, d, "rclone.exe")));
  return alt ? path.join(kutu, alt, "rclone.exe") : "rclone";
}

const r = spawnSync(
  rcloneYolu(),
  ["copy", kaynak, `r2:${env.R2_BUCKET}/videos`, "--transfers", "8", "--progress", "--s3-no-check-bucket"],
  {
    // shell: true YOK - yolda bosluk varsa argumanlari tirnaksiz birlestirip bozuyor.
    stdio: "inherit",
    env: {
      ...process.env,
      RCLONE_CONFIG_R2_TYPE: "s3",
      RCLONE_CONFIG_R2_PROVIDER: "Cloudflare",
      RCLONE_CONFIG_R2_ENDPOINT: env.R2_ENDPOINT,
      RCLONE_CONFIG_R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
      RCLONE_CONFIG_R2_ACL: "private", // erisim public dev URL'inden gelir, nesne ACL'inden degil
    },
  }
);

if (r.error?.code === "ENOENT") {
  console.error("rclone bulunamadi. Kur: winget install Rclone.Rclone");
  process.exit(1);
}

// Hangi derslerin sesli surumu yayinda? R2 basliklarindan anlasilmiyor (worker
// Last-Modified vermiyor), o yuzden listeyi biz birakiyoruz; panel bunu okuyor.
if (r.status === 0) {
  const liste = readdirSync(kaynak)
    .filter((d) => d.endsWith(".mp4"))
    .map((d) => d.slice(0, -4))
    .sort();
  const gecici = path.join(kok, ".sesli");
  mkdirSync(gecici, { recursive: true });
  writeFileSync(
    path.join(gecici, "_sesli.json"),
    JSON.stringify({ guncelleme: new Date().toISOString(), dersler: liste }),
  );
  spawnSync(
    rcloneYolu(),
    ["copy", gecici, `r2:${env.R2_BUCKET}/videos`, "--s3-no-check-bucket"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        RCLONE_CONFIG_R2_TYPE: "s3",
        RCLONE_CONFIG_R2_PROVIDER: "Cloudflare",
        RCLONE_CONFIG_R2_ENDPOINT: env.R2_ENDPOINT,
        RCLONE_CONFIG_R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
        RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
        RCLONE_CONFIG_R2_ACL: "private",
      },
    },
  );
  console.log(`_sesli.json yazildi: ${liste.length} ders`);
}

process.exit(r.status ?? 1);
