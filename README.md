# Plataforma Grupo 3i — Fase 0

Monorepo de la plataforma de Grupo 3i: landing inmobiliaria + tienda + Club 3i.

## Stack

| Capa      | Tecnología |
|-----------|------------|
| Frontend  | React 19 · Vite 6 · Tailwind v4 · React Router v7 (HashRouter) |
| Backend   | Express · Prisma · TypeScript (tsx) |
| BD        | PostgreSQL (Railway) |
| Auth      | Supabase Auth (público) · JWT propio (staff) |
| Imágenes  | Cloudinary |
| Hosting   | Railway |

## Estructura

```
plataforma-3i/
├── frontend/   # React + Vite (se buildea local → dist/ commiteado)
├── backend/    # Express + Prisma (sirve frontend/dist y la API)
├── shared/     # Tipos TypeScript compartidos
└── railway.json
```

## Desarrollo local

### 1. Backend

```bash
cd backend
cp .env.example .env          # rellena DATABASE_URL, JWT_SECRET, CLOUDINARY_URL
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed                  # carga contenido, proyectos y productos iniciales
npm run dev                   # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # opcional: Supabase
npm install
npm run dev                   # http://localhost:5173 (proxy /api → :3000)
```

## Build de producción

El frontend se buildea **localmente** y la carpeta `frontend/dist/` se **commitea** al repo.
El backend de Railway sirve esos estáticos.

```bash
cd frontend && npm run build  # genera frontend/dist/
git add frontend/dist && git commit -m "build: frontend dist"
```

## Deploy (Railway)

- `railway.json` usa NIXPACKS y arranca con:
  `cd backend && npx prisma generate && npx prisma migrate deploy && npx tsx src/index.ts`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL` (Railway secrets).
- Push a `main` → deploy automático.

## API

| Método | Ruta | Acceso |
|--------|------|--------|
| GET  | `/api/health` | público |
| GET  | `/api/content[?section=hero]` | público |
| PUT  | `/api/content` | admin |
| GET  | `/api/projects` · `/api/projects/:slug` | público |
| POST/PUT/DELETE | `/api/projects[/:id]` | admin |
| GET  | `/api/products[?type=]` · `/api/products/:slug` | público |
| POST | `/api/products/:id/inquiry` | público |
| POST/PUT/DELETE | `/api/products[/:id]` | admin |
| POST | `/api/contact` | público |
| GET  | `/api/contact` | admin |

## Reglas del proyecto

- Tailwind v4 vía `@tailwindcss/vite` (sin `tailwind.config.js` ni `postcss.config.js`).
- HashRouter solo en `App.tsx` (nunca en `main.tsx`).
- Solo utility classes de Tailwind (sin CSS modules).
- Imágenes Cloudinary con `q_auto:best,f_auto` (helper `cloudinaryOptimize`).
