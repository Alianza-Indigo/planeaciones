import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing-page";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ADIA — Asistente Docente de Inteligencia Artificial",
  description:
    "ADIA genera planeaciones completas alineadas al NEM con guion docente, materiales, evaluación e inclusión neurodivergente integrada.",
};

export default async function HomePage() {
  const session = await getSession();

  // Visitantes sin sesión ven la landing; con sesión, directo a su panel.
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/planner");
  }

  return <LandingPage />;
}
