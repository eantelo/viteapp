import { useEffect, useCallback } from "react";

interface UseGlobalSearchShortcutOptions {
  /**
   * Whether the shortcut is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback when shortcut is triggered
   */
  onTrigger: () => void;
}

/**
 * Hook to handle global Ctrl+K / Cmd+K shortcut for opening search
 * Works across all pages in the app
 */
export function useGlobalSearchShortcut({
  enabled = true,
  onTrigger,
}: UseGlobalSearchShortcutOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isK = event.key.toLowerCase() === "k";

      if (isCtrlOrCmd && isK) {
        // Prevent browser default (e.g., browser search or focus address bar)
        event.preventDefault();
        event.stopPropagation();

        // Trigger the callback
        onTrigger();
      }
    },
    [enabled, onTrigger]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use capture phase to intercept before other handlers
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, handleKeyDown]);
}
