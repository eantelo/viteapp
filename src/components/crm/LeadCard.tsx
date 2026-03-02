import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleNotch, DotsThreeVertical, PaperPlaneTilt, Trash, PencilSimple, Clock } from "@phosphor-icons/react";
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
  onSendToTrello: (lead: LeadDto) => void;
  isSendingToTrello?: boolean;
}

export function LeadCard({
  lead,
  isDragging,
  onEdit,
  onDelete,
  onSendToTrello,
  isSendingToTrello = false,
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

  const handleSendToTrelloClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendToTrello(lead);
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
            {/* Buttons: always visible on mobile (no hover), fade-in on desktop hover */}
            <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <button
                onClick={handleSendToTrelloClick}
                disabled={isSendingToTrello}
                className="rounded p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 active:scale-95 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 md:p-1.5"
                title={isSendingToTrello ? "Enviando a Trello..." : "Enviar tarjeta a Trello"}
                aria-label={isSendingToTrello ? "Enviando tarjeta a Trello" : "Enviar tarjeta a Trello"}
              >
                {isSendingToTrello ? (
                  <CircleNotch size={14} weight="bold" className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={14} weight="bold" />
                )}
              </button>
              <button
                onClick={handleEditClick}
                className="rounded p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:p-1.5"
                title="Editar"
                aria-label="Editar lead"
              >
                <PencilSimple size={14} weight="bold" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="rounded p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 dark:hover:bg-red-950/50 dark:hover:text-red-300 md:p-1.5"
                title="Eliminar"
                aria-label="Eliminar lead"
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

          {/* Created date */}
          <div className="flex items-center gap-1 border-t border-border/50 pt-1.5">
            <Clock size={11} className="shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              {new Date(lead.createdAt).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
