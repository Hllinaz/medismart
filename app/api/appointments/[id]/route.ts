import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, AuthError } from "@/lib/auth";

/**
 * GET /api/appointments/[id]
 * Ver detalle de una cita (requiere ser paciente, doctor o ADMIN)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Autorización: paciente, doctor o ADMIN pueden ver
    const isPatient = appointment.patientId === authUser.id;
    const isDoctorProfile = await prisma.doctorProfile.findFirst({
      where: { userId: authUser.id, id: appointment.doctorId },
    });
    const isDoctor = isDoctorProfile !== null;
    const isAdmin = authUser.role === "ADMIN";

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new AuthError("Forbidden", 403);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GET /api/appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/[id]
 * Cambiar status de cita
 * - MEDICO: puede cambiar a CONFIRMED/COMPLETED/CANCELLED
 * - PACIENTE: puede cambiar a CANCELLED (solo la propia)
 * - ADMIN: puede cambiar a cualquier estado
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          include: { user: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, dateTime } = body;

    if (!status && !dateTime) {
      return NextResponse.json(
        { error: "At least status or dateTime must be provided" },
        { status: 400 }
      );
    }

    if (status) {
      if (typeof status !== "string") {
        return NextResponse.json({ error: "status must be a string" }, { status: 400 });
      }
      const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (dateTime && typeof dateTime === "string") {
      const newDate = new Date(dateTime);
      if (isNaN(newDate.getTime())) {
        return NextResponse.json({ error: "dateTime must be a valid ISO 8601 date" }, { status: 400 });
      }
      if (newDate < new Date()) {
        return NextResponse.json({ error: "Cannot reschedule to a past date" }, { status: 400 });
      }
    }

    // Autorización
    const isOwnAppointment = appointment.patientId === authUser.id;
    const isOwnDoctorAppointment = appointment.doctor.userId === authUser.id;

    if (status === "CANCELLED" && (isOwnAppointment || authUser.role === "ADMIN" || isOwnDoctorAppointment)) {
      // Todos pueden cancelar si tienen permisos
    } else if (dateTime && isOwnAppointment && appointment.status === "PENDING") {
      // Paciente puede reprogramar su propia cita PENDING
    } else if (authUser.role === "ADMIN") {
      // ADMIN puede todo
    } else if (authUser.role === "MEDICO" && isOwnDoctorAppointment) {
      if (!["CONFIRMED", "COMPLETED", "CANCELLED"].includes(status!)) {
        return NextResponse.json(
          { error: "Doctors can only change to CONFIRMED, COMPLETED, or CANCELLED" },
          { status: 400 }
        );
      }
    } else if (authUser.role === "PACIENTE" && isOwnAppointment) {
      if (status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Patients can only cancel their own appointments" },
          { status: 400 }
        );
      }
    } else {
      throw new AuthError("Forbidden", 403);
    }

    // Construir data de actualización
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    if (dateTime && typeof dateTime === "string") {
      updateData.dateTime = new Date(dateTime);
      updateData.status = "PENDING";
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id]
 * Cancelar cita (requiere ser paciente propietario o ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      throw new AuthError("Not authenticated");
    }

    const { id: appointmentId } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Autorización: solo paciente propietario o ADMIN
    if (authUser.role !== "ADMIN" && appointment.patientId !== authUser.id) {
      throw new AuthError("Forbidden", 403);
    }

    // Eliminar
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json(
      { message: "Appointment cancelled" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("DELETE /api/appointments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
