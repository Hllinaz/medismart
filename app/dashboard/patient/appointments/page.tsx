"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EvaluationModal } from "@/components/appointments/EvaluationModal";

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
  wasReassigned: boolean;
  patient: { user: { name: string } };
  doctor: { user: { name: string } };
  evaluation: { rating: number; comment: string | null } | null;
};

export default function AppointmentsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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
  const [selectedEvaluation, setSelectedEvaluation] = useState<Appointment | null>(null);

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          availability.flatMap((slot) =>
            slot.doctor.specialties.map((item) => item.specialty.name),
          ),
        ),
      ),
    [availability],
  );

  const doctorNames = useMemo(() => {
    const filtered = availability.filter((slot) =>
      selectedSpecialty
        ? slot.doctor.specialties.some(
          (item) => item.specialty.name === selectedSpecialty,
        )
        : true,
    );

    return Array.from(new Set(filtered.map((slot) => slot.doctor.user.name)));
  }, [availability, selectedSpecialty]);


  const filteredBySpecialtyAndDoctor = useMemo(
    () =>
      availability.filter((slot) => {
        if (!selectedSpecialty) return false;

        const matchesSpecialty = slot.doctor.specialties.some(
          (item) => item.specialty.name === selectedSpecialty,
        );

        const matchesDoctor = selectedDoctor
          ? slot.doctor.user.name === selectedDoctor
          : true;

        return matchesSpecialty && matchesDoctor && !slot.isBooked;
      }),
    [availability, selectedSpecialty, selectedDoctor],
  );

  const availableDates = useMemo(
    () =>
      Array.from(
        new Set(
          filteredBySpecialtyAndDoctor.map((slot) =>
            new Date(slot.startTime).toISOString().slice(0, 10),
          ),
        ),
      ).sort(),
    [filteredBySpecialtyAndDoctor],
  );

  const filteredAvailability = useMemo(
    () =>
      filteredBySpecialtyAndDoctor.filter((slot) =>
        selectedDate
          ? new Date(slot.startTime).toISOString().slice(0, 10) === selectedDate
          : false,
      ),
    [filteredBySpecialtyAndDoctor, selectedDate],
  );

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
          "No se pudieron cargar las citas.",
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

    if (!form.availabilityId) {
      setMessage("Selecciona un horario disponible.");
      return;
    }

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
        setSelectedSpecialty("");
        setSelectedDoctor("");
        setSelectedDate("");
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

    if (!selectedEvaluation) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${selectedEvaluation.id}/evaluation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: Number(evaluationForm.rating),
            comment: evaluationForm.comment,
          }),
        },
      );

      const data = await response.json();

      setMessage(response.ok ? "Evaluación guardada." : data.error);

      if (response.ok) {
        setEvaluationForm({ appointmentId: "", rating: "5", comment: "" });
        setSelectedEvaluation(null);
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
            Agenda, consulta, cancela y evalúa tus citas médicas.
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

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
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
                  Especialidad
                </span>

                <select
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  value={selectedSpecialty}
                  onChange={(event) => {
                    setSelectedSpecialty(event.target.value);
                    setSelectedDoctor("");
                    setSelectedDate("");
                    setForm((current) => ({ ...current, availabilityId: "" }));
                  }}
                >
                  <option value="">Escoge una especialidad</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Médico
                </span>

                <select
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  value={selectedDoctor}
                  onChange={(event) => {
                    setSelectedDoctor(event.target.value);
                    setSelectedDate("");
                    setForm((current) => ({ ...current, availabilityId: "" }));
                  }}
                >
                  <option value="">Todos los médicos</option>
                  {doctorNames.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Fechas disponibles
                </span>

                <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-3">
                  {availableDates.map((date) => {
                    const selected = selectedDate === date;
                    const parsedDate = new Date(`${date}T12:00:00`);

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setForm((current) => ({ ...current, availabilityId: "" }));
                        }}
                        className={
                          selected
                            ? "rounded-2xl bg-blue-600 px-3 py-3 text-white shadow-sm"
                            : "rounded-2xl bg-white px-3 py-3 text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-50"
                        }
                      >
                        <p className="text-xs font-semibold uppercase">
                          {parsedDate.toLocaleDateString("es-CO", {
                            weekday: "short",
                          })}
                        </p>
                        <p className="text-xl font-bold">{parsedDate.getDate()}</p>
                        <p className="text-[11px] opacity-80">
                          {parsedDate.toLocaleDateString("es-CO", {
                            month: "short",
                          })}
                        </p>
                      </button>
                    );
                  })}

                  {!availableDates.length ? (
                    <p className="col-span-4 text-sm text-slate-500">
                      No hay fechas disponibles con estos filtros.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Horarios disponibles
                </span>

                {selectedDate ? (
                  <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-3">
                    {filteredAvailability.map((slot) => {
                      const selected = form.availabilityId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              availabilityId: slot.id,
                            }))
                          }
                          className={
                            selected
                              ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                              : "rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                          }
                        >
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </button>
                      );
                    })}

                    {!filteredAvailability.length ? (
                      <p className="text-sm text-slate-500">
                        No hay horarios para este día.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Selecciona primero una fecha disponible.
                  </p>
                )}
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Síntomas
                </span>
                <input
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
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
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
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
                onCancel={
                  appointment.status === "SCHEDULED"
                    ? () => void cancelAppointment(appointment.id)
                    : undefined
                }
                onEvaluate={
                  appointment.status === "COMPLETED" && !appointment.evaluation
                    ? () => setSelectedEvaluation(appointment)
                    : undefined
                }
              />
            ))
          ) : (
            <EmptyState
              title="No hay citas registradas"
              description="Cuando agendes una cita, aparecerá en esta sección."
            />
          )}
        </section>
      </div>

      {selectedEvaluation ? (
        <EvaluationModal
          appointment={selectedEvaluation}
          rating={evaluationForm.rating}
          comment={evaluationForm.comment}
          loading={loading}
          onRatingChange={(rating) =>
            setEvaluationForm((current) => ({
              ...current,
              rating,
            }))
          }
          onCommentChange={(comment) =>
            setEvaluationForm((current) => ({
              ...current,
              comment,
            }))
          }
          onClose={() => setSelectedEvaluation(null)}
          onSubmit={submitEvaluation}
        />
      ) : null}

    </DashboardShell>
  );
}