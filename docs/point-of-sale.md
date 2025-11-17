# Punto de Venta (POS)

La página `PointOfSalePage` introduce una experiencia de caja rápida dentro del dashboard protegido (`/pos`). Reutiliza el layout principal (`DashboardLayout`) y componentes de shadcn/ui para entregar una UI responsiva dividida en dos columnas:

1. **Columna izquierda**
   - Tarjeta de búsqueda/escaneo con input principal, botón "Agregar" y lista de sugerencias en vivo.
   - Tarjeta "Orden actual" que dibuja la tabla de líneas con controles de cantidad y acciones por ítem.
2. **Columna derecha**
   - Selección de cliente activo con botón para recargar.
   - Resumen de totales (subtotal, descuento editable, IVA 8.25 %, total).
   - Acciones rápidas: poner en espera, limpiar, reanudar y cobrar.

## Integraciones con `Sales.Api`

La página se basa en el nuevo hook `usePointOfSale`, que encapsula la comunicación con la API oficial usando el `apiClient` autenticado:

| Acción | Endpoint | Detalles |
| --- | --- | --- |
| Buscar productos | `GET /api/products?search=` | Peticiones con `AbortSignal` para soportar debounce. |
| Escanear código | `GET /api/products/by-barcode/{barcode}` | Intenta coincidencia exacta antes de degradar a búsqueda textual. |
| Listar clientes | `GET /api/customers` | Solo clientes activos aparecen en el selector. |
| Registrar venta | `POST /api/sales` | Envía fecha actual, `customerId` obligatorio y líneas con `productId`+`quantity`. |

> **Nota:** el hook evita bloquear la UI manteniendo estados de carga independientes (`isSearchLoading`, `isLookupPending`, `isSubmitting`). Las acciones optimistas (agregar, modificar, hold/clear) solo actualizan estado local y nunca congelan el grid principal.

## Hook `usePointOfSale`

Ubicación: `src/hooks/usePointOfSale.ts`

Responsabilidades clave:

- Gestionar el estado de la orden (`items`, `discount`, `heldOrder`).
- Sincronizar clientes activos (`reloadCustomers`).
- Calcular totales derivados (`subtotal`, `appliedDiscount`, `taxAmount`, `total`).
- Resolver productos por código o búsqueda, limitando cantidades según stock.
- Exponer `submitSale` y banderas de carga para que la página controle toasts y deshabilite botones.

Se puede inyectar un callback opcional `onSaleCreated` (usado en la página para mostrar un toast de éxito cuando `createSale` responde).

### Novedades (Persistencia y Configuración)
- Órdenes en espera persistidas: ahora `holdOrder` serializa un snapshot a `localStorage` con scope por tenant/usuario. Clave: `pos:heldOrder:{tenantId}:{userId}`. Tras reanudar, se elimina del storage.
- Impuesto configurable por tenant: `taxRate` se persiste por tenant en `localStorage` (clave `pos:taxRate:{tenantId}`) y puede inicializarse desde la variable de entorno `VITE_DEFAULT_TAX_RATE` (por defecto 0.0825). La UI permite editar el porcentaje.

## Componentes y patrones reusados

- **shadcn/ui**: `Card`, `Table`, `Select`, `Badge`, `Input`, `Button`, `Avatar`, `Skeleton`, `Separator` y `Spinner` garantizan estilo consistente.
- **Sidebar**: se añadió la nueva entrada "Punto de Venta" (`IconCashRegister`) en `app-sidebar.tsx` para exponer `/pos` desde la navegación principal.
- **Rutas**: `App.tsx` declara `<Route path="/pos" element={<PointOfSalePage />}>` dentro del `ProtectedRoute`, alineado con las otras páginas del dashboard.

## Futuras mejoras sugeridas

1. (Opcional) Persistencia de múltiples órdenes en espera: endpoint dedicado en API para manejar varias órdenes con nombre/fecha/total y listado.
2. Descuentos avanzados: cupones y combos validados server-side.
3. Selección de cliente rápida: buscador incremental/modal para tenants con >100 clientes.
4. Pagos: integrar pasarelas (Stripe/MercadoPago) y flujo de cambio en efectivo.

Esta documentación debe acompañar cualquier cambio futuro en el flujo POS para mantener alineados al frontend y a `Sales.Api`.
