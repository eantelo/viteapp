import { apiClient } from "./apiClient";

// Notification types matching backend enum
export enum NotificationType {
  SaleCreated = 1,
  SaleCancelled = 2,
  LowStock = 10,
  OutOfStock = 11,
  ProductCreated = 20,
  ProductUpdated = 21,
  CustomerCreated = 30,
  HeldOrderExpiring = 40,
  SystemAlert = 100,
}

export enum NotificationPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Critical = 3,
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityName: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  timeAgo: string;
  colorClass: string;
}

export interface NotificationSummaryDto {
  unreadCount: number;
  totalCount: number;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  signal?: AbortSignal;
}): Promise<NotificationDto[]> {
  const params = new URLSearchParams();
  if (options?.unreadOnly !== undefined) {
    params.append("unreadOnly", String(options.unreadOnly));
  }
  if (options?.limit !== undefined) {
    params.append("limit", String(options.limit));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<NotificationDto[]>(`/api/notifications${query}`, {
    signal: options?.signal,
  });
}

/**
 * Get notification summary (counts)
 */
export async function getNotificationSummary(options?: {
  signal?: AbortSignal;
}): Promise<NotificationSummaryDto> {
  return apiClient<NotificationSummaryDto>("/api/notifications/summary", {
    signal: options?.signal,
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  return apiClient<void>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  markedAsRead: number;
}> {
  return apiClient<{ markedAsRead: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  return apiClient<void>(`/api/notifications/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get color class for notification type
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.SaleCreated:
    case NotificationType.SaleCancelled:
      return "blue";
    case NotificationType.ProductCreated:
    case NotificationType.ProductUpdated:
      return "green";
    case NotificationType.LowStock:
    case NotificationType.HeldOrderExpiring:
      return "yellow";
    case NotificationType.OutOfStock:
      return "red";
    case NotificationType.CustomerCreated:
      return "purple";
    case NotificationType.SystemAlert:
    default:
      return "gray";
  }
}

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.SaleCreated:
    case NotificationType.SaleCancelled:
      return "ShoppingCart";
    case NotificationType.ProductCreated:
    case NotificationType.ProductUpdated:
      return "Package";
    case NotificationType.LowStock:
    case NotificationType.OutOfStock:
      return "AlertTriangle";
    case NotificationType.CustomerCreated:
      return "UserPlus";
    case NotificationType.HeldOrderExpiring:
      return "Clock";
    case NotificationType.SystemAlert:
    default:
      return "Bell";
  }
}
