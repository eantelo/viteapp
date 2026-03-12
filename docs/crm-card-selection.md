# CRM Kanban: marcado de tarjetas

## Qué se agregó

Se añadió un control de selección en cada tarjeta del tablero Kanban de CRM para poder **marcar o desmarcar leads visualmente**.

## Comportamiento

- Cada `LeadCard` ahora muestra un `checkbox` accesible junto al título.
- Al marcar una tarjeta:
  - la tarjeta se resalta visualmente con borde y fondo suave,
  - el estado se conserva mientras el lead siga cargado en la página,
  - aparece un resumen superior con la cantidad de tarjetas marcadas.
- El resumen muestra:
  - total de tarjetas marcadas,
  - cuántas siguen visibles con el filtro de búsqueda actual,
  - botón `Limpiar selección`.

## Consideraciones de UX

- El `checkbox` detiene la interacción de drag & drop para evitar arrastres accidentales al tocarlo.
- En el `DragOverlay` no se muestra el `checkbox`, para mantener limpia la vista de arrastre.
- Si un lead desaparece del conjunto cargado (por eliminación o recarga), su selección se limpia automáticamente.

## Archivos actualizados

- `src/pages/CrmPage.tsx`
- `src/components/crm/KanbanBoard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/LeadCard.tsx`

## Validación manual sugerida

1. Abrir `/crm`.
2. Marcar una o varias tarjetas usando el `checkbox`.
3. Confirmar que el estilo de la tarjeta cambia al marcarse.
4. Usar la búsqueda y verificar que el resumen distingue entre tarjetas marcadas totales y visibles.
5. Arrastrar una tarjeta no marcada y confirmar que el drag & drop sigue funcionando.
6. Tocar el `checkbox` en móvil y verificar que no inicia arrastre accidental.
