import { getMercadoPagoEnv } from "@/lib/env";

export type CheckoutPreferenceInput = {
  title: string;
  description: string;
  amountCents: number;
  userId: string;
  paymentId: string;
};

export async function createMercadoPagoPreference(input: CheckoutPreferenceInput) {
  const env = getMercadoPagoEnv();
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          description: input.description,
          quantity: 1,
          currency_id: "MXN",
          unit_price: input.amountCents / 100,
        },
      ],
      external_reference: input.paymentId,
      metadata: {
        user_id: input.userId,
        payment_id: input.paymentId,
      },
      back_urls: {
        success: env.MERCADOPAGO_SUCCESS_URL,
        failure: env.MERCADOPAGO_FAILURE_URL,
        pending: env.MERCADOPAGO_SUCCESS_URL,
      },
      auto_return: "approved",
      // Mercado Pago notificará el resultado del pago a este endpoint. Requiere
      // PUBLIC_BASE_URL (dominio público); si no está, se omite y debe
      // configurarse el webhook en el panel de Mercado Pago.
      ...(env.PUBLIC_BASE_URL
        ? { notification_url: `${env.PUBLIC_BASE_URL}/api/payments/webhook` }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string; init_point: string; sandbox_init_point?: string }>;
}

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  external_reference?: string | null;
};

// Consulta autoritativa del pago en la API de Mercado Pago. El webhook nunca
// confía en el cuerpo de la notificación: vuelve a leer el estado real aquí.
export async function getMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const env = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<MercadoPagoPayment>;
}

// ── Suscripciones (preapproval) — cobro recurrente mensual ──

export type SubscriptionInput = {
  reason: string;
  amountCents: number;
  payerEmail: string;
  userId: string;
  backUrl: string;
};

// Crea una suscripción (preapproval) sin plan asociado. Devuelve init_point,
// la URL donde el docente autoriza el cargo recurrente con su tarjeta.
export async function createMercadoPagoSubscription(input: SubscriptionInput) {
  const env = getMercadoPagoEnv();
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: input.reason,
      external_reference: input.userId,
      payer_email: input.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amountCents / 100,
        currency_id: "MXN",
      },
      back_url: input.backUrl,
      status: "pending",
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string; init_point: string }>;
}

export type MercadoPagoPreapproval = {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  external_reference?: string | null;
  payer_id?: number | string;
  next_payment_date?: string | null;
};

export async function getMercadoPagoPreapproval(id: string): Promise<MercadoPagoPreapproval> {
  const env = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    headers: { authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<MercadoPagoPreapproval>;
}

export type MercadoPagoAuthorizedPayment = {
  id: number | string;
  preapproval_id?: string;
  status?: string; // scheduled | processed | recycling | ...
};

export async function getMercadoPagoAuthorizedPayment(
  id: string,
): Promise<MercadoPagoAuthorizedPayment> {
  const env = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, {
    headers: { authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<MercadoPagoAuthorizedPayment>;
}

// Cancela la suscripción en Mercado Pago (detiene cargos futuros).
export async function cancelMercadoPagoSubscription(id: string): Promise<void> {
  const env = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondio ${response.status}: ${await response.text()}`);
  }
}
