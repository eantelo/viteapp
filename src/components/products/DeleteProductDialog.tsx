import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProductDto } from "@/api/productsApi";

interface DeleteProductDialogProps {
  open: boolean;
  product: ProductDto | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteProductDialog({
  open,
  product,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteProductDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            producto{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {product?.name}
            </span>{" "}
            (SKU: {product?.sku}) del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
