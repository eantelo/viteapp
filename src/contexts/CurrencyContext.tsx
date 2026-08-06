import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrencyConfiguration } from "@/api/currenciesApi";
import { useAuth } from "@/context/AuthContext";
import type { CurrencyConfiguration } from "@/types/Currency";

const STORAGE_KEY_PREFIX = "salesnet.display-currency";

interface CurrencyContextValue {
  configuration: CurrencyConfiguration | null;
  displayCurrencyCode: string;
  setDisplayCurrencyCode: (code: string) => void;
  formatCurrency: (value: number, currencyCode?: string) => string;
  refreshCurrencies: () => Promise<void>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const storageKey = auth?.tenantId
    ? `${STORAGE_KEY_PREFIX}.${auth.tenantId}`
    : STORAGE_KEY_PREFIX;
  const [configuration, setConfiguration] = useState<CurrencyConfiguration | null>(null);
  const [displayCurrencyCode, setDisplayCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);

  const refreshCurrencies = useCallback(async () => {
    if (!auth) {
      setConfiguration(null);
      return;
    }

    setIsLoading(true);
    try {
      const next = await getCurrencyConfiguration();
      setConfiguration(next);
      const enabled = next.enabledCurrencies.some(
        (currency) => currency.isEnabled && currency.currencyCode === displayCurrencyCode,
      );
      if (!enabled) {
        setDisplayCurrency(next.defaultCurrencyCode);
        localStorage.setItem(storageKey, next.defaultCurrencyCode);
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth, displayCurrencyCode, storageKey]);

  useEffect(() => {
    // Sincroniza la preferencia externa cuando cambia el tenant autenticado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCurrency(localStorage.getItem(storageKey) ?? "USD");
  }, [storageKey]);

  useEffect(() => {
    // Carga inicial y recarga al cambiar la sesión o preferencia monetaria.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCurrencies();
  }, [refreshCurrencies]);

  const setDisplayCurrencyCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();
    setDisplayCurrency(normalized);
    localStorage.setItem(storageKey, normalized);
  }, [storageKey]);

  const formatCurrency = useCallback(
    (value: number, currencyCode?: string) => {
      const code = currencyCode ?? displayCurrencyCode;
      const minorUnits = configuration?.enabledCurrencies.find(
        (currency) => currency.currencyCode === code,
      )?.minorUnits;
      return new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: code,
        minimumFractionDigits: minorUnits,
        maximumFractionDigits: minorUnits,
      }).format(value);
    },
    [configuration, displayCurrencyCode],
  );

  const value = useMemo(
    () => ({
      configuration,
      displayCurrencyCode,
      setDisplayCurrencyCode,
      formatCurrency,
      refreshCurrencies,
      isLoading,
    }),
    [configuration, displayCurrencyCode, setDisplayCurrencyCode, formatCurrency, refreshCurrencies, isLoading],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error("useCurrency debe utilizarse dentro de CurrencyProvider.");
  return value;
}
