import { AppShell } from "@/components/app-shell";
import { PlannerForm } from "@/components/planner-form";

export default function PlannerPage() {
  return (
    <AppShell>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Nueva planeación</span>
          <h1>Generar una secuencia lista para aplicar</h1>
          <p>
            Captura los datos curriculares, necesidades del grupo y productos esperados. La planeación se guarda como
            draft temporal hasta enviarla al Drive del docente.
          </p>
        </div>
        <span className="badge">20 / 60 / 20</span>
      </div>
      <div className="grid two">
        <PlannerForm />
        <aside className="grid">
          <section className="panel">
            <h2>Neuroinclusión</h2>
            <p>
              El prompt maestro pide alternativas equivalentes, productos observables y reduccion de barreras
              sensoriales, motrices y de lenguaje.
            </p>
          </section>
          <section className="panel">
            <h2>Salida esperada</h2>
            <p>
              Markdown editable con sesiones, scripts, materiales, evaluación formativa y adaptaciones por actividad.
            </p>
          </section>
          <section className="panel">
            <h2>Exportación</h2>
            <p>
              Al terminar, el archivo se manda al Google Drive del docente con el permiso autorizado en su cuenta.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
