import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsThreeVertical, Trash, PencilSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LeadDto } from "@/api/leadsApi";
import { LeadSourceBadge } from "./LeadBadges";
import { Card } from "@/components/ui/card";

interface LeadCardProps {
  lead: LeadDto;
  isDragging?: boolean;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
}

export function LeadCard({
  lead,
  isDragging,
  onEdit,
  onDelete,
}: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(lead);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(lead);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="touch-none"
    >
      <Card
        className={cn(
          "group relative cursor-grab border-border/60 transition-all active:cursor-grabbing",
          isDragging
            ? "opacity-50 shadow-lg ring-2 ring-primary/50"
            : "hover:shadow-md hover:border-border/80 dark:hover:shadow-none"
        )}
      >
        {/* Grip indicator */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DotsThreeVertical
            size={16}
            weight="bold"
            className="text-slate-400 dark:text-slate-500"
          />
        </div>

        <div className="p-4 pl-6 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {lead.name}
              </h3>
              {lead.company && (
                <p className="text-xs text-muted-foreground truncate">
                  {lead.company}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEditClick}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Editar"
              >
                <PencilSimple size={14} weight="bold" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                title="Eliminar"
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 items-center">
            {lead.productInterestName && (
              <span className="inline-block max-w-[200px] truncate rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                {lead.productInterestName}
              </span>
            )}
            {lead.source !== null && lead.source !== undefined && (
              <LeadSourceBadge source={lead.source} />
            )}
          </div>

          {/* Contact info */}
          {(lead.email || lead.phone) && (
            <div className="space-y-1">
              {lead.email && (
                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
              )}
              {lead.phone && (
                <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
              )}
            </div>
          )}

          {/* Estimated value */}
          {lead.estimatedValue && (
            <div className="flex items-baseline gap-1 border-t border-border/60 pt-1">
              <span className="text-xs font-medium text-muted-foreground">Valor:</span>
              <span className="text-sm font-semibold text-foreground">
                ${lead.estimatedValue.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* Notes preview */}
          {lead.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 italic">
              "{lead.notes}"
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
