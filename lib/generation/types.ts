import { z } from "zod";

export const condicionNeuroinclusiva = z.enum([
  "tdah",
  "tea",
  "dislexia",
  "discalculia",
  "disfasia",
  "discapacidad_intelectual",
  "hipersensibilidad_sensorial",
  "altas_capacidades",
  "dificultades_motoras",
  "ansiedad_escolar",
  "otra",
]);

export type CondicionNeuroinclusiva = z.infer<typeof condicionNeuroinclusiva>;

export const neuroinclusividadSchema = z
  .object({
    activa: z.boolean().default(false),
    condiciones: z.array(condicionNeuroinclusiva).default([]),
    otraDescripcion: z.string().optional(),
  })
  .default({ activa: false, condiciones: [] });

export const planningInputSchema = z.object({
  nombreDocente: z.string().min(1),
  nombreEscuela: z.string().min(1),
  periodoPlaneado: z.string().min(1),
  grado: z.string().min(1),
  fase: z.string().min(1),
  duracion: z.coerce.number().int().min(30).max(240),
  sesiones: z.coerce.number().int().min(1).max(20),
  proyecto: z.string().min(1),
  campos: z.array(z.string()).min(1),
  contenidos: z.array(z.string()).min(1),
  pda: z.array(z.string()).min(1),
  estrategias: z.array(z.string()).default([]),
  contextoGrupo: z.string().optional(),
  necesidades: z.string().optional(),
  materialesDisponibles: z.string().optional(),
  // secuencial = una sesión por contenido; proyecto = integrar campos en torno al tema.
  modalidad: z.enum(["secuencial", "proyecto"]).default("secuencial"),
  // compacto  = 1-2 páginas, solo estructura esencial, sin scripts de facilitador
  // estandar  = scripts moderados en forma de guía
  // detallado = scripts literales y adaptaciones por momento de la actividad
  nivelDetalle: z.enum(["compacto", "estandar", "detallado"]).default("estandar"),
  neuroinclusividad: neuroinclusividadSchema,
});

export type PlanningInput = z.infer<typeof planningInputSchema>;

export type GeneratedPlanning = {
  title: string;
  content: string;
  materiales?: unknown;
  providerRequestId?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
};
