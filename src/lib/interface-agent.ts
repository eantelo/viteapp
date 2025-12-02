/**
 * Interface Agent Module
 *
 * Provides natural language command processing for UI navigation and actions.
 * Handles ACTION_DATA markers from backend responses and executes corresponding
 * interface actions (navigation, form prefill, custom actions, confirmations).
 */

// ============================================================================
// Types
// ============================================================================

export type InterfaceActionType =
  | "navigation"
  | "formPrefill"
  | "custom"
  | "confirm";

export interface NavigationAction {
  type: "navigation";
  path: string;
  message?: string;
}

export interface FormPrefillAction {
  type: "formPrefill";
  formType: "product" | "customer" | "sale" | "category";
  path: string;
  data: Record<string, unknown>;
  message?: string;
}

export interface CustomAction {
  type: "custom";
  actionId: string;
  parameters?: Record<string, unknown>;
  message?: string;
}

export interface ConfirmAction {
  type: "confirm";
  actionType: string;
  targetId: string;
  targetName: string;
  warningMessage?: string;
  message?: string;
}

export type InterfaceAction =
  | NavigationAction
  | FormPrefillAction
  | CustomAction
  | ConfirmAction;

export interface ActionHandler {
  id: string;
  description: string;
  execute: (params?: Record<string, unknown>) => void | Promise<void>;
}

export interface ExtractedAction {
  action: InterfaceAction;
  textContent: string;
}

// ============================================================================
// Route Aliases (Spanish to path mapping)
// ============================================================================

export const ROUTE_ALIASES: Record<string, string> = {
  // Dashboard
  dashboard: "/dashboard",
  panel: "/dashboard",
  inicio: "/dashboard",
  home: "/dashboard",
  principal: "/dashboard",

  // Products
  productos: "/products",
  catalogo: "/products",
  producto: "/products",
  inventario: "/products",
  "nuevo producto": "/products/new",
  "crear producto": "/products/new",
  "agregar producto": "/products/new",

  // Sales
  ventas: "/sales",
  venta: "/sales",
  "nueva venta": "/sales/new",
  "crear venta": "/sales/new",
  "registrar venta": "/sales/new",

  // POS
  pos: "/pos",
  "punto de venta": "/pos",
  caja: "/pos",
  "pos restaurante": "/pos/restaurant",
  restaurante: "/pos/restaurant",

  // Customers
  clientes: "/customers",
  cliente: "/customers",
  "nuevo cliente": "/customers",
  "crear cliente": "/customers",

  // Categories
  categorias: "/categories",
  categoria: "/categories",

  // Settings
  configuracion: "/settings",
  ajustes: "/settings",
  settings: "/settings",
};

// ============================================================================
// Action Registry
// ============================================================================

const actionRegistry = new Map<string, ActionHandler>();

/**
 * Register a custom action handler
 */
export function registerAction(handler: ActionHandler): void {
  actionRegistry.set(handler.id, handler);
  console.log(`[interface-agent] Registered action: ${handler.id}`);
}

/**
 * Unregister a custom action handler
 */
export function unregisterAction(id: string): boolean {
  const deleted = actionRegistry.delete(id);
  if (deleted) {
    console.log(`[interface-agent] Unregistered action: ${id}`);
  }
  return deleted;
}

/**
 * Get a registered action handler
 */
export function getAction(id: string): ActionHandler | undefined {
  return actionRegistry.get(id);
}

/**
 * Get all registered action handlers
 */
export function getAllActions(): ActionHandler[] {
  return Array.from(actionRegistry.values());
}

/**
 * Execute a registered action by ID
 */
export async function executeAction(
  id: string,
  params?: Record<string, unknown>
): Promise<boolean> {
  const handler = actionRegistry.get(id);
  if (!handler) {
    console.warn(`[interface-agent] Action not found: ${id}`);
    return false;
  }

  try {
    await handler.execute(params);
    console.log(`[interface-agent] Executed action: ${id}`, params);
    return true;
  } catch (error) {
    console.error(`[interface-agent] Error executing action ${id}:`, error);
    return false;
  }
}

// ============================================================================
// Action Data Extraction
// ============================================================================

const ACTION_DATA_REGEX = /<<<ACTION_DATA>>>([\s\S]*?)<<<END_ACTION_DATA>>>/;

/**
 * Extract ACTION_DATA from a response string
 * Returns the parsed action and the remaining text content
 */
