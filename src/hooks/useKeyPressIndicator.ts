import { useState, useEffect } from "react";

interface KeyPressIndicator {
  key: string;
  timestamp: number;
}

/**
 * Hook para mostrar indicadores visuales cuando se presiona un atajo
 */
export function useKeyPressIndicator() {
  const [recentKeyPress, setRecentKeyPress] =
    useState<KeyPressIndicator | null>(null);

  useEffect(() => {
    if (!recentKeyPress) return;

    const timer = setTimeout(() => {
      setRecentKeyPress(null);
    }, 400); // Mostrar indicador por 400ms

    return () => clearTimeout(timer);
  }, [recentKeyPress]);

  const triggerIndicator = (key: string) => {
    setRecentKeyPress({ key, timestamp: Date.now() });
  };

  return {
    recentKeyPress,
    triggerIndicator,
  };
}
