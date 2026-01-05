// Collectible Valuation System Types

export type CollectibleCategory = 'coin' | 'currency' | 'pokemon' | 'sports-card' | 'memorabilia' | 'other';

// ============================================
// IDENTIFICATION
// ============================================

export interface ItemIdentification {
  category: CollectibleCategory;
  name: string;
  year?: number;
  description: string;

  // Card-specific
  set?: string;
  cardNumber?: string;
  player?: string;           // Sports cards
  manufacturer?: string;     // Topps, Panini, WOTC

  // Coin/Currency-specific
  mint?: string;             // P, D, S, W
  denomination?: string;     // $1, 25 cents

  // Common
  variant?: string;          // 1st Edition, Holo, Proof, Error
  certNumber?: string;       // PSA, BGS, PCGS, NGC cert number
  certService?: string;      // PSA, BGS, PCGS, NGC
}

export interface GradeEstimate {
  estimate: string;          // "PSA 8", "MS-65", "VF-30"
  numericGrade?: number;     // 8, 65, 30
  confidence: number;        // 0-1
  notes: string;

  details?: {
    // Cards
    centering?: string;
    corners?: string;
    edges?: string;
    surface?: string;

    // Coins
    luster?: string;
    strike?: string;
    contactMarks?: string;
    eyeAppeal?: string;
  };
}

// ============================================
// PRICING & COMPS
// ============================================

export interface EbaySoldItem {
  ebayItemId: string;
  title: string;
  soldPrice: number;
  soldDate: string;          // ISO date
  condition: string;
  imageUrl: string;
  listingUrl: string;
  shippingPrice?: number;
}

export interface PriceStatistics {
  average: number;
  median: number;
  low: number;
  high: number;
  sampleSize: number;
  standardDeviation?: number;
}

export interface PriceGuideValue {
  source: string;            // 'PCGS', 'Beckett', 'TCGPlayer'
  value: number;
  grade?: string;
  lastUpdated: string;
}

export interface Valuation {
  estimatedValue: number;    // Our best estimate
  confidence: number;        // 0-1

  // Sources
  ebayAverage?: number;
  ebayMedian?: number;
  ebayLow?: number;
  ebayHigh?: number;
  priceGuideValue?: number;
  priceGuideSources?: PriceGuideValue[];

  lastUpdated: string;
}

// ============================================
// PRICE HISTORY
// ============================================

export interface PriceDataPoint {
  date: string;              // "2024-01" or "2024-01-15"
  avgPrice: number;
  lowPrice: number;
  highPrice: number;
  numSales: number;
  volume?: number;           // Total dollar volume
}

export interface PriceHistory {
  item: {
    name: string;
    category: CollectibleCategory;
    grade?: string;
  };

  period: {
    start: string;
    end: string;
  };

  dataPoints: PriceDataPoint[];

  trends: {
    monthOverMonth: number;  // % change
    yearOverYear: number;    // % change
    allTimeHigh: number;
    allTimeLow: number;
    volatility: 'low' | 'medium' | 'high';
  };
}

// ============================================
// SCAN RESULT (Complete Response)
// ============================================

export interface ScanResult {
  // What is it?
  identification: ItemIdentification;

  // What condition?
  grade: GradeEstimate;

  // What's it worth?
  valuation: Valuation;

  // Recent sales
  comps: EbaySoldItem[];
  compsStats: PriceStatistics;

  // Price over time
  priceHistory: PriceDataPoint[];

  // Fun description
  blurb: string;

  // Search terms used
  searchTerms: string[];

  // Metadata
  scannedAt: string;
  processingTimeMs: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ScanRequest {
  image: string;             // Base64 or URL
  categoryHint?: CollectibleCategory;
}

export interface CompsRequest {
  query: string;
  category?: CollectibleCategory;
  days?: number;             // Default 90
  limit?: number;            // Default 20
  minPrice?: number;
  maxPrice?: number;
  gradeFilter?: string;      // "PSA 10", "MS-65"
}

export interface CompsResponse {
  query: string;
  totalResults: number;
  comps: EbaySoldItem[];
  statistics: PriceStatistics;
}

export interface PriceHistoryRequest {
  itemId?: string;           // Price guide item ID
  query?: string;            // Or search term
  category?: CollectibleCategory;
  grade?: string;
  months?: number;           // Default 12
}

export interface PriceGuideRequest {
  category: CollectibleCategory;
  name?: string;
  year?: number;
  set?: string;
  cardNumber?: string;
  mint?: string;
}

export interface PriceGuideItem {
  id: string;
  category: CollectibleCategory;
  name: string;
  year?: number;
  set?: string;
  cardNumber?: string;
  mint?: string;
  variant?: string;

  pricing: {
    raw?: number;
    lowGrade?: number;       // PSA 1-4, AG-VG
    midGrade?: number;       // PSA 5-7, F-VF
    highGrade?: number;      // PSA 8-9, EF-AU
    gem?: number;            // PSA 10, MS-65+

    // Grade-specific (for detailed lookups)
    byGrade?: Record<string, number>;
  };

  rarity?: string;
  population?: number;
  mintage?: number;

  description: string;
  funFacts?: string[];
  imageUrl?: string;

  lastUpdated: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface PriceChartProps {
  data: PriceDataPoint[];
  title?: string;
  showVolume?: boolean;
  height?: number;
}

export interface CompsListProps {
  comps: EbaySoldItem[];
  statistics: PriceStatistics;
  maxItems?: number;
}

export interface ItemBlurbProps {
  blurb: string;
  identification: ItemIdentification;
}

export interface ValuationCardProps {
  valuation: Valuation;
  grade?: GradeEstimate;
}
