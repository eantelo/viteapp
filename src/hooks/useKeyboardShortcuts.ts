import { useEffect, useCallback, useRef } from "react";

export type KeyboardShortcutKey =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F8"
  | "F9"
  | "F12"
  | "Escape"
  | "Ctrl+N"
  | "Ctrl+H";

export interface KeyboardShortcut {
  key: KeyboardShortcutKey;
  label: string;
  description: string;
  handler: () => void;
  enabled?: boolean;
}

/**
 * Hook para manejar atajos de teclado globales
 * Previene conflictos con atajos del navegador
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

  // Normalizar la tecla para detectar Ctrl+N, Ctrl+H
  const getNormalizedKey = useCallback((event: KeyboardEvent): string => {
    const key = event.key;
    const code = event.code;

    // Funciones: F1-F12
    if (code?.startsWith("F") && !isNaN(parseInt(code.substring(1)))) {
      return code;
    }

    // Escape
    if (key === "Escape") {
      return "Escape";
    }

    // Ctrl+Letra
    if (event.ctrlKey || event.metaKey) {
      return `Ctrl+${key.toUpperCase()}`;
    }

    return "";
  }, []);

  // Actualizar el mapa de atajos
  useEffect(() => {
    shortcutsRef.current.clear();
    shortcuts.forEach((shortcut) => {
      if (shortcut.enabled !== false) {
        shortcutsRef.current.set(shortcut.key, shortcut);
      }
    });
  }, [shortcuts]);

  // Manejador global de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = getNormalizedKey(event);

      if (!normalizedKey) return;

      const shortcut = shortcutsRef.current.get(
        normalizedKey as KeyboardShortcutKey
      );

      if (!shortcut) return;

      // Prevenir comportamientos por defecto solo para nuestros atajos
      // F12 generalmente abre DevTools, pero lo permitimos
      if (normalizedKey === "F12") {
        // Permitir que F12 abra DevTools en desarrollo, pero también ejecutar nuestro handler
        event.preventDefault();
      } else if (normalizedKey !== "F1") {
        // Prevenir comportamientos por defecto para otros atajos
        event.preventDefault();
      }

      shortcut.handler();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [getNormalizedKey]);

}
