import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ============================================================================
// Types
// ============================================================================

export type FormType = "product" | "customer" | "sale" | "category";

export interface ProductPrefillData {
  name?: string;
  price?: number;
  sku?: string;
  stock?: number;
  categoryId?: string;
  description?: string;
}

export interface CustomerPrefillData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
  note?: string;
  gps?: string;
}

export interface SalePrefillData {
  customerId?: string;
  customerName?: string;
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface CategoryPrefillData {
  name?: string;
  description?: string;
  parentId?: string;
}

export type PrefillData =
  | ProductPrefillData
  | CustomerPrefillData
  | SalePrefillData
  | CategoryPrefillData;

export interface FormPrefillState {
  formType: FormType;
  data: PrefillData;
  timestamp: number;
}

// ============================================================================
// Context
// ============================================================================

interface FormPrefillContextType {
  /** Current prefill state, null if no prefill data */
  prefillState: FormPrefillState | null;

  /** Set prefill data for a specific form type */
  setPrefillData: (formType: FormType, data: PrefillData) => void;

  /** Get prefill data for a specific form type (returns null if not for this form) */
  getPrefillData: <T extends PrefillData>(formType: FormType) => T | null;

  /** Clear prefill data (call after consuming) */
  clearPrefillData: () => void;

  /** Check if there's pending prefill data for a form type */
  hasPrefillData: (formType: FormType) => boolean;
}

const FormPrefillContext = createContext<FormPrefillContextType | undefined>(
  undefined
);

// ============================================================================
// Provider
// ============================================================================

interface FormPrefillProviderProps {
  children: ReactNode;
}

export function FormPrefillProvider({ children }: FormPrefillProviderProps) {
  const [prefillState, setPrefillState] = useState<FormPrefillState | null>(
    null
  );

  const setPrefillData = useCallback(
    (formType: FormType, data: PrefillData) => {
      console.log("[FormPrefillContext] Setting prefill data:", {
        formType,
        data,
      });
      setPrefillState({
        formType,
        data,
        timestamp: Date.now(),
      });
    },
    []
  );

  const getPrefillData = useCallback(
    <T extends PrefillData>(formType: FormType): T | null => {
      if (!prefillState || prefillState.formType !== formType) {
        return null;
      }

      // Check if data is stale (older than 5 minutes)
      const isStale = Date.now() - prefillState.timestamp > 5 * 60 * 1000;
      if (isStale) {
        console.log("[FormPrefillContext] Prefill data is stale, clearing");
        setPrefillState(null);
        return null;
      }

      return prefillState.data as T;
    },
    [prefillState]
  );

  const clearPrefillData = useCallback(() => {
    console.log("[FormPrefillContext] Clearing prefill data");
    setPrefillState(null);
  }, []);

  const hasPrefillData = useCallback(
    (formType: FormType): boolean => {
      if (!prefillState || prefillState.formType !== formType) {
        return false;
      }

      // Check if data is stale
      const isStale = Date.now() - prefillState.timestamp > 5 * 60 * 1000;
      return !isStale;
    },
    [prefillState]
  );

  return (
    <FormPrefillContext.Provider
      value={{
        prefillState,
        setPrefillData,
        getPrefillData,
        clearPrefillData,
        hasPrefillData,
      }}
    >
      {children}
    </FormPrefillContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useFormPrefill() {
  const context = useContext(FormPrefillContext);

  if (!context) {
    throw new Error("useFormPrefill must be used within a FormPrefillProvider");
  }

  return context;
}

// ============================================================================
// Utility Hook for specific form types
// ============================================================================

/**
 * Hook for consuming product form prefill data
 * Automatically clears data after first access
 */
export function useProductPrefill() {
  const { getPrefillData, clearPrefillData, hasPrefillData } = useFormPrefill();

  const getAndClear = useCallback((): ProductPrefillData | null => {
    const data = getPrefillData<ProductPrefillData>("product");
    if (data) {
      // Clear after a short delay to allow the form to read the data
      setTimeout(() => clearPrefillData(), 100);
    }
    return data;
  }, [getPrefillData, clearPrefillData]);

  return {
    hasData: hasPrefillData("product"),
    getData: getAndClear,
  };
}

/**
 * Hook for consuming customer form prefill data
 * Automatically clears data after first access
 */
export function useCustomerPrefill() {
  const { getPrefillData, clearPrefillData, hasPrefillData } = useFormPrefill();

  const getAndClear = useCallback((): CustomerPrefillData | null => {
    const data = getPrefillData<CustomerPrefillData>("customer");
    if (data) {
      setTimeout(() => clearPrefillData(), 100);
    }
    return data;
  }, [getPrefillData, clearPrefillData]);

  return {
    hasData: hasPrefillData("customer"),
    getData: getAndClear,
  };
}

/**
 * Hook for consuming sale form prefill data
 * Automatically clears data after first access
 */
export function useSalePrefill() {
  const { getPrefillData, clearPrefillData, hasPrefillData } = useFormPrefill();

  const getAndClear = useCallback((): SalePrefillData | null => {
    const data = getPrefillData<SalePrefillData>("sale");
    if (data) {
      setTimeout(() => clearPrefillData(), 100);
    }
    return data;
  }, [getPrefillData, clearPrefillData]);

  return {
    hasData: hasPrefillData("sale"),
    getData: getAndClear,
  };
}

/**
 * Hook for consuming category form prefill data
 * Automatically clears data after first access
 */
export function useCategoryPrefill() {
  const { getPrefillData, clearPrefillData, hasPrefillData } = useFormPrefill();

  const getAndClear = useCallback((): CategoryPrefillData | null => {
    const data = getPrefillData<CategoryPrefillData>("category");
    if (data) {
      setTimeout(() => clearPrefillData(), 100);
    }
    return data;
  }, [getPrefillData, clearPrefillData]);

  return {
    hasData: hasPrefillData("category"),
    getData: getAndClear,
  };
}
