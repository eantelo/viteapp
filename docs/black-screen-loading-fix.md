# Fix: pantalla negra con loading infinito

## Síntoma

Al ejecutar `viteapp`, la aplicación podía quedarse en pantalla negra con sensación de carga infinita durante la navegación.

## Causa raíz

Se había agregado una transición global envolviendo `Routes` con `AnimatePresence` en `src/App.tsx` usando `mode="wait"`.

En ciertos flujos de rutas protegidas y páginas sin animación de salida consistente, esto puede dejar el árbol de rutas esperando una transición de salida y bloquear temporalmente el render visible.

## Solución aplicada

Se eliminó el wrapper global `AnimatePresence` de `src/App.tsx` y se mantuvo el sistema de transición por página (`PageTransition`), que es más predecible para este proyecto.

## Validación

- El servidor de desarrollo levanta correctamente:
  - `VITE v7.2.2 ready`
  - URL local activa (puerto disponible)
- La navegación vuelve a renderizar contenido sin bloqueo visual global.

## Nota

Existen errores TypeScript/lint en otras áreas del proyecto que son previos y no forman parte de este incidente específico de pantalla negra.
