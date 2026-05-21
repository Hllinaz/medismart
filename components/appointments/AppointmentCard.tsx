import { StatusBadge } from "@/components/appointments/StatusBadge";

type AppointmentCardProps = {
  appointment: {
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
      user: { name: string };
    };
    doctor: {
      user: { name: string };
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

            <StatusBadge status={appointment.status} />

            {appointment.wasReassigned ? (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                REASSIGNED
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Paciente: {appointment.patient.user.name}
          </p>

          <div className="mt-2">
            <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
              Especialidad: {appointment.specialty?.name ?? "No especificada"}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
            Síntomas: {appointment.symptoms?.trim() || "No registrados"}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {new Date(appointment.appointmentDate).toLocaleString()}
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