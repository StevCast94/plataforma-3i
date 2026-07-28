// Tipos de respuesta específicos del panel admin (no compartidos con el backend).
import type { ProductType, MemberStatus, CommissionStatus } from '@shared/types';

export interface AdminStats {
  salesMonth: { total: number; count: number };
  commissionsPaidMonth: number;
  activeMembers: { premiere: number; elite: number; total: number };
  alerts: { kycPending: number; disputed: number; pendingPurchases: number };
  months: { label: string; sales: number; members: number }[];
  topProducts: { name: string; count: number; total: number }[];
  recentPurchases: {
    id: string;
    customerName: string;
    amount: number;
    status: string;
    createdAt: string;
    product: { name: string };
  }[];
}

export interface AdminMemberRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  referralCode: string;
  status: MemberStatus;
  kycVerified: boolean;
  totalReferrals: number;
  totalEarned: number;
  createdAt: string;
  referrer?: { fullName: string; referralCode: string } | null;
}

export interface AdminMembersResponse {
  items: AdminMemberRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCommission {
  id: string;
  amount: number;
  rate: number;
  type: 'percentage' | 'fixed';
  status: CommissionStatus;
  level: number;
  createdAt: string;
  member: { fullName: string; email: string };
  product?: { name: string } | null;
  referral?: { referred: { fullName: string } } | null;
  purchase?: { customerName: string } | null;
}

export interface StaffUser {
  id: string;
  username: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  staff?: { username: string } | null;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  price: number;
  promoPrice?: number | null;
  description: string;
  features?: string[] | null;
  images: string[];
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  active: boolean;
  featured: boolean;
  commissionType?: 'percentage' | 'fixed';
  commissionFixedPremiere?: number | null;
  commissionFixedElite?: number | null;
}

export interface AdminProject {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  description: string;
  location?: string | null;
  coverImage?: string | null;
  images: string[];
  features?: Record<string, unknown> | null;
  priceFrom?: number | null;
  priceLabel?: string | null;
  active: boolean;
  featured: boolean;
  showBrochure: boolean;
  mapLat?: number | null;
  mapLng?: number | null;
  brochureContent?: Record<string, unknown> | null;
}
