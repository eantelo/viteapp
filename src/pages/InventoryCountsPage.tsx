import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardText, Plus, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createInventoryCount, getInventoryCounts, type InventoryCountStatus, type InventoryCountSummaryDto } from "@/api/inventoryCountsApi";
import { getWarehouses, type WarehouseDto } from "@/api/warehousesApi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

const statusLabels: Record<InventoryCountStatus, string> = { Draft: "En curso", Completed: "Pendiente de conciliación", Cancelled: "Cancelada", Reconciled: "Conciliada" };
const statusVariants: Record<InventoryCountStatus, "default" | "secondary" | "outline"> = { Draft: "default", Completed: "secondary", Cancelled: "outline", Reconciled: "default" };

export function InventoryCountsPage() {
  useDocumentTitle("Tomas de inventario");
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("Products.Manage");
  const [counts, setCounts] = useState<InventoryCountSummaryDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [status, setStatus] = useState<InventoryCountStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(undefined);
    try {
      const [countData, warehouseData] = await Promise.all([
        getInventoryCounts(status === "all" ? undefined : { status }),
        getWarehouses(),
      ]);
      setCounts(countData);
      setWarehouses(warehouseData.filter((warehouse) => warehouse.isActive));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las tomas de inventario.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const openDraftWarehouses = useMemo(
    () => new Set(counts.filter((count) => count.status === "Draft").map((count) => count.warehouseId)),
    [counts],
  );

  async function handleCreate() {
    if (!warehouseId || creating) return;
    setCreating(true);
    try {
      const count = await createInventoryCount(warehouseId, notes);
      toast.success(openDraftWarehouses.has(warehouseId) ? "Toma reanudada" : "Toma iniciada");
      setDialogOpen(false);
      navigate(`/inventory-counts/${count.id}`);
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : "No se pudo iniciar la toma.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageTransition>
      <DashboardLayout breadcrumbs={[{ label: "Panel principal", href: "/dashboard" }, { label: "Tomas de inventario" }]} className={PAGE_LAYOUT_CLASS}>
        <div className="w-full max-w-[1320px] space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Tomas de inventario</h1>
              <p className="text-sm text-muted-foreground">Registra cantidades físicas y genera conciliaciones por almacén.</p>
            </div>
            {canManage && <Button onClick={() => setDialogOpen(true)}><Plus /> Nueva toma</Button>}
          </header>

          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><CardTitle>Historial</CardTitle><CardDescription>Las tomas en curso se pueden continuar desde cualquier dispositivo.</CardDescription></div>
              <Select value={status} onValueChange={(value: string) => setStatus(value as InventoryCountStatus | "all")}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="Draft">En curso</SelectItem><SelectItem value="Completed">Pendientes de conciliación</SelectItem><SelectItem value="Reconciled">Conciliadas</SelectItem><SelectItem value="Cancelled">Canceladas</SelectItem></SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {loading ? <div className="py-12 text-center text-sm text-muted-foreground"><SpinnerGap className="mx-auto mb-2 animate-spin" size={24} />Cargando tomas...</div>
                : error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>Reintentar</Button></div>
                : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Almacén</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead>Progreso</TableHead><TableHead>Diferencias</TableHead></TableRow></TableHeader><TableBody>
                  {counts.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground"><ClipboardText className="mx-auto mb-2" size={28} />No hay tomas para este filtro.</TableCell></TableRow> : counts.map((count) => <TableRow key={count.id} className="cursor-pointer" onClick={() => navigate(`/inventory-counts/${count.id}`)}><TableCell><Link className="font-medium text-primary hover:underline" to={`/inventory-counts/${count.id}`}>{count.countNumber}</Link></TableCell><TableCell>{count.warehouseName}</TableCell><TableCell><Badge variant={statusVariants[count.status]}>{statusLabels[count.status]}</Badge></TableCell><TableCell>{new Date(count.reconciledAt ?? count.completedAt ?? count.cancelledAt ?? count.snapshotAt).toLocaleString("es-BO")}</TableCell><TableCell>{count.countedProducts}/{count.totalProducts}</TableCell><TableCell>{count.status === "Completed" || count.status === "Reconciled" ? count.discrepancyProducts : "—"}</TableCell></TableRow>)}
                </TableBody></Table></div>}
            </CardContent>
          </Card>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Nueva toma física</DialogTitle><DialogDescription>Selecciona un almacén. Si ya tiene una toma abierta, se reanudará.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="count-warehouse">Almacén</Label><Select value={warehouseId} onValueChange={setWarehouseId}><SelectTrigger id="count-warehouse" className="w-full"><SelectValue placeholder="Selecciona un almacén" /></SelectTrigger><SelectContent>{warehouses.map((warehouse) => <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}{openDraftWarehouses.has(warehouse.id) ? " · toma en curso" : ""}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="count-notes">Notas (opcional)</Label><Textarea id="count-notes" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej. Conteo mensual de cierre" /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancelar</Button><Button onClick={() => void handleCreate()} disabled={!warehouseId || creating}>{creating && <SpinnerGap className="animate-spin" />}Iniciar toma</Button></DialogFooter></DialogContent></Dialog>
      </DashboardLayout>
    </PageTransition>
  );
}
