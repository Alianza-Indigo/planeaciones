"use client";

import {
  CreditCard,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ShellLink = {
  href: Route;
  label: string;
  icon: typeof Sparkles;
};

const appLinks: ShellLink[] = [
  { href: "/planner", label: "Planeador", icon: Sparkles },
  { href: "/cuenta", label: "Cuenta", icon: UserRound },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

const adminLinks: ShellLink[] = [
  { href: "/admin/users", label: "Usuarios", icon: UserRound },
  { href: "/admin/memberships", label: "Membresías", icon: Gauge },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard },
  { href: "/admin/generations", label: "Generaciones", icon: FileText },
  { href: "/admin/prompts", label: "Prompts", icon: GraduationCap },
  { href: "/admin/settings", label: "Ajustes", icon: Settings },
];

export function AppShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const links = admin ? adminLinks : appLinks;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/planner">
          <span className="brandMark">
            <GraduationCap size={20} />
          </span>
          <span>Planeaciones</span>
        </Link>
        <nav className="nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} data-active={pathname === link.href}>
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <strong>{admin ? "Dashboard admin" : "Generador didáctico"}</strong>
          <Link className="button secondary" href="/login">
            <UserRound size={17} />
            Sesión
          </Link>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
