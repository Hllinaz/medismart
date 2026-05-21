import { prisma } from "@/lib/prisma";
import { notifyAppointmentReassigned } from "./notifications";
import type { Priority } from "@prisma/client";

const priorityRank: Record<Priority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

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
      specialty: true,
    },
  });

  const queue = pendingAppointments.sort((a, b) => {
    const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority];

    if (priorityDiff !== 0) return priorityDiff;

    return a.requestDate.getTime() - b.requestDate.getTime();
  });

  const results = [];

  for (const appointment of queue) {
    const specialtyIds = appointment.specialtyId
      ? [appointment.specialtyId]
      : appointment.doctor.specialties.map((item) => item.specialtyId);

    if (specialtyIds.length === 0) {
      results.push({
        appointmentId: appointment.id,
        priority: appointment.priority,
        status: "NO_SPECIALTY_FOUND",
      });

      continue;
    }

    const { start: sameDayStart, end: sameDayEnd } = getDayRange(
      appointment.appointmentDate
    );

    const originalEndTime = new Date(appointment.appointmentDate);
    originalEndTime.setHours(originalEndTime.getHours() + 1);

    const specialtyWhere = {
      doctor: {
        specialties: {
          some: {
            specialtyId: {
              in: specialtyIds,
            },
          },
        },
      },
    };

    // 1. Misma especialidad + mismo día + otro médico
    let newAvailability = await prisma.availability.findFirst({
      where: {
        isBooked: false,
        doctorId: { not: appointment.doctorId },
        startTime: {
          gt: new Date(),
          gte: sameDayStart,
          lt: sameDayEnd,
        },
        ...specialtyWhere,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // 2. Misma especialidad + mismo día + mismo médico,
    // pero después de la hora original
    if (!newAvailability) {
      newAvailability = await prisma.availability.findFirst({
        where: {
          isBooked: false,
          doctorId: appointment.doctorId,
          startTime: {
            gt: originalEndTime,
            gte: sameDayStart,
            lt: sameDayEnd,
          },
          ...specialtyWhere,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    }

    // 3. Misma especialidad + otro día futuro + otro médico
    if (!newAvailability) {
      newAvailability = await prisma.availability.findFirst({
        where: {
          isBooked: false,
          doctorId: { not: appointment.doctorId },
          startTime: {
            gt: new Date(),
            gte: sameDayEnd,
          },
          ...specialtyWhere,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    }

    // 4. Misma especialidad + otro día futuro + mismo médico
    if (!newAvailability) {
      newAvailability = await prisma.availability.findFirst({
        where: {
          isBooked: false,
          doctorId: appointment.doctorId,
          startTime: {
            gt: new Date(),
            gte: sameDayEnd,
          },
          ...specialtyWhere,
        },
        orderBy: {
          startTime: "asc",
        },
      });
    }

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
          wasReassigned: true,
        },
      });
    });

    const newDoctor = await prisma.doctorProfile.findUnique({
      where: { id: newAvailability.doctorId },
    });

    if (newDoctor) {
      await notifyAppointmentReassigned({
        patientUserId: appointment.patient.userId,
        newDoctorUserId: newDoctor.userId,
        appointmentId: appointment.id,
      });
    }

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