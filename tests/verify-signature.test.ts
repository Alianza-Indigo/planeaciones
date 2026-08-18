import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  verifyMercadoPagoSignature,
  verifyStripeSignature,
} from "@/lib/payments/verify-signature";

const SECRET = "test-secret";
const DATA_ID = "123456";
const REQUEST_ID = "req-abc";
const TS = "1700000000";

function signedHeader(secret = SECRET, ts = TS, dataId = DATA_ID, requestId = REQUEST_ID): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyMercadoPagoSignature", () => {
  it("sin secreto configurado no valida y acepta", () => {
    expect(
      verifyMercadoPagoSignature({
        secret: undefined,
        xSignature: null,
        xRequestId: null,
        dataId: null,
      }),
    ).toBe(true);
  });

  it("acepta una firma HMAC válida", () => {
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        xSignature: signedHeader(),
        xRequestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(true);
  });

  it("rechaza una firma manipulada", () => {
    const tampered = signedHeader().replace(/v1=.*/, "v1=deadbeef");
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        xSignature: tampered,
        xRequestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(false);
  });

  it("rechaza si falta el header con secreto configurado", () => {
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        xSignature: null,
        xRequestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(false);
  });

  it("rechaza un header malformado", () => {
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        xSignature: "basura-sin-formato",
        xRequestId: REQUEST_ID,
        dataId: DATA_ID,
      }),
    ).toBe(false);
  });

  it("rechaza si cambia el request-id (manifiesto distinto)", () => {
    expect(
      verifyMercadoPagoSignature({
        secret: SECRET,
        xSignature: signedHeader(),
        xRequestId: "req-otro",
        dataId: DATA_ID,
      }),
    ).toBe(false);
  });
});

const STRIPE_SECRET = "whsec_test";
const STRIPE_TS = 1_700_000_000;

function stripeHeader(payload: string, secret = STRIPE_SECRET, ts = STRIPE_TS): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  const payload = JSON.stringify({ type: "checkout.session.completed", data: { object: {} } });

  it("sin secreto configurado no valida y acepta", () => {
    expect(
      verifyStripeSignature({ secret: undefined, signatureHeader: null, payload }),
    ).toBe(true);
  });

  it("acepta una firma HMAC válida", () => {
    expect(
      verifyStripeSignature({
        secret: STRIPE_SECRET,
        signatureHeader: stripeHeader(payload),
        payload,
        toleranceSeconds: 300,
        nowSeconds: STRIPE_TS + 10,
      }),
    ).toBe(true);
  });

  it("acepta cuando el header trae varias firmas v1", () => {
    const header = `t=${STRIPE_TS},v1=deadbeef,${stripeHeader(payload).split(",")[1]}`;
    expect(
      verifyStripeSignature({ secret: STRIPE_SECRET, signatureHeader: header, payload }),
    ).toBe(true);
  });

  it("rechaza una firma manipulada", () => {
    const tampered = stripeHeader(payload).replace(/v1=.*/, "v1=deadbeef");
    expect(
      verifyStripeSignature({ secret: STRIPE_SECRET, signatureHeader: tampered, payload }),
    ).toBe(false);
  });

  it("rechaza si el payload cambió (firma sobre otros bytes)", () => {
    expect(
      verifyStripeSignature({
        secret: STRIPE_SECRET,
        signatureHeader: stripeHeader(payload),
        payload: payload + " ",
      }),
    ).toBe(false);
  });

  it("rechaza si falta el header con secreto configurado", () => {
    expect(
      verifyStripeSignature({ secret: STRIPE_SECRET, signatureHeader: null, payload }),
    ).toBe(false);
  });

  it("rechaza un header malformado", () => {
    expect(
      verifyStripeSignature({ secret: STRIPE_SECRET, signatureHeader: "basura", payload }),
    ).toBe(false);
  });

  it("rechaza un timestamp fuera de la ventana de tolerancia", () => {
    expect(
      verifyStripeSignature({
        secret: STRIPE_SECRET,
        signatureHeader: stripeHeader(payload),
        payload,
        toleranceSeconds: 300,
        nowSeconds: STRIPE_TS + 10_000,
      }),
    ).toBe(false);
  });
});
