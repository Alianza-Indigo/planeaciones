"use client";

import { Send } from "lucide-react";
import { useState } from "react";

export function PushBroadcast() {
  const [title, setTitle] = useState("ADIA");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async () => {
    if (!body.trim()) {
      setResult("Escribe el mensaje.");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, url: url || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { enviadas?: number; error?: string };
      if (!res.ok) {
        setResult(data.error ?? "No se pudo enviar.");
      } else {
        setResult(`Enviada a ${data.enviadas ?? 0} dispositivo(s).`);
        setBody("");
      }
    } catch {
      setResult("Error de red.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 540 }}>
      <div className="field">
        <label>Título</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
      </div>
      <div className="field">
        <label>Mensaje</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Ej: Nueva función disponible: materiales por sesión mejorados."
        />
      </div>
      <div className="field">
        <label>Destino al tocar (opcional)</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/planner" />
      </div>
      <button className="button primary" type="button" onClick={send} disabled={sending}>
        <Send size={16} /> {sending ? "Enviando…" : "Enviar a todos"}
      </button>
      {result ? (
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>{result}</p>
      ) : null}
    </section>
  );
}
