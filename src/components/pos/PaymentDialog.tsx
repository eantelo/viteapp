import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type PaymentMethod = "Cash" | "Card" | "Voucher" | "Transfer" | "Other";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: "Cash", label: "Efectivo", icon: "💵" },
    { value: "Card", label: "Tarjeta", icon: "💳" },
    { value: "Transfer", label: "Transferencia", icon: "📲" },
    { value: "Voucher", label: "Vale/Cupón", icon: "🎫" },
    { value: "Other", label: "Otro", icon: "❓" },
  ];

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    method: PaymentMethod,
    amountReceived?: number,
    reference?: string
  ) => void;
  total: number;
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amountReceived: number | null;
  onAmountReceivedChange: (amount: number | null) => void;
  reference: string;
  onReferenceChange: (ref: string) => void;
  isLoading?: boolean;
}

export function PaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  total,
  selectedMethod,
  onMethodChange,
  amountReceived,
  onAmountReceivedChange,
  reference,
  onReferenceChange,
  isLoading = false,
}: PaymentDialogProps) {
  const [localAmount, setLocalAmount] = useState<string>(total.toFixed(2));

  useEffect(() => {
    if (isOpen) {
      // Initialize with amountReceived if available, otherwise use total
      const initial = amountReceived !== null ? amountReceived : total;
      setLocalAmount(initial.toFixed(2));
    }
  }, [isOpen, total, amountReceived]);

  const amount = parseFloat(localAmount) || 0;
  const change = selectedMethod === "Cash" ? Math.max(0, amount - total) : 0;
  const isValidAmount =
    selectedMethod === "Cash" ? amount >= total : amount >= 0;

  const handleConfirm = () => {
    if (!isValidAmount) {
      return;
    }

    const amountToSend = selectedMethod === "Cash" ? amount : total;
    onConfirm(selectedMethod, amountToSend, reference || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Método de Pago</DialogTitle>
          <DialogDescription>
            Selecciona cómo deseas pagar: ${total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method Selector */}
          <div>
            <Label className="text-sm font-semibold">Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  onClick={() => onMethodChange(method.value)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    selectedMethod === method.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{method.icon}</span>
                  <span className="text-xs font-medium text-center">
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount and Change for Cash */}
          {selectedMethod === "Cash" && (
            <Card className="bg-blue-50 border-blue-200 p-4 space-y-3">
              <div>
                <Label htmlFor="amount-received" className="text-sm">
                  Monto Recibido
                </Label>
                <Input
                  id="amount-received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={localAmount}
                  onChange={(e) => {
                    setLocalAmount(e.target.value);
                    onAmountReceivedChange(parseFloat(e.target.value) || null);
                  }}
                  className="mt-2 text-lg font-semibold"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between text-sm p-2 rounded ${
                    change > 0 ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <span>Cambio:</span>
                  <span
                    className={`font-semibold ${
                      change > 0 ? "text-green-700" : ""
                    }`}
                  >
                    ${change.toFixed(2)}
                  </span>
                </div>
              </div>

              {!isValidAmount && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  El monto recibido debe ser mayor o igual a ${total.toFixed(2)}
                </div>
              )}
            </Card>
          )}

          {/* Reference field for non-cash payments */}
          {selectedMethod !== "Cash" && (
            <div>
              <Label htmlFor="reference" className="text-sm">
                Referencia (opcional)
              </Label>
              <Input
                id="reference"
                type="text"
                placeholder="Número de transacción, vale, etc."
                value={reference}
                onChange={(e) => onReferenceChange(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Summary Badge */}
          <div className="flex gap-2 items-center justify-center pt-2">
            <Badge variant="outline">
              {PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.label}
            </Badge>
            <Badge>Total: ${total.toFixed(2)}</Badge>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValidAmount || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Procesando..." : "Confirmar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
