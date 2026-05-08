import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
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

    const specialty = await prisma.specialty.findUnique({
      where: { id },
    });

    if (!specialty) {
      return NextResponse.json({ error: "Especialidad no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ specialty });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al obtener especialidad" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : undefined;

    const specialtyExists = await prisma.specialty.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!specialtyExists) {
      return NextResponse.json({ error: "Especialidad no encontrada" }, { status: 404 });
    }

    const specialty = await prisma.specialty.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Especialidad ya registrada" }, { status: 409 });
    }

    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al actualizar especialidad" }, { status: 500 });
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

    const specialtyExists = await prisma.specialty.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!specialtyExists) {
      return NextResponse.json({ error: "Especialidad no encontrada" }, { status: 404 });
    }

    const specialty = await prisma.specialty.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al cambiar estado de especialidad" }, { status: 500 });
  }
}
