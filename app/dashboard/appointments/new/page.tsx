"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { Message } from "@/components/ui/Message";
import { SpecialtySelector } from "@/components/ui/SpecialtySelector";
import { DoctorList } from "@/components/ui/DoctorList";
import { AvailabilityCalendar } from "@/components/ui/AvailabilityCalendar";

const STEPS = ["Especialidad", "Medico", "Fecha y hora", "Confirmar"];

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    specialtyId: "",
    doctorId: "",
    dateTime: "",
    reason: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== "PACIENTE") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "PACIENTE") return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.doctorId || !form.dateTime) {
      setMessage("Completa todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: form.doctorId,
          dateTime: form.dateTime,
          reason: form.reason || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo agendar la cita");
      } else {
        router.push("/dashboard/appointments");
      }
    } catch {
      setMessage("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function canProceed(): boolean {
    if (step === 0) return !!form.specialtyId;
    if (step === 1) return !!form.doctorId;
    if (step === 2) return !!form.dateTime;
    return true;
  }

  function handleNext() {
    if (canProceed() && step < 3) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Agendar Cita</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sigue los pasos para agendar una nueva cita medica.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= step
                  ? "bg-emerald-700 text-white"
                  : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm ${
                i <= step ? "font-semibold text-zinc-900" : "text-zinc-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 ${
                  i < step ? "bg-emerald-700" : "bg-zinc-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {message ? (
        <div className="mb-6">
          <Message type="error">{message}</Message>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Selecciona una especialidad
            </h2>
            <SpecialtySelector
              value={form.specialtyId}
              onChange={(specialtyId) =>
                setForm((current) => ({
                  ...current,
                  specialtyId,
                  doctorId: "",
                  dateTime: "",
                }))
              }
            />
          </div>
        )}

        {step === 1 && (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Selecciona un medico
            </h2>
            <DoctorList
              specialtyId={form.specialtyId}
              selectedDoctorId={form.doctorId}
              onSelectDoctor={(doctorId) =>
                setForm((current) => ({ ...current, doctorId, dateTime: "" }))
              }
            />
          </div>
        )}

        {step === 2 && (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Selecciona fecha y hora
            </h2>
            <AvailabilityCalendar
              doctorId={form.doctorId}
              selectedDateTime={form.dateTime}
              onSelectDateTime={(dateTime) =>
                setForm((current) => ({ ...current, dateTime }))
              }
            />
          </div>
        )}

        {step === 3 && (
          <div className="rounded border border-zinc-300 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Confirma tu cita
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">Especialidad</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {form.specialtyId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">Medico ID</p>
                <p className="text-sm text-zinc-900">{form.doctorId}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">Fecha y hora</p>
                <p className="text-sm text-zinc-900">
                  {new Date(form.dateTime).toLocaleString("es-ES")}
                </p>
              </div>
              <Field
                label="Motivo (opcional)"
                value={form.reason}
                onChange={(value) =>
                  setForm((current) => ({ ...current, reason: value }))
                }
                multiline
                placeholder="Describe brevemente el motivo"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Anterior
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="rounded bg-emerald-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              Siguiente
            </button>
          ) : (
            <FormButton loading={loading}>Agendar cita</FormButton>
          )}
        </div>
      </form>
    </div>
  );
}
