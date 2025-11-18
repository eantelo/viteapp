import { apiClient } from "./apiClient";

export const PaymentMethod = {
  Cash: 0,
  Card: 1,
  Voucher: 2,
  Transfer: 3,
  Other: 4,
} as const;

export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface SaleItemDto {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
}

export interface PaymentCreateDto {
  method: PaymentMethodType;
  amount: number;
  amountReceived?: number;
  reference?: string;
}

export interface PaymentDto {
  id: string;
  method: PaymentMethodType;
  amount: number;
  amountReceived?: number;
  change?: number;
  reference?: string;
}

export interface SaleDto {
  id: string;
  saleNumber: number;
  date: string;
  customerId: string | null;
  customerName?: string | null;
  total: number;
  status: "Completed" | "Closed" | "Cancelled";
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

export async function getSales(search?: string): Promise<SaleDto[]> {
  const params = new URLSearchParams();
  if (search) {
    params.append("search", search);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<SaleDto[]>(`/api/sales${query}`);
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
