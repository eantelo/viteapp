# Ajuste de scroll móvil en `RestaurantPosPage`

Fecha: 2026-03-01

## Problema

En móviles, la vista de POS restaurante quedaba recortada y no se podía navegar correctamente para ver toda la interfaz:

- El contenedor principal usaba `overflow-hidden` con altura fija (`h-screen`).
- El panel de orden tenía ancho fijo (`380px`) incluso en pantallas pequeñas.
- El header podía desbordarse horizontalmente por contenido largo (correo + fecha completa).

## Cambios realizados

Archivo modificado: `src/pages/RestaurantPosPage.tsx`

1. **Scroll del layout raíz corregido en móvil**
   - Se cambió a `min-h-dvh` y `overflow-y-auto overflow-x-hidden` para móvil.
   - En desktop se mantiene el comportamiento anterior con `md:h-screen md:overflow-hidden`.

2. **Layout responsive del contenido principal**
   - El contenedor central ahora usa `flex-col` en móvil y `md:flex-row` en escritorio.
   - Evita recortes laterales y mejora navegabilidad en pantallas pequeñas.

3. **Panel de orden adaptado por breakpoint**
   - En desktop se conserva como panel lateral (`md:w-[380px] md:min-w-[380px]`).
   - En móvil evoluciona a panel tipo bottom sheet colapsable (ver punto 8).

4. **Header optimizado para pantallas pequeñas**
   - Permite `wrap` en móvil.
   - Oculta correo en extra pequeño.
   - Muestra hora corta en móvil y formato largo desde `sm`.

5. **Mejoras de accesibilidad/lint en botones de iconos**
   - Se agregaron `title` y `aria-label` en botones de incrementar, disminuir y eliminar producto.
   - Se normalizó clase de Tailwind `aspect-[4/3]` a `aspect-4/3`.

6. **Modo touch-first en móvil (iteración adicional)**
   - Se añadió `padding-bottom` móvil al layout raíz para evitar superposición con elementos fijos.
   - Se priorizó interacción por pulgar y lectura rápida de precio/total.

7. **Tarjetas de productos más cómodas para touch**
   - Se incrementó la altura mínima de las tarjetas en móvil (`min-h-[186px]`).
   - Se aumentó legibilidad del precio en móvil (`text-base`).
   - Se incrementó padding inferior del grid en móvil para evitar superposición con el bottom sheet.

8. **Bottom sheet colapsable para la orden (móvil)**
   - Se reemplazó la barra inferior fija por un panel tipo **bottom sheet** usando el mismo resumen de orden existente.
   - El panel en móvil ahora:
     - inicia colapsado mostrando una franja de resumen (productos + total),
       - maneja 3 snap points: `colapsado` → `medio` → `completo`,
       - se expande al tocar la franja,
     - puede cerrarse tocando fuera del panel (overlay).
   - En desktop se mantiene el panel lateral tradicional sin cambios.

10. **Controles explícitos de snap (móvil)**
      - Se añadieron controles rápidos en la cabecera del sheet:
         - `Subir panel` (nivel siguiente)
         - `Bajar panel` (nivel anterior)
      - Esto facilita navegación con una sola mano sin depender solo del tap en la franja.

11. **Gesto swipe vertical (móvil) con snap inteligente**
      - El header del bottom sheet ahora interpreta gestos touch:
         - swipe hacia arriba ⇒ sube un nivel (`collapsed` → `mid` → `full`),
         - swipe hacia abajo ⇒ baja un nivel (`full` → `mid` → `collapsed`).
      - Se aplican umbrales por:
         - **distancia** (aprox. 36px), o
         - **velocidad** (swipe rápido),
         para que la interacción se sienta natural y responsiva.

12. **Animación suavizada tipo spring**
      - Se ajustó la transición del panel a un movimiento más suave (`duration-500`, `ease-out`, `will-change-transform`) para mejorar la sensación nativa en móvil.

9. **Comportamiento de cierre automático del sheet**
   - El panel móvil se colapsa automáticamente cuando el usuario:
     - abre diálogo de cliente,
     - abre órdenes en espera,
     - inicia pago,
     - confirma pago,
     - pone orden en espera.

## Resultado esperado

- Se puede navegar toda la pantalla POS en móvil sin cortes laterales.
- El contenido ya no queda truncado por ancho fijo del panel derecho.
- La experiencia touch mejora al tener una distribución vertical natural en móvil.
- El usuario puede consultar/editar la orden sin perder espacio de catálogo, expandiendo el sheet solo cuando lo necesita.
- El resumen de orden en móvil no invade la pantalla permanentemente, pero sigue accesible con un gesto/toque rápido.
- Desktop mantiene la distribución de dos paneles como antes.

## Verificación sugerida

1. Abrir `RestaurantPosPage` en un viewport móvil (por ejemplo 390x844).
2. Confirmar que el header no corta texto ni iconos.
3. Confirmar que la sección de productos se ve completa y desplazable.
4. Confirmar que el panel de orden en móvil inicia colapsado y no recorta contenido del catálogo.
5. Confirmar que en desktop (`>= md`) sigue panel derecho fijo.
6. En móvil, confirmar bottom sheet colapsable:
   - Estado inicial colapsado mostrando franja de resumen.
   - Tap en franja avanza entre niveles (`colapsado` → `medio` → `completo`).
   - Botones de subir/bajar cambian el snap point correctamente.
   - Swipe vertical en header cambia snap point según dirección y velocidad.
   - Tap fuera del panel colapsa de nuevo.
   - Al abrir cliente/órdenes en espera/pago, el sheet se colapsa automáticamente.
   - En desktop no aparece comportamiento de sheet.
