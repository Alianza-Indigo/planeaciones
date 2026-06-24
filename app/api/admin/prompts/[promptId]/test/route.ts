import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { buildPlanningPrompt } from "@/lib/generation/build-planning-prompt";
import { planningInputSchema } from "@/lib/generation/types";

type Context = {
  params: Promise<{ promptId: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, context: Context) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { promptId } = await context.params;
  const prompt = await prisma.promptTemplate.findUniqueOrThrow({ where: { id: promptId } });
  const input = planningInputSchema.parse(await request.json());

  return NextResponse.json({
    prompt: buildPlanningPrompt(input, prompt.body),
  });
}
