"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/appointments/EmptyState";
import { SpecialtyCard } from "@/components/admin/SpecialtyCard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Specialty = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function SpecialtiesPage() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [form, setForm] = useState({
    name: "Medicina General",

    description:
      "Atencion primaria y consulta general",
  });

  const [specialties, setSpecialties] =
    useState<Specialty[]>([]);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);

  async function loadSpecialties() {
    setLoading(true);

    try {
      const [meResponse, specialtiesResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
          }),

          fetch("/api/admin/specialties", {
            credentials: "include",
          }),
        ]);

      const meData = await meResponse.json();

      const specialtiesData =
        await specialtiesResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!specialtiesResponse.ok) {
        setMessage(
          specialtiesData.error ??
            "No se pudieron cargar especialidades."
        );

        return;
      }

      setSpecialties(
        specialtiesData.specialties ?? []
      );

      setMessage(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Error inesperado"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/specialties",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      setMessage(
        response.ok
          ? "Especialidad creada correctamente."
          : data.error
      );

      if (response.ok) {
        await loadSpecialties();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Error inesperado"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadSpecialties();
    });
  }, []);

  return (
    <DashboardShell
      role={user?.role}
      user={user}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Especialidades
          </h1>

          <p className="mt-3 text-slate-500">
            Gestiona las especialidades medicas del sistema.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total especialidades
          </p>

          <p className="mt-1 text-3xl font-bold text-teal-700">
            {specialties.length}
          </p>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        
        <form
          className="
            grid
            h-fit
            gap-4
            rounded-3xl
            bg-white
            p-6
            shadow-sm
          "
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-bold text-slate-900">
            Nueva especialidad
          </h2>

          <InputField
            label="Nombre"
            value={form.name}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                name: value,
              }))
            }
          />

          <TextAreaField
            label="Descripcion"
            value={form.description}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                description: value,
              }))
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="
              h-12
              rounded-xl
              bg-teal-600
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-teal-700
              disabled:opacity-60
            "
          >
            {loading
              ? "Procesando..."
              : "Crear especialidad"}
          </button>
        </form>

        <section className="grid gap-4">
          {specialties.length ? (
            specialties.map((specialty) => (
              <SpecialtyCard
                key={specialty.id}
                specialty={specialty}
              />
            ))
          ) : (
            <EmptyState
              title="No hay especialidades registradas"
              description="Las especialidades creadas apareceran en esta seccion."
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={5}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}