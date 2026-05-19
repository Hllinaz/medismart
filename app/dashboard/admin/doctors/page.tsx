"use client";

import { FormEvent, useEffect, useState } from "react";

import { DoctorCard } from "@/components/admin/DoctorCard";
import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
    specialtyId: "",
    licenseNumber: "MED-001",
  });

  const [doctors, setDoctors] = useState<
    Doctor[]
  >([]);

  const [specialties, setSpecialties] =
    useState<Specialty[]>([]);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(false);

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

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Especialidad
            </span>

            <select
              className="
                h-12
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                text-sm
                outline-none
                transition
                focus:border-teal-500
                focus:bg-white
                focus:ring-4
                focus:ring-teal-100
              "
              value={form.specialtyId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  specialtyId:
                    event.target.value,
                }))
              }
            >
              <option value="">
                Selecciona una especialidad
              </option>

              {specialties.map(
                (specialty) => (
                  <option
                    key={specialty.id}
                    value={specialty.id}
                  >
                    {specialty.name}
                  </option>
                )
              )}
            </select>
          </label>

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

        <section className="grid gap-4">
          {doctors.length ? (
            doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
              />
            ))
          ) : (
            <EmptyState
              title="No hay medicos registrados"
              description="Cuando agregues medicos, apareceran en esta seccion."
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
        className="
          h-12
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          text-sm
          outline-none
          transition
          focus:border-teal-500
          focus:bg-white
          focus:ring-4
          focus:ring-teal-100
        "
      />
    </label>
  );
}