# Página de Detalle de Producto

## Descripción

La página de detalle de producto (`ProductDetailPage`) permite ver y editar la información completa de un producto individual. Es accesible desde la lista de productos haciendo clic en cualquier fila de la tabla.

## Ruta

```
/products/:id
```

Donde `:id` es el UUID del producto.

## Funcionalidades

### Vista de Información

- **Datos generales**: Nombre, descripción, SKU, código de barras
- **Clasificación**: Marca y categoría
- **Precio**: Mostrado en formato de moneda mexicana (MXN)
- **Estado**: Badge indicando si el producto está activo o inactivo

### Panel de Inventario

- **Stock actual**: Mostrado de forma prominente con colores según el nivel:
  - Verde: Stock > 25 unidades
  - Amarillo: Stock entre 11 y 25 unidades
  - Rojo: Stock ≤ 10 unidades (stock bajo)
- **Ajustar Stock**: Abre el diálogo de ajuste de stock
- **Ver Historial**: Muestra el historial de movimientos de stock

### Modo de Edición

Al hacer clic en el botón "Editar":

1. Los campos de solo lectura se convierten en campos editables
2. Aparecen los botones "Guardar" y "Cancelar"
3. Se pueden modificar:
   - Nombre del producto
   - Descripción
   - SKU
   - Código de barras
   - Marca (con autocompletado)
   - Categoría (con autocompletado)
   - Precio
   - Estado activo/inactivo

> **Nota**: El stock no se puede editar directamente. Use la función "Ajustar Stock" para modificarlo.

### Eliminación

El botón "Eliminar" permite borrar el producto después de una confirmación. Redirige automáticamente a la lista de productos tras la eliminación exitosa.

## Navegación

### Desde la Lista de Productos

- **Clic en fila**: Navega a la página de detalle
- **Enter/Espacio en fila seleccionada**: Navega a la página de detalle
- **Botón Editar (lápiz)**: Abre el diálogo de edición rápida (comportamiento anterior)

### Desde la Página de Detalle

- **Botón Volver**: Regresa a `/products`
- **Breadcrumbs**: Navegación completa disponible

## Acciones Rápidas

La página incluye un panel de acciones rápidas con:

- **Ir a Punto de Venta**: Navega a `/pos`
- **Ver en Catálogo**: Navega a `/catalog`

## Componentes Utilizados

- `DashboardLayout`: Layout principal con sidebar y breadcrumbs
- `PageTransition`: Animaciones de entrada/salida
- `Card`: Contenedores para información
- `Combobox`: Selectores de marca y categoría con autocompletado
- `StockAdjustmentDialog`: Diálogo para ajustar stock
- `StockHistoryDialog`: Diálogo para ver historial de stock
- `toast`: Notificaciones de éxito/error

## API Endpoints Utilizados

- `GET /api/products/:id` - Obtener producto por ID
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `GET /api/products/categories` - Obtener lista de categorías
- `GET /api/products/brands` - Obtener lista de marcas

## Estados de la Página

1. **Cargando**: Muestra skeletons mientras se obtienen los datos
2. **Error**: Muestra mensaje de error con opciones para reintentar o volver
3. **Vista**: Modo de solo lectura con información del producto
4. **Edición**: Modo de edición con formulario interactivo

## Animaciones

La página utiliza Framer Motion para animaciones suaves:
- Entrada escalonada de elementos
- Transiciones respetan la configuración de movimiento reducido del usuario

## Responsive

El layout se adapta a diferentes tamaños de pantalla:
- **Desktop (lg+)**: Grid de 3 columnas (2 para info, 1 para panel lateral)
- **Mobile/Tablet**: Stack vertical con panel de inventario debajo
