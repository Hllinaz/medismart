# Integracion WhatsApp + MCP para MediSmart

## Arquitectura General

```
Usuario WhatsApp
      │
      ▼
Twilio WhatsApp Sandbox API
      │
      ▼
MediSmart Webhook (/api/whatsapp/webhook)
      │
      ├──► Ollama LLM (Docker) → analiza lenguaje natural
      │       │
      │       ├── Primer llamado: detecta intencion (JSON)
      │       └── Segundo llamado: genera respuesta natural
      │
      ├──► conversation/store → memoria por usuario
      │
      ├──► Prisma → consulta BD (especialidades, medicos)
      │
      └──► Twilio API → respuesta al usuario
```

## Stack de integracion

| Componente | Tecnologia | Donde corre |
|---|---|---|
| LLM | Ollama + phi4:latest | Docker (medismart-ollama:11434) |
| Webhook | Next.js API Route | Docker (medismart-app:3000) |
| Cliente WhatsApp | Twilio SDK | App contenedor |
| Memoria | lib/conversation/store.ts | En memoria (app) |
| Prompt engineering | lib/ollama/prompts.ts | App contenedor |
| MCP Server | mcp-server/index.ts | Standalone (opcional) |

## Inicio rapido (todo Docker)

### 1. Prerequisitos

- Docker Desktop 24+
- Cuenta Twilio (gratis, solo email, sin tarjeta)
- ngrok account (gratis, para desarrollo)

### 2. Configurar variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=phi4:latest
```

### 3. Levantar todo

```powershell
.\scripts\setup.ps1
```

### 4. Exponer webhook (ngrok)

```powershell
docker compose --profile tunnel up -d ngrok
```

### 5. Configurar en Twilio

En [console.twilio.com](https://console.twilio.com) → Messaging → Try WhatsApp → Sandbox:
- **When a message comes in**: `https://midominio.ngrok-free.app/api/whatsapp/webhook`
- Method: **HTTP POST**

### 6. Unirte al Sandbox

Envia `join sandbox-xxxxx` desde tu WhatsApp al numero `+14155238886`.

### 7. Probar

Envia "Hola" desde WhatsApp. El asistente respondera usando Ollama.

## Componentes del proyecto

### lib/whatsapp/

| Archivo | Descripcion |
|---|---|
| `client.ts` | Cliente Twilio SDK: `sendText(to, text)` via `client.messages.create()` |
| `types.ts` | Tipos: `TwilioConfig`, `TwilioWebhookPayload` (form-urlencoded) |

### app/api/whatsapp/

| Ruta | Descripcion |
|---|---|
| `POST /api/whatsapp/webhook` | Recibe mensajes entrantes de Twilio (form-data), procesa con Ollama |
| `POST /api/whatsapp/send` | Envia mensajes programaticamente via Twilio |

### Flujo del webhook

```
1. Llega POST form-urlencoded de Twilio (From, Body, ProfileName)
2. Se obtiene/conversacion del conversationStore
3. Se construye prompt con historial
4. POST a http://ollama:11434/api/chat con format:json
5. Ollama responde: { intent, entities, response, require_action }
6. Si require_action: ejecuta accion BD, llama a Ollama para respuesta natural
7. Envia respuesta via Twilio API (Basic Auth)
8. Guarda en historial
```

## Troubleshooting

| Problema | Solucion |
|---|---|
| Twilio no envia webhook | Verificar URL en consola, ngrok funcionando |
| 401 Unauthorized | Revisar `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` |
| "Sandbox deactivated" | Reactivar, re-enviar `join` desde WhatsApp |
| Ollama no responde | `docker compose exec ollama ollama list` |

## Ver guia completa

Para guia detallada con setup paso a paso, personalizacion, troubleshooting extenso y despliegue universitario:

➡️ **[guia-whatsapp-ollama.md](./guia-whatsapp-ollama.md)**
