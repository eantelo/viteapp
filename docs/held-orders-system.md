# Sistema de Órdenes en Espera (Held Orders)

## Propósito

El sistema de órdenes en espera permite a los usuarios del punto de venta (POS) pausar una venta actual para atender a otro cliente y retomarla más tarde. Todas las órdenes se guardan en el backend para persistencia y se pueden recuperar en cualquier momento.

## Características Principales

### 1. Guardar Órdenes en Espera

- **Botón "Poner en espera"** (F8): Guarda la orden actual con timestamp
- La orden incluye:
  - Cliente asociado (opcional)
  - Lista de productos con cantidades y precios
  - Descuento aplicado
  - Subtotal y total calculados
- Limpia la pantalla para procesar una nueva venta
- Muestra notificación de confirmación

### 2. Auto-guardado

- **Intervalo**: Cada 30 segundos (configurable en `AUTO_SAVE_INTERVAL`)
- Se ejecuta automáticamente si hay items en el carrito
- Solo guarda si la orden tiene productos
- Actualiza la lista de órdenes después del guardado

### 3. Indicador Visual

- **Badge en el header**: Muestra el número de órdenes en espera
- Aparece solo cuando hay órdenes guardadas
- Al hacer clic abre el panel lateral de órdenes

### 4. Panel Lateral de Órdenes

Características del panel (`HeldOrdersPanel`):

- **Búsqueda/filtro**: Por cliente, ID de orden o productos
- **Vista de órdenes** con:
  - Cliente asociado
  - Hora y fecha de creación
  - Lista de productos (primeros 3 + contador)
  - Total de la orden
  - Número de items

### 5. Acciones Disponibles

- **Recuperar orden**: Restaura la orden al carrito actual
- **Eliminar orden**: Marca la orden como inactiva en el backend
- Ambas acciones muestran notificaciones de confirmación

## Arquitectura

### Backend

#### Entidad (`Sales.Domain/Entities/HeldOrder.cs`)

```csharp
public class HeldOrder : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string ItemsJson { get; set; } // JSON con productos
    public decimal Discount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Total { get; set; }
    public bool IsActive { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Customer? Customer { get; set; }
}
```

#### DTOs (`Sales.Application/HeldOrders/DTOs/`)

- `HeldOrderDto`: Representación completa de la orden
- `HeldOrderCreateDto`: Datos para crear nueva orden
- `HeldOrderItemDto`: Producto dentro de la orden

#### Servicio (`Sales.Application/HeldOrders/HeldOrdersService.cs`)

Métodos principales:
- `GetAllAsync`: Obtiene todas las órdenes activas del tenant
- `GetByIdAsync`: Obtiene una orden específica
- `CreateAsync`: Crea nueva orden en espera
- `DeleteAsync`: Desactiva una orden (soft delete)

#### API (`Sales.Api/Controllers/HeldOrdersController.cs`)

Endpoints REST:
- `GET /api/heldorders` - Listar órdenes
- `GET /api/heldorders/{id}` - Obtener orden específica
- `POST /api/heldorders` - Crear orden
- `DELETE /api/heldorders/{id}` - Eliminar orden

### Frontend

#### API Cliente (`viteapp/src/api/heldOrdersApi.ts`)

Funciones para consumir el backend:
- `getHeldOrders()`
- `getHeldOrderById(id)`
- `createHeldOrder(dto)`
- `deleteHeldOrder(id)`

#### Hook (`viteapp/src/hooks/usePointOfSale.ts`)

Funcionalidades agregadas:
- `heldOrders`: Estado con lista de órdenes
- `heldOrdersLoading`: Indicador de carga
- `loadHeldOrders()`: Recarga lista desde backend
- `holdOrder()`: Guarda orden actual en backend
- `resumeHeldOrder(order)`: Restaura orden al carrito
- `removeHeldOrder(orderId)`: Elimina orden del backend
- Auto-guardado con timer de 30 segundos

#### Componente (`viteapp/src/components/sales/HeldOrdersPanel.tsx`)

Panel lateral (Sheet) con:
- Header con título y contador
- Input de búsqueda/filtro
- Lista scrolleable de órdenes
- Tarjetas por orden con información detallada
- Botones de acción (Recuperar, Eliminar)

