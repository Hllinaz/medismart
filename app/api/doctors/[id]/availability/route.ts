import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AuthError } from "@/lib/auth";

/**
 * GET /api/doctors/[id]/availability
 * Lista la disponibilidad de un doctor (público)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;

    // Validar que el doctor existe
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    const availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("GET /api/doctors/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/doctors/[id]/availability
 * Crear nuevo slot de disponibilidad (requiere MEDICO dueño del perfil O ADMIN)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: doctorId } = await params;

    // Verificar que el doctor existe y pertenece a un usuario
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Autorización: solo el doctor propietario o ADMIN pueden crear disponibilidad
    if (authUser.role !== "ADMIN" && doctor.userId !== authUser.id) {
      throw new AuthError("Forbidden", 403);
    }

    // Validar rol (debe ser MEDICO o ADMIN)
    if (authUser.role !== "ADMIN" && authUser.role !== "MEDICO") {
      throw new AuthError("Only doctors or admins can create availability", 403);
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body;

    // Validaciones
    if (
      dayOfWeek === undefined ||
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return NextResponse.json(
        { error: "dayOfWeek must be a number between 0-6" },
        { status: 400 }
      );
    }

    if (!startTime || typeof startTime !== "string") {
      return NextResponse.json(
        { error: "startTime is required and must be a string (HH:MM)" },
        { status: 400 }
      );
    }

    if (!endTime || typeof endTime !== "string") {
      return NextResponse.json(
        { error: "endTime is required and must be a string (HH:MM)" },
        { status: 400 }
      );
    }

    // Validar formato HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "startTime and endTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    // Validar que startTime < endTime
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    // Crear disponibilidad
    const availability = await prisma.doctorAvailability.create({
      data: {
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "This availability slot already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/doctors/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
