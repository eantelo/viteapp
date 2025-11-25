# Corrección del Layout con Chat Acoplado

## Problema

Cuando la aplicación se iniciaba, el lado derecho de la pantalla aparecía vacío (con espacio reservado pero sin contenido). Esto ocurría porque:

1. El estado `isDocked` se persistía en `localStorage`
2. Al recargar la página, `isDocked` podía ser `true` (cargado del storage)
3. Pero el widget del chat tenía `isOpen: false` por defecto (no persistido)
4. El `DashboardLayout` aplicaba `paddingRight` basándose solo en `isDocked`, sin verificar si el chat estaba realmente visible

## Solución

Se centralizaron los estados `isOpen` e `isMinimized` en el contexto `ChatDockContext` para que el layout pueda determinar correctamente cuándo reservar espacio para el chat.

### Cambios realizados

#### 1. ChatDockContext.tsx

Se agregaron al contexto:
- `isOpen`: indica si el chat está abierto
- `setIsOpen`: función para cambiar el estado
- `isMinimized`: indica si el chat está minimizado
- `setIsMinimized`: función para cambiar el estado
- `isChatVisibleAndDocked`: propiedad calculada que indica si el chat está visible y acoplado

```tsx
interface ChatDockContextType {
  // ... propiedades existentes
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  isChatVisibleAndDocked: boolean;
}
```

La propiedad `isChatVisibleAndDocked` se calcula como:
```tsx
const isChatVisibleAndDocked = isOpen && !isMinimized && isDocked;
```

#### 2. ChatWidget.tsx

Se actualizó para usar los estados del contexto en lugar de estados locales:

```tsx
// Antes
const [isOpen, setIsOpen] = useState(false);
const [isMinimized, setIsMinimized] = useState(false);

// Después
const {
  isDocked,
  setIsDocked,
  isOpen,
  setIsOpen,
  isMinimized,
  setIsMinimized,
  chatWidth,
  setChatWidth,
  minChatWidth,
  maxChatWidth,
} = useChatDock();
```

#### 3. DashboardLayout.tsx

Se actualizó para usar `isChatVisibleAndDocked` en lugar de solo `isDocked`:

```tsx
// Antes
const { isDocked, chatWidth } = useChatDock();
style={{ paddingRight: isDocked ? `${chatWidth}px` : undefined }}

// Después
const { isChatVisibleAndDocked, chatWidth } = useChatDock();
style={{ paddingRight: isChatVisibleAndDocked ? `${chatWidth}px` : undefined }}
```

## Comportamiento resultante

1. **Al iniciar la aplicación**: El layout ocupa todo el espacio disponible sin reservar espacio para el chat
2. **Al abrir el chat flotante**: El layout no cambia (el chat flota sobre el contenido)
3. **Al acoplar el chat**: El layout se ajusta, reservando espacio a la derecha para el chat
4. **Al minimizar el chat acoplado**: El layout vuelve a ocupar todo el espacio
5. **Al cerrar el chat**: El layout vuelve a ocupar todo el espacio
6. **Al recargar con preferencia de acoplado guardada**: El layout inicia correctamente sin espacio reservado hasta que el usuario abra el chat

## Notas técnicas

- El estado `isDocked` sigue persistiéndose en `localStorage` para recordar la preferencia del usuario
- Los estados `isOpen` e `isMinimized` NO se persisten, ya que el chat debe iniciar cerrado
- La transición del layout se anima suavemente gracias a `transition-all duration-300`
