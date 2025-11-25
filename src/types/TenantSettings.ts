export interface TenantSettings {
  id?: number;
  tenantId?: string;
  currencyCode: string;
  logoUrl?: string;
  taxName?: string;
  taxRate: number;
  timezone?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isSetupComplete?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}
