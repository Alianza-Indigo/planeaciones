"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HeartHandshake,
  HelpCircle,
  History,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Printer,
  Save,
  Sparkles,
  Upload,
  UploadCloud,
  Users,
  Eye,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import type { Contenido } from "@/lib/curriculum/types";
import {
  esUrl,
  limpiarDocumento,
  materialesAtexto,
  splitMateriales,
  type MaterialesData,
  type MaterialItem,
} from "@/lib/generation/materiales";

type Tab = "generacion" | "planeacion" | "materiales" | "preview";

const NIVELES_EDU = ["Preescolar", "Primaria", "Secundaria"] as const;
type NivelEdu = (typeof NIVELES_EDU)[number];

const GRADOS_POR_NIVEL: Record<NivelEdu, string[]> = {
  Preescolar: ["1°", "2°", "3°"],
  Primaria: ["1°", "2°", "3°", "4°", "5°", "6°"],
  Secundaria: ["1°", "2°", "3°"],
};

// Campos de ciencias por nivel: son los únicos que en modalidad Secuencial
// permiten elegir varios contenidos (el resto es de selección única).
const CAMPO_CIENCIAS: Partial<Record<NivelEdu, string>> = {
  Primaria: "SABERES Y PENSAMIENTO CIENTÍFICO",
  Preescolar: "SABERES PENSAMIENTO CIENTÍFICO",
};

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

const SEP = "";
const keyOf = (campo: string, titulo: string) => `${campo}${SEP}${titulo}`;

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildGradoLabel(nivel: NivelEdu, grado: string): string {
  const digit = grado.replace(/\D/g, "");
  return `${digit} ${nivel.toLowerCase()}`;
}

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
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

// Planeación de ejemplo para revisar el diseño de las pestañas sin generar.
const DEMO_DRAFT = {
  id: "demo",
  title: "Conociendo y escribiendo nuestros nombres",
  content: `# Planeación: Conociendo y escribiendo nuestros nombres

**Grado:** 2° Primaria · **Campo:** Lenguajes · **Modalidad:** Secuencial · 3 sesiones de 50 min

## Sesión 1 · Conociendo y Escribiendo Nuestros Nombres

### Inicio (10 min)
- Saludo en semicírculo. El docente muestra su propio nombre en una tarjeta grande.
- Activar conocimientos previos: ¿quién eligió tu nombre?, ¿por qué es importante?

### Desarrollo (30 min)
- Hoja de trabajo "Mi Nombre y el de Mi Familia": el estudiante escribe su nombre completo y el de 4 familiares.
- Subraya las letras repetidas y dibuja un retrato de cada uno.

### Cierre (10 min)
- Algunos estudiantes comparten un nombre de su familia y una letra subrayada.
- Reflexión metacognitiva sobre lo aprendido.

**Adaptaciones neurodivergentes:**
- **Función ejecutiva:** tarjeta de apoyo con 5 categorías de familiares para reducir la carga de memoria.
- **Sobrecarga sensorial:** rincón tranquilo o audífonos de cancelación de ruido.
- **Comunicación:** tarjetas de letras para señalar en lugar de explicación oral.

### Recursos y materiales de la Sesión 1
Para el docente:
- Tarjeta grande con el nombre del docente (1, cartulina 20x30 cm)
- Lista de categorías de familiares (1 hoja de apoyo)
Para los estudiantes:
- Hoja "Mi Nombre y el de Mi Familia" (1 copia por alumno)
- Colores y lápices (1 set por alumno)

## Sesión 2 · Descubriendo las Letras Similares

### Inicio (10 min)
- Retomar las hojas de la sesión anterior y comentar qué letras parecieron interesantes.

### Desarrollo (30 min)
- Juego de detectives de letras en equipos: comparar nombres con letras similares (c/s/z, b/v).
- Registrar observaciones en la hoja "Detectives de Letras".

### Cierre (10 min)
- Cada equipo comparte una observación. El docente muestra dos tarjetas y pregunta por sus diferencias.

**Adaptaciones neurodivergentes:**
- **Función ejecutiva:** tarjetas de nombres pre-seleccionados.
- **Interacción grupal:** rol de "observador de letras" con menos interacción verbal.

### Recursos y materiales de la Sesión 2
Para el docente:
- Juego de tarjetas de letras c/s/z y b/v (1 set plastificado)
Para los estudiantes:
- Hoja "Detectives de Letras" (1 por equipo de 4)
- Lápiz (1 por alumno)

## Sesión 3 · Creando Nuestro Mural de Nombres

### Inicio (10 min)
- Presentar el pliego de papel "Nuestro Mural de Nombres".

### Desarrollo (30 min)
- Cada estudiante escribe su nombre en una tarjeta, la decora y la pega en el mural.
- Observar las letras repetidas en el mural colectivo.

### Cierre (10 min)
- Observación colectiva del mural y reflexión sobre escribir correctamente el nombre de los demás.

**Adaptaciones neurodivergentes:**
- **Sobrecarga sensorial:** estación de pegado para 2-3 estudiantes con temporizador visual.
- **Comunicación:** tarjetas de sentimientos/emojis para expresar sin verbalizar.

### Recursos y materiales de la Sesión 3
Para el docente:
- Pliego de papel bond para el mural (1 de 90x120 cm)
- Cinta adhesiva (1 rollo)
Para los estudiantes:
- Tarjetas en blanco (1 por alumno)
- Plumones (1 caja por equipo de 4)
- Lista visual de compañeros (1 por alumno)

## Materiales

- Cuento "El Nombre de Todos" — historia sobre Ana que descubre la importancia de su nombre. Leer al inicio de la Sesión 1.
- Juego de Tarjetas de Letras — set plastificado con el abecedario en mayúsculas y minúsculas.
- Hoja "Mi Nombre y el de Mi Familia" — formato con espacio para 4 familiares y dibujo. Una copia por estudiante.
- Hoja "Detectives de Letras" — tabla comparativa de pares de nombres. Una copia por equipo.
- Lista de Cotejo — 5 indicadores vinculados a los PDA.
- Rúbrica del Mural de Nombres — 5 criterios en 3 niveles de desempeño.

## Evaluación

- **Formativa:** lista de cotejo durante las tres sesiones.
- **Sumativa:** rúbrica del mural de nombres al cierre.

VERIFICACION FINAL: Se han generado 3 sesiones completas.

<<<MATERIALES_JSON>>>
{"sesiones":[{"sesion":1,"titulo":"Conociendo nuestros nombres","materiales":[{"para":"docente","nombre":"Cuento: El Nombre de Todos","tipo":"lectura","cantidad":"1 lectura en voz alta","contenido":"Ana no entendía por qué su nombre tenía tantas letras. Una mañana, su abuela le contó que cada letra guardaba un pedacito de historia: la A del principio era por su bisabuela Amalia, la N por el río Nazas donde nació su mamá. Ana descubrió que su nombre no era solo suyo, también era de toda su familia. Esa tarde escribió su nombre con cuidado y, al lado, los nombres de quienes ama, y notó que la S de Sofía sonaba igual que la de su propio apellido."},{"para":"alumno","nombre":"Hoja 'Mi Nombre y el de Mi Familia'","tipo":"organizador","cantidad":"1 por alumno","contenido":"Formato con espacio para el nombre propio y 4 familiares, una columna para letras repetidas y un recuadro para dibujar un retrato."}]},{"sesion":2,"titulo":"Descubriendo las letras similares","materiales":[{"para":"docente","nombre":"Video: Letras que suenan parecido (c/s/z)","tipo":"video","cantidad":"1","contenido":"https://www.youtube.com/watch?v=ejemplo"},{"para":"alumno","nombre":"Hoja 'Detectives de Letras'","tipo":"organizador","cantidad":"1 por equipo de 4","contenido":"Tabla comparativa con columnas: cómo se ve / cómo suena / diferencia principal."}]},{"sesion":3,"titulo":"Mural de nombres","materiales":[{"para":"docente","nombre":"Tarjetas de sentimientos","tipo":"tarjeta","cantidad":"1 set","contenido":"Cuatro tarjetas con palabra + emoji: Alegría, Amistad, Unión, Orgullo."},{"para":"alumno","nombre":"Tarjeta para el mural","tipo":"otro","cantidad":"1 por alumno","contenido":"Cartulina de 10x15 cm para escribir y decorar el propio nombre."}]}]}
<<<FIN_MATERIALES_JSON>>>
`,
};

