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
  canComplete?: boolean;
  onCompleteAppointment?: (appointmentId: string) => Promise<void>;
};

type TimeSlot = {
  hour: number;
  minute: number;
  label: string;
};

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  PENDING_REASSIGNMENT: "Por reasignar",
};

const priorityLabels: Record<string, string> = {
  HIGH: "Alta",
  NORMAL: "Normal",
  LOW: "Baja",
};

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

function sameSlot(date: Date, day: Date, slot: TimeSlot) {
  return sameDay(date, day) && date.getHours() === slot.hour && date.getMinutes() === slot.minute;
}

function getAppointmentClass(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-teal-200 bg-teal-600 text-white";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "COMPLETED":
      return "border-blue-200 bg-blue-600 text-white";
    case "PENDING_REASSIGNMENT":
      return "border-amber-200 bg-amber-100 text-amber-950";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-50 text-red-700";
    case "LOW":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function buildTimeSlots(appointments: Appointment[], availabilities: Availability[]) {
  const dates = [
    ...appointments.map((appointment) => new Date(appointment.appointmentDate)),
    ...availabilities.map((availability) => new Date(availability.startTime)),
    ...availabilities.map((availability) => new Date(availability.endTime)),
  ].filter((date) => !Number.isNaN(date.getTime()));

  const minHour = dates.length
    ? Math.max(6, Math.min(...dates.map((date) => date.getHours())) - 1)
    : 8;
  const maxHour = dates.length
    ? Math.min(22, Math.max(...dates.map((date) => date.getHours())) + 1)
    : 18;

  const slots: TimeSlot[] = [];

  for (let hour = minHour; hour <= maxHour; hour += 1) {
    slots.push({ hour, minute: 0, label: `${String(hour).padStart(2, "0")}:00` });
    slots.push({ hour, minute: 30, label: `${String(hour).padStart(2, "0")}:30` });
  }

  return slots;
}

export function WeeklyCalendar({
  appointments,
  availabilities = [],
  canCancel = false,
  onCancelAppointment,
  canComplete = false,
  onCompleteAppointment,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);

  const today = new Date();

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const weekAppointments = useMemo(
    () =>
      appointments.filter((appointment) =>
        days.some((day) => sameDay(new Date(appointment.appointmentDate), day)),
      ),
    [appointments, days],
  );

  const weekAvailabilities = useMemo(
    () =>
      availabilities.filter((availability) =>
        days.some((day) => sameDay(new Date(availability.startTime), day)),
      ),
    [availabilities, days],
  );

  const timeSlots = useMemo(
    () => buildTimeSlots(weekAppointments, weekAvailabilities),
    [weekAppointments, weekAvailabilities],
  );

  function getAppointments(day: Date, slot: TimeSlot) {
    return weekAppointments.filter((appointment) =>
      sameSlot(new Date(appointment.appointmentDate), day, slot),
    );
  }

  function getAvailability(day: Date, slot: TimeSlot) {
    return weekAvailabilities.find((availability) =>
      sameSlot(new Date(availability.startTime), day, slot),
    );
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

  async function handleComplete() {
    if (!selected || !onCompleteAppointment) return;

    setCompleting(true);

    try {
      await onCompleteAppointment(selected.id);
      setSelected(null);
    } finally {
      setCompleting(false);
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
            Vista clínica por día, hora, paciente, prioridad y estado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Semana anterior"
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
            aria-label="Semana siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold">
        <Legend color="border-emerald-300 bg-emerald-100" label="Disponible" />
        <Legend color="border-teal-600 bg-teal-600" label="Programada" />
        <Legend color="border-blue-600 bg-blue-600" label="Completada" />
        <Legend color="border-slate-300 bg-slate-300" label="Cancelada" />
        <Legend color="border-amber-400 bg-amber-400" label="Por reasignar" />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1020px]">
          <div className="grid grid-cols-[76px_repeat(7,minmax(124px,1fr))] border-b border-slate-200">
            <div />

            {days.map((day) => {
              const isToday = sameDay(day, today);

              return (
                <div key={day.toISOString()} className="px-2 py-4 text-center">
                  <div
                    className={
                      isToday
                        ? "mx-auto max-w-24 rounded-2xl bg-teal-50 px-3 py-2"
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

          {timeSlots.map((slot) => (
            <div
              key={slot.label}
              className="grid min-h-20 grid-cols-[76px_repeat(7,minmax(124px,1fr))] border-b border-slate-200/70"
            >
              <div className="px-2 py-3 text-xs font-semibold text-slate-500">
                {slot.label}
              </div>

              {days.map((day) => {
                const slotAppointments = getAppointments(day, slot);
                const availability = getAvailability(day, slot);

                return (
                  <div
                    key={`${day.toISOString()}-${slot.label}`}
                    className="min-w-0 overflow-hidden border-l border-slate-200/70 p-2"
                  >
                    <div className="grid min-w-0 gap-2">
                      {slotAppointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => setSelected(appointment)}
                          className={`w-full min-w-0 overflow-hidden rounded-2xl border p-2.5 text-left shadow-sm transition hover:shadow-md ${getAppointmentClass(
                            appointment.status,
                          )}`}
                        >
                          <div className="mb-1.5 min-w-0">
                            <p className="truncate text-sm font-bold leading-5">
                              {appointment.patient.user.name}
                            </p>
                          </div>

                          <p className="truncate text-xs leading-5 opacity-85">
                            {appointment.specialty?.name ?? "Sin especialidad"}
                          </p>

                          <p className="mt-1 text-xs font-semibold opacity-85">
                            {formatTime(appointment.appointmentDate)}
                          </p>

                          <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                            <span className="max-w-full truncate rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold">
                              {statusLabels[appointment.status] ?? appointment.status}
                            </span>

                            <span className="max-w-full truncate rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold">
                              {priorityLabels[appointment.priority] ?? appointment.priority}
                            </span>

                            {appointment.wasReassigned ? (
                              <span className="max-w-full truncate rounded-full bg-yellow-200 px-2 py-1 text-[10px] font-bold text-yellow-900">
                                Reasignada
                              </span>
                            ) : null}
                          </div>
                        </button>
                      ))}

                      {!slotAppointments.length && availability && !availability.isBooked ? (
                        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                          <p className="truncate text-xs font-bold">Disponible</p>
                          <p className="mt-1 truncate text-xs">
                            {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Detalles de la cita
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {selected.patient.user.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {formatFullDate(selected.appointmentDate)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(
                    selected.priority,
                  )}`}
                >
                  Prioridad {priorityLabels[selected.priority] ?? selected.priority}
                </span>
              </div>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <Info label="Correo" value={selected.patient.user.email ?? "No disponible"} />
              <Info label="Especialidad" value={selected.specialty?.name ?? "No especificada"} />
              <Info
                label="Estado"
                value={statusLabels[selected.status] ?? selected.status}
              />
              <Info
                label="Reasignación"
                value={selected.wasReassigned ? "Cita reasignada" : "Sin reasignación"}
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Síntomas</p>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                {selected.symptoms?.trim() || "No registrados"}
              </p>
            </div>

            {canComplete && selected.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="mt-6 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completing ? "Completando..." : "Marcar como completada"}
              </button>
            ) : null}

            {canCancel && selected.status === "SCHEDULED" ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-3 h-11 w-full rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelando..." : "Cancelar cita"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  });
}
