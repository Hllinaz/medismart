"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";
type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  role: Role;
  status: UserStatus;
};

type DashboardSummary = {
  role: Role;
  doctor?: {
    licenseNumber: string | null;
    active: boolean;
    specialties: Array<{
      id: string;
      name: string;
      description: string | null;
    }>;
  };
};

const roleLabels: Record<Role, string> = {
  PACIENTE: "Paciente",
  MEDICO: "Médico",
  ADMIN: "Administrador",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  BLOCKED: "Bloqueado",
};

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-amber-50 text-amber-700",
  BLOCKED: "bg-red-50 text-red-700",
};

function formatDate(value?: string | null) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  return new Date(value).toISOString().slice(0, 10);
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);

    try {
      const [meResponse, summaryResponse] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/dashboard/summary", { credentials: "include" }),
      ]);

      const meData = await meResponse.json();
      const summaryData = await summaryResponse.json();

      if (!meResponse.ok) {
        setMessage(meData.error ?? "No se pudo cargar el perfil.");
        return;
      }

      setUser(meData.user);
      setForm({
        name: meData.user.name ?? "",
        phone: meData.user.phone ?? "",
        dateOfBirth: toDateInputValue(meData.user.dateOfBirth),
      });

      if (summaryResponse.ok) {
        setSummary(summaryData.summary);
      }

      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (!isEditing) {
      setIsEditing(true);
      setMessage(null);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo actualizar el perfil.");
        return;
      }

      setUser(data.user);
      setForm({
        name: data.user.name ?? "",
        phone: data.user.phone ?? "",
        dateOfBirth: toDateInputValue(data.user.dateOfBirth),
      });
      setIsEditing(false);
      setMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
    router.refresh();
  }

  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "MS";

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Perfil</h1>
        <p className="mt-3 text-slate-500">
          Consulta y actualiza la información básica de tu cuenta.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-teal-100 text-3xl font-bold text-teal-700">
              {initials}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-3xl font-bold text-slate-900">
                {loading ? "Cargando..." : user?.name}
              </h2>
              <p className="mt-2 truncate text-slate-500">{user?.email}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                  {user?.role ? roleLabels[user.role] : "Rol"}
                </span>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    user?.status ? statusStyles[user.status] : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {user?.status ? statusLabels[user.status] : "Estado"}
                </span>
              </div>
            </div>
          </div>

          <form className="mt-10 grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Nombre completo"
                value={form.name}
                disabled={!isEditing}
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
              />

              <ReadOnlyField label="Correo electrónico" value={user?.email ?? "--"} />

              <InputField
                label="Número telefónico"
                value={form.phone}
                disabled={!isEditing}
                onChange={(value) =>
                  setForm((current) => ({ ...current, phone: value }))
                }
              />

              <InputField
                label="Fecha de nacimiento"
                type="date"
                value={form.dateOfBirth}
                disabled={!isEditing}
                onChange={(value) =>
                  setForm((current) => ({ ...current, dateOfBirth: value }))
                }
              />

              <ReadOnlyField
                label="Rol del sistema"
                value={user?.role ? roleLabels[user.role] : "--"}
              />

              <ReadOnlyField
                label="Estado de la cuenta"
                value={user?.status ? statusLabels[user.status] : "--"}
              />
            </div>

            <button
              type="submit"
              disabled={saving || !user}
              className="h-12 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Editar"}
            </button>
          </form>
        </section>

        <aside className="grid h-fit gap-6">
          <RolePanel user={user} summary={summary} />

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Seguridad de cuenta
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Tu sesión se administra mediante una cookie segura httpOnly.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Estado actual
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  user?.status === "BLOCKED"
                    ? "text-red-600"
                    : user?.status === "INACTIVE"
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {user?.status ? statusLabels[user.status] : "Cargando"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-6 h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

function RolePanel({
  user,
  summary,
}: {
  user: AuthUser | null;
  summary: DashboardSummary | null;
}) {
  if (user?.role === "MEDICO") {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Perfil médico</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Información profesional configurada por administración.
        </p>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Registro médico</p>
          <p className="mt-2 font-bold text-slate-900">
            {summary?.doctor?.licenseNumber ?? "No registrado"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {summary?.doctor?.specialties.length ? (
            summary.doctor.specialties.map((specialty) => (
              <span
                key={specialty.id}
                className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700"
              >
                {specialty.name}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Sin especialidades
            </span>
          )}
        </div>
      </section>
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Permisos administrativos</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Tu cuenta puede gestionar médicos, especialidades, disponibilidad y reportes.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Perfil de paciente</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Tus datos se usan para identificar citas, historial y notificaciones médicas.
      </p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">Fecha registrada</p>
        <p className="mt-2 font-bold text-slate-900">
          {formatDate(user?.dateOfBirth)}
        </p>
      </div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-default disabled:opacity-100 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
        <p className="truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
