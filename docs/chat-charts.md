# Gráficos Estadísticos en el Widget de Chat

## Descripción General

El widget de chat de SalesNet ahora soporta la visualización de gráficos estadísticos interactivos. El agente de IA decide automáticamente cuándo mostrar un gráfico basándose en el contexto de la conversación.

## Funcionalidad

### ¿Cuándo se muestran los gráficos?

El agente de chat mostrará gráficos cuando el usuario:

- Pida "ver las ventas de la última semana en un gráfico"
- Solicite "mostrar estadísticas visuales de ventas"
- Pregunte por "tendencias de ventas"
- Pida "gráfico de productos más vendidos"
- Use palabras como "gráfica", "visualización", "gráfico"

### Tipos de Gráficos Disponibles

#### 1. Tendencia de Ventas (`GetTrendAnalysis`)

Muestra las ventas diarias en un rango de fechas.

**Ejemplos de uso:**
- "Muéstrame un gráfico de ventas de la última semana"
- "Quiero ver las ventas del mes en una gráfica"
- "Grafica las ventas de los últimos 7 días"

**Tipos de visualización:**
- `line`: Gráfico de líneas (por defecto) - mejor para ver tendencias
- `bar`: Gráfico de barras - mejor para comparar días

**Información mostrada:**
- Monto de ventas por día
- Total de ventas en el período
- Número de transacciones
- Promedio diario

#### 2. Productos Estrella / Más Vendidos (`GetTopProducts`)

Muestra un ranking de los productos más vendidos.

**Ejemplos de uso:**
- "Muéstrame los productos más vendidos en gráfico"
- "Grafica el top 10 de productos"
- "Quiero ver qué productos venden más"

**Métricas disponibles:**
- `quantity`: Por unidades vendidas (por defecto)
- `revenue`: Por ingresos generados

**Información mostrada:**
- Nombre del producto
- Cantidad o ingresos según la métrica
- Total de unidades vendidas
- Ingresos totales

#### 3. Comparación de Períodos (`ComparePeriods`)

Permite preguntas como:
- "¿Cuánto vendí este mes vs el anterior?"
- "Comparar esta semana con la anterior"

Devuelve un gráfico de barras con 2 barras (Período A vs Período B) + variación.

#### 4. Predicción de Ventas (`PredictSales`)

Devuelve un gráfico de líneas con histórico + proyección (estimación) y un resumen.

#### 5. Pagos (tools separadas)

- `GetPaymentMethodBreakdown`: barras por método de pago
- `GetPaymentTrend`: tendencia diaria

## Arquitectura Técnica

### Backend (C#)

Los gráficos se generan en `Sales.Agents/Plugins/AnalyticsPlugin.cs` (analytics) y `Sales.Agents/Plugins/PaymentsAnalyticsPlugin.cs` (pagos).

```csharp
// Herramientas canónicas (AnalyticsPlugin)
GetTrendAnalysis(startDate, endDate, chartType)
ComparePeriods(periodA, periodB, ...)
GetTopProducts(startDate, endDate, limit, metric, includeChart)
PredictSales(historyStartDate?, historyEndDate?, horizonDays?, alpha?)

// Pagos (PaymentsAnalyticsPlugin)
GetPaymentMethodBreakdown(startDate, endDate)
GetPaymentTrend(startDate, endDate)
```

> Nota: `GetSalesDailyChart` y `GetTopProductsChart` siguen existiendo como compatibilidad, pero están marcadas como **DEPRECATED**.

Los datos se envían al frontend usando un formato especial:

```
<<<CHART_DATA>>>{json_data}<<<END_CHART_DATA>>>
```

### Frontend (React/TypeScript)

El componente `ChatInlineChart.tsx` renderiza los gráficos usando la librería `recharts`.

La función `extractChartData()` extrae los datos del marcador especial y los separa del texto del mensaje.

## Componentes

### ChatChart (`src/components/chat/ChatChart.tsx`)

Componente principal que renderiza los gráficos.

**Props:**
```typescript
interface ChatChartProps {
  chartData: ChartData;
}

interface ChartData {
  type: "bar" | "line";
  title: string;
  dataKey: string;
  labelKey: string;
  data: Record<string, unknown>[];
  summary?: {
    totalSales?: number;
    totalTransactions?: number;
    averageDaily?: number;
    totalProducts?: number;
    totalQuantity?: number;
    totalRevenue?: number;
  };
}
```

### Integración con ChatWidget

El `ChatWidget` detecta automáticamente los datos del gráfico en las respuestas del agente y los renderiza encima del texto del mensaje.

```tsx
interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
  chartData?: ChartData; // Nuevo campo opcional
}
```

## Configuración del Agente

El system prompt del agente incluye instrucciones específicas para usar los gráficos:

```
GRÁFICOS Y VISUALIZACIONES:
- Para tendencias usar GetTrendAnalysis
- Para comparaciones "vs" usar ComparePeriods
- Para productos estrella usar GetTopProducts
- Para predicción usar PredictSales
- Para pagos usar GetPaymentMethodBreakdown / GetPaymentTrend
```

## Ejemplos de Conversación

### Ejemplo 1: Ventas de la última semana

**Usuario:** "Muéstrame las ventas de la última semana en un gráfico"

**Agente:** (genera un gráfico de barras con las ventas diarias de los últimos 7 días)
"Aquí tienes el gráfico de ventas diarias. Durante este período se realizaron 45 transacciones con un total de $15,420.00."

### Ejemplo 2: Productos más vendidos

**Usuario:** "Quiero ver un gráfico de los 5 productos más vendidos del mes"

**Agente:** (genera un gráfico de barras horizontal con el top 5 de productos)
"Aquí tienes el gráfico de los 5 productos más vendidos. El producto líder es 'Coca-Cola 600ml' con 234 unidades."

### Ejemplo 3: Tendencias

**Usuario:** "Muéstrame la tendencia de ventas del último mes"

**Agente:** (genera un gráfico de líneas con las ventas diarias del mes)
"Aquí tienes el gráfico de tendencias. Se observa un incremento constante hacia el fin de mes."

## Consideraciones de Diseño

### Responsividad

- Los gráficos se adaptan al ancho del contenedor del chat
- En modo flotante (380px) los gráficos ocupan aproximadamente 320px de ancho
- En modo acoplado, los gráficos se expanden al ancho disponible

### Accesibilidad

- Colores con buen contraste
- Tooltips informativos al hacer hover
- Resumen de datos en texto debajo del gráfico

### Rendimiento

- Los gráficos usan `ResponsiveContainer` para evitar re-renders innecesarios
- Los datos se calculan una sola vez en el backend
- El frontend solo renderiza los datos recibidos

## Futuras Mejoras

- [ ] Soporte para gráficos de pastel (pie charts)
- [ ] Comparación de períodos (este mes vs mes anterior)
- [ ] Exportar gráficos como imagen
- [ ] Gráficos de ventas por hora del día
- [ ] Gráficos de clientes más frecuentes
