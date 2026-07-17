import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    payment: { findUnique: vi.fn(), update: vi.fn() },
    membership: { upsert: vi.fn(), updateMany: vi.fn() },
  },
}));
const { getPaymentMock, getPreapprovalMock, getAuthorizedPaymentMock } = vi.hoisted(() => ({
  getPaymentMock: vi.fn(),
  getPreapprovalMock: vi.fn(),
  getAuthorizedPaymentMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/payments/mercadopago", () => ({
  getMercadoPagoPayment: getPaymentMock,
  getMercadoPagoPreapproval: getPreapprovalMock,
  getMercadoPagoAuthorizedPayment: getAuthorizedPaymentMock,
}));

import { POST } from "@/app/api/payments/webhook/route";

function call(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/payments/webhook/mercadopago", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.payment.update.mockResolvedValue({});
  prismaMock.membership.upsert.mockResolvedValue({});
  prismaMock.membership.updateMany.mockResolvedValue({});
});

afterEach(() => {
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
});

describe("POST /api/payments/webhook", () => {
  it("rechaza con 401 una firma inválida cuando hay secreto configurado", async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = "secreto";
    const res = await call({ type: "payment", data: { id: "1" } }, { "x-signature": "ts=1,v1=malo" });
    expect(res.status).toBe(401);
    expect(getPaymentMock).not.toHaveBeenCalled();
  });

  it("ignora notificaciones que no son de pago", async () => {
    const res = await call({ type: "merchant_order", data: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("merchant_order") });
    expect(getPaymentMock).not.toHaveBeenCalled();
  });

  it("activa la membresía ANNUAL ante un pago aprobado", async () => {
    getPaymentMock.mockResolvedValue({ id: 99, status: "approved", external_reference: "pay1" });
    prismaMock.payment.findUnique.mockResolvedValue({ id: "pay1", userId: "u1", status: "PENDING" });

    const res = await call({ type: "payment", data: { id: "99" } });
    expect(res.status).toBe(200);
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED" }) }),
    );
    const upsertArgs = prismaMock.membership.upsert.mock.calls[0][0];
    expect(upsertArgs.create).toMatchObject({ plan: "ANNUAL", status: "ACTIVE", generationLimit: 999999 });
    expect(upsertArgs.where).toEqual({ userId: "u1" });
  });

  it("es idempotente ante un pago ya aprobado", async () => {
    getPaymentMock.mockResolvedValue({ id: 99, status: "approved", external_reference: "pay1" });
    prismaMock.payment.findUnique.mockResolvedValue({ id: "pay1", userId: "u1", status: "APPROVED" });

    const res = await call({ type: "payment", data: { id: "99" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ idempotent: true });
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });

  it("no activa membresía si el pago no está aprobado", async () => {
    getPaymentMock.mockResolvedValue({ id: 99, status: "rejected", external_reference: "pay1" });
    prismaMock.payment.findUnique.mockResolvedValue({ id: "pay1", userId: "u1", status: "PENDING" });

    const res = await call({ type: "payment", data: { id: "99" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "rejected" });
    expect(prismaMock.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED" }) }),
    );
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
  });

  it("ignora si el pago de MP no trae external_reference", async () => {
    getPaymentMock.mockResolvedValue({ id: 99, status: "approved", external_reference: null });
    const res = await call({ type: "payment", data: { id: "99" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("external_reference") });
    expect(prismaMock.payment.findUnique).not.toHaveBeenCalled();
  });

  it("ignora si no encuentra el Payment local", async () => {
    getPaymentMock.mockResolvedValue({ id: 99, status: "approved", external_reference: "pay1" });
    prismaMock.payment.findUnique.mockResolvedValue(null);
    const res = await call({ type: "payment", data: { id: "99" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: expect.stringContaining("not found") });
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
  });

  it("activa la membresía MENSUAL cuando la suscripción queda autorizada", async () => {
    getPreapprovalMock.mockResolvedValue({
      id: "pre1",
      status: "authorized",
      external_reference: "u1",
      next_payment_date: "2030-02-01T00:00:00Z",
    });
    const res = await call({ type: "subscription_preapproval", data: { id: "pre1" } });
    expect(res.status).toBe(200);
    const upsertArgs = prismaMock.membership.upsert.mock.calls[0][0];
    expect(upsertArgs.where).toEqual({ userId: "u1" });
    expect(upsertArgs.create).toMatchObject({
      plan: "MONTHLY",
      status: "ACTIVE",
      generationLimit: 999999,
      mpPreapprovalId: "pre1",
    });
  });

  it("marca CANCELED al cancelarse la suscripción", async () => {
    getPreapprovalMock.mockResolvedValue({ id: "pre1", status: "cancelled", external_reference: "u1" });
    const res = await call({ type: "subscription_preapproval", data: { id: "pre1" } });
    expect(res.status).toBe(200);
    expect(prismaMock.membership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" }, data: { status: "CANCELED" } }),
    );
    expect(prismaMock.membership.upsert).not.toHaveBeenCalled();
  });

  it("extiende el periodo ante un cargo recurrente procesado", async () => {
    getAuthorizedPaymentMock.mockResolvedValue({ id: 5, status: "processed", preapproval_id: "pre1" });
    getPreapprovalMock.mockResolvedValue({
      id: "pre1",
      status: "authorized",
      external_reference: "u1",
      next_payment_date: "2030-03-01T00:00:00Z",
    });
    const res = await call({ type: "subscription_authorized_payment", data: { id: "5" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ charged: true });
    const upsertArgs = prismaMock.membership.upsert.mock.calls[0][0];
    expect(upsertArgs.update).toMatchObject({ plan: "MONTHLY", status: "ACTIVE" });
  });
});
