# Sistema de Atajos de Teclado - Punto de Venta

## Descripción General

El sistema de atajos de teclado permite a los operadores del Punto de Venta (POS) trabajar de forma más eficiente mediante combinaciones de teclas predefinidas. El sistema está diseñado para prevenir conflictos con atajos del navegador y proporciona retroalimentación visual clara.

## Atajos Disponibles

### Búsqueda y Cliente (Azul)

| Atajo | Descripción | Acción |
|-------|-------------|--------|
| **F2** | Enfocar búsqueda de productos | Coloca el cursor en el campo de búsqueda de productos |
| **F3** | Buscar/Crear cliente | Coloca el cursor en el campo de búsqueda de clientes |

### Gestión de Orden (Púrpura)

| Atajo | Descripción | Acción |
|-------|-------------|--------|
| **F4** | Aplicar descuento | Coloca el cursor en el campo de descuento |
| **ESC** | Limpiar/Cancelar orden | Vacía todos los productos de la orden actual |
| **Ctrl+N** | Nueva venta | Limpia la orden actual para iniciar una nueva |

### Pagos y Caja (Verde)

| Atajo | Descripción | Acción |
|-------|-------------|--------|
| **F8** | Poner orden en espera | Guarda la orden actual para procesarla después |
| **F9** | Proceder a cobrar | Abre el diálogo de pago (requiere cliente seleccionado) |
| **F12** | Abrir cajón | Abre el cajón físico si está disponible |

### Historial y Ayuda

| Atajo | Descripción | Acción |
|-------|-------------|--------|
| **F1** | Mostrar ayuda | Abre este modal de ayuda con todos los atajos |
| **Ctrl+H** | Ver historial | Navega al historial de ventas |

## Características del Sistema

### 1. **Indicadores Visuales Sutiles**

Cada botón muestra el atajo asociado de dos maneras:

- **En línea**: Pequeño badge con el atajo (ej: "F2") visible en algunos botones
- **Al pasar el mouse**: Aparece el badge sobre el botón para mayor visibilidad

```tsx
<ShortcutBadge shortcut="F2" variant="outline" />
```

### 2. **Indicador Global de Tecla Presionada**

Cuando se presiona un atajo, aparece un indicador visual en la esquina superior derecha mostrando qué tecla fue presionada:

```tsx
<KeyPressIndicator 
  show={!!recentKeyPress} 
  keyLabel={recentKeyPress?.key || ''} 
/>
```

### 3. **Prevención de Conflictos**

El sistema gestiona adecuadamente los conflictos con atajos del navegador:

- **F1-F8**: Preventivamente bloqueados para evitar comportamientos del navegador
- **F9-F11**: Procesados pero no bloqueados
- **F12**: Permite que DevTools se abra en desarrollo, pero ejecuta la acción del POS
- **Escape**: No bloqueado para permitir cerrar diálogos

### 4. **Atajos Condicionalmente Habilitados**

Algunos atajos solo funcionan cuando es apropiado:

```tsx
{
  key: 'F9',
  description: 'Proceder a cobrar',
  enabled: items.length > 0 && customerId !== null,
  handler: () => handleCharge(),
}
```

- **F8, ESC, Ctrl+N**: Solo activos si hay productos en la orden
- **F9**: Solo activo si hay productos Y cliente seleccionado

## Componentes del Sistema

### 1. **Hook: `useKeyboardShortcuts`**

Maneja la configuración y detección de atajos globales.

```tsx
const { allShortcuts } = useKeyboardShortcuts([
  {
    key: 'F2',
    label: 'F2',
    description: 'Focus en búsqueda de productos',
    enabled: true,
    handler: () => {
      triggerIndicator('F2');
      focusProductSearch();
    },
  },
  // ...más atajos
]);
```

### 2. **Hook: `useKeyPressIndicator`**

Controla el estado y temporizador del indicador visual de tecla presionada.

