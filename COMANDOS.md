# Comandos MediSmart

## Iniciar MySQL + Ollama

```powershell
docker compose up -d
```

Espera ~30s a que MySQL este listo.

## Sincronizar base de datos

```powershell
npx prisma db push
```

## Sembrar datos (solo primera vez)

```powershell
npm run db:seed
```

## Iniciar servidor de desarrollo

```powershell
npm run dev
```

Abrir http://localhost:3000

## Tunel para WhatsApp (opcional)

```powershell
ngrok http 3000
```

Configurar URL en Twilio Console -> Sandbox.

## Detener servicios

```powershell
docker compose down
```

## Resumen

```powershell
docker compose up -d
npx prisma db push
npm run db:seed
npm run dev
```

## Ayuda

```powershell
npm run db:studio     # Prisma Studio (admin BD)
npm run lint          # Linter
npx tsc --noEmit      # TypeScript check
npm run build         # Build produccion
```
