import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const user = await requireRole(request, ["MEDICO", "ADMIN"]);
        const { id } = await context.params;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                doctor: true,
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        if (appointment.status !== "SCHEDULED") {
            return NextResponse.json(
                { error: "Solo se pueden completar citas programadas" },
                { status: 409 },
            );
        }

        if (user.role === "MEDICO" && appointment.doctor.userId !== user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: { status: "COMPLETED" },
        });

        return NextResponse.json({ appointment: updatedAppointment });
    } catch (error) {
        return (
            authErrorResponse(error) ??
            NextResponse.json({ error: "Error al completar cita" }, { status: 500 })
        );
    }
}