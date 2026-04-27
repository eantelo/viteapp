import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { apiBaseUrl } from "@/api/apiClient";

export const NOTIFICATION_CREATED_EVENT = "notificationCreated";

export function createNotificationsConnection(
  accessTokenFactory: () => string | null,
): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${apiBaseUrl}/hubs/notifications`, {
      accessTokenFactory: () => accessTokenFactory() ?? "",
      transport:
        HttpTransportType.WebSockets |
        HttpTransportType.ServerSentEvents |
        HttpTransportType.LongPolling,
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
}
