import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ProductDto } from "@/api/productsApi";

interface DeleteProductDialogProps {
  open: boolean;
  product: ProductDto | null;
  onConfirm: () => void;
  onDeactivate: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function DeleteProductDialog({
  open,
  product,
  onConfirm,
  onDeactivate,
  onCancel,
  loading = false,
  error = null,
}: DeleteProductDialogProps) {
  const [showAlternative, setShowAlternative] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowAlternative(false);
      onCancel();
    }
  };

  // Detectar si el error indica que hay ventas asociadas
  const hasSalesError = error?.toLowerCase().includes("ventas asociadas");
  const hasStockError = error
    ?.toLowerCase()
    .includes("movimientos de stock");
  const shouldShowAlternative = hasSalesError || hasStockError || showAlternative;
  const blockReason = hasSalesError
    ? "ventas asociadas"
    : hasStockError
    ? "movimientos de stock asociados"
    : null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {shouldShowAlternative
              ? "¿Desactivar producto?"
              : "¿Eliminar producto?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {shouldShowAlternative ? (
              <>
                Este producto tiene {blockReason ?? "datos asociados"} y no
                puede ser eliminado permanentemente.
                <br />
                <br />
                Sin embargo, puedes <strong>desactivarlo</strong> para que no
                aparezca en los catálogos y no se pueda usar en nuevas ventas,
                manteniendo el historial de ventas intacto.
                <br />
                <br />
                Producto:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {product?.name}
                </span>{" "}
                (SKU: {product?.sku})
              </>
            ) : (
              <>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el producto{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {product?.name}
                </span>{" "}
                (SKU: {product?.sku}) del sistema.
                {error && (
                  <div className="mt-2 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          {shouldShowAlternative ? (
            <Button
              onClick={(e) => {
                e.preventDefault();
                onDeactivate();
              }}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              {loading ? "Desactivando..." : "Desactivar"}
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
