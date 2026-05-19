type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  SCHEDULED:
    "bg-blue-50 text-blue-700",

  COMPLETED:
    "bg-emerald-50 text-emerald-700",

  CANCELLED:
    "bg-red-50 text-red-700",

  PENDING_REASSIGNMENT:
    "bg-amber-50 text-amber-700",
};

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        ${
          statusStyles[status] ??
          "bg-slate-100 text-slate-700"
        }
      `}
    >
      {status}
    </span>
  );
}