import { 
  UtensilsCrossed, 
  Store, 
  Building2, 
  Gift, 
  Shirt, 
  Palette 
} from 'lucide-react';

// Recommendation-related types and interfaces

export const RecommendationCategory = {
  STREET_FOOD: 'street_food',
  SHOPS: 'shops',
  MARKETS: 'markets',
  SOUVENIRS: 'souvenirs',
  CLOTHING: 'clothing',
  CRAFTS: 'crafts'
} as const;

export type RecommendationCategory = typeof RecommendationCategory[keyof typeof RecommendationCategory];

export interface RecommendationItem {
  id: string;
  name: string;
  category: RecommendationCategory;
  description: string;
  location: string;
  cultural_insight: string;
  image_url?: string;
  rating?: number;
  tags: string[];
  price_range?: string;
  opening_hours?: string;
  contact_info?: string;
}

export interface RecommendationSearchParams {
  category?: RecommendationCategory | 'all';
  query?: string;
  location?: string;
  limit?: number;
}

export interface RecommendationResponse {
  items: RecommendationItem[];
  total: number;
  category: string;
}

export const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  [RecommendationCategory.STREET_FOOD]: 'Street Food',
  [RecommendationCategory.SHOPS]: 'Shops',
  [RecommendationCategory.MARKETS]: 'Markets',
  [RecommendationCategory.SOUVENIRS]: 'Souvenirs',
  [RecommendationCategory.CLOTHING]: 'Clothing',
  [RecommendationCategory.CRAFTS]: 'Local Crafts'
};

export const CATEGORY_ICONS: Record<RecommendationCategory, React.ComponentType<any>> = {
  [RecommendationCategory.STREET_FOOD]: UtensilsCrossed,
  [RecommendationCategory.SHOPS]: Store,
  [RecommendationCategory.MARKETS]: Building2,
  [RecommendationCategory.SOUVENIRS]: Gift,
  [RecommendationCategory.CLOTHING]: Shirt,
  [RecommendationCategory.CRAFTS]: Palette
};