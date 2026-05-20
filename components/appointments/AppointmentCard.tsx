import { StatusBadge } from "@/components/appointments/StatusBadge";

type AppointmentCardProps = {
  appointment: {
    id: string;
    appointmentDate: string;
    status: string;
    priority: string;
    patient: {
      user: { name: string; };
    };
    doctor: {
      user: { name: string; };
    };
  };

  loading?: boolean;

  onCancel?: () => void;
  onEvaluate?: () => void;
};

export function AppointmentCard({
  appointment,
  loading = false,
  onCancel,
  onEvaluate,
}: AppointmentCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">
              {appointment.doctor.user.name}
            </h3>

            <StatusBadge
              status={appointment.status}
            />
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Paciente:
            {" "}
            {appointment.patient.user.name}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {new Date(
              appointment.appointmentDate
            ).toLocaleString()}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            {appointment.id}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {appointment.priority}
          </span>

          {onCancel ? (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}

          {onEvaluate ? (
            <button
              type="button"
              onClick={onEvaluate}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              Evaluar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}