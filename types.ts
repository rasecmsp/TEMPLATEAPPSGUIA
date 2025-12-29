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
}
