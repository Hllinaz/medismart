"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
        return;
      }

      setError(data.error ?? "No se pudo iniciar sesion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <AppNav />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-zinc-900">Iniciar sesion</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ingresa tus credenciales para acceder al sistema.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            {error ? <Message type="error">{error}</Message> : null}

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
              placeholder="Tu contrasena"
            />
            <FormButton loading={loading}>Entrar</FormButton>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            ¿No tienes cuenta?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/register">
              Registrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
