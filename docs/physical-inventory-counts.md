# Tomas físicas de inventario en Vite

Fecha: 2026-08-08

## Alcance

La ruta `/inventory-counts` permite iniciar, continuar y consultar tomas físicas por almacén. La captura usa el agregado existente de `Sales.Api`; no calcula saldos en el navegador ni crea ajustes automáticos.

## Flujo operativo

1. Abrir **Catálogo e inventario > Tomas de inventario**.
2. Seleccionar **Nueva toma**, un almacén activo y notas opcionales.
3. Registrar una cantidad entera igual o mayor que cero para cada producto. Cero confirma que no existe mercadería física.
4. Buscar por nombre, SKU o código de barras y guardar con el botón de cada línea o la tecla Enter.
5. Cuando no queden pendientes, completar la toma para generar el reporte de conciliación.

Solo existe un borrador por almacén. Si se inicia otra toma en el mismo almacén, la API devuelve el borrador vigente y la SPA lo reanuda.

## Concurrencia y seguridad

- La SPA envía la última `inventoryCountVersion` en cada mutación y reemplaza su estado con la respuesta del servidor.
- Ante un conflicto HTTP 409, recarga la toma y pide revisar nuevamente la cantidad o transición.
- `Products.View` permite consultar; `Products.Manage` habilita creación, captura, cierre y cancelación.
- El tenant procede exclusivamente del JWT y del contexto de la API.

## Conciliación

El cierre muestra existencias del sistema, conteo físico, conteo ajustado, diferencias, faltantes, sobrantes y productos con movimientos durante el recorrido. Completar o cancelar no modifica stock. Una regularización posterior debe ser una operación explícita y auditada.

## Archivos

- `src/api/inventoryCountsApi.ts`: contratos y cliente HTTP.
- `src/pages/InventoryCountsPage.tsx`: historial, filtro e inicio/reanudación.
- `src/pages/InventoryCountDetailPage.tsx`: captura y reporte.
- `src/App.tsx` y `src/components/app-sidebar.tsx`: rutas y navegación.
