import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error de autenticacion" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const dateOfBirth =
      typeof body.dateOfBirth === "string" && body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : null;

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "El telefono es obligatorio" }, { status: 400 });
    }

    if (body.dateOfBirth && (!dateOfBirth || Number.isNaN(dateOfBirth.getTime()))) {
      return NextResponse.json({ error: "La fecha de nacimiento no es valida" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone,
        dateOfBirth,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    const authResponse = authErrorResponse(error);

    if (authResponse) {
      return authResponse;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "El telefono ya esta registrado" }, { status: 409 });
    }

    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
