import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AuthError } from "@/lib/auth";

/**
 * GET /api/appointments
 * Listar citas del usuario autenticado
 * - PACIENTE: ve sus propias citas
 * - MEDICO: ve citas con sus pacientes
 * - ADMIN: ve todas las citas
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    let appointments;

    if (authUser.role === "PACIENTE") {
      // Ver citas propias como paciente
      appointments = await prisma.appointment.findMany({
        where: { patientId: authUser.id },
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              specialty: { select: { id: true, name: true } },
            },
          },
          patient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dateTime: "desc" },
      });
    } else if (authUser.role === "MEDICO") {
      // Ver citas con pacientes como médico
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: authUser.id },
      });

      if (!doctorProfile) {
        return NextResponse.json(
          { error: "Doctor profile not found" },
          { status: 404 }
        );
      }

      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctorProfile.id },
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              specialty: { select: { id: true, name: true } },
            },
          },
          patient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dateTime: "desc" },
      });
    } else {
      // ADMIN: ver todas
      appointments = await prisma.appointment.findMany({
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              specialty: { select: { id: true, name: true } },
            },
          },
          patient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dateTime: "desc" },
      });
    }

    return NextResponse.json(appointments);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GET /api/appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * Agendar nueva cita (requiere PACIENTE autenticado)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    // Solo pacientes pueden agendar citas
    if (authUser.role !== "PACIENTE") {
      throw new AuthError("Only patients can schedule appointments", 403);
    }

    const body = await request.json();
    const { doctorId, dateTime, reason, notes } = body;

    // Validaciones
    if (!doctorId || typeof doctorId !== "string") {
      return NextResponse.json(
        { error: "doctorId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!dateTime || typeof dateTime !== "string") {
      return NextResponse.json(
        { error: "dateTime is required and must be a string (ISO 8601)" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(dateTime);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "dateTime must be a valid ISO 8601 date string" },
        { status: 400 }
      );
    }

    // Validar que la fecha no es en el pasado
    if (appointmentDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot schedule appointments in the past" },
        { status: 400 }
      );
    }

    if (reason && typeof reason !== "string") {
      return NextResponse.json(
        { error: "reason must be a string" },
        { status: 400 }
      );
    }

    if (notes && typeof notes !== "string") {
      return NextResponse.json(
        { error: "notes must be a string" },
        { status: 400 }
      );
    }

    // Verificar que el doctor existe
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { availabilities: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Validar que el doctor tiene disponibilidad en ese horario
    const dayOfWeek = appointmentDate.getDay();
    const hours = String(appointmentDate.getHours()).padStart(2, "0");
    const minutes = String(appointmentDate.getMinutes()).padStart(2, "0");
    const appointmentTime = `${hours}:${minutes}`;

    const hasAvailability = doctor.availabilities.some((av) => {
      if (av.dayOfWeek !== dayOfWeek || !av.isActive) return false;
      return appointmentTime >= av.startTime && appointmentTime < av.endTime;
    });

    if (!hasAvailability) {
      return NextResponse.json(
        { error: "Doctor is not available at this time" },
        { status: 400 }
      );
    }

    // Crear cita
    const appointment = await prisma.appointment.create({
      data: {
        patientId: authUser.id,
        doctorId,
        dateTime: appointmentDate,
        reason: reason || null,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            specialty: { select: { id: true, name: true } },
          },
        },
        patient: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "This appointment slot is already booked" },
        { status: 409 }
      );
    }
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
