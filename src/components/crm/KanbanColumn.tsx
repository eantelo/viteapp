import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LeadDto } from "@/api/leadsApi";
import { LeadStatus } from "@/api/leadsApi";
import { LeadCard } from "./LeadCard";
import { LeadStatusBadge } from "./LeadBadges";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: LeadDto[];
  isOver: boolean;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
}

export function KanbanColumn({
  status,
  leads,
  isOver,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `status-${status}`,
  });

  const totalValue = leads.reduce(
    (sum, lead) => sum + (lead.estimatedValue || 0),
    0
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-96 h-full bg-slate-50 rounded-lg border-2 transition-all",
        isOver
          ? "border-primary/50 bg-primary/5 shadow-md"
          : "border-slate-200 shadow-sm"
      )}
    >
      {/* Column header */}
      <div className="flex-0 border-b border-slate-200 bg-white rounded-t-[calc(0.5rem-1px)] px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LeadStatusBadge status={status} />
            <span className="text-sm font-medium text-slate-600">
              {leads.length}
            </span>
          </div>
          {totalValue > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-sm font-semibold text-slate-900">
                ${totalValue.toLocaleString("es-ES", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cards area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {leads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-32 text-center"
              >
                <p className="text-xs text-slate-400">
                  Arrastra leads aquí
                </p>
              </motion.div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}
