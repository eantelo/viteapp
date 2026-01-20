# Historial de Ventas - Documentación

## Descripción General

El módulo de **Historial de Ventas** permite consultar, analizar y gestionar el historial completo de transacciones de ventas. Proporciona filtros avanzados, estadísticas en tiempo real, visualizaciones gráficas y capacidades de exportación.

## Características Principales

### 1. 📊 Panel de Estadísticas

El panel superior muestra métricas clave del período seleccionado:

- **Total Vendido**: Suma total de ventas en el período
- **Cantidad de Transacciones**: Número de ventas completadas
- **Ticket Promedio**: Promedio de monto por transacción
- **Métodos de Pago**: Cantidad de métodos distintos utilizados

#### Gráfico de Ventas por Hora
Visualización en barras que muestra:
- Distribución de ventas a lo largo del día
- Monto vendido por cada hora
- Cantidad de transacciones por hora
- Colores diferenciados por período

#### Desglose por Método de Pago
Muestra para cada método:
- Nombre del método de pago
- Cantidad de transacciones
- Monto total
- Porcentaje del total de ventas

### 2. 🔍 Filtros Avanzados

#### Filtros de Fecha

**Presets Rápidos:**
- **Hoy**: Ventas del día actual
- **Ayer**: Ventas del día anterior
- **Esta Semana**: Desde el domingo hasta hoy
- **Este Mes**: Desde el día 1 del mes actual
- **Personalizado**: Rango de fechas manual

#### Filtro por Método de Pago
Opciones disponibles:
- Todos
- Efectivo (0)
- Tarjeta (1)
- Voucher (2)
- Transferencia (3)
- Otro (4)

#### Filtro por Rango de Monto
- Campo "Mínimo": Filtra ventas >= al monto especificado
- Campo "Máximo": Filtra ventas <= al monto especificado
- Ambos campos pueden usarse simultáneamente

### 3. 📋 Tabla de Ventas

#### Columnas

| Columna | Descripción |
|---------|-------------|
| **Orden #** | Número único de la venta |
| **Fecha/Hora** | Timestamp de la transacción |
| **Cliente** | Nombre del cliente o "Sin cliente" |
| **Total** | Monto total formateado como MXN |
| **Método Pago** | Lista de métodos utilizados |
| **Productos** | Cantidad total de items vendidos |
| **Estado** | Badge con estado (Completada/Cerrada/Cancelada) |
| **Acciones** | Botones de acción por fila |

**Nota:** El campo **Método Pago** acepta valores de enum serializados como número (0-4) o como string (Cash, Card, Voucher, Transfer, Other) y los muestra con etiquetas legibles.

#### Búsqueda Rápida
- Campo de búsqueda por número de orden o nombre de cliente
- Búsqueda en tiempo real sin necesidad de recargar

### 4. 🎯 Acciones por Venta

#### Ver Detalle (👁️)
Abre un modal con:
- Información completa de la venta
- Lista detallada de productos con cantidades y precios
- Información de pagos incluyendo cambio y referencias
- Total destacado

#### Reimprimir (🖨️)
- Función para reimprimir el ticket de la venta
- Útil para casos donde el cliente perdió su ticket
- **Nota**: Actualmente en desarrollo

#### Repetir Venta (🔄)
**Flujo:**
1. Usuario hace clic en el botón "Repetir"
2. Los productos de la venta se copian a localStorage
3. Usuario es redirigido automáticamente al POS
4. Los productos se cargan en el carrito
5. Usuario puede modificar cantidades antes de procesar

**Casos de uso:**
- Clientes que compran los mismos productos regularmente
- Facilita pedidos recurrentes
- Ahorra tiempo al cajero

#### Cancelar Venta (🗑️)
- Disponible solo para ventas no canceladas
- Requiere confirmación del usuario
- Acción irreversible
- Actualiza el estado a "Cancelada"

### 5. 📤 Exportación de Datos

#### Exportar a Excel
**Formato:** CSV (compatible con Excel)

**Contenido:**
- Encabezados: Orden #, Fecha, Cliente, Total, Métodos de Pago, Cantidad de Productos, Estado
- Datos de todas las ventas filtradas
- Sección de resumen con estadísticas

