import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "Perfil" },
  { href: "/dashboard/admin/specialties", label: "Especialidades" },
  { href: "/dashboard/admin/doctors", label: "Medicos" },
  { href: "/dashboard/admin/availability", label: "Horarios" },
  { href: "/dashboard/appointments", label: "Citas" },
  { href: "/dashboard/admin/reports", label: "Reportes" },
];

export function AppNav() {
  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="mr-3 text-sm font-bold text-emerald-800" href="/">
          MediSmart
        </Link>
        {links.map((link) => (
          <Link
            className="px-2 py-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-emerald-800"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
