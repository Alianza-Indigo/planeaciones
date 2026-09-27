import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MAX_PROFILE_EDITS,
  remainingEdits,
  teacherProfileSchema,
} from "@/lib/teacher-profile";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    profile,
    remainingEdits: profile ? remainingEdits(profile.editCount) : MAX_PROFILE_EDITS,
    maxEdits: MAX_PROFILE_EDITS,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = teacherProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del perfil inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const userId = session.user.id;

  const existing = await prisma.teacherProfile.findUnique({ where: { userId } });

  // Alta: primer guardado, no consume cambios.
  if (!existing) {
    const profile = await prisma.teacherProfile.create({
      data: { userId, ...data },
    });
    return NextResponse.json({ profile, remainingEdits: remainingEdits(profile.editCount) });
  }

  // Migración amable: un perfil de secundaria anterior puede registrar por
  // primera vez su materia sin consumir una edición, incluso si agotó el cupo.
  const completingLegacySubject =
    existing.nivel === "Secundaria" &&
    !existing.materia &&
    data.nivel === existing.nivel &&
    data.nombre === existing.nombre &&
    data.escuela === existing.escuela &&
    data.grado === existing.grado &&
    !!data.materia;

  if (completingLegacySubject) {
    const profile = await prisma.teacherProfile.update({
      where: { userId },
      data: { materia: data.materia },
    });
    return NextResponse.json({ profile, remainingEdits: remainingEdits(profile.editCount) });
  }

  // Modificación: consume un cambio; bloqueada al agotar el tope.
  if (existing.editCount >= MAX_PROFILE_EDITS) {
    return NextResponse.json(
      {
        error:
          "Alcanzaste el máximo de cambios de tu perfil. Solicita al administrador que lo actualice.",
      },
      { status: 403 },
    );
  }

  const profile = await prisma.teacherProfile.update({
    where: { userId },
    data: { ...data, editCount: { increment: 1 } },
  });

  return NextResponse.json({ profile, remainingEdits: remainingEdits(profile.editCount) });
}
