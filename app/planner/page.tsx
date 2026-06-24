import type { Metadata } from "next";

import { PlannerForm } from "@/components/planner-form";
import { TeacherShell } from "@/components/teacher-shell";

export const metadata: Metadata = {
  title: "Generación — ADIA",
};

export default function PlannerPage() {
  return (
    <TeacherShell>
      <div className="page-inner">
        <div className="intro">
          <h2>
            Generador de
            <br />
            <span>Planeación Didáctica</span>
          </h2>
          <p>
            Diseña planeaciones inclusivas alineadas a la Nueva Escuela Mexicana, adaptadas para estudiantes
            neurodivergentes.
          </p>
          <div className="intro-meta">
            <div className="meta-item">
              <div className="meta-dot" />
              Basado en NEM
            </div>
            <div className="meta-item">
              <div className="meta-dot" />
              Enfoque inclusivo
            </div>
            <div className="meta-item">
              <div className="meta-dot" />
              IA Generativa
            </div>
          </div>
        </div>

        <PlannerForm />
      </div>
    </TeacherShell>
  );
}
