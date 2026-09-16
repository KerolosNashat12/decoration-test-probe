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

// Mirrors services/tenant-dashboard/backend/prisma/tenant/schema.prisma.
// Decimal fields (price) serialize to plain strings over JSON.

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: TenantCategory;
  price: string;
  unit: string;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RfqStatus = 'NEW' | 'RESPONDED' | 'DECLINED' | 'EXPIRED';

export interface RfqResponse {
  id: string;
  rfqId: string;
  productId: string | null;
  product?: Product | null;
  price: string;
  priceUnit: string;
  availabilityNote: string | null;
  message: string | null;
  respondedAt: string;
}

export interface Rfq {
  id: string;
  buyerName: string;
  buyerPhone: string;
  category: TenantCategory;
  description: string;
  quantity: string | null;
  deadlineAt: string | null;
  status: RfqStatus;
  isTest: boolean;
  declineReason: string | null;
  declinedAt: string | null;
  createdAt: string;
  response?: RfqResponse | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  totalProducts: number;
  activeProducts: number;
  newRfqs: number;
  respondedThisMonth: number;
  recentRfqs: Rfq[];
}
