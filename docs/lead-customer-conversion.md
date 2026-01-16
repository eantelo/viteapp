# Kanban: conversión de lead a cliente

## Comportamiento
Al mover un lead a la columna **Ganado**, la interfaz pregunta si deseas crear un cliente con los datos del lead. Si confirmas, se envía `convertToCustomer = true` en la actualización de estado.

## Criterios
- Solo se pregunta cuando el lead no tiene `customerId`.
- Si el usuario rechaza la conversión, el lead permanece en **Ganado** sin cliente asociado.

## Nota de usabilidad
- Si el drop no detecta un objetivo exacto, se usa la última columna sobrevolada para completar el movimiento.

## Archivo relevante
- `src/components/crm/KanbanBoard.tsx`

## API utilizada
- `PATCH /api/leads/{id}/status`