**Nombre del archivo:** `ventas_YYYY-MM-DD.csv`

**Características:**
- Codificación UTF-8 con BOM para compatibilidad
- Manejo de caracteres especiales y comillas
- Descarga automática al navegador

#### Exportar a PDF
**Formato:** HTML imprimible que se convierte a PDF

**Contenido:**
- Encabezado con título y fecha de generación
- Cards con estadísticas principales
- Tabla completa de ventas
- Footer con información del sistema

**Características:**
- Estilos optimizados para impresión
- Se abre en nueva ventana
- Diálogo de impresión automático
- Cierre automático después de imprimir

## Arquitectura Técnica

### Tipos TypeScript

**Archivo:** `src/types/salesHistory.ts`

```typescript
export interface SalesHistoryFilters {
  datePreset?: DatePreset;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  paymentMethod?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface SalesStatistics {
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  salesByHour: HourlySales[];
  salesByPaymentMethod: PaymentMethodSales[];
  topProducts: TopProduct[];
}
```

### API Endpoints

**Archivo:** `src/api/salesApi.ts`

#### `getSalesHistory(params: SalesHistoryParams): Promise<SaleDto[]>`
Obtiene las ventas con filtros aplicados.

**Parámetros:**
- `dateFrom`: Fecha inicial (ISO 8601)
- `dateTo`: Fecha final (ISO 8601)
- `customerId`: UUID del cliente (opcional)
- `paymentMethod`: Número del método (0-4, opcional)
- `minAmount`: Monto mínimo (opcional)
- `maxAmount`: Monto máximo (opcional)
- `limit`: Máximo de resultados (default: 50)

**Endpoint backend esperado:** `GET /api/sales/history`

#### `getSalesStatistics(dateFrom?, dateTo?): Promise<SalesStatistics>`
Obtiene estadísticas agregadas del período.

**Endpoint backend esperado:** `GET /api/sales/statistics`

### Componentes

#### `SalesHistoryPage`
**Ubicación:** `src/pages/SalesHistoryPage.tsx`

Componente principal que orquesta:
- Carga de datos desde la API
- Gestión de estado de filtros
- Renderizado de subcomponentes
- Manejo de acciones del usuario

#### `SalesStatisticsCards`
**Ubicación:** `src/components/sales/SalesStatisticsCards.tsx`

Muestra:
- Cards con métricas principales
- Gráfico de ventas por hora (Recharts)
- Desglose por método de pago

**Dependencias:**
- recharts (gráficos)
- tabler-icons-react (iconos)

#### `DatePresetButtons`
**Ubicación:** `src/components/sales/DatePresetButtons.tsx`

Botones para seleccionar períodos predefinidos.

#### `SaleDetailModal`
**Ubicación:** `src/components/sales/SaleDetailModal.tsx`

Modal con información completa de una venta individual.

### Utilidades de Exportación

**Archivo:** `src/utils/salesExport.ts`

#### `exportToExcel(sales, statistics?)`
Genera y descarga archivo CSV.

#### `exportToPDF(sales, statistics?)`
Genera HTML imprimible y abre diálogo de impresión.

## Integración con el Sistema

### Rutas

```typescript
// App.tsx
<Route path="/sales/history" element={<SalesHistoryPage />} />
```

### Navegación

Desde `SalesPage` (Órdenes de Venta):
- Botón "Historial" en el header
- Navega a `/sales/history`

### Breadcrumbs

```
Panel principal > Ventas > Historial
```

### Funcionalidad de "Repetir Venta"

**Flujo técnico:**

1. **En SalesHistoryPage:**
   ```typescript
   const handleRepeatSale = (sale: SaleDto) => {
     const items = sale.items.map(item => ({
       productId: item.productId,
       productName: item.productName || "",
       quantity: item.quantity,
       price: item.price,
     }));
     localStorage.setItem("repeatSaleItems", JSON.stringify(items));
     navigate("/pos");
   };
   ```

2. **En PointOfSalePage:**
   ```typescript
   useEffect(() => {
     const repeatSaleItems = localStorage.getItem("repeatSaleItems");
     if (repeatSaleItems) {
       const items = JSON.parse(repeatSaleItems);
       items.forEach(item => {
         // Agregar productos al carrito
       });
       localStorage.removeItem("repeatSaleItems");
     }
   }, []);
   ```

