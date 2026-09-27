import { z } from "zod";

import {
  GRADOS_POR_NIVEL,
  isMateriaSecundaria,
  NIVELES,
  type NivelEdu,
} from "@/lib/generation/nivel";

// Modificaciones permitidas tras el alta. El alta (primer guardado) no cuenta;
// después el docente puede cambiar su perfil 2 veces. Al agotarlas debe pedir
// el cambio al administrador (que puede reiniciar el contador).
export const MAX_PROFILE_EDITS = 2;

export const teacherProfileSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120),
    escuela: z.string().trim().min(2).max(160),
    nivel: z.enum(NIVELES),
    grado: z.string().trim().min(1).max(8),
    materia: z.string().trim().max(80).nullable().optional(),
  })
  .refine((data) => GRADOS_POR_NIVEL[data.nivel as NivelEdu].includes(data.grado), {
    message: "El grado no corresponde al nivel seleccionado.",
    path: ["grado"],
  })
  .refine((data) => data.nivel !== "Secundaria" || !!data.materia && isMateriaSecundaria(data.materia), {
    message: "Selecciona la materia que impartes en secundaria.",
    path: ["materia"],
  });

export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;

// Cambios que le quedan al docente antes de tener que pedirlo al admin.
export function remainingEdits(editCount: number): number {
  return Math.max(0, MAX_PROFILE_EDITS - editCount);
}
