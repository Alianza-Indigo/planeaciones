import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ draftId: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: Context) {
  const session = await getSession();
  const { draftId } = await context.params;

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const draft = await prisma.planningDraft.findFirst({
    where: {
      id: draftId,
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft no encontrado o expirado" }, { status: 404 });
  }

  return NextResponse.json(draft);
}

export async function PATCH(request: Request, context: Context) {
  const session = await getSession();
  const { draftId } = await context.params;

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string; content?: string };
  const draft = await prisma.planningDraft.findFirst({
    where: {
      id: draftId,
      userId: session.user.id,
      expiresAt: { gt: new Date() },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft no encontrado o expirado" }, { status: 404 });
  }

  const updated = await prisma.planningDraft.update({
    where: { id: draft.id },
    data: {
      title: body.title ?? draft.title,
      content: body.content ?? draft.content,
    },
  });

  return NextResponse.json(updated);
}
