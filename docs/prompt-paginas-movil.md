# Prompt: Optimización Mobile-First de Páginas

> Referencia rápida del skill `mobile-first`.
> Skill completo: `viteapp/.agents/skills/mobile-first/SKILL.md`

## Uso

Invocar al agente indicando la ruta o componente objetivo:

```
Aplica mobile-first a /src/pages/ProductsPage.tsx
```

El agente ejecutará el flujo completo: auditoría → plan → implementación → validación.

## Resumen de patrones aplicados

| # | Patrón | Aplica cuando |
|---|--------|---------------|
| 1 | Scroll móvil correcto | Siempre |
| 2 | Layout responsive | Siempre |
| 3 | Header robusto | Hay header con múltiples elementos |
| 4 | Tarjetas touch-friendly | Hay grids de cards interactivas |
| 5 | Bottom sheet | Hay panel lateral fijo (resumen, acciones) |
| 6 | Interacciones del sheet | Solo si aplica #5 |
| 7 | Gestos touch (swipe) | Solo si aplica #5 |
| 8 | Accesibilidad | Siempre |

Consultar el SKILL.md para la guía completa con código de referencia y checklist de validación.
