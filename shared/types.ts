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
}

export interface ProductInquiryInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

// Mapa section -> { key: value } usado por el frontend para el contenido dinámico.
export type SiteContentMap = Record<string, Record<string, string>>;
