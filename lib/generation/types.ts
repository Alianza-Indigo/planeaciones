import { z } from "zod";

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
});

export type PlanningInput = z.infer<typeof planningInputSchema>;

export type GeneratedPlanning = {
  title: string;
  content: string;
  providerRequestId?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
};
