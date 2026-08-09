import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, FloppyDisk, MagnifyingGlass, SpinnerGap, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cancelInventoryCount, completeInventoryCount, getInventoryCount, setInventoryCountLine, type InventoryCountDto, type InventoryCountLineDto, type InventoryCountLineResult } from "@/api/inventoryCountsApi";
import type { ApiError } from "@/api/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";

const resultLabels: Record<InventoryCountLineResult, string> = { Pending: "Pendiente", Counted: "Contado", Match: "Coincide", Shortage: "Faltante", Surplus: "Sobrante" };

export function InventoryCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("Products.Manage");
  const [count, setCount] = useState<InventoryCountDto>();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [savingProductId, setSavingProductId] = useState<string>();
  const [transition, setTransition] = useState<"complete" | "cancel">();
  const [transitioning, setTransitioning] = useState(false);
  useDocumentTitle(count ? `Toma ${count.countNumber}` : "Toma de inventario");

  const applyCount = useCallback((data: InventoryCountDto) => {
    setCount(data);
    setQuantities(Object.fromEntries(data.lines.map((line) => [line.productId, line.countedQuantity?.toString() ?? ""])));
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    await Promise.resolve();
    setLoading(true); setError(undefined);
    try { applyCount(await getInventoryCount(id)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la toma."); }
    finally { setLoading(false); }
  }, [applyCount, id]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const filteredLines = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    const lines = count?.lines ?? [];
    return lines.filter((line) => !term || [line.productName, line.sku, line.barcode].some((value) => value?.toLocaleLowerCase("es").includes(term)))
      .sort((a, b) => Number(a.countedQuantity != null) - Number(b.countedQuantity != null) || a.productName.localeCompare(b.productName, "es"));
  }, [count, search]);
  const progress = count?.totalProducts ? (count.countedProducts / count.totalProducts) * 100 : 0;

  async function recoverConflict(message: string) {
    toast.warning(message, { description: "Se recargaron los valores vigentes. Revisa y confirma nuevamente." });
    await load();
  }

  async function saveLine(line: InventoryCountLineDto) {
    if (!count || savingProductId) return;
    const value = quantities[line.productId]?.trim();
    const quantity = Number(value);
    if (value === "" || !Number.isInteger(quantity) || quantity < 0) { toast.error("Ingresa una cantidad entera igual o mayor que cero."); return; }
    setSavingProductId(line.productId);
    try { applyCount(await setInventoryCountLine(count.id, line.productId, quantity, count.version)); toast.success(`${line.productName}: cantidad guardada`); }
    catch (saveError) { if ((saveError as ApiError).status === 409) await recoverConflict("La toma cambió en otro dispositivo."); else toast.error(saveError instanceof Error ? saveError.message : "No se pudo guardar la cantidad."); }
    finally { setSavingProductId(undefined); }
  }

  async function performTransition() {
    if (!count || !transition) return;
    setTransitioning(true);
    try {
      const updated = transition === "complete" ? await completeInventoryCount(count.id, count.version) : await cancelInventoryCount(count.id, count.version);
      applyCount(updated);
      toast.success(transition === "complete" ? "Toma completada y conciliada" : "Toma cancelada");
      setTransition(undefined);
    } catch (actionError) {
      setTransition(undefined);
      if ((actionError as ApiError).status === 409) await recoverConflict("No se pudo confirmar porque la toma cambió.");
      else toast.error(actionError instanceof Error ? actionError.message : "No se pudo completar la operación.");
    } finally { setTransitioning(false); }
  }

  return <PageTransition><DashboardLayout breadcrumbs={[{ label: "Panel principal", href: "/dashboard" }, { label: "Tomas de inventario", href: "/inventory-counts" }, { label: count?.countNumber ?? "Detalle" }]} className={PAGE_LAYOUT_CLASS}>
    <div className="w-full max-w-[1320px] space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-2"><Button variant="ghost" size="icon" onClick={() => navigate("/inventory-counts")}><ArrowLeft /></Button><div><h1 className="text-2xl font-semibold">{count?.countNumber ?? "Toma de inventario"}</h1><p className="text-sm text-muted-foreground">{count ? `${count.warehouseName} · iniciada ${new Date(count.snapshotAt).toLocaleString("es-BO")}` : "Captura física por almacén"}</p></div></div>{count?.status === "Draft" && canManage && <div className="flex gap-2"><Button variant="outline" onClick={() => setTransition("cancel")}>Cancelar toma</Button><Button onClick={() => setTransition("complete")} disabled={count.pendingProducts > 0}><CheckCircle /> Completar</Button></div>}</header>
      {loading ? <div className="py-16 text-center text-sm text-muted-foreground"><SpinnerGap className="mx-auto mb-2 animate-spin" size={26} />Cargando toma...</div> : error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}<Button variant="outline" size="sm" className="ml-3" onClick={() => void load()}>Reintentar</Button></div> : count && <>
        <div className="grid gap-4 md:grid-cols-4"><Card><CardHeader className="pb-2"><CardDescription>Estado</CardDescription><CardTitle className="text-xl">{count.status === "Draft" ? "En curso" : count.status === "Completed" ? "Completada" : "Cancelada"}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Progreso</CardDescription><CardTitle className="text-xl">{count.countedProducts} / {count.totalProducts}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Pendientes</CardDescription><CardTitle className="text-xl">{count.pendingProducts}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Diferencia neta</CardDescription><CardTitle className="text-xl">{count.differenceUnits == null ? "—" : count.differenceUnits > 0 ? `+${count.differenceUnits}` : count.differenceUnits}</CardTitle></CardHeader></Card></div>
        {count.status === "Draft" && <Card><CardContent className="space-y-2 pt-5"><div className="flex justify-between text-sm"><span>Avance del conteo</span><span className="font-medium">{Math.round(progress)}%</span></div><Progress value={progress} />{count.pendingProducts > 0 && <p className="flex items-center gap-1 text-sm text-muted-foreground"><Warning /> Debes registrar todos los productos, incluso aquellos con cantidad cero, antes de completar.</p>}</CardContent></Card>}
        {count.status === "Completed" && <Card><CardHeader><CardTitle>Resumen de conciliación</CardTitle><CardDescription>El reporte no modifica el stock; cualquier regularización debe hacerse mediante un ajuste auditado.</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4"><Metric label="Sistema al cierre" value={count.systemUnits} /><Metric label="Conteo físico" value={count.physicalCountedUnits} /><Metric label="Faltantes" value={count.missingUnits} /><Metric label="Sobrantes" value={count.surplusUnits} /><Metric label="Coincidencias" value={count.matchingProducts} /><Metric label="Productos faltantes" value={count.shortageProducts} /><Metric label="Productos sobrantes" value={count.surplusProducts} /><Metric label="Con movimientos" value={count.productsWithNetChanges} /></CardContent></Card>}
        <Card><CardHeader className="gap-3 md:flex-row md:items-center md:justify-between"><div><CardTitle>{count.status === "Draft" ? "Captura de productos" : "Detalle del reporte"}</CardTitle><CardDescription>{count.notes || "Sin notas"}</CardDescription></div><div className="relative w-full md:w-80"><MagnifyingGlass className="absolute left-3 top-2.5 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nombre, SKU o código" /></div></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>SKU / código</TableHead>{count.status === "Completed" && <><TableHead className="text-right">Sistema</TableHead><TableHead className="text-right">Físico ajustado</TableHead><TableHead className="text-right">Diferencia</TableHead></>}<TableHead className="text-right">{count.status === "Draft" ? "Cantidad física" : "Resultado"}</TableHead></TableRow></TableHeader><TableBody>{filteredLines.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay productos que coincidan con la búsqueda.</TableCell></TableRow> : filteredLines.map((line) => <TableRow key={line.id}><TableCell><p className="font-medium">{line.productName}</p>{line.countedAt && <p className="text-xs text-muted-foreground">Contado {new Date(line.countedAt).toLocaleString("es-BO")}</p>}</TableCell><TableCell>{line.sku}<p className="text-xs text-muted-foreground">{line.barcode || "Sin código"}</p></TableCell>{count.status === "Completed" && <><TableCell className="text-right">{line.systemQuantity}</TableCell><TableCell className="text-right">{line.adjustedCountedQuantity}</TableCell><TableCell className="text-right font-semibold">{line.difference != null && line.difference > 0 ? `+${line.difference}` : line.difference}</TableCell></>}<TableCell className="text-right">{count.status === "Draft" ? <div className="ml-auto flex w-40 gap-2"><Input aria-label={`Cantidad física de ${line.productName}`} type="number" min={0} step={1} value={quantities[line.productId] ?? ""} onChange={(event) => setQuantities((current) => ({ ...current, [line.productId]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") void saveLine(line); }} disabled={!canManage || Boolean(savingProductId)} /><Button size="icon" aria-label={`Guardar ${line.productName}`} onClick={() => void saveLine(line)} disabled={!canManage || Boolean(savingProductId)}>{savingProductId === line.productId ? <SpinnerGap className="animate-spin" /> : <FloppyDisk />}</Button></div> : <Badge variant={line.result === "Shortage" ? "destructive" : line.result === "Surplus" ? "default" : "secondary"}>{resultLabels[line.result]}</Badge>}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      </>}
    </div>
    <AlertDialog open={Boolean(transition)} onOpenChange={(open: boolean) => !open && setTransition(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{transition === "complete" ? "¿Completar y conciliar la toma?" : "¿Cancelar esta toma?"}</AlertDialogTitle><AlertDialogDescription>{transition === "complete" ? "Se generará un reporte inmutable. Esta acción no ajusta automáticamente las existencias." : "Se descartará el conteo en curso sin modificar las existencias."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={transitioning}>Volver</AlertDialogCancel><AlertDialogAction disabled={transitioning} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void performTransition(); }}>{transitioning && <SpinnerGap className="animate-spin" />}{transition === "complete" ? "Completar" : "Cancelar toma"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </DashboardLayout></PageTransition>;
}

function Metric({ label, value }: { label: string; value?: number }) { return <div><p className="text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value ?? "—"}</p></div>; }
