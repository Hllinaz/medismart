type BadgeVariant = "active" | "inactive" | "pending" | "confirmed" | "completed" | "cancelled";

const variants: Record<BadgeVariant, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: string;
}) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
