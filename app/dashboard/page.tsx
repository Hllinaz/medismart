"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  dateTime: string;
  status: string;
  doctor: { user: { name: string }; specialty: { name: string } };
  patient: { name: string };
};

function UpcomingAppointmentBanner() {
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user) return;

    fetch("/api/appointments", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const list: Appointment[] = Array.isArray(data) ? data : [];
        const now = new Date();
        const upcoming = list
          .filter((a) => new Date(a.dateTime) > now && a.status !== "CANCELLED")
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        if (upcoming.length > 0) setNextAppointment(upcoming[0]);
      })
      .catch(() => {});
  }, [user]);

  if (!nextAppointment) return null;

  const date = new Date(nextAppointment.dateTime);
  const dateStr = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mb-8 rounded border border-emerald-300 bg-emerald-50 p-4">
      <p className="text-xs font-medium uppercase text-emerald-700">Proxima cita</p>
      {user?.role === "PACIENTE" ? (
        <p className="mt-1 text-sm font-semibold text-emerald-900">
          {dateStr} a las {timeStr} — Dr/a. {nextAppointment.doctor.user.name} ({nextAppointment.doctor.specialty.name})
        </p>
      ) : (
        <p className="mt-1 text-sm font-semibold text-emerald-900">
          {dateStr} a las {timeStr} — Paciente: {nextAppointment.patient.name}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleContent = {
    PACIENTE: (
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/appointments/new"
          className="rounded border border-emerald-300 bg-emerald-50 p-6 transition hover:bg-emerald-100"
        >
          <h2 className="text-lg font-semibold text-emerald-900">Agendar cita</h2>
          <p className="mt-1 text-sm text-emerald-700">
            Busca especialistas y agenda una nueva cita medica.
          </p>
        </Link>
        <Link
          href="/dashboard/appointments"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Mis citas</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Revisa y gestiona tus citas agendadas.
          </p>
        </Link>
      </div>
    ),
    MEDICO: (
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/appointments"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Citas con pacientes</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Revisa y gestiona las citas de tus pacientes.
          </p>
        </Link>
        <Link
          href="/dashboard/doctor/availability"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Mi disponibilidad</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Configura tus horarios de atencion.
          </p>
        </Link>
      </div>
    ),
    ADMIN: (
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/dashboard/admin/specialties"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Especialidades</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Gestiona las especialidades medicas del sistema.
          </p>
        </Link>
        <Link
          href="/dashboard/admin/doctors"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Medicos</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Administra los medicos registrados en el sistema.
          </p>
        </Link>
        <Link
          href="/dashboard/profile"
          className="rounded border border-zinc-300 bg-white p-6 transition hover:border-zinc-400"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Mi perfil</h2>
          <p className="mt-1 text-sm text-zinc-600">Consulta y administra tu perfil.</p>
        </Link>
      </div>
    ),
  };

  return (
    <div>
      <UpcomingAppointmentBanner />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.role === "PACIENTE" && "Gestiona tus citas medicas desde un solo lugar."}
          {user.role === "MEDICO" && "Administra tus citas y disponibilidad."}
          {user.role === "ADMIN" && "Panel de administracion del sistema."}
        </p>
      </div>

      {roleContent[user.role]}
    </div>
  );
}
