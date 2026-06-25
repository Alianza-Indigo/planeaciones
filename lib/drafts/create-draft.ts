import { prisma } from "@/lib/db";
import { getDraftEnv } from "@/lib/env";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function createTemporaryDraft(params: {
  userId: string;
  generationId: string;
  input: PlanningInput;
  planning: GeneratedPlanning;
}) {
  const env = getDraftEnv();
  const expiresAt = new Date(Date.now() + env.DRAFT_TTL_HOURS * 60 * 60 * 1000);

  return prisma.planningDraft.create({
    data: {
      userId: params.userId,
      generationId: params.generationId,
      title: params.planning.title,
      content: params.planning.content,
      metadata: {
        grado: params.input.grado,
        fase: params.input.fase,
        proyecto: params.input.proyecto,
        sesiones: params.input.sesiones,
        materiales: (params.planning.materiales ?? null) as object | null,
      },
      expiresAt,
    },
  });
}
