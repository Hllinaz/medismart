import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadAppointment, normalizeAppointmentStatus } from "@/lib/scheduling";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { id } = await context.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true, status: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true, status: true } } } },
        availability: true,
        notifications: true,
        evaluation: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (
      !canReadAppointment({
        role: user.role,
        userId: user.id,
        patientUserId: appointment.patient.userId,
        doctorUserId: appointment.doctor.userId,
      })
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al obtener cita" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["ADMIN", "MEDICO"]);
    const { id } = await context.params;
    const body = await request.json();
    const status = normalizeAppointmentStatus(body.status);

    if (!status) {
      return NextResponse.json({ error: "status no es valido" }, { status: 400 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(status === "PENDING_REASSIGNMENT" ? { wasReassigned: false } : {}),
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al actualizar cita" }, { status: 500 });
  }
}
