# MediSmart

MediSmart es un sistema de gestion de citas medicas con integracion WhatsApp + Ollama AI.

## Stack

- **Frontend/Backend**: Next.js 16.2.4 + React 19.2.4 + TypeScript
- **Base de datos**: MySQL 8.4 (Docker)
- **ORM**: Prisma 6.19.x
- **LLM**: Ollama + phi4:latest (Docker)
- **WhatsApp**: Twilio Sandbox API + webhook
- **Autenticacion**: bcryptjs + JWT

## Comandos

Ver [COMANDOS.md](./COMANDOS.md) para la guia paso a paso.

```powershell
docker compose up -d          # MySQL + Ollama
npx prisma db push            # Sincronizar BD
npm run db:seed               # Datos de prueba
npm run dev                   # Servidor :3000
```

## Scripts

```powershell
npm run dev              # Servidor desarrollo
npm run build            # Compilar produccion
npm run lint             # Linter
npm run db:up            # MySQL (Docker)
npm run db:down          # Detener Docker
npm run db:generate      # Generar Prisma Client
npm run db:studio        # Prisma Studio (admin BD) :5555
npm run db:seed          # Sembrar datos de prueba
npm run mcp:dev          # Servidor MCP standalone
```

## Rutas frontend

```txt
/                              -> Inicio
/register                      -> Registro
/login                         -> Login
/dashboard                     -> Dashboard
/dashboard/profile             -> Perfil
/dashboard/admin/specialties   -> Especialidades (ADMIN)
/dashboard/admin/doctors       -> Medicos (ADMIN)
/dashboard/doctors             -> Doctores disponibles
/dashboard/appointments        -> Mis citas
/dashboard/appointments/new    -> Agendar cita
/dashboard/doctor/availability -> Mi disponibilidad (MEDICO)
```

## Rutas API

### Auth
```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Publicas
```txt
GET  /api/doctors        -> Doctores activos con disponibilidad
GET  /api/specialties     -> Especialidades activas
```

### Citas
```txt
GET    /api/appointments
POST   /api/appointments
PATCH  /api/appointments/:id
DELETE /api/appointments/:id
```

### Admin
```txt
GET/POST   /api/admin/doctors
GET/PUT    /api/admin/doctors/:id
PATCH      /api/admin/doctors/:id
GET/POST   /api/admin/specialties
GET/PUT    /api/admin/specialties/:id
PATCH      /api/admin/specialties/:id
```

### WhatsApp
```txt
POST /api/whatsapp/webhook  -> Mensajes entrantes (Twilio POST, procesa con Ollama)
POST /api/whatsapp/send     -> Enviar mensaje programaticamente
```

## WhatsApp + Ollama

### Configuracion rapida

```powershell
# 1. Iniciar servidor de desarrollo
npm run dev

# 2. En otra terminal, exponer webhook con ngrok
ngrok http 3000

# 3. Copiar la URL de ngrok (http://127.0.0.1:4040)
# 4. Twilio Console -> Sandbox -> When a message comes in:
#    URL: https://tu-url.ngrok-free.app/api/whatsapp/webhook
#    Method: HTTP POST

# 5. Desde WhatsApp enviar "join wise-bright" a +14155238886
# 6. Enviar "Hola" para probar
```

### Documentacion

- [guia-whatsapp-ollama.md](./guia-whatsapp-ollama.md) — Guia completa
- [mcp-whatsapp.md](./mcp-whatsapp.md) — Guia rapida de integracion

## Seed data

```powershell
npm run db:seed
```

| Nombre | Email | Especialidad |
|---|---|---|
| Dr. Carlos Martinez | carlos.martinez@medismart.com | Cardiologia |
| Dra. Ana Lopez | ana.lopez@medismart.com | Pediatria |
| Dr. Roberto Sanchez | roberto.sanchez@medismart.com | Dermatologia |
| Dra. Maria Garcia | maria.garcia@medismart.com | Traumatologia |
| Dr. Juan Hernandez | juan.hernandez@medismart.com | Oftalmologia |

Passwords: `Medico123!`

## Roles

- `PACIENTE` — Agendar y gestionar citas
- `MEDICO` — Gestionar disponibilidad y citas
- `ADMIN` — Gestionar medicos y especialidades

## Verificacion

```powershell
npm run lint
npx tsc --noEmit
npm run build
```
