# Everything For My Car — Sıfır Bütçe Yol Haritası

**Hedef:** AI'ın yapamayacağı mesleği 3D, animasyonlu, oyunlaştırılmış öğreten uygulama.
**İlk dilim:** Jenerik 4 silindir motor üzerinde **buji değişimi**, tarayıcıda telefondan çalışır.
**Kısıt:** 0 TL. Aşağıdaki hiçbir maddede para harcanmıyor.

---

## Harcama yapılmayan stack

| İhtiyaç | Araç | Maliyet |
|---|---|---|
| 3D motor | three.js + react-three-fiber | 0 |
| Uygulama | Next.js | 0 |
| Yayın | Vercel Hobby + `*.vercel.app` | 0 |
| Veritabanı / giriş | Supabase free tier | 0 |
| 3D düzenleme | Blender | 0 |
| Motor modeli | Sketchfab **CC-BY** sökülmüş motor (atıf şartı) | 0 |
| Gerçek parça taraması | RealityScan (ticari kullanımda dahi ücretsiz) | 0 |
| AI rehber | NVIDIA NIM `llama-3.3-70b` (anahtar mevcut) | 0 |
| Kod / analitik | GitHub + Vercel Analytics | 0 |

**Kasten ertelenenler:** alan adı, Play/App Store hesabı, ücretli 3D model, VR. Hiçbiri ilk dilim için gerekli değil.
**Tek gerçek maliyet:** senin zamanın.

---

## Faz 0 — Kurulum (Gün 1-2)

- [ ] Blender kur (bu makinede yok — doğrulandı)
- [ ] `create-next-app` + `three` + `@react-three/fiber` + `@react-three/drei`
- [ ] GitHub reposu aç, Vercel'e bağla, boş sayfa canlıya çıksın
- [ ] Supabase projesi aç (free tier), tabloları henüz kurma
- [ ] NVIDIA NIM anahtarını `.env.local`'a koy, `.gitignore` kontrolü
- [ ] **Kanıt:** canlı `*.vercel.app` linki telefonda açılıyor

## Faz 1 — Motor ekranda (Hafta 1)

- [x] ~~Sketchfab'da CC-BY model bul~~ → **modeli kodla üretiyoruz**: `scripts/build-models.mjs`. Gerekçe: indirilen model CC-BY atıf borcu (uygulamadan asla silinemez), marka riski ve Blender'da mesh yeniden adlandırma işi getirir; üretilen modelde parça adları tanım gereği doğrudur
- [x] `CREDITS.md` gerekmedi — model kendi üretimimiz, üçüncü taraf lisans yok. Dışarıdan model alınırsa bu madde geri açılır ve atıf uygulamada görünür olmalıdır
- [x] Parça isimleri prosedürlerdeki `part.*` ile eşlendi — `web/content/*.parts.json`; `node scripts/validate-parts.mjs` yeşil, 35/35 parça eşli
- [x] Dört sahne üretildi: `motor-inline4` (25 mesh), `tezgah` (14), `atolye` (8), `kabin` (2) — toplam ~96 KB, 15 MB hedefinin çok altında
- [x] Sahnede motor: döndür, yakınlaş, dokunmatik kontroller — `Scene.tsx`, OrbitControls + `touch-none`
- [x] Adımın `target`'ı mesh'e bağlandı: parça hangi modele aitse o GLB yüklenir, hedef mesh vurgulanır ve tur sayısına göre **kendi ekseninde** döner + geri çıkar. Yerel eksen şart — global Y'de çevirmek yatık cıvataları (yağ filtresi, termostat) deviriyordu; ölçüldü, eksen kayması 0 rad
- [ ] **Kanıt:** orta seviye Android telefonda 60 fps ekran kaydı ← tarayıcıda hiç açılmadı

## Faz 2 — Etkileşim motoru (Hafta 2) ← projenin kalbi

Prosedür dosyasındaki 6 etkileşim tipini **bir kez** yaz; sonraki 50 prosedür JSON yazmaya döner.

