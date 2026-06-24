import { describe, expect, it } from "vitest";

import { planningInputSchema } from "@/lib/generation/types";

const base = {
  nombreDocente: "Diana",
  nombreEscuela: "Escuela primaria",
  periodoPlaneado: "Semana 1",
  grado: "3 primaria",
  fase: "Fase 4",
  duracion: 50,
  sesiones: 5,
  proyecto: "Guardianes del entorno",
  campos: ["LENGUAJES"],
  contenidos: ["Escritura de nombres."],
  pda: ["Escribe su nombre."],
};

describe("planningInputSchema", () => {
  it("aplica los defaults de modalidad, nivelDetalle y neuroinclusividad", () => {
    const parsed = planningInputSchema.parse(base);
    expect(parsed.modalidad).toBe("secuencial");
    expect(parsed.nivelDetalle).toBe("estandar");
    expect(parsed.neuroinclusividad).toEqual({ activa: false, condiciones: [] });
    expect(parsed.estrategias).toEqual([]);
  });

  it("coacciona duracion y sesiones desde strings", () => {
    const parsed = planningInputSchema.parse({ ...base, duracion: "90", sesiones: "3" });
    expect(parsed.duracion).toBe(90);
    expect(parsed.sesiones).toBe(3);
  });

  it("rechaza una condición neuroinclusiva inválida", () => {
    const result = planningInputSchema.safeParse({
      ...base,
      neuroinclusividad: { activa: true, condiciones: ["inexistente"] },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza campos vacíos (mínimo 1)", () => {
    const result = planningInputSchema.safeParse({ ...base, campos: [] });
    expect(result.success).toBe(false);
  });

  it("rechaza duracion fuera de rango", () => {
    expect(planningInputSchema.safeParse({ ...base, duracion: 10 }).success).toBe(false);
    expect(planningInputSchema.safeParse({ ...base, duracion: 999 }).success).toBe(false);
  });

  it("acepta una entrada neuroinclusiva completa válida", () => {
    const parsed = planningInputSchema.parse({
      ...base,
      modalidad: "proyecto",
      nivelDetalle: "detallado",
      neuroinclusividad: {
        activa: true,
        condiciones: ["tdah", "dislexia", "otra"],
        otraDescripcion: "Mutismo selectivo",
      },
    });
    expect(parsed.neuroinclusividad.condiciones).toContain("tdah");
    expect(parsed.neuroinclusividad.otraDescripcion).toBe("Mutismo selectivo");
  });
});
