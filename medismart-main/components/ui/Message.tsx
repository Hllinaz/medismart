export function Message({
  type,
  children,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-zinc-200 bg-zinc-50 text-zinc-800",
  };

  return (
    <div className={`border px-3 py-2 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
