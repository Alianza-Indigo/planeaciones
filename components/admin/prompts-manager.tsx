"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminPrompt = {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
};

export function PromptsManager({ prompts }: { prompts: AdminPrompt[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function crear() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name || undefined, body: body || undefined, notes: notes || undefined }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage("No se pudo crear la versión.");
      return;
    }
    setName("");
    setBody("");
    setNotes("");
    setShowForm(false);
    router.refresh();
  }

  async function activar(id: string) {
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/prompts/${id}/activate`, { method: "POST" });
    setBusy(false);
    if (!response.ok) {
      setMessage("No se pudo activar la versión.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="admin-toolbar">
        <button className="button primary sm" type="button" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} />
          {showForm ? "Cancelar" : "Nueva versión"}
        </button>
        {message ? <span className="tag missing">{message}</span> : null}
      </div>

      {showForm ? (
        <section className="panel" style={{ marginBottom: 12 }}>
          <div className="admin-form">
            <div className="field">
              <label>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prompt de planeación"
              />
            </div>
            <div className="field">
              <label>Cuerpo del prompt</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Si lo dejas vacío se usa el prompt maestro por defecto del sistema."
                style={{ minHeight: 180 }}
              />
            </div>
            <div className="field">
              <label>Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Qué cambia en esta versión"
              />
            </div>
            <div>
              <button className="button primary sm" type="button" onClick={crear} disabled={busy}>
                {busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
                Guardar versión
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        {prompts.length === 0 ? (
          <div className="empty">Aún no hay prompts guardados. Se usa el fallback del código.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Notas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td>{prompt.name}</td>
                  <td>v{prompt.version}</td>
                  <td>
                    {prompt.isActive ? (
                      <span className="tag ok">Activo</span>
                    ) : (
                      <span className="tag neutral">Inactivo</span>
                    )}
                  </td>
                  <td>{prompt.notes ?? "-"}</td>
                  <td style={{ textAlign: "right" }}>
                    {prompt.isActive ? null : (
                      <button className="button secondary sm" type="button" onClick={() => activar(prompt.id)} disabled={busy}>
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
