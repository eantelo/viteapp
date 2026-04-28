import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  NotificationPriority,
  NotificationType,
  type NotificationDto,
} from "@/api/notificationsApi";
import {
  getNotifications,
  getNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/api/notificationsApi";
import {
  createNotificationsConnection,
  NOTIFICATION_CREATED_EVENT,
} from "@/lib/notificationsRealtime";
import { emitProductUpdated } from "@/lib/product-events";
import type { HubConnection } from "@microsoft/signalr";
import { toast } from "sonner";

const POLLING_INTERVAL = 30000; // 30 seconds

interface UseNotificationsOptions {
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 30000) */
  pollingInterval?: number;
  /** Maximum notifications to fetch (default: 20) */
  limit?: number;
}

interface UseNotificationsResult {
  /** List of notifications */
  notifications: NotificationDto[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether notifications are being loaded */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually refresh notifications */
  refresh: () => Promise<void>;
  /** Mark a single notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  remove: (id: string) => Promise<void>;
}

export function useNotifications(
  options: UseNotificationsOptions = {},
): UseNotificationsResult {
  const {
    enablePolling = true,
    pollingInterval = POLLING_INTERVAL,
    limit = 20,
  } = options;

  const { auth, isAuthenticated, hasPermission } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const notificationsRef = useRef<NotificationDto[]>([]);
  const toastedNotificationIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      notificationsRef.current = [];
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const [notifs, summary] = await Promise.all([
        getNotifications({ limit, signal: abortControllerRef.current.signal }),
        getNotificationSummary({ signal: abortControllerRef.current.signal }),
      ]);
      notificationsRef.current = notifs;
      setNotifications(notifs);
      setUnreadCount(summary.unreadCount);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Failed to fetch notifications:", err);
      setError("Error al cargar notificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, limit]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling
  useEffect(() => {
    if (!enablePolling || !isAuthenticated) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enablePolling, isAuthenticated, pollingInterval, fetchNotifications]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const showRealtimeToast = useCallback((notification: NotificationDto) => {
    if (toastedNotificationIdsRef.current.has(notification.id)) {
      return;
    }

    toastedNotificationIdsRef.current.add(notification.id);

    const toastOptions = {
      id: `notification:${notification.id}`,
      description: notification.message,
    };

    if (
      notification.type === NotificationType.OutOfStock ||
      notification.priority === NotificationPriority.Critical
    ) {
      toast.error(notification.title, toastOptions);
      return;
    }

    if (
      notification.type === NotificationType.LowStock ||
      notification.type === NotificationType.HeldOrderExpiring ||
      notification.priority === NotificationPriority.High
    ) {
      toast.warning(notification.title, toastOptions);
      return;
    }

    if (
      notification.type === NotificationType.SystemAlert ||
      notification.type === NotificationType.SaleCancelled
    ) {
      toast.info(notification.title, toastOptions);
      return;
    }

    toast.success(notification.title, toastOptions);
  }, []);

  const handleRealtimeProductSideEffects = useCallback(
    (notification: NotificationDto) => {
      if (notification.type === NotificationType.ProductCreated) {
        emitProductUpdated({
          productId: notification.entityId ?? undefined,
          updateType: "created",
          message: notification.message,
        });
        return;
      }

      if (notification.type === NotificationType.ProductUpdated) {
        emitProductUpdated({
          productId: notification.entityId ?? undefined,
          updateType: "updated",
          message: notification.message,
        });
        return;
      }

      if (
        notification.type === NotificationType.LowStock ||
        notification.type === NotificationType.OutOfStock
      ) {
        emitProductUpdated({
          productId: notification.entityId ?? undefined,
          updateType: "stock",
          message: notification.message,
        });
      }
    },
    [],
  );

  const handleRealtimeNotification = useCallback(
    (notification: NotificationDto) => {
      const existing = notificationsRef.current.find(
        (item) => item.id === notification.id,
      );
      const shouldIncrementUnread = Boolean(
        !notification.isRead && (!existing || existing.isRead),
      );
      const shouldShowToast = !existing;

      if (shouldShowToast) {
        showRealtimeToast(notification);
      }

      handleRealtimeProductSideEffects(notification);

      setNotifications((prev) => {
        const next = [
          notification,
          ...prev.filter((item) => item.id !== notification.id),
        ];
        const sliced = next.slice(0, limit);
        notificationsRef.current = sliced;
        return sliced;
      });

      if (shouldIncrementUnread) {
        setUnreadCount((prev) => prev + 1);
      }
    },
    [handleRealtimeProductSideEffects, limit, showRealtimeToast],
  );

  useEffect(() => {
    if (!isAuthenticated || !auth?.token || !hasPermission("Dashboard.View")) {
      if (connectionRef.current) {
        void connectionRef.current.stop().catch((err) => {
          console.error(
            "Failed to stop notifications realtime connection:",
            err,
          );
        });
        connectionRef.current = null;
      }
      return;
    }

    const connection = createNotificationsConnection(() => auth.token);
    connectionRef.current = connection;

    connection.on(
      NOTIFICATION_CREATED_EVENT,
      (notification: NotificationDto) => {
        handleRealtimeNotification(notification);
      },
    );

    connection.onreconnected(() => fetchNotifications());

    void connection.start().catch((err) => {
      console.error("Failed to start notifications realtime connection:", err);
    });

    return () => {
      connection.off(NOTIFICATION_CREATED_EVENT);

      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }

      void connection.stop().catch((err) => {
        console.error("Failed to stop notifications realtime connection:", err);
      });
    };
  }, [
    auth?.token,
    fetchNotifications,
    handleRealtimeNotification,
    hasPermission,
    isAuthenticated,
  ]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        );
        notificationsRef.current = next;
        return next;
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => {
        const next = prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }));
        notificationsRef.current = next;
        return next;
      });
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        const next = prev.filter((n) => n.id !== id);
        notificationsRef.current = next;
        return next;
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      throw err;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    remove,
  };
}
