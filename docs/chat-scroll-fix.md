# Corrección: Scroll Repetitivo en Chat Widget Durante Navegación

## Problema
Cuando el usuario navegaba a otra página de la aplicación mientras el chat estaba abierto, el widget de chat ejecutaba automáticamente un scroll hasta el último mensaje, causando distracción y comportamiento visual confuso.

## Causa Raíz
El problema estaba en dos `useEffect` en `ChatWidget.tsx`:

1. **Efecto 1 (línea ~99)**: Se ejecutaba cuando `messages` o `isOpen` cambiaban
   - Disparaba scroll automáticamente cada vez que `isOpen` era `true`
   - Durante navegación entre páginas, aunque no había nuevos mensajes, el efecto se ejecutaba

2. **Efecto 2 (línea ~107)**: Se ejecutaba cuando `isLoading` o `isOpen` cambiaban
   - Similar comportamiento, disparaba scroll en situaciones innecesarias

## Solución Implementada

### 1. Agregar referencia para tracking de mensajes
```tsx
const lastMessageCountRef = useRef<number>(0);
```

### 2. Reemplazar Efecto 1 - Solo scroll en nuevos mensajes
**Antes:**
```tsx
useEffect(() => {
  if (isOpen) {
    const timeoutId = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    return () => clearTimeout(timeoutId);
  }
}, [messages, isOpen, scrollToBottom]);
```

**Después:**
```tsx
useEffect(() => {
  // Solo hacer scroll si:
  // 1. El chat está abierto
  // 2. Hay MÁS mensajes que antes (nuevo mensaje recibido)
  if (isOpen && messages.length > lastMessageCountRef.current) {
    lastMessageCountRef.current = messages.length;
    const timeoutId = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    return () => clearTimeout(timeoutId);
  }
  // Actualizar la referencia incluso si no se hace scroll
  lastMessageCountRef.current = messages.length;
}, [messages, isOpen, scrollToBottom]);
```

### 3. Optimizar Efecto 2 - Validar que hay contenido
**Antes:**
```tsx
useEffect(() => {
  if (isLoading && isOpen) {
    scrollToBottom(true);
  }
}, [isLoading, isOpen, scrollToBottom]);
```

**Después:**
```tsx
useEffect(() => {
  if (isLoading && isOpen && messages.length > 0) {
    // Solo hacer scroll si realmente hay mensajes que mostrar
    scrollToBottom(true);
  }
}, [isLoading, isOpen, messages.length, scrollToBottom]);
```

## Beneficios
✅ **Elimina scroll repetitivo** durante navegación entre páginas
✅ **Mantiene scroll automático** cuando hay nuevos mensajes
✅ **Reduce ruido visual** mientras se navega la aplicación
✅ **Performance mejorado** - menos efectos innecesarios

## Testing
- ✓ Navega entre páginas (dashboard, productos, ventas, clientes)
- ✓ El chat NO hace scroll si no hay nuevos mensajes
- ✓ El chat SÍ hace scroll cuando recibes una respuesta del asistente
- ✓ El chat SÍ muestra el indicador de typing al enviar mensajes
