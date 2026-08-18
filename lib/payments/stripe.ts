import { getStripeEnv } from "@/lib/env";

// Cliente ligero de Stripe sobre la REST API (mismo enfoque que Mercado Pago:
// solo `fetch`, sin SDK ni dependencias nuevas). La API de Stripe recibe el
// cuerpo como application/x-www-form-urlencoded con claves anidadas entre
// corchetes (p. ej. line_items[0][price_data][currency]).

const STRIPE_API = "https://api.stripe.com/v1";

function authHeader(): string {
  const { STRIPE_SECRET_KEY } = getStripeEnv();
  return `Bearer ${STRIPE_SECRET_KEY}`;
}

export type StripeCheckoutInput = {
  userId: string;
  email: string;
  productName: string;
  amountCents: number;
  interval: "month" | "year";
  plan: "MONTHLY" | "ANNUAL";
  successUrl: string;
  cancelUrl: string;
};

// Crea una sesión de Checkout en modo suscripción. El precio se define en
// línea (price_data) para respetar el precio editable desde el panel admin,
// sin necesidad de crear Products/Prices en el dashboard de Stripe.
export async function createStripeCheckoutSubscription(
  input: StripeCheckoutInput,
): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  // client_reference_id + metadata permiten mapear el pago de vuelta al usuario.
  body.set("client_reference_id", input.userId);
  body.set("customer_email", input.email);
  body.set("metadata[userId]", input.userId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "mxn");
  body.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  body.set("line_items[0][price_data][product_data][name]", input.productName);
  body.set("line_items[0][price_data][recurring][interval]", input.interval);
  // La metadata en subscription_data queda en la suscripción, que es el
  // objeto autoritativo que consulta el webhook.
  body.set("subscription_data[metadata][userId]", input.userId);
  body.set("subscription_data[metadata][plan]", input.plan);

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      authorization: authHeader(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Stripe respondió ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<{ id: string; url: string }>;
}

export type StripeSubscriptionItem = {
  current_period_end?: number;
  price?: { recurring?: { interval?: string } | null } | null;
};

export type StripeSubscription = {
  id: string;
  // active | trialing | past_due | canceled | unpaid | incomplete | ...
  status: string;
  customer: string;
  cancel_at_period_end?: boolean;
  // En versiones antiguas de la API vive en la suscripción; en versiones
  // recientes (2025+) se movió a cada item. Se lee de ambos lugares.
  current_period_end?: number;
  metadata?: { userId?: string; plan?: string } | null;
  items?: { data?: StripeSubscriptionItem[] } | null;
};

// Consulta autoritativa de la suscripción. El webhook nunca confía en el
// cuerpo del evento: vuelve a leer el estado real aquí.
export async function getStripeSubscription(id: string): Promise<StripeSubscription> {
  const response = await fetch(`${STRIPE_API}/subscriptions/${id}`, {
    headers: { authorization: authHeader() },
  });

  if (!response.ok) {
    throw new Error(`Stripe respondió ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<StripeSubscription>;
}

// Fecha de fin del periodo vigente, tolerante a la versión de la API.
export function stripePeriodEndSeconds(sub: StripeSubscription): number | null {
  if (typeof sub.current_period_end === "number") return sub.current_period_end;
  const item = sub.items?.data?.[0];
  if (item && typeof item.current_period_end === "number") return item.current_period_end;
  return null;
}

// Deriva el plan (mensual/anual) de la periodicidad real de la suscripción,
// con la metadata como respaldo.
export function stripePlanFromSubscription(sub: StripeSubscription): "MONTHLY" | "ANNUAL" {
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "year") return "ANNUAL";
  if (interval === "month") return "MONTHLY";
  return sub.metadata?.plan === "ANNUAL" ? "ANNUAL" : "MONTHLY";
}

// Programa la cancelación al final del periodo ya pagado: no se hacen más
// cargos, pero el docente conserva el acceso hasta esa fecha.
export async function cancelStripeSubscription(id: string): Promise<void> {
  const body = new URLSearchParams();
  body.set("cancel_at_period_end", "true");

  const response = await fetch(`${STRIPE_API}/subscriptions/${id}`, {
    method: "POST",
    headers: {
      authorization: authHeader(),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Stripe respondió ${response.status}: ${await response.text()}`);
  }
}
