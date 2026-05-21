"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AppointmentStatus =
  | "SCHEDULED"
  | "CANCELLED"
  | "PENDING_REASSIGNMENT"
  | "COMPLETED";

type Priority = "LOW" | "NORMAL" | "HIGH";

type AppointmentSummary = {
  id: string;
  appointmentDate: string;
  status: AppointmentStatus;
  priority: Priority;
  symptoms: string | null;
  patient: {
    user: {
      name: string;
      email: string;
    };
  };
  doctor: {
    user: {
      name: string;
      email: string;
    };
  };
  specialty: {
    id: string;
    name: string;
  } | null;
  evaluation: {
    id: string;
    rating: number;
  } | null;
};

type NotificationSummary = {
  id: string;
  title: string | null;
  message: string;
  type: "REMINDER" | "CANCELLATION" | "REASSIGNMENT" | "SYSTEM";
  isRead: boolean;
  sentDate: string;
};

type AppointmentCounts = {
  scheduled: number;
  cancelled: number;
  pendingReassignment: number;
  completed: number;
};

type BaseSummary = {
  role: Role;
  appointments: AppointmentCounts;
  notifications: NotificationSummary[];
  unreadNotifications: number;
};

type DoctorSummary = BaseSummary & {
  role: "MEDICO";
  doctor: {
    id: string;
    licenseNumber: string | null;
    active: boolean;
    specialties: Array<{
      id: string;
      name: string;
      description: string | null;
    }>;
  };
  availability: {
    free: number;
    booked: number;
  };
  upcomingAppointments: AppointmentSummary[];
};

type PatientSummary = BaseSummary & {
  role: "PACIENTE";
  patient: {
    id: string;
  };
  upcomingAppointments: AppointmentSummary[];
  pendingEvaluations: AppointmentSummary[];
  recentAppointments: AppointmentSummary[];
};

type AdminSummary = BaseSummary & {
  role: "ADMIN";
  users: {
    doctors: number;
    activeDoctors: number;
    patients: number;
  };
  specialties: {
    active: number;
  };
  pendingReassignment: number;
  recentAppointments: AppointmentSummary[];
};

type DashboardSummary = DoctorSummary | PatientSummary | AdminSummary;

const roleLabels: Record<Role, string> = {
  PACIENTE: "Paciente",
  MEDICO: "Médico",
  ADMIN: "Administrador",
};

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CANCELLED: "Cancelada",
  PENDING_REASSIGNMENT: "Pendiente de reasignación",
  COMPLETED: "Completada",
};

const priorityLabels: Record<Priority, string> = {
  HIGH: "Alta",
  NORMAL: "Normal",
  LOW: "Baja",
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [queueResult, setQueueResult] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      const [meResponse, summaryResponse] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/dashboard/summary", { credentials: "include" }),
      ]);

      const meData = await meResponse.json();
      const summaryData = await summaryResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!summaryResponse.ok) {
        setMessage(
          summaryData.error ?? "No se pudo cargar el resumen del dashboard.",
        );
        return;
      }

      setSummary(summaryData.summary);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadDashboard();
    });
  }, []);

  async function handleProcessQueue() {
    try {
      setProcessingQueue(true);
      setQueueResult(null);

      const response = await fetch("/api/appointments/reassign", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error procesando cola");
      }

      setQueueResult(`Se procesaron ${data.count} citas correctamente`);
      await loadDashboard();
      router.refresh();
    } catch (error) {
      console.error(error);
      setQueueResult("Error procesando cola");
    } finally {
      setProcessingQueue(false);
    }
  }

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          {user?.role ? roleLabels[user.role] : "Dashboard"}
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Hola, {user?.name ?? "cargando..."}
        </h1>

        <p className="mt-3 text-slate-500">
          Resumen operativo de tu actividad en MediSmart.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      {summary ? (
        <>
          {summary.role === "MEDICO" ? (
            <DoctorDashboard summary={summary} />
          ) : null}

          {summary.role === "PACIENTE" ? (
            <PatientDashboard summary={summary} />
          ) : null}

          {summary.role === "ADMIN" ? (
            <AdminDashboard
              summary={summary}
              processingQueue={processingQueue}
              queueResult={queueResult}
              onProcessQueue={handleProcessQueue}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          title="Resumen no disponible"
          description="La información aparecerá cuando el sistema termine de cargar tu sesión."
        />
      )}
    </DashboardShell>
  );
}

