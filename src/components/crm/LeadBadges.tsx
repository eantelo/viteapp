import { Badge } from "@/components/ui/badge";
import { LeadStatus, LeadSource } from "@/api/leadsApi";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config: Record<
    LeadStatus,
    { label: string; className: string }
  > = {
    [LeadStatus.New]: {
      label: "Nuevo",
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300",
    },
    [LeadStatus.Contacted]: {
      label: "Contactado",
      className:
        "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-300",
    },
    [LeadStatus.Qualified]: {
      label: "Calificado",
      className:
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300",
    },
    [LeadStatus.Proposal]: {
      label: "Propuesta",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
    },
    [LeadStatus.Negotiation]: {
      label: "Negociación",
      className:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300",
    },
    [LeadStatus.Won]: {
      label: "Ganado",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    [LeadStatus.Lost]: {
      label: "Perdido",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300",
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}

export function LeadSourceBadge({ source }: { source?: LeadSource | null }) {
  if (!source) return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;

  const config: Record<LeadSource, { label: string; className: string }> = {
    [LeadSource.Website]: {
      label: "Web",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.Referral]: {
      label: "Referencia",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.SocialMedia]: {
      label: "Social",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.Advertisement]: {
      label: "Anuncio",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.ColdCall]: {
      label: "Llamada",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.Event]: {
      label: "Evento",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    [LeadSource.Other]: {
      label: "Otro",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
  };

  const { label, className } = config[source];

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  );
}
