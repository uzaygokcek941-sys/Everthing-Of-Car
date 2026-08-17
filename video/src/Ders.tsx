// Ders anlatım videosu. İçeriğin tamamı prosedür JSON'undan gelir; bu dosyada
// tek bir teknik cümle yazılmaz. Video uydurmaz, dersi derler.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Doku, Gir, Grade, Sozcukler, Zemin } from "./components";
import { theme } from "./theme";

export type Secenek = { label: string; verdict: string; correct?: boolean; explain: string };
export type Adim = {
  id: number;
  instruction: string;
  hint?: string;
  teachingNote?: string;
  interaction: { type: string; options?: Secenek[] };
};
export type Soru = { q: string; a: string; options: { verdict: string; label: string; explain: string }[] };
export type Ders = {
  id: string;
  title: string;
  area: string;
  learningGoals?: string[];
  steps: Adim[];
  assessment?: { questions: Soru[] };
};

// Root.tsx'teki Composition fps'i ile AYNI olmali; ayrilirsa ses goruntuden kayar.
const FPS = 20;
/** Konusma bitince sahne bir an daha dursun; kesik his vermesin. */
const KUYRUK = Math.round(0.87 * FPS);
const KAPAK_YEDEK = 5 * FPS;
const KAPANIS_YEDEK = 3 * FPS;

export type Ses = { dosya: string; sure: number };
export type SesKumesi = Record<string, Ses>;

/** Sure once anlatimdan, ses yoksa metin uzunlugundan. */
const sesKare = (ses?: Ses) => (ses ? Math.round(ses.sure * FPS) + KUYRUK : null);

const Anlatim: React.FC<{ ses?: Ses }> = ({ ses }) =>
  ses ? <Audio src={staticFile(ses.dosya)} /> : null;

/** Notun 600 karaktere sigan bastan kismi; gerisi uygulamada yazili okunur. */
// ses-uret.mjs'teki ozet() ile ayni kural: 600 karakterlik sinir, cumle butun.
export const ozet = (metin: string) => {
  const cumleler = metin.split(/(?<=\.)\s+/);
  let cikan = "";
  for (const c of cumleler) {
    if (cikan && (cikan + " " + c).length > 600) break;
    cikan = cikan ? cikan + " " + c : c;
  }
  return cikan;
};

const govde = (adim: Adim) => {
  const dogru = adim.interaction.options?.find((o) => o.correct);
  return { dogru, metin: dogru ? ozet(dogru.explain) : (adim.hint ?? "") };
};

/** Süre metnin uzunluğundan çıkar: okunamayan kare işe yaramaz. */
export const adimSuresi = (adim: Adim, ses?: Ses) => {
  const { metin } = govde(adim);
  const harf = adim.instruction.length + metin.length + (adim.teachingNote?.length ?? 0);
  return sesKare(ses) ?? Math.round(Math.min(560, Math.max(230, 130 + harf / 5.5)));
};

const soruGovde = (soru: Soru) => soru.options.find((o) => o.verdict === soru.a);

export const soruSuresi = (soru: Soru, ses?: Ses) => {
  const dogru = soruGovde(soru);
  const harf = soru.q.length + (dogru?.label.length ?? 0) + ozet(dogru?.explain ?? "").length;
  return sesKare(ses) ?? Math.round(Math.min(520, Math.max(230, 130 + harf / 5.5)));
};

export const dersSuresi = (ders: Ders, ses?: SesKumesi) =>
  (sesKare(ses?.kapak) ?? KAPAK_YEDEK) +
  ders.steps.reduce((t, a, n) => t + adimSuresi(a, ses?.[`a${n + 1}`]), 0) +
  (ders.assessment?.questions ?? []).reduce((t, s, n) => t + soruSuresi(s, ses?.[`s${n + 1}`]), 0) +
  (sesKare(ses?.kapanis) ?? KAPANIS_YEDEK);

