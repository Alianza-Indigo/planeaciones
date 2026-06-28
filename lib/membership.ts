// Límite de generaciones para usuarios sin membresía activa (plan gratuito).
// Es la fuente de verdad del gate en /api/generate, así que aplica aunque una
// membresía vieja tenga otro valor. Los administradores no tienen tope.
export const FREE_GENERATION_LIMIT = 4;
