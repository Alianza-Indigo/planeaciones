import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDraftsPage() {
  const drafts = await prisma.planningDraft.findMany({
    include: { user: true },
    where: { expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
    take: 50,
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Drafts temporales</h1>
          <p>Planeaciones vivas pendientes de exportarse o expirar.</p>
        </div>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Título</th>
              <th>Expira</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.id}>
                <td>{draft.user.email}</td>
                <td>{draft.title}</td>
                <td>{draft.expiresAt.toLocaleString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
