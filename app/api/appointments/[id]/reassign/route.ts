import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyReassignmentQueued } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["ADMIN", "MEDICO"]);

    const { id } = await context.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "La cita no existe" },
        { status: 404 }
      );
    }

    if (appointment.status === "PENDING_REASSIGNMENT") {
      return NextResponse.json({
        message: "La cita ya está en cola de reasignación",
        appointment,
      });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede reasignar una cita cancelada" },
        { status: 400 }
      );
    }

    const updatedAppointment = await prisma.$transaction(async (tx) => {
      if (appointment.availabilityId) {
        await tx.availability.update({
          where: { id: appointment.availabilityId },
          data: { isBooked: false },
        });
      }

      const updated = await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "PENDING_REASSIGNMENT",
          availabilityId: null,
        },
      });

      return updated;
    });

    await notifyReassignmentQueued({
      patientUserId: appointment.patient.userId,
      doctorUserId: appointment.doctor.userId,
      appointmentId: appointment.id,
    });

    return NextResponse.json({
      message: "Cita enviada a cola de reasignación",
      appointment: updatedAppointment,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error al enviar cita a cola de reasignación" },
      { status: 500 }
    );
  }
}