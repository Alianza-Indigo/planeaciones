import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ESTADO_LABEL: Record<string, string> = {
  STARTED: "En curso",
  COMPLETED: "Completada",
  FAILED: "Fallida",
};

export default async function AdminHomePage() {
  const now = new Date();
  const [users, activeMemberships, approvedPayments, generations, failed, drafts, recientes] = await Promise.all([
    prisma.user.count(),
    prisma.membership.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: "APPROVED" } }),
    prisma.generation.count(),
    prisma.generation.count({ where: { status: "FAILED" } }),
    prisma.planningDraft.count({ where: { expiresAt: { gt: now } } }),
    prisma.generation.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const stats: [string, number | string, string][] = [
    ["Usuarios", users, "Cuentas registradas"],
    ["Membresías activas", activeMemberships, "Acceso de pago vigente"],
    ["Pagos aprobados", approvedPayments, "Transacciones exitosas"],
    ["Generaciones", generations, "Planeaciones generadas"],
    ["Generaciones fallidas", failed, "Errores de generación"],
    ["Drafts vivos", drafts, "Borradores sin expirar"],
  ];

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Operación de ADIA</h1>
        <p>Resumen de usuarios, pagos, generaciones y drafts temporales.</p>
      </div>

      <div className="grid-3">
        {stats.map(([label, value, sub]) => (
          <section className="stat" key={label}>
            <span className="stat-label">{label}</span>
            <strong>{value}</strong>
            <p>{sub}</p>
          </section>
        ))}
      </div>

      <div className="section-label">Actividad reciente</div>
      <section className="panel">
        {recientes.length === 0 ? (
          <div className="empty">Aún no hay generaciones registradas.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Modelo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((generation) => (
                <tr key={generation.id}>
                  <td>{generation.user.email ?? "-"}</td>
                  <td>
                    <span
                      className={`tag ${
                        generation.status === "COMPLETED"
                          ? "ok"
                          : generation.status === "FAILED"
                            ? "missing"
                            : "neutral"
                      }`}
                    >
                      {ESTADO_LABEL[generation.status] ?? generation.status}
                    </span>
                  </td>
                  <td>{generation.model ?? "-"}</td>
                  <td>{generation.createdAt.toLocaleString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
