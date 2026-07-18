import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/payments/mercadopago";
import { getMonthlyPriceCents } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Precio configurable desde el panel admin (con fallback a $99 MXN).
  const amountCents = await getMonthlyPriceCents();

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amountCents,
      currency: "MXN",
      status: "PENDING",
    },
  });

  const preference = await createMercadoPagoPreference({
    title: "ADIA — Membresía Anual",
    description: "Acceso ilimitado a generación de planeaciones didácticas por 1 año",
    amountCents: payment.amountCents,
    userId: session.user.id,
    paymentId: payment.id,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerPreferenceId: preference.id },
  });

  return NextResponse.json({
    paymentId: payment.id,
    preferenceId: preference.id,
    checkoutUrl: preference.init_point,
    sandboxCheckoutUrl: preference.sandbox_init_point,
  });
}
