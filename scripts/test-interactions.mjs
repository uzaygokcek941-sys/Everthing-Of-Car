// Etkileşim motorunun tek çalışabilir kontrolü. Gerçek prosedür JSON'unu okur;
// hiçbir adım burada kodlanmaz, hepsi dosyadan gelir.
// Çalıştır: node --test scripts/test-interactions.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { evaluate, dragTarget, grade, motionFor, NM_PER_TURN } from "../web/lib/interactions.ts";

const proc = JSON.parse(readFileSync("web/public/procedures/motor-buji-degisimi.json", "utf8"));
const step = (id) => proc.steps.find((s) => s.id === id);
const drag = (amount) => ({ kind: "drag", amount });

test("pull: mesafe dolmadan tamamlanmaz", () => {
  const s = step(1);
  assert.equal(dragTarget(s.interaction), 0.4);
  assert.equal(evaluate(s, drag(0.2)).ok, false);
  assert.equal(evaluate(s, drag(0.5)).ok, true);
});

test("unscrew: 4 cıvata × 6 tur = 24 tur", () => {
  assert.equal(dragTarget(step(2).interaction), 24);
});

test("yanlış alet adımı bitirmez, JSON'daki uyarıyı verir", () => {
  const s = step(5);
  const r = evaluate(s, drag(-8), "tool.circir");
  assert.equal(r.ok, false);
  assert.equal(r.mistake, true);
  assert.match(r.feedback, /porselen/);
});

test("rotate: doğru aletle ters yön hatadır, doğru yön 8 turda biter", () => {
  const s = step(5);
  assert.match(evaluate(s, drag(8), "tool.lokma-16").feedback, /Ters yöne/);
  assert.equal(evaluate(s, drag(-3), "tool.lokma-16").ok, false);
  assert.equal(evaluate(s, drag(-8), "tool.lokma-16").ok, true);
});

test("teşhis: yalnız doğru şık geçer, yanlış şık kendi açıklamasını verir", () => {
  const s = step(6);
  assert.equal(evaluate(s, { kind: "choice", index: 0 }).ok, true);
  const r = evaluate(s, { kind: "choice", index: 2 });
  assert.equal(r.ok, false);
  assert.match(r.feedback, /Bujiyi değiştirmek sorunu çözmez/);
});

test("measure: kabul aralığı dışı hatadır", () => {
  const s = step(7);
  assert.equal(evaluate(s, { kind: "value", value: 1.0 }).ok, true);
  assert.equal(evaluate(s, { kind: "value", value: 1.5 }).ok, false);
});

test("tork: az sıkma bitmemiştir, tolerans içi geçer, aşırı sıkma hatadır", () => {
  const s = step(8);
  const { targetTorqueNm: t, toleranceNm: tol } = s.interaction;
  const turnsFor = (nm) => nm / NM_PER_TURN;
  assert.equal(evaluate(s, drag(turnsFor(t - tol - 1)), "tool.tork-anahtari").ok, false);
  assert.equal(evaluate(s, drag(turnsFor(t)), "tool.tork-anahtari").ok, true);
  const over = evaluate(s, drag(turnsFor(t + tol + 1)), "tool.tork-anahtari");
  assert.equal(over.ok, false);
  assert.equal(over.mistake, true);
  assert.match(over.feedback, /helicoil/);
});

// Hareket: her etkileşim tipi parçayı farklı oynatır. Çevirenler kendi ekseninde
// döner, çekenler öteler. Karışırsa cıvata uçar ya da kaput döner.
test("hareket: çeviren tipler döner, çeken tipler dönmez", () => {
  const civata = step(5).interaction; // rotate
  const kaput = step(1).interaction; // pull
  assert.equal(motionFor(civata, -8).turns, -8);
  assert.equal(motionFor(kaput, 0.4).turns, 0);
  assert.ok(motionFor(civata, -8).slide > 0, "sökülen cıvata kendi ekseninde geri çıkar");
});

test("hareket: çekme yolu JSON'daki keyfi mesafeye değil, ilerleme oranına bağlı", () => {
  const kaput = step(1).interaction; // distance 0.4
  const filtre = JSON.parse(readFileSync("web/public/procedures/motor-hava-filtresi.json", "utf8"))
    .steps.find((s) => s.interaction.type === "pull").interaction; // distance 1
  // İki adımın distance değeri farklı ama tam çekildiğinde ikisi de aynı yolu gider.
  assert.equal(motionFor(kaput, dragTarget(kaput)).slide, motionFor(filtre, dragTarget(filtre)).slide);
  assert.equal(motionFor(kaput, 0).slide, 0);
});

test("hareket: eksen JSON'dan gelir, tanımsız eksen y'ye düşer", () => {
  assert.equal(motionFor(step(1).interaction, 0.4).axis, "y");
  const uydurma = { ...step(1).interaction, axis: "q" };
  assert.equal(motionFor(uydurma, 0.4).axis, "y");
  assert.equal(motionFor({ type: "press-and-pull", target: "part.x" }, 1).axis, "y");
});

test("hareket: teşhis adımı parçayı oynatmaz", () => {
  assert.equal(motionFor(step(6).interaction, 3), null);
  assert.equal(motionFor(undefined, 3), null);
});

// Açı torku: torkun aksine ÜST sınırı vardır. rotate ile yazılamamasının sebebi budur.
const kapak = JSON.parse(readFileSync("web/public/procedures/motor-silindir-kapagi.json", "utf8"));
const aciAdim = kapak.steps.find((s) => s.interaction.type === "rotate-to-angle");
const derece = (d) => drag(d / 360);

