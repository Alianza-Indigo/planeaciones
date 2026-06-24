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
