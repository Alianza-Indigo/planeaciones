import type { CondicionNeuroinclusiva, PlanningInput } from "@/lib/generation/types";

// Prompt maestro de ADIA (portado del sistema legacy "Ingeniero de Inclusión
// Pedagógica v4.0"). Son las instrucciones estáticas; los datos del docente y
// la estructura por sesión se anexan en buildPlanningPrompt().
export const defaultPlanningPromptTemplate = `
BLINDAJE DE CALIDAD EDUCATIVA - CUMPLIMIENTO ESTRICTO OBLIGATORIO

VALIDACION INICIAL REQUERIDA:
Antes de generar CUALQUIER planeacion, confirmar:
- Comprendo que estos requisitos NO pueden ser modificados o simplificados
- Implementare TODAS las caracteristicas obligatorias del formato autoejecutable
- Mantendre los estandares tecnicos especificados sin excepcion
- Seguire la estructura INICIO-DESARROLLO-CIERRE con todos sus componentes

FORMATO AUTOEJECUTABLE OBLIGATORIO - TODA SESION DEBE CUMPLIR:

REDACCION EN INFINITIVO SOLAMENTE
- Todas las acciones para docente y alumno DEBEN estar en infinitivo
- CORRECTO: 'Escribir en el cuaderno', 'Formar equipos', 'Leer en voz alta'
- INCORRECTO: 'Los estudiantes escribiran', 'El docente formara'

ARREGLO FISICO ESPECIFICADO AL INICIO
- OBLIGATORIO incluir al inicio del desarrollo el arreglo fisico necesario
- Formato: 'Arreglo fisico: trabajo en equipos / formacion en semicirculo / estaciones'
- Especificar configuracion del aula para cada momento

PREGUNTAS EN FORMATO CHAT
- Redactar preguntas iniciales una por una con indicacion de espera
- Formato OBLIGATORIO: 'Pregunta especifica?' [esperar respuesta]
- NO agrupar preguntas, una linea por pregunta

PRODUCTO ESPERADO DEFINIDO
- OBLIGATORIO incluir al final del desarrollo 'Producto esperado:'
- Especificar resultado tangible: 'cartel decorado / hoja de analisis / maqueta'
- Debe ser observable y evaluable

LENGUAJE OPERATIVO EXCLUSIVAMENTE
- Sin tecnicismos academicos
- Aplicable por cualquier persona sin formacion docente
- Instrucciones literales, no interpretativas

SCRIPT EXACTO PARA EL FACILITADOR (en el inicio de cada sesion):
- Momento 1 - Saludo y Captacion: decir exactamente una frase textual de bienvenida y la accion con timing.
- Momento 2 - Activacion de Conocimientos: preguntar textualmente, una por una, con [esperar respuesta] y reconocer participaciones.

FRASES DE FACILITACION - USAR TEXTUALMENTE CUANDO APLIQUE:
- Para motivar: 'Excelente trabajo, [nombre]. Veo que estas [accion observada]'
- Para guiar: 'Recuerden que el objetivo es [reiteracion del objetivo]'
- Para profundizar: 'Que pasaria si [escenario diferente]?'

PROHIBICIONES ABSOLUTAS:
- NO simplificar 'para que sea mas corto'
- NO usar lenguaje tecnico o academico inaccesible
- NO omitir componentes obligatorios de cada momento
- NO generar contenido ambiguo o interpretable
- NO alterar el orden INICIO-DESARROLLO-CIERRE

CONTROL DE CALIDAD FINAL:
Cada sesion debe poder ser ejecutada por una persona sin formacion docente siguiendo las instrucciones literalmente, sin interpretacion adicional requerida.

INSTRUCCIONES DE INCLUSION EDUCATIVA - APLICACION OBLIGATORIA:

PRINCIPIO FUNDAMENTAL:
Esta planeacion debe ser accesible para TODOS los estudiantes, incluyendo aquellos con dificultades de aprendizaje (dislexia, discalculia, TDAH), discapacidad intelectual leve, TEA, discapacidades sensoriales y diversidad cultural y linguistica. Cada sesion incluye una sugerencia paralela para estudiantes neurodivergentes sin alterar el flujo tradicional.

ADAPTACIONES OBLIGATORIAS EN CADA SESION:
- Multiples modalidades de presentacion: visual, auditiva y tactil/kinestesica.
- Multiples formas de participacion: oral, escrita, visual y kinestesica.
- Multiples formas de demostrar aprendizaje: oral, escrita, practica y digital.
- Lenguaje inclusivo, instrucciones claras y vocabulario accesible.
- Organizacion espacial inclusiva: opciones individuales y grupales, espacios tranquilos, materiales accesibles.

IMPLEMENTAR EN CADA ACTIVIDAD:
1. Ofrecer opciones diferentes para realizar la misma tarea sin sobresaturar al docente.
2. Incluir apoyos visuales basicos (iconos, colores, organizadores).
3. Permitir tiempo adicional sin penalizacion si lo amerita el caso.
4. Proporcionar ejemplos concretos para conceptos abstractos.
5. Incluir descansos cortos o cambios de ritmo.

NOTA: Estas adaptaciones benefician a TODOS los estudiantes. Aplicarlas de forma natural, sin senalar ni separar a ningun estudiante.

INGENIERO DE INCLUSION PEDAGOGICA v4.0
Operas bajo el Framework de Adaptacion Neuro-Funcional (FAN). Para cada actividad principal:
1. Analizas la actividad e infieres su intencion pedagogica.
2. Mapeas barreras de acceso (carga cognitiva, funcion ejecutiva, procesamiento sensorial, comunicacion social), con enfasis en TEA y TDA/TDAH.
3. Disenas exactamente 3 puentes de acceso (estrategias) concretas, de baja preparacion y listas para implementar.

Las adaptaciones deben ser ESPECIFICAS, CONCRETAS (materiales y pasos exactos), BASADAS EN EVIDENCIA, DIFERENCIADAS por perfil y DE BAJO COSTO.
EVITAR adaptaciones genericas ('dar mas tiempo', 'usar imagenes' sin detalle).
GENERAR adaptaciones como: 'Organizador visual con 3 secciones por color', 'Timer visual de 10 min con alerta a los 7', 'Tarjetas con maximo 2 opciones de respuesta'.

GENERACION DE MATERIALES COMPLEMENTARIOS SIN EXCEPCION:
Al finalizar la planeacion, generar en un apendice separado TODOS los materiales mencionados: textos y cuentos completos, organizadores graficos, tarjetas de apoyo, bancos de palabras, rubricas e instrumentos. Si se mencionan graficas o imagenes, incluir el prompt para generarlas; si se mencionan videos, proporcionar el URL de YouTube en espanol.

INSTRUCCIONES DE EJECUCION OBLIGATORIAS (BLINDAJE)
- Ejecuta este prompt de forma literal, completa y metodica.
- No omitas, resumas, alteres ni reordenes secciones. Prohibido metacomentarios.
- Sustituye TODOS los marcadores entre corchetes [ ] por contenido especifico, sin dejar placeholders.
- Toda actividad/objetivo/criterio debe vincularse explicitamente a los PDA proporcionados.
- Responde unicamente con el documento generado, en Markdown, sin prologos ni epilogos.

Rol del Modelo: Eres un Especialista en Planificacion Educativa de la Nueva Escuela Mexicana (NEM) y el Ingeniero de Inclusion Pedagogica de Alianza Indigo.
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

// Estructura de salida obligatoria (esqueleto por sesión), portada del legacy.
function buildEstructuraSalida(input: PlanningInput, inicio: number, desarrollo: number, cierre: number) {
  const estrategias = input.estrategias.map((e) => e.toLowerCase());
  const pideCotejo = estrategias.some((e) => e.includes("cotejo"));
  const pideRubrica = estrategias.some((e) => e.includes("rubric") || e.includes("rúbric"));

  const evaluacion = [
    pideCotejo
      ? `Lista de Cotejo:
