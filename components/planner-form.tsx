"use client";

import { Loader2, Sparkles, Upload, Users } from "lucide-react";
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

const CONDICIONES: { value: string; title: string; sub: string }[] = [
  { value: "tdah", title: "TDAH", sub: "Atención, hiperactividad e impulsividad" },
  { value: "tea", title: "TEA", sub: "Trastorno del espectro autista" },
  { value: "dislexia", title: "Dislexia", sub: "Dificultades en lectura y escritura" },
  { value: "discalculia", title: "Discalculia", sub: "Dificultades con números y cálculo" },
  { value: "disfasia", title: "Disfasia / DLD", sub: "Trastorno del desarrollo del lenguaje" },
  { value: "discapacidad_intelectual", title: "Discapacidad intelectual", sub: "Leve a moderada" },
  {
    value: "hipersensibilidad_sensorial",
    title: "Hipersensibilidad sensorial",
    sub: "Auditiva, táctil, visual o propioceptiva",
  },
  { value: "altas_capacidades", title: "Altas capacidades", sub: "Superdotación o talento específico" },
  { value: "dificultades_motoras", title: "Dificultades motoras", sub: "Motricidad fina o gruesa" },
  { value: "ansiedad_escolar", title: "Ansiedad escolar", sub: "Bloqueos, evasión o mutismo selectivo" },
  { value: "otra", title: "Otra condición", sub: "Especificar manualmente" },
];

