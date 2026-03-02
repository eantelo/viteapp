# POS mobile-first: scroll, layout y bottom sheet

## Problema

En `PointOfSalePage` la experiencia móvil tenía riesgos de recorte de contenido y baja ergonomía:

- El patrón de dos columnas estaba optimizado para desktop.
- El panel derecho (cliente/resumen/acciones) no seguía un patrón de sheet en móviles.
- No existían snap points ni gestos verticales para controlar el panel.
- El contenido podía competir por espacio en pantallas pequeñas, afectando lectura y toque.

## Causa raíz

La estructura principal priorizaba un `grid` desktop-first con panel lateral estático. En móvil, ese patrón no garantizaba:

- Flujo de scroll vertical completo del contenido principal.
- Separación clara entre área de catálogo/orden y área de resumen/acciones.
- Interacción táctil natural para expandir/colapsar acciones críticas.

## Cambios realizados

Archivo modificado:

- `src/pages/PointOfSalePage.tsx`

Resumen técnico:

1. **Scroll móvil correcto (sin romper desktop)**
   - Se aplicó contenedor root mobile-first con:
     - `min-h-dvh`
     - `overflow-y-auto`
     - `overflow-x-hidden`
   - En desktop se conserva:
     - `md:h-screen`
     - `md:overflow-hidden`

2. **Layout responsive sin recortes**
   - Estructura principal ahora usa:
     - móvil: `flex-col`
     - desktop: `md:flex-row`
   - Columna de resumen en desktop mantiene ancho fijo:
     - `md:w-[380px] md:min-w-[380px]`

3. **Header móvil robusto**
   - Barra de acciones superior con `flex-wrap` en móvil.
   - Texto secundario reducido/oculto en breakpoints pequeños para evitar clipping.

4. **Bottom sheet móvil para resumen/acciones**
   - El panel derecho se convierte en sheet inferior en móvil con:
     - `collapsed`
     - `mid`
     - `full`
   - Se mantiene panel lateral normal en desktop (`md:translate-y-0`, `md:static`).
   - Transiciones suaves con `duration-500`, `ease-out`, `will-change-transform`.
    - Ajuste fino aplicado para viewport 390x844:
       - `collapsed`: `translate-y-[calc(100%-4.25rem)]`
       - `mid`: `translate-y-[calc(100%-22rem)]`
       - `full`: `translate-y-0`
    - Alto del header del sheet móvil refinado a `h-[72px]` para reducir clipping visual.
    - Se añadió padding inferior con safe area:
       - `pb-[calc(env(safe-area-inset-bottom)+1rem)]`

5. **Interacciones del sheet**
   - Tap en header/franja del sheet para avanzar snap.
   - Botones explícitos:
     - “Subir panel”
     - “Bajar panel”
   - Overlay al expandir; tap fuera colapsa.
   - Auto-colapso al abrir diálogos críticos (cliente, órdenes en espera, pago).

6. **Gestos touch**
   - Implementado `onTouchStart` / `onTouchEnd` en header del sheet.
   - Umbral por distancia/velocidad:
     - ~36px o swipe rápido (`speed >= 0.55`)
   - Swipe arriba sube snap, swipe abajo baja snap.

7. **Accesibilidad y calidad**
   - Botones de icono del sheet con `aria-label` y `title`.
   - Se evitó duplicar lógica de negocio; solo se ajustó layout/interacción.

## Pruebas sugeridas

Viewport recomendado: **390x844**.

1. **Scroll y recorte**
   - Verificar scroll vertical completo en contenido principal.
   - Verificar ausencia de scroll horizontal no intencional.

2. **Bottom sheet**
   - Confirmar transición entre `collapsed`, `mid` y `full`.
   - Confirmar que tap en header cambia snap.
   - Confirmar botones subir/bajar y estados `disabled`.

3. **Gestos táctiles**
   - Swipe arriba y abajo sobre el header del sheet.
   - Confirmar respuesta por distancia y por swipe rápido.

4. **Overlay y diálogos críticos**
   - Con sheet expandido, tap fuera debe colapsar.
   - Al abrir cliente/órdenes/pago, sheet debe auto-colapsar.

5. **Regresión desktop**
   - Revisar en `md+` que el panel derecho siga como lateral fijo.
   - Confirmar que flujo actual de cobro, cliente y acciones no cambió funcionalmente.

## Resultado esperado

- En móvil, la página POS permite navegación completa sin recortes y con un panel de resumen/acciones touch-friendly.
- El panel inferior responde a taps, botones y swipes con snap points claros.
- En desktop, se conserva el comportamiento visual y funcional esperado.