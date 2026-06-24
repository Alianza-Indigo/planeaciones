import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PaymentButton } from "@/components/payment-button";

export default function AccountPage() {
  return (
    <AppShell>
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Cuenta</span>
          <h1>Membresía y uso</h1>
          <p>Panel base para mostrar plan, generaciones disponibles y acceso al checkout de Mercado Pago.</p>
        </div>
      </div>
      <div className="grid three">
        <section className="panel stat">
          <span className="badge">Plan</span>
          <strong>Free</strong>
          <p>Estado inicial hasta conectar Mercado Pago.</p>
        </section>
        <section className="panel stat">
          <span className="badge">Generaciones</span>
          <strong>3</strong>
          <p>Límite configurable desde la membresía.</p>
        </section>
        <section className="panel grid">
          <h2>Planeaciones Pro</h2>
          <p>Activar checkout mensual con Mercado Pago.</p>
          <PaymentButton />
          <button className="button secondary" type="button">
            <Sparkles size={17} />
            Generar ahora
          </button>
        </section>
      </div>
    </AppShell>
  );
}
