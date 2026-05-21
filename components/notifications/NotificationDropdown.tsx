"use client";

import { useEffect, useRef, useState } from "react";

import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string | null;
  message: string;
  type: string;
  isRead: boolean;
  sentDate: string;
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      console.error("Error loading notifications");
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch {
      console.error("Error marking notifications");
    }
  }

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
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
      >
        <Bell size={18} />

        {unreadCount > 0 ? (
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
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="
            absolute
            right-0
            top-14
            z-50
            w-[360px]
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-2xl
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              px-5
              py-4
            "
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notificaciones
              </h3>

              <p className="text-xs text-slate-500">
                {unreadCount} sin leer
              </p>
            </div>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="
                text-xs
                font-semibold
                text-teal-600
                transition
                hover:text-teal-700
              "
            >
              Marcar todas
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No tienes notificaciones.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    border-b
                    border-slate-100
                    px-5
                    py-4
                    transition
                    hover:bg-slate-50
                    ${
                      !notification.isRead
                        ? "bg-teal-50/50"
                        : "bg-white"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead ? (
                      <div className="mt-2 h-2 w-2 rounded-full bg-teal-500" />
                    ) : (
                      <div className="mt-2 h-2 w-2 rounded-full bg-slate-300" />
                    )}

                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {notification.title ?? "Notificación"}
                      </h4>

                      <p className="mt-1 text-sm text-slate-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(
                          notification.sentDate,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}