import { callGemini } from "@/lib/alianza-indigo/client";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function generatePlanningWithAlianzaIndigo(
  input: PlanningInput,
  prompt: string,
): Promise<GeneratedPlanning> {
  const result = await callGemini(prompt);

  return {
    title: `Planeacion ${input.grado} - ${input.proyecto}`,
    content: result.text,
    model: result.model,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  };
}
