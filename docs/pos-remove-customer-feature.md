# Funcionalidad: Remover Cliente Seleccionado en Punto de Venta

## Propósito

Permitir al usuario quitar/deseleccionar el cliente actualmente seleccionado en el Punto de Venta para poder seleccionar otro cliente o cambiar a venta rápida sin cliente.

## Cambios Implementados

### 1. **Nuevo Handler: `handleRemoveCustomer`**

Se agregó un handler específico en `PointOfSalePage.tsx` que:

- Limpia el `customerId`
- Resetea el término de búsqueda de cliente
- Desactiva el modo de cliente genérico
- Cierra el dropdown de búsqueda
- Resetea el índice de selección
- Muestra un toast informativo al usuario

```typescript
const handleRemoveCustomer = () => {
  setCustomerId("");
  setCustomerSearchTerm("");
  setIsGenericCustomer(false);
  setCustomerSearchOpen(false);
  setSelectedCustomerIndex(-1);
  toast({
    title: "Cliente removido",
    description: "Puedes seleccionar otro cliente o usar venta rápida",
  });
};
```

### 2. **Botón Visible "Cambiar Cliente"**

Se agregó un botón claramente visible debajo del `CustomerCard` que permite cambiar de cliente con un solo clic:

```tsx
<Button
  variant="outline"
  size="sm"
  className="w-full"
  onClick={handleRemoveCustomer}
>
  <IconUserX className="size-4 mr-2" />
  Cambiar cliente
</Button>
```

**Características del botón:**
- Variante `outline` para distinguirlo de acciones primarias
- Ícono `IconUserX` que indica claramente la acción de remover/cambiar
- Ancho completo para ser fácilmente accesible
- Texto descriptivo "Cambiar cliente"

### 3. **Integración con CustomerCard**

El `CustomerCard` ya incluía una opción "Deseleccionar" en su dropdown de acciones. Esta funcionalidad ahora usa el nuevo handler `handleRemoveCustomer` para mantener consistencia:

```tsx
<CustomerCard
  customer={customers.find((c) => c.id === customerId) || null}
  onViewHistory={() => { /* ... */ }}
  onEdit={() => setIsCustomerDialogOpen(true)}
  onRemove={handleRemoveCustomer}  // ← Usa el nuevo handler
  formatCurrency={formatCurrency}
  className="shadow-sm"
/>
```

## Flujos de Uso

### Flujo 1: Cambiar Cliente mediante Botón Visible

1. Usuario tiene un cliente seleccionado (muestra `CustomerCard`)
2. Hace clic en el botón "Cambiar cliente" debajo del card
3. Se limpia la selección actual
4. Se muestra toast: "Cliente removido - Puedes seleccionar otro cliente o usar venta rápida"
5. Usuario puede:
   - Buscar y seleccionar otro cliente
   - Crear un nuevo cliente
   - Usar "Venta rápida sin cliente"

### Flujo 2: Cambiar Cliente mediante Dropdown del CustomerCard

1. Usuario tiene un cliente seleccionado
2. Hace clic en el botón de opciones (tres puntos) en el `CustomerCard`
3. Se abre dropdown con opciones disponibles
4. Selecciona "Deseleccionar"
5. Se limpia la selección con el mismo comportamiento que el Flujo 1

### Flujo 3: Navegación por Teclado (CustomerCard Dropdown)

El dropdown del `CustomerCard` es completamente accesible:
- `ArrowDown` / `ArrowUp`: navegar entre opciones
- `Enter`: ejecutar la acción seleccionada
- `Escape`: cerrar dropdown y devolver foco al botón

## Beneficios

### Para el Usuario

- **Claridad**: Botón visible y explícito para cambiar de cliente
- **Flexibilidad**: Dos formas de acceder a la funcionalidad (botón + dropdown)
- **Retroalimentación**: Toast informativo confirma la acción
- **Sin pérdida de datos**: Solo se limpia el cliente, no los productos en el carrito

### Para el Sistema

