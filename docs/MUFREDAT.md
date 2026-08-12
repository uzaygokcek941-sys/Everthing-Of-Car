# Müfredat Dayanağı

Uygulamanın öğrettiği şeyin resmî karşılığı. Kaynaklar 2026-08-10'da çekildi.
Amaç: "biz uydurduk" değil, "ulusal programın şu birimini şu prosedürle veriyoruz" diyebilmek.

---

## 1. MYK — Ulusal Yeterlilik 11UY0021-4, Otomotiv Mekanikçisi Seviye 4

Belgelendirmenin ölçtüğü şey. Bir öğrencinin sonunda alabileceği gerçek belge bu.

| Birim | Ad | Durum | Sınav |
|---|---|---|---|
| A1 | İş Sağlığı ve Güvenliği, Çevre ve Kalite | **Zorunlu** | Teorik: 25 soru / 38 dk / 60 puan |
| B1 | Araç Üzerinde Periyodik Bakım, Arıza Tespit ve Onarım İşlemleri | Seçmeli | Teorik: 40 soru / 60 dk / 60 puan · **Performans: 210 dk / 80 puan, kritik adımlar başarılı olmak zorunda** |

Meslek tanımı: motorlu kara taşıtlarının şasi, şanzıman ve aktarma organlarında, motorda ve
motorun elektrik/elektronik sisteminde periyodik bakım, arıza tespiti ve onarım yapan kişi.

**Bizim için en önemli satır:** B1 performans sınavında *kritik adımlarda hata affedilmiyor*.
Uygulamadaki `passRequires` mantığı (bir madde düştüyse geçemezsin) uydurma bir oyun kuralı
değil, sınavın kendi mantığı. Puanlama bu yüzden yumuşatılmamalı.

