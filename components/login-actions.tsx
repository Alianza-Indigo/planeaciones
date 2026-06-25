"use client";

import { LogIn, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

export function LoginActions() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="badge">Cargando sesión</span>;
  }

  if (session?.user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <span className="badge">{session.user.email}</span>
        <button className="button secondary" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <button className="button primary" type="button" onClick={() => signIn("google", { callbackUrl: "/" })}>
      <LogIn size={17} />
      Entrar con Google
    </button>
  );
}
