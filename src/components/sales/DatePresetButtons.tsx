import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/types/salesHistory";

interface DatePresetButtonsProps {
  selected: DatePreset;
  onSelect: (preset: DatePreset) => void;
}

export function DatePresetButtons({
  selected,
  onSelect,
}: DatePresetButtonsProps) {
  const presets: Array<{ value: DatePreset; label: string }> = [
    { value: "today", label: "Hoy" },
    { value: "yesterday", label: "Ayer" },
    { value: "thisWeek", label: "Esta semana" },
    { value: "thisMonth", label: "Este mes" },
    { value: "custom", label: "Personalizado" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={selected === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(preset.value)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
