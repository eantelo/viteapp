import type { ReactNode } from "react";

export interface TenantMetadata {
  name: string;
  code?: string;
  logoUrl?: string;
  statusLabel?: string;
}

export interface UserMetadata {
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  badge?: string;
  icon?: ReactNode;
  children?: SidebarNavItem[];
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarNavItem[];
}
