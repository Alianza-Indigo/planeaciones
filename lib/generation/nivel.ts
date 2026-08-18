// Nivel educativo, grados por nivel y derivación de etiqueta de grado + fase
// NEM. Fuente de verdad compartida entre el formulario (cliente) y el servidor
// (generación y perfil docente), para que ambos deriven lo mismo.

export const NIVELES = ["Preescolar", "Primaria", "Secundaria"] as const;
export type NivelEdu = (typeof NIVELES)[number];

export const GRADOS_POR_NIVEL: Record<NivelEdu, string[]> = {
  Preescolar: ["1°", "2°", "3°"],
  Primaria: ["1°", "2°", "3°", "4°", "5°", "6°"],
  Secundaria: ["1°", "2°", "3°"],
};

export function isNivel(value: string): value is NivelEdu {
  return (NIVELES as readonly string[]).includes(value);
}

// El grado debe pertenecer al nivel (p. ej. Preescolar no tiene 4°..6°).
export function isGradoValido(nivel: NivelEdu, grado: string): boolean {
  return GRADOS_POR_NIVEL[nivel].includes(grado);
}

// Etiqueta que consume el catálogo/currículo: "3 primaria".
export function buildGradoLabel(nivel: NivelEdu, grado: string): string {
  const digit = grado.replace(/\D/g, "");
  return `${digit} ${nivel.toLowerCase()}`;
}

// Fase NEM derivada del nivel y grado.
export function buildFase(nivel: NivelEdu, grado: string): string {
  const digit = Number(grado.replace(/\D/g, ""));
  if (nivel === "Preescolar") return "Fase 2";
  if (nivel === "Secundaria") return "Fase 6";
  if (digit <= 2) return "Fase 3";
  if (digit <= 4) return "Fase 4";
  return "Fase 5";
}
