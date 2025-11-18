# Mejoras de Gestión de Clientes en Punto de Venta

## Descripción General

Se han implementado mejoras significativas en el componente de cliente en la página de Punto de Venta (POS). Ahora el sistema permite una mejor experiencia de usuario con búsqueda mejorada, información enriquecida de clientes y la capacidad de realizar ventas rápidas sin cliente identificado.

## Cambios Implementados

### 1. **Extender API de Clientes** (`src/api/customersApi.ts`)

Se agregaron nuevos campos al `CustomerDto` para enriquecer la información disponible:

```typescript
interface CustomerDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  isActive: boolean;
  // Campos nuevos:
  lastPurchaseDate?: string | null;      // Fecha de última compra
  lastPurchaseAmount?: number;           // Monto de última compra
  totalPurchases?: number;               // Total de transacciones
  loyaltyPoints?: number;                // Puntos de fidelidad
  pendingDebt?: number;                  // Deuda pendiente
}
```

### 2. **Componente CustomerSearch** (`src/components/customers/CustomerSearch.tsx`)

Componente mejorado para búsqueda de clientes con autocompletado:

- **Búsqueda en tiempo real** con debounce
- **Dropdown dinámico** que muestra resultados filtrados
- **Información en preview**: nombre, email, número de compras
- **Opciones rápidas**: crear nuevo cliente desde el dropdown
- **Cerrar al seleccionar** para mejor experiencia
- **Estilos responsivos** con soporte dark mode

#### Uso:
```tsx
<CustomerSearch
  value={customerSearchTerm}
  onChange={setCustomerSearchTerm}
  results={filteredCustomers}
  onSelect={(customer) => setCustomerId(customer.id)}
  onCreateNew={() => setIsCustomerDialogOpen(true)}
  isLoading={isLoading}
  error={error}
  placeholder="Busca por nombre o email"
  label="Buscar cliente"
/>
```

### 3. **Componente CustomerCard** (`src/components/customers/CustomerDetailCard.tsx`)

Card mejorado que muestra información enriquecida del cliente seleccionado:

#### Características:
- **Header con avatar** y nombre del cliente
- **Mini-dropdown accesible de acciones** con navegación por teclado:
  - ⬆️⬇️ Flechas para navegar entre opciones
  - ↩️ Enter para seleccionar la opción
  - Esc para cerrar
  - Mouse también funciona normalmente
  - ARIA labels para accesibilidad
  - Acciones disponibles:
    - Ver historial completo
    - Editar información
    - Ver deuda pendiente (si aplica)
    - Deseleccionar cliente
  
- **Datos de contacto**: teléfono y dirección (si disponibles)

- **Estadísticas de compra** en grid:
  - Última compra (fecha y monto)
  - Total de compras realizadas
  - Puntos de fidelidad (si aplica)
  - Deuda pendiente (si aplica)

- **Visual feedback**: colores e iconos para diferentes estados
- **Responsive design**: se adapta a diferentes tamaños de pantalla

#### Atajos de Teclado en el Dropdown:
| Tecla | Acción |
|-------|--------|
| **↓** | Siguiente opción |
| **↑** | Opción anterior |
| **Enter** | Seleccionar opción actual |
| **Escape** | Cerrar dropdown y retornar al botón |
| **Click** | Abrir/cerrar dropdown (mouse) |
| **Hover** | Mostrar opción al pasar el mouse |

#### Uso:
```tsx
<CustomerCard
  customer={selectedCustomer}
  onViewHistory={() => setDetailModalOpen(true)}
  onEdit={() => setFormDialogOpen(true)}
  onViewDebt={() => showDebtModal()}
  onRemove={() => deselectCustomer()}
  formatCurrency={formatCurrency}
  className="shadow-sm"
/>
```

#### Componente Interno: AccessibleActionDropdown
Implementación personalizada del dropdown para máxima accesibilidad:

**Características técnicas:**
- ✅ Navegación completa con teclado
- ✅ ARIA roles y attributes (menu, menuitem, aria-expanded, etc.)
- ✅ Event handlers para ArrowUp/ArrowDown/Enter/Escape
- ✅ Click-outside para cerrar automáticamente
- ✅ Focus management adecuado
- ✅ Visual feedback para item seleccionado
- ✅ Soporte para dark mode
- ✅ Tipado completo con TypeScript

### 4. **Modal CustomerDetailModal** (`src/components/customers/CustomerDetailModal.tsx`)

Modal para ver detalles completos del cliente:

#### Secciones:
- **Información de contacto**:
  - Nombre, email, teléfono
  - Dirección y RFC/Tax ID

- **Historial de compras**:
  - Última compra (con fecha relativa: "hace 3 días")
  - Total de transacciones

- **Fidelización y deuda**:
  - Puntos de fidelidad (con estilo destacado)
  - Deuda pendiente (si aplica)
  - Indicador de cliente al corriente

#### Uso:
```tsx
<CustomerDetailModal
  open={isDetailModalOpen}
  customer={selectedCustomer}
  onOpenChange={setDetailModalOpen}
  onEdit={() => editCustomer()}
  formatCurrency={formatCurrency}
/>
```

