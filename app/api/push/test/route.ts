import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { pushConfigured, sendPushToUser } from "@/lib/push/web-push";

export const runtime = "nodejs";

// Envía una notificación de prueba al propio usuario (para verificar el flujo).
export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push no configurado." }, { status: 503 });
  }

  const enviadas = await sendPushToUser(session.user.id, {
    title: "ADIA",
    body: "¡Listo! Las notificaciones están activas en este dispositivo. 💜",
    url: "/planner",
  });

  return NextResponse.json({ ok: true, enviadas });
}
