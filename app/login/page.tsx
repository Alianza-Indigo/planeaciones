import { AppShell } from "@/components/app-shell";
import { LoginActions } from "@/components/login-actions";

export default function LoginPage() {
  return (
    <AppShell>
      <div className="grid two">
        <section className="panel">
          <span className="eyebrow">Acceso docente</span>
          <h1>Entrar con Google</h1>
          <p>
            La cuenta se usa para identificar al docente y guardar nombre/correo. El permiso de Drive permite crear el
            archivo final en su unidad.
          </p>
          <LoginActions />
        </section>
        <section className="panel">
          <h2>Datos que sí se guardan</h2>
          <p>Nombre, correo, membresía, pagos, conteo de generaciones y drafts temporales mientras se exportan.</p>
          <h2>Datos que no se guardan permanentemente</h2>
          <p>La planeación completa después de expirar el draft temporal.</p>
        </section>
      </div>
    </AppShell>
  );
}
