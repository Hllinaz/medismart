type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  tone?: "teal" | "emerald" | "red" | "blue" | "slate";
};

const toneStyles = {
  teal: "text-teal-700 bg-teal-50",
  emerald: "text-emerald-700 bg-emerald-50",
  red: "text-red-700 bg-red-50",
  blue: "text-blue-700 bg-blue-50",
  slate: "text-slate-700 bg-slate-100",
};

export function StatCard({
  label,
  value,
  description,
  tone = "teal",
}: StatCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div
        className={`mb-5 inline-flex rounded-2xl px-3 py-2 text-sm font-semibold ${toneStyles[tone]}`}
      >
        {label}
      </div>

      <p className="text-4xl font-bold text-slate-900">{value}</p>

      {description ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </article>
  );
}