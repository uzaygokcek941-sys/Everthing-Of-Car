// Etkileşim dilbilgisi. Adımlar burada değil, JSON'da. Bu dosya sadece
// "verilen adıma verilen girdi doğru mu?" sorusunu cevaplar.

export type Choice = { label: string; verdict: string; correct?: boolean; explain: string };

export type Interaction =
  | { type: "pull"; target: string; axis: string; distance: number }
  | { type: "unscrew"; target: string; count: number; turns: number; tool?: string }
  | { type: "press-and-pull"; target: string }
  | { type: "rotate"; target: string; direction: "cw" | "ccw"; turns: number; tool?: string; requiresGesture?: boolean }
  | { type: "measure"; target: string; unit: string; acceptRange: [number, number]; sourceRequired?: boolean }
  | {
      type: "rotate-to-torque";
      target: string;
      direction: "cw" | "ccw";
      targetTorqueNm: number;
      toleranceNm: number;
      tool?: string;
      requiresGesture?: boolean;
      sourceRequired?: boolean;
    }
  | {
      // Açı torku: tork kademesinden sonra belirtilen açı kadar çevrilir. Torkun
      // aksine üst sınırı vardır — fazla çevirmek cıvatayı akma sınırının ötesine
      // götürür ve kopmaya sürükler.
      type: "rotate-to-angle";
      target: string;
      direction: "cw" | "ccw";
      degrees: number;
      toleranceDeg: number;
      tool?: string;
      requiresGesture?: boolean;
      sourceRequired?: boolean;
    }
  | { type: "inspect-and-choose"; target: string; question: string; options: Choice[] };

export type Step = {
  id: number;
  instruction: string;
  interaction: Interaction;
  camera?: string;
  hint?: string;
  teachingNote?: string;
  commonMistake?: { if: string; feedback: string };
};

export type Procedure = {
  id: string;
  title: string;
  vehicleClass: string;
  estimatedMinutes: number;
  /** Anlatım fazının açılışında gösterilir: bu ders neyi öğretiyor. */
  learningGoals?: string[];
  safety: { rule: string; why: string; blocksStart: boolean }[];
  tools: { id: string; label: string; required: boolean }[];
  steps: Step[];
  assessment: Assessment;
};

export type Question = { q: string; a: string; options: { verdict: string; label: string; explain: string }[] };
export type Assessment = { passRequires: string[]; questions: Question[] };

/** Bir adımın koşusu: tamamlandı ve kaç kez hata yapıldı. */
export type RunEntry = { stepId: number; type: Interaction["type"]; mistakes: number };

export type Input =
  | { kind: "drag"; amount: number } // işaretli: + saat yönü, - ters
  | { kind: "value"; value: number }
  | { kind: "choice"; index: number };

export type Result = { ok: boolean; mistake: boolean; feedback?: string };

// ponytail: tork = tur × sabit. Gerçek eğri diş hatvesine ve sürtünmeye bağlı;
// model gelince adım başına eğri tanımlanır. Şimdilik tek sabit yeter.
export const NM_PER_TURN = 12;

/** Sürükleyerek tamamlanan tipler için gereken miktar. Diğerlerinde null. */
export function dragTarget(i: Interaction): number | null {
  switch (i.type) {
    case "pull":
      return i.distance;
    case "press-and-pull":
      return 1;
    case "unscrew":
      return i.turns * i.count;
    case "rotate":
      return i.turns;
    default:
      return null;
  }
}

// ——— hareket ————————————————————————————————————————————————
// Adımın tipi, parçanın ekranda nasıl hareket edeceğini belirler. Burası
// yalnız "ne kadar döner, ne kadar öteler" der; three.js tarafı bunu uygular.

// ponytail: tek hatve ve abartılı. Gerçek M8 turda 1,25 mm ilerler, o kadarı
// ekranda görünmez. Hatve prosedür verisine girerse buradan okunur.
export const PITCH_M = 0.006;

// JSON'daki `distance` metre değil, keyfi bir birim. Ekrandaki yol buradan gelir.
export const CEKME_M = 0.25;
export const TIRNAK_M = 0.06;

export type Motion = { turns: number; slide: number; axis: "x" | "y" | "z" };

const SPIN: Interaction["type"][] = ["rotate", "unscrew", "rotate-to-torque", "rotate-to-angle"];

export function motionFor(i: Interaction | undefined, amount: number): Motion | null {
  if (!i) return null;

  if (i.type === "pull" || i.type === "press-and-pull") {
    const need = dragTarget(i) ?? 1;
    const ratio = Math.max(0, Math.min(1.15, amount / need));
    const axis = i.type === "pull" && (i.axis === "x" || i.axis === "z") ? i.axis : "y";
    return { turns: 0, slide: ratio * (i.type === "pull" ? CEKME_M : TIRNAK_M), axis };
  }

  if (SPIN.includes(i.type)) {
    return { turns: amount, slide: Math.abs(amount) * PITCH_M, axis: "y" };
  }

  return null;
}

const NOT_YET: Result = { ok: false, mistake: false };

