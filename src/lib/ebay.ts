// eBay Browse API Service for Sold Listings

import type { EbaySoldItem, PriceStatistics, CollectibleCategory } from '@/types/valuation';

// eBay category IDs
const EBAY_CATEGORY_MAP: Record<CollectibleCategory, string> = {
  'coin': '253',           // Coins & Paper Money
  'currency': '3412',      // Paper Money: US
  'pokemon': '183454',     // Pokémon TCG
  'sports-card': '212',    // Sports Trading Cards
  'memorabilia': '60',     // Sports Mem, Cards & Fan Shop
  'other': '1'             // Collectibles
};

interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbaySearchOptions {
  category?: CollectibleCategory;
  days?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  gradeFilter?: string;
}

class EbayService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private get clientId(): string {
    return process.env.EBAY_CLIENT_ID || '';
  }

  private get clientSecret(): string {
    return process.env.EBAY_CLIENT_SECRET || '';
  }

  private get isProduction(): boolean {
    return process.env.EBAY_ENVIRONMENT === 'PRODUCTION';
  }

  private get baseUrl(): string {
    return this.isProduction
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com';
  }

  /**
   * Get OAuth access token (cached)
   */
  async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      throw new Error(`eBay auth failed: ${response.status}`);
    }

    const data: EbayTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000); // 1 min buffer

    return this.accessToken;
  }

  /**
   * Search for recently sold/completed listings
   */
  async getSoldListings(
    query: string,
    options: EbaySearchOptions = {}
  ): Promise<EbaySoldItem[]> {
    const token = await this.authenticate();

    const {
      category,
      days = 90,
      limit = 50,
      minPrice,
      maxPrice,
      gradeFilter
    } = options;

    // Build search query with grade filter if specified
    let searchQuery = query;
    if (gradeFilter) {
      searchQuery = `${query} ${gradeFilter}`;
    }

    // Calculate date filter
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build filter string
    const filters: string[] = [];
    filters.push(`buyingOptions:{FIXED_PRICE|AUCTION}`);

    if (minPrice) filters.push(`price:[${minPrice}..${maxPrice || '*'}]`);
    else if (maxPrice) filters.push(`price:[*..${maxPrice}]`);

    const params = new URLSearchParams({
      q: searchQuery,
      filter: filters.join(','),
      sort: '-endDate',
      limit: Math.min(limit, 200).toString()
    });

    // Add category if specified
    if (category && EBAY_CATEGORY_MAP[category]) {
      params.append('category_ids', EBAY_CATEGORY_MAP[category]);
    }

    // Use Marketplace Insights API for sold data (requires special access)
    // Fallback: Use Browse API completed items
    const response = await fetch(
      `${this.baseUrl}/buy/marketplace_insights/v1_beta/item_sales/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // Fallback to Browse API if Insights API not available
      return this.getSoldListingsFallback(searchQuery, options);
    }

    const data = await response.json();

    return (data.itemSales || []).map((item: any) => ({
      ebayItemId: item.itemId,
      title: item.title,
      soldPrice: parseFloat(item.lastSoldPrice?.value || '0'),
      soldDate: item.lastSoldDate,
      condition: item.conditionId || 'Unknown',
      imageUrl: item.image?.imageUrl || '',
      listingUrl: item.itemAffiliateWebUrl || item.itemWebUrl || '',
      shippingPrice: parseFloat(item.shippingCost?.value || '0')
    }));
  }

  /**
   * Fallback: Use completed listings from Browse API
   * Note: This searches active listings, not sold - for demo purposes
   */
  private async getSoldListingsFallback(
    query: string,
    options: EbaySearchOptions
  ): Promise<EbaySoldItem[]> {
    const token = await this.authenticate();
    const { category, limit = 50 } = options;

    const params = new URLSearchParams({
      q: query,
      sort: 'price',
      limit: Math.min(limit, 200).toString()
    });

    if (category && EBAY_CATEGORY_MAP[category]) {
      params.append('category_ids', EBAY_CATEGORY_MAP[category]);
    }

    const response = await fetch(
      `${this.baseUrl}/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      }
    );

    if (!response.ok) {
      console.error('eBay Browse API error:', response.status);
      return [];
    }

    const data = await response.json();

    return (data.itemSummaries || []).map((item: any) => ({
      ebayItemId: item.itemId,
      title: item.title,
      soldPrice: parseFloat(item.price?.value || '0'),
      soldDate: new Date().toISOString(), // Approximate for active listings
      condition: item.condition || 'Unknown',
      imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
      listingUrl: item.itemWebUrl || '',
      shippingPrice: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || '0')
    }));
  }

  /**
   * Calculate statistics from sold listings
   */
  calculateStatistics(items: EbaySoldItem[]): PriceStatistics {
    if (items.length === 0) {
      return {
        average: 0,
        median: 0,
        low: 0,
        high: 0,
        sampleSize: 0
      };
    }

    const prices = items
      .map(i => i.soldPrice)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        average: 0,
        median: 0,
        low: 0,
        high: 0,
        sampleSize: 0
      };
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;

    // Calculate standard deviation
    const squaredDiffs = prices.map(p => Math.pow(p - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      average: Math.round(avg * 100) / 100,
      median: prices[Math.floor(prices.length / 2)],
      low: prices[0],
      high: prices[prices.length - 1],
      sampleSize: prices.length,
      standardDeviation: Math.round(stdDev * 100) / 100
    };
  }

  /**
   * Build optimal search query for a collectible
   */
  buildSearchQuery(identification: {
    name: string;
    year?: number;
    set?: string;
    variant?: string;
    grade?: string;
    cardNumber?: string;
    mint?: string;
  }): string {
    const parts: string[] = [];

    // Add year for coins/currency
    if (identification.year) {
      parts.push(identification.year.toString());
    }

    // Main name
    parts.push(identification.name);

    // Set name for cards
    if (identification.set) {
      parts.push(identification.set);
    }

    // Card number
    if (identification.cardNumber) {
      parts.push(`#${identification.cardNumber}`);
    }

    // Mint mark for coins
    if (identification.mint) {
      parts.push(identification.mint);
    }

    // Variant (1st edition, holo, proof)
    if (identification.variant) {
      parts.push(identification.variant);
    }

    // Grade if specified
    if (identification.grade) {
      parts.push(identification.grade);
    }

    return parts.join(' ');
  }
}

