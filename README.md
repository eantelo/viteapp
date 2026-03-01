# Sales.Web (`viteapp`)

Frontend SPA del sistema Sales, construido con Vite + React + TypeScript.

## Stack

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Cliente HTTP centralizado para consumir `Sales.Api`

## Estructura de carpetas

```text
viteapp/
├─ src/
│  ├─ components/   # Componentes reutilizables y UI
│  ├─ pages/        # Páginas de rutas
│  ├─ hooks/        # Hooks de dominio y estado
│  ├─ api/          # Cliente HTTP y servicios
│  ├─ lib/          # Utilidades compartidas
│  └─ styles/       # Estilos base (si aplica)
├─ public/          # Assets estáticos
├─ docs/            # Documentación funcional y técnica del frontend
├─ components.json  # Inventario/config de shadcn/ui
└─ vite.config.ts
```

## Desarrollo local

Requisitos:

- Node.js LTS
- npm

Flujo:

1. Instalar dependencias: `npm install`
2. Ejecutar en desarrollo: `npm run dev`
3. Build de producción: `npm run build`

## Variables de entorno

Define la URL de API en `.env`:

`VITE_API_URL=http://localhost:5205`

## Despliegue en Dokploy

El frontend ya incluye configuración lista para contenedor:

- `Dockerfile` (build multistage con Vite + Nginx)
- `nginx.conf` (fallback SPA para React Router)
- `.dockerignore`

Guía completa de despliegue: `docs/dokploy-deploy.md`.

## Convenciones

- No llamar API directamente desde páginas: usar `src/api` + hooks/servicios.
- Mantener componentes pequeños y tipados.
- Documentar nuevas funcionalidades en `viteapp/docs`.
