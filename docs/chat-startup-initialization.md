# Inicialización del Estado del Chat al Arrancar

## Descripción

Al iniciar la aplicación, el widget de chat ahora verifica y restaura el estado del toggle guardado previamente, mostrando u ocultando el chat según la preferencia del usuario.

## Problema Resuelto

Anteriormente:
- El chat siempre iniciaba con `isEnabled: true` por defecto
- No se restauraba correctamente el estado del toggle desde `localStorage`
- El chat podría no mostrar/ocultarse correctamente al recargar la página

## Solución Implementada

### Cambios en `ChatDockContext.tsx`

Se agregó un `useEffect` que se ejecuta **una única vez al montar** el contexto:

```tsx
// Al iniciar, verificar el estado guardado del toggle y aplicarlo
useEffect(() => {
  const saved = localStorage.getItem(CHAT_ENABLED_KEY);
  if (saved !== null) {
    const enabledState = JSON.parse(saved);
    setIsEnabledState(enabledState);
    // Aplicar el estado al chatState
    setChatState((prev) => ({
      ...prev,
      isOpen: enabledState,
      isMinimized: false,
    }));
    // Si está habilitado, forzar modo docked
    if (enabledState) {
      setIsDocked(true);
    }
  }
}, []); // Solo ejecutar una vez al montar
```

## Comportamiento

### Al Cargar la Aplicación

1. El contexto lee el estado guardado desde `localStorage` con la clave `chatWidgetEnabled`
2. Si existe un estado guardado:
   - Restaura el valor de `isEnabled`
   - Aplica el estado a `isOpen` (mostrar si está habilitado, ocultar si no)
   - Si está habilitado, fuerza el modo docked
3. Si no existe estado guardado (primera vez):
   - El valor por defecto es `true` (chat habilitado)
   - El chat se mostrará automáticamente

### Estados de Persistencia

| Elemento | Almacenamiento | Descripción |
|----------|-----------------|------------|
| `isEnabled` | localStorage | Toggle del asistente virtual |
| `isOpen` | sessionStorage | Estado de visibilidad actual (sesión) |
| `isDocked` | localStorage | Preferencia de modo acoplado |
| `chatWidth` | localStorage | Ancho del panel |

## Archivos Modificados

- `src/contexts/ChatDockContext.tsx`: Agregado `useEffect` de inicialización en el `ChatDockProvider`

## Casos de Uso

### Caso 1: Usuario desactiva el chat y recarga la página
1. Usuario hace clic en el toggle para desactivar el chat
2. Estado `isEnabled: false` se guarda en `localStorage`
3. Al recargar la página:
   - El `useEffect` de inicialización lee `isEnabled: false`
   - El chat permanece oculto
   - El toggle aparece desactivado en el header

### Caso 2: Usuario activa el chat y cierra la pestaña
1. Usuario activa el toggle
2. Estado `isEnabled: true` se guarda en `localStorage`
3. Usuario cierra la pestaña del navegador
4. Al abrir nuevamente:
   - El `useEffect` de inicialización lee `isEnabled: true`
   - El chat aparece automáticamente
   - El toggle aparece activado en el header

## Notas Técnicas

- El `useEffect` tiene dependencia vacía `[]`, lo que garantiza que se ejecute **solo una vez** al montar el `ChatDockProvider`
- La verificación `if (saved !== null)` distingue entre:
  - `null`: Primera vez (usa default `true`)
  - `"false"` o `"true"`: Valor guardado (respeta preferencia del usuario)
- El estado se sincroniza en dos niveles:
  - `isEnabled`: Estado del toggle del asistente
  - `isOpen`: Estado de visibilidad del widget (derivado de `isEnabled`)

## Referencias

- Documentación de persistencia: [chat-state-persistence.md](./chat-state-persistence.md)
- Documentación del toggle: [assistant-toggle.md](./assistant-toggle.md)
- Contexto principal: `src/contexts/ChatDockContext.tsx`
