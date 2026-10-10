import { NextResponse } from "next/server";
import { dispatchAdiaRpc, type RpcRequest } from "@/lib/mcp/rpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const disabled = () => new Response("Not found", { status: 404 });

const protocolHeaders = {
  "Cache-Control": "no-store",
  "MCP-Protocol-Version": "2025-11-25",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, accept, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function OPTIONS() {
  if (process.env.ADIA_MCP_ENABLED !== "true") return disabled();
  return new Response(null, { status: 204, headers: protocolHeaders });
}

export async function POST(request: Request) {
  if (process.env.ADIA_MCP_ENABLED !== "true") return disabled();
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return new Response("Unsupported media type", { status: 415, headers: protocolHeaders });
  }
  let msg: RpcRequest;
  try {
    const raw = await request.text();
    if (raw.length > 1000000) return new Response("Request too large", { status: 413, headers: protocolHeaders });
    msg = JSON.parse(raw);
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0", id: null,
      error: { code: -32700, message: "JSON inválido." }
    }, { status: 400, headers: protocolHeaders });
  }
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return NextResponse.json({
      jsonrpc: "2.0", id: null,
      error: { code: -32600, message: "Solicitud MCP inválida." }
    }, { status: 400, headers: protocolHeaders });
  }
  const result = dispatchAdiaRpc(msg);
  if (result === null) return new Response(null, { status: 202, headers: protocolHeaders });
  return NextResponse.json(result, { headers: protocolHeaders });
}

export function GET() {
  if (process.env.ADIA_MCP_ENABLED !== "true") return disabled();
  return new Response("Stream not supported", { status: 405, headers: { ...protocolHeaders, Allow: "POST" } });
}