## Requisitos del Backend

Para que este módulo funcione completamente, el backend debe implementar:

### 1. Endpoint de Historial
```
GET /api/sales/history
Query Params:
  - dateFrom (string, ISO 8601)
  - dateTo (string, ISO 8601)
  - customerId (GUID, opcional)
  - paymentMethod (int 0-4, opcional)
  - minAmount (decimal, opcional)
  - maxAmount (decimal, opcional)
  - limit (int, default 50)

Response: SaleDto[]
```

### 2. Endpoint de Estadísticas
```
GET /api/sales/statistics
Query Params:
  - dateFrom (string, ISO 8601, opcional)
  - dateTo (string, ISO 8601, opcional)

Response: SalesStatistics
{
  totalSales: number,
  transactionCount: number,
  averageTicket: number,
  salesByHour: [{ hour, amount, count }],
  salesByPaymentMethod: [{ method, methodName, amount, count }]
}
```

### 3. Cálculo de Estadísticas

El backend debe calcular:
- **Ventas por hora**: Agrupar por hora del día (0-23)
- **Desglose por método**: Sumar montos por cada método de pago
- **Ticket promedio**: `totalSales / transactionCount`

## Mejoras Futuras

### Corto Plazo
- [ ] Implementar impresión real de tickets
- [ ] Agregar paginación en la tabla
- [ ] Permitir ordenamiento por columnas
- [ ] Agregar más presets de fecha (últimos 7 días, último mes, etc.)

### Mediano Plazo
- [ ] Gráficos adicionales (ventas por categoría, por producto)
- [ ] Comparación entre períodos
- [ ] Filtro por vendedor/usuario
- [ ] Exportación a otros formatos (JSON, XML)

### Largo Plazo
- [ ] Dashboard analítico avanzado
- [ ] Predicciones con IA
- [ ] Alertas automáticas (ventas anormales, productos más vendidos)
- [ ] Integración con sistema de reportes central

## Troubleshooting

### Los datos no cargan
1. Verificar que el backend esté corriendo
2. Revisar la consola del navegador para errores
3. Verificar que los endpoints estén implementados
4. Confirmar que el token JWT sea válido

### Las estadísticas no se muestran
1. Verificar que `getSalesStatistics` retorne datos válidos
2. Revisar que los tipos coincidan con la interfaz
3. Verificar el componente `SalesStatisticsCards`

### La exportación no funciona
1. Verificar permisos de descarga en el navegador
2. Revisar bloqueador de ventanas emergentes (PDF)
3. Confirmar que hay datos para exportar

### "Repetir venta" no carga productos
1. Verificar que localStorage no esté bloqueado
2. Revisar consola para errores de parsing
3. Confirmar que `PointOfSalePage` tenga el useEffect

## Consideraciones de Seguridad

1. **Autorización**: Verificar que solo usuarios autorizados accedan al historial
2. **Validación**: Todos los filtros deben validarse en el backend
3. **Auditoría**: Registrar acciones críticas (cancelaciones)
4. **Datos sensibles**: No exponer información de clientes en exportaciones sin permiso

## Rendimiento

- Límite de 50 ventas por defecto para evitar sobrecarga
- Las estadísticas se cargan en paralelo con las ventas
- Los gráficos usan memoización para evitar re-renders innecesarios
- La búsqueda local es instantánea (useMemo)

## Mantenimiento

**Archivos a revisar regularmente:**
- `src/pages/SalesHistoryPage.tsx` - Componente principal
- `src/api/salesApi.ts` - Contratos con backend
- `src/components/sales/SalesStatisticsCards.tsx` - Gráficos
- `src/utils/salesExport.ts` - Funciones de exportación

**Testing recomendado:**
- Filtros con datos límite (fechas, montos)
- Exportación con grandes volúmenes
- Repetir venta con productos discontinuados
- Cancelación de ventas con transacciones múltiples

---

**Última actualización:** 17 de noviembre de 2025  
**Versión:** 1.0.0  
**Autor:** Sistema Sales - Módulo de Historial de Ventas
