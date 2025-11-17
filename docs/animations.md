# Animaciones con Framer Motion

Este proyecto ahora utiliza [Framer Motion](https://www.framer.com/motion/) para ofrecer transiciones suaves entre pantallas y microinteracciones consistentes.

## Dependencias

- `framer-motion` quedó instalado como dependencia directa en `viteapp/package.json`.
- No se requiere configuración adicional: Vite ya transpila los componentes animados.

## Componentes reutilizables

### `PageTransition`

Archivo: `src/components/motion/PageTransition.tsx`

Encapsula las animaciones de entrada/salida de cada página usando `AnimatePresence` en `App.tsx`. Acepta `children` y un `className` opcional.

```tsx
import { PageTransition } from "@/components/motion/PageTransition";

export function DashboardPage() {
  return (
    <PageTransition>
      {/* Contenido de la página */}
    </PageTransition>
  );
}
```

`App.tsx` envuelve las rutas con `AnimatePresence` y usa `useLocation` para que la animación se dispare en cada navegación.

### `AuthLayout`

El layout de autenticación anima tanto la sección hero como la tarjeta del formulario. Se respetan las preferencias de accesibilidad consultando `useReducedMotion`, por lo que las animaciones se deshabilitan cuando el sistema indica “reducir movimiento”.

## Uso en páginas

- `DashboardPage`, `ProductsPage`, `CustomersPage`, `LoginPage` y `RegisterPage` están envueltas por `PageTransition`.
- Los encabezados y tarjetas principales de `ProductsPage` y `CustomersPage` tienen un ligero fade + slide.
- `DashboardPage` aplica un *stagger* sobre las tarjetas de estadísticas.

## Convenciones

1. Reutiliza `PageTransition` para cualquier nueva ruta protegida o pública.
2. Antes de crear nuevas variantes, revisa si basta con ajustar `transition` o `delay` en los componentes existentes.
3. Respeta `useReducedMotion` para evitar mareos o fatiga por movimiento.
4. Documenta en este archivo cualquier animación extra que añadas para mantener alineado al equipo.
