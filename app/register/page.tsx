"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        return;
      }

      setError(data.error ?? "No se pudo registrar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <AppNav />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold text-zinc-900">Cuenta creada</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Tu registro fue exitoso. Ahora puedes iniciar sesion.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Iniciar sesion
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppNav />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Registrate como paciente para empezar a agendar citas.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            {error ? <Message type="error">{error}</Message> : null}

            <Field
              label="Nombre"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Tu nombre completo"
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              placeholder="tu@correo.com"
            />
            <Field
              label="Contrasena"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              placeholder="Minimo 8 caracteres"
            />
            <FormButton loading={loading}>Crear cuenta</FormButton>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
              Inicia sesion
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
