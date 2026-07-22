# Renovación de UI/UX del frontend Vite

## Objetivo

Unificar la experiencia visual y operativa de SalesNet sin cambiar contratos de API, permisos, feature flags ni reglas de negocio. La renovación prioriza legibilidad, navegación por tareas, accesibilidad, estados recuperables y una presentación coherente en escritorio y móvil.

## Alcance

### Sistema visual

- Se normalizó la escala tipográfica a 12/14/16 px para recuperar legibilidad en metadatos, tablas y controles.
- Se ajustaron los tokens semánticos de color, borde, radio y superficie para modo claro y oscuro.
- Los componentes base de tarjeta, botón, encabezado, búsqueda y estado vacío comparten ahora jerarquía, foco y espaciado responsive.
- Las animaciones respetan prefers-reduced-motion; las transiciones globales declaran propiedades concretas.

### Navegación y shell

- El sidebar organiza accesos en Resumen, Ventas, Catálogo e inventario, Compras, Relaciones y Administración.
- El filtrado existente por permisos y funcionalidades continúa aplicándose antes de mostrar cada acceso.
- La ruta activa se resuelve por coincidencia más específica para evitar dobles selecciones, por ejemplo entre /pos y /pos/restaurant.
- El header ofrece búsqueda también en móvil y elimina acciones sin flujo implementado.
- Las notificaciones pueden marcarse y eliminarse mediante teclado, con nombres accesibles y estados de carga anunciados.
- Las páginas protegidas exponen un solo landmark main y un enlace Saltar al contenido principal.

### Estados de navegación

- La carga de módulos lazy muestra progreso visible mediante role=status.
- Una URL inexistente presenta un estado 404 con una salida clara.
- Una funcionalidad no habilitada explica la situación dentro del shell, en lugar de redirigir silenciosamente al tablero.

### Dashboard

- El gráfico de demostración fue sustituido por una tendencia calculada desde el historial real devuelto por getSalesHistory.
- La agregación cambia entre hora, día y mes según el rango seleccionado.
- La consulta queda limitada a 200 ventas; la actividad reciente muestra como máximo 5.
- Los estados de carga, vacío y error son visibles. El error conserva una acción de reintento y limpia datos del rango anterior para no mostrar información obsoleta.

### Landing y autenticación

- La landing comunica el alcance real del ERP con una composición responsive y enlaces operativos.
- Navbar, hero, funcionalidades y footer respetan reducción de movimiento y semántica correcta de enlaces/botones.
- El layout compartido de autenticación incorpora una presentación B2B sin alterar sus props.
- El formulario de acceso asocia errores a sus campos, anuncia mensajes asíncronos y etiqueta controles iconográficos.
- index.html declara idioma, título, descripción, tema y metadatos de color apropiados.

## Archivos principales

- Shell: [DashboardLayout.tsx](../src/components/layout/DashboardLayout.tsx), [Header.tsx](../src/components/layout/Header.tsx)
- Navegación: [app-sidebar.tsx](../src/components/app-sidebar.tsx), [nav-main.tsx](../src/components/nav-main.tsx)
- Dashboard: [DashboardPage.tsx](../src/pages/DashboardPage.tsx), [chart-area-interactive.tsx](../src/components/chart-area-interactive.tsx)
- Público y acceso: [Hero.tsx](../src/components/landing/Hero.tsx), [AuthLayout.tsx](../src/components/layout/AuthLayout.tsx)
- Tokens globales: [index.css](../src/index.css)

## Validación

Desde viteapp/:

~~~powershell
npm run build
npm run test
npm run lint
~~~

La entrega se verificó con:

- TypeScript tsc -b.
- Build de producción de Vite.
- Suite Vitest.
- ESLint sobre todos los archivos reescritos.
- Smoke visual responsive de landing, login y estado 404.

El lint completo del repositorio todavía reporta deuda previa de reglas React en módulos no incluidos en esta renovación, principalmente efectos que actualizan estado de forma síncrona y funciones declaradas después de su primer uso.

## Despliegue

No requiere migraciones ni cambios de configuración. El despliegue usa el flujo existente del frontend Vite. Conviene invalidar la caché de assets porque los nombres de chunks y el CSS generado cambian con esta renovación.