- [x] `pull` — kaput / bobin / yağ çubuğu çekme; parmakla çekilir, parça sahnede kendi ekseninde birlikte çıkar
- [x] `unscrew` — cıvata sökme (tur sayacı)
- [x] `press-and-pull` — soket tırnağı; aynı doğrusal jest, daha kısa yol
- [x] `rotate` — **parmakla çevirerek buji sökme**; `Rotary` işaretli tur sayar, sahnedeki mesh onunla birlikte döner
- [x] `measure` — sentille tırnak ölçme
- [x] `rotate-to-torque` — tork anahtarı + tolerans + aşırı sıkma cezası
- [x] `inspect-and-choose` — planda yoktu, teşhis dersleri için eklendi; prosedürlerin en çok kullandığı tip
- [x] `rotate-to-angle` — açı torku. `rotate` ile yazılamadı çünkü onun üst sınırı yok; açıda fazla çevirmek cıvatayı koparır ve bu ayrım dersin kendisi
- [x] Runner: `Procedure.tsx` JSON'u fetch edip adımları sırayla çalıştırıyor, adımlar kodda değil
- [x] Yanlış alet kontrolü — string eşleme yok, `interaction.tool` ile eldeki alet karşılaştırılır; aşırı tork ve ters yön de aynı şekilde yapısal
- [x] **Kanıt:** Motor ve Mekanik müfredatının 28 prosedürünün tamamı yazıldı; yalnız `rotate-to-angle` için `interactions.ts`'e dokunuldu, kalan 27'si sıfır motor kodu. `node --test scripts/test-interactions.mjs` 24/24
- [x] **Kanıt (ikinci alan):** Araç Elektrik ve Elektronik müfredatının 24 prosedürünün tamamı yazıldı — **24'ü de sıfır motor kodu**, `interactions.ts` hiç açılmadı. Alan için yalnız sahne üretildi (`elektrik.glb`, 30 düğüm) ve `Curriculum.tsx`'e alan seçici eklendi. Toplam 52 prosedür, iki alan tamam
- [x] **Kanıt (üçüncü alan başladı):** Lastik ve Tekerlek müfredatı MEB metninden doğrulanarak yazıldı (10 aşama, 25 prosedür); `lastik.glb` sahnesi (23 düğüm) + `lastik.parts.json` üretildi ve **25 prosedürün tamamı yazıldı (10 aşama, alan bitti)** — **yirmi beşi de sıfır motor kodu**, `interactions.ts` yine hiç açılmadı. Videoları Remotion ile alındı (77-78 sn)
- [x] **Kanıt (dördüncü alan):** Direksiyon müfredatı MEB metninden doğrulanarak yazıldı (10 aşama, 27 prosedür; kaynak s. 42 ve 62); `direksiyon.glb` sahnesi (24 düğüm) + `direksiyon.parts.json` üretildi ve **27 prosedürün tamamı yazıldı (10 aşama, alan bitti)** — **yirmi yedisi de sıfır motor kodu**, `interactions.ts` bu alanda bir kez bile açılmadı. Videoları Remotion ile alındı. **Toplam 104 prosedür / 104 video, dört alan tamam**
- [ ] Hata geri bildirimi eksiği: `commonMistake.if: "civata-kaybi"` hiçbir yapısal tetiğe bağlı değil, hiç ateşlemiyor

## Faz 3 — Prosedür + rehber (Hafta 3)

