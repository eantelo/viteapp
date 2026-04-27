# Realtime notifications in viteapp

`viteapp` now listens to backend notifications through SignalR using the `/hubs/notifications` hub.

## What changed

- `useNotifications` keeps the initial fetch and 30-second polling fallback
- when the user is authenticated and has `Dashboard.View`, the hook opens a realtime connection
- incoming `notificationCreated` payloads update the header notifications immediately

## Transport and auth

- client library: `@microsoft/signalr`
- hub URL: `${VITE_API_URL}/hubs/notifications`
- auth: existing JWT from `salesnet.auth`

The connection uses automatic reconnect and triggers a refresh after reconnecting to recover any missed notifications.

## Why this matters

When a product is created from MCP, the notification badge and dropdown in the header update immediately instead of waiting for the next polling cycle.

For the backend contract and grouping rules, see `../../docs/realtime-notifications.md` from the repository root.