#### Página (`viteapp/src/pages/PointOfSalePage.tsx`)

Integraciones:
- Badge indicador de órdenes en espera
- Botón para abrir panel (cuando hay órdenes)
- Atajo de teclado **F8** para poner en espera
- Gestión de notificaciones toast

## Flujo de Uso

### Guardar Orden en Espera

1. Usuario agrega productos al carrito
2. Opcionalmente selecciona cliente y aplica descuento
3. Presiona **F8** o botón "Poner en espera"
4. Sistema guarda la orden en el backend
5. Limpia el carrito para nueva venta
6. Muestra notificación de confirmación
7. Actualiza contador de órdenes

### Recuperar Orden

1. Usuario hace clic en badge de órdenes o botón del header
2. Se abre panel lateral con lista de órdenes
3. Usuario busca/filtra la orden deseada
4. Hace clic en "Recuperar"
5. Orden se carga en el carrito actual
6. Panel se cierra automáticamente
7. Usuario puede continuar con el cobro

### Eliminar Orden

1. Usuario abre panel de órdenes
2. Localiza la orden a eliminar
3. Hace clic en botón de eliminar (icono de basura)
4. Sistema marca orden como inactiva en backend
5. Orden desaparece de la lista
6. Muestra notificación de confirmación

## Seguridad y Multitenancy

- Todas las órdenes están filtradas por `TenantId`
- Filtro global aplicado a nivel de EF Core
- El backend valida siempre el tenant del usuario autenticado
- No es posible ver/modificar órdenes de otros tenants

## Persistencia

- **Tabla**: `HeldOrders` en PostgreSQL
- **Columna de datos**: `ItemsJson` tipo `text` (JSON serializado)
- **Índices**:
  - `(TenantId, IsActive)` - Consultas por tenant
  - `(TenantId, CreatedAt)` - Ordenamiento temporal
- **Relación**: `CustomerId` → `Customers` (ON DELETE SET NULL)

## Consideraciones de Rendimiento

- Las órdenes inactivas permanecen en base de datos (soft delete)
- El auto-guardado crea duplicados si no se limpia
- Considerar limpieza periódica de órdenes antiguas
- JSON de items puede crecer con muchos productos

## Mejoras Futuras

- [ ] Limpieza automática de órdenes antiguas (> 7 días)
- [ ] Edición de órdenes en espera
- [ ] Sincronización en tiempo real entre terminales
- [ ] Notificaciones push cuando hay órdenes pendientes
- [ ] Exportación de órdenes a Excel/PDF
- [ ] Estadísticas de órdenes en espera por usuario
- [ ] Límite máximo de órdenes en espera por usuario
- [ ] Priorización de órdenes (urgente, normal, etc.)

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| **F8** | Poner orden en espera |

## Código de Ejemplo

### Crear orden manualmente desde código

```typescript
import { createHeldOrder } from "@/api/heldOrdersApi";

const order = await createHeldOrder({
  customerId: "customer-guid",
  customerName: "Juan Pérez",
  items: [
    {
      productId: "product-guid",
      name: "Producto 1",
      sku: "SKU-001",
      price: 10.50,
      quantity: 2,
      stock: 100,
    }
  ],
  discount: 5.00
});
```

### Recuperar órdenes en otro componente

```typescript
import { getHeldOrders } from "@/api/heldOrdersApi";

const orders = await getHeldOrders();
console.log(`Hay ${orders.length} órdenes en espera`);
```

## Solución de Problemas

### La orden no se guarda

- Verificar que hay productos en el carrito
- Revisar conexión con el backend (F12 → Network)
- Verificar autenticación JWT válida
- Revisar logs del backend

### Auto-guardado crea muchas órdenes

- El auto-guardado actual no valida duplicados
- Solución temporal: Limpiar órdenes manualmente
- Mejora futura: Actualizar orden existente en lugar de crear nueva

### Órdenes no aparecen en el panel

- Verificar que `IsActive = true` en base de datos
- Revisar filtros de tenant
- Recargar la página (F5)
- Verificar permisos de usuario

---

**Fecha de implementación**: Noviembre 2025  
**Versión**: 1.0  
**Autor**: Sistema ERP Sales
