import { z } from "zod";

const serverEnvSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(24),
  NEXTAUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADOPAGO_SUCCESS_URL: z.string().url(),
  MERCADOPAGO_FAILURE_URL: z.string().url(),
  PUBLIC_BASE_URL: z.string().url().optional(),
  ADMIN_EMAILS: z.string().default(""),
  DRAFT_TTL_HOURS: z.coerce.number().int().positive().default(24),
  CRON_SECRET: z.string().optional(),
});

const geminiEnvSchema = serverEnvSchema.pick({
  GEMINI_API_KEY: true,
  GEMINI_MODEL: true,
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

export function getGeminiEnv() {
  return geminiEnvSchema.parse(process.env);
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
