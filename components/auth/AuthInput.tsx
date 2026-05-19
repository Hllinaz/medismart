type AuthInputProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function AuthInput({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
}: AuthInputProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-12
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          text-sm
          text-slate-900
          outline-none
          transition
          focus:border-teal-500
          focus:bg-white
          focus:ring-4
          focus:ring-teal-100
        "
      />
    </label>
  );
}