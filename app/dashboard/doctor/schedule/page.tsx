"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WeeklyCalendar } from "@/components/calendar/WeeklyCalendar";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  priority: string;
  wasReassigned: boolean;

  symptoms?: string | null;

  specialty?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;

  patient: {
    user: {
      name: string;
      email: string;
    };
  };

  doctor: {
    user: {
      name: string;
    };
  };
};

export default function DoctorSchedulePage() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const [message, setMessage] = useState<string | null>(null);

  const [, setLoading] = useState(false);

  async function loadSchedule() {
    setLoading(true);

    try {
      const [meResponse, appointmentsResponse, availabilityResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
          }),

          fetch("/api/appointments", {
            credentials: "include",
          }),

          fetch("/api/availability", {
            credentials: "include",
          }),
        ]);

      const meData = await meResponse.json();

      const appointmentsData = await appointmentsResponse.json();
      const availabilityData = await availabilityResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!appointmentsResponse.ok) {
        setMessage(
          appointmentsData.error ??
          "No se pudo cargar agenda."
        );

        return;
      }

      setAppointments(
        appointmentsData.appointments ?? []
      );

      if (availabilityResponse.ok) {
        setAvailabilities(availabilityData.availability ?? []);
      } else {
        setAvailabilities([]);
      }

      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Error inesperado"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadSchedule();
    });
  }, []);

  const availableCount = availabilities.filter(
    (availability) => !availability.isBooked
  ).length;

  const todayCount = appointments.filter((appointment) => {
    const date = new Date(appointment.appointmentDate);
    const today = new Date();

    return (
      appointment.status === "SCHEDULED" &&
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;

  const scheduledCount = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "COMPLETED"
  ).length;

  async function handleCancelAppointment(appointmentId: string) {
    const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo cancelar la cita.");
      return;
    }

    if (user?.role == "PACIENTE") {
      setMessage("Cita cancelada correctamente.");
    } else {
      setMessage("Cita cancelada. Queda pendiente de reasignación.");
    }

    await loadSchedule();
  }

  async function handleCompleteAppointment(appointmentId: string) {
    const response = await fetch(`/api/appointments/${appointmentId}/complete`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo completar la cita.");
      return;
    }

    setMessage("Cita marcada como completada.");
    await loadSchedule();
  }

  return (
    <DashboardShell
      role={user?.role}
      user={user}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Agenda médica
          </h1>

          <p className="mt-3 text-slate-500">
            Consulta pacientes, horarios y acciones clínicas de tus citas.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Citas hoy
            </p>

            <p className="mt-1 text-3xl font-bold text-teal-700">
              {todayCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Disponibles
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-600">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Programadas
            </p>

            <p className="mt-1 text-3xl font-bold text-teal-700">
              {scheduledCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Completadas
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-600">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
          {message}
        </div>
      ) : null}

      <WeeklyCalendar
        appointments={appointments}
        availabilities={availabilities}
        canCancel={user?.role === "MEDICO" || user?.role === "ADMIN"}
        onCancelAppointment={handleCancelAppointment}
        canComplete={user?.role === "MEDICO" || user?.role === "ADMIN"}
        onCompleteAppointment={handleCompleteAppointment}
      />

    </DashboardShell>
  );
}
