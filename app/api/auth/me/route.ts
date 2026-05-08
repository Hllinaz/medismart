import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json({ error: "Error de autenticacion" }, { status: 500 });
  }
}
