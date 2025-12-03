La tabla de estados implementada:

| Estado | Valor | Editable | Stock | Acciones disponibles | Transiciones posibles |
|--------|-------|----------|-------|----------------------|-----------------------|
| Pending | 0 | ✅ Sí | Reservado | Guardar, Borrar | → Completed (vía POS) |
| Completed | 1 | ❌ No | Descontado | Cerrar, Reembolsar | → Closed, → Refunded |
| Closed | 2 | ❌ No | — | Ninguna (inmutable) | — |
| Cancelled | 3 | ❌ No | Devuelto | Ninguna (interno) | — |
| Refunded | 4 | ❌ No | Devuelto | Ninguna | — |

## Notas importantes

- **Pending → Completed**: Es la única transición válida desde Pending. Esta transición ocurre únicamente cuando se procesa un pago en el POS.
- Las acciones disponibles en **Pending** son únicamente:
  - **Guardar**: Permite modificar los datos de la orden (cliente, productos, cantidades).
  - **Borrar**: Elimina la orden permanentemente.
- El estado **Cancelled** existe pero no es accesible directamente desde la UI; se reserva para usos internos o procesos específicos del sistema.