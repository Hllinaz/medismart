import { useState, useEffect } from "react";

type Doctor = {
  id: string;
  licenseNumber: string | null;
  specialtyId?: string;
  user: { name: string; email: string };
  specialty: { id: string; name: string };
};

type DoctorListProps = {
  specialtyId: string;
  selectedDoctorId: string;
  onSelectDoctor: (doctorId: string, doctorName?: string) => void;
};

export function DoctorList({
  specialtyId,
  selectedDoctorId,
  onSelectDoctor,
}: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!specialtyId) return;

    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch("/api/doctors", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.doctors) {
          const filtered = data.doctors.filter(
            (d: Doctor) => d.specialty.id === specialtyId
          );
          setDoctors(filtered);
        } else {
          setError("No se pudieron cargar los medicos");
        }
      })
      .catch(() => {
        setError("Error inesperado");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [specialtyId]);

  if (!specialtyId) {
    return (
      <div className="rounded border border-dashed border-zinc-300 p-4 text-center">
        <p className="text-sm text-zinc-500">
          Selecciona una especialidad para ver medicos
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded border border-zinc-300 bg-white p-4 text-center">
        <p className="text-sm text-zinc-500">Cargando medicos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {doctors.length > 0 ? (
        doctors.map((doctor) => (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onSelectDoctor(doctor.id, doctor.user.name)}
            className={`rounded border px-4 py-3 text-left transition ${
              selectedDoctorId === doctor.id
                ? "border-blue-500 bg-blue-50"
                : "border-zinc-300 bg-white hover:border-zinc-400"
            }`}
          >
            <h4 className="font-semibold">{doctor.user.name}</h4>
            <p className="text-xs text-zinc-600">{doctor.user.email}</p>
            <p className="text-xs text-zinc-500">
              {doctor.specialty.name}
              {doctor.licenseNumber && ` • ${doctor.licenseNumber}`}
            </p>
          </button>
        ))
      ) : (
        <div className="rounded border border-dashed border-zinc-300 p-4 text-center">
          <p className="text-sm text-zinc-500">
            No hay medicos disponibles en esta especialidad
          </p>
        </div>
      )}
    </div>
  );
}
