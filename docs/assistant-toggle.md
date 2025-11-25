# Toggle del Asistente Virtual

## Descripción

Se ha implementado un toggle button en el header para mostrar/ocultar el asistente virtual en modo docked (acoplado a la derecha). El modo floating y el botón flotante han sido eliminados.

## Cambios Realizados

### 1. `ChatDockContext.tsx`
- El estado `isEnabled` controla la visibilidad del chat docked
- Al activar el toggle, se abre automáticamente el chat y se fuerza el modo docked
- Al desactivar, se cierra el chat
- Estado persistido en `localStorage`

### 2. `Header.tsx`
- Toggle button con icono `Bot` y componente `Switch`
- El icono cambia de color: `primary` cuando activo, `muted` cuando inactivo
- Se usa `isChatVisibleAndDocked` para el estado visual

### 3. `ChatWidget.tsx`
- **Eliminado el modo floating completamente**
- **Eliminado el botón flotante**
- Solo renderiza el panel docked cuando `isEnabled` es `true`
- El botón X del chat también desactiva el toggle
- Simplificado al eliminar referencias a `isDocked`, `isMinimized`, etc.

## Uso

- El toggle aparece en el header, visible en pantallas `sm` (640px) o mayores
- Al activar el toggle: se muestra el chat docked a la derecha
- Al desactivar el toggle: se oculta el chat
- El botón X dentro del chat también lo oculta (desactiva el toggle)
- El estado se persiste en `localStorage`

## Estado Persistido

El estado `isEnabled` se guarda en `localStorage` bajo la clave `chatWidgetEnabled`, permitiendo que la preferencia del usuario se mantenga entre sesiones.
