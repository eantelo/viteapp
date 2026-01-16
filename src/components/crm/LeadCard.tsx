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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          "group relative cursor-grab border-slate-200/80 transition-all active:cursor-grabbing",
          isDragging
            ? "opacity-50 shadow-lg ring-2 ring-primary/50"
            : "hover:shadow-md hover:border-slate-300"
        )}
      >
        {/* Grip handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-1 bg-linear-to-r from-transparent to-slate-200 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DotsThreeVertical
            size={14}
            weight="bold"
            className="text-slate-400 cursor-grab active:cursor-grabbing"
          />
        </div>

        <div className="p-4 pl-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-900 truncate">
                {lead.name}
              </h3>
              {lead.company && (
                <p className="text-xs text-slate-500 truncate">
                  {lead.company}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEditClick}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Editar"
              >
                <PencilSimple size={14} weight="bold" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Eliminar"
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 items-center">
            {lead.productInterestName && (
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 truncate max-w-[200px]">
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
                <p className="text-xs text-slate-500 truncate">{lead.email}</p>
              )}
              {lead.phone && (
                <p className="text-xs text-slate-500 truncate">{lead.phone}</p>
              )}
            </div>
          )}

          {/* Estimated value */}
          {lead.estimatedValue && (
            <div className="flex items-baseline gap-1 pt-1 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-700">Valor:</span>
              <span className="text-sm font-semibold text-slate-900">
                ${lead.estimatedValue.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* Notes preview */}
          {lead.notes && (
            <p className="text-xs text-slate-500 line-clamp-2 italic">
              "{lead.notes}"
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
