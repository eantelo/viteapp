# Sales Page — Mobile Optimization

## Problema

La página de Gestión de Ventas (`/sales`) presentaba varios problemas de usabilidad en dispositivos móviles:

1. **Panel de filtros siempre visible**: ocupaba ~400px de alto antes de que el usuario pudiera ver la tabla de ventas.
2. **Tabla con 9 columnas**: se desbordaba horizontalmente y era ilegible en pantallas pequeñas.
3. **Botones de acciones reducidos**: los icon buttons del desktop eran demasiado pequeños para toque táctil.
4. **Textos en header largos**: botones con texto completo se desbordaban.

## Causa raíz

- Diseño exclusivamente desktop (`lg:grid-cols-[320px_1fr]`) sin adaptación para viewport <768px.
- Tabla HTML no apta para lectura vertical en móvil.
- Sin alternativa de presentación (cards) para datos tabulares en pantallas angostas.

## Cambios aplicados

### `src/pages/SalesPage.tsx`

| Patrón | Cambio |
|--------|--------|
| P2 Layout | Grid `lg:grid-cols-[320px_1fr]` mantiene desktop; en móvil apila verticalmente |
| P2 Layout | Panel de filtros colapsable con botón "Filtros" (`Funnel` icon) visible solo en móvil (`lg:hidden`) |
| P4 Touch Cards | Nueva vista de tarjetas (`md:hidden`) reemplaza la tabla en móvil — cada venta se muestra como una card con: orden#, total, cliente, fecha, estado, método de pago, productos |
| P4 Touch Cards | Botones de acción con `min-h-11 min-w-11` (44px touch target WCAG) |
| P6 Interactions | Acciones secundarias de ventas "Completed" agrupadas en menú contextual (`DotsThreeVertical`) para no saturar la card |
| P8 Accessibility | Todos los icon buttons tienen `aria-label` + `title` |
| P3 Header | Descripción de header oculta en móvil; textos de botones ocultos con `hidden sm:inline`; "Nueva Orden" compacto |

### `src/components/sales/SalesStatisticsCards.tsx`

| Patrón | Cambio |
|--------|--------|
| P2 Layout | Grid cambiado a `grid-cols-2` en móvil (2×2 en lugar de 1×4), `gap-3` más compacto |
| P3 Header | Descripción (`CardDescription`) e iconos ocultos con `hidden sm:block` / `hidden sm:flex` en móvil |
| Tipografía | Valores principales: `text-xl sm:text-2xl` para mejor legibilidad sin desbordar |

## Pruebas manuales sugeridas

### Móvil (390×844)
- [ ] Scroll vertical completo — no hay contenido cortado
- [ ] No hay scroll horizontal
- [ ] Botón "Filtros" muestra/oculta el panel correctamente
- [ ] Cards de ventas muestran orden#, total, cliente, fecha, estado
- [ ] Botones de acción son tocables (≥44px)
- [ ] Menú "..." en ventas completadas muestra Repetir/Cerrar/Reembolsar
- [ ] Estadísticas se ven en grid 2×2
- [ ] "Nueva Orden" funciona como esperado

### Desktop (≥1024px)
- [ ] Layout sin cambios: filtros a la izquierda, tabla a la derecha
- [ ] Tabla completa con todas las columnas
- [ ] No aparece botón "Filtros"
- [ ] No aparecen mobile cards
- [ ] Estadísticas en grid 1×4

## Resultado esperado

La página de ventas es completamente funcional y legible en dispositivos móviles sin comprometer el layout de desktop existente.
