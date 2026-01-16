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
import type { LeadDto, LeadStatus } from "@/api/leadsApi";
import { LeadCard } from "./LeadCard";
import { KanbanColumn } from "./KanbanColumn";
import { updateLeadStatus } from "@/api/leadsApi";
import { toast } from "sonner";

interface KanbanBoardProps {
  leads: LeadDto[];
  isLoading: boolean;
  onLeadsChange: () => Promise<void>;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
}

const STATUSES: LeadStatus[] = [0, 1, 2, 3, 4, 5, 6]; // All enum values

const STATUS_LABELS: Record<LeadStatus, string> = {
  0: "Nuevo",
  1: "Contactado",
  2: "Calificado",
  3: "Propuesta",
  4: "Negociación",
  5: "Ganado",
  6: "Perdido",
};

export function KanbanBoard({
  leads,
  isLoading,
  onLeadsChange,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<LeadDto | null>(null);
  const [overStatus, setOverStatus] = useState<LeadStatus | null>(null);

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
      setDraggedLead(null);
      setOverStatus(null);

      if (!over || !draggedLead) return;

      if (over.id === draggedLead.id) {
        return;
      }

      let targetStatus: LeadStatus | null = null;
      let targetIndex: number | null = null;

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

      if (targetStatus === null || targetIndex === null) {
        return;
      }

      try {
        await updateLeadStatus(draggedLead.id, {
          status: targetStatus,
          position: targetIndex,
          convertToCustomer: false,
        });

        await onLeadsChange();
        toast.success(`Lead movido a ${STATUS_LABELS[targetStatus]}`);
      } catch (error) {
        console.error("Error updating lead status:", error);
        toast.error("Error al mover el lead");
      }
    },
    [draggedLead, groupedLeads, onLeadsChange]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex gap-4 overflow-x-auto pb-4 pr-4"
      >
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={groupedLeads[status]}
            isOver={overStatus === status}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </motion.div>

      <DragOverlay>
        {draggedLead && (
          <div className="rotate-6 shadow-2xl">
            <LeadCard
              lead={draggedLead}
              isDragging={true}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
