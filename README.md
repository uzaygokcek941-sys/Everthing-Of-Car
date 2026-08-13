# Everything For My Car

Oto tamir egitim uygulamasi. Yapay zekanin yapamadigi meslekleri uygulamalarla
ogretme fikrinin ilk urunu. 6 alan, 164 ders; her ders 3B arac modeli uzerinde
adim adim ilerliyor, sonunda test var.

## Alanlar

| Alan | Ders |
|---|---|
| motor-mekanik | 28 |
| direksiyon | 27 |
| lastik-tekerlek | 25 |
| arac-elektrik | 24 |
| aksesuar-ses | 31 |
| kaporta | 29 |

## Mimari

Dersler **veridir, kod degildir**. Her ders `web/public/procedures/` altinda bir
JSON dosyasi; etkilesim motoru (`web/lib/interactions.ts`) hicbir derse ozel kod
icermez. Yeni ders yazmak icin motora dokunulmaz.

Sekiz etkilesim tipi: `pull` `unscrew` `press-and-pull` `rotate` `measure`
`rotate-to-torque` `rotate-to-angle` `inspect-and-choose`.

```
web/                 Next.js 16 uygulamasi (App Router, React 19, three.js)
  app/               sayfalar ve /api/rehber
  components/        Scene, Procedure, Curriculum
  lib/interactions.ts  etkilesim motoru
  content/*.parts.json  parca manifestolari (mesh eslesmesi)
  public/procedures/    164 ders JSON'u
  public/curriculum/    6 alan mufredati
video/               Remotion projesi; videolari ders JSON'undan derler
scripts/             dogrulama ve varlik indirme
docs/                notlar, Supabase semasi
```

## Calistirma

```bash
cd web
npm install
npm run dev
```

Ortam degiskenleri opsiyoneldir; `.env.example` dosyasini `web/.env.local`
olarak kopyala. Hicbiri olmadan uygulama calisir: ilerleme localStorage'a
yazilir, AI rehber devre disi kalir.

## Vercel'e deploy

Uygulama depo kokunde degil `web/` altinda. Vercel projesinde:

**Settings -> Build and Deployment -> Root Directory -> `web`** -> Save -> Redeploy.

Bu ayar yapilmazsa her yol `404 NOT_FOUND` doner; kokte `package.json`
olmadigi icin Vercel build edecek bir sey bulamaz.

## Videolar

164 mp4 (~2.3 GB, `video/out/` ile birlikte ~4.6 GB) **repoda degildir** -
uretim ciktisi olduklari icin yok sayilir. Ders JSON'undan yeniden uretilir:

```bash
cd video
node render-all.mjs                    # hepsi
node render-all.mjs --ders=<dosya-adi>  # tek ders
```

Canliya alirken videolari dis depolamaya (ornegin Cloudflare R2) yukleyip
`NEXT_PUBLIC_VIDEO_BASE` degiskenine taban adresi ver. Degisken bossa
`/public/videos` aranir, dosya yoksa oynatici sessizce gizlenir - uygulama
video olmadan da tam calisir. Adim adim yukleme: `docs/VIDEO-YAYIN.md`
(`node scripts/upload-videos.mjs`).

## Yayin kapilari

```bash
node scripts/validate-parts.mjs
```

Dort kapiyi birden denetler ve ihlalde 1 ile cikar:

1. **Parca eslemesi** - her dersin hedefi bir parca manifestosunda tanimli mi
2. **Kaynak zorunlulugu** - kaynaksiz sayi yayina cikamaz
3. **Mufredat durusu** - `status: "yazildi"` diyen dersin dosyasi gercekten var mi
4. **Tekrar eden parca anahtari** - iki manifesto ayni anahtari sahiplenemez

## Veri durusu

**Hicbir uretici degeri uydurulmadi.** Tork, tolerans, kalinlik, sure ve
malzeme siniflari `sourceRequired` alaninda gerekcesiyle bos birakildi; bunlar
araca ozgudur ve ureticinin onarim kilavuzundan okunur. Olcum adimlari her
zaman iki senaryo okumasi verip **farki** sorar, ureticinin sinir degerini
degil.

Her derste `reviewedByMechanic: false` - **164 dersin hicbiri henuz usta
onayindan gecmedi.** Egitim materyali olarak kullanilmadan once bir usta
okumali.

## Sinirlar

Bazi isler bilincli olarak kapsam disidir ve uygulama bunu ogretir: hava
yastigi / SRS mudahalesi, immobilizer ve anahtar tanitma, arac haberlesme agina
izinsiz mudahale, sasi cekme ve govde olcum sistemiyle yapisal dogrulama, ADAS
kalibrasyonu, elektrikli araclarda yuksek gerilim. Uygulama bu islerin kendisini
degil, **sinirini ve neden sinir oldugunu** ogretir.

Gercek marka/model arac ve ticari CAD modeli kullanilmaz.
