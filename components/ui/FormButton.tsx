export function FormButton({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={loading || disabled}
      type="submit"
    >
      {loading ? "Procesando..." : children}
    </button>
  );
}
