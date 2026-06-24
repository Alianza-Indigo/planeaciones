"use client";

import { AlertTriangle, Download, Save, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Draft = {
  id: string;
  title: string;
  content: string;
  exportedDocUrl?: string | null;
  expiresAt?: string | null;
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

  // Conteo de palabras y páginas estimadas (~300 palabras por página).
  const { palabras, paginas } = useMemo(() => {
    const count = draft?.content.trim() ? draft.content.trim().split(/\s+/).length : 0;
    return { palabras: count, paginas: Math.max(1, Math.ceil(count / 300)) };
  }, [draft?.content]);

  // Aviso si el borrador expira en menos de 2 horas.
  const expiraPronto = useMemo(() => {
    if (!draft?.expiresAt) return false;
    const expiresAt = new Date(draft.expiresAt).getTime();
    return expiresAt - Date.now() < 2 * 60 * 60 * 1000;
  }, [draft?.expiresAt]);

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

  function downloadMarkdown() {
    if (!draft) return;
    const blob = new Blob([draft.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
          <button className="button secondary" type="button" onClick={downloadMarkdown}>
            <Download size={17} />
            Descargar
          </button>
          <button className="button primary" type="button" onClick={exportToDrive}>
            <UploadCloud size={17} />
            Drive
          </button>
        </div>
      </div>
      {expiraPronto ? (
        <p className="badge" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}>
          <AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Este borrador expira pronto.
          Expórtalo a Drive o descárgalo para conservarlo.
        </p>
      ) : null}
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
      <span className="badge">
        ~{palabras} palabras · {paginas} {paginas === 1 ? "página estimada" : "páginas estimadas"}
      </span>
    </div>
  );
}
