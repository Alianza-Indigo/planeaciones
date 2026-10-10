import {
  getCamposFormativos,
  getContenidosByGradoAndCampo,
} from "@/lib/curriculum";
import { buildPlanningPrompt, buildMaterialesPrompt } from "@/lib/generation/build-planning-prompt";
import { buildFase, type NivelEdu } from "@/lib/generation/nivel";
import { planningInputSchema, type PlanningInput } from "@/lib/generation/types";

const NIVELES: NivelEdu[] = ["Preescolar", "Primaria", "Secundaria"];
const GRADOS: Record<NivelEdu, number> = {
  Preescolar: 3,
  Primaria: 6,
  Secundaria: 3,
};

const CAMPOS_PRIMARIA = new Set([
  "LENGUAJES", "SABERES Y PENSAMIENTO CIENTÍFICO",
  "ÉTICA, NATURALEZA Y SOCIEDADES", "DE LO HUMANO Y LO COMUNITARIO",
]);
const CAMPOS_PREESCOLAR = new Set([
  "LENGUAJE", "SABERES PENSAMIENTO CIENTÍFICO",
  "ETICA NATURALEZA SOCIEDADES", "HUMANO Y COMUNITARIO",
]);

export function parseGrado(grado: string): { nivel: NivelEdu; numero: number } {
  const match = /^([1-6]) (preescolar|primaria|secundaria)$/i.exec(grado.trim());
  if (!match) throw new Error("Selecciona un nivel y grado válidos.");
  const nivel = NIVELES.find((n) => n.toLowerCase() === match[2])!;
  const numero = Number(match[1]);
  if (numero > GRADOS[nivel]) throw new Error("El grado no corresponde al nivel educativo.");
  return { nivel, numero };
}

function camposPorNivel(grado: string): string[] {
  const { nivel } = parseGrado(grado);
  return getCamposFormativos(grado).filter((campo) => {
    if (nivel === "Primaria") return CAMPOS_PRIMARIA.has(campo);
    if (nivel === "Preescolar") return CAMPOS_PREESCOLAR.has(campo);
    return !CAMPOS_PRIMARIA.has(campo) && !CAMPOS_PREESCOLAR.has(campo);
  });
}

/** Consultas sin sesión: son datos curriculares públicos, idénticos al catálogo web. */
export function consultarCurriculo(grado: string, campo?: string) {
  const campos = camposPorNivel(grado);
  if (!campo) return { grado, campos };
  if (!campos.includes(campo)) throw new Error("Campo no disponible para el grado indicado.");
  return {
    grado,
    campo,
    contenidos: getContenidosByGradoAndCampo(grado, campo),
  };
}

/** Evita enviar contenidos o PDA fabricados a la generación y limita el tamaño. */
export function validarPlaneacion(raw: unknown): PlanningInput {
  const candidate = raw && typeof raw === "object" && !Array.isArray(raw)
    ? { ...(raw as Record<string, unknown>), fase: (raw as Record<string, unknown>).fase || "Fase provisional" }
    : raw;
  const result = planningInputSchema.safeParse(candidate);
  if (!result.success) throw new Error("Datos incompletos o inválidos para la planeación.");
  const input = result.data;
  const { nivel, numero } = parseGrado(input.grado);
  const campos = camposPorNivel(input.grado);
  if (input.campos.length > 4 || input.campos.some((campo) => !campos.includes(campo))) {
    throw new Error("Uno o más campos formativos no corresponden al grado.");
  }
  if (input.modalidad === "secuencial" && input.campos.length !== 1) {
    throw new Error("La modalidad secuencial utiliza un campo formativo.");
  }
  if (nivel === "Secundaria" && (input.campos.length !== 1 || input.modalidad !== "secuencial")) {
    throw new Error("En secundaria selecciona una materia en modalidad secuencial.");
  }
  if (input.contenidos.length > 24 || input.pda.length > 60 ||
      input.contenidos.some((c) => c.length > 600) || input.pda.some((p) => p.length > 1500) ||
      input.proyecto.length > 250 || input.periodoPlaneado.length > 120 ||
      input.nombreDocente.length > 120 || input.nombreEscuela.length > 160 ||
      (input.contextoGrupo?.length ?? 0) > 3000 ||
      (input.materialesDisponibles?.length ?? 0) > 2000) {
    throw new Error("Los datos exceden el tamaño permitido.");
  }

  const seleccionables = input.campos.flatMap((campo) =>
    getContenidosByGradoAndCampo(input.grado, campo),
  );
  const contenidos = new Map(seleccionables.map((c) => [c.titulo, c]));
  if (input.contenidos.some((titulo) => !contenidos.has(titulo))) {
    throw new Error("Los contenidos seleccionados no corresponden al currículo.");
  }
  const pdaValidos = new Set(input.contenidos.flatMap((titulo) => contenidos.get(titulo)?.pda ?? []));
  if (input.pda.some((pda) => !pdaValidos.has(pda))) {
    throw new Error("Los PDA seleccionados no pertenecen a esos contenidos.");
  }
  return {
    ...input,
    grado: input.grado.trim().toLowerCase(),
    fase: buildFase(nivel, numero + "°"),
    campos: [...new Set(input.campos)],
    contenidos: [...new Set(input.contenidos)],
    pda: [...new Set(input.pda)],
  };
}

export function prepararPlaneacion(raw: unknown) {
  const input = validarPlaneacion(raw);
  return {
    input,
    prompt: buildPlanningPrompt(input),
    instrucciones:
      "Genera todas las sesiones solicitadas siguiendo el prompt de ADIA. " +
      "No llames a APIs externas de IA. Utiliza el modelo de esta conversación. " +
      "Si la salida es extensa, entrégala por sesiones completas, sin abreviar. " +
      "No inventes PDA ni contenidos. Al finalizar, ofrece preparar materiales " +
      "con la herramienta preparar_materiales y exportar el documento en DOCX.",
  };
}

export function prepararMateriales(rawInput: unknown, planeacion: string) {
  const input = validarPlaneacion(rawInput);
  if (typeof planeacion !== "string" || planeacion.trim().length < 100 ||
      planeacion.length > 120_000) {
    throw new Error("Se requiere la planeación generada (100 a 120000 caracteres).");
  }
  return {
    prompt: buildMaterialesPrompt(input, planeacion),
    instrucciones: "Genera materiales didácticos completos por sesión en esta conversación, sin Gemini.",
  };
}
