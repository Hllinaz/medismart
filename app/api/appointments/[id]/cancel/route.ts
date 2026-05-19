import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reassignAvailability } from "@/lib/scheduling";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, ["PACIENTE", "MEDICO", "ADMIN"]);
    const { id } = await context.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (appointment.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Solo se pueden cancelar citas activas" }, { status: 409 });
    }

    const isPatientOwner = user.role === "PACIENTE" && appointment.patient.userId === user.id;
    const isDoctorOwner = user.role === "MEDICO" && appointment.doctor.userId === user.id;

    if (user.role !== "ADMIN" && !isPatientOwner && !isDoctorOwner) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const cancelledByDoctor = user.role === "MEDICO" || (user.role === "ADMIN" && appointment.availabilityId);
    const freedAvailabilityId = appointment.availabilityId;

    const updatedAppointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: cancelledByDoctor ? "PENDING_REASSIGNMENT" : "CANCELLED",
          availabilityId: cancelledByDoctor ? null : appointment.availabilityId,
        },
      });

      if (freedAvailabilityId) {
        await tx.availability.update({
          where: { id: freedAvailabilityId },
          data: { isBooked: false },
        });
      }

      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          appointmentId: appointment.id,
          type: "CANCELLATION",
          message: cancelledByDoctor
            ? "Tu cita fue cancelada por el medico y queda pendiente de reasignacion."
            : "Tu cita fue cancelada correctamente.",
        },
      });

      return updated;
    });

    const reassignedAppointment = cancelledByDoctor && freedAvailabilityId
      ? await reassignAvailability(freedAvailabilityId)
      : null;

    return NextResponse.json({ appointment: updatedAppointment, reassignedAppointment });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al cancelar cita" }, { status: 500 });
  }
}
