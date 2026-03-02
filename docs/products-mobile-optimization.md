# Optimización móvil — Catálogo de Productos

**Fecha:** 2026-03-01  
**Archivo:** `src/pages/ProductCatalogPage.tsx`

---

## Problemas encontrados

| # | Problema | Patrón SKILL |
|---|----------|--------------|
| 1 | Para buscar en mobile el usuario tenía que abrir un Sheet aparte | P3 |
| 2 | Las filas del `<table>` usaban `py-2` (~16px total) — demasiado pequeño para táctil | P4 |
| 3 | El botón de acciones (DotsThree) era `h-8 w-8` (32px), por debajo del mínimo WCAG de 44px | P4 / P8 |
| 4 | El estado del producto (Activo / Sin Stock) solo se mostraba desde `sm:` — invisible en móvil | P4 |
| 5 | Las filas no daban feedback táctil al presionar | P4 |
| 6 | El badge de filtros activos no contaba la búsqueda de texto al mostrar el contador del ícono | P3 |

---

## Cambios aplicados

### 1 — Búsqueda inline en mobile

Se añadió un `<Input>` de búsqueda visible solo en mobile (`lg:hidden`) junto al botón de filtros, para que el usuario no tenga que abrir el Sheet para simplemente buscar.

```tsx
<div className="lg:hidden flex gap-2">
  <div className="flex flex-1 items-center h-10 rounded-lg border border-input bg-muted overflow-hidden">
    <MagnifyingGlass ... />
    <Input placeholder="Buscar productos..." value={search} onChange={handleSearchChange} />
  </div>
  <Sheet>...</Sheet>
</div>
```

El Sheet de filtros recibe `showSearch={false}` para no duplicar el campo de búsqueda.

### 2 — `showSearch` prop en `FilterContent`

Se añadió la prop `showSearch?: boolean` (default `true`) a `FilterContent` para ocultar el input de búsqueda cuando se usa dentro del Sheet móvil (ya que la búsqueda está ahora inline).

### 3 — Botón de filtros compacto en mobile

El botón de filtros en mobile pasó de ancho completo (`w-full`) a un botón cuadrado de ícono (`h-10 w-10`) con un badge de conteo en la esquina superior derecha, mostrando solo los filtros activos (excluyendo la búsqueda de texto).

### 4 — Touch targets más grandes en filas

Se cambió el padding vertical de las celdas del cuerpo de la tabla de `py-2` a `py-3 md:py-2`, lo que aumenta la altura de fila en mobile a ~52px (cumple el mínimo WCAG de 44px).

Celdas afectadas: nombre, SKU, marca, precio, stock, estatus, acciones.

### 5 — Botón de acciones más grande en mobile

```tsx
// Antes
className="h-8 w-8 p-0"
// Después
className="h-11 w-11 md:h-8 md:w-8 p-0"
```

En mobile: 44px × 44px. En desktop: 32px × 32px.

También se añadieron `aria-label` y `title` al trigger para accesibilidad.

### 6 — Badge de estatus inline en mobile

En la columna "Producto" (siempre visible), se añadió un mini badge de estatus visible solo en mobile (`sm:hidden`), ya que la columna "Estatus" está oculta en pantallas pequeñas.

```tsx
<span className={`sm:hidden inline-flex mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${...}`}>
  {getStatusText(product.isActive, product.stock)}
</span>
```

Colores: verde (activo), amarillo (inactivo), rojo (sin stock).

### 7 — Feedback táctil en filas

Se añadió `active:bg-muted/70` y `transition-colors` a las filas del cuerpo de la tabla para dar respuesta visual al toque.

---

## Pruebas manuales sugeridas

1. **Viewport 390px** (iPhone 14): verificar que la búsqueda inline funciona y que el Sheet solo muestra filtros.
2. Tap en una fila → debe verse el efecto `active` antes de navegar.
3. Abrir el menú de 3 puntos: el target debe ser ~44px.
4. Agregar filtros → el badge en el ícono de filtro debe mostrar el conteo correcto.
5. Verificar el badge de estatus (Activo/Inactivo/Sin Stock) visible en mobile dentro de la columna del nombre.
6. **Viewport ≥1024px (desktop)**: todo debe verse igual que antes (búsqueda en sidebar, sin cambios de layout).

---

## Resultado esperado

- Sin scroll horizontal en ningún viewport.
- Filas fáciles de tocar (>44px).
- El usuario puede buscar sin abrir un panel lateral.
- El estado del producto siempre es visible en mobile.
