import { NextResponse } from "next/server";

import { generatePlanningWithAlianzaIndigo } from "@/lib/alianza-indigo/generate-planning";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTemporaryDraft } from "@/lib/drafts/create-draft";
import {
  buildPlanningPrompt,
  defaultPlanningPromptTemplate,
} from "@/lib/generation/build-planning-prompt";
import { planningInputSchema } from "@/lib/generation/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Inicia sesion para generar planeaciones." }, { status: 401 });
  }

  const input = planningInputSchema.parse(await request.json());
  const activePrompt = await prisma.promptTemplate.findFirst({
    where: { kind: "PLANNING", isActive: true },
    orderBy: { version: "desc" },
  });

  const generation = await prisma.generation.create({
    data: {
      userId: session.user.id,
      promptTemplateId: activePrompt?.id,
      status: "STARTED",
      input,
    },
  });

  try {
    const prompt = buildPlanningPrompt(input, activePrompt?.body ?? defaultPlanningPromptTemplate);
    const planning = await generatePlanningWithAlianzaIndigo(input, prompt);
    const draft = await createTemporaryDraft({
      userId: session.user.id,
      generationId: generation.id,
      input,
      planning,
    });

    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        outputPreview: planning.content.slice(0, 2000),
        providerRequestId: planning.providerRequestId,
        model: planning.model,
        tokensIn: planning.tokensIn,
        tokensOut: planning.tokensOut,
      },
    });

    await prisma.membership.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, generationsUsed: 1 },
      update: { generationsUsed: { increment: 1 } },
    });

    return NextResponse.json({
      draftId: draft.id,
      title: draft.title,
      expiresAt: draft.expiresAt,
    });
  } catch (error) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Error desconocido",
      },
    });

    return NextResponse.json(
      { error: "No se pudo generar la planeacion.", details: error instanceof Error ? error.message : null },
      { status: 502 },
    );
  }
}
