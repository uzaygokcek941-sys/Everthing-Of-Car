import { ayarlar, jetonUret, parolaDogru } from "@/lib/admin";

export const runtime = "nodejs";

// Response.redirect() donen yanitin basliklari degistirilemez; cerez
// eklenebilmesi icin yanit elle kuruluyor.
function yonlendir(hedef: URL, cerez?: string): Response {
  const basliklar = new Headers({ Location: hedef.toString() });
  if (cerez) basliklar.append("Set-Cookie", cerez);
  return new Response(null, { status: 303, headers: basliklar });
}

export async function POST(req: Request) {
  const yapilandirma = ayarlar();
  if (!yapilandirma) {
    return Response.json(
      { hata: "ADMIN_PAROLA ve ADMIN_GIZLI tanımlı değil. web/.env.local içine ekle ve sunucuyu yeniden başlat." },
      { status: 500 },
    );
  }

  const govde = await req.formData().catch(() => null);
  if (!parolaDogru(String(govde?.get("parola") ?? ""), yapilandirma.parola)) {
    return yonlendir(new URL("/admin?hata=1", req.url));
  }

  const jeton = jetonUret(yapilandirma.gizli);
  // Secure yalnizca https'te: http://localhost uzerinde tarayici Secure cerezi
  // hic gondermez, yerelde panele girilemezdi.
  const guvenli = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return yonlendir(
    new URL("/admin", req.url),
    `${jeton.ad}=${jeton.deger}; Path=/; Max-Age=${jeton.sure}; HttpOnly; SameSite=Lax${guvenli}`,
  );
}
