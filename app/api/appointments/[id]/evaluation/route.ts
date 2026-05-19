import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { id } = await context.params;
    const evaluation = await prisma.evaluation.findUnique({
      where: { appointmentId: id },
    });

    return NextResponse.json({ evaluation });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al obtener evaluacion" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, "PACIENTE");
    const { id } = await context.params;
    const body = await request.json();
    const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
    const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim() : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating debe ser un entero entre 1 y 5" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (appointment.patient.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Solo se pueden evaluar citas completadas" }, { status: 409 });
    }

    const evaluation = await prisma.evaluation.upsert({
      where: { appointmentId: id },
      update: { rating, comment },
      create: { appointmentId: id, rating, comment },
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al crear evaluacion" }, { status: 500 });
  }
}
