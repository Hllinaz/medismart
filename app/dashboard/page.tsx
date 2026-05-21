"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "PACIENTE" | "MEDICO" | "ADMIN";
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [queueResult, setQueueResult] = useState<string | null>(null);

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

  async function handleProcessQueue() {
    try {
      setProcessingQueue(true);
      setQueueResult(null);

      const response = await fetch("/api/appointments/reassign", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error procesando cola");
      }

      setQueueResult(
        `Se procesaron ${data.count} citas correctamente`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setQueueResult("Error procesando cola");
    } finally {
      setProcessingQueue(false);
    }
  }

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

      {user?.role === "ADMIN" && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Cola de Reasignación
              </h2>

              <p className="mt-2 text-slate-500">
                Procesa automáticamente las citas pendientes según prioridad.
              </p>
            </div>

            <button
              onClick={handleProcessQueue}
              disabled={processingQueue}
              className="rounded-2xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              {processingQueue
                ? "Procesando..."
                : "Procesar Cola"}
            </button>
          </div>

          {queueResult && (
            <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
              {queueResult}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}