import { apiClient } from "./apiClient";

/**
 * Representa un producto dentro de una orden en espera.
 */
export interface HeldOrderItemDto {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  barcode?: string;
  brand?: string;
}

/**
 * DTO para representar una orden en espera completa.
 */
export interface HeldOrderDto {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  items: HeldOrderItemDto[];
  discount: number;
  subtotal: number;
  total: number;
  createdAt: string;
  isActive: boolean;
  currencyCode: string;
  accountingCurrencyCode: string;
  exchangeRateId?: string | null;
  exchangeRateToAccounting: number;
  accountingTotal: number;
}

/**
 * DTO para crear una nueva orden en espera.
 */
export interface HeldOrderCreateDto {
  customerId?: string | null;
  customerName?: string | null;
  items: HeldOrderItemDto[];
  discount: number;
  currencyCode?: string;
  exchangeRateId?: string | null;
}

/**
 * Obtiene todas las órdenes en espera activas.
 */
export async function getHeldOrders(): Promise<HeldOrderDto[]> {
  return apiClient<HeldOrderDto[]>("/api/heldorders");
}

/**
 * Obtiene una orden en espera por su ID.
 */
export async function getHeldOrderById(id: string): Promise<HeldOrderDto> {
  return apiClient<HeldOrderDto>(`/api/heldorders/${id}`);
}

/**
 * Crea una nueva orden en espera.
 */
export async function createHeldOrder(
  dto: HeldOrderCreateDto
): Promise<HeldOrderDto> {
  return apiClient<HeldOrderDto>("/api/heldorders", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/**
 * Elimina (desactiva) una orden en espera.
 */
export async function deleteHeldOrder(id: string): Promise<void> {
  return apiClient<void>(`/api/heldorders/${id}`, {
    method: "DELETE",
  });
}
