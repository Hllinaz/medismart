"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

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
  const [form, setForm] = useState({
    name: "Dra. Demo",
    email: "doctor@demo.com",
    password: "password123",
    specialtyId: "",
    licenseNumber: "MED-001",
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadDoctors() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/doctors", {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);

      if (!response.ok) {
        setMessage(data.error ?? "No se pudieron cargar medicos.");
        return;
      }

      setDoctors(data.doctors ?? []);
      setMessage("Medicos cargados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function loadSpecialties() {
    const response = await fetch("/api/admin/specialties", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok) {
      setSpecialties((data.specialties ?? []).filter((specialty: Specialty) => specialty.isActive));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Medico creado." : data.error);

      if (response.ok) {
        await loadDoctors();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
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
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Medicos</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pantalla admin para crear y listar medicos.
          </p>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <form className="grid h-fit gap-4 border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
            <Field
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            />
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Especialidad
              <select
                className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
                value={form.specialtyId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, specialtyId: event.target.value }))
                }
              >
                <option value="">Selecciona una especialidad</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Licencia"
              value={form.licenseNumber}
              onChange={(value) =>
                setForm((current) => ({ ...current, licenseNumber: value }))
              }
            />
            <FormButton loading={loading}>Crear medico</FormButton>
          </form>

          <div className="grid gap-4">
            <div className="border border-zinc-300 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3">
                <h2 className="font-semibold">Listado</h2>
              </div>
              <div className="divide-y divide-zinc-200">
                {doctors.map((doctor) => (
                  <article className="px-4 py-3" key={doctor.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{doctor.user.name}</h3>
                      <span className="text-xs font-medium text-zinc-500">
                        {doctor.user.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{doctor.user.email}</p>
                    <p className="text-sm text-zinc-600">
                      {doctor.specialties.map((item) => item.specialty.name).join(", ") || "Sin especialidad"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {doctor.licenseNumber ?? "Sin licencia"} - {doctor.id}
                    </p>
                  </article>
                ))}
                {!doctors.length ? (
                  <p className="px-4 py-6 text-sm text-zinc-500">
                    No hay medicos para mostrar.
                  </p>
                ) : null}
              </div>
            </div>

            {result ? <JsonBlock data={result} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
