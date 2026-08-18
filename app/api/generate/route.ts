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

// Límite de ritmo por usuario: la generación es costosa (dos llamadas al LLM,
// hasta 65k tokens de salida). Acota el gasto ante ráfagas o abuso sin estorbar
// a un docente real. Se aplica a todos menos administradores.
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

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
  const userId = session.user.id;

  // Guard de membresía: usuarios FREE tienen un límite de generaciones; los
  // miembros activos generan sin tope. Se verifica antes de gastar la llamada al LLM.
  const membership = await prisma.membership.findUnique({ where: { userId } });

  // Una membresía da acceso si su periodo no ha vencido. CANCELED también
  // cuenta: al cancelar la suscripción se conserva el acceso hasta el fin del
  // periodo ya pagado. La comprobación de vigencia evita que una membresía
  // caducada dé acceso ilimitado para siempre (nada la marca EXPIRED sola).
  const vigente =
    !membership?.currentPeriodEndsAt || membership.currentPeriodEndsAt > new Date();
  const membershipActive =
    (membership?.status === "ACTIVE" || membership?.status === "CANCELED") && vigente;

  // Los administradores generan sin tope ni límite de ritmo (pruebas internas).
  const isAdmin = session.user.role === "ADMIN";

  // Límite de ritmo (todos menos admin): cuenta los intentos recientes.
  if (!isAdmin) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await prisma.generation.count({
      where: { userId, createdAt: { gte: since } },
    });
    if (recent >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Vas muy rápido. Espera unos minutos antes de generar otra planeación." },
        { status: 429, headers: { "retry-after": String(RATE_LIMIT_WINDOW_MS / 1000) } },
      );
    }
  }

  // Reserva atómica del cupo gratuito. Reservar ANTES de generar (no contar
  // después) evita la condición de carrera en la que varias peticiones en
  // paralelo leen el mismo `generationsUsed` y todas superan el límite. Si la
  // generación falla, el cupo se devuelve en el catch.
  const isFreeUser = !isAdmin && !membershipActive;
  let reservedFreeSlot = false;
  if (isFreeUser) {
    // Asegura que exista la fila para poder reservar atómicamente.
    await prisma.membership.upsert({
      where: { userId },
      create: { userId, generationLimit: FREE_GENERATION_LIMIT },
      update: {},
    });
    // FREE_GENERATION_LIMIT es la fuente de verdad del tope, aunque una
    // membresía vieja tenga otro `generationLimit`.
    const reserved = await prisma.membership.updateMany({
      where: { userId, generationsUsed: { lt: FREE_GENERATION_LIMIT } },
      data: { generationsUsed: { increment: 1 } },
    });
    if (reserved.count === 0) {
      return NextResponse.json(
        { error: "Límite de generaciones alcanzado. Activa tu membresía para continuar." },
        { status: 403 },
      );
    }
    reservedFreeSlot = true;
  }

  const activePrompt = await prisma.promptTemplate.findFirst({
    where: { kind: "PLANNING", isActive: true },
    orderBy: { version: "desc" },
  });

  const generation = await prisma.generation.create({
    data: {
      userId,
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

    // El cupo del usuario FREE ya se reservó antes de generar; no se vuelve a
    // incrementar aquí.

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

    // Devuelve el cupo reservado: una generación fallida no debe consumir una
    // de las generaciones gratuitas del usuario.
    if (reservedFreeSlot) {
      await prisma.membership.updateMany({
        where: { userId, generationsUsed: { gt: 0 } },
        data: { generationsUsed: { decrement: 1 } },
      });
    }

    return NextResponse.json(
      { error: "No se pudo generar la planeacion.", details: error instanceof Error ? error.message : null },
      { status: 502 },
    );
  }
}
