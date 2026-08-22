import { CEREZ_ADI } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return new Response(null, {
    status: 303,
    headers: new Headers({
      Location: new URL("/admin", req.url).toString(),
      "Set-Cookie": `${CEREZ_ADI}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`,
    }),
  });
}
