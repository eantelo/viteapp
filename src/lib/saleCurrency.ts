interface CurrencyProblemDetails {
  code?: string;
}

interface CurrencyApiError {
  status?: number;
  details?: unknown;
}

/** Convierte un precio contable a la moneda operativa con el redondeo visible de esa moneda. */
export function convertAccountingPrice(
  accountingPrice: number,
  accountingToSaleRate: number,
  minorUnits: number,
): number {
  if (!Number.isFinite(accountingPrice) || !Number.isFinite(accountingToSaleRate) || accountingToSaleRate <= 0) {
    return 0;
  }

  const factor = 10 ** minorUnits;
  return Math.round((accountingPrice * accountingToSaleRate + Number.EPSILON) * factor) / factor;
}

/** Conserva el valor contable de un precio editado para poder cambiar de moneda sin conversiones acumulativas. */
export function convertSalePriceToAccounting(
  salePrice: number,
  accountingToSaleRate: number,
): number {
  if (!Number.isFinite(salePrice) || !Number.isFinite(accountingToSaleRate) || accountingToSaleRate <= 0) {
    return 0;
  }

  return salePrice / accountingToSaleRate;
}

/** Identifica la respuesta que obliga al operador a revisar una nueva cotización. */
export function isCurrencyQuoteStale(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const apiError = error as CurrencyApiError;
  const details = apiError.details as CurrencyProblemDetails | undefined;
  return apiError.status === 409 && details?.code === "currency_quote_stale";
}
