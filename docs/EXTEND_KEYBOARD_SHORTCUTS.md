# 🔧 Extender Sistema de Atajos de Teclado

## Cómo Agregar Nuevos Atajos

Agregar un nuevo atajo es muy simple. Sigue estos pasos:

### 1. Agregar el Atajo en PointOfSalePage.tsx

En el hook `useKeyboardShortcuts()`, agrega un nuevo objeto:

```tsx
const { allShortcuts } = useKeyboardShortcuts([
  // ... atajos existentes ...
  
  // TU NUEVO ATAJO
  {
    key: 'F5', // O la combinación que desees
    label: 'F5',
    description: 'Revertir último producto',
    enabled: items.length > 0, // Opcional: condicionar habilitación
    handler: () => {
      triggerIndicator('F5');
      removeLastProduct(); // Tu función aquí
    },
  },
]);
```

### 2. Tipos Soportados de Atajos

```tsx
// Funciones (F1-F12)
key: 'F1'  // Automáticamente detecta por 'code'
key: 'F5'
key: 'F12'

// Especiales
key: 'Escape'

// Con Ctrl/Cmd
key: 'Ctrl+N'
key: 'Ctrl+H'
key: 'Ctrl+S'
```

### 3. Agregar UI al Botón (Opcional)

Si tienes un botón para tu acción, agrega el badge:

```tsx
<Button
  onClick={handleYourAction}
  className="flex-1 group relative"
  title="F5 para revertir"
>
  <IconArrowLeft className="size-4" />
  Revertir
  <ShortcutBadge 
    shortcut="F5" 
    variant="outline" 
    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
  />
</Button>
```

### 4. Actualizar Documentación

Actualiza `docs/keyboard-shortcuts.md` y `docs/QUICK_KEYS_REFERENCE.md` para incluir tu nuevo atajo.

---

## Ejemplos Avanzados

### Atajo Condicionalmente Habilitado

```tsx
{
  key: 'F6',
  label: 'F6',
  description: 'Duplicar último producto',
  enabled: items.length > 0, // Solo funciona si hay items
  handler: () => {
    triggerIndicator('F6');
    const lastItem = items[items.length - 1];
    if (lastItem) {
      addProductToOrder(lastItem);
    }
  },
}
```

### Atajo que Abre Un Diálogo

```tsx
{
  key: 'F7',
  label: 'F7',
  description: 'Abrir configuración rápida',
  handler: () => {
    triggerIndicator('F7');
    setIsSettingsDialogOpen(true); // Tu estado
  },
}
```

### Atajo con Validación

```tsx
{
  key: 'Ctrl+P',
  label: 'Ctrl+P',
  description: 'Imprimir ticket',
  enabled: items.length > 0 && total > 0,
  handler: async () => {
    triggerIndicator('Ctrl+P');
    
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Selecciona un cliente primero',
        variant: 'destructive',
      });
      return;
    }
    
    await printTicket();
  },
}
```

---

## Casos de Uso Sugeridos

### Inventario Rápido
```tsx
{ key: 'Ctrl+I', handler: () => openInventoryQuickView() }
```

### Cambio de Modo
```tsx
{ key: 'Ctrl+M', handler: () => switchToRetailMode() }
```

### Búsqueda de Ofertas
```tsx
{ key: 'Ctrl+O', handler: () => openCurrentOffers() }
```

### Devolver Producto
```tsx
{ key: 'Ctrl+R', handler: () => openReturnDialog() }
```

### Cambio de Caja
```tsx
{ key: 'Ctrl+B', handler: () => openCashierSwitch() }
```

---

## Consideraciones de Diseño

### ✅ Buenas Prácticas

1. **Agrupar atajos lógicamente**
   - F1-F9 para acciones principales
   - Ctrl+ para acciones secundarias

2. **Usar nombres descriptivos**
   ```tsx
   description: 'Revertir último producto agregado'
   // Mejor que:
   description: 'Revertir'
   ```

3. **Siempre mostrar indicador**
   ```tsx
   triggerIndicator('F5'); // Siempre al inicio
   ```

4. **Prevenir acciones no válidas**
   ```tsx
   enabled: items.length > 0, // No ejecutar si no aplica
   ```

### ❌ Evitar

1. **No conflictuar con atajos del navegador**
   - No usar Ctrl+W, Ctrl+T, Ctrl+Q, etc.

2. **No usar Shift+ sin buena razón**
   - Complica la entrada para usuarios

3. **No hacer atajos demasiado complejos**
   - Máximo 2 teclas: F-key o Ctrl+Letter

4. **No cambiar comportamiento dinámicamente**
   - El mismo atajo siempre hace la misma cosa

---

## Testing

Después de agregar un atajo, prueba:

```bash
# 1. Compilar sin errores
npm run build

# 2. Ver en desarrollo
npm run dev

# 3. Pruebas manuales
- Presionar el atajo varios veces
- Verificar que se muestre el indicador
- Verificar que funcione solo cuando está habilitado
- Verificar que no interfiera con inputs de texto
- Presionar F1 para ver en el modal
```

---

## Referencia de Archivos

- **Hooks**: `src/hooks/useKeyboardShortcuts.ts`
- **Componentes**: `src/components/keyboard/`
- **Página**: `src/pages/PointOfSalePage.tsx`
- **Tipos**: `src/hooks/useKeyboardShortcuts.ts` (interfaz KeyboardShortcut)

---

## Preguntas Frecuentes

### ¿Puedo cambiar un atajo existente?
Sí, edita la `key` en el array de atajos. TypeScript te advertirá si te equivocas.

### ¿Qué pasa si presiono un atajo deshabilitado?
Nada. El `enabled: false` previene que se ejecute el handler.

### ¿Puedo desactivar un atajo?
Sí, establece `enabled: false` o remueve el objeto del array.

### ¿Cómo hago un atajo de 3 teclas?
No está soportado directamente. Usa 2 teclas o implementa en el componente custom.

### ¿Los atajos funcionan en inputs de texto?
Depende. Los F-keys sí, pero Ctrl+Letter se captura incluso en inputs.

---

## Soporte

¿Preguntas o problemas?
- Revisa `docs/keyboard-shortcuts.md` para más detalles
- Consulta los ejemplos en `PointOfSalePage.tsx`
- Abre un issue en el repositorio
