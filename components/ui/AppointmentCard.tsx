type Appointment = {
  id: string;
  dateTime: string;
  status: string;
  reason: string | null;
  doctor: {
    id: string;
    user: { name: string; email: string };
    specialty: { name: string };
  };
  patient: { name: string; email: string };
};

type AppointmentCardProps = {
  appointment: Appointment;
  userRole: "PACIENTE" | "MEDICO" | "ADMIN";
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  onCancel?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  loading?: boolean;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CONFIRMED: { bg: "bg-green-100", text: "text-green-700" },
  COMPLETED: { bg: "bg-blue-100", text: "text-blue-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

export function AppointmentCard({
  appointment,
  userRole,
  onStatusChange,
  onCancel,
  onReschedule,
  loading = false,
}: AppointmentCardProps) {
  const colors = STATUS_COLORS[appointment.status] || STATUS_COLORS.PENDING;
  const appointmentDate = new Date(appointment.dateTime);
  const dateStr = appointmentDate.toLocaleDateString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = appointmentDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded border border-zinc-300 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {userRole === "PACIENTE" ? (
            <div>
              <h3 className="font-semibold">Dr/a. {appointment.doctor.user.name}</h3>
              <p className="text-sm text-zinc-600">
                {appointment.doctor.specialty.name}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold">Paciente: {appointment.patient.name}</h3>
              <p className="text-sm text-zinc-600">{appointment.patient.email}</p>
            </div>
          )}
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-zinc-200 pt-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">FECHA Y HORA</p>
          <p className="text-sm font-semibold">
            {dateStr} a las {timeStr}
          </p>
        </div>
      </div>

      {appointment.reason && (
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <p className="text-xs font-medium text-zinc-500">MOTIVO</p>
          <p className="text-sm text-zinc-700">{appointment.reason}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
        {userRole === "MEDICO" && appointment.status === "PENDING" && (
          <button
            type="button"
            onClick={() => onStatusChange?.(appointment.id, "CONFIRMED")}
            disabled={loading}
            className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            Confirmar
          </button>
        )}

        {userRole === "MEDICO" &&
          ["PENDING", "CONFIRMED"].includes(appointment.status) && (
            <button
              type="button"
              onClick={() => onStatusChange?.(appointment.id, "COMPLETED")}
              disabled={loading}
              className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              Completar
            </button>
          )}

        {userRole === "PACIENTE" && appointment.status === "PENDING" && (
          <button
            type="button"
            onClick={() => onReschedule?.(appointment.id)}
            disabled={loading}
            className="rounded bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-50"
          >
            Reprogramar
          </button>
        )}

        {["PENDING", "CONFIRMED"].includes(appointment.status) && (
          <button
            type="button"
            onClick={() => onCancel?.(appointment.id)}
            disabled={loading}
            className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}

        <p className="ml-auto text-xs text-zinc-400">{appointment.id}</p>
      </div>
    </article>
  );
}
