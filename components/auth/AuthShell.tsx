type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        
        {/* Left Side */}
        <section className="relative hidden overflow-hidden bg-linear-to-br from-teal-700 via-emerald-600 to-cyan-500 lg:flex">
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10 flex max-w-lg flex-col justify-center px-16 text-white">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur">
              M
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              MediSmart
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/90">
              Plataforma inteligente para la gestion de pacientes,
              medicos, horarios y citas medicas.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-bold">24/7</p>
                <p className="mt-2 text-sm text-white/80">
                  Gestion de citas y disponibilidad.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-bold">100%</p>
                <p className="mt-2 text-sm text-white/80">
                  Plataforma segura y moderna.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                {title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}