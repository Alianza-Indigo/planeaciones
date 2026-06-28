import { callGemini } from "@/lib/alianza-indigo/client";
import { buildMaterialesPrompt } from "@/lib/generation/build-planning-prompt";
import {
  limpiarDocumento,
  materialesAtexto,
  quitarMaterialesJsonFiltrado,
  splitMateriales,
} from "@/lib/generation/materiales";
import type { GeneratedPlanning, PlanningInput } from "@/lib/generation/types";

export async function generatePlanningWithAlianzaIndigo(
  input: PlanningInput,
  prompt: string,
): Promise<GeneratedPlanning> {
  // 1) Plan principal. Temperatura baja: prioriza estructura y blindajes.
  const result = await callGemini(prompt, { temperature: 0.3 });
  const plan = quitarMaterialesJsonFiltrado(limpiarDocumento(splitMateriales(result.text).texto));

  // 2) Materiales en una llamada dedicada (evita truncamiento al final del plan).
  //    Temperatura más alta: aquí se escribe el cuento original y los materiales,
  //    donde conviene más riqueza creativa.
  let materiales = null;
  try {
    const matResult = await callGemini(buildMaterialesPrompt(input, plan), { temperature: 0.5 });
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
