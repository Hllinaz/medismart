"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";

type Specialty = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function SpecialtiesPage() {
  const [form, setForm] = useState({ name: "", description: "" });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadSpecialties() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/specialties", {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok && data.specialties) {
        setSpecialties(data.specialties);
      } else {
        setMessage(data.error ?? "Error al cargar especialidades");
      }
    } catch {
      setMessage("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/specialties/${editingId}`
        : "/api/admin/specialties";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(editingId ? "Especialidad actualizada." : "Especialidad creada.");
        setForm({ name: "", description: "" });
        setEditingId(null);
        await loadSpecialties();
      } else {
        setMessage(data.error ?? "Error al guardar");
      }
    } catch {
      setMessage("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(specialty: Specialty) {
    setForm({ name: specialty.name, description: specialty.description ?? "" });
    setEditingId(specialty.id);
  }

  function handleCancelEdit() {
    setForm({ name: "", description: "" });
    setEditingId(null);
  }

  async function handleToggle(specialty: Specialty) {
    try {
      const response = await fetch(`/api/admin/specialties/${specialty.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !specialty.isActive }),
      });
      if (response.ok) {
        await loadSpecialties();
      }
    } catch {
      setMessage("Error al cambiar estado");
    }
  }

  useEffect(() => {
    fetch("/api/admin/specialties", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.specialties) {
          setSpecialties(data.specialties);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Especialidades</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestiona las especialidades medicas del sistema.
        </p>
      </div>

      {message ? (
        <Message type="info">{message}</Message>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form className="rounded border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
          <h2 className="mb-4 font-semibold text-zinc-900">
            {editingId ? "Editar especialidad" : "Nueva especialidad"}
          </h2>
          <div className="grid gap-4">
            <Field
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Ej: Cardiologia"
            />
            <Field
              label="Descripcion"
              value={form.description}
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
              placeholder="Descripcion de la especialidad"
              multiline
            />
            <div className="flex gap-2">
              <FormButton loading={loading}>
                {editingId ? "Actualizar" : "Crear"}
              </FormButton>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="rounded border border-zinc-300 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="font-semibold text-zinc-900">
              Listado ({specialties.length})
            </h2>
          </div>
          <div className="divide-y divide-zinc-200">
            {specialties.map((specialty) => (
              <div key={specialty.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{specialty.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {specialty.description ?? "Sin descripcion"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        specialty.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {specialty.isActive ? "Activa" : "Inactiva"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(specialty)}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(specialty)}
                      className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      {specialty.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {specialties.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">
                No hay especialidades registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
