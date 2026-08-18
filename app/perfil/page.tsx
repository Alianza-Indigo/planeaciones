import type { Metadata } from "next";

import { TeacherProfileForm } from "@/components/teacher-profile-form";
import { TeacherShell } from "@/components/teacher-shell";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Mi perfil docente — ADIA",
};

export default async function PerfilPage() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <TeacherShell>
        <div className="page-inner">
          <div className="page-header">
            <span className="eyebrow">Perfil docente</span>
            <h1>Mi perfil</h1>
            <p>Inicia sesión para configurar tu perfil docente.</p>
          </div>
        </div>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell>
      <div className="page-inner">
        <div className="page-header">
          <span className="eyebrow">Perfil docente</span>
          <h1>Mi perfil</h1>
          <p>
            Tu nombre, escuela, nivel y grado se usan automáticamente en todas tus planeaciones.
          </p>
        </div>
        <TeacherProfileForm />
      </div>
    </TeacherShell>
  );
}
