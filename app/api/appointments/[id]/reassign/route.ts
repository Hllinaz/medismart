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
    await requireRole(request, ["ADMIN", "MEDICO"]);
    const { id } = await context.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { availabilityId: true },
    });

    if (!appointment?.availabilityId) {
      return NextResponse.json({ error: "La cita no tiene disponibilidad para reasignar" }, { status: 400 });
    }

    const reassignedAppointment = await reassignAvailability(appointment.availabilityId);

    return NextResponse.json({ reassignedAppointment });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Error al reasignar cita" }, { status: 500 });
  }
}
