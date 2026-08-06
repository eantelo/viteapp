# Multimoneda en Sales.Web

Sales.Web obtiene de `Sales.Api` la moneda contable, la moneda operativa y las monedas habilitadas. La preferencia global de visualización se guarda localmente por tenant; solo afecta la presentación y nunca sustituye la conversión autoritativa del servidor.

## Flujos implementados

- Administración de monedas habilitadas, moneda operativa e historial de tasas.
- Selector de moneda en POS, pagos mixtos y confirmación obligatoria cuando la API responde `409 currency_quote_stale`.
- Cartera con deuda original, equivalente contable, pagos cruzados y diferencia cambiaria.
- Compras y pedidos retenidos con recotización antes de confirmar o reanudar.
- Reportes con total oficial contable y equivalente de visualización secundario cuando existe cotización.

Si la API responde `422 currency_rate_unavailable`, la interfaz muestra que la conversión no está disponible y no usa una tasa anterior. La fórmula, reglas de redondeo, contratos y operación se documentan en `../../docs/multimoneda.md`.
