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
  status: "Pending" | "Completed" | "Closed" | "Cancelled" | "Refunded";
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
    price: number;
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
  dto: SaleUpdateDto,
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

/**
 * Completa una venta pendiente con información de pago.
 * Transición: Pending → Completed
 */
export async function completeSale(
  id: string,
  payments: PaymentCreateDto[],
): Promise<SaleDto> {
  return apiClient<SaleDto>(`/api/sales/${id}/complete`, {
    method: "PUT",
    body: JSON.stringify({ payments }),
  });
}

/**
 * Cancela una venta pendiente y libera el stock reservado.
 * Transición: Pending → Cancelled
 */
export async function cancelSale(id: string): Promise<void> {
  return apiClient<void>(`/api/sales/${id}/cancel`, {
    method: "PUT",
  });
}

/**
 * Cierra una venta completada para contabilidad.
 * Transición: Completed → Closed
 */
export async function closeSale(id: string): Promise<void> {
  return apiClient<void>(`/api/sales/${id}/close`, {
    method: "PUT",
  });
}

/**
 * Reembolsa una venta completada y devuelve el stock.
 * Transición: Completed → Refunded
 */
export async function refundSale(id: string): Promise<void> {
  return apiClient<void>(`/api/sales/${id}/refund`, {
    method: "PUT",
  });
}

// Historial de ventas y estadísticas
export interface SalesHistoryParams {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  paymentMethod?: number;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
}

export interface SalesStatistics {
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  salesByHour: Array<{
    hour: number;
    amount: number;
    count: number;
  }>;
  salesByPaymentMethod: Array<{
    method: number;
    methodName: string;
    amount: number;
    count: number;
  }>;
}

export async function getSalesHistory(
  params: SalesHistoryParams = {},
): Promise<SaleDto[]> {
  const searchParams = new URLSearchParams();

  if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.append("dateTo", params.dateTo);
  if (params.customerId) searchParams.append("customerId", params.customerId);
  if (params.paymentMethod !== undefined)
    searchParams.append("paymentMethod", params.paymentMethod.toString());
  if (params.minAmount !== undefined)
    searchParams.append("minAmount", params.minAmount.toString());
  if (params.maxAmount !== undefined)
    searchParams.append("maxAmount", params.maxAmount.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return apiClient<SaleDto[]>(`/api/sales/history${query}`);
}

export async function getSalesStatistics(
  dateFrom?: string,
  dateTo?: string,
): Promise<SalesStatistics> {
  const params = new URLSearchParams();
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<SalesStatistics>(`/api/sales/statistics${query}`);
}

export async function downloadInvoicePdf(id: string): Promise<void> {
  const baseUrl =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
    "http://localhost:5205";
  const url = `${baseUrl}/api/Sales/${id}/invoice-pdf`;

  // Obtener token de autenticación
  let token: string | undefined;
  try {
    const authStorage = localStorage.getItem("salesnet.auth");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed.token;
    }
  } catch (e) {
    console.warn("Error reading auth token", e);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Error al descargar la factura: ${response.statusText}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;

  // Intentar obtener el nombre del archivo del header Content-Disposition
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `Factura-${id}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Genera y descarga etiquetas de envío para múltiples ventas.
 * @param saleIds Array de IDs de ventas para generar etiquetas.
 */
export async function downloadShippingLabels(saleIds: string[]): Promise<void> {
  if (!saleIds || saleIds.length === 0) {
    throw new Error("Debe proporcionar al menos un ID de venta.");
  }

  const baseUrl =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
    "http://localhost:5205";
  const url = `${baseUrl}/api/Sales/shipping-labels`;

  // Obtener token de autenticación
  let token: string | undefined;
  try {
    const authStorage = localStorage.getItem("salesnet.auth");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed.token;
    }
  } catch (e) {
    console.warn("Error reading auth token", e);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ saleIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error al generar etiquetas: ${response.statusText}`,
    );
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;

  // Intentar obtener el nombre del archivo del header Content-Disposition
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `etiquetas-envio-${Date.now()}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
