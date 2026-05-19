import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

type Role = "PACIENTE" | "MEDICO" | "ADMIN";

type DashboardShellProps = {
  children: React.ReactNode;
  role?: Role;
  user?: {
    name: string;
    email: string;
    role: Role;
  } | null;
};

export function DashboardShell({
  children,
  role = "PACIENTE",
  user = null,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar role={role} />

        <section className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} />

          <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}