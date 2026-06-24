"use client";

import clsx from "clsx";
import { Loader2, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import type { Contenido } from "@/lib/curriculum/types";

const GRADOS = [
  "1 primaria",
  "2 primaria",
  "3 primaria",
  "4 primaria",
  "5 primaria",
  "6 primaria",
];

const FASES = ["Fase 3", "Fase 4", "Fase 5"];

const ESTRATEGIAS = [
  "Rúbrica",
  "Lista de cotejo",
  "Portafolio",
  "Observación",
  "Autoevaluación",
  "Coevaluación",
  "Material imprimible",
];

const CONDICIONES: { value: string; label: string }[] = [
  { value: "tdah", label: "TDAH" },
  { value: "tea", label: "TEA" },
  { value: "dislexia", label: "Dislexia" },
  { value: "discalculia", label: "Discalculia" },
  { value: "disfasia", label: "Disfasia / DLD" },
  { value: "discapacidad_intelectual", label: "Discapacidad intelectual" },
  { value: "hipersensibilidad_sensorial", label: "Hipersensibilidad sensorial" },
  { value: "altas_capacidades", label: "Altas capacidades" },
  { value: "dificultades_motoras", label: "Dificultades motoras" },
  { value: "ansiedad_escolar", label: "Ansiedad escolar" },
  { value: "otra", label: "Otra" },
];

const NIVELES: { value: "compacto" | "estandar" | "detallado"; label: string }[] = [
  { value: "compacto", label: "Compacto" },
  { value: "estandar", label: "Estándar" },
  { value: "detallado", label: "Detallado" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PlannerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos del docente
  const [nombreDocente, setNombreDocente] = useState("Diana");
  const [nombreEscuela, setNombreEscuela] = useState("Escuela primaria");
  const [periodoPlaneado, setPeriodoPlaneado] = useState("Semana 1");

  // Configuración del grupo
  const [grado, setGrado] = useState("3 primaria");
  const [fase, setFase] = useState("Fase 4");
  const [sesiones, setSesiones] = useState(5);
  const [duracion, setDuracion] = useState(50);
  const [modalidad, setModalidad] = useState<"secuencial" | "proyecto">("secuencial");

  // Contenidos y procesos (cascada)
  const [camposDisponibles, setCamposDisponibles] = useState<string[]>([]);
  const [campos, setCampos] = useState<string[]>([]);
  const [contenidosPorCampo, setContenidosPorCampo] = useState<Record<string, Contenido[]>>({});
  const [contenidosSel, setContenidosSel] = useState<string[]>([]);
  const [pdaSel, setPdaSel] = useState<string[]>([]);

  // Evaluación
  const [estrategias, setEstrategias] = useState<string[]>([...ESTRATEGIAS]);

  // Tema y contexto
  const [proyecto, setProyecto] = useState("Guardianes del entorno");
  const [contextoGrupo, setContextoGrupo] = useState("");
  const [materialesDisponibles, setMaterialesDisponibles] = useState("");

  // Neuroinclusividad
  const [niActiva, setNiActiva] = useState(false);
  const [condiciones, setCondiciones] = useState<string[]>([]);
  const [otraDescripcion, setOtraDescripcion] = useState("");
  const [nivelDetalle, setNivelDetalle] = useState<"compacto" | "estandar" | "detallado">("estandar");

  // Al cambiar el grado, recargar campos formativos y limpiar selecciones dependientes.
  useEffect(() => {
    let cancelled = false;
    setCampos([]);
    setContenidosPorCampo({});
    setContenidosSel([]);
    setPdaSel([]);

    fetch(`/api/curriculum?grado=${encodeURIComponent(grado)}`)
      .then((response) => response.json())
      .then((payload: { campos?: string[] }) => {
        if (!cancelled) {
          setCamposDisponibles(payload.campos ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCamposDisponibles([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [grado]);

  async function toggleCampo(campo: string) {
    const next = toggle(campos, campo);
    setCampos(next);

    if (!contenidosPorCampo[campo]) {
      const response = await fetch(
        `/api/curriculum?grado=${encodeURIComponent(grado)}&campo=${encodeURIComponent(campo)}`,
      );
      const payload = (await response.json()) as { contenidos?: Contenido[] };
      setContenidosPorCampo((prev) => ({ ...prev, [campo]: payload.contenidos ?? [] }));
    }
  }

  // Contenidos disponibles según los campos seleccionados.
  const contenidosDisponibles = useMemo(
    () =>
      campos.map((campo) => ({
        campo,
        contenidos: contenidosPorCampo[campo] ?? [],
      })),
    [campos, contenidosPorCampo],
  );

  // PDA disponibles derivados de los contenidos seleccionados (sin duplicados).
  const pdaDisponibles = useMemo(() => {
    const todos = contenidosDisponibles
      .flatMap((grupo) => grupo.contenidos)
      .filter((contenido) => contenidosSel.includes(contenido.id))
      .flatMap((contenido) => contenido.pda);
    return [...new Set(todos)];
  }, [contenidosDisponibles, contenidosSel]);

  // Por defecto, todos los PDA disponibles quedan seleccionados; conserva los que sigan vigentes.
  useEffect(() => {
    setPdaSel((prev) => {
      const vigentes = prev.filter((pda) => pdaDisponibles.includes(pda));
      const nuevos = pdaDisponibles.filter((pda) => !prev.includes(pda));
      return [...vigentes, ...nuevos];
    });
  }, [pdaDisponibles]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (campos.length === 0) {
      setError("Selecciona al menos un campo formativo.");
      return;
    }
    if (contenidosSel.length === 0) {
      setError("Selecciona al menos un contenido.");
      return;
    }
    if (pdaSel.length === 0) {
      setError("Selecciona al menos un proceso de desarrollo de aprendizaje (PDA).");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nombreDocente,
        nombreEscuela,
        periodoPlaneado,
        grado,
        fase,
        duracion,
        sesiones,
        proyecto,
        campos,
        contenidos: contenidosSel,
        pda: pdaSel,
        estrategias,
        contextoGrupo: contextoGrupo || undefined,
        materialesDisponibles: materialesDisponibles || undefined,
        modalidad,
        nivelDetalle,
        neuroinclusividad: {
          activa: niActiva,
          condiciones,
          otraDescripcion: otraDescripcion || undefined,
        },
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
      {/* 1. Datos del docente */}
      <section className="formSection">
        <h2 className="sectionTitle">Datos del docente</h2>
        <div className="formGrid">
          <div className="field">
            <label htmlFor="nombreDocente">Docente</label>
            <input
              id="nombreDocente"
              value={nombreDocente}
              onChange={(event) => setNombreDocente(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="nombreEscuela">Escuela</label>
            <input
              id="nombreEscuela"
              value={nombreEscuela}
              onChange={(event) => setNombreEscuela(event.target.value)}
              required
            />
          </div>
          <div className="field span2">
            <label htmlFor="periodoPlaneado">Periodo planeado</label>
            <input
              id="periodoPlaneado"
              value={periodoPlaneado}
              onChange={(event) => setPeriodoPlaneado(event.target.value)}
              required
            />
          </div>
        </div>
      </section>

      {/* 2. Configuración del grupo */}
      <section className="formSection">
        <h2 className="sectionTitle">Configuración del grupo</h2>
        <div className="formGrid">
          <div className="field">
            <label htmlFor="grado">Grado</label>
            <select id="grado" value={grado} onChange={(event) => setGrado(event.target.value)}>
              {GRADOS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="fase">Fase</label>
            <select id="fase" value={fase} onChange={(event) => setFase(event.target.value)}>
              {FASES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sesiones">Sesiones</label>
            <input
              id="sesiones"
              type="number"
              min={1}
              max={20}
              value={sesiones}
              onChange={(event) => setSesiones(Number(event.target.value))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="duracion">Minutos por sesión</label>
            <input
              id="duracion"
              type="number"
              min={30}
              max={240}
              value={duracion}
              onChange={(event) => setDuracion(Number(event.target.value))}
              required
            />
          </div>
          <div className="field span2">
            <label>Modalidad</label>
            <div className="segmented">
              <button
                type="button"
                data-active={modalidad === "secuencial"}
                onClick={() => setModalidad("secuencial")}
              >
                Secuencial
              </button>
              <button
                type="button"
                data-active={modalidad === "proyecto"}
                onClick={() => setModalidad("proyecto")}
              >
                Por proyecto
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Contenidos y procesos */}
      <section className="formSection">
        <h2 className="sectionTitle">Contenidos y procesos</h2>
        <div className="field">
          <label>Campos formativos</label>
          <p className="sectionHint">Selecciona los campos para cargar sus contenidos.</p>
          <div className="checks">
            {camposDisponibles.map((campo) => (
              <button
                key={campo}
                type="button"
                className="chipButton"
                data-selected={campos.includes(campo)}
                onClick={() => toggleCampo(campo)}
              >
                {campo}
              </button>
            ))}
            {camposDisponibles.length === 0 ? (
              <span className="sectionHint">Cargando campos del grado…</span>
            ) : null}
          </div>
        </div>

        {campos.length > 0 ? (
          <div className="field">
            <label>Contenidos</label>
            <div className="cascadeList">
              {contenidosDisponibles.map((grupo) => (
                <div className="cascadeGroup" key={grupo.campo}>
                  <strong>{grupo.campo}</strong>
                  {grupo.contenidos.map((contenido) => (
                    <button
                      key={contenido.id}
                      type="button"
                      className="chipButton"
                      data-selected={contenidosSel.includes(contenido.id)}
                      onClick={() => setContenidosSel((prev) => toggle(prev, contenido.id))}
                    >
                      {contenido.titulo}
                    </button>
                  ))}
                  {grupo.contenidos.length === 0 ? (
                    <span className="sectionHint">Cargando contenidos…</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {pdaDisponibles.length > 0 ? (
          <div className="field">
            <label>Procesos de desarrollo de aprendizaje (PDA)</label>
            <p className="sectionHint">
              Derivados de los contenidos seleccionados. Desactiva los que no apliquen.
            </p>
            <div className="cascadeList">
              {pdaDisponibles.map((pda, index) => (
                <button
                  key={`${index}-${pda.slice(0, 24)}`}
                  type="button"
                  className="chipButton"
                  data-selected={pdaSel.includes(pda)}
                  onClick={() => setPdaSel((prev) => toggle(prev, pda))}
                >
                  {pda}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* 4. Estrategias de evaluación */}
      <section className="formSection">
        <h2 className="sectionTitle">Estrategias de evaluación</h2>
        <div className="checks">
          {ESTRATEGIAS.map((estrategia) => (
            <button
              key={estrategia}
              type="button"
              className="chipButton"
              data-selected={estrategias.includes(estrategia)}
              onClick={() => setEstrategias((prev) => toggle(prev, estrategia))}
            >
              {estrategia}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Tema y contexto */}
      <section className="formSection">
        <h2 className="sectionTitle">Tema y contexto</h2>
        <div className="formGrid">
          <div className="field span2">
            <label htmlFor="proyecto">Proyecto o tema detonador</label>
            <input
              id="proyecto"
              value={proyecto}
              onChange={(event) => setProyecto(event.target.value)}
              required
            />
          </div>
          <div className="field span2">
            <label htmlFor="contextoGrupo">Contexto del grupo</label>
            <textarea
              id="contextoGrupo"
              value={contextoGrupo}
              onChange={(event) => setContextoGrupo(event.target.value)}
              placeholder="Tamaño del grupo, dinámica, entorno…"
            />
          </div>
          <div className="field span2">
            <label htmlFor="materialesDisponibles">Recursos disponibles</label>
            <textarea
              id="materialesDisponibles"
              value={materialesDisponibles}
              onChange={(event) => setMaterialesDisponibles(event.target.value)}
              placeholder="Materiales, espacios y tecnología con los que cuenta el aula…"
            />
          </div>
        </div>
      </section>

      {/* 6. Neuroinclusividad */}
      <section className="formSection">
        <h2 className="sectionTitle">Neuroinclusividad</h2>
        <button
          type="button"
          className="switch"
          data-on={niActiva}
          onClick={() => setNiActiva((value) => !value)}
        >
          {niActiva ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
          {niActiva ? "Adaptaciones activas" : "Activar adaptaciones"}
        </button>

        {niActiva ? (
          <>
            <div className="condGrid">
              {CONDICIONES.map((condicion) => (
                <button
                  key={condicion.value}
                  type="button"
                  className={clsx("chipButton")}
                  data-selected={condiciones.includes(condicion.value)}
                  onClick={() => setCondiciones((prev) => toggle(prev, condicion.value))}
                >
                  {condicion.label}
                </button>
              ))}
            </div>
            {condiciones.includes("otra") ? (
              <div className="field">
                <label htmlFor="otraDescripcion">Describe la otra condición</label>
                <input
                  id="otraDescripcion"
                  value={otraDescripcion}
                  onChange={(event) => setOtraDescripcion(event.target.value)}
                  placeholder="Condición específica del grupo"
                />
              </div>
            ) : null}
          </>
        ) : null}

        <div className="field">
          <label>Nivel de detalle</label>
          <div className="segmented">
            {NIVELES.map((nivel) => (
              <button
                key={nivel.value}
                type="button"
                data-active={nivelDetalle === nivel.value}
                onClick={() => setNivelDetalle(nivel.value)}
              >
                {nivel.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? <p className="badge">{error}</p> : null}

      <button className="button primary" type="submit" disabled={loading}>
        {loading ? <Loader2 size={17} /> : <Sparkles size={17} />}
        Generar planeación
      </button>
    </form>
  );
}
