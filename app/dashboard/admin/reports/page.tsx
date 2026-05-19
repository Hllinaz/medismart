"use client";

import { useEffect, useState } from "react";

import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/appointments/EmptyState";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Reports = {
  totalAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  scheduledAppointments: number;
  noShowRate: number | null;
  byDoctor: Array<{ doctorId: string; doctorName: string; count: number }>;
  bySpecialty: Array<{ specialtyId: string; name: string; count: number }>;
};

export default function ReportsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [reports, setReports] = useState<Reports | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadReports() {
    try {
      const [meResponse, reportsResponse] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/admin/reports", { credentials: "include" }),
      ]);

      const meData = await meResponse.json();
      const reportsData = await reportsResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!reportsResponse.ok) {
        setMessage(reportsData.error ?? "No se pudieron cargar reportes.");
        return;
      }

      setReports(reportsData.reports);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadReports();
    });
  }, []);

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Reportes</h1>
        <p className="mt-3 text-slate-500">
          Monitorea indicadores administrativos y actividad médica.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      {reports ? (
        <>
          <section className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total citas"
              value={reports.totalAppointments}
              description="Citas registradas en el sistema."
              tone="teal"
            />

            <StatCard
              label="Activas"
              value={reports.scheduledAppointments}
              description="Citas actualmente programadas."
              tone="blue"
            />

            <StatCard
              label="Completadas"
              value={reports.completedAppointments}
              description="Citas finalizadas correctamente."
              tone="emerald"
            />

            <StatCard
              label="Canceladas"
              value={reports.cancelledAppointments}
              description="Citas canceladas o no realizadas."
              tone="red"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ReportList
              title="Citas por médico"
              description="Distribución de citas asignadas por profesional."
              emptyTitle="Sin datos por médico"
              emptyDescription="Cuando existan citas asignadas, aparecerán en este resumen."
              items={reports.byDoctor.map((item) => ({
                id: item.doctorId,
                label: item.doctorName,
                value: item.count,
              }))}
            />

            <ReportList
              title="Citas por especialidad"
              description="Distribución de citas según el área médica."
              emptyTitle="Sin datos por especialidad"
              emptyDescription="Cuando existan citas por especialidad, aparecerán en este resumen."
              items={reports.bySpecialty.map((item) => ({
                id: item.specialtyId,
                label: item.name,
                value: item.count,
              }))}
            />
          </section>
        </>
      ) : (
        <EmptyState
          title="Reportes no disponibles"
          description="Los indicadores aparecerán cuando el sistema cargue información administrativa."
        />
      )}
    </DashboardShell>
  );
}

function ReportList({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; label: string; value: number }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-semibold text-slate-800">{item.label}</p>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                  {item.value}
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </article>
  );
}