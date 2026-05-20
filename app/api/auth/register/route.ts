import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashPassword } from "@/lib/auth";

const validRoles = ["PACIENTE"] as const;

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code:
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : undefined,
    };
  }

  return {
    message: "Error desconocido",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const dateOfBirth =
      typeof body.dateOfBirth === "string" && body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : null;
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role : "PACIENTE";

    if (!name) {
      return NextResponse.json({ error: "Name es obligatorio" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: "El número de telefono es obligatorio" }, { status: 400 })
    }

    if (!dateOfBirth) {
      return NextResponse.json({ error: "La fecha de nacimiento es obligatoria" }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: "Password es obligatorio" }, { status: 400 });
    }

    if (!validRoles.includes(role as (typeof validRoles)[number])) {
      return NextResponse.json(
        { error: "El registro publico solo permite rol PACIENTE" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        dateOfBirth,
        password: await hashPassword(password),
        role,
        patientProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });
    const response = NextResponse.json({ user, token }, { status: 201 });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    const details = getErrorDetails(error);

    console.error("[auth/register] Error al registrar usuario", {
      details,
      databaseUrlHost: process.env.DATABASE_URL?.replace(
        /mysql:\/\/.*:.*@([^/]+)\/.*/,
        "$1",
      ),
    });

    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: "Error al registrar usuario",
        ...(process.env.NODE_ENV !== "production" ? { details } : {}),
      },
      { status: 500 },
    );
  }
}
