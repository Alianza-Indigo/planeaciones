"use client";

import { BadgeCheck, Loader2, Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { GRADOS_POR_NIVEL, NIVELES, type NivelEdu } from "@/lib/generation/nivel";

type Profile = {
  nombre: string;
  escuela: string;
  nivel: string;
  grado: string;
  editCount: number;
};

type ProfileResponse = {
  profile: Profile | null;
  remainingEdits: number;
  maxEdits: number;
};

export function TeacherProfileForm() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const [hasProfile, setHasProfile] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);
  const [maxEdits, setMaxEdits] = useState<number>(2);

  const [nombre, setNombre] = useState("");
  const [escuela, setEscuela] = useState("");
  const [nivel, setNivel] = useState<NivelEdu>("Primaria");
  const [grado, setGrado] = useState("1°");

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((res) => res.json())
      .then((data: ProfileResponse) => {
        setMaxEdits(data.maxEdits);
        setRemaining(data.remainingEdits);
        if (data.profile) {
          setHasProfile(true);
          setNombre(data.profile.nombre);
          setEscuela(data.profile.escuela);
          if ((NIVELES as readonly string[]).includes(data.profile.nivel)) {
            setNivel(data.profile.nivel as NivelEdu);
          }
          setGrado(data.profile.grado);
        }
      })
      .catch(() => setError("No se pudo cargar tu perfil."))
      .finally(() => setLoaded(true));
  }, []);

  // El grado debe existir dentro del nivel elegido.
  const gradosDisponibles = GRADOS_POR_NIVEL[nivel];
  useEffect(() => {
    if (!gradosDisponibles.includes(grado)) setGrado(gradosDisponibles[0]);
  }, [gradosDisponibles, grado]);

  // Bloqueado: ya tiene perfil y agotó sus cambios. Debe pedirlo al admin.
  const locked = hasProfile && remaining <= 0;

  async function save() {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nombre, escuela, nivel, grado }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar tu perfil.");
        return;
      }
      setHasProfile(true);
      setRemaining(typeof data.remainingEdits === "number" ? data.remainingEdits : remaining);
      setSavedOk(true);
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <p className="hint">
        <Loader2 size={16} style={{ verticalAlign: "-3px" }} /> Cargando tu perfil…
      </p>
    );
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      {!hasProfile ? (
        <p className="hint">
          Configura tu identidad docente. Estos datos se usan en todas tus planeaciones y solo
          podrás cambiarlos <strong>{maxEdits} veces</strong>; después deberás pedírselo al
          administrador.
        </p>
      ) : locked ? (
        <p className="alert" style={{ margin: 0 }}>
          <Lock size={15} style={{ verticalAlign: "-2px" }} /> Alcanzaste el máximo de cambios de tu
          perfil. Solicita al administrador que lo actualice.
        </p>
      ) : (
        <p className="hint" style={{ margin: 0 }}>
          Te {remaining === 1 ? "queda" : "quedan"} <strong>{remaining}</strong>{" "}
          {remaining === 1 ? "cambio" : "cambios"} antes de tener que pedírselo al administrador.
        </p>
      )}

      <label className="field">
        <span>Nombre del docente</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={locked}
          placeholder="Nombre completo"
        />
      </label>

      <label className="field">
        <span>Escuela</span>
        <input
          type="text"
          value={escuela}
          onChange={(e) => setEscuela(e.target.value)}
          disabled={locked}
          placeholder="Nombre de la escuela"
        />
      </label>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label className="field" style={{ flex: 1, minWidth: 180 }}>
          <span>Nivel</span>
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelEdu)}
            disabled={locked}
          >
            {NIVELES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="field" style={{ flex: 1, minWidth: 140 }}>
          <span>Grado</span>
          <select value={grado} onChange={(e) => setGrado(e.target.value)} disabled={locked}>
            {gradosDisponibles.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="alert" style={{ margin: 0 }}>{error}</p> : null}
      {savedOk ? (
        <p className="hint" style={{ margin: 0, color: "var(--ok, #157347)" }}>
          <BadgeCheck size={15} style={{ verticalAlign: "-2px" }} /> Perfil guardado.
        </p>
      ) : null}

      {!locked ? (
        <button
          className="button primary"
          type="button"
          onClick={save}
          disabled={saving || !nombre.trim() || !escuela.trim()}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? <Loader2 size={17} /> : <Save size={17} />}
          {hasProfile ? "Guardar cambios" : "Guardar perfil"}
        </button>
      ) : null}
    </div>
  );
}
