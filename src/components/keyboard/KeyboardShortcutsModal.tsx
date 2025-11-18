import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { KeyboardShortcutKey } from "@/hooks/useKeyboardShortcuts";
import { IconKeyboard } from "@tabler/icons-react";

interface ShortcutInfo {
  key: KeyboardShortcutKey;
  label: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: ShortcutInfo[];
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
  shortcuts: _shortcuts,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <IconKeyboard className="size-5" />
            <DialogTitle>Atajos de teclado</DialogTitle>
          </div>
          <DialogDescription>
            Utiliza estos atajos para trabajar más rápido en el Punto de Venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Búsqueda y Cliente */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Búsqueda
              </span>
            </h3>
            <div className="space-y-2">
              {[
                { label: "F2", description: "Enfocar búsqueda de productos" },
                { label: "F3", description: "Buscar o crear cliente" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/30"
                >
                  <Badge variant="secondary" className="font-mono">
                    {item.label}
                  </Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Gestión de orden */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                Orden
              </span>
            </h3>
            <div className="space-y-2">
              {[
                { label: "F4", description: "Aplicar descuento" },
                { label: "ESC", description: "Limpiar/Cancelar orden actual" },
                { label: "Ctrl+N", description: "Nueva venta" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/30"
                >
                  <Badge variant="secondary" className="font-mono">
                    {item.label}
                  </Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pagos y Caja */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                Pagos
              </span>
            </h3>
            <div className="space-y-2">
              {[
                { label: "F8", description: "Poner orden en espera" },
                { label: "F9", description: "Proceder a cobrar" },
                { label: "F12", description: "Abrir cajón (si disponible)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/30"
                >
                  <Badge variant="secondary" className="font-mono">
                    {item.label}
                  </Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Historial */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                Historial
              </span>
            </h3>
            <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/30">
              <Badge variant="secondary" className="font-mono">
                Ctrl+H
              </Badge>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Ver historial de ventas
              </span>
            </div>
          </div>

          <Separator />

          {/* Ayuda */}
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>💡 Consejo:</strong> Presiona{" "}
              <Badge className="mx-1 font-mono">F1</Badge> en cualquier momento
              para volver a ver estos atajos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
