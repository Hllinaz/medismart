"use client";

import { useEffect, useState } from "react";

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

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  priority: string;

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

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [loading, setLoading] =
    useState(false);

  async function loadSchedule() {
    setLoading(true);

    try {
      const [meResponse, appointmentsResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
          }),

          fetch("/api/appointments", {
            credentials: "include",
          }),
        ]);

      const meData = await meResponse.json();

      const appointmentsData =
        await appointmentsResponse.json();

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

  const scheduledCount = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED"
  ).length;

  const completedCount = appointments.filter(
    (appointment) =>
      appointment.status === "COMPLETED"
  ).length;

  return (
    <DashboardShell
      role={user?.role}
      user={user}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Agenda medica
          </h1>

          <p className="mt-3 text-slate-500">
            Consulta y administra tus citas asignadas.
          </p>
        </div>

        <div className="flex gap-4">
          
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

      <section className="grid gap-4">
        {appointments.length ? (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              loading={loading}
            />
          ))
        ) : (
          <EmptyState
            title="No hay citas asignadas"
            description="Las citas medicas del doctor apareceran en esta seccion."
          />
        )}
      </section>
    </DashboardShell>
  );
}