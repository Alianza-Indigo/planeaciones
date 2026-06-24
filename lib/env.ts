import { z } from "zod";

const serverEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(24),
  NEXTAUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ALIANZA_INDIGO_API_URL: z.string().url(),
  ALIANZA_INDIGO_API_KEY: z.string().min(1),
  ALIANZA_INDIGO_MODEL: z.string().default("default"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADOPAGO_SUCCESS_URL: z.string().url(),
  MERCADOPAGO_FAILURE_URL: z.string().url(),
  PUBLIC_BASE_URL: z.string().url().optional(),
  ADMIN_EMAILS: z.string().default(""),
  DRAFT_TTL_HOURS: z.coerce.number().int().positive().default(24),
  CRON_SECRET: z.string().optional(),
});

const alianzaEnvSchema = serverEnvSchema.pick({
  ALIANZA_INDIGO_API_URL: true,
  ALIANZA_INDIGO_API_KEY: true,
  ALIANZA_INDIGO_MODEL: true,
});

const mercadoPagoEnvSchema = serverEnvSchema.pick({
  MERCADOPAGO_ACCESS_TOKEN: true,
  MERCADOPAGO_SUCCESS_URL: true,
  MERCADOPAGO_FAILURE_URL: true,
  PUBLIC_BASE_URL: true,
});

const draftEnvSchema = serverEnvSchema.pick({
  DRAFT_TTL_HOURS: true,
});

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}

export function getAlianzaEnv() {
  return alianzaEnvSchema.parse(process.env);
}

export function getMercadoPagoEnv() {
  return mercadoPagoEnvSchema.parse(process.env);
}

export function getDraftEnv() {
  return draftEnvSchema.parse(process.env);
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