const Kapak: React.FC<{ ders: Ders; sure: number }> = ({ ders, sure }) => (
  <AbsoluteFill style={{ padding: "110px 130px", justifyContent: "center", fontFamily: theme.yazi.govde }}>
    <Gir cikisKare={sure - theme.ritim.cikisKare}>
      <p style={{ margin: 0, color: theme.renk.vurgu, fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
        {ders.area === "arac-elektrik" ? "Araç Elektrik ve Elektronik" : "Motor ve Mekanik"}
      </p>
    </Gir>
    <Gir gecikme={theme.ritim.kademe * 2} cikisKare={sure - theme.ritim.cikisKare}>
      <h1
        style={{
          margin: "18px 0 0",
          color: theme.renk.metin,
          fontFamily: theme.yazi.baslik,
          fontSize: 78,
          lineHeight: 1.08,
          maxWidth: 1360,
        }}
      >
        {ders.title}
      </h1>
    </Gir>
    <div style={{ marginTop: 46 }}>
      {(ders.learningGoals ?? []).map((h, n) => (
        <Gir key={h} gecikme={26 + n * theme.ritim.kademe * 2} cikisKare={sure - theme.ritim.cikisKare}>
          <p
            style={{
              margin: "0 0 14px",
              color: theme.renk.ikincil,
              fontSize: 30,
              maxWidth: 1300,
              borderLeft: `3px solid ${theme.renk.cizgi}`,
              paddingLeft: 20,
            }}
          >
            {h}
          </p>
        </Gir>
      ))}
    </div>
  </AbsoluteFill>
);

const AdimSahne: React.FC<{ adim: Adim; sira: number; toplam: number; sure: number }> = ({
  adim,
  sira,
  toplam,
  sure,
}) => {
  const kare = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { dogru, metin } = govde(adim);
  const cikis = sure - theme.ritim.cikisKare;

  // İlerleme çubuğu: ekranda duran her öğe hareket etmeli.
  const ilerleme = interpolate(kare, [0, sure], [0, 1], { extrapolateRight: "clamp" });
  const nefes = 1 + Math.sin((kare / fps) * 1.1) * 0.004;

  return (
    <AbsoluteFill style={{ padding: "100px 130px", justifyContent: "center", fontFamily: theme.yazi.govde }}>
      <Gir cikisKare={cikis}>
        <p style={{ margin: 0, color: theme.renk.soluk, fontSize: 24, letterSpacing: 5, textTransform: "uppercase" }}>
          Adım {sira} / {toplam}
        </p>
      </Gir>

      <Gir gecikme={theme.ritim.kademe} cikisKare={cikis}>
        <p
          style={{
            margin: "16px 0 0",
            color: theme.renk.metin,
            fontFamily: theme.yazi.baslik,
            fontSize: 48,
            lineHeight: 1.22,
            maxWidth: 1400,
            transform: `scale(${nefes})`,
            transformOrigin: "left center",
          }}
        >
          {adim.instruction}
        </p>
      </Gir>

      {dogru && (
        <Gir gecikme={theme.ritim.kademe * 3} cikisKare={cikis}>
          <p style={{ margin: "36px 0 0", color: theme.renk.dogru, fontSize: 34, lineHeight: 1.3, maxWidth: 1400 }}>
            {dogru.label}
          </p>
        </Gir>
      )}

      {metin && (
        <Sozcukler
          metin={metin}
          gecikme={theme.ritim.kademe * 5}
          style={{ marginTop: 24, color: theme.renk.ikincil, fontSize: 30, lineHeight: 1.5, maxWidth: 1420 }}
        />
      )}

      {adim.teachingNote && (
        <Gir gecikme={Math.round(sure * 0.42)} cikisKare={cikis}>
          <p
            style={{
              margin: "40px 0 0",
              color: theme.renk.soluk,
              fontSize: 27,
              fontStyle: "italic",
              lineHeight: 1.45,
              maxWidth: 1380,
              borderLeft: `3px solid ${theme.renk.vurgu}`,
              paddingLeft: 22,
            }}
          >
            {adim.teachingNote}
          </p>
        </Gir>
      )}

      <div style={{ position: "absolute", left: 130, right: 130, bottom: 74, height: 2, background: theme.renk.cizgi }}>
        <div style={{ height: "100%", width: `${ilerleme * 100}%`, background: theme.renk.soluk }} />
      </div>
    </AbsoluteFill>
  );
};

/** Bitiş testinin sorusu ve doğru cevabın gerekçesi. Metin yine JSON'dan gelir. */
const SoruSahne: React.FC<{ soru: Soru; sira: number; toplam: number; sure: number }> = ({
  soru,
  sira,
  toplam,
  sure,
}) => {
  const kare = useCurrentFrame();
  const dogru = soruGovde(soru);
  const cikis = sure - theme.ritim.cikisKare;
  const ilerleme = interpolate(kare, [0, sure], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ padding: "100px 130px", justifyContent: "center", fontFamily: theme.yazi.govde }}>
      <Gir cikisKare={cikis}>
        <p style={{ margin: 0, color: theme.renk.vurgu, fontSize: 24, letterSpacing: 5, textTransform: "uppercase" }}>
          Bitiş sorusu {sira} / {toplam}
        </p>
      </Gir>

      <Gir gecikme={theme.ritim.kademe} cikisKare={cikis}>
        <p
          style={{
            margin: "16px 0 0",
            color: theme.renk.metin,
            fontFamily: theme.yazi.baslik,
            fontSize: 52,
            lineHeight: 1.2,
            maxWidth: 1400,
          }}
        >
          {soru.q}
        </p>
      </Gir>

      {dogru && (
        <>
          <Gir gecikme={theme.ritim.kademe * 4} cikisKare={cikis}>
            <p style={{ margin: "38px 0 0", color: theme.renk.dogru, fontSize: 34, lineHeight: 1.3, maxWidth: 1400 }}>
              {dogru.label}
            </p>
          </Gir>
          <Sozcukler
            metin={ozet(dogru.explain)}
            gecikme={theme.ritim.kademe * 6}
            style={{ marginTop: 24, color: theme.renk.ikincil, fontSize: 30, lineHeight: 1.5, maxWidth: 1420 }}
          />
        </>
      )}

      <div style={{ position: "absolute", left: 130, right: 130, bottom: 74, height: 2, background: theme.renk.cizgi }}>
        <div style={{ height: "100%", width: `${ilerleme * 100}%`, background: theme.renk.vurgu }} />
      </div>
    </AbsoluteFill>
  );
};

