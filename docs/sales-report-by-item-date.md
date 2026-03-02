# Reporte de Ventas por Ítem y Fecha (SalesPage)

## Objetivo

Mostrar en pantalla, desde la página de ventas (`/sales`), un reporte consolidado de ventas por producto y por fecha.

## Implementación

Archivo modificado:

- `src/pages/SalesPage.tsx`

Se agregó una nueva sección en la parte inferior de la pantalla:

- **Título**: `Reporte de Ventas por Ítem y Fecha`
- **Fuente de datos**: ventas filtradas actualmente (`filteredSales`)
- **Agrupación**:
  - Fecha (día local en formato `YYYY-MM-DD`)
  - Producto (`productId`)
- **Métricas por grupo**:
  - `quantity` (suma de cantidades)
  - `amount` (suma de `quantity * price`)

## Comportamiento funcional

- El reporte se actualiza automáticamente cuando cambian:
  - rango de fechas,
  - estado,
  - búsqueda,
  - y demás filtros aplicados en la página.
- Si no hay resultados, muestra estado vacío.
- Respeta estado de carga (`loading`) con spinner.

## UI/UX

- **Desktop**: tabla con columnas `Fecha`, `Ítem`, `Cantidad`, `Importe`.
- **Mobile**: tarjetas por registro para mejor legibilidad.
- Mantiene formato monetario existente (`formatCurrency`).

## Notas técnicas

- Se usa `useMemo` para evitar recálculos innecesarios.
- La fecha de agrupación se construye con componentes locales (`getFullYear/getMonth/getDate`) para evitar desfases por zona horaria.

## Resultado

El usuario puede ingresar a **Ventas** y ver en la misma pantalla el reporte de ventas por ítem por fecha, sin navegar a otra página ni exportar archivos.
