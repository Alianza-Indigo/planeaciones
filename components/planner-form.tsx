"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const estrategias = ["Rúbrica", "Lista de cotejo", "Material imprimible", "Adecuaciones neuroinclusivas"];

export function PlannerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const selected = estrategias.filter((estrategia) => data.getAll("estrategias").includes(estrategia));

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nombreDocente: data.get("nombreDocente"),
        nombreEscuela: data.get("nombreEscuela"),
        periodoPlaneado: data.get("periodoPlaneado"),
        grado: data.get("grado"),
        fase: data.get("fase"),
        duracion: data.get("duracion"),
        sesiones: data.get("sesiones"),
        proyecto: data.get("proyecto"),
        campos: String(data.get("campos")).split("\n").filter(Boolean),
        contenidos: String(data.get("contenidos")).split("\n").filter(Boolean),
        pda: String(data.get("pda")).split("\n").filter(Boolean),
        contextoGrupo: data.get("contextoGrupo"),
        necesidades: data.get("necesidades"),
        materialesDisponibles: data.get("materialesDisponibles"),
        estrategias: selected,
      }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo generar la planeación.");
      return;
    }

    router.push(`/drafts/${payload.draftId}`);
  }

  return (
    <form className="panel grid" onSubmit={onSubmit}>
      <div className="formGrid">
        <div className="field">
          <label htmlFor="nombreDocente">Docente</label>
          <input id="nombreDocente" name="nombreDocente" defaultValue="Diana" required />
        </div>
        <div className="field">
          <label htmlFor="nombreEscuela">Escuela</label>
          <input id="nombreEscuela" name="nombreEscuela" defaultValue="Escuela primaria" required />
        </div>
        <div className="field">
          <label htmlFor="periodoPlaneado">Periodo</label>
          <input id="periodoPlaneado" name="periodoPlaneado" defaultValue="Semana 1" required />
        </div>
        <div className="field">
          <label htmlFor="proyecto">Proyecto</label>
          <input id="proyecto" name="proyecto" defaultValue="Guardianes del entorno" required />
        </div>
        <div className="field">
          <label htmlFor="grado">Grado</label>
          <select id="grado" name="grado" defaultValue="3 primaria">
            <option>1 primaria</option>
            <option>2 primaria</option>
            <option>3 primaria</option>
            <option>4 primaria</option>
            <option>5 primaria</option>
            <option>6 primaria</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="fase">Fase</label>
          <select id="fase" name="fase" defaultValue="Fase 4">
            <option>Fase 3</option>
            <option>Fase 4</option>
            <option>Fase 5</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="duracion">Minutos por sesión</label>
          <input id="duracion" name="duracion" type="number" min="30" max="240" defaultValue="50" required />
        </div>
        <div className="field">
          <label htmlFor="sesiones">Sesiones</label>
          <input id="sesiones" name="sesiones" type="number" min="1" max="20" defaultValue="5" required />
        </div>
        <div className="field span2">
          <label htmlFor="campos">Campos formativos, uno por línea</label>
          <textarea id="campos" name="campos" defaultValue="Ética, naturaleza y sociedades" required />
        </div>
        <div className="field span2">
          <label htmlFor="contenidos">Contenidos, uno por línea</label>
          <textarea id="contenidos" name="contenidos" defaultValue="Cuidado del ambiente en la comunidad" required />
        </div>
        <div className="field span2">
          <label htmlFor="pda">PDA, uno por línea</label>
          <textarea id="pda" name="pda" defaultValue="Propone acciones para cuidar el entorno escolar" required />
        </div>
        <div className="field span2">
          <label htmlFor="necesidades">Necesidades o barreras</label>
          <textarea id="necesidades" name="necesidades" placeholder="Ej. estudiantes con TDAH, baja vision, ansiedad social..." />
        </div>
        <div className="field span2">
          <label>Estrategias</label>
          <div className="checks">
            {estrategias.map((estrategia) => (
              <label className="chip" key={estrategia}>
                <input name="estrategias" type="checkbox" value={estrategia} defaultChecked />
                {estrategia}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="badge">{error}</p> : null}

      <button className="button primary" type="submit" disabled={loading}>
        {loading ? <Loader2 size={17} /> : <Sparkles size={17} />}
        Generar planeación
      </button>
    </form>
  );
}
