import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [users, payments, generations, drafts] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.generation.count(),
    prisma.planningDraft.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  const stats: [string, number, string][] = [
    ["Usuarios", users, "Cuentas registradas"],
    ["Pagos", payments, "Transacciones totales"],
    ["Generaciones", generations, "Planeaciones generadas"],
    ["Drafts vivos", drafts, "Borradores sin expirar"],
  ];

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Operación de ADIA</h1>
        <p>Resumen de usuarios, pagos, generaciones y drafts temporales.</p>
      </div>
      <div className="grid-4">
        {stats.map(([label, value, sub]) => (
          <section className="stat" key={label}>
            <span className="stat-label">{label}</span>
            <strong>{value}</strong>
            <p>{sub}</p>
          </section>
        ))}
      </div>
    </>
  );
}
