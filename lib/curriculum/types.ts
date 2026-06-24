// Tipos del catálogo curricular NEM (data/con-plan.json).
//
// Estructura real del JSON:
//   { [grado: "1".."6"]: { [campoFormativo]: CampoCurriculum } }
//
// Cada campo formativo expone la lista plana de contenidos, la lista plana de
// PDA y el mapa `byContenido` que asocia cada contenido (su texto es su
// identificador) con sus procesos de desarrollo de aprendizaje.

export interface CampoCurriculum {
  contenidos: string[];
  pda: string[];
  byContenido: Record<string, string[]>;
}

export type GradoCurriculum = Record<string, CampoCurriculum>;

export type CurriculumCatalog = Record<string, GradoCurriculum>;

// Vista normalizada de un contenido para los selects en cascada del formulario.
// El texto del contenido funciona como identificador estable.
export interface Contenido {
  id: string;
  titulo: string;
  pda: string[];
}
