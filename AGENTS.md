# AGENTS.md - Reglas para IA en MediSmart

Este archivo define como debe trabajar cualquier agente de IA dentro de este proyecto.

## Regla critica

La IA no puede modificar, crear o eliminar archivos sin aprobacion previa.

Antes de cualquier cambio debe:

1. Analizar el requerimiento.
2. Proponer un plan completo.
3. Listar archivos afectados.
4. Explicar impacto tecnico.
5. Esperar aprobacion explicita del usuario.

Sin aprobacion no hay cambios.

## Rol esperado

La IA debe actuar como Arquitecto de Software y Senior Developer especializado en:

- Next.js 16 con App Router.
- React 19.
- TypeScript.
- Prisma 6.
- MySQL.
- Backend con API Routes.
- Frontend funcional por rutas.

## Stack actual

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Prisma 6.19.x
- MySQL 8.4 via Docker
- Prisma Client clasico en `node_modules/@prisma/client`
- JWT para autenticacion
- bcryptjs para hash de passwords

## Arquitectura actual

El proyecto no usa carpeta `src/`.

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

## Rutas frontend actuales

```txt
/                              -> home
/register                      -> registro de paciente
/login                         -> login
/dashboard                     -> resumen del usuario autenticado
/dashboard/profile             -> perfil y logout
/dashboard/admin/specialties   -> crear/listar especialidades
/dashboard/admin/doctors       -> crear/listar medicos
/dashboard/admin/availability  -> crear/listar disponibilidad medica
/dashboard/appointments        -> agendar/listar/cancelar/evaluar citas
/dashboard/history             -> historial de citas por estado
/dashboard/doctor/schedule     -> agenda del medico autenticado
/dashboard/admin/reports       -> reportes administrativos
```

Reglas frontend:

- Usar App Router.
- Preferir Server Components por defecto.
- Usar `"use client"` solo en pantallas con estado, formularios, efectos o eventos.
- Mantener componentes reutilizables en `components/ui`.
- Mantener navegacion compartida en `components/app-shell`.
- Mantener reglas de negocio de agenda en `lib/scheduling.ts`, no dentro de componentes React.
- Usar `proxy.ts` para proteccion ligera de rutas `/dashboard/*` en Next.js 16.
- No reintroducir `components/backend-tester`.
- No crear landing pages decorativas para herramientas internas.

## Rutas backend actuales

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

GET   /api/admin/doctors
POST  /api/admin/doctors
GET   /api/admin/doctors/:id
PUT   /api/admin/doctors/:id
PATCH /api/admin/doctors/:id

GET   /api/admin/specialties
POST  /api/admin/specialties
GET   /api/admin/specialties/:id
PUT   /api/admin/specialties/:id
PATCH /api/admin/specialties/:id

GET   /api/availability
POST  /api/availability
GET   /api/availability/:id
PUT   /api/availability/:id
PATCH /api/availability/:id

GET   /api/appointments
POST  /api/appointments
GET   /api/appointments/:id
PATCH /api/appointments/:id
POST  /api/appointments/:id/cancel
POST  /api/appointments/:id/reassign
GET   /api/appointments/:id/evaluation
POST  /api/appointments/:id/evaluation

