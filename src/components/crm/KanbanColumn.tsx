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
        "flex flex-col w-96 h-full rounded-lg border border-border/60 bg-card/90 text-card-foreground transition-all",
        isOver
          ? "border-primary/50 bg-primary/5 shadow-md dark:border-primary/40 dark:bg-primary/10"
          : "shadow-sm dark:shadow-none"
      )}
    >
      {/* Column header */}
      <div className="flex-0 sticky top-0 z-10 rounded-t-[calc(0.5rem-1px)] border-b border-border/60 bg-background/90 px-4 py-3 dark:bg-background/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LeadStatusBadge status={status} />
            <span className="text-sm font-medium text-muted-foreground">
              {leads.length}
            </span>
          </div>
          {totalValue > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold text-foreground">
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
      <div className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200/80 dark:scrollbar-thumb-slate-700/60">
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {leads.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-32 text-center"
              >
                <p className="text-xs text-muted-foreground">
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
