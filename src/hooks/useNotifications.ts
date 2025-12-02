import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  NotificationDto,
  NotificationSummaryDto,
} from "@/api/notificationsApi";
import {
  getNotifications,
  getNotificationSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/api/notificationsApi";

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
  options: UseNotificationsOptions = {}
): UseNotificationsResult {
  const {
    enablePolling = true,
    pollingInterval = POLLING_INTERVAL,
    limit = 20,
  } = options;

  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
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

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
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
        return prev.filter((n) => n.id !== id);
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
