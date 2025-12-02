# Sistema de Notificaciones

Este documento describe el sistema de notificaciones implementado en Sales.

## Descripción General

El sistema de notificaciones permite informar a los usuarios sobre eventos importantes del sistema de forma no intrusiva. Las notificaciones aparecen en el header de la aplicación y se actualizan automáticamente mediante polling.

## Arquitectura

### Backend (Sales.Api)

#### Entidad `Notification`
```csharp
public class Notification
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; }        // null = broadcast para todo el tenant
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string? EntityName { get; set; }   // "Product", "Sale", etc.
    public Guid? EntityId { get; set; }       // ID del recurso relacionado
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
```

#### Tipos de Notificación (`NotificationType`)
| Valor | Nombre | Descripción |
|-------|--------|-------------|
| 1 | SaleCreated | Venta completada |
| 2 | SaleCancelled | Venta cancelada |
| 10 | LowStock | Producto con stock bajo |
| 11 | OutOfStock | Producto sin stock |
| 20 | ProductCreated | Nuevo producto creado |
| 21 | ProductUpdated | Producto actualizado |
| 30 | CustomerCreated | Nuevo cliente registrado |
| 40 | HeldOrderExpiring | Orden retenida próxima a expirar |
| 100 | SystemAlert | Alerta del sistema |

#### Prioridades (`NotificationPriority`)
| Valor | Nombre | Color |
|-------|--------|-------|
| 0 | Low | Gris |
| 1 | Normal | Azul |
| 2 | High | Amarillo |
| 3 | Critical | Rojo |

### Servicios

#### `INotificationService`
Interfaz principal para gestión de notificaciones:
- `GetNotificationsAsync()` - Obtiene lista de notificaciones del usuario
- `GetSummaryAsync()` - Resumen con conteo de no leídas por prioridad
- `CreateAsync()` - Crea una nueva notificación
- `MarkAsReadAsync()` - Marca como leída
- `MarkAllAsReadAsync()` - Marca todas como leídas
- `DeleteAsync()` - Elimina una notificación
- `CleanupOldNotificationsAsync()` - Limpia notificaciones antiguas
- `CheckAndNotifyLowStockAsync()` - Verifica stock bajo y genera alertas

#### `NotificationCleanupService`
Background service que ejecuta cada hora y elimina notificaciones con más de 1 día de antigüedad.

### Endpoints REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Lista notificaciones (filtrable) |
| GET | `/api/notifications/summary` | Resumen de conteos |
| PATCH | `/api/notifications/{id}/read` | Marcar como leída |
| PATCH | `/api/notifications/read-all` | Marcar todas como leídas |
| DELETE | `/api/notifications/{id}` | Eliminar notificación |
| POST | `/api/notifications/check-low-stock` | Verificar stock bajo |

#### Parámetros de Query para GET `/api/notifications`
- `unreadOnly` (bool): Solo no leídas
- `type` (NotificationType): Filtrar por tipo
- `take` (int): Límite de resultados (default: 50)

### Frontend (viteapp)

#### API Client (`src/api/notificationsApi.ts`)
Funciones para comunicarse con los endpoints:
```typescript
getNotifications(params?: NotificationsQueryParams)
getNotificationSummary()
markNotificationAsRead(id: string)
markAllNotificationsAsRead()
deleteNotification(id: string)
```

#### Hook (`src/hooks/useNotifications.ts`)
Hook React que implementa:
- Polling automático cada 30 segundos
- Estado de carga y error
- Funciones optimistas para UI responsive
- Cleanup automático al desmontar

```typescript
const {
  notifications,
  summary,
  isLoading,
  error,
  unreadCount,
  refetch,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = useNotifications();
```

#### Integración en Header
El componente `Header.tsx` usa el hook para mostrar:
- Badge con contador de no leídas
- Dropdown con lista de notificaciones
- Botones de acción (marcar leída, eliminar)
- Indicadores visuales por prioridad

## Comportamiento

### Polling
- **Intervalo**: 30 segundos
- **Estrategia**: El hook `useNotifications` ejecuta polling mientras el componente está montado
- **Optimización**: No se hace polling si el dropdown está cerrado (TODO)

### Retención
- **Política**: 1 día o hasta eliminación manual
- **Limpieza automática**: Cada hora via `NotificationCleanupService`
- **Notificaciones leídas**: Se eliminan igual después de 1 día

### Generación Automática
Las notificaciones se generan automáticamente en los siguientes casos:

1. **Venta creada**: En `SalesController.Create()`
2. **Stock bajo**: Via endpoint `POST /api/notifications/check-low-stock`
   - Se puede invocar manualmente o programar
   - Evita duplicados (no crea si ya existe una similar en 24h)

### Multitenancy
- Todas las consultas filtran por `TenantId`
- Las notificaciones son aisladas por tenant
- `UserId` null indica broadcast para todo el tenant

## Configuración

### Variables de Entorno
Ninguna específica para notificaciones (usa configuración general de la API).

### Personalización
Para cambiar el intervalo de polling, modificar en `useNotifications.ts`:
```typescript
const POLL_INTERVAL = 30000; // milisegundos
```

Para cambiar el período de retención, modificar en `NotificationCleanupService.cs`:
```csharp
private readonly TimeSpan _retentionPeriod = TimeSpan.FromDays(1);
```

## Extensiones Futuras

- [ ] WebSocket/SignalR para tiempo real
- [ ] Preferencias de notificación por usuario
- [ ] Notificaciones push (PWA)
- [ ] Notificaciones por email
- [ ] Agrupación de notificaciones similares
- [ ] Sonidos de alerta configurable
- [ ] Centro de notificaciones expandido

## Archivos Relacionados

### Backend
- `Sales.Domain/Entities/Notification.cs`
- `Sales.Application/Notifications/DTOs/NotificationDtos.cs`
- `Sales.Application/Notifications/INotificationService.cs`
- `Sales.Application/Notifications/NotificationService.cs`
- `Sales.Api/Controllers/NotificationsController.cs`
- `Sales.Api/NotificationCleanupService.cs`
- `Sales.Infrastructure/Persistence/SalesDbContext.cs`

### Frontend
- `src/api/notificationsApi.ts`
- `src/hooks/useNotifications.ts`
- `src/components/layout/Header.tsx`
