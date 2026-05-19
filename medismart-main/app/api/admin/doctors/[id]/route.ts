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
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        specialty: true,
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
    const specialtyId = typeof body.specialtyId === "string" ? body.specialtyId : undefined;
    const licenseNumber =
      typeof body.licenseNumber === "string" && body.licenseNumber.trim()
        ? body.licenseNumber.trim()
        : undefined;

    if (specialtyId) {
      const specialty = await prisma.specialty.findFirst({
        where: { id: specialtyId, isActive: true },
      });

      if (!specialty) {
        return NextResponse.json({ error: "Especialidad no encontrada o inactiva" }, { status: 404 });
      }
    }

    const updatedDoctor = await prisma.doctorProfile.update({
      where: { id },
      data: {
        ...(specialtyId ? { specialty: { connect: { id: specialtyId } } } : {}),
        ...(licenseNumber !== undefined ? { licenseNumber } : {}),
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
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        specialty: true,
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

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive debe ser boolean" }, { status: 400 });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Medico no encontrado" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: doctor.userId },
      data: { isActive: body.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al cambiar estado del medico" }, { status: 500 });
  }
}
