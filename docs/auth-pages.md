# Autenticación en Sales.Web

## Resumen

Se agregaron las páginas de **login** y **registro** dentro de `src/pages` consumiendo los endpoints de `Sales.Api` (`/api/auth/login` y `/api/auth/register`). Ambas pantallas comparten un layout consistente (`AuthLayout`) y se apoyan en componentes reutilizables (`Button`, `Input`, `Label`, `Card`, `Alert`) implementados con la librería de **shadcn/ui**. El formulario de login ahora incluye toggles accesibles (mostrar/ocultar contraseña, recordar dispositivo) y mensajes de error alineados con los estilos de shadcn. Tras una autenticación exitosa se persiste el `AuthResponse` en `localStorage`, se programa la renovación automática vía `/api/auth/refresh-token`, y al cerrar sesión se llama a `/api/auth/revoke-token` antes de limpiar el estado local.

## Rutas

| Ruta        | Descripción                                 | Componentes clave                     |
|-------------|---------------------------------------------|---------------------------------------|
| `/login`    | Inicio de sesión con email + contraseña     | `LoginPage`, `AuthLayout`, `Input`     |
| `/register` | Registro de tenant + primer usuario admin   | `RegisterPage`, `AuthLayout`, `Input`  |
| `/dashboard`| Vista protegida con datos del token emitido | `DashboardPage`, `ProtectedRoute`      |

La ruta raíz (`/`) redirige automáticamente a `/dashboard` cuando hay sesión válida o a `/login` cuando no existe token.

## Flujo de datos

1. El usuario completa el formulario; las reglas locales validan email, contraseña (mínimo 8 caracteres + números/letras) y, en registro, el `tenantCode` (`^[a-z0-9-]{3,32}$`).
2. `authApi.login` o `authApi.register` envía un `POST` a `Sales.Api` con JSON.
3. El servicio devuelve un `AuthResponse` con `token`, `refreshToken`, `tenantId`, etc.
4. `AuthContext` guarda el payload en `localStorage` (`salesnet.auth`), expone estados de refresco y agenda automáticamente la invocación a `/api/auth/refresh-token` un minuto antes de que expire el access token.
5. Cuando el usuario cierra sesión, `AuthContext.logout` revoca el refresh token activo mediante `/api/auth/revoke-token` y después limpia el almacenamiento.
6. `ProtectedRoute` permite el acceso a `/dashboard` únicamente cuando `isAuthenticated` es verdadero.

### Renovación automática y manual

- `AuthContext` decodifica el `exp` del JWT para determinar el momento óptimo de renovación.
- El refresh se ejecuta en segundo plano; si falla se cierra la sesión y se muestra un mensaje en la UI.
- `DashboardPage` muestra el estado actual (última renovación, errores) y expone un botón **“Renovar ahora”** que llama manualmente al endpoint.

## Componentes reutilizables

- `Button`, `Input`, `Label`, `Card`, `Alert`, `Spinner`: estilos basados en shadcn/ui + Tailwind, pensados para extender el diseño del portal.
- `AuthLayout`: encapsula el hero lateral y la tarjeta del formulario para login/registro.
- `ProtectedRoute`: wrapper sencillo para rutas privadas.

Todos los componentes se encuentran bajo `src/components` y pueden emplearse en nuevas vistas (ej. onboarding, recuperación de contraseña).

## Variables de entorno

- `VITE_API_URL`: apunta a la URL de `Sales.Api`. Por defecto se usa `http://localhost:5205`.

### Revocación de tokens

- El botón **“Cerrar sesión”** en `DashboardPage` llama a `AuthContext.logout`, que revoca el refresh token remoto antes de limpiar el contexto.
- Fallas en la revocación se registran en consola, pero el estado local se limpia para impedir el reuso del access token.
- Los flujos que detonan un cierre de sesión forzado (p.ej. fallo al refrescar) aprovechan la misma función para mantener consistencia.

## Próximos pasos sugeridos

1. Añadir recordatorios/UX para expiración de refresh tokens y rotación forzada.
2. Crear pruebas E2E que validen los flujos de login, registro, renovación automática y revocación utilizando datos semilla.
