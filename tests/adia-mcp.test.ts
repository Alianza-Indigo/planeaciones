import { describe, expect, it } from "vitest";
import { consultarCurriculo, prepararPlaneacion } from "@/lib/mcp/adia";
import { dispatchAdiaRpc } from "@/lib/mcp/rpc";
import { ADIA_WIDGET_HTML } from "@/lib/mcp/widget";
import { generarDocxAdia, exportarDocumentosAdia } from "@/lib/mcp/docx";
import { inflateRawSync } from "node:zlib";

describe("ADIA MCP", () => {
  it("ofrece formulario y herramientas a ChatGPT", () => {
    const init = dispatchAdiaRpc({ jsonrpc: "2.0", id: 1, method: "initialize" });
    expect(init).toMatchObject({ result: { serverInfo: { name: "adia-planeaciones" } } });
    const list = dispatchAdiaRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }) as { result: { tools: { name: string }[] } };
    expect(list.result.tools.map(t => t.name)).toContain("abrir_adia");
    expect(list.result.tools.map(t => t.name)).toContain("preparar_planeacion");
  });
  it("sirve la UI embebida y envía mensaje conforme al formato esperado", () => {
    expect(ADIA_WIDGET_HTML).toContain("ui/initialize");
    expect(ADIA_WIDGET_HTML).toContain("content:[{type:'text',text:");
    expect(ADIA_WIDGET_HTML).toContain("camposProyectoWrap");
    const data = dispatchAdiaRpc({
      jsonrpc: "2.0", id: 3, method: "resources/read", params: { uri: "ui://adia/planeador.html" }
    }) as { result: { contents: { text: string }[] } };
    expect(data.result.contents[0].text).toContain("<form");
  });
  it("consulta campos y PDA sin usar Gemini", () => {
    const { campos } = consultarCurriculo("2 primaria") as { campos: string[] };
    expect(campos).toContain("LENGUAJES");
    const data = consultarCurriculo("2 primaria", "LENGUAJES") as { contenidos: { titulo: string; pda: string[] }[] };
    expect(data.contenidos.length).toBeGreaterThan(0);
    const primero = data.contenidos.find(c => c.pda.length > 0)!;
    const result = prepararPlaneacion({
      nombreDocente: "Docente de prueba", nombreEscuela: "Escuela de prueba",
      periodoPlaneado: "Semana 1", grado: "2 primaria", fase: "",
      duracion: 50, sesiones: 2, proyecto: "Aprender juntos",
      campos: ["LENGUAJES"], contenidos: [primero.titulo], pda: [primero.pda[0]],
      modalidad: "secuencial"
    });
    expect(result.input.fase).toBe("Fase 3");
    expect(result.prompt).toContain(primero.pda[0]);
  });
  it("rechaza PDA que no pertenezcan al contenido", () => {
    const data = consultarCurriculo("2 primaria", "LENGUAJES") as { contenidos: { titulo: string; pda: string[] }[] };
    expect(() => prepararPlaneacion({
      nombreDocente: "Docente de prueba", nombreEscuela: "Escuela de prueba",
      periodoPlaneado: "Semana 1", grado: "2 primaria", fase: "",
      duracion: 50, sesiones: 2, proyecto: "Aprender juntos",
      campos: ["LENGUAJES"], contenidos: [data.contenidos[0].titulo], pda: ["PDA inventado"],
      modalidad: "secuencial"
    })).toThrow();
  });
});

describe("Archivos Word de ADIA", () => {
  const text = "# Sesión 1\\n## Inicio\\nPreparar el aula para la actividad y compartir instrucciones. ".repeat(7);
  it("genera archivo Word OOXML con ZIP válido", () => {
    const doc = generarDocxAdia("Planeación didáctica", text, "Primaria");
    expect(doc.subarray(0, 4).toString("hex")).toBe("504b0304");
    const n = doc.readUInt16LE(26);
    expect(doc.subarray(30, 30+n).toString()).toBe("[Content_Types].xml");
    const content = inflateRawSync(doc.subarray(30+n, 30+n+doc.readUInt32LE(18))).toString();
    expect(content).toContain("wordprocessingml.document.main+xml");
  });
  it("entrega dos archivos independientes ocultando el base64 del chat", () => {
    const result = exportarDocumentosAdia({ planeacion: text, materiales: text, grado:"2 primaria" });
    expect(result.structuredContent.documentos).toHaveLength(2);
    expect(result._meta.adia_docs[0].file_name).toBe("ADIA_planeacion.docx");
    expect(result._meta.adia_docs[1].file_name).toBe("ADIA_materiales_didacticos.docx");
    expect(result.content[0].text).not.toContain("content_base64");
  });
});