- [ ] 8 adımın tamamı uçtan uca oynanabilir
- [ ] Teşhis adımı: buji rengi → 4 şık → açıklama (ürünün asıl değeri burada)
- [ ] Hata geri bildirimleri ekranda ("diş sıyrıldı, bu artık helicoil işi")
- [ ] Bitiş testi + puan
- [x] AI rehber: **NIM ile, sadece prosedür verisine dayanarak** cevap versin (uydurma teknik değer vermesin) — anahtar `web/.env.local`'da; "kesin tork sayısı ver" denemesi *"bu prosedürde yazmıyor"* döndü, path traversal 404 verdi
- [x] **Anlatım fazı** — ders artık soru sormadan önce anlatıyor. İçerik yeni değil: doğru şıkkın gerekçesi ve `teachingNote` zaten yazılıydı ama yalnız doğru cevaptan SONRA görünüyordu, yani bilmeyen kilitleniyordu
- [x] **52 ders videosu** — Remotion ile, her video dersin kendi JSON'undan derleniyor (63,6 dk toplam, ortalama 73 sn). Üretken video modeli kullanılmadı: uydurma onarım adımı riski yapısal olarak kaldırıldı
- [x] **Şık karıştırma** — prosedür dosyalarında doğru şık daima ilk yazılmış; ekranda deterministik olarak karıştırılıyor, yoksa öğrenci bilmeden hep birinciyi seçip geçerdi
- [~] İlerleme kaydı (Supabase) — **kod hazır ve bağlı**, iki panel adımı bekliyor: (1) Authentication > Providers > **Anonymous sign-ins** açılacak, (2) `docs/supabase-migration.sql` SQL Editor'da çalıştırılacak. O ana kadar uygulama yerel depolamayla çalışmaya devam ediyor; tarayıcıda doğrulandı: *"bulut kapalı, yerelde devam"*
- [x] **Kanıt:** Playwright ile gerçek tarayıcıda gezildi ve ekran görüntüleri incelendi (`shots/`): müfredat, anlatım (video `readyState 4`, 77 sn), güvenlik, adım ekranı. Konsol hatası yok. Kalan: kasıtlı hatalı deneme kaydı

## Faz 4 — Doğrulama (Hafta 4) ← atlanırsa proje ölür

- [ ] **Gerçek usta bul**, tork ve tırnak değerlerini denetlet
- [ ] `reviewedByMechanic: true` yap, kaynağı dosyaya yaz
- [ ] Bir meslek lisesi otomotiv bölümü öğretmeni bul (Türkiye'de rakip yok — kapı açık)
- [ ] 20 öğrenciye izlet, yanlarında otur, **nerede takıldıklarını yaz**
- [ ] 3 soru sor: anlaşıldı mı / gerçek gibi mi / okulunda kullanır mısın
- [ ] **Kanıt:** 20 kişilik ham geri bildirim notu

---

## YC izi (Faz 1'den itibaren paralel yürür)

YC demoya değil **çekişe ve ekibe** yatırım yapar. Demo giriş bileti, kanıt değil.

- [ ] Faz 0'dan itibaren **her hafta** ekran kaydı al — ilerleme hızı YC'nin baktığı şey
- [ ] Bir meslek lisesinden **yazılı pilot niyeti** al (tek sayfa yeter) — en güçlü tek belge
- [ ] Sayıları topla: kaç öğrenci denedi, kaçı bitirdi, teşhis sorusunda başarı oranı
- [ ] MYK Otomotiv Mekanikçisi Seviye 4 ile bağı netleştir (resmi çerçeve = ciddiyet)
- [ ] 60 saniyelik kurucu videosu — çoğu başvuru bunu zayıf yapar, ayrışma noktası
- [ ] Tek cümlelik tanım: "[kim] için [ne] sorununu [nasıl] çözüyoruz"
- [ ] 2. kurucu arayışına erken başla (solo dezavantaj, kesin engel değil)
- [ ] Batch son tarihini takvime yaz

**Dürüst not:** YC hedefi motive edici ama planı bozmamalı. Kazandıran cümle güzel demo değil, "20 öğrenci kullandı, okul pilot istedi" cümlesidir. Faz 4 atlanırsa elde sadece güzel bir demo kalır.

---

## Kırmızı çizgiler

- **GrabCAD CAD dosyaları kullanılmaz** — "ticari olmayan" lisanslı, ihlal olur
- **Gerçek marka/model araç yok** — marka lisansı 6-7 haneli; jenerik ama teknik olarak doğru model kullan
- **Uydurma tork değeri yok** — `sourceRequired: true` alanları usta onayı olmadan yayına çıkmaz
- **CC-BY atfı silinmez** — `CREDITS.md` her yayında güncel
- **AI 3D üretimi (Meshy / TRELLIS / Hunyuan) parça çıkarmaz** — tek mesh üretirler, bu iş için ölü uç
