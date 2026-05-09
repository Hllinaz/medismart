import Link from "next/link";
import { AppNav } from "@/components/app-shell/AppNav";

const actions = [
  {
    href: "/register",
    title: "Registrar paciente",
    description: "Crea una cuenta PACIENTE usando el endpoint de registro.",
  },
  {
    href: "/login",
    title: "Iniciar sesion",
    description: "Autentica un usuario y guarda la cookie httpOnly.",
  },
  {
    href: "/dashboard",
    title: "Ir al dashboard",
    description: "Consulta el usuario autenticado y navega por el sistema.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            MediSmart
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Frontend funcional basico</h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Esta interfaz consume las rutas backend de autenticacion, perfil,
            medicos y especialidades. Es simple por ahora, pero ya esta separada
            por pantallas reales.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              className="border border-zinc-300 bg-white p-5 shadow-sm transition hover:border-emerald-600"
              href={action.href}
              key={action.href}
            >
              <h2 className="text-lg font-semibold">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
