"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "PACIENTE" | "MEDICO" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

const dashboardLinks = [
  {
    href: "/dashboard/profile",
    title: "Perfil",
    description: "Consulta usuario autenticado y cierra sesion.",
  },
  {
    href: "/dashboard/admin/specialties",
    title: "Especialidades",
    description: "Crear y listar especialidades. Requiere ADMIN.",
  },
  {
    href: "/dashboard/admin/doctors",
    title: "Medicos",
    description: "Crear y listar medicos. Requiere ADMIN.",
  },
  {
    href: "/dashboard/admin/availability",
    title: "Horarios",
    description: "Crear disponibilidad medica.",
  },
  {
    href: "/dashboard/appointments",
    title: "Citas",
    description: "Agendar y consultar citas.",
  },
  {
    href: "/dashboard/admin/reports",
    title: "Reportes",
    description: "Resumen administrativo.",
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await response.json();

        setResult(data);

        if (!response.ok) {
          setError(data.error ?? "No autenticado.");
          return;
        }

        setUser(data.user);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Punto de entrada para navegar las pantallas conectadas al backend.
          </p>
        </div>

        {loading ? <Message type="info">Cargando sesion...</Message> : null}
        {error ? <Message type="error">{error}</Message> : null}
        {user ? (
          <Message type="success">
            Sesion activa: {user.name} - {user.role}
          </Message>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {dashboardLinks.map((link) => (
            <Link
              className="border border-zinc-300 bg-white p-5 shadow-sm transition hover:border-emerald-600"
              href={link.href}
              key={link.href}
            >
              <h2 className="text-lg font-semibold">{link.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{link.description}</p>
            </Link>
          ))}
        </div>

        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
