"use client";

import { Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminMembership = {
  userId: string;
  email: string | null;
  plan: string;
  status: string;
  suspended: boolean;
  generationsUsed: number;
  generationLimit: number;
  isAdmin: boolean;
};

export function MembershipsManager({ memberships }: { memberships: AdminMembership[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleSuspend(userId: string, suspended: boolean) {
    setBusyId(userId);
    setMessage(null);
    const response = await fetch(`/api/admin/memberships/${userId}/suspend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ suspended }),
    });
    setBusyId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo actualizar la membresía.");
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
              <th>Usuario</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Uso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {memberships.map((membership) => (
              <tr key={membership.userId}>
                <td>{membership.email ?? "-"}</td>
                <td>{membership.plan}</td>
                <td>
                  {membership.suspended ? (
                    <span className="tag missing">Pausada</span>
                  ) : (
                    <span className="tag neutral">{membership.status}</span>
                  )}
                </td>
                <td>
                  {membership.isAdmin
                    ? `${membership.generationsUsed}/∞`
                    : `${membership.generationsUsed}/${membership.generationLimit}`}
                </td>
                <td style={{ textAlign: "right" }}>
                  {membership.isAdmin ? (
                    <span className="tag neutral">Admin</span>
                  ) : membership.suspended ? (
                    <button
                      className="button secondary sm"
                      type="button"
                      disabled={busyId === membership.userId}
                      onClick={() => toggleSuspend(membership.userId, false)}
                      title="Reactiva la generación para este docente"
                    >
                      {busyId === membership.userId ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <PlayCircle size={14} />
                      )}
                      Reactivar
                    </button>
                  ) : (
                    <button
                      className="button secondary sm"
                      type="button"
                      disabled={busyId === membership.userId}
                      onClick={() => toggleSuspend(membership.userId, true)}
                      title="Pausa la generación hasta reactivarla"
                    >
                      {busyId === membership.userId ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <PauseCircle size={14} />
                      )}
                      Suspender
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
