"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  Stethoscope,
  User,
  Users,
} from "lucide-react";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type SidebarProps = {
  role?: Role;
};

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const linksByRole: Record<Role, SidebarLink[]> = {
  PACIENTE: [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      href: "/dashboard/appointments",
      label: "Mis citas",
      icon: CalendarDays,
    },

    {
      href: "/dashboard/history",
      label: "Historial",
      icon: ClipboardList,
    },

    {
      href: "/dashboard/notifications",
      label: "Notificaciones",
      icon: Bell,
    },

    {
      href: "/dashboard/profile",
      label: "Perfil",
      icon: User,
    },


  ],

  MEDICO: [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      href: "/dashboard/doctor/schedule",
      label: "Agenda",
      icon: Clock3,
    },

    {
      href: "/dashboard/notifications",
      label: "Notificaciones",
      icon: Bell,
    },

    {
      href: "/dashboard/profile",
      label: "Perfil",
      icon: User,
    },
  ],

  ADMIN: [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      href: "/dashboard/admin/doctors",
      label: "Medicos",
      icon: Stethoscope,
    },

    {
      href: "/dashboard/admin/specialties",
      label: "Especialidades",
      icon: ClipboardList,
    },

    {
      href: "/dashboard/admin/availability",
      label: "Disponibilidad",
      icon: CalendarDays,
    },

    {
      href: "/dashboard/admin/reports",
      label: "Reportes",
      icon: Users,
    },

    {
      href: "/dashboard/notifications",
      label: "Notificaciones",
      icon: Bell,
    },

    {
      href: "/dashboard/profile",
      label: "Perfil",
      icon: User,
    },
  ],
};

export function Sidebar({
  role = "PACIENTE",
}: SidebarProps) {
  const pathname = usePathname();

  const links = linksByRole[role];

  return (
    <aside
      className="
        hidden
        w-72
        border-r
        border-slate-200
        bg-white
        lg:flex
        lg:flex-col
      "
    >
      <div className="border-b border-slate-200 px-8 py-7">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-teal-600
              text-white
            "
          >
            <Stethoscope size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              MediSmart
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Healthcare Dashboard
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="grid gap-2">

          {links.map((link) => {
            const active =
              pathname === link.href;

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  group
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  transition-all
                  duration-200
                  ${active
                    ? `
                        bg-teal-50
                        text-teal-700
                        shadow-sm
                      `
                    : `
                        text-slate-600
                        hover:bg-slate-100
                        hover:text-slate-900
                      `
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`
                    transition
                    ${active
                      ? "text-teal-600"
                      : "text-slate-400 group-hover:text-slate-700"
                    }
                  `}
                />

                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}