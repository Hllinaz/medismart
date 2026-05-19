import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDoctorProfileId, parseRequiredDate } from "@/lib/scheduling";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function canManageAvailability(request: NextRequest, availabilityId: string) {
  const user = await requireRole(request, ["ADMIN", "MEDICO"]);
  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
    select: { id: true, doctorId: true, isBooked: true },
  });

  if (!availability) {
    return { user, availability: null, response: NextResponse.json({ error: "Disponibilidad no encontrada" }, { status: 404 }) };
  }

  if (user.role === "MEDICO") {
    const doctorId = await getDoctorProfileId(user.id);

    if (doctorId !== availability.doctorId) {
      return { user, availability, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
    }
  }

  return { user, availability, response: null };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { id } = await context.params;
    const availability = await prisma.availability.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, status: true },
            },
            specialties: {
              include: { specialty: true },
            },
          },
        },
      },
    });

    if (!availability) {
      return NextResponse.json({ error: "Disponibilidad no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ availability });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const access = await canManageAvailability(request, id);

    if (access.response) {
      return access.response;
    }

    if (access.availability?.isBooked) {
      return NextResponse.json({ error: "No se puede editar un horario reservado" }, { status: 409 });
    }

    const body = await request.json();
    const date = parseRequiredDate(body.date, "date");
    const startTime = parseRequiredDate(body.startTime, "startTime");
    const endTime = parseRequiredDate(body.endTime, "endTime");

    if (startTime >= endTime) {
      return NextResponse.json({ error: "startTime debe ser menor que endTime" }, { status: 400 });
    }

    const overlap = await prisma.availability.findFirst({
      where: {
        id: { not: id },
        doctorId: access.availability!.doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlap) {
      return NextResponse.json({ error: "Ya existe un horario cruzado para este medico" }, { status: 409 });
    }

    const availability = await prisma.availability.update({
      where: { id },
      data: { date, startTime, endTime },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Error al actualizar disponibilidad" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const access = await canManageAvailability(request, id);

    if (access.response) {
      return access.response;
    }

    const body = await request.json();

    if (typeof body.isBooked !== "boolean") {
      return NextResponse.json({ error: "isBooked debe ser boolean" }, { status: 400 });
    }

    const availability = await prisma.availability.update({
      where: { id },
      data: { isBooked: body.isBooked },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al cambiar disponibilidad" }, { status: 500 });
  }
}
