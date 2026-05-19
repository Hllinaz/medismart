"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthInput } from "@/components/auth/AuthInput";

export function LoginForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "paciente@demo.com",
    password: "password123",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
        return;
      }

      setMessage(data.error ?? "No se pudo iniciar sesion.");
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

  return (
    <AuthShell
      title="Bienvenido"
      subtitle="Inicia sesion para acceder a la plataforma MediSmart."
    >
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <AuthInput
          label="Correo electronico"
          type="email"
          value={form.email}
          placeholder="correo@ejemplo.com"
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              email: value,
            }))
          }
        />

        <AuthInput
          label="Contraseña"
          type="password"
          value={form.password}
          placeholder="••••••••"
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              password: value,
            }))
          }
        />

        {message ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

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
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {loading ? "Ingresando..." : "Iniciar sesion"}
        </button>

        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Registrate
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}