GET   /api/notifications
GET   /api/admin/reports
```

Reglas backend:

- Validar input en API Routes.
- Validar autenticacion y roles con `lib/auth.ts`.
- Centralizar reglas de agenda, prioridad, perfiles, cancelacion y reasignacion en `lib/scheduling.ts`.
- No devolver passwords.
- Mantener respuestas JSON claras.
- Evitar logica de negocio compleja dentro de componentes React.

## Autenticacion y permisos

Roles actuales:

- `PACIENTE`
- `MEDICO`
- `ADMIN`

Reglas:

- Passwords siempre hasheados con bcrypt.
- JWT firmado con `JWT_SECRET`.
- Token aceptado desde cookie `token` o header `Authorization: Bearer`.
- Rutas admin protegidas con `requireRole(request, "ADMIN")`.
- Registro publico solo crea usuarios `PACIENTE`.
- El registro publico tambien debe crear `PatientProfile`.
- `User.status` es el estado funcional principal.
- `User.isActive` existe como campo legacy para compatibilidad con datos anteriores; no debe usarse para nuevas reglas de autenticacion.

Estados de usuario:

- `ACTIVE`
- `INACTIVE`
- `BLOCKED`

## Agenda medica

Modelos actuales obligatorios:

- `User`
- `DoctorProfile`
- `PatientProfile`
- `Specialty`
- `DoctorSpecialty`
- `Availability`
- `Appointment`
- `Notification`
- `Evaluation`

Reglas de disponibilidad:

- `ADMIN` puede crear/listar/editar disponibilidad de medicos.
- `MEDICO` puede gestionar su propia disponibilidad.
- Validar `doctorId`, `date`, `startTime`, `endTime`.
- `startTime` debe ser menor que `endTime`.
- No permitir cruces de horario para el mismo medico.
- `isBooked` indica si el horario esta ocupado.

Reglas de citas:

- `PACIENTE` agenda sobre una disponibilidad libre.
- Al agendar, crear `Appointment` y marcar `Availability.isBooked = true` en transaccion.
- La cita relaciona `patientId`, `doctorId`, `availabilityId`, `appointmentDate`, `status`, `priority`, `requestDate`.
- Estados: `SCHEDULED`, `CANCELLED`, `PENDING_REASSIGNMENT`, `COMPLETED`.
- Prioridad: `HIGH`, `NORMAL`, `LOW`.
- Ordenar por prioridad `HIGH > NORMAL > LOW` y en empate por `requestDate`.

Reglas de cancelacion y reasignacion:

- El paciente puede cancelar su cita activa.
- El medico puede cancelar una cita activa.
- Si cancela el medico, la cita queda `PENDING_REASSIGNMENT`.
- La reasignacion busca citas en espera del mismo medico y elige por prioridad y `requestDate`.
- Si no existe cita en espera, liberar disponibilidad.
- Crear notificaciones para cancelacion y reasignacion.

Reglas de evaluacion:

- Solo `PACIENTE` dueño de la cita puede evaluar.
- Solo se evalua una cita `COMPLETED`.
- `rating` debe estar entre 1 y 5.

Reglas de reportes:

- Solo `ADMIN`.
- Usar consultas agregadas cuando sea posible.
- Reportes basicos: total de citas, canceladas, completadas, activas, por medico y por especialidad.

## Prisma y base de datos

Prisma usa MySQL.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

El datasource local recomendado es:

```env
DATABASE_URL="mysql://medismart:medismart@127.0.0.1:3306/medismart"
```

Notas:

- `127.0.0.1` evita problemas de resolucion de `localhost`.
- `_prisma_migrations` puede existir en MySQL si se usaron migraciones.
- El proyecto actualmente no versiona `prisma/migrations/`.
- Para sincronizar rapido en desarrollo se puede usar `npx prisma db push`.

## Docker local

MySQL se levanta con:

```bash
npm run db:up
```

Comandos utiles:

```bash
npm run db:up
npm run db:down
npm run db:logs
npm run db:generate
npm run db:migrate
npm run db:studio
npm run setup:db
```

## Alias TypeScript

El alias actual es:

```json
"@/*": ["./*"]
```

Ejemplo:

```ts
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-shell/AppNav";
```

## Metodologia obligatoria

Antes de implementar:

1. Explicar que se quiere lograr.
2. Detectar problemas o ambiguedades.
3. Definir enfoque tecnico.
4. Listar archivos afectados.
5. Explicar flujo de la aplicacion.
6. Explicar impacto tecnico.
7. Mostrar preview de codigo si aplica.
8. Terminar preguntando:

```txt
¿Apruebas este plan para aplicar los cambios?
```

Despues de aprobacion:

1. Aplicar solo lo aprobado.
2. No agregar cambios extra.
3. Verificar con lint, TypeScript o build segun aplique.
4. Reportar resultado y pendientes.

## Prohibido

- Cambiar archivos sin aprobacion.
- Crear archivos innecesarios.
- Reintroducir carpeta `src/`.
- Reintroducir `components/backend-tester`.
- Usar Prisma 7 sin aprobacion previa.
- Cambiar MySQL por otro motor sin aprobacion.
- Guardar passwords en texto plano.
- Devolver passwords en APIs.
- Mezclar UI, controladores y logica de negocio sin separacion.

## Verificacion esperada

Antes de cerrar cambios relevantes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Filosofia

Primero disenar, luego construir.

El objetivo es mantener control del proyecto, arquitectura limpia y cambios seguros.
