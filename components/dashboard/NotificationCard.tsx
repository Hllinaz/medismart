type NotificationCardProps = {
  notification: {
    id: string;
    message: string;
    type: "REMINDER" | "CANCELLATION" | "REASSIGNMENT" | "SYSTEM";
    sentDate: string;
  };
};

const typeStyles = {
  REMINDER: "bg-blue-50 text-blue-700",
  CANCELLATION: "bg-red-50 text-red-700",
  REASSIGNMENT: "bg-amber-50 text-amber-700",
  SYSTEM: "bg-slate-100 text-slate-700",
};

export function NotificationCard({ notification }: NotificationCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {notification.message}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {new Date(notification.sentDate).toLocaleString()}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${typeStyles[notification.type]}`}
        >
          {notification.type}
        </span>
      </div>
    </article>
  );
}