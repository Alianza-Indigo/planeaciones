import { prisma } from "@/lib/db";

// Configuración operativa persistida en BD (tabla AppSetting), editable desde
// el panel admin. Se usa para valores que el negocio ajusta sin redeploy.

const MEMBERSHIP_PRICE_KEY = "membership_annual_price_cents";
const MEMBERSHIP_FREQUENCY_KEY = "membership_frequency";

// Precio por defecto de la membresía: $99 MXN.
export const DEFAULT_MEMBERSHIP_PRICE_CENTS = 9900;

export type MembershipFrequency = "monthly" | "annual";
export const DEFAULT_MEMBERSHIP_FREQUENCY: MembershipFrequency = "monthly";

// Traduce la frecuencia a los parámetros auto_recurring de Mercado Pago.
// MP solo acepta frequency_type "days" | "months"; anual = 12 meses.
export function frequencyToMercadoPago(freq: MembershipFrequency): {
  frequency: number;
  frequencyType: "months";
} {
  return freq === "annual" ? { frequency: 12, frequencyType: "months" } : { frequency: 1, frequencyType: "months" };
}

// Etiquetas de UI para la frecuencia.
export function frequencyLabels(freq: MembershipFrequency): { periodo: string; sufijo: string; plan: "MONTHLY" | "ANNUAL" } {
  return freq === "annual"
    ? { periodo: "año", sufijo: "al año", plan: "ANNUAL" }
    : { periodo: "mes", sufijo: "al mes", plan: "MONTHLY" };
}

export async function getMembershipFrequency(): Promise<MembershipFrequency> {
  const row = await prisma.appSetting.findUnique({ where: { key: MEMBERSHIP_FREQUENCY_KEY } });
  return row?.value === "annual" ? "annual" : "monthly";
}

export async function setMembershipFrequency(freq: MembershipFrequency): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: MEMBERSHIP_FREQUENCY_KEY },
    create: { key: MEMBERSHIP_FREQUENCY_KEY, value: freq },
    update: { value: freq },
  });
}

// Límites de cordura para el precio (en centavos): $1 a $100,000 MXN.
export const MIN_MEMBERSHIP_PRICE_CENTS = 100;
export const MAX_MEMBERSHIP_PRICE_CENTS = 10_000_000;

export async function getMembershipPriceCents(): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key: MEMBERSHIP_PRICE_KEY } });
  const parsed = row ? Number.parseInt(row.value, 10) : NaN;
  if (
    Number.isFinite(parsed) &&
    parsed >= MIN_MEMBERSHIP_PRICE_CENTS &&
    parsed <= MAX_MEMBERSHIP_PRICE_CENTS
  ) {
    return parsed;
  }
  return DEFAULT_MEMBERSHIP_PRICE_CENTS;
}

export async function setMembershipPriceCents(cents: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: MEMBERSHIP_PRICE_KEY },
    create: { key: MEMBERSHIP_PRICE_KEY, value: String(cents) },
    update: { value: String(cents) },
  });
}
