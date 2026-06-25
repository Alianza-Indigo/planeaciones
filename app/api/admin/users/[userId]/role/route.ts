import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ userId: string }>;
};

export const runtime = "nodejs";

// Cambia el rol de un usuario (USER/ADMIN) desde la consola del admin.
export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { userId } = await context.params;
  const body = (await request.json()) as { role?: "ADMIN" | "USER" };

  if (body.role !== "ADMIN" && body.role !== "USER") {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  // Evita que un admin se quite el rol a sí mismo y se quede sin acceso.
  if (userId === auth.session!.user.id && body.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No puedes quitarte el rol de administrador a ti mismo." },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: body.role },
  });

  return NextResponse.json({ id: user.id, role: user.role });
}
