import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["ADMIN", "MEDICO", "PACIENTE"]);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;

    if (user.role !== "ADMIN" && userId && userId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const notifications = await prisma.notification.findMany({
      where: user.role === "ADMIN" ? { ...(userId ? { userId } : {}) } : { userId: user.id },
      orderBy: { sentDate: "desc" },
      include: {
        appointment: true,
      },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error al listar notificaciones" }, { status: 500 });
  }
}
