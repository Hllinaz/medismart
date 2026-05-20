"use client";

import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SpecialtyPickerModal } from "@/components/admin/SpecialtyPickerModal";
import { DoctorsTable } from "@/components/admin/DoctorsTable";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Doctor = {
  id: string;
  licenseNumber: string | null;

  user: {
    name: string;
    email: string;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  };

  specialties: Array<{
    specialty: {
      name: string;
    };
  }>;
};

type Specialty = {
  id: string;
  name: string;
  isActive: boolean;
};

export default function DoctorsPage() {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [form, setForm] = useState({
    name: "Dra. Demo",
    email: "doctor@demo.com",
    password: "password123",
    specialtyIds: [] as string[],
    licenseNumber: "MED-2026-001",
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);

  async function loadDoctors() {
    setLoading(true);

    try {
      const [meResponse, doctorsResponse] =
        await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
          }),

          fetch("/api/admin/doctors", {
            credentials: "include",
          }),
        ]);

      const meData = await meResponse.json();

      const doctorsData =
        await doctorsResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!doctorsResponse.ok) {
        setMessage(
          doctorsData.error ??
          "No se pudieron cargar medicos."
        );

        return;
      }

      setDoctors(doctorsData.doctors ?? []);

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

  async function loadSpecialties() {
    const response = await fetch(
      "/api/admin/specialties",
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok) {
      setSpecialties(
        (data.specialties ?? []).filter(
          (specialty: Specialty) =>
            specialty.isActive
        )
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/doctors",
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
          ? "Medico creado correctamente."
          : data.error
      );

      if (response.ok) {
        setForm({
          name: "",
          email: "",
          password: "",
          specialtyIds: [],
          licenseNumber: "",
        });

        await loadDoctors();
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
      void loadDoctors();
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
            Medicos
          </h1>

          <p className="mt-3 text-slate-500">
            Gestiona el personal medico del sistema.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total medicos
          </p>

          <p className="mt-1 text-3xl font-bold text-teal-700">
            {doctors.length}
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
            Nuevo medico
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

          <InputField
            label="Correo"
            type="email"
            value={form.email}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                email: value,
              }))
            }
          />

          <InputField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                password: value,
              }))
            }
          />

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Especialidades
            </span>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {form.specialtyIds.length ? (
                form.specialtyIds.map((id) => {
                  const specialty = specialties.find((item) => item.id === id);

                  if (!specialty) return null;

                  return (
                    <span
                      key={id}
                      className="rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
                    >
                      {specialty.name}
                    </span>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  No has seleccionado especialidades.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSpecialtyModal(true)}
              className="h-11 rounded-xl border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
            >
              + Agregar especialidades
            </button>
          </div>

          <InputField
            label="Licencia"
            value={form.licenseNumber}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                licenseNumber: value,
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
              : "Crear medico"}
          </button>
        </form>

        <section>
          {doctors.length ? (
            <DoctorsTable doctors={doctors} />
          ) : (
            <EmptyState
              title="No hay médicos registrados"
              description="Cuando agregues médicos, aparecerán en esta sección."
            />
          )}
        </section>
      </div>

      {showSpecialtyModal ? (
        <SpecialtyPickerModal
          specialties={specialties}
          selectedIds={form.specialtyIds}
          onClose={() => setShowSpecialtyModal(false)}
          onSave={(selectedIds) => {
            setForm((current) => ({
              ...current,
              specialtyIds: selectedIds,
            }));
            setShowSpecialtyModal(false);
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}