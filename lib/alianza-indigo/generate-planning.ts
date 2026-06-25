import { callGemini } from "@/lib/alianza-indigo/client";
import { limpiarDocumento, materialesAtexto, splitMateriales } from "@/lib/generation/materiales";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function generatePlanningWithAlianzaIndigo(
  input: PlanningInput,
  prompt: string,
): Promise<GeneratedPlanning> {
  const result = await callGemini(prompt);

  // Separar el bloque de materiales del texto y limpiar el preámbulo (blindajes
  // filtrados). El contenido guardado es ya legible: plan + materiales en prosa.
  const { texto, materiales } = splitMateriales(result.text);
  const plan = limpiarDocumento(texto);
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
