# Implementación de Tema Claro/Oscuro

Se ha implementado el soporte para temas claro y oscuro en la aplicación `viteapp` utilizando Tailwind CSS y un contexto de React.

## Componentes

### `ThemeProvider`
Ubicación: `src/components/theme-provider.tsx`

Este componente envuelve la aplicación y gestiona el estado del tema (`light`, `dark`, `system`). Utiliza `localStorage` para persistir la preferencia del usuario y aplica la clase `.dark` al elemento `html` cuando corresponde.

### `ModeToggle`
Ubicación: `src/components/mode-toggle.tsx`

Un componente de botón que muestra un menú desplegable para seleccionar el tema. Se ha integrado en el `Header` de la aplicación.

## Integración

1.  **`main.tsx`**: Se ha envuelto la aplicación con `<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">`.
2.  **`Header.tsx`**: Se ha añadido el componente `<ModeToggle />` y se han actualizado los estilos para utilizar clases semánticas de Tailwind (ej. `bg-background`, `text-foreground`, `border-border`) en lugar de colores fijos (`bg-white`, `text-slate-900`, `border-slate-200`).
3.  **`DashboardLayout.tsx`**: Se ha actualizado el fondo del área principal para soportar el modo oscuro (`bg-slate-50 dark:bg-muted/10`).

## Uso de Clases Semánticas

Para asegurar la compatibilidad con ambos temas, se deben utilizar las variables CSS definidas en `index.css` a través de las clases de utilidad de Tailwind:

-   Fondo principal: `bg-background`
-   Texto principal: `text-foreground`
-   Texto secundario: `text-muted-foreground`
-   Bordes: `border-border`
-   Inputs: `bg-background` o `bg-muted/50`, `border-input`
-   Elementos interactivos hover: `hover:bg-accent hover:text-accent-foreground`

## Configuración

El tema por defecto está configurado como `dark` en `main.tsx`, pero respeta la preferencia del sistema si el usuario selecciona "System".
