"use client";

import { LogOut, Menu, Sparkles, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

type NavLink = {
  href: Route;
  label: string;
  icon: typeof Sparkles;
};

const navLinks: NavLink[] = [
  { href: "/planner", label: "Generación", icon: Sparkles },
  { href: "/cuenta", label: "Mi cuenta", icon: UserRound },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <button className="hamburger" onClick={() => setOpen((value) => !value)} aria-label="Menú">
          <Menu size={20} />
        </button>
        <div className="logo-mark">AI</div>
        <div className="header-text">
          <h1>ADIA</h1>
          <p>Alianza Índigo Neurodivergente A.C.</p>
        </div>
        <span className="badge">NEM 2025</span>
      </header>

      <div className="sidebar-overlay" data-open={open} onClick={() => setOpen(false)} />

      <div className="app-body">
        <aside className="sidebar" data-open={open}>
          <div className="nav-label">Navegación</div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-item"
                data-active={active}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}

          <div className="nav-spacer" />

          <button className="nav-item danger" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={16} />
            Salir
          </button>
        </aside>

        <main className="main">{children}</main>
      </div>

      <footer className="footer">
        Herramienta desarrollada por{" "}
        <a href="https://alianzaindigo.org" target="_blank" rel="noreferrer">
          Alianza Índigo Neurodivergente A.C.
        </a>{" "}
        · Uso educativo
      </footer>
    </div>
  );
}
