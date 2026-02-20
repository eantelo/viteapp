# Módulo de Productos

## Descripción

Implementación completa del módulo de gestión de productos en `viteapp`, incluyendo un dashboard tipo tabla con funcionalidad CRUD completa que consume datos desde `Sales.Api`.

## Arquitectura

### Flujo de datos

```
ProductsPage → productsApi → apiClient → Sales.Api (ProductsController)
     ↓
ProductFormDialog
```

### Componentes principales

1. **ProductsPage** (`/src/pages/ProductsPage.tsx`)
   - Página principal del módulo de productos
   - Muestra una tabla con todos los productos
   - Incluye búsqueda por nombre, marca, categoría, SKU o código de barras
   - Botones para crear, editar y eliminar productos
   - Indicadores visuales para stock bajo (≤10 unidades)

2. **ProductFormDialog** (`/src/components/products/ProductFormDialog.tsx`)
   - Modal reutilizable para crear/editar productos
   - Validación de campos obligatorios
   - Manejo de estados de carga y errores
   - Campos:
     - Nombre (obligatorio, máx 200 caracteres)
     - SKU (obligatorio, máx 100 caracteres)
   - Marca (opcional, máx 120 caracteres)
   - Categoría (opcional, máx 120 caracteres)
     - Código de Barras (opcional, máx 100 caracteres)
     - Precio (obligatorio, ≥0)
     - Stock (obligatorio, ≥0)
     - Estado activo/inactivo (solo en modo edición)

3. **productsApi** (`/src/api/productsApi.ts`)
   - Servicio centralizado para todas las operaciones de productos
   - Funciones disponibles:
     - `getProducts(search?)`: Listar productos con búsqueda opcional
     - `getProductById(id)`: Obtener producto por ID
     - `getProductByBarcode(barcode)`: Obtener producto por código de barras
     - `createProduct(dto)`: Crear nuevo producto
     - `updateProduct(id, dto)`: Actualizar producto existente
     - `deleteProduct(id)`: Eliminar producto

### Tipos TypeScript

```typescript
interface ProductDto {
  id: string;
  name: string;
  sku: string;
  barcode: string;
   brand: string;
   category: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface ProductCreateDto {
  name: string;
  sku: string;
  barcode: string;
   brand: string;
   category: string;
  price: number;
  stock: number;
}

interface ProductUpdateDto {
  name: string;
  sku: string;
  barcode: string;
   brand: string;
   category: string;
  price: number;
  stock: number;
  isActive: boolean;
}
```

## Integración con Sales.Api

### Endpoints consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos (con búsqueda opcional) |
| GET | `/api/products/{id}` | Obtener producto por ID |
| GET | `/api/products/by-barcode/{barcode}` | Obtener producto por código de barras |
| POST | `/api/products` | Crear nuevo producto |
| PUT | `/api/products/{id}` | Actualizar producto |
| DELETE | `/api/products/{id}` | Eliminar producto |

### Autenticación

Todas las peticiones incluyen automáticamente el token JWT en el header `Authorization: Bearer <token>` mediante el `apiClient`.

### Multitenancy

El `tenantId` se extrae automáticamente del JWT en el backend. El frontend no necesita enviarlo explícitamente.

## Navegación

### Ruta agregada

- `/products` - Página de gestión de productos (protegida, requiere autenticación)

### Menú del sidebar

Se agregó el ítem "Productos" con icono `IconPackage` en el menú principal del sidebar:

```typescript
{
  title: "Productos",
  url: "/products",
  icon: IconPackage,
}
```

## Características de UI/UX

### Ancho consistente en crear/editar (actualizado)
- La pantalla `ProductUpsertPage` (`/products/new` y `/products/:id/edit`) usa un contenedor principal con `max-w-[1320px]`.
- Esto evita que los controles se estiren en pantallas amplias y mantiene una densidad visual consistente con el asistente AI abierto o cerrado.

### Búsqueda
- Campo de búsqueda con icono
- Búsqueda al presionar Enter o botón "Buscar"
- Búsqueda por nombre, marca, categoría, SKU o código de barras

### Tabla de productos
- Columnas: Nombre, Marca, Categoría, SKU, Código de Barras, Precio, Stock, Estado, Acciones
- Precio formateado en pesos mexicanos (MXN)
- Stock con indicador visual para niveles bajos (≤10 en rojo)
- Badge de estado (Activo/Inactivo)
- Botones de editar y eliminar por fila
- Hacer clic (o presionar Enter/Espacio con foco) sobre cualquier fila abre directamente el diálogo de edición con los datos precargados

