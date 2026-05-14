import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        user: { isActive: true },
        specialty: { isActive: true },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        specialty: {
          select: { id: true, name: true },
        },
        availabilities: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ doctors });
  } catch {
    return NextResponse.json({ error: "Error al obtener doctores" }, { status: 500 });
  }
}
