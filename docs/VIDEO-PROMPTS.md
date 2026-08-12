# Anlatım Videoları — Seedance 2.0 prompt'ları

**Durum: ÜRETİLMEDİ.** Higgsfield hesabında 0,04 kredi var ve plan `free`; üretim
para gerektiriyor ve onay alınmadı. Aşağıdakiler hazır prompt'lardır, kredi
geldiğinde doğrudan çalıştırılır.

## Kapsam kararı — videolar neyi anlatır, neyi anlatmaz

Üretken video modeli gerçek onarım adımlarını bilmez. Cıvata sırasını, alet
seçimini, dönme yönünü ve tork sırasını **uydurur** ve görüntü inandırıcı olduğu
için yanlış olduğu anlaşılmaz. Bu, projenin baştan beri uyguladığı "kaynaksız
sayı yasak" kuralının video karşılığıdır.

İş bölümü:

| Katman | Kim taşır | Ne anlatır |
|---|---|---|
| **Teknik doğruluk** | Uygulamadaki anlatım fazı (52 dersin yazılı içeriği) | Hangi adım, neden, hangi sırayla, hangi ölçümle |
| **Oryantasyon ve motivasyon** | Bu videolar | Mesleğin havası, atölyenin dünyası, öğrencinin ne olacağı |

**Videolarda asla olmayacaklar:** belirli bir onarım adımının "böyle yapılır"
gösterimi · ekranda sayı, tork değeri, ölçü · marka, logo, plaka, model · gerçek
kişi benzerliği · elin cıvataya tam temas ettiği yakın plan (model bunu tutarsız
üretir ve yanlış teknik öğretir).

## Prompt'lar

Hepsi T2V (metinden video), tek çekim, referans varlığı kullanmaz. Süre ve
çözünürlük **yazılmadı**: aktif yüzeyin doğrulanmış limitine göre seçilecek.
Dikey 9:16 sosyal medya için, 16:9 uygulama içi için üretilir.

### 1. Açılış — "AI'ın yapamadığı iş"
> A wide shot of an empty repair bay at dawn, cold blue light through a high
> window falling across a concrete floor and an unopened tool chest. The camera
> pushes in slowly on the closed chest, holding as the room brightens. No people,
> no logos. Quiet ambient hum, a distant metal tick as the building warms.

Kullanım: uygulama açılış ekranı, ilk defa giren kullanıcı.

### 2. Motor ve Mekanik alanı girişi
> A slow orbit around a bare four-cylinder engine block on a workshop stand,
> lit by one hard overhead lamp that rakes across the machined surfaces. Dust
> drifts through the beam. The camera completes half a turn and settles on the
> cylinder deck. Metallic room tone, a faint fan in the distance.

Kullanım: Motor ve Mekanik alanına ilk girişte.

### 3. Araç Elektrik alanı girişi
> A dim workbench seen from a low angle: a multimeter's display glows, its two
> probes resting on a wiring harness. The camera drifts right, and a single
> headlight bulb beside the meter warms from dark to full brightness. Everything
> else stays in shadow. Soft electrical hum, one relay click.

Kullanım: Araç Elektrik alanına ilk girişte.

### 4. Güvenlik — aşama 0
> A pair of safety glasses and heavy gloves lying on a workbench under a hard
> work lamp. The camera tilts up from the gloves to a fire extinguisher mounted
> on the wall behind, holding on it. Cold neutral light, deep shadows. No people.
> Low room tone, no music.

Kullanım: her alanın aşama 0 girişi.

### 5. Ölçmek — alanın tezi
> Extreme close on a caliper's vernier scale under a desk lamp, the jaws closing
> on a small steel part until they stop. The camera holds still; only the scale
> moves. Warm focused light, black surroundings. A single soft metal contact
> sound, then silence.

Kullanım: ölçü aletleri aşaması ve "ustalık ölçmektir" mesajı.

### 6. Teşhis — ustalık sınavı
> A darkened engine bay lit only by a work lamp held just out of frame. The light
> sweeps slowly across cables and connectors, revealing one green corroded
> terminal, then stops on it. Camera static, the light does the work. Low hum,
> the lamp's faint buzz.

Kullanım: teşhis aşamalarının girişi.

## Üretim notları

- **Dizi değil:** bunlar bağımsız tek çekimlerdir. Süreklilik, karakter ya da
  devam kaydı gerekmez; her biri kendi başına üretilebilir.
- **Yönetmenlik kuralı** her prompt'ta uygulandı: tek görünür olay, tek gerekçeli
  kamera hareketi, tek gerekçeli ışık kaynağı, ses niyeti.
- **İnsan yok:** hem benzerlik/rıza riskini hem de modelin el-alet temasını
  tutarsız üretmesini ortadan kaldırıyor.
- Üretilen hiçbir klip **izlenip onaylanmadan** uygulamaya konmaz; model yanlış
  bir alet ya da anlamsız bir mekanik detay ürettiyse o klip elenir.
