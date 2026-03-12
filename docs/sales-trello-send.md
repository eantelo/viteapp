# Ventas: enviar a Trello

## Qué se agregó
En `Gestión de Ventas` ahora hay una acción para **enviar una venta a Trello** usando los datos completos de la orden.

## Experiencia de usuario
- Acción disponible en tarjetas móviles y tabla desktop.
- Solicita confirmación antes de enviar.
- Mientras se procesa, el botón queda deshabilitado y muestra spinner.
- Al completarse, muestra toast de éxito o error.

## Endpoint consumido
- `POST /api/sales/{id}/send-to-trello`

## Datos visibles en Trello
- Número de venta.
- Cliente y sus datos de contacto.
- Total y estado de la venta.
- Ítems vendidos.
- Pagos registrados.