import { LoginActions } from "@/components/login-actions";

export default function LoginPage() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo-mark">AI</div>
        <div className="header-text">
          <h1>ADIA</h1>
          <p>Alianza Índigo Neurodivergente A.C.</p>
        </div>
        <span className="badge">NEM 2025</span>
      </header>

      <main className="main">
        <div className="page-inner">
          <div className="intro">
            <h2>
              Acceso
              <br />
              <span>docente</span>
            </h2>
            <p>
              Inicia sesión con Google para generar planeaciones. El permiso de Drive permite enviar el archivo final a
              tu unidad.
            </p>
          </div>

          <div className="section-label">Entrar</div>
          <div className="card">
            <LoginActions />
          </div>

          <div className="section-label">Privacidad</div>
          <div className="card">
            <p className="hint" style={{ marginTop: 0 }}>
              <strong style={{ color: "var(--text)" }}>Datos que se guardan:</strong> nombre, correo, membresía, pagos,
              conteo de generaciones y planeaciones temporales mientras se exportan.
            </p>
            <p className="hint">
              <strong style={{ color: "var(--text)" }}>Datos que no se conservan:</strong> la planeación completa
              después de expirar el borrador temporal.
            </p>
          </div>
        </div>
      </main>

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
