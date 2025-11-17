# Dashboard renovado

## Objetivo

Se reescribió `src/pages/DashboardPage.tsx` para aprovechar el layout completo proporcionado por **shadcn/ui** (Sidebar + Breadcrumb + Cards) y ofrecer un panel que combine información de la sesión JWT con acciones rápidas (renovar tokens, cerrar sesión) y recordatorios operativos.

## Secciones principales

1. **Sidebar + Header anclado**
   - `<SidebarProvider>` + `<AppSidebar />` enmarcan toda la vista.
   - El header incluye `SidebarTrigger`, `Breadcrumb` y datos del usuario autenticado con un botón de cierre de sesión.
2. **Tarjetas de métricas**
   - Grid responsivo (`sm:grid-cols-2`, `xl:grid-cols-4`) con `Card` + `CardDescription` para correo, rol, tenant activo y última renovación.
3. **Gestión de sesión**
   - Card con `Alert` para errores/éxitos, botón **Renovar ahora** (usa `Spinner` cuando `isRefreshing` es true) y listado de tokens/claims (`TenantId`, `UserId`, access/refresh token).
   - Incluye recordatorio de buenas prácticas (renovar antes de expirar, revocar al cerrar sesión, etc.).
4. **Panel de diagnóstico**
   - Tarjeta lateral con bloques informativos sobre estado del refresh automático, autenticación y recomendaciones rápidas.

## Comportamiento

- `useAuth` continúa exponiendo `refreshSession`, `logout`, `isRefreshing`, `refreshError` y `lastRefreshAt`.
- Mensajes secundarios:
  - `manualMessage` muestra confirmación al renovar manualmente.
  - `Alert` alterna entre variantes `error`/`success` según `refreshError`.
- Se utilizan `Spinner`, `Badge` y `Button` de shadcn para estados de carga e indicadores visuales.

## Acciones del usuario

- **Renovar ahora**: invoca `refreshSession()` y actualiza `manualMessage` cuando la API responde correctamente.
- **Cerrar sesión**: deshabilita el botón mientras `logout()` está en curso para evitar múltiples solicitudes.
- El grid de tokens permite copiar valores (se usa `font-mono` + `break-all`).

## Requisitos de estilo

- Fondo general `bg-slate-50`, cards blancas con `shadow-sm` para seguir la guía del sistema de diseño (`viteapp/agents.md`).
- `aria-invalid` se aplica en inputs de login/registro para aprovechar las clases `aria-invalid:*` definidas en los componentes de shadcn.

## Próximos pasos sugeridos

1. Integrar datos reales (ventas, clientes, etc.) en nuevas tarjetas reutilizando el layout existente.
2. Añadir tabla con actividad reciente usando `data-table.tsx` para mantener consistencia visual.
3. Conectar el sidebar (`AppSidebar`) con las rutas reales cuando se publiquen más módulos.
