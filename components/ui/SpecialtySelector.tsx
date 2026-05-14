import { useState, useEffect } from "react";

type Specialty = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type SpecialtySelectorProps = {
  value: string;
  onChange: (specialtyId: string) => void;
};

export function SpecialtySelector({ value, onChange }: SpecialtySelectorProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecialties() {
      try {
        const response = await fetch("/api/admin/specialties", {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok && data.specialties) {
          setSpecialties(data.specialties.filter((s: Specialty) => s.isActive));
        } else {
          setError("No se pudieron cargar las especialidades");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    loadSpecialties();
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">
        Especialidad
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !!error}
        className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-100"
      >
        <option value="">
          {loading ? "Cargando..." : error ? "Error" : "Selecciona una especialidad"}
        </option>
        {specialties.map((specialty) => (
          <option key={specialty.id} value={specialty.id}>
            {specialty.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
