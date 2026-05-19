"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  priority: string;
  patient: { user: { name: string; email: string } };
};

export default function DoctorSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSchedule() {
    try {
      const response = await fetch("/api/appointments", {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo cargar agenda.");
        return;
      }

      setAppointments(data.appointments ?? []);
      setMessage("Agenda medica cargada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadSchedule();
    });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Agenda medica</h1>
          <p className="mt-2 text-sm text-zinc-600">Listado de citas asignadas al medico autenticado.</p>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        <div className="border border-zinc-300 bg-white">
          <div className="divide-y divide-zinc-200">
            {appointments.map((appointment) => (
              <article className="px-4 py-3" key={appointment.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{appointment.patient.user.name}</h2>
                  <span className="text-xs font-medium text-zinc-500">{appointment.status}</span>
                  <span className="text-xs font-medium text-emerald-700">{appointment.priority}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {appointment.patient.user.email} - {new Date(appointment.appointmentDate).toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-zinc-400">{appointment.id}</p>
              </article>
            ))}
            {!appointments.length ? <p className="px-4 py-6 text-sm text-zinc-500">No hay citas.</p> : null}
          </div>
        </div>

        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
