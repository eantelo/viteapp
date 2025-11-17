# Product Catalog Page

## Descripción

La página de **Product Catalog** (`/catalog`) es una vista alternativa del módulo de productos diseñada con un enfoque en el diseño visual y la experiencia de usuario, basada en un template moderno con Tailwind CSS.

## Características principales

### Layout y diseño

- **Sidebar de filtros**: Panel lateral fijo con opciones de búsqueda y filtros categorizados
- **Vista de tabla mejorada**: Tabla de productos con imágenes, información detallada y paginación
- **Diseño responsivo**: Adaptado a diferentes tamaños de pantalla con dark mode
- **Animaciones suaves**: Transiciones implementadas con Framer Motion

### Componentes principales

#### 1. Header de página
- Título y descripción del catálogo
- Botones de acción:
  - **Import**: Para importar productos desde archivos externos
  - **Add New Product**: Para crear nuevos productos

#### 2. Sidebar de filtros
Incluye las siguientes secciones colapsables:

- **Search bar**: Búsqueda rápida de productos
- **Category**: Filtros por categoría (Electronics, Apparel, Books)
- **Status**: Filtros por estado (Active, Draft, Archived)
- **Supplier**: Filtros por proveedor
- **Clear All Filters**: Botón para limpiar todos los filtros aplicados

#### 3. Tabla de productos
Columnas:
- **Checkbox**: Selección múltiple
- **Product**: Imagen miniatura + nombre + categoría
- **SKU**: Código único del producto
- **Price**: Precio formateado en la moneda local
- **Stock**: Cantidad disponible (con indicador visual para stock bajo)
- **Status**: Badge con estado visual (Active/Draft)
- **Actions**: Menú de acciones (más opciones)

#### 4. Paginación
- Indicador de registros mostrados
- Navegación entre páginas (Previous, 1, 2, 3, Next)
- Página actual destacada visualmente

## Estilos y colores

### Paleta de colores
- **Primary**: Color azul (`#135bec`) utilizado para elementos interactivos
- **Background Light**: `#f6f6f8` (fondo claro)
- **Background Dark**: `#101622` (fondo oscuro)
- **Success**: Verde para productos activos
- **Warning**: Amarillo/naranja para productos draft o stock bajo
- **Error**: Rojo para estados críticos

### Componentes de UI
- **Badges**: Píldoras de estado con colores semánticos
- **Inputs**: Campos con iconos integrados y bordes redondeados
- **Buttons**: Primarios, secundarios y ghost con transiciones
- **Checkboxes**: Estilizados con color primary y bordes redondeados

## Ruta

```
/catalog
```

## Protección

La ruta está protegida por `ProtectedRoute` y requiere autenticación.

## Integración con la API

La página consume el servicio `getProducts` de `@/api/productsApi` para obtener la lista de productos. Actualmente incluye datos mock para demostración del diseño.

### Datos mock incluidos

4 productos de ejemplo con:
- Classic Wristwatch (Electronics)
- Running Shoes (Apparel)
- Wireless Headphones (Electronics) - con stock bajo
- Design Thinking Handbook (Books) - en estado Draft

## Funcionalidades pendientes

- [ ] Implementar filtros funcionales
- [ ] Conectar botones de Import y Add New Product
- [ ] Implementar selección múltiple de productos
- [ ] Agregar menú de acciones por producto
- [ ] Implementar paginación real con datos de la API
- [ ] Agregar ordenamiento de columnas
- [ ] Implementar búsqueda en tiempo real
- [x] Exportar productos filtrados a CSV

## Dependencias

```tsx
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useReducedMotion } from "framer-motion";
```

## Accesibilidad

- Etiquetas semánticas en tablas (`<th>`, `<td>`, `scope`)
- Labels ocultos para screen readers (`sr-only`)
- Indicadores visuales para estados críticos (stock bajo)
- Navegación por teclado en elementos interactivos
- Soporte para preferencias de movimiento reducido

## Diferencias con ProductsPage

| Característica | ProductsPage | ProductCatalogPage |
|----------------|--------------|-------------------|
| Layout | Card tradicional | Sidebar + Tabla grande |
| Filtros | En header | Sidebar dedicado |
| Vista | Compacta | Expandida con imágenes |
| Acciones | Botones inline | Menú contextual |
| Estilo | shadcn/ui | Tailwind custom + template |

## Navegación

La página se agrega al sidebar principal:

```tsx
{
  title: "Catálogo",
  url: "/catalog",
  icon: IconLayoutGrid,
}
```

## Ejemplo de uso

1. Usuario hace clic en "Catálogo" en el sidebar
2. Se carga la página con el listado de productos
3. Usuario puede:
   - Buscar productos en el search bar del sidebar
   - Aplicar filtros por categoría, estado o proveedor
   - Ver detalles visuales de cada producto
   - Navegar entre páginas
   - Seleccionar productos para acciones masivas

## Notas de desarrollo

- La página utiliza el hook `useDocumentTitle` para establecer el título del documento
- Las animaciones respetan las preferencias de `prefers-reduced-motion`
- Los datos mock deben reemplazarse con datos reales de la API
- Los filtros están implementados visualmente pero no están funcionales
- La paginación es mock; se debe implementar con datos reales

## Exportación a CSV

- Botón **Exportar CSV** en el header (junto a Importar y Crear Producto).
- Solo se habilita cuando hay resultados en la vista filtrada actual.
- Genera un archivo `productos_YYYYMMDD_HHmmss.csv` con las columnas:
  - `Id`
  - `Nombre`
  - `Descripción`
  - `SKU`
  - `Código de barras`
  - `Marca`
  - `Categoría`
  - `Precio`
  - `Stock`
  - `Estatus` (Activo, Inactivo, Sin Stock)
- La exportación se realiza en el cliente, respetando filtros y búsqueda aplicados.
- Se muestra un toast de confirmación con el total de productos exportados.

## Futuras mejoras

1. **Drag & Drop**: Permitir reordenar productos
2. **Vista de cuadrícula**: Agregar toggle para cambiar entre tabla y cards
3. **Filtros avanzados**: Agregar rangos de precio, fecha de creación, etc.
4. **Vistas guardadas**: Guardar combinaciones de filtros
5. **Quick actions**: Acciones rápidas sin abrir diálogos
