import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculatePriority,
  getDoctorProfileId,
  getPatientProfileId,
  normalizeAppointmentStatus,
} from "@/lib/scheduling";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { searchParams } = new URL(request.url);
    const status = normalizeAppointmentStatus(searchParams.get("status"));
    const doctorId = searchParams.get("doctorId") ?? undefined;
    const patientId = searchParams.get("patientId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      ...(status ? { status } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(patientId ? { patientId } : {}),
      ...(from || to
        ? {
          appointmentDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
        : {}),
    };

    if (user.role === "PACIENTE") {
      const currentPatientId = await getPatientProfileId(user.id);

      if (!currentPatientId) {
        return NextResponse.json({ error: "Perfil de paciente no encontrado" }, { status: 404 });
      }

      Object.assign(where, { patientId: currentPatientId });
    }

    if (user.role === "MEDICO") {
      const currentDoctorId = await getDoctorProfileId(user.id);

      if (!currentDoctorId) {
        return NextResponse.json({ error: "Perfil medico no encontrado" }, { status: 404 });
      }

      Object.assign(where, { doctorId: currentDoctorId });
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ priority: "asc" }, { requestDate: "asc" }],
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true, status: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true, status: true } } } },
        availability: true,
        evaluation: true,
        specialty: { select: { id: true, name: true, description: true } }
      },
    });

    const sortedAppointments = appointments.sort((a, b) => {
      const rank = { HIGH: 0, NORMAL: 1, LOW: 2 };
      const priorityDiff = rank[a.priority] - rank[b.priority];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return a.requestDate.getTime() - b.requestDate.getTime();
    });

    return NextResponse.json({ appointments: sortedAppointments });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al listar citas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["PACIENTE", "ADMIN"]);
    const body = await request.json();
    const availabilityId = typeof body.availabilityId === "string" ? body.availabilityId : "";
    const requestedPatientId = typeof body.patientId === "string" ? body.patientId : "";

    if (!availabilityId) {
      return NextResponse.json({ error: "availabilityId es obligatorio" }, { status: 400 });
    }

    const patientId = user.role === "PACIENTE" ? await getPatientProfileId(user.id) : requestedPatientId;

    if (!patientId) {
      return NextResponse.json({ error: "patientId es obligatorio" }, { status: 400 });
    }

    const priority = calculatePriority({
      priority: body.priority,
      symptoms: body.symptoms,
      urgent: body.urgent,
    });

    const appointment = await prisma.$transaction(async (tx) => {
      const availability = await tx.availability.findUnique({
        where: { id: availabilityId },
        include: { doctor: { include: { user: true } } },
      });

      if (!availability || !availability.doctor.active || availability.doctor.user.status !== "ACTIVE") {
        throw new Error("Horario no encontrado o medico inactivo");
      }

      if (availability.isBooked) {
        throw new Error("El horario ya esta ocupado");
      }

      const createdAppointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId: availability.doctorId,
          availabilityId,

          specialtyId:
            typeof body.specialtyId === "string"
              ? body.specialtyId
              : null,

          symptoms:
            typeof body.symptoms === "string"
              ? body.symptoms
              : null,

          appointmentDate: availability.startTime,

          priority,
          status: "SCHEDULED",
          wasReassigned: false,
        },
      });

      await tx.availability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      });

      return createdAppointment;
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ error: "Error al agendar cita" }, { status: 500 });
  }
}
