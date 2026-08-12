// Tarayicidan gercek bir dersi ucdan uca bitirir ve veritabanina dustugunu dogrular.
// Secmeli siklarin yaninda cevirme (Rotary) ve cekme (Linear) jestlerini de surer.
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter((s) => s.includes("=") && !s.trim().startsWith("#"))
    .map((s) => [s.slice(0, s.indexOf("=")).trim(), s.slice(s.indexOf("=") + 1).trim()]),
);
const DERS = "elektrik.aku-guvenlik";
const proc = JSON.parse(readFileSync("public/procedures/elektrik-aku-guvenlik.json", "utf8"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const uyari = [];
page.on("console", (m) => ["error", "warning"].includes(m.type()) && /ilerleme|supabase|422/i.test(m.text()) && uyari.push(m.text().slice(0, 120)));

// Rotary: cember uzerinde donerek tur sayisini toplar.
async function cevir(turlar) {
  const kutu = await page.locator("div.rounded-full.cursor-grab").first().boundingBox();
  const cx = kutu.x + kutu.width / 2, cy = kutu.y + kutu.height / 2, r = kutu.width / 2 - 8;
  await page.mouse.move(cx + r, cy);
  await page.mouse.down();
  const adim = 14, toplam = Math.ceil(turlar * adim) + adim; // fazladan bir tur guvenlik payi
  for (let i = 1; i <= toplam; i++) {
    const a = (i / adim) * Math.PI * 2;
    await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  await page.mouse.up();
}

// Linear: 160 px yukari cekis adimin gerektirdigi mesafeyi tamamlar.
async function cek() {
  const kutu = await page.locator("div.rounded-lg.cursor-grab").first().boundingBox();
  const x = kutu.x + kutu.width / 2, y = kutu.y + kutu.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(x, y - i * 11);
  await page.mouse.up();
}

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Araç Elektrik" }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Akü güvenliği/ }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /Anlatımı atla/ }).click();
await page.waitForTimeout(600);
for (const k of await page.locator("input[type=checkbox]").all()) await k.check();
await page.getByRole("button", { name: "Başla" }).click();

for (let n = 0; n < proc.steps.length; n++) {
  await page.waitForTimeout(1100);
  const i = proc.steps[n].interaction;

  if (i.tool) {
    const alet = proc.tools.find((t) => t.id === i.tool);
    if (alet) {
      // Zaten secili aleti tekrar tiklamak secimi KALDIRIR; once duruma bak.
      const dugme = page.getByRole("button", { name: alet.label, exact: true });
      const sinif = (await dugme.getAttribute("class")) ?? "";
      if (!sinif.includes("border-amber-400")) await dugme.click();
    }
  }

  if (i.type === "inspect-and-choose") {
    await page.getByRole("button", { name: i.options.find((o) => o.correct).label, exact: false }).first().click();
  } else if (i.type === "unscrew") {
    await cevir(i.turns * i.count);
  } else if (i.type === "rotate") {
    await cevir(i.turns);
  } else {
    await cek();
  }

  await page.waitForTimeout(700);
  const ileri = n + 1 >= proc.steps.length ? /Bitiş testine geç/ : /Sonraki adım/;
  await page.getByRole("button", { name: ileri }).click();
  console.log(`adim ${n + 1}/${proc.steps.length} (${i.type}) tamam`);
}

await page.waitForTimeout(1200);
for (const s of proc.assessment.questions) {
  await page.getByRole("button", { name: s.options.find((o) => o.verdict === s.a).label, exact: false }).first().click();
  await page.waitForTimeout(300);
}
await page.getByRole("button", { name: "Bitir" }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: "../shots/07-sonuc.png" });
console.log("SONUC:", (await page.locator("body").innerText()).split("\n").slice(0, 3).join(" | "));
console.log("UYARILAR:", uyari.length ? uyari : "yok");
await browser.close();

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await admin.from("ilerleme").select("kullanici, prosedur, puan, gecti").eq("prosedur", DERS);
console.log("VERITABANI:", JSON.stringify(data));
process.exit(data && data.length ? 0 : 1);
