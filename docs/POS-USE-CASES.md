# 💼 Casos de Uso - ProductAutoComplete

## Caso 1: Cliente Busca Laptop por Nombre

### Escenario
Un cliente quiere comprar una laptop. El vendedor no tiene el código de barras disponible pero sabe que es una "Dell".

### Flujo

```
1. Vendedor abre Punto de Venta
   ↓
2. Campo de búsqueda automáticamente con foco
   ↓
3. Vendedor escribe: "dell"
   ┌─────────────────────────────────────┐
   │ 🔍 dell                           ⏳│
   │ 🔄 Buscando...                      │
   └─────────────────────────────────────┘
   ↓ (después de 300ms debounce)
4. Aparecen 3 resultados
   ┌──────────────────────────────────────┐
   │ 💻 Laptop Dell XPS (DELL001)         │
   │    SKU DELL001 · $899.99             │
   │    5 disponibles                     │
   ├──────────────────────────────────────┤
   │ 💻 Laptop Dell Inspiron (DELL002)   │
   │    SKU DELL002 · $599.99             │
   │    12 disponibles                    │
   ├──────────────────────────────────────┤
   │ 💻 Laptop Dell Latitude (DELL003)   │
   │    SKU DELL003 · $1299.99            │
   │    2 disponibles ⚠️                   │
   └──────────────────────────────────────┘
   ↓
5. Vendedor presiona flecha abajo
   → Primer producto resaltado en azul con chevron
   ↓
6. Vendedor presiona flecha abajo nuevamente
   → Segundo producto ahora resaltado
   ↓
7. Vendedor ve que el segundo tiene más stock
   → Presiona Enter para seleccionar
   ↓
8. Producto agregado a la orden
   → Input limpiado automáticamente
   → "Laptop Dell Inspiron agregada" toast
   ↓
9. Input listo para siguiente producto
```

### Resultado
✅ Producto agregado rápidamente
✅ Sin necesidad de código de barras
✅ Decisión basada en información disponible (precio, stock)
✅ Vendedor vio todas las opciones Dell disponibles

---

## Caso 2: Búsqueda por Código de Barras

### Escenario
Cliente compra un producto que tiene código de barras. El vendedor lo escanea.

### Flujo

```
1. Vendedor abre Punto de Venta
   ↓
2. Escanea código: "5901234123457"
   ┌─────────────────────────────────────┐
   │ 🔍 5901234123457                    │
   └─────────────────────────────────────┘
   ↓
3. Vendedor presiona Enter o clic en "Agregar"
   ↓
4. Sistema busca en dos pasos:
   a) Intenta coincidencia exacta por barcode
   b) Si no encuentra, busca por nombre/SKU
   ↓
5. Si encuentra → Producto agregado directamente
   ✓ "iPhone 15 Pro agregado a la orden"
   
   Si no encuentra → Muestra sugerencias
   ┌──────────────────────────────────────┐
   │ Sin coincidencias                     │
   │ Intenta con otro nombre, código o SKU │
   └──────────────────────────────────────┘
```

### Resultado
✅ Búsqueda rápida y precisa
✅ Sin necesidad de escribir información
✅ Prevención de errores manuales

---

## Caso 3: Producto con Stock Bajo

### Escenario
Cliente quiere comprar un producto que tiene bajo stock. El vendedor debe verlo claramente.

### Flujo

```
1. Vendedor busca: "monitor"
   ↓
2. Aparecen resultados:
   ┌──────────────────────────────────────┐
   │ 💻 Monitor Samsung 27" (SAM001)      │
   │    SKU SAM001 · $349.99              │
   │    15 disponibles      ✅ Verde       │
   ├──────────────────────────────────────┤
   │ 💻 Monitor LG 32" (LG001)            │
   │    SKU LG001 · $599.99               │
   │    ⚠️ 3 unid. (Badge naranja) ⚠️      │
   ├──────────────────────────────────────┤
   │ 💻 Monitor ASUS Curved (ASUS001)    │
   │    SKU ASUS001 · $699.99             │
   │    ❌ Sin stock (Badge rojo)          │
   └──────────────────────────────────────┘
   ↓
3. Vendedor ve claramente:
   - Monitor Samsung: Stock normal (15) ✅
   - Monitor LG: Stock bajo (3) ⚠️ Badge naranja
   - Monitor ASUS: Sin stock ❌ Badge rojo
   ↓
4. Vendedor selecciona Monitor Samsung
   → Agregado exitosamente
```

