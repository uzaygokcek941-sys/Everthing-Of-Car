"use client";

import { useEffect, useRef, useState } from "react";
import {
  dragTarget,
  evaluate,
  grade,
  karistir,
  NM_PER_TURN,
  type Input,
  type Procedure,
  type RunEntry,
  type Step,
} from "@/lib/interactions";
import Scene from "./Scene";
import { bulutaYaz, bulutuGetir, yerelYaz } from "@/lib/ilerleme";

const ZERO: Input = { kind: "drag", amount: 0 };

/** Parmakla çevirme. Tur sayısı işaretlidir: + saat yönü, - ters. */
function Rotary({ turns, onTurn }: { turns: number; onTurn: (t: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);

  const angleAt = (x: number, y: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.atan2(y - r.top - r.height / 2, x - r.left - r.width / 2);
  };

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        last.current = angleAt(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (last.current === null) return;
        const a = angleAt(e.clientX, e.clientY);
        let d = a - last.current;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        last.current = a;
        onTurn(turns + d / (2 * Math.PI));
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
      className="relative mx-auto h-36 w-36 cursor-grab touch-none rounded-full border-4 border-zinc-600 bg-zinc-800 active:cursor-grabbing"
      style={{ transform: `rotate(${turns * 360}deg)` }}
    >
      <div className="absolute left-1/2 top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-amber-400" />
    </div>
  );
}

/** Doğrusal çekme. Parmak yukarı gittikçe parça yerinden çıkar. */
function Linear({ value, need, onDrag }: { value: number; need: number; onDrag: (v: number) => void }) {
  const start = useRef<{ y: number; v: number } | null>(null);
  const oran = Math.min(1, value / need);

  return (
    <div
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { y: e.clientY, v: value };
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        // 160 px'lik çekiş adımın gerektirdiği mesafeyi tamamlar.
        const d = ((start.current.y - e.clientY) / 160) * need;
        onDrag(Math.max(0, Math.min(need * 1.15, start.current.v + d)));
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
      className="relative mx-auto h-36 w-24 cursor-grab touch-none rounded-lg border-2 border-zinc-700 bg-zinc-800 active:cursor-grabbing"
    >
      <div
        className="absolute inset-x-2 h-8 rounded bg-amber-400/90 transition-none"
        style={{ bottom: `calc(${oran * 72}% + 0.5rem)` }}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[11px] text-zinc-500">
        yukarı çek
      </span>
    </div>
  );
}

function Control({
  step,
  input,
  setInput,
  tohum,
}: {
  step: Step;
  input: Input;
  setInput: (i: Input) => void;
  tohum: string;
}) {
  const i = step.interaction;
  const turns = input.kind === "drag" ? input.amount : 0;

  if (i.type === "inspect-and-choose") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-300">{i.question}</p>
        {karistir(
          i.options.map((o, n) => ({ o, n })),
          tohum,
        ).map(({ o, n }) => (
          <button
            key={o.verdict}
            onClick={() => setInput({ kind: "choice", index: n })}
            className={`block w-full rounded border px-3 py-2 text-left text-sm ${
              input.kind === "choice" && input.index === n
                ? "border-amber-400 bg-zinc-800 text-zinc-100"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  if (i.type === "measure") {
    const [lo, hi] = i.acceptRange;
    const v = input.kind === "value" ? input.value : lo - 0.3;
    return (
      <div>
        <p className="mb-2 text-center font-mono text-2xl text-zinc-100">
          {v.toFixed(2)} {i.unit}
        </p>
        <input
          type="range"
          min={lo - 0.4}
          max={hi + 0.4}
          step={0.05}
          value={v}
          onChange={(e) => setInput({ kind: "value", value: Number(e.target.value) })}
          className="w-full accent-amber-400"
        />
      </div>
    );
  }

  if (i.type === "rotate-to-torque") {
    return (
      <div>
        <p className="mb-2 text-center font-mono text-2xl text-zinc-100">
          {Math.max(0, turns * NM_PER_TURN).toFixed(0)} / {i.targetTorqueNm} Nm
        </p>
        <Rotary turns={turns} onTurn={(t) => setInput({ kind: "drag", amount: t })} />
      </div>
    );
  }

  if (i.type === "rotate-to-angle") {
    const deg = Math.abs(turns) * 360;
    const over = deg > i.degrees + i.toleranceDeg;
    return (
      <div>
        <p className={`mb-2 text-center font-mono text-2xl ${over ? "text-red-300" : "text-zinc-100"}`}>
          {deg.toFixed(0)}° / {i.degrees}°
        </p>
        <Rotary turns={turns} onTurn={(t) => setInput({ kind: "drag", amount: t })} />
      </div>
    );
  }

  if (i.type === "rotate" || i.type === "unscrew") {
    const need = dragTarget(i)!;
    return (
      <div>
        <p className="mb-2 text-center font-mono text-2xl text-zinc-100">
          {Math.abs(turns).toFixed(1)} / {need} tur
        </p>
        <Rotary turns={turns} onTurn={(t) => setInput({ kind: "drag", amount: t })} />
      </div>
    );
  }

  // pull / press-and-pull — parmakla çekilir, parça sahnede birlikte hareket eder.
  const need = dragTarget(i)!;
  return (
    <div>
      <p className="mb-2 text-center text-sm text-zinc-300">
        {i.type === "press-and-pull" ? "Tırnağa bas, sonra yukarı çek" : "Yukarı çek"}
        <span className="ml-2 font-mono text-zinc-500">
          {Math.round((Math.min(need, turns) / need) * 100)}%
        </span>
      </p>
      <Linear value={turns} need={need} onDrag={(v) => setInput({ kind: "drag", amount: v })} />
    </div>
  );
}

/** Rehber. Cevap sunucudan gelir ve yalnız prosedür verisine dayanır. */
function Guide({ procedureId, stepId }: { procedureId: string; stepId: number }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string>();
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setBusy(true);
    setAnswer(undefined);
    try {
      const r = await fetch("/api/rehber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, stepId, procedureId }),
      });
      const data = await r.json();
      setAnswer(data.answer ?? data.error);
    } catch (e) {
      setAnswer(`İstek başarısız: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-zinc-800 pt-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ustaya sor…"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        <button
          onClick={ask}
          disabled={busy}
          className="rounded bg-zinc-700 px-3 text-sm text-zinc-100 disabled:text-zinc-500"
        >
          {busy ? "…" : "Sor"}
        </button>
      </div>
      {answer && <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{answer}</p>}
    </div>
  );
}

type Phase = "ders" | "safety" | "steps" | "quiz" | "done";

export default function ProcedureRunner({ src, onFinish }: { src: string; onFinish: () => void }) {
  const [proc, setProc] = useState<Procedure | null>(null);
  const [phase, setPhase] = useState<Phase>("ders");
  const [checked, setChecked] = useState<number[]>([]);
  const [ders, setDers] = useState(0);
  const [video, setVideo] = useState(true);
  const [index, setIndex] = useState(0);
  const [tool, setTool] = useState<string>();
  const [input, setInput] = useState<Input>(ZERO);
  const [dirty, setDirty] = useState(false);
  const [log, setLog] = useState<RunEntry[]>([]);
  const [answers, setAnswers] = useState<(string | undefined)[]>([]);
  const [done, setDone] = useState<Record<string, { score: number; at: string }>>({});

  useEffect(() => {
    fetch(src)
      .then((r) => r.json())
      .then(setProc);
    // Yerel kayıt hemen gelir; bulut varsa üstüne senkron olur.
    bulutuGetir().then(setDone);
  }, [src]);

  if (!proc) return <p className="p-4 text-sm text-zinc-500">Yükleniyor…</p>;

  const apply = (i: Input) => {
    setInput(i);
    if (phase === "steps" && evaluate(proc.steps[index], i, tool).mistake) setDirty(true);
  };

  // Anlatım: soru sormadan önce dersi gösterir. Malzeme yeni değil — doğru şıkkın
  // açıklaması ve teachingNote zaten yazılıydı, ama yalnız doğru cevaptan SONRA
  // görünüyordu. Bilmeyen biri o yüzden kilitleniyordu; sıra burada düzeltiliyor.
  if (phase === "ders") {
    const step = proc.steps[ders];
    const i = step.interaction;
    const dogru = i.type === "inspect-and-choose" ? i.options.find((o) => o.correct) : undefined;
    const son = ders + 1 >= proc.steps.length;

    return (
      <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row">
        <div className="h-[45dvh] shrink-0 md:h-full md:flex-1">
          <Scene bench={proc.vehicleClass === "atolye-egzersizi"} interaction={i} amount={0} />
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-4 md:w-96 md:shrink-0">
          <button onClick={onFinish} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← aşamalar
          </button>

          {ders === 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-medium text-zinc-100">{proc.title}</h2>
              {/* Video Remotion ile dersin kendi JSON'undan derleniyor; henüz her ders
                  için render alınmadı, dosya yoksa oynatıcı sessizce gizlenir. */}
              {video && (
                <video
                  src={`${process.env.NEXT_PUBLIC_VIDEO_BASE ?? ""}/videos/${proc.id.replace(/\./g, "-")}.mp4`}
                  controls
                  onError={() => setVideo(false)}
                  className="w-full rounded border border-zinc-800"
                />
              )}
              {proc.learningGoals && proc.learningGoals.length > 0 && (
                <>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">Bu ders ne öğretiyor</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">
                    {proc.learningGoals.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <p className="text-xs uppercase tracking-widest text-amber-500/80">
              Anlatım {ders + 1} / {proc.steps.length}
            </p>
            <p className="text-sm text-zinc-100">{step.instruction}</p>

            {dogru && (
              <div className="rounded border border-emerald-800 bg-emerald-950/40 p-3">
                <p className="text-sm text-emerald-200">{dogru.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{dogru.explain}</p>
              </div>
            )}

            {!dogru && step.hint && <p className="text-sm text-zinc-400">{step.hint}</p>}
            {step.teachingNote && <p className="text-xs italic leading-relaxed text-zinc-500">{step.teachingNote}</p>}
          </div>

          <div className="flex gap-2">
            {ders > 0 && (
              <button
                onClick={() => setDers(ders - 1)}
                className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
              >
                Geri
              </button>
            )}
            <button
              onClick={() => (son ? setPhase("safety") : setDers(ders + 1))}
              className="flex-1 rounded bg-amber-500 py-2 text-sm font-medium text-zinc-900"
            >
              {son ? "Anlatım bitti — uygulamaya geç" : "Devam"}
            </button>
          </div>

          <button
            onClick={() => setPhase("safety")}
            className="w-full text-xs text-zinc-500 hover:text-zinc-300"
          >
            Anlatımı atla, doğrudan uygula
          </button>

          <Guide procedureId={proc.id} stepId={step.id} />
        </div>
      </div>
    );
  }

  if (phase === "safety") {
    const blocking = proc.safety.filter((s) => s.blocksStart);
    return (
      <div className="space-y-3 p-4">
        <button onClick={onFinish} className="text-xs text-zinc-500 hover:text-zinc-300">
          ← aşamalar
        </button>
        <h2 className="text-sm font-medium text-zinc-100">{proc.title} — güvenlik</h2>
        {done[proc.id] && (
          <p className="text-xs text-zinc-500">
            Önceki deneme: {done[proc.id].score} puan (
            {new Date(done[proc.id].at).toLocaleDateString("tr-TR")})
          </p>
        )}
        {blocking.map((s, n) => (
          <label key={s.rule} className="flex gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={checked.includes(n)}
              onChange={() => setChecked((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]))}
              className="mt-1 accent-amber-400"
            />
            <span>
              {s.rule}
              <span className="block text-xs text-zinc-500">{s.why}</span>
            </span>
          </label>
        ))}
        <button
          disabled={checked.length < blocking.length}
          onClick={() => setPhase("steps")}
          className="w-full rounded bg-amber-500 py-2 text-sm font-medium text-zinc-900 disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          Başla
        </button>
      </div>
    );
  }

  if (phase === "quiz") {
    const allAnswered = answers.filter(Boolean).length === proc.assessment.questions.length;
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-sm font-medium text-zinc-100">Bitiş testi</h2>
        {proc.assessment.questions.map((question, n) => (
          <div key={question.q} className="space-y-2">
            <p className="text-sm text-zinc-300">{question.q}</p>
            {karistir(question.options, `${proc.id}:soru${n}`).map((o) => (
              <button
                key={o.verdict}
                onClick={() => setAnswers((a) => Object.assign([...a], { [n]: o.verdict }))}
                className={`block w-full rounded border px-3 py-2 text-left text-sm ${
                  answers[n] === o.verdict
                    ? "border-amber-400 bg-zinc-800 text-zinc-100"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        ))}
        <button
          disabled={!allAnswered}
          onClick={() => {
            const r = grade(proc, log, answers);
            const merged = { ...done, [proc.id]: { score: r.score, at: new Date().toISOString() } };
            yerelYaz(merged);
            setDone(merged);
            void bulutaYaz(proc.id, r.score, r.passed);
            setPhase("done");
          }}
          className="w-full rounded bg-amber-500 py-2 text-sm font-medium text-zinc-900 disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          Bitir
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const r = grade(proc, log, answers);
    return (
      <div className="space-y-4 p-4">
        <p className="text-3xl font-medium text-zinc-100">{r.score} puan</p>
        <p className="text-sm text-zinc-400">
          {r.passed ? "Geçtin. Bu prosedürü ustalıkla bitirdin." : "Geçemedin. Aşağıdaki maddeleri tekrar et."}
        </p>

        <ul className="space-y-1 text-sm">
          {Object.entries(r.flags).map(([flag, ok]) => (
            <li key={flag} className={ok ? "text-emerald-300" : "text-red-300"}>
              {ok ? "✓" : "✗"} {flag}
            </li>
          ))}
          <li className={r.correct === r.questionCount ? "text-emerald-300" : "text-red-300"}>
            {r.correct === r.questionCount ? "✓" : "✗"} test {r.correct}/{r.questionCount}
          </li>
        </ul>

        {proc.assessment.questions.map((question, n) => {
          if (answers[n] === question.a) return null;
          const chosen = question.options.find((o) => o.verdict === answers[n]);
          const right = question.options.find((o) => o.verdict === question.a);
          return (
            <div key={question.q} className="rounded border border-zinc-700 p-3 text-sm">
              <p className="text-zinc-300">{question.q}</p>
              {chosen && <p className="mt-1 text-red-300">{chosen.explain}</p>}
              {right && <p className="mt-1 text-emerald-300">{right.explain}</p>}
            </div>
          );
        })}

        <button onClick={onFinish} className="w-full rounded bg-amber-500 py-2 text-sm font-medium text-zinc-900">
          Aşamalara dön
        </button>
      </div>
    );
  }

  const step = proc.steps[index];
  const result = evaluate(step, input, tool);
  const next = () => {
    setLog((l) => [...l, { stepId: step.id, type: step.interaction.type, mistakes: dirty ? 1 : 0 }]);
    setDirty(false);
    setInput(ZERO);
    if (index + 1 >= proc.steps.length) setPhase("quiz");
    else setIndex(index + 1);
  };

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row">
      <div className="h-[45dvh] shrink-0 md:h-full md:flex-1">
        <Scene
          bench={proc.vehicleClass === "atolye-egzersizi"}
          interaction={step.interaction}
          amount={input.kind === "drag" ? input.amount : 0}
        />
      </div>

      <div className="min-h-0 space-y-4 overflow-y-auto p-4 md:w-96 md:shrink-0">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Adım {step.id} / {proc.steps.length}
        </p>
        <p className="text-sm text-zinc-100">{step.instruction}</p>
        {step.hint && <p className="mt-1 text-xs text-zinc-500">{step.hint}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {proc.tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(tool === t.id ? undefined : t.id)}
            className={`rounded border px-2 py-1 text-xs ${
              tool === t.id ? "border-amber-400 text-amber-300" : "border-zinc-700 text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Control step={step} input={input} setInput={apply} tohum={`${proc.id}:${step.id}`} />

      {result.mistake && result.feedback && (
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {result.feedback}
          <button onClick={() => setInput(ZERO)} className="mt-2 block text-xs underline">
            Baştan al
          </button>
        </div>
      )}

      {result.ok && (
        <div className="space-y-2">
          {result.feedback && (
            <p className="rounded border border-emerald-800 bg-emerald-950/50 p-3 text-sm text-emerald-200">
              {result.feedback}
            </p>
          )}
          {step.teachingNote && <p className="text-xs italic text-zinc-500">{step.teachingNote}</p>}
          <button onClick={next} className="w-full rounded bg-amber-500 py-2 text-sm font-medium text-zinc-900">
            {index + 1 >= proc.steps.length ? "Bitiş testine geç" : "Sonraki adım"}
          </button>
        </div>
      )}

        <Guide procedureId={proc.id} stepId={step.id} />
      </div>
    </div>
  );
}