export function extractActionData(response: string): ExtractedAction | null {
  const match = response.match(ACTION_DATA_REGEX);

  if (!match) {
    return null;
  }

  try {
    const actionJson = match[1].trim();
    const action = JSON.parse(actionJson) as InterfaceAction;

    // Remove the ACTION_DATA markers from the text
    const textContent = response.replace(ACTION_DATA_REGEX, "").trim();

    return {
      action,
      textContent,
    };
  } catch (error) {
    console.error("[interface-agent] Failed to parse ACTION_DATA:", error);
    return null;
  }
}

/**
 * Check if a response contains ACTION_DATA
 */
export function hasActionData(response: string): boolean {
  return ACTION_DATA_REGEX.test(response);
}

// ============================================================================
// Route Resolution
// ============================================================================

/**
 * Resolve a destination string to an actual route path
 */
export function resolveRoute(destination: string): string {
  // If it's already a path, return it
  if (destination.startsWith("/")) {
    return destination;
  }

  const normalized = destination.toLowerCase().trim();

  // Check exact match first
  if (ROUTE_ALIASES[normalized]) {
    return ROUTE_ALIASES[normalized];
  }

  // Check partial matches
  for (const [alias, path] of Object.entries(ROUTE_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return path;
    }
  }

  // Default to dashboard
  return "/dashboard";
}

/**
 * Get human-readable page name from path
 */
export function getPageName(path: string): string {
  const pageNames: Record<string, string> = {
    "/dashboard": "Panel Principal",
    "/products": "Productos",
    "/products/new": "Nuevo Producto",
    "/sales": "Ventas",
    "/sales/new": "Nueva Venta",
    "/pos": "Punto de Venta",
    "/pos/restaurant": "POS Restaurante",
    "/customers": "Clientes",
    "/categories": "Categorías",
    "/settings": "Configuración",
  };

  return pageNames[path] || path;
}

// ============================================================================
// Default Actions Registration
// ============================================================================

/**
 * Register default interface actions
 * Call this at app initialization
 */
export function registerDefaultActions(): void {
  // Focus product search
  registerAction({
    id: "focus-product-search",
    description: "Focus the product search input",
    execute: (params) => {
      const searchInput = document.querySelector<HTMLInputElement>(
        '[data-search="products"], #product-search, input[placeholder*="producto"]'
      );
      if (searchInput) {
        searchInput.focus();
        if (params?.query) {
          searchInput.value = String(params.query);
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    },
  });

  // Focus customer search
  registerAction({
    id: "focus-customer-search",
    description: "Focus the customer search input",
    execute: (params) => {
      const searchInput = document.querySelector<HTMLInputElement>(
        '[data-search="customers"], #customer-search, input[placeholder*="cliente"]'
      );
      if (searchInput) {
        searchInput.focus();
        if (params?.query) {
          searchInput.value = String(params.query);
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    },
  });

  // Generic focus search
  registerAction({
    id: "focus-search",
    description: "Focus the main search input",
    execute: (params) => {
      const searchInput = document.querySelector<HTMLInputElement>(
        '[data-search], input[type="search"], input[placeholder*="buscar"]'
      );
      if (searchInput) {
        searchInput.focus();
        if (params?.query) {
          searchInput.value = String(params.query);
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    },
  });

  // Toggle dark mode
  registerAction({
    id: "toggle-dark-mode",
    description: "Toggle between light and dark mode",
    execute: () => {
      const html = document.documentElement;
      const isDark = html.classList.contains("dark");

      if (isDark) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        html.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }

      // Dispatch event for theme context to pick up
      window.dispatchEvent(
        new CustomEvent("theme-change", {
          detail: { theme: isDark ? "light" : "dark" },
        })
      );
    },
  });

  // Scroll to top
  registerAction({
    id: "scroll-to-top",
    description: "Scroll to the top of the page",
    execute: () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  // Refresh data
  registerAction({
    id: "refresh-data",
    description: "Trigger a data refresh",
    execute: () => {
      window.dispatchEvent(new CustomEvent("refresh-data"));
    },
  });

  // Open quick sale (dispatches event for POS to handle)
  registerAction({
    id: "open-quick-sale",
    description: "Open quick sale mode",
    execute: () => {
      window.dispatchEvent(new CustomEvent("open-quick-sale"));
    },
  });

  console.log("[interface-agent] Default actions registered");
}

// ============================================================================
// Action Type Guards
// ============================================================================

export function isNavigationAction(
  action: InterfaceAction
): action is NavigationAction {
  return action.type === "navigation";
}

export function isFormPrefillAction(
  action: InterfaceAction
): action is FormPrefillAction {
  return action.type === "formPrefill";
}

export function isCustomAction(
  action: InterfaceAction
): action is CustomAction {
  return action.type === "custom";
}

export function isConfirmAction(
  action: InterfaceAction
): action is ConfirmAction {
  return action.type === "confirm";
}
