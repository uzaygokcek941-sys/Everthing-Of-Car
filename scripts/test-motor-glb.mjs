// parts.json'daki her mesh adı GLB'de gerçekten var mı?
// Çalıştır: node --test scripts/test-motor-glb.mjs
//
// three yalnız web/node_modules altında olduğu için göreli yol veriliyor.
// GLTFLoader'ın kendi 'three' importu paket içinden çözülüyor, sorun değil.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { GLTFLoader } from "../web/node_modules/three/examples/jsm/loaders/GLTFLoader.js";

const manifests = readdirSync("web/content")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join("web/content", f), "utf8")))
  .filter((m) => m.file);

// parse() eşzamansızdır: onLoad hemen değil, sonraki tick'te çağrılır.
function meshAdlari(file) {
  const buf = readFileSync(join("web/public", file));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(ab, "", (g) => {
      const adlar = new Set();
      g.scene.traverse((o) => { if (o.isMesh) adlar.add(o.name); });
      resolve(adlar);
    }, (e) => reject(new Error(`GLB ayrıştırılamadı: ${file} — ${e?.message ?? e}`)));
  });
}

test("GLB'si olan her modelde mesh var", async () => {
  assert.ok(manifests.length > 0, "GLB'si olan tek model yok");
  for (const m of manifests) assert.ok((await meshAdlari(m.file)).size > 0, `${m.model} boş`);
});

test("parts.json'daki her mesh adı GLB'de var", async () => {
  for (const m of manifests) {
    const adlar = await meshAdlari(m.file);
    for (const [part, mesh] of Object.entries(m.parts)) {
      if (!mesh) continue;
      assert.ok(adlar.has(mesh), `${m.model}: ${part} -> "${mesh}" GLB'de yok`);
    }
  }
});

test("mesh adlarında nokta yok — GLTFLoader noktayı siler", () => {
  for (const m of manifests) {
    for (const mesh of Object.values(m.parts)) {
      if (mesh) assert.ok(!/[.:/[\]]/.test(mesh), `"${mesh}" yasak karakter içeriyor`);
    }
  }
});

test("GLB'si olan modelin lisans atfı dolu", () => {
  for (const m of manifests) {
    assert.ok(m.license?.author, `${m.model}: lisans atfı boş`);
    assert.ok(m.license?.license, `${m.model}: lisans türü boş`);
  }
});
