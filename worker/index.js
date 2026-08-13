// R2 kovasini workers.dev uzerinden yayinlar.
// Neden: pub-*.r2.dev Turkiye'de SNI seviyesinde kesiliyor (TT landpage yonlendirmesi),
// workers.dev kesilmiyor. Alan adi satin almadan tek yol bu.
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Yalnizca GET/HEAD", { status: 405 });
    }
    const anahtar = decodeURIComponent(new URL(request.url).pathname.slice(1));
    if (!anahtar.startsWith("videos/") || anahtar.includes("..")) {
      return new Response("Bulunamadi", { status: 404 });
    }

    // range: video oynaticinin ileri sarabilmesi icin sart. Range basligi yoksa
    // gecilmez - yoksa R2 bos bir aralik dondurup tam istege 206 verdiriyor.
    const secenek = { onlyIf: request.headers };
    if (request.headers.has("range")) secenek.range = request.headers;
    const nesne = await env.VIDEOLAR.get(anahtar, secenek);
    if (!nesne) return new Response("Bulunamadi", { status: 404 });

    const basliklar = new Headers();
    nesne.writeHttpMetadata(basliklar);
    basliklar.set("etag", nesne.httpEtag);
    basliklar.set("accept-ranges", "bytes");
    basliklar.set("cache-control", "public, max-age=31536000, immutable");
    basliklar.set("access-control-allow-origin", "*");

    if (!("body" in nesne)) return new Response(null, { status: 304, headers: basliklar });

    // R2 istenmese de range alanini dolduruyor; olcut istegin kendisi olmali.
    const kismi = request.headers.has("range") && nesne.range && "offset" in nesne.range;
    if (kismi) {
      const bas = nesne.range.offset;
      const son = bas + nesne.range.length - 1;
      basliklar.set("content-range", `bytes ${bas}-${son}/${nesne.size}`);
    }
    return new Response(request.method === "HEAD" ? null : nesne.body, {
      status: kismi ? 206 : 200,
      headers: basliklar,
    });
  },
};
