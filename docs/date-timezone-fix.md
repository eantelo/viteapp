# Fix: Corrección de Desfase de Fechas (Timezone Issue)

## Problema Identificado

Las fechas en el sistema estaban mostrando un día anterior (ej: 16 de enero se mostraba como 15 de enero). Esto ocurría especialmente en México (GMT-6).

### Causa Raíz

El problema estaba en múltiples lugares donde se usaba `new Date().toISOString().split("T")[0]` para obtener la fecha del día:

```typescript
// ❌ INCORRECTO - Devuelve UTC
const today = new Date().toISOString().split("T")[0]; // Si es 16 en local, puede ser 15 en UTC
```

Cuando el cliente está en una zona horaria positiva (como México, UTC-6), `toISOString()` devuelve una fecha diferente porque convierte a UTC.

## Solución Implementada

### 1. Nuevo módulo `dateUtils.ts`

Se creó un módulo con funciones auxiliares para manejar fechas de forma consistente:

```typescript
// ✅ CORRECTO - Devuelve fecha local
export function getTodayDateString(): string {
  const now = new Date();
  return formatDateToISO(now); // Usa zona horaria local
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convierte fechas locales YYYY-MM-DD a UTC ISO strings para el servidor
export function dateRangeToUTC(fromDateStr: string, toDateStr: string) {
  return {
    from: dateStringToUTC(fromDateStr),      // 2025-01-16 → 2025-01-16T00:00:00.000Z
    to: dateStringToUTCEndOfDay(toDateStr), // 2025-01-16 → 2025-01-16T23:59:59.000Z
  };
}
```

### 2. Actualizaciones en `SalesPage.tsx`

- Se importó `dateUtils` con todas las funciones necesarias
- Se actualizó `getDateRangeFromPreset()` para usar `getTodayDateString()`, `getYesterdayDateString()`, etc.
- Se actualizó `loadData()` para convertir fechas locales a UTC antes de enviar al servidor

```typescript
const loadData = async () => {
  const dateRange = getDateRangeFromPreset(datePreset);
  // Convertir fechas locales a UTC ISO strings
  const utcDateRange = dateRangeToUTC(dateRange.from, dateRange.to);
  
  const params: SalesHistoryParams = {
    dateFrom: utcDateRange.from,
    dateTo: utcDateRange.to,
    limit: 50,
  };
  // ...
};
```

### 3. Actualizaciones en `DashboardPage.tsx`

- Se importó `getTodayRangeUTC()` de `dateUtils`
- Se reemplazó el cálculo manual de fechas con `getTodayRangeUTC()`

```typescript
const utcRange = getTodayRangeUTC();
const [statsData, historyData] = await Promise.all([
  getSalesStatistics(utcRange.from, utcRange.to),
  getSalesHistory({
    dateFrom: utcRange.from,
    dateTo: utcRange.to,
    limit: 5,
  }),
]);
```

### 4. Actualizaciones en `SaleUpsertPage.tsx`

- Se importó `getTodayDateString()` de `dateUtils`
- Se actualizó el estado inicial de `saleDate` para usar esta función

```typescript
const [saleDate, setSaleDate] = useState(getTodayDateString);
```

## Cómo Funciona el Fix

### Flujo de Fechas

1. **En el UI del cliente (local):**
   - `getTodayDateString()` → "2025-01-16" (fecha local en formato YYYY-MM-DD)

2. **Conversión para enviar al servidor:**
   - `dateRangeToUTC("2025-01-16", "2025-01-16")` 
   - → `{ from: "2025-01-16T00:00:00.000Z", to: "2025-01-16T23:59:59.000Z" }`

3. **En el servidor (Backend):**
   - Recibe strings ISO en UTC
   - ASP.NET los deserializa a `DateTime` en UTC
   - El contexto del tenant aplica el filtro correcto

### Ventajas

✅ Fechas siempre correctas en la zona horaria del usuario  
✅ Conversión consistente a UTC para el servidor  
✅ No hay más desfases entre cliente y servidor  
✅ Código centralizado en `dateUtils.ts` para mantenimiento

## Archivos Modificados

1. **`viteapp/src/utils/dateUtils.ts`** (nuevo archivo)
   - Funciones auxiliares para manejo de fechas

2. **`viteapp/src/pages/SalesPage.tsx`**
   - Importa `dateUtils`
   - Actualiza `getDateRangeFromPreset()`
   - Actualiza `loadData()` para convertir a UTC

3. **`viteapp/src/pages/DashboardPage.tsx`**
   - Importa `getTodayRangeUTC()`
   - Simplifica el cálculo de fechas

4. **`viteapp/src/pages/SaleUpsertPage.tsx`**
   - Importa `getTodayDateString()`
   - Usa para inicializar `saleDate`

## Testing

Para verificar que el fix funciona:

1. Ve a la sección de Ventas (/sales)
2. Selecciona "Hoy" en el filtro de fechas
3. Las ventas del día actual (en tu zona horaria local) deben aparecer
4. Verifica que no haya desfase de 1 día

## Notas Adicionales

- El backend continúa esperando `DateTime` en UTC
- El cambio es **100% transparente** para el usuario
- La API no requiere cambios porque continúa recibiendo UTC
- El fix es compatible con zonas horarias positivas y negativas
