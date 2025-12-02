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
  console.log("[product-events] Emitiendo evento:", detail);
  const event = new CustomEvent(PRODUCT_UPDATED_EVENT, {
    detail,
    bubbles: true,
  });
  window.dispatchEvent(event);
  console.log("[product-events] Evento emitido exitosamente");
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
    console.log("[product-events] Evento recibido:", event.detail);
    callback(event.detail);
  };

  window.addEventListener(PRODUCT_UPDATED_EVENT, handler);
  console.log("[product-events] Suscripción registrada");

  return () => {
    window.removeEventListener(PRODUCT_UPDATED_EVENT, handler);
    console.log("[product-events] Suscripción cancelada");
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

  // Detectar ajuste de stock confirmado
  // Patrón exacto del backend: "{Entrada|Salida} registrada para {nombre}. Stock actualizado: {cantidad} unidades."
  const stockConfirmedPattern =
    /(entrada|salida) registrada para (.+?)\. stock actualizado: (\d+) unidades/i;
  const stockConfirmedMatch = message.match(stockConfirmedPattern);
  if (stockConfirmedMatch) {
    console.log(
      "[product-events] Detectado ajuste de stock:",
      stockConfirmedMatch
    );
    return {
      updateType: "stock",
      productName: stockConfirmedMatch[2]?.trim(),
      message: message,
    };
  }

  // Detectar otros patrones de stock (por si acaso)
  const otherStockPatterns = [
    /stock (?:actualizado|ajustado)/i,
    /stock actual(?:izado)?:\s*\d+/i,
  ];

  for (const pattern of otherStockPatterns) {
    if (pattern.test(message)) {
      console.log(
        "[product-events] Detectado patrón de stock alternativo:",
        pattern
      );
      return {
        updateType: "stock",
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
    console.log("[product-events] Detectada creación de producto");
    return {
      productId: idMatch?.[1],
      updateType: "created",
      productName: nameMatch?.[1]?.trim(),
      message: message,
    };
  }

  // Detectar desactivación de producto
  // Patrón: "Estado: Activo → Inactivo" en los cambios
  if (
    normalizedMessage.includes("estado: activo → inactivo") ||
    normalizedMessage.includes("ha sido desactivado") ||
    normalizedMessage.includes("producto desactivado")
  ) {
    const idMatch = message.match(/\/products\/([a-f0-9-]+)/i);
    const nameMatch = message.match(/\*\*Producto:\*\*\s*(.+)/i);
    console.log("[product-events] Detectada desactivación de producto");
    return {
      productId: idMatch?.[1],
      updateType: "updated",
      productName: nameMatch?.[1]?.trim(),
      message: message,
    };
  }

  // Detectar activación de producto
  // Patrón: "Estado: Inactivo → Activo" en los cambios
  if (
    normalizedMessage.includes("estado: inactivo → activo") ||
    normalizedMessage.includes("ha sido activado") ||
    normalizedMessage.includes("producto activado")
  ) {
    const idMatch = message.match(/\/products\/([a-f0-9-]+)/i);
    const nameMatch = message.match(/\*\*Producto:\*\*\s*(.+)/i);
    console.log("[product-events] Detectada activación de producto");
    return {
      productId: idMatch?.[1],
      updateType: "updated",
      productName: nameMatch?.[1]?.trim(),
      message: message,
    };
  }

  // Detectar actualización general de producto
  // Patrón: "✅ **Producto actualizado exitosamente**" o "producto actualizado" o "producto modificado"
  if (
    normalizedMessage.includes("producto actualizado exitosamente") ||
    normalizedMessage.includes("producto actualizado") ||
    normalizedMessage.includes("producto modificado")
  ) {
    const idMatch = message.match(/\/products\/([a-f0-9-]+)/i);
    const nameMatch = message.match(/\*\*Producto:\*\*\s*(.+)/i);
    console.log("[product-events] Detectada actualización de producto");
    return {
      productId: idMatch?.[1],
      updateType: "updated",
      productName: nameMatch?.[1]?.trim(),
      message: message,
    };
  }

  // Detectar eliminación de producto
  if (
    normalizedMessage.includes("producto eliminado") ||
    normalizedMessage.includes("producto borrado")
  ) {
    console.log("[product-events] Detectada eliminación de producto");
    return {
      updateType: "deleted",
      message: message,
    };
  }

  return null;
}
