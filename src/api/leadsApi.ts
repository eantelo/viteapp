import { apiClient } from "./apiClient";

export interface LeadDto {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  productInterestId?: string | null;
  productInterestName?: string | null;
  status: LeadStatus;
  source?: LeadSource | null;
  estimatedValue?: number | null;
  position: number;
  customerId?: string | null;
  assignedToUserId?: string | null;
  assignedToUserEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export enum LeadStatus {
  New = 0,
  Contacted = 1,
  Qualified = 2,
  Proposal = 3,
  Negotiation = 4,
  Won = 5,
  Lost = 6,
}

export enum LeadSource {
  Website = 0,
  Referral = 1,
  SocialMedia = 2,
  Advertisement = 3,
  ColdCall = 4,
  Event = 5,
  Other = 6,
}

export interface LeadCreateDto {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  productInterestId?: string | null;
  source?: LeadSource | null;
  estimatedValue?: number | null;
  notes?: string | null;
  assignedToUserId?: string | null;
}

export interface LeadUpdateDto extends LeadCreateDto {}

export interface LeadStatusUpdateDto {
  status: LeadStatus;
  position: number;
  convertToCustomer?: boolean;
}

function coerceLeadStatus(value: unknown): LeadStatus {
  if (typeof value === "number") {
    return value as LeadStatus;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric as LeadStatus;
    }

    const normalized = value.trim().toLowerCase();
    const map: Record<string, LeadStatus> = {
      new: LeadStatus.New,
      contacted: LeadStatus.Contacted,
      qualified: LeadStatus.Qualified,
      proposal: LeadStatus.Proposal,
      negotiation: LeadStatus.Negotiation,
      won: LeadStatus.Won,
      lost: LeadStatus.Lost,
    };

    if (normalized in map) {
      return map[normalized];
    }
  }

  return LeadStatus.New;
}

function coerceLeadSource(value: unknown): LeadSource | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value as LeadSource;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric as LeadSource;
    }

    const normalized = value.trim().toLowerCase();
    const map: Record<string, LeadSource> = {
      website: LeadSource.Website,
      referral: LeadSource.Referral,
      socialmedia: LeadSource.SocialMedia,
      advertisement: LeadSource.Advertisement,
      coldcall: LeadSource.ColdCall,
      event: LeadSource.Event,
      other: LeadSource.Other,
    };

    if (normalized in map) {
      return map[normalized];
    }
  }

  return null;
}

function normalizeLead(lead: LeadDto): LeadDto {
  return {
    ...lead,
    status: coerceLeadStatus(lead.status),
    source: coerceLeadSource(lead.source),
  };
}

export async function getLeads(): Promise<LeadDto[]> {
  const leads = await apiClient<LeadDto[]>("/api/leads");
  return leads.map(normalizeLead);
}

export async function getLeadById(id: string): Promise<LeadDto> {
  const lead = await apiClient<LeadDto>(`/api/leads/${id}`);
  return normalizeLead(lead);
}

export async function createLead(dto: LeadCreateDto): Promise<LeadDto> {
  const lead = await apiClient<LeadDto>("/api/leads", {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return normalizeLead(lead);
}

export async function updateLead(
  id: string,
  dto: LeadUpdateDto
): Promise<void> {
  return apiClient<void>(`/api/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteLead(id: string): Promise<void> {
  return apiClient<void>(`/api/leads/${id}`, {
    method: "DELETE",
  });
}

export async function updateLeadStatus(
  id: string,
  dto: LeadStatusUpdateDto
): Promise<LeadDto> {
  const lead = await apiClient<LeadDto>(`/api/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
  return normalizeLead(lead);
}
