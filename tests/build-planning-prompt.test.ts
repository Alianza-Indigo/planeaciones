import { describe, expect, it } from "vitest";

import { buildPlanningPrompt } from "@/lib/generation/build-planning-prompt";
import { planningInputSchema, type PlanningInput } from "@/lib/generation/types";

function makeInput(overrides: Partial<PlanningInput> = {}): PlanningInput {
  return planningInputSchema.parse({
    nombreDocente: "Diana",
    nombreEscuela: "Escuela primaria",
    periodoPlaneado: "Semana 1",
    grado: "3 primaria",
    fase: "Fase 4",
    duracion: 50,
    sesiones: 5,
    proyecto: "Guardianes del entorno",
    campos: ["LENGUAJES"],
    contenidos: ["Escritura de nombres en la lengua materna."],
    pda: ["Escribe su nombre."],
    ...overrides,
  });
}

describe("buildPlanningPrompt — nivel de detalle", () => {
  it("compacto antepone el formato compacto", () => {
    const prompt = buildPlanningPrompt(makeInput({ nivelDetalle: "compacto" }));
    expect(prompt).toContain("FORMATO DE SALIDA: Compacto");
    expect(prompt.trimStart().startsWith("FORMATO DE SALIDA: Compacto")).toBe(true);
  });

  it("detallado pide script literal con [esperar respuesta]", () => {
    const prompt = buildPlanningPrompt(makeInput({ nivelDetalle: "detallado" }));
    expect(prompt).toContain("FORMATO DE SALIDA: Detallado");
    expect(prompt).toContain("[esperar respuesta]");
  });
});

describe("buildPlanningPrompt — neuroinclusividad", () => {
  it("inactiva usa la sección de necesidades por defecto", () => {
    const prompt = buildPlanningPrompt(makeInput());
    expect(prompt).toContain("NECESIDADES O BARRERAS A CONSIDERAR");
    expect(prompt).toContain("No especificadas");
    expect(prompt).not.toContain("CONDICIONES NEUROINCLUSIVAS");
  });

  it("activa lista las condiciones con su etiqueta legible", () => {
    const prompt = buildPlanningPrompt(
      makeInput({ neuroinclusividad: { activa: true, condiciones: ["tdah", "tea"] } }),
    );
    expect(prompt).toContain("CONDICIONES NEUROINCLUSIVAS PRESENTES EN EL GRUPO");
    expect(prompt).toContain("TDAH — Atención, hiperactividad e impulsividad");
    expect(prompt).toContain("TEA — Trastorno del espectro autista");
    expect(prompt).toContain("Para CADA condición listada");
  });

  it("'otra' agrega la descripción libre", () => {
    const prompt = buildPlanningPrompt(
      makeInput({
        neuroinclusividad: {
          activa: true,
          condiciones: ["otra"],
          otraDescripcion: "Síndrome de Down",
        },
      }),
    );
    expect(prompt).toContain("Otra: Síndrome de Down");
  });

  it("activa sin condiciones cae al texto por defecto", () => {
    const prompt = buildPlanningPrompt(
      makeInput({ neuroinclusividad: { activa: true, condiciones: [] } }),
    );
    expect(prompt).toContain("No especificadas");
  });
});

describe("buildPlanningPrompt — modalidad y template", () => {
  it("modalidad proyecto se refleja en los datos", () => {
    const prompt = buildPlanningPrompt(makeInput({ modalidad: "proyecto" }));
    expect(prompt).toContain("Modalidad: Por proyecto");
  });

  it("modalidad secuencial por defecto", () => {
    const prompt = buildPlanningPrompt(makeInput());
    expect(prompt).toContain("Modalidad: Secuencial");
  });

  it("respeta el template recibido (precedencia del prompt en DB)", () => {
    const prompt = buildPlanningPrompt(makeInput(), "PLANTILLA-PERSONALIZADA-XYZ");
    expect(prompt).toContain("PLANTILLA-PERSONALIZADA-XYZ");
  });
});
