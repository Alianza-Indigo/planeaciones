import type { Metadata } from "next";

import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "ADIA — Asistente Docente de Inteligencia Artificial",
  description:
    "ADIA genera planeaciones completas alineadas al NEM con guion docente, materiales, evaluación e inclusión neurodivergente integrada.",
};

export default function HomePage() {
  return <LandingPage />;
}
