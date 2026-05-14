"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoctorCard } from "@/components/ui/DoctorCard";

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Doctor {
  id: string;
  licenseNumber: string | null;
  user: { id: string; name: string; email: string };
  specialty: { id: string; name: string };
  availabilities: Availability[];
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => setDoctors(data.doctors ?? []))
      .finally(() => setLoading(false));
  }, []);

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty.name))).sort();

  const filtered = selectedSpecialty
    ? doctors.filter((d) => d.specialty.name === selectedSpecialty)
    : doctors;

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando doctores...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Doctores</h1>
          <p className="text-sm text-zinc-500">
            {filtered.length} doctor{filtered.length !== 1 ? "es" : ""} disponible{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700"
        >
          <option value="">Todas las especialidades</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No se encontraron doctores.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doctor) => (
            <Link key={doctor.id} href={`/dashboard/appointments/new?doctorId=${doctor.id}`}>
              <DoctorCard doctor={doctor} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
