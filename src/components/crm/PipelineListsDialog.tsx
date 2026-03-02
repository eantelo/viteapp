import { useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, CaretDown, CaretUp, ListChecks } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PipelineListConfig } from "@/lib/crmPipelineLists";

interface PipelineListsDialogProps {
  open: boolean;
  configs: PipelineListConfig[];
  onClose: () => void;
  onSave: (configs: PipelineListConfig[]) => void;
  onReset: () => void;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function PipelineListsDialog({
  open,
  configs,
  onClose,
  onSave,
  onReset,
}: PipelineListsDialogProps) {
  const [draft, setDraft] = useState<PipelineListConfig[]>(configs);

  useEffect(() => {
    if (open) {
      setDraft(configs.map((item) => ({ ...item })));
    }
  }, [open, configs]);

  const hasEmptyLabels = useMemo(
    () => draft.some((item) => item.label.trim().length === 0),
    [draft],
  );

  const handleLabelChange = (status: number, value: string) => {
    setDraft((prev) =>
      prev.map((item) =>
        item.status === status ? { ...item, label: value } : item,
      ),
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draft.length) {
      return;
    }

    const moved = moveItem(draft, index, targetIndex).map((item, position) => ({
      ...item,
      order: position,
    }));

    setDraft(moved);
  };

  const handleSave = () => {
    const sanitized = draft.map((item, index) => ({
      ...item,
      label: item.label.trim(),
      order: index,
    }));

    onSave(sanitized);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks size={20} weight="duotone" />
            Configurar listas del pipeline
          </DialogTitle>
          <DialogDescription>
            Personaliza el nombre y el orden de las listas donde arrastras tarjetas en el CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-3">
          {draft.map((item, index) => (
            <div
              key={item.status}
              className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border/70 p-3"
            >
              <div className="grid gap-1">
                <Label htmlFor={`pipeline-list-${item.status}`}>Lista {index + 1}</Label>
                <Input
                  id={`pipeline-list-${item.status}`}
                  value={item.label}
                  onChange={(e) => handleLabelChange(item.status, e.target.value)}
                  placeholder="Nombre de la lista"
                  maxLength={40}
                />
              </div>

              <div className="flex items-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                  aria-label="Mover arriba"
                  title="Mover arriba"
                >
                  <CaretUp size={16} weight="bold" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === draft.length - 1}
                  aria-label="Mover abajo"
                  title="Mover abajo"
                >
                  <CaretDown size={16} weight="bold" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="justify-between">
          <Button type="button" variant="ghost" className="gap-2" onClick={onReset}>
            <ArrowsClockwise size={16} weight="bold" />
            Restablecer valores por defecto
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={hasEmptyLabels}>
              Guardar listas
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
