import { UsersManager } from "@/components/admin/users-manager";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const data = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));

  return (
    <>
      <div className="page-header">
        <span className="eyebrow">Admin</span>
        <h1>Usuarios</h1>
        <p>Docentes registrados con Google. Asigna o quita el rol de administrador desde aquí.</p>
      </div>
      <UsersManager users={data} currentUserId={session?.user.id ?? ""} />
    </>
  );
}
