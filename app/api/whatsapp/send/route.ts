import { NextResponse, type NextRequest } from "next/server";
import { getWhatsAppClient } from "@/lib/whatsapp/client";

export async function POST(request: NextRequest) {
  const client = getWhatsAppClient();

  try {
    const body = await request.json();
    const { to, text } = body;

    if (!to || !text) {
      return NextResponse.json({ error: "to y text son requeridos" }, { status: 400 });
    }

    if (client.getStatus() !== "connected") {
      return NextResponse.json({ error: "WhatsApp no conectado" }, { status: 503 });
    }

    const result = await client.sendMessage(to, text);

    if (result.success) {
      return NextResponse.json({ success: true, sid: result.sid });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
