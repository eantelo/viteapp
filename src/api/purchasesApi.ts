import { apiClient } from "./apiClient";

export const PurchaseOrderStatus = {
  Draft: 0,
  Pending: 1,
  PartiallyReceived: 2,
  Received: 3,
  Cancelled: 4,
} as const;

export type PurchaseOrderStatusType =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const PurchasePaymentStatus = {
  Pending: 0,
  Paid: 1,
} as const;

export type PurchasePaymentStatusType =
  (typeof PurchasePaymentStatus)[keyof typeof PurchasePaymentStatus];

export interface PurchaseOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrderDto {
  id: string;
  purchaseOrderNumber: number;
  date: string;
  supplierId: string;
  supplierName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: PurchaseOrderStatusType;
  paymentStatus: PurchasePaymentStatusType;
  notes?: string | null;
  expectedDeliveryDate?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemCreateDto {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderCreateDto {
  date: string;
  supplierId: string;
  notes?: string;
  expectedDeliveryDate?: string;
  taxAmount: number;
  items: PurchaseOrderItemCreateDto[];
}

export interface PurchaseOrderUpdateDto extends PurchaseOrderCreateDto {}

export interface PurchaseReceiveItemDto {
  purchaseOrderItemId: string;
  quantityReceived: number;
}

export interface PurchaseReceiveDto {
  notes?: string;
  items: PurchaseReceiveItemDto[];
}

export interface PurchaseOrderSummaryDto {
  totalOrders: number;
  pendingOrders: number;
  receivedOrders: number;
  pendingAmount: number;
  totalAmount: number;
}

export interface PurchaseFilters {
  status?: PurchaseOrderStatusType;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getPurchases(
  filters?: PurchaseFilters,
): Promise<PurchaseOrderDto[]> {
  const params = new URLSearchParams();

  if (filters?.status !== undefined) {
    params.set("status", String(filters.status));
  }
  if (filters?.supplierId) {
    params.set("supplierId", filters.supplierId);
  }
  if (filters?.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }
  if (filters?.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  const query = params.toString();
  return apiClient<PurchaseOrderDto[]>(
    `/api/purchases${query ? `?${query}` : ""}`,
  );
}

export async function getPurchaseById(id: string): Promise<PurchaseOrderDto> {
  return apiClient<PurchaseOrderDto>(`/api/purchases/${id}`);
}

export async function getPurchaseSummary(): Promise<PurchaseOrderSummaryDto> {
  return apiClient<PurchaseOrderSummaryDto>("/api/purchases/summary");
}

export async function createPurchase(
  dto: PurchaseOrderCreateDto,
): Promise<PurchaseOrderDto> {
  return apiClient<PurchaseOrderDto>("/api/purchases", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updatePurchase(
  id: string,
  dto: PurchaseOrderUpdateDto,
): Promise<PurchaseOrderDto> {
  return apiClient<PurchaseOrderDto>(`/api/purchases/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deletePurchase(id: string): Promise<void> {
  return apiClient<void>(`/api/purchases/${id}`, {
    method: "DELETE",
  });
}

export async function confirmPurchase(id: string): Promise<void> {
  return apiClient<void>(`/api/purchases/${id}/confirm`, {
    method: "PUT",
  });
}

export async function receivePurchase(
  id: string,
  dto: PurchaseReceiveDto,
): Promise<PurchaseOrderDto> {
  return apiClient<PurchaseOrderDto>(`/api/purchases/${id}/receive`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function cancelPurchase(id: string): Promise<void> {
  return apiClient<void>(`/api/purchases/${id}/cancel`, {
    method: "PUT",
  });
}

export async function markPurchaseAsPaid(id: string): Promise<void> {
  return apiClient<void>(`/api/purchases/${id}/mark-paid`, {
    method: "PUT",
  });
}
