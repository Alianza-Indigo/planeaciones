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

export const MATERIAS_SECUNDARIA = [
  "ESPAÑOL",
  "INGLES",
  "ARTES",
  "MATEMATICAS",
  "CIENCIAS",
  "HISTORIA",
  "FORMACION CIVICA Y ETICA",
  "TECNOLOGIA",
  "TUTORIA",
  "EDUCACION FISICA",
] as const;

export type MateriaSecundaria = (typeof MATERIAS_SECUNDARIA)[number];

export function isMateriaSecundaria(value: string): value is MateriaSecundaria {
  return (MATERIAS_SECUNDARIA as readonly string[]).includes(value);
}

// En la NEM, Ciencias cambia de disciplina en cada grado de secundaria.
export function resolveMateriaSecundaria(materia: MateriaSecundaria, grado: string): string {
  if (materia !== "CIENCIAS") return materia;
  const digit = grado.replace(/\D/g, "");
  if (digit === "1") return "BIOLOGIA";
  if (digit === "2") return "FISICA";
  return "QUIMICA";
}

export function gradoDesdeEtiqueta(value: string): string | null {
  const match = value.match(/[1-3]/);
  return match ? `${match[0]}°` : null;
}

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
