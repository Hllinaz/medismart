"use client";

import { FormEvent, useEffect, useState } from "react";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";

type Doctor = {
  id: string;
  licenseNumber: string | null;
  specialtyId: string;
  user: { name: string; email: string; isActive: boolean };
  specialty: { id: string; name: string };
};

type Specialty = {
  id: string;
  name: string;
  isActive: boolean;
};

export default function DoctorsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialtyId: "",
    licenseNumber: "",
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/doctors/${editingId}`
        : "/api/admin/doctors";
      const method = editingId ? "PUT" : "POST";
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        specialtyId: form.specialtyId,
        licenseNumber: form.licenseNumber,
      };
      if (!editingId) body.password = form.password;

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(editingId ? "Medico actualizado." : "Medico creado.");
        setMessageType("info");
        setForm({ name: "", email: "", password: "", specialtyId: "", licenseNumber: "" });
        setEditingId(null);
        await reloadDoctors();
      } else {
        setMessage(data.error ?? "Error al guardar");
        setMessageType("error");
      }
    } catch {
      setMessage("Error inesperado");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(doctor: Doctor) {
    setForm({
      name: doctor.user.name,
      email: doctor.user.email,
      password: "",
      specialtyId: doctor.specialtyId,
      licenseNumber: doctor.licenseNumber ?? "",
    });
    setEditingId(doctor.id);
  }

  function handleCancelEdit() {
    setForm({ name: "", email: "", password: "", specialtyId: "", licenseNumber: "" });
    setEditingId(null);
  }

  async function handleToggle(doctor: Doctor) {
    try {
      const response = await fetch(`/api/admin/doctors/${doctor.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doctor.user.isActive }),
      });
      if (response.ok) {
        await reloadDoctors();
      }
    } catch {
      setMessage("Error al cambiar estado");
      setMessageType("error");
    }
  }

  async function reloadDoctors() {
    try {
      const response = await fetch("/api/admin/doctors", { credentials: "include" });
      const data = await response.json();
      if (data.doctors) setDoctors(data.doctors);
    } catch {}
  }

  useEffect(() => {
    fetch("/api/admin/specialties", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.specialties) {
          setSpecialties(data.specialties.filter((s: Specialty) => s.isActive));
        }
      })
      .catch(() => {});

    fetch("/api/admin/doctors", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.doctors) {
          setDoctors(data.doctors);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Medicos</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Administra los medicos registrados en el sistema.
        </p>
      </div>

      {message ? (
        <Message type={messageType === "error" ? "error" : "info"}>
          {message}
        </Message>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form className="rounded border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
          <h2 className="mb-4 font-semibold text-zinc-900">
            {editingId ? "Editar medico" : "Nuevo medico"}
          </h2>
          <div className="grid gap-4">
            <Field
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Nombre del medico"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder="medico@correo.com"
            />
            {!editingId && (
              <Field
                label="Contrasena"
                type="password"
                value={form.password}
                onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                placeholder="Contrasena temporal"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Especialidad
              </label>
              <select
                value={form.specialtyId}
                onChange={(e) =>
                  setForm((current) => ({ ...current, specialtyId: e.target.value }))
                }
                className="mt-1 w-full border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecciona una especialidad</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Numero de licencia"
              value={form.licenseNumber}
              onChange={(value) =>
                setForm((current) => ({ ...current, licenseNumber: value }))
              }
              placeholder="Ej: MED-001"
            />
            <div className="flex gap-2">
              <FormButton loading={loading}>
                {editingId ? "Actualizar" : "Crear medico"}
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
              Listado ({doctors.length})
            </h2>
          </div>
          <div className="divide-y divide-zinc-200">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900">
                      {doctor.user.name}
                    </h3>
                    <p className="text-sm text-zinc-600">{doctor.user.email}</p>
                    <p className="text-sm text-zinc-600">
                      {doctor.specialty.name}
                      {doctor.licenseNumber && ` • ${doctor.licenseNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        doctor.user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {doctor.user.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(doctor)}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(doctor)}
                      className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      {doctor.user.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <p className="px-4 py-6 text-sm text-zinc-500">
                No hay medicos registrados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
