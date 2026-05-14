"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const roleLinks = {
  PACIENTE: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/doctors", label: "Doctores" },
    { href: "/dashboard/appointments", label: "Mis Citas" },
    { href: "/dashboard/appointments/new", label: "Agendar Cita" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],
  MEDICO: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/appointments", label: "Citas" },
    { href: "/dashboard/doctor/availability", label: "Mi Disponibilidad" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/admin/specialties", label: "Especialidades" },
    { href: "/dashboard/admin/doctors", label: "Medicos" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],
};

const roleBadge: Record<string, string> = {
  PACIENTE: "bg-blue-100 text-blue-700",
  MEDICO: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = roleLinks[user.role] ?? roleLinks.PACIENTE;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-3 z-50 rounded border border-zinc-300 bg-white p-2 lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center border-b border-zinc-200 px-5">
          <Link href="/dashboard" className="text-sm font-bold text-emerald-800">
            MediSmart
          </Link>
        </div>

        <div className="border-b border-zinc-200 px-5 py-3">
          <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
          <p className="text-xs text-zinc-500">{user.email}</p>
          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${roleBadge[user.role] ?? ""}`}>
            {user.role}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex rounded px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-zinc-200 px-3 py-4">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full rounded px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
