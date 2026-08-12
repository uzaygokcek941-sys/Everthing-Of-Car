import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const NIM = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.3-70b-instruct";

const SYSTEM = `Sen bir otomotiv ustası eğitmenisin. Çırağa anlatır gibi, Türkçe, kısa konuş.

KURAL: Yalnızca sana verilen prosedür verisine dayanarak cevap ver.
Veride olmayan hiçbir sayısal değeri (tork, tırnak boşluğu, ölçü, süre) söyleme —
uydurulmuş bir tork değeri öğrencinin motorunu bozar. Veride yoksa şunu söyle:
"Bu prosedürde yazmıyor, aracın servis kitabındaki değeri esas al."
Prosedürün dışına çıkan soruda kapsam dışı olduğunu söyle.`;

export async function POST(req: Request) {
  const key = process.env.NVIDIA_NIM_API_KEY;
  if (!key) {
    return Response.json(
      { error: "NVIDIA_NIM_API_KEY tanımlı değil. web/.env.local içine ekle ve sunucuyu yeniden başlat." },
      { status: 500 },
    );
  }

  const { question, stepId, procedureId } = await req.json();
  if (typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "Soru boş." }, { status: 400 });
  }

  // Kullanıcıdan gelen kimlik asla dosya yoluna eklenmez (path traversal).
  // Dizin taranır, JSON'un kendi id alanıyla eşleşen dosya kullanılır.
  const dir = join(process.cwd(), "public/procedures");
  let procedure: string | undefined;
  for (const name of await readdir(dir)) {
    if (!name.endsWith(".json")) continue;
    const raw = await readFile(join(dir, name), "utf8");
    if (JSON.parse(raw).id === procedureId) {
      procedure = raw;
      break;
    }
  }
  if (!procedure) return Response.json({ error: "Prosedür bulunamadı." }, { status: 404 });

  const res = await fetch(NIM, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "system", content: `PROSEDÜR VERİSİ:\n${procedure}` },
        { role: "user", content: `Şu an ${stepId}. adımdayım. ${question}` },
      ],
    }),
  });

  if (!res.ok) {
    return Response.json({ error: `NIM ${res.status}: ${await res.text()}` }, { status: 502 });
  }

  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) return Response.json({ error: "NIM boş cevap döndü." }, { status: 502 });

  return Response.json({ answer });
}
