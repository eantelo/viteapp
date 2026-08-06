export interface CurrencyDefinition {
  code: string;
  name: string;
  minorUnits: number;
  isCrypto: boolean;
}

export interface TenantCurrency {
  currencyCode: string;
  name: string;
  minorUnits: number;
  isEnabled: boolean;
}

export interface CurrencyConfiguration {
  accountingCurrencyCode: string;
  defaultCurrencyCode: string;
  enabledCurrencies: TenantCurrency[];
}

export interface ExchangeRate {
  id: string;
  currencyCode: string;
  accountingCurrencyCode: string;
  rateToAccounting: number;
  validFrom: string;
  validTo: string;
  cancelledAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CurrencyQuote {
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  fromExchangeRateId?: string | null;
  toExchangeRateId?: string | null;
  validFrom: string;
  validTo: string;
  amount?: number | null;
  convertedAmount?: number | null;
}

export interface CreateExchangeRate {
  currencyCode: string;
  rateToAccounting: number;
  validFrom: string;
  validTo: string;
}
