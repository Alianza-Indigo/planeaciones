import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getMercadoPagoEnv } from "@/lib/env";
import { createMercadoPagoSubscription } from "@/lib/payments/mercadopago";
import { getMembershipPriceCents } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const env = getMercadoPagoEnv();
  const amountCents = await getMembershipPriceCents();

  // URL de retorno tras autorizar la suscripción en Mercado Pago.
  const backUrl = env.PUBLIC_BASE_URL
    ? `${env.PUBLIC_BASE_URL}/cuenta?sub=1`
    : env.MERCADOPAGO_SUCCESS_URL;

  try {
    const subscription = await createMercadoPagoSubscription({
      reason: "ADIA — Membresía mensual",
      amountCents,
      payerEmail: session.user.email,
      userId: session.user.id,
      backUrl,
    });

    return NextResponse.json({ checkoutUrl: subscription.init_point });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear la suscripción.", details: error instanceof Error ? error.message : null },
      { status: 502 },
    );
  }
}
