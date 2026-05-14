import { NextResponse, type NextRequest } from "next/server";
import { getWhatsAppClient } from "@/lib/whatsapp/client";
import { createOllamaClient } from "@/lib/ollama/client";
import { buildConversationMessages, parseAssistantResponse } from "@/lib/ollama/prompts";
import { conversationStore } from "@/lib/conversation/store";
import { prisma } from "@/lib/prisma";
import type { AssistantAction } from "@/lib/ollama/types";

async function executeAction(action: AssistantAction): Promise<string> {
  switch (action.intent) {
    case "listar_especialidades": {
      const specialties = await prisma.specialty.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      if (specialties.length === 0) {
        return "En este momento no tenemos especialidades disponibles.";
      }

      return `Especialidades disponibles:\n\n${specialties
        .map((s, i) => `${i + 1}. ${s.name}${s.description ? ` - ${s.description}` : ""}`)
        .join("\n")}\n\nResponde con el nombre de la especialidad que te interesa.`;
    }

    case "listar_medicos": {
      const especialidad = action.entities.especialidad;
      if (!especialidad) {
        return "¿De que especialidad te gustaria ver los medicos?";
      }

      const specialty = await prisma.specialty.findFirst({
        where: {
          isActive: true,
          name: { contains: especialidad },
        },
      });

      if (!specialty) {
        return `No encontre la especialidad "${especialidad}". Escribe "Especialidades" para ver las disponibles.`;
      }

      const doctors = await prisma.doctorProfile.findMany({
        where: {
          specialtyId: specialty.id,
          user: { isActive: true },
        },
        include: {
          user: { select: { name: true } },
          availabilities: {
            where: { isActive: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      });

      if (doctors.length === 0) {
        return `No hay medicos disponibles en ${specialty.name} en este momento.`;
      }

      const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

      const doctorList = doctors
        .map((d) => {
          const days = [...new Set(d.availabilities.map((a) => a.dayOfWeek))].sort();
          const schedule =
            days.length > 0
              ? `Disponible: ${days.map((d) => dayNames[d]).join(", ")}`
              : "Sin horarios registrados";
          return `${d.user.name}\n   ${schedule}`;
        })
        .join("\n\n");

      return `Medicos en ${specialty.name}:\n\n${doctorList}\n\n¿Te gustaria agendar una cita con alguno?`;
    }

    case "ayuda":
      return (
        "Asistente MediSmart\n\n" +
        "Puedo ayudarte con:\n" +
        "Ver especialidades disponibles\n" +
        "Buscar medicos por especialidad\n" +
        "Consultar horarios\n" +
        "Agendar citas\n\n" +
        'Ejemplos:\n- "Que especialidades tienen"\n- "Necesito un cardiologo"\n- "Quiero agendar una cita"'
      );

    case "agendar_cita":
      return "Para agendar una cita, visita nuestra plataforma web en /dashboard/appointments/new. Alli puedes seleccionar especialidad, medico, fecha y confirmar tu cita.";

    case "mis_citas":
      return "Para consultar tus citas, ingresa a nuestra plataforma web. Una vez autenticado podras ver todas tus citas agendadas.";

    case "cancelar_cita":
      return "Para cancelar una cita, ingresa a la plataforma web. Alli podras gestionar tus citas.";

    default:
      return action.response;
  }
}

async function handleIncomingMessage(from: string, body: string, contactName?: string) {
  const ollama = createOllamaClient();
  const client = getWhatsAppClient();

  conversationStore.getOrCreate(from, contactName);

  conversationStore.addMessage(from, "user", body);

  try {
    const history = conversationStore.getHistory(from, 10);
    const ollamaMessages = buildConversationMessages(
      history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      body
    );

    const response = await ollama.chat(ollamaMessages);
    const rawContent = response.message.content;

    const action = parseAssistantResponse(rawContent);

    if (!action) {
      const fallback = await ollama.chat([
        { role: "system", content: "Responde en espanol de forma amable y natural como asistente de citas medicas. Se breve (max 3 parrafos)." },
        ...ollamaMessages.slice(-2),
      ]);
      const fallbackText = fallback.message.content;
      await client.sendMessage(from, fallbackText);
      conversationStore.addMessage(from, "assistant", fallbackText);
      return;
    }

    if (action.require_action) {
      const resultText = await executeAction(action);

      const enrichedMessages = [
        { role: "system" as const, content: "Eres un asistente amable de MediSmart. Genera una respuesta natural y amigable basada en los datos proporcionados. No incluyas JSON. Se breve (max 3 parrafos)." },
        ...ollamaMessages.slice(-2),
        { role: "assistant" as const, content: rawContent },
        { role: "user" as const, content: `Datos obtenidos del sistema:\n${resultText}\n\nGenera una respuesta amigable para el usuario.` },
      ];

      const enrichedResponse = await ollama.chat(enrichedMessages);
      const finalText = enrichedResponse.message.content;

      await client.sendMessage(from, finalText);
      conversationStore.addMessage(from, "assistant", finalText);
    } else {
      await client.sendMessage(from, action.response);
      conversationStore.addMessage(from, "assistant", action.response);
    }
  } catch {
    const fallback = `Hola ${contactName ?? ""}! Soy el asistente de MediSmart. Puedo ayudarte a consultar especialidades, medicos o agendar citas. ¿Que necesitas?`.trim();
    await client.sendMessage(from, fallback);
    conversationStore.addMessage(from, "assistant", fallback);
  }
}

export async function GET() {
  const client = getWhatsAppClient();
  const status = client.getStatus();
  const qr = client.getQR();

  return NextResponse.json({
    status,
    qr: qr ? { base64: qr.base64, timestamp: qr.timestamp } : null,
  });
}

export async function POST(request: NextRequest) {
  const client = getWhatsAppClient();

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "init") {
      client.onMessage(handleIncomingMessage);
      await client.initialize();
      return NextResponse.json({ status: client.getStatus() });
    }

    if (action === "send") {
      const { to, text } = body;
      if (!to || !text) {
        return NextResponse.json({ error: "to y text son requeridos" }, { status: 400 });
      }
      const result = await client.sendMessage(to, text);
      return NextResponse.json(result);
    }

    if (action === "status") {
      return NextResponse.json({
        status: client.getStatus(),
        qr: client.getQR(),
      });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
