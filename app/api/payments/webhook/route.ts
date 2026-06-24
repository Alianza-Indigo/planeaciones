import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getMercadoPagoPayment } from "@/lib/payments/mercadopago";

export const runtime = "nodejs";

// Valida la firma del webhook de Mercado Pago (header x-signature) cuando hay
// MERCADOPAGO_WEBHOOK_SECRET configurado. Formato del header: "ts=...,v1=...".
// El manifiesto firmado es: id:<dataId>;request-id:<x-request-id>;ts:<ts>;
function verifySignature(request: Request, dataId: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return true; // sin secreto configurado, no se valida (entornos de prueba)
  }

  const signature = request.headers.get("x-signature");
  if (!signature || !dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    signature.split(",").map((part) => part.split("=").map((value) => value.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    return false;
  }

  const requestId = request.headers.get("x-request-id") ?? "";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

function addOneYear(from: Date): Date {
  const date = new Date(from);
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = (await request.json().catch(() => ({}))) as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };

  // El id del pago llega en data.id (body) o como query param ?id=/?data.id=.
  const dataId =
    payload.data?.id ?? searchParams.get("data.id") ?? searchParams.get("id") ?? null;

  if (!verifySignature(request, dataId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Solo nos interesan notificaciones de pago.
  const type = payload.type ?? searchParams.get("type");
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
