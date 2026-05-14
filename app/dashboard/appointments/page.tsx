"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppointmentCard } from "@/components/ui/AppointmentCard";
import { RescheduleModal } from "@/components/ui/RescheduleModal";
import { Message } from "@/components/ui/Message";

type Appointment = {
  id: string;
  dateTime: string;
  status: string;
  reason: string | null;
  doctor: {
    id: string;
    user: { name: string; email: string };
    specialty: { name: string };
  };
  patient: { name: string; email: string };
};

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  async function loadAppointments() {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments", { credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        setAppointments(Array.isArray(data) ? data : []);
      } else {
        setMessage(data.error ?? "No se pudieron cargar las citas");
        setMessageType("error");
      }
    } catch {
      setMessage("Error inesperado");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(appointmentId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        await loadAppointments();
      } else {
        const data = await response.json();
        setMessage(data.error ?? "Error al actualizar");
        setMessageType("error");
      }
    } catch {
      setMessage("Error al actualizar estado");
      setMessageType("error");
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!confirm("¿Cancelar esta cita?")) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        await loadAppointments();
      } else {
        const data = await response.json();
        setMessage(data.error ?? "Error al cancelar");
        setMessageType("error");
      }
    } catch {
      setMessage("Error al cancelar cita");
      setMessageType("error");
    }
  }

  async function handleReschedule(appointmentId: string, newDateTime: string) {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateTime: newDateTime }),
    });
    if (response.ok) {
      setMessage("Cita reprogramada correctamente");
      setMessageType("info");
      await loadAppointments();
    } else {
      const data = await response.json();
      setMessage(data.error ?? "Error al reprogramar");
      setMessageType("error");
    }
  }

  useEffect(() => {
    if (user) {
      void loadAppointments();
    }
  }, [user]);

  if (!user) return null;

  const now = new Date();
  const filtered = appointments.filter((apt) => {
    const aptDate = new Date(apt.dateTime);
    if (filter === "upcoming") return aptDate > now && apt.status !== "CANCELLED";
    if (filter === "past") return aptDate <= now || apt.status === "CANCELLED";
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          {user.role === "PACIENTE" ? "Mis Citas" : "Citas"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.role === "PACIENTE"
            ? "Gestiona tus citas medicas"
            : "Gestiona las citas con tus pacientes"}
        </p>
      </div>

      {message ? (
        <div className="mb-4">
          <Message type={messageType === "error" ? "error" : "info"}>{message}</Message>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {(["all", "upcoming", "past"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? "bg-emerald-700 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
            }`}
          >
            {f === "all" ? "Todas" : f === "upcoming" ? "Proximas" : "Pasadas"}
          </button>
        ))}

        {user.role === "PACIENTE" && (
          <a
            href="/dashboard/appointments/new"
            className="ml-auto rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Agendar cita
          </a>
        )}
      </div>

      {loading && !appointments.length ? (
        <p className="text-sm text-zinc-500">Cargando citas...</p>
      ) : sorted.length > 0 ? (
        <div className="grid gap-4">
          {sorted.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              userRole={user.role}
              onStatusChange={handleStatusChange}
              onCancel={handleCancel}
              onReschedule={(id) => {
                const target = appointments.find((a) => a.id === id);
                if (target) setRescheduleTarget(target);
              }}
              loading={false}
            />
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-sm text-zinc-500">
            {user.role === "PACIENTE"
              ? "No tienes citas agendadas"
              : "No hay citas para mostrar"}
          </p>
          {user.role === "PACIENTE" && (
            <a
              href="/dashboard/appointments/new"
              className="mt-4 inline-block rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Agendar primera cita
            </a>
          )}
        </div>
      )}

      {rescheduleTarget && (
        <RescheduleModal
          open={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          appointmentId={rescheduleTarget.id}
          doctorId={rescheduleTarget.doctor.id}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}
