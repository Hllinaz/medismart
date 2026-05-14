# Guia de Integracion WhatsApp + Ollama para MediSmart

## Indice

1. [Arquitectura General](#1-arquitectura-general)
2. [Prerequisitos](#2-prerequisitos)
3. [Setup Rapido (One-Click)](#3-setup-rapido-one-click)
4. [Setup Manual Paso a Paso](#4-setup-manual-paso-a-paso)
5. [Configuracion de Twilio WhatsApp Sandbox](#5-configuracion-de-twilio-whatsapp-sandbox)
6. [Como Funciona el LLM](#6-como-funciona-el-llm)
7. [Comandos de WhatsApp Soportados](#7-comandos-de-whatsapp-soportados)
8. [Personalizacion y Ajustes](#8-personalizacion-y-ajustes)
9. [Monitoreo y Logs](#9-monitoreo-y-logs)
10. [Despliegue en PC de Universidad](#10-despliegue-en-pc-de-universidad)
11. [Troubleshooting](#11-troubleshooting)
12. [Seguridad](#12-seguridad)
13. [Arbol de Archivos](#13-arbol-de-archivos)

---

## 1. Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
│                                                                  │
│   ┌──────────────┐     ┌──────────────────────┐                 │
│   │  Usuario      │ ◄──► │  Twilio WhatsApp     │                 │
│   │  WhatsApp     │     │  Sandbox API         │                 │
│   └──────────────┘     └──────────┬───────────┘                 │
│                                   │                              │
│                                   ▼  Webhook POST (form-urlencoded)
│                          ┌────────────────┐                      │
│                          │  ngrok tunnel   │ (opcional, solo dev)│
│                          │  :3000 -> pub   │                     │
│                          └───────┬────────┘                      │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────┐
│                          DOCKER (localhost)                      │
│                                   │                              │
│   ┌──────────────────────────────┴─────────────────┐            │
│   │           app (Next.js 16) :3000                │            │
│   │                                                │            │
│   │  POST /api/whatsapp/webhook ────► Ollama LLM   │            │
│   │       │                              ▲         │            │
│   │       ▼                              │         │            │
│   │  conversation/store                  │         │            │
│   │       │                              │         │            │
│   │       ▼                              │         │            │
│   │  executeAction (Prisma)              │         │            │
│   │       │                              │         │            │
│   │       ▼                              │         │            │
│   │  Twilio API Response ────────────────┘         │            │
│   └────────────────────────────────────────────────┘            │
│            │                      ▲                             │
│            ▼                      │                             │
│   ┌──────────────┐     ┌──────────────────┐                     │
│   │  MySQL 8.4   │     │  Ollama (phi4)    │                     │
│   │  :3306       │     │  :11434           │                     │
│   └──────────────┘     └──────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Flujo detallado de un mensaje

```
1. Usuario escribe por WhatsApp:
   "Necesito un cardiologo"

2. Twilio recibe el mensaje y hace POST a /api/whatsapp/webhook
   (form-urlencoded: From, Body, ProfileName, etc.)

3. Webhook extrae:
   - Numero: +521234567890 (Twilio envia con prefijo "whatsapp:")
   - Texto: "Necesito un cardiologo"

4. conversationStore.getOrCreate(numero)
   - Recupera historial de conversacion

5. buildConversationMessages(historial, mensaje)
   - Construye array de mensajes para Ollama

6. ollama.chat(messages)
   - POST a http://ollama:11434/api/chat
   - Modelo: phi4:latest
   - Formato: JSON
   - Temperatura: 0.1

7. Ollama responde con JSON:
   { "intent": "listar_medicos", "entities": {...}, ... }

8. Si require_action=true, ejecuta accion en BD

9. Envia datos reales a Ollama para respuesta natural

10. Envia respuesta via Twilio API (Basic Auth)

11. conversationStore.addMessage(numero, "assistant", respuesta)
```

---

## 2. Prerequisitos

### En el PC (todo via Docker)

| Requisito | Minimo |
|---|---|
| Docker Desktop | 24+ |
| RAM | 8 GB |
| Disco | 10 GB libres |

### Cuentas externas necesarias

1. **Cuenta Twilio** (gratis, solo email, **sin tarjeta**)
2. **WhatsApp Sandbox** (incluido en Twilio, activacion en 2 min)
3. **ngrok account** (gratis, para exponer webhook local)

---

## 3. Setup Rapido (One-Click)

```powershell
.\scripts\setup.ps1
```

El script hace todo automaticamente:
1. Verifica Docker
2. Crea `.env` si no existe
3. Inicia MySQL + Ollama
4. Sincroniza schema (prisma db push)
5. Seed de datos si es primera vez
6. Descarga modelo phi4
7. Inicia npm run dev + ngrok
8. Muestra URLs para configurar Twilio

---

## 4. Setup Manual Paso a Paso

### 4.1 Un solo comando

```powershell
.\scripts\dev.ps1
```

Esto inicia MySQL, Ollama, la app y ngrok automaticamente.

### 4.2 Manual (alternativa)

```powershell
# 1. MySQL + Ollama
docker compose up -d

# 2. Sync DB + seed
npx prisma db push
npm run db:seed

# 3. Iniciar servidor
npm run dev

# 4. Tunel para webhook
ngrok http 3000
```

---

## 5. Configuracion de Twilio WhatsApp Sandbox

### 5.1 Crear cuenta Twilio (sin tarjeta)

1. Ve a [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Registrate con **solo email** (no pide tarjeta en trial)
3. Verifica tu email
4. Twilio te da:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5.2 Activar WhatsApp Sandbox

1. En [console.twilio.com](https://console.twilio.com):
   - Ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
   - O directamente: **Develop** → **Messaging** → **Try WhatsApp**

2. Activa el Sandbox:
   - Te mostrara un numero tipo `+14155238886`
   - Te asignara un codigo tipo `join sandbox-xxxxx`
   - **Importante**: El codigo cambia si lo desactivas/activas

3. Desde tu WhatsApp:
   - Guarda el numero `+14155238886` en tus contactos
   - Envia al numero el mensaje: `join sandbox-xxxxx`
   - Twilio respondera confirmando la conexion

### 5.3 Configurar webhook en Twilio

En la pagina del Sandbox:

1. Busca **"When a message comes in"**
2. Selecciona **Webhook**
3. URL: `https://tu-dominio.ngrok-free.app/api/whatsapp/webhook`
4. Method: **HTTP POST**
5. Guarda los cambios

### 5.4 Probar la conexion

```powershell
# Primero verifica que tu webhook responde:
curl -X POST "https://tu-dominio.ngrok-free.app/api/whatsapp/webhook" \
  -d "From=whatsapp:%2B521234567890&Body=Hola" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Luego envia "Hola" desde WhatsApp al numero Sandbox
```

### 5.5 Diferencia entre Twilio y Meta

| Aspecto | Meta Cloud API | Twilio Sandbox |
|---|---|---|
| Registro | Tarjeta requerida | Solo email |
| Costo | Prueba 5 numeros | Trial gratuito |
| Webhook | GET (verify) + POST (msg) | Solo POST |
| Formato | JSON | `application/x-www-form-urlencoded` |
| Autenticacion | Bearer token | Basic Auth (Sid:Token) |
| SDK | No usado | `npm install twilio` |
| Botones interactivos | Si | No (solo texto) |

---

## 6. Como Funciona el LLM

### 6.1 System Prompt

El comportamiento del asistente se define en `lib/ollama/prompts.ts`.

```
Eres un asistente virtual de MediSmart...
IDIOMA: Siempre respondes en ESPANOL...
FORMATO: Siempre respondes en JSON...
INTENTS: saludo, listar_especialidades, listar_medicos, ...
REGLAS: No inventes medicos, pide confirmacion...
```

### 6.2 Flujo de procesamiento

```
Mensaje usuario
     │
     ▼
┌─────────────────┐
│  Primer llamado  │  System prompt + historial + mensaje
│  a Ollama        │
│  (format: json)  │
└────────┬────────┘
         │
         ▼
  JSON: { intent, entities, response, require_action }
         │
         ├── require_action=false → Enviar response directo
         │
         └── require_action=true
                  │
                  ▼
         Ejecutar accion (BD query)
                  │
                  ▼
         ┌─────────────────┐
         │  Segundo llamado │  Datos reales + genera respuesta
         │  a Ollama        │
         └────────┬────────┘
                  │
                  ▼
         Respuesta final via Twilio
```

### 6.3 Intents disponibles

| Intent | Que hace |
|---|---|
| `saludo` | Saluda y ofrece ayuda |
| `listar_especialidades` | Consulta BD de especialidades |
| `listar_medicos` | Busca medicos por especialidad |
| `consultar_disponibilidad` | Muestra horarios de un medico |
| `agendar_cita` | Explica como agendar via web |
| `mis_citas` | Explica como ver citas via web |
| `cancelar_cita` | Explica como cancelar via web |
| `ayuda` | Muestra lista de comandos |
| `despedida` | Se despide amablemente |
| `no_entendido` | Pide reformular |

### 6.4 Memoria de conversacion

- **Ultimos 50 mensajes** por numero
- **TTL de 24 horas** (se limpia automaticamente)
- Se envia a Ollama **solo los ultimos 10** mensajes

---

## 7. Comandos de WhatsApp Soportados

| Mensaje del usuario | Intencion |
|---|---|
| "Hola" / "Buenos dias" | saludo |
| "Que especialidades tienen" | listar_especialidades |
| "Necesito un cardiologo" | listar_medicos |
| "El doctor Martinez tiene horario?" | consultar_disponibilidad |
| "Quiero agendar una cita" | agendar_cita |
| "Ver mis citas" | mis_citas |
| "Cancelar cita" | cancelar_cita |
| "Ayuda" / "Que puedes hacer" | ayuda |
| "Gracias, adios" | despedida |

### Ejemplo de conversacion

```
Usuario: Hola
Asistente: ¡Hola! Bienvenido a MediSmart. ¿En que puedo ayudarte?

Usuario: Que especialidades tienen
Asistente: Especialidades disponibles:
1. Cardiologia - Especialidad en corazon
2. Pediatria - Atencion para ninos
...

Usuario: Necesito un cardiologo
Asistente: Medicos en Cardiologia:
👨‍⚕️ Dr. Carlos Martinez (Lun-Vie 9-13, 14-17)
...
```

---

## 8. Personalizacion y Ajustes

### Cambiar modelo Ollama

```env
OLLAMA_MODEL=phi4:latest       # Rapido, recomendado
OLLAMA_MODEL=llama3.2:3b       # Bueno en ingles
OLLAMA_MODEL=mistral:7b        # Mejor calidad
```

### Descargar modelo nuevo

```powershell
docker compose exec ollama ollama pull phi4:latest
```

### Ajustar temperatura

En `lib/ollama/client.ts`:

```typescript
options: { temperature: 0.1 }  // 0.0=exacto, 1.0=creativo
```

### Modificar System Prompt

Edita `lib/ollama/prompts.ts` > `SYSTEM_PROMPT` para cambiar tono, reglas o idioma.

---

## 9. Monitoreo y Logs

```powershell
# Logs de la app
docker compose logs -f app

# Logs de Ollama
docker compose logs -f ollama

# Probar Ollama directo
curl http://localhost:11434/api/chat -d '{
  "model": "phi4:latest",
  "messages": [{"role": "user", "content": "Hola"}],
  "stream": false
}'

# Ver BD
docker compose exec db mysql -umedismart -pmedismart medismart \
  -e "SELECT COUNT(*) FROM Specialty; SELECT COUNT(*) FROM User WHERE role='MEDICO'"
```

---

## 10. Despliegue en PC de Universidad

### Requisitos del PC

| Recurso | Minimo |
|---|---|
| Docker Desktop | 24+ |
| RAM | 8 GB |
| Disco | 10 GB |
| Internet | Si (para descargar modelo) |

### Script de instalacion

```powershell
.\scripts\setup.ps1
```

### Sin internet en la U

Preparar en casa:

```powershell
# Descargar imagenes y modelo
docker pull mysql:8.4
docker pull ollama/ollama:latest
docker compose build
docker run --rm -v ollama_data:/root/.ollama ollama/ollama pull phi4:latest

# Guardar en USB
docker save mysql:8.4 ollama/ollama:latest -o images.tar
docker save medismart-app -o app.tar
```

En la U:

```powershell
docker load -i images.tar
docker load -i app.tar
docker compose up -d
```

---

## 11. Troubleshooting

| Problema | Solucion |
|---|---|
| App no arranca | `docker compose logs db` - esperar MySQL |
| Ollama no responde | `docker compose exec ollama ollama pull phi4:latest` |
| Twilio no envia webhook | Verificar URL en consola Twilio, ngrok funcionando |
| 401 de Twilio | Verificar `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN` |
| "Sandbox deactivated" | Reactivar en consola, re-enviar `join` |
| Webhook no procesa mensajes | `docker compose logs app` para ver errores |
| App lenta | Usar `phi4:latest` (mas rapido que modelos grandes) |

### Comandos de diagnostico

```powershell
docker compose ps
docker compose logs --tail=50 app
docker compose exec app curl -s http://ollama:11434/api/tags
docker compose exec app curl -s http://db:3306
```

---

## 12. Seguridad

- No compartir `TWILIO_ACCOUNT_SID` ni `TWILIO_AUTH_TOKEN`
- `.env` no se versiona (agregado a `.gitignore`)
- Cambiar `JWT_SECRET` en produccion
- El webhook responde 200 siempre para no alertar a Twilio
- Limpiar conversaciones periodicamente (TTL 24h automatico)

---

## 13. Arbol de Archivos

```
medismart/
├── docker-compose.yml
├── .env / .env.template
├── lib/
│   ├── ollama/ (client.ts, types.ts, prompts.ts)
│   ├── conversation/store.ts
│   └── whatsapp/ (client.ts, types.ts)
├── app/api/whatsapp/
│   ├── webhook/route.ts
│   └── send/route.ts
├── guia-whatsapp-ollama.md
├── mcp-whatsapp.md
└── README.md
```

---

## Glosario

| Termino | Significado |
|---|---|
| **Twilio** | Plataforma de comunicaciones (SMS, WhatsApp, voz) |
| **Sandbox** | Entorno de pruebas gratuito de Twilio para WhatsApp |
| **Ollama** | Software para correr LLMs localmente |
| **phi4** | Modelo de lenguaje ~2.8B parametros |
| **ngrok** | Tunel para exponer servidor local a internet |
| **Webhook** | URL que recibe llamadas automaticas de un servicio |
