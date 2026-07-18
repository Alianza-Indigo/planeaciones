import { prisma } from "@/lib/db";

// Configuración operativa persistida en BD (tabla AppSetting), editable desde
// el panel admin. Se usa para valores que el negocio ajusta sin redeploy.

export type Plan = "monthly" | "annual";

// Se ofrecen ambos planes; cada uno tiene su propio precio. El key mensual
// reutiliza la clave histórica para conservar el valor ya configurado.
const MONTHLY_PRICE_KEY = "membership_annual_price_cents";
const ANNUAL_PRICE_KEY = "membership_price_annual_cents";

export const DEFAULT_MONTHLY_CENTS = 9900; // $99 / mes
export const DEFAULT_ANNUAL_CENTS = 99000; // $990 / año

// Mínimo $10 MXN: Mercado Pago rechaza suscripciones con monto menor.
export const MIN_PRICE_CENTS = 1000;
export const MAX_PRICE_CENTS = 10_000_000;

function clampOrDefault(raw: string | undefined, def: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= MIN_PRICE_CENTS && parsed <= MAX_PRICE_CENTS
    ? parsed
    : def;
}

async function readPrice(key: string, def: number): Promise<number> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return clampOrDefault(row?.value, def);
}

async function writePrice(key: string, cents: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: String(cents) },
    update: { value: String(cents) },
  });
}

export const getMonthlyPriceCents = () => readPrice(MONTHLY_PRICE_KEY, DEFAULT_MONTHLY_CENTS);
export const getAnnualPriceCents = () => readPrice(ANNUAL_PRICE_KEY, DEFAULT_ANNUAL_CENTS);
export const setMonthlyPriceCents = (cents: number) => writePrice(MONTHLY_PRICE_KEY, cents);
export const setAnnualPriceCents = (cents: number) => writePrice(ANNUAL_PRICE_KEY, cents);

export async function getPlanPriceCents(plan: Plan): Promise<number> {
  return plan === "annual" ? getAnnualPriceCents() : getMonthlyPriceCents();
}

// Parámetros de un plan: periodicidad Mercado Pago + etiquetas de UI.
// MP solo acepta frequency_type "days" | "months"; anual = 12 meses.
export function planConfig(plan: Plan): {
  frequency: number;
  frequencyType: "months";
  periodo: string;
  sufijo: string;
  planLabel: "MONTHLY" | "ANNUAL";
  reason: string;
} {
  return plan === "annual"
    ? {
        frequency: 12,
        frequencyType: "months",
        periodo: "año",
        sufijo: "al año",
        planLabel: "ANNUAL",
        reason: "ADIA — Membresía anual",
      }
    : {
        frequency: 1,
        frequencyType: "months",
        periodo: "mes",
        sufijo: "al mes",
        planLabel: "MONTHLY",
        reason: "ADIA — Membresía mensual",
      };
}
