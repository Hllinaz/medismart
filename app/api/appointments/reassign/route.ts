import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { processReassignmentQueue } from "@/lib/reassignmentQueue";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["ADMIN", "MEDICO"]);

    const results = await processReassignmentQueue();

    return NextResponse.json({
      message: "Cola de reasignación procesada",
      count: results.length,
      results,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[appointments/reassign]", error);

    return NextResponse.json(
      { error: "Error al procesar la cola de reasignación" },
      { status: 500 }
    );
  }
}