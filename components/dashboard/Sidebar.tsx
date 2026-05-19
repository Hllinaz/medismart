"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type SidebarProps = {
  role?: Role;
};

const linksByRole: Record<Role, Array<{ href: string; label: string }>> = {
  PACIENTE: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/appointments", label: "Mis citas" },
    { href: "/dashboard/history", label: "Historial" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],

  MEDICO: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/doctor/schedule", label: "Agenda" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],

  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/admin/doctors", label: "Medicos" },
    { href: "/dashboard/admin/specialties", label: "Especialidades" },
    { href: "/dashboard/admin/availability", label: "Disponibilidad" },
    { href: "/dashboard/admin/reports", label: "Reportes" },
    { href: "/dashboard/profile", label: "Perfil" },
  ],
};

export function Sidebar({
  role = "PACIENTE",
}: SidebarProps) {
  const pathname = usePathname();

  const links = linksByRole[role];

  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      
      <div className="border-b border-slate-200 px-8 py-7">
        <h1 className="text-2xl font-bold text-teal-700">
          MediSmart
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Healthcare Dashboard
        </p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="grid gap-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  rounded-2xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  transition
                  ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}