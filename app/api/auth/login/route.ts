import { NextResponse, type NextRequest } from "next/server";
import { comparePassword, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password es obligatorio" }, { status: 400 });
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { email },
    });

    if (!userWithPassword || userWithPassword.status !== "ACTIVE") {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    const isValidPassword = await comparePassword(password, userWithPassword.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    const user = {
      id: userWithPassword.id,
      name: userWithPassword.name,
      email: userWithPassword.email,
      role: userWithPassword.role,
      status: userWithPassword.status,
      createdAt: userWithPassword.createdAt,
      updatedAt: userWithPassword.updatedAt,
    };

    const token = generateToken({ userId: user.id, role: user.role });
    const response = NextResponse.json({ user, token });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesion" }, { status: 500 });
  }
}
