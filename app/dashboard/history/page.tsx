"use client";

import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  priority: string;
  patient: { user: { name: string } };
  doctor: { user: { name: string } };
};

export default function HistoryPage() {
  const [status, setStatus] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async (nextStatus: string) => {
    try {
      const query = nextStatus ? `?status=${nextStatus}` : "";
      const response = await fetch(`/api/appointments${query}`, {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo cargar historial.");
        return;
      }

      setAppointments(data.appointments ?? []);
      setMessage("Historial cargado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistory("");
    });
  }, [loadHistory]);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Historial</h1>
          <p className="mt-2 text-sm text-zinc-600">Consulta citas por estado segun tu rol.</p>
        </div>

        <div className="flex max-w-sm gap-3">
          <select
            className="h-10 flex-1 border border-zinc-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              void loadHistory(event.target.value);
            }}
          >
            <option value="">Todos</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PENDING_REASSIGNMENT">PENDING_REASSIGNMENT</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        <div className="border border-zinc-300 bg-white">
          <div className="divide-y divide-zinc-200">
            {appointments.map((appointment) => (
              <article className="px-4 py-3" key={appointment.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{appointment.doctor.user.name}</h2>
                  <span className="text-xs font-medium text-zinc-500">{appointment.status}</span>
                  <span className="text-xs font-medium text-emerald-700">{appointment.priority}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  Paciente: {appointment.patient.user.name} - {new Date(appointment.appointmentDate).toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-zinc-400">{appointment.id}</p>
              </article>
            ))}
            {!appointments.length ? <p className="px-4 py-6 text-sm text-zinc-500">Sin resultados.</p> : null}
          </div>
        </div>

        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
