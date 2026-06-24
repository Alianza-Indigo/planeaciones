import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    type?: string;
    data?: { id?: string };
    external_reference?: string;
  };

  const paymentId = payload.external_reference;

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "missing external_reference" });
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "APPROVED",
      providerPaymentId: payload.data?.id,
      rawPayload: payload,
    },
  });

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  await prisma.membership.upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      plan: "MONTHLY",
      status: "ACTIVE",
      generationLimit: 100,
      currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      plan: "MONTHLY",
      status: "ACTIVE",
      generationLimit: 100,
      currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true });
}
