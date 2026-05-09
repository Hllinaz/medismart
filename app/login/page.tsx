"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      setResult(data);

      if (response.ok) {
        setMessage("Sesion iniciada correctamente.");
        router.push("/dashboard");
        return;
      }

      setMessage(data.error ?? "No se pudo iniciar sesion.");
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
          <h1 className="text-3xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Inicia sesion para guardar la cookie y consumir rutas protegidas.
          </p>
        </div>

        <form className="grid gap-4 border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
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
          <FormButton loading={loading}>Entrar</FormButton>
        </form>

        {message ? <Message type="info">{message}</Message> : null}
        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
