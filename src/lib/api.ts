// API client for KollektIQ
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  Product,
  QuoteRequest,
  QuoteResponse,
  CollectibleCategory,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || process.env.PLATFORM_API_URL;
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY;

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const api = {
  // Analyze an item from photos
  async analyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(error.error || 'Analysis failed');
    }
    return res.json();
  },

  // Get shop inventory
  async getProducts(options?: {
    category?: CollectibleCategory;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.search) params.set('search', options.search);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const url = `${API_BASE}/api/products${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Get single product
  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  // Submit for consignment
  async submitConsignment(data: {
    images: string[];
    desiredPayout: number;
    contact: { email: string; phone?: string };
  }): Promise<{ submissionId: string }> {
    const res = await fetch(`${API_BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Submission failed');
    return res.json();
  },

  // Get instant quote (for quick cash option)
  async getQuote(req: QuoteRequest): Promise<QuoteResponse> {
    const res = await fetch(`${API_BASE}/api/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Quote failed' }));
      throw new Error(error.error || 'Quote failed');
    }
    return res.json();
  },
};

// Platform API functions (server-side)
export async function fetchInventory(options: {
  category?: string;
  query?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<{ items: Product[]; nextCursor: string | null }> {
  if (!PLATFORM_URL || !PLATFORM_API_KEY) {
    throw new Error('Platform not configured');
  }

  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.query) params.set('q', options.query);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);

  const response = await fetch(
    `${PLATFORM_URL}/api/v1/inventory?${params}`,
    {
      headers: { 'x-api-key': PLATFORM_API_KEY },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }

  return response.json();
}

export async function fetchProduct(id: string): Promise<Product | null> {
  if (!PLATFORM_URL || !PLATFORM_API_KEY) {
    throw new Error('Platform not configured');
  }

  const response = await fetch(
    `${PLATFORM_URL}/api/v1/inventory/${id}`,
    {
      headers: { 'x-api-key': PLATFORM_API_KEY },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) return null;
  return response.json();
}

// Re-export types for convenience
export type {
  AnalyzeRequest,
  AnalyzeResponse,
  Product,
  QuoteRequest,
  QuoteResponse,
  CollectibleCategory,
} from '@/types';
