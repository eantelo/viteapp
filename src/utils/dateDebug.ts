/**
 * Script de demostración del fix de fechas
 * Muestra la diferencia entre el método antiguo (incorrecto) y el nuevo (correcto)
 *
 * Ejecutar en la consola del navegador para ver los resultados
 */

console.group("🔧 Diagnóstico de Fechas - Demostración del Fix");

// Método ANTIGUO (❌ INCORRECTO)
console.group("❌ Método Antiguo (Incorrecto)");
const oldWay = new Date().toISOString().split("T")[0];
console.log('Uso: new Date().toISOString().split("T")[0]');
console.log("Resultado:", oldWay);
console.log(
  "Problema: En zonas horarias positivas (UTC+6), puede estar un día atrás"
);
console.groupEnd();

// Método NUEVO (✅ CORRECTO)
console.group("✅ Método Nuevo (Correcto)");

function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const newWay = formatDateToISO(new Date());
console.log("Uso: formatDateToISO(new Date())");
console.log("Resultado:", newWay);
console.log("Ventaja: Siempre usa la zona horaria local del navegador");
console.groupEnd();

// Información adicional
console.group("ℹ️ Información de Timezone");
const now = new Date();
console.log("Fecha/Hora Local:", now.toLocaleString());
console.log("Zona horaria offset:", -(now.getTimezoneOffset() / 60), "horas");
console.log("Fecha UTC:", now.toISOString());
console.log("Fecha Local (YYYY-MM-DD):", formatDateToISO(now));
console.groupEnd();

// Conversión correcta para enviar al servidor
console.group("🔄 Conversión para Enviar al Servidor");

function dateStringToUTC(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0);
  return date.toISOString();
}

function dateStringToUTCEndOfDay(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59);
  return date.toISOString();
}

console.log('Fecha local: "2025-01-16"');
console.log("Inicio del día (UTC):", dateStringToUTC("2025-01-16"));
console.log("Fin del día (UTC):", dateStringToUTCEndOfDay("2025-01-16"));
console.groupEnd();

console.groupEnd();

console.log(
  "%c✅ Fix Aplicado Correctamente",
  "color: green; font-weight: bold; font-size: 14px"
);
