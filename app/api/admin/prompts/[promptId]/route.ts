import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{ promptId: string }>;
};

export const runtime = "nodejs";

export async function PATCH(request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { promptId } = await context.params;
  const body = (await request.json()) as { name?: string; body?: string; notes?: string };

  const prompt = await prisma.promptTemplate.update({
    where: { id: promptId },
    data: {
      name: body.name,
      body: body.body,
      notes: body.notes,
    },
  });

  return NextResponse.json(prompt);
}
