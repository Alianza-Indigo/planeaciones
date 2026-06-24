import { BadgeCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PaymentButton } from "@/components/payment-button";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
}

export default async function AccountPage() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <AppShell>
        <div className="pageHeader">
          <div>
            <span className="eyebrow">Cuenta</span>
            <h1>Membresía y uso</h1>
            <p>Inicia sesión para ver tu plan y tus generaciones disponibles.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: session.user.id },
  });

  const plan = membership?.plan ?? "FREE";
  const used = membership?.generationsUsed ?? 0;
  const limit = membership?.generationLimit ?? 3;
  const periodEnd = membership?.currentPeriodEndsAt ?? null;
  const isActive =
    membership?.status === "ACTIVE" && (!periodEnd || periodEnd > new Date());
  const ilimitado = isActive && limit >= 999999;

  return (
    <AppShell>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Cuenta</span>
          <h1>Membresía y uso</h1>
          <p>Consulta tu plan, las generaciones disponibles y activa tu acceso anual.</p>
        </div>
      </div>
      <div className="grid three">
        <section className="panel stat">
          <span className="badge">Plan</span>
          <strong>{isActive ? "ANNUAL" : "FREE"}</strong>
          {isActive ? (
            <p>
              <BadgeCheck size={15} style={{ verticalAlign: "-2px" }} /> Activo
              {periodEnd ? ` · renueva el ${formatDate(periodEnd)}` : ""}
            </p>
          ) : (
            <p>{plan === "FREE" ? "Estás en el plan gratuito." : "Tu membresía expiró."}</p>
          )}
        </section>
        <section className="panel stat">
          <span className="badge">Generaciones</span>
          <strong>{ilimitado ? "Ilimitadas" : `${used} / ${limit}`}</strong>
          <p>
            {ilimitado
              ? "Tu membresía anual no tiene tope de generaciones."
              : `Has usado ${used} de ${limit} generaciones gratuitas.`}
          </p>
        </section>
        <section className="panel grid">
          <h2>ADIA — Membresía Anual</h2>
          {isActive ? (
            <p>Tu membresía está activa. ¡Gracias por apoyar el proyecto!</p>
          ) : (
            <>
              <p>Acceso ilimitado a generación de planeaciones por 1 año — $99 MXN.</p>
              <PaymentButton />
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