type GrupoMateriales = { grupo: string; items: string[] };

// Extrae los materiales del bloque "RECURSOS Y MATERIALES" dentro de una sesión,
// separados por subgrupo (Para el docente / Para los estudiantes).
function extraerMaterialesDeSesion(body: string): GrupoMateriales[] {
  const idx = body.search(/RECURSOS Y MATERIALES/i);
  if (idx === -1) return [];
  let region = body.slice(idx);
  // Corta al llegar a la siguiente subsección de la sesión.
  const fin = region.slice(20).search(/ADAPTACIONES INCLUSIVAS|VERIFICAR|^#{1,6}\s/im);
  if (fin > 0) region = region.slice(0, fin + 20);

  const grupos: GrupoMateriales[] = [];
  let current: GrupoMateriales | null = null;

  for (const raw of region.split("\n")) {
    const t = raw.trim();
    const header = t.match(/^(?:#{0,4}\s*)?\**\s*(Para el [Dd]ocente|Para los [Ee]studiantes)\s*\**\s*:?\s*$/);
    if (header) {
      current = { grupo: /docente/i.test(header[1]) ? "Para el docente" : "Para los estudiantes", items: [] };
      grupos.push(current);
      continue;
    }
    const bullet = t.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      const txt = bullet[1].replace(/\*\*/g, "").trim();
      if (!txt) continue;
      if (!current) {
        current = { grupo: "Materiales", items: [] };
        grupos.push(current);
      }
      current.items.push(txt);
    }
  }
  return grupos.filter((g) => g.items.length > 0);
}

// Materiales agrupados por sesión.
function materialesPorSesion(content: string): { sesion: number; titulo: string; grupos: GrupoMateriales[] }[] {
  return parseSesiones(content)
    .map((s, i) => ({ sesion: i + 1, titulo: s.title, grupos: extraerMaterialesDeSesion(s.body) }))
    .filter((sesion) => sesion.grupos.length > 0);
}

// Materiales generales / apéndice (fuera de las sesiones).
function materialesGenerales(content: string): string[] {
  const lines = content.split("\n");
  const items: string[] = [];
  let capturing = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (/RECURSOS Y MATERIALES GENERALES|MATERIALES COMPLEMENTARIOS|^#{1,6}\s*Materiales\b/i.test(t)) {
      capturing = true;
      continue;
    }
    if (capturing && /^(EVALUACION|ADAPTACIONES Y DIVERSIFICACION|EVALUACION SUMATIVA|VERIFICACION|^#{1,6}\s)/i.test(t) && !/materi/i.test(t)) {
      capturing = false;
    }
    if (capturing) {
      const bullet = t.match(/^[-*]\s+(.*)$/);
      if (bullet) {
        const txt = bullet[1].replace(/\*\*/g, "").trim();
        if (txt) items.push(txt);
      }
    }
  }
  return [...new Set(items)];
}

// Separa "Nombre: descripción" para mostrarlo como título + detalle.
function partirMaterial(texto: string): { titulo: string; desc: string } {
  const i = texto.indexOf(":");
  if (i > 0 && i < 60) {
    return { titulo: texto.slice(0, i).trim(), desc: texto.slice(i + 1).trim() };
  }
  return { titulo: texto, desc: "" };
}

export function TeacherDashboard() {
  const { data: session, status } = useSession();
  const autenticado = status === "authenticated";
  const esAdmin = session?.user?.role === "ADMIN";

  const [tab, setTab] = useState<Tab>("generacion");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

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

  // Campos y contenidos
  const [camposDisponibles, setCamposDisponibles] = useState<string[]>([]);
  const [campo, setCampo] = useState(""); // modalidad secuencial (campo único)
  const [camposProyecto, setCamposProyecto] = useState<string[]>([]); // modalidad proyecto
  const [contenidosPorCampo, setContenidosPorCampo] = useState<Record<string, Contenido[]>>({});
  const [contenidosSel, setContenidosSel] = useState<string[]>([]); // keys campo\x01titulo
  const [pdaSel, setPdaSel] = useState<string[]>([]);

  // Menús desplegables
  const [camposOpen, setCamposOpen] = useState(false);
  const [contenidosOpen, setContenidosOpen] = useState(false);
  const [pdaOpen, setPdaOpen] = useState(false);

  // Evaluación / tema / neuroinclusividad
  const [estrategias, setEstrategias] = useState<string[]>(["Rúbrica", "Lista de cotejo"]);
  const [proyecto, setProyecto] = useState("");
  const [contextoGrupo, setContextoGrupo] = useState("");
  const [materialesDisponibles, setMaterialesDisponibles] = useState("");
  const [niActiva, setNiActiva] = useState(false);
  const [condiciones, setCondiciones] = useState<string[]>([]);
  const [otraDescripcion, setOtraDescripcion] = useState("");
  const [nivelDetalle, setNivelDetalle] = useState<"compacto" | "estandar" | "detallado">("estandar");

  // Resultado
  const [draft, setDraft] = useState<{ id: string; title: string; content: string } | null>(null);
  const [previewStatus, setPreviewStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [materialesData, setMaterialesData] = useState<MaterialesData | null>(null);

  const gradoLabel = useMemo(() => buildGradoLabel(nivel, grado), [nivel, grado]);
  const gradosDisponibles = GRADOS_POR_NIVEL[nivel];
  const camposFiltrados = useMemo(
    () => filtrarCamposPorNivel(camposDisponibles, nivel),
    [camposDisponibles, nivel],
  );

  // Campos activos según la modalidad.
  const camposActivos = useMemo(
    () => (modalidad === "proyecto" ? camposProyecto : campo ? [campo] : []),
    [modalidad, camposProyecto, campo],
  );
  const camposActivosKey = camposActivos.join("|");

  // En Secuencial, fuera del campo de ciencias, el contenido es de selección única.
  const campoUnico =
    modalidad === "secuencial" && !!campo && CAMPO_CIENCIAS[nivel] !== undefined && campo !== CAMPO_CIENCIAS[nivel];

  const selectedContenidos = useMemo(
    () =>
      camposActivos.flatMap((c) =>
        (contenidosPorCampo[c] ?? [])
          .filter((ct) => contenidosSel.includes(keyOf(c, ct.titulo)))
          .map((ct) => ({ campo: c, ...ct })),
      ),
    [camposActivos, contenidosPorCampo, contenidosSel],
  );

  const pdaDisponibles = useMemo(
    () => [...new Set(selectedContenidos.flatMap((c) => c.pda))],
    [selectedContenidos],
  );

  const contenidosTotal = useMemo(
    () => camposActivos.reduce((acc, c) => acc + (contenidosPorCampo[c]?.length ?? 0), 0),
    [camposActivos, contenidosPorCampo],
  );

  // El grado debe existir dentro del nivel.
  useEffect(() => {
    if (!gradosDisponibles.includes(grado)) setGrado(gradosDisponibles[0]);
  }, [gradosDisponibles, grado]);

  // Cargar campos del grado y limpiar selecciones dependientes.
  useEffect(() => {
    let cancelled = false;
    setCampo("");
    setCamposProyecto([]);
    setContenidosPorCampo({});
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

  // Cargar contenidos de los campos activos que aún no estén en memoria.
  useEffect(() => {
    const missing = camposActivos.filter((c) => c && !contenidosPorCampo[c]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const c of missing) {
        const response = await fetch(
          `/api/curriculum?grado=${encodeURIComponent(gradoLabel)}&campo=${encodeURIComponent(c)}`,
        );
        const payload = (await response.json()) as { contenidos?: Contenido[] };
        if (cancelled) return;
        setContenidosPorCampo((prev) => (prev[c] ? prev : { ...prev, [c]: payload.contenidos ?? [] }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [camposActivosKey, gradoLabel, contenidosPorCampo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Podar contenidos seleccionados que dejaron de estar disponibles.
  useEffect(() => {
    const validas = new Set(
      camposActivos.flatMap((c) => (contenidosPorCampo[c] ?? []).map((ct) => keyOf(c, ct.titulo))),
    );
    setContenidosSel((prev) => {
      const next = prev.filter((k) => validas.has(k));
      return next.length === prev.length ? prev : next;
    });
  }, [camposActivosKey, contenidosPorCampo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Podar PDA seleccionados que dejaron de estar disponibles (sin auto-seleccionar).
  useEffect(() => {
    setPdaSel((prev) => {
      const next = prev.filter((p) => pdaDisponibles.includes(p));
      return next.length === prev.length ? prev : next;
    });
  }, [pdaDisponibles]);

  // ── Handlers de selección ──
  function toggleContenido(campoSel: string, titulo: string) {
    const k = keyOf(campoSel, titulo);
    if (campoUnico) {
      setContenidosSel([k]);
    } else {
      setContenidosSel((prev) => toggle(prev, k));
    }
  }

  function todosContenidos() {
    if (campoUnico) {
      const first = (contenidosPorCampo[campo] ?? [])[0];
      setContenidosSel(first ? [keyOf(campo, first.titulo)] : []);
      return;
    }
    setContenidosSel(
      camposActivos.flatMap((c) => (contenidosPorCampo[c] ?? []).map((ct) => keyOf(c, ct.titulo))),
    );
  }

  const navItems: { id: Tab | "historial"; label: string; icon: LucideIcon }[] = [
    { id: "generacion", label: "Generación", icon: Sparkles },
    { id: "planeacion", label: "Planeación", icon: Calendar },
    { id: "materiales", label: "Materiales", icon: Package },
    { id: "preview", label: "Vista previa", icon: Eye },
    { id: "historial", label: "Historial", icon: History },
  ];
  const userName = session?.user?.name || nombreDocente || "Docente ADIA";
  const userRole = esAdmin ? "Administrador" : "Docente";
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD";

  function go(next: Tab) {
    setTab(next);
    setSidebarOpen(false);
  }

  // Carga una planeación. Si el servidor ya entregó los materiales estructurados
  // (metadata), el contenido ya viene limpio y con los materiales en prosa. Si no
  // (p. ej. el ejemplo), se separa el bloque JSON y se arma el contenido legible.
  function cargarPlaneacion(id: string, title: string, rawContent: string, materialesServidor?: MaterialesData | null) {
    if (materialesServidor) {
      setDraft({ id, title, content: rawContent.trim() });
      setMaterialesData(materialesServidor);
    } else {
      const { texto, materiales } = splitMateriales(rawContent);
      const plan = limpiarDocumento(texto);
      const content = materiales ? `${plan}\n\n${materialesAtexto(materiales)}` : plan;
      setDraft({ id, title, content });
      setMaterialesData(materiales);
    }
    setDriveUrl(null);
    setPreviewStatus("");
  }

  // Carga una planeación de ejemplo para revisar el diseño sin generar.
  function cargarEjemplo() {
    setSesiones(3);
    setDuracion(50);
    setModalidad("secuencial");
    cargarPlaneacion(DEMO_DRAFT.id, DEMO_DRAFT.title, DEMO_DRAFT.content);
    setTab("planeacion");
    setSidebarOpen(false);
  }

  const esDemo = draft?.id === "demo";

  async function generar() {
    setError(null);
    setUpgrade(false);
    setNeedLogin(false);

    if (!autenticado) {
      setError("Inicia sesión con Google para generar tu planeación.");
      setNeedLogin(true);
      return;
    }

    const campos = camposActivos.filter(Boolean);
    const contenidos = [...new Set(selectedContenidos.map((c) => c.titulo))];

    if (!nombreDocente || !nombreEscuela || !periodoPlaneado || !proyecto) {
      setError("Completa los datos del docente y el tema detonador.");
      return;
    }
    if (campos.length === 0) {
      setError(modalidad === "proyecto" ? "Selecciona al menos un campo formativo." : "Selecciona un campo formativo.");
      return;
    }
    if (contenidos.length === 0) {
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
        campos,
        contenidos,
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
      if (response.status === 401) setNeedLogin(true);
      return;
    }

    const draftResponse = await fetch(`/api/drafts/${payload.draftId}`);
    const draftData = await draftResponse.json();
    setLoading(false);
    const materialesServidor = (draftData?.metadata?.materiales ?? null) as MaterialesData | null;
    cargarPlaneacion(
      payload.draftId,
      draftData.title ?? payload.title,
      draftData.content ?? "",
      materialesServidor && Array.isArray(materialesServidor.sesiones) ? materialesServidor : null,
    );
    setTab("planeacion");
  }

  async function savePreview() {
    if (!draft) return;
    if (esDemo) {
      setPreviewStatus("Es una planeación de ejemplo; genera una real para guardar.");
      return;
    }
    setPreviewStatus("Guardando…");
    await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: draft.title, content: draft.content }),
    });
    setPreviewStatus("Cambios guardados.");
  }

  async function exportToDrive() {
    if (!draft || driveLoading) return;
    if (esDemo) {
      setPreviewStatus("Es una planeación de ejemplo; genera una real para exportar.");
      return;
    }
    setDriveLoading(true);
    setPreviewStatus("Enviando a Google Drive…");
    try {
      const response = await fetch("/api/drive/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const payload = await response.json().catch(() => ({}) as { error?: string; url?: string });
      if (response.ok) {
        setDriveUrl(payload.url ?? null);
        setPreviewStatus("Exportado a Google Drive.");
      } else {
        setPreviewStatus(payload.error ?? `No se pudo exportar (HTTP ${response.status}).`);
      }
    } catch {
      setPreviewStatus("No se pudo conectar con el servidor para exportar. Intenta de nuevo.");
    } finally {
      setDriveLoading(false);
    }
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

  function descargarArchivo(blob: Blob, extension: string) {
    if (!draft) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.replace(/\s+/g, "-")}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    if (!draft) return;
    descargarArchivo(new Blob([draft.content], { type: "text/plain;charset=utf-8" }), "txt");
  }

  // Genera un .doc (HTML compatible con Word/Google Docs) con el formato del contenido.
  function downloadWord() {
    if (!draft) return;
    const cuerpo = renderMarkdown(draft.content);
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${draft.title}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;}h1{font-size:18pt;}h2{font-size:15pt;}h3{font-size:13pt;}h4{font-size:12pt;}ul,ol{margin:6pt 0 6pt 24pt;}</style></head><body>${cuerpo}</body></html>`;
    descargarArchivo(new Blob(["﻿", html], { type: "application/msword" }), "doc");
  }

  return (
    <div className="app">
      <header className="header">
        <button className="hamburger" onClick={() => setSidebarOpen((value) => !value)} aria-label="Menú">
          <Menu size={20} />
        </button>
        <Image src="/images/logo-alianza-indigo.png" alt="" width={34} height={34} className="header-logo" />
        <div className="header-text">
          <h1>ADIA</h1>
          <p>Alianza Índigo Neurodivergente</p>
        </div>
        <span className="badge">Docente</span>
      </header>

      <div className="sidebar-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <div className="app-body">
        <aside className="sidebar" data-open={sidebarOpen}>
          <div className="sidebar-brand">
            <Image src="/images/logo-alianza-indigo.png" alt="" width={72} height={72} className="sidebar-logo" />
            <div>
              <div className="sidebar-brand-name">ADIA</div>
              <div className="sidebar-brand-subtitle">Alianza Índigo Neurodivergente</div>
            </div>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const disabled = item.id === "historial";
            return (
              <button
                key={item.id}
                type="button"
                className="nav-item"
                data-active={!disabled && tab === item.id}
                data-disabled={disabled}
                disabled={disabled}
                onClick={() => {
                  if (item.id !== "historial") go(item.id);
                }}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
          <div className="nav-spacer" />
          <div className="teacher-user-card">
            <div className="teacher-user-avatar">{userInitials}</div>
            <div>
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
          </div>
          <a className="nav-item help" href="mailto:contacto@alianzaindigo.org">
            <HelpCircle size={20} />
            Centro de ayuda
            <ExternalLink size={14} className="nav-trailing-icon" />
          </a>
          {esAdmin ? (
            <a className="nav-item" href="/admin">
              <LayoutDashboard size={20} />
              Panel admin
            </a>
          ) : null}
          {autenticado ? (
            <button className="nav-item danger" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut size={20} />
              Salir
            </button>
          ) : (
            <button className="nav-item" type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>
              <LogIn size={20} />
              Iniciar sesión
            </button>
          )}
        </aside>

        <main className="main">
          <div className="teacher-topbar">
            <div>
              <h1>Nueva planeación didáctica</h1>
              <p>Planeaciones autoejecutables con inclusión neurodivergente</p>
            </div>
            <div className="teacher-topbar-actions">
              <button className="button secondary" type="button" onClick={savePreview} disabled={!draft}>
                <Save size={17} />
                Guardar borrador
              </button>
              <button className="button primary" type="button" onClick={generar} disabled={loading}>
                {loading ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
                {loading ? "Generando..." : "Generar planeación"}
              </button>
            </div>
          </div>

          {tab === "generacion" ? (
            <div className="page-inner dashboard-page">
              <div className="teacher-planner-layout">
                <section className="teacher-planner-main">
                  <div className="intro">
                    <div className="intro-icon">
                      <BookOpen size={48} />
                    </div>
                    <div className="intro-copy">
                      <h2>Genera una clase completa, no solo una planeación</h2>
                      <p>ADIA organiza todos los datos obligatorios de la planeación NEM en un flujo guiado.</p>
                      <div className="intro-meta">
                        <div className="meta-item">
                          <MessageSquare size={18} />
                          <span>
                            <strong>Guion docente</strong>
                            Secuencias claras y listas para aplicar
                          </span>
                        </div>
                        <div className="meta-item">
                          <FileText size={18} />
                          <span>
                            <strong>Materiales y evaluación</strong>
                            Recursos, actividades y evaluación alineados
                          </span>
                        </div>
                        <div className="meta-item">
                          <Users size={18} />
                          <span>
                            <strong>Inclusión neurodivergente</strong>
                            Apoyos específicos para todos tus estudiantes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-stepper" aria-label="Progreso de planeación">
                    {[
                      ["1", "Datos generales", true],
                      ["2", "Contenido NEM", true],
                      ["3", "Diseño didáctico", true],
                      ["4", "Evaluación", false],
                      ["5", "Inclusión", false],
                    ].map(([number, label, active]) => (
                      <div className="dashboard-step" data-active={active} key={String(number)}>
                        <span>{active && number !== "3" ? <CheckCircle2 size={18} /> : number}</span>
                        <p>{label}</p>
                      </div>
                    ))}
                  </div>

              {/* Datos del docente */}
              <div className="section-label">Datos del docente</div>
              <div className="card">
                <div className="grid-3">
                  <div className="field">
                    <label>Nombre del docente</label>
                    <input
                      type="text"
                      value={nombreDocente}
                      onChange={(e) => setNombreDocente(e.target.value)}
                      placeholder="Ej: María González López"
                    />
                  </div>
                  <div className="field">
                    <label>Nombre de la escuela</label>
                    <input
                      type="text"
                      value={nombreEscuela}
                      onChange={(e) => setNombreEscuela(e.target.value)}
                      placeholder="Ej: Primaria Benito Juárez"
                    />
                  </div>
                  <div className="field">
                    <label>Periodo planeado</label>
                    <input
                      type="text"
                      value={periodoPlaneado}
                      onChange={(e) => setPeriodoPlaneado(e.target.value)}
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
                    <select value={nivel} onChange={(e) => setNivel(e.target.value as NivelEdu)}>
                      {NIVELES_EDU.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Grado</label>
                    <select value={grado} onChange={(e) => setGrado(e.target.value)}>
                      {gradosDisponibles.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Modalidad</label>
                    <div className="toggle-group">
                      <button type="button" data-active={modalidad === "secuencial"} onClick={() => setModalidad("secuencial")}>
                        Secuencial
                      </button>
                      <button type="button" data-active={modalidad === "proyecto"} onClick={() => setModalidad("proyecto")}>
                        Proyecto
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid-4">
                  <div className="field span-2">
                    <label>{modalidad === "proyecto" ? "Campos formativos (varios)" : "Campo formativo"}</label>
                    {modalidad === "secuencial" ? (
                      <select value={campo} onChange={(e) => setCampo(e.target.value)}>
                        <option value="">Selecciona un campo</option>
                        {camposFiltrados.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="select-display"
                          data-empty={camposProyecto.length === 0}
                          onClick={() => setCamposOpen((v) => !v)}
                        >
                          {camposProyecto.length === 0
                            ? "Selecciona campos"
                            : `${camposProyecto.length} de ${camposFiltrados.length} campos`}
                        </button>
                        {camposOpen ? (
                          <div className="select-panel">
                            <div className="select-toolbar">
                              <button type="button" onClick={() => setCamposProyecto([...camposFiltrados])}>
                                Todos
                              </button>
                              <button type="button" onClick={() => setCamposProyecto([])}>
                                Ninguno
                              </button>
                            </div>
                            <div className="cascade-list">
                              {camposFiltrados.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className="ni-item"
                                  data-active={camposProyecto.includes(c)}
                                  onClick={() => setCamposProyecto((prev) => toggle(prev, c))}
                                >
                                  <span className="ni-check" />
                                  <span className="ni-item-text">
                                    <span className="ni-item-title">{c}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="field">
                    <label>Sesiones</label>
                    <div className="number-input">
                      <button type="button" className="num-btn left" onClick={() => setSesiones((v) => clamp(v - 1, 1, 20))} aria-label="Menos sesiones">
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={sesiones}
                        onChange={(e) => setSesiones(clamp(Number(e.target.value), 1, 20))}
                      />
                      <button type="button" className="num-btn right" onClick={() => setSesiones((v) => clamp(v + 1, 1, 20))} aria-label="Más sesiones">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="field">
                    <label>Duración (min)</label>
                    <div className="number-input">
                      <button type="button" className="num-btn left" onClick={() => setDuracion((v) => clamp(v - 5, 30, 240))} aria-label="Menos minutos">
                        −
                      </button>
                      <input
                        type="number"
                        min={30}
                        max={240}
                        step={5}
                        value={duracion}
                        onChange={(e) => setDuracion(clamp(Number(e.target.value), 30, 240))}
                      />
                      <button type="button" className="num-btn right" onClick={() => setDuracion((v) => clamp(v + 5, 30, 240))} aria-label="Más minutos">
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
                  disabled={contenidosTotal === 0}
                >
                  {contenidosTotal === 0
                    ? "Selecciona un campo formativo primero"
                    : `Seleccionados: ${contenidosSel.length} de ${contenidosTotal}`}
                </button>

                {contenidosOpen && contenidosTotal > 0 ? (
                  <div className="select-panel">
                    {!campoUnico ? (
                      <div className="select-toolbar">
                        <button type="button" onClick={todosContenidos}>
                          Todos
                        </button>
                        <button type="button" onClick={() => setContenidosSel([])}>
                          Ninguno
                        </button>
                      </div>
                    ) : null}
                    <div className="cascade-list">
                      {camposActivos.map((c) => {
                        const lista = contenidosPorCampo[c] ?? [];
                        if (lista.length === 0) return null;
                        return (
                          <div className="cascade-group" key={c}>
                            {camposActivos.length > 1 ? <strong>{c}</strong> : null}
                            {lista.map((ct) => (
                              <button
                                key={ct.id}
                                type="button"
                                className="ni-item"
                                data-active={contenidosSel.includes(keyOf(c, ct.titulo))}
                                onClick={() => toggleContenido(c, ct.titulo)}
                              >
                                <span className="ni-check" />
                                <span className="ni-item-text">
                                  <span className="ni-item-title">{ct.titulo}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <p className="hint">
                  {campoUnico ? "Selecciona UN contenido." : "Selecciona uno o varios contenidos."} Los PDA se cargan
                  según los contenidos elegidos.
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
                      <div className="select-toolbar">
                        <button type="button" onClick={() => setPdaSel([...pdaDisponibles])}>
                          Todos
                        </button>
                        <button type="button" onClick={() => setPdaSel([])}>
                          Ninguno
                        </button>
                      </div>
                      <div className="cascade-list">
                        {pdaDisponibles.map((pda, index) => (
                          <button
                            key={`${index}-${pda.slice(0, 24)}`}
                            type="button"
                            className="ni-item"
                            data-active={pdaSel.includes(pda)}
                            onClick={() => setPdaSel((prev) => toggle(prev, pda))}
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
                      data-active={estrategias.includes(estrategia)}
                      onClick={() => setEstrategias((prev) => toggle(prev, estrategia))}
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
                    value={proyecto}
                    onChange={(e) => setProyecto(e.target.value)}
                    placeholder="Describe la idea o proyecto central que guiará el aprendizaje del grupo..."
                  />
                </div>
                <div className="field" style={{ marginBottom: 14 }}>
                  <label>
                    Contexto del grupo <span style={{ color: "#45426A" }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={contextoGrupo}
                    onChange={(e) => setContextoGrupo(e.target.value)}
                    placeholder="Tamaño del grupo, dinámica, entorno..."
                  />
                </div>
                <div className="field">
                  <label>
                    Recursos y materiales disponibles <span style={{ color: "#45426A" }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={materialesDisponibles}
                    onChange={(e) => setMaterialesDisponibles(e.target.value)}
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
                    {niActiva ? <span className="ni-badge">Activo</span> : null}
                    <label className="switch">
                      <input type="checkbox" checked={niActiva} onChange={(e) => setNiActiva(e.target.checked)} />
                      <span className="switch-slider" />
                    </label>
                  </div>
                </div>

                {niActiva ? (
                  <div className="ni-panel">
                    <p className="ni-desc">
                      Selecciona las condiciones presentes en tu grupo. La planeación incluirá estrategias y
                      adaptaciones específicas para cada una.
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
                          onChange={(e) => setOtraDescripcion(e.target.value)}
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
                            data-active={nivelDetalle === n.value}
                            onClick={() => setNivelDetalle(n.value)}
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
                {error ? <p className="alert">{error}</p> : null}
                {needLogin ? (
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                  >
                    <LogIn size={16} />
                    Iniciar sesión con Google
                  </button>
                ) : null}
                {upgrade ? (
                  <a className="button secondary" href="/cuenta">
                    Activar membresía
                  </a>
                ) : null}
                <button className="btn-generate" type="button" onClick={generar} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                  {loading ? "Generando…" : "Generar Planeación"}
                </button>
                <button className="button secondary" type="button" onClick={cargarEjemplo}>
                  <FileText size={16} />
                  Ver ejemplo
                </button>
                <p className="cta-note">
                  Los recuadros de salida son editables. Puedes copiar cada sección o descargar la planeación.
                </p>
              </div>
                </section>
                <PlanningSidePanel
                  nombreDocente={nombreDocente || userName}
                  nombreEscuela={nombreEscuela}
                  periodoPlaneado={periodoPlaneado}
                  nivel={nivel}
                  grado={grado}
                  fase={buildFase(nivel, grado)}
                  sesiones={sesiones}
                  duracion={duracion}
                  onPreview={() => go("preview")}
                />
              </div>
            </div>
          ) : null}

          {tab === "planeacion" ? (
            <PlaneacionView
              draft={draft}
              sesiones={sesiones}
              duracion={duracion}
              modalidad={modalidad}
              onGo={go}
              onDemo={cargarEjemplo}
            />
          ) : null}

          {tab === "materiales" ? (
            <MaterialesView draft={draft} materiales={materialesData} onGo={go} onDemo={cargarEjemplo} />
          ) : null}

          {tab === "preview" ? (
            <PreviewView
              draft={draft}
              setDraft={setDraft}
              status={previewStatus}
              copied={copied}
              onSave={savePreview}
              onCopy={copyContent}
              onPrint={printContent}
              onDownloadTxt={downloadTxt}
              onDownloadWord={downloadWord}
              onDrive={exportToDrive}
              driveLoading={driveLoading}
              driveUrl={driveUrl}
              onGo={go}
              onDemo={cargarEjemplo}
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

function PlanningSidePanel({
  nombreDocente,
  nombreEscuela,
  periodoPlaneado,
  nivel,
  grado,
  fase,
  sesiones,
  duracion,
  onPreview,
}: {
  nombreDocente: string;
  nombreEscuela: string;
  periodoPlaneado: string;
  nivel: NivelEdu;
  grado: string;
  fase: string;
  sesiones: number;
  duracion: number;
  onPreview: () => void;
}) {
  const includedItems: { icon: LucideIcon; label: string }[] = [
    { icon: Clock, label: "Sesiones completas con tiempos" },
    { icon: MessageSquare, label: "Preguntas detonadoras y guion docente" },
    { icon: FileText, label: "Materiales complementarios" },
    { icon: Award, label: "Rúbrica o lista de cotejo" },
    { icon: Users, label: "Adaptaciones neurodivergentes" },
    { icon: HeartHandshake, label: "Guía para entender conductas y apoyar al alumno" },
  ];

  return (
    <aside className="teacher-side-panel">
      <section className="side-card">
        <h2>Tu planeación incluirá</h2>
        <div className="included-list">
          {includedItems.map((item) => {
            const Icon = item.icon;
            return (
              <div className="included-item" key={item.label}>
                <span>
                  <Icon size={21} />
                </span>
                <p>{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="side-card">
        <h2>Mini vista previa</h2>
        <div className="mini-preview">
          <div className="mini-preview-head">
            <div>
              <Image src="/images/logo-alianza-indigo.png" alt="" width={26} height={26} />
              <strong>ADIA</strong>
            </div>
            <span>{periodoPlaneado || "Bloque 1"}</span>
          </div>
          <h3>PLANEACIÓN DIDÁCTICA - {nivel} {grado.replace(/\D/g, "") || "3"}</h3>
          <div className="mini-table">
            <span>Docente</span>
            <strong>{nombreDocente || "Docente"}</strong>
            <span>Escuela</span>
            <strong>{nombreEscuela || "Escuela"}</strong>
            <span>Sesiones</span>
            <strong>{sesiones} de {duracion} min</strong>
            <span>Fase</span>
            <strong>{fase}</strong>
          </div>
          <div className="mini-lines">
            <i />
            <i />
            <i />
          </div>
        </div>
        <button className="button secondary side-preview-button" type="button" onClick={onPreview}>
          <Eye size={17} />
          Ver vista previa completa
          <ExternalLink size={14} />
        </button>
      </section>
    </aside>
  );
}

// ─────────────────────────── Planeación ───────────────────────────
function PlaneacionView({
  draft,
  sesiones,
  duracion,
  modalidad,
  onGo,
  onDemo,
}: {
  draft: { title: string; content: string } | null;
  sesiones: number;
  duracion: number;
  modalidad: "secuencial" | "proyecto";
  onGo: (tab: Tab) => void;
  onDemo: () => void;
}) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Aún no hay planeación"
          text="Genera una planeación desde la pestaña Generación, o carga un ejemplo para revisar el diseño."
          onGo={onGo}
          onDemo={onDemo}
        />
      </div>
    );
  }

  // Excluir el apéndice "MATERIALES POR SESION" para no duplicar las tarjetas
  // de sesión (los materiales viven en su propia pestaña).
  const idxMateriales = draft.content.indexOf("\nMATERIALES POR SESION\n");
  const planContent = idxMateriales >= 0 ? draft.content.slice(0, idxMateriales) : draft.content;
  const parsed = parseSesiones(planContent);

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
          <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(planContent) }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Materiales ───────────────────────────
function MaterialCard({ item }: { item: MaterialItem }) {
  const dest = item.para === "alumno" ? "Alumno" : "Docente";
  return (
    <div className="material-card">
      <div className="material-icon">
        <Package size={18} />
      </div>
      <div className="material-body">
        <div className="material-title">
          <span className="tag neutral" style={{ marginRight: 8 }}>
            {dest}
          </span>
          {item.nombre}
          {item.cantidad ? <span className="material-tag" style={{ marginLeft: 8 }}>{item.cantidad}</span> : null}
        </div>
        {item.contenido ? (
          esUrl(item.contenido) ? (
            <a className="material-desc" href={item.contenido} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              {item.contenido}
            </a>
          ) : (
            <div className="material-desc" style={{ whiteSpace: "pre-wrap" }}>
              {item.contenido}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function MaterialesView({
  draft,
  materiales,
  onGo,
  onDemo,
}: {
  draft: { content: string } | null;
  materiales: MaterialesData | null;
  onGo: (tab: Tab) => void;
  onDemo: () => void;
}) {
  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Aún no hay materiales"
          text="Cuando generes una planeación, los materiales y recursos sugeridos aparecerán aquí."
          onGo={onGo}
          onDemo={onDemo}
        />
      </div>
    );
  }

  // Primario: materiales estructurados (bloque JSON del modelo).
  if (materiales && materiales.sesiones.length > 0) {
    return (
      <div className="page-inner wide">
        {materiales.sesiones.map((sesion, i) => {
          const docente = (sesion.materiales ?? []).filter((m) => m.para !== "alumno");
          const alumno = (sesion.materiales ?? []).filter((m) => m.para === "alumno");
          return (
            <div key={i}>
              <div className="section-label">
                Sesión {sesion.sesion ?? i + 1}
                {sesion.titulo ? ` · ${sesion.titulo}` : ""}
              </div>
              {docente.length > 0 ? <div className="fase-label">Para el docente</div> : null}
              {docente.map((m, j) => (
                <MaterialCard item={m} key={`d-${j}`} />
              ))}
              {alumno.length > 0 ? <div className="fase-label">Para los estudiantes</div> : null}
              {alumno.map((m, j) => (
                <MaterialCard item={m} key={`a-${j}`} />
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Respaldo: parseo del texto (por si el bloque JSON no vino).
  const porSesion = materialesPorSesion(draft.content);
  const generales = materialesGenerales(draft.content);

  if (porSesion.length === 0 && generales.length === 0) {
    return (
      <div className="page-inner wide">
        <div className="card">
          <p className="hint" style={{ marginTop: 0 }}>
            La planeación no incluyó materiales detectables. Revísalos en{" "}
            <strong style={{ color: "var(--text)" }}>Planeación</strong> o en{" "}
            <strong style={{ color: "var(--text)" }}>Preview</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner wide">
      {porSesion.map((sesion) => (
        <div key={sesion.sesion}>
          <div className="section-label">
            Sesión {sesion.sesion}
            {sesion.titulo ? ` · ${sesion.titulo.replace(/^SESION\s*\d+:?\s*/i, "")}` : ""}
          </div>
          {sesion.grupos.map((grupo, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>
              {grupo.grupo !== "Materiales" ? <div className="fase-label">{grupo.grupo}</div> : null}
              {grupo.items.map((material, index) => {
                const { titulo, desc } = partirMaterial(material);
                return (
                  <div className="material-card" key={index}>
                    <div className="material-icon">
                      <Package size={18} />
                    </div>
                    <div className="material-body">
                      <div className="material-title">{titulo}</div>
                      {desc ? <div className="material-desc">{desc}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}

      {generales.length > 0 ? (
        <>
          <div className="section-label">Materiales generales y apéndice</div>
          {generales.map((material, index) => {
            const { titulo, desc } = partirMaterial(material);
            return (
              <div className="material-card" key={index}>
                <div className="material-icon">
                  <Package size={18} />
                </div>
                <div className="material-body">
                  <div className="material-title">{titulo}</div>
                  {desc ? <div className="material-desc">{desc}</div> : null}
                </div>
              </div>
            );
          })}
        </>
      ) : null}
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
  onDownloadTxt,
  onDownloadWord,
  onDrive,
  driveLoading,
  driveUrl,
  onGo,
  onDemo,
}: {
  draft: { id: string; title: string; content: string } | null;
  setDraft: (d: { id: string; title: string; content: string }) => void;
  status: string;
  copied: boolean;
  onSave: () => void;
  onCopy: () => void;
  onPrint: () => void;
  onDownloadTxt: () => void;
  onDownloadWord: () => void;
  onDrive: () => void;
  driveLoading: boolean;
  driveUrl: string | null;
  onGo: (tab: Tab) => void;
  onDemo: () => void;
}) {
  if (!draft) {
    return (
      <div className="page-inner wide">
        <EmptyState
          title="Sin contenido para previsualizar"
          text="La planeación generada aparecerá aquí como texto editable. Genera una o carga un ejemplo."
          onGo={onGo}
          onDemo={onDemo}
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
          <button className="btn-icon-sm" type="button" onClick={onDownloadTxt}>
            <Download size={13} />
            TXT
          </button>
          <button className="btn-icon-sm" type="button" onClick={onDownloadWord}>
            <Download size={13} />
            Word
          </button>
          <button className="btn-icon-sm primary" type="button" onClick={onDrive} disabled={driveLoading}>
            {driveLoading ? <Loader2 size={13} className="spin" /> : <UploadCloud size={13} />}
            {driveLoading ? "Enviando…" : "Drive"}
          </button>
        </div>
      </div>
      {status ? (
        <p className="hint" style={{ marginBottom: 8 }}>
          {status}
          {driveUrl ? (
            <>
              {" "}
              <a href={driveUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                Abrir en Drive ↗
              </a>
            </>
          ) : null}
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

function EmptyState({
  title,
  text,
  onGo,
  onDemo,
}: {
  title: string;
  text: string;
  onGo: (tab: Tab) => void;
  onDemo?: () => void;
}) {
  return (
    <div className="empty-state">
      <AlertTriangle size={40} />
      <h3>{title}</h3>
      <p>{text}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
        <button className="button primary" type="button" onClick={() => onGo("generacion")}>
          <Sparkles size={16} />
          Ir a Generación
        </button>
        {onDemo ? (
          <button className="button secondary" type="button" onClick={onDemo}>
            <FileText size={16} />
            Ver ejemplo
          </button>
        ) : null}
      </div>
    </div>
  );
}
