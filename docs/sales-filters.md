# Filtros de Órdenes de Venta

## Descripción

Se ha implementado un panel de filtros lateral en la página de Órdenes de Venta que permite filtrar los datos de manera más precisa y organizada.

## Ubicación

Los filtros se encuentran en una columna lateral izquierda en la página de Órdenes de Venta (`/sales`).

## Filtros Disponibles

### 1. Filtro de Estado
- **Opciones**: Todos, Completada, Cerrada, Cancelada
- **Comportamiento**: Filtra las órdenes según su estado actual

### 2. Filtro de Rango de Fechas
- **Desde**: Fecha inicial del rango
- **Hasta**: Fecha final del rango
- **Comportamiento**: Filtra órdenes entre las fechas especificadas

### 3. Filtro de Rango de Monto
- **Mínimo**: Monto mínimo de la orden
- **Máximo**: Monto máximo de la orden
- **Comportamiento**: Filtra órdenes cuyos totales estén dentro del rango especificado

## Características

### Indicador de Filtros Activos
- Badge numérico que muestra cuántos filtros están activos
- Visible solo cuando hay filtros aplicados

### Botón "Limpiar Filtros"
- Aparece automáticamente cuando hay filtros activos
- Limpia todos los filtros con un solo clic
- Resetea la página a la vista predeterminada

### Contador de Resultados
- Muestra "X de Y órdenes" cuando hay filtros activos
- Muestra "Y órdenes en total" cuando no hay filtros

### Diseño Responsivo
- Layout de dos columnas en pantallas grandes (≥1024px)
- Columna de filtros de 280px de ancho
- En móviles, se podría adaptar a un diseño de acordeón o modal

## Implementación Técnica

### Estructura de Estado

```typescript
interface SalesFilters {
  status: SaleStatus;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}
```

### Lógica de Filtrado

Los filtros se aplican de forma acumulativa mediante `useMemo`:
1. Filtro de estado
2. Filtro de fecha desde
3. Filtro de fecha hasta
4. Filtro de monto mínimo
5. Filtro de monto máximo

### Paginación

- Los filtros resetean automáticamente la página actual a 1
- La paginación se calcula sobre los datos ya filtrados

## Mejoras Futuras

- [ ] Persistir filtros en localStorage
- [ ] Agregar filtro por cliente
- [ ] Agregar filtro por número de orden
- [ ] Agregar presets de filtros comunes (Hoy, Esta semana, Este mes)
- [ ] Vista móvil con drawer o modal para filtros
- [ ] Indicadores visuales de filtros aplicados sobre las columnas
