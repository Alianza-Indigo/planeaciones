import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  MAX_MEMBERSHIP_PRICE_CENTS,
  MIN_MEMBERSHIP_PRICE_CENTS,
  setMembershipPriceCents,
} from "@/lib/settings";

export const runtime = "nodejs";

const schema = z.object({ pesos: z.number().positive() });

// Actualiza el precio de la membresía anual (en pesos). Solo ADMIN.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
  }

  const cents = Math.round(parsed.data.pesos * 100);
  if (cents < MIN_MEMBERSHIP_PRICE_CENTS || cents > MAX_MEMBERSHIP_PRICE_CENTS) {
    return NextResponse.json({ error: "El precio está fuera del rango permitido." }, { status: 400 });
  }

  await setMembershipPriceCents(cents);
  return NextResponse.json({ ok: true, cents });
}
