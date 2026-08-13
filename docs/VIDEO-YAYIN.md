# Videoları yayına alma (Cloudflare R2)

164 ders videosu `web/public/videos/` altında, toplam **2,3 GB**. Repoda değiller
(`.gitignore`), bu yüzden Vercel'e de gitmiyorlar ve sitede video oynatıcı çıkmıyor.

Çözüm: dosyaları R2'ye yükle, `NEXT_PUBLIC_VIDEO_BASE` ile adresi ver. R2'de
10 GB depolama ücretsiz ve **çıkış trafiği ücretsiz** — video için tek makul
ücretsiz seçenek bu.

## 1. R2 kovası aç

1. dash.cloudflare.com → R2 → *Create bucket* → ad: `araba-videolar`
2. Kova → *Settings* → **Public Development URL** → *Enable*.
   Sana `https://pub-xxxxxxxx.r2.dev` biçiminde bir adres verir. Bunu not al.
3. R2 ana sayfa → *Manage API tokens* → *Create API token* →
   izin **Object Read & Write**, sadece bu kova. Çıkan üç değeri kopyala:
   Access Key ID, Secret Access Key ve hesap kimliğini içeren S3 endpoint'i.

## 2. rclone kur

```powershell
winget install Rclone.Rclone
```

## 3. Yükle

`web/.env.local` içine (repoya girmez):

```
R2_ENDPOINT=https://<hesap-kimligi>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=araba-videolar
```

Sonra:

```bash
node scripts/upload-videos.mjs
```

Kesilirse aynı komutu tekrar çalıştır — rclone yüklenmiş dosyaları atlar.
2,3 GB, bağlantına göre 20–90 dakika.

## 4. Worker ile yayinla (r2.dev Turkiye'de kesiliyor)

`pub-*.r2.dev` adresi Turk Telekom aginda SNI seviyesinde kesiliyor: HTTPS el
sikismasi bozuluyor, HTTP `88.255.216.16/landpage` adresine yonlendiriyor. Ayni
anda example.com ve vercel.com sorunsuz aciliyor, DNS de temiz - yani engel
`r2.dev` adina ozel. Hedef kitle Turkiye'deki ciraklar oldugu icin bu adres
kullanilamaz.

Cozum: kovayi bir Worker'in arkasina koymak. `workers.dev` kesilmiyor.

```bash
cd worker
npx wrangler login      # tarayicida Allow
npx wrangler deploy
```

Worker kovayi baglama ile okur (`VIDEOLAR`), token gerekmez, R2 cikisi ucretsiz
kalir. Range istegini destekler - onsuz videoda ileri sarma calismaz.
Yayindaki adres: https://araba-videolar.uzaygokcek.workers.dev

Hesapta workers.dev alt adi yoksa bir kereye mahsus kaydedilir; panel sayfasi
404 verirse API ile:

```
PUT https://api.cloudflare.com/client/v4/accounts/<hesap>/workers/subdomain
{"subdomain":"<ad>"}
```

Alt ad yeni kaydedildiyse sertifika uretilene kadar birkac dakika TLS hatasi
verebilir; beklemek yeterli.

## 5. Vercel'e adresi ver

Project → Settings → Environment Variables → `NEXT_PUBLIC_VIDEO_BASE` =
2. adımdaki `https://pub-xxxxxxxx.r2.dev` (sonunda eğik çizgi yok) →
Production+Preview+Development → Save → Deployments → son deployment → Redeploy.

Uygulama videoyu `${NEXT_PUBLIC_VIDEO_BASE}/videos/<ders-id>.mp4` adresinden ister,
yani R2'de dosyalar `videos/` klasörü altında durur — yükleme scripti bunu zaten
böyle yapıyor.

## Doğrulama

```bash
curl -I https://araba-videolar.uzaygokcek.workers.dev/videos/motor-buji-degisimi.mp4
```

`HTTP/2 200` ve `content-type: video/mp4` dönmeli. Sitede herhangi bir dersi aç;
oynatıcı görünüyorsa tamam. `onError` ile gizlendiği için, oynatıcı hiç
görünmüyorsa adres yanlıştır.
