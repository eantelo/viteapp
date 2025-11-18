/**
 * Tipos y enums para el módulo de historial de ventas
 */

export interface SalesHistoryFilters {
  datePreset?: DatePreset;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  paymentMethod?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export type DatePreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "custom";

export interface SalesStatistics {
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  salesByHour: HourlySales[];
  salesByPaymentMethod: PaymentMethodSales[];
  topProducts: TopProduct[];
}

export interface HourlySales {
  hour: number;
  amount: number;
  count: number;
}

export interface PaymentMethodSales {
  method: number;
  methodName: string;
  amount: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
}

export interface SalesExportData {
  sales: Array<{
    saleNumber: number;
    date: string;
    customerName: string;
    total: number;
    paymentMethods: string;
    itemCount: number;
    status: string;
  }>;
  statistics: SalesStatistics;
  filters: SalesHistoryFilters;
  generatedAt: string;
}

export interface RepeatSaleRequest {
  originalSaleId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}
