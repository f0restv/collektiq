# TASK: Wire CollektIQ to Platform API

## Objective
Replace CollektIQ's duplicated AI logic with calls to the client-commerce-platform API.

## Current Problems
1. `/api/analyze` duplicates Claude calls (should call platform)
2. Pricing is MOCK DATA (random numbers)
3. Shop page has no real inventory
4. No connection between the apps

## Changes Required

### 1. Environment Setup
**File:** `.env.local`
```env
# Platform API connection
PLATFORM_API_URL=http://localhost:3000
PLATFORM_API_KEY=ck_live_xxxxxxxxxxxxx

# Keep Anthropic key for fallback only
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Replace Analyze Route
**File:** `src/app/api/analyze/route.ts`

DELETE the entire current implementation (163 lines of duplicated logic).

Replace with:
```typescript
import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

export async function POST(request: NextRequest) {
  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json(
      { error: 'Platform not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    
    const response = await fetch(`${PLATFORM_URL}/api/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    
    // Transform to match existing frontend expectations
    return NextResponse.json({
      identification: data.identification,
      grade: data.grade,
      searchTerms: data.searchTerms,
      pricing: {
        ebayAvg: data.pricing.estimated.mid,
        ebayLow: data.pricing.estimated.low,
        ebayHigh: data.pricing.estimated.high,
        // Include source data
        sources: data.pricing.sources,
        greysheet: findSourcePrice(data.pricing.sources, 'Greysheet'),
        redbook: findSourcePrice(data.pricing.sources, 'Redbook'),
        buyNow: calculateBuyNow(data.pricing.estimated),
      },
    });
  } catch (error) {
    console.error('Platform API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze item' },
      { status: 500 }
    );
  }
}

function findSourcePrice(sources: any[], name: string): number | undefined {
  const source = sources.find(s => s.source === name);
  return source?.prices?.raw?.mid;
}

function calculateBuyNow(estimated: { low: number; mid: number; high: number }): number {
  // Buy now = ~80% of mid (margin for platform)
  return Math.round(estimated.mid * 0.8);
}
```

### 3. Add Inventory API Client
**File:** `src/lib/api.ts`

Add to existing file:
```typescript
const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

export async function fetchInventory(options: {
  category?: string;
  query?: string;
  limit?: number;
  cursor?: string;
} = {}): Promise<{ items: Product[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.query) params.set('q', options.query);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);

  const response = await fetch(
    `${PLATFORM_URL}/api/v1/inventory?${params}`,
    {
      headers: { 'x-api-key': API_KEY! },
      next: { revalidate: 60 }, // Cache for 1 minute
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }

  return response.json();
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const response = await fetch(
    `${PLATFORM_URL}/api/v1/inventory/${id}`,
    {
      headers: { 'x-api-key': API_KEY! },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) return null;
  return response.json();
}
```

### 4. Update Shop Page
**File:** `src/app/shop/page.tsx`

Replace mock data with real inventory:
```typescript
import { fetchInventory } from '@/lib/api';

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const { items, nextCursor } = await fetchInventory({
    category: searchParams.category,
    query: searchParams.q,
    limit: 20,
  });

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Shop</h1>
        
        {/* Category filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['All', 'Coins', 'Cards', 'Comics'].map(cat => (
            <Link
              key={cat}
              href={cat === 'All' ? '/shop' : `/shop?category=${cat.toLowerCase()}`}
              className={`px-4 py-2 rounded-full ${
                searchParams.category === cat.toLowerCase()
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-slate-400 text-center py-12">
            No items found. Check back soon!
          </p>
        )}

        {nextCursor && (
          <LoadMoreButton cursor={nextCursor} />
        )}
      </div>
    </main>
  );
}
```

### 5. Update Item Detail Page
**File:** `src/app/item/[id]/page.tsx`

```typescript
import { fetchProduct } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function ItemPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);
  
  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-900 py-8">
      {/* Real product data instead of mock */}
    </main>
  );
}
```

### 6. Types Update
**File:** `src/types/index.ts`

Ensure types match platform response:
```typescript
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: { url: string; alt?: string }[];
  client: {
    name: string;
    slug: string;
  };
  createdAt: string;
}

export interface AnalyzeResponse {
  identification: {
    category: string;
    name: string;
    year?: number;
    mint?: string;
    // etc
  };
  grade: {
    estimate: string;
    confidence: number;
    notes?: string;
  };
  pricing: {
    ebayAvg: number;
    ebayLow: number;
    ebayHigh: number;
    greysheet?: number;
    redbook?: number;
    buyNow: number;
    sources: Array<{
      source: string;
      prices: { low: number; mid: number; high: number };
    }>;
  };
  searchTerms: string[];
}
```

## Success Criteria
- [ ] Scan page returns REAL pricing (not random)
- [ ] Shop page shows REAL inventory from platform
- [ ] Item pages load real product data
- [ ] No duplicate Claude API calls
- [ ] Platform API key is validated

## Testing

### 1. Test locally with both apps running:
```bash
# Terminal 1 - Platform
cd client-commerce-platform
npm run dev  # runs on :3000

# Terminal 2 - CollektIQ
cd collektiq
npm run dev  # runs on :3001
```

### 2. Test scan flow:
1. Go to http://localhost:3001/scan
2. Upload an image
3. Click "Identify & Price"
4. Verify prices are NOT random (check console for platform API call)

### 3. Test shop:
1. Go to http://localhost:3001/shop
2. Should show inventory from platform database
3. Click an item - should load real details

## Cleanup After Migration
- Remove `ANTHROPIC_API_KEY` from CollektIQ (not needed anymore)
- Remove any remaining mock data functions
- Remove duplicate type definitions that now come from platform
