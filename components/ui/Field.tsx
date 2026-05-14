export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      {multiline ? (
        <textarea
          className="min-h-24 border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
