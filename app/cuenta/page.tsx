import { BadgeCheck } from "lucide-react";

import { CancelSubscription } from "@/components/cancel-subscription";
import { PaymentButton } from "@/components/payment-button";
import { TeacherShell } from "@/components/teacher-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FREE_GENERATION_LIMIT } from "@/lib/membership";
import { getAnnualPriceCents, getMonthlyPriceCents } from "@/lib/settings";

export const runtime = "nodejs";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
}

function mxn(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string; paid?: string }>;
}) {
  const session = await getSession();
  const { sub, paid } = await searchParams;

  if (!session?.user) {
    return (
      <TeacherShell>
        <div className="page-inner">
          <div className="page-header">
            <span className="eyebrow">Mi cuenta</span>
            <h1>Membresía y uso</h1>
            <p>Inicia sesión para ver tu plan y tus generaciones disponibles.</p>
          </div>
        </div>
      </TeacherShell>
    );
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  const [monthlyCents, annualCents] = await Promise.all([getMonthlyPriceCents(), getAnnualPriceCents()]);

  const plan = membership?.plan ?? "FREE";
  const used = membership?.generationsUsed ?? 0;
  const periodEnd = membership?.currentPeriodEndsAt ?? null;
  const isAdmin = session.user.role === "ADMIN";
  const status = membership?.status;
  const vigente = !periodEnd || periodEnd > new Date();
  // Con acceso de pago: suscripción activa, o cancelada pero aún dentro del
  // periodo ya pagado.
  const suscrito = (status === "ACTIVE" || status === "CANCELED") && vigente;
  const isActive = status === "ACTIVE" && vigente; // suscripción viva (renovará)
  const canceladaVigente = status === "CANCELED" && vigente;
  // Usuarios gratuitos: el límite efectivo es el del plan gratuito. Los
  // administradores no tienen tope.
  const limit = suscrito ? membership?.generationLimit ?? 0 : FREE_GENERATION_LIMIT;
  const ilimitado = isAdmin || (suscrito && limit >= 999999);
  const planLabelActual = membership?.plan === "ANNUAL" ? "ANUAL" : "MENSUAL";

  return (
    <TeacherShell>
      <div className="page-inner wide">
        <div className="page-header">
          <span className="eyebrow">Mi cuenta</span>
          <h1>Membresía y uso</h1>
          <p>Consulta tu plan, las generaciones disponibles y elige tu suscripción.</p>
        </div>

        {sub === "1" && !isActive ? (
          <p className="hint" style={{ marginBottom: 16 }}>
            Estamos activando tu suscripción. Puede tardar unos segundos; recarga esta página en un momento.
          </p>
        ) : null}
        {paid === "0" ? (
          <p className="alert" style={{ marginBottom: 16 }}>
            El pago no se completó. Puedes intentarlo de nuevo.
          </p>
        ) : null}

        <div className="grid-3">
          <section className="stat">
            <span className="stat-label">Plan</span>
            <strong>{suscrito ? planLabelActual : "GRATIS"}</strong>
            {isActive ? (
              <p>
                <BadgeCheck size={14} style={{ verticalAlign: "-2px" }} /> Activa
                {periodEnd ? ` · próximo cargo el ${formatDate(periodEnd)}` : ""}
              </p>
            ) : canceladaVigente ? (
              <p>Cancelada{periodEnd ? ` · acceso hasta el ${formatDate(periodEnd)}` : ""}.</p>
            ) : (
              <p>{plan === "FREE" ? "Estás en el plan gratuito." : "Tu membresía expiró."}</p>
            )}
          </section>

          <section className="stat">
            <span className="stat-label">Generaciones</span>
            <strong>{ilimitado ? "Ilimitadas" : `${used} / ${limit}`}</strong>
            <p>
              {ilimitado
                ? "Tu membresía no tiene tope de generaciones."
                : `Has usado ${used} de ${limit} generaciones gratuitas.`}
            </p>
          </section>

          <section className="card" style={{ display: "flex", flexDirection: "column", gap: 12, margin: 0 }}>
            {isActive ? (
              <>
                <h2 style={{ fontSize: 16 }}>Membresía {planLabelActual === "ANUAL" ? "Anual" : "Mensual"}</h2>
                <p className="hint">Tu suscripción está activa. ¡Gracias por apoyar el proyecto!</p>
                <CancelSubscription />
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 16 }}>Activa tu acceso ilimitado</h2>
                <p className="hint">
                  {canceladaVigente
                    ? "Tu suscripción está cancelada. Reactívala con el plan que prefieras:"
                    : "Genera planeaciones sin límite. Elige tu plan:"}
                </p>

                <div className="plan-option">
                  <div>
                    <strong>Mensual</strong>
                    <span>{mxn(monthlyCents)} al mes</span>
                  </div>
                  <PaymentButton plan="monthly" label={`Mensual · ${mxn(monthlyCents)}`} />
                </div>

                <div className="plan-option">
                  <div>
                    <strong>Anual</strong>
                    <span>{mxn(annualCents)} al año</span>
                  </div>
                  <PaymentButton plan="annual" label={`Anual · ${mxn(annualCents)}`} />
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </TeacherShell>
  );
}
