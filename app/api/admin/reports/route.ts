import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateFilter = from || to
      ? {
          appointmentDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {};

    const [total, cancelled, completed, scheduled, byDoctor, bySpecialty] = await Promise.all([
      prisma.appointment.count({ where: dateFilter }),
      prisma.appointment.count({ where: { ...dateFilter, status: "CANCELLED" } }),
      prisma.appointment.count({ where: { ...dateFilter, status: "COMPLETED" } }),
      prisma.appointment.count({ where: { ...dateFilter, status: "SCHEDULED" } }),
      prisma.appointment.groupBy({
        by: ["doctorId"],
        where: dateFilter,
        _count: { _all: true },
      }),
      prisma.doctorSpecialty.findMany({
        include: {
          specialty: true,
          doctor: {
            include: {
              appointments: {
                where: dateFilter,
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    const doctors = await prisma.doctorProfile.findMany({
      where: { id: { in: byDoctor.map((item) => item.doctorId) } },
      include: { user: { select: { name: true, email: true } } },
    });

    const doctorNameById = new Map(doctors.map((doctor) => [doctor.id, doctor.user.name]));
    const specialtyCounts = new Map<string, { specialtyId: string; name: string; count: number }>();

    for (const item of bySpecialty) {
      const current = specialtyCounts.get(item.specialtyId) ?? {
        specialtyId: item.specialtyId,
        name: item.specialty.name,
        count: 0,
      };

      current.count += item.doctor.appointments.length;
      specialtyCounts.set(item.specialtyId, current);
    }

    return NextResponse.json({
      reports: {
        totalAppointments: total,
        cancelledAppointments: cancelled,
        completedAppointments: completed,
        scheduledAppointments: scheduled,
        noShowRate: null,
        byDoctor: byDoctor.map((item) => ({
          doctorId: item.doctorId,
          doctorName: doctorNameById.get(item.doctorId) ?? "Medico",
          count: item._count._all,
        })),
        bySpecialty: Array.from(specialtyCounts.values()),
      },
    });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al generar reportes" }, { status: 500 });
  }
}
