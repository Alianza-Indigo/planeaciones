import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TeacherDashboard } from "@/components/teacher-dashboard";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Generación — ADIA",
};

export default async function PlannerPage() {
  // Acceso restringido: hay que iniciar sesión antes de llegar al generador
  // para evitar abuso del sistema sin una cuenta asociada.
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <TeacherDashboard />;
}
