# 🧪 Guía de Testing Manual - Sistema de Atajos

## Preparación

### 1. Iniciar Servidor
```bash
cd viteapp
npm run dev
```

### 2. Abrir en Navegador
```
http://localhost:5173
```

### 3. Navegar a Punto de Venta
- Dashboard → Punto de Venta
- O URL directa: `/pos`

---

## ✅ Casos de Prueba

### 1️⃣ Modal de Ayuda (F1)

**Precondiciones**: Estar en página POS

**Pasos**:
1. Presiona <kbd>F1</kbd>
2. Verifica que aparezca un modal

**Verificaciones**:
- [ ] Modal aparece con título "Atajos de teclado"
- [ ] Se muestran 4 categorías (Búsqueda, Orden, Pagos, Historial)
- [ ] Cada categoría tiene color diferente
- [ ] Todos los 10 atajos aparecen listados
- [ ] Hay descripción para cada atajo

**Cierre**:
1. Presiona <kbd>ESC</kbd> o click en X
2. Modal se cierra

---

### 2️⃣ Búsqueda de Productos (F2)

**Precondiciones**: Modal de ayuda cerrado

**Pasos**:
1. Presiona <kbd>F2</kbd>
2. Verifica enfoque en campo de búsqueda

**Verificaciones**:
- [ ] Campo de búsqueda de productos se enfoca
- [ ] Cursor parpadea en el campo
- [ ] Puedes escribir inmediatamente
- [ ] Indicador visual aparece en esquina superior derecha
- [ ] Indicador muestra "F2"

**Bonus**:
- Escribe algo para verificar que funciona con el atajo

---

### 3️⃣ Buscar Cliente (F3)

**Precondiciones**: Nada en búsqueda de cliente

**Pasos**:
1. Presiona <kbd>F3</kbd>
2. Verifica enfoque en búsqueda de cliente

**Verificaciones**:
- [ ] Campo de búsqueda de cliente se enfoca
- [ ] Cursor parpadea en el campo
- [ ] Puedes escribir inmediatamente
- [ ] Indicador visual muestra "F3"

**Test Completo**:
1. F3
2. Escribe "Juan"
3. Verifica que filtre clientes
4. Selecciona uno
5. Verifica que quede seleccionado

---

### 4️⃣ Aplicar Descuento (F4)

**Precondiciones**: Haya al menos 1 producto en orden

**Pasos**:
1. Presiona <kbd>F4</kbd>
2. Verifica enfoque en campo de descuento

**Verificaciones**:
- [ ] Campo de descuento se enfoca
- [ ] Cursor parpadea en el campo
- [ ] Puedes escribir número
- [ ] Indicador visual muestra "F4"
- [ ] Al escribir, se actualiza el descuento en resumen

**Test Completo**:
1. Agregar producto (ej: 100 MXN)
2. F4
3. Escribir "10"
4. Verificar que resumen muestre -10 MXN descuento
5. Total debe ser 90 MXN

---

### 5️⃣ Poner en Espera (F8)

**Precondiciones**: Al menos 1 producto en orden

**Pasos**:
1. Presiona <kbd>F8</kbd>
2. Verifica que se guarde la orden

**Verificaciones**:
- [ ] Orden se vacía (carrito limpio)
- [ ] Aparece toast "Orden en espera"
- [ ] Aparece botón "Reanudar orden guardada"
- [ ] Indicador visual muestra "F8"

**Test Completo**:
1. Agregar 2-3 productos
2. F8
3. Agregar otros productos (nueva orden)
4. Click "Reanudar orden guardada"
5. Verificar que regresan los productos originales

---

### 6️⃣ Proceder a Cobrar (F9)

**Precondiciones**: 
- Al menos 1 producto
- Cliente seleccionado

**Pasos**:
1. Presiona <kbd>F9</kbd>
2. Verifica que abra diálogo de pago

**Verificaciones**:
- [ ] Diálogo de pago aparece
- [ ] Muestra el total correcto
- [ ] Indicador visual muestra "F9"
- [ ] Se pueden seleccionar métodos de pago

**Test Completo**:
1. Agregar producto (ej: 150 MXN)
2. Seleccionar cliente con F3
3. F9
4. Diálogo abre
5. Seleccionar "Efectivo"
6. Escribir cantidad recibida
7. Confirmar

---

### 7️⃣ Abrir Cajón (F12)

**Precondiciones**: Ninguna

**Pasos**:
1. Presiona <kbd>F12</kbd>
2. Verifica mensaje

**Verificaciones**:
- [ ] Aparece toast "Funcionalidad de apertura de cajón en desarrollo"
- [ ] NO abre Developer Tools (en POS)
- [ ] Indicador visual muestra "F12"

---

### 8️⃣ Limpiar Orden (ESC)

**Precondiciones**: Al menos 1 producto en orden

**Pasos**:
1. Presiona <kbd>ESC</kbd>
2. Verifica que se limpie

**Verificaciones**:
- [ ] Todos los productos se eliminan
- [ ] Carrito muestra mensaje "Tu ticket está vacío"
- [ ] Total vuelve a 0
- [ ] Aparece toast "Orden vaciada"
- [ ] Indicador visual muestra "ESC"

---

### 9️⃣ Nueva Venta (Ctrl+N)

**Precondiciones**: Al menos 1 producto en orden

**Pasos**:
1. Presiona <kbd>Ctrl</kbd> + <kbd>N</kbd>
2. Verifica que se limpie