### Ventaja Clave
- Advertencia visual clara antes de seleccionar
- Previene venta de productos sin stock
- Facilita sugerencias alternativas al cliente

---

## Caso 4: Búsqueda de Producto Parcial

### Escenario
Vendedor no recuerda exactamente el nombre del producto. Busca por parte del nombre.

### Flujo

```
1. Vendedor busca: "lap"
   ↓
2. Debounce espera 300ms
   ↓
3. Resultados que contienen "lap":
   ┌──────────────────────────────────────┐
   │ 💻 Laptop Dell XPS                   │
   ├──────────────────────────────────────┤
   │ 💻 Laptop HP Pavilion                │
   ├──────────────────────────────────────┤
   │ 💻 Laptop ASUS VivoBook              │
   ├──────────────────────────────────────┤
   │ 🖱️  Mouse para Laptop               │
   ├──────────────────────────────────────┤
   │ 🎒 Mochila para Laptop              │
   └──────────────────────────────────────┘
   
   (Máximo 8 resultados mostrados)
   ↓
4. Cliente especifica: "la XPS"
   ↓
5. Búsqueda refinada:
   ┌──────────────────────────────────────┐
   │ 💻 Laptop Dell XPS (DELL001)         │
   │    SKU DELL001 · $899.99             │
   │    5 disponibles                     │
   └──────────────────────────────────────┘
   ↓
6. Vendedor presiona Enter
   → Agregada con precisión
```

### Beneficio
- Búsqueda flexible y tolerante
- Usuarios no necesitan saber nombre exacto
- API ordena resultados por relevancia

---

## Caso 5: Navegación Solo por Teclado

### Escenario
Vendedor prefiere usar solo teclado para máxima velocidad. POS debe funcionar perfectamente sin mouse.

### Flujo

```
Índice de Teclas:
┌─────────────────────────────────────┐
│ Tab: Lleva a búsqueda (si es necesario) │
│ Escribir: Inicia búsqueda              │
│ ↓: Navega por sugerencias             │
│ ↑: Navega hacia arriba                │
│ Enter: Selecciona / Envía             │
│ Escape: Cierra dropdown               │
│ Tab: (después) Va a siguiente campo   │
└─────────────────────────────────────┘

Secuencia típica:
──────────────────────────────────────
1. Ctrl+K (futuro) o ya en POS
   ↓
2. Escribe "iphone"
   ↓
3. Presiona ↓ 2 veces (tercer producto)
   ↓
4. Presiona Enter
   → Agregado
   ↓
5. Input automáticamente limpiado
   → Listo para siguiente búsqueda
   ↓
6. Escribe "case"
   ↓
7. Presiona ↓ (primera opción resaltada)
   ↓
8. Presiona Enter
   → Agregado
   ↓
9. (Sin tocar mouse en todo el proceso)
```

### Velocidad
Con práctica, un vendedor puede agregar ~30 productos/minuto
Sin cambiar de input a mouse a input

---

## Caso 6: Manejo de Errores

### Subcaso 6a: Búsqueda sin resultados

```
Usuario escribe: "zzzzzzzzzz"
        ↓
Después de 300ms:
┌──────────────────────────────────────┐
│                                      │
│          📦 (icono opaco)            │
│   Sin coincidencias                  │
│ Intenta con otro nombre, código o   │
│              SKU                     │
│                                      │
└──────────────────────────────────────┘
```

### Subcaso 6b: Error del servidor

```
Usuario escribe: "laptop"
        ↓
Error en request (timeout, 500, etc):
        ↓
┌──────────────────────────────────────┐
│                                      │
│          📦 (icono opaco)            │
│ Error: Servidor no responde          │
│ Intenta con otro nombre, código o   │
│              SKU                     │
│                                      │
└──────────────────────────────────────┘

Log en consola: 
"Failed to search products: 
 Error: fetch failed"
```

### Subcaso 6c: Timeout

```
Usuario escribe: "muy-larga-búsqueda"
        ↓
30+ segundos sin respuesta:
        ↓
AbortController automaticamente cancela
        ↓
Input regresa a estado normal
Error se limpia automáticamente
```

---

## Caso 7: Cliente con Múltiples Productos

### Escenario
Venta compleja con varios productos. Vendedor necesita agregar 15 artículos.

### Flujo Optimizado

