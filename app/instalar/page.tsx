import { ArrowRight, Bell, CheckCircle2, MoreVertical, Plus, Share, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import "./instalar.css";

export const metadata: Metadata = {
  title: "Instala ADIA en tu teléfono",
  description: "Guía rápida para instalar ADIA como app en Android e iPhone en 2 pasos.",
};

export default function InstalarPage() {
  return (
    <main className="install">
      <div className="install-inner">
        <header className="install-head">
          <Image
            src="/images/logo-alianza-indigo.png"
            alt="ADIA"
            width={72}
            height={72}
            className="install-logo"
          />
          <h1>Instala ADIA en tu teléfono</h1>
          <p>
            Tenla como app, con su propio ícono y a pantalla completa. Sin abrir el navegador cada vez. Toma 30
            segundos.
          </p>
        </header>

        <div className="install-grid">
          {/* Android */}
          <section className="install-card">
            <div className="install-card-head">
              <span className="install-card-icon">
                <Smartphone size={22} />
              </span>
              <h2>Android</h2>
            </div>
            <ol className="install-steps">
              <li className="install-step">
                <span className="install-step-num">1</span>
                <span className="install-step-text">
                  Abre <strong>planeaciones.mx</strong> en <strong>Chrome</strong>.
                </span>
              </li>
              <li className="install-step">
                <span className="install-step-num">2</span>
                <span className="install-step-text">
                  Toca el menú <MoreVertical size={16} className="ic" /> (arriba a la derecha) y elige{" "}
                  <strong>“Instalar app”</strong> o <strong>“Agregar a pantalla principal”</strong>.
                </span>
              </li>
              <li className="install-step">
                <span className="install-step-num">3</span>
                <span className="install-step-text">
                  <CheckCircle2 size={16} className="ic" /> Listo: el ícono de ADIA aparece junto a tus apps.
                </span>
              </li>
            </ol>
          </section>

          {/* iPhone */}
          <section className="install-card">
            <div className="install-card-head">
              <span className="install-card-icon">
                <Smartphone size={22} />
              </span>
              <h2>iPhone / iPad</h2>
            </div>
            <ol className="install-steps">
              <li className="install-step">
                <span className="install-step-num">1</span>
                <span className="install-step-text">
                  Abre <strong>planeaciones.mx</strong> en <strong>Safari</strong> (no Chrome).
                </span>
              </li>
              <li className="install-step">
                <span className="install-step-num">2</span>
                <span className="install-step-text">
                  Toca el botón <strong>Compartir</strong> <Share size={16} className="ic" /> (abajo, el cuadro con
                  flecha hacia arriba).
                </span>
              </li>
              <li className="install-step">
                <span className="install-step-num">3</span>
                <span className="install-step-text">
                  Baja y elige <strong>“Agregar a inicio”</strong> <Plus size={16} className="ic" />, luego{" "}
                  <strong>“Agregar”</strong>.
                </span>
              </li>
              <li className="install-step">
                <span className="install-step-num">4</span>
                <span className="install-step-text">
                  <CheckCircle2 size={16} className="ic" /> Listo: ADIA queda en tu pantalla de inicio.
                </span>
              </li>
            </ol>
          </section>
        </div>

        <div className="install-note">
          <Bell size={20} />
          <span>
            <strong>Notificaciones:</strong> una vez instalada, inicia sesión y toca{" "}
            <strong>“Activar notificaciones”</strong> para recibir avisos. En iPhone es necesario instalar la app
            primero; en Android funcionan también desde el navegador.
          </span>
        </div>

        <div className="install-cta">
          <Link href="/planner">
            Abrir ADIA <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}
