const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface DoctorUser {
  id: string;
  name: string;
  email: string;
}

interface Specialty {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  licenseNumber: string | null;
  user: DoctorUser;
  specialty: Specialty;
  availabilities: Availability[];
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const grouped = groupByDay(doctor.availabilities);

  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{doctor.user.name}</h3>
          <p className="text-sm text-zinc-500">{doctor.user.email}</p>
          {doctor.licenseNumber && (
            <p className="text-xs text-zinc-400">Lic. {doctor.licenseNumber}</p>
          )}
        </div>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {doctor.specialty.name}
        </span>
      </div>

      {grouped.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-600">Disponibilidad:</p>
          <div className="flex flex-wrap gap-1">
            {grouped.map(({ day, slots }) => (
              <span
                key={day}
                className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
              >
                {dayLabels[day]}: {slots.map((s) => `${s.startTime}-${s.endTime}`).join(", ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {grouped.length === 0 && (
        <p className="text-xs text-zinc-400">Sin horarios disponibles</p>
      )}
    </div>
  );
}

function groupByDay(availabilities: Availability[]) {
  const map = new Map<number, Availability[]>();
  for (const a of availabilities) {
    const arr = map.get(a.dayOfWeek) ?? [];
    arr.push(a);
    map.set(a.dayOfWeek, arr);
  }
  return Array.from(map.entries())
    .map(([day, slots]) => ({ day, slots }))
    .sort((a, b) => a.day - b.day);
}
