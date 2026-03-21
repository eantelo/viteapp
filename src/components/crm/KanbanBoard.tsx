import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { LeadStatus, type LeadDto } from "@/api/leadsApi";
import { LeadCard } from "./LeadCard";
import { KanbanColumn } from "./KanbanColumn";
import { updateLeadStatus } from "@/api/leadsApi";
import type { PipelineListConfig } from "@/lib/crmPipelineLists";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared";
import { SlidersHorizontal } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  leads: LeadDto[];
  listConfigs: PipelineListConfig[];
  compactMode?: boolean;
  isLoading: boolean;
  onRenameList: (status: LeadStatus, nextLabel: string) => boolean;
  onLeadsChange: (updatedLeads: LeadDto[]) => void;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
  onSendToTrello: (lead: LeadDto) => void;
  sendingToTrelloIds: Set<string>;
  selectedLeadIds: Set<string>;
  onToggleLeadSelection: (lead: LeadDto, isSelected: boolean) => void;
  onConfigureLists: () => void;
}

const STATUSES: LeadStatus[] = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Qualified,
  LeadStatus.Proposal,
  LeadStatus.Negotiation,
  LeadStatus.Won,
  LeadStatus.Lost,
];

interface PendingLeadMove {
  lead: LeadDto;
  targetStatus: LeadStatus;
  targetIndex: number;
  previousLeads: LeadDto[];
}

