"use client";

import { useMemo, useState } from "react";

type Specialty = {
  id: string;
  name: string;
  isActive: boolean;
};

type SpecialtyPickerModalProps = {
  specialties: Specialty[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
};

export function SpecialtyPickerModal({
  specialties,
  selectedIds,
  onClose,
  onSave,
}: SpecialtyPickerModalProps) {
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  const filteredSpecialties = useMemo(
    () =>
      specialties.filter((specialty) =>
        specialty.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [specialties, search],
  );

  function toggleSpecialty(id: string) {
    setDraftIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-900">
          Agregar especialidades
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Selecciona una o varias especialidades para este médico.
        </p>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar especialidad"
          className="mt-5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
        />

        <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {filteredSpecialties.map((specialty) => {
            const checked = draftIds.includes(specialty.id);

            return (
              <button
                key={specialty.id}
                type="button"
                onClick={() => toggleSpecialty(specialty.id)}
                className={
                  checked
                    ? "mb-2 flex w-full items-center justify-between rounded-xl bg-teal-600 px-4 py-3 text-left text-sm font-semibold text-white"
                    : "mb-2 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                }
              >
                <span>{specialty.name}</span>
                <span>{checked ? "Seleccionada" : "+"}</span>
              </button>
            );
          })}

          {!filteredSpecialties.length ? (
            <p className="p-4 text-sm text-slate-500">
              No se encontraron especialidades.
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onSave(draftIds)}
            className="h-11 rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Guardar selección
          </button>
        </div>
      </div>
    </div>
  );
}