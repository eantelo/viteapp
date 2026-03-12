import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLeadPrefill, type LeadPrefillData } from "@/contexts/FormPrefillContext";
import { Plus, Kanban, SlidersHorizontal, Columns } from "@phosphor-icons/react";
import { type LeadDto, type LeadStatus } from "@/api/leadsApi";
import { deleteLead, getLeads, sendLeadToTrello } from "@/api/leadsApi";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { PipelineListsDialog } from "@/components/crm/PipelineListsDialog";
import { PageHeader, SearchInput } from "@/components/shared";
import { PAGE_LAYOUT_CLASS } from "@/lib/constants";
import {
  getDefaultPipelineListConfigs,
  getPipelineLabelMap,
  loadPipelineListConfigs,
  savePipelineListConfigs,
  type PipelineListConfig,
} from "@/lib/crmPipelineLists";

export function CrmPage() {
  useDocumentTitle("CRM - Leads");
  const isMobile = useIsMobile();
  const compactStorageKey = "salesnet.crm.pipeline.compact";
  const [searchParams, setSearchParams] = useSearchParams();

  // Prefill data from interface agent
  const { hasData: hasPrefillData, getData: getPrefillData } =
    useLeadPrefill();
  const prefillAppliedRef = useRef(false);
  const [prefillData, setPrefillData] = useState<LeadPrefillData | null>(null);

  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listsDialogOpen, setListsDialogOpen] = useState(false);
  const [hasCompactPreference, setHasCompactPreference] = useState<boolean>(() => {
    try {
      return localStorage.getItem("salesnet.crm.pipeline.compact") !== null;
    } catch {
      return false;
    }
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("salesnet.crm.pipeline.compact") === "1";
    } catch {
      return false;
    }
  });
  const [editingLead, setEditingLead] = useState<LeadDto | null>(null);
  const [listConfigs, setListConfigs] = useState<PipelineListConfig[]>(() =>
    loadPipelineListConfigs()
  );
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null
  );
  const [sendingToTrelloIds, setSendingToTrelloIds] = useState<Set<string>>(
    () => new Set()
  );

  const statusLabelMap = getPipelineLabelMap(listConfigs) as Record<
    LeadStatus,
    string
  >;
  const visibleListsCount = listConfigs.filter((item) => item.visible).length;
  const searchPlaceholder = isMobile
    ? "Buscar leads..."
    : "Buscar por nombre, empresa, email, teléfono...";
  const compactButtonLabel = isMobile
    ? compactMode
      ? "Compacto ON"
      : "Compacto OFF"
    : compactMode
      ? "Desactivar compacto"
      : "Activar compacto";

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

  useEffect(() => {
    if (!hasCompactPreference) {
      setCompactMode(isMobile);
    }
  }, [hasCompactPreference, isMobile]);

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

  const handleSendToTrello = async (lead: LeadDto) => {
    if (
      !confirm(
        `¿Enviar el lead "${lead.name}" como tarjeta a Trello?`
      )
    ) {
      return;
    }

    if (sendingToTrelloIds.has(lead.id)) {
      return;
    }

    setSendingToTrelloIds((prev) => {
      const next = new Set(prev);
      next.add(lead.id);
      return next;
    });

    try {
      await sendLeadToTrello(lead.id);
      toast.success("Tarjeta enviada a Trello", {
        description: `Lead: ${lead.name}`,
      });
    } catch (sendError) {
      toast.error(
        sendError instanceof Error
          ? sendError.message
          : "Error al enviar la tarjeta a Trello"
      );
    } finally {
      setSendingToTrelloIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingLead(null);
    setPrefillData(null);
    if (saved) {
      void loadLeads();
      toast.success(editingLead ? "Lead actualizado" : "Lead creado");
    }
  };

  const handleSaveLists = (configs: PipelineListConfig[]) => {
    setListConfigs(configs);
    savePipelineListConfigs(configs);
    setListsDialogOpen(false);
    toast.success("Listas del pipeline actualizadas");
  };

  const handleRenameList = useCallback(
    (status: LeadStatus, nextLabel: string) => {
      const sanitizedLabel = nextLabel.trim();

      if (!sanitizedLabel) {
        toast.error("El nombre de la lista no puede estar vacío");
        return false;
      }

      const currentConfig = listConfigs.find((item) => item.status === status);
      if (!currentConfig || currentConfig.label === sanitizedLabel) {
        return true;
      }

      const updatedConfigs = listConfigs.map((item) =>
        item.status === status ? { ...item, label: sanitizedLabel } : item,
      );

      setListConfigs(updatedConfigs);
      savePipelineListConfigs(updatedConfigs);
      return true;
    },
    [listConfigs],
  );

  const handleResetLists = () => {
    const defaults = getDefaultPipelineListConfigs();
    setListConfigs(defaults);
    savePipelineListConfigs(defaults);
    toast.success("Listas restablecidas a valores por defecto");
  };

  const toggleCompactMode = () => {
    setCompactMode((prev) => {
      const next = !prev;
      localStorage.setItem(compactStorageKey, next ? "1" : "0");
      return next;
    });
    setHasCompactPreference(true);
  };

  const restoreCompactAuto = () => {
    localStorage.removeItem(compactStorageKey);
    setHasCompactPreference(false);
    setCompactMode(isMobile);
    toast.success("Modo compacto automático restaurado", {
      description: isMobile
        ? "Se activará automáticamente en móvil"
        : "Se desactivará automáticamente en pantallas grandes",
    });
  };

  return (
    <PageTransition>
      <DashboardLayout
        breadcrumbs={[
          { label: "Panel principal", href: "/dashboard" },
          { label: "CRM - Pipeline" },
        ]}
        className={PAGE_LAYOUT_CLASS}
      >
        <div className="flex min-h-dvh w-full flex-col gap-4 overflow-y-auto overflow-x-hidden pb-2 md:min-h-0 md:overflow-visible md:pb-0">
          <PageHeader
            title="Pipeline de Leads"
            description="Gestiona tu pipeline de ventas con un sistema visual de kanban. Arrastra leads entre etapas."
            sectionLabel="Gestión de ventas"
            icon={Kanban}
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setListsDialogOpen(true)}
                    className="h-11 justify-center gap-2 px-3 text-sm sm:h-9"
                    title="Configurar listas visibles del pipeline"
                    aria-label="Configurar listas visibles del pipeline"
                  >
                    <SlidersHorizontal size={18} weight="bold" />
                    <span className="truncate">
                      {isMobile ? "Listas" : "Configurar listas"}
                    </span>
                  </Button>
                  <Button
                    variant={compactMode ? "default" : "outline"}
                    onClick={toggleCompactMode}
                    className="h-11 justify-center gap-2 px-3 text-sm sm:h-9"
                    title="Alternar vista compacta del pipeline"
                    aria-label="Alternar vista compacta del pipeline"
                  >
                    <Columns size={18} weight="bold" />
                    <span className="truncate">
                      {compactButtonLabel}
                      {!hasCompactPreference && " (auto)"}
                    </span>
                  </Button>
                  {hasCompactPreference && (
                    <Button
                      variant="ghost"
                      onClick={restoreCompactAuto}
                      className="col-span-2 h-11 justify-center gap-2 px-3 text-sm sm:col-span-1 sm:h-9"
                      title="Restaurar modo compacto automático según el dispositivo"
                      aria-label="Restaurar modo compacto automático según el dispositivo"
                    >
                      {isMobile ? "Volver a auto" : "Restaurar auto"}
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleCreate}
                  className="h-11 w-full gap-2 text-sm sm:h-9 sm:w-auto"
                  title="Crear un nuevo lead"
                  aria-label="Crear un nuevo lead"
                >
                  <Plus size={18} weight="bold" />
                  Nuevo Lead
                </Button>
              </div>
            }
          />

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            resultCount={filteredLeads.length}
            totalCount={leads.length}
            className="sticky top-0 z-10 rounded-lg bg-background/95 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          />

          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Puedes cambiar el nombre de cada lista desde el encabezado de la columna sin salir del CRM.
          </div>

          {isMobile && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
              <p className="min-w-0 text-muted-foreground">
                Desliza horizontalmente para cambiar de etapa.
              </p>
              <span className="shrink-0 font-medium text-foreground">
                {visibleListsCount} lista{visibleListsCount === 1 ? "" : "s"}
              </span>
            </div>
          )}

          <div className="flex flex-1 min-h-[22rem] min-w-0 flex-col">
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <KanbanBoard
                leads={filteredLeads}
                listConfigs={listConfigs}
                compactMode={compactMode}
                isLoading={loading}
                onRenameList={handleRenameList}
                onLeadsChange={handleLeadsChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSendToTrello={handleSendToTrello}
                sendingToTrelloIds={sendingToTrelloIds}
              />
            )}
          </div>
        </div>

        <LeadFormDialog
          open={dialogOpen}
          lead={editingLead}
          prefillData={prefillData}
          statusLabels={statusLabelMap}
          onClose={handleDialogClose}
        />

        <PipelineListsDialog
          open={listsDialogOpen}
          configs={listConfigs}
          onClose={() => setListsDialogOpen(false)}
          onSave={handleSaveLists}
          onReset={handleResetLists}
        />
      </DashboardLayout>
    </PageTransition>
  );
}
