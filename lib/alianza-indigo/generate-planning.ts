import { callAlianzaIndigo } from "@/lib/alianza-indigo/client";
import { getAlianzaEnv } from "@/lib/env";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function generatePlanningWithAlianzaIndigo(
  input: PlanningInput,
  prompt: string,
): Promise<GeneratedPlanning> {
  const env = getAlianzaEnv();
  const response = await callAlianzaIndigo({
    prompt,
    input,
    model: env.ALIANZA_INDIGO_MODEL,
  });

  return {
    title: `Planeacion ${input.grado} - ${input.proyecto}`,
    content: response.text,
    providerRequestId: response.requestId,
    model: response.model ?? env.ALIANZA_INDIGO_MODEL,
    tokensIn: response.usage?.inputTokens,
    tokensOut: response.usage?.outputTokens,
  };
}