function DoctorDashboard({ summary }: { summary: DoctorSummary }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Especialidades"
          value={summary.doctor.specialties.length}
          description="Áreas médicas asignadas a tu perfil."
          tone="teal"
        />

        <StatCard
          label="Citas activas"
          value={summary.appointments.scheduled}
          description="Pacientes programados en tu agenda."
          tone="blue"
        />

        <StatCard
          label="Horarios libres"
          value={summary.availability.free}
          description="Disponibilidades futuras sin reservar."
          tone="emerald"
        />

        <StatCard
          label="Notificaciones"
          value={summary.unreadNotifications}
          description="Mensajes sin leer en tu bandeja."
          tone="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DoctorProfileCard summary={summary} />
        <AppointmentList
          title="Próximas citas"
          description="Pacientes programados más cercanos."
          appointments={summary.upcomingAppointments}
          emptyTitle="Sin próximas citas"
          emptyDescription="Cuando tengas citas programadas aparecerán aquí."
          person="patient"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <StatusOverview counts={summary.appointments} />
        <NotificationList notifications={summary.notifications} />
      </section>
    </div>
  );
}

function PatientDashboard({ summary }: { summary: PatientSummary }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Próximas citas"
          value={summary.upcomingAppointments.length}
          description="Atenciones programadas desde hoy."
          tone="teal"
        />

        <StatCard
          label="Completadas"
          value={summary.appointments.completed}
          description="Citas finalizadas en tu historial."
          tone="emerald"
        />

        <StatCard
          label="Por evaluar"
          value={summary.pendingEvaluations.length}
          description="Citas completadas pendientes de calificación."
          tone="blue"
        />

        <StatCard
          label="Notificaciones"
          value={summary.unreadNotifications}
          description="Mensajes sin leer en tu bandeja."
          tone="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AppointmentList
          title="Próximas citas"
          description="Tus atenciones médicas programadas."
          appointments={summary.upcomingAppointments}
          emptyTitle="Sin citas programadas"
          emptyDescription="Cuando agendes una cita aparecerá en este resumen."
          person="doctor"
        />

        <AppointmentList
          title="Pendientes de evaluación"
          description="Citas completadas que aún puedes calificar."
          appointments={summary.pendingEvaluations}
          emptyTitle="Sin evaluaciones pendientes"
          emptyDescription="No tienes citas completadas pendientes por evaluar."
          person="doctor"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AppointmentList
          title="Historial reciente"
          description="Últimos movimientos en tus citas."
          appointments={summary.recentAppointments}
          emptyTitle="Sin historial"
          emptyDescription="Tu historial aparecerá cuando tengas citas registradas."
          person="doctor"
        />

        <NotificationList notifications={summary.notifications} />
      </section>
    </div>
  );
}

function AdminDashboard({
  summary,
  processingQueue,
  queueResult,
  onProcessQueue,
}: {
  summary: AdminSummary;
  processingQueue: boolean;
  queueResult: string | null;
  onProcessQueue: () => void;
}) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Médicos activos"
          value={summary.users.activeDoctors}
          description={`${summary.users.doctors} médicos registrados en total.`}
          tone="teal"
        />

        <StatCard
          label="Pacientes"
          value={summary.users.patients}
          description="Perfiles de paciente registrados."
          tone="blue"
        />

        <StatCard
          label="Especialidades"
          value={summary.specialties.active}
          description="Especialidades activas para atención."
          tone="emerald"
        />

        <StatCard
          label="Reasignación"
          value={summary.pendingReassignment}
          description="Citas esperando una nueva asignación."
          tone="red"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <StatusOverview counts={summary.appointments} />
        <AdminQueueCard
          processingQueue={processingQueue}
          queueResult={queueResult}
          onProcessQueue={onProcessQueue}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AppointmentList
          title="Citas recientes"
          description="Últimas citas registradas en el sistema."
          appointments={summary.recentAppointments}
          emptyTitle="Sin citas registradas"
          emptyDescription="Cuando existan citas aparecerán en este resumen."
          person="both"
        />

        <NotificationList notifications={summary.notifications} />
      </section>
    </div>
  );
}

