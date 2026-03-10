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

### `src/pages/CrmPage.tsx`
- Se añadió un contenedor mobile-first con `min-h-dvh`, `overflow-x-hidden` y espaciado seguro para evitar clipping vertical/horizontal dentro de `DashboardLayout`.
- La barra de acciones del header ahora se reorganiza en móvil: controles secundarios en grid de 2 columnas, botón **Nuevo Lead** a ancho completo y altura táctil de 44px (`h-11`).
- Los textos de botones se acortan en móvil (`Listas`, `Compacto ON/OFF`, `Volver a auto`) para evitar wrapping incómodo y mantener los iconos visibles.
- La búsqueda usa placeholder corto en móvil y queda fija arriba del contenido (`sticky`) para no perderla al desplazarse entre columnas.
- Se añadió una pista visual bajo la búsqueda indicando que el tablero se navega con deslizamiento horizontal, junto con el número de listas visibles.

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

1. **Header en mobile (390px)**: los botones del header deben apilarse sin overflow; `Nuevo Lead` debe ocupar todo el ancho y ser fácil de tocar.
2. **Búsqueda sticky**: hacer scroll vertical y confirmar que el buscador permanece visible arriba del tablero.
3. **Scroll horizontal**: deslizar horizontalmente → las columnas deben snappear una a una.
4. **Peek de columna**: la columna siguiente debe asomarse ~50px al margen derecho, indicando que hay más contenido.
5. **Botones visibles**: sin hacer hover, los botones edit/delete/Trello deben ser visibles en cada tarjeta.
6. **DnD en mobile**: mantener presionado un lead > 300ms debe iniciar el arrastre (PointerSensor con distance: 6).
7. **Desktop sin cambios**: en viewport ≥1024px el layout debe mantenerse igual en estructura y comportamiento.

## Resultado esperado

- Mobile: header ordenado y táctil, búsqueda siempre accesible, tablero tipo carrusel horizontal con snap y lead cards con touch targets adecuados.
- Desktop: sin cambios visuales, comportamiento idéntico al original.
