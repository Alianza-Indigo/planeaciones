"use client";

import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Package,
  Printer,
  Save,
  Sparkles,
  Upload,
  UploadCloud,
  Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Contenido } from "@/lib/curriculum/types";

type Tab = "generacion" | "planeacion" | "materiales" | "preview";

const NIVELES_EDU = ["Preescolar", "Primaria", "Secundaria"] as const;
type NivelEdu = (typeof NIVELES_EDU)[number];

const GRADOS_POR_NIVEL: Record<NivelEdu, string[]> = {
  Preescolar: ["1°", "2°", "3°"],
  Primaria: ["1°", "2°", "3°", "4°", "5°", "6°"],
  Secundaria: ["1°", "2°", "3°"],
};

// El catálogo NEM (data/con-plan.json) mezcla, por grado, tres grupos de campos:
// los oficiales de Primaria, las materias de Secundaria y las variantes de
// Preescolar. Filtramos por nivel para mostrar solo los que correspondan.
const CAMPOS_PRIMARIA = [
  "LENGUAJES",
  "SABERES Y PENSAMIENTO CIENTÍFICO",
  "ÉTICA, NATURALEZA Y SOCIEDADES",
  "DE LO HUMANO Y LO COMUNITARIO",
];

const CAMPOS_PREESCOLAR = [
  "LENGUAJE",
  "SABERES PENSAMIENTO CIENTÍFICO",
  "ETICA NATURALEZA SOCIEDADES",
  "HUMANO Y COMUNITARIO",
];

function filtrarCamposPorNivel(campos: string[], nivel: NivelEdu): string[] {
  if (nivel === "Preescolar") return campos.filter((c) => CAMPOS_PREESCOLAR.includes(c));
  if (nivel === "Primaria") return campos.filter((c) => CAMPOS_PRIMARIA.includes(c));
  // Secundaria: todo lo que no sea campo formativo de Primaria ni de Preescolar.
  return campos.filter((c) => !CAMPOS_PRIMARIA.includes(c) && !CAMPOS_PREESCOLAR.includes(c));
}