const NIVELES: { value: "compacto" | "estandar" | "detallado"; label: string }[] = [
  { value: "compacto", label: "Básico" },
  { value: "estandar", label: "Estándar" },
  { value: "detallado", label: "Detallado" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PlannerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos del docente
  const [nombreDocente, setNombreDocente] = useState("");
  const [nombreEscuela, setNombreEscuela] = useState("");
  const [periodoPlaneado, setPeriodoPlaneado] = useState("");

  // Configuración del grupo
  const [grado, setGrado] = useState("3 primaria");
  const [fase, setFase] = useState("Fase 4");
  const [sesiones, setSesiones] = useState(6);
  const [duracion, setDuracion] = useState(50);
  const [modalidad, setModalidad] = useState<"secuencial" | "proyecto">("secuencial");

  // Contenidos y procesos (cascada)
  const [camposDisponibles, setCamposDisponibles] = useState<string[]>([]);
  const [campos, setCampos] = useState<string[]>([]);
  const [contenidosPorCampo, setContenidosPorCampo] = useState<Record<string, Contenido[]>>({});
  const [contenidosSel, setContenidosSel] = useState<string[]>([]);
  const [pdaSel, setPdaSel] = useState<string[]>([]);

  // Evaluación
  const [estrategias, setEstrategias] = useState<string[]>(["Rúbrica", "Lista de cotejo"]);

  // Tema y contexto
  const [proyecto, setProyecto] = useState("");
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

  const totalContenidos = useMemo(
    () => contenidosDisponibles.reduce((acc, grupo) => acc + grupo.contenidos.length, 0),
    [contenidosDisponibles],
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

    if (!nombreDocente || !nombreEscuela || !periodoPlaneado || !proyecto) {
      setError("Completa los datos del docente y el tema detonador.");
      return;
    }
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
    <form onSubmit={onSubmit}>
      {/* 1. Datos del docente */}
      <div className="section-label">Datos del docente</div>
      <div className="card">
        <div className="grid-3">
          <div className="field">
            <label htmlFor="nombreDocente">Nombre del docente</label>
            <input
              id="nombreDocente"
              type="text"
              value={nombreDocente}
              onChange={(event) => setNombreDocente(event.target.value)}
              placeholder="Ej: María González López"
            />
          </div>
          <div className="field">
            <label htmlFor="nombreEscuela">Nombre de la escuela</label>
            <input
              id="nombreEscuela"
              type="text"
              value={nombreEscuela}
              onChange={(event) => setNombreEscuela(event.target.value)}
              placeholder="Ej: Primaria Benito Juárez"
            />
          </div>
          <div className="field">
            <label htmlFor="periodoPlaneado">Periodo planeado</label>
            <input
              id="periodoPlaneado"
              type="text"
              value={periodoPlaneado}
              onChange={(event) => setPeriodoPlaneado(event.target.value)}
              placeholder="Ej: Enero – Febrero 2025"
            />
          </div>
        </div>
      </div>

      {/* 2. Configuración del grupo */}
      <div className="section-label">Configuración del grupo</div>
      <div className="card">
        <div className="grid-3" style={{ marginBottom: 16 }}>
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
            <label>Modalidad</label>
            <div className="toggle-group">
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
                Proyecto
              </button>
            </div>
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="sesiones">Sesiones</label>
            <div className="number-input">
              <button
                type="button"
                className="num-btn left"
                onClick={() => setSesiones((value) => clamp(value - 1, 1, 20))}
                aria-label="Menos sesiones"
              >
                −
              </button>
              <input
                id="sesiones"
                type="number"
                min={1}
                max={20}
                value={sesiones}
                onChange={(event) => setSesiones(clamp(Number(event.target.value), 1, 20))}
              />
              <button
                type="button"
                className="num-btn right"
                onClick={() => setSesiones((value) => clamp(value + 1, 1, 20))}
                aria-label="Más sesiones"
              >
                +
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="duracion">Duración (min)</label>
            <div className="number-input">
              <button
                type="button"
                className="num-btn left"
                onClick={() => setDuracion((value) => clamp(value - 5, 30, 240))}
                aria-label="Menos minutos"
              >
                −
              </button>
              <input
                id="duracion"
                type="number"
                min={30}
                max={240}
                step={5}
                value={duracion}
                onChange={(event) => setDuracion(clamp(Number(event.target.value), 30, 240))}
              />
              <button
                type="button"
                className="num-btn right"
                onClick={() => setDuracion((value) => clamp(value + 5, 30, 240))}
                aria-label="Más minutos"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Contenidos y procesos */}
      <div className="section-label">Contenidos y procesos</div>
      <div className="card">
        <div className="contenidos-header">
          <label style={{ fontSize: 12, color: "var(--text)" }}>Campos formativos</label>
          <span className="link-action">
            <Upload size={11} />
            {contenidosSel.length} de {totalContenidos} contenidos
          </span>
        </div>
        <div className="chips">
          {camposDisponibles.map((campo) => (
            <button
              key={campo}
              type="button"
              className="chip"
              data-active={campos.includes(campo)}
              onClick={() => toggleCampo(campo)}
            >
              {campo}
            </button>
          ))}
          {camposDisponibles.length === 0 ? (
            <span className="hint">Cargando campos del grado…</span>
          ) : null}
        </div>
        <p className="hint">
          Selecciona uno o más campos para cargar sus contenidos curriculares según el grado.
        </p>

        {campos.length > 0 ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label>Contenidos curriculares</label>
            <div className="cascade-list">
              {contenidosDisponibles.map((grupo) => (
                <div className="cascade-group" key={grupo.campo}>
                  <strong>{grupo.campo}</strong>
                  <div className="chips">
                    {grupo.contenidos.map((contenido) => (
                      <button
                        key={contenido.id}
                        type="button"
                        className="chip"
                        data-active={contenidosSel.includes(contenido.id)}
                        onClick={() => setContenidosSel((prev) => toggle(prev, contenido.id))}
                      >
                        {contenido.titulo}
                      </button>
                    ))}
                  </div>
                  {grupo.contenidos.length === 0 ? (
                    <span className="hint">Cargando contenidos…</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {pdaDisponibles.length > 0 ? (
          <div className="field" style={{ marginTop: 16 }}>
            <label>Procesos de Desarrollo de Aprendizaje (PDA)</label>
            <div className="cascade-list">
              <div className="chips">
                {pdaDisponibles.map((pda, index) => (
                  <button
                    key={`${index}-${pda.slice(0, 24)}`}
                    type="button"
                    className="chip"
                    data-active={pdaSel.includes(pda)}
                    onClick={() => setPdaSel((prev) => toggle(prev, pda))}
                  >
                    {pda}
                  </button>
                ))}
              </div>
            </div>
            <p className="hint">Los PDA se derivan de los contenidos seleccionados. Desactiva los que no apliquen.</p>
          </div>
        ) : null}
      </div>

      {/* 4. Estrategias de evaluación */}
      <div className="section-label">Estrategias de evaluación</div>
      <div className="card">
        <div className="chips">
          {ESTRATEGIAS.map((estrategia) => (
            <button
              key={estrategia}
              type="button"
              className="chip"
              data-active={estrategias.includes(estrategia)}
              onClick={() => setEstrategias((prev) => toggle(prev, estrategia))}
            >
              {estrategia}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Tema y contexto */}
      <div className="section-label">Tema y contexto</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="proyecto">Tema detonador</label>
          <textarea
            id="proyecto"
            value={proyecto}
            onChange={(event) => setProyecto(event.target.value)}
            placeholder="Describe la idea o proyecto central que guiará el aprendizaje del grupo..."
          />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="contextoGrupo">
            Contexto del grupo <span style={{ color: "#45426A" }}>(opcional)</span>
          </label>
          <input
            id="contextoGrupo"
            type="text"
            value={contextoGrupo}
            onChange={(event) => setContextoGrupo(event.target.value)}
            placeholder="Tamaño del grupo, dinámica, entorno..."
          />
        </div>
        <div className="field">
          <label htmlFor="materialesDisponibles">
            Recursos y materiales disponibles <span style={{ color: "#45426A" }}>(opcional)</span>
          </label>
          <input
            id="materialesDisponibles"
            type="text"
            value={materialesDisponibles}
            onChange={(event) => setMaterialesDisponibles(event.target.value)}
            placeholder="Aula, internet, proyector, cartulinas, tablets..."
          />
        </div>
      </div>

      {/* 6. Neuroinclusividad */}
      <div className="section-label">Neuroinclusividad</div>
      <div className="card">
        <div className="ni-toggle-row">
          <div className="ni-toggle-label">
            <Users size={16} />
            Incluir adaptaciones neuroinclusivas
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {niActiva ? <span className="ni-badge">Activo</span> : null}
            <label className="switch">
              <input
                type="checkbox"
                checked={niActiva}
                onChange={(event) => setNiActiva(event.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        {niActiva ? (
          <div className="ni-panel">
            <p className="ni-desc">
              Selecciona las condiciones presentes en tu grupo. La planeación incluirá estrategias y adaptaciones
              específicas para cada una.
            </p>

            <div className="ni-grid">
              {CONDICIONES.map((condicion) => (
                <button
                  key={condicion.value}
                  type="button"
                  className="ni-item"
                  data-active={condiciones.includes(condicion.value)}
                  onClick={() => setCondiciones((prev) => toggle(prev, condicion.value))}
                >
                  <span className="ni-check" />
                  <span className="ni-item-text">
                    <span className="ni-item-title">{condicion.title}</span>
                    <span className="ni-item-sub">{condicion.sub}</span>
                  </span>
                </button>
              ))}
            </div>

            {condiciones.includes("otra") ? (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  value={otraDescripcion}
                  onChange={(event) => setOtraDescripcion(event.target.value)}
                  placeholder="Describe la condición o necesidad específica del estudiante..."
                />
              </div>
            ) : null}

            <div className="ni-intensity">
              <label>Nivel de detalle de las adaptaciones</label>
              <div className="intensity-options">
                {NIVELES.map((nivel) => (
                  <button
                    key={nivel.value}
                    type="button"
                    className="intensity-opt"
                    data-active={nivelDetalle === nivel.value}
                    onClick={() => setNivelDetalle(nivel.value)}
                  >
                    {nivel.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="cta-area">
        {error ? <p className="alert">{error}</p> : null}
        <button className="btn-generate" type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {loading ? "Generando…" : "Generar Planeación"}
        </button>
        <p className="cta-note">
          Los recuadros de salida son editables. Puedes copiar o descargar la planeación generada.
        </p>
      </div>
    </form>
  );
}
