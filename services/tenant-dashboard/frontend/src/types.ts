// Mirrors the Tenant Dashboard backend's per-tenant schema
// (services/tenant-dashboard/backend/prisma/tenant/schema.prisma).

export type TenantCategory =
  | 'TILES_CERAMICS'
  | 'PAINT_COATINGS'
  | 'SANITARY_WARE'
  | 'ELECTRICAL_FIXTURES'
  | 'HARDWARE'
  | 'CARPENTRY_WOOD';

export const ALL_TENANT_CATEGORIES: TenantCategory[] = [
  'TILES_CERAMICS',
  'PAINT_COATINGS',
  'SANITARY_WARE',
  'ELECTRICAL_FIXTURES',
  'HARDWARE',
  'CARPENTRY_WOOD',
];

export interface Profile {
  id: string;
  tenantId: string;
  name: string;
  contactName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  categories: TenantCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantSession {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  tenant: TenantSession;
}
