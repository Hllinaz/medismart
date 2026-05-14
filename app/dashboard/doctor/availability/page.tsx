"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";

type DoctorProfile = { id: string; userId: string; specialtyId: string };

type Availability = {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const DAYS_OF_WEEK = [
  "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo",
];

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [form, setForm] = useState({ dayOfWeek: "0", startTime: "09:00", endTime: "10:00" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "MEDICO") {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!doctorProfile) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/doctors/${doctorProfile.id}/availability`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: parseInt(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });
      if (response.ok) {
        setMessage("Horario agregado");
        setForm({ dayOfWeek: "0", startTime: "09:00", endTime: "10:00" });
        await reloadAvailabilities();
      } else {
        const data = await response.json();
        setMessage(data.error ?? "Error al crear horario");
      }
    } catch {
      setMessage("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(availabilityId: string) {
    if (!doctorProfile || !confirm("Eliminar este horario?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/doctors/${doctorProfile.id}/availability/${availabilityId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (response.ok) {
        await reloadAvailabilities();
      }
    } catch {
      setMessage("Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  async function reloadAvailabilities() {
    if (!doctorProfile) return;
    try {
      const response = await fetch(`/api/doctors/${doctorProfile.id}/availability`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAvailabilities(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  useEffect(() => {
    if (user?.role !== "MEDICO") return;

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const profile = data.doctorProfile ?? data.user?.doctorProfile;
        if (profile) {
          setDoctorProfile(profile);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!doctorProfile) return;

    fetch(`/api/doctors/${doctorProfile.id}/availability`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailabilities(data);
        }
      })
      .catch(() => {});
  }, [doctorProfile]);

  if (!user || user.role !== "MEDICO") return null;

  if (!doctorProfile) {
    return <p className="text-sm text-zinc-500">Cargando perfil...</p>;
  }

  const groupedByDay = DAYS_OF_WEEK.map((_, index) => ({
    day: DAYS_OF_WEEK[index],
    slots: availabilities.filter((a) => a.dayOfWeek === index),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Mi Disponibilidad</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Configura tus horarios de atencion.
        </p>
      </div>

      {message ? (
        <div className="mb-4">
          <Message type="info">{message}</Message>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form className="rounded border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
          <h2 className="mb-4 font-semibold text-zinc-900">Agregar horario</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Dia de la semana
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm((current) => ({ ...current, dayOfWeek: e.target.value }))
                }
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Hora inicio"
              type="time"
              value={form.startTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, startTime: value }))
              }
            />
            <Field
              label="Hora fin"
              type="time"
              value={form.endTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, endTime: value }))
              }
            />
            <FormButton loading={loading}>Agregar</FormButton>
          </div>
        </form>

        <div className="rounded border border-zinc-300 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="font-semibold text-zinc-900">
              Horarios ({availabilities.length})
            </h2>
          </div>
          <div className="divide-y divide-zinc-200">
            {groupedByDay.map(
              (group) =>
                group.slots.length > 0 && (
                  <div key={group.day} className="px-4 py-3">
                    <h3 className="font-semibold text-zinc-900">{group.day}</h3>
                    {group.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="mt-2 flex items-center justify-between"
                      >
                        <span className="text-sm text-zinc-600">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(slot.id)}
                          disabled={loading}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )
            )}
            {availabilities.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">
                No hay horarios configurados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
