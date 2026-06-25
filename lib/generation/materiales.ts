// Utilidades de materiales compartidas por servidor (procesado del output del
// modelo) y cliente (render en la pestaña Materiales).

export type MaterialItem = {
  para?: string;
  nombre?: string;
  tipo?: string;
  cantidad?: string;
  contenido?: string;
};

export type MaterialesSesion = {
  sesion?: number;
  titulo?: string;
  materiales?: MaterialItem[];
};

export type MaterialesData = { sesiones: MaterialesSesion[] };

// Extrae el bloque <<<MATERIALES_JSON>>> y devuelve el texto sin el bloque + los datos.
export function splitMateriales(content: string): { texto: string; materiales: MaterialesData | null } {
  const match = content.match(/<<<MATERIALES_JSON>>>([\s\S]*?)<<<FIN_MATERIALES_JSON>>>/);
  if (!match) return { texto: content, materiales: null };
  const texto = content.replace(match[0], "").trim();
  const raw = match[1].trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const data = JSON.parse(raw) as MaterialesData;
    if (data && Array.isArray(data.sesiones)) return { texto, materiales: data };
  } catch {
    // JSON inválido o truncado: se ignora.
  }
  return { texto, materiales: null };
}

// Quita cualquier preámbulo (validaciones/blindajes filtrados) antes del documento.
export function limpiarDocumento(texto: string): string {
  const i = texto.search(/PLANEACI[OÓ]N\s+DID[AÁ]CTICA/i);
  return i > 0 ? texto.slice(i).trim() : texto.trim();
}

export function esUrl(texto: string): boolean {
  return /^https?:\/\/\S+$/i.test(texto.trim());
}

// Materiales estructurados → texto legible (apéndice del documento / descarga).
export function materialesAtexto(data: MaterialesData): string {
  const partes: string[] = ["", "MATERIALES POR SESION", "====================="];
  for (const s of data.sesiones) {
    partes.push("", `SESION ${s.sesion ?? ""}${s.titulo ? `: ${s.titulo}` : ""}`);
    for (const m of s.materiales ?? []) {
      const dest = m.para === "alumno" ? "Alumno" : "Docente";
      partes.push(`- [${dest}] ${m.nombre ?? ""}${m.cantidad ? ` (${m.cantidad})` : ""}`);
      if (m.contenido) partes.push(`  ${m.contenido}`);
    }
  }
  return partes.join("\n");
}
