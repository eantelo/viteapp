# Limpieza de navegación y enlaces

## Objetivo

Eliminar rutas rotas, recargas completas innecesarias y enlaces placeholder para que la experiencia se mantenga consistente entre la landing y el dashboard autenticado.

## Cambios aplicados

- El sidebar principal usa navegación SPA con `Link` de React Router.
- El acceso destacado del sidebar ahora apunta a `Nueva venta` (`/sales/new`), una ruta ya existente.
- Se ocultó el grupo de reportes del sidebar hasta que existan páginas reales para esos destinos.
- El footer del sidebar dejó de mostrar un usuario ficticio y ahora usa el usuario autenticado real.
- Los breadcrumbs del header ya no usan `href` directos; navegan con React Router.
- La landing conserva solo enlaces operativos:
  - `#features`
  - `/login`
  - `/register`
  - `/forgot-password`
- Se retiró el CTA a `/demo` y se reemplazó por un acceso a funcionalidades reales.
- Los enlaces `#` del login y del footer se sustituyeron por texto o rutas válidas.

## Criterio UX

- No exponer acciones sin implementación visible.
- Priorizar continuidad SPA dentro del dashboard para evitar recargas completas.
- Mantener consistencia de idioma en pantallas públicas.
- Evitar que el usuario termine en rutas inexistentes o placeholders sin contexto.

## Pendiente

- Reemplazar acciones críticas que todavía usan `confirm()` y `alert()` por diálogos consistentes.
- Revisar botones secundarios del header (`Ayuda`, `Ver todas las notificaciones`) para ocultarlos o conectarlos con flujos reales.
