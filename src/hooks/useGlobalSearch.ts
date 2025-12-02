import { useState, useCallback, useRef, useEffect } from "react";
import { getProducts, type ProductDto } from "@/api/productsApi";
import { getSales, type SaleDto } from "@/api/salesApi";
import { getCustomers, type CustomerDto } from "@/api/customersApi";

// Constants
const DEBOUNCE_MS = 300;
const MAX_RESULTS_PER_GROUP = 5;
const HISTORY_KEY = "global-search-history";
const MAX_HISTORY_ITEMS = 5;

// Types
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type: "search";
}

export interface GlobalSearchResults {
  products: ProductDto[];
  customers: CustomerDto[];
  sales: SaleDto[];
}

export interface UseGlobalSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: GlobalSearchResults;
  isLoading: boolean;
  error: string | null;
  history: SearchHistoryItem[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
}

// Helper to get history from localStorage
function getStoredHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored) as SearchHistoryItem[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// Helper to save history to localStorage
function saveHistory(history: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>({
    products: [],
    customers: [],
    sales: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>(getStoredHistory);

  // Refs for debounce and abort
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear results
  const clearResults = useCallback(() => {
    setResults({ products: [], customers: [], sales: [] });
    setError(null);
  }, []);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();

      if (!trimmed) {
        clearResults();
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all in parallel
        const [productsResult, customersResult, salesResult] =
          await Promise.allSettled([
            getProducts(trimmed, { signal: abortControllerRef.current.signal }),
            getCustomers(),
            getSales(trimmed),
          ]);

        // Process products
        let products: ProductDto[] = [];
        if (productsResult.status === "fulfilled") {
          products = productsResult.value.slice(0, MAX_RESULTS_PER_GROUP);
        }

        // Process customers - filter client-side since API doesn't support search
        let customers: CustomerDto[] = [];
        if (customersResult.status === "fulfilled") {
          const searchLower = trimmed.toLowerCase();
          customers = customersResult.value
            .filter(
              (c) =>
                c.name.toLowerCase().includes(searchLower) ||
                c.email.toLowerCase().includes(searchLower) ||
                (c.phone && c.phone.includes(trimmed))
            )
            .slice(0, MAX_RESULTS_PER_GROUP);
        }

        // Process sales
        let sales: SaleDto[] = [];
        if (salesResult.status === "fulfilled") {
          sales = salesResult.value.slice(0, MAX_RESULTS_PER_GROUP);
        }

        setResults({ products, customers, sales });
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError("Error al buscar. Intenta de nuevo.");
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [clearResults]
  );

  // Debounced query setter
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, DEBOUNCE_MS);
    },
    [performSearch]
  );

  // Add to history
  const addToHistory = useCallback((queryToAdd: string) => {
    const trimmed = queryToAdd.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== trimmed);

      // Add new item at the beginning
      const newItem: SearchHistoryItem = {
        query: trimmed,
        timestamp: Date.now(),
        type: "search",
      };
      const newHistory: SearchHistoryItem[] = [newItem, ...filtered].slice(
        0,
        MAX_HISTORY_ITEMS
      );

      saveHistory(newHistory);
      return newHistory;
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // Remove single item from history
  const removeFromHistory = useCallback((queryToRemove: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.query !== queryToRemove);
      saveHistory(newHistory);
      return newHistory;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}
