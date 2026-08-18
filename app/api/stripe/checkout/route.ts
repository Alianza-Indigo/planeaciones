import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { createStripeCheckoutSubscription } from "@/lib/payments/stripe";
import { getPlanPriceCents, planConfig, type Plan } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe no está configurado." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan: Plan = body.plan === "annual" ? "annual" : "monthly";
  const cfg = planConfig(plan);
  const amountCents = await getPlanPriceCents(plan);

  // URLs de retorno tras el checkout. Se reutilizan las de Mercado Pago como
  // respaldo si no hay PUBLIC_BASE_URL configurado.
  const base = process.env.PUBLIC_BASE_URL;
  const successUrl = base ? `${base}/cuenta?sub=1` : process.env.MERCADOPAGO_SUCCESS_URL;
  const cancelUrl = base ? `${base}/cuenta?paid=0` : process.env.MERCADOPAGO_FAILURE_URL;

  if (!successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: "Faltan URLs de retorno (PUBLIC_BASE_URL)." },
      { status: 500 },
    );
  }

  try {
    const checkout = await createStripeCheckoutSubscription({
      userId: session.user.id,
      email: session.user.email,
      productName: cfg.reason,
      amountCents,
      interval: plan === "annual" ? "year" : "month",
      plan: cfg.planLabel,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo iniciar el pago con Stripe.",
        details: error instanceof Error ? error.message : null,
      },
      { status: 502 },
    );
  }
}