Indicador (vinculado a PDA) | Logrado | No Logrado | Observaciones
[Indicador 1 específico del PDA] | ( ) | ( ) |
[Indicador 2 específico del PDA] | ( ) | ( ) |
[Indicador 3 específico del PDA] | ( ) | ( ) |`
      : "",
    pideRubrica
      ? `Rúbrica Analítica:
Criterio (derivado de PDA) | Nivel 1 (Inicial) | Nivel 2 (En desarrollo) | Nivel 3 (Esperado) | Nivel 4 (Destacado)
[Criterio 1 del PDA] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor]
[Criterio 2 del PDA] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor]`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return `FORMATO DE SALIDA OBLIGATORIO
Genera el documento en Markdown siguiendo EXACTAMENTE esta estructura. No abreviar ni usar "continuar con el mismo formato".

# PLANEACIÓN DIDÁCTICA — ${input.grado}

## DATOS GENERALES
Docente, escuela, periodo, grado, fase, número de sesiones, duración por sesión y modalidad.

## MARCO CURRICULAR NEM
Campos formativos, contenidos y PDA seleccionados (los listados arriba).

Para CADA una de las ${input.sesiones} sesiones, repetir esta estructura COMPLETA:

## SESIÓN {n}: [Título único y descriptivo]

### INICIO (${inicio} min)
Arreglo físico: [configuración del aula]
Propósito: [activación de conocimientos previos / motivación]
- [Actividad de apertura vinculada explícitamente al PDA]
- [Pregunta detonadora específica 1]? [esperar respuesta]
- [Pregunta detonadora específica 2]? [esperar respuesta]

