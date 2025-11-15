import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar o escribir...",
  emptyText = "Escribe para crear uno nuevo.",
  className,
  disabled = false,
  maxLength = 120,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Solo abrir el dropdown con flechas o cuando se empieza a escribir
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      // No abrir con Tab
      if (e.key === "Tab") {
        return;
      }
    }

    const filteredOpts = inputValue
      ? options.filter((option) =>
          option.toLowerCase().includes(inputValue.toLowerCase())
        )
      : options;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOpts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && open && filteredOpts.length > 0) {
      e.preventDefault();
      handleSelect(filteredOpts[highlightedIndex]);
    } else if (e.key === "Tab" && open && filteredOpts.length > 0) {
      e.preventDefault();
      handleSelect(filteredOpts[highlightedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onValueChange(selectedValue);
    setOpen(false);
    // Mantener el foco en el input después de seleccionar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleInputFocus = () => {
    // No abrir automáticamente el dropdown al hacer focus
    // Solo resetear el índice resaltado
    setHighlightedIndex(0);
  };

  const filteredOptions = inputValue
    ? options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  const shouldShowOptions = filteredOptions.length > 0;

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className={cn("pr-8", className)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
              disabled={disabled}
              tabIndex={-1}
              aria-label="Mostrar opciones"
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {!shouldShowOptions ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option, index) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                      className={cn(highlightedIndex === index && "bg-accent")}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          inputValue === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
