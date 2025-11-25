/**
 * Sistema de eventos para notificar actualizaciones de productos en tiempo real.
 * Permite que diferentes partes de la aplicación se comuniquen cuando un producto
 * es actualizado (por ejemplo, desde el chat del asistente).
 */

// Nombre del evento personalizado
export const PRODUCT_UPDATED_EVENT = "product:updated";

// Tipo de datos que contiene el evento
export interface ProductUpdatedEventDetail {
  /**
   * ID del producto actualizado. Si es undefined, indica que se actualizó
   * un producto pero no se conoce el ID específico (refrescar todos).
   */
  productId?: string;
  /**
   * Tipo de actualización realizada
   */
  updateType: "stock" | "created" | "updated" | "deleted";
  /**
   * Nombre del producto (opcional, para mostrar notificaciones)
   */
  productName?: string;
  /**
   * Mensaje adicional de contexto
   */
  message?: string;
}

// Extender el tipo WindowEventMap para TypeScript
declare global {
  interface WindowEventMap {
    [PRODUCT_UPDATED_EVENT]: CustomEvent<ProductUpdatedEventDetail>;
  }
}

/**
 * Emite un evento de actualización de producto.
 * Llama a esta función cuando se actualice un producto desde cualquier parte de la app.
 */
export function emitProductUpdated(detail: ProductUpdatedEventDetail): void {
  const event = new CustomEvent(PRODUCT_UPDATED_EVENT, {
    detail,
    bubbles: true,
  });
  window.dispatchEvent(event);
}

/**
 * Suscribirse a eventos de actualización de productos.
 * @param callback Función a ejecutar cuando se actualice un producto
 * @returns Función para cancelar la suscripción
 */
export function onProductUpdated(
  callback: (detail: ProductUpdatedEventDetail) => void
): () => void {
  const handler = (event: CustomEvent<ProductUpdatedEventDetail>) => {
    callback(event.detail);
  };

  window.addEventListener(PRODUCT_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener(PRODUCT_UPDATED_EVENT, handler);
  };
}

/**
 * Detecta si un mensaje del chat indica que se actualizó un producto.
 * Busca patrones específicos en la respuesta del asistente.
 */
export function detectProductUpdateFromChatMessage(
  message: string
): ProductUpdatedEventDetail | null {
  // Normalizar el mensaje para la detección
  const normalizedMessage = message.toLowerCase();

  // Detectar ajuste de stock
  // Patrones: "Entrada registrada para X", "Salida registrada para X", "Stock actualizado"
  const stockPatterns = [
    /(?:entrada|salida) registrada para (.+?)\./i,
    /stock (?:actualizado|ajustado)/i,
    /stock actual(?:izado)?:\s*\d+/i,
  ];

  for (const pattern of stockPatterns) {
    if (pattern.test(message)) {
      // Intentar extraer el nombre del producto
      const nameMatch = message.match(
        /(?:entrada|salida) registrada para (.+?)\./i
      );
      return {
        updateType: "stock",
        productName: nameMatch?.[1]?.trim(),
        message: message,
      };
    }
  }

  // Detectar creación de producto
  // Patrón: "Producto creado exitosamente", enlaces a /products/{id}
  if (
    normalizedMessage.includes("producto creado exitosamente") ||
    normalizedMessage.includes("✅ **producto creado exitosamente**")
  ) {
    // Intentar extraer el ID del producto del enlace
    const idMatch = message.match(/\/products\/([a-f0-9-]+)/i);
    const nameMatch = message.match(/\*\*Nombre:\*\*\s*(.+)/i);
    return {
      productId: idMatch?.[1],
      updateType: "created",
      productName: nameMatch?.[1]?.trim(),
      message: message,
    };
  }

  // Detectar actualización general de producto
  if (
    normalizedMessage.includes("producto actualizado") ||
    normalizedMessage.includes("producto modificado")
  ) {
    const idMatch = message.match(/\/products\/([a-f0-9-]+)/i);
    return {
      productId: idMatch?.[1],
      updateType: "updated",
      message: message,
    };
  }

  // Detectar eliminación de producto
  if (
    normalizedMessage.includes("producto eliminado") ||
    normalizedMessage.includes("producto borrado")
  ) {
    return {
      updateType: "deleted",
      message: message,
    };
  }

  return null;
}
