"use client";

import { FormEvent } from "react";

type Appointment = {
  id: string;
  appointmentDate: string;
  doctor: {
    user: {
      name: string;
    };
  };
};

type EvaluationModalProps = {
  appointment: Appointment;
  rating: string;
  comment: string;
  loading?: boolean;
  onRatingChange: (rating: string) => void;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EvaluationModal({
  appointment,
  rating,
  comment,
  loading = false,
  onRatingChange,
  onCommentChange,
  onClose,
  onSubmit,
}: EvaluationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-slate-900">Evaluar cita</h2>

        <p className="mt-2 text-sm text-slate-500">
          Dr. {appointment.doctor.user.name} -{" "}
          {new Date(appointment.appointmentDate).toLocaleString()}
        </p>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Calificación
            </span>

            <div className="grid grid-cols-5 gap-2">
              {["1", "2", "3", "4", "5"].map((value) => {
                const selected = rating === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onRatingChange(value)}
                    className={
                      selected
                        ? "h-12 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm"
                        : "h-12 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    }
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Comentario
            </span>

            <textarea
              className="min-h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Escribe tu comentario"
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-teal-600 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}