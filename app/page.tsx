import Link from "next/link";
import { CalendarDays, HeartPulse, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda tus citas",
    description: "Selecciona especialidad, médico, fecha y horario disponible.",
  },
  {
    icon: HeartPulse,
    title: "Atención médica organizada",
    description: "Consulta tus citas, estados y evaluaciones desde un solo lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso seguro",
    description: "Autenticación con sesión protegida y roles por usuario.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_460px]">
        <div>
          <div className="mb-8 inline-flex rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
            MediSmart
          </div>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950 lg:text-6xl">
            Gestiona tus citas médicas de forma simple y segura.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Agenda citas por especialidad, consulta tus horarios, recibe
            notificaciones y evalúa tu atención médica desde una plataforma
            moderna.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
            >
              Crear cuenta
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
            >
              Iniciar sesión
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Icon size={22} />
                  </div>

                  <h2 className="font-bold text-slate-900">{feature.title}</h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-4x1 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="rounded-3x1 bg-linear-to-br from-teal-500 to-emerald-500 p-6 text-white">
            <p className="text-sm font-semibold text-white/80">
              Próxima cita
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Consulta general
            </h2>

            <p className="mt-2 text-white/80">
              Hoy · 10:30 AM
            </p>

            <div className="mt-8 rounded-3xl bg-white/15 p-4 backdrop-blur">
              <p className="text-sm text-white/80">Médico asignado</p>
              <p className="mt-1 text-xl font-bold">Dr. Carlos Mendoza</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 p-4">
                <p className="text-sm text-white/80">Estado</p>
                <p className="mt-1 font-bold">Programada</p>
              </div>

              <div className="rounded-2xl bg-white/15 p-4">
                <p className="text-sm text-white/80">Prioridad</p>
                <p className="mt-1 font-bold">Normal</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {["08:00", "09:30", "11:00"].map((time) => (
              <div
                key={time}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <span className="font-semibold text-slate-700">{time}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Disponible
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}