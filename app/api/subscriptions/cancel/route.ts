import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelMercadoPagoSubscription } from "@/lib/payments/mercadopago";
import { cancelStripeSubscription } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  // Se cancela en el proveedor que originó la suscripción activa.
  const provider = membership?.stripeSubscriptionId
    ? "stripe"
    : membership?.mpPreapprovalId
      ? "mercadopago"
      : null;

  if (!provider) {
    return NextResponse.json({ error: "No tienes una suscripción activa." }, { status: 400 });
  }

  try {
    if (provider === "stripe") {
      await cancelStripeSubscription(membership!.stripeSubscriptionId!);
    } else {
      await cancelMercadoPagoSubscription(membership!.mpPreapprovalId!);
    }
  } catch (error) {
    const proveedor = provider === "stripe" ? "Stripe" : "Mercado Pago";
    return NextResponse.json(
      {
        error: `No se pudo cancelar en ${proveedor}.`,
        details: error instanceof Error ? error.message : null,
      },
      { status: 502 },
    );
  }

  // Se marca CANCELADA pero se conserva el acceso hasta el fin del periodo ya
  // pagado (el gate permite ACTIVE o CANCELED mientras el periodo siga vigente).
  await prisma.membership.update({
    where: { userId: session.user.id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ ok: true });
}
