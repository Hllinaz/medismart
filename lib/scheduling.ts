import type { AppointmentStatus, Priority, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const priorityRank: Record<Priority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

export function parseRequiredDate(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} es obligatorio`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} no es una fecha valida`);
  }

  return date;
}

export function parseNonNegativeInteger(value: unknown, field: string) {
  const numberValue =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${field} debe ser un numero entero mayor o igual a 0`);
  }

  return numberValue;
}

export function parsePositiveInteger(value: unknown, field: string) {
  const numberValue = parseNonNegativeInteger(value, field);

  if (numberValue <= 0) {
    throw new Error(`${field} debe ser mayor que 0`);
  }

  return numberValue;
}

export function generateAvailabilitySlots(params: {
  date: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  breakMinutes: number;
}) {
  const slots: Array<{ date: Date; startTime: Date; endTime: Date }> = [];
  const slotDurationMs = params.durationMinutes * 60 * 1000;
  const breakDurationMs = params.breakMinutes * 60 * 1000;
  let cursor = new Date(params.startTime);

  while (cursor.getTime() + slotDurationMs <= params.endTime.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + slotDurationMs);

    slots.push({
      date: params.date,
      startTime: slotStart,
      endTime: slotEnd,
    });

    cursor = new Date(slotEnd.getTime() + breakDurationMs);
  }

  if (!slots.length) {
    throw new Error("El bloque no genera cupos con la duracion seleccionada");
  }

  return slots;
}

export function hasTimeOverlap(
  first: { startTime: Date; endTime: Date },
  second: { startTime: Date; endTime: Date },
) {
  return first.startTime < second.endTime && first.endTime > second.startTime;
}

export function calculatePriority(input: {
  symptoms?: unknown;
  urgent?: unknown;
}): Priority {

  if (input.urgent === true) {
    return "HIGH";
  }

  const symptoms =
    typeof input.symptoms === "string"
      ? input.symptoms.toLowerCase()
      : "";

  const highSignals = [
    "dolor pecho",
    "dolor en el pecho",
    "pecho",
    "respirar",
    "falta de aire",
    "sangrado",
    "desmayo",
    "convulsión",
    "urgente",
    "fiebre alta",
  ];

  const lowSignals = [
    "control",
    "revision",
    "revisión",
    "rutina",
    "chequeo",
    "seguimiento",
  ];

  if (highSignals.some((signal) => symptoms.includes(signal))) {
    return "HIGH";
  }

  if (lowSignals.some((signal) => symptoms.includes(signal))) {
    return "LOW";
  }

  return "NORMAL";
}

export function priorityOrder(priority: Priority) {
  return priorityRank[priority];
}

export async function getPatientProfileId(userId: string) {
  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return patientProfile?.id ?? null;
}

export async function getDoctorProfileId(userId: string) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return doctorProfile?.id ?? null;
}

export function canReadAppointment(params: {
  role: Role;
  userId: string;
  patientUserId?: string;
  doctorUserId?: string;
}) {
  if (params.role === "ADMIN") {
    return true;
  }

  if (params.role === "PACIENTE") {
    return params.patientUserId === params.userId;
  }

  return params.doctorUserId === params.userId;
}

export async function reassignAvailability(availabilityId: string) {
  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
    include: { doctor: { include: { user: true } } },
  });

  if (!availability) {
    throw new Error("Disponibilidad no encontrada");
  }

  const waitingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: availability.doctorId,
      availabilityId: null,
      status: "PENDING_REASSIGNMENT",
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  const nextAppointment = waitingAppointments.sort((a, b) => {
    const priorityDiff = priorityOrder(b.priority) - priorityOrder(a.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.requestDate.getTime() - b.requestDate.getTime();
  })[0];

  if (!nextAppointment) {
    await prisma.availability.update({
      where: { id: availabilityId },
      data: { isBooked: false },
    });

    return null;
  }

  return prisma.$transaction(async (tx) => {
    const updatedAppointment = await tx.appointment.update({
      where: { id: nextAppointment.id },
      data: {
        availabilityId,
        appointmentDate: availability.startTime,
        status: "SCHEDULED",
        wasReassigned: true,
      },
    });

    await tx.availability.update({
      where: { id: availabilityId },
      data: { isBooked: true },
    });

    await tx.notification.create({
      data: {
        userId: nextAppointment.patient.userId,
        appointmentId: updatedAppointment.id,
        type: "REASSIGNMENT",
        message: `Tu cita fue reasignada para el ${availability.startTime.toLocaleDateString("es-CO")} a las ${availability.startTime.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })} con ${availability.doctor.user.name}.`,
      },
    });

    return updatedAppointment;
  });
}

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus | undefined {
  if (
    value === "SCHEDULED" ||
    value === "CANCELLED" ||
    value === "PENDING_REASSIGNMENT" ||
    value === "COMPLETED"
  ) {
    return value;
  }

  return undefined;
}
