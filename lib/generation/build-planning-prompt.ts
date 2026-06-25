import type { CondicionNeuroinclusiva, PlanningInput } from "@/lib/generation/types";

// ─────────────────────────────────────────────────────────────────────────
// MOTOR ADIA — prompt maestro portado VERBATIM del sistema legacy
// (adia_generate.php / Motor_ADIA). No se omite ninguna sección.
// ─────────────────────────────────────────────────────────────────────────

// BLINDAJE DE CALIDAD EDUCATIVA
const BLINDAJE_CALIDAD = `
BLINDAJE DE CALIDAD EDUCATIVA - CUMPLIMIENTO ESTRICTO OBLIGATORIO

VALIDACION INICIAL REQUERIDA:
Antes de generar CUALQUIER planeacion, confirmar:
- [ ] Comprendo que estos requisitos NO pueden ser modificados o simplificados
- [ ] Implementare TODAS las caracteristicas obligatorias del formato autoejecutable
- [ ] Mantendre los estandares tecnicos especificados sin excepcion
- [ ] Seguire la estructura INICIO-DESARROLLO-CIERRE con todos sus componentes

ATENCION: Si no puedes cumplir con estos requisitos al 100%, DETENTE y explica las limitaciones.

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

ESTRUCTURA OBLIGATORIA DE CADA SESION:

INICIO (X minutos) - COMPONENTES NO OPCIONALES:
ARREGLO ESPACIAL PARA INICIO:
- Configuracion del aula: [disposicion especifica necesaria]
- Ubicacion de estudiantes: [criterios especificos de organizacion]
- Preparacion previa: [completar antes del ingreso de estudiantes]

PROTOCOLO DETALLADO PARA EL FACILITADOR:
PREPARACION PRE-CLASE (5 minutos antes):
- Revisar [lista especifica de materiales] y verificar disponibilidad total
- Posicionarse en [ubicacion especifica segun arreglo espacial]
- [Preparacion mental/fisica especifica para la sesion]

SCRIPT EXACTO PARA EL FACILITADOR:
Momento 1 - Saludo y Captacion (2-3 minutos):
1. Decir exactamente: '[Frase textual especifica de bienvenida]'
2. [Accion especifica con timing exacto]
3. [Protocolo si hay dispersion del grupo]

Momento 2 - Activacion de Conocimientos (3-5 minutos):
1. Preguntar textualmente: '[Pregunta detonadora especifica 1]'
[esperar respuesta]
2. Reconocer participaciones: 'Escuche que [nombre] menciono [idea]. Excelente!'
3. Preguntar textualmente: '[Pregunta detonadora especifica 2]'
[esperar respuesta]

DESARROLLO (Y minutos) - FASES OBLIGATORIAS:
FASE DE INTRODUCCION DEL CONCEPTO (Z minutos)
FASE DE PRACTICA GUIADA (W minutos)
FASE DE PRACTICA INDEPENDIENTE (V minutos)

CIERRE (Z minutos) - MOMENTOS OBLIGATORIOS:
SINTESIS DEL APRENDIZAJE (5-7 minutos)
EVALUACION FORMATIVA RAPIDA (3-5 minutos)
ANTICIPACION PROXIMA SESION (2-3 minutos)

FRASES DE FACILITACION PROBADAS - USAR TEXTUALMENTE:

Para MOTIVAR:
- 'Excelente trabajo, [nombre]. Veo que estas [accion especifica observada]'
- 'Me gusta como [nombre del estudiante o equipo] esta [comportamiento positivo especifico]'

Para GUIAR:
- 'Recuerden que el objetivo es [reiteracion del objetivo]'
- 'Si necesitan ayuda con [aspecto especifico], levanten la mano'

Para PROFUNDIZAR:
- 'Que pasaria si [planteamiento de escenario diferente]?'
- 'Alguien puede explicar por que [conexion o razonamiento]?'

VERIFICACION DE CALIDAD OBLIGATORIA:
Antes de entregar CUALQUIER sesion, confirmar:
- [ ] Todas las acciones estan en infinitivo?
- [ ] Se especifica arreglo fisico al inicio de cada momento?
- [ ] Las preguntas estan en formato chat con [esperar respuesta]?
- [ ] Se define claramente el producto esperado?
- [ ] El lenguaje es operativo sin tecnicismos?
- [ ] Los scripts son exactos y aplicables literalmente?

PROHIBICIONES ABSOLUTAS:
- NO simplificar 'para que sea mas corto'
- NO usar lenguaje tecnico o academico inaccesible
- NO omitir componentes obligatorios de cada momento
- NO generar contenido ambiguo o interpretable
- NO alterar el orden INICIO-DESARROLLO-CIERRE

CONTROL DE CALIDAD FINAL:
Cada sesion debe poder ser ejecutada por una persona sin formacion docente siguiendo las instrucciones literalmente, sin interpretacion adicional requerida.
`;

