# Módulo de Ventas (Sales)

## Descripción

El módulo de **Ventas** (`Sales`) permite gestionar las órdenes de venta del sistema SaaS multitenant. Incluye funcionalidades completas de CRUD (Crear, Leer, Actualizar, Eliminar) con búsqueda, filtrado por estado, paginación y gestión de ítems de venta con productos.

## Arquitectura y Estructura

El módulo sigue la arquitectura establecida en el sistema, separando responsabilidades en capas:

### Frontend (viteapp)

```
viteapp/src/
├── api/
│   └── salesApi.ts              # Cliente HTTP para el endpoint de ventas
├── pages/
│   └── SalesPage.tsx            # Página principal con listado de ventas
├── components/
│   └── sales/
│       └── SaleFormDialog.tsx   # Diálogo modal para crear/editar ventas
└── App.tsx                      # Router con ruta /sales
```

### Backend (Sales.Api)

El backend expone el endpoint `/api/sales` con los siguientes métodos:

- `GET /api/sales` - Obtener todas las ventas (con búsqueda opcional)
- `GET /api/sales/{id}` - Obtener una venta por ID
- `POST /api/sales` - Crear una nueva venta
- `PUT /api/sales/{id}` - Actualizar una venta existente
- `DELETE /api/sales/{id}` - Eliminar una venta

## Características Principales

### 1. Listado de Ventas (`SalesPage.tsx`)

**Funcionalidades:**

- **Tabla completa** con columnas:
  - Checkbox de selección
  - Número de orden (`saleNumber`)
  - Cliente (`customerName`)
  - Fecha de venta
  - Total (`totalAmount`)
  - Estado (`status`)
  - Acciones (ver, editar, eliminar)

- **Búsqueda**: Por número de orden o nombre de cliente.
- **Filtros**: Por estado (Pendiente, Facturada, Enviada, Cancelada).
- **Paginación**: Configurable (5, 10, 20, 50 filas por página).
- **Animaciones**: Usando Framer Motion con soporte para `prefers-reduced-motion`.
- **Accesibilidad**: Navegación por teclado, etiquetas ARIA, contraste adecuado.
- **Responsividad**: Diseño adaptable a dispositivos móviles y escritorio.

**Estados de ventas:**

| Estado       | Badge Variant  | Color          | Descripción          |
|--------------|----------------|----------------|----------------------|
| `Pending`    | `outline`      | Gris           | Pendiente            |
| `Invoiced`   | `secondary`    | Gris oscuro    | Facturada            |
| `Shipped`    | `default`      | Verde/Azul     | Enviada              |
| `Cancelled`  | `destructive`  | Rojo           | Cancelada            |

### 2. Formulario de Venta (`SaleFormDialog.tsx`)

**Funcionalidades:**

- **Selección de cliente**: Dropdown con lista de clientes activos.
- **Fecha de venta**: Input tipo `date` (por defecto: fecha actual).
- **Estado**: Solo editable en modo edición (Pendiente, Facturada, Enviada, Cancelada).
- **Notas**: Campo de texto opcional para observaciones.
- **Gestión de productos**:
  - Agregar productos desde un dropdown con precio y stock visible.
  - Validación para evitar duplicados.
  - Tabla editable con:
    - Cantidad
    - Precio unitario
    - Descuento
    - Subtotal (calculado automáticamente)
  - Eliminar productos de la lista.
- **Total calculado**: Suma automática de todos los subtotales.
- **Validaciones**:
  - Cliente obligatorio.
  - Fecha obligatoria.
  - Al menos un producto requerido.
  - Cantidades y precios positivos.

**Cálculo de subtotal:**

```
Subtotal = (Cantidad × Precio Unitario) - Descuento
```

**Ejemplo de uso:**

1. Seleccionar cliente.
2. Especificar fecha.
3. Agregar productos con cantidad, precio y descuento.
4. Revisar el total.
5. Guardar la venta.

### 3. Cliente API (`salesApi.ts`)

**DTOs principales:**

```typescript
export interface SaleItemDto {
  id?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleDto {
  id: string;
  saleNumber: string;
  customerId: string;
  customerName?: string;
  saleDate: string;
  totalAmount: number;
  status: "Pending" | "Invoiced" | "Shipped" | "Cancelled";
  items: SaleItemDto[];
  notes?: string | null;
  isActive: boolean;
}

export interface SaleCreateDto {
  customerId: string;
  saleDate: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
  notes?: string | null;
}

export interface SaleUpdateDto {
  customerId: string;
  saleDate: string;
  status: "Pending" | "Invoiced" | "Shipped" | "Cancelled";
  items: Array<{
    id?: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
  notes?: string | null;
  isActive: boolean;
}
```

