"use client";

import { useRouter } from "next/navigation";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type TopbarProps = {
  user?: {
    name: string;
    email: string;
    role: Role;
  } | null;
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "MS";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6 lg:px-10">
        <div>
          <p className="text-sm font-medium text-slate-500">Panel principal</p>
          <h2 className="text-xl font-bold text-slate-900">
            {user?.name ?? "Cargando usuario..."}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name ?? "Usuario"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role ?? "Rol"} · {user?.email ?? "correo"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-sm font-bold text-teal-700">
            {initials}
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}