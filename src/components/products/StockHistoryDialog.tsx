import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStockHistory, type StockHistoryDto, StockTransactionType } from "@/api/stockApi";

interface StockHistoryDialogProps {
  open: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
}

export function StockHistoryDialog({
  open,
  productId,
  productName,
  onClose,
}: StockHistoryDialogProps) {
  const [history, setHistory] = useState<StockHistoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && productId) {
      loadHistory();
    }
  }, [open, productId]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStockHistory(productId);
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
      setError("No se pudo cargar el historial de movimientos.");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeName = (type: StockTransactionType) => {
    switch (type) {
      case StockTransactionType.InitialStock: return "Stock Inicial";
      case StockTransactionType.Purchase: return "Compra";
      case StockTransactionType.Sale: return "Venta";
      case StockTransactionType.Adjustment: return "Ajuste";
      case StockTransactionType.Return: return "Devolución";
      default: return "Desconocido";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos: {productName}</DialogTitle>
        </DialogHeader>
        
        {loading && <div className="py-8 text-center">Cargando historial...</div>}
        
        {error && (
          <div className="text-sm text-error bg-error/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {!loading && history && (
          <div className="mt-4">
            <div className="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded-md border">
              <span className="text-sm font-medium text-slate-600">Stock Actual:</span>
              <span className="text-lg font-bold">{history.currentStock}</span>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-slate-500">
                        No hay movimientos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>{getTransactionTypeName(tx.transactionType)}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{tx.reference || "-"}</TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[200px] truncate" title={tx.notes}>
                          {tx.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
