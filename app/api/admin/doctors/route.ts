import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function getSpecialtyIds(body: Record<string, unknown>) {
  if (Array.isArray(body.specialtyIds)) {
    return body.specialtyIds.filter((id): id is string => typeof id === "string" && Boolean(id));
  }

  return typeof body.specialtyId === "string" && body.specialtyId ? [body.specialtyId] : [];
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const doctors = await prisma.doctorProfile.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ doctors });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al listar medicos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const specialtyIds = getSpecialtyIds(body);
    const licenseNumber =
      typeof body.licenseNumber === "string" && body.licenseNumber.trim()
        ? body.licenseNumber.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "Name es obligatorio" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password es obligatorio" }, { status: 400 });
    }

    if (!specialtyIds.length) {
      return NextResponse.json({ error: "Debe seleccionar al menos una especialidad" }, { status: 400 });
    }

    const specialties = await prisma.specialty.findMany({
      where: { id: { in: specialtyIds }, isActive: true },
    });

    if (specialties.length !== specialtyIds.length) {
      return NextResponse.json({ error: "Una o mas especialidades no existen o estan inactivas" }, { status: 404 });
    }

    const doctor = await prisma.doctorProfile.create({
      data: {
        licenseNumber,
        specialties: {
          create: specialtyIds.map((specialtyId) => ({
            specialty: {
              connect: { id: specialtyId },
            },
          })),
        },
        user: {
          create: {
            name,
            email,
            password: await hashPassword(password),
            role: "MEDICO" as const,
            status: "ACTIVE",
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

    return NextResponse.json({ doctor }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al crear medico" }, { status: 500 });
  }
}
