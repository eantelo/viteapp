# Payment Summary Dashboard

## Descripción

El componente `PaymentSummary` proporciona un dashboard completo de estadísticas de pagos, mostrando:
- Resumen general (total de ventas, monto total, métodos de pago)
- Desglose detallado por método de pago con porcentajes y gráficos de barras
- Resumen diario de ventas con breakdown de métodos

## Arquitectura

### Backend (Sales.Api)

**Endpoint**: `GET /api/sales/payment-summary`

**Query Parameters**:
- `startDate` (opcional): fecha de inicio del rango, formato ISO 8601
- `endDate` (opcional): fecha de fin del rango, formato ISO 8601
- Si no se especifican, usa los últimos 30 días por defecto

**Respuesta**: `PaymentSummaryDto`
```csharp
public record PaymentSummaryDto
{
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public int TotalSalesCount { get; init; }
    public decimal TotalAmount { get; init; }
    public List<PaymentMethodSummaryDto> PaymentMethodBreakdown { get; init; } = [];
    public List<DailySummaryDto> DailySummaries { get; init; } = [];
}

public record PaymentMethodSummaryDto
{
    public PaymentMethod Method { get; init; }
    public int TransactionCount { get; init; }
    public decimal TotalAmount { get; init; }
}

public record DailySummaryDto
{
    public DateTime Date { get; init; }
    public int SalesCount { get; init; }
    public decimal TotalAmount { get; init; }
    public List<PaymentMethodSummaryDto> PaymentBreakdown { get; init; } = [];
}
```

### Frontend (viteapp)

**Componente**: `PaymentSummary.tsx`
**Ubicación**: `src/components/sales/PaymentSummary.tsx`

**Props**:
```typescript
interface PaymentSummaryProps {
  startDate?: Date;
  endDate?: Date;
}
```

**Características**:
- Consume el endpoint `/api/sales/payment-summary` vía `getPaymentSummary()` de `salesApi.ts`
- Maneja estados de carga, error y sin datos
- Muestra indicadores visuales con colores por método de pago
- Formatea montos en pesos mexicanos (MXN)
- Agrupa métodos por color consistente en toda la UI
- Muestra últimos 7 días del resumen diario

## Colores por método de pago

```typescript
const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  Cash: "bg-green-500",      // Verde - Efectivo
  Card: "bg-blue-500",        // Azul - Tarjeta
  Transfer: "bg-purple-500",  // Morado - Transferencia
  Voucher: "bg-orange-500",   // Naranja - Vale/Cupón
  Other: "bg-gray-500",       // Gris - Otro
};
```

## Integración en Dashboard

El componente se integra en `DashboardPage.tsx`:

```tsx
import { PaymentSummary } from "@/components/sales/PaymentSummary";

// En el JSX:
<PaymentSummary />
// O con rango personalizado:
<PaymentSummary 
  startDate={new Date('2024-01-01')} 
  endDate={new Date('2024-01-31')} 
/>
```

## Lógica del backend

La implementación en `SalesService.GetPaymentSummaryAsync()` realiza:

1. **Validación de fechas**: Si no se especifican, usa últimos 30 días
2. **Filtrado por tenant**: Query global filter en `Payment` y `Sale`
3. **Agregación por método de pago**:
   ```csharp
   var methodBreakdown = await _context.Payments
       .Where(p => p.Sale.Date >= startDate && p.Sale.Date <= endDate)
       .GroupBy(p => p.Method)
       .Select(g => new PaymentMethodSummaryDto
       {
           Method = g.Key,
           TransactionCount = g.Count(),
           TotalAmount = g.Sum(p => p.Amount)
       })
       .ToListAsync(cancellationToken);
   ```

4. **Agregación diaria**:
   ```csharp
   var dailySummaries = await _context.Sales
       .Where(s => s.Date >= startDate && s.Date <= endDate && s.Status == SaleStatus.Completed)
       .GroupBy(s => s.Date.Date)
       .Select(g => new DailySummaryDto
       {
           Date = g.Key,
           SalesCount = g.Count(),
           TotalAmount = g.Sum(s => s.Total),
           PaymentBreakdown = g.SelectMany(s => s.Payments)
               .GroupBy(p => p.Method)
               .Select(pg => new PaymentMethodSummaryDto { ... })
               .ToList()
       })
       .OrderBy(d => d.Date)
       .ToListAsync(cancellationToken);
   ```

## Seguridad y multitenancy

- El endpoint requiere autenticación (`[Authorize]`)
- Automáticamente filtra por `TenantId` del usuario autenticado
- No es posible ver datos de otros tenants
- El filtro se aplica a nivel de `DbContext` con `HasQueryFilter`

## Próximas mejoras sugeridas

1. **Filtros de fecha en UI**: Agregar `DatePicker` para personalizar rango
2. **Gráficos de tendencia**: Usar Recharts/Chart.js para visualizaciones avanzadas
3. **Exportación**: Botón para descargar CSV/Excel con los datos
4. **Comparación de períodos**: Mostrar variación vs. período anterior
5. **Filtros por sucursal/usuario**: Si el sistema crece a multi-sede
6. **Drill-down**: Click en método de pago para ver transacciones individuales

## Dependencias

- shadcn/ui: `Card`, `Badge`, `Skeleton`
- API client: `getPaymentSummary` de `@/api/salesApi`
- Contexto de autenticación para tokens JWT

## Testing recomendado

1. **Sin datos**: Verificar mensaje "No hay datos disponibles"
2. **Error de red**: Comprobar manejo de error con mensaje adecuado
3. **Un solo método**: Asegurar que el 100% se muestre correctamente
4. **Múltiples métodos**: Verificar suma de porcentajes = 100%
5. **Rango vacío**: Probar con fechas sin ventas
6. **Tenant isolation**: Verificar que un tenant no vea datos de otro

## Referencias

- [Implementación backend](../../docs/payment-flow-implementation.md)
- [Payment entity](../../Sales.Domain/Entities/Payment.cs)
- [SalesService](../../Sales.Application/Sales/SalesService.cs)
- [SalesController](../../Sales.Api/Controllers/SalesController.cs)
