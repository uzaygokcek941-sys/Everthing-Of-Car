// İlerleme kaydı. Yerel depolama birincil kalır: internet yokken de çalışır.
// Supabase yapılandırılmışsa üstüne senkron olur, değilse uygulama aynen sürer.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Kayit = { score: number; at: string };
const ANAHTAR = "efmc.done";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let istemci: SupabaseClient | null = null;
if (url && anon) istemci = createClient(url, anon, { auth: { persistSession: true } });

export const yapilandirildi = () => istemci !== null;

export function yerelOku(): Record<string, Kayit> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ANAHTAR) ?? "{}");
  } catch {
    return {};
  }
}

export function yerelYaz(kayit: Record<string, Kayit>) {
  localStorage.setItem(ANAHTAR, JSON.stringify(kayit));
}

/**
 * Anonim oturum. Kullanıcıya kayıt ekranı göstermeden cihaz başına bir kimlik
 * verir; RLS bu kimliğe bağlıdır. Supabase panelinde anonim giriş kapalıysa
 * hata döner — o durumda uygulama yerelde devam eder, sessizce yutmaz, bir kez
 * konsola yazar.
 */
let uyarildi = false;
async function oturum(): Promise<string | null> {
  if (!istemci) return null;
  const { data } = await istemci.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: yeni, error } = await istemci.auth.signInAnonymously();
  if (error) {
    if (!uyarildi) {
      uyarildi = true;
      console.warn("[ilerleme] bulut kapalı, yerelde devam:", error.message);
    }
    return null;
  }
  return yeni.session?.user.id ?? null;
}

/** Buluttaki kayıtları getirir ve yerelle birleştirir. Yüksek puan kazanır. */
export async function bulutuGetir(): Promise<Record<string, Kayit>> {
  const yerel = yerelOku();
  const kullanici = await oturum();
  if (!istemci || !kullanici) return yerel;

  const { data, error } = await istemci.from("ilerleme").select("prosedur, puan, guncelleme");
  if (error) {
    if (!uyarildi) {
      uyarildi = true;
      console.warn("[ilerleme] tablo okunamadı, yerelde devam:", error.message);
    }
    return yerel;
  }

  const birlesik = { ...yerel };
  for (const satir of data ?? []) {
    const mevcut = birlesik[satir.prosedur];
    if (!mevcut || satir.puan > mevcut.score) {
      birlesik[satir.prosedur] = { score: satir.puan, at: satir.guncelleme };
    }
  }
  yerelYaz(birlesik);
  return birlesik;
}

/** Sonucu buluta yazar. Başarısızlık kullanıcıyı durdurmaz; yerel kayıt zaten yapıldı. */
export async function bulutaYaz(prosedur: string, puan: number, gecti: boolean) {
  const kullanici = await oturum();
  if (!istemci || !kullanici) return;

  const { error } = await istemci
    .from("ilerleme")
    .upsert({ kullanici, prosedur, puan, gecti }, { onConflict: "kullanici,prosedur" });
  if (error) console.warn("[ilerleme] yazılamadı:", error.message);
}
