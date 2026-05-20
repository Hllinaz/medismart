"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Doctor = {
  id: string;

  user: {
    name: string;
    email: string;
    status: string;
  };
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  doctor: Doctor;
};

export default function AvailabilityPage() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [form, setForm] = useState({
    doctorId: "",
    date: "",
    startHour: "09:00",
    durationMinutes: 60,
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const meResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        setMessage(meData.error ?? "No autorizado");
        return;
      }

      setUser(meData.user);

      const availabilityResponse = await fetch("/api/availability", {
        credentials: "include",
      });

      const availabilityData = await availabilityResponse.json();

      if (!availabilityResponse.ok) {
        setMessage(availabilityData.error ?? "No se pudo cargar disponibilidad.");
        return;
      }

      setAvailability(availabilityData.availability ?? []);

      if (meData.user.role === "ADMIN") {
        const doctorsResponse = await fetch("/api/admin/doctors", {
          credentials: "include",
        });

        const doctorsData = await doctorsResponse.json();

        if (!doctorsResponse.ok) {
          setMessage(doctorsData.error ?? "No se pudo cargar médicos.");
          return;
        }

        setDoctors(doctorsData.doctors ?? []);
      }

      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Error inesperado"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const startTime = new Date(`${form.date}T${form.startHour}`);

      const endTime = new Date(startTime.getTime() + Number(form.durationMinutes) * 60 * 1000)

      const response = await fetch(
        "/api/availability",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            doctorId: form.doctorId,
            date: form.date,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          }),
        }
      );

      const data = await response.json();

      setMessage(
        response.ok
          ? "Horario creado correctamente."
          : data.error
      );

      if (response.ok) {
        await loadData();
      }
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
      void loadData();
    });
  }, []);

  const bookedCount = availability.filter(
    (slot) => slot.isBooked
  ).length;

  const freeCount =
    availability.length - bookedCount;

  return (
    <DashboardShell
      role={user?.role}
      user={user}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Disponibilidad
          </h1>

          <p className="mt-3 text-slate-500">
            Gestiona horarios medicos y disponibilidad.
          </p>
        </div>

        <div className="flex gap-4">

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Libres
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-600">
              {freeCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Ocupados
            </p>

            <p className="mt-1 text-3xl font-bold text-red-600">
              {bookedCount}
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">

        <form
          className="
            grid
            h-fit
            gap-4
            rounded-3xl
            bg-white
            p-6
            shadow-sm
          "
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-bold text-slate-900">
            Nuevo horario
          </h2>

          {user?.role === "ADMIN" ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Médico
              </span>

              <select
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                value={form.doctorId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    doctorId: event.target.value,
                  }))
                }
              >
                <option value="">Selecciona un médico</option>

                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <InputField
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
              }))
            }
          />

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Hora de inicio
            </span>

            <input
              type="time"
              step="60"
              value={form.startHour}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startHour: event.target.value,
                }))
              }
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label>
            Duración
            <select
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationMinutes: Number(e.target.value)
                })
              }
            >
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="
              h-12
              rounded-xl
              bg-teal-600
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-teal-700
              disabled:opacity-60
            "
          >
            {loading
              ? "Procesando..."
              : "Crear horario"}
          </button>
        </form>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Horario activo
          </h2>

          {availability.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Fin</th>
                    <th className="px-4 py-3 font-semibold">Médico</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {availability.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(slot.date).toLocaleDateString("es-CO")}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {new Date(slot.startTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {new Date(slot.endTime).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900">
                        {slot.doctor.user.name}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${slot.isBooked
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {slot.isBooked ? "Ocupado" : "Libre"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No hay horarios registrados"
              description="Los horarios creados apareceran en esta seccion."
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}