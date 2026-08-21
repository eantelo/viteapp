# Kanban: conversión de lead a cliente

## Comportamiento
Al mover un lead a la columna **Ganado**, la interfaz envía `convertToCustomer = true` sin pedir una confirmación redundante. El backend vincula primero un cliente existente que coincida de forma segura y solo crea uno si no existe.

## Criterios
- Solo se solicita conversión automática cuando el lead no tiene `customerId`.
- Un lead ganado siempre queda vinculado a un cliente.

## Nota de usabilidad
- Si el drop no detecta un objetivo exacto, se usa la última columna sobrevolada para completar el movimiento.

## Archivo relevante
- `src/components/crm/KanbanBoard.tsx`

## API utilizada
- `PATCH /api/leads/{id}/status`

## Publicación
- Ejecutar el build de producción y publicar el contenido actualizado de `dist`. Un paquete anterior puede conservar el diálogo obsoleto **Mover sin crear cliente** aunque el código fuente ya esté corregido.
