"use client";

import { Loader2, RotateCcw, Shield, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "USER";
  profile: {
    nombre: string;
    escuela: string;
    nivel: string;
    grado: string;
    editCount: number;
  } | null;
};

const MAX_PROFILE_EDITS = 2;

export function UsersManager({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function cambiarRol(id: string, role: "ADMIN" | "USER") {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusyId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo cambiar el rol.");
      return;
    }
    router.refresh();
  }

  async function reiniciarPerfil(id: string) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${id}/profile`, { method: "POST" });
    setBusyId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo reiniciar el perfil.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      {message ? (
        <div className="admin-toolbar">
          <span className="tag missing">{message}</span>
        </div>
      ) : null}
      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Perfil docente</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const esYo = user.id === currentUserId;
              const esAdmin = user.role === "ADMIN";
              const perfil = user.profile;
              const cambiosAgotados = perfil ? perfil.editCount >= MAX_PROFILE_EDITS : false;
              return (
                <tr key={user.id}>
                  <td>
                    {user.name ?? "-"}
                    {esYo ? <span className="tag neutral" style={{ marginLeft: 8 }}>Tú</span> : null}
                  </td>
                  <td>{user.email ?? "-"}</td>
                  <td>
                    <span className={`tag ${esAdmin ? "gold" : "neutral"}`}>{esAdmin ? "Admin" : "Docente"}</span>
                  </td>
                  <td>
                    {perfil ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span>
                          {perfil.escuela} · {perfil.grado} {perfil.nivel.toLowerCase()}
                        </span>
                        <span
                          className={`tag ${cambiosAgotados ? "missing" : "neutral"}`}
                          style={{ alignSelf: "flex-start" }}
                        >
                          {perfil.editCount}/{MAX_PROFILE_EDITS} cambios
                        </span>
                      </div>
                    ) : (
                      <span className="tag neutral">Sin perfil</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {perfil && perfil.editCount > 0 ? (
                      <button
                        className="button secondary sm"
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => reiniciarPerfil(user.id)}
                        title="Devuelve al docente sus cambios de perfil"
                      >
                        {busyId === user.id ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                        Reiniciar cambios
                      </button>
                    ) : null}
                    {esAdmin ? (
                      <button
                        className="button secondary sm"
                        type="button"
                        disabled={esYo || busyId === user.id}
                        onClick={() => cambiarRol(user.id, "USER")}
                        title={esYo ? "No puedes quitarte el rol a ti mismo" : undefined}
                      >
                        {busyId === user.id ? <Loader2 size={14} className="spin" /> : <ShieldOff size={14} />}
                        Quitar admin
                      </button>
                    ) : (
                      <button
                        className="button secondary sm"
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => cambiarRol(user.id, "ADMIN")}
                      >
                        {busyId === user.id ? <Loader2 size={14} className="spin" /> : <Shield size={14} />}
                        Hacer admin
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
