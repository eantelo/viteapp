# Asistente virtual en móvil: control de visibilidad y bottom sheet

## Problema detectado

En pantallas menores a `768px`, el asistente virtual seguía usando el mismo patrón docked de escritorio: panel fijo lateral, altura completa y ancho persistido.

Eso provocaba dos efectos no deseados:

1. El asistente ocupaba prácticamente toda la pantalla en móvil.
2. No existía una forma clara de ocultarlo porque:
   - el switch del header estaba oculto en móvil,
   - y el panel ya no tenía botón de cierre interno.

## Causa raíz

La implementación del chat era **desktop-first**:

- `ChatWidget` renderizaba siempre un panel fijo a la derecha.
- `DashboardLayout` reservaba espacio lateral cuando el chat estaba visible.
- `Header` ocultaba el control del asistente antes del breakpoint usado por `useIsMobile()`.

En conjunto, el usuario quedaba atrapado con un panel muy invasivo y sin salida visible.

## Cambios aplicados

### `src/components/chat/ChatWidget.tsx`

- Se añadió comportamiento móvil con `useIsMobile()`.
- En móvil, el asistente ahora se muestra como **bottom sheet** con tres estados:
  - `collapsed`
  - `mid`
  - `full`
- Se agregó:
  - barra/handle táctil,
  - overlay para contraer al tocar fuera,
  - gestos swipe arriba/abajo,
  - botón para nueva conversación,
  - botón para contraer,
  - botón para expandir,
  - botón para ocultar completamente el asistente.
- En desktop se mantiene el panel docked con resize, pero ahora también recupera el botón de cierre.

### `src/components/layout/Header.tsx`

- Se añadió un botón compacto del asistente para móvil (`md:hidden`).
- El switch anterior quedó solo para `md+`, alineado con el breakpoint real de `useIsMobile()`.

### `src/components/layout/DashboardLayout.tsx`

- El layout ya no reserva `padding-right` cuando el viewport es móvil.
- Así el contenido principal no se desplaza innecesariamente mientras el sheet móvil está abierto.

## Pruebas manuales sugeridas

Viewport recomendado: **390x844**.

1. Activar el asistente desde el icono del robot en el header móvil.
2. Verificar que aparece como panel inferior, no como panel lateral completo.
3. Probar los tres estados del sheet:
   - colapsado,
   - intermedio,
   - expandido.
4. Deslizar hacia arriba y hacia abajo sobre el handle.
5. Tocar fuera del panel cuando está abierto para contraerlo.
6. Usar el botón `X` para ocultarlo completamente.
7. Confirmar en desktop (`>=1024px`) que:
   - sigue funcionando como panel lateral,
   - mantiene resize,
   - y el cierre sigue disponible.

## Resultado esperado

En móvil, el asistente deja de bloquear toda la interfaz y vuelve a ser controlable, táctil y fácil de ocultar, sin afectar el comportamiento docked de escritorio.
