import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/payments/mercadopago";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amountCents: 19900,
      currency: "MXN",
      status: "PENDING",
    },
  });

  const preference = await createMercadoPagoPreference({
    title: "Planeaciones Pro",
    description: "Acceso mensual a generacion de planeaciones",
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
