"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/appointments/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NotificationCard } from "@/components/dashboard/NotificationCard";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Notification = {
  id: string;
  message: string;
  sentDate: string;
  type: "REMINDER" | "CANCELLATION" | "REASSIGNMENT" | "SYSTEM";
};

export default function NotificationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      const [meResponse, notificationsResponse] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/notifications", { credentials: "include" }),
      ]);

      const meData = await meResponse.json();
      const notificationsData = await notificationsResponse.json();

      if (meResponse.ok) {
        setUser(meData.user);
      }

      if (!notificationsResponse.ok) {
        setMessage(notificationsData.error ?? "No se pudieron cargar notificaciones.");
        return;
      }

      setNotifications(notificationsData.notifications ?? []);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotifications();
    });
  }, []);

  return (
    <DashboardShell role={user?.role} user={user}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Notificaciones</h1>
          <p className="mt-3 text-slate-500">
            Consulta avisos del sistema, cancelaciones, recordatorios y reasignaciones.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="mt-1 text-3xl font-bold text-teal-700">
            {notifications.length}
          </p>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4">
        {notifications.length ? (
          notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <EmptyState
            title="No tienes notificaciones"
            description="Los recordatorios, cancelaciones y mensajes del sistema aparecerán aquí."
          />
        )}
      </section>
    </DashboardShell>
  );
}