// web/public/videos -> Cloudflare R2. Kurulum ve dogrulama: docs/VIDEO-YAYIN.md
// Isi rclone yapar; bu script yalnizca .env.local'i okuyup dogru komutu kurar.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envYolu = path.join(kok, "web", ".env.local");
const kaynak = path.join(kok, "web", "public", "videos");

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

const r = spawnSync(
  "rclone",
  ["copy", kaynak, `r2:${env.R2_BUCKET}/videos`, "--transfers", "8", "--progress", "--s3-no-check-bucket"],
  {
    stdio: "inherit",
    shell: true,
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
process.exit(r.status ?? 1);
