import { useState } from "react";
import {
  IconClock,
  IconTrash,
  IconPlayerPlay,
  IconX,
  IconSearch,
  IconPackage,
} from "@tabler/icons-react";
import type { HeldOrderDto } from "@/api/heldOrdersApi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/Spinner";

interface HeldOrdersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: HeldOrderDto[];
  loading: boolean;
  onResume: (order: HeldOrderDto) => void;
  onDelete: (orderId: string) => void;
  formatCurrency: (value: number) => string;
}

export function HeldOrdersPanel({
  open,
  onOpenChange,
  orders,
  loading,
  onResume,
  onDelete,
  formatCurrency,
}: HeldOrdersPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term) ||
      order.items.some(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term)
      )
    );
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return "Hoy";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    }

    return date.toLocaleDateString("es-MX", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Órdenes en espera</SheetTitle>
                <SheetDescription>
                  {orders.length} orden{orders.length === 1 ? "" : "es"}{" "}
                  guardada{orders.length === 1 ? "" : "s"}
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <IconX className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Búsqueda */}
          <div className="border-b px-6 py-3">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, ID o producto..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de órdenes */}
          <ScrollArea className="flex-1 px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconPackage className="size-12 text-muted-foreground mb-3" />
                <p className="font-semibold">
                  {searchTerm
                    ? "No se encontraron órdenes"
                    : "No hay órdenes en espera"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : "Las órdenes pausadas aparecerán aquí"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
                  >
                    {/* Header de la orden */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <IconClock className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatDate(order.createdAt)} •{" "}
                            {formatTime(order.createdAt)}
                          </span>
                        </div>
                        <p className="font-semibold text-sm truncate">
                          {order.customerName || "Cliente genérico"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    {/* Productos */}
                    <div className="mb-3 space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate flex-1">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium shrink-0 ml-2">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 3} producto
                          {order.items.length - 3 === 1 ? "" : "s"} más
                        </p>
                      )}
                    </div>

                    <Separator className="my-3" />

                    {/* Total y acciones */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(order.id)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            onResume(order);
                            onOpenChange(false);
                          }}
                        >
                          <IconPlayerPlay className="size-4 mr-1" />
                          Recuperar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
