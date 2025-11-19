# Mejoras de UI y Tipografía

Fecha: 19 de Noviembre de 2025

## Resumen

Se han realizado mejoras en la interfaz de usuario para hacerla más amigable y moderna. Los cambios principales incluyen la actualización de la tipografía, la paleta de colores y el radio de los bordes.

## Cambios Realizados

### 1. Tipografía

- **Fuente de Encabezados**: Se ha cambiado la fuente de los encabezados (`h1` a `h6`) de `Roboto` a **Poppins**. `Poppins` es una fuente geométrica sans-serif que aporta un aspecto más amigable y moderno.
- **Fuente de Cuerpo**: Se mantiene **Inter** para el texto del cuerpo por su excelente legibilidad en interfaces de usuario.
- **Tracking**: Se ha añadido `tracking-tight` a los encabezados para mejorar la apariencia visual.

### 2. Colores

- **Color Primario**: Se ha actualizado el color primario a un tono azul más vibrante y amigable (`oklch(0.55 0.2 260)` en modo claro y `oklch(0.7 0.15 260)` en modo oscuro). Esto reemplaza el tono gris oscuro anterior, dando más vida a la interfaz.
- **Anillos de Foco**: El color del anillo de foco (`--ring`) se ha sincronizado con el nuevo color primario.

### 3. Bordes y Formas

- **Radio de Borde**: Se ha aumentado el radio base (`--radius`) de `0.625rem` (10px) a `0.75rem` (12px).
  - Esto afecta a todos los componentes que usan `rounded-md`, `rounded-lg`, `rounded-xl`, etc.
  - Los botones ahora tienen bordes ligeramente más redondeados (`rounded-md` ≈ 10px).
  - Las tarjetas (`Cards`) ahora tienen bordes más suaves (`rounded-xl` ≈ 16px).

## Archivos Modificados

- `viteapp/index.html`: Se añadió la importación de la fuente `Poppins` desde Google Fonts.
- `viteapp/src/index.css`: Se actualizaron las variables CSS (`:root` y `.dark`) y las reglas de estilo base para encabezados.

## Próximos Pasos Sugeridos

- Revisar la consistencia de los componentes personalizados con el nuevo radio de borde.
- Considerar añadir transiciones suaves a más elementos interactivos si es necesario.
