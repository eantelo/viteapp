# Warehouse Inventory Management (Frontend)

Fecha: 2026-02-27

## Resumen

Se agregó soporte frontend para gestión de almacenes y traslados de inventario en `viteapp`, consumiendo endpoints existentes de `Sales.Api` sin cambios en backend.

## Servicios API agregados

- `src/api/warehousesApi.ts`
  - Tipos: `WarehouseDto`, `WarehouseCreateDto`, `WarehouseUpdateDto`, `WarehouseStockProductDto`, `WarehouseStockSummaryDto`
  - Funciones: `getWarehouses`, `getWarehouseById`, `getWarehouseStock`, `createWarehouse`, `updateWarehouse`, `deleteWarehouse`

- `src/api/warehouseTransfersApi.ts`
  - Tipos: `TransferStatus`, `WarehouseTransferItemCreateDto`, `WarehouseTransferCreateDto`, `WarehouseTransferCompleteItemDto`, `WarehouseTransferCompleteDto`, `WarehouseTransferItemDto`, `WarehouseTransferDto`
  - Funciones: `getWarehouseTransfers`, `getWarehouseTransferById`, `createWarehouseTransfer`, `shipWarehouseTransfer`, `completeWarehouseTransfer`, `cancelWarehouseTransfer`

## API de stock extendida

Archivo: `src/api/stockApi.ts`

- Se agregó `Transfer = 5` a `StockTransactionType`.
- Se agregaron campos opcionales de almacén en DTOs de historial/transacciones.
- `StockAdjustmentDto` ahora acepta `warehouseId?`.
- `getCurrentStock` y `getStockHistory` aceptan `warehouseId?` como query param opcional.

## Páginas nuevas

- `src/pages/WarehousesPage.tsx`
  - Listado de almacenes
  - Búsqueda
  - Crear/editar en modal
  - Eliminar
  - Toaster con `sonner`

- `src/pages/WarehouseDetailPage.tsx`
  - Detalle de almacén
  - Resumen de stock (productos distintos, unidades totales, stock bajo)
  - Tabla de productos y stock

- `src/pages/WarehouseTransfersPage.tsx`
  - Tabla de traslados con estatus
  - Crear traslado en modal (origen, destino, notas, items)
  - Acciones por estatus:
    - `Pending`: enviar o cancelar
    - `InTransit`: completar o cancelar
    - `Completed/Cancelled`: solo lectura
  - Modal de completado con captura de cantidades recibidas por item

## Navegación

- Rutas agregadas en `src/App.tsx`:
  - `/warehouses`
  - `/warehouses/:id`
  - `/warehouse-transfers`

- Menú lateral actualizado en `src/components/app-sidebar.tsx`:
  - `Almacenes`
  - `Traslados`

## Diálogos de producto actualizados

- `src/components/products/StockAdjustmentDialog.tsx`
  - Props opcionales: `warehouses?`, `selectedWarehouseId?`
  - Selector de almacén cuando hay datos
  - Envía `warehouseId` en `adjustStock`

- `src/components/products/StockHistoryDialog.tsx`
  - Prop opcional: `warehouseId?`
  - Pasa `warehouseId` a `getStockHistory`
  - Muestra columna de almacén cuando existe `warehouseName`
