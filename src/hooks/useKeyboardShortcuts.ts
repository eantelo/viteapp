import { useEffect, useCallback, useRef } from "react";

export type KeyboardShortcutKey =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
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

interface ShortcutConfig extends KeyboardShortcut {
  code?: string;
}

const SHORTCUTS_CONFIG: Record<
  KeyboardShortcutKey,
  Omit<ShortcutConfig, "handler">
> = {
  F1: {
    key: "F1",
    label: "F1",
    description: "Mostrar ayuda de atajos",
    code: "F1",
  },
  F2: {
    key: "F2",
    label: "F2",
    description: "Focus en búsqueda de productos",
    code: "F2",
  },
  F3: {
    key: "F3",
    label: "F3",
    description: "Buscar/Crear cliente",
    code: "F3",
  },
  F4: {
    key: "F4",
    label: "F4",
    description: "Aplicar descuento",
    code: "F4",
  },
  F8: {
    key: "F8",
    label: "F8",
    description: "Poner orden en espera",
    code: "F8",
  },
  F9: {
    key: "F9",
    label: "F9",
    description: "Proceder a cobrar",
    code: "F9",
  },
  F12: {
    key: "F12",
    label: "F12",
    description: "Abrir cajón",
    code: "F12",
  },
  Escape: {
    key: "Escape",
    label: "ESC",
    description: "Cancelar/Limpiar orden actual",
    code: "Escape",
  },
  "Ctrl+N": {
    key: "Ctrl+N",
    label: "Ctrl+N",
    description: "Nueva venta",
  },
  "Ctrl+H": {
    key: "Ctrl+H",
    label: "Ctrl+H",
    description: "Ver historial",
  },
};

/**
 * Hook para manejar atajos de teclado globales
 * Previene conflictos con atajos del navegador
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const lastPressedKeyRef = useRef<string>("");

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

      lastPressedKeyRef.current = normalizedKey;
      shortcut.handler();

      // Limpiar la tecla presionada después de 100ms
      setTimeout(() => {
        lastPressedKeyRef.current = "";
      }, 100);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [getNormalizedKey]);

  return {
    lastPressedKey: lastPressedKeyRef.current,
    getShortcutConfig: (key: KeyboardShortcutKey) => SHORTCUTS_CONFIG[key],
    allShortcuts: Object.values(SHORTCUTS_CONFIG) as Array<{
      key: KeyboardShortcutKey;
      label: string;
      description: string;
    }>,
  };
}
