import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    membership: { upsert: vi.fn(), updateMany: vi.fn() },
    payment: { upsert: vi.fn() },
  },
}));
const { getSubscriptionMock } = vi.hoisted(() => ({ getSubscriptionMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/payments/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payments/stripe")>(
    "@/lib/payments/stripe",
  );
  return { ...actual, getStripeSubscription: getSubscriptionMock };
});

import { POST } from "@/app/api/stripe/webhook/route";

function call(body: unknown) {
  // Sin STRIPE_WEBHOOK_SECRET y fuera de producción, la firma no se valida.
  return POST(
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
  );
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    current_period_end: 1_900_000_000,
    metadata: { userId: "u1", plan: "MONTHLY" },
    items: { data: [{ price: { recurring: { interval: "month" } } }] },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.membership.upsert.mockResolvedValue({});
  prismaMock.membership.updateMany.mockResolvedValue({});
  prismaMock.payment.upsert.mockResolvedValue({});
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

describe("POST /api/stripe/webhook", () => {
  it("activa la membresía tras checkout.session.completed", async () => {
    getSubscriptionMock.mockResolvedValue(subscription());
    const res = await call({
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", subscription: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(getSubscriptionMock).toHaveBeenCalledWith("sub_1");
    const args = prismaMock.membership.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "u1" });
    expect(args.create).toMatchObject({
      plan: "MONTHLY",
      status: "ACTIVE",
      generationLimit: 999999,
      stripeSubscriptionId: "sub_1",
      stripeCustomerId: "cus_1",
    });
  });

  it("ignora checkout que no es de suscripción", async () => {
    const res = await call({
      type: "checkout.session.completed",
      data: { object: { mode: "payment", subscription: null } },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("mode") });
    expect(getSubscriptionMock).not.toHaveBeenCalled();
  });

  it("deriva plan ANNUAL del intervalo de la suscripción", async () => {
    getSubscriptionMock.mockResolvedValue(
      subscription({ items: { data: [{ price: { recurring: { interval: "year" } } }] } }),
    );
    const res = await call({
      type: "invoice.paid",
      data: { object: { subscription: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ charged: true });
    expect(prismaMock.membership.upsert.mock.calls[0][0].create.plan).toBe("ANNUAL");
  });

  it("registra el cobro en Payment ante invoice.paid", async () => {
    getSubscriptionMock.mockResolvedValue(subscription());
    const res = await call({
      type: "invoice.paid",
      data: {
        object: { id: "in_123", subscription: "sub_1", amount_paid: 9900, currency: "mxn" },
      },
    });
    expect(res.status).toBe(200);
    const args = prismaMock.payment.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ providerPaymentId: "in_123" });
    expect(args.create).toMatchObject({
      userId: "u1",
      provider: "stripe",
      providerPaymentId: "in_123",
      status: "APPROVED",
      amountCents: 9900,
      currency: "MXN",
    });
  });

  it("lee current_period_end del item cuando no está en la suscripción (API 2025+)", async () => {
    getSubscriptionMock.mockResolvedValue(
      subscription({
        current_period_end: undefined,
        items: { data: [{ current_period_end: 1_950_000_000, price: { recurring: { interval: "month" } } }] },
      }),
    );
    const res = await call({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    });
    expect(res.status).toBe(200);
    const args = prismaMock.membership.upsert.mock.calls[0][0];
    expect(args.create.currentPeriodEndsAt).toEqual(new Date(1_950_000_000 * 1000));
  });

  it("marca CANCELED cuando la suscripción está programada para cancelar", async () => {
    getSubscriptionMock.mockResolvedValue(subscription({ cancel_at_period_end: true }));
    const res = await call({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(prismaMock.membership.upsert.mock.calls[0][0].update.status).toBe("CANCELED");
  });

  it("marca PAST_DUE cuando el cobro falla", async () => {
    getSubscriptionMock.mockResolvedValue(subscription({ status: "past_due" }));
    const res = await call({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(prismaMock.membership.upsert.mock.calls[0][0].update.status).toBe("PAST_DUE");
  });

  it("marca CANCELED (sin upsert) ante una suscripción cancelada en Stripe", async () => {
    getSubscriptionMock.mockResolvedValue(subscription({ status: "canceled" }));
    const res = await call({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(prismaMock.membership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" }, data: { status: "CANCELED" } }),
    );
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
  });

  it("cancela por stripeSubscriptionId ante customer.subscription.deleted sin metadata", async () => {
    const res = await call({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", metadata: null } },
    });
    expect(res.status).toBe(200);
    expect(prismaMock.membership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_1" },
        data: { status: "CANCELED" },
      }),
    );
    expect(getSubscriptionMock).not.toHaveBeenCalled();
  });

  it("ignora la suscripción si falta userId en metadata", async () => {
    getSubscriptionMock.mockResolvedValue(subscription({ metadata: {} }));
    const res = await call({
      type: "invoice.paid",
      data: { object: { subscription: "sub_1" } },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("userId") });
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
  });

  it("rechaza con 401 una firma inválida cuando hay secreto configurado", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    const res = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify({ type: "invoice.paid", data: { object: { subscription: "sub_1" } } }),
        headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=malo" },
      }),
    );
    expect(res.status).toBe(401);
    expect(getSubscriptionMock).not.toHaveBeenCalled();
  });

  it("ignora tipos de evento no manejados", async () => {
    const res = await call({ type: "customer.created", data: { object: {} } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("customer.created") });
  });
});
