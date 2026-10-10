export const ADIA_UI_URI = "ui://adia/planeador.html";
export const ADIA_DOWNLOAD_URI = "ui://adia/documentos.html";
export const ADIA_UI_MIME = "text/html;profile=mcp-app";

const stringArray = { type: "array", items: { type: "string" } };
const inputSchema = {
  type: "object",
  required: ["nombreDocente", "nombreEscuela", "periodoPlaneado", "grado", "duracion", "sesiones", "proyecto", "campos", "contenidos", "pda"],
  properties: {
    nombreDocente: { type: "string" }, nombreEscuela: { type: "string" },
    periodoPlaneado: { type: "string" }, grado: { type: "string" },
    fase: { type: "string" }, duracion: { type: "integer" },
    sesiones: { type: "integer" }, proyecto: { type: "string" },
    campos: stringArray, contenidos: stringArray, pda: stringArray,
    estrategias: stringArray,
    contextoGrupo: { type: "string" }, materialesDisponibles: { type: "string" },
    modalidad: { type: "string", enum: ["secuencial", "proyecto"] },
    nivelDetalle: { type: "string", enum: ["compacto", "estandar", "detallado"] },
    neuroinclusividad: {
      type: "object", properties: {
        activa: { type: "boolean" },
        condiciones: stringArray,
        otraDescripcion: { type: "string" }
      }
    }
  }
};

export const ADIA_TOOLS = [
  {
    name: "exportar_documentos_docx",
    title: "Entregar planeación y materiales en Word",
    description: "OBLIGATORIA al finalizar: convierte planeación y materiales completos a dos archivos DOCX descargables. Llamar cuando ambos textos estén completos, sin resumirlos ni sustituirlos.",
    inputSchema: { type: "object", required: ["planeacion", "materiales"], properties: {
      planeacion: {type:"string", description:"Texto completo de todas las sesiones, sin abreviar"},
      materiales: {type:"string", description:"Materiales didácticos completos de cada sesión, sin abreviar"},
      grado: {type:"string"}
    } },
    _meta: {ui:{resourceUri:ADIA_DOWNLOAD_URI}, "openai/outputTemplate":ADIA_DOWNLOAD_URI}
  },
  {
    name: "abrir_adia",
    title: "Abrir ADIA",
    description: "Abre la interfaz interactiva de planeaciones ADIA con selección de grado, campo, contenido, PDA, evaluación y apoyos neuroinclusivos.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: {
      ui: { resourceUri: ADIA_UI_URI },
      "openai/outputTemplate": ADIA_UI_URI
    }
  },
  {
    name: "consultar_curriculo",
    title: "Consultar currículo NEM",
    description: "Consulta campos, contenidos y PDA del currículo NEM de ADIA por grado. Especifica campo para recuperar contenidos y sus PDA.",
    inputSchema: {
      type: "object", required: ["grado"],
      properties: { grado: { type: "string" }, campo: { type: "string" } }
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: "preparar_planeacion",
    title: "Preparar planeación con ADIA",
    description: "Valida la correspondencia de contenidos/PDA del grado y entrega las instrucciones pedagógicas para generar en esta conversación de ChatGPT, sin llamar a Gemini.",
    inputSchema: {
      type: "object", required: ["input"], properties: { input: inputSchema }
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  {
    name: "preparar_materiales",
    title: "Preparar materiales didácticos",
    description: "Genera un prompt para redactar materiales completos de cada sesión a partir de una planeación ADIA existente en ChatGPT.",
    inputSchema: {
      type: "object", required: ["input", "planeacion"],
      properties: { input: inputSchema, planeacion: { type: "string" } }
    },
    annotations: { readOnlyHint: true, openWorldHint: false }
  }
];
