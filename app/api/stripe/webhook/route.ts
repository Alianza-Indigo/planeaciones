import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getStripeSubscription,
  stripePeriodEndSeconds,
  stripePlanFromSubscription,
} from "@/lib/payments/stripe";
import { verifyStripeSignature } from "@/lib/payments/verify-signature";

export const runtime = "nodejs";

// Lee el estado autoritativo de la suscripción en Stripe y sincroniza la
// membresía. Re-procesar el mismo evento es idempotente: fija la fecha de fin
// de periodo (absoluta), no acumula.
async function syncFromSubscription(
  subscriptionId: string,
): Promise<{ userId?: string; status?: string; ignored?: string }> {
  const sub = await getStripeSubscription(subscriptionId);
  const userId = sub.metadata?.userId ?? undefined;
  if (!userId) return { ignored: "missing userId metadata" };

  // Suscripción muerta: se conserva la membresía pero se marca cancelada. El
  // gate mantiene el acceso mientras el periodo pagado siga vigente.
  if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
    await prisma.membership.updateMany({ where: { userId }, data: { status: "CANCELED" } });
    return { userId, status: sub.status };
  }

  const endSeconds = stripePeriodEndSeconds(sub);
  const periodEnd = endSeconds ? new Date(endSeconds * 1000) : null;
  const membershipStatus =
    sub.status === "past_due" || sub.status === "unpaid"
      ? "PAST_DUE"
      : sub.cancel_at_period_end
        ? "CANCELED"
        : "ACTIVE";

  const data = {
    plan: stripePlanFromSubscription(sub),
    status: membershipStatus as "ACTIVE" | "PAST_DUE" | "CANCELED",
    generationLimit: 999999,
    currentPeriodEndsAt: periodEnd,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer,
  };

  await prisma.membership.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return { userId, status: membershipStatus };
}

type StripeInvoice = {
  id?: string;
  amount_paid?: number;
  currency?: string;
  subscription?: string | null;
};

// Registra el cobro (invoice) en la tabla Payment para que quede visible en el
// panel admin. Idempotente: la clave es el id de la invoice (@unique).
async function recordInvoicePayment(userId: string, invoice: StripeInvoice): Promise<void> {
  if (!invoice.id) return;
  const amountCents = typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0;
  const currency = (invoice.currency ?? "mxn").toUpperCase();

  await prisma.payment.upsert({
    where: { providerPaymentId: invoice.id },
    create: {
      userId,
      provider: "stripe",
      providerPaymentId: invoice.id,
      status: "APPROVED",
      amountCents,
      currency,
    },
    update: { status: "APPROVED" },
  });
}

export async function POST(request: Request) {
  // En producción el signing secret es obligatorio: sin él la firma no se
  // valida y cualquiera podría disparar el endpoint.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  // Cuerpo crudo: la firma de Stripe se calcula sobre estos bytes exactos.
  const payload = await request.text();

  const signatureValid = verifyStripeSignature({
    secret: webhookSecret,
    signatureHeader: request.headers.get("stripe-signature"),
    payload,
    toleranceSeconds: 300,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!signatureValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      object?: {
        id?: string;
        mode?: string;
        subscription?: string | null;
        metadata?: { userId?: string } | null;
      };
    };
  };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const obj = event.data?.object ?? {};

  switch (event.type) {
    // Checkout completado: la suscripción quedó creada.
    case "checkout.session.completed": {
      if (obj.mode && obj.mode !== "subscription") {
        return NextResponse.json({ ok: true, ignored: `mode ${obj.mode}` });
      }
      if (!obj.subscription) {
        return NextResponse.json({ ok: true, ignored: "missing subscription" });
      }
      return NextResponse.json({ ok: true, ...(await syncFromSubscription(String(obj.subscription))) });
    }

    // Cargo (inicial o recurrente) ejecutado: extiende el periodo y registra
    // el cobro en la tabla Payment (visible en el panel admin).
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = obj as StripeInvoice;
      const subId = invoice.subscription;
      if (!subId) return NextResponse.json({ ok: true, ignored: "missing subscription on invoice" });
      const result = await syncFromSubscription(String(subId));
      if (result.userId) {
        await recordInvoicePayment(result.userId, invoice);
      }
      return NextResponse.json({ ok: true, charged: true, ...result });
    }

    // Cambios de estado de la suscripción (pausa, past_due, cancelación programada).
    case "customer.subscription.updated": {
      if (!obj.id) return NextResponse.json({ ok: true, ignored: "missing subscription id" });
      return NextResponse.json({ ok: true, ...(await syncFromSubscription(String(obj.id))) });
    }

    // Suscripción terminada definitivamente.
    case "customer.subscription.deleted": {
      const userId = obj.metadata?.userId ?? undefined;
      if (userId) {
        await prisma.membership.updateMany({ where: { userId }, data: { status: "CANCELED" } });
      } else if (obj.id) {
        await prisma.membership.updateMany({
          where: { stripeSubscriptionId: String(obj.id) },
          data: { status: "CANCELED" },
        });
      }
      return NextResponse.json({ ok: true, deleted: true });
    }

    default:
      return NextResponse.json({ ok: true, ignored: `type ${event.type}` });
  }
}
