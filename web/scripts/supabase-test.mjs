// Ilerleme kaydinin ucdan uca dogrulamasi. Uygulamanin yaptigi isin aynisi.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((s) => s.includes("=") && !s.trim().startsWith("#"))
    .map((s) => [s.slice(0, s.indexOf("=")).trim(), s.slice(s.indexOf("=") + 1).trim()]),
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const yeni = () => createClient(URL, ANON, { auth: { persistSession: false } });
const DERS = "test.dogrulama";
let hata = 0;
const kontrol = (ad, ok, ek = "") => {
  console.log(`${ok ? "GECTI " : "KALDI "} ${ad}${ek ? "  -> " + ek : ""}`);
  if (!ok) hata++;
};

// A kullanicisi
const a = yeni();
const { data: girisA, error: hataA } = await a.auth.signInAnonymously();
kontrol("anonim giris", !hataA && !!girisA.session, hataA?.message ?? girisA.session.user.id);
const uidA = girisA.session.user.id;

const { error: yazma } = await a.from("ilerleme").upsert({ kullanici: uidA, prosedur: DERS, puan: 42, gecti: false });
kontrol("satir yazildi", !yazma, yazma?.message);

const { data: okuma } = await a.from("ilerleme").select("prosedur, puan").eq("prosedur", DERS);
kontrol("geri okundu", okuma?.[0]?.puan === 42, JSON.stringify(okuma));

// Dusuk puanla guncelle: tetikleyici eski puani korumali
await a.from("ilerleme").update({ puan: 10 }).eq("kullanici", uidA).eq("prosedur", DERS);
const { data: sonra } = await a.from("ilerleme").select("puan").eq("prosedur", DERS);
kontrol("dusuk puan eski puani bozmadi", sonra?.[0]?.puan === 42, "puan=" + sonra?.[0]?.puan);

// Yuksek puan gecmeli
await a.from("ilerleme").update({ puan: 88 }).eq("kullanici", uidA).eq("prosedur", DERS);
const { data: yuksek } = await a.from("ilerleme").select("puan").eq("prosedur", DERS);
kontrol("yuksek puan yazildi", yuksek?.[0]?.puan === 88, "puan=" + yuksek?.[0]?.puan);

// B kullanicisi A'nin satirini GORMEMELI
const b = yeni();
await b.auth.signInAnonymously();
const { data: baskasi } = await b.from("ilerleme").select("prosedur");
kontrol("RLS: baska kullanici satiri goremiyor", (baskasi?.length ?? 0) === 0, "goren satir: " + (baskasi?.length ?? 0));

// Temizlik: service_role ile test satirlarini sil
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { error: silme } = await admin.from("ilerleme").delete().eq("prosedur", DERS);
kontrol("test satirlari silindi", !silme, silme?.message);

console.log(hata ? `\n${hata} kontrol basarisiz.` : "\nHepsi gecti.");
process.exit(hata ? 1 : 0);
