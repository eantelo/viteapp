# CRM Kanban: enviar prospecto a Trello

## Qué se agregó
En el tablero Kanban de prospectos se agregó una opción por tarjeta para **enviar la tarjeta a Trello**.

## Experiencia de usuario
- En cada tarjeta aparece un botón de envío (ícono avión de papel).
- Al hacer clic:
  - Se solicita confirmación antes de enviar.
  - El botón de esa tarjeta queda deshabilitado mientras se procesa el envío.
  - Se muestra un ícono de carga en la tarjeta en envío para evitar doble clic.
  - Se llama al endpoint `POST /api/leads/{id}/send-to-trello`.
  - Se muestra notificación de éxito o error.

## Consideraciones
- El destino de Trello se define en backend con `Integrations:Trello:InboundEmail`.
- No se expone el correo destino en el frontend.

## Archivos frontend
- `src/components/crm/LeadCard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/KanbanBoard.tsx`
- `src/pages/CrmPage.tsx`
- `src/api/leadsApi.ts`
