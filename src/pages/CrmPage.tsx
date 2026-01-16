import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLeadPrefill, type LeadPrefillData } from "@/contexts/FormPrefillContext";
import { motion, useReducedMotion } from "framer-motion";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import type { LeadDto } from "@/api/leadsApi";
import { deleteLead, getLeads } from "@/api/leadsApi";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";

export function CrmPage() {
  useDocumentTitle("CRM - Leads");
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  // Prefill data from interface agent
  const { hasData: hasPrefillData, getData: getPrefillData } =
    useLeadPrefill();
  const prefillAppliedRef = useRef(false);
  const [prefillData, setPrefillData] = useState<LeadPrefillData | null>(null);

  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 16 };
  const motionAnimate = { opacity: 1, y: 0 };
  const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const motionTransition = {
    duration: prefersReducedMotion ? 0 : 0.45,
    ease: prefersReducedMotion ? undefined : easing,
  };

  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadDto | null>(null);
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null
  );

  const filteredLeads = leads.filter((lead) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      lead.name.toLowerCase().includes(term) ||
      (lead.company ?? "").toLowerCase().includes(term) ||
      (lead.email ?? "").toLowerCase().includes(term) ||
      (lead.phone ?? "").toLowerCase().includes(term)
    );
  });

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeads();
      setLeads(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Error al cargar leads"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Apply prefill data from interface agent (only once)
  useEffect(() => {
    if (prefillAppliedRef.current) return;

    if (hasPrefillData) {
      const data = getPrefillData();
      if (data) {
        prefillAppliedRef.current = true;

        if (data.id) {
          setPendingHighlightId(data.id);
          void loadLeads();
          return;
        }

        console.log("[CrmPage] Applying prefill data:", data);
        setPrefillData(data);
        setEditingLead(null);
        setDialogOpen(true);
        toast.info("Datos pre-cargados desde el asistente", {
          description: "Revisa y completa los campos restantes",
        });
      }
    }
  }, [hasPrefillData, getPrefillData, loadLeads]);

  // Handle highlight parameter from URL
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId) {
      setPendingHighlightId(highlightId);
      setSearchParams({}, { replace: true });
      void loadLeads();
    }
  }, [searchParams, setSearchParams, loadLeads]);

  // Open dialog when pending highlight lead is available
  useEffect(() => {
    if (pendingHighlightId && leads.length > 0 && !loading) {
      const leadToHighlight = leads.find((l) => l.id === pendingHighlightId);
      if (leadToHighlight) {
        setEditingLead(leadToHighlight);
        setPrefillData(null);
        setDialogOpen(true);
        setPendingHighlightId(null);
      } else {
        setPendingHighlightId(null);
      }
    }
  }, [pendingHighlightId, leads, loading]);

  const handleCreate = () => {
    setPrefillData(null);
    setEditingLead(null);
    setDialogOpen(true);
  };

  const handleEdit = (lead: LeadDto) => {
    setPrefillData(null);
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleDelete = async (lead: LeadDto) => {
    if (!confirm(`Eliminar el lead "${lead.name}"?`)) return;

    try {
      await deleteLead(lead.id);
      // Optimistic delete
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      toast.success("Lead eliminado");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Error al eliminar lead"
      );
    }
  };

  const handleLeadsChange = useCallback((updatedLeads: LeadDto[]) => {
    setLeads(updatedLeads);
  }, []);

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingLead(null);
    setPrefillData(null);
    if (saved) {
      void loadLeads();
      toast.success(editingLead ? "Lead actualizado" : "Lead creado");
    }
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "CRM - Pipeline" },
        ]}
        className="flex flex-1 flex-col gap-3 p-3 md:p-4 lg:p-6"
      >
        <motion.header
          className="flex flex-col gap-3"
          initial={motionInitial}
          animate={motionAnimate}
          transition={motionTransition}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Gestión de ventas
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Pipeline de Leads
            </h1>
            <p className="text-sm text-slate-500">
              Gestiona tu pipeline de ventas con un sistema visual de kanban. Arrastra leads entre etapas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} className="gap-2">
              <Plus size={18} weight="bold" />
              Nuevo Lead
            </Button>
          </div>
        </motion.header>

        <motion.div
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.08,
          }}
        >
          <Card className="border-slate-200/80 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg text-slate-900">
                Búsqueda de Leads
              </CardTitle>
              <CardDescription className="text-slate-500">
                Filtra por nombre, empresa, email o teléfono
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <MagnifyingGlass size={16} weight="bold" />
                </span>
                <Input
                  placeholder="Buscar por nombre, empresa, email, teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 bg-slate-50 focus-visible:ring-slate-300"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={motionInitial}
          animate={motionAnimate}
          transition={{
            ...motionTransition,
            delay: prefersReducedMotion ? 0 : 0.16,
          }}
          className="flex-1 min-h-0 min-w-0"
        >
          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-sm text-red-600">
                {error}
              </CardContent>
            </Card>
          ) : (
            <KanbanBoard
              leads={filteredLeads}
              isLoading={loading}
              onLeadsChange={handleLeadsChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </motion.div>

        <LeadFormDialog
          open={dialogOpen}
          lead={editingLead}
          prefillData={prefillData}
          onClose={handleDialogClose}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
