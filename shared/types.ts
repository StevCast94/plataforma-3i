// Tipos TypeScript compartidos entre frontend y backend.

export type ProductType =
  | 'TRAVEL_MEMBERSHIP'
  | 'FRACTIONAL_PROPERTY'
  | 'TRADITIONAL_PROPERTY'
  | 'LAND';

export interface SiteContent {
  id: string;
  section: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface ProjectFeatures {
  tipo?: string;
  unidades?: number;
  bedrooms?: number;
  bathrooms?: number;
  m2?: number;
  amenities?: string[];
  [key: string]: unknown;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  description: string;
  location?: string | null;
  coverImage?: string | null;
  images: string[];
  features?: ProjectFeatures | null;
  priceFrom?: number | null;
  priceLabel?: string | null;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
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
  project?: Project | null;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmissionInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: 'landing' | 'tienda' | 'referencia' | string;
  referralCode?: string;
}

export interface ProductInquiryInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  referralCode?: string;
}

// Mapa section -> { key: value } usado por el frontend para el contenido dinámico.
export type SiteContentMap = Record<string, Record<string, string>>;

// ============================================================
// FASE 2 — Programa de referidos
// ============================================================

export type MemberStatus = 'PREMIERE' | 'ELITE' | 'SUSPENDED';
export type EliteBy = 'PURCHASE' | 'REFERRALS';
export type CommissionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'LIQUIDATED'
  | 'PAID'
  | 'REVERSED';

export interface ReferralMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  docType: string;
  docId: string;
  status: MemberStatus;
  referralCode: string;
  referrerId?: string | null;
  walletBalance: number;
  totalEarned: number;
  totalReferrals: number;
  lastReferralAt?: string | null;
  inactiveSince?: string | null;
  eliteSince?: string | null;
  eliteBy?: EliteBy | null;
  referralsCountToElite: number;
  membershipAwarded: boolean;
  payoutMethod?: string | null;
  payoutEmail?: string | null;
  bankInfo?: Record<string, unknown> | null;
  kycVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  member: ReferralMember;
}

export interface ReferredSummary {
  id: string;
  fullName: string;
  email: string;
  status: MemberStatus;
  createdAt: string;
}

export interface ReferralRow {
  id: string;
  level: number;
  status: string;
  attributionMethod: string;
  registeredAt: string;
  firstPurchaseAt?: string | null;
  referred: ReferredSummary;
  commissionsGenerated: number;
}

export interface TreeNode {
  referralId: string;
  member: ReferredSummary;
  registeredAt: string;
  firstPurchaseAt?: string | null;
  children?: Omit<TreeNode, 'children'>[];
}

export interface ReferralTreeResponse {
  level1: TreeNode[];
  stats: { level1Count: number; level2Count: number; total: number };
}

export interface Commission {
  id: string;
  amount: number;
  rate: number;
  type: 'percentage' | 'fixed';
  status: CommissionStatus;
  holdUntil?: string | null;
  paidAt?: string | null;
  createdAt: string;
  product?: { name: string; type: ProductType } | null;
  referral?: { level: number; referred: { fullName: string } } | null;
}

export interface CommissionSummary {
  totalEarned: number;
  available: number;
  pending: number;
  liquidated: number;
  paid: number;
  thisMonth: number;
}

export interface Payout {
  id: string;
  amount: number;
  method: string;
  reference?: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
