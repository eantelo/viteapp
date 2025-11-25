# Actualización en Tiempo Real de Productos desde el Chat

## Descripción

Esta funcionalidad permite que las páginas de productos se actualicen automáticamente cuando el asistente de chat realiza cambios en los datos de un producto (como ajustes de stock, creación de productos, etc.).

## Problema que Resuelve

Anteriormente, cuando un usuario ajustaba el stock de un producto desde el chat mientras tenía abierta la página de detalle del mismo producto, los datos mostrados no se actualizaban automáticamente. El usuario tenía que refrescar manualmente la página para ver los cambios.

## Solución Implementada

Se implementó un sistema de eventos personalizados que permite la comunicación entre el widget de chat y las páginas de productos:

1. **Sistema de Eventos** (`/src/lib/product-events.ts`):
   - Define eventos personalizados usando `CustomEvent` del navegador
   - Proporciona funciones para emitir y suscribirse a eventos de actualización de productos
   - Detecta automáticamente cuando una respuesta del chat indica una actualización de producto

2. **ChatWidget** (`/src/components/chat/ChatWidget.tsx`):
   - Detecta respuestas del asistente que indican actualizaciones de productos
   - Emite eventos cuando se detecta una actualización

3. **Páginas de Productos**:
   - `ProductDetailPage.tsx` - Se actualiza cuando el producto actual es modificado
   - `ProductsPage.tsx` - Refresca la lista de productos
   - `ProductCatalogPage.tsx` - Refresca el catálogo de productos

## Tipos de Actualizaciones Detectadas

| Tipo | Descripción | Patrones Detectados |
|------|-------------|---------------------|
| `stock` | Ajuste de inventario | "Entrada registrada", "Salida registrada", "Stock actualizado" |
| `created` | Producto nuevo | "Producto creado exitosamente" |
| `updated` | Modificación general | "Producto actualizado", "Producto modificado" |
| `deleted` | Eliminación | "Producto eliminado", "Producto borrado" |

## Uso del Sistema de Eventos

### Emitir un Evento

```typescript
import { emitProductUpdated } from "@/lib/product-events";

// Ejemplo: notificar que se actualizó el stock
emitProductUpdated({
  productId: "uuid-del-producto", // opcional
  updateType: "stock",
  productName: "Producto X",
  message: "Se agregaron 10 unidades al stock",
});
```

### Suscribirse a Eventos

```typescript
import { onProductUpdated } from "@/lib/product-events";

useEffect(() => {
  const unsubscribe = onProductUpdated((detail) => {
    if (detail.updateType === "stock") {
      // Refrescar datos
      loadProduct();
    }
  });

  return unsubscribe; // Limpiar al desmontar
}, []);
```

### Detectar Actualizaciones en Mensajes del Chat

```typescript
import { detectProductUpdateFromChatMessage } from "@/lib/product-events";

const message = "Entrada registrada para Coca-Cola. Stock actualizado: 50 unidades.";
const update = detectProductUpdateFromChatMessage(message);

if (update) {
  console.log(update.updateType); // "stock"
  console.log(update.productName); // "Coca-Cola"
}
```

## Estructura del Evento

```typescript
interface ProductUpdatedEventDetail {
  // ID del producto (opcional, undefined = actualización general)
  productId?: string;
  
  // Tipo de actualización
  updateType: "stock" | "created" | "updated" | "deleted";
  
  // Nombre del producto (opcional)
  productName?: string;
  
  // Mensaje original del chat (opcional)
  message?: string;
}
```

## Comportamiento en ProductDetailPage

Cuando se detecta una actualización desde el chat:

1. Se verifica si el evento corresponde al producto actualmente visible
2. Si coincide (por ID o es una actualización general), se recarga el producto
3. Se muestra una notificación toast informando al usuario

```typescript
// Solo refresca si:
// - El ID del producto coincide
// - O es una actualización sin ID específico (stock o updated)
const shouldRefresh =
  detail.productId === id ||
  (!detail.productId && (detail.updateType === "stock" || detail.updateType === "updated"));
```

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/lib/product-events.ts` | **Nuevo** - Sistema de eventos |
| `src/components/chat/ChatWidget.tsx` | Detecta y emite eventos |
| `src/pages/ProductDetailPage.tsx` | Escucha eventos y refresca |
| `src/pages/ProductsPage.tsx` | Escucha eventos y refresca lista |
| `src/pages/ProductCatalogPage.tsx` | Escucha eventos y refresca catálogo |

## Flujo de Datos

```
┌─────────────────┐
│   ChatWidget    │
│  (respuesta)    │
└────────┬────────┘
         │ detectProductUpdateFromChatMessage()
         ▼
┌─────────────────┐
│ Detectar tipo   │
│ de actualización│
└────────┬────────┘
         │ emitProductUpdated()
         ▼
┌─────────────────┐
│ CustomEvent     │
│ (window)        │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌───────┐ ┌───────┐    ┌───────────┐
│Detail │ │Products│   │  Catalog  │
│ Page  │ │  Page  │   │   Page    │
└───┬───┘ └───┬───┘    └─────┬─────┘
    │         │              │
    ▼         ▼              ▼
 Recargar  Recargar       Recargar
 producto   lista         catálogo
```

## Consideraciones

- Los eventos se propagan a través del objeto `window` del navegador
- La suscripción se limpia automáticamente cuando el componente se desmonta
- Las notificaciones toast solo se muestran en `ProductDetailPage` para evitar spam
- El sistema es extensible para detectar nuevos patrones de actualización
