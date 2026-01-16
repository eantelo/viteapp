# Kanban Board - Ajustes de modo oscuro

## Objetivo
Mejorar la legibilidad y contraste del Kanban en modo oscuro manteniendo la estética minimalista del dashboard.

## Cambios aplicados
- **Superficies y bordes**: se reemplazaron colores fijos por tokens semánticos (`bg-card`, `border-border`, `text-foreground`).
- **Encabezado de columna**: fondo y bordes adaptados a `bg-background` con opacidad para evitar brillo excesivo en dark.
- **Tipografía**: textos secundarios migrados a `text-muted-foreground`.
- **Badges**: estados y fuentes con variantes `dark:` para mantener contraste suave.
- **Acciones de tarjetas**: hover de botones con fondos oscuros y colores accesibles.
- **Scrollbar**: pulgar con opacidad ajustada en dark para no distraer.

## Archivos afectados
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/LeadCard.tsx`
- `src/components/crm/LeadBadges.tsx`

## Validación visual sugerida
1. Cambiar a modo oscuro usando el selector de tema.
2. Revisar contraste de títulos, badges y acciones de tarjetas.
3. Verificar columnas activas (drag-over) y estado de “Arrastra leads aquí”.
