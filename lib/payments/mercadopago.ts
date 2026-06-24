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
