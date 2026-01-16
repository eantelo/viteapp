# Dashboard renovado

## Objetivo

Actualizar `src/pages/DashboardPage.tsx` para ofrecer un panel de análisis de ventas con jerarquía visual precisa y una estética minimalista orientada a confianza. Se prioriza una interfaz de alta densidad, monocroma y con énfasis en datos, alineada con los principios de diseño del sistema.

## Secciones principales

1. **Encabezado + filtros**
   - Título, subtítulo y selector de rango de fechas integrados en una sola franja.
2. **Tarjetas de métricas**
   - Grid responsivo con totales, transacciones, ticket promedio y métodos de pago.
3. **Desglose por método**
   - Lista con porcentaje y barra de distribución por canal de pago.
4. **Ventas recientes**
   - Card con actividad reciente y valores en formato monetario.

## Comportamiento

- El selector de rango actualiza `dateRange` y recarga estadísticas y ventas recientes.
- Las tarjetas muestran skeletons durante la carga y el layout conserva estabilidad.
- Los valores numéricos usan tipografía monoespaciada para alineación visual.

## Acciones del usuario

- **Filtrar periodo**: selecciona un preset o define fechas manuales en el selector.
- **Explorar ventas**: revisa operaciones recientes desde el panel principal.

## Requisitos de estilo

- Dirección visual: **sofisticación y confianza** con base fría y monocromática.
- Profundidad: **bordes sutiles sin sombras** (`border-border/60`, `shadow-none`).
- Tipografía: títulos `tracking-tight` y números en `font-mono tabular-nums`.
- Iconografía: **Phosphor Icons** con contenedores discretos.
- Espaciado: escala de 4px (`p-6`, `gap-6`).

## Próximos pasos sugeridos

1. Incorporar gráficos analíticos con estilos monocromos (líneas o barras neutras).
2. Añadir un panel de tendencias semanales con comparación porcentual.
3. Habilitar navegación hacia el listado completo de ventas.
