import type { CondicionNeuroinclusiva, PlanningInput } from "@/lib/generation/types";

export const defaultPlanningPromptTemplate = `
Eres el Ingeniero de Inclusion Pedagogica de Alianza Indigo.

Tu tarea es generar una planeacion didactica autoejecutable, inclusiva y operativa.
Debe poder aplicarla una persona siguiendo instrucciones literales, sin interpretar.

BLINDAJE DE CALIDAD EDUCATIVA
- Redactar acciones en infinitivo.
- Usar lenguaje operativo, no academico.
- Estructurar cada sesion en INICIO, DESARROLLO y CIERRE.
- Distribuir el tiempo aproximado como 20% inicio, 60% desarrollo y 20% cierre.
- Incluir arreglo fisico, preparacion previa, script del facilitador, preguntas en formato chat con [esperar respuesta], producto esperado y evaluacion formativa.
- No omitir materiales, tiempos, instrucciones del docente, acciones del alumno ni evidencias observables.

BLINDAJE DE INCLUSION
- Adaptar actividades para neurodivergencia, discapacidad motriz, barreras de lenguaje, sobrecarga sensorial y distintas formas de comunicacion.
- Evitar pedir simulacion afectiva o respuestas emocionales forzadas.
- Hacer visibles los productos y evidencias.
- Proponer alternativas de participacion equivalentes.

MATERIALES COMPLEMENTARIOS
- Generar listas de materiales por sesion.
- Incluir instrumentos de evaluacion cuando se soliciten.
- Agregar recursos imprimibles o plantillas descritas con suficiente detalle para crearlas.

FORMATO DE SALIDA
Entregar en Markdown con encabezados claros. No incluir explicaciones sobre el prompt.
`;

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

const condicionesLabels: Record<Exclude<CondicionNeuroinclusiva, "otra">, string> = {
  tdah: "TDAH — Atención, hiperactividad e impulsividad",
  tea: "TEA — Trastorno del espectro autista",
  dislexia: "Dislexia — Dificultades en lectura y escritura",
  discalculia: "Discalculia — Dificultades con números y cálculo",
  disfasia: "Disfasia / DLD — Trastorno del desarrollo del lenguaje",
  discapacidad_intelectual: "Discapacidad intelectual leve a moderada",
  hipersensibilidad_sensorial:
    "Hipersensibilidad sensorial (auditiva, táctil, visual o propioceptiva)",
  altas_capacidades: "Altas capacidades / superdotación",
  dificultades_motoras: "Dificultades motoras (fina o gruesa)",
  ansiedad_escolar: "Ansiedad escolar — Bloqueos, evasión o mutismo selectivo",
};

const formatoSalidaPorNivel: Record<PlanningInput["nivelDetalle"], string> = {
  compacto: `FORMATO DE SALIDA: Compacto. Máximo 2 páginas impresas.
Omitir scripts literales del facilitador.
Solo incluir: objetivo de sesión, actividades en infinitivo,
materiales, producto esperado y un párrafo de adaptaciones generales.`,
  estandar: `FORMATO DE SALIDA: Estándar. Incluir inicio/desarrollo/cierre con
instrucciones operativas. Scripts del facilitador en forma de guía,
no literales. Adaptaciones por sesión en formato de lista.`,
  detallado: `FORMATO DE SALIDA: Detallado. Script literal del facilitador con
[esperar respuesta]. Adaptaciones por momento específico de la actividad.
Materiales por sesión y generales. Instrumentos de evaluación completos.`,
};

function buildNeuroinclusividadSection(input: PlanningInput) {
  const { neuroinclusividad } = input;

  if (!neuroinclusividad.activa || neuroinclusividad.condiciones.length === 0) {
    return `NECESIDADES O BARRERAS A CONSIDERAR
No especificadas`;
  }

  const labels = neuroinclusividad.condiciones
    .filter((condicion): condicion is Exclude<CondicionNeuroinclusiva, "otra"> => condicion !== "otra")
    .map((condicion) => condicionesLabels[condicion]);

  const otra =
    neuroinclusividad.condiciones.includes("otra") && neuroinclusividad.otraDescripcion
      ? `Otra: ${neuroinclusividad.otraDescripcion}`
      : "";

  return `CONDICIONES NEUROINCLUSIVAS PRESENTES EN EL GRUPO
${[...labels, otra].filter(Boolean).join("\n")}

Para CADA condición listada, incluir en CADA sesión:
- Un momento de la actividad donde esta condición genera barrera
- Una estrategia concreta y aplicable para ese momento
- Un material de apoyo específico si aplica`;
}

export function buildPlanningPrompt(input: PlanningInput, template = defaultPlanningPromptTemplate) {
  const inicio = Math.round(input.duracion * 0.2);
  const desarrollo = Math.round(input.duracion * 0.6);
  const cierre = input.duracion - inicio - desarrollo;

  const modalidad =
    input.modalidad === "proyecto"
      ? "Por proyecto (integrar campos formativos en torno al tema detonador)"
      : "Secuencial (una sesión por contenido seleccionado)";

  return `${formatoSalidaPorNivel[input.nivelDetalle]}

${template.trim()}

DATOS DE LA PLANEACION
Docente: ${input.nombreDocente}
Escuela: ${input.nombreEscuela}
Periodo planeado: ${input.periodoPlaneado}
Grado: ${input.grado}
Fase: ${input.fase}
Modalidad: ${modalidad}
Duracion por sesion: ${input.duracion} minutos
Distribucion sugerida: Inicio ${inicio} min, desarrollo ${desarrollo} min, cierre ${cierre} min
Numero de sesiones: ${input.sesiones}
Proyecto: ${input.proyecto}

CAMPOS FORMATIVOS
${list(input.campos)}

CONTENIDOS
${list(input.contenidos)}

PROCESOS DE DESARROLLO DE APRENDIZAJE
${list(input.pda)}

ESTRATEGIAS O PRODUCTOS SOLICITADOS
${input.estrategias.length > 0 ? list(input.estrategias) : "- Planeacion completa"}

CONTEXTO DEL GRUPO
${input.contextoGrupo || "No especificado"}

${buildNeuroinclusividadSection(input)}

MATERIALES DISPONIBLES
${input.materialesDisponibles || "No especificados"}

REQUISITO FINAL
Generar exactamente ${input.sesiones} sesiones. Cada sesion debe contener inicio, desarrollo, cierre, materiales, adaptaciones inclusivas, producto esperado y evaluacion.
`;
}