```
Producto 1: Laptop
  → Escribe "lap"
  → Presiona ↓ para seleccionar
  → Presiona Enter
  → Input limpio, listo para siguiente

Producto 2: Mouse
  → Escribe "mouse"
  → Presiona Enter (primer resultado es correcto)
  → Agregado

Producto 3: Monitor
  → Escanea código
  → Presiona Enter
  → Agregado automáticamente

Producto 4: Cable HDMI
  → Escribe "hdmi"
  → Presiona Enter
  → Agregado

... (continúa sin problemas)

Producto 15: Funda protectora
  → Escribe "funda"
  → Presiona ↓ 2 veces (tercera opción)
  → Presiona Enter
  → Agregado

TIEMPO TOTAL: ~90 segundos para 15 productos
SIN ERRORES: Búsquedas precisas, stock verificado
```

### Ventajas Visibles
✅ Velocidad: Un producto cada 6 segundos
✅ Precisión: Información clara antes de agregar
✅ Consistencia: Mismo flujo para todos
✅ Seguridad: Evita agregaciones incorrectas

---

## Caso 8: Actualización en Tiempo Real

### Escenario
Otro vendedor agrega stock mientras se está usando la búsqueda.

### Flujo

```
10:00 - Vendedor A busca "laptop"
        → Stock: 5 unidades

10:01 - Administrador agrega 20 unidades en sistema
        → Inventario ahora: 25 unidades

10:02 - Vendedor A busca "laptop" nuevamente
        → Ahora ve: 25 disponibles ✅
```

**Nota:** El cache se actualiza en cada búsqueda
Sin necesidad de refresh manual

---

## Caso 9: Validación de Stock

### Escenario
Cliente quiere comprar más de lo disponible.

### Flujo

```
1. Vendedor busca: "mouse" (Stock: 3)
   ┌──────────────────────────────────────┐
   │ 🖱️  Mouse Logitech                   │
   │    SKU LOG001 · $25.99               │
   │    ⚠️ 3 unid. (Badge naranja)        │
   └──────────────────────────────────────┘

2. Vendedor agrega 1
   → Cantidad en orden: 1 ✅

3. Vendedor presiona + tres veces más
   → Cantidad: 2 ✅
   → Cantidad: 3 ✅
   → Cantidad: 4 ❌ (BLOQUEADO)
   
   Mensaje: "Stock máximo alcanzado"

4. Cantidad máxima: 3 (disponible)
```

### Seguridad
- Sistema previene sobreventa
- Aviso claro al usuario
- Stock validado en ambos: hook y BD

---

## Caso 10: Producto Recientemente Agregado

### Escenario
Vendedor agrega el mismo producto varias veces.

### Flujo

```
PRIMERA VEZ:
1. Busca "iphone"
   → Aparecen sugerencias
   → Selecciona "iPhone 15 Pro"
   → Se agrega con cantidad: 1

SEGUNDA VEZ:
1. Busca "iphone" nuevamente
   → Sistema muestra mismas opciones
   → Presiona Enter (mismo producto)
   → El sistema detecta que ya existe
   → Incrementa cantidad de 1 → 2

TERCERA VEZ:
1. Sistema podría mostrar en "recientes"
   → iPhone 15 Pro aparece primero
   → Presiona Enter
   → Cantidad: 2 → 3
```

### Resultado en Orden
```
Orden Final:
├─ iPhone 15 Pro × 3 = $2,997.00
├─ Apple Case × 1 = $49.99
└─ Protector Screen × 2 = $39.98

Total: $3,086.97
```

---

## Métricas de Rendimiento Esperadas

| Métrica | Valor | Criterio |
|---------|-------|----------|
| Tiempo primer resultado | <400ms | Debounce 300ms + API |
| Resultados mostrados | 8 máximo | Maneja bien |
| Tiempo de navegación | <100ms | Respuesta instantánea |
| Ancho de dropdown | Full width | Optimizado |
| Altura máxima | 256px (max-h-64) | Scrolleable |
| Tamaño de imagen | N/A (futuro) | Optimizado para caché |

---

## Conclusión

El componente ProductAutoComplete está diseñado para:

✅ **Velocidad**: Búsqueda y selección rápidas
✅ **Precisión**: Información clara y validación
✅ **Accesibilidad**: Teclado y ARIA completos
✅ **Flexibilidad**: Múltiples formas de buscar
✅ **Seguridad**: Prevención de errores
✅ **Escalabilidad**: Funciona con 100+ productos

---

*Última actualización: Noviembre 17, 2025*
