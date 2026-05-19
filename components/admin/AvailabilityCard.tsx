type AvailabilityCardProps = {
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    doctor: {
      user: {
        name: string;
        email: string;
      };
    };
  };
};

export function AvailabilityCard({
  slot,
}: AvailabilityCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {slot.doctor.user.name}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {slot.doctor.user.email}
          </p>

          <div className="mt-5 grid gap-1 text-sm text-slate-600">
            <p>
              Fecha:
              {" "}
              {new Date(
                slot.date
              ).toLocaleDateString()}
            </p>

            <p>
              Inicio:
              {" "}
              {new Date(
                slot.startTime
              ).toLocaleString()}
            </p>

            <p>
              Fin:
              {" "}
              {new Date(
                slot.endTime
              ).toLocaleString()}
            </p>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            {slot.id}
          </p>
        </div>

        <span
          className={`
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
            ${
              slot.isBooked
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }
          `}
        >
          {slot.isBooked
            ? "Ocupado"
            : "Libre"}
        </span>
      </div>
    </article>
  );
}