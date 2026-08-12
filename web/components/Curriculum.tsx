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
type Area = { title: string; goal: string; ustalikTanimi: string[]; stages: Stage[] };
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
    <div className="space-y-5 p-4">
      {tabs}
      <div>
        <h1 className="text-lg font-medium text-zinc-100">{area.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{area.goal}</p>
      </div>

      {area.stages.map((stage, i) => {
        // Önceki aşamaların yazılmış prosedürleri bitmeden bu aşama açılmaz.
        // Henüz içeriği olmayan aşamalar kimseyi engellemez.
        const unlocked = area.stages.slice(0, i).every((s) => stageComplete(s, done));
        const written = writtenIn(stage);

        return (
          <section key={stage.no} className={unlocked ? "" : "opacity-50"}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-zinc-600">{stage.no}</span>
              <h2 className="text-sm font-medium text-zinc-100">{stage.title}</h2>
              {!unlocked && <span className="text-xs text-zinc-500">kilitli</span>}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{stage.why}</p>

            <ul className="mt-2 space-y-1">
              {stage.procedures.map((p) => {
                const playable = p.status === "yazildi" && unlocked;
                const result = done[p.id];
                return (
                  <li key={p.id}>
                    <button
                      disabled={!playable}
                      onClick={() => setActive(p.id)}
                      className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm ${
                        playable
                          ? "border-zinc-700 text-zinc-200 hover:border-amber-400"
                          : "border-zinc-800 text-zinc-600"
                      }`}
                    >
                      <span>{p.title}</span>
                      <span className="ml-3 shrink-0 text-xs">
                        {result ? `${result.score} puan` : p.status === "yazildi" ? "başla" : "yazılmadı"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {written.length > 0 && (
              <p className="mt-1.5 text-xs italic text-zinc-600">Usta işareti: {stage.ustalikIsareti}</p>
            )}
          </section>
        );
      })}

      <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        {area.ustalikTanimi.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
