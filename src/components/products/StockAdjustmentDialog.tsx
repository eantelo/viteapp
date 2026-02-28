import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustStock } from "@/api/stockApi";

interface StockAdjustmentDialogProps {
  open: boolean;
  productId: string;
  productName: string;
  currentStock: number;
  warehouses?: { id: string; name: string }[];
  selectedWarehouseId?: string;
  onClose: (adjusted: boolean) => void;
}

export function StockAdjustmentDialog({
  open,
  productId,
  productName,
  currentStock,
  warehouses,
  selectedWarehouseId,
  onClose,
}: StockAdjustmentDialogProps) {
  const [type, setType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>(selectedWarehouseId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShowWarehouseSelector = Boolean(warehouses && warehouses.length > 0);

  useEffect(() => {
    if (!open || !shouldShowWarehouseSelector) {
      return;
    }

    if (selectedWarehouseId) {
      setWarehouseId(selectedWarehouseId);
      return;
    }

    if (!warehouseId && warehouses && warehouses.length > 0) {
      setWarehouseId(warehouses[0].id);
    }
  }, [open, selectedWarehouseId, shouldShowWarehouseSelector, warehouseId, warehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (shouldShowWarehouseSelector && !warehouseId) {
      setError("Selecciona un almacén para el ajuste");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const adjustmentQuantity = type === "add" ? qty : -qty;
      await adjustStock({
        productId,
        quantity: adjustmentQuantity,
        warehouseId: warehouseId || undefined,
        notes: notes.trim() || undefined,
      });
      onClose(true);
    } catch (err) {
      console.error("Error adjusting stock:", err);
      setError("Error al ajustar el stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Ajuste manual de inventario para: <strong>{productName}</strong>
              <br />
              Stock actual: {currentStock}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Ajuste</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as "add" | "remove")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Agregar (+)</SelectItem>
                    <SelectItem value="remove">Quitar (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            {shouldShowWarehouseSelector ? (
              <div className="grid gap-2">
                <Label>Almacén</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas / Motivo</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Inventario físico, daño, regalo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
