"use client";

import { AlertTriangle, Copy, Download, Printer, Save, UploadCloud } from "lucide-react";
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
  const [status, setStatus] = useState("Cargando planeación…");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/drafts/${draftId}`)
      .then((response) => response.json())
      .then((payload) => {
        setDraft(payload);
        setStatus("");
      })
      .catch(() => setStatus("No se pudo cargar la planeación."));
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
    setStatus("Guardando cambios…");
    await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: draft.title, content: draft.content }),
    });
    setStatus("Cambios guardados.");
  }

  async function exportToDrive() {
    if (!draft) return;
    setStatus("Enviando a Google Drive…");
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

  function copyContent() {
    if (!draft) return;
    navigator.clipboard.writeText(draft.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function printContent() {
    if (!draft) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const safe = draft.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    win.document.write(
      `<html><head><title>${draft.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.8;color:#111;white-space:pre-wrap;font-size:14px;}@media print{body{margin:20px;}}</style></head><body>${safe}</body></html>`,
    );
    win.document.close();
    win.print();
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
    return (
      <div className="empty-state">
        <h3>{status}</h3>
      </div>
    );
  }

  return (
    <>
      <div className="plan-header">
        <h2>{draft.title}</h2>
        <p>Edita la planeación generada. El contenido es temporal: expórtalo o descárgalo para conservarlo.</p>
        <div className="plan-meta">
          <span className="plan-tag">
            ~{palabras} palabras
          </span>
          <span className="plan-tag">
            {paginas} {paginas === 1 ? "página" : "páginas"} aprox.
          </span>
          {draft.exportedDocUrl ? (
            <a className="plan-tag" href={draft.exportedDocUrl} target="_blank" rel="noreferrer">
              Abrir en Drive ↗
            </a>
          ) : null}
        </div>
      </div>

      {expiraPronto ? (
        <p className="alert warn" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} />
          Esta planeación expira pronto. Expórtala a Drive o descárgala para conservarla.
        </p>
      ) : null}

      <div className="preview-toolbar">
        <h3>Planeación — Texto completo</h3>
        <div className="preview-actions">
          <button className="btn-icon-sm" type="button" onClick={save}>
            <Save size={13} />
            Guardar
          </button>
          <button className="btn-icon-sm" type="button" onClick={copyContent}>
            <Copy size={13} />
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button className="btn-icon-sm" type="button" onClick={printContent}>
            <Printer size={13} />
            Imprimir
          </button>
          <button className="btn-icon-sm" type="button" onClick={downloadMarkdown}>
            <Download size={13} />
            Descargar
          </button>
          <button className="btn-icon-sm primary" type="button" onClick={exportToDrive}>
            <UploadCloud size={13} />
            Drive
          </button>
        </div>
      </div>

      {status ? (
        <p className="hint" style={{ marginBottom: 8 }}>
          {status}
        </p>
      ) : null}

      <textarea
        className="preview-textarea"
        value={draft.content}
        onChange={(event) => setDraft({ ...draft, content: event.target.value })}
      />
    </>
  );
}
