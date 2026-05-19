type DoctorCardProps = {
  doctor: {
    id: string;
    licenseNumber: string | null;
    user: {
      name: string;
      email: string;
      status: string;
    };
    specialties: Array<{
      specialty: {
        name: string;
      };
    }>;
  };
};

export function DoctorCard({
  doctor,
}: DoctorCardProps) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {doctor.user.name}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {doctor.user.email}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {doctor.specialties.length ? (
              doctor.specialties.map((item) => (
                <span
                  key={item.specialty.name}
                  className="
                    rounded-full
                    bg-teal-50
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-teal-700
                  "
                >
                  {item.specialty.name}
                </span>
              ))
            ) : (
              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-slate-600
                "
              >
                Sin especialidad
              </span>
            )}
          </div>

          <p className="mt-5 text-xs text-slate-400">
            {doctor.licenseNumber ?? "Sin licencia"}
          </p>
        </div>

        <span
          className="
            rounded-full
            bg-emerald-50
            px-3
            py-1
            text-xs
            font-semibold
            text-emerald-700
          "
        >
          {doctor.user.status}
        </span>
      </div>
    </article>
  );
}