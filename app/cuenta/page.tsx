import { BadgeCheck } from "lucide-react";

import { PaymentButton } from "@/components/payment-button";
import { TeacherShell } from "@/components/teacher-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FREE_GENERATION_LIMIT } from "@/lib/membership";

export const runtime = "nodejs";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
}

export default async function AccountPage() {
  const session = await getSession();

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

  const plan = membership?.plan ?? "FREE";
  const used = membership?.generationsUsed ?? 0;
  const periodEnd = membership?.currentPeriodEndsAt ?? null;
  const isAdmin = session.user.role === "ADMIN";
  const isActive = membership?.status === "ACTIVE" && (!periodEnd || periodEnd > new Date());
  // Usuarios gratuitos: el límite efectivo es el del plan gratuito. Los
  // administradores no tienen tope.
  const limit = isActive ? membership?.generationLimit ?? 0 : FREE_GENERATION_LIMIT;
  const ilimitado = isAdmin || (isActive && limit >= 999999);

  return (
    <TeacherShell>
      <div className="page-inner wide">
        <div className="page-header">
          <span className="eyebrow">Mi cuenta</span>
          <h1>Membresía y uso</h1>
          <p>Consulta tu plan, las generaciones disponibles y activa tu acceso anual.</p>
        </div>

        <div className="grid-3">
          <section className="stat">
            <span className="stat-label">Plan</span>
            <strong>{isActive ? "ANUAL" : "GRATIS"}</strong>
            {isActive ? (
              <p>
                <BadgeCheck size={14} style={{ verticalAlign: "-2px" }} /> Activo
                {periodEnd ? ` · renueva el ${formatDate(periodEnd)}` : ""}
              </p>
            ) : (
              <p>{plan === "FREE" ? "Estás en el plan gratuito." : "Tu membresía expiró."}</p>
            )}
          </section>

          <section className="stat">
            <span className="stat-label">Generaciones</span>
            <strong>{ilimitado ? "Ilimitadas" : `${used} / ${limit}`}</strong>
            <p>
              {ilimitado
                ? "Tu membresía anual no tiene tope de generaciones."
                : `Has usado ${used} de ${limit} generaciones gratuitas.`}
            </p>
          </section>

          <section className="card" style={{ display: "flex", flexDirection: "column", gap: 12, margin: 0 }}>
            <h2 style={{ fontSize: 16 }}>ADIA — Membresía Anual</h2>
            {isActive ? (
              <p className="hint">Tu membresía está activa. ¡Gracias por apoyar el proyecto!</p>
            ) : (
              <>
                <p className="hint">Acceso ilimitado a generación de planeaciones por 1 año — $99 MXN.</p>
                <PaymentButton />
              </>
            )}
          </section>
        </div>
      </div>
    </TeacherShell>
  );
}
