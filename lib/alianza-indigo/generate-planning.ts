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
  let matTokensIn = 0;
  let matTokensOut = 0;
  try {
    const matResult = await callGemini(buildMaterialesPrompt(input, plan), { temperature: 0.5 });
    materiales = splitMateriales(matResult.text).materiales;
    matTokensIn = matResult.tokensIn ?? 0;
    matTokensOut = matResult.tokensOut ?? 0;
  } catch {
    // Si falla la segunda llamada, la planeación se entrega igual sin materiales.
  }

  const content = materiales ? `${plan}\n\n${materialesAtexto(materiales)}` : plan;

  // Se suman los tokens de ambas llamadas (plan + materiales) para que el
  // consumo registrado refleje el costo real de la planeación completa.
  return {
    title: `Planeacion ${input.grado} - ${input.proyecto}`,
    content,
    materiales: materiales ?? undefined,
    model: result.model,
    tokensIn: (result.tokensIn ?? 0) + matTokensIn,
    tokensOut: (result.tokensOut ?? 0) + matTokensOut,
  };
}
