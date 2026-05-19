import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function getSpecialtyIds(body: Record<string, unknown>) {
  if (Array.isArray(body.specialtyIds)) {
    return body.specialtyIds.filter((id): id is string => typeof id === "string" && Boolean(id));
  }

  return typeof body.specialtyId === "string" && body.specialtyId ? [body.specialtyId] : [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const { id } = await context.params;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Medico no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al obtener medico" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const body = await request.json();

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Medico no encontrado" }, { status: 404 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const password = typeof body.password === "string" && body.password ? body.password : undefined;
    const specialtyIds = getSpecialtyIds(body);
    const licenseNumber =
      typeof body.licenseNumber === "string" && body.licenseNumber.trim()
        ? body.licenseNumber.trim()
        : undefined;

    if (specialtyIds.length) {
      const specialties = await prisma.specialty.findMany({
        where: { id: { in: specialtyIds }, isActive: true },
      });

      if (specialties.length !== specialtyIds.length) {
        return NextResponse.json({ error: "Una o mas especialidades no existen o estan inactivas" }, { status: 404 });
      }
    }

    const updatedDoctor = await prisma.doctorProfile.update({
      where: { id },
      data: {
        ...(licenseNumber !== undefined ? { licenseNumber } : {}),
        ...(specialtyIds.length
          ? {
              specialties: {
                deleteMany: {},
                create: specialtyIds.map((specialtyId) => ({
                  specialty: {
                    connect: { id: specialtyId },
                  },
                })),
              },
            }
          : {}),
        user: {
          update: {
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
            ...(password ? { password: await hashPassword(password) } : {}),
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    return NextResponse.json({ doctor: updatedDoctor });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al actualizar medico" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const body = await request.json();

    const status =
      body.status === "ACTIVE" || body.status === "INACTIVE" || body.status === "BLOCKED"
        ? body.status
        : typeof body.isActive === "boolean"
          ? body.isActive
            ? "ACTIVE"
            : "INACTIVE"
          : null;

    if (!status) {
      return NextResponse.json({ error: "status debe ser ACTIVE, INACTIVE o BLOCKED" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Medico no encontrado" }, { status: 404 });
    }

    const updatedDoctor = await prisma.doctorProfile.update({
      where: { id },
      data: {
        active: status === "ACTIVE",
        user: {
          update: {
            status,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json({ doctor: updatedDoctor });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al cambiar estado del medico" }, { status: 500 });
  }
}
