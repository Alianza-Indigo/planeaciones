import { NextResponse } from "next/server";

import {
  getCamposFormativos,
  getContenidosByGradoAndCampo,
} from "@/lib/curriculum";

// Endpoint público: el catálogo curricular NEM es información pública.
// - GET /api/curriculum?grado=2 primaria            → { campos: string[] }
// - GET /api/curriculum?grado=2 primaria&campo=LENGUAJES → { contenidos, pda }
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grado = searchParams.get("grado");
  const campo = searchParams.get("campo");

  if (!grado) {
    return NextResponse.json({ error: "grado requerido" }, { status: 400 });
  }

  if (!campo) {
    return NextResponse.json({ campos: getCamposFormativos(grado) });
  }

  const contenidos = getContenidosByGradoAndCampo(grado, campo);
  const pda = contenidos.flatMap((contenido) => contenido.pda);

  return NextResponse.json({ contenidos, pda });
}
