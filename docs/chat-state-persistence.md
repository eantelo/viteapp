# Persistencia del Estado del Chat entre Navegaciones

## Descripción

El widget de chat ahora mantiene su estado completo (conversación, mensajes, estado abierto/minimizado) cuando el usuario navega entre páginas de la aplicación.

## Problema Resuelto

Anteriormente, cuando el usuario navegaba a otra página:
- La conversación se perdía completamente
- El chat se minimizaba automáticamente
- El `conversationId` del backend se reiniciaba

## Solución Implementada

### Cambios en `ChatDockContext.tsx`

El contexto ahora gestiona:

1. **Estado de visibilidad** (`isOpen`, `isMinimized`): Persistido en `sessionStorage`
2. **Mensajes de la conversación** (`messages`): Persistido en `sessionStorage`
3. **ID de conversación del backend** (`conversationId`): Persistido en `sessionStorage`
4. **Preferencia de acoplamiento** (`isDocked`): Persistido en `localStorage` (permanente)
5. **Ancho del panel** (`chatWidth`): Persistido en `localStorage` (permanente)

### Claves de Storage

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `chatWidgetState` | sessionStorage | Estado de visibilidad y conversationId |
| `chatWidgetMessages` | sessionStorage | Array de mensajes |
| `chatWidgetDocked` | localStorage | Preferencia de modo dock |
| `chatWidgetWidth` | localStorage | Ancho del panel en píxeles |

### Formato de Mensajes

```typescript
interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: string; // ISO 8601 string para serialización
  chartData?: ChartData; // Datos de gráficos opcionales
}
```

> **Nota**: El `timestamp` se cambió de `Date` a `string` (ISO format) para permitir la serialización/deserialización correcta en `sessionStorage`.

### API del Contexto

```typescript
interface ChatDockContextType {
  // Estado de dock (persistido en localStorage)
  isDocked: boolean;
  setIsDocked: (docked: boolean) => void;
  
  // Estado de visibilidad (persistido en sessionStorage)
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  
  // Dimensiones (persistido en localStorage)
  chatWidth: number;
  setChatWidth: (width: number) => void;
  minChatWidth: number;
  maxChatWidth: number;
  
  // Calculado
  isChatVisibleAndDocked: boolean;
  
  // Mensajes (persistido en sessionStorage)
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Message) => void;
  
  // Conversación (persistido en sessionStorage)
  conversationId: string | undefined;
  setConversationId: (id: string | undefined) => void;
  resetConversation: () => void;
}
```

## Comportamiento

### Al Navegar

- El chat mantiene su estado (abierto, minimizado, etc.)
- Los mensajes se preservan
- El `conversationId` se mantiene para continuar la conversación con el backend

### Al Cerrar la Pestaña/Navegador

- Se pierde el estado de sesión (`sessionStorage`)
- Se mantienen las preferencias de usuario (`localStorage`): modo dock y ancho

### Al Iniciar Nueva Conversación

La función `resetConversation()` del contexto:
- Reinicia los mensajes al mensaje de bienvenida
- Limpia el `conversationId`
- Mantiene el estado de visibilidad

## Consideraciones

1. **Tamaño de Storage**: Los mensajes con gráficos pueden ser grandes. `sessionStorage` tiene un límite de ~5MB.

2. **Seguridad**: No se persisten tokens ni información sensible. Solo el contenido de la conversación UI.

3. **Limpieza Automática**: El `sessionStorage` se limpia automáticamente al cerrar el navegador.

## Archivos Modificados

- `src/contexts/ChatDockContext.tsx`: Estado centralizado con persistencia
- `src/components/chat/ChatWidget.tsx`: Usa el estado del contexto en lugar de estado local
