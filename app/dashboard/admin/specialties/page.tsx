"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type Specialty = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function SpecialtiesPage() {
  const [form, setForm] = useState({
    name: "Medicina General",
    description: "Atencion primaria y consulta general",
  });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSpecialties() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/specialties", {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);

      if (!response.ok) {
        setMessage(data.error ?? "No se pudieron cargar especialidades.");
        return;
      }

      setSpecialties(data.specialties ?? []);
      setMessage("Especialidades cargadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/specialties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Especialidad creada." : data.error);

      if (response.ok) {
        await loadSpecialties();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
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
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Especialidades</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pantalla admin para crear y listar especialidades.
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
              label="Descripcion"
              value={form.description}
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
            />
            <FormButton loading={loading}>Crear especialidad</FormButton>
          </form>

          <div className="grid gap-4">
            <div className="border border-zinc-300 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3">
                <h2 className="font-semibold">Listado</h2>
              </div>
              <div className="divide-y divide-zinc-200">
                {specialties.map((specialty) => (
                  <article className="px-4 py-3" key={specialty.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{specialty.name}</h3>
                      <span className="text-xs font-medium text-zinc-500">
                        {specialty.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {specialty.description ?? "Sin descripcion"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{specialty.id}</p>
                  </article>
                ))}
                {!specialties.length ? (
                  <p className="px-4 py-6 text-sm text-zinc-500">
                    No hay especialidades para mostrar.
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
