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

## Stack actual

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- Prisma 6.19.x
- MySQL
- Prisma Client clasico generado en `node_modules/@prisma/client`
- JWT para autenticacion
- bcryptjs para hash de passwords

## Arquitectura actual

El proyecto no usa carpeta `src/`.

```txt
app/
  api/
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

## Reglas por carpeta

### `app/`

Contiene vistas, layouts y API Routes de Next.js.

Reglas:

- Usar App Router.
- Preferir Server Components.
- Usar `"use client"` solo cuando sea necesario.
- No colocar logica de negocio compleja en componentes.

### `app/api/`

Contiene controladores HTTP.

Reglas:

- Validar input.
- Validar autenticacion y roles.
- Llamar helpers o services.
- Devolver respuestas JSON.
- No devolver passwords.
- No mezclar UI con logica backend.

### `lib/`

Contiene configuracion y utilidades compartidas.

Archivos actuales:

- `lib/prisma.ts`: singleton de Prisma Client.
- `lib/auth.ts`: helpers de autenticacion, JWT y roles.

Reglas:

- Mantener codigo reutilizable.
- Evitar dependencias innecesarias.
- No duplicar helpers.

### `services/`

Contiene logica de negocio reutilizable.

Reglas:

- No usar React.
- No manejar objetos HTTP directamente.
- No renderizar UI.
- Centralizar reglas del dominio cuando la logica crezca.

### `prisma/`

Contiene el modelo de base de datos.

Reglas:

- Usar `prisma/schema.prisma`.
- Provider actual: `mysql`.
- Generator actual: `prisma-client-js`.
- Importar Prisma Client desde `@prisma/client`.

## Flujo backend esperado

```txt
Request HTTP
  -> app/api/.../route.ts
  -> validacion de input
  -> auth/roles en lib/auth.ts
  -> Prisma o service
  -> respuesta JSON
```

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
- Nunca devolver `password` en respuestas JSON.

## Prisma

El cliente Prisma se genera en `node_modules/@prisma/client`.

Comandos habituales:

```bash
npx prisma generate
npx prisma migrate dev --name init_backend_mysql
npx prisma studio
```

El datasource usa:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/medismart"
```

## Alias TypeScript

El alias actual es:

```json
"@/*": ["./*"]
```

Ejemplo:

```ts
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
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
- Usar Prisma 7 sin aprobacion previa.
- Cambiar MySQL por otro motor sin aprobacion.
- Guardar passwords en texto plano.
- Devolver passwords en APIs.
- Romper la arquitectura App Router.
- Mezclar UI, controladores y logica de negocio sin separacion.

## Buenas practicas

- Componentes pequenos y reutilizables.
- Server Components por defecto.
- Client Components solo cuando haya estado, eventos o APIs del navegador.
- Fetching server-side cuando sea posible.
- Validaciones claras en API Routes.
- Respuestas JSON consistentes.
- Separacion entre `app/api`, `lib` y `services`.
- Nombres claros y codigo tipado.

## Filosofia

Primero disenar, luego construir.

El objetivo es mantener control del proyecto, arquitectura limpia y cambios seguros.
