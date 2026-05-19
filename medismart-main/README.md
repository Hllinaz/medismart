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
    auth/
  dashboard/
    admin/
      doctors/
      specialties/
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

prisma/
  schema.prisma

docker-compose.yml
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
```

Notas:

- El registro publico crea usuarios `PACIENTE`.
- Las pantallas admin requieren una sesion con rol `ADMIN`.
- La autenticacion usa cookie httpOnly `token`.
- Las pantallas frontend consumen las API Routes internas.

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

## Base de datos

El schema principal esta en:

```txt
prisma/schema.prisma
```

Modelos principales:

- `User`
- `DoctorProfile`
- `Specialty`

Roles:

```txt
PACIENTE
MEDICO
ADMIN
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
- Solo `ADMIN` puede gestionar medicos y especialidades.
- Usar `@/lib/prisma` para acceder al cliente Prisma compartido.
- Usar componentes compartidos desde `components/ui`.
