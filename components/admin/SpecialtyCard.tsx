type SpecialtyCardProps = {
  specialty: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
};

export function SpecialtyCard({
  specialty,
}: SpecialtyCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {specialty.name}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {specialty.description ??
              "Sin descripcion"}
          </p>

          <p className="mt-5 text-xs text-slate-400">
            {specialty.id}
          </p>
        </div>

        <span
          className={`
            rounded-full
            px-3
            py-1
            text-xs
            font-semibold
            ${
              specialty.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }
          `}
        >
          {specialty.isActive
            ? "Activa"
            : "Inactiva"}
        </span>
      </div>
    </article>
  );
}