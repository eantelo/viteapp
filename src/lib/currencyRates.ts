import type { ExchangeRate } from "@/types/Currency";

export type RateStatus = "current" | "upcoming" | "expired" | "cancelled";

/** Clasifica una cotización respecto de un instante, respetando la ventana [inicio, fin). */
export function getRateStatus(item: ExchangeRate, now = Date.now()): RateStatus {
  if (item.cancelledAt) return "cancelled";
  if (new Date(item.validFrom).getTime() > now) return "upcoming";
  if (new Date(item.validTo).getTime() <= now) return "expired";
  return "current";
}

/** Encuentra una cotización activa cuya ventana se solape con la propuesta. */
export function findOverlappingRate(
  rates: ExchangeRate[],
  currencyCode: string,
  validFrom: number,
  validTo: number,
): ExchangeRate | undefined {
  return rates.find((item) => item.currencyCode === currencyCode
    && !item.cancelledAt
    && new Date(item.validFrom).getTime() < validTo
    && validFrom < new Date(item.validTo).getTime());
}