const ESTRATEGIAS = [
  "Rúbrica",
  "Lista de cotejo",
  "Portafolio",
  "Observación",
  "Autoevaluación",
  "Coevaluación",
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

const NIVELES_DETALLE: { value: "compacto" | "estandar" | "detallado"; label: string }[] = [
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

// Etiqueta de grado para el backend: "3°" + Primaria → "3 primaria".
function buildGradoLabel(nivel: NivelEdu, grado: string): string {
  const digit = grado.replace(/\D/g, "");
  return `${digit} ${nivel.toLowerCase()}`;
}

// Fase NEM derivada del nivel y grado.
function buildFase(nivel: NivelEdu, grado: string): string {
  const digit = Number(grado.replace(/\D/g, ""));
  if (nivel === "Preescolar") return "Fase 2";
  if (nivel === "Secundaria") return "Fase 6";
  if (digit <= 2) return "Fase 3";
  if (digit <= 4) return "Fase 4";
  return "Fase 5";
}

// ── Markdown mínimo (sin dependencias) → HTML seguro ──
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 4);
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      closeList();
      out.push("<hr/>");
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${renderInline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

type Sesion = { title: string; body: string };

// Divide el markdown en sesiones detectando encabezados "Sesión N".
function parseSesiones(content: string): Sesion[] {
  const lines = content.split("\n");
  const sesiones: Sesion[] = [];
  let current: Sesion | null = null;
  const headingRe = /^#{0,4}\s*\**\s*sesi[oó]n\s*\d+/i;

  for (const line of lines) {
    if (headingRe.test(line.trim())) {
      if (current) sesiones.push(current);
      const title = line.replace(/^#{0,4}\s*/, "").replace(/\*/g, "").trim();
      current = { title, body: "" };
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  if (current) sesiones.push(current);
  return sesiones;
}

// Extrae elementos de listas que aparezcan bajo encabezados de "materiales".
function parseMateriales(content: string): string[] {
  const lines = content.split("\n");
  const items: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      capturing = /materi|recurso|insumo/i.test(heading[1]);
      continue;
    }
    if (capturing) {
      const bullet = trimmed.match(/^[-*]\s+(.*)$/);
      if (bullet) items.push(bullet[1].replace(/\*\*/g, ""));
    }
  }
  return items;
}

export function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>("generacion");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  // Datos del docente
  const [nombreDocente, setNombreDocente] = useState("");
  const [nombreEscuela, setNombreEscuela] = useState("");
  const [periodoPlaneado, setPeriodoPlaneado] = useState("");

  // Configuración del grupo
  const [nivel, setNivel] = useState<NivelEdu>("Primaria");
  const [grado, setGrado] = useState("1°");
  const [modalidad, setModalidad] = useState<"secuencial" | "proyecto">("secuencial");
  const [sesiones, setSesiones] = useState(6);
  const [duracion, setDuracion] = useState(50);

  // Contenidos y procesos
  const [camposDisponibles, setCamposDisponibles] = useState<string[]>([]);
  const [campo, setCampo] = useState("");
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [contenidosSel, setContenidosSel] = useState<string[]>([]);
  const [pdaSel, setPdaSel] = useState<string[]>([]);
  const [contenidosOpen, setContenidosOpen] = useState(false);
  const [pdaOpen, setPdaOpen] = useState(false);

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

  // Resultado
  const [draft, setDraft] = useState<{ id: string; title: string; content: string; expiresAt?: string } | null>(null);
  const [previewStatus, setPreviewStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const gradoLabel = useMemo(() => buildGradoLabel(nivel, grado), [nivel, grado]);
  const gradosDisponibles = GRADOS_POR_NIVEL[nivel];

  // Campos formativos visibles según el nivel educativo seleccionado.
  const camposFiltrados = useMemo(
    () => filtrarCamposPorNivel(camposDisponibles, nivel),
    [camposDisponibles, nivel],
  );

  // El grado seleccionado debe existir en el nivel actual.
  useEffect(() => {
    if (!gradosDisponibles.includes(grado)) {
      setGrado(gradosDisponibles[0]);
    }
  }, [gradosDisponibles, grado]);

  // Cargar campos formativos del grado.
  useEffect(() => {
    let cancelled = false;
    setCampo("");
    setContenidos([]);
    setContenidosSel([]);
    setPdaSel([]);

    fetch(`/api/curriculum?grado=${encodeURIComponent(gradoLabel)}`)
      .then((response) => response.json())
      .then((payload: { campos?: string[] }) => {
        if (!cancelled) setCamposDisponibles(payload.campos ?? []);
      })
      .catch(() => {
        if (!cancelled) setCamposDisponibles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [gradoLabel]);

  // Cargar contenidos del campo seleccionado.
  const cargarContenidos = useCallback(
    async (campoSel: string) => {
      setCampo(campoSel);
      setContenidosSel([]);
      setPdaSel([]);
      if (!campoSel) {
        setContenidos([]);
        return;
      }
      const response = await fetch(
        `/api/curriculum?grado=${encodeURIComponent(gradoLabel)}&campo=${encodeURIComponent(campoSel)}`,
      );
      const payload = (await response.json()) as { contenidos?: Contenido[] };
      setContenidos(payload.contenidos ?? []);
    },
    [gradoLabel],
  );

  // PDA derivados de los contenidos seleccionados.
  const pdaDisponibles = useMemo(() => {
    const todos = contenidos
      .filter((contenido) => contenidosSel.includes(contenido.id))
      .flatMap((contenido) => contenido.pda);
    return [...new Set(todos)];
  }, [contenidos, contenidosSel]);

  // Por defecto todos los PDA disponibles quedan seleccionados.
  useEffect(() => {
    setPdaSel((prev) => {
      const vigentes = prev.filter((pda) => pdaDisponibles.includes(pda));
      const nuevos = pdaDisponibles.filter((pda) => !prev.includes(pda));
      return [...vigentes, ...nuevos];
    });
  }, [pdaDisponibles]);

  async function generar() {
    setError(null);
    setUpgrade(false);

    if (!nombreDocente || !nombreEscuela || !periodoPlaneado || !proyecto) {
      setError("Completa los datos del docente y el tema detonador.");
      return;
    }
    if (!campo) {
      setError("Selecciona un campo formativo.");
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
        grado: gradoLabel,
        fase: buildFase(nivel, grado),
        duracion,
        sesiones,
        proyecto,
        campos: [campo],
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

    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? "No se pudo generar la planeación.");
      if (response.status === 403) setUpgrade(true);
      return;
    }

    // Cargar el contenido generado para mostrarlo en las pestañas.
    const draftResponse = await fetch(`/api/drafts/${payload.draftId}`);
    const draftData = await draftResponse.json();
    setLoading(false);
    setDraft({
      id: payload.draftId,
      title: draftData.title ?? payload.title,
      content: draftData.content ?? "",
      expiresAt: payload.expiresAt,
    });
    setTab("planeacion");
  }

  async function savePreview() {
    if (!draft) return;
    setPreviewStatus("Guardando…");
    await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: draft.title, content: draft.content }),
    });
    setPreviewStatus("Cambios guardados.");
  }

  async function exportToDrive() {
    if (!draft) return;
    setPreviewStatus("Enviando a Google Drive…");
    const response = await fetch("/api/drive/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draftId: draft.id }),
    });
    const payload = await response.json();
    setPreviewStatus(response.ok ? "Exportado a Google Drive." : payload.error ?? "No se pudo exportar.");
  }

  function copyContent() {
    if (!draft) return;
    navigator.clipboard.writeText(draft.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function printContent() {
    if (!draft) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>${draft.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.8;color:#111;white-space:pre-wrap;font-size:14px;}@media print{body{margin:20px;}}</style></head><body>${escapeHtml(draft.content)}</body></html>`,
    );
    win.document.close();
    win.print();
  }

  function downloadMarkdown() {
    if (!draft) return;
    const blob = new Blob([draft.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const navItems: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: "generacion", label: "Generación", icon: Layers },
    { id: "planeacion", label: "Planeación", icon: FileText },
    { id: "materiales", label: "Materiales", icon: Package },
    { id: "preview", label: "Preview", icon: FileText },
  ];

  function go(next: Tab) {
    setTab(next);
    setSidebarOpen(false);
  }

  return (
    <div className="app">
      <header className="header">
        <button className="hamburger" onClick={() => setSidebarOpen((value) => !value)} aria-label="Menú">
          <Menu size={20} />
        </button>
        <div className="logo-mark">AI</div>
        <div className="header-text">
          <h1>ADIA</h1>
          <p>Alianza Índigo Neurodivergente A.C.</p>
        </div>
        <span className="badge">NEM 2025</span>
      </header>

      <div className="sidebar-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="app-body">
        <aside className="sidebar" data-open={sidebarOpen}>
          <div className="nav-label">Navegación</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="nav-item"
                data-active={tab === item.id}
                onClick={() => go(item.id)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}

          <div className="nav-spacer" />

          <button className="nav-item danger" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={16} />
            Salir
          </button>
        </aside>

        <main className="main">
          {tab === "generacion" ? (
            <GeneracionView
              {...{
                nombreDocente,
                setNombreDocente,
                nombreEscuela,
                setNombreEscuela,
                periodoPlaneado,
                setPeriodoPlaneado,
                nivel,
                setNivel,
                grado,
                setGrado,
                gradosDisponibles,
                modalidad,
                setModalidad,
                sesiones,
                setSesiones,
                duracion,
                setDuracion,
                camposDisponibles: camposFiltrados,
                campo,
                cargarContenidos,
                contenidos,
                contenidosSel,
                setContenidosSel,
                contenidosOpen,
                setContenidosOpen,
                pdaDisponibles,
                pdaSel,
                setPdaSel,
                pdaOpen,
                setPdaOpen,
                estrategias,
                setEstrategias,
                proyecto,
                setProyecto,
                contextoGrupo,
                setContextoGrupo,
                materialesDisponibles,
                setMaterialesDisponibles,
                niActiva,
                setNiActiva,
                condiciones,
                setCondiciones,
                otraDescripcion,
                setOtraDescripcion,
                nivelDetalle,
                setNivelDetalle,
                loading,
                error,
                upgrade,
                generar,
              }}
            />
          ) : null}

          {tab === "planeacion" ? (
            <PlaneacionView draft={draft} sesiones={sesiones} duracion={duracion} modalidad={modalidad} onGo={go} />
          ) : null}

          {tab === "materiales" ? <MaterialesView draft={draft} onGo={go} /> : null}

          {tab === "preview" ? (
            <PreviewView
              draft={draft}
              setDraft={setDraft}
              status={previewStatus}
              copied={copied}
              onSave={savePreview}
              onCopy={copyContent}
              onPrint={printContent}
              onDownload={downloadMarkdown}
              onDrive={exportToDrive}
              onGo={go}
            />
          ) : null}
        </main>
      </div>

      <footer className="footer">
        Herramienta desarrollada por{" "}
        <a href="https://alianzaindigo.org" target="_blank" rel="noreferrer">
          Alianza Índigo Neurodivergente A.C.
        </a>{" "}
        · Uso educativo
      </footer>
    </div>
  );
}

// ─────────────────────────── Generación ───────────────────────────
type GeneracionProps = {
  nombreDocente: string;
  setNombreDocente: (v: string) => void;
  nombreEscuela: string;
  setNombreEscuela: (v: string) => void;
  periodoPlaneado: string;
  setPeriodoPlaneado: (v: string) => void;
  nivel: NivelEdu;
  setNivel: (v: NivelEdu) => void;
  grado: string;
  setGrado: (v: string) => void;
  gradosDisponibles: string[];
  modalidad: "secuencial" | "proyecto";
  setModalidad: (v: "secuencial" | "proyecto") => void;
  sesiones: number;
  setSesiones: (updater: (v: number) => number) => void;
  duracion: number;
  setDuracion: (updater: (v: number) => number) => void;
  camposDisponibles: string[];
  campo: string;
  cargarContenidos: (campo: string) => void;
  contenidos: Contenido[];
  contenidosSel: string[];
  setContenidosSel: (updater: (prev: string[]) => string[]) => void;
  contenidosOpen: boolean;
  setContenidosOpen: (updater: (v: boolean) => boolean) => void;
  pdaDisponibles: string[];
  pdaSel: string[];
  setPdaSel: (updater: (prev: string[]) => string[]) => void;
  pdaOpen: boolean;
  setPdaOpen: (updater: (v: boolean) => boolean) => void;
  estrategias: string[];
  setEstrategias: (updater: (prev: string[]) => string[]) => void;
  proyecto: string;
  setProyecto: (v: string) => void;
  contextoGrupo: string;
  setContextoGrupo: (v: string) => void;
  materialesDisponibles: string;
  setMaterialesDisponibles: (v: string) => void;
  niActiva: boolean;
  setNiActiva: (v: boolean) => void;
  condiciones: string[];
  setCondiciones: (updater: (prev: string[]) => string[]) => void;
  otraDescripcion: string;
  setOtraDescripcion: (v: string) => void;
  nivelDetalle: "compacto" | "estandar" | "detallado";
  setNivelDetalle: (v: "compacto" | "estandar" | "detallado") => void;
  loading: boolean;
  error: string | null;
  upgrade: boolean;
  generar: () => void;
};

function GeneracionView(props: GeneracionProps) {
  const {
    contenidos,
    contenidosSel,
    pdaDisponibles,
    pdaSel,
    contenidosOpen,
    setContenidosOpen,
    pdaOpen,
    setPdaOpen,
  } = props;

  return (
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

      {/* Datos del docente */}
      <div className="section-label">Datos del docente</div>
      <div className="card">
        <div className="grid-3">
          <div className="field">
            <label>Nombre del docente</label>
            <input
              type="text"
              value={props.nombreDocente}
              onChange={(e) => props.setNombreDocente(e.target.value)}
              placeholder="Ej: María González López"
            />
          </div>
          <div className="field">
            <label>Nombre de la escuela</label>
            <input
              type="text"
              value={props.nombreEscuela}
              onChange={(e) => props.setNombreEscuela(e.target.value)}
              placeholder="Ej: Primaria Benito Juárez"
            />
          </div>
          <div className="field">
            <label>Periodo planeado</label>
            <input
              type="text"
              value={props.periodoPlaneado}
              onChange={(e) => props.setPeriodoPlaneado(e.target.value)}
              placeholder="Ej: Enero – Febrero 2025"
            />
          </div>
        </div>
      </div>

      {/* Configuración del grupo */}
      <div className="section-label">Configuración del grupo</div>
      <div className="card">
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>Nivel educativo</label>
            <select value={props.nivel} onChange={(e) => props.setNivel(e.target.value as NivelEdu)}>
              {NIVELES_EDU.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Grado</label>
            <select value={props.grado} onChange={(e) => props.setGrado(e.target.value)}>
              {props.gradosDisponibles.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Modalidad</label>
            <div className="toggle-group">
              <button
                type="button"
                data-active={props.modalidad === "secuencial"}
                onClick={() => props.setModalidad("secuencial")}
              >
                Secuencial
              </button>
              <button
                type="button"
                data-active={props.modalidad === "proyecto"}
                onClick={() => props.setModalidad("proyecto")}
              >
                Proyecto
              </button>
            </div>
          </div>
        </div>
        <div className="grid-4">
          <div className="field span-2">
            <label>Campo formativo</label>
            <select value={props.campo} onChange={(e) => props.cargarContenidos(e.target.value)}>
              <option value="">Selecciona un campo</option>
              {props.camposDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Sesiones</label>
            <div className="number-input">
              <button
                type="button"
                className="num-btn left"
                onClick={() => props.setSesiones((v) => clamp(v - 1, 1, 20))}
                aria-label="Menos sesiones"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={props.sesiones}
                onChange={(e) => props.setSesiones(() => clamp(Number(e.target.value), 1, 20))}
              />
              <button
                type="button"
                className="num-btn right"
                onClick={() => props.setSesiones((v) => clamp(v + 1, 1, 20))}
                aria-label="Más sesiones"
              >
                +
              </button>
            </div>
          </div>
          <div className="field">
            <label>Duración (min)</label>
            <div className="number-input">
              <button
                type="button"
                className="num-btn left"
                onClick={() => props.setDuracion((v) => clamp(v - 5, 30, 240))}
                aria-label="Menos minutos"
              >
                −
              </button>
              <input
                type="number"
                min={30}
                max={240}
                step={5}
                value={props.duracion}
                onChange={(e) => props.setDuracion(() => clamp(Number(e.target.value), 30, 240))}
              />
              <button
                type="button"
                className="num-btn right"
                onClick={() => props.setDuracion((v) => clamp(v + 5, 30, 240))}
                aria-label="Más minutos"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenidos y procesos */}
      <div className="section-label">Contenidos y procesos</div>
      <div className="card">
        <div className="contenidos-header">
          <label style={{ fontSize: 12, color: "var(--text)" }}>Contenidos curriculares</label>
          <span className="link-action">
            <Upload size={11} />
            Base NEM
          </span>
        </div>

        <button
          type="button"
          className="select-display"
          data-empty={contenidosSel.length === 0}
          onClick={() => setContenidosOpen((v) => !v)}
          disabled={contenidos.length === 0}
        >
          {contenidos.length === 0
            ? "Selecciona un campo formativo primero"
            : `Seleccionados: ${contenidosSel.length} de ${contenidos.length}`}
        </button>

        {contenidosOpen && contenidos.length > 0 ? (
          <div className="select-panel">
            <div className="cascade-list">
              {contenidos.map((contenido) => (
                <button
                  key={contenido.id}
                  type="button"
                  className="ni-item"
                  data-active={contenidosSel.includes(contenido.id)}
                  onClick={() => props.setContenidosSel((prev) => toggle(prev, contenido.id))}
                >
                  <span className="ni-check" />
                  <span className="ni-item-text">
                    <span className="ni-item-title">{contenido.titulo}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="hint">
          Si existe el catálogo NEM del grado se carga automáticamente. Selecciona el campo y luego los contenidos.
        </p>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Procesos de Desarrollo de Aprendizaje (PDA)</label>
          <button
            type="button"
            className="select-display"
            data-empty={pdaSel.length === 0}
            onClick={() => setPdaOpen((v) => !v)}
            disabled={pdaDisponibles.length === 0}
          >
            {pdaDisponibles.length === 0
              ? "Selecciona contenidos primero"
              : `Seleccionados: ${pdaSel.length} de ${pdaDisponibles.length}`}
          </button>
          {pdaOpen && pdaDisponibles.length > 0 ? (
            <div className="select-panel">
              <div className="cascade-list">
                {pdaDisponibles.map((pda, index) => (
                  <button
                    key={`${index}-${pda.slice(0, 24)}`}
                    type="button"
                    className="ni-item"
                    data-active={pdaSel.includes(pda)}
                    onClick={() => props.setPdaSel((prev) => toggle(prev, pda))}
                  >
                    <span className="ni-check" />
                    <span className="ni-item-text">
                      <span className="ni-item-title">{pda}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <p className="hint">Los PDA se actualizan automáticamente según los contenidos seleccionados.</p>
        </div>
      </div>

      {/* Estrategias de evaluación */}
      <div className="section-label">Estrategias de evaluación</div>
      <div className="card">
        <div className="chips">
          {ESTRATEGIAS.map((estrategia) => (
            <button
              key={estrategia}
              type="button"
              className="chip"
              data-active={props.estrategias.includes(estrategia)}
              onClick={() => props.setEstrategias((prev) => toggle(prev, estrategia))}
            >
              {estrategia}
            </button>
          ))}
        </div>
      </div>

      {/* Tema y contexto */}
      <div className="section-label">Tema y contexto</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Tema detonador</label>
          <textarea
            value={props.proyecto}
            onChange={(e) => props.setProyecto(e.target.value)}
            placeholder="Describe la idea o proyecto central que guiará el aprendizaje del grupo..."
          />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>
            Contexto del grupo <span style={{ color: "#45426A" }}>(opcional)</span>
          </label>
          <input
            type="text"
            value={props.contextoGrupo}
            onChange={(e) => props.setContextoGrupo(e.target.value)}
            placeholder="Tamaño del grupo, dinámica, entorno..."
          />
        </div>
        <div className="field">
          <label>
            Recursos y materiales disponibles <span style={{ color: "#45426A" }}>(opcional)</span>
          </label>
          <input
            type="text"
            value={props.materialesDisponibles}
            onChange={(e) => props.setMaterialesDisponibles(e.target.value)}
            placeholder="Aula, internet, proyector, cartulinas, tablets..."
          />
        </div>
      </div>

      {/* Neuroinclusividad */}
      <div className="section-label">Neuroinclusividad</div>
      <div className="card">
        <div className="ni-toggle-row">
          <div className="ni-toggle-label">
            <Users size={16} />
            Incluir adaptaciones neuroinclusivas
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {props.niActiva ? <span className="ni-badge">Activo</span> : null}
            <label className="switch">
              <input type="checkbox" checked={props.niActiva} onChange={(e) => props.setNiActiva(e.target.checked)} />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        {props.niActiva ? (
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
                  data-active={props.condiciones.includes(condicion.value)}
                  onClick={() => props.setCondiciones((prev) => toggle(prev, condicion.value))}
                >
                  <span className="ni-check" />
                  <span className="ni-item-text">
                    <span className="ni-item-title">{condicion.title}</span>
                    <span className="ni-item-sub">{condicion.sub}</span>
                  </span>
                </button>
              ))}
            </div>

            {props.condiciones.includes("otra") ? (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  value={props.otraDescripcion}
                  onChange={(e) => props.setOtraDescripcion(e.target.value)}
                  placeholder="Describe la condición o necesidad específica del estudiante..."
                />
              </div>
            ) : null}

            <div className="ni-intensity">
              <label>Nivel de detalle de las adaptaciones</label>
              <div className="intensity-options">
                {NIVELES_DETALLE.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    className="intensity-opt"
                    data-active={props.nivelDetalle === n.value}
                    onClick={() => props.setNivelDetalle(n.value)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="cta-area">
        {props.error ? <p className="alert">{props.error}</p> : null}
        {props.upgrade ? (
          <a className="button secondary" href="/cuenta">
            Activar membresía
          </a>
        ) : null}
        <button className="btn-generate" type="button" onClick={props.generar} disabled={props.loading}>
          {props.loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {props.loading ? "Generando…" : "Generar Planeación"}
        </button>
        <p className="cta-note">
          Los recuadros de salida son editables. Puedes copiar cada sección o descargar la planeación.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────── Planeación ───────────────────────────
function PlaneacionView({
  draft,
  sesiones,
  duracion,
  modalidad,
  onGo,
}: {
  draft: { title: string; content: string } | null;
  sesiones: number;
  duracion: number;
  modalidad: "secuencial" | "proyecto";
  onGo: (tab: Tab) => void;
}) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Aún no hay planeación"
          text="Genera una planeación desde la pestaña Generación para verla aquí organizada por sesiones."
          onGo={onGo}
        />
      </div>
    );
  }

  const parsed = parseSesiones(draft.content);

  return (
    <div className="page-inner wide">
      <div className="plan-header">
        <h2>{draft.title}</h2>
        <p>Planeación generada y organizada por sesiones.</p>
        <div className="plan-meta">
          <span className="plan-tag">{sesiones} sesiones</span>
          <span className="plan-tag">{duracion} min c/u</span>
          <span className="plan-tag">{modalidad === "proyecto" ? "Por proyecto" : "Secuencial"}</span>
          <span className="plan-tag">NEM 2025</span>
        </div>
      </div>

      {parsed.length > 0 ? (
        parsed.map((sesion, index) => (
          <div className="sesion-card" key={index}>
            <button type="button" className="sesion-header" onClick={() => setOpenIndex(openIndex === index ? -1 : index)}>
              <span className="sesion-num">{index + 1}</span>
              <span className="sesion-title">{sesion.title}</span>
              <ChevronDown size={16} className="sesion-chevron" data-open={openIndex === index} />
            </button>
            {openIndex === index ? (
              <div className="sesion-body">
                <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(sesion.body) }} />
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div className="card">
          <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content) }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Materiales ───────────────────────────
function MaterialesView({
  draft,
  onGo,
}: {
  draft: { content: string } | null;
  onGo: (tab: Tab) => void;
}) {
  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Aún no hay materiales"
          text="Cuando generes una planeación, los materiales y recursos sugeridos aparecerán aquí."
          onGo={onGo}
        />
      </div>
    );
  }

  const materiales = parseMateriales(draft.content);

  return (
    <div className="page-inner wide">
      <div className="section-label">Materiales y recursos</div>
      {materiales.length > 0 ? (
        materiales.map((material, index) => (
          <div className="material-card" key={index}>
            <div className="material-icon">
              <Package size={18} />
            </div>
            <div className="material-body">
              <div className="material-desc">{material}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="card">
          <p className="hint" style={{ marginTop: 0 }}>
            Los materiales están integrados dentro de la planeación generada. Revísalos en la pestaña{" "}
            <strong style={{ color: "var(--text)" }}>Planeación</strong> o en el texto completo en{" "}
            <strong style={{ color: "var(--text)" }}>Preview</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Preview ───────────────────────────
function PreviewView({
  draft,
  setDraft,
  status,
  copied,
  onSave,
  onCopy,
  onPrint,
  onDownload,
  onDrive,
  onGo,
}: {
  draft: { id: string; title: string; content: string } | null;
  setDraft: (d: { id: string; title: string; content: string }) => void;
  status: string;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onDrive: () => void;
  onGo: (tab: Tab) => void;
}) {
  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Sin contenido para previsualizar"
          text="La planeación generada aparecerá aquí como texto editable. Genera una primero."
          onGo={onGo}
        />
      </div>
    );
  }

  return (
    <div className="page-inner wide">
      <div className="preview-toolbar">
        <h3>Preview — Texto completo</h3>
        <div className="preview-actions">
          <button className="btn-icon-sm" type="button" onClick={onSave}>
            <Save size={13} />
            Guardar
          </button>
          <button className="btn-icon-sm" type="button" onClick={onCopy}>
            <Copy size={13} />
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button className="btn-icon-sm" type="button" onClick={onPrint}>
            <Printer size={13} />
            Imprimir
          </button>
          <button className="btn-icon-sm" type="button" onClick={onDownload}>
            <Download size={13} />
            Descargar
          </button>
          <button className="btn-icon-sm primary" type="button" onClick={onDrive}>
            <UploadCloud size={13} />
            Drive
          </button>
        </div>
      </div>
      {status ? (
        <p className="hint" style={{ marginBottom: 8 }}>
          {status}
        </p>
      ) : null}
      <textarea
        className="preview-textarea"
        value={draft.content}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
      />
    </div>
  );
}

function EmptyState({ title, text, onGo }: { title: string; text: string; onGo: (tab: Tab) => void }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={40} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button secondary" type="button" style={{ marginTop: 16 }} onClick={() => onGo("generacion")}>
        <Sparkles size={16} />
        Ir a Generación
      </button>
    </div>
  );
}