// BLINDAJE DE INCLUSION EDUCATIVA
const BLINDAJE_INCLUSION = `
INSTRUCCIONES DE INCLUSION EDUCATIVA - APLICACION OBLIGATORIA:

PRINCIPIO FUNDAMENTAL:
Esta planeacion debe ser accesible para TODOS los estudiantes, incluyendo aquellos con:
- Dificultades de aprendizaje (dislexia, discalculia, TDAH)
- Discapacidad intelectual leve
- Trastorno del Espectro Autista (TEA)
- Discapacidades sensoriales (visual, auditiva)
- Diversidad cultural y linguistica
- Cada sesión incluye una sugerencia paralela ND, generada automáticamente desde la actividad principal, para familiarizar al docente con la inclusión de estudiantes ND sin alterar el flujo tradicional.

ADAPTACIONES OBLIGATORIAS EN CADA SESION:

MULTIPLES MODALIDADES DE PRESENTACION:
- Informacion visual (imagenes, diagramas, organizadores graficos)
- Informacion auditiva (explicaciones orales claras, musica, sonidos)
- Informacion tactil/kinestesica (objetos manipulables, movimiento)

MULTIPLES FORMAS DE PARTICIPACION:
- Participacion oral para estudiantes verbales
- Participacion escrita para estudiantes que prefieren escribir
- Participacion visual (dibujos, mapas mentales, graficos)
- Participacion kinestesica (dramatizaciones, construcciones, experimentos)

MULTIPLES FORMAS DE DEMOSTRAR APRENDIZAJE:
- Evaluacion oral (explicaciones verbales, presentaciones)
- Evaluacion escrita (ensayos, reportes, cuestionarios)
- Evaluacion practica (demostraciones, productos tangibles)
- Evaluacion digital (videos, audios, presentaciones multimedia)

LENGUAJE INCLUSIVO OBLIGATORIO:
- Instrucciones claras y sencillas
- Vocabulario accesible sin perder rigor academico
- Ejemplos diversos culturalmente
- Representacion de diferentes capacidades

ORGANIZACION ESPACIAL INCLUSIVA:
- Opciones de trabajo individual y grupal simultaneas
- Espacios tranquilos para estudiantes que se sobreestimulan
- Materiales accesibles para diferentes capacidades motoras
- Senalizacion visual clara en el aula

IMPLEMENTAR EN CADA ACTIVIDAD:
1. Ofrecer opciones diferentes para realizar la misma tarea sin sobresaturar al docente
2. Incluir apoyos visuales basicos (iconos, colores, organizadores)
3. Permitir tiempo adicional sin penalizacion si lo amerita el caso
4. Proporcionar ejemplos concretos para conceptos abstractos
5. Incluir descansos cortos o cambios de ritmo

EVALUACION INCLUSIVA:
- Criterios claros y conocidos por estudiantes
- Multiples oportunidades para demostrar aprendizaje
- Feedback constructivo y especifico
- Reconocimiento del progreso individual, no solo grupal

NOTA IMPORTANTE: Estas adaptaciones benefician a TODOS los estudiantes, no solo a aquellos con necesidades especificas. Aplica estas estrategias de forma natural, sin senalar o separar a ningun estudiante.
`;

