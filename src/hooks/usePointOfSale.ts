import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiError } from "@/api/apiClient";
import type { ProductDto } from "@/api/productsApi";
import { getProductByBarcode, getProducts } from "@/api/productsApi";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";
import type { SaleDto, PaymentCreateDto } from "@/api/salesApi";
import { createSale } from "@/api/salesApi";
import type { PosHoldDto, PosHoldUpsertDto } from "@/api/posApi";
import { getPosHolds, savePosHold } from "@/api/posApi";
import { useAuth } from "@/context/AuthContext";

export interface PosLineItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  barcode?: string;
  brand?: string;
}

const DEFAULT_TAX_RATE = Number(
  (import.meta as any).env?.VITE_DEFAULT_TAX_RATE ?? 0.0825
);

interface HeldOrderSnapshot {
  items: PosLineItem[];
  customerId: string;
  discount: number;
}

export interface UsePointOfSaleOptions {
  /**
   * Optional callback when a sale is persisted.
   */
  onSaleCreated?: (sale: SaleDto) => void;
}

export function usePointOfSale(options?: UsePointOfSaleOptions) {
  const onSaleCreated = options?.onSaleCreated;
  const [items, setItems] = useState<PosLineItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isLookupPending, setIsLookupPending] = useState(false);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerId, setCustomerId] = useState("");

  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment dialog state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "Cash" | "Card" | "Voucher" | "Transfer" | "Other"
  >("Cash");
  const [amountReceived, setAmountReceived] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  // Holds management
  const [holds, setHolds] = useState<PosHoldDto[]>([]);
  const [holdsLoading, setHoldsLoading] = useState(false);

  // Tenant/User scoped storage keys
  const { auth } = useAuth();
  const storageScope = `${auth?.tenantId ?? "global"}:${
    auth?.userId ?? "anon"
  }`;
  const HELD_ORDER_KEY = `pos:heldOrder:${storageScope}`;
  const TAX_RATE_KEY = `pos:taxRate:${auth?.tenantId ?? "global"}`;

  // Tax rate configurable per tenant (persisted)
  const readTaxRateFromStorage = useCallback(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(TAX_RATE_KEY) : null;
    const parsed = raw != null ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : DEFAULT_TAX_RATE;
  }, [TAX_RATE_KEY]);

  const [taxRate, setTaxRate] = useState<number>(readTaxRateFromStorage);

  // Reload tax rate when tenant changes
  useEffect(() => {
    setTaxRate(readTaxRateFromStorage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.tenantId]);

  // Persist tax rate changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TAX_RATE_KEY, String(taxRate));
    }
  }, [TAX_RATE_KEY, taxRate]);

  // Load holds list on mount/tenant change
  useEffect(() => {
    async function loadHolds() {
      setHoldsLoading(true);
      try {
        const data = await getPosHolds();
        setHolds(data);
      } catch (error) {
        console.error("Failed to load holds", error);
      } finally {
        setHoldsLoading(false);
      }
    }
    loadHolds();
  }, [auth?.tenantId, auth?.userId]);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const data = await getCustomers();
      const active = data.filter((customer) => customer.isActive);
      setCustomers(active);
      setCustomerId((current) => current || active[0]?.id || "");
    } catch (error) {
      console.error("Failed to load customers", error);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setIsSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const products = await getProducts(searchTerm.trim(), {
          signal: controller.signal,
        });

        if (!active) {
          return;
        }

        setSearchResults(products.slice(0, 8));
        setSearchError(products.length === 0 ? "Sin coincidencias" : null);
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }

        console.error("Failed to search products", error);
        setSearchError("No pudimos buscar productos");
      } finally {
        if (active && !controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const addProductToOrder = useCallback((product: ProductDto) => {
    setItems((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => {
          if (line.productId !== product.id) {
            return line;
          }

          if (product.stock > 0 && line.quantity >= product.stock) {
            return line;
          }

          const nextQuantity =
            product.stock > 0
              ? Math.min(line.quantity + 1, product.stock)
              : line.quantity + 1;

          return {
            ...line,
            quantity: nextQuantity,
          };
        });
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          barcode: product.barcode,
          brand: product.brand,
        },
      ];
    });
  }, []);

  const lookupProduct = useCallback(async (term: string) => {
    const normalized = term.trim();
    if (!normalized) {
      return null;
    }

    try {
      return await getProductByBarcode(normalized);
    } catch (error) {
      const apiError = error as ApiError;
      if (!apiError?.status || apiError.status !== 404) {
        console.error("Barcode lookup failed", error);
      }
    }

    try {
      const alternatives = await getProducts(normalized);
      return alternatives[0] ?? null;
    } catch (error) {
      console.error("Fallback search failed", error);
      return null;
    }
  }, []);

  const addProductByLookup = useCallback(
    async (term: string) => {
      setIsLookupPending(true);
      let product: ProductDto | null = null;
      try {
        product = await lookupProduct(term);
        if (product) {
          addProductToOrder(product);
          setSearchTerm("");
          setSearchResults([]);
          setSearchError(null);
        }
      } finally {
        setIsLookupPending(false);
      }
      return product;
    },
    [addProductToOrder, lookupProduct]
  );

  const incrementItem = useCallback((productId: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }
        if (item.stock > 0 && item.quantity >= item.stock) {
          return item;
        }
        const nextQuantity =
          item.stock > 0
            ? Math.min(item.quantity + 1, item.stock)
            : item.quantity + 1;
        return {
          ...item,
          quantity: nextQuantity,
        };
      })
    );
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId)
    );
  }, []);

  const clearOrder = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const holdOrder = useCallback(async () => {
    if (items.length === 0) {
      return;
    }
    setHoldsLoading(true);
    try {
      const dto: PosHoldUpsertDto = {
        customerId,
        discount,
        notes: null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      const saved = await savePosHold(dto);
      setHolds((current) => [saved, ...current]);
      clearOrder();
    } catch (error) {
      console.error("Failed to save hold", error);
    } finally {
      setHoldsLoading(false);
    }
  }, [clearOrder, customerId, discount, items]);

  const resumeHeldOrder = useCallback(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(HELD_ORDER_KEY);
      if (raw) {
        try {
          const snapshot = JSON.parse(raw) as HeldOrderSnapshot;
          setItems(snapshot.items);
          setCustomerId(snapshot.customerId);
          setDiscount(snapshot.discount);
          localStorage.removeItem(HELD_ORDER_KEY);
        } catch {
          // Invalid snapshot, ignore
        }
      }
    }
  }, [HELD_ORDER_KEY]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const appliedDiscount = useMemo(() => {
    if (discount <= 0) {
      return 0;
    }
    return Math.min(discount, subtotal);
  }, [discount, subtotal]);

  const taxableBase = useMemo(
    () => Math.max(subtotal - appliedDiscount, 0),
    [appliedDiscount, subtotal]
  );

  const taxAmount = useMemo(
    () => Number((taxableBase * taxRate).toFixed(2)),
    [taxableBase, taxRate]
  );

  const total = useMemo(
    () => Number((taxableBase + taxAmount).toFixed(2)),
    [taxAmount, taxableBase]
  );

  const submitSale = useCallback(async () => {
    if (!customerId) {
      throw new Error("Selecciona un cliente antes de cobrar");
    }

    if (items.length === 0) {
      throw new Error("Agrega al menos un producto a la orden");
    }

    setIsSubmitting(true);
    try {
      const payments: PaymentCreateDto[] = [];

      if (selectedPaymentMethod === "Cash") {
        const received = amountReceived ?? total;
        payments.push({
          method: "Cash",
          amount: total,
          amountReceived: received,
        });
      } else {
        payments.push({
          method: selectedPaymentMethod,
          amount: total,
          reference: paymentReference || undefined,
        });
      }

      const sale = await createSale({
        date: new Date().toISOString(),
        customerId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        payments,
      });

      clearOrder();
      setIsPaymentDialogOpen(false);
      setAmountReceived(null);
      setPaymentReference("");
      setSelectedPaymentMethod("Cash");
      onSaleCreated?.(sale);
      return sale;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    clearOrder,
    customerId,
    items,
    selectedPaymentMethod,
    amountReceived,
    paymentReference,
    total,
    onSaleCreated,
  ]);

  return {
    items,
    customers,
    customersLoading,
    customerId,
    setCustomerId,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchError,
    isSearchLoading,
    isLookupPending,
    addProductToOrder,
    addProductByLookup,
    incrementItem,
    decrementItem,
    removeItem,
    clearOrder,
    holdOrder,
    resumeHeldOrder,
    hasHeldOrder: false, // Placeholder - can be enhanced later
    holds,
    holdsLoading,
    subtotal,
    discount,
    setDiscount,
    appliedDiscount,
    taxAmount,
    taxRate,
    setTaxRate,
    total,
    submitSale,
    isSubmitting,
    reloadCustomers: loadCustomers,
    // Payment dialog state and handlers
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    amountReceived,
    setAmountReceived,
    paymentReference,
    setPaymentReference,
  };
}
