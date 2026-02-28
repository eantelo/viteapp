import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getWarehouseById,
  getWarehouseStock,
  type WarehouseDto,
  type WarehouseStockSummaryDto,
} from "@/api/warehousesApi";
import {
  ArrowLeft,
  Warehouse,
  Package,
  StackSimple,
  MapPin,
  SpinnerGap,
} from "@phosphor-icons/react";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

export function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<WarehouseDto | null>(null);
  const [summary, setSummary] = useState<WarehouseStockSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(
    warehouse ? `Almacén: ${warehouse.name}` : "Detalle de almacén"
  );

  useEffect(() => {
    if (!id) return;
    void loadData(id);
  }, [id]);

  const loadData = async (warehouseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [warehouseResponse, stockSummaryResponse] = await Promise.all([
        getWarehouseById(warehouseId),
        getWarehouseStock(warehouseId),
      ]);

      setWarehouse(warehouseResponse);
      setSummary(stockSummaryResponse);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el detalle del almacén.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = useMemo(() => {
    if (!summary) return 0;
    return summary.products.filter((product) => product.stock <= 10).length;
  }, [summary]);

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "Almacenes", href: "/warehouses" },
          { label: warehouse?.name ?? "Detalle" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="w-full max-w-[1320px] space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/warehouses")}>
                <ArrowLeft size={18} weight="bold" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {warehouse?.name ?? "Detalle de almacén"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Inventario y datos generales del almacén.
                </p>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
              <SpinnerGap size={24} className="mx-auto mb-2 animate-spin text-primary" />
              Cargando información del almacén...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">
              {error}
            </div>
          ) : warehouse && summary ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Productos distintos</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-3xl">
                      <StackSimple size={24} className="text-primary" />
                      {summary.distinctProducts}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Unidades totales</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-3xl">
                      <Package size={24} className="text-primary" />
                      {summary.totalUnits}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Stock bajo (≤ 10)</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-3xl">
                      <Warehouse size={24} className="text-primary" />
                      {lowStockProducts}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Información general</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Código</p>
                    <p className="font-medium">{warehouse.code ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ciudad</p>
                    <p className="font-medium">{warehouse.city ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{warehouse.phone ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contacto</p>
                    <p className="font-medium">{warehouse.contactPerson ?? "-"}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <p className="text-muted-foreground">Dirección</p>
                    <p className="flex items-start gap-1 font-medium">
                      <MapPin size={16} weight="bold" className="mt-0.5 text-muted-foreground" />
                      <span>{warehouse.address ?? "-"}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock por producto</CardTitle>
                  <CardDescription>
                    {summary.products.length} productos en este almacén.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                              Este almacén todavía no tiene stock registrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          summary.products.map((product) => (
                            <TableRow key={product.productId}>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>{product.sku}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {product.stock}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