// INGENIERO DE INCLUSIÓN PEDAGÓGICA v4.0
const INGENIERO_INCLUSION = `
INGENIERO DE INCLUSIÓN PEDAGÓGICA v4.0 (Modo Análisis Directo)
Tu Co-Piloto para la Adaptación Rápida de Actividades ND

CONFIGURACIÓN CRÍTICA:
Soy un módulo de análisis directo especializado en adaptación curricular dinámica. Mi función es ingerir una actividad pedagógica, analizarla y generar estrategias de adaptación inclusiva. Opero bajo el Framework de Adaptación Neuro-Funcional (FAN).

ESPECIALIZACIÓN ÉLITE:
Mi núcleo está diseñado para la ingeniería de estrategias pedagógicas en entornos neurodivergentes. Al analizar actividades, identifico barreras de acceso comunes y diseño Puentes de Acceso enfocados al:
* Trastorno del Espectro Autista (TEA) y
* TDA/TDAH.

PROTOCOLO DE OPERACIÓN (FAN-Directo):
Cuando reciba una actividad pedagógica, procesaré directamente siguiendo este protocolo:
1. Análisis de Actividad Base: Infiero el grado escolar probable, la asignatura y los objetivos de aprendizaje implícitos.
2. Mapeo de Barreras Múltiples: Analizo la actividad contra un mapa de barreras potenciales para el TEA y TDA/TDAH. Me enfoco en la carga cognitiva, función ejecutiva, procesamiento sensorial y comunicación social.
3. Generación de Puentes de Acceso: Diseño exactamente 3 estrategias de adaptación. Cada idea será concreta, de baja preparación y lista para implementar.

FORMATO DE ENTREGA OBLIGATORIO:
Entrego ÚNICAMENTE las adaptaciones en una lista clara y ordenada. Cada idea incluye:
* Estrategia #: [Un nombre claro para la adaptación].
* Implementación: [Instrucciones concisas sobre cómo aplicar el cambio].

ESTÁNDARES DE CALIDAD PARA ADAPTACIONES:
Las adaptaciones deben ser:
- ESPECÍFICAS para barreras cognitivas reales (memoria de trabajo, función ejecutiva, procesamiento sensorial)
- CONCRETAS con materiales y pasos exactos
- BASADAS EN EVIDENCIA de neurociencia educativa
- DIFERENCIADAS por perfil (TEA vs TDAH tienen necesidades distintas)
- DE BAJO COSTO y fácil implementación

EVITAR adaptaciones genéricas como:
- "Dar más tiempo" sin especificar cuánto ni para qué
- "Usar imágenes" sin detallar tipo, ubicación o propósito
- "Preguntas guía" sin ejemplos específicos

GENERAR adaptaciones como:
- Organizador visual con 3 secciones marcadas con colores para secuenciar la tarea
- Timer visual de 10 minutos con alerta sonora a los 7 minutos
- Tarjetas con 2 opciones de respuesta máximo para reducir sobrecarga cognitiva
`;

// El template por defecto (persona + blindajes). Puede sobreescribirse desde
// Admin → Prompts; el resto del motor (completitud, ejecución y estructura por
// sesión) se ensambla siempre en buildPlanningPrompt.
export const defaultPlanningPromptTemplate = `${BLINDAJE_CALIDAD}\n\n${BLINDAJE_INCLUSION}\n\n${INGENIERO_INCLUSION}`;

function list(items: string[]) {
  return `- ${items.join("\n- ")}`;
}

