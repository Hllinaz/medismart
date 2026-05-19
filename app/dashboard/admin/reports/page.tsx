"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

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
  const [reports, setReports] = useState<Reports | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadReports() {
    try {
      const response = await fetch("/api/admin/reports", {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);

      if (!response.ok) {
        setMessage(data.error ?? "No se pudieron cargar reportes.");
        return;
      }

      setReports(data.reports);
      setMessage("Reportes cargados.");
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
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Reportes</h1>
          <p className="mt-2 text-sm text-zinc-600">Indicadores administrativos basicos.</p>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        {reports ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border border-zinc-300 bg-white p-5">
              <p className="text-sm text-zinc-500">Total</p>
              <p className="mt-2 text-3xl font-semibold">{reports.totalAppointments}</p>
            </div>
            <div className="border border-zinc-300 bg-white p-5">
              <p className="text-sm text-zinc-500">Canceladas</p>
              <p className="mt-2 text-3xl font-semibold">{reports.cancelledAppointments}</p>
            </div>
            <div className="border border-zinc-300 bg-white p-5">
              <p className="text-sm text-zinc-500">Completadas</p>
              <p className="mt-2 text-3xl font-semibold">{reports.completedAppointments}</p>
            </div>
            <div className="border border-zinc-300 bg-white p-5">
              <p className="text-sm text-zinc-500">Activas</p>
              <p className="mt-2 text-3xl font-semibold">{reports.scheduledAppointments}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-zinc-300 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="font-semibold">Por medico</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {reports?.byDoctor.map((item) => (
                <div className="flex justify-between gap-4 px-4 py-3" key={item.doctorId}>
                  <span>{item.doctorName}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-300 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="font-semibold">Por especialidad</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {reports?.bySpecialty.map((item) => (
                <div className="flex justify-between gap-4 px-4 py-3" key={item.specialtyId}>
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
