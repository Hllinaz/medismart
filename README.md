# MediSmart

MediSmart es un proyecto web construido con Next.js App Router, TypeScript, Prisma y MySQL.

## Stack

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Prisma 6.19.x
- MySQL
- bcryptjs
- jsonwebtoken

## Arquitectura

El proyecto usa arquitectura de Next.js sin carpeta `src/`.

```txt
app/
  api/
    admin/
    auth/
  globals.css
  layout.tsx
  page.tsx

lib/
  auth.ts
  prisma.ts

services/

prisma/
  schema.prisma
```

## Carpetas principales

### `app/`

Contiene rutas, layouts, paginas y API Routes de Next.js.

### `app/api/`

Contiene endpoints backend usando Route Handlers.

### `lib/`

Contiene utilidades compartidas:

- `lib/prisma.ts`: instancia singleton de Prisma Client.
- `lib/auth.ts`: helpers de autenticacion, JWT y autorizacion por rol.

### `services/`

Reservado para logica de negocio reutilizable.

### `prisma/`

Contiene el schema de base de datos.

## Base de datos

El proyecto usa MySQL con Prisma.

Archivo principal:

```txt
prisma/schema.prisma
```

El Prisma Client se genera en:

```txt
node_modules/@prisma/client
```

Import recomendado:

```ts
import { PrismaClient } from "@prisma/client";
```

## Variables de entorno

Crear o actualizar `.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/medismart"
JWT_SECRET="cambia_esto_por_un_secreto_largo_y_seguro"
```

## Instalacion

```bash
npm install
```

Generar Prisma Client:

```bash
npx prisma generate
```

Crear migracion inicial:

```bash
npx prisma migrate dev --name init_backend_mysql
```

Ejecutar desarrollo:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Verificacion TypeScript:

```bash
npx tsc --noEmit
```

## Modelos principales

### User

Campos principales:

- `id`
- `name`
- `email`
- `password`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

### DoctorProfile

Campos principales:

- `id`
- `userId`
- `specialtyId`
- `licenseNumber`
- `createdAt`
- `updatedAt`

### Specialty

Campos principales:

- `id`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

## Roles

```txt
PACIENTE
MEDICO
ADMIN
```

## Endpoints actuales

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

## Autenticacion

La autenticacion usa JWT.

El token puede enviarse por:

- Cookie `token`
- Header `Authorization: Bearer <token>`

Los helpers principales estan en:

```txt
lib/auth.ts
```

Funciones principales:

- `hashPassword`
- `comparePassword`
- `generateToken`
- `verifyToken`
- `getAuthUser`
- `requireAuth`
- `requireRole`

## Reglas importantes

- No usar carpeta `src/`.
- No guardar passwords en texto plano.
- No devolver `password` en respuestas JSON.
- Solo `ADMIN` puede gestionar medicos y especialidades.
- Usar `@/lib/prisma` para acceder al cliente Prisma compartido.
- Mantener API Routes como controladores delgados.
- Mover logica de negocio a `services/` cuando crezca.

## Flujo backend

```txt
Cliente
  -> app/api/.../route.ts
  -> validacion
  -> lib/auth.ts
  -> service o prisma
  -> respuesta JSON
```

## Comandos utiles de Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## Estado de verificacion

El proyecto debe pasar:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