export function KanbanBoard({
  leads,
  listConfigs,
  compactMode = false,
  isLoading,
  onRenameList,
  onLeadsChange,
  onEdit,
  onDelete,
  onSendToTrello,
  sendingToTrelloIds,
  selectedLeadIds,
  onToggleLeadSelection,
  onConfigureLists,
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<LeadDto | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);
  const [pendingLeadMove, setPendingLeadMove] = useState<PendingLeadMove | null>(
    null
  );
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  const orderedListConfigs = [...listConfigs].sort((a, b) => a.order - b.order);
  const visibleListConfigs = orderedListConfigs.filter((item) => item.visible);
  const statusLabels = orderedListConfigs.reduce(
    (acc, item) => ({ ...acc, [item.status]: item.label }),
    {} as Record<LeadStatus, string>
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedLeads = STATUSES.reduce(
    (acc, status) => ({
      ...acc,
      [status]: leads.filter((l) => l.status === status),
    }),
    {} as Record<LeadStatus, LeadDto[]>
  );

  const executeLeadMove = async (
    pendingMove: PendingLeadMove,
    convertToCustomer: boolean
  ) => {
    const { lead, previousLeads, targetIndex, targetStatus } = pendingMove;

    const updatedLeads = previousLeads.map((currentLead) =>
      currentLead.id === lead.id
        ? { ...currentLead, status: targetStatus, position: targetIndex }
        : currentLead
    );

    onLeadsChange(updatedLeads);

    try {
      const updated = await updateLeadStatus(lead.id, {
        status: targetStatus,
        position: targetIndex,
        convertToCustomer,
      });
      onLeadsChange(
        previousLeads.map((currentLead) =>
          currentLead.id === updated.id ? updated : currentLead
        )
      );
      toast.success(`Lead movido a ${statusLabels[targetStatus] ?? "nueva lista"}`);
    } catch (error) {
      console.error("Error updating lead status:", error);
      onLeadsChange(previousLeads);
      toast.error("Error al mover el lead");
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const leadId = e.active.id;
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setDraggedLead(lead);
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { over } = e;
    if (!over) return;

    if (typeof over.id === "string" && over.id.startsWith("status-")) {
      const statusStr = over.id.replace("status-", "");
      const status = parseInt(statusStr, 10) as LeadStatus;
      setOverStatus(status);
      return;
    }

    const overLead = leads.find((l) => l.id === over.id);
    if (overLead) {
      setOverStatus(overLead.status);
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { over } = e;
    const currentDraggedLead = draggedLead;
    const lastOverStatus = overStatus;

    setDraggedLead(null);
    setOverStatus(null);

    if (!currentDraggedLead) return;

    if (over && over.id === currentDraggedLead.id) {
      return;
    }

    let targetStatus: LeadStatus | null = null;
    let targetIndex: number | null = null;

    if (over) {
      if (typeof over.id === "string" && over.id.startsWith("status-")) {
        const statusStr = over.id.replace("status-", "");
        targetStatus = parseInt(statusStr, 10) as LeadStatus;
        targetIndex = groupedLeads[targetStatus]?.length ?? 0;
      } else {
        const overLead = leads.find((l) => l.id === over.id);
        if (overLead) {
          targetStatus = overLead.status;
          const targetLeads = groupedLeads[targetStatus] ?? [];
          targetIndex = targetLeads.findIndex((l) => l.id === overLead.id);
          if (targetIndex < 0) {
            targetIndex = targetLeads.length;
          }
        }
      }
    } else if (lastOverStatus !== null) {
      targetStatus = lastOverStatus;
      targetIndex = groupedLeads[targetStatus]?.length ?? 0;
    }

    if (targetStatus === null || targetIndex === null) {
      return;
    }

    // Skip if no actual change
    if (currentDraggedLead.status === targetStatus) {
      return;
    }

    const shouldOfferConversion =
      targetStatus === LeadStatus.Won && !currentDraggedLead.customerId;

    if (shouldOfferConversion) {
      setPendingLeadMove({
        lead: currentDraggedLead,
        previousLeads: leads,
        targetStatus,
        targetIndex,
      });
      return;
    }

    try {
      await executeLeadMove(
        {
          lead: currentDraggedLead,
          previousLeads: leads,
          targetStatus,
          targetIndex,
        },
        false
      );
    } catch (error) {
      console.error("Unexpected lead move error:", error);
    }
  };

  const handlePendingMoveDecision = async (convertToCustomer: boolean) => {
    if (!pendingLeadMove || isMoveSubmitting) {
      return;
    }

    setIsMoveSubmitting(true);
    try {
      await executeLeadMove(pendingLeadMove, convertToCustomer);
    } finally {
      setIsMoveSubmitting(false);
      setPendingLeadMove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  if (visibleListConfigs.length === 0) {
    return (
      <EmptyState
        icon={SlidersHorizontal}
        title="No hay listas visibles"
        description="Activa al menos una lista en la configuración del pipeline para volver a mostrar el tablero."
        actionLabel="Configurar listas"
        onAction={onConfigureLists}
        className="h-64 border-border/70"
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Scroll container: horizontal snap on mobile, natural overflow on desktop */}
      <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-3 px-3 md:mx-0 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="inline-flex gap-3 pb-4 pr-4"
        >
          {visibleListConfigs
            .filter((item) => STATUSES.includes(item.status))
            .map((item) => (
            <KanbanColumn
              key={item.status}
              status={item.status}
              title={item.label}
              compactMode={compactMode}
              leads={groupedLeads[item.status]}
              isOver={overStatus === item.status}
              onRenameTitle={onRenameList}
              onEdit={onEdit}
              onDelete={onDelete}
              onSendToTrello={onSendToTrello}
              sendingToTrelloIds={sendingToTrelloIds}
              selectedLeadIds={selectedLeadIds}
              onToggleLeadSelection={onToggleLeadSelection}
            />
          ))}
        </motion.div>
      </div>

      <DragOverlay>
        {draggedLead && (
          <div className="rotate-6 shadow-2xl">
            <LeadCard
              lead={draggedLead}
              isDragging={true}
              onEdit={() => {}}
              onDelete={() => {}}
              onSendToTrello={() => {}}
              isSendingToTrello={false}
              showSelectionControl={false}
            />
          </div>
        )}
      </DragOverlay>
      <AlertDialog
        open={!!pendingLeadMove}
        onOpenChange={(open) => {
          if (!open && !isMoveSubmitting) {
            setPendingLeadMove(null);
          }
        }}
      >
        <AlertDialogContent
          className="max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear cliente al ganar lead?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                El lead{" "}
                <span className="font-semibold text-foreground">
                  {pendingLeadMove?.lead.name}
                </span>{" "}
                se moverá a la lista de ganados.
              </span>
              <span className="block">
                Puedes crear también un cliente con sus datos actuales o moverlo sin generar ese registro.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              asChild
              disabled={isMoveSubmitting}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => void handlePendingMoveDecision(false)}
              >
                Mover sin crear cliente
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              asChild
              disabled={isMoveSubmitting}
            >
              <Button
                type="button"
                onClick={() => void handlePendingMoveDecision(true)}
              >
                {isMoveSubmitting ? "Procesando..." : "Crear cliente y mover"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
