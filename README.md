# 🏥 MediSmart – Guía de Desarrollo y Estructura

Este documento define **cómo se debe programar el proyecto**.
No es opcional: estas reglas evitan errores, retrabajo y desorden.

---

# 🎯 Objetivo del documento

* Mantener el código organizado
* Evitar duplicación de lógica
* Separar correctamente responsabilidades
* Facilitar el trabajo en equipo (Scrum)

---

# 🧱 Arquitectura del proyecto

```text
Frontend (app/)
   ↓
API (app/api)
   ↓
Services (lógica de negocio)
   ↓
Base de datos (Prisma)
```

---

# 📁 Estructura del proyecto

```bash
src/
├── app/            # Rutas, vistas y API (Next.js)
├── components/     # UI reutilizable
├── services/       # 🔥 Lógica del negocio
├── lib/            # Configuración y utilidades
├── prisma/         # Base de datos (schema)
```

---

# 📂 Descripción por carpetas

## 🔹 `app/` → Frontend + API

Contiene:

* páginas del sistema
* dashboards
* API routes (`/api`)

### ⚠️ Reglas:

* NO lógica de negocio aquí
* Solo:

  * recibir requests
  * enviar responses
  * renderizar vistas

---

## 🔹 `app/api/` → Backend (controladores)

Ejemplo:

```bash
api/appointments/route.ts
```

### ⚠️ Reglas:

* NO lógica compleja
* SOLO:

  * validar input
  * llamar services
  * devolver respuesta

---

## 🔹 `services/` → 🔥 LÓGICA DEL SISTEMA

Aquí vive el corazón del proyecto.

Ejemplos:

* crear cita
* cancelar cita
* priorizar pacientes
* reasignar citas

### ⚠️ Reglas:

* NO usar React
* NO manejar HTTP
* NO acceder directamente al frontend
* Código reutilizable y limpio

---

## 🔹 `components/` → UI

Componentes visuales reutilizables.

### Estructura:

```bash
components/
├── ui/
├── forms/
├── layout/
```

### ⚠️ Reglas:

* NO lógica de negocio
* SOLO presentación

---

## 🔹 `lib/` → Configuración

Ejemplos:

* conexión a base de datos
* helpers
* utilidades globales

---

## 🔹 `prisma/` → Base de datos

Contiene:

* `schema.prisma`

### ⚠️ Nota:

La base de datos será gestionada por el responsable asignado.

---

# 🔁 Flujo de desarrollo

```text
1. Usuario interactúa (frontend)
2. Se llama API (route.ts)
3. API llama a service
4. Service ejecuta lógica
5. Prisma guarda/consulta datos
```

---

# 🚫 Reglas CRÍTICAS (NO romper)

## ❌ NO lógica en el frontend

Todo va en `services/`

---

## ❌ NO lógica en API routes

Solo coordinación

---

## ❌ NO duplicar funciones

Si ya existe un service → reutilizar

---

## ❌ NO acceder a la DB desde componentes

Solo desde services

---

# 🧠 Convenciones de código

## 📌 Nombres de funciones

```ts
createAppointment()
cancelAppointment()
calculatePriority()
```

---

## 📌 Estructura de services

```bash
services/
├── appointment/
├── auth/
├── priority/
```

---

## 📌 API routes

Siempre deben exportar:

```ts
export async function GET() {}
export async function POST() {}
```

---

# 🌿 Uso de Git (OBLIGATORIO)

## ❌ Nunca trabajar en main

Usar ramas:

```bash
feature/auth
feature/appointments
feature/prioritization
```

---

## 📌 Commits

Formato:

```bash
feat: add appointment creation
fix: login validation error
chore: project setup
```

---

# 👥 Organización del equipo

Cada integrante debe trabajar en:

* un módulo específico
* una rama específica

Ejemplo:

| Persona  | Módulo         |
| -------- | -------------- |
| Backend  | API + services |
| Frontend | UI             |
| DB       | Prisma         |

---

# ⚠️ Antes de subir código

Verificar:

* ¿Está en la carpeta correcta?
* ¿No rompe la arquitectura?
* ¿No duplica lógica?
* ¿Usa services?

---

# 🚀 Nota final

Este proyecto no es solo frontend.

La parte más importante es:

* priorización de citas
* reasignación automática
* lógica del sistema

---

**Si no sabes dónde poner algo → pregunta antes de hacerlo.**
