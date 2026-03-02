import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  useSensor,
  useSensors,
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

interface KanbanBoardProps {
  leads: LeadDto[];
  listConfigs: PipelineListConfig[];
  compactMode?: boolean;
  isLoading: boolean;
  onLeadsChange: (updatedLeads: LeadDto[]) => void;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
  onSendToTrello: (lead: LeadDto) => void;
  sendingToTrelloIds: Set<string>;
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

export function KanbanBoard({
  leads,
  listConfigs,
  compactMode = false,
  isLoading,
  onLeadsChange,
  onEdit,
  onDelete,
  onSendToTrello,
  sendingToTrelloIds,
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<LeadDto | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);

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

  const handleDragStart = (e: any) => {
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

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
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
      const convertToCustomer = shouldOfferConversion
        ? confirm(
            `¿Deseas crear un cliente con los datos del lead "${currentDraggedLead.name}"?`
          )
        : false;

      // Optimistic update: update local state immediately
      const updatedLeads = leads.map((lead) =>
        lead.id === currentDraggedLead.id
          ? { ...lead, status: targetStatus!, position: targetIndex! }
          : lead
      );
      onLeadsChange(updatedLeads);

      // Sync with server in background
      try {
        const updated = await updateLeadStatus(currentDraggedLead.id, {
          status: targetStatus,
          position: targetIndex,
          convertToCustomer,
        });
        onLeadsChange(
          leads.map((lead) => (lead.id === updated.id ? updated : lead))
        );
        toast.success(`Lead movido a ${statusLabels[targetStatus] ?? "nueva lista"}`);
      } catch (error) {
        console.error("Error updating lead status:", error);
        // Revert on error
        onLeadsChange(leads);
        toast.error("Error al mover el lead");
      }
    },
    [draggedLead, groupedLeads, leads, onLeadsChange, overStatus, statusLabels]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  if (visibleListConfigs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No hay listas visibles. Activa al menos una lista en “Configurar listas”.
        </p>
      </div>
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
            .map((item) => item.status)
            .filter((status) => STATUSES.includes(status))
            .map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={statusLabels[status]}
              compactMode={compactMode}
              leads={groupedLeads[status]}
              isOver={overStatus === status}
              onEdit={onEdit}
              onDelete={onDelete}
              onSendToTrello={onSendToTrello}
              sendingToTrelloIds={sendingToTrelloIds}
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
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
