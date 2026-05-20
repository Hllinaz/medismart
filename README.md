# MediSmart

MediSmart es un proyecto web construido con Next.js App Router, TypeScript, Prisma y MySQL.

## Stack

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Prisma 6.19.x
- MySQL 8.4 con Docker
- bcryptjs
- jsonwebtoken

## Arquitectura

El proyecto usa App Router sin carpeta `src/`.

```txt
app/
  api/
    admin/
      doctors/
      reports/
      specialties/
    appointments/
    auth/
    availability/
    notifications/
  dashboard/
    admin/
      availability/
      doctors/
      reports/
      specialties/
    appointments/
    doctor/
      schedule/
    history/
    profile/
  login/
  register/
  globals.css
  layout.tsx
  page.tsx

components/
  app-shell/
  ui/

lib/
  auth.ts
  prisma.ts
  scheduling.ts

prisma/
  schema.prisma

docker-compose.yml
proxy.ts
```

## Instalacion

```bash
npm install
```

Crear `.env` desde el template:

```bash
cp .env.template .env
```

Variables locales:

```env
DATABASE_URL="mysql://medismart:medismart@127.0.0.1:3306/medismart"
JWT_SECRET="cambia_esto_por_un_secreto_largo_y_seguro"
```

Levantar MySQL y preparar Prisma:

```bash
npm run db:up
npm run db:generate
npx prisma db push
npx tsx prisma/seed.ts
```

Ejecutar desarrollo:

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:up
npm run db:down
npm run db:logs
npm run db:generate
npm run db:migrate
npm run db:studio
npm run setup:db
```

Inicia el tunnel de ngrok:

```bash
npm run tunnel
```

## Frontend

Rutas disponibles:

```txt
/                              -> inicio
/register                      -> registro de paciente
/login                         -> inicio de sesion
/dashboard                     -> resumen de sesion
/dashboard/profile             -> perfil y logout
/dashboard/admin/specialties   -> crear/listar especialidades
/dashboard/admin/doctors       -> crear/listar medicos
/dashboard/admin/availability  -> crear/listar horarios medicos
/dashboard/appointments        -> agendar/listar/cancelar/evaluar citas
/dashboard/history             -> historial de citas por estado
/dashboard/doctor/schedule     -> agenda del medico autenticado
/dashboard/admin/reports       -> reportes administrativos
```

Notas:

- El registro publico crea usuarios `PACIENTE`.
- Las pantallas admin requieren una sesion con rol `ADMIN`.
- La autenticacion usa cookie httpOnly `token`.
- `proxy.ts` protege `/dashboard/*` cuando no existe cookie de sesion.
- Las pantallas frontend consumen las API Routes internas.
- Las vistas en `app/disponibilidad/*.js` son pantallas mock heredadas y no son el flujo principal conectado.

## Backend

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Admin - Medicos

```txt
GET   /api/admin/doctors
POST  /api/admin/doctors
GET   /api/admin/doctors/:id
PUT   /api/admin/doctors/:id
PATCH /api/admin/doctors/:id
```

### Admin - Especialidades

```txt
GET   /api/admin/specialties
POST  /api/admin/specialties
GET   /api/admin/specialties/:id
PUT   /api/admin/specialties/:id
PATCH /api/admin/specialties/:id
```

### Disponibilidad

```txt
GET   /api/availability
POST  /api/availability
GET   /api/availability/:id
PUT   /api/availability/:id
PATCH /api/availability/:id
```

### Citas

```txt
GET  /api/appointments
POST /api/appointments
GET  /api/appointments/:id
PATCH /api/appointments/:id
POST /api/appointments/:id/cancel
POST /api/appointments/:id/reassign
GET  /api/appointments/:id/evaluation
POST /api/appointments/:id/evaluation
```

### Notificaciones y reportes

```txt
GET /api/notifications
GET /api/admin/reports
```

## Flujo funcional

1. Un paciente se registra desde `/register`.
2. El registro crea `User` con rol `PACIENTE`, password hasheado y `PatientProfile`.
3. Un administrador crea especialidades y medicos.
4. Un medico puede tener varias especialidades mediante `DoctorSpecialty`.
5. Admin o medico crean disponibilidad horaria.
6. El paciente agenda una cita sobre un horario libre.
7. El backend valida que el horario exista, no este ocupado y marca `Availability.isBooked`.
8. Las citas se ordenan por prioridad y `requestDate`.
9. La cancelacion crea notificaciones y, si aplica, activa flujo de reasignacion.
10. El paciente puede evaluar citas completadas.
11. Admin consulta reportes agregados.

La logica compartida de agenda vive en:

```txt
lib/scheduling.ts
```

## Base de datos

El schema principal esta en:

```txt
prisma/schema.prisma
```

Modelos principales:

- `User`
- `DoctorProfile`
- `PatientProfile`
- `Specialty`
- `DoctorSpecialty`
- `Availability`
- `Appointment`
- `Notification`
- `Evaluation`

Notas sobre `User`:

- `status` es el estado funcional principal: `ACTIVE`, `INACTIVE`, `BLOCKED`.
- `isActive` se conserva como campo legacy para no perder datos existentes al sincronizar MySQL.
- El backend nuevo debe usar `status`, no `isActive`, para autenticacion y permisos.

Roles:

```txt
PACIENTE
MEDICO
ADMIN
```

Estados y enums principales:

```txt
UserStatus: ACTIVE, INACTIVE, BLOCKED
AppointmentStatus: SCHEDULED, CANCELLED, PENDING_REASSIGNMENT, COMPLETED
Priority: LOW, NORMAL, HIGH
NotificationType: REMINDER, CANCELLATION, REASSIGNMENT, SYSTEM
```

El Prisma Client se genera en:

```txt
node_modules/@prisma/client
```

Import recomendado:

```ts
import { PrismaClient } from "@prisma/client";
```

## MySQL Workbench

Datos de conexion local:

```txt
Hostname: 127.0.0.1
Port: 3306
Username: medismart
Password: medismart
Default Schema: medismart
```

Si Workbench muestra `Public Key Retrieval is not allowed`, en Advanced > Others usar:

```txt
allowPublicKeyRetrieval=true&useSSL=false
```

## Prisma

Comandos utiles:

```bash
npx prisma generate
npx prisma db push
npx prisma studio
```

Nota: si ves `_prisma_migrations` en MySQL, es una tabla interna de Prisma. No afecta la app.

## Verificacion

Antes de subir cambios:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Reglas importantes

- No usar carpeta `src/`.
- No guardar passwords en texto plano.
- No devolver `password` en respuestas JSON.
- Solo `ADMIN` puede gestionar medicos, especialidades y reportes.
- `ADMIN` y `MEDICO` pueden gestionar disponibilidad segun propiedad/regla de rol.
- `PACIENTE` agenda y cancela sus propias citas.
- Usar `@/lib/prisma` para acceder al cliente Prisma compartido.
- Usar `@/lib/scheduling` para reglas de agenda, prioridad, perfiles, cancelacion y reasignacion.
- Usar componentes compartidos desde `components/ui`.
