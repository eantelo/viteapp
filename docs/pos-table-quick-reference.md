# Quick Reference - Tabla de Productos POS

## 📋 Checklist de Mejoras Implementadas

- ✅ **Stock Disponible**: Mostrado debajo del nombre (SKU)
- ✅ **Botones Grandes**: 44x44px (`h-11 w-11`)
- ✅ **Input Editable**: Click para editar, Enter para confirmar
- ✅ **Botón Editar**: Con icono lápiz (`IconPencil`)
- ✅ **Tooltips**: Información completa al hover
- ✅ **Indicador Stock**: 🔴 Bajo (<10), 🟠 Limitado (10-20), 🟢 Disponible (≥20)
- ✅ **Responsive**: Mobile, Tablet, Desktop

## 🎨 Colores del Sistema

| Estado | Clase | Color | Uso |
|--------|-------|-------|-----|
| Error | `text-error bg-error/10` | Rojo | Stock < 10 |
| Warning | `text-warning bg-warning/10` | Naranja | Stock 10-20 |
| Success | `text-success bg-success/10` | Verde | Stock ≥ 20 |

## 🧩 Componentes Utilizados

```tsx
import OrderProductTable from "@/components/sales/OrderProductTable";

<OrderProductTable
  items={items}                  // Array de SaleItemForm
  products={products}            // Array de ProductDto
  onRemoveItem={handleRemove}    // (index: number) => void
  onItemChange={handleChange}    // (index, field, value) => void
  onEditProduct={handleEdit}     // (index, product) => void (opcional)
  formatCurrency={format}        // (amount: number) => string
/>
```

## 📱 Ancho Mínimo de Columnas

```css
Producto:    min-w-[200px]
Stock:       min-w-[100px]
Cantidad:    min-w-[140px]
Precio:      min-w-[120px]
Subtotal:    min-w-[120px]
Acciones:    min-w-[80px]
```

## 🖱️ Interacciones Clave

| Acción | Evento | Resultado |
|--------|--------|-----------|
| Click en "-" | `handleDecrement()` | Cantidad -1 |
| Click en "+" | `handleIncrement()` | Cantidad +1 |
| Click en número | `setEditingQuantityIndex()` | Activa input |
| Enter en input | `onBlur` | Confirma cambio |
| Click en ✎ | `onEditProduct()` | Callback preparado |
| Click en 🗑 | `onRemoveItem()` | Elimina producto |

## 🛠️ Funciones Internas

```typescript
// Determina estado de stock (low, medium, healthy)
getStockStatus(stock: number): string

// Retorna clases Tailwind para color
getStockColor(stock: number): string

// Incrementa cantidad
handleIncrement(index: number, quantity: number): void

// Decrementa cantidad (mínimo 1)
handleDecrement(index: number, quantity: number): void

// Edita cantidad desde input
handleQuantityInputChange(index: number, value: string): void
```

## 📊 Ejemplo Completo

```tsx
const [items, setItems] = useState<SaleItemForm[]>([
  {
    productId: "uuid-1",
    productName: "Laptop ASUS",
    quantity: 2,
    price: 899.99,
    subtotal: 1799.98
  }
]);

const products = [
  {
    id: "uuid-1",
    name: "Laptop ASUS",
    sku: "LAPTOP-001",
    price: 899.99,
    stock: 8,
    isActive: true
  }
];

<OrderProductTable
  items={items}
  products={products}
  onRemoveItem={(idx) => setItems(items.filter((_, i) => i !== idx))}
  onItemChange={(idx, field, val) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setItems(newItems);
  }}
  onEditProduct={(idx, prod) => console.log("Edit:", idx, prod)}
  formatCurrency={(amt) => `$${amt.toFixed(2)}`}
/>
```

## 🎯 Requisitos de Datos

### SaleItemForm
```typescript
interface SaleItemForm {
  productId: string;      // UUID del producto
  productName: string;    // Nombre para mostrar
  quantity: number;       // Cantidad (> 0)
  price: number;          // Precio unitario
  subtotal: number;       // quantity × price
}
```

### ProductDto
```typescript
interface ProductDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}
```

## ⚙️ Props

```typescript
interface OrderProductTableProps {
  // Items de la orden actual
  items: SaleItemForm[];
  
  // Datos de productos (para tooltips)
  products: ProductDto[];
  
  // Callback para eliminar item
  onRemoveItem: (index: number) => void;
  
  // Callback para cambiar propiedad del item
  onItemChange: (
    index: number,
    field: keyof SaleItemForm,
    value: string | number
  ) => void;
  
  // Callback para edición futura (opcional)
  onEditProduct?: (index: number, product: ProductDto) => void;
  
  // Función para formatear moneda
  formatCurrency: (amount: number) => string;
}
```

## 🚀 Integración en SaleFormDialog

```tsx
import { OrderProductTable } from "./OrderProductTable";

// En el JSX:
{items.length > 0 && (
  <OrderProductTable
    items={items}
    products={products}
    onRemoveItem={handleRemoveItem}
    onItemChange={handleItemChange}
    onEditProduct={handleEditProduct}
    formatCurrency={formatCurrency}
  />
)}
```

## 📝 Estado de Edición

```typescript
// Únicamente un índice puede estar en edición
const [editingQuantityIndex, setEditingQuantityIndex] = useState<
  number | null
>(null);

// Se activa con click:
onClick={() => setEditingQuantityIndex(index)}

// Se desactiva con blur o Enter:
onBlur={() => setEditingQuantityIndex(null)}
onKeyDown={(e) => e.key === "Enter" && setEditingQuantityIndex(null)}
```

## 🎬 Estados de la UI

### Sin Items
```
┌─────────────────────────────────────────┐
│  No hay productos agregados.             │
│  Selecciona productos desde arriba.      │
└─────────────────────────────────────────┘
```

### Con Items
```
┌─────────────────────────────────────────┐
│ [Tabla con productos]                   │
├─────────────────────────────────────────┤
│ Total: $2,349.94                        │
└─────────────────────────────────────────┘
```

## 🔍 Debugging Tips

```typescript
// Verificar orden de items
console.log("Items:", items);

// Verificar match de productId
console.log("Products:", products);

// Verificar estado de edición
console.log("Editing index:", editingQuantityIndex);

// Verificar cálculos de stock
console.log("Stock status:", getStockStatus(8)); // "low"
```

## 📚 Documentación Relacionada

- `viteapp/docs/pos-order-table-improvements.md` - Guía completa
- `viteapp/docs/pos-table-visual-guide.md` - Guía visual detallada
- `viteapp/docs/point-of-sale.md` - Documentación general del POS

## ✨ Mejoras Futuras

1. **Validación de Stock**: Alerta si cantidad > stock
2. **Descuentos**: Campo para descuento por item
3. **Búsqueda**: Filtro en tabla grande
4. **Panel Edición**: Modal con más opciones

---

**Última actualización**: Noviembre 17, 2025  
**Versión**: 1.0  
**Estado**: ✅ Producción
