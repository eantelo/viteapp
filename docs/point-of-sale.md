# Punto de Venta (POS)

La página `PointOfSalePage` introduce una experiencia de caja rápida dentro del dashboard protegido (`/pos`). Reutiliza el layout principal (`DashboardLayout`) y componentes de shadcn/ui para entregar una UI responsiva dividida en dos columnas:

1. **Columna izquierda**
   - Tarjeta de búsqueda/escaneo con input principal, botón "Agregar" y lista de sugerencias en vivo.
   - Tarjeta "Orden actual" que dibuja la tabla de líneas con controles de cantidad y acciones por ítem.
2. **Columna derecha**
   - Búsqueda y creación de cliente con input de búsqueda, lista filtrada y botón "Nuevo" que abre modal.
   - Resumen de totales (subtotal, descuento editable, total — impuestos NO incluidos en el Punto de Venta).
   - **Método de pago**: selector de método (Efectivo, Tarjeta, Vale, Transferencia, Otro), campo de monto recibido (solo para efectivo), referencia opcional, y cálculo de cambio en tiempo real.
   - Acciones rápidas: poner en espera, limpiar, reanudar y cobrar.

## Integraciones con `Sales.Api`

La página se basa en el nuevo hook `usePointOfSale`, que encapsula la comunicación con la API oficial usando el `apiClient` autenticado:

| Acción | Endpoint | Detalles |
| --- | --- | --- |
| Buscar productos | `GET /api/products?search=` | Peticiones con `AbortSignal` para soportar debounce. |
| Escanear código | `GET /api/products/by-barcode/{barcode}` | Intenta coincidencia exacta antes de degradar a búsqueda textual. |
| Listar clientes | `GET /api/customers` | Solo clientes activos aparecen en el selector. |
| Crear cliente | `POST /api/customers` | Modal `CustomerFormDialog` para capturar datos básicos. |
| Registrar venta | `POST /api/sales` | Envía fecha actual, `customerId` obligatorio, líneas con `productId`+`quantity`, y **pagos** con método, monto, monto recibido (opcional) y referencia. |

> **Nota:** el hook evita bloquear la UI manteniendo estados de carga independientes (`isSearchLoading`, `isLookupPending`, `isSubmitting`). Las acciones optimistas (agregar, modificar, hold/clear) solo actualizan estado local y nunca congelan el grid principal.

## Hook `usePointOfSale`

Ubicación: `src/hooks/usePointOfSale.ts`

Responsabilidades clave:

- Gestionar el estado de la orden (`items`, `discount`).
- Gestionar el estado de pago (`paymentMethod`, `amountReceived`, `paymentReference`, `change`).
- Sincronizar clientes activos (`reloadCustomers`), con búsqueda local (`customerSearchTerm`, `filteredCustomers`) tolerante a campos opcionales (email/teléfono vacíos).
- Calcular totales derivados (`subtotal`, `appliedDiscount`, `taxAmount`, `total`, `change`).
   Nota: en la configuración actual del Punto de Venta (`usePointOfSale`), los impuestos se pueden omitir estableciendo `includeTax: false`.
- Resolver productos por código o búsqueda, limitando cantidades según stock.
- Crear ventas con pagos incluidos.
- Exponer `submitSale` y banderas de carga para que la página controle toasts y deshabilite botones.

Se puede inyectar un callback opcional `onSaleCreated` (usado en la página para mostrar un toast de éxito cuando `createSale` responde).

## Componentes y patrones reusados

- **shadcn/ui**: `Card`, `Table`, `Select`, `Badge`, `Input`, `Button`, `Avatar`, `Skeleton`, `Separator` y `Spinner` garantizan estilo consistente.
- **Sidebar**: se añadió la nueva entrada "Punto de Venta" (`IconCashRegister`) en `app-sidebar.tsx` para exponer `/pos` desde la navegación principal.
- **Rutas**: `App.tsx` declara `<Route path="/pos" element={<PointOfSalePage />}>` dentro del `ProtectedRoute`, alineado con las otras páginas del dashboard.

## Futuras mejoras sugeridas

1. **Persistencia de órdenes en espera**: actualmente se almacenan en memoria; podría serializarse en `localStorage` o en un endpoint dedicado.
2. **Descuentos avanzados**: hoy es un campo manual. Se puede extender para soportar cupones o combos validados server-side.
3. **Selección de cliente rápida**: ✅ **IMPLEMENTADO** - Búsqueda local con filtro por nombre/email y creación inline.
4. **Cambio de cliente**: ✅ **IMPLEMENTADO** - Funcionalidad para remover/cambiar cliente seleccionado. Ver [documentación detallada](./pos-remove-customer-feature.md).
5. **Pagos**: ✅ **IMPLEMENTADO** - Selector de método de pago con cálculo de cambio para efectivo y referencias opcionales.

Esta documentación debe acompañar cualquier cambio futuro en el flujo POS para mantener alineados al frontend y a `Sales.Api`.
