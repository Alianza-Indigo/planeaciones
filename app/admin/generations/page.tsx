import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminGenerationsPage() {
  const generations = await prisma.generation.findMany({
    include: { user: true, promptTemplate: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Generaciones</h1>
          <p>Historial técnico sin conservar planeaciones completas de forma permanente.</p>
        </div>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Modelo</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            {generations.map((generation) => (
              <tr key={generation.id}>
                <td>{generation.user.email}</td>
                <td>{generation.status}</td>
                <td>{generation.model ?? "-"}</td>
                <td>{generation.promptTemplate?.version ?? "fallback"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
