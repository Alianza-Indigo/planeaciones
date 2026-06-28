import { describe, expect, it } from "vitest";

import { quitarMaterialesJsonFiltrado, splitMateriales } from "@/lib/generation/materiales";

describe("quitarMaterialesJsonFiltrado", () => {
  it("elimina el bloque MATERIALES_JSON: sin marcadores que el plan filtra al final", () => {
    const texto = [
      "VERIFICACION FINAL: Se han generado 5 sesiones completas.",
      "",
      "MATERIALES_JSON:",
      "{",
      '  "materiales": [',
      '    {"nombre": "Mapas de la comunidad", "cantidad": 30, "uso": "Sesion 1"},',
      '    {"nombre": "Hojas blancas", "cantidad": 150, "uso": "Todas"}',
      "  ]",
      "}",
    ].join("\n");

    const limpio = quitarMaterialesJsonFiltrado(texto);
    expect(limpio).not.toContain("MATERIALES_JSON");
    expect(limpio).not.toContain("Hojas blancas");
    expect(limpio).toContain("VERIFICACION FINAL");
  });

  it("no toca llaves dentro de cadenas del JSON", () => {
    const texto = 'Plan.\n\nMATERIALES_JSON: {"nota": "usa la llave } aqui", "n": 1}\n';
    expect(quitarMaterialesJsonFiltrado(texto).trim()).toBe("Plan.");
  });

  it("deja intacto el texto cuando no hay bloque filtrado", () => {
    const texto = "PLANEACION DIDACTICA\n\nSESION 1: Algo";
    expect(quitarMaterialesJsonFiltrado(texto)).toBe(texto);
  });

  it("arrastra el marcador de cierre <<<FIN_MATERIALES_JSON>>> si aparece", () => {
    const texto = 'Plan.\n<<<MATERIALES_JSON>>>{"sesiones": []}<<<FIN_MATERIALES_JSON>>>';
    expect(quitarMaterialesJsonFiltrado(texto).trim()).toBe("Plan.");
  });
});

describe("splitMateriales", () => {
  it("extrae el bloque con marcadores y devuelve el texto sin él", () => {
    const texto = 'Documento.\n<<<MATERIALES_JSON>>>{"sesiones":[{"sesion":1}]}<<<FIN_MATERIALES_JSON>>>';
    const { texto: limpio, materiales } = splitMateriales(texto);
    expect(limpio).toBe("Documento.");
    expect(materiales?.sesiones).toHaveLength(1);
  });
});
