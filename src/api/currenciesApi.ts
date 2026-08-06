import { apiClient } from "./apiClient";
import type {
  CreateExchangeRate,
  CurrencyConfiguration,
  CurrencyDefinition,
  CurrencyQuote,
  ExchangeRate,
  TenantCurrency,
} from "@/types/Currency";

export const getCurrencyCatalog = () =>
  apiClient<CurrencyDefinition[]>("/api/currencies/catalog");

export const getCurrencyConfiguration = () =>
  apiClient<CurrencyConfiguration>("/api/currencies");

export const enableCurrency = (code: string) =>
  apiClient<TenantCurrency>(`/api/currencies/${encodeURIComponent(code)}/enable`, {
    method: "POST",
  });

export const disableCurrency = (code: string) =>
  apiClient<void>(`/api/currencies/${encodeURIComponent(code)}/enable`, {
    method: "DELETE",
  });

export const getExchangeRates = (currencyCode?: string) =>
  apiClient<ExchangeRate[]>(
    `/api/currency-rates${currencyCode ? `?currencyCode=${encodeURIComponent(currencyCode)}` : ""}`,
  );

export const createExchangeRate = (request: CreateExchangeRate) =>
  apiClient<ExchangeRate>("/api/currency-rates", {
    method: "POST",
    body: JSON.stringify(request),
  });

export const cancelExchangeRate = (id: string) =>
  apiClient<void>(`/api/currency-rates/${id}/cancel`, { method: "POST" });

export const getCurrencyQuote = (
  from: string,
  to: string,
  amount?: number,
  at = new Date(),
) => {
  const query = new URLSearchParams({
    fromCurrencyCode: from,
    toCurrencyCode: to,
    at: at.toISOString(),
  });
  if (amount !== undefined) query.set("amount", amount.toString());
  return apiClient<CurrencyQuote>(`/api/currency-rates/quote?${query.toString()}`);
};
