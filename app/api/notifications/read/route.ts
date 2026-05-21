import { NextResponse, type NextRequest } from "next/server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(request, ["PACIENTE", "MEDICO", "ADMIN"]);

    const body = await request.json();

    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId
        : "";

    // Marcar una sola
    if (notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    // Marcar todas
    else {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 },
    );
  }
}