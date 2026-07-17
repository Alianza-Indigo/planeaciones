"use client";

import { useState } from "react";

export function CancelSubscription() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const cancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error ?? "No se pudo cancelar.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="hint">
        Suscripción cancelada. Conservas el acceso hasta el fin del periodo ya pagado.
      </p>
    );
  }

  if (!confirming) {
    return (
      <button
        className="button secondary"
        type="button"
        onClick={() => setConfirming(true)}
        style={{ fontSize: 13 }}
      >
        Cancelar suscripción
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p className="hint">¿Seguro? No se harán más cargos; mantienes el acceso hasta el fin del periodo.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="button secondary" type="button" onClick={cancel} disabled={loading}>
          {loading ? "Cancelando…" : "Sí, cancelar"}
        </button>
        <button className="button secondary" type="button" onClick={() => setConfirming(false)} disabled={loading}>
          No
        </button>
      </div>
      {error ? <p className="alert">{error}</p> : null}
    </div>
  );
}
