import { prisma } from "@/lib/prisma";
import type { Priority } from "@prisma/client";

const priorityRank: Record<Priority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

export async function processReassignmentQueue() {
  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      status: "PENDING_REASSIGNMENT",
    },
    include: {
      patient: true,
      doctor: {
        include: {
          specialties: true,
        },
      },
    },
  });

  const queue = pendingAppointments.sort((a, b) => {
    const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority];

    if (priorityDiff !== 0) return priorityDiff;

    return a.requestDate.getTime() - b.requestDate.getTime();
  });

  const results = [];

  for (const appointment of queue) {
    const specialtyIds = appointment.doctor.specialties.map(
      (item) => item.specialtyId
    );

    const newAvailability = await prisma.availability.findFirst({
      where: {
        isBooked: false,
        doctorId: { not: appointment.doctorId},
        startTime: { gt: new Date(appointment.appointmentDate.getTime() + 24 * 60 * 60 * 1000) },
        doctor: { specialties: { some: { specialtyId: { in: specialtyIds } } } },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (!newAvailability) {
      results.push({
        appointmentId: appointment.id,
        priority: appointment.priority,
        status: "NO_AVAILABILITY_FOUND",
      });

      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.availability.update({
        where: { id: newAvailability.id },
        data: { isBooked: true },
      });

      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          doctorId: newAvailability.doctorId,
          availabilityId: newAvailability.id,
          appointmentDate: newAvailability.startTime,
          status: "SCHEDULED",
        },
      });

      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          appointmentId: appointment.id,
          type: "REASSIGNMENT",
          message: "Tu cita fue reasignada automáticamente.",
        },
      });
    });

    results.push({
      appointmentId: appointment.id,
      priority: appointment.priority,
      status: "REASSIGNED",
      newAvailabilityId: newAvailability.id,
      newDate: newAvailability.startTime,
    });
  }

  return results;
}