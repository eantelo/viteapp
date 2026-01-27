import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { ApiError } from "@/api/apiClient";
import type { ProductDto } from "@/api/productsApi";
import { getProductByBarcode, getProducts } from "@/api/productsApi";
import type { CustomerDto } from "@/api/customersApi";
import { getCustomers } from "@/api/customersApi";
import type { SaleDto } from "@/api/salesApi";
import {
  createSale,
  PaymentMethod,
  type PaymentCreateDto,
  type PaymentMethodType,
} from "@/api/salesApi";
import type { HeldOrderDto, HeldOrderItemDto } from "@/api/heldOrdersApi";
import {
  getHeldOrders,
  createHeldOrder,
  deleteHeldOrder,
} from "@/api/heldOrdersApi";

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

const TAX_RATE = 0.0825;
const AUTO_SAVE_INTERVAL = 30000; // 30 segundos

export interface UsePointOfSaleOptions {
  /**
   * Whether POS should include taxes when calculating totals. Defaults to true.
   * Set to false in the Punto de Venta page to exclude taxes from totals.
   */
  includeTax?: boolean;
  /**
   * Optional callback when a sale is persisted.
   */
  onSaleCreated?: (sale: SaleDto) => void;
}

export function usePointOfSale(options?: UsePointOfSaleOptions) {
  const includeTax = options?.includeTax ?? true;
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [discount, setDiscount] = useState(0);
  const [heldOrders, setHeldOrders] = useState<HeldOrderDto[]>([]);
  const [heldOrdersLoading, setHeldOrdersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);

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

  const loadHeldOrders = useCallback(async () => {
    setHeldOrdersLoading(true);
    try {
      const orders = await getHeldOrders();
      setHeldOrders(orders);
    } catch (error) {
      console.error("Failed to load held orders", error);
    } finally {
      setHeldOrdersLoading(false);
    }
  }, []);

  // Load data only once on mount, not when callbacks change reference
  useEffect(() => {
    loadCustomers();
    loadHeldOrders();
  }, []);

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
    [addProductToOrder, lookupProduct],
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
      }),
    );
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }, []);

  const updateItemPrice = useCallback((productId: string, newPrice: number) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, price: newPrice } : item,
      ),
    );
  }, []);

  const clearOrder = useCallback(() => {
    setItems([]);
    setDiscount(0);
    // Limpiar auto-guardado al vaciar la orden
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const holdOrder = useCallback(async () => {
    if (items.length === 0) {
      return;
    }

    const heldItems: HeldOrderItemDto[] = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      stock: item.stock,
      barcode: item.barcode,
      brand: item.brand,
    }));

    const customerName = customerId
      ? customers.find((c) => c.id === customerId)?.name
      : undefined;

    try {
      await createHeldOrder({
        customerId: customerId || null,
        customerName,
        items: heldItems,
        discount,
      });

      clearOrder();
      await loadHeldOrders();
    } catch (error) {
      console.error("Failed to hold order", error);
      throw error;
    }
  }, [items, customerId, customers, discount, clearOrder, loadHeldOrders]);

  const resumeHeldOrder = useCallback((order: HeldOrderDto) => {
    const restoredItems: PosLineItem[] = order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      stock: item.stock,
      barcode: item.barcode,
      brand: item.brand,
    }));

    setItems(restoredItems);
    setCustomerId(order.customerId || "");
    setDiscount(order.discount);
  }, []);

  const removeHeldOrder = useCallback(
    async (orderId: string) => {
      try {
        await deleteHeldOrder(orderId);
        await loadHeldOrders();
      } catch (error) {
        console.error("Failed to delete held order", error);
        throw error;
      }
    },
    [loadHeldOrders],
  );

  // Auto-guardado de orden actual
  useEffect(() => {
    // Limpiar timer previo
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Solo auto-guardar si hay items y el auto-guardado está habilitado
    if (items.length > 0) {
      autoSaveTimerRef.current = window.setTimeout(async () => {
        try {
          const heldItems: HeldOrderItemDto[] = items.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            barcode: item.barcode,
            brand: item.brand,
          }));

          const customerName = customerId
            ? customers.find((c) => c.id === customerId)?.name
            : undefined;

          await createHeldOrder({
            customerId: customerId || null,
            customerName,
            items: heldItems,
            discount,
          });

          await loadHeldOrders();
        } catch (error) {
          console.error("Auto-save failed", error);
        }
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [items, customerId, customers, discount, loadHeldOrders]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const appliedDiscount = useMemo(() => {
    if (discount <= 0) {
      return 0;
    }
    return Math.min(discount, subtotal);
  }, [discount, subtotal]);

  const taxableBase = useMemo(
    () => Math.max(subtotal - appliedDiscount, 0),
    [appliedDiscount, subtotal],
  );

  // If includeTax is false (e.g., in the POS flows), effective tax is 0.
  const effectiveTaxRate = includeTax ? TAX_RATE : 0;

  const taxAmount = useMemo(
    () => Number((taxableBase * effectiveTaxRate).toFixed(2)),
    [taxableBase, effectiveTaxRate],
  );

  const total = useMemo(
    () => Number((taxableBase + taxAmount).toFixed(2)),
    [taxAmount, taxableBase],
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) {
      return customers;
    }
    const term = customerSearchTerm.toLowerCase();
    return customers.filter((customer) => {
      const name = (customer.name ?? "").toLowerCase();
      const email = (customer.email ?? "").toLowerCase();
      const phone = customer.phone ?? "";
      return (
        name.includes(term) || email.includes(term) || phone.includes(term)
      );
    });
  }, [customers, customerSearchTerm]);

  const submitSale = useCallback(
    async (
      paymentMethod?: PaymentMethodType,
      amountReceived?: number,
      paymentReference?: string,
    ) => {
      // Allow sales without a specific customer (generic customer)
      // if (customerId) {
      //   throw new Error("Selecciona un cliente antes de cobrar");
      // }

      if (items.length === 0) {
        throw new Error("Agrega al menos un producto a la orden");
      }

      if (
        paymentMethod !== undefined &&
        paymentMethod === PaymentMethod.Cash &&
        typeof amountReceived === "number" &&
        amountReceived < total
      ) {
        throw new Error("El monto recibido debe ser mayor o igual al total");
      }

      setIsSubmitting(true);
      try {
        const payments: PaymentCreateDto[] =
          paymentMethod !== undefined
            ? [
                {
                  method: paymentMethod,
                  amount: total,
                  amountReceived:
                    paymentMethod === PaymentMethod.Cash
                      ? amountReceived
                      : undefined,
                  reference: paymentReference?.trim() || undefined,
                },
              ]
            : [];

        const sale = await createSale({
          date: new Date().toISOString(),
          customerId: customerId || "", // Allow empty string for generic customer
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          payments,
        });

        clearOrder();
        await loadHeldOrders();
        onSaleCreated?.(sale);
        return sale;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearOrder, customerId, items, total, onSaleCreated, loadHeldOrders],
  );

  return {
    items,
    customers,
    customersLoading,
    customerId,
    setCustomerId,
    customerSearchTerm,
    setCustomerSearchTerm,
    filteredCustomers,
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
    removeHeldOrder,
    heldOrders,
    heldOrdersLoading,
    reloadHeldOrders: loadHeldOrders,
    subtotal,
    discount,
    setDiscount,
    appliedDiscount,
    taxAmount,
    taxRate: effectiveTaxRate,
    total,
    submitSale,
    isSubmitting,
    reloadCustomers: loadCustomers,
    updateItemPrice,
  };
}
