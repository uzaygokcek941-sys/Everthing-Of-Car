// Uygulamayi gercek bir tarayicida gezer ve ekran goruntusu alir.
// Calistir: cd web && node scripts/shot.mjs   (dev sunucu 3000 portunda acik)
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const hatalar = [];
page.on("console", (m) => ["error", "warning"].includes(m.type()) && hatalar.push(m.type() + ": " + m.text().slice(0, 160)));
page.on("pageerror", (e) => hatalar.push("PAGEERROR " + String(e).slice(0, 160)));

const cek = async (ad, bekle = 2500) => {
  await page.waitForTimeout(bekle);
  await page.screenshot({ path: `../shots/${ad}.png` });
  console.log("cekildi:", ad);
};

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await cek("01-anasayfa");

// Arac Elektrik alanina gec, ilk dersi ac: anlatim ekrani gorulecek
await page.getByRole("button", { name: "Araç Elektrik" }).click();
await cek("02-elektrik-alani", 1200);

await page.getByRole("button", { name: /Akü güvenliği|Aküyle çalışma|güvenlik/ }).first().click();
await cek("03-anlatim-1", 4000);

// video var mi
const v = page.locator("video");
if (await v.count()) {
  const durum = await v.first().evaluate((el) => ({
    src: el.getAttribute("src"),
    hazir: el.readyState,
    sure: el.duration,
    hata: el.error ? el.error.code : null,
  }));
  console.log("VIDEO:", JSON.stringify(durum));
} else {
  console.log("VIDEO: oynatici yok");
}

// anlatimda ilerle
await page.getByRole("button", { name: "Devam" }).click();
await cek("04-anlatim-2", 2500);

// uygulamaya gec
await page.getByRole("button", { name: /Anlatımı atla/ }).click();
await cek("05-guvenlik", 1500);

// guvenlik kutularini isaretle ve adim ekranina gec
for (const kutu of await page.locator('input[type="checkbox"]').all()) await kutu.check();
await page.getByRole("button", { name: "Başla" }).click();
await cek("06-adim", 3500);

// Siklarin ekrandaki sirasi: dogru sik artik hep basta olmamali
const siklar = await page.locator("button").filter({ hasText: /kutup|Sıra|İkisi/ }).allInnerTexts();
console.log("SIK SIRASI:");
siklar.forEach((t, n) => console.log(`  ${n + 1}. ${t.slice(0, 56)}`));

console.log("HATALAR:", hatalar.length ? hatalar : "yok");
await browser.close();
