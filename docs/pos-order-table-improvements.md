# Mejoras en la Tabla de Productos del POS

## Descripción General

Se ha mejorado significativamente la tabla de productos en el formulario de órdenes de venta (POS) con nuevas funcionalidades y mejor experiencia de usuario tanto en desktop como en dispositivos móviles.

## Características Implementadas

### 1. ✅ Stock Disponible Debajo del Nombre del Producto
- Muestra el SKU del producto debajo del nombre
- Información clara y accesible en cada fila

### 2. ✅ Botones +/- Más Grandes (44x44px mínimo)
- Botones de incremento/decremento con tamaño `h-11 w-11`
- Tamaño mínimo de 44x44 píxeles para fácil acceso táctil
- Iconos claros (Plus/Minus) de Tabler Icons
- Incluyen `title` para tooltip nativo

### 3. ✅ Input Numérico Editable para Cantidad
- Input clickeable que permite editar directamente la cantidad
- Estados visuales para identificar modo edición:
  - Modo lectura: border con fondo hover
  - Modo edición: input completo
- Enter o blur para confirmar cambios
- Válida que la cantidad sea > 0

### 4. ✅ Botón de Edición por Fila con Ícono de Lápiz
- Icono `IconPencil` en cada fila
- Callback `onEditProduct` para abrir panel de edición detallada (preparado para futuras mejoras)
- Tooltip que indica "Editar producto"
- Posicionado junto al botón de eliminar

### 5. ✅ Tooltip con Detalles al Hover
Muestra información completa del producto:
- Nombre del producto
- SKU
- Descripción (si disponible)
- Stock actual
- Precio unitario

**Tecnología**: Componente `TooltipProvider` y `Tooltip` de shadcn/ui

### 6. ✅ Indicador Visual de Stock Bajo
Codificación de colores:
- **🔴 Rojo/Error** (`text-error bg-error/10`): Stock < 10 unidades
- **🟠 Naranja/Warning** (`text-warning bg-warning/10`): Stock < 20 unidades
- **🟢 Verde/Success** (`text-success bg-success/10`): Stock ≥ 20 unidades

Columna de Stock:
- Muestra cantidad en unidades
- Badge con color según disponibilidad
- Tooltip que explica el estado

## Estructura Técnica

### Nuevo Componente: `OrderProductTable`

**Ubicación**: `src/components/sales/OrderProductTable.tsx`

```typescript
interface OrderProductTableProps {
  items: SaleItemForm[];
  products: ProductDto[];
  onRemoveItem: (index: number) => void;
  onItemChange: (
    index: number,
    field: keyof SaleItemForm,
    value: string | number
  ) => void;
  onEditProduct?: (index: number, product: ProductDto) => void;
  formatCurrency: (amount: number) => string;
}
```

### Características Técnicas

- **State**: Gestiona índice de fila en modo edición (`editingQuantityIndex`)
- **Cálculos**: Determina estado de stock y colores dinámicamente
- **Accesibilidad**: 
  - Labels y titles en botones
  - Tooltips descriptivos
  - Navegación por teclado (Enter para confirmar)
- **Responsividad**:
  - `min-w-[...]` en headers para ancho mínimo por columna
  - `overflow-x-auto` en contenedor para dispositivos pequeños
  - Flex layouts adaptativos

### Actualización de `SaleFormDialog`

- Importa y usa `OrderProductTable`
- Mantiene lógica de manejo de items
- Añade `handleEditProduct` para preparar expansiones futuras

## Responsividad

La tabla es completamente responsive:

### Desktop (lg+)
- Todas las columnas visibles
- Tabla ancha y espaciosa
- Botones grandes y fáciles de usar

### Tablet (md-lg)
- Scroll horizontal si es necesario
- Columns mínimas respetan tamaños
- Botones 44x44 siguen accesibles

### Mobile (sm)
- Scroll horizontal para ver todas las columnas
- Botones de 44x44px ideales para touch
- Input numérico editable compacto pero usable

## Estilos y Clases

- **Tailwind CSS**: Sistema de diseño consistente
- **Dark Mode**: Compatible con `dark:` de Tailwind
- **Colores semánticos**:
  - `text-error`, `bg-error/10` para stock bajo
  - `text-warning`, `bg-warning/10` para stock limitado
  - `text-success`, `bg-success/10` para stock disponible
- **Hover States**: Efectos visuales claros en todas las acciones

## Ejemplo de Uso

```tsx
<OrderProductTable
  items={items}
  products={products}
  onRemoveItem={handleRemoveItem}
  onItemChange={handleItemChange}
  onEditProduct={handleEditProduct}
  formatCurrency={formatCurrency}
/>
```

## Mejoras Futuras Posibles

1. **Panel de Edición Detallada**: Usar `onEditProduct` para abrir modal con más opciones
2. **Validación de Stock**: Advertir si se intenta agregar más cantidad que disponible
3. **Búsqueda en Tabla**: Filtrar productos por nombre o SKU
4. **Descuentos Especiales**: Columna para aplicar descuentos por item
5. **Historial de Cambios**: Mostrar cambios realizados durante la venta

## Testing Recomendado

- [ ] Verificar tooltips en desktop con hover
- [ ] Probar edición de cantidad en móvil
- [ ] Validar scroll horizontal en tablets
- [ ] Comprobar indicadores de stock en diferentes niveles
- [ ] Verificar modo dark/light
- [ ] Prueba de eliminación de items
- [ ] Validación de totales al cambiar cantidades

## Compatibilidad

- ✅ React 18+
- ✅ TypeScript
- ✅ Tailwind CSS 3+
- ✅ Tabler Icons
- ✅ shadcn/ui components
