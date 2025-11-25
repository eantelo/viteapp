# Chat Widget - Funcionalidad de Redimensionamiento

## Descripción

El widget de chat ahora incluye un splitbar que permite al usuario ajustar el ancho del panel cuando está en modo "docked" (acoplado a la derecha).

## Características

### Splitbar de Redimensionamiento
- **Ubicación**: Borde izquierdo del panel de chat cuando está acoplado
- **Interacción**: Arrastrar para ajustar el ancho
- **Feedback visual**: 
  - El handle muestra un indicador con grip vertical al hacer hover
  - Cambio de color durante el arrastre
  - Cursor de redimensionamiento (`col-resize`)

### Límites de Ancho
- **Mínimo**: 300px
- **Máximo**: 800px  
- **Por defecto**: 400px

### Persistencia
El ancho del chat se guarda automáticamente en `localStorage` bajo la clave `chatWidgetWidth`, por lo que se mantiene entre sesiones del usuario.

## Implementación Técnica

### Archivos Modificados

1. **`src/contexts/ChatDockContext.tsx`**
   - Agregadas constantes para los límites del ancho
   - Nuevo estado `chatWidth` con getter y setter
   - Persistencia en `localStorage`
   - Nuevas propiedades expuestas: `chatWidth`, `setChatWidth`, `minChatWidth`, `maxChatWidth`

2. **`src/components/chat/ChatWidget.tsx`**
   - Importación del icono `GripVertical` de Lucide
   - Estado `isResizing` para controlar el arrastre
   - Handlers `handleResizeStart` y efectos de mouse para el resize
   - Renderizado del handle de resize con feedback visual
   - Ancho dinámico del panel basado en `chatWidth`

3. **`src/components/layout/DashboardLayout.tsx`**
   - Uso de `chatWidth` del contexto para el `paddingRight` dinámico
   - Removidas las clases responsivas estáticas (`sm:pr-[90%] md:pr-[450px] lg:pr-[400px]`)

### Estructura del Handle

```tsx
<div
  className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize..."
  onMouseDown={handleResizeStart}
>
  <div className="w-4 h-12 rounded-full bg-muted...">
    <GripVertical />
  </div>
</div>
```

## Uso

1. Abrir el chat widget
2. Acoplar el chat usando el botón de pin
3. Posicionar el cursor sobre el borde izquierdo del panel
4. El indicador de grip aparecerá
5. Arrastrar hacia la izquierda o derecha para ajustar el ancho
6. Soltar para fijar el nuevo tamaño

## Notas

- El redimensionamiento solo está disponible en modo acoplado (docked)
- En modo flotante, el widget mantiene su tamaño fijo de 380px
- En pantallas pequeñas (< 640px), el modo acoplado se desactiva automáticamente
