import { PriceEditor } from "@/components/admin/price-editor";
import { getAdminEmails } from "@/lib/env";
import { getAnnualPriceCents, getMonthlyPriceCents } from "@/lib/settings";

export const dynamic = "force-dynamic";

function isSet(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export default async function AdminSettingsPage() {
  const adminEmails = getAdminEmails();
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const ttl = process.env.DRAFT_TTL_HOURS || "24";
  const monthlyCents = await getMonthlyPriceCents();
  const annualCents = await getAnnualPriceCents();

  // Estado de las variables de entorno (sin exponer sus valores).
  const envVars: { key: string; label: string; required: boolean }[] = [
    { key: "GEMINI_API_KEY", label: "IA (generación con Gemini)", required: true },
    { key: "DATABASE_URL", label: "Base de datos (Neon)", required: true },
    { key: "NEXTAUTH_SECRET", label: "Secreto de sesión", required: true },
    { key: "NEXTAUTH_URL", label: "URL pública (NextAuth)", required: false },
    { key: "GOOGLE_CLIENT_ID", label: "Google OAuth — Client ID", required: true },
    { key: "GOOGLE_CLIENT_SECRET", label: "Google OAuth — Secret", required: true },
    { key: "MERCADOPAGO_ACCESS_TOKEN", label: "Mercado Pago — Token", required: true },
    { key: "MERCADOPAGO_WEBHOOK_SECRET", label: "Mercado Pago — Webhook secret", required: false },
    { key: "PUBLIC_BASE_URL", label: "URL pública (webhook MP)", required: false },
    { key: "CRON_SECRET", label: "Secreto del cron de limpieza", required: false },
  ];

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Ajustes</h1>
        <p>Configuración operativa. Los valores sensibles se gestionan por variables de entorno en Vercel.</p>
      </div>

      <div className="section-label">Membresía</div>
      <section className="panel">
        <PriceEditor initialMonthly={monthlyCents / 100} initialAnnual={annualCents / 100} />
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>IA — Google Gemini</h2>
          <div className="config-row">
            <div className="config-key">Modelo</div>
            <span className="config-value">{model}</span>
          </div>
          <div className="config-row">
            <div className="config-key">API key</div>
            <span className={`tag ${isSet(process.env.GEMINI_API_KEY) ? "ok" : "missing"}`}>
              {isSet(process.env.GEMINI_API_KEY) ? "Configurada" : "Falta"}
            </span>
          </div>
        </section>

        <section className="panel">
          <h2>Drafts y administración</h2>
          <div className="config-row">
            <div className="config-key">Expiración de borradores</div>
            <span className="config-value">{ttl} horas</span>
          </div>
          <div className="config-row">
            <div className="config-key">
              Administradores
              <span>Definidos en ADMIN_EMAILS</span>
            </div>
            <span className="config-value">{adminEmails.length > 0 ? adminEmails.join(", ") : "Ninguno"}</span>
          </div>
        </section>
      </div>

      <div className="section-label">Estado de variables de entorno</div>
      <section className="panel">
        {envVars.map((envVar) => {
          const set = isSet(process.env[envVar.key]);
          return (
            <div className="config-row" key={envVar.key}>
              <div className="config-key">
                {envVar.label}
                <span>
                  {envVar.key}
                  {envVar.required ? " · obligatoria" : " · opcional"}
                </span>
              </div>
              <span className={`tag ${set ? "ok" : envVar.required ? "missing" : "neutral"}`}>
                {set ? "Configurada" : envVar.required ? "Falta" : "Sin definir"}
              </span>
            </div>
          );
        })}
      </section>
    </>
  );
}
