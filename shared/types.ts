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
  showBrochure: boolean;
  mapLat?: number | null;
  mapLng?: number | null;
  brochureContent?: Record<string, unknown> | null;
  products?: Product[];
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
  commissionType?: 'percentage' | 'fixed';
  commissionFixedPremiere?: number | null;
  commissionFixedElite?: number | null;
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
  /** Slug legible para compartir (ej. "juan-perez-k3f9"); usarlo en enlaces públicos, nunca el código. */
  referralSlug: string;
  referrerId?: string | null;
  /** Referidor real del socio: manda sobre cualquier cookie ?ref= en sus compras. */
  referrer?: { fullName: string; referralCode: string } | null;
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
  // Perfil social (Fase 4)
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  interests?: string[];
  createdAt: string;
  // Fase 5 — acceso al Club de Viajes (membresía activa). Lo calcula /me y login.
  travelAccess?: boolean;
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
  level: number;
  holdUntil?: string | null;
  paidAt?: string | null;
  createdAt: string;
  product?: { name: string; type: ProductType } | null;
  referral?: { level: number; referred: { fullName: string } } | null;
  purchase?: { customerName: string } | null;
}

export interface CommissionSummary {
  totalEarned: number;
  available: number;
  pending: number;
  liquidated: number;
  paid: number;
  thisMonth: number;
  monthlyLimit?: number | null;
  monthlyRemaining?: number | null;
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

// ============================================================
// FASE 3 — Admin / checkout
// ============================================================

export type PurchaseStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Purchase {
  id: string;
  productId: string;
  product?: { name: string } | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  amount: number;
  status: PurchaseStatus;
  referralCode?: string | null;
  referrerId?: string | null;
  referrer?: { fullName: string; referralCode: string } | null;
  notes?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

// ============================================================
// FASE 4 — Red social
// ============================================================

export interface SocialAuthor {
  id: string;
  fullName: string;
  referralCode: string;
  status: MemberStatus;
  avatarUrl: string | null;
  eliteBy: EliteBy | null;
}

export type ReactionType = 'like' | 'love' | 'useful' | 'interesting' | 'celebrate';

export interface FeedPost {
  id: string;
  content: string;
  images: string[];
  linkUrl?: string | null;
  linkPreview?: { title?: string; description?: string; image?: string } | null;
  groupId?: string | null;
  pinned: boolean;
  createdAt: string;
  author: SocialAuthor | null;
  reactionsByType: Record<string, number>;
  reactionCount: number;
  commentCount: number;
  myReaction: ReactionType | null;
}

export interface FeedResponse {
  posts: FeedPost[];
  page: number;
  hasMore: boolean;
}

export interface SocialComment {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  author: SocialAuthor | null;
  replies?: SocialComment[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  privacy: 'public' | 'private';
  memberCount: number;
  postCount: number;
  isMember: boolean;
  createdBy?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  coverImage?: string | null;
  group?: { name: string; slug: string } | null;
  attendeeCount?: number;
  phase: 'upcoming' | 'ongoing' | 'past';
  myStatus?: 'going' | 'maybe' | 'not_going' | null;
  counts?: { going: number; maybe: number; not_going: number };
  attendees?: SocialAuthor[];
}

export interface CommunityMember {
  fullName: string;
  referralCode: string;
  status: MemberStatus;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  interests: string[];
  eliteBy?: EliteBy | null;
  createdAt: string;
  stats?: { posts: number; groups: number; referrals: number };
}

export interface Conversation {
  user: SocialAuthor | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  mine: boolean;
  createdAt: string;
}

// ============================================================
// FASE 5 — Motor de Viajes (Club de Viajes 3i)
// Todos los precios llegan en CENTAVOS. La tarifa neta NUNCA viaja al frontend.
// ============================================================

export type TravelKind = 'HOTEL' | 'FLIGHT' | 'ACTIVITY' | 'CAR' | 'PACKAGE';

export interface TravelHotelOffer {
  rateKey: string;
  supplier: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  image: string;
  amenities: string[];
  refundable: boolean;
  nights: number;
  currency: string;
  publicCents: number; // precio visitante
  memberCents: number; // precio socio (recuperación de costo)
  priceCents: number; // el que aplica al usuario actual
  isMemberPrice: boolean;
  savingsCents: number; // publicCents - memberCents
}

export interface TravelHotelSearch {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface TravelHotelSearchResponse {
  offers: TravelHotelOffer[];
  isMember: boolean;
  currency: string;
  query: TravelHotelSearch;
}

export interface TravelFlightOffer {
  rateKey: string;
  supplier: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departTime: string;
  arriveTime: string;
  durationMin: number;
  stops: number;
  cabin: string;
  roundTrip: boolean;
  currency: string;
  publicCents: number;
  memberCents: number;
  priceCents: number;
  isMemberPrice: boolean;
  savingsCents: number;
}

export interface TravelFlightSearch {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
}

export interface TravelFlightSearchResponse {
  offers: TravelFlightOffer[];
  isMember: boolean;
  currency: string;
  query: TravelFlightSearch;
}

export type BookingStatus =
  | 'QUOTED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED';

export interface TravelBookingDetails {
  name: string;
  city: string;
  country: string;
  stars: number;
  image: string;
  amenities: string[];
  refundable: boolean;
  nights: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  isMemberPrice: boolean;
  publicCents: number;
  memberCents: number;
}

// Reserva tal como la ve el cliente (SIN tarifa neta ni markup).
export interface TravelBooking {
  id: string;
  kind: TravelKind;
  supplier: string;
  supplierRef?: string | null; // voucher / localizador
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalCents: number;
  currency: string;
  details: TravelBookingDetails;
  paymentRef?: string | null;
  referralCode?: string | null;
  memberId?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  itineraryId?: string | null;
}

export interface TravelPaymentResult {
  paymentRef: string;
  approved: boolean;
  redirectUrl?: string;
}

export interface CreateBookingResponse {
  booking: TravelBooking;
  payment: TravelPaymentResult;
}

export interface TravelGuaranteeClaim {
  id: string;
  bookingId?: string | null;
  memberId?: string | null;
  competitorUrl: string;
  evidenceUrl?: string | null;
  claimedCents: number;
  ourCents: number;
  status: 'open' | 'approved' | 'rejected' | 'paid';
  resolution?: string | null;
  createdAt: string;
}

export type MembershipSource = 'PURCHASE' | 'REWARD' | 'FRACTIONAL' | 'STAFF';

export interface TravelMembershipInfo {
  id: string;
  tier: string;
  source: MembershipSource;
  active: boolean;
  note?: string | null;
  startsAt: string;
  expiresAt?: string | null;
  createdAt: string;
}
