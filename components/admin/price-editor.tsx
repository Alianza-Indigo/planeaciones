"use client";

import { Save } from "lucide-react";
import { useState } from "react";

export function PriceEditor({
  initialMonthly,
  initialAnnual,
}: {
  initialMonthly: number;
  initialAnnual: number;
}) {
  const [monthly, setMonthly] = useState(String(initialMonthly));
  const [annual, setAnnual] = useState(String(initialAnnual));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    const m = Number(monthly);
    const a = Number(annual);
    if (!Number.isFinite(m) || m < 10 || !Number.isFinite(a) || a < 10) {
      setMsg("Cada precio debe ser al menos $10 (mínimo de Mercado Pago).");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/price", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ monthlyPesos: m, annualPesos: a }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Guardado. Aplica a nuevas suscripciones." : data.error ?? "No se pudo guardar.");
    } catch {
      setMsg("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="hint" style={{ marginBottom: 12 }}>
        El docente podrá elegir plan mensual o anual. Define el precio de cada uno (mínimo $10 MXN).
      </p>
      <div className="config-row">
        <div className="config-key">
          Precio mensual
          <span>MXN al mes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>$</span>
          <input
            type="number"
            min={10}
            step={1}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            style={{ width: 110 }}
          />
        </div>
      </div>
      <div className="config-row">
        <div className="config-key">
          Precio anual
          <span>MXN al año</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700 }}>$</span>
          <input
            type="number"
            min={10}
            step={1}
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
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
