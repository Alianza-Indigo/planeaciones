"use client";

import {
  CreditCard,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
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
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: UserRound },
  { href: "/admin/memberships", label: "Membresías", icon: Gauge },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
  { href: "/admin/generations", label: "Generaciones", icon: FileText },
  { href: "/admin/prompts", label: "Prompts", icon: GraduationCap },
  { href: "/admin/settings", label: "Ajustes", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
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
          <h1>ADIA · Admin</h1>
          <p>Panel de operación</p>
        </div>
        <Link className="badge" href="/planner">
          Ir a la app
        </Link>
      </header>

      <div className="sidebar-overlay" data-open={open} onClick={() => setOpen(false)} />

      <div className="app-body">
        <aside className="sidebar" data-open={open}>
          <div className="nav-label">Administración</div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
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

        <main className="main">
          <div className="page-inner wide">{children}</div>
        </main>
      </div>
    </div>
  );
}