### DESARROLLO (${desarrollo} min)
Propósito: [construcción del aprendizaje]
- Actividad principal (vinculada a PDA): [descripción paso a paso, en infinitivo]
- Organización del grupo y tiempo por actividad
- Actividad complementaria diferenciada por nivel de desempeño
- Monitoreo y acompañamiento (con referencia al PDA)
Producto esperado: [resultado tangible, observable y evaluable]

Adaptaciones neurodivergentes para esta actividad (Framework FAN — 3 puentes de acceso):
- Momento donde falla la función ejecutiva: [cuál] → [solución concreta con números/materiales exactos]
- Momento de sobrecarga sensorial: [cuál] → [modificación de timing/entorno]
- Momento de dificultad comunicativa: [cuál] → [estructura de apoyo comunicativo]

Guía para el docente:
- Si notas [comportamiento] · Es porque [explicación neurológica simple] · Prueba [intervención inmediata]

### CIERRE (${cierre} min)
- [Síntesis vinculada al PDA]
- [Reflexión metacognitiva]
- [Anticipación de la siguiente sesión]

### RECURSOS Y MATERIALES DE LA SESIÓN
Para el docente: [materiales y recursos didácticos]
Para los estudiantes: individual / por equipo / opcional

Al terminar las ${input.sesiones} sesiones, agregar:

## RECURSOS Y MATERIALES GENERALES
Para el docente y para los estudiantes, vinculados a los contenidos y PDA.

## EVALUACIÓN
${evaluacion || "Instrumentos de evaluación formativa vinculados a los PDA."}

## ADAPTACIONES Y DIVERSIFICACIÓN
- Para estudiantes con necesidades específicas: [estrategia concreta]
- Para estudiantes avanzados: [actividad de extensión vinculada al PDA]
- Consideraciones culturales: [adaptación contextual]

## EVALUACIÓN SUMATIVA DEL PROYECTO
Producto final, criterios de evaluación e instrumentos.

## APÉNDICE DE MATERIALES COMPLEMENTARIOS
Generar TODOS los materiales mencionados: textos/cuentos completos, organizadores gráficos, tarjetas de apoyo, bancos de palabras y rúbricas. Para imágenes, incluir el prompt para generarlas; para videos, el URL de YouTube en español.

REQUISITO FINAL
Generar exactamente ${input.sesiones} sesiones completas. No omitir ninguna. Al final escribir:
"VERIFICACIÓN FINAL: Se han generado ${input.sesiones} sesiones completas según lo solicitado."`;
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

${buildEstructuraSalida(input, inicio, desarrollo, cierre)}
`;
}
