# CRM Pipeline: configuración de listas para tarjetas

## Objetivo
Permitir que el usuario defina las **listas del tablero CRM** donde se colocan las tarjetas (leads), personalizando:

- nombre de cada lista,
- orden de aparición en el tablero,
- visibilidad (mostrar/ocultar listas),
- densidad visual en móvil mediante modo compacto.

> Nota: los estados base del backend se mantienen fijos (`LeadStatus`), por lo que esta funcionalidad personaliza la experiencia de UI sin romper compatibilidad con `Sales.Api`.

## Qué se agregó

### 1) Configuración de listas en UI
En `CrmPage` se añadió el botón **"Configurar listas"**, que abre un diálogo para editar:

- etiquetas de las listas,
- orden de listas (mover arriba/abajo),
- visibilidad individual por lista.

Además, el diálogo incluye un filtro rápido **"Solo activas"** para administrar más fácil listas visibles cuando el pipeline crece.

### 2) Persistencia local
La configuración se guarda en `localStorage` con la clave:

- `salesnet.crm.pipeline.lists`

El modo compacto del tablero se guarda en:

- `salesnet.crm.pipeline.compact`

Se incluyen utilidades para:

- cargar configuración,
- normalizar/sanear valores,
- restablecer defaults,
- generar mapa de etiquetas por estado.

### 3) Kanban conectado a listas configurables
`KanbanBoard` y `KanbanColumn` ahora renderizan columnas según la configuración del usuario (nombre + orden + visibilidad), manteniendo el drag & drop y la actualización de estado al backend.

Si no hay listas visibles, el tablero muestra un estado vacío guiando al usuario para activar listas desde configuración.

### 4) Formulario de lead alineado
`LeadFormDialog` ahora acepta etiquetas de estado personalizadas para que el selector de estado muestre el mismo lenguaje del tablero.

### 5) Vista compacta
En `CrmPage` se añadió el botón de alternancia **compacto ON/OFF** para reducir ancho y espaciado de columnas/cards, mejorando la navegación horizontal en pantallas móviles.

Si no existe preferencia guardada del usuario, la vista compacta se **preconfigura automáticamente según dispositivo**:

- móvil: compacto activado,
- escritorio/tablet: compacto desactivado.

Cuando el usuario cambia manualmente el modo, aparece el botón **"Restaurar auto"** para volver al comportamiento automático por dispositivo.

## Archivos modificados

- `src/lib/crmPipelineLists.ts`
- `src/components/crm/PipelineListsDialog.tsx`
- `src/pages/CrmPage.tsx`
- `src/components/crm/KanbanBoard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/LeadBadges.tsx`
- `src/components/crm/LeadFormDialog.tsx`

## Comportamiento esperado

1. Entrar a `/crm`.
2. Click en **Configurar listas**.
3. Renombrar listas y cambiar orden.
4. Opcional: ocultar listas que no quieras ver.
5. Guardar.
6. El tablero refleja inmediatamente los cambios y los conserva al recargar la página.
7. Al editar un lead, el selector de estado usa los nuevos nombres.
8. Opcional: activar modo compacto para vista móvil más densa.
