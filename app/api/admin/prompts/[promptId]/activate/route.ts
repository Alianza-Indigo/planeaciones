import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ promptId: string }>;
};

export const runtime = "nodejs";

export async function POST(_request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { promptId } = await context.params;
  const prompt = await prisma.promptTemplate.findUniqueOrThrow({ where: { id: promptId } });

  await prisma.$transaction([
    prisma.promptTemplate.updateMany({
      where: { kind: prompt.kind },
      data: { isActive: false },
    }),
    prisma.promptTemplate.update({
      where: { id: prompt.id },
      data: { isActive: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
