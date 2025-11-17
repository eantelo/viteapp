import { apiClient } from "./apiClient";

export interface SaleItemDto {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export type PaymentMethod = "Cash" | "Card" | "Voucher" | "Transfer" | "Other";

export interface PaymentCreateDto {
  method: PaymentMethod;
  amount: number;
  amountReceived?: number;
  reference?: string | null;
}

export interface PaymentDto extends PaymentCreateDto {
  id: string;
  change?: number;
}

export interface SaleDto {
  id: string;
  saleNumber: number;
  date: string;
  customerId: string | null;
  customerName?: string | null;
  subtotal?: number;
  discount?: number;
  taxAmount?: number;
  total: number;
  status: "Completed" | "Closed" | "Cancelled" | "Pending";
  items: SaleItemDto[];
  payments: PaymentDto[];
}

export interface SaleCreateDto {
  date: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  payments?: PaymentCreateDto[];
}

export interface SaleUpdateDto {
  date: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  transactionCount: number;
  totalAmount: number;
}

export interface DailySummary {
  date: string;
  salesCount: number;
  totalAmount: number;
  paymentBreakdown: PaymentMethodSummary[];
}

export interface PaymentSummary {
  startDate: string;
  endDate: string;
  totalSalesCount: number;
  totalAmount: number;
  paymentMethodBreakdown: PaymentMethodSummary[];
  dailySummaries: DailySummary[];
}

export async function getSales(search?: string): Promise<SaleDto[]> {
  const params = new URLSearchParams();
  if (search) {
    params.append("search", search);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<SaleDto[]>(`/api/sales${query}`);
}

export async function getRecentSales(limit = 10): Promise<SaleDto[]> {
  const params = new URLSearchParams();
  if (limit) {
    params.append("limit", String(limit));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<SaleDto[]>(`/api/sales/recent${query}`);
}

export async function getSaleById(id: string): Promise<SaleDto> {
  return apiClient<SaleDto>(`/api/sales/${id}`);
}

export async function createSale(dto: SaleCreateDto): Promise<SaleDto> {
  return apiClient<SaleDto>("/api/sales", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateSale(
  id: string,
  dto: SaleUpdateDto
): Promise<void> {
  return apiClient<void>(`/api/sales/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteSale(id: string): Promise<void> {
  return apiClient<void>(`/api/sales/${id}`, {
    method: "DELETE",
  });
}

export async function getPaymentSummary(
  startDate?: Date,
  endDate?: Date
): Promise<PaymentSummary> {
  const params = new URLSearchParams();
  if (startDate) {
    params.append("startDate", startDate.toISOString());
  }
  if (endDate) {
    params.append("endDate", endDate.toISOString());
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PaymentSummary>(`/api/sales/payment-summary${query}`);
}