### Estados de carga
- Spinner durante carga de datos
- Botones deshabilitados durante operaciones
- Mensajes de error amigables

### Confirmación de eliminación
- Confirmación nativa del navegador antes de eliminar

### Responsividad
- Layout adaptable a diferentes tamaños de pantalla
- Uso de grid para campos del formulario

## Dependencias agregadas

### Componentes de shadcn/ui utilizados
- `Button`
- `Input`
- `Label`
- `Card`
- `Table`
- `Badge`
- `Dialog` (instalado mediante `npx shadcn@latest add dialog`)
- `Checkbox`

### Iconos
Se utiliza `@tabler/icons-react`:
- `IconPackage` - Menú de productos
- `IconPlus` - Crear producto
- `IconPencil` - Editar producto
- `IconTrash` - Eliminar producto
- `IconSearch` - Búsqueda

## Validaciones

### Frontend
- Campos obligatorios marcados con asterisco rojo
- Validación de tipos (número para precio y stock)
- Validación de rangos (precio y stock ≥0)
- Longitud máxima de campos de texto

### Backend
Las validaciones definitivas se realizan en `Sales.Api` mediante DataAnnotations:
- `Name`: Required, StringLength(200)
- `Sku`: Required, StringLength(100)
- `Brand`: StringLength(120)
- `Category`: StringLength(120)
- `Barcode`: StringLength(100)
- `Price`: Range(0.00, 999999999999.99)
- `Stock`: Range(0, int.MaxValue)

## Manejo de errores

### Errores de red
- Captura de errores en todas las operaciones API
- Mensajes de error mostrados en UI
- Estado de error en tabla principal

### Errores de validación
- Errores del backend se muestran en el formulario
- Validaciones de frontend previenen datos inválidos

## Mejoras futuras sugeridas

1. **Paginación**: Implementar paginación para listas grandes de productos
2. **Filtros avanzados**: Agregar filtros por rango de precio, stock, estado
3. **Exportación**: Exportar lista de productos a CSV/Excel
4. **Imágenes**: Agregar soporte para imágenes de productos
5. **Catálogos enriquecidos**: Administrar catálogos maestros de marcas/categorías y filtros dependientes
6. **Bulk actions**: Operaciones masivas (activar/desactivar múltiples productos)
7. **Historial**: Ver historial de cambios de precio/stock
8. **Alertas de stock**: Configurar alertas automáticas para stock bajo
9. **Importación masiva**: Importar productos desde archivo CSV/Excel
10. **Búsqueda avanzada**: Búsqueda con operadores (mayor que, menor que, entre)

## Archivos modificados/creados

### Nuevos archivos
- `/src/api/productsApi.ts`
- `/src/pages/ProductsPage.tsx`
- `/src/components/products/ProductFormDialog.tsx`
- `/src/components/ui/dialog.tsx` (instalado por shadcn CLI)
- `/docs/products-module.md` (este archivo)

### Archivos modificados
- `/src/App.tsx` - Agregada ruta `/products`
- `/src/components/app-sidebar.tsx` - Agregado menú "Productos"

## Pruebas recomendadas

1. **Crear producto**
   - Con todos los campos
   - Sin código de barras (opcional)
   - Validar errores con campos inválidos

2. **Listar productos**
   - Sin búsqueda
   - Con búsqueda por nombre
   - Con búsqueda por marca
   - Con búsqueda por categoría
   - Con búsqueda por SKU
   - Con búsqueda por código de barras

3. **Editar producto**
   - Cambiar todos los campos
   - Activar/desactivar producto
   - Validar persistencia

4. **Eliminar producto**
   - Confirmar eliminación
   - Cancelar eliminación
   - Validar que desaparece de la lista

5. **Estados visuales**
   - Verificar spinner de carga
   - Verificar indicador de stock bajo
   - Verificar badges de estado

6. **Multitenancy**
   - Productos solo visibles para el tenant del usuario autenticado
   - No se pueden acceder productos de otros tenants

## Notas de desarrollo

- El componente sigue las convenciones de `agents.md` en `/viteapp`
- Se respeta la arquitectura Clean Architecture del backend
- Todos los datos se obtienen desde `Sales.Api`, no hay datos mock
- El JWT maneja automáticamente el `tenantId` y la autorización
- Los estilos siguen el sistema de diseño con Tailwind CSS
- Se utilizan componentes de shadcn/ui para consistencia visual
