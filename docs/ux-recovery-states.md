# Estados vacíos y confirmaciones

## Objetivo

Reducir fricción en flujos administrativos reemplazando confirmaciones nativas del navegador y estados vacíos pasivos por componentes consistentes con acciones claras.

## Cambios aplicados

- Se creó `ConfirmDialog` en `src/components/shared/ConfirmDialog.tsx`.
- `Clientes`, `CRM` y `Ventas` ya no dependen de `confirm()` o `alert()` para acciones críticas frecuentes.
- Los estados vacíos de `Clientes` ahora muestran CTA contextual:
  - crear cliente si no existe ninguno
  - limpiar búsqueda si no hubo coincidencias
- `Ventas` muestra recuperación directa cuando no hay resultados o no hay datos para el reporte.
- `CRM` permite volver a configurar listas visibles desde el propio estado vacío del tablero.

## Regla UX

Cuando una pantalla no tenga resultados, debe ofrecer una acción inmediata y válida:

- crear
- limpiar filtros
- configurar
- volver al flujo principal

Evitar mensajes vacíos sin salida operativa.
