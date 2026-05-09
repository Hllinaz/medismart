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
  dashboard/
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

prisma/
  schema.prisma

docker-compose.yml
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
```

Reglas frontend:

- Usar App Router.
- Preferir Server Components por defecto.
- Usar `"use client"` solo en pantallas con estado, formularios, efectos o eventos.
- Mantener componentes reutilizables en `components/ui`.
- Mantener navegacion compartida en `components/app-shell`.
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
```

Reglas backend:

- Validar input en API Routes.
- Validar autenticacion y roles con `lib/auth.ts`.
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
