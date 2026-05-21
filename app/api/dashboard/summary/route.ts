import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const appointmentSelect = {
  id: true,
  appointmentDate: true,
  status: true,
  priority: true,
  symptoms: true,
  patient: {
    select: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  doctor: {
    select: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  specialty: {
    select: {
      id: true,
      name: true,
    },
  },
  evaluation: {
    select: {
      id: true,
      rating: true,
    },
  },
};

function countByStatus(
  items: Array<{ status: "SCHEDULED" | "CANCELLED" | "PENDING_REASSIGNMENT" | "COMPLETED"; _count: number }>,
) {
  return {
    scheduled: items.find((item) => item.status === "SCHEDULED")?._count ?? 0,
    cancelled: items.find((item) => item.status === "CANCELLED")?._count ?? 0,
    pendingReassignment:
      items.find((item) => item.status === "PENDING_REASSIGNMENT")?._count ?? 0,
    completed: items.find((item) => item.status === "COMPLETED")?._count ?? 0,
  };
}

async function getRecentNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { sentDate: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      sentDate: true,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["PACIENTE", "MEDICO", "ADMIN"]);
    const now = new Date();

    const [notifications, unreadNotifications] = await Promise.all([
      getRecentNotifications(user.id),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    if (user.role === "MEDICO") {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          licenseNumber: true,
          active: true,
          specialties: {
            select: {
              specialty: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
            orderBy: {
              specialty: {
                name: "asc",
              },
            },
          },
        },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Perfil medico no encontrado" },
          { status: 404 },
        );
      }

      const [appointmentsByStatus, availabilityByState, upcomingAppointments] =
        await Promise.all([
          prisma.appointment.groupBy({
            by: ["status"],
            where: { doctorId: doctor.id },
            _count: true,
          }),
          prisma.availability.groupBy({
            by: ["isBooked"],
            where: {
              doctorId: doctor.id,
              startTime: {
                gte: now,
              },
            },
            _count: true,
          }),
          prisma.appointment.findMany({
            where: {
              doctorId: doctor.id,
              status: "SCHEDULED",
              appointmentDate: {
                gte: now,
              },
            },
            orderBy: [{ appointmentDate: "asc" }],
            take: 5,
            select: appointmentSelect,
          }),
        ]);

      return NextResponse.json({
        summary: {
          role: "MEDICO",
          doctor: {
            id: doctor.id,
            licenseNumber: doctor.licenseNumber,
            active: doctor.active,
            specialties: doctor.specialties.map((item) => item.specialty),
          },
          appointments: countByStatus(appointmentsByStatus),
          availability: {
            free:
              availabilityByState.find((item) => item.isBooked === false)
                ?._count ?? 0,
            booked:
              availabilityByState.find((item) => item.isBooked === true)
                ?._count ?? 0,
          },
          upcomingAppointments,
          notifications,
          unreadNotifications,
        },
      });
    }

    if (user.role === "PACIENTE") {
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Perfil de paciente no encontrado" },
          { status: 404 },
        );
      }

      const [
        appointmentsByStatus,
        upcomingAppointments,
        pendingEvaluations,
        recentAppointments,
      ] = await Promise.all([
        prisma.appointment.groupBy({
          by: ["status"],
          where: { patientId: patient.id },
          _count: true,
        }),
        prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            status: "SCHEDULED",
            appointmentDate: {
              gte: now,
            },
          },
          orderBy: [{ appointmentDate: "asc" }],
          take: 5,
          select: appointmentSelect,
        }),
        prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            status: "COMPLETED",
            evaluation: null,
          },
          orderBy: [{ appointmentDate: "desc" }],
          take: 5,
          select: appointmentSelect,
        }),
        prisma.appointment.findMany({
          where: { patientId: patient.id },
          orderBy: [{ appointmentDate: "desc" }],
          take: 5,
          select: appointmentSelect,
        }),
      ]);

      return NextResponse.json({
        summary: {
          role: "PACIENTE",
          patient,
          appointments: countByStatus(appointmentsByStatus),
          upcomingAppointments,
          pendingEvaluations,
          recentAppointments,
          notifications,
          unreadNotifications,
        },
      });
    }

    const [
      appointmentsByStatus,
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalSpecialties,
      pendingReassignment,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.doctorProfile.count(),
      prisma.doctorProfile.count({
        where: {
          active: true,
          user: {
            status: "ACTIVE",
          },
        },
      }),
      prisma.patientProfile.count(),
      prisma.specialty.count({
        where: { isActive: true },
      }),
      prisma.appointment.count({
        where: { status: "PENDING_REASSIGNMENT" },
      }),
      prisma.appointment.findMany({
        orderBy: [{ appointmentDate: "desc" }],
        take: 5,
        select: appointmentSelect,
      }),
    ]);

    return NextResponse.json({
      summary: {
        role: "ADMIN",
        appointments: countByStatus(appointmentsByStatus),
        users: {
          doctors: totalDoctors,
          activeDoctors,
          patients: totalPatients,
        },
        specialties: {
          active: totalSpecialties,
        },
        pendingReassignment,
        recentAppointments,
        notifications,
        unreadNotifications,
      },
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Error al cargar resumen del dashboard" },
        { status: 500 },
      )
    );
  }
}
