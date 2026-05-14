import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900">403</h1>
        <p className="mt-2 text-lg text-zinc-600">No autorizado</p>
        <p className="mt-1 text-sm text-zinc-500">
          No tienes permisos para acceder a esta pagina.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
