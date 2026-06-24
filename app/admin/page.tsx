import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [users, payments, generations, drafts] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.generation.count(),
    prisma.planningDraft.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Operación de Planeaciones</h1>
          <p>Resumen de usuarios, pagos, generaciones y drafts temporales.</p>
        </div>
      </div>
      <div className="grid four">
        {[
          ["Usuarios", users],
          ["Pagos", payments],
          ["Generaciones", generations],
          ["Drafts vivos", drafts],
        ].map(([label, value]) => (
          <section className="panel stat" key={label}>
            <span className="badge">{label}</span>
            <strong>{value}</strong>
          </section>
        ))}
      </div>
    </>
  );
}
