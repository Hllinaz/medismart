"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "Paciente Demo",
    email: "paciente@demo.com",
    password: "password123",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
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

      setResult(data);
      setMessage(response.ok ? "Paciente registrado correctamente." : data.error);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Registro de paciente</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Crea usuarios con rol PACIENTE. Los roles administrativos no se crean desde aqui.
          </p>
        </div>

        <form className="grid gap-4 border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
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
          <FormButton loading={loading}>Crear cuenta</FormButton>
        </form>

        {message ? <Message type="info">{message}</Message> : null}
        {result ? <JsonBlock data={result} /> : null}

        <Link className="text-sm font-semibold text-emerald-800" href="/login">
          Ya tengo cuenta
        </Link>
      </section>
    </main>
  );
}
