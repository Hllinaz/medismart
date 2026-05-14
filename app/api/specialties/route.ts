import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const specialties = await prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ specialties });
  } catch {
    return NextResponse.json({ error: "Error al listar especialidades" }, { status: 500 });
  }
}
