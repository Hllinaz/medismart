"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

export default function ProfilePage() {
  const router = useRouter();
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Perfil cargado." : data.error);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();

    setResult(data);
    router.push("/login");
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
    });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Perfil</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Consume GET /api/auth/me y permite cerrar sesion.
          </p>
        </div>

        {message ? <Message type={loading ? "info" : "success"}>{message}</Message> : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="h-10 border border-zinc-300 bg-white px-4 text-sm font-semibold hover:border-emerald-700"
            type="button"
            onClick={() => void loadProfile()}
          >
            Recargar perfil
          </button>
          <button
            className="h-10 bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            type="button"
            onClick={() => void logout()}
          >
            Cerrar sesion
          </button>
        </div>

        {result ? <JsonBlock data={result} /> : null}
      </section>
    </main>
  );
}
