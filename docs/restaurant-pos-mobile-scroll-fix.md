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

3. **Panel derecho (orden) adaptado a móvil**
   - De `w-[380px]` fijo a:
     - `w-full` en móvil
     - `md:w-[380px] md:min-w-[380px]` en desktop
   - En móvil se apila debajo de productos en lugar de quedar parcialmente fuera de pantalla.

4. **Header optimizado para pantallas pequeñas**
   - Permite `wrap` en móvil.
   - Oculta correo en extra pequeño.
   - Muestra hora corta en móvil y formato largo desde `sm`.

5. **Mejoras de accesibilidad/lint en botones de iconos**
   - Se agregaron `title` y `aria-label` en botones de incrementar, disminuir y eliminar producto.
   - Se normalizó clase de Tailwind `aspect-[4/3]` a `aspect-4/3`.

6. **Modo touch-first en móvil (iteración adicional)**
   - Se agregó una **barra inferior fija** solo en móvil (`md:hidden`) con dos acciones rápidas:
     - `Orden (N)`: hace scroll suave al panel de orden.
     - `Pagar $Total`: abre el flujo de pago directamente.
   - Se añadió `padding-bottom` móvil al layout raíz para evitar que la barra tape contenido.

7. **Tarjetas de productos más cómodas para touch**
   - Se incrementó la altura mínima de las tarjetas en móvil (`min-h-[186px]`).
   - Se aumentó legibilidad del precio en móvil (`text-base`).
   - Se incrementó padding inferior del grid en móvil para evitar superposición con la barra fija.

## Resultado esperado

- Se puede navegar toda la pantalla POS en móvil sin cortes laterales.
- El contenido ya no queda truncado por ancho fijo del panel derecho.
- La experiencia touch mejora al tener una distribución vertical natural en móvil.
- El usuario puede completar acciones clave sin recorrer toda la pantalla: ver orden y pagar desde la barra inferior.
- Desktop mantiene la distribución de dos paneles como antes.

## Verificación sugerida

1. Abrir `RestaurantPosPage` en un viewport móvil (por ejemplo 390x844).
2. Confirmar que el header no corta texto ni iconos.
3. Confirmar que la sección de productos se ve completa y desplazable.
4. Confirmar que la orden aparece debajo en móvil (sin recorte lateral).
5. Confirmar que en desktop (`>= md`) sigue panel derecho fijo.
6. En móvil, confirmar que la barra inferior fija muestra:
   - Botón `Orden (N)` y realiza scroll al resumen.
   - Botón `Pagar` con total actualizado y estado deshabilitado cuando no hay productos.
