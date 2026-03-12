import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Check, PencilSimpleLine, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { LeadDto } from "@/api/leadsApi";
import { LeadStatus } from "@/api/leadsApi";
import { LeadCard } from "./LeadCard";
import { LeadStatusBadge } from "./LeadBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface KanbanColumnProps {
  status: LeadStatus;
  title: string;
  compactMode?: boolean;
  leads: LeadDto[];
  isOver: boolean;
  onRenameTitle?: (status: LeadStatus, nextTitle: string) => boolean;
  onEdit: (lead: LeadDto) => void;
  onDelete: (lead: LeadDto) => void;
  onSendToTrello: (lead: LeadDto) => void;
  sendingToTrelloIds: Set<string>;
}

export function KanbanColumn({
  status,
  title,
  compactMode = false,
  leads,
  isOver,
  onRenameTitle,
  onEdit,
  onDelete,
  onSendToTrello,
  sendingToTrelloIds,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `status-${status}`,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [renameError, setRenameError] = useState<string | null>(null);

  const totalValue = leads.reduce(
    (sum, lead) => sum + (lead.estimatedValue || 0),
    0
  );

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleStartRename = () => {
    setDraftTitle(title);
    setRenameError(null);
    setIsEditingTitle(true);
  };

  const handleCancelRename = () => {
    setDraftTitle(title);
    setRenameError(null);
    setIsEditingTitle(false);
  };

  const handleSaveRename = () => {
    const sanitizedTitle = draftTitle.trim();

    if (!sanitizedTitle) {
      setRenameError("Escribe un nombre para la lista.");
      return;
    }

    if (sanitizedTitle === title.trim()) {
      setRenameError(null);
      setIsEditingTitle(false);
      return;
    }

    const saved = onRenameTitle?.(status, sanitizedTitle);
    if (saved === false) {
      return;
    }

    setRenameError(null);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelRename();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Mobile: 82vw shows current column + peek of next (scroll affordance)
        // Tablet: fixed 320px · Desktop: fixed 384px
        compactMode
          ? "flex flex-col w-[78vw] sm:w-72 md:w-80 min-w-60 shrink-0 snap-start snap-always"
          : "flex flex-col w-[82vw] sm:w-80 md:w-96 min-w-[260px] shrink-0 snap-start snap-always",
        "h-full rounded-lg border border-border/60 bg-card/90 text-card-foreground transition-all",
        isOver
          ? "border-primary/50 bg-primary/5 shadow-md dark:border-primary/40 dark:bg-primary/10"
          : "shadow-sm dark:shadow-none"
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex-0 sticky top-0 z-10 rounded-t-[calc(0.5rem-1px)] border-b border-border/60 bg-background/90 dark:bg-background/60",
          compactMode ? "px-3 py-2" : "px-4 py-3"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);
                      if (renameError) {
                        setRenameError(null);
                      }
                    }}
                    onKeyDown={handleTitleKeyDown}
                    aria-label="Nombre de la lista"
                    aria-invalid={renameError ? true : undefined}
                    maxLength={40}
                    className="h-8 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="icon-sm"
                    onClick={handleSaveRename}
                    aria-label="Guardar nombre de la lista"
                    title="Guardar nombre"
                  >
                    <Check size={16} weight="bold" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={handleCancelRename}
                    aria-label="Cancelar edición del nombre de la lista"
                    title="Cancelar edición"
                  >
                    <X size={16} weight="bold" />
                  </Button>
                </div>
                {renameError ? (
                  <p className="text-[11px] text-destructive">{renameError}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LeadStatusBadge status={status} label={title} />
                <span className="text-sm font-medium text-muted-foreground">
                  {leads.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  onClick={handleStartRename}
                  aria-label={`Editar nombre de la lista ${title}`}
                  title="Editar nombre de la lista"
                >
                  <PencilSimpleLine size={15} weight="bold" />
                </Button>
              </div>
            )}
          </div>
          {!compactMode && totalValue > 0 && (
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
      <div
        className={cn(
          "flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200/80 dark:scrollbar-thumb-slate-700/60",
          compactMode ? "p-2" : "p-3"
        )}
      >
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
                  onSendToTrello={onSendToTrello}
                  isSendingToTrello={sendingToTrelloIds.has(lead.id)}
                />
              ))
            )}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}