export function evaluate(step: Step, input: Input, toolInHand?: string): Result {
  const i = step.interaction;

  // Yanlış alet yapısal kuraldır: adım bir alet istiyorsa elindeki o olmalı.
  if ("tool" in i && i.tool && toolInHand !== i.tool) {
    return {
      ok: false,
      mistake: true,
      feedback: step.commonMistake?.feedback ?? "Bu adım için doğru aleti seç.",
    };
  }

  if (i.type === "inspect-and-choose") {
    if (input.kind !== "choice") return NOT_YET;
    const opt = i.options[input.index];
    if (!opt) return NOT_YET;
    return { ok: Boolean(opt.correct), mistake: !opt.correct, feedback: opt.explain };
  }

  if (i.type === "measure") {
    if (input.kind !== "value") return NOT_YET;
    const [lo, hi] = i.acceptRange;
    const ok = input.value >= lo && input.value <= hi;
    return {
      ok,
      mistake: !ok,
      feedback: ok ? undefined : `Ölçtüğün ${input.value} ${i.unit}, kabul aralığı ${lo}-${hi} ${i.unit}.`,
    };
  }

  if (i.type === "rotate-to-torque") {
    if (input.kind !== "drag") return NOT_YET;
    const nm = Math.max(0, input.amount) * NM_PER_TURN;
    if (nm > i.targetTorqueNm + i.toleranceNm) {
      return { ok: false, mistake: true, feedback: step.commonMistake?.feedback };
    }
    return { ok: nm >= i.targetTorqueNm - i.toleranceNm, mistake: false };
  }

  if (i.type === "rotate-to-angle") {
    if (input.kind !== "drag") return NOT_YET;
    const deg = input.amount * 360;
    const wanted = i.direction === "cw" ? 1 : -1;
    if (deg !== 0 && Math.sign(deg) !== wanted) {
      return { ok: false, mistake: true, feedback: "Ters yöne çeviriyorsun. Açı torku sıkma yönünde uygulanır." };
    }
    const done = Math.abs(deg);
    if (done > i.degrees + i.toleranceDeg) {
      return {
        ok: false,
        mistake: true,
        feedback: step.commonMistake?.feedback ?? `${Math.round(done)}° çevirdin, hedef ${i.degrees}°. Fazla açı cıvatayı kopma sınırına taşır.`,
      };
    }
    return { ok: done >= i.degrees - i.toleranceDeg, mistake: false };
  }

  if (input.kind !== "drag") return NOT_YET;

  if (i.type === "rotate" && input.amount !== 0) {
    const wanted = i.direction === "cw" ? 1 : -1;
    if (Math.sign(input.amount) !== wanted) {
      return {
        ok: false,
        mistake: true,
        feedback:
          i.direction === "ccw"
            ? "Ters yöne çeviriyorsun. Sökmek için saat yönünün tersi."
            : "Ters yöne çeviriyorsun. Sıkmak için saat yönü.",
      };
    }
  }

  const need = dragTarget(i);
  if (need === null) return NOT_YET;
  return { ok: Math.abs(input.amount) >= need, mistake: false };
}

const allClean = (log: RunEntry[], type: Interaction["type"]) => {
  const runs = log.filter((e) => e.type === type);
  return runs.length > 0 && runs.every((e) => e.mistakes === 0);
};

// passRequires adları yapısal olarak karşılanır. Tanımsız bir ad sessizce
// geçmez, karşılanmamış sayılır.
const PASS_RULES: Record<string, (log: RunEntry[], proc: Procedure) => boolean> = {
  tumAdimlarTamam: (log, proc) => log.length === proc.steps.length,
  teshisDogru: (log) => allClean(log, "inspect-and-choose"),
  torkToleransIcinde: (log) => allClean(log, "rotate-to-torque"),
  aciToleransIcinde: (log) => allClean(log, "rotate-to-angle"),
};

export function grade(proc: Procedure, log: RunEntry[], answers: (string | undefined)[]) {
  const flags: Record<string, boolean> = {};
  for (const f of proc.assessment.passRequires) flags[f] = PASS_RULES[f]?.(log, proc) ?? false;

  const correct = proc.assessment.questions.filter((q, n) => answers[n] === q.a).length;
  const earned = correct + Object.values(flags).filter(Boolean).length;
  const total = proc.assessment.questions.length + proc.assessment.passRequires.length;

  return {
    flags,
    correct,
    questionCount: proc.assessment.questions.length,
    score: Math.round((earned / total) * 100),
    passed: earned === total,
  };
}

/**
 * Siklari karistirir. Tohum ayni oldugu surece sira da aynidir: ogrenci
 * ekrani yenileyince siralar oynamaz, ama dogru sik her zaman basta olmaz.
 * Bu gerekliydi cunku prosedur dosyalarinda dogru sik daima ilk yazilmis.
 */
export function karistir<T>(liste: T[], tohum: string): T[] {
  let h = 2166136261;
  for (const c of tohum) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const kopya = [...liste];
  for (let i = kopya.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}
