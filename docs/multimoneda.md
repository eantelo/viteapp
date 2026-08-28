# Multimoneda en Sales.Web

Sales.Web obtiene de `Sales.Api` la moneda contable, la moneda operativa y las monedas habilitadas. La preferencia global de visualización se guarda localmente por tenant; solo afecta la presentación y nunca sustituye la conversión autoritativa del servidor.

## Flujos implementados

- Administración de monedas habilitadas, moneda operativa e historial de tasas.
- Resumen de cobertura vigente por moneda, alerta de monedas habilitadas sin tasa utilizable y modo de solo lectura para usuarios sin `Settings.Manage`.
- Alta de cotizaciones con vista previa, validación local de tasa, fechas y solapamientos antes de invocar la API.
- Filtros por moneda y estado (`vigente`, `programada`, `vencida` o `cancelada`) con fechas presentadas en la hora local del usuario.
- Confirmación explícita antes de cancelar una cotización futura; la acción conserva el historial y la auditoría.
- Selector de moneda en POS, pagos mixtos y confirmación obligatoria cuando la API responde `409 currency_quote_stale`.
- Selector de moneda en **Nueva Orden de Venta** (`/sales/new`): usa únicamente monedas habilitadas, cotiza para la fecha de la orden, reexpresa los precios desde su valor contable y conserva `currencyCode` y `exchangeRateId` al guardar. Las órdenes existentes muestran su moneda congelada en modo de solo lectura.
- Cartera con deuda original, equivalente contable, pagos cruzados y diferencia cambiaria.
- Compras y pedidos retenidos con recotización antes de confirmar o reanudar.
- Reportes con total oficial contable y equivalente de visualización secundario cuando existe cotización.

Si la API responde `422 currency_rate_unavailable`, la interfaz muestra que la conversión no está disponible y no usa una tasa anterior. La fórmula, reglas de redondeo, contratos y operación se documentan en `../../docs/multimoneda.md`.

En órdenes manuales, guardar y aprobar permanecen bloqueados mientras se obtiene la cotización o cuando no existe una tasa vigente. Si la API devuelve `409 currency_quote_stale`, la pantalla obtiene la nueva cotización, recalcula los importes y exige que el operador confirme nuevamente. La aprobación de una orden nueva envía venta y pago juntos para que la API los persista atómicamente.

## Uso desde Configuración

1. En **Monedas Disponibles**, habilite las monedas que la organización utilizará. La moneda contable y la operativa predeterminada permanecen protegidas.
2. Revise la alerta **Faltan Cotizaciones Vigentes**. Una moneda habilitada sin tasa vigente no puede usarse para convertir importes.
3. En **Registrar Nueva Cotización**, elija la moneda origen e ingrese la equivalencia contra la moneda contable. Las fechas se capturan en hora local y se envían a la API como UTC.
4. Use la vista previa para confirmar el sentido de la tasa antes de guardarla: `1 moneda origen = tasa × moneda contable`.
5. Consulte el historial por moneda o estado. Solo las tasas futuras y nunca utilizadas muestran la acción **Cancelar**.

La moneda operativa predeterminada se selecciona exclusivamente entre monedas habilitadas. El selector del encabezado guarda por tenant la preferencia de visualización y muestra tanto el código como el nombre de la moneda; no modifica los importes contables persistidos.
