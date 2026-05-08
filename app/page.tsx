"use client";

import { FormEvent, useState } from "react";

type ApiResult = {
  label: string;
  status?: number;
  data: unknown;
};

const initialRegister = {
  name: "Paciente Demo",
  email: "paciente@demo.com",
  password: "password123",
};

const initialLogin = {
  email: "admin@demo.com",
  password: "password123",
};

const initialSpecialty = {
  name: "Medicina General",
  description: "Atencion primaria y consulta general",
};

const initialDoctor = {
  name: "Dra. Demo",
  email: "doctor@demo.com",
  password: "password123",
  specialtyId: "",
  licenseNumber: "MED-001",
};

export default function Home() {
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [specialtyForm, setSpecialtyForm] = useState(initialSpecialty);
  const [doctorForm, setDoctorForm] = useState(initialDoctor);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult>({
    label: "Estado",
    data: "Sin solicitudes ejecutadas",
  });

  async function callApi(label: string, path: string, init?: RequestInit) {
    setLoading(label);

    try {
      const response = await fetch(path, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        ...init,
      });
      const data = await response.json().catch(() => null);

      setResult({
        label,
        status: response.status,
        data,
      });
    } catch (error) {
      setResult({
        label,
        data: error instanceof Error ? error.message : "Error inesperado",
      });
    } finally {
      setLoading(null);
    }
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void callApi("Registro", "/api/auth/register", {
      method: "POST",
      body: JSON.stringify(registerForm),
    });
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void callApi("Login", "/api/auth/login", {
      method: "POST",
      body: JSON.stringify(loginForm),
    });
  }

  function handleCreateSpecialty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void callApi("Crear especialidad", "/api/admin/specialties", {
      method: "POST",
      body: JSON.stringify(specialtyForm),
    });
  }

  function handleCreateDoctor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void callApi("Crear medico", "/api/admin/doctors", {
      method: "POST",
      body: JSON.stringify(doctorForm),
    });
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-zinc-300 pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            MediSmart
          </p>
          <h1 className="text-3xl font-semibold">Panel de pruebas backend</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            Inicia sesion con un usuario ADMIN existente para probar medicos y
            especialidades. Las respuestas aparecen en el panel lateral.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Auth">
              <form className="grid gap-3" onSubmit={handleRegister}>
                <Field
                  label="Nombre"
                  value={registerForm.name}
                  onChange={(value) => setRegisterForm((form) => ({ ...form, name: value }))}
                />
                <Field
                  label="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(value) => setRegisterForm((form) => ({ ...form, email: value }))}
                />
                <Field
                  label="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(value) =>
                    setRegisterForm((form) => ({ ...form, password: value }))
                  }
                />
                <SubmitButton loading={loading === "Registro"}>Registrar paciente</SubmitButton>
              </form>

              <form className="mt-6 grid gap-3 border-t border-zinc-200 pt-5" onSubmit={handleLogin}>
                <Field
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(value) => setLoginForm((form) => ({ ...form, email: value }))}
                />
                <Field
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(value) => setLoginForm((form) => ({ ...form, password: value }))}
                />
                <SubmitButton loading={loading === "Login"}>Login</SubmitButton>
              </form>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ActionButton
                  onClick={() => void callApi("Usuario autenticado", "/api/auth/me")}
                  loading={loading === "Usuario autenticado"}
                >
                  Ver usuario
                </ActionButton>
                <ActionButton
                  onClick={() =>
                    void callApi("Logout", "/api/auth/logout", {
                      method: "POST",
                    })
                  }
                  loading={loading === "Logout"}
                >
                  Logout
                </ActionButton>
              </div>
            </Panel>

            <Panel title="Especialidades">
              <form className="grid gap-3" onSubmit={handleCreateSpecialty}>
                <Field
                  label="Nombre"
                  value={specialtyForm.name}
                  onChange={(value) => setSpecialtyForm((form) => ({ ...form, name: value }))}
                />
                <Field
                  label="Descripcion"
                  value={specialtyForm.description}
                  onChange={(value) =>
                    setSpecialtyForm((form) => ({ ...form, description: value }))
                  }
                />
                <SubmitButton loading={loading === "Crear especialidad"}>
                  Crear especialidad
                </SubmitButton>
              </form>

              <ActionButton
                className="mt-4"
                onClick={() => void callApi("Listar especialidades", "/api/admin/specialties")}
                loading={loading === "Listar especialidades"}
              >
                Listar especialidades
              </ActionButton>
            </Panel>

            <Panel title="Medicos">
              <form className="grid gap-3" onSubmit={handleCreateDoctor}>
                <Field
                  label="Nombre"
                  value={doctorForm.name}
                  onChange={(value) => setDoctorForm((form) => ({ ...form, name: value }))}
                />
                <Field
                  label="Email"
                  type="email"
                  value={doctorForm.email}
                  onChange={(value) => setDoctorForm((form) => ({ ...form, email: value }))}
                />
                <Field
                  label="Password"
                  type="password"
                  value={doctorForm.password}
                  onChange={(value) => setDoctorForm((form) => ({ ...form, password: value }))}
                />
                <Field
                  label="Specialty ID"
                  value={doctorForm.specialtyId}
                  onChange={(value) =>
                    setDoctorForm((form) => ({ ...form, specialtyId: value }))
                  }
                />
                <Field
                  label="Licencia"
                  value={doctorForm.licenseNumber}
                  onChange={(value) =>
                    setDoctorForm((form) => ({ ...form, licenseNumber: value }))
                  }
                />
                <SubmitButton loading={loading === "Crear medico"}>Crear medico</SubmitButton>
              </form>

              <ActionButton
                className="mt-4"
                onClick={() => void callApi("Listar medicos", "/api/admin/doctors")}
                loading={loading === "Listar medicos"}
              >
                Listar medicos
              </ActionButton>
            </Panel>
          </div>

          <aside className="h-fit border border-zinc-300 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-lg font-semibold">Respuesta</h2>
              {result.status ? (
                <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold">
                  HTTP {result.status}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-700">{result.label}</p>
            <pre className="mt-3 max-h-[660px] overflow-auto bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-300 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-zinc-700">
      {label}
      <input
        className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <button
      className="h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={loading}
      type="submit"
    >
      {loading ? "Procesando..." : children}
    </button>
  );
}

function ActionButton({
  children,
  loading,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  loading: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`h-10 border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-zinc-400 ${className}`}
      disabled={loading}
      type="button"
      onClick={onClick}
    >
      {loading ? "Procesando..." : children}
    </button>
  );
}
