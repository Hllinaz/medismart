"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type Availability = {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  doctor: {
    user: {
      name: string;
    };
    specialties: Array<{
      specialty: {
        name: string;
      };
    }>;
  };
};

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  priority: string;
  requestDate: string;
  patient: { user: { name: string } };
  doctor: { user: { name: string } };
  evaluation: { rating: number; comment: string | null } | null;
};

export default function AppointmentsPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState({
    availabilityId: "",
    symptoms: "",
    priority: "NORMAL",
  });
  const [evaluationForm, setEvaluationForm] = useState({
    appointmentId: "",
    rating: "5",
    comment: "",
  });
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [availabilityResponse, appointmentsResponse] = await Promise.all([
        fetch("/api/availability?isBooked=false", { credentials: "include" }),
        fetch("/api/appointments", { credentials: "include" }),
      ]);
      const availabilityData = await availabilityResponse.json();
      const appointmentsData = await appointmentsResponse.json();

      setAvailability(availabilityData.availability ?? []);
      setAppointments(appointmentsData.appointments ?? []);
      setResult({ availability: availabilityData, appointments: appointmentsData });

      if (!availabilityResponse.ok || !appointmentsResponse.ok) {
        setMessage(availabilityData.error ?? appointmentsData.error ?? "No se pudieron cargar las citas.");
        return;
      }

      setMessage("Agenda cargada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function scheduleAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Cita agendada." : data.error);

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Cita cancelada." : data.error);

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function submitEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${evaluationForm.appointmentId}/evaluation`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Number(evaluationForm.rating),
          comment: evaluationForm.comment,
        }),
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Evaluacion guardada." : data.error);

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Citas</h1>
          <p className="mt-2 text-sm text-zinc-600">Agenda, cancela y consulta citas segun tu rol.</p>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="grid h-fit gap-5">
            <form className="grid gap-4 border border-zinc-300 bg-white p-5" onSubmit={scheduleAppointment}>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Horario libre
                <select
                  className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
                  value={form.availabilityId}
                  onChange={(event) => setForm((current) => ({ ...current, availabilityId: event.target.value }))}
                >
                  <option value="">Selecciona un horario</option>
                  {availability.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.doctor.user.name} - {new Date(slot.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Sintomas" value={form.symptoms} onChange={(symptoms) => setForm((current) => ({ ...current, symptoms }))} />
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Prioridad
                <select
                  className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="LOW">LOW</option>
                </select>
              </label>
              <FormButton loading={loading}>Agendar cita</FormButton>
            </form>

            <form className="grid gap-4 border border-zinc-300 bg-white p-5" onSubmit={submitEvaluation}>
              <Field label="ID cita completada" value={evaluationForm.appointmentId} onChange={(appointmentId) => setEvaluationForm((current) => ({ ...current, appointmentId }))} />
              <Field label="Calificacion" type="number" value={evaluationForm.rating} onChange={(rating) => setEvaluationForm((current) => ({ ...current, rating }))} />
              <Field label="Comentario" value={evaluationForm.comment} onChange={(comment) => setEvaluationForm((current) => ({ ...current, comment }))} />
              <FormButton loading={loading}>Evaluar cita</FormButton>
            </form>
          </div>

          <div className="grid gap-4">
            <div className="border border-zinc-300 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3">
                <h2 className="font-semibold">Agenda</h2>
              </div>
              <div className="divide-y divide-zinc-200">
                {appointments.map((appointment) => (
                  <article className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_auto]" key={appointment.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{appointment.doctor.user.name}</h3>
                        <span className="text-xs font-medium text-zinc-500">{appointment.status}</span>
                        <span className="text-xs font-medium text-emerald-700">{appointment.priority}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        Paciente: {appointment.patient.user.name} - {new Date(appointment.appointmentDate).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{appointment.id}</p>
                    </div>
                    <button
                      className="h-9 border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800 disabled:opacity-50"
                      disabled={loading || appointment.status !== "SCHEDULED"}
                      type="button"
                      onClick={() => void cancelAppointment(appointment.id)}
                    >
                      Cancelar
                    </button>
                  </article>
                ))}
                {!appointments.length ? <p className="px-4 py-6 text-sm text-zinc-500">No hay citas.</p> : null}
              </div>
            </div>

            {result ? <JsonBlock data={result} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
