import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  MAX_PRICE_CENTS,
  MIN_PRICE_CENTS,
  setAnnualPriceCents,
  setMonthlyPriceCents,
} from "@/lib/settings";

export const runtime = "nodejs";

const schema = z.object({
  monthlyPesos: z.number().positive(),
  annualPesos: z.number().positive(),
});

function toCents(pesos: number): number | null {
  const cents = Math.round(pesos * 100);
  return cents >= MIN_PRICE_CENTS && cents <= MAX_PRICE_CENTS ? cents : null;
}

// Actualiza los precios mensual y anual de la membresía. Solo ADMIN.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const monthlyCents = toCents(parsed.data.monthlyPesos);
  const annualCents = toCents(parsed.data.annualPesos);
  if (monthlyCents === null || annualCents === null) {
    return NextResponse.json(
      { error: "Los precios deben estar entre $10 y $100,000 MXN (mínimo de Mercado Pago)." },
      { status: 400 },
    );
  }

  await setMonthlyPriceCents(monthlyCents);
  await setAnnualPriceCents(annualCents);

  return NextResponse.json({ ok: true, monthlyCents, annualCents });
}
