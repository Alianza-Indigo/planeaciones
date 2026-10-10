import { deflateRawSync } from "node:zlib";

/**
 * Generador OOXML sin servicios externos ni almacenamiento persistente.
 * Usa ZIP/Deflate y los elementos estándar de Word para producir .docx válidos.
 */
const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export { WORD_MIME };

const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const lines = (value: string) => value.replace(/\r\n?/g, "\n").split("\n");
const run = (text: string, bold = false, italic = false) =>
  "<w:r>" + ((bold || italic) ? "<w:rPr>" + (bold ? "<w:b/>" : "") +
  (italic ? "<w:i/>" : "") + "</w:rPr>" : "") + '<w:t xml:space="preserve">' +
  xml(text) + "</w:t></w:r>";

function inline(text: string): string {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token) => {
    if (token.startsWith("**") && token.endsWith("**")) return run(token.slice(2, -2), true);
    if (token.startsWith("*") && token.endsWith("*")) return run(token.slice(1, -1), false, true);
    return run(token);
  }).join("");
}

function paragraph(text: string, style = "Normal", prefix = ""): string {
  const prop = '<w:pPr><w:pStyle w:val="' + style + '"/><w:keepTogether/></w:pPr>';
  return "<w:p>" + prop + inline(prefix + text) + "</w:p>";
}

function parseBody(body: string): string {
  let result = "";
  for (const original of lines(body)) {
    const line = original.trim();
    if (!line) continue;
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      result += paragraph(heading[2], "Heading" + Math.min(heading[1].length, 3));
      continue;
    }
    const list = /^([-*•]|\d+[.)])\s+(.+)$/.exec(line);
    if (list) {
      const prefix = /^\d/.test(list[1]) ? list[1] + "  " : "•  ";
      result += paragraph(list[2], "ListParagraph", prefix);
      continue;
    }
    if (/^(?:SESI[ÓO]N|ACTIVIDAD|MATERIAL|ANEXO)\s+\d+[:.\s]/i.test(line)) {
      result += paragraph(line, "Heading1");
      continue;
    }
    if (/^(INICIO|DESARROLLO|CIERRE|EVALUACI[ÓO]N|ADAPTACIONES|PRODUCTO ESPERADO|MATERIALES)\b/i.test(line)
        && line.length < 110) {
      result += paragraph(line, "Heading2");
      continue;
    }
    result += paragraph(line);
  }
  return result;
}

const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/>' +
  '<w:sz w:val="21"/><w:color w:val="243044"/></w:rPr></w:rPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/>' +
  '<w:pPr><w:spacing w:before="0" w:after="130" w:line="285" w:lineRule="auto"/></w:pPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>' +
  '<w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="210"/></w:pPr>' +
  '<w:rPr><w:b/><w:color w:val="35438E"/><w:sz w:val="37"/></w:rPr></w:style>' +
  '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/>' +
  '<w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="220"/></w:pPr>' +
  '<w:rPr><w:color w:val="64748B"/><w:sz w:val="20"/></w:rPr></w:style>' +
  [1, 2, 3].map((i) =>
    '<w:style w:type="paragraph" w:styleId="Heading' + i + '"><w:name w:val="heading ' + i + '"/>' +
    '<w:basedOn w:val="Normal"/><w:pPr><w:keepNext/>' +
    '<w:spacing w:before="' + (i === 1 ? 270 : 200) + '" w:after="110"/></w:pPr>' +
    '<w:rPr><w:b/><w:color w:val="35438E"/><w:sz w:val="' + (i === 1 ? 29 : i === 2 ? 25 : 23) +
    '"/></w:rPr></w:style>'
  ).join("") +
  '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/>' +
  '<w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="340"/><w:spacing w:after="65"/></w:pPr></w:style>' +
  '</w:styles>';

const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';
const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';
const wordRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

const crcTable = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let n = 0; n < 8; n++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  return c >>> 0;
});
function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP estándar con directorio central, UTF-8 y compresión Deflate. */
function packageDocx(entries: Array<{ name: string; data: string }>): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const filename = Buffer.from(name, "utf8");
    const source = Buffer.from(data, "utf8");
    const compressed = deflateRawSync(source, { level: 6 });
    const checksum = crc32(source);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(source.length, 22);
    header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(checksum, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(source.length, 24);
    cd.writeUInt16LE(filename.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

export function generarDocxAdia(title: string, markdown: string, subtitle = ""): Buffer {
  if (typeof markdown !== "string" || markdown.trim().length < 100 ||
      markdown.length > 220_000) {
    throw new Error("El contenido del documento debe tener entre 100 y 220000 caracteres.");
  }
  const document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + paragraph(title, "Title") +
    (subtitle ? paragraph(subtitle, "Subtitle") : "") + parseBody(markdown) +
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>' +
    '<w:pgMar w:top="1300" w:right="1350" w:bottom="1300" w:left="1350" ' +
    'w:header="700" w:footer="700" w:gutter="0"/></w:sectPr></w:body></w:document>';
  return packageDocx([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: styles },
    { name: "word/_rels/document.xml.rels", data: wordRels },
  ]);
}

export function exportarDocumentosAdia(args: Record<string, unknown>) {
  const planeacion = args.planeacion;
  const materiales = args.materiales;
  if (typeof planeacion !== "string" || typeof materiales !== "string") {
    throw new Error("Para exportar se necesitan la planeación y los materiales completos.");
  }
  const grado = typeof args.grado === "string" ? args.grado.slice(0, 70) : "";
  const subtitle = grado ? "Nueva Escuela Mexicana · " + grado : "Nueva Escuela Mexicana · DUA";
  const docs = [
    { file_name: "ADIA_planeacion.docx",
      bytes: generarDocxAdia("ADIA | Planeación didáctica", planeacion, subtitle) },
    { file_name: "ADIA_materiales_didacticos.docx",
      bytes: generarDocxAdia("ADIA | Materiales didácticos", materiales, subtitle) },
  ];
  return {
    structuredContent: { listo: true, documentos: docs.map(d => ({
      nombre: d.file_name, formato: "docx", tamano: d.bytes.length,
    })) },
    content: [{ type: "text", text: "Se generaron dos archivos DOCX: planeación y materiales. El docente puede descargarlos desde los botones del panel ADIA." }],
    _meta: { adia_docs: docs.map(d => ({
      file_name: d.file_name, mime_type: WORD_MIME,
      content_base64: d.bytes.toString("base64"),
    })) },
  };
}
