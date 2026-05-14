"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "PACIENTE") return;

    fetch("/api/appointments", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompletedCount(data.filter((a: { status: string }) => a.status === "COMPLETED").length);
        }
      })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-zinc-600">Informacion de tu cuenta.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-zinc-300 bg-white p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Nombre</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{user.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Email</p>
              <p className="mt-1 text-sm text-zinc-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Rol</p>
              <span className="mt-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Estado</p>
              <p className="mt-1 text-sm text-zinc-900">
                {user.isActive ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </div>

        {user.role === "PACIENTE" && (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Historial medico</h2>
            <p className="mt-4 text-3xl font-bold text-emerald-700">
              {completedCount ?? "..."}
            </p>
            <p className="mt-1 text-sm text-zinc-600">citas completadas</p>
            <a
              href="/dashboard/appointments"
              className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Ver todas las citas &rarr;
            </a>
          </div>
        )}

        <div className="rounded border border-zinc-300 bg-white p-6">
          <div className="mt-8 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loading}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
