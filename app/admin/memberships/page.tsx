import { MembershipsManager } from "@/components/admin/memberships-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  const memberships = await prisma.membership.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const data = memberships.map((membership) => ({
    userId: membership.userId,
    email: membership.user.email,
    plan: membership.plan,
    status: membership.status,
    suspended: membership.suspended,
    generationsUsed: membership.generationsUsed,
    generationLimit: membership.generationLimit,
    isAdmin: membership.user.role === "ADMIN",
  }));

  return (
    <>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Membresías</h1>
          <p>Estado de acceso y límites de generación. Suspende una cuenta para pausar sus generaciones.</p>
        </div>
      </div>
      <MembershipsManager memberships={data} />
    </>
  );
}
