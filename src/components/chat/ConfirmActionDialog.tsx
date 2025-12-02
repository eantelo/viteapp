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
import { AlertTriangle } from "lucide-react";
import type { PendingConfirmation } from "@/hooks/useInterfaceAgent";

interface ConfirmActionDialogProps {
  /** The pending confirmation to display */
  confirmation: PendingConfirmation | null;
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** Callback when user cancels the action */
  onCancel: () => void;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

/**
 * Dialog component for confirming destructive actions requested by the AI agent.
 * Shows a modal with action details and Confirm/Cancel buttons.
 */
export function ConfirmActionDialog({
  confirmation,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmActionDialogProps) {
  if (!confirmation) {
    return null;
  }

  const { action } = confirmation;

  // Get action type display name
  const getActionTypeName = (actionType: string): string => {
    const names: Record<string, string> = {
      "delete-product": "eliminar el producto",
      "delete-customer": "eliminar el cliente",
      "delete-sale": "eliminar la venta",
      "delete-category": "eliminar la categoría",
      "bulk-delete": "eliminar los elementos seleccionados",
    };
    return names[actionType] || "realizar esta acción";
  };

  return (
    <AlertDialog
      open={!!confirmation}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">
              Confirmar acción
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-base">
            ¿Estás seguro de que deseas {getActionTypeName(action.actionType)}{" "}
            <span className="font-semibold text-foreground">
              "{action.targetName}"
            </span>
            ?
          </AlertDialogDescription>
          {action.warningMessage && (
            <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mr-2 inline-block h-4 w-4" />
              {action.warningMessage}
            </div>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Esta acción no se puede deshacer.
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            No, cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Eliminando..." : "Sí, confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
