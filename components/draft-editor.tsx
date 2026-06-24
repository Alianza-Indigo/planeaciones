"use client";

import { Save, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

type Draft = {
  id: string;
  title: string;
  content: string;
  exportedDocUrl?: string | null;
};

export function DraftEditor({ draftId }: { draftId: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("Cargando draft...");

  useEffect(() => {
    fetch(`/api/drafts/${draftId}`)
      .then((response) => response.json())
      .then((payload) => {
        setDraft(payload);
        setStatus("");
      })
      .catch(() => setStatus("No se pudo cargar el draft."));
  }, [draftId]);

  async function save() {
    if (!draft) return;
    setStatus("Guardando cambios temporales...");
    await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: draft.title, content: draft.content }),
    });
    setStatus("Cambios guardados.");
  }

  async function exportToDrive() {
    if (!draft) return;
    setStatus("Enviando a Google Drive...");
    const response = await fetch("/api/drive/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ draftId: draft.id }),
    });
    const payload = await response.json();
    setStatus(response.ok ? "Exportado a Google Drive." : payload.error ?? "No se pudo exportar.");
    if (payload.url) {
      setDraft({ ...draft, exportedDocUrl: payload.url });
    }
  }

  if (!draft) {
    return <div className="empty">{status}</div>;
  }

  return (
    <div className="grid">
      <div className="pageHeader">
        <div>
          <span className="eyebrow">Draft temporal</span>
          <h1>{draft.title}</h1>
          <p>Editar, revisar y enviar al Drive del docente. El contenido no se conserva permanentemente.</p>
        </div>
        <div className="checks">
          <button className="button secondary" type="button" onClick={save}>
            <Save size={17} />
            Guardar
          </button>
          <button className="button primary" type="button" onClick={exportToDrive}>
            <UploadCloud size={17} />
            Drive
          </button>
        </div>
      </div>
      {status ? <span className="badge">{status}</span> : null}
      {draft.exportedDocUrl ? (
        <a className="badge" href={draft.exportedDocUrl} target="_blank" rel="noreferrer">
          Abrir archivo exportado
        </a>
      ) : null}
      <textarea
        className="editor"
        value={draft.content}
        onChange={(event) => setDraft({ ...draft, content: event.target.value })}
      />
    </div>
  );
}
