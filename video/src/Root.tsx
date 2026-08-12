import React from "react";
import { Composition } from "remotion";
import { DersVideo, dersSuresi, type Ders } from "./Ders";
// Varsayılan ders. Diğerleri CLI'dan geçilir:
//   npx remotion render src/index.ts Ders out/x.mp4 --props=props/<ders>.json
import varsayilan from "../../web/public/procedures/elektrik-gerilim-dusumu.json";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Ders"
    component={DersVideo}
    // Süre metnin uzunluğundan hesaplanır; sabit bir sayı ölü kare bırakırdı.
    calculateMetadata={({ props }) => ({ durationInFrames: dersSuresi(props.ders) })}
    durationInFrames={1200}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ ders: varsayilan as unknown as Ders }}
  />
);
