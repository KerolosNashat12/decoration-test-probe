// Mirrors the Super Admin backend's Prisma enums/models (prisma/schema.prisma).
// Keep in sync manually for now — worth generating from an OpenAPI spec later.

export type TenantCategory =
  | 'TILES_CERAMICS'
  | 'PAINT_COATINGS'
  | 'SANITARY_WARE'
  | 'ELECTRICAL_FIXTURES'
  | 'HARDWARE'
  | 'CARPENTRY_WOOD';

export const TENANT_CATEGORY_LABELS: Record<TenantCategory, string> = {
  TILES_CERAMICS: 'Tiles & Ceramics',
  PAINT_COATINGS: 'Paint & Coatings',
  SANITARY_WARE: 'Sanitary Ware',
  ELECTRICAL_FIXTURES: 'Electrical Fixtures',
  HARDWARE: 'Hardware',
  CARPENTRY_WOOD: 'Carpentry & Wood',
};

export type TenantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Tenant {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  categories: TenantCategory[];
  status: TenantStatus;
  notes: string | null;
  dashboardUserEmail: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

export interface ProvisioningResult {
  email: string;
  temporaryPassword: string;
}

export interface TenantApplication {
  id: string;
  shopName: string;
  contactName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  categories: TenantCategory[];
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tenantId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'REVIEWER';
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface DashboardStats {
  totalTenants: number;
  approvedTenants: number;
  suspendedTenants: number;
  pendingApplications: number;
  approvedThisMonth: number;
  rejectedApplications: number;
  categoryCounts: Partial<Record<TenantCategory, number>>;
  recentApplications: TenantApplication[];
}
