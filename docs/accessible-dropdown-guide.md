# Mini-Dropdown Accesible - Guía de Uso

## Descripción

El mini-dropdown de acciones en el `CustomerCard` es un componente personalizado totalmente accesible que permite:

1. **Navegación con flechas** (↑/↓)
2. **Selección con Enter** (↩️)
3. **Cierre con Escape** (Esc)
4. **Soporte completo para mouse**
5. **ARIA labels** para lectores de pantalla

## Ubicación

El dropdown se encuentra en el header del `CustomerCard`, como un botón con 3 puntos (`...`) que aparece al pasar el mouse.

## Cómo Usar

### Con Mouse

1. **Hacer clic** en el botón `...` (tres puntos)
2. El dropdown se abre mostrando las opciones disponibles
3. **Hover** sobre una opción la destaca
4. **Hacer clic** en una opción la ejecuta
5. El dropdown se cierra automáticamente

### Con Teclado

1. **Hacer clic** en el botón `...` O **Tab** para navegarlo y **Enter** para abrirlo
2. El dropdown se abre
3. **Flecha Abajo (↓)**: Navega a la siguiente opción
4. **Flecha Arriba (↑)**: Navega a la opción anterior (circular)
5. **Enter**: Ejecuta la opción seleccionada
6. **Escape**: Cierra el dropdown (focus regresa al botón)

### Combinado (Mouse + Teclado)

1. **Click** para abrir
2. **Flechas** para navegar entre opciones
3. **Hover** para cambiar selección visual
4. **Enter** para ejecutar la opción actual
5. **Escape** para cerrar

## Opciones Disponibles

Las opciones que aparecen dependen de los datos del cliente:

| Opción | Siempre | Condición |
|--------|--------|-----------|
| 📋 Ver historial completo | Sí | - |
| ✏️ Editar información | Sí | - |
| ⚠️ Ver deuda pendiente | No | `customer.pendingDebt > 0` |
| ❌ Deseleccionar | Sí | - |

## Flujos de Ejemplo

### Ejemplo 1: Editar cliente con mouse
```
1. Cliente seleccionado → Card visible
2. Click en botón "..."
3. Dropdown se abre
4. Hover en "Editar información"
5. Click en "Editar información"
6. Se abre modal de edición
7. Dropdown se cierra automáticamente
```

### Ejemplo 2: Ver historial con teclado
```
1. Cliente seleccionado → Card visible
2. Tab hasta el botón "..."
3. Enter para abrir dropdown
4. ↓ ↓ para navegar a "Ver historial completo"
5. Enter para ejecutar
6. Se abre modal de historial
7. Dropdown se cierra automáticamente
```

### Ejemplo 3: Ver deuda con combinación mouse+teclado
```
1. Cliente con deuda seleccionado
2. Click en botón "..."
3. ↑ para navegar arriba
4. ↑ para ir a "Ver deuda pendiente"
5. Enter para ejecutar
6. Se abre información de deuda
```

## Características de Accesibilidad

### Para Usuarios de Teclado
- ✅ **Tab navigation**: Puedes hacer Tab hasta el botón
- ✅ **Arrow keys**: Completa navegación con flechas
- ✅ **Enter**: Selecciona la opción actual
- ✅ **Escape**: Cierra el dropdown
- ✅ **Focus visible**: Puedes ver dónde está el focus

### Para Usuarios de Lectores de Pantalla
- ✅ **aria-label**: "Opciones del cliente"
- ✅ **aria-expanded**: Indica si está abierto o cerrado
- ✅ **aria-haspopup**: Indica que abre un menú
- ✅ **role="menu"**: Estructura semántica correcta
- ✅ **role="menuitem"**: Cada opción es un item de menú

### Para Usuarios de Mouse
- ✅ **Visual feedback**: Hover muestra la opción
- ✅ **Highlight clear**: Selección visual clara
- ✅ **Click anywhere**: Puedes hacer click fuera para cerrar
- ✅ **Responsive**: Funciona en mobile también

## Estados Visuales

### Botón Normal
- Tres puntos grises (...)
- Semitransparente (opacity-0)

### Botón Hover
- Se vuelve opaco (opacity-100)
- Cambia cursor a pointer
- Indica que es interactivo

### Dropdown Abierto
- Fondo blanco (dark: slate-900)
- Borde y sombra visible
- Posicionado al lado derecho del botón

### Opción Hover
- Background claro (slate-100 / dark: slate-800)
- Transición suave
- Indica que es clickeable

### Opción Seleccionada (Teclado)
- Background igual al hover
- Outline visible (primary color)
- Indica cuál será ejecutada

### Opción Peligrosa (Deuda/Deseleccionar)
- Texto rojo (destructive)
- Background rojo al hover
- Advierte sobre acción destructiva

## Notas Técnicas

### Componente: AccessibleActionDropdown

**Props:**
```typescript
{
  hasPendingDebt: boolean;
  onViewHistory?: () => void;
  onEdit?: () => void;
  onViewDebt?: () => void;
  onRemove?: () => void;
}
```

**Estado Interno:**
- `isOpen`: boolean - Si el dropdown está abierto
- `selectedIndex`: number - Índice de opción seleccionada
- `menuRef`: ref al contenedor del dropdown
- `buttonRef`: ref al botón

**Event Listeners:**
- `keydown` en window (mientras isOpen)
- `mousedown` en window (para cerrar fuera)
- Auto-cleanup de listeners

**Performance:**
- UseEffect para cleanup automático
- Refs para evitar re-renders innecesarios
- Memoización de array de acciones

## Ventajas sobre Dropdown de shadcn/ui

| Aspecto | Custom | shadcn/ui |
|--------|--------|-----------|
| Control | ✅ Total | Limited |
| Keyboard | ✅ Personalizado | Automático |
| Accesibilidad | ✅ ARIA manual | Incluido |
| Flexibilidad | ✅ Alta | Media |
| Tamaño | ✅ Pequeño | Larger |
| Apariencia | ✅ Consistente | Predefinida |
| Mantenimiento | ⚠️ Manual | Actualizado |

## Troubleshooting

### El dropdown no abre
- Verifica que no haya `pointer-events: none` en el botón
- Comprueba que `onClick` no esté bloqueado

### Las flechas no funcionan
- Asegúrate de que el dropdown esté abierto (`isOpen === true`)
- Verifica que el event listener de keydown esté activo
- Prueba con Alt+↓ si hay conflictos globales

### El focus no regresa al botón
- Verifica que `buttonRef.current` existe
- Comprueba que el botón es focusable

### El dropdown no se cierra
- Verifica el listener de `mousedown` externo
- Prueba a hacer click fuera del área

## Futuras Mejoras

1. **Animaciones**: Fade-in/out del dropdown
2. **Sub-menús**: Opciones con sub-opciones
3. **Búsqueda**: Filtrar opciones al escribir
4. **Posición inteligente**: Reposicionar si toca borde
5. **Touch events**: Optimizar para touch devices
6. **Virtualization**: Para muchas opciones
