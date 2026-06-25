import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Solo administradores: los no autenticados van al login y los docentes a su panel.
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/planner");

  return <AdminShell email={session.user.email ?? undefined}>{children}</AdminShell>;
}