test("açı torku: hedefin altı bitmez, tolerans içi biter", () => {
  const { degrees, toleranceDeg, tool } = aciAdim.interaction;
  assert.equal(evaluate(aciAdim, derece(degrees - toleranceDeg - 5), tool).ok, false);
  assert.equal(evaluate(aciAdim, derece(degrees), tool).ok, true);
  assert.equal(evaluate(aciAdim, derece(degrees - toleranceDeg), tool).ok, true);
});

test("açı torku: fazla çevirmek hatadır — rotate'in yapamadığı ayrım", () => {
  const { degrees, toleranceDeg, tool } = aciAdim.interaction;
  const r = evaluate(aciAdim, derece(degrees + toleranceDeg + 20), tool);
  assert.equal(r.ok, false);
  assert.equal(r.mistake, true);
  assert.match(r.feedback, /kopma/);
});

test("açı torku: ters yön hatadır, yanlış alet adımı bitirmez", () => {
  const { degrees, tool } = aciAdim.interaction;
  assert.match(evaluate(aciAdim, derece(-degrees), tool).feedback, /Ters yöne/);
  assert.equal(evaluate(aciAdim, derece(degrees), "tool.tork-anahtari").ok, false);
});

test("açıda hata yapan geçemez", () => {
  const run = kapak.steps.map((s) => ({ stepId: s.id, type: s.interaction.type, mistakes: 0 }));
  const cevaplar = kapak.assessment.questions.map((q) => q.a);
  assert.equal(grade(kapak, run, cevaplar).flags.aciToleransIcinde, true);
  const hatali = run.map((e) => (e.type === "rotate-to-angle" ? { ...e, mistakes: 1 } : e));
  assert.equal(grade(kapak, hatali, cevaplar).flags.aciToleransIcinde, false);
});

test("JSON değişince kod değişmeden davranış değişir", () => {
  const s = structuredClone(step(5));
  s.interaction.turns = 2;
  assert.equal(evaluate(s, drag(-2), "tool.lokma-16").ok, true);
  assert.equal(evaluate(step(5), drag(-2), "tool.lokma-16").ok, false);
});

const cleanRun = proc.steps.map((s) => ({ stepId: s.id, type: s.interaction.type, mistakes: 0 }));
const rightAnswers = proc.assessment.questions.map((q) => q.a);

test("puanlama: hatasız koşu + tam test = 100 ve geçer", () => {
  const r = grade(proc, cleanRun, rightAnswers);
  assert.equal(r.score, 100);
  assert.equal(r.passed, true);
});

test("teşhiste hata yapan geçemez", () => {
  const log = cleanRun.map((e) => (e.type === "inspect-and-choose" ? { ...e, mistakes: 1 } : e));
  const r = grade(proc, log, rightAnswers);
  assert.equal(r.flags.teshisDogru, false);
  assert.equal(r.passed, false);
});

test("aşırı sıkan geçemez", () => {
  const log = cleanRun.map((e) => (e.type === "rotate-to-torque" ? { ...e, mistakes: 1 } : e));
  assert.equal(grade(proc, log, rightAnswers).flags.torkToleransIcinde, false);
});

test("yarım bırakılan prosedür tüm adımları tamamlamış sayılmaz", () => {
  assert.equal(grade(proc, cleanRun.slice(0, 4), rightAnswers).flags.tumAdimlarTamam, false);
});

test("tanımsız passRequires sessizce geçmez", () => {
  const p = structuredClone(proc);
  p.assessment.passRequires = ["uydurmaKural"];
  assert.equal(grade(p, cleanRun, rightAnswers).flags.uydurmaKural, false);
});

// Bu iki kontrol tek dosyayı değil, yazılmış bütün prosedürleri tarar:
// yeni ders eklendiğinde kimse testi güncellemeyi hatırlamak zorunda kalmasın.
const all = readdirSync("web/public/procedures")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(`web/public/procedures/${f}`, "utf8")));

test("her testin doğru cevabı şıklar arasında var", () => {
  for (const p of all)
    for (const q of p.assessment.questions) {
      assert.ok(
        q.options.some((o) => o.verdict === q.a),
        `${p.id}: "${q.q}" için doğru şık tanımlı değil`,
      );
    }
});

test("her measure aralığı kaydırıcıyla tutturulabilir", () => {
  // Procedure.tsx:122-124 — kaydırıcı lo-0.4'ten başlar ve 0.05 adımla ilerler.
  // Aralık bu ızgaraya denk gelmiyorsa adım oynanamaz hâle gelir.
  for (const p of all)
    for (const s of p.steps) {
      if (s.interaction.type !== "measure") continue;
      const [lo, hi] = s.interaction.acceptRange;
      const k = Math.ceil(0.4 / 0.05 - 1e-9);
      const v = lo - 0.4 + k * 0.05;
      assert.ok(v <= hi + 1e-9, `${p.id} adım ${s.id}: [${lo}, ${hi}] aralığına kaydırıcı değeri düşmüyor`);
    }
});

test("her teşhis adımında tam bir doğru şık var", () => {
  for (const p of all)
    for (const s of p.steps) {
      if (s.interaction.type !== "inspect-and-choose") continue;
      const n = s.interaction.options.filter((o) => o.correct).length;
      assert.equal(n, 1, `${p.id} adım ${s.id}: ${n} doğru şık var, 1 olmalı`);
    }
});
