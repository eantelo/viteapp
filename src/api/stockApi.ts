import { apiClient } from './apiClient';

export const StockTransactionType = {
  InitialStock: 0,
  Purchase: 1,
  Sale: 2,
  Adjustment: 3,
  Return: 4,
  Transfer: 5,
} as const;

export type StockTransactionType = typeof StockTransactionType[keyof typeof StockTransactionType];

export interface StockTransactionDto {
  id: string;
  productId: string;
  productName: string;
  transactionType: StockTransactionType;
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface StockHistoryDto {
  productId: string;
  productName: string;
  warehouseId?: string;
  warehouseName?: string;
  currentStock: number;
  transactions: StockTransactionDto[];
}

export interface StockAdjustmentDto {
  productId: string;
  quantity: number;
  warehouseId?: string;
  notes?: string;
}

export async function getCurrentStock(productId: string, warehouseId?: string): Promise<number> {
  const query = warehouseId
    ? `?warehouseId=${encodeURIComponent(warehouseId)}`
    : "";
  return apiClient<number>(`/api/stock/${productId}${query}`);
}

export async function getStockHistory(
  productId: string,
  fromDate?: string,
  toDate?: string,
  warehouseId?: string
): Promise<StockHistoryDto> {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (warehouseId) params.append('warehouseId', warehouseId);
  
  const query = params.toString();
  return apiClient<StockHistoryDto>(`/api/stock/${productId}/history${query ? `?${query}` : ''}`);
}

export async function adjustStock(adjustment: StockAdjustmentDto): Promise<void> {
  return apiClient<void>('/api/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(adjustment)
  });
}
