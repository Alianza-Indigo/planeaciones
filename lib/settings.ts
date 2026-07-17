import { prisma } from "@/lib/db";

// Configuración operativa persistida en BD (tabla AppSetting), editable desde
// el panel admin. Se usa para valores que el negocio ajusta sin redeploy.

const MEMBERSHIP_PRICE_KEY = "membership_annual_price_cents";

// Precio mensual por defecto de la membresía: $99 MXN/mes.
export const DEFAULT_MEMBERSHIP_PRICE_CENTS = 9900;

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