### 5. **Mejoras a CustomerFormDialog** (`src/components/customers/CustomerFormDialog.tsx`)

Se agregó validación visual de campos:

#### Validaciones:
- **Nombre**: obligatorio
- **Email**: obligatorio + validación de formato
- **Teléfono**: opcional pero mínimo 10 dígitos si se proporciona
- **Dirección y RFC**: opcionales

#### Features:
- **Indicadores visuales**: borde verde cuando el campo es válido
- **Checkmark**: muestra ✓ cuando el campo es válido
- **Mensajes de error**: aparecen bajo el campo al perder el foco
- **Botón deshabilitado**: hasta que nombre y email sean válidos
- **Estados de campo**: estilos diferentes para normal, válido, inválido

### 6. **Hook useCustomerSearch** (`src/hooks/useCustomerSearch.ts`)

Hook simplificado para gestionar la búsqueda de clientes:

```typescript
const {
  customers,
  isLoading,
  error,
  searchCustomers,
  reload,
} = useCustomerSearch();

// Búsqueda local con debounce
const { results, isSearching } = searchCustomers("Juan");
```

### 7. **Mejoras en usePointOfSale** (`src/hooks/usePointOfSale.ts`)

Se modificó para permitir ventas sin cliente identificado:

- **Cliente genérico permitido**: `customerId` puede ser cadena vacía (`""`)
- **Validación flexible**: permite cobrar con cliente genérico o específico
- **Mantiene toda la lógica existente**: descuentos, impuestos, totales

### 8. **Integración en PointOfSalePage** (`src/pages/PointOfSalePage.tsx`)

La sección Cliente fue completamente rediseñada:

#### Nuevas características:

**a) Búsqueda mejorada**:
- Campo de búsqueda con autocompletado
- Botón para crear nuevo cliente rápidamente
- Dropdown que desaparece al seleccionar

**b) Cliente genérico**:
- Botón "Venta rápida sin cliente"
- Permite cobrar sin identificar cliente
- Visual feedback clara del estado

**c) Información del cliente**:
- Muestra el `CustomerCard` cuando hay cliente seleccionado
- Información completa y actionable
- Mini-dropdown con opciones contextuales

**d) Estados claros**:
- Cliente genérico: mensaje claro
- Sin cliente: placeholder con instrucciones
- Cliente seleccionado: card completo con información

**e) Acciones de cliente**:
- Botón para crear nuevo cliente
- Botón para actualizar lista de clientes
- Opción de deseleccionar desde el card

#### Cambios en validación de cobro:
```typescript
// Antes:
disabled={isSubmitting || items.length === 0 || !customerId}

// Después:
disabled={isSubmitting || items.length === 0 || (!customerId && !isGenericCustomer)}
```

## Flujos de Uso

### Flujo 1: Venta con cliente identificado

1. Usuario escribe en búsqueda de cliente
2. Ve dropdown con clientes que coinciden
3. Selecciona un cliente
4. Se muestra `CustomerCard` con información
5. Puede ver más detalles o editar desde el dropdown del card
6. Procede a cobrar

### Flujo 2: Venta rápida sin cliente

1. Usuario hace clic en "Venta rápida sin cliente"
2. Se habilita el estado genérico
3. Puede agregar productos directamente
4. Procede a cobrar sin identificar cliente
5. La venta se registra con `customerId` vacío

### Flujo 3: Crear nuevo cliente durante POS

1. Usuario hace clic en botón de crear cliente
2. Se abre modal `CustomerFormDialog`
3. Rellena información con validación visual
4. Guarda el cliente
5. Se recarga la lista de clientes automáticamente
6. Nuevo cliente aparece disponible para seleccionar

## Mejoras de UX

### Validación Visual
- Bordes verdes para campos válidos
- Iconos de checkmark (✓) en campos correctos
- Mensajes de error contextuales
- Deshabilitación inteligente de botones

### Información Clara
- Badges para estados (recurrente, al corriente)
- Colores semánticos (ámbar para puntos, rojo para deuda)
- Iconos descriptivos para cada tipo de información

### Accesibilidad
- Labels asociados a inputs
- ARIA attributes en componentes complejos
- Navegación por teclado completa
- Contraste de colores compliant WCAG

### Performance
- Debounce en búsqueda
- Listado virtual listo para grandes datasets
- Carga lazy de datos
- Memoización de cálculos

## Integración Backend

Para que todas las mejoras funcionen correctamente, el backend debe retornar estos campos:

```csharp
public class CustomerDto
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? TaxId { get; set; }
    public bool IsActive { get; set; }
    
    // Campos nuevos (requeridos para mejoras):
    public DateTime? LastPurchaseDate { get; set; }
    public decimal? LastPurchaseAmount { get; set; }
    public int? TotalPurchases { get; set; }
    public int? LoyaltyPoints { get; set; }
    public decimal? PendingDebt { get; set; }
}
```

## Atajos de Teclado

