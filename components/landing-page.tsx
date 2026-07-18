import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Facebook,
  GraduationCap,
  Instagram,
  Mail,
  Play,
  ShieldCheck,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import "@/app/landing.css";

const NAV = [
  { label: "Inicio", href: "#top" },
  { label: "Cómo funciona", href: "#comparativa" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
  { label: "Contacto", href: "#contacto" },
];

const FEATURES = [
  { icon: ClipboardList, t: "Planeaciones autoejecutables", d: "Todo lo que necesitas para enseñar con confianza y claridad." },
  { icon: Users, t: "Inclusión neurodivergente", d: "Estrategias y adaptaciones integradas para todos tus estudiantes." },
  { icon: BookOpen, t: "Materiales y evaluación", d: "Recursos listos para usar y evaluación alineada al aprendizaje." },
  { icon: GraduationCap, t: "Guía para el docente", d: "Explicaciones paso a paso que te acompañan en cada decisión pedagógica." },
  { icon: ShieldCheck, t: "Alineación NEM", d: "100% alineado al marco curricular de la Nueva Escuela Mexicana." },
  { icon: Zap, t: "Ahorro de tiempo", d: "Planea en minutos lo que antes te tomaba horas o días." },
];

const SIN_ADIA = [
  "Solo generan contenido",
  "Sin enfoque en inclusión",
  "Materiales genéricos",
  "Sin guía para el docente",
  "Más tiempo, más estrés",
];

const CON_ADIA = [
  "Planeaciones completas y alineadas al NEM",
  "Inclusión neurodivergente integrada",
  "Materiales y evaluación listos para usar",
  "Guía práctica para el docente en cada paso",
  "Ahorra tiempo y enseña con confianza",
];

const TESTIMONIOS = [
  {
    iniciales: "MF",
    texto:
      "ADIA cambió mi forma de planear. Ahora tengo todo lo que necesito en un solo lugar y mis estudiantes participan más.",
    nombre: "María Fernanda G.",
    rol: "Docente de primaria",
  },
  {
    iniciales: "JL",
    texto:
      "La inclusión neurodivergente de ADIA es real y práctica. Me da estrategias claras para apoyar a cada estudiante.",
    nombre: "Jorge Luis R.",
    rol: "Docente de secundaria",
  },
  {
    iniciales: "CM",
    texto:
      "Como coordinadora, recomiendo ADIA a todo nuestro equipo. Ahorra tiempo y eleva la calidad de nuestras planeaciones.",
    nombre: "Claudia M.",
    rol: "Coordinadora académica",
  },
];

const LOGOS = [
  { big: "SEP", small: "Secretaría de Educación Pública" },
  { big: "NEM", small: "Nueva Escuela Mexicana" },
  { big: "Red de Colegios", small: "Alianza Índigo" },
];

const PLAN_DOCENTE = [
  "Planeaciones completas alineadas al NEM",
  "Materiales y evaluación listos para usar",
  "Inclusión neurodivergente integrada",
  "Guía práctica para el docente",
  "Historial y edición de planeaciones",
  "Actualizaciones constantes",
];

const PLAN_ESCUELA = [
  "Panel de administración para directivos",
  "Reportes de uso y avances",
  "Capacitación y acompañamiento",
  "Gestión docente y grupos",
  "Soporte prioritario",
];

export function LandingPage({
  precioMensual = "$99",
  precioAnual = "$990",
}: {
  precioMensual?: string;
  precioAnual?: string;
}) {
  return (
    <div className="lp" id="top">
      {/* Header */}
      <header className="lp-header">
        <div className="lp-container lp-nav">
          <div className="lp-brand">
            <span className="lp-logo">
              <Image src="/images/logo-alianza-indigo.png" alt="" width={34} height={34} priority />
            </span>
            <span>
              <span className="lp-brand-name">ADIA</span>
              <span className="lp-brand-sub">Asistente Docente de Inteligencia Artificial</span>
            </span>
          </div>
          <nav className="lp-menu">
            {NAV.map((n) => (
              <a key={n.label} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-primary" href="/login">
              Ingresar <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div>
            <span className="lp-badge">Creada por docentes, para docentes 💜</span>
            <h1 className="lp-h1">
              La plataforma educativa más avanzada para crear planeaciones <span className="lp-grad">inclusivas</span>
            </h1>
            <p className="lp-lead">
              ADIA genera planeaciones completas alineadas al NEM con guion docente, materiales, evaluación e inclusión
              neurodivergente integrada.
            </p>
            <div className="lp-hero-cta">
              <Link className="lp-btn lp-btn-primary" href="/planner">
                Crear mi planeación <ArrowRight size={17} />
              </Link>
              <Link className="lp-btn lp-btn-outline" href="/planner">
                <Play size={16} /> Ver ejemplo
              </Link>
            </div>
            <div className="lp-metrics">
              <div className="lp-metric">
                <span className="lp-metric-icon">
                  <Users size={18} />
                </span>
                <span>
                  <strong>+20,000</strong>
                  <span>Docentes confían en ADIA</span>
                </span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-icon">
                  <Star size={18} />
                </span>
                <span>
                  <strong>4.9/5</strong>
                  <span>Calificación de los docentes</span>
                </span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-icon">
                  <ShieldCheck size={18} />
                </span>
                <span>
                  <strong>100% Seguro</strong>
                  <span>Tus datos están protegidos</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lp-hero-art">
            <div className="lp-glow-ring" />
            <Image
              className="lp-laptop-image"
              src="/images/lap-land.png"
              alt="Vista de ADIA en una laptop con interfaz de generación de planeaciones"
              width={1448}
              height={1086}
              priority
              sizes="(max-width: 980px) 100vw, 58vw"
            />
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="lp-section" id="beneficios" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <div className="lp-features">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div className="lp-feature" key={f.t}>
                  <span className="lp-feature-icon">
                    <Icon size={22} />
                  </span>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="lp-section lp-compare" id="comparativa">
        <div className="lp-container lp-compare-grid">
          <div>
            <h2>
              ADIA no solo genera una planeación. <span className="lp-grad">Te enseña a acompañar mejor a tus estudiantes.</span>
            </h2>
            <p>
              Cada elemento de tu planeación incluye orientaciones prácticas para comprender, adaptar y potenciar el
              aprendizaje de todos.
            </p>
            <Link className="lp-btn lp-btn-primary" href="/planner">
              Descubre cómo funciona <ArrowRight size={17} />
            </Link>
          </div>
          <div className="lp-vs">
            <div className="lp-vs-badge">VS</div>
            <div className="lp-vs-box bad">
              <h4>Otras herramientas</h4>
              <div className="lp-vs-list">
                {SIN_ADIA.map((item) => (
                  <div className="lp-vs-item" key={item}>
                    <X size={17} className="lp-x" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-vs-box good">
              <h4>Con ADIA</h4>
              <div className="lp-vs-list">
                {CON_ADIA.map((item) => (
                  <div className="lp-vs-item good" key={item}>
                    <Check size={17} className="lp-check" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="lp-section">
        <div className="lp-container">
          <h2 className="lp-section-title">
            Docentes que ya transforman su práctica con <span className="lp-grad">ADIA</span>
          </h2>
          <div className="lp-tcards">
            {TESTIMONIOS.map((t) => (
              <div className="lp-tcard" key={t.nombre}>
                <div className="lp-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>“{t.texto}”</p>
                <div className="lp-person">
                  <span className="lp-avatar">{t.iniciales}</span>
                  <span>
                    <b>{t.nombre}</b>
                    <span>{t.rol}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-logos">
            {LOGOS.map((l) => (
              <div className="lp-logo-item" key={l.big}>
                {l.big}
                {l.small ? <small>{l.small}</small> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="lp-section lp-pricing" id="precios">
        <div className="lp-container">
          <h2 className="lp-section-title">Planes pensados para docentes e instituciones</h2>
          <div className="lp-plans">
            <div className="lp-plan featured">
              <span className="lp-plan-badge">Más popular</span>
              <h3>Plan Docente</h3>
              <p className="lp-plan-desc">Todo lo que necesitas para planear mejor cada día.</p>
              <div className="lp-price">
                {precioMensual} <small>MXN / mes</small>
              </div>
              <div className="lp-price-alt">o {precioAnual} MXN / año</div>
              <div className="lp-plan-list">
                {PLAN_DOCENTE.map((item) => (
                  <div className="lp-vs-item good" key={item}>
                    <Check size={17} className="lp-check" />
                    {item}
                  </div>
                ))}
              </div>
              <Link className="lp-btn lp-btn-primary" href="/planner">
                Comenzar ahora <ArrowRight size={17} />
              </Link>
              <p className="lp-plan-note">Pago 100% seguro</p>
            </div>

            <div className="lp-plan">
              <h3>Plan Escuela</h3>
              <p className="lp-plan-desc">Para escuelas que quieren transformar la enseñanza en equipo.</p>
              <p className="lp-subhead">Todo lo del Plan Docente, más:</p>
              <div className="lp-plan-list">
                {PLAN_ESCUELA.map((item) => (
                  <div className="lp-vs-item good" key={item}>
                    <Check size={17} className="lp-check" />
                    {item}
                  </div>
                ))}
              </div>
              <a className="lp-btn lp-btn-outline" href="mailto:contacto@alianzaindigo.org">
                Conocer más
              </a>
              <p className="lp-plan-note">Ideal para instituciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-container">
          <div className="lp-cta">
            <div>
              <h2>Acompaña mejor a tus estudiantes con ADIA</h2>
              <p>
                Planear con propósito es enseñar con impacto. Únete a miles de docentes que ya están transformando la
                educación.
              </p>
            </div>
            <div className="lp-cta-right">
              <Link className="lp-btn lp-btn-white" href="/planner">
                Crear mi planeación ahora <ArrowRight size={17} />
              </Link>
              <span>Afíliate hoy, pruébalo sin costo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer" id="contacto">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-about">
              <div className="lp-brand">
                <span className="lp-logo">
                  <Image src="/images/logo-alianza-indigo.png" alt="" width={34} height={34} />
                </span>
                <span>
                  <span className="lp-brand-name" style={{ color: "#fff" }}>
                    ADIA
                  </span>
                  <span className="lp-brand-sub" style={{ color: "rgba(255,255,255,.6)" }}>
                    Alianza Índigo
                  </span>
                </span>
              </div>
              <p>
                La plataforma educativa más avanzada para crear planeaciones inclusivas y alineadas a la Nueva Escuela
                Mexicana.
              </p>
              <div className="lp-socials">
                <a href="#top" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="#top" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="mailto:contacto@alianzaindigo.org" aria-label="Correo">
                  <Mail size={16} />
                </a>
              </div>
            </div>

            <div>
              <h5>Producto</h5>
              <ul>
                <li><a href="#comparativa">Cómo funciona</a></li>
                <li><a href="#beneficios">Beneficios</a></li>
                <li><a href="#precios">Precios</a></li>
                <li><a href="#top">Actualizaciones</a></li>
              </ul>
            </div>

            <div>
              <h5>Recursos</h5>
              <ul>
                <li><a href="/instalar">Instalar la app</a></li>
                <li><a href="#top">Blog</a></li>
                <li><a href="#top">Guías</a></li>
                <li><a href="#top">Centro de ayuda</a></li>
                <li><a href="#top">Webinars</a></li>
              </ul>
            </div>

            <div>
              <h5>Empresa</h5>
              <ul>
                <li><a href="#top">Nosotros</a></li>
                <li><a href="mailto:contacto@alianzaindigo.org">Contacto</a></li>
                <li><a href="#top">Términos y privacidad</a></li>
              </ul>
            </div>

            <div>
              <h5>Suscríbete a nuestro boletín</h5>
              <p style={{ fontSize: 13, margin: "0 0 4px" }}>Recibe ideas, recursos y novedades.</p>
              <div className="lp-news">
                <input type="email" placeholder="contacto@alianzaindigo.org" aria-label="Correo electrónico" />
                <button type="button" aria-label="Suscribirse">
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">© 2026 Alianza Índigo. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