```tsx
const { recentKeyPress, triggerIndicator } = useKeyPressIndicator();
```

### 3. **Componente: `KeyboardShortcutsModal`**

Modal que muestra todos los atajos disponibles, agrupados por categoría:

- **Búsqueda** (azul)
- **Orden** (púrpura)
- **Pagos** (verde)
- **Historial** (ámbar)

### 4. **Componente: `KeyPressIndicator`**

Badge flotante que indica la última tecla presionada. Se muestra durante 400ms.

```tsx
<KeyPressIndicator 
  show={!!recentKeyPress} 
  keyLabel={recentKeyPress?.key || ''} 
/>
```

### 5. **Componente: `ShortcutBadge`**

Badge pequeño e integrado que muestra un atajo en los botones.

```tsx
<ShortcutBadge shortcut="F2" variant="outline" />
```

## Flujo de Uso

### Ejemplo: Procesar una venta completa

1. **F2** → Enfocar búsqueda de productos
2. Escanear/buscar productos
3. **F3** → Buscar cliente (si es nuevo)
4. Seleccionar cliente
5. **F4** → Aplicar descuento (si aplica)
6. **F9** → Proceder al pago
7. Completar pago en el diálogo

### Ejemplo: Pausar y reanudar orden

1. Agregar productos
2. **F8** → Poner orden en espera
3. Procesar otro cliente
4. Botón "Reanudar orden guardada"

## Configuración Técnica

### Normalización de Teclas

El sistema normaliza las teclas para detectar:

- **Funciones (F1-F12)**: Detectadas por `code` (ej: "F1", "F2")
- **Escape**: Detectado por `key === 'Escape'`
- **Ctrl+Letra**: Detectado cuando `ctrlKey` o `metaKey` está activo

```tsx
const getNormalizedKey = (event: KeyboardEvent): string => {
  if (code?.startsWith('F') && !isNaN(parseInt(code.substring(1)))) {
    return code; // "F1", "F2", etc.
  }
  if (key === 'Escape') {
    return 'Escape';
  }
  if (event.ctrlKey || event.metaKey) {
    return `Ctrl+${key.toUpperCase()}`;
  }
  return '';
};
```

### Prevención por Defecto

Se usa `preventDefault()` selectivamente:

```tsx
if (normalizedKey === 'F12') {
  event.preventDefault(); // Permitir DevTools pero ejecutar nuestro handler
} else if (normalizedKey !== 'F1') {
  event.preventDefault(); // Prevenir otros comportamientos
}
```

## Mejoras Futuras

- [ ] Permitir personalizar atajos por usuario
- [ ] Guardar preferencias en localStorage
- [ ] Soporte para atajos con múltiples teclas (ej: Ctrl+Alt+N)
- [ ] Sonido o vibración al presionar atajo
- [ ] Mostrar "carril" de atajos disponibles al inicio
- [ ] Integraciones con hardware (cajón, impresora térmica)
- [ ] Historial de atajos presionados en sesión

## Testing

### Casos de Prueba

- [ ] F2 enfoca búsqueda de productos
- [ ] F3 enfoca búsqueda de cliente
- [ ] F4 enfoca campo de descuento
- [ ] F8 solo activo con productos en orden
- [ ] F9 solo activo con cliente seleccionado
- [ ] ESC limpia orden
- [ ] F1 abre modal de ayuda
- [ ] Indicador visual aparece al presionar atajo
- [ ] Modal cierra cuando presiona ESC
- [ ] Atajos no interfieren con inputs de texto

## Referencias

- Hook: `/src/hooks/useKeyboardShortcuts.ts`
- Hook: `/src/hooks/useKeyPressIndicator.ts`
- Modal: `/src/components/keyboard/KeyboardShortcutsModal.tsx`
- Indicador: `/src/components/keyboard/KeyPressIndicator.tsx`
- Badge: `/src/components/keyboard/ShortcutBadge.tsx`
- Implementación: `/src/pages/PointOfSalePage.tsx`
