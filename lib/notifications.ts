import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  userId: string;
  appointmentId?: string | null;

  title: string;
  message: string;

  type: NotificationType;
};

export async function createNotification({
  userId,
  appointmentId,
  title,
  message,
  type,
}: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId,
      appointmentId,
      title,
      message,
      type,
    },
  });
}

export async function createNotifications(
  notifications: CreateNotificationInput[],
) {
  if (notifications.length === 0) return null;

  return prisma.notification.createMany({
    data: notifications,
  });
}

export async function notifyAppointmentCancelled(params: {
  patientUserId: string;
  doctorUserId: string;
  appointmentId: string;
  patientName: string;

  cancelledBy: "PACIENTE" | "MEDICO" | "ADMIN";
}) {
  const {
    patientUserId,
    doctorUserId,
    appointmentId,
    patientName,
    cancelledBy,
  } = params;

  return createNotifications([
    {
      userId: patientUserId,
      appointmentId,
      type: "CANCELLATION",
      title: "Cita cancelada",
      message:
        cancelledBy === "MEDICO" || cancelledBy === "ADMIN"
          ? "Tu cita fue cancelada y enviada a reasignación."
          : "Tu cita fue cancelada correctamente.",
    },

    {
      userId: doctorUserId,
      appointmentId,
      type: "CANCELLATION",
      title: "Cita cancelada",
      message:
        cancelledBy === "PACIENTE"
          ? `El paciente ${patientName} canceló la cita.`
          : `La cita con ${patientName} fue cancelada.`,
    },
  ]);
}

export async function notifyReassignmentQueued(params: {
  patientUserId: string;
  doctorUserId: string;
  appointmentId: string;
}) {
  const {
    patientUserId,
    doctorUserId,
    appointmentId,
  } = params;

  return createNotifications([
    {
      userId: patientUserId,
      appointmentId,
      type: "REASSIGNMENT",
      title: "Cita en reasignación",
      message:
        "Tu cita fue enviada a la cola de reasignación.",
    },

    {
      userId: doctorUserId,
      appointmentId,
      type: "REASSIGNMENT",
      title: "Cita enviada a reasignación",
      message:
        "La cita fue enviada a la cola de reasignación.",
    },
  ]);
}

export async function notifyAppointmentReassigned(params: {
  patientUserId: string;
  newDoctorUserId: string;
  appointmentId: string;
}) {
  const {
    patientUserId,
    newDoctorUserId,
    appointmentId,
  } = params;

  return createNotifications([
    {
      userId: patientUserId,
      appointmentId,
      type: "REASSIGNMENT",
      title: "Cita reasignada",
      message:
        "Tu cita fue reasignada automáticamente.",
    },

    {
      userId: newDoctorUserId,
      appointmentId,
      type: "REASSIGNMENT",
      title: "Nueva cita asignada",
      message:
        "Se te asignó una nueva cita automáticamente.",
    },
  ]);
}