import { consultarCurriculo, prepararPlaneacion, prepararMateriales } from "@/lib/mcp/adia";
import { ADIA_UI_MIME, ADIA_UI_URI, ADIA_TOOLS } from "@/lib/mcp/registry";
import { ADIA_WIDGET_HTML } from "@/lib/mcp/widget";

export type RpcRequest = {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
};

const reply = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const error = (id: RpcRequest["id"], code: number, message: string) => ({
  jsonrpc: "2.0", id: id ?? null, error: { code, message }
});

function toolResult(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value };
}

export function dispatchAdiaRpc(msg: RpcRequest): unknown {
  const id = msg.id;
  const params = msg.params ?? {};
  switch (msg.method) {
    case "initialize":
      return reply(id, {
        protocolVersion: "2025-11-25",
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "adia-planeaciones", version: "1.0.0" },
        instructions: "Abre ADIA con abrir_adia. Consulta contenidos y PDA reales del currículo. Llama preparar_planeacion para obtener el prompt. Genera con el modelo de ChatGPT del docente, sin usar API externa de IA."
      });
    case "notifications/initialized":
      return null;
    case "ping":
      return reply(id, {});
    case "tools/list":
      return reply(id, { tools: ADIA_TOOLS });
    case "resources/list":
      return reply(id, { resources: [{ uri: ADIA_UI_URI, name: "Interfaz ADIA", mimeType: ADIA_UI_MIME }] });
    case "resources/templates/list":
      return reply(id, { resourceTemplates: [] });
    case "resources/read":
      return params.uri === ADIA_UI_URI
        ? reply(id, { contents: [{ uri: ADIA_UI_URI, mimeType: ADIA_UI_MIME, text: ADIA_WIDGET_HTML }] })
        : error(id, -32602, "Recurso desconocido.");
    case "tools/call": {
      if (typeof params.name !== "string" || params.arguments === null ||
          typeof params.arguments !== "object" || Array.isArray(params.arguments)) {
        return error(id, -32602, "Argumentos de herramienta inválidos.");
      }
      const args = params.arguments as Record<string, unknown>;
      try {
        let result: unknown;
        switch (params.name) {
          case "abrir_adia":
            result = { listo: true, mensaje: "Formulario interactivo ADIA disponible." };
            break;
          case "consultar_curriculo":
            if (typeof args.grado !== "string" ||
                (args.campo !== undefined && typeof args.campo !== "string")) {
              throw new Error("Grado o campo inválidos.");
            }
            result = consultarCurriculo(args.grado, args.campo as string | undefined);
            break;
          case "preparar_planeacion":
            result = prepararPlaneacion(args.input);
            break;
          case "preparar_materiales":
            if (typeof args.planeacion !== "string") throw new Error("Planeación inválida.");
            result = prepararMateriales(args.input, args.planeacion);
            break;
          default:
            return error(id, -32601, "Herramienta desconocida.");
        }
        return reply(id, toolResult(result));
      } catch (e) {
        return reply(id, {
          isError: true,
          content: [{ type: "text", text: e instanceof Error ? e.message : "Error desconocido." }]
        });
      }
    }
    default:
      return error(id, -32601, "Método desconocido.");
  }
}
