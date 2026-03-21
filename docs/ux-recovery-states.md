# Estados vacíos y confirmaciones

## Objetivo

Reducir fricción en flujos administrativos reemplazando confirmaciones nativas del navegador y estados vacíos pasivos por componentes consistentes con acciones claras.

## Cambios aplicados

- Se creó `ConfirmDialog` en `src/components/shared/ConfirmDialog.tsx`.
- `Clientes`, `CRM` y `Ventas` ya no dependen de `confirm()` o `alert()` para acciones críticas frecuentes.
- `Compras`, `Usuarios`, `Proveedores`, `Almacenes` y `Traslados` ahora usan el mismo patrón de confirmación con estado de carga y copy contextual.
- `Usuarios` ya no usa `window.prompt` para reseteo de contraseña; ahora abre un diálogo propio con validación mínima y acción explícita.
- Los estados vacíos de `Clientes` ahora muestran CTA contextual:
  - crear cliente si no existe ninguno
  - limpiar búsqueda si no hubo coincidencias
- `Ventas` muestra recuperación directa cuando no hay resultados o no hay datos para el reporte.
- `CRM` permite volver a configurar listas visibles desde el propio estado vacío del tablero.
- `Usuarios`, `Proveedores` y `Almacenes` ya no muestran tablas vacías pasivas:
  - limpiar búsqueda si no hubo coincidencias
  - crear registro si aún no existe ninguno
- `Compras` y `Traslados` ahora muestran recuperación contextual:
  - limpiar filtros cuando el resultado es cero por búsqueda o estado
  - crear el primer registro cuando todavía no existe historial
- Al mover un lead a `Ganado`, el CRM ya no usa `confirm()` del navegador:
  - `Crear cliente y mover`
  - `Mover sin crear cliente`
- Las acciones destructivas pendientes en este frente ya no dependen del navegador para confirmar:
  - cancelar orden de compra
  - activar o desactivar usuario
  - eliminar proveedor
  - eliminar almacén
  - cancelar traslado
  - eliminar producto desde detalle
  - eliminar orden de venta desde edición

## Regla UX

Cuando una pantalla no tenga resultados, debe ofrecer una acción inmediata y válida:

- crear
- limpiar filtros
- configurar
- volver al flujo principal

Evitar mensajes vacíos sin salida operativa.
