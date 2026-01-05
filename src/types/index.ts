export type CollectibleCategory = 'coin' | 'currency' | 'sports-card' | 'pokemon' | 'other';

export interface Identification {
  category: CollectibleCategory;
  name: string;
  year?: number;
  description: string;
  mint?: string;
  denomination?: string;
  player?: string;
  set?: string;
  manufacturer?: string;
  certNumber?: string;
}

export interface GradeEstimate {
  estimate: string;
  confidence: number;
  notes: string;
}

export interface PricingSource {
  source: string;
  prices: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface Pricing {
  ebayAvg: number;
  ebayLow: number;
  ebayHigh: number;
  redbook?: number;
  greysheet?: number;
  buyNow?: number;
  buyNowUrl?: string;
  sources?: PricingSource[];
}

export interface AnalyzeRequest {
  images: string[];
  category?: CollectibleCategory | 'auto';
}

export interface AnalyzeResponse {
  identification: Identification;
  grade: GradeEstimate;
  searchTerms: string[];
  pricing: Pricing;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: CollectibleCategory;
  grade?: string;
  image: string;
  images?: string[];
  description?: string;
  year?: number;
  mint?: string;
  certNumber?: string;
  inStock: boolean;
  createdAt: string;
}

export interface QuoteRequest {
  images: string[];
}

export interface QuoteResponse {
  offer: number;
  confidence: 'high' | 'medium' | 'low';
  expires: string;
  breakdown: {
    marketValue: number;
    buyRate: number;
  };
}

// Platform.gold scraper types
export interface PlatformGoldItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  url: string;
  inStock: boolean;
  category?: string;
  grade?: string;
  certNumber?: string;
  scrapedAt: string;
}

export interface PlatformGoldScrapeResult {
  items: PlatformGoldItem[];
  totalItems: number;
  scrapedAt: string;
  source: 'platform.gold';
}