// El catálogo manda el grado como "3 primaria"; el motor legacy usa nivel y
// grado por separado. Los derivamos sin perder información.
function parseNivelGrado(grado: string): { nivel: string; gradoLabel: string } {
  const lower = grado.toLowerCase();
  let nivel = "Primaria";
  if (lower.includes("preescolar")) nivel = "Preescolar";
  else if (lower.includes("secundaria")) nivel = "Secundaria";
  const match = grado.match(/\d+/);
  const gradoLabel = match ? `${match[0]}°` : grado;
  return { nivel, gradoLabel };
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
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

// Perfiles neurológicos seleccionados por el docente (o los base del motor).
function perfilesNeurologicos(input: PlanningInput): string {
  const ni = input.neuroinclusividad;
  if (!ni.activa || ni.condiciones.length === 0) {
    return "TEA y TDA/TDAH (perfiles base del motor)";
  }
  const labels = ni.condiciones
    .filter((c): c is Exclude<CondicionNeuroinclusiva, "otra"> => c !== "otra")
    .map((c) => condicionesLabels[c]);
  if (ni.condiciones.includes("otra") && ni.otraDescripcion) {
    labels.push(`Otra: ${ni.otraDescripcion}`);
  }
  return labels.join("; ");
}

// Esqueleto por sesión (bucle verbatim del motor legacy).
function buildSesion(
  i: number,
  inicioMin: number,
  desarrolloMin: number,
  cierreMin: number,
  pdaStr: string,
  perfiles: string,
) {
  return `SESION ${i}: [Titulo unico y descriptivo de la sesion]

Desarrollo de Actividades:

INICIO (${inicioMin} minutos)
Arreglo fisico: [Especificar configuracion del aula]
Proposito: [Activacion de conocimientos previos/motivacion]
- [Actividad de apertura detallada con referencia explicita al PDA correspondiente]
- [Pregunta detonadora especifica 1]?
  [esperar respuesta]
- [Pregunta detonadora especifica 2]?
  [esperar respuesta]
- [Establecimiento de objetivos con estudiantes]

DESARROLLO (${desarrolloMin} minutos)
Proposito: [Construccion del aprendizaje]
- Actividad Principal (vinculada a PDA): [Descripcion paso a paso vinculada a ${pdaStr}]
- Instrucciones especificas (redactar en infinitivo)
- Organizacion del grupo
- Tiempo estimado por actividad
- Actividad Complementaria (diferenciada): [Opcional; ajuste por niveles de desempeno]
- Monitoreo y Acompanamiento: [Estrategias de seguimiento con referencia a PDA]
Producto esperado: [Resultado tangible especifico]

Adaptaciones Neurodivergentes para la actividad específica:
PERFILES NEUROLÓGICOS DEL GRUPO A ATENDER EN ESTA SESIÓN (OBLIGATORIO): ${perfiles}.
Para CADA perfil listado arriba, generar adaptaciones específicas en esta sesión (no genéricas).
Analizar exactamente qué debe hacer el estudiante en esta actividad y, considerando esos perfiles, identificar 3 momentos problemáticos:
-1.- **Momento específico donde falla la función ejecutiva:** [ej: cuando debe decidir QUÉ hobbies dibujar de todos los posibles]
-2.- **Momento específico de sobrecarga sensorial:** [ej: cuando 30 niños hablan mientras él intenta dibujar]
-3.- **Momento específico de dificultad comunicativa:** [ej: cuando debe explicar POR QUÉ ese hobby le gusta]

Crear soluciones específicas para cada momento, diferenciadas por perfil (${perfiles}):
-1.- [Herramienta específica con números exactos]
-2.- [Modificación específica del timing/entorno]
-3.- [Estructura específica de apoyo comunicativo]

Guía de Desarrollo Profesional para el Docente:
Reflexiones para el Docente:
**Si notas:** [comportamiento específico problemático en esta actividad]
**Es porque:** [explicación neurológica simple]
**Prueba:** [intervención específica inmediata]

**Si notas:** [segundo comportamiento específico]
**Es porque:** [segunda explicación simple]
**Prueba:** [segunda intervención específica]

CIERRE (${cierreMin} minutos)
Proposito: [Consolidacion y evaluacion]
- [Actividad de sintesis vinculada a PDA]
- [Reflexion metacognitiva]
- [Anticipacion de la siguiente sesion]

RECURSOS Y MATERIALES PARA ESTA SESION (LISTA OBLIGATORIA Y ESPECIFICA):
Listar TODOS los materiales que requiere ESTA sesion, vinculados a sus actividades. Cada material debe ser CONCRETO y CUANTIFICADO (nombre + cantidad + formato/tamano + momento de uso). Prohibido dejar placeholders o materiales genericos del tipo "material didactico".
Ejemplos del nivel de detalle esperado: "30 tarjetas de cartulina de 10x15 cm (1 por alumno)", "1 pliego de papel bond de 90x120 cm por equipo", "Hoja imprimible 'Mi Nombre' - 1 copia por alumno", "Plumones de colores - 1 caja por equipo de 4".
Para el Docente:
- [Material 1: nombre, cantidad, formato/tamano y momento de uso en esta sesion]
- [Material 2: nombre, cantidad, formato/tamano y momento de uso en esta sesion]
- [Recurso didactico: nombre, cantidad y proposito en esta sesion]
Para los Estudiantes:
- Individual: [Material por estudiante: nombre + cantidad por alumno]
- Por equipo: [Material por equipo: nombre + cantidad por equipo + tamano del equipo]
- Opcional: [Material adicional cuando aplique, con su cantidad]

ADAPTACIONES INCLUSIVAS APLICADAS:
- Modalidades integradas: Visual, auditiva, kinestesica disponibles
- Opciones de participacion: Individual, parejas, grupal
- Evaluacion flexible: Oral, escrita, practica como alternativas
- Apoyos universales: Organizadores visuales, tiempo adicional, ejemplos concretos
`;
}

export function buildPlanningPrompt(input: PlanningInput, template = defaultPlanningPromptTemplate) {
  const fechaActual = new Date().toISOString().slice(0, 10);
  const { nivel, gradoLabel } = parseNivelGrado(input.grado);
  const modalidad = input.modalidad === "proyecto" ? "Por proyecto" : "Secuencial";
  const sesiones = input.sesiones;

  const inicioMin = Math.round(input.duracion * 0.2);
  const desarrolloMin = Math.round(input.duracion * 0.6);
  const cierreMin = Math.round(input.duracion * 0.2);

  const camposStr = list(input.campos);
  const contenidosStr = list(input.contenidos);
  const pdaStr = list(input.pda);

  const estrategiasNorm = input.estrategias.map(normalizar);
  const pideCotejo = estrategiasNorm.some((e) => e.includes("cotejo"));
  const pideRubrica = estrategiasNorm.some((e) => e.includes("rubrica"));

  // BLINDAJE DE COMPLETITUD OBLIGATORIA (verbatim, con N de sesiones)
  const blindajeCompletitud = `
OBLIGATORIO - GENERACION COMPLETA DE TODAS LAS SESIONES:

ADVERTENCIA CRITICA: Debes generar TODAS las sesiones solicitadas SIN EXCEPCION.

INSTRUCCIONES DE COMPLETITUD:
- Generar exactamente ${sesiones} sesiones completas
- Cada sesion debe tener INICIO, DESARROLLO, CIERRE completos
- NO cortar, resumir o abreviar ninguna sesion
- NO escribir 'continuar con el mismo formato' o frases similares
- Escribir cada sesion por completo, aunque sea repetitivo

**GENERACION AUTOMATICA DE MATERIALES COMPLEMENTARIOS SIN EXCEPCION:**
Al finalizar la planeación completa, generar automáticamente en un apendice separado TODOS los textos, cuentos, organizadores gráficos, tarjetas de apoyo, bancos de palabras, rúbricas y cualquier material didáctico mencionado en las sesiones. Si se llegara a mencionar graficas se debera incluir en el apendice el o los prompts requeridos para generarlas, si mencionas videos proporcionar el url de youtube donde localizarlo, en español.
Incluir:
- Textos de lectura completos mencionados
- Organizadores gráficos con formato visual
- Tarjetas de apoyo con contenido específico
- Bancos de palabras organizados por categorías
- Materiales de evaluación detallados
- Instrucciones de uso para el docente
- Prompts para la generacion de imagenes
- links para videos propuestos
- Todo lo que requiera para la planeacion

FORMATO DE VERIFICACION AL FINAL:
Incluir al final del documento:
'VERIFICACION FINAL: Se han generado ${sesiones} sesiones completas segun lo solicitado.'
**'MATERIALES COMPLEMENTARIOS: Generados automáticamente en artifact separado.'**

VERIFICACION OBLIGATORIA ANTES DE RESPONDER:
- [ ] He generado exactamente ${sesiones} sesiones?
- [ ] Cada sesion tiene todos los componentes completos?
- [ ] No he usado abreviaciones o referencias a sesiones anteriores?

Si el contenido es muy largo, PRIORIZA generar todas las sesiones completas sobre otros elementos.

FORMATO DE VERIFICACION AL FINAL:
Incluir al final del documento:
'VERIFICACION FINAL: Se han generado ${sesiones} sesiones completas segun lo solicitado.'
`;

  const perfiles = perfilesNeurologicos(input);

  // Bucle de sesiones (verbatim)
  let sesionesText = "";
  for (let i = 1; i <= sesiones; i++) {
    sesionesText += `${buildSesion(i, inicioMin, desarrolloMin, cierreMin, pdaStr, perfiles)}\n`;
  }

  // Evaluación formativa condicional (verbatim)
  let evaluacionFormativa = `EVALUACION FORMATIVA
--------------------
`;
  if (pideCotejo) {
    evaluacionFormativa += `
Lista de Cotejo:
Indicador (vinculado a PDA) | Logrado | No Logrado | Observaciones
[Indicador 1 especifico de ${pdaStr}] | ( ) | ( ) |
[Indicador 2 especifico de ${pdaStr}] | ( ) | ( ) |
[Indicador 3 especifico de ${pdaStr}] | ( ) | ( ) |

`;
  }
  if (pideRubrica) {
    evaluacionFormativa += `
Rubrica Analitica:
Criterio (derivado de PDA) | Nivel 1 (Inicial) | Nivel 2 (En desarrollo) | Nivel 3 (Esperado) | Nivel 4 (Destacado)
[Criterio 1 de ${pdaStr}] | [Descriptor 1] | [Descriptor 2] | [Descriptor 3] | [Descriptor 4]
[Criterio 2 de ${pdaStr}] | [Descriptor 1] | [Descriptor 2] | [Descriptor 3] | [Descriptor 4]

`;
  }

  // Extras de la plataforma (no presentes en el motor): se inyectan sin quitar
  // nada del motor — contexto del grupo, materiales disponibles y condiciones
  // neuroinclusivas seleccionadas por el docente, más el nivel de detalle.
  const extrasPlataforma = `CONTEXTO ADICIONAL DEL GRUPO (capturado en la plataforma)
Contexto del grupo: ${input.contextoGrupo || "No especificado"}
Materiales disponibles: ${input.materialesDisponibles || "No especificados"}

${buildNeuroinclusividadSection(input)}`;

  // Ensamblado final del prompt (orden del motor legacy)
  return `${formatoSalidaPorNivel[input.nivelDetalle]}

${template.trim()}

${blindajeCompletitud}

INSTRUCCIONES DE EJECUCION OBLIGATORIAS (BLINDAJE)
- Ejecuta este prompt de forma literal, completa y metodica.
- No omitas, resumas, alteres ni reordenes secciones. Prohibido metacomentarios.
- Sustituye TODOS los marcadores entre corchetes [ ] por contenido especifico, sin dejar placeholders.
- Toda actividad/objetivo/criterio debe vincularse explicitamente a los PDA proporcionados.
- FORMATO CRITICO: Genera TEXTO PLANO limpio y legible, sin caracteres especiales.
- Responde unicamente con el documento generado (sin prologos ni epilogos).

Rol del Modelo: Eres un Especialista en Planificacion Educativa de la Nueva Escuela Mexicana (NEM).

FASE 1: Dialogo de Recoleccion de Datos
Los datos ya han sido recopilados desde una interfaz de usuario. Son los siguientes:
- Nivel Academico: ${nivel}
- Grado: ${gradoLabel}
- Tema Detonador: ${input.proyecto}
- Numero de sesiones: ${sesiones}
- Duracion de cada sesion: ${input.duracion} minutos
- Tipo de Planeacion: ${modalidad}

${extrasPlataforma}

FASE 2: Procesamiento de Contenidos Curriculares
Los contenidos y PDA ya han sido seleccionados por el docente. Son los siguientes:
- Campos Formativos:
${camposStr}
- Contenidos Seleccionados:
${contenidosStr}
- PDA Asociados:
${pdaStr}

FASE 3: Generacion de la Planeacion Didactica
Genera un documento en formato TEXTO PLANO bien estructurado y legible:

PLANEACION DIDACTICA - ${nivel} ${gradoLabel}
=====================================================

DATOS GENERALES
---------------
Docente: ${input.nombreDocente}
Escuela: ${input.nombreEscuela}
Periodo: ${input.periodoPlaneado}
Nivel Academico: ${nivel}
Grado: ${gradoLabel}
Fase: ${input.fase}
Tema Detonador: ${input.proyecto}
Numero de Sesiones: ${sesiones} sesiones
Duracion por Sesion: ${input.duracion} minutos
Tipo de Planeacion: ${modalidad}
Fecha de Elaboracion: ${fechaActual}

MARCO CURRICULAR NEM
--------------------

Campos Formativos Integrados:
${camposStr}

Contenidos y Procesos de Desarrollo de Aprendizaje (PDA):
Campo Formativo: ${camposStr}
Contenido: ${contenidosStr}
PDA: ${pdaStr}

${sesionesText}
VERIFICAR: Se han generado las ${sesiones} sesiones solicitadas?

RECURSOS Y MATERIALES GENERALES
-------------------------------

Para el Docente:
- [Recurso 1 con especificaciones, vinculado a ${contenidosStr}]
- [Recurso 2 con especificaciones, vinculado a ${contenidosStr}]

Para los Estudiantes:
- [Material 1 por estudiante relacionado con ${pdaStr}]
- [Material 2 por equipo relacionado con ${pdaStr}]

${evaluacionFormativa}
ADAPTACIONES Y DIVERSIFICACION
------------------------------
- Para estudiantes con necesidades especificas: [Estrategia concreta relacionada con ${contenidosStr}]
- Para estudiantes avanzados: [Actividad de extension vinculada a ${pdaStr}]
- Consideraciones culturales: [Adaptacion contextual aplicable al proyecto]

EVALUACION SUMATIVA DEL PROYECTO
--------------------------------
- Producto Final: [Descripcion del producto esperado vinculado a ${contenidosStr}]
- Criterios de Evaluacion: [Criterios especificos asociados a ${pdaStr}]
- Instrumentos: [Lista de instrumentos a utilizar]

MATERIALES COMPLEMENTARIOS (APENDICE OBLIGATORIO - NO OMITIR)
-------------------------------------------------------------
Generar AQUI, de forma completa, TODOS los materiales mencionados en las sesiones. Este apéndice es obligatorio y NO debe omitirse ni resumirse. Incluir, segun corresponda:
- Textos y cuentos completos mencionados (texto íntegro, no resumen)
- Organizadores gráficos descritos con su formato visual
- Tarjetas de apoyo con su contenido específico
- Bancos de palabras organizados por categorías
- Instrumentos de evaluación detallados (listas de cotejo y rúbricas completas)
- Instrucciones de uso para el docente
- Para cada imagen sugerida: el prompt exacto para generarla
- Para cada video sugerido: el URL de YouTube en español
- Adaptaciones imprimibles por perfil neurológico del grupo: ${perfiles}

Cierre con: 'VERIFICACION FINAL: Se han generado ${sesiones} sesiones completas y el apéndice de materiales complementarios.'
`;
}
