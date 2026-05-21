type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  SCHEDULED:
    "bg-teal-50 text-teal-700 border border-teal-200",

  COMPLETED:
    "bg-blue-50 text-blue-700 border border-blue-200",

  CANCELLED:
    "bg-red-50 text-red-700 border border-red-200",

  PENDING_REASSIGNMENT:
    "bg-yellow-50 text-yellow-700 border border-yellow-200",
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