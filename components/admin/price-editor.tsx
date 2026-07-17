"use client";

import { Save } from "lucide-react";
import { useState } from "react";

type Frequency = "monthly" | "annual";

export function PriceEditor({
  initialPesos,
  initialFrequency,
}: {
  initialPesos: number;
  initialFrequency: Frequency;
}) {
  const [pesos, setPesos] = useState(String(initialPesos));
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    const value = Number(pesos);
    if (!Number.isFinite(value) || value <= 0) {
      setMsg("Ingresa un precio válido.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/price", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pesos: value, frequency }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Guardado. Aplica a las nuevas suscripciones." : data.error ?? "No se pudo guardar.");
    } catch {
      setMsg("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const sufijo = frequency === "annual" ? "al año" : "al mes";

  return (
    <div>
      <div className="config-row">
        <div className="config-key">
          Frecuencia de cobro
          <span>Cada cuánto se cobra la suscripción</span>
        </div>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
      </div>
      <div className="config-row">
        <div className="config-key">
          Precio de la membresía
          <span>MXN {sufijo}, aplica a nuevas suscripciones</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>$</span>
          <input
            type="number"
            min={1}
            step={1}
            value={pesos}
            onChange={(e) => setPesos(e.target.value)}
            style={{ width: 110 }}
          />
        </div>
      </div>
      <button
        className="button primary"
        type="button"
        onClick={save}
        disabled={saving}
        style={{ marginTop: 12 }}
      >
        <Save size={16} /> {saving ? "Guardando…" : "Guardar"}
      </button>
      {msg ? <p style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>{msg}</p> : null}
    </div>
  );
}
