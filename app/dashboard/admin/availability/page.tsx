"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "@/components/app-shell/AppNav";
import { Field } from "@/components/ui/Field";
import { FormButton } from "@/components/ui/FormButton";
import { JsonBlock } from "@/components/ui/JsonBlock";
import { Message } from "@/components/ui/Message";

type Doctor = {
  id: string;
  user: {
    name: string;
    email: string;
    status: string;
  };
};

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  doctor: Doctor;
};

export default function AvailabilityPage() {
  const [form, setForm] = useState({
    doctorId: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [doctorsResponse, availabilityResponse] = await Promise.all([
        fetch("/api/admin/doctors", { credentials: "include" }),
        fetch("/api/availability", { credentials: "include" }),
      ]);
      const doctorsData = await doctorsResponse.json();
      const availabilityData = await availabilityResponse.json();

      setDoctors(doctorsData.doctors ?? []);
      setAvailability(availabilityData.availability ?? []);
      setResult({ doctors: doctorsData, availability: availabilityData });

      if (!doctorsResponse.ok || !availabilityResponse.ok) {
        setMessage(doctorsData.error ?? availabilityData.error ?? "No se pudo cargar la informacion.");
        return;
      }

      setMessage("Horarios cargados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: form.doctorId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });
      const data = await response.json();

      setResult(data);
      setMessage(response.ok ? "Horario creado." : data.error);

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <AppNav />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold">Horarios medicos</h1>
          <p className="mt-2 text-sm text-zinc-600">Administra disponibilidad por medico.</p>
        </div>

        {message ? <Message type="info">{message}</Message> : null}

        <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <form className="grid h-fit gap-4 border border-zinc-300 bg-white p-5" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Medico
              <select
                className="h-10 border border-zinc-300 px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600"
                value={form.doctorId}
                onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}
              >
                <option value="">Selecciona un medico</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user.name} - {doctor.user.email}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Fecha" type="date" value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} />
            <Field label="Inicio" type="datetime-local" value={form.startTime} onChange={(startTime) => setForm((current) => ({ ...current, startTime }))} />
            <Field label="Fin" type="datetime-local" value={form.endTime} onChange={(endTime) => setForm((current) => ({ ...current, endTime }))} />
            <FormButton loading={loading}>Crear horario</FormButton>
          </form>

          <div className="grid gap-4">
            <div className="border border-zinc-300 bg-white">
              <div className="border-b border-zinc-200 px-4 py-3">
                <h2 className="font-semibold">Disponibilidad</h2>
              </div>
              <div className="divide-y divide-zinc-200">
                {availability.map((slot) => (
                  <article className="px-4 py-3" key={slot.id}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{slot.doctor.user.name}</h3>
                      <span className="text-xs font-medium text-zinc-500">{slot.isBooked ? "Ocupado" : "Libre"}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{slot.id}</p>
                  </article>
                ))}
                {!availability.length ? <p className="px-4 py-6 text-sm text-zinc-500">No hay horarios.</p> : null}
              </div>
            </div>

            {result ? <JsonBlock data={result} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