const Kapanis: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: theme.yazi.baslik }}>
    <Gir>
      <p style={{ margin: 0, color: theme.renk.metin, fontSize: 62 }}>Şimdi uygula</p>
    </Gir>
    <Gir gecikme={theme.ritim.kademe * 3}>
      <p style={{ margin: "18px 0 0", color: theme.renk.soluk, fontSize: 28, fontFamily: theme.yazi.govde }}>
        Anlatım bitti. Aynı adımları kendin yapacaksın.
      </p>
    </Gir>
  </AbsoluteFill>
);

export const DersVideo: React.FC<{ ders: Ders; ses?: SesKumesi }> = ({ ders, ses }) => {
  const kapakSure = sesKare(ses?.kapak) ?? KAPAK_YEDEK;
  const kapanisSure = sesKare(ses?.kapanis) ?? KAPANIS_YEDEK;
  let imlec = kapakSure;

  return (
    // Tuval 960x540; tasarim 1920x1080 olcusunde yazildi. 0.5 ikili tabanda tam. --scale kullanmak
    // yuksekligi 720.0000000000001 yapip Remotion'a "tam sayi degil" dedirtti;
    // CSS olcegi bu kisitin disinda ve tuval boyutu tam sayi kaliyor.
    <AbsoluteFill style={{ width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "top left" }}>
      <Zemin />

      <Sequence durationInFrames={kapakSure}>
        <Anlatim ses={ses?.kapak} />
        <Kapak ders={ders} sure={kapakSure} />
      </Sequence>

      {ders.steps.map((adim, n) => {
        const sure = adimSuresi(adim, ses?.[`a${n + 1}`]);
        const bas = imlec;
        imlec += sure;
        return (
          <Sequence key={adim.id} from={bas} durationInFrames={sure}>
            <Anlatim ses={ses?.[`a${n + 1}`]} />
            <AdimSahne adim={adim} sira={n + 1} toplam={ders.steps.length} sure={sure} />
          </Sequence>
        );
      })}

      {(ders.assessment?.questions ?? []).map((soru, n, hepsi) => {
        const sure = soruSuresi(soru, ses?.[`s${n + 1}`]);
        const bas = imlec;
        imlec += sure;
        return (
          <Sequence key={soru.q} from={bas} durationInFrames={sure}>
            <Anlatim ses={ses?.[`s${n + 1}`]} />
            <SoruSahne soru={soru} sira={n + 1} toplam={hepsi.length} sure={sure} />
          </Sequence>
        );
      })}

      <Sequence from={imlec} durationInFrames={kapanisSure}>
        <Anlatim ses={ses?.kapanis} />
        <Kapanis />
      </Sequence>

      <Grade />
      <Doku />
    </AbsoluteFill>
  );
};
