import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<string>("today");

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from = today;
    let to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (value) {
      case "today":
        // Already set
        break;
      case "yesterday":
        from = new Date(today);
        from.setDate(from.getDate() - 1);
        to = new Date(today);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59);
        break;
      case "last7":
        from = new Date(today);
        from.setDate(from.getDate() - 6);
        break;
      case "last30":
        from = new Date(today);
        from.setDate(from.getDate() - 29);
        break;
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "lastMonth":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
    }
    
    onDateRangeChange({ from, to });
    if (value !== "custom") {
      setIsOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-MX", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
    if (!value) return;
    // Create date from string value (YYYY-MM-DD) treating it as local date
    const [year, month, day] = value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    
    if (isNaN(newDate.getTime())) return;

    const newRange = { ...dateRange };
    if (type === 'from') {
      newRange.from = newDate;
    } else {
      newRange.to = newDate;
      newRange.to.setHours(23, 59, 59);
    }
    onDateRangeChange(newRange);
    setPreset("custom");
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                </>
              ) : (
                formatDate(dateRange.from)
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Rango de fechas</h4>
              <p className="text-sm text-muted-foreground">
                Filtra los datos del tablero.
              </p>
            </div>
            <div className="grid gap-2">
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="last7">Últimos 7 días</SelectItem>
                  <SelectItem value="last30">Últimos 30 días</SelectItem>
                  <SelectItem value="thisMonth">Este mes</SelectItem>
                  <SelectItem value="lastMonth">Mes pasado</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {preset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="from">Desde</Label>
                    <Input
                      id="from"
                      type="date"
                      className="h-8"
                      value={dateRange.from.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="to">Hasta</Label>
                    <Input
                      id="to"
                      type="date"
                      className="h-8"
                      value={dateRange.to.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
