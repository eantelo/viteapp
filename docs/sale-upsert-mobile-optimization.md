# Optimización móvil de Nueva/Editar Venta (`SaleUpsertPage`)

## Problema encontrado

En la pantalla `src/pages/SaleUpsertPage.tsx` la experiencia móvil presentaba fricción:

- Header con acciones que podía saturarse en pantallas angostas.
- Panel lateral de resumen/pago pensado para escritorio, poco cómodo en móvil.
- Riesgo de overflow horizontal en la tabla de productos (`OrderProductTableEnhanced`).
- Botones de icono sin atributos de accesibilidad completos (`aria-label`/`title`).

## Causa raíz

La página estaba estructurada principalmente con un layout desktop-first (grid + panel lateral fijo), sin un patrón móvil dedicado para el panel secundario y con una tabla de ancho fijo sin scroll horizontal explícito.

## Cambios aplicados

## 1) `src/pages/SaleUpsertPage.tsx`

- Se aplicó patrón mobile-first para el contenedor de formulario con espacio inferior en móvil (`pb-24`) para evitar solapamiento con panel flotante.
- Se mejoró el header para móvil:
  - `flex-wrap`, tamaños tipográficos responsivos, y botones con altura táctil mínima (`min-h-11`).
  - Botón de regreso con `aria-label` y `title`.
- Se introdujo panel lateral móvil tipo **bottom sheet** con 3 estados:
  - `collapsed`, `mid`, `full`.
  - Controles explícitos para expandir/contraer.
  - Cierre por overlay al tocar fuera.
  - Gestos swipe (arriba/abajo) en el handle con umbral de distancia/velocidad.
- Se mantuvo el panel lateral tradicional para `md+` (desktop/tablet), preservando comportamiento existente.
- Se evitó render duplicado de campos con IDs repetidos (panel lateral se renderiza una sola vez según viewport).

## 2) `src/components/sales/OrderProductTableEnhanced.tsx`

- Se habilitó scroll horizontal en móvil para la tabla (`overflow-x-auto` + `min-w-[760px]`).
- Se añadieron atributos `aria-label` y `title` a botones de icono críticos:
  - aumentar/disminuir cantidad,
  - confirmar/cancelar edición de precio,
  - quitar producto.
- Se ajustó footer de total para que envuelva correctamente en pantallas pequeñas (`flex-wrap`, `gap`).

## Mejoras adicionales (marzo 2026)

### Performance: `sheetGesture` → `useRef`

`sheetGesture` era un estado (`useState`), lo que causaba dos re-renders en cada ciclo touch (uno en `touchstart`, otro en `touchend`). Se migró a `useRef` (no reactivo), evitando renders innecesarios durante gestos.

### `touch-none` + `cursor-grab` en el handle

Se añadió `touch-none` al contenedor del handle para evitar que el browser intercepte el swipe y haga scroll de la página en lugar de mover el sheet. También se añadió `cursor-grab` para comunicar visualmente que el área es arrastrable.

### Total visible en barra colapsada

La barra colapsada ahora muestra el importe total junto al conteo de artículos (`Resumen • 3 artículos $1,250.00`), eliminando la necesidad de expandir el sheet solo para consultar el monto.

### Indicador visual del handle

La pastilla del handle tiene `active:bg-muted-foreground/40` para dar feedback táctil al presionar.

---

## Pruebas manuales sugeridas

1. Abrir `/sales/new` en viewport móvil (~390x844).
2. Validar que el header no recorta contenido y que los botones son tocables.
3. Agregar productos y comprobar que la tabla no rompe layout (debe permitir scroll horizontal).
4. Interactuar con bottom sheet:
   - colapsado → medio → completo,
   - swipe en handle arriba/abajo,
   - tap fuera para colapsar.
5. Cambiar método de pago y editar campos de pago desde el sheet.
6. Verificar que en desktop (`>=1024px`) se mantiene panel lateral fijo y no aparece bottom sheet.
7. Probar flujo completo: guardar, aprobar, borrar/reembolsar/cerrar según estado.

## Resultado esperado

La pantalla de nueva/editar venta ahora es utilizable en móvil sin recortes críticos, con panel de resumen/pago optimizado para touch y sin afectar la experiencia de escritorio.
