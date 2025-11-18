import { useCallback, useEffect, useState } from "react";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";

export function useCustomerSearch() {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los clientes al montar
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      const active = data.filter((c) => c.isActive);
      setCustomers(active);
    } catch (err) {
      console.error("Failed to load customers", err);
      setError("Error al cargar clientes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar clientes al montar el hook
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Buscar clientes con debounce
  const searchCustomers = useCallback(
    (searchTerm: string): { results: CustomerDto[]; isSearching: boolean } => {
      if (!searchTerm.trim()) {
        return { results: customers, isSearching: false };
      }

      const normalized = searchTerm.toLowerCase().trim();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(normalized) ||
          customer.email.toLowerCase().includes(normalized) ||
          (customer.phone && customer.phone.includes(normalized))
      );

      return {
        results: filtered,
        isSearching: false,
      };
    },
    [customers]
  );

  const reload = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    error,
    searchCustomers,
    reload,
  };
}