- **Consistencia**: Un único handler (`handleRemoveCustomer`) para toda la lógica
- **Estado limpio**: Resetea todos los estados relacionados con cliente
- **Accesibilidad**: Soporte para navegación por mouse y teclado
- **Mantenibilidad**: Código centralizado y fácil de modificar

## Estados Relacionados

La funcionalidad maneja correctamente todos los estados:

| Estado | Antes | Después |
|--------|-------|---------|
| `customerId` | ID del cliente | `""` (vacío) |
| `customerSearchTerm` | Cualquier valor | `""` (vacío) |
| `isGenericCustomer` | `true` o `false` | `false` |
| `customerSearchOpen` | `true` o `false` | `false` |
| `selectedCustomerIndex` | Cualquier índice | `-1` |

## Consideraciones de UX

1. **No afecta el carrito**: Los productos agregados permanecen intactos
2. **Reversible**: El usuario puede volver a seleccionar el mismo cliente
3. **Sin confirmación**: Acción inmediata sin diálogos de confirmación (es segura)
4. **Visual feedback**: Toast proporciona confirmación visual de la acción

## Casos de Uso Comunes

### Caso 1: Cliente Equivocado
- Cajero selecciona cliente A por error
- Hace clic en "Cambiar cliente"
- Busca y selecciona cliente B correcto
- Procede con la venta

### Caso 2: De Cliente Identificado a Venta Rápida
- Cajero inicia venta con cliente identificado
- Cliente solicita venta sin registro
- Cajero hace clic en "Cambiar cliente"
- Activa "Venta rápida sin cliente"
- Completa la transacción anónima

### Caso 3: Exploración de Clientes
- Cajero no está seguro del cliente correcto
- Selecciona un cliente para ver sus datos
- Hace clic en "Cambiar cliente"
- Prueba con otro cliente
- Repite hasta encontrar el correcto

## Archivos Modificados

### `src/pages/PointOfSalePage.tsx`

**Imports:**
```typescript
import {
  // ... otros imports
  IconUserX,  // ← Nuevo ícono para el botón
} from "@tabler/icons-react";
```

**Handlers:**
- Agregado: `handleRemoveCustomer()`
- Modificado: `handleSelectCustomer()` (sin cambios en lógica, solo para contexto)

**UI:**
- Agregado botón "Cambiar cliente" después del `CustomerCard`
- Actualizado prop `onRemove` del `CustomerCard` para usar `handleRemoveCustomer`

## Testing Manual

Para probar la funcionalidad:

1. **Preparación:**
   - Navegar a `/pos`
   - Tener al menos 2 clientes en el sistema

2. **Test básico:**
   - Seleccionar un cliente
   - Verificar que aparece el `CustomerCard`
   - Hacer clic en "Cambiar cliente"
   - Verificar toast de confirmación
   - Verificar que el card desaparece y muestra placeholder

3. **Test de integración:**
   - Seleccionar cliente A
   - Agregar productos al carrito
   - Cambiar a cliente B
   - Verificar que los productos permanecen
   - Completar venta
   - Verificar que la venta se asigna a cliente B

4. **Test de accesibilidad:**
   - Usar solo teclado para:
     - Seleccionar cliente (búsqueda + Enter)
     - Abrir dropdown del CustomerCard (Tab + Enter)
     - Navegar con flechas
     - Seleccionar "Deseleccionar" con Enter

## Mejoras Futuras (Opcionales)

1. **Atajo de teclado**: Agregar `Ctrl+Alt+C` para cambiar cliente rápidamente
2. **Historial de clientes**: Recordar últimos N clientes seleccionados para cambio rápido
3. **Confirmación condicional**: Si hay productos valiosos, mostrar confirmación
4. **Sugerencias**: Al remover, sugerir clientes similares o frecuentes
5. **Analytics**: Trackear frecuencia de cambio de cliente para mejorar UX

## Referencias

- Componente relacionado: `CustomerCard` (`src/components/customers/CustomerDetailCard.tsx`)
- Hook relacionado: `usePointOfSale` (`src/hooks/usePointOfSale.ts`)
- Documentación base: `docs/point-of-sale.md`
- Mejoras previas: `docs/pos-customer-improvements.md`
