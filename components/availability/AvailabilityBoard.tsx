"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/appointments/EmptyState";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
    status: string;
  };
  specialties?: Array<{
    specialty: {
      id: string;
      name: string;
    };
  }>;
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  doctor: Doctor;
};

type AvailabilityBoardProps = {
  availability: Availability[];
  doctors: Doctor[];
  role?: Role;
};

type StatusFilter = "ALL" | "FREE" | "BOOKED";

export function AvailabilityBoard({
  availability,
  doctors,
  role,
}: AvailabilityBoardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const specialties = useMemo(() => {
    const names = new Set<string>();

    for (const slot of availability) {
      for (const item of slot.doctor.specialties ?? []) {
        names.add(item.specialty.name);
      }
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
  }, [availability]);

  const filteredAvailability = useMemo(() => {
    return availability.filter((slot) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "FREE" && !slot.isBooked) ||
        (statusFilter === "BOOKED" && slot.isBooked);

      const matchesDoctor = !doctorFilter || slot.doctor.id === doctorFilter;

      const matchesSpecialty =
        !specialtyFilter ||
        slot.doctor.specialties?.some(
          (item) => item.specialty.name === specialtyFilter,
        );

      const matchesDate =
        !dateFilter || toDateInputValue(slot.date) === dateFilter;

      return matchesStatus && matchesDoctor && matchesSpecialty && matchesDate;
    });
  }, [availability, dateFilter, doctorFilter, specialtyFilter, statusFilter]);

  const groupedAvailability = useMemo(() => {
    const groups = new Map<string, Availability[]>();

    for (const slot of filteredAvailability) {
      const key = toDateInputValue(slot.date);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }

    return Array.from(groups.entries())
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, slots]) => ({
        date,
        slots: slots.sort(
          (first, second) =>
            new Date(first.startTime).getTime() -
            new Date(second.startTime).getTime(),
        ),
      }));
  }, [filteredAvailability]);

  const freeCount = filteredAvailability.filter((slot) => !slot.isBooked).length;
  const bookedCount = filteredAvailability.length - freeCount;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cupos de atención
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Revisa los bloques publicados por fecha, médico, especialidad y
            estado.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Total" value={filteredAvailability.length} />
          <Metric label="Libres" value={freeCount} tone="emerald" />
          <Metric label="Ocupados" value={bookedCount} tone="red" />
        </div>
      </div>

      <div
        className={`mb-6 grid gap-3 ${
          role === "ADMIN"
            ? "md:grid-cols-2 xl:grid-cols-[150px_minmax(180px,240px)_minmax(180px,1fr)_180px]"
            : "md:grid-cols-3 xl:grid-cols-[150px_minmax(180px,1fr)_180px]"
        }`}
      >
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-semibold text-slate-700">Estado</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
          >
            <option value="ALL">Todos</option>
            <option value="FREE">Libres</option>
            <option value="BOOKED">Ocupados</option>
          </select>
        </label>

        {role === "ADMIN" ? (
          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-semibold text-slate-700">Médico</span>
            <select
              value={doctorFilter}
              onChange={(event) => setDoctorFilter(event.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
            >
              <option value="">Todos los médicos</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Especialidad
          </span>
          <select
            value={specialtyFilter}
            onChange={(event) => setSpecialtyFilter(event.target.value)}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
          >
            <option value="">Todas</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-semibold text-slate-700">Fecha</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
          />
        </label>
      </div>

      {groupedAvailability.length ? (
        <div className="grid gap-5">
          {groupedAvailability.map((group) => (
            <div key={group.date} className="rounded-2xl border border-slate-100">
              <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {formatDate(group.date)}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {group.slots.length} cupos publicados
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {group.slots.filter((slot) => !slot.isBooked).length} libres
                </span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
                {group.slots.map((slot) => (
                  <AvailabilitySlotCard key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay cupos para mostrar"
          description="Ajusta los filtros o crea nuevos horarios para verlos en esta sección."
        />
      )}
    </section>
  );
}

function AvailabilitySlotCard({ slot }: { slot: Availability }) {
  const specialties =
    slot.doctor.specialties?.map((item) => item.specialty.name) ?? [];

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-slate-900">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {getDurationLabel(slot.startTime, slot.endTime)}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            slot.isBooked
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {slot.isBooked ? "Ocupado" : "Libre"}
        </span>
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="font-semibold text-slate-900">{slot.doctor.user.name}</p>
        <p className="mt-1 text-sm text-slate-500">{slot.doctor.user.email}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {specialties.length ? (
          specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700"
            >
              {specialty}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Sin especialidad
          </span>
        )}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "emerald" | "red";
}) {
  const toneStyles = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    red: "text-red-600",
  };

  return (
    <div className="min-w-24 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneStyles[tone]}`}>{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDurationLabel(startTime: string, endTime: string) {
  const minutes = Math.round(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000,
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} h`;
}

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
