import crypto from "node:crypto";

// Verificación pura de la firma del webhook de Mercado Pago (header x-signature).
// Formato del header: "ts=...,v1=...". El manifiesto firmado es:
//   id:<dataId>;request-id:<requestId>;ts:<ts>;
// Sin `secret` configurado no se valida (entornos de prueba) y devuelve true.
export function verifyMercadoPagoSignature(params: {
  secret?: string;
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const { secret, xSignature, xRequestId, dataId } = params;

  if (!secret) {
    return true;
  }

  if (!xSignature || !dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    xSignature
      .split(",")
      .map((part) => part.split("=").map((value) => value.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

// Verificación pura de la firma del webhook de Stripe (header Stripe-Signature).
// Formato: "t=<ts>,v1=<hex>[,v1=<hex>...]". El payload firmado es `${t}.${body}`
// y se firma con HMAC-SHA256 usando el signing secret (whsec_...). IMPORTANTE:
// `payload` debe ser el cuerpo crudo (request.text()), no el JSON re-serializado.
// Sin `secret` no se valida (entornos de prueba) y devuelve true.
export function verifyStripeSignature(params: {
  secret?: string;
  signatureHeader: string | null;
  payload: string;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): boolean {
  const { secret, signatureHeader, payload } = params;

  if (!secret) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  let ts: string | undefined;
  const v1s: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=").map((v) => v.trim());
    if (key === "t") ts = value;
    else if (key === "v1" && value) v1s.push(value);
  }

  if (!ts || v1s.length === 0) {
    return false;
  }

  // Ventana anti-replay opcional (Stripe recomienda 300 s).
  if (params.toleranceSeconds != null && params.nowSeconds != null) {
    const tsNum = Number.parseInt(ts, 10);
    if (!Number.isFinite(tsNum) || Math.abs(params.nowSeconds - tsNum) > params.toleranceSeconds) {
      return false;
    }
  }

  const signedPayload = `${ts}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuf = Buffer.from(expected);

  return v1s.some((v1) => {
    try {
      const candidate = Buffer.from(v1);
      return (
        candidate.length === expectedBuf.length && crypto.timingSafeEqual(candidate, expectedBuf)
      );
    } catch {
      return false;
    }
  });
}
