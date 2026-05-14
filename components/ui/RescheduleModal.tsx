"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { AvailabilityCalendar } from "@/components/ui/AvailabilityCalendar";

type RescheduleModalProps = {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  doctorId: string;
  onReschedule: (appointmentId: string, newDateTime: string) => Promise<void>;
};

export function RescheduleModal({
  open,
  onClose,
  appointmentId,
  doctorId,
  onReschedule,
}: RescheduleModalProps) {
  const [newDateTime, setNewDateTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!newDateTime) return;
    setLoading(true);
    try {
      await onReschedule(appointmentId, newDateTime);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) setNewDateTime("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Reprogramar cita">
      <div className="grid gap-4">
        <p className="text-sm text-zinc-600">
          Selecciona una nueva fecha y hora para tu cita.
        </p>

        <AvailabilityCalendar
          doctorId={doctorId}
          selectedDateTime={newDateTime}
          onSelectDateTime={setNewDateTime}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!newDateTime || loading}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
