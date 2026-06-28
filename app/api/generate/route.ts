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
import { FREE_GENERATION_LIMIT } from "@/lib/membership";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Inicia sesion para generar planeaciones." }, { status: 401 });
  }

  const parsed = planningInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de la planeación inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Guard de membresía: usuarios FREE tienen un límite de generaciones; los
  // miembros activos generan sin tope. Se verifica antes de gastar la llamada al LLM.
  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  // Una membresía solo cuenta como activa si su periodo no ha vencido. Sin esta
  // comprobación, una membresía ACTIVE caducada daría generación ilimitada para
  // siempre (nada cambia el status a EXPIRED automáticamente).
  const membershipActive =
    membership?.status === "ACTIVE" &&
    (!membership.currentPeriodEndsAt || membership.currentPeriodEndsAt > new Date());

  // Los administradores generan sin tope (pruebas internas).
  const isAdmin = session.user.role === "ADMIN";

  const canGenerate =
    isAdmin ||
    !membership ||
    membershipActive ||
    membership.generationsUsed < FREE_GENERATION_LIMIT;

  if (!canGenerate) {
    return NextResponse.json(
      { error: "Límite de generaciones alcanzado. Activa tu membresía para continuar." },
      { status: 403 },
    );
  }

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
      create: { userId: session.user.id, generationsUsed: 1, generationLimit: FREE_GENERATION_LIMIT },
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
