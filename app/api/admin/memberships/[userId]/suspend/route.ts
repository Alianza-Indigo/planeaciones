import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ userId: string }>;
};

export const runtime = "nodejs";

// Pausa o reactiva la membresía de un docente desde la consola del admin. Es una
// pausa a nivel de la app (no toca al proveedor de pago): mientras `suspended`
// sea true, /api/generate bloquea la generación. Al reactivar, el estado real de
// la suscripción (ACTIVE/CANCELED/FREE) se conserva intacto.
export async function POST(request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { suspended?: unknown };

  if (typeof body.suspended !== "boolean") {
    return NextResponse.json({ error: "Falta el campo 'suspended' (booleano)." }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership) {
    return NextResponse.json({ error: "El usuario no tiene membresía." }, { status: 404 });
  }

  const updated = await prisma.membership.update({
    where: { userId },
    data: { suspended: body.suspended },
  });

  return NextResponse.json({ userId: updated.userId, suspended: updated.suspended });
}
