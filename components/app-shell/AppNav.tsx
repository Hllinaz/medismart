import Link from "next/link";

export function AppNav() {
  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link className="text-sm font-bold text-emerald-800" href="/">
          MediSmart
        </Link>
        <div className="flex items-center gap-4">
          <Link
            className="text-sm font-medium text-zinc-700 transition hover:text-emerald-800"
            href="/login"
          >
            Iniciar sesion
          </Link>
          <Link
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            href="/register"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </nav>
  );
}
