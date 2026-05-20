"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthInput } from "@/components/auth/AuthInput";

export function RegisterForm() {
  const [form, setForm] = useState({
    name: "Paciente Demo",
    email: "paciente@demo.com",
    phone: "3001234567",
    dateOfBirth: "2000-01-01",
    password: "password123",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Cuenta creada correctamente. Ahora puedes iniciar sesion.");
        return;
      }

      setMessage(data.error ?? "No se pudo crear la cuenta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registrate como paciente para gestionar tus citas medicas."
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <AuthInput
          label="Nombre completo"
          value={form.name}
          placeholder="Tu nombre"
          onChange={(value) =>
            setForm((current) => ({ ...current, name: value }))
          }
        />

        <AuthInput
          label="Correo electronico"
          type="email"
          value={form.email}
          placeholder="correo@ejemplo.com"
          onChange={(value) =>
            setForm((current) => ({ ...current, email: value }))
          }
        />

        <AuthInput
          label="Número de teléfono"
          type="tel"
          value={form.phone}
          placeholder="3001234567"
          onChange={(value) =>
            setForm((current) => ({ ...current, phone: value }))
          }
        />

        <AuthInput
          label="Fecha de nacimiento"
          type="date"
          value={form.dateOfBirth}
          onChange={(value) =>
            setForm((current) => ({ ...current, dateOfBirth: value }))
          }
        />

        <AuthInput
          label="Contraseña"
          type="password"
          value={form.password}
          placeholder="••••••••"
          onChange={(value) =>
            setForm((current) => ({ ...current, password: value }))
          }
        />

        {message ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Inicia sesion
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}