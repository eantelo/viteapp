/**
 * Utilidades para manejo consistente de fechas en la aplicación.
 * Evita problemas con zonas horarias usando fechas locales en lugar de UTC.
 */

/**
 * Obtiene la fecha local de hoy en formato YYYY-MM-DD sin conversión a UTC.
 * Esto previene problemas donde UTC muestra el día anterior.
 */
export function getTodayDateString(): string {
  const now = new Date();
  return formatDateToISO(now);
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD usando la zona horaria local.
 * No usa toISOString() para evitar desviaciones por timezone.
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha local de hoy como objeto Date (con hora 00:00:00).
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Obtiene la fecha de ayer en formato YYYY-MM-DD.
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToISO(yesterday);
}

/**
 * Obtiene el primer día de la semana actual (lunes) en formato YYYY-MM-DD.
 */
export function getWeekStartDateString(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return formatDateToISO(monday);
}

/**
 * Obtiene el primer día del mes actual en formato YYYY-MM-DD.
 */
export function getMonthStartDateString(): string {
  const now = new Date();
  return formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
}

/**
 * Convierte una cadena de fecha YYYY-MM-DD a UTC ISO completo.
 * Útil para enviar al servidor esperando UTC.
 */
export function dateStringToUTC(dateStr: string): string {
  // El dateStr es una fecha local en formato YYYY-MM-DD
  // Convertir a objeto Date y luego a ISO string completo
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0);
  return date.toISOString();
}

/**
 * Convierte una cadena de fecha YYYY-MM-DD a UTC ISO completo para el final del día.
 * Útil para filtros "hasta" en el servidor.
 */
export function dateStringToUTCEndOfDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59);
  return date.toISOString();
}

/**
 * Obtiene el rango de fechas completo del día (inicio a fin en UTC).
 */
export function getTodayRangeUTC(): { from: string; to: string } {
  const today = getToday();
  const from = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0
  );
  const to = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Convierte dos fechas en formato YYYY-MM-DD a ISO strings UTC completos.
 * Retorna un objeto con from (inicio del primer día) y to (fin del último día).
 * Ejemplo: "2025-01-16", "2025-01-16" → { from: "2025-01-16T00:00:00.000Z", to: "2025-01-16T23:59:59.000Z" }
 */
export function dateRangeToUTC(
  fromDateStr: string,
  toDateStr: string
): { from: string; to: string } {
  return {
    from: dateStringToUTC(fromDateStr),
    to: dateStringToUTCEndOfDay(toDateStr),
  };
}
