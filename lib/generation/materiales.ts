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

// El plan a veces filtra un bloque "MATERIALES_JSON: { ... }" (con o sin
// marcadores <<<>>>) al final del documento. Los materiales reales se generan
// en una llamada aparte, así que ese JSON crudo solo ensucia la salida y hay
// que eliminarlo. Recorre las llaves respetando cadenas para no cortar mal.
export function quitarMaterialesJsonFiltrado(texto: string): string {
  const etiqueta = /<{0,3}\s*MATERIALES_JSON\s*>{0,3}\s*:?[ \t]*\n?/i;
  const m = texto.match(etiqueta);
  if (!m || m.index === undefined) return texto;

  const start = m.index;
  let i = start + m[0].length;
  while (i < texto.length && texto[i] !== "{") i++;
  if (i >= texto.length) {
    // No hay JSON tras la etiqueta: quitar solo la etiqueta colgante.
    return (texto.slice(0, start) + texto.slice(start + m[0].length)).trim();
  }

  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = i;
  for (; end < texto.length; end++) {
    const c = texto[end];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        end++;
        break;
      }
    }
  }

  // Arrastra también un posible marcador de cierre <<<FIN_MATERIALES_JSON>>>.
  const resto = texto.slice(end).replace(/^\s*<{0,3}\s*FIN_MATERIALES_JSON\s*>{0,3}/i, "");
  return (texto.slice(0, start) + resto).trim();
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