// Singleton instance
export const ebayService = new EbayService();

/**
 * Mock data for development/demo when eBay API not configured
 */
export function getMockComps(query: string, category?: CollectibleCategory): EbaySoldItem[] {
  const basePrice = category === 'pokemon' ? 150 :
                    category === 'sports-card' ? 75 :
                    category === 'coin' ? 50 : 100;

  const variance = () => Math.random() * 0.4 - 0.2; // ±20%

  return Array.from({ length: 15 }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 90);
    const price = Math.round(basePrice * (1 + variance()) * (1 + Math.random()));

    return {
      ebayItemId: `mock-${Date.now()}-${i}`,
      title: `${query} - Listing ${i + 1}`,
      soldPrice: price,
      soldDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      condition: ['PSA 10', 'PSA 9', 'PSA 8', 'Raw', 'BGS 9.5'][Math.floor(Math.random() * 5)],
      imageUrl: 'https://via.placeholder.com/150',
      listingUrl: '#',
      shippingPrice: 0
    };
  }).sort((a, b) => new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime());
}

export function getMockPriceHistory(months: number = 12): { date: string; avgPrice: number; lowPrice: number; highPrice: number; numSales: number }[] {
  const now = new Date();
  const basePrice = 100 + Math.random() * 200;

  return Array.from({ length: months }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (months - 1 - i));

    const trend = 1 + (i / months) * 0.15; // 15% upward trend
    const variance = 0.9 + Math.random() * 0.2;
    const avg = Math.round(basePrice * trend * variance);

    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      avgPrice: avg,
      lowPrice: Math.round(avg * 0.7),
      highPrice: Math.round(avg * 1.4),
      numSales: Math.floor(5 + Math.random() * 20)
    };
  });
}
