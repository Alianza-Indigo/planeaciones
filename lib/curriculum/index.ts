import { loadCurriculumCatalog } from "@/lib/curriculum/load-curriculum";
import type { Contenido } from "@/lib/curriculum/types";

// El catálogo indexa por número de grado ("1".."6"). El formulario maneja
// etiquetas como "2 primaria", por lo que extraemos el dígito de grado.
function normalizeGrado(grado: string): string {
  const match = grado.match(/[1-6]/);
  return match ? match[0] : grado.trim();
}

// Lista de grados disponibles en el catálogo, en orden.
export function getGrados(): string[] {
  return Object.keys(loadCurriculumCatalog()).sort();
}

// Campos formativos de un grado. Sin argumento devuelve la unión de todos los
// grados (sin duplicados), conservando el orden de aparición.
export function getCamposFormativos(grado?: string): string[] {
  const catalog = loadCurriculumCatalog();

  if (grado) {
    const gradoCatalog = catalog[normalizeGrado(grado)];
    return gradoCatalog ? Object.keys(gradoCatalog) : [];
  }

  const campos = new Set<string>();
  for (const gradoCatalog of Object.values(catalog)) {
    for (const campo of Object.keys(gradoCatalog)) {
      campos.add(campo);
    }
  }
  return [...campos];
}

// Contenidos de un grado y campo, cada uno con sus PDA asociados.
export function getContenidosByGradoAndCampo(grado: string, campo: string): Contenido[] {
  const catalog = loadCurriculumCatalog();
  const campoCatalog = catalog[normalizeGrado(grado)]?.[campo];

  if (!campoCatalog) {
    return [];
  }

  return campoCatalog.contenidos.map((titulo) => ({
    id: titulo,
    titulo,
    pda: campoCatalog.byContenido[titulo] ?? [],
  }));
}

// PDA asociados a un contenido. Busca el contenido (su texto es el id) en todo
// el catálogo y devuelve el primer match.
export function getPDAByContenido(contenidoId: string): string[] {
  const catalog = loadCurriculumCatalog();

  for (const gradoCatalog of Object.values(catalog)) {
    for (const campoCatalog of Object.values(gradoCatalog)) {
      const pda = campoCatalog.byContenido[contenidoId];
      if (pda) {
        return pda;
      }
    }
  }

  return [];
}
