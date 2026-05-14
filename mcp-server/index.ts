import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

type DoctorProfile = {
  id: string;
  userId: string;
  specialtyId: string;
  licenseNumber: string | null;
  user: { name: string; email: string };
  specialty: { name: string };
  availabilities: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

async function query<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  const url = process.env.INTERNAL_API_URL ?? "http://localhost:3000";

  try {
    if (query === "specialties") {
      const res = await fetch(`${url}/api/specialties`);
      const data = await res.json();
      return data.specialties as T;
    }

    if (query === "doctors") {
      const res = await fetch(`${url}/api/doctors`);
      const data = await res.json();
      return data.doctors as T;
    }

    if (query === "create_appointment") {
      const res = await fetch(`${url}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data as T;
    }

    throw new Error(`Unknown query: ${query}`);
  } catch (error) {
    throw new Error(`Query failed: ${error instanceof Error ? error.message : "Unknown"}`);
  }
}

const server = new Server(
  { name: "medismart-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "listar_especialidades",
      description: "Lista todas las especialidades medicas disponibles",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "listar_medicos",
      description: "Lista todos los medicos activos, opcionalmente filtrados por especialidad",
      inputSchema: {
        type: "object",
        properties: {
          especialidad: {
            type: "string",
            description: "Nombre de la especialidad para filtrar (opcional)",
          },
        },
        required: [],
      },
    },
    {
      name: "consultar_disponibilidad",
      description: "Obtiene la disponibilidad de un medico por su ID",
      inputSchema: {
        type: "object",
        properties: {
          doctorId: {
            type: "string",
            description: "ID del medico",
          },
        },
        required: ["doctorId"],
      },
    },
    {
      name: "agendar_cita",
      description: "Agenda una nueva cita medica",
      inputSchema: {
        type: "object",
        properties: {
          doctorId: {
            type: "string",
            description: "ID del medico",
          },
          dateTime: {
            type: "string",
            description: "Fecha y hora ISO 8601 (ej: 2026-05-20T10:00:00.000Z)",
          },
          reason: {
            type: "string",
            description: "Motivo de la cita (opcional)",
          },
        },
        required: ["doctorId", "dateTime"],
      },
    },
    {
      name: "mis_citas",
      description: "Obtiene las citas de un paciente. Nota: actualmente muestra citas de ejemplo ya que la autenticacion del paciente debe implementarse",
      inputSchema: {
        type: "object",
        properties: {
          pacienteId: {
            type: "string",
            description: "ID del paciente (opcional)",
          },
        },
        required: [],
      },
    },
    {
      name: "cancelar_cita",
      description: "Cancela una cita existente por su ID",
      inputSchema: {
        type: "object",
        properties: {
          citaId: {
            type: "string",
            description: "ID de la cita a cancelar",
          },
        },
        required: ["citaId"],
      },
    },
  ],
}));

const dayLabels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "listar_especialidades": {
      const specialties = await query<Array<{ id: string; name: string; description: string | null }>>("specialties");

      if (specialties.length === 0) {
        return {
          content: [{ type: "text", text: "No hay especialidades disponibles." }],
        };
      }

      const text = specialties
        .map((s) => `- **${s.name}**${s.description ? `: ${s.description}` : ""}`)
        .join("\n");

      return {
        content: [{ type: "text", text: `Especialidades disponibles:\n\n${text}` }],
      };
    }

    case "listar_medicos": {
      const doctors = await query<DoctorProfile[]>("doctors");
      const filterEspecialidad = args?.especialidad as string | undefined;

      const filtered = filterEspecialidad
        ? doctors.filter(
            (d) => d.specialty.name.toLowerCase().includes(filterEspecialidad.toLowerCase())
          )
        : doctors;

      if (filtered.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: filterEspecialidad
                ? `No se encontraron medicos en la especialidad "${filterEspecialidad}".`
                : "No hay medicos disponibles.",
            },
          ],
        };
      }

      const text = filtered
        .map((d) => {
          const days = [...new Set(d.availabilities.map((a) => a.dayOfWeek))].sort();
          const schedule =
            days.length > 0 ? ` (Disponible: ${days.map((d) => dayLabels[d]).join(", ")})` : " (Sin horarios)";
          return `- **${d.user.name}** - ${d.specialty.name}${schedule}`;
        })
        .join("\n");

      return {
        content: [{ type: "text", text: `Medicos disponibles:\n\n${text}` }],
      };
    }

    case "consultar_disponibilidad": {
      const doctorId = args?.doctorId as string;
      if (!doctorId) {
        return {
          isError: true,
          content: [{ type: "text", text: "doctorId es requerido" }],
        };
      }

      const doctors = await query<DoctorProfile[]>("doctors");
      const doctor = doctors.find((d) => d.id === doctorId);

      if (!doctor) {
        return {
          isError: true,
          content: [{ type: "text", text: "Medico no encontrado" }],
        };
      }

      const grouped = new Map<number, typeof doctor.availabilities>();
      for (const a of doctor.availabilities) {
        const arr = grouped.get(a.dayOfWeek) ?? [];
        arr.push(a);
        grouped.set(a.dayOfWeek, arr);
      }

      const schedule = Array.from(grouped.entries())
        .sort(([a], [b]) => a - b)
        .map(([day, slots]) => {
          const times = slots.map((s) => `${s.startTime}-${s.endTime}`).join(", ");
          return `- ${dayLabels[day]}: ${times}`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Disponibilidad de ${doctor.user.name}:\n\n${schedule}`,
          },
        ],
      };
    }

    case "agendar_cita": {
      const doctorId = args?.doctorId as string;
      const dateTime = args?.dateTime as string;
      const reason = (args?.reason as string) ?? "";

      if (!doctorId || !dateTime) {
        return {
          isError: true,
          content: [{ type: "text", text: "doctorId y dateTime son requeridos" }],
        };
      }

      try {
        const result = await query<{ appointment?: Record<string, unknown>; error?: string }>(
          "create_appointment",
          { doctorId, dateTime, reason }
        );

        if (result.error) {
          return {
            isError: true,
            content: [{ type: "text", text: `Error al agendar: ${result.error}` }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Cita agendada exitosamente.\nID: ${result.appointment?.id ?? "N/A"}\nFecha: ${new Date(dateTime).toLocaleString("es-ES")}`,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error al agendar la cita: ${error instanceof Error ? error.message : "Error desconocido"}`,
            },
          ],
        };
      }
    }

    case "mis_citas": {
      return {
        content: [
          {
            type: "text",
            text: "Para consultar citas se necesita autenticacion del paciente. Usa la plataforma web en /dashboard/appointments para ver tus citas.",
          },
        ],
      };
    }

    case "cancelar_cita": {
      return {
        content: [
          {
            type: "text",
            text: "La cancelacion de citas debe realizarse a traves de la plataforma web o directamente con el medico.",
          },
        ],
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: "text", text: `Herramienta desconocida: ${name}` }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MediSmart MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
