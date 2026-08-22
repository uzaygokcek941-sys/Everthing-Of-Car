// Tek kisilik admin oturumu. Kullanici tablosu yok: parola ve imza anahtari
// ortam degiskeninden gelir, oturum imzali cerezde tasinir.
import { createHmac, timingSafeEqual } from "node:crypto";

const CEREZ = "efmc_admin";
const SURE_SN = 60 * 60 * 12;

/** Iki dizgiyi sabit surede karsilastirir; uzunluk farki da sizdirmaz. */
function esit(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) {
    // timingSafeEqual farkli uzunlukta hata atar; yine de sabit is yapalim.
    timingSafeEqual(x, x);
    return false;
  }
  return timingSafeEqual(x, y);
}

function imzala(veri: string, gizli: string): string {
  return createHmac("sha256", gizli).update(veri).digest("hex");
}

export function ayarlar(): { parola: string; gizli: string } | null {
  const parola = process.env.ADMIN_PAROLA;
  const gizli = process.env.ADMIN_GIZLI;
  if (!parola || !gizli) return null;
  return { parola, gizli };
}

export function jetonUret(gizli: string): { ad: string; deger: string; sure: number } {
  const bitis = Math.floor(Date.now() / 1000) + SURE_SN;
  return { ad: CEREZ, deger: `${bitis}.${imzala(String(bitis), gizli)}`, sure: SURE_SN };
}

export function jetonGecerli(deger: string | undefined, gizli: string): boolean {
  if (!deger) return false;
  const [bitis, imza] = deger.split(".");
  if (!bitis || !imza) return false;
  if (Number(bitis) < Math.floor(Date.now() / 1000)) return false;
  return esit(imza, imzala(bitis, gizli));
}

export function parolaDogru(girilen: string, beklenen: string): boolean {
  return esit(girilen, beklenen);
}

export const CEREZ_ADI = CEREZ;
