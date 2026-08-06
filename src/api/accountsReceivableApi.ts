import { apiClient } from "./apiClient";
import type { PaymentMethodType } from "./salesApi";

export type ReceivableState = "Open" | "Partial" | "Overdue" | "Paid" | "Cancelled";

export interface AccountReceivableListItem {
  id: string;
  saleId: string;
  saleNumber: number;
  customerId: string;
  customerName: string;
  originalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  state: ReceivableState;
  currencyCode: string;
  accountingCurrencyCode: string;
  exchangeRateToAccounting: number;
  accountingOriginalAmount: number;
  accountingOutstandingAmount: number;
}

export interface ReceivablePayment {
  id: string;
  method: PaymentMethodType;
  amount: number;
  amountReceived?: number;
  change?: number;
  reference?: string;
  createdAt: string;
  isVoided: boolean;
  voidedAt?: string;
  voidReason?: string;
  currencyCode: string;
  appliedAmount: number;
  accountingAmount: number;
  exchangeDifference: number;
}

export interface AccountReceivableDetail extends AccountReceivableListItem {
  payments: ReceivablePayment[];
}

export interface AccountsReceivablePage {
  items: AccountReceivableListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AccountsReceivableSummary {
  totalOutstanding: number;
  totalOverdue: number;
  totalDueSoon: number;
  openCount: number;
  overdueCount: number;
  accountingCurrencyCode: string;
}

export interface AccountsReceivableQuery {
  customerId?: string;
  status?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getAccountsReceivable(
  query: AccountsReceivableQuery = {},
): Promise<AccountsReceivablePage> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiClient<AccountsReceivablePage>(`/api/accounts-receivable${suffix}`);
}

export async function getAccountsReceivableSummary(): Promise<AccountsReceivableSummary> {
  return apiClient<AccountsReceivableSummary>("/api/accounts-receivable/summary");
}

export async function getAccountReceivable(id: string): Promise<AccountReceivableDetail> {
  return apiClient<AccountReceivableDetail>(`/api/accounts-receivable/${id}`);
}

export async function registerReceivablePayment(
  id: string,
  payload: { amount: number; method: PaymentMethodType; amountReceived?: number; reference?: string; currencyCode?: string; exchangeRateId?: string | null },
): Promise<AccountReceivableDetail> {
  return apiClient<AccountReceivableDetail>(`/api/accounts-receivable/${id}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function voidReceivablePayment(
  id: string,
  paymentId: string,
  reason: string,
): Promise<AccountReceivableDetail> {
  return apiClient<AccountReceivableDetail>(`/api/accounts-receivable/${id}/payments/${paymentId}/void`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
