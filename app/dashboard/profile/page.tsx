"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";
type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "MS";

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Perfil</h1>
        <p className="mt-3 text-slate-500">
          Consulta la informacion de tu cuenta y estado de acceso.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-100 text-3xl font-bold text-teal-700">
              {initials}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                {loading ? "Cargando..." : user?.name}
              </h2>
              <p className="mt-2 text-slate-500">{user?.email}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                  {user?.role ?? "Rol"}
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {user?.status ?? "Estado"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <InfoItem label="Nombre completo" value={user?.name ?? "--"} />
            <InfoItem label="Correo electronico" value={user?.email ?? "--"} />
            <InfoItem label="Rol del sistema" value={user?.role ?? "--"} />
            <InfoItem label="Estado de la cuenta" value={user?.status ?? "--"} />
          </div>
        </section>

        <aside className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Seguridad de cuenta
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Tu sesion se administra mediante una cookie segura httpOnly.
            Puedes cerrar sesion desde la barra superior.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Estado actual
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {user?.status ?? "Cargando"}
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-slate-900">{value}</p>
    </div>
  );
}