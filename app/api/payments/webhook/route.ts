import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
} from "@/lib/payments/mercadopago";
import { verifyMercadoPagoSignature } from "@/lib/payments/verify-signature";

export const runtime = "nodejs";

function addOneYear(from: Date): Date {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

function addOneMonth(from: Date): Date {
  const date = new Date(from);
  date.setMonth(date.getMonth() + 1);
  return date;
}

// Deriva el plan de la periodicidad de la suscripción (12 meses = anual).
function planFromPreapproval(auto?: { frequency?: number; frequency_type?: string }): "MONTHLY" | "ANNUAL" {
  return (auto?.frequency ?? 1) >= 12 ? "ANNUAL" : "MONTHLY";
}

export async function POST(request: Request) {
  // En producción el secret del webhook es obligatorio: sin él la firma no se
  // valida (verifyMercadoPagoSignature devolvería true) y cualquiera podría
  // disparar el endpoint. Mejor fallar como misconfiguración del servidor.
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const payload = (await request.json().catch(() => ({}))) as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };

  // El id del recurso llega en data.id (body) o como query param ?id=/?data.id=.
  const dataId =
    payload.data?.id ?? searchParams.get("data.id") ?? searchParams.get("id") ?? null;

  const signatureValid = verifyMercadoPagoSignature({
    secret: webhookSecret,
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!signatureValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const type = payload.type ?? searchParams.get("type");

  // ── Suscripción: se autoriza / pausa / cancela ──
  if (type === "subscription_preapproval") {
    return handlePreapproval(dataId);
  }

  // ── Suscripción: cargo recurrente ejecutado ──
  if (type === "subscription_authorized_payment") {
    return handleAuthorizedPayment(dataId);
  }

  // Solo nos interesan además las notificaciones de pago único.
  if (type && type !== "payment") {
    return NextResponse.json({ ok: true, ignored: `type ${type}` });
  }

  if (!dataId) {
    return NextResponse.json({ ok: true, ignored: "missing payment id" });
  }

  // Estado autoritativo: se vuelve a consultar a la API de Mercado Pago.
  const mpPayment = await getMercadoPagoPayment(dataId);
  const externalReference = mpPayment.external_reference ?? undefined;

  if (!externalReference) {
    return NextResponse.json({ ok: true, ignored: "missing external_reference" });
  }

  const payment = await prisma.payment.findUnique({ where: { id: externalReference } });
  if (!payment) {
    return NextResponse.json({ ok: true, ignored: "payment not found" });
  }

  if (mpPayment.status !== "approved") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mpPayment.status === "rejected" ? "REJECTED" : "PENDING",
        providerPaymentId: String(mpPayment.id),
      },
    });
    return NextResponse.json({ ok: true, status: mpPayment.status });
  }

  // Idempotencia: un pago ya aprobado no vuelve a activar la membresía.
  if (payment.status === "APPROVED") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "APPROVED",
      providerPaymentId: String(mpPayment.id),
      rawPayload: payload,
    },
  });

  const periodEnd = addOneYear(new Date());
  await prisma.membership.upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      plan: "ANNUAL",
      status: "ACTIVE",
      generationLimit: 999999,
      currentPeriodEndsAt: periodEnd,
    },
    update: {
      plan: "ANNUAL",
      status: "ACTIVE",
      generationLimit: 999999,
      currentPeriodEndsAt: periodEnd,
    },
  });

  return NextResponse.json({ ok: true });
}

// Activa/actualiza la membresía según el estado de la suscripción.
async function handlePreapproval(dataId: string | null) {
  if (!dataId) return NextResponse.json({ ok: true, ignored: "missing preapproval id" });

  const pre = await getMercadoPagoPreapproval(dataId);
  const userId = pre.external_reference ?? undefined;
  if (!userId) return NextResponse.json({ ok: true, ignored: "missing external_reference" });

  if (pre.status === "authorized") {
    const periodEnd = pre.next_payment_date ? new Date(pre.next_payment_date) : addOneMonth(new Date());
    const data = {
      plan: planFromPreapproval(pre.auto_recurring),
      status: "ACTIVE" as const,
      generationLimit: 999999,
      currentPeriodEndsAt: periodEnd,
      mpPreapprovalId: dataId,
    };
    await prisma.membership.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return NextResponse.json({ ok: true, status: "authorized" });
  }

  if (pre.status === "cancelled") {
    await prisma.membership.updateMany({ where: { userId }, data: { status: "CANCELED" } });
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (pre.status === "paused") {
    await prisma.membership.updateMany({ where: { userId }, data: { status: "PAST_DUE" } });
    return NextResponse.json({ ok: true, status: "paused" });
  }

  return NextResponse.json({ ok: true, status: pre.status });
}

// Extiende el periodo de la membresía cuando se ejecuta un cargo recurrente.
async function handleAuthorizedPayment(dataId: string | null) {
  if (!dataId) return NextResponse.json({ ok: true, ignored: "missing authorized payment id" });

  const ap = await getMercadoPagoAuthorizedPayment(dataId);
  if (ap.status !== "processed") {
    return NextResponse.json({ ok: true, ignored: `authorized payment ${ap.status}` });
  }

  const preId = ap.preapproval_id;
  if (!preId) return NextResponse.json({ ok: true, ignored: "missing preapproval_id" });

  const pre = await getMercadoPagoPreapproval(preId);
  const userId = pre.external_reference ?? undefined;
  if (!userId) return NextResponse.json({ ok: true, ignored: "missing external_reference" });

  // Periodo absoluto (fecha del próximo cargo): re-procesar el mismo evento es
  // idempotente porque no acumula, fija la fecha.
  const periodEnd = pre.next_payment_date ? new Date(pre.next_payment_date) : addOneMonth(new Date());
  const data = {
    plan: planFromPreapproval(pre.auto_recurring),
    status: "ACTIVE" as const,
    generationLimit: 999999,
    currentPeriodEndsAt: periodEnd,
    mpPreapprovalId: preId,
  };
  await prisma.membership.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, charged: true });
}
