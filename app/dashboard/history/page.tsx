"use client";

import { useCallback, useEffect, useState } from "react";

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
  wasReassigned: boolean;
  patient: {
    user: {
      name: string;
    };
  };
  doctor: {
    user: {
      name: string;
    };
  };
};

export default function HistoryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [status, setStatus] = useState("");

  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(
    async (nextStatus: string) => {
      setLoading(true);

      try {
        const query = nextStatus
          ? `?status=${nextStatus}`
          : "";

        const [meResponse, appointmentsResponse] =
          await Promise.all([
            fetch("/api/auth/me", {
              credentials: "include",
            }),

            fetch(`/api/appointments${query}`, {
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
            "No se pudo cargar historial."
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
    },
    []
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistory("");
    });
  }, [loadHistory]);

  return (
    <DashboardShell
      role={user?.role}
      user={user}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Historial
          </h1>

          <p className="mt-3 text-slate-500">
            Consulta tus citas medicas por estado.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Registros
          </p>

          <p className="mt-1 text-3xl font-bold text-teal-700">
            {appointments.length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">

        <select
          className="
            h-12
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            text-sm
            font-medium
            text-slate-700
            shadow-sm
            outline-none
            transition
            focus:border-teal-500
            focus:ring-4
            focus:ring-teal-100
          "
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);

            void loadHistory(
              event.target.value
            );
          }}
        >
          <option value="">Todos</option>

          <option value="SCHEDULED">
            SCHEDULED
          </option>

          <option value="COMPLETED">
            COMPLETED
          </option>

          <option value="CANCELLED">
            CANCELLED
          </option>

          <option value="PENDING_REASSIGNMENT">
            PENDING_REASSIGNMENT
          </option>
        </select>

        {message ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {message}
          </div>
        ) : null}
      </div>

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
            title="No hay historial disponible"
            description="Las citas apareceran aqui una vez existan registros asociados a tu cuenta."
          />
        )}
      </section>
    </DashboardShell>
  );
}