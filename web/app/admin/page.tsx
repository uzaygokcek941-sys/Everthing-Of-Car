import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { ayarlar, jetonGecerli, CEREZ_ADI } from "@/lib/admin";

export const runtime = "nodejs";
// Sayfa her istekte R2 ve Supabase okuyor; 60 sn onbellek yeterli.
export const revalidate = 60;

type Ders = { id: string; area: string; title: string };
type Sesli = { guncelleme: string; dersler: string[] };

const TABAN = process.env.NEXT_PUBLIC_VIDEO_BASE ?? "";

async function dersleriOku(): Promise<Ders[]> {
  const dizin = join(process.cwd(), "public", "procedures");
  const dosyalar = (await readdir(dizin)).filter((d) => d.endsWith(".json"));
  const hepsi = await Promise.all(
    dosyalar.map(async (d) => JSON.parse(await readFile(join(dizin, d), "utf8")) as Ders),
  );
  return hepsi.sort((a, b) => a.id.localeCompare(b.id, "tr"));
}

/** Sesli surumu yayinda olan dersler. Listeyi yukleme scripti R2'ye birakiyor:
 *  video basliklarindan eski sessiz surumle yenisi ayirt edilemiyor. */
async function sesliOku(): Promise<Sesli | null> {
  if (!TABAN) return null;
  try {
    const yanit = await fetch(`${TABAN}/videos/_sesli.json`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!yanit.ok) return null;
    return (await yanit.json()) as Sesli;
  } catch {
    return null;
  }
}

type Kullanim = { kullanici: number; kayit: number; enCok: Array<[string, number]> };

async function kullanimOku(): Promise<Kullanim | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anahtar) return null;
  try {
    const yanit = await fetch(`${url}/rest/v1/ilerleme?select=kullanici,prosedur`, {
      headers: { apikey: anahtar, Authorization: `Bearer ${anahtar}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!yanit.ok) return null;
    const satirlar = (await yanit.json()) as Array<{ kullanici: string; prosedur: string }>;
    const sayac = new Map<string, number>();
    for (const satir of satirlar) sayac.set(satir.prosedur, (sayac.get(satir.prosedur) ?? 0) + 1);
    return {
      kullanici: new Set(satirlar.map((s) => s.kullanici)).size,
      kayit: satirlar.length,
      enCok: [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  } catch {
    return null;
  }
}

function Giris({ hata }: { hata: boolean }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-lg font-medium text-zinc-100">Yönetim girişi</h1>
      {hata && <p className="text-sm text-red-400">Parola hatalı.</p>}
      <form action="/api/admin/giris" method="post" className="space-y-3">
        <input
          type="password"
          name="parola"
          autoFocus
          required
          placeholder="Parola"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
        <button type="submit" className="w-full rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900">
          Gir
        </button>
      </form>
    </main>
  );
}

function Kutu({ baslik, deger, alt }: { baslik: string; deger: string; alt?: string }) {
  return (
    <div className="rounded border border-zinc-800 p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{baslik}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{deger}</p>
      {alt && <p className="mt-1 text-xs text-zinc-500">{alt}</p>}
    </div>
  );
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const yapilandirma = ayarlar();
  if (!yapilandirma) {
    return (
      <main className="mx-auto max-w-lg p-6 text-sm text-zinc-300">
        <h1 className="mb-2 text-lg font-medium text-zinc-100">Panel yapılandırılmamış</h1>
        <p>
          <code className="text-zinc-400">ADMIN_PAROLA</code> ve <code className="text-zinc-400">ADMIN_GIZLI</code> tanımlı
          değil. Yerelde <code className="text-zinc-400">web/.env.local</code>, canlıda Vercel ortam değişkenlerine ekle.
        </p>
      </main>
    );
  }

  const cerez = await cookies();
  if (!jetonGecerli(cerez.get(CEREZ_ADI)?.value, yapilandirma.gizli)) {
    return <Giris hata={(await searchParams).hata === "1"} />;
  }

  const dersler = await dersleriOku();
  const [sesli, veri] = await Promise.all([sesliOku(), kullanimOku()]);
  const sesliKume = new Set(sesli?.dersler ?? []);
  const dosyaAdi = (id: string) => id.replace(/\./g, "-");
  const eksik = dersler.filter((d) => !sesliKume.has(dosyaAdi(d.id)));
  const hazir = dersler.length - eksik.length;

  const alanlar = new Map<string, { toplam: number; sesli: number }>();
  for (const ders of dersler) {
    const alan = alanlar.get(ders.area) ?? { toplam: 0, sesli: 0 };
    alan.toplam += 1;
    if (sesliKume.has(dosyaAdi(ders.id))) alan.sesli += 1;
    alanlar.set(ders.area, alan);
  }

  const baslik = new Map(dersler.map((d) => [d.id, d.title]));

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-zinc-100">Yönetim paneli</h1>
        <form action="/api/admin/cikis" method="post">
          <button type="submit" className="text-xs text-zinc-400 underline">
            Çıkış
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kutu baslik="Ders" deger={String(dersler.length)} />
        <Kutu
          baslik="Sesli yayında"
          deger={sesli ? String(hazir) : "—"}
          alt={sesli ? `%${Math.round((hazir / Math.max(dersler.length, 1)) * 100)}` : "liste okunamadı"}
        />
        <Kutu baslik="Kullanıcı" deger={veri ? String(veri.kullanici) : "—"} alt={veri ? undefined : "Supabase okunamadı"} />
        <Kutu baslik="Çözülen ders" deger={veri ? String(veri.kayit) : "—"} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-200">Alanlar</h2>
        <div className="overflow-x-auto rounded border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="p-2">Alan</th>
                <th className="p-2">Ders</th>
                <th className="p-2">Sesli</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {[...alanlar.entries()]
                .sort((a, b) => a[0].localeCompare(b[0], "tr"))
                .map(([ad, alan]) => (
                  <tr key={ad} className="border-t border-zinc-800">
                    <td className="p-2">{ad}</td>
                    <td className="p-2">{alan.toplam}</td>
                    <td className="p-2">
                      {alan.sesli}
                      {alan.sesli < alan.toplam && (
                        <span className="ml-2 text-xs text-amber-500">{alan.toplam - alan.sesli} eksik</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {sesli && eksik.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-200">
            Sesli sürümü bekleyen dersler ({eksik.length})
          </h2>
          <p className="mb-2 text-xs text-zinc-500">Bu derslerde şu an eski sessiz video oynuyor.</p>
          <ul className="columns-1 gap-4 text-xs text-zinc-400 sm:columns-2">
            {eksik.map((ders) => (
              <li key={ders.id} className="break-inside-avoid py-0.5">
                {ders.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {veri && veri.enCok.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-200">En çok çözülen dersler</h2>
          <ol className="space-y-1 text-sm text-zinc-300">
            {veri.enCok.map(([id, sayi]) => (
              <li key={id} className="flex justify-between gap-4 border-b border-zinc-900 py-1">
                <span>{baslik.get(id) ?? id}</span>
                <span className="text-zinc-500">{sayi}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
