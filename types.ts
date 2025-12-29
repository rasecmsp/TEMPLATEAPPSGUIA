export interface Review {
  id: number;
  author: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Business {
  id: number | string;
  name: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  tripadvisor?: string;
  website?: string;
  logo?: string;
  images: string[];
  reviews: Review[];
  organization_id?: string;
}

export interface AdminBusiness {
  id: string | number;
  name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  tripadvisor?: string;
  website?: string;
  logo?: string;
  created_at?: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  location_id?: string | null;
  plan?: string | null;
  organization_id?: string;
}

export interface CarouselItemDB {
  id: string | number;
  image_url: string;
  is_ad: boolean;
  cta_text: string | null;
  cta_url: string | null;
  sort_order: number;
  active: boolean;
  created_at?: string;
  organization_id?: string;
}

export interface CategoryDB {
  id: string;
  name: string;
  sort_order?: number | null;
  hidden?: boolean | null;
  organization_id?: string;
}

export interface SubcategoryDB {
  id: string;
  name: string;
  category_id: string;
  sort_order?: number | null;
  hidden?: boolean | null;
  organization_id?: string;
}

export interface LocationDB {
  id: string;
  name: string;
  sort_order?: number | null;
  hidden?: boolean | null;
  organization_id?: string;
}

export interface EventDB {
  id: string | number;
  title: string;
  date: string; // ISO date
  time?: string | null;
  location_id?: string | null;
  local_text?: string | null;
  description?: string | null;
  banner_url?: string | null;
  link?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  visible: boolean;
  is_pinned?: boolean | null;
  sort_order?: number | null;
  created_at?: string;
  organization_id?: string;
}

export interface PlanDB {
  id: string | number;
  name: string;
  slug: string;
  months: number;
  price?: number | null;
  active: boolean;
  sort_order?: number | null;
  description?: string | null;
  organization_id?: string;
}

export interface GuideSettings {
  id?: string | boolean;
  app_name: string;
  whatsapp: string;
  favicon_url: string;
  splash_url: string;
  app_icon_url: string;
  slug?: string; // For SaaS subdomain/path
  organization_id?: string;
}
