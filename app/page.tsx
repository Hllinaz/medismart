import Link from "next/link";
import { AppNav } from "@/components/app-shell/AppNav";

const features = [
  {
    title: "Agenda tu cita",
    description: "Selecciona especialidad, medico y horario disponible de forma rapida y sencilla.",
    icon: "📅",
  },
  {
    title: "Gestiona tu salud",
    description: "Accede a tu historial de citas y lleva el control de tus consultas medicas.",
    icon: "❤️",
  },
  {
    title: "Medicos expertos",
    description: "Encuentra al especialista que necesitas entre nuestra amplia red de profesionales.",
    icon: "👨‍⚕️",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <AppNav />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              MediSmart
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight text-zinc-900">
              Tu salud en nuestras manos
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Agenda y gestiona tus citas medicas de forma facil y rapida.
              Conectamos pacientes con los mejores profesionales de la salud.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-800"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
              >
                Iniciar sesion
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              ¿Por que usar MediSmart?
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded border border-zinc-200 bg-zinc-50 p-6 text-center"
                >
                  <span className="text-4xl">{feature.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6">
        <p className="text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} MediSmart. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
