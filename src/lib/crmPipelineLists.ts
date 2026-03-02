import { LeadStatus, type LeadStatus as LeadStatusType } from "@/api/leadsApi";

export interface PipelineListConfig {
  status: LeadStatusType;
  label: string;
  order: number;
  visible: boolean;
}

const STORAGE_KEY = "salesnet.crm.pipeline.lists";

const DEFAULT_PIPELINE_LISTS: PipelineListConfig[] = [
  { status: LeadStatus.New, label: "Nuevo", order: 0, visible: true },
  {
    status: LeadStatus.Contacted,
    label: "Contactado",
    order: 1,
    visible: true,
  },
  {
    status: LeadStatus.Qualified,
    label: "Calificado",
    order: 2,
    visible: true,
  },
  { status: LeadStatus.Proposal, label: "Propuesta", order: 3, visible: true },
  {
    status: LeadStatus.Negotiation,
    label: "Negociación",
    order: 4,
    visible: true,
  },
  { status: LeadStatus.Won, label: "Ganado", order: 5, visible: true },
  { status: LeadStatus.Lost, label: "Perdido", order: 6, visible: true },
];

export function getDefaultPipelineListConfigs(): PipelineListConfig[] {
  return DEFAULT_PIPELINE_LISTS.map((item) => ({ ...item }));
}

function normalizePipelineListConfigs(
  value: unknown,
): PipelineListConfig[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const byStatus = new Map<LeadStatusType, PipelineListConfig>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Partial<PipelineListConfig>;
    const status = candidate.status;
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : "";
    const order =
      typeof candidate.order === "number" && Number.isFinite(candidate.order)
        ? candidate.order
        : Number.MAX_SAFE_INTEGER;
    const visible =
      typeof candidate.visible === "boolean" ? candidate.visible : true;

    if (typeof status !== "number") {
      continue;
    }

    const fallback = DEFAULT_PIPELINE_LISTS.find(
      (entry) => entry.status === status,
    );
    if (!fallback) {
      continue;
    }

    byStatus.set(status, {
      status,
      label: label || fallback.label,
      order,
      visible,
    });
  }

  const merged = DEFAULT_PIPELINE_LISTS.map((fallback) => {
    const stored = byStatus.get(fallback.status);
    return stored ?? { ...fallback };
  });

  return merged
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index, visible: item.visible }));
}

export function loadPipelineListConfigs(): PipelineListConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultPipelineListConfigs();
    }

    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizePipelineListConfigs(parsed);
    return normalized ?? getDefaultPipelineListConfigs();
  } catch {
    return getDefaultPipelineListConfigs();
  }
}

export function savePipelineListConfigs(configs: PipelineListConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getPipelineLabelMap(
  configs: PipelineListConfig[],
): Record<LeadStatusType, string> {
  const defaultMap = getDefaultPipelineListConfigs().reduce(
    (acc, item) => ({
      ...acc,
      [item.status]: item.label,
    }),
    {} as Record<LeadStatusType, string>,
  );

  for (const config of configs) {
    defaultMap[config.status] = config.label;
  }

  return defaultMap;
}
