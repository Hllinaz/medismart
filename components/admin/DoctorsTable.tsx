"use client";

import { useMemo, useState } from "react";

type Doctor = {
  id: string;
  licenseNumber: string | null;
  user: {
    name: string;
    email: string;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  };
  specialties: Array<{
    specialty: {
      name: string;
    };
  }>;
};

type DoctorsTableProps = {
  doctors: Doctor[];
};

export function DoctorsTable({ doctors }: DoctorsTableProps) {
  const [search, setSearch] = useState("");

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return doctors;

    return doctors.filter((doctor) => {
      const specialties = doctor.specialties
        .map((item) => item.specialty.name)
        .join(" ");

      return [
        doctor.user.name,
        doctor.user.email,
        doctor.licenseNumber ?? "",
        doctor.user.status,
        specialties,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [doctors, search]);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Lista de médicos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Busca por nombre, correo, licencia o especialidad.
          </p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar médico..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 lg:w-72"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-200 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="px-4 py-3 font-bold">Médico</th>
              <th className="px-4 py-3 font-bold">Correo</th>
              <th className="px-4 py-3 font-bold">Licencia</th>
              <th className="px-4 py-3 font-bold">Especialidades</th>
              <th className="px-4 py-3 font-bold">Estado</th>
            </tr>
          </thead>

          <tbody>
            {filteredDoctors.map((doctor) => (
              <tr
                key={doctor.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-4 font-semibold text-slate-900">
                  {doctor.user.name}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {doctor.user.email}
                </td>

                <td className="px-4 py-4 text-slate-600">
                  {doctor.licenseNumber ?? "--"}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialties.length ? (
                      doctor.specialties.map((item) => (
                        <span
                          key={item.specialty.name}
                          className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700"
                        >
                          {item.specialty.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Sin especialidad</span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {doctor.user.status}
                  </span>
                </td>
              </tr>
            ))}

            {!filteredDoctors.length ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No se encontraron médicos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}