import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateAvailabilitySlots,
  getDoctorProfileId,
  hasTimeOverlap,
  parseNonNegativeInteger,
  parsePositiveInteger,
  parseRequiredDate,
} from "@/lib/scheduling";

function dateRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") ?? undefined;
    const date = searchParams.get("date");
    const isBookedParam = searchParams.get("isBooked");

    const where = {
      ...(doctorId ? { doctorId } : {}),
      ...(date
        ? {
            date: {
              gte: dateRange(new Date(date)).start,
              lt: dateRange(new Date(date)).end,
            },
          }
        : {}),
      ...(isBookedParam === "true" || isBookedParam === "false"
        ? { isBooked: isBookedParam === "true" }
        : {}),
    };

    if (user.role === "MEDICO") {
      const currentDoctorId = await getDoctorProfileId(user.id);

      if (!currentDoctorId) {
        return NextResponse.json({ error: "Perfil medico no encontrado" }, { status: 404 });
      }

      if (doctorId && doctorId !== currentDoctorId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      Object.assign(where, { doctorId: currentDoctorId });
    }

    const availability = await prisma.availability.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
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

    return NextResponse.json({ availability });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al listar disponibilidad" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["ADMIN", "MEDICO"]);
    const body = await request.json();
    const mode = body.mode === "bulk" ? "bulk" : "single";
    const requestedDoctorId = typeof body.doctorId === "string" ? body.doctorId : "";
    const date = parseRequiredDate(body.date, "date");
    const startTime = parseRequiredDate(body.startTime, "startTime");
    const endTime = parseRequiredDate(body.endTime, "endTime");

    if (startTime >= endTime) {
      return NextResponse.json({ error: "startTime debe ser menor que endTime" }, { status: 400 });
    }

    const doctorId = user.role === "MEDICO" ? await getDoctorProfileId(user.id) : requestedDoctorId;

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId es obligatorio" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, active: true, user: { status: "ACTIVE" } },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Medico no encontrado o inactivo" }, { status: 404 });
    }

    if (mode === "bulk") {
      const durationMinutes = parsePositiveInteger(body.durationMinutes, "durationMinutes");
      const breakMinutes = parseNonNegativeInteger(body.breakMinutes ?? 0, "breakMinutes");
      const slots = generateAvailabilitySlots({
        date,
        startTime,
        endTime,
        durationMinutes,
        breakMinutes,
      });

      const existingAvailability = await prisma.availability.findMany({
        where: {
          doctorId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      });

      const conflictingSlots = slots.filter((slot) =>
        existingAvailability.some((existing) => hasTimeOverlap(slot, existing)),
      );

      if (conflictingSlots.length) {
        return NextResponse.json(
          {
            error: `El bloque tiene ${conflictingSlots.length} cupo(s) cruzados con horarios existentes`,
          },
          { status: 409 },
        );
      }

      const result = await prisma.$transaction(async (tx) =>
        tx.availability.createMany({
          data: slots.map((slot) => ({
            doctorId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false,
          })),
        }),
      );

      return NextResponse.json(
        {
          count: result.count,
          availability: slots,
        },
        { status: 201 },
      );
    }

    const overlap = await prisma.availability.findFirst({
      where: {
        doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlap) {
      return NextResponse.json({ error: "Ya existe un horario cruzado para este medico" }, { status: 409 });
    }

    const availability = await prisma.availability.create({
      data: {
        doctorId,
        date,
        startTime,
        endTime,
        isBooked: false,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Error al crear disponibilidad" }, { status: 500 });
  }
}
