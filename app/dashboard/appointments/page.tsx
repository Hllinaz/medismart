"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Availability = {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  doctor: {
    user: { name: string };
    specialties: Array<{ specialty: { name: string } }>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
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

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [meResponse, availabilityResponse, appointmentsResponse] =
        await Promise.all([
          fetch("/api/auth/me", { credentials: "include" }),
          fetch("/api/availability?isBooked=false", { credentials: "include" }),
          fetch("/api/appointments", { credentials: "include" }),
        ]);

      const meData = await meResponse.json();
      const availabilityData = await availabilityResponse.json();
      const appointmentsData = await appointmentsResponse.json();

      if (meResponse.ok) setUser(meData.user);

      setAvailability(availabilityData.availability ?? []);
      setAppointments(appointmentsData.appointments ?? []);

      if (!availabilityResponse.ok || !appointmentsResponse.ok) {
        setMessage(
          availabilityData.error ??
            appointmentsData.error ??
            "No se pudieron cargar las citas."
        );
        return;
      }

      setMessage(null);
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
      setMessage(response.ok ? "Cita agendada correctamente." : data.error);

      if (response.ok) {
        setForm({ availabilityId: "", symptoms: "", priority: "NORMAL" });
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
      setMessage(response.ok ? "Cita cancelada correctamente." : data.error);

      if (response.ok) await loadData();
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
      const response = await fetch(
        `/api/appointments/${evaluationForm.appointmentId}/evaluation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: Number(evaluationForm.rating),
            comment: evaluationForm.comment,
          }),
        }
      );

      const data = await response.json();
      setMessage(response.ok ? "Evaluacion guardada." : data.error);

      if (response.ok) {
        setEvaluationForm({ appointmentId: "", rating: "5", comment: "" });
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
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Citas</h1>
          <p className="mt-3 text-slate-500">
            Agenda, consulta, cancela y evalua tus citas medicas.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total citas</p>
          <p className="mt-1 text-3xl font-bold text-teal-700">
            {appointments.length}
          </p>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="grid h-fit gap-6">
          <form
            className="rounded-3xl bg-white p-6 shadow-sm"
            onSubmit={scheduleAppointment}
          >
            <h2 className="text-xl font-bold text-slate-900">
              Agendar nueva cita
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Horario disponible
                </span>
                <select
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  value={form.availabilityId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availabilityId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona un horario</option>
                  {availability.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.doctor.user.name} -{" "}
                      {new Date(slot.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Sintomas
                </span>
                <input
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  value={form.symptoms}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symptoms: event.target.value,
                    }))
                  }
                  placeholder="Describe brevemente el motivo"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Prioridad
                </span>
                <select
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="LOW">LOW</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Procesando..." : "Agendar cita"}
              </button>
            </div>
          </form>

          <form
            className="rounded-3xl bg-white p-6 shadow-sm"
            onSubmit={submitEvaluation}
          >
            <h2 className="text-xl font-bold text-slate-900">
              Evaluar cita
            </h2>

            <div className="mt-6 grid gap-4">
              <input
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                value={evaluationForm.appointmentId}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    appointmentId: event.target.value,
                  }))
                }
                placeholder="ID de cita completada"
              />

              <input
                type="number"
                min="1"
                max="5"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                value={evaluationForm.rating}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    rating: event.target.value,
                  }))
                }
              />

              <input
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                value={evaluationForm.comment}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                placeholder="Comentario"
              />

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-60"
              >
                Guardar evaluacion
              </button>
            </div>
          </form>
        </aside>

        <section className="grid h-fit gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Agenda de citas
            </h2>
          </div>

          {appointments.length ? (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                loading={loading}
                onCancel={() => void cancelAppointment(appointment.id)}
              />
            ))
          ) : (
            <EmptyState
              title="No hay citas registradas"
              description="Cuando agendes una cita, aparecera en esta seccion."
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}