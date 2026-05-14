import { useState, useEffect } from "react";

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type AvailabilityCalendarProps = {
  doctorId: string;
  selectedDateTime: string;
  onSelectDateTime: (dateTime: string) => void;
};

const DAYS_OF_WEEK = [
  "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo",
];

export function AvailabilityCalendar({
  doctorId,
  selectedDateTime,
  onSelectDateTime,
}: AvailabilityCalendarProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/doctors/${doctorId}/availability`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) {
          setError("No se pudieron cargar las disponibilidades");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailabilities(data);
        } else if (data !== null) {
          setAvailabilities([]);
        }
      })
      .catch(() => {
        setError("Error inesperado");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [doctorId]);

  useEffect(() => {
    if (!selectedDate || availabilities.length === 0) {
      return;
    }

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const slots = availabilities
      .filter((av) => av.dayOfWeek === adjustedDay && av.isActive)
      .flatMap((av) => {
        const [startHour, startMin] = av.startTime.split(":").map(Number);
        const [endHour, endMin] = av.endTime.split(":").map(Number);

        const result: string[] = [];
        let currentHour = startHour;
        let currentMin = startMin;

        while (
          currentHour < endHour ||
          (currentHour === endHour && currentMin < endMin)
        ) {
          const timeStr = `${String(currentHour).padStart(2, "0")}:${String(
            currentMin
          ).padStart(2, "0")}`;
          result.push(timeStr);

          currentMin += 30;
          if (currentMin >= 60) {
            currentMin -= 60;
            currentHour += 1;
          }
        }

        return result;
      });

    setAvailableSlots([...new Set(slots)].sort());
  }, [selectedDate, availabilities]);

  if (!doctorId) {
    return (
      <div className="rounded border border-dashed border-zinc-300 p-4 text-center">
        <p className="text-sm text-zinc-500">
          Selecciona un medico para ver disponibilidad
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded border border-zinc-300 bg-white p-4 text-center">
        <p className="text-sm text-zinc-500">Cargando disponibilidad...</p>
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="grid gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Selecciona una fecha
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={minDate}
          className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        {selectedDate && (
          <p className="mt-1 text-xs text-zinc-600">
            {DAYS_OF_WEEK[
              new Date(selectedDate).getDay() === 0
                ? 6
                : new Date(selectedDate).getDay() - 1
            ]}
          </p>
        )}
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Horarios disponibles
          </label>
          {availableSlots.length > 0 ? (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => {
                const slotDateTime = `${selectedDate}T${slot}:00`;
                const isSelected = selectedDateTime === slotDateTime;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectDateTime(slotDateTime)}
                    className={`rounded px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "border border-zinc-300 bg-white hover:border-zinc-400"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No hay horarios disponibles para esta fecha
            </p>
          )}
        </div>
      )}
    </div>
  );
}
