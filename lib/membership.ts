// Límite de generaciones para usuarios sin membresía activa (plan gratuito).
// Etapa de pruebas: elevado a 100. Es la fuente de verdad del gate en
// /api/generate, así que aplica aunque una membresía vieja tenga otro valor.
export const FREE_GENERATION_LIMIT = 100;
