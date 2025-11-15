# Manejo de la tecla Enter en formularios

## Problema identificado

Cuando un usuario llenaba el formulario de productos y presionaba la tecla **Enter** en cualquier campo (por ejemplo, en Marca o Categoría usando el Combobox), el formulario se enviaba prematuramente aunque:

- Los campos requeridos no estuvieran completos
- El usuario no tuviera intención de enviar el formulario
- Estuviera navegando entre campos

Esto generaba errores confusos como:
> "Ya existe un producto con este código de barras"

Cuando en realidad el problema era que el formulario se envió sin estar completo.

## Solución implementada

### 1. Prevención de Enter en el Combobox

Se modificó el componente `Combobox` para que **siempre** prevenga el comportamiento por defecto de Enter:

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Prevenir Enter siempre para evitar envío del formulario
  if (e.key === "Enter") {
    e.preventDefault();
  }
  
  // ... resto del código
}
```

**Comportamiento:**
- Si el dropdown está **abierto** y hay opciones: selecciona la opción resaltada
- Si el dropdown está **cerrado** o no hay opciones: simplemente previene el envío del formulario
- El usuario puede navegar entre campos con **Tab** normalmente
- Para enviar el formulario, el usuario debe hacer **clic en el botón "Crear"/"Actualizar"**

### 2. Prevención de Enter en todos los inputs de texto

Se agregó el manejador `onKeyDown` a todos los campos Input del formulario:

```tsx
<Input
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }}
  placeholder="Ej: Laptop Dell Inspiron"
  required
/>
```

**Campos modificados:**
- ✅ Nombre
- ✅ SKU
- ✅ Código de Barras
- ✅ Precio
- ✅ Stock

### 3. Validación explícita de campos requeridos

Se agregó validación explícita al inicio de `handleSubmit` antes de procesar el formulario:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validar campos requeridos
  if (!name.trim()) {
    setError("El nombre del producto es requerido.");
    return;
  }
  
  if (!sku.trim()) {
    setError("El SKU es requerido.");
    return;
  }
  
  if (!price.trim()) {
    setError("El precio es requerido.");
    return;
  }
  
  if (!stock.trim()) {
    setError("El stock es requerido.");
    return;
  }
  
  // ... resto del código
}
```

**Beneficios:**
- Mensajes de error claros y específicos
- Evita llamadas al backend con datos incompletos
- Mejora la experiencia del usuario

## Flujo de trabajo del usuario

### Antes del fix:
1. Usuario abre "Nuevo Producto"
2. Empieza a llenar campos
3. Presiona Enter en el campo "Marca" → **¡El formulario se envía!**
4. Error confuso: "Ya existe un producto con este código de barras"

### Después del fix:
1. Usuario abre "Nuevo Producto"
2. Llena los campos navegando con Tab o clic
3. Presiona Enter en cualquier campo → **Nada sucede** (o selecciona opción en Combobox)
4. Hace clic en "Crear" cuando está listo
5. Si faltan datos → Mensaje claro: "El nombre del producto es requerido"
6. Si los datos son válidos → Producto creado exitosamente

## Casos de uso cubiertos

| Escenario | Comportamiento |
|-----------|----------------|
| Enter en Input de texto (nombre, SKU, etc.) | No envía el formulario |
| Enter en Combobox cerrado | No envía el formulario |
| Enter en Combobox abierto con opciones | Selecciona la opción resaltada |
| Enter en campo numérico (precio, stock) | No envía el formulario |
| Tab entre campos | Navega normalmente |
| Clic en botón "Crear"/"Actualizar" | Valida y envía el formulario |
| Formulario incompleto + Submit | Muestra mensaje de error específico |

## Consideraciones técnicas

### ¿Por qué no usar `type="button"` en todos los inputs?

No es una práctica estándar. Los inputs deben mantener su tipo semántico (`text`, `number`, etc.).

### ¿Por qué prevenir Enter en lugar de solo validar?

Prevenir Enter mejora la UX porque:
- Evita sorpresas (envíos accidentales)
- El usuario mantiene el control del flujo
- Es consistente con formularios largos o complejos
- Reduce llamadas innecesarias al backend

### ¿Accesibilidad?

- **Tab** funciona normalmente para navegación por teclado
- Los **screen readers** no se ven afectados
- El botón de envío sigue siendo accesible con teclado
- El formulario HTML nativo con `<form onSubmit>` mantiene su semántica

## Archivos modificados

- `viteapp/src/components/ui/combobox.tsx`
- `viteapp/src/components/products/ProductFormDialog.tsx`

## Referencias

- [MDN - Form validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [React - Handling Events](https://react.dev/learn/responding-to-events)
- [shadcn/ui - Combobox](https://ui.shadcn.com/docs/components/combobox)
