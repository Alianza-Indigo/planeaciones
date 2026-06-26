import { callGemini } from "@/lib/alianza-indigo/client";
import { buildMaterialesPrompt } from "@/lib/generation/build-planning-prompt";
import { limpiarDocumento, materialesAtexto, splitMateriales } from "@/lib/generation/materiales";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function generatePlanningWithAlianzaIndigo(
  input: PlanningInput,
  prompt: string,
): Promise<GeneratedPlanning> {
  // 1) Plan principal.
  const result = await callGemini(prompt);
  const plan = limpiarDocumento(splitMateriales(result.text).texto);

  // 2) Materiales en una llamada dedicada (evita truncamiento al final del plan).
  let materiales = null;
  try {
    const matResult = await callGemini(buildMaterialesPrompt(input, plan));
    materiales = splitMateriales(matResult.text).materiales;
  } catch {
    // Si falla la segunda llamada, la planeación se entrega igual sin materiales.
  }

  const content = materiales ? `${plan}\n\n${materialesAtexto(materiales)}` : plan;

  return {
    title: `Planeacion ${input.grado} - ${input.proyecto}`,
    content,
    materiales: materiales ?? undefined,
    model: result.model,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  };
}
