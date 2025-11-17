import { Info, ShieldCheck, OctagonAlert } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "error";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  message: string;
  items?: string[];
}

const variantStyles: Record<AlertVariant, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const variantIcons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: ShieldCheck,
  error: OctagonAlert,
};

export function Alert({
  variant = "info",
  title,
  message,
  items,
  className,
  ...rest
}: AlertProps) {
  const Icon = variantIcons[variant];
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
        {items && items.length > 0 && (
          <ul className="list-inside list-disc space-y-1">
            {items.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
