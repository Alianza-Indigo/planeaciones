import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { pushConfigured, sendPushToAll } from "@/lib/push/web-push";

export const runtime = "nodejs";

const broadcastSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(300),
  url: z.string().optional(),
});

// Difusión de un anuncio a todos los dispositivos suscritos. Solo ADMIN.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push no configurado." }, { status: 503 });
  }

  const parsed = broadcastSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const enviadas = await sendPushToAll({
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url || "/planner",
  });

  return NextResponse.json({ ok: true, enviadas });
}
