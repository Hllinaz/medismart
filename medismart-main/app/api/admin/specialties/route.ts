import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ specialties });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al listar especialidades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "Name es obligatorio" }, { status: 400 });
    }

    const specialty = await prisma.specialty.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({ specialty }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Especialidad ya registrada" }, { status: 409 });
    }

    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al crear especialidad" }, { status: 500 });
  }
}
