// Yeniden kullanılan katmanlar. Her sahne beş katman yığar:
// zemin dokusu -> içerik -> tipografi -> renk grade -> grain + vignette.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

/** Düz renk zemin yasak: iki yumuşak ışık odağı yavaşça nefes alır. */
export const Zemin: React.FC = () => {
  const kare = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nefes = Math.sin((kare / fps) * 0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.renk.zemin }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 50% at ${28 + nefes * 2}% ${30 + nefes * 3}%, ${theme.renk.zeminUst} 0%, transparent 70%),
                       radial-gradient(50% 45% at ${78 - nefes * 2}% ${72 - nefes * 2}%, #1b1b20 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Renk grade: içeriğin üstünde, grain'in altında. */
export const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 35%, rgba(10,10,15,0.35) 100%)",
      mixBlendMode: "soft-light",
      pointerEvents: "none",
    }}
  />
);

/** Grain + vignette: her zaman en üstte. */
export const Doku: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        opacity: 0.055,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
    <AbsoluteFill
      style={{ background: "radial-gradient(72% 62% at 50% 46%, transparent 55%, rgba(0,0,0,0.62) 100%)" }}
    />
  </AbsoluteFill>
);

/**
 * Giriş: opaklık + kayma + ölçek birlikte. Tek başına fade yasak.
 * `cikisKare` verilirse öğe girişten hızlı biçimde çıkar.
 */
export const Gir: React.FC<{
  gecikme?: number;
  cikisKare?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ gecikme = 0, cikisKare, children, style }) => {
  const kare = useCurrentFrame();
  const { fps } = useVideoConfig();

  const g = spring({ frame: kare - gecikme, fps, config: theme.yay });
  const cikis = cikisKare
    ? interpolate(kare, [cikisKare, cikisKare + theme.ritim.cikisKare], [1, 0], {
        easing: theme.egri.cikis,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        opacity: g * cikis,
        transform: `translateY(${(1 - g) * 26}px) scale(${0.965 + g * 0.035})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Uzun metni sözcük sözcük açar; okuma hızına yakın bir ritimle. */
export const Sozcukler: React.FC<{ metin: string; gecikme?: number; style?: React.CSSProperties }> = ({
  metin,
  gecikme = 0,
  style,
}) => {
  const kare = useCurrentFrame();

  return (
    <p style={{ margin: 0, ...style }}>
      {metin.split(" ").map((s, n) => {
        const a = interpolate(kare, [gecikme + n * 1.6, gecikme + n * 1.6 + 12], [0, 1], {
          easing: theme.egri.giris,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`${s}-${n}`}
            style={{ display: "inline-block", opacity: a, transform: `translateY(${(1 - a) * 8}px)` }}
          >
            {s}&nbsp;
          </span>
        );
      })}
    </p>
  );
};
