"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "PACIENTE" | "MEDICO" | "ADMIN";
};

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        }
      } catch {
        console.error("Error loading session");
      }
    }

    void loadUser();
  }, []);

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-3 text-slate-500">
          Bienvenido nuevamente a MediSmart.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Usuario
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {user?.name ?? "Cargando..."}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Rol
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {user?.role ?? "--"}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Estado
          </p>

          <h2 className="mt-3 text-2xl font-bold text-emerald-600">
            Activo
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Plataforma
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            MediSmart
          </h2>
        </div>
      </div>
    </DashboardShell>
  );
}