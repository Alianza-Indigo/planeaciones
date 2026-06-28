import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  const memberships = await prisma.membership.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Membresías</h1>
          <p>Estado de acceso y límites de generación.</p>
        </div>
      </div>
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Uso</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((membership) => (
              <tr key={membership.id}>
                <td>{membership.user.email}</td>
                <td>{membership.plan}</td>
                <td>{membership.status}</td>
                <td>
                  {membership.user.role === "ADMIN"
                    ? `${membership.generationsUsed}/∞`
                    : `${membership.generationsUsed}/${membership.generationLimit}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
