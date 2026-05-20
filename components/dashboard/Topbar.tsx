"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type TopbarProps = {
  user?: {
    name: string;
    email: string;
    role: Role;
  } | null;
};

const roleLabels: Record<Role, string> = {
  PACIENTE: "Paciente",
  MEDICO: "Médico",
  ADMIN: "Administrador",
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
  }

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await fetch(
          "/api/notifications",
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setNotificationCount(
            data.notifications?.length ?? 0
          );
        }
      } catch {
        console.error(
          "Error loading notifications"
        );
      }
    }

    queueMicrotask(() => {
      void loadNotifications();
    });
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "MS";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-6 px-6 lg:px-10">
        <div>
          <p className="text-sm font-medium text-slate-500">Panel principal</p>
          <h2 className="text-xl font-bold text-slate-900">
            {user?.name ?? "Cargando usuario..."}
          </h2>
        </div>

        <div className="hidden max-w-md flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 xl:flex">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Buscar citas, médicos o pacientes..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/notifications")}
            className="
                        relative
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        text-slate-500
                        transition
                        hover:border-teal-200
                        hover:bg-teal-50
                        hover:text-teal-700
                      "
            title="Notificaciones"
          >
            <Bell size={18} />

            {notificationCount > 0 ? (
              <span
                className="
                          absolute
                          -right-1
                          -top-1
                          flex
                          h-5
                          min-w-5
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          px-1
                          text-[10px]
                          font-bold
                          text-white
                        "
              >
                {notificationCount > 9
                  ? "9+"
                  : notificationCount}
              </span>
            ) : null}
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name ?? "Usuario"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role ? roleLabels[user.role] : "Rol"} ·{" "}
              {user?.email ?? "correo"}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-sm font-bold text-teal-700">
            {initials}
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}