function DoctorProfileCard({ summary }: { summary: DoctorSummary }) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Perfil médico</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Información profesional configurada por administración.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            summary.doctor.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {summary.doctor.active ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-500">Registro médico</p>
        <p className="mt-2 text-lg font-bold text-slate-900">
          {summary.doctor.licenseNumber ?? "No registrado"}
        </p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Especialidades asignadas
        </p>

        {summary.doctor.specialties.length ? (
          <div className="flex flex-wrap gap-2">
            {summary.doctor.specialties.map((specialty) => (
              <span
                key={specialty.id}
                className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700"
              >
                {specialty.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Aún no tienes especialidades asignadas.
          </p>
        )}
      </div>
    </article>
  );
}

function StatusOverview({ counts }: { counts: AppointmentCounts }) {
  const items = [
    { label: "Programadas", value: counts.scheduled, tone: "bg-blue-500" },
    { label: "Completadas", value: counts.completed, tone: "bg-emerald-500" },
    { label: "Canceladas", value: counts.cancelled, tone: "bg-red-500" },
    {
      label: "Por reasignar",
      value: counts.pendingReassignment,
      tone: "bg-amber-500",
    },
  ];
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Estado de citas</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Distribución de citas según su estado actual.
        </p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-semibold text-slate-800">{item.label}</p>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700">
                {item.value}
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full ${item.tone}`}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function AppointmentList({
  title,
  description,
  appointments,
  emptyTitle,
  emptyDescription,
  person,
}: {
  title: string;
  description: string;
  appointments: AppointmentSummary[];
  emptyTitle: string;
  emptyDescription: string;
  person: "doctor" | "patient" | "both";
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {appointments.length ? (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    {formatAppointmentPerson(appointment, person)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.specialty?.name ?? "Sin especialidad"} ·{" "}
                    {formatDateTime(appointment.appointmentDate)}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {statusLabels[appointment.status]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  Prioridad {priorityLabels[appointment.priority]}
                </span>

                {appointment.evaluation ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    Evaluada {appointment.evaluation.rating}/5
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </article>
  );
}

function NotificationList({
  notifications,
}: {
  notifications: NotificationSummary[];
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Notificaciones recientes
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Últimos avisos enviados por el sistema.
        </p>
      </div>

      {notifications.length ? (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {notification.title ?? notification.message}
                  </p>

                  {notification.title ? (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {notification.message}
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    {formatDateTime(notification.sentDate)}
                  </p>
                </div>

                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    notification.isRead ? "bg-slate-300" : "bg-teal-500"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin notificaciones"
          description="Los avisos recientes aparecerán en este espacio."
        />
      )}
    </article>
  );
}

function AdminQueueCard({
  processingQueue,
  queueResult,
  onProcessQueue,
}: {
  processingQueue: boolean;
  queueResult: string | null;
  onProcessQueue: () => void;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cola de reasignación
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Procesa automáticamente las citas pendientes según prioridad.
          </p>
        </div>

        <button
          onClick={onProcessQueue}
          disabled={processingQueue}
          className="rounded-2xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {processingQueue ? "Procesando..." : "Procesar cola"}
        </button>
      </div>

      {queueResult ? (
        <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          {queueResult}
        </div>
      ) : null}
    </article>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAppointmentPerson(
  appointment: AppointmentSummary,
  person: "doctor" | "patient" | "both",
) {
  if (person === "doctor") {
    return appointment.doctor.user.name;
  }

  if (person === "patient") {
    return appointment.patient.user.name;
  }

  return `${appointment.patient.user.name} con ${appointment.doctor.user.name}`;
}