### Punto de Venta Global
- **F3**: Enfocar búsqueda de cliente
- **F9**: Proceder a cobrar (con o sin cliente, si hay productos)

### Mini-Dropdown de Acciones de Cliente
- **↓ (ArrowDown)**: Navegar a la siguiente opción
- **↑ (ArrowUp)**: Navegar a la opción anterior
- **Enter**: Seleccionar la opción actual
- **Escape**: Cerrar el dropdown
- **Tab**: Saltar el dropdown (navegación estándar)

## Accesibilidad

### Implementación de Estándares WCAG

**CustomerCard Dropdown:**
- ✅ **ARIA Roles**: `menu`, `menuitem` para estructura semántica
- ✅ **Keyboard Navigation**: Completa con ArrowUp/Down/Enter/Escape
- ✅ **Focus Management**: Focus restaurado al botón al cerrar
- ✅ **Visual Indicators**: Elementos seleccionados con outline visible
- ✅ **Screen Reader Support**: Labels descriptivos con `aria-label`
- ✅ **Color Contrast**: Cumple con WCAG AA para todos los estados
- ✅ **Touch Friendly**: Areas de click suficientes (min 44x44px)

**CustomerFormDialog:**
- ✅ Labels asociados a inputs con `htmlFor`
- ✅ Validación visual clara (bordes coloreados)
- ✅ Mensajes de error contextuales bajo campos
- ✅ Botón de submit deshabilitado hasta validación completa
- ✅ Iconos de checkmark en campos válidos

**Mobile Friendly:**
- ✅ Dropdown responsivo para pantallas pequeñas
- ✅ Botones con área tactil suficiente
- ✅ Text legible sin zoom (min 16px)
- ✅ Scroll no bloqueado

## Testing

### Casos de prueba recomendados:

1. **Búsqueda de cliente**:
   - [ ] Escribir nombre completo
   - [ ] Escribir email parcial
   - [ ] Ver dropdown con resultados
   - [ ] Seleccionar cliente
   - [ ] Verificar que se limpie búsqueda

2. **Venta rápida sin cliente**:
   - [ ] Hacer clic en botón "Venta rápida"
   - [ ] Agregar productos
   - [ ] Cobrar sin cliente identificado
   - [ ] Verificar que la venta se guarde

3. **Creación de cliente**:
   - [ ] Validación de nombre (requerido)
   - [ ] Validación de email (formato y requerido)
   - [ ] Validación de teléfono (10+ dígitos)
   - [ ] Guardar cliente nuevo
   - [ ] Que aparezca en lista de búsqueda

4. **Información del cliente**:
   - [ ] Ver última compra en card
   - [ ] Ver total de compras
   - [ ] Ver puntos de fidelidad
   - [ ] Ver deuda pendiente
   - [ ] Abrir modal de detalles

5. **Mini-Dropdown de Acciones** (NUEVO):
   - [ ] Hacer clic en botón de 3 puntos (...)
   - [ ] Dropdown se abre correctamente
   - [ ] ↓ navega a siguiente opción
   - [ ] ↑ navega a opción anterior
   - [ ] Hover muestra opción destacada
   - [ ] Enter ejecuta opción seleccionada
   - [ ] Dropdown se cierra después de seleccionar
   - [ ] Escape cierra el dropdown
   - [ ] Click fuera cierra el dropdown
   - [ ] Focus vuelve al botón al cerrar

## Archivos Modificados

- `src/api/customersApi.ts` - Extensión de DTO
- `src/hooks/usePointOfSale.ts` - Validación flexible para cliente
- `src/pages/PointOfSalePage.tsx` - Integración de componentes nuevos
- `src/components/customers/CustomerFormDialog.tsx` - Validación visual

## Archivos Creados

- `src/components/customers/CustomerSearch.tsx` - Búsqueda con autocompletado
- `src/components/customers/CustomerDetailCard.tsx` - Card de información
- `src/components/customers/CustomerDetailModal.tsx` - Modal de detalles
- `src/hooks/useCustomerSearch.ts` - Hook de búsqueda

## Próximas Mejoras

1. **Historial completo de compras**: Modal expandido con tabla de transacciones
2. **Gestión de deuda**: Modal para registrar pagos parciales
3. **Gestor de puntos**: Interfaz para crear/usar puntos de fidelidad
4. **Sincronización en tiempo real**: WebSocket para clientes compartidos
5. **Búsqueda por teléfono**: Extender búsqueda a número de teléfono
6. **Importación de clientes**: CSV o integración con sistemas externos

## Notas para Desarrolladores

- Todos los componentes son totalmente tipados con TypeScript
- Se sigue la estructura de carpetas del proyecto existente
- Usa componentes base de shadcn/ui y Tailwind CSS
- Compatible con dark mode automáticamente
- Responsive en móvil, tablet y desktop

## Referencias

- [Documentación de PointOfSalePage](./point-of-sale.md)
- [Documentación de Clientes](./customers-module.md)
- [Atajos de Teclado](./keyboard-shortcuts.md)
