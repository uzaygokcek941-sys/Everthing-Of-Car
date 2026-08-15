"use client";

import { useCallback, useEffect, useState } from "react";
import ProcedureRunner from "./Procedure";

/** Alan dosyaları public/curriculum altındadır. Yeni alan eklemek buraya bir satırdır. */
const AREAS = [
  { file: "motor-mekanik", label: "Motor ve Mekanik" },
  { file: "arac-elektrik", label: "Araç Elektrik" },
  { file: "lastik-tekerlek", label: "Lastik ve Tekerlek" },
  { file: "direksiyon", label: "Direksiyon" },
  { file: "aksesuar-ses", label: "Aksesuar ve Ses Sistemleri" },
  { file: "kaporta", label: "Kaporta ve Boya" },
];
const DONE_KEY = "efmc.done";

type Proc = { id: string; title: string; status: string };
type Stage = { no: number; title: string; why: string; gate: string; ustalikIsareti: string; procedures: Proc[] };
// ustalikTanimi bazi alan dosyalarinda tek metin, bazilarinda satir dizisi.
// Ikisi de icerik acisindan gecerli; bilesen ikisini de kabul eder.
type Area = { title: string; goal: string; ustalikTanimi: string[] | string; stages: Stage[] };
type Done = Record<string, { score: number; at: string }>;

/** Prosedür kimliği dosya adına birebir çevrilir: motor.buji-degisimi -> motor-buji-degisimi.json */
const fileFor = (id: string) => `/procedures/${id.replace(/\./g, "-")}.json`;

const writtenIn = (s: Stage) => s.procedures.filter((p) => p.status === "yazildi");
const stageComplete = (s: Stage, done: Done) => writtenIn(s).every((p) => done[p.id]);

export default function Curriculum() {
  const [area, setArea] = useState<Area | null>(null);
  const [file, setFile] = useState(AREAS[0].file);
  const [done, setDone] = useState<Done>({});
  const [active, setActive] = useState<string>();

  const reload = useCallback(() => {
    setDone(JSON.parse(localStorage.getItem(DONE_KEY) ?? "{}"));
  }, []);

  useEffect(() => {
    setArea(null);
    fetch(`/curriculum/${file}.json`)
      .then((r) => r.json())
      .then(setArea);
    reload();
  }, [file, reload]);

  if (active) {
    return (
      <ProcedureRunner
        src={fileFor(active)}
        onFinish={() => {
          reload();
          setActive(undefined);
        }}
      />
    );
  }

  const tabs = (
    <div className="flex gap-2">
      {AREAS.map((a) => (
        <button
          key={a.file}
          onClick={() => setFile(a.file)}
          className={`rounded border px-3 py-1 text-xs ${
            a.file === file ? "border-amber-400 text-amber-300" : "border-zinc-700 text-zinc-400"
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );

  if (!area)
    return (
      <div className="space-y-3 p-4">
        {tabs}
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-5 sm:p-8">
      {tabs}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{area.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{area.goal}</p>
      </div>

      {area.stages.map((stage, i) => {
        // Önceki aşamaların yazılmış prosedürleri bitmeden bu aşama açılmaz.
        // Henüz içeriği olmayan aşamalar kimseyi engellemez.
        const unlocked = area.stages.slice(0, i).every((s) => stageComplete(s, done));
        const written = writtenIn(stage);

        return (
          <section key={stage.no} className={unlocked ? "" : "opacity-50"}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm text-amber-500/70">{stage.no}</span>
              <h2 className="text-lg font-semibold text-zinc-100">{stage.title}</h2>
              {!unlocked && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-500">kilitli</span>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">{stage.why}</p>

            <ul className="mt-4 space-y-2">
              {stage.procedures.map((p) => {
                const playable = p.status === "yazildi" && unlocked;
                const result = done[p.id];
                return (
                  <li key={p.id}>
                    <button
                      disabled={!playable}
                      onClick={() => setActive(p.id)}
                      className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3.5 text-left text-[15px] transition ${
                        playable
                          ? "border-zinc-700 bg-zinc-900/40 text-zinc-100 hover:border-amber-400/70 hover:bg-zinc-900"
                          : "border-zinc-800/70 text-zinc-600"
                      }`}
                    >
                      <span>{p.title}</span>
                      <span className={`shrink-0 text-xs ${playable ? "text-amber-400" : "text-zinc-600"}`}>
                        {result ? `${result.score} puan` : p.status === "yazildi" ? "başla" : "yazılmadı"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {written.length > 0 && (
              <p className="mt-3 border-l-2 border-zinc-800 pl-3 text-sm italic leading-relaxed text-zinc-500">
                Usta işareti: {stage.ustalikIsareti}
              </p>
            )}
          </section>
        );
      })}

      <div className="space-y-2 border-t border-zinc-800 pt-6 text-sm leading-relaxed text-zinc-500">
        {(Array.isArray(area.ustalikTanimi) ? area.ustalikTanimi : [area.ustalikTanimi]).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