**Verificaciones**:
- [ ] Carrito se vacía
- [ ] Total vuelve a 0
- [ ] Indicador visual muestra "Ctrl+N"
- [ ] Listo para nueva venta

---

### 🔟 Ver Historial (Ctrl+H)

**Precondiciones**: Ninguna

**Pasos**:
1. Presiona <kbd>Ctrl</kbd> + <kbd>H</kbd>
2. Verifica mensaje

**Verificaciones**:
- [ ] Aparece toast "Navegando a historial de ventas..."
- [ ] Indicador visual muestra "Ctrl+H"

---

## 🎨 Pruebas Visuales

### Badges en Botones

**Pasos**:
1. Busca el botón "Poner en espera" en la sección de acciones
2. Pasa el mouse sobre él

**Verificaciones**:
- [ ] Aparece badge "F8" al pasar mouse
- [ ] Badge es sutil (baja opacidad sin hover)
- [ ] Badge es legible

**Otros botones**:
- [ ] "Limpiar" muestra "ESC"
- [ ] "Cobrar" muestra "F9"
- [ ] Campo de descuento muestra "F4"
- [ ] Campo de cliente muestra "F3"

### Indicador Flotante

**Pasos**:
1. Presiona cualquier atajo (ej: F2)

**Verificaciones**:
- [ ] Badge aparece en esquina superior derecha
- [ ] Muestra la tecla presionada
- [ ] Tiene icono de llama/fuego
- [ ] Desaparece después de ~400ms
- [ ] No interfiere con interacción

---

## ⚙️ Pruebas Condicionales

### Atajo Deshabilitado sin Productos

**Pasos**:
1. Asegurar que carrito esté vacío
2. Presionar <kbd>F9</kbd>

**Verificaciones**:
- [ ] Nada sucede
- [ ] Indicador NO aparece
- [ ] Sin errores en consola

### Atajo Deshabilitado sin Cliente

**Pasos**:
1. Agregar 1 producto
2. NO seleccionar cliente
3. Presionar <kbd>F9</kbd>

**Verificaciones**:
- [ ] Nada sucede
- [ ] Indicador NO aparece
- [ ] Botón "Cobrar" sigue deshabilitado

### Atajo Habilitado Correctamente

**Pasos**:
1. Agregar producto
2. Seleccionar cliente
3. Presionar <kbd>F9</kbd>

**Verificaciones**:
- [ ] Diálogo de pago abre
- [ ] Indicador aparece
- [ ] Todo funciona

---

## 🔍 Pruebas de Conflictos

### No Afecta Inputs de Texto

**Pasos**:
1. Click en campo de búsqueda de producto
2. Escribir texto
3. Presionar Ctrl+Letter

**Verificaciones**:
- [ ] Atajos Ctrl+ se detectan pero no interfieren
- [ ] Texto continúa escribiéndose normalmente
- [ ] Atajo se ejecuta igualmente

### DevTools con F12

**Pasos** (solo en desarrollo):
1. Presiona <kbd>F12</kbd>

**Verificaciones**:
- [ ] DevTools se abre (si está habilitado)
- [ ] Toast de cajón también aparece
- [ ] Ambas acciones ocurren

---

## 🐛 Detección de Problemas

### Síntomas y Soluciones

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Atajos no funcionan | Página no enfocada | Click en ventana del navegador |
| Indicador no aparece | Estado no se actualiza | F5 reload, verificar consola |
| Badge no visible | CSS no cargado | Verificar navegador dev tools |
| Modal no abre | Hook no inicializado | Verificar console errors |
| Conflicto con F12 | DevTools abierto | Cerrar y volver a intentar |

### Consola del Navegador

Abre con <kbd>F12</kbd> → pestaña "Console"

**Busca**:
- [ ] Sin errores en rojo
- [ ] Sin warnings de React
- [ ] Sin problemas de CORS

---

## 📊 Reporte de Testing

### Plantilla

```
Sistema de Atajos de Teclado - Reporte de Testing
Fecha: ___________
Navegador: ___________
OS: ___________

✅ Atajos Básicos
- F1 (Ayuda): [ ] Funciona
- F2 (Búsqueda): [ ] Funciona
- F3 (Cliente): [ ] Funciona
- F4 (Descuento): [ ] Funciona
- F8 (Espera): [ ] Funciona
- F9 (Cobrar): [ ] Funciona
- F12 (Cajón): [ ] Funciona
- ESC (Limpiar): [ ] Funciona
- Ctrl+N (Nueva): [ ] Funciona
- Ctrl+H (Historial): [ ] Funciona

✨ Características Visuales
- Badges en botones: [ ] Visible
- Indicador flotante: [ ] Funciona
- Modal organizado: [ ] Correcto
- Colores diferenciados: [ ] Correcto

⚙️ Comportamiento
- Atajos condicionales: [ ] Correcto
- Sin conflictos: [ ] Correcto
- Performance: [ ] Aceptable

Problemas encontrados:
______________________________
______________________________

Observaciones:
______________________________
______________________________

Testeado por: ___________
Firma: ___________ Fecha: ___________
```

---

## 🎯 Checklist Final

- [ ] Todos los 10 atajos funcionan
- [ ] Indicadores visuales aparecen
- [ ] Modal de ayuda funciona
- [ ] Badges visibles en botones
- [ ] Sin errores en consola
- [ ] Sin conflictos con navegador
- [ ] Sin conflictos con inputs
- [ ] Performance aceptable
- [ ] Responsive en móvil
- [ ] Documentación clara

---

**Testing completado**: _________  
**Resultado**: ✅ APROBADO / ❌ REQUIERE AJUSTES
