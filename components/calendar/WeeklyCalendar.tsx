"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/appointments/StatusBadge";

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
  patient: {
    user: {
      name: string;
      email?: string;
    };
  };
  doctor: {
    user: {
      name: string;
    };
  };
};

type WeeklyCalendarProps = {
  appointments: Appointment[];
  availabilities?: Availability[];
  canCancel?: boolean;
  onCancelAppointment?: (appointmentId: string) => Promise<void>;
};

const hours = Array.from({ length: 11 }, (_, index) => index + 8);
const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getAppointmentClass(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "bg-teal-600 text-white";
    case "CANCELLED":
      return "bg-slate-200 text-slate-600";
    case "COMPLETED":
      return "bg-blue-600 text-white";
    case "PENDING_REASSIGNMENT":
      return "bg-amber-400 text-amber-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function WeeklyCalendar({
  appointments,
  availabilities = [],
  canCancel = false,
  onCancelAppointment,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const today = new Date();
  const currentHour = today.getHours();

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  function getAppointment(day: Date, hour: number) {
    return appointments.find((appointment) => {
      const date = new Date(appointment.appointmentDate);
      return sameDay(date, day) && date.getHours() === hour;
    });
  }

  function getAvailability(day: Date, hour: number) {
    return availabilities.find((availability) => {
      const date = new Date(availability.startTime);
      return sameDay(date, day) && date.getHours() === hour;
    });
  }

  async function handleCancel() {
    if (!selected || !onCancelAppointment) return;

    setCancelling(true);

    try {
      await onCancelAppointment(selected.id);
      setSelected(null);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Calendario semanal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Vista organizada por día, hora, disponibilidad y estado de cita.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold">
        <Legend color="bg-emerald-100 border-emerald-300" label="Disponible" />
        <Legend color="bg-teal-600" label="Programada" />
        <Legend color="bg-slate-300" label="Cancelada" />
        <Legend color="bg-blue-600" label="Completada" />
        <Legend color="bg-amber-400" label="Pendiente" />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-225">
          <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b border-slate-200">
            <div />

            {days.map((day) => {
              const isToday = sameDay(day, today);

              return (
                <div key={day.toISOString()} className="px-3 py-4 text-center">
                  <div
                    className={
                      isToday
                        ? "mx-auto max-w-20 rounded-2xl bg-teal-50 px-3 py-2"
                        : ""
                    }
                  >
                    <p
                      className={
                        isToday
                          ? "text-sm font-bold text-teal-700"
                          : "text-sm font-bold text-slate-900"
                      }
                    >
                      {dayNames[day.getDay()]}
                    </p>

                    <p
                      className={
                        isToday
                          ? "mt-1 text-sm font-bold text-teal-700"
                          : "mt-1 text-sm text-slate-500"
                      }
                    >
                      {day.getDate()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {hours.map((hour) => {
            const isCurrentHour = hour === currentHour;

            return (
              <div
                key={hour}
                className="grid min-h-24 grid-cols-[90px_repeat(7,1fr)] border-b border-slate-200/70"
              >
                <div
                  className={
                    isCurrentHour
                      ? "px-3 py-4 text-sm font-bold text-teal-600"
                      : "px-3 py-4 text-sm font-semibold text-slate-500"
                  }
                >
                  {hour}:00
                </div>

                {days.map((day) => {
                  const appointment = getAppointment(day, hour);
                  const availability = getAvailability(day, hour);

                  return (
                    <button
                      key={`${day.toISOString()}-${hour}`}
                      type="button"
                      onClick={() => appointment && setSelected(appointment)}
                      className="border-l border-slate-200/70 p-2 text-left transition hover:bg-slate-50"
                    >
                      {appointment ? (
                        <div
                          className={`rounded-2xl p-3 shadow-sm transition hover:scale-[1.02] hover:shadow-lg ${getAppointmentClass(
                            appointment.status,
                          )}`}
                        >
                          <p className="truncate text-sm font-bold">
                            {appointment.patient.user.name}
                          </p>

                          <p className="mt-1 text-xs opacity-80">
                            {new Date(
                              appointment.appointmentDate,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          <div className="mt-2">
                            <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold">
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      ) : availability && !availability.isBooked ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                          <p className="text-sm font-bold">Disponible</p>
                          <p className="mt-1 text-xs">
                            {new Date(availability.startTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Detalles de la cita
                </h3>
                <p className="mt-2 text-sm text-slate-500">{selected.id}</p>
              </div>

              <StatusBadge status={selected.status} />
            </div>

            <div className="grid gap-4 text-sm">
              <Info label="Paciente" value={selected.patient.user.name} />
              <Info
                label="Correo"
                value={selected.patient.user.email ?? "No disponible"}
              />
              <Info
                label="Fecha"
                value={new Date(selected.appointmentDate).toLocaleString()}
              />
              <Info label="Prioridad" value={selected.priority} />
            </div>

            {canCancel && selected.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-6 h-11 w-full rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelando..." : "Cancelar cita"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 h-11 w-full rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span className={`h-3 w-3 rounded-full border ${color}`} />
      <span>{label}</span>
    </div>
  );
}