Kaynak: [MEYBEM — 11UY0021-4 birim ve sınav yapısı](https://meybem.org.tr/personel-belgelendirme/11uy0021-4-otomotiv-mekanikcisi-seviye-4/) ·
[MYK Portal — yeterlilik PDF](https://portal.myk.gov.tr/index.php?dl=Yeterlilik/1606/SON_TASLAK_PDF_20180925_143240.pdf&fileName=11UY0021-4+Rev+02+Otomotiv+Mekanik%C3%A7isi&option=com_yeterlilik)

> B2, B4, B6 birimlerinin adları doğrulanamadı — MYK ve TYÇ sunucuları bu makineden
> sertifika hatasıyla açılmıyor. Tamamlanması gereken tek boşluk bu.

---

## 2. MEB — Motorlu Araçlar Teknolojisi Alanı, Çerçeve Öğretim Programı

Meslek lisesinin ne öğrettiği. Sıralama bizim planımızla birebir örtüşüyor.

**9. sınıf, Araç Teknolojisi Atölyesi (haftada 9 saat)** — öğrenme birimleri, programdaki sırasıyla:

1. **İş Sağlığı ve Güvenliği** — çalışma alanı, yangın, acil durum, çevre, KKD
2. **Temel Servis Ekipmanları** — anahtar takımları · mesleğe özel el takımları · kaldırma ve sehpalama · ölçü aletleriyle ölçme ve kontrol
3. **Temel Mekanik İşlemler** — kesme, eğeleme, markalama, taşlama, bileme, delme, kılavuzla diş açma, paftayla diş açma, perçinleme, **cıvataları söker ve takar**
4. **Motor Terimleri ve Motoru Senteye Getirme**
5. **Sabit Motor Parçaları** — takoz, manifolt, silindir kapağı, silindir bloğu
6. **Supap Sistemleri** — kam mili, zaman ayar mekanizması
7. **Motor Donanımları** — soğutma, yağlama
8. **Piston-Biyel Krank Mekanizması** — piston-biyel, krank, keçe ve yataklar, volan
9. **Araçlarda Temel Elektrik İşlemleri** — gerilim/akım/direnç ölçme, seri-paralel devre
10. **Araçlarda Temel Elektronik İşlemleri**
11. **Otomotiv Aküleri** — kontrol, değişim, şarj

**Doğrulanan iki şey:**
- Program **güvenlikle** başlıyor, sonra **alet takımları**, sonra cıvata sökme-takma, *ondan sonra* motora giriyor. Bizim "önce alet takımlarını öğret, sonra çırağa anlatır gibi ilerle" sıramız ulusal programın sırası.
- 3. birimdeki "cıvataları söker ve takar" kazanımı, uygulamadaki `unscrew` ve `rotate-to-torque` etkileşimlerinin doğrudan karşılığı.

Kaynak: [MEB — Motorlu Araçlar Teknolojisi Çerçeve Öğretim Programı (12. sınıf dosyası, 9-11. sınıf kazanımlarını da içerir)](https://meslek.meb.gov.tr/upload/cop12/motorluarac_12.pdf) ·
[MEB MAOL — alan çerçevesi](https://maol.meb.gov.tr/web/mem/alanlar/motorlu_araclar/motorlu_araclar_teknolojisi_cerceve.pdf) ·
[MEB — çıraklık/kalfalık programı](https://maol.meb.gov.tr/web/ciraklikegitimi/Kalfalik_Meslek/Motorlu_araclar_teknolojisi/Motorlu_araclar_teknolojisi_cerceve.pdf)

Alanın dalları: Otomotiv Elektromekanik · İş Makineleri · Otomotiv Gövde · Otomotiv Boya ·
Otomotiv Mekanikerliği · Otomotiv Motor Yenileştirmeciliği · Dizel Yakıt Pompası ve Enjektör
Ayarcılığı · Motorlu Araçlar LPG Sistemleri · Elektrikli Araçlar.

---

## 3. Bizim alanların resmî karşılığı

| Uygulamadaki alan | MEB dersi / öğrenme birimi | Doğrulama |
|---|---|---|
| Motor ve Mekanik | Araç Teknolojisi Atölyesi (birim 3-8) · Otomotiv Motor Yenileştirme Dersi | **Metinden doğrulandı** |
| Araç Elektrik ve Elektronik | Araç Teknolojisi Atölyesi (birim 9-11) · Otomotiv Elektromekanik Atölyesi Dersi | **Metinden doğrulandı** (temel birimler) |
| Lastik ve Tekerlek | Hareket Kontrol Sistemleri Atölyesi Dersi (11. sınıf, 10 saat/hafta) — öğrenme birimi **Ön Düzen ve Tekerlekler** · Otomotiv Test Teknikleri Dersi — Ön Düzen Ayarı, Balans Ayarı, yanal kayma ve süspansiyon testi · Otomotiv Periyodik Bakım Dersi — Fren Sisteminin ve Lastiklerin Periyodik Bakımı | **Metinden doğrulandı (2026-08-11)** — PDF metni çıkarılıp okundu, s. 42 ve 57 |
| Direksiyon | Hareket Kontrol Sistemleri Atölyesi Dersi — öğrenme birimi **Direksiyon Sistemleri** (5 kazanım) · Otomotiv Periyodik Bakım Dersi — **Direksiyon Sisteminin Periyodik Bakımı** (mekanik + hidrolik, 2 kazanım) · Otomotiv Test Teknikleri Dersi — "Direksiyon sistemlerinin testlerini yapar" | **Metinden doğrulandı (2026-08-12)** — PDF yeniden indirilip metne çevrildi, s. 42 ve 62 |
| Aksesuar ve ses sistemleri | Otomotiv Konfor Sistemleri Dersi | Yalnız ders adından çıkarıldı, içerik okunmadı |
| Araçlar hakkında her şey | Motor Terimleri · Otomotiv Periyodik Bakım Dersi · Otomotiv Test Teknikleri Dersi | Yalnız ders adından çıkarıldı, içerik okunmadı |

Alt dört satır **iddia değil hipotez**. İlgili ders bölümleri PDF'ten okunmadan alan yapısı
kesinleştirilmemeli.

---

## 4. Bundan çıkan iş sırası

Mevcut tek prosedür (`motor.buji-degisimi`) 5. birime denk düşüyor — yani programın
ortasından başlamışız. Eksik olan, öncesindeki birimler:

1. **`temel.el-aletleri`** — anahtar takımları, mesleğe özel el takımları, ölçü aletleri.
   Prosedür dosyasında zaten `prerequisites` olarak yazılı ama içeriği yok.
2. **`temel.tork-anahtari`** — aynı şekilde önkoşul olarak yazılı, içeriği yok.
3. **`temel.civata-sokme-takma`** — MEB'in 3. birimi; `unscrew` etkileşimini öğreten
   ilk prosedür bu olmalı, buji değişimi değil.

Bu üçü yazıldığında uygulama, ulusal programın 9. sınıf sırasını baştan takip ediyor olur.

## 5. Bu belge neyi kanıtlamaz

Müfredat eşleşmesi *kapsam* iddiasıdır, *kalite* iddiası değil. "MEB'in şu kazanımını
karşılıyoruz" demek, verdiğimiz teknik değerlerin doğru olduğunu göstermez — onun kapısı
ayrı (`sourceRequired` künyeleri ve `reviewedByMechanic`). İkisi karıştırılmamalı.

---

## 4. Ön Düzen ve Tekerlekler — öğrenme biriminin kazanımları (birebir)

MEB çerçeve programından, Hareket Kontrol Sistemleri Atölyesi Dersi (s. 42):

1. Tekerleklerin değişimini yapar.
2. Lastik basınç kontrol sistemi(nin) değişimini yapar.
3. Tekerlek balans ayarını yapar.
4. Ön takım parçalarını kontrol edip değiştirir.
5. Ön düzen ayarlarını yapar.

Aynı birim, Elektrikli Araçlar dalında da "Tekerlekler ve Ön Düzen" adıyla ve aynı üç
kazanımla geçiyor — yani içten yanmalı ya da elektrikli, tekerlek işi değişmiyor.

Otomotiv Test Teknikleri Dersi (s. 57) bu alanı ölçme tarafından tamamlıyor: **Ön Düzen
Ayarı** ve **Balans Ayarı** ayrı öğrenme birimleri; ayrıca yanal kayma testi ve süspansiyon
testi, sonuçlarını *yorumlayarak arıza tespiti* kazanımıyla birlikte veriliyor.

**Uygulamadaki karşılığı:** `web/public/curriculum/lastik-tekerlek.json` — 10 aşama, 25 prosedür.
Aşama sırası bu kazanım sırasıdır. Fren sistemi bilinçli olarak dışarıda: MEB'de ayrı birim.
