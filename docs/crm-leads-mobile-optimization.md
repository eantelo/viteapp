# CRM Leads — Optimización Mobile-First

## Problema encontrado

La página de Pipeline de Leads (`/crm`) no era usable en dispositivos móviles por tres razones principales:

1. **Kanban sin scroll controlado**: El tablero usa `inline-flex min-w-max` (7 columnas × 384px = ~2.7 KB de ancho) que desbordaba en el contenedor de `DashboardLayout` sin scroll snap ni indicador visual de navegación horizontal.

2. **Columnas demasiado anchas en mobile**: `KanbanColumn` tenía `w-96` fijo (384px). En un iPhone 14 (~390px) cada columna ocupaba prácticamente toda la pantalla sin mostrar que había más columnas siguientes.

3. **Botones de acción invisibles en touch**: Los botones de editar/eliminar/Trello usaban `opacity-0 group-hover:opacity-100`. En pantallas táctiles no existe el estado hover, por lo que los botones eran completamente invisibles.

## Root cause

- Diseño orientado exclusivamente a desktop con hover states y columnas de ancho fijo.
- No se aplicó el patrón P1 (scroll), P3 (header), P4 (touch targets) del skill `mobile-first`.

## Cambios aplicados

### `src/components/crm/KanbanBoard.tsx`
- Añadido contenedor `div.overflow-x-auto.snap-x.snap-mandatory.scroll-smooth` envolviendo el `motion.div` con las columnas.
- El tablero ahora tiene scroll horizontal contenido con snapping column-by-column.
- Añadido `-mx-3 px-3 md:mx-0 md:px-0` para que el scroll llegue a los bordes de la pantalla en mobile sin afectar desktop.

### `src/components/crm/KanbanColumn.tsx`
- Cambiado `w-96` → `w-[82vw] sm:w-80 md:w-96 min-w-[260px]`.
  - En móvil 390px: columna ~320px → se asoma el comienzo de la siguiente columna (comportamiento de carrusel).
  - Tablet: 320px fijo.
  - Desktop: 384px fijo (sin cambios).
- Añadido `shrink-0 snap-start snap-always` para que cada columna sea un punto de snap.

### `src/components/crm/LeadCard.tsx`
- Botones ahora siempre visibles en mobile: `opacity-100 md:opacity-0 md:group-hover:opacity-100`.
- Touch targets aumentados en mobile: `p-2 md:p-1.5` (≥ requisito WCAG 44px).
- `active:scale-95` en todos los botones para feedback táctil.
- Añadido `aria-label` a los botones de editar y eliminar que no lo tenían.

## Tests manuales sugeridos

1. **Scroll horizontal**: Abrir `/crm` en mobile (390px), deslizar horizontalmente → las columnas deben snappear una a una.
2. **Peek de columna**: La columna siguiente debe asomarse ~50px al margen derecho, indicando que hay más contenido.
3. **Botones visibles**: Sin hacer hover, los botones edit/delete/Trello deben ser visibles en cada tarjeta.
4. **DnD en mobile**: Mantener presionado un lead > 300ms debe iniciar el arrastre (PointerSensor con distance: 6).
5. **Desktop sin cambios**: En viewport ≥1024px el layout debe ser idéntico al anterior.

## Resultado esperado

- Mobile: tablero tipo carrusel horizontal con snap, botones accesibles, lead cards con touch targets adecuados.
- Desktop: sin cambios visuales, comportamiento idéntico al original.
