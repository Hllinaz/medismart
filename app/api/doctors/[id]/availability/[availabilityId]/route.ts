import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AuthError } from "@/lib/auth";

/**
 * PUT /api/doctors/[id]/availability/[availabilityId]
 * Actualizar slot de disponibilidad (requiere MEDICO dueño O ADMIN)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; availabilityId: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: doctorId, availabilityId } = await params;

    // Verificar que el doctor existe
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

    // Autorización: solo el doctor propietario o ADMIN pueden editar su disponibilidad
    if (authUser.role !== "ADMIN" && doctor.userId !== authUser.id) {
      throw new AuthError("Forbidden", 403);
    }

    // Verificar que el slot existe y pertenece al doctor
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId },
    });

    if (!availability || availability.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isActive } = body;

    // Validar datos si se proporcionan
    if (
      dayOfWeek !== undefined &&
      (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6)
    ) {
      return NextResponse.json(
        { error: "dayOfWeek must be a number between 0-6" },
        { status: 400 }
      );
    }

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (startTime !== undefined) {
      if (typeof startTime !== "string" || !timeRegex.test(startTime)) {
        return NextResponse.json(
          { error: "startTime must be in HH:MM format" },
          { status: 400 }
        );
      }
    }

    if (endTime !== undefined) {
      if (typeof endTime !== "string" || !timeRegex.test(endTime)) {
        return NextResponse.json(
          { error: "endTime must be in HH:MM format" },
          { status: 400 }
        );
      }
    }

    // Validar que startTime < endTime (si ambos se actualizan)
    const finalStart = startTime || availability.startTime;
    const finalEnd = endTime || availability.endTime;
    const [startHour, startMin] = finalStart.split(":").map(Number);
    const [endHour, endMin] = finalEnd.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { error: "startTime must be before endTime" },
        { status: 400 }
      );
    }

    // Actualizar disponibilidad
    const updated = await prisma.doctorAvailability.update({
      where: { id: availabilityId },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
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
    console.error("PUT /api/doctors/[id]/availability/[availabilityId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/doctors/[id]/availability/[availabilityId]
 * Eliminar slot de disponibilidad (requiere MEDICO dueño O ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; availabilityId: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: doctorId, availabilityId } = await params;

    // Verificar que el doctor existe
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

    // Autorización: solo el doctor propietario o ADMIN pueden eliminar
    if (authUser.role !== "ADMIN" && doctor.userId !== authUser.id) {
      throw new AuthError("Forbidden", 403);
    }

    // Verificar que el slot existe y pertenece al doctor
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId },
    });

    if (!availability || availability.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    // Eliminar
    await prisma.doctorAvailability.delete({
      where: { id: availabilityId },
    });

    return NextResponse.json(
      { message: "Availability slot deleted" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("DELETE /api/doctors/[id]/availability/[availabilityId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
