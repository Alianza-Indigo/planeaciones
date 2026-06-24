import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyMercadoPagoSignature } from "@/lib/payments/verify-signature";

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
