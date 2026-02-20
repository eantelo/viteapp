# Página de Creación/Edición de Ventas (SaleUpsertPage)

## Descripción

La página `SaleUpsertPage` permite crear y editar órdenes de venta en una interfaz de página completa, reemplazando el antiguo diálogo modal (`SaleFormDialog`). Este cambio mejora la experiencia del usuario al proporcionar más espacio de trabajo y una navegación más clara.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/sales/new` | Crear una nueva orden de venta |
| `/sales/:id/edit` | Editar una orden de venta existente |

## Características

### Layout y Anchos (actualizado)
- La página usa un contenedor principal con ancho máximo (`max-w-[1320px]`) para mantener una densidad visual consistente.
- Esto evita que los controles se estiren demasiado en pantallas amplias cuando el asistente AI está cerrado.
- El comportamiento ahora se mantiene estable tanto con el asistente abierto como cerrado.

### Información General
- **Cliente**: Selector de clientes activos (obligatorio)
- **Fecha**: Selector de fecha de la venta (obligatorio)
- **Notas**: Campo de texto opcional para observaciones

### Gestión de Productos
- Selector de productos con precio y stock visible
- Tabla de productos agregados con:
  - Nombre y SKU del producto
  - Controles de cantidad (+/-)
  - Precio unitario
  - Subtotal calculado automáticamente
  - Botón para eliminar productos
- Validación para evitar productos duplicados

### Panel de Resumen
- Conteo de productos y cantidad total
- Total de la orden
- Información del cliente seleccionado
- Acciones rápidas (navegación a POS, Clientes, Productos)

### Método de Pago
- Selector de método de pago para la acción **Aprobar** (Efectivo, Tarjeta, Voucher, Transferencia, Otro)
- Para **Efectivo** permite capturar el **monto recibido** y valida que sea mayor o igual al total
- Para métodos no efectivo permite capturar **referencia** opcional
- Si el monto recibido se deja vacío, se asume el total de la orden

## Estructura del Archivo

```
viteapp/src/pages/SaleUpsertPage.tsx
```

## Componentes Utilizados

- `DashboardLayout`: Layout principal con breadcrumbs
- `PageTransition`: Animaciones de transición de página
- `OrderProductTable`: Tabla de productos de la orden
- Componentes de UI: Card, Button, Input, Select, Label, Textarea

## Flujo de Trabajo

### Crear Nueva Orden
1. Usuario navega a `/sales/new` (botón "Nueva Orden" en SalesPage)
2. Selecciona cliente y fecha
3. Agrega productos desde el selector
4. Ajusta cantidades según necesidad
5. (Opcional) Selecciona **método de pago** si va a aprobar la venta
6. Click en "Guardar" para dejarla pendiente, o "Aprobar" para completarla con pago
7. Redirección a `/sales` con mensaje de éxito

### Editar Orden Existente
1. Usuario navega a `/sales/:id/edit` (botón editar en SalesPage)
2. Se carga la información de la orden existente
3. Modifica los datos necesarios
4. Click en "Actualizar Orden"
5. Redirección a `/sales` con mensaje de éxito

## API Consumida

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/sales/:id` | Obtener datos de orden existente |
| POST | `/api/sales` | Crear nueva orden |
| PUT | `/api/sales/:id` | Actualizar orden existente |
| PUT | `/api/sales/:id/complete` | Completar venta pendiente con pagos |
| GET | `/api/customers` | Listar clientes activos |
| GET | `/api/products` | Listar productos activos |

## Validaciones

- Cliente: Obligatorio
- Fecha: Obligatoria
- Productos: Al menos uno requerido
- No se permiten productos duplicados en la misma orden

## Estados de la Página

1. **Cargando**: Muestra skeleton mientras se obtienen datos (solo edición)
2. **Error**: Muestra mensaje de error con opciones de reintentar
3. **Formulario**: Estado normal con el formulario activo
4. **Guardando**: Botones deshabilitados mientras se procesa

## Animaciones

Utiliza Framer Motion para transiciones suaves:
- Fade in con desplazamiento vertical
- Respeta `prefers-reduced-motion` del usuario
- Animaciones escalonadas por sección

## Integración con SalesPage

El botón "Nueva Orden" en `SalesPage` ahora navega a `/sales/new` en lugar de abrir un diálogo modal. El botón de editar en cada fila navega a `/sales/:id/edit`.

## Ejemplo de Uso

```tsx
// Navegación programática
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Crear nueva orden
navigate('/sales/new');

// Editar orden existente
navigate(`/sales/${saleId}/edit`);
```

## Cambios Respecto al Diálogo Anterior

| Aspecto | SaleFormDialog | SaleUpsertPage |
|---------|----------------|----------------|
| Tipo | Modal/Diálogo | Página completa |
| Espacio | Limitado | Amplio |
| Navegación | Estado local | URL navegable |
| Breadcrumbs | No | Sí |
| Historial | No | Sí (back/forward) |
| Bookmarking | No | Sí |
