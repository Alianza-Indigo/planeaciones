import { NextResponse } from "next/server";

export const runtime = "nodejs";

// El cliente necesita la llave pública VAPID para suscribirse al push.
// Se sirve por API en vez de NEXT_PUBLIC_* para no acoplarla al build.
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Push no configurado." }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