**Funciones disponibles:**

```typescript
// Obtener todas las ventas (con búsqueda opcional)
getSales(search?: string): Promise<SaleDto[]>

// Obtener una venta por ID
getSaleById(id: string): Promise<SaleDto>

// Crear una nueva venta
createSale(dto: SaleCreateDto): Promise<SaleDto>

// Actualizar una venta existente
updateSale(id: string, dto: SaleUpdateDto): Promise<void>

// Eliminar una venta
deleteSale(id: string): Promise<void>
```

## Navegación

La ruta `/sales` está protegida por autenticación y se accede desde:

- **Sidebar**: Opción "Ventas" con icono `IconReceipt`.
- **URL directa**: `http://localhost:5173/sales`

## Estilo Visual

El módulo utiliza el sistema de diseño establecido siguiendo el formato del ejemplo HTML proporcionado:

- **Tailwind CSS**: Clases utilitarias para estilos.
- **Shadcn/ui**: Componentes base (`Button`, `Input`, `Table`, `Badge`, `Select`, `Dialog`, etc.).
- **Modo oscuro**: Soporte completo con clases `dark:`.
- **Colores primarios**:
  - Primary: `#135bec` (azul)
  - Background light: `#f6f6f8`
  - Background dark: `#101622`
- **Iconos**: Tabler Icons (`@tabler/icons-react`).

### Ejemplos visuales:

**Barra de búsqueda y filtros:**
- Input con icono de búsqueda a la izquierda.
- Select para filtrar por estado.
- Filtros activos mostrados como chips removibles.

**Tabla de ventas:**
- Header con fondo gris claro (`bg-gray-50 dark:bg-gray-800`).
- Filas con hover y efecto de selección.
- Badges de colores según el estado.
- Botones de acción con iconos.

**Paginación:**
- Información de registros mostrados.
- Selector de filas por página.
- Botones de anterior/siguiente.
- Números de página con estado activo resaltado.

**Formulario modal:**
- Ancho máximo: `900px`.
- Altura máxima: `90vh` con scroll.
- Tabla editable para productos.
- Total calculado en la parte inferior.

## Seguridad y Multitenancy

- Todas las peticiones incluyen el header `Authorization: Bearer <token>`.
- El `tenantId` es gestionado automáticamente por el backend desde el JWT.
- Filtros globales en el backend aseguran aislamiento por tenant.
- Validaciones de permisos en cada endpoint.

## Manejo de Errores

**Frontend:**
- Mensajes de error en diálogos y alertas.
- Estados de carga con spinners.
- Validaciones en formularios.

**Backend:**
- Códigos HTTP estándar (200, 201, 400, 401, 404, 500).
- Mensajes de error descriptivos en JSON.

## Próximas Mejoras Sugeridas

1. **Exportar ventas**: Generar reportes en PDF o Excel.
2. **Historial de cambios**: Auditoría de modificaciones en ventas.
3. **Notificaciones**: Alertar cuando una venta cambia de estado.
4. **Facturación integrada**: Conectar con servicios de facturación electrónica.
5. **Descuentos avanzados**: Descuentos porcentuales y cupones.
6. **Validación de stock**: Verificar disponibilidad al agregar productos.
7. **Multi-selección**: Acciones en lote (cancelar, facturar, etc.).
8. **Filtros adicionales**: Por fecha, rango de montos, cliente.
9. **Ordenamiento**: Por fecha, total, cliente, estado.
10. **Vista de detalles**: Modal de solo lectura para ver información completa.

## Referencias

- **Arquitectura**: Ver `/salesnet/agents.md` y `/viteapp/agents.md`.
- **Sistema de diseño**: Ver `/viteapp/agents.md` sección "Sistema de diseño".
- **Componentes reutilizables**: `/viteapp/src/components/ui/`.
- **Backend**: Ver documentación de `Sales.Api`.

## Comandos Útiles

```bash
# Ejecutar frontend en desarrollo
cd viteapp
npm run dev

# Ejecutar backend
cd Sales.Api
dotnet run

# Ejecutar ambos con Docker
docker-compose up
```

## Conclusión

El módulo de Ventas está completamente integrado en el sistema Sales.Web (`viteapp`) y proporciona una interfaz moderna, intuitiva y accesible para gestionar órdenes de venta. Sigue todas las convenciones arquitectónicas y de diseño establecidas, garantizando consistencia y mantenibilidad.
