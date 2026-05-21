import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["PACIENTE", "MEDICO", "ADMIN"]);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        sentDate: "desc",
      },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        sentDate: true,
        appointmentId: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}