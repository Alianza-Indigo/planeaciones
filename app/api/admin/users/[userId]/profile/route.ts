import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ userId: string }>;
};

export const runtime = "nodejs";

// Reinicia el contador de cambios del perfil docente: le devuelve al docente
// sus cambios para que él mismo actualice su nombre, escuela, nivel y grado.
export async function POST(_request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { userId } = await context.params;

  const profile = await prisma.teacherProfile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "El docente aún no tiene perfil." }, { status: 404 });
  }

  const updated = await prisma.teacherProfile.update({
    where: { userId },
    data: { editCount: 0 },
  });

  return NextResponse.json({ ok: true, editCount: updated.editCount